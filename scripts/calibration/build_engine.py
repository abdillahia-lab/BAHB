#!/usr/bin/env python3
"""
Build TensorRT INT8 engine from ONNX model with calibration.
Supports FP32, FP16, and INT8 precision modes.
"""

import os
import sys
import argparse
import json
from pathlib import Path
from typing import Optional, List

import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit

# Add calibration module to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from calibrator import create_calibrator


TRT_LOGGER = trt.Logger(trt.Logger.VERBOSE)


class EngineBuilder:
    """TensorRT engine builder with INT8 calibration support."""

    def __init__(
        self,
        onnx_path: str,
        engine_path: str,
        precision: str = 'fp16',
        max_batch_size: int = 1,
        workspace_size: int = 4,  # GB
        verbose: bool = True
    ):
        """
        Initialize engine builder.

        Args:
            onnx_path: Path to ONNX model
            engine_path: Path to save engine
            precision: Precision mode ('fp32', 'fp16', 'int8')
            max_batch_size: Maximum batch size
            workspace_size: Maximum workspace size in GB
            verbose: Enable verbose logging
        """
        self.onnx_path = onnx_path
        self.engine_path = engine_path
        self.precision = precision.lower()
        self.max_batch_size = max_batch_size
        self.workspace_size = workspace_size * (1 << 30)  # Convert GB to bytes

        # Set logger level
        if verbose:
            TRT_LOGGER.min_severity = trt.Logger.Severity.VERBOSE
        else:
            TRT_LOGGER.min_severity = trt.Logger.Severity.INFO

        self.builder = None
        self.network = None
        self.config = None
        self.calibrator = None

    def create_network(self):
        """Create TensorRT network from ONNX model."""
        print(f"\nLoading ONNX model: {self.onnx_path}")

        # Create builder and network
        self.builder = trt.Builder(TRT_LOGGER)
        network_flags = 1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH)
        self.network = self.builder.create_network(network_flags)

        # Create ONNX parser
        parser = trt.OnnxParser(self.network, TRT_LOGGER)

        # Parse ONNX model
        with open(self.onnx_path, 'rb') as f:
            if not parser.parse(f.read()):
                print("ERROR: Failed to parse ONNX model")
                for error_idx in range(parser.num_errors):
                    print(parser.get_error(error_idx))
                return False

        print(f"Successfully loaded ONNX model")
        print(f"  Network inputs: {self.network.num_inputs}")
        print(f"  Network outputs: {self.network.num_outputs}")

        # Print input info
        for i in range(self.network.num_inputs):
            input_tensor = self.network.get_input(i)
            print(f"  Input {i}: {input_tensor.name}, shape: {input_tensor.shape}, dtype: {input_tensor.dtype}")

        # Print output info
        for i in range(self.network.num_outputs):
            output_tensor = self.network.get_output(i)
            print(f"  Output {i}: {output_tensor.name}, shape: {output_tensor.shape}, dtype: {output_tensor.dtype}")

        return True

    def create_config(
        self,
        calibration_manifest: Optional[str] = None,
        calibration_cache: Optional[str] = None,
        timing_cache: Optional[str] = None,
        fp16_detection_heads: bool = True
    ):
        """
        Create builder configuration.

        Args:
            calibration_manifest: Path to calibration manifest for INT8
            calibration_cache: Path to calibration cache
            timing_cache: Path to timing cache
            fp16_detection_heads: Use FP16 for detection heads in INT8 mode
        """
        print(f"\nConfiguring builder for {self.precision.upper()} precision...")

        self.config = self.builder.create_builder_config()

        # Set workspace size
        self.config.max_workspace_size = self.workspace_size
        print(f"  Workspace size: {self.workspace_size / (1<<30):.2f} GB")

        # Set precision flags
        if self.precision == 'fp16':
            if self.builder.platform_has_fast_fp16:
                self.config.set_flag(trt.BuilderFlag.FP16)
                print("  FP16 mode enabled")
            else:
                print("  WARNING: Platform doesn't support fast FP16, using FP32")

        elif self.precision == 'int8':
            if self.builder.platform_has_fast_int8:
                self.config.set_flag(trt.BuilderFlag.INT8)
                print("  INT8 mode enabled")

                # Enable FP16 as fallback
                if self.builder.platform_has_fast_fp16:
                    self.config.set_flag(trt.BuilderFlag.FP16)
                    print("  FP16 mode enabled (fallback)")

                # Setup calibrator
                if calibration_manifest:
                    if not calibration_cache:
                        calibration_cache = str(Path(self.engine_path).parent / 'calibration.cache')

                    print(f"  Setting up INT8 calibrator...")
                    print(f"    Manifest: {calibration_manifest}")
                    print(f"    Cache: {calibration_cache}")

                    # Get input shape from network
                    input_tensor = self.network.get_input(0)
                    input_shape = tuple(input_tensor.shape[1:])  # Skip batch dimension

                    self.calibrator = create_calibrator(
                        manifest_file=calibration_manifest,
                        cache_file=calibration_cache,
                        batch_size=8,
                        input_shape=input_shape,
                        calibrator_type='entropy',
                        use_letterbox=False
                    )

                    self.config.int8_calibrator = self.calibrator
                    print("  Calibrator configured")

                else:
                    print("  ERROR: INT8 mode requires calibration manifest")
                    return False

                # Set FP16 precision for detection heads
                if fp16_detection_heads:
                    self.set_layer_precisions()

            else:
                print("  ERROR: Platform doesn't support INT8")
                return False

        # Load timing cache if available
        if timing_cache and os.path.exists(timing_cache):
            print(f"  Loading timing cache from {timing_cache}")
            with open(timing_cache, 'rb') as f:
                timing_cache_data = f.read()
            # TensorRT 8.x API
            if hasattr(self.config, 'create_timing_cache'):
                cache = self.config.create_timing_cache(timing_cache_data)
                self.config.set_timing_cache(cache, ignore_mismatch=False)

        # Enable optimization profiles
        if self.builder.platform_has_fast_fp16 or self.precision == 'int8':
            self.config.set_flag(trt.BuilderFlag.PREFER_PRECISION_CONSTRAINTS)

        return True

    def set_layer_precisions(self):
        """Set specific layer precisions (e.g., FP16 for detection heads)."""
        print("  Setting layer precisions...")

        # Patterns for detection heads (typically the output layers)
        detection_patterns = ['output', 'detect', 'head', 'pred', 'cls', 'obj', 'box']

        num_layers = self.network.num_layers
        fp16_layers = 0

        for i in range(num_layers):
            layer = self.network.get_layer(i)
            layer_name = layer.name.lower()

            # Check if this is a detection head layer
            is_detection_head = any(pattern in layer_name for pattern in detection_patterns)

            if is_detection_head:
                # Set to FP16 precision
                layer.precision = trt.float16
                layer.set_output_type(0, trt.float16)
                fp16_layers += 1

        print(f"  Set {fp16_layers}/{num_layers} layers to FP16 precision")

    def build_engine(self, timing_cache_path: Optional[str] = None) -> bool:
        """
        Build the TensorRT engine.

        Args:
            timing_cache_path: Path to save timing cache

        Returns:
            True if successful
        """
        print(f"\nBuilding TensorRT engine...")
        print(f"  This may take several minutes...")

        # Build engine
        try:
            serialized_engine = self.builder.build_serialized_network(self.network, self.config)

            if serialized_engine is None:
                print("ERROR: Failed to build engine")
                return False

        except Exception as e:
            print(f"ERROR: Engine build failed: {e}")
            return False

        # Save timing cache
        if timing_cache_path:
            if hasattr(self.config, 'get_timing_cache'):
                timing_cache = self.config.get_timing_cache()
                if timing_cache:
                    cache_data = timing_cache.serialize()
                    os.makedirs(os.path.dirname(timing_cache_path), exist_ok=True)
                    with open(timing_cache_path, 'wb') as f:
                        f.write(cache_data)
                    print(f"  Timing cache saved to {timing_cache_path}")

        # Save engine
        engine_dir = os.path.dirname(self.engine_path)
        if engine_dir:
            os.makedirs(engine_dir, exist_ok=True)

        with open(self.engine_path, 'wb') as f:
            f.write(serialized_engine)

        print(f"\nEngine successfully built and saved to: {self.engine_path}")

        # Get engine size
        engine_size = os.path.getsize(self.engine_path) / (1 << 20)  # MB
        print(f"  Engine size: {engine_size:.2f} MB")

        return True

    def inspect_engine(self):
        """Inspect the built engine and print information."""
        print(f"\nInspecting engine...")

        # Load engine
        with open(self.engine_path, 'rb') as f:
            runtime = trt.Runtime(TRT_LOGGER)
            engine = runtime.deserialize_cuda_engine(f.read())

        if engine is None:
            print("ERROR: Failed to load engine")
            return

        print(f"\nEngine Information:")
        print(f"  Inputs: {engine.num_bindings // 2}")
        print(f"  Outputs: {engine.num_bindings // 2}")

        for i in range(engine.num_bindings):
            binding_name = engine.get_binding_name(i)
            binding_shape = engine.get_binding_shape(i)
            binding_dtype = engine.get_binding_dtype(i)
            is_input = engine.binding_is_input(i)

            print(f"  Binding {i} ({'INPUT' if is_input else 'OUTPUT'}):")
            print(f"    Name: {binding_name}")
            print(f"    Shape: {binding_shape}")
            print(f"    DType: {binding_dtype}")

    def run(
        self,
        calibration_manifest: Optional[str] = None,
        calibration_cache: Optional[str] = None,
        timing_cache: Optional[str] = None,
        fp16_detection_heads: bool = True
    ) -> bool:
        """
        Run the full engine building pipeline.

        Args:
            calibration_manifest: Path to calibration manifest
            calibration_cache: Path to calibration cache
            timing_cache: Path to timing cache
            fp16_detection_heads: Use FP16 for detection heads

        Returns:
            True if successful
        """
        print("="*80)
        print("BAHB TensorRT Engine Builder")
        print("="*80)

        # Create network
        if not self.create_network():
            return False

        # Create config
        if not self.create_config(
            calibration_manifest=calibration_manifest,
            calibration_cache=calibration_cache,
            timing_cache=timing_cache,
            fp16_detection_heads=fp16_detection_heads
        ):
            return False

        # Build engine
        if not self.build_engine(timing_cache_path=timing_cache):
            return False

        # Inspect engine
        self.inspect_engine()

        print("\n" + "="*80)
        print("Engine build complete!")
        print("="*80)

        return True


def main():
    parser = argparse.ArgumentParser(description="Build TensorRT engine from ONNX model")
    parser.add_argument(
        '--onnx',
        type=str,
        required=True,
        help='Path to ONNX model'
    )
    parser.add_argument(
        '--engine',
        type=str,
        required=True,
        help='Path to save TensorRT engine'
    )
    parser.add_argument(
        '--precision',
        type=str,
        choices=['fp32', 'fp16', 'int8'],
        default='int8',
        help='Precision mode'
    )
    parser.add_argument(
        '--calibration-manifest',
        type=str,
        help='Path to calibration manifest JSON (required for INT8)'
    )
    parser.add_argument(
        '--calibration-cache',
        type=str,
        help='Path to calibration cache'
    )
    parser.add_argument(
        '--timing-cache',
        type=str,
        help='Path to timing cache'
    )
    parser.add_argument(
        '--workspace-size',
        type=int,
        default=4,
        help='Maximum workspace size in GB'
    )
    parser.add_argument(
        '--max-batch-size',
        type=int,
        default=1,
        help='Maximum batch size'
    )
    parser.add_argument(
        '--fp16-heads',
        action='store_true',
        default=True,
        help='Use FP16 for detection heads in INT8 mode'
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Reduce logging verbosity'
    )

    args = parser.parse_args()

    # Validate INT8 requirements
    if args.precision == 'int8' and not args.calibration_manifest:
        parser.error("INT8 mode requires --calibration-manifest")

    # Create builder
    builder = EngineBuilder(
        onnx_path=args.onnx,
        engine_path=args.engine,
        precision=args.precision,
        max_batch_size=args.max_batch_size,
        workspace_size=args.workspace_size,
        verbose=not args.quiet
    )

    # Run build
    success = builder.run(
        calibration_manifest=args.calibration_manifest,
        calibration_cache=args.calibration_cache,
        timing_cache=args.timing_cache,
        fp16_detection_heads=args.fp16_heads
    )

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
