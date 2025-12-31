"""
BAHB PSDK Integration Module

DJI Payload SDK integration for autonomous drone inspection with:
- Flight control and waypoint navigation
- Gimbal and camera control for defect imaging
- Defect recapture system for enhanced anomaly analysis
- User interaction for flight adjustment decisions
- Critical infrastructure safety protocols
- Wind turbine blade inspection

When Qwen-VL detects a defect (like a cracked turbine blade):
1. System presents user with flight adjustment options
2. User can select: Quick Zoom, Multi-Angle, Orbit, Thermal, Video, or Skip
3. Drone adjusts flight to get better photo/video of defect
4. New imagery sent back to AI model for enhanced analysis
5. Results reported with before/after comparison

Designed for inspection of:
- Data Centers (cooling, electrical, RF)
- Solar Farms (panels, inverters, electrical)
- Wind Farms (Turbine Blades - cracks, erosion, lightning damage)
- Utility Substations (transformers, insulators, switchgear)
- Critical Infrastructure
"""

from .types import (
    FlightCommand,
    FlightMode,
    GimbalCommand,
    GimbalMode,
    RecaptureRequest,
    RecaptureOption,
    UserDecision,
    SafetyZone,
    InfrastructureType,
    FlightAdjustmentType,
    GPSCoordinate,
    DefectLocation,
    TurbineBladeInfo,
    FlightTelemetry,
    FlightAdjustmentPlan,
    RecaptureResult,
    PSDKStatus,
)
from .core import PSDKInterface
from .flight_controller import FlightController, ApproachParameters
from .gimbal_controller import GimbalController, CameraMode, TrackingConfig
from .defect_recapture import DefectRecaptureSystem, RecaptureSession
from .user_interaction import UserInteractionManager, WebSocketMessageHandler, MQTTMessageHandler
from .safety import CriticalInfrastructureSafety, SafetyLevel, HazardType
from .turbine_inspection import TurbineBladeInspector, BladeDefect, BladeSection, BladeSide
from .integration import PSDKInspectionIntegration, PSDKIntegrationConfig, create_psdk_integration

__all__ = [
    # Types
    "FlightCommand",
    "FlightMode",
    "GimbalCommand",
    "GimbalMode",
    "RecaptureRequest",
    "RecaptureOption",
    "UserDecision",
    "SafetyZone",
    "InfrastructureType",
    "FlightAdjustmentType",
    "GPSCoordinate",
    "DefectLocation",
    "TurbineBladeInfo",
    "FlightTelemetry",
    "FlightAdjustmentPlan",
    "RecaptureResult",
    "PSDKStatus",
    # Core Components
    "PSDKInterface",
    "FlightController",
    "ApproachParameters",
    "GimbalController",
    "CameraMode",
    "TrackingConfig",
    "DefectRecaptureSystem",
    "RecaptureSession",
    "UserInteractionManager",
    "WebSocketMessageHandler",
    "MQTTMessageHandler",
    "CriticalInfrastructureSafety",
    "SafetyLevel",
    "HazardType",
    # Turbine Inspection
    "TurbineBladeInspector",
    "BladeDefect",
    "BladeSection",
    "BladeSide",
    # Integration
    "PSDKInspectionIntegration",
    "PSDKIntegrationConfig",
    "create_psdk_integration",
]
