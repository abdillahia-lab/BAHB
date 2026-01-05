#!/usr/bin/env python3
"""
BAHB Performance Benchmarking Suite

Comprehensive performance testing for BAHB models across different hardware configurations.
Measures latency, throughput, memory usage, and power consumption.

Usage:
    # Benchmark single model
    python benchmark.py --model yolov12 --hardware orin_nx --iterations 1000

    # Full system benchmark
    python benchmark.py --full-pipeline --hardware orin_nx --duration 300

    # Compare configurations
    python benchmark.py --compare fp16 int8 --model yolov12

    # Generate report
    python benchmark.py --report --output benchmark_results.json
"""

import argparse
import json
import time
import psutil
import sys
from collections import defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Dict, Optional, Tuple

import cv2
import numpy as np
from loguru import logger
from tqdm import tqdm

# Add BAHB to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


@dataclass
class BenchmarkResult:
    """Single benchmark result."""
    model_name: str
    hardware: str
    precision: str
    batch_size: int

    # Latency metrics (ms)
    latency_mean: float
    latency_std: float
    latency_p50: float
    latency_p95: float
    latency_p99: float
    latency_min: float
    latency_max: float

    # Throughput
    fps_mean: float
    fps_std: float
    throughput: float  # items/sec

    # Memory (MB)
    memory_used: float
    memory_peak: float

    # GPU metrics
    gpu_utilization: float
    gpu_memory_used: float
    gpu_power_draw: float  # Watts

    # Accuracy (if available)
    accuracy: Optional[float] = None
    mAP50: Optional[float] = None
    mAP50_95: Optional[float] = None

    # Metadata
    num_iterations: int = 0
    total_time: float = 0.0
    timestamp: str = ""


class PerformanceMonitor:
    """Monitor system performance during benchmarking."""

    def __init__(self):
        self.gpu_available = self._check_gpu()
        self.process = psutil.Process()

        # Metrics storage
        self.latencies = []
        self.memory_samples = []
        self.gpu_samples = []

    def _check_gpu(self) -> bool:
        """Check if GPU monitoring is available."""
        try:
            import pynvml
            pynvml.nvmlInit()
            return True
        except:
            logger.warning("GPU monitoring not available (pynvml not installed)")
            return False

    def start_iteration(self):
        """Start timing an iteration."""
        self.iter_start = time.perf_counter()

    def end_iteration(self):
        """End timing and record metrics."""
        latency = (time.perf_counter() - self.iter_start) * 1000  # ms
        self.latencies.append(latency)

        # Sample memory
        mem_info = self.process.memory_info()
        self.memory_samples.append(mem_info.rss / (1024 ** 2))  # MB

        # Sample GPU if available
        if self.gpu_available:
            try:
                import pynvml
                handle = pynvml.nvmlDeviceGetHandleByIndex(0)

                gpu_util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                gpu_mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
                gpu_power = pynvml.nvmlDeviceGetPowerUsage(handle) / 1000.0  # mW to W

                self.gpu_samples.append({
                    'utilization': gpu_util.gpu,
                    'memory': gpu_mem.used / (1024 ** 2),  # MB
                    'power': gpu_power,
                })
            except:
                pass

    def get_stats(self) -> dict:
        """Get aggregated statistics."""
        latencies = np.array(self.latencies)
        memory = np.array(self.memory_samples)

        stats = {
            'latency_mean': float(np.mean(latencies)),
            'latency_std': float(np.std(latencies)),
            'latency_p50': float(np.percentile(latencies, 50)),
            'latency_p95': float(np.percentile(latencies, 95)),
            'latency_p99': float(np.percentile(latencies, 99)),
            'latency_min': float(np.min(latencies)),
            'latency_max': float(np.max(latencies)),
            'fps_mean': 1000.0 / np.mean(latencies) if len(latencies) > 0 else 0,
            'fps_std': float(np.std(1000.0 / latencies)) if len(latencies) > 0 else 0,
            'memory_used': float(np.mean(memory)),
            'memory_peak': float(np.max(memory)),
        }

        # GPU stats
        if self.gpu_samples:
            gpu_util = [s['utilization'] for s in self.gpu_samples]
            gpu_mem = [s['memory'] for s in self.gpu_samples]
            gpu_power = [s['power'] for s in self.gpu_samples]

            stats.update({
                'gpu_utilization': float(np.mean(gpu_util)),
                'gpu_memory_used': float(np.mean(gpu_mem)),
                'gpu_power_draw': float(np.mean(gpu_power)),
            })
        else:
            stats.update({
                'gpu_utilization': 0.0,
                'gpu_memory_used': 0.0,
                'gpu_power_draw': 0.0,
            })

        return stats

    def reset(self):
        """Reset all metrics."""
        self.latencies = []
        self.memory_samples = []
        self.gpu_samples = []


class BenchmarkDataset:
    """Dataset for benchmarking."""

    def __init__(
        self,
        images_dir: Path,
        num_images: int = 100,
        input_size: Tuple[int, int] = (1280, 720),
    ):
        self.images_dir = Path(images_dir)
        self.num_images = num_images
        self.input_size = input_size

        # Load images
        self.images = []
        image_paths = list(self.images_dir.rglob('*.jpg'))[:num_images]

        logger.info(f"Loading {len(image_paths)} benchmark images...")
        for img_path in tqdm(image_paths):
            img = cv2.imread(str(img_path))
            if img is not None:
                img = cv2.resize(img, input_size)
                self.images.append(img)

        logger.info(f"Loaded {len(self.images)} images")

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        return self.images[idx % len(self.images)]


def benchmark_yolo_model(
    model_path: Path,
    dataset: BenchmarkDataset,
    iterations: int = 1000,
    warmup: int = 10,
) -> BenchmarkResult:
    """Benchmark YOLO detection model."""
    logger.info(f"Benchmarking YOLO model: {model_path}")

    try:
        from ultralytics import YOLO

        # Load model
        model = YOLO(str(model_path))
        device = 'cuda' if model_path.suffix == '.engine' else 'cuda:0'

        # Warmup
        logger.info(f"Warming up ({warmup} iterations)...")
        for i in range(warmup):
            img = dataset[i]
            model.predict(img, verbose=False)

        # Benchmark
        monitor = PerformanceMonitor()
        logger.info(f"Running benchmark ({iterations} iterations)...")

        for i in tqdm(range(iterations)):
            img = dataset[i]

            monitor.start_iteration()
            results = model.predict(img, verbose=False)
            monitor.end_iteration()

        # Get stats
        stats = monitor.get_stats()

        # Detect precision from path
        precision = 'fp16'
        if 'int8' in str(model_path).lower():
            precision = 'int8'
        elif 'fp32' in str(model_path).lower():
            precision = 'fp32'

        return BenchmarkResult(
            model_name='yolov12',
            hardware='auto',
            precision=precision,
            batch_size=1,
            num_iterations=iterations,
            total_time=sum(monitor.latencies) / 1000.0,
            timestamp=time.strftime('%Y-%m-%d %H:%M:%S'),
            **stats,
        )

    except Exception as e:
        logger.error(f"Benchmark failed: {e}")
        raise


def benchmark_pipeline(
    config_path: Path,
    dataset: BenchmarkDataset,
    duration: int = 60,
) -> BenchmarkResult:
    """Benchmark full inference pipeline."""
    logger.info(f"Benchmarking full pipeline (duration: {duration}s)")

    try:
        # Import BAHB components
        from bahb.core.config import load_config
        from bahb.core.engine import InspectionEngine

        # Load config
        config = load_config(config_path)
        engine = InspectionEngine(config)

        # Initialize
        import asyncio
        loop = asyncio.get_event_loop()
        success = loop.run_until_complete(engine.initialize())

        if not success:
            raise RuntimeError("Engine initialization failed")

        # Benchmark
        monitor = PerformanceMonitor()
        start_time = time.time()
        iterations = 0

        logger.info("Running pipeline benchmark...")

        while (time.time() - start_time) < duration:
            img = dataset[iterations]

            monitor.start_iteration()
            result = loop.run_until_complete(engine.process_single_image(img))
            monitor.end_iteration()

            iterations += 1

        # Shutdown
        loop.run_until_complete(engine.shutdown())

        # Get stats
        stats = monitor.get_stats()

        return BenchmarkResult(
            model_name='full_pipeline',
            hardware='auto',
            precision='mixed',
            batch_size=1,
            num_iterations=iterations,
            total_time=time.time() - start_time,
            timestamp=time.strftime('%Y-%m-%d %H:%M:%S'),
            **stats,
        )

    except Exception as e:
        logger.error(f"Pipeline benchmark failed: {e}")
        raise


def compare_configurations(
    base_model: Path,
    configurations: List[str],
    dataset: BenchmarkDataset,
    iterations: int = 500,
) -> Dict[str, BenchmarkResult]:
    """Compare different model configurations."""
    logger.info("Comparing model configurations...")

    results = {}

    for config in configurations:
        # Determine model path based on config
        model_path = base_model.parent / f"{base_model.stem}_{config}{base_model.suffix}"

        if not model_path.exists():
            logger.warning(f"Configuration not found: {config} ({model_path})")
            continue

        logger.info(f"\nBenchmarking: {config}")
        result = benchmark_yolo_model(model_path, dataset, iterations)
        results[config] = result

    return results


def generate_report(
    results: List[BenchmarkResult],
    output_path: Path,
    format: str = 'json',
):
    """Generate benchmark report."""
    logger.info(f"Generating {format} report: {output_path}")

    if format == 'json':
        # Convert to JSON
        data = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'results': [asdict(r) for r in results],
        }

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

    elif format == 'markdown':
        # Generate markdown table
        with open(output_path, 'w') as f:
            f.write("# BAHB Benchmark Results\n\n")
            f.write(f"**Generated:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")

            f.write("## Summary\n\n")
            f.write("| Model | Precision | Latency (ms) | FPS | Memory (MB) | GPU Power (W) |\n")
            f.write("|-------|-----------|--------------|-----|-------------|---------------|\n")

            for r in results:
                f.write(f"| {r.model_name} | {r.precision} | "
                       f"{r.latency_p50:.1f} (p50) | "
                       f"{r.fps_mean:.1f} | "
                       f"{r.memory_used:.0f} | "
                       f"{r.gpu_power_draw:.1f} |\n")

            f.write("\n## Detailed Metrics\n\n")

            for r in results:
                f.write(f"### {r.model_name} ({r.precision})\n\n")
                f.write(f"- **Latency:**\n")
                f.write(f"  - Mean: {r.latency_mean:.2f} ms\n")
                f.write(f"  - P50: {r.latency_p50:.2f} ms\n")
                f.write(f"  - P95: {r.latency_p95:.2f} ms\n")
                f.write(f"  - P99: {r.latency_p99:.2f} ms\n")
                f.write(f"- **Throughput:** {r.fps_mean:.1f} FPS\n")
                f.write(f"- **Memory:** {r.memory_used:.0f} MB (peak: {r.memory_peak:.0f} MB)\n")
                f.write(f"- **GPU Utilization:** {r.gpu_utilization:.1f}%\n")
                f.write(f"- **Power:** {r.gpu_power_draw:.1f} W\n\n")

    elif format == 'html':
        # Generate HTML report
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>BAHB Benchmark Results</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #333; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .metric {{ font-weight: bold; }}
    </style>
</head>
<body>
    <h1>BAHB Performance Benchmark Results</h1>
    <p><strong>Generated:</strong> {time.strftime('%Y-%m-%d %H:%M:%S')}</p>

    <h2>Summary</h2>
    <table>
        <tr>
            <th>Model</th>
            <th>Precision</th>
            <th>Latency (ms)</th>
            <th>FPS</th>
            <th>Memory (MB)</th>
            <th>GPU Power (W)</th>
        </tr>
"""

        for r in results:
            html += f"""
        <tr>
            <td>{r.model_name}</td>
            <td>{r.precision}</td>
            <td>{r.latency_p50:.1f}</td>
            <td>{r.fps_mean:.1f}</td>
            <td>{r.memory_used:.0f}</td>
            <td>{r.gpu_power_draw:.1f}</td>
        </tr>
"""

        html += """
    </table>

    <h2>Detailed Metrics</h2>
"""

        for r in results:
            html += f"""
    <h3>{r.model_name} ({r.precision})</h3>
    <table>
        <tr><td class="metric">Mean Latency</td><td>{r.latency_mean:.2f} ms</td></tr>
        <tr><td class="metric">P50 Latency</td><td>{r.latency_p50:.2f} ms</td></tr>
        <tr><td class="metric">P95 Latency</td><td>{r.latency_p95:.2f} ms</td></tr>
        <tr><td class="metric">P99 Latency</td><td>{r.latency_p99:.2f} ms</td></tr>
        <tr><td class="metric">FPS</td><td>{r.fps_mean:.1f}</td></tr>
        <tr><td class="metric">Memory Used</td><td>{r.memory_used:.0f} MB</td></tr>
        <tr><td class="metric">GPU Utilization</td><td>{r.gpu_utilization:.1f}%</td></tr>
        <tr><td class="metric">Power Draw</td><td>{r.gpu_power_draw:.1f} W</td></tr>
    </table>
"""

        html += """
</body>
</html>
"""

        with open(output_path, 'w') as f:
            f.write(html)

    logger.info(f"Report saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="BAHB Performance Benchmarking Suite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        '--model',
        type=str,
        choices=['yolov12', 'rf_detr', 'sam3', 'qwen_vl'],
        help='Model to benchmark',
    )

    parser.add_argument(
        '--model-path',
        type=Path,
        help='Path to model weights',
    )

    parser.add_argument(
        '--full-pipeline',
        action='store_true',
        help='Benchmark full inference pipeline',
    )

    parser.add_argument(
        '--config',
        type=Path,
        default=Path('configs/production.yaml'),
        help='Configuration file for pipeline benchmark',
    )

    parser.add_argument(
        '--hardware',
        type=str,
        choices=['orin_nx', 'rc_plus_2', 'auto'],
        default='auto',
        help='Target hardware',
    )

    parser.add_argument(
        '--iterations',
        type=int,
        default=1000,
        help='Number of benchmark iterations',
    )

    parser.add_argument(
        '--duration',
        type=int,
        default=60,
        help='Benchmark duration in seconds (for pipeline)',
    )

    parser.add_argument(
        '--warmup',
        type=int,
        default=10,
        help='Number of warmup iterations',
    )

    parser.add_argument(
        '--compare',
        nargs='+',
        help='Compare multiple configurations (e.g., fp16 int8)',
    )

    parser.add_argument(
        '--images-dir',
        type=Path,
        default=Path('data/processed/val/images'),
        help='Directory with test images',
    )

    parser.add_argument(
        '--num-images',
        type=int,
        default=100,
        help='Number of images to load',
    )

    parser.add_argument(
        '--output',
        type=Path,
        default=Path('optimization/benchmarks/results.json'),
        help='Output file for results',
    )

    parser.add_argument(
        '--report',
        action='store_true',
        help='Generate detailed report',
    )

    parser.add_argument(
        '--format',
        type=str,
        choices=['json', 'markdown', 'html'],
        default='json',
        help='Report format',
    )

    args = parser.parse_args()

    # Setup
    project_root = Path(__file__).parent.parent.parent

    # Load dataset
    images_dir = project_root / args.images_dir
    dataset = BenchmarkDataset(
        images_dir,
        num_images=args.num_images,
        input_size=(1280, 720),
    )

    results = []

    # Run benchmarks
    if args.full_pipeline:
        # Benchmark full pipeline
        config_path = project_root / args.config
        result = benchmark_pipeline(config_path, dataset, args.duration)
        results.append(result)

    elif args.compare:
        # Compare configurations
        if not args.model_path:
            args.model_path = project_root / 'runs/yolov12/bahb_v2/weights/best.pt'

        comparison = compare_configurations(
            args.model_path,
            args.compare,
            dataset,
            args.iterations,
        )
        results.extend(comparison.values())

    elif args.model:
        # Benchmark single model
        if not args.model_path:
            # Use default path
            model_paths = {
                'yolov12': 'runs/yolov12/bahb_v2/weights/best.pt',
                'rf_detr': 'models/rf_detr_large.pt',
                'sam3': 'models/sam3_nano.pt',
                'qwen_vl': 'models/Qwen2.5-VL-3B',
            }
            args.model_path = project_root / model_paths[args.model]

        result = benchmark_yolo_model(
            args.model_path,
            dataset,
            args.iterations,
            args.warmup,
        )
        results.append(result)

    else:
        logger.error("Specify --model, --full-pipeline, or --compare")
        return

    # Generate report
    if args.report or args.output:
        output_path = project_root / args.output
        output_path.parent.mkdir(parents=True, exist_ok=True)

        generate_report(results, output_path, args.format)

    # Print summary
    logger.info("\n" + "="*60)
    logger.info("BENCHMARK SUMMARY")
    logger.info("="*60)

    for r in results:
        logger.info(f"\n{r.model_name} ({r.precision}):")
        logger.info(f"  Latency (p50): {r.latency_p50:.2f} ms")
        logger.info(f"  FPS:           {r.fps_mean:.1f}")
        logger.info(f"  Memory:        {r.memory_used:.0f} MB")
        logger.info(f"  GPU Power:     {r.gpu_power_draw:.1f} W")

    logger.info("\nBenchmark complete!")


if __name__ == '__main__':
    main()
