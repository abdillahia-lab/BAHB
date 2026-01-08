"""
Base agent classes for the competitive framework.
"""

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Set
from uuid import uuid4

from ..core.types import (
    AgentIdentifier,
    AgentMessage,
    CodeArtifact,
    EvaluationScore,
    MessageType,
    PerformanceMetrics,
    Priority,
    SpecialistRole,
    TeamIdentifier,
)


class MessageBroker:
    """
    Central message broker for inter-agent communication.
    """

    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}
        self._message_queue: asyncio.Queue = asyncio.Queue()
        self._running = False

    async def start(self):
        """Start the message broker."""
        self._running = True
        asyncio.create_task(self._process_messages())

    async def stop(self):
        """Stop the message broker."""
        self._running = False

    def subscribe(self, agent_id: str, callback: Callable):
        """Subscribe an agent to receive messages."""
        if agent_id not in self._subscribers:
            self._subscribers[agent_id] = []
        self._subscribers[agent_id].append(callback)

    def unsubscribe(self, agent_id: str, callback: Callable):
        """Unsubscribe an agent from messages."""
        if agent_id in self._subscribers:
            self._subscribers[agent_id].remove(callback)

    async def publish(self, message: AgentMessage):
        """Publish a message to the broker."""
        await self._message_queue.put(message)

    async def _process_messages(self):
        """Process messages from the queue."""
        while self._running:
            try:
                message = await asyncio.wait_for(
                    self._message_queue.get(),
                    timeout=1.0
                )
                await self._deliver_message(message)
            except asyncio.TimeoutError:
                continue

    async def _deliver_message(self, message: AgentMessage):
        """Deliver message to appropriate subscribers."""
        if message.receiver_id == "ALL":
            # Broadcast to all subscribers
            for subscribers in self._subscribers.values():
                for callback in subscribers:
                    asyncio.create_task(callback(message))
        elif message.receiver_id in self._subscribers:
            # Deliver to specific subscriber
            for callback in self._subscribers[message.receiver_id]:
                asyncio.create_task(callback(message))


class BaseAgent(ABC):
    """
    Abstract base class for all agents in the competitive framework.
    """

    def __init__(
        self,
        identifier: AgentIdentifier,
        broker: MessageBroker
    ):
        self.identifier = identifier
        self.broker = broker
        self._running = False
        self._message_handlers: Dict[MessageType, Callable] = {}

        # Register with broker
        self.broker.subscribe(self.identifier.agent_id, self._handle_message)

    @property
    def agent_id(self) -> str:
        return self.identifier.agent_id

    @property
    def team_id(self) -> str:
        return self.identifier.team.team_id

    @property
    def role(self) -> SpecialistRole:
        return self.identifier.role

    async def start(self):
        """Start the agent."""
        self._running = True
        await self._initialize()
        asyncio.create_task(self._main_loop())

    async def stop(self):
        """Stop the agent."""
        self._running = False
        self.broker.unsubscribe(self.agent_id, self._handle_message)
        await self._cleanup()

    @abstractmethod
    async def _initialize(self):
        """Initialize agent-specific resources."""
        pass

    @abstractmethod
    async def _cleanup(self):
        """Cleanup agent-specific resources."""
        pass

    @abstractmethod
    async def _main_loop(self):
        """Main agent execution loop."""
        pass

    @abstractmethod
    async def execute_task(self, task: Dict[str, Any]) -> CodeArtifact:
        """Execute an optimization task and return code artifact."""
        pass

    async def _handle_message(self, message: AgentMessage):
        """Handle incoming messages."""
        handler = self._message_handlers.get(message.message_type)
        if handler:
            await handler(message)

    def register_handler(
        self,
        message_type: MessageType,
        handler: Callable
    ):
        """Register a message handler."""
        self._message_handlers[message_type] = handler

    async def send_message(
        self,
        receiver_id: str,
        message_type: MessageType,
        payload: Dict[str, Any],
        priority: Priority = Priority.NORMAL
    ):
        """Send a message to another agent."""
        message = AgentMessage(
            sender_id=self.agent_id,
            receiver_id=receiver_id,
            message_type=message_type,
            payload=payload,
            priority=priority
        )
        await self.broker.publish(message)

    async def broadcast_to_team(
        self,
        message_type: MessageType,
        payload: Dict[str, Any],
        priority: Priority = Priority.NORMAL
    ):
        """Broadcast message to all team members."""
        for role in SpecialistRole:
            receiver_id = f"{self.team_id}-{role.value}"
            if receiver_id != self.agent_id:
                await self.send_message(
                    receiver_id,
                    message_type,
                    payload,
                    priority
                )


class LatencyOptimizationExpert(BaseAgent):
    """
    Specialist agent for latency optimization.
    """

    async def _initialize(self):
        self.profiler = None
        self.benchmarks: List[Dict[str, Any]] = []
        self.register_handler(
            MessageType.PERFORMANCE_REPORT,
            self._handle_performance_report
        )

    async def _cleanup(self):
        self.benchmarks.clear()

    async def _main_loop(self):
        while self._running:
            # Continuously look for optimization opportunities
            await asyncio.sleep(1)

    async def execute_task(self, task: Dict[str, Any]) -> CodeArtifact:
        """Execute latency optimization task."""
        component = task.get("component")
        current_latency = task.get("current_latency_ms", 0)

        # Analyze and optimize
        optimization = await self._analyze_and_optimize(component)

        return CodeArtifact(
            artifact_id=str(uuid4()),
            team_id=self.team_id,
            specialist_role=self.role,
            component=component,
            file_path=optimization["file_path"],
            code_content=optimization["code"],
            description=optimization["description"],
            optimization_type="latency_reduction",
            lines_added=optimization.get("lines_added", 0),
            lines_removed=optimization.get("lines_removed", 0)
        )

    async def _analyze_and_optimize(
        self,
        component: str
    ) -> Dict[str, Any]:
        """Analyze component and generate optimization."""
        # This would contain actual optimization logic
        return {
            "file_path": f"src/{component}.py",
            "code": "# Optimized implementation",
            "description": f"Latency optimization for {component}",
            "lines_added": 0,
            "lines_removed": 0
        }

    async def _handle_performance_report(self, message: AgentMessage):
        """Handle performance report from other agents."""
        report = message.payload
        self.benchmarks.append(report)


class SecurityArchitect(BaseAgent):
    """
    Specialist agent for security architecture.
    """

    async def _initialize(self):
        self.vulnerability_db: List[Dict[str, Any]] = []
        self.security_policies: Dict[str, Any] = {}

    async def _cleanup(self):
        pass

    async def _main_loop(self):
        while self._running:
            await asyncio.sleep(1)

    async def execute_task(self, task: Dict[str, Any]) -> CodeArtifact:
        """Execute security hardening task."""
        component = task.get("component")
        security_type = task.get("security_type", "general")

        hardening = await self._apply_security_hardening(
            component,
            security_type
        )

        return CodeArtifact(
            artifact_id=str(uuid4()),
            team_id=self.team_id,
            specialist_role=self.role,
            component=component,
            file_path=hardening["file_path"],
            code_content=hardening["code"],
            description=hardening["description"],
            optimization_type="security_hardening"
        )

    async def _apply_security_hardening(
        self,
        component: str,
        security_type: str
    ) -> Dict[str, Any]:
        """Apply security hardening to component."""
        return {
            "file_path": f"src/{component}.py",
            "code": "# Security hardened implementation",
            "description": f"Security hardening ({security_type}) for {component}"
        }


class SystemArchitectureDesigner(BaseAgent):
    """
    Specialist agent for system architecture design.
    """

    async def _initialize(self):
        self.architecture_decisions: List[Dict[str, Any]] = []

    async def _cleanup(self):
        pass

    async def _main_loop(self):
        while self._running:
            await asyncio.sleep(1)

    async def execute_task(self, task: Dict[str, Any]) -> CodeArtifact:
        """Execute architecture design task."""
        component = task.get("component")

        design = await self._design_architecture(component)

        return CodeArtifact(
            artifact_id=str(uuid4()),
            team_id=self.team_id,
            specialist_role=self.role,
            component=component,
            file_path=design["file_path"],
            code_content=design["code"],
            description=design["description"],
            optimization_type="architecture_design"
        )

    async def _design_architecture(
        self,
        component: str
    ) -> Dict[str, Any]:
        """Design architecture for component."""
        return {
            "file_path": f"src/{component}.py",
            "code": "# Architected implementation",
            "description": f"Architecture design for {component}"
        }


class ParallelProcessingOptimizer(BaseAgent):
    """
    Specialist agent for parallel processing optimization.
    """

    async def _initialize(self):
        self.parallelization_opportunities: List[str] = []

    async def _cleanup(self):
        pass

    async def _main_loop(self):
        while self._running:
            await asyncio.sleep(1)

    async def execute_task(self, task: Dict[str, Any]) -> CodeArtifact:
        """Execute parallel processing optimization task."""
        component = task.get("component")

        parallel_impl = await self._parallelize_component(component)

        return CodeArtifact(
            artifact_id=str(uuid4()),
            team_id=self.team_id,
            specialist_role=self.role,
            component=component,
            file_path=parallel_impl["file_path"],
            code_content=parallel_impl["code"],
            description=parallel_impl["description"],
            optimization_type="parallel_optimization"
        )

    async def _parallelize_component(
        self,
        component: str
    ) -> Dict[str, Any]:
        """Parallelize component implementation."""
        return {
            "file_path": f"src/{component}.py",
            "code": "# Parallelized implementation",
            "description": f"Parallel processing optimization for {component}"
        }


class FinancialAnalyst(BaseAgent):
    """
    Specialist agent for financial analysis.
    """

    async def _initialize(self):
        self.analysis_cache: Dict[str, Any] = {}

    async def _cleanup(self):
        pass

    async def _main_loop(self):
        while self._running:
            await asyncio.sleep(1)

    async def execute_task(self, task: Dict[str, Any]) -> CodeArtifact:
        """Execute financial analysis implementation task."""
        component = task.get("component")

        analysis_impl = await self._implement_analysis(component)

        return CodeArtifact(
            artifact_id=str(uuid4()),
            team_id=self.team_id,
            specialist_role=self.role,
            component=component,
            file_path=analysis_impl["file_path"],
            code_content=analysis_impl["code"],
            description=analysis_impl["description"],
            optimization_type="financial_analysis"
        )

    async def _implement_analysis(
        self,
        component: str
    ) -> Dict[str, Any]:
        """Implement financial analysis component."""
        return {
            "file_path": f"src/{component}.py",
            "code": "# Financial analysis implementation",
            "description": f"Financial analysis for {component}"
        }


class OrchestrationSpecialist(BaseAgent):
    """
    Specialist agent for workflow orchestration.
    """

    async def _initialize(self):
        self.workflows: Dict[str, Any] = {}

    async def _cleanup(self):
        pass

    async def _main_loop(self):
        while self._running:
            await asyncio.sleep(1)

    async def execute_task(self, task: Dict[str, Any]) -> CodeArtifact:
        """Execute orchestration implementation task."""
        component = task.get("component")

        orchestration = await self._design_orchestration(component)

        return CodeArtifact(
            artifact_id=str(uuid4()),
            team_id=self.team_id,
            specialist_role=self.role,
            component=component,
            file_path=orchestration["file_path"],
            code_content=orchestration["code"],
            description=orchestration["description"],
            optimization_type="orchestration"
        )

    async def _design_orchestration(
        self,
        component: str
    ) -> Dict[str, Any]:
        """Design orchestration for component."""
        return {
            "file_path": f"src/{component}.py",
            "code": "# Orchestration implementation",
            "description": f"Orchestration design for {component}"
        }


class StrategySuggester(BaseAgent):
    """
    Specialist agent for trading strategy development.
    """

    async def _initialize(self):
        self.strategies: List[Dict[str, Any]] = []

    async def _cleanup(self):
        pass

    async def _main_loop(self):
        while self._running:
            await asyncio.sleep(1)

    async def execute_task(self, task: Dict[str, Any]) -> CodeArtifact:
        """Execute strategy implementation task."""
        strategy_type = task.get("strategy_type")

        strategy = await self._develop_strategy(strategy_type)

        return CodeArtifact(
            artifact_id=str(uuid4()),
            team_id=self.team_id,
            specialist_role=self.role,
            component=f"strategy_{strategy_type}",
            file_path=strategy["file_path"],
            code_content=strategy["code"],
            description=strategy["description"],
            optimization_type="strategy_development"
        )

    async def _develop_strategy(
        self,
        strategy_type: str
    ) -> Dict[str, Any]:
        """Develop trading strategy."""
        return {
            "file_path": f"src/strategies/{strategy_type}.py",
            "code": "# Strategy implementation",
            "description": f"Trading strategy: {strategy_type}"
        }


class CodeReviewer(BaseAgent):
    """
    Specialist agent for code review and quality.
    """

    async def _initialize(self):
        self.review_history: List[Dict[str, Any]] = []

    async def _cleanup(self):
        pass

    async def _main_loop(self):
        while self._running:
            # Monitor for code review requests
            await asyncio.sleep(1)

    async def execute_task(self, task: Dict[str, Any]) -> CodeArtifact:
        """Execute code review and improvement task."""
        artifact = task.get("artifact")

        reviewed = await self._review_and_improve(artifact)

        return CodeArtifact(
            artifact_id=str(uuid4()),
            team_id=self.team_id,
            specialist_role=self.role,
            component=artifact.component,
            file_path=artifact.file_path,
            code_content=reviewed["improved_code"],
            description=reviewed["description"],
            optimization_type="code_quality",
            test_coverage=reviewed.get("test_coverage", 0.0)
        )

    async def _review_and_improve(
        self,
        artifact: CodeArtifact
    ) -> Dict[str, Any]:
        """Review and improve code artifact."""
        return {
            "improved_code": artifact.code_content,
            "description": f"Code review improvements for {artifact.component}",
            "test_coverage": 0.9
        }


class RiskAssessor(BaseAgent):
    """
    Specialist agent for risk assessment.
    """

    async def _initialize(self):
        self.risk_models: Dict[str, Any] = {}

    async def _cleanup(self):
        pass

    async def _main_loop(self):
        while self._running:
            await asyncio.sleep(1)

    async def execute_task(self, task: Dict[str, Any]) -> CodeArtifact:
        """Execute risk assessment implementation task."""
        component = task.get("component")

        risk_impl = await self._implement_risk_assessment(component)

        return CodeArtifact(
            artifact_id=str(uuid4()),
            team_id=self.team_id,
            specialist_role=self.role,
            component=component,
            file_path=risk_impl["file_path"],
            code_content=risk_impl["code"],
            description=risk_impl["description"],
            optimization_type="risk_assessment"
        )

    async def _implement_risk_assessment(
        self,
        component: str
    ) -> Dict[str, Any]:
        """Implement risk assessment for component."""
        return {
            "file_path": f"src/{component}.py",
            "code": "# Risk assessment implementation",
            "description": f"Risk assessment for {component}"
        }


class IntegrationEngineer(BaseAgent):
    """
    Specialist agent for system integration.
    """

    async def _initialize(self):
        self.integrations: Dict[str, Any] = {}

    async def _cleanup(self):
        pass

    async def _main_loop(self):
        while self._running:
            await asyncio.sleep(1)

    async def execute_task(self, task: Dict[str, Any]) -> CodeArtifact:
        """Execute integration implementation task."""
        integration_type = task.get("integration_type")

        integration = await self._implement_integration(integration_type)

        return CodeArtifact(
            artifact_id=str(uuid4()),
            team_id=self.team_id,
            specialist_role=self.role,
            component=f"integration_{integration_type}",
            file_path=integration["file_path"],
            code_content=integration["code"],
            description=integration["description"],
            optimization_type="integration"
        )

    async def _implement_integration(
        self,
        integration_type: str
    ) -> Dict[str, Any]:
        """Implement system integration."""
        return {
            "file_path": f"src/integrations/{integration_type}.py",
            "code": "# Integration implementation",
            "description": f"Integration: {integration_type}"
        }


# Agent factory
AGENT_CLASSES = {
    SpecialistRole.LATENCY_OPTIMIZATION_EXPERT: LatencyOptimizationExpert,
    SpecialistRole.SECURITY_ARCHITECT: SecurityArchitect,
    SpecialistRole.SYSTEM_ARCHITECTURE_DESIGNER: SystemArchitectureDesigner,
    SpecialistRole.PARALLEL_PROCESSING_OPTIMIZER: ParallelProcessingOptimizer,
    SpecialistRole.FINANCIAL_ANALYST: FinancialAnalyst,
    SpecialistRole.ORCHESTRATION_SPECIALIST: OrchestrationSpecialist,
    SpecialistRole.STRATEGY_SUGGESTER: StrategySuggester,
    SpecialistRole.CODE_REVIEWER: CodeReviewer,
    SpecialistRole.RISK_ASSESSOR: RiskAssessor,
    SpecialistRole.INTEGRATION_ENGINEER: IntegrationEngineer,
}


def create_agent(
    team: TeamIdentifier,
    role: SpecialistRole,
    broker: MessageBroker
) -> BaseAgent:
    """Factory function to create specialized agents."""
    identifier = AgentIdentifier(team=team, role=role)
    agent_class = AGENT_CLASSES.get(role)
    if not agent_class:
        raise ValueError(f"Unknown specialist role: {role}")
    return agent_class(identifier, broker)
