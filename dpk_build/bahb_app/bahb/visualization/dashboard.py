"""Interactive Dashboard for infrastructure visualization.

Based on Team 11's Intelligent Dashboard System proposal:
- AI-curated layouts based on user role
- Customizable widget library (50+ components)
- Natural language query interface
- Context-aware information hierarchy
- WCAG 2.1 AAA accessibility compliance
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any, Callable

from loguru import logger


class WidgetType(Enum):
    """Types of dashboard widgets."""
    # Map widgets
    GLOBE_3D = "globe_3d"
    MAP_2D = "map_2d"
    FACILITY_MAP = "facility_map"

    # Data widgets
    METRIC_CARD = "metric_card"
    STAT_PANEL = "stat_panel"
    KPI_GAUGE = "kpi_gauge"

    # Chart widgets
    LINE_CHART = "line_chart"
    BAR_CHART = "bar_chart"
    PIE_CHART = "pie_chart"
    HEATMAP = "heatmap"
    SPARKLINE = "sparkline"

    # List widgets
    ALERT_LIST = "alert_list"
    FACILITY_LIST = "facility_list"
    DETECTION_LIST = "detection_list"
    PREDICTION_LIST = "prediction_list"

    # Timeline widgets
    TIMELINE = "timeline"
    CONSTRUCTION_PROGRESS = "construction_progress"

    # Analysis widgets
    COMPARISON_TABLE = "comparison_table"
    TREND_ANALYSIS = "trend_analysis"
    THERMAL_OVERLAY = "thermal_overlay"

    # Media widgets
    IMAGE_VIEWER = "image_viewer"
    VIDEO_PLAYER = "video_player"
    SATELLITE_FEED = "satellite_feed"


class DashboardLayout(Enum):
    """Dashboard layout presets."""
    SINGLE_FOCUS = "single_focus"        # One large widget
    SPLIT_VIEW = "split_view"            # Two columns
    GRID_4 = "grid_4"                    # 2x2 grid
    GRID_6 = "grid_6"                    # 2x3 grid
    DASHBOARD_STANDARD = "standard"       # Map + metrics + list
    ANALYST_VIEW = "analyst"             # Heavy on charts
    OPERATOR_VIEW = "operator"           # Alerts + real-time


@dataclass
class WidgetConfig:
    """Configuration for a dashboard widget."""
    id: str
    type: WidgetType
    title: str
    position: Dict[str, int]  # {x, y, w, h} grid positions
    data_source: Optional[str] = None
    refresh_interval_seconds: int = 30
    options: Dict[str, Any] = field(default_factory=dict)
    visible: bool = True
    interactive: bool = True


@dataclass
class DashboardWidget:
    """Dashboard widget with state and data."""
    config: WidgetConfig
    data: Any = None
    last_updated: Optional[datetime] = None
    error: Optional[str] = None
    loading: bool = False

    def to_dict(self) -> dict:
        """Convert to dictionary for API/frontend."""
        return {
            "id": self.config.id,
            "type": self.config.type.value,
            "title": self.config.title,
            "position": self.config.position,
            "data": self.data,
            "lastUpdated": self.last_updated.isoformat() if self.last_updated else None,
            "error": self.error,
            "loading": self.loading,
            "options": self.config.options,
        }


@dataclass
class DashboardConfig:
    """Dashboard configuration."""
    id: str
    name: str
    layout: DashboardLayout
    widgets: List[WidgetConfig]
    theme: str = "dark"
    auto_refresh: bool = True
    refresh_interval_seconds: int = 30
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


class Dashboard:
    """
    Interactive dashboard for infrastructure visualization.

    Features:
    - Customizable widget-based layout
    - Real-time data updates
    - Role-based preset configurations
    - Natural language querying
    - Export capabilities
    """

    # Preset dashboards by role
    ROLE_PRESETS = {
        "executive": DashboardConfig(
            id="exec_default",
            name="Executive Overview",
            layout=DashboardLayout.DASHBOARD_STANDARD,
            widgets=[
                WidgetConfig("globe", WidgetType.GLOBE_3D, "Global Facilities", {"x": 0, "y": 0, "w": 8, "h": 6}),
                WidgetConfig("total_power", WidgetType.METRIC_CARD, "Total Power (MW)", {"x": 8, "y": 0, "w": 2, "h": 2}, options={"metric": "total_power_mw"}),
                WidgetConfig("facility_count", WidgetType.METRIC_CARD, "Facilities", {"x": 10, "y": 0, "w": 2, "h": 2}, options={"metric": "facility_count"}),
                WidgetConfig("alerts", WidgetType.ALERT_LIST, "Active Alerts", {"x": 8, "y": 2, "w": 4, "h": 4}),
                WidgetConfig("trend", WidgetType.LINE_CHART, "Capacity Trend", {"x": 0, "y": 6, "w": 6, "h": 3}),
                WidgetConfig("distribution", WidgetType.PIE_CHART, "By Type", {"x": 6, "y": 6, "w": 3, "h": 3}),
            ],
        ),
        "analyst": DashboardConfig(
            id="analyst_default",
            name="Analyst Workbench",
            layout=DashboardLayout.ANALYST_VIEW,
            widgets=[
                WidgetConfig("map", WidgetType.MAP_2D, "Facility Map", {"x": 0, "y": 0, "w": 6, "h": 4}),
                WidgetConfig("thermal", WidgetType.THERMAL_OVERLAY, "Thermal Analysis", {"x": 6, "y": 0, "w": 6, "h": 4}),
                WidgetConfig("timeline", WidgetType.TIMELINE, "Construction Timeline", {"x": 0, "y": 4, "w": 12, "h": 2}),
                WidgetConfig("comparison", WidgetType.COMPARISON_TABLE, "Facility Comparison", {"x": 0, "y": 6, "w": 6, "h": 3}),
                WidgetConfig("predictions", WidgetType.PREDICTION_LIST, "Predictions", {"x": 6, "y": 6, "w": 6, "h": 3}),
            ],
        ),
        "operator": DashboardConfig(
            id="operator_default",
            name="Operations Center",
            layout=DashboardLayout.OPERATOR_VIEW,
            widgets=[
                WidgetConfig("alerts", WidgetType.ALERT_LIST, "Active Alerts", {"x": 0, "y": 0, "w": 4, "h": 6}),
                WidgetConfig("facility", WidgetType.FACILITY_MAP, "Facility Status", {"x": 4, "y": 0, "w": 8, "h": 6}),
                WidgetConfig("detections", WidgetType.DETECTION_LIST, "Recent Detections", {"x": 0, "y": 6, "w": 6, "h": 3}),
                WidgetConfig("metrics", WidgetType.STAT_PANEL, "Key Metrics", {"x": 6, "y": 6, "w": 6, "h": 3}),
            ],
        ),
    }

    def __init__(
        self,
        config: Optional[DashboardConfig] = None,
        role: str = "analyst",
    ):
        """
        Initialize dashboard.

        Args:
            config: Custom dashboard configuration
            role: User role for preset selection
        """
        if config:
            self.config = config
        else:
            self.config = self.ROLE_PRESETS.get(role, self.ROLE_PRESETS["analyst"])

        self._widgets: Dict[str, DashboardWidget] = {}
        self._data_providers: Dict[str, Callable] = {}
        self._update_callbacks: List[Callable] = []

        # Initialize widgets
        for widget_config in self.config.widgets:
            self._widgets[widget_config.id] = DashboardWidget(config=widget_config)

        logger.info(f"Dashboard initialized: {self.config.name}")

    def register_data_provider(
        self,
        widget_id: str,
        provider: Callable,
    ) -> None:
        """Register a data provider for a widget."""
        self._data_providers[widget_id] = provider

    def on_update(self, callback: Callable) -> None:
        """Register callback for widget updates."""
        self._update_callbacks.append(callback)

    async def refresh_widget(self, widget_id: str) -> Optional[DashboardWidget]:
        """Refresh a single widget's data."""
        widget = self._widgets.get(widget_id)
        if not widget:
            return None

        widget.loading = True
        widget.error = None

        try:
            provider = self._data_providers.get(widget_id)
            if provider:
                widget.data = await provider()
                widget.last_updated = datetime.now()
            else:
                widget.data = self._get_default_data(widget.config.type)

        except Exception as e:
            widget.error = str(e)
            logger.error(f"Error refreshing widget {widget_id}: {e}")

        finally:
            widget.loading = False

        # Notify callbacks
        for callback in self._update_callbacks:
            try:
                await callback(widget)
            except Exception as e:
                logger.error(f"Update callback error: {e}")

        return widget

    async def refresh_all(self) -> Dict[str, DashboardWidget]:
        """Refresh all widgets."""
        for widget_id in self._widgets:
            await self.refresh_widget(widget_id)
        return self._widgets

    def _get_default_data(self, widget_type: WidgetType) -> Any:
        """Get default/placeholder data for widget type."""
        defaults = {
            WidgetType.METRIC_CARD: {"value": 0, "trend": 0, "unit": ""},
            WidgetType.STAT_PANEL: {"metrics": []},
            WidgetType.LINE_CHART: {"labels": [], "datasets": []},
            WidgetType.BAR_CHART: {"labels": [], "datasets": []},
            WidgetType.PIE_CHART: {"labels": [], "data": []},
            WidgetType.ALERT_LIST: {"alerts": []},
            WidgetType.FACILITY_LIST: {"facilities": []},
            WidgetType.TIMELINE: {"events": []},
            WidgetType.GLOBE_3D: {"markers": [], "layers": []},
        }
        return defaults.get(widget_type, {})

    def add_widget(self, config: WidgetConfig) -> DashboardWidget:
        """Add a new widget to the dashboard."""
        widget = DashboardWidget(config=config)
        self._widgets[config.id] = widget
        self.config.widgets.append(config)
        return widget

    def remove_widget(self, widget_id: str) -> bool:
        """Remove a widget from the dashboard."""
        if widget_id in self._widgets:
            del self._widgets[widget_id]
            self.config.widgets = [w for w in self.config.widgets if w.id != widget_id]
            return True
        return False

    def update_widget_position(
        self,
        widget_id: str,
        position: Dict[str, int],
    ) -> bool:
        """Update widget position."""
        widget = self._widgets.get(widget_id)
        if widget:
            widget.config.position = position
            return True
        return False

    def get_widget(self, widget_id: str) -> Optional[DashboardWidget]:
        """Get widget by ID."""
        return self._widgets.get(widget_id)

    def get_all_widgets(self) -> List[DashboardWidget]:
        """Get all widgets."""
        return list(self._widgets.values())

    def to_dict(self) -> dict:
        """Convert dashboard to dictionary for API/frontend."""
        return {
            "id": self.config.id,
            "name": self.config.name,
            "layout": self.config.layout.value,
            "theme": self.config.theme,
            "autoRefresh": self.config.auto_refresh,
            "refreshInterval": self.config.refresh_interval_seconds,
            "widgets": [w.to_dict() for w in self._widgets.values()],
            "createdAt": self.config.created_at.isoformat(),
            "updatedAt": self.config.updated_at.isoformat(),
        }

    def export_config(self) -> dict:
        """Export dashboard configuration for saving."""
        return {
            "id": self.config.id,
            "name": self.config.name,
            "layout": self.config.layout.value,
            "theme": self.config.theme,
            "widgets": [
                {
                    "id": w.id,
                    "type": w.type.value,
                    "title": w.title,
                    "position": w.position,
                    "options": w.options,
                }
                for w in self.config.widgets
            ],
        }

    @classmethod
    def from_config(cls, config_dict: dict) -> "Dashboard":
        """Create dashboard from configuration dictionary."""
        widgets = [
            WidgetConfig(
                id=w["id"],
                type=WidgetType(w["type"]),
                title=w["title"],
                position=w["position"],
                options=w.get("options", {}),
            )
            for w in config_dict.get("widgets", [])
        ]

        config = DashboardConfig(
            id=config_dict["id"],
            name=config_dict["name"],
            layout=DashboardLayout(config_dict.get("layout", "standard")),
            widgets=widgets,
            theme=config_dict.get("theme", "dark"),
        )

        return cls(config=config)


class DashboardManager:
    """Manage multiple dashboards."""

    def __init__(self):
        self._dashboards: Dict[str, Dashboard] = {}
        self._user_dashboards: Dict[str, List[str]] = {}

    def create_dashboard(
        self,
        user_id: str,
        name: str,
        layout: DashboardLayout = DashboardLayout.DASHBOARD_STANDARD,
    ) -> Dashboard:
        """Create a new dashboard for a user."""
        config = DashboardConfig(
            id=f"dash_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            name=name,
            layout=layout,
            widgets=[],
        )

        dashboard = Dashboard(config=config)
        self._dashboards[config.id] = dashboard

        if user_id not in self._user_dashboards:
            self._user_dashboards[user_id] = []
        self._user_dashboards[user_id].append(config.id)

        return dashboard

    def get_dashboard(self, dashboard_id: str) -> Optional[Dashboard]:
        """Get dashboard by ID."""
        return self._dashboards.get(dashboard_id)

    def get_user_dashboards(self, user_id: str) -> List[Dashboard]:
        """Get all dashboards for a user."""
        dashboard_ids = self._user_dashboards.get(user_id, [])
        return [self._dashboards[did] for did in dashboard_ids if did in self._dashboards]

    def delete_dashboard(self, dashboard_id: str) -> bool:
        """Delete a dashboard."""
        if dashboard_id in self._dashboards:
            del self._dashboards[dashboard_id]
            for user_id in self._user_dashboards:
                if dashboard_id in self._user_dashboards[user_id]:
                    self._user_dashboards[user_id].remove(dashboard_id)
            return True
        return False
