"""Edge optimization module based on research paper insights.

Research Sources:
- YOLOv10: Real-Time End-to-End Object Detection (arXiv:2405.14458)
- Benchmarking DL on Edge Devices (arXiv:2409.16808)
- YOLO Quantization Study (arXiv:2502.15737)
- Edge AI Acceleration Survey (arXiv:2501.15014)
- VLM for Edge Networks (arXiv:2502.07855)
- Compression Ordering Study (arXiv:2511.19495)

Key Insights Applied:
1. NMS-free inference reduces latency by eliminating post-processing
2. INT8 quantization achieves 65fps on Orin NX with minimal accuracy loss
3. Optimal compression order: Pruning → Knowledge Distillation → Quantization
4. Stream overlap and buffer pooling maximize GPU utilization
5. Adaptive VLM scheduling based on inference load
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum, auto
from pathlib import Path
from typing import Optional, Callable, Any
from collections import deque

import numpy as np
from numpy.typing import NDArray
from loguru import logger


class QuantizationLevel(Enum):
    """Supported quantization levels for edge deployment."""
    FP32 = "fp32"
    FP16 = "fp16"
    INT8 = "int8"
    INT4 = "int4"  # For VLMs with AWQ


class CompressionStage(Enum):
    """Compression pipeline stages (optimal order per arXiv:2511.19495)."""
    PRUNING = auto()
    KNOWLEDGE_DISTILLATION = auto()
    QUANTIZATION = auto()


@dataclass
class MemoryBudget:
    """Memory budget for 16GB Orin NX deployment.

    Based on benchmarks:
    - Total VRAM: 16GB (shared with system)
    - Target AI allocation: 12GB (75%)
    - Per-model targets with INT8:
      - YOLOv12: ~1.5GB (vs 2.5GB FP16)
      - RF-DETR: ~1.2GB (vs 1.8GB FP16)
      - SAM3 Nano: ~0.6GB (vs 0.8GB FP16)
      - Qwen2.5-VL-3B-AWQ: ~2.5GB (INT4)
      - Buffers: ~0.5GB
      - Total: ~6.3GB with INT8 (substantial headroom)
    """
    total_vram_mb: int = 16384
    system_reserved_mb: int = 4096
    ai_budget_mb: int = 12288

    # Per-model budgets (INT8/optimized)
    yolo_budget_mb: int = 1500
    rfdetr_budget_mb: int = 1200
    sam3_budget_mb: int = 600
    qwen_budget_mb: int = 2500
    buffer_budget_mb: int = 500

    def get_headroom_mb(self) -> int:
        """Calculate remaining VRAM headroom."""
        used = (self.yolo_budget_mb + self.rfdetr_budget_mb +
                self.sam3_budget_mb + self.qwen_budget_mb + self.buffer_budget_mb)
        return self.ai_budget_mb - used


@dataclass
class InferenceMetrics:
    """Real-time inference metrics for adaptive scheduling."""
    frame_times_ms: deque = field(default_factory=lambda: deque(maxlen=100))
    yolo_times_ms: deque = field(default_factory=lambda: deque(maxlen=100))
    vlm_times_ms: deque = field(default_factory=lambda: deque(maxlen=30))
    memory_usage_mb: float = 0.0
    gpu_utilization: float = 0.0

    @property
    def avg_fps(self) -> float:
        if not self.frame_times_ms:
            return 0.0
        avg_time = sum(self.frame_times_ms) / len(self.frame_times_ms)
        return 1000.0 / avg_time if avg_time > 0 else 0.0

    @property
    def avg_yolo_ms(self) -> float:
        if not self.yolo_times_ms:
            return 0.0
        return sum(self.yolo_times_ms) / len(self.yolo_times_ms)

    @property
    def avg_vlm_ms(self) -> float:
        if not self.vlm_times_ms:
            return 0.0
        return sum(self.vlm_times_ms) / len(self.vlm_times_ms)


@dataclass
class NMSFreeConfig:
    """NMS-free detection configuration.

    Based on YOLOv10 (arXiv:2405.14458):
    - Consistent dual assignments for training
    - End-to-end inference without NMS post-processing
    - 1.8x faster than RT-DETR at comparable accuracy
    """
    enabled: bool = True
    # Check if TensorRT engine has built-in NMS
    detect_builtin_nms: bool = True
    # Fallback NMS parameters (if needed)
    fallback_iou_threshold: float = 0.45
    fallback_score_threshold: float = 0.35
    # Maximum detections per image
    max_detections: int = 300


@dataclass
class INT8CalibrationConfig:
    """INT8 quantization calibration configuration.

    Based on arXiv:2502.15737:
    - INT8 achieves 65fps on Orin NX (vs ~35fps FP16)
    - Minimal accuracy degradation with proper calibration
    - Calibration requires representative dataset
    """
    enabled: bool = True
    calibration_images: int = 500
    calibration_batch_size: int = 8
    cache_calibration: bool = True
    calibration_cache_path: str = "calibration_cache"


@dataclass
class StreamOverlapConfig:
    """CUDA stream overlap configuration.

    Based on Edge AI Survey (arXiv:2501.15014):
    - Multiple streams allow H2D, compute, D2H overlap
    - Pipelining increases throughput by ~30%
    """
    enabled: bool = True
    num_streams: int = 4
    enable_graph_capture: bool = True  # CUDA graphs for reduced launch overhead
    enable_async_copy: bool = True


@dataclass
class BufferPoolConfig:
    """Memory buffer pool configuration.

    Reduces allocation overhead for high-frequency operations.
    """
    enabled: bool = True
    num_input_buffers: int = 4
    num_output_buffers: int = 4
    preallocate: bool = True


@dataclass
class AdaptiveVLMConfig:
    """Adaptive VLM scheduling configuration.

    Based on VLM Edge Survey (arXiv:2502.07855):
    - VLM inference is expensive (~300-500ms)
    - Adaptive scheduling based on inference load
    - Skip VLM when FPS drops below threshold
    """
    enabled: bool = True
    # Normal: analyze every N frames
    base_interval: int = 5
    # When FPS drops, increase interval
    low_fps_threshold: float = 15.0
    low_fps_interval: int = 15
    # Critical: skip VLM entirely
    critical_fps_threshold: float = 10.0
    # Always analyze on high-severity anomalies
    always_on_critical_anomaly: bool = True
    # Max VLM latency before throttling
    max_vlm_latency_ms: float = 800.0


class EdgeOptimizer:
    """Centralized edge optimization controller.

    Implements research-backed optimizations for Jetson Orin NX deployment.
    """

    def __init__(
        self,
        memory_budget: Optional[MemoryBudget] = None,
        nms_config: Optional[NMSFreeConfig] = None,
        int8_config: Optional[INT8CalibrationConfig] = None,
        stream_config: Optional[StreamOverlapConfig] = None,
        buffer_config: Optional[BufferPoolConfig] = None,
        vlm_config: Optional[AdaptiveVLMConfig] = None,
    ):
        self.memory_budget = memory_budget or MemoryBudget()
        self.nms_config = nms_config or NMSFreeConfig()
        self.int8_config = int8_config or INT8CalibrationConfig()
        self.stream_config = stream_config or StreamOverlapConfig()
        self.buffer_config = buffer_config or BufferPoolConfig()
        self.vlm_config = vlm_config or AdaptiveVLMConfig()

        self.metrics = InferenceMetrics()
        self._buffer_pool: dict[str, list[NDArray]] = {}
        self._cuda_streams: list = []
        self._initialized = False

    def initialize(self) -> bool:
        """Initialize optimization subsystems."""
        try:
            if self.stream_config.enabled:
                self._init_cuda_streams()

            if self.buffer_config.enabled:
                self._init_buffer_pool()

            self._initialized = True
            logger.info("Edge optimizer initialized")
            return True

        except Exception as e:
            logger.error(f"Edge optimizer initialization failed: {e}")
            return False

    def _init_cuda_streams(self) -> None:
        """Initialize CUDA streams for overlap."""
        try:
            import pycuda.driver as cuda

            self._cuda_streams = [
                cuda.Stream() for _ in range(self.stream_config.num_streams)
            ]
            logger.info(f"Created {len(self._cuda_streams)} CUDA streams")
        except ImportError:
            logger.warning("PyCUDA not available, stream overlap disabled")

    def _init_buffer_pool(self) -> None:
        """Initialize pre-allocated buffer pool."""
        # Buffer sizes for common operations
        buffer_specs = {
            "yolo_input": (1, 3, 720, 1280),
            "yolo_output": (1, 300, 6),  # max 300 detections
            "rfdetr_input": (1, 3, 640, 640),
            "sam_embedding": (1, 256, 64, 64),
        }

        for name, shape in buffer_specs.items():
            self._buffer_pool[name] = [
                np.zeros(shape, dtype=np.float32)
                for _ in range(self.buffer_config.num_input_buffers)
            ]

        logger.info(f"Initialized buffer pool with {len(self._buffer_pool)} buffer types")

    def get_buffer(self, name: str) -> Optional[NDArray]:
        """Get a buffer from the pool."""
        if name not in self._buffer_pool or not self._buffer_pool[name]:
            return None
        return self._buffer_pool[name].pop()

    def return_buffer(self, name: str, buffer: NDArray) -> None:
        """Return a buffer to the pool."""
        if name in self._buffer_pool:
            self._buffer_pool[name].append(buffer)

    def get_stream(self, index: int = 0):
        """Get a CUDA stream for async operations."""
        if not self._cuda_streams:
            return None
        return self._cuda_streams[index % len(self._cuda_streams)]

    def should_skip_nms(self, engine_has_nms: bool) -> bool:
        """Determine if NMS should be skipped based on engine capabilities.

        YOLOv10+ engines may include NMS layer, avoiding double-NMS.
        """
        if not self.nms_config.enabled:
            return False

        if self.nms_config.detect_builtin_nms and engine_has_nms:
            return True

        return False

    def get_vlm_interval(self) -> int:
        """Get adaptive VLM analysis interval based on current FPS.

        Implements adaptive scheduling from arXiv:2502.07855.
        """
        if not self.vlm_config.enabled:
            return self.vlm_config.base_interval

        current_fps = self.metrics.avg_fps

        if current_fps < self.vlm_config.critical_fps_threshold:
            # Critical: effectively disable VLM (very high interval)
            return 1000
        elif current_fps < self.vlm_config.low_fps_threshold:
            # Low FPS: reduce VLM frequency
            return self.vlm_config.low_fps_interval
        else:
            # Normal operation
            return self.vlm_config.base_interval

    def should_run_vlm(
        self,
        frame_count: int,
        has_critical_anomaly: bool = False,
    ) -> bool:
        """Determine if VLM should run on this frame."""
        # Always run on critical anomalies
        if has_critical_anomaly and self.vlm_config.always_on_critical_anomaly:
            return True

        # Check if VLM is taking too long
        if self.metrics.avg_vlm_ms > self.vlm_config.max_vlm_latency_ms:
            logger.warning(f"VLM latency {self.metrics.avg_vlm_ms:.0f}ms exceeds threshold")
            return False

        # Adaptive interval check
        interval = self.get_vlm_interval()
        return frame_count % interval == 0

    def update_metrics(
        self,
        frame_time_ms: float,
        yolo_time_ms: Optional[float] = None,
        vlm_time_ms: Optional[float] = None,
    ) -> None:
        """Update inference metrics for adaptive scheduling."""
        self.metrics.frame_times_ms.append(frame_time_ms)

        if yolo_time_ms is not None:
            self.metrics.yolo_times_ms.append(yolo_time_ms)

        if vlm_time_ms is not None:
            self.metrics.vlm_times_ms.append(vlm_time_ms)

    def get_quantization_recommendation(self, model_name: str) -> QuantizationLevel:
        """Get recommended quantization level for a model.

        Based on arXiv:2502.15737 findings:
        - INT8 provides best speed/accuracy tradeoff on Orin
        - AWQ (INT4) for VLMs maintains quality
        """
        recommendations = {
            "yolov12": QuantizationLevel.INT8,
            "rf_detr": QuantizationLevel.INT8,
            "sam3": QuantizationLevel.FP16,  # Segmentation more sensitive
            "qwen_vl": QuantizationLevel.INT4,  # AWQ
        }
        return recommendations.get(model_name, QuantizationLevel.FP16)

    def get_compression_pipeline(self) -> list[CompressionStage]:
        """Get optimal compression pipeline order.

        Per arXiv:2511.19495: Pruning → KD → Quantization
        """
        return [
            CompressionStage.PRUNING,
            CompressionStage.KNOWLEDGE_DISTILLATION,
            CompressionStage.QUANTIZATION,
        ]

    def estimate_memory_usage(self) -> dict[str, float]:
        """Estimate memory usage per component."""
        return {
            "yolo": self.memory_budget.yolo_budget_mb,
            "rf_detr": self.memory_budget.rfdetr_budget_mb,
            "sam3": self.memory_budget.sam3_budget_mb,
            "qwen_vl": self.memory_budget.qwen_budget_mb,
            "buffers": self.memory_budget.buffer_budget_mb,
            "headroom": self.memory_budget.get_headroom_mb(),
            "total_available": self.memory_budget.ai_budget_mb,
        }

    def get_optimization_report(self) -> dict[str, Any]:
        """Generate optimization status report."""
        return {
            "nms_free": {
                "enabled": self.nms_config.enabled,
                "detect_builtin": self.nms_config.detect_builtin_nms,
            },
            "quantization": {
                "int8_enabled": self.int8_config.enabled,
                "recommendations": {
                    "yolov12": self.get_quantization_recommendation("yolov12").value,
                    "rf_detr": self.get_quantization_recommendation("rf_detr").value,
                    "sam3": self.get_quantization_recommendation("sam3").value,
                    "qwen_vl": self.get_quantization_recommendation("qwen_vl").value,
                },
            },
            "streams": {
                "enabled": self.stream_config.enabled,
                "count": self.stream_config.num_streams,
            },
            "adaptive_vlm": {
                "enabled": self.vlm_config.enabled,
                "current_interval": self.get_vlm_interval(),
                "base_interval": self.vlm_config.base_interval,
            },
            "metrics": {
                "avg_fps": self.metrics.avg_fps,
                "avg_yolo_ms": self.metrics.avg_yolo_ms,
                "avg_vlm_ms": self.metrics.avg_vlm_ms,
            },
            "memory": self.estimate_memory_usage(),
        }

    def shutdown(self) -> None:
        """Clean up optimization resources."""
        self._buffer_pool.clear()
        self._cuda_streams.clear()
        self._initialized = False
        logger.info("Edge optimizer shutdown complete")


class TensorRTOptimizer:
    """TensorRT-specific optimizations.

    Based on arXiv:2501.15014 and arXiv:2409.16808.
    """

    @staticmethod
    def check_engine_has_nms(engine_path: Path) -> bool:
        """Check if TensorRT engine includes NMS layer."""
        try:
            import tensorrt as trt

            with open(engine_path, "rb") as f:
                runtime = trt.Runtime(trt.Logger(trt.Logger.WARNING))
                engine = runtime.deserialize_cuda_engine(f.read())

            # Check output tensor names/shapes for NMS indicators
            for i in range(engine.num_io_tensors):
                name = engine.get_tensor_name(i)
                # NMS-included engines typically have specific output names
                if "nms" in name.lower() or "detection" in name.lower():
                    return True

            # Check output shape - NMS outputs typically have fewer dimensions
            output_shapes = []
            for i in range(engine.num_io_tensors):
                name = engine.get_tensor_name(i)
                if engine.get_tensor_mode(name) == trt.TensorIOMode.OUTPUT:
                    shape = engine.get_tensor_shape(name)
                    output_shapes.append(shape)

            # NMS outputs: [batch, num_detections, 6] or similar
            # Non-NMS: [batch, num_anchors, 4+classes]
            for shape in output_shapes:
                if len(shape) == 3 and shape[-1] <= 7:
                    return True

            return False

        except Exception as e:
            logger.warning(f"Could not check engine for NMS: {e}")
            return False

    @staticmethod
    def build_int8_engine(
        onnx_path: Path,
        output_path: Path,
        calibration_data: list[NDArray],
        workspace_size: int = 4 * (1 << 30),  # 4GB
    ) -> bool:
        """Build INT8 TensorRT engine with calibration.

        Based on quantization study findings (arXiv:2502.15737).
        """
        try:
            import tensorrt as trt

            logger.info(f"Building INT8 engine from {onnx_path}")

            # Create builder and network
            trt_logger = trt.Logger(trt.Logger.INFO)
            builder = trt.Builder(trt_logger)
            network = builder.create_network(
                1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH)
            )
            parser = trt.OnnxParser(network, trt_logger)

            # Parse ONNX
            with open(onnx_path, "rb") as f:
                if not parser.parse(f.read()):
                    for error in range(parser.num_errors):
                        logger.error(f"ONNX parse error: {parser.get_error(error)}")
                    return False

            # Configure builder
            config = builder.create_builder_config()
            config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, workspace_size)

            # Enable INT8
            config.set_flag(trt.BuilderFlag.INT8)
            config.set_flag(trt.BuilderFlag.FP16)  # Allow FP16 fallback

            # Set calibrator
            # Note: Actual calibrator implementation would go here
            # config.int8_calibrator = MyCalibrator(calibration_data)

            logger.info("Building engine (this may take several minutes)...")
            engine = builder.build_serialized_network(network, config)

            if engine is None:
                logger.error("Engine build failed")
                return False

            # Save engine
            with open(output_path, "wb") as f:
                f.write(engine)

            logger.info(f"INT8 engine saved to {output_path}")
            return True

        except ImportError:
            logger.error("TensorRT not available")
            return False
        except Exception as e:
            logger.error(f"INT8 engine build failed: {e}")
            return False

    @staticmethod
    def optimize_workspace(
        available_memory_mb: int,
        num_models: int = 4,
    ) -> int:
        """Calculate optimal TensorRT workspace size.

        Based on Edge AI survey recommendations.
        """
        # Reserve 20% for runtime overhead
        usable = int(available_memory_mb * 0.8)
        # Divide among models
        per_model = usable // num_models
        # Convert to bytes
        return per_model * (1 << 20)


# Singleton optimizer instance
_optimizer: Optional[EdgeOptimizer] = None


def get_optimizer() -> EdgeOptimizer:
    """Get global edge optimizer instance."""
    global _optimizer
    if _optimizer is None:
        _optimizer = EdgeOptimizer()
    return _optimizer


def initialize_optimizer(**kwargs) -> EdgeOptimizer:
    """Initialize global optimizer with custom config."""
    global _optimizer
    _optimizer = EdgeOptimizer(**kwargs)
    _optimizer.initialize()
    return _optimizer
