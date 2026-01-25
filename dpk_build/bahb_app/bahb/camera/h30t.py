"""DJI H30T multi-sensor camera interface.

This module provides comprehensive integration with the DJI H30T camera system for
infrastructure inspection with BAHB. It includes:

- H30TCamera: Main camera interface with multi-stream RTSP support
- H30TThermalProcessor: Advanced radiometric thermal data processing
- DJIMSDKBridge: Interface for DJI MSDK telemetry and control (stub for future implementation)
- StreamManager: Multi-stream buffer management for DeepStream integration
"""

from __future__ import annotations

import asyncio
import struct
import threading
import time
from collections import deque
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Callable, Optional, Dict, List, Tuple

import cv2
import numpy as np
from numpy.typing import NDArray
from loguru import logger

from bahb.core.config import H30TConfig
from bahb.core.types import CameraType, FrameData, GeoLocation


class StreamState(Enum):
    """Camera stream state."""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    STREAMING = "streaming"
    ERROR = "error"


@dataclass
class StreamStats:
    """Stream statistics."""
    frames_received: int = 0
    frames_dropped: int = 0
    last_frame_time: float = 0.0
    avg_fps: float = 0.0
    bitrate_kbps: float = 0.0
    latency_ms: float = 0.0


class CameraStream:
    """Individual camera stream handler."""

    def __init__(
        self,
        stream_type: CameraType,
        rtsp_url: str,
        resolution: tuple[int, int] = (1920, 1080),
        fps: int = 30,
        buffer_size: int = 5,
    ):
        self.stream_type = stream_type
        self.rtsp_url = rtsp_url
        self.resolution = resolution
        self.target_fps = fps
        self.buffer_size = buffer_size

        self._capture: Optional[cv2.VideoCapture] = None
        self._state = StreamState.DISCONNECTED
        self._frame_buffer: deque = deque(maxlen=buffer_size)
        self._stats = StreamStats()
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

        # Callbacks
        self._on_frame: Optional[Callable[[NDArray, datetime], None]] = None
        self._on_error: Optional[Callable[[Exception], None]] = None

    @property
    def state(self) -> StreamState:
        return self._state

    @property
    def stats(self) -> StreamStats:
        return self._stats

    def set_callbacks(
        self,
        on_frame: Optional[Callable[[NDArray, datetime], None]] = None,
        on_error: Optional[Callable[[Exception], None]] = None,
    ) -> None:
        """Set callback functions."""
        self._on_frame = on_frame
        self._on_error = on_error

    def connect(self) -> bool:
        """Connect to RTSP stream."""
        self._state = StreamState.CONNECTING
        logger.info(f"Connecting to {self.stream_type.value} stream: {self.rtsp_url}")

        try:
            # Configure GStreamer pipeline for low-latency
            gst_pipeline = self._build_gstreamer_pipeline()

            self._capture = cv2.VideoCapture(gst_pipeline, cv2.CAP_GSTREAMER)

            if not self._capture.isOpened():
                # Fallback to FFmpeg
                logger.warning("GStreamer failed, falling back to FFmpeg")
                self._capture = cv2.VideoCapture(self.rtsp_url)

                if not self._capture.isOpened():
                    raise ConnectionError(f"Failed to open stream: {self.rtsp_url}")

            # Set buffer size for low latency
            self._capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            self._state = StreamState.CONNECTED
            logger.info(f"{self.stream_type.value} stream connected")
            return True

        except Exception as e:
            self._state = StreamState.ERROR
            logger.error(f"Failed to connect: {e}")
            if self._on_error:
                self._on_error(e)
            return False

    def _build_gstreamer_pipeline(self) -> str:
        """Build GStreamer pipeline for H30T RTSP stream."""
        # Optimized for NVIDIA Jetson/Orin hardware decoding
        pipeline = (
            f"rtspsrc location={self.rtsp_url} latency=50 ! "
            "rtph265depay ! h265parse ! "
            "nvv4l2decoder ! "
            "nvvidconv ! "
            f"video/x-raw, width={self.resolution[0]}, height={self.resolution[1]}, format=BGRx ! "
            "videoconvert ! "
            "video/x-raw, format=BGR ! "
            "appsink drop=1 max-buffers=1"
        )
        return pipeline

    def start(self) -> None:
        """Start frame capture thread."""
        if self._running:
            return

        if self._state != StreamState.CONNECTED:
            if not self.connect():
                return

        self._running = True
        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()
        self._state = StreamState.STREAMING
        logger.info(f"{self.stream_type.value} stream started")

    def stop(self) -> None:
        """Stop frame capture."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=2.0)
        if self._capture:
            self._capture.release()
            self._capture = None
        self._state = StreamState.DISCONNECTED
        logger.info(f"{self.stream_type.value} stream stopped")

    def _capture_loop(self) -> None:
        """Main capture loop running in separate thread."""
        frame_count = 0
        start_time = time.time()
        last_fps_update = start_time

        while self._running:
            try:
                ret, frame = self._capture.read()

                if not ret:
                    self._stats.frames_dropped += 1
                    logger.warning(f"{self.stream_type.value}: Frame drop")
                    time.sleep(0.01)
                    continue

                timestamp = datetime.now()
                frame_count += 1
                self._stats.frames_received += 1
                self._stats.last_frame_time = time.time()

                # Update FPS calculation
                current_time = time.time()
                if current_time - last_fps_update >= 1.0:
                    self._stats.avg_fps = frame_count / (current_time - last_fps_update)
                    frame_count = 0
                    last_fps_update = current_time

                # Store in buffer
                with self._lock:
                    self._frame_buffer.append((frame, timestamp))

                # Callback
                if self._on_frame:
                    self._on_frame(frame, timestamp)

            except Exception as e:
                logger.error(f"Capture error: {e}")
                if self._on_error:
                    self._on_error(e)
                time.sleep(0.1)

    def get_latest_frame(self) -> Optional[tuple[NDArray, datetime]]:
        """Get the most recent frame."""
        with self._lock:
            if self._frame_buffer:
                return self._frame_buffer[-1]
        return None

    def get_frame(self, timeout: float = 1.0) -> Optional[tuple[NDArray, datetime]]:
        """Get frame from buffer with timeout."""
        start = time.time()
        while time.time() - start < timeout:
            with self._lock:
                if self._frame_buffer:
                    return self._frame_buffer.popleft()
            time.sleep(0.01)
        return None


class H30TCamera:
    """DJI H30T multi-sensor camera controller."""

    def __init__(self, config: H30TConfig):
        self.config = config

        # Initialize camera streams
        self.streams: dict[CameraType, CameraStream] = {}

        if config.wide.enabled:
            self.streams[CameraType.WIDE] = CameraStream(
                stream_type=CameraType.WIDE,
                rtsp_url=config.streams.get("wide", ""),
                resolution=tuple(config.wide.resolution),
                fps=config.wide.fps,
            )

        if config.zoom.enabled:
            self.streams[CameraType.ZOOM] = CameraStream(
                stream_type=CameraType.ZOOM,
                rtsp_url=config.streams.get("zoom", ""),
                resolution=tuple(config.zoom.resolution),
                fps=config.zoom.fps,
            )

        if config.thermal.enabled:
            self.streams[CameraType.THERMAL] = CameraStream(
                stream_type=CameraType.THERMAL,
                rtsp_url=config.streams.get("thermal", ""),
                resolution=tuple(config.thermal.resolution),
                fps=config.thermal.fps,
            )

        # Gimbal and telemetry
        self._gimbal_attitude: tuple[float, float, float] = (0.0, 0.0, 0.0)
        self._zoom_level: float = 1.0
        self._laser_distance: Optional[float] = None
        self._location: Optional[GeoLocation] = None

        # Frame sync
        self._frame_id = 0
        self._sync_tolerance_ms = 50  # Max time diff for synchronized frames

        # Callbacks
        self._on_frame_sync: Optional[Callable[[FrameData], None]] = None

        logger.info("H30T camera initialized")

    def set_frame_callback(self, callback: Callable[[FrameData], None]) -> None:
        """Set callback for synchronized frame data."""
        self._on_frame_sync = callback

    async def start(self) -> None:
        """Start all camera streams."""
        logger.info("Starting H30T camera streams")

        for camera_type, stream in self.streams.items():
            stream.start()

        # Start frame synchronization task
        asyncio.create_task(self._frame_sync_loop())

    async def stop(self) -> None:
        """Stop all camera streams."""
        for stream in self.streams.values():
            stream.stop()
        logger.info("H30T camera stopped")

    async def _frame_sync_loop(self) -> None:
        """Synchronize frames from all camera streams."""
        while True:
            try:
                frame_data = await self._get_synchronized_frame()
                if frame_data and self._on_frame_sync:
                    self._on_frame_sync(frame_data)
            except Exception as e:
                logger.error(f"Frame sync error: {e}")

            await asyncio.sleep(1.0 / 30)  # Target 30 FPS synchronized output

    async def _get_synchronized_frame(self) -> Optional[FrameData]:
        """Get synchronized frames from all cameras."""
        frames: dict[CameraType, tuple[NDArray, datetime]] = {}

        reference_time = None
        for camera_type, stream in self.streams.items():
            result = stream.get_latest_frame()
            if result:
                frame, timestamp = result
                if reference_time is None:
                    reference_time = timestamp

                # Check sync tolerance
                time_diff = abs((timestamp - reference_time).total_seconds() * 1000)
                if time_diff <= self._sync_tolerance_ms:
                    frames[camera_type] = (frame, timestamp)

        if not frames:
            return None

        self._frame_id += 1

        frame_data = FrameData(
            timestamp=reference_time or datetime.now(),
            frame_id=self._frame_id,
            location=self._location,
            gimbal_attitude=self._gimbal_attitude,
            zoom_level=self._zoom_level,
            laser_distance=self._laser_distance,
        )

        if CameraType.WIDE in frames:
            frame_data.wide_image = frames[CameraType.WIDE][0]

        if CameraType.ZOOM in frames:
            frame_data.zoom_image = frames[CameraType.ZOOM][0]

        if CameraType.THERMAL in frames:
            thermal_frame = frames[CameraType.THERMAL][0]
            frame_data.thermal_image = thermal_frame
            # Convert to raw temperatures if needed
            frame_data.thermal_raw = self._decode_thermal_raw(thermal_frame)

        return frame_data

    def _decode_thermal_raw(self, thermal_frame: NDArray) -> NDArray[np.float32]:
        """Decode thermal frame to raw temperature values."""
        # H30T thermal stream provides radiometric data
        # Convert from 14-bit raw to temperature in Celsius
        # This is a simplified conversion - actual H30T uses proprietary format

        if len(thermal_frame.shape) == 3:
            # Convert color to grayscale intensity
            gray = cv2.cvtColor(thermal_frame, cv2.COLOR_BGR2GRAY)
        else:
            gray = thermal_frame

        # Map to temperature range (simplified linear mapping)
        # In production, use DJI SDK for accurate radiometric data
        temp_min, temp_max = self.config.thermal.temperature_range
        normalized = gray.astype(np.float32) / 255.0
        temperatures = normalized * (temp_max - temp_min) + temp_min

        return temperatures

    def set_zoom(self, zoom_level: float) -> None:
        """Set optical zoom level (5x - 200x)."""
        zoom_level = max(5.0, min(200.0, zoom_level))
        self._zoom_level = zoom_level
        logger.debug(f"Zoom set to: {zoom_level}x")

    def set_thermal_palette(self, palette: str) -> None:
        """Set thermal color palette."""
        valid_palettes = ["white_hot", "black_hot", "ironbow", "rainbow", "lava"]
        if palette not in valid_palettes:
            logger.warning(f"Invalid palette: {palette}")
            return
        logger.debug(f"Thermal palette: {palette}")

    def update_telemetry(
        self,
        location: Optional[GeoLocation] = None,
        gimbal: Optional[tuple[float, float, float]] = None,
        laser_distance: Optional[float] = None,
    ) -> None:
        """Update telemetry data."""
        if location:
            self._location = location
        if gimbal:
            self._gimbal_attitude = gimbal
        if laser_distance is not None:
            self._laser_distance = laser_distance

    def capture_still(self, camera: CameraType = CameraType.WIDE) -> Optional[NDArray]:
        """Capture a still image from specified camera."""
        if camera not in self.streams:
            return None

        result = self.streams[camera].get_latest_frame()
        if result:
            return result[0].copy()
        return None

    def get_stream_stats(self) -> dict[str, StreamStats]:
        """Get statistics for all streams."""
        return {
            camera_type.value: stream.stats
            for camera_type, stream in self.streams.items()
        }


class H30TThermalProcessor:
    """
    Advanced thermal data processor for DJI H30T radiometric thermal sensor.

    The H30T thermal camera provides radiometric data with temperature accuracy
    of ±2°C or ±2%. This processor handles:
    - Raw thermal data parsing from H30T proprietary format
    - Temperature extraction and calibration
    - Emissivity corrections
    - Hot spot detection with configurable thresholds
    - Temperature map alignment with visual frames

    Thermal Specifications (H30T):
    - Resolution: 640x512 px
    - FOV: 40.6° × 32.5°
    - Sensitivity: ≤30mK @ f/1.0
    - Temperature Range: -40°C to +550°C
    - Refresh Rate: 30Hz
    - Emissivity: 0.95 (configurable)
    """

    def __init__(
        self,
        temperature_range: Tuple[float, float] = (-40.0, 550.0),
        emissivity: float = 0.95,
        enable_hotspot_detection: bool = True,
        hotspot_threshold_celsius: float = 15.0,
    ):
        """
        Initialize thermal processor.

        Args:
            temperature_range: Min and max temperature range in Celsius
            emissivity: Surface emissivity (0.0-1.0), default 0.95 for most materials
            enable_hotspot_detection: Enable automatic hotspot detection
            hotspot_threshold_celsius: Temperature difference threshold for hotspots
        """
        self.temperature_range = temperature_range
        self.emissivity = emissivity
        self.enable_hotspot_detection = enable_hotspot_detection
        self.hotspot_threshold = hotspot_threshold_celsius

        # Calibration parameters (would be loaded from camera calibration file)
        self._thermal_offset = 0.0
        self._thermal_gain = 1.0

        # Background temperature for differential analysis
        self._background_temp: Optional[float] = None

        logger.info(
            f"H30T Thermal Processor initialized: "
            f"Range={temperature_range}, Emissivity={emissivity}"
        )

    def parse_radiometric_frame(self, thermal_frame: NDArray) -> NDArray[np.float32]:
        """
        Parse radiometric thermal data from H30T camera stream.

        The H30T embeds 14-bit radiometric data in the thermal stream.
        This method extracts raw temperature values from the encoded format.

        Args:
            thermal_frame: Raw thermal frame from H30T (may be 8-bit or 16-bit)

        Returns:
            Temperature map in Celsius as float32 array
        """
        # Handle different input formats
        if len(thermal_frame.shape) == 3:
            # If RGB/BGR, extract from specific channels
            # DJI often encodes high bits in red, low bits in green
            if thermal_frame.shape[2] == 3:
                high_byte = thermal_frame[:, :, 2].astype(np.uint16)
                low_byte = thermal_frame[:, :, 1].astype(np.uint16)
                raw_values = (high_byte << 8) | low_byte
            else:
                # Fallback to grayscale conversion
                thermal_frame = cv2.cvtColor(thermal_frame, cv2.COLOR_BGR2GRAY)
                raw_values = thermal_frame.astype(np.uint16)
        else:
            raw_values = thermal_frame.astype(np.uint16)

        # Convert raw 14-bit values to temperature
        temperatures = self._raw_to_temperature(raw_values)

        # Apply emissivity correction
        temperatures = self._apply_emissivity_correction(temperatures)

        return temperatures

    def _raw_to_temperature(self, raw_values: NDArray) -> NDArray[np.float32]:
        """
        Convert raw sensor values to temperature in Celsius.

        DJI H30T uses a proprietary radiometric format. This is a simplified
        linear approximation. For production, use DJI Thermal SDK for accurate
        conversion with full calibration data.

        Args:
            raw_values: Raw sensor values (14-bit, 0-16383)

        Returns:
            Temperature values in Celsius
        """
        # Normalize raw values to 0-1 range (14-bit max = 16383)
        max_raw = 16383.0 if raw_values.max() > 255 else 255.0
        normalized = raw_values.astype(np.float32) / max_raw

        # Map to temperature range with calibration
        temp_min, temp_max = self.temperature_range
        temperatures = (
            normalized * (temp_max - temp_min) + temp_min
        ) * self._thermal_gain + self._thermal_offset

        return temperatures.astype(np.float32)

    def _apply_emissivity_correction(
        self,
        temperatures: NDArray[np.float32],
    ) -> NDArray[np.float32]:
        """
        Apply emissivity correction to temperature readings.

        Apparent temperature = True temperature / emissivity^0.25

        Args:
            temperatures: Raw temperature readings

        Returns:
            Emissivity-corrected temperatures
        """
        if self.emissivity < 0.99:
            # Stefan-Boltzmann correction
            corrected = temperatures / (self.emissivity ** 0.25)
            return corrected
        return temperatures

    def extract_temperature_at_point(
        self,
        temp_map: NDArray[np.float32],
        x: int,
        y: int,
        radius: int = 3,
    ) -> Dict[str, float]:
        """
        Extract temperature statistics at a specific point.

        Args:
            temp_map: Temperature map
            x, y: Point coordinates (pixel)
            radius: Radius around point for statistics (pixels)

        Returns:
            Dictionary with min, max, mean, std temperature
        """
        h, w = temp_map.shape

        # Clamp coordinates
        x = max(radius, min(x, w - radius - 1))
        y = max(radius, min(y, h - radius - 1))

        # Extract region
        region = temp_map[y-radius:y+radius+1, x-radius:x+radius+1]

        return {
            "min_temp": float(np.min(region)),
            "max_temp": float(np.max(region)),
            "mean_temp": float(np.mean(region)),
            "std_temp": float(np.std(region)),
            "center_temp": float(temp_map[y, x]),
        }

    def detect_hotspots(
        self,
        temp_map: NDArray[np.float32],
        reference_temp: Optional[float] = None,
        threshold_celsius: Optional[float] = None,
    ) -> List[Dict[str, any]]:
        """
        Detect hot spots in thermal image.

        Args:
            temp_map: Temperature map in Celsius
            reference_temp: Reference/ambient temperature (auto-calculated if None)
            threshold_celsius: Temperature difference threshold (uses default if None)

        Returns:
            List of hotspot dictionaries with location and temperature info
        """
        if not self.enable_hotspot_detection:
            return []

        # Determine reference temperature
        if reference_temp is None:
            # Use 10th percentile as ambient/background
            reference_temp = float(np.percentile(temp_map, 10))
            self._background_temp = reference_temp

        # Determine threshold
        threshold = threshold_celsius or self.hotspot_threshold
        hotspot_threshold = reference_temp + threshold

        # Create hotspot mask
        hotspot_mask = temp_map > hotspot_threshold

        if not np.any(hotspot_mask):
            return []

        # Find connected components (hotspot clusters)
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
            hotspot_mask.astype(np.uint8), connectivity=8
        )

        hotspots = []
        for i in range(1, num_labels):  # Skip background (label 0)
            # Get hotspot region
            mask = labels == i
            area = stats[i, cv2.CC_STAT_AREA]

            # Filter small noise
            if area < 5:  # Minimum 5 pixels
                continue

            # Calculate statistics
            temps = temp_map[mask]
            centroid = centroids[i]

            hotspot = {
                "id": i,
                "centroid": (int(centroid[0]), int(centroid[1])),
                "area_pixels": int(area),
                "min_temp": float(np.min(temps)),
                "max_temp": float(np.max(temps)),
                "mean_temp": float(np.mean(temps)),
                "delta_from_reference": float(np.max(temps) - reference_temp),
                "bbox": (
                    int(stats[i, cv2.CC_STAT_LEFT]),
                    int(stats[i, cv2.CC_STAT_TOP]),
                    int(stats[i, cv2.CC_STAT_WIDTH]),
                    int(stats[i, cv2.CC_STAT_HEIGHT]),
                ),
            }

            hotspots.append(hotspot)

        # Sort by temperature (hottest first)
        hotspots.sort(key=lambda x: x["max_temp"], reverse=True)

        logger.debug(f"Detected {len(hotspots)} hotspots (threshold: {hotspot_threshold:.1f}°C)")

        return hotspots

    def align_thermal_to_visual(
        self,
        thermal_temp_map: NDArray[np.float32],
        target_shape: Tuple[int, int],
        alignment_matrix: Optional[NDArray] = None,
    ) -> NDArray[np.float32]:
        """
        Align thermal temperature map to visual frame coordinates.

        Args:
            thermal_temp_map: Thermal temperature map (640x512)
            target_shape: Target shape (H, W) to match visual frame
            alignment_matrix: Optional 3x3 homography matrix for alignment

        Returns:
            Aligned temperature map in target shape
        """
        if alignment_matrix is not None:
            # Use homography transformation for precise alignment
            aligned = cv2.warpPerspective(
                thermal_temp_map,
                alignment_matrix,
                (target_shape[1], target_shape[0]),
                flags=cv2.INTER_LINEAR,
                borderMode=cv2.BORDER_CONSTANT,
                borderValue=np.nan,
            )
        else:
            # Simple resize (preserves temperature values with interpolation)
            aligned = cv2.resize(
                thermal_temp_map,
                (target_shape[1], target_shape[0]),
                interpolation=cv2.INTER_LINEAR,
            )

        return aligned

    def create_colorized_overlay(
        self,
        temp_map: NDArray[np.float32],
        colormap: int = cv2.COLORMAP_INFERNO,
        normalize: bool = True,
        min_temp: Optional[float] = None,
        max_temp: Optional[float] = None,
    ) -> NDArray[np.uint8]:
        """
        Create colorized visualization of temperature map.

        Args:
            temp_map: Temperature map
            colormap: OpenCV colormap (COLORMAP_INFERNO, COLORMAP_JET, etc.)
            normalize: Auto-normalize to full range
            min_temp: Manual minimum temperature for normalization
            max_temp: Manual maximum temperature for normalization

        Returns:
            Colorized RGB image (uint8)
        """
        # Determine normalization range
        if normalize:
            t_min = min_temp if min_temp is not None else np.nanmin(temp_map)
            t_max = max_temp if max_temp is not None else np.nanmax(temp_map)
        else:
            t_min, t_max = self.temperature_range

        # Normalize to 0-255
        normalized = np.clip(
            (temp_map - t_min) / (t_max - t_min + 1e-6) * 255,
            0, 255
        ).astype(np.uint8)

        # Apply colormap
        colorized = cv2.applyColorMap(normalized, colormap)

        return colorized

    def set_emissivity(self, emissivity: float) -> None:
        """
        Update emissivity correction factor.

        Common emissivity values:
        - Polished metal: 0.05-0.15
        - Oxidized metal: 0.60-0.85
        - Concrete: 0.92-0.95
        - Paint: 0.90-0.96
        - Vegetation: 0.95-0.98
        - Water: 0.95-0.96

        Args:
            emissivity: New emissivity value (0.0-1.0)
        """
        if not 0.0 <= emissivity <= 1.0:
            logger.warning(f"Invalid emissivity {emissivity}, must be 0-1")
            return

        self.emissivity = emissivity
        logger.debug(f"Emissivity updated to {emissivity}")

    def load_calibration(self, calibration_file: str) -> None:
        """
        Load thermal calibration data from file.

        Calibration includes offset, gain, and non-uniformity corrections.

        Args:
            calibration_file: Path to calibration file (JSON or YAML)
        """
        try:
            import json
            with open(calibration_file, 'r') as f:
                calib = json.load(f)

            self._thermal_offset = calib.get("offset", 0.0)
            self._thermal_gain = calib.get("gain", 1.0)

            if "emissivity" in calib:
                self.emissivity = calib["emissivity"]

            logger.info(f"Loaded thermal calibration from {calibration_file}")

        except Exception as e:
            logger.error(f"Failed to load calibration: {e}")


class DJIMSDKBridge:
    """
    Bridge interface for DJI Mobile SDK (MSDK) integration.

    This is a stub implementation for future integration with DJI's Mobile SDK
    or Onboard SDK (OSDK) to access:
    - Aircraft telemetry (GPS, altitude, heading, velocity)
    - Gimbal control (pitch, yaw, roll)
    - Camera control (zoom, focus, exposure)
    - Flight status and diagnostics

    For production deployment, this would integrate with:
    - DJI MSDK 5.x for mobile control
    - DJI Onboard SDK for companion computer integration
    - DJI Pilot 2 API for enterprise features

    Note: DJI SDK integration requires official DJI developer credentials
    and hardware authentication.
    """

    def __init__(self, connection_type: str = "msdk"):
        """
        Initialize DJI SDK bridge.

        Args:
            connection_type: SDK type - "msdk" (mobile), "osdk" (onboard), or "pilot2"
        """
        self.connection_type = connection_type
        self._connected = False
        self._telemetry_callback: Optional[Callable] = None

        # Cached telemetry data
        self._aircraft_location: Optional[GeoLocation] = None
        self._gimbal_attitude: Tuple[float, float, float] = (0.0, 0.0, 0.0)
        self._flight_velocity: Tuple[float, float, float] = (0.0, 0.0, 0.0)
        self._battery_percent: int = 100
        self._flight_mode: str = "UNKNOWN"
        self._signal_quality: int = 0

        logger.info(f"DJI SDK Bridge initialized (stub mode: {connection_type})")
        logger.warning(
            "DJI SDK integration is not implemented. "
            "This is a stub for future MSDK/OSDK integration."
        )

    def connect(self, app_key: Optional[str] = None) -> bool:
        """
        Connect to DJI aircraft.

        Args:
            app_key: DJI application key (required for production)

        Returns:
            True if connected successfully
        """
        logger.info("Attempting DJI SDK connection (stub)...")

        # TODO: Implement actual DJI SDK connection
        # from dji_sdk import Aircraft, connect
        # self._aircraft = Aircraft()
        # self._aircraft.connect(app_key)

        # Stub implementation
        self._connected = False
        logger.warning("DJI SDK not implemented - returning mock connection failure")
        return False

    def disconnect(self) -> None:
        """Disconnect from DJI aircraft."""
        self._connected = False
        logger.info("DJI SDK disconnected")

    def is_connected(self) -> bool:
        """Check if connected to aircraft."""
        return self._connected

    def get_aircraft_location(self) -> Optional[GeoLocation]:
        """
        Get current aircraft GPS location.

        Returns:
            GeoLocation with lat, lon, altitude or None if unavailable
        """
        # TODO: Implement actual telemetry retrieval
        # return self._aircraft.get_location()

        return self._aircraft_location

    def get_gimbal_attitude(self) -> Tuple[float, float, float]:
        """
        Get current gimbal attitude.

        Returns:
            Tuple of (roll, pitch, yaw) in degrees
        """
        # TODO: Implement actual gimbal telemetry
        # return self._aircraft.gimbal.get_attitude()

        return self._gimbal_attitude

    def set_gimbal_attitude(
        self,
        pitch: Optional[float] = None,
        yaw: Optional[float] = None,
        roll: Optional[float] = None,
    ) -> bool:
        """
        Control gimbal attitude.

        Args:
            pitch: Pitch angle in degrees (-90 to 30)
            yaw: Yaw angle in degrees (-180 to 180)
            roll: Roll angle in degrees (usually fixed)

        Returns:
            True if command sent successfully
        """
        if not self._connected:
            logger.warning("Cannot control gimbal - not connected")
            return False

        # TODO: Implement actual gimbal control
        # self._aircraft.gimbal.set_attitude(pitch, yaw, roll)

        logger.debug(f"Gimbal control (stub): pitch={pitch}, yaw={yaw}, roll={roll}")
        return False

    def set_camera_zoom(self, zoom_level: float) -> bool:
        """
        Set camera zoom level.

        Args:
            zoom_level: Zoom level (H30T: 5x - 200x hybrid)

        Returns:
            True if command sent successfully
        """
        if not self._connected:
            logger.warning("Cannot control zoom - not connected")
            return False

        # Validate zoom range for H30T
        zoom_level = max(5.0, min(200.0, zoom_level))

        # TODO: Implement actual zoom control
        # self._aircraft.camera.set_zoom(zoom_level)

        logger.debug(f"Camera zoom control (stub): {zoom_level}x")
        return False

    def get_flight_status(self) -> Dict[str, any]:
        """
        Get comprehensive flight status.

        Returns:
            Dictionary with flight telemetry and status
        """
        # TODO: Implement actual telemetry retrieval

        return {
            "connected": self._connected,
            "location": self._aircraft_location,
            "gimbal_attitude": self._gimbal_attitude,
            "velocity": self._flight_velocity,
            "battery_percent": self._battery_percent,
            "flight_mode": self._flight_mode,
            "signal_quality": self._signal_quality,
            "is_flying": False,
            "altitude_agl": 0.0,
            "heading": 0.0,
        }

    def set_telemetry_callback(self, callback: Callable[[Dict], None]) -> None:
        """
        Register callback for telemetry updates.

        Args:
            callback: Function to call with telemetry data
        """
        self._telemetry_callback = callback
        logger.debug("Telemetry callback registered")

    def enable_virtual_stick_mode(self) -> bool:
        """
        Enable virtual stick control mode for autonomous flight.

        Returns:
            True if enabled successfully
        """
        if not self._connected:
            return False

        # TODO: Implement virtual stick mode
        # self._aircraft.flight_controller.enable_virtual_stick()

        logger.debug("Virtual stick mode (stub)")
        return False


class StreamManager:
    """
    Multi-stream buffer manager for DeepStream pipeline integration.

    Manages frame buffers from multiple H30T camera streams (wide, thermal, zoom)
    and provides synchronized frame pairs for DeepStream inference pipeline.

    Features:
    - Circular buffer management with configurable depth
    - Frame synchronization across multiple streams
    - Reconnection handling for dropped streams
    - Memory-efficient buffer pooling
    - DeepStream-compatible frame format output
    """

    def __init__(
        self,
        buffer_size: int = 10,
        sync_tolerance_ms: float = 50.0,
        enable_buffer_pooling: bool = True,
    ):
        """
        Initialize stream manager.

        Args:
            buffer_size: Maximum frames to buffer per stream
            sync_tolerance_ms: Maximum time difference for frame synchronization
            enable_buffer_pooling: Use memory pooling for reduced allocations
        """
        self.buffer_size = buffer_size
        self.sync_tolerance_ms = sync_tolerance_ms
        self.enable_buffer_pooling = enable_buffer_pooling

        # Frame buffers per stream
        self._buffers: Dict[CameraType, deque] = {
            CameraType.WIDE: deque(maxlen=buffer_size),
            CameraType.ZOOM: deque(maxlen=buffer_size),
            CameraType.THERMAL: deque(maxlen=buffer_size),
        }

        # Stream status tracking
        self._stream_active: Dict[CameraType, bool] = {
            CameraType.WIDE: False,
            CameraType.ZOOM: False,
            CameraType.THERMAL: False,
        }

        # Statistics
        self._frames_received: Dict[CameraType, int] = {
            cam: 0 for cam in CameraType
        }
        self._frames_dropped: Dict[CameraType, int] = {
            cam: 0 for cam in CameraType
        }
        self._sync_successful: int = 0
        self._sync_failed: int = 0

        # Thread safety
        self._lock = threading.Lock()

        # Callbacks
        self._on_sync_frame: Optional[Callable[[FrameData], None]] = None

        logger.info(
            f"StreamManager initialized: buffer_size={buffer_size}, "
            f"sync_tolerance={sync_tolerance_ms}ms"
        )

    def add_frame(
        self,
        camera_type: CameraType,
        frame: NDArray,
        timestamp: datetime,
        metadata: Optional[Dict] = None,
    ) -> None:
        """
        Add frame to stream buffer.

        Args:
            camera_type: Type of camera stream
            frame: Frame data (numpy array)
            timestamp: Frame capture timestamp
            metadata: Optional metadata dictionary
        """
        with self._lock:
            # Check buffer capacity
            if len(self._buffers[camera_type]) >= self.buffer_size:
                self._frames_dropped[camera_type] += 1
                logger.debug(
                    f"{camera_type.value} buffer full, dropping frame "
                    f"(total dropped: {self._frames_dropped[camera_type]})"
                )

            # Add to buffer
            self._buffers[camera_type].append({
                "frame": frame,
                "timestamp": timestamp,
                "metadata": metadata or {},
            })

            self._frames_received[camera_type] += 1
            self._stream_active[camera_type] = True

    def get_synchronized_frames(
        self,
        required_streams: Optional[List[CameraType]] = None,
    ) -> Optional[Dict[CameraType, Tuple[NDArray, datetime]]]:
        """
        Get synchronized frames from multiple streams.

        Args:
            required_streams: List of streams that must be present (None = any available)

        Returns:
            Dictionary mapping camera type to (frame, timestamp) or None if sync fails
        """
        if required_streams is None:
            required_streams = [CameraType.WIDE]  # Wide camera is primary

        with self._lock:
            # Check if required streams have data
            for stream in required_streams:
                if not self._buffers[stream]:
                    return None

            # Use most recent frame from primary stream (wide) as reference
            if not self._buffers[CameraType.WIDE]:
                return None

            reference = self._buffers[CameraType.WIDE][-1]
            ref_timestamp = reference["timestamp"]

            # Find matching frames within sync tolerance
            synced_frames = {CameraType.WIDE: reference}

            for camera_type in [CameraType.ZOOM, CameraType.THERMAL]:
                if not self._buffers[camera_type]:
                    continue

                # Find closest frame within tolerance
                best_match = None
                best_diff = float('inf')

                for entry in self._buffers[camera_type]:
                    time_diff = abs(
                        (entry["timestamp"] - ref_timestamp).total_seconds() * 1000
                    )

                    if time_diff <= self.sync_tolerance_ms and time_diff < best_diff:
                        best_diff = time_diff
                        best_match = entry

                if best_match:
                    synced_frames[camera_type] = best_match

            # Check if all required streams are present
            if all(stream in synced_frames for stream in required_streams):
                self._sync_successful += 1

                # Convert to output format
                result = {
                    cam_type: (entry["frame"], entry["timestamp"])
                    for cam_type, entry in synced_frames.items()
                }

                return result
            else:
                self._sync_failed += 1
                return None

    def get_latest_frame(
        self,
        camera_type: CameraType,
    ) -> Optional[Tuple[NDArray, datetime]]:
        """
        Get the most recent frame from a specific stream.

        Args:
            camera_type: Camera stream to retrieve from

        Returns:
            Tuple of (frame, timestamp) or None if buffer empty
        """
        with self._lock:
            if not self._buffers[camera_type]:
                return None

            entry = self._buffers[camera_type][-1]
            return (entry["frame"], entry["timestamp"])

    def clear_buffers(self, camera_type: Optional[CameraType] = None) -> None:
        """
        Clear frame buffers.

        Args:
            camera_type: Specific camera to clear (None = clear all)
        """
        with self._lock:
            if camera_type:
                self._buffers[camera_type].clear()
                logger.debug(f"Cleared {camera_type.value} buffer")
            else:
                for buffer in self._buffers.values():
                    buffer.clear()
                logger.debug("Cleared all stream buffers")

    def set_sync_callback(self, callback: Callable[[FrameData], None]) -> None:
        """
        Register callback for synchronized frame events.

        Args:
            callback: Function to call with synchronized FrameData
        """
        self._on_sync_frame = callback
        logger.debug("Sync callback registered")

    def is_stream_active(self, camera_type: CameraType) -> bool:
        """
        Check if stream is actively receiving frames.

        Args:
            camera_type: Camera stream to check

        Returns:
            True if stream is active
        """
        return self._stream_active.get(camera_type, False)

    def handle_stream_reconnection(self, camera_type: CameraType) -> None:
        """
        Handle stream reconnection event.

        Clears stale buffers and resets stream state.

        Args:
            camera_type: Camera stream that reconnected
        """
        with self._lock:
            self._buffers[camera_type].clear()
            self._stream_active[camera_type] = True
            logger.info(f"{camera_type.value} stream reconnected, buffer cleared")

    def get_statistics(self) -> Dict[str, any]:
        """
        Get stream manager statistics.

        Returns:
            Dictionary with buffer and sync statistics
        """
        with self._lock:
            return {
                "frames_received": dict(self._frames_received),
                "frames_dropped": dict(self._frames_dropped),
                "sync_successful": self._sync_successful,
                "sync_failed": self._sync_failed,
                "sync_rate": (
                    self._sync_successful / (self._sync_successful + self._sync_failed)
                    if (self._sync_successful + self._sync_failed) > 0
                    else 0.0
                ),
                "buffer_fill": {
                    cam.value: len(self._buffers[cam])
                    for cam in CameraType
                },
                "stream_active": {
                    cam.value: self._stream_active[cam]
                    for cam in CameraType
                },
            }

    def get_buffer_for_deepstream(
        self,
        camera_type: CameraType = CameraType.WIDE,
        max_frames: int = 1,
    ) -> List[NDArray]:
        """
        Get frame buffer in DeepStream-compatible format.

        Retrieves frames suitable for batched DeepStream inference.

        Args:
            camera_type: Camera stream to retrieve from
            max_frames: Maximum number of frames to retrieve

        Returns:
            List of frames (numpy arrays)
        """
        with self._lock:
            buffer = self._buffers[camera_type]

            if not buffer:
                return []

            # Get most recent frames up to max_frames
            num_frames = min(max_frames, len(buffer))
            frames = [buffer[-(i+1)]["frame"] for i in range(num_frames)]

            return list(reversed(frames))  # Return in chronological order
