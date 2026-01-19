"""
Mission Controller for Day-One Operations

Orchestrates inspection missions with safety integration,
real-time detection processing, and automated response.
"""

import os
import time
import json
import logging
import threading
from enum import Enum, auto
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime
from pathlib import Path
from queue import Queue, Empty

logger = logging.getLogger(__name__)


class MissionState(Enum):
    """Mission execution states."""
    IDLE = auto()
    PREFLIGHT = auto()
    ARMED = auto()
    EXECUTING = auto()
    PAUSED = auto()
    RETURNING = auto()
    LANDING = auto()
    COMPLETED = auto()
    ABORTED = auto()
    EMERGENCY = auto()


class MissionType(Enum):
    """Types of inspection missions."""
    GRID_SURVEY = auto()
    TOWER_INSPECTION = auto()
    LINE_FOLLOWING = auto()
    HOTSPOT_TRACKING = auto()
    CUSTOM_WAYPOINTS = auto()


@dataclass
class Waypoint:
    """Mission waypoint."""
    lat: float
    lon: float
    alt: float
    heading: Optional[float] = None
    gimbal_pitch: float = -45.0
    hover_time_s: float = 0.0
    capture_photo: bool = True
    zoom_level: float = 1.0
    name: str = ""


@dataclass
class MissionPlan:
    """Complete mission plan."""
    name: str
    mission_type: MissionType
    waypoints: List[Waypoint]
    home_location: Waypoint
    max_altitude_m: float = 120.0
    min_altitude_m: float = 30.0
    default_speed_ms: float = 5.0
    rtl_altitude_m: float = 50.0
    geofence_radius_m: float = 500.0
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        return {
            'name': self.name,
            'mission_type': self.mission_type.name,
            'waypoints': [
                {'lat': w.lat, 'lon': w.lon, 'alt': w.alt, 'name': w.name}
                for w in self.waypoints
            ],
            'home_location': {
                'lat': self.home_location.lat,
                'lon': self.home_location.lon,
                'alt': self.home_location.alt
            },
            'max_altitude_m': self.max_altitude_m,
            'geofence_radius_m': self.geofence_radius_m,
            'created_at': self.created_at.isoformat()
        }


@dataclass
class MissionStatus:
    """Current mission status."""
    state: MissionState
    current_waypoint: int
    total_waypoints: int
    elapsed_time_s: float
    remaining_time_s: float
    distance_traveled_m: float
    distance_remaining_m: float
    battery_percent: float
    critical_detections: int
    total_detections: int
    current_location: Optional[Waypoint] = None

    def to_dict(self) -> Dict:
        return {
            'state': self.state.name,
            'progress': {
                'current_waypoint': self.current_waypoint,
                'total_waypoints': self.total_waypoints,
                'percent': (self.current_waypoint / max(self.total_waypoints, 1)) * 100
            },
            'timing': {
                'elapsed_s': self.elapsed_time_s,
                'remaining_s': self.remaining_time_s
            },
            'distance': {
                'traveled_m': self.distance_traveled_m,
                'remaining_m': self.distance_remaining_m
            },
            'battery_percent': self.battery_percent,
            'detections': {
                'critical': self.critical_detections,
                'total': self.total_detections
            }
        }


class MissionController:
    """
    Mission Controller for automated power infrastructure inspection.

    Manages the complete mission lifecycle:
    - Pre-flight checks and authorization
    - Mission planning and waypoint management
    - Real-time execution monitoring
    - Detection integration and alerting
    - Safety system coordination
    - Return-to-home and landing
    """

    # Safety thresholds
    BATTERY_WARNING_PERCENT = 30
    BATTERY_CRITICAL_PERCENT = 20
    BATTERY_RTL_PERCENT = 15
    SIGNAL_WARNING_DBM = -70
    SIGNAL_CRITICAL_DBM = -80

    def __init__(
        self,
        inference_engine=None,
        safety_manager=None,
        enable_simulation: bool = True
    ):
        """
        Initialize the Mission Controller.

        Args:
            inference_engine: ProductionInferenceEngine instance
            safety_manager: Safety manager instance
            enable_simulation: Enable simulation mode (no actual flight)
        """
        self.inference_engine = inference_engine
        self.safety_manager = safety_manager
        self.simulation_mode = enable_simulation

        # Mission state
        self.state = MissionState.IDLE
        self.current_plan: Optional[MissionPlan] = None
        self.current_waypoint_idx = 0
        self.mission_start_time: Optional[datetime] = None

        # Telemetry (simulated or from DJI SDK)
        self.battery_percent = 100.0
        self.signal_strength_dbm = -50.0
        self.gps_satellites = 20
        self.current_location: Optional[Waypoint] = None

        # Detection tracking
        self.total_detections = 0
        self.critical_detections = 0
        self.detection_log: List[Dict] = []

        # Thread management
        self._running = False
        self._mission_thread: Optional[threading.Thread] = None
        self._detection_queue = Queue()
        self._lock = threading.Lock()

        # Callbacks
        self._state_callbacks: List[Callable[[MissionState], None]] = []
        self._alert_callbacks: List[Callable[[str, str], None]] = []

        logger.info(f"Mission Controller initialized (simulation: {enable_simulation})")

    def register_state_callback(self, callback: Callable[[MissionState], None]):
        """Register callback for state changes."""
        self._state_callbacks.append(callback)

    def register_alert_callback(self, callback: Callable[[str, str], None]):
        """Register callback for alerts (level, message)."""
        self._alert_callbacks.append(callback)

    def _set_state(self, new_state: MissionState):
        """Set mission state and trigger callbacks."""
        old_state = self.state
        self.state = new_state
        logger.info(f"Mission state: {old_state.name} -> {new_state.name}")

        for callback in self._state_callbacks:
            try:
                callback(new_state)
            except Exception as e:
                logger.warning(f"State callback error: {e}")

    def _trigger_alert(self, level: str, message: str):
        """Trigger alert callbacks."""
        logger.warning(f"ALERT [{level}]: {message}")
        for callback in self._alert_callbacks:
            try:
                callback(level, message)
            except Exception as e:
                logger.warning(f"Alert callback error: {e}")

    def load_mission(self, plan: MissionPlan) -> bool:
        """
        Load a mission plan.

        Args:
            plan: Mission plan to load

        Returns:
            True if mission loaded successfully
        """
        if self.state not in [MissionState.IDLE, MissionState.COMPLETED]:
            logger.error("Cannot load mission while another is active")
            return False

        self.current_plan = plan
        self.current_waypoint_idx = 0
        self._set_state(MissionState.IDLE)

        logger.info(f"Mission loaded: {plan.name} with {len(plan.waypoints)} waypoints")
        return True

    def run_preflight(self) -> bool:
        """
        Run pre-flight checklist.

        Returns:
            True if preflight passes
        """
        if self.current_plan is None:
            logger.error("No mission loaded")
            return False

        self._set_state(MissionState.PREFLIGHT)

        try:
            from .preflight_checklist import PreFlightChecklist
            checklist = PreFlightChecklist()
            result = checklist.run_full_checklist(skip_manual=self.simulation_mode)

            if result.flight_authorized:
                logger.info(f"Pre-flight passed: {result.authorization_code}")
                return True
            else:
                logger.error(f"Pre-flight failed: {len(result.critical_failures)} critical failures")
                for failure in result.critical_failures:
                    logger.error(f"  - {failure.name}: {failure.message}")
                self._set_state(MissionState.IDLE)
                return False

        except Exception as e:
            logger.error(f"Pre-flight error: {e}")
            self._set_state(MissionState.IDLE)
            return False

    def arm(self) -> bool:
        """
        Arm the system for flight.

        Returns:
            True if armed successfully
        """
        if self.state != MissionState.PREFLIGHT:
            logger.error("Must complete preflight before arming")
            return False

        if self.simulation_mode:
            logger.info("SIMULATION: System armed")
            self._set_state(MissionState.ARMED)
            return True

        # In production, would send arm command to DJI SDK
        # Verify motors armed, GPS lock, etc.
        self._set_state(MissionState.ARMED)
        return True

    def start_mission(self) -> bool:
        """
        Start mission execution.

        Returns:
            True if mission started
        """
        if self.state != MissionState.ARMED:
            logger.error("Must be armed before starting mission")
            return False

        self._running = True
        self.mission_start_time = datetime.now()
        self._mission_thread = threading.Thread(target=self._mission_loop, daemon=True)
        self._mission_thread.start()

        self._set_state(MissionState.EXECUTING)
        return True

    def pause_mission(self):
        """Pause the current mission."""
        if self.state == MissionState.EXECUTING:
            self._set_state(MissionState.PAUSED)
            self._trigger_alert("INFO", "Mission paused")

    def resume_mission(self):
        """Resume paused mission."""
        if self.state == MissionState.PAUSED:
            self._set_state(MissionState.EXECUTING)
            self._trigger_alert("INFO", "Mission resumed")

    def abort_mission(self, trigger_rtl: bool = True):
        """
        Abort the mission.

        Args:
            trigger_rtl: Whether to trigger return-to-home
        """
        self._running = False
        self._set_state(MissionState.ABORTED)
        self._trigger_alert("WARNING", "Mission aborted")

        if trigger_rtl:
            self._execute_rtl()

    def trigger_emergency(self, reason: str):
        """
        Trigger emergency protocols.

        Args:
            reason: Reason for emergency
        """
        self._running = False
        self._set_state(MissionState.EMERGENCY)
        self._trigger_alert("CRITICAL", f"EMERGENCY: {reason}")

        # Immediate RTL
        self._execute_rtl()

    def _mission_loop(self):
        """Main mission execution loop."""
        logger.info("Mission execution started")

        while self._running and self.current_plan:
            try:
                # Check safety conditions
                if not self._check_safety():
                    break

                # Check if paused
                if self.state == MissionState.PAUSED:
                    time.sleep(0.5)
                    continue

                # Execute current waypoint
                if self.current_waypoint_idx < len(self.current_plan.waypoints):
                    waypoint = self.current_plan.waypoints[self.current_waypoint_idx]
                    self._execute_waypoint(waypoint)
                    self.current_waypoint_idx += 1
                else:
                    # Mission complete
                    logger.info("All waypoints completed")
                    break

            except Exception as e:
                logger.error(f"Mission loop error: {e}")
                self._trigger_alert("ERROR", str(e))
                break

        # Mission finished
        if self.state == MissionState.EXECUTING:
            self._set_state(MissionState.RETURNING)
            self._execute_rtl()
            self._set_state(MissionState.COMPLETED)

        logger.info("Mission execution finished")

    def _check_safety(self) -> bool:
        """Check safety conditions during flight."""
        # Battery check
        if self.battery_percent <= self.BATTERY_RTL_PERCENT:
            self._trigger_alert("CRITICAL", f"Battery critical: {self.battery_percent}%")
            self.trigger_emergency("Battery critical")
            return False
        elif self.battery_percent <= self.BATTERY_CRITICAL_PERCENT:
            self._trigger_alert("WARNING", f"Battery low: {self.battery_percent}%")
        elif self.battery_percent <= self.BATTERY_WARNING_PERCENT:
            self._trigger_alert("INFO", f"Battery warning: {self.battery_percent}%")

        # Signal check
        if self.signal_strength_dbm <= self.SIGNAL_CRITICAL_DBM:
            self._trigger_alert("CRITICAL", f"Signal critical: {self.signal_strength_dbm}dBm")
            self.trigger_emergency("Signal lost")
            return False
        elif self.signal_strength_dbm <= self.SIGNAL_WARNING_DBM:
            self._trigger_alert("WARNING", f"Signal weak: {self.signal_strength_dbm}dBm")

        return True

    def _execute_waypoint(self, waypoint: Waypoint):
        """Execute a single waypoint."""
        logger.info(f"Executing waypoint: {waypoint.name or f'WP{self.current_waypoint_idx}'}")

        if self.simulation_mode:
            # Simulate waypoint execution
            self.current_location = waypoint
            time.sleep(2.0)  # Simulate flight time

            # Simulate battery drain
            self.battery_percent = max(0, self.battery_percent - 0.5)

            # Simulate detection
            self._simulate_detection(waypoint)
        else:
            # In production: send waypoint to DJI SDK
            # Wait for arrival, hover, capture, etc.
            pass

        # Process any detections from inference engine
        self._process_detections()

    def _execute_rtl(self):
        """Execute return-to-home."""
        logger.info("Executing Return-to-Home")
        self._set_state(MissionState.RETURNING)

        if self.simulation_mode:
            time.sleep(5.0)  # Simulate RTL
            self._set_state(MissionState.LANDING)
            time.sleep(3.0)  # Simulate landing
        else:
            # In production: trigger DJI RTL
            pass

    def _simulate_detection(self, waypoint: Waypoint):
        """Simulate a detection for testing."""
        import random

        # 30% chance of detection at each waypoint
        if random.random() < 0.3:
            self.total_detections += 1

            # 10% chance of critical
            if random.random() < 0.1:
                self.critical_detections += 1
                self._trigger_alert(
                    "CRITICAL",
                    f"Damaged component detected at {waypoint.lat:.6f}, {waypoint.lon:.6f}"
                )

            detection = {
                'timestamp': datetime.now().isoformat(),
                'location': {'lat': waypoint.lat, 'lon': waypoint.lon, 'alt': waypoint.alt},
                'class': 'insulator' if random.random() > 0.5 else 'tower',
                'confidence': random.uniform(0.7, 0.95)
            }
            self.detection_log.append(detection)

    def _process_detections(self):
        """Process detections from inference engine."""
        if self.inference_engine is None:
            return

        # Process any queued detections
        while True:
            try:
                detection = self._detection_queue.get_nowait()
                self.total_detections += 1
                self.detection_log.append(detection)

                if detection.get('priority') == 'CRITICAL':
                    self.critical_detections += 1
            except Empty:
                break

    def get_status(self) -> MissionStatus:
        """Get current mission status."""
        elapsed = 0.0
        if self.mission_start_time:
            elapsed = (datetime.now() - self.mission_start_time).total_seconds()

        total_wp = len(self.current_plan.waypoints) if self.current_plan else 0

        return MissionStatus(
            state=self.state,
            current_waypoint=self.current_waypoint_idx,
            total_waypoints=total_wp,
            elapsed_time_s=elapsed,
            remaining_time_s=0,  # Would calculate based on remaining waypoints
            distance_traveled_m=0,  # Would calculate from GPS log
            distance_remaining_m=0,
            battery_percent=self.battery_percent,
            critical_detections=self.critical_detections,
            total_detections=self.total_detections,
            current_location=self.current_location
        )

    def get_detection_summary(self) -> Dict:
        """Get detection summary for the mission."""
        return {
            'total_detections': self.total_detections,
            'critical_detections': self.critical_detections,
            'detection_log': self.detection_log[-100:]  # Last 100
        }

    def shutdown(self):
        """Shutdown the mission controller."""
        self._running = False
        if self._mission_thread and self._mission_thread.is_alive():
            self._mission_thread.join(timeout=5.0)
        logger.info("Mission controller shutdown")


# Factory function for creating sample missions
def create_sample_mission(
    name: str = "Tower Inspection",
    center_lat: float = 37.7749,
    center_lon: float = -122.4194,
    num_waypoints: int = 10
) -> MissionPlan:
    """Create a sample inspection mission for testing."""
    import math

    waypoints = []
    radius = 0.001  # ~100m in degrees

    for i in range(num_waypoints):
        angle = (2 * math.pi * i) / num_waypoints
        lat = center_lat + radius * math.cos(angle)
        lon = center_lon + radius * math.sin(angle)

        waypoints.append(Waypoint(
            lat=lat,
            lon=lon,
            alt=50.0,
            name=f"Inspection Point {i+1}"
        ))

    return MissionPlan(
        name=name,
        mission_type=MissionType.TOWER_INSPECTION,
        waypoints=waypoints,
        home_location=Waypoint(lat=center_lat, lon=center_lon, alt=0)
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Test mission controller
    controller = MissionController(enable_simulation=True)

    # Create and load sample mission
    mission = create_sample_mission()
    controller.load_mission(mission)

    # Run preflight
    if controller.run_preflight():
        if controller.arm():
            controller.start_mission()

            # Monitor mission
            while controller.state not in [MissionState.COMPLETED, MissionState.ABORTED]:
                status = controller.get_status()
                print(f"Status: {status.state.name} - WP {status.current_waypoint}/{status.total_waypoints}")
                time.sleep(1)

            print(f"\nMission completed. Detections: {controller.total_detections}")
