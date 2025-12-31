"""
Training Pipeline - Based on "Solving a Million-Step LLM Task with Zero Errors"

Key principles:
1. Progressive stages with validation at each step
2. Automatic checkpointing for recovery
3. Data validation before training
4. Error correction and retry mechanisms
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from loguru import logger

from bahb.training.data import DataValidator, DatasetManager, DatasetFormat
from bahb.training.stages import (
    TrainingStage,
    TrainingState,
    StageResult,
    TrainingCallback,
    CallbackManager,
    LoggingCallback,
    CheckpointCallback,
    EarlyStoppingCallback,
    MetricsCallback,
)


@dataclass
class TrainingConfig:
    """Configuration for training pipeline."""
    # Model
    model_type: str = "yolo11l"
    pretrained_weights: str = "yolo11l.pt"

    # Dataset
    dataset_format: DatasetFormat = DatasetFormat.YOLO
    classes: list[str] = field(default_factory=lambda: [
        "insulator", "transformer", "conductor", "switchgear",
        "damage", "corrosion", "hotspot", "crack",
    ])

    # Training
    epochs: int = 100
    batch_size: int = 8
    image_size: int = 1280
    patience: int = 20

    # Hardware
    device: str = "auto"  # auto, cpu, 0, 1, etc.

    # Paths
    output_dir: Path = Path("runs/training")
    data_dir: Path = Path("data")

    # Features
    enable_validation: bool = True
    enable_checkpointing: bool = True
    resume_from_checkpoint: bool = True
    auto_fix_data: bool = True

    # Retry
    max_retries: int = 3
    retry_delay_seconds: float = 10.0


class TrainingPipeline:
    """
    End-to-end training pipeline with validation and recovery.

    Stages:
    1. Data download/preparation
    2. Data validation
    3. Data conversion (if needed)
    4. Train/val split
    5. Model initialization
    6. Training with checkpointing
    7. Final validation
    8. Model export
    """

    def __init__(self, config: TrainingConfig):
        self.config = config
        self.state: Optional[TrainingState] = None

        # Setup callbacks
        self.callbacks = CallbackManager()
        self.callbacks.add(LoggingCallback())

        if config.enable_checkpointing:
            self.callbacks.add(CheckpointCallback(
                checkpoint_dir=config.output_dir / "checkpoints",
                interval_epochs=10,
            ))

        self.callbacks.add(EarlyStoppingCallback(
            patience=config.patience,
            metric_name="metrics/mAP50",
        ))

        self.callbacks.add(MetricsCallback(
            output_dir=config.output_dir,
        ))

        # Data management
        self.data_manager = DatasetManager(
            output_dir=config.data_dir / "processed",
            classes=config.classes,
        )

        self.data_validator = DataValidator(
            dataset_format=config.dataset_format,
            auto_fix=config.auto_fix_data,
        )

    def run(
        self,
        datasets: list[dict[str, Any]] = None,
        resume: bool = None,
    ) -> TrainingState:
        """
        Run the complete training pipeline.

        Args:
            datasets: List of dataset configs with 'path' and optional 'format'
            resume: Whether to resume from checkpoint (None = use config)

        Returns:
            Final training state
        """
        resume = resume if resume is not None else self.config.resume_from_checkpoint

        # Try to resume from checkpoint
        if resume:
            checkpoint_path = self.config.output_dir / "checkpoints" / "latest.pkl"
            if checkpoint_path.exists():
                try:
                    self.state = TrainingState.load(checkpoint_path)
                    logger.info(f"Resuming from stage: {self.state.current_stage.name}")
                except Exception as e:
                    logger.warning(f"Failed to load checkpoint: {e}")
                    self.state = None

        # Create new state if not resuming
        if self.state is None:
            self.state = TrainingState(
                run_id=str(uuid.uuid4())[:8],
                config=self._config_to_dict(),
                output_dir=self.config.output_dir,
                total_epochs=self.config.epochs,
            )

        # Run stages
        try:
            if self.state.current_stage == TrainingStage.INIT:
                self._run_stage(TrainingStage.INIT, self._stage_init)

            if self.state.current_stage == TrainingStage.DATA_DOWNLOAD:
                self._run_stage(TrainingStage.DATA_DOWNLOAD,
                               lambda: self._stage_data_download(datasets))

            if self.state.current_stage == TrainingStage.DATA_VALIDATION:
                self._run_stage(TrainingStage.DATA_VALIDATION, self._stage_data_validation)

            if self.state.current_stage == TrainingStage.DATA_CONVERSION:
                self._run_stage(TrainingStage.DATA_CONVERSION, self._stage_data_conversion)

            if self.state.current_stage == TrainingStage.DATA_SPLIT:
                self._run_stage(TrainingStage.DATA_SPLIT, self._stage_data_split)

            if self.state.current_stage == TrainingStage.MODEL_INIT:
                self._run_stage(TrainingStage.MODEL_INIT, self._stage_model_init)

            if self.state.current_stage == TrainingStage.TRAINING:
                self._run_stage(TrainingStage.TRAINING, self._stage_training)

            if self.state.current_stage == TrainingStage.VALIDATION:
                self._run_stage(TrainingStage.VALIDATION, self._stage_validation)

            if self.state.current_stage == TrainingStage.EXPORT:
                self._run_stage(TrainingStage.EXPORT, self._stage_export)

            self.state.current_stage = TrainingStage.COMPLETE
            self.callbacks.on_training_complete(self.state)

        except Exception as e:
            logger.error(f"Training failed: {e}")
            self.state.current_stage = TrainingStage.FAILED
            self.callbacks.on_training_failed(str(e), self.state)
            raise

        finally:
            # Save final state
            self.state.save(self.config.output_dir / "checkpoints" / "latest.pkl")

        return self.state

    def _run_stage(
        self,
        stage: TrainingStage,
        stage_fn: callable,
        max_retries: int = None,
    ) -> StageResult:
        """Run a single stage with retries."""
        max_retries = max_retries or self.config.max_retries

        self.callbacks.on_stage_start(stage, self.state)

        for attempt in range(max_retries + 1):
            start_time = time.time()

            try:
                result = stage_fn()
                result.duration_seconds = time.time() - start_time

                self.state.advance_stage(result)
                self.callbacks.on_stage_end(stage, result, self.state)

                if result.success:
                    return result
                else:
                    logger.warning(f"Stage {stage.name} failed: {result.message}")
                    if attempt < max_retries:
                        logger.info(f"Retrying in {self.config.retry_delay_seconds}s...")
                        time.sleep(self.config.retry_delay_seconds)

            except Exception as e:
                duration = time.time() - start_time
                result = StageResult(
                    stage=stage,
                    success=False,
                    message=f"Exception: {e}",
                    duration_seconds=duration,
                    errors=[str(e)],
                )

                if attempt < max_retries:
                    logger.warning(f"Stage {stage.name} error: {e}, retrying...")
                    time.sleep(self.config.retry_delay_seconds)
                else:
                    self.state.advance_stage(result)
                    self.callbacks.on_stage_end(stage, result, self.state)
                    raise

        return result

    def _stage_init(self) -> StageResult:
        """Initialize training environment."""
        try:
            # Create output directories
            self.config.output_dir.mkdir(parents=True, exist_ok=True)
            (self.config.output_dir / "checkpoints").mkdir(exist_ok=True)
            (self.config.output_dir / "weights").mkdir(exist_ok=True)

            # Verify YOLO is available
            from ultralytics import YOLO

            return StageResult(
                stage=TrainingStage.INIT,
                success=True,
                message="Environment initialized",
                artifacts=[self.config.output_dir],
            )

        except ImportError as e:
            return StageResult(
                stage=TrainingStage.INIT,
                success=False,
                message=f"Missing dependency: {e}",
                errors=[str(e)],
            )

    def _stage_data_download(self, datasets: list[dict] = None) -> StageResult:
        """Download and prepare datasets."""
        if not datasets:
            # Use default dataset paths
            datasets = [
                {"path": self.config.data_dir / "raw" / "cplid", "format": "voc"},
            ]

        downloaded_paths = []
        errors = []

        for ds in datasets:
            path = Path(ds.get("path", ""))
            if path.exists():
                downloaded_paths.append(path)
                logger.info(f"Found dataset: {path}")
            else:
                errors.append(f"Dataset not found: {path}")

        if not downloaded_paths:
            return StageResult(
                stage=TrainingStage.DATA_DOWNLOAD,
                success=False,
                message="No datasets found",
                errors=errors,
            )

        # Store paths in state
        self.state.config["dataset_paths"] = [str(p) for p in downloaded_paths]

        return StageResult(
            stage=TrainingStage.DATA_DOWNLOAD,
            success=True,
            message=f"Found {len(downloaded_paths)} datasets",
            artifacts=downloaded_paths,
        )

    def _stage_data_validation(self) -> StageResult:
        """Validate all datasets."""
        dataset_paths = [
            Path(p) for p in self.state.config.get("dataset_paths", [])
        ]

        all_issues = []
        total_images = 0
        total_labels = 0

        for path in dataset_paths:
            result = self.data_validator.validate_dataset(
                path,
                classes=self.config.classes,
            )

            total_images += result.total_images
            total_labels += result.total_labels
            all_issues.extend(result.issues)

            logger.info(
                f"Validated {path.name}: "
                f"{result.total_images} images, "
                f"{result.total_labels} labels, "
                f"{result.error_count} errors"
            )

        # Check if validation passed
        critical_errors = [
            i for i in all_issues
            if i.severity.name == "CRITICAL"
        ]

        if critical_errors:
            return StageResult(
                stage=TrainingStage.DATA_VALIDATION,
                success=False,
                message=f"Validation failed with {len(critical_errors)} critical errors",
                errors=[i.message for i in critical_errors],
            )

        return StageResult(
            stage=TrainingStage.DATA_VALIDATION,
            success=True,
            message=f"Validated {total_images} images, {total_labels} labels",
            metrics={
                "total_images": total_images,
                "total_labels": total_labels,
                "issues": len(all_issues),
            },
        )

    def _stage_data_conversion(self) -> StageResult:
        """Convert datasets to YOLO format."""
        dataset_paths = [
            Path(p) for p in self.state.config.get("dataset_paths", [])
        ]

        total_converted = 0
        total_skipped = 0
        all_errors = []

        for path in dataset_paths:
            # Check if conversion needed
            if self.config.dataset_format == DatasetFormat.PASCAL_VOC:
                converted, skipped, errors = self.data_manager.convert_voc_to_yolo(path)
                total_converted += converted
                total_skipped += skipped
                all_errors.extend(errors)

        if all_errors and total_converted == 0:
            return StageResult(
                stage=TrainingStage.DATA_CONVERSION,
                success=False,
                message="Data conversion failed",
                errors=all_errors,
            )

        return StageResult(
            stage=TrainingStage.DATA_CONVERSION,
            success=True,
            message=f"Converted {total_converted} files, skipped {total_skipped}",
            metrics={
                "converted": total_converted,
                "skipped": total_skipped,
            },
        )

    def _stage_data_split(self) -> StageResult:
        """Create train/val split."""
        dataset_paths = [
            Path(p) for p in self.state.config.get("dataset_paths", [])
        ]

        # Combine all datasets into one
        all_images = []
        for path in dataset_paths:
            for ext in [".jpg", ".jpeg", ".png"]:
                all_images.extend(path.rglob(f"*{ext}"))

        if not all_images:
            return StageResult(
                stage=TrainingStage.DATA_SPLIT,
                success=False,
                message="No images found for splitting",
            )

        # Create split
        try:
            train_dir, val_dir = self.data_manager.create_split(
                source_dir=dataset_paths[0] if len(dataset_paths) == 1 else self.config.data_dir / "raw",
                train_ratio=0.85,
            )

            # Create YAML file
            yaml_path = self.data_manager.create_yaml(
                train_dir=train_dir,
                val_dir=val_dir,
            )

            # Store in state
            self.state.config["train_dir"] = str(train_dir)
            self.state.config["val_dir"] = str(val_dir)
            self.state.config["dataset_yaml"] = str(yaml_path)

            # Get stats
            train_stats = self.data_manager.get_dataset_stats(train_dir)
            val_stats = self.data_manager.get_dataset_stats(val_dir)

            return StageResult(
                stage=TrainingStage.DATA_SPLIT,
                success=True,
                message=f"Created split: {train_stats['total_images']} train, {val_stats['total_images']} val",
                artifacts=[train_dir, val_dir, yaml_path],
                metrics={
                    "train_images": train_stats["total_images"],
                    "val_images": val_stats["total_images"],
                },
            )

        except Exception as e:
            return StageResult(
                stage=TrainingStage.DATA_SPLIT,
                success=False,
                message=f"Split failed: {e}",
                errors=[str(e)],
            )

    def _stage_model_init(self) -> StageResult:
        """Initialize model for training."""
        try:
            from ultralytics import YOLO
            import torch

            # Determine device
            if self.config.device == "auto":
                device = "0" if torch.cuda.is_available() else "cpu"
            else:
                device = self.config.device

            # Load model
            model = YOLO(self.config.pretrained_weights)

            self.state.config["device"] = device
            self.state.config["model_type"] = self.config.model_type

            return StageResult(
                stage=TrainingStage.MODEL_INIT,
                success=True,
                message=f"Model initialized on device: {device}",
                metrics={
                    "device": device,
                    "model_type": self.config.model_type,
                },
            )

        except Exception as e:
            return StageResult(
                stage=TrainingStage.MODEL_INIT,
                success=False,
                message=f"Model init failed: {e}",
                errors=[str(e)],
            )

    def _stage_training(self) -> StageResult:
        """Run model training."""
        try:
            from ultralytics import YOLO

            dataset_yaml = self.state.config.get("dataset_yaml")
            device = self.state.config.get("device", "cpu")

            if not dataset_yaml:
                return StageResult(
                    stage=TrainingStage.TRAINING,
                    success=False,
                    message="Dataset YAML not found",
                )

            # Load model
            model = YOLO(self.config.pretrained_weights)

            # Train
            results = model.train(
                data=dataset_yaml,
                epochs=self.config.epochs,
                imgsz=self.config.image_size,
                batch=self.config.batch_size if device != "cpu" else 4,
                device=device,
                project=str(self.config.output_dir),
                name="train",
                patience=self.config.patience,
                save=True,
                plots=True,
            )

            # Update state
            self.state.current_epoch = self.config.epochs
            self.state.best_model_path = Path(results.save_dir) / "weights" / "best.pt"

            return StageResult(
                stage=TrainingStage.TRAINING,
                success=True,
                message="Training complete",
                artifacts=[self.state.best_model_path],
                metrics={
                    "epochs": self.config.epochs,
                    "save_dir": str(results.save_dir),
                },
            )

        except Exception as e:
            return StageResult(
                stage=TrainingStage.TRAINING,
                success=False,
                message=f"Training failed: {e}",
                errors=[str(e)],
            )

    def _stage_validation(self) -> StageResult:
        """Run final validation on best model."""
        try:
            from ultralytics import YOLO

            if not self.state.best_model_path or not self.state.best_model_path.exists():
                return StageResult(
                    stage=TrainingStage.VALIDATION,
                    success=False,
                    message="Best model not found",
                )

            model = YOLO(self.state.best_model_path)
            dataset_yaml = self.state.config.get("dataset_yaml")

            metrics = model.val(data=dataset_yaml)

            return StageResult(
                stage=TrainingStage.VALIDATION,
                success=True,
                message=f"Validation mAP50: {metrics.box.map50:.4f}",
                metrics={
                    "mAP50": float(metrics.box.map50),
                    "mAP50-95": float(metrics.box.map),
                    "precision": float(metrics.box.mp),
                    "recall": float(metrics.box.mr),
                },
            )

        except Exception as e:
            return StageResult(
                stage=TrainingStage.VALIDATION,
                success=False,
                message=f"Validation failed: {e}",
                errors=[str(e)],
            )

    def _stage_export(self) -> StageResult:
        """Export model to various formats."""
        try:
            from ultralytics import YOLO

            if not self.state.best_model_path or not self.state.best_model_path.exists():
                return StageResult(
                    stage=TrainingStage.EXPORT,
                    success=False,
                    message="Best model not found",
                )

            model = YOLO(self.state.best_model_path)

            # Export to ONNX
            onnx_path = model.export(format="onnx")

            # Copy to output directory
            import shutil
            final_pt = self.config.output_dir / "weights" / "best.pt"
            final_onnx = self.config.output_dir / "weights" / "best.onnx"

            shutil.copy2(self.state.best_model_path, final_pt)
            if Path(onnx_path).exists():
                shutil.copy2(onnx_path, final_onnx)

            return StageResult(
                stage=TrainingStage.EXPORT,
                success=True,
                message="Model exported",
                artifacts=[final_pt, final_onnx],
            )

        except Exception as e:
            return StageResult(
                stage=TrainingStage.EXPORT,
                success=False,
                message=f"Export failed: {e}",
                errors=[str(e)],
            )

    def _config_to_dict(self) -> dict:
        """Convert config to dictionary for serialization."""
        return {
            "model_type": self.config.model_type,
            "pretrained_weights": self.config.pretrained_weights,
            "classes": self.config.classes,
            "epochs": self.config.epochs,
            "batch_size": self.config.batch_size,
            "image_size": self.config.image_size,
            "patience": self.config.patience,
            "device": self.config.device,
            "output_dir": str(self.config.output_dir),
            "data_dir": str(self.config.data_dir),
        }
