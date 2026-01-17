#!/usr/bin/env python3
"""
BAHB Safety and Failover System

Comprehensive safety mechanisms for production drone-based inspection:
- Model inference failover
- Stream recovery
- Emergency protocols
- Data preservation
- Graceful degradation
"""

import os
import sys
import time
import json
import signal
import asyncio
import logging
import threading
from enum import Enum
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Callable, List
from dataclasses import dataclass, field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SafetyState(Enum):
    """System safety states."""
    NORMAL = "normal"
    DEGRADED = "degraded"
    FAILOVER = "failover"
    EMERGENCY = "emergency"
    SHUTDOWN = "shutdown"


class FailoverReason(Enum):
    """Reasons for failover activation."""
    MODEL_CRASH = "model_crash"
    STREAM_LOSS = "stream_loss"
    GPU_FAILURE = "gpu_failure"
    MEMORY_EXHAUSTED = "memory_exhausted"
    THERMAL_CRITICAL = "thermal_critical"
    DISK_FULL = "disk_full"
    BATTERY_CRITICAL = "battery_critical"
    CONNECTION_LOST = "connection_lost"


@dataclass
class SafetyConfig:
    """Safety system configuration."""
    # Memory thresholds (MB)
    memory_warning_mb: int = 12000
    memory_critical_mb: int = 14000

    # Thermal thresholds (°C)
    thermal_warning: int = 75
    thermal_critical: int = 85
    thermal_emergency: int = 95

    # Disk thresholds (GB)
    disk_warning_gb: int = 5
    disk_critical_gb: int = 2

    # Battery thresholds (%)
    battery_warning: int = 30
    battery_critical: int = 20
    battery_emergency: int = 10

    # Recovery settings
    max_recovery_attempts: int = 3
    recovery_backoff_seconds: float = 5.0
    health_check_interval: float = 5.0

    # Data preservation
    auto_save_interval: float = 60.0
    emergency_save_path: str = "/data/bahb/emergency"

    # Failover models
    primary_model: str = "yolo26l_int8.engine"
    fallback_model: str = "yolo26l_fp16.engine"
    emergency_model: str = "yolo26n_int8.engine"  # Smaller, faster


@dataclass
class SystemHealth:
    """Current system health status."""
    state: SafetyState = SafetyState.NORMAL
    cpu_temp: float = 0.0
    gpu_temp: float = 0.0
    memory_used_mb: int = 0
    disk_free_gb: float = 0.0
    battery_percent: int = 100
    inference_fps: float = 0.0
    streams_active: int = 0
    last_detection_time: Optional[datetime] = None
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class ModelFailover:
    """
    Manages model failover for continuous inference.

    Failover chain:
    1. Primary: YOLO26l INT8 (55+ FPS, best accuracy)
    2. Fallback: YOLO26l FP16 (28 FPS, 99.9% accuracy)
    3. Emergency: YOLO26n INT8 (120+ FPS, reduced accuracy)
    """

    def __init__(self, config: SafetyConfig, models_dir: str = "/home/user/BAHB/models/tensorrt"):
        self.config = config
        self.models_dir = Path(models_dir)
        self.current_model: Optional[str] = None
        self.model_instance: Optional[Any] = None
        self.failover_count = 0
        self.last_failover: Optional[datetime] = None

        self.model_chain = [
            config.primary_model,
            config.fallback_model,
            config.emergency_model,
        ]
        self.current_index = 0

    def load_model(self, model_name: str) -> bool:
        """Load a specific model."""
        model_path = self.models_dir / model_name

        if not model_path.exists():
            logger.error(f"Model not found: {model_path}")
            return False

        try:
            # Import here to avoid startup failures
            logger.info(f"Loading model: {model_name}")

            # Placeholder for actual model loading
            # In production, this would use TensorRT or Ultralytics
            self.current_model = model_name
            self.model_instance = {"name": model_name, "loaded": True}

            logger.info(f"Model loaded successfully: {model_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            return False

    def failover_to_next(self) -> bool:
        """Failover to the next model in the chain."""
        self.failover_count += 1
        self.last_failover = datetime.now()

        # Try next model in chain
        self.current_index += 1

        if self.current_index >= len(self.model_chain):
            logger.critical("All models exhausted - no failover available")
            return False

        next_model = self.model_chain[self.current_index]
        logger.warning(f"Failing over to: {next_model}")

        return self.load_model(next_model)

    def reset_to_primary(self) -> bool:
        """Reset to primary model after recovery."""
        self.current_index = 0
        return self.load_model(self.model_chain[0])

    def get_status(self) -> Dict[str, Any]:
        """Get current failover status."""
        return {
            "current_model": self.current_model,
            "failover_count": self.failover_count,
            "last_failover": self.last_failover.isoformat() if self.last_failover else None,
            "chain_position": f"{self.current_index + 1}/{len(self.model_chain)}",
        }


class StreamRecovery:
    """
    Manages camera stream recovery and reconnection.
    """

    def __init__(self, config: SafetyConfig):
        self.config = config
        self.stream_status: Dict[str, Dict] = {}
        self.recovery_attempts: Dict[str, int] = {}

    def register_stream(self, stream_id: str, url: str):
        """Register a stream for monitoring."""
        self.stream_status[stream_id] = {
            "url": url,
            "connected": False,
            "last_frame": None,
            "error": None,
        }
        self.recovery_attempts[stream_id] = 0

    def mark_connected(self, stream_id: str):
        """Mark stream as connected."""
        if stream_id in self.stream_status:
            self.stream_status[stream_id]["connected"] = True
            self.stream_status[stream_id]["last_frame"] = datetime.now()
            self.stream_status[stream_id]["error"] = None
            self.recovery_attempts[stream_id] = 0

    def mark_disconnected(self, stream_id: str, error: str = None):
        """Mark stream as disconnected."""
        if stream_id in self.stream_status:
            self.stream_status[stream_id]["connected"] = False
            self.stream_status[stream_id]["error"] = error

    async def attempt_recovery(self, stream_id: str, connect_func: Callable) -> bool:
        """Attempt to recover a disconnected stream."""
        if stream_id not in self.stream_status:
            return False

        attempts = self.recovery_attempts.get(stream_id, 0)

        if attempts >= self.config.max_recovery_attempts:
            logger.error(f"Stream {stream_id}: Max recovery attempts exceeded")
            return False

        self.recovery_attempts[stream_id] = attempts + 1
        backoff = self.config.recovery_backoff_seconds * (2 ** attempts)

        logger.info(f"Stream {stream_id}: Recovery attempt {attempts + 1}, waiting {backoff}s")
        await asyncio.sleep(backoff)

        try:
            success = await connect_func(self.stream_status[stream_id]["url"])
            if success:
                self.mark_connected(stream_id)
                logger.info(f"Stream {stream_id}: Recovery successful")
                return True
        except Exception as e:
            logger.error(f"Stream {stream_id}: Recovery failed: {e}")

        return False

    def get_status(self) -> Dict[str, Any]:
        """Get stream recovery status."""
        return {
            "streams": self.stream_status,
            "recovery_attempts": self.recovery_attempts,
        }


class DataPreserver:
    """
    Ensures critical data is preserved during failures.
    """

    def __init__(self, config: SafetyConfig):
        self.config = config
        self.emergency_path = Path(config.emergency_save_path)
        self.emergency_path.mkdir(parents=True, exist_ok=True)

        self.pending_detections: List[Dict] = []
        self.pending_alerts: List[Dict] = []
        self.last_save: Optional[datetime] = None

    def buffer_detection(self, detection: Dict):
        """Buffer a detection for preservation."""
        detection["buffered_at"] = datetime.now().isoformat()
        self.pending_detections.append(detection)

        # Auto-save if buffer is large
        if len(self.pending_detections) >= 100:
            self.emergency_save()

    def buffer_alert(self, alert: Dict):
        """Buffer an alert for preservation."""
        alert["buffered_at"] = datetime.now().isoformat()
        self.pending_alerts.append(alert)

    def emergency_save(self) -> str:
        """Save all buffered data to emergency storage."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_file = self.emergency_path / f"emergency_save_{timestamp}.json"

        data = {
            "timestamp": timestamp,
            "detections": self.pending_detections,
            "alerts": self.pending_alerts,
            "metadata": {
                "detection_count": len(self.pending_detections),
                "alert_count": len(self.pending_alerts),
            }
        }

        try:
            with open(save_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)

            logger.info(f"Emergency save completed: {save_file}")

            # Clear buffers after successful save
            self.pending_detections = []
            self.pending_alerts = []
            self.last_save = datetime.now()

            return str(save_file)

        except Exception as e:
            logger.error(f"Emergency save failed: {e}")
            return ""

    def recover_saved_data(self) -> List[Dict]:
        """Recover previously saved emergency data."""
        recovered = []

        for save_file in sorted(self.emergency_path.glob("emergency_save_*.json")):
            try:
                with open(save_file, 'r') as f:
                    data = json.load(f)
                    recovered.append(data)

                # Archive processed file
                archive_path = self.emergency_path / "processed" / save_file.name
                archive_path.parent.mkdir(exist_ok=True)
                save_file.rename(archive_path)

            except Exception as e:
                logger.error(f"Failed to recover {save_file}: {e}")

        return recovered


class GracefulDegradation:
    """
    Manages graceful degradation of system capabilities.
    """

    def __init__(self, config: SafetyConfig):
        self.config = config
        self.degradation_level = 0
        self.disabled_features: List[str] = []

        # Feature priority (lower = more important, disabled last)
        self.feature_priority = {
            "vlm_analysis": 1,      # VLM is resource-heavy, disable first
            "3d_mapping": 2,        # 3D mapping can be deferred
            "recording": 3,         # Recording can be paused
            "thermal_fusion": 4,    # Can run visual-only
            "tracking": 5,          # Tracking can be simplified
            "detection": 10,        # Detection is core, disable last
        }

    def increase_degradation(self) -> List[str]:
        """Increase degradation level and disable next feature."""
        self.degradation_level += 1

        # Find features at this degradation level
        for feature, priority in sorted(self.feature_priority.items(), key=lambda x: x[1]):
            if feature not in self.disabled_features and priority <= self.degradation_level:
                self.disabled_features.append(feature)
                logger.warning(f"Degradation: Disabling {feature} (level {self.degradation_level})")

        return self.disabled_features

    def decrease_degradation(self) -> List[str]:
        """Decrease degradation level and re-enable features."""
        if self.degradation_level > 0:
            self.degradation_level -= 1

        # Re-enable features above current degradation level
        enabled = []
        for feature in list(self.disabled_features):
            if self.feature_priority.get(feature, 0) > self.degradation_level:
                self.disabled_features.remove(feature)
                enabled.append(feature)
                logger.info(f"Recovery: Re-enabling {feature}")

        return enabled

    def is_feature_enabled(self, feature: str) -> bool:
        """Check if a feature is currently enabled."""
        return feature not in self.disabled_features

    def reset(self):
        """Reset to full capability."""
        self.degradation_level = 0
        self.disabled_features = []
        logger.info("Degradation reset: All features enabled")


class SafetyManager:
    """
    Central safety management for BAHB.

    Coordinates all safety subsystems:
    - Model failover
    - Stream recovery
    - Data preservation
    - Graceful degradation
    - Emergency protocols
    """

    def __init__(self, config: Optional[SafetyConfig] = None):
        self.config = config or SafetyConfig()
        self.health = SystemHealth()

        # Initialize subsystems
        self.model_failover = ModelFailover(self.config)
        self.stream_recovery = StreamRecovery(self.config)
        self.data_preserver = DataPreserver(self.config)
        self.degradation = GracefulDegradation(self.config)

        # Callbacks
        self.on_state_change: Optional[Callable] = None
        self.on_emergency: Optional[Callable] = None

        # Background tasks
        self._running = False
        self._monitor_task: Optional[asyncio.Task] = None

        # Setup signal handlers
        self._setup_signal_handlers()

    def _setup_signal_handlers(self):
        """Setup graceful shutdown handlers."""
        def handler(signum, frame):
            logger.info(f"Received signal {signum}, initiating graceful shutdown")
            self.emergency_shutdown("Signal received")

        signal.signal(signal.SIGTERM, handler)
        signal.signal(signal.SIGINT, handler)

    async def start(self):
        """Start safety monitoring."""
        self._running = True
        self._monitor_task = asyncio.create_task(self._monitor_loop())
        logger.info("Safety manager started")

    async def stop(self):
        """Stop safety monitoring."""
        self._running = False
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        logger.info("Safety manager stopped")

    async def _monitor_loop(self):
        """Main monitoring loop."""
        while self._running:
            try:
                await self._check_health()
                await asyncio.sleep(self.config.health_check_interval)
            except Exception as e:
                logger.error(f"Health check error: {e}")

    async def _check_health(self):
        """Check system health and trigger appropriate responses."""
        # Update health metrics
        self._update_health_metrics()

        # Determine state based on health
        new_state = self._evaluate_state()

        if new_state != self.health.state:
            old_state = self.health.state
            self.health.state = new_state
            logger.warning(f"State change: {old_state.value} -> {new_state.value}")

            if self.on_state_change:
                self.on_state_change(old_state, new_state)

            # Take action based on new state
            await self._handle_state_change(new_state)

    def _update_health_metrics(self):
        """Update health metrics from system."""
        # CPU temperature
        try:
            with open("/sys/devices/virtual/thermal/thermal_zone0/temp", "r") as f:
                self.health.cpu_temp = int(f.read().strip()) / 1000
        except:
            pass

        # GPU temperature
        try:
            with open("/sys/devices/virtual/thermal/thermal_zone1/temp", "r") as f:
                self.health.gpu_temp = int(f.read().strip()) / 1000
        except:
            pass

        # Memory usage
        try:
            with open("/proc/meminfo", "r") as f:
                lines = f.readlines()
                total = int(lines[0].split()[1]) // 1024
                available = int(lines[2].split()[1]) // 1024
                self.health.memory_used_mb = total - available
        except:
            pass

        # Disk space
        try:
            stat = os.statvfs("/data")
            self.health.disk_free_gb = (stat.f_bavail * stat.f_frsize) / (1024**3)
        except:
            pass

    def _evaluate_state(self) -> SafetyState:
        """Evaluate current state based on health metrics."""
        # Check for emergency conditions
        if self.health.gpu_temp >= self.config.thermal_emergency:
            return SafetyState.EMERGENCY
        if self.health.battery_percent <= self.config.battery_emergency:
            return SafetyState.EMERGENCY

        # Check for critical conditions
        if self.health.gpu_temp >= self.config.thermal_critical:
            return SafetyState.FAILOVER
        if self.health.memory_used_mb >= self.config.memory_critical_mb:
            return SafetyState.FAILOVER
        if self.health.disk_free_gb <= self.config.disk_critical_gb:
            return SafetyState.FAILOVER
        if self.health.battery_percent <= self.config.battery_critical:
            return SafetyState.FAILOVER

        # Check for warning conditions
        if self.health.gpu_temp >= self.config.thermal_warning:
            return SafetyState.DEGRADED
        if self.health.memory_used_mb >= self.config.memory_warning_mb:
            return SafetyState.DEGRADED
        if self.health.disk_free_gb <= self.config.disk_warning_gb:
            return SafetyState.DEGRADED
        if self.health.battery_percent <= self.config.battery_warning:
            return SafetyState.DEGRADED

        return SafetyState.NORMAL

    async def _handle_state_change(self, state: SafetyState):
        """Handle state transitions."""
        if state == SafetyState.DEGRADED:
            # Increase degradation
            self.degradation.increase_degradation()

        elif state == SafetyState.FAILOVER:
            # Save data and failover
            self.data_preserver.emergency_save()
            self.model_failover.failover_to_next()
            self.degradation.increase_degradation()

        elif state == SafetyState.EMERGENCY:
            # Emergency protocol
            await self._emergency_protocol()

        elif state == SafetyState.NORMAL:
            # Recovery - re-enable features
            self.degradation.decrease_degradation()

    async def _emergency_protocol(self):
        """Execute emergency protocol."""
        logger.critical("EMERGENCY PROTOCOL ACTIVATED")

        # 1. Save all data immediately
        save_path = self.data_preserver.emergency_save()

        # 2. Notify callbacks
        if self.on_emergency:
            self.on_emergency(self.health)

        # 3. Disable non-essential features
        while self.degradation.degradation_level < 5:
            self.degradation.increase_degradation()

        # 4. Log emergency state
        logger.critical(f"Emergency data saved to: {save_path}")
        logger.critical(f"System health: {self.health}")

    def emergency_shutdown(self, reason: str):
        """Perform emergency shutdown."""
        logger.critical(f"EMERGENCY SHUTDOWN: {reason}")

        self.health.state = SafetyState.SHUTDOWN

        # Save all data
        self.data_preserver.emergency_save()

        # Log final state
        logger.critical(f"Final health state: {self.health}")

    def get_status(self) -> Dict[str, Any]:
        """Get comprehensive safety status."""
        return {
            "state": self.health.state.value,
            "health": {
                "cpu_temp": self.health.cpu_temp,
                "gpu_temp": self.health.gpu_temp,
                "memory_used_mb": self.health.memory_used_mb,
                "disk_free_gb": self.health.disk_free_gb,
                "battery_percent": self.health.battery_percent,
                "inference_fps": self.health.inference_fps,
                "streams_active": self.health.streams_active,
            },
            "model_failover": self.model_failover.get_status(),
            "stream_recovery": self.stream_recovery.get_status(),
            "degradation": {
                "level": self.degradation.degradation_level,
                "disabled_features": self.degradation.disabled_features,
            },
            "errors": self.health.errors,
            "warnings": self.health.warnings,
        }


# Example usage and testing
async def main():
    """Test safety system."""
    config = SafetyConfig()
    safety = SafetyManager(config)

    # Register callbacks
    def on_state_change(old, new):
        print(f"State changed: {old.value} -> {new.value}")

    def on_emergency(health):
        print(f"EMERGENCY: {health}")

    safety.on_state_change = on_state_change
    safety.on_emergency = on_emergency

    # Start monitoring
    await safety.start()

    # Simulate some operations
    print("Safety status:", json.dumps(safety.get_status(), indent=2, default=str))

    # Test data preservation
    safety.data_preserver.buffer_detection({"class": "transformer", "confidence": 0.95})
    safety.data_preserver.buffer_alert({"type": "hotspot", "severity": "high"})

    # Test degradation
    print("\nTesting degradation:")
    for i in range(3):
        disabled = safety.degradation.increase_degradation()
        print(f"  Level {safety.degradation.degradation_level}: disabled {disabled}")

    # Test recovery
    print("\nTesting recovery:")
    for i in range(3):
        enabled = safety.degradation.decrease_degradation()
        print(f"  Level {safety.degradation.degradation_level}: enabled {enabled}")

    # Stop
    await safety.stop()
    print("\nSafety system test complete")


if __name__ == "__main__":
    asyncio.run(main())
