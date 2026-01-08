"""
Trading Agent Production System

A comprehensive multi-agent trading platform featuring:
- 500-agent competitive framework (50 teams × 10 specialists)
- 49-round evolutionary tournament
- Real backtesting with walk-forward optimization
- Genetic strategy evolution
- LLM-powered strategy generation
- RL-based execution optimization
- Multi-broker smart order routing
- Distributed backtesting infrastructure
- Real-time monitoring dashboard
- Live paper trading
"""

__version__ = "1.0.0"
__author__ = "TauricResearch"

# Component availability flags
_COMPONENTS = {
    'core': True,
    'backtesting': True,
    'strategies': True,
    'genetics': True,
    'alternative_data': True,
    'ml_models': True,
    'rl_execution': True,
    'distributed': True,
    'monitoring': True,
    'paper_trading': True,
    'tournament': True,
}

def get_available_components():
    """Return list of available components."""
    return [k for k, v in _COMPONENTS.items() if v]

__all__ = [
    "__version__",
    "__author__",
    "get_available_components",
]
