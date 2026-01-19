"""
Flight Operations Manager for Day-One Operations

Coordinates all flight-related systems for safe and effective
power infrastructure inspection missions.
"""

import os
import time
import json
import logging
import threading
from enum import Enum, auto
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any, Tuple
from datetime import datetime, timedelta
from pathlib import Path

logger = logging.getLogger(__name__)


class FlightPhase(Enum):
    """Current phase of flight operations."""
    GROUND_IDLE = auto()
    PREFLIGHT_CHECK = auto()
    ENGINE_START = auto()
    TAXI = auto()
    TAKEOFF = auto()
    CLIMB = auto()
    CRUISE = auto()
    INSPECTION = auto()
    DESCENT = auto()
    APPROACH = auto()
    LANDING = auto()
    SHUTDOWN = auto()
    EMERGENCY = auto()


class SystemHealth(Enum):
    """Health status of systems."""
    NOMINAL = auto()
    DEGRADED = auto()
    CRITICAL = auto()
    FAILED = auto()


@dataclass
class FlightTelemetry:
    """Real-time flight telemetry data."""
    timestamp: datetime
    # Position
    latitude: float
    longitude: float
    altitude_msl: float
    altitude_agl: float
    # Attitude
    roll: float
    pitch: float
    yaw: float
    # Velocity
    groundspeed_ms: float
    vertical_speed_ms: float
    # Aircraft state
    battery_percent: float
    battery_voltage: float
    battery_current: float
    battery_temp_c: float
    # Signal
    rc_signal_percent: int
    video_signal_percent: int
    gps_satellites: int
    gps_hdop: float
    # Gimbal
    gimbal_pitch: float
    gimbal_roll: float
    gimbal_yaw: float
    # System
    cpu_temp_c: float
    gpu_temp_c: float
    storage_free_gb: float

    def to_dict(self) -> Dict:
        return {
            'timestamp': self.timestamp.isoformat(),
            'position': {
                'lat': self.latitude,
                'lon': self.longitude,
                'alt_msl': self.altitude_msl,
                'alt_agl': self.altitude_agl
            },
            'attitude': {
                'roll': self.roll,
                'pitch': self.pitch,
                'yaw': self.yaw
            },
            'velocity': {
                'groundspeed_ms': self.groundspeed_ms,
                'vertical_ms': self.vertical_speed_ms
            },
            'battery': {
                'percent': self.battery_percent,
                'voltage': self.battery_voltage,
                'current': self.battery_current,
                'temp_c': self.battery_temp_c
            },
            'signal': {
                'rc_percent': self.rc_signal_percent,
                'video_percent': self.video_signal_percent,
                'gps_sats': self.gps_satellites,
                'gps_hdop': self.gps_hdop
            }
        }


@dataclass
class SafetyStatus:
    """Aggregated safety status."""
    overall: SystemHealth
    battery: SystemHealth
    signal: SystemHealth
    gps: SystemHealth
    thermal: SystemHealth
    inference: SystemHealth
    messages: List[str] = field(default_factory=list)

    def is_safe_to_fly(self) -> bool:
        return self.overall in [SystemHealth.NOMINAL, SystemHealth.DEGRADED]

    def is_rtl_required(self) -> bool:
        return self.overall in [SystemHealth.CRITICAL, SystemHealth.FAILED]


class FlightOperationsManager:
    """
    Flight Operations Manager for power infrastructure inspection.

    Coordinates:
    - Pre-flight preparation and checklists
    - Takeoff and landing sequences
    - Real-time telemetry monitoring
    - Safety system integration
    - Emergency response protocols
    - Post-flight reporting
    """

    # Operational limits
    LIMITS = {
        'max_altitude_agl_m': 120,
        'max_distance_m': 5000,
        'max_speed_ms': 15,
        'min_battery_percent': 20,
        'min_satellites': 10,
        'max_wind_ms': 10,
        'max_temp_c': 45,
        'min_temp_c': -10
    }

    def __init__(
        self,
        mission_controller=None,
        inference_engine=None,
        simulation_mode: bool = True,
        data_dir: str = '/home/user/BAHB/data/flights'
    ):
        """
        Initialize Flight Operations Manager.

        Args:
            mission_controller: MissionController instance
            inference_engine: ProductionInferenceEngine instance
            simulation_mode: Enable simulation (no actual flight control)
            data_dir: Directory for flight data storage
        """
        self.mission_controller = mission_controller
        self.inference_engine = inference_engine
        self.simulation_mode = simulation_mode
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

        # State
        self.phase = FlightPhase.GROUND_IDLE
        self.flight_id: Optional[str] = None
        self.flight_start: Optional[datetime] = None
        self.telemetry: Optional[FlightTelemetry] = None
        self.safety_status = SafetyStatus(
            overall=SystemHealth.NOMINAL,
            battery=SystemHealth.NOMINAL,
            signal=SystemHealth.NOMINAL,
            gps=SystemHealth.NOMINAL,
            thermal=SystemHealth.NOMINAL,
            inference=SystemHealth.NOMINAL
        )

        # Data logging
        self.telemetry_log: List[FlightTelemetry] = []
        self.event_log: List[Dict] = []

        # Thread management
        self._running = False
        self._telemetry_thread: Optional[threading.Thread] = None
        self._safety_thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

        # Callbacks
        self._phase_callbacks: List[Callable[[FlightPhase], None]] = []
        self._telemetry_callbacks: List[Callable[[FlightTelemetry], None]] = []
        self._safety_callbacks: List[Callable[[SafetyStatus], None]] = []

        logger.info(f"Flight Operations Manager initialized (simulation: {simulation_mode})")

    def register_phase_callback(self, callback: Callable[[FlightPhase], None]):
        """Register callback for phase changes."""
        self._phase_callbacks.append(callback)

    def register_telemetry_callback(self, callback: Callable[[FlightTelemetry], None]):
        """Register callback for telemetry updates."""
        self._telemetry_callbacks.append(callback)

    def register_safety_callback(self, callback: Callable[[SafetyStatus], None]):
        """Register callback for safety status changes."""
        self._safety_callbacks.append(callback)

    def _set_phase(self, phase: FlightPhase):
        """Set current flight phase."""
        old_phase = self.phase
        self.phase = phase
        self._log_event('phase_change', {'from': old_phase.name, 'to': phase.name})
        logger.info(f"Flight phase: {old_phase.name} -> {phase.name}")

        for callback in self._phase_callbacks:
            try:
                callback(phase)
            except Exception as e:
                logger.warning(f"Phase callback error: {e}")

    def _log_event(self, event_type: str, data: Dict):
        """Log a flight event."""
        event = {
            'timestamp': datetime.now().isoformat(),
            'type': event_type,
            'phase': self.phase.name,
            'data': data
        }
        self.event_log.append(event)

    # ========== Flight Phases ==========

    def initialize_flight(self) -> str:
        """
        Initialize a new flight session.

        Returns:
            Flight ID for this session
        """
        self.flight_id = f"BAHB-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.flight_start = datetime.now()
        self.telemetry_log = []
        self.event_log = []

        self._set_phase(FlightPhase.GROUND_IDLE)
        self._log_event('flight_initialized', {'flight_id': self.flight_id})

        # Create flight directory
        flight_dir = self.data_dir / self.flight_id
        flight_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Flight initialized: {self.flight_id}")
        return self.flight_id

    def run_preflight_sequence(self) -> Tuple[bool, List[str]]:
        """
        Run complete pre-flight sequence.

        Returns:
            Tuple of (success, list of messages)
        """
        self._set_phase(FlightPhase.PREFLIGHT_CHECK)
        messages = []

        # Run checklist
        try:
            from .preflight_checklist import PreFlightChecklist
            checklist = PreFlightChecklist()
            result = checklist.run_full_checklist(skip_manual=self.simulation_mode)

            if result.flight_authorized:
                messages.append(f"Pre-flight passed: {result.authorization_code}")
                self._log_event('preflight_passed', {
                    'auth_code': result.authorization_code,
                    'checks_passed': result.passed_checks
                })
                return True, messages
            else:
                for failure in result.critical_failures:
                    messages.append(f"FAILED: {failure.name} - {failure.message}")
                self._log_event('preflight_failed', {
                    'failures': [f.name for f in result.critical_failures]
                })
                self._set_phase(FlightPhase.GROUND_IDLE)
                return False, messages

        except Exception as e:
            messages.append(f"Pre-flight error: {e}")
            self._set_phase(FlightPhase.GROUND_IDLE)
            return False, messages

    def start_engines(self) -> bool:
        """Start systems and arm for flight."""
        if self.phase != FlightPhase.PREFLIGHT_CHECK:
            logger.error("Must complete preflight before starting engines")
            return False

        self._set_phase(FlightPhase.ENGINE_START)

        # Start monitoring threads
        self._running = True
        self._telemetry_thread = threading.Thread(target=self._telemetry_loop, daemon=True)
        self._safety_thread = threading.Thread(target=self._safety_loop, daemon=True)
        self._telemetry_thread.start()
        self._safety_thread.start()

        if self.simulation_mode:
            logger.info("SIMULATION: Engines started")
            time.sleep(1.0)

        self._log_event('engines_started', {})
        return True

    def takeoff(self, target_altitude: float = 30.0) -> bool:
        """
        Execute takeoff sequence.

        Args:
            target_altitude: Target altitude AGL in meters

        Returns:
            True if takeoff successful
        """
        if self.phase != FlightPhase.ENGINE_START:
            logger.error("Must start engines before takeoff")
            return False

        self._set_phase(FlightPhase.TAKEOFF)
        self._log_event('takeoff_initiated', {'target_alt': target_altitude})

        if self.simulation_mode:
            logger.info(f"SIMULATION: Taking off to {target_altitude}m")
            time.sleep(3.0)
            self._set_phase(FlightPhase.CLIMB)
            time.sleep(2.0)

        self._set_phase(FlightPhase.CRUISE)
        self._log_event('takeoff_complete', {'altitude': target_altitude})
        return True

    def begin_inspection(self) -> bool:
        """Begin inspection phase."""
        if self.phase not in [FlightPhase.CRUISE, FlightPhase.CLIMB]:
            logger.error("Must be airborne to begin inspection")
            return False

        self._set_phase(FlightPhase.INSPECTION)
        self._log_event('inspection_started', {})

        # Start mission controller if available
        if self.mission_controller:
            self.mission_controller.start_mission()

        return True

    def return_to_home(self, reason: str = "Normal RTL"):
        """
        Initiate return-to-home.

        Args:
            reason: Reason for RTL
        """
        self._set_phase(FlightPhase.DESCENT)
        self._log_event('rtl_initiated', {'reason': reason})
        logger.info(f"RTL initiated: {reason}")

        if self.simulation_mode:
            time.sleep(5.0)
            self._set_phase(FlightPhase.APPROACH)
            time.sleep(3.0)
            self._set_phase(FlightPhase.LANDING)
            time.sleep(3.0)

        self._set_phase(FlightPhase.SHUTDOWN)
        self._log_event('rtl_complete', {})

    def emergency_land(self, reason: str):
        """
        Execute emergency landing.

        Args:
            reason: Reason for emergency
        """
        self._set_phase(FlightPhase.EMERGENCY)
        self._log_event('emergency_landing', {'reason': reason})
        logger.critical(f"EMERGENCY LANDING: {reason}")

        if self.simulation_mode:
            time.sleep(5.0)

        self._set_phase(FlightPhase.SHUTDOWN)

    def shutdown_flight(self) -> Dict:
        """
        Shutdown flight and generate report.

        Returns:
            Flight summary report
        """
        self._running = False
        self._set_phase(FlightPhase.SHUTDOWN)

        # Wait for threads to stop
        if self._telemetry_thread:
            self._telemetry_thread.join(timeout=2.0)
        if self._safety_thread:
            self._safety_thread.join(timeout=2.0)

        # Generate report
        report = self._generate_flight_report()

        # Save data
        self._save_flight_data(report)

        self._log_event('flight_shutdown', {'report': report})
        logger.info(f"Flight {self.flight_id} shutdown complete")

        return report

    # ========== Monitoring Loops ==========

    def _telemetry_loop(self):
        """Continuous telemetry monitoring loop."""
        while self._running:
            try:
                telemetry = self._read_telemetry()
                if telemetry:
                    with self._lock:
                        self.telemetry = telemetry
                        self.telemetry_log.append(telemetry)

                    # Trigger callbacks
                    for callback in self._telemetry_callbacks:
                        try:
                            callback(telemetry)
                        except:
                            pass

                time.sleep(0.1)  # 10Hz update rate

            except Exception as e:
                logger.warning(f"Telemetry loop error: {e}")
                time.sleep(1.0)

    def _safety_loop(self):
        """Continuous safety monitoring loop."""
        while self._running:
            try:
                status = self._evaluate_safety()
                old_overall = self.safety_status.overall

                with self._lock:
                    self.safety_status = status

                # Check for safety state changes
                if status.overall != old_overall:
                    self._log_event('safety_change', {
                        'from': old_overall.name,
                        'to': status.overall.name,
                        'messages': status.messages
                    })

                    for callback in self._safety_callbacks:
                        try:
                            callback(status)
                        except:
                            pass

                # Auto-RTL on critical
                if status.is_rtl_required() and self.phase == FlightPhase.INSPECTION:
                    self.return_to_home(f"Safety: {', '.join(status.messages)}")

                time.sleep(0.5)  # 2Hz safety check

            except Exception as e:
                logger.warning(f"Safety loop error: {e}")
                time.sleep(1.0)

    def _read_telemetry(self) -> Optional[FlightTelemetry]:
        """Read current telemetry (simulated or from SDK)."""
        if self.simulation_mode:
            import random
            return FlightTelemetry(
                timestamp=datetime.now(),
                latitude=37.7749 + random.uniform(-0.001, 0.001),
                longitude=-122.4194 + random.uniform(-0.001, 0.001),
                altitude_msl=50.0 + random.uniform(-2, 2),
                altitude_agl=50.0 + random.uniform(-2, 2),
                roll=random.uniform(-5, 5),
                pitch=random.uniform(-5, 5),
                yaw=random.uniform(0, 360),
                groundspeed_ms=5.0 + random.uniform(-1, 1),
                vertical_speed_ms=random.uniform(-0.5, 0.5),
                battery_percent=max(0, 85 - len(self.telemetry_log) * 0.01),
                battery_voltage=22.2 + random.uniform(-0.5, 0.5),
                battery_current=15.0 + random.uniform(-2, 2),
                battery_temp_c=35.0 + random.uniform(-2, 2),
                rc_signal_percent=95 + random.randint(-5, 5),
                video_signal_percent=90 + random.randint(-10, 10),
                gps_satellites=18 + random.randint(-3, 3),
                gps_hdop=1.0 + random.uniform(-0.3, 0.3),
                gimbal_pitch=-45.0,
                gimbal_roll=0.0,
                gimbal_yaw=0.0,
                cpu_temp_c=55.0 + random.uniform(-5, 5),
                gpu_temp_c=60.0 + random.uniform(-5, 5),
                storage_free_gb=100.0 - len(self.telemetry_log) * 0.001
            )
        else:
            # In production: read from DJI SDK
            return None

    def _evaluate_safety(self) -> SafetyStatus:
        """Evaluate current safety status."""
        messages = []
        statuses = {
            'battery': SystemHealth.NOMINAL,
            'signal': SystemHealth.NOMINAL,
            'gps': SystemHealth.NOMINAL,
            'thermal': SystemHealth.NOMINAL,
            'inference': SystemHealth.NOMINAL
        }

        if self.telemetry:
            # Battery
            if self.telemetry.battery_percent < 15:
                statuses['battery'] = SystemHealth.CRITICAL
                messages.append(f"Battery critical: {self.telemetry.battery_percent}%")
            elif self.telemetry.battery_percent < 25:
                statuses['battery'] = SystemHealth.DEGRADED
                messages.append(f"Battery low: {self.telemetry.battery_percent}%")

            # Signal
            if self.telemetry.rc_signal_percent < 30:
                statuses['signal'] = SystemHealth.CRITICAL
                messages.append(f"Signal critical: {self.telemetry.rc_signal_percent}%")
            elif self.telemetry.rc_signal_percent < 60:
                statuses['signal'] = SystemHealth.DEGRADED

            # GPS
            if self.telemetry.gps_satellites < 8:
                statuses['gps'] = SystemHealth.CRITICAL
                messages.append(f"GPS degraded: {self.telemetry.gps_satellites} sats")
            elif self.telemetry.gps_satellites < 12:
                statuses['gps'] = SystemHealth.DEGRADED

            # Thermal
            if self.telemetry.cpu_temp_c > 85 or self.telemetry.gpu_temp_c > 90:
                statuses['thermal'] = SystemHealth.CRITICAL
                messages.append("System overheating")
            elif self.telemetry.cpu_temp_c > 75 or self.telemetry.gpu_temp_c > 80:
                statuses['thermal'] = SystemHealth.DEGRADED

        # Determine overall status
        if any(s == SystemHealth.CRITICAL for s in statuses.values()):
            overall = SystemHealth.CRITICAL
        elif any(s == SystemHealth.DEGRADED for s in statuses.values()):
            overall = SystemHealth.DEGRADED
        else:
            overall = SystemHealth.NOMINAL

        return SafetyStatus(
            overall=overall,
            battery=statuses['battery'],
            signal=statuses['signal'],
            gps=statuses['gps'],
            thermal=statuses['thermal'],
            inference=statuses['inference'],
            messages=messages
        )

    # ========== Reporting ==========

    def _generate_flight_report(self) -> Dict:
        """Generate flight summary report."""
        duration = (datetime.now() - self.flight_start).total_seconds() if self.flight_start else 0

        # Calculate stats from telemetry log
        max_alt = 0
        max_speed = 0
        min_battery = 100
        total_distance = 0

        if self.telemetry_log:
            max_alt = max(t.altitude_agl for t in self.telemetry_log)
            max_speed = max(t.groundspeed_ms for t in self.telemetry_log)
            min_battery = min(t.battery_percent for t in self.telemetry_log)

        # Detection stats
        detection_stats = {}
        if self.mission_controller:
            detection_stats = self.mission_controller.get_detection_summary()

        return {
            'flight_id': self.flight_id,
            'start_time': self.flight_start.isoformat() if self.flight_start else None,
            'duration_s': duration,
            'duration_formatted': str(timedelta(seconds=int(duration))),
            'statistics': {
                'max_altitude_m': max_alt,
                'max_speed_ms': max_speed,
                'min_battery_percent': min_battery,
                'total_distance_m': total_distance,
                'telemetry_points': len(self.telemetry_log),
                'events_logged': len(self.event_log)
            },
            'detections': detection_stats,
            'safety_summary': {
                'final_status': self.safety_status.overall.name,
                'messages': self.safety_status.messages
            }
        }

    def _save_flight_data(self, report: Dict):
        """Save flight data to disk."""
        if not self.flight_id:
            return

        flight_dir = self.data_dir / self.flight_id

        # Save report
        with open(flight_dir / 'report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)

        # Save telemetry log
        telemetry_data = [t.to_dict() for t in self.telemetry_log[-10000:]]  # Last 10k points
        with open(flight_dir / 'telemetry.json', 'w') as f:
            json.dump(telemetry_data, f, indent=2)

        # Save event log
        with open(flight_dir / 'events.json', 'w') as f:
            json.dump(self.event_log, f, indent=2)

        logger.info(f"Flight data saved to {flight_dir}")

    def get_current_status(self) -> Dict:
        """Get current flight status."""
        return {
            'flight_id': self.flight_id,
            'phase': self.phase.name,
            'safety': {
                'overall': self.safety_status.overall.name,
                'safe_to_fly': self.safety_status.is_safe_to_fly(),
                'messages': self.safety_status.messages
            },
            'telemetry': self.telemetry.to_dict() if self.telemetry else None
        }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Test flight operations
    ops = FlightOperationsManager(simulation_mode=True)

    # Initialize flight
    flight_id = ops.initialize_flight()
    print(f"Flight: {flight_id}")

    # Run preflight
    success, messages = ops.run_preflight_sequence()
    for msg in messages:
        print(f"  {msg}")

    if success:
        ops.start_engines()
        ops.takeoff(50.0)
        ops.begin_inspection()

        # Simulate inspection
        time.sleep(5)

        ops.return_to_home("Test complete")
        report = ops.shutdown_flight()
        print(f"\nFlight Report: {json.dumps(report, indent=2)}")
