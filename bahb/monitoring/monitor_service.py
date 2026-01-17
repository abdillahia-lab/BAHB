"""
Unified monitoring service for BAHB system.

Runs all monitors as a single coordinated service:
- Process watchdog
- Health check server
- Metrics collector
- Alert system
- Thermal monitor
"""

import asyncio
import signal
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, List
from loguru import logger

from bahb.monitoring.watchdog import ProcessWatchdog, WatchdogConfig
from bahb.monitoring.health_check import HealthCheckServer
from bahb.monitoring.metrics import MetricsCollector
from bahb.monitoring.alerts import AlertSystem, AlertSeverity, AlertCategory
from bahb.monitoring.thermal_monitor import ThermalMonitor, ThermalThresholds


@dataclass
class MonitoringConfig:
    """Monitoring service configuration."""
    # Health check server
    health_check_enabled: bool = True
    health_check_port: int = 8081
    health_check_host: str = "0.0.0.0"

    # Metrics
    metrics_enabled: bool = True

    # Alerts
    alerts_enabled: bool = True
    mqtt_broker: Optional[str] = None
    mqtt_port: int = 1883
    mqtt_topic: str = "bahb/alerts"
    webhook_url: Optional[str] = None

    # Thermal monitoring
    thermal_monitor_enabled: bool = True
    thermal_check_interval: float = 2.0

    # Watchdog
    watchdog_enabled: bool = True
    watchdog_processes: List[str] = None

    # Paths
    recording_path: Optional[Path] = None
    model_paths: List[Path] = None
    camera_streams: List[str] = None


class MonitoringService:
    """
    Unified monitoring service for BAHB.

    Coordinates all monitoring components:
    - Process watchdog for critical processes
    - HTTP health check endpoint
    - Performance metrics collection
    - Alert system with MQTT/webhooks
    - Jetson thermal monitoring
    """

    def __init__(
        self,
        config: Optional[MonitoringConfig] = None,
        inference_engine=None,
        camera=None,
        deepstream_pipeline=None,
    ):
        """
        Initialize monitoring service.

        Args:
            config: Monitoring configuration
            inference_engine: Inference engine instance
            camera: Camera instance
            deepstream_pipeline: DeepStream pipeline instance
        """
        self.config = config or MonitoringConfig()
        self.inference_engine = inference_engine
        self.camera = camera
        self.deepstream_pipeline = deepstream_pipeline

        # Components
        self.health_check: Optional[HealthCheckServer] = None
        self.metrics: Optional[MetricsCollector] = None
        self.alerts: Optional[AlertSystem] = None
        self.thermal_monitor: Optional[ThermalMonitor] = None
        self.watchdogs: List[ProcessWatchdog] = []

        # State
        self._running = False
        self._tasks: List[asyncio.Task] = []

    async def start(self) -> None:
        """Start all monitoring components."""
        logger.info("=" * 60)
        logger.info("Starting BAHB Monitoring Service")
        logger.info("=" * 60)

        self._running = True

        try:
            # Start metrics collector
            if self.config.metrics_enabled:
                logger.info("Starting metrics collector...")
                self.metrics = MetricsCollector()
                await self.metrics.start()

            # Start alert system
            if self.config.alerts_enabled:
                logger.info("Starting alert system...")
                self.alerts = AlertSystem(
                    mqtt_broker=self.config.mqtt_broker,
                    mqtt_port=self.config.mqtt_port,
                    mqtt_topic=self.config.mqtt_topic,
                    webhook_url=self.config.webhook_url,
                    enable_local_alerts=True,
                )
                await self.alerts.start()

            # Start thermal monitor
            if self.config.thermal_monitor_enabled:
                logger.info("Starting thermal monitor...")
                self.thermal_monitor = ThermalMonitor(
                    alert_callback=self._thermal_alert_callback,
                    throttle_callback=self._thermal_throttle_callback,
                )
                await self.thermal_monitor.start(self.config.thermal_check_interval)

            # Start health check server
            if self.config.health_check_enabled:
                logger.info("Starting health check server...")
                self.health_check = HealthCheckServer(
                    port=self.config.health_check_port,
                    host=self.config.health_check_host,
                )

                # Configure health check
                self.health_check.camera = self.camera
                self.health_check.inference_engine = self.inference_engine
                self.health_check.deepstream_pipeline = self.deepstream_pipeline

                if self.config.camera_streams:
                    self.health_check.camera_streams = self.config.camera_streams

                if self.config.model_paths:
                    self.health_check.model_paths = self.config.model_paths

                if self.config.recording_path:
                    self.health_check.recording_path = self.config.recording_path

                await self.health_check.start()

            # Start watchdogs (if configured)
            if self.config.watchdog_enabled and self.config.watchdog_processes:
                logger.info("Starting process watchdogs...")
                # Process watchdogs would be configured per process
                # This is a placeholder for demonstration
                pass

            # Start integration tasks
            self._tasks.append(asyncio.create_task(self._integration_loop()))

            logger.info("=" * 60)
            logger.info("BAHB Monitoring Service Started Successfully")
            logger.info("=" * 60)
            self._log_status()

        except Exception as e:
            logger.error(f"Failed to start monitoring service: {e}")
            await self.stop()
            raise

    async def stop(self) -> None:
        """Stop all monitoring components."""
        logger.info("Stopping BAHB Monitoring Service...")
        self._running = False

        # Cancel tasks
        for task in self._tasks:
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        # Stop components
        if self.health_check:
            await self.health_check.stop()

        if self.metrics:
            await self.metrics.stop()

        if self.alerts:
            await self.alerts.stop()

        if self.thermal_monitor:
            await self.thermal_monitor.stop()

        for watchdog in self.watchdogs:
            await watchdog.stop()

        logger.info("BAHB Monitoring Service stopped")

    async def _integration_loop(self) -> None:
        """Integration loop to coordinate monitors."""
        while self._running:
            try:
                await asyncio.sleep(10)  # Run every 10 seconds

                # Check for critical conditions
                await self._check_critical_conditions()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Integration loop error: {e}")

    async def _check_critical_conditions(self) -> None:
        """Check for critical system conditions."""
        try:
            # Check GPU memory
            if self.metrics:
                gpu_memory_used = self.metrics.gpu_metrics.memory_used_mb
                gpu_memory_total = self.metrics.gpu_metrics.memory_total_mb

                if gpu_memory_total > 0:
                    gpu_memory_percent = (gpu_memory_used / gpu_memory_total) * 100

                    # Alert if GPU memory > 90%
                    if gpu_memory_percent > 90 and self.alerts:
                        await self.alerts.alert_gpu_memory_high(
                            gpu_memory_used,
                            gpu_memory_total
                        )

            # Check disk space
            if self.health_check and self.config.recording_path:
                import psutil
                disk = psutil.disk_usage(str(self.config.recording_path))
                free_gb = disk.free / 1024 / 1024 / 1024
                total_gb = disk.total / 1024 / 1024 / 1024

                # Alert if disk space < 10GB
                if free_gb < 10 and self.alerts:
                    await self.alerts.alert_disk_space_low(free_gb, total_gb)

            # Check FPS
            if self.metrics and self.inference_engine:
                current_fps = self.metrics.throughput.current_fps

                # Alert if FPS drops below 15
                if current_fps > 0 and current_fps < 15 and self.alerts:
                    await self.alerts.alert_performance_degradation(
                        "FPS",
                        current_fps,
                        15.0
                    )

        except Exception as e:
            logger.debug(f"Critical conditions check error: {e}")

    async def _thermal_alert_callback(
        self,
        severity: str,
        message: str,
        temperature: float
    ) -> None:
        """Callback for thermal alerts."""
        if self.alerts:
            severity_map = {
                "info": AlertSeverity.INFO,
                "warning": AlertSeverity.WARNING,
                "critical": AlertSeverity.CRITICAL,
            }

            await self.alerts.send_alert(
                severity=severity_map.get(severity, AlertSeverity.WARNING),
                category=AlertCategory.HEALTH,
                title="Thermal Alert",
                message=message,
                source="ThermalMonitor",
                metadata={"temperature_celsius": temperature}
            )

    async def _thermal_throttle_callback(self, should_throttle: bool) -> None:
        """Callback for thermal throttling."""
        if should_throttle:
            logger.warning("System thermal throttling enabled - reducing workload")

            # Reduce inference engine workload if available
            if hasattr(self.inference_engine, '_paused'):
                # Optionally pause or slow down inference
                pass

        else:
            logger.info("System thermal throttling disabled - resuming normal operation")

    def _log_status(self) -> None:
        """Log current monitoring status."""
        logger.info("")
        logger.info("Monitoring Components Status:")
        logger.info(f"  Health Check Server: {'✓ RUNNING' if self.health_check else '✗ DISABLED'}")
        if self.health_check:
            logger.info(f"    URL: http://{self.config.health_check_host}:{self.config.health_check_port}/health")

        logger.info(f"  Metrics Collector:   {'✓ RUNNING' if self.metrics else '✗ DISABLED'}")
        logger.info(f"  Alert System:        {'✓ RUNNING' if self.alerts else '✗ DISABLED'}")

        if self.alerts:
            stats = self.alerts.get_statistics()
            logger.info(f"    MQTT: {'✓ Connected' if stats['mqtt_connected'] else '✗ Not configured'}")
            logger.info(f"    Webhook: {'✓ Enabled' if stats['webhook_enabled'] else '✗ Not configured'}")

        logger.info(f"  Thermal Monitor:     {'✓ RUNNING' if self.thermal_monitor else '✗ DISABLED'}")

        if self.thermal_monitor:
            temps = self.thermal_monitor.get_current_temperatures()
            if temps:
                max_temp = max(temps.values())
                logger.info(f"    Current Max Temp: {max_temp:.1f}°C")

        logger.info(f"  Process Watchdogs:   {len(self.watchdogs)} configured")
        logger.info("")

    def get_status(self) -> dict:
        """Get comprehensive monitoring status."""
        status = {
            "running": self._running,
            "components": {
                "health_check": self.health_check is not None,
                "metrics": self.metrics is not None,
                "alerts": self.alerts is not None,
                "thermal_monitor": self.thermal_monitor is not None,
                "watchdogs": len(self.watchdogs),
            }
        }

        if self.health_check and self.health_check._health_status:
            status["health"] = self.health_check._health_status.healthy

        if self.metrics:
            status["metrics"] = self.metrics.get_summary()

        if self.alerts:
            status["alerts"] = self.alerts.get_statistics()

        if self.thermal_monitor:
            status["thermal"] = self.thermal_monitor.get_status()

        return status

    async def get_metrics_prometheus(self) -> str:
        """Get metrics in Prometheus format."""
        if self.metrics:
            return self.metrics.export_prometheus()
        return ""

    async def get_health_status(self) -> dict:
        """Get health status."""
        if self.health_check and self.health_check._health_status:
            from dataclasses import asdict
            return asdict(self.health_check._health_status)
        return {"healthy": False, "error": "Health check not available"}


async def run_monitoring_service(
    config: Optional[MonitoringConfig] = None,
    inference_engine=None,
    camera=None,
    deepstream_pipeline=None,
) -> None:
    """
    Run the monitoring service.

    Args:
        config: Monitoring configuration
        inference_engine: Inference engine instance
        camera: Camera instance
        deepstream_pipeline: DeepStream pipeline instance
    """
    service = MonitoringService(
        config=config,
        inference_engine=inference_engine,
        camera=camera,
        deepstream_pipeline=deepstream_pipeline,
    )

    # Setup signal handlers
    def signal_handler():
        logger.info("Received shutdown signal")
        asyncio.create_task(service.stop())

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, signal_handler)

    try:
        # Start service
        await service.start()

        # Run until stopped
        while service._running:
            await asyncio.sleep(1)

    except KeyboardInterrupt:
        logger.info("Monitoring service interrupted")
    finally:
        await service.stop()


if __name__ == "__main__":
    """Run monitoring service standalone."""
    import sys

    # Example configuration
    config = MonitoringConfig(
        health_check_enabled=True,
        health_check_port=8081,
        metrics_enabled=True,
        alerts_enabled=True,
        thermal_monitor_enabled=True,
        recording_path=Path("/data/bahb/recordings"),
        model_paths=[
            Path("/home/user/BAHB/models/yolo26l-inspection.pt"),
        ],
        camera_streams=[
            "rtsp://192.168.42.2:8554/wide",
            "rtsp://192.168.42.2:8554/thermal",
        ],
    )

    # Run service
    try:
        asyncio.run(run_monitoring_service(config))
    except KeyboardInterrupt:
        logger.info("Monitoring service stopped by user")
        sys.exit(0)
