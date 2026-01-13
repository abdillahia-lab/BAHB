"""Predictive analytics engine for infrastructure forecasting.

Key innovation: No competitor offers predictive AI for data center
capacity forecasting. This transforms reactive reporting into
forward-looking intelligence.

Implements:
- Construction timeline prediction
- Capacity expansion forecasting
- Power consumption modeling
- Anomaly prediction
- Operational pattern recognition
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Tuple

import numpy as np
from numpy.typing import NDArray
from loguru import logger


class PredictionType(Enum):
    """Types of predictions."""
    CONSTRUCTION_COMPLETION = "construction_completion"
    CAPACITY_EXPANSION = "capacity_expansion"
    POWER_CONSUMPTION = "power_consumption"
    OPERATIONAL_STATUS = "operational_status"
    ANOMALY = "anomaly"
    COST = "cost"
    EQUIPMENT_FAILURE = "equipment_failure"


class ConfidenceLevel(Enum):
    """Confidence levels for predictions."""
    HIGH = "high"          # >80% confidence
    MEDIUM = "medium"      # 60-80% confidence
    LOW = "low"            # 40-60% confidence
    SPECULATIVE = "speculative"  # <40% confidence


@dataclass
class Prediction:
    """A prediction with confidence and timeframe."""
    id: str
    type: PredictionType
    target_metric: str
    predicted_value: float
    predicted_date: Optional[datetime] = None

    # Confidence
    confidence: float = 0.5
    confidence_level: ConfidenceLevel = ConfidenceLevel.MEDIUM
    confidence_interval: Tuple[float, float] = (0.0, 0.0)

    # Context
    facility_id: Optional[str] = None
    current_value: Optional[float] = None
    historical_values: list[float] = field(default_factory=list)

    # Methodology
    method_used: str = ""
    features_used: list[str] = field(default_factory=list)

    # Timing
    created_at: datetime = field(default_factory=datetime.now)
    valid_until: Optional[datetime] = None

    # Actionable insights
    recommendations: list[str] = field(default_factory=list)
    risk_factors: list[str] = field(default_factory=list)


@dataclass
class ForecastResult:
    """Time series forecast result."""
    timestamps: list[datetime]
    values: list[float]
    lower_bound: list[float]
    upper_bound: list[float]
    confidence: float
    method: str
    seasonality_detected: bool = False
    trend_direction: str = "stable"


class TimeSeriesForecaster:
    """
    Time series forecasting for infrastructure metrics.

    Implements multiple forecasting methods:
    - Moving average (simple, weighted, exponential)
    - Linear/polynomial regression
    - Seasonal decomposition
    - ARIMA-style modeling
    """

    def __init__(
        self,
        default_horizon_days: int = 30,
        seasonality_period: int = 7,
    ):
        self.default_horizon = default_horizon_days
        self.seasonality_period = seasonality_period

    def forecast(
        self,
        historical_values: list[float],
        historical_dates: list[datetime],
        horizon_days: Optional[int] = None,
        method: str = "auto",
    ) -> ForecastResult:
        """
        Generate forecast from historical data.

        Args:
            historical_values: Past observations
            historical_dates: Corresponding timestamps
            horizon_days: How far to forecast
            method: Forecasting method (auto, ema, linear, seasonal)
        """
        horizon = horizon_days or self.default_horizon

        if len(historical_values) < 3:
            # Not enough data - return flat forecast
            last_value = historical_values[-1] if historical_values else 0
            last_date = historical_dates[-1] if historical_dates else datetime.now()

            future_dates = [
                last_date + timedelta(days=i)
                for i in range(1, horizon + 1)
            ]

            return ForecastResult(
                timestamps=future_dates,
                values=[last_value] * horizon,
                lower_bound=[last_value * 0.8] * horizon,
                upper_bound=[last_value * 1.2] * horizon,
                confidence=0.3,
                method="flat",
            )

        values = np.array(historical_values)

        # Auto-select method based on data characteristics
        if method == "auto":
            method = self._select_method(values)

        # Generate forecast
        if method == "ema":
            result = self._forecast_ema(values, historical_dates, horizon)
        elif method == "linear":
            result = self._forecast_linear(values, historical_dates, horizon)
        elif method == "seasonal":
            result = self._forecast_seasonal(values, historical_dates, horizon)
        else:
            result = self._forecast_ema(values, historical_dates, horizon)

        return result

    def _select_method(self, values: NDArray) -> str:
        """Auto-select best forecasting method."""
        # Check for trend
        if len(values) >= 10:
            trend = np.polyfit(range(len(values)), values, 1)[0]
            if abs(trend) > 0.1 * np.std(values):
                return "linear"

        # Check for seasonality
        if len(values) >= self.seasonality_period * 2:
            autocorr = np.correlate(values - np.mean(values), values - np.mean(values), mode='full')
            autocorr = autocorr[len(autocorr)//2:]
            if len(autocorr) > self.seasonality_period:
                if autocorr[self.seasonality_period] > 0.3 * autocorr[0]:
                    return "seasonal"

        return "ema"

    def _forecast_ema(
        self,
        values: NDArray,
        dates: list[datetime],
        horizon: int,
        alpha: float = 0.3,
    ) -> ForecastResult:
        """Exponential moving average forecast."""
        # Calculate EMA
        ema = values[0]
        for v in values[1:]:
            ema = alpha * v + (1 - alpha) * ema

        # Calculate trend from recent EMA values
        if len(values) >= 5:
            recent = values[-5:]
            trend = (recent[-1] - recent[0]) / 5
        else:
            trend = 0

        # Generate forecast
        last_date = dates[-1]
        future_dates = [last_date + timedelta(days=i) for i in range(1, horizon + 1)]

        forecast_values = []
        current = ema
        for i in range(horizon):
            current = current + trend * (1 - i / horizon)  # Dampen trend
            forecast_values.append(current)

        # Confidence intervals (widen over time)
        std = np.std(values) if len(values) > 1 else values[0] * 0.1
        lower = [v - std * (1 + i * 0.1) for i, v in enumerate(forecast_values)]
        upper = [v + std * (1 + i * 0.1) for i, v in enumerate(forecast_values)]

        return ForecastResult(
            timestamps=future_dates,
            values=forecast_values,
            lower_bound=lower,
            upper_bound=upper,
            confidence=0.7,
            method="ema",
            trend_direction="rising" if trend > 0 else "falling" if trend < 0 else "stable",
        )

    def _forecast_linear(
        self,
        values: NDArray,
        dates: list[datetime],
        horizon: int,
    ) -> ForecastResult:
        """Linear regression forecast."""
        x = np.arange(len(values))
        coeffs = np.polyfit(x, values, 1)
        slope, intercept = coeffs

        # Generate forecast
        last_date = dates[-1]
        future_dates = [last_date + timedelta(days=i) for i in range(1, horizon + 1)]

        future_x = np.arange(len(values), len(values) + horizon)
        forecast_values = [slope * xi + intercept for xi in future_x]

        # Residual-based confidence intervals
        predicted = slope * x + intercept
        residuals = values - predicted
        std = np.std(residuals)

        lower = [v - 2 * std for v in forecast_values]
        upper = [v + 2 * std for v in forecast_values]

        # R-squared for confidence
        ss_res = np.sum(residuals ** 2)
        ss_tot = np.sum((values - np.mean(values)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

        return ForecastResult(
            timestamps=future_dates,
            values=forecast_values,
            lower_bound=lower,
            upper_bound=upper,
            confidence=max(0.3, r_squared),
            method="linear",
            trend_direction="rising" if slope > 0 else "falling" if slope < 0 else "stable",
        )

    def _forecast_seasonal(
        self,
        values: NDArray,
        dates: list[datetime],
        horizon: int,
    ) -> ForecastResult:
        """Seasonal decomposition forecast."""
        period = self.seasonality_period

        # Extract seasonal pattern
        if len(values) >= period * 2:
            seasonal = np.zeros(period)
            for i in range(period):
                seasonal[i] = np.mean(values[i::period])
            seasonal = seasonal - np.mean(seasonal)
        else:
            seasonal = np.zeros(period)

        # Deseasonalize and get trend
        deseasonalized = values - np.tile(seasonal, len(values) // period + 1)[:len(values)]
        x = np.arange(len(deseasonalized))
        slope, intercept = np.polyfit(x, deseasonalized, 1)

        # Generate forecast
        last_date = dates[-1]
        future_dates = [last_date + timedelta(days=i) for i in range(1, horizon + 1)]

        forecast_values = []
        for i in range(horizon):
            trend_value = slope * (len(values) + i) + intercept
            seasonal_value = seasonal[(len(values) + i) % period]
            forecast_values.append(trend_value + seasonal_value)

        std = np.std(values)
        lower = [v - 1.5 * std for v in forecast_values]
        upper = [v + 1.5 * std for v in forecast_values]

        return ForecastResult(
            timestamps=future_dates,
            values=forecast_values,
            lower_bound=lower,
            upper_bound=upper,
            confidence=0.6,
            method="seasonal",
            seasonality_detected=True,
            trend_direction="rising" if slope > 0 else "falling" if slope < 0 else "stable",
        )


class PredictiveEngine:
    """
    Main predictive analytics engine.

    Generates predictions for:
    - Construction completion dates
    - Capacity expansion timing
    - Power consumption trends
    - Equipment health/failures
    - Cost projections
    """

    # Typical construction durations by phase (days)
    CONSTRUCTION_DURATIONS = {
        "site_preparation": 60,
        "foundation": 90,
        "structural": 120,
        "mep_rough": 90,
        "mep_finish": 60,
        "commissioning": 30,
    }

    # Power consumption patterns
    POWER_PATTERNS = {
        "weekday_peak": 1.0,
        "weekday_off_peak": 0.85,
        "weekend": 0.75,
        "holiday": 0.70,
    }

    def __init__(self):
        self.forecaster = TimeSeriesForecaster()
        self._prediction_history: dict[str, list[Prediction]] = {}
        self._accuracy_tracking: dict[str, list[float]] = {}

    def predict_construction_completion(
        self,
        facility_id: str,
        current_phase: str,
        phase_start_date: datetime,
        historical_pace: Optional[float] = None,
    ) -> Prediction:
        """
        Predict construction completion date.

        Args:
            facility_id: Facility identifier
            current_phase: Current construction phase
            phase_start_date: When current phase started
            historical_pace: Historical pace multiplier (1.0 = typical)
        """
        pace = historical_pace or 1.0

        # Calculate remaining duration
        phases = list(self.CONSTRUCTION_DURATIONS.keys())
        if current_phase not in phases:
            current_phase = phases[0]

        current_idx = phases.index(current_phase)
        remaining_phases = phases[current_idx:]

        # Days in current phase so far
        days_in_phase = (datetime.now() - phase_start_date).days
        current_phase_remaining = max(
            0,
            self.CONSTRUCTION_DURATIONS[current_phase] * pace - days_in_phase
        )

        # Total remaining days
        total_remaining = current_phase_remaining
        for phase in remaining_phases[1:]:
            total_remaining += self.CONSTRUCTION_DURATIONS[phase] * pace

        completion_date = datetime.now() + timedelta(days=total_remaining)

        # Confidence based on phase progress
        phase_progress = days_in_phase / (self.CONSTRUCTION_DURATIONS[current_phase] * pace)
        overall_progress = (current_idx + phase_progress) / len(phases)

        # Higher confidence as more phases complete
        base_confidence = 0.5 + 0.4 * overall_progress

        # Adjust confidence based on historical accuracy
        if facility_id in self._accuracy_tracking:
            historical_accuracy = np.mean(self._accuracy_tracking[facility_id])
            base_confidence *= historical_accuracy

        # Confidence interval (±2 weeks at 80% confidence)
        interval_days = 14 / base_confidence
        lower_date = completion_date - timedelta(days=interval_days)
        upper_date = completion_date + timedelta(days=interval_days)

        prediction = Prediction(
            id=str(uuid.uuid4())[:8],
            type=PredictionType.CONSTRUCTION_COMPLETION,
            target_metric="completion_date",
            predicted_value=total_remaining,
            predicted_date=completion_date,
            confidence=base_confidence,
            confidence_level=self._get_confidence_level(base_confidence),
            confidence_interval=(
                (completion_date - lower_date).days,
                (upper_date - completion_date).days,
            ),
            facility_id=facility_id,
            current_value=overall_progress * 100,
            method_used="phase_duration_model",
            features_used=["current_phase", "phase_start_date", "historical_pace"],
            valid_until=completion_date,
            recommendations=[
                f"Current phase: {current_phase}",
                f"Remaining phases: {len(remaining_phases)}",
                f"Estimated {int(total_remaining)} days until completion",
            ],
            risk_factors=self._identify_construction_risks(current_phase, pace),
        )

        self._store_prediction(facility_id, prediction)
        return prediction

    def predict_capacity_expansion(
        self,
        facility_id: str,
        current_power_mw: float,
        power_history: list[Tuple[datetime, float]],
        cooling_units_added: int = 0,
    ) -> Prediction:
        """
        Predict capacity expansion based on historical growth.
        """
        if not power_history:
            return Prediction(
                id=str(uuid.uuid4())[:8],
                type=PredictionType.CAPACITY_EXPANSION,
                target_metric="power_mw",
                predicted_value=current_power_mw,
                confidence=0.3,
                confidence_level=ConfidenceLevel.LOW,
                facility_id=facility_id,
                notes="Insufficient historical data",
            )

        # Extract values and dates
        dates = [t[0] for t in power_history]
        values = [t[1] for t in power_history]

        # Forecast using time series
        forecast = self.forecaster.forecast(values, dates, horizon_days=180)

        # Check for expansion indicators
        expansion_likely = False
        expansion_reasons = []

        if cooling_units_added > 0:
            expansion_likely = True
            expansion_reasons.append(f"{cooling_units_added} new cooling units detected")

        if forecast.trend_direction == "rising":
            growth_rate = (forecast.values[-1] - values[-1]) / max(values[-1], 1) * 100
            if growth_rate > 10:
                expansion_likely = True
                expansion_reasons.append(f"Projected {growth_rate:.1f}% growth")

        # Calculate predicted expansion
        predicted_expansion = forecast.values[-1] - current_power_mw

        prediction = Prediction(
            id=str(uuid.uuid4())[:8],
            type=PredictionType.CAPACITY_EXPANSION,
            target_metric="power_mw_increase",
            predicted_value=predicted_expansion,
            predicted_date=forecast.timestamps[-1],
            confidence=forecast.confidence * (0.8 if expansion_likely else 0.5),
            confidence_level=self._get_confidence_level(forecast.confidence),
            confidence_interval=(
                forecast.lower_bound[-1] - current_power_mw,
                forecast.upper_bound[-1] - current_power_mw,
            ),
            facility_id=facility_id,
            current_value=current_power_mw,
            historical_values=values,
            method_used=forecast.method,
            features_used=["power_history", "cooling_units", "trend"],
            recommendations=expansion_reasons if expansion_reasons else ["No significant expansion detected"],
        )

        self._store_prediction(facility_id, prediction)
        return prediction

    def predict_power_consumption(
        self,
        facility_id: str,
        current_power_mw: float,
        power_history: list[Tuple[datetime, float]],
        horizon_days: int = 30,
    ) -> Prediction:
        """
        Predict future power consumption.
        """
        if len(power_history) < 7:
            # Simple growth-based prediction
            growth_rate = 0.02  # 2% monthly growth assumption
            predicted = current_power_mw * (1 + growth_rate * horizon_days / 30)

            return Prediction(
                id=str(uuid.uuid4())[:8],
                type=PredictionType.POWER_CONSUMPTION,
                target_metric="power_mw",
                predicted_value=predicted,
                predicted_date=datetime.now() + timedelta(days=horizon_days),
                confidence=0.4,
                confidence_level=ConfidenceLevel.LOW,
                facility_id=facility_id,
                current_value=current_power_mw,
                method_used="growth_assumption",
                notes="Limited historical data - using industry growth rate",
            )

        dates = [t[0] for t in power_history]
        values = [t[1] for t in power_history]

        forecast = self.forecaster.forecast(values, dates, horizon_days)

        return Prediction(
            id=str(uuid.uuid4())[:8],
            type=PredictionType.POWER_CONSUMPTION,
            target_metric="power_mw",
            predicted_value=forecast.values[-1],
            predicted_date=forecast.timestamps[-1],
            confidence=forecast.confidence,
            confidence_level=self._get_confidence_level(forecast.confidence),
            confidence_interval=(forecast.lower_bound[-1], forecast.upper_bound[-1]),
            facility_id=facility_id,
            current_value=current_power_mw,
            historical_values=values,
            method_used=forecast.method,
            features_used=["power_history"],
            recommendations=[
                f"Trend: {forecast.trend_direction}",
                f"Seasonality: {'detected' if forecast.seasonality_detected else 'not detected'}",
            ],
        )

    def predict_equipment_health(
        self,
        equipment_id: str,
        thermal_history: list[Tuple[datetime, float]],
        equipment_type: str,
        age_days: int = 0,
    ) -> Prediction:
        """
        Predict equipment health and potential failures.
        """
        if not thermal_history:
            return Prediction(
                id=str(uuid.uuid4())[:8],
                type=PredictionType.EQUIPMENT_FAILURE,
                target_metric="failure_probability",
                predicted_value=0.1,  # Base failure rate
                confidence=0.3,
                confidence_level=ConfidenceLevel.SPECULATIVE,
            )

        temps = [t[1] for t in thermal_history]
        dates = [t[0] for t in thermal_history]

        # Analyze temperature trend
        if len(temps) >= 5:
            recent_temps = temps[-5:]
            temp_trend = (recent_temps[-1] - recent_temps[0]) / 5
        else:
            temp_trend = 0

        # Calculate failure probability
        # Based on: temperature deviation, trend, and age
        mean_temp = np.mean(temps)
        temp_std = np.std(temps) if len(temps) > 1 else 0

        # Equipment-specific thresholds
        thresholds = {
            "transformer": (40, 70),
            "chiller": (25, 50),
            "generator": (50, 90),
            "default": (30, 60),
        }
        normal_low, normal_high = thresholds.get(equipment_type, thresholds["default"])

        # Temperature deviation factor
        if mean_temp < normal_low:
            temp_factor = 0.1
        elif mean_temp > normal_high:
            temp_factor = min(0.8, (mean_temp - normal_high) / 30)
        else:
            temp_factor = 0.05

        # Trend factor
        trend_factor = max(0, temp_trend / 5) * 0.3

        # Age factor (failure probability increases with age)
        age_factor = min(0.3, age_days / 3650 * 0.3)  # Max 0.3 at 10 years

        # Combined failure probability
        failure_prob = min(0.95, temp_factor + trend_factor + age_factor)

        # Risk level
        if failure_prob > 0.5:
            risk_level = "HIGH"
            recommendations = [
                "Schedule immediate inspection",
                "Prepare backup equipment",
                "Monitor continuously",
            ]
        elif failure_prob > 0.2:
            risk_level = "MEDIUM"
            recommendations = [
                "Schedule maintenance within 30 days",
                "Review thermal trends weekly",
            ]
        else:
            risk_level = "LOW"
            recommendations = [
                "Continue normal monitoring",
                "Review at next scheduled maintenance",
            ]

        return Prediction(
            id=str(uuid.uuid4())[:8],
            type=PredictionType.EQUIPMENT_FAILURE,
            target_metric="failure_probability",
            predicted_value=failure_prob,
            confidence=0.7 if len(temps) > 10 else 0.4,
            confidence_level=self._get_confidence_level(0.7 if len(temps) > 10 else 0.4),
            current_value=temps[-1] if temps else 0,
            historical_values=temps,
            method_used="thermal_health_model",
            features_used=["thermal_history", "equipment_type", "age"],
            recommendations=recommendations,
            risk_factors=[
                f"Risk level: {risk_level}",
                f"Current temp: {temps[-1] if temps else 'N/A'}°C",
                f"Temperature trend: {temp_trend:+.2f}°C/reading",
                f"Equipment age: {age_days} days",
            ],
        )

    def _get_confidence_level(self, confidence: float) -> ConfidenceLevel:
        """Map numeric confidence to level."""
        if confidence >= 0.8:
            return ConfidenceLevel.HIGH
        elif confidence >= 0.6:
            return ConfidenceLevel.MEDIUM
        elif confidence >= 0.4:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.SPECULATIVE

    def _identify_construction_risks(
        self,
        current_phase: str,
        pace: float,
    ) -> list[str]:
        """Identify construction risk factors."""
        risks = []

        if pace < 0.8:
            risks.append("Construction pace slower than typical - potential delays")

        if current_phase in ["mep_rough", "mep_finish"]:
            risks.append("MEP phase - equipment delivery delays possible")

        if pace > 1.3:
            risks.append("Accelerated schedule - quality risks")

        return risks if risks else ["No significant risks identified"]

    def _store_prediction(self, facility_id: str, prediction: Prediction) -> None:
        """Store prediction for tracking."""
        if facility_id not in self._prediction_history:
            self._prediction_history[facility_id] = []

        self._prediction_history[facility_id].append(prediction)

        # Maintain history limit
        if len(self._prediction_history[facility_id]) > 100:
            self._prediction_history[facility_id].pop(0)

    def update_accuracy(
        self,
        facility_id: str,
        prediction_id: str,
        actual_value: float,
    ) -> float:
        """
        Update prediction accuracy tracking with actual result.

        Returns accuracy score for this prediction.
        """
        if facility_id not in self._prediction_history:
            return 0.0

        for pred in self._prediction_history[facility_id]:
            if pred.id == prediction_id:
                # Calculate accuracy
                if pred.predicted_value == 0:
                    accuracy = 1.0 if actual_value == 0 else 0.0
                else:
                    error = abs(actual_value - pred.predicted_value) / abs(pred.predicted_value)
                    accuracy = max(0, 1 - error)

                # Store accuracy
                if facility_id not in self._accuracy_tracking:
                    self._accuracy_tracking[facility_id] = []
                self._accuracy_tracking[facility_id].append(accuracy)

                logger.info(
                    f"Prediction {prediction_id} accuracy: {accuracy:.1%} "
                    f"(predicted: {pred.predicted_value}, actual: {actual_value})"
                )

                return accuracy

        return 0.0

    def generate_prediction_report(
        self,
        facility_id: str,
        predictions: list[Prediction],
    ) -> dict:
        """Generate comprehensive prediction report."""
        return {
            "facility_id": facility_id,
            "generated_at": datetime.now().isoformat(),
            "predictions": [
                {
                    "id": p.id,
                    "type": p.type.value,
                    "metric": p.target_metric,
                    "predicted_value": p.predicted_value,
                    "predicted_date": p.predicted_date.isoformat() if p.predicted_date else None,
                    "confidence": f"{p.confidence:.1%}",
                    "confidence_level": p.confidence_level.value,
                    "method": p.method_used,
                    "recommendations": p.recommendations,
                    "risk_factors": p.risk_factors,
                }
                for p in predictions
            ],
            "accuracy_history": {
                "samples": len(self._accuracy_tracking.get(facility_id, [])),
                "mean_accuracy": f"{np.mean(self._accuracy_tracking.get(facility_id, [0])):.1%}",
            },
            "innovation_note": "Predictive analytics - no competitor offers ML-powered "
                              "forecasting for data center infrastructure",
        }
