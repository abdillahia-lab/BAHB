"""
Core infrastructure modules.

Architecture based on research papers:
- "Solving a Million-Step LLM Task with Zero Errors": Validation, correction, state, ensemble
- arXiv:2405.14458 (YOLOv10): NMS-free inference
- arXiv:2502.15737: INT8 quantization for Orin NX
- arXiv:2501.15014: Edge AI acceleration techniques
- arXiv:2502.07855: VLM compression for edge
- arXiv:2511.19495: Optimal compression ordering
"""

from bahb.core.config import Config
from bahb.core.engine import InspectionEngine
from bahb.core.types import (
    Detection,
    Segmentation,
    ThermalReading,
    InspectionResult,
    Anomaly,
    GeoLocation,
)

# New architecture components
from bahb.core.validation import (
    ValidationResult,
    ValidationStatus,
    ValidationGate,
    FrameValidator,
    DetectionValidator,
    SegmentationValidator,
    ThermalValidator,
    AnomalyValidator,
    VLMOutputValidator,
    InspectionResultValidator,
)

from bahb.core.correction import (
    CorrectionResult,
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
    StateCheckpoint,
)

from bahb.core.ensemble import (
    DetectionEnsemble,
    AnomalyEnsemble,
    EnsembleConfig,
    VotingStrategy,
    ConfidenceCalibrator,
)

from bahb.core.edge_optimization import (
    EdgeOptimizer,
    QuantizationLevel,
    CompressionStage,
    MemoryBudget,
    InferenceMetrics,
    NMSFreeConfig,
    INT8CalibrationConfig,
    StreamOverlapConfig,
    BufferPoolConfig,
    AdaptiveVLMConfig,
    TensorRTOptimizer,
    get_optimizer,
    initialize_optimizer,
)

__all__ = [
    # Config & Engine
    "Config",
    "InspectionEngine",

    # Types
    "Detection",
    "Segmentation",
    "ThermalReading",
    "InspectionResult",
    "Anomaly",
    "GeoLocation",

    # Validation
    "ValidationResult",
    "ValidationStatus",
    "ValidationGate",
    "FrameValidator",
    "DetectionValidator",
    "SegmentationValidator",
    "ThermalValidator",
    "AnomalyValidator",
    "VLMOutputValidator",
    "InspectionResultValidator",

    # Correction
    "CorrectionResult",
    "CorrectionPipeline",
    "DetectionCorrector",
    "SegmentationCorrector",
    "ThermalCorrector",
    "AnomalyCorrector",
    "VLMOutputCorrector",

    # State Management
    "PipelineState",
    "PipelineStage",
    "StateManager",
    "StateCheckpoint",

    # Ensemble
    "DetectionEnsemble",
    "AnomalyEnsemble",
    "EnsembleConfig",
    "VotingStrategy",
    "ConfidenceCalibrator",

    # Edge Optimization
    "EdgeOptimizer",
    "QuantizationLevel",
    "CompressionStage",
    "MemoryBudget",
    "InferenceMetrics",
    "NMSFreeConfig",
    "INT8CalibrationConfig",
    "StreamOverlapConfig",
    "BufferPoolConfig",
    "AdaptiveVLMConfig",
    "TensorRTOptimizer",
    "get_optimizer",
    "initialize_optimizer",
]
