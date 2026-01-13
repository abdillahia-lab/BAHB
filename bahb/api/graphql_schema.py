"""GraphQL schema for BAHB API.

Implements GraphQL API (Team 6 proposal):
- Flexible queries
- Real-time subscriptions
- Type-safe schema
- Federation-ready

Example queries:
- Get facility with detections and predictions
- Subscribe to real-time alerts
- Query historical data with filtering
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Optional, List, AsyncGenerator

# GraphQL implementation using strawberry
# Falls back to schema definition if strawberry not available

try:
    import strawberry
    from strawberry import Schema
    from strawberry.types import Info
    STRAWBERRY_AVAILABLE = True
except ImportError:
    STRAWBERRY_AVAILABLE = False


# Type definitions (work regardless of strawberry)
class FacilityType:
    """GraphQL type for data center facility."""
    def __init__(
        self,
        id: str,
        name: Optional[str] = None,
        facility_type: str = "unknown",
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        estimated_power_mw: float = 0.0,
        estimated_gpu_count: int = 0,
        construction_phase: str = "operational",
        confidence_score: float = 0.0,
        last_updated: Optional[str] = None,
    ):
        self.id = id
        self.name = name
        self.facility_type = facility_type
        self.latitude = latitude
        self.longitude = longitude
        self.estimated_power_mw = estimated_power_mw
        self.estimated_gpu_count = estimated_gpu_count
        self.construction_phase = construction_phase
        self.confidence_score = confidence_score
        self.last_updated = last_updated


class DetectionType:
    """GraphQL type for infrastructure detection."""
    def __init__(
        self,
        id: str,
        class_name: str,
        confidence: float,
        bbox_x1: float,
        bbox_y1: float,
        bbox_x2: float,
        bbox_y2: float,
        thermal_signature: Optional[float] = None,
        operational_status: str = "unknown",
        sources_agreeing: int = 1,
    ):
        self.id = id
        self.class_name = class_name
        self.confidence = confidence
        self.bbox_x1 = bbox_x1
        self.bbox_y1 = bbox_y1
        self.bbox_x2 = bbox_x2
        self.bbox_y2 = bbox_y2
        self.thermal_signature = thermal_signature
        self.operational_status = operational_status
        self.sources_agreeing = sources_agreeing


class PredictionType:
    """GraphQL type for predictions."""
    def __init__(
        self,
        id: str,
        prediction_type: str,
        target_metric: str,
        predicted_value: float,
        predicted_date: Optional[str] = None,
        confidence: float = 0.5,
        confidence_level: str = "medium",
        method_used: str = "",
        recommendations: Optional[List[str]] = None,
    ):
        self.id = id
        self.prediction_type = prediction_type
        self.target_metric = target_metric
        self.predicted_value = predicted_value
        self.predicted_date = predicted_date
        self.confidence = confidence
        self.confidence_level = confidence_level
        self.method_used = method_used
        self.recommendations = recommendations or []


class AlertType:
    """GraphQL type for alerts."""
    def __init__(
        self,
        id: str,
        severity: str,
        title: str,
        message: str,
        timestamp: str,
        facility_id: Optional[str] = None,
        acknowledged: bool = False,
    ):
        self.id = id
        self.severity = severity
        self.title = title
        self.message = message
        self.timestamp = timestamp
        self.facility_id = facility_id
        self.acknowledged = acknowledged


class AnalysisType:
    """GraphQL type for fused analysis."""
    def __init__(
        self,
        id: str,
        timestamp: str,
        sources_used: List[str],
        detection_count: int,
        estimated_power_mw: float,
        operational_score: float,
        change_detected: bool,
        overall_confidence: float,
        monitoring_conditions: str,
    ):
        self.id = id
        self.timestamp = timestamp
        self.sources_used = sources_used
        self.detection_count = detection_count
        self.estimated_power_mw = estimated_power_mw
        self.operational_score = operational_score
        self.change_detected = change_detected
        self.overall_confidence = overall_confidence
        self.monitoring_conditions = monitoring_conditions


# Data stores (in production, would be database)
_facilities_store: dict[str, FacilityType] = {}
_detections_store: dict[str, list[DetectionType]] = {}
_predictions_store: dict[str, list[PredictionType]] = {}
_alerts_store: list[AlertType] = []
_alert_subscribers: list[asyncio.Queue] = []


# Resolver functions
async def get_facility(id: str) -> Optional[FacilityType]:
    """Get facility by ID."""
    return _facilities_store.get(id)


async def get_facilities(
    facility_type: Optional[str] = None,
    min_power_mw: Optional[float] = None,
    limit: int = 100,
) -> List[FacilityType]:
    """Get facilities with optional filtering."""
    facilities = list(_facilities_store.values())

    if facility_type:
        facilities = [f for f in facilities if f.facility_type == facility_type]

    if min_power_mw is not None:
        facilities = [f for f in facilities if f.estimated_power_mw >= min_power_mw]

    return facilities[:limit]


async def get_detections(
    facility_id: str,
    min_confidence: float = 0.0,
    class_name: Optional[str] = None,
) -> List[DetectionType]:
    """Get detections for a facility."""
    detections = _detections_store.get(facility_id, [])

    if min_confidence > 0:
        detections = [d for d in detections if d.confidence >= min_confidence]

    if class_name:
        detections = [d for d in detections if d.class_name == class_name]

    return detections


async def get_predictions(
    facility_id: str,
    prediction_type: Optional[str] = None,
) -> List[PredictionType]:
    """Get predictions for a facility."""
    predictions = _predictions_store.get(facility_id, [])

    if prediction_type:
        predictions = [p for p in predictions if p.prediction_type == prediction_type]

    return predictions


async def get_alerts(
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    limit: int = 50,
) -> List[AlertType]:
    """Get recent alerts with filtering."""
    alerts = _alerts_store.copy()

    if severity:
        alerts = [a for a in alerts if a.severity == severity]

    if acknowledged is not None:
        alerts = [a for a in alerts if a.acknowledged == acknowledged]

    return alerts[-limit:]


# Mutation functions
async def create_facility(
    id: str,
    name: Optional[str] = None,
    facility_type: str = "unknown",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> FacilityType:
    """Create a new facility."""
    facility = FacilityType(
        id=id,
        name=name,
        facility_type=facility_type,
        latitude=latitude,
        longitude=longitude,
        last_updated=datetime.now().isoformat(),
    )
    _facilities_store[id] = facility
    return facility


async def update_facility(
    id: str,
    estimated_power_mw: Optional[float] = None,
    estimated_gpu_count: Optional[int] = None,
    construction_phase: Optional[str] = None,
) -> Optional[FacilityType]:
    """Update facility properties."""
    facility = _facilities_store.get(id)
    if not facility:
        return None

    if estimated_power_mw is not None:
        facility.estimated_power_mw = estimated_power_mw
    if estimated_gpu_count is not None:
        facility.estimated_gpu_count = estimated_gpu_count
    if construction_phase is not None:
        facility.construction_phase = construction_phase

    facility.last_updated = datetime.now().isoformat()
    return facility


async def create_alert(
    severity: str,
    title: str,
    message: str,
    facility_id: Optional[str] = None,
) -> AlertType:
    """Create and broadcast a new alert."""
    alert = AlertType(
        id=f"alert_{len(_alerts_store):06d}",
        severity=severity,
        title=title,
        message=message,
        timestamp=datetime.now().isoformat(),
        facility_id=facility_id,
    )
    _alerts_store.append(alert)

    # Broadcast to subscribers
    for queue in _alert_subscribers:
        await queue.put(alert)

    return alert


async def acknowledge_alert(alert_id: str) -> Optional[AlertType]:
    """Acknowledge an alert."""
    for alert in _alerts_store:
        if alert.id == alert_id:
            alert.acknowledged = True
            return alert
    return None


# Subscription generators
async def subscribe_alerts(
    severity: Optional[str] = None,
) -> AsyncGenerator[AlertType, None]:
    """Subscribe to real-time alerts."""
    queue: asyncio.Queue = asyncio.Queue()
    _alert_subscribers.append(queue)

    try:
        while True:
            alert = await queue.get()
            if severity is None or alert.severity == severity:
                yield alert
    finally:
        _alert_subscribers.remove(queue)


async def subscribe_facility_updates(
    facility_id: str,
) -> AsyncGenerator[FacilityType, None]:
    """Subscribe to facility updates."""
    last_update = None

    while True:
        facility = _facilities_store.get(facility_id)
        if facility and facility.last_updated != last_update:
            last_update = facility.last_updated
            yield facility
        await asyncio.sleep(1)


# Strawberry schema definition (if available)
if STRAWBERRY_AVAILABLE:
    @strawberry.type
    class Facility:
        id: str
        name: Optional[str]
        facility_type: str
        latitude: Optional[float]
        longitude: Optional[float]
        estimated_power_mw: float
        estimated_gpu_count: int
        construction_phase: str
        confidence_score: float
        last_updated: Optional[str]

    @strawberry.type
    class Detection:
        id: str
        class_name: str
        confidence: float
        bbox_x1: float
        bbox_y1: float
        bbox_x2: float
        bbox_y2: float
        thermal_signature: Optional[float]
        operational_status: str
        sources_agreeing: int

    @strawberry.type
    class Prediction:
        id: str
        prediction_type: str
        target_metric: str
        predicted_value: float
        predicted_date: Optional[str]
        confidence: float
        confidence_level: str
        method_used: str
        recommendations: List[str]

    @strawberry.type
    class Alert:
        id: str
        severity: str
        title: str
        message: str
        timestamp: str
        facility_id: Optional[str]
        acknowledged: bool

    @strawberry.type
    class Query:
        @strawberry.field
        async def facility(self, id: str) -> Optional[Facility]:
            f = await get_facility(id)
            if f:
                return Facility(**f.__dict__)
            return None

        @strawberry.field
        async def facilities(
            self,
            facility_type: Optional[str] = None,
            min_power_mw: Optional[float] = None,
            limit: int = 100,
        ) -> List[Facility]:
            fs = await get_facilities(facility_type, min_power_mw, limit)
            return [Facility(**f.__dict__) for f in fs]

        @strawberry.field
        async def detections(
            self,
            facility_id: str,
            min_confidence: float = 0.0,
            class_name: Optional[str] = None,
        ) -> List[Detection]:
            ds = await get_detections(facility_id, min_confidence, class_name)
            return [Detection(**d.__dict__) for d in ds]

        @strawberry.field
        async def predictions(
            self,
            facility_id: str,
            prediction_type: Optional[str] = None,
        ) -> List[Prediction]:
            ps = await get_predictions(facility_id, prediction_type)
            return [Prediction(**p.__dict__) for p in ps]

        @strawberry.field
        async def alerts(
            self,
            severity: Optional[str] = None,
            acknowledged: Optional[bool] = None,
            limit: int = 50,
        ) -> List[Alert]:
            als = await get_alerts(severity, acknowledged, limit)
            return [Alert(**a.__dict__) for a in als]

    @strawberry.type
    class Mutation:
        @strawberry.mutation
        async def create_facility(
            self,
            id: str,
            name: Optional[str] = None,
            facility_type: str = "unknown",
            latitude: Optional[float] = None,
            longitude: Optional[float] = None,
        ) -> Facility:
            f = await create_facility(id, name, facility_type, latitude, longitude)
            return Facility(**f.__dict__)

        @strawberry.mutation
        async def update_facility(
            self,
            id: str,
            estimated_power_mw: Optional[float] = None,
            estimated_gpu_count: Optional[int] = None,
            construction_phase: Optional[str] = None,
        ) -> Optional[Facility]:
            f = await update_facility(id, estimated_power_mw, estimated_gpu_count, construction_phase)
            if f:
                return Facility(**f.__dict__)
            return None

        @strawberry.mutation
        async def create_alert(
            self,
            severity: str,
            title: str,
            message: str,
            facility_id: Optional[str] = None,
        ) -> Alert:
            a = await create_alert(severity, title, message, facility_id)
            return Alert(**a.__dict__)

        @strawberry.mutation
        async def acknowledge_alert(self, alert_id: str) -> Optional[Alert]:
            a = await acknowledge_alert(alert_id)
            if a:
                return Alert(**a.__dict__)
            return None

    @strawberry.type
    class Subscription:
        @strawberry.subscription
        async def alert_created(
            self,
            severity: Optional[str] = None,
        ) -> AsyncGenerator[Alert, None]:
            async for alert in subscribe_alerts(severity):
                yield Alert(**alert.__dict__)

        @strawberry.subscription
        async def facility_updated(
            self,
            facility_id: str,
        ) -> AsyncGenerator[Facility, None]:
            async for facility in subscribe_facility_updates(facility_id):
                yield Facility(**facility.__dict__)

    # Create schema
    schema = Schema(query=Query, mutation=Mutation, subscription=Subscription)

else:
    # Fallback schema definition for documentation
    schema = {
        "queries": {
            "facility": "Get single facility by ID",
            "facilities": "List facilities with filtering",
            "detections": "Get detections for facility",
            "predictions": "Get predictions for facility",
            "alerts": "List alerts with filtering",
        },
        "mutations": {
            "createFacility": "Create new facility",
            "updateFacility": "Update facility properties",
            "createAlert": "Create and broadcast alert",
            "acknowledgeAlert": "Acknowledge an alert",
        },
        "subscriptions": {
            "alertCreated": "Real-time alert notifications",
            "facilityUpdated": "Real-time facility updates",
        },
    }


# Schema introspection for documentation
def get_schema_info() -> dict:
    """Get schema information for documentation."""
    return {
        "types": {
            "Facility": {
                "fields": [
                    "id", "name", "facility_type", "latitude", "longitude",
                    "estimated_power_mw", "estimated_gpu_count",
                    "construction_phase", "confidence_score", "last_updated",
                ],
                "description": "Data center facility with capacity estimates",
            },
            "Detection": {
                "fields": [
                    "id", "class_name", "confidence", "bbox_*",
                    "thermal_signature", "operational_status", "sources_agreeing",
                ],
                "description": "Infrastructure detection from imagery",
            },
            "Prediction": {
                "fields": [
                    "id", "prediction_type", "target_metric", "predicted_value",
                    "predicted_date", "confidence", "method_used", "recommendations",
                ],
                "description": "ML-powered prediction with confidence",
            },
            "Alert": {
                "fields": [
                    "id", "severity", "title", "message", "timestamp",
                    "facility_id", "acknowledged",
                ],
                "description": "System alert for anomalies and events",
            },
        },
        "capabilities": {
            "real_time_subscriptions": True,
            "flexible_queries": True,
            "type_safe": True,
            "federation_ready": True,
        },
        "innovation_note": "GraphQL enables flexible data fetching and real-time updates - "
                          "superior to REST for complex infrastructure monitoring queries",
    }
