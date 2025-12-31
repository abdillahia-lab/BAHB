"""
PSDK Integration with BAHB Inspection Engine

Integrates PSDK flight control with the main inspection engine to enable:
- Automatic flight adjustments when defects detected
- User-prompted recapture options
- Enhanced AI analysis with new imagery
- Critical infrastructure safety protocols
"""

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Callable, Dict, Any, List
import numpy as np

from .core import PSDKInterface
from .flight_controller import FlightController, ApproachParameters
from .gimbal_controller import GimbalController, TrackingConfig
from .defect_recapture import DefectRecaptureSystem
from .user_interaction import UserInteractionManager
from .safety import CriticalInfrastructureSafety, SafetyLevel
from .turbine_inspection import TurbineBladeInspector
from .types import (
    GPSCoordinate,
    DefectLocation,
    InfrastructureType,
    RecaptureRequest,
    RecaptureOption,
    UserDecision,
    TurbineBladeInfo,
    FlightTelemetry,
)

logger = logging.getLogger(__name__)


@dataclass
class PSDKIntegrationConfig:
    """Configuration for PSDK integration."""
    # DJI credentials
    app_id: str = ""
    app_key: str = ""
    app_license: str = ""

    # Infrastructure type
    infrastructure_type: InfrastructureType = InfrastructureType.DATA_CENTER

    # Recapture settings
    user_decision_timeout: float = 30.0
    auto_recapture_severity: str = "HIGH"
    enable_auto_recapture: bool = True

    # Safety settings
    enable_safety_monitoring: bool = True
    battery_return_reserve: float = 25.0
    max_wind_speed: float = 12.0

    # Flight settings
    default_inspection_distance: float = 8.0
    default_orbit_radius: float = 5.0
    max_speed: float = 8.0


class PSDKInspectionIntegration:
    """
    PSDK Integration Manager for BAHB Inspection Engine.

    Provides seamless integration between:
    - AI inference pipeline (Qwen-VL detection)
    - PSDK flight control
    - Defect recapture system
    - User interaction for flight decisions
    - Critical infrastructure safety

    Flow when Qwen detects a defect:
    1. Engine calls on_anomaly_detected()
    2. Integration creates recapture request
    3. User is prompted with options (or auto-selected for critical)
    4. Flight adjustment executed
    5. Enhanced images captured
    6. New images sent back to Qwen for analysis
    7. Updated results reported
    """

    def __init__(self, config: Optional[PSDKIntegrationConfig] = None):
        """
        Initialize PSDK integration.

        Args:
            config: Integration configuration
        """
        self.config = config or PSDKIntegrationConfig()

        # Core PSDK interface
        self.psdk = PSDKInterface(
            app_id=self.config.app_id,
            app_key=self.config.app_key,
            app_license=self.config.app_license,
        )

        # Controllers
        self.flight_controller = FlightController(
            psdk=self.psdk,
            approach_params=ApproachParameters(
                optimal_distance=self.config.default_inspection_distance,
            ),
        )

        self.gimbal_controller = GimbalController(
            psdk=self.psdk,
            tracking_config=TrackingConfig(auto_zoom=True),
        )

        # Recapture system
        self.recapture_system = DefectRecaptureSystem(
            psdk=self.psdk,
            flight_controller=self.flight_controller,
            gimbal_controller=self.gimbal_controller,
            user_timeout=self.config.user_decision_timeout,
            auto_recapture_severity=self.config.auto_recapture_severity,
        )

        # User interaction
        self.user_interaction = UserInteractionManager(
            default_timeout=self.config.user_decision_timeout,
            auto_select_on_timeout=True,
        )

        # Safety manager
        self.safety_manager = CriticalInfrastructureSafety(
            psdk=self.psdk,
            infrastructure_type=self.config.infrastructure_type,
        )

        # Turbine inspector (for wind farm inspections)
        self.turbine_inspector: Optional[TurbineBladeInspector] = None

        # State
        self._initialized = False
        self._active_inspection = False

        # AI analyzer reference (set by engine)
        self._ai_analyzer: Optional[Callable] = None

        # Callbacks
        self._enhanced_result_callbacks: List[Callable] = []

        logger.info("PSDKInspectionIntegration initialized")

    async def initialize(self) -> bool:
        """
        Initialize PSDK connection and subsystems.

        Returns:
            True if initialization successful
        """
        logger.info("Initializing PSDK integration...")

        try:
            # Connect to PSDK
            connected = await self.psdk.connect()
            if not connected:
                logger.error("Failed to connect to PSDK")
                return False

            # Setup user interaction callback for recapture
            self.recapture_system.set_user_prompt_callback(
                self.user_interaction.prompt_user_for_recapture
            )

            # Setup AI analyzer callback
            self.recapture_system.ai_analyzer = self._analyze_with_ai

            # Start safety monitoring if enabled
            if self.config.enable_safety_monitoring:
                await self.safety_manager.start_monitoring()

            # Initialize turbine inspector for wind farms
            if self.config.infrastructure_type == InfrastructureType.WIND_FARM:
                self.turbine_inspector = TurbineBladeInspector(
                    psdk=self.psdk,
                    flight_controller=self.flight_controller,
                    gimbal_controller=self.gimbal_controller,
                    recapture_system=self.recapture_system,
                    safety_manager=self.safety_manager,
                    ai_analyzer=self._analyze_with_ai,
                )

            self._initialized = True
            logger.info("PSDK integration initialized successfully")
            return True

        except Exception as e:
            logger.error(f"PSDK initialization failed: {e}")
            return False

    async def shutdown(self) -> None:
        """Shutdown PSDK integration."""
        logger.info("Shutting down PSDK integration...")

        await self.safety_manager.stop_monitoring()
        await self.psdk.disconnect()

        self._initialized = False

    def set_ai_analyzer(self, analyzer: Callable) -> None:
        """
        Set the AI analyzer callback (Qwen-VL or pipeline).

        Args:
            analyzer: Async function that analyzes images
        """
        self._ai_analyzer = analyzer
        if self.recapture_system:
            self.recapture_system.ai_analyzer = self._analyze_with_ai

    async def _analyze_with_ai(
        self,
        image: Optional[np.ndarray] = None,
        thermal_image: Optional[np.ndarray] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Wrapper for AI analysis."""
        if not self._ai_analyzer:
            return {"description": "No AI analyzer configured", "severity": "MEDIUM"}

        try:
            return await self._ai_analyzer(
                image=image,
                thermal_image=thermal_image,
                **kwargs,
            )
        except Exception as e:
            logger.error(f"AI analysis error: {e}")
            return {"description": f"Analysis error: {e}", "severity": "UNKNOWN"}

    # =========================================================================
    # Main Integration Points
    # =========================================================================

    async def on_anomaly_detected(
        self,
        anomaly_type: str,
        severity: str,
        description: str,
        confidence: float,
        bbox: tuple,
        frame: np.ndarray,
        thermal_frame: Optional[np.ndarray] = None,
        gps_location: Optional[GPSCoordinate] = None,
        model_source: str = "qwen-vl",
    ) -> Optional[Dict[str, Any]]:
        """
        Called when AI detects an anomaly that may need recapture.

        This is the main integration point with the inspection engine.
        When Qwen-VL or other models detect a defect, this method:
        1. Evaluates if recapture would be beneficial
        2. Presents options to the user
        3. Executes the selected flight adjustment
        4. Captures enhanced imagery
        5. Returns updated analysis

        Args:
            anomaly_type: Type of detected anomaly
            severity: Severity level (CRITICAL, HIGH, MEDIUM, LOW)
            description: AI-generated description
            confidence: Detection confidence
            bbox: Bounding box (x1, y1, x2, y2)
            frame: Current camera frame
            thermal_frame: Current thermal frame
            gps_location: GPS location of anomaly
            model_source: Which AI model detected this

        Returns:
            Dict with enhanced analysis results, or None if no recapture
        """
        if not self._initialized:
            logger.warning("PSDK not initialized, skipping recapture")
            return None

        # Check safety level
        if self.safety_manager.safety_level.value >= SafetyLevel.CRITICAL.value:
            logger.warning("Safety level too high for recapture operations")
            return None

        # Get current telemetry for location
        telemetry = self.psdk.telemetry
        if not gps_location and telemetry:
            gps_location = telemetry.position

        if not gps_location:
            logger.warning("No GPS location available")
            return None

        # Create defect location
        center_x = (bbox[0] + bbox[2]) // 2
        center_y = (bbox[1] + bbox[3]) // 2

        defect_location = DefectLocation(
            gps=gps_location,
            pixel_coordinates=(center_x, center_y),
            bounding_box=bbox,
            estimated_size=(0.1, 0.1),  # Estimated size in meters
            distance_from_drone=10.0,  # Would be from rangefinder
            bearing_from_drone=0.0,
        )

        # Determine if this is a turbine blade defect
        is_blade_defect = (
            self.config.infrastructure_type == InfrastructureType.WIND_FARM and
            "blade" in anomaly_type.lower()
        )

        if is_blade_defect and self.turbine_inspector:
            # Handle with turbine-specific inspector
            return await self._handle_blade_defect(
                anomaly_type=anomaly_type,
                description=description,
                defect_location=defect_location,
                frame=frame,
            )

        # Standard recapture flow
        logger.info(
            f"Initiating recapture for {anomaly_type} "
            f"(severity={severity}, confidence={confidence:.2f})"
        )

        # Check if auto-recapture or user prompt
        if self.config.enable_auto_recapture and severity in ["CRITICAL", "HIGH"]:
            session = await self.recapture_system.initiate_auto_recapture(
                defect_type=anomaly_type,
                severity=severity,
                location=defect_location,
                original_image=frame,
                thermal_image=thermal_frame,
            )
        else:
            session = await self.recapture_system.initiate_recapture(
                defect_type=anomaly_type,
                defect_description=description,
                severity=severity,
                location=defect_location,
                original_image=frame,
                thermal_image=thermal_frame,
                confidence=confidence,
                infrastructure_type=self.config.infrastructure_type,
                model_requesting=model_source,
            )

        if not session:
            return None

        # Return enhanced analysis results
        return {
            "session_id": session.session_id,
            "original_analysis": description,
            "enhanced_analysis": session.analysis_results,
            "images_captured": len(session.captured_images),
            "recapture_completed": session.state.name == "COMPLETED",
            "user_decision": session.user_decision.option_selected.value if session.user_decision else None,
        }

    async def _handle_blade_defect(
        self,
        anomaly_type: str,
        description: str,
        defect_location: DefectLocation,
        frame: np.ndarray,
    ) -> Dict[str, Any]:
        """Handle wind turbine blade defect with specialized inspection."""
        logger.info("Handling turbine blade defect with specialized inspector")

        # Quick crack inspection
        defect = await self.turbine_inspector.quick_crack_inspection(
            crack_location=defect_location,
            turbine_info=TurbineBladeInfo(
                turbine_id="current",
                blade_number=1,
                blade_length=50.0,
                rotation_status="stopped",
                current_angle=0.0,
            ),
        )

        return {
            "defect_id": defect.defect_id,
            "defect_type": defect.defect_type.name,
            "severity": defect.severity,
            "description": defect.description,
            "size_estimate": defect.size_estimate,
            "ai_analysis": defect.ai_analysis,
            "recommended_action": defect.recommended_action,
        }

    # =========================================================================
    # User Response Handling
    # =========================================================================

    async def handle_user_recapture_response(
        self,
        decision_id: str,
        option: RecaptureOption,
        custom_params: Optional[Dict] = None,
    ) -> bool:
        """
        Handle user's response to recapture prompt.

        Called from web dashboard, mobile app, or ground station.

        Args:
            decision_id: The decision ID
            option: Selected recapture option
            custom_params: Optional custom parameters

        Returns:
            True if response processed
        """
        return await self.user_interaction.submit_user_response(
            decision_id=decision_id,
            option=option,
            custom_parameters=custom_params,
        )

    # =========================================================================
    # Flight Control Wrappers
    # =========================================================================

    async def adjust_for_better_view(
        self,
        target_gps: GPSCoordinate,
        approach_distance: float = 5.0,
    ) -> bool:
        """
        Adjust flight position for better view of target.

        Args:
            target_gps: GPS of target
            approach_distance: Distance to maintain

        Returns:
            True if adjustment successful
        """
        if not self._initialized:
            return False

        # Create defect location from GPS
        defect = DefectLocation(
            gps=target_gps,
            pixel_coordinates=(0, 0),
            bounding_box=(0, 0, 0, 0),
            estimated_size=(0, 0),
            distance_from_drone=approach_distance,
            bearing_from_drone=0.0,
        )

        return await self.flight_controller.quick_closer_approach(
            defect=defect,
            distance=approach_distance,
        )

    async def orbit_target(
        self,
        target_gps: GPSCoordinate,
        radius: float = 5.0,
        duration: float = 30.0,
    ) -> bool:
        """
        Orbit around target for comprehensive imaging.

        Args:
            target_gps: GPS of target
            radius: Orbit radius
            duration: Orbit duration

        Returns:
            True if orbit completed
        """
        if not self._initialized:
            return False

        defect = DefectLocation(
            gps=target_gps,
            pixel_coordinates=(0, 0),
            bounding_box=(0, 0, 0, 0),
            estimated_size=(0, 0),
            distance_from_drone=radius,
            bearing_from_drone=0.0,
        )

        return await self.flight_controller.orbit_defect(
            defect=defect,
            radius=radius,
            duration=duration,
        )

    # =========================================================================
    # Gimbal Control Wrappers
    # =========================================================================

    async def center_on_detection(self, bbox: tuple) -> bool:
        """
        Center gimbal on detection bounding box.

        Args:
            bbox: Bounding box (x1, y1, x2, y2)

        Returns:
            True if centering successful
        """
        if not self._initialized:
            return False

        center_x = (bbox[0] + bbox[2]) // 2
        center_y = (bbox[1] + bbox[3]) // 2

        return await self.gimbal_controller.center_on_pixel(center_x, center_y)

    async def track_detection(self, bbox: tuple) -> bool:
        """
        Start tracking detection.

        Args:
            bbox: Bounding box to track

        Returns:
            True if tracking started
        """
        if not self._initialized:
            return False

        defect = DefectLocation(
            gps=self.psdk.telemetry.position if self.psdk.telemetry else GPSCoordinate(0, 0, 0, 0),
            pixel_coordinates=((bbox[0] + bbox[2]) // 2, (bbox[1] + bbox[3]) // 2),
            bounding_box=bbox,
            estimated_size=(0, 0),
            distance_from_drone=10.0,
            bearing_from_drone=0.0,
        )

        return await self.gimbal_controller.start_tracking(defect)

    # =========================================================================
    # Telemetry Access
    # =========================================================================

    @property
    def telemetry(self) -> Optional[FlightTelemetry]:
        """Get current flight telemetry."""
        return self.psdk.telemetry

    @property
    def battery_level(self) -> float:
        """Get current battery percentage."""
        return self.psdk.telemetry.battery_percentage if self.psdk.telemetry else 0.0

    @property
    def is_safe_to_operate(self) -> bool:
        """Check if safe to perform operations."""
        return self.safety_manager.is_safe_to_fly

    @property
    def safety_level(self) -> SafetyLevel:
        """Get current safety level."""
        return self.safety_manager.safety_level

    # =========================================================================
    # Infrastructure Setup
    # =========================================================================

    def setup_for_infrastructure(
        self,
        infrastructure_type: InfrastructureType,
        center_location: GPSCoordinate,
        perimeter_radius: float = 500.0,
    ) -> None:
        """
        Setup safety zones for infrastructure.

        Args:
            infrastructure_type: Type of infrastructure
            center_location: Center GPS
            perimeter_radius: Perimeter radius
        """
        self.config.infrastructure_type = infrastructure_type
        self.safety_manager.infrastructure_type = infrastructure_type
        self.safety_manager.setup_infrastructure_zones(
            center=center_location,
            perimeter_radius=perimeter_radius,
        )

        logger.info(
            f"Configured for {infrastructure_type.name} at "
            f"{center_location.latitude}, {center_location.longitude}"
        )

    # =========================================================================
    # Result Callbacks
    # =========================================================================

    def register_enhanced_result_callback(
        self,
        callback: Callable[[Dict[str, Any]], None],
    ) -> None:
        """Register callback for enhanced analysis results."""
        self._enhanced_result_callbacks.append(callback)

    def _notify_enhanced_result(self, result: Dict[str, Any]) -> None:
        """Notify callbacks of enhanced result."""
        for callback in self._enhanced_result_callbacks:
            try:
                callback(result)
            except Exception as e:
                logger.error(f"Enhanced result callback error: {e}")


# =========================================================================
# Factory function for easy integration
# =========================================================================

def create_psdk_integration(
    infrastructure_type: InfrastructureType = InfrastructureType.DATA_CENTER,
    app_id: str = "",
    app_key: str = "",
    app_license: str = "",
) -> PSDKInspectionIntegration:
    """
    Create configured PSDK integration instance.

    Args:
        infrastructure_type: Type of infrastructure
        app_id: DJI app ID
        app_key: DJI app key
        app_license: DJI license

    Returns:
        Configured PSDKInspectionIntegration
    """
    config = PSDKIntegrationConfig(
        infrastructure_type=infrastructure_type,
        app_id=app_id,
        app_key=app_key,
        app_license=app_license,
    )

    return PSDKInspectionIntegration(config)
