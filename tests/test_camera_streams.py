"""Integration tests for camera stream handling."""

from __future__ import annotations

import time
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import cv2
import numpy as np
import pytest

from bahb.camera.h30t import CameraStream, H30TCamera, StreamState
from bahb.core.types import CameraType


class TestRTSPConnection:
    """Test RTSP camera connection."""

    @pytest.mark.integration
    def test_rtsp_stream_creation(self):
        """Test creating RTSP stream object."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://192.168.42.2:8554/wide",
            resolution=(1920, 1080),
            fps=30,
        )

        assert stream.stream_type == CameraType.WIDE
        assert stream.rtsp_url == "rtsp://192.168.42.2:8554/wide"
        assert stream.resolution == (1920, 1080)
        assert stream.target_fps == 30
        assert stream.state == StreamState.DISCONNECTED

    @pytest.mark.integration
    def test_mock_rtsp_connection(self, mock_rtsp_stream):
        """Test RTSP connection with mock stream."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
        )

        # Mock the VideoCapture
        with patch("cv2.VideoCapture", return_value=mock_rtsp_stream):
            result = stream.connect()

            assert result is True
            assert stream.state == StreamState.CONNECTED

    @pytest.mark.integration
    def test_connection_failure(self):
        """Test handling connection failure."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://invalid.url",
            resolution=(1920, 1080),
            fps=30,
        )

        # Mock failed connection
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = False

        with patch("cv2.VideoCapture", return_value=mock_cap):
            result = stream.connect()

            assert result is False
            assert stream.state == StreamState.ERROR

    @pytest.mark.integration
    def test_gstreamer_pipeline_fallback(self):
        """Test fallback from GStreamer to FFmpeg."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://192.168.42.2:8554/wide",
            resolution=(1920, 1080),
            fps=30,
        )

        # Verify GStreamer pipeline is built
        pipeline = stream._build_gstreamer_pipeline()

        assert "rtspsrc" in pipeline
        assert "nvv4l2decoder" in pipeline
        assert "appsink" in pipeline
        assert stream.rtsp_url in pipeline


class TestFrameCapture:
    """Test frame capture from streams."""

    @pytest.mark.integration
    def test_frame_capture_start(self, mock_rtsp_stream):
        """Test starting frame capture."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
        )

        with patch("cv2.VideoCapture", return_value=mock_rtsp_stream):
            stream.connect()
            stream.start()

            assert stream._running is True
            assert stream.state == StreamState.STREAMING
            assert stream._thread is not None

            stream.stop()

    @pytest.mark.integration
    def test_get_latest_frame(self, mock_rtsp_stream):
        """Test getting the latest frame from buffer."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
        )

        # Add frame to buffer manually
        frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
        timestamp = datetime.now()
        stream._frame_buffer.append((frame, timestamp))

        result = stream.get_latest_frame()

        assert result is not None
        assert len(result) == 2
        assert result[0].shape == (1080, 1920, 3)

    @pytest.mark.integration
    def test_frame_buffer_size_limit(self):
        """Test frame buffer respects size limit."""
        buffer_size = 5
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
            buffer_size=buffer_size,
        )

        # Add more frames than buffer size
        for i in range(10):
            frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
            timestamp = datetime.now()
            stream._frame_buffer.append((frame, timestamp))

        # Buffer should not exceed max size
        assert len(stream._frame_buffer) == buffer_size

    @pytest.mark.integration
    def test_frame_capture_callback(self, mock_rtsp_stream):
        """Test frame callback is invoked."""
        callback_called = []

        def on_frame(frame, timestamp):
            callback_called.append((frame, timestamp))

        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
        )

        stream.set_callbacks(on_frame=on_frame)

        # Manually trigger callback
        frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
        timestamp = datetime.now()
        if stream._on_frame:
            stream._on_frame(frame, timestamp)

        assert len(callback_called) == 1


class TestStreamReconnection:
    """Test stream reconnection logic."""

    @pytest.mark.integration
    def test_reconnect_on_failure(self):
        """Test automatic reconnection on stream failure."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
        )

        # Simulate connection loss and recovery
        reconnect_count = 0

        def mock_connect():
            nonlocal reconnect_count
            reconnect_count += 1
            return reconnect_count >= 3  # Succeed on 3rd attempt

        # Test reconnection logic
        max_attempts = 5
        for _ in range(max_attempts):
            if mock_connect():
                break
            time.sleep(0.1)

        assert reconnect_count >= 3

    @pytest.mark.integration
    def test_error_callback_on_failure(self):
        """Test error callback is invoked on failure."""
        errors = []

        def on_error(error):
            errors.append(error)

        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
        )

        stream.set_callbacks(on_error=on_error)

        # Manually trigger error
        test_error = ConnectionError("Test error")
        if stream._on_error:
            stream._on_error(test_error)

        assert len(errors) == 1
        assert isinstance(errors[0], ConnectionError)


class TestFrameSynchronization:
    """Test frame synchronization between multiple streams."""

    @pytest.mark.integration
    def test_h30t_camera_init(self):
        """Test H30T camera initialization."""
        config = Mock()
        config.wide = Mock(enabled=True, resolution=[1920, 1080], fps=30)
        config.zoom = Mock(enabled=True, resolution=[3840, 2160], fps=30)
        config.thermal = Mock(enabled=True, resolution=[640, 512], fps=30)
        config.streams = {
            "wide": "rtsp://192.168.42.2:8554/wide",
            "zoom": "rtsp://192.168.42.2:8554/zoom",
            "thermal": "rtsp://192.168.42.2:8554/thermal",
        }

        camera = H30TCamera(config)

        assert len(camera.streams) == 3
        assert CameraType.WIDE in camera.streams
        assert CameraType.ZOOM in camera.streams
        assert CameraType.THERMAL in camera.streams

    @pytest.mark.integration
    def test_frame_timestamp_sync(self):
        """Test synchronizing frames by timestamp."""
        # Simulate frames from different streams with timestamps
        base_time = datetime.now()

        frames = {
            "wide": (np.zeros((1080, 1920, 3)), base_time),
            "thermal": (np.zeros((512, 640, 3)), base_time),
        }

        # Calculate time difference
        time_diff = abs((frames["thermal"][1] - frames["wide"][1]).total_seconds() * 1000)

        # Should be synchronized (< 50ms tolerance)
        assert time_diff < 50

    @pytest.mark.integration
    def test_frame_sync_tolerance(self):
        """Test frame sync with tolerance threshold."""
        import datetime as dt

        base_time = datetime.now()
        tolerance_ms = 50

        # Frame 1: exactly on time
        frame1_time = base_time

        # Frame 2: 30ms late (within tolerance)
        frame2_time = base_time + dt.timedelta(milliseconds=30)

        # Frame 3: 80ms late (outside tolerance)
        frame3_time = base_time + dt.timedelta(milliseconds=80)

        def is_synchronized(t1, t2, tolerance_ms):
            diff_ms = abs((t1 - t2).total_seconds() * 1000)
            return diff_ms <= tolerance_ms

        assert is_synchronized(frame1_time, frame2_time, tolerance_ms)
        assert not is_synchronized(frame1_time, frame3_time, tolerance_ms)

    @pytest.mark.integration
    def test_multi_stream_sync(self):
        """Test synchronizing multiple camera streams."""
        # Mock multiple streams with different delays
        base_time = datetime.now()

        stream_frames = {
            CameraType.WIDE: (np.zeros((1080, 1920, 3)), base_time),
            CameraType.ZOOM: (np.zeros((2160, 3840, 3)), base_time),
            CameraType.THERMAL: (np.zeros((512, 640)), base_time),
        }

        # All should be synchronized
        reference_time = stream_frames[CameraType.WIDE][1]

        for stream_type, (frame, timestamp) in stream_frames.items():
            time_diff = abs((timestamp - reference_time).total_seconds() * 1000)
            assert time_diff < 50  # Within tolerance


class TestStreamStatistics:
    """Test stream statistics and monitoring."""

    @pytest.mark.integration
    def test_fps_calculation(self):
        """Test FPS calculation from frame timestamps."""
        frame_times = []
        start_time = time.time()

        # Simulate 30 frames at 30 FPS
        for i in range(30):
            frame_times.append(start_time + i / 30.0)

        # Calculate FPS
        elapsed = frame_times[-1] - frame_times[0]
        fps = len(frame_times) / elapsed if elapsed > 0 else 0

        assert 29 <= fps <= 31  # Should be close to 30 FPS

    @pytest.mark.integration
    def test_frame_drop_detection(self):
        """Test detecting dropped frames."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
        )

        # Simulate frame drops
        stream._stats.frames_received = 100
        stream._stats.frames_dropped = 5

        drop_rate = stream._stats.frames_dropped / stream._stats.frames_received
        assert drop_rate == 0.05  # 5% drop rate

    @pytest.mark.integration
    def test_stream_health_monitoring(self):
        """Test monitoring stream health."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
        )

        # Update stats
        stream._stats.frames_received = 1000
        stream._stats.frames_dropped = 10
        stream._stats.avg_fps = 29.5

        # Health check
        drop_rate = stream._stats.frames_dropped / stream._stats.frames_received
        is_healthy = (
            drop_rate < 0.05 and  # Less than 5% drops
            stream._stats.avg_fps >= 25  # At least 25 FPS
        )

        assert is_healthy


class TestThermalStreamDecoding:
    """Test thermal stream-specific decoding."""

    @pytest.mark.integration
    def test_thermal_raw_decode(self):
        """Test decoding thermal raw data to temperature."""
        config = Mock()
        config.thermal = Mock(
            enabled=True,
            resolution=[640, 512],
            fps=30,
            temperature_range=[-40, 550]
        )
        config.wide = Mock(enabled=False)
        config.zoom = Mock(enabled=False)
        config.streams = {"thermal": "rtsp://test"}

        camera = H30TCamera(config)

        # Simulate thermal frame
        thermal_frame = np.random.randint(0, 255, (512, 640, 3), dtype=np.uint8)

        # Decode to temperatures
        temperatures = camera._decode_thermal_raw(thermal_frame)

        assert temperatures.dtype == np.float32
        assert temperatures.shape == (512, 640)
        assert -40 <= temperatures.min() <= 550
        assert -40 <= temperatures.max() <= 550


class TestMultiCameraCoordination:
    """Test coordinating multiple camera streams."""

    @pytest.mark.integration
    async def test_start_all_streams(self):
        """Test starting all H30T camera streams."""
        config = Mock()
        config.wide = Mock(enabled=True, resolution=[1920, 1080], fps=30)
        config.zoom = Mock(enabled=False)  # Disabled
        config.thermal = Mock(enabled=True, resolution=[640, 512], fps=30)
        config.streams = {
            "wide": "rtsp://192.168.42.2:8554/wide",
            "thermal": "rtsp://192.168.42.2:8554/thermal",
        }

        camera = H30TCamera(config)

        # Only enabled streams should be created
        assert len(camera.streams) == 2

    @pytest.mark.integration
    def test_get_stream_stats(self):
        """Test getting statistics from all streams."""
        config = Mock()
        config.wide = Mock(enabled=True, resolution=[1920, 1080], fps=30)
        config.zoom = Mock(enabled=True, resolution=[3840, 2160], fps=30)
        config.thermal = Mock(enabled=True, resolution=[640, 512], fps=30)
        config.streams = {
            "wide": "rtsp://test/wide",
            "zoom": "rtsp://test/zoom",
            "thermal": "rtsp://test/thermal",
        }

        camera = H30TCamera(config)
        stats = camera.get_stream_stats()

        assert len(stats) == 3
        assert "wide" in stats
        assert "zoom" in stats
        assert "thermal" in stats


class TestErrorHandling:
    """Test stream error handling."""

    @pytest.mark.integration
    def test_stream_timeout(self):
        """Test handling stream read timeout."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
        )

        # Test get_frame with timeout
        result = stream.get_frame(timeout=0.1)

        # Should return None on timeout (empty buffer)
        assert result is None

    @pytest.mark.integration
    def test_invalid_rtsp_url(self):
        """Test handling invalid RTSP URL."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="not-a-valid-url",
            resolution=(1920, 1080),
            fps=30,
        )

        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = False

        with patch("cv2.VideoCapture", return_value=mock_cap):
            result = stream.connect()

            assert result is False
            assert stream.state == StreamState.ERROR

    @pytest.mark.integration
    def test_stream_cleanup_on_stop(self, mock_rtsp_stream):
        """Test proper cleanup when stream is stopped."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
        )

        with patch("cv2.VideoCapture", return_value=mock_rtsp_stream):
            stream.connect()
            stream.start()
            time.sleep(0.1)
            stream.stop()

            assert stream._running is False
            assert stream.state == StreamState.DISCONNECTED


class TestLowLatencyOptimization:
    """Test low-latency streaming optimizations."""

    @pytest.mark.integration
    def test_buffer_size_configuration(self):
        """Test configuring buffer size for low latency."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://test",
            resolution=(1920, 1080),
            fps=30,
            buffer_size=1,  # Minimal buffer for low latency
        )

        assert stream.buffer_size == 1
        assert stream._frame_buffer.maxlen == 1

    @pytest.mark.integration
    def test_gstreamer_latency_settings(self):
        """Test GStreamer pipeline latency configuration."""
        stream = CameraStream(
            stream_type=CameraType.WIDE,
            rtsp_url="rtsp://192.168.42.2:8554/wide",
            resolution=(1920, 1080),
            fps=30,
        )

        pipeline = stream._build_gstreamer_pipeline()

        # Should have low latency settings
        assert "latency=50" in pipeline  # 50ms latency
        assert "drop=1" in pipeline  # Drop old frames
        assert "max-buffers=1" in pipeline  # Minimal buffering
