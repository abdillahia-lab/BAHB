#!/usr/bin/env python3
"""
BAHB Training Script - YOLO26 Power Infrastructure Detection

Train YOLO26 on the merged power infrastructure dataset.
YOLO26 advantages over YOLO11:
- Native NMS-free end-to-end inference (43% faster CPU)
- STAL (Small-Target-Aware Label Assignment) - better for insulators, bird nests
- ProgLoss for improved accuracy
- MuSGD optimizer (SGD + Muon hybrid)
- DFL removal for simpler edge deployment

Usage:
    python train_yolo26.py [--model l] [--epochs 100] [--batch 16] [--device 0]
"""

import os
import sys
import time
import json
import argparse
from pathlib import Path
from datetime import datetime

os.environ['YOLO_VERBOSE'] = 'True'

from ultralytics import YOLO
import torch


# Paths
PROJECT_ROOT = Path("/home/user/BAHB")
DATASET_YAML = PROJECT_ROOT / "data" / "merged" / "dataset.yaml"
OUTPUT_DIR = PROJECT_ROOT / "runs" / "yolo26"
PROGRESS_FILE = OUTPUT_DIR / "training_progress.json"


def log(msg: str, level: str = "INFO") -> None:
    """Print timestamped log message."""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def format_time(seconds: float) -> str:
    """Format seconds to human readable."""
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        return f"{seconds/60:.1f}m"
    else:
        hours = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        return f"{hours}h {mins}m"


def get_training_config(
    model_size: str = "l",
    epochs: int = 100,
    batch: int = 16,
    imgsz: int = 640,
    device: str = "0",
) -> dict:
    """Get YOLO26 optimized training configuration.

    YOLO26 uses:
    - MuSGD optimizer by default (SGD + Muon hybrid)
    - No DFL loss (removed in YOLO26)
    - STAL for small-target label assignment
    - ProgLoss for progressive loss balancing
    """
    return {
        "data": str(DATASET_YAML),
        "model": f"yolo26{model_size}.pt",
        "epochs": epochs,
        "imgsz": imgsz,
        "batch": batch,
        "device": device,
        "patience": 50,
        "save": True,
        "save_period": 5,
        "project": str(OUTPUT_DIR.parent),
        "name": f"yolo26{model_size}_infrastructure",
        "exist_ok": True,
        # Optimizer (MuSGD is default in YOLO26)
        "optimizer": "auto",
        "lr0": 0.01,
        "lrf": 0.01,
        "momentum": 0.937,
        "weight_decay": 0.0005,
        "warmup_epochs": 3.0,
        "warmup_momentum": 0.8,
        "warmup_bias_lr": 0.1,
        # Loss weights (no DFL in YOLO26)
        "box": 7.5,
        "cls": 0.5,
        "dfl": 0.0,  # DFL removed in YOLO26
        # Augmentation
        "hsv_h": 0.015,
        "hsv_s": 0.7,
        "hsv_v": 0.4,
        "degrees": 0.0,
        "translate": 0.1,
        "scale": 0.5,
        "shear": 0.0,
        "perspective": 0.0,
        "flipud": 0.0,
        "fliplr": 0.5,
        "mosaic": 1.0,
        "mixup": 0.0,
        "copy_paste": 0.0,
        # Output
        "plots": True,
        "verbose": True,
    }


class TrainingMonitor:
    """Monitor and log training progress."""

    def __init__(self, total_epochs: int, update_interval: int = 900):
        self.total_epochs = total_epochs
        self.update_interval = update_interval
        self.start_time = None
        self.last_update_time = None
        self.epoch_times = []
        self.best_metrics = {
            "mAP50": 0,
            "mAP50_95": 0,
            "precision": 0,
            "recall": 0,
            "epoch": 0,
        }

    def on_train_start(self, trainer):
        """Training started."""
        self.start_time = time.time()
        self.last_update_time = self.start_time

        log("=" * 70)
        log("BAHB YOLO26 POWER INFRASTRUCTURE TRAINING")
        log("=" * 70)
        log(f"Model: YOLO26 (NMS-free, STAL-enabled)")
        log(f"Dataset: {DATASET_YAML}")
        log(f"Total epochs: {self.total_epochs}")
        log(f"Device: {trainer.args.device}")
        log("=" * 70)
        log("YOLO26 advantages:")
        log("  - Native NMS-free end-to-end inference")
        log("  - STAL for small object detection (insulators, bird nests)")
        log("  - MuSGD optimizer (43% faster training)")
        log("  - No DFL for simpler edge deployment")
        log("=" * 70)

    def on_train_epoch_end(self, trainer):
        """End of training epoch."""
        epoch = trainer.epoch + 1
        now = time.time()

        # Track epoch time
        epoch_time = now - (self.start_time + sum(self.epoch_times)) if self.epoch_times else now - self.start_time
        self.epoch_times.append(epoch_time)

        elapsed = now - self.start_time
        avg_epoch = elapsed / epoch
        remaining = avg_epoch * (self.total_epochs - epoch)

        # Get losses
        losses = {}
        if hasattr(trainer, 'loss_items') and trainer.loss_items is not None:
            losses = {
                "box_loss": float(trainer.loss_items[0]) if len(trainer.loss_items) > 0 else 0,
                "cls_loss": float(trainer.loss_items[1]) if len(trainer.loss_items) > 1 else 0,
            }

        log(f"Epoch {epoch}/{self.total_epochs} | Time: {format_time(epoch_time)} | Total: {format_time(elapsed)}")

        # Periodic detailed update
        if now - self.last_update_time >= self.update_interval:
            self.last_update_time = now
            log("-" * 70)
            log(f"*** PROGRESS UPDATE ***")
            log(f"Epoch: {epoch}/{self.total_epochs} ({epoch/self.total_epochs*100:.1f}%)")
            log(f"Elapsed: {format_time(elapsed)}")
            log(f"ETA: {format_time(remaining)}")
            log(f"Avg epoch time: {format_time(avg_epoch)}")
            if losses:
                log(f"Losses - Box: {losses.get('box_loss', 0):.4f}, Cls: {losses.get('cls_loss', 0):.4f}")
            log(f"Best mAP@50: {self.best_metrics['mAP50']*100:.2f}%")
            log("-" * 70)

    def on_val_end(self, validator):
        """Validation completed."""
        metrics = validator.metrics

        # Extract metrics
        if hasattr(metrics, 'box'):
            mAP50 = getattr(metrics.box, 'map50', 0) or 0
            mAP50_95 = getattr(metrics.box, 'map', 0) or 0
            precision = getattr(metrics.box, 'mp', 0) or 0
            recall = getattr(metrics.box, 'mr', 0) or 0
        else:
            mAP50 = getattr(metrics, 'map50', 0) or 0
            mAP50_95 = getattr(metrics, 'map', 0) or 0
            precision = getattr(metrics, 'mp', 0) or 0
            recall = getattr(metrics, 'mr', 0) or 0

        is_best = mAP50 > self.best_metrics["mAP50"]
        if is_best:
            self.best_metrics = {
                "mAP50": mAP50,
                "mAP50_95": mAP50_95,
                "precision": precision,
                "recall": recall,
                "epoch": validator.args.epochs if hasattr(validator.args, 'epochs') else 0,
            }

        best_marker = " [NEW BEST]" if is_best else ""
        log(f"Validation: mAP@50={mAP50*100:.2f}%, mAP@50-95={mAP50_95*100:.2f}%, P={precision*100:.2f}%, R={recall*100:.2f}%{best_marker}")

        # Save progress
        self._save_progress(
            validator.args.epochs if hasattr(validator.args, 'epochs') else 0,
            {"mAP50": mAP50, "mAP50_95": mAP50_95, "precision": precision, "recall": recall},
        )

    def on_train_end(self, trainer):
        """Training completed."""
        elapsed = time.time() - self.start_time

        log("=" * 70)
        log("YOLO26 TRAINING COMPLETE")
        log("=" * 70)
        log(f"Total time: {format_time(elapsed)}")
        log(f"Epochs completed: {trainer.epoch + 1}")
        log(f"Best mAP@50: {self.best_metrics['mAP50']*100:.2f}%")
        log(f"Best mAP@50-95: {self.best_metrics['mAP50_95']*100:.2f}%")
        log(f"Best precision: {self.best_metrics['precision']*100:.2f}%")
        log(f"Best recall: {self.best_metrics['recall']*100:.2f}%")
        log(f"Best epoch: {self.best_metrics['epoch']}")
        log("=" * 70)

        # Final save
        self._save_progress(trainer.epoch + 1, self.best_metrics)

    def _save_progress(self, epoch: int, metrics: dict) -> None:
        """Save progress to JSON file."""
        PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)

        elapsed = time.time() - self.start_time if self.start_time else 0
        progress = {
            "last_update": datetime.now().isoformat(),
            "current_epoch": epoch,
            "total_epochs": self.total_epochs,
            "elapsed_seconds": elapsed,
            "elapsed_formatted": format_time(elapsed),
            "metrics": metrics,
            "best_metrics": self.best_metrics,
            "estimated_remaining": format_time((elapsed / max(epoch, 1)) * (self.total_epochs - epoch)),
            "model": "YOLO26",
            "features": ["NMS-free", "STAL", "MuSGD", "ProgLoss"],
        }

        with open(PROGRESS_FILE, "w") as f:
            json.dump(progress, f, indent=2)


def main():
    """Main training function."""
    parser = argparse.ArgumentParser(description="Train YOLO26 on power infrastructure dataset")
    parser.add_argument("--model", type=str, default="l", choices=["n", "s", "m", "l", "x"],
                       help="YOLO26 model size (default: l)")
    parser.add_argument("--epochs", type=int, default=100, help="Number of epochs (default: 100)")
    parser.add_argument("--batch", type=int, default=16, help="Batch size (default: 16)")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size (default: 640)")
    parser.add_argument("--device", type=str, default="0", help="Device (default: 0, use 'cpu' for CPU)")
    parser.add_argument("--resume", type=str, default="", help="Resume from checkpoint")
    args = parser.parse_args()

    log("=" * 70)
    log("BAHB POWER INFRASTRUCTURE DETECTION - YOLO26")
    log("=" * 70)
    log(f"PyTorch: {torch.__version__}")
    log(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        log(f"GPU: {torch.cuda.get_device_name(0)}")

    # Verify dataset
    if not DATASET_YAML.exists():
        log(f"ERROR: Dataset not found: {DATASET_YAML}", "ERROR")
        sys.exit(1)

    # Dataset info
    train_dir = PROJECT_ROOT / "data" / "merged" / "train" / "images"
    val_dir = PROJECT_ROOT / "data" / "merged" / "val" / "images"
    train_count = len(list(train_dir.glob("*"))) if train_dir.exists() else 0
    val_count = len(list(val_dir.glob("*"))) if val_dir.exists() else 0
    log(f"Dataset: {train_count} train / {val_count} val images")

    # Get training config
    config = get_training_config(
        model_size=args.model,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
    )

    # Load model
    if args.resume:
        log(f"Resuming from: {args.resume}")
        model = YOLO(args.resume)
        config["resume"] = True
    else:
        log(f"Loading YOLO26{args.model} pretrained model...")
        model = YOLO(f"yolo26{args.model}.pt")

    # Setup monitor
    monitor = TrainingMonitor(total_epochs=args.epochs)

    # Register callbacks
    model.add_callback("on_train_start", monitor.on_train_start)
    model.add_callback("on_train_epoch_end", monitor.on_train_epoch_end)
    model.add_callback("on_val_end", monitor.on_val_end)
    model.add_callback("on_train_end", monitor.on_train_end)

    # Start training
    log("Starting YOLO26 training...")
    log(f"Output directory: {OUTPUT_DIR}")

    try:
        results = model.train(**config)
        return results
    except KeyboardInterrupt:
        log("Training interrupted by user", "WARN")
        return None
    except Exception as e:
        log(f"Training error: {e}", "ERROR")
        raise


if __name__ == "__main__":
    main()
