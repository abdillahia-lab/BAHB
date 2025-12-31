"""
User Interaction Manager for Defect Recapture

Provides interfaces for presenting flight adjustment options to users
when AI models detect defects requiring enhanced imaging.

Supports multiple interfaces:
- Web dashboard (WebSocket)
- Mobile app (MQTT)
- Ground station display
- Audio alerts
"""

import asyncio
import json
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, List, Callable, Dict, Any, Awaitable
from enum import Enum, auto
import uuid

from .types import (
    RecaptureRequest,
    RecaptureOption,
    UserDecision,
    InfrastructureType,
)

logger = logging.getLogger(__name__)


class NotificationChannel(Enum):
    """Available notification channels."""
    WEBSOCKET = auto()   # Web dashboard
    MQTT = auto()        # Mobile app / IoT
    GRPC = auto()        # Ground control station
    AUDIO = auto()       # Audio alerts
    ALL = auto()         # All channels


class NotificationPriority(Enum):
    """Notification priority levels."""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4
    CRITICAL = 5


@dataclass
class UserNotification:
    """User notification structure."""
    notification_id: str
    title: str
    message: str
    priority: NotificationPriority
    defect_type: str
    options: List[Dict[str, str]]
    thumbnail_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    requires_response: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PendingDecision:
    """Pending user decision."""
    decision_id: str
    request: RecaptureRequest
    notification: UserNotification
    created_at: datetime = field(default_factory=datetime.now)
    responded: bool = False
    response: Optional[UserDecision] = None
    timeout: float = 30.0
    future: Optional[asyncio.Future] = None


class UserInteractionManager:
    """
    User Interaction Manager for Flight Adjustment Decisions.

    Handles:
    - Presenting defect recapture options to users
    - Multi-channel notifications (web, mobile, ground station)
    - Response collection with timeout handling
    - Decision history tracking
    - Audio/visual alerts for critical defects

    Example flow:
    1. AI detects cracked turbine blade
    2. Manager sends notification with options:
       - "Quick Zoom Capture (10s)"
       - "Multi-Angle Scan (30s)"
       - "Video Documentation (45s)"
       - "Skip and Continue"
    3. User selects option via dashboard/app
    4. Decision returned to recapture system
    """

    # Priority mapping from severity
    SEVERITY_TO_PRIORITY = {
        "CRITICAL": NotificationPriority.CRITICAL,
        "HIGH": NotificationPriority.URGENT,
        "MEDIUM": NotificationPriority.HIGH,
        "LOW": NotificationPriority.NORMAL,
        "INFO": NotificationPriority.LOW,
    }

    # Option display names and durations
    OPTION_DISPLAY = {
        RecaptureOption.QUICK_ZOOM: ("Quick Zoom Capture", "5-10 seconds"),
        RecaptureOption.DETAILED_ORBIT: ("Detailed Orbit Scan", "30-60 seconds"),
        RecaptureOption.MULTI_ANGLE: ("Multi-Angle Capture", "20-30 seconds"),
        RecaptureOption.THERMAL_ANALYSIS: ("Thermal Analysis Pass", "15-20 seconds"),
        RecaptureOption.VIDEO_DOCUMENTATION: ("Video Documentation", "30-45 seconds"),
        RecaptureOption.SKIP: ("Continue Mission", "0 seconds"),
        RecaptureOption.MANUAL_CONTROL: ("Take Manual Control", "Manual"),
    }

    def __init__(
        self,
        default_timeout: float = 30.0,
        auto_select_on_timeout: bool = True,
        websocket_handler: Optional[Callable] = None,
        mqtt_handler: Optional[Callable] = None,
        audio_enabled: bool = True,
    ):
        """
        Initialize user interaction manager.

        Args:
            default_timeout: Default decision timeout (seconds)
            auto_select_on_timeout: Auto-select first option on timeout
            websocket_handler: Handler for WebSocket notifications
            mqtt_handler: Handler for MQTT notifications
            audio_enabled: Enable audio alerts
        """
        self.default_timeout = default_timeout
        self.auto_select_on_timeout = auto_select_on_timeout
        self.websocket_handler = websocket_handler
        self.mqtt_handler = mqtt_handler
        self.audio_enabled = audio_enabled

        self._pending_decisions: Dict[str, PendingDecision] = {}
        self._decision_history: List[PendingDecision] = []

        # Response handlers for different channels
        self._response_handlers: Dict[NotificationChannel, List[Callable]] = {
            channel: [] for channel in NotificationChannel
        }

        logger.info("UserInteractionManager initialized")

    # =========================================================================
    # Main Prompt Interface
    # =========================================================================

    async def prompt_user_for_recapture(
        self,
        request: RecaptureRequest,
        timeout: Optional[float] = None,
        channels: NotificationChannel = NotificationChannel.ALL,
    ) -> UserDecision:
        """
        Prompt user for recapture decision.

        Args:
            request: Recapture request with options
            timeout: Decision timeout (uses default if None)
            channels: Notification channels to use

        Returns:
            UserDecision with selected option
        """
        decision_id = f"decision_{uuid.uuid4().hex[:8]}"
        timeout = timeout or self.default_timeout

        # Create notification
        notification = self._create_notification(request, decision_id)

        # Create pending decision with future
        loop = asyncio.get_event_loop()
        future: asyncio.Future = loop.create_future()

        pending = PendingDecision(
            decision_id=decision_id,
            request=request,
            notification=notification,
            timeout=timeout,
            future=future,
        )
        self._pending_decisions[decision_id] = pending

        # Send notifications
        await self._send_notifications(notification, channels)

        # Play audio alert if enabled and high priority
        if self.audio_enabled and notification.priority.value >= NotificationPriority.HIGH.value:
            await self._play_audio_alert(notification.priority)

        logger.info(
            f"Awaiting user decision {decision_id}: "
            f"defect={request.defect_type}, "
            f"timeout={timeout}s"
        )

        try:
            # Wait for response with timeout
            decision = await asyncio.wait_for(future, timeout=timeout)
            pending.responded = True
            pending.response = decision

            logger.info(
                f"User selected: {decision.option_selected.value} "
                f"for decision {decision_id}"
            )

        except asyncio.TimeoutError:
            logger.info(f"Decision {decision_id} timed out")

            if self.auto_select_on_timeout and request.recommended_options:
                # Auto-select first recommended option
                decision = UserDecision(
                    option_selected=request.recommended_options[0],
                    timeout_occurred=True,
                    auto_selected=True,
                )
            else:
                # Default to skip
                decision = UserDecision(
                    option_selected=RecaptureOption.SKIP,
                    timeout_occurred=True,
                    auto_selected=True,
                )

            pending.response = decision

            # Notify user of auto-selection
            await self._notify_auto_selection(decision_id, decision)

        finally:
            # Move to history
            self._decision_history.append(pending)
            del self._pending_decisions[decision_id]

        return decision

    # =========================================================================
    # Response Handling
    # =========================================================================

    async def submit_user_response(
        self,
        decision_id: str,
        option: RecaptureOption,
        custom_parameters: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Submit user's response to a pending decision.

        Called from web dashboard, mobile app, or ground station.

        Args:
            decision_id: The decision ID to respond to
            option: Selected recapture option
            custom_parameters: Optional custom parameters

        Returns:
            True if response accepted, False if expired/invalid
        """
        if decision_id not in self._pending_decisions:
            logger.warning(f"Decision {decision_id} not found or expired")
            return False

        pending = self._pending_decisions[decision_id]

        if pending.responded:
            logger.warning(f"Decision {decision_id} already responded")
            return False

        decision = UserDecision(
            option_selected=option,
            custom_parameters=custom_parameters,
            timeout_occurred=False,
            auto_selected=False,
        )

        # Resolve the future
        if pending.future and not pending.future.done():
            pending.future.set_result(decision)

        return True

    def register_response_handler(
        self,
        channel: NotificationChannel,
        handler: Callable[[str, RecaptureOption], Awaitable[None]],
    ) -> None:
        """Register handler for responses from a channel."""
        self._response_handlers[channel].append(handler)

    # =========================================================================
    # Notification Creation and Sending
    # =========================================================================

    def _create_notification(
        self,
        request: RecaptureRequest,
        decision_id: str,
    ) -> UserNotification:
        """Create user notification from recapture request."""
        # Determine priority from severity
        priority = self.SEVERITY_TO_PRIORITY.get(
            request.severity,
            NotificationPriority.NORMAL,
        )

        # Format options for display
        options = []
        for opt in request.recommended_options:
            display_name, duration = self.OPTION_DISPLAY.get(
                opt,
                (opt.value, "Unknown"),
            )
            options.append({
                "id": opt.name,
                "name": display_name,
                "duration": duration,
                "value": opt.value,
            })

        # Always add skip and manual control options
        if RecaptureOption.SKIP not in request.recommended_options:
            skip_name, skip_dur = self.OPTION_DISPLAY[RecaptureOption.SKIP]
            options.append({
                "id": RecaptureOption.SKIP.name,
                "name": skip_name,
                "duration": skip_dur,
                "value": RecaptureOption.SKIP.value,
            })

        if RecaptureOption.MANUAL_CONTROL not in request.recommended_options:
            manual_name, manual_dur = self.OPTION_DISPLAY[RecaptureOption.MANUAL_CONTROL]
            options.append({
                "id": RecaptureOption.MANUAL_CONTROL.name,
                "name": manual_name,
                "duration": manual_dur,
                "value": RecaptureOption.MANUAL_CONTROL.value,
            })

        # Create title based on defect type and infrastructure
        infrastructure_name = request.infrastructure_type.name.replace("_", " ").title()
        title = f"🔍 Defect Detected: {request.defect_type.title()}"

        # Create message
        message = (
            f"AI has detected a potential {request.defect_type} on {infrastructure_name}.\n\n"
            f"Severity: {request.severity}\n"
            f"Confidence: {request.confidence * 100:.1f}%\n"
            f"Battery: {request.battery_remaining:.0f}%\n"
            f"Time Available: {request.time_available:.0f}s\n\n"
            f"Description: {request.defect_description}\n\n"
            f"Select a recapture option to get enhanced imagery for better analysis."
        )

        return UserNotification(
            notification_id=decision_id,
            title=title,
            message=message,
            priority=priority,
            defect_type=request.defect_type,
            options=options,
            requires_response=True,
            metadata={
                "defect_id": request.defect_id,
                "infrastructure": request.infrastructure_type.name,
                "severity": request.severity,
                "confidence": request.confidence,
                "model": request.model_requesting,
                "gps": {
                    "lat": request.location.gps.latitude,
                    "lon": request.location.gps.longitude,
                    "alt": request.location.gps.altitude_agl,
                },
            },
        )

    async def _send_notifications(
        self,
        notification: UserNotification,
        channels: NotificationChannel,
    ) -> None:
        """Send notification through specified channels."""
        notification_data = {
            "id": notification.notification_id,
            "title": notification.title,
            "message": notification.message,
            "priority": notification.priority.name,
            "defect_type": notification.defect_type,
            "options": notification.options,
            "requires_response": notification.requires_response,
            "metadata": notification.metadata,
            "timestamp": datetime.now().isoformat(),
        }

        tasks = []

        if channels in [NotificationChannel.WEBSOCKET, NotificationChannel.ALL]:
            if self.websocket_handler:
                tasks.append(self._send_websocket(notification_data))

        if channels in [NotificationChannel.MQTT, NotificationChannel.ALL]:
            if self.mqtt_handler:
                tasks.append(self._send_mqtt(notification_data))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        logger.debug(f"Sent notification {notification.notification_id} to {channels.name}")

    async def _send_websocket(self, data: Dict) -> None:
        """Send notification via WebSocket."""
        if self.websocket_handler:
            try:
                await self.websocket_handler({
                    "type": "defect_recapture_prompt",
                    "payload": data,
                })
            except Exception as e:
                logger.error(f"WebSocket notification failed: {e}")

    async def _send_mqtt(self, data: Dict) -> None:
        """Send notification via MQTT."""
        if self.mqtt_handler:
            try:
                await self.mqtt_handler(
                    topic="bahb/defects/recapture",
                    payload=json.dumps(data),
                )
            except Exception as e:
                logger.error(f"MQTT notification failed: {e}")

    async def _notify_auto_selection(
        self,
        decision_id: str,
        decision: UserDecision,
    ) -> None:
        """Notify user that auto-selection occurred."""
        notification_data = {
            "id": decision_id,
            "type": "auto_selection",
            "message": f"Timeout occurred. Auto-selected: {decision.option_selected.value}",
            "selected_option": decision.option_selected.name,
            "timestamp": datetime.now().isoformat(),
        }

        if self.websocket_handler:
            await self._send_websocket({
                "type": "defect_recapture_auto_select",
                "payload": notification_data,
            })

    async def _play_audio_alert(self, priority: NotificationPriority) -> None:
        """Play audio alert based on priority."""
        # Audio patterns for different priorities
        patterns = {
            NotificationPriority.CRITICAL: "critical_alert.wav",
            NotificationPriority.URGENT: "urgent_alert.wav",
            NotificationPriority.HIGH: "high_alert.wav",
        }

        sound_file = patterns.get(priority)
        if sound_file:
            # In real implementation, play the sound
            logger.debug(f"Playing audio alert: {sound_file}")

    # =========================================================================
    # Status and History
    # =========================================================================

    def get_pending_decisions(self) -> List[Dict]:
        """Get all pending decisions."""
        return [
            {
                "decision_id": p.decision_id,
                "defect_type": p.request.defect_type,
                "severity": p.request.severity,
                "created_at": p.created_at.isoformat(),
                "timeout": p.timeout,
                "options": [o.value for o in p.request.recommended_options],
            }
            for p in self._pending_decisions.values()
        ]

    def get_decision_history(
        self,
        limit: int = 50,
    ) -> List[Dict]:
        """Get decision history."""
        history = self._decision_history[-limit:]
        return [
            {
                "decision_id": p.decision_id,
                "defect_type": p.request.defect_type,
                "severity": p.request.severity,
                "created_at": p.created_at.isoformat(),
                "responded": p.responded,
                "selected_option": p.response.option_selected.value if p.response else None,
                "auto_selected": p.response.auto_selected if p.response else None,
            }
            for p in history
        ]

    def cancel_pending_decision(self, decision_id: str) -> bool:
        """Cancel a pending decision."""
        if decision_id not in self._pending_decisions:
            return False

        pending = self._pending_decisions[decision_id]

        if pending.future and not pending.future.done():
            decision = UserDecision(
                option_selected=RecaptureOption.SKIP,
                timeout_occurred=False,
                auto_selected=True,
            )
            pending.future.set_result(decision)

        return True


# =========================================================================
# WebSocket Message Handlers (for integration)
# =========================================================================

class WebSocketMessageHandler:
    """Handler for WebSocket messages from web dashboard."""

    def __init__(self, interaction_manager: UserInteractionManager):
        self.manager = interaction_manager

    async def handle_message(self, message: Dict) -> Dict:
        """Handle incoming WebSocket message."""
        msg_type = message.get("type")

        if msg_type == "recapture_response":
            decision_id = message.get("decision_id")
            option_name = message.get("option")

            try:
                option = RecaptureOption[option_name]
                success = await self.manager.submit_user_response(
                    decision_id=decision_id,
                    option=option,
                    custom_parameters=message.get("parameters"),
                )
                return {"status": "ok" if success else "error", "decision_id": decision_id}

            except KeyError:
                return {"status": "error", "message": f"Invalid option: {option_name}"}

        elif msg_type == "get_pending":
            return {
                "status": "ok",
                "pending": self.manager.get_pending_decisions(),
            }

        elif msg_type == "get_history":
            limit = message.get("limit", 50)
            return {
                "status": "ok",
                "history": self.manager.get_decision_history(limit),
            }

        return {"status": "error", "message": "Unknown message type"}


# =========================================================================
# MQTT Message Handlers (for integration)
# =========================================================================

class MQTTMessageHandler:
    """Handler for MQTT messages from mobile app."""

    def __init__(self, interaction_manager: UserInteractionManager):
        self.manager = interaction_manager

    async def handle_message(self, topic: str, payload: str) -> None:
        """Handle incoming MQTT message."""
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in MQTT message: {payload}")
            return

        if topic.endswith("/response"):
            decision_id = data.get("decision_id")
            option_name = data.get("option")

            try:
                option = RecaptureOption[option_name]
                await self.manager.submit_user_response(
                    decision_id=decision_id,
                    option=option,
                )
            except KeyError:
                logger.error(f"Invalid option in MQTT response: {option_name}")
