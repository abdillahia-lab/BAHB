"""
Alternative Data Sources for Alpha Generation

Integrates non-traditional data sources:
- Options flow (unusual activity, put/call ratios)
- Sentiment analysis (social media, news)
- Order book data (market microstructure)
- Dark pool activity
"""

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, AsyncIterator, Dict, List, Optional
from enum import Enum
import numpy as np


class SentimentLevel(Enum):
    """Sentiment classification levels."""
    VERY_BEARISH = -2
    BEARISH = -1
    NEUTRAL = 0
    BULLISH = 1
    VERY_BULLISH = 2


class OptionsFlowType(Enum):
    """Types of options flow."""
    CALL_SWEEP = "call_sweep"
    PUT_SWEEP = "put_sweep"
    CALL_BLOCK = "call_block"
    PUT_BLOCK = "put_block"
    BULLISH_ACTIVITY = "bullish"
    BEARISH_ACTIVITY = "bearish"
    UNUSUAL_VOLUME = "unusual_volume"


@dataclass
class OptionsFlow:
    """Options flow data point."""
    timestamp: datetime
    symbol: str
    flow_type: OptionsFlowType
    strike: float
    expiration: datetime
    premium: float
    volume: int
    open_interest: int
    implied_volatility: float
    delta: float
    side: str  # 'buy' or 'sell'
    sentiment_score: float  # -1 to 1

    @property
    def is_bullish(self) -> bool:
        return self.flow_type in {
            OptionsFlowType.CALL_SWEEP,
            OptionsFlowType.CALL_BLOCK,
            OptionsFlowType.BULLISH_ACTIVITY
        }

    @property
    def unusual_score(self) -> float:
        """Score indicating how unusual this activity is."""
        if self.open_interest == 0:
            return 0
        return min(10, self.volume / max(1, self.open_interest))


@dataclass
class SentimentData:
    """Sentiment analysis data point."""
    timestamp: datetime
    symbol: str
    source: str  # 'twitter', 'reddit', 'news', 'stocktwits'
    sentiment_score: float  # -1 to 1
    sentiment_level: SentimentLevel
    volume: int  # Number of mentions
    engagement: int  # Likes, retweets, etc.
    confidence: float  # 0-1
    keywords: List[str] = field(default_factory=list)
    sample_text: str = ""


@dataclass
class OrderBookLevel:
    """Single level in the order book."""
    price: float
    size: int
    order_count: int


@dataclass
class OrderBookSnapshot:
    """Full order book snapshot."""
    timestamp: datetime
    symbol: str
    bids: List[OrderBookLevel]
    asks: List[OrderBookLevel]

    @property
    def mid_price(self) -> float:
        if self.bids and self.asks:
            return (self.bids[0].price + self.asks[0].price) / 2
        return 0

    @property
    def spread(self) -> float:
        if self.bids and self.asks:
            return self.asks[0].price - self.bids[0].price
        return 0

    @property
    def spread_bps(self) -> float:
        """Spread in basis points."""
        mid = self.mid_price
        return (self.spread / mid * 10000) if mid > 0 else 0

    @property
    def bid_depth(self) -> int:
        """Total bid volume."""
        return sum(level.size for level in self.bids)

    @property
    def ask_depth(self) -> int:
        """Total ask volume."""
        return sum(level.size for level in self.asks)

    @property
    def imbalance(self) -> float:
        """Order book imbalance (-1 to 1, positive = more bids)."""
        total = self.bid_depth + self.ask_depth
        if total == 0:
            return 0
        return (self.bid_depth - self.ask_depth) / total


@dataclass
class DarkPoolPrint:
    """Dark pool trade print."""
    timestamp: datetime
    symbol: str
    price: float
    size: int
    venue: str
    is_above_mid: bool
    is_block: bool  # Large block trade

    @property
    def notional(self) -> float:
        return self.price * self.size


@dataclass
class AggregatedAlternativeData:
    """Aggregated alternative data for a symbol."""
    symbol: str
    timestamp: datetime

    # Options metrics
    put_call_ratio: float = 1.0
    options_sentiment: float = 0.0  # -1 to 1
    unusual_options_activity: bool = False
    implied_volatility_rank: float = 0.5  # 0-1

    # Sentiment metrics
    social_sentiment: float = 0.0  # -1 to 1
    news_sentiment: float = 0.0  # -1 to 1
    mention_volume: int = 0
    sentiment_momentum: float = 0.0  # Change in sentiment

    # Order book metrics
    order_book_imbalance: float = 0.0
    spread_percentile: float = 0.5
    depth_ratio: float = 1.0  # bid_depth / ask_depth

    # Dark pool metrics
    dark_pool_sentiment: float = 0.0  # Based on print locations
    dark_pool_volume_ratio: float = 0.0  # Dark vs lit volume

    @property
    def composite_signal(self) -> float:
        """Combined alternative data signal."""
        return (
            0.25 * self.options_sentiment +
            0.20 * self.social_sentiment +
            0.15 * self.news_sentiment +
            0.20 * self.order_book_imbalance +
            0.20 * self.dark_pool_sentiment
        )


class AlternativeDataSource(ABC):
    """Abstract base class for alternative data sources."""

    @abstractmethod
    async def connect(self) -> bool:
        pass

    @abstractmethod
    async def disconnect(self):
        pass

    @abstractmethod
    async def get_latest(self, symbol: str) -> Any:
        pass


class OptionsFlowSource(AlternativeDataSource):
    """
    Options flow data source.

    Tracks unusual options activity for alpha signals.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.connected = False
        self._cache: Dict[str, List[OptionsFlow]] = {}

    async def connect(self) -> bool:
        self.connected = True
        return True

    async def disconnect(self):
        self.connected = False

    async def get_latest(self, symbol: str) -> List[OptionsFlow]:
        """Get recent options flow for a symbol."""
        # Simulated data - would connect to real options flow API
        return self._cache.get(symbol, [])

    async def subscribe(self, symbols: List[str]) -> AsyncIterator[OptionsFlow]:
        """Subscribe to real-time options flow."""
        while self.connected:
            for symbol in symbols:
                # Simulated flow data
                flow = OptionsFlow(
                    timestamp=datetime.utcnow(),
                    symbol=symbol,
                    flow_type=OptionsFlowType.CALL_SWEEP,
                    strike=100.0,
                    expiration=datetime.utcnow() + timedelta(days=30),
                    premium=50000,
                    volume=1000,
                    open_interest=5000,
                    implied_volatility=0.25,
                    delta=0.5,
                    side='buy',
                    sentiment_score=0.7
                )
                yield flow
            await asyncio.sleep(1)

    def calculate_put_call_ratio(self, flows: List[OptionsFlow]) -> float:
        """Calculate put/call ratio from flow data."""
        put_volume = sum(
            f.volume for f in flows
            if f.flow_type in {OptionsFlowType.PUT_SWEEP, OptionsFlowType.PUT_BLOCK}
        )
        call_volume = sum(
            f.volume for f in flows
            if f.flow_type in {OptionsFlowType.CALL_SWEEP, OptionsFlowType.CALL_BLOCK}
        )

        if call_volume == 0:
            return 2.0  # High put/call = bearish
        return put_volume / call_volume

    def detect_unusual_activity(self, flows: List[OptionsFlow], threshold: float = 3.0) -> List[OptionsFlow]:
        """Detect unusual options activity."""
        return [f for f in flows if f.unusual_score > threshold]


class SentimentSource(AlternativeDataSource):
    """
    Social media and news sentiment data source.

    Aggregates sentiment from multiple sources.
    """

    def __init__(self):
        self.connected = False
        self._sentiment_cache: Dict[str, List[SentimentData]] = {}

    async def connect(self) -> bool:
        self.connected = True
        return True

    async def disconnect(self):
        self.connected = False

    async def get_latest(self, symbol: str) -> List[SentimentData]:
        """Get recent sentiment data for a symbol."""
        return self._sentiment_cache.get(symbol, [])

    async def get_aggregated_sentiment(
        self,
        symbol: str,
        lookback_hours: int = 24
    ) -> Dict[str, float]:
        """Get aggregated sentiment metrics."""
        data = await self.get_latest(symbol)

        if not data:
            return {
                'overall': 0.0,
                'twitter': 0.0,
                'reddit': 0.0,
                'news': 0.0,
                'volume': 0,
                'confidence': 0.0
            }

        cutoff = datetime.utcnow() - timedelta(hours=lookback_hours)
        recent = [d for d in data if d.timestamp > cutoff]

        if not recent:
            return {
                'overall': 0.0,
                'twitter': 0.0,
                'reddit': 0.0,
                'news': 0.0,
                'volume': 0,
                'confidence': 0.0
            }

        # Weight by volume and confidence
        total_weight = sum(d.volume * d.confidence for d in recent)
        if total_weight == 0:
            total_weight = 1

        overall = sum(
            d.sentiment_score * d.volume * d.confidence
            for d in recent
        ) / total_weight

        # By source
        by_source = {}
        for source in ['twitter', 'reddit', 'news']:
            source_data = [d for d in recent if d.source == source]
            if source_data:
                source_weight = sum(d.volume * d.confidence for d in source_data)
                by_source[source] = sum(
                    d.sentiment_score * d.volume * d.confidence
                    for d in source_data
                ) / max(source_weight, 1)
            else:
                by_source[source] = 0.0

        return {
            'overall': overall,
            'twitter': by_source.get('twitter', 0.0),
            'reddit': by_source.get('reddit', 0.0),
            'news': by_source.get('news', 0.0),
            'volume': sum(d.volume for d in recent),
            'confidence': np.mean([d.confidence for d in recent])
        }

    def calculate_sentiment_momentum(
        self,
        data: List[SentimentData],
        short_window: int = 6,
        long_window: int = 24
    ) -> float:
        """Calculate sentiment momentum (short-term vs long-term)."""
        if len(data) < 2:
            return 0.0

        now = datetime.utcnow()
        short_cutoff = now - timedelta(hours=short_window)
        long_cutoff = now - timedelta(hours=long_window)

        short_data = [d for d in data if d.timestamp > short_cutoff]
        long_data = [d for d in data if d.timestamp > long_cutoff]

        if not short_data or not long_data:
            return 0.0

        short_avg = np.mean([d.sentiment_score for d in short_data])
        long_avg = np.mean([d.sentiment_score for d in long_data])

        return short_avg - long_avg


class OrderBookSource(AlternativeDataSource):
    """
    Level 2/3 order book data source.

    Provides market microstructure signals.
    """

    def __init__(self):
        self.connected = False
        self._book_cache: Dict[str, OrderBookSnapshot] = {}

    async def connect(self) -> bool:
        self.connected = True
        return True

    async def disconnect(self):
        self.connected = False

    async def get_latest(self, symbol: str) -> Optional[OrderBookSnapshot]:
        """Get latest order book snapshot."""
        return self._book_cache.get(symbol)

    async def subscribe(self, symbols: List[str]) -> AsyncIterator[OrderBookSnapshot]:
        """Subscribe to real-time order book updates."""
        while self.connected:
            for symbol in symbols:
                # Simulated order book
                snapshot = OrderBookSnapshot(
                    timestamp=datetime.utcnow(),
                    symbol=symbol,
                    bids=[
                        OrderBookLevel(99.95, 1000, 5),
                        OrderBookLevel(99.90, 2000, 10),
                        OrderBookLevel(99.85, 3000, 15),
                    ],
                    asks=[
                        OrderBookLevel(100.05, 1000, 5),
                        OrderBookLevel(100.10, 2000, 10),
                        OrderBookLevel(100.15, 3000, 15),
                    ]
                )
                self._book_cache[symbol] = snapshot
                yield snapshot
            await asyncio.sleep(0.1)

    def calculate_vwap_distance(
        self,
        book: OrderBookSnapshot,
        current_price: float,
        levels: int = 5
    ) -> float:
        """Calculate VWAP distance from mid-price."""
        bids = book.bids[:levels]
        asks = book.asks[:levels]

        bid_vwap = sum(l.price * l.size for l in bids) / sum(l.size for l in bids) if bids else 0
        ask_vwap = sum(l.price * l.size for l in asks) / sum(l.size for l in asks) if asks else 0

        if bid_vwap == 0 or ask_vwap == 0:
            return 0

        mid_vwap = (bid_vwap + ask_vwap) / 2
        return (current_price - mid_vwap) / mid_vwap

    def detect_spoofing(
        self,
        book_history: List[OrderBookSnapshot],
        threshold: float = 0.5
    ) -> bool:
        """Detect potential spoofing activity."""
        if len(book_history) < 10:
            return False

        # Large orders appearing and disappearing
        imbalances = [b.imbalance for b in book_history]
        imbalance_std = np.std(imbalances)

        return imbalance_std > threshold


class DarkPoolSource(AlternativeDataSource):
    """
    Dark pool activity data source.

    Tracks off-exchange trading activity.
    """

    def __init__(self):
        self.connected = False
        self._prints: Dict[str, List[DarkPoolPrint]] = {}

    async def connect(self) -> bool:
        self.connected = True
        return True

    async def disconnect(self):
        self.connected = False

    async def get_latest(self, symbol: str) -> List[DarkPoolPrint]:
        """Get recent dark pool prints."""
        return self._prints.get(symbol, [])

    def calculate_dark_sentiment(self, prints: List[DarkPoolPrint]) -> float:
        """Calculate sentiment from dark pool prints."""
        if not prints:
            return 0.0

        # Prints above mid are bullish, below are bearish
        above_mid_volume = sum(p.size for p in prints if p.is_above_mid)
        below_mid_volume = sum(p.size for p in prints if not p.is_above_mid)

        total = above_mid_volume + below_mid_volume
        if total == 0:
            return 0.0

        return (above_mid_volume - below_mid_volume) / total

    def detect_block_trades(
        self,
        prints: List[DarkPoolPrint],
        threshold: int = 10000
    ) -> List[DarkPoolPrint]:
        """Detect significant block trades."""
        return [p for p in prints if p.size >= threshold]


class AlternativeDataAggregator:
    """
    Aggregates data from all alternative sources.

    Provides unified interface for strategy consumption.
    """

    def __init__(self):
        self.options_source = OptionsFlowSource()
        self.sentiment_source = SentimentSource()
        self.orderbook_source = OrderBookSource()
        self.darkpool_source = DarkPoolSource()

    async def connect_all(self):
        """Connect to all data sources."""
        await asyncio.gather(
            self.options_source.connect(),
            self.sentiment_source.connect(),
            self.orderbook_source.connect(),
            self.darkpool_source.connect()
        )

    async def disconnect_all(self):
        """Disconnect from all data sources."""
        await asyncio.gather(
            self.options_source.disconnect(),
            self.sentiment_source.disconnect(),
            self.orderbook_source.disconnect(),
            self.darkpool_source.disconnect()
        )

    async def get_aggregated_data(self, symbol: str) -> AggregatedAlternativeData:
        """Get fully aggregated alternative data for a symbol."""

        # Gather from all sources
        options_flows = await self.options_source.get_latest(symbol)
        sentiment = await self.sentiment_source.get_aggregated_sentiment(symbol)
        orderbook = await self.orderbook_source.get_latest(symbol)
        darkpool_prints = await self.darkpool_source.get_latest(symbol)

        # Calculate metrics
        put_call_ratio = self.options_source.calculate_put_call_ratio(options_flows)
        options_sentiment = self._options_to_sentiment(options_flows)
        unusual_options = len(self.options_source.detect_unusual_activity(options_flows)) > 0

        orderbook_imbalance = orderbook.imbalance if orderbook else 0
        depth_ratio = (orderbook.bid_depth / max(orderbook.ask_depth, 1)) if orderbook else 1.0

        dark_sentiment = self.darkpool_source.calculate_dark_sentiment(darkpool_prints)

        return AggregatedAlternativeData(
            symbol=symbol,
            timestamp=datetime.utcnow(),
            put_call_ratio=put_call_ratio,
            options_sentiment=options_sentiment,
            unusual_options_activity=unusual_options,
            social_sentiment=sentiment.get('twitter', 0) * 0.5 + sentiment.get('reddit', 0) * 0.5,
            news_sentiment=sentiment.get('news', 0),
            mention_volume=sentiment.get('volume', 0),
            order_book_imbalance=orderbook_imbalance,
            depth_ratio=depth_ratio,
            dark_pool_sentiment=dark_sentiment
        )

    def _options_to_sentiment(self, flows: List[OptionsFlow]) -> float:
        """Convert options flow to sentiment score."""
        if not flows:
            return 0.0

        bullish_premium = sum(
            f.premium for f in flows if f.is_bullish
        )
        bearish_premium = sum(
            f.premium for f in flows if not f.is_bullish
        )

        total = bullish_premium + bearish_premium
        if total == 0:
            return 0.0

        return (bullish_premium - bearish_premium) / total
