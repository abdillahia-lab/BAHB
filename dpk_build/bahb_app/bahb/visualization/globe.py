"""3D Globe Visualization for global infrastructure monitoring.

Based on Team 12's proposal:
- Cesium/Deck.gl hybrid engine
- Photorealistic Earth rendering
- Real-time satellite orbit visualization
- Data center 3D models with LOD
- Smooth zoom from global to facility level
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from loguru import logger


class MarkerType(Enum):
    """Types of markers on the globe."""
    FACILITY = "facility"
    CONSTRUCTION = "construction"
    ALERT = "alert"
    SATELLITE = "satellite"
    REGION = "region"


class LayerType(Enum):
    """Types of map layers."""
    SATELLITE_IMAGERY = "satellite"
    THERMAL = "thermal"
    SAR = "sar"
    BOUNDARIES = "boundaries"
    HEATMAP = "heatmap"
    GRID = "grid"


@dataclass
class GeoPosition:
    """Geographic position."""
    latitude: float
    longitude: float
    altitude: float = 0.0


@dataclass
class FacilityMarker:
    """Marker representing a facility on the globe."""
    id: str
    position: GeoPosition
    marker_type: MarkerType
    label: str

    # Facility data
    facility_type: Optional[str] = None
    power_mw: float = 0.0
    status: str = "operational"
    confidence: float = 0.0

    # Visual properties
    color: str = "#4A90D9"
    size: float = 1.0
    icon: Optional[str] = None
    visible: bool = True

    # Interaction
    clickable: bool = True
    popup_content: Optional[str] = None

    # Metadata
    last_updated: Optional[datetime] = None
    data_sources: List[str] = field(default_factory=list)


@dataclass
class MapLayer:
    """Layer on the globe visualization."""
    id: str
    layer_type: LayerType
    name: str
    visible: bool = True
    opacity: float = 1.0
    z_index: int = 0
    data_url: Optional[str] = None
    options: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CameraState:
    """Camera state for the globe."""
    position: GeoPosition
    heading: float = 0.0      # Rotation around up axis
    pitch: float = -90.0      # Rotation around right axis (default looking down)
    roll: float = 0.0         # Rotation around forward axis
    zoom: float = 1.0


class GlobeVisualization:
    """
    3D Globe visualization for infrastructure monitoring.

    Features:
    - Multi-resolution Earth imagery
    - Facility markers with clustering
    - Layer management (thermal, SAR, etc.)
    - Smooth camera transitions
    - Interactive facility selection
    """

    # Default colors by facility type
    FACILITY_COLORS = {
        "hyperscale": "#FF6B6B",      # Red
        "colocation": "#4ECDC4",      # Teal
        "edge": "#45B7D1",            # Blue
        "enterprise": "#96CEB4",      # Green
        "ai_training": "#DDA0DD",     # Purple
        "construction": "#FFE66D",    # Yellow
        "unknown": "#95A5A6",         # Gray
    }

    # Size scaling by power
    POWER_SIZE_SCALE = {
        0: 0.5,      # < 1 MW
        1: 0.7,      # 1-10 MW
        10: 1.0,     # 10-50 MW
        50: 1.3,     # 50-100 MW
        100: 1.6,    # 100-200 MW
        200: 2.0,    # > 200 MW
    }

    def __init__(
        self,
        initial_position: Optional[GeoPosition] = None,
        default_zoom: float = 3.0,
    ):
        """
        Initialize globe visualization.

        Args:
            initial_position: Starting camera position
            default_zoom: Default zoom level
        """
        self.camera = CameraState(
            position=initial_position or GeoPosition(20, 0, 20000000),  # High altitude view
            zoom=default_zoom,
        )

        self._markers: Dict[str, FacilityMarker] = {}
        self._layers: Dict[str, MapLayer] = {}
        self._selected_marker: Optional[str] = None

        # Clustering
        self._clustering_enabled = True
        self._cluster_distance = 50  # pixels

        # Animation
        self._animation_duration_ms = 1000

        # Initialize default layers
        self._init_default_layers()

        logger.info("GlobeVisualization initialized")

    def _init_default_layers(self) -> None:
        """Initialize default map layers."""
        default_layers = [
            MapLayer("satellite", LayerType.SATELLITE_IMAGERY, "Satellite Imagery", visible=True, z_index=0),
            MapLayer("thermal", LayerType.THERMAL, "Thermal Overlay", visible=False, opacity=0.6, z_index=1),
            MapLayer("sar", LayerType.SAR, "SAR Radar", visible=False, opacity=0.5, z_index=1),
            MapLayer("boundaries", LayerType.BOUNDARIES, "Country Boundaries", visible=True, z_index=2),
            MapLayer("heatmap", LayerType.HEATMAP, "Activity Heatmap", visible=False, opacity=0.7, z_index=3),
        ]

        for layer in default_layers:
            self._layers[layer.id] = layer

    def add_facility_marker(
        self,
        id: str,
        latitude: float,
        longitude: float,
        label: str,
        facility_type: str = "unknown",
        power_mw: float = 0.0,
        status: str = "operational",
        confidence: float = 0.0,
        **kwargs,
    ) -> FacilityMarker:
        """Add a facility marker to the globe."""
        # Determine color
        color = self.FACILITY_COLORS.get(facility_type, self.FACILITY_COLORS["unknown"])
        if status == "construction":
            color = self.FACILITY_COLORS["construction"]

        # Determine size based on power
        size = 0.5
        for threshold, scale in sorted(self.POWER_SIZE_SCALE.items()):
            if power_mw >= threshold:
                size = scale

        marker = FacilityMarker(
            id=id,
            position=GeoPosition(latitude, longitude),
            marker_type=MarkerType.FACILITY if status == "operational" else MarkerType.CONSTRUCTION,
            label=label,
            facility_type=facility_type,
            power_mw=power_mw,
            status=status,
            confidence=confidence,
            color=color,
            size=size,
            last_updated=datetime.now(),
            **kwargs,
        )

        self._markers[id] = marker
        return marker

    def remove_marker(self, marker_id: str) -> bool:
        """Remove a marker from the globe."""
        if marker_id in self._markers:
            del self._markers[marker_id]
            return True
        return False

    def update_marker(
        self,
        marker_id: str,
        **updates,
    ) -> Optional[FacilityMarker]:
        """Update marker properties."""
        marker = self._markers.get(marker_id)
        if not marker:
            return None

        for key, value in updates.items():
            if hasattr(marker, key):
                setattr(marker, key, value)

        marker.last_updated = datetime.now()
        return marker

    def get_markers_in_bounds(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
    ) -> List[FacilityMarker]:
        """Get markers within geographic bounds."""
        return [
            m for m in self._markers.values()
            if min_lat <= m.position.latitude <= max_lat
            and min_lon <= m.position.longitude <= max_lon
        ]

    def set_layer_visibility(self, layer_id: str, visible: bool) -> bool:
        """Set layer visibility."""
        layer = self._layers.get(layer_id)
        if layer:
            layer.visible = visible
            return True
        return False

    def set_layer_opacity(self, layer_id: str, opacity: float) -> bool:
        """Set layer opacity (0-1)."""
        layer = self._layers.get(layer_id)
        if layer:
            layer.opacity = max(0, min(1, opacity))
            return True
        return False

    def fly_to(
        self,
        latitude: float,
        longitude: float,
        altitude: float = 1000000,
        duration_ms: int = None,
    ) -> dict:
        """
        Fly camera to a location.

        Returns camera animation parameters.
        """
        duration = duration_ms or self._animation_duration_ms

        target = GeoPosition(latitude, longitude, altitude)

        animation = {
            "type": "fly_to",
            "from": {
                "latitude": self.camera.position.latitude,
                "longitude": self.camera.position.longitude,
                "altitude": self.camera.position.altitude,
            },
            "to": {
                "latitude": target.latitude,
                "longitude": target.longitude,
                "altitude": target.altitude,
            },
            "duration_ms": duration,
            "easing": "ease_in_out",
        }

        # Update camera state
        self.camera.position = target

        return animation

    def fly_to_facility(
        self,
        facility_id: str,
        altitude: float = 50000,
    ) -> Optional[dict]:
        """Fly to a specific facility."""
        marker = self._markers.get(facility_id)
        if not marker:
            return None

        self._selected_marker = facility_id

        return self.fly_to(
            marker.position.latitude,
            marker.position.longitude,
            altitude,
        )

    def zoom_to_region(
        self,
        region_name: str,
    ) -> dict:
        """Zoom to a predefined region."""
        regions = {
            "us_east": (39.0, -77.0, 2000000),
            "us_west": (37.0, -122.0, 2000000),
            "europe": (50.0, 10.0, 4000000),
            "asia_pacific": (35.0, 120.0, 5000000),
            "global": (20.0, 0.0, 20000000),
        }

        coords = regions.get(region_name, regions["global"])
        return self.fly_to(*coords)

    def get_render_state(self) -> dict:
        """
        Get current render state for frontend.

        Returns all data needed to render the globe.
        """
        # Cluster markers if enabled
        if self._clustering_enabled:
            visible_markers = self._cluster_markers()
        else:
            visible_markers = list(self._markers.values())

        return {
            "camera": {
                "position": {
                    "latitude": self.camera.position.latitude,
                    "longitude": self.camera.position.longitude,
                    "altitude": self.camera.position.altitude,
                },
                "heading": self.camera.heading,
                "pitch": self.camera.pitch,
                "roll": self.camera.roll,
                "zoom": self.camera.zoom,
            },
            "markers": [
                {
                    "id": m.id,
                    "position": {
                        "latitude": m.position.latitude,
                        "longitude": m.position.longitude,
                    },
                    "label": m.label,
                    "type": m.marker_type.value,
                    "facilityType": m.facility_type,
                    "powerMw": m.power_mw,
                    "status": m.status,
                    "color": m.color,
                    "size": m.size,
                    "selected": m.id == self._selected_marker,
                }
                for m in visible_markers
            ],
            "layers": [
                {
                    "id": l.id,
                    "type": l.layer_type.value,
                    "name": l.name,
                    "visible": l.visible,
                    "opacity": l.opacity,
                }
                for l in self._layers.values()
            ],
            "selectedMarker": self._selected_marker,
            "markerCount": len(self._markers),
        }

    def _cluster_markers(self) -> List[FacilityMarker]:
        """Cluster nearby markers (simplified clustering)."""
        # In production, would use proper spatial clustering
        # For now, return all markers
        return list(self._markers.values())

    def get_statistics(self) -> dict:
        """Get globe statistics."""
        markers = list(self._markers.values())

        by_type = {}
        for m in markers:
            t = m.facility_type or "unknown"
            if t not in by_type:
                by_type[t] = {"count": 0, "power_mw": 0}
            by_type[t]["count"] += 1
            by_type[t]["power_mw"] += m.power_mw

        return {
            "total_markers": len(markers),
            "total_power_mw": sum(m.power_mw for m in markers),
            "by_type": by_type,
            "by_status": {
                "operational": sum(1 for m in markers if m.status == "operational"),
                "construction": sum(1 for m in markers if m.status == "construction"),
            },
            "layers_visible": sum(1 for l in self._layers.values() if l.visible),
        }
