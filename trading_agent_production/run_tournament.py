#!/usr/bin/env python3
"""
Run the 49-Round Evolutionary Trading Tournament

This script launches the complete tournament with:
- 50 teams of 10 specialist agents (500 total)
- 49 elimination rounds
- Real backtesting evaluation
- Genetic strategy evolution
- Paper trading validation
- Real-time monitoring

Usage:
    python run_tournament.py [options]

Options:
    --teams N       Number of teams (default: 50)
    --rounds N      Number of rounds (default: 49)
    --capital N     Initial capital per team (default: 1000000)
    --output DIR    Output directory (default: ./tournament_results)
    --fast          Run in fast mode (shorter rounds)
"""

import argparse
import asyncio
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Run the 49-Round Evolutionary Trading Tournament"
    )
    parser.add_argument(
        '--teams', type=int, default=50,
        help='Number of teams (default: 50)'
    )
    parser.add_argument(
        '--rounds', type=int, default=49,
        help='Number of rounds (default: 49)'
    )
    parser.add_argument(
        '--capital', type=float, default=1000000,
        help='Initial capital per team (default: 1000000)'
    )
    parser.add_argument(
        '--output', type=str, default='./tournament_results',
        help='Output directory (default: ./tournament_results)'
    )
    parser.add_argument(
        '--fast', action='store_true',
        help='Run in fast mode with shorter rounds'
    )
    return parser.parse_args()


async def main():
    """Main entry point."""
    args = parse_args()

    print("=" * 70)
    print("  TRADING AGENT PRODUCTION SYSTEM")
    print("  49-Round Evolutionary Tournament")
    print("=" * 70)
    print()
    print(f"  Teams:           {args.teams}")
    print(f"  Agents:          {args.teams * 10}")
    print(f"  Rounds:          {args.rounds}")
    print(f"  Initial Capital: ${args.capital:,.2f}")
    print(f"  Output:          {args.output}")
    print(f"  Mode:            {'Fast' if args.fast else 'Standard'}")
    print()
    print("=" * 70)
    print()

    # Import tournament components
    from tournament.launcher import TournamentConfig, EvolutionaryTournament

    # Create configuration
    config = TournamentConfig(
        num_teams=args.teams,
        specialists_per_team=10,
        total_agents=args.teams * 10,
        total_rounds=args.rounds,
        initial_capital=args.capital,
        round_duration_minutes=5 if args.fast else 60,
        evaluation_duration_minutes=2 if args.fast else 30,
    )

    # Create tournament
    tournament = EvolutionaryTournament(
        config=config,
        output_dir=args.output
    )

    # Add event handlers
    def on_round_start(round_num):
        print(f"\n🏁 Starting Round {round_num}")

    def on_elimination(team_id):
        print(f"❌ Team {team_id} eliminated")

    async def on_tournament_end(results):
        print("\n" + "=" * 70)
        print("  TOURNAMENT COMPLETE!")
        print("=" * 70)
        print(f"\n  🏆 WINNER: {results['winner']['team_name']}")
        print(f"     Score:  {results['winner']['final_score']:.4f}")
        print(f"     Sharpe: {results['winner']['best_sharpe']:.2f}")
        print(f"\n  Results saved to: {args.output}")

    tournament.on_round_start.append(lambda r: asyncio.create_task(asyncio.sleep(0)) or on_round_start(r))
    tournament.on_elimination.append(lambda t: asyncio.create_task(asyncio.sleep(0)) or on_elimination(t))
    tournament.on_tournament_end.append(on_tournament_end)

    # Run tournament
    try:
        results = await tournament.run()
        return 0
    except KeyboardInterrupt:
        print("\n\nTournament interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\nTournament error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
