"""
BAHB Agentic Workflow System

Multi-agent architecture for autonomous power infrastructure inspection
with human-in-the-loop (HITL) oversight for RPIC assistance.

Architecture:
┌─────────────────────────────────────────────────────────────────────┐
│                         RPIC INTERFACE                              │
│  [Mission Status] [Agent Recommendations] [Approval Queue] [Override]│
└─────────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │ HITL Escalation
                    ┌──────────────┴──────────────┐
                    │     ORCHESTRATOR AGENT      │
                    │  (Behavior Tree + State)    │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────┬───────────┼───────────┬─────────────┐
         ▼             ▼           ▼           ▼             ▼
    ┌─────────┐  ┌─────────┐ ┌─────────┐ ┌─────────┐  ┌─────────┐
    │ PERCEPT │  │ INVEST- │ │ MISSION │ │ SAFETY  │  │  RPIC   │
    │  AGENT  │  │ IGATOR  │ │ PLANNER │ │ WATCHDOG│  │ ADVISOR │
    └─────────┘  └─────────┘ └─────────┘ └─────────┘  └─────────┘
         │             │           │           │             │
         └─────────────┴───────────┴───────────┴─────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │      DJI MSDK/PSDK          │
                    │   (Virtual Stick, Gimbal)   │
                    └─────────────────────────────┘
"""

import asyncio
import logging
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Callable
from datetime import datetime
from pathlib import Path
import json


class AgentType(Enum):
    """Types of agents in the system."""
    ORCHESTRATOR = "orchestrator"
    PERCEPTION = "perception"
    INVESTIGATOR = "investigator"
    MISSION_PLANNER = "mission_planner"
    SAFETY_WATCHDOG = "safety_watchdog"
    RPIC_ADVISOR = "rpic_advisor"


class ActionConfidence(Enum):
    """Confidence levels for agent actions."""
    HIGH = "high"          # >90% - Execute autonomously
    MEDIUM = "medium"      # 70-90% - Execute with notification
    LOW = "low"            # 50-70% - Recommend, wait for approval
    UNCERTAIN = "uncertain"  # <50% - Escalate to RPIC


class EscalationLevel(Enum):
    """HITL escalation levels."""
    NONE = "none"                    # Fully autonomous
    NOTIFY = "notify"                # Inform RPIC, continue
    RECOMMEND = "recommend"          # Suggest action, wait briefly
    REQUIRE_APPROVAL = "require"     # Must have RPIC approval
    EMERGENCY = "emergency"          # Immediate RPIC attention


@dataclass
class AgentAction:
    """Represents an action proposed by an agent."""
    action_id: str
    agent: AgentType
    action_type: str
    description: str
    confidence: ActionConfidence
    escalation: EscalationLevel
    parameters: Dict[str, Any] = field(default_factory=dict)
    reasoning: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    approved: Optional[bool] = None
    executed: bool = False


@dataclass
class AgentState:
    """Shared state accessible to all agents."""
    # Current position and telemetry
    latitude: float = 0.0
    longitude: float = 0.0
    altitude_m: float = 0.0
    heading_deg: float = 0.0
    battery_percent: float = 100.0

    # Mission state
    current_waypoint: int = 0
    total_waypoints: int = 0
    mission_progress: float = 0.0

    # Detection state
    active_detections: List[Dict] = field(default_factory=list)
    critical_detections: List[Dict] = field(default_factory=list)
    investigation_queue: List[Dict] = field(default_factory=list)

    # Agent recommendations
    pending_actions: List[AgentAction] = field(default_factory=list)
    action_history: List[AgentAction] = field(default_factory=list)

    # RPIC interaction
    rpic_online: bool = True
    last_rpic_interaction: Optional[str] = None


class BaseAgent:
    """Base class for all agents."""

    def __init__(
        self,
        agent_type: AgentType,
        state: AgentState,
        confidence_threshold: float = 0.7
    ):
        self.agent_type = agent_type
        self.state = state
        self.confidence_threshold = confidence_threshold
        self.logger = logging.getLogger(f"BAHB.Agent.{agent_type.value}")
        self._running = False

    async def run(self):
        """Main agent loop."""
        self._running = True
        while self._running:
            try:
                await self.think()
                await asyncio.sleep(0.1)  # 10Hz decision rate
            except Exception as e:
                self.logger.error(f"Agent error: {e}")

    async def think(self):
        """Override in subclasses - main reasoning loop."""
        raise NotImplementedError

    def propose_action(
        self,
        action_type: str,
        description: str,
        confidence: float,
        parameters: Dict = None,
        reasoning: str = ""
    ) -> AgentAction:
        """Propose an action with confidence-based escalation."""

        # Map confidence to level
        if confidence >= 0.9:
            conf_level = ActionConfidence.HIGH
            escalation = EscalationLevel.NONE
        elif confidence >= 0.7:
            conf_level = ActionConfidence.MEDIUM
            escalation = EscalationLevel.NOTIFY
        elif confidence >= 0.5:
            conf_level = ActionConfidence.LOW
            escalation = EscalationLevel.RECOMMEND
        else:
            conf_level = ActionConfidence.UNCERTAIN
            escalation = EscalationLevel.REQUIRE_APPROVAL

        action = AgentAction(
            action_id=f"{self.agent_type.value}_{datetime.now().strftime('%H%M%S%f')}",
            agent=self.agent_type,
            action_type=action_type,
            description=description,
            confidence=conf_level,
            escalation=escalation,
            parameters=parameters or {},
            reasoning=reasoning
        )

        self.state.pending_actions.append(action)
        self.logger.info(f"Proposed: {action_type} (confidence: {confidence:.0%})")

        return action

    def stop(self):
        """Stop the agent."""
        self._running = False


class PerceptionAgent(BaseAgent):
    """
    Processes detections and identifies patterns/anomalies.

    Capabilities:
    - Temporal pattern detection (degradation over time)
    - Spatial clustering (multiple issues in same area)
    - Severity assessment combining multiple factors
    """

    def __init__(self, state: AgentState, inference_engine=None):
        super().__init__(AgentType.PERCEPTION, state)
        self.inference_engine = inference_engine
        self.detection_history: List[Dict] = []
        self.pattern_window_s = 30  # Look back 30 seconds for patterns

    async def think(self):
        """Analyze detections for patterns and anomalies."""

        if not self.state.active_detections:
            return

        # Check for detection clusters
        clusters = self._find_spatial_clusters()
        if clusters:
            for cluster in clusters:
                self.propose_action(
                    action_type="flag_cluster",
                    description=f"Detected cluster of {len(cluster)} issues in {cluster[0]['class_name']} area",
                    confidence=0.85,
                    parameters={"detections": cluster},
                    reasoning="Multiple detections in close proximity suggest systematic issue"
                )

        # Check for escalating severity
        severity_trend = self._analyze_severity_trend()
        if severity_trend == "increasing":
            self.propose_action(
                action_type="alert_degradation",
                description="Detection severity increasing along inspection path",
                confidence=0.75,
                reasoning="Pattern suggests worsening infrastructure condition"
            )

    def _find_spatial_clusters(self, radius_m: float = 50) -> List[List[Dict]]:
        """Find detections that cluster spatially."""
        # Simplified clustering logic
        clusters = []
        critical = [d for d in self.state.active_detections if d.get('priority') == 'CRITICAL']
        if len(critical) >= 2:
            clusters.append(critical)
        return clusters

    def _analyze_severity_trend(self) -> str:
        """Analyze if severity is increasing over recent detections."""
        if len(self.detection_history) < 5:
            return "stable"

        recent = self.detection_history[-10:]
        critical_count = sum(1 for d in recent if d.get('priority') == 'CRITICAL')

        if critical_count >= 3:
            return "increasing"
        return "stable"


class InvestigatorAgent(BaseAgent):
    """
    Autonomously investigates interesting detections.

    Capabilities:
    - Request closer inspection of critical findings
    - Trigger multi-angle capture
    - Zoom and re-scan ambiguous detections
    """

    # Investigation triggers
    INVESTIGATE_PRIORITIES = {"CRITICAL", "HIGH"}
    MIN_CONFIDENCE_FOR_AUTO = 0.85

    def __init__(self, state: AgentState, dji_controller=None):
        super().__init__(AgentType.INVESTIGATOR, state)
        self.dji = dji_controller
        self.investigating = False
        self.current_investigation: Optional[Dict] = None

    async def think(self):
        """Decide whether to investigate detections."""

        if self.investigating:
            return  # Already investigating

        # Check investigation queue
        if not self.state.investigation_queue:
            # Look for candidates from active detections
            for detection in self.state.active_detections:
                if self._should_investigate(detection):
                    self.state.investigation_queue.append(detection)

        if self.state.investigation_queue:
            target = self.state.investigation_queue[0]
            await self._plan_investigation(target)

    def _should_investigate(self, detection: Dict) -> bool:
        """Determine if a detection warrants investigation."""
        priority = detection.get('priority', 'LOW')
        confidence = detection.get('confidence', 0)

        # Critical with lower confidence = needs verification
        if priority == 'CRITICAL' and confidence < 0.8:
            return True

        # Damaged components always warrant closer look
        if 'damaged' in detection.get('class_name', ''):
            return True

        return False

    async def _plan_investigation(self, detection: Dict):
        """Plan investigation maneuver."""

        confidence = 0.9 if detection.get('priority') == 'CRITICAL' else 0.75

        self.propose_action(
            action_type="investigate_detection",
            description=f"Investigate {detection.get('class_name')} detection",
            confidence=confidence,
            parameters={
                "detection_id": detection.get('id'),
                "maneuver": "orbit_and_zoom",
                "capture_angles": 4,
                "zoom_level": 5.0
            },
            reasoning=f"Detection confidence {detection.get('confidence', 0):.0%} below threshold, requires verification"
        )


class MissionPlannerAgent(BaseAgent):
    """
    Adapts mission plan based on findings.

    Capabilities:
    - Insert investigation waypoints
    - Re-route around obstacles
    - Optimize remaining path based on battery
    - Prioritize areas with detected issues
    """

    def __init__(self, state: AgentState, mission_controller=None):
        super().__init__(AgentType.MISSION_PLANNER, state)
        self.mission = mission_controller
        self.original_waypoints: List = []
        self.inserted_waypoints: List = []

    async def think(self):
        """Adapt mission plan based on current state."""

        # Check if we need to insert investigation waypoints
        if self.state.critical_detections and not self.inserted_waypoints:
            await self._plan_investigation_detour()

        # Check battery vs remaining mission
        await self._check_mission_feasibility()

    async def _plan_investigation_detour(self):
        """Plan detour to investigate critical findings."""

        critical = self.state.critical_detections[-1]  # Most recent

        self.propose_action(
            action_type="insert_waypoint",
            description=f"Insert investigation waypoint for {critical.get('class_name')}",
            confidence=0.8,
            parameters={
                "latitude": critical.get('latitude'),
                "longitude": critical.get('longitude'),
                "altitude_m": self.state.altitude_m - 10,  # Go lower
                "hover_time_s": 10,
                "actions": ["orbit", "multi_capture"]
            },
            reasoning="Critical detection requires closer investigation before continuing"
        )

    async def _check_mission_feasibility(self):
        """Check if mission can be completed with current battery."""

        remaining_waypoints = self.state.total_waypoints - self.state.current_waypoint
        battery = self.state.battery_percent

        # Rough estimate: 2% battery per waypoint + 15% reserve for RTL
        estimated_needed = (remaining_waypoints * 2) + 15

        if battery < estimated_needed:
            self.propose_action(
                action_type="truncate_mission",
                description=f"Truncate mission - battery insufficient for {remaining_waypoints} waypoints",
                confidence=0.95,
                parameters={
                    "complete_waypoints": int((battery - 15) / 2),
                    "skip_waypoints": remaining_waypoints - int((battery - 15) / 2)
                },
                reasoning=f"Battery {battery:.0f}% insufficient for full mission, need {estimated_needed:.0f}%"
            )


class SafetyWatchdogAgent(BaseAgent):
    """
    Monitors for hazards beyond basic telemetry.

    Capabilities:
    - Detect obstacles from camera feed
    - Monitor for birds/wildlife
    - Track weather changes
    - Identify no-fly zone proximity
    """

    def __init__(self, state: AgentState, safety_monitor=None):
        super().__init__(AgentType.SAFETY_WATCHDOG, state)
        self.safety = safety_monitor
        self.hazard_history: List[Dict] = []

    async def think(self):
        """Monitor for safety hazards."""

        # Check for obstacle in flight path (would use depth/vision)
        # This is a placeholder for actual vision-based detection

        # Check for rapid altitude changes (turbulence indicator)
        # Check for GPS anomalies (spoofing detection)
        # Check for communication degradation

        pass  # Actual implementation would process sensor data


class RPICAdvisorAgent(BaseAgent):
    """
    Provides intelligent recommendations to RPIC.

    Capabilities:
    - Summarize findings in natural language
    - Suggest next actions
    - Explain agent decisions
    - Answer RPIC queries (via small LLM)
    """

    # Templates for RPIC communication
    TEMPLATES = {
        "critical_found": "🔴 CRITICAL: Found {class_name} at WP{waypoint}. Confidence: {confidence:.0%}. Recommend: {recommendation}",
        "investigation_complete": "Investigation complete: {summary}. {num_images} images captured.",
        "mission_update": "Mission {progress:.0%} complete. {findings} findings so far. Battery: {battery:.0f}%",
        "recommendation": "💡 Suggestion: {action}. Reason: {reason}"
    }

    def __init__(self, state: AgentState, ground_station=None):
        super().__init__(AgentType.RPIC_ADVISOR, state)
        self.ground_station = ground_station
        self.last_summary_time: Optional[datetime] = None
        self.summary_interval_s = 60  # Summarize every minute

    async def think(self):
        """Generate RPIC advisories."""

        # Check for pending actions that need RPIC attention
        needs_approval = [
            a for a in self.state.pending_actions
            if a.escalation in [EscalationLevel.RECOMMEND, EscalationLevel.REQUIRE_APPROVAL]
            and a.approved is None
        ]

        for action in needs_approval:
            await self._notify_rpic(action)

        # Periodic mission summary
        if self._should_summarize():
            await self._send_summary()

    async def _notify_rpic(self, action: AgentAction):
        """Notify RPIC about pending action."""

        message = self.TEMPLATES["recommendation"].format(
            action=action.description,
            reason=action.reasoning
        )

        self.logger.info(f"RPIC Advisory: {message}")

        if self.ground_station:
            from .ground_station import AlertLevel
            self.ground_station.send_alert(
                level=AlertLevel.INFO if action.escalation == EscalationLevel.RECOMMEND else AlertLevel.WARNING,
                title=f"Agent Recommendation: {action.action_type}",
                message=message,
                data={"action_id": action.action_id, "parameters": action.parameters}
            )

    async def _send_summary(self):
        """Send periodic mission summary to RPIC."""

        critical_count = len(self.state.critical_detections)
        total_detections = len(self.state.active_detections)

        message = self.TEMPLATES["mission_update"].format(
            progress=self.state.mission_progress,
            findings=total_detections,
            battery=self.state.battery_percent
        )

        if critical_count > 0:
            message += f" ⚠️ {critical_count} critical issues found."

        self.logger.info(f"Mission Summary: {message}")
        self.last_summary_time = datetime.now()

    def _should_summarize(self) -> bool:
        """Check if it's time for a summary."""
        if not self.last_summary_time:
            return True
        elapsed = (datetime.now() - self.last_summary_time).total_seconds()
        return elapsed >= self.summary_interval_s


class OrchestratorAgent:
    """
    Central coordinator using behavior tree for decision making.

    Responsibilities:
    - Coordinate all other agents
    - Execute approved actions via DJI SDK
    - Manage action queue and priorities
    - Handle RPIC overrides
    """

    def __init__(
        self,
        state: AgentState,
        dji_controller=None,
        simulation_mode: bool = False
    ):
        self.state = state
        self.dji = dji_controller
        self.simulation_mode = simulation_mode
        self.logger = logging.getLogger("BAHB.Orchestrator")

        # Child agents
        self.agents: Dict[AgentType, BaseAgent] = {}

        # Action execution
        self.action_queue: List[AgentAction] = []
        self.execution_lock = asyncio.Lock()

        # RPIC approval callbacks
        self._approval_callbacks: Dict[str, Callable] = {}

        self._running = False

    def initialize_agents(
        self,
        inference_engine=None,
        mission_controller=None,
        safety_monitor=None,
        ground_station=None
    ):
        """Initialize all child agents."""

        self.agents[AgentType.PERCEPTION] = PerceptionAgent(
            self.state, inference_engine
        )
        self.agents[AgentType.INVESTIGATOR] = InvestigatorAgent(
            self.state, self.dji
        )
        self.agents[AgentType.MISSION_PLANNER] = MissionPlannerAgent(
            self.state, mission_controller
        )
        self.agents[AgentType.SAFETY_WATCHDOG] = SafetyWatchdogAgent(
            self.state, safety_monitor
        )
        self.agents[AgentType.RPIC_ADVISOR] = RPICAdvisorAgent(
            self.state, ground_station
        )

        self.logger.info(f"Initialized {len(self.agents)} agents")

    async def run(self):
        """Main orchestration loop."""
        self._running = True

        # Start all agents
        agent_tasks = [
            asyncio.create_task(agent.run())
            for agent in self.agents.values()
        ]

        # Main orchestration loop
        while self._running:
            try:
                # Process pending actions
                await self._process_actions()

                # Execute approved actions
                await self._execute_actions()

                await asyncio.sleep(0.05)  # 20Hz orchestration rate

            except Exception as e:
                self.logger.error(f"Orchestrator error: {e}")

        # Stop all agents
        for agent in self.agents.values():
            agent.stop()

        await asyncio.gather(*agent_tasks, return_exceptions=True)

    async def _process_actions(self):
        """Process pending actions from all agents."""

        # Move actions to queue based on escalation level
        for action in self.state.pending_actions[:]:
            if action.escalation == EscalationLevel.NONE:
                # Auto-approve high confidence actions
                action.approved = True
                self.action_queue.append(action)
                self.state.pending_actions.remove(action)

            elif action.escalation == EscalationLevel.NOTIFY:
                # Execute but notify RPIC
                action.approved = True
                self.action_queue.append(action)
                self.state.pending_actions.remove(action)

            # RECOMMEND and REQUIRE_APPROVAL stay pending until RPIC responds

    async def _execute_actions(self):
        """Execute approved actions."""

        async with self.execution_lock:
            while self.action_queue:
                action = self.action_queue.pop(0)

                if not action.approved:
                    continue

                success = await self._execute_single_action(action)
                action.executed = success
                self.state.action_history.append(action)

    async def _execute_single_action(self, action: AgentAction) -> bool:
        """Execute a single action via DJI SDK."""

        self.logger.info(f"Executing: {action.action_type}")

        if self.simulation_mode:
            self.logger.info(f"[SIM] Would execute: {action.action_type} with {action.parameters}")
            return True

        # Map action types to DJI commands
        action_handlers = {
            "investigate_detection": self._handle_investigate,
            "insert_waypoint": self._handle_insert_waypoint,
            "truncate_mission": self._handle_truncate_mission,
            "flag_cluster": self._handle_flag_cluster,
            "alert_degradation": self._handle_alert,
        }

        handler = action_handlers.get(action.action_type)
        if handler:
            return await handler(action)

        self.logger.warning(f"Unknown action type: {action.action_type}")
        return False

    async def _handle_investigate(self, action: AgentAction) -> bool:
        """Handle investigation maneuver."""
        params = action.parameters

        # Via DJI MSDK: Execute orbit + zoom sequence
        # self.dji.start_hotpoint_mission(...)
        # self.dji.set_gimbal_zoom(params['zoom_level'])
        # self.dji.capture_photos(params['capture_angles'])

        return True

    async def _handle_insert_waypoint(self, action: AgentAction) -> bool:
        """Handle waypoint insertion."""
        # Via DJI MSDK: Modify waypoint mission
        return True

    async def _handle_truncate_mission(self, action: AgentAction) -> bool:
        """Handle mission truncation."""
        return True

    async def _handle_flag_cluster(self, action: AgentAction) -> bool:
        """Handle cluster flagging."""
        return True

    async def _handle_alert(self, action: AgentAction) -> bool:
        """Handle alert propagation."""
        return True

    def approve_action(self, action_id: str):
        """RPIC approves a pending action."""
        for action in self.state.pending_actions:
            if action.action_id == action_id:
                action.approved = True
                self.action_queue.append(action)
                self.state.pending_actions.remove(action)
                self.logger.info(f"RPIC approved: {action.action_type}")
                return True
        return False

    def reject_action(self, action_id: str):
        """RPIC rejects a pending action."""
        for action in self.state.pending_actions:
            if action.action_id == action_id:
                action.approved = False
                self.state.action_history.append(action)
                self.state.pending_actions.remove(action)
                self.logger.info(f"RPIC rejected: {action.action_type}")
                return True
        return False

    def override_all(self, command: str):
        """RPIC override - takes manual control."""
        self.logger.warning(f"RPIC OVERRIDE: {command}")

        # Clear all pending actions
        for action in self.state.pending_actions:
            action.approved = False
        self.state.pending_actions.clear()
        self.action_queue.clear()

        # Execute override command
        if command == "RTL":
            # Trigger return to launch
            pass
        elif command == "HOLD":
            # Hold position
            pass
        elif command == "LAND":
            # Emergency land
            pass

    def stop(self):
        """Stop orchestrator and all agents."""
        self._running = False
