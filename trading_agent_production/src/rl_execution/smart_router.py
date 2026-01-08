"""
Multi-Broker Smart Order Router

Routes orders across multiple brokers/venues for best execution.
Considers liquidity, fees, latency, and market impact.
"""

import asyncio
import numpy as np
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple
from enum import Enum
from datetime import datetime, timedelta
from abc import ABC, abstractmethod
import heapq


class VenueType(Enum):
    """Types of execution venues."""
    EXCHANGE = "exchange"           # Primary exchange
    DARK_POOL = "dark_pool"         # Dark pool
    ATS = "ats"                     # Alternative trading system
    MARKET_MAKER = "market_maker"   # Market maker
    INTERNAL = "internal"           # Internal crossing


class OrderRoutingStrategy(Enum):
    """Order routing strategies."""
    BEST_PRICE = "best_price"               # Route to best price
    SMART = "smart"                         # Smart order routing
    LEAST_IMPACT = "least_impact"           # Minimize market impact
    SPEED = "speed"                         # Minimize latency
    COST = "cost"                           # Minimize total cost
    DARK_SEEKING = "dark_seeking"           # Seek dark liquidity first
    LIQUIDITY_SEEKING = "liquidity_seeking" # Maximize fill probability


@dataclass
class VenueQuote:
    """Quote from a venue."""
    venue_id: str
    symbol: str
    bid: float
    bid_size: float
    ask: float
    ask_size: float
    timestamp: datetime = field(default_factory=datetime.utcnow)
    latency_ms: float = 0.0

    @property
    def mid(self) -> float:
        return (self.bid + self.ask) / 2

    @property
    def spread(self) -> float:
        return self.ask - self.bid

    @property
    def spread_bps(self) -> float:
        return (self.spread / self.mid) * 10000 if self.mid > 0 else 0


@dataclass
class VenueConfig:
    """Configuration for a venue."""
    venue_id: str
    venue_type: VenueType
    name: str

    # Fee structure
    maker_fee_bps: float = 0.0       # Rebate if negative
    taker_fee_bps: float = 2.0       # Basis points
    minimum_fee: float = 0.0

    # Latency characteristics
    avg_latency_ms: float = 1.0
    latency_std_ms: float = 0.5

    # Capacity limits
    max_order_size: float = 100000
    max_daily_volume: float = 1000000

    # Fill probability characteristics
    base_fill_probability: float = 0.9  # For aggressive orders
    passive_fill_rate: float = 0.3      # For passive orders

    # Market impact
    impact_coefficient: float = 0.1     # Impact per sqrt(size/ADV)

    # Availability
    is_active: bool = True
    trading_hours: Optional[Tuple[int, int]] = None  # Start/end hour UTC


@dataclass
class RoutedOrder:
    """An order routed to a venue."""
    order_id: str
    venue_id: str
    symbol: str
    side: str
    quantity: float
    order_type: str
    limit_price: Optional[float] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class VenueFill:
    """Fill from a venue."""
    order_id: str
    venue_id: str
    fill_quantity: float
    fill_price: float
    fee: float
    timestamp: datetime = field(default_factory=datetime.utcnow)
    latency_ms: float = 0.0


@dataclass
class RoutingDecision:
    """Result of routing decision."""
    venue_allocations: Dict[str, float]  # venue_id -> quantity
    expected_cost: float                  # Total expected cost in bps
    expected_fill_rate: float             # Expected fill probability
    expected_latency_ms: float            # Expected execution latency
    reasoning: str                        # Explanation of decision


class VenueConnection(ABC):
    """Abstract venue connection interface."""

    @abstractmethod
    async def get_quote(self, symbol: str) -> Optional[VenueQuote]:
        """Get current quote from venue."""
        pass

    @abstractmethod
    async def send_order(self, order: RoutedOrder) -> bool:
        """Send order to venue."""
        pass

    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel order at venue."""
        pass


class SimulatedVenueConnection(VenueConnection):
    """Simulated venue connection for testing."""

    def __init__(self, config: VenueConfig, base_price: float = 100.0):
        self.config = config
        self.base_price = base_price
        self.current_price = base_price
        self.pending_orders: Dict[str, RoutedOrder] = {}

    async def get_quote(self, symbol: str) -> Optional[VenueQuote]:
        """Simulate getting a quote."""
        if not self.config.is_active:
            return None

        # Simulate latency
        latency = max(0, np.random.normal(
            self.config.avg_latency_ms,
            self.config.latency_std_ms
        ))
        await asyncio.sleep(latency / 1000)

        # Generate quote with some randomness
        spread = self.current_price * 0.001  # 10 bps spread
        bid = self.current_price - spread / 2
        ask = self.current_price + spread / 2

        # Random size
        bid_size = np.random.exponential(5000)
        ask_size = np.random.exponential(5000)

        return VenueQuote(
            venue_id=self.config.venue_id,
            symbol=symbol,
            bid=bid,
            bid_size=bid_size,
            ask=ask,
            ask_size=ask_size,
            latency_ms=latency
        )

    async def send_order(self, order: RoutedOrder) -> bool:
        """Simulate sending order."""
        latency = max(0, np.random.normal(
            self.config.avg_latency_ms,
            self.config.latency_std_ms
        ))
        await asyncio.sleep(latency / 1000)

        self.pending_orders[order.order_id] = order
        return True

    async def cancel_order(self, order_id: str) -> bool:
        """Simulate canceling order."""
        if order_id in self.pending_orders:
            del self.pending_orders[order_id]
            return True
        return False


class CostModel:
    """
    Estimates execution costs for routing decisions.

    Considers:
    - Explicit fees (maker/taker)
    - Spread costs
    - Market impact
    - Opportunity cost
    """

    def __init__(self):
        self.historical_fills: List[VenueFill] = []

    def estimate_total_cost(
        self,
        venue: VenueConfig,
        quote: VenueQuote,
        quantity: float,
        side: str,
        is_aggressive: bool = True
    ) -> Dict[str, float]:
        """
        Estimate total execution cost in basis points.

        Returns breakdown of cost components.
        """
        # Fee cost
        if is_aggressive:
            fee_bps = venue.taker_fee_bps
        else:
            fee_bps = venue.maker_fee_bps

        # Spread cost (half spread for market orders)
        if is_aggressive:
            spread_cost_bps = quote.spread_bps / 2
        else:
            spread_cost_bps = 0  # Limit orders don't pay spread

        # Market impact (simplified Almgren-Chriss)
        # Impact proportional to sqrt(quantity / average_depth)
        avg_depth = (quote.bid_size + quote.ask_size) / 2
        if avg_depth > 0:
            participation = quantity / avg_depth
            impact_bps = venue.impact_coefficient * np.sqrt(participation) * 100
        else:
            impact_bps = 10  # High impact if no depth

        # Opportunity cost (risk of non-fill for passive orders)
        if not is_aggressive:
            non_fill_prob = 1 - venue.passive_fill_rate
            opportunity_cost_bps = non_fill_prob * 5  # Assumed cost of missing fill
        else:
            opportunity_cost_bps = 0

        total_cost_bps = (
            fee_bps +
            spread_cost_bps +
            impact_bps +
            opportunity_cost_bps
        )

        return {
            'fee_bps': fee_bps,
            'spread_bps': spread_cost_bps,
            'impact_bps': impact_bps,
            'opportunity_bps': opportunity_cost_bps,
            'total_bps': total_cost_bps,
        }

    def estimate_fill_probability(
        self,
        venue: VenueConfig,
        quote: VenueQuote,
        quantity: float,
        is_aggressive: bool
    ) -> float:
        """Estimate probability of fill."""
        if is_aggressive:
            # Aggressive orders fill if size available
            if quantity <= quote.ask_size:
                return venue.base_fill_probability
            else:
                return venue.base_fill_probability * (quote.ask_size / quantity)
        else:
            # Passive orders have lower fill probability
            return venue.passive_fill_rate * min(1.0, quote.bid_size / quantity)


class SmartOrderRouter:
    """
    Smart Order Router for multi-venue execution.

    Routes orders across venues to minimize execution costs
    while maximizing fill probability.
    """

    def __init__(
        self,
        venues: List[VenueConfig],
        strategy: OrderRoutingStrategy = OrderRoutingStrategy.SMART
    ):
        self.venues = {v.venue_id: v for v in venues}
        self.strategy = strategy
        self.cost_model = CostModel()

        # Venue connections
        self.connections: Dict[str, VenueConnection] = {}

        # Quote cache
        self.quotes: Dict[str, Dict[str, VenueQuote]] = {}  # symbol -> venue -> quote

        # Execution statistics
        self.routing_history: List[RoutingDecision] = []
        self.fill_history: List[VenueFill] = []

    def add_connection(self, venue_id: str, connection: VenueConnection) -> None:
        """Add venue connection."""
        self.connections[venue_id] = connection

    async def refresh_quotes(self, symbol: str) -> Dict[str, VenueQuote]:
        """Refresh quotes from all venues."""
        tasks = []
        venue_ids = []

        for venue_id, conn in self.connections.items():
            tasks.append(conn.get_quote(symbol))
            venue_ids.append(venue_id)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        quotes = {}
        for venue_id, result in zip(venue_ids, results):
            if isinstance(result, VenueQuote):
                quotes[venue_id] = result

        self.quotes[symbol] = quotes
        return quotes

    def route_order(
        self,
        symbol: str,
        side: str,
        quantity: float,
        urgency: float = 0.5
    ) -> RoutingDecision:
        """
        Determine optimal routing for an order.

        Args:
            symbol: Symbol to trade
            side: 'buy' or 'sell'
            quantity: Total quantity to execute
            urgency: 0 = patient, 1 = urgent

        Returns:
            RoutingDecision with venue allocations
        """
        if symbol not in self.quotes:
            return RoutingDecision(
                venue_allocations={},
                expected_cost=0,
                expected_fill_rate=0,
                expected_latency_ms=0,
                reasoning="No quotes available"
            )

        quotes = self.quotes[symbol]

        if self.strategy == OrderRoutingStrategy.BEST_PRICE:
            return self._route_best_price(quotes, side, quantity)
        elif self.strategy == OrderRoutingStrategy.SMART:
            return self._route_smart(quotes, side, quantity, urgency)
        elif self.strategy == OrderRoutingStrategy.LEAST_IMPACT:
            return self._route_least_impact(quotes, side, quantity)
        elif self.strategy == OrderRoutingStrategy.DARK_SEEKING:
            return self._route_dark_seeking(quotes, side, quantity)
        elif self.strategy == OrderRoutingStrategy.LIQUIDITY_SEEKING:
            return self._route_liquidity_seeking(quotes, side, quantity)
        else:
            return self._route_smart(quotes, side, quantity, urgency)

    def _route_best_price(
        self,
        quotes: Dict[str, VenueQuote],
        side: str,
        quantity: float
    ) -> RoutingDecision:
        """Route entirely to venue with best price."""
        best_venue = None
        best_price = float('inf') if side == 'buy' else 0.0

        for venue_id, quote in quotes.items():
            price = quote.ask if side == 'buy' else quote.bid

            if side == 'buy' and price < best_price:
                best_price = price
                best_venue = venue_id
            elif side == 'sell' and price > best_price:
                best_price = price
                best_venue = venue_id

        if best_venue is None:
            return RoutingDecision({}, 0, 0, 0, "No venues available")

        venue_config = self.venues[best_venue]
        quote = quotes[best_venue]
        costs = self.cost_model.estimate_total_cost(
            venue_config, quote, quantity, side, is_aggressive=True
        )

        return RoutingDecision(
            venue_allocations={best_venue: quantity},
            expected_cost=costs['total_bps'],
            expected_fill_rate=venue_config.base_fill_probability,
            expected_latency_ms=venue_config.avg_latency_ms,
            reasoning=f"Best price at {best_venue}: {best_price}"
        )

    def _route_smart(
        self,
        quotes: Dict[str, VenueQuote],
        side: str,
        quantity: float,
        urgency: float
    ) -> RoutingDecision:
        """
        Smart routing that optimizes for total cost.

        Splits order across venues based on cost/benefit analysis.
        """
        # Score each venue
        venue_scores: List[Tuple[float, str, float, Dict]] = []

        for venue_id, quote in quotes.items():
            venue_config = self.venues[venue_id]

            # Determine aggressiveness based on urgency
            is_aggressive = urgency > 0.5

            # Get available size at venue
            available = quote.ask_size if side == 'buy' else quote.bid_size

            # Calculate costs
            costs = self.cost_model.estimate_total_cost(
                venue_config, quote, min(quantity, available),
                side, is_aggressive
            )

            # Fill probability
            fill_prob = self.cost_model.estimate_fill_probability(
                venue_config, quote, min(quantity, available), is_aggressive
            )

            # Combined score (lower is better)
            # Adjust for urgency - when urgent, penalize low fill probability more
            score = (
                costs['total_bps'] +
                (1 - fill_prob) * 20 * urgency +
                venue_config.avg_latency_ms * 0.1 * urgency
            )

            venue_scores.append((score, venue_id, available, costs))

        # Sort by score
        venue_scores.sort(key=lambda x: x[0])

        # Allocate quantity across venues
        allocations = {}
        remaining = quantity
        total_cost = 0.0
        total_fill_prob = 0.0
        total_latency = 0.0

        for score, venue_id, available, costs in venue_scores:
            if remaining <= 0:
                break

            venue_config = self.venues[venue_id]

            # Allocate up to available or remaining
            alloc = min(remaining, available, venue_config.max_order_size)
            if alloc > 0:
                allocations[venue_id] = alloc
                remaining -= alloc

                # Weight by allocation
                weight = alloc / quantity
                total_cost += costs['total_bps'] * weight
                total_fill_prob += venue_config.base_fill_probability * weight
                total_latency += venue_config.avg_latency_ms * weight

        reasoning = f"Smart routed to {len(allocations)} venues"
        if remaining > 0:
            reasoning += f" ({remaining:.0f} unfilled)"

        return RoutingDecision(
            venue_allocations=allocations,
            expected_cost=total_cost,
            expected_fill_rate=total_fill_prob,
            expected_latency_ms=total_latency,
            reasoning=reasoning
        )

    def _route_least_impact(
        self,
        quotes: Dict[str, VenueQuote],
        side: str,
        quantity: float
    ) -> RoutingDecision:
        """Route to minimize market impact by spreading across venues."""
        # Allocate proportionally to depth
        total_depth = sum(
            (q.ask_size if side == 'buy' else q.bid_size)
            for q in quotes.values()
        )

        if total_depth == 0:
            return RoutingDecision({}, 0, 0, 0, "No depth available")

        allocations = {}
        for venue_id, quote in quotes.items():
            depth = quote.ask_size if side == 'buy' else quote.bid_size
            proportion = depth / total_depth
            alloc = quantity * proportion
            if alloc > 0:
                allocations[venue_id] = alloc

        return RoutingDecision(
            venue_allocations=allocations,
            expected_cost=0,  # Would calculate
            expected_fill_rate=0.9,
            expected_latency_ms=max(
                self.venues[v].avg_latency_ms for v in allocations
            ),
            reasoning=f"Split across {len(allocations)} venues to minimize impact"
        )

    def _route_dark_seeking(
        self,
        quotes: Dict[str, VenueQuote],
        side: str,
        quantity: float
    ) -> RoutingDecision:
        """Prefer dark pools to minimize information leakage."""
        dark_venues = []
        lit_venues = []

        for venue_id in quotes:
            venue_config = self.venues[venue_id]
            if venue_config.venue_type == VenueType.DARK_POOL:
                dark_venues.append(venue_id)
            else:
                lit_venues.append(venue_id)

        # Allocate to dark first
        allocations = {}
        remaining = quantity

        for venue_id in dark_venues:
            if remaining <= 0:
                break
            quote = quotes[venue_id]
            available = quote.ask_size if side == 'buy' else quote.bid_size
            alloc = min(remaining, available)
            if alloc > 0:
                allocations[venue_id] = alloc
                remaining -= alloc

        # Fill remainder in lit venues
        for venue_id in lit_venues:
            if remaining <= 0:
                break
            quote = quotes[venue_id]
            available = quote.ask_size if side == 'buy' else quote.bid_size
            alloc = min(remaining, available)
            if alloc > 0:
                allocations[venue_id] = alloc
                remaining -= alloc

        return RoutingDecision(
            venue_allocations=allocations,
            expected_cost=0,
            expected_fill_rate=0.7,  # Dark pools have lower fill rates
            expected_latency_ms=5.0,
            reasoning=f"Dark-seeking: {len([v for v in allocations if v in dark_venues])} dark, {len([v for v in allocations if v in lit_venues])} lit"
        )

    def _route_liquidity_seeking(
        self,
        quotes: Dict[str, VenueQuote],
        side: str,
        quantity: float
    ) -> RoutingDecision:
        """Route to venues with most liquidity."""
        # Sort venues by available size
        venue_sizes = [
            (venue_id, quote.ask_size if side == 'buy' else quote.bid_size)
            for venue_id, quote in quotes.items()
        ]
        venue_sizes.sort(key=lambda x: x[1], reverse=True)

        allocations = {}
        remaining = quantity

        for venue_id, size in venue_sizes:
            if remaining <= 0:
                break
            alloc = min(remaining, size)
            if alloc > 0:
                allocations[venue_id] = alloc
                remaining -= alloc

        return RoutingDecision(
            venue_allocations=allocations,
            expected_cost=0,
            expected_fill_rate=0.95,
            expected_latency_ms=1.0,
            reasoning=f"Liquidity-seeking: filled at {len(allocations)} venues"
        )

    async def execute_routing(
        self,
        decision: RoutingDecision,
        symbol: str,
        side: str,
        order_type: str = "market"
    ) -> List[RoutedOrder]:
        """Execute a routing decision by sending orders to venues."""
        orders = []
        order_id_base = f"sor_{datetime.utcnow().timestamp()}"

        for venue_id, quantity in decision.venue_allocations.items():
            if venue_id not in self.connections:
                continue

            order = RoutedOrder(
                order_id=f"{order_id_base}_{venue_id}",
                venue_id=venue_id,
                symbol=symbol,
                side=side,
                quantity=quantity,
                order_type=order_type
            )

            # Send order
            conn = self.connections[venue_id]
            success = await conn.send_order(order)

            if success:
                orders.append(order)

        return orders


class AdaptiveRouter(SmartOrderRouter):
    """
    Adaptive router that learns from historical performance.

    Adjusts venue preferences based on fill rates and costs.
    """

    def __init__(
        self,
        venues: List[VenueConfig],
        strategy: OrderRoutingStrategy = OrderRoutingStrategy.SMART,
        learning_rate: float = 0.1
    ):
        super().__init__(venues, strategy)
        self.learning_rate = learning_rate

        # Learned venue weights
        self.venue_weights: Dict[str, float] = {
            v.venue_id: 1.0 for v in venues
        }

        # Performance tracking
        self.venue_stats: Dict[str, Dict[str, List[float]]] = {
            v.venue_id: {
                'fill_rates': [],
                'slippages': [],
                'latencies': []
            }
            for v in venues
        }

    def record_fill(self, fill: VenueFill, expected_price: float) -> None:
        """Record fill for learning."""
        venue_id = fill.venue_id

        if venue_id not in self.venue_stats:
            return

        # Calculate slippage
        slippage = abs(fill.fill_price - expected_price) / expected_price * 10000

        self.venue_stats[venue_id]['slippages'].append(slippage)
        self.venue_stats[venue_id]['latencies'].append(fill.latency_ms)
        self.venue_stats[venue_id]['fill_rates'].append(1.0)  # Got a fill

        # Update weight
        self._update_venue_weight(venue_id)

    def record_unfilled(self, venue_id: str) -> None:
        """Record unfilled order for learning."""
        if venue_id not in self.venue_stats:
            return

        self.venue_stats[venue_id]['fill_rates'].append(0.0)
        self._update_venue_weight(venue_id)

    def _update_venue_weight(self, venue_id: str) -> None:
        """Update venue weight based on performance."""
        stats = self.venue_stats[venue_id]

        # Calculate metrics
        recent_fills = stats['fill_rates'][-20:]
        recent_slippages = stats['slippages'][-20:]

        if not recent_fills:
            return

        fill_rate = np.mean(recent_fills)
        avg_slippage = np.mean(recent_slippages) if recent_slippages else 0

        # Score: higher fill rate and lower slippage is better
        score = fill_rate - avg_slippage / 10

        # Update weight with learning rate
        current_weight = self.venue_weights[venue_id]
        new_weight = current_weight + self.learning_rate * (score - 0.5)
        self.venue_weights[venue_id] = max(0.1, min(2.0, new_weight))

    def _route_smart(
        self,
        quotes: Dict[str, VenueQuote],
        side: str,
        quantity: float,
        urgency: float
    ) -> RoutingDecision:
        """Smart routing with learned weights."""
        # Get base routing decision
        decision = super()._route_smart(quotes, side, quantity, urgency)

        # Adjust allocations by learned weights
        adjusted_allocations = {}
        total_weight = sum(
            self.venue_weights.get(v, 1.0)
            for v in decision.venue_allocations
        )

        for venue_id, alloc in decision.venue_allocations.items():
            weight = self.venue_weights.get(venue_id, 1.0)
            adjusted_allocations[venue_id] = alloc * weight / total_weight * quantity

        return RoutingDecision(
            venue_allocations=adjusted_allocations,
            expected_cost=decision.expected_cost,
            expected_fill_rate=decision.expected_fill_rate,
            expected_latency_ms=decision.expected_latency_ms,
            reasoning=decision.reasoning + " (weight-adjusted)"
        )
