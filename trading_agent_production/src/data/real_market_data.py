"""
Real Market Data Integration

Connects to actual market data sources:
- Yahoo Finance for historical data
- Alpaca for live paper trading
- Real-time streaming data
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import os

# Check for required packages
try:
    import yfinance as yf
    HAS_YFINANCE = True
except ImportError:
    HAS_YFINANCE = False
    print("⚠️  Install yfinance: pip install yfinance")

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


@dataclass
class RealMarketData:
    """Real market data container."""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    adjusted_close: float = 0.0


class YahooFinanceProvider:
    """
    Yahoo Finance data provider for real historical data.

    Free, no API key required.
    """

    def __init__(self, cache_dir: str = "./market_data_cache"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

        if not HAS_YFINANCE:
            raise ImportError("yfinance not installed. Run: pip install yfinance")

    def download_historical(
        self,
        symbols: List[str],
        start_date: str = "2020-01-01",
        end_date: Optional[str] = None,
        interval: str = "1d"
    ) -> Dict[str, pd.DataFrame]:
        """
        Download historical data for multiple symbols.

        Args:
            symbols: List of stock symbols (e.g., ['AAPL', 'GOOGL'])
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (default: today)
            interval: Data interval ('1d', '1h', '5m', etc.)

        Returns:
            Dict mapping symbol to DataFrame
        """
        if end_date is None:
            end_date = datetime.now().strftime("%Y-%m-%d")

        data = {}

        for symbol in symbols:
            print(f"📥 Downloading {symbol} data from {start_date} to {end_date}...")

            try:
                ticker = yf.Ticker(symbol)
                df = ticker.history(start=start_date, end=end_date, interval=interval)

                if df.empty:
                    print(f"⚠️  No data for {symbol}")
                    continue

                # Standardize column names
                df.columns = [c.lower().replace(' ', '_') for c in df.columns]

                # Cache to disk
                cache_path = f"{self.cache_dir}/{symbol}_{start_date}_{end_date}_{interval}.parquet"
                df.to_parquet(cache_path)

                data[symbol] = df
                print(f"✅ {symbol}: {len(df)} bars downloaded")

            except Exception as e:
                print(f"❌ Error downloading {symbol}: {e}")

        return data

    def get_cached_data(self, symbol: str) -> Optional[pd.DataFrame]:
        """Load cached data if available."""
        import glob

        pattern = f"{self.cache_dir}/{symbol}_*.parquet"
        files = glob.glob(pattern)

        if files:
            # Get most recent cache file
            latest = max(files, key=os.path.getctime)
            return pd.read_parquet(latest)

        return None

    def get_live_quote(self, symbol: str) -> Dict[str, Any]:
        """Get current live quote."""
        ticker = yf.Ticker(symbol)
        info = ticker.info

        return {
            'symbol': symbol,
            'price': info.get('regularMarketPrice', 0),
            'bid': info.get('bid', 0),
            'ask': info.get('ask', 0),
            'volume': info.get('regularMarketVolume', 0),
            'market_cap': info.get('marketCap', 0),
            'pe_ratio': info.get('trailingPE', 0),
            'timestamp': datetime.now().isoformat()
        }

    def get_multiple_quotes(self, symbols: List[str]) -> Dict[str, Dict]:
        """Get quotes for multiple symbols."""
        quotes = {}
        for symbol in symbols:
            try:
                quotes[symbol] = self.get_live_quote(symbol)
            except Exception as e:
                print(f"Error getting quote for {symbol}: {e}")
        return quotes


class AlpacaPaperTrading:
    """
    Alpaca paper trading integration.

    Free paper trading with real market data.
    Sign up at: https://alpaca.markets/
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        paper: bool = True
    ):
        self.api_key = api_key or os.environ.get('ALPACA_API_KEY')
        self.secret_key = secret_key or os.environ.get('ALPACA_SECRET_KEY')
        self.paper = paper

        self.base_url = (
            "https://paper-api.alpaca.markets" if paper
            else "https://api.alpaca.markets"
        )

        self._api = None

    def connect(self) -> bool:
        """Connect to Alpaca API."""
        try:
            from alpaca.trading.client import TradingClient
            from alpaca.data.historical import StockHistoricalDataClient

            self._trading = TradingClient(self.api_key, self.secret_key, paper=self.paper)
            self._data = StockHistoricalDataClient(self.api_key, self.secret_key)

            # Test connection
            account = self._trading.get_account()
            print(f"✅ Connected to Alpaca {'Paper' if self.paper else 'Live'} Trading")
            print(f"   Account: {account.account_number}")
            print(f"   Equity: ${float(account.equity):,.2f}")
            print(f"   Buying Power: ${float(account.buying_power):,.2f}")

            return True

        except ImportError:
            print("⚠️  Install alpaca-py: pip install alpaca-py")
            return False
        except Exception as e:
            print(f"❌ Alpaca connection failed: {e}")
            return False

    def get_account(self) -> Dict[str, Any]:
        """Get account information."""
        if not self._trading:
            return {}

        account = self._trading.get_account()
        return {
            'account_id': account.account_number,
            'equity': float(account.equity),
            'cash': float(account.cash),
            'buying_power': float(account.buying_power),
            'portfolio_value': float(account.portfolio_value),
            'status': account.status
        }

    def submit_order(
        self,
        symbol: str,
        qty: float,
        side: str,  # 'buy' or 'sell'
        order_type: str = 'market',
        limit_price: Optional[float] = None
    ) -> Dict[str, Any]:
        """Submit an order."""
        from alpaca.trading.requests import MarketOrderRequest, LimitOrderRequest
        from alpaca.trading.enums import OrderSide, TimeInForce

        side_enum = OrderSide.BUY if side.lower() == 'buy' else OrderSide.SELL

        if order_type == 'market':
            request = MarketOrderRequest(
                symbol=symbol,
                qty=qty,
                side=side_enum,
                time_in_force=TimeInForce.DAY
            )
        else:
            request = LimitOrderRequest(
                symbol=symbol,
                qty=qty,
                side=side_enum,
                time_in_force=TimeInForce.DAY,
                limit_price=limit_price
            )

        order = self._trading.submit_order(request)

        return {
            'order_id': order.id,
            'symbol': order.symbol,
            'qty': float(order.qty),
            'side': order.side.value,
            'type': order.type.value,
            'status': order.status.value
        }

    def get_positions(self) -> List[Dict[str, Any]]:
        """Get all open positions."""
        positions = self._trading.get_all_positions()

        return [
            {
                'symbol': p.symbol,
                'qty': float(p.qty),
                'avg_entry_price': float(p.avg_entry_price),
                'market_value': float(p.market_value),
                'unrealized_pl': float(p.unrealized_pl),
                'unrealized_plpc': float(p.unrealized_plpc)
            }
            for p in positions
        ]


class RealDataIntegration:
    """
    Main integration class connecting real data to the trading system.
    """

    def __init__(self):
        self.yahoo = YahooFinanceProvider()
        self.alpaca = None

        # Default universe
        self.universe = [
            'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META',
            'NVDA', 'TSLA', 'BRK-B', 'JPM', 'V',
            'JNJ', 'WMT', 'PG', 'MA', 'UNH',
            'HD', 'DIS', 'PYPL', 'NFLX', 'ADBE'
        ]

        self.historical_data: Dict[str, pd.DataFrame] = {}

    def setup(
        self,
        alpaca_key: Optional[str] = None,
        alpaca_secret: Optional[str] = None
    ) -> None:
        """Set up all data connections."""
        print("=" * 60)
        print("SETTING UP REAL MARKET DATA INTEGRATION")
        print("=" * 60)

        # Download historical data
        print("\n📊 Downloading Historical Data...")
        self.historical_data = self.yahoo.download_historical(
            self.universe,
            start_date="2020-01-01"
        )

        total_bars = sum(len(df) for df in self.historical_data.values())
        print(f"\n✅ Total: {total_bars:,} data points across {len(self.historical_data)} symbols")

        # Set up Alpaca if credentials provided
        if alpaca_key and alpaca_secret:
            print("\n🔗 Connecting to Alpaca Paper Trading...")
            self.alpaca = AlpacaPaperTrading(alpaca_key, alpaca_secret)
            self.alpaca.connect()

    def get_training_data(self) -> Dict[str, pd.DataFrame]:
        """Get historical data for strategy training."""
        return self.historical_data

    def get_live_prices(self) -> Dict[str, float]:
        """Get current prices for all symbols."""
        quotes = self.yahoo.get_multiple_quotes(self.universe)
        return {s: q['price'] for s, q in quotes.items()}


# Quick setup function
def setup_real_trading(
    alpaca_key: Optional[str] = None,
    alpaca_secret: Optional[str] = None
) -> RealDataIntegration:
    """
    Quick setup for real trading.

    Usage:
        # Without Alpaca (data only):
        integration = setup_real_trading()

        # With Alpaca paper trading:
        integration = setup_real_trading(
            alpaca_key="your-key",
            alpaca_secret="your-secret"
        )
    """
    integration = RealDataIntegration()
    integration.setup(alpaca_key, alpaca_secret)
    return integration


if __name__ == "__main__":
    # Test the integration
    print("Testing Real Market Data Integration...")

    if HAS_YFINANCE:
        integration = setup_real_trading()

        # Show sample data
        for symbol, df in list(integration.historical_data.items())[:3]:
            print(f"\n{symbol} - Last 5 days:")
            print(df.tail())
    else:
        print("\n⚠️  To use real data, install required packages:")
        print("   pip install yfinance pandas pyarrow alpaca-py")
