"""
Wind Turbine Blade Inspection Module

Specialized drone inspection for wind turbine blades with:
- Blade crack detection and analysis
- Leading/trailing edge inspection patterns
- Erosion assessment
- Lightning strike damage detection
- Ice/debris accumulation inspection
- Integration with Qwen-VL for AI analysis
"""

import asyncio
import logging
import math
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple, Callable
from enum import Enum, auto
import numpy as np

from .core import PSDKInterface
from .flight_controller import FlightController
from .gimbal_controller import GimbalController, CameraMode
from .defect_recapture import DefectRecaptureSystem
from .safety import CriticalInfrastructureSafety, SafetyLevel
from .types import (
    GPSCoordinate,
    TurbineBladeInfo,
    DefectLocation,
    FlightCommand,
    FlightMode,
    FlightAdjustmentPlan,
    InfrastructureType,
    RecaptureOption,
)

logger = logging.getLogger(__name__)


class BladeSection(Enum):
    """Sections of a wind turbine blade."""
    ROOT = auto()           # 0-15% span
    INNER = auto()          # 15-40% span
    MIDDLE = auto()         # 40-70% span
    OUTER = auto()          # 70-90% span
    TIP = auto()            # 90-100% span


class BladeSide(Enum):
    """Sides of a blade for inspection."""
    LEADING_EDGE = auto()   # Front edge (wind-facing)
    TRAILING_EDGE = auto()  # Back edge
    SUCTION_SIDE = auto()   # Low pressure side
    PRESSURE_SIDE = auto()  # High pressure side


class BladeDefectType(Enum):
    """Types of blade defects."""
    CRACK = auto()              # Structural cracks
    EROSION = auto()            # Leading edge erosion
    DELAMINATION = auto()       # Layer separation
    LIGHTNING_DAMAGE = auto()   # Lightning strike damage
    ICE_ACCUMULATION = auto()   # Ice buildup
    DEBRIS = auto()             # Debris/contamination
    COATING_DAMAGE = auto()     # Surface coating issues
    STRUCTURAL_DAMAGE = auto()  # Major structural issues
    VORTEX_GENERATORS = auto()  # VG damage/missing


@dataclass
class BladeInspectionPoint:
    """Inspection point on a blade."""
    point_id: str
    section: BladeSection
    side: BladeSide
    span_position: float      # 0.0 (root) to 1.0 (tip)
    chord_position: float     # 0.0 (leading) to 1.0 (trailing)
    gps: GPSCoordinate
    inspection_complete: bool = False
    defects_found: List[str] = field(default_factory=list)
    images_captured: int = 0


@dataclass
class BladeDefect:
    """Detected blade defect with full details."""
    defect_id: str
    defect_type: BladeDefectType
    location: BladeInspectionPoint
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    description: str
    size_estimate: Tuple[float, float]  # (length, width) in cm
    depth_estimate: Optional[float] = None  # cm
    original_image: Optional[np.ndarray] = None
    enhanced_images: List[np.ndarray] = field(default_factory=list)
    ai_analysis: Optional[str] = None
    recommended_action: str = ""
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class TurbineInspectionSession:
    """Complete turbine inspection session."""
    session_id: str
    turbine_info: TurbineBladeInfo
    start_time: datetime
    end_time: Optional[datetime] = None
    blades_inspected: int = 0
    inspection_points: List[BladeInspectionPoint] = field(default_factory=list)
    defects_found: List[BladeDefect] = field(default_factory=list)
    total_images: int = 0
    total_video_seconds: float = 0.0
    weather_conditions: Dict[str, Any] = field(default_factory=dict)
    status: str = "in_progress"


class TurbineBladeInspector:
    """
    Wind Turbine Blade Inspector.

    Specialized inspection system for wind turbine blades:
    - Full blade scan patterns (leading edge, trailing edge, surfaces)
    - Crack detection with Qwen-VL integration
    - Automatic recapture for detailed defect analysis
    - Safety protocols for rotating equipment
    - Multi-blade sequential inspection

    Supports inspection of:
    - Blade cracks and structural damage
    - Leading edge erosion
    - Lightning strike damage
    - Ice and debris accumulation
    - Coating and surface issues
    """

    # Standard inspection distances (meters)
    INSPECTION_DISTANCES = {
        BladeSection.ROOT: 6.0,
        BladeSection.INNER: 8.0,
        BladeSection.MIDDLE: 10.0,
        BladeSection.OUTER: 12.0,
        BladeSection.TIP: 15.0,  # Extra distance for safety
    }

    # Span positions for each section
    SECTION_SPANS = {
        BladeSection.ROOT: (0.0, 0.15),
        BladeSection.INNER: (0.15, 0.40),
        BladeSection.MIDDLE: (0.40, 0.70),
        BladeSection.OUTER: (0.70, 0.90),
        BladeSection.TIP: (0.90, 1.0),
    }

    # Common defect locations
    CRITICAL_INSPECTION_ZONES = [
        (BladeSection.ROOT, BladeSide.LEADING_EDGE),      # Root LE cracks
        (BladeSection.OUTER, BladeSide.LEADING_EDGE),     # Erosion zone
        (BladeSection.TIP, BladeSide.TRAILING_EDGE),      # Lightning damage
        (BladeSection.MIDDLE, BladeSide.SUCTION_SIDE),    # Delamination
    ]

    def __init__(
        self,
        psdk: PSDKInterface,
        flight_controller: FlightController,
        gimbal_controller: GimbalController,
        recapture_system: DefectRecaptureSystem,
        safety_manager: CriticalInfrastructureSafety,
        ai_analyzer: Optional[Callable] = None,
    ):
        """
        Initialize turbine blade inspector.

        Args:
            psdk: PSDK interface
            flight_controller: Flight controller
            gimbal_controller: Gimbal controller
            recapture_system: Defect recapture system
            safety_manager: Safety manager
            ai_analyzer: AI analysis callback (Qwen-VL)
        """
        self.psdk = psdk
        self.flight = flight_controller
        self.gimbal = gimbal_controller
        self.recapture = recapture_system
        self.safety = safety_manager
        self.ai_analyzer = ai_analyzer

        self._current_session: Optional[TurbineInspectionSession] = None
        self._session_history: List[TurbineInspectionSession] = []
        self._abort_requested = False

        # Callbacks
        self._defect_callbacks: List[Callable[[BladeDefect], None]] = []
        self._progress_callbacks: List[Callable[[str, float], None]] = []

        logger.info("TurbineBladeInspector initialized")

    @property
    def current_session(self) -> Optional[TurbineInspectionSession]:
        """Get current inspection session."""
        return self._current_session

    # =========================================================================
    # Main Inspection Methods
    # =========================================================================

    async def inspect_turbine(
        self,
        turbine_info: TurbineBladeInfo,
        hub_location: GPSCoordinate,
        full_inspection: bool = True,
        specific_blades: Optional[List[int]] = None,
    ) -> TurbineInspectionSession:
        """
        Perform full turbine blade inspection.

        Args:
            turbine_info: Turbine information
            hub_location: GPS location of turbine hub
            full_inspection: Inspect all surfaces (True) or just critical zones
            specific_blades: List of specific blade numbers to inspect (1, 2, 3)

        Returns:
            TurbineInspectionSession with results
        """
        # Safety check: blade rotation
        if not self.safety.is_blade_rotation_safe(turbine_info.rotation_status):
            logger.error(
                f"Unsafe blade rotation status: {turbine_info.rotation_status}. "
                "Turbine must be stopped/locked for inspection."
            )
            raise ValueError("Turbine blades must be stopped for inspection")

        # Create session
        session_id = f"turbine_{turbine_info.turbine_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        session = TurbineInspectionSession(
            session_id=session_id,
            turbine_info=turbine_info,
            start_time=datetime.now(),
        )
        self._current_session = session
        self._abort_requested = False

        logger.info(
            f"Starting turbine inspection: {turbine_info.turbine_id}, "
            f"blades={specific_blades or 'all'}"
        )

        try:
            # Determine blades to inspect
            blades = specific_blades or [1, 2, 3]

            for blade_num in blades:
                if self._abort_requested:
                    logger.info("Inspection aborted by request")
                    break

                # Calculate blade position based on current angle
                blade_angle = turbine_info.current_angle + (blade_num - 1) * 120
                blade_angle = blade_angle % 360

                logger.info(f"Inspecting blade {blade_num} at {blade_angle}°")

                # Inspect this blade
                await self._inspect_single_blade(
                    session=session,
                    blade_num=blade_num,
                    blade_angle=blade_angle,
                    hub_location=hub_location,
                    blade_length=turbine_info.blade_length,
                    full_inspection=full_inspection,
                )

                session.blades_inspected += 1
                self._notify_progress(
                    f"Blade {blade_num} complete",
                    session.blades_inspected / len(blades),
                )

            session.end_time = datetime.now()
            session.status = "completed" if not self._abort_requested else "aborted"

        except Exception as e:
            logger.error(f"Turbine inspection failed: {e}")
            session.status = "failed"
            session.end_time = datetime.now()

        finally:
            self._session_history.append(session)
            self._current_session = None

        logger.info(
            f"Turbine inspection complete: {session.blades_inspected} blades, "
            f"{len(session.defects_found)} defects found"
        )

        return session

    async def _inspect_single_blade(
        self,
        session: TurbineInspectionSession,
        blade_num: int,
        blade_angle: float,
        hub_location: GPSCoordinate,
        blade_length: float,
        full_inspection: bool,
    ) -> None:
        """Inspect a single blade."""
        # Generate inspection points
        inspection_points = self._generate_inspection_points(
            blade_num=blade_num,
            blade_angle=blade_angle,
            hub_location=hub_location,
            blade_length=blade_length,
            full_inspection=full_inspection,
        )

        session.inspection_points.extend(inspection_points)

        for i, point in enumerate(inspection_points):
            if self._abort_requested:
                break

            logger.debug(
                f"Inspecting point {i + 1}/{len(inspection_points)}: "
                f"{point.section.name} {point.side.name}"
            )

            # Calculate drone position for this inspection point
            drone_pos = self._calculate_inspection_position(
                point=point,
                blade_angle=blade_angle,
                hub_location=hub_location,
            )

            # Move to inspection position
            await self.psdk.set_position(
                latitude=drone_pos.latitude,
                longitude=drone_pos.longitude,
                altitude=drone_pos.altitude_agl,
                speed=3.0,
            )
            await asyncio.sleep(1.0)  # Stabilize

            # Point gimbal at inspection point
            await self.gimbal.point_at_gps(point.gps)
            await asyncio.sleep(0.5)

            # Capture images
            await self._capture_inspection_point(session, point)

            # Analyze for defects
            defects = await self._analyze_inspection_point(session, point)

            if defects:
                for defect in defects:
                    session.defects_found.append(defect)
                    self._notify_defect(defect)

                    # If significant defect, trigger recapture
                    if defect.severity in ["CRITICAL", "HIGH"]:
                        await self._handle_blade_defect(session, defect, point)

            point.inspection_complete = True
            self._notify_progress(
                f"Blade {blade_num}: {point.section.name}",
                (i + 1) / len(inspection_points),
            )

    async def _capture_inspection_point(
        self,
        session: TurbineInspectionSession,
        point: BladeInspectionPoint,
    ) -> None:
        """Capture images at inspection point."""
        # Wide shot for context
        await self.gimbal.switch_camera(CameraMode.WIDE)
        await self.psdk.capture_photo("wide")
        point.images_captured += 1
        session.total_images += 1

        # Zoom shot for detail
        await self.gimbal.switch_camera(CameraMode.ZOOM)
        await self.gimbal.set_zoom(20.0)  # 20x zoom for blade detail
        await asyncio.sleep(0.3)
        await self.psdk.capture_photo("zoom")
        point.images_captured += 1
        session.total_images += 1

        # Thermal for subsurface issues
        await self.gimbal.switch_camera(CameraMode.THERMAL)
        await self.psdk.capture_photo("thermal")
        point.images_captured += 1
        session.total_images += 1

    async def _analyze_inspection_point(
        self,
        session: TurbineInspectionSession,
        point: BladeInspectionPoint,
    ) -> List[BladeDefect]:
        """Analyze captured images for defects using AI."""
        defects = []

        if not self.ai_analyzer:
            return defects

        try:
            # In real implementation, get the captured images
            # For now, simulate AI analysis
            analysis_result = await self.ai_analyzer(
                context="wind_turbine_blade",
                section=point.section.name,
                side=point.side.name,
                prompt=(
                    f"Analyze this wind turbine blade image for defects. "
                    f"Location: {point.section.name} section, {point.side.name}. "
                    f"Look for: cracks, erosion, delamination, lightning damage, "
                    f"ice accumulation, debris, coating damage. "
                    f"Describe any defects found with severity and size estimate."
                ),
            )

            # Parse AI response for defects
            if analysis_result and "defect" in str(analysis_result).lower():
                defect = self._parse_defect_from_analysis(
                    analysis_result,
                    point,
                    session.turbine_info,
                )
                if defect:
                    defects.append(defect)
                    point.defects_found.append(defect.defect_id)

        except Exception as e:
            logger.error(f"AI analysis failed: {e}")

        return defects

    def _parse_defect_from_analysis(
        self,
        analysis: Dict[str, Any],
        point: BladeInspectionPoint,
        turbine: TurbineBladeInfo,
    ) -> Optional[BladeDefect]:
        """Parse AI analysis into BladeDefect object."""
        # Extract defect type from analysis
        defect_type = BladeDefectType.CRACK  # Default
        description = analysis.get("description", "Potential defect detected")
        severity = analysis.get("severity", "MEDIUM")

        # Determine defect type from description
        desc_lower = description.lower()
        if "crack" in desc_lower:
            defect_type = BladeDefectType.CRACK
        elif "erosion" in desc_lower:
            defect_type = BladeDefectType.EROSION
        elif "delamination" in desc_lower:
            defect_type = BladeDefectType.DELAMINATION
        elif "lightning" in desc_lower:
            defect_type = BladeDefectType.LIGHTNING_DAMAGE
        elif "ice" in desc_lower:
            defect_type = BladeDefectType.ICE_ACCUMULATION

        return BladeDefect(
            defect_id=f"blade_defect_{datetime.now().strftime('%H%M%S')}",
            defect_type=defect_type,
            location=point,
            severity=severity,
            description=description,
            size_estimate=analysis.get("size", (5.0, 1.0)),  # Default 5cm x 1cm
            ai_analysis=str(analysis),
            recommended_action=analysis.get("recommendation", "Further inspection recommended"),
        )

    async def _handle_blade_defect(
        self,
        session: TurbineInspectionSession,
        defect: BladeDefect,
        point: BladeInspectionPoint,
    ) -> None:
        """Handle detected blade defect with recapture."""
        logger.info(
            f"Handling blade defect: {defect.defect_type.name} at "
            f"{point.section.name} {point.side.name}"
        )

        # Create defect location for recapture system
        defect_location = DefectLocation(
            gps=point.gps,
            pixel_coordinates=(2000, 1500),  # Center of frame
            bounding_box=(1800, 1300, 2200, 1700),
            estimated_size=defect.size_estimate,
            distance_from_drone=self.INSPECTION_DISTANCES[point.section],
            bearing_from_drone=0.0,
        )

        # Initiate recapture with turbine-specific handling
        await self.recapture.initiate_recapture(
            defect_type=f"blade_{defect.defect_type.name.lower()}",
            defect_description=defect.description,
            severity=defect.severity,
            location=defect_location,
            original_image=defect.original_image or np.zeros((100, 100, 3), dtype=np.uint8),
            infrastructure_type=InfrastructureType.WIND_FARM,
            model_requesting="qwen-vl",
            turbine_info=session.turbine_info,
        )

    # =========================================================================
    # Inspection Point Generation
    # =========================================================================

    def _generate_inspection_points(
        self,
        blade_num: int,
        blade_angle: float,
        hub_location: GPSCoordinate,
        blade_length: float,
        full_inspection: bool,
    ) -> List[BladeInspectionPoint]:
        """Generate inspection points for a blade."""
        points = []

        if full_inspection:
            # Full inspection: all sections, all sides
            sections = list(BladeSection)
            sides = [BladeSide.LEADING_EDGE, BladeSide.TRAILING_EDGE]
        else:
            # Quick inspection: critical zones only
            sections = [s for s, _ in self.CRITICAL_INSPECTION_ZONES]
            sides = [BladeSide.LEADING_EDGE]

        for section in sections:
            span_min, span_max = self.SECTION_SPANS[section]
            span_mid = (span_min + span_max) / 2

            for side in sides:
                chord_pos = 0.0 if side == BladeSide.LEADING_EDGE else 1.0

                # Calculate GPS position of this point on blade
                gps = self._calculate_blade_point_gps(
                    hub_location=hub_location,
                    blade_angle=blade_angle,
                    blade_length=blade_length,
                    span_position=span_mid,
                )

                point = BladeInspectionPoint(
                    point_id=f"b{blade_num}_{section.name}_{side.name}",
                    section=section,
                    side=side,
                    span_position=span_mid,
                    chord_position=chord_pos,
                    gps=gps,
                )
                points.append(point)

        return points

    def _calculate_blade_point_gps(
        self,
        hub_location: GPSCoordinate,
        blade_angle: float,
        blade_length: float,
        span_position: float,
    ) -> GPSCoordinate:
        """Calculate GPS position of a point on the blade."""
        # Distance from hub along blade
        distance_from_hub = blade_length * span_position

        # Calculate offset based on blade angle
        angle_rad = math.radians(blade_angle)

        # Vertical offset (blade pointing up/down)
        vertical_offset = distance_from_hub * math.cos(angle_rad)

        # Horizontal offset (blade pointing left/right)
        horizontal_offset = distance_from_hub * math.sin(angle_rad)

        # Convert to lat/lon offset
        lat_offset = horizontal_offset / 111000
        # Altitude is vertical offset from hub height

        return GPSCoordinate(
            latitude=hub_location.latitude + lat_offset,
            longitude=hub_location.longitude,
            altitude_msl=hub_location.altitude_msl + vertical_offset,
            altitude_agl=hub_location.altitude_agl + vertical_offset,
        )

    def _calculate_inspection_position(
        self,
        point: BladeInspectionPoint,
        blade_angle: float,
        hub_location: GPSCoordinate,
    ) -> GPSCoordinate:
        """Calculate drone position for inspecting a blade point."""
        inspection_distance = self.INSPECTION_DISTANCES[point.section]

        # Calculate offset perpendicular to blade
        angle_rad = math.radians(blade_angle)

        # Position drone to the side of the blade
        if point.side == BladeSide.LEADING_EDGE:
            offset_angle = angle_rad - math.pi / 2  # 90° left
        else:
            offset_angle = angle_rad + math.pi / 2  # 90° right

        lat_offset = inspection_distance * math.sin(offset_angle) / 111000
        lon_offset = inspection_distance * math.cos(offset_angle) / (111000 * math.cos(math.radians(point.gps.latitude)))

        return GPSCoordinate(
            latitude=point.gps.latitude + lat_offset,
            longitude=point.gps.longitude + lon_offset,
            altitude_msl=point.gps.altitude_msl,
            altitude_agl=point.gps.altitude_agl,
        )

    # =========================================================================
    # Quick Defect Inspection
    # =========================================================================

    async def quick_crack_inspection(
        self,
        crack_location: DefectLocation,
        turbine_info: TurbineBladeInfo,
    ) -> BladeDefect:
        """
        Quick focused inspection of a detected crack.

        Called when Qwen-VL detects a potential crack during scanning.
        Adjusts flight to get better imagery and confirms/denies the defect.

        Args:
            crack_location: Location where crack was detected
            turbine_info: Turbine information

        Returns:
            BladeDefect with detailed analysis
        """
        logger.info("Performing quick crack inspection")

        # Approach for closer look
        await self.flight.quick_closer_approach(crack_location, distance=5.0)

        # Center gimbal on crack
        await self.gimbal.center_on_defect(crack_location)

        # Capture sequence with zoom
        await self.gimbal.switch_camera(CameraMode.ZOOM)
        await self.gimbal.set_zoom(50.0)  # High zoom for crack detail
        await asyncio.sleep(0.5)

        # Capture multiple angles
        captures = []
        for yaw_offset in [-15, 0, 15]:
            current_yaw = self.gimbal.state.yaw
            await self.gimbal.set_angle(yaw=current_yaw + yaw_offset)
            await asyncio.sleep(0.3)
            await self.psdk.capture_photo("zoom")
            captures.append(yaw_offset)

        # Thermal check for depth analysis
        await self.gimbal.switch_camera(CameraMode.THERMAL)
        await self.psdk.capture_photo("thermal")

        # Analyze with AI
        if self.ai_analyzer:
            analysis = await self.ai_analyzer(
                context="blade_crack_confirmation",
                prompt=(
                    "Confirm if this is a crack on the wind turbine blade. "
                    "If confirmed, estimate: length, width, depth, and severity. "
                    "Determine if this is a structural crack requiring immediate attention."
                ),
            )
        else:
            analysis = {"description": "Crack analysis pending", "severity": "MEDIUM"}

        # Create defect record
        inspection_point = BladeInspectionPoint(
            point_id=f"crack_inspection_{datetime.now().strftime('%H%M%S')}",
            section=BladeSection.MIDDLE,  # Would be determined from location
            side=BladeSide.LEADING_EDGE,
            span_position=0.5,
            chord_position=0.0,
            gps=crack_location.gps,
            inspection_complete=True,
        )

        defect = BladeDefect(
            defect_id=f"crack_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            defect_type=BladeDefectType.CRACK,
            location=inspection_point,
            severity=analysis.get("severity", "HIGH"),
            description=analysis.get("description", "Crack detected on blade"),
            size_estimate=(
                analysis.get("length", 10.0),
                analysis.get("width", 0.5),
            ),
            depth_estimate=analysis.get("depth"),
            ai_analysis=str(analysis),
            recommended_action=analysis.get(
                "recommendation",
                "Schedule maintenance inspection",
            ),
        )

        self._notify_defect(defect)
        return defect

    # =========================================================================
    # Callbacks and Notifications
    # =========================================================================

    def register_defect_callback(
        self,
        callback: Callable[[BladeDefect], None],
    ) -> None:
        """Register callback for defect detection."""
        self._defect_callbacks.append(callback)

    def register_progress_callback(
        self,
        callback: Callable[[str, float], None],
    ) -> None:
        """Register callback for progress updates."""
        self._progress_callbacks.append(callback)

    def _notify_defect(self, defect: BladeDefect) -> None:
        """Notify callbacks of detected defect."""
        for callback in self._defect_callbacks:
            try:
                callback(defect)
            except Exception as e:
                logger.error(f"Defect callback error: {e}")

    def _notify_progress(self, message: str, progress: float) -> None:
        """Notify callbacks of inspection progress."""
        for callback in self._progress_callbacks:
            try:
                callback(message, progress)
            except Exception as e:
                logger.error(f"Progress callback error: {e}")

    async def abort_inspection(self) -> None:
        """Abort current inspection."""
        self._abort_requested = True
        await self.flight.abort_current_plan()
        logger.info("Blade inspection abort requested")

    def get_session_history(self) -> List[TurbineInspectionSession]:
        """Get inspection session history."""
        return self._session_history.copy()
