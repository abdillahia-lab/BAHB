#!/bin/bash
# Trading Agent Monitor - Updates every 10 minutes

while true; do
    clear
    echo "════════════════════════════════════════════════════════════════"
    echo "  🔥 AGGRESSIVE TRADING AGENT - LIVE STATUS"
    echo "  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "════════════════════════════════════════════════════════════════"
    echo ""

    # Get trading status
    echo "📊 TRADING STATUS:"
    curl -s http://localhost:8000/api/v1/trading/status | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f\"   Running: {'✅ YES' if d['is_running'] else '❌ NO'}\")
print(f\"   Halted: {'🛑 YES - ' + str(d.get('halt_reason', '')) if d['is_halted'] else '✅ NO'}\")
print(f\"   Daily P&L: \${d['daily_pnl']:,.2f}\")
print(f\"   Portfolio Value: \${d['portfolio_value']:,.2f}\")
print(f\"   Active Positions: {d['position_count']}\")
print(f\"   Strategies: {', '.join(d['active_strategies'])}\")
"
    echo ""

    # Get portfolio
    echo "💰 PORTFOLIO POSITIONS:"
    curl -s http://localhost:8000/api/v1/portfolio | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f\"   Cash: \${d['cash']:,.2f}\")
print(f\"   Total Value: \${d['total_value']:,.2f}\")
print(f\"   Total P&L: \${d['total_pnl']:,.2f}\")
print(f\"   Buying Power: \${d['buying_power']:,.2f}\")
print()
print('   POSITIONS:')
print('   ─────────────────────────────────────────────────────────')
for p in d['positions']:
    pnl_emoji = '🟢' if p['unrealized_pnl'] > 0 else '🔴'
    print(f\"   {pnl_emoji} {p['symbol']:6} | Qty: {p['quantity']:>6.0f} | Entry: \${p['average_entry_price']:>8.2f} | Now: \${p['current_price']:>8.2f} | P&L: \${p['unrealized_pnl']:>+10,.2f} ({p['unrealized_pnl_percent']:>+6.2f}%)\")
"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  Next update in 10 minutes... (Ctrl+C to stop)"
    echo "════════════════════════════════════════════════════════════════"

    sleep 600  # 10 minutes
done
