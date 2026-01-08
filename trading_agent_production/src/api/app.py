"""
FastAPI application setup for Trading Agent Production.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .routes import (
    advisory_router,
    health_router,
    market_router,
    orders_router,
    portfolio_router,
    trading_router,
    ws_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan handler."""
    # Startup
    print("Starting Trading Agent Production API...")
    # Initialize services here
    yield
    # Shutdown
    print("Shutting down Trading Agent Production API...")
    # Cleanup services here


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Trading Agent Production API",
        description="""
        Tier-1 Investment Application API

        This API provides:
        - **Advisory Services**: AI-powered investment guidance
        - **Autonomous Trading**: Automated trade execution
        - **Market Data**: Real-time quotes and historical data
        - **Portfolio Management**: Position and order tracking

        ## Authentication
        All endpoints require authentication via JWT token in the Authorization header.

        ## Rate Limits
        - Standard endpoints: 100 requests/minute
        - Market data endpoints: 1000 requests/minute
        - WebSocket connections: 10 per user

        ## Disclaimer
        This platform is for informational purposes only and does not constitute
        financial advice. Trading involves risk of loss.
        """,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Register routers
    app.include_router(health_router)
    app.include_router(advisory_router)
    app.include_router(trading_router)
    app.include_router(market_router)
    app.include_router(portfolio_router)
    app.include_router(orders_router)
    app.include_router(ws_router)

    return app


# Create the application instance
app = create_app()


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Trading Agent Production API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
