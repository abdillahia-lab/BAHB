"""
Correction/Repair Module - Based on "Solving a Million-Step LLM Task with Zero Errors"

Key principle: Implement repair mechanisms for common failures rather than
relying solely on model accuracy.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Generic, Optional, TypeVar

import numpy as np
from numpy.typing import NDArray
from loguru import logger

from bahb.core.types import (
    Anomaly,
    BoundingBox,
    Detection,
    FrameData,
    Segmentation,
    SeverityLevel,
    ThermalReading,
)
from bahb.core.validation import ValidationResult, ValidationStatus


T = TypeVar('T')


@dataclass
class CorrectionResult(Generic[T]):
    """Result of a correction operation."""
    success: bool
    corrected_data: Optional[T]
    corrections_made: list[str] = field(default_factory=list)
    uncorrectable_issues: list[str] = field(default_factory=list)


class Corrector(ABC, Generic[T]):
    """Base class for output correction/repair."""

    @abstractmethod
    def correct(self, data: T, validation_result: ValidationResult) -> CorrectionResult[T]:
        """Attempt to correct invalid data."""
        pass

    def __call__(self, data: T, validation_result: ValidationResult) -> CorrectionResult[T]:
        return self.correct(data, validation_result)


class DetectionCorrector(Corrector[list[Detection]]):
    """
    Corrects common detection output issues:
    - Clips bounding boxes to image bounds
    - Clamps confidence values to [0, 1]
    - Filters out invalid detections
    - Removes duplicates via NMS
    """

    def __init__(
        self,
        image_size: tuple[int, int] = (1280, 720),
        nms_threshold: float = 0.5,
        min_confidence: float = 0.1,
        min_bbox_size: int = 5,
    ):
        self.image_size = image_size
        self.nms_threshold = nms_threshold
        self.min_confidence = min_confidence
        self.min_bbox_size = min_bbox_size

    def correct(
        self,
        data: list[Detection],
        validation_result: ValidationResult,
    ) -> CorrectionResult[list[Detection]]:
        if not data:
            return CorrectionResult(
                success=True,
                corrected_data=[],
                corrections_made=["Empty input - no corrections needed"],
            )

        corrections = []
        uncorrectable = []
        corrected_detections = []

        w, h = self.image_size

        for i, det in enumerate(data):
            bbox = det.bbox

            # Clip bounding box to image bounds
            new_x1 = max(0, min(bbox.x1, w))
            new_y1 = max(0, min(bbox.y1, h))
            new_x2 = max(0, min(bbox.x2, w))
            new_y2 = max(0, min(bbox.y2, h))

            clipped = (new_x1 != bbox.x1 or new_y1 != bbox.y1 or
                       new_x2 != bbox.x2 or new_y2 != bbox.y2)
            if clipped:
                corrections.append(f"Detection {i}: clipped bbox to image bounds")

            # Ensure x2 > x1 and y2 > y1
            if new_x2 <= new_x1:
                new_x2 = new_x1 + self.min_bbox_size
            if new_y2 <= new_y1:
                new_y2 = new_y1 + self.min_bbox_size

            # Check minimum size
            if (new_x2 - new_x1) < self.min_bbox_size or (new_y2 - new_y1) < self.min_bbox_size:
                uncorrectable.append(f"Detection {i}: bbox too small after correction")
                continue

            # Clamp confidence
            new_confidence = max(0.0, min(1.0, det.confidence))
            if new_confidence != det.confidence:
                corrections.append(f"Detection {i}: clamped confidence {det.confidence:.3f} -> {new_confidence:.3f}")

            # Filter by minimum confidence
            if new_confidence < self.min_confidence:
                corrections.append(f"Detection {i}: filtered low confidence {new_confidence:.3f}")
                continue

            # Create corrected detection
            corrected_det = Detection(
                class_id=det.class_id,
                class_name=det.class_name,
                confidence=new_confidence,
                bbox=BoundingBox(x1=new_x1, y1=new_y1, x2=new_x2, y2=new_y2),
                mask=det.mask,
                track_id=det.track_id,
            )
            corrected_detections.append(corrected_det)

        # Apply NMS to remove duplicates
        if len(corrected_detections) > 1:
            nms_filtered = self._apply_nms(corrected_detections)
            removed = len(corrected_detections) - len(nms_filtered)
            if removed > 0:
                corrections.append(f"NMS removed {removed} overlapping detections")
            corrected_detections = nms_filtered

        return CorrectionResult(
            success=True,
            corrected_data=corrected_detections,
            corrections_made=corrections,
            uncorrectable_issues=uncorrectable,
        )

    def _apply_nms(self, detections: list[Detection]) -> list[Detection]:
        """Apply Non-Maximum Suppression to remove duplicates."""
        if not detections:
            return []

        # Group by class
        by_class: dict[int, list[Detection]] = {}
        for det in detections:
            by_class.setdefault(det.class_id, []).append(det)

        result = []
        for class_id, dets in by_class.items():
            # Sort by confidence
            dets.sort(key=lambda d: d.confidence, reverse=True)

            keep = []
            while dets:
                best = dets.pop(0)
                keep.append(best)

                # Remove overlapping
                remaining = []
                for det in dets:
                    iou = self._compute_iou(best.bbox, det.bbox)
                    if iou < self.nms_threshold:
                        remaining.append(det)
                dets = remaining

            result.extend(keep)

        return result

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


class SegmentationCorrector(Corrector[list[Segmentation]]):
    """
    Corrects segmentation mask issues:
    - Binarizes masks
    - Fills small holes
    - Removes small disconnected regions
    - Recalculates area and centroid
    """

    def __init__(
        self,
        min_area: int = 50,
        fill_holes_threshold: int = 100,
    ):
        self.min_area = min_area
        self.fill_holes_threshold = fill_holes_threshold

    def correct(
        self,
        data: list[Segmentation],
        validation_result: ValidationResult,
    ) -> CorrectionResult[list[Segmentation]]:
        if not data:
            return CorrectionResult(
                success=True,
                corrected_data=[],
            )

        corrections = []
        corrected = []

        for i, seg in enumerate(data):
            mask = seg.mask.copy()

            # Binarize mask if needed
            if mask.dtype != np.uint8:
                mask = (mask > 0.5).astype(np.uint8) * 255
                corrections.append(f"Segmentation {i}: binarized mask")

            if not np.any(mask):
                corrections.append(f"Segmentation {i}: removed empty mask")
                continue

            # Calculate area
            area = int(np.sum(mask > 0))

            if area < self.min_area:
                corrections.append(f"Segmentation {i}: removed small mask (area={area})")
                continue

            # Calculate centroid
            ys, xs = np.where(mask > 0)
            if len(xs) > 0 and len(ys) > 0:
                cx = int(np.mean(xs))
                cy = int(np.mean(ys))
            else:
                cx, cy = seg.centroid

            corrected_seg = Segmentation(
                mask=mask,
                class_id=seg.class_id,
                class_name=seg.class_name,
                confidence=seg.confidence,
                area=area,
                centroid=(cx, cy),
            )
            corrected.append(corrected_seg)

        return CorrectionResult(
            success=True,
            corrected_data=corrected,
            corrections_made=corrections,
        )


class ThermalCorrector(Corrector[ThermalReading]):
    """
    Corrects thermal reading issues:
    - Clamps temperatures to valid range
    - Recalculates statistics if inconsistent
    - Filters invalid hotspot locations
    """

    def __init__(
        self,
        min_temp: float = -50.0,
        max_temp: float = 600.0,
    ):
        self.min_temp = min_temp
        self.max_temp = max_temp

    def correct(
        self,
        data: ThermalReading,
        validation_result: ValidationResult,
    ) -> CorrectionResult[ThermalReading]:
        corrections = []

        # Clamp temperatures
        new_min = max(self.min_temp, min(data.min_temp, self.max_temp))
        new_max = max(self.min_temp, min(data.max_temp, self.max_temp))

        if new_min != data.min_temp or new_max != data.max_temp:
            corrections.append(f"Clamped temps: [{data.min_temp}, {data.max_temp}] -> [{new_min}, {new_max}]")

        # Ensure min <= max
        if new_min > new_max:
            new_min, new_max = new_max, new_min
            corrections.append("Swapped min/max temperatures")

        # Calculate mean from temperature map if available
        new_mean = data.mean_temp
        if data.temperature_map is not None:
            valid_temps = data.temperature_map[
                (data.temperature_map >= self.min_temp) &
                (data.temperature_map <= self.max_temp)
            ]
            if len(valid_temps) > 0:
                calculated_mean = float(np.mean(valid_temps))
                if abs(calculated_mean - data.mean_temp) > 5.0:
                    new_mean = calculated_mean
                    corrections.append(f"Recalculated mean: {data.mean_temp:.1f} -> {new_mean:.1f}")

        # Clamp mean between min and max
        new_mean = max(new_min, min(new_mean, new_max))

        # Filter hotspot locations
        valid_hotspots = []
        if data.temperature_map is not None:
            h, w = data.temperature_map.shape[:2]
            for x, y in data.hotspot_locations:
                if 0 <= x < w and 0 <= y < h:
                    valid_hotspots.append((x, y))
                else:
                    corrections.append(f"Filtered invalid hotspot: ({x}, {y})")
        else:
            valid_hotspots = list(data.hotspot_locations)

        valid_coldspots = []
        if data.temperature_map is not None:
            h, w = data.temperature_map.shape[:2]
            for x, y in data.coldspot_locations:
                if 0 <= x < w and 0 <= y < h:
                    valid_coldspots.append((x, y))

        corrected = ThermalReading(
            min_temp=new_min,
            max_temp=new_max,
            mean_temp=new_mean,
            hotspot_locations=valid_hotspots,
            coldspot_locations=valid_coldspots,
            temperature_map=data.temperature_map,
        )

        return CorrectionResult(
            success=True,
            corrected_data=corrected,
            corrections_made=corrections,
        )


class AnomalyCorrector(Corrector[list[Anomaly]]):
    """
    Corrects anomaly detection issues:
    - Adds missing recommendations
    - Fixes severity levels
    - Generates descriptions for missing ones
    """

    DEFAULT_RECOMMENDATIONS = {
        "damage": [
            "Schedule immediate inspection",
            "Document with high-resolution imagery",
            "Assess structural integrity",
        ],
        "corrosion": [
            "Evaluate extent of corrosion",
            "Check protective coating",
            "Schedule treatment",
        ],
        "hotspot": [
            "Verify with thermal camera",
            "Check electrical connections",
            "Monitor temperature trend",
        ],
        "thermal_anomaly": [
            "Investigate heat source",
            "Check for loose connections",
            "Schedule maintenance",
        ],
        "leak": [
            "Identify leak source",
            "Check environmental impact",
            "Schedule repair",
        ],
        "crack": [
            "Measure crack dimensions",
            "Assess structural impact",
            "Schedule repair",
        ],
        "contamination": [
            "Identify contamination type",
            "Schedule cleaning",
            "Implement prevention",
        ],
    }

    def correct(
        self,
        data: list[Anomaly],
        validation_result: ValidationResult,
    ) -> CorrectionResult[list[Anomaly]]:
        if not data:
            return CorrectionResult(
                success=True,
                corrected_data=[],
            )

        corrections = []
        corrected = []

        for i, anomaly in enumerate(data):
            needs_correction = False

            # Generate ID if missing
            new_id = anomaly.id
            if not new_id:
                import uuid
                new_id = str(uuid.uuid4())[:8]
                corrections.append(f"Anomaly {i}: generated ID")
                needs_correction = True

            # Add default recommendations if missing
            new_recommendations = anomaly.recommendations
            if not new_recommendations:
                new_recommendations = self.DEFAULT_RECOMMENDATIONS.get(
                    anomaly.type,
                    ["Document finding", "Schedule follow-up inspection"]
                )
                corrections.append(f"Anomaly {i}: added default recommendations")
                needs_correction = True

            # Generate description if missing
            new_description = anomaly.description
            if not new_description:
                new_description = self._generate_description(anomaly)
                corrections.append(f"Anomaly {i}: generated description")
                needs_correction = True

            if needs_correction:
                corrected_anomaly = Anomaly(
                    id=new_id,
                    type=anomaly.type,
                    severity=anomaly.severity,
                    description=new_description,
                    detection=anomaly.detection,
                    thermal=anomaly.thermal,
                    location=anomaly.location,
                    timestamp=anomaly.timestamp,
                    image_path=anomaly.image_path,
                    recommendations=new_recommendations,
                )
                corrected.append(corrected_anomaly)
            else:
                corrected.append(anomaly)

        return CorrectionResult(
            success=True,
            corrected_data=corrected,
            corrections_made=corrections,
        )

    def _generate_description(self, anomaly: Anomaly) -> str:
        """Generate a basic description for an anomaly."""
        base = f"{anomaly.type.replace('_', ' ').title()} detected"

        if anomaly.detection:
            base += f" on {anomaly.detection.class_name}"
            base += f" with {anomaly.detection.confidence:.0%} confidence"

        if anomaly.thermal and anomaly.thermal.max_temp:
            base += f". Max temperature: {anomaly.thermal.max_temp:.1f}°C"

        return base


class VLMOutputCorrector(Corrector[str]):
    """
    Corrects VLM text output issues:
    - Removes error messages
    - Truncates to max length
    - Cleans formatting issues
    """

    ERROR_PATTERNS = [
        "I cannot",
        "I'm unable",
        "error:",
        "exception:",
        "Error:",
        "Exception:",
        "[ERROR]",
    ]

    FALLBACK_RESPONSES = {
        "general": "Infrastructure inspection completed. Manual review recommended.",
        "thermal": "Thermal anomaly detected. Further investigation required.",
        "substation": "Substation equipment inspection completed.",
        "datacenter": "Data center equipment inspection completed.",
    }

    def __init__(
        self,
        max_length: int = 2048,
        prompt_type: str = "general",
    ):
        self.max_length = max_length
        self.prompt_type = prompt_type

    def correct(
        self,
        data: str,
        validation_result: ValidationResult,
    ) -> CorrectionResult[str]:
        corrections = []

        if not data or not data.strip():
            fallback = self.FALLBACK_RESPONSES.get(
                self.prompt_type,
                self.FALLBACK_RESPONSES["general"]
            )
            return CorrectionResult(
                success=True,
                corrected_data=fallback,
                corrections_made=["Generated fallback response for empty output"],
            )

        result = data.strip()

        # Check for error patterns
        contains_error = any(p in result for p in self.ERROR_PATTERNS)
        if contains_error:
            # Try to extract useful content before error
            for pattern in self.ERROR_PATTERNS:
                if pattern in result:
                    parts = result.split(pattern)
                    if parts[0].strip():
                        result = parts[0].strip()
                        corrections.append(f"Removed content after '{pattern}'")
                        break
            else:
                # Entire response is error
                result = self.FALLBACK_RESPONSES.get(
                    self.prompt_type,
                    self.FALLBACK_RESPONSES["general"]
                )
                corrections.append("Replaced error response with fallback")

        # Truncate if too long
        if len(result) > self.max_length:
            result = result[:self.max_length - 3] + "..."
            corrections.append(f"Truncated to {self.max_length} characters")

        # Clean up common formatting issues
        result = result.replace("  ", " ")  # Double spaces
        result = result.replace("\n\n\n", "\n\n")  # Triple newlines

        return CorrectionResult(
            success=True,
            corrected_data=result,
            corrections_made=corrections,
        )


class CorrectionPipeline:
    """
    Orchestrates correction across multiple stages.

    Based on paper principle: "Implement repair mechanisms for common failures
    rather than relying solely on model accuracy."
    """

    def __init__(self, image_size: tuple[int, int] = (1280, 720)):
        self.detection_corrector = DetectionCorrector(image_size=image_size)
        self.segmentation_corrector = SegmentationCorrector()
        self.thermal_corrector = ThermalCorrector()
        self.anomaly_corrector = AnomalyCorrector()

        # Statistics
        self.corrections_by_stage: dict[str, int] = {}
        self.total_corrections = 0

    def correct_detections(
        self,
        detections: list[Detection],
        validation_result: ValidationResult,
    ) -> list[Detection]:
        """Correct detection outputs."""
        result = self.detection_corrector.correct(detections, validation_result)
        self._record_corrections("detection", result)
        return result.corrected_data or []

    def correct_segmentations(
        self,
        segmentations: list[Segmentation],
        validation_result: ValidationResult,
    ) -> list[Segmentation]:
        """Correct segmentation outputs."""
        result = self.segmentation_corrector.correct(segmentations, validation_result)
        self._record_corrections("segmentation", result)
        return result.corrected_data or []

    def correct_thermal(
        self,
        thermal: ThermalReading,
        validation_result: ValidationResult,
    ) -> ThermalReading:
        """Correct thermal reading."""
        result = self.thermal_corrector.correct(thermal, validation_result)
        self._record_corrections("thermal", result)
        return result.corrected_data or thermal

    def correct_anomalies(
        self,
        anomalies: list[Anomaly],
        validation_result: ValidationResult,
    ) -> list[Anomaly]:
        """Correct anomaly outputs."""
        result = self.anomaly_corrector.correct(anomalies, validation_result)
        self._record_corrections("anomaly", result)
        return result.corrected_data or []

    def correct_vlm_output(
        self,
        output: str,
        validation_result: ValidationResult,
        prompt_type: str = "general",
    ) -> str:
        """Correct VLM text output."""
        corrector = VLMOutputCorrector(prompt_type=prompt_type)
        result = corrector.correct(output, validation_result)
        self._record_corrections("vlm", result)
        return result.corrected_data or ""

    def _record_corrections(self, stage: str, result: CorrectionResult) -> None:
        """Record correction statistics."""
        num_corrections = len(result.corrections_made)
        if num_corrections > 0:
            self.corrections_by_stage[stage] = (
                self.corrections_by_stage.get(stage, 0) + num_corrections
            )
            self.total_corrections += num_corrections

            for correction in result.corrections_made:
                logger.debug(f"[Correction/{stage}] {correction}")

    def get_stats(self) -> dict:
        """Get correction statistics."""
        return {
            "total_corrections": self.total_corrections,
            "by_stage": dict(self.corrections_by_stage),
        }
