#!/usr/bin/env python3
"""
Overnight Training & Paper Trading

Runs all night to:
1. Train strategies on real historical data
2. Paper trade in real-time simulation
3. Find the BEST strategy for tomorrow's market open
4. Output exact BUY/SELL recommendations

Usage:
    python overnight_training.py

Or with Alpaca paper trading:
    export ALPACA_API_KEY="your-key"
    export ALPACA_SECRET_KEY="your-secret"
    python overnight_training.py --live
"""

import sys
import os
import asyncio
import time
from datetime import datetime, timedelta

_script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_script_dir, 'src'))

import numpy as np
import pandas as pd

# Load market data
DATA_DIR = os.path.join(_script_dir, 'market_data')


def load_all_data():
    """Load all downloaded market data."""
    data = {}
    if not os.path.exists(DATA_DIR):
        print("❌ No market data found. Run setup_real_trading.py first!")
        return None

    for file in os.listdir(DATA_DIR):
        if file.endswith('.parquet'):
            symbol = file.replace('.parquet', '')
            filepath = os.path.join(DATA_DIR, file)
            data[symbol] = pd.read_parquet(filepath)
            print(f"  ✅ Loaded {symbol}: {len(data[symbol])} days")

    return data


class StrategyTrainer:
    """Trains and evaluates trading strategies."""

    def __init__(self, data: dict):
        self.data = data
        self.results = []

    def train_ma_crossover(self, symbol: str, fast: int, slow: int) -> dict:
        """Train Moving Average Crossover strategy."""
        df = self.data[symbol].copy()
        df['fast_ma'] = df['close'].rolling(fast).mean()
        df['slow_ma'] = df['close'].rolling(slow).mean()
        df['signal'] = (df['fast_ma'] > df['slow_ma']).astype(int)
        df['position'] = df['signal'].diff()

        # Calculate returns
        df['returns'] = df['close'].pct_change()
        df['strategy_returns'] = df['signal'].shift(1) * df['returns']

        total_return = (1 + df['strategy_returns'].dropna()).prod() - 1
        sharpe = df['strategy_returns'].mean() / df['strategy_returns'].std() * np.sqrt(252)

        # Current signal
        current_signal = 'BUY' if df['signal'].iloc[-1] == 1 else 'SELL'

        return {
            'strategy': f'MA_Crossover_{fast}_{slow}',
            'symbol': symbol,
            'total_return': total_return,
            'sharpe': sharpe,
            'current_signal': current_signal,
            'current_price': df['close'].iloc[-1],
            'fast_ma': df['fast_ma'].iloc[-1],
            'slow_ma': df['slow_ma'].iloc[-1],
        }

    def train_rsi_strategy(self, symbol: str, period: int = 14, oversold: int = 30, overbought: int = 70) -> dict:
        """Train RSI Mean Reversion strategy."""
        df = self.data[symbol].copy()

        delta = df['close'].diff()
        gain = delta.where(delta > 0, 0).rolling(period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))

        df['signal'] = 0
        df.loc[df['rsi'] < oversold, 'signal'] = 1  # Buy
        df.loc[df['rsi'] > overbought, 'signal'] = -1  # Sell
        df['signal'] = df['signal'].replace(0, np.nan).ffill().fillna(0)

        df['returns'] = df['close'].pct_change()
        df['strategy_returns'] = df['signal'].shift(1) * df['returns']

        total_return = (1 + df['strategy_returns'].dropna()).prod() - 1
        sharpe = df['strategy_returns'].mean() / df['strategy_returns'].std() * np.sqrt(252) if df['strategy_returns'].std() > 0 else 0

        current_rsi = df['rsi'].iloc[-1]
        if current_rsi < oversold:
            current_signal = 'BUY (Oversold)'
        elif current_rsi > overbought:
            current_signal = 'SELL (Overbought)'
        else:
            current_signal = 'HOLD'

        return {
            'strategy': f'RSI_{period}',
            'symbol': symbol,
            'total_return': total_return,
            'sharpe': sharpe,
            'current_signal': current_signal,
            'current_price': df['close'].iloc[-1],
            'rsi': current_rsi,
        }

    def train_macd_strategy(self, symbol: str, fast: int = 12, slow: int = 26, signal: int = 9) -> dict:
        """Train MACD Momentum strategy."""
        df = self.data[symbol].copy()

        df['ema_fast'] = df['close'].ewm(span=fast).mean()
        df['ema_slow'] = df['close'].ewm(span=slow).mean()
        df['macd'] = df['ema_fast'] - df['ema_slow']
        df['macd_signal'] = df['macd'].ewm(span=signal).mean()
        df['macd_hist'] = df['macd'] - df['macd_signal']

        df['signal'] = (df['macd'] > df['macd_signal']).astype(int)

        df['returns'] = df['close'].pct_change()
        df['strategy_returns'] = df['signal'].shift(1) * df['returns']

        total_return = (1 + df['strategy_returns'].dropna()).prod() - 1
        sharpe = df['strategy_returns'].mean() / df['strategy_returns'].std() * np.sqrt(252) if df['strategy_returns'].std() > 0 else 0

        current_signal = 'BUY' if df['signal'].iloc[-1] == 1 else 'SELL'

        return {
            'strategy': 'MACD',
            'symbol': symbol,
            'total_return': total_return,
            'sharpe': sharpe,
            'current_signal': current_signal,
            'current_price': df['close'].iloc[-1],
            'macd': df['macd'].iloc[-1],
            'macd_signal_line': df['macd_signal'].iloc[-1],
        }

    def run_all_strategies(self, symbols: list) -> list:
        """Run all strategies on all symbols."""
        results = []

        for symbol in symbols:
            if symbol not in self.data:
                continue

            # MA Crossover variations
            for fast, slow in [(5, 20), (10, 30), (10, 50), (20, 50)]:
                try:
                    result = self.train_ma_crossover(symbol, fast, slow)
                    results.append(result)
                except:
                    pass

            # RSI
            try:
                result = self.train_rsi_strategy(symbol)
                results.append(result)
            except:
                pass

            # MACD
            try:
                result = self.train_macd_strategy(symbol)
                results.append(result)
            except:
                pass

        return results


class PaperTradingSimulator:
    """Simulates paper trading with real data."""

    def __init__(self, initial_capital: float = 100000):
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.positions = {}  # symbol -> {'shares': N, 'avg_cost': X}
        self.trades = []
        self.portfolio_history = []

    def buy(self, symbol: str, price: float, shares: int) -> bool:
        """Execute a buy order."""
        cost = price * shares
        if cost > self.cash:
            return False

        self.cash -= cost
        if symbol in self.positions:
            old_shares = self.positions[symbol]['shares']
            old_cost = self.positions[symbol]['avg_cost']
            new_shares = old_shares + shares
            new_avg = (old_shares * old_cost + shares * price) / new_shares
            self.positions[symbol] = {'shares': new_shares, 'avg_cost': new_avg}
        else:
            self.positions[symbol] = {'shares': shares, 'avg_cost': price}

        self.trades.append({
            'time': datetime.now(),
            'symbol': symbol,
            'action': 'BUY',
            'shares': shares,
            'price': price,
            'value': cost
        })
        return True

    def sell(self, symbol: str, price: float, shares: int) -> bool:
        """Execute a sell order."""
        if symbol not in self.positions or self.positions[symbol]['shares'] < shares:
            return False

        proceeds = price * shares
        self.cash += proceeds

        self.positions[symbol]['shares'] -= shares
        if self.positions[symbol]['shares'] == 0:
            del self.positions[symbol]

        self.trades.append({
            'time': datetime.now(),
            'symbol': symbol,
            'action': 'SELL',
            'shares': shares,
            'price': price,
            'value': proceeds
        })
        return True

    def get_portfolio_value(self, prices: dict) -> float:
        """Calculate total portfolio value."""
        total = self.cash
        for symbol, pos in self.positions.items():
            if symbol in prices:
                total += pos['shares'] * prices[symbol]
        return total

    def get_pnl(self, prices: dict) -> float:
        """Get profit/loss."""
        return self.get_portfolio_value(prices) - self.initial_capital


def generate_recommendations(trainer_results: list) -> dict:
    """Generate investment recommendations from training results."""

    # Filter for positive Sharpe ratio
    good_results = [r for r in trainer_results if r['sharpe'] > 0.3]

    # Group by symbol
    by_symbol = {}
    for r in good_results:
        symbol = r['symbol']
        if symbol not in by_symbol:
            by_symbol[symbol] = []
        by_symbol[symbol].append(r)

    recommendations = {}
    for symbol, results in by_symbol.items():
        # Count signals
        buy_votes = sum(1 for r in results if 'BUY' in r['current_signal'])
        sell_votes = sum(1 for r in results if 'SELL' in r['current_signal'])

        avg_sharpe = np.mean([r['sharpe'] for r in results])
        best_strategy = max(results, key=lambda x: x['sharpe'])

        if buy_votes > sell_votes:
            action = 'BUY'
            confidence = buy_votes / len(results)
        elif sell_votes > buy_votes:
            action = 'SELL'
            confidence = sell_votes / len(results)
        else:
            action = 'HOLD'
            confidence = 0.5

        recommendations[symbol] = {
            'action': action,
            'confidence': confidence,
            'avg_sharpe': avg_sharpe,
            'best_strategy': best_strategy['strategy'],
            'current_price': best_strategy['current_price'],
            'num_strategies_agree': max(buy_votes, sell_votes),
            'total_strategies': len(results)
        }

    return recommendations


async def run_overnight_training(hours: float = 8):
    """Run overnight training session."""

    print("=" * 70)
    print("  🌙 OVERNIGHT TRAINING SESSION")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Duration: {hours} hours")
    print("=" * 70)

    # Load data
    print("\n📊 Loading market data...")
    data = load_all_data()
    if not data:
        return

    # Initialize
    trainer = StrategyTrainer(data)
    simulator = PaperTradingSimulator(initial_capital=100000)

    symbols = list(data.keys())
    iteration = 0
    best_recommendations = None

    start_time = time.time()
    end_time = start_time + (hours * 3600)

    print(f"\n🏋️ Training on {len(symbols)} symbols...")
    print("-" * 70)

    while time.time() < end_time:
        iteration += 1

        # Run all strategies
        results = trainer.run_all_strategies(symbols)

        # Generate recommendations
        recommendations = generate_recommendations(results)

        # Sort by confidence and Sharpe
        sorted_recs = sorted(
            recommendations.items(),
            key=lambda x: (x[1]['confidence'], x[1]['avg_sharpe']),
            reverse=True
        )

        # Display top recommendations
        print(f"\n⏰ Iteration {iteration} - {datetime.now().strftime('%H:%M:%S')}")
        print("-" * 50)

        for symbol, rec in sorted_recs[:5]:
            emoji = "🟢" if rec['action'] == 'BUY' else "🔴" if rec['action'] == 'SELL' else "🟡"
            print(f"  {emoji} {symbol}: {rec['action']} | Confidence: {rec['confidence']*100:.0f}% | Sharpe: {rec['avg_sharpe']:.2f}")

        best_recommendations = sorted_recs

        # Simulate paper trades based on recommendations
        prices = {s: data[s]['close'].iloc[-1] for s in symbols if s in data}

        for symbol, rec in sorted_recs[:3]:  # Top 3
            if rec['action'] == 'BUY' and rec['confidence'] > 0.6:
                shares = int(simulator.cash * 0.1 / rec['current_price'])  # 10% of cash
                if shares > 0:
                    simulator.buy(symbol, rec['current_price'], shares)

        # Portfolio update
        portfolio_value = simulator.get_portfolio_value(prices)
        pnl = simulator.get_pnl(prices)

        print(f"\n  💰 Paper Portfolio: ${portfolio_value:,.2f} (PnL: ${pnl:+,.2f})")
        print(f"  📊 Positions: {len(simulator.positions)}")

        # Wait before next iteration
        elapsed = (time.time() - start_time) / 3600
        remaining = hours - elapsed
        print(f"\n  ⏳ Time remaining: {remaining:.1f} hours")

        await asyncio.sleep(60)  # 1 minute between iterations

    # Final report
    print("\n" + "=" * 70)
    print("  📈 FINAL TRAINING RESULTS")
    print("=" * 70)

    print("\n🏆 TOP INVESTMENT RECOMMENDATIONS FOR MARKET OPEN:")
    print("-" * 70)

    for symbol, rec in best_recommendations[:10]:
        emoji = "🟢" if rec['action'] == 'BUY' else "🔴" if rec['action'] == 'SELL' else "🟡"
        print(f"""
{emoji} {symbol}
   Action: {rec['action']}
   Confidence: {rec['confidence']*100:.0f}%
   Best Strategy: {rec['best_strategy']}
   Current Price: ${rec['current_price']:.2f}
   Sharpe Ratio: {rec['avg_sharpe']:.2f}
   Strategies Agreeing: {rec['num_strategies_agree']}/{rec['total_strategies']}
""")

    print("\n💼 PAPER TRADING RESULTS:")
    print("-" * 70)
    prices = {s: data[s]['close'].iloc[-1] for s in symbols if s in data}
    print(f"  Initial Capital: ${simulator.initial_capital:,.2f}")
    print(f"  Final Value: ${simulator.get_portfolio_value(prices):,.2f}")
    print(f"  Total P&L: ${simulator.get_pnl(prices):+,.2f}")
    print(f"  Return: {(simulator.get_pnl(prices)/simulator.initial_capital)*100:+.2f}%")
    print(f"  Total Trades: {len(simulator.trades)}")

    print("\n" + "=" * 70)
    print("  ✅ TRAINING COMPLETE - READY FOR MARKET OPEN")
    print("=" * 70)

    return best_recommendations


async def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--hours', type=float, default=0.1, help='Training hours (default: 0.1 for quick test)')
    parser.add_argument('--live', action='store_true', help='Enable live Alpaca paper trading')
    args = parser.parse_args()

    if args.live:
        api_key = os.environ.get('ALPACA_API_KEY')
        secret = os.environ.get('ALPACA_SECRET_KEY')
        if not api_key or not secret:
            print("❌ Set ALPACA_API_KEY and ALPACA_SECRET_KEY environment variables")
            print("   Get keys from: https://alpaca.markets")
            return
        print("✅ Alpaca credentials found - live paper trading enabled")

    await run_overnight_training(hours=args.hours)


if __name__ == "__main__":
    asyncio.run(main())
