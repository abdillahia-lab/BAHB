#!/usr/bin/env python3
"""
Benchmark TensorRT engine performance.
Measures latency, throughput, memory usage, and power consumption.
"""

import os
import sys
import time
import json
import argparse
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
from collections import defaultdict

import cv2
import numpy as np
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit
from tqdm import tqdm


class TensorRTBenchmark:
    """Benchmark TensorRT engine performance."""

    def __init__(
        self,
        engine_path: str,
        input_shape: tuple = (1, 3, 640, 640),
        warmup_iterations: int = 50,
        benchmark_iterations: int = 1000
    ):
        """
        Initialize benchmark.

        Args:
            engine_path: Path to TensorRT engine
            input_shape: Input tensor shape (NCHW)
            warmup_iterations: Number of warmup iterations
            benchmark_iterations: Number of benchmark iterations
        """
        self.engine_path = engine_path
        self.input_shape = input_shape
        self.warmup_iterations = warmup_iterations
        self.benchmark_iterations = benchmark_iterations

        print(f"Loading engine: {engine_path}")

        # Load engine
        with open(engine_path, 'rb') as f:
            runtime = trt.Runtime(trt.Logger(trt.Logger.WARNING))
            self.engine = runtime.deserialize_cuda_engine(f.read())

        if self.engine is None:
            raise RuntimeError(f"Failed to load engine from {engine_path}")

        self.context = self.engine.create_execution_context()

        # Allocate buffers
        self._allocate_buffers()

        # Create CUDA stream
        self.stream = cuda.Stream()

    def _allocate_buffers(self):
        """Allocate input/output buffers."""
        self.inputs = []
        self.outputs = []
        self.bindings = []

        for binding in range(self.engine.num_bindings):
            shape = self.engine.get_binding_shape(binding)
            size = trt.volume(shape)
            dtype = trt.nptype(self.engine.get_binding_dtype(binding))

            # Allocate host and device buffers
            host_mem = cuda.pagelocked_empty(size, dtype)
            device_mem = cuda.mem_alloc(host_mem.nbytes)

            self.bindings.append(int(device_mem))

            if self.engine.binding_is_input(binding):
                self.inputs.append({
                    'host': host_mem,
                    'device': device_mem,
                    'shape': shape,
                    'dtype': dtype
                })
            else:
                self.outputs.append({
                    'host': host_mem,
                    'device': device_mem,
                    'shape': shape,
                    'dtype': dtype
                })

    def warmup(self):
        """Run warmup iterations."""
        print(f"\nRunning {self.warmup_iterations} warmup iterations...")

        # Create dummy input
        dummy_input = np.random.randn(*self.input_shape).astype(np.float32)

        for _ in tqdm(range(self.warmup_iterations), desc="Warmup"):
            self._infer(dummy_input)

    def _infer(self, input_data: np.ndarray) -> List[np.ndarray]:
        """Run single inference."""
        # Copy input to device
        np.copyto(self.inputs[0]['host'], input_data.ravel())
        cuda.memcpy_htod_async(
            self.inputs[0]['device'],
            self.inputs[0]['host'],
            self.stream
        )

        # Run inference
        self.context.execute_async_v2(
            bindings=self.bindings,
            stream_handle=self.stream.handle
        )

        # Copy outputs back to host
        outputs = []
        for output_info in self.outputs:
            cuda.memcpy_dtoh_async(
                output_info['host'],
                output_info['device'],
                self.stream
            )
            outputs.append(output_info['host'].reshape(output_info['shape']))

        self.stream.synchronize()

        return outputs

    def benchmark_latency(self) -> Dict[str, float]:
        """
        Benchmark inference latency.

        Returns:
            Latency statistics (mean, p50, p95, p99, min, max)
        """
        print(f"\nBenchmarking latency ({self.benchmark_iterations} iterations)...")

        # Create dummy input
        dummy_input = np.random.randn(*self.input_shape).astype(np.float32)

        latencies = []

        for _ in tqdm(range(self.benchmark_iterations), desc="Latency benchmark"):
            start = time.perf_counter()
            self._infer(dummy_input)
            end = time.perf_counter()

            latency_ms = (end - start) * 1000
            latencies.append(latency_ms)

        latencies = np.array(latencies)

        stats = {
            'mean_ms': float(np.mean(latencies)),
            'std_ms': float(np.std(latencies)),
            'min_ms': float(np.min(latencies)),
            'max_ms': float(np.max(latencies)),
            'p50_ms': float(np.percentile(latencies, 50)),
            'p95_ms': float(np.percentile(latencies, 95)),
            'p99_ms': float(np.percentile(latencies, 99))
        }

        print(f"\nLatency Statistics:")
        print(f"  Mean: {stats['mean_ms']:.2f} ms")
        print(f"  Std:  {stats['std_ms']:.2f} ms")
        print(f"  Min:  {stats['min_ms']:.2f} ms")
        print(f"  Max:  {stats['max_ms']:.2f} ms")
        print(f"  P50:  {stats['p50_ms']:.2f} ms")
        print(f"  P95:  {stats['p95_ms']:.2f} ms")
        print(f"  P99:  {stats['p99_ms']:.2f} ms")

        return stats

    def benchmark_throughput(self, duration_seconds: int = 10) -> Dict[str, float]:
        """
        Benchmark throughput.

        Args:
            duration_seconds: Duration to run benchmark

        Returns:
            Throughput statistics
        """
        print(f"\nBenchmarking throughput ({duration_seconds}s duration)...")

        # Create dummy input
        dummy_input = np.random.randn(*self.input_shape).astype(np.float32)

        start_time = time.perf_counter()
        end_time = start_time + duration_seconds
        num_inferences = 0

        with tqdm(desc="Throughput benchmark", unit="infer") as pbar:
            while time.perf_counter() < end_time:
                self._infer(dummy_input)
                num_inferences += 1
                pbar.update(1)

        total_time = time.perf_counter() - start_time

        fps = num_inferences / total_time
        inference_time_ms = (total_time / num_inferences) * 1000

        stats = {
            'total_inferences': num_inferences,
            'total_time_s': total_time,
            'fps': fps,
            'avg_inference_time_ms': inference_time_ms
        }

        print(f"\nThroughput Statistics:")
        print(f"  Total inferences: {num_inferences}")
        print(f"  Total time: {total_time:.2f} s")
        print(f"  FPS: {fps:.2f}")
        print(f"  Avg inference time: {inference_time_ms:.2f} ms")

        return stats

    def measure_memory_usage(self) -> Dict[str, float]:
        """
        Measure memory usage.

        Returns:
            Memory usage statistics
        """
        print("\nMeasuring memory usage...")

        try:
            # Get GPU memory info using nvidia-smi
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=memory.used,memory.free,memory.total',
                 '--format=csv,nounits,noheader'],
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                # Use first GPU
                values = lines[0].split(',')
                used_mb = float(values[0].strip())
                free_mb = float(values[1].strip())
                total_mb = float(values[2].strip())

                stats = {
                    'gpu_memory_used_mb': used_mb,
                    'gpu_memory_free_mb': free_mb,
                    'gpu_memory_total_mb': total_mb,
                    'gpu_memory_usage_percent': (used_mb / total_mb) * 100
                }

                print(f"  GPU Memory Used: {used_mb:.2f} MB")
                print(f"  GPU Memory Free: {free_mb:.2f} MB")
                print(f"  GPU Memory Total: {total_mb:.2f} MB")
                print(f"  GPU Memory Usage: {stats['gpu_memory_usage_percent']:.1f}%")

                return stats

        except Exception as e:
            print(f"  Warning: Failed to measure GPU memory: {e}")

        # Fallback: estimate from engine size
        engine_size_mb = os.path.getsize(self.engine_path) / (1 << 20)

        stats = {
            'engine_size_mb': engine_size_mb,
            'estimated_runtime_mb': engine_size_mb * 1.5  # Rough estimate
        }

        print(f"  Engine size: {engine_size_mb:.2f} MB")
        print(f"  Estimated runtime memory: {stats['estimated_runtime_mb']:.2f} MB")

        return stats

    def estimate_power_consumption(
        self,
        duration_seconds: int = 10
    ) -> Dict[str, float]:
        """
        Estimate power consumption.

        Args:
            duration_seconds: Duration to measure

        Returns:
            Power consumption statistics
        """
        print(f"\nEstimating power consumption ({duration_seconds}s)...")

        # Create dummy input
        dummy_input = np.random.randn(*self.input_shape).astype(np.float32)

        power_readings = []

        start_time = time.perf_counter()
        end_time = start_time + duration_seconds

        try:
            while time.perf_counter() < end_time:
                # Run inference
                self._infer(dummy_input)

                # Read power consumption
                try:
                    result = subprocess.run(
                        ['nvidia-smi', '--query-gpu=power.draw',
                         '--format=csv,nounits,noheader'],
                        capture_output=True,
                        text=True,
                        timeout=1
                    )

                    if result.returncode == 0:
                        lines = result.stdout.strip().split('\n')
                        power_w = float(lines[0].strip())
                        power_readings.append(power_w)

                except Exception:
                    pass

            if power_readings:
                stats = {
                    'avg_power_w': float(np.mean(power_readings)),
                    'min_power_w': float(np.min(power_readings)),
                    'max_power_w': float(np.max(power_readings)),
                    'std_power_w': float(np.std(power_readings))
                }

                print(f"  Average Power: {stats['avg_power_w']:.2f} W")
                print(f"  Min Power: {stats['min_power_w']:.2f} W")
                print(f"  Max Power: {stats['max_power_w']:.2f} W")
                print(f"  Std Power: {stats['std_power_w']:.2f} W")

                return stats

        except Exception as e:
            print(f"  Warning: Failed to measure power: {e}")

        # Return empty stats if measurement failed
        print("  Power measurement not available")
        return {}

    def run_full_benchmark(self) -> Dict:
        """
        Run full benchmark suite.

        Returns:
            Complete benchmark results
        """
        print("="*80)
        print("TensorRT Performance Benchmark")
        print("="*80)
        print(f"\nEngine: {self.engine_path}")
        print(f"Input shape: {self.input_shape}")

        # Warmup
        self.warmup()

        # Run benchmarks
        results = {
            'engine_path': self.engine_path,
            'input_shape': list(self.input_shape),
            'warmup_iterations': self.warmup_iterations,
            'benchmark_iterations': self.benchmark_iterations
        }

        # Latency
        results['latency'] = self.benchmark_latency()

        # Throughput
        results['throughput'] = self.benchmark_throughput(duration_seconds=10)

        # Memory
        results['memory'] = self.measure_memory_usage()

        # Power
        results['power'] = self.estimate_power_consumption(duration_seconds=10)

        print("\n" + "="*80)
        print("Benchmark Summary")
        print("="*80)

        print(f"\nPerformance:")
        print(f"  Latency (P50): {results['latency']['p50_ms']:.2f} ms")
        print(f"  Throughput: {results['throughput']['fps']:.2f} FPS")

        # Check against targets
        target_fps = 55
        fps = results['throughput']['fps']

        print(f"\nTarget Comparison:")
        print(f"  Target FPS: {target_fps}")
        print(f"  Actual FPS: {fps:.2f}")

        if fps >= target_fps:
            print(f"  ✓ Meets FPS target (+{fps - target_fps:.2f} FPS)")
            results['meets_fps_target'] = True
        else:
            print(f"  ✗ Below FPS target (-{target_fps - fps:.2f} FPS)")
            results['meets_fps_target'] = False

        return results

    def __del__(self):
        """Cleanup resources."""
        if hasattr(self, 'stream'):
            del self.stream


def compare_engines(
    engines: List[str],
    labels: Optional[List[str]] = None
) -> Dict:
    """
    Compare multiple engines.

    Args:
        engines: List of engine paths
        labels: Optional labels for engines

    Returns:
        Comparison results
    """
    if labels is None:
        labels = [f"Engine {i}" for i in range(len(engines))]

    print("="*80)
    print("Engine Comparison")
    print("="*80)

    results = {
        'engines': [],
        'comparison': {}
    }

    # Benchmark each engine
    for engine_path, label in zip(engines, labels):
        print(f"\n{'='*80}")
        print(f"Benchmarking: {label}")
        print(f"{'='*80}")

        benchmark = TensorRTBenchmark(engine_path)
        engine_results = benchmark.run_full_benchmark()
        engine_results['label'] = label

        results['engines'].append(engine_results)

    # Compare results
    print("\n" + "="*80)
    print("Comparison Summary")
    print("="*80)

    # Latency comparison
    print("\nLatency (P50):")
    for i, r in enumerate(results['engines']):
        print(f"  {labels[i]:15s}: {r['latency']['p50_ms']:8.2f} ms")

    # Throughput comparison
    print("\nThroughput (FPS):")
    for i, r in enumerate(results['engines']):
        print(f"  {labels[i]:15s}: {r['throughput']['fps']:8.2f} FPS")

    # Speedup
    if len(results['engines']) == 2:
        speedup = (results['engines'][1]['throughput']['fps'] /
                  results['engines'][0]['throughput']['fps'])
        results['comparison']['speedup'] = speedup
        print(f"\nSpeedup: {speedup:.2f}x")

    return results


def main():
    parser = argparse.ArgumentParser(description="Benchmark TensorRT engine")
    parser.add_argument(
        '--engine',
        type=str,
        nargs='+',
        required=True,
        help='Path to TensorRT engine(s)'
    )
    parser.add_argument(
        '--labels',
        type=str,
        nargs='+',
        help='Labels for engines (for comparison)'
    )
    parser.add_argument(
        '--warmup',
        type=int,
        default=50,
        help='Warmup iterations'
    )
    parser.add_argument(
        '--iterations',
        type=int,
        default=1000,
        help='Benchmark iterations'
    )
    parser.add_argument(
        '--output',
        type=str,
        help='Output path for results JSON'
    )
    parser.add_argument(
        '--compare',
        action='store_true',
        help='Compare multiple engines'
    )

    args = parser.parse_args()

    if args.compare and len(args.engine) > 1:
        # Compare mode
        results = compare_engines(args.engine, args.labels)
    else:
        # Single engine benchmark
        benchmark = TensorRTBenchmark(
            engine_path=args.engine[0],
            warmup_iterations=args.warmup,
            benchmark_iterations=args.iterations
        )
        results = benchmark.run_full_benchmark()

    # Save results
    if args.output:
        output_dir = os.path.dirname(args.output)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)

        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)

        print(f"\nResults saved to: {args.output}")

    # Exit code based on performance
    if isinstance(results.get('meets_fps_target'), bool):
        sys.exit(0 if results['meets_fps_target'] else 1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
