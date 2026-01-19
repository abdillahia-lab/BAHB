#!/usr/bin/env python3
"""
BAHB Day-One Operations Launcher

Complete deployment script for power infrastructure inspection missions.
Orchestrates preflight checks, AI inference, flight control, and ground station
communication for production operations on DJI Manifold 3 / Jetson Orin NX.

Usage:
    python scripts/day_one_launcher.py --config configs/day_one_operations.yaml
    python scripts/day_one_launcher.py --simulation  # For testing
"""

import os
import sys
import time
import yaml
import signal
import logging
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from bahb.operations import (
    PreFlightChecklist,
    MissionController,
    ProductionInferenceEngine,
    FlightOperationsManager,
    GroundStationReporter,
    SafetyMonitor,
    SafetyThresholds,
    SafetyLevel,
    SafetyAction
)


class DayOneOperations:
    """
    Main orchestrator for BAHB day-one operations.

    Coordinates all subsystems:
    - Pre-flight checklist
    - AI inference engine
    - Flight operations manager
    - Safety monitor
    - Ground station reporter
    """

    def __init__(
        self,
        config_path: Optional[Path] = None,
        simulation_mode: bool = False,
        verbose: bool = True
    ):
        self.config_path = config_path or PROJECT_ROOT / "configs" / "day_one_operations.yaml"
        self.simulation_mode = simulation_mode
        self.verbose = verbose

        # Load configuration
        self.config = self._load_config()

        # Override simulation if specified
        if simulation_mode:
            self.config["simulation"]["enabled"] = True

        # Setup logging
        self._setup_logging()

        # Initialize components (lazy)
        self._preflight: Optional[PreFlightChecklist] = None
        self._inference: Optional[ProductionInferenceEngine] = None
        self._flight_ops: Optional[FlightOperationsManager] = None
        self._safety: Optional[SafetyMonitor] = None
        self._ground_station: Optional[GroundStationReporter] = None
        self._mission: Optional[MissionController] = None

        # State
        self._running = False
        self._mission_active = False

        # Session info
        self._session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self._start_time: Optional[datetime] = None

        self.logger.info(f"BAHB Day-One Operations initialized (session: {self._session_id})")
        if self.simulation_mode:
            self.logger.warning("Running in SIMULATION MODE - no actual flight control")

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        with open(self.config_path, "r") as f:
            return yaml.safe_load(f)

    def _setup_logging(self):
        """Configure logging for operations."""
        log_level = logging.DEBUG if self.verbose else logging.INFO

        # Create log directory
        log_dir = PROJECT_ROOT / "data" / "operations_logs"
        log_dir.mkdir(parents=True, exist_ok=True)

        # Configure logging
        log_file = log_dir / f"operations_{self._session_id}.log"

        logging.basicConfig(
            level=log_level,
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )

        self.logger = logging.getLogger("BAHB.DayOneOps")

    def _init_components(self):
        """Initialize all operation components."""
        self.logger.info("Initializing components...")

        sim = self.config.get("simulation", {}).get("enabled", False)

        # Safety monitor
        thresholds = self._create_safety_thresholds()
        self._safety = SafetyMonitor(
            thresholds=thresholds,
            simulation_mode=sim
        )

        # Ground station reporter
        gs_config = self.config.get("ground_station", {})
        self._ground_station = GroundStationReporter(
            ground_station_ip=gs_config.get("ip", "127.0.0.1"),
            udp_port=gs_config.get("udp_port", 14550),
            tcp_port=gs_config.get("tcp_port", 14551),
            telemetry_rate_hz=gs_config.get("telemetry_rate_hz", 10),
            simulation_mode=sim
        )

        # Pre-flight checklist
        pf_config = self.config.get("preflight", {}).get("hardware", {})
        self._preflight = PreFlightChecklist(
            min_battery_percent=pf_config.get("min_battery_percent", 80),
            min_storage_gb=pf_config.get("min_storage_gb", 50),
            max_cpu_temp_c=pf_config.get("max_cpu_temp_c", 70),
            min_gps_satellites=pf_config.get("min_gps_satellites", 12),
            simulation_mode=sim
        )

        # Inference engine
        model_config = self.config.get("model", {}).get("primary", {})
        inf_config = self.config.get("inference", {})
        self._inference = ProductionInferenceEngine(
            model_path=PROJECT_ROOT / model_config.get("path", "models/yolo26l_infrastructure.pt"),
            confidence_threshold=model_config.get("confidence_threshold", 0.35),
            device="cuda" if not sim else "cpu",
            priority_map=inf_config.get("priority_map", {}),
            simulation_mode=sim
        )

        # Mission controller
        self._mission = MissionController(
            inference_engine=self._inference,
            safety_monitor=self._safety,
            simulation_mode=sim
        )

        # Flight operations manager
        self._flight_ops = FlightOperationsManager(
            mission_controller=self._mission,
            inference_engine=self._inference,
            safety_monitor=self._safety,
            ground_station=self._ground_station,
            simulation_mode=sim
        )

        # Register safety callbacks
        self._register_safety_callbacks()

        self.logger.info("All components initialized")

    def _create_safety_thresholds(self) -> SafetyThresholds:
        """Create safety thresholds from config."""
        safety_config = self.config.get("safety", {})

        battery = safety_config.get("battery", {})
        temp = safety_config.get("temperature", {})
        signal = safety_config.get("signal", {})
        gps = safety_config.get("gps", {})
        envelope = safety_config.get("flight_envelope", {})
        time_limits = safety_config.get("time_limits", {})

        return SafetyThresholds(
            battery_normal=battery.get("normal", 50),
            battery_caution=battery.get("caution", 30),
            battery_warning=battery.get("warning", 20),
            battery_critical=battery.get("critical", 15),
            battery_emergency=battery.get("emergency", 10),
            cpu_temp_caution=temp.get("cpu_caution", 70),
            cpu_temp_warning=temp.get("cpu_warning", 80),
            cpu_temp_critical=temp.get("cpu_critical", 85),
            gpu_temp_caution=temp.get("gpu_caution", 75),
            gpu_temp_warning=temp.get("gpu_warning", 85),
            gpu_temp_critical=temp.get("gpu_critical", 90),
            signal_caution=signal.get("caution", -80),
            signal_warning=signal.get("warning", -90),
            signal_critical=signal.get("critical", -100),
            min_gps_satellites=gps.get("min_satellites", 8),
            gps_warning_satellites=gps.get("warning_satellites", 6),
            gps_critical_satellites=gps.get("critical_satellites", 4),
            max_gps_hdop=gps.get("max_hdop", 2.0),
            max_altitude_m=envelope.get("max_altitude_m", 120),
            max_speed_mps=envelope.get("max_speed_mps", 15),
            max_distance_from_home_m=envelope.get("max_distance_from_home_m", 2000),
            max_wind_speed_mps=envelope.get("max_wind_speed_mps", 10),
            min_visibility_m=envelope.get("min_visibility_m", 1000),
            max_flight_duration_min=time_limits.get("max_flight_duration", 25),
            max_mission_duration_min=time_limits.get("max_mission_duration", 30)
        )

    def _register_safety_callbacks(self):
        """Register callbacks for safety events."""
        if not self._safety or not self._ground_station:
            return

        def on_safety_alert(level: SafetyLevel, message: str, action: SafetyAction):
            """Handle safety alerts."""
            from bahb.operations.ground_station import AlertLevel

            # Map safety level to alert level
            level_map = {
                SafetyLevel.NORMAL: AlertLevel.INFO,
                SafetyLevel.CAUTION: AlertLevel.INFO,
                SafetyLevel.WARNING: AlertLevel.WARNING,
                SafetyLevel.CRITICAL: AlertLevel.CRITICAL,
                SafetyLevel.EMERGENCY: AlertLevel.EMERGENCY
            }

            self._ground_station.send_alert(
                level=level_map.get(level, AlertLevel.WARNING),
                title=f"Safety Alert: {level.value}",
                message=message,
                data={"recommended_action": action.value}
            )

        self._safety.register_alert_callback(on_safety_alert)

        # Register action callbacks
        def on_rtl_required():
            self.logger.warning("RTL triggered by safety monitor")
            if self._flight_ops:
                self._flight_ops.return_to_home()
            return True

        def on_emergency_land():
            self.logger.critical("EMERGENCY LANDING triggered by safety monitor")
            if self._flight_ops:
                self._flight_ops.emergency_land()
            return True

        self._safety.register_action_callback(SafetyAction.RETURN_TO_HOME, on_rtl_required)
        self._safety.register_action_callback(SafetyAction.EMERGENCY_LAND, on_emergency_land)

    def run_preflight(self) -> bool:
        """Run pre-flight checklist."""
        self.logger.info("=" * 60)
        self.logger.info("RUNNING PRE-FLIGHT CHECKLIST")
        self.logger.info("=" * 60)

        if not self._preflight:
            self._init_components()

        result = self._preflight.run_full_checklist()

        if result.passed:
            self.logger.info("PRE-FLIGHT CHECKLIST PASSED")
            return True
        else:
            self.logger.error("PRE-FLIGHT CHECKLIST FAILED")
            for check in result.checks:
                if check.status.value in ["failed", "warning"]:
                    self.logger.error(f"  - {check.name}: {check.message}")
            return False

    def start(self) -> bool:
        """Start day-one operations."""
        self.logger.info("=" * 60)
        self.logger.info("STARTING BAHB DAY-ONE OPERATIONS")
        self.logger.info("=" * 60)

        try:
            # Initialize components
            self._init_components()

            # Run pre-flight checklist
            if not self.simulation_mode:
                if not self.run_preflight():
                    self.logger.error("Pre-flight failed. Aborting.")
                    return False

            # Start safety monitor
            self._safety.start()
            self.logger.info("Safety monitor started")

            # Start ground station reporter
            self._ground_station.start()
            self.logger.info("Ground station reporter started")

            # Load AI model
            if not self._inference.load_model():
                self.logger.error("Failed to load AI model")
                return False
            self.logger.info("AI model loaded")

            # Initialize flight ops
            if not self._flight_ops.initialize():
                self.logger.error("Failed to initialize flight operations")
                return False
            self.logger.info("Flight operations initialized")

            self._running = True
            self._start_time = datetime.now()

            self.logger.info("=" * 60)
            self.logger.info("BAHB DAY-ONE OPERATIONS READY")
            self.logger.info("=" * 60)

            return True

        except Exception as e:
            self.logger.exception(f"Failed to start operations: {e}")
            return False

    def execute_mission(self, mission_file: Optional[Path] = None) -> bool:
        """Execute an inspection mission."""
        if not self._running:
            self.logger.error("Operations not started. Call start() first.")
            return False

        self.logger.info("=" * 60)
        self.logger.info("EXECUTING INSPECTION MISSION")
        self.logger.info("=" * 60)

        try:
            # Load or create mission
            if mission_file:
                mission = self._mission.load_mission(mission_file)
            else:
                # Create sample mission for simulation
                mission = self._create_sample_mission()

            # Execute mission
            self._mission_active = True
            self._flight_ops.start_mission(mission)

            # Mission monitoring loop
            while self._running and self._mission_active:
                status = self._mission.get_status()

                if status.state.value in ["completed", "aborted"]:
                    self._mission_active = False
                    break

                # Check safety
                if self._safety.is_emergency_landing_required():
                    self.logger.critical("Emergency landing required!")
                    self._flight_ops.emergency_land()
                    self._mission_active = False
                    break

                time.sleep(0.1)

            # Get final status
            final_status = self._mission.get_status()
            self.logger.info(f"Mission ended: {final_status.state.value}")

            return final_status.state.value == "completed"

        except Exception as e:
            self.logger.exception(f"Mission execution error: {e}")
            return False

    def _create_sample_mission(self):
        """Create a sample mission for simulation testing."""
        from bahb.operations.mission_controller import MissionPlan, Waypoint

        waypoints = [
            Waypoint(
                id="WP1",
                latitude=37.7749,
                longitude=-122.4194,
                altitude_m=50,
                speed_mps=5,
                actions=["capture", "inspect"]
            ),
            Waypoint(
                id="WP2",
                latitude=37.7750,
                longitude=-122.4190,
                altitude_m=50,
                speed_mps=5,
                actions=["capture", "inspect"]
            ),
            Waypoint(
                id="WP3",
                latitude=37.7751,
                longitude=-122.4185,
                altitude_m=50,
                speed_mps=5,
                actions=["capture", "inspect"]
            )
        ]

        return MissionPlan(
            mission_id=f"SIM_{self._session_id}",
            name="Simulation Mission",
            waypoints=waypoints,
            home_position=(37.7749, -122.4194, 0),
            rtl_altitude_m=80
        )

    def stop(self):
        """Stop all operations."""
        self.logger.info("Stopping day-one operations...")

        self._running = False
        self._mission_active = False

        # Stop components in reverse order
        if self._flight_ops:
            self._flight_ops.shutdown()

        if self._mission:
            self._mission.abort()

        if self._ground_station:
            self._ground_station.stop()

        if self._safety:
            self._safety.stop()

        # Generate reports
        self._generate_session_report()

        elapsed = None
        if self._start_time:
            elapsed = (datetime.now() - self._start_time).total_seconds() / 60.0

        self.logger.info("=" * 60)
        self.logger.info(f"BAHB DAY-ONE OPERATIONS STOPPED")
        if elapsed:
            self.logger.info(f"Total session time: {elapsed:.1f} minutes")
        self.logger.info("=" * 60)

    def _generate_session_report(self):
        """Generate end-of-session report."""
        report_dir = PROJECT_ROOT / "data" / "session_reports"
        report_dir.mkdir(parents=True, exist_ok=True)

        report = {
            "session_id": self._session_id,
            "start_time": self._start_time.isoformat() if self._start_time else None,
            "end_time": datetime.now().isoformat(),
            "simulation_mode": self.simulation_mode,
            "safety_stats": self._safety.get_stats() if self._safety else {},
            "ground_station_stats": self._ground_station.get_stats() if self._ground_station else {},
            "inference_stats": self._inference.get_stats() if self._inference else {}
        }

        report_file = report_dir / f"session_{self._session_id}.yaml"
        with open(report_file, "w") as f:
            yaml.dump(report, f, default_flow_style=False)

        self.logger.info(f"Session report saved: {report_file}")


def setup_signal_handlers(operations: DayOneOperations):
    """Setup graceful shutdown handlers."""
    def signal_handler(signum, frame):
        print("\nShutdown signal received...")
        operations.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)


def main():
    parser = argparse.ArgumentParser(
        description="BAHB Day-One Operations Launcher",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Production mode:
    python scripts/day_one_launcher.py --config configs/day_one_operations.yaml

  Simulation mode (for testing):
    python scripts/day_one_launcher.py --simulation

  With custom mission file:
    python scripts/day_one_launcher.py --mission missions/tower_inspection.yaml
        """
    )

    parser.add_argument(
        "--config", "-c",
        type=Path,
        default=PROJECT_ROOT / "configs" / "day_one_operations.yaml",
        help="Path to configuration file"
    )
    parser.add_argument(
        "--simulation", "-s",
        action="store_true",
        help="Run in simulation mode (no actual flight control)"
    )
    parser.add_argument(
        "--mission", "-m",
        type=Path,
        help="Path to mission file"
    )
    parser.add_argument(
        "--preflight-only",
        action="store_true",
        help="Run only pre-flight checklist"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        default=True,
        help="Enable verbose logging"
    )

    args = parser.parse_args()

    print("=" * 60)
    print("BAHB - Power Infrastructure AI Inspection System")
    print("Day-One Operations Launcher")
    print("=" * 60)
    print()

    # Create operations instance
    ops = DayOneOperations(
        config_path=args.config,
        simulation_mode=args.simulation,
        verbose=args.verbose
    )

    # Setup signal handlers
    setup_signal_handlers(ops)

    try:
        if args.preflight_only:
            # Run only preflight
            success = ops.run_preflight()
            sys.exit(0 if success else 1)

        # Full operations
        if not ops.start():
            print("Failed to start operations")
            sys.exit(1)

        # Execute mission if specified
        if args.mission or args.simulation:
            success = ops.execute_mission(args.mission)
            ops.stop()
            sys.exit(0 if success else 1)

        # Interactive mode - wait for commands
        print("\nOperations ready. Press Ctrl+C to stop.")
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down...")
        ops.stop()


if __name__ == "__main__":
    main()
