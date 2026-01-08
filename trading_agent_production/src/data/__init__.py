"""Real Market Data Integration."""

from .real_market_data import (
    RealMarketData,
    YahooFinanceProvider,
    AlpacaPaperTrading,
    RealDataIntegration,
    setup_real_trading,
)

from .congress_tracker import (
    CongressTracker,
    CongressTrade,
    KEY_POLITICIANS,
    get_congress_buy_list,
    print_recommendations,
)

__all__ = [
    "RealMarketData",
    "YahooFinanceProvider",
    "AlpacaPaperTrading",
    "RealDataIntegration",
    "setup_real_trading",
    "CongressTracker",
    "CongressTrade",
    "KEY_POLITICIANS",
    "get_congress_buy_list",
    "print_recommendations",
]
