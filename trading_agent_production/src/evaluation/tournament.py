"""
Tournament runner for the competitive agent framework.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional
from uuid import uuid4

from .judges import JudgePanel, SolutionRegistry
from ..agents.base import MessageBroker
from ..agents.team import Team, TeamManager
from ..core.types import (
    CodeArtifact,
    PerformanceMetrics,
    SpecialistRole,
    TeamScore,
    TournamentPhase,
)


@dataclass
class RoundResult:
    """Results from a single tournament round."""
    round_number: int
    phase: TournamentPhase
    team_artifacts: Dict[str, List[CodeArtifact]]
    team_scores: Dict[str, TeamScore]
    eliminated_team: Optional[str]
    preserved_solutions_count: int
    duration_seconds: float
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class TournamentConfig:
    """Configuration for the tournament."""
    total_teams: int = 50
    agents_per_team: int = 10
    rounds: int = 49
    round_duration_seconds: int = 3600  # 1 hour per round


class TournamentRunner:
    """
    Orchestrates the competitive tournament between 50 teams.
    """

    def __init__(self, config: TournamentConfig):
        self.config = config
        self.broker = MessageBroker()
        self.team_manager = TeamManager(self.broker)
        self.judge_panel = JudgePanel()
        self.solution_registry = SolutionRegistry()

        self.current_round = 0
        self.round_results: List[RoundResult] = []
        self.is_running = False

        # Callbacks
        self._on_round_complete: Optional[Callable] = None
        self._on_elimination: Optional[Callable] = None
        self._on_tournament_complete: Optional[Callable] = None

    async def initialize(self):
        """Initialize the tournament."""
        await self.broker.start()
        await self.team_manager.initialize(self.config.total_teams)
        await self.team_manager.start_all_teams()

    async def shutdown(self):
        """Shutdown the tournament."""
        await self.team_manager.stop_all_teams()
        await self.broker.stop()

    def get_phase(self, round_number: int) -> TournamentPhase:
        """Determine tournament phase based on round number."""
        if round_number <= 10:
            return TournamentPhase.FOUNDATION
        elif round_number <= 25:
            return TournamentPhase.OPTIMIZATION
        elif round_number <= 40:
            return TournamentPhase.INTEGRATION
        else:
            return TournamentPhase.CHAMPIONSHIP

    def get_round_tasks(
        self,
        round_number: int
    ) -> Dict[SpecialistRole, Dict[str, Any]]:
        """
        Generate tasks for each specialist role based on the current round.
        """
        phase = self.get_phase(round_number)

        # Base tasks that evolve by phase
        if phase == TournamentPhase.FOUNDATION:
            return self._foundation_tasks(round_number)
        elif phase == TournamentPhase.OPTIMIZATION:
            return self._optimization_tasks(round_number)
        elif phase == TournamentPhase.INTEGRATION:
            return self._integration_tasks(round_number)
        else:
            return self._championship_tasks(round_number)

    def _foundation_tasks(
        self,
        round_number: int
    ) -> Dict[SpecialistRole, Dict[str, Any]]:
        """Foundation phase tasks - core infrastructure."""
        return {
            SpecialistRole.LATENCY_OPTIMIZATION_EXPERT: {
                "component": "data_ingestion",
                "target": "baseline_optimization",
                "round": round_number
            },
            SpecialistRole.SECURITY_ARCHITECT: {
                "component": "authentication",
                "security_type": "core_auth",
                "round": round_number
            },
            SpecialistRole.SYSTEM_ARCHITECTURE_DESIGNER: {
                "component": "core_services",
                "focus": "service_boundaries",
                "round": round_number
            },
            SpecialistRole.PARALLEL_PROCESSING_OPTIMIZER: {
                "component": "async_foundation",
                "focus": "event_loop_optimization",
                "round": round_number
            },
            SpecialistRole.FINANCIAL_ANALYST: {
                "component": "market_data",
                "focus": "indicator_library",
                "round": round_number
            },
            SpecialistRole.ORCHESTRATION_SPECIALIST: {
                "component": "workflow_engine",
                "focus": "basic_orchestration",
                "round": round_number
            },
            SpecialistRole.STRATEGY_SUGGESTER: {
                "strategy_type": "momentum_basic",
                "round": round_number
            },
            SpecialistRole.CODE_REVIEWER: {
                "artifact": None,  # Will review other artifacts
                "focus": "code_standards",
                "round": round_number
            },
            SpecialistRole.RISK_ASSESSOR: {
                "component": "risk_models",
                "focus": "var_calculation",
                "round": round_number
            },
            SpecialistRole.INTEGRATION_ENGINEER: {
                "integration_type": "broker_api",
                "round": round_number
            }
        }

    def _optimization_tasks(
        self,
        round_number: int
    ) -> Dict[SpecialistRole, Dict[str, Any]]:
        """Optimization phase tasks - performance tuning."""
        return {
            SpecialistRole.LATENCY_OPTIMIZATION_EXPERT: {
                "component": "execution_engine",
                "target": "ultra_low_latency",
                "round": round_number
            },
            SpecialistRole.SECURITY_ARCHITECT: {
                "component": "api_security",
                "security_type": "hardening",
                "round": round_number
            },
            SpecialistRole.SYSTEM_ARCHITECTURE_DESIGNER: {
                "component": "microservices",
                "focus": "scalability",
                "round": round_number
            },
            SpecialistRole.PARALLEL_PROCESSING_OPTIMIZER: {
                "component": "gpu_acceleration",
                "focus": "model_inference",
                "round": round_number
            },
            SpecialistRole.FINANCIAL_ANALYST: {
                "component": "alpha_signals",
                "focus": "custom_factors",
                "round": round_number
            },
            SpecialistRole.ORCHESTRATION_SPECIALIST: {
                "component": "saga_patterns",
                "focus": "distributed_transactions",
                "round": round_number
            },
            SpecialistRole.STRATEGY_SUGGESTER: {
                "strategy_type": "mean_reversion",
                "round": round_number
            },
            SpecialistRole.CODE_REVIEWER: {
                "artifact": None,
                "focus": "performance_patterns",
                "round": round_number
            },
            SpecialistRole.RISK_ASSESSOR: {
                "component": "stress_testing",
                "focus": "scenario_analysis",
                "round": round_number
            },
            SpecialistRole.INTEGRATION_ENGINEER: {
                "integration_type": "market_data_feeds",
                "round": round_number
            }
        }

    def _integration_tasks(
        self,
        round_number: int
    ) -> Dict[SpecialistRole, Dict[str, Any]]:
        """Integration phase tasks - system integration."""
        return {
            SpecialistRole.LATENCY_OPTIMIZATION_EXPERT: {
                "component": "end_to_end",
                "target": "full_path_optimization",
                "round": round_number
            },
            SpecialistRole.SECURITY_ARCHITECT: {
                "component": "compliance",
                "security_type": "audit_logging",
                "round": round_number
            },
            SpecialistRole.SYSTEM_ARCHITECTURE_DESIGNER: {
                "component": "service_mesh",
                "focus": "observability",
                "round": round_number
            },
            SpecialistRole.PARALLEL_PROCESSING_OPTIMIZER: {
                "component": "distributed_compute",
                "focus": "cluster_optimization",
                "round": round_number
            },
            SpecialistRole.FINANCIAL_ANALYST: {
                "component": "portfolio_optimization",
                "focus": "multi_asset",
                "round": round_number
            },
            SpecialistRole.ORCHESTRATION_SPECIALIST: {
                "component": "error_handling",
                "focus": "resilience_patterns",
                "round": round_number
            },
            SpecialistRole.STRATEGY_SUGGESTER: {
                "strategy_type": "multi_strategy_ensemble",
                "round": round_number
            },
            SpecialistRole.CODE_REVIEWER: {
                "artifact": None,
                "focus": "integration_quality",
                "round": round_number
            },
            SpecialistRole.RISK_ASSESSOR: {
                "component": "circuit_breakers",
                "focus": "system_safeguards",
                "round": round_number
            },
            SpecialistRole.INTEGRATION_ENGINEER: {
                "integration_type": "full_stack",
                "round": round_number
            }
        }

    def _championship_tasks(
        self,
        round_number: int
    ) -> Dict[SpecialistRole, Dict[str, Any]]:
        """Championship phase tasks - final refinement."""
        return {
            SpecialistRole.LATENCY_OPTIMIZATION_EXPERT: {
                "component": "production_optimization",
                "target": "sub_millisecond",
                "round": round_number
            },
            SpecialistRole.SECURITY_ARCHITECT: {
                "component": "security_review",
                "security_type": "penetration_testing",
                "round": round_number
            },
            SpecialistRole.SYSTEM_ARCHITECTURE_DESIGNER: {
                "component": "disaster_recovery",
                "focus": "high_availability",
                "round": round_number
            },
            SpecialistRole.PARALLEL_PROCESSING_OPTIMIZER: {
                "component": "production_scaling",
                "focus": "auto_scaling",
                "round": round_number
            },
            SpecialistRole.FINANCIAL_ANALYST: {
                "component": "production_signals",
                "focus": "live_validation",
                "round": round_number
            },
            SpecialistRole.ORCHESTRATION_SPECIALIST: {
                "component": "production_workflows",
                "focus": "monitoring_integration",
                "round": round_number
            },
            SpecialistRole.STRATEGY_SUGGESTER: {
                "strategy_type": "production_strategy",
                "round": round_number
            },
            SpecialistRole.CODE_REVIEWER: {
                "artifact": None,
                "focus": "production_readiness",
                "round": round_number
            },
            SpecialistRole.RISK_ASSESSOR: {
                "component": "production_risk",
                "focus": "live_monitoring",
                "round": round_number
            },
            SpecialistRole.INTEGRATION_ENGINEER: {
                "integration_type": "production_deployment",
                "round": round_number
            }
        }

    async def run_round(self, round_number: int) -> RoundResult:
        """Execute a single tournament round."""
        start_time = datetime.utcnow()
        self.current_round = round_number
        self.solution_registry.advance_round()

        phase = self.get_phase(round_number)
        tasks = self.get_round_tasks(round_number)

        # Execute round for all active teams
        team_artifacts = await self.team_manager.execute_round(
            round_number,
            tasks
        )

        # Evaluate all artifacts
        team_scores = {}
        preserved_count = 0

        for team_id, artifacts in team_artifacts.items():
            # Evaluate each artifact
            for artifact in artifacts:
                evaluations = await self.judge_panel.evaluate_artifact(artifact)
                decision = self.judge_panel.get_consensus_decision(evaluations)

                # Register solution if preserved
                if decision != decision.REJECT:
                    self.solution_registry.register_solution(
                        artifact,
                        evaluations,
                        decision
                    )
                    preserved_count += 1

            # Calculate team score
            team_scores[team_id] = await self._calculate_team_score(
                team_id,
                artifacts,
                round_number
            )

            # Record score on team
            team = self.team_manager.teams.get(team_id)
            if team:
                team.record_score(team_scores[team_id])

        # Eliminate lowest scorer
        eliminated_team = self.team_manager.eliminate_lowest_scorer(team_scores)

        # Calculate duration
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        result = RoundResult(
            round_number=round_number,
            phase=phase,
            team_artifacts=team_artifacts,
            team_scores=team_scores,
            eliminated_team=eliminated_team,
            preserved_solutions_count=preserved_count,
            duration_seconds=duration
        )

        self.round_results.append(result)

        # Trigger callbacks
        if self._on_round_complete:
            await self._on_round_complete(result)

        if eliminated_team and self._on_elimination:
            await self._on_elimination(eliminated_team, round_number)

        return result

    async def _calculate_team_score(
        self,
        team_id: str,
        artifacts: List[CodeArtifact],
        round_number: int
    ) -> TeamScore:
        """Calculate comprehensive team score from artifacts."""
        # Group artifacts by specialist role
        role_scores: Dict[str, float] = {}

        for artifact in artifacts:
            role = artifact.specialist_role.value
            # Get evaluations for this artifact
            score = artifact.test_coverage  # Placeholder - would use actual evaluation
            role_scores[role] = max(role_scores.get(role, 0), score)

        return TeamScore(
            team_id=team_id,
            round_number=round_number,
            latency_score=role_scores.get("LOE", 0.5),
            security_score=role_scores.get("SA", 0.5),
            architecture_score=role_scores.get("SAD", 0.5),
            parallel_score=role_scores.get("PPO", 0.5),
            financial_score=role_scores.get("FA", 0.5),
            orchestration_score=role_scores.get("OS", 0.5),
            strategy_score=role_scores.get("SS", 0.5),
            code_quality_score=role_scores.get("CR", 0.5),
            risk_score=role_scores.get("RA", 0.5),
            integration_score=role_scores.get("IE", 0.5),
            innovation_bonus=0.0  # Calculated separately
        )

    async def run_tournament(self) -> Optional[Team]:
        """
        Run the complete tournament (49 rounds).

        Returns the winning team.
        """
        self.is_running = True
        await self.initialize()

        try:
            for round_num in range(1, self.config.rounds + 1):
                if not self.is_running:
                    break

                result = await self.run_round(round_num)
                print(f"Round {round_num} complete. Eliminated: {result.eliminated_team}")

                # Check if we have a winner
                active_teams = self.team_manager.get_active_teams()
                if len(active_teams) == 1:
                    break

            # Tournament complete
            champion = self.team_manager.get_champion()

            if self._on_tournament_complete:
                await self._on_tournament_complete(
                    champion,
                    self.solution_registry.get_all_preserved()
                )

            return champion

        finally:
            await self.shutdown()
            self.is_running = False

    def stop_tournament(self):
        """Stop the tournament gracefully."""
        self.is_running = False

    def get_standings(self) -> List[Dict[str, Any]]:
        """Get current tournament standings."""
        return self.team_manager.get_standings()

    def get_preserved_solutions(self) -> List[Any]:
        """Get all preserved solutions."""
        return self.solution_registry.get_all_preserved()

    def on_round_complete(self, callback: Callable):
        """Register callback for round completion."""
        self._on_round_complete = callback

    def on_elimination(self, callback: Callable):
        """Register callback for team elimination."""
        self._on_elimination = callback

    def on_tournament_complete(self, callback: Callable):
        """Register callback for tournament completion."""
        self._on_tournament_complete = callback


class TournamentDashboard:
    """
    Real-time dashboard for monitoring tournament progress.
    """

    def __init__(self, runner: TournamentRunner):
        self.runner = runner

    def get_summary(self) -> Dict[str, Any]:
        """Get tournament summary."""
        return {
            "current_round": self.runner.current_round,
            "phase": self.runner.get_phase(self.runner.current_round).value,
            "active_teams": len(self.runner.team_manager.get_active_teams()),
            "eliminated_teams": len(self.runner.team_manager.get_eliminated_teams()),
            "preserved_solutions": len(self.runner.get_preserved_solutions()),
            "standings": self.runner.get_standings()[:10],  # Top 10
            "is_running": self.runner.is_running
        }

    def get_team_details(self, team_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed info for a specific team."""
        team = self.runner.team_manager.teams.get(team_id)
        if not team:
            return None

        return {
            "team_id": team.team_id,
            "status": team.get_status(),
            "scores": [s.__dict__ for s in team.scores],
            "artifacts_count": len(team.artifacts),
            "is_eliminated": team.is_eliminated,
            "elimination_round": team.elimination_round
        }

    def get_category_leaderboard(
        self,
        category: str
    ) -> List[Dict[str, Any]]:
        """Get leaderboard for a specific optimization category."""
        solutions = self.runner.solution_registry.get_best_solutions(
            category,
            n=10
        )
        return [
            {
                "team_id": s.team_id,
                "score": s.evaluation_score.composite_score,
                "round": s.round_preserved
            }
            for s in solutions
        ]
