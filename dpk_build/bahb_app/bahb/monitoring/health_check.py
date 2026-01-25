"""
Health check HTTP endpoint server for BAHB system.

Provides comprehensive health status including:
- Camera stream connectivity
- Model loading status
- GPU availability and memory
- Disk space for recordings
- System resource usage
"""

import asyncio
import json
import psutil
import socket
import subprocess
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, List, Any
from aiohttp import web
from loguru import logger


@dataclass
class HealthStatus:
    """Overall health status."""
    healthy: bool
    timestamp: str
    uptime_seconds: float
    components: Dict[str, Any]
    warnings: List[str]
    errors: List[str]


@dataclass
class ComponentHealth:
    """Individual component health."""
    name: str
    healthy: bool
    status: str
    details: Dict[str, Any]
    last_check: str


class HealthCheckServer:
    """
    HTTP health check endpoint server.

    Provides health status on port 8081 by default.
    Returns JSON with comprehensive system health information.
    """

    def __init__(
        self,
        port: int = 8081,
        host: str = "0.0.0.0",
        check_interval_seconds: float = 5.0,
    ):
        """
        Initialize health check server.

        Args:
            port: HTTP port to listen on
            host: Host address to bind to
            check_interval_seconds: Background health check interval
        """
        self.port = port
        self.host = host
        self.check_interval = check_interval_seconds

        self._app: Optional[web.Application] = None
        self._runner: Optional[web.AppRunner] = None
        self._site: Optional[web.TCPSite] = None

        self._start_time = datetime.now()
        self._health_status: Optional[HealthStatus] = None
        self._component_checks: Dict[str, ComponentHealth] = {}

        # Component references (set externally)
        self.camera = None
        self.inference_engine = None
        self.deepstream_pipeline = None

        # Configuration
        self.camera_streams: List[str] = []
        self.model_paths: List[Path] = []
        self.recording_path: Optional[Path] = None
        self.min_disk_space_gb: float = 10.0

        # Background task
        self._check_task: Optional[asyncio.Task] = None
        self._running = False

    async def start(self) -> None:
        """Start the health check server."""
        logger.info(f"Starting health check server on {self.host}:{self.port}")

        # Create aiohttp application
        self._app = web.Application()
        self._app.router.add_get("/health", self._health_endpoint)
        self._app.router.add_get("/health/detailed", self._detailed_health_endpoint)
        self._app.router.add_get("/health/components/{component}", self._component_endpoint)
        self._app.router.add_get("/metrics", self._metrics_endpoint)
        self._app.router.add_get("/ready", self._readiness_endpoint)
        self._app.router.add_get("/live", self._liveness_endpoint)

        # Start server
        self._runner = web.AppRunner(self._app)
        await self._runner.setup()
        self._site = web.TCPSite(self._runner, self.host, self.port)
        await self._site.start()

        logger.info(f"Health check server started on http://{self.host}:{self.port}")

        # Start background health checks
        self._running = True
        self._check_task = asyncio.create_task(self._background_check_loop())

    async def stop(self) -> None:
        """Stop the health check server."""
        logger.info("Stopping health check server")
        self._running = False

        if self._check_task:
            self._check_task.cancel()
            try:
                await self._check_task
            except asyncio.CancelledError:
                pass

        if self._site:
            await self._site.stop()

        if self._runner:
            await self._runner.cleanup()

        logger.info("Health check server stopped")

    async def _health_endpoint(self, request: web.Request) -> web.Response:
        """Simple health check endpoint."""
        if not self._health_status:
            await self._perform_health_check()

        status_code = 200 if self._health_status.healthy else 503

        return web.json_response(
            {
                "status": "healthy" if self._health_status.healthy else "unhealthy",
                "timestamp": self._health_status.timestamp,
                "uptime_seconds": self._health_status.uptime_seconds,
            },
            status=status_code
        )

    async def _detailed_health_endpoint(self, request: web.Request) -> web.Response:
        """Detailed health check endpoint."""
        if not self._health_status:
            await self._perform_health_check()

        status_code = 200 if self._health_status.healthy else 503

        return web.json_response(
            asdict(self._health_status),
            status=status_code
        )

    async def _component_endpoint(self, request: web.Request) -> web.Response:
        """Component-specific health endpoint."""
        component = request.match_info['component']

        if component not in self._component_checks:
            return web.json_response(
                {"error": f"Component '{component}' not found"},
                status=404
            )

        check = self._component_checks[component]
        status_code = 200 if check.healthy else 503

        return web.json_response(
            asdict(check),
            status=status_code
        )

    async def _metrics_endpoint(self, request: web.Request) -> web.Response:
        """System metrics endpoint."""
        metrics = await self._collect_system_metrics()

        return web.json_response(metrics)

    async def _readiness_endpoint(self, request: web.Request) -> web.Response:
        """
        Readiness probe endpoint.

        Returns 200 if system is ready to accept traffic.
        """
        ready = await self._check_readiness()

        return web.json_response(
            {"ready": ready, "timestamp": datetime.now().isoformat()},
            status=200 if ready else 503
        )

    async def _liveness_endpoint(self, request: web.Request) -> web.Response:
        """
        Liveness probe endpoint.

        Returns 200 if system is alive (process running).
        """
        return web.json_response(
            {
                "alive": True,
                "timestamp": datetime.now().isoformat(),
                "uptime_seconds": (datetime.now() - self._start_time).total_seconds()
            }
        )

    async def _background_check_loop(self) -> None:
        """Background health check loop."""
        while self._running:
            try:
                await self._perform_health_check()
                await asyncio.sleep(self.check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check error: {e}")
                await asyncio.sleep(self.check_interval)

    async def _perform_health_check(self) -> None:
        """Perform comprehensive health check."""
        warnings: List[str] = []
        errors: List[str] = []
        components: Dict[str, Any] = {}

        # Check camera connectivity
        camera_health = await self._check_camera()
        components["camera"] = asdict(camera_health)
        self._component_checks["camera"] = camera_health
        if not camera_health.healthy:
            errors.append(f"Camera: {camera_health.status}")

        # Check model status
        models_health = await self._check_models()
        components["models"] = asdict(models_health)
        self._component_checks["models"] = models_health
        if not models_health.healthy:
            errors.append(f"Models: {models_health.status}")

        # Check GPU
        gpu_health = await self._check_gpu()
        components["gpu"] = asdict(gpu_health)
        self._component_checks["gpu"] = gpu_health
        if not gpu_health.healthy:
            errors.append(f"GPU: {gpu_health.status}")
        elif "warning" in gpu_health.status.lower():
            warnings.append(f"GPU: {gpu_health.status}")

        # Check disk space
        disk_health = await self._check_disk_space()
        components["disk"] = asdict(disk_health)
        self._component_checks["disk"] = disk_health
        if not disk_health.healthy:
            errors.append(f"Disk: {disk_health.status}")
        elif "warning" in disk_health.status.lower():
            warnings.append(f"Disk: {disk_health.status}")

        # Check inference engine
        engine_health = await self._check_inference_engine()
        components["inference_engine"] = asdict(engine_health)
        self._component_checks["inference_engine"] = engine_health
        if not engine_health.healthy:
            errors.append(f"Inference: {engine_health.status}")

        # Check DeepStream pipeline
        if self.deepstream_pipeline:
            deepstream_health = await self._check_deepstream()
            components["deepstream"] = asdict(deepstream_health)
            self._component_checks["deepstream"] = deepstream_health
            if not deepstream_health.healthy:
                errors.append(f"DeepStream: {deepstream_health.status}")

        # Overall health status
        healthy = len(errors) == 0
        uptime = (datetime.now() - self._start_time).total_seconds()

        self._health_status = HealthStatus(
            healthy=healthy,
            timestamp=datetime.now().isoformat(),
            uptime_seconds=uptime,
            components=components,
            warnings=warnings,
            errors=errors,
        )

    async def _check_camera(self) -> ComponentHealth:
        """Check camera stream connectivity."""
        details = {}
        healthy = True
        status = "OK"

        try:
            if self.camera:
                # Check if camera is connected
                is_connected = getattr(self.camera, 'is_connected', lambda: False)()
                details["connected"] = is_connected

                if not is_connected:
                    healthy = False
                    status = "Camera not connected"
                else:
                    status = "Camera connected"

            elif self.camera_streams:
                # Check RTSP streams
                connected_streams = []
                failed_streams = []

                for stream_url in self.camera_streams:
                    if await self._test_rtsp_stream(stream_url):
                        connected_streams.append(stream_url)
                    else:
                        failed_streams.append(stream_url)

                details["total_streams"] = len(self.camera_streams)
                details["connected_streams"] = len(connected_streams)
                details["failed_streams"] = len(failed_streams)

                if failed_streams:
                    healthy = False
                    status = f"{len(failed_streams)} stream(s) unavailable"
                else:
                    status = f"All {len(connected_streams)} streams connected"
            else:
                status = "No camera configured"
                details["configured"] = False

        except Exception as e:
            healthy = False
            status = f"Camera check error: {str(e)}"
            details["error"] = str(e)

        return ComponentHealth(
            name="camera",
            healthy=healthy,
            status=status,
            details=details,
            last_check=datetime.now().isoformat()
        )

    async def _check_models(self) -> ComponentHealth:
        """Check model loading status."""
        details = {}
        healthy = True
        status = "OK"

        try:
            if self.model_paths:
                loaded_models = []
                missing_models = []

                for model_path in self.model_paths:
                    if model_path.exists():
                        loaded_models.append(str(model_path))
                        details[model_path.name] = "loaded"
                    else:
                        missing_models.append(str(model_path))
                        details[model_path.name] = "missing"

                details["total_models"] = len(self.model_paths)
                details["loaded"] = len(loaded_models)
                details["missing"] = len(missing_models)

                if missing_models:
                    healthy = False
                    status = f"{len(missing_models)} model(s) missing"
                else:
                    status = f"All {len(loaded_models)} models loaded"
            else:
                status = "No models configured"

        except Exception as e:
            healthy = False
            status = f"Model check error: {str(e)}"
            details["error"] = str(e)

        return ComponentHealth(
            name="models",
            healthy=healthy,
            status=status,
            details=details,
            last_check=datetime.now().isoformat()
        )

    async def _check_gpu(self) -> ComponentHealth:
        """Check GPU availability and memory."""
        details = {}
        healthy = True
        status = "OK"

        try:
            import pynvml
            pynvml.nvmlInit()

            device_count = pynvml.nvmlDeviceGetCount()
            details["device_count"] = device_count

            if device_count == 0:
                healthy = False
                status = "No GPU detected"
            else:
                # Check GPU 0
                handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                name = pynvml.nvmlDeviceGetName(handle)
                memory_info = pynvml.nvmlDeviceGetMemoryInfo(handle)

                total_mb = memory_info.total / 1024 / 1024
                used_mb = memory_info.used / 1024 / 1024
                free_mb = memory_info.free / 1024 / 1024
                utilization = (used_mb / total_mb) * 100

                details["name"] = name
                details["total_memory_mb"] = round(total_mb, 2)
                details["used_memory_mb"] = round(used_mb, 2)
                details["free_memory_mb"] = round(free_mb, 2)
                details["utilization_percent"] = round(utilization, 2)

                # Check thresholds
                if free_mb < 1000:  # Less than 1GB free
                    healthy = False
                    status = f"GPU memory critical: {free_mb:.0f}MB free"
                elif free_mb < 2000:  # Less than 2GB free
                    status = f"GPU memory warning: {free_mb:.0f}MB free"
                else:
                    status = f"GPU OK: {free_mb:.0f}MB free ({utilization:.1f}% used)"

            pynvml.nvmlShutdown()

        except ImportError:
            healthy = False
            status = "pynvml not available"
            details["error"] = "pynvml library not installed"
        except Exception as e:
            healthy = False
            status = f"GPU check error: {str(e)}"
            details["error"] = str(e)

        return ComponentHealth(
            name="gpu",
            healthy=healthy,
            status=status,
            details=details,
            last_check=datetime.now().isoformat()
        )

    async def _check_disk_space(self) -> ComponentHealth:
        """Check disk space for recordings."""
        details = {}
        healthy = True
        status = "OK"

        try:
            if self.recording_path:
                disk_usage = psutil.disk_usage(str(self.recording_path))

                total_gb = disk_usage.total / 1024 / 1024 / 1024
                used_gb = disk_usage.used / 1024 / 1024 / 1024
                free_gb = disk_usage.free / 1024 / 1024 / 1024
                percent_used = disk_usage.percent

                details["path"] = str(self.recording_path)
                details["total_gb"] = round(total_gb, 2)
                details["used_gb"] = round(used_gb, 2)
                details["free_gb"] = round(free_gb, 2)
                details["percent_used"] = round(percent_used, 2)

                if free_gb < self.min_disk_space_gb:
                    healthy = False
                    status = f"Disk space critical: {free_gb:.1f}GB free"
                elif free_gb < self.min_disk_space_gb * 2:
                    status = f"Disk space warning: {free_gb:.1f}GB free"
                else:
                    status = f"Disk space OK: {free_gb:.1f}GB free ({percent_used:.1f}% used)"
            else:
                status = "No recording path configured"

        except Exception as e:
            healthy = False
            status = f"Disk check error: {str(e)}"
            details["error"] = str(e)

        return ComponentHealth(
            name="disk",
            healthy=healthy,
            status=status,
            details=details,
            last_check=datetime.now().isoformat()
        )

    async def _check_inference_engine(self) -> ComponentHealth:
        """Check inference engine health."""
        details = {}
        healthy = True
        status = "OK"

        try:
            if self.inference_engine:
                # Check if engine is running
                is_running = getattr(self.inference_engine, '_running', False)
                details["running"] = is_running

                if not is_running:
                    healthy = False
                    status = "Inference engine not running"
                else:
                    # Get metrics if available
                    metrics = getattr(self.inference_engine, 'get_metrics', lambda: {})()
                    if metrics:
                        details["fps"] = metrics.get("pipeline", {}).get("fps", 0)
                        details["frame_count"] = metrics.get("frame_count", 0)
                        status = f"Running at {details.get('fps', 0):.1f} FPS"
                    else:
                        status = "Running"
            else:
                status = "No inference engine configured"

        except Exception as e:
            healthy = False
            status = f"Inference check error: {str(e)}"
            details["error"] = str(e)

        return ComponentHealth(
            name="inference_engine",
            healthy=healthy,
            status=status,
            details=details,
            last_check=datetime.now().isoformat()
        )

    async def _check_deepstream(self) -> ComponentHealth:
        """Check DeepStream pipeline health."""
        details = {}
        healthy = True
        status = "OK"

        try:
            if self.deepstream_pipeline:
                # Check pipeline state
                pipeline_state = getattr(self.deepstream_pipeline, 'pipeline', None)
                if pipeline_state:
                    details["configured"] = True
                    status = "DeepStream pipeline configured"
                else:
                    healthy = False
                    status = "DeepStream pipeline not configured"
            else:
                status = "DeepStream not enabled"

        except Exception as e:
            healthy = False
            status = f"DeepStream check error: {str(e)}"
            details["error"] = str(e)

        return ComponentHealth(
            name="deepstream",
            healthy=healthy,
            status=status,
            details=details,
            last_check=datetime.now().isoformat()
        )

    async def _test_rtsp_stream(self, stream_url: str, timeout: float = 5.0) -> bool:
        """Test RTSP stream connectivity."""
        try:
            # Use ffprobe to test stream
            process = await asyncio.create_subprocess_exec(
                'ffprobe',
                '-v', 'error',
                '-timeout', str(int(timeout * 1000000)),  # microseconds
                '-i', stream_url,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            try:
                await asyncio.wait_for(process.wait(), timeout=timeout)
                return process.returncode == 0
            except asyncio.TimeoutError:
                process.kill()
                return False

        except FileNotFoundError:
            logger.warning("ffprobe not found, skipping RTSP stream test")
            return True  # Assume OK if can't test
        except Exception as e:
            logger.debug(f"RTSP stream test error for {stream_url}: {e}")
            return False

    async def _check_readiness(self) -> bool:
        """Check if system is ready."""
        if not self._health_status:
            await self._perform_health_check()

        # System is ready if all critical components are healthy
        critical_components = ["models", "gpu"]

        for component_name in critical_components:
            component = self._component_checks.get(component_name)
            if not component or not component.healthy:
                return False

        return True

    async def _collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system-level metrics."""
        metrics = {}

        # CPU
        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_count = psutil.cpu_count()
        metrics["cpu"] = {
            "percent": cpu_percent,
            "count": cpu_count,
            "per_cpu": psutil.cpu_percent(interval=0.1, percpu=True)
        }

        # Memory
        memory = psutil.virtual_memory()
        metrics["memory"] = {
            "total_mb": memory.total / 1024 / 1024,
            "available_mb": memory.available / 1024 / 1024,
            "used_mb": memory.used / 1024 / 1024,
            "percent": memory.percent
        }

        # Disk
        if self.recording_path:
            disk = psutil.disk_usage(str(self.recording_path))
            metrics["disk"] = {
                "total_gb": disk.total / 1024 / 1024 / 1024,
                "used_gb": disk.used / 1024 / 1024 / 1024,
                "free_gb": disk.free / 1024 / 1024 / 1024,
                "percent": disk.percent
            }

        # Network
        net_io = psutil.net_io_counters()
        metrics["network"] = {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv,
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv
        }

        # System
        metrics["system"] = {
            "uptime_seconds": (datetime.now() - self._start_time).total_seconds(),
            "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat(),
        }

        return metrics
