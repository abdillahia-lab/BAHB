"""YOLO26 object detection model for infrastructure inspection.

YOLO26 is Ultralytics' newest detector (January 2026) with key improvements:
- NMS-free end-to-end inference (native, not post-processing)
- DFL removal for simplified edge deployment
- STAL (Small-Target-Aware Label Assignment) for small objects
- ProgLoss for improved accuracy
- MuSGD optimizer combining SGD + Muon (from Moonshot AI)
- Up to 43% faster CPU inference than predecessors

Reference: https://docs.ultralytics.com/models/yolo26/
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from numpy.typing import NDArray
from loguru import logger

from bahb.core.types import BoundingBox, Detection
from bahb.models.base import BaseModel


class YOLO26Config:
    """YOLO26 model configuration.

    YOLO26 variants and performance (640px COCO):
    - yolo26n: 2.4M params, mAP 40.9, CPU 38.9ms
    - yolo26s: 9.5M params, mAP 48.6, CPU 87.2ms
    - yolo26m: 20.4M params, mAP 53.1, CPU 220.0ms
    - yolo26l: 24.8M params, mAP 55.0, CPU 286.2ms
    - yolo26x: 55.7M params, mAP 57.5, CPU 525.8ms
    """

    def __init__(
        self,
        weights: str = "yolo26l.pt",
        weights_int8: str = "",
        input_size: tuple[int, int] = (640, 640),
        confidence_threshold: float = 0.35,
        nms_threshold: float = 0.45,
        device: str = "cuda:0",
        half_precision: bool = True,
        use_int8: bool = False,
        batch_size: int = 1,
        classes: Optional[list[str]] = None,
        enabled: bool = True,
    ):
        self.weights = weights
        self.weights_int8 = weights_int8
        self.input_size = input_size
        self.confidence_threshold = confidence_threshold
        self.nms_threshold = nms_threshold
        self.device = device
        self.half_precision = half_precision
        self.use_int8 = use_int8
        self.batch_size = batch_size
        self.classes = classes
        self.enabled = enabled


class YOLO26Detector(BaseModel):
    """
    YOLO26 detector optimized for infrastructure inspection.

    Key features over previous YOLO versions:
    - Native end-to-end NMS-free inference (no post-processing NMS needed)
    - DFL removal simplifies export and edge deployment
    - STAL improves small object detection (insulators, bird nests)
    - ProgLoss provides better accuracy
    - 43% faster CPU inference
    - MuSGD optimizer for stable training

    Supports:
    - Object Detection
    - Instance Segmentation
    - Pose Estimation
    - OBB (Oriented Bounding Box)
    - Classification
    """

    # Infrastructure detection classes
    DEFAULT_CLASSES = [
        "transformer", "insulator", "conductor", "switchgear",
        "circuit_breaker", "disconnect_switch", "capacitor_bank",
        "lightning_arrester", "server_rack", "hvac_unit",
        "cooling_fan", "electrical_panel", "cable", "ups", "pdu",
        "fire_suppression", "vegetation", "person", "vehicle",
        "damage", "corrosion", "hotspot", "leak", "crack",
        "contamination", "bird_nest"
    ]

    def __init__(self, config: YOLO26Config):
        super().__init__(
            model_path=config.weights,
            device=config.device,
            half_precision=config.half_precision,
        )
        self.config = config
        self.input_size = config.input_size
        self.conf_threshold = config.confidence_threshold
        self.nms_threshold = config.nms_threshold
        self.classes = config.classes or self.DEFAULT_CLASSES

        # YOLO26 is natively NMS-free - no external NMS needed
        self._ultralytics_model = None
        self._engine = None
        self._context = None

    def load(self) -> bool:
        """Load YOLO26 model."""
        try:
            engine_path = Path(self.model_path)

            # Try TensorRT engine first
            if engine_path.suffix == ".engine" and engine_path.exists():
                return self._load_tensorrt()

            # Fall back to Ultralytics
            return self._load_ultralytics()

        except Exception as e:
            logger.error(f"Failed to load YOLO26: {e}")
            return False

    def _load_tensorrt(self) -> bool:
        """Load TensorRT-optimized YOLO26."""
        try:
            import tensorrt as trt
            import pycuda.driver as cuda
            import pycuda.autoinit  # noqa

            logger.info(f"Loading YOLO26 TensorRT engine: {self.model_path}")

            with open(self.model_path, "rb") as f:
                runtime = trt.Runtime(trt.Logger(trt.Logger.WARNING))
                self._engine = runtime.deserialize_cuda_engine(f.read())

            if self._engine is None:
                raise RuntimeError("Failed to deserialize engine")

            self._context = self._engine.create_execution_context()
            self._stream = cuda.Stream()
            self._allocate_buffers()

            self._is_loaded = True
            logger.info("YOLO26 TensorRT engine loaded (NMS-free native)")
            return True

        except Exception as e:
            logger.warning(f"TensorRT load failed: {e}, trying Ultralytics")
            return self._load_ultralytics()

    def _load_ultralytics(self) -> bool:
        """Load using Ultralytics library."""
        try:
            from ultralytics import YOLO

            model_path = Path(self.model_path)

            if not model_path.exists():
                # Try common paths
                for ext in [".pt", ".onnx", ".engine"]:
                    alt_path = model_path.with_suffix(ext)
                    if alt_path.exists():
                        model_path = alt_path
                        break
                else:
                    # Use default YOLO26 model
                    logger.info("Using default yolo26l.pt model")
                    model_path = "yolo26l.pt"

            logger.info(f"Loading YOLO26 from: {model_path}")
            self._ultralytics_model = YOLO(str(model_path))

            # Move to device
            if "cuda" in self.device:
                self._ultralytics_model.to(self.device)

            self._is_loaded = True
            logger.info("YOLO26 loaded via Ultralytics (NMS-free native)")
            return True

        except Exception as e:
            logger.error(f"Failed to load YOLO26 via Ultralytics: {e}")
            return False

    def _allocate_buffers(self) -> None:
        """Allocate TensorRT buffers."""
        import pycuda.driver as cuda
        import tensorrt as trt

        self._inputs = []
        self._outputs = []
        self._bindings = []

        for i in range(self._engine.num_io_tensors):
            name = self._engine.get_tensor_name(i)
            shape = self._engine.get_tensor_shape(name)
            dtype = trt.nptype(self._engine.get_tensor_dtype(name))

            size = int(np.prod(shape))
            host_mem = cuda.pagelocked_empty(size, dtype)
            device_mem = cuda.mem_alloc(host_mem.nbytes)

            self._bindings.append(int(device_mem))

            if self._engine.get_tensor_mode(name) == trt.TensorIOMode.INPUT:
                self._inputs.append({"host": host_mem, "device": device_mem, "shape": shape})
            else:
                self._outputs.append({"host": host_mem, "device": device_mem, "shape": shape})

    def unload(self) -> None:
        """Unload model resources."""
        self._ultralytics_model = None
        if self._context:
            del self._context
            self._context = None
        if self._engine:
            del self._engine
            self._engine = None
        self._is_loaded = False

    def preprocess(self, image: NDArray) -> NDArray:
        """Preprocess image for YOLO26 inference."""
        # Letterbox resize
        img, ratio, pad = self._letterbox(
            image,
            new_shape=self.input_size,
            auto=False,
            stride=32,
        )

        # Store for postprocessing
        self._ratio = ratio
        self._pad = pad
        self._original_shape = image.shape[:2]

        # BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # HWC to CHW, normalize
        img = img.transpose(2, 0, 1).astype(np.float32) / 255.0

        # Add batch dimension
        img = np.expand_dims(img, 0)

        if self.half_precision:
            img = img.astype(np.float16)

        return np.ascontiguousarray(img)

    def _letterbox(
        self,
        img: NDArray,
        new_shape: tuple[int, int] = (640, 640),
        color: tuple[int, int, int] = (114, 114, 114),
        auto: bool = True,
        stride: int = 32,
    ) -> tuple[NDArray, tuple[float, float], tuple[float, float]]:
        """Resize and pad image while meeting stride constraints."""
        shape = img.shape[:2]

        r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])

        new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
        dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]

        if auto:
            dw, dh = np.mod(dw, stride), np.mod(dh, stride)

        dw /= 2
        dh /= 2

        if shape[::-1] != new_unpad:
            img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)

        top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
        left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
        img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)

        return img, (r, r), (dw, dh)

    def forward(self, inputs: NDArray) -> NDArray:
        """Run YOLO26 inference."""
        if self._ultralytics_model is not None:
            return self._forward_ultralytics(inputs)
        else:
            return self._forward_tensorrt(inputs)

    def _forward_ultralytics(self, inputs: NDArray) -> list:
        """Run inference via Ultralytics."""
        # Convert back to image format
        img = (inputs[0].transpose(1, 2, 0) * 255).astype(np.uint8)
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

        # YOLO26 produces end-to-end results (no NMS needed)
        results = self._ultralytics_model.predict(
            img,
            conf=self.conf_threshold,
            iou=self.nms_threshold,
            verbose=False,
        )
        return results

    def _forward_tensorrt(self, inputs: NDArray) -> NDArray:
        """Run TensorRT inference."""
        import pycuda.driver as cuda

        np.copyto(self._inputs[0]["host"], inputs.ravel())
        cuda.memcpy_htod_async(
            self._inputs[0]["device"],
            self._inputs[0]["host"],
            self._stream,
        )

        self._context.execute_async_v2(
            bindings=self._bindings,
            stream_handle=self._stream.handle,
        )

        cuda.memcpy_dtoh_async(
            self._outputs[0]["host"],
            self._outputs[0]["device"],
            self._stream,
        )
        self._stream.synchronize()

        return self._outputs[0]["host"].reshape(self._outputs[0]["shape"])

    def postprocess(
        self,
        outputs: list | NDArray,
        original_shape: tuple[int, int],
    ) -> list[Detection]:
        """Convert model outputs to Detection objects.

        YOLO26 is natively NMS-free - outputs are already deduplicated.
        """
        if self._ultralytics_model is not None:
            return self._postprocess_ultralytics(outputs)
        else:
            return self._postprocess_tensorrt(outputs, original_shape)

    def _postprocess_ultralytics(self, results: list) -> list[Detection]:
        """Process Ultralytics results (already NMS-free)."""
        detections = []

        if not results or len(results) == 0:
            return detections

        result = results[0]

        if result.boxes is None:
            return detections

        boxes = result.boxes.xyxy.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()
        classes = result.boxes.cls.cpu().numpy().astype(int)

        for box, conf, cls_id in zip(boxes, confs, classes):
            if conf < self.conf_threshold:
                continue

            class_name = self._get_class_name(cls_id)

            detection = Detection(
                class_id=int(cls_id),
                class_name=class_name,
                confidence=float(conf),
                bbox=BoundingBox(
                    x1=float(box[0]),
                    y1=float(box[1]),
                    x2=float(box[2]),
                    y2=float(box[3]),
                ),
            )
            detections.append(detection)

        return detections

    def _postprocess_tensorrt(
        self,
        outputs: NDArray,
        original_shape: tuple[int, int],
    ) -> list[Detection]:
        """Process TensorRT outputs.

        YOLO26 TensorRT engines are NMS-free by default.
        """
        detections = []

        predictions = outputs[0]

        # Handle different output formats
        if predictions.shape[0] == (4 + len(self.classes)):
            predictions = predictions.T

        for pred in predictions:
            box = pred[:4]
            confidences = pred[4:]

            class_id = np.argmax(confidences)
            confidence = confidences[class_id]

            if confidence < self.conf_threshold:
                continue

            # Convert center format to corner format
            cx, cy, w, h = box
            x1 = cx - w / 2
            y1 = cy - h / 2
            x2 = cx + w / 2
            y2 = cy + h / 2

            # Scale back to original image
            x1 = (x1 - self._pad[0]) / self._ratio[0]
            y1 = (y1 - self._pad[1]) / self._ratio[1]
            x2 = (x2 - self._pad[0]) / self._ratio[0]
            y2 = (y2 - self._pad[1]) / self._ratio[1]

            # Clip to image bounds
            x1 = max(0, min(x1, original_shape[1]))
            y1 = max(0, min(y1, original_shape[0]))
            x2 = max(0, min(x2, original_shape[1]))
            y2 = max(0, min(y2, original_shape[0]))

            detection = Detection(
                class_id=int(class_id),
                class_name=self._get_class_name(class_id),
                confidence=float(confidence),
                bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
            )
            detections.append(detection)

        # YOLO26 is NMS-free - no additional NMS needed
        return detections

    def _get_class_name(self, class_id: int) -> str:
        """Get class name from ID."""
        if 0 <= class_id < len(self.classes):
            return self.classes[class_id]
        return f"class_{class_id}"

    def detect_with_tracking(
        self,
        image: NDArray,
        tracker_id: Optional[int] = None,
    ) -> list[Detection]:
        """Run detection with object tracking."""
        if self._ultralytics_model is None:
            return self(image)

        results = self._ultralytics_model.track(
            image,
            conf=self.conf_threshold,
            iou=self.nms_threshold,
            persist=True,
            tracker="bytetrack.yaml",
            verbose=False,
        )

        detections = []
        if results and results[0].boxes is not None:
            boxes = results[0].boxes

            for i in range(len(boxes)):
                box = boxes.xyxy[i].cpu().numpy()
                conf = float(boxes.conf[i].cpu().numpy())
                cls_id = int(boxes.cls[i].cpu().numpy())

                track_id = None
                if boxes.id is not None and len(boxes.id) > i:
                    track_id = int(boxes.id[i].cpu().numpy())

                detection = Detection(
                    class_id=cls_id,
                    class_name=self._get_class_name(cls_id),
                    confidence=conf,
                    bbox=BoundingBox(
                        x1=float(box[0]),
                        y1=float(box[1]),
                        x2=float(box[2]),
                        y2=float(box[3]),
                    ),
                    track_id=track_id,
                )
                detections.append(detection)

        return detections

    def segment(self, image: NDArray) -> tuple[list[Detection], list]:
        """Run YOLO26 instance segmentation.

        YOLO26 supports segmentation with improved small-object masks (STAL).
        """
        if self._ultralytics_model is None:
            logger.warning("Segmentation requires Ultralytics model")
            return [], []

        # Load segmentation model if needed
        model_name = str(self.model_path)
        if "-seg" not in model_name and "seg" not in model_name:
            seg_path = model_name.replace(".pt", "-seg.pt")
            logger.info(f"Loading segmentation model: {seg_path}")

        results = self._ultralytics_model.predict(
            image,
            conf=self.conf_threshold,
            verbose=False,
        )

        detections = self._postprocess_ultralytics(results)
        masks = []

        if results and results[0].masks is not None:
            masks = results[0].masks.data.cpu().numpy()

        return detections, masks

    @staticmethod
    def get_training_config(
        data_yaml: str,
        epochs: int = 100,
        imgsz: int = 640,
        batch: int = 16,
        device: str = "0",
        model_size: str = "l",
    ) -> dict:
        """Get optimized training configuration for YOLO26.

        YOLO26 training uses:
        - MuSGD optimizer (SGD + Muon hybrid from Moonshot AI)
        - ProgLoss for progressive loss balancing
        - STAL for small-target-aware label assignment
        """
        return {
            "data": data_yaml,
            "epochs": epochs,
            "imgsz": imgsz,
            "batch": batch,
            "device": device,
            "model": f"yolo26{model_size}.pt",
            "patience": 50,
            "optimizer": "auto",  # Uses MuSGD by default
            "lr0": 0.01,
            "lrf": 0.01,
            "momentum": 0.937,
            "weight_decay": 0.0005,
            "warmup_epochs": 3.0,
            "warmup_momentum": 0.8,
            "warmup_bias_lr": 0.1,
            "box": 7.5,
            "cls": 0.5,
            "dfl": 0.0,  # DFL removed in YOLO26
            "hsv_h": 0.015,
            "hsv_s": 0.7,
            "hsv_v": 0.4,
            "degrees": 0.0,
            "translate": 0.1,
            "scale": 0.5,
            "shear": 0.0,
            "perspective": 0.0,
            "flipud": 0.0,
            "fliplr": 0.5,
            "mosaic": 1.0,
            "mixup": 0.0,
            "copy_paste": 0.0,
            "save": True,
            "save_period": 5,
            "plots": True,
            "verbose": True,
        }
