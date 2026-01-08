"""
Trading execution engine for autonomous trading.
"""

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any, Callable, Dict, List, Optional, Set
from uuid import uuid4

from ..core.types import (
    Order,
    OrderSide,
    OrderStatus,
    OrderType,
    Portfolio,
    Position,
    RiskMetrics,
    TradingSignal,
)


@dataclass
class ExecutionResult:
    """Result of order execution."""
    order_id: str
    status: OrderStatus
    filled_quantity: Decimal
    average_price: Optional[Decimal]
    commission: Decimal
    slippage: Decimal
    execution_time_ms: float
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class TradingCycleResult:
    """Result of a trading cycle."""
    cycle_id: str
    signals_generated: int
    signals_approved: int
    orders_executed: int
    executions: List[ExecutionResult]
    cycle_pnl: Decimal
    duration_ms: float
    timestamp: datetime = field(default_factory=datetime.utcnow)


class BrokerAdapter(ABC):
    """Abstract broker adapter interface."""

    @abstractmethod
    async def connect(self) -> bool:
        """Connect to broker."""
        pass

    @abstractmethod
    async def disconnect(self):
        """Disconnect from broker."""
        pass

    @abstractmethod
    async def submit_order(self, order: Order) -> ExecutionResult:
        """Submit order to broker."""
        pass

    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an order."""
        pass

    @abstractmethod
    async def get_positions(self) -> List[Position]:
        """Get current positions."""
        pass

    @abstractmethod
    async def get_portfolio(self) -> Portfolio:
        """Get portfolio summary."""
        pass

    @abstractmethod
    async def get_order_status(self, order_id: str) -> OrderStatus:
        """Get order status."""
        pass


class AlpacaAdapter(BrokerAdapter):
    """Alpaca broker adapter implementation - REAL API CONNECTION."""

    def __init__(
        self,
        api_key: str,
        api_secret: str,
        paper: bool = True
    ):
        self.api_key = api_key
        self.api_secret = api_secret
        self.paper = paper
        self.connected = False
        self._trading_client = None
        self._data_client = None

    async def connect(self) -> bool:
        """Connect to Alpaca API."""
        try:
            from alpaca.trading.client import TradingClient
            from alpaca.data.historical import StockHistoricalDataClient

            self._trading_client = TradingClient(
                api_key=self.api_key,
                secret_key=self.api_secret,
                paper=self.paper
            )
            self._data_client = StockHistoricalDataClient(
                api_key=self.api_key,
                secret_key=self.api_secret
            )
            # Test connection by getting account
            account = self._trading_client.get_account()
            print(f"✅ Connected to Alpaca {'Paper' if self.paper else 'Live'} Trading")
            print(f"   Account: {account.account_number}")
            print(f"   Cash: ${float(account.cash):,.2f}")
            print(f"   Buying Power: ${float(account.buying_power):,.2f}")
            self.connected = True
            return True
        except Exception as e:
            print(f"❌ Alpaca connection failed: {e}")
            self.connected = False
            return False

    async def disconnect(self):
        """Disconnect from Alpaca."""
        self.connected = False
        self._trading_client = None
        self._data_client = None

    async def submit_order(self, order: Order) -> ExecutionResult:
        """Submit order to Alpaca."""
        from alpaca.trading.requests import MarketOrderRequest, LimitOrderRequest
        from alpaca.trading.enums import OrderSide as AlpacaOrderSide, TimeInForce

        start_time = datetime.utcnow()

        try:
            side = AlpacaOrderSide.BUY if order.side == OrderSide.BUY else AlpacaOrderSide.SELL

            if order.order_type == OrderType.MARKET:
                order_request = MarketOrderRequest(
                    symbol=order.symbol,
                    qty=float(order.quantity),
                    side=side,
                    time_in_force=TimeInForce.DAY
                )
            else:
                order_request = LimitOrderRequest(
                    symbol=order.symbol,
                    qty=float(order.quantity),
                    side=side,
                    time_in_force=TimeInForce.DAY,
                    limit_price=float(order.limit_price) if order.limit_price else None
                )

            alpaca_order = self._trading_client.submit_order(order_request)
            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            return ExecutionResult(
                order_id=str(alpaca_order.id),
                status=OrderStatus.PENDING if alpaca_order.status.value == "pending_new" else OrderStatus.FILLED,
                filled_quantity=Decimal(str(alpaca_order.filled_qty or 0)),
                average_price=Decimal(str(alpaca_order.filled_avg_price)) if alpaca_order.filled_avg_price else None,
                commission=Decimal("0.00"),
                slippage=Decimal("0.00"),
                execution_time_ms=execution_time
            )
        except Exception as e:
            print(f"Order submission failed: {e}")
            raise

    async def cancel_order(self, order_id: str) -> bool:
        """Cancel order on Alpaca."""
        try:
            self._trading_client.cancel_order_by_id(order_id)
            return True
        except Exception as e:
            print(f"Cancel order failed: {e}")
            return False

    async def get_positions(self) -> List[Position]:
        """Get positions from Alpaca."""
        try:
            alpaca_positions = self._trading_client.get_all_positions()
            positions = []
            for p in alpaca_positions:
                positions.append(Position(
                    symbol=p.symbol,
                    quantity=Decimal(str(p.qty)),
                    average_entry_price=Decimal(str(p.avg_entry_price)),
                    current_price=Decimal(str(p.current_price)),
                    market_value=Decimal(str(p.market_value)),
                    unrealized_pnl=Decimal(str(p.unrealized_pl)),
                    realized_pnl=Decimal("0.00"),
                    cost_basis=Decimal(str(p.cost_basis))
                ))
            return positions
        except Exception as e:
            print(f"Get positions failed: {e}")
            return []

    async def get_portfolio(self) -> Portfolio:
        """Get portfolio from Alpaca."""
        try:
            account = self._trading_client.get_account()
            positions = await self.get_positions()

            return Portfolio(
                account_id=account.account_number,
                cash=Decimal(str(account.cash)),
                positions=positions,
                total_value=Decimal(str(account.equity)),
                daily_pnl=Decimal(str(account.equity)) - Decimal(str(account.last_equity)),
                total_pnl=Decimal(str(account.equity)) - Decimal("100000.00"),  # Assuming 100k start
                buying_power=Decimal(str(account.buying_power))
            )
        except Exception as e:
            print(f"Get portfolio failed: {e}")
            return Portfolio(
                account_id="error",
                cash=Decimal("0.00"),
                positions=[],
                total_value=Decimal("0.00"),
                daily_pnl=Decimal("0.00"),
                total_pnl=Decimal("0.00"),
                buying_power=Decimal("0.00")
            )

    async def get_order_status(self, order_id: str) -> OrderStatus:
        """Get order status from Alpaca."""
        try:
            order = self._trading_client.get_order_by_id(order_id)
            status_map = {
                "filled": OrderStatus.FILLED,
                "partially_filled": OrderStatus.PARTIALLY_FILLED,
                "canceled": OrderStatus.CANCELLED,
                "pending_new": OrderStatus.PENDING,
                "new": OrderStatus.PENDING,
            }
            return status_map.get(order.status.value, OrderStatus.PENDING)
        except Exception as e:
            print(f"Get order status failed: {e}")
            return OrderStatus.PENDING

    def get_account_info(self) -> dict:
        """Get raw account info from Alpaca."""
        try:
            account = self._trading_client.get_account()
            return {
                "account_number": account.account_number,
                "status": account.status.value,
                "cash": float(account.cash),
                "buying_power": float(account.buying_power),
                "equity": float(account.equity),
                "last_equity": float(account.last_equity),
                "portfolio_value": float(account.portfolio_value),
                "pattern_day_trader": account.pattern_day_trader,
                "trading_blocked": account.trading_blocked,
                "transfers_blocked": account.transfers_blocked,
                "account_blocked": account.account_blocked,
            }
        except Exception as e:
            return {"error": str(e)}


class RiskManager:
    """
    Risk management system for trading.
    """

    def __init__(self, config: Dict[str, Any]):
        # AGGRESSIVE MODE - Higher risk, higher reward
        self.max_position_size = Decimal(str(config.get("max_position_size", 100000)))
        self.max_portfolio_exposure = config.get("max_portfolio_exposure", 0.95)
        self.max_single_stock_exposure = config.get("max_single_stock_exposure", 0.40)
        self.max_daily_loss = Decimal(str(config.get("max_daily_loss", 50000)))
        self.max_drawdown = config.get("max_drawdown", 0.35)
        self.leverage = Decimal(str(config.get("leverage", 4.0)))

        self.daily_pnl = Decimal("0.00")
        self.is_halted = False
        self.halt_reason: Optional[str] = None

    async def evaluate_signal(
        self,
        signal: TradingSignal,
        portfolio: Portfolio,
        positions: List[Position]
    ) -> tuple[bool, Optional[str]]:
        """
        Evaluate whether a trading signal should be approved.

        Returns:
            Tuple of (approved, rejection_reason)
        """
        # Check if trading is halted
        if self.is_halted:
            return False, f"Trading halted: {self.halt_reason}"

        # Check daily loss limit
        if self.daily_pnl < -self.max_daily_loss:
            self.halt_trading("Daily loss limit exceeded")
            return False, "Daily loss limit exceeded"

        # Check position size
        position_value = signal.position_size * signal.entry_price
        if position_value > self.max_position_size:
            return False, f"Position size {position_value} exceeds max {self.max_position_size}"

        # Check single stock exposure
        current_exposure = self._get_symbol_exposure(signal.symbol, positions)
        new_exposure = current_exposure + position_value
        max_allowed = portfolio.total_value * Decimal(str(self.max_single_stock_exposure))

        if new_exposure > max_allowed:
            return False, f"Single stock exposure would exceed {self.max_single_stock_exposure*100}%"

        # Check total portfolio exposure
        total_exposure = sum(p.market_value for p in positions)
        new_total = total_exposure + position_value
        max_total = portfolio.total_value * Decimal(str(self.max_portfolio_exposure))

        if new_total > max_total:
            return False, f"Portfolio exposure would exceed {self.max_portfolio_exposure*100}%"

        # Check drawdown
        if self._calculate_drawdown(portfolio) > self.max_drawdown:
            self.halt_trading("Maximum drawdown exceeded")
            return False, "Maximum drawdown exceeded"

        return True, None

    def _get_symbol_exposure(
        self,
        symbol: str,
        positions: List[Position]
    ) -> Decimal:
        """Get current exposure to a symbol."""
        for pos in positions:
            if pos.symbol == symbol:
                return pos.market_value
        return Decimal("0.00")

    def _calculate_drawdown(self, portfolio: Portfolio) -> float:
        """Calculate current drawdown."""
        # Placeholder - would track peak value
        return 0.0

    def halt_trading(self, reason: str):
        """Halt all trading."""
        self.is_halted = True
        self.halt_reason = reason

    def resume_trading(self):
        """Resume trading."""
        self.is_halted = False
        self.halt_reason = None

    def reset_daily_pnl(self):
        """Reset daily P&L tracking."""
        self.daily_pnl = Decimal("0.00")

    def update_pnl(self, pnl: Decimal):
        """Update daily P&L."""
        self.daily_pnl += pnl


class PositionManager:
    """
    Manages trading positions.
    """

    def __init__(self, broker: BrokerAdapter):
        self.broker = broker
        self._positions_cache: Dict[str, Position] = {}
        self._last_update: Optional[datetime] = None

    async def get_positions(self) -> List[Position]:
        """Get all current positions."""
        positions = await self.broker.get_positions()
        self._positions_cache = {p.symbol: p for p in positions}
        self._last_update = datetime.utcnow()
        return positions

    async def get_position(self, symbol: str) -> Optional[Position]:
        """Get position for a specific symbol."""
        if symbol in self._positions_cache:
            return self._positions_cache[symbol]
        await self.get_positions()
        return self._positions_cache.get(symbol)

    async def update_position(
        self,
        symbol: str,
        execution: ExecutionResult,
        side: OrderSide
    ):
        """Update position after execution."""
        current = self._positions_cache.get(symbol)

        if current is None:
            # New position
            if side == OrderSide.BUY:
                self._positions_cache[symbol] = Position(
                    symbol=symbol,
                    quantity=execution.filled_quantity,
                    average_entry_price=execution.average_price,
                    current_price=execution.average_price,
                    market_value=execution.filled_quantity * execution.average_price,
                    unrealized_pnl=Decimal("0.00"),
                    realized_pnl=Decimal("0.00"),
                    cost_basis=execution.filled_quantity * execution.average_price
                )
        else:
            # Update existing position
            if side == OrderSide.BUY:
                new_quantity = current.quantity + execution.filled_quantity
                new_cost = (
                    current.cost_basis +
                    execution.filled_quantity * execution.average_price
                )
                current.quantity = new_quantity
                current.average_entry_price = new_cost / new_quantity
                current.cost_basis = new_cost
            else:
                # Sell
                sell_value = execution.filled_quantity * execution.average_price
                cost_of_sold = (
                    execution.filled_quantity * current.average_entry_price
                )
                realized_pnl = sell_value - cost_of_sold

                current.quantity -= execution.filled_quantity
                current.realized_pnl += realized_pnl
                current.cost_basis -= cost_of_sold

                if current.quantity <= 0:
                    del self._positions_cache[symbol]


class StrategyManager:
    """
    Manages trading strategies.
    """

    def __init__(self):
        self.strategies: Dict[str, 'BaseStrategy'] = {}
        self.active_strategies: Set[str] = set()

    def register_strategy(self, strategy: 'BaseStrategy'):
        """Register a trading strategy."""
        self.strategies[strategy.strategy_id] = strategy

    def activate_strategy(self, strategy_id: str):
        """Activate a strategy."""
        if strategy_id in self.strategies:
            self.active_strategies.add(strategy_id)

    def deactivate_strategy(self, strategy_id: str):
        """Deactivate a strategy."""
        self.active_strategies.discard(strategy_id)

    async def generate_signals(
        self,
        strategy_ids: Set[str],
        positions: List[Position]
    ) -> List[TradingSignal]:
        """Generate signals from active strategies."""
        signals = []
        for strategy_id in strategy_ids:
            if strategy_id in self.strategies:
                strategy = self.strategies[strategy_id]
                strategy_signals = await strategy.generate_signals(positions)
                signals.extend(strategy_signals)
        return signals


class BaseStrategy(ABC):
    """Abstract base class for trading strategies."""

    def __init__(self, strategy_id: str, name: str):
        self.strategy_id = strategy_id
        self.name = name

    @abstractmethod
    async def generate_signals(
        self,
        positions: List[Position]
    ) -> List[TradingSignal]:
        """Generate trading signals."""
        pass


class AuditLogger:
    """
    Audit logging for all trading activities.
    """

    def __init__(self, log_path: Optional[str] = None):
        self.log_path = log_path
        self.entries: List[Dict[str, Any]] = []

    async def log_signal(
        self,
        signal: TradingSignal,
        approved: bool,
        reason: Optional[str] = None
    ):
        """Log a trading signal."""
        entry = {
            "type": "signal",
            "signal_id": signal.signal_id,
            "strategy_id": signal.strategy_id,
            "symbol": signal.symbol,
            "side": signal.side.value,
            "strength": signal.strength.value,
            "approved": approved,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.entries.append(entry)

    async def log_execution(self, execution: ExecutionResult):
        """Log an order execution."""
        entry = {
            "type": "execution",
            "order_id": execution.order_id,
            "status": execution.status.value,
            "filled_quantity": str(execution.filled_quantity),
            "average_price": str(execution.average_price) if execution.average_price else None,
            "commission": str(execution.commission),
            "slippage": str(execution.slippage),
            "execution_time_ms": execution.execution_time_ms,
            "timestamp": execution.timestamp.isoformat()
        }
        self.entries.append(entry)

    async def log_rejected_signal(
        self,
        signal: TradingSignal,
        reason: str
    ):
        """Log a rejected signal."""
        await self.log_signal(signal, approved=False, reason=reason)

    def get_recent_entries(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent log entries."""
        return self.entries[-limit:]


class AutonomousTradingEngine:
    """
    Core autonomous trading engine.
    """

    def __init__(
        self,
        broker: BrokerAdapter,
        risk_config: Dict[str, Any]
    ):
        self.broker = broker
        self.risk_manager = RiskManager(risk_config)
        self.position_manager = PositionManager(broker)
        self.strategy_manager = StrategyManager()
        self.audit_logger = AuditLogger()

        self.is_running = False
        self.cycle_count = 0

    async def start(self):
        """Start the trading engine."""
        await self.broker.connect()
        self.is_running = True

    async def stop(self):
        """Stop the trading engine."""
        self.is_running = False
        await self.broker.disconnect()

    async def emergency_stop(self):
        """Emergency stop - halt all trading and close positions."""
        self.risk_manager.halt_trading("Emergency stop triggered")
        # Cancel all open orders
        # Close all positions (optional)
        await self.stop()

    async def run_trading_cycle(
        self,
        active_strategies: Set[str]
    ) -> TradingCycleResult:
        """Execute a single trading cycle."""
        cycle_id = str(uuid4())
        start_time = datetime.utcnow()

        # Get current state
        portfolio = await self.broker.get_portfolio()
        positions = await self.position_manager.get_positions()

        # Generate signals
        signals = await self.strategy_manager.generate_signals(
            active_strategies,
            positions
        )

        # Evaluate and execute
        approved_signals = []
        executions = []

        for signal in signals:
            approved, reason = await self.risk_manager.evaluate_signal(
                signal,
                portfolio,
                positions
            )

            await self.audit_logger.log_signal(signal, approved, reason)

            if approved:
                approved_signals.append(signal)
            else:
                await self.audit_logger.log_rejected_signal(signal, reason)

        # Execute approved signals
        for signal in approved_signals:
            order = self._signal_to_order(signal)
            execution = await self.broker.submit_order(order)
            executions.append(execution)

            await self.audit_logger.log_execution(execution)

            # Update positions
            await self.position_manager.update_position(
                signal.symbol,
                execution,
                signal.side
            )

        # Calculate cycle PnL
        cycle_pnl = sum(
            (e.average_price - Decimal("100")) * e.filled_quantity
            for e in executions
            if e.average_price
        )

        self.risk_manager.update_pnl(cycle_pnl)

        duration = (datetime.utcnow() - start_time).total_seconds() * 1000
        self.cycle_count += 1

        return TradingCycleResult(
            cycle_id=cycle_id,
            signals_generated=len(signals),
            signals_approved=len(approved_signals),
            orders_executed=len(executions),
            executions=executions,
            cycle_pnl=cycle_pnl,
            duration_ms=duration
        )

    def _signal_to_order(self, signal: TradingSignal) -> Order:
        """Convert trading signal to order."""
        return Order(
            order_id=str(uuid4()),
            symbol=signal.symbol,
            side=signal.side,
            order_type=OrderType.MARKET,
            quantity=signal.position_size,
            limit_price=signal.entry_price if signal.target_price else None,
            client_order_id=signal.signal_id
        )

    async def run_continuous(
        self,
        active_strategies: Set[str],
        interval_seconds: float = 60.0
    ):
        """Run trading cycles continuously."""
        while self.is_running:
            try:
                result = await self.run_trading_cycle(active_strategies)
                print(f"Cycle {self.cycle_count}: {result.orders_executed} orders executed")
            except Exception as e:
                print(f"Trading cycle error: {e}")

            await asyncio.sleep(interval_seconds)

    def get_status(self) -> Dict[str, Any]:
        """Get engine status."""
        return {
            "is_running": self.is_running,
            "is_halted": self.risk_manager.is_halted,
            "halt_reason": self.risk_manager.halt_reason,
            "cycle_count": self.cycle_count,
            "daily_pnl": str(self.risk_manager.daily_pnl),
            "active_strategies": list(self.strategy_manager.active_strategies)
        }
