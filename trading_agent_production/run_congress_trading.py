#!/usr/bin/env python3
"""
Congressional Trading Strategy

Combines congressional trading signals with technical analysis for trading.

This script:
1. Fetches congressional trading data (what politicians are buying/selling)
2. Analyzes the signals and generates recommendations
3. Integrates with the overnight training system
4. Can run as a daily monitor

Usage:
    # One-time analysis
    python run_congress_trading.py

    # Continuous monitoring (checks every 6 hours)
    python run_congress_trading.py --monitor

    # Get quick buy list
    python run_congress_trading.py --quick
"""

import sys
import os
import asyncio
import json
from datetime import datetime, timedelta

_script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_script_dir, 'src'))

# Import congress tracker
from data.congress_tracker import (
    CongressTracker,
    print_recommendations,
    get_congress_buy_list,
    KEY_POLITICIANS,
)


def analyze_congress_trades():
    """Analyze congressional trades and generate signals."""
    print("=" * 70)
    print("  🏛️  CONGRESSIONAL TRADING ANALYSIS")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    tracker = CongressTracker(cache_dir='./congress_data')
    tracker.fetch_all_trades()

    if not tracker.trades:
        print("\n❌ No trades available. APIs may be blocked.")
        return None

    recommendations = tracker.generate_trading_recommendations()
    print_recommendations(recommendations)

    # Save recommendations
    output_file = 'congress_recommendations.json'
    with open(output_file, 'w') as f:
        json.dump(recommendations, f, indent=2, default=str)
    print(f"\n✅ Saved recommendations to {output_file}")

    return recommendations


def get_trading_signals():
    """Get actionable trading signals from congressional data."""
    print("\n📊 Generating Trading Signals...")

    tracker = CongressTracker(cache_dir='./congress_data')
    tracker.fetch_all_trades()

    buy_signals = tracker.get_buy_signals(days=30, min_amount=15000)
    sell_signals = tracker.get_sell_signals(days=30, min_amount=15000)

    signals = {
        'timestamp': datetime.now().isoformat(),
        'buy': [],
        'sell': [],
        'hold': [],
    }

    # Top buy signals
    for signal in buy_signals[:10]:
        signals['buy'].append({
            'ticker': signal['ticker'],
            'confidence': min(100, int(signal['signal_strength'] * 5)),
            'politicians': signal['politicians'][:3],
            'amount': f"${signal['total_amount_min']:,}+",
            'key_politician': signal['has_key_politician'],
        })

    # Top sell signals
    for signal in sell_signals[:10]:
        signals['sell'].append({
            'ticker': signal['ticker'],
            'confidence': min(100, int(signal['signal_strength'] * 5)),
            'politicians': signal['politicians'][:3],
            'amount': f"${signal['total_amount_min']:,}+",
        })

    return signals


def integrate_with_overnight_training(recommendations):
    """Add congressional signals to overnight training."""
    print("\n🔗 Integrating with Overnight Training...")

    # Get tickers congress is buying
    buy_tickers = [rec['ticker'] for rec in recommendations.get('buy_recommendations', [])]

    if buy_tickers:
        print(f"  Adding congressional picks to universe: {', '.join(buy_tickers)}")

        # Update the symbols file for overnight training
        congress_symbols = {
            'source': 'congress',
            'updated': datetime.now().isoformat(),
            'tickers': buy_tickers,
            'details': recommendations.get('buy_recommendations', [])
        }

        with open('congress_symbols.json', 'w') as f:
            json.dump(congress_symbols, f, indent=2)

        print(f"  ✅ Saved congressional picks to congress_symbols.json")

    return buy_tickers


def quick_buy_list():
    """Get a quick list of tickers to buy based on congress."""
    print("=" * 70)
    print("  🏛️  CONGRESSIONAL BUY LIST")
    print("=" * 70)

    tickers = get_congress_buy_list()

    print("\n📈 Tickers Congress is Buying:")
    for ticker in tickers:
        print(f"  - {ticker}")

    print(f"\nTotal: {len(tickers)} tickers")
    return tickers


async def continuous_monitor(interval_hours: int = 6):
    """Continuously monitor congressional trades."""
    print("=" * 70)
    print("  🏛️  CONGRESSIONAL TRADING MONITOR")
    print(f"  Checking every {interval_hours} hours")
    print("=" * 70)

    iteration = 0
    while True:
        iteration += 1
        print(f"\n⏰ Check #{iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        try:
            recommendations = analyze_congress_trades()

            if recommendations:
                integrate_with_overnight_training(recommendations)

                # Check for new high-value trades
                for rec in recommendations.get('buy_recommendations', [])[:3]:
                    if rec.get('confidence', 0) >= 80:
                        print(f"\n🚨 HIGH CONFIDENCE BUY: {rec['ticker']}")
                        print(f"   Politicians: {', '.join(rec.get('politicians', [])[:3])}")

        except Exception as e:
            print(f"❌ Error: {e}")

        print(f"\n💤 Next check in {interval_hours} hours...")
        await asyncio.sleep(interval_hours * 3600)


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Congressional Trading Strategy')
    parser.add_argument('--monitor', action='store_true', help='Run continuous monitoring')
    parser.add_argument('--quick', action='store_true', help='Quick buy list only')
    parser.add_argument('--interval', type=int, default=6, help='Monitor check interval (hours)')
    args = parser.parse_args()

    if args.quick:
        quick_buy_list()
    elif args.monitor:
        asyncio.run(continuous_monitor(args.interval))
    else:
        recommendations = analyze_congress_trades()
        if recommendations:
            integrate_with_overnight_training(recommendations)

            print("\n" + "=" * 70)
            print("  📋 SUMMARY")
            print("=" * 70)
            print(f"""
  Total Trades Analyzed: {recommendations.get('total_trades_analyzed', 0)}

  🟢 BUY Recommendations: {len(recommendations.get('buy_recommendations', []))}
  🔴 SELL Recommendations: {len(recommendations.get('sell_recommendations', []))}

  Top Buy Picks:
""")
            for rec in recommendations.get('buy_recommendations', [])[:5]:
                star = "⭐" if rec.get('has_key_politician') else ""
                print(f"    {rec['ticker']} {star} - {rec['confidence']}% confidence")

            print("""
  Next Steps:
  1. Run overnight_training.py to train on these picks
  2. Set up --monitor for continuous updates
  3. Check congress_recommendations.json for full details
""")


if __name__ == "__main__":
    main()
