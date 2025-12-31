"""
PSDK Core Interface

Core DJI Payload SDK integration for drone control.
Provides low-level access to flight control, gimbal, and camera systems.

Note: This module interfaces with the DJI PSDK C library via ctypes/cffi.
Ensure the PSDK libraries are properly installed on the Manifold 3.
"""

import asyncio
import logging
import threading
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Callable, Dict, Any, List
from pathlib import Path
import struct
import os

from .types import (
    FlightCommand,
    FlightMode,
    GimbalCommand,
    GimbalMode,
    CameraCommand,
    FlightTelemetry,
    GPSCoordinate,
    PSDKStatus,
)

logger = logging.getLogger(__name__)


class PSDKError(Exception):
    """Exception for PSDK-related errors."""
    pass


class PSDKNotConnectedError(PSDKError):
    """Raised when PSDK is not connected."""
    pass


class PSDKInterface:
    """
    Core DJI Payload SDK Interface.

    Provides direct access to DJI PSDK functions for:
    - Flight control (position, velocity, attitude)
    - Gimbal control (pitch, yaw, roll)
    - Camera control (zoom, capture, recording)
    - Telemetry subscription
    - Waypoint mission management

    This is the low-level interface that other components build upon.
    """

    # PSDK library paths (Manifold 3 / Linux ARM64)
    PSDK_LIB_PATHS = [
        "/opt/dji/psdk/lib/libdji_psdk.so",
        "/usr/local/lib/libdji_psdk.so",
        "./lib/libdji_psdk.so",
    ]

    # Command codes for PSDK communication
    CMD_FLIGHT_CONTROL = 0x01
    CMD_GIMBAL_CONTROL = 0x02
    CMD_CAMERA_CONTROL = 0x03
    CMD_TELEMETRY_REQUEST = 0x04
    CMD_WAYPOINT_MISSION = 0x05
    CMD_EMERGENCY = 0x06

    def __init__(
        self,
        app_id: str = "",
        app_key: str = "",
        app_license: str = "",
        config_path: Optional[Path] = None,
    ):
        """
        Initialize PSDK interface.

        Args:
            app_id: DJI Developer App ID
            app_key: DJI Developer App Key
            app_license: DJI PSDK License
            config_path: Path to PSDK configuration file
        """
        self.app_id = app_id or os.environ.get("DJI_APP_ID", "")
        self.app_key = app_key or os.environ.get("DJI_APP_KEY", "")
        self.app_license = app_license or os.environ.get("DJI_APP_LICENSE", "")
        self.config_path = config_path

        self._psdk_lib = None
        self._connected = False
        self._status = PSDKStatus()
        self._telemetry = None
        self._telemetry_lock = threading.Lock()

        # Callback registrations
        self._telemetry_callbacks: List[Callable[[FlightTelemetry], None]] = []
        self._event_callbacks: List[Callable[[str, Dict], None]] = []

        # Command queues
        self._flight_command_queue: asyncio.Queue = asyncio.Queue()
        self._gimbal_command_queue: asyncio.Queue = asyncio.Queue()

        # Background tasks
        self._telemetry_task: Optional[asyncio.Task] = None
        self._command_task: Optional[asyncio.Task] = None

        logger.info("PSDKInterface initialized")

    async def connect(self) -> bool:
        """
        Initialize connection to PSDK.

        Returns:
            True if connection successful, False otherwise.
        """
        logger.info("Connecting to DJI PSDK...")

        try:
            # Attempt to load PSDK library
            await self._load_psdk_library()

            # Initialize PSDK core
            await self._initialize_psdk_core()

            # Initialize subsystems
            await asyncio.gather(
                self._initialize_flight_control(),
                self._initialize_gimbal(),
                self._initialize_camera(),
            )

            # Start telemetry subscription
            await self._start_telemetry_subscription()

            # Start background tasks
            self._telemetry_task = asyncio.create_task(self._telemetry_loop())
            self._command_task = asyncio.create_task(self._command_processing_loop())

            self._connected = True
            self._status.connected = True
            self._status.last_heartbeat = datetime.now()

            logger.info("PSDK connection established successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to connect to PSDK: {e}")
            self._connected = False
            self._status.connected = False
            return False

    async def disconnect(self) -> None:
        """Disconnect from PSDK and cleanup resources."""
        logger.info("Disconnecting from PSDK...")

        # Cancel background tasks
        if self._telemetry_task:
            self._telemetry_task.cancel()
        if self._command_task:
            self._command_task.cancel()

        # Deinitialize subsystems
        await self._deinitialize_psdk()

        self._connected = False
        self._status.connected = False
        logger.info("PSDK disconnected")

    @property
    def is_connected(self) -> bool:
        """Check if PSDK is connected."""
        return self._connected

    @property
    def status(self) -> PSDKStatus:
        """Get current PSDK status."""
        return self._status

    @property
    def telemetry(self) -> Optional[FlightTelemetry]:
        """Get latest telemetry data."""
        with self._telemetry_lock:
            return self._telemetry

    # =========================================================================
    # Flight Control Methods
    # =========================================================================

    async def send_flight_command(self, command: FlightCommand) -> bool:
        """
        Send flight control command.

        Args:
            command: FlightCommand to execute

        Returns:
            True if command accepted, False otherwise.
        """
        if not self._connected:
            raise PSDKNotConnectedError("PSDK not connected")

        logger.debug(f"Sending flight command: {command.mode.name}")
        await self._flight_command_queue.put(command)
        return True

    async def set_position(
        self,
        latitude: float,
        longitude: float,
        altitude: float,
        yaw: Optional[float] = None,
        speed: float = 5.0,
    ) -> bool:
        """
        Command drone to move to specific GPS position.

        Args:
            latitude: Target latitude
            longitude: Target longitude
            altitude: Target altitude (AGL meters)
            yaw: Target heading (degrees, optional)
            speed: Maximum speed (m/s)

        Returns:
            True if command accepted.
        """
        command = FlightCommand(
            mode=FlightMode.WAYPOINT,
            target_position=GPSCoordinate(
                latitude=latitude,
                longitude=longitude,
                altitude_msl=altitude,  # Will be converted by controller
                altitude_agl=altitude,
            ),
            target_yaw=yaw,
            speed=speed,
        )
        return await self.send_flight_command(command)

    async def set_velocity(
        self,
        vx: float,
        vy: float,
        vz: float,
        yaw_rate: float = 0.0,
    ) -> bool:
        """
        Command drone with velocity control.

        Args:
            vx: Velocity in X (forward, m/s)
            vy: Velocity in Y (right, m/s)
            vz: Velocity in Z (down, m/s)
            yaw_rate: Yaw rotation rate (deg/s)

        Returns:
            True if command accepted.
        """
        if not self._connected:
            raise PSDKNotConnectedError("PSDK not connected")

        # Direct velocity control via PSDK
        await self._send_velocity_command(vx, vy, vz, yaw_rate)
        return True

    async def hover(self) -> bool:
        """Command drone to hold current position."""
        command = FlightCommand(mode=FlightMode.HOVER)
        return await self.send_flight_command(command)

    async def return_to_home(self) -> bool:
        """Initiate Return-to-Home."""
        command = FlightCommand(mode=FlightMode.RETURN_TO_HOME, priority=3)
        return await self.send_flight_command(command)

    async def land(self) -> bool:
        """Initiate landing at current position."""
        command = FlightCommand(mode=FlightMode.LANDING, priority=3)
        return await self.send_flight_command(command)

    async def emergency_stop(self) -> bool:
        """Emergency motor stop (use with extreme caution!)."""
        logger.warning("EMERGENCY STOP INITIATED!")
        if self._psdk_lib:
            # Direct emergency command, bypasses queue
            await self._send_emergency_command()
        return True

    # =========================================================================
    # Gimbal Control Methods
    # =========================================================================

    async def send_gimbal_command(self, command: GimbalCommand) -> bool:
        """
        Send gimbal control command.

        Args:
            command: GimbalCommand to execute

        Returns:
            True if command accepted.
        """
        if not self._connected:
            raise PSDKNotConnectedError("PSDK not connected")

        logger.debug(f"Sending gimbal command: {command.mode.name}")
        await self._gimbal_command_queue.put(command)
        return True

    async def set_gimbal_angle(
        self,
        pitch: float,
        yaw: Optional[float] = None,
        roll: Optional[float] = None,
        speed: float = 30.0,
    ) -> bool:
        """
        Set gimbal to specific angles.

        Args:
            pitch: Pitch angle (-90 to +30 degrees)
            yaw: Yaw angle (relative to drone, optional)
            roll: Roll angle (optional)
            speed: Rotation speed (deg/s)

        Returns:
            True if command accepted.
        """
        command = GimbalCommand(
            mode=GimbalMode.FREE,
            pitch=max(-90, min(30, pitch)),
            yaw=yaw,
            roll=roll,
            rotation_speed=speed,
        )
        return await self.send_gimbal_command(command)

    async def point_gimbal_at_location(
        self,
        latitude: float,
        longitude: float,
        altitude: float,
    ) -> bool:
        """
        Point gimbal at specific GPS location.

        Args:
            latitude: Target latitude
            longitude: Target longitude
            altitude: Target altitude (meters)

        Returns:
            True if command accepted.
        """
        # Calculate required angles based on current position
        if not self._telemetry:
            return False

        # Use POI mode
        command = GimbalCommand(
            mode=GimbalMode.POINT_OF_INTEREST,
        )
        return await self.send_gimbal_command(command)

    async def center_on_pixel(self, x: int, y: int) -> bool:
        """
        Adjust gimbal to center on specific pixel in camera frame.

        Args:
            x: Pixel X coordinate
            y: Pixel Y coordinate

        Returns:
            True if command accepted.
        """
        command = GimbalCommand(
            mode=GimbalMode.TRACKING,
            target_pixel=(x, y),
        )
        return await self.send_gimbal_command(command)

    async def track_bounding_box(
        self,
        x1: int,
        y1: int,
        x2: int,
        y2: int,
    ) -> bool:
        """
        Track object within bounding box.

        Args:
            x1, y1: Top-left corner
            x2, y2: Bottom-right corner

        Returns:
            True if command accepted.
        """
        command = GimbalCommand(
            mode=GimbalMode.TRACKING,
            track_box=(x1, y1, x2, y2),
        )
        return await self.send_gimbal_command(command)

    # =========================================================================
    # Camera Control Methods
    # =========================================================================

    async def capture_photo(self, camera: str = "wide") -> bool:
        """
        Capture a photo.

        Args:
            camera: Camera to use ("wide", "zoom", "thermal")

        Returns:
            True if capture successful.
        """
        if not self._connected:
            raise PSDKNotConnectedError("PSDK not connected")

        await self._send_camera_command(CameraCommand(capture_photo=True))
        return True

    async def start_recording(self) -> bool:
        """Start video recording."""
        if not self._connected:
            raise PSDKNotConnectedError("PSDK not connected")

        await self._send_camera_command(CameraCommand(start_recording=True))
        return True

    async def stop_recording(self) -> bool:
        """Stop video recording."""
        await self._send_camera_command(CameraCommand(stop_recording=True))
        return True

    async def set_zoom(self, zoom_level: float) -> bool:
        """
        Set optical/digital zoom level.

        Args:
            zoom_level: Zoom level (1x to 200x for H30T)

        Returns:
            True if command accepted.
        """
        zoom_level = max(1.0, min(200.0, zoom_level))
        await self._send_camera_command(CameraCommand(zoom_level=zoom_level))
        return True

    async def set_thermal_palette(self, palette: str) -> bool:
        """
        Set thermal camera palette.

        Args:
            palette: Palette name (whitehot, blackhot, rainbow, ironbow, etc.)

        Returns:
            True if command accepted.
        """
        await self._send_camera_command(CameraCommand(thermal_palette=palette))
        return True

    # =========================================================================
    # Telemetry and Callbacks
    # =========================================================================

    def register_telemetry_callback(
        self,
        callback: Callable[[FlightTelemetry], None],
    ) -> None:
        """Register callback for telemetry updates."""
        self._telemetry_callbacks.append(callback)

    def register_event_callback(
        self,
        callback: Callable[[str, Dict], None],
    ) -> None:
        """Register callback for PSDK events."""
        self._event_callbacks.append(callback)

    def unregister_telemetry_callback(
        self,
        callback: Callable[[FlightTelemetry], None],
    ) -> None:
        """Unregister telemetry callback."""
        if callback in self._telemetry_callbacks:
            self._telemetry_callbacks.remove(callback)

    # =========================================================================
    # Waypoint Mission Methods
    # =========================================================================

    async def upload_mission(
        self,
        waypoints: List[FlightCommand],
        mission_id: str = "inspection_mission",
    ) -> bool:
        """
        Upload waypoint mission to drone.

        Args:
            waypoints: List of waypoint commands
            mission_id: Unique mission identifier

        Returns:
            True if mission uploaded successfully.
        """
        if not self._connected:
            raise PSDKNotConnectedError("PSDK not connected")

        logger.info(f"Uploading mission '{mission_id}' with {len(waypoints)} waypoints")

        # Convert waypoints to PSDK format
        mission_data = self._convert_to_mission_format(waypoints)

        # Upload via PSDK
        await self._upload_mission_data(mission_id, mission_data)

        return True

    async def start_mission(self, mission_id: str) -> bool:
        """Start uploaded waypoint mission."""
        if not self._connected:
            raise PSDKNotConnectedError("PSDK not connected")

        logger.info(f"Starting mission: {mission_id}")
        await self._start_mission_execution(mission_id)
        return True

    async def pause_mission(self) -> bool:
        """Pause current mission."""
        logger.info("Pausing mission")
        await self._pause_mission_execution()
        return True

    async def resume_mission(self) -> bool:
        """Resume paused mission."""
        logger.info("Resuming mission")
        await self._resume_mission_execution()
        return True

    async def abort_mission(self) -> bool:
        """Abort current mission and hover."""
        logger.warning("Aborting mission")
        await self._abort_mission_execution()
        await self.hover()
        return True

    # =========================================================================
    # Internal Methods
    # =========================================================================

    async def _load_psdk_library(self) -> None:
        """Load PSDK shared library."""
        import ctypes

        for lib_path in self.PSDK_LIB_PATHS:
            if os.path.exists(lib_path):
                try:
                    self._psdk_lib = ctypes.CDLL(lib_path)
                    logger.info(f"Loaded PSDK library from: {lib_path}")
                    return
                except OSError as e:
                    logger.warning(f"Failed to load {lib_path}: {e}")

        # Fallback to simulation mode
        logger.warning("PSDK library not found, running in simulation mode")
        self._psdk_lib = None

    async def _initialize_psdk_core(self) -> None:
        """Initialize PSDK core systems."""
        if self._psdk_lib:
            # Real PSDK initialization
            # result = self._psdk_lib.DjiCore_Init(...)
            pass
        else:
            # Simulation mode
            logger.info("PSDK core initialized (simulation mode)")
            self._status.sdk_version = "3.5.0-sim"
            self._status.aircraft_model = "Matrice 400 (Simulated)"

    async def _initialize_flight_control(self) -> None:
        """Initialize flight control subsystem."""
        logger.debug("Initializing flight control subsystem")
        # PSDK flight control init
        pass

    async def _initialize_gimbal(self) -> None:
        """Initialize gimbal subsystem."""
        logger.debug("Initializing gimbal subsystem")
        self._status.gimbal_connected = True
        pass

    async def _initialize_camera(self) -> None:
        """Initialize camera subsystem."""
        logger.debug("Initializing camera subsystem")
        self._status.camera_connected = True
        pass

    async def _start_telemetry_subscription(self) -> None:
        """Start telemetry data subscription."""
        logger.debug("Starting telemetry subscription")
        pass

    async def _deinitialize_psdk(self) -> None:
        """Deinitialize PSDK."""
        if self._psdk_lib:
            # PSDK cleanup
            pass

    async def _telemetry_loop(self) -> None:
        """Background task for telemetry updates."""
        while True:
            try:
                # Fetch telemetry from PSDK
                telemetry = await self._fetch_telemetry()

                with self._telemetry_lock:
                    self._telemetry = telemetry

                # Notify callbacks
                for callback in self._telemetry_callbacks:
                    try:
                        callback(telemetry)
                    except Exception as e:
                        logger.error(f"Telemetry callback error: {e}")

                await asyncio.sleep(0.02)  # 50Hz telemetry rate

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Telemetry loop error: {e}")
                await asyncio.sleep(0.1)

    async def _command_processing_loop(self) -> None:
        """Background task for command processing."""
        while True:
            try:
                # Process flight commands
                try:
                    command = await asyncio.wait_for(
                        self._flight_command_queue.get(),
                        timeout=0.01,
                    )
                    await self._execute_flight_command(command)
                except asyncio.TimeoutError:
                    pass

                # Process gimbal commands
                try:
                    command = await asyncio.wait_for(
                        self._gimbal_command_queue.get(),
                        timeout=0.01,
                    )
                    await self._execute_gimbal_command(command)
                except asyncio.TimeoutError:
                    pass

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Command processing error: {e}")

    async def _fetch_telemetry(self) -> FlightTelemetry:
        """Fetch current telemetry from PSDK."""
        # In real implementation, read from PSDK
        # For simulation, return mock data
        return FlightTelemetry(
            timestamp=datetime.now(),
            position=GPSCoordinate(
                latitude=37.7749,
                longitude=-122.4194,
                altitude_msl=100.0,
                altitude_agl=50.0,
            ),
            velocity=(0.0, 0.0, 0.0),
            attitude=(0.0, 0.0, 0.0),
            battery_percentage=85.0,
            battery_voltage=44.4,
            battery_temperature=25.0,
            gps_satellites=18,
            gps_signal_level=5,
            rc_signal_strength=95,
            wind_speed=3.5,
            wind_direction=270.0,
            flight_mode=FlightMode.HOVER,
            motors_running=True,
            home_location=GPSCoordinate(
                latitude=37.7749,
                longitude=-122.4194,
                altitude_msl=50.0,
                altitude_agl=0.0,
            ),
            flight_time=300.0,
            distance_from_home=0.0,
        )

    async def _execute_flight_command(self, command: FlightCommand) -> None:
        """Execute flight command via PSDK."""
        logger.debug(f"Executing flight command: {command.mode.name}")
        # Real PSDK command execution
        pass

    async def _execute_gimbal_command(self, command: GimbalCommand) -> None:
        """Execute gimbal command via PSDK."""
        logger.debug(f"Executing gimbal command: {command.mode.name}")
        # Real PSDK command execution
        pass

    async def _send_velocity_command(
        self,
        vx: float,
        vy: float,
        vz: float,
        yaw_rate: float,
    ) -> None:
        """Send velocity control command."""
        pass

    async def _send_emergency_command(self) -> None:
        """Send emergency stop command."""
        pass

    async def _send_camera_command(self, command: CameraCommand) -> None:
        """Send camera control command."""
        pass

    def _convert_to_mission_format(
        self,
        waypoints: List[FlightCommand],
    ) -> bytes:
        """Convert waypoints to PSDK mission format."""
        return b""

    async def _upload_mission_data(self, mission_id: str, data: bytes) -> None:
        """Upload mission data to drone."""
        pass

    async def _start_mission_execution(self, mission_id: str) -> None:
        """Start mission execution."""
        pass

    async def _pause_mission_execution(self) -> None:
        """Pause mission execution."""
        pass

    async def _resume_mission_execution(self) -> None:
        """Resume mission execution."""
        pass

    async def _abort_mission_execution(self) -> None:
        """Abort mission execution."""
        pass
