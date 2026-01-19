#!/usr/bin/env python3
"""
TensorRT INT8 Export Script for YOLO26l Infrastructure Detection

This script must be run on the target device (DJI Manifold 3 / Jetson Orin NX)
with TensorRT installed and CUDA available.

Usage:
    python export_tensorrt.py --model best.pt --format fp16
    python export_tensorrt.py --model best.pt --format int8 --calibration-images ./calib_data
"""

import argparse
import sys
import time
from pathlib import Path


def check_requirements():
    """Check if TensorRT and CUDA are available."""
    try:
        import torch
        if not torch.cuda.is_available():
            print("ERROR: CUDA not available. TensorRT export requires GPU.")
            print("This script must be run on DJI Manifold 3 (Jetson Orin NX)")
            return False

        print(f"CUDA available: {torch.cuda.get_device_name(0)}")
        print(f"CUDA version: {torch.version.cuda}")

    except ImportError:
        print("ERROR: PyTorch not available")
        return False

    try:
        import tensorrt as trt
        print(f"TensorRT version: {trt.__version__}")
    except ImportError:
        print("WARNING: tensorrt module not found, using YOLO built-in export")

    return True


def export_tensorrt(
    model_path: str,
    format: str = "fp16",
    imgsz: int = 640,
    calibration_data: str = None,
    workspace: int = 8,  # GB
    batch_size: int = 1,
):
    """
    Export model to TensorRT format.

    Args:
        model_path: Path to .pt model file
        format: 'fp32', 'fp16', or 'int8'
        imgsz: Input image size
        calibration_data: Path to calibration images (required for INT8)
        workspace: TensorRT workspace size in GB
        batch_size: Batch size for optimization
    """
    from ultralytics import YOLO

    print("=" * 60)
    print(f"TENSORRT EXPORT - {format.upper()}")
    print("=" * 60)

    # Load model
    print(f"\nLoading model: {model_path}")
    model = YOLO(model_path)

    # Export settings
    export_kwargs = {
        "format": "engine",
        "imgsz": imgsz,
        "half": format in ["fp16", "int8"],
        "int8": format == "int8",
        "device": 0,
        "workspace": workspace,
        "batch": batch_size,
        "simplify": True,
        "dynamic": False,  # Fixed size for best performance
    }

    # INT8 requires calibration data
    if format == "int8":
        if calibration_data is None:
            print("\nERROR: INT8 quantization requires calibration data")
            print("Usage: --calibration-images /path/to/calibration/images")
            return None

        if not Path(calibration_data).exists():
            print(f"\nERROR: Calibration data path not found: {calibration_data}")
            return None

        export_kwargs["data"] = calibration_data
        print(f"\nUsing calibration data: {calibration_data}")

    # Export
    print(f"\nExporting with settings:")
    for k, v in export_kwargs.items():
        print(f"  {k}: {v}")

    print("\nStarting export (this may take several minutes)...")
    start_time = time.time()

    try:
        engine_path = model.export(**export_kwargs)
        export_time = time.time() - start_time

        print(f"\n✓ Export successful!")
        print(f"  Engine path: {engine_path}")
        print(f"  Export time: {export_time:.1f}s")

        # Get file size
        import os
        size_mb = os.path.getsize(engine_path) / (1024 * 1024)
        print(f"  Engine size: {size_mb:.1f} MB")

        return engine_path

    except Exception as e:
        print(f"\nERROR: Export failed: {e}")
        return None


def benchmark_engine(engine_path: str, imgsz: int = 640, warmup: int = 10, iterations: int = 100):
    """
    Benchmark TensorRT engine performance.

    Args:
        engine_path: Path to .engine file
        imgsz: Input image size
        warmup: Number of warmup iterations
        iterations: Number of benchmark iterations
    """
    from ultralytics import YOLO
    import numpy as np
    import torch

    print("\n" + "=" * 60)
    print("PERFORMANCE BENCHMARK")
    print("=" * 60)

    # Load engine
    print(f"\nLoading engine: {engine_path}")
    model = YOLO(engine_path)

    # Create dummy input
    dummy_input = np.random.randint(0, 255, (imgsz, imgsz, 3), dtype=np.uint8)

    # Warmup
    print(f"\nWarmup ({warmup} iterations)...")
    for _ in range(warmup):
        model(dummy_input, verbose=False)

    # Synchronize
    torch.cuda.synchronize()

    # Benchmark
    print(f"Benchmarking ({iterations} iterations)...")
    times = []

    for _ in range(iterations):
        start = time.perf_counter()
        model(dummy_input, verbose=False)
        torch.cuda.synchronize()
        times.append((time.perf_counter() - start) * 1000)  # ms

    # Calculate statistics
    times = np.array(times)
    avg_time = np.mean(times)
    std_time = np.std(times)
    min_time = np.min(times)
    max_time = np.max(times)
    fps = 1000.0 / avg_time

    print("\n" + "-" * 40)
    print("RESULTS:")
    print("-" * 40)
    print(f"  Average latency: {avg_time:.2f} ms")
    print(f"  Std deviation:   {std_time:.2f} ms")
    print(f"  Min latency:     {min_time:.2f} ms")
    print(f"  Max latency:     {max_time:.2f} ms")
    print(f"  Throughput:      {fps:.1f} FPS")
    print("-" * 40)

    return {
        "avg_latency_ms": avg_time,
        "std_latency_ms": std_time,
        "min_latency_ms": min_time,
        "max_latency_ms": max_time,
        "fps": fps,
    }


def main():
    parser = argparse.ArgumentParser(description="TensorRT Export for YOLO26l")
    parser.add_argument("--model", type=str, default="runs/yolo26l_infrastructure/weights/best.pt",
                        help="Path to model weights")
    parser.add_argument("--format", type=str, choices=["fp32", "fp16", "int8"], default="fp16",
                        help="Export format")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size")
    parser.add_argument("--calibration-images", type=str, default=None,
                        help="Path to calibration images for INT8")
    parser.add_argument("--workspace", type=int, default=8, help="TensorRT workspace (GB)")
    parser.add_argument("--batch", type=int, default=1, help="Batch size")
    parser.add_argument("--benchmark", action="store_true", help="Run benchmark after export")
    parser.add_argument("--benchmark-only", type=str, default=None,
                        help="Only run benchmark on existing engine")

    args = parser.parse_args()

    # Check requirements
    if not check_requirements():
        sys.exit(1)

    # Benchmark only mode
    if args.benchmark_only:
        benchmark_engine(args.benchmark_only, args.imgsz)
        return

    # Export
    engine_path = export_tensorrt(
        model_path=args.model,
        format=args.format,
        imgsz=args.imgsz,
        calibration_data=args.calibration_images,
        workspace=args.workspace,
        batch_size=args.batch,
    )

    if engine_path is None:
        sys.exit(1)

    # Benchmark
    if args.benchmark:
        benchmark_engine(engine_path, args.imgsz)

    print("\n" + "=" * 60)
    print("EXPORT COMPLETE")
    print("=" * 60)
    print(f"\nTo deploy on Manifold 3:")
    print(f"  1. Copy {engine_path} to the device")
    print(f"  2. Load with: model = YOLO('{Path(engine_path).name}')")
    print(f"  3. Run inference: results = model(frame)")


if __name__ == "__main__":
    main()
