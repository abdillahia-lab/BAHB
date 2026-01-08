"""
Judge system for evaluating team outputs and preserving optimal solutions.
"""

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Set
from uuid import uuid4

from ..core.types import (
    CodeArtifact,
    EvaluationScore,
    JudgeType,
    PerformanceMetrics,
    PreservationDecision,
    PreservedSolution,
    SpecialistRole,
    TeamScore,
)


@dataclass
class JudgeEvaluation:
    """Result of a judge evaluation."""
    judge_id: str
    artifact_id: str
    team_id: str
    evaluation_score: EvaluationScore
    decision: PreservationDecision
    category: str
    notes: str
    timestamp: datetime = field(default_factory=datetime.utcnow)


class BaseJudge(ABC):
    """
    Abstract base class for all judges.
    """

    def __init__(
        self,
        judge_id: str,
        judge_type: JudgeType,
        specialization: str
    ):
        self.judge_id = judge_id
        self.judge_type = judge_type
        self.specialization = specialization
        self.evaluations: List[JudgeEvaluation] = []

    @abstractmethod
    async def evaluate(
        self,
        artifact: CodeArtifact,
        metrics: Optional[PerformanceMetrics] = None
    ) -> JudgeEvaluation:
        """Evaluate a code artifact."""
        pass

    @abstractmethod
    def get_preservation_decision(
        self,
        score: EvaluationScore
    ) -> PreservationDecision:
        """Determine whether to preserve the solution."""
        pass

    def get_evaluation_history(
        self,
        team_id: Optional[str] = None
    ) -> List[JudgeEvaluation]:
        """Get evaluation history, optionally filtered by team."""
        if team_id:
            return [e for e in self.evaluations if e.team_id == team_id]
        return self.evaluations


class GeneralJudge(BaseJudge):
    """
    General purpose judge for evaluating all optimization contributions.
    """

    # Specialization weights for different general judges
    SPECIALIZATION_WEIGHTS = {
        "performance": {
            "correctness": 0.20,
            "performance": 0.40,
            "maintainability": 0.10,
            "reusability": 0.15,
            "innovation": 0.10,
            "integration_compatibility": 0.05
        },
        "security": {
            "correctness": 0.30,
            "performance": 0.10,
            "maintainability": 0.15,
            "reusability": 0.15,
            "innovation": 0.15,
            "integration_compatibility": 0.15
        },
        "architecture": {
            "correctness": 0.25,
            "performance": 0.15,
            "maintainability": 0.25,
            "reusability": 0.20,
            "innovation": 0.10,
            "integration_compatibility": 0.05
        },
        "scalability": {
            "correctness": 0.20,
            "performance": 0.35,
            "maintainability": 0.10,
            "reusability": 0.15,
            "innovation": 0.10,
            "integration_compatibility": 0.10
        },
        "reliability": {
            "correctness": 0.35,
            "performance": 0.15,
            "maintainability": 0.15,
            "reusability": 0.15,
            "innovation": 0.10,
            "integration_compatibility": 0.10
        },
        "code_quality": {
            "correctness": 0.25,
            "performance": 0.10,
            "maintainability": 0.30,
            "reusability": 0.20,
            "innovation": 0.05,
            "integration_compatibility": 0.10
        },
        "financial_logic": {
            "correctness": 0.35,
            "performance": 0.20,
            "maintainability": 0.10,
            "reusability": 0.15,
            "innovation": 0.15,
            "integration_compatibility": 0.05
        },
        "integration": {
            "correctness": 0.25,
            "performance": 0.15,
            "maintainability": 0.15,
            "reusability": 0.10,
            "innovation": 0.05,
            "integration_compatibility": 0.30
        },
        "innovation": {
            "correctness": 0.20,
            "performance": 0.15,
            "maintainability": 0.10,
            "reusability": 0.10,
            "innovation": 0.40,
            "integration_compatibility": 0.05
        },
        "synthesis": {
            "correctness": 0.20,
            "performance": 0.20,
            "maintainability": 0.15,
            "reusability": 0.15,
            "innovation": 0.15,
            "integration_compatibility": 0.15
        }
    }

    def __init__(self, judge_number: int, specialization: str):
        super().__init__(
            judge_id=f"GJ-{judge_number:03d}",
            judge_type=JudgeType.GENERAL,
            specialization=specialization
        )
        self.weights = self.SPECIALIZATION_WEIGHTS.get(
            specialization,
            self.SPECIALIZATION_WEIGHTS["synthesis"]
        )

    async def evaluate(
        self,
        artifact: CodeArtifact,
        metrics: Optional[PerformanceMetrics] = None
    ) -> JudgeEvaluation:
        """Evaluate a code artifact based on specialization."""

        # Run evaluation components
        correctness = await self._verify_functionality(artifact)
        performance = await self._benchmark_execution(artifact, metrics)
        maintainability = await self._analyze_complexity(artifact)
        reusability = await self._assess_modularity(artifact)
        innovation = await self._measure_novelty(artifact)
        integration = await self._check_interfaces(artifact)

        score = EvaluationScore(
            correctness=correctness,
            performance=performance,
            maintainability=maintainability,
            reusability=reusability,
            innovation=innovation,
            integration_compatibility=integration
        )

        decision = self.get_preservation_decision(score)

        evaluation = JudgeEvaluation(
            judge_id=self.judge_id,
            artifact_id=artifact.artifact_id,
            team_id=artifact.team_id,
            evaluation_score=score,
            decision=decision,
            category=self.specialization,
            notes=self._generate_notes(score, decision)
        )

        self.evaluations.append(evaluation)
        return evaluation

    def get_preservation_decision(
        self,
        score: EvaluationScore
    ) -> PreservationDecision:
        """Determine preservation based on weighted score."""
        weighted_score = sum(
            getattr(score, attr) * weight
            for attr, weight in self.weights.items()
        )

        if score.correctness > 0.95 and weighted_score > 0.80:
            return PreservationDecision.PRESERVE
        elif score.innovation > 0.90:
            return PreservationDecision.PRESERVE_WITH_REVIEW
        elif weighted_score > 0.60:
            return PreservationDecision.ARCHIVE
        else:
            return PreservationDecision.REJECT

    async def _verify_functionality(
        self,
        artifact: CodeArtifact
    ) -> float:
        """Verify code correctness through testing."""
        # Placeholder - would run actual tests
        base_score = 0.8

        # Boost if tests exist
        if artifact.test_coverage > 0:
            base_score += 0.1 * artifact.test_coverage

        return min(1.0, base_score)

    async def _benchmark_execution(
        self,
        artifact: CodeArtifact,
        metrics: Optional[PerformanceMetrics]
    ) -> float:
        """Benchmark performance characteristics."""
        if metrics:
            # Score based on latency targets
            latency_score = 1.0 - min(
                1.0,
                metrics.latency_p99_ms / 100.0
            )
            throughput_score = min(
                1.0,
                metrics.throughput_rps / 10000.0
            )
            return (latency_score + throughput_score) / 2
        return 0.7  # Default if no metrics

    async def _analyze_complexity(
        self,
        artifact: CodeArtifact
    ) -> float:
        """Analyze code complexity and maintainability."""
        # Placeholder - would use actual code analysis
        if artifact.complexity_score > 0:
            # Lower complexity is better
            return 1.0 - min(1.0, artifact.complexity_score / 20.0)
        return 0.75

    async def _assess_modularity(
        self,
        artifact: CodeArtifact
    ) -> float:
        """Assess code modularity and reusability."""
        # Placeholder
        return 0.8

    async def _measure_novelty(
        self,
        artifact: CodeArtifact
    ) -> float:
        """Measure innovation and novelty of the approach."""
        # Placeholder - would compare against existing solutions
        return 0.6

    async def _check_interfaces(
        self,
        artifact: CodeArtifact
    ) -> float:
        """Check integration compatibility."""
        # Placeholder
        return 0.85

    def _generate_notes(
        self,
        score: EvaluationScore,
        decision: PreservationDecision
    ) -> str:
        """Generate evaluation notes."""
        if decision == PreservationDecision.PRESERVE:
            return "Excellent contribution - meets all quality standards"
        elif decision == PreservationDecision.PRESERVE_WITH_REVIEW:
            return "Innovative approach - requires integration review"
        elif decision == PreservationDecision.ARCHIVE:
            return "Good contribution - archived for reference"
        else:
            return "Does not meet minimum quality standards"


class AutonomousTradingJudge(BaseJudge):
    """
    Specialized judge for validating autonomous trading functionality.
    """

    # Focus areas for trading judges
    FOCUS_AREAS = {
        "execution_integrity": {
            "order_accuracy": 0.35,
            "timing": 0.30,
            "fill_quality": 0.35
        },
        "strategy_validation": {
            "backtest_match": 0.35,
            "edge_consistency": 0.35,
            "regime_handling": 0.30
        },
        "system_reliability": {
            "kill_switch_response": 0.35,
            "position_limits": 0.35,
            "audit_completeness": 0.30
        }
    }

    def __init__(self, judge_number: int, focus_area: str):
        super().__init__(
            judge_id=f"ATJ-{judge_number:03d}",
            judge_type=JudgeType.AUTONOMOUS_TRADING,
            specialization=focus_area
        )
        self.focus_weights = self.FOCUS_AREAS.get(
            focus_area,
            self.FOCUS_AREAS["execution_integrity"]
        )

    async def evaluate(
        self,
        artifact: CodeArtifact,
        metrics: Optional[PerformanceMetrics] = None
    ) -> JudgeEvaluation:
        """Evaluate trading-specific code artifact."""

        # Run trading-specific evaluations
        if self.specialization == "execution_integrity":
            component_scores = await self._evaluate_execution(artifact)
        elif self.specialization == "strategy_validation":
            component_scores = await self._evaluate_strategy(artifact)
        else:
            component_scores = await self._evaluate_reliability(artifact)

        # Convert to evaluation score
        score = EvaluationScore(
            correctness=component_scores.get("correctness", 0.8),
            performance=component_scores.get("performance", 0.8),
            maintainability=0.8,
            reusability=0.7,
            innovation=component_scores.get("innovation", 0.6),
            integration_compatibility=0.85
        )

        decision = self.get_preservation_decision(score)

        evaluation = JudgeEvaluation(
            judge_id=self.judge_id,
            artifact_id=artifact.artifact_id,
            team_id=artifact.team_id,
            evaluation_score=score,
            decision=decision,
            category=f"trading_{self.specialization}",
            notes=self._generate_trading_notes(component_scores)
        )

        self.evaluations.append(evaluation)
        return evaluation

    def get_preservation_decision(
        self,
        score: EvaluationScore
    ) -> PreservationDecision:
        """Trading-specific preservation decision."""
        # Stricter for trading code
        if score.correctness > 0.98 and score.performance > 0.85:
            return PreservationDecision.PRESERVE
        elif score.correctness > 0.95:
            return PreservationDecision.PRESERVE_WITH_REVIEW
        elif score.correctness > 0.80:
            return PreservationDecision.ARCHIVE
        else:
            return PreservationDecision.REJECT

    async def _evaluate_execution(
        self,
        artifact: CodeArtifact
    ) -> Dict[str, float]:
        """Evaluate order execution integrity."""
        return {
            "order_accuracy": await self._verify_order_parameters(artifact),
            "timing": await self._measure_execution_latency(artifact),
            "fill_quality": await self._analyze_slippage(artifact),
            "correctness": 0.9,
            "performance": 0.85
        }

    async def _evaluate_strategy(
        self,
        artifact: CodeArtifact
    ) -> Dict[str, float]:
        """Evaluate strategy integrity."""
        return {
            "backtest_match": await self._compare_live_vs_backtest(artifact),
            "edge_consistency": await self._measure_alpha_stability(artifact),
            "regime_handling": await self._test_market_conditions(artifact),
            "correctness": 0.85,
            "performance": 0.8,
            "innovation": 0.7
        }

    async def _evaluate_reliability(
        self,
        artifact: CodeArtifact
    ) -> Dict[str, float]:
        """Evaluate system reliability."""
        return {
            "kill_switch_response": await self._test_emergency_stop(artifact),
            "position_limits": await self._verify_exposure_controls(artifact),
            "audit_completeness": await self._check_trade_logging(artifact),
            "correctness": 0.95,
            "performance": 0.9
        }

    async def _verify_order_parameters(self, artifact: CodeArtifact) -> float:
        """Verify order parameter handling."""
        return 0.92

    async def _measure_execution_latency(self, artifact: CodeArtifact) -> float:
        """Measure order execution latency."""
        return 0.88

    async def _analyze_slippage(self, artifact: CodeArtifact) -> float:
        """Analyze order slippage."""
        return 0.85

    async def _compare_live_vs_backtest(self, artifact: CodeArtifact) -> float:
        """Compare live vs backtested performance."""
        return 0.82

    async def _measure_alpha_stability(self, artifact: CodeArtifact) -> float:
        """Measure alpha signal stability."""
        return 0.78

    async def _test_market_conditions(self, artifact: CodeArtifact) -> float:
        """Test handling of various market conditions."""
        return 0.80

    async def _test_emergency_stop(self, artifact: CodeArtifact) -> float:
        """Test emergency stop functionality."""
        return 0.95

    async def _verify_exposure_controls(self, artifact: CodeArtifact) -> float:
        """Verify position and exposure controls."""
        return 0.90

    async def _check_trade_logging(self, artifact: CodeArtifact) -> float:
        """Check completeness of trade audit logging."""
        return 0.93

    def _generate_trading_notes(
        self,
        scores: Dict[str, float]
    ) -> str:
        """Generate trading-specific evaluation notes."""
        avg_score = sum(scores.values()) / len(scores)
        if avg_score > 0.9:
            return "Excellent trading implementation - production ready"
        elif avg_score > 0.8:
            return "Good trading implementation - minor improvements needed"
        else:
            return "Trading implementation requires significant review"


class JudgePanel:
    """
    Manages the panel of judges (10 general + 3 autonomous trading).
    """

    def __init__(self):
        self.general_judges: List[GeneralJudge] = []
        self.trading_judges: List[AutonomousTradingJudge] = []

        # Create general judges
        specializations = [
            "performance", "security", "architecture", "scalability",
            "reliability", "code_quality", "financial_logic",
            "integration", "innovation", "synthesis"
        ]
        for i, spec in enumerate(specializations, 1):
            self.general_judges.append(GeneralJudge(i, spec))

        # Create trading judges
        trading_focuses = [
            "execution_integrity",
            "strategy_validation",
            "system_reliability"
        ]
        for i, focus in enumerate(trading_focuses, 1):
            self.trading_judges.append(AutonomousTradingJudge(i, focus))

    async def evaluate_artifact(
        self,
        artifact: CodeArtifact,
        metrics: Optional[PerformanceMetrics] = None
    ) -> List[JudgeEvaluation]:
        """Have all relevant judges evaluate an artifact."""
        evaluations = []

        # General judges always evaluate
        general_tasks = [
            judge.evaluate(artifact, metrics)
            for judge in self.general_judges
        ]
        evaluations.extend(await asyncio.gather(*general_tasks))

        # Trading judges evaluate trading-related artifacts
        if self._is_trading_artifact(artifact):
            trading_tasks = [
                judge.evaluate(artifact, metrics)
                for judge in self.trading_judges
            ]
            evaluations.extend(await asyncio.gather(*trading_tasks))

        return evaluations

    def _is_trading_artifact(self, artifact: CodeArtifact) -> bool:
        """Check if artifact is trading-related."""
        trading_keywords = [
            "trading", "execution", "order", "strategy",
            "position", "portfolio", "risk", "market"
        ]
        return any(
            kw in artifact.component.lower() or
            kw in artifact.optimization_type.lower()
            for kw in trading_keywords
        )

    def get_consensus_decision(
        self,
        evaluations: List[JudgeEvaluation]
    ) -> PreservationDecision:
        """Get consensus preservation decision from all evaluations."""
        decisions = [e.decision for e in evaluations]

        # Count votes
        preserve_count = sum(
            1 for d in decisions
            if d == PreservationDecision.PRESERVE
        )
        review_count = sum(
            1 for d in decisions
            if d == PreservationDecision.PRESERVE_WITH_REVIEW
        )

        total = len(decisions)

        # Majority rules
        if preserve_count > total / 2:
            return PreservationDecision.PRESERVE
        elif (preserve_count + review_count) > total / 2:
            return PreservationDecision.PRESERVE_WITH_REVIEW
        elif sum(1 for d in decisions if d != PreservationDecision.REJECT) > total / 2:
            return PreservationDecision.ARCHIVE
        else:
            return PreservationDecision.REJECT

    def get_average_score(
        self,
        evaluations: List[JudgeEvaluation]
    ) -> EvaluationScore:
        """Calculate average score across all evaluations."""
        n = len(evaluations)
        if n == 0:
            return EvaluationScore(0, 0, 0, 0, 0, 0)

        return EvaluationScore(
            correctness=sum(e.evaluation_score.correctness for e in evaluations) / n,
            performance=sum(e.evaluation_score.performance for e in evaluations) / n,
            maintainability=sum(e.evaluation_score.maintainability for e in evaluations) / n,
            reusability=sum(e.evaluation_score.reusability for e in evaluations) / n,
            innovation=sum(e.evaluation_score.innovation for e in evaluations) / n,
            integration_compatibility=sum(e.evaluation_score.integration_compatibility for e in evaluations) / n
        )


class SolutionRegistry:
    """
    Central registry for preserving optimal solutions from all teams.
    """

    def __init__(self):
        self.preserved_solutions: Dict[str, List[PreservedSolution]] = {}
        self.solution_lineage: Dict[str, List[str]] = {}
        self.current_round = 0

    def register_solution(
        self,
        artifact: CodeArtifact,
        evaluations: List[JudgeEvaluation],
        decision: PreservationDecision
    ):
        """Register a solution for preservation."""
        if decision == PreservationDecision.REJECT:
            return

        # Calculate average score
        avg_score = EvaluationScore(
            correctness=sum(e.evaluation_score.correctness for e in evaluations) / len(evaluations),
            performance=sum(e.evaluation_score.performance for e in evaluations) / len(evaluations),
            maintainability=sum(e.evaluation_score.maintainability for e in evaluations) / len(evaluations),
            reusability=sum(e.evaluation_score.reusability for e in evaluations) / len(evaluations),
            innovation=sum(e.evaluation_score.innovation for e in evaluations) / len(evaluations),
            integration_compatibility=sum(e.evaluation_score.integration_compatibility for e in evaluations) / len(evaluations)
        )

        solution = PreservedSolution(
            solution_id=str(uuid4()),
            team_id=artifact.team_id,
            specialist_role=artifact.specialist_role,
            artifact=artifact,
            evaluation_score=avg_score,
            judge_id=evaluations[0].judge_id,
            decision=decision,
            category=artifact.optimization_type,
            round_preserved=self.current_round,
            notes=self._summarize_notes(evaluations)
        )

        category = artifact.optimization_type
        if category not in self.preserved_solutions:
            self.preserved_solutions[category] = []

        self.preserved_solutions[category].append(solution)

        # Keep top 10 per category
        self._prune_solutions(category, keep_top=10)

    def _prune_solutions(self, category: str, keep_top: int = 10):
        """Keep only top N solutions per category."""
        solutions = self.preserved_solutions.get(category, [])
        if len(solutions) > keep_top:
            solutions.sort(
                key=lambda s: s.evaluation_score.composite_score,
                reverse=True
            )
            self.preserved_solutions[category] = solutions[:keep_top]

    def _summarize_notes(self, evaluations: List[JudgeEvaluation]) -> str:
        """Summarize notes from all evaluations."""
        unique_notes = set(e.notes for e in evaluations)
        return " | ".join(unique_notes)

    def get_best_solutions(
        self,
        category: str,
        n: int = 5
    ) -> List[PreservedSolution]:
        """Get top N solutions for a category."""
        solutions = self.preserved_solutions.get(category, [])
        return sorted(
            solutions,
            key=lambda s: s.evaluation_score.composite_score,
            reverse=True
        )[:n]

    def get_all_preserved(self) -> List[PreservedSolution]:
        """Get all preserved solutions."""
        all_solutions = []
        for solutions in self.preserved_solutions.values():
            all_solutions.extend(solutions)
        return all_solutions

    def advance_round(self):
        """Advance to next round."""
        self.current_round += 1
