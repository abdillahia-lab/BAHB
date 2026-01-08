"""
Live Paper Trading Engine

Simulates live trading with real-time market data.
Provides realistic execution simulation without risking real capital.
"""

import asyncio
import json
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set, Tuple
from enum import Enum
from datetime import datetime, timedelta
from collections import defaultdict
import threading
import time
import random
from abc import ABC, abstractmethod


class TradingMode(Enum):
    """Trading mode."""
    PAPER = "paper"           # Paper trading with simulated fills
    SIMULATED = "simulated"   # Simulated market with fake data
    SHADOW = "shadow"         # Shadow trading with real data, no execution
    LIVE = "live"             # Live trading (not implemented for safety)


class OrderStatus(Enum):
    """Order status."""
    PENDING = "pending"
    SUBMITTED = "submitted"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"


@dataclass
class PaperOrder:
    """Paper trading order."""
    order_id: str
    strategy_id: str
    symbol: str
    side: str                  # 'buy' or 'sell'
    order_type: str            # 'market', 'limit', 'stop', 'stop_limit'
    quantity: float
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: float = 0.0
    average_fill_price: float = 0.0
    commission: float = 0.0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    filled_at: Optional[datetime] = None
    time_in_force: str = "day"  # 'day', 'gtc', 'ioc', 'fok'
    fills: List[Dict] = field(default_factory=list)


@dataclass
class PaperPosition:
    """Paper trading position."""
    symbol: str
    quantity: float
    average_cost: float
    current_price: float = 0.0
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0
    opened_at: datetime = field(default_factory=datetime.utcnow)
    last_updated: datetime = field(default_factory=datetime.utcnow)

    @property
    def market_value(self) -> float:
        return self.quantity * self.current_price

    @property
    def cost_basis(self) -> float:
        return self.quantity * self.average_cost


@dataclass
class PaperAccount:
    """Paper trading account."""
    account_id: str
    initial_capital: float
    cash: float
    positions: Dict[str, PaperPosition] = field(default_factory=dict)
    orders: Dict[str, PaperOrder] = field(default_factory=dict)
    trade_history: List[Dict] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)

    # Settings
    commission_per_share: float = 0.005
    min_commission: float = 1.0
    slippage_bps: float = 2.0

    @property
    def equity(self) -> float:
        """Total account equity."""
        positions_value = sum(p.market_value for p in self.positions.values())
        return self.cash + positions_value

    @property
    def buying_power(self) -> float:
        """Available buying power (assuming 2x margin)."""
        return self.cash * 2

    @property
    def total_pnl(self) -> float:
        """Total P&L."""
        return self.equity - self.initial_capital

    @property
    def total_return_pct(self) -> float:
        """Total return percentage."""
        return (self.equity / self.initial_capital - 1) * 100


@dataclass
class MarketTick:
    """Real-time market tick."""
    symbol: str
    bid: float
    ask: float
    last: float
    volume: float
    timestamp: datetime = field(default_factory=datetime.utcnow)

    @property
    def mid(self) -> float:
        return (self.bid + self.ask) / 2

    @property
    def spread(self) -> float:
        return self.ask - self.bid


class MarketDataProvider(ABC):
    """Abstract market data provider."""

    @abstractmethod
    async def subscribe(self, symbols: List[str]) -> None:
        """Subscribe to symbols."""
        pass

    @abstractmethod
    async def get_quote(self, symbol: str) -> Optional[MarketTick]:
        """Get current quote."""
        pass

    @abstractmethod
    async def get_historical(
        self,
        symbol: str,
        start: datetime,
        end: datetime,
        interval: str = "1m"
    ) -> List[Dict]:
        """Get historical data."""
        pass


class SimulatedMarketData(MarketDataProvider):
    """Simulated market data for testing."""

    def __init__(self, base_prices: Dict[str, float] = None):
        self.base_prices = base_prices or {'AAPL': 150.0, 'GOOGL': 140.0, 'MSFT': 350.0}
        self.current_prices: Dict[str, float] = dict(self.base_prices)
        self.subscribed: Set[str] = set()
        self._running = False

    async def subscribe(self, symbols: List[str]) -> None:
        """Subscribe to symbols."""
        for symbol in symbols:
            self.subscribed.add(symbol)
            if symbol not in self.current_prices:
                self.current_prices[symbol] = 100.0

    async def get_quote(self, symbol: str) -> Optional[MarketTick]:
        """Get simulated quote."""
        if symbol not in self.current_prices:
            return None

        # Simulate price movement
        price = self.current_prices[symbol]
        change = price * random.gauss(0, 0.001)  # 0.1% volatility per tick
        price += change
        self.current_prices[symbol] = price

        spread = price * 0.001  # 10 bps spread

        return MarketTick(
            symbol=symbol,
            bid=price - spread / 2,
            ask=price + spread / 2,
            last=price,
            volume=random.uniform(100, 10000)
        )

    async def get_historical(
        self,
        symbol: str,
        start: datetime,
        end: datetime,
        interval: str = "1m"
    ) -> List[Dict]:
        """Get simulated historical data."""
        data = []
        price = self.base_prices.get(symbol, 100.0)

        current = start
        while current < end:
            # Random walk
            change = price * random.gauss(0, 0.01)
            price += change

            high = price * (1 + random.uniform(0, 0.005))
            low = price * (1 - random.uniform(0, 0.005))

            data.append({
                'timestamp': current.isoformat(),
                'open': price - change / 2,
                'high': high,
                'low': low,
                'close': price,
                'volume': random.uniform(10000, 100000)
            })

            if interval == "1m":
                current += timedelta(minutes=1)
            elif interval == "5m":
                current += timedelta(minutes=5)
            else:
                current += timedelta(hours=1)

        return data


class ExecutionSimulator:
    """
    Simulates realistic order execution.

    Models:
    - Slippage
    - Partial fills
    - Latency
    - Rejection conditions
    """

    def __init__(
        self,
        base_slippage_bps: float = 2.0,
        fill_probability: float = 0.95,
        avg_latency_ms: float = 50
    ):
        self.base_slippage_bps = base_slippage_bps
        self.fill_probability = fill_probability
        self.avg_latency_ms = avg_latency_ms

    async def execute_order(
        self,
        order: PaperOrder,
        market_tick: MarketTick
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Attempt to execute an order.

        Returns (success, fill_details)
        """
        # Simulate latency
        latency = max(0, random.gauss(self.avg_latency_ms, 10))
        await asyncio.sleep(latency / 1000)

        # Check fill probability
        if random.random() > self.fill_probability:
            return False, None

        # Calculate fill price with slippage
        if order.side == 'buy':
            base_price = market_tick.ask
            slippage = base_price * self.base_slippage_bps / 10000
            fill_price = base_price + slippage
        else:
            base_price = market_tick.bid
            slippage = base_price * self.base_slippage_bps / 10000
            fill_price = base_price - slippage

        # Check limit orders
        if order.order_type == 'limit':
            if order.side == 'buy' and fill_price > order.limit_price:
                return False, None
            if order.side == 'sell' and fill_price < order.limit_price:
                return False, None
            fill_price = order.limit_price

        # Determine fill quantity (may be partial)
        fill_qty = order.quantity - order.filled_quantity

        if random.random() < 0.1:  # 10% chance of partial fill
            fill_qty *= random.uniform(0.3, 0.9)

        fill_qty = round(fill_qty, 2)

        return True, {
            'fill_price': fill_price,
            'fill_quantity': fill_qty,
            'slippage_bps': slippage / base_price * 10000,
            'latency_ms': latency,
            'timestamp': datetime.utcnow().isoformat()
        }


class PaperTradingEngine:
    """
    Main paper trading engine.

    Manages paper accounts, processes orders, and tracks performance.
    """

    def __init__(
        self,
        market_data: MarketDataProvider,
        mode: TradingMode = TradingMode.PAPER
    ):
        self.market_data = market_data
        self.mode = mode
        self.execution_simulator = ExecutionSimulator()

        # Accounts
        self.accounts: Dict[str, PaperAccount] = {}

        # Order management
        self.pending_orders: Dict[str, PaperOrder] = {}
        self.order_callbacks: List[Callable[[PaperOrder], None]] = []

        # Performance tracking
        self.equity_history: Dict[str, List[Tuple[datetime, float]]] = defaultdict(list)

        # Engine state
        self._running = False
        self._order_thread: Optional[threading.Thread] = None

    def create_account(
        self,
        account_id: str,
        initial_capital: float = 100000.0,
        **settings
    ) -> PaperAccount:
        """Create a paper trading account."""
        account = PaperAccount(
            account_id=account_id,
            initial_capital=initial_capital,
            cash=initial_capital,
            **settings
        )
        self.accounts[account_id] = account
        return account

    def get_account(self, account_id: str) -> Optional[PaperAccount]:
        """Get account by ID."""
        return self.accounts.get(account_id)

    async def submit_order(
        self,
        account_id: str,
        symbol: str,
        side: str,
        quantity: float,
        order_type: str = "market",
        limit_price: Optional[float] = None,
        stop_price: Optional[float] = None,
        strategy_id: str = "default"
    ) -> Optional[PaperOrder]:
        """Submit a paper order."""
        account = self.accounts.get(account_id)
        if not account:
            return None

        # Validate order
        if not await self._validate_order(account, symbol, side, quantity, limit_price):
            return None

        order = PaperOrder(
            order_id=f"order_{len(account.orders)}_{datetime.utcnow().timestamp()}",
            strategy_id=strategy_id,
            symbol=symbol,
            side=side,
            order_type=order_type,
            quantity=quantity,
            limit_price=limit_price,
            stop_price=stop_price,
            status=OrderStatus.SUBMITTED
        )

        account.orders[order.order_id] = order
        self.pending_orders[order.order_id] = order

        # Notify callbacks
        for callback in self.order_callbacks:
            callback(order)

        return order

    async def cancel_order(
        self,
        account_id: str,
        order_id: str
    ) -> bool:
        """Cancel a paper order."""
        account = self.accounts.get(account_id)
        if not account or order_id not in account.orders:
            return False

        order = account.orders[order_id]
        if order.status not in [OrderStatus.PENDING, OrderStatus.SUBMITTED, OrderStatus.PARTIALLY_FILLED]:
            return False

        order.status = OrderStatus.CANCELLED
        order.updated_at = datetime.utcnow()

        if order_id in self.pending_orders:
            del self.pending_orders[order_id]

        return True

    async def _validate_order(
        self,
        account: PaperAccount,
        symbol: str,
        side: str,
        quantity: float,
        limit_price: Optional[float]
    ) -> bool:
        """Validate order against account constraints."""
        if quantity <= 0:
            return False

        # Get current quote
        quote = await self.market_data.get_quote(symbol)
        if not quote:
            return False

        if side == 'buy':
            # Check buying power
            price = limit_price or quote.ask
            required = price * quantity * 1.001  # 0.1% buffer
            if required > account.buying_power:
                return False
        else:
            # Check we have the position
            position = account.positions.get(symbol)
            if not position or position.quantity < quantity:
                return False

        return True

    async def _process_orders(self) -> None:
        """Process pending orders."""
        for order_id, order in list(self.pending_orders.items()):
            account = None
            for acc in self.accounts.values():
                if order_id in acc.orders:
                    account = acc
                    break

            if not account:
                continue

            # Get current quote
            quote = await self.market_data.get_quote(order.symbol)
            if not quote:
                continue

            # Check stop orders
            if order.order_type in ['stop', 'stop_limit']:
                triggered = self._check_stop_trigger(order, quote)
                if not triggered:
                    continue
                # Convert to market/limit
                if order.order_type == 'stop':
                    order.order_type = 'market'
                else:
                    order.order_type = 'limit'

            # Attempt execution
            success, fill_details = await self.execution_simulator.execute_order(order, quote)

            if success and fill_details:
                await self._process_fill(account, order, fill_details)

    def _check_stop_trigger(self, order: PaperOrder, quote: MarketTick) -> bool:
        """Check if stop price is triggered."""
        if order.side == 'buy':
            return quote.ask >= order.stop_price
        else:
            return quote.bid <= order.stop_price

    async def _process_fill(
        self,
        account: PaperAccount,
        order: PaperOrder,
        fill_details: Dict
    ) -> None:
        """Process an order fill."""
        fill_qty = fill_details['fill_quantity']
        fill_price = fill_details['fill_price']

        # Calculate commission
        commission = max(
            account.min_commission,
            account.commission_per_share * fill_qty
        )

        # Update order
        order.fills.append(fill_details)
        total_filled = order.filled_quantity + fill_qty
        order.average_fill_price = (
            (order.average_fill_price * order.filled_quantity + fill_price * fill_qty) /
            total_filled
        )
        order.filled_quantity = total_filled
        order.commission += commission
        order.updated_at = datetime.utcnow()

        if order.filled_quantity >= order.quantity:
            order.status = OrderStatus.FILLED
            order.filled_at = datetime.utcnow()
            if order.order_id in self.pending_orders:
                del self.pending_orders[order.order_id]
        else:
            order.status = OrderStatus.PARTIALLY_FILLED

        # Update position
        await self._update_position(account, order.symbol, order.side, fill_qty, fill_price)

        # Update cash
        if order.side == 'buy':
            account.cash -= fill_qty * fill_price + commission
        else:
            account.cash += fill_qty * fill_price - commission

        # Record trade
        account.trade_history.append({
            'order_id': order.order_id,
            'symbol': order.symbol,
            'side': order.side,
            'quantity': fill_qty,
            'price': fill_price,
            'commission': commission,
            'timestamp': datetime.utcnow().isoformat()
        })

        # Notify callbacks
        for callback in self.order_callbacks:
            callback(order)

    async def _update_position(
        self,
        account: PaperAccount,
        symbol: str,
        side: str,
        quantity: float,
        price: float
    ) -> None:
        """Update position after fill."""
        position = account.positions.get(symbol)

        if side == 'buy':
            if position:
                # Add to position
                new_qty = position.quantity + quantity
                position.average_cost = (
                    (position.average_cost * position.quantity + price * quantity) /
                    new_qty
                )
                position.quantity = new_qty
            else:
                # New position
                account.positions[symbol] = PaperPosition(
                    symbol=symbol,
                    quantity=quantity,
                    average_cost=price,
                    current_price=price
                )
        else:
            if position:
                # Realize P&L
                pnl = (price - position.average_cost) * quantity
                position.realized_pnl += pnl
                position.quantity -= quantity

                if position.quantity <= 0:
                    del account.positions[symbol]

        # Update current prices
        if symbol in account.positions:
            quote = await self.market_data.get_quote(symbol)
            if quote:
                account.positions[symbol].current_price = quote.mid
                account.positions[symbol].unrealized_pnl = (
                    (quote.mid - account.positions[symbol].average_cost) *
                    account.positions[symbol].quantity
                )

    async def update_prices(self) -> None:
        """Update all position prices."""
        for account in self.accounts.values():
            for symbol, position in account.positions.items():
                quote = await self.market_data.get_quote(symbol)
                if quote:
                    position.current_price = quote.mid
                    position.unrealized_pnl = (
                        (quote.mid - position.average_cost) * position.quantity
                    )
                    position.last_updated = datetime.utcnow()

    def start(self) -> None:
        """Start the paper trading engine."""
        self._running = True

        # Start order processing loop
        async def run_loop():
            while self._running:
                try:
                    await self._process_orders()
                    await self.update_prices()
                    await self._record_equity()
                except Exception as e:
                    print(f"Paper trading error: {e}")
                await asyncio.sleep(1)

        def run_async():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(run_loop())

        self._order_thread = threading.Thread(target=run_async)
        self._order_thread.daemon = True
        self._order_thread.start()

    def stop(self) -> None:
        """Stop the paper trading engine."""
        self._running = False
        if self._order_thread:
            self._order_thread.join(timeout=5)

    async def _record_equity(self) -> None:
        """Record equity for performance tracking."""
        now = datetime.utcnow()
        for account_id, account in self.accounts.items():
            self.equity_history[account_id].append((now, account.equity))

    def on_order_update(self, callback: Callable[[PaperOrder], None]) -> None:
        """Register order update callback."""
        self.order_callbacks.append(callback)

    def get_performance(self, account_id: str) -> Dict[str, Any]:
        """Get account performance metrics."""
        account = self.accounts.get(account_id)
        if not account:
            return {}

        history = self.equity_history.get(account_id, [])
        if not history:
            return {'total_return_pct': 0, 'sharpe_ratio': 0}

        # Calculate returns
        equities = [e for _, e in history]
        returns = []
        for i in range(1, len(equities)):
            ret = (equities[i] - equities[i-1]) / equities[i-1]
            returns.append(ret)

        if not returns:
            return {'total_return_pct': account.total_return_pct}

        import numpy as np
        returns = np.array(returns)

        # Calculate metrics
        avg_return = np.mean(returns)
        std_return = np.std(returns)
        sharpe = avg_return / std_return * np.sqrt(252) if std_return > 0 else 0

        # Max drawdown
        peak = equities[0]
        max_dd = 0
        for eq in equities:
            if eq > peak:
                peak = eq
            dd = (peak - eq) / peak
            max_dd = max(max_dd, dd)

        # Win rate
        trades = account.trade_history
        if trades:
            winning = sum(1 for t in trades if t.get('pnl', 0) > 0)
            win_rate = winning / len(trades)
        else:
            win_rate = 0

        return {
            'total_return_pct': account.total_return_pct,
            'sharpe_ratio': sharpe,
            'max_drawdown_pct': max_dd * 100,
            'win_rate': win_rate,
            'num_trades': len(trades),
            'avg_daily_return': avg_return * 100,
            'volatility': std_return * np.sqrt(252) * 100,
        }


class StrategyRunner:
    """
    Runs strategies on paper trading engine.

    Connects strategies to market data and execution.
    """

    def __init__(
        self,
        engine: PaperTradingEngine,
        account_id: str
    ):
        self.engine = engine
        self.account_id = account_id
        self.strategies: Dict[str, Any] = {}
        self._running = False

    def add_strategy(self, strategy_id: str, strategy: Any) -> None:
        """Add a strategy to run."""
        self.strategies[strategy_id] = strategy

    async def run(self, symbols: List[str], interval_seconds: float = 60) -> None:
        """Run strategies in a loop."""
        # Subscribe to market data
        await self.engine.market_data.subscribe(symbols)

        self._running = True

        while self._running:
            try:
                # Get current market data
                market_data = {}
                for symbol in symbols:
                    quote = await self.engine.market_data.get_quote(symbol)
                    if quote:
                        market_data[symbol] = {
                            'bid': quote.bid,
                            'ask': quote.ask,
                            'mid': quote.mid,
                            'timestamp': quote.timestamp
                        }

                # Get account state
                account = self.engine.get_account(self.account_id)
                if not account:
                    continue

                portfolio = {
                    'cash': account.cash,
                    'equity': account.equity,
                    'positions': {
                        s: {'quantity': p.quantity, 'avg_cost': p.average_cost}
                        for s, p in account.positions.items()
                    }
                }

                # Run each strategy
                for strategy_id, strategy in self.strategies.items():
                    try:
                        signals = strategy.generate_signals(
                            market_data, portfolio, datetime.utcnow()
                        )

                        for signal in signals:
                            await self._process_signal(strategy_id, signal)

                    except Exception as e:
                        print(f"Strategy {strategy_id} error: {e}")

            except Exception as e:
                print(f"Strategy runner error: {e}")

            await asyncio.sleep(interval_seconds)

    async def _process_signal(self, strategy_id: str, signal: Any) -> None:
        """Process a trading signal."""
        # Convert signal to order
        await self.engine.submit_order(
            account_id=self.account_id,
            symbol=signal.symbol,
            side=signal.action.value,  # 'buy' or 'sell'
            quantity=signal.quantity,
            order_type='market',
            strategy_id=strategy_id
        )

    def stop(self) -> None:
        """Stop running strategies."""
        self._running = False
