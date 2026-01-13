#!/usr/bin/env python3
"""
BAHB Training Script - Resume Merged Dataset Training
Resumes YOLO11l training on the merged power infrastructure dataset.
Provides periodic progress updates for monitoring.
"""

import os
import sys
import time
import json
from pathlib import Path
from datetime import datetime, timedelta

os.environ['YOLO_VERBOSE'] = 'True'

from ultralytics import YOLO
import torch

# Paths
PROJECT_ROOT = Path("/home/user/BAHB")
DATASET_YAML = PROJECT_ROOT / "data" / "merged" / "dataset.yaml"
OUTPUT_DIR = PROJECT_ROOT / "runs" / "yolov11l_merged"
RESUME_WEIGHTS = OUTPUT_DIR / "weights" / "last.pt"
PROGRESS_FILE = OUTPUT_DIR / "training_progress.json"

# Training config optimized for CPU
CONFIG = {
    "data": str(DATASET_YAML),
    "epochs": 100,
    "imgsz": 640,
    "batch": 4,
    "patience": 20,
    "device": "cpu",
    "workers": 4,
    "project": str(OUTPUT_DIR.parent),
    "name": OUTPUT_DIR.name,
    "exist_ok": True,
    "resume": True,
    "optimizer": "AdamW",
    "lr0": 0.001,
    "lrf": 0.01,
    "momentum": 0.937,
    "weight_decay": 0.0005,
    "warmup_epochs": 3,
    "box": 7.5,
    "cls": 0.5,
    "dfl": 1.5,
    "hsv_h": 0.015,
    "hsv_s": 0.7,
    "hsv_v": 0.4,
    "translate": 0.1,
    "scale": 0.5,
    "fliplr": 0.5,
    "mosaic": 1.0,
    "save": True,
    "save_period": 1,
    "plots": True,
    "verbose": True,
}

# Tracking
training_start = None
epoch_times = []
best_metrics = {"mAP50": 0, "mAP50_95": 0, "precision": 0, "recall": 0, "epoch": 0}
last_update_time = None
UPDATE_INTERVAL = 900  # 15 minutes


def log(msg, level="INFO"):
    """Print timestamped log message."""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def save_progress(epoch, metrics, elapsed):
    """Save progress to JSON file."""
    progress = {
        "last_update": datetime.now().isoformat(),
        "current_epoch": epoch,
        "total_epochs": CONFIG["epochs"],
        "elapsed_seconds": elapsed,
        "elapsed_formatted": format_time(elapsed),
        "metrics": metrics,
        "best_metrics": best_metrics,
        "estimated_remaining": format_time((elapsed / max(epoch, 1)) * (CONFIG["epochs"] - epoch)),
    }
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)


def format_time(seconds):
    """Format seconds to human readable."""
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        return f"{seconds/60:.1f}m"
    else:
        hours = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        return f"{hours}h {mins}m"


def on_train_start(trainer):
    """Training started callback."""
    global training_start, last_update_time
    training_start = time.time()
    last_update_time = training_start

    log("=" * 70)
    log("BAHB YOLO11L MERGED DATASET TRAINING - RESUMED")
    log("=" * 70)
    log(f"Dataset: {DATASET_YAML}")
    log(f"Resume from: {RESUME_WEIGHTS}")
    log(f"Total epochs: {CONFIG['epochs']}")
    log(f"Batch size: {CONFIG['batch']}")
    log(f"Image size: {CONFIG['imgsz']}")
    log(f"Device: {CONFIG['device']}")
    log("=" * 70)


def on_train_epoch_end(trainer):
    """End of training epoch callback."""
    global last_update_time, epoch_times

    epoch = trainer.epoch + 1
    now = time.time()

    # Track epoch time
    epoch_time = now - (training_start + sum(epoch_times)) if epoch_times else now - training_start
    epoch_times.append(epoch_time)

    elapsed = now - training_start
    avg_epoch = elapsed / epoch
    remaining = avg_epoch * (CONFIG["epochs"] - epoch)

    # Get losses
    losses = {}
    if hasattr(trainer, 'loss_items') and trainer.loss_items is not None:
        losses = {
            "box_loss": float(trainer.loss_items[0]) if len(trainer.loss_items) > 0 else 0,
            "cls_loss": float(trainer.loss_items[1]) if len(trainer.loss_items) > 1 else 0,
            "dfl_loss": float(trainer.loss_items[2]) if len(trainer.loss_items) > 2 else 0,
        }

    log(f"Epoch {epoch}/{CONFIG['epochs']} training done | Time: {format_time(epoch_time)} | Total: {format_time(elapsed)}")

    # Periodic detailed update
    if now - last_update_time >= UPDATE_INTERVAL:
        last_update_time = now
        log("-" * 70)
        log(f"*** 15-MINUTE PROGRESS UPDATE ***")
        log(f"Epoch: {epoch}/{CONFIG['epochs']} ({epoch/CONFIG['epochs']*100:.1f}%)")
        log(f"Elapsed: {format_time(elapsed)}")
        log(f"ETA: {format_time(remaining)}")
        log(f"Avg epoch time: {format_time(avg_epoch)}")
        if losses:
            log(f"Losses - Box: {losses.get('box_loss', 0):.4f}, Cls: {losses.get('cls_loss', 0):.4f}, DFL: {losses.get('dfl_loss', 0):.4f}")
        log(f"Best mAP@50: {best_metrics['mAP50']*100:.2f}%")
        log("-" * 70)


def on_val_end(validator):
    """Validation completed callback."""
    global best_metrics

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

    is_best = mAP50 > best_metrics["mAP50"]
    if is_best:
        best_metrics = {
            "mAP50": mAP50,
            "mAP50_95": mAP50_95,
            "precision": precision,
            "recall": recall,
            "epoch": validator.args.epochs if hasattr(validator.args, 'epochs') else 0
        }

    log(f"Validation: mAP@50={mAP50*100:.2f}%, mAP@50-95={mAP50_95*100:.2f}%, P={precision*100:.2f}%, R={recall*100:.2f}% {'[NEW BEST]' if is_best else ''}")

    # Save progress
    elapsed = time.time() - training_start if training_start else 0
    save_progress(
        validator.args.epochs if hasattr(validator.args, 'epochs') else 0,
        {"mAP50": mAP50, "mAP50_95": mAP50_95, "precision": precision, "recall": recall},
        elapsed
    )


def on_train_end(trainer):
    """Training completed callback."""
    elapsed = time.time() - training_start

    log("=" * 70)
    log("TRAINING COMPLETE")
    log("=" * 70)
    log(f"Total time: {format_time(elapsed)}")
    log(f"Epochs completed: {trainer.epoch + 1}")
    log(f"Best mAP@50: {best_metrics['mAP50']*100:.2f}%")
    log(f"Best mAP@50-95: {best_metrics['mAP50_95']*100:.2f}%")
    log(f"Best precision: {best_metrics['precision']*100:.2f}%")
    log(f"Best recall: {best_metrics['recall']*100:.2f}%")
    log(f"Weights saved: {OUTPUT_DIR}/weights/")
    log("=" * 70)

    # Final save
    save_progress(trainer.epoch + 1, best_metrics, elapsed)


def main():
    """Main training function."""
    log("=" * 70)
    log("BAHB POWER INFRASTRUCTURE DETECTION - YOLO11L TRAINING")
    log("=" * 70)
    log(f"PyTorch: {torch.__version__}")
    log(f"CUDA: {torch.cuda.is_available()}")

    # Verify paths
    if not DATASET_YAML.exists():
        log(f"ERROR: Dataset not found: {DATASET_YAML}", "ERROR")
        sys.exit(1)

    if not RESUME_WEIGHTS.exists():
        log(f"WARNING: Resume weights not found, starting fresh", "WARN")
        model = YOLO("yolo11l.pt")
        CONFIG["resume"] = False
    else:
        log(f"Resuming from: {RESUME_WEIGHTS}")
        model = YOLO(str(RESUME_WEIGHTS))

    # Dataset info
    train_dir = PROJECT_ROOT / "data" / "merged" / "train" / "images"
    val_dir = PROJECT_ROOT / "data" / "merged" / "val" / "images"
    train_count = len(list(train_dir.glob("*"))) if train_dir.exists() else 0
    val_count = len(list(val_dir.glob("*"))) if val_dir.exists() else 0
    log(f"Dataset: {train_count} train / {val_count} val images, 17 classes")

    # Register callbacks
    model.add_callback("on_train_start", on_train_start)
    model.add_callback("on_train_epoch_end", on_train_epoch_end)
    model.add_callback("on_val_end", on_val_end)
    model.add_callback("on_train_end", on_train_end)

    # Start training
    log("Starting training...")
    results = model.train(**CONFIG)

    return results


if __name__ == "__main__":
    main()
