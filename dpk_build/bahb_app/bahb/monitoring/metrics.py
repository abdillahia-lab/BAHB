"""
Performance metrics collector for BAHB system.

Collects and exports metrics in Prometheus format including:
- Inference latency (p50, p95, p99)
- Throughput (FPS)
- Detection counts per class
- Thermal anomaly counts
- GPU utilization and temperature
- Memory usage
"""

import asyncio
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Deque
from loguru import logger
import numpy as np


@dataclass
class LatencyStats:
    """Latency statistics."""
    count: int = 0
    total_ms: float = 0.0
    min_ms: float = float('inf')
    max_ms: float = 0.0
    p50_ms: float = 0.0
    p95_ms: float = 0.0
    p99_ms: float = 0.0
    samples: Deque[float] = field(default_factory=lambda: deque(maxlen=1000))

    def record(self, latency_ms: float) -> None:
        """Record a latency sample."""
        self.count += 1
        self.total_ms += latency_ms
        self.min_ms = min(self.min_ms, latency_ms)
        self.max_ms = max(self.max_ms, latency_ms)
        self.samples.append(latency_ms)

        # Update percentiles
        if len(self.samples) >= 10:
            sorted_samples = sorted(self.samples)
            self.p50_ms = sorted_samples[int(len(sorted_samples) * 0.5)]
            self.p95_ms = sorted_samples[int(len(sorted_samples) * 0.95)]
            self.p99_ms = sorted_samples[int(len(sorted_samples) * 0.99)]

    @property
    def avg_ms(self) -> float:
        """Average latency."""
        return self.total_ms / self.count if self.count > 0 else 0.0


@dataclass
class ThroughputStats:
    """Throughput statistics."""
    frame_count: int = 0
    start_time: float = field(default_factory=time.time)
    last_fps_update: float = field(default_factory=time.time)
    current_fps: float = 0.0
    frames_since_last_update: int = 0

    def record_frame(self) -> None:
        """Record a processed frame."""
        self.frame_count += 1
        self.frames_since_last_update += 1

        # Update FPS every second
        current_time = time.time()
        time_diff = current_time - self.last_fps_update

        if time_diff >= 1.0:
            self.current_fps = self.frames_since_last_update / time_diff
            self.frames_since_last_update = 0
            self.last_fps_update = current_time

    @property
    def avg_fps(self) -> float:
        """Average FPS over entire session."""
        elapsed = time.time() - self.start_time
        return self.frame_count / elapsed if elapsed > 0 else 0.0


@dataclass
class GPUMetrics:
    """GPU metrics."""
    utilization_percent: float = 0.0
    memory_used_mb: float = 0.0
    memory_total_mb: float = 0.0
    memory_free_mb: float = 0.0
    temperature_celsius: float = 0.0
    power_watts: float = 0.0


class MetricsCollector:
    """
    Comprehensive metrics collector for BAHB system.

    Collects performance metrics and exports them in Prometheus format.
    """

    def __init__(self):
        # Latency metrics
        self.inference_latency = LatencyStats()
        self.preprocess_latency = LatencyStats()
        self.postprocess_latency = LatencyStats()
        self.thermal_analysis_latency = LatencyStats()
        self.total_latency = LatencyStats()

        # Throughput metrics
        self.throughput = ThroughputStats()

        # Detection counts
        self.detection_counts: Dict[str, int] = defaultdict(int)
        self.anomaly_counts: Dict[str, int] = defaultdict(int)
        self.severity_counts: Dict[str, int] = defaultdict(int)

        # Thermal metrics
        self.thermal_anomaly_counts: Dict[str, int] = defaultdict(int)
        self.hotspot_count: int = 0
        self.coldspot_count: int = 0

        # GPU metrics
        self.gpu_metrics = GPUMetrics()

        # System metrics
        self.memory_usage_mb: float = 0.0
        self.cpu_percent: float = 0.0

        # Error tracking
        self.error_counts: Dict[str, int] = defaultdict(int)
        self.inference_errors: int = 0
        self.camera_errors: int = 0

        # Session tracking
        self.session_start_time = datetime.now()
        self.total_frames_processed: int = 0
        self.total_detections: int = 0
        self.total_anomalies: int = 0

        # Background update task
        self._update_task: Optional[asyncio.Task] = None
        self._running = False

    async def start(self) -> None:
        """Start background metrics collection."""
        self._running = True
        self._update_task = asyncio.create_task(self._update_loop())
        logger.info("Metrics collector started")

    async def stop(self) -> None:
        """Stop background metrics collection."""
        self._running = False
        if self._update_task:
            self._update_task.cancel()
            try:
                await self._update_task
            except asyncio.CancelledError:
                pass
        logger.info("Metrics collector stopped")

    async def _update_loop(self) -> None:
        """Background update loop for GPU and system metrics."""
        while self._running:
            try:
                # Update GPU metrics
                await self._update_gpu_metrics()

                # Update system metrics
                await self._update_system_metrics()

                await asyncio.sleep(1.0)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Metrics update error: {e}")
                await asyncio.sleep(5.0)

    async def _update_gpu_metrics(self) -> None:
        """Update GPU metrics."""
        try:
            import pynvml

            try:
                pynvml.nvmlInit()
                handle = pynvml.nvmlDeviceGetHandleByIndex(0)

                # Memory
                memory_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                self.gpu_metrics.memory_total_mb = memory_info.total / 1024 / 1024
                self.gpu_metrics.memory_used_mb = memory_info.used / 1024 / 1024
                self.gpu_metrics.memory_free_mb = memory_info.free / 1024 / 1024

                # Utilization
                utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
                self.gpu_metrics.utilization_percent = utilization.gpu

                # Temperature
                temperature = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
                self.gpu_metrics.temperature_celsius = temperature

                # Power (if available)
                try:
                    power_mw = pynvml.nvmlDeviceGetPowerUsage(handle)
                    self.gpu_metrics.power_watts = power_mw / 1000.0
                except pynvml.NVMLError:
                    pass  # Power monitoring not available

                pynvml.nvmlShutdown()

            except pynvml.NVMLError as e:
                logger.debug(f"NVML error: {e}")

        except ImportError:
            pass  # pynvml not available

    async def _update_system_metrics(self) -> None:
        """Update system metrics."""
        try:
            import psutil

            # Memory
            memory = psutil.virtual_memory()
            self.memory_usage_mb = memory.used / 1024 / 1024

            # CPU
            self.cpu_percent = psutil.cpu_percent(interval=0.1)

        except ImportError:
            pass

    # Recording methods

    def record_frame(self) -> None:
        """Record a processed frame."""
        self.throughput.record_frame()
        self.total_frames_processed += 1

    def record_inference_latency(self, latency_ms: float) -> None:
        """Record inference latency."""
        self.inference_latency.record(latency_ms)

    def record_preprocess_latency(self, latency_ms: float) -> None:
        """Record preprocessing latency."""
        self.preprocess_latency.record(latency_ms)

    def record_postprocess_latency(self, latency_ms: float) -> None:
        """Record postprocessing latency."""
        self.postprocess_latency.record(latency_ms)

    def record_thermal_analysis_latency(self, latency_ms: float) -> None:
        """Record thermal analysis latency."""
        self.thermal_analysis_latency.record(latency_ms)

    def record_total_latency(self, latency_ms: float) -> None:
        """Record total processing latency."""
        self.total_latency.record(latency_ms)

    def record_detection(self, class_name: str) -> None:
        """Record a detection."""
        self.detection_counts[class_name] += 1
        self.total_detections += 1

    def record_anomaly(self, anomaly_type: str, severity: str) -> None:
        """Record an anomaly."""
        self.anomaly_counts[anomaly_type] += 1
        self.severity_counts[severity] += 1
        self.total_anomalies += 1

    def record_thermal_anomaly(self, anomaly_type: str) -> None:
        """Record a thermal anomaly."""
        self.thermal_anomaly_counts[anomaly_type] += 1

        if "hotspot" in anomaly_type.lower():
            self.hotspot_count += 1
        elif "coldspot" in anomaly_type.lower():
            self.coldspot_count += 1

    def record_error(self, error_type: str) -> None:
        """Record an error."""
        self.error_counts[error_type] += 1

        if "inference" in error_type.lower():
            self.inference_errors += 1
        elif "camera" in error_type.lower():
            self.camera_errors += 1

    # Metrics export

    def get_summary(self) -> Dict:
        """Get metrics summary."""
        uptime = (datetime.now() - self.session_start_time).total_seconds()

        return {
            "session": {
                "start_time": self.session_start_time.isoformat(),
                "uptime_seconds": uptime,
                "total_frames": self.total_frames_processed,
                "total_detections": self.total_detections,
                "total_anomalies": self.total_anomalies,
            },
            "throughput": {
                "current_fps": round(self.throughput.current_fps, 2),
                "average_fps": round(self.throughput.avg_fps, 2),
            },
            "latency": {
                "inference_avg_ms": round(self.inference_latency.avg_ms, 2),
                "inference_p50_ms": round(self.inference_latency.p50_ms, 2),
                "inference_p95_ms": round(self.inference_latency.p95_ms, 2),
                "inference_p99_ms": round(self.inference_latency.p99_ms, 2),
                "total_avg_ms": round(self.total_latency.avg_ms, 2),
                "total_p50_ms": round(self.total_latency.p50_ms, 2),
                "total_p95_ms": round(self.total_latency.p95_ms, 2),
                "total_p99_ms": round(self.total_latency.p99_ms, 2),
            },
            "detections": dict(self.detection_counts),
            "anomalies": {
                "by_type": dict(self.anomaly_counts),
                "by_severity": dict(self.severity_counts),
                "thermal": dict(self.thermal_anomaly_counts),
            },
            "gpu": {
                "utilization_percent": round(self.gpu_metrics.utilization_percent, 2),
                "memory_used_mb": round(self.gpu_metrics.memory_used_mb, 2),
                "memory_free_mb": round(self.gpu_metrics.memory_free_mb, 2),
                "temperature_celsius": round(self.gpu_metrics.temperature_celsius, 2),
                "power_watts": round(self.gpu_metrics.power_watts, 2),
            },
            "system": {
                "memory_usage_mb": round(self.memory_usage_mb, 2),
                "cpu_percent": round(self.cpu_percent, 2),
            },
            "errors": {
                "total": sum(self.error_counts.values()),
                "by_type": dict(self.error_counts),
            },
        }

    def export_prometheus(self) -> str:
        """
        Export metrics in Prometheus format.

        Returns:
            Prometheus-formatted metrics string
        """
        lines = []

        # Helper function
        def add_metric(name: str, value: float, metric_type: str = "gauge", help_text: str = ""):
            if help_text:
                lines.append(f"# HELP {name} {help_text}")
            lines.append(f"# TYPE {name} {metric_type}")
            lines.append(f"{name} {value}")

        # Throughput
        add_metric(
            "bahb_throughput_fps",
            self.throughput.current_fps,
            "gauge",
            "Current processing throughput in frames per second"
        )
        add_metric(
            "bahb_throughput_avg_fps",
            self.throughput.avg_fps,
            "gauge",
            "Average processing throughput in frames per second"
        )
        add_metric(
            "bahb_frames_processed_total",
            self.total_frames_processed,
            "counter",
            "Total frames processed"
        )

        # Latency
        add_metric(
            "bahb_inference_latency_avg_ms",
            self.inference_latency.avg_ms,
            "gauge",
            "Average inference latency in milliseconds"
        )
        add_metric(
            "bahb_inference_latency_p50_ms",
            self.inference_latency.p50_ms,
            "gauge",
            "P50 inference latency in milliseconds"
        )
        add_metric(
            "bahb_inference_latency_p95_ms",
            self.inference_latency.p95_ms,
            "gauge",
            "P95 inference latency in milliseconds"
        )
        add_metric(
            "bahb_inference_latency_p99_ms",
            self.inference_latency.p99_ms,
            "gauge",
            "P99 inference latency in milliseconds"
        )

        add_metric(
            "bahb_total_latency_avg_ms",
            self.total_latency.avg_ms,
            "gauge",
            "Average total processing latency in milliseconds"
        )
        add_metric(
            "bahb_total_latency_p50_ms",
            self.total_latency.p50_ms,
            "gauge",
            "P50 total processing latency in milliseconds"
        )
        add_metric(
            "bahb_total_latency_p95_ms",
            self.total_latency.p95_ms,
            "gauge",
            "P95 total processing latency in milliseconds"
        )
        add_metric(
            "bahb_total_latency_p99_ms",
            self.total_latency.p99_ms,
            "gauge",
            "P99 total processing latency in milliseconds"
        )

        # Detections
        add_metric(
            "bahb_detections_total",
            self.total_detections,
            "counter",
            "Total detections"
        )

        for class_name, count in self.detection_counts.items():
            lines.append(f"# TYPE bahb_detections_by_class counter")
            lines.append(f'bahb_detections_by_class{{class="{class_name}"}} {count}')

        # Anomalies
        add_metric(
            "bahb_anomalies_total",
            self.total_anomalies,
            "counter",
            "Total anomalies detected"
        )

        for anomaly_type, count in self.anomaly_counts.items():
            lines.append(f"# TYPE bahb_anomalies_by_type counter")
            lines.append(f'bahb_anomalies_by_type{{type="{anomaly_type}"}} {count}')

        for severity, count in self.severity_counts.items():
            lines.append(f"# TYPE bahb_anomalies_by_severity counter")
            lines.append(f'bahb_anomalies_by_severity{{severity="{severity}"}} {count}')

        # Thermal anomalies
        add_metric(
            "bahb_thermal_hotspots_total",
            self.hotspot_count,
            "counter",
            "Total thermal hotspots detected"
        )
        add_metric(
            "bahb_thermal_coldspots_total",
            self.coldspot_count,
            "counter",
            "Total thermal coldspots detected"
        )

        for thermal_type, count in self.thermal_anomaly_counts.items():
            lines.append(f"# TYPE bahb_thermal_anomalies_by_type counter")
            lines.append(f'bahb_thermal_anomalies_by_type{{type="{thermal_type}"}} {count}')

        # GPU metrics
        add_metric(
            "bahb_gpu_utilization_percent",
            self.gpu_metrics.utilization_percent,
            "gauge",
            "GPU utilization percentage"
        )
        add_metric(
            "bahb_gpu_memory_used_mb",
            self.gpu_metrics.memory_used_mb,
            "gauge",
            "GPU memory used in MB"
        )
        add_metric(
            "bahb_gpu_memory_free_mb",
            self.gpu_metrics.memory_free_mb,
            "gauge",
            "GPU memory free in MB"
        )
        add_metric(
            "bahb_gpu_temperature_celsius",
            self.gpu_metrics.temperature_celsius,
            "gauge",
            "GPU temperature in Celsius"
        )
        add_metric(
            "bahb_gpu_power_watts",
            self.gpu_metrics.power_watts,
            "gauge",
            "GPU power consumption in Watts"
        )

        # System metrics
        add_metric(
            "bahb_memory_usage_mb",
            self.memory_usage_mb,
            "gauge",
            "System memory usage in MB"
        )
        add_metric(
            "bahb_cpu_percent",
            self.cpu_percent,
            "gauge",
            "CPU utilization percentage"
        )

        # Errors
        add_metric(
            "bahb_errors_total",
            sum(self.error_counts.values()),
            "counter",
            "Total errors"
        )
        add_metric(
            "bahb_inference_errors_total",
            self.inference_errors,
            "counter",
            "Total inference errors"
        )
        add_metric(
            "bahb_camera_errors_total",
            self.camera_errors,
            "counter",
            "Total camera errors"
        )

        return "\n".join(lines) + "\n"

    def reset(self) -> None:
        """Reset all metrics."""
        self.inference_latency = LatencyStats()
        self.preprocess_latency = LatencyStats()
        self.postprocess_latency = LatencyStats()
        self.thermal_analysis_latency = LatencyStats()
        self.total_latency = LatencyStats()

        self.throughput = ThroughputStats()

        self.detection_counts.clear()
        self.anomaly_counts.clear()
        self.severity_counts.clear()
        self.thermal_anomaly_counts.clear()

        self.hotspot_count = 0
        self.coldspot_count = 0

        self.error_counts.clear()
        self.inference_errors = 0
        self.camera_errors = 0

        self.session_start_time = datetime.now()
        self.total_frames_processed = 0
        self.total_detections = 0
        self.total_anomalies = 0

        logger.info("Metrics reset")
