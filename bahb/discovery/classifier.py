"""Facility classifier for autonomous discovery.

Classifies detected facilities into categories:
- Hyperscale (100+ MW)
- Colocation (10-100 MW)
- Edge (1-10 MW)
- Enterprise (<1 MW)
- AI Training (specialized compute)
- Crypto Mining
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional, List, Dict

import numpy as np
from loguru import logger


class FacilityCategory(Enum):
    """Facility categories."""
    HYPERSCALE = "hyperscale"
    COLOCATION = "colocation"
    EDGE = "edge"
    ENTERPRISE = "enterprise"
    AI_TRAINING = "ai_training"
    CRYPTO_MINING = "crypto_mining"
    UNKNOWN = "unknown"


@dataclass
class ClassificationResult:
    """Result of facility classification."""
    category: FacilityCategory
    confidence: float
    subcategory: Optional[str] = None
    estimated_power_mw: float = 0.0
    estimated_it_load_mw: float = 0.0
    likely_operator: Optional[str] = None
    classification_features: Dict[str, float] = None


class FacilityClassifier:
    """
    Classify detected facilities based on observable characteristics.

    Features used for classification:
    - Physical size (building footprint)
    - Cooling infrastructure count
    - Power infrastructure
    - Thermal signature patterns
    - Location context
    """

    # Classification thresholds
    POWER_THRESHOLDS = {
        FacilityCategory.HYPERSCALE: 100,    # 100+ MW
        FacilityCategory.COLOCATION: 10,     # 10-100 MW
        FacilityCategory.EDGE: 1,            # 1-10 MW
        FacilityCategory.ENTERPRISE: 0,      # <1 MW
    }

    # Feature weights for classification
    FEATURE_WEIGHTS = {
        "cooling_density": 0.25,
        "thermal_uniformity": 0.20,
        "power_infrastructure": 0.20,
        "building_scale": 0.15,
        "location_context": 0.10,
        "construction_quality": 0.10,
    }

    # Known operator signatures (hypothetical)
    OPERATOR_SIGNATURES = {
        "google": {
            "cooling_type": "chiller",
            "building_style": "modular",
            "pue_target": 1.1,
        },
        "meta": {
            "cooling_type": "evaporative",
            "building_style": "warehouse",
            "pue_target": 1.1,
        },
        "microsoft": {
            "cooling_type": "hybrid",
            "building_style": "campus",
            "pue_target": 1.2,
        },
        "amazon": {
            "cooling_type": "chiller",
            "building_style": "industrial",
            "pue_target": 1.2,
        },
    }

    def __init__(self):
        self._classification_history: List[ClassificationResult] = []

    def classify(
        self,
        cooling_units: int,
        estimated_power_mw: float,
        building_area_sqm: float = 0,
        thermal_variance: float = 0,
        location_type: str = "general",
        cooling_types: Optional[List[str]] = None,
    ) -> ClassificationResult:
        """
        Classify a facility based on observed features.

        Args:
            cooling_units: Number of cooling units detected
            estimated_power_mw: Estimated power capacity
            building_area_sqm: Building footprint area
            thermal_variance: Variance in thermal readings
            location_type: Type of location (industrial, tech_hub, etc.)
            cooling_types: Types of cooling detected
        """
        features = {}

        # Calculate feature scores
        features["cooling_density"] = self._score_cooling_density(
            cooling_units, estimated_power_mw
        )
        features["thermal_uniformity"] = self._score_thermal_uniformity(
            thermal_variance
        )
        features["power_infrastructure"] = self._score_power_infrastructure(
            estimated_power_mw
        )
        features["building_scale"] = self._score_building_scale(
            building_area_sqm
        )
        features["location_context"] = self._score_location_context(
            location_type
        )
        features["construction_quality"] = self._score_construction_quality(
            cooling_types or []
        )

        # Determine primary category from power
        if estimated_power_mw >= 100:
            primary_category = FacilityCategory.HYPERSCALE
        elif estimated_power_mw >= 10:
            primary_category = FacilityCategory.COLOCATION
        elif estimated_power_mw >= 1:
            primary_category = FacilityCategory.EDGE
        else:
            primary_category = FacilityCategory.ENTERPRISE

        # Check for special categories
        subcategory = None

        # AI Training indicators
        if self._check_ai_training_indicators(features, cooling_types):
            if primary_category == FacilityCategory.HYPERSCALE:
                subcategory = "ai_focused"

        # Crypto mining indicators
        if self._check_crypto_indicators(thermal_variance, location_type):
            primary_category = FacilityCategory.CRYPTO_MINING

        # Calculate overall confidence
        weighted_score = sum(
            features[f] * self.FEATURE_WEIGHTS[f]
            for f in features
        )
        confidence = min(0.95, 0.5 + weighted_score * 0.5)

        # Try to identify operator
        likely_operator = self._identify_operator(features, cooling_types)

        result = ClassificationResult(
            category=primary_category,
            confidence=confidence,
            subcategory=subcategory,
            estimated_power_mw=estimated_power_mw,
            estimated_it_load_mw=estimated_power_mw / 1.4,  # Assume PUE 1.4
            likely_operator=likely_operator,
            classification_features=features,
        )

        self._classification_history.append(result)
        return result

    def _score_cooling_density(
        self,
        cooling_units: int,
        power_mw: float,
    ) -> float:
        """Score cooling density (units per MW)."""
        if power_mw <= 0:
            return 0.0

        density = cooling_units / power_mw
        # Typical density is 0.5-2 units per MW
        if 0.5 <= density <= 2.0:
            return 1.0
        elif density > 2.0:
            return 0.8  # Over-provisioned
        else:
            return 0.5  # Under-provisioned

    def _score_thermal_uniformity(self, variance: float) -> float:
        """Score thermal uniformity (lower variance = better)."""
        # Well-managed facilities have uniform thermal signatures
        if variance < 5:
            return 1.0
        elif variance < 10:
            return 0.8
        elif variance < 20:
            return 0.5
        else:
            return 0.3

    def _score_power_infrastructure(self, power_mw: float) -> float:
        """Score power infrastructure scale."""
        if power_mw >= 100:
            return 1.0
        elif power_mw >= 50:
            return 0.9
        elif power_mw >= 10:
            return 0.7
        elif power_mw >= 1:
            return 0.5
        else:
            return 0.3

    def _score_building_scale(self, area_sqm: float) -> float:
        """Score building scale."""
        if area_sqm >= 50000:
            return 1.0
        elif area_sqm >= 20000:
            return 0.8
        elif area_sqm >= 5000:
            return 0.6
        elif area_sqm > 0:
            return 0.4
        else:
            return 0.5  # Unknown

    def _score_location_context(self, location_type: str) -> float:
        """Score location context."""
        scores = {
            "data_center_cluster": 1.0,
            "tech_hub": 0.9,
            "industrial_zone": 0.7,
            "utility_corridor": 0.6,
            "general": 0.5,
        }
        return scores.get(location_type, 0.5)

    def _score_construction_quality(self, cooling_types: List[str]) -> float:
        """Score construction quality from cooling types."""
        high_end = {"chiller", "cooling_tower", "liquid_cooling"}
        mid_tier = {"dry_cooler", "crah"}

        if any(c in high_end for c in cooling_types):
            return 1.0
        elif any(c in mid_tier for c in cooling_types):
            return 0.7
        else:
            return 0.5

    def _check_ai_training_indicators(
        self,
        features: Dict[str, float],
        cooling_types: Optional[List[str]],
    ) -> bool:
        """Check for AI training facility indicators."""
        # AI facilities typically have:
        # - High cooling density (liquid cooling)
        # - Large scale
        # - High power

        has_liquid_cooling = cooling_types and "liquid_cooling" in cooling_types
        high_cooling_density = features.get("cooling_density", 0) > 0.8
        large_scale = features.get("building_scale", 0) > 0.8

        return has_liquid_cooling or (high_cooling_density and large_scale)

    def _check_crypto_indicators(
        self,
        thermal_variance: float,
        location_type: str,
    ) -> bool:
        """Check for crypto mining indicators."""
        # Crypto facilities often have:
        # - High thermal variance (dense, hot)
        # - Located in cheap power areas
        # - Less sophisticated cooling

        high_variance = thermal_variance > 15
        cheap_power_location = location_type in ["industrial_zone", "general"]

        return high_variance and cheap_power_location

    def _identify_operator(
        self,
        features: Dict[str, float],
        cooling_types: Optional[List[str]],
    ) -> Optional[str]:
        """Attempt to identify likely operator."""
        # This would use more sophisticated matching in production
        # For now, return None (unknown)
        return None

    def get_classification_stats(self) -> dict:
        """Get classification statistics."""
        if not self._classification_history:
            return {"total": 0}

        by_category = {}
        for result in self._classification_history:
            cat = result.category.value
            if cat not in by_category:
                by_category[cat] = 0
            by_category[cat] += 1

        return {
            "total_classified": len(self._classification_history),
            "by_category": by_category,
            "average_confidence": np.mean([r.confidence for r in self._classification_history]),
            "total_power_mw": sum(r.estimated_power_mw for r in self._classification_history),
        }
