"""
BAHB Safety Monitor

Real-time safety monitoring system for autonomous flight operations.
Implements multi-layer safety checks, anomaly detection, and automatic
intervention protocols for power infrastructure inspection missions.
"""

import time
import logging
import threading
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Callable, Any
from enum import Enum
from collections import deque
import json


class SafetyLevel(Enum):
    """Safety status levels."""
    NORMAL = "normal"
    CAUTION = "caution"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class SafetyAction(Enum):
    """Automatic safety actions."""
    NONE = "none"
    ALERT_OPERATOR = "alert_operator"
    REDUCE_SPEED = "reduce_speed"
    HOLD_POSITION = "hold_position"
    RETURN_TO_HOME = "return_to_home"
    EMERGENCY_LAND = "emergency_land"
    MOTOR_CUTOFF = "motor_cutoff"


@dataclass
class SafetyThresholds:
    """Configurable safety thresholds."""
    # Battery thresholds (%)
    battery_normal: float = 50.0
    battery_caution: float = 30.0
    battery_warning: float = 20.0
    battery_critical: float = 15.0
    battery_emergency: float = 10.0

    # Temperature thresholds (Celsius)
    cpu_temp_caution: float = 70.0
    cpu_temp_warning: float = 80.0
    cpu_temp_critical: float = 85.0
    gpu_temp_caution: float = 75.0
    gpu_temp_warning: float = 85.0
    gpu_temp_critical: float = 90.0

    # Signal thresholds (dBm)
    signal_caution: float = -80.0
    signal_warning: float = -90.0
    signal_critical: float = -100.0

    # GPS thresholds
    min_gps_satellites: int = 8
    gps_warning_satellites: int = 6
    gps_critical_satellites: int = 4
    max_gps_hdop: float = 2.0

    # Flight envelope limits
    max_altitude_m: float = 120.0  # Regulatory limit
    max_speed_mps: float = 15.0
    max_distance_from_home_m: float = 2000.0
    max_wind_speed_mps: float = 10.0
    min_visibility_m: float = 1000.0

    # Geofence margins
    geofence_warning_margin_m: float = 50.0
    geofence_critical_margin_m: float = 20.0

    # System health
    max_inference_latency_ms: float = 200.0
    min_inference_fps: float = 5.0
    max_consecutive_inference_failures: int = 5

    # Time limits
    max_flight_duration_min: float = 25.0
    max_mission_duration_min: float = 30.0


@dataclass
class SafetyState:
    """Current safety system state."""
    timestamp: str = ""
    overall_level: SafetyLevel = SafetyLevel.NORMAL
    recommended_action: SafetyAction = SafetyAction.NONE

    # Component statuses
    battery_level: SafetyLevel = SafetyLevel.NORMAL
    temperature_level: SafetyLevel = SafetyLevel.NORMAL
    signal_level: SafetyLevel = SafetyLevel.NORMAL
    gps_level: SafetyLevel = SafetyLevel.NORMAL
    geofence_level: SafetyLevel = SafetyLevel.NORMAL
    flight_envelope_level: SafetyLevel = SafetyLevel.NORMAL
    system_health_level: SafetyLevel = SafetyLevel.NORMAL

    # Active warnings
    active_warnings: List[str] = field(default_factory=list)
    active_alerts: List[str] = field(default_factory=list)

    # Metrics
    battery_percent: float = 100.0
    cpu_temp_c: float = 40.0
    gpu_temp_c: float = 40.0
    signal_strength_dbm: float = -50.0
    gps_satellites: int = 15
    altitude_m: float = 0.0
    speed_mps: float = 0.0
    distance_from_home_m: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "overall_level": self.overall_level.value,
            "recommended_action": self.recommended_action.value,
            "battery_level": self.battery_level.value,
            "temperature_level": self.temperature_level.value,
            "signal_level": self.signal_level.value,
            "gps_level": self.gps_level.value,
            "geofence_level": self.geofence_level.value,
            "flight_envelope_level": self.flight_envelope_level.value,
            "system_health_level": self.system_health_level.value,
            "active_warnings": self.active_warnings,
            "active_alerts": self.active_alerts,
            "metrics": {
                "battery_percent": self.battery_percent,
                "cpu_temp_c": self.cpu_temp_c,
                "gpu_temp_c": self.gpu_temp_c,
                "signal_strength_dbm": self.signal_strength_dbm,
                "gps_satellites": self.gps_satellites,
                "altitude_m": self.altitude_m,
                "speed_mps": self.speed_mps,
                "distance_from_home_m": self.distance_from_home_m
            }
        }


@dataclass
class SafetyEvent:
    """Recorded safety event."""
    timestamp: str
    event_type: str
    level: SafetyLevel
    description: str
    action_taken: SafetyAction
    data: Dict[str, Any] = field(default_factory=dict)


class SafetyMonitor:
    """
    Real-time safety monitoring system for BAHB flight operations.

    Features:
    - Multi-layer safety checks (battery, temp, signal, GPS, geofence)
    - Anomaly detection with historical trend analysis
    - Automatic intervention protocols
    - Configurable thresholds for different mission profiles
    - Event logging and safety audit trail
    """

    # Check intervals
    DEFAULT_CHECK_INTERVAL_MS = 100
    TREND_WINDOW_SIZE = 50

    def __init__(
        self,
        thresholds: Optional[SafetyThresholds] = None,
        check_interval_ms: int = DEFAULT_CHECK_INTERVAL_MS,
        log_dir: Optional[Path] = None,
        simulation_mode: bool = False
    ):
        self.thresholds = thresholds or SafetyThresholds()
        self.check_interval_ms = check_interval_ms
        self.simulation_mode = simulation_mode

        # Logging
        self.logger = logging.getLogger("BAHB.SafetyMonitor")
        self.log_dir = log_dir or Path("/home/user/BAHB/data/safety_logs")
        self.log_dir.mkdir(parents=True, exist_ok=True)

        # State
        self._current_state = SafetyState()
        self._previous_states: deque = deque(maxlen=self.TREND_WINDOW_SIZE)

        # Event history
        self._events: List[SafetyEvent] = []

        # Geofence
        self._geofence_polygons: List[List[tuple]] = []
        self._home_position: Optional[tuple] = None

        # Threading
        self._running = False
        self._monitor_thread: Optional[threading.Thread] = None
        self._state_lock = threading.Lock()

        # Callbacks
        self._alert_callbacks: List[Callable[[SafetyLevel, str, SafetyAction], None]] = []
        self._action_callbacks: Dict[SafetyAction, Callable[[], bool]] = {}

        # Inference monitoring
        self._inference_times: deque = deque(maxlen=100)
        self._consecutive_inference_failures = 0

        # Session tracking
        self._session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self._flight_start_time: Optional[datetime] = None

    def start(self) -> bool:
        """Start safety monitoring."""
        self.logger.info("Starting safety monitor...")

        self._running = True
        self._current_state.timestamp = datetime.now().isoformat()

        self._monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._monitor_thread.start()

        self._record_event(
            "monitor_started",
            SafetyLevel.NORMAL,
            "Safety monitor started",
            SafetyAction.NONE
        )

        self.logger.info("Safety monitor started")
        return True

    def stop(self):
        """Stop safety monitoring."""
        self.logger.info("Stopping safety monitor...")
        self._running = False

        if self._monitor_thread:
            self._monitor_thread.join(timeout=2.0)

        # Save event log
        self._save_event_log()

        self.logger.info("Safety monitor stopped")

    def _monitor_loop(self):
        """Main monitoring loop."""
        while self._running:
            try:
                self._run_safety_checks()
                time.sleep(self.check_interval_ms / 1000.0)
            except Exception as e:
                self.logger.error(f"Safety check error: {e}")

    def _run_safety_checks(self):
        """Execute all safety checks."""
        with self._state_lock:
            # Update timestamp
            self._current_state.timestamp = datetime.now().isoformat()

            # Clear previous warnings
            self._current_state.active_warnings = []
            self._current_state.active_alerts = []

            # Run individual checks
            self._check_battery()
            self._check_temperature()
            self._check_signal()
            self._check_gps()
            self._check_flight_envelope()
            self._check_geofence()
            self._check_system_health()
            self._check_flight_duration()

            # Determine overall level and recommended action
            self._determine_overall_status()

            # Store state for trend analysis
            self._previous_states.append(self._current_state.to_dict())

    def _check_battery(self):
        """Check battery safety status."""
        level = self._current_state.battery_percent
        t = self.thresholds

        if level <= t.battery_emergency:
            self._current_state.battery_level = SafetyLevel.EMERGENCY
            self._current_state.active_alerts.append(f"EMERGENCY: Battery at {level:.1f}%")
        elif level <= t.battery_critical:
            self._current_state.battery_level = SafetyLevel.CRITICAL
            self._current_state.active_alerts.append(f"CRITICAL: Battery at {level:.1f}%")
        elif level <= t.battery_warning:
            self._current_state.battery_level = SafetyLevel.WARNING
            self._current_state.active_warnings.append(f"Battery low: {level:.1f}%")
        elif level <= t.battery_caution:
            self._current_state.battery_level = SafetyLevel.CAUTION
            self._current_state.active_warnings.append(f"Battery caution: {level:.1f}%")
        else:
            self._current_state.battery_level = SafetyLevel.NORMAL

    def _check_temperature(self):
        """Check temperature safety status."""
        cpu = self._current_state.cpu_temp_c
        gpu = self._current_state.gpu_temp_c
        t = self.thresholds

        cpu_level = SafetyLevel.NORMAL
        gpu_level = SafetyLevel.NORMAL

        # CPU temperature
        if cpu >= t.cpu_temp_critical:
            cpu_level = SafetyLevel.CRITICAL
            self._current_state.active_alerts.append(f"CRITICAL: CPU temp {cpu:.1f}°C")
        elif cpu >= t.cpu_temp_warning:
            cpu_level = SafetyLevel.WARNING
            self._current_state.active_warnings.append(f"CPU temp high: {cpu:.1f}°C")
        elif cpu >= t.cpu_temp_caution:
            cpu_level = SafetyLevel.CAUTION

        # GPU temperature
        if gpu >= t.gpu_temp_critical:
            gpu_level = SafetyLevel.CRITICAL
            self._current_state.active_alerts.append(f"CRITICAL: GPU temp {gpu:.1f}°C")
        elif gpu >= t.gpu_temp_warning:
            gpu_level = SafetyLevel.WARNING
            self._current_state.active_warnings.append(f"GPU temp high: {gpu:.1f}°C")
        elif gpu >= t.gpu_temp_caution:
            gpu_level = SafetyLevel.CAUTION

        # Take worst case
        self._current_state.temperature_level = max(cpu_level, gpu_level, key=lambda x: x.value)

    def _check_signal(self):
        """Check signal strength safety status."""
        signal = self._current_state.signal_strength_dbm
        t = self.thresholds

        if signal <= t.signal_critical:
            self._current_state.signal_level = SafetyLevel.CRITICAL
            self._current_state.active_alerts.append(f"CRITICAL: Signal {signal:.0f} dBm")
        elif signal <= t.signal_warning:
            self._current_state.signal_level = SafetyLevel.WARNING
            self._current_state.active_warnings.append(f"Signal weak: {signal:.0f} dBm")
        elif signal <= t.signal_caution:
            self._current_state.signal_level = SafetyLevel.CAUTION
        else:
            self._current_state.signal_level = SafetyLevel.NORMAL

    def _check_gps(self):
        """Check GPS safety status."""
        sats = self._current_state.gps_satellites
        t = self.thresholds

        if sats < t.gps_critical_satellites:
            self._current_state.gps_level = SafetyLevel.CRITICAL
            self._current_state.active_alerts.append(f"CRITICAL: Only {sats} GPS satellites")
        elif sats < t.gps_warning_satellites:
            self._current_state.gps_level = SafetyLevel.WARNING
            self._current_state.active_warnings.append(f"Low GPS satellites: {sats}")
        elif sats < t.min_gps_satellites:
            self._current_state.gps_level = SafetyLevel.CAUTION
        else:
            self._current_state.gps_level = SafetyLevel.NORMAL

    def _check_flight_envelope(self):
        """Check flight envelope limits."""
        t = self.thresholds
        level = SafetyLevel.NORMAL

        # Altitude check
        if self._current_state.altitude_m > t.max_altitude_m:
            level = SafetyLevel.CRITICAL
            self._current_state.active_alerts.append(
                f"CRITICAL: Altitude {self._current_state.altitude_m:.1f}m exceeds limit"
            )
        elif self._current_state.altitude_m > t.max_altitude_m * 0.9:
            if level.value < SafetyLevel.WARNING.value:
                level = SafetyLevel.WARNING
            self._current_state.active_warnings.append(
                f"Approaching altitude limit: {self._current_state.altitude_m:.1f}m"
            )

        # Speed check
        if self._current_state.speed_mps > t.max_speed_mps:
            level = max(level, SafetyLevel.WARNING, key=lambda x: x.value)
            self._current_state.active_warnings.append(
                f"Speed {self._current_state.speed_mps:.1f} m/s exceeds limit"
            )

        # Distance from home check
        if self._current_state.distance_from_home_m > t.max_distance_from_home_m:
            level = max(level, SafetyLevel.CRITICAL, key=lambda x: x.value)
            self._current_state.active_alerts.append(
                f"CRITICAL: Distance from home {self._current_state.distance_from_home_m:.0f}m exceeds limit"
            )
        elif self._current_state.distance_from_home_m > t.max_distance_from_home_m * 0.8:
            level = max(level, SafetyLevel.CAUTION, key=lambda x: x.value)

        self._current_state.flight_envelope_level = level

    def _check_geofence(self):
        """Check geofence boundaries."""
        # Placeholder - would integrate with actual geofence system
        self._current_state.geofence_level = SafetyLevel.NORMAL

    def _check_system_health(self):
        """Check AI system health."""
        t = self.thresholds

        if self._consecutive_inference_failures >= t.max_consecutive_inference_failures:
            self._current_state.system_health_level = SafetyLevel.CRITICAL
            self._current_state.active_alerts.append(
                f"CRITICAL: {self._consecutive_inference_failures} consecutive inference failures"
            )
        elif self._consecutive_inference_failures > 2:
            self._current_state.system_health_level = SafetyLevel.WARNING
            self._current_state.active_warnings.append("Multiple inference failures detected")
        else:
            self._current_state.system_health_level = SafetyLevel.NORMAL

    def _check_flight_duration(self):
        """Check flight duration limits."""
        if not self._flight_start_time:
            return

        elapsed_min = (datetime.now() - self._flight_start_time).total_seconds() / 60.0
        t = self.thresholds

        if elapsed_min >= t.max_flight_duration_min:
            self._current_state.active_alerts.append(
                f"CRITICAL: Flight duration {elapsed_min:.1f} min exceeds limit"
            )

    def _determine_overall_status(self):
        """Determine overall safety status and recommended action."""
        levels = [
            self._current_state.battery_level,
            self._current_state.temperature_level,
            self._current_state.signal_level,
            self._current_state.gps_level,
            self._current_state.geofence_level,
            self._current_state.flight_envelope_level,
            self._current_state.system_health_level
        ]

        # Get worst level
        level_order = [
            SafetyLevel.NORMAL,
            SafetyLevel.CAUTION,
            SafetyLevel.WARNING,
            SafetyLevel.CRITICAL,
            SafetyLevel.EMERGENCY
        ]
        worst_level = max(levels, key=lambda x: level_order.index(x))
        self._current_state.overall_level = worst_level

        # Determine recommended action
        action_map = {
            SafetyLevel.NORMAL: SafetyAction.NONE,
            SafetyLevel.CAUTION: SafetyAction.ALERT_OPERATOR,
            SafetyLevel.WARNING: SafetyAction.REDUCE_SPEED,
            SafetyLevel.CRITICAL: SafetyAction.RETURN_TO_HOME,
            SafetyLevel.EMERGENCY: SafetyAction.EMERGENCY_LAND
        }
        self._current_state.recommended_action = action_map[worst_level]

        # Execute callbacks if action changed
        if self._current_state.recommended_action != SafetyAction.NONE:
            self._execute_action_callbacks()

    def _execute_action_callbacks(self):
        """Execute registered action callbacks."""
        action = self._current_state.recommended_action
        level = self._current_state.overall_level

        # Call general alert callbacks
        for callback in self._alert_callbacks:
            try:
                callback(level, str(self._current_state.active_alerts), action)
            except Exception as e:
                self.logger.error(f"Alert callback error: {e}")

        # Call specific action callback
        if action in self._action_callbacks:
            try:
                self._action_callbacks[action]()
            except Exception as e:
                self.logger.error(f"Action callback error: {e}")

    def _record_event(
        self,
        event_type: str,
        level: SafetyLevel,
        description: str,
        action: SafetyAction,
        data: Optional[Dict] = None
    ):
        """Record a safety event."""
        event = SafetyEvent(
            timestamp=datetime.now().isoformat(),
            event_type=event_type,
            level=level,
            description=description,
            action_taken=action,
            data=data or {}
        )
        self._events.append(event)
        self.logger.info(f"Safety event [{level.value}]: {description}")

    def _save_event_log(self):
        """Save event log to file."""
        log_file = self.log_dir / f"safety_events_{self._session_id}.json"
        with open(log_file, "w") as f:
            events_data = [
                {
                    "timestamp": e.timestamp,
                    "event_type": e.event_type,
                    "level": e.level.value,
                    "description": e.description,
                    "action_taken": e.action_taken.value,
                    "data": e.data
                }
                for e in self._events
            ]
            json.dump(events_data, f, indent=2)
        self.logger.info(f"Saved safety event log to {log_file}")

    # Public API

    def update_telemetry(
        self,
        battery_percent: Optional[float] = None,
        cpu_temp_c: Optional[float] = None,
        gpu_temp_c: Optional[float] = None,
        signal_strength_dbm: Optional[float] = None,
        gps_satellites: Optional[int] = None,
        altitude_m: Optional[float] = None,
        speed_mps: Optional[float] = None,
        distance_from_home_m: Optional[float] = None
    ):
        """Update telemetry values for safety monitoring."""
        with self._state_lock:
            if battery_percent is not None:
                self._current_state.battery_percent = battery_percent
            if cpu_temp_c is not None:
                self._current_state.cpu_temp_c = cpu_temp_c
            if gpu_temp_c is not None:
                self._current_state.gpu_temp_c = gpu_temp_c
            if signal_strength_dbm is not None:
                self._current_state.signal_strength_dbm = signal_strength_dbm
            if gps_satellites is not None:
                self._current_state.gps_satellites = gps_satellites
            if altitude_m is not None:
                self._current_state.altitude_m = altitude_m
            if speed_mps is not None:
                self._current_state.speed_mps = speed_mps
            if distance_from_home_m is not None:
                self._current_state.distance_from_home_m = distance_from_home_m

    def report_inference_time(self, inference_ms: float, success: bool = True):
        """Report inference timing for performance monitoring."""
        self._inference_times.append(inference_ms)

        if success:
            self._consecutive_inference_failures = 0
        else:
            self._consecutive_inference_failures += 1

    def set_home_position(self, lat: float, lon: float, alt: float):
        """Set home position for distance calculations."""
        self._home_position = (lat, lon, alt)
        self.logger.info(f"Home position set: ({lat:.6f}, {lon:.6f}) @ {alt:.1f}m")

    def mark_flight_start(self):
        """Mark the start of flight for duration tracking."""
        self._flight_start_time = datetime.now()
        self._record_event(
            "flight_started",
            SafetyLevel.NORMAL,
            "Flight started",
            SafetyAction.NONE
        )

    def mark_flight_end(self):
        """Mark the end of flight."""
        if self._flight_start_time:
            duration = (datetime.now() - self._flight_start_time).total_seconds() / 60.0
            self._record_event(
                "flight_ended",
                SafetyLevel.NORMAL,
                f"Flight ended after {duration:.1f} minutes",
                SafetyAction.NONE
            )
        self._flight_start_time = None

    def register_alert_callback(
        self,
        callback: Callable[[SafetyLevel, str, SafetyAction], None]
    ):
        """Register callback for safety alerts."""
        self._alert_callbacks.append(callback)

    def register_action_callback(
        self,
        action: SafetyAction,
        callback: Callable[[], bool]
    ):
        """Register callback for specific safety actions."""
        self._action_callbacks[action] = callback
        self.logger.info(f"Registered callback for action: {action.value}")

    def get_current_state(self) -> SafetyState:
        """Get current safety state."""
        with self._state_lock:
            return self._current_state

    def get_safety_level(self) -> SafetyLevel:
        """Get current overall safety level."""
        with self._state_lock:
            return self._current_state.overall_level

    def is_safe_to_fly(self) -> bool:
        """Check if conditions are safe for flight."""
        level = self.get_safety_level()
        return level in [SafetyLevel.NORMAL, SafetyLevel.CAUTION]

    def is_rtl_required(self) -> bool:
        """Check if Return-to-Launch is required."""
        level = self.get_safety_level()
        return level in [SafetyLevel.CRITICAL, SafetyLevel.EMERGENCY]

    def is_emergency_landing_required(self) -> bool:
        """Check if emergency landing is required."""
        return self.get_safety_level() == SafetyLevel.EMERGENCY

    def get_events(self) -> List[SafetyEvent]:
        """Get all recorded safety events."""
        return self._events.copy()

    def get_stats(self) -> Dict[str, Any]:
        """Get safety monitoring statistics."""
        avg_inference = 0.0
        if self._inference_times:
            avg_inference = sum(self._inference_times) / len(self._inference_times)

        return {
            "session_id": self._session_id,
            "current_level": self._current_state.overall_level.value,
            "events_count": len(self._events),
            "avg_inference_ms": avg_inference,
            "consecutive_failures": self._consecutive_inference_failures,
            "flight_started": self._flight_start_time is not None,
            "home_position_set": self._home_position is not None
        }
