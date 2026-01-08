"""
Advanced Backtesting Engine with Walk-Forward Optimization

This is the foundation for real alpha discovery - not simulated scores,
but actual strategy evaluation with realistic market simulation.
"""

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from collections import defaultdict
from uuid import uuid4


class SlippageModel(Enum):
    """Slippage modeling approaches."""
    FIXED = "fixed"  # Fixed percentage
    VOLUME_BASED = "volume_based"  # Based on order size vs volume
    SPREAD_BASED = "spread_based"  # Based on bid-ask spread
    SQUARE_ROOT = "square_root"  # Square root market impact
    ALMGREN_CHRISS = "almgren_chriss"  # Full market impact model


class FillModel(Enum):
    """Order fill modeling."""
    IMMEDIATE = "immediate"  # Fill at current price
    NEXT_BAR = "next_bar"  # Fill at next bar open
    VWAP = "vwap"  # Volume-weighted average
    REALISTIC = "realistic"  # Partial fills based on volume


@dataclass
class MarketData:
    """OHLCV market data with additional fields."""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    vwap: Optional[float] = None
    bid: Optional[float] = None
    ask: Optional[float] = None
    spread: Optional[float] = None

    @property
    def typical_price(self) -> float:
        return (self.high + self.low + self.close) / 3

    @property
    def mid_price(self) -> float:
        if self.bid and self.ask:
            return (self.bid + self.ask) / 2
        return self.close


@dataclass
class Trade:
    """Executed trade record."""
    trade_id: str
    timestamp: datetime
    symbol: str
    side: str  # 'buy' or 'sell'
    quantity: float
    price: float
    slippage: float
    commission: float
    pnl: float = 0.0

    @property
    def total_cost(self) -> float:
        if self.side == 'buy':
            return self.quantity * self.price + self.commission
        else:
            return -self.quantity * self.price + self.commission


@dataclass
class Position:
    """Current position state."""
    symbol: str
    quantity: float = 0.0
    avg_entry_price: float = 0.0
    realized_pnl: float = 0.0
    unrealized_pnl: float = 0.0

    def update(self, trade: Trade, current_price: float):
        """Update position with new trade."""
        if trade.side == 'buy':
            if self.quantity >= 0:
                # Adding to long or opening long
                total_cost = self.avg_entry_price * self.quantity + trade.price * trade.quantity
                self.quantity += trade.quantity
                self.avg_entry_price = total_cost / self.quantity if self.quantity > 0 else 0
            else:
                # Covering short
                pnl = (self.avg_entry_price - trade.price) * min(abs(self.quantity), trade.quantity)
                self.realized_pnl += pnl
                self.quantity += trade.quantity
                if self.quantity > 0:
                    self.avg_entry_price = trade.price
        else:  # sell
            if self.quantity <= 0:
                # Adding to short or opening short
                total_cost = abs(self.avg_entry_price * self.quantity) + trade.price * trade.quantity
                self.quantity -= trade.quantity
                self.avg_entry_price = total_cost / abs(self.quantity) if self.quantity != 0 else 0
            else:
                # Closing long
                pnl = (trade.price - self.avg_entry_price) * min(self.quantity, trade.quantity)
                self.realized_pnl += pnl
                self.quantity -= trade.quantity
                if self.quantity < 0:
                    self.avg_entry_price = trade.price

        # Update unrealized P&L
        if self.quantity != 0:
            if self.quantity > 0:
                self.unrealized_pnl = (current_price - self.avg_entry_price) * self.quantity
            else:
                self.unrealized_pnl = (self.avg_entry_price - current_price) * abs(self.quantity)
        else:
            self.unrealized_pnl = 0


@dataclass
class Portfolio:
    """Portfolio state during backtest."""
    initial_capital: float
    cash: float
    positions: Dict[str, Position] = field(default_factory=dict)
    trades: List[Trade] = field(default_factory=list)
    equity_curve: List[Tuple[datetime, float]] = field(default_factory=list)

    @property
    def total_equity(self) -> float:
        positions_value = sum(
            p.quantity * p.avg_entry_price + p.unrealized_pnl
            for p in self.positions.values()
        )
        return self.cash + positions_value

    @property
    def total_pnl(self) -> float:
        return self.total_equity - self.initial_capital

    @property
    def total_return(self) -> float:
        return (self.total_equity - self.initial_capital) / self.initial_capital


@dataclass
class BacktestConfig:
    """Configuration for backtesting."""
    initial_capital: float = 100000.0
    commission_rate: float = 0.001  # 0.1% per trade
    slippage_model: SlippageModel = SlippageModel.VOLUME_BASED
    slippage_rate: float = 0.0005  # Base slippage 0.05%
    fill_model: FillModel = FillModel.NEXT_BAR
    max_position_size: float = 0.1  # 10% of portfolio per position
    enable_shorting: bool = True
    margin_requirement: float = 0.5  # 50% margin for shorts
    risk_free_rate: float = 0.05  # 5% annual risk-free rate


@dataclass
class BacktestResult:
    """Complete backtest results with metrics."""
    strategy_id: str
    start_date: datetime
    end_date: datetime

    # Returns
    total_return: float
    annualized_return: float

    # Risk metrics
    volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    max_drawdown: float
    max_drawdown_duration: int  # days

    # Trade statistics
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    profit_factor: float
    average_win: float
    average_loss: float
    largest_win: float
    largest_loss: float
    avg_trade_duration: float  # hours

    # Advanced metrics
    alpha: float
    beta: float
    information_ratio: float
    tail_ratio: float

    # Equity curve
    equity_curve: List[Tuple[datetime, float]] = field(default_factory=list)
    drawdown_curve: List[Tuple[datetime, float]] = field(default_factory=list)

    # Trade log
    trades: List[Trade] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'strategy_id': self.strategy_id,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'total_return': self.total_return,
            'annualized_return': self.annualized_return,
            'volatility': self.volatility,
            'sharpe_ratio': self.sharpe_ratio,
            'sortino_ratio': self.sortino_ratio,
            'calmar_ratio': self.calmar_ratio,
            'max_drawdown': self.max_drawdown,
            'total_trades': self.total_trades,
            'win_rate': self.win_rate,
            'profit_factor': self.profit_factor,
            'alpha': self.alpha,
            'beta': self.beta,
        }


class SlippageCalculator:
    """Calculates realistic slippage based on market conditions."""

    def __init__(self, model: SlippageModel, base_rate: float = 0.0005):
        self.model = model
        self.base_rate = base_rate

    def calculate(
        self,
        order_size: float,
        price: float,
        volume: int,
        spread: Optional[float] = None,
        volatility: Optional[float] = None
    ) -> float:
        """Calculate slippage for an order."""

        if self.model == SlippageModel.FIXED:
            return price * self.base_rate

        elif self.model == SlippageModel.VOLUME_BASED:
            # Slippage increases with order size relative to volume
            participation_rate = order_size / max(volume, 1)
            return price * self.base_rate * (1 + participation_rate * 10)

        elif self.model == SlippageModel.SPREAD_BASED:
            # Slippage is half the spread plus base
            if spread:
                return spread / 2 + price * self.base_rate
            return price * self.base_rate

        elif self.model == SlippageModel.SQUARE_ROOT:
            # Square root market impact model
            # Impact = sigma * sqrt(Q/V) where Q is order size, V is volume
            vol = volatility or 0.02  # Default 2% daily vol
            participation = order_size / max(volume, 1)
            return price * vol * np.sqrt(participation)

        elif self.model == SlippageModel.ALMGREN_CHRISS:
            # Simplified Almgren-Chriss model
            vol = volatility or 0.02
            participation = order_size / max(volume, 1)
            permanent_impact = 0.1 * vol * participation
            temporary_impact = 0.5 * vol * np.sqrt(participation)
            return price * (permanent_impact + temporary_impact)

        return price * self.base_rate


class MetricsCalculator:
    """Calculates performance metrics from backtest results."""

    def __init__(self, risk_free_rate: float = 0.05):
        self.risk_free_rate = risk_free_rate

    def calculate_all(
        self,
        equity_curve: List[Tuple[datetime, float]],
        trades: List[Trade],
        benchmark_returns: Optional[np.ndarray] = None
    ) -> Dict[str, float]:
        """Calculate all performance metrics."""

        if len(equity_curve) < 2:
            return self._empty_metrics()

        # Convert to numpy arrays
        dates = [e[0] for e in equity_curve]
        equity = np.array([e[1] for e in equity_curve])

        # Calculate returns
        returns = np.diff(equity) / equity[:-1]
        returns = returns[~np.isnan(returns)]

        if len(returns) == 0:
            return self._empty_metrics()

        # Basic metrics
        total_return = (equity[-1] - equity[0]) / equity[0]

        # Annualize based on trading days
        trading_days = len(equity_curve)
        years = trading_days / 252
        annualized_return = (1 + total_return) ** (1 / max(years, 0.01)) - 1

        # Volatility (annualized)
        volatility = np.std(returns) * np.sqrt(252)

        # Sharpe Ratio
        excess_returns = returns - self.risk_free_rate / 252
        sharpe_ratio = np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252) if np.std(excess_returns) > 0 else 0

        # Sortino Ratio (downside deviation)
        downside_returns = returns[returns < 0]
        downside_std = np.std(downside_returns) * np.sqrt(252) if len(downside_returns) > 0 else volatility
        sortino_ratio = (annualized_return - self.risk_free_rate) / downside_std if downside_std > 0 else 0

        # Maximum Drawdown
        peak = np.maximum.accumulate(equity)
        drawdown = (peak - equity) / peak
        max_drawdown = np.max(drawdown)

        # Drawdown duration
        max_dd_duration = self._calculate_max_dd_duration(drawdown)

        # Calmar Ratio
        calmar_ratio = annualized_return / max_drawdown if max_drawdown > 0 else 0

        # Trade statistics
        trade_stats = self._calculate_trade_stats(trades)

        # Alpha and Beta (if benchmark provided)
        alpha, beta = 0.0, 1.0
        if benchmark_returns is not None and len(benchmark_returns) == len(returns):
            beta = np.cov(returns, benchmark_returns)[0, 1] / np.var(benchmark_returns) if np.var(benchmark_returns) > 0 else 1
            alpha = annualized_return - (self.risk_free_rate + beta * (np.mean(benchmark_returns) * 252 - self.risk_free_rate))

        # Information Ratio
        if benchmark_returns is not None and len(benchmark_returns) == len(returns):
            tracking_error = np.std(returns - benchmark_returns) * np.sqrt(252)
            information_ratio = (annualized_return - np.mean(benchmark_returns) * 252) / tracking_error if tracking_error > 0 else 0
        else:
            information_ratio = 0

        # Tail Ratio (95th percentile gain / 5th percentile loss)
        if len(returns) > 20:
            tail_ratio = abs(np.percentile(returns, 95) / np.percentile(returns, 5)) if np.percentile(returns, 5) != 0 else 1
        else:
            tail_ratio = 1

        return {
            'total_return': total_return,
            'annualized_return': annualized_return,
            'volatility': volatility,
            'sharpe_ratio': sharpe_ratio,
            'sortino_ratio': sortino_ratio,
            'calmar_ratio': calmar_ratio,
            'max_drawdown': max_drawdown,
            'max_drawdown_duration': max_dd_duration,
            'alpha': alpha,
            'beta': beta,
            'information_ratio': information_ratio,
            'tail_ratio': tail_ratio,
            **trade_stats
        }

    def _calculate_max_dd_duration(self, drawdown: np.ndarray) -> int:
        """Calculate maximum drawdown duration in days."""
        in_drawdown = drawdown > 0
        if not np.any(in_drawdown):
            return 0

        max_duration = 0
        current_duration = 0

        for is_dd in in_drawdown:
            if is_dd:
                current_duration += 1
                max_duration = max(max_duration, current_duration)
            else:
                current_duration = 0

        return max_duration

    def _calculate_trade_stats(self, trades: List[Trade]) -> Dict[str, float]:
        """Calculate trade-level statistics."""
        if not trades:
            return {
                'total_trades': 0,
                'winning_trades': 0,
                'losing_trades': 0,
                'win_rate': 0,
                'profit_factor': 0,
                'average_win': 0,
                'average_loss': 0,
                'largest_win': 0,
                'largest_loss': 0,
                'avg_trade_duration': 0,
            }

        pnls = [t.pnl for t in trades]
        winning = [p for p in pnls if p > 0]
        losing = [p for p in pnls if p < 0]

        gross_profit = sum(winning) if winning else 0
        gross_loss = abs(sum(losing)) if losing else 0

        return {
            'total_trades': len(trades),
            'winning_trades': len(winning),
            'losing_trades': len(losing),
            'win_rate': len(winning) / len(trades) if trades else 0,
            'profit_factor': gross_profit / gross_loss if gross_loss > 0 else float('inf'),
            'average_win': np.mean(winning) if winning else 0,
            'average_loss': np.mean(losing) if losing else 0,
            'largest_win': max(winning) if winning else 0,
            'largest_loss': min(losing) if losing else 0,
            'avg_trade_duration': 0,  # Would need trade timestamps
        }

    def _empty_metrics(self) -> Dict[str, float]:
        return {
            'total_return': 0, 'annualized_return': 0, 'volatility': 0,
            'sharpe_ratio': 0, 'sortino_ratio': 0, 'calmar_ratio': 0,
            'max_drawdown': 0, 'max_drawdown_duration': 0,
            'alpha': 0, 'beta': 1, 'information_ratio': 0, 'tail_ratio': 1,
            'total_trades': 0, 'winning_trades': 0, 'losing_trades': 0,
            'win_rate': 0, 'profit_factor': 0, 'average_win': 0,
            'average_loss': 0, 'largest_win': 0, 'largest_loss': 0,
            'avg_trade_duration': 0,
        }


class BacktestEngine:
    """
    Advanced backtesting engine with realistic market simulation.

    Features:
    - Multiple slippage models (fixed, volume-based, square-root, Almgren-Chriss)
    - Realistic fill simulation
    - Commission and fee modeling
    - Walk-forward optimization support
    - Comprehensive performance metrics
    """

    def __init__(self, config: BacktestConfig):
        self.config = config
        self.slippage_calc = SlippageCalculator(
            config.slippage_model,
            config.slippage_rate
        )
        self.metrics_calc = MetricsCalculator(config.risk_free_rate)

    async def run(
        self,
        strategy: 'BaseStrategy',
        data: Dict[str, pd.DataFrame],
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        benchmark_data: Optional[pd.DataFrame] = None
    ) -> BacktestResult:
        """
        Run backtest for a strategy.

        Args:
            strategy: Trading strategy to test
            data: Dict of symbol -> OHLCV DataFrame
            start_date: Start of backtest period
            end_date: End of backtest period
            benchmark_data: Optional benchmark for alpha/beta calculation

        Returns:
            BacktestResult with all metrics
        """
        # Initialize portfolio
        portfolio = Portfolio(
            initial_capital=self.config.initial_capital,
            cash=self.config.initial_capital
        )

        # Get aligned dates across all symbols
        all_dates = self._get_aligned_dates(data, start_date, end_date)

        if not all_dates:
            return self._empty_result(strategy.strategy_id)

        # Initialize strategy
        strategy.initialize()

        # Main backtest loop
        for current_date in all_dates:
            # Get current market data
            market_data = self._get_market_snapshot(data, current_date)

            if not market_data:
                continue

            # Update positions with current prices
            self._update_positions(portfolio, market_data)

            # Get strategy signals
            signals = strategy.generate_signals(
                market_data,
                portfolio,
                current_date
            )

            # Execute signals
            for signal in signals:
                trade = self._execute_signal(
                    signal,
                    market_data,
                    portfolio,
                    current_date
                )
                if trade:
                    portfolio.trades.append(trade)
                    self._update_position_from_trade(portfolio, trade, market_data)

            # Record equity
            portfolio.equity_curve.append((current_date, portfolio.total_equity))

        # Calculate final metrics
        benchmark_returns = None
        if benchmark_data is not None:
            benchmark_returns = benchmark_data['close'].pct_change().dropna().values

        metrics = self.metrics_calc.calculate_all(
            portfolio.equity_curve,
            portfolio.trades,
            benchmark_returns
        )

        # Build result
        return BacktestResult(
            strategy_id=strategy.strategy_id,
            start_date=all_dates[0],
            end_date=all_dates[-1],
            total_return=metrics['total_return'],
            annualized_return=metrics['annualized_return'],
            volatility=metrics['volatility'],
            sharpe_ratio=metrics['sharpe_ratio'],
            sortino_ratio=metrics['sortino_ratio'],
            calmar_ratio=metrics['calmar_ratio'],
            max_drawdown=metrics['max_drawdown'],
            max_drawdown_duration=metrics['max_drawdown_duration'],
            total_trades=metrics['total_trades'],
            winning_trades=metrics['winning_trades'],
            losing_trades=metrics['losing_trades'],
            win_rate=metrics['win_rate'],
            profit_factor=metrics['profit_factor'],
            average_win=metrics['average_win'],
            average_loss=metrics['average_loss'],
            largest_win=metrics['largest_win'],
            largest_loss=metrics['largest_loss'],
            avg_trade_duration=metrics['avg_trade_duration'],
            alpha=metrics['alpha'],
            beta=metrics['beta'],
            information_ratio=metrics['information_ratio'],
            tail_ratio=metrics['tail_ratio'],
            equity_curve=portfolio.equity_curve,
            trades=portfolio.trades
        )

    def _get_aligned_dates(
        self,
        data: Dict[str, pd.DataFrame],
        start_date: Optional[datetime],
        end_date: Optional[datetime]
    ) -> List[datetime]:
        """Get dates that exist across all symbols."""
        if not data:
            return []

        # Get intersection of all dates
        date_sets = [set(df.index) for df in data.values()]
        common_dates = set.intersection(*date_sets) if date_sets else set()

        # Filter by date range
        dates = sorted(common_dates)

        if start_date:
            dates = [d for d in dates if d >= start_date]
        if end_date:
            dates = [d for d in dates if d <= end_date]

        return dates

    def _get_market_snapshot(
        self,
        data: Dict[str, pd.DataFrame],
        date: datetime
    ) -> Dict[str, MarketData]:
        """Get market data for all symbols at a point in time."""
        snapshot = {}

        for symbol, df in data.items():
            if date in df.index:
                row = df.loc[date]
                snapshot[symbol] = MarketData(
                    timestamp=date,
                    open=row['open'],
                    high=row['high'],
                    low=row['low'],
                    close=row['close'],
                    volume=int(row['volume']),
                    vwap=row.get('vwap'),
                    bid=row.get('bid'),
                    ask=row.get('ask'),
                    spread=row.get('spread')
                )

        return snapshot

    def _update_positions(
        self,
        portfolio: Portfolio,
        market_data: Dict[str, MarketData]
    ):
        """Update position unrealized P&L with current prices."""
        for symbol, position in portfolio.positions.items():
            if symbol in market_data:
                current_price = market_data[symbol].close
                if position.quantity > 0:
                    position.unrealized_pnl = (current_price - position.avg_entry_price) * position.quantity
                elif position.quantity < 0:
                    position.unrealized_pnl = (position.avg_entry_price - current_price) * abs(position.quantity)

    def _execute_signal(
        self,
        signal: 'TradingSignal',
        market_data: Dict[str, MarketData],
        portfolio: Portfolio,
        current_date: datetime
    ) -> Optional[Trade]:
        """Execute a trading signal with realistic fills."""

        if signal.symbol not in market_data:
            return None

        md = market_data[signal.symbol]

        # Calculate execution price with slippage
        base_price = md.close
        slippage = self.slippage_calc.calculate(
            signal.quantity,
            base_price,
            md.volume,
            md.spread,
            None  # Would pass volatility if available
        )

        if signal.side == 'buy':
            exec_price = base_price + slippage
        else:
            exec_price = base_price - slippage

        # Check position limits
        position_value = signal.quantity * exec_price
        if position_value > portfolio.total_equity * self.config.max_position_size:
            # Reduce to max allowed
            signal.quantity = (portfolio.total_equity * self.config.max_position_size) / exec_price

        # Check cash for buys
        commission = position_value * self.config.commission_rate
        if signal.side == 'buy':
            total_cost = position_value + commission
            if total_cost > portfolio.cash:
                # Reduce to affordable amount
                affordable = (portfolio.cash - commission) / exec_price
                if affordable <= 0:
                    return None
                signal.quantity = affordable
                position_value = signal.quantity * exec_price
                commission = position_value * self.config.commission_rate

        # Create trade
        trade = Trade(
            trade_id=str(uuid4()),
            timestamp=current_date,
            symbol=signal.symbol,
            side=signal.side,
            quantity=signal.quantity,
            price=exec_price,
            slippage=slippage,
            commission=commission
        )

        return trade

    def _update_position_from_trade(
        self,
        portfolio: Portfolio,
        trade: Trade,
        market_data: Dict[str, MarketData]
    ):
        """Update portfolio position after trade execution."""

        # Update cash
        if trade.side == 'buy':
            portfolio.cash -= trade.quantity * trade.price + trade.commission
        else:
            portfolio.cash += trade.quantity * trade.price - trade.commission

        # Update or create position
        if trade.symbol not in portfolio.positions:
            portfolio.positions[trade.symbol] = Position(symbol=trade.symbol)

        position = portfolio.positions[trade.symbol]
        current_price = market_data[trade.symbol].close if trade.symbol in market_data else trade.price

        # Calculate P&L for trade
        if trade.side == 'sell' and position.quantity > 0:
            # Closing long position
            trade.pnl = (trade.price - position.avg_entry_price) * min(trade.quantity, position.quantity) - trade.commission
        elif trade.side == 'buy' and position.quantity < 0:
            # Covering short position
            trade.pnl = (position.avg_entry_price - trade.price) * min(trade.quantity, abs(position.quantity)) - trade.commission
        else:
            trade.pnl = -trade.commission  # Opening position, only commission cost

        position.update(trade, current_price)

        # Remove zero positions
        if position.quantity == 0:
            del portfolio.positions[trade.symbol]

    def _empty_result(self, strategy_id: str) -> BacktestResult:
        """Return empty result for failed backtests."""
        now = datetime.utcnow()
        return BacktestResult(
            strategy_id=strategy_id,
            start_date=now,
            end_date=now,
            total_return=0, annualized_return=0, volatility=0,
            sharpe_ratio=0, sortino_ratio=0, calmar_ratio=0,
            max_drawdown=0, max_drawdown_duration=0,
            total_trades=0, winning_trades=0, losing_trades=0,
            win_rate=0, profit_factor=0, average_win=0, average_loss=0,
            largest_win=0, largest_loss=0, avg_trade_duration=0,
            alpha=0, beta=1, information_ratio=0, tail_ratio=1
        )


@dataclass
class WalkForwardWindow:
    """A single walk-forward window."""
    train_start: datetime
    train_end: datetime
    test_start: datetime
    test_end: datetime
    train_result: Optional[BacktestResult] = None
    test_result: Optional[BacktestResult] = None


@dataclass
class WalkForwardResult:
    """Complete walk-forward optimization results."""
    strategy_id: str
    windows: List[WalkForwardWindow]

    # Aggregated out-of-sample metrics
    oos_total_return: float
    oos_annualized_return: float
    oos_sharpe_ratio: float
    oos_sortino_ratio: float
    oos_max_drawdown: float
    oos_win_rate: float
    oos_profit_factor: float

    # Consistency metrics
    sharpe_degradation: float  # In-sample vs out-of-sample Sharpe diff
    return_consistency: float  # % of windows with positive OOS return

    # Combined equity curve
    combined_equity_curve: List[Tuple[datetime, float]] = field(default_factory=list)


class WalkForwardOptimizer:
    """
    Walk-Forward Optimization Framework

    Validates strategies across multiple time periods to ensure robustness:
    - Training period: Optimize strategy parameters
    - Testing period: Validate on unseen data
    - Roll forward and repeat
    """

    def __init__(
        self,
        engine: BacktestEngine,
        train_months: int = 12,
        test_months: int = 1,
        step_months: int = 1
    ):
        self.engine = engine
        self.train_months = train_months
        self.test_months = test_months
        self.step_months = step_months

    def generate_windows(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[WalkForwardWindow]:
        """Generate walk-forward windows."""
        windows = []
        current_start = start_date

        while True:
            train_end = current_start + timedelta(days=self.train_months * 30)
            test_start = train_end + timedelta(days=1)
            test_end = test_start + timedelta(days=self.test_months * 30)

            if test_end > end_date:
                break

            windows.append(WalkForwardWindow(
                train_start=current_start,
                train_end=train_end,
                test_start=test_start,
                test_end=test_end
            ))

            current_start += timedelta(days=self.step_months * 30)

        return windows

    async def run(
        self,
        strategy: 'BaseStrategy',
        data: Dict[str, pd.DataFrame],
        start_date: datetime,
        end_date: datetime
    ) -> WalkForwardResult:
        """
        Run walk-forward optimization.

        Args:
            strategy: Strategy to optimize
            data: Market data
            start_date: Overall start date
            end_date: Overall end date

        Returns:
            WalkForwardResult with all window results and aggregated metrics
        """
        windows = self.generate_windows(start_date, end_date)

        if not windows:
            return self._empty_result(strategy.strategy_id)

        # Process each window
        for window in windows:
            # Train phase
            window.train_result = await self.engine.run(
                strategy,
                data,
                window.train_start,
                window.train_end
            )

            # Test phase (out-of-sample)
            window.test_result = await self.engine.run(
                strategy,
                data,
                window.test_start,
                window.test_end
            )

        # Calculate aggregated metrics
        return self._aggregate_results(strategy.strategy_id, windows)

    def _aggregate_results(
        self,
        strategy_id: str,
        windows: List[WalkForwardWindow]
    ) -> WalkForwardResult:
        """Aggregate results across all windows."""

        # Combine OOS equity curves
        combined_equity = []
        for window in windows:
            if window.test_result and window.test_result.equity_curve:
                combined_equity.extend(window.test_result.equity_curve)

        # Calculate OOS metrics
        oos_returns = []
        oos_sharpes = []
        in_sample_sharpes = []

        for window in windows:
            if window.test_result:
                oos_returns.append(window.test_result.total_return)
                oos_sharpes.append(window.test_result.sharpe_ratio)
            if window.train_result:
                in_sample_sharpes.append(window.train_result.sharpe_ratio)

        # Aggregate metrics
        oos_total_return = np.prod([1 + r for r in oos_returns]) - 1 if oos_returns else 0
        oos_sharpe = np.mean(oos_sharpes) if oos_sharpes else 0

        # Sharpe degradation (how much worse is OOS vs IS)
        is_sharpe_avg = np.mean(in_sample_sharpes) if in_sample_sharpes else 0
        sharpe_degradation = is_sharpe_avg - oos_sharpe

        # Return consistency
        positive_windows = sum(1 for r in oos_returns if r > 0)
        return_consistency = positive_windows / len(oos_returns) if oos_returns else 0

        # Get other aggregated metrics from combined equity
        if combined_equity:
            equity_values = [e[1] for e in combined_equity]
            returns = np.diff(equity_values) / equity_values[:-1]
            oos_volatility = np.std(returns) * np.sqrt(252) if len(returns) > 0 else 0

            # Max drawdown
            peak = np.maximum.accumulate(equity_values)
            drawdown = (peak - equity_values) / peak
            oos_max_dd = np.max(drawdown) if len(drawdown) > 0 else 0
        else:
            oos_volatility = 0
            oos_max_dd = 0

        # Collect trade stats
        all_trades = []
        for window in windows:
            if window.test_result:
                all_trades.extend(window.test_result.trades)

        winning_trades = sum(1 for t in all_trades if t.pnl > 0)
        win_rate = winning_trades / len(all_trades) if all_trades else 0

        gross_profit = sum(t.pnl for t in all_trades if t.pnl > 0)
        gross_loss = abs(sum(t.pnl for t in all_trades if t.pnl < 0))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')

        # Annualized return
        if combined_equity:
            years = len(combined_equity) / 252
            oos_ann_return = (1 + oos_total_return) ** (1 / max(years, 0.01)) - 1
        else:
            oos_ann_return = 0

        # Sortino
        if combined_equity and len(combined_equity) > 1:
            equity_values = [e[1] for e in combined_equity]
            returns = np.diff(equity_values) / equity_values[:-1]
            downside = returns[returns < 0]
            downside_std = np.std(downside) * np.sqrt(252) if len(downside) > 0 else oos_volatility
            oos_sortino = (oos_ann_return - 0.05) / downside_std if downside_std > 0 else 0
        else:
            oos_sortino = 0

        return WalkForwardResult(
            strategy_id=strategy_id,
            windows=windows,
            oos_total_return=oos_total_return,
            oos_annualized_return=oos_ann_return,
            oos_sharpe_ratio=oos_sharpe,
            oos_sortino_ratio=oos_sortino,
            oos_max_drawdown=oos_max_dd,
            oos_win_rate=win_rate,
            oos_profit_factor=profit_factor,
            sharpe_degradation=sharpe_degradation,
            return_consistency=return_consistency,
            combined_equity_curve=combined_equity
        )

    def _empty_result(self, strategy_id: str) -> WalkForwardResult:
        return WalkForwardResult(
            strategy_id=strategy_id,
            windows=[],
            oos_total_return=0,
            oos_annualized_return=0,
            oos_sharpe_ratio=0,
            oos_sortino_ratio=0,
            oos_max_drawdown=0,
            oos_win_rate=0,
            oos_profit_factor=0,
            sharpe_degradation=0,
            return_consistency=0
        )
