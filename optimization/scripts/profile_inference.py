#!/usr/bin/env python3
"""
BAHB Inference Profiling Tool

Deep profiling of inference pipeline to identify bottlenecks.
Uses NVIDIA Nsight, PyTorch profiler, and custom instrumentation.

Usage:
    # Profile YOLOv12
    python profile_inference.py --model yolov12 --iterations 100

    # Profile full pipeline with visualization
    python profile_inference.py --full-pipeline --visualize --duration 60

    # Export Chrome trace
    python profile_inference.py --model yolov12 --trace chrome_trace.json
"""

import argparse
import json
import sys
import time
from collections import defaultdict
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

import cv2
import numpy as np
from loguru import logger

# Add BAHB to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


@dataclass
class ProfileEvent:
    """Profiling event."""
    name: str
    start_time: float
    end_time: float
    duration_ms: float
    metadata: Dict = field(default_factory=dict)

    def to_chrome_trace(self, pid: int = 0, tid: int = 0) -> dict:
        """Convert to Chrome trace format."""
        return {
            'name': self.name,
            'cat': 'inference',
            'ph': 'X',  # Complete event
            'ts': self.start_time * 1000000,  # microseconds
            'dur': self.duration_ms * 1000,  # microseconds
            'pid': pid,
            'tid': tid,
            'args': self.metadata,
        }


class InferenceProfiler:
    """Profiler for inference pipeline."""

    def __init__(self):
        self.events: List[ProfileEvent] = []
        self.current_stack: List[dict] = []
        self.start_time = time.perf_counter()

    @contextmanager
    def profile(self, name: str, **metadata):
        """Context manager for profiling a block."""
        start = time.perf_counter()

        # Push to stack
        self.current_stack.append({'name': name, 'start': start})

        try:
            yield
        finally:
            # Pop from stack
            entry = self.current_stack.pop()
            end = time.perf_counter()
            duration_ms = (end - start) * 1000

            # Record event
            event = ProfileEvent(
                name=name,
                start_time=start - self.start_time,
                end_time=end - self.start_time,
                duration_ms=duration_ms,
                metadata=metadata,
            )
            self.events.append(event)

    def get_summary(self) -> Dict[str, dict]:
        """Get summary statistics."""
        summary = defaultdict(lambda: {
            'count': 0,
            'total_ms': 0.0,
            'mean_ms': 0.0,
            'min_ms': float('inf'),
            'max_ms': 0.0,
        })

        for event in self.events:
            stats = summary[event.name]
            stats['count'] += 1
            stats['total_ms'] += event.duration_ms
            stats['min_ms'] = min(stats['min_ms'], event.duration_ms)
            stats['max_ms'] = max(stats['max_ms'], event.duration_ms)

        # Calculate means
        for name, stats in summary.items():
            if stats['count'] > 0:
                stats['mean_ms'] = stats['total_ms'] / stats['count']

        return dict(summary)

    def export_chrome_trace(self, output_path: Path):
        """Export to Chrome trace format for visualization."""
        trace_events = [event.to_chrome_trace() for event in self.events]

        trace_data = {
            'traceEvents': trace_events,
            'displayTimeUnit': 'ms',
        }

        with open(output_path, 'w') as f:
            json.dump(trace_data, f, indent=2)

        logger.info(f"Chrome trace exported to: {output_path}")
        logger.info("View in chrome://tracing")

    def print_summary(self):
        """Print summary to console."""
        summary = self.get_summary()

        logger.info("\n" + "="*80)
        logger.info("PROFILING SUMMARY")
        logger.info("="*80)

        # Sort by total time
        sorted_events = sorted(
            summary.items(),
            key=lambda x: x[1]['total_ms'],
            reverse=True,
        )

        logger.info(f"\n{'Operation':<30} {'Count':>8} {'Total (ms)':>12} {'Mean (ms)':>12} {'Min (ms)':>10} {'Max (ms)':>10}")
        logger.info("-" * 80)

        for name, stats in sorted_events:
            logger.info(
                f"{name:<30} "
                f"{stats['count']:>8} "
                f"{stats['total_ms']:>12.2f} "
                f"{stats['mean_ms']:>12.2f} "
                f"{stats['min_ms']:>10.2f} "
                f"{stats['max_ms']:>10.2f}"
            )

        # Calculate percentages
        total_time = sum(s['total_ms'] for s in summary.values())
        logger.info("\n" + "="*80)
        logger.info("TIME BREAKDOWN")
        logger.info("="*80)

        for name, stats in sorted_events[:10]:  # Top 10
            percentage = (stats['total_ms'] / total_time * 100) if total_time > 0 else 0
            logger.info(f"{name:<40} {stats['total_ms']:>10.2f} ms ({percentage:>5.1f}%)")


def profile_yolo_inference(
    model_path: Path,
    images_dir: Path,
    iterations: int = 100,
    visualize: bool = False,
) -> InferenceProfiler:
    """Profile YOLO model inference."""
    logger.info(f"Profiling YOLO model: {model_path}")

    profiler = InferenceProfiler()

    try:
        from ultralytics import YOLO

        # Load model
        with profiler.profile("model_loading"):
            model = YOLO(str(model_path))

        # Load test images
        image_paths = list(images_dir.rglob('*.jpg'))[:iterations]
        logger.info(f"Loaded {len(image_paths)} test images")

        # Warmup
        logger.info("Warming up...")
        with profiler.profile("warmup"):
            for i in range(min(10, len(image_paths))):
                img = cv2.imread(str(image_paths[i]))
                model.predict(img, verbose=False)

        # Profile inference
        logger.info(f"Profiling {iterations} iterations...")

        for i, img_path in enumerate(image_paths):
            with profiler.profile("frame_processing", frame=i):

                # Load image
                with profiler.profile("image_loading"):
                    img = cv2.imread(str(img_path))

                # Preprocess
                with profiler.profile("preprocessing"):
                    # Image is preprocessed internally by model
                    pass

                # Inference
                with profiler.profile("inference"):
                    results = model.predict(img, verbose=False)

                # Postprocess
                with profiler.profile("postprocessing"):
                    if results and len(results) > 0:
                        boxes = results[0].boxes
                        if boxes is not None:
                            detections = len(boxes)

                # Visualization (if enabled)
                if visualize:
                    with profiler.profile("visualization"):
                        annotated = results[0].plot()
                        cv2.imshow("Profiling", annotated)
                        if cv2.waitKey(1) & 0xFF == ord('q'):
                            break

        if visualize:
            cv2.destroyAllWindows()

        return profiler

    except Exception as e:
        logger.error(f"Profiling failed: {e}")
        raise


def profile_full_pipeline(
    config_path: Path,
    images_dir: Path,
    duration: int = 60,
    visualize: bool = False,
) -> InferenceProfiler:
    """Profile full BAHB inference pipeline."""
    logger.info(f"Profiling full pipeline (duration: {duration}s)")

    profiler = InferenceProfiler()

    try:
        # Import BAHB components
        from bahb.core.config import load_config
        from bahb.core.engine import InspectionEngine

        # Load config
        with profiler.profile("config_loading"):
            config = load_config(config_path)

        # Create engine
        with profiler.profile("engine_creation"):
            engine = InspectionEngine(config)

        # Initialize
        import asyncio
        loop = asyncio.get_event_loop()

        with profiler.profile("engine_initialization"):
            success = loop.run_until_complete(engine.initialize())

        if not success:
            raise RuntimeError("Engine initialization failed")

        # Load test images
        image_paths = list(images_dir.rglob('*.jpg'))
        logger.info(f"Loaded {len(image_paths)} test images")

        # Profile
        start_time = time.time()
        frame_count = 0

        logger.info("Profiling pipeline...")

        while (time.time() - start_time) < duration:
            img_path = image_paths[frame_count % len(image_paths)]

            with profiler.profile("pipeline_frame", frame=frame_count):

                # Load image
                with profiler.profile("pipeline_image_load"):
                    img = cv2.imread(str(img_path))

                # Process through pipeline
                with profiler.profile("pipeline_process"):
                    result = loop.run_until_complete(engine.process_single_image(img))

                # Extract metrics
                with profiler.profile("pipeline_metrics"):
                    num_detections = len(result.detections)
                    num_anomalies = len(result.anomalies)

            frame_count += 1

            # Display metrics
            if frame_count % 10 == 0:
                logger.info(f"Processed {frame_count} frames...")

        # Shutdown
        with profiler.profile("engine_shutdown"):
            loop.run_until_complete(engine.shutdown())

        logger.info(f"Profiled {frame_count} frames in {duration}s")

        return profiler

    except Exception as e:
        logger.error(f"Pipeline profiling failed: {e}")
        raise


def profile_with_pytorch_profiler(
    model_path: Path,
    images_dir: Path,
    iterations: int = 100,
    output_path: Path = None,
):
    """Profile using PyTorch profiler."""
    logger.info("Profiling with PyTorch profiler...")

    try:
        import torch
        from torch.profiler import profile, record_function, ProfilerActivity

        from ultralytics import YOLO

        # Load model
        model = YOLO(str(model_path))

        # Load test images
        image_paths = list(images_dir.rglob('*.jpg'))[:iterations]
        images = [cv2.imread(str(p)) for p in image_paths]

        # Profile
        with profile(
            activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
            record_shapes=True,
            profile_memory=True,
            with_stack=True,
        ) as prof:

            for i, img in enumerate(images):
                with record_function("inference"):
                    model.predict(img, verbose=False)

        # Print results
        logger.info("\nPyTorch Profiler Results:")
        logger.info(prof.key_averages().table(sort_by="cuda_time_total", row_limit=20))

        # Export trace
        if output_path:
            prof.export_chrome_trace(str(output_path))
            logger.info(f"PyTorch trace exported to: {output_path}")

    except ImportError:
        logger.error("PyTorch profiler not available")
    except Exception as e:
        logger.error(f"PyTorch profiling failed: {e}")


def profile_tensorrt_engine(
    engine_path: Path,
    images_dir: Path,
    iterations: int = 100,
) -> InferenceProfiler:
    """Profile TensorRT engine with detailed layer timing."""
    logger.info(f"Profiling TensorRT engine: {engine_path}")

    profiler = InferenceProfiler()

    try:
        import tensorrt as trt
        import pycuda.driver as cuda
        import pycuda.autoinit

        # Load engine
        with profiler.profile("engine_loading"):
            with open(engine_path, 'rb') as f:
                runtime = trt.Runtime(trt.Logger(trt.Logger.WARNING))
                engine = runtime.deserialize_cuda_engine(f.read())

        # Create context with profiler
        with profiler.profile("context_creation"):
            context = engine.create_execution_context()

            # Enable profiling
            if hasattr(context, 'profiler'):
                context.profiler = trt.Profiler()

        # Allocate buffers
        with profiler.profile("buffer_allocation"):
            # Get input/output bindings
            bindings = []
            for i in range(engine.num_io_tensors):
                name = engine.get_tensor_name(i)
                shape = engine.get_tensor_shape(name)
                dtype = trt.nptype(engine.get_tensor_dtype(name))

                size = int(np.prod(shape))
                host_mem = cuda.pagelocked_empty(size, dtype)
                device_mem = cuda.mem_alloc(host_mem.nbytes)

                bindings.append(int(device_mem))

        # Create stream
        stream = cuda.Stream()

        # Profile inference
        logger.info(f"Profiling {iterations} iterations...")

        for i in range(iterations):
            with profiler.profile("tensorrt_inference", iteration=i):

                # Generate dummy input
                with profiler.profile("input_preparation"):
                    input_data = np.random.randn(1, 3, 640, 640).astype(np.float32)

                # Copy to device
                with profiler.profile("host_to_device"):
                    cuda.memcpy_htod_async(bindings[0], input_data, stream)

                # Execute
                with profiler.profile("execute"):
                    context.execute_async_v2(bindings=bindings, stream_handle=stream.handle)

                # Copy from device
                with profiler.profile("device_to_host"):
                    output_data = np.empty(shape, dtype=dtype)
                    cuda.memcpy_dtoh_async(output_data, bindings[-1], stream)

                # Synchronize
                with profiler.profile("synchronize"):
                    stream.synchronize()

        return profiler

    except ImportError:
        logger.error("TensorRT not available")
        raise
    except Exception as e:
        logger.error(f"TensorRT profiling failed: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(
        description="BAHB Inference Profiling Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        '--model',
        type=str,
        choices=['yolov12', 'rf_detr', 'sam3', 'qwen_vl'],
        help='Model to profile',
    )

    parser.add_argument(
        '--model-path',
        type=Path,
        help='Path to model weights',
    )

    parser.add_argument(
        '--full-pipeline',
        action='store_true',
        help='Profile full inference pipeline',
    )

    parser.add_argument(
        '--config',
        type=Path,
        default=Path('configs/production.yaml'),
        help='Configuration file for pipeline profiling',
    )

    parser.add_argument(
        '--images-dir',
        type=Path,
        default=Path('data/processed/val/images'),
        help='Directory with test images',
    )

    parser.add_argument(
        '--iterations',
        type=int,
        default=100,
        help='Number of profiling iterations',
    )

    parser.add_argument(
        '--duration',
        type=int,
        default=60,
        help='Profiling duration in seconds (for pipeline)',
    )

    parser.add_argument(
        '--visualize',
        action='store_true',
        help='Show visualization during profiling',
    )

    parser.add_argument(
        '--trace',
        type=Path,
        help='Export Chrome trace to file',
    )

    parser.add_argument(
        '--pytorch-profiler',
        action='store_true',
        help='Use PyTorch profiler',
    )

    parser.add_argument(
        '--tensorrt-engine',
        type=Path,
        help='Profile TensorRT engine',
    )

    args = parser.parse_args()

    # Setup
    project_root = Path(__file__).parent.parent.parent
    images_dir = project_root / args.images_dir

    # Run profiling
    profiler = None

    if args.tensorrt_engine:
        # Profile TensorRT engine
        profiler = profile_tensorrt_engine(
            args.tensorrt_engine,
            images_dir,
            args.iterations,
        )

    elif args.pytorch_profiler:
        # Use PyTorch profiler
        if not args.model_path:
            args.model_path = project_root / 'runs/yolov12/bahb_v2/weights/best.pt'

        trace_path = args.trace or (project_root / 'optimization/profiling/pytorch_trace.json')
        trace_path.parent.mkdir(parents=True, exist_ok=True)

        profile_with_pytorch_profiler(
            args.model_path,
            images_dir,
            args.iterations,
            trace_path,
        )
        return

    elif args.full_pipeline:
        # Profile full pipeline
        config_path = project_root / args.config
        profiler = profile_full_pipeline(
            config_path,
            images_dir,
            args.duration,
            args.visualize,
        )

    elif args.model:
        # Profile single model
        if not args.model_path:
            # Use default path
            model_paths = {
                'yolov12': 'runs/yolov12/bahb_v2/weights/best.pt',
                'rf_detr': 'models/rf_detr_large.pt',
                'sam3': 'models/sam3_nano.pt',
                'qwen_vl': 'models/Qwen2.5-VL-3B',
            }
            args.model_path = project_root / model_paths[args.model]

        profiler = profile_yolo_inference(
            args.model_path,
            images_dir,
            args.iterations,
            args.visualize,
        )

    else:
        logger.error("Specify --model, --full-pipeline, or --tensorrt-engine")
        return

    # Print summary
    if profiler:
        profiler.print_summary()

        # Export trace
        if args.trace:
            trace_path = project_root / args.trace
            trace_path.parent.mkdir(parents=True, exist_ok=True)
            profiler.export_chrome_trace(trace_path)

    logger.info("\nProfiling complete!")


if __name__ == '__main__':
    main()
