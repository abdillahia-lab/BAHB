"""
Genetic Programming Framework for Strategy Evolution

This is the core of the competitive agent system. It:
1. Generates strategy populations
2. Evaluates fitness via backtesting
3. Selects top performers
4. Crossovers and mutates to create new generations
5. Preserves elite strategies
"""

import asyncio
import random
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple
from uuid import uuid4
import numpy as np
import pandas as pd

from ..strategies.base import BaseStrategy, StrategyConfig, StrategyGenome
from ..strategies.gene_pool import (
    STRATEGY_GENE_POOL,
    create_strategy,
    get_available_strategies,
    get_default_parameters,
)
from ..backtesting.engine import (
    BacktestEngine,
    BacktestConfig,
    BacktestResult,
    WalkForwardOptimizer,
    WalkForwardResult,
)


@dataclass
class Individual:
    """An individual in the genetic population."""
    individual_id: str
    strategy_type: str
    parameters: Dict[str, Any]
    genome: StrategyGenome
    generation: int
    parent_ids: List[str] = field(default_factory=list)

    # Fitness metrics (populated after evaluation)
    fitness: float = 0.0
    sharpe_ratio: float = 0.0
    total_return: float = 0.0
    max_drawdown: float = 0.0
    win_rate: float = 0.0
    profit_factor: float = 0.0

    # Walk-forward metrics
    oos_sharpe: float = 0.0
    oos_return: float = 0.0
    sharpe_degradation: float = 0.0
    return_consistency: float = 0.0

    # Full result (optional storage)
    backtest_result: Optional[BacktestResult] = None
    walkforward_result: Optional[WalkForwardResult] = None

    def to_strategy(self) -> BaseStrategy:
        """Convert individual to executable strategy."""
        return create_strategy(
            strategy_type=self.strategy_type,
            strategy_id=self.individual_id,
            parameters=self.parameters
        )


@dataclass
class GenerationResult:
    """Results from one generation of evolution."""
    generation_number: int
    population_size: int
    best_fitness: float
    avg_fitness: float
    best_individual: Individual
    top_10_individuals: List[Individual]
    eliminated_count: int
    preserved_count: int
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class EvolutionConfig:
    """Configuration for the evolutionary process."""
    population_size: int = 100
    generations: int = 50
    elite_size: int = 10  # Top N preserved unchanged
    mutation_rate: float = 0.1
    crossover_rate: float = 0.7
    tournament_size: int = 5

    # Fitness weights
    sharpe_weight: float = 0.35
    return_weight: float = 0.20
    drawdown_weight: float = 0.15
    win_rate_weight: float = 0.10
    profit_factor_weight: float = 0.10
    consistency_weight: float = 0.10  # Walk-forward consistency

    # Walk-forward settings
    use_walk_forward: bool = True
    train_months: int = 12
    test_months: int = 1


class ParameterMutator:
    """Handles parameter mutations."""

    # Parameter ranges for different strategy types
    PARAMETER_RANGES = {
        'fast_period': (2, 50),
        'slow_period': (10, 200),
        'medium_period': (5, 100),
        'entry_period': (5, 60),
        'exit_period': (3, 30),
        'rsi_period': (5, 30),
        'atr_period': (5, 30),
        'bb_period': (10, 50),
        'k_period': (5, 30),
        'd_period': (2, 10),
        'signal_period': (5, 15),
        'oversold': (10, 40),
        'overbought': (60, 90),
        'bb_std': (1.0, 3.5),
        'atr_multiplier': (1.0, 4.0),
        'threshold': (1, 15),
        'adx_threshold': (15, 40),
        'lookback': (60, 504),
        'rebalance_frequency': (5, 63),
        'required_confirmations': (2, 5),
        'af_start': (0.01, 0.05),
        'af_increment': (0.01, 0.05),
        'af_max': (0.1, 0.3),
        'squeeze_threshold': (0.02, 0.10),
        'risk_per_trade': (0.005, 0.05),
    }

    def mutate_parameters(
        self,
        parameters: Dict[str, Any],
        mutation_rate: float = 0.1
    ) -> Dict[str, Any]:
        """Mutate parameters with probability mutation_rate."""
        mutated = parameters.copy()

        for param, value in mutated.items():
            if random.random() < mutation_rate:
                mutated[param] = self._mutate_value(param, value)

        return mutated

    def _mutate_value(self, param: str, value: Any) -> Any:
        """Mutate a single parameter value."""
        if param in self.PARAMETER_RANGES:
            min_val, max_val = self.PARAMETER_RANGES[param]

            if isinstance(value, int):
                # Integer mutation: ±30% or at least ±2
                delta = max(2, int(value * 0.3))
                new_val = value + random.randint(-delta, delta)
                return max(int(min_val), min(int(max_val), new_val))

            elif isinstance(value, float):
                # Float mutation: ±30%
                delta = value * 0.3
                new_val = value + random.uniform(-delta, delta)
                return max(min_val, min(max_val, new_val))

        elif isinstance(value, bool):
            return not value

        elif isinstance(value, str):
            # For string parameters like 'ma_type'
            if param == 'ma_type':
                return random.choice(['sma', 'ema'])

        return value

    def random_parameters(self, strategy_type: str) -> Dict[str, Any]:
        """Generate random parameters for a strategy type."""
        defaults = get_default_parameters(strategy_type)
        params = {}

        for param, default_value in defaults.items():
            if param in self.PARAMETER_RANGES:
                min_val, max_val = self.PARAMETER_RANGES[param]

                if isinstance(default_value, int):
                    params[param] = random.randint(int(min_val), int(max_val))
                elif isinstance(default_value, float):
                    params[param] = random.uniform(min_val, max_val)
                else:
                    params[param] = default_value
            else:
                params[param] = default_value

        return params


class CrossoverOperator:
    """Handles genetic crossover between individuals."""

    def crossover(
        self,
        parent1: Individual,
        parent2: Individual,
        generation: int
    ) -> Individual:
        """Create offspring from two parents."""
        # If same strategy type, blend parameters
        if parent1.strategy_type == parent2.strategy_type:
            return self._same_type_crossover(parent1, parent2, generation)
        else:
            # Different types - pick one and blend some params
            return self._different_type_crossover(parent1, parent2, generation)

    def _same_type_crossover(
        self,
        p1: Individual,
        p2: Individual,
        generation: int
    ) -> Individual:
        """Crossover between same strategy types."""
        child_params = {}

        all_params = set(p1.parameters.keys()) | set(p2.parameters.keys())

        for param in all_params:
            val1 = p1.parameters.get(param)
            val2 = p2.parameters.get(param)

            if val1 is None:
                child_params[param] = val2
            elif val2 is None:
                child_params[param] = val1
            elif isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
                # Blend numeric values
                alpha = random.random()
                blended = alpha * val1 + (1 - alpha) * val2
                child_params[param] = int(blended) if isinstance(val1, int) else blended
            else:
                # Random selection for non-numeric
                child_params[param] = random.choice([val1, val2])

        genome = StrategyGenome()
        genome.genes = {
            'strategy_type': p1.strategy_type,
            'parameters': child_params
        }

        return Individual(
            individual_id=str(uuid4()),
            strategy_type=p1.strategy_type,
            parameters=child_params,
            genome=genome,
            generation=generation,
            parent_ids=[p1.individual_id, p2.individual_id]
        )

    def _different_type_crossover(
        self,
        p1: Individual,
        p2: Individual,
        generation: int
    ) -> Individual:
        """Crossover between different strategy types."""
        # Pick the fitter parent's type
        parent = p1 if p1.fitness >= p2.fitness else p2
        other = p2 if parent == p1 else p1

        # Start with parent's parameters
        child_params = parent.parameters.copy()

        # Try to incorporate shared parameters from other
        for param, value in other.parameters.items():
            if param in child_params and isinstance(value, (int, float)):
                # Blend shared numeric parameters
                alpha = random.random() * 0.3  # Bias toward fitter parent
                child_params[param] = (
                    (1 - alpha) * child_params[param] +
                    alpha * value
                )
                if isinstance(parent.parameters.get(param), int):
                    child_params[param] = int(child_params[param])

        genome = StrategyGenome()
        genome.genes = {
            'strategy_type': parent.strategy_type,
            'parameters': child_params
        }

        return Individual(
            individual_id=str(uuid4()),
            strategy_type=parent.strategy_type,
            parameters=child_params,
            genome=genome,
            generation=generation,
            parent_ids=[p1.individual_id, p2.individual_id]
        )


class SelectionOperator:
    """Handles selection for reproduction."""

    def tournament_select(
        self,
        population: List[Individual],
        tournament_size: int = 5
    ) -> Individual:
        """Tournament selection."""
        tournament = random.sample(population, min(tournament_size, len(population)))
        return max(tournament, key=lambda x: x.fitness)

    def roulette_select(
        self,
        population: List[Individual]
    ) -> Individual:
        """Roulette wheel selection."""
        total_fitness = sum(max(0.001, ind.fitness) for ind in population)
        pick = random.uniform(0, total_fitness)
        current = 0

        for ind in population:
            current += max(0.001, ind.fitness)
            if current >= pick:
                return ind

        return population[-1]

    def rank_select(
        self,
        population: List[Individual]
    ) -> Individual:
        """Rank-based selection."""
        sorted_pop = sorted(population, key=lambda x: x.fitness)
        ranks = list(range(1, len(sorted_pop) + 1))
        total_rank = sum(ranks)

        pick = random.uniform(0, total_rank)
        current = 0

        for ind, rank in zip(sorted_pop, ranks):
            current += rank
            if current >= pick:
                return ind

        return sorted_pop[-1]


class FitnessEvaluator:
    """Evaluates fitness of individuals via backtesting."""

    def __init__(
        self,
        backtest_engine: BacktestEngine,
        walkforward_optimizer: Optional[WalkForwardOptimizer] = None,
        config: EvolutionConfig = None
    ):
        self.engine = backtest_engine
        self.walkforward = walkforward_optimizer
        self.config = config or EvolutionConfig()

    async def evaluate(
        self,
        individual: Individual,
        data: Dict[str, pd.DataFrame],
        start_date: datetime,
        end_date: datetime,
        use_walkforward: bool = True
    ) -> Individual:
        """Evaluate an individual's fitness."""
        strategy = individual.to_strategy()

        if use_walkforward and self.walkforward:
            # Walk-forward evaluation (more robust)
            wf_result = await self.walkforward.run(
                strategy,
                data,
                start_date,
                end_date
            )

            individual.walkforward_result = wf_result
            individual.oos_sharpe = wf_result.oos_sharpe_ratio
            individual.oos_return = wf_result.oos_total_return
            individual.sharpe_degradation = wf_result.sharpe_degradation
            individual.return_consistency = wf_result.return_consistency

            # Use OOS metrics for primary fitness
            individual.sharpe_ratio = wf_result.oos_sharpe_ratio
            individual.total_return = wf_result.oos_total_return
            individual.max_drawdown = wf_result.oos_max_drawdown
            individual.win_rate = wf_result.oos_win_rate
            individual.profit_factor = wf_result.oos_profit_factor

        else:
            # Simple backtest
            result = await self.engine.run(strategy, data, start_date, end_date)

            individual.backtest_result = result
            individual.sharpe_ratio = result.sharpe_ratio
            individual.total_return = result.total_return
            individual.max_drawdown = result.max_drawdown
            individual.win_rate = result.win_rate
            individual.profit_factor = result.profit_factor

        # Calculate composite fitness
        individual.fitness = self._calculate_fitness(individual)

        return individual

    def _calculate_fitness(self, ind: Individual) -> float:
        """Calculate weighted fitness score."""
        # Normalize metrics to 0-1 scale
        sharpe_norm = max(0, min(1, (ind.sharpe_ratio + 1) / 4))  # Sharpe -1 to 3 -> 0 to 1
        return_norm = max(0, min(1, (ind.total_return + 0.5) / 2))  # Return -50% to 150% -> 0 to 1
        dd_norm = max(0, 1 - ind.max_drawdown)  # Lower DD is better
        win_norm = ind.win_rate
        pf_norm = max(0, min(1, (ind.profit_factor - 0.5) / 2.5))  # PF 0.5 to 3 -> 0 to 1
        consistency_norm = ind.return_consistency

        # Penalty for Sharpe degradation (overfitting indicator)
        overfit_penalty = max(0, ind.sharpe_degradation) * 0.2

        fitness = (
            self.config.sharpe_weight * sharpe_norm +
            self.config.return_weight * return_norm +
            self.config.drawdown_weight * dd_norm +
            self.config.win_rate_weight * win_norm +
            self.config.profit_factor_weight * pf_norm +
            self.config.consistency_weight * consistency_norm -
            overfit_penalty
        )

        return max(0, fitness)

    async def evaluate_population(
        self,
        population: List[Individual],
        data: Dict[str, pd.DataFrame],
        start_date: datetime,
        end_date: datetime,
        use_walkforward: bool = True,
        max_concurrent: int = 10
    ) -> List[Individual]:
        """Evaluate entire population with concurrency limit."""
        semaphore = asyncio.Semaphore(max_concurrent)

        async def eval_with_limit(ind: Individual) -> Individual:
            async with semaphore:
                return await self.evaluate(ind, data, start_date, end_date, use_walkforward)

        tasks = [eval_with_limit(ind) for ind in population]
        return await asyncio.gather(*tasks)


class GeneticEvolution:
    """
    Main genetic evolution engine.

    Orchestrates the evolutionary process:
    1. Initialize population
    2. Evaluate fitness
    3. Select parents
    4. Crossover and mutation
    5. Create new generation
    6. Repeat
    """

    def __init__(
        self,
        config: EvolutionConfig,
        backtest_config: BacktestConfig,
        data: Dict[str, pd.DataFrame],
        start_date: datetime,
        end_date: datetime
    ):
        self.config = config
        self.data = data
        self.start_date = start_date
        self.end_date = end_date

        # Initialize components
        self.engine = BacktestEngine(backtest_config)
        self.walkforward = WalkForwardOptimizer(
            self.engine,
            train_months=config.train_months,
            test_months=config.test_months
        ) if config.use_walk_forward else None

        self.evaluator = FitnessEvaluator(self.engine, self.walkforward, config)
        self.mutator = ParameterMutator()
        self.crossover = CrossoverOperator()
        self.selector = SelectionOperator()

        # State
        self.population: List[Individual] = []
        self.generation_history: List[GenerationResult] = []
        self.elite_archive: List[Individual] = []
        self.current_generation = 0

    def initialize_population(self) -> List[Individual]:
        """Create initial population."""
        population = []
        strategy_types = get_available_strategies()

        for i in range(self.config.population_size):
            # Random strategy type
            strategy_type = random.choice(strategy_types)

            # Random parameters
            params = self.mutator.random_parameters(strategy_type)

            genome = StrategyGenome()
            genome.genes = {
                'strategy_type': strategy_type,
                'parameters': params
            }

            individual = Individual(
                individual_id=str(uuid4()),
                strategy_type=strategy_type,
                parameters=params,
                genome=genome,
                generation=0
            )
            population.append(individual)

        self.population = population
        return population

    async def evolve_generation(self) -> GenerationResult:
        """Run one generation of evolution."""
        self.current_generation += 1

        # Evaluate current population
        self.population = await self.evaluator.evaluate_population(
            self.population,
            self.data,
            self.start_date,
            self.end_date,
            use_walkforward=self.config.use_walk_forward
        )

        # Sort by fitness
        self.population.sort(key=lambda x: x.fitness, reverse=True)

        # Record generation result
        result = GenerationResult(
            generation_number=self.current_generation,
            population_size=len(self.population),
            best_fitness=self.population[0].fitness,
            avg_fitness=np.mean([ind.fitness for ind in self.population]),
            best_individual=self.population[0],
            top_10_individuals=self.population[:10],
            eliminated_count=0,
            preserved_count=self.config.elite_size
        )

        # Elite preservation
        elites = self.population[:self.config.elite_size]
        self.elite_archive.extend(elites)

        # Create new population
        new_population = []

        # Keep elites
        new_population.extend(elites)

        # Fill rest with offspring
        while len(new_population) < self.config.population_size:
            # Selection
            parent1 = self.selector.tournament_select(
                self.population,
                self.config.tournament_size
            )
            parent2 = self.selector.tournament_select(
                self.population,
                self.config.tournament_size
            )

            # Crossover
            if random.random() < self.config.crossover_rate:
                offspring = self.crossover.crossover(
                    parent1,
                    parent2,
                    self.current_generation
                )
            else:
                # Clone fitter parent
                offspring = Individual(
                    individual_id=str(uuid4()),
                    strategy_type=parent1.strategy_type,
                    parameters=parent1.parameters.copy(),
                    genome=parent1.genome,
                    generation=self.current_generation,
                    parent_ids=[parent1.individual_id]
                )

            # Mutation
            offspring.parameters = self.mutator.mutate_parameters(
                offspring.parameters,
                self.config.mutation_rate
            )
            offspring.genome.genes['parameters'] = offspring.parameters

            new_population.append(offspring)

        self.population = new_population
        self.generation_history.append(result)

        return result

    async def run_evolution(
        self,
        callback: Optional[Callable[[GenerationResult], None]] = None
    ) -> Tuple[Individual, List[GenerationResult]]:
        """
        Run complete evolution process.

        Returns:
            Tuple of (best individual, generation history)
        """
        # Initialize
        self.initialize_population()

        # Evolve
        for gen in range(self.config.generations):
            result = await self.evolve_generation()

            if callback:
                callback(result)

            print(f"Generation {result.generation_number}: "
                  f"Best Fitness={result.best_fitness:.4f}, "
                  f"Avg Fitness={result.avg_fitness:.4f}, "
                  f"Best Sharpe={result.best_individual.sharpe_ratio:.2f}")

        # Get overall best from archive
        all_individuals = self.elite_archive + self.population
        best = max(all_individuals, key=lambda x: x.fitness)

        return best, self.generation_history

    def get_top_strategies(self, n: int = 10) -> List[Individual]:
        """Get top N strategies from all generations."""
        all_individuals = self.elite_archive + self.population
        all_individuals.sort(key=lambda x: x.fitness, reverse=True)

        # Deduplicate by ID
        seen = set()
        unique = []
        for ind in all_individuals:
            if ind.individual_id not in seen:
                seen.add(ind.individual_id)
                unique.append(ind)

        return unique[:n]

    def export_best_strategies(self, n: int = 10) -> List[Dict[str, Any]]:
        """Export top strategies as serializable dicts."""
        top = self.get_top_strategies(n)
        return [
            {
                'individual_id': ind.individual_id,
                'strategy_type': ind.strategy_type,
                'parameters': ind.parameters,
                'fitness': ind.fitness,
                'sharpe_ratio': ind.sharpe_ratio,
                'total_return': ind.total_return,
                'max_drawdown': ind.max_drawdown,
                'win_rate': ind.win_rate,
                'profit_factor': ind.profit_factor,
                'oos_sharpe': ind.oos_sharpe,
                'return_consistency': ind.return_consistency,
                'generation': ind.generation
            }
            for ind in top
        ]
