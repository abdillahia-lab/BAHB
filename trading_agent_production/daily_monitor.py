#!/usr/bin/env python3
"""
Daily Trading Monitor

Runs continuously to:
1. Monitor congressional trading activity
2. Check market data and signals
3. Generate daily trading recommendations
4. Alert on significant changes

Usage:
    # Run as daemon
    python daily_monitor.py

    # Run once
    python daily_monitor.py --once

    # Custom check interval (hours)
    python daily_monitor.py --interval 4
"""

import sys
import os
import asyncio
import json
from datetime import datetime, timedelta

_script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_script_dir, 'src'))

# Import trackers
try:
    from data.congress_tracker import CongressTracker, print_recommendations
    HAS_CONGRESS = True
except ImportError:
    HAS_CONGRESS = False

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


class DailyMonitor:
    """Monitors congressional and market activity daily."""

    def __init__(self, data_dir: str = './market_data'):
        self.data_dir = data_dir
        self.congress_tracker = CongressTracker(cache_dir='./congress_data') if HAS_CONGRESS else None
        self.last_signals = {}
        self.alerts = []

    def check_congress_trades(self):
        """Check for new congressional trades."""
        print("\n🏛️ Checking Congressional Trades...")

        if not self.congress_tracker:
            print("  ⚠️ Congressional tracker not available")
            return None

        self.congress_tracker.fetch_all_trades()
        recommendations = self.congress_tracker.generate_trading_recommendations()

        # Check for new high-value trades
        new_alerts = []
        for rec in recommendations.get('buy_recommendations', []):
            ticker = rec['ticker']
            if rec.get('has_key_politician') and rec.get('confidence', 0) >= 70:
                if ticker not in self.last_signals.get('high_value_buys', []):
                    new_alerts.append({
                        'type': 'CONGRESS_BUY',
                        'ticker': ticker,
                        'confidence': rec['confidence'],
                        'politicians': rec.get('politicians', [])[:3],
                        'timestamp': datetime.now().isoformat()
                    })

        if new_alerts:
            print(f"\n🚨 NEW CONGRESSIONAL ALERTS: {len(new_alerts)}")
            for alert in new_alerts:
                print(f"  📈 {alert['ticker']}: Key politician buying!")
                print(f"     Politicians: {', '.join(alert['politicians'])}")

        self.last_signals['high_value_buys'] = [
            rec['ticker'] for rec in recommendations.get('buy_recommendations', [])
            if rec.get('has_key_politician')
        ]

        self.alerts.extend(new_alerts)
        return recommendations

    def check_market_data(self):
        """Check market data for significant changes."""
        print("\n📊 Checking Market Data...")

        if not os.path.exists(self.data_dir):
            print("  ⚠️ No market data found")
            return None

        signals = []

        for file in os.listdir(self.data_dir):
            if file.endswith('.parquet'):
                symbol = file.replace('.parquet', '')
                try:
                    df = pd.read_parquet(os.path.join(self.data_dir, file))

                    if len(df) < 20:
                        continue

                    # Calculate basic signals
                    close = df['close'].iloc[-1]
                    ma20 = df['close'].rolling(20).mean().iloc[-1]
                    ma50 = df['close'].rolling(50).mean().iloc[-1] if len(df) >= 50 else ma20

                    # RSI
                    delta = df['close'].diff()
                    gain = delta.where(delta > 0, 0).rolling(14).mean().iloc[-1]
                    loss = (-delta.where(delta < 0, 0)).rolling(14).mean().iloc[-1]
                    rs = gain / loss if loss > 0 else 0
                    rsi = 100 - (100 / (1 + rs)) if rs > 0 else 50

                    # Daily change
                    daily_change = (close - df['close'].iloc[-2]) / df['close'].iloc[-2] * 100

                    signals.append({
                        'symbol': symbol,
                        'price': close,
                        'ma20': ma20,
                        'ma50': ma50,
                        'rsi': rsi,
                        'daily_change': daily_change,
                        'trend': 'UP' if close > ma20 > ma50 else 'DOWN' if close < ma20 < ma50 else 'SIDEWAYS'
                    })

                except Exception as e:
                    print(f"  ⚠️ Error reading {symbol}: {e}")

        print(f"  ✅ Analyzed {len(signals)} symbols")
        return signals

    def generate_daily_report(self, congress_recs, market_signals):
        """Generate daily trading report."""
        report = {
            'generated_at': datetime.now().isoformat(),
            'alerts': self.alerts[-20:],  # Last 20 alerts
            'congress': {},
            'market': {},
            'recommendations': [],
        }

        # Congressional summary
        if congress_recs:
            report['congress'] = {
                'total_trades': congress_recs.get('total_trades_analyzed', 0),
                'top_buys': [r['ticker'] for r in congress_recs.get('buy_recommendations', [])[:5]],
                'top_sells': [r['ticker'] for r in congress_recs.get('sell_recommendations', [])[:5]],
                'key_politicians': list(congress_recs.get('key_politician_activity', {}).keys()),
            }

        # Market summary
        if market_signals:
            bullish = [s for s in market_signals if s['trend'] == 'UP' and s['rsi'] < 70]
            bearish = [s for s in market_signals if s['trend'] == 'DOWN' and s['rsi'] > 30]
            oversold = [s for s in market_signals if s['rsi'] < 30]
            overbought = [s for s in market_signals if s['rsi'] > 70]

            report['market'] = {
                'total_symbols': len(market_signals),
                'bullish': [s['symbol'] for s in bullish[:10]],
                'bearish': [s['symbol'] for s in bearish[:10]],
                'oversold': [s['symbol'] for s in oversold],
                'overbought': [s['symbol'] for s in overbought],
            }

        # Combined recommendations
        congress_buys = set(report['congress'].get('top_buys', []))
        market_bullish = set(report['market'].get('bullish', []))

        # Strong buys: both congress AND market signals
        strong_buys = congress_buys & market_bullish
        if strong_buys:
            for ticker in strong_buys:
                report['recommendations'].append({
                    'ticker': ticker,
                    'action': 'STRONG BUY',
                    'reason': 'Congress buying + Technical bullish'
                })

        # Congress-only buys
        congress_only = congress_buys - market_bullish
        for ticker in list(congress_only)[:5]:
            report['recommendations'].append({
                'ticker': ticker,
                'action': 'BUY',
                'reason': 'Congress buying'
            })

        return report

    async def run_once(self):
        """Run a single check."""
        print("=" * 70)
        print("  📊 DAILY TRADING MONITOR")
        print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)

        congress_recs = self.check_congress_trades()
        market_signals = self.check_market_data() if HAS_PANDAS else None

        report = self.generate_daily_report(congress_recs, market_signals)

        # Print summary
        print("\n" + "=" * 70)
        print("  📋 DAILY SUMMARY")
        print("=" * 70)

        if report['recommendations']:
            print("\n🎯 TOP RECOMMENDATIONS:")
            for rec in report['recommendations'][:10]:
                emoji = "🟢" if rec['action'] == 'STRONG BUY' else "📈"
                print(f"  {emoji} {rec['ticker']}: {rec['action']}")
                print(f"     {rec['reason']}")

        if report['congress'].get('top_buys'):
            print(f"\n🏛️ Congress Buying: {', '.join(report['congress']['top_buys'][:5])}")

        if report['market'].get('oversold'):
            print(f"\n📉 Oversold (RSI<30): {', '.join(report['market']['oversold'])}")

        if report['market'].get('overbought'):
            print(f"\n📈 Overbought (RSI>70): {', '.join(report['market']['overbought'])}")

        # Save report
        with open('daily_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)
        print("\n✅ Report saved to daily_report.json")

        return report

    async def run_continuous(self, interval_hours: int = 6):
        """Run continuous monitoring."""
        print("=" * 70)
        print("  📊 DAILY MONITOR - CONTINUOUS MODE")
        print(f"  Checking every {interval_hours} hours")
        print("=" * 70)

        iteration = 0
        while True:
            iteration += 1
            print(f"\n⏰ Check #{iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

            try:
                await self.run_once()
            except Exception as e:
                print(f"❌ Error: {e}")

            print(f"\n💤 Next check in {interval_hours} hours...")
            await asyncio.sleep(interval_hours * 3600)


async def main():
    import argparse
    parser = argparse.ArgumentParser(description='Daily Trading Monitor')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    parser.add_argument('--interval', type=int, default=6, help='Check interval in hours')
    args = parser.parse_args()

    monitor = DailyMonitor()

    if args.once:
        await monitor.run_once()
    else:
        await monitor.run_continuous(args.interval)


if __name__ == "__main__":
    asyncio.run(main())
