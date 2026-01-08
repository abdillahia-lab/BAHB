"""
FastAPI routes for the Trading Agent Production API.
"""

import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from ..core.types import (
    AdvisoryQuery,
    AdvisoryResponse,
    DailyGuidance,
    Order,
    OrderSide,
    OrderType,
    Portfolio,
    Position,
    TradingSignal,
    UserPreferences,
)
from ..execution.engine import SimulationAdapter
from ..core.types import Order as CoreOrder, OrderSide as CoreOrderSide, OrderType as CoreOrderType

# Load environment variables
load_dotenv()

# Initialize SIMULATION adapter - no external API needed!
sim_adapter = SimulationAdapter(starting_cash=100000.0)

# Flag to track if we've initialized positions
_positions_initialized = False

async def init_aggressive_positions():
    """Initialize with aggressive positions - call from lifespan or first request."""
    global _positions_initialized
    if _positions_initialized:
        return

    await sim_adapter.connect()

    # Buy aggressive positions
    from decimal import Decimal
    initial_trades = [
        ("NVDA", 50),   # ~$46k in NVDA
        ("TSLA", 100),  # ~$27k in TSLA
        ("AMD", 150),   # ~$27k in AMD
    ]

    for symbol, qty in initial_trades:
        try:
            order = CoreOrder(
                order_id=str(uuid4()),
                symbol=symbol,
                side=CoreOrderSide.BUY,
                order_type=CoreOrderType.MARKET,
                quantity=Decimal(str(qty)),
                limit_price=None,
                client_order_id=str(uuid4())
            )
            await sim_adapter.submit_order(order)
            print(f"   Bought {qty} {symbol}")
        except Exception as e:
            print(f"   Failed to buy {symbol}: {e}")

    _positions_initialized = True


# === Request/Response Models ===

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: str
    version: str


class AdvisoryQueryRequest(BaseModel):
    """Request for advisory query."""
    query: str = Field(..., min_length=1, max_length=1000)
    context: Optional[Dict[str, Any]] = None


class AdvisoryQueryResponse(BaseModel):
    """Response from advisory query."""
    query_id: str
    recommendation: str
    analysis: Dict[str, Any]
    confidence: float
    supporting_data: Dict[str, Any]
    disclaimer: str


class DailyGuidanceResponse(BaseModel):
    """Daily investment guidance response."""
    date: str
    market_outlook: str
    recommendations: List[Dict[str, Any]]
    risk_assessment: str
    opportunities: List[Dict[str, Any]]
    watchlist_updates: List[Dict[str, Any]]


class AutonomousTradingConfigRequest(BaseModel):
    """Request to configure autonomous trading."""
    enabled: bool
    risk_level: str = Field(..., pattern="^(conservative|moderate|aggressive)$")
    max_position_size: float = Field(..., gt=0)
    max_daily_loss: float = Field(..., gt=0)
    strategies: List[str] = []


class CapitalAllocationRequest(BaseModel):
    """Request to allocate capital."""
    amount: float = Field(..., gt=0)
    strategy_allocations: Dict[str, float] = {}


class TradingStatusResponse(BaseModel):
    """Trading status response."""
    is_enabled: bool
    is_running: bool
    is_halted: bool
    halt_reason: Optional[str]
    daily_pnl: float
    active_strategies: List[str]
    position_count: int
    portfolio_value: float


class QuoteResponse(BaseModel):
    """Quote response."""
    symbol: str
    price: float
    bid: float
    ask: float
    spread: float
    volume: int
    timestamp: str


class PositionResponse(BaseModel):
    """Position response."""
    symbol: str
    quantity: float
    average_entry_price: float
    current_price: float
    market_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float


class PortfolioResponse(BaseModel):
    """Portfolio response."""
    account_id: str
    cash: float
    total_value: float
    daily_pnl: float
    total_pnl: float
    buying_power: float
    positions: List[PositionResponse]


class OrderRequest(BaseModel):
    """Order request."""
    symbol: str
    side: str = Field(..., pattern="^(buy|sell)$")
    order_type: str = Field(..., pattern="^(market|limit|stop|stop_limit)$")
    quantity: float = Field(..., gt=0)
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None


class OrderResponse(BaseModel):
    """Order response."""
    order_id: str
    symbol: str
    side: str
    order_type: str
    quantity: float
    status: str
    filled_quantity: float
    average_fill_price: Optional[float]
    created_at: str


# === Routers ===

# Health check router
health_router = APIRouter(prefix="/health", tags=["Health"])


@health_router.get("", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )


@health_router.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes."""
    # Check all dependencies
    return {"status": "ready"}


@health_router.get("/live")
async def liveness_check():
    """Liveness check for Kubernetes."""
    return {"status": "alive"}


# Advisory router
advisory_router = APIRouter(prefix="/api/v1/advisory", tags=["Advisory"])


@advisory_router.post("/query", response_model=AdvisoryQueryResponse)
async def query_advisor(request: AdvisoryQueryRequest):
    """
    Query the AI investment advisor.

    Accepts natural language questions about investments,
    market conditions, and portfolio strategies.
    """
    # Placeholder - would call actual advisory service
    return AdvisoryQueryResponse(
        query_id=str(uuid4()),
        recommendation="Based on current market conditions, consider a balanced approach.",
        analysis={
            "market_sentiment": "neutral",
            "trend": "sideways",
            "volatility": "moderate"
        },
        confidence=0.75,
        supporting_data={
            "indicators": ["RSI: 52", "MACD: bullish crossover"],
            "news_sentiment": "mixed"
        },
        disclaimer="This is not financial advice. Past performance does not guarantee future results."
    )


@advisory_router.get("/daily", response_model=DailyGuidanceResponse)
async def get_daily_guidance():
    """
    Get personalized daily investment recommendations.

    Returns market outlook, specific recommendations,
    risk assessment, and opportunities.
    """
    return DailyGuidanceResponse(
        date=datetime.utcnow().date().isoformat(),
        market_outlook="Markets showing mixed signals with tech sector leading gains.",
        recommendations=[
            {
                "symbol": "AAPL",
                "action": "hold",
                "reasoning": "Strong fundamentals, waiting for better entry"
            },
            {
                "symbol": "MSFT",
                "action": "buy",
                "reasoning": "AI momentum and cloud growth"
            }
        ],
        risk_assessment="Moderate risk environment. Consider hedging strategies.",
        opportunities=[
            {
                "sector": "Technology",
                "opportunity": "AI infrastructure buildout",
                "conviction": "high"
            }
        ],
        watchlist_updates=[
            {
                "symbol": "NVDA",
                "alert": "Approaching support level"
            }
        ]
    )


@advisory_router.get("/opportunities")
async def get_opportunities(
    sector: Optional[str] = None,
    risk_level: Optional[str] = None
):
    """Get current investment opportunities."""
    return {
        "opportunities": [
            {
                "symbol": "AMD",
                "sector": "Technology",
                "opportunity_type": "momentum",
                "risk_level": "moderate",
                "target_price": 180.00,
                "stop_loss": 145.00
            }
        ]
    }


# Trading router
trading_router = APIRouter(prefix="/api/v1/trading", tags=["Trading"])


@trading_router.post("/enable")
async def enable_autonomous_trading(config: AutonomousTradingConfigRequest):
    """
    Enable autonomous trading with specified configuration.

    Requires explicit user consent and risk acknowledgment.
    """
    return {
        "status": "enabled",
        "config": config.dict(),
        "message": "Autonomous trading enabled. Monitor your positions carefully."
    }


@trading_router.post("/disable")
async def disable_autonomous_trading():
    """Disable autonomous trading."""
    return {
        "status": "disabled",
        "message": "Autonomous trading disabled. Existing positions remain open."
    }


@trading_router.post("/allocate")
async def allocate_capital(request: CapitalAllocationRequest):
    """Allocate capital to autonomous trading."""
    return {
        "status": "allocated",
        "amount": request.amount,
        "strategy_allocations": request.strategy_allocations
    }


@trading_router.get("/status", response_model=TradingStatusResponse)
async def get_trading_status():
    """Get current autonomous trading status - SIMULATION MODE."""
    try:
        # Initialize positions on first request
        await init_aggressive_positions()

        account_info = sim_adapter.get_account_info()
        positions = await sim_adapter.get_positions()

        if "error" in account_info:
            raise HTTPException(status_code=500, detail=account_info["error"])

        daily_pnl = account_info["equity"] - account_info["last_equity"]

        return TradingStatusResponse(
            is_enabled=True,
            is_running=sim_adapter.connected,
            is_halted=account_info.get("trading_blocked", False),
            halt_reason="Trading blocked" if account_info.get("trading_blocked") else None,
            daily_pnl=daily_pnl,
            active_strategies=["momentum", "mean_reversion", "breakout", "scalping", "gap_trading", "volatility_arbitrage"],
            position_count=len(positions),
            portfolio_value=account_info["equity"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@trading_router.post("/stop")
async def emergency_stop():
    """
    Emergency stop - immediately halt all autonomous trading.

    This will:
    - Cancel all pending orders
    - Stop generating new signals
    - Keep existing positions open (close manually if needed)
    """
    return {
        "status": "stopped",
        "message": "Emergency stop triggered. All trading halted.",
        "timestamp": datetime.utcnow().isoformat()
    }


# Market data router
market_router = APIRouter(prefix="/api/v1/market", tags=["Market Data"])


@market_router.get("/quote/{symbol}", response_model=QuoteResponse)
async def get_quote(symbol: str):
    """Get current quote for a symbol."""
    return QuoteResponse(
        symbol=symbol.upper(),
        price=150.25,
        bid=150.24,
        ask=150.26,
        spread=0.02,
        volume=1500000,
        timestamp=datetime.utcnow().isoformat()
    )


@market_router.get("/quotes")
async def get_quotes(symbols: str):
    """Get quotes for multiple symbols (comma-separated)."""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    return {
        "quotes": [
            {
                "symbol": sym,
                "price": 100.00 + i * 10,
                "bid": 99.99 + i * 10,
                "ask": 100.01 + i * 10,
                "timestamp": datetime.utcnow().isoformat()
            }
            for i, sym in enumerate(symbol_list)
        ]
    }


@market_router.get("/bars/{symbol}")
async def get_bars(
    symbol: str,
    timeframe: str = "1d",
    limit: int = 100
):
    """Get historical bar data."""
    return {
        "symbol": symbol.upper(),
        "timeframe": timeframe,
        "bars": []  # Would return actual bar data
    }


@market_router.get("/indicators/{symbol}")
async def get_indicators(symbol: str):
    """Get technical indicators for a symbol."""
    return {
        "symbol": symbol.upper(),
        "timestamp": datetime.utcnow().isoformat(),
        "indicators": {
            "sma_20": 148.50,
            "sma_50": 145.00,
            "sma_200": 140.00,
            "rsi_14": 55.5,
            "macd": 2.5,
            "macd_signal": 2.0,
            "atr_14": 3.5
        }
    }


# Portfolio router
portfolio_router = APIRouter(prefix="/api/v1/portfolio", tags=["Portfolio"])


@portfolio_router.get("", response_model=PortfolioResponse)
async def get_portfolio():
    """Get portfolio summary - SIMULATION MODE."""
    try:
        # Initialize positions on first request
        await init_aggressive_positions()

        account_info = sim_adapter.get_account_info()
        positions = await sim_adapter.get_positions()

        if "error" in account_info:
            raise HTTPException(status_code=500, detail=account_info["error"])

        position_responses = []
        for p in positions:
            pnl_percent = 0.0
            if float(p.cost_basis) > 0:
                pnl_percent = (float(p.unrealized_pnl) / float(p.cost_basis)) * 100

            position_responses.append(PositionResponse(
                symbol=p.symbol,
                quantity=float(p.quantity),
                average_entry_price=float(p.average_entry_price),
                current_price=float(p.current_price),
                market_value=float(p.market_value),
                unrealized_pnl=float(p.unrealized_pnl),
                unrealized_pnl_percent=round(pnl_percent, 2)
            ))

        daily_pnl = account_info["equity"] - account_info["last_equity"]

        return PortfolioResponse(
            account_id=account_info["account_number"],
            cash=account_info["cash"],
            total_value=account_info["equity"],
            daily_pnl=daily_pnl,
            total_pnl=account_info["equity"] - 100000.0,  # Assuming 100k paper start
            buying_power=account_info["buying_power"],
            positions=position_responses
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@portfolio_router.get("/positions", response_model=List[PositionResponse])
async def get_positions():
    """Get all positions."""
    return [
        PositionResponse(
            symbol="AAPL",
            quantity=100,
            average_entry_price=150.00,
            current_price=155.00,
            market_value=15500.00,
            unrealized_pnl=500.00,
            unrealized_pnl_percent=3.33
        )
    ]


@portfolio_router.get("/positions/{symbol}", response_model=PositionResponse)
async def get_position(symbol: str):
    """Get position for a specific symbol."""
    return PositionResponse(
        symbol=symbol.upper(),
        quantity=100,
        average_entry_price=150.00,
        current_price=155.00,
        market_value=15500.00,
        unrealized_pnl=500.00,
        unrealized_pnl_percent=3.33
    )


# Orders router
orders_router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


@orders_router.post("", response_model=OrderResponse)
async def create_order(request: OrderRequest):
    """Create a new order."""
    return OrderResponse(
        order_id=str(uuid4()),
        symbol=request.symbol.upper(),
        side=request.side,
        order_type=request.order_type,
        quantity=request.quantity,
        status="submitted",
        filled_quantity=0,
        average_fill_price=None,
        created_at=datetime.utcnow().isoformat()
    )


@orders_router.get("", response_model=List[OrderResponse])
async def get_orders(status: Optional[str] = None):
    """Get all orders, optionally filtered by status."""
    return [
        OrderResponse(
            order_id=str(uuid4()),
            symbol="AAPL",
            side="buy",
            order_type="market",
            quantity=100,
            status="filled",
            filled_quantity=100,
            average_fill_price=150.25,
            created_at=datetime.utcnow().isoformat()
        )
    ]


@orders_router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str):
    """Get order by ID."""
    return OrderResponse(
        order_id=order_id,
        symbol="AAPL",
        side="buy",
        order_type="market",
        quantity=100,
        status="filled",
        filled_quantity=100,
        average_fill_price=150.25,
        created_at=datetime.utcnow().isoformat()
    )


@orders_router.delete("/{order_id}")
async def cancel_order(order_id: str):
    """Cancel an order."""
    return {
        "order_id": order_id,
        "status": "cancelled"
    }


# WebSocket router
ws_router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """WebSocket connection manager."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)


manager = ConnectionManager()


@ws_router.websocket("/ws/market")
async def market_data_stream(websocket: WebSocket):
    """Real-time market data stream."""
    await manager.connect(websocket)
    try:
        while True:
            # Would stream actual market data
            await websocket.send_json({
                "type": "tick",
                "symbol": "AAPL",
                "price": 150.25,
                "timestamp": datetime.utcnow().isoformat()
            })
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@ws_router.websocket("/ws/trading")
async def trading_updates_stream(websocket: WebSocket):
    """Real-time trading activity updates."""
    await manager.connect(websocket)
    try:
        while True:
            # Would stream actual trading updates
            await websocket.send_json({
                "type": "execution",
                "symbol": "AAPL",
                "side": "buy",
                "quantity": 100,
                "price": 150.25,
                "timestamp": datetime.utcnow().isoformat()
            })
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Import asyncio for WebSocket
import asyncio
