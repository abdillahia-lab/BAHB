# BAHB API Contracts & Interface Definitions

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**Status:** APPROVED

---

## Table of Contents

1. [Overview](#overview)
2. [WebSocket API](#websocket-api)
3. [Python Internal APIs](#python-internal-apis)
4. [Android-Manifold Interface](#android-manifold-interface)
5. [DJI SDK Integration](#dji-sdk-integration)
6. [External Integrations](#external-integrations)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)
9. [Versioning Strategy](#versioning-strategy)

---

## Overview

BAHB defines clear API contracts between all system components to ensure:

- **Loose Coupling:** Components interact through well-defined interfaces
- **Type Safety:** Strong typing enforced via Pydantic/Kotlin data classes
- **Backward Compatibility:** Versioned APIs prevent breaking changes
- **Testability:** Mock implementations for isolated testing

### API Categories

| API | Purpose | Protocol | Criticality |
|-----|---------|----------|-------------|
| **WebSocket** | Real-time Manifold ↔ RC communication | JSON over WebSocket | CRITICAL |
| **Python Internal** | Module-to-module interfaces | Python function calls | CRITICAL |
| **DJI MSDK** | Drone/camera control | DJI Proprietary | CRITICAL |
| **MQTT** | Alert distribution | MQTT 3.1.1 | MEDIUM |
| **HTTP/Webhook** | External notifications | HTTPS/JSON | LOW |
| **S3 API** | Cloud storage | S3-compatible | LOW |

---

## WebSocket API

### Connection

**Endpoint:** `ws://{manifold_ip}:8080/ws/inspection`

**Connection Flow:**

```
Client (RC Plus 2)                    Server (Manifold 3)
══════════════════                    ═══════════════════

   [Open WS]
      │
      ├───── CONNECT ws://... ─────────►
      │                                  │
      │                            [Accept]
      │                                  │
      │◄──── system_status ──────────────┤
      │      (every 1 sec)                │
      │                                   │
   [Ready]                             [Ready]
```

---

### Message Types

#### 1. Inspection Result (Server → Client)

**Type:** `inspection_result`
**Frequency:** 30 per second (during active inspection)
**Direction:** Manifold → RC

**Schema:**

```typescript
interface InspectionResultMessage {
  type: "inspection_result";
  timestamp: string;  // ISO 8601 with milliseconds
  data: {
    frame_id: number;
    timestamp: string;
    location?: {
      lat: number;
      lon: number;
      alt: number;
      accuracy: number;
      heading: number;
    };
    detections: Detection[];
    anomalies: Anomaly[];
    thermal?: ThermalReading;
    vlm_description?: string;
    vlm_recommendations?: string[];
    inference_time_ms: number;
  };
}

interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;  // 0.0 - 1.0
  bbox: [number, number, number, number];  // [x1, y1, x2, y2]
  track_id?: number;
}

interface Anomaly {
  id: string;
  type: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  severity_level: number;  // 0-4
  description: string;
  detection: Detection;
  thermal?: ThermalReading;
  location?: GeoLocation;
  timestamp: string;
  recommendations: string[];
}

interface ThermalReading {
  min_temp: number;
  max_temp: number;
  mean_temp: number;
  delta_t: number;
  hotspots: number;
  coldspots: number;
}
```

**Example:**

```json
{
  "type": "inspection_result",
  "timestamp": "2026-01-05T10:30:15.234Z",
  "data": {
    "frame_id": 12345,
    "timestamp": "2026-01-05T10:30:15.234Z",
    "location": {
      "lat": 37.7749,
      "lon": -122.4194,
      "alt": 50.0,
      "accuracy": 0.5,
      "heading": 90.0
    },
    "detections": [
      {
        "class_id": 0,
        "class_name": "transformer",
        "confidence": 0.95,
        "bbox": [100, 200, 300, 400],
        "track_id": 42
      }
    ],
    "anomalies": [
      {
        "id": "a1b2c3d4",
        "type": "thermal_anomaly",
        "severity": "HIGH",
        "severity_level": 3,
        "description": "Thermal hotspot detected near transformer. Max temperature: 95.3°C",
        "detection": { /* ... */ },
        "thermal": {
          "min_temp": 22.5,
          "max_temp": 95.3,
          "mean_temp": 45.2,
          "delta_t": 72.8,
          "hotspots": 3,
          "coldspots": 0
        },
        "timestamp": "2026-01-05T10:30:15.234Z",
        "recommendations": [
          "Verify temperature readings with handheld thermal camera",
          "Check for loose connections or internal faults",
          "Schedule maintenance based on temperature trend"
        ]
      }
    ],
    "thermal": {
      "min_temp": 20.0,
      "max_temp": 95.3,
      "mean_temp": 35.5,
      "delta_t": 75.3,
      "hotspots": 5,
      "coldspots": 1
    },
    "vlm_description": "The transformer shows elevated temperature readings, particularly in the upper left bushing. Insulation appears intact but thermal signature suggests potential internal resistance.",
    "vlm_recommendations": [
      "Schedule thermographic inspection during peak load",
      "Review recent load history and maintenance records"
    ],
    "inference_time_ms": 68.5
  }
}
```

---

#### 2. System Status (Server → Client)

**Type:** `system_status`
**Frequency:** 1 per second
**Direction:** Manifold → RC

**Schema:**

```typescript
interface SystemStatusMessage {
  type: "system_status";
  timestamp: string;
  data: {
    fps: number;
    gpu_memory: number;  // percentage (0-100)
    cpu_usage: number;   // percentage
    temperature: number; // °C
    models_loaded: string[];
    camera_status: {
      wide: "connected" | "disconnected" | "error";
      zoom: "connected" | "disconnected" | "error";
      thermal: "connected" | "disconnected" | "error";
    };
    session_active: boolean;
    session_id?: string;
  };
}
```

**Example:**

```json
{
  "type": "system_status",
  "timestamp": "2026-01-05T10:30:15.234Z",
  "data": {
    "fps": 35.2,
    "gpu_memory": 68.5,
    "cpu_usage": 45.0,
    "temperature": 62.0,
    "models_loaded": ["yolov12", "rf_detr", "sam3", "qwen_vl"],
    "camera_status": {
      "wide": "connected",
      "zoom": "connected",
      "thermal": "connected"
    },
    "session_active": true,
    "session_id": "a1b2c3d4"
  }
}
```

---

#### 3. Alert (Server → Client)

**Type:** `alert`
**Frequency:** On event
**Direction:** Manifold → RC

**Schema:**

```typescript
interface AlertMessage {
  type: "alert";
  timestamp: string;
  level: number;  // SeverityLevel (0=INFO, 4=CRITICAL)
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  anomaly_id?: string;  // Reference to anomaly that triggered alert
  action_required: boolean;
  auto_response?: "RTH" | "LAND" | "HOVER";  // Automatic drone action
}
```

**Example:**

```json
{
  "type": "alert",
  "timestamp": "2026-01-05T10:30:15.234Z",
  "level": 4,
  "severity": "CRITICAL",
  "message": "Critical thermal anomaly detected: Transformer temperature 105°C exceeds safety threshold",
  "anomaly_id": "a1b2c3d4",
  "action_required": true,
  "auto_response": "HOVER"
}
```

---

#### 4. Start Inspection Command (Client → Server)

**Type:** `start_inspection`
**Direction:** RC → Manifold

**Schema:**

```typescript
interface StartInspectionCommand {
  type: "start_inspection";
  timestamp: string;
  inspection_type: "substation" | "datacenter" | "transmission" | "solar" | "wind";
  site_name: string;
  pilot_id?: string;
  notes?: string;
}
```

**Example:**

```json
{
  "type": "start_inspection",
  "timestamp": "2026-01-05T10:30:15.234Z",
  "inspection_type": "substation",
  "site_name": "Main Substation #7",
  "pilot_id": "operator-john",
  "notes": "Routine monthly inspection"
}
```

**Response:**

```json
{
  "type": "inspection_started",
  "timestamp": "2026-01-05T10:30:15.456Z",
  "session_id": "a1b2c3d4",
  "status": "active"
}
```

---

#### 5. Stop Inspection Command (Client → Server)

**Type:** `stop_inspection`
**Direction:** RC → Manifold

**Schema:**

```typescript
interface StopInspectionCommand {
  type: "stop_inspection";
  timestamp: string;
  generate_report?: boolean;  // default: true
}
```

**Response:**

```json
{
  "type": "inspection_stopped",
  "timestamp": "2026-01-05T10:35:20.123Z",
  "session_id": "a1b2c3d4",
  "total_frames": 9000,
  "total_anomalies": 5,
  "report_path": "/data/bahb/reports/a1b2c3d4_report.pdf"
}
```

---

#### 6. Capture Snapshot Command (Client → Server)

**Type:** `capture_snapshot`
**Direction:** RC → Manifold

**Schema:**

```typescript
interface CaptureSnapshotCommand {
  type: "capture_snapshot";
  timestamp: string;
  include_thermal?: boolean;  // default: true
  annotation?: string;
}
```

**Response:**

```json
{
  "type": "snapshot_captured",
  "timestamp": "2026-01-05T10:30:15.789Z",
  "frame_id": 12345,
  "image_paths": [
    "/data/bahb/inspections/a1b2c3d4/frames/frame_12345.jpg",
    "/data/bahb/inspections/a1b2c3d4/frames/frame_12345_thermal.jpg"
  ]
}
```

---

#### 7. Configuration Update (Client → Server)

**Type:** `update_config`
**Direction:** RC → Manifold

**Schema:**

```typescript
interface UpdateConfigCommand {
  type: "update_config";
  timestamp: string;
  config: {
    thermal_overlay?: boolean;
    vlm_enabled?: boolean;
    detection_confidence?: number;  // 0.0 - 1.0
    thermal_threshold?: number;  // °C
  };
}
```

---

### Error Responses

All error responses follow this format:

```json
{
  "type": "error",
  "timestamp": "2026-01-05T10:30:15.234Z",
  "error_code": "ERR_INVALID_COMMAND",
  "message": "Invalid inspection type: 'factory'",
  "details": {
    "allowed_types": ["substation", "datacenter", "transmission", "solar", "wind"]
  }
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `ERR_INVALID_COMMAND` | Unknown command type |
| `ERR_MISSING_FIELD` | Required field missing |
| `ERR_INVALID_VALUE` | Field value out of range |
| `ERR_NOT_READY` | System not initialized |
| `ERR_SESSION_ACTIVE` | Session already running |
| `ERR_NO_SESSION` | No active session |
| `ERR_CAMERA_DISCONNECTED` | Camera not available |
| `ERR_MODEL_FAILED` | AI model inference error |
| `ERR_INTERNAL` | Internal server error |

---

## Python Internal APIs

### Core Engine Interface

```python
class InspectionEngine:
    """Main orchestration engine."""

    def __init__(self, config: Config) -> None:
        """Initialize with configuration."""

    async def initialize(self) -> bool:
        """
        Initialize all subsystems.

        Returns:
            True if successful, False otherwise
        """

    async def start_inspection(
        self,
        inspection_type: InspectionType = InspectionType.SUBSTATION,
        site_name: str = "",
        pilot_id: str = "",
    ) -> str:
        """
        Start new inspection session.

        Args:
            inspection_type: Type of infrastructure
            site_name: Site identifier
            pilot_id: Operator identifier

        Returns:
            Session ID (8-character hex)

        Raises:
            RuntimeError: If engine not initialized or session already active
        """

    async def stop_inspection(
        self,
        generate_report: bool = True
    ) -> Optional[Path]:
        """
        Stop current inspection session.

        Args:
            generate_report: Whether to generate final report

        Returns:
            Path to report file if generated, None otherwise
        """

    async def process_single_image(
        self,
        image: NDArray,
        thermal_image: Optional[NDArray] = None,
        location: Optional[GeoLocation] = None,
    ) -> InspectionResult:
        """
        Process single image (for testing or batch processing).

        Args:
            image: RGB/BGR image (H x W x 3)
            thermal_image: Optional thermal image
            location: Optional GPS location

        Returns:
            InspectionResult with detections and anomalies
        """

    def set_callbacks(
        self,
        on_detection: Optional[Callable[[list[Detection]], None]] = None,
        on_anomaly: Optional[Callable[[Anomaly], None]] = None,
        on_result: Optional[Callable[[InspectionResult], None]] = None,
        on_frame: Optional[Callable[[FrameData], None]] = None,
    ) -> None:
        """Set event callbacks."""

    def get_metrics(self) -> dict:
        """Get current engine metrics."""

    async def shutdown(self) -> None:
        """Shutdown engine and release resources."""
```

---

### AI Model Interface

```python
class BaseModel(ABC):
    """Abstract base class for all AI models."""

    def __init__(
        self,
        model_path: str | Path,
        device: str = "cuda:0",
        half_precision: bool = True,
    ):
        """Initialize model configuration."""

    @abstractmethod
    def load(self) -> bool:
        """
        Load model weights and initialize.

        Returns:
            True if successful, False otherwise
        """

    @abstractmethod
    def unload(self) -> None:
        """Unload model and free resources."""

    @abstractmethod
    def preprocess(self, image: NDArray) -> Any:
        """
        Preprocess image for inference.

        Args:
            image: Input image (H x W x C)

        Returns:
            Preprocessed tensor/array
        """

    @abstractmethod
    def forward(self, inputs: Any) -> Any:
        """
        Run model inference.

        Args:
            inputs: Preprocessed inputs

        Returns:
            Raw model outputs
        """

    @abstractmethod
    def postprocess(self, outputs: Any, original_shape: tuple) -> Any:
        """
        Postprocess model outputs.

        Args:
            outputs: Raw model outputs
            original_shape: (height, width) of original image

        Returns:
            Processed results (detections, masks, etc.)
        """

    def __call__(self, image: NDArray) -> Any:
        """
        Full inference pipeline with timing.

        Args:
            image: Input image

        Returns:
            Postprocessed results
        """

    def warmup(self, input_shape: tuple = (640, 640, 3)) -> None:
        """Warmup model with dummy input."""

    @property
    def is_loaded(self) -> bool:
        """Check if model is loaded."""

    @property
    def avg_inference_time(self) -> float:
        """Get average inference time in ms."""
```

**Implementations:**

- `YOLOv12Detector(BaseModel)` → `list[Detection]`
- `RFDETRSegmenter(BaseModel)` → `tuple[list[Detection], list[Segmentation]]`
- `SAM3NanoSegmenter(BaseModel)` → `list[Mask]`
- `QwenVLAnalyzer(BaseModel)` → `str` (description)

---

### Camera Interface

```python
class H30TCamera:
    """DJI H30T multi-sensor camera controller."""

    def __init__(self, config: H30TConfig):
        """Initialize camera with configuration."""

    def set_frame_callback(
        self,
        callback: Callable[[FrameData], None]
    ) -> None:
        """
        Set callback for synchronized frame data.

        Args:
            callback: Function to call with each synchronized frame
        """

    async def start(self) -> None:
        """Start all camera streams."""

    async def stop(self) -> None:
        """Stop all camera streams."""

    def set_zoom(self, zoom_level: float) -> None:
        """
        Set optical zoom level.

        Args:
            zoom_level: 5.0 to 200.0 (zoom factor)
        """

    def set_thermal_palette(self, palette: str) -> None:
        """
        Set thermal color palette.

        Args:
            palette: "white_hot" | "black_hot" | "ironbow" | "rainbow" | "lava"
        """

    def update_telemetry(
        self,
        location: Optional[GeoLocation] = None,
        gimbal: Optional[tuple[float, float, float]] = None,
        laser_distance: Optional[float] = None,
    ) -> None:
        """Update telemetry data."""

    def capture_still(
        self,
        camera: CameraType = CameraType.WIDE
    ) -> Optional[NDArray]:
        """
        Capture still image from specified camera.

        Args:
            camera: Which camera to capture from

        Returns:
            Image array or None if failed
        """

    def get_stream_stats(self) -> dict[str, StreamStats]:
        """Get statistics for all streams."""
```

---

### Thermal Analyzer Interface

```python
class ThermalAnalyzer:
    """Advanced thermal image analysis."""

    def __init__(self, config: ThermalAnalysisConfig):
        """Initialize with configuration."""

    def analyze(
        self,
        thermal_image: NDArray,
        reference_temp: Optional[float] = None,
        region_of_interest: Optional[BoundingBox] = None,
    ) -> ThermalReading:
        """
        Perform comprehensive thermal analysis.

        Args:
            thermal_image: Raw thermal data (float32 temps) or colorized
            reference_temp: Reference/ambient temperature
            region_of_interest: Optional ROI to focus analysis

        Returns:
            ThermalReading with hotspots, temps, etc.
        """

    def analyze_region(
        self,
        temp_map: NDArray,
        bbox: BoundingBox,
        equipment_type: Optional[str] = None,
    ) -> dict:
        """
        Analyze thermal characteristics of specific region.

        Args:
            temp_map: Full temperature map
            bbox: Bounding box of region
            equipment_type: Type for zone-based analysis

        Returns:
            Analysis dict with min/max/mean/std/status
        """

    def track_temperature(
        self,
        region_id: str,
        temperature: float,
    ) -> dict:
        """
        Track temperature over time for trend analysis.

        Args:
            region_id: Unique identifier for region
            temperature: Current temperature reading

        Returns:
            Trend analysis dict
        """
```

---

### Report Generator Interface

```python
class ReportGenerator:
    """Multi-format inspection report generation."""

    def __init__(
        self,
        template_dir: Optional[Path] = None,
        output_dir: Optional[Path] = None,
    ):
        """Initialize report generator."""

    def generate(
        self,
        session: InspectionSession,
        results: list[InspectionResult],
        format: str = "pdf",
        include_images: bool = True,
        include_thermal: bool = True,
    ) -> Path:
        """
        Generate inspection report.

        Args:
            session: Inspection session metadata
            results: List of inspection results
            format: "pdf" | "html" | "json" | "markdown"
            include_images: Include annotated images
            include_thermal: Include thermal analysis

        Returns:
            Path to generated report

        Raises:
            ValueError: If format not supported
        """
```

---

## Android-Manifold Interface

### ManifoldConnection (Kotlin)

```kotlin
class ManifoldConnection(
    private val host: String = "192.168.42.3",
    private val wsPort: Int = 8080
) {
    // Connection state
    val connectionState: StateFlow<ConnectionState>

    // Data streams
    val inspectionResults: SharedFlow<InspectionResult>
    val anomalies: SharedFlow<Anomaly>
    val systemStatus: StateFlow<SystemStatus?>
    val latestDetections: StateFlow<List<Detection>>
    val latestThermal: StateFlow<ThermalReading?>

    fun connect()
    fun disconnect()
    fun sendCommand(command: ManifoldCommand)

    // Convenience methods
    fun startInspection(type: String, siteName: String)
    fun stopInspection()
    fun captureSnapshot()
    fun toggleThermalOverlay(enabled: Boolean)

    enum class ConnectionState {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
        ERROR
    }
}
```

---

## DJI SDK Integration

### Camera Stream Access

```kotlin
// DJI MSDK v5 camera stream handling
LiveStreamManager.getInstance().availableCameraList.forEach { camera ->
    when (camera.liveStreamSettings.cameraType) {
        CameraType.WIDE -> {
            // Configure wide stream
            camera.liveStreamSettings.applySettings(
                codec = H265,
                resolution = Resolution._4K,
                fps = 30
            )
        }
        CameraType.ZOOM -> {
            // Configure zoom stream
        }
        CameraType.THERMAL -> {
            // Configure thermal stream
        }
    }
}

// Start streaming to Manifold
LiveStreamManager.getInstance().startStream(
    rtspUrl = "rtsp://192.168.42.3:8554/wide"
)
```

### Flight Control

```kotlin
// Access flight controller
val flightController = KeyManager.getInstance().getValue(
    KeyTools.createKey(FlightControllerKey.KeyConnection)
)

// Monitor flight status
KeyManager.getInstance().listen(
    KeyTools.createKey(FlightControllerKey.KeyFlightMode)
) { oldValue, newValue ->
    // Handle flight mode changes
}
```

---

## External Integrations

### MQTT Alert Topic Structure

**Topic Pattern:** `bahb/alerts/{severity}/{site_id}/{anomaly_type}`

**Example:** `bahb/alerts/critical/substation7/thermal_anomaly`

**Payload:**

```json
{
  "timestamp": "2026-01-05T10:30:15.234Z",
  "session_id": "a1b2c3d4",
  "site_name": "Main Substation #7",
  "severity": "CRITICAL",
  "anomaly_id": "x1y2z3",
  "type": "thermal_anomaly",
  "description": "Transformer temperature 105°C exceeds safety threshold",
  "location": {
    "lat": 37.7749,
    "lon": -122.4194
  },
  "recommendations": [
    "Immediate inspection required",
    "Consider load reduction"
  ]
}
```

---

### Webhook Notification

**Endpoint:** Configured in `configs/production.yaml`
**Method:** POST
**Content-Type:** application/json

**Payload:**

```json
{
  "event": "anomaly_detected",
  "timestamp": "2026-01-05T10:30:15.234Z",
  "session_id": "a1b2c3d4",
  "site_name": "Main Substation #7",
  "anomaly": {
    /* ... full Anomaly object ... */
  }
}
```

**Expected Response:**

```json
{
  "received": true,
  "ticket_id": "INC-12345"
}
```

---

### S3 Storage API

**Upload Inspection Data:**

```python
import boto3

s3 = boto3.client('s3',
    endpoint_url='https://s3.example.com',
    aws_access_key_id='...',
    aws_secret_access_key='...'
)

s3.upload_file(
    '/data/bahb/inspections/a1b2c3d4/report.pdf',
    'bahb-inspections',
    'a1b2c3d4/report.pdf'
)
```

---

## Data Models

### Core Types (Shared)

```python
@dataclass
class BoundingBox:
    x1: float
    y1: float
    x2: float
    y2: float

    @property
    def width(self) -> float
    @property
    def height(self) -> float
    @property
    def center(self) -> tuple[float, float]
    @property
    def area(self) -> float

    def to_xyxy(self) -> tuple[float, float, float, float]
    def to_xywh(self) -> tuple[float, float, float, float]


@dataclass
class Detection:
    class_id: int
    class_name: str
    confidence: float  # 0.0 - 1.0
    bbox: BoundingBox
    mask: Optional[NDArray[np.uint8]] = None
    track_id: Optional[int] = None

    def to_dict(self) -> dict


@dataclass
class GeoLocation:
    latitude: float
    longitude: float
    altitude: float  # meters ASL
    accuracy: float = 0.0  # horizontal accuracy (meters)
    heading: float = 0.0  # degrees from north

    def to_dict(self) -> dict


@dataclass
class ThermalReading:
    min_temp: float  # °C
    max_temp: float
    mean_temp: float
    hotspot_locations: list[tuple[int, int]]  # (x, y) pixels
    coldspot_locations: list[tuple[int, int]]
    temperature_map: NDArray[np.float32]  # Full thermal map

    @property
    def delta_t(self) -> float  # Temperature differential

    def to_dict(self) -> dict


class SeverityLevel(Enum):
    INFO = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class Anomaly:
    id: str  # UUID (8 chars)
    type: str
    severity: SeverityLevel
    description: str
    detection: Detection
    thermal: Optional[ThermalReading] = None
    location: Optional[GeoLocation] = None
    timestamp: datetime = field(default_factory=datetime.now)
    image_path: Optional[str] = None
    recommendations: list[str] = field(default_factory=list)

    def to_dict(self) -> dict


@dataclass
class InspectionResult:
    frame_id: int
    timestamp: datetime
    location: Optional[GeoLocation]

    detections: list[Detection] = field(default_factory=list)
    segmentations: list[Segmentation] = field(default_factory=list)
    thermal_reading: Optional[ThermalReading] = None
    anomalies: list[Anomaly] = field(default_factory=list)
    vlm_description: Optional[str] = None
    vlm_recommendations: Optional[list[str]] = None
    inference_time_ms: float = 0.0

    @property
    def has_critical_anomaly(self) -> bool
    @property
    def max_severity(self) -> SeverityLevel

    def to_dict(self) -> dict
```

---

## Error Handling

### Exception Hierarchy

```python
class BAHBException(Exception):
    """Base exception for BAHB system."""
    pass

class ConfigurationError(BAHBException):
    """Configuration invalid or missing."""
    pass

class CameraConnectionError(BAHBException):
    """Camera connection failed."""
    pass

class ModelLoadError(BAHBException):
    """AI model failed to load."""
    pass

class InferenceError(BAHBException):
    """Inference failed."""
    pass

class SessionError(BAHBException):
    """Session management error."""
    pass
```

### Error Propagation

```python
async def start_inspection(...):
    if not self._is_initialized:
        raise SessionError("Engine not initialized. Call initialize() first.")

    if self.session is not None:
        raise SessionError(f"Session already active: {self.session.session_id}")

    try:
        await self.camera.start()
    except Exception as e:
        raise CameraConnectionError(f"Failed to start camera: {e}") from e
```

---

## Versioning Strategy

### API Version Header

All WebSocket messages include version:

```json
{
  "api_version": "1.0",
  "type": "inspection_result",
  "data": { ... }
}
```

### Breaking Changes

- Increment major version (1.0 → 2.0)
- Support both versions for 6 months
- Deprecation warnings in logs

### Non-Breaking Changes

- Increment minor version (1.0 → 1.1)
- Add optional fields only
- Maintain backward compatibility

### Current Version

**API Version:** 1.0
**Introduced:** 2026-01-05
**Status:** STABLE

---

## Testing Contracts

### Unit Test Example

```python
def test_detection_to_dict():
    """Test Detection serialization."""
    det = Detection(
        class_id=0,
        class_name="transformer",
        confidence=0.95,
        bbox=BoundingBox(100, 200, 300, 400),
    )

    result = det.to_dict()

    assert result["class_id"] == 0
    assert result["class_name"] == "transformer"
    assert result["confidence"] == 0.95
    assert result["bbox"] == (100, 200, 300, 400)
```

### Integration Test Example

```python
async def test_websocket_inspection_result():
    """Test WebSocket message parsing."""
    # Simulate server message
    message = json.dumps({
        "type": "inspection_result",
        "timestamp": "2026-01-05T10:30:15.234Z",
        "data": {
            "frame_id": 123,
            "detections": [...],
            "anomalies": []
        }
    })

    # Client parses
    parsed = json.loads(message)
    assert parsed["type"] == "inspection_result"
    assert "data" in parsed
```

---

## Conclusion

All BAHB APIs are:

- **Strongly Typed:** Pydantic/Kotlin data classes enforce types
- **Well Documented:** JSON schemas, examples, error codes
- **Versioned:** Backward compatibility guarantees
- **Testable:** Clear contracts enable mocking
- **Extensible:** Optional fields allow additions

---

**Document Status:** APPROVED
**Next Review:** Q2 2026
