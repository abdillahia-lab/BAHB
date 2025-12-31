"""
PSDK Type Definitions for Drone Inspection System

Comprehensive type definitions for flight control, gimbal operations,
defect recapture, and critical infrastructure safety.
"""

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Optional, List, Callable, Any, Dict, Tuple
from datetime import datetime
import numpy as np


class FlightMode(Enum):
    """Drone flight modes for inspection operations."""
    MANUAL = auto()          # Manual RC control
    WAYPOINT = auto()        # Autonomous waypoint navigation
    ORBIT = auto()           # Circular orbit around POI
    HOVER = auto()           # Position hold
    FOLLOW_SUBJECT = auto()  # Track and follow detected object
    RETURN_TO_HOME = auto()  # RTH mode
    LANDING = auto()         # Controlled landing
    INSPECTION_SCAN = auto() # Systematic grid scan pattern
    DEFECT_FOCUS = auto()    # Focused inspection on detected defect


class GimbalMode(Enum):
    """Gimbal control modes."""
    FREE = auto()            # Free rotation
    FOLLOW = auto()          # Follow drone heading
    FPV = auto()             # First-person view locked
    POINT_OF_INTEREST = auto()  # Lock onto POI
    TRACKING = auto()        # Track detected object
    DEFECT_CENTER = auto()   # Center on detected defect


class FlightAdjustmentType(Enum):
    """Types of flight adjustments for better defect imaging."""
    CLOSER_APPROACH = auto()      # Move closer to defect
    ORBIT_AROUND = auto()         # Circular path around defect
    ALTITUDE_ADJUST = auto()      # Change altitude for better angle
    ANGLE_OPTIMIZE = auto()       # Adjust for optimal viewing angle
    MULTI_ANGLE_CAPTURE = auto()  # Multiple positions around defect
    HOVER_EXTENDED = auto()       # Extended hover for video capture
    ZOOM_CAPTURE = auto()         # Zoom in from current position
    THERMAL_SWEEP = auto()        # Thermal imaging sweep pattern


class InfrastructureType(Enum):
    """Critical infrastructure types with specific safety requirements."""
    DATA_CENTER = auto()
    SOLAR_FARM = auto()
    WIND_FARM = auto()
    UTILITY_SUBSTATION = auto()
    TRANSMISSION_LINE = auto()
    POWER_PLANT = auto()
    TELECOMMUNICATIONS = auto()


class RecaptureOption(Enum):
    """Options presented to user for defect recapture."""
    QUICK_ZOOM = "Quick Zoom Capture"           # 5-10 seconds
    DETAILED_ORBIT = "Detailed Orbit Scan"      # 30-60 seconds
    MULTI_ANGLE = "Multi-Angle Capture"         # 20-30 seconds
    THERMAL_ANALYSIS = "Thermal Analysis Pass"  # 15-20 seconds
    VIDEO_DOCUMENTATION = "Video Documentation" # 30-45 seconds
    SKIP = "Continue Mission"                   # Skip recapture
    MANUAL_CONTROL = "Take Manual Control"      # Hand off to operator


@dataclass
class GPSCoordinate:
    """GPS coordinate with precision tracking."""
    latitude: float
    longitude: float
    altitude_msl: float  # Altitude above mean sea level (meters)
    altitude_agl: float  # Altitude above ground level (meters)
    horizontal_accuracy: float = 0.5  # meters
    vertical_accuracy: float = 1.0    # meters
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class FlightCommand:
    """Command structure for flight control operations."""
    mode: FlightMode
    target_position: Optional[GPSCoordinate] = None
    target_velocity: Optional[Tuple[float, float, float]] = None  # (vx, vy, vz) m/s
    target_yaw: Optional[float] = None  # degrees
    speed: float = 5.0  # m/s
    acceleration: float = 2.0  # m/s²
    timeout: float = 30.0  # seconds
    priority: int = 1  # 1 = normal, 2 = high, 3 = critical/safety
    reason: str = ""
    defect_id: Optional[str] = None  # Associated defect if any


@dataclass
class GimbalCommand:
    """Command structure for gimbal control."""
    mode: GimbalMode
    pitch: Optional[float] = None  # degrees (-90 to +30)
    yaw: Optional[float] = None    # degrees (-180 to +180)
    roll: Optional[float] = None   # degrees
    rotation_speed: float = 30.0   # degrees/second
    smoothing: float = 0.5         # 0-1, higher = smoother
    target_pixel: Optional[Tuple[int, int]] = None  # For auto-centering
    track_box: Optional[Tuple[int, int, int, int]] = None  # Bounding box to track


@dataclass
class CameraCommand:
    """Camera control commands."""
    zoom_level: Optional[float] = None    # 1x to 200x for H30T
    capture_photo: bool = False
    start_recording: bool = False
    stop_recording: bool = False
    camera_mode: str = "auto"             # auto, manual, thermal
    iso: Optional[int] = None
    shutter_speed: Optional[str] = None
    aperture: Optional[float] = None
    focus_mode: str = "auto"
    thermal_palette: str = "whitehot"     # whitehot, blackhot, rainbow, etc.


@dataclass
class DefectLocation:
    """Precise location of detected defect."""
    gps: GPSCoordinate
    pixel_coordinates: Tuple[int, int]    # (x, y) in frame
    bounding_box: Tuple[int, int, int, int]  # (x1, y1, x2, y2)
    estimated_size: Tuple[float, float]   # (width, height) in meters
    distance_from_drone: float            # meters (from laser rangefinder)
    bearing_from_drone: float             # degrees
    surface_normal: Optional[Tuple[float, float, float]] = None  # For 3D surfaces


@dataclass
class RecaptureRequest:
    """Request for defect recapture with enhanced imaging."""
    defect_id: str
    defect_type: str
    defect_description: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    location: DefectLocation
    original_image: np.ndarray
    thermal_image: Optional[np.ndarray] = None
    confidence: float = 0.0
    recommended_options: List[RecaptureOption] = field(default_factory=list)
    infrastructure_type: InfrastructureType = InfrastructureType.DATA_CENTER
    time_available: float = 120.0  # seconds available for recapture
    battery_remaining: float = 50.0  # percentage
    model_requesting: str = "qwen-vl"  # Which AI model requested recapture


@dataclass
class UserDecision:
    """User's decision on flight adjustment."""
    option_selected: RecaptureOption
    custom_parameters: Optional[Dict[str, Any]] = None
    timestamp: datetime = field(default_factory=datetime.now)
    timeout_occurred: bool = False
    auto_selected: bool = False  # True if system auto-selected due to timeout


@dataclass
class RecaptureResult:
    """Result of defect recapture operation."""
    defect_id: str
    success: bool
    images_captured: List[np.ndarray] = field(default_factory=list)
    thermal_images: List[np.ndarray] = field(default_factory=list)
    video_path: Optional[str] = None
    capture_positions: List[GPSCoordinate] = field(default_factory=list)
    total_time: float = 0.0  # seconds
    new_analysis: Optional[str] = None  # Updated AI analysis
    error_message: Optional[str] = None


@dataclass
class SafetyZone:
    """Defined safety zone for critical infrastructure."""
    zone_id: str
    infrastructure_type: InfrastructureType
    center: GPSCoordinate
    radius: float  # meters
    min_altitude: float  # meters AGL
    max_altitude: float  # meters AGL
    no_fly_areas: List[Tuple[GPSCoordinate, float]] = field(default_factory=list)  # (center, radius)
    magnetic_interference_zones: List[Tuple[GPSCoordinate, float]] = field(default_factory=list)
    rf_interference_zones: List[Tuple[GPSCoordinate, float]] = field(default_factory=list)
    max_speed: float = 10.0  # m/s
    require_visual_observer: bool = True
    emergency_landing_zones: List[GPSCoordinate] = field(default_factory=list)


@dataclass
class TurbineBladeInfo:
    """Wind turbine blade specific information."""
    turbine_id: str
    blade_number: int  # 1, 2, or 3 typically
    blade_length: float  # meters
    rotation_status: str  # "stopped", "slow", "normal", "locked"
    current_angle: float  # degrees (blade pitch)
    last_inspection: Optional[datetime] = None
    known_issues: List[str] = field(default_factory=list)
    manufacturer: str = ""
    model: str = ""
    installation_date: Optional[datetime] = None


@dataclass
class FlightTelemetry:
    """Real-time flight telemetry data from PSDK."""
    timestamp: datetime
    position: GPSCoordinate
    velocity: Tuple[float, float, float]  # (vx, vy, vz) m/s
    attitude: Tuple[float, float, float]  # (roll, pitch, yaw) degrees
    battery_percentage: float
    battery_voltage: float
    battery_temperature: float
    gps_satellites: int
    gps_signal_level: int  # 0-5
    rc_signal_strength: int  # percentage
    wind_speed: float  # m/s
    wind_direction: float  # degrees
    flight_mode: FlightMode
    motors_running: bool
    home_location: GPSCoordinate
    flight_time: float  # seconds
    distance_from_home: float  # meters
    obstacle_distance: Dict[str, float] = field(default_factory=dict)  # direction -> distance


@dataclass
class FlightAdjustmentPlan:
    """Planned flight adjustment for defect recapture."""
    plan_id: str
    defect_id: str
    adjustment_type: FlightAdjustmentType
    waypoints: List[FlightCommand] = field(default_factory=list)
    gimbal_commands: List[GimbalCommand] = field(default_factory=list)
    camera_commands: List[CameraCommand] = field(default_factory=list)
    estimated_duration: float = 0.0  # seconds
    estimated_battery_usage: float = 0.0  # percentage
    safety_validated: bool = False
    user_approved: bool = False
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class PSDKStatus:
    """PSDK connection and system status."""
    connected: bool = False
    sdk_version: str = ""
    aircraft_serial: str = ""
    aircraft_model: str = ""
    gimbal_connected: bool = False
    camera_connected: bool = False
    rtk_available: bool = False
    rtk_connected: bool = False
    payload_connected: bool = False
    last_heartbeat: Optional[datetime] = None
    error_codes: List[int] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
