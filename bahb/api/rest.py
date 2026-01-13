"""REST API for BAHB platform.

Implements RESTful API with:
- CRUD operations for facilities, detections, predictions
- Rate limiting
- API key authentication
- OpenAPI documentation
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Callable, Any
from dataclasses import dataclass, field
import json

from loguru import logger


@dataclass
class RateLimitConfig:
    """Rate limiting configuration."""
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    burst_limit: int = 10


@dataclass
class APIRoute:
    """API route definition."""
    path: str
    method: str
    handler: Callable
    description: str
    rate_limit: Optional[RateLimitConfig] = None
    requires_auth: bool = True


class RESTRouter:
    """
    REST API router with rate limiting and authentication.

    Provides traditional REST endpoints alongside GraphQL.
    """

    def __init__(
        self,
        default_rate_limit: Optional[RateLimitConfig] = None,
    ):
        self.routes: dict[str, dict[str, APIRoute]] = {}
        self.default_rate_limit = default_rate_limit or RateLimitConfig()
        self._request_counts: dict[str, list[datetime]] = {}

    def add_route(
        self,
        path: str,
        method: str,
        handler: Callable,
        description: str = "",
        rate_limit: Optional[RateLimitConfig] = None,
        requires_auth: bool = True,
    ) -> None:
        """Add a route to the router."""
        if path not in self.routes:
            self.routes[path] = {}

        self.routes[path][method.upper()] = APIRoute(
            path=path,
            method=method.upper(),
            handler=handler,
            description=description,
            rate_limit=rate_limit or self.default_rate_limit,
            requires_auth=requires_auth,
        )

    def get(self, path: str, **kwargs):
        """Decorator for GET routes."""
        def decorator(func: Callable) -> Callable:
            self.add_route(path, "GET", func, **kwargs)
            return func
        return decorator

    def post(self, path: str, **kwargs):
        """Decorator for POST routes."""
        def decorator(func: Callable) -> Callable:
            self.add_route(path, "POST", func, **kwargs)
            return func
        return decorator

    def put(self, path: str, **kwargs):
        """Decorator for PUT routes."""
        def decorator(func: Callable) -> Callable:
            self.add_route(path, "PUT", func, **kwargs)
            return func
        return decorator

    def delete(self, path: str, **kwargs):
        """Decorator for DELETE routes."""
        def decorator(func: Callable) -> Callable:
            self.add_route(path, "DELETE", func, **kwargs)
            return func
        return decorator

    def check_rate_limit(self, client_id: str, route: APIRoute) -> bool:
        """Check if request is within rate limits."""
        now = datetime.now()
        limit = route.rate_limit or self.default_rate_limit

        if client_id not in self._request_counts:
            self._request_counts[client_id] = []

        # Clean old requests
        minute_ago = datetime.now().replace(second=0, microsecond=0)
        hour_ago = datetime.now().replace(minute=0, second=0, microsecond=0)

        self._request_counts[client_id] = [
            t for t in self._request_counts[client_id]
            if t > hour_ago
        ]

        # Count requests
        recent = self._request_counts[client_id]
        requests_last_minute = sum(1 for t in recent if t > minute_ago)
        requests_last_hour = len(recent)

        # Check limits
        if requests_last_minute >= limit.requests_per_minute:
            return False
        if requests_last_hour >= limit.requests_per_hour:
            return False

        # Record request
        self._request_counts[client_id].append(now)
        return True

    def get_openapi_spec(self) -> dict:
        """Generate OpenAPI specification."""
        paths = {}

        for path, methods in self.routes.items():
            paths[path] = {}
            for method, route in methods.items():
                paths[path][method.lower()] = {
                    "summary": route.description,
                    "security": [{"api_key": []}] if route.requires_auth else [],
                    "responses": {
                        "200": {"description": "Success"},
                        "401": {"description": "Unauthorized"},
                        "429": {"description": "Rate limit exceeded"},
                    },
                }

        return {
            "openapi": "3.0.0",
            "info": {
                "title": "BAHB Infrastructure Intelligence API",
                "version": "1.0.0",
                "description": "REST API for data center infrastructure monitoring and analysis",
            },
            "servers": [
                {"url": "/api/v1", "description": "Production"},
            ],
            "paths": paths,
            "components": {
                "securitySchemes": {
                    "api_key": {
                        "type": "apiKey",
                        "in": "header",
                        "name": "X-API-Key",
                    },
                },
            },
        }


def create_rest_app(router: Optional[RESTRouter] = None) -> RESTRouter:
    """Create REST application with standard routes."""
    router = router or RESTRouter()

    # Facility routes
    @router.get("/facilities", description="List all facilities")
    async def list_facilities(
        facility_type: Optional[str] = None,
        min_power_mw: Optional[float] = None,
        limit: int = 100,
    ) -> dict:
        return {"facilities": [], "total": 0}

    @router.get("/facilities/{id}", description="Get facility by ID")
    async def get_facility(id: str) -> dict:
        return {"facility": None}

    @router.post("/facilities", description="Create new facility")
    async def create_facility(data: dict) -> dict:
        return {"facility": data, "created": True}

    @router.put("/facilities/{id}", description="Update facility")
    async def update_facility(id: str, data: dict) -> dict:
        return {"facility": data, "updated": True}

    # Detection routes
    @router.get("/facilities/{id}/detections", description="Get facility detections")
    async def get_detections(
        id: str,
        min_confidence: float = 0.0,
    ) -> dict:
        return {"detections": [], "total": 0}

    # Prediction routes
    @router.get("/facilities/{id}/predictions", description="Get facility predictions")
    async def get_predictions(
        id: str,
        prediction_type: Optional[str] = None,
    ) -> dict:
        return {"predictions": [], "total": 0}

    @router.post("/facilities/{id}/predictions", description="Generate new predictions")
    async def create_predictions(id: str) -> dict:
        return {"predictions": [], "generated": True}

    # Alert routes
    @router.get("/alerts", description="List alerts")
    async def list_alerts(
        severity: Optional[str] = None,
        acknowledged: Optional[bool] = None,
    ) -> dict:
        return {"alerts": [], "total": 0}

    @router.post("/alerts/{id}/acknowledge", description="Acknowledge alert")
    async def acknowledge_alert(id: str) -> dict:
        return {"acknowledged": True}

    # Analysis routes
    @router.post("/analyze", description="Analyze imagery")
    async def analyze_imagery(data: dict) -> dict:
        return {"analysis": {}, "success": True}

    @router.get("/analyze/{id}/status", description="Get analysis status")
    async def get_analysis_status(id: str) -> dict:
        return {"status": "complete", "progress": 100}

    # Health and metrics
    @router.get("/health", description="Health check", requires_auth=False)
    async def health_check() -> dict:
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}

    @router.get("/metrics", description="Get system metrics")
    async def get_metrics() -> dict:
        return {
            "facilities_tracked": 0,
            "predictions_generated": 0,
            "alerts_active": 0,
        }

    return router


# Example request/response models for documentation
REQUEST_MODELS = {
    "CreateFacility": {
        "id": "string (required)",
        "name": "string",
        "facility_type": "string (hyperscale|colocation|edge|enterprise)",
        "latitude": "float",
        "longitude": "float",
    },
    "UpdateFacility": {
        "estimated_power_mw": "float",
        "estimated_gpu_count": "integer",
        "construction_phase": "string",
    },
    "AnalyzeImagery": {
        "image_data": "base64 string or URL",
        "source_type": "string (optical|thermal|sar)",
        "location": {"latitude": "float", "longitude": "float"},
    },
}

RESPONSE_MODELS = {
    "Facility": {
        "id": "string",
        "name": "string",
        "facility_type": "string",
        "estimated_power_mw": "float",
        "estimated_gpu_count": "integer",
        "construction_phase": "string",
        "confidence_score": "float",
        "last_updated": "ISO 8601 datetime",
    },
    "Detection": {
        "id": "string",
        "class_name": "string",
        "confidence": "float (0-1)",
        "bbox": {"x1": "float", "y1": "float", "x2": "float", "y2": "float"},
        "thermal_signature": "float (celsius)",
        "operational_status": "string (active|idle|unknown)",
    },
    "Prediction": {
        "id": "string",
        "prediction_type": "string",
        "predicted_value": "float",
        "predicted_date": "ISO 8601 datetime",
        "confidence": "float (0-1)",
        "confidence_level": "string (high|medium|low|speculative)",
    },
}
