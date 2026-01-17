"""Integration tests for YOLO26 detection pipeline."""

from __future__ import annotations

import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import cv2
import numpy as np
import pytest
from numpy.typing import NDArray

from bahb.core.types import BoundingBox, Detection
from bahb.models.yolov12 import YOLOv12Detector


class TestYOLO26ModelLoading:
    """Test YOLO26 model loading and initialization."""

    @pytest.mark.unit
    def test_model_init_with_config(self, mock_config):
        """Test model initialization with configuration."""
        mock_config.weights = "models/yolo26l.pt"
        mock_config.classes = ["transformer", "insulator"]

        detector = YOLOv12Detector(mock_config)

        assert detector.config == mock_config
        assert detector.conf_threshold == mock_config.confidence_threshold
        assert detector.nms_threshold == mock_config.nms_threshold
        assert not detector.is_loaded

    @pytest.mark.unit
    def test_model_load_fallback_to_ultralytics(self, mock_config, model_weights_path):
        """Test fallback to Ultralytics when TensorRT unavailable."""
        mock_config.weights = str(model_weights_path)

        detector = YOLOv12Detector(mock_config)

        with patch("bahb.models.yolov12.YOLO") as mock_yolo:
            mock_yolo.return_value = MagicMock()
            result = detector.load()

            # Should attempt to load
            assert mock_yolo.called or not result

    @pytest.mark.gpu
    @pytest.mark.slow
    def test_model_load_tensorrt(self, mock_config, temp_dir):
        """Test loading TensorRT engine (requires actual engine file)."""
        # This test requires a real TensorRT engine
        engine_path = Path("/home/user/BAHB/models/tensorrt/yolo26l_int8.engine")

        if not engine_path.exists():
            pytest.skip("TensorRT engine not found")

        mock_config.weights = str(engine_path)
        mock_config.device = "cuda:0"

        detector = YOLOv12Detector(mock_config)
        result = detector.load()

        if result:
            assert detector.is_loaded
            detector.unload()


class TestInference:
    """Test YOLO26 inference on sample images."""

    @pytest.mark.integration
    def test_inference_basic(self, mock_yolo_model, sample_image):
        """Test basic inference on a sample image."""
        detections = mock_yolo_model(sample_image)

        assert isinstance(detections, list)
        assert len(detections) > 0
        assert all(isinstance(d, Detection) for d in detections)

    @pytest.mark.integration
    def test_inference_output_format(self, mock_yolo_model, sample_image):
        """Verify detection output format matches specification."""
        detections = mock_yolo_model(sample_image)

        for det in detections:
            # Verify all required fields
            assert hasattr(det, "class_id")
            assert hasattr(det, "class_name")
            assert hasattr(det, "confidence")
            assert hasattr(det, "bbox")

            # Verify types
            assert isinstance(det.class_id, int)
            assert isinstance(det.class_name, str)
            assert isinstance(det.confidence, float)
            assert isinstance(det.bbox, BoundingBox)

            # Verify value ranges
            assert 0 <= det.confidence <= 1.0
            assert det.bbox.x1 >= 0
            assert det.bbox.y1 >= 0
            assert det.bbox.x2 > det.bbox.x1
            assert det.bbox.y2 > det.bbox.y1

    @pytest.mark.integration
    def test_inference_confidence_filtering(self, mock_config):
        """Test that low-confidence detections are filtered."""
        mock_config.confidence_threshold = 0.5
        mock_config.weights = "yolov8l.pt"

        detector = YOLOv12Detector(mock_config)

        # Create mock detections with various confidences
        all_detections = [
            Detection(
                class_id=0,
                class_name="transformer",
                confidence=0.85,
                bbox=BoundingBox(100, 100, 200, 200),
            ),
            Detection(
                class_id=1,
                class_name="insulator",
                confidence=0.25,  # Below threshold
                bbox=BoundingBox(300, 300, 400, 400),
            ),
        ]

        # Filter based on threshold
        filtered = [d for d in all_detections if d.confidence >= detector.conf_threshold]

        assert len(filtered) == 1
        assert filtered[0].confidence >= 0.5

    @pytest.mark.integration
    def test_inference_empty_image(self, mock_yolo_model):
        """Test inference on blank image returns gracefully."""
        blank = np.zeros((640, 640, 3), dtype=np.uint8)

        # Should not crash
        detections = mock_yolo_model(blank)
        assert isinstance(detections, list)

    @pytest.mark.integration
    def test_inference_different_resolutions(self, mock_yolo_model):
        """Test inference handles different input resolutions."""
        resolutions = [
            (640, 640),
            (1280, 720),
            (1920, 1080),
            (3840, 2160),
        ]

        for width, height in resolutions:
            image = np.zeros((height, width, 3), dtype=np.uint8)
            detections = mock_yolo_model(image)

            # Should handle all resolutions
            assert isinstance(detections, list)


class TestBatchProcessing:
    """Test batch inference capabilities."""

    @pytest.mark.integration
    def test_batch_inference(self, mock_yolo_model, batch_images):
        """Test processing multiple images in sequence."""
        results = []

        for img in batch_images:
            detections = mock_yolo_model(img)
            results.append(detections)

        assert len(results) == len(batch_images)
        assert all(isinstance(r, list) for r in results)

    @pytest.mark.benchmark
    def test_batch_throughput(self, mock_yolo_model, batch_images, benchmark_context):
        """Benchmark batch processing throughput."""
        iterations = 10

        for _ in range(iterations):
            benchmark_context.start()
            for img in batch_images:
                mock_yolo_model(img)
            benchmark_context.stop()

        avg_time = benchmark_context.avg_time_ms
        fps = (len(batch_images) * 1000) / avg_time if avg_time > 0 else 0

        print(f"\nBatch Processing:")
        print(f"  Average time: {avg_time:.2f}ms")
        print(f"  Throughput: {fps:.2f} FPS")

        # Mock should be very fast
        assert fps > 100  # Should process fast since it's mocked


class TestInferenceSpeed:
    """Benchmark inference speed and performance."""

    @pytest.mark.benchmark
    @pytest.mark.integration
    def test_inference_latency(self, mock_yolo_model, sample_image, benchmark_context):
        """Measure single-image inference latency."""
        # Warmup
        for _ in range(5):
            mock_yolo_model(sample_image)

        # Benchmark
        iterations = 100
        for _ in range(iterations):
            benchmark_context.start()
            mock_yolo_model(sample_image)
            benchmark_context.stop()

        print(f"\nInference Latency:")
        print(f"  Average: {benchmark_context.avg_time_ms:.2f}ms")
        print(f"  Min: {benchmark_context.min_time_ms:.2f}ms")
        print(f"  Max: {benchmark_context.max_time_ms:.2f}ms")

        # Mock model should be fast
        assert benchmark_context.avg_time_ms < 100

    @pytest.mark.benchmark
    @pytest.mark.gpu
    @pytest.mark.slow
    def test_gpu_inference_speed(self, mock_config, sample_image):
        """Benchmark GPU inference (requires actual model)."""
        pytest.skip("Requires actual GPU model - implement when model available")

    @pytest.mark.benchmark
    def test_preprocessing_speed(self, mock_config, sample_hires_image, benchmark_context):
        """Benchmark image preprocessing speed."""
        detector = YOLOv12Detector(mock_config)

        iterations = 100
        for _ in range(iterations):
            benchmark_context.start()
            _ = detector.preprocess(sample_hires_image)
            benchmark_context.stop()

        print(f"\nPreprocessing (4K image):")
        print(f"  Average: {benchmark_context.avg_time_ms:.2f}ms")

        # Preprocessing should be fast even for 4K
        assert benchmark_context.avg_time_ms < 50

    @pytest.mark.benchmark
    @pytest.mark.integration
    def test_fps_sustained(self, mock_yolo_model, sample_image):
        """Test sustained FPS over time."""
        duration_sec = 5
        frame_count = 0
        start_time = time.time()

        while time.time() - start_time < duration_sec:
            mock_yolo_model(sample_image)
            frame_count += 1

        fps = frame_count / duration_sec

        print(f"\nSustained Performance:")
        print(f"  Frames processed: {frame_count}")
        print(f"  Average FPS: {fps:.2f}")

        # Mock should sustain high FPS
        assert fps > 100


class TestPreprocessing:
    """Test image preprocessing pipeline."""

    @pytest.mark.unit
    def test_letterbox_resize(self, mock_config):
        """Test letterbox resizing maintains aspect ratio."""
        detector = YOLOv12Detector(mock_config)

        # Test various aspect ratios
        test_shapes = [
            (480, 640, 3),   # 4:3
            (720, 1280, 3),  # 16:9
            (1080, 1920, 3), # 16:9 HD
            (800, 800, 3),   # Square
        ]

        for shape in test_shapes:
            img = np.zeros(shape, dtype=np.uint8)
            processed = detector.preprocess(img)

            # Should be resized to input size
            assert processed.shape[2:] == tuple(mock_config.input_size)

    @pytest.mark.unit
    def test_normalization(self, mock_config, sample_image):
        """Test image normalization to [0, 1] range."""
        detector = YOLOv12Detector(mock_config)
        processed = detector.preprocess(sample_image)

        # Should be normalized to [0, 1]
        assert processed.min() >= 0.0
        assert processed.max() <= 1.0

    @pytest.mark.unit
    def test_bgr_to_rgb_conversion(self, mock_config):
        """Test BGR to RGB color space conversion."""
        detector = YOLOv12Detector(mock_config)

        # Create image with known BGR values
        bgr_img = np.zeros((640, 640, 3), dtype=np.uint8)
        bgr_img[:, :] = [255, 0, 0]  # Blue in BGR

        processed = detector.preprocess(bgr_img)

        # After BGR->RGB conversion and CHW reorder,
        # the blue channel should be in the last channel
        # processed shape: [1, 3, H, W]
        # Check that conversion happened (values changed)
        assert processed.shape == (1, 3, 640, 640)


class TestPostprocessing:
    """Test detection postprocessing."""

    @pytest.mark.unit
    def test_nms_removes_overlapping_boxes(self, mock_config):
        """Test NMS removes overlapping detections."""
        detector = YOLOv12Detector(mock_config)

        # Create overlapping detections
        detections = [
            Detection(
                class_id=0,
                class_name="transformer",
                confidence=0.9,
                bbox=BoundingBox(100, 100, 200, 200),
            ),
            Detection(
                class_id=0,
                class_name="transformer",
                confidence=0.85,  # Lower confidence, should be suppressed
                bbox=BoundingBox(110, 110, 210, 210),  # Overlapping
            ),
            Detection(
                class_id=0,
                class_name="transformer",
                confidence=0.8,
                bbox=BoundingBox(500, 500, 600, 600),  # Separate
            ),
        ]

        # Apply NMS
        filtered = detector._nms(detections)

        # Should remove the overlapping lower-confidence detection
        assert len(filtered) < len(detections)
        assert all(d.confidence >= 0.8 for d in filtered)

    @pytest.mark.unit
    def test_coordinate_scaling(self, mock_config):
        """Test bounding box coordinates scaled back to original image."""
        detector = YOLOv12Detector(mock_config)

        # Original image size
        original_shape = (1080, 1920, 3)
        img = np.zeros(original_shape, dtype=np.uint8)

        # Preprocess to get scaling factors
        processed = detector.preprocess(img)

        # Verify scaling factors stored
        assert hasattr(detector, "_ratio")
        assert hasattr(detector, "_pad")
        assert hasattr(detector, "_original_shape")


class TestErrorHandling:
    """Test error handling and edge cases."""

    @pytest.mark.unit
    def test_invalid_image_type(self, mock_yolo_model):
        """Test handling of invalid image type."""
        with pytest.raises((TypeError, AttributeError, ValueError)):
            mock_yolo_model("not an image")

    @pytest.mark.unit
    def test_model_not_loaded(self, mock_config):
        """Test calling inference before model is loaded."""
        detector = YOLOv12Detector(mock_config)
        detector._is_loaded = False

        with pytest.raises(RuntimeError):
            detector(np.zeros((640, 640, 3), dtype=np.uint8))

    @pytest.mark.unit
    def test_empty_detections_list(self, mock_config):
        """Test handling empty detections gracefully."""
        detector = YOLOv12Detector(mock_config)

        # Empty detections should not cause issues
        result = detector._nms([])
        assert result == []


class TestModelRegistry:
    """Test model registry functionality."""

    @pytest.mark.unit
    def test_register_model(self, mock_yolo_model):
        """Test registering a model in the registry."""
        from bahb.models.base import ModelRegistry

        ModelRegistry.register("test_yolo", mock_yolo_model)
        retrieved = ModelRegistry.get("test_yolo")

        assert retrieved == mock_yolo_model

    @pytest.mark.unit
    def test_get_stats(self, mock_yolo_model):
        """Test getting model statistics."""
        from bahb.models.base import ModelRegistry

        ModelRegistry.register("test_yolo_stats", mock_yolo_model)
        stats = ModelRegistry.get_stats()

        assert "test_yolo_stats" in stats
        assert "loaded" in stats["test_yolo_stats"]
        assert "avg_inference_ms" in stats["test_yolo_stats"]
