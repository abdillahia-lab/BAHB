"""
Core infrastructure modules.

Architecture based on "Solving a Million-Step LLM Task with Zero Errors":
- Validation layer with progressive gates
- Error correction/repair mechanisms
- State management with checkpointing
- Ensemble voting for improved accuracy
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
]
