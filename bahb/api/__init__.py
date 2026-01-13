"""Modern API layer for BAHB platform.

Implements API-first architecture (Team 6 proposal):
- REST API: CRUD operations with rate limiting
- GraphQL: Flexible queries with real-time subscriptions
- WebSocket: Live data streaming
- SDK support: Python, JavaScript, Go

Enables developer ecosystem and third-party integrations.
"""

from bahb.api.graphql_schema import (
    schema,
    FacilityType,
    DetectionType,
    PredictionType,
    AlertType,
)
from bahb.api.rest import RESTRouter, create_rest_app
from bahb.api.websocket import WebSocketManager

__all__ = [
    "schema",
    "FacilityType",
    "DetectionType",
    "PredictionType",
    "AlertType",
    "RESTRouter",
    "create_rest_app",
    "WebSocketManager",
]
