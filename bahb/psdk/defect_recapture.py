"""
Defect Recapture System

Intelligent defect recapture when AI models (especially Qwen-VL) detect anomalies.
Provides options to the user for flight adjustment to get better imagery, then
sends the new data back to the AI model for enhanced analysis.

Critical for:
- Cracked turbine blades
- Solar panel damage
- Substation equipment defects
- Data center infrastructure issues
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Callable, Dict, Any, Tuple
from enum import Enum, auto
import uuid
import numpy as np

from .core import PSDKInterface
from .flight_controller import FlightController
from .gimbal_controller import GimbalController, CameraMode
from .types import (
    RecaptureRequest,
    RecaptureOption,
    RecaptureResult,
    UserDecision,
    FlightAdjustmentType,
    FlightAdjustmentPlan,
    DefectLocation,
    InfrastructureType,
    GPSCoordinate,
    TurbineBladeInfo,
)

logger = logging.getLogger(__name__)


class RecaptureState(Enum):
    """Current state of recapture system."""
    IDLE = auto()
    AWAITING_USER_DECISION = auto()
    EXECUTING_ADJUSTMENT = auto()
    CAPTURING = auto()
    ANALYZING = auto()
    COMPLETED = auto()
    ABORTED = auto()


@dataclass
class RecaptureSession:
    """Active recapture session data."""
    session_id: str
    request: RecaptureRequest
    state: RecaptureState = RecaptureState.IDLE
    user_decision: Optional[UserDecision] = None
    flight_plan: Optional[FlightAdjustmentPlan] = None
    captured_images: List[np.ndarray] = field(default_factory=list)
    captured_thermal: List[np.ndarray] = field(default_factory=list)
    video_path: Optional[str] = None
    analysis_results: List[Dict[str, Any]] = field(default_factory=list)
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    error: Optional[str] = None


class DefectRecaptureSystem:
    """
    Defect Recapture System for Enhanced AI Analysis.

    When Qwen-VL or other AI models detect a potential defect:
    1. Creates a recapture request with recommended options
    2. Presents options to the user for flight adjustment
    3. Executes the selected adjustment (orbit, closer approach, etc.)
    4. Captures enhanced imagery from multiple angles
    5. Sends new data back to AI model for improved analysis
    6. Reports results with before/after comparison

    Critical infrastructure aware with safety protocols.
    """

    # Mapping from defect types to recommended recapture options
    DEFECT_RECAPTURE_RECOMMENDATIONS = {
        "crack": [
            RecaptureOption.QUICK_ZOOM,
            RecaptureOption.MULTI_ANGLE,
            RecaptureOption.VIDEO_DOCUMENTATION,
        ],
        "corrosion": [
            RecaptureOption.DETAILED_ORBIT,
            RecaptureOption.THERMAL_ANALYSIS,
        ],
        "hotspot": [
            RecaptureOption.THERMAL_ANALYSIS,
            RecaptureOption.QUICK_ZOOM,
        ],
        "damage": [
            RecaptureOption.DETAILED_ORBIT,
            RecaptureOption.MULTI_ANGLE,
            RecaptureOption.VIDEO_DOCUMENTATION,
        ],
        "leak": [
            RecaptureOption.THERMAL_ANALYSIS,
            RecaptureOption.VIDEO_DOCUMENTATION,
        ],
        "contamination": [
            RecaptureOption.QUICK_ZOOM,
            RecaptureOption.MULTI_ANGLE,
        ],
        "blade_crack": [
            RecaptureOption.MULTI_ANGLE,
            RecaptureOption.VIDEO_DOCUMENTATION,
            RecaptureOption.DETAILED_ORBIT,
        ],
        "blade_erosion": [
            RecaptureOption.DETAILED_ORBIT,
            RecaptureOption.QUICK_ZOOM,
        ],
        "default": [
            RecaptureOption.QUICK_ZOOM,
            RecaptureOption.MULTI_ANGLE,
        ],
    }

    # Mapping from recapture options to flight adjustment types
    OPTION_TO_ADJUSTMENT = {
        RecaptureOption.QUICK_ZOOM: FlightAdjustmentType.ZOOM_CAPTURE,
        RecaptureOption.DETAILED_ORBIT: FlightAdjustmentType.ORBIT_AROUND,
        RecaptureOption.MULTI_ANGLE: FlightAdjustmentType.MULTI_ANGLE_CAPTURE,
        RecaptureOption.THERMAL_ANALYSIS: FlightAdjustmentType.THERMAL_SWEEP,
        RecaptureOption.VIDEO_DOCUMENTATION: FlightAdjustmentType.HOVER_EXTENDED,
    }

    def __init__(
        self,
        psdk: PSDKInterface,
        flight_controller: FlightController,
        gimbal_controller: GimbalController,
        ai_analyzer: Optional[Callable] = None,
        user_timeout: float = 30.0,
        auto_recapture_severity: str = "HIGH",
    ):
        """
        Initialize defect recapture system.

        Args:
            psdk: PSDK interface
            flight_controller: Flight controller instance
            gimbal_controller: Gimbal controller instance
            ai_analyzer: Callback for AI analysis (Qwen-VL)
            user_timeout: Timeout for user decision (seconds)
            auto_recapture_severity: Auto-recapture for this severity and above
        """
        self.psdk = psdk
        self.flight_controller = flight_controller
        self.gimbal_controller = gimbal_controller
        self.ai_analyzer = ai_analyzer
        self.user_timeout = user_timeout
        self.auto_recapture_severity = auto_recapture_severity

        self._current_session: Optional[RecaptureSession] = None
        self._session_history: List[RecaptureSession] = []

        # Callbacks for user interaction
        self._user_prompt_callback: Optional[Callable[[RecaptureRequest], asyncio.Future]] = None
        self._progress_callback: Optional[Callable[[str, RecaptureState, float], None]] = None
        self._result_callback: Optional[Callable[[RecaptureResult], None]] = None

        logger.info("DefectRecaptureSystem initialized")

    @property
    def current_session(self) -> Optional[RecaptureSession]:
        """Get current active session."""
        return self._current_session

    @property
    def is_active(self) -> bool:
        """Check if a recapture session is active."""
        return self._current_session is not None

    # =========================================================================
    # Main Recapture Flow
    # =========================================================================

    async def initiate_recapture(
        self,
        defect_type: str,
        defect_description: str,
        severity: str,
        location: DefectLocation,
        original_image: np.ndarray,
        thermal_image: Optional[np.ndarray] = None,
        confidence: float = 0.0,
        infrastructure_type: InfrastructureType = InfrastructureType.DATA_CENTER,
        model_requesting: str = "qwen-vl",
        turbine_info: Optional[TurbineBladeInfo] = None,
    ) -> RecaptureSession:
        """
        Initiate defect recapture session.

        Called when AI model (Qwen-VL) detects a potential defect and
        recommends getting better imagery.

        Args:
            defect_type: Type of defect detected
            defect_description: AI-generated description
            severity: Severity level (CRITICAL, HIGH, MEDIUM, LOW)
            location: Defect location information
            original_image: Original captured image
            thermal_image: Original thermal image (if available)
            confidence: Detection confidence
            infrastructure_type: Type of infrastructure
            model_requesting: AI model that requested recapture
            turbine_info: Wind turbine info (for blade inspections)

        Returns:
            RecaptureSession with session information
        """
        session_id = f"recapture_{uuid.uuid4().hex[:8]}"

        # Get recommended options based on defect type
        recommended = self._get_recommendations(defect_type, infrastructure_type)

        # Check battery and time constraints
        telemetry = self.psdk.telemetry
        battery = telemetry.battery_percentage if telemetry else 50.0
        time_available = self._calculate_available_time(battery)

        # Create recapture request
        request = RecaptureRequest(
            defect_id=session_id,
            defect_type=defect_type,
            defect_description=defect_description,
            severity=severity,
            location=location,
            original_image=original_image,
            thermal_image=thermal_image,
            confidence=confidence,
            recommended_options=recommended,
            infrastructure_type=infrastructure_type,
            time_available=time_available,
            battery_remaining=battery,
            model_requesting=model_requesting,
        )

        # Create session
        session = RecaptureSession(
            session_id=session_id,
            request=request,
            state=RecaptureState.AWAITING_USER_DECISION,
        )
        self._current_session = session

        logger.info(
            f"Initiated recapture session {session_id}: "
            f"type={defect_type}, severity={severity}, "
            f"infrastructure={infrastructure_type.name}"
        )

        # Special handling for turbine blades
        if turbine_info and "blade" in defect_type.lower():
            await self._handle_turbine_blade_recapture(session, turbine_info)
            return session

        # Prompt user for decision
        user_decision = await self._prompt_user_decision(request)
        session.user_decision = user_decision

        if user_decision.option_selected == RecaptureOption.SKIP:
            session.state = RecaptureState.ABORTED
            logger.info(f"Session {session_id} skipped by user")
            return session

        if user_decision.option_selected == RecaptureOption.MANUAL_CONTROL:
            session.state = RecaptureState.ABORTED
            logger.info(f"Session {session_id} handed to manual control")
            return session

        # Execute the selected recapture option
        await self._execute_recapture(session, user_decision)

        return session

    async def initiate_auto_recapture(
        self,
        defect_type: str,
        severity: str,
        location: DefectLocation,
        original_image: np.ndarray,
        thermal_image: Optional[np.ndarray] = None,
    ) -> Optional[RecaptureSession]:
        """
        Automatically initiate recapture for high-severity defects.

        Bypasses user prompt for CRITICAL/HIGH severity issues.

        Args:
            defect_type: Type of defect
            severity: Severity level
            location: Defect location
            original_image: Original image
            thermal_image: Thermal image

        Returns:
            RecaptureSession if auto-initiated, None otherwise
        """
        severity_levels = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
        threshold_idx = severity_levels.index(self.auto_recapture_severity)
        current_idx = severity_levels.index(severity) if severity in severity_levels else 0

        if current_idx < threshold_idx:
            return None

        logger.info(f"Auto-initiating recapture for {severity} severity {defect_type}")

        # Select best option automatically
        recommended = self._get_recommendations(defect_type, InfrastructureType.DATA_CENTER)
        auto_option = recommended[0] if recommended else RecaptureOption.QUICK_ZOOM

        session = await self.initiate_recapture(
            defect_type=defect_type,
            defect_description="Auto-detected high severity defect",
            severity=severity,
            location=location,
            original_image=original_image,
            thermal_image=thermal_image,
        )

        return session

    # =========================================================================
    # Recapture Execution
    # =========================================================================

    async def _execute_recapture(
        self,
        session: RecaptureSession,
        decision: UserDecision,
    ) -> None:
        """Execute the recapture based on user decision."""
        session.state = RecaptureState.EXECUTING_ADJUSTMENT

        try:
            option = decision.option_selected

            if option == RecaptureOption.QUICK_ZOOM:
                await self._execute_quick_zoom(session)

            elif option == RecaptureOption.DETAILED_ORBIT:
                await self._execute_detailed_orbit(session)

            elif option == RecaptureOption.MULTI_ANGLE:
                await self._execute_multi_angle(session)

            elif option == RecaptureOption.THERMAL_ANALYSIS:
                await self._execute_thermal_analysis(session)

            elif option == RecaptureOption.VIDEO_DOCUMENTATION:
                await self._execute_video_documentation(session)

            # Analyze captured images with AI
            session.state = RecaptureState.ANALYZING
            await self._analyze_captures(session)

            session.state = RecaptureState.COMPLETED
            session.end_time = datetime.now()

            # Report results
            await self._report_results(session)

        except Exception as e:
            logger.error(f"Recapture execution failed: {e}")
            session.state = RecaptureState.ABORTED
            session.error = str(e)

        finally:
            self._session_history.append(session)
            self._current_session = None

    async def _execute_quick_zoom(self, session: RecaptureSession) -> None:
        """Execute quick zoom capture sequence."""
        logger.info("Executing quick zoom capture")
        session.state = RecaptureState.CAPTURING

        defect = session.request.location

        # Center gimbal on defect
        await self.gimbal_controller.center_on_defect(defect)

        # Switch to zoom camera
        await self.gimbal_controller.switch_camera(CameraMode.ZOOM)

        # Calculate and apply optimal zoom
        optimal_zoom = await self.gimbal_controller.calculate_optimal_zoom(
            defect, target_coverage=0.6
        )
        await self.gimbal_controller.set_zoom(optimal_zoom)

        await asyncio.sleep(0.5)  # Stabilize and focus

        # Capture sequence
        captures = await self.gimbal_controller.capture_defect_sequence(defect)
        logger.info(f"Quick zoom captured {len(captures)} images")

    async def _execute_detailed_orbit(self, session: RecaptureSession) -> None:
        """Execute detailed orbit around defect."""
        logger.info("Executing detailed orbit capture")

        defect = session.request.location
        infrastructure = session.request.infrastructure_type

        # Create orbit flight plan
        plan = self.flight_controller.create_defect_approach_plan(
            defect=defect,
            adjustment_type=FlightAdjustmentType.ORBIT_AROUND,
            infrastructure_type=infrastructure,
        )

        # Validate safety
        is_safe, warnings = self.flight_controller.validate_plan_safety(plan)
        if not is_safe:
            logger.warning(f"Orbit plan has safety warnings: {warnings}")

        plan.user_approved = True
        session.flight_plan = plan

        # Execute with capture callback
        async def capture_callback():
            session.state = RecaptureState.CAPTURING
            await self.gimbal_controller.center_on_defect(defect)
            await self.psdk.capture_photo()
            # Store image (in real implementation, get from camera)

        session.state = RecaptureState.EXECUTING_ADJUSTMENT
        await self.flight_controller.execute_plan(plan, capture_callback)

    async def _execute_multi_angle(self, session: RecaptureSession) -> None:
        """Execute multi-angle capture sequence."""
        logger.info("Executing multi-angle capture")

        defect = session.request.location
        infrastructure = session.request.infrastructure_type

        # Create multi-angle flight plan
        plan = self.flight_controller.create_defect_approach_plan(
            defect=defect,
            adjustment_type=FlightAdjustmentType.MULTI_ANGLE_CAPTURE,
            infrastructure_type=infrastructure,
        )

        plan.user_approved = True
        session.flight_plan = plan

        async def capture_callback():
            session.state = RecaptureState.CAPTURING
            await self.gimbal_controller.capture_defect_sequence(defect)

        session.state = RecaptureState.EXECUTING_ADJUSTMENT
        await self.flight_controller.execute_plan(plan, capture_callback)

    async def _execute_thermal_analysis(self, session: RecaptureSession) -> None:
        """Execute thermal analysis pass."""
        logger.info("Executing thermal analysis pass")

        defect = session.request.location

        # Switch to thermal camera
        await self.gimbal_controller.switch_camera(CameraMode.THERMAL)
        await self.psdk.set_thermal_palette("rainbow")  # Better for analysis

        # Create thermal sweep plan
        plan = self.flight_controller.create_defect_approach_plan(
            defect=defect,
            adjustment_type=FlightAdjustmentType.THERMAL_SWEEP,
            infrastructure_type=session.request.infrastructure_type,
        )

        plan.user_approved = True
        session.flight_plan = plan

        async def capture_callback():
            session.state = RecaptureState.CAPTURING
            await self.psdk.capture_photo("thermal")

        session.state = RecaptureState.EXECUTING_ADJUSTMENT
        await self.flight_controller.execute_plan(plan, capture_callback)

    async def _execute_video_documentation(self, session: RecaptureSession) -> None:
        """Execute video documentation."""
        logger.info("Executing video documentation")

        defect = session.request.location

        # Center on defect
        await self.gimbal_controller.center_on_defect(defect)

        # Start video recording with tracking
        session.state = RecaptureState.CAPTURING
        await self.gimbal_controller.start_defect_video(defect, duration=30.0)

        session.video_path = f"/recordings/defect_{session.session_id}.mp4"

    # =========================================================================
    # Turbine Blade Special Handling
    # =========================================================================

    async def _handle_turbine_blade_recapture(
        self,
        session: RecaptureSession,
        turbine_info: TurbineBladeInfo,
    ) -> None:
        """Special handling for wind turbine blade defects."""
        logger.info(
            f"Handling turbine blade recapture: "
            f"turbine={turbine_info.turbine_id}, blade={turbine_info.blade_number}"
        )

        # Safety check: blade rotation status
        if turbine_info.rotation_status not in ["stopped", "locked"]:
            logger.warning(
                f"Turbine blade is {turbine_info.rotation_status}! "
                "Recapture requires stopped/locked blades."
            )
            session.state = RecaptureState.ABORTED
            session.error = "Turbine blades must be stopped for safe recapture"
            return

        # Prompt user with blade-specific options
        blade_options = [
            RecaptureOption.MULTI_ANGLE,
            RecaptureOption.VIDEO_DOCUMENTATION,
            RecaptureOption.DETAILED_ORBIT,
        ]
        session.request.recommended_options = blade_options

        user_decision = await self._prompt_user_decision(session.request)
        session.user_decision = user_decision

        if user_decision.option_selected == RecaptureOption.SKIP:
            session.state = RecaptureState.ABORTED
            return

        # Create turbine-specific flight plan
        hub_center = GPSCoordinate(
            latitude=session.request.location.gps.latitude,
            longitude=session.request.location.gps.longitude,
            altitude_msl=session.request.location.gps.altitude_msl - session.request.location.distance_from_drone,
            altitude_agl=session.request.location.gps.altitude_agl - session.request.location.distance_from_drone,
        )

        plan = self.flight_controller.create_turbine_blade_inspection_plan(
            turbine_center=hub_center,
            blade_defect=session.request.location,
            blade_length=turbine_info.blade_length,
            blade_angle=turbine_info.current_angle,
        )

        plan.user_approved = True
        session.flight_plan = plan

        # Execute blade inspection
        async def blade_capture_callback():
            session.state = RecaptureState.CAPTURING
            await self.gimbal_controller.capture_defect_sequence(session.request.location)

        session.state = RecaptureState.EXECUTING_ADJUSTMENT
        await self.flight_controller.execute_plan(plan, blade_capture_callback)

        # Analyze
        session.state = RecaptureState.ANALYZING
        await self._analyze_captures(session)

        session.state = RecaptureState.COMPLETED
        session.end_time = datetime.now()
        await self._report_results(session)

    # =========================================================================
    # AI Analysis
    # =========================================================================

    async def _analyze_captures(self, session: RecaptureSession) -> None:
        """Send captured images to AI for analysis."""
        if not self.ai_analyzer:
            logger.warning("No AI analyzer configured, skipping analysis")
            return

        logger.info(f"Analyzing {len(session.captured_images)} captured images")

        for i, image in enumerate(session.captured_images):
            try:
                # Call AI analyzer (Qwen-VL or other)
                result = await self.ai_analyzer(
                    image=image,
                    thermal_image=session.captured_thermal[i] if i < len(session.captured_thermal) else None,
                    original_image=session.request.original_image,
                    defect_type=session.request.defect_type,
                    context=f"Enhanced recapture image {i + 1} of defect",
                )

                session.analysis_results.append(result)

            except Exception as e:
                logger.error(f"AI analysis failed for image {i}: {e}")

        logger.info(f"Completed {len(session.analysis_results)} analyses")

    # =========================================================================
    # User Interaction
    # =========================================================================

    def set_user_prompt_callback(
        self,
        callback: Callable[[RecaptureRequest], asyncio.Future],
    ) -> None:
        """Set callback for prompting user for decisions."""
        self._user_prompt_callback = callback

    def set_progress_callback(
        self,
        callback: Callable[[str, RecaptureState, float], None],
    ) -> None:
        """Set callback for progress updates."""
        self._progress_callback = callback

    def set_result_callback(
        self,
        callback: Callable[[RecaptureResult], None],
    ) -> None:
        """Set callback for result reporting."""
        self._result_callback = callback

    async def _prompt_user_decision(
        self,
        request: RecaptureRequest,
    ) -> UserDecision:
        """Prompt user for recapture decision."""
        if self._user_prompt_callback:
            try:
                decision = await asyncio.wait_for(
                    self._user_prompt_callback(request),
                    timeout=self.user_timeout,
                )
                return decision

            except asyncio.TimeoutError:
                logger.info("User decision timeout, auto-selecting first option")
                return UserDecision(
                    option_selected=request.recommended_options[0],
                    timeout_occurred=True,
                    auto_selected=True,
                )

        # No callback set, auto-select based on severity
        if request.severity in ["CRITICAL", "HIGH"]:
            option = request.recommended_options[0]
        else:
            option = RecaptureOption.SKIP

        return UserDecision(
            option_selected=option,
            auto_selected=True,
        )

    async def _report_results(self, session: RecaptureSession) -> None:
        """Report recapture results."""
        duration = 0.0
        if session.end_time:
            duration = (session.end_time - session.start_time).total_seconds()

        # Aggregate analysis
        new_analysis = None
        if session.analysis_results:
            # Combine analyses
            descriptions = [r.get("description", "") for r in session.analysis_results]
            new_analysis = " | ".join(descriptions)

        result = RecaptureResult(
            defect_id=session.session_id,
            success=session.state == RecaptureState.COMPLETED,
            images_captured=session.captured_images,
            thermal_images=session.captured_thermal,
            video_path=session.video_path,
            capture_positions=[],  # Would be populated from flight plan
            total_time=duration,
            new_analysis=new_analysis,
            error_message=session.error,
        )

        logger.info(
            f"Recapture session completed: {session.session_id}, "
            f"images={len(result.images_captured)}, "
            f"duration={duration:.1f}s, "
            f"success={result.success}"
        )

        if self._result_callback:
            self._result_callback(result)

    # =========================================================================
    # Helper Methods
    # =========================================================================

    def _get_recommendations(
        self,
        defect_type: str,
        infrastructure: InfrastructureType,
    ) -> List[RecaptureOption]:
        """Get recommended recapture options for defect type."""
        defect_lower = defect_type.lower()

        # Check for specific matches
        for key, options in self.DEFECT_RECAPTURE_RECOMMENDATIONS.items():
            if key in defect_lower:
                return options.copy()

        # Infrastructure-specific defaults
        if infrastructure == InfrastructureType.WIND_FARM:
            return [
                RecaptureOption.MULTI_ANGLE,
                RecaptureOption.VIDEO_DOCUMENTATION,
            ]
        elif infrastructure == InfrastructureType.UTILITY_SUBSTATION:
            return [
                RecaptureOption.THERMAL_ANALYSIS,
                RecaptureOption.QUICK_ZOOM,
            ]
        elif infrastructure == InfrastructureType.SOLAR_FARM:
            return [
                RecaptureOption.THERMAL_ANALYSIS,
                RecaptureOption.DETAILED_ORBIT,
            ]

        return self.DEFECT_RECAPTURE_RECOMMENDATIONS["default"].copy()

    def _calculate_available_time(self, battery_percentage: float) -> float:
        """Calculate available time for recapture based on battery."""
        # Reserve 20% for RTH
        usable_battery = max(0, battery_percentage - 20)

        # Roughly 1 minute per 1% battery in hover
        return usable_battery * 60

    async def abort_current_session(self) -> None:
        """Abort the current recapture session."""
        if self._current_session:
            logger.info(f"Aborting recapture session: {self._current_session.session_id}")
            self._current_session.state = RecaptureState.ABORTED
            await self.flight_controller.abort_current_plan()
            await self.gimbal_controller.stop_tracking()
            self._current_session = None

    def get_session_history(self) -> List[RecaptureSession]:
        """Get history of recapture sessions."""
        return self._session_history.copy()
