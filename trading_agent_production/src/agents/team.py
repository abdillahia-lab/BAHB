"""
Team management for the competitive framework.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from .base import (
    BaseAgent,
    MessageBroker,
    create_agent,
)
from ..core.types import (
    AgentIdentifier,
    CodeArtifact,
    EvaluationScore,
    MessageType,
    PerformanceMetrics,
    Priority,
    SpecialistRole,
    TeamIdentifier,
    TeamScore,
)


@dataclass
class TeamStatus:
    """Current status of a team."""
    team_id: str
    is_active: bool
    is_eliminated: bool
    current_round: int
    agents_running: int
    artifacts_submitted: int
    last_activity: datetime


class Team:
    """
    Represents a team of 10 specialized agents working together.
    """

    def __init__(
        self,
        team_number: int,
        broker: MessageBroker
    ):
        self.identifier = TeamIdentifier(team_number)
        self.broker = broker
        self.agents: Dict[SpecialistRole, BaseAgent] = {}
        self.is_eliminated = False
        self.elimination_round: Optional[int] = None
        self.artifacts: List[CodeArtifact] = []
        self.scores: List[TeamScore] = []

        # Create all 10 specialist agents
        self._create_agents()

    @property
    def team_id(self) -> str:
        return self.identifier.team_id

    def _create_agents(self):
        """Create all 10 specialist agents for the team."""
        for role in SpecialistRole:
            agent = create_agent(self.identifier, role, self.broker)
            self.agents[role] = agent

    async def start(self):
        """Start all agents in the team."""
        start_tasks = [
            agent.start() for agent in self.agents.values()
        ]
        await asyncio.gather(*start_tasks)

    async def stop(self):
        """Stop all agents in the team."""
        stop_tasks = [
            agent.stop() for agent in self.agents.values()
        ]
        await asyncio.gather(*stop_tasks)

    async def execute_round(
        self,
        round_number: int,
        tasks: Dict[SpecialistRole, Dict[str, Any]]
    ) -> List[CodeArtifact]:
        """
        Execute a competition round with all agents working in parallel.

        Args:
            round_number: Current tournament round
            tasks: Tasks assigned to each specialist role

        Returns:
            List of code artifacts produced by the team
        """
        if self.is_eliminated:
            return []

        # Execute all tasks in parallel
        execution_tasks = []
        for role, task in tasks.items():
            if role in self.agents:
                execution_tasks.append(
                    self.agents[role].execute_task(task)
                )

        artifacts = await asyncio.gather(*execution_tasks)

        # Store artifacts
        self.artifacts.extend(artifacts)

        return list(artifacts)

    def record_score(self, score: TeamScore):
        """Record a round score."""
        self.scores.append(score)

    def eliminate(self, round_number: int):
        """Mark the team as eliminated."""
        self.is_eliminated = True
        self.elimination_round = round_number

    def get_best_artifacts(
        self,
        category: Optional[str] = None,
        limit: int = 5
    ) -> List[CodeArtifact]:
        """Get the best artifacts from this team."""
        artifacts = self.artifacts
        if category:
            artifacts = [
                a for a in artifacts
                if a.optimization_type == category
            ]
        # Sort by some quality metric (placeholder)
        return sorted(
            artifacts,
            key=lambda a: a.test_coverage,
            reverse=True
        )[:limit]

    def get_status(self) -> TeamStatus:
        """Get current team status."""
        return TeamStatus(
            team_id=self.team_id,
            is_active=not self.is_eliminated,
            is_eliminated=self.is_eliminated,
            current_round=len(self.scores),
            agents_running=len(self.agents),
            artifacts_submitted=len(self.artifacts),
            last_activity=datetime.utcnow()
        )

    def get_latest_score(self) -> Optional[TeamScore]:
        """Get the most recent score."""
        return self.scores[-1] if self.scores else None


class TeamManager:
    """
    Manages all 50 teams in the competitive framework.
    """

    def __init__(self, broker: MessageBroker):
        self.broker = broker
        self.teams: Dict[str, Team] = {}
        self.current_round = 0
        self.elimination_order: List[str] = []

    async def initialize(self, num_teams: int = 50):
        """Initialize all teams."""
        for i in range(1, num_teams + 1):
            team = Team(i, self.broker)
            self.teams[team.team_id] = team

    async def start_all_teams(self):
        """Start all teams."""
        start_tasks = [
            team.start() for team in self.teams.values()
        ]
        await asyncio.gather(*start_tasks)

    async def stop_all_teams(self):
        """Stop all teams."""
        stop_tasks = [
            team.stop() for team in self.teams.values()
        ]
        await asyncio.gather(*stop_tasks)

    def get_active_teams(self) -> List[Team]:
        """Get all non-eliminated teams."""
        return [
            team for team in self.teams.values()
            if not team.is_eliminated
        ]

    def get_eliminated_teams(self) -> List[Team]:
        """Get all eliminated teams."""
        return [
            team for team in self.teams.values()
            if team.is_eliminated
        ]

    async def execute_round(
        self,
        round_number: int,
        tasks: Dict[SpecialistRole, Dict[str, Any]]
    ) -> Dict[str, List[CodeArtifact]]:
        """
        Execute a round for all active teams in parallel.

        Returns:
            Dictionary mapping team_id to their produced artifacts
        """
        self.current_round = round_number
        active_teams = self.get_active_teams()

        # Execute all teams in parallel
        round_tasks = [
            team.execute_round(round_number, tasks)
            for team in active_teams
        ]

        results = await asyncio.gather(*round_tasks)

        return {
            team.team_id: artifacts
            for team, artifacts in zip(active_teams, results)
        }

    def eliminate_lowest_scorer(
        self,
        scores: Dict[str, TeamScore]
    ) -> Optional[str]:
        """
        Eliminate the team with the lowest score.

        Returns:
            The team_id of the eliminated team
        """
        active_teams = self.get_active_teams()
        if len(active_teams) <= 1:
            return None

        # Find lowest scorer
        lowest_team = min(
            active_teams,
            key=lambda t: scores.get(t.team_id, TeamScore(
                team_id=t.team_id,
                round_number=self.current_round,
                latency_score=0,
                security_score=0,
                architecture_score=0,
                parallel_score=0,
                financial_score=0,
                orchestration_score=0,
                strategy_score=0,
                code_quality_score=0,
                risk_score=0,
                integration_score=0
            )).elimination_score
        )

        # Eliminate the team
        lowest_team.eliminate(self.current_round)
        self.elimination_order.append(lowest_team.team_id)

        return lowest_team.team_id

    def get_all_artifacts(
        self,
        include_eliminated: bool = True
    ) -> List[CodeArtifact]:
        """Get all artifacts from all teams."""
        artifacts = []
        teams = self.teams.values() if include_eliminated else self.get_active_teams()
        for team in teams:
            artifacts.extend(team.artifacts)
        return artifacts

    def get_champion(self) -> Optional[Team]:
        """Get the winning team (last remaining)."""
        active = self.get_active_teams()
        if len(active) == 1:
            return active[0]
        return None

    def get_standings(self) -> List[Dict[str, Any]]:
        """Get current standings sorted by elimination score."""
        standings = []
        for team in self.teams.values():
            latest_score = team.get_latest_score()
            standings.append({
                "team_id": team.team_id,
                "is_eliminated": team.is_eliminated,
                "elimination_round": team.elimination_round,
                "score": latest_score.elimination_score if latest_score else 0,
                "artifacts_count": len(team.artifacts)
            })

        # Sort by elimination (active first), then by score
        standings.sort(
            key=lambda x: (x["is_eliminated"], -x["score"])
        )
        return standings
