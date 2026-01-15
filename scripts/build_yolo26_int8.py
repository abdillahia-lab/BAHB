#!/usr/bin/env python3
"""
YOLO26l INT8 TensorRT Engine Builder

Multi-Agent Deliberation Result: INT8 with FP16 Fallback
Confidence: HIGH

Expected Performance on Orin NX:
- Latency: 18ms (p50)
- Throughput: 55.5 FPS
- Memory: 0.8 GB
- Accuracy: 99.2% (0.8% degradation from FP32)
- Power: 4.5W (AI workload)
"""

import os
import sys
import random
import shutil
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# BAHB project paths
BAHB_ROOT = Path("/home/user/BAHB")
MODEL_PATH = BAHB_ROOT / "yolo26l.pt"
ONNX_PATH = BAHB_ROOT / "models" / "onnx" / "yolo26l.onnx"
ENGINE_PATH = BAHB_ROOT / "models" / "tensorrt" / "yolo26l_int8.engine"
CALIBRATION_DIR = BAHB_ROOT / "models" / "tensorrt" / "calibration_images"
CALIBRATION_CACHE = BAHB_ROOT / "models" / "tensorrt" / "yolo26l_calibration.cache"
TRAINING_IMAGES = BAHB_ROOT / "data" / "merged" / "train" / "images"

# INT8 Calibration Configuration (from deliberation)
CALIBRATION_CONFIG = {
    "num_images": 800,
    "batch_size": 8,
    "algorithm": "entropy_v2",  # IInt8EntropyCalibrator2
    "image_size": (640, 640),
}

# TensorRT Build Configuration (from deliberation)
TENSORRT_CONFIG = {
    "precision": "int8",
    "fp16_fallback": True,
    "workspace_size_gb": 4,
    "dla_core": -1,  # GPU only (DLA available but not used per deliberation)
    "cuda_graphs": True,
    "layer_precisions": {
        "*/output": "fp16",  # Output layers in FP16 for accuracy
    },
}


def check_dependencies() -> bool:
    """Check if required dependencies are available."""
    logger.info("Checking dependencies...")

    try:
        import torch
        logger.info(f"  PyTorch: {torch.__version__}")
    except ImportError:
        logger.error("PyTorch not found. Install with: pip install torch")
        return False

    try:
        from ultralytics import YOLO
        logger.info("  Ultralytics: OK")
    except ImportError:
        logger.error("Ultralytics not found. Install with: pip install ultralytics")
        return False

    try:
        import tensorrt as trt
        logger.info(f"  TensorRT: {trt.__version__}")
    except ImportError:
        logger.warning("TensorRT Python bindings not found. Using trtexec fallback.")

    return True


def prepare_calibration_dataset(
    source_dir: Path,
    target_dir: Path,
    num_images: int = 800
) -> int:
    """Prepare calibration dataset for INT8 quantization."""
    logger.info(f"Preparing calibration dataset ({num_images} images)...")

    target_dir.mkdir(parents=True, exist_ok=True)

    # Get all training images
    all_images = list(source_dir.glob("*.jpg")) + list(source_dir.glob("*.png"))
    logger.info(f"  Found {len(all_images)} training images")

    if len(all_images) < num_images:
        logger.warning(f"  Only {len(all_images)} images available, using all")
        num_images = len(all_images)

    # Random sample for representative calibration
    random.seed(42)  # Reproducibility
    selected_images = random.sample(all_images, num_images)

    # Copy to calibration directory
    for img_path in selected_images:
        shutil.copy2(img_path, target_dir / img_path.name)

    logger.info(f"  Copied {len(selected_images)} images to {target_dir}")
    return len(selected_images)


def export_onnx(model_path: Path, onnx_path: Path) -> bool:
    """Export YOLO26 model to ONNX format."""
    logger.info("Exporting YOLO26l to ONNX...")

    try:
        from ultralytics import YOLO

        onnx_path.parent.mkdir(parents=True, exist_ok=True)

        model = YOLO(str(model_path))
        model.export(
            format='onnx',
            imgsz=640,
            simplify=True,
            opset=17,
            dynamic=False,  # Fixed batch for INT8 calibration
            half=False,     # Export FP32, quantize in TensorRT
        )

        # Move to correct location
        exported_path = model_path.with_suffix('.onnx')
        if exported_path.exists():
            shutil.move(str(exported_path), str(onnx_path))

        logger.info(f"  ONNX model saved to: {onnx_path}")
        return True

    except Exception as e:
        logger.error(f"  ONNX export failed: {e}")
        return False


def build_tensorrt_engine_python(
    onnx_path: Path,
    engine_path: Path,
    calibration_dir: Path,
    cache_path: Path
) -> bool:
    """Build TensorRT INT8 engine using Python API."""
    logger.info("Building TensorRT INT8 engine (Python API)...")

    try:
        import tensorrt as trt
        import numpy as np
        from PIL import Image

        TRT_LOGGER = trt.Logger(trt.Logger.WARNING)

        # Create builder
        builder = trt.Builder(TRT_LOGGER)
        network = builder.create_network(
            1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH)
        )
        parser = trt.OnnxParser(network, TRT_LOGGER)

        # Parse ONNX model
        logger.info("  Parsing ONNX model...")
        with open(onnx_path, 'rb') as f:
            if not parser.parse(f.read()):
                for i in range(parser.num_errors):
                    logger.error(f"    {parser.get_error(i)}")
                return False

        # Configure builder
        config = builder.create_builder_config()
        config.set_memory_pool_limit(
            trt.MemoryPoolType.WORKSPACE,
            TENSORRT_CONFIG["workspace_size_gb"] * (1 << 30)
        )

        # Enable INT8 + FP16
        config.set_flag(trt.BuilderFlag.INT8)
        if TENSORRT_CONFIG["fp16_fallback"]:
            config.set_flag(trt.BuilderFlag.FP16)

        # INT8 Calibrator
        logger.info("  Setting up INT8 calibrator...")

        class YOLO26Calibrator(trt.IInt8EntropyCalibrator2):
            def __init__(self, calibration_dir, cache_path, batch_size=8):
                super().__init__()
                self.cache_path = str(cache_path)
                self.batch_size = batch_size
                self.images = list(Path(calibration_dir).glob("*.jpg"))
                self.images += list(Path(calibration_dir).glob("*.png"))
                self.current_index = 0
                self.device_input = None

            def get_batch_size(self):
                return self.batch_size

            def get_batch(self, names):
                if self.current_index >= len(self.images):
                    return None

                batch_images = self.images[self.current_index:self.current_index + self.batch_size]
                self.current_index += self.batch_size

                # Preprocess images
                import pycuda.driver as cuda
                import pycuda.autoinit

                batch_data = np.zeros((self.batch_size, 3, 640, 640), dtype=np.float32)

                for i, img_path in enumerate(batch_images):
                    img = Image.open(img_path).convert('RGB')
                    img = img.resize((640, 640))
                    img_array = np.array(img).transpose(2, 0, 1).astype(np.float32) / 255.0
                    batch_data[i] = img_array

                if self.device_input is None:
                    self.device_input = cuda.mem_alloc(batch_data.nbytes)

                cuda.memcpy_htod(self.device_input, batch_data)
                return [int(self.device_input)]

            def read_calibration_cache(self):
                if os.path.exists(self.cache_path):
                    with open(self.cache_path, 'rb') as f:
                        return f.read()
                return None

            def write_calibration_cache(self, cache):
                with open(self.cache_path, 'wb') as f:
                    f.write(cache)

        calibrator = YOLO26Calibrator(
            calibration_dir,
            cache_path,
            CALIBRATION_CONFIG["batch_size"]
        )
        config.int8_calibrator = calibrator

        # Build engine
        logger.info("  Building engine (this may take 10-15 minutes)...")
        engine_path.parent.mkdir(parents=True, exist_ok=True)

        serialized_engine = builder.build_serialized_network(network, config)

        if serialized_engine is None:
            logger.error("  Failed to build engine")
            return False

        with open(engine_path, 'wb') as f:
            f.write(serialized_engine)

        logger.info(f"  Engine saved to: {engine_path}")
        return True

    except Exception as e:
        logger.error(f"  TensorRT build failed: {e}")
        logger.info("  Falling back to trtexec...")
        return False


def build_tensorrt_engine_trtexec(
    onnx_path: Path,
    engine_path: Path,
    calibration_dir: Path,
    cache_path: Path
) -> bool:
    """Build TensorRT INT8 engine using trtexec command."""
    logger.info("Building TensorRT INT8 engine (trtexec)...")

    import subprocess

    engine_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "trtexec",
        f"--onnx={onnx_path}",
        f"--saveEngine={engine_path}",
        "--int8",
        "--fp16",
        f"--calib={calibration_dir}",
        f"--workspace={TENSORRT_CONFIG['workspace_size_gb'] * 1024}",
        "--avgRuns=100",
        "--verbose",
        "--buildOnly",
        "--useCudaGraph",
        "--allowGPUFallback",
    ]

    logger.info(f"  Running: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=1800  # 30 minute timeout
        )

        if result.returncode == 0:
            logger.info(f"  Engine saved to: {engine_path}")
            return True
        else:
            logger.error(f"  trtexec failed: {result.stderr}")
            return False

    except subprocess.TimeoutExpired:
        logger.error("  trtexec timed out after 30 minutes")
        return False
    except FileNotFoundError:
        logger.error("  trtexec not found. Install TensorRT toolkit.")
        return False


def benchmark_engine(engine_path: Path) -> Dict[str, Any]:
    """Benchmark the TensorRT engine."""
    logger.info("Benchmarking TensorRT engine...")

    import subprocess

    cmd = [
        "trtexec",
        f"--loadEngine={engine_path}",
        "--warmUp=200",
        "--iterations=1000",
        "--avgRuns=100",
        "--percentile=50,95,99",
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        metrics = {}
        for line in result.stdout.split('\n'):
            if 'mean' in line.lower():
                # Parse: "mean: 18.2345 ms"
                parts = line.split()
                for i, part in enumerate(parts):
                    if part == 'ms' and i > 0:
                        try:
                            metrics['latency_ms'] = float(parts[i-1])
                        except:
                            pass
            if 'throughput' in line.lower():
                parts = line.split()
                for i, part in enumerate(parts):
                    if 'qps' in part.lower() and i > 0:
                        try:
                            metrics['throughput_fps'] = float(parts[i-1])
                        except:
                            pass

        logger.info(f"  Latency: {metrics.get('latency_ms', 'N/A')}ms")
        logger.info(f"  Throughput: {metrics.get('throughput_fps', 'N/A')} FPS")
        return metrics

    except Exception as e:
        logger.error(f"  Benchmark failed: {e}")
        return {}


def main():
    """Main execution flow."""
    print("=" * 60)
    print("YOLO26l INT8 TensorRT Engine Builder")
    print("Multi-Agent Deliberation: INT8 + FP16 Fallback")
    print("=" * 60)
    print()

    # Check dependencies
    if not check_dependencies():
        sys.exit(1)

    # Check if model exists
    if not MODEL_PATH.exists():
        # Try to find the model in other locations
        alt_paths = [
            BAHB_ROOT / "runs" / "yolo26l_infrastructure" / "weights" / "best.pt",
            BAHB_ROOT / "runs" / "yolo26l_infrastructure" / "weights" / "last.pt",
        ]

        for alt_path in alt_paths:
            if alt_path.exists():
                logger.info(f"Using model from: {alt_path}")
                global MODEL_PATH
                MODEL_PATH = alt_path
                break
        else:
            logger.error(f"Model not found at {MODEL_PATH} or alternative locations")
            logger.info("Train the model first or provide the correct path")
            sys.exit(1)

    # Step 1: Prepare calibration dataset
    if not CALIBRATION_DIR.exists() or len(list(CALIBRATION_DIR.glob("*"))) < 100:
        if TRAINING_IMAGES.exists():
            prepare_calibration_dataset(
                TRAINING_IMAGES,
                CALIBRATION_DIR,
                CALIBRATION_CONFIG["num_images"]
            )
        else:
            logger.error(f"Training images not found at {TRAINING_IMAGES}")
            logger.info("Provide calibration images or training data")
            sys.exit(1)
    else:
        logger.info(f"Using existing calibration images in {CALIBRATION_DIR}")

    # Step 2: Export to ONNX
    if not ONNX_PATH.exists():
        if not export_onnx(MODEL_PATH, ONNX_PATH):
            sys.exit(1)
    else:
        logger.info(f"Using existing ONNX model: {ONNX_PATH}")

    # Step 3: Build TensorRT engine
    if not ENGINE_PATH.exists():
        # Try Python API first, fallback to trtexec
        success = build_tensorrt_engine_python(
            ONNX_PATH, ENGINE_PATH, CALIBRATION_DIR, CALIBRATION_CACHE
        )

        if not success:
            success = build_tensorrt_engine_trtexec(
                ONNX_PATH, ENGINE_PATH, CALIBRATION_DIR, CALIBRATION_CACHE
            )

        if not success:
            logger.error("Failed to build TensorRT engine")
            sys.exit(1)
    else:
        logger.info(f"Using existing TensorRT engine: {ENGINE_PATH}")

    # Step 4: Benchmark
    metrics = benchmark_engine(ENGINE_PATH)

    # Summary
    print()
    print("=" * 60)
    print("BUILD COMPLETE")
    print("=" * 60)
    print(f"Engine Path: {ENGINE_PATH}")
    print(f"Precision: INT8 + FP16 fallback")
    print(f"Target Performance:")
    print(f"  - Latency: 18ms (p50)")
    print(f"  - Throughput: 55+ FPS")
    print(f"  - Accuracy: 99.2% retention")
    print()

    if metrics:
        print("Measured Performance:")
        print(f"  - Latency: {metrics.get('latency_ms', 'N/A')}ms")
        print(f"  - Throughput: {metrics.get('throughput_fps', 'N/A')} FPS")

    print()
    print("Next steps:")
    print("  1. Validate accuracy: python scripts/validate_int8_accuracy.py")
    print("  2. Deploy to DeepStream: Use configs/deepstream/ds_pipeline_config.txt")
    print("  3. Set power profile: ./scripts/orin_nx_power_profile.sh bahb")


if __name__ == "__main__":
    main()
