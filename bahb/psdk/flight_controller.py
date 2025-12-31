"""
Flight Controller for Defect Inspection

Advanced flight control for autonomous inspection with:
- Defect-based flight adjustments
- Orbit patterns for comprehensive imaging
- Multi-angle capture sequences
- Altitude and approach optimization
- Critical infrastructure awareness
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
    FlightCommand,
    FlightMode,
    FlightAdjustmentType,
    FlightAdjustmentPlan,
    FlightTelemetry,
    GPSCoordinate,
    DefectLocation,
    InfrastructureType,
    SafetyZone,
)

logger = logging.getLogger(__name__)


class FlightState(Enum):
    """Current flight state."""
    IDLE = auto()
    EXECUTING_MISSION = auto()
    DEFECT_ADJUSTMENT = auto()
    HOVERING = auto()
    RETURNING_HOME = auto()
    EMERGENCY = auto()


@dataclass
class ApproachParameters:
    """Parameters for defect approach maneuvers."""
    min_distance: float = 3.0      # Minimum safe distance (meters)
    optimal_distance: float = 5.0  # Optimal capture distance (meters)
    max_distance: float = 15.0     # Maximum effective distance (meters)
    approach_speed: float = 2.0    # Approach speed (m/s)
    orbit_speed: float = 1.5       # Orbit speed (m/s)
    hover_time: float = 3.0        # Time to hover at each position (seconds)


class FlightController:
    """
    Advanced Flight Controller for Defect Inspection.

    Provides intelligent flight control for:
    - Automatic flight adjustments when defects detected
    - Multi-angle capture sequences
    - Orbit patterns around defects
    - Safe approach to critical infrastructure
    - Wind turbine blade inspection patterns
    """

    # Safe distances for infrastructure types
    INFRASTRUCTURE_SAFE_DISTANCES = {
        InfrastructureType.DATA_CENTER: 10.0,       # meters
        InfrastructureType.SOLAR_FARM: 5.0,
        InfrastructureType.WIND_FARM: 15.0,         # Blade tip clearance
        InfrastructureType.UTILITY_SUBSTATION: 8.0, # Electrical clearance
        InfrastructureType.TRANSMISSION_LINE: 10.0,
        InfrastructureType.POWER_PLANT: 15.0,
        InfrastructureType.TELECOMMUNICATIONS: 5.0,
    }

    def __init__(
        self,
        psdk: PSDKInterface,
        approach_params: Optional[ApproachParameters] = None,
    ):
        """
        Initialize flight controller.

        Args:
            psdk: PSDK interface instance
            approach_params: Custom approach parameters
        """
        self.psdk = psdk
        self.approach_params = approach_params or ApproachParameters()

        self._state = FlightState.IDLE
        self._current_plan: Optional[FlightAdjustmentPlan] = None
        self._active_safety_zones: List[SafetyZone] = []
        self._abort_requested = False

        # Callbacks
        self._state_change_callbacks: List[Callable[[FlightState], None]] = []
        self._plan_progress_callbacks: List[Callable[[str, int, int], None]] = []

        logger.info("FlightController initialized")

    @property
    def state(self) -> FlightState:
        """Get current flight state."""
        return self._state

    @property
    def current_plan(self) -> Optional[FlightAdjustmentPlan]:
        """Get current active plan."""
        return self._current_plan

    # =========================================================================
    # Flight Adjustment Planning
    # =========================================================================

    def create_defect_approach_plan(
        self,
        defect: DefectLocation,
        adjustment_type: FlightAdjustmentType,
        infrastructure_type: InfrastructureType = InfrastructureType.DATA_CENTER,
    ) -> FlightAdjustmentPlan:
        """
        Create flight adjustment plan for defect inspection.

        Args:
            defect: Location of detected defect
            adjustment_type: Type of adjustment to perform
            infrastructure_type: Type of infrastructure being inspected

        Returns:
            FlightAdjustmentPlan with waypoints and commands
        """
        plan_id = f"defect_approach_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Get safe distance for infrastructure type
        safe_distance = self.INFRASTRUCTURE_SAFE_DISTANCES.get(
            infrastructure_type,
            self.approach_params.min_distance,
        )

        # Calculate optimal approach distance
        approach_distance = max(safe_distance, self.approach_params.optimal_distance)

        # Generate waypoints based on adjustment type
        if adjustment_type == FlightAdjustmentType.CLOSER_APPROACH:
            waypoints = self._plan_closer_approach(defect, approach_distance)

        elif adjustment_type == FlightAdjustmentType.ORBIT_AROUND:
            waypoints = self._plan_orbit_pattern(defect, approach_distance)

        elif adjustment_type == FlightAdjustmentType.ALTITUDE_ADJUST:
            waypoints = self._plan_altitude_sweep(defect, approach_distance)

        elif adjustment_type == FlightAdjustmentType.ANGLE_OPTIMIZE:
            waypoints = self._plan_angle_optimization(defect, approach_distance)

        elif adjustment_type == FlightAdjustmentType.MULTI_ANGLE_CAPTURE:
            waypoints = self._plan_multi_angle_capture(defect, approach_distance)

        elif adjustment_type == FlightAdjustmentType.HOVER_EXTENDED:
            waypoints = self._plan_extended_hover(defect)

        elif adjustment_type == FlightAdjustmentType.THERMAL_SWEEP:
            waypoints = self._plan_thermal_sweep(defect, approach_distance)

        else:
            waypoints = [self._create_hover_command(defect)]

        # Calculate estimated duration
        duration = self._estimate_plan_duration(waypoints)

        # Calculate battery usage
        battery_usage = self._estimate_battery_usage(waypoints, duration)

        plan = FlightAdjustmentPlan(
            plan_id=plan_id,
            defect_id=defect.gps.latitude.__str__() + defect.gps.longitude.__str__(),
            adjustment_type=adjustment_type,
            waypoints=waypoints,
            estimated_duration=duration,
            estimated_battery_usage=battery_usage,
            safety_validated=False,
            user_approved=False,
        )

        logger.info(
            f"Created flight plan: {plan_id}, "
            f"type={adjustment_type.name}, "
            f"waypoints={len(waypoints)}, "
            f"duration={duration:.1f}s"
        )

        return plan

    def create_turbine_blade_inspection_plan(
        self,
        turbine_center: GPSCoordinate,
        blade_defect: DefectLocation,
        blade_length: float = 50.0,
        blade_angle: float = 0.0,
    ) -> FlightAdjustmentPlan:
        """
        Create specialized plan for wind turbine blade inspection.

        Args:
            turbine_center: GPS of turbine hub
            blade_defect: Detected defect on blade
            blade_length: Length of blade in meters
            blade_angle: Current angle of blade (0 = pointing up)

        Returns:
            FlightAdjustmentPlan for blade inspection
        """
        plan_id = f"turbine_blade_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Calculate inspection waypoints along blade
        # Stay 15m from blade tip (safety zone)
        safe_offset = 15.0
        inspection_distance = 8.0

        waypoints = []

        # Calculate defect position along blade
        defect_distance_from_hub = blade_defect.distance_from_drone

        # Create approach to blade leading edge
        approach_waypoint = self._calculate_blade_approach_point(
            turbine_center,
            blade_angle,
            defect_distance_from_hub,
            inspection_distance,
            "leading",
        )
        waypoints.append(FlightCommand(
            mode=FlightMode.WAYPOINT,
            target_position=approach_waypoint,
            speed=2.0,
            reason="Approach blade leading edge",
        ))

        # Hover for capture
        waypoints.append(FlightCommand(
            mode=FlightMode.HOVER,
            timeout=5.0,
            reason="Capture leading edge view",
        ))

        # Move to trailing edge
        trailing_waypoint = self._calculate_blade_approach_point(
            turbine_center,
            blade_angle,
            defect_distance_from_hub,
            inspection_distance,
            "trailing",
        )
        waypoints.append(FlightCommand(
            mode=FlightMode.WAYPOINT,
            target_position=trailing_waypoint,
            speed=1.5,
            reason="Move to trailing edge",
        ))

        # Hover for capture
        waypoints.append(FlightCommand(
            mode=FlightMode.HOVER,
            timeout=5.0,
            reason="Capture trailing edge view",
        ))

        # Close approach if safe
        if defect_distance_from_hub < blade_length - safe_offset:
            close_waypoint = self._calculate_blade_approach_point(
                turbine_center,
                blade_angle,
                defect_distance_from_hub,
                5.0,  # Closer inspection
                "front",
            )
            waypoints.append(FlightCommand(
                mode=FlightMode.WAYPOINT,
                target_position=close_waypoint,
                speed=1.0,
                reason="Close approach for detail",
            ))
            waypoints.append(FlightCommand(
                mode=FlightMode.HOVER,
                timeout=8.0,
                reason="Detailed defect capture",
            ))

        duration = self._estimate_plan_duration(waypoints)
        battery_usage = self._estimate_battery_usage(waypoints, duration)

        return FlightAdjustmentPlan(
            plan_id=plan_id,
            defect_id=f"blade_defect_{blade_angle}",
            adjustment_type=FlightAdjustmentType.MULTI_ANGLE_CAPTURE,
            waypoints=waypoints,
            estimated_duration=duration,
            estimated_battery_usage=battery_usage,
            safety_validated=False,
            user_approved=False,
        )

    # =========================================================================
    # Plan Execution
    # =========================================================================

    async def execute_plan(
        self,
        plan: FlightAdjustmentPlan,
        capture_callback: Optional[Callable[[], asyncio.Future]] = None,
    ) -> bool:
        """
        Execute flight adjustment plan.

        Args:
            plan: The plan to execute
            capture_callback: Callback to invoke at each waypoint for image capture

        Returns:
            True if plan completed successfully
        """
        if not plan.safety_validated:
            logger.warning("Executing plan without safety validation!")

        if not plan.user_approved:
            logger.warning("Executing plan without user approval!")

        self._current_plan = plan
        self._state = FlightState.DEFECT_ADJUSTMENT
        self._abort_requested = False
        self._notify_state_change()

        logger.info(f"Executing flight plan: {plan.plan_id}")

        try:
            for i, waypoint in enumerate(plan.waypoints):
                if self._abort_requested:
                    logger.info("Plan aborted by request")
                    await self.psdk.hover()
                    return False

                # Notify progress
                self._notify_plan_progress(plan.plan_id, i + 1, len(plan.waypoints))

                logger.debug(f"Executing waypoint {i + 1}/{len(plan.waypoints)}: {waypoint.reason}")

                # Execute waypoint
                await self.psdk.send_flight_command(waypoint)

                # Wait for waypoint completion
                await self._wait_for_waypoint_completion(waypoint)

                # Capture at waypoint if callback provided
                if capture_callback and waypoint.mode == FlightMode.HOVER:
                    await capture_callback()

            logger.info(f"Plan completed: {plan.plan_id}")
            self._state = FlightState.HOVERING
            self._notify_state_change()
            return True

        except Exception as e:
            logger.error(f"Plan execution failed: {e}")
            self._state = FlightState.HOVERING
            await self.psdk.hover()
            return False

        finally:
            self._current_plan = None

    async def abort_current_plan(self) -> None:
        """Abort currently executing plan."""
        self._abort_requested = True
        await self.psdk.hover()
        logger.info("Flight plan abort requested")

    # =========================================================================
    # Quick Adjustment Methods
    # =========================================================================

    async def quick_closer_approach(
        self,
        defect: DefectLocation,
        distance: float = 5.0,
    ) -> bool:
        """
        Quick approach closer to defect.

        Args:
            defect: Defect location
            distance: Target distance from defect

        Returns:
            True if approach successful
        """
        telemetry = self.psdk.telemetry
        if not telemetry:
            return False

        # Calculate approach position
        target = self._calculate_approach_position(
            current=telemetry.position,
            target=defect.gps,
            distance=distance,
        )

        # Execute approach
        await self.psdk.set_position(
            latitude=target.latitude,
            longitude=target.longitude,
            altitude=target.altitude_agl,
            speed=self.approach_params.approach_speed,
        )

        return True

    async def orbit_defect(
        self,
        defect: DefectLocation,
        radius: float = 5.0,
        duration: float = 30.0,
    ) -> bool:
        """
        Perform orbit around defect.

        Args:
            defect: Defect location
            radius: Orbit radius in meters
            duration: Total orbit duration in seconds

        Returns:
            True if orbit completed
        """
        start_time = datetime.now()
        angular_speed = 360.0 / duration  # degrees per second

        while (datetime.now() - start_time).total_seconds() < duration:
            if self._abort_requested:
                await self.psdk.hover()
                return False

            elapsed = (datetime.now() - start_time).total_seconds()
            angle = elapsed * angular_speed

            position = self._calculate_orbit_position(
                center=defect.gps,
                radius=radius,
                angle=angle,
            )

            await self.psdk.set_position(
                latitude=position.latitude,
                longitude=position.longitude,
                altitude=position.altitude_agl,
                yaw=angle + 90,  # Point toward center
                speed=self.approach_params.orbit_speed,
            )

            await asyncio.sleep(0.1)  # 10Hz control loop

        return True

    # =========================================================================
    # Safety Zone Management
    # =========================================================================

    def add_safety_zone(self, zone: SafetyZone) -> None:
        """Add safety zone for collision avoidance."""
        self._active_safety_zones.append(zone)
        logger.info(f"Added safety zone: {zone.zone_id}")

    def remove_safety_zone(self, zone_id: str) -> None:
        """Remove safety zone."""
        self._active_safety_zones = [
            z for z in self._active_safety_zones if z.zone_id != zone_id
        ]

    def validate_plan_safety(self, plan: FlightAdjustmentPlan) -> Tuple[bool, List[str]]:
        """
        Validate plan against safety zones.

        Args:
            plan: Plan to validate

        Returns:
            Tuple of (is_safe, list of warnings)
        """
        warnings = []
        is_safe = True

        for waypoint in plan.waypoints:
            if waypoint.target_position:
                for zone in self._active_safety_zones:
                    # Check no-fly areas
                    for nfa_center, nfa_radius in zone.no_fly_areas:
                        distance = self._calculate_distance(
                            waypoint.target_position,
                            nfa_center,
                        )
                        if distance < nfa_radius:
                            warnings.append(
                                f"Waypoint violates no-fly zone at {nfa_center}"
                            )
                            is_safe = False

                    # Check altitude limits
                    alt = waypoint.target_position.altitude_agl
                    if alt < zone.min_altitude:
                        warnings.append(
                            f"Waypoint altitude {alt}m below minimum {zone.min_altitude}m"
                        )
                        is_safe = False
                    if alt > zone.max_altitude:
                        warnings.append(
                            f"Waypoint altitude {alt}m above maximum {zone.max_altitude}m"
                        )
                        is_safe = False

        if is_safe:
            plan.safety_validated = True

        return is_safe, warnings

    # =========================================================================
    # Internal Helper Methods
    # =========================================================================

    def _plan_closer_approach(
        self,
        defect: DefectLocation,
        target_distance: float,
    ) -> List[FlightCommand]:
        """Plan waypoints for closer approach."""
        telemetry = self.psdk.telemetry
        if not telemetry:
            return []

        target = self._calculate_approach_position(
            current=telemetry.position,
            target=defect.gps,
            distance=target_distance,
        )

        return [
            FlightCommand(
                mode=FlightMode.WAYPOINT,
                target_position=target,
                speed=self.approach_params.approach_speed,
                reason="Approach defect for closer inspection",
            ),
            FlightCommand(
                mode=FlightMode.HOVER,
                timeout=self.approach_params.hover_time,
                reason="Hold position for image capture",
            ),
        ]

    def _plan_orbit_pattern(
        self,
        defect: DefectLocation,
        radius: float,
        num_points: int = 8,
    ) -> List[FlightCommand]:
        """Plan waypoints for orbit around defect."""
        waypoints = []

        for i in range(num_points):
            angle = (360.0 / num_points) * i
            position = self._calculate_orbit_position(defect.gps, radius, angle)

            waypoints.append(FlightCommand(
                mode=FlightMode.WAYPOINT,
                target_position=position,
                target_yaw=angle + 90,  # Point toward center
                speed=self.approach_params.orbit_speed,
                reason=f"Orbit position {i + 1}/{num_points}",
            ))
            waypoints.append(FlightCommand(
                mode=FlightMode.HOVER,
                timeout=2.0,
                reason="Capture at orbit position",
            ))

        return waypoints

    def _plan_altitude_sweep(
        self,
        defect: DefectLocation,
        distance: float,
    ) -> List[FlightCommand]:
        """Plan altitude sweep for vertical coverage."""
        waypoints = []
        telemetry = self.psdk.telemetry

        if not telemetry:
            return []

        base_alt = defect.gps.altitude_agl
        alt_range = 10.0  # +/- 5 meters

        for alt_offset in [-5.0, 0.0, 5.0]:
            target = self._calculate_approach_position(
                current=telemetry.position,
                target=defect.gps,
                distance=distance,
            )
            target.altitude_agl = base_alt + alt_offset

            waypoints.append(FlightCommand(
                mode=FlightMode.WAYPOINT,
                target_position=target,
                speed=2.0,
                reason=f"Altitude {alt_offset:+.0f}m from defect",
            ))
            waypoints.append(FlightCommand(
                mode=FlightMode.HOVER,
                timeout=3.0,
                reason="Capture at altitude",
            ))

        return waypoints

    def _plan_angle_optimization(
        self,
        defect: DefectLocation,
        distance: float,
    ) -> List[FlightCommand]:
        """Plan optimal angle approach based on surface normal."""
        waypoints = []

        # If surface normal is known, approach perpendicular to it
        if defect.surface_normal:
            nx, ny, nz = defect.surface_normal
            # Calculate optimal approach angle
            approach_yaw = math.degrees(math.atan2(ny, nx))
        else:
            # Default to 45-degree offset approaches
            approach_yaw = defect.bearing_from_drone

        for angle_offset in [-30, 0, 30]:
            angle = approach_yaw + angle_offset
            position = self._calculate_orbit_position(defect.gps, distance, angle)

            waypoints.append(FlightCommand(
                mode=FlightMode.WAYPOINT,
                target_position=position,
                target_yaw=angle + 180,  # Face the defect
                speed=2.0,
                reason=f"Angle {angle_offset:+.0f}° approach",
            ))
            waypoints.append(FlightCommand(
                mode=FlightMode.HOVER,
                timeout=3.0,
                reason="Capture at angle",
            ))

        return waypoints

    def _plan_multi_angle_capture(
        self,
        defect: DefectLocation,
        distance: float,
    ) -> List[FlightCommand]:
        """Plan comprehensive multi-angle capture sequence."""
        # Combine orbit and altitude for 3D coverage
        waypoints = []

        # 4 positions at 3 altitudes = 12 capture points
        for alt_offset in [-3.0, 0.0, 3.0]:
            for angle in [0, 90, 180, 270]:
                position = self._calculate_orbit_position(defect.gps, distance, angle)
                position.altitude_agl += alt_offset

                waypoints.append(FlightCommand(
                    mode=FlightMode.WAYPOINT,
                    target_position=position,
                    target_yaw=angle + 180,
                    speed=2.0,
                    reason=f"Multi-angle: {angle}° alt{alt_offset:+.0f}m",
                ))
                waypoints.append(FlightCommand(
                    mode=FlightMode.HOVER,
                    timeout=2.0,
                    reason="Capture",
                ))

        return waypoints

    def _plan_extended_hover(
        self,
        defect: DefectLocation,
        hover_duration: float = 30.0,
    ) -> List[FlightCommand]:
        """Plan extended hover for video documentation."""
        return [
            FlightCommand(
                mode=FlightMode.HOVER,
                timeout=hover_duration,
                reason="Extended hover for video capture",
            ),
        ]

    def _plan_thermal_sweep(
        self,
        defect: DefectLocation,
        distance: float,
    ) -> List[FlightCommand]:
        """Plan thermal imaging sweep pattern."""
        waypoints = []

        # Grid pattern around defect for thermal coverage
        grid_size = 3
        spacing = 2.0  # meters between grid points

        for i in range(grid_size):
            for j in range(grid_size):
                offset_x = (i - 1) * spacing
                offset_y = (j - 1) * spacing

                # Calculate position with offset
                position = GPSCoordinate(
                    latitude=defect.gps.latitude + (offset_y / 111000),
                    longitude=defect.gps.longitude + (offset_x / 111000 / math.cos(math.radians(defect.gps.latitude))),
                    altitude_msl=defect.gps.altitude_msl,
                    altitude_agl=defect.gps.altitude_agl,
                )

                waypoints.append(FlightCommand(
                    mode=FlightMode.WAYPOINT,
                    target_position=position,
                    speed=1.0,
                    reason=f"Thermal grid [{i},{j}]",
                ))
                waypoints.append(FlightCommand(
                    mode=FlightMode.HOVER,
                    timeout=2.0,
                    reason="Thermal capture",
                ))

        return waypoints

    def _create_hover_command(self, defect: DefectLocation) -> FlightCommand:
        """Create simple hover command at current position."""
        return FlightCommand(
            mode=FlightMode.HOVER,
            timeout=self.approach_params.hover_time,
            reason="Hover for capture",
        )

    def _calculate_approach_position(
        self,
        current: GPSCoordinate,
        target: GPSCoordinate,
        distance: float,
    ) -> GPSCoordinate:
        """Calculate position at given distance from target toward current."""
        # Calculate bearing from target to current
        lat1, lon1 = math.radians(target.latitude), math.radians(target.longitude)
        lat2, lon2 = math.radians(current.latitude), math.radians(current.longitude)

        dlon = lon2 - lon1
        x = math.cos(lat2) * math.sin(dlon)
        y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        bearing = math.atan2(x, y)

        # Calculate new position at distance from target
        d = distance / 6371000  # Earth radius in meters
        lat_new = math.asin(
            math.sin(lat1) * math.cos(d) +
            math.cos(lat1) * math.sin(d) * math.cos(bearing)
        )
        lon_new = lon1 + math.atan2(
            math.sin(bearing) * math.sin(d) * math.cos(lat1),
            math.cos(d) - math.sin(lat1) * math.sin(lat_new)
        )

        return GPSCoordinate(
            latitude=math.degrees(lat_new),
            longitude=math.degrees(lon_new),
            altitude_msl=target.altitude_msl,
            altitude_agl=target.altitude_agl,
        )

    def _calculate_orbit_position(
        self,
        center: GPSCoordinate,
        radius: float,
        angle: float,
    ) -> GPSCoordinate:
        """Calculate position on orbit around center at given angle."""
        lat_rad = math.radians(center.latitude)

        # Convert radius to lat/lon offset
        lat_offset = (radius * math.cos(math.radians(angle))) / 111000
        lon_offset = (radius * math.sin(math.radians(angle))) / (111000 * math.cos(lat_rad))

        return GPSCoordinate(
            latitude=center.latitude + lat_offset,
            longitude=center.longitude + lon_offset,
            altitude_msl=center.altitude_msl,
            altitude_agl=center.altitude_agl,
        )

    def _calculate_blade_approach_point(
        self,
        hub_center: GPSCoordinate,
        blade_angle: float,
        distance_from_hub: float,
        approach_distance: float,
        side: str,
    ) -> GPSCoordinate:
        """Calculate approach point for turbine blade inspection."""
        # Calculate point on blade
        blade_rad = math.radians(blade_angle)

        # Blade extends from hub at blade_angle
        blade_point_offset_x = distance_from_hub * math.sin(blade_rad)
        blade_point_offset_y = distance_from_hub * math.cos(blade_rad)

        # Calculate approach position based on side
        if side == "leading":
            approach_angle = blade_angle - 90
        elif side == "trailing":
            approach_angle = blade_angle + 90
        else:  # front
            approach_angle = blade_angle + 180

        approach_rad = math.radians(approach_angle)
        approach_offset_x = approach_distance * math.sin(approach_rad)
        approach_offset_y = approach_distance * math.cos(approach_rad)

        lat_offset = (blade_point_offset_y + approach_offset_y) / 111000
        lon_offset = (blade_point_offset_x + approach_offset_x) / (111000 * math.cos(math.radians(hub_center.latitude)))

        return GPSCoordinate(
            latitude=hub_center.latitude + lat_offset,
            longitude=hub_center.longitude + lon_offset,
            altitude_msl=hub_center.altitude_msl + distance_from_hub * math.sin(blade_rad),
            altitude_agl=hub_center.altitude_agl + distance_from_hub * math.sin(blade_rad),
        )

    def _calculate_distance(
        self,
        pos1: GPSCoordinate,
        pos2: GPSCoordinate,
    ) -> float:
        """Calculate distance between two GPS coordinates in meters."""
        lat1, lon1 = math.radians(pos1.latitude), math.radians(pos1.longitude)
        lat2, lon2 = math.radians(pos2.latitude), math.radians(pos2.longitude)

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))

        return 6371000 * c  # Earth radius in meters

    def _estimate_plan_duration(self, waypoints: List[FlightCommand]) -> float:
        """Estimate total plan duration in seconds."""
        duration = 0.0

        for i, wp in enumerate(waypoints):
            if wp.mode == FlightMode.HOVER:
                duration += wp.timeout
            elif wp.mode == FlightMode.WAYPOINT and i > 0:
                # Estimate travel time
                prev = waypoints[i - 1]
                if prev.target_position and wp.target_position:
                    distance = self._calculate_distance(
                        prev.target_position,
                        wp.target_position,
                    )
                    duration += distance / wp.speed

        return duration

    def _estimate_battery_usage(
        self,
        waypoints: List[FlightCommand],
        duration: float,
    ) -> float:
        """Estimate battery usage as percentage."""
        # Rough estimate: 1% per 20 seconds of flight
        base_usage = duration / 20.0

        # Add for maneuvers
        maneuver_count = sum(1 for wp in waypoints if wp.mode == FlightMode.WAYPOINT)
        maneuver_usage = maneuver_count * 0.2

        return base_usage + maneuver_usage

    async def _wait_for_waypoint_completion(
        self,
        waypoint: FlightCommand,
        timeout: float = 60.0,
    ) -> bool:
        """Wait for waypoint to be reached."""
        if waypoint.mode == FlightMode.HOVER:
            await asyncio.sleep(waypoint.timeout)
            return True

        start_time = datetime.now()
        while (datetime.now() - start_time).total_seconds() < timeout:
            telemetry = self.psdk.telemetry
            if telemetry and waypoint.target_position:
                distance = self._calculate_distance(
                    telemetry.position,
                    waypoint.target_position,
                )
                if distance < 1.0:  # Within 1 meter
                    return True

            await asyncio.sleep(0.1)

        return False

    def _notify_state_change(self) -> None:
        """Notify callbacks of state change."""
        for callback in self._state_change_callbacks:
            try:
                callback(self._state)
            except Exception as e:
                logger.error(f"State change callback error: {e}")

    def _notify_plan_progress(
        self,
        plan_id: str,
        current: int,
        total: int,
    ) -> None:
        """Notify callbacks of plan progress."""
        for callback in self._plan_progress_callbacks:
            try:
                callback(plan_id, current, total)
            except Exception as e:
                logger.error(f"Plan progress callback error: {e}")

    def register_state_callback(
        self,
        callback: Callable[[FlightState], None],
    ) -> None:
        """Register callback for state changes."""
        self._state_change_callbacks.append(callback)

    def register_progress_callback(
        self,
        callback: Callable[[str, int, int], None],
    ) -> None:
        """Register callback for plan progress updates."""
        self._plan_progress_callbacks.append(callback)
