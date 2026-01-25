"""
Ensemble Module - Based on "Solving a Million-Step LLM Task with Zero Errors"

Key principle: Multiple model generations with voting mechanisms to select
correct outputs. Statistical aggregation weighted by confidence scores.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from typing import Any, Callable, Optional, TypeVar, Generic

import numpy as np
from numpy.typing import NDArray
from loguru import logger

from bahb.core.types import (
    Anomaly,
    BoundingBox,
    Detection,
    Segmentation,
    SeverityLevel,
)


class VotingStrategy(Enum):
    """Ensemble voting strategies."""
    MAJORITY = auto()          # Simple majority voting
    WEIGHTED = auto()          # Confidence-weighted voting
    CONSENSUS = auto()         # Require agreement threshold
    SOFT_NMS = auto()          # Soft non-maximum suppression
    ENSEMBLE_BOXES = auto()    # Weighted boxes fusion


@dataclass
class EnsembleConfig:
    """Configuration for ensemble voting."""
    strategy: VotingStrategy = VotingStrategy.WEIGHTED
    min_votes: int = 2           # Minimum votes to keep a detection
    iou_threshold: float = 0.5   # IoU threshold for matching
    score_threshold: float = 0.3  # Minimum score to include
    weights: list[float] = None  # Model weights (None = equal)


T = TypeVar('T')


class EnsembleVoter(ABC, Generic[T]):
    """Base class for ensemble voting."""

    @abstractmethod
    def vote(self, predictions: list[list[T]]) -> list[T]:
        """Aggregate predictions from multiple models."""
        pass


class DetectionEnsemble(EnsembleVoter[Detection]):
    """
    Ensemble voting for object detection.

    Supports multiple strategies:
    - Weighted boxes fusion
    - Soft-NMS ensemble
    - Consensus voting
    """

    def __init__(self, config: EnsembleConfig = None):
        self.config = config or EnsembleConfig()

    def vote(self, predictions: list[list[Detection]]) -> list[Detection]:
        """
        Aggregate detections from multiple models.

        Args:
            predictions: List of detection lists from different models

        Returns:
            Merged detections with aggregated confidence
        """
        if not predictions:
            return []

        # Flatten if single model (still apply NMS)
        if len(predictions) == 1:
            return self._apply_nms(predictions[0])

        strategy = self.config.strategy

        if strategy == VotingStrategy.SOFT_NMS:
            return self._soft_nms_ensemble(predictions)
        elif strategy == VotingStrategy.ENSEMBLE_BOXES:
            return self._weighted_boxes_fusion(predictions)
        elif strategy == VotingStrategy.CONSENSUS:
            return self._consensus_voting(predictions)
        else:
            return self._weighted_voting(predictions)

    def _weighted_voting(
        self,
        predictions: list[list[Detection]],
    ) -> list[Detection]:
        """Standard weighted voting with NMS."""
        # Assign weights
        n_models = len(predictions)
        weights = self.config.weights or [1.0 / n_models] * n_models

        # Group detections by class
        by_class: dict[int, list[tuple[Detection, float]]] = {}

        for model_idx, dets in enumerate(predictions):
            weight = weights[model_idx] if model_idx < len(weights) else 1.0 / n_models
            for det in dets:
                by_class.setdefault(det.class_id, []).append((det, weight))

        # Process each class
        results = []
        for class_id, weighted_dets in by_class.items():
            # Cluster overlapping detections
            clusters = self._cluster_detections(
                [d for d, w in weighted_dets],
                [w for d, w in weighted_dets],
            )

            # Merge each cluster
            for cluster_dets, cluster_weights in clusters:
                if len(cluster_dets) >= self.config.min_votes:
                    merged = self._merge_detections(cluster_dets, cluster_weights)
                    if merged.confidence >= self.config.score_threshold:
                        results.append(merged)

        return results

    def _consensus_voting(
        self,
        predictions: list[list[Detection]],
    ) -> list[Detection]:
        """Only keep detections agreed upon by multiple models."""
        n_models = len(predictions)
        min_agreement = max(2, n_models // 2 + 1)  # Majority

        # Group by class
        by_class: dict[int, list[Detection]] = {}
        for dets in predictions:
            for det in dets:
                by_class.setdefault(det.class_id, []).append(det)

        results = []
        for class_id, dets in by_class.items():
            clusters = self._cluster_detections(dets, [1.0] * len(dets))

            for cluster_dets, weights in clusters:
                if len(cluster_dets) >= min_agreement:
                    merged = self._merge_detections(cluster_dets, weights)
                    results.append(merged)

        return results

    def _soft_nms_ensemble(
        self,
        predictions: list[list[Detection]],
    ) -> list[Detection]:
        """Soft-NMS ensemble: decay overlapping scores instead of suppressing."""
        # Flatten all predictions
        all_dets = []
        for dets in predictions:
            all_dets.extend(dets)

        if not all_dets:
            return []

        # Group by class
        by_class: dict[int, list[Detection]] = {}
        for det in all_dets:
            by_class.setdefault(det.class_id, []).append(det)

        results = []
        sigma = 0.5  # Soft-NMS sigma

        for class_id, dets in by_class.items():
            # Sort by confidence
            dets = sorted(dets, key=lambda d: d.confidence, reverse=True)
            scores = [d.confidence for d in dets]

            while dets:
                # Take highest scoring
                best = dets.pop(0)
                best_score = scores.pop(0)

                if best_score >= self.config.score_threshold:
                    results.append(Detection(
                        class_id=best.class_id,
                        class_name=best.class_name,
                        confidence=best_score,
                        bbox=best.bbox,
                        mask=best.mask,
                        track_id=best.track_id,
                    ))

                # Decay overlapping scores
                remaining_dets = []
                remaining_scores = []
                for det, score in zip(dets, scores):
                    iou = self._compute_iou(best.bbox, det.bbox)
                    # Gaussian decay
                    decayed_score = score * np.exp(-(iou ** 2) / sigma)
                    if decayed_score >= self.config.score_threshold * 0.5:
                        remaining_dets.append(det)
                        remaining_scores.append(decayed_score)

                dets = remaining_dets
                scores = remaining_scores

        return results

    def _weighted_boxes_fusion(
        self,
        predictions: list[list[Detection]],
    ) -> list[Detection]:
        """
        Weighted Boxes Fusion algorithm.

        Fuses overlapping boxes with weighted averaging.
        """
        n_models = len(predictions)
        weights = self.config.weights or [1.0] * n_models

        # Normalize weights
        weight_sum = sum(weights)
        weights = [w / weight_sum for w in weights]

        # Group all detections by class
        by_class: dict[int, list[tuple[Detection, float]]] = {}
        for model_idx, dets in enumerate(predictions):
            for det in dets:
                by_class.setdefault(det.class_id, []).append(
                    (det, weights[model_idx])
                )

        results = []

        for class_id, weighted_dets in by_class.items():
            # Sort by confidence
            weighted_dets.sort(key=lambda x: x[0].confidence * x[1], reverse=True)

            fused = []
            fused_weights = []

            for det, weight in weighted_dets:
                # Check if matches existing cluster
                matched = False
                for i, (cluster_det, cluster_weight) in enumerate(zip(fused, fused_weights)):
                    iou = self._compute_iou(det.bbox, cluster_det.bbox)
                    if iou > self.config.iou_threshold:
                        # Fuse with weighted average
                        total_weight = cluster_weight + weight
                        ratio = weight / total_weight

                        new_x1 = cluster_det.bbox.x1 * (1 - ratio) + det.bbox.x1 * ratio
                        new_y1 = cluster_det.bbox.y1 * (1 - ratio) + det.bbox.y1 * ratio
                        new_x2 = cluster_det.bbox.x2 * (1 - ratio) + det.bbox.x2 * ratio
                        new_y2 = cluster_det.bbox.y2 * (1 - ratio) + det.bbox.y2 * ratio

                        new_conf = (
                            cluster_det.confidence * cluster_weight +
                            det.confidence * weight
                        ) / total_weight

                        fused[i] = Detection(
                            class_id=class_id,
                            class_name=det.class_name,
                            confidence=new_conf,
                            bbox=BoundingBox(x1=new_x1, y1=new_y1, x2=new_x2, y2=new_y2),
                            mask=det.mask,
                        )
                        fused_weights[i] = total_weight
                        matched = True
                        break

                if not matched:
                    fused.append(det)
                    fused_weights.append(weight)

            # Filter by vote count (weight represents vote count here)
            for det, weight in zip(fused, fused_weights):
                # Weight threshold based on min_votes
                min_weight = self.config.min_votes / n_models
                if weight >= min_weight and det.confidence >= self.config.score_threshold:
                    results.append(det)

        return results

    def _cluster_detections(
        self,
        detections: list[Detection],
        weights: list[float],
    ) -> list[tuple[list[Detection], list[float]]]:
        """Cluster overlapping detections."""
        if not detections:
            return []

        clusters: list[tuple[list[Detection], list[float]]] = []
        used = set()

        for i, det in enumerate(detections):
            if i in used:
                continue

            # Start new cluster
            cluster_dets = [det]
            cluster_weights = [weights[i]]
            used.add(i)

            # Find overlapping detections
            for j, other in enumerate(detections):
                if j in used:
                    continue
                if self._compute_iou(det.bbox, other.bbox) >= self.config.iou_threshold:
                    cluster_dets.append(other)
                    cluster_weights.append(weights[j])
                    used.add(j)

            clusters.append((cluster_dets, cluster_weights))

        return clusters

    def _merge_detections(
        self,
        detections: list[Detection],
        weights: list[float],
    ) -> Detection:
        """Merge multiple detections into one with weighted average."""
        if len(detections) == 1:
            return detections[0]

        # Normalize weights
        total_weight = sum(weights)
        norm_weights = [w / total_weight for w in weights]

        # Weighted average of boxes
        x1 = sum(d.bbox.x1 * w for d, w in zip(detections, norm_weights))
        y1 = sum(d.bbox.y1 * w for d, w in zip(detections, norm_weights))
        x2 = sum(d.bbox.x2 * w for d, w in zip(detections, norm_weights))
        y2 = sum(d.bbox.y2 * w for d, w in zip(detections, norm_weights))

        # Weighted average confidence (boosted by vote count)
        base_conf = sum(d.confidence * w for d, w in zip(detections, norm_weights))
        vote_boost = min(len(detections) / 3, 1.2)  # Boost up to 20% for multiple votes
        confidence = min(base_conf * vote_boost, 1.0)

        return Detection(
            class_id=detections[0].class_id,
            class_name=detections[0].class_name,
            confidence=confidence,
            bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
            mask=detections[0].mask,
            track_id=detections[0].track_id,
        )

    def _apply_nms(self, detections: list[Detection]) -> list[Detection]:
        """Apply standard NMS to single model output."""
        if not detections:
            return []

        # Group by class
        by_class: dict[int, list[Detection]] = {}
        for det in detections:
            by_class.setdefault(det.class_id, []).append(det)

        results = []
        for class_id, dets in by_class.items():
            dets.sort(key=lambda d: d.confidence, reverse=True)

            keep = []
            while dets:
                best = dets.pop(0)
                if best.confidence >= self.config.score_threshold:
                    keep.append(best)

                dets = [
                    d for d in dets
                    if self._compute_iou(best.bbox, d.bbox) < self.config.iou_threshold
                ]

            results.extend(keep)

        return results

    def _compute_iou(self, box1: BoundingBox, box2: BoundingBox) -> float:
        """Compute Intersection over Union."""
        x1 = max(box1.x1, box2.x1)
        y1 = max(box1.y1, box2.y1)
        x2 = min(box1.x2, box2.x2)
        y2 = min(box1.y2, box2.y2)

        if x2 <= x1 or y2 <= y1:
            return 0.0

        intersection = (x2 - x1) * (y2 - y1)
        union = box1.area + box2.area - intersection

        return intersection / union if union > 0 else 0.0


class AnomalyEnsemble(EnsembleVoter[Anomaly]):
    """
    Ensemble voting for anomaly detection.

    Aggregates anomaly predictions with severity voting.
    """

    def __init__(
        self,
        min_votes: int = 2,
        location_threshold: float = 50.0,  # pixels
    ):
        self.min_votes = min_votes
        self.location_threshold = location_threshold

    def vote(self, predictions: list[list[Anomaly]]) -> list[Anomaly]:
        """Aggregate anomaly predictions."""
        if not predictions:
            return []

        if len(predictions) == 1:
            return predictions[0]

        # Flatten all anomalies
        all_anomalies = []
        for model_idx, anomalies in enumerate(predictions):
            for anomaly in anomalies:
                all_anomalies.append((model_idx, anomaly))

        # Cluster by location and type
        clusters = self._cluster_anomalies(all_anomalies)

        results = []
        for cluster in clusters:
            if len(cluster) >= self.min_votes:
                merged = self._merge_anomalies(cluster)
                results.append(merged)

        return results

    def _cluster_anomalies(
        self,
        anomalies: list[tuple[int, Anomaly]],
    ) -> list[list[Anomaly]]:
        """Cluster anomalies by location and type."""
        clusters: list[list[Anomaly]] = []
        used = set()

        for i, (model_idx, anomaly) in enumerate(anomalies):
            if i in used:
                continue

            cluster = [anomaly]
            used.add(i)

            # Find similar anomalies
            for j, (other_model_idx, other) in enumerate(anomalies):
                if j in used:
                    continue
                if model_idx == other_model_idx:
                    continue  # Don't cluster same model's outputs

                if self._are_similar(anomaly, other):
                    cluster.append(other)
                    used.add(j)

            clusters.append(cluster)

        return clusters

    def _are_similar(self, a1: Anomaly, a2: Anomaly) -> bool:
        """Check if two anomalies are similar (same issue)."""
        # Must be same type
        if a1.type != a2.type:
            return False

        # Check spatial proximity via detections
        if a1.detection and a2.detection:
            cx1, cy1 = a1.detection.bbox.center
            cx2, cy2 = a2.detection.bbox.center
            distance = ((cx1 - cx2) ** 2 + (cy1 - cy2) ** 2) ** 0.5
            return distance < self.location_threshold

        return True  # Same type, no location info

    def _merge_anomalies(self, anomalies: list[Anomaly]) -> Anomaly:
        """Merge multiple anomalies into one."""
        if len(anomalies) == 1:
            return anomalies[0]

        # Vote on severity (take highest)
        severity = max(a.severity for a in anomalies)

        # Use highest confidence detection
        best_detection = max(
            (a.detection for a in anomalies if a.detection),
            key=lambda d: d.confidence,
            default=anomalies[0].detection,
        )

        # Combine recommendations (unique)
        all_recs = []
        for a in anomalies:
            all_recs.extend(a.recommendations)
        unique_recs = list(dict.fromkeys(all_recs))[:5]

        # Use longest description
        description = max(
            (a.description for a in anomalies),
            key=len,
        )

        # Add vote count to metadata
        description += f" (confirmed by {len(anomalies)} models)"

        return Anomaly(
            id=anomalies[0].id,
            type=anomalies[0].type,
            severity=severity,
            description=description,
            detection=best_detection,
            thermal=anomalies[0].thermal,
            location=anomalies[0].location,
            timestamp=datetime.now(),
            recommendations=unique_recs,
        )


class ConfidenceCalibrator:
    """
    Calibrates model confidence scores based on validation history.

    Based on paper principle: "Cost-accuracy optimization through
    proper confidence calibration."
    """

    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.prediction_history: list[tuple[float, bool]] = []  # (confidence, was_correct)
        self._calibration_map: Optional[dict[int, float]] = None

    def record_prediction(self, confidence: float, was_correct: bool) -> None:
        """Record a prediction and its correctness."""
        self.prediction_history.append((confidence, was_correct))
        if len(self.prediction_history) > self.window_size:
            self.prediction_history.pop(0)

        # Invalidate calibration map
        self._calibration_map = None

    def calibrate(self, confidence: float) -> float:
        """
        Calibrate a confidence score based on historical accuracy.

        Returns calibrated confidence that better reflects true probability.
        """
        if len(self.prediction_history) < 100:
            return confidence  # Not enough data

        if self._calibration_map is None:
            self._build_calibration_map()

        # Find bucket
        bucket = min(int(confidence * 10), 9)
        return self._calibration_map.get(bucket, confidence)

    def _build_calibration_map(self) -> None:
        """Build calibration map from history."""
        self._calibration_map = {}

        # Group by confidence bucket
        buckets: dict[int, list[bool]] = {i: [] for i in range(10)}

        for conf, correct in self.prediction_history:
            bucket = min(int(conf * 10), 9)
            buckets[bucket].append(correct)

        # Calculate calibrated confidence for each bucket
        for bucket, results in buckets.items():
            if results:
                # Calibrated confidence = actual accuracy in this bucket
                self._calibration_map[bucket] = sum(results) / len(results)
            else:
                self._calibration_map[bucket] = bucket / 10.0

    def get_reliability_diagram(self) -> dict:
        """Get data for reliability diagram (calibration analysis)."""
        if self._calibration_map is None:
            self._build_calibration_map()

        # Group by bucket
        buckets: dict[int, list[tuple[float, bool]]] = {i: [] for i in range(10)}
        for conf, correct in self.prediction_history:
            bucket = min(int(conf * 10), 9)
            buckets[bucket].append((conf, correct))

        diagram = {}
        for bucket, data in buckets.items():
            if data:
                mean_conf = np.mean([d[0] for d in data])
                accuracy = sum(d[1] for d in data) / len(data)
                diagram[bucket] = {
                    "mean_confidence": mean_conf,
                    "accuracy": accuracy,
                    "count": len(data),
                    "gap": abs(mean_conf - accuracy),
                }

        return diagram


class ModelSelector:
    """
    Dynamically selects which models to use based on conditions.

    Based on paper principle: "Different LLM sizes for different
    task complexity levels."
    """

    def __init__(self):
        self.model_performance: dict[str, dict] = {}

    def register_model(
        self,
        name: str,
        latency_ms: float,
        accuracy: float,
        compute_cost: float,
    ) -> None:
        """Register a model with its performance characteristics."""
        self.model_performance[name] = {
            "latency_ms": latency_ms,
            "accuracy": accuracy,
            "compute_cost": compute_cost,
        }

    def select_models(
        self,
        max_latency_ms: float = 100,
        min_accuracy: float = 0.8,
        max_models: int = 3,
    ) -> list[str]:
        """
        Select best models for current constraints.

        Returns models sorted by efficiency (accuracy / cost).
        """
        candidates = []

        for name, perf in self.model_performance.items():
            if perf["latency_ms"] <= max_latency_ms and perf["accuracy"] >= min_accuracy:
                efficiency = perf["accuracy"] / perf["compute_cost"]
                candidates.append((name, efficiency))

        # Sort by efficiency
        candidates.sort(key=lambda x: x[1], reverse=True)

        return [name for name, _ in candidates[:max_models]]

    def get_ensemble_weights(self, models: list[str]) -> list[float]:
        """Calculate ensemble weights based on model accuracy."""
        if not models:
            return []

        accuracies = []
        for name in models:
            perf = self.model_performance.get(name, {})
            accuracies.append(perf.get("accuracy", 0.5))

        # Softmax-like weighting
        total = sum(accuracies)
        if total == 0:
            return [1.0 / len(models)] * len(models)

        return [a / total for a in accuracies]
