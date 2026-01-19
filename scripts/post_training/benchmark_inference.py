#!/usr/bin/env python3
"""
Inference Benchmarking Script for YOLO26l Infrastructure Detection

Compares performance across different model formats:
- PyTorch (.pt)
- ONNX (.onnx)
- TensorRT (.engine)

Usage:
    python benchmark_inference.py --pt best.pt --onnx best.onnx --iterations 100
"""

import argparse
import time
import json
import numpy as np
from pathlib import Path
from datetime import datetime


def benchmark_pytorch(model_path: str, imgsz: int = 640, iterations: int = 100, warmup: int = 10):
    """Benchmark PyTorch model."""
    from ultralytics import YOLO
    import torch

    print(f"\n{'='*50}")
    print(f"PYTORCH BENCHMARK: {model_path}")
    print(f"{'='*50}")

    model = YOLO(model_path)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    # Dummy input
    dummy = np.random.randint(0, 255, (imgsz, imgsz, 3), dtype=np.uint8)

    # Warmup
    print(f"Warmup ({warmup} iterations)...")
    for _ in range(warmup):
        model(dummy, verbose=False)

    if device == "cuda":
        torch.cuda.synchronize()

    # Benchmark
    print(f"Benchmarking ({iterations} iterations)...")
    times = []

    for i in range(iterations):
        start = time.perf_counter()
        model(dummy, verbose=False)
        if device == "cuda":
            torch.cuda.synchronize()
        times.append((time.perf_counter() - start) * 1000)

        if (i + 1) % 20 == 0:
            print(f"  Progress: {i+1}/{iterations}")

    times = np.array(times)
    return {
        "format": "pytorch",
        "device": device,
        "avg_ms": float(np.mean(times)),
        "std_ms": float(np.std(times)),
        "min_ms": float(np.min(times)),
        "max_ms": float(np.max(times)),
        "fps": float(1000.0 / np.mean(times)),
    }


def benchmark_onnx(model_path: str, imgsz: int = 640, iterations: int = 100, warmup: int = 10):
    """Benchmark ONNX model."""
    import onnxruntime as ort

    print(f"\n{'='*50}")
    print(f"ONNX BENCHMARK: {model_path}")
    print(f"{'='*50}")

    # Determine providers
    available_providers = ort.get_available_providers()
    print(f"Available providers: {available_providers}")

    if "CUDAExecutionProvider" in available_providers:
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
        device = "cuda"
    else:
        providers = ["CPUExecutionProvider"]
        device = "cpu"

    print(f"Using device: {device}")

    # Load model
    sess_options = ort.SessionOptions()
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    session = ort.InferenceSession(model_path, sess_options, providers=providers)

    # Get input details
    input_name = session.get_inputs()[0].name
    input_shape = session.get_inputs()[0].shape
    print(f"Input: {input_name} {input_shape}")

    # Create dummy input (NCHW format)
    dummy = np.random.rand(1, 3, imgsz, imgsz).astype(np.float32)

    # Warmup
    print(f"Warmup ({warmup} iterations)...")
    for _ in range(warmup):
        session.run(None, {input_name: dummy})

    # Benchmark
    print(f"Benchmarking ({iterations} iterations)...")
    times = []

    for i in range(iterations):
        start = time.perf_counter()
        session.run(None, {input_name: dummy})
        times.append((time.perf_counter() - start) * 1000)

        if (i + 1) % 20 == 0:
            print(f"  Progress: {i+1}/{iterations}")

    times = np.array(times)
    return {
        "format": "onnx",
        "device": device,
        "avg_ms": float(np.mean(times)),
        "std_ms": float(np.std(times)),
        "min_ms": float(np.min(times)),
        "max_ms": float(np.max(times)),
        "fps": float(1000.0 / np.mean(times)),
    }


def benchmark_tensorrt(model_path: str, imgsz: int = 640, iterations: int = 100, warmup: int = 10):
    """Benchmark TensorRT engine."""
    from ultralytics import YOLO
    import torch

    if not torch.cuda.is_available():
        print("TensorRT requires CUDA. Skipping.")
        return None

    print(f"\n{'='*50}")
    print(f"TENSORRT BENCHMARK: {model_path}")
    print(f"{'='*50}")

    model = YOLO(model_path)

    # Dummy input
    dummy = np.random.randint(0, 255, (imgsz, imgsz, 3), dtype=np.uint8)

    # Warmup
    print(f"Warmup ({warmup} iterations)...")
    for _ in range(warmup):
        model(dummy, verbose=False)
    torch.cuda.synchronize()

    # Benchmark
    print(f"Benchmarking ({iterations} iterations)...")
    times = []

    for i in range(iterations):
        start = time.perf_counter()
        model(dummy, verbose=False)
        torch.cuda.synchronize()
        times.append((time.perf_counter() - start) * 1000)

        if (i + 1) % 20 == 0:
            print(f"  Progress: {i+1}/{iterations}")

    times = np.array(times)
    return {
        "format": "tensorrt",
        "device": "cuda",
        "avg_ms": float(np.mean(times)),
        "std_ms": float(np.std(times)),
        "min_ms": float(np.min(times)),
        "max_ms": float(np.max(times)),
        "fps": float(1000.0 / np.mean(times)),
    }


def print_results(results: dict):
    """Print benchmark results in a nice table."""
    print("\n" + "=" * 70)
    print("BENCHMARK RESULTS SUMMARY")
    print("=" * 70)

    print(f"\n{'Format':<15} {'Device':<8} {'Avg (ms)':<12} {'FPS':<10} {'Std (ms)':<12}")
    print("-" * 70)

    for r in results:
        if r is not None:
            print(f"{r['format']:<15} {r['device']:<8} {r['avg_ms']:<12.2f} {r['fps']:<10.1f} {r['std_ms']:<12.2f}")

    print("-" * 70)

    # Calculate speedups relative to PyTorch CPU
    pytorch_cpu = next((r for r in results if r and r['format'] == 'pytorch'), None)
    if pytorch_cpu:
        print("\nSpeedups vs PyTorch:")
        for r in results:
            if r and r != pytorch_cpu:
                speedup = pytorch_cpu['avg_ms'] / r['avg_ms']
                print(f"  {r['format']} ({r['device']}): {speedup:.2f}x faster")


def main():
    parser = argparse.ArgumentParser(description="Benchmark YOLO26l inference")
    parser.add_argument("--pt", type=str, default="runs/yolo26l_infrastructure/weights/best.pt",
                        help="PyTorch model path")
    parser.add_argument("--onnx", type=str, default="models/onnx/yolo26l_infrastructure.onnx",
                        help="ONNX model path")
    parser.add_argument("--engine", type=str, default=None,
                        help="TensorRT engine path")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size")
    parser.add_argument("--iterations", type=int, default=100, help="Benchmark iterations")
    parser.add_argument("--warmup", type=int, default=10, help="Warmup iterations")
    parser.add_argument("--output", type=str, default="benchmark_results.json",
                        help="Output JSON file")

    args = parser.parse_args()

    results = []

    # PyTorch
    if args.pt and Path(args.pt).exists():
        results.append(benchmark_pytorch(args.pt, args.imgsz, args.iterations, args.warmup))
    else:
        print(f"PyTorch model not found: {args.pt}")

    # ONNX
    if args.onnx and Path(args.onnx).exists():
        results.append(benchmark_onnx(args.onnx, args.imgsz, args.iterations, args.warmup))
    else:
        print(f"ONNX model not found: {args.onnx}")

    # TensorRT
    if args.engine and Path(args.engine).exists():
        result = benchmark_tensorrt(args.engine, args.imgsz, args.iterations, args.warmup)
        if result:
            results.append(result)
    else:
        print(f"TensorRT engine not found: {args.engine}")

    # Print summary
    print_results(results)

    # Save results
    output = {
        "timestamp": datetime.now().isoformat(),
        "settings": {
            "imgsz": args.imgsz,
            "iterations": args.iterations,
            "warmup": args.warmup,
        },
        "results": results,
    }

    output_path = Path(args.output)
    output_path.write_text(json.dumps(output, indent=2))
    print(f"\nResults saved to: {output_path}")


if __name__ == "__main__":
    main()
