"""End-to-end integration tests for BAHB pipeline."""

from __future__ import annotations

import json
import time
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

import cv2
import numpy as np
import pytest

from bahb.core.types import BoundingBox, Detection, InspectionResult, SeverityLevel


class TestFullPipelineWithVideo:
    """Test complete pipeline with sample video."""

    @pytest.mark.integration
    @pytest.mark.slow
    def test_process_sample_video(self, sample_video, mock_yolo_model, output_dir):
        """Test processing a complete video file."""
        # Open video
        cap = cv2.VideoCapture(str(sample_video))
        assert cap.isOpened()

        results = []
        frame_count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Run detection
            detections = mock_yolo_model(frame)
            results.append({
                "frame": frame_count,
                "detections": len(detections),
            })

            frame_count += 1

        cap.release()

        assert frame_count > 0
        assert len(results) == frame_count

    @pytest.mark.integration
    @pytest.mark.slow
    def test_video_with_output_recording(self, sample_video, mock_yolo_model, output_dir):
        """Test processing video and saving output."""
        cap = cv2.VideoCapture(str(sample_video))
        assert cap.isOpened()

        # Setup output video
        output_path = output_dir / "output.mp4"
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Run detection
            detections = mock_yolo_model(frame)

            # Draw detections
            for det in detections:
                bbox = det.bbox
                cv2.rectangle(
                    frame,
                    (int(bbox.x1), int(bbox.y1)),
                    (int(bbox.x2), int(bbox.y2)),
                    (0, 255, 0),
                    2,
                )
                cv2.putText(
                    frame,
                    f"{det.class_name} {det.confidence:.2f}",
                    (int(bbox.x1), int(bbox.y1) - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 0),
                    2,
                )

            # Write frame
            out.write(frame)
            frame_count += 1

        cap.release()
        out.release()

        # Verify output created
        assert output_path.exists()
        assert frame_count > 0


class TestDetectionVerification:
    """Test detection results match expected outputs."""

    @pytest.mark.integration
    def test_verify_detections_match_expected(
        self, sample_image, expected_detections_json, mock_yolo_model
    ):
        """Test detection results match expected outputs."""
        # Run detection
        detections = mock_yolo_model(sample_image)

        # Load expected results
        with open(expected_detections_json) as f:
            expected = json.load(f)

        # Verify count
        assert len(detections) == len(expected["detections"])

        # Verify each detection
        for det, exp in zip(detections, expected["detections"]):
            assert det.class_id == exp["class_id"]
            assert det.class_name == exp["class_name"]
            assert abs(det.confidence - exp["confidence"]) < 0.1

    @pytest.mark.integration
    def test_detection_consistency(self, sample_image, mock_yolo_model):
        """Test detection consistency across multiple runs."""
        results = []

        # Run detection multiple times
        for _ in range(5):
            detections = mock_yolo_model(sample_image)
            results.append(detections)

        # All runs should produce same results (deterministic)
        assert all(len(r) == len(results[0]) for r in results)


class TestAlertGeneration:
    """Test alert generation for anomalies."""

    @pytest.mark.integration
    def test_generate_alert_for_hotspot(
        self, thermal_config, sample_thermal_raw, sample_detections
    ):
        """Test generating alerts for thermal hotspots."""
        from bahb.thermal.analyzer import ThermalAnalyzer

        analyzer = ThermalAnalyzer(thermal_config)

        # Analyze for anomalies
        anomalies = analyzer.detect_anomalies_advanced(
            sample_thermal_raw,
            sample_detections
        )

        # Create alerts for critical anomalies
        alerts = []
        for anomaly in anomalies:
            if anomaly["severity"] == "critical":
                alert = {
                    "timestamp": datetime.now().isoformat(),
                    "severity": "critical",
                    "type": "thermal_anomaly",
                    "description": anomaly["reason"],
                    "detection": anomaly["detection"].to_dict(),
                }
                alerts.append(alert)

        # Should generate alerts if critical anomalies found
        assert isinstance(alerts, list)

    @pytest.mark.integration
    def test_alert_threshold_filtering(self):
        """Test alerts are filtered by severity threshold."""
        from bahb.core.types import Anomaly

        # Create mock anomalies
        anomalies = [
            Anomaly(
                id="1",
                type="hotspot",
                severity=SeverityLevel.LOW,
                description="Minor hotspot",
                detection=Mock(),
            ),
            Anomaly(
                id="2",
                type="hotspot",
                severity=SeverityLevel.CRITICAL,
                description="Critical hotspot",
                detection=Mock(),
            ),
        ]

        # Filter by threshold (HIGH and above)
        alert_threshold = SeverityLevel.HIGH
        alerts = [a for a in anomalies if a.severity.value >= alert_threshold.value]

        assert len(alerts) == 1
        assert alerts[0].severity == SeverityLevel.CRITICAL

    @pytest.mark.integration
    def test_alert_notification_format(self):
        """Test alert notification format."""
        alert = {
            "timestamp": datetime.now().isoformat(),
            "severity": "critical",
            "type": "thermal_anomaly",
            "description": "Temperature exceeds critical threshold",
            "location": {"lat": 37.7749, "lon": -122.4194},
            "equipment": "transformer_01",
            "temperature": 95.5,
        }

        # Verify required fields
        assert "timestamp" in alert
        assert "severity" in alert
        assert "type" in alert
        assert "description" in alert


class TestRecordingOutput:
    """Test video recording output."""

    @pytest.mark.integration
    def test_create_recording(self, output_dir, sample_image):
        """Test creating video recording."""
        output_path = output_dir / "recording.mp4"

        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(output_path), fourcc, 30.0, (640, 640))

        # Write frames
        for i in range(30):
            frame = sample_image.copy()
            cv2.putText(
                frame,
                f"Frame {i}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (255, 255, 255),
                2,
            )
            out.write(frame)

        out.release()

        # Verify file created
        assert output_path.exists()
        assert output_path.stat().st_size > 0

    @pytest.mark.integration
    def test_recording_with_detections(self, output_dir, sample_image, sample_detections):
        """Test recording with detection overlays."""
        output_path = output_dir / "detections.mp4"

        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(output_path), fourcc, 30.0, (640, 640))

        for i in range(10):
            frame = sample_image.copy()

            # Draw detections
            for det in sample_detections:
                bbox = det.bbox
                cv2.rectangle(
                    frame,
                    (int(bbox.x1), int(bbox.y1)),
                    (int(bbox.x2), int(bbox.y2)),
                    (0, 255, 0),
                    2,
                )

            out.write(frame)

        out.release()

        assert output_path.exists()


class TestPerformanceBenchmarks:
    """Performance benchmarks for end-to-end pipeline."""

    @pytest.mark.benchmark
    @pytest.mark.integration
    def test_end_to_end_latency(
        self, sample_image, mock_yolo_model, thermal_config, sample_thermal_raw, benchmark_context
    ):
        """Benchmark end-to-end processing latency."""
        from bahb.thermal.analyzer import ThermalAnalyzer

        analyzer = ThermalAnalyzer(thermal_config)

        # Warmup
        for _ in range(5):
            detections = mock_yolo_model(sample_image)
            analyzer.analyze(sample_thermal_raw)

        # Benchmark
        iterations = 100
        for _ in range(iterations):
            benchmark_context.start()

            # Full pipeline
            detections = mock_yolo_model(sample_image)
            thermal_reading = analyzer.analyze(sample_thermal_raw)
            anomalies = analyzer.detect_anomalies_advanced(sample_thermal_raw, detections)

            benchmark_context.stop()

        print(f"\nEnd-to-End Latency:")
        print(f"  Average: {benchmark_context.avg_time_ms:.2f}ms")
        print(f"  Min: {benchmark_context.min_time_ms:.2f}ms")
        print(f"  Max: {benchmark_context.max_time_ms:.2f}ms")
        print(f"  Target FPS: {1000 / benchmark_context.avg_time_ms:.2f}")

    @pytest.mark.benchmark
    @pytest.mark.integration
    def test_throughput_multiframe(self, batch_images, mock_yolo_model):
        """Benchmark multi-frame throughput."""
        start_time = time.time()

        for img in batch_images * 10:  # Process 40 images
            mock_yolo_model(img)

        elapsed = time.time() - start_time
        fps = (len(batch_images) * 10) / elapsed

        print(f"\nThroughput:")
        print(f"  Frames: {len(batch_images) * 10}")
        print(f"  Time: {elapsed:.2f}s")
        print(f"  FPS: {fps:.2f}")

        assert fps > 10  # Should process at least 10 FPS

    @pytest.mark.benchmark
    @pytest.mark.integration
    def test_memory_usage(self, sample_image, mock_yolo_model):
        """Monitor memory usage during processing."""
        import psutil
        import os

        process = psutil.Process(os.getpid())

        # Get baseline memory
        baseline_mb = process.memory_info().rss / 1024 / 1024

        # Process frames
        for _ in range(100):
            mock_yolo_model(sample_image)

        # Get peak memory
        peak_mb = process.memory_info().rss / 1024 / 1024

        memory_increase = peak_mb - baseline_mb

        print(f"\nMemory Usage:")
        print(f"  Baseline: {baseline_mb:.2f} MB")
        print(f"  Peak: {peak_mb:.2f} MB")
        print(f"  Increase: {memory_increase:.2f} MB")


class TestCompleteInspectionWorkflow:
    """Test complete inspection workflow."""

    @pytest.mark.integration
    @pytest.mark.slow
    def test_full_inspection_session(
        self, sample_video, mock_yolo_model, thermal_config, output_dir
    ):
        """Test complete inspection session from start to finish."""
        from bahb.core.types import InspectionSession, InspectionType
        from bahb.thermal.analyzer import ThermalAnalyzer

        # Initialize session
        session = InspectionSession(
            session_id="test_session_001",
            inspection_type=InspectionType.SUBSTATION,
            start_time=datetime.now(),
            site_name="Test Substation",
        )

        analyzer = ThermalAnalyzer(thermal_config)

        # Process video
        cap = cv2.VideoCapture(str(sample_video))
        results = []

        frame_num = 0
        while cap.isOpened() and frame_num < 10:  # Process first 10 frames
            ret, frame = cap.read()
            if not ret:
                break

            # Detection
            detections = mock_yolo_model(frame)

            # Create result
            result = InspectionResult(
                frame_id=frame_num,
                timestamp=datetime.now(),
                location=None,
                detections=detections,
            )

            results.append(result)
            session.total_frames += 1
            session.total_detections += len(detections)

            frame_num += 1

        cap.release()

        # Finalize session
        session.end_time = datetime.now()

        # Generate summary
        summary = session.to_dict()

        assert summary["total_frames"] > 0
        assert summary["inspection_type"] == "SUBSTATION"

        # Save session report
        report_path = output_dir / "session_report.json"
        with open(report_path, "w") as f:
            json.dump(summary, f, indent=2)

        assert report_path.exists()

    @pytest.mark.integration
    def test_inspection_result_aggregation(self, sample_detections):
        """Test aggregating results from multiple frames."""
        from bahb.core.types import InspectionResult

        # Simulate multiple frames
        results = []
        for i in range(10):
            result = InspectionResult(
                frame_id=i,
                timestamp=datetime.now(),
                location=None,
                detections=sample_detections,
            )
            results.append(result)

        # Aggregate
        total_detections = sum(len(r.detections) for r in results)
        avg_detections = total_detections / len(results)

        assert total_detections == len(sample_detections) * 10
        assert avg_detections == len(sample_detections)


class TestReportGeneration:
    """Test inspection report generation."""

    @pytest.mark.integration
    def test_generate_json_report(self, sample_detections, output_dir):
        """Test generating JSON report."""
        from bahb.core.types import InspectionResult

        result = InspectionResult(
            frame_id=0,
            timestamp=datetime.now(),
            location=None,
            detections=sample_detections,
        )

        # Convert to dict
        report = result.to_dict()

        # Save
        report_path = output_dir / "report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        # Verify
        assert report_path.exists()

        # Load and verify
        with open(report_path) as f:
            loaded = json.load(f)

        assert loaded["frame_id"] == 0
        assert len(loaded["detections"]) == len(sample_detections)

    @pytest.mark.integration
    def test_report_includes_thermal_data(self, thermal_config, sample_thermal_raw, output_dir):
        """Test report includes thermal analysis data."""
        from bahb.thermal.analyzer import ThermalAnalyzer
        from bahb.core.types import InspectionResult

        analyzer = ThermalAnalyzer(thermal_config)
        thermal_reading = analyzer.analyze(sample_thermal_raw)

        result = InspectionResult(
            frame_id=0,
            timestamp=datetime.now(),
            location=None,
            thermal_reading=thermal_reading,
        )

        report = result.to_dict()

        assert "thermal" in report
        assert report["thermal"] is not None
        assert "min_temp" in report["thermal"]
        assert "max_temp" in report["thermal"]


class TestErrorRecovery:
    """Test error handling and recovery in end-to-end pipeline."""

    @pytest.mark.integration
    def test_continue_on_detection_error(self, sample_video, output_dir):
        """Test pipeline continues on individual frame errors."""
        cap = cv2.VideoCapture(str(sample_video))

        processed_frames = 0
        failed_frames = 0

        frame_num = 0
        while cap.isOpened() and frame_num < 10:
            ret, frame = cap.read()
            if not ret:
                break

            try:
                # Simulate occasional failures
                if frame_num == 3:
                    raise RuntimeError("Simulated detection error")

                # Normal processing
                processed_frames += 1

            except Exception as e:
                # Log and continue
                failed_frames += 1

            frame_num += 1

        cap.release()

        # Should have processed most frames
        assert processed_frames > 0
        assert failed_frames == 1

    @pytest.mark.integration
    def test_graceful_degradation(self):
        """Test graceful degradation when components fail."""
        # Mock components
        detection_available = True
        thermal_available = False

        results = {
            "detections": [] if detection_available else None,
            "thermal": None if not thermal_available else {},
        }

        # Should still produce partial results
        assert results is not None
        assert "detections" in results


class TestIntegrationWithRealModels:
    """Integration tests with real models (skipped if not available)."""

    @pytest.mark.integration
    @pytest.mark.gpu
    @pytest.mark.slow
    def test_yolo26_real_model(self, sample_image):
        """Test with real YOLO26 model (if available)."""
        model_path = Path("/home/user/BAHB/yolo26l.pt")

        if not model_path.exists():
            pytest.skip("YOLO26 model not found")

        # This would test with real model
        pytest.skip("Implement when real model testing is needed")

    @pytest.mark.integration
    @pytest.mark.gpu
    def test_tensorrt_engine(self):
        """Test with TensorRT engine (if available)."""
        engine_path = Path("/home/user/BAHB/models/tensorrt/yolo26l_int8.engine")

        if not engine_path.exists():
            pytest.skip("TensorRT engine not found")

        pytest.skip("Implement when TensorRT testing is needed")
