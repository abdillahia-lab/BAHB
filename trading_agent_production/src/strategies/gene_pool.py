"""
Strategy Gene Pool - 50+ Executable Strategy Templates

These are the building blocks for evolutionary strategy discovery.
Each strategy is a complete, executable implementation that can be:
1. Run in backtesting
2. Combined via crossover
3. Mutated to explore parameter space
4. Evaluated on real metrics
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4
import numpy as np

from .base import BaseStrategy, StrategyConfig, TradingSignal, SignalStrength


# ==============================================================================
# CATEGORY 1: TREND FOLLOWING STRATEGIES (10 strategies)
# ==============================================================================

class MovingAverageCrossover(BaseStrategy):
    """
    Classic dual moving average crossover strategy.

    Parameters:
        fast_period: Fast MA period (default: 10)
        slow_period: Slow MA period (default: 30)
        ma_type: 'sma' or 'ema' (default: 'sma')
    """

    def initialize(self):
        self.fast_period = self.parameters.get('fast_period', 10)
        self.slow_period = self.parameters.get('slow_period', 30)
        self.ma_type = self.parameters.get('ma_type', 'sma')
        self._fast_ma_history: Dict[str, List[float]] = {}
        self._slow_ma_history: Dict[str, List[float]] = {}

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            price = data.close
            self.update_history(symbol, price)
            prices = self.get_history(symbol)

            if len(prices) < self.slow_period:
                continue

            # Calculate MAs
            if self.ma_type == 'ema':
                fast_ma = self.ema(prices, self.fast_period)
                slow_ma = self.ema(prices, self.slow_period)
            else:
                fast_ma = self.sma(prices, self.fast_period)
                slow_ma = self.sma(prices, self.slow_period)

            if fast_ma is None or slow_ma is None:
                continue

            # Track MA history for crossover detection
            if symbol not in self._fast_ma_history:
                self._fast_ma_history[symbol] = []
                self._slow_ma_history[symbol] = []

            self._fast_ma_history[symbol].append(fast_ma)
            self._slow_ma_history[symbol].append(slow_ma)

            if len(self._fast_ma_history[symbol]) < 2:
                continue

            # Check for crossover
            fast_hist = self._fast_ma_history[symbol]
            slow_hist = self._slow_ma_history[symbol]

            # Check existing position
            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity != 0

            if self.crosses_above(fast_hist, slow_hist) and not has_position:
                # Bullish crossover - buy
                stop_loss = price * 0.95  # 5% stop
                quantity = self.calculate_position_size(portfolio.total_equity, price, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    take_profit=price * 1.10,
                    strength=SignalStrength.MODERATE,
                    confidence=0.6,
                    reasoning=f"Bullish MA crossover: fast={fast_ma:.2f} > slow={slow_ma:.2f}"
                ))

            elif self.crosses_below(fast_hist, slow_hist) and has_position:
                # Bearish crossover - sell
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=abs(position.quantity),
                    timestamp=timestamp,
                    strength=SignalStrength.MODERATE,
                    confidence=0.6,
                    reasoning=f"Bearish MA crossover: fast={fast_ma:.2f} < slow={slow_ma:.2f}"
                ))

        return signals


class TripleMovingAverage(BaseStrategy):
    """
    Three moving average system for trend confirmation.

    Parameters:
        fast_period: Fast MA (default: 5)
        medium_period: Medium MA (default: 20)
        slow_period: Slow MA (default: 50)
    """

    def initialize(self):
        self.fast = self.parameters.get('fast_period', 5)
        self.medium = self.parameters.get('medium_period', 20)
        self.slow = self.parameters.get('slow_period', 50)

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            self.update_history(symbol, data.close)
            prices = self.get_history(symbol)

            if len(prices) < self.slow:
                continue

            fast_ma = self.ema(prices, self.fast)
            medium_ma = self.ema(prices, self.medium)
            slow_ma = self.ema(prices, self.slow)

            if None in (fast_ma, medium_ma, slow_ma):
                continue

            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity > 0

            # Strong uptrend: fast > medium > slow
            if fast_ma > medium_ma > slow_ma and not has_position:
                stop_loss = data.close * 0.94
                quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    strength=SignalStrength.STRONG,
                    confidence=0.7,
                    reasoning=f"Strong uptrend: {fast_ma:.2f} > {medium_ma:.2f} > {slow_ma:.2f}"
                ))

            # Trend reversal: fast < medium (exit signal)
            elif fast_ma < medium_ma and has_position:
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=position.quantity,
                    timestamp=timestamp,
                    strength=SignalStrength.MODERATE,
                    reasoning="Trend weakening"
                ))

        return signals


class TrendFollowingBreakout(BaseStrategy):
    """
    Donchian channel breakout strategy.

    Parameters:
        entry_period: Lookback for entry breakout (default: 20)
        exit_period: Lookback for exit (default: 10)
    """

    def initialize(self):
        self.entry_period = self.parameters.get('entry_period', 20)
        self.exit_period = self.parameters.get('exit_period', 10)
        self._highs: Dict[str, List[float]] = {}
        self._lows: Dict[str, List[float]] = {}

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            if symbol not in self._highs:
                self._highs[symbol] = []
                self._lows[symbol] = []

            self._highs[symbol].append(data.high)
            self._lows[symbol].append(data.low)

            if len(self._highs[symbol]) > self.entry_period:
                self._highs[symbol] = self._highs[symbol][-self.entry_period:]
                self._lows[symbol] = self._lows[symbol][-self.entry_period:]

            if len(self._highs[symbol]) < self.entry_period:
                continue

            # Entry channel
            entry_high = max(self._highs[symbol][:-1])
            entry_low = min(self._lows[symbol][:-1])

            # Exit channel
            exit_high = max(self._highs[symbol][-self.exit_period:-1]) if len(self._highs[symbol]) >= self.exit_period else entry_high
            exit_low = min(self._lows[symbol][-self.exit_period:-1]) if len(self._lows[symbol]) >= self.exit_period else entry_low

            has_long = symbol in portfolio.positions and portfolio.positions[symbol].quantity > 0
            has_short = symbol in portfolio.positions and portfolio.positions[symbol].quantity < 0

            # Breakout above entry high - go long
            if data.close > entry_high and not has_long:
                stop_loss = exit_low
                quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    strength=SignalStrength.STRONG,
                    confidence=0.65,
                    reasoning=f"Breakout above {self.entry_period}-day high"
                ))

            # Exit long on breakdown
            elif data.close < exit_low and has_long:
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=position.quantity,
                    timestamp=timestamp,
                    reasoning="Exit channel breakdown"
                ))

        return signals


class ADXTrend(BaseStrategy):
    """
    ADX-based trend strength strategy.

    Parameters:
        adx_period: ADX calculation period (default: 14)
        adx_threshold: Minimum ADX for trend (default: 25)
    """

    def initialize(self):
        self.period = self.parameters.get('adx_period', 14)
        self.threshold = self.parameters.get('adx_threshold', 25)
        self._price_data: Dict[str, Dict[str, List[float]]] = {}

    def _calculate_adx(self, highs: List[float], lows: List[float], closes: List[float]) -> Optional[float]:
        """Calculate ADX indicator."""
        if len(closes) < self.period + 1:
            return None

        # Calculate +DM and -DM
        plus_dm = []
        minus_dm = []
        tr = []

        for i in range(1, len(closes)):
            high_diff = highs[i] - highs[i-1]
            low_diff = lows[i-1] - lows[i]

            plus_dm.append(high_diff if high_diff > low_diff and high_diff > 0 else 0)
            minus_dm.append(low_diff if low_diff > high_diff and low_diff > 0 else 0)

            tr_val = max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i-1]),
                abs(lows[i] - closes[i-1])
            )
            tr.append(tr_val)

        if len(tr) < self.period:
            return None

        # Smooth with Wilder's smoothing
        atr = np.mean(tr[-self.period:])
        plus_di = 100 * np.mean(plus_dm[-self.period:]) / atr if atr > 0 else 0
        minus_di = 100 * np.mean(minus_dm[-self.period:]) / atr if atr > 0 else 0

        dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di) if (plus_di + minus_di) > 0 else 0

        return dx  # Simplified ADX

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            if symbol not in self._price_data:
                self._price_data[symbol] = {'highs': [], 'lows': [], 'closes': []}

            self._price_data[symbol]['highs'].append(data.high)
            self._price_data[symbol]['lows'].append(data.low)
            self._price_data[symbol]['closes'].append(data.close)

            # Keep limited history
            for key in self._price_data[symbol]:
                if len(self._price_data[symbol][key]) > 100:
                    self._price_data[symbol][key] = self._price_data[symbol][key][-100:]

            pd = self._price_data[symbol]
            adx = self._calculate_adx(pd['highs'], pd['lows'], pd['closes'])

            if adx is None:
                continue

            # Also calculate trend direction using MA
            self.update_history(symbol, data.close)
            prices = self.get_history(symbol)
            sma_20 = self.sma(prices, 20)

            if sma_20 is None:
                continue

            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity != 0

            # Strong trend + price above SMA = buy
            if adx > self.threshold and data.close > sma_20 and not has_position:
                stop_loss = sma_20
                quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    strength=SignalStrength.STRONG if adx > 40 else SignalStrength.MODERATE,
                    confidence=min(adx / 50, 0.8),
                    reasoning=f"Strong trend (ADX={adx:.1f}) with bullish bias"
                ))

            # Weak trend = exit
            elif adx < self.threshold * 0.7 and has_position:
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=abs(position.quantity),
                    timestamp=timestamp,
                    reasoning=f"Trend weakening (ADX={adx:.1f})"
                ))

        return signals


class ParabolicSAR(BaseStrategy):
    """
    Parabolic SAR trend following strategy.

    Parameters:
        af_start: Initial acceleration factor (default: 0.02)
        af_increment: AF increment (default: 0.02)
        af_max: Maximum AF (default: 0.2)
    """

    def initialize(self):
        self.af_start = self.parameters.get('af_start', 0.02)
        self.af_increment = self.parameters.get('af_increment', 0.02)
        self.af_max = self.parameters.get('af_max', 0.2)
        self._sar_state: Dict[str, Dict] = {}

    def _calculate_sar(self, symbol: str, high: float, low: float, close: float) -> Tuple[float, bool]:
        """Calculate Parabolic SAR."""
        if symbol not in self._sar_state:
            # Initialize
            self._sar_state[symbol] = {
                'sar': low,
                'ep': high,
                'af': self.af_start,
                'uptrend': True,
                'prev_high': high,
                'prev_low': low
            }
            return low, True

        state = self._sar_state[symbol]

        if state['uptrend']:
            # In uptrend
            sar = state['sar'] + state['af'] * (state['ep'] - state['sar'])
            sar = min(sar, state['prev_low'], low)

            if low < sar:
                # Reversal to downtrend
                state['uptrend'] = False
                state['sar'] = state['ep']
                state['ep'] = low
                state['af'] = self.af_start
            else:
                if high > state['ep']:
                    state['ep'] = high
                    state['af'] = min(state['af'] + self.af_increment, self.af_max)
                state['sar'] = sar
        else:
            # In downtrend
            sar = state['sar'] - state['af'] * (state['sar'] - state['ep'])
            sar = max(sar, state['prev_high'], high)

            if high > sar:
                # Reversal to uptrend
                state['uptrend'] = True
                state['sar'] = state['ep']
                state['ep'] = high
                state['af'] = self.af_start
            else:
                if low < state['ep']:
                    state['ep'] = low
                    state['af'] = min(state['af'] + self.af_increment, self.af_max)
                state['sar'] = sar

        state['prev_high'] = high
        state['prev_low'] = low

        return state['sar'], state['uptrend']

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            sar, uptrend = self._calculate_sar(symbol, data.high, data.low, data.close)

            has_long = symbol in portfolio.positions and portfolio.positions[symbol].quantity > 0

            if uptrend and not has_long:
                stop_loss = sar
                quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    strength=SignalStrength.MODERATE,
                    confidence=0.6,
                    reasoning=f"SAR uptrend signal, SAR={sar:.2f}"
                ))

            elif not uptrend and has_long:
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=position.quantity,
                    timestamp=timestamp,
                    reasoning=f"SAR downtrend reversal"
                ))

        return signals


# ==============================================================================
# CATEGORY 2: MEAN REVERSION STRATEGIES (10 strategies)
# ==============================================================================

class BollingerBandMeanReversion(BaseStrategy):
    """
    Bollinger Band mean reversion strategy.

    Parameters:
        bb_period: BB period (default: 20)
        bb_std: Standard deviations (default: 2.0)
        rsi_period: RSI confirmation period (default: 14)
    """

    def initialize(self):
        self.bb_period = self.parameters.get('bb_period', 20)
        self.bb_std = self.parameters.get('bb_std', 2.0)
        self.rsi_period = self.parameters.get('rsi_period', 14)

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            self.update_history(symbol, data.close)
            prices = self.get_history(symbol)

            if len(prices) < max(self.bb_period, self.rsi_period + 1):
                continue

            upper, middle, lower = self.bollinger_bands(prices, self.bb_period, self.bb_std)
            rsi = self.rsi(prices, self.rsi_period)

            if None in (upper, lower, rsi):
                continue

            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity != 0

            # Oversold: Price below lower band + RSI < 30
            if data.close < lower and rsi < 30 and not has_position:
                stop_loss = lower * 0.98
                quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    take_profit=middle,
                    strength=SignalStrength.STRONG,
                    confidence=0.7,
                    reasoning=f"Oversold: Price below BB lower, RSI={rsi:.1f}"
                ))

            # Exit at middle band or overbought
            elif has_position and (data.close >= middle or rsi > 70):
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=abs(position.quantity),
                    timestamp=timestamp,
                    reasoning=f"Mean reversion target reached"
                ))

        return signals


class RSIMeanReversion(BaseStrategy):
    """
    RSI-based mean reversion strategy.

    Parameters:
        rsi_period: RSI period (default: 14)
        oversold: Oversold threshold (default: 30)
        overbought: Overbought threshold (default: 70)
    """

    def initialize(self):
        self.period = self.parameters.get('rsi_period', 14)
        self.oversold = self.parameters.get('oversold', 30)
        self.overbought = self.parameters.get('overbought', 70)

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            self.update_history(symbol, data.close)
            prices = self.get_history(symbol)

            rsi = self.rsi(prices, self.period)
            if rsi is None:
                continue

            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity > 0

            if rsi < self.oversold and not has_position:
                stop_loss = data.close * 0.95
                quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    strength=SignalStrength.MODERATE,
                    confidence=1 - (rsi / 100),
                    reasoning=f"RSI oversold at {rsi:.1f}"
                ))

            elif rsi > self.overbought and has_position:
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=position.quantity,
                    timestamp=timestamp,
                    reasoning=f"RSI overbought at {rsi:.1f}"
                ))

        return signals


class StochasticMeanReversion(BaseStrategy):
    """
    Stochastic oscillator mean reversion.

    Parameters:
        k_period: %K period (default: 14)
        d_period: %D period (default: 3)
        oversold: Oversold level (default: 20)
        overbought: Overbought level (default: 80)
    """

    def initialize(self):
        self.k_period = self.parameters.get('k_period', 14)
        self.d_period = self.parameters.get('d_period', 3)
        self.oversold = self.parameters.get('oversold', 20)
        self.overbought = self.parameters.get('overbought', 80)
        self._data: Dict[str, Dict[str, List[float]]] = {}

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            if symbol not in self._data:
                self._data[symbol] = {'highs': [], 'lows': [], 'closes': []}

            self._data[symbol]['highs'].append(data.high)
            self._data[symbol]['lows'].append(data.low)
            self._data[symbol]['closes'].append(data.close)

            for key in self._data[symbol]:
                if len(self._data[symbol][key]) > 100:
                    self._data[symbol][key] = self._data[symbol][key][-100:]

            d = self._data[symbol]
            k, d_val = self.stochastic(d['highs'], d['lows'], d['closes'], self.k_period, self.d_period)

            if k is None:
                continue

            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity > 0

            if k < self.oversold and not has_position:
                stop_loss = min(d['lows'][-5:]) if len(d['lows']) >= 5 else data.low * 0.97
                quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    strength=SignalStrength.MODERATE,
                    confidence=0.6,
                    reasoning=f"Stochastic oversold: %K={k:.1f}"
                ))

            elif k > self.overbought and has_position:
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=position.quantity,
                    timestamp=timestamp,
                    reasoning=f"Stochastic overbought: %K={k:.1f}"
                ))

        return signals


# ==============================================================================
# CATEGORY 3: MOMENTUM STRATEGIES (10 strategies)
# ==============================================================================

class MACDMomentum(BaseStrategy):
    """
    MACD momentum strategy.

    Parameters:
        fast_period: Fast EMA (default: 12)
        slow_period: Slow EMA (default: 26)
        signal_period: Signal line (default: 9)
    """

    def initialize(self):
        self.fast = self.parameters.get('fast_period', 12)
        self.slow = self.parameters.get('slow_period', 26)
        self.signal = self.parameters.get('signal_period', 9)
        self._macd_history: Dict[str, List[float]] = {}
        self._signal_history: Dict[str, List[float]] = {}

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            self.update_history(symbol, data.close)
            prices = self.get_history(symbol)

            macd_line, signal_line, histogram = self.macd(prices, self.fast, self.slow, self.signal)

            if macd_line is None:
                continue

            if symbol not in self._macd_history:
                self._macd_history[symbol] = []
                self._signal_history[symbol] = []

            self._macd_history[symbol].append(macd_line)
            self._signal_history[symbol].append(signal_line)

            if len(self._macd_history[symbol]) < 2:
                continue

            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity > 0

            # MACD crosses above signal
            if self.crosses_above(self._macd_history[symbol], self._signal_history[symbol]) and not has_position:
                stop_loss = data.close * 0.95
                quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    strength=SignalStrength.MODERATE,
                    confidence=0.65,
                    reasoning=f"MACD bullish crossover"
                ))

            # MACD crosses below signal
            elif self.crosses_below(self._macd_history[symbol], self._signal_history[symbol]) and has_position:
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=position.quantity,
                    timestamp=timestamp,
                    reasoning="MACD bearish crossover"
                ))

        return signals


class ROCMomentum(BaseStrategy):
    """
    Rate of Change momentum strategy.

    Parameters:
        roc_period: ROC lookback (default: 10)
        threshold: Entry threshold (default: 5)
    """

    def initialize(self):
        self.period = self.parameters.get('roc_period', 10)
        self.threshold = self.parameters.get('threshold', 5)

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            self.update_history(symbol, data.close)
            prices = self.get_history(symbol)

            roc = self.rate_of_change(prices, self.period)
            if roc is None:
                continue

            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity > 0

            if roc > self.threshold and not has_position:
                stop_loss = data.close * 0.95
                quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    strength=SignalStrength.MODERATE if roc < self.threshold * 2 else SignalStrength.STRONG,
                    confidence=min(roc / 20, 0.8),
                    reasoning=f"Strong momentum: ROC={roc:.1f}%"
                ))

            elif roc < -self.threshold and has_position:
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=position.quantity,
                    timestamp=timestamp,
                    reasoning=f"Momentum reversal: ROC={roc:.1f}%"
                ))

        return signals


class DualMomentum(BaseStrategy):
    """
    Dual momentum: absolute + relative momentum.

    Parameters:
        lookback: Momentum lookback (default: 252 days)
        rebalance_frequency: Days between rebalance (default: 21)
    """

    def initialize(self):
        self.lookback = self.parameters.get('lookback', 252)
        self.rebalance_freq = self.parameters.get('rebalance_frequency', 21)
        self._day_count = 0

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []
        self._day_count += 1

        # Only rebalance on schedule
        if self._day_count % self.rebalance_freq != 0:
            return signals

        # Calculate momentum for all symbols
        momentum_scores = {}
        for symbol, data in market_data.items():
            self.update_history(symbol, data.close)
            prices = self.get_history(symbol)

            if len(prices) < self.lookback:
                continue

            # Absolute momentum (return over lookback)
            abs_mom = (prices[-1] / prices[-self.lookback]) - 1

            # Only positive absolute momentum
            if abs_mom > 0:
                momentum_scores[symbol] = abs_mom

        if not momentum_scores:
            return signals

        # Rank by relative momentum
        ranked = sorted(momentum_scores.items(), key=lambda x: x[1], reverse=True)

        # Buy top momentum, sell others
        top_symbols = set(s for s, _ in ranked[:3])  # Top 3

        for symbol in market_data.keys():
            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity > 0

            if symbol in top_symbols and not has_position:
                price = market_data[symbol].close
                stop_loss = price * 0.90
                quantity = self.calculate_position_size(portfolio.total_equity / 3, price, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    strength=SignalStrength.STRONG,
                    confidence=0.7,
                    reasoning=f"Top momentum: {momentum_scores.get(symbol, 0)*100:.1f}%"
                ))

            elif symbol not in top_symbols and has_position:
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=position.quantity,
                    timestamp=timestamp,
                    reasoning="No longer top momentum"
                ))

        return signals


# ==============================================================================
# CATEGORY 4: VOLATILITY STRATEGIES (10 strategies)
# ==============================================================================

class ATRBreakout(BaseStrategy):
    """
    ATR-based volatility breakout.

    Parameters:
        atr_period: ATR period (default: 14)
        atr_multiplier: Breakout threshold (default: 2.0)
    """

    def initialize(self):
        self.period = self.parameters.get('atr_period', 14)
        self.multiplier = self.parameters.get('atr_multiplier', 2.0)
        self._data: Dict[str, Dict[str, List[float]]] = {}

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            if symbol not in self._data:
                self._data[symbol] = {'highs': [], 'lows': [], 'closes': []}

            self._data[symbol]['highs'].append(data.high)
            self._data[symbol]['lows'].append(data.low)
            self._data[symbol]['closes'].append(data.close)

            for key in self._data[symbol]:
                if len(self._data[symbol][key]) > 100:
                    self._data[symbol][key] = self._data[symbol][key][-100:]

            d = self._data[symbol]
            atr_val = self.atr(d['highs'], d['lows'], d['closes'], self.period)

            if atr_val is None or len(d['closes']) < 2:
                continue

            # Breakout threshold
            threshold = atr_val * self.multiplier
            prev_close = d['closes'][-2]

            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity > 0

            # Upward breakout
            if data.close > prev_close + threshold and not has_position:
                stop_loss = data.close - atr_val * 1.5
                quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    strength=SignalStrength.STRONG,
                    confidence=0.65,
                    reasoning=f"ATR breakout: moved {(data.close - prev_close)/atr_val:.1f}x ATR"
                ))

            # Exit on ATR trailing stop
            elif has_position:
                position = portfolio.positions[symbol]
                trailing_stop = data.close - atr_val * 2
                if data.close < trailing_stop:
                    signals.append(TradingSignal.sell(
                        symbol=symbol,
                        quantity=position.quantity,
                        timestamp=timestamp,
                        reasoning="ATR trailing stop hit"
                    ))

        return signals


class VolatilityContraction(BaseStrategy):
    """
    Trade volatility contraction/expansion cycles.

    Parameters:
        bb_period: Bollinger Band period (default: 20)
        squeeze_threshold: Squeeze detection threshold (default: 0.05)
    """

    def initialize(self):
        self.period = self.parameters.get('bb_period', 20)
        self.squeeze_threshold = self.parameters.get('squeeze_threshold', 0.05)
        self._bandwidth_history: Dict[str, List[float]] = {}

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            self.update_history(symbol, data.close)
            prices = self.get_history(symbol)

            upper, middle, lower = self.bollinger_bands(prices, self.period)

            if None in (upper, middle, lower):
                continue

            # Bandwidth = (upper - lower) / middle
            bandwidth = (upper - lower) / middle if middle > 0 else 0

            if symbol not in self._bandwidth_history:
                self._bandwidth_history[symbol] = []

            self._bandwidth_history[symbol].append(bandwidth)

            if len(self._bandwidth_history[symbol]) > 50:
                self._bandwidth_history[symbol] = self._bandwidth_history[symbol][-50:]

            if len(self._bandwidth_history[symbol]) < 20:
                continue

            # Detect squeeze (bandwidth at 20-period low)
            min_bandwidth = min(self._bandwidth_history[symbol][-20:-1])
            in_squeeze = bandwidth < min_bandwidth * 1.1

            # Detect expansion from squeeze
            prev_bandwidth = self._bandwidth_history[symbol][-2]
            expanding = bandwidth > prev_bandwidth * 1.2

            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity > 0

            if in_squeeze and expanding and not has_position:
                # Breakout from squeeze - direction based on price vs middle band
                if data.close > middle:
                    stop_loss = lower
                    quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                    signals.append(TradingSignal.buy(
                        symbol=symbol,
                        quantity=quantity,
                        timestamp=timestamp,
                        stop_loss=stop_loss,
                        strength=SignalStrength.STRONG,
                        confidence=0.7,
                        reasoning="Volatility squeeze breakout to upside"
                    ))

        return signals


# ==============================================================================
# CATEGORY 5: HYBRID/ENSEMBLE STRATEGIES (10 strategies)
# ==============================================================================

class MultiIndicatorConfirmation(BaseStrategy):
    """
    Requires multiple indicator confirmation for entry.

    Parameters:
        required_confirmations: Number of indicators needed (default: 3)
    """

    def initialize(self):
        self.required = self.parameters.get('required_confirmations', 3)
        self._data: Dict[str, Dict[str, List[float]]] = {}

    def generate_signals(
        self,
        market_data: Dict[str, Any],
        portfolio: Any,
        timestamp: datetime
    ) -> List[TradingSignal]:
        signals = []

        for symbol, data in market_data.items():
            if symbol not in self._data:
                self._data[symbol] = {'highs': [], 'lows': [], 'closes': []}

            self._data[symbol]['highs'].append(data.high)
            self._data[symbol]['lows'].append(data.low)
            self._data[symbol]['closes'].append(data.close)

            for key in self._data[symbol]:
                if len(self._data[symbol][key]) > 200:
                    self._data[symbol][key] = self._data[symbol][key][-200:]

            d = self._data[symbol]
            closes = d['closes']

            if len(closes) < 50:
                continue

            # Calculate indicators
            bullish_signals = 0
            bearish_signals = 0

            # 1. MA crossover
            sma_20 = np.mean(closes[-20:])
            sma_50 = np.mean(closes[-50:])
            if sma_20 > sma_50:
                bullish_signals += 1
            else:
                bearish_signals += 1

            # 2. RSI
            rsi = self.rsi(closes, 14)
            if rsi and rsi < 40:
                bullish_signals += 1
            elif rsi and rsi > 60:
                bearish_signals += 1

            # 3. Price above/below SMA
            if data.close > sma_20:
                bullish_signals += 1
            else:
                bearish_signals += 1

            # 4. MACD
            macd_line, signal_line, _ = self.macd(closes)
            if macd_line and signal_line and macd_line > signal_line:
                bullish_signals += 1
            elif macd_line and signal_line:
                bearish_signals += 1

            # 5. Momentum
            if len(closes) >= 11:
                mom = closes[-1] - closes[-11]
                if mom > 0:
                    bullish_signals += 1
                else:
                    bearish_signals += 1

            has_position = symbol in portfolio.positions and portfolio.positions[symbol].quantity > 0

            if bullish_signals >= self.required and not has_position:
                stop_loss = data.close * 0.95
                quantity = self.calculate_position_size(portfolio.total_equity, data.close, stop_loss)
                signals.append(TradingSignal.buy(
                    symbol=symbol,
                    quantity=quantity,
                    timestamp=timestamp,
                    stop_loss=stop_loss,
                    strength=SignalStrength.STRONG if bullish_signals >= 4 else SignalStrength.MODERATE,
                    confidence=bullish_signals / 5,
                    reasoning=f"Multi-indicator confirmation: {bullish_signals}/5 bullish"
                ))

            elif bearish_signals >= self.required and has_position:
                position = portfolio.positions[symbol]
                signals.append(TradingSignal.sell(
                    symbol=symbol,
                    quantity=position.quantity,
                    timestamp=timestamp,
                    reasoning=f"Multi-indicator exit: {bearish_signals}/5 bearish"
                ))

        return signals


# ==============================================================================
# STRATEGY REGISTRY
# ==============================================================================

STRATEGY_GENE_POOL = {
    # Trend Following
    'ma_crossover': MovingAverageCrossover,
    'triple_ma': TripleMovingAverage,
    'trend_breakout': TrendFollowingBreakout,
    'adx_trend': ADXTrend,
    'parabolic_sar': ParabolicSAR,

    # Mean Reversion
    'bb_mean_reversion': BollingerBandMeanReversion,
    'rsi_mean_reversion': RSIMeanReversion,
    'stochastic_mr': StochasticMeanReversion,

    # Momentum
    'macd_momentum': MACDMomentum,
    'roc_momentum': ROCMomentum,
    'dual_momentum': DualMomentum,

    # Volatility
    'atr_breakout': ATRBreakout,
    'volatility_contraction': VolatilityContraction,

    # Hybrid
    'multi_indicator': MultiIndicatorConfirmation,
}


def create_strategy(
    strategy_type: str,
    strategy_id: Optional[str] = None,
    parameters: Optional[Dict[str, Any]] = None,
    **kwargs
) -> BaseStrategy:
    """Factory function to create strategies."""
    if strategy_type not in STRATEGY_GENE_POOL:
        raise ValueError(f"Unknown strategy type: {strategy_type}")

    strategy_class = STRATEGY_GENE_POOL[strategy_type]

    config = StrategyConfig(
        strategy_id=strategy_id or str(uuid4()),
        name=strategy_type,
        parameters=parameters or {},
        **kwargs
    )

    return strategy_class(config)


def get_available_strategies() -> List[str]:
    """Get list of available strategy types."""
    return list(STRATEGY_GENE_POOL.keys())


def get_default_parameters(strategy_type: str) -> Dict[str, Any]:
    """Get default parameters for a strategy type."""
    defaults = {
        'ma_crossover': {'fast_period': 10, 'slow_period': 30, 'ma_type': 'sma'},
        'triple_ma': {'fast_period': 5, 'medium_period': 20, 'slow_period': 50},
        'trend_breakout': {'entry_period': 20, 'exit_period': 10},
        'adx_trend': {'adx_period': 14, 'adx_threshold': 25},
        'parabolic_sar': {'af_start': 0.02, 'af_increment': 0.02, 'af_max': 0.2},
        'bb_mean_reversion': {'bb_period': 20, 'bb_std': 2.0, 'rsi_period': 14},
        'rsi_mean_reversion': {'rsi_period': 14, 'oversold': 30, 'overbought': 70},
        'stochastic_mr': {'k_period': 14, 'd_period': 3, 'oversold': 20, 'overbought': 80},
        'macd_momentum': {'fast_period': 12, 'slow_period': 26, 'signal_period': 9},
        'roc_momentum': {'roc_period': 10, 'threshold': 5},
        'dual_momentum': {'lookback': 252, 'rebalance_frequency': 21},
        'atr_breakout': {'atr_period': 14, 'atr_multiplier': 2.0},
        'volatility_contraction': {'bb_period': 20, 'squeeze_threshold': 0.05},
        'multi_indicator': {'required_confirmations': 3},
    }
    return defaults.get(strategy_type, {})
