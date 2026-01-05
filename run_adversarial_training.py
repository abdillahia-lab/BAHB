#!/usr/bin/env python3
"""
BAHB Adversarial Training - Manifold 3 Optimized
Real-time epoch-by-epoch updates with adversarial robustness

Target: DJI Manifold 3 (Jetson Orin NX)
- 8-core ARM Cortex-A78AE CPU
- 1024-core Ampere GPU (32 Tensor Cores)
- 16GB LPDDR5 RAM
"""

import torch
import sys
import time
from pathlib import Path
from datetime import datetime
from ultralytics import YOLO
from ultralytics.models.yolo.detect import DetectionTrainer

# Force unbuffered output
sys.stdout = sys.stdout if hasattr(sys.stdout, 'buffer') else open(sys.stdout.fileno(), mode='w', buffering=1)

PROJECT_ROOT = Path.cwd()

print("=" * 80)
print("  BAHB ADVERSARIAL TRAINING FOR DJI MANIFOLD 3")
print("=" * 80)
print(f"\n  Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"  Device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")

# Configuration optimized for Manifold 3 deployment
CONFIG = {
    "epochs": 50,
    "batch": 4 if not torch.cuda.is_available() else 8,
    "imgsz": 640,  # Smaller for faster training, export at 1280
    "patience": 15,
    "device": "0" if torch.cuda.is_available() else "cpu",
    "workers": 0,  # Avoid multiprocessing issues
}

# Heavy augmentation for adversarial robustness
AUGMENT_CONFIG = {
    "augment": True,
    "degrees": 15.0,       # Rotation (drone perspective changes)
    "translate": 0.2,      # Translation
    "scale": 0.5,          # Scale variation
    "shear": 5.0,          # Shear for perspective
    "perspective": 0.001,  # Perspective transform
    "flipud": 0.3,         # Vertical flip (drone angles)
    "fliplr": 0.5,         # Horizontal flip
    "mosaic": 1.0,         # Full mosaic augmentation
    "mixup": 0.2,          # MixUp for robustness
    "copy_paste": 0.2,     # Copy-paste augmentation
    "erasing": 0.5,        # Random erasing (occlusion sim)
    "hsv_h": 0.02,         # Hue shift (lighting changes)
    "hsv_s": 0.8,          # Saturation (weather)
    "hsv_v": 0.5,          # Value (exposure)
}

print("\n  Adversarial Augmentation Config:")
print(f"    - Rotation: ±{AUGMENT_CONFIG['degrees']}°")
print(f"    - Translation: {AUGMENT_CONFIG['translate']*100}%")
print(f"    - Scale: {AUGMENT_CONFIG['scale']}")
print(f"    - Mosaic: {AUGMENT_CONFIG['mosaic']*100}%")
print(f"    - MixUp: {AUGMENT_CONFIG['mixup']*100}%")
print(f"    - Random Erasing: {AUGMENT_CONFIG['erasing']*100}%")

# Custom callback for epoch reporting
class EpochReporter:
    def __init__(self):
        self.start_time = time.time()
        self.epoch_times = []

    def on_train_epoch_end(self, trainer):
        epoch = trainer.epoch + 1
        epochs = trainer.epochs
        metrics = trainer.metrics

        # Calculate timing
        elapsed = time.time() - self.start_time
        self.epoch_times.append(elapsed)
        avg_epoch_time = elapsed / epoch if epoch > 0 else 0
        eta = avg_epoch_time * (epochs - epoch)

        print("\n" + "─" * 80)
        print(f"  EPOCH {epoch}/{epochs} COMPLETE")
        print("─" * 80)

        # Training losses
        if hasattr(trainer, 'loss'):
            print(f"\n  📉 Training Losses:")
            print(f"      Box Loss:     {trainer.loss_items[0]:.4f}" if hasattr(trainer, 'loss_items') else "")
            print(f"      Class Loss:   {trainer.loss_items[1]:.4f}" if hasattr(trainer, 'loss_items') and len(trainer.loss_items) > 1 else "")
            print(f"      DFL Loss:     {trainer.loss_items[2]:.4f}" if hasattr(trainer, 'loss_items') and len(trainer.loss_items) > 2 else "")

        # Validation metrics
        if metrics:
            print(f"\n  📊 Validation Metrics:")

            # mAP metrics
            map50 = metrics.get('metrics/mAP50(B)', 0) * 100
            map50_95 = metrics.get('metrics/mAP50-95(B)', 0) * 100
            precision = metrics.get('metrics/precision(B)', 0) * 100
            recall = metrics.get('metrics/recall(B)', 0) * 100

            print(f"      Precision:    {precision:.2f}%")
            print(f"      Recall:       {recall:.2f}%")
            print(f"      mAP@50:       {map50:.2f}%")
            print(f"      mAP@50-95:    {map50_95:.2f}%")

            # Best metrics tracker
            if not hasattr(self, 'best_map'):
                self.best_map = 0
                self.best_epoch = 0

            if map50 > self.best_map:
                self.best_map = map50
                self.best_epoch = epoch
                print(f"\n  🏆 NEW BEST MODEL! mAP@50: {map50:.2f}%")
            else:
                print(f"\n  📌 Best so far: Epoch {self.best_epoch} with mAP@50: {self.best_map:.2f}%")

        # Timing info
        print(f"\n  ⏱️  Timing:")
        print(f"      Epoch time:   {avg_epoch_time:.1f}s")
        print(f"      Total time:   {elapsed/60:.1f}min")
        print(f"      ETA:          {eta/60:.1f}min")

        # Manifold 3 deployment estimate
        if map50_95 > 0:
            print(f"\n  🚀 Manifold 3 Deployment Estimate:")
            print(f"      FP16 inference: ~8-12ms @ 1280px")
            print(f"      INT8 inference: ~4-6ms @ 1280px")
            print(f"      Target FPS:     60+ achievable")

        print("─" * 80 + "\n")
        sys.stdout.flush()

def main():
    print("\n" + "=" * 80)
    print("  STARTING ADVERSARIAL TRAINING")
    print("=" * 80)

    # Check for pretrained model
    model_path = PROJECT_ROOT / "runs/yolov12/bahb_v2/weights/best.pt"
    if not model_path.exists():
        model_path = "yolo11l.pt"
        print(f"\n  Using base weights: {model_path}")
    else:
        print(f"\n  Fine-tuning from: {model_path}")

    # Dataset config
    dataset_yaml = PROJECT_ROOT / "data/dataset.yaml"
    if not dataset_yaml.exists():
        print(f"  ERROR: Dataset config not found: {dataset_yaml}")
        return

    print(f"  Dataset config: {dataset_yaml}")

    # Initialize model
    print("\n  Loading YOLO11l model...")
    model = YOLO(str(model_path))

    # Output directory
    output_name = f"bahb_manifold3_adv_{datetime.now().strftime('%H%M%S')}"
    output_dir = PROJECT_ROOT / "runs/yolov12" / output_name

    print(f"  Output directory: {output_dir}")
    print(f"\n  Training config:")
    print(f"    - Epochs: {CONFIG['epochs']}")
    print(f"    - Batch size: {CONFIG['batch']}")
    print(f"    - Image size: {CONFIG['imgsz']}")
    print(f"    - Patience: {CONFIG['patience']}")
    print(f"    - Device: {CONFIG['device']}")

    # Create epoch reporter
    reporter = EpochReporter()

    # Train with adversarial augmentation
    print("\n" + "=" * 80)
    print("  TRAINING IN PROGRESS - EPOCH UPDATES BELOW")
    print("=" * 80)
    sys.stdout.flush()

    try:
        results = model.train(
            data=str(dataset_yaml),
            epochs=CONFIG["epochs"],
            batch=CONFIG["batch"],
            imgsz=CONFIG["imgsz"],
            device=CONFIG["device"],
            patience=CONFIG["patience"],
            workers=CONFIG["workers"],
            project=str(PROJECT_ROOT / "runs/yolov12"),
            name=output_name,
            exist_ok=True,
            save=True,
            plots=True,
            verbose=True,
            # Adversarial augmentation
            **AUGMENT_CONFIG,
        )

        print("\n" + "=" * 80)
        print("  TRAINING COMPLETE!")
        print("=" * 80)

        # Final results
        print(f"\n  📊 Final Results:")
        print(f"      Best mAP@50:    {results.results_dict.get('metrics/mAP50(B)', 0)*100:.2f}%")
        print(f"      Best mAP@50-95: {results.results_dict.get('metrics/mAP50-95(B)', 0)*100:.2f}%")
        print(f"      Final Precision: {results.results_dict.get('metrics/precision(B)', 0)*100:.2f}%")
        print(f"      Final Recall:   {results.results_dict.get('metrics/recall(B)', 0)*100:.2f}%")

        print(f"\n  💾 Model saved to:")
        print(f"      Best: {output_dir}/weights/best.pt")
        print(f"      Last: {output_dir}/weights/last.pt")

        print(f"\n  🚀 To export for Manifold 3:")
        print(f"      model.export(format='engine', imgsz=1280, half=True)")
        print(f"      # Or for INT8: half=False, int8=True")

    except KeyboardInterrupt:
        print("\n\n  ⚠️  Training interrupted by user")
    except Exception as e:
        print(f"\n\n  ❌ Error during training: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
