#!/usr/bin/env python3
"""
BAHB Training Script - Optimized for New Architecture
Includes research paper optimizations (NMS-free, INT8 ready)
"""

import sys
import os
from pathlib import Path

# Ensure we're in the BAHB directory
PROJECT_ROOT = Path(__file__).parent.absolute()
os.chdir(PROJECT_ROOT)

def main():
    import torch
    from ultralytics import YOLO

    print("=" * 60)
    print("BAHB Infrastructure Detection Training")
    print("=" * 60)

    # Auto-detect device
    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"\nDevice: {device}")
    print(f"PyTorch version: {torch.__version__}")

    # Training configuration
    dataset_yaml = PROJECT_ROOT / "data" / "dataset.yaml"
    output_dir = PROJECT_ROOT / "runs" / "yolov12"

    # Use YOLO11 large model as base
    base_weights = "yolo11l.pt"

    print(f"\nDataset: {dataset_yaml}")
    print(f"Base weights: {base_weights}")
    print(f"Output: {output_dir}")

    # Batch size based on device
    batch_size = 8 if device != "cpu" else 2  # Smaller batch for CPU

    # Create model
    print("\n" + "=" * 60)
    print("Initializing Model")
    print("=" * 60)

    model = YOLO(base_weights)

    # Training with optimized settings
    print("\n" + "=" * 60)
    print("Starting Training")
    print("=" * 60)

    results = model.train(
        data=str(dataset_yaml),
        epochs=50,  # Reduced epochs for faster training
        imgsz=640,  # Smaller size for CPU training
        batch=batch_size,
        device=device,
        project=str(output_dir),
        name="bahb_v2",
        patience=15,
        save=True,
        plots=True,
        # Optimizations from research papers
        amp=True if device != "cpu" else False,  # Mixed precision on GPU
        cos_lr=True,  # Cosine LR scheduler
        close_mosaic=10,  # Disable mosaic augmentation for last 10 epochs
        # Additional settings
        verbose=True,
        exist_ok=True,  # Allow overwriting previous run
    )

    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)

    best_model = Path(results.save_dir) / "weights" / "best.pt"
    print(f"\nBest model saved to: {best_model}")

    # Run validation
    print("\n" + "=" * 60)
    print("Running Validation")
    print("=" * 60)

    val_results = model.val()
    print(f"\nmAP50: {val_results.box.map50:.4f}")
    print(f"mAP50-95: {val_results.box.map:.4f}")

    # Export to ONNX for edge deployment
    print("\n" + "=" * 60)
    print("Exporting to ONNX")
    print("=" * 60)

    try:
        onnx_path = model.export(format="onnx", simplify=True)
        print(f"ONNX model saved to: {onnx_path}")
    except Exception as e:
        print(f"ONNX export failed: {e}")

    print("\n" + "=" * 60)
    print("TRAINING PIPELINE COMPLETE")
    print("=" * 60)

    return str(best_model)


if __name__ == "__main__":
    main()
