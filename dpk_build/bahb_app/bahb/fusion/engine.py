"""Multi-spectral fusion engine for comprehensive infrastructure monitoring.

Implements data fusion from multiple sources:
- Optical (RGB): High-resolution visual detail, weather-dependent
- Thermal (LWIR): Heat signatures, day/night capability
- SAR (X-band): All-weather, through-cloud imaging
- IoT: Ground-truth sensor data

Key innovation: No single platform offers integrated multi-spectral
fusion specifically for data center monitoring. This fills a critical
market gap identified in competitive intelligence analysis.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Any

import numpy as np
from numpy.typing import NDArray
from loguru import logger

from bahb.core.types import BoundingBox, Detection, GeoLocation


class SourceType(Enum):
    """Data source types for fusion."""
    OPTICAL = "optical"           # RGB visible light
    THERMAL = "thermal"           # Long-wave infrared
    SAR = "sar"                   # Synthetic Aperture Radar
    MULTISPECTRAL = "multispectral"  # Multiple bands
    HYPERSPECTRAL = "hyperspectral"  # Many narrow bands
    LIDAR = "lidar"               # Laser scanning
    IOT = "iot"                   # Ground sensors


class FusionStrategy(Enum):
    """Strategies for combining multi-source data."""
    WEIGHTED_AVERAGE = "weighted_average"
    CONFIDENCE_BASED = "confidence_based"
    MAJORITY_VOTE = "majority_vote"
    BAYESIAN = "bayesian"
    NEURAL_FUSION = "neural_fusion"


@dataclass
class SourceData:
    """Data from a single source."""
    source_type: SourceType
    timestamp: datetime
    data: NDArray                    # Image or sensor data
    metadata: dict = field(default_factory=dict)
    resolution_m: float = 1.0        # Spatial resolution in meters
    confidence: float = 1.0          # Data quality confidence
    location: Optional[GeoLocation] = None

    # Weather/condition flags
    cloud_cover: float = 0.0         # 0-1 cloud coverage
    is_daytime: bool = True
    weather_impact: float = 0.0      # 0-1 weather degradation


@dataclass
class FusedDetection:
    """Detection result from fused analysis."""
    id: str
    class_name: str
    bbox: BoundingBox
    confidence: float

    # Multi-source evidence
    optical_confidence: Optional[float] = None
    thermal_confidence: Optional[float] = None
    sar_confidence: Optional[float] = None

    # Combined analysis
    sources_agreeing: int = 0
    fusion_method: str = ""
    thermal_signature: Optional[float] = None
    operational_status: str = "unknown"


@dataclass
class FusedAnalysis:
    """Complete fused analysis result."""
    id: str
    timestamp: datetime
    location: Optional[GeoLocation] = None

    # Source contributions
    sources_used: list[SourceType] = field(default_factory=list)
    source_timestamps: dict[str, datetime] = field(default_factory=dict)

    # Fused results
    detections: list[FusedDetection] = field(default_factory=list)
    facility_power_estimate_mw: float = 0.0
    operational_score: float = 0.0   # 0-1 operational activity level
    change_detected: bool = False

    # Quality metrics
    overall_confidence: float = 0.0
    data_freshness_hours: float = 0.0
    coverage_completeness: float = 0.0

    # Conditions
    monitoring_conditions: str = "optimal"


class MultiSpectralFusionEngine:
    """
    Engine for fusing multi-spectral data sources.

    Combines:
    - Optical: Best for structural detail, limited by weather/night
    - Thermal: Reveals operational activity, works day/night
    - SAR: All-weather capability, detects changes through clouds

    This enables continuous 24/7/365 monitoring regardless of conditions.
    """

    # Source reliability weights by condition
    RELIABILITY_WEIGHTS = {
        # (daytime, clear weather)
        (True, True): {
            SourceType.OPTICAL: 1.0,
            SourceType.THERMAL: 0.9,
            SourceType.SAR: 0.7,
        },
        # (daytime, cloudy/rainy)
        (True, False): {
            SourceType.OPTICAL: 0.3,
            SourceType.THERMAL: 0.6,
            SourceType.SAR: 1.0,
        },
        # (nighttime, clear)
        (False, True): {
            SourceType.OPTICAL: 0.1,
            SourceType.THERMAL: 1.0,
            SourceType.SAR: 0.8,
        },
        # (nighttime, cloudy)
        (False, False): {
            SourceType.OPTICAL: 0.0,
            SourceType.THERMAL: 0.7,
            SourceType.SAR: 1.0,
        },
    }

    # Detection class thermal signatures (expected temp range °C)
    THERMAL_SIGNATURES = {
        "chiller": (25, 50),
        "cooling_tower": (20, 45),
        "transformer": (30, 70),
        "generator": (40, 90),
        "server_building": (25, 40),
        "active_datacenter": (28, 45),
        "idle_datacenter": (15, 25),
    }

    def __init__(
        self,
        fusion_strategy: FusionStrategy = FusionStrategy.CONFIDENCE_BASED,
        temporal_window_hours: float = 24.0,
        min_sources_for_fusion: int = 2,
    ):
        """
        Initialize fusion engine.

        Args:
            fusion_strategy: Method for combining source data
            temporal_window_hours: Max age difference for temporal fusion
            min_sources_for_fusion: Minimum sources required
        """
        self.fusion_strategy = fusion_strategy
        self.temporal_window = timedelta(hours=temporal_window_hours)
        self.min_sources = min_sources_for_fusion

        # Data buffers
        self._source_buffer: dict[SourceType, list[SourceData]] = {
            st: [] for st in SourceType
        }
        self._buffer_max_size = 100

        # Change detection baseline
        self._baseline_signatures: dict[str, dict] = {}

        logger.info(f"MultiSpectralFusionEngine initialized with {fusion_strategy.value} strategy")

    def ingest_data(self, source_data: SourceData) -> None:
        """
        Ingest data from a source into the fusion buffer.

        Args:
            source_data: Data from a single source
        """
        buffer = self._source_buffer[source_data.source_type]
        buffer.append(source_data)

        # Maintain buffer size
        if len(buffer) > self._buffer_max_size:
            buffer.pop(0)

        logger.debug(
            f"Ingested {source_data.source_type.value} data, "
            f"buffer size: {len(buffer)}"
        )

    def fuse_analysis(
        self,
        optical_detections: Optional[list[Detection]] = None,
        thermal_data: Optional[NDArray] = None,
        sar_data: Optional[NDArray] = None,
        optical_image: Optional[NDArray] = None,
        location: Optional[GeoLocation] = None,
        is_daytime: bool = True,
        is_clear_weather: bool = True,
    ) -> FusedAnalysis:
        """
        Perform fused analysis from multiple data sources.

        Args:
            optical_detections: Detections from optical imagery
            thermal_data: Thermal temperature map
            sar_data: SAR backscatter data
            optical_image: Raw optical image
            location: Geographic location
            is_daytime: Day/night flag
            is_clear_weather: Weather condition flag

        Returns:
            FusedAnalysis with combined results
        """
        analysis_id = str(uuid.uuid4())[:8]
        sources_used = []
        source_timestamps = {}

        # Get reliability weights for current conditions
        weights = self.RELIABILITY_WEIGHTS.get(
            (is_daytime, is_clear_weather),
            self.RELIABILITY_WEIGHTS[(True, True)]
        )

        # Collect detections from each source
        optical_dets = {}
        thermal_dets = {}
        sar_dets = {}

        # Process optical detections
        if optical_detections:
            sources_used.append(SourceType.OPTICAL)
            source_timestamps[SourceType.OPTICAL.value] = datetime.now()
            for det in optical_detections:
                key = self._detection_key(det)
                optical_dets[key] = {
                    "detection": det,
                    "confidence": det.confidence * weights[SourceType.OPTICAL],
                }

        # Process thermal data
        if thermal_data is not None:
            sources_used.append(SourceType.THERMAL)
            source_timestamps[SourceType.THERMAL.value] = datetime.now()
            thermal_dets = self._analyze_thermal_for_detections(
                thermal_data, optical_detections or [], weights[SourceType.THERMAL]
            )

        # Process SAR data
        if sar_data is not None:
            sources_used.append(SourceType.SAR)
            source_timestamps[SourceType.SAR.value] = datetime.now()
            sar_dets = self._analyze_sar_for_detections(
                sar_data, optical_detections or [], weights[SourceType.SAR]
            )

        # Fuse detections
        fused_detections = self._fuse_detections(
            optical_dets, thermal_dets, sar_dets, weights
        )

        # Calculate operational score from thermal
        operational_score = 0.0
        if thermal_data is not None:
            operational_score = self._calculate_operational_score(
                thermal_data, fused_detections
            )

        # Estimate facility power
        power_estimate = self._estimate_power_from_thermal(thermal_data)

        # Check for changes
        change_detected = self._detect_changes(location, fused_detections, operational_score)

        # Calculate quality metrics
        overall_confidence = self._calculate_overall_confidence(
            fused_detections, sources_used, weights
        )

        coverage = len(sources_used) / 3  # Max 3 primary sources

        # Determine monitoring conditions
        conditions = self._assess_monitoring_conditions(
            is_daytime, is_clear_weather, sources_used
        )

        return FusedAnalysis(
            id=analysis_id,
            timestamp=datetime.now(),
            location=location,
            sources_used=sources_used,
            source_timestamps=source_timestamps,
            detections=fused_detections,
            facility_power_estimate_mw=power_estimate,
            operational_score=operational_score,
            change_detected=change_detected,
            overall_confidence=overall_confidence,
            data_freshness_hours=0.0,  # Real-time analysis
            coverage_completeness=coverage,
            monitoring_conditions=conditions,
        )

    def _detection_key(self, det: Detection) -> str:
        """Generate unique key for a detection based on location."""
        cx, cy = det.bbox.center
        return f"{det.class_name}_{int(cx/50)}_{int(cy/50)}"

    def _analyze_thermal_for_detections(
        self,
        thermal_data: NDArray,
        reference_detections: list[Detection],
        weight: float,
    ) -> dict[str, dict]:
        """Extract thermal signatures for detection regions."""
        thermal_dets = {}

        for det in reference_detections:
            key = self._detection_key(det)

            # Extract thermal region
            x1, y1 = int(max(0, det.bbox.x1)), int(max(0, det.bbox.y1))
            x2 = int(min(thermal_data.shape[1], det.bbox.x2))
            y2 = int(min(thermal_data.shape[0], det.bbox.y2))

            if x2 > x1 and y2 > y1:
                region = thermal_data[y1:y2, x1:x2]
                mean_temp = float(np.mean(region))
                max_temp = float(np.max(region))

                # Calculate thermal confidence based on expected signature
                thermal_conf = self._thermal_signature_confidence(
                    det.class_name, mean_temp, max_temp
                )

                thermal_dets[key] = {
                    "confidence": thermal_conf * weight,
                    "mean_temp": mean_temp,
                    "max_temp": max_temp,
                    "operational": mean_temp > 25,  # Basic threshold
                }

        return thermal_dets

    def _thermal_signature_confidence(
        self,
        class_name: str,
        mean_temp: float,
        max_temp: float,
    ) -> float:
        """Calculate confidence based on thermal signature match."""
        expected = self.THERMAL_SIGNATURES.get(class_name.lower())

        if not expected:
            return 0.5  # Neutral confidence for unknown classes

        low, high = expected

        # Score based on how well temperature matches expected range
        if low <= mean_temp <= high:
            return 0.9
        elif mean_temp < low:
            deficit = low - mean_temp
            return max(0.3, 0.9 - deficit / 20)
        else:
            excess = mean_temp - high
            return max(0.3, 0.9 - excess / 30)

    def _analyze_sar_for_detections(
        self,
        sar_data: NDArray,
        reference_detections: list[Detection],
        weight: float,
    ) -> dict[str, dict]:
        """Analyze SAR backscatter for detection confirmation."""
        sar_dets = {}

        for det in reference_detections:
            key = self._detection_key(det)

            x1, y1 = int(max(0, det.bbox.x1)), int(max(0, det.bbox.y1))
            x2 = int(min(sar_data.shape[1], det.bbox.x2))
            y2 = int(min(sar_data.shape[0], det.bbox.y2))

            if x2 > x1 and y2 > y1:
                region = sar_data[y1:y2, x1:x2]
                mean_backscatter = float(np.mean(region))

                # Metal structures have high backscatter
                # Cooling equipment typically shows strong radar return
                if det.class_name.lower() in ["chiller", "cooling_tower", "transformer"]:
                    # Expect high backscatter for metal equipment
                    if mean_backscatter > np.percentile(sar_data, 70):
                        conf = 0.85
                    else:
                        conf = 0.4
                else:
                    conf = 0.6  # Neutral for other classes

                sar_dets[key] = {
                    "confidence": conf * weight,
                    "backscatter": mean_backscatter,
                }

        return sar_dets

    def _fuse_detections(
        self,
        optical: dict,
        thermal: dict,
        sar: dict,
        weights: dict,
    ) -> list[FusedDetection]:
        """Fuse detections from multiple sources."""
        all_keys = set(optical.keys()) | set(thermal.keys()) | set(sar.keys())
        fused = []

        for key in all_keys:
            opt_data = optical.get(key, {})
            therm_data = thermal.get(key, {})
            sar_data = sar.get(key, {})

            # Get base detection info
            base_det = opt_data.get("detection")
            if not base_det:
                continue

            # Calculate fused confidence
            confidences = []
            sources_agreeing = 0

            opt_conf = opt_data.get("confidence")
            therm_conf = therm_data.get("confidence")
            sar_conf = sar_data.get("confidence")

            if opt_conf and opt_conf > 0.3:
                confidences.append(opt_conf)
                sources_agreeing += 1
            if therm_conf and therm_conf > 0.3:
                confidences.append(therm_conf)
                sources_agreeing += 1
            if sar_conf and sar_conf > 0.3:
                confidences.append(sar_conf)
                sources_agreeing += 1

            if not confidences:
                continue

            # Fusion strategy
            if self.fusion_strategy == FusionStrategy.WEIGHTED_AVERAGE:
                fused_conf = np.mean(confidences)
            elif self.fusion_strategy == FusionStrategy.CONFIDENCE_BASED:
                fused_conf = np.max(confidences) * (0.8 + 0.2 * sources_agreeing / 3)
            elif self.fusion_strategy == FusionStrategy.MAJORITY_VOTE:
                fused_conf = 0.9 if sources_agreeing >= 2 else 0.5
            else:
                fused_conf = np.mean(confidences)

            # Determine operational status from thermal
            operational = "unknown"
            if therm_data:
                if therm_data.get("operational"):
                    operational = "active"
                else:
                    operational = "idle"

            fused_det = FusedDetection(
                id=f"fused_{len(fused):03d}",
                class_name=base_det.class_name,
                bbox=base_det.bbox,
                confidence=min(1.0, fused_conf),
                optical_confidence=opt_conf,
                thermal_confidence=therm_conf,
                sar_confidence=sar_conf,
                sources_agreeing=sources_agreeing,
                fusion_method=self.fusion_strategy.value,
                thermal_signature=therm_data.get("mean_temp"),
                operational_status=operational,
            )
            fused.append(fused_det)

        return fused

    def _calculate_operational_score(
        self,
        thermal_data: NDArray,
        detections: list[FusedDetection],
    ) -> float:
        """Calculate overall operational activity score."""
        if not detections:
            # Fall back to overall thermal analysis
            mean_temp = np.mean(thermal_data)
            if mean_temp > 35:
                return 0.9
            elif mean_temp > 28:
                return 0.6
            else:
                return 0.3

        # Score based on detection thermal signatures
        active_count = sum(1 for d in detections if d.operational_status == "active")
        total_with_thermal = sum(1 for d in detections if d.thermal_signature is not None)

        if total_with_thermal > 0:
            return active_count / total_with_thermal
        return 0.5

    def _estimate_power_from_thermal(
        self,
        thermal_data: Optional[NDArray],
    ) -> float:
        """Estimate facility power from thermal signature."""
        if thermal_data is None:
            return 0.0

        # Thermal power estimation based on heat rejection
        # Higher temperatures and larger hot areas = more power
        mean_temp = np.mean(thermal_data)
        hot_area_fraction = np.sum(thermal_data > 35) / thermal_data.size

        # Rough estimation: base power from temperature
        # A 100 MW facility typically shows 35-45°C across cooling equipment
        if mean_temp < 20:
            base_power = 0
        elif mean_temp < 30:
            base_power = (mean_temp - 20) * 5  # 0-50 MW
        elif mean_temp < 40:
            base_power = 50 + (mean_temp - 30) * 10  # 50-150 MW
        else:
            base_power = 150 + (mean_temp - 40) * 15  # 150+ MW

        # Adjust by hot area
        return base_power * (0.5 + hot_area_fraction)

    def _detect_changes(
        self,
        location: Optional[GeoLocation],
        detections: list[FusedDetection],
        operational_score: float,
    ) -> bool:
        """Detect significant changes from baseline."""
        if location is None:
            return False

        loc_key = f"{location.latitude:.4f}_{location.longitude:.4f}"

        # Get baseline
        baseline = self._baseline_signatures.get(loc_key)

        if baseline is None:
            # First observation - set baseline
            self._baseline_signatures[loc_key] = {
                "detection_count": len(detections),
                "operational_score": operational_score,
                "timestamp": datetime.now(),
            }
            return False

        # Compare to baseline
        detection_change = abs(len(detections) - baseline["detection_count"])
        score_change = abs(operational_score - baseline["operational_score"])

        # Significant change thresholds
        if detection_change > 3 or score_change > 0.3:
            # Update baseline
            self._baseline_signatures[loc_key] = {
                "detection_count": len(detections),
                "operational_score": operational_score,
                "timestamp": datetime.now(),
            }
            return True

        return False

    def _calculate_overall_confidence(
        self,
        detections: list[FusedDetection],
        sources: list[SourceType],
        weights: dict,
    ) -> float:
        """Calculate overall analysis confidence."""
        if not detections:
            return 0.3 * len(sources) / 3

        # Base on detection confidences and source coverage
        avg_det_conf = np.mean([d.confidence for d in detections])

        # Multi-source bonus
        source_bonus = 0.1 * (len(sources) - 1)

        # Agreement bonus
        avg_agreement = np.mean([d.sources_agreeing for d in detections])
        agreement_bonus = 0.1 * (avg_agreement - 1)

        return min(1.0, avg_det_conf + source_bonus + agreement_bonus)

    def _assess_monitoring_conditions(
        self,
        is_daytime: bool,
        is_clear: bool,
        sources: list[SourceType],
    ) -> str:
        """Assess overall monitoring conditions."""
        if is_daytime and is_clear and len(sources) >= 2:
            return "optimal"
        elif len(sources) >= 2:
            return "good"
        elif SourceType.SAR in sources:
            return "degraded_optical_sar_active"
        elif SourceType.THERMAL in sources:
            return "degraded_optical_thermal_active"
        else:
            return "limited"

    def get_source_status(self) -> dict:
        """Get status of all data sources."""
        status = {}

        for source_type, buffer in self._source_buffer.items():
            if buffer:
                latest = buffer[-1]
                age = (datetime.now() - latest.timestamp).total_seconds() / 3600

                status[source_type.value] = {
                    "available": True,
                    "buffer_size": len(buffer),
                    "latest_timestamp": latest.timestamp.isoformat(),
                    "age_hours": round(age, 2),
                    "resolution_m": latest.resolution_m,
                    "confidence": latest.confidence,
                }
            else:
                status[source_type.value] = {
                    "available": False,
                    "buffer_size": 0,
                }

        return status

    def generate_fusion_report(self, analysis: FusedAnalysis) -> dict:
        """Generate comprehensive fusion analysis report."""
        return {
            "analysis_id": analysis.id,
            "timestamp": analysis.timestamp.isoformat(),
            "location": analysis.location.to_dict() if analysis.location else None,
            "sources": {
                "used": [s.value for s in analysis.sources_used],
                "count": len(analysis.sources_used),
                "timestamps": {k: v.isoformat() for k, v in analysis.source_timestamps.items()},
            },
            "detections": {
                "total": len(analysis.detections),
                "high_confidence": sum(1 for d in analysis.detections if d.confidence > 0.8),
                "multi_source_confirmed": sum(1 for d in analysis.detections if d.sources_agreeing >= 2),
                "details": [
                    {
                        "class": d.class_name,
                        "confidence": f"{d.confidence:.1%}",
                        "sources_agreeing": d.sources_agreeing,
                        "thermal_temp": f"{d.thermal_signature:.1f}°C" if d.thermal_signature else None,
                        "status": d.operational_status,
                    }
                    for d in analysis.detections[:10]  # Top 10
                ],
            },
            "facility_analysis": {
                "estimated_power_mw": round(analysis.facility_power_estimate_mw, 1),
                "operational_score": f"{analysis.operational_score:.1%}",
                "change_detected": analysis.change_detected,
            },
            "quality_metrics": {
                "overall_confidence": f"{analysis.overall_confidence:.1%}",
                "data_freshness_hours": analysis.data_freshness_hours,
                "coverage_completeness": f"{analysis.coverage_completeness:.1%}",
                "monitoring_conditions": analysis.monitoring_conditions,
            },
            "innovation_note": "Multi-spectral fusion enables 24/7/365 monitoring - "
                              "no competitor offers integrated optical+thermal+SAR for data centers",
        }
