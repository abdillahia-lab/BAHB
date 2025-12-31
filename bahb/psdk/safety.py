"""
Critical Infrastructure Safety Protocols

Safety management for drone inspection of critical infrastructure:
- Data Centers
- Solar Farms
- Wind Farms
- Utility Substations
- Power Plants
- Transmission Lines

Implements:
- Geofencing and no-fly zones
- Electromagnetic interference avoidance
- Emergency procedures
- Battery reserve management
- Weather safety limits
- Collision avoidance
"""

import asyncio
import logging
import math
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Callable, Dict, Tuple
from enum import Enum, auto

from .core import PSDKInterface
from .types import (
    GPSCoordinate,
    SafetyZone,
    InfrastructureType,
    FlightTelemetry,
    FlightCommand,
    FlightMode,
)

logger = logging.getLogger(__name__)


class SafetyLevel(Enum):
    """Safety level for operations."""
    NOMINAL = auto()      # Normal operations
    CAUTION = auto()      # Increased awareness
    WARNING = auto()      # Reduced operations
    CRITICAL = auto()     # Emergency procedures
    EMERGENCY = auto()    # Immediate action required


class HazardType(Enum):
    """Types of hazards at critical infrastructure."""
    ELECTRICAL = auto()        # High voltage equipment
    MAGNETIC = auto()          # Magnetic interference
    RF_INTERFERENCE = auto()   # Radio frequency interference
    ROTATING_EQUIPMENT = auto()  # Turbines, fans, etc.
    THERMAL = auto()           # Hot surfaces, exhaust
    CHEMICAL = auto()          # Hazardous materials
    STRUCTURAL = auto()        # Collapse risk, unstable surfaces
    WILDLIFE = auto()          # Bird strikes, etc.


@dataclass
class HazardZone:
    """Defined hazard zone within infrastructure."""
    zone_id: str
    hazard_type: HazardType
    center: GPSCoordinate
    radius: float  # meters
    height_min: float = 0.0  # meters AGL
    height_max: float = 500.0  # meters AGL
    description: str = ""
    severity: SafetyLevel = SafetyLevel.CAUTION
    active: bool = True


@dataclass
class WeatherLimits:
    """Weather limits for safe flight."""
    max_wind_speed: float = 12.0  # m/s
    max_gust_speed: float = 15.0  # m/s
    min_visibility: float = 1000.0  # meters
    max_precipitation: float = 0.0  # mm/hr (0 = no rain)
    min_temperature: float = -10.0  # Celsius
    max_temperature: float = 45.0  # Celsius
    no_lightning: bool = True


@dataclass
class BatteryPolicy:
    """Battery management policy."""
    return_to_home_reserve: float = 25.0  # percentage
    landing_reserve: float = 15.0  # percentage
    critical_level: float = 10.0  # percentage - force land
    warning_level: float = 30.0  # percentage
    temperature_max: float = 55.0  # Celsius
    temperature_min: float = 5.0  # Celsius


@dataclass
class SafetyViolation:
    """Recorded safety violation."""
    violation_id: str
    timestamp: datetime
    violation_type: str
    severity: SafetyLevel
    location: GPSCoordinate
    description: str
    action_taken: str
    resolved: bool = False


class CriticalInfrastructureSafety:
    """
    Critical Infrastructure Safety Manager.

    Ensures safe drone operations around critical infrastructure:
    - Geofence enforcement
    - Hazard zone avoidance
    - Emergency procedures
    - Battery management
    - Weather monitoring
    - Collision avoidance

    Critical infrastructure awareness:
    - DATA CENTER: Cooling equipment, electrical, RF interference
    - SOLAR FARM: Reflective surfaces, electrical infrastructure
    - WIND FARM: Rotating blades, turbulence zones
    - SUBSTATION: High voltage, magnetic fields, clearances
    """

    # Default safe distances for infrastructure types
    DEFAULT_SAFE_DISTANCES = {
        InfrastructureType.DATA_CENTER: {
            "min_altitude": 10.0,
            "max_altitude": 120.0,
            "horizontal_clearance": 5.0,
            "rooftop_clearance": 3.0,
        },
        InfrastructureType.SOLAR_FARM: {
            "min_altitude": 5.0,
            "max_altitude": 100.0,
            "horizontal_clearance": 3.0,
            "panel_clearance": 2.0,
        },
        InfrastructureType.WIND_FARM: {
            "min_altitude": 20.0,
            "max_altitude": 150.0,
            "horizontal_clearance": 50.0,  # Blade radius + buffer
            "blade_tip_clearance": 20.0,
            "turbulence_zone": 100.0,  # Downwind
        },
        InfrastructureType.UTILITY_SUBSTATION: {
            "min_altitude": 15.0,
            "max_altitude": 80.0,
            "horizontal_clearance": 10.0,
            "electrical_clearance": 5.0,  # From live equipment
        },
        InfrastructureType.TRANSMISSION_LINE: {
            "min_altitude": 30.0,
            "max_altitude": 150.0,
            "horizontal_clearance": 15.0,
            "conductor_clearance": 10.0,
        },
        InfrastructureType.POWER_PLANT: {
            "min_altitude": 20.0,
            "max_altitude": 100.0,
            "horizontal_clearance": 20.0,
            "stack_clearance": 50.0,
        },
    }

    # Emergency landing zone requirements
    EMERGENCY_ZONE_MIN_SIZE = 10.0  # meters diameter

    def __init__(
        self,
        psdk: PSDKInterface,
        infrastructure_type: InfrastructureType,
        weather_limits: Optional[WeatherLimits] = None,
        battery_policy: Optional[BatteryPolicy] = None,
    ):
        """
        Initialize safety manager.

        Args:
            psdk: PSDK interface
            infrastructure_type: Type of infrastructure being inspected
            weather_limits: Custom weather limits
            battery_policy: Custom battery policy
        """
        self.psdk = psdk
        self.infrastructure_type = infrastructure_type
        self.weather_limits = weather_limits or WeatherLimits()
        self.battery_policy = battery_policy or BatteryPolicy()

        self._safety_level = SafetyLevel.NOMINAL
        self._safety_zones: List[SafetyZone] = []
        self._hazard_zones: List[HazardZone] = []
        self._emergency_zones: List[GPSCoordinate] = []
        self._violations: List[SafetyViolation] = []

        # Monitoring tasks
        self._monitoring_task: Optional[asyncio.Task] = None
        self._monitoring_active = False

        # Callbacks
        self._safety_callbacks: List[Callable[[SafetyLevel, str], None]] = []
        self._violation_callbacks: List[Callable[[SafetyViolation], None]] = []

        # Get default distances for infrastructure type
        self._distances = self.DEFAULT_SAFE_DISTANCES.get(
            infrastructure_type,
            self.DEFAULT_SAFE_DISTANCES[InfrastructureType.DATA_CENTER],
        )

        logger.info(
            f"CriticalInfrastructureSafety initialized for {infrastructure_type.name}"
        )

    @property
    def safety_level(self) -> SafetyLevel:
        """Get current safety level."""
        return self._safety_level

    @property
    def is_safe_to_fly(self) -> bool:
        """Check if conditions are safe for flight."""
        return self._safety_level in [SafetyLevel.NOMINAL, SafetyLevel.CAUTION]

    # =========================================================================
    # Safety Zone Management
    # =========================================================================

    def add_safety_zone(self, zone: SafetyZone) -> None:
        """Add a safety zone."""
        self._safety_zones.append(zone)
        logger.info(f"Added safety zone: {zone.zone_id}")

    def add_hazard_zone(self, zone: HazardZone) -> None:
        """Add a hazard zone."""
        self._hazard_zones.append(zone)
        logger.info(f"Added hazard zone: {zone.zone_id} ({zone.hazard_type.name})")

    def add_emergency_landing_zone(self, location: GPSCoordinate) -> None:
        """Add an emergency landing zone."""
        self._emergency_zones.append(location)
        logger.info(f"Added emergency landing zone at {location.latitude}, {location.longitude}")

    def setup_infrastructure_zones(
        self,
        center: GPSCoordinate,
        perimeter_radius: float = 500.0,
    ) -> None:
        """
        Setup default safety zones for infrastructure type.

        Args:
            center: Center of infrastructure
            perimeter_radius: Perimeter radius in meters
        """
        # Create main safety zone
        main_zone = SafetyZone(
            zone_id=f"main_{self.infrastructure_type.name}",
            infrastructure_type=self.infrastructure_type,
            center=center,
            radius=perimeter_radius,
            min_altitude=self._distances["min_altitude"],
            max_altitude=self._distances["max_altitude"],
            max_speed=8.0,  # Reduced speed in infrastructure area
        )
        self.add_safety_zone(main_zone)

        # Add infrastructure-specific hazard zones
        if self.infrastructure_type == InfrastructureType.WIND_FARM:
            self._setup_wind_farm_zones(center)
        elif self.infrastructure_type == InfrastructureType.UTILITY_SUBSTATION:
            self._setup_substation_zones(center)
        elif self.infrastructure_type == InfrastructureType.DATA_CENTER:
            self._setup_datacenter_zones(center)
        elif self.infrastructure_type == InfrastructureType.SOLAR_FARM:
            self._setup_solar_farm_zones(center)

    def _setup_wind_farm_zones(self, center: GPSCoordinate) -> None:
        """Setup wind farm specific hazard zones."""
        # Turbine rotor zone (blade sweep area)
        rotor_zone = HazardZone(
            zone_id="rotor_zone",
            hazard_type=HazardType.ROTATING_EQUIPMENT,
            center=center,
            radius=self._distances["horizontal_clearance"],
            height_min=30.0,  # Hub height - blade length
            height_max=180.0,  # Hub height + blade length
            description="Turbine rotor sweep area - rotating blades",
            severity=SafetyLevel.CRITICAL,
        )
        self.add_hazard_zone(rotor_zone)

        # Turbulence zone (downwind)
        turbulence_zone = HazardZone(
            zone_id="turbulence_zone",
            hazard_type=HazardType.ROTATING_EQUIPMENT,
            center=center,
            radius=self._distances["turbulence_zone"],
            description="Wake turbulence zone - unstable air",
            severity=SafetyLevel.WARNING,
        )
        self.add_hazard_zone(turbulence_zone)

    def _setup_substation_zones(self, center: GPSCoordinate) -> None:
        """Setup substation specific hazard zones."""
        # High voltage zone
        hv_zone = HazardZone(
            zone_id="high_voltage",
            hazard_type=HazardType.ELECTRICAL,
            center=center,
            radius=self._distances["electrical_clearance"],
            description="High voltage equipment - electrical hazard",
            severity=SafetyLevel.CRITICAL,
        )
        self.add_hazard_zone(hv_zone)

        # Magnetic interference zone
        mag_zone = HazardZone(
            zone_id="magnetic_interference",
            hazard_type=HazardType.MAGNETIC,
            center=center,
            radius=15.0,
            description="Magnetic interference from transformers",
            severity=SafetyLevel.WARNING,
        )
        self.add_hazard_zone(mag_zone)

    def _setup_datacenter_zones(self, center: GPSCoordinate) -> None:
        """Setup data center specific hazard zones."""
        # RF interference zone (communications equipment)
        rf_zone = HazardZone(
            zone_id="rf_interference",
            hazard_type=HazardType.RF_INTERFERENCE,
            center=center,
            radius=10.0,
            description="RF interference from communications equipment",
            severity=SafetyLevel.CAUTION,
        )
        self.add_hazard_zone(rf_zone)

        # Cooling exhaust zone
        exhaust_zone = HazardZone(
            zone_id="cooling_exhaust",
            hazard_type=HazardType.THERMAL,
            center=center,
            radius=5.0,
            description="Hot air exhaust from cooling systems",
            severity=SafetyLevel.CAUTION,
        )
        self.add_hazard_zone(exhaust_zone)

    def _setup_solar_farm_zones(self, center: GPSCoordinate) -> None:
        """Setup solar farm specific hazard zones."""
        # Electrical infrastructure zone
        electrical_zone = HazardZone(
            zone_id="electrical_infrastructure",
            hazard_type=HazardType.ELECTRICAL,
            center=center,
            radius=8.0,
            description="Inverters and electrical equipment",
            severity=SafetyLevel.WARNING,
        )
        self.add_hazard_zone(electrical_zone)

    # =========================================================================
    # Position Validation
    # =========================================================================

    def validate_position(
        self,
        position: GPSCoordinate,
    ) -> Tuple[bool, SafetyLevel, List[str]]:
        """
        Validate if a position is safe.

        Args:
            position: GPS position to validate

        Returns:
            Tuple of (is_safe, safety_level, list of warnings)
        """
        warnings = []
        max_severity = SafetyLevel.NOMINAL

        # Check against safety zones
        for zone in self._safety_zones:
            distance = self._calculate_distance(position, zone.center)

            # Check if outside allowed zone
            if distance > zone.radius:
                warnings.append(f"Outside safety zone {zone.zone_id}")
                max_severity = max(max_severity, SafetyLevel.WARNING, key=lambda x: x.value)

            # Check altitude limits
            if position.altitude_agl < zone.min_altitude:
                warnings.append(
                    f"Below minimum altitude {zone.min_altitude}m in zone {zone.zone_id}"
                )
                max_severity = max(max_severity, SafetyLevel.WARNING, key=lambda x: x.value)

            if position.altitude_agl > zone.max_altitude:
                warnings.append(
                    f"Above maximum altitude {zone.max_altitude}m in zone {zone.zone_id}"
                )
                max_severity = max(max_severity, SafetyLevel.WARNING, key=lambda x: x.value)

            # Check no-fly areas
            for nfa_center, nfa_radius in zone.no_fly_areas:
                nfa_distance = self._calculate_distance(position, nfa_center)
                if nfa_distance < nfa_radius:
                    warnings.append(f"Inside no-fly area in zone {zone.zone_id}")
                    max_severity = SafetyLevel.CRITICAL

        # Check against hazard zones
        for hazard in self._hazard_zones:
            if not hazard.active:
                continue

            distance = self._calculate_distance(position, hazard.center)

            if distance < hazard.radius:
                # Check altitude range
                if hazard.height_min <= position.altitude_agl <= hazard.height_max:
                    warnings.append(
                        f"Inside hazard zone {hazard.zone_id}: {hazard.description}"
                    )
                    max_severity = max(max_severity, hazard.severity, key=lambda x: x.value)

        is_safe = max_severity.value <= SafetyLevel.WARNING.value

        return is_safe, max_severity, warnings

    def validate_flight_path(
        self,
        waypoints: List[FlightCommand],
    ) -> Tuple[bool, List[Tuple[int, List[str]]]]:
        """
        Validate entire flight path.

        Args:
            waypoints: List of flight commands

        Returns:
            Tuple of (is_safe, list of (waypoint_index, warnings))
        """
        all_safe = True
        issues = []

        for i, wp in enumerate(waypoints):
            if wp.target_position:
                is_safe, level, warnings = self.validate_position(wp.target_position)
                if warnings:
                    issues.append((i, warnings))
                if not is_safe:
                    all_safe = False

        return all_safe, issues

    # =========================================================================
    # Real-time Monitoring
    # =========================================================================

    async def start_monitoring(self) -> None:
        """Start real-time safety monitoring."""
        if self._monitoring_active:
            return

        self._monitoring_active = True
        self._monitoring_task = asyncio.create_task(self._monitoring_loop())
        logger.info("Safety monitoring started")

    async def stop_monitoring(self) -> None:
        """Stop safety monitoring."""
        self._monitoring_active = False
        if self._monitoring_task:
            self._monitoring_task.cancel()
            self._monitoring_task = None
        logger.info("Safety monitoring stopped")

    async def _monitoring_loop(self) -> None:
        """Background monitoring loop."""
        while self._monitoring_active:
            try:
                telemetry = self.psdk.telemetry
                if telemetry:
                    await self._check_safety_conditions(telemetry)

                await asyncio.sleep(0.1)  # 10Hz monitoring

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(1.0)

    async def _check_safety_conditions(self, telemetry: FlightTelemetry) -> None:
        """Check all safety conditions."""
        new_level = SafetyLevel.NOMINAL
        alerts = []

        # Check position
        is_safe, pos_level, pos_warnings = self.validate_position(telemetry.position)
        if not is_safe or pos_level.value > SafetyLevel.CAUTION.value:
            new_level = max(new_level, pos_level, key=lambda x: x.value)
            alerts.extend(pos_warnings)

        # Check battery
        battery_level = self._check_battery(telemetry)
        new_level = max(new_level, battery_level, key=lambda x: x.value)

        # Check weather
        weather_level, weather_alerts = self._check_weather(telemetry)
        new_level = max(new_level, weather_level, key=lambda x: x.value)
        alerts.extend(weather_alerts)

        # Check for obstacles
        obstacle_level, obstacle_alerts = self._check_obstacles(telemetry)
        new_level = max(new_level, obstacle_level, key=lambda x: x.value)
        alerts.extend(obstacle_alerts)

        # Update safety level if changed
        if new_level != self._safety_level:
            old_level = self._safety_level
            self._safety_level = new_level
            logger.warning(
                f"Safety level changed: {old_level.name} -> {new_level.name}"
            )
            self._notify_safety_change(new_level, "; ".join(alerts))

            # Take action based on new level
            await self._handle_safety_level_change(new_level, telemetry)

    def _check_battery(self, telemetry: FlightTelemetry) -> SafetyLevel:
        """Check battery status."""
        battery = telemetry.battery_percentage
        temp = telemetry.battery_temperature

        if battery <= self.battery_policy.critical_level:
            return SafetyLevel.EMERGENCY
        elif battery <= self.battery_policy.landing_reserve:
            return SafetyLevel.CRITICAL
        elif battery <= self.battery_policy.return_to_home_reserve:
            return SafetyLevel.WARNING
        elif battery <= self.battery_policy.warning_level:
            return SafetyLevel.CAUTION

        # Check temperature
        if temp > self.battery_policy.temperature_max:
            return SafetyLevel.WARNING
        if temp < self.battery_policy.temperature_min:
            return SafetyLevel.CAUTION

        return SafetyLevel.NOMINAL

    def _check_weather(
        self,
        telemetry: FlightTelemetry,
    ) -> Tuple[SafetyLevel, List[str]]:
        """Check weather conditions."""
        alerts = []
        level = SafetyLevel.NOMINAL

        wind = telemetry.wind_speed

        if wind > self.weather_limits.max_gust_speed:
            level = SafetyLevel.CRITICAL
            alerts.append(f"Wind speed {wind:.1f}m/s exceeds gust limit")
        elif wind > self.weather_limits.max_wind_speed:
            level = SafetyLevel.WARNING
            alerts.append(f"Wind speed {wind:.1f}m/s exceeds normal limit")

        return level, alerts

    def _check_obstacles(
        self,
        telemetry: FlightTelemetry,
    ) -> Tuple[SafetyLevel, List[str]]:
        """Check obstacle distances."""
        alerts = []
        level = SafetyLevel.NOMINAL

        for direction, distance in telemetry.obstacle_distance.items():
            if distance < 2.0:  # Less than 2 meters
                level = SafetyLevel.CRITICAL
                alerts.append(f"Obstacle {distance:.1f}m {direction}")
            elif distance < 5.0:
                level = max(level, SafetyLevel.WARNING, key=lambda x: x.value)
                alerts.append(f"Obstacle {distance:.1f}m {direction}")

        return level, alerts

    async def _handle_safety_level_change(
        self,
        level: SafetyLevel,
        telemetry: FlightTelemetry,
    ) -> None:
        """Handle safety level change with appropriate action."""
        if level == SafetyLevel.EMERGENCY:
            logger.critical("EMERGENCY: Initiating emergency landing!")
            await self._initiate_emergency_landing(telemetry)

        elif level == SafetyLevel.CRITICAL:
            logger.warning("CRITICAL: Initiating Return-to-Home")
            await self.psdk.return_to_home()

        elif level == SafetyLevel.WARNING:
            logger.warning("WARNING: Reducing operations")
            # Could reduce speed, limit maneuvers, etc.

    async def _initiate_emergency_landing(
        self,
        telemetry: FlightTelemetry,
    ) -> None:
        """Initiate emergency landing procedure."""
        # Find nearest emergency landing zone
        if self._emergency_zones:
            nearest = min(
                self._emergency_zones,
                key=lambda z: self._calculate_distance(telemetry.position, z),
            )
            distance = self._calculate_distance(telemetry.position, nearest)

            if distance < 100:  # Within 100m of emergency zone
                logger.info(f"Landing at emergency zone {distance:.0f}m away")
                await self.psdk.set_position(
                    latitude=nearest.latitude,
                    longitude=nearest.longitude,
                    altitude=10.0,
                    speed=5.0,
                )
                await asyncio.sleep(5)  # Wait to reach position
                await self.psdk.land()
                return

        # No suitable zone, land immediately
        logger.warning("No suitable emergency zone, landing immediately")
        await self.psdk.land()

    # =========================================================================
    # Violation Recording
    # =========================================================================

    def record_violation(
        self,
        violation_type: str,
        severity: SafetyLevel,
        location: GPSCoordinate,
        description: str,
        action_taken: str,
    ) -> SafetyViolation:
        """Record a safety violation."""
        violation = SafetyViolation(
            violation_id=f"violation_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            timestamp=datetime.now(),
            violation_type=violation_type,
            severity=severity,
            location=location,
            description=description,
            action_taken=action_taken,
        )

        self._violations.append(violation)
        logger.warning(f"Safety violation recorded: {violation_type} - {description}")

        for callback in self._violation_callbacks:
            try:
                callback(violation)
            except Exception as e:
                logger.error(f"Violation callback error: {e}")

        return violation

    def get_violations(self, since: Optional[datetime] = None) -> List[SafetyViolation]:
        """Get recorded violations."""
        if since:
            return [v for v in self._violations if v.timestamp >= since]
        return self._violations.copy()

    # =========================================================================
    # Callbacks
    # =========================================================================

    def register_safety_callback(
        self,
        callback: Callable[[SafetyLevel, str], None],
    ) -> None:
        """Register callback for safety level changes."""
        self._safety_callbacks.append(callback)

    def register_violation_callback(
        self,
        callback: Callable[[SafetyViolation], None],
    ) -> None:
        """Register callback for safety violations."""
        self._violation_callbacks.append(callback)

    def _notify_safety_change(self, level: SafetyLevel, message: str) -> None:
        """Notify callbacks of safety level change."""
        for callback in self._safety_callbacks:
            try:
                callback(level, message)
            except Exception as e:
                logger.error(f"Safety callback error: {e}")

    # =========================================================================
    # Helper Methods
    # =========================================================================

    def _calculate_distance(
        self,
        pos1: GPSCoordinate,
        pos2: GPSCoordinate,
    ) -> float:
        """Calculate distance between two GPS coordinates."""
        lat1, lon1 = math.radians(pos1.latitude), math.radians(pos1.longitude)
        lat2, lon2 = math.radians(pos2.latitude), math.radians(pos2.longitude)

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))

        return 6371000 * c  # Earth radius in meters

    def get_safe_distances(self) -> Dict[str, float]:
        """Get safe distances for current infrastructure type."""
        return self._distances.copy()

    def is_blade_rotation_safe(self, rotation_status: str) -> bool:
        """Check if wind turbine blade rotation status is safe for inspection."""
        return rotation_status.lower() in ["stopped", "locked", "parked"]

    async def request_turbine_stop(self) -> bool:
        """Request wind turbine to stop for inspection (via external system)."""
        logger.info("Requesting turbine stop for safe blade inspection")
        # In real implementation, this would communicate with SCADA system
        return True
