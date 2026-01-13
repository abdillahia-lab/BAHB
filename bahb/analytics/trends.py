"""Trend analysis for infrastructure monitoring.

Analyzes patterns and trends in:
- Power consumption over time
- Cooling efficiency
- Construction progress
- Operational activity
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Tuple

import numpy as np
from loguru import logger


class TrendDirection(Enum):
    """Direction of trend."""
    RISING = "rising"
    FALLING = "falling"
    STABLE = "stable"
    VOLATILE = "volatile"


class TrendStrength(Enum):
    """Strength of trend."""
    STRONG = "strong"
    MODERATE = "moderate"
    WEAK = "weak"
    NONE = "none"


@dataclass
class Trend:
    """Detected trend in time series data."""
    direction: TrendDirection
    strength: TrendStrength
    slope: float
    r_squared: float
    start_date: datetime
    end_date: datetime
    data_points: int
    change_percentage: float
    anomalies_detected: int = 0


class TrendAnalyzer:
    """
    Analyze trends in infrastructure metrics.

    Detects:
    - Linear trends (growth/decline)
    - Seasonal patterns
    - Anomalous deviations
    - Inflection points
    """

    def __init__(
        self,
        min_data_points: int = 5,
        volatility_threshold: float = 0.2,
    ):
        self.min_data_points = min_data_points
        self.volatility_threshold = volatility_threshold

    def analyze(
        self,
        values: list[float],
        timestamps: list[datetime],
    ) -> Trend:
        """
        Analyze trend in time series.

        Args:
            values: Metric values
            timestamps: Corresponding timestamps
        """
        if len(values) < self.min_data_points:
            return Trend(
                direction=TrendDirection.STABLE,
                strength=TrendStrength.NONE,
                slope=0,
                r_squared=0,
                start_date=timestamps[0] if timestamps else datetime.now(),
                end_date=timestamps[-1] if timestamps else datetime.now(),
                data_points=len(values),
                change_percentage=0,
            )

        values_arr = np.array(values)
        x = np.arange(len(values))

        # Linear regression
        slope, intercept = np.polyfit(x, values_arr, 1)

        # R-squared
        predicted = slope * x + intercept
        ss_res = np.sum((values_arr - predicted) ** 2)
        ss_tot = np.sum((values_arr - np.mean(values_arr)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

        # Volatility check
        std = np.std(values_arr)
        mean = np.mean(values_arr)
        cv = std / mean if mean != 0 else 0

        # Determine direction
        if cv > self.volatility_threshold:
            direction = TrendDirection.VOLATILE
        elif abs(slope) < 0.01 * mean:
            direction = TrendDirection.STABLE
        elif slope > 0:
            direction = TrendDirection.RISING
        else:
            direction = TrendDirection.FALLING

        # Determine strength
        if r_squared > 0.8:
            strength = TrendStrength.STRONG
        elif r_squared > 0.5:
            strength = TrendStrength.MODERATE
        elif r_squared > 0.2:
            strength = TrendStrength.WEAK
        else:
            strength = TrendStrength.NONE

        # Change percentage
        if values[0] != 0:
            change_pct = ((values[-1] - values[0]) / values[0]) * 100
        else:
            change_pct = 0

        # Count anomalies (values > 2 std from mean)
        anomalies = np.sum(np.abs(values_arr - mean) > 2 * std)

        return Trend(
            direction=direction,
            strength=strength,
            slope=slope,
            r_squared=r_squared,
            start_date=timestamps[0],
            end_date=timestamps[-1],
            data_points=len(values),
            change_percentage=change_pct,
            anomalies_detected=int(anomalies),
        )

    def detect_inflection_points(
        self,
        values: list[float],
        timestamps: list[datetime],
        window_size: int = 5,
    ) -> list[dict]:
        """
        Detect points where trend direction changes.
        """
        if len(values) < window_size * 2:
            return []

        inflection_points = []
        values_arr = np.array(values)

        # Calculate rolling slopes
        for i in range(window_size, len(values) - window_size):
            before = values_arr[i - window_size:i]
            after = values_arr[i:i + window_size]

            slope_before = np.polyfit(range(len(before)), before, 1)[0]
            slope_after = np.polyfit(range(len(after)), after, 1)[0]

            # Check for sign change or significant slope change
            if (slope_before > 0 and slope_after < 0) or (slope_before < 0 and slope_after > 0):
                inflection_points.append({
                    "index": i,
                    "timestamp": timestamps[i].isoformat(),
                    "value": values[i],
                    "type": "reversal",
                    "slope_before": slope_before,
                    "slope_after": slope_after,
                })

        return inflection_points

    def compare_periods(
        self,
        values: list[float],
        timestamps: list[datetime],
        period_days: int = 30,
    ) -> dict:
        """
        Compare metrics across time periods.
        """
        if len(values) < 2:
            return {"error": "Insufficient data"}

        # Split into periods
        total_span = (timestamps[-1] - timestamps[0]).days
        if total_span < period_days:
            return {"error": f"Data span ({total_span} days) less than period ({period_days} days)"}

        periods = []
        current_period_start = timestamps[0]
        current_period_values = []

        for ts, val in zip(timestamps, values):
            if (ts - current_period_start).days >= period_days:
                if current_period_values:
                    periods.append({
                        "start": current_period_start,
                        "values": current_period_values.copy(),
                        "mean": np.mean(current_period_values),
                        "std": np.std(current_period_values),
                    })
                current_period_start = ts
                current_period_values = []
            current_period_values.append(val)

        # Add final period
        if current_period_values:
            periods.append({
                "start": current_period_start,
                "values": current_period_values,
                "mean": np.mean(current_period_values),
                "std": np.std(current_period_values),
            })

        if len(periods) < 2:
            return {"error": "Need at least 2 periods for comparison"}

        # Compare consecutive periods
        comparisons = []
        for i in range(1, len(periods)):
            prev = periods[i - 1]
            curr = periods[i]

            change = curr["mean"] - prev["mean"]
            change_pct = (change / prev["mean"] * 100) if prev["mean"] != 0 else 0

            comparisons.append({
                "period": i,
                "start_date": curr["start"].isoformat(),
                "mean": curr["mean"],
                "change_from_previous": change,
                "change_percentage": change_pct,
            })

        return {
            "period_days": period_days,
            "total_periods": len(periods),
            "comparisons": comparisons,
            "overall_trend": self.analyze(values, timestamps).__dict__,
        }

    def generate_trend_report(self, trend: Trend) -> dict:
        """Generate human-readable trend report."""
        return {
            "summary": {
                "direction": trend.direction.value,
                "strength": trend.strength.value,
                "confidence": f"{trend.r_squared:.1%}",
            },
            "details": {
                "slope": f"{trend.slope:+.4f} per unit",
                "change_percentage": f"{trend.change_percentage:+.1f}%",
                "data_points": trend.data_points,
                "anomalies": trend.anomalies_detected,
            },
            "time_range": {
                "start": trend.start_date.isoformat(),
                "end": trend.end_date.isoformat(),
                "span_days": (trend.end_date - trend.start_date).days,
            },
            "interpretation": self._interpret_trend(trend),
        }

    def _interpret_trend(self, trend: Trend) -> str:
        """Generate natural language interpretation."""
        if trend.direction == TrendDirection.VOLATILE:
            return (
                f"Highly variable data with {trend.anomalies_detected} anomalies detected. "
                "No clear trend direction."
            )

        if trend.strength == TrendStrength.NONE:
            return "No significant trend detected in the data."

        direction_text = "increasing" if trend.direction == TrendDirection.RISING else "decreasing"
        strength_text = trend.strength.value

        return (
            f"Data shows a {strength_text} {direction_text} trend "
            f"with {abs(trend.change_percentage):.1f}% change over the period. "
            f"Trend confidence: {trend.r_squared:.1%}."
        )
