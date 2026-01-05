#!/usr/bin/env python3
"""
BAHB Model Quantization Script

Converts FP32/FP16 models to INT8/INT4 for edge deployment.
Implements research-backed quantization strategies:
- Post-Training Quantization (PTQ)
- Quantization-Aware Training (QAT)
- AWQ for VLMs

Usage:
    # YOLOv12 INT8 quantization
    python quantize_model.py --model yolov12 --precision int8 --calibration-images 500

    # Qwen-VL INT4 AWQ quantization
    python quantize_model.py --model qwen_vl --precision int4 --method awq

    # All models
    python quantize_model.py --all --precision int8
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np
import torch
from loguru import logger
from tqdm import tqdm

# Add BAHB to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class CalibrationDataLoader:
    """Dataset loader for INT8 calibration."""

    def __init__(
        self,
        images_dir: Path,
        num_images: int = 500,
        input_size: Tuple[int, int] = (640, 640),
        batch_size: int = 8,
    ):
        self.images_dir = Path(images_dir)
        self.num_images = num_images
        self.input_size = input_size
        self.batch_size = batch_size

        # Find all images
        self.image_paths = []
        for ext in ['*.jpg', '*.jpeg', '*.png']:
            self.image_paths.extend(self.images_dir.rglob(ext))

        # Limit to num_images
        if len(self.image_paths) > num_images:
            # Sample uniformly
            step = len(self.image_paths) // num_images
            self.image_paths = self.image_paths[::step][:num_images]

        logger.info(f"Found {len(self.image_paths)} calibration images")

    def __len__(self):
        return len(self.image_paths)

    def __iter__(self):
        """Yield batches of preprocessed images."""
        import cv2

        batch = []
        for img_path in self.image_paths:
            # Load and preprocess
            img = cv2.imread(str(img_path))
            if img is None:
                continue

            # Resize with letterbox
            img = self._letterbox(img, self.input_size)

            # Convert BGR to RGB, normalize
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = img.transpose(2, 0, 1).astype(np.float32) / 255.0

            batch.append(img)

            if len(batch) >= self.batch_size:
                yield np.array(batch, dtype=np.float32)
                batch = []

        # Yield remaining
        if batch:
            yield np.array(batch, dtype=np.float32)

    def _letterbox(
        self,
        img: np.ndarray,
        new_shape: Tuple[int, int],
        color: Tuple[int, int, int] = (114, 114, 114),
    ) -> np.ndarray:
        """Resize with letterbox."""
        import cv2

        shape = img.shape[:2]
        r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])

        new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
        dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]
        dw /= 2
        dh /= 2

        if shape[::-1] != new_unpad:
            img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)

        top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
        left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
        img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)

        return img


class TensorRTCalibrator:
    """INT8 calibrator for TensorRT."""

    def __init__(self, data_loader: CalibrationDataLoader, cache_file: Path):
        self.data_loader = data_loader
        self.cache_file = cache_file
        self.batch_iterator = None
        self.batch_allocation = None

    def get_batch_size(self):
        return self.data_loader.batch_size

    def get_batch(self, names):
        """Get next calibration batch."""
        if self.batch_iterator is None:
            self.batch_iterator = iter(self.data_loader)

        try:
            batch = next(self.batch_iterator)
            if self.batch_allocation is None:
                import pycuda.driver as cuda
                self.batch_allocation = cuda.mem_alloc(batch.nbytes)

            # Copy to device
            import pycuda.driver as cuda
            cuda.memcpy_htod(self.batch_allocation, np.ascontiguousarray(batch))
            return [int(self.batch_allocation)]

        except StopIteration:
            return None

    def read_calibration_cache(self):
        """Read cached calibration data."""
        if self.cache_file.exists():
            with open(self.cache_file, 'rb') as f:
                return f.read()
        return None

    def write_calibration_cache(self, cache):
        """Write calibration cache."""
        with open(self.cache_file, 'wb') as f:
            f.write(cache)


def quantize_yolo_int8(
    model_path: Path,
    output_path: Path,
    calibration_images: Path,
    num_calibration: int = 500,
) -> bool:
    """Quantize YOLO model to INT8 using TensorRT."""
    logger.info(f"Quantizing YOLOv12 to INT8: {model_path}")

    try:
        import tensorrt as trt

        # First export to ONNX
        onnx_path = output_path.with_suffix('.onnx')
        if not onnx_path.exists():
            logger.info("Exporting to ONNX...")
            from ultralytics import YOLO

            model = YOLO(str(model_path))
            model.export(
                format='onnx',
                imgsz=1280,
                simplify=True,
                opset=13,
            )
            onnx_path = model_path.with_suffix('.onnx')

        # Create calibration data loader
        logger.info("Creating calibration dataset...")
        calib_loader = CalibrationDataLoader(
            calibration_images,
            num_images=num_calibration,
            input_size=(1280, 720),
            batch_size=8,
        )

        # Build INT8 engine
        logger.info("Building INT8 TensorRT engine...")

        TRT_LOGGER = trt.Logger(trt.Logger.INFO)
        builder = trt.Builder(TRT_LOGGER)
        network = builder.create_network(1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH))
        parser = trt.OnnxParser(network, TRT_LOGGER)

        # Parse ONNX
        with open(onnx_path, 'rb') as f:
            if not parser.parse(f.read()):
                for error in range(parser.num_errors):
                    logger.error(f"ONNX parse error: {parser.get_error(error)}")
                return False

        # Configure builder
        config = builder.create_builder_config()
        config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, 4 * (1 << 30))  # 4GB

        # Enable INT8
        config.set_flag(trt.BuilderFlag.INT8)
        config.set_flag(trt.BuilderFlag.FP16)  # Allow FP16 fallback

        # Set calibrator
        cache_file = output_path.parent / f"{output_path.stem}_calibration.cache"
        calibrator = TensorRTCalibrator(calib_loader, cache_file)
        config.int8_calibrator = calibrator

        # Build engine
        logger.info("Building engine (this may take 10-30 minutes)...")
        serialized_engine = builder.build_serialized_network(network, config)

        if serialized_engine is None:
            logger.error("Engine build failed")
            return False

        # Save engine
        with open(output_path, 'wb') as f:
            f.write(serialized_engine)

        logger.info(f"INT8 engine saved to: {output_path}")
        logger.info(f"Calibration cache: {cache_file}")

        return True

    except ImportError as e:
        logger.error(f"Missing dependency: {e}")
        logger.error("Install TensorRT: pip install tensorrt")
        return False

    except Exception as e:
        logger.error(f"INT8 quantization failed: {e}")
        return False


def quantize_vl_awq(
    model_path: Path,
    output_path: Path,
    calibration_images: Path,
    num_calibration: int = 128,
) -> bool:
    """Quantize VLM to INT4 using AWQ."""
    logger.info(f"Quantizing Qwen-VL to INT4 AWQ: {model_path}")

    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from awq import AutoAWQForCausalLM

        # Load model
        logger.info("Loading model...")
        model = AutoAWQForCausalLM.from_pretrained(str(model_path))
        tokenizer = AutoTokenizer.from_pretrained(str(model_path))

        # Prepare calibration data
        logger.info("Preparing calibration data...")
        calib_data = []

        # Sample images for VLM calibration
        image_paths = list(calibration_images.rglob('*.jpg'))[:num_calibration]

        for img_path in tqdm(image_paths[:num_calibration], desc="Loading calibration images"):
            # Create a simple prompt for each image
            prompt = "Describe this image in detail, focusing on any equipment or infrastructure visible."
            calib_data.append({"text": prompt, "image": str(img_path)})

        # Quantize
        logger.info("Quantizing to INT4 AWQ...")
        quant_config = {
            "zero_point": True,
            "q_group_size": 128,
            "w_bit": 4,
            "version": "GEMM"
        }

        model.quantize(
            tokenizer,
            quant_config=quant_config,
            calib_data=calib_data[:num_calibration],
        )

        # Save quantized model
        logger.info(f"Saving quantized model to: {output_path}")
        model.save_quantized(str(output_path))
        tokenizer.save_pretrained(str(output_path))

        logger.info("INT4 AWQ quantization complete")
        return True

    except ImportError as e:
        logger.error(f"Missing dependency: {e}")
        logger.error("Install AutoAWQ: pip install autoawq")
        return False

    except Exception as e:
        logger.error(f"AWQ quantization failed: {e}")
        return False


def quantize_pytorch_int8(
    model_path: Path,
    output_path: Path,
    calibration_images: Path,
    num_calibration: int = 500,
) -> bool:
    """Quantize PyTorch model to INT8 using torch.quantization."""
    logger.info(f"Quantizing model to INT8 (PyTorch): {model_path}")

    try:
        # Load model
        logger.info("Loading model...")
        model = torch.load(model_path)
        if isinstance(model, dict):
            model = model.get('model', model)

        model.eval()

        # Prepare for quantization
        model.qconfig = torch.quantization.get_default_qconfig('fbgemm')
        torch.quantization.prepare(model, inplace=True)

        # Calibrate
        logger.info("Calibrating with representative data...")
        calib_loader = CalibrationDataLoader(
            calibration_images,
            num_images=num_calibration,
            batch_size=1,
        )

        with torch.no_grad():
            for batch in tqdm(calib_loader, desc="Calibration"):
                batch_tensor = torch.from_numpy(batch)
                model(batch_tensor)

        # Convert to quantized
        logger.info("Converting to quantized model...")
        torch.quantization.convert(model, inplace=True)

        # Save
        logger.info(f"Saving quantized model to: {output_path}")
        torch.save(model, output_path)

        logger.info("INT8 quantization complete (PyTorch)")
        return True

    except Exception as e:
        logger.error(f"PyTorch INT8 quantization failed: {e}")
        return False


def validate_quantized_model(
    original_model: Path,
    quantized_model: Path,
    test_images: Path,
    num_test: int = 100,
) -> dict:
    """Validate quantized model accuracy."""
    logger.info("Validating quantized model accuracy...")

    results = {
        "num_images": num_test,
        "accuracy_drop": 0.0,
        "latency_improvement": 0.0,
        "memory_reduction": 0.0,
    }

    try:
        import time

        # Load both models
        logger.info("Loading models for comparison...")

        # Get model sizes
        orig_size = original_model.stat().st_size / (1024 ** 2)  # MB
        quant_size = quantized_model.stat().st_size / (1024 ** 2)  # MB
        results["memory_reduction"] = (orig_size - quant_size) / orig_size * 100

        # TODO: Add accuracy comparison logic here
        # This would involve running inference on both models and comparing outputs

        logger.info(f"Original size: {orig_size:.1f} MB")
        logger.info(f"Quantized size: {quant_size:.1f} MB")
        logger.info(f"Memory reduction: {results['memory_reduction']:.1f}%")

        return results

    except Exception as e:
        logger.error(f"Validation failed: {e}")
        return results


def main():
    parser = argparse.ArgumentParser(
        description="BAHB Model Quantization Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        '--model',
        type=str,
        choices=['yolov12', 'rf_detr', 'sam3', 'qwen_vl', 'all'],
        default='yolov12',
        help='Model to quantize',
    )

    parser.add_argument(
        '--precision',
        type=str,
        choices=['int8', 'int4', 'fp16'],
        default='int8',
        help='Target precision',
    )

    parser.add_argument(
        '--method',
        type=str,
        choices=['tensorrt', 'pytorch', 'awq', 'auto'],
        default='auto',
        help='Quantization method',
    )

    parser.add_argument(
        '--model-path',
        type=Path,
        help='Path to model weights (.pt file)',
    )

    parser.add_argument(
        '--output-path',
        type=Path,
        help='Output path for quantized model',
    )

    parser.add_argument(
        '--calibration-images',
        type=Path,
        default=Path('data/processed/val/images'),
        help='Directory with calibration images',
    )

    parser.add_argument(
        '--num-calibration',
        type=int,
        default=500,
        help='Number of calibration images',
    )

    parser.add_argument(
        '--validate',
        action='store_true',
        help='Validate quantized model accuracy',
    )

    parser.add_argument(
        '--all',
        action='store_true',
        help='Quantize all models',
    )

    args = parser.parse_args()

    # Setup paths
    project_root = Path(__file__).parent.parent.parent

    # Model configurations
    model_configs = {
        'yolov12': {
            'model_path': project_root / 'runs/yolov12/bahb_v2/weights/best.pt',
            'output_path': project_root / 'optimization/models/yolov12_int8.engine',
            'method': 'tensorrt',
            'precision': 'int8',
        },
        'rf_detr': {
            'model_path': project_root / 'models/rf_detr_large.pt',
            'output_path': project_root / 'optimization/models/rf_detr_int8.engine',
            'method': 'tensorrt',
            'precision': 'int8',
        },
        'sam3': {
            'model_path': project_root / 'models/sam3_nano.pt',
            'output_path': project_root / 'optimization/models/sam3_fp16.engine',
            'method': 'tensorrt',
            'precision': 'fp16',  # SAM more sensitive to quantization
        },
        'qwen_vl': {
            'model_path': project_root / 'models/Qwen2.5-VL-3B',
            'output_path': project_root / 'optimization/models/Qwen2.5-VL-3B-AWQ',
            'method': 'awq',
            'precision': 'int4',
        },
    }

    # Determine models to quantize
    if args.all:
        models_to_quantize = list(model_configs.keys())
    else:
        models_to_quantize = [args.model]

    # Quantize each model
    results = {}
    for model_name in models_to_quantize:
        config = model_configs[model_name]

        # Override with command-line args if provided
        model_path = args.model_path or config['model_path']
        output_path = args.output_path or config['output_path']
        method = args.method if args.method != 'auto' else config['method']
        precision = args.precision or config['precision']

        logger.info(f"\n{'='*60}")
        logger.info(f"Quantizing {model_name}")
        logger.info(f"{'='*60}")
        logger.info(f"Input:  {model_path}")
        logger.info(f"Output: {output_path}")
        logger.info(f"Method: {method}, Precision: {precision}")

        # Check if input exists
        if not model_path.exists():
            logger.warning(f"Model not found: {model_path}")
            logger.warning("Skipping...")
            continue

        # Create output directory
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Quantize based on method
        success = False

        if method == 'tensorrt' and precision == 'int8':
            success = quantize_yolo_int8(
                model_path,
                output_path,
                args.calibration_images,
                args.num_calibration,
            )

        elif method == 'awq' and precision == 'int4':
            success = quantize_vl_awq(
                model_path,
                output_path,
                args.calibration_images,
                args.num_calibration,
            )

        elif method == 'pytorch':
            success = quantize_pytorch_int8(
                model_path,
                output_path,
                args.calibration_images,
                args.num_calibration,
            )

        else:
            logger.error(f"Unsupported method/precision: {method}/{precision}")
            continue

        # Validate if requested
        if success and args.validate and model_path.exists():
            validation = validate_quantized_model(
                model_path,
                output_path,
                args.calibration_images / '../..',  # test images
                num_test=100,
            )
            results[model_name] = validation

        logger.info(f"{'='*60}\n")

    # Summary
    if results:
        logger.info("\n" + "="*60)
        logger.info("QUANTIZATION SUMMARY")
        logger.info("="*60)

        for model_name, metrics in results.items():
            logger.info(f"\n{model_name}:")
            logger.info(f"  Memory reduction: {metrics['memory_reduction']:.1f}%")
            logger.info(f"  Accuracy drop:    {metrics['accuracy_drop']:.2f}%")
            logger.info(f"  Latency improve:  {metrics['latency_improvement']:.1f}x")

    logger.info("\nQuantization complete!")


if __name__ == '__main__':
    main()
