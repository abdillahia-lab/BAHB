"""
Validated Inference Pipeline - Based on "Solving a Million-Step LLM Task with Zero Errors"

Key principles implemented:
1. Progressive validation gates at each stage
2. Error correction/repair mechanisms
3. State management with checkpointing
4. Ensemble voting for improved accuracy
5. Structured output with schema enforcement
"""

from __future__ import annotations

import asyncio
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime
from typing import Callable, Optional

import numpy as np
from numpy.typing import NDArray
from loguru import logger

from bahb.core.config import Config
from bahb.core.types import (
    Anomaly,
    Detection,
    FrameData,
    GeoLocation,
    InspectionResult,
    Segmentation,
    SeverityLevel,
    ThermalReading,
)
from bahb.core.validation import (
    FrameValidator,
    DetectionValidator,
    SegmentationValidator,
    ThermalValidator,
    AnomalyValidator,
    VLMOutputValidator,
    InspectionResultValidator,
    ValidationGate,
    ValidationResult,
    ValidationStatus,
)
from bahb.core.correction import (
    CorrectionPipeline,
    DetectionCorrector,
    SegmentationCorrector,
    ThermalCorrector,
    AnomalyCorrector,
    VLMOutputCorrector,
)
from bahb.core.state import (
    PipelineState,
    PipelineStage,
    StateManager,
    StageOutput,
)
from bahb.core.ensemble import (
    DetectionEnsemble,
    AnomalyEnsemble,
    EnsembleConfig,
    VotingStrategy,
    ConfidenceCalibrator,
)
from bahb.models.yolov12 import YOLOv12Detector
from bahb.models.rf_detr import RFDETRSegmenter
from bahb.models.sam3 import SAM3NanoSegmenter
from bahb.models.qwen_vl import QwenVLAnalyzer


@dataclass
class ValidatedPipelineMetrics:
    """Extended metrics including validation stats."""
    total_frames: int = 0
    total_detections: int = 0
    total_anomalies: int = 0

    # Timing (ms)
    avg_yolo_time: float = 0.0
    avg_rfdetr_time: float = 0.0
    avg_sam3_time: float = 0.0
    avg_qwen_time: float = 0.0
    avg_validation_time: float = 0.0
    avg_correction_time: float = 0.0
    avg_total_time: float = 0.0

    # Validation stats
    validation_pass_rate: float = 1.0
    corrections_applied: int = 0

    # Throughput
    fps: float = 0.0


class ValidatedInferencePipeline:
    """
    Enhanced inference pipeline with validation, correction, and state management.

    Implements the architecture from "Solving a Million-Step LLM Task with Zero Errors":
    - Progressive validation gates at each stage
    - Automatic error correction
    - State checkpointing for recovery
    - Ensemble voting for detection confidence
    """

    def __init__(
        self,
        config: Config,
        enable_validation: bool = True,
        enable_correction: bool = True,
        enable_checkpointing: bool = False,
        enable_ensemble: bool = False,
        halt_on_validation_failure: bool = False,
    ):
        self.config = config
        self.models_config = config.models

        # Feature flags
        self.enable_validation = enable_validation
        self.enable_correction = enable_correction
        self.enable_checkpointing = enable_checkpointing
        self.enable_ensemble = enable_ensemble
        self.halt_on_failure = halt_on_validation_failure

        # Models
        self.yolo: Optional[YOLOv12Detector] = None
        self.rf_detr: Optional[RFDETRSegmenter] = None
        self.sam3: Optional[SAM3NanoSegmenter] = None
        self.qwen_vl: Optional[QwenVLAnalyzer] = None

        # Thread pool
        self._executor = ThreadPoolExecutor(max_workers=4)

        # Validation gates
        self._setup_validation_gates()

        # Correction pipeline
        self.corrector = CorrectionPipeline()

        # State manager
        self.state_manager = StateManager(
            enable_checkpointing=enable_checkpointing,
        )

        # Ensemble voters
        self.detection_ensemble = DetectionEnsemble(
            EnsembleConfig(
                strategy=VotingStrategy.WEIGHTED,
                min_votes=1,
                iou_threshold=0.5,
                score_threshold=0.3,
            )
        )
        self.anomaly_ensemble = AnomalyEnsemble()

        # Confidence calibrator
        self.calibrator = ConfidenceCalibrator()

        # Metrics
        self._metrics = ValidatedPipelineMetrics()
        self._timing_history: list[dict] = []
        self._fps_history: list[float] = []
        self._last_time = time.time()

        # Callbacks
        self._on_detection: Optional[Callable[[list[Detection]], None]] = None
        self._on_anomaly: Optional[Callable[[Anomaly], None]] = None
        self._on_result: Optional[Callable[[InspectionResult], None]] = None
        self._on_validation_failure: Optional[Callable[[str, ValidationResult], None]] = None

        # Configuration
        self.enable_tracking = True
        self.vlm_analysis_interval = 5
        self.vlm_on_anomaly = True
        self._frame_count = 0
        self._session_id = str(uuid.uuid4())[:8]

    def _setup_validation_gates(self) -> None:
        """Set up validation gates for each pipeline stage."""
        self.frame_gate = ValidationGate(
            name="frame",
            validator=FrameValidator(),
            halt_on_failure=self.halt_on_failure,
        )

        self.detection_gate = ValidationGate(
            name="detection",
            validator=DetectionValidator(),
            halt_on_failure=self.halt_on_failure,
        )

        self.segmentation_gate = ValidationGate(
            name="segmentation",
            validator=SegmentationValidator(),
            halt_on_failure=False,  # Segmentation is optional
        )

        self.thermal_gate = ValidationGate(
            name="thermal",
            validator=ThermalValidator(),
            halt_on_failure=False,  # Thermal is optional
        )

        self.anomaly_gate = ValidationGate(
            name="anomaly",
            validator=AnomalyValidator(),
            halt_on_failure=False,
        )

        self.vlm_gate = ValidationGate(
            name="vlm",
            validator=VLMOutputValidator(),
            halt_on_failure=False,
        )

        self.result_gate = ValidationGate(
            name="result",
            validator=InspectionResultValidator(),
            halt_on_failure=False,
        )

    async def initialize(self) -> bool:
        """Initialize all AI models."""
        logger.info("Initializing validated inference pipeline...")

        success = True
        load_tasks = []

        if self.models_config.yolov12.enabled:
            self.yolo = YOLOv12Detector(self.models_config.yolov12)
            load_tasks.append(("YOLOv12", self.yolo))

        if self.models_config.rf_detr.enabled:
            self.rf_detr = RFDETRSegmenter(self.models_config.rf_detr)
            load_tasks.append(("RF-DETR", self.rf_detr))

        if self.models_config.sam3_nano.enabled:
            self.sam3 = SAM3NanoSegmenter(self.models_config.sam3_nano)
            load_tasks.append(("SAM3-Nano", self.sam3))

        if self.models_config.qwen_vl.enabled:
            self.qwen_vl = QwenVLAnalyzer(self.models_config.qwen_vl)
            load_tasks.append(("Qwen-VL", self.qwen_vl))

        for name, model in load_tasks:
            try:
                logger.info(f"Loading {name}...")
                if model.load():
                    logger.info(f"{name} loaded successfully")
                else:
                    logger.warning(f"{name} failed to load")
                    success = False
            except Exception as e:
                logger.error(f"Error loading {name}: {e}")
                success = False

        if success:
            await self._warmup_models()

        logger.info(f"Pipeline initialization {'complete' if success else 'failed'}")
        return success

    async def _warmup_models(self) -> None:
        """Warmup all models."""
        warmup_tasks = []
        if self.yolo and self.yolo.is_loaded:
            warmup_tasks.append(self._warmup_model(self.yolo, "YOLOv12"))
        if self.rf_detr and self.rf_detr.is_loaded:
            warmup_tasks.append(self._warmup_model(self.rf_detr, "RF-DETR"))
        if self.sam3 and self.sam3.is_loaded:
            warmup_tasks.append(self._warmup_model(self.sam3, "SAM3"))
        await asyncio.gather(*warmup_tasks)

    async def _warmup_model(self, model, name: str) -> None:
        """Warmup a single model."""
        try:
            model.warmup()
        except Exception as e:
            logger.warning(f"{name} warmup failed: {e}")

    def set_callbacks(
        self,
        on_detection: Optional[Callable[[list[Detection]], None]] = None,
        on_anomaly: Optional[Callable[[Anomaly], None]] = None,
        on_result: Optional[Callable[[InspectionResult], None]] = None,
        on_validation_failure: Optional[Callable[[str, ValidationResult], None]] = None,
    ) -> None:
        """Set callback functions for pipeline events."""
        self._on_detection = on_detection
        self._on_anomaly = on_anomaly
        self._on_result = on_result
        self._on_validation_failure = on_validation_failure

    async def process_frame(
        self,
        frame_data: FrameData,
        thermal_data: Optional[ThermalReading] = None,
    ) -> InspectionResult:
        """
        Process a single frame through the validated pipeline.

        The pipeline follows these stages with validation gates:
        1. Input validation
        2. Detection with validation + correction
        3. Segmentation with validation + correction
        4. Anomaly detection with validation + correction
        5. VLM analysis with validation + correction
        6. Output validation
        """
        start_time = time.perf_counter()
        self._frame_count += 1

        # Create pipeline state
        state = self.state_manager.create_state(
            frame_id=frame_data.frame_id,
            session_id=self._session_id,
        )

        timing = {}
        validation_times = []
        correction_times = []

        # === STAGE 1: Input Validation ===
        val_start = time.perf_counter()

        if self.enable_validation:
            continue_pipeline, frame_result = self.frame_gate.check(frame_data)
            validation_times.append((time.perf_counter() - val_start) * 1000)

            if not continue_pipeline:
                logger.warning(f"Frame validation failed: {frame_result.errors}")
                if self._on_validation_failure:
                    self._on_validation_failure("frame", frame_result)
                return self._create_empty_result(frame_data)

        # Get primary image
        image = frame_data.wide_image or frame_data.zoom_image
        if image is None:
            logger.warning("No image available for processing")
            return self._create_empty_result(frame_data)

        h, w = image.shape[:2]

        # Update validators with actual image size
        self.detection_gate.validator = DetectionValidator(image_size=(w, h))
        self.segmentation_gate.validator = SegmentationValidator(image_size=(w, h))
        self.corrector = CorrectionPipeline(image_size=(w, h))

        # === STAGE 2: Detection with Validation ===
        detections = []
        if self.yolo and self.yolo.is_loaded:
            yolo_start = time.perf_counter()

            if self.enable_tracking:
                detections = self.yolo.detect_with_tracking(image)
            else:
                detections = self.yolo(image)

            timing["yolo"] = (time.perf_counter() - yolo_start) * 1000

            # Validate detections
            if self.enable_validation:
                val_start = time.perf_counter()
                continue_det, det_result = self.detection_gate.check(detections)
                validation_times.append((time.perf_counter() - val_start) * 1000)

                # Apply corrections if needed
                if self.enable_correction and det_result.requires_correction:
                    corr_start = time.perf_counter()
                    detections = self.corrector.correct_detections(detections, det_result)
                    correction_times.append((time.perf_counter() - corr_start) * 1000)

            # Ensemble voting (if multiple detection passes)
            if self.enable_ensemble:
                detections = self.detection_ensemble.vote([detections])

            # Calibrate confidence scores
            for det in detections:
                det.confidence = self.calibrator.calibrate(det.confidence)

            # Record state
            self.state_manager.update_state(
                state=state,
                stage=PipelineStage.DETECTION,
                data={"detections": [d.to_dict() for d in detections]},
                execution_time_ms=timing.get("yolo", 0),
                validation_passed=det_result.passed if self.enable_validation else True,
            )

            if self._on_detection and detections:
                self._on_detection(detections)

        # === STAGE 3: Segmentation with Validation ===
        segmentations = []
        if self.rf_detr and self.rf_detr.is_loaded and detections:
            rfdetr_start = time.perf_counter()

            important = self._filter_important_detections(detections)
            if important:
                _, segs = self.rf_detr(image)
                segmentations = segs

            timing["rf_detr"] = (time.perf_counter() - rfdetr_start) * 1000

            # Validate segmentations
            if self.enable_validation and segmentations:
                val_start = time.perf_counter()
                _, seg_result = self.segmentation_gate.check(segmentations)
                validation_times.append((time.perf_counter() - val_start) * 1000)

                if self.enable_correction and seg_result.requires_correction:
                    corr_start = time.perf_counter()
                    segmentations = self.corrector.correct_segmentations(segmentations, seg_result)
                    correction_times.append((time.perf_counter() - corr_start) * 1000)

            self.state_manager.update_state(
                state=state,
                stage=PipelineStage.SEGMENTATION,
                data={"count": len(segmentations)},
                execution_time_ms=timing.get("rf_detr", 0),
            )

        # === STAGE 4: Precision Masks (SAM3) ===
        if self.sam3 and self.sam3.is_loaded:
            sam_start = time.perf_counter()

            anomaly_candidates = self._find_anomaly_candidates(detections, thermal_data)
            if anomaly_candidates:
                self.sam3.set_image(image)
                for det in anomaly_candidates:
                    masks = self.sam3.segment_with_box(det.bbox)
                    if masks:
                        det.mask = masks[0].mask

            timing["sam3"] = (time.perf_counter() - sam_start) * 1000

        # === STAGE 5: Thermal Validation ===
        if thermal_data and self.enable_validation:
            val_start = time.perf_counter()
            _, thermal_result = self.thermal_gate.check(thermal_data)
            validation_times.append((time.perf_counter() - val_start) * 1000)

            if self.enable_correction and thermal_result.requires_correction:
                corr_start = time.perf_counter()
                thermal_data = self.corrector.correct_thermal(thermal_data, thermal_result)
                correction_times.append((time.perf_counter() - corr_start) * 1000)

        # === STAGE 6: Anomaly Detection with Validation ===
        anomalies = self._detect_anomalies(
            image, detections, segmentations, thermal_data, frame_data.location
        )

        if self.enable_validation and anomalies:
            val_start = time.perf_counter()
            _, anom_result = self.anomaly_gate.check(anomalies)
            validation_times.append((time.perf_counter() - val_start) * 1000)

            if self.enable_correction and anom_result.requires_correction:
                corr_start = time.perf_counter()
                anomalies = self.corrector.correct_anomalies(anomalies, anom_result)
                correction_times.append((time.perf_counter() - corr_start) * 1000)

        # Trigger anomaly callbacks
        for anomaly in anomalies:
            if self._on_anomaly:
                self._on_anomaly(anomaly)

        # === STAGE 7: VLM Analysis with Validation ===
        vlm_description = None
        vlm_recommendations = None

        should_analyze = (
            self._frame_count % self.vlm_analysis_interval == 0 or
            (self.vlm_on_anomaly and any(
                a.severity.value >= SeverityLevel.MEDIUM.value for a in anomalies
            ))
        )

        if self.qwen_vl and self.qwen_vl.is_loaded and should_analyze:
            vlm_start = time.perf_counter()

            # Determine prompt type
            prompt_type = self._get_prompt_type(detections, thermal_data)
            vlm_description = self.qwen_vl.analyze(image, prompt_type=prompt_type)

            timing["qwen_vl"] = (time.perf_counter() - vlm_start) * 1000

            # Validate VLM output
            if self.enable_validation and vlm_description:
                val_start = time.perf_counter()
                _, vlm_result = self.vlm_gate.check(vlm_description)
                validation_times.append((time.perf_counter() - val_start) * 1000)

                if self.enable_correction and vlm_result.requires_correction:
                    corr_start = time.perf_counter()
                    vlm_description = self.corrector.correct_vlm_output(
                        vlm_description, vlm_result, prompt_type
                    )
                    correction_times.append((time.perf_counter() - corr_start) * 1000)

            # Extract recommendations
            if anomalies:
                all_recommendations = []
                for anomaly in anomalies:
                    all_recommendations.extend(anomaly.recommendations)
                vlm_recommendations = list(set(all_recommendations))[:5]

        # === STAGE 8: Create and Validate Result ===
        total_time = (time.perf_counter() - start_time) * 1000

        result = InspectionResult(
            frame_id=frame_data.frame_id,
            timestamp=frame_data.timestamp,
            location=frame_data.location,
            detections=detections,
            segmentations=segmentations,
            thermal_reading=thermal_data,
            anomalies=anomalies,
            vlm_description=vlm_description,
            vlm_recommendations=vlm_recommendations,
            inference_time_ms=total_time,
        )

        # Final validation
        if self.enable_validation:
            val_start = time.perf_counter()
            passed, result_validation = self.result_gate.check(result)
            validation_times.append((time.perf_counter() - val_start) * 1000)

            if not passed and self._on_validation_failure:
                self._on_validation_failure("result", result_validation)

        # Update timing
        timing["validation"] = sum(validation_times)
        timing["correction"] = sum(correction_times)
        timing["total"] = total_time

        # Update metrics
        self._update_metrics(
            timing,
            len(detections),
            len(anomalies),
            sum(correction_times) > 0,
        )

        # Finalize state
        self.state_manager.update_state(
            state=state,
            stage=PipelineStage.OUTPUT,
            data=result.to_dict(),
            execution_time_ms=total_time,
        )
        self.state_manager.finalize_state(state)

        if self._on_result:
            self._on_result(result)

        return result

    def _create_empty_result(self, frame_data: FrameData) -> InspectionResult:
        """Create empty result for failed frames."""
        return InspectionResult(
            frame_id=frame_data.frame_id,
            timestamp=frame_data.timestamp,
            location=frame_data.location,
        )

    def _get_prompt_type(
        self,
        detections: list[Detection],
        thermal_data: Optional[ThermalReading],
    ) -> str:
        """Determine VLM prompt type based on context."""
        if thermal_data and len(thermal_data.hotspot_locations) > 0:
            return "thermal"
        elif any(d.class_name in ["transformer", "insulator", "switchgear"] for d in detections):
            return "substation"
        elif any(d.class_name in ["server_rack", "hvac_unit", "cooling_fan"] for d in detections):
            return "datacenter"
        return "general"

    def _filter_important_detections(
        self,
        detections: list[Detection],
        top_k: int = 10,
    ) -> list[Detection]:
        """Filter to most important detections."""
        priority_classes = {
            "transformer", "insulator", "switchgear", "damage",
            "hotspot", "corrosion", "leak", "crack",
        }

        priority = [d for d in detections if d.class_name in priority_classes]
        other = [d for d in detections if d.class_name not in priority_classes]

        priority.sort(key=lambda x: x.confidence, reverse=True)
        other.sort(key=lambda x: x.confidence, reverse=True)

        result = priority[:top_k]
        remaining = top_k - len(result)
        if remaining > 0:
            result.extend(other[:remaining])

        return result

    def _find_anomaly_candidates(
        self,
        detections: list[Detection],
        thermal: Optional[ThermalReading],
    ) -> list[Detection]:
        """Find detections that might be anomalies."""
        candidates = []

        defect_classes = {"damage", "corrosion", "hotspot", "leak", "crack", "contamination"}
        candidates.extend([d for d in detections if d.class_name in defect_classes])

        if thermal and thermal.hotspot_locations:
            equipment_classes = {"transformer", "insulator", "switchgear", "conductor"}
            for det in detections:
                if det.class_name in equipment_classes:
                    for hx, hy in thermal.hotspot_locations:
                        if (det.bbox.x1 <= hx <= det.bbox.x2 and
                            det.bbox.y1 <= hy <= det.bbox.y2):
                            candidates.append(det)
                            break

        return list(set(candidates))

    def _detect_anomalies(
        self,
        image: NDArray,
        detections: list[Detection],
        segmentations: list[Segmentation],
        thermal: Optional[ThermalReading],
        location: Optional[GeoLocation],
    ) -> list[Anomaly]:
        """Detect and classify anomalies."""
        anomalies = []
        defect_classes = {"damage", "corrosion", "hotspot", "leak", "crack", "contamination"}

        for det in detections:
            if det.class_name in defect_classes:
                description = f"{det.class_name.title()} detected with {det.confidence:.1%} confidence"
                recommendations = self._get_default_recommendations(det.class_name)

                if self.qwen_vl and self.qwen_vl.is_loaded:
                    try:
                        desc, recs = self.qwen_vl.generate_anomaly_description(
                            image, det, thermal
                        )
                        description = desc
                        recommendations = recs
                    except Exception as e:
                        logger.warning(f"VLM description failed: {e}")

                severity = self._assess_severity(det, thermal)

                anomaly = Anomaly(
                    id=str(uuid.uuid4())[:8],
                    type=det.class_name,
                    severity=severity,
                    description=description,
                    detection=det,
                    thermal=thermal,
                    location=location,
                    timestamp=datetime.now(),
                    recommendations=recommendations,
                )
                anomalies.append(anomaly)

        # Thermal-based anomalies
        if thermal:
            for hx, hy in thermal.hotspot_locations:
                is_covered = any(
                    a.detection.bbox.x1 <= hx <= a.detection.bbox.x2 and
                    a.detection.bbox.y1 <= hy <= a.detection.bbox.y2
                    for a in anomalies
                )

                if not is_covered:
                    nearest_det = None
                    min_dist = float("inf")

                    for det in detections:
                        cx, cy = det.bbox.center
                        dist = ((cx - hx) ** 2 + (cy - hy) ** 2) ** 0.5
                        if dist < min_dist:
                            min_dist = dist
                            nearest_det = det

                    if nearest_det and min_dist < 100:
                        severity = self._thermal_severity(thermal)

                        anomaly = Anomaly(
                            id=str(uuid.uuid4())[:8],
                            type="thermal_anomaly",
                            severity=severity,
                            description=f"Thermal hotspot detected near {nearest_det.class_name}. "
                                       f"Max temperature: {thermal.max_temp:.1f}°C",
                            detection=nearest_det,
                            thermal=thermal,
                            location=location,
                            timestamp=datetime.now(),
                            recommendations=[
                                "Verify temperature readings with handheld thermal camera",
                                "Check for loose connections or internal faults",
                                "Schedule maintenance based on temperature trend",
                            ],
                        )
                        anomalies.append(anomaly)

        return anomalies

    def _assess_severity(
        self,
        detection: Detection,
        thermal: Optional[ThermalReading],
    ) -> SeverityLevel:
        """Assess severity based on detection and thermal data."""
        base_severity = {
            "damage": SeverityLevel.HIGH,
            "crack": SeverityLevel.HIGH,
            "leak": SeverityLevel.HIGH,
            "corrosion": SeverityLevel.MEDIUM,
            "hotspot": SeverityLevel.MEDIUM,
            "contamination": SeverityLevel.LOW,
        }.get(detection.class_name, SeverityLevel.INFO)

        if thermal:
            thermal_severity = self._thermal_severity(thermal)
            if thermal_severity.value > base_severity.value:
                return thermal_severity

        if detection.confidence > 0.9 and base_severity.value < SeverityLevel.HIGH.value:
            return SeverityLevel(base_severity.value + 1)

        return base_severity

    def _thermal_severity(self, thermal: ThermalReading) -> SeverityLevel:
        """Assess severity from thermal data."""
        if thermal.max_temp > 100 or thermal.delta_t > 50:
            return SeverityLevel.CRITICAL
        elif thermal.max_temp > 80 or thermal.delta_t > 30:
            return SeverityLevel.HIGH
        elif thermal.max_temp > 60 or thermal.delta_t > 15:
            return SeverityLevel.MEDIUM
        elif thermal.max_temp > 45 or thermal.delta_t > 10:
            return SeverityLevel.LOW
        return SeverityLevel.INFO

    def _get_default_recommendations(self, defect_type: str) -> list[str]:
        """Get default recommendations for defect types."""
        recommendations = {
            "damage": [
                "Assess structural integrity",
                "Schedule immediate inspection",
                "Document with high-resolution imagery",
            ],
            "corrosion": [
                "Evaluate extent of corrosion",
                "Check for protective coating degradation",
                "Schedule cleaning and treatment",
            ],
            "hotspot": [
                "Verify with thermal imaging",
                "Check electrical connections",
                "Monitor temperature trend",
            ],
            "leak": [
                "Identify leak source",
                "Check for environmental contamination",
                "Schedule repair",
            ],
            "crack": [
                "Measure crack dimensions",
                "Assess structural impact",
                "Schedule repair or replacement",
            ],
            "contamination": [
                "Identify contamination source",
                "Schedule cleaning",
                "Implement preventive measures",
            ],
        }

        return recommendations.get(defect_type, [
            "Document finding",
            "Schedule follow-up inspection",
        ])

    def _update_metrics(
        self,
        timing: dict,
        num_detections: int,
        num_anomalies: int,
        had_corrections: bool,
    ) -> None:
        """Update pipeline metrics."""
        self._timing_history.append(timing)
        if len(self._timing_history) > 100:
            self._timing_history.pop(0)

        self._metrics.total_frames += 1
        self._metrics.total_detections += num_detections
        self._metrics.total_anomalies += num_anomalies

        if had_corrections:
            self._metrics.corrections_applied += 1

        if self._timing_history:
            self._metrics.avg_yolo_time = np.mean([t.get("yolo", 0) for t in self._timing_history])
            self._metrics.avg_rfdetr_time = np.mean([t.get("rf_detr", 0) for t in self._timing_history])
            self._metrics.avg_sam3_time = np.mean([t.get("sam3", 0) for t in self._timing_history])
            self._metrics.avg_qwen_time = np.mean([t.get("qwen_vl", 0) for t in self._timing_history])
            self._metrics.avg_validation_time = np.mean([t.get("validation", 0) for t in self._timing_history])
            self._metrics.avg_correction_time = np.mean([t.get("correction", 0) for t in self._timing_history])
            self._metrics.avg_total_time = np.mean([t.get("total", 0) for t in self._timing_history])

        # Calculate validation pass rate from gates
        gates = [
            self.frame_gate, self.detection_gate, self.segmentation_gate,
            self.thermal_gate, self.anomaly_gate, self.vlm_gate, self.result_gate,
        ]
        total_validations = sum(g.total_validations for g in gates)
        total_passed = sum(g.passed_count + g.corrected_count for g in gates)
        self._metrics.validation_pass_rate = total_passed / total_validations if total_validations > 0 else 1.0

        # Calculate FPS
        current_time = time.time()
        elapsed = current_time - self._last_time
        if elapsed > 0:
            instant_fps = 1.0 / elapsed
            self._fps_history.append(instant_fps)
            if len(self._fps_history) > 30:
                self._fps_history.pop(0)
            self._metrics.fps = np.mean(self._fps_history)
        self._last_time = current_time

    def get_metrics(self) -> ValidatedPipelineMetrics:
        """Get current pipeline metrics."""
        return self._metrics

    def get_validation_stats(self) -> dict:
        """Get detailed validation statistics."""
        return {
            "frame": self.frame_gate.get_stats(),
            "detection": self.detection_gate.get_stats(),
            "segmentation": self.segmentation_gate.get_stats(),
            "thermal": self.thermal_gate.get_stats(),
            "anomaly": self.anomaly_gate.get_stats(),
            "vlm": self.vlm_gate.get_stats(),
            "result": self.result_gate.get_stats(),
            "corrections": self.corrector.get_stats(),
        }

    def get_state_stats(self) -> dict:
        """Get state management statistics."""
        return self.state_manager.get_session_stats(self._session_id)

    async def shutdown(self) -> None:
        """Shutdown the pipeline and release resources."""
        logger.info("Shutting down validated inference pipeline...")

        if self.yolo:
            self.yolo.unload()
        if self.rf_detr:
            self.rf_detr.unload()
        if self.sam3:
            self.sam3.unload()
        if self.qwen_vl:
            self.qwen_vl.unload()

        self._executor.shutdown(wait=True)
        self.state_manager.cleanup(self._session_id)

        logger.info("Pipeline shutdown complete")
