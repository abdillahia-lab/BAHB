"""
Training Stages - Based on "Solving a Million-Step LLM Task with Zero Errors"

Key principles:
1. Progressive stages with validation gates
2. Checkpointing between stages
3. Automatic recovery from failures
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from pathlib import Path
from typing import Any, Callable, Optional
import json
import pickle

from loguru import logger


class TrainingStage(Enum):
    """Training pipeline stages."""
    INIT = auto()
    DATA_DOWNLOAD = auto()
    DATA_VALIDATION = auto()
    DATA_CONVERSION = auto()
    DATA_SPLIT = auto()
    MODEL_INIT = auto()
    TRAINING = auto()
    VALIDATION = auto()
    EXPORT = auto()
    COMPLETE = auto()
    FAILED = auto()


@dataclass
class StageResult:
    """Result from a training stage."""
    stage: TrainingStage
    success: bool
    message: str
    duration_seconds: float = 0.0
    metrics: dict[str, Any] = field(default_factory=dict)
    artifacts: list[Path] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


@dataclass
class TrainingState:
    """
    Complete training state for checkpointing.

    Enables:
    - Resume from any stage
    - Progress tracking
    - Failure recovery
    """

    run_id: str
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    # Current state
    current_stage: TrainingStage = TrainingStage.INIT
    stage_results: dict[TrainingStage, StageResult] = field(default_factory=dict)

    # Configuration
    config: dict[str, Any] = field(default_factory=dict)

    # Progress
    current_epoch: int = 0
    total_epochs: int = 100
    best_metric: float = 0.0
    best_epoch: int = 0

    # Paths
    output_dir: Optional[Path] = None
    checkpoint_path: Optional[Path] = None
    best_model_path: Optional[Path] = None

    def advance_stage(self, result: StageResult) -> None:
        """Record result and advance to next stage."""
        self.stage_results[result.stage] = result
        self.updated_at = datetime.now()

        if result.success:
            # Advance to next stage
            stages = list(TrainingStage)
            current_idx = stages.index(result.stage)
            if current_idx < len(stages) - 2:  # Not COMPLETE or FAILED
                self.current_stage = stages[current_idx + 1]
        else:
            self.current_stage = TrainingStage.FAILED

    def get_progress(self) -> dict:
        """Get training progress summary."""
        completed_stages = [
            s for s, r in self.stage_results.items() if r.success
        ]

        return {
            "run_id": self.run_id,
            "current_stage": self.current_stage.name,
            "completed_stages": [s.name for s in completed_stages],
            "current_epoch": self.current_epoch,
            "total_epochs": self.total_epochs,
            "best_metric": self.best_metric,
            "best_epoch": self.best_epoch,
            "duration_seconds": sum(
                r.duration_seconds for r in self.stage_results.values()
            ),
        }

    def save(self, path: Path = None) -> Path:
        """Save state to checkpoint file."""
        path = path or self.checkpoint_path
        if path is None:
            path = Path(f"training_state_{self.run_id}.pkl")

        with open(path, 'wb') as f:
            pickle.dump(self, f)

        self.checkpoint_path = path
        logger.info(f"Saved training state to {path}")
        return path

    @classmethod
    def load(cls, path: Path) -> "TrainingState":
        """Load state from checkpoint file."""
        with open(path, 'rb') as f:
            state = pickle.load(f)
        logger.info(f"Loaded training state from {path}")
        return state

    def can_resume_from(self, stage: TrainingStage) -> bool:
        """Check if training can resume from a specific stage."""
        if stage == TrainingStage.INIT:
            return True

        # Check if previous stage completed successfully
        stages = list(TrainingStage)
        stage_idx = stages.index(stage)

        if stage_idx == 0:
            return True

        prev_stage = stages[stage_idx - 1]
        prev_result = self.stage_results.get(prev_stage)

        return prev_result is not None and prev_result.success


class TrainingCallback:
    """Base callback for training events."""

    def on_stage_start(self, stage: TrainingStage, state: TrainingState) -> None:
        """Called when a stage starts."""
        pass

    def on_stage_end(self, stage: TrainingStage, result: StageResult, state: TrainingState) -> None:
        """Called when a stage ends."""
        pass

    def on_epoch_start(self, epoch: int, state: TrainingState) -> None:
        """Called at the start of each epoch."""
        pass

    def on_epoch_end(self, epoch: int, metrics: dict, state: TrainingState) -> None:
        """Called at the end of each epoch."""
        pass

    def on_checkpoint(self, state: TrainingState) -> None:
        """Called when a checkpoint is saved."""
        pass

    def on_training_complete(self, state: TrainingState) -> None:
        """Called when training completes successfully."""
        pass

    def on_training_failed(self, error: str, state: TrainingState) -> None:
        """Called when training fails."""
        pass


class LoggingCallback(TrainingCallback):
    """Callback that logs training events."""

    def on_stage_start(self, stage: TrainingStage, state: TrainingState) -> None:
        logger.info(f"Starting stage: {stage.name}")

    def on_stage_end(self, stage: TrainingStage, result: StageResult, state: TrainingState) -> None:
        status = "✓" if result.success else "✗"
        logger.info(f"{status} Stage {stage.name}: {result.message} ({result.duration_seconds:.1f}s)")

    def on_epoch_end(self, epoch: int, metrics: dict, state: TrainingState) -> None:
        logger.info(f"Epoch {epoch}/{state.total_epochs} - {metrics}")

    def on_training_complete(self, state: TrainingState) -> None:
        logger.success(f"Training complete! Best metric: {state.best_metric:.4f} at epoch {state.best_epoch}")

    def on_training_failed(self, error: str, state: TrainingState) -> None:
        logger.error(f"Training failed: {error}")


class CheckpointCallback(TrainingCallback):
    """Callback that manages checkpoints."""

    def __init__(self, checkpoint_dir: Path, interval_epochs: int = 10):
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.interval_epochs = interval_epochs

    def on_epoch_end(self, epoch: int, metrics: dict, state: TrainingState) -> None:
        if epoch % self.interval_epochs == 0:
            checkpoint_path = self.checkpoint_dir / f"checkpoint_epoch_{epoch}.pkl"
            state.save(checkpoint_path)

    def on_stage_end(self, stage: TrainingStage, result: StageResult, state: TrainingState) -> None:
        checkpoint_path = self.checkpoint_dir / f"checkpoint_{stage.name.lower()}.pkl"
        state.save(checkpoint_path)


class EarlyStoppingCallback(TrainingCallback):
    """Callback for early stopping based on validation metrics."""

    def __init__(
        self,
        patience: int = 10,
        min_delta: float = 0.001,
        metric_name: str = "val_mAP",
        mode: str = "max",
    ):
        self.patience = patience
        self.min_delta = min_delta
        self.metric_name = metric_name
        self.mode = mode

        self.best_value = float("-inf") if mode == "max" else float("inf")
        self.wait_count = 0
        self.should_stop = False

    def on_epoch_end(self, epoch: int, metrics: dict, state: TrainingState) -> None:
        current = metrics.get(self.metric_name, 0)

        if self.mode == "max":
            improved = current > self.best_value + self.min_delta
        else:
            improved = current < self.best_value - self.min_delta

        if improved:
            self.best_value = current
            self.wait_count = 0
            state.best_metric = current
            state.best_epoch = epoch
        else:
            self.wait_count += 1
            if self.wait_count >= self.patience:
                self.should_stop = True
                logger.info(f"Early stopping triggered at epoch {epoch}")


class MetricsCallback(TrainingCallback):
    """Callback that tracks and saves metrics."""

    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.metrics_history: list[dict] = []

    def on_epoch_end(self, epoch: int, metrics: dict, state: TrainingState) -> None:
        entry = {
            "epoch": epoch,
            "timestamp": datetime.now().isoformat(),
            **metrics,
        }
        self.metrics_history.append(entry)

        # Save to file
        metrics_file = self.output_dir / "metrics.json"
        with open(metrics_file, 'w') as f:
            json.dump(self.metrics_history, f, indent=2)

    def on_training_complete(self, state: TrainingState) -> None:
        summary = {
            "run_id": state.run_id,
            "total_epochs": state.current_epoch,
            "best_metric": state.best_metric,
            "best_epoch": state.best_epoch,
            "final_metrics": self.metrics_history[-1] if self.metrics_history else {},
        }

        summary_file = self.output_dir / "training_summary.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)


class CallbackManager:
    """Manages multiple training callbacks."""

    def __init__(self):
        self.callbacks: list[TrainingCallback] = []

    def add(self, callback: TrainingCallback) -> None:
        """Add a callback."""
        self.callbacks.append(callback)

    def remove(self, callback: TrainingCallback) -> None:
        """Remove a callback."""
        self.callbacks.remove(callback)

    def on_stage_start(self, stage: TrainingStage, state: TrainingState) -> None:
        for cb in self.callbacks:
            cb.on_stage_start(stage, state)

    def on_stage_end(self, stage: TrainingStage, result: StageResult, state: TrainingState) -> None:
        for cb in self.callbacks:
            cb.on_stage_end(stage, result, state)

    def on_epoch_start(self, epoch: int, state: TrainingState) -> None:
        for cb in self.callbacks:
            cb.on_epoch_start(epoch, state)

    def on_epoch_end(self, epoch: int, metrics: dict, state: TrainingState) -> None:
        for cb in self.callbacks:
            cb.on_epoch_end(epoch, metrics, state)

    def on_checkpoint(self, state: TrainingState) -> None:
        for cb in self.callbacks:
            cb.on_checkpoint(state)

    def on_training_complete(self, state: TrainingState) -> None:
        for cb in self.callbacks:
            cb.on_training_complete(state)

    def on_training_failed(self, error: str, state: TrainingState) -> None:
        for cb in self.callbacks:
            cb.on_training_failed(error, state)

    def should_stop(self) -> bool:
        """Check if any callback wants to stop training."""
        for cb in self.callbacks:
            if isinstance(cb, EarlyStoppingCallback) and cb.should_stop:
                return True
        return False
