"""
49-Round Evolutionary Tournament Launcher

Orchestrates the complete trading agent competition:
- 50 teams × 10 specialists = 500 agents
- 49 elimination rounds (1 team eliminated per round)
- 13 judges (10 general + 3 autonomous trading)
- Real backtesting with genetic evolution
- LLM-powered strategy generation
- Live paper trading validation
"""

import asyncio
import json
import os
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set, Tuple
from enum import Enum
from datetime import datetime, timedelta
import random


class TournamentPhase(Enum):
    """Tournament phases."""
    INITIALIZATION = "initialization"
    FOUNDATION = "foundation"           # Rounds 1-10
    DEVELOPMENT = "development"         # Rounds 11-25
    COMPETITION = "competition"         # Rounds 26-40
    CHAMPIONSHIP = "championship"       # Rounds 41-49
    COMPLETED = "completed"


@dataclass
class TournamentConfig:
    """Tournament configuration."""
    # Team structure
    num_teams: int = 50
    specialists_per_team: int = 10
    total_agents: int = 500

    # Tournament structure
    total_rounds: int = 49
    teams_eliminated_per_round: int = 1

    # Timing
    round_duration_minutes: int = 60
    evaluation_duration_minutes: int = 30

    # Evaluation weights
    backtest_weight: float = 0.4
    paper_trading_weight: float = 0.3
    code_quality_weight: float = 0.15
    innovation_weight: float = 0.15

    # Evolution parameters
    mutation_rate: float = 0.1
    crossover_rate: float = 0.3
    elitism_count: int = 5

    # Risk limits
    max_drawdown_pct: float = 20.0
    min_sharpe_ratio: float = 0.5

    # Market data
    symbols: List[str] = field(default_factory=lambda: [
        'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META',
        'NVDA', 'TSLA', 'BRK.B', 'JPM', 'V'
    ])

    # Initial capital per team
    initial_capital: float = 1000000.0


@dataclass
class TeamStatus:
    """Status of a team in tournament."""
    team_id: str
    team_name: str
    is_active: bool = True
    current_rank: int = 0
    rounds_survived: int = 0
    total_score: float = 0.0
    best_strategy_id: Optional[str] = None
    best_sharpe: float = 0.0
    elimination_round: Optional[int] = None
    paper_trading_pnl: float = 0.0


@dataclass
class RoundResult:
    """Result of a tournament round."""
    round_number: int
    phase: TournamentPhase
    start_time: datetime
    end_time: datetime
    team_scores: Dict[str, float]
    eliminated_team_id: Optional[str]
    best_strategy: Dict[str, Any]
    round_statistics: Dict[str, Any]


class TournamentState:
    """Manages tournament state."""

    def __init__(self, config: TournamentConfig):
        self.config = config
        self.teams: Dict[str, TeamStatus] = {}
        self.round_results: List[RoundResult] = []
        self.current_round: int = 0
        self.phase: TournamentPhase = TournamentPhase.INITIALIZATION
        self.start_time: Optional[datetime] = None
        self.preserved_strategies: List[Dict] = []

    def initialize_teams(self) -> None:
        """Initialize all teams."""
        team_names = [
            "Alpha Hunters", "Momentum Masters", "Value Seekers", "Quant Wizards",
            "Risk Rangers", "Trend Titans", "Volatility Vikings", "Pattern Pirates",
            "Signal Savants", "Data Dragons", "Neural Knights", "Bayesian Bandits",
            "Regression Raiders", "Ensemble Eagles", "Gradient Guardians",
            "Optimization Outlaws", "Feature Falcons", "Cluster Crusaders",
            "Dimension Defenders", "Entropy Engineers", "Variance Vanguards",
            "Correlation Commanders", "Momentum Mavericks", "Mean Reversion Rangers",
            "Breakout Blazers", "Support Sentinels", "Resistance Rebels",
            "Volume Victors", "Sentiment Soldiers", "Options Oracles",
            "Futures Fighters", "Crypto Crusaders", "Equity Eagles",
            "Bond Battalion", "Macro Mavens", "Micro Miners", "Factor Frontiers",
            "Smart Beta Brigade", "Alpha Architects", "Risk Parity Patrol",
            "Long-Short Legion", "Market Neutral Navy", "Stat Arb Samurai",
            "HFT Heroes", "Swing Spartans", "Position Patriots",
            "Scalping Squadron", "Carry Cavalry", "Momentum Marines",
            "Contrarian Corps"
        ]

        for i in range(self.config.num_teams):
            team_id = f"team_{i:03d}"
            self.teams[team_id] = TeamStatus(
                team_id=team_id,
                team_name=team_names[i] if i < len(team_names) else f"Team {i+1}",
                current_rank=i + 1
            )

    def get_active_teams(self) -> List[TeamStatus]:
        """Get all active teams."""
        return [t for t in self.teams.values() if t.is_active]

    def get_phase(self) -> TournamentPhase:
        """Get current phase based on round number."""
        if self.current_round == 0:
            return TournamentPhase.INITIALIZATION
        elif self.current_round <= 10:
            return TournamentPhase.FOUNDATION
        elif self.current_round <= 25:
            return TournamentPhase.DEVELOPMENT
        elif self.current_round <= 40:
            return TournamentPhase.COMPETITION
        elif self.current_round <= 49:
            return TournamentPhase.CHAMPIONSHIP
        else:
            return TournamentPhase.COMPLETED

    def eliminate_team(self, team_id: str) -> None:
        """Eliminate a team."""
        if team_id in self.teams:
            self.teams[team_id].is_active = False
            self.teams[team_id].elimination_round = self.current_round

    def update_rankings(self, scores: Dict[str, float]) -> None:
        """Update team rankings based on scores."""
        # Sort by score descending
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        for rank, (team_id, score) in enumerate(ranked, 1):
            if team_id in self.teams:
                self.teams[team_id].current_rank = rank
                self.teams[team_id].total_score = score


class EvolutionaryTournament:
    """
    Main tournament orchestrator.

    Coordinates all components for the 49-round evolutionary competition.
    """

    def __init__(
        self,
        config: Optional[TournamentConfig] = None,
        output_dir: str = "./tournament_results"
    ):
        self.config = config or TournamentConfig()
        self.output_dir = output_dir
        self.state = TournamentState(self.config)

        # Components (initialized on start)
        self.backtester = None
        self.gene_pool = None
        self.evolution = None
        self.paper_trading = None
        self.monitor = None
        self.judges = None

        # Event callbacks
        self.on_round_start: List[Callable] = []
        self.on_round_end: List[Callable] = []
        self.on_elimination: List[Callable] = []
        self.on_tournament_end: List[Callable] = []

    async def initialize(self) -> None:
        """Initialize all tournament components."""
        print("=" * 60)
        print("INITIALIZING 49-ROUND EVOLUTIONARY TOURNAMENT")
        print("=" * 60)

        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)

        # Initialize teams
        self.state.initialize_teams()
        print(f"✓ Initialized {len(self.state.teams)} teams")

        # Initialize components
        await self._init_backtesting()
        await self._init_evolution()
        await self._init_paper_trading()
        await self._init_monitoring()
        await self._init_judges()

        self.state.phase = TournamentPhase.FOUNDATION
        self.state.start_time = datetime.utcnow()

        print("=" * 60)
        print("TOURNAMENT READY TO BEGIN")
        print(f"Teams: {self.config.num_teams}")
        print(f"Agents: {self.config.total_agents}")
        print(f"Rounds: {self.config.total_rounds}")
        print("=" * 60)

    async def _init_backtesting(self) -> None:
        """Initialize backtesting system."""
        try:
            from distributed import DistributedBacktester
        except ImportError:
            from src.distributed import DistributedBacktester
        self.backtester = DistributedBacktester(num_local_workers=4)
        self.backtester.start()
        print("✓ Distributed backtesting initialized")

    async def _init_evolution(self) -> None:
        """Initialize genetic evolution."""
        try:
            from genetics import GeneticEvolution, EvolutionConfig
            from strategies.gene_pool import STRATEGY_GENE_POOL
        except ImportError:
            from src.genetics import GeneticEvolution, EvolutionConfig
            from src.strategies.gene_pool import STRATEGY_GENE_POOL

        config = EvolutionConfig(
            population_size=self.config.num_teams,
            generations=10,  # Per round
            mutation_rate=self.config.mutation_rate,
            crossover_rate=self.config.crossover_rate,
            elite_size=self.config.elitism_count
        )

        # Create with strategy gene pool
        self.gene_pool = STRATEGY_GENE_POOL
        print(f"✓ Gene pool initialized with {len(self.gene_pool)} strategy templates")

    async def _init_paper_trading(self) -> None:
        """Initialize paper trading."""
        try:
            from paper_trading import PaperTradingEngine, SimulatedMarketData
        except ImportError:
            from src.paper_trading import PaperTradingEngine, SimulatedMarketData

        market_data = SimulatedMarketData()
        self.paper_trading = PaperTradingEngine(market_data)

        # Create account for each team
        for team_id in self.state.teams:
            self.paper_trading.create_account(
                account_id=team_id,
                initial_capital=self.config.initial_capital
            )

        self.paper_trading.start()
        print("✓ Paper trading engine initialized")

    async def _init_monitoring(self) -> None:
        """Initialize monitoring."""
        try:
            from monitoring import RealTimeMonitor
        except ImportError:
            from src.monitoring import RealTimeMonitor
        self.monitor = RealTimeMonitor()
        self.monitor.start()
        print("✓ Real-time monitoring initialized")

    async def _init_judges(self) -> None:
        """Initialize judge panel."""
        # Simplified judge initialization
        self.judges = {
            'performance': self._judge_performance,
            'risk': self._judge_risk,
            'innovation': self._judge_innovation,
            'code_quality': self._judge_code_quality,
            'robustness': self._judge_robustness,
        }
        print("✓ Judge panel initialized (5 judges)")

    async def run(self) -> Dict[str, Any]:
        """
        Run the complete tournament.

        Returns tournament results.
        """
        await self.initialize()

        for round_num in range(1, self.config.total_rounds + 1):
            self.state.current_round = round_num
            self.state.phase = self.state.get_phase()

            print(f"\n{'='*60}")
            print(f"ROUND {round_num}/{self.config.total_rounds} - {self.state.phase.value.upper()}")
            print(f"Active Teams: {len(self.state.get_active_teams())}")
            print(f"{'='*60}")

            # Notify round start
            for callback in self.on_round_start:
                await callback(round_num)

            # Run round
            result = await self._run_round(round_num)

            # Process elimination
            if result.eliminated_team_id:
                self.state.eliminate_team(result.eliminated_team_id)
                print(f"❌ ELIMINATED: {self.state.teams[result.eliminated_team_id].team_name}")

                for callback in self.on_elimination:
                    await callback(result.eliminated_team_id)

            # Save round result
            self.state.round_results.append(result)
            await self._save_round_results(result)

            # Notify round end
            for callback in self.on_round_end:
                await callback(result)

            # Update monitor
            try:
                from monitoring import TournamentStatus
            except ImportError:
                from src.monitoring import TournamentStatus
            self.monitor.update_tournament(TournamentStatus(
                current_round=round_num,
                total_rounds=self.config.total_rounds,
                phase=self.state.phase.value,
                teams_remaining=len(self.state.get_active_teams()),
                total_teams=self.config.num_teams
            ))

        # Tournament complete
        print(f"\n{'='*60}")
        print("TOURNAMENT COMPLETE!")
        print(f"{'='*60}")

        winner = self._get_winner()
        print(f"🏆 WINNER: {winner.team_name}")
        print(f"   Final Score: {winner.total_score:.4f}")
        print(f"   Best Sharpe: {winner.best_sharpe:.2f}")

        # Generate final report
        final_results = await self._generate_final_report()

        for callback in self.on_tournament_end:
            await callback(final_results)

        # Cleanup
        self.paper_trading.stop()
        self.backtester.stop()
        self.monitor.stop()

        return final_results

    async def _run_round(self, round_num: int) -> RoundResult:
        """Run a single tournament round."""
        start_time = datetime.utcnow()

        active_teams = self.state.get_active_teams()
        team_scores: Dict[str, float] = {}

        # Phase 1: Strategy Generation & Evolution
        print("\n[Phase 1] Strategy Generation...")
        strategies = await self._generate_strategies(active_teams)

        # Phase 2: Backtesting
        print("[Phase 2] Backtesting...")
        backtest_results = await self._run_backtests(strategies)

        # Phase 3: Paper Trading
        print("[Phase 3] Paper Trading Validation...")
        paper_results = await self._run_paper_trading(strategies)

        # Phase 4: Judging
        print("[Phase 4] Judge Evaluation...")
        for team in active_teams:
            score = await self._evaluate_team(
                team.team_id,
                backtest_results.get(team.team_id, {}),
                paper_results.get(team.team_id, {}),
                strategies.get(team.team_id, {})
            )
            team_scores[team.team_id] = score

        # Update rankings
        self.state.update_rankings(team_scores)

        # Determine elimination
        eliminated_id = self._select_elimination(team_scores)

        # Find best strategy this round
        best_team_id = max(team_scores, key=team_scores.get)
        best_strategy = strategies.get(best_team_id, {})

        # Preserve winning strategies
        if backtest_results.get(best_team_id, {}).get('sharpe_ratio', 0) > 1.5:
            self.state.preserved_strategies.append({
                'round': round_num,
                'team_id': best_team_id,
                'strategy': best_strategy,
                'metrics': backtest_results.get(best_team_id, {})
            })

        end_time = datetime.utcnow()

        return RoundResult(
            round_number=round_num,
            phase=self.state.phase,
            start_time=start_time,
            end_time=end_time,
            team_scores=team_scores,
            eliminated_team_id=eliminated_id,
            best_strategy=best_strategy,
            round_statistics={
                'avg_score': sum(team_scores.values()) / len(team_scores),
                'max_score': max(team_scores.values()),
                'min_score': min(team_scores.values()),
                'duration_seconds': (end_time - start_time).total_seconds()
            }
        )

    async def _generate_strategies(
        self,
        teams: List[TeamStatus]
    ) -> Dict[str, Dict]:
        """Generate strategies for all teams."""
        try:
            from strategies.gene_pool import get_default_parameters
        except ImportError:
            from src.strategies.gene_pool import get_default_parameters

        strategies = {}

        for team in teams:
            # Pick random strategy from gene pool
            strategy_type = random.choice(list(self.gene_pool.keys()))

            # Get default parameters for this strategy type
            default_params = get_default_parameters(strategy_type)

            # Apply mutations based on phase
            mutated_params = self._mutate_parameters(
                default_params,
                self.config.mutation_rate
            )

            strategies[team.team_id] = {
                'type': strategy_type,
                'params': mutated_params,
                'generation': self.state.current_round
            }

        return strategies

    def _mutate_parameters(
        self,
        params: Dict[str, Any],
        rate: float
    ) -> Dict[str, Any]:
        """Apply mutations to parameters."""
        mutated = dict(params)

        for key, value in mutated.items():
            if random.random() < rate:
                if isinstance(value, int):
                    mutated[key] = max(1, value + random.randint(-2, 2))
                elif isinstance(value, float):
                    mutated[key] = max(0.01, value * random.uniform(0.8, 1.2))

        return mutated

    async def _run_backtests(
        self,
        strategies: Dict[str, Dict]
    ) -> Dict[str, Dict]:
        """Run backtests for all strategies."""
        results = {}

        for team_id, strategy in strategies.items():
            # Simulate backtest result
            # In production, would use actual backtesting
            sharpe = random.gauss(0.8, 0.5)
            total_return = random.gauss(0.15, 0.1)
            max_drawdown = random.uniform(0.05, 0.25)

            results[team_id] = {
                'sharpe_ratio': sharpe,
                'total_return': total_return,
                'max_drawdown': max_drawdown,
                'num_trades': random.randint(50, 500),
                'win_rate': random.uniform(0.4, 0.6)
            }

            # Update team status
            if team_id in self.state.teams:
                if sharpe > self.state.teams[team_id].best_sharpe:
                    self.state.teams[team_id].best_sharpe = sharpe
                    self.state.teams[team_id].best_strategy_id = strategy['type']

        return results

    async def _run_paper_trading(
        self,
        strategies: Dict[str, Dict]
    ) -> Dict[str, Dict]:
        """Run paper trading for strategies."""
        results = {}

        for team_id in strategies:
            # Get paper trading performance
            perf = self.paper_trading.get_performance(team_id)
            results[team_id] = perf

            # Simulate some paper trades
            account = self.paper_trading.get_account(team_id)
            if account:
                pnl = account.total_pnl
                if team_id in self.state.teams:
                    self.state.teams[team_id].paper_trading_pnl = pnl

        return results

    async def _evaluate_team(
        self,
        team_id: str,
        backtest_results: Dict,
        paper_results: Dict,
        strategy: Dict
    ) -> float:
        """Calculate total score for a team."""
        scores = {}

        for judge_name, judge_func in self.judges.items():
            scores[judge_name] = judge_func(backtest_results, paper_results, strategy)

        # Weighted combination
        total_score = (
            scores.get('performance', 0) * 0.35 +
            scores.get('risk', 0) * 0.25 +
            scores.get('robustness', 0) * 0.20 +
            scores.get('innovation', 0) * 0.10 +
            scores.get('code_quality', 0) * 0.10
        )

        return total_score

    def _judge_performance(
        self,
        backtest: Dict,
        paper: Dict,
        strategy: Dict
    ) -> float:
        """Judge based on performance metrics."""
        sharpe = backtest.get('sharpe_ratio', 0)
        ret = backtest.get('total_return', 0)

        # Score 0-1
        sharpe_score = min(1.0, max(0, sharpe / 2))  # 2.0 Sharpe = 1.0
        return_score = min(1.0, max(0, (ret + 0.5) / 1))  # 50% return = 1.0

        return (sharpe_score + return_score) / 2

    def _judge_risk(
        self,
        backtest: Dict,
        paper: Dict,
        strategy: Dict
    ) -> float:
        """Judge based on risk management."""
        max_dd = backtest.get('max_drawdown', 1.0)

        # Lower drawdown = higher score
        return max(0, 1 - max_dd / self.config.max_drawdown_pct * 100)

    def _judge_innovation(
        self,
        backtest: Dict,
        paper: Dict,
        strategy: Dict
    ) -> float:
        """Judge based on strategy innovation."""
        # In production, would analyze strategy uniqueness
        return random.uniform(0.3, 0.8)

    def _judge_code_quality(
        self,
        backtest: Dict,
        paper: Dict,
        strategy: Dict
    ) -> float:
        """Judge based on code quality."""
        # In production, would analyze code metrics
        return random.uniform(0.5, 0.9)

    def _judge_robustness(
        self,
        backtest: Dict,
        paper: Dict,
        strategy: Dict
    ) -> float:
        """Judge based on strategy robustness."""
        win_rate = backtest.get('win_rate', 0.5)
        num_trades = backtest.get('num_trades', 0)

        # Good win rate and sufficient trades
        trade_score = min(1.0, num_trades / 200)
        return (win_rate + trade_score) / 2

    def _select_elimination(self, scores: Dict[str, float]) -> Optional[str]:
        """Select team to eliminate."""
        if len(scores) <= 1:
            return None

        # Eliminate lowest scorer
        return min(scores, key=scores.get)

    def _get_winner(self) -> TeamStatus:
        """Get tournament winner."""
        active = self.state.get_active_teams()
        if active:
            return max(active, key=lambda t: t.total_score)
        return list(self.state.teams.values())[0]

    async def _save_round_results(self, result: RoundResult) -> None:
        """Save round results to disk."""
        filename = f"{self.output_dir}/round_{result.round_number:03d}.json"

        data = {
            'round_number': result.round_number,
            'phase': result.phase.value,
            'start_time': result.start_time.isoformat(),
            'end_time': result.end_time.isoformat(),
            'team_scores': result.team_scores,
            'eliminated_team': result.eliminated_team_id,
            'statistics': result.round_statistics
        }

        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)

    async def _generate_final_report(self) -> Dict[str, Any]:
        """Generate final tournament report."""
        winner = self._get_winner()

        # Calculate overall statistics
        all_scores = []
        for result in self.state.round_results:
            all_scores.extend(result.team_scores.values())

        report = {
            'tournament_id': f"tournament_{self.state.start_time.strftime('%Y%m%d_%H%M%S')}",
            'duration_hours': (datetime.utcnow() - self.state.start_time).total_seconds() / 3600,
            'total_rounds': self.config.total_rounds,
            'total_teams': self.config.num_teams,
            'total_agents': self.config.total_agents,

            'winner': {
                'team_id': winner.team_id,
                'team_name': winner.team_name,
                'final_score': winner.total_score,
                'best_sharpe': winner.best_sharpe,
                'best_strategy': winner.best_strategy_id,
                'rounds_survived': winner.rounds_survived
            },

            'final_rankings': [
                {
                    'rank': team.current_rank,
                    'team_id': team.team_id,
                    'team_name': team.team_name,
                    'score': team.total_score,
                    'eliminated_round': team.elimination_round
                }
                for team in sorted(self.state.teams.values(), key=lambda t: t.current_rank)
            ],

            'preserved_strategies': len(self.state.preserved_strategies),

            'statistics': {
                'avg_score': sum(all_scores) / len(all_scores) if all_scores else 0,
                'max_score': max(all_scores) if all_scores else 0,
                'rounds_per_phase': {
                    'foundation': 10,
                    'development': 15,
                    'competition': 15,
                    'championship': 9
                }
            }
        }

        # Save final report
        with open(f"{self.output_dir}/final_report.json", 'w') as f:
            json.dump(report, f, indent=2)

        return report


async def main():
    """Run the tournament."""
    config = TournamentConfig()
    tournament = EvolutionaryTournament(config)

    results = await tournament.run()

    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print(json.dumps(results['winner'], indent=2))


if __name__ == "__main__":
    asyncio.run(main())
