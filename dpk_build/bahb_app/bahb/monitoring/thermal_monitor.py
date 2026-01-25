"""
Jetson thermal monitoring for BAHB system.

Monitors CPU/GPU temperatures, detects throttling, and can
automatically reduce workload to prevent overheating.
"""

import asyncio
import os
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Callable
from loguru import logger


class ThermalZone(Enum):
    """Jetson thermal zones."""
    CPU = "CPU-therm"
    GPU = "GPU-therm"
    AUX = "AUX-therm"
    AO = "AO-therm"
    THERMAL = "thermal-fan-est"


class ThermalState(Enum):
    """Thermal state."""
    NORMAL = "normal"
    WARM = "warm"
    HOT = "hot"
    CRITICAL = "critical"
    THROTTLING = "throttling"


@dataclass
class ThermalReading:
    """Thermal sensor reading."""
    zone: str
    temperature_celsius: float
    timestamp: datetime
    state: ThermalState


@dataclass
class ThermalThresholds:
    """Temperature thresholds."""
    warm_threshold: float = 60.0  # Start monitoring more closely
    hot_threshold: float = 75.0   # Warning state
    critical_threshold: float = 85.0  # Critical state
    throttle_threshold: float = 90.0  # Reduce workload


class ThermalMonitor:
    """
    Jetson thermal monitoring system.

    Features:
    - Monitor CPU/GPU/AUX temperatures
    - Detect thermal throttling
    - Auto-reduce workload on overheating
    - Log thermal events
    - Alert on high temperatures
    """

    def __init__(
        self,
        thresholds: Optional[ThermalThresholds] = None,
        alert_callback: Optional[Callable[[str, str, float], None]] = None,
        throttle_callback: Optional[Callable[[bool], None]] = None,
    ):
        """
        Initialize thermal monitor.

        Args:
            thresholds: Temperature thresholds
            alert_callback: Callback for thermal alerts (zone, state, temperature)
            throttle_callback: Callback for throttling state changes (should_throttle)
        """
        self.thresholds = thresholds or ThermalThresholds()
        self.alert_callback = alert_callback
        self.throttle_callback = throttle_callback

        # Thermal zone paths
        self._thermal_base = Path("/sys/devices/virtual/thermal")
        self._thermal_zones: Dict[str, Path] = {}

        # Current readings
        self._current_readings: Dict[str, ThermalReading] = {}

        # State tracking
        self._thermal_state = ThermalState.NORMAL
        self._is_throttling = False
        self._throttle_start_time: Optional[datetime] = None

        # Event logging
        self._thermal_events: List[Dict] = []
        self._max_events = 1000

        # Statistics
        self.stats = {
            "total_readings": 0,
            "warm_events": 0,
            "hot_events": 0,
            "critical_events": 0,
            "throttle_events": 0,
            "max_temperature_celsius": 0.0,
        }

        # Background tasks
        self._monitor_task: Optional[asyncio.Task] = None
        self._running = False

    async def start(self, check_interval_seconds: float = 2.0) -> None:
        """
        Start thermal monitoring.

        Args:
            check_interval_seconds: Monitoring interval
        """
        logger.info("Starting Jetson thermal monitor")

        # Discover thermal zones
        self._discover_thermal_zones()

        if not self._thermal_zones:
            logger.warning("No thermal zones found, thermal monitoring disabled")
            return

        logger.info(f"Found thermal zones: {list(self._thermal_zones.keys())}")

        # Start monitoring
        self._running = True
        self._monitor_task = asyncio.create_task(
            self._monitor_loop(check_interval_seconds)
        )

        logger.info("Jetson thermal monitor started")

    async def stop(self) -> None:
        """Stop thermal monitoring."""
        logger.info("Stopping Jetson thermal monitor")
        self._running = False

        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass

        logger.info("Jetson thermal monitor stopped")

    def _discover_thermal_zones(self) -> None:
        """Discover available thermal zones."""
        if not self._thermal_base.exists():
            logger.warning(f"Thermal sysfs not found at {self._thermal_base}")
            return

        # Find thermal zone directories
        for zone_dir in self._thermal_base.glob("thermal_zone*"):
            type_file = zone_dir / "type"

            if type_file.exists():
                try:
                    zone_type = type_file.read_text().strip()
                    temp_file = zone_dir / "temp"

                    if temp_file.exists():
                        self._thermal_zones[zone_type] = temp_file
                        logger.debug(f"Found thermal zone: {zone_type} at {temp_file}")

                except Exception as e:
                    logger.debug(f"Error reading thermal zone {zone_dir}: {e}")

    async def _monitor_loop(self, interval: float) -> None:
        """Main monitoring loop."""
        while self._running:
            try:
                # Read all thermal zones
                await self._read_thermal_zones()

                # Check thermal state
                await self._check_thermal_state()

                # Sleep
                await asyncio.sleep(interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Thermal monitor loop error: {e}")
                await asyncio.sleep(interval)

    async def _read_thermal_zones(self) -> None:
        """Read all thermal zone temperatures."""
        for zone_name, temp_file in self._thermal_zones.items():
            try:
                # Read temperature (in millidegrees Celsius)
                temp_mC = int(temp_file.read_text().strip())
                temp_C = temp_mC / 1000.0

                # Create reading
                reading = ThermalReading(
                    zone=zone_name,
                    temperature_celsius=temp_C,
                    timestamp=datetime.now(),
                    state=self._classify_temperature(temp_C),
                )

                self._current_readings[zone_name] = reading
                self.stats["total_readings"] += 1

                # Update max temperature
                if temp_C > self.stats["max_temperature_celsius"]:
                    self.stats["max_temperature_celsius"] = temp_C

            except Exception as e:
                logger.debug(f"Error reading thermal zone {zone_name}: {e}")

    def _classify_temperature(self, temp_celsius: float) -> ThermalState:
        """Classify temperature into state."""
        if temp_celsius >= self.thresholds.throttle_threshold:
            return ThermalState.THROTTLING
        elif temp_celsius >= self.thresholds.critical_threshold:
            return ThermalState.CRITICAL
        elif temp_celsius >= self.thresholds.hot_threshold:
            return ThermalState.HOT
        elif temp_celsius >= self.thresholds.warm_threshold:
            return ThermalState.WARM
        else:
            return ThermalState.NORMAL

    async def _check_thermal_state(self) -> None:
        """Check overall thermal state and take action."""
        if not self._current_readings:
            return

        # Find highest temperature
        max_reading = max(
            self._current_readings.values(),
            key=lambda r: r.temperature_celsius
        )

        new_state = max_reading.state
        previous_state = self._thermal_state

        # State change
        if new_state != previous_state:
            await self._handle_state_change(previous_state, new_state, max_reading)

        # Check throttling
        should_throttle = new_state in [ThermalState.CRITICAL, ThermalState.THROTTLING]
        if should_throttle != self._is_throttling:
            await self._handle_throttling_change(should_throttle, max_reading)

        self._thermal_state = new_state

    async def _handle_state_change(
        self,
        previous: ThermalState,
        new: ThermalState,
        reading: ThermalReading
    ) -> None:
        """Handle thermal state change."""
        logger.info(
            f"Thermal state change: {previous.value} -> {new.value} "
            f"({reading.zone}: {reading.temperature_celsius:.1f}°C)"
        )

        # Log event
        event = {
            "timestamp": datetime.now().isoformat(),
            "previous_state": previous.value,
            "new_state": new.value,
            "zone": reading.zone,
            "temperature_celsius": reading.temperature_celsius,
        }
        self._thermal_events.append(event)

        # Limit event history
        if len(self._thermal_events) > self._max_events:
            self._thermal_events.pop(0)

        # Update statistics
        if new == ThermalState.WARM:
            self.stats["warm_events"] += 1
        elif new == ThermalState.HOT:
            self.stats["hot_events"] += 1
        elif new == ThermalState.CRITICAL:
            self.stats["critical_events"] += 1
        elif new == ThermalState.THROTTLING:
            self.stats["throttle_events"] += 1

        # Send alert
        if self.alert_callback and new.value != ThermalState.NORMAL.value:
            severity = {
                ThermalState.WARM: "info",
                ThermalState.HOT: "warning",
                ThermalState.CRITICAL: "critical",
                ThermalState.THROTTLING: "critical",
            }.get(new, "info")

            try:
                await self.alert_callback(
                    severity,
                    f"Thermal state: {new.value}",
                    reading.temperature_celsius
                )
            except Exception as e:
                logger.error(f"Alert callback error: {e}")

    async def _handle_throttling_change(
        self,
        should_throttle: bool,
        reading: ThermalReading
    ) -> None:
        """Handle throttling state change."""
        self._is_throttling = should_throttle

        if should_throttle:
            self._throttle_start_time = datetime.now()
            logger.warning(
                f"Thermal throttling ENABLED: {reading.zone} at "
                f"{reading.temperature_celsius:.1f}°C"
            )
        else:
            if self._throttle_start_time:
                duration = (datetime.now() - self._throttle_start_time).total_seconds()
                logger.info(f"Thermal throttling DISABLED (was active for {duration:.1f}s)")
            else:
                logger.info("Thermal throttling DISABLED")

            self._throttle_start_time = None

        # Notify via callback
        if self.throttle_callback:
            try:
                await self.throttle_callback(should_throttle)
            except Exception as e:
                logger.error(f"Throttle callback error: {e}")

    def get_current_temperatures(self) -> Dict[str, float]:
        """Get current temperatures for all zones."""
        return {
            zone: reading.temperature_celsius
            for zone, reading in self._current_readings.items()
        }

    def get_thermal_state(self) -> ThermalState:
        """Get current thermal state."""
        return self._thermal_state

    def is_throttling(self) -> bool:
        """Check if system is thermally throttling."""
        return self._is_throttling

    def get_max_temperature(self) -> float:
        """Get current maximum temperature across all zones."""
        if not self._current_readings:
            return 0.0

        return max(r.temperature_celsius for r in self._current_readings.values())

    def get_recent_events(self, count: int = 10) -> List[Dict]:
        """Get recent thermal events."""
        return self._thermal_events[-count:]

    def get_status(self) -> Dict:
        """Get thermal monitor status."""
        current_temps = self.get_current_temperatures()

        status = {
            "running": self._running,
            "thermal_state": self._thermal_state.value,
            "is_throttling": self._is_throttling,
            "current_temperatures": current_temps,
            "max_temperature": self.get_max_temperature(),
            "thresholds": {
                "warm": self.thresholds.warm_threshold,
                "hot": self.thresholds.hot_threshold,
                "critical": self.thresholds.critical_threshold,
                "throttle": self.thresholds.throttle_threshold,
            },
            "statistics": self.stats,
        }

        if self._throttle_start_time:
            status["throttle_duration_seconds"] = (
                datetime.now() - self._throttle_start_time
            ).total_seconds()

        return status

    async def set_nvpmodel(self, mode: int) -> bool:
        """
        Set NVIDIA power model (requires sudo).

        Args:
            mode: Power model number (0=MAXN, 1=15W, 2=10W for Orin NX)

        Returns:
            True if successful
        """
        try:
            process = await asyncio.create_subprocess_exec(
                'sudo', 'nvpmodel', '-m', str(mode),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            await process.wait()

            if process.returncode == 0:
                logger.info(f"Set nvpmodel to mode {mode}")
                return True
            else:
                logger.error(f"Failed to set nvpmodel: {process.returncode}")
                return False

        except Exception as e:
            logger.error(f"Error setting nvpmodel: {e}")
            return False

    async def set_fan_speed(self, speed_percent: int) -> bool:
        """
        Set fan speed (requires jetson-stats or manual control).

        Args:
            speed_percent: Fan speed 0-100%

        Returns:
            True if successful
        """
        try:
            # Try using jetson-stats
            process = await asyncio.create_subprocess_exec(
                'sudo', 'jetson_clocks', '--fan',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            await process.wait()

            if process.returncode == 0:
                logger.info(f"Set fan speed to {speed_percent}%")
                return True
            else:
                logger.warning("jetson_clocks not available")
                return False

        except Exception as e:
            logger.error(f"Error setting fan speed: {e}")
            return False

    def get_thermal_summary(self) -> str:
        """Get human-readable thermal summary."""
        temps = self.get_current_temperatures()

        if not temps:
            return "No thermal data available"

        lines = [
            f"Thermal Status: {self._thermal_state.value.upper()}",
            f"Throttling: {'YES' if self._is_throttling else 'NO'}",
            "",
            "Current Temperatures:",
        ]

        for zone, temp in sorted(temps.items()):
            state = self._classify_temperature(temp)
            indicator = {
                ThermalState.NORMAL: "✓",
                ThermalState.WARM: "⚠",
                ThermalState.HOT: "⚠⚠",
                ThermalState.CRITICAL: "❌",
                ThermalState.THROTTLING: "🔥",
            }.get(state, "?")

            lines.append(f"  {indicator} {zone:15s}: {temp:5.1f}°C ({state.value})")

        lines.append("")
        lines.append(f"Max Temperature: {self.get_max_temperature():.1f}°C")

        return "\n".join(lines)


async def auto_thermal_management(
    monitor: ThermalMonitor,
    inference_engine,
    reduce_fps_on_throttle: bool = True,
) -> None:
    """
    Automatic thermal management.

    Reduces workload when system is overheating.

    Args:
        monitor: ThermalMonitor instance
        inference_engine: Inference engine to control
        reduce_fps_on_throttle: Reduce FPS when throttling
    """
    original_fps = None

    async def on_throttle_change(should_throttle: bool):
        nonlocal original_fps

        if should_throttle and reduce_fps_on_throttle:
            # Save original FPS and reduce
            if hasattr(inference_engine, 'target_fps'):
                original_fps = inference_engine.target_fps
                new_fps = max(10, original_fps * 0.5)  # Reduce to 50% or 10 FPS minimum
                inference_engine.target_fps = new_fps
                logger.warning(f"Reduced FPS from {original_fps} to {new_fps} due to thermal throttling")

        elif not should_throttle and original_fps is not None:
            # Restore original FPS
            inference_engine.target_fps = original_fps
            logger.info(f"Restored FPS to {original_fps} after thermal recovery")
            original_fps = None

    monitor.throttle_callback = on_throttle_change
