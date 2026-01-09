#!/usr/bin/env python3
"""
BAHB Training Script for Merged Dataset
Trains YOLO11l on the combined dataset (InsPLAD + Figshare + BAHB original)
Total: ~18,683 images (13,774 train + 4,909 val)
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

# Project paths
PROJECT_ROOT = Path("/home/user/BAHB")
DATASET_YAML = PROJECT_ROOT / "data" / "merged" / "dataset.yaml"
OUTPUT_DIR = PROJECT_ROOT / "runs" / "yolov11l_merged"

# Training configuration - optimized for larger merged dataset
CONFIG = {
    "model": "yolo11l.pt",
    "data": str(DATASET_YAML),
    "epochs": 100,
    "imgsz": 640,
    "batch": 8 if torch.cuda.is_available() else 4,
    "patience": 20,
    "device": "0" if torch.cuda.is_available() else "cpu",
    "workers": 8 if torch.cuda.is_available() else 4,
    "project": str(OUTPUT_DIR.parent),
    "name": OUTPUT_DIR.name,
    "exist_ok": True,
    "pretrained": True,
    "optimizer": "AdamW",
    "lr0": 0.001,
    "lrf": 0.01,
    "momentum": 0.937,
    "weight_decay": 0.0005,
    "warmup_epochs": 3,
    "warmup_momentum": 0.8,
    "warmup_bias_lr": 0.1,
    "box": 7.5,
    "cls": 0.5,
    "dfl": 1.5,
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
    "save": True,
    "save_period": 10,
    "plots": True,
    "verbose": True,
}

# Tracking variables
training_start_time = None
epoch_times = []
best_metrics = {
    "mAP50": 0,
    "mAP50-95": 0,
    "precision": 0,
    "recall": 0,
    "epoch": 0
}


def print_header(text, char="="):
    """Print formatted header"""
    width = 80
    print(f"\n{char * width}")
    print(f"{text.center(width)}")
    print(f"{char * width}\n")


def format_time(seconds):
    """Format seconds to human readable"""
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        return f"{seconds/60:.1f}m"
    else:
        return f"{seconds/3600:.1f}h"


def on_train_start(trainer):
    """Called when training starts"""
    global training_start_time
    training_start_time = time.time()

    print_header("BAHB MERGED DATASET TRAINING STARTED", "=")
    print(f"  Start Time:     {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Model:          {CONFIG['model']}")
    print(f"  Dataset:        {CONFIG['data']}")
    print(f"  Epochs:         {CONFIG['epochs']}")
    print(f"  Image Size:     {CONFIG['imgsz']}")
    print(f"  Batch Size:     {CONFIG['batch']}")
    print(f"  Device:         {CONFIG['device']}")
    print(f"  Output:         {OUTPUT_DIR}")
    print()


def on_train_epoch_end(trainer):
    """Called at end of each training epoch"""
    global epoch_times

    epoch = trainer.epoch + 1
    total = trainer.epochs

    epoch_time = time.time() - (training_start_time + sum(epoch_times))
    epoch_times.append(epoch_time)

    elapsed = time.time() - training_start_time
    avg_epoch_time = elapsed / epoch
    remaining = avg_epoch_time * (total - epoch)
    eta = datetime.now() + timedelta(seconds=remaining)

    print(f"\n  Epoch {epoch}/{total} - Time: {format_time(epoch_time)} - ETA: {eta.strftime('%H:%M:%S')}")


def on_val_end(validator):
    """Called after validation"""
    global best_metrics

    metrics = validator.metrics

    if hasattr(metrics, 'box'):
        mAP50 = metrics.box.map50 if hasattr(metrics.box, 'map50') else 0
        mAP50_95 = metrics.box.map if hasattr(metrics.box, 'map') else 0
        precision = metrics.box.mp if hasattr(metrics.box, 'mp') else 0
        recall = metrics.box.mr if hasattr(metrics.box, 'mr') else 0
    else:
        mAP50 = getattr(metrics, 'map50', 0) or 0
        mAP50_95 = getattr(metrics, 'map', 0) or 0
        precision = getattr(metrics, 'mp', 0) or 0
        recall = getattr(metrics, 'mr', 0) or 0

    is_best = mAP50 > best_metrics["mAP50"]
    if is_best:
        best_metrics = {
            "mAP50": mAP50,
            "mAP50-95": mAP50_95,
            "precision": precision,
            "recall": recall,
            "epoch": validator.args.epochs if hasattr(validator.args, 'epochs') else 0
        }

    print(f"  mAP@50: {mAP50*100:.2f}% | mAP@50-95: {mAP50_95*100:.2f}% | P: {precision*100:.2f}% | R: {recall*100:.2f}%", end="")
    if is_best:
        print(" [NEW BEST]")
    else:
        print()


def on_train_end(trainer):
    """Called when training ends"""
    elapsed = time.time() - training_start_time

    print_header("TRAINING COMPLETE", "=")
    print(f"  Total Time:     {format_time(elapsed)}")
    print(f"  Epochs Run:     {trainer.epoch + 1}")
    print(f"\n  BEST METRICS:")
    print(f"    mAP@50:     {best_metrics['mAP50']*100:.2f}%")
    print(f"    mAP@50-95:  {best_metrics['mAP50-95']*100:.2f}%")
    print(f"    Precision:  {best_metrics['precision']*100:.2f}%")
    print(f"    Recall:     {best_metrics['recall']*100:.2f}%")
    print(f"\n  Best weights: {OUTPUT_DIR}/weights/best.pt")

    summary = {
        "training_time_seconds": elapsed,
        "epochs_completed": trainer.epoch + 1,
        "best_metrics": best_metrics,
        "dataset": {
            "train_images": 13774,
            "val_images": 4909,
            "sources": ["InsPLAD", "Figshare Substation", "BAHB Original"]
        },
        "config": CONFIG
    }
    summary_path = OUTPUT_DIR / "training_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"  Summary saved: {summary_path}")


def main():
    """Main training function"""
    print_header("BAHB MERGED DATASET TRAINING", "=")
    print(f"  PyTorch Version: {torch.__version__}")
    print(f"  CUDA Available:  {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"  GPU:             {torch.cuda.get_device_name(0)}")
    print()

    # Verify dataset exists
    if not DATASET_YAML.exists():
        print(f"ERROR: Dataset not found at {DATASET_YAML}")
        print("Run scripts/merge_datasets.py first to create the merged dataset")
        sys.exit(1)

    train_dir = PROJECT_ROOT / "data" / "merged" / "train" / "images"
    val_dir = PROJECT_ROOT / "data" / "merged" / "val" / "images"

    train_count = len(list(train_dir.glob("*"))) if train_dir.exists() else 0
    val_count = len(list(val_dir.glob("*"))) if val_dir.exists() else 0

    print(f"  Dataset: {train_count} train / {val_count} val images")
    print(f"  Classes: 17 (power infrastructure)")
    print(f"  Sources: InsPLAD + Figshare Substation + BAHB Original")
    print()

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load model
    print("Loading YOLO11l model...")
    model = YOLO(CONFIG["model"])

    # Register callbacks
    model.add_callback("on_train_start", on_train_start)
    model.add_callback("on_train_epoch_end", on_train_epoch_end)
    model.add_callback("on_val_end", on_val_end)
    model.add_callback("on_train_end", on_train_end)

    # Start training
    print("Starting training...")
    results = model.train(**CONFIG)

    return results


if __name__ == "__main__":
    main()
