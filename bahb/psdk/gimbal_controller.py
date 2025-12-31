"""
Gimbal Controller for Defect Inspection

Intelligent gimbal control for optimal defect imaging:
- Auto-centering on detected defects
- Smooth tracking during flight adjustments
- Multi-camera coordination (wide, zoom, thermal)
- Optimal angle calculation for surface defects
"""

import asyncio
import logging
import math
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Tuple, Callable
from enum import Enum, auto

from .core import PSDKInterface
from .types import (
    GimbalCommand,
    GimbalMode,
    CameraCommand,
    DefectLocation,
    GPSCoordinate,
    FlightTelemetry,
)

logger = logging.getLogger(__name__)


class CameraMode(Enum):
    """Active camera modes for H30T."""
    WIDE = auto()      # Wide-angle visual
    ZOOM = auto()      # Optical zoom visual
    THERMAL = auto()   # Thermal infrared
    SPLIT = auto()     # Side-by-side view


@dataclass
class GimbalState:
    """Current gimbal state."""
    pitch: float = 0.0      # degrees (-90 to +30)
    yaw: float = 0.0        # degrees (relative to drone heading)
    roll: float = 0.0       # degrees
    zoom_level: float = 1.0
    is_tracking: bool = False
    tracking_target: Optional[Tuple[int, int]] = None
    mode: GimbalMode = GimbalMode.FREE


@dataclass
class TrackingConfig:
    """Configuration for defect tracking."""
    smoothing: float = 0.7        # 0-1, higher = smoother
    max_pitch_rate: float = 45.0  # degrees/second
    max_yaw_rate: float = 60.0    # degrees/second
    deadzone: int = 20            # pixels - no movement if target within deadzone
    lead_factor: float = 0.1      # Predictive lead for moving targets
    auto_zoom: bool = True        # Auto-adjust zoom based on target size
    min_zoom: float = 1.0
    max_zoom: float = 50.0


class GimbalController:
    """
    Intelligent Gimbal Controller for Defect Inspection.

    Provides:
    - Automatic centering on detected defects
    - Smooth tracking during flight maneuvers
    - Multi-camera switching and coordination
    - Optimal zoom level calculation
    - Surface-normal aware angle optimization
    """

    # Frame dimensions (H30T)
    FRAME_WIDTH = 4000
    FRAME_HEIGHT = 3000

    # Gimbal limits
    PITCH_MIN = -90.0
    PITCH_MAX = 30.0
    YAW_MIN = -180.0
    YAW_MAX = 180.0

    def __init__(
        self,
        psdk: PSDKInterface,
        tracking_config: Optional[TrackingConfig] = None,
    ):
        """
        Initialize gimbal controller.

        Args:
            psdk: PSDK interface instance
            tracking_config: Custom tracking configuration
        """
        self.psdk = psdk
        self.config = tracking_config or TrackingConfig()

        self._state = GimbalState()
        self._current_camera = CameraMode.WIDE
        self._tracking_task: Optional[asyncio.Task] = None
        self._tracking_active = False
        self._target_defect: Optional[DefectLocation] = None

        # Callbacks
        self._capture_callbacks: List[Callable[[CameraMode], asyncio.Future]] = []

        logger.info("GimbalController initialized")

    @property
    def state(self) -> GimbalState:
        """Get current gimbal state."""
        return self._state

    @property
    def current_camera(self) -> CameraMode:
        """Get currently active camera."""
        return self._current_camera

    @property
    def is_tracking(self) -> bool:
        """Check if actively tracking a defect."""
        return self._tracking_active

    # =========================================================================
    # Basic Gimbal Control
    # =========================================================================

    async def set_angle(
        self,
        pitch: Optional[float] = None,
        yaw: Optional[float] = None,
        roll: Optional[float] = None,
        speed: float = 30.0,
    ) -> bool:
        """
        Set gimbal to specific angles.

        Args:
            pitch: Pitch angle (-90 to +30 degrees)
            yaw: Yaw angle (relative to drone)
            roll: Roll angle
            speed: Rotation speed (deg/s)

        Returns:
            True if command sent successfully
        """
        # Clamp angles to limits
        if pitch is not None:
            pitch = max(self.PITCH_MIN, min(self.PITCH_MAX, pitch))
        if yaw is not None:
            yaw = max(self.YAW_MIN, min(self.YAW_MAX, yaw))

        command = GimbalCommand(
            mode=GimbalMode.FREE,
            pitch=pitch,
            yaw=yaw,
            roll=roll,
            rotation_speed=speed,
            smoothing=self.config.smoothing,
        )

        success = await self.psdk.send_gimbal_command(command)

        if success:
            if pitch is not None:
                self._state.pitch = pitch
            if yaw is not None:
                self._state.yaw = yaw
            if roll is not None:
                self._state.roll = roll

        return success

    async def look_down(self, angle: float = -90.0) -> bool:
        """Point gimbal straight down (or at specified angle)."""
        return await self.set_angle(pitch=angle, yaw=0.0)

    async def look_forward(self) -> bool:
        """Point gimbal forward."""
        return await self.set_angle(pitch=0.0, yaw=0.0)

    async def reset_position(self) -> bool:
        """Reset gimbal to default position."""
        return await self.set_angle(pitch=-45.0, yaw=0.0, roll=0.0)

    # =========================================================================
    # Defect Centering
    # =========================================================================

    async def center_on_defect(
        self,
        defect: DefectLocation,
        smooth: bool = True,
    ) -> bool:
        """
        Center gimbal on detected defect.

        Args:
            defect: Defect location with pixel coordinates
            smooth: Use smooth transition

        Returns:
            True if centering successful
        """
        # Calculate center of defect bounding box
        bbox = defect.bounding_box
        center_x = (bbox[0] + bbox[2]) // 2
        center_y = (bbox[1] + bbox[3]) // 2

        return await self.center_on_pixel(center_x, center_y, smooth)

    async def center_on_pixel(
        self,
        x: int,
        y: int,
        smooth: bool = True,
    ) -> bool:
        """
        Adjust gimbal to center on specific pixel.

        Args:
            x: Pixel X coordinate
            y: Pixel Y coordinate
            smooth: Use smooth transition

        Returns:
            True if centering successful
        """
        # Calculate offset from frame center
        frame_center_x = self.FRAME_WIDTH // 2
        frame_center_y = self.FRAME_HEIGHT // 2

        offset_x = x - frame_center_x
        offset_y = y - frame_center_y

        # Check if within deadzone
        if abs(offset_x) < self.config.deadzone and abs(offset_y) < self.config.deadzone:
            return True  # Already centered

        # Convert pixel offset to angle adjustment
        # Approximate: H30T has ~84° horizontal FOV, ~62° vertical FOV
        h_fov = 84.0
        v_fov = 62.0

        yaw_adjustment = (offset_x / self.FRAME_WIDTH) * h_fov
        pitch_adjustment = (offset_y / self.FRAME_HEIGHT) * v_fov

        # Apply adjustments
        new_yaw = self._state.yaw + yaw_adjustment
        new_pitch = self._state.pitch - pitch_adjustment  # Inverted for natural control

        speed = 30.0 if smooth else 90.0

        return await self.set_angle(pitch=new_pitch, yaw=new_yaw, speed=speed)

    async def point_at_gps(
        self,
        target: GPSCoordinate,
    ) -> bool:
        """
        Point gimbal at specific GPS location.

        Args:
            target: Target GPS coordinates

        Returns:
            True if successful
        """
        telemetry = self.psdk.telemetry
        if not telemetry:
            logger.warning("No telemetry available for GPS pointing")
            return False

        # Calculate bearing and elevation angle to target
        bearing, elevation = self._calculate_look_angles(
            telemetry.position,
            target,
        )

        # Adjust for drone heading
        yaw = bearing - telemetry.attitude[2]  # attitude[2] is heading

        return await self.set_angle(pitch=elevation, yaw=yaw)

    # =========================================================================
    # Defect Tracking
    # =========================================================================

    async def start_tracking(
        self,
        defect: DefectLocation,
    ) -> bool:
        """
        Start tracking a defect.

        Args:
            defect: Defect to track

        Returns:
            True if tracking started
        """
        if self._tracking_active:
            await self.stop_tracking()

        self._target_defect = defect
        self._tracking_active = True
        self._state.is_tracking = True

        # Start tracking loop
        self._tracking_task = asyncio.create_task(self._tracking_loop())

        logger.info(f"Started tracking defect at bbox {defect.bounding_box}")
        return True

    async def stop_tracking(self) -> None:
        """Stop defect tracking."""
        self._tracking_active = False
        self._state.is_tracking = False

        if self._tracking_task:
            self._tracking_task.cancel()
            self._tracking_task = None

        self._target_defect = None
        logger.info("Stopped defect tracking")

    async def update_tracking_target(
        self,
        bbox: Tuple[int, int, int, int],
    ) -> None:
        """
        Update tracking target with new bounding box.

        Args:
            bbox: New bounding box (x1, y1, x2, y2)
        """
        if self._target_defect:
            self._target_defect.bounding_box = bbox
            self._state.tracking_target = (
                (bbox[0] + bbox[2]) // 2,
                (bbox[1] + bbox[3]) // 2,
            )

    async def _tracking_loop(self) -> None:
        """Background tracking loop."""
        logger.debug("Tracking loop started")

        while self._tracking_active:
            try:
                if self._target_defect:
                    # Center on current target position
                    await self.center_on_defect(self._target_defect, smooth=True)

                    # Auto-zoom if enabled
                    if self.config.auto_zoom:
                        await self._auto_adjust_zoom(self._target_defect)

                await asyncio.sleep(0.05)  # 20Hz tracking rate

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Tracking loop error: {e}")
                await asyncio.sleep(0.1)

        logger.debug("Tracking loop ended")

    # =========================================================================
    # Camera Control
    # =========================================================================

    async def switch_camera(self, mode: CameraMode) -> bool:
        """
        Switch active camera mode.

        Args:
            mode: Camera mode to switch to

        Returns:
            True if switch successful
        """
        self._current_camera = mode
        logger.info(f"Switched to {mode.name} camera")

        # Configure zoom based on camera
        if mode == CameraMode.WIDE:
            await self.set_zoom(1.0)
        elif mode == CameraMode.ZOOM:
            await self.set_zoom(10.0)  # Default zoom level
        elif mode == CameraMode.THERMAL:
            await self.psdk.set_thermal_palette("whitehot")

        return True

    async def set_zoom(self, level: float) -> bool:
        """
        Set optical/digital zoom level.

        Args:
            level: Zoom level (1x to 200x)

        Returns:
            True if successful
        """
        level = max(1.0, min(200.0, level))
        success = await self.psdk.set_zoom(level)

        if success:
            self._state.zoom_level = level

        return success

    async def calculate_optimal_zoom(
        self,
        defect: DefectLocation,
        target_coverage: float = 0.5,
    ) -> float:
        """
        Calculate optimal zoom level for defect.

        Args:
            defect: Defect location
            target_coverage: Target fraction of frame for defect (0.3-0.7)

        Returns:
            Recommended zoom level
        """
        bbox = defect.bounding_box
        defect_width = bbox[2] - bbox[0]
        defect_height = bbox[3] - bbox[1]

        # Calculate current coverage
        current_coverage = max(
            defect_width / self.FRAME_WIDTH,
            defect_height / self.FRAME_HEIGHT,
        )

        if current_coverage == 0:
            return 1.0

        # Calculate zoom needed
        zoom_factor = target_coverage / current_coverage

        # Apply to current zoom
        new_zoom = self._state.zoom_level * zoom_factor

        # Clamp to limits
        return max(self.config.min_zoom, min(self.config.max_zoom, new_zoom))

    async def _auto_adjust_zoom(self, defect: DefectLocation) -> None:
        """Auto-adjust zoom based on defect size."""
        optimal_zoom = await self.calculate_optimal_zoom(defect)

        # Only adjust if significantly different
        if abs(optimal_zoom - self._state.zoom_level) > 2.0:
            await self.set_zoom(optimal_zoom)

    # =========================================================================
    # Capture Sequences
    # =========================================================================

    async def capture_defect_sequence(
        self,
        defect: DefectLocation,
    ) -> List[str]:
        """
        Execute multi-camera capture sequence for defect.

        Args:
            defect: Defect to capture

        Returns:
            List of capture identifiers
        """
        captures = []

        # Center on defect
        await self.center_on_defect(defect)
        await asyncio.sleep(0.3)  # Stabilize

        # Capture with wide camera (context)
        await self.switch_camera(CameraMode.WIDE)
        await self.psdk.capture_photo("wide")
        captures.append(f"wide_{datetime.now().strftime('%H%M%S')}")

        # Capture with zoom camera (detail)
        await self.switch_camera(CameraMode.ZOOM)
        optimal_zoom = await self.calculate_optimal_zoom(defect, target_coverage=0.6)
        await self.set_zoom(optimal_zoom)
        await asyncio.sleep(0.2)  # Focus adjustment
        await self.psdk.capture_photo("zoom")
        captures.append(f"zoom_{datetime.now().strftime('%H%M%S')}")

        # Capture with thermal camera
        await self.switch_camera(CameraMode.THERMAL)
        await self.psdk.capture_photo("thermal")
        captures.append(f"thermal_{datetime.now().strftime('%H%M%S')}")

        logger.info(f"Captured defect sequence: {len(captures)} images")
        return captures

    async def start_defect_video(
        self,
        defect: DefectLocation,
        duration: float = 10.0,
    ) -> bool:
        """
        Start video recording focused on defect.

        Args:
            defect: Defect to record
            duration: Recording duration in seconds

        Returns:
            True if recording completed
        """
        # Center and track
        await self.center_on_defect(defect)
        await self.start_tracking(defect)

        # Start recording
        await self.psdk.start_recording()
        logger.info(f"Started defect video recording for {duration}s")

        # Wait for duration
        await asyncio.sleep(duration)

        # Stop recording and tracking
        await self.psdk.stop_recording()
        await self.stop_tracking()

        logger.info("Defect video recording completed")
        return True

    # =========================================================================
    # Surface-Aware Angle Optimization
    # =========================================================================

    async def optimize_for_surface(
        self,
        defect: DefectLocation,
    ) -> bool:
        """
        Optimize gimbal angle for surface defect inspection.

        Uses surface normal to calculate perpendicular viewing angle.

        Args:
            defect: Defect with surface normal information

        Returns:
            True if optimization successful
        """
        if not defect.surface_normal:
            # No surface info, use default angle
            return await self.center_on_defect(defect)

        nx, ny, nz = defect.surface_normal

        # Calculate optimal pitch to be perpendicular to surface
        # Surface normal points outward, we want to look along negative normal
        optimal_pitch = -math.degrees(math.asin(nz))

        # Adjust yaw for surface orientation
        optimal_yaw = math.degrees(math.atan2(ny, nx))

        # Apply with current centering
        await self.set_angle(pitch=optimal_pitch, yaw=optimal_yaw)

        # Fine-tune centering
        await self.center_on_defect(defect, smooth=True)

        return True

    # =========================================================================
    # Scan Patterns
    # =========================================================================

    async def execute_grid_scan(
        self,
        rows: int = 3,
        cols: int = 3,
        dwell_time: float = 1.0,
        capture: bool = True,
    ) -> List[Tuple[float, float]]:
        """
        Execute grid scan pattern.

        Args:
            rows: Number of rows in grid
            cols: Number of columns in grid
            dwell_time: Time to hold at each position
            capture: Capture image at each position

        Returns:
            List of (pitch, yaw) positions scanned
        """
        positions = []
        pitch_range = abs(self.PITCH_MIN - self.PITCH_MAX)
        yaw_range = 120.0  # Scan +/- 60 degrees

        pitch_step = pitch_range / (rows - 1) if rows > 1 else 0
        yaw_step = yaw_range / (cols - 1) if cols > 1 else 0

        start_pitch = self.PITCH_MAX
        start_yaw = -yaw_range / 2

        for row in range(rows):
            # Alternate direction for efficient scanning (boustrophedon)
            col_range = range(cols) if row % 2 == 0 else range(cols - 1, -1, -1)

            for col in col_range:
                pitch = start_pitch - (row * pitch_step)
                yaw = start_yaw + (col * yaw_step)

                await self.set_angle(pitch=pitch, yaw=yaw)
                positions.append((pitch, yaw))

                await asyncio.sleep(dwell_time)

                if capture:
                    await self.psdk.capture_photo()

        logger.info(f"Grid scan completed: {len(positions)} positions")
        return positions

    async def execute_pan_scan(
        self,
        start_yaw: float = -90.0,
        end_yaw: float = 90.0,
        pitch: float = -45.0,
        speed: float = 15.0,
    ) -> bool:
        """
        Execute horizontal pan scan.

        Args:
            start_yaw: Starting yaw angle
            end_yaw: Ending yaw angle
            pitch: Fixed pitch angle
            speed: Pan speed (deg/s)

        Returns:
            True if scan completed
        """
        # Move to start position
        await self.set_angle(pitch=pitch, yaw=start_yaw, speed=90.0)
        await asyncio.sleep(0.5)

        # Start recording for video scan
        await self.psdk.start_recording()

        # Pan to end position
        await self.set_angle(pitch=pitch, yaw=end_yaw, speed=speed)

        # Wait for pan to complete
        pan_duration = abs(end_yaw - start_yaw) / speed
        await asyncio.sleep(pan_duration)

        # Stop recording
        await self.psdk.stop_recording()

        logger.info(f"Pan scan completed: {start_yaw}° to {end_yaw}°")
        return True

    # =========================================================================
    # Helper Methods
    # =========================================================================

    def _calculate_look_angles(
        self,
        from_pos: GPSCoordinate,
        to_pos: GPSCoordinate,
    ) -> Tuple[float, float]:
        """
        Calculate bearing and elevation angles from one position to another.

        Returns:
            Tuple of (bearing_degrees, elevation_degrees)
        """
        # Calculate bearing
        lat1 = math.radians(from_pos.latitude)
        lat2 = math.radians(to_pos.latitude)
        dlon = math.radians(to_pos.longitude - from_pos.longitude)

        x = math.cos(lat2) * math.sin(dlon)
        y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        bearing = math.degrees(math.atan2(x, y))

        # Calculate distance
        dlat = lat2 - lat1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        distance = 6371000 * 2 * math.asin(math.sqrt(a))

        # Calculate elevation
        alt_diff = to_pos.altitude_msl - from_pos.altitude_msl
        elevation = math.degrees(math.atan2(alt_diff, distance))

        return bearing, elevation

    def register_capture_callback(
        self,
        callback: Callable[[CameraMode], asyncio.Future],
    ) -> None:
        """Register callback for capture events."""
        self._capture_callbacks.append(callback)
