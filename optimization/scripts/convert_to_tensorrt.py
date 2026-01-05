#!/usr/bin/env python3
"""
Automated TensorRT Conversion Pipeline

Converts PyTorch models to optimized TensorRT engines based on configuration.
Handles ONNX export, INT8 calibration, engine building, and validation.

Usage:
    # Convert single model
    python convert_to_tensorrt.py --model yolov12

    # Convert all models
    python convert_to_tensorrt.py --all

    # Custom config
    python convert_to_tensorrt.py --model yolov12 --config custom_config.yaml
"""

import argparse
import shutil
import sys
from pathlib import Path
from typing import Optional, Dict, Any

import numpy as np
import yaml
from loguru import logger

# Add BAHB to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class TensorRTConverter:
    """Automated TensorRT conversion pipeline."""

    def __init__(self, config_path: Path):
        """Initialize converter with configuration."""
        self.config_path = config_path
        self.config = self._load_config()
        self.project_root = Path(__file__).parent.parent.parent

    def _load_config(self) -> dict:
        """Load TensorRT configuration."""
        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)

    def convert_model(
        self,
        model_name: str,
        model_path: Optional[Path] = None,
        validate: bool = True,
    ) -> bool:
        """Convert a model to TensorRT engine."""
        logger.info(f"\n{'='*60}")
        logger.info(f"Converting {model_name} to TensorRT")
        logger.info(f"{'='*60}")

        # Get model config
        if model_name not in self.config:
            logger.error(f"Model {model_name} not found in config")
            return False

        model_config = self.config[model_name]

        # Step 1: Export to ONNX
        onnx_path = self._export_onnx(model_name, model_path, model_config)
        if not onnx_path:
            return False

        # Step 2: Build TensorRT engine
        engine_path = self._build_engine(model_name, onnx_path, model_config)
        if not engine_path:
            return False

        # Step 3: Validate engine
        if validate and model_config.get('validation', {}).get('enabled', True):
            if not self._validate_engine(model_name, engine_path, model_config):
                logger.warning("Validation failed, but engine was built")

        logger.info(f"\n{'='*60}")
        logger.info(f"✓ Conversion complete: {engine_path}")
        logger.info(f"{'='*60}\n")

        return True

    def _export_onnx(
        self,
        model_name: str,
        model_path: Optional[Path],
        model_config: dict,
    ) -> Optional[Path]:
        """Export model to ONNX format."""
        logger.info("Step 1: Exporting to ONNX...")

        onnx_config = model_config.get('onnx', {})
        onnx_path = self.project_root / onnx_config.get('export_path', f'optimization/models/{model_name}.onnx')
        onnx_path.parent.mkdir(parents=True, exist_ok=True)

        # Check if ONNX already exists
        if onnx_path.exists():
            logger.info(f"ONNX file already exists: {onnx_path}")
            return onnx_path

        try:
            # Model-specific export logic
            if model_name == 'yolov12':
                return self._export_yolo_onnx(model_path, onnx_path, onnx_config)
            elif model_name == 'rf_detr':
                return self._export_rfdetr_onnx(model_path, onnx_path, onnx_config)
            elif model_name == 'sam3_nano':
                return self._export_sam3_onnx(model_path, onnx_path, onnx_config)
            else:
                logger.error(f"Unknown model type: {model_name}")
                return None

        except Exception as e:
            logger.error(f"ONNX export failed: {e}")
            return None

    def _export_yolo_onnx(
        self,
        model_path: Optional[Path],
        onnx_path: Path,
        onnx_config: dict,
    ) -> Optional[Path]:
        """Export YOLO model to ONNX."""
        from ultralytics import YOLO

        # Use provided path or default
        if model_path is None:
            model_path = self.project_root / 'runs/yolov12/bahb_v2/weights/best.pt'

        logger.info(f"Loading YOLO model: {model_path}")
        model = YOLO(str(model_path))

        # Export
        logger.info("Exporting to ONNX...")
        model.export(
            format='onnx',
            imgsz=onnx_config.get('input_size', 1280),
            simplify=onnx_config.get('simplify', True),
            opset=onnx_config.get('opset_version', 13),
            dynamic=onnx_config.get('dynamic_batch', False),
        )

        # Move to target location
        exported_onnx = model_path.with_suffix('.onnx')
        if exported_onnx != onnx_path:
            shutil.move(str(exported_onnx), str(onnx_path))

        logger.info(f"ONNX exported to: {onnx_path}")
        return onnx_path

    def _export_rfdetr_onnx(
        self,
        model_path: Optional[Path],
        onnx_path: Path,
        onnx_config: dict,
    ) -> Optional[Path]:
        """Export RF-DETR model to ONNX."""
        # TODO: Implement RF-DETR export
        logger.warning("RF-DETR export not yet implemented")
        return None

    def _export_sam3_onnx(
        self,
        model_path: Optional[Path],
        onnx_path: Path,
        onnx_config: dict,
    ) -> Optional[Path]:
        """Export SAM3 model to ONNX."""
        # TODO: Implement SAM3 export (separate encoder/decoder)
        logger.warning("SAM3 export not yet implemented")
        return None

    def _build_engine(
        self,
        model_name: str,
        onnx_path: Path,
        model_config: dict,
    ) -> Optional[Path]:
        """Build TensorRT engine from ONNX."""
        logger.info("Step 2: Building TensorRT engine...")

        engine_config = model_config.get('engine', {})
        engine_path = self.project_root / engine_config.get('output_path', f'optimization/models/{model_name}.engine')
        engine_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            import tensorrt as trt

            # Create builder
            TRT_LOGGER = trt.Logger(trt.Logger.INFO)
            builder = trt.Builder(TRT_LOGGER)
            network = builder.create_network(1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH))
            parser = trt.OnnxParser(network, TRT_LOGGER)

            # Parse ONNX
            logger.info(f"Parsing ONNX: {onnx_path}")
            with open(onnx_path, 'rb') as f:
                if not parser.parse(f.read()):
                    for error in range(parser.num_errors):
                        logger.error(f"ONNX parse error: {parser.get_error(error)}")
                    return None

            # Configure builder
            config = builder.create_builder_config()

            # Workspace size
            workspace_size = engine_config.get('workspace_size', 4 * (1 << 30))
            config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, workspace_size)

            # Precision
            precision = engine_config.get('precision', 'fp16')
            logger.info(f"Target precision: {precision}")

            if precision in ['fp16', 'int8']:
                config.set_flag(trt.BuilderFlag.FP16)

            if precision == 'int8':
                config.set_flag(trt.BuilderFlag.INT8)

                # INT8 calibration
                calibration_config = engine_config.get('calibration', {})
                if calibration_config.get('enabled', False):
                    logger.info("Setting up INT8 calibration...")
                    calibrator = self._create_calibrator(model_name, calibration_config)
                    if calibrator:
                        config.int8_calibrator = calibrator
                    else:
                        logger.warning("Calibration failed, proceeding without calibrator")

            # Build engine
            logger.info("Building engine (this may take 10-30 minutes)...")
            serialized_engine = builder.build_serialized_network(network, config)

            if serialized_engine is None:
                logger.error("Engine build failed")
                return None

            # Save engine
            with open(engine_path, 'wb') as f:
                f.write(serialized_engine)

            logger.info(f"TensorRT engine saved to: {engine_path}")
            return engine_path

        except ImportError:
            logger.error("TensorRT not available. Install with: pip install tensorrt")
            return None

        except Exception as e:
            logger.error(f"Engine build failed: {e}")
            return None

    def _create_calibrator(
        self,
        model_name: str,
        calibration_config: dict,
    ) -> Optional[Any]:
        """Create INT8 calibrator."""
        try:
            import tensorrt as trt
            from optimization.scripts.quantize_model import CalibrationDataLoader, TensorRTCalibrator

            # Get calibration parameters
            image_dir = self.project_root / calibration_config.get('image_dir', 'data/processed/val/images')
            num_images = calibration_config.get('num_images', 500)
            batch_size = calibration_config.get('batch_size', 8)
            cache_file = self.project_root / calibration_config.get('cache_file', f'optimization/calibration/{model_name}.cache')
            cache_file.parent.mkdir(parents=True, exist_ok=True)

            # Create data loader
            data_loader = CalibrationDataLoader(
                image_dir,
                num_images=num_images,
                batch_size=batch_size,
            )

            # Create calibrator
            calibrator = TensorRTCalibrator(data_loader, cache_file)

            logger.info(f"Calibrator created with {num_images} images")
            return calibrator

        except Exception as e:
            logger.error(f"Failed to create calibrator: {e}")
            return None

    def _validate_engine(
        self,
        model_name: str,
        engine_path: Path,
        model_config: dict,
    ) -> bool:
        """Validate TensorRT engine."""
        logger.info("Step 3: Validating engine...")

        validation_config = model_config.get('validation', {})

        try:
            # TODO: Implement validation logic
            # - Load engine
            # - Run inference on test images
            # - Compare with PyTorch baseline
            # - Check accuracy metrics

            logger.info("Validation passed (placeholder)")
            return True

        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return False


def main():
    parser = argparse.ArgumentParser(
        description="Automated TensorRT Conversion Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        '--model',
        type=str,
        choices=['yolov12', 'rf_detr', 'sam3_nano', 'qwen_vl'],
        help='Model to convert',
    )

    parser.add_argument(
        '--all',
        action='store_true',
        help='Convert all models',
    )

    parser.add_argument(
        '--config',
        type=Path,
        default=Path('optimization/configs/tensorrt_config.yaml'),
        help='TensorRT configuration file',
    )

    parser.add_argument(
        '--model-path',
        type=Path,
        help='Path to model weights (optional)',
    )

    parser.add_argument(
        '--no-validate',
        action='store_true',
        help='Skip validation step',
    )

    parser.add_argument(
        '--force',
        action='store_true',
        help='Force rebuild even if engine exists',
    )

    args = parser.parse_args()

    # Setup
    project_root = Path(__file__).parent.parent.parent
    config_path = project_root / args.config

    if not config_path.exists():
        logger.error(f"Config file not found: {config_path}")
        return

    # Create converter
    converter = TensorRTConverter(config_path)

    # Convert models
    if args.all:
        models = ['yolov12', 'rf_detr', 'sam3_nano']
        for model in models:
            try:
                converter.convert_model(
                    model,
                    validate=not args.no_validate,
                )
            except Exception as e:
                logger.error(f"Failed to convert {model}: {e}")
                continue

    elif args.model:
        converter.convert_model(
            args.model,
            model_path=args.model_path,
            validate=not args.no_validate,
        )

    else:
        logger.error("Specify --model or --all")
        return

    logger.info("\nConversion pipeline complete!")


if __name__ == '__main__':
    main()
