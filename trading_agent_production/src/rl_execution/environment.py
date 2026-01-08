"""
Order Execution Environment for Reinforcement Learning

Simulates realistic market microstructure for training execution agents.
State space captures market conditions, action space controls order placement.
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from enum import Enum
from datetime import datetime, timedelta
import random


class OrderActionType(Enum):
    """Types of order actions the agent can take."""
    MARKET = "market"           # Execute immediately at market
    LIMIT_PASSIVE = "passive"   # Place limit at best bid/ask
    LIMIT_MID = "mid"           # Place limit at midpoint
    LIMIT_AGGRESSIVE = "aggressive"  # Place limit inside spread
    WAIT = "wait"               # Do nothing this step
    CANCEL = "cancel"           # Cancel outstanding orders


class ExecutionSide(Enum):
    """Side of execution."""
    BUY = "buy"
    SELL = "sell"


@dataclass
class OrderBookLevel:
    """Single level in order book."""
    price: float
    size: float
    num_orders: int = 1


@dataclass
class SimulatedOrderBook:
    """Simulated order book for execution environment."""
    bids: List[OrderBookLevel]  # Sorted descending by price
    asks: List[OrderBookLevel]  # Sorted ascending by price
    timestamp: datetime = field(default_factory=datetime.utcnow)

    @property
    def best_bid(self) -> float:
        return self.bids[0].price if self.bids else 0.0

    @property
    def best_ask(self) -> float:
        return self.asks[0].price if self.asks else float('inf')

    @property
    def mid_price(self) -> float:
        return (self.best_bid + self.best_ask) / 2

    @property
    def spread(self) -> float:
        return self.best_ask - self.best_bid

    @property
    def spread_bps(self) -> float:
        return (self.spread / self.mid_price) * 10000

    def total_bid_depth(self, levels: int = 5) -> float:
        return sum(level.size for level in self.bids[:levels])

    def total_ask_depth(self, levels: int = 5) -> float:
        return sum(level.size for level in self.asks[:levels])

    def imbalance(self, levels: int = 5) -> float:
        """Order book imbalance: positive = more bids, negative = more asks."""
        bid_depth = self.total_bid_depth(levels)
        ask_depth = self.total_ask_depth(levels)
        total = bid_depth + ask_depth
        if total == 0:
            return 0.0
        return (bid_depth - ask_depth) / total


@dataclass
class ExecutionState:
    """State representation for RL agent."""
    # Position state
    target_quantity: float          # Total quantity to execute
    remaining_quantity: float       # Quantity left to execute
    executed_quantity: float        # Quantity already executed
    average_fill_price: float       # VWAP of fills so far

    # Time state
    time_remaining: float           # Fraction of time window remaining (0-1)
    time_elapsed: float             # Fraction of time elapsed (0-1)

    # Market state
    mid_price: float                # Current mid price
    spread_bps: float               # Current spread in basis points
    volatility: float               # Recent realized volatility
    order_book_imbalance: float     # Order book imbalance (-1 to 1)

    # Depth at various levels
    bid_depth_1: float              # Depth at best bid
    bid_depth_5: float              # Depth at top 5 bids
    ask_depth_1: float              # Depth at best ask
    ask_depth_5: float              # Depth at top 5 asks

    # Trade flow
    recent_buy_volume: float        # Recent buy volume
    recent_sell_volume: float       # Recent sell volume
    trade_imbalance: float          # Buy/sell imbalance

    # Arrival price benchmark
    arrival_price: float            # Price at start of execution
    price_move_from_arrival: float  # Price change from arrival (bps)

    # Outstanding orders
    has_outstanding_order: bool     # Whether we have a resting order
    outstanding_order_price: float  # Price of outstanding order
    outstanding_order_age: float    # Age of order in time steps

    def to_array(self) -> np.ndarray:
        """Convert state to numpy array for RL model."""
        return np.array([
            self.remaining_quantity / max(self.target_quantity, 1),
            self.executed_quantity / max(self.target_quantity, 1),
            self.time_remaining,
            self.time_elapsed,
            self.spread_bps / 100,  # Normalize
            self.volatility * 100,  # Scale up
            self.order_book_imbalance,
            self.bid_depth_1 / 10000,  # Normalize
            self.bid_depth_5 / 50000,
            self.ask_depth_1 / 10000,
            self.ask_depth_5 / 50000,
            self.trade_imbalance,
            self.price_move_from_arrival / 100,  # Normalize bps
            float(self.has_outstanding_order),
            self.outstanding_order_age / 10,  # Normalize
        ], dtype=np.float32)

    @staticmethod
    def state_dim() -> int:
        """Dimension of state vector."""
        return 15


@dataclass
class ExecutionAction:
    """Action taken by execution agent."""
    action_type: OrderActionType
    size_fraction: float = 1.0      # Fraction of remaining to execute (0-1)
    price_offset_bps: float = 0.0   # Price offset from reference in bps

    @classmethod
    def from_discrete(cls, action_id: int) -> 'ExecutionAction':
        """Convert discrete action ID to ExecutionAction."""
        # Action space:
        # 0: Wait
        # 1: Market order (25% of remaining)
        # 2: Market order (50% of remaining)
        # 3: Market order (100% of remaining)
        # 4: Passive limit (at best bid/ask)
        # 5: Mid limit (at midpoint)
        # 6: Aggressive limit (inside spread)
        # 7: Cancel outstanding orders

        action_map = {
            0: cls(OrderActionType.WAIT),
            1: cls(OrderActionType.MARKET, size_fraction=0.25),
            2: cls(OrderActionType.MARKET, size_fraction=0.50),
            3: cls(OrderActionType.MARKET, size_fraction=1.0),
            4: cls(OrderActionType.LIMIT_PASSIVE, size_fraction=0.5),
            5: cls(OrderActionType.LIMIT_MID, size_fraction=0.5),
            6: cls(OrderActionType.LIMIT_AGGRESSIVE, size_fraction=0.5),
            7: cls(OrderActionType.CANCEL),
        }
        return action_map.get(action_id, cls(OrderActionType.WAIT))

    @staticmethod
    def action_dim() -> int:
        """Dimension of discrete action space."""
        return 8


@dataclass
class ExecutionResult:
    """Result of a single execution step."""
    fill_quantity: float
    fill_price: float
    is_filled: bool
    slippage_bps: float
    market_impact_bps: float


class MarketSimulator:
    """
    Simulates market dynamics for execution environment.

    Models:
    - Order book dynamics with mean-reversion
    - Price evolution with drift and volatility
    - Trade arrival and fill probability
    - Market impact from our orders
    """

    def __init__(
        self,
        initial_price: float = 100.0,
        tick_size: float = 0.01,
        base_spread_bps: float = 5.0,
        volatility: float = 0.02,  # Daily volatility
        mean_depth: float = 10000,
        impact_coefficient: float = 0.1,
        seed: Optional[int] = None
    ):
        self.initial_price = initial_price
        self.tick_size = tick_size
        self.base_spread_bps = base_spread_bps
        self.volatility = volatility
        self.mean_depth = mean_depth
        self.impact_coefficient = impact_coefficient

        if seed is not None:
            np.random.seed(seed)
            random.seed(seed)

        self.reset()

    def reset(self) -> SimulatedOrderBook:
        """Reset market to initial state."""
        self.current_price = self.initial_price
        self.price_history: List[float] = [self.initial_price]
        self.volume_history: List[Tuple[float, float]] = []  # (buy_vol, sell_vol)
        self.permanent_impact = 0.0
        self.temporary_impact = 0.0

        return self._generate_order_book()

    def step(
        self,
        our_order: Optional[Tuple[ExecutionSide, float, Optional[float]]] = None
    ) -> Tuple[SimulatedOrderBook, Optional[ExecutionResult]]:
        """
        Advance market by one time step.

        Args:
            our_order: Optional (side, quantity, limit_price) tuple

        Returns:
            Updated order book and execution result if order was placed
        """
        # Decay temporary impact
        self.temporary_impact *= 0.8

        # Random price evolution (geometric Brownian motion)
        step_vol = self.volatility / np.sqrt(252 * 78)  # 5-min steps in trading day
        drift = -0.5 * step_vol**2  # Risk-neutral drift
        shock = step_vol * np.random.randn()

        # Apply permanent impact
        price_return = drift + shock + self.permanent_impact
        self.current_price *= np.exp(price_return)
        self.current_price = round(self.current_price / self.tick_size) * self.tick_size

        self.price_history.append(self.current_price)

        # Simulate random trade flow
        buy_vol = np.random.exponential(self.mean_depth * 0.1)
        sell_vol = np.random.exponential(self.mean_depth * 0.1)
        self.volume_history.append((buy_vol, sell_vol))

        # Generate new order book
        order_book = self._generate_order_book()

        # Process our order if provided
        execution_result = None
        if our_order:
            execution_result = self._process_order(our_order, order_book)

        return order_book, execution_result

    def _generate_order_book(self) -> SimulatedOrderBook:
        """Generate simulated order book around current price."""
        spread = self.current_price * self.base_spread_bps / 10000
        spread += self.temporary_impact * self.current_price  # Wider spread after impact

        half_spread = spread / 2

        # Generate bid levels
        bids = []
        bid_price = self.current_price - half_spread
        for i in range(10):
            depth = self.mean_depth * np.random.exponential(1.0) * (0.8 ** i)
            bids.append(OrderBookLevel(
                price=round(bid_price / self.tick_size) * self.tick_size,
                size=depth,
                num_orders=max(1, int(depth / 1000))
            ))
            bid_price -= self.tick_size * (1 + i * 0.5)

        # Generate ask levels
        asks = []
        ask_price = self.current_price + half_spread
        for i in range(10):
            depth = self.mean_depth * np.random.exponential(1.0) * (0.8 ** i)
            asks.append(OrderBookLevel(
                price=round(ask_price / self.tick_size) * self.tick_size,
                size=depth,
                num_orders=max(1, int(depth / 1000))
            ))
            ask_price += self.tick_size * (1 + i * 0.5)

        return SimulatedOrderBook(bids=bids, asks=asks)

    def _process_order(
        self,
        order: Tuple[ExecutionSide, float, Optional[float]],
        order_book: SimulatedOrderBook
    ) -> ExecutionResult:
        """Process our order against order book."""
        side, quantity, limit_price = order

        is_buy = side == ExecutionSide.BUY

        if limit_price is None:
            # Market order - execute against book
            return self._execute_market_order(is_buy, quantity, order_book)
        else:
            # Limit order - check if it would fill
            return self._execute_limit_order(is_buy, quantity, limit_price, order_book)

    def _execute_market_order(
        self,
        is_buy: bool,
        quantity: float,
        order_book: SimulatedOrderBook
    ) -> ExecutionResult:
        """Execute market order with slippage."""
        levels = order_book.asks if is_buy else order_book.bids

        remaining = quantity
        total_cost = 0.0

        for level in levels:
            fill_qty = min(remaining, level.size)
            total_cost += fill_qty * level.price
            remaining -= fill_qty
            if remaining <= 0:
                break

        filled_qty = quantity - remaining
        avg_price = total_cost / filled_qty if filled_qty > 0 else 0

        # Calculate slippage from mid
        mid = order_book.mid_price
        slippage_bps = ((avg_price - mid) / mid) * 10000 if is_buy else ((mid - avg_price) / mid) * 10000

        # Apply market impact
        impact = self.impact_coefficient * np.sqrt(quantity / self.mean_depth)
        self.permanent_impact += impact * 0.3 * (1 if is_buy else -1)
        self.temporary_impact += impact * 0.7

        return ExecutionResult(
            fill_quantity=filled_qty,
            fill_price=avg_price,
            is_filled=remaining <= 0,
            slippage_bps=slippage_bps,
            market_impact_bps=impact * 10000
        )

    def _execute_limit_order(
        self,
        is_buy: bool,
        quantity: float,
        limit_price: float,
        order_book: SimulatedOrderBook
    ) -> ExecutionResult:
        """Attempt to execute limit order."""
        if is_buy:
            # Buy limit fills if price drops to limit
            if limit_price >= order_book.best_ask:
                # Crosses spread - fills immediately
                fill_price = order_book.best_ask
                fill_qty = min(quantity, order_book.asks[0].size)
            elif random.random() < 0.3:  # 30% chance of fill at limit
                fill_price = limit_price
                fill_qty = quantity * random.uniform(0.3, 1.0)
            else:
                return ExecutionResult(0, 0, False, 0, 0)
        else:
            if limit_price <= order_book.best_bid:
                fill_price = order_book.best_bid
                fill_qty = min(quantity, order_book.bids[0].size)
            elif random.random() < 0.3:
                fill_price = limit_price
                fill_qty = quantity * random.uniform(0.3, 1.0)
            else:
                return ExecutionResult(0, 0, False, 0, 0)

        mid = order_book.mid_price
        slippage_bps = ((fill_price - mid) / mid) * 10000 if is_buy else ((mid - fill_price) / mid) * 10000

        return ExecutionResult(
            fill_quantity=fill_qty,
            fill_price=fill_price,
            is_filled=True,
            slippage_bps=slippage_bps,
            market_impact_bps=0  # Passive orders have less impact
        )

    def get_recent_volatility(self, lookback: int = 20) -> float:
        """Calculate recent realized volatility."""
        if len(self.price_history) < lookback + 1:
            return self.volatility

        prices = self.price_history[-lookback-1:]
        returns = np.diff(np.log(prices))
        return np.std(returns) * np.sqrt(252 * 78)  # Annualized

    def get_trade_imbalance(self, lookback: int = 10) -> float:
        """Get recent trade imbalance."""
        if len(self.volume_history) < lookback:
            return 0.0

        recent = self.volume_history[-lookback:]
        buy_vol = sum(v[0] for v in recent)
        sell_vol = sum(v[1] for v in recent)
        total = buy_vol + sell_vol

        if total == 0:
            return 0.0
        return (buy_vol - sell_vol) / total


class OrderExecutionEnv:
    """
    Reinforcement Learning Environment for Order Execution.

    Follows OpenAI Gym-style interface.
    Goal: Execute a target quantity with minimal implementation shortfall.
    """

    def __init__(
        self,
        target_quantity: float = 10000,
        execution_window: int = 78,  # Steps (e.g., 5-min bars in trading day)
        side: ExecutionSide = ExecutionSide.BUY,
        initial_price: float = 100.0,
        volatility: float = 0.02,
        urgency: float = 0.5,  # 0 = patient, 1 = urgent
        seed: Optional[int] = None
    ):
        self.target_quantity = target_quantity
        self.execution_window = execution_window
        self.side = side
        self.urgency = urgency

        self.market = MarketSimulator(
            initial_price=initial_price,
            volatility=volatility,
            seed=seed
        )

        self.state_dim = ExecutionState.state_dim()
        self.action_dim = ExecutionAction.action_dim()

        self.reset()

    def reset(self) -> ExecutionState:
        """Reset environment to initial state."""
        self.order_book = self.market.reset()

        self.remaining_quantity = self.target_quantity
        self.executed_quantity = 0.0
        self.total_cost = 0.0
        self.current_step = 0

        self.arrival_price = self.order_book.mid_price

        self.outstanding_order: Optional[Tuple[float, float, int]] = None  # (price, qty, age)

        self.execution_history: List[ExecutionResult] = []

        return self._get_state()

    def step(self, action: int) -> Tuple[ExecutionState, float, bool, Dict[str, Any]]:
        """
        Take action and advance environment.

        Args:
            action: Discrete action ID

        Returns:
            (next_state, reward, done, info)
        """
        exec_action = ExecutionAction.from_discrete(action)

        # Process action
        order = self._action_to_order(exec_action)

        # Advance market
        self.order_book, exec_result = self.market.step(order)

        # Update outstanding order age
        if self.outstanding_order:
            price, qty, age = self.outstanding_order
            self.outstanding_order = (price, qty, age + 1)

        # Handle execution result
        if exec_result and exec_result.is_filled:
            self._record_fill(exec_result)

        # Check for outstanding order fills (passive fills from previous limit orders)
        if self.outstanding_order and exec_action.action_type == OrderActionType.CANCEL:
            self.outstanding_order = None

        self.current_step += 1

        # Check if done
        done = (
            self.remaining_quantity <= 0 or
            self.current_step >= self.execution_window
        )

        # Calculate reward
        reward = self._calculate_reward(exec_result, done)

        # Prepare info dict
        info = {
            'executed_qty': self.executed_quantity,
            'remaining_qty': self.remaining_quantity,
            'vwap': self.total_cost / max(self.executed_quantity, 1),
            'arrival_price': self.arrival_price,
            'current_price': self.order_book.mid_price,
            'step': self.current_step,
        }

        if done:
            info['implementation_shortfall_bps'] = self._calculate_shortfall()
            info['participation_rate'] = self.executed_quantity / self.target_quantity

        return self._get_state(), reward, done, info

    def _action_to_order(
        self,
        action: ExecutionAction
    ) -> Optional[Tuple[ExecutionSide, float, Optional[float]]]:
        """Convert action to order tuple."""
        if action.action_type == OrderActionType.WAIT:
            return None

        if action.action_type == OrderActionType.CANCEL:
            self.outstanding_order = None
            return None

        quantity = self.remaining_quantity * action.size_fraction
        if quantity <= 0:
            return None

        if action.action_type == OrderActionType.MARKET:
            return (self.side, quantity, None)

        # Limit orders
        mid = self.order_book.mid_price
        spread = self.order_book.spread

        if action.action_type == OrderActionType.LIMIT_PASSIVE:
            if self.side == ExecutionSide.BUY:
                price = self.order_book.best_bid
            else:
                price = self.order_book.best_ask
        elif action.action_type == OrderActionType.LIMIT_MID:
            price = mid
        elif action.action_type == OrderActionType.LIMIT_AGGRESSIVE:
            if self.side == ExecutionSide.BUY:
                price = mid + spread * 0.25
            else:
                price = mid - spread * 0.25
        else:
            return None

        # Store as outstanding order
        self.outstanding_order = (price, quantity, 0)

        return (self.side, quantity, price)

    def _record_fill(self, result: ExecutionResult) -> None:
        """Record a fill."""
        self.executed_quantity += result.fill_quantity
        self.remaining_quantity -= result.fill_quantity
        self.total_cost += result.fill_quantity * result.fill_price
        self.execution_history.append(result)

        # Clear outstanding order if it was filled
        if self.outstanding_order:
            price, qty, age = self.outstanding_order
            remaining = qty - result.fill_quantity
            if remaining <= 0:
                self.outstanding_order = None
            else:
                self.outstanding_order = (price, remaining, age)

    def _get_state(self) -> ExecutionState:
        """Get current state."""
        vol = self.market.get_recent_volatility()
        trade_imb = self.market.get_trade_imbalance()

        vwap = self.total_cost / max(self.executed_quantity, 1)

        price_move = ((self.order_book.mid_price - self.arrival_price) / self.arrival_price) * 10000

        recent_buys = sum(v[0] for v in self.market.volume_history[-10:]) if self.market.volume_history else 0
        recent_sells = sum(v[1] for v in self.market.volume_history[-10:]) if self.market.volume_history else 0

        return ExecutionState(
            target_quantity=self.target_quantity,
            remaining_quantity=self.remaining_quantity,
            executed_quantity=self.executed_quantity,
            average_fill_price=vwap,
            time_remaining=(self.execution_window - self.current_step) / self.execution_window,
            time_elapsed=self.current_step / self.execution_window,
            mid_price=self.order_book.mid_price,
            spread_bps=self.order_book.spread_bps,
            volatility=vol,
            order_book_imbalance=self.order_book.imbalance(),
            bid_depth_1=self.order_book.bids[0].size if self.order_book.bids else 0,
            bid_depth_5=self.order_book.total_bid_depth(5),
            ask_depth_1=self.order_book.asks[0].size if self.order_book.asks else 0,
            ask_depth_5=self.order_book.total_ask_depth(5),
            recent_buy_volume=recent_buys,
            recent_sell_volume=recent_sells,
            trade_imbalance=trade_imb,
            arrival_price=self.arrival_price,
            price_move_from_arrival=price_move,
            has_outstanding_order=self.outstanding_order is not None,
            outstanding_order_price=self.outstanding_order[0] if self.outstanding_order else 0,
            outstanding_order_age=self.outstanding_order[2] if self.outstanding_order else 0,
        )

    def _calculate_reward(
        self,
        exec_result: Optional[ExecutionResult],
        done: bool
    ) -> float:
        """
        Calculate step reward.

        Reward components:
        1. Execution progress (positive for fills)
        2. Slippage penalty
        3. Urgency penalty for remaining quantity
        4. Terminal reward for completion quality
        """
        reward = 0.0

        # Reward for execution progress
        if exec_result and exec_result.is_filled:
            progress = exec_result.fill_quantity / self.target_quantity
            reward += progress * 10  # Base reward for making progress

            # Penalty for slippage
            reward -= exec_result.slippage_bps * 0.1

            # Penalty for market impact
            reward -= exec_result.market_impact_bps * 0.05

        # Per-step penalty for remaining quantity (urgency pressure)
        remaining_fraction = self.remaining_quantity / self.target_quantity
        time_fraction = self.current_step / self.execution_window

        if time_fraction > 0.5 and remaining_fraction > 0.5:
            # Behind schedule penalty
            reward -= self.urgency * remaining_fraction * 0.5

        # Terminal reward
        if done:
            shortfall = self._calculate_shortfall()

            # Reward for completion
            completion_rate = self.executed_quantity / self.target_quantity
            reward += completion_rate * 5

            # Penalty for shortfall
            reward -= shortfall * 0.2

            # Big penalty for incomplete execution
            if completion_rate < 0.99:
                reward -= (1 - completion_rate) * 20

        return reward

    def _calculate_shortfall(self) -> float:
        """Calculate implementation shortfall in basis points."""
        if self.executed_quantity <= 0:
            return 0.0

        vwap = self.total_cost / self.executed_quantity

        if self.side == ExecutionSide.BUY:
            shortfall = (vwap - self.arrival_price) / self.arrival_price
        else:
            shortfall = (self.arrival_price - vwap) / self.arrival_price

        return shortfall * 10000  # Convert to bps


class VectorizedExecutionEnv:
    """
    Vectorized environment for parallel training.

    Runs multiple execution environments in parallel for efficient PPO training.
    """

    def __init__(
        self,
        num_envs: int = 8,
        **env_kwargs
    ):
        self.num_envs = num_envs
        self.envs = [OrderExecutionEnv(**env_kwargs) for _ in range(num_envs)]

        self.state_dim = self.envs[0].state_dim
        self.action_dim = self.envs[0].action_dim

    def reset(self) -> np.ndarray:
        """Reset all environments."""
        states = [env.reset().to_array() for env in self.envs]
        return np.stack(states)

    def step(
        self,
        actions: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[Dict]]:
        """
        Step all environments.

        Args:
            actions: Array of actions for each env

        Returns:
            (states, rewards, dones, infos)
        """
        results = [
            env.step(int(action))
            for env, action in zip(self.envs, actions)
        ]

        states = np.stack([r[0].to_array() for r in results])
        rewards = np.array([r[1] for r in results])
        dones = np.array([r[2] for r in results])
        infos = [r[3] for r in results]

        # Auto-reset done environments
        for i, done in enumerate(dones):
            if done:
                states[i] = self.envs[i].reset().to_array()

        return states, rewards, dones, infos
