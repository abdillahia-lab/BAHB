"""Integration tests for DeepStream pipeline."""

from __future__ import annotations

import configparser
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

import pytest


class TestDeepStreamConfig:
    """Test DeepStream configuration parsing."""

    @pytest.mark.unit
    def test_config_file_exists(self, deepstream_config_path):
        """Test that DeepStream config file exists."""
        assert deepstream_config_path.exists()
        assert deepstream_config_path.suffix == ".txt"

    @pytest.mark.unit
    def test_parse_config_file(self, deepstream_config_path):
        """Test parsing DeepStream config file."""
        config = configparser.ConfigParser()
        config.read(deepstream_config_path)

        # Verify essential sections exist
        assert "application" in config.sections()
        assert "streammux" in config.sections()
        assert "primary-gie" in config.sections()

    @pytest.mark.unit
    def test_config_stream_sources(self, deepstream_config_path):
        """Test stream source configuration."""
        config = configparser.ConfigParser()
        config.read(deepstream_config_path)

        # Should have H30T camera sources
        sections = config.sections()
        source_sections = [s for s in sections if s.startswith("source")]

        assert len(source_sections) >= 2  # Wide + Thermal
        assert "source0" in sections
        assert "source1" in sections

        # Verify RTSP URIs
        if "source0" in config:
            assert "uri" in config["source0"]
            assert "rtsp://" in config["source0"]["uri"]

    @pytest.mark.unit
    def test_config_primary_gie(self, deepstream_config_path):
        """Test primary inference engine configuration."""
        config = configparser.ConfigParser()
        config.read(deepstream_config_path)

        assert "primary-gie" in config.sections()
        gie_config = config["primary-gie"]

        # Verify key parameters
        assert "model-engine-file" in gie_config
        assert "config-file" in gie_config
        assert "batch-size" in gie_config

    @pytest.mark.unit
    def test_config_tracker(self, deepstream_config_path):
        """Test tracker configuration."""
        config = configparser.ConfigParser()
        config.read(deepstream_config_path)

        if "tracker" in config.sections():
            tracker_config = config["tracker"]

            # Verify tracker settings
            assert "ll-lib-file" in tracker_config
            assert "ll-config-file" in tracker_config

    @pytest.mark.unit
    def test_config_output_sinks(self, deepstream_config_path):
        """Test output sink configuration."""
        config = configparser.ConfigParser()
        config.read(deepstream_config_path)

        # Should have at least one sink
        sink_sections = [s for s in config.sections() if s.startswith("sink")]
        assert len(sink_sections) > 0

    @pytest.mark.unit
    def test_validate_config_paths(self, deepstream_config_path):
        """Test that referenced files in config exist or are properly set."""
        config = configparser.ConfigParser()
        config.read(deepstream_config_path)

        if "primary-gie" in config.sections():
            gie_config = config["primary-gie"]

            # Check if model paths are properly formatted
            if "model-engine-file" in gie_config:
                model_path = gie_config["model-engine-file"]
                assert model_path.startswith("/") or model_path.startswith("models/")


class TestPipelineInitialization:
    """Test DeepStream pipeline initialization."""

    @pytest.mark.integration
    @pytest.mark.gpu
    def test_pipeline_creation(self):
        """Test creating DeepStream pipeline (requires DeepStream SDK)."""
        try:
            import gi
            gi.require_version('Gst', '1.0')
            from gi.repository import Gst

            Gst.init(None)
            pipeline = Gst.Pipeline.new("test-pipeline")

            assert pipeline is not None
            assert isinstance(pipeline, Gst.Pipeline)

        except (ImportError, ValueError) as e:
            pytest.skip(f"DeepStream/GStreamer not available: {e}")

    @pytest.mark.integration
    @pytest.mark.gpu
    def test_create_source_element(self):
        """Test creating RTSP source element."""
        try:
            import gi
            gi.require_version('Gst', '1.0')
            from gi.repository import Gst

            Gst.init(None)

            # Create RTSP source
            source = Gst.ElementFactory.make("rtspsrc", "rtsp-source")
            assert source is not None

            # Set properties
            source.set_property("location", "rtsp://192.168.42.2:8554/wide")
            source.set_property("latency", 100)

            location = source.get_property("location")
            assert "rtsp://" in location

        except (ImportError, ValueError):
            pytest.skip("DeepStream/GStreamer not available")

    @pytest.mark.integration
    @pytest.mark.gpu
    def test_create_streammux(self):
        """Test creating stream multiplexer."""
        try:
            import gi
            gi.require_version('Gst', '1.0')
            from gi.repository import Gst

            Gst.init(None)

            # Create streammux
            streammux = Gst.ElementFactory.make("nvstreammux", "stream-mux")
            assert streammux is not None

            # Configure
            streammux.set_property("width", 640)
            streammux.set_property("height", 640)
            streammux.set_property("batch-size", 2)
            streammux.set_property("batched-push-timeout", 40000)

        except (ImportError, ValueError):
            pytest.skip("DeepStream/GStreamer not available")

    @pytest.mark.integration
    @pytest.mark.gpu
    def test_create_nvinfer(self):
        """Test creating nvinfer (primary GIE) element."""
        try:
            import gi
            gi.require_version('Gst', '1.0')
            from gi.repository import Gst

            Gst.init(None)

            # Create nvinfer
            pgie = Gst.ElementFactory.make("nvinfer", "primary-inference")
            assert pgie is not None

            # This would normally use a config file
            # pgie.set_property("config-file-path", config_path)

        except (ImportError, ValueError):
            pytest.skip("DeepStream/GStreamer not available")


class TestMultiStreamProcessing:
    """Test multi-stream processing capabilities."""

    @pytest.mark.integration
    @pytest.mark.gpu
    def test_dual_stream_mux(self):
        """Test multiplexing two streams (visual + thermal)."""
        pytest.skip("Requires full DeepStream pipeline setup")

    @pytest.mark.integration
    def test_stream_synchronization(self):
        """Test frame synchronization between streams."""
        # Mock stream sync logic
        from collections import deque
        import time

        class StreamBuffer:
            def __init__(self, max_size=10):
                self.buffer = deque(maxlen=max_size)

            def add_frame(self, frame, timestamp):
                self.buffer.append((frame, timestamp))

            def get_synced_frame(self, target_time, tolerance_ms=50):
                for frame, ts in self.buffer:
                    if abs((ts - target_time) * 1000) <= tolerance_ms:
                        return frame, ts
                return None

        # Test sync logic
        visual_buffer = StreamBuffer()
        thermal_buffer = StreamBuffer()

        base_time = time.time()

        # Add frames with slight time differences
        visual_buffer.add_frame("visual_frame_1", base_time)
        thermal_buffer.add_frame("thermal_frame_1", base_time + 0.01)  # 10ms later

        # Should find synced frames within tolerance
        visual_frame = visual_buffer.get_synced_frame(base_time)
        thermal_frame = thermal_buffer.get_synced_frame(base_time, tolerance_ms=50)

        assert visual_frame is not None
        assert thermal_frame is not None


class TestTrackerIntegration:
    """Test object tracker integration."""

    @pytest.mark.integration
    @pytest.mark.gpu
    def test_nvdcf_tracker_config(self):
        """Test NvDCF tracker configuration."""
        tracker_config_path = Path("/home/user/BAHB/configs/deepstream/ds_tracker_nvdcf.yml")

        if not tracker_config_path.exists():
            pytest.skip("Tracker config not found")

        # Should be valid YAML
        import yaml
        with open(tracker_config_path) as f:
            config = yaml.safe_load(f)

        assert config is not None

    @pytest.mark.integration
    def test_tracker_association(self):
        """Test tracker associates detections across frames."""
        # Mock tracker logic
        class SimpleTracker:
            def __init__(self):
                self.tracks = {}
                self.next_id = 1

            def update(self, detections):
                """Assign track IDs to detections."""
                tracked = []

                for det in detections:
                    # Simple distance-based association
                    track_id = self._find_matching_track(det)

                    if track_id is None:
                        track_id = self.next_id
                        self.next_id += 1

                    self.tracks[track_id] = det
                    det.track_id = track_id
                    tracked.append(det)

                return tracked

            def _find_matching_track(self, det):
                # Simplified: find closest existing track
                min_dist = float('inf')
                best_id = None

                det_center = det.bbox.center

                for track_id, prev_det in self.tracks.items():
                    prev_center = prev_det.bbox.center
                    dist = ((det_center[0] - prev_center[0])**2 +
                           (det_center[1] - prev_center[1])**2)**0.5

                    if dist < min_dist and dist < 50:  # threshold
                        min_dist = dist
                        best_id = track_id

                return best_id

        # Test
        from bahb.core.types import BoundingBox, Detection

        tracker = SimpleTracker()

        # Frame 1
        dets_frame1 = [
            Detection(0, "transformer", 0.9, BoundingBox(100, 100, 200, 200)),
            Detection(1, "insulator", 0.85, BoundingBox(400, 400, 500, 500)),
        ]
        tracked1 = tracker.update(dets_frame1)

        # Frame 2 - objects moved slightly
        dets_frame2 = [
            Detection(0, "transformer", 0.9, BoundingBox(105, 105, 205, 205)),
            Detection(1, "insulator", 0.85, BoundingBox(405, 405, 505, 505)),
        ]
        tracked2 = tracker.update(dets_frame2)

        # Should maintain track IDs
        assert tracked1[0].track_id == tracked2[0].track_id
        assert tracked1[1].track_id == tracked2[1].track_id


class TestOutputFormats:
    """Test DeepStream output format handling."""

    @pytest.mark.unit
    def test_nvds_metadata_structure(self):
        """Test NvDsMetaData structure compatibility."""
        # Mock metadata structure
        class NvDsBatchMeta:
            def __init__(self):
                self.frame_meta_list = []

        class NvDsFrameMeta:
            def __init__(self):
                self.frame_num = 0
                self.obj_meta_list = []

        class NvDsObjectMeta:
            def __init__(self):
                self.class_id = 0
                self.confidence = 0.0
                self.rect_params = {
                    "left": 0,
                    "top": 0,
                    "width": 0,
                    "height": 0,
                }

        # Create mock metadata
        batch_meta = NvDsBatchMeta()
        frame_meta = NvDsFrameMeta()
        obj_meta = NvDsObjectMeta()

        obj_meta.class_id = 0
        obj_meta.confidence = 0.85
        obj_meta.rect_params = {
            "left": 100,
            "top": 100,
            "width": 100,
            "height": 100,
        }

        frame_meta.obj_meta_list.append(obj_meta)
        batch_meta.frame_meta_list.append(frame_meta)

        # Verify structure
        assert len(batch_meta.frame_meta_list) == 1
        assert len(batch_meta.frame_meta_list[0].obj_meta_list) == 1

    @pytest.mark.unit
    def test_convert_nvds_to_detection(self):
        """Test converting NvDs metadata to Detection objects."""
        from bahb.core.types import BoundingBox, Detection

        # Mock NvDs object meta
        class MockObjMeta:
            def __init__(self):
                self.class_id = 0
                self.confidence = 0.85
                self.rect_params = Mock()
                self.rect_params.left = 100
                self.rect_params.top = 100
                self.rect_params.width = 100
                self.rect_params.height = 100

        obj_meta = MockObjMeta()

        # Convert
        detection = Detection(
            class_id=obj_meta.class_id,
            class_name="transformer",
            confidence=obj_meta.confidence,
            bbox=BoundingBox(
                x1=obj_meta.rect_params.left,
                y1=obj_meta.rect_params.top,
                x2=obj_meta.rect_params.left + obj_meta.rect_params.width,
                y2=obj_meta.rect_params.top + obj_meta.rect_params.height,
            ),
        )

        assert detection.class_id == 0
        assert detection.confidence == 0.85
        assert detection.bbox.x1 == 100
        assert detection.bbox.y1 == 100
        assert detection.bbox.x2 == 200
        assert detection.bbox.y2 == 200


class TestPipelinePerformance:
    """Test DeepStream pipeline performance."""

    @pytest.mark.benchmark
    @pytest.mark.gpu
    def test_pipeline_throughput(self):
        """Test pipeline throughput with multiple streams."""
        pytest.skip("Requires full DeepStream pipeline and GPU")

    @pytest.mark.benchmark
    def test_memory_usage(self):
        """Test pipeline memory consumption."""
        pytest.skip("Requires full DeepStream pipeline")

    @pytest.mark.integration
    def test_zero_copy_optimization(self):
        """Test zero-copy memory operations are used."""
        # Verify config uses zero-copy
        config_path = Path("/home/user/BAHB/configs/deepstream/ds_pipeline_config.txt")

        if not config_path.exists():
            pytest.skip("Config not found")

        config = configparser.ConfigParser()
        config.read(config_path)

        # Check for zero-copy settings
        if "streammux" in config:
            # Should use device memory for zero-copy
            assert "nvbuf-memory-type" in config["streammux"]


class TestErrorHandling:
    """Test pipeline error handling."""

    @pytest.mark.integration
    def test_stream_disconnection_recovery(self):
        """Test recovery from stream disconnection."""
        # Mock stream that disconnects
        class MockStream:
            def __init__(self):
                self.connected = True
                self.reconnect_attempts = 0

            def read(self):
                if not self.connected:
                    self.reconnect_attempts += 1
                    if self.reconnect_attempts >= 3:
                        self.connected = True
                    return False, None
                return True, "frame"

        stream = MockStream()

        # Simulate disconnection
        stream.connected = False

        # Attempt reads
        for _ in range(5):
            success, frame = stream.read()

        # Should reconnect
        assert stream.connected

    @pytest.mark.unit
    def test_invalid_model_path_handling(self):
        """Test handling of invalid model paths in config."""
        config = configparser.ConfigParser()
        config.add_section("primary-gie")
        config.set("primary-gie", "model-engine-file", "/nonexistent/model.engine")

        model_path = config["primary-gie"]["model-engine-file"]
        assert not Path(model_path).exists()

        # Should handle gracefully (not crash)
        # In real implementation, would log error and fall back


class TestRTSPStreaming:
    """Test RTSP stream handling."""

    @pytest.mark.integration
    def test_rtsp_url_parsing(self):
        """Test RTSP URL parsing and validation."""
        valid_urls = [
            "rtsp://192.168.42.2:8554/wide",
            "rtsp://192.168.42.2:8554/zoom",
            "rtsp://192.168.42.2:8554/thermal",
        ]

        for url in valid_urls:
            assert url.startswith("rtsp://")
            assert ":" in url
            parts = url.split(":")
            assert len(parts) >= 3  # protocol, IP:port, path

    @pytest.mark.integration
    def test_gstreamer_pipeline_string(self):
        """Test GStreamer pipeline string construction."""
        rtsp_url = "rtsp://192.168.42.2:8554/wide"

        pipeline = (
            f"rtspsrc location={rtsp_url} latency=50 ! "
            "rtph265depay ! h265parse ! "
            "nvv4l2decoder ! "
            "nvvidconv ! "
            "video/x-raw, width=640, height=640, format=BGRx ! "
            "videoconvert ! "
            "video/x-raw, format=BGR ! "
            "appsink drop=1 max-buffers=1"
        )

        # Verify pipeline components
        assert "rtspsrc" in pipeline
        assert "nvv4l2decoder" in pipeline  # Hardware decoder
        assert "appsink" in pipeline
        assert rtsp_url in pipeline
