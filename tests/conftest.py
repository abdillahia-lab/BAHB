"""Pytest configuration and shared fixtures for BAHB tests."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Generator
from unittest.mock import MagicMock, Mock

import cv2
import numpy as np
import pytest
from numpy.typing import NDArray


# Test data paths
TEST_DIR = Path(__file__).parent
TEST_DATA_DIR = TEST_DIR / "test_data"
IMAGES_DIR = TEST_DATA_DIR / "images"
THERMAL_DIR = TEST_DATA_DIR / "thermal"
EXPECTED_DIR = TEST_DATA_DIR / "expected"


# ============================================================================
# Directory Fixtures
# ============================================================================


@pytest.fixture(scope="session", autouse=True)
def setup_test_directories():
    """Ensure test data directories exist."""
    TEST_DATA_DIR.mkdir(exist_ok=True)
    IMAGES_DIR.mkdir(exist_ok=True)
    THERMAL_DIR.mkdir(exist_ok=True)
    EXPECTED_DIR.mkdir(exist_ok=True)


@pytest.fixture
def temp_dir() -> Generator[Path, None, None]:
    """Provide a temporary directory for test outputs."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def output_dir(temp_dir: Path) -> Path:
    """Output directory for test artifacts."""
    output = temp_dir / "outputs"
    output.mkdir(exist_ok=True)
    return output


# ============================================================================
# Sample Image Fixtures
# ============================================================================


@pytest.fixture
def sample_image() -> NDArray[np.uint8]:
    """Generate a sample RGB image for testing."""
    # Create a realistic test image (640x640)
    image = np.zeros((640, 640, 3), dtype=np.uint8)

    # Add some gradient for realism
    image[:, :, 0] = np.linspace(0, 255, 640).reshape(1, -1).repeat(640, axis=0)
    image[:, :, 1] = np.linspace(0, 255, 640).reshape(-1, 1).repeat(640, axis=1)
    image[:, :, 2] = 128

    # Add some "objects" (rectangles)
    cv2.rectangle(image, (100, 100), (200, 200), (255, 0, 0), -1)
    cv2.rectangle(image, (300, 300), (450, 450), (0, 255, 0), -1)

    return image


@pytest.fixture
def sample_thermal_image() -> NDArray[np.uint8]:
    """Generate a sample thermal image."""
    # 640x512 thermal image with hot spots
    thermal = np.zeros((512, 640), dtype=np.uint8)

    # Background temperature (ambient ~25°C)
    thermal[:] = 80

    # Hot spots (equipment)
    cv2.circle(thermal, (200, 200), 30, 200, -1)  # Hotspot 1
    cv2.circle(thermal, (400, 300), 25, 180, -1)  # Hotspot 2
    cv2.circle(thermal, (500, 150), 20, 220, -1)  # Critical hotspot

    # Convert to colorized thermal (Ironbow-style)
    thermal_colored = cv2.applyColorMap(thermal, cv2.COLORMAP_INFERNO)

    return thermal_colored


@pytest.fixture
def sample_thermal_raw() -> NDArray[np.float32]:
    """Generate raw temperature data (Celsius)."""
    # 512x640 temperature map
    temps = np.ones((512, 640), dtype=np.float32) * 25.0  # Ambient

    # Hot spots
    cv2.circle(temps, (200, 200), 30, 75.0, -1)  # 75°C
    cv2.circle(temps, (400, 300), 25, 65.0, -1)  # 65°C
    cv2.circle(temps, (500, 150), 20, 95.0, -1)  # 95°C - critical

    return temps


@pytest.fixture
def sample_hires_image() -> NDArray[np.uint8]:
    """Generate a high-resolution sample image (4K)."""
    image = np.zeros((2160, 4096, 3), dtype=np.uint8)
    image[:, :, 0] = 100
    image[:, :, 1] = 150
    image[:, :, 2] = 200

    # Add some infrastructure objects
    cv2.rectangle(image, (500, 500), (1000, 1000), (255, 255, 255), -1)
    cv2.rectangle(image, (2000, 1000), (2500, 1500), (200, 200, 200), -1)

    return image


@pytest.fixture
def batch_images(sample_image: NDArray) -> list[NDArray]:
    """Generate a batch of images for batch processing tests."""
    batch = []
    for i in range(4):
        img = sample_image.copy()
        # Add variation
        img = cv2.add(img, np.uint8(i * 10))
        batch.append(img)
    return batch


# ============================================================================
# Mock Camera Stream Fixtures
# ============================================================================


@pytest.fixture
def mock_rtsp_stream():
    """Mock RTSP camera stream."""
    mock_cap = MagicMock(spec=cv2.VideoCapture)
    mock_cap.isOpened.return_value = True
    mock_cap.read.return_value = (True, np.zeros((1080, 1920, 3), dtype=np.uint8))
    mock_cap.get.return_value = 30.0  # FPS
    return mock_cap


@pytest.fixture
def mock_h30t_streams(sample_image, sample_thermal_image):
    """Mock DJI H30T multi-sensor streams."""
    streams = {
        "wide": MagicMock(),
        "zoom": MagicMock(),
        "thermal": MagicMock(),
    }

    # Configure mock returns
    wide_img = cv2.resize(sample_image, (4096, 2160))
    zoom_img = cv2.resize(sample_image, (3840, 2160))
    thermal_img = sample_thermal_image

    streams["wide"].get_latest_frame.return_value = (wide_img, None)
    streams["zoom"].get_latest_frame.return_value = (zoom_img, None)
    streams["thermal"].get_latest_frame.return_value = (thermal_img, None)

    return streams


# ============================================================================
# Model Fixtures
# ============================================================================


@pytest.fixture
def mock_yolo_model():
    """Mock YOLO detection model."""
    from bahb.core.types import BoundingBox, Detection

    mock = MagicMock()
    mock.is_loaded = True
    mock.load.return_value = True

    # Mock detections
    detections = [
        Detection(
            class_id=0,
            class_name="transformer",
            confidence=0.85,
            bbox=BoundingBox(x1=100, y1=100, x2=300, y2=300),
        ),
        Detection(
            class_id=1,
            class_name="insulator",
            confidence=0.78,
            bbox=BoundingBox(x1=400, y1=200, x2=500, y2=350),
        ),
    ]

    mock.return_value = detections
    mock.__call__.return_value = detections

    return mock


@pytest.fixture
def model_weights_path(temp_dir: Path) -> Path:
    """Create a dummy model weights file."""
    weights = temp_dir / "test_model.pt"
    # Create empty file
    weights.write_bytes(b"")
    return weights


# ============================================================================
# Detection Result Fixtures
# ============================================================================


@pytest.fixture
def sample_detections():
    """Sample detection results."""
    from bahb.core.types import BoundingBox, Detection

    return [
        Detection(
            class_id=0,
            class_name="transformer",
            confidence=0.92,
            bbox=BoundingBox(x1=150, y1=150, x2=350, y2=350),
        ),
        Detection(
            class_id=1,
            class_name="insulator",
            confidence=0.85,
            bbox=BoundingBox(x1=400, y1=200, x2=520, y2=400),
        ),
        Detection(
            class_id=2,
            class_name="conductor",
            confidence=0.78,
            bbox=BoundingBox(x1=100, y1=450, x2=600, y2=500),
        ),
    ]


@pytest.fixture
def expected_detections_json(temp_dir: Path) -> Path:
    """Expected detection results in JSON format."""
    expected = {
        "detections": [
            {
                "class_id": 0,
                "class_name": "transformer",
                "confidence": 0.92,
                "bbox": [150, 150, 350, 350],
            },
            {
                "class_id": 1,
                "class_name": "insulator",
                "confidence": 0.85,
                "bbox": [400, 200, 520, 400],
            },
        ]
    }

    path = temp_dir / "expected_detections.json"
    with open(path, "w") as f:
        json.dump(expected, f)

    return path


# ============================================================================
# Configuration Fixtures
# ============================================================================


@pytest.fixture
def mock_config():
    """Mock BAHB configuration."""
    from unittest.mock import MagicMock

    config = MagicMock()
    config.device = "cpu"  # Use CPU for tests
    config.half_precision = False
    config.confidence_threshold = 0.35
    config.nms_threshold = 0.45
    config.input_size = [640, 640]
    config.batch_size = 1

    return config


@pytest.fixture
def thermal_config():
    """Thermal analyzer configuration."""
    from unittest.mock import MagicMock

    config = MagicMock()
    config.baseline_temp = 25.0
    config.hotspot_threshold = 15.0
    config.critical_threshold = 40.0
    config.cold_spot_threshold = -10.0
    config.zones = {}

    return config


@pytest.fixture
def deepstream_config_path() -> Path:
    """Path to DeepStream configuration file."""
    return Path("/home/user/BAHB/configs/deepstream/ds_pipeline_config.txt")


# ============================================================================
# Video/Stream Fixtures
# ============================================================================


@pytest.fixture
def sample_video(temp_dir: Path, sample_image: NDArray) -> Path:
    """Create a sample video file for testing."""
    video_path = temp_dir / "test_video.mp4"

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(video_path), fourcc, 30.0, (640, 640))

    # Write 30 frames (1 second)
    for i in range(30):
        frame = sample_image.copy()
        # Add frame number
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
    return video_path


# ============================================================================
# Benchmark Fixtures
# ============================================================================


@pytest.fixture
def benchmark_context():
    """Context for performance benchmarking."""
    import time

    class BenchmarkContext:
        def __init__(self):
            self.times = []
            self.start_time = None

        def start(self):
            self.start_time = time.perf_counter()

        def stop(self):
            if self.start_time:
                elapsed = (time.perf_counter() - self.start_time) * 1000
                self.times.append(elapsed)
                self.start_time = None

        @property
        def avg_time_ms(self) -> float:
            return sum(self.times) / len(self.times) if self.times else 0

        @property
        def min_time_ms(self) -> float:
            return min(self.times) if self.times else 0

        @property
        def max_time_ms(self) -> float:
            return max(self.times) if self.times else 0

    return BenchmarkContext()


# ============================================================================
# Test Data Saving Utilities
# ============================================================================


@pytest.fixture
def save_test_artifact():
    """Helper to save test artifacts for debugging."""
    def _save(image: NDArray, name: str, subdir: str = ""):
        """Save image artifact to test_data directory."""
        if subdir:
            save_dir = TEST_DATA_DIR / subdir
        else:
            save_dir = TEST_DATA_DIR

        save_dir.mkdir(exist_ok=True, parents=True)
        path = save_dir / name

        cv2.imwrite(str(path), image)
        return path

    return _save


# ============================================================================
# Pytest Configuration
# ============================================================================


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "gpu: mark test as requiring GPU"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running (> 1 second)"
    )
    config.addinivalue_line(
        "markers", "benchmark: mark test as performance benchmark"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )


def pytest_collection_modifyitems(config, items):
    """Auto-mark tests based on their location/name."""
    for item in items:
        # Mark integration tests
        if "integration" in item.nodeid or "test_end_to_end" in item.nodeid:
            item.add_marker(pytest.mark.integration)

        # Mark GPU tests
        if "gpu" in item.nodeid or "tensorrt" in item.nodeid.lower():
            item.add_marker(pytest.mark.gpu)

        # Mark benchmark tests
        if "benchmark" in item.nodeid or "test_benchmark" in item.name:
            item.add_marker(pytest.mark.benchmark)
