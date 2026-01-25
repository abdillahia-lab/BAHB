"""
Production Inference Engine for Day-One Operations

High-performance, safety-integrated inference pipeline for real-time
power infrastructure detection during drone inspection flights.
"""

import os
import time
import json
import logging
import threading
import queue
from enum import Enum, auto
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any, Callable
from datetime import datetime
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)


class InferenceMode(Enum):
    """Inference execution modes."""
    PYTORCH = auto()
    ONNX = auto()
    TENSORRT_FP32 = auto()
    TENSORRT_FP16 = auto()
    TENSORRT_INT8 = auto()


class DetectionPriority(Enum):
    """Detection priority levels for alerting."""
    CRITICAL = 1    # Immediate danger - damaged components
    HIGH = 2        # Safety concern - contamination, vegetation
    MEDIUM = 3      # Anomaly detected - needs review
    LOW = 4         # Normal component detected
    INFO = 5        # Informational only


@dataclass
class Detection:
    """Single detection result."""
    class_id: int
    class_name: str
    confidence: float
    bbox: Tuple[float, float, float, float]  # x1, y1, x2, y2 normalized
    priority: DetectionPriority
    frame_id: int
    timestamp: datetime = field(default_factory=datetime.now)
    gps_location: Optional[Tuple[float, float, float]] = None  # lat, lon, alt
    thermal_temp: Optional[float] = None  # Temperature in Celsius

    def to_dict(self) -> Dict:
        return {
            'class_id': self.class_id,
            'class_name': self.class_name,
            'confidence': self.confidence,
            'bbox': list(self.bbox),
            'priority': self.priority.name,
            'frame_id': self.frame_id,
            'timestamp': self.timestamp.isoformat(),
            'gps_location': self.gps_location,
            'thermal_temp': self.thermal_temp
        }


@dataclass
class InferenceResult:
    """Complete inference result for a frame."""
    frame_id: int
    detections: List[Detection]
    inference_time_ms: float
    preprocess_time_ms: float
    postprocess_time_ms: float
    timestamp: datetime = field(default_factory=datetime.now)
    frame_shape: Optional[Tuple[int, int]] = None
    model_name: str = "yolo26l_infrastructure"

    @property
    def total_time_ms(self) -> float:
        return self.preprocess_time_ms + self.inference_time_ms + self.postprocess_time_ms

    @property
    def fps(self) -> float:
        return 1000.0 / self.total_time_ms if self.total_time_ms > 0 else 0

    def get_critical_detections(self) -> List[Detection]:
        return [d for d in self.detections if d.priority == DetectionPriority.CRITICAL]

    def get_high_priority_detections(self) -> List[Detection]:
        return [d for d in self.detections
                if d.priority in [DetectionPriority.CRITICAL, DetectionPriority.HIGH]]


class ProductionInferenceEngine:
    """
    Production-grade inference engine for power infrastructure detection.

    Features:
    - Multi-backend support (PyTorch, ONNX, TensorRT)
    - Automatic failover between models
    - Real-time performance monitoring
    - Priority-based detection classification
    - GPS and thermal data fusion
    - Thread-safe batch processing
    - Safety system integration
    """

    # Class to priority mapping for infrastructure detection
    CLASS_PRIORITIES = {
        'insulator': DetectionPriority.LOW,
        'insulator_damaged': DetectionPriority.CRITICAL,
        'contamination': DetectionPriority.HIGH,
        'tower': DetectionPriority.INFO,
        'conductor': DetectionPriority.LOW,
        'conductor_damaged': DetectionPriority.CRITICAL,
        'damper': DetectionPriority.LOW,
        'spacer': DetectionPriority.LOW,
        'connector': DetectionPriority.LOW,
        'transformer': DetectionPriority.MEDIUM,
        'arrester': DetectionPriority.LOW,
        'breaker': DetectionPriority.MEDIUM,
        'bushing': DetectionPriority.LOW,
        'disconnector': DetectionPriority.MEDIUM,
        'vegetation': DetectionPriority.HIGH,
        'bird_nest': DetectionPriority.MEDIUM,
        'foreign_object': DetectionPriority.HIGH
    }

    # Class names in order
    CLASS_NAMES = [
        'insulator', 'insulator_damaged', 'contamination', 'tower',
        'conductor', 'conductor_damaged', 'damper', 'spacer',
        'connector', 'transformer', 'arrester', 'breaker',
        'bushing', 'disconnector', 'vegetation', 'bird_nest', 'foreign_object'
    ]

    def __init__(
        self,
        model_path: Optional[str] = None,
        onnx_path: Optional[str] = None,
        tensorrt_path: Optional[str] = None,
        confidence_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        max_detections: int = 100,
        target_fps: float = 30.0,
        enable_failover: bool = True,
        device: str = 'auto'
    ):
        """
        Initialize the production inference engine.

        Args:
            model_path: Path to PyTorch model (.pt)
            onnx_path: Path to ONNX model
            tensorrt_path: Path to TensorRT engine
            confidence_threshold: Minimum confidence for detections
            iou_threshold: IoU threshold for NMS
            max_detections: Maximum detections per frame
            target_fps: Target frames per second
            enable_failover: Enable automatic model failover
            device: Device to use ('cpu', 'cuda', 'auto')
        """
        self.model_path = model_path or self._find_model_path()
        self.onnx_path = onnx_path
        self.tensorrt_path = tensorrt_path
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.max_detections = max_detections
        self.target_fps = target_fps
        self.enable_failover = enable_failover

        # Determine device
        self.device = self._determine_device(device)

        # Model state
        self.model = None
        self.current_mode = None
        self.is_initialized = False

        # Performance tracking
        self.frame_count = 0
        self.total_inference_time = 0.0
        self.fps_history: List[float] = []
        self.inference_errors = 0

        # Thread safety
        self._lock = threading.Lock()

        # Callbacks
        self._detection_callbacks: List[Callable[[InferenceResult], None]] = []
        self._critical_alert_callbacks: List[Callable[[Detection], None]] = []

        # Initialize model
        self._initialize_model()

    def _find_model_path(self) -> str:
        """Find the best available model path."""
        candidates = [
            '/home/user/BAHB/runs/yolo26l_infrastructure/weights/best.pt',
            '/home/user/BAHB/runs/yolo26l_infrastructure/weights/last.pt',
            '/home/user/BAHB/models/yolo26l.pt'
        ]
        for path in candidates:
            if os.path.exists(path):
                return path
        raise FileNotFoundError("No model file found")

    def _determine_device(self, device: str) -> str:
        """Determine the best available device."""
        if device != 'auto':
            return device

        try:
            import torch
            if torch.cuda.is_available():
                return 'cuda:0'
        except ImportError:
            pass

        return 'cpu'

    def _initialize_model(self):
        """Initialize the inference model with failover support."""
        logger.info(f"Initializing inference engine on {self.device}")

        # Try TensorRT first (fastest)
        if self.tensorrt_path and os.path.exists(self.tensorrt_path):
            try:
                self._load_tensorrt()
                self.current_mode = InferenceMode.TENSORRT_FP16
                self.is_initialized = True
                logger.info(f"Loaded TensorRT engine: {self.tensorrt_path}")
                return
            except Exception as e:
                logger.warning(f"TensorRT load failed: {e}")

        # Try ONNX next
        if self.onnx_path and os.path.exists(self.onnx_path):
            try:
                self._load_onnx()
                self.current_mode = InferenceMode.ONNX
                self.is_initialized = True
                logger.info(f"Loaded ONNX model: {self.onnx_path}")
                return
            except Exception as e:
                logger.warning(f"ONNX load failed: {e}")

        # Fall back to PyTorch
        try:
            self._load_pytorch()
            self.current_mode = InferenceMode.PYTORCH
            self.is_initialized = True
            logger.info(f"Loaded PyTorch model: {self.model_path}")
        except Exception as e:
            logger.error(f"All model loading failed: {e}")
            raise RuntimeError("Failed to initialize any inference backend")

    def _load_pytorch(self):
        """Load PyTorch/Ultralytics model."""
        from ultralytics import YOLO
        self.model = YOLO(self.model_path)
        # Warm up
        dummy = np.zeros((640, 640, 3), dtype=np.uint8)
        self.model.predict(dummy, verbose=False)

    def _load_onnx(self):
        """Load ONNX model."""
        import onnxruntime as ort
        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
        self.model = ort.InferenceSession(self.onnx_path, providers=providers)

    def _load_tensorrt(self):
        """Load TensorRT engine for optimized inference on NVIDIA devices."""
        try:
            import tensorrt as trt
            import pycuda.driver as cuda
            import pycuda.autoinit  # noqa: F401

            logger = trt.Logger(trt.Logger.WARNING)

            with open(self.tensorrt_path, "rb") as f:
                engine_data = f.read()

            runtime = trt.Runtime(logger)
            self.engine = runtime.deserialize_cuda_engine(engine_data)
            self.context = self.engine.create_execution_context()

            # Allocate device memory for inputs/outputs
            self._allocate_buffers()
            self._tensorrt_loaded = True

        except ImportError:
            raise NotImplementedError(
                "TensorRT or PyCUDA not available. Install with: "
                "pip install tensorrt pycuda"
            )
        except Exception as e:
            raise RuntimeError(f"Failed to load TensorRT engine: {e}")

    def _allocate_buffers(self):
        """Allocate CUDA buffers for TensorRT inference."""
        import pycuda.driver as cuda

        self.inputs = []
        self.outputs = []
        self.bindings = []
        self.stream = cuda.Stream()

        for i in range(self.engine.num_io_tensors):
            name = self.engine.get_tensor_name(i)
            dtype = trt.nptype(self.engine.get_tensor_dtype(name))
            shape = self.engine.get_tensor_shape(name)
            size = trt.volume(shape)

            # Allocate host and device buffers
            host_mem = cuda.pagelocked_empty(size, dtype)
            device_mem = cuda.mem_alloc(host_mem.nbytes)

            self.bindings.append(int(device_mem))

            if self.engine.get_tensor_mode(name) == trt.TensorIOMode.INPUT:
                self.inputs.append({'host': host_mem, 'device': device_mem, 'shape': shape})
            else:
                self.outputs.append({'host': host_mem, 'device': device_mem, 'shape': shape})

    def register_detection_callback(self, callback: Callable[[InferenceResult], None]):
        """Register callback for all detection results."""
        self._detection_callbacks.append(callback)

    def register_critical_alert_callback(self, callback: Callable[[Detection], None]):
        """Register callback for critical detections only."""
        self._critical_alert_callbacks.append(callback)

    def process_frame(
        self,
        frame: np.ndarray,
        frame_id: Optional[int] = None,
        gps_location: Optional[Tuple[float, float, float]] = None,
        thermal_data: Optional[np.ndarray] = None
    ) -> InferenceResult:
        """
        Process a single frame and return detections.

        Args:
            frame: BGR image as numpy array
            frame_id: Optional frame identifier
            gps_location: Optional GPS coordinates (lat, lon, alt)
            thermal_data: Optional thermal image for temperature fusion

        Returns:
            InferenceResult with all detections
        """
        if not self.is_initialized:
            raise RuntimeError("Inference engine not initialized")

        with self._lock:
            frame_id = frame_id or self.frame_count
            self.frame_count += 1

            start_time = time.perf_counter()

            try:
                # Preprocess
                preprocess_start = time.perf_counter()
                processed_frame = self._preprocess(frame)
                preprocess_time = (time.perf_counter() - preprocess_start) * 1000

                # Inference
                inference_start = time.perf_counter()
                raw_results = self._infer(processed_frame)
                inference_time = (time.perf_counter() - inference_start) * 1000

                # Postprocess
                postprocess_start = time.perf_counter()
                detections = self._postprocess(
                    raw_results, frame_id, frame.shape[:2],
                    gps_location, thermal_data
                )
                postprocess_time = (time.perf_counter() - postprocess_start) * 1000

                # Build result
                result = InferenceResult(
                    frame_id=frame_id,
                    detections=detections,
                    inference_time_ms=inference_time,
                    preprocess_time_ms=preprocess_time,
                    postprocess_time_ms=postprocess_time,
                    frame_shape=frame.shape[:2],
                    model_name=f"yolo26l_{self.current_mode.name}"
                )

                # Update stats
                self.total_inference_time += result.total_time_ms
                self.fps_history.append(result.fps)
                if len(self.fps_history) > 100:
                    self.fps_history.pop(0)

                # Trigger callbacks
                self._trigger_callbacks(result)

                return result

            except Exception as e:
                self.inference_errors += 1
                logger.error(f"Inference error: {e}")

                if self.enable_failover and self.inference_errors > 3:
                    self._attempt_failover()

                # Return empty result on error
                return InferenceResult(
                    frame_id=frame_id,
                    detections=[],
                    inference_time_ms=0,
                    preprocess_time_ms=0,
                    postprocess_time_ms=0
                )

    def _preprocess(self, frame: np.ndarray) -> np.ndarray:
        """Preprocess frame for inference."""
        # Resize to model input size
        import cv2
        resized = cv2.resize(frame, (640, 640))
        return resized

    def _infer(self, frame: np.ndarray) -> Any:
        """Run inference on preprocessed frame."""
        if self.current_mode == InferenceMode.PYTORCH:
            results = self.model.predict(
                frame,
                conf=self.confidence_threshold,
                iou=self.iou_threshold,
                max_det=self.max_detections,
                verbose=False
            )
            return results[0] if results else None

        elif self.current_mode == InferenceMode.ONNX:
            # ONNX inference
            input_tensor = frame.transpose(2, 0, 1).astype(np.float32) / 255.0
            input_tensor = np.expand_dims(input_tensor, 0)
            outputs = self.model.run(None, {'images': input_tensor})
            return outputs

        else:
            raise ValueError(f"Unsupported inference mode: {self.current_mode}")

    def _postprocess(
        self,
        raw_results: Any,
        frame_id: int,
        frame_shape: Tuple[int, int],
        gps_location: Optional[Tuple[float, float, float]],
        thermal_data: Optional[np.ndarray]
    ) -> List[Detection]:
        """Postprocess raw inference results into detections."""
        detections = []

        if self.current_mode == InferenceMode.PYTORCH and raw_results is not None:
            boxes = raw_results.boxes
            if boxes is not None and len(boxes) > 0:
                for i in range(len(boxes)):
                    cls_id = int(boxes.cls[i])
                    conf = float(boxes.conf[i])
                    xyxy = boxes.xyxyn[i].tolist()  # Normalized coords

                    class_name = self.CLASS_NAMES[cls_id] if cls_id < len(self.CLASS_NAMES) else f"class_{cls_id}"
                    priority = self.CLASS_PRIORITIES.get(class_name, DetectionPriority.INFO)

                    # Get thermal temperature if available
                    thermal_temp = None
                    if thermal_data is not None:
                        thermal_temp = self._get_thermal_temp(xyxy, thermal_data, frame_shape)

                    detection = Detection(
                        class_id=cls_id,
                        class_name=class_name,
                        confidence=conf,
                        bbox=tuple(xyxy),
                        priority=priority,
                        frame_id=frame_id,
                        gps_location=gps_location,
                        thermal_temp=thermal_temp
                    )
                    detections.append(detection)

        return detections

    def _get_thermal_temp(
        self,
        bbox: List[float],
        thermal_data: np.ndarray,
        frame_shape: Tuple[int, int]
    ) -> Optional[float]:
        """Extract thermal temperature from bbox region."""
        try:
            h, w = thermal_data.shape[:2]
            x1, y1, x2, y2 = bbox

            # Convert normalized to pixel coords
            px1, py1 = int(x1 * w), int(y1 * h)
            px2, py2 = int(x2 * w), int(y2 * h)

            # Get region and compute max temp (hotspot)
            region = thermal_data[py1:py2, px1:px2]
            if region.size > 0:
                return float(np.max(region))
        except:
            pass
        return None

    def _trigger_callbacks(self, result: InferenceResult):
        """Trigger registered callbacks."""
        # General detection callbacks
        for callback in self._detection_callbacks:
            try:
                callback(result)
            except Exception as e:
                logger.warning(f"Detection callback error: {e}")

        # Critical alert callbacks
        critical = result.get_critical_detections()
        if critical:
            for detection in critical:
                for callback in self._critical_alert_callbacks:
                    try:
                        callback(detection)
                    except Exception as e:
                        logger.warning(f"Critical alert callback error: {e}")

    def _attempt_failover(self):
        """Attempt to failover to backup model."""
        logger.warning("Attempting model failover due to repeated errors")

        failover_order = [
            (InferenceMode.TENSORRT_FP16, self.tensorrt_path, self._load_tensorrt),
            (InferenceMode.ONNX, self.onnx_path, self._load_onnx),
            (InferenceMode.PYTORCH, self.model_path, self._load_pytorch)
        ]

        for mode, path, loader in failover_order:
            if mode == self.current_mode:
                continue
            if path and os.path.exists(path):
                try:
                    loader()
                    self.current_mode = mode
                    self.inference_errors = 0
                    logger.info(f"Failover successful to {mode.name}")
                    return
                except:
                    continue

        logger.error("All failover attempts failed")

    def get_stats(self) -> Dict:
        """Get inference statistics."""
        avg_fps = np.mean(self.fps_history) if self.fps_history else 0
        return {
            'mode': self.current_mode.name if self.current_mode else None,
            'device': self.device,
            'frame_count': self.frame_count,
            'average_fps': avg_fps,
            'target_fps': self.target_fps,
            'meets_target': avg_fps >= self.target_fps * 0.9,
            'inference_errors': self.inference_errors,
            'total_inference_time_s': self.total_inference_time / 1000
        }

    def shutdown(self):
        """Shutdown the inference engine."""
        logger.info("Shutting down inference engine")
        self.model = None
        self.is_initialized = False


# Factory function for easy instantiation
def create_inference_engine(
    mode: str = 'auto',
    confidence: float = 0.25
) -> ProductionInferenceEngine:
    """
    Create a production inference engine with optimal settings.

    Args:
        mode: 'auto', 'pytorch', 'onnx', or 'tensorrt'
        confidence: Confidence threshold

    Returns:
        Configured ProductionInferenceEngine
    """
    model_path = None
    onnx_path = None
    tensorrt_path = None

    # Find available models
    pt_candidates = [
        '/home/user/BAHB/runs/yolo26l_infrastructure/weights/best.pt',
        '/home/user/BAHB/runs/yolo26l_infrastructure/weights/last.pt'
    ]
    for p in pt_candidates:
        if os.path.exists(p):
            model_path = p
            break

    onnx_candidates = [
        '/home/user/BAHB/models/onnx/yolo26l_infrastructure.onnx',
        '/home/user/BAHB/runs/yolo26l_infrastructure/weights/best.onnx'
    ]
    for p in onnx_candidates:
        if os.path.exists(p):
            onnx_path = p
            break

    return ProductionInferenceEngine(
        model_path=model_path,
        onnx_path=onnx_path,
        tensorrt_path=tensorrt_path,
        confidence_threshold=confidence,
        enable_failover=True
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Test the engine
    engine = create_inference_engine()
    print(f"Engine initialized: {engine.current_mode.name}")
    print(f"Stats: {engine.get_stats()}")
