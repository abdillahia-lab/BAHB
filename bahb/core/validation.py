"""
Validation Layer - Based on "Solving a Million-Step LLM Task with Zero Errors"

Key principle: Create intermediate verification points at each stage
rather than validating only at completion.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from typing import Any, Generic, Optional, TypeVar

import numpy as np
from numpy.typing import NDArray
from loguru import logger

from bahb.core.types import (
    Anomaly,
    BoundingBox,
    Detection,
    FrameData,
    InspectionResult,
    Segmentation,
    SeverityLevel,
    ThermalReading,
)


class ValidationStatus(Enum):
    """Validation result status."""
    PASSED = auto()
    FAILED = auto()
    CORRECTED = auto()  # Failed but auto-corrected
    SKIPPED = auto()    # Validation skipped (e.g., empty input)


@dataclass
class ValidationResult:
    """Result of a validation check."""
    status: ValidationStatus
    message: str
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    corrections_applied: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def passed(self) -> bool:
        return self.status in (ValidationStatus.PASSED, ValidationStatus.CORRECTED)

    @property
    def requires_correction(self) -> bool:
        return self.status == ValidationStatus.FAILED and len(self.errors) > 0


T = TypeVar('T')


class Validator(ABC, Generic[T]):
    """Base validator class for pipeline stage outputs."""

    @abstractmethod
    def validate(self, data: T) -> ValidationResult:
        """Validate the data and return result."""
        pass

    def __call__(self, data: T) -> ValidationResult:
        return self.validate(data)


class FrameValidator(Validator[FrameData]):
    """Validates input frame data before pipeline processing."""

    def __init__(
        self,
        min_resolution: tuple[int, int] = (320, 240),
        max_resolution: tuple[int, int] = (8192, 8192),
        require_image: bool = True,
    ):
        self.min_resolution = min_resolution
        self.max_resolution = max_resolution
        self.require_image = require_image

    def validate(self, data: FrameData) -> ValidationResult:
        errors = []
        warnings = []

        # Check if any image is available
        images = [data.wide_image, data.zoom_image, data.thermal_image]
        available_images = [img for img in images if img is not None]

        if not available_images and self.require_image:
            errors.append("No image available for processing")
            return ValidationResult(
                status=ValidationStatus.FAILED,
                message="Frame validation failed: no image",
                errors=errors,
            )

        # Validate each available image
        for img_name, img in [("wide", data.wide_image),
                               ("zoom", data.zoom_image),
                               ("thermal", data.thermal_image)]:
            if img is None:
                continue

            # Check dimensions
            if len(img.shape) < 2:
                errors.append(f"{img_name} image has invalid shape: {img.shape}")
                continue

            h, w = img.shape[:2]

            if h < self.min_resolution[1] or w < self.min_resolution[0]:
                warnings.append(f"{img_name} image below minimum resolution: {w}x{h}")

            if h > self.max_resolution[1] or w > self.max_resolution[0]:
                warnings.append(f"{img_name} image exceeds maximum resolution: {w}x{h}")

            # Check data type
            if img.dtype != np.uint8:
                warnings.append(f"{img_name} image has unexpected dtype: {img.dtype}")

            # Check for corrupted/empty images
            if np.all(img == 0):
                warnings.append(f"{img_name} image appears to be all black/empty")
            elif np.all(img == 255):
                warnings.append(f"{img_name} image appears to be all white/saturated")

        # Validate thermal data consistency
        if data.thermal_raw is not None:
            if data.thermal_image is not None:
                thermal_h, thermal_w = data.thermal_image.shape[:2]
                raw_h, raw_w = data.thermal_raw.shape[:2]
                if (thermal_h, thermal_w) != (raw_h, raw_w):
                    warnings.append(
                        f"Thermal image ({thermal_w}x{thermal_h}) and raw "
                        f"({raw_w}x{raw_h}) dimension mismatch"
                    )

        if errors:
            return ValidationResult(
                status=ValidationStatus.FAILED,
                message=f"Frame validation failed with {len(errors)} errors",
                errors=errors,
                warnings=warnings,
            )

        return ValidationResult(
            status=ValidationStatus.PASSED,
            message="Frame validation passed",
            warnings=warnings,
            metadata={"image_count": len(available_images)},
        )


class DetectionValidator(Validator[list[Detection]]):
    """
    Validates detection outputs from YOLO.

    Checks:
    - Bounding box validity (within image bounds, positive dimensions)
    - Confidence score validity (0-1 range)
    - Class ID validity
    - Detection count sanity
    """

    def __init__(
        self,
        image_size: tuple[int, int] = (1280, 720),
        max_detections: int = 500,
        min_confidence: float = 0.01,
        valid_class_ids: Optional[set[int]] = None,
    ):
        self.image_size = image_size
        self.max_detections = max_detections
        self.min_confidence = min_confidence
        self.valid_class_ids = valid_class_ids

    def validate(self, data: list[Detection]) -> ValidationResult:
        if not data:
            return ValidationResult(
                status=ValidationStatus.SKIPPED,
                message="No detections to validate",
            )

        errors = []
        warnings = []
        invalid_detections = []

        w, h = self.image_size

        for i, det in enumerate(data):
            det_errors = []

            # Validate bounding box
            bbox = det.bbox
            if bbox.x1 < 0 or bbox.y1 < 0:
                det_errors.append(f"Negative bbox coordinates: ({bbox.x1}, {bbox.y1})")
            if bbox.x2 > w or bbox.y2 > h:
                det_errors.append(f"Bbox exceeds image bounds: ({bbox.x2}, {bbox.y2})")
            if bbox.width <= 0 or bbox.height <= 0:
                det_errors.append(f"Invalid bbox dimensions: {bbox.width}x{bbox.height}")

            # Validate confidence
            if det.confidence < 0 or det.confidence > 1:
                det_errors.append(f"Invalid confidence: {det.confidence}")
            elif det.confidence < self.min_confidence:
                warnings.append(f"Detection {i} below min confidence: {det.confidence}")

            # Validate class ID
            if self.valid_class_ids and det.class_id not in self.valid_class_ids:
                det_errors.append(f"Invalid class ID: {det.class_id}")

            if det_errors:
                invalid_detections.append((i, det_errors))

        # Check detection count
        if len(data) > self.max_detections:
            warnings.append(f"High detection count: {len(data)} (max: {self.max_detections})")

        if invalid_detections:
            for idx, errs in invalid_detections[:5]:  # Report first 5
                errors.extend([f"Detection {idx}: {e}" for e in errs])
            if len(invalid_detections) > 5:
                errors.append(f"... and {len(invalid_detections) - 5} more invalid detections")

            return ValidationResult(
                status=ValidationStatus.FAILED,
                message=f"{len(invalid_detections)} invalid detections",
                errors=errors,
                warnings=warnings,
                metadata={"invalid_count": len(invalid_detections)},
            )

        return ValidationResult(
            status=ValidationStatus.PASSED,
            message=f"Validated {len(data)} detections",
            warnings=warnings,
            metadata={"detection_count": len(data)},
        )


class SegmentationValidator(Validator[list[Segmentation]]):
    """Validates segmentation outputs from RF-DETR and SAM3."""

    def __init__(
        self,
        image_size: tuple[int, int] = (1280, 720),
        min_mask_area: int = 10,
        max_mask_ratio: float = 0.95,
    ):
        self.image_size = image_size
        self.min_mask_area = min_mask_area
        self.max_mask_ratio = max_mask_ratio

    def validate(self, data: list[Segmentation]) -> ValidationResult:
        if not data:
            return ValidationResult(
                status=ValidationStatus.SKIPPED,
                message="No segmentations to validate",
            )

        errors = []
        warnings = []

        w, h = self.image_size
        image_area = w * h

        for i, seg in enumerate(data):
            # Validate mask dimensions
            if seg.mask.shape[:2] != (h, w):
                warnings.append(
                    f"Segmentation {i} mask size {seg.mask.shape[:2]} != image {(h, w)}"
                )

            # Validate mask values
            unique_vals = np.unique(seg.mask)
            if not np.all((unique_vals == 0) | (unique_vals == 1) | (unique_vals == 255)):
                warnings.append(f"Segmentation {i} has unexpected mask values")

            # Validate area
            if seg.area < self.min_mask_area:
                warnings.append(f"Segmentation {i} area too small: {seg.area}")

            if seg.area > image_area * self.max_mask_ratio:
                warnings.append(f"Segmentation {i} covers too much of image: {seg.area/image_area:.1%}")

            # Validate centroid
            cx, cy = seg.centroid
            if cx < 0 or cx > w or cy < 0 or cy > h:
                errors.append(f"Segmentation {i} centroid outside image: ({cx}, {cy})")

        if errors:
            return ValidationResult(
                status=ValidationStatus.FAILED,
                message=f"Segmentation validation failed with {len(errors)} errors",
                errors=errors,
                warnings=warnings,
            )

        return ValidationResult(
            status=ValidationStatus.PASSED,
            message=f"Validated {len(data)} segmentations",
            warnings=warnings,
        )


class ThermalValidator(Validator[ThermalReading]):
    """Validates thermal analysis outputs."""

    def __init__(
        self,
        min_temp: float = -50.0,  # Absolute minimum expected
        max_temp: float = 600.0,  # Absolute maximum expected
        max_delta_t: float = 300.0,
    ):
        self.min_temp = min_temp
        self.max_temp = max_temp
        self.max_delta_t = max_delta_t

    def validate(self, data: ThermalReading) -> ValidationResult:
        errors = []
        warnings = []

        # Validate temperature ranges
        if data.min_temp < self.min_temp:
            errors.append(f"Min temp below absolute minimum: {data.min_temp}°C")
        if data.max_temp > self.max_temp:
            errors.append(f"Max temp above absolute maximum: {data.max_temp}°C")
        if data.min_temp > data.max_temp:
            errors.append(f"Min temp > max temp: {data.min_temp} > {data.max_temp}")

        # Validate delta_t
        if data.delta_t > self.max_delta_t:
            warnings.append(f"Extreme temperature differential: {data.delta_t}°C")
        if data.delta_t < 0:
            errors.append(f"Negative delta_t: {data.delta_t}")

        # Validate mean is between min and max
        if not (data.min_temp <= data.mean_temp <= data.max_temp):
            errors.append(
                f"Mean temp {data.mean_temp} outside min-max range "
                f"[{data.min_temp}, {data.max_temp}]"
            )

        # Validate temperature map
        if data.temperature_map is not None:
            map_min = float(np.min(data.temperature_map))
            map_max = float(np.max(data.temperature_map))

            if abs(map_min - data.min_temp) > 1.0:
                warnings.append(f"Temp map min {map_min} != reported min {data.min_temp}")
            if abs(map_max - data.max_temp) > 1.0:
                warnings.append(f"Temp map max {map_max} != reported max {data.max_temp}")

        if errors:
            return ValidationResult(
                status=ValidationStatus.FAILED,
                message=f"Thermal validation failed",
                errors=errors,
                warnings=warnings,
            )

        return ValidationResult(
            status=ValidationStatus.PASSED,
            message="Thermal validation passed",
            warnings=warnings,
            metadata={
                "temp_range": f"{data.min_temp:.1f}°C - {data.max_temp:.1f}°C",
                "hotspots": len(data.hotspot_locations),
            },
        )


class AnomalyValidator(Validator[list[Anomaly]]):
    """Validates anomaly detection outputs."""

    def validate(self, data: list[Anomaly]) -> ValidationResult:
        if not data:
            return ValidationResult(
                status=ValidationStatus.SKIPPED,
                message="No anomalies to validate",
            )

        errors = []
        warnings = []

        for i, anomaly in enumerate(data):
            # Validate required fields
            if not anomaly.id:
                errors.append(f"Anomaly {i} missing ID")
            if not anomaly.type:
                errors.append(f"Anomaly {i} missing type")
            if not anomaly.description:
                warnings.append(f"Anomaly {i} missing description")

            # Validate severity
            if not isinstance(anomaly.severity, SeverityLevel):
                errors.append(f"Anomaly {i} has invalid severity: {anomaly.severity}")

            # Validate detection reference
            if anomaly.detection is None:
                warnings.append(f"Anomaly {i} missing detection reference")

            # Validate recommendations
            if not anomaly.recommendations:
                warnings.append(f"Anomaly {i} has no recommendations")

        if errors:
            return ValidationResult(
                status=ValidationStatus.FAILED,
                message=f"Anomaly validation failed",
                errors=errors,
                warnings=warnings,
            )

        return ValidationResult(
            status=ValidationStatus.PASSED,
            message=f"Validated {len(data)} anomalies",
            warnings=warnings,
            metadata={
                "anomaly_count": len(data),
                "severities": {s.name: sum(1 for a in data if a.severity == s)
                              for s in SeverityLevel},
            },
        )


class VLMOutputValidator(Validator[str]):
    """Validates VLM text outputs."""

    def __init__(
        self,
        min_length: int = 10,
        max_length: int = 4096,
        required_patterns: Optional[list[str]] = None,
        forbidden_patterns: Optional[list[str]] = None,
    ):
        self.min_length = min_length
        self.max_length = max_length
        self.required_patterns = required_patterns or []
        self.forbidden_patterns = forbidden_patterns or [
            "I cannot", "I'm unable", "error:", "exception:",
        ]

    def validate(self, data: str) -> ValidationResult:
        if not data:
            return ValidationResult(
                status=ValidationStatus.FAILED,
                message="Empty VLM output",
                errors=["VLM returned empty string"],
            )

        errors = []
        warnings = []

        # Length check
        if len(data) < self.min_length:
            errors.append(f"VLM output too short: {len(data)} chars")
        if len(data) > self.max_length:
            warnings.append(f"VLM output truncated: {len(data)} chars")

        # Check for error patterns
        data_lower = data.lower()
        for pattern in self.forbidden_patterns:
            if pattern.lower() in data_lower:
                errors.append(f"VLM output contains error pattern: '{pattern}'")

        # Check for required patterns
        for pattern in self.required_patterns:
            if pattern.lower() not in data_lower:
                warnings.append(f"VLM output missing expected pattern: '{pattern}'")

        if errors:
            return ValidationResult(
                status=ValidationStatus.FAILED,
                message="VLM output validation failed",
                errors=errors,
                warnings=warnings,
            )

        return ValidationResult(
            status=ValidationStatus.PASSED,
            message="VLM output validation passed",
            warnings=warnings,
            metadata={"length": len(data)},
        )


class InspectionResultValidator(Validator[InspectionResult]):
    """Validates complete inspection result before output."""

    def __init__(self, image_size: tuple[int, int] = (1280, 720)):
        self.detection_validator = DetectionValidator(image_size=image_size)
        self.segmentation_validator = SegmentationValidator(image_size=image_size)
        self.anomaly_validator = AnomalyValidator()

    def validate(self, data: InspectionResult) -> ValidationResult:
        all_errors = []
        all_warnings = []

        # Validate detections
        det_result = self.detection_validator.validate(data.detections)
        if not det_result.passed:
            all_errors.extend([f"Detection: {e}" for e in det_result.errors])
        all_warnings.extend([f"Detection: {w}" for w in det_result.warnings])

        # Validate segmentations
        seg_result = self.segmentation_validator.validate(data.segmentations)
        if not seg_result.passed:
            all_errors.extend([f"Segmentation: {e}" for e in seg_result.errors])
        all_warnings.extend([f"Segmentation: {w}" for w in seg_result.warnings])

        # Validate anomalies
        anom_result = self.anomaly_validator.validate(data.anomalies)
        if not anom_result.passed:
            all_errors.extend([f"Anomaly: {e}" for e in anom_result.errors])
        all_warnings.extend([f"Anomaly: {w}" for w in anom_result.warnings])

        # Validate thermal if present
        if data.thermal_reading:
            thermal_validator = ThermalValidator()
            thermal_result = thermal_validator.validate(data.thermal_reading)
            if not thermal_result.passed:
                all_errors.extend([f"Thermal: {e}" for e in thermal_result.errors])
            all_warnings.extend([f"Thermal: {w}" for w in thermal_result.warnings])

        # Validate VLM output if present
        if data.vlm_description:
            vlm_validator = VLMOutputValidator()
            vlm_result = vlm_validator.validate(data.vlm_description)
            if not vlm_result.passed:
                all_errors.extend([f"VLM: {e}" for e in vlm_result.errors])
            all_warnings.extend([f"VLM: {w}" for w in vlm_result.warnings])

        # Cross-validation: anomalies should have corresponding detections
        detection_ids = {d.class_id for d in data.detections}
        for anomaly in data.anomalies:
            if anomaly.detection and anomaly.detection.class_id not in detection_ids:
                all_warnings.append(
                    f"Anomaly '{anomaly.id}' references detection not in result"
                )

        if all_errors:
            return ValidationResult(
                status=ValidationStatus.FAILED,
                message=f"Inspection result validation failed with {len(all_errors)} errors",
                errors=all_errors,
                warnings=all_warnings,
            )

        return ValidationResult(
            status=ValidationStatus.PASSED,
            message="Inspection result validation passed",
            warnings=all_warnings,
            metadata={
                "detections": len(data.detections),
                "anomalies": len(data.anomalies),
                "max_severity": data.max_severity.name,
            },
        )


class ValidationGate:
    """
    Progressive validation gate that can halt pipeline execution.

    Based on paper principle: "Create intermediate verification points
    at each step rather than validating only at completion."
    """

    def __init__(
        self,
        name: str,
        validator: Validator,
        halt_on_failure: bool = False,
        log_warnings: bool = True,
    ):
        self.name = name
        self.validator = validator
        self.halt_on_failure = halt_on_failure
        self.log_warnings = log_warnings

        # Statistics
        self.total_validations = 0
        self.passed_count = 0
        self.failed_count = 0
        self.corrected_count = 0

    def check(self, data: Any) -> tuple[bool, ValidationResult]:
        """
        Check data against validator.

        Returns:
            Tuple of (should_continue, validation_result)
        """
        self.total_validations += 1

        result = self.validator.validate(data)

        if result.status == ValidationStatus.PASSED:
            self.passed_count += 1
        elif result.status == ValidationStatus.CORRECTED:
            self.corrected_count += 1
            logger.info(f"[{self.name}] Corrections applied: {result.corrections_applied}")
        elif result.status == ValidationStatus.FAILED:
            self.failed_count += 1
            logger.warning(f"[{self.name}] Validation failed: {result.errors}")

        if self.log_warnings and result.warnings:
            logger.debug(f"[{self.name}] Warnings: {result.warnings}")

        should_continue = result.passed or not self.halt_on_failure
        return should_continue, result

    @property
    def pass_rate(self) -> float:
        if self.total_validations == 0:
            return 1.0
        return (self.passed_count + self.corrected_count) / self.total_validations

    def get_stats(self) -> dict:
        return {
            "name": self.name,
            "total": self.total_validations,
            "passed": self.passed_count,
            "failed": self.failed_count,
            "corrected": self.corrected_count,
            "pass_rate": f"{self.pass_rate:.1%}",
        }
