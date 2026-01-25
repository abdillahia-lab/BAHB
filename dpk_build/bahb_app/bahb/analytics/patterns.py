"""Pattern detection for infrastructure monitoring.

Identifies recognizable patterns in facility data:
- Construction patterns
- Expansion indicators
- Operational signatures
- Anomalous behavior
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List

import numpy as np
from loguru import logger


class PatternType(Enum):
    """Types of detected patterns."""
    CONSTRUCTION_START = "construction_start"
    EXPANSION_PREPARATION = "expansion_preparation"
    OPERATIONAL_RAMP = "operational_ramp"
    CAPACITY_PLATEAU = "capacity_plateau"
    MAINTENANCE_CYCLE = "maintenance_cycle"
    SEASONAL_VARIATION = "seasonal_variation"
    ANOMALOUS_ACTIVITY = "anomalous_activity"


@dataclass
class InfrastructurePattern:
    """Detected infrastructure pattern."""
    type: PatternType
    confidence: float
    description: str
    detected_at: datetime
    indicators: list[str] = field(default_factory=list)
    affected_metrics: list[str] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)


class PatternDetector:
    """
    Detect patterns in infrastructure development and operations.

    Patterns include:
    - New construction activity
    - Expansion preparations
    - Operational ramp-up
    - Maintenance cycles
    - Anomalous activity
    """

    # Pattern signatures
    PATTERN_SIGNATURES = {
        PatternType.CONSTRUCTION_START: {
            "indicators": ["cleared_land", "excavation", "construction_equipment"],
            "thermal_change": "decrease",  # Reduced activity
            "power_change": "minimal",
        },
        PatternType.EXPANSION_PREPARATION: {
            "indicators": ["new_foundation", "adjacent_construction", "utility_extension"],
            "thermal_change": "increase",
            "power_change": "stable",
        },
        PatternType.OPERATIONAL_RAMP: {
            "indicators": ["cooling_activation", "thermal_increase", "power_growth"],
            "thermal_change": "increase",
            "power_change": "increase",
        },
        PatternType.CAPACITY_PLATEAU: {
            "indicators": ["stable_thermal", "stable_power", "high_utilization"],
            "thermal_change": "stable",
            "power_change": "stable",
        },
        PatternType.MAINTENANCE_CYCLE: {
            "indicators": ["periodic_cooling_off", "weekend_reduction", "scheduled_downtime"],
            "thermal_change": "periodic",
            "power_change": "periodic",
        },
    }

    def __init__(self):
        self._detected_patterns: dict[str, list[InfrastructurePattern]] = {}

    def detect_patterns(
        self,
        facility_id: str,
        detections: list[dict],
        thermal_data: Optional[list[float]] = None,
        power_data: Optional[list[float]] = None,
    ) -> list[InfrastructurePattern]:
        """
        Detect patterns from facility data.

        Args:
            facility_id: Facility identifier
            detections: Recent detection data
            thermal_data: Thermal readings over time
            power_data: Power readings over time

        Returns:
            List of detected patterns
        """
        patterns = []

        # Check for construction start
        construction = self._check_construction_start(detections)
        if construction:
            patterns.append(construction)

        # Check for expansion
        expansion = self._check_expansion_preparation(detections, thermal_data)
        if expansion:
            patterns.append(expansion)

        # Check for operational ramp
        if thermal_data and power_data:
            ramp = self._check_operational_ramp(thermal_data, power_data)
            if ramp:
                patterns.append(ramp)

            # Check for plateau
            plateau = self._check_capacity_plateau(thermal_data, power_data)
            if plateau:
                patterns.append(plateau)

            # Check for maintenance patterns
            maintenance = self._check_maintenance_cycle(thermal_data, power_data)
            if maintenance:
                patterns.append(maintenance)

        # Store patterns
        if facility_id not in self._detected_patterns:
            self._detected_patterns[facility_id] = []
        self._detected_patterns[facility_id].extend(patterns)

        return patterns

    def _check_construction_start(
        self,
        detections: list[dict],
    ) -> Optional[InfrastructurePattern]:
        """Check for construction start indicators."""
        construction_indicators = {
            "excavator", "bulldozer", "crane", "construction_fence",
            "site_trailer", "cleared_land", "foundation_work",
        }

        detected_classes = set()
        for det in detections:
            if isinstance(det, dict) and "class_name" in det:
                detected_classes.add(det["class_name"].lower())

        matches = detected_classes.intersection(construction_indicators)

        if len(matches) >= 2:
            return InfrastructurePattern(
                type=PatternType.CONSTRUCTION_START,
                confidence=min(0.9, len(matches) * 0.3),
                description="New construction activity detected",
                detected_at=datetime.now(),
                indicators=list(matches),
                affected_metrics=["land_use", "traffic", "infrastructure"],
                recommendations=[
                    "Monitor construction progress weekly",
                    "Estimate completion timeline",
                    "Track permit filings for capacity info",
                ],
            )

        return None

    def _check_expansion_preparation(
        self,
        detections: list[dict],
        thermal_data: Optional[list[float]],
    ) -> Optional[InfrastructurePattern]:
        """Check for expansion preparation indicators."""
        expansion_indicators = {
            "new_foundation", "utility_work", "substation_addition",
            "cooling_pad", "generator_pad", "transformer_addition",
        }

        detected_classes = set()
        for det in detections:
            if isinstance(det, dict) and "class_name" in det:
                detected_classes.add(det["class_name"].lower())

        matches = detected_classes.intersection(expansion_indicators)

        # Also check for thermal signature of new equipment testing
        thermal_evidence = False
        if thermal_data and len(thermal_data) >= 5:
            recent_variance = np.var(thermal_data[-5:])
            overall_variance = np.var(thermal_data)
            if recent_variance > overall_variance * 1.5:
                thermal_evidence = True

        if len(matches) >= 1 or (thermal_evidence and len(matches) >= 1):
            return InfrastructurePattern(
                type=PatternType.EXPANSION_PREPARATION,
                confidence=min(0.85, len(matches) * 0.25 + (0.2 if thermal_evidence else 0)),
                description="Facility expansion preparation detected",
                detected_at=datetime.now(),
                indicators=list(matches) + (["thermal_variance"] if thermal_evidence else []),
                affected_metrics=["capacity", "power", "cooling"],
                recommendations=[
                    "Estimate new capacity from equipment count",
                    "Project operational date",
                    "Monitor cooling infrastructure additions",
                ],
            )

        return None

    def _check_operational_ramp(
        self,
        thermal_data: list[float],
        power_data: list[float],
    ) -> Optional[InfrastructurePattern]:
        """Check for operational ramp-up pattern."""
        if len(thermal_data) < 10 or len(power_data) < 10:
            return None

        # Check for consistent increase in both metrics
        thermal_slope = np.polyfit(range(len(thermal_data)), thermal_data, 1)[0]
        power_slope = np.polyfit(range(len(power_data)), power_data, 1)[0]

        thermal_increase = thermal_slope > 0.1
        power_increase = power_slope > 0.05

        if thermal_increase and power_increase:
            return InfrastructurePattern(
                type=PatternType.OPERATIONAL_RAMP,
                confidence=0.75,
                description="Facility operational ramp-up in progress",
                detected_at=datetime.now(),
                indicators=[
                    f"thermal_trend: +{thermal_slope:.2f}",
                    f"power_trend: +{power_slope:.2f}",
                ],
                affected_metrics=["thermal", "power", "utilization"],
                recommendations=[
                    "Monitor for capacity milestone",
                    "Track time to full operation",
                    "Estimate current utilization percentage",
                ],
            )

        return None

    def _check_capacity_plateau(
        self,
        thermal_data: list[float],
        power_data: list[float],
    ) -> Optional[InfrastructurePattern]:
        """Check for capacity plateau pattern."""
        if len(thermal_data) < 10 or len(power_data) < 10:
            return None

        # Check for stable, high values
        recent_thermal = thermal_data[-10:]
        recent_power = power_data[-10:]

        thermal_cv = np.std(recent_thermal) / np.mean(recent_thermal) if np.mean(recent_thermal) > 0 else 1
        power_cv = np.std(recent_power) / np.mean(recent_power) if np.mean(recent_power) > 0 else 1

        is_stable = thermal_cv < 0.1 and power_cv < 0.1

        # Check if at high level (above median of all data)
        is_high = (
            np.mean(recent_thermal) > np.median(thermal_data) and
            np.mean(recent_power) > np.median(power_data)
        )

        if is_stable and is_high:
            return InfrastructurePattern(
                type=PatternType.CAPACITY_PLATEAU,
                confidence=0.7,
                description="Facility at operational capacity plateau",
                detected_at=datetime.now(),
                indicators=[
                    f"thermal_stability: {thermal_cv:.2%} cv",
                    f"power_stability: {power_cv:.2%} cv",
                ],
                affected_metrics=["utilization", "efficiency"],
                recommendations=[
                    "Facility operating at stable capacity",
                    "Monitor for expansion signals",
                    "Track efficiency metrics",
                ],
            )

        return None

    def _check_maintenance_cycle(
        self,
        thermal_data: list[float],
        power_data: list[float],
    ) -> Optional[InfrastructurePattern]:
        """Check for maintenance cycle pattern."""
        if len(thermal_data) < 14:  # Need at least 2 weeks
            return None

        # Look for periodic dips (weekly pattern)
        thermal_arr = np.array(thermal_data)

        # Check for weekly periodicity
        if len(thermal_arr) >= 7:
            weekly_means = []
            for i in range(len(thermal_arr) // 7):
                weekly_means.append(np.mean(thermal_arr[i*7:(i+1)*7]))

            if len(weekly_means) >= 2:
                # Check for consistent pattern
                diffs = [weekly_means[i+1] - weekly_means[i] for i in range(len(weekly_means)-1)]
                if all(abs(d) < np.std(thermal_arr) * 0.5 for d in diffs):
                    # Stable weekly pattern
                    return InfrastructurePattern(
                        type=PatternType.MAINTENANCE_CYCLE,
                        confidence=0.6,
                        description="Regular maintenance cycle detected",
                        detected_at=datetime.now(),
                        indicators=["weekly_pattern_detected"],
                        affected_metrics=["availability", "maintenance"],
                        recommendations=[
                            "Maintenance appears scheduled",
                            "Monitor for unscheduled downtime",
                        ],
                    )

        return None

    def get_patterns_for_facility(self, facility_id: str) -> list[InfrastructurePattern]:
        """Get all detected patterns for a facility."""
        return self._detected_patterns.get(facility_id, [])

    def generate_pattern_report(
        self,
        facility_id: str,
        patterns: list[InfrastructurePattern],
    ) -> dict:
        """Generate pattern analysis report."""
        return {
            "facility_id": facility_id,
            "analysis_timestamp": datetime.now().isoformat(),
            "patterns_detected": len(patterns),
            "patterns": [
                {
                    "type": p.type.value,
                    "confidence": f"{p.confidence:.1%}",
                    "description": p.description,
                    "detected_at": p.detected_at.isoformat(),
                    "indicators": p.indicators,
                    "recommendations": p.recommendations,
                }
                for p in patterns
            ],
            "summary": self._summarize_patterns(patterns),
        }

    def _summarize_patterns(self, patterns: list[InfrastructurePattern]) -> str:
        """Generate summary of detected patterns."""
        if not patterns:
            return "No significant patterns detected"

        pattern_types = [p.type.value for p in patterns]

        summaries = []
        if PatternType.CONSTRUCTION_START.value in pattern_types:
            summaries.append("New construction activity observed")
        if PatternType.EXPANSION_PREPARATION.value in pattern_types:
            summaries.append("Expansion preparation underway")
        if PatternType.OPERATIONAL_RAMP.value in pattern_types:
            summaries.append("Facility ramping up operations")
        if PatternType.CAPACITY_PLATEAU.value in pattern_types:
            summaries.append("Operating at stable capacity")

        return ". ".join(summaries) + "." if summaries else "Patterns detected - see details"
