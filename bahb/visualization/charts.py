"""Chart generation for infrastructure data visualization.

Supports various chart types for analytics dashboards:
- Line charts for trends
- Bar charts for comparisons
- Pie charts for distributions
- Heatmaps for spatial data
- Sparklines for compact metrics
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

import numpy as np


class ChartType(Enum):
    """Types of charts."""
    LINE = "line"
    BAR = "bar"
    PIE = "pie"
    DOUGHNUT = "doughnut"
    AREA = "area"
    SCATTER = "scatter"
    HEATMAP = "heatmap"
    SPARKLINE = "sparkline"
    GAUGE = "gauge"
    RADAR = "radar"


@dataclass
class ChartDataset:
    """Dataset for chart rendering."""
    label: str
    data: List[float]
    color: Optional[str] = None
    fill: bool = False
    tension: float = 0.4  # Line smoothing


@dataclass
class ChartConfig:
    """Chart configuration."""
    chart_type: ChartType
    title: str
    labels: List[str]
    datasets: List[ChartDataset]

    # Axes
    x_axis_label: Optional[str] = None
    y_axis_label: Optional[str] = None
    y_min: Optional[float] = None
    y_max: Optional[float] = None

    # Formatting
    show_legend: bool = True
    show_grid: bool = True
    animate: bool = True

    # Dimensions
    width: Optional[int] = None
    height: Optional[int] = None


class ChartGenerator:
    """
    Generate charts for infrastructure data.

    Outputs Chart.js compatible configurations.
    """

    # Default color palette
    COLORS = [
        "#4A90D9",  # Blue
        "#50C878",  # Green
        "#FF6B6B",  # Red
        "#FFD93D",  # Yellow
        "#6C5CE7",  # Purple
        "#00CEC9",  # Cyan
        "#FD79A8",  # Pink
        "#FDCB6E",  # Orange
    ]

    def __init__(self):
        self._color_index = 0

    def _next_color(self) -> str:
        """Get next color from palette."""
        color = self.COLORS[self._color_index % len(self.COLORS)]
        self._color_index += 1
        return color

    def line_chart(
        self,
        title: str,
        labels: List[str],
        datasets: Dict[str, List[float]],
        **kwargs,
    ) -> dict:
        """Generate line chart configuration."""
        chart_datasets = []
        for name, values in datasets.items():
            chart_datasets.append(ChartDataset(
                label=name,
                data=values,
                color=self._next_color(),
            ))

        config = ChartConfig(
            chart_type=ChartType.LINE,
            title=title,
            labels=labels,
            datasets=chart_datasets,
            **kwargs,
        )

        return self._to_chartjs(config)

    def bar_chart(
        self,
        title: str,
        labels: List[str],
        datasets: Dict[str, List[float]],
        stacked: bool = False,
        **kwargs,
    ) -> dict:
        """Generate bar chart configuration."""
        chart_datasets = []
        for name, values in datasets.items():
            chart_datasets.append(ChartDataset(
                label=name,
                data=values,
                color=self._next_color(),
            ))

        config = ChartConfig(
            chart_type=ChartType.BAR,
            title=title,
            labels=labels,
            datasets=chart_datasets,
            **kwargs,
        )

        result = self._to_chartjs(config)
        if stacked:
            result["options"]["scales"] = {
                "x": {"stacked": True},
                "y": {"stacked": True},
            }

        return result

    def pie_chart(
        self,
        title: str,
        labels: List[str],
        values: List[float],
        **kwargs,
    ) -> dict:
        """Generate pie chart configuration."""
        colors = [self._next_color() for _ in values]

        config = ChartConfig(
            chart_type=ChartType.PIE,
            title=title,
            labels=labels,
            datasets=[ChartDataset(
                label="",
                data=values,
                color=colors[0],  # Will use all colors
            )],
            **kwargs,
        )

        result = self._to_chartjs(config)
        result["data"]["datasets"][0]["backgroundColor"] = colors

        return result

    def gauge_chart(
        self,
        title: str,
        value: float,
        min_value: float = 0,
        max_value: float = 100,
        thresholds: Optional[Dict[str, float]] = None,
    ) -> dict:
        """Generate gauge chart configuration."""
        # Gauge is implemented as a doughnut chart
        percentage = (value - min_value) / (max_value - min_value) * 100

        thresholds = thresholds or {"low": 30, "medium": 70, "high": 100}

        if percentage < thresholds.get("low", 30):
            color = "#50C878"  # Green
        elif percentage < thresholds.get("medium", 70):
            color = "#FFD93D"  # Yellow
        else:
            color = "#FF6B6B"  # Red

        return {
            "type": "doughnut",
            "data": {
                "labels": [title, ""],
                "datasets": [{
                    "data": [percentage, 100 - percentage],
                    "backgroundColor": [color, "#E0E0E0"],
                    "borderWidth": 0,
                }],
            },
            "options": {
                "circumference": 180,
                "rotation": -90,
                "cutout": "70%",
                "plugins": {
                    "legend": {"display": False},
                    "title": {
                        "display": True,
                        "text": f"{title}: {value:.1f}",
                    },
                },
            },
        }

    def sparkline(
        self,
        values: List[float],
        color: Optional[str] = None,
    ) -> dict:
        """Generate sparkline configuration."""
        return {
            "type": "line",
            "data": {
                "labels": list(range(len(values))),
                "datasets": [{
                    "data": values,
                    "borderColor": color or "#4A90D9",
                    "borderWidth": 2,
                    "fill": False,
                    "pointRadius": 0,
                    "tension": 0.4,
                }],
            },
            "options": {
                "responsive": True,
                "maintainAspectRatio": False,
                "plugins": {
                    "legend": {"display": False},
                },
                "scales": {
                    "x": {"display": False},
                    "y": {"display": False},
                },
            },
        }

    def heatmap(
        self,
        title: str,
        data: List[List[float]],
        x_labels: List[str],
        y_labels: List[str],
    ) -> dict:
        """Generate heatmap configuration (matrix format)."""
        # Flatten data for heatmap
        heatmap_data = []
        for y, row in enumerate(data):
            for x, value in enumerate(row):
                heatmap_data.append({
                    "x": x_labels[x],
                    "y": y_labels[y],
                    "v": value,
                })

        return {
            "type": "matrix",
            "data": {
                "datasets": [{
                    "label": title,
                    "data": heatmap_data,
                    "borderWidth": 1,
                    "borderColor": "#fff",
                    "width": lambda ctx: (ctx.chart.chartArea or {}).get("width", 0) / len(x_labels) - 1,
                    "height": lambda ctx: (ctx.chart.chartArea or {}).get("height", 0) / len(y_labels) - 1,
                }],
            },
            "options": {
                "plugins": {
                    "legend": {"display": False},
                    "title": {"display": True, "text": title},
                },
            },
        }

    def _to_chartjs(self, config: ChartConfig) -> dict:
        """Convert config to Chart.js format."""
        return {
            "type": config.chart_type.value,
            "data": {
                "labels": config.labels,
                "datasets": [
                    {
                        "label": ds.label,
                        "data": ds.data,
                        "borderColor": ds.color,
                        "backgroundColor": ds.color if config.chart_type in [ChartType.BAR, ChartType.PIE] else f"{ds.color}33",
                        "fill": ds.fill,
                        "tension": ds.tension,
                    }
                    for ds in config.datasets
                ],
            },
            "options": {
                "responsive": True,
                "animation": {"duration": 1000 if config.animate else 0},
                "plugins": {
                    "legend": {"display": config.show_legend},
                    "title": {
                        "display": bool(config.title),
                        "text": config.title,
                    },
                },
                "scales": {
                    "x": {
                        "display": config.show_grid,
                        "title": {
                            "display": bool(config.x_axis_label),
                            "text": config.x_axis_label,
                        },
                    },
                    "y": {
                        "display": config.show_grid,
                        "title": {
                            "display": bool(config.y_axis_label),
                            "text": config.y_axis_label,
                        },
                        "min": config.y_min,
                        "max": config.y_max,
                    },
                } if config.chart_type not in [ChartType.PIE, ChartType.DOUGHNUT] else {},
            },
        }

    # Convenience methods for common infrastructure charts

    def power_trend_chart(
        self,
        dates: List[str],
        power_values: List[float],
        title: str = "Power Consumption Trend",
    ) -> dict:
        """Generate power consumption trend chart."""
        return self.line_chart(
            title=title,
            labels=dates,
            datasets={"Power (MW)": power_values},
            y_axis_label="Power (MW)",
            x_axis_label="Date",
        )

    def facility_type_distribution(
        self,
        distribution: Dict[str, int],
        title: str = "Facilities by Type",
    ) -> dict:
        """Generate facility type distribution pie chart."""
        return self.pie_chart(
            title=title,
            labels=list(distribution.keys()),
            values=list(distribution.values()),
        )

    def construction_progress_chart(
        self,
        phases: List[str],
        completion: List[float],
        title: str = "Construction Progress",
    ) -> dict:
        """Generate construction progress bar chart."""
        return self.bar_chart(
            title=title,
            labels=phases,
            datasets={"Completion %": completion},
            y_axis_label="Completion (%)",
            y_max=100,
        )
