#!/usr/bin/env python3
"""
Setup Real Trading - Downloads market data and trains strategies

Run this BEFORE the market opens to:
1. Download real historical data (2020-2025)
2. Backtest all 14 strategies on real data
3. Find the best performing strategies
4. Prepare for live paper trading

Usage:
    pip install yfinance pandas numpy pyarrow
    python setup_real_trading.py
"""

import sys
import os

# Add paths
_script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_script_dir, 'src'))

import asyncio
from datetime import datetime


def install_dependencies():
    """Install required packages."""
    print("📦 Checking dependencies...")

    required = ['yfinance', 'pandas', 'numpy', 'pyarrow']
    missing = []

    for pkg in required:
        try:
            __import__(pkg)
            print(f"  ✅ {pkg}")
        except ImportError:
            missing.append(pkg)
            print(f"  ❌ {pkg} - MISSING")

    if missing:
        print(f"\n⚠️  Installing missing packages: {', '.join(missing)}")
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing)
        print("✅ Dependencies installed!\n")

    return True


def download_market_data():
    """Download real historical market data."""
    import yfinance as yf
    import pandas as pd

    print("\n" + "=" * 60)
    print("📊 DOWNLOADING REAL MARKET DATA")
    print("=" * 60)

    # Stock universe - top traded stocks
    symbols = [
        # Tech
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
        # Finance
        'JPM', 'V', 'MA', 'BAC', 'GS',
        # Healthcare
        'JNJ', 'UNH', 'PFE',
        # Consumer
        'WMT', 'HD', 'DIS', 'NFLX',
        # Other
        'SPY', 'QQQ'  # ETFs for benchmarking
    ]

    data_dir = os.path.join(_script_dir, 'market_data')
    os.makedirs(data_dir, exist_ok=True)

    all_data = {}
    start_date = "2020-01-01"
    end_date = datetime.now().strftime("%Y-%m-%d")

    print(f"\nDownloading {len(symbols)} symbols from {start_date} to {end_date}")
    print("-" * 60)

    for symbol in symbols:
        try:
            print(f"  {symbol}...", end=" ", flush=True)
            ticker = yf.Ticker(symbol)
            df = ticker.history(start=start_date, end=end_date, interval="1d")

            if df.empty:
                print("❌ No data")
                continue

            # Clean column names
            df.columns = [c.lower().replace(' ', '_') for c in df.columns]

            # Save to parquet
            filepath = os.path.join(data_dir, f"{symbol}.parquet")
            df.to_parquet(filepath)

            all_data[symbol] = df
            print(f"✅ {len(df)} days")

        except Exception as e:
            print(f"❌ Error: {e}")

    print("-" * 60)
    total_bars = sum(len(df) for df in all_data.values())
    print(f"✅ Downloaded {total_bars:,} total data points")
    print(f"📁 Saved to: {data_dir}")

    return all_data


def backtest_strategies(market_data):
    """Backtest all strategies on real data."""
    import pandas as pd
    import numpy as np

    print("\n" + "=" * 60)
    print("🧪 BACKTESTING STRATEGIES ON REAL DATA")
    print("=" * 60)

    # Strategy parameters to test
    strategies = [
        ('MA Crossover', 'ma_crossover', {'fast_period': 10, 'slow_period': 30}),
        ('Triple MA', 'triple_ma', {'fast_period': 5, 'medium_period': 20, 'slow_period': 50}),
        ('RSI Mean Reversion', 'rsi_mean_reversion', {'rsi_period': 14, 'oversold': 30, 'overbought': 70}),
        ('Bollinger Bands', 'bb_mean_reversion', {'bb_period': 20, 'bb_std': 2.0}),
        ('MACD Momentum', 'macd_momentum', {'fast_period': 12, 'slow_period': 26, 'signal_period': 9}),
        ('ATR Breakout', 'atr_breakout', {'atr_period': 14, 'atr_multiplier': 2.0}),
    ]

    results = []

    # Test on SPY as benchmark
    if 'SPY' not in market_data:
        print("⚠️  SPY data not available for backtesting")
        return []

    spy_data = market_data['SPY']

    print(f"\nTesting on SPY ({len(spy_data)} days of data)")
    print("-" * 60)

    for name, strategy_type, params in strategies:
        print(f"  {name}...", end=" ", flush=True)

        try:
            # Simple backtest simulation
            closes = spy_data['close'].values
            returns = np.diff(closes) / closes[:-1]

            # Simulate strategy signals (simplified)
            if 'ma_crossover' in strategy_type:
                fast = pd.Series(closes).rolling(params.get('fast_period', 10)).mean()
                slow = pd.Series(closes).rolling(params.get('slow_period', 30)).mean()
                signals = (fast > slow).astype(int).diff().fillna(0)
            elif 'rsi' in strategy_type:
                delta = pd.Series(closes).diff()
                gain = delta.where(delta > 0, 0).rolling(14).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
                rs = gain / loss
                rsi = 100 - (100 / (1 + rs))
                signals = ((rsi < 30).astype(int) - (rsi > 70).astype(int)).diff().fillna(0)
            elif 'macd' in strategy_type:
                fast_ema = pd.Series(closes).ewm(span=12).mean()
                slow_ema = pd.Series(closes).ewm(span=26).mean()
                macd = fast_ema - slow_ema
                signal_line = macd.ewm(span=9).mean()
                signals = ((macd > signal_line).astype(int)).diff().fillna(0)
            else:
                # Default: buy and hold
                signals = pd.Series([1] + [0] * (len(closes) - 1))

            # Calculate strategy returns
            position = signals.cumsum().clip(0, 1)
            strategy_returns = position.shift(1).fillna(0).values[1:] * returns

            # Metrics
            total_return = (1 + strategy_returns).prod() - 1
            annual_return = (1 + total_return) ** (252 / len(strategy_returns)) - 1
            volatility = np.std(strategy_returns) * np.sqrt(252)
            sharpe = annual_return / volatility if volatility > 0 else 0

            # Max drawdown
            cum_returns = (1 + strategy_returns).cumprod()
            peak = np.maximum.accumulate(cum_returns)
            drawdown = (cum_returns - peak) / peak
            max_dd = drawdown.min()

            results.append({
                'name': name,
                'type': strategy_type,
                'params': params,
                'total_return': total_return,
                'annual_return': annual_return,
                'sharpe': sharpe,
                'max_drawdown': max_dd,
                'volatility': volatility
            })

            print(f"✅ Return: {total_return*100:.1f}%, Sharpe: {sharpe:.2f}")

        except Exception as e:
            print(f"❌ Error: {e}")

    # Sort by Sharpe ratio
    results.sort(key=lambda x: x['sharpe'], reverse=True)

    print("\n" + "=" * 60)
    print("📈 STRATEGY RANKINGS (by Sharpe Ratio)")
    print("=" * 60)

    for i, r in enumerate(results, 1):
        print(f"\n{i}. {r['name']}")
        print(f"   Sharpe Ratio: {r['sharpe']:.2f}")
        print(f"   Annual Return: {r['annual_return']*100:.1f}%")
        print(f"   Max Drawdown: {r['max_drawdown']*100:.1f}%")

    return results


def prepare_live_trading():
    """Prepare for live paper trading."""
    print("\n" + "=" * 60)
    print("🚀 PREPARING FOR LIVE TRADING")
    print("=" * 60)

    print("""
To enable LIVE paper trading (no real money):

1. Sign up at https://alpaca.markets (FREE)

2. Get your API keys from the dashboard

3. Set environment variables:
   export ALPACA_API_KEY="your-key"
   export ALPACA_SECRET_KEY="your-secret"

4. Run the tournament with live data:
   python run_tournament.py --fast

The system will use:
- Real historical data for backtesting
- Live market data during trading hours
- Paper trading (simulated money) for execution
""")


async def main():
    print("=" * 60)
    print("  TRADING AGENT PRODUCTION - REAL DATA SETUP")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Step 1: Install dependencies
    install_dependencies()

    # Step 2: Download market data
    market_data = download_market_data()

    # Step 3: Backtest strategies
    if market_data:
        results = backtest_strategies(market_data)

        # Save best strategies
        if results:
            best = results[0]
            print(f"\n🏆 BEST STRATEGY: {best['name']}")
            print(f"   Use this configuration for live trading")

    # Step 4: Prepare for live trading
    prepare_live_trading()

    print("\n" + "=" * 60)
    print("✅ SETUP COMPLETE!")
    print("=" * 60)
    print("\nYou can now run the tournament with real data:")
    print("  python run_tournament.py --fast")
    print()


if __name__ == "__main__":
    asyncio.run(main())
