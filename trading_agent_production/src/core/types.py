"""
Core type definitions for the Trading Agent Production System.
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum, auto
from typing import Any, Callable, Dict, List, Optional, Set, Union
from uuid import UUID, uuid4

import numpy as np


# === Enums ===

class SpecialistRole(Enum):
    """10 specialist roles per team."""
    LATENCY_OPTIMIZATION_EXPERT = "LOE"
    SECURITY_ARCHITECT = "SA"
    SYSTEM_ARCHITECTURE_DESIGNER = "SAD"
    PARALLEL_PROCESSING_OPTIMIZER = "PPO"
    FINANCIAL_ANALYST = "FA"
    ORCHESTRATION_SPECIALIST = "OS"
    STRATEGY_SUGGESTER = "SS"
    CODE_REVIEWER = "CR"
    RISK_ASSESSOR = "RA"
    INTEGRATION_ENGINEER = "IE"


class JudgeType(Enum):
    """Types of judges in the system."""
    GENERAL = "general"
    AUTONOMOUS_TRADING = "autonomous_trading"


class MessageType(Enum):
    """Inter-agent message types."""
    OPTIMIZATION_PROPOSAL = "optimization_proposal"
    CODE_REVIEW_REQUEST = "code_review_request"
    PERFORMANCE_REPORT = "performance_report"
    INTEGRATION_UPDATE = "integration_update"
    STRATEGY_SUGGESTION = "strategy_suggestion"
    RISK_ALERT = "risk_alert"
    JUDGE_EVALUATION = "judge_evaluation"
    TEAM_BROADCAST = "team_broadcast"
    ELIMINATION_NOTICE = "elimination_notice"


class Priority(Enum):
    """Message priority levels."""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4


class TournamentPhase(Enum):
    """Tournament phase progression."""
    FOUNDATION = "foundation"  # Rounds 1-10
    OPTIMIZATION = "optimization"  # Rounds 11-25
    INTEGRATION = "integration"  # Rounds 26-40
    CHAMPIONSHIP = "championship"  # Rounds 41-49


class PreservationDecision(Enum):
    """Judge preservation decisions."""
    PRESERVE = "preserve"
    PRESERVE_WITH_REVIEW = "preserve_with_review"
    ARCHIVE = "archive"
    REJECT = "reject"


class OrderSide(Enum):
    """Trading order side."""
    BUY = "buy"
    SELL = "sell"


class OrderType(Enum):
    """Trading order types."""
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"
    TRAILING_STOP = "trailing_stop"


class OrderStatus(Enum):
    """Order lifecycle status."""
    PENDING = "pending"
    SUBMITTED = "submitted"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class SignalStrength(Enum):
    """Trading signal strength."""
    STRONG_BUY = 2
    BUY = 1
    NEUTRAL = 0
    SELL = -1
    STRONG_SELL = -2


class MarketRegime(Enum):
    """Market regime classification."""
    BULL_TRENDING = "bull_trending"
    BEAR_TRENDING = "bear_trending"
    RANGING = "ranging"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"


# === Core Data Classes ===

@dataclass
class TeamIdentifier:
    """Unique team identification."""
    team_number: int
    team_id: str = field(init=False)

    def __post_init__(self):
        self.team_id = f"T{self.team_number:02d}"


@dataclass
class AgentIdentifier:
    """Unique agent identification within team."""
    team: TeamIdentifier
    role: SpecialistRole
    agent_id: str = field(init=False)

    def __post_init__(self):
        self.agent_id = f"{self.team.team_id}-{self.role.value}"


@dataclass
class AgentMessage:
    """Inter-agent communication message."""
    sender_id: str
    receiver_id: str  # Can be "ALL" for broadcast
    message_type: MessageType
    payload: Dict[str, Any]
    priority: Priority = Priority.NORMAL
    correlation_id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "message_type": self.message_type.value,
            "payload": self.payload,
            "priority": self.priority.value,
            "correlation_id": self.correlation_id,
            "timestamp": self.timestamp.isoformat()
        }


@dataclass
class CodeArtifact:
    """Represents a code contribution from an agent."""
    artifact_id: str
    team_id: str
    specialist_role: SpecialistRole
    component: str
    file_path: str
    code_content: str
    description: str
    optimization_type: str
    created_at: datetime = field(default_factory=datetime.utcnow)

    # Metrics
    lines_added: int = 0
    lines_removed: int = 0
    test_coverage: float = 0.0
    complexity_score: float = 0.0


@dataclass
class PerformanceMetrics:
    """Performance metrics for evaluation."""
    latency_p50_ms: float
    latency_p95_ms: float
    latency_p99_ms: float
    throughput_rps: float
    memory_usage_mb: float
    cpu_utilization: float
    error_rate: float

    def to_dict(self) -> Dict[str, float]:
        return {
            "latency_p50_ms": self.latency_p50_ms,
            "latency_p95_ms": self.latency_p95_ms,
            "latency_p99_ms": self.latency_p99_ms,
            "throughput_rps": self.throughput_rps,
            "memory_usage_mb": self.memory_usage_mb,
            "cpu_utilization": self.cpu_utilization,
            "error_rate": self.error_rate
        }


@dataclass
class EvaluationScore:
    """Evaluation scores from judges."""
    correctness: float  # 0-1
    performance: float  # 0-1
    maintainability: float  # 0-1
    reusability: float  # 0-1
    innovation: float  # 0-1
    integration_compatibility: float  # 0-1

    @property
    def composite_score(self) -> float:
        weights = {
            "correctness": 0.25,
            "performance": 0.25,
            "maintainability": 0.15,
            "reusability": 0.15,
            "innovation": 0.10,
            "integration_compatibility": 0.10
        }
        return sum(
            getattr(self, attr) * weight
            for attr, weight in weights.items()
        )


@dataclass
class TeamScore:
    """Composite team score for elimination rounds."""
    team_id: str
    round_number: int

    # Component scores (0-1)
    latency_score: float
    security_score: float
    architecture_score: float
    parallel_score: float
    financial_score: float
    orchestration_score: float
    strategy_score: float
    code_quality_score: float
    risk_score: float
    integration_score: float

    # Innovation bonus (0-0.1)
    innovation_bonus: float = 0.0

    @property
    def elimination_score(self) -> float:
        """Calculate weighted elimination score."""
        return (
            0.20 * self.latency_score +
            0.15 * self.security_score +
            0.15 * self.architecture_score +
            0.10 * self.parallel_score +
            0.15 * self.financial_score +
            0.05 * self.orchestration_score +
            0.05 * self.strategy_score +
            0.10 * self.code_quality_score +
            0.05 * self.risk_score +
            0.05 * self.integration_score +
            self.innovation_bonus
        )


@dataclass
class PreservedSolution:
    """A solution preserved by judges for integration."""
    solution_id: str
    team_id: str
    specialist_role: SpecialistRole
    artifact: CodeArtifact
    evaluation_score: EvaluationScore
    judge_id: str
    decision: PreservationDecision
    category: str
    round_preserved: int
    notes: str = ""


# === Trading Types ===

@dataclass
class Tick:
    """Real-time market tick data."""
    symbol: str
    price: Decimal
    bid: Decimal
    ask: Decimal
    volume: int
    timestamp: datetime
    source: str

    @property
    def spread(self) -> Decimal:
        return self.ask - self.bid

    @property
    def mid_price(self) -> Decimal:
        return (self.bid + self.ask) / 2


@dataclass
class OHLCV:
    """Candlestick data."""
    symbol: str
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int
    timestamp: datetime
    timeframe: str  # "1m", "5m", "1h", "1d", etc.


@dataclass
class TechnicalIndicators:
    """Technical analysis indicators."""
    symbol: str
    timestamp: datetime

    # Trend indicators
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None
    ema_12: Optional[float] = None
    ema_26: Optional[float] = None

    # Momentum indicators
    rsi_14: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    stochastic_k: Optional[float] = None
    stochastic_d: Optional[float] = None

    # Volatility indicators
    bollinger_upper: Optional[float] = None
    bollinger_middle: Optional[float] = None
    bollinger_lower: Optional[float] = None
    atr_14: Optional[float] = None

    # Volume indicators
    obv: Optional[float] = None
    vwap: Optional[float] = None


@dataclass
class TradingSignal:
    """Trading signal from strategy."""
    signal_id: str
    strategy_id: str
    symbol: str
    side: OrderSide
    strength: SignalStrength
    entry_price: Decimal
    target_price: Optional[Decimal]
    stop_loss: Optional[Decimal]
    position_size: Decimal
    confidence: float  # 0-1
    reasoning: str
    generated_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None


@dataclass
class Order:
    """Trading order."""
    order_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: Decimal
    limit_price: Optional[Decimal] = None
    stop_price: Optional[Decimal] = None
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: Decimal = Decimal("0")
    average_fill_price: Optional[Decimal] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    client_order_id: Optional[str] = None

    @property
    def is_active(self) -> bool:
        return self.status in {
            OrderStatus.PENDING,
            OrderStatus.SUBMITTED,
            OrderStatus.PARTIALLY_FILLED
        }


@dataclass
class Position:
    """Trading position."""
    symbol: str
    quantity: Decimal
    average_entry_price: Decimal
    current_price: Decimal
    market_value: Decimal
    unrealized_pnl: Decimal
    realized_pnl: Decimal
    cost_basis: Decimal

    @property
    def unrealized_pnl_percent(self) -> float:
        if self.cost_basis == 0:
            return 0.0
        return float((self.unrealized_pnl / self.cost_basis) * 100)


@dataclass
class Portfolio:
    """Trading portfolio."""
    account_id: str
    cash: Decimal
    positions: List[Position]
    total_value: Decimal
    daily_pnl: Decimal
    total_pnl: Decimal
    buying_power: Decimal

    @property
    def position_count(self) -> int:
        return len(self.positions)

    def get_position(self, symbol: str) -> Optional[Position]:
        for pos in self.positions:
            if pos.symbol == symbol:
                return pos
        return None


@dataclass
class RiskMetrics:
    """Risk assessment metrics."""
    var_95: Decimal  # Value at Risk 95%
    var_99: Decimal  # Value at Risk 99%
    cvar_95: Decimal  # Conditional VaR 95%
    max_drawdown: float
    current_drawdown: float
    sharpe_ratio: float
    sortino_ratio: float
    beta: float
    correlation_to_market: float
    position_concentration: float  # Largest position as % of portfolio


@dataclass
class StrategyPerformance:
    """Strategy backtesting/live performance."""
    strategy_id: str
    start_date: datetime
    end_date: datetime
    total_return: float
    annualized_return: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    win_rate: float
    profit_factor: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    average_win: Decimal
    average_loss: Decimal
    expectancy: Decimal


# === User Types ===

@dataclass
class UserPreferences:
    """User investment preferences."""
    risk_tolerance: str  # "conservative", "moderate", "aggressive"
    investment_horizon: str  # "short", "medium", "long"
    preferred_sectors: List[str]
    excluded_sectors: List[str]
    max_position_size_percent: float
    enable_options: bool
    enable_margin: bool
    enable_crypto: bool


@dataclass
class User:
    """Application user."""
    user_id: str
    email: str
    preferences: UserPreferences
    created_at: datetime
    is_verified: bool = False
    is_autonomous_enabled: bool = False


@dataclass
class AdvisoryQuery:
    """User query to the advisory system."""
    query_id: str
    user_id: str
    query_text: str
    context: Optional[Dict[str, Any]] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class AdvisoryResponse:
    """Response from advisory system."""
    query_id: str
    recommendation: str
    analysis: Dict[str, Any]
    confidence: float
    supporting_data: Dict[str, Any]
    disclaimer: str
    generated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class DailyGuidance:
    """Daily investment guidance."""
    user_id: str
    date: datetime
    market_outlook: str
    recommendations: List[Dict[str, Any]]
    risk_assessment: str
    opportunities: List[Dict[str, Any]]
    watchlist_updates: List[Dict[str, Any]]
    generated_at: datetime = field(default_factory=datetime.utcnow)


# === Configuration Types ===

@dataclass
class CompetitiveFrameworkConfig:
    """Configuration for competitive agent framework."""
    total_teams: int = 50
    agents_per_team: int = 10
    elimination_rounds: int = 49
    general_judges: int = 10
    trading_judges: int = 3
    round_duration_hours: int = 24


@dataclass
class PerformanceTargets:
    """Target performance metrics."""
    order_latency_p99_ms: float = 10.0
    data_latency_ms: float = 1.0
    api_latency_p95_ms: float = 100.0
    throughput_rps: int = 10000
    uptime_percent: float = 99.99


@dataclass
class TradingConfig:
    """Trading engine configuration."""
    enabled: bool = True
    mode: str = "paper"  # "paper" or "live"
    max_position_size: Decimal = Decimal("10000")
    max_portfolio_exposure: float = 0.8
    default_stop_loss_percent: float = 2.0
    default_take_profit_percent: float = 4.0
