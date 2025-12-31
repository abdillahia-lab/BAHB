"""
State Management Module - Based on "Solving a Million-Step LLM Task with Zero Errors"

Key principle: Explicit state management between steps with intermediate
checkpointing. Structured intermediate representations that survive
round-trip serialization.
"""

from __future__ import annotations

import json
import pickle
import hashlib
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum, auto
from pathlib import Path
from typing import Any, Optional, TypeVar, Generic

import numpy as np
from numpy.typing import NDArray
from loguru import logger


class PipelineStage(Enum):
    """Pipeline execution stages."""
    INPUT = auto()
    FRAME_VALIDATION = auto()
    DETECTION = auto()
    DETECTION_VALIDATION = auto()
    SEGMENTATION = auto()
    SEGMENTATION_VALIDATION = auto()
    THERMAL_ANALYSIS = auto()
    THERMAL_VALIDATION = auto()
    ANOMALY_DETECTION = auto()
    ANOMALY_VALIDATION = auto()
    VLM_ANALYSIS = auto()
    VLM_VALIDATION = auto()
    OUTPUT = auto()
    COMPLETE = auto()


@dataclass
class StageOutput:
    """Output from a single pipeline stage."""
    stage: PipelineStage
    timestamp: datetime
    data: Any
    execution_time_ms: float = 0.0
    validation_passed: bool = True
    corrections_applied: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert to dictionary for serialization."""
        return {
            "stage": self.stage.name,
            "timestamp": self.timestamp.isoformat(),
            "execution_time_ms": self.execution_time_ms,
            "validation_passed": self.validation_passed,
            "corrections_applied": self.corrections_applied,
            "metadata": self.metadata,
            # Note: 'data' is not serialized here - use specialized methods
        }


@dataclass
class PipelineState:
    """
    Complete state of pipeline execution.

    Enables:
    - Checkpointing at any stage
    - Recovery from failures
    - Debugging and analysis
    - State transfer between processes
    """

    frame_id: int
    session_id: str
    created_at: datetime = field(default_factory=datetime.now)

    # Stage outputs (ordered by execution)
    stage_outputs: dict[PipelineStage, StageOutput] = field(default_factory=dict)

    # Current execution state
    current_stage: PipelineStage = PipelineStage.INPUT
    is_complete: bool = False
    has_error: bool = False
    error_message: Optional[str] = None

    # Aggregated metrics
    total_execution_time_ms: float = 0.0
    total_corrections: int = 0

    def set_stage_output(
        self,
        stage: PipelineStage,
        data: Any,
        execution_time_ms: float = 0.0,
        validation_passed: bool = True,
        corrections: list[str] = None,
        metadata: dict = None,
    ) -> None:
        """Record output from a pipeline stage."""
        output = StageOutput(
            stage=stage,
            timestamp=datetime.now(),
            data=data,
            execution_time_ms=execution_time_ms,
            validation_passed=validation_passed,
            corrections_applied=corrections or [],
            metadata=metadata or {},
        )
        self.stage_outputs[stage] = output
        self.current_stage = stage
        self.total_execution_time_ms += execution_time_ms
        self.total_corrections += len(corrections or [])

    def get_stage_output(self, stage: PipelineStage) -> Optional[StageOutput]:
        """Get output from a specific stage."""
        return self.stage_outputs.get(stage)

    def get_stage_data(self, stage: PipelineStage) -> Optional[Any]:
        """Get just the data from a specific stage."""
        output = self.stage_outputs.get(stage)
        return output.data if output else None

    def mark_complete(self) -> None:
        """Mark pipeline as successfully completed."""
        self.is_complete = True
        self.current_stage = PipelineStage.COMPLETE

    def mark_error(self, message: str) -> None:
        """Mark pipeline as failed with error."""
        self.has_error = True
        self.error_message = message

    def get_execution_trace(self) -> list[dict]:
        """Get execution trace for debugging."""
        trace = []
        for stage in PipelineStage:
            output = self.stage_outputs.get(stage)
            if output:
                trace.append({
                    "stage": stage.name,
                    "time_ms": output.execution_time_ms,
                    "passed": output.validation_passed,
                    "corrections": len(output.corrections_applied),
                })
        return trace

    def to_summary(self) -> dict:
        """Get summary for logging/debugging."""
        return {
            "frame_id": self.frame_id,
            "session_id": self.session_id,
            "current_stage": self.current_stage.name,
            "is_complete": self.is_complete,
            "has_error": self.has_error,
            "total_time_ms": self.total_execution_time_ms,
            "total_corrections": self.total_corrections,
            "stages_completed": len(self.stage_outputs),
        }


class StateCheckpoint:
    """
    Manages state checkpointing for pipeline recovery.

    Based on paper principle: "Explicit state management between steps
    with intermediate checkpointing."
    """

    def __init__(self, checkpoint_dir: Path = None):
        self.checkpoint_dir = checkpoint_dir or Path("/tmp/bahb_checkpoints")
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

    def save(self, state: PipelineState) -> Path:
        """Save state checkpoint to disk."""
        checkpoint_name = f"checkpoint_{state.session_id}_{state.frame_id}.pkl"
        checkpoint_path = self.checkpoint_dir / checkpoint_name

        try:
            with open(checkpoint_path, 'wb') as f:
                pickle.dump(state, f)
            logger.debug(f"Saved checkpoint: {checkpoint_path}")
            return checkpoint_path
        except Exception as e:
            logger.error(f"Failed to save checkpoint: {e}")
            raise

    def load(self, session_id: str, frame_id: int) -> Optional[PipelineState]:
        """Load state checkpoint from disk."""
        checkpoint_name = f"checkpoint_{session_id}_{frame_id}.pkl"
        checkpoint_path = self.checkpoint_dir / checkpoint_name

        if not checkpoint_path.exists():
            return None

        try:
            with open(checkpoint_path, 'rb') as f:
                state = pickle.load(f)
            logger.debug(f"Loaded checkpoint: {checkpoint_path}")
            return state
        except Exception as e:
            logger.error(f"Failed to load checkpoint: {e}")
            return None

    def list_checkpoints(self, session_id: str = None) -> list[Path]:
        """List available checkpoints."""
        pattern = f"checkpoint_{session_id}_*.pkl" if session_id else "checkpoint_*.pkl"
        return list(self.checkpoint_dir.glob(pattern))

    def cleanup(self, session_id: str = None, max_age_hours: int = 24) -> int:
        """Clean up old checkpoints."""
        import time

        count = 0
        cutoff = time.time() - (max_age_hours * 3600)

        for checkpoint in self.list_checkpoints(session_id):
            if checkpoint.stat().st_mtime < cutoff:
                checkpoint.unlink()
                count += 1

        if count > 0:
            logger.info(f"Cleaned up {count} old checkpoints")
        return count


@dataclass
class DataContract:
    """
    Defines expected data schema for pipeline stages.

    Based on paper principle: "Treats each step's output as the
    next step's input specification."
    """

    name: str
    required_fields: list[str]
    optional_fields: list[str] = field(default_factory=list)
    field_types: dict[str, type] = field(default_factory=dict)
    field_constraints: dict[str, dict] = field(default_factory=dict)

    def validate(self, data: dict) -> tuple[bool, list[str]]:
        """Validate data against contract."""
        errors = []

        # Check required fields
        for field_name in self.required_fields:
            if field_name not in data:
                errors.append(f"Missing required field: {field_name}")
            elif data[field_name] is None:
                errors.append(f"Required field is None: {field_name}")

        # Check types
        for field_name, expected_type in self.field_types.items():
            if field_name in data and data[field_name] is not None:
                if not isinstance(data[field_name], expected_type):
                    errors.append(
                        f"Field '{field_name}' has wrong type: "
                        f"expected {expected_type.__name__}, "
                        f"got {type(data[field_name]).__name__}"
                    )

        # Check constraints
        for field_name, constraints in self.field_constraints.items():
            if field_name in data and data[field_name] is not None:
                value = data[field_name]

                if "min" in constraints and value < constraints["min"]:
                    errors.append(f"Field '{field_name}' below minimum: {value} < {constraints['min']}")

                if "max" in constraints and value > constraints["max"]:
                    errors.append(f"Field '{field_name}' above maximum: {value} > {constraints['max']}")

                if "pattern" in constraints:
                    import re
                    if not re.match(constraints["pattern"], str(value)):
                        errors.append(f"Field '{field_name}' doesn't match pattern")

                if "enum" in constraints and value not in constraints["enum"]:
                    errors.append(f"Field '{field_name}' not in allowed values: {constraints['enum']}")

        return len(errors) == 0, errors


# Pre-defined contracts for each stage
DETECTION_OUTPUT_CONTRACT = DataContract(
    name="detection_output",
    required_fields=["detections"],
    optional_fields=["inference_time_ms", "model_version"],
    field_types={"detections": list, "inference_time_ms": (int, float)},
    field_constraints={"inference_time_ms": {"min": 0, "max": 10000}},
)

SEGMENTATION_OUTPUT_CONTRACT = DataContract(
    name="segmentation_output",
    required_fields=["segmentations"],
    optional_fields=["inference_time_ms"],
    field_types={"segmentations": list},
)

THERMAL_OUTPUT_CONTRACT = DataContract(
    name="thermal_output",
    required_fields=["min_temp", "max_temp", "mean_temp"],
    optional_fields=["hotspot_locations", "coldspot_locations", "temperature_map"],
    field_types={
        "min_temp": (int, float),
        "max_temp": (int, float),
        "mean_temp": (int, float),
    },
    field_constraints={
        "min_temp": {"min": -100, "max": 1000},
        "max_temp": {"min": -100, "max": 1000},
    },
)

ANOMALY_OUTPUT_CONTRACT = DataContract(
    name="anomaly_output",
    required_fields=["anomalies"],
    field_types={"anomalies": list},
)

VLM_OUTPUT_CONTRACT = DataContract(
    name="vlm_output",
    required_fields=["description"],
    optional_fields=["recommendations", "confidence"],
    field_types={
        "description": str,
        "recommendations": list,
    },
    field_constraints={
        "confidence": {"min": 0, "max": 1},
    },
)


class StateManager:
    """
    High-level state manager for pipeline execution.

    Coordinates:
    - State creation and tracking
    - Checkpointing
    - Contract validation
    - Recovery
    """

    def __init__(
        self,
        enable_checkpointing: bool = True,
        checkpoint_dir: Path = None,
        checkpoint_interval: int = 1,  # Checkpoint every N frames
    ):
        self.enable_checkpointing = enable_checkpointing
        self.checkpoint_interval = checkpoint_interval
        self.checkpoint = StateCheckpoint(checkpoint_dir) if enable_checkpointing else None

        # Current states (in-memory)
        self._states: dict[str, PipelineState] = {}  # keyed by f"{session_id}_{frame_id}"
        self._frame_count = 0

        # Contracts
        self.contracts = {
            PipelineStage.DETECTION: DETECTION_OUTPUT_CONTRACT,
            PipelineStage.SEGMENTATION: SEGMENTATION_OUTPUT_CONTRACT,
            PipelineStage.THERMAL_ANALYSIS: THERMAL_OUTPUT_CONTRACT,
            PipelineStage.ANOMALY_DETECTION: ANOMALY_OUTPUT_CONTRACT,
            PipelineStage.VLM_ANALYSIS: VLM_OUTPUT_CONTRACT,
        }

    def create_state(self, frame_id: int, session_id: str) -> PipelineState:
        """Create new pipeline state for a frame."""
        state = PipelineState(frame_id=frame_id, session_id=session_id)
        key = f"{session_id}_{frame_id}"
        self._states[key] = state
        return state

    def get_state(self, frame_id: int, session_id: str) -> Optional[PipelineState]:
        """Get state for a frame (from memory or checkpoint)."""
        key = f"{session_id}_{frame_id}"

        # Try memory first
        if key in self._states:
            return self._states[key]

        # Try checkpoint
        if self.checkpoint:
            return self.checkpoint.load(session_id, frame_id)

        return None

    def update_state(
        self,
        state: PipelineState,
        stage: PipelineStage,
        data: Any,
        execution_time_ms: float = 0.0,
        validation_passed: bool = True,
        corrections: list[str] = None,
    ) -> None:
        """Update state with stage output."""
        # Validate against contract if available
        contract = self.contracts.get(stage)
        if contract and isinstance(data, dict):
            is_valid, errors = contract.validate(data)
            if not is_valid:
                logger.warning(f"Contract violation at {stage.name}: {errors}")

        state.set_stage_output(
            stage=stage,
            data=data,
            execution_time_ms=execution_time_ms,
            validation_passed=validation_passed,
            corrections=corrections,
        )

        # Checkpoint if needed
        self._frame_count += 1
        if self.checkpoint and self._frame_count % self.checkpoint_interval == 0:
            self.checkpoint.save(state)

    def finalize_state(self, state: PipelineState) -> None:
        """Mark state as complete and optionally save checkpoint."""
        state.mark_complete()

        if self.checkpoint:
            self.checkpoint.save(state)

    def recover_from_checkpoint(
        self,
        session_id: str,
        frame_id: int,
    ) -> Optional[PipelineState]:
        """Attempt to recover state from checkpoint."""
        if not self.checkpoint:
            return None

        state = self.checkpoint.load(session_id, frame_id)
        if state:
            logger.info(f"Recovered state from checkpoint: frame {frame_id}")
            key = f"{session_id}_{frame_id}"
            self._states[key] = state
        return state

    def cleanup(self, session_id: str = None) -> None:
        """Clean up states and checkpoints."""
        if session_id:
            # Clean specific session
            keys_to_remove = [k for k in self._states if k.startswith(session_id)]
            for key in keys_to_remove:
                del self._states[key]
        else:
            # Clean all
            self._states.clear()

        if self.checkpoint:
            self.checkpoint.cleanup(session_id)

    def get_session_stats(self, session_id: str) -> dict:
        """Get statistics for a session."""
        session_states = [
            s for k, s in self._states.items()
            if k.startswith(session_id)
        ]

        if not session_states:
            return {}

        return {
            "total_frames": len(session_states),
            "completed": sum(1 for s in session_states if s.is_complete),
            "errors": sum(1 for s in session_states if s.has_error),
            "total_corrections": sum(s.total_corrections for s in session_states),
            "avg_time_ms": np.mean([s.total_execution_time_ms for s in session_states]),
        }
