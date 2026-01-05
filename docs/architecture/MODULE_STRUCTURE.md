# BAHB Module Structure & Component Organization

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**Status:** APPROVED

---

## Table of Contents

1. [Overview](#overview)
2. [Package Structure](#package-structure)
3. [Core Modules](#core-modules)
4. [AI/ML Modules](#aiml-modules)
5. [Integration Modules](#integration-modules)
6. [Android Application Structure](#android-application-structure)
7. [Module Dependencies](#module-dependencies)
8. [Design Patterns](#design-patterns)

---

## Overview

BAHB follows a **layered architecture** with clear separation of concerns:

- **Presentation Layer:** Android UI, overlay rendering
- **Service Layer:** Business logic, orchestration
- **Processing Layer:** AI inference, thermal analysis
- **Integration Layer:** Camera, streaming, alerts
- **Data Layer:** Configuration, storage, reporting

### Guiding Principles

1. **Low Coupling:** Modules communicate through well-defined interfaces
2. **High Cohesion:** Related functionality grouped together
3. **Dependency Injection:** Configuration-driven component initialization
4. **Interface Segregation:** Small, focused interfaces
5. **Single Responsibility:** Each module has one clear purpose

---

## Package Structure

```
BAHB/
├── bahb/                          # Python backend (Manifold 3)
│   ├── __init__.py
│   ├── main.py                    # CLI entry point
│   │
│   ├── core/                      # Core infrastructure
│   │   ├── __init__.py
│   │   ├── config.py              # Configuration management
│   │   ├── types.py               # Shared data types
│   │   ├── engine.py              # Main orchestration engine
│   │   ├── state.py               # Application state management
│   │   ├── validation.py          # Input validation
│   │   ├── correction.py          # Error correction utilities
│   │   ├── edge_optimization.py   # Performance optimization
│   │   └── ensemble.py            # Model ensemble coordination
│   │
│   ├── camera/                    # Camera integration
│   │   ├── __init__.py
│   │   ├── h30t.py                # DJI H30T camera driver
│   │   └── frame_sync.py          # Multi-stream synchronization
│   │
│   ├── models/                    # AI model implementations
│   │   ├── __init__.py
│   │   ├── base.py                # Base model class
│   │   ├── pipeline.py            # Inference pipeline
│   │   ├── yolov12.py             # YOLOv12 detector
│   │   ├── rf_detr.py             # RF-DETR segmenter
│   │   ├── sam3.py                # SAM3 Nano segmenter
│   │   ├── qwen_vl.py             # Qwen VLM analyzer
│   │   └── validated_pipeline.py  # Validated inference pipeline
│   │
│   ├── thermal/                   # Thermal analysis
│   │   ├── __init__.py
│   │   ├── analyzer.py            # Thermal image analyzer
│   │   └── palette.py             # Color palette mapping
│   │
│   ├── reporting/                 # Report generation
│   │   ├── __init__.py
│   │   ├── generator.py           # Report generator
│   │   └── templates.py           # Report templates
│   │
│   ├── streaming/                 # Real-time streaming
│   │   ├── __init__.py
│   │   ├── webrtc.py              # WebRTC server
│   │   └── recorder.py            # Video recorder
│   │
│   ├── alerts/                    # Alert management
│   │   ├── __init__.py
│   │   └── manager.py             # Alert dispatcher
│   │
│   └── training/                  # Model training utilities
│       ├── __init__.py
│       ├── data.py                # Dataset handling
│       ├── pipeline.py            # Training pipeline
│       └── stages.py              # Training stages
│
├── android/                       # Android app (RC Plus 2)
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       └── java/com/bahb/
│           ├── BAHBApplication.kt
│           ├── dji/               # DJI SDK integration
│           ├── model/             # Data models
│           │   └── BAHBModels.kt
│           ├── service/           # Background services
│           │   └── ManifoldConnection.kt
│           └── ui/                # User interface
│               ├── MainActivity.kt
│               ├── overlay/
│               │   └── DetectionOverlayView.kt
│               ├── adapter/
│               │   └── AnomalyListAdapter.kt
│               └── widget/
│                   └── SystemStatusWidget.kt
│
├── configs/                       # Configuration files
│   └── production.yaml
│
├── scripts/                       # Utility scripts
│   ├── download_models.sh
│   └── setup_manifold3.sh
│
└── docs/                          # Documentation
    └── architecture/
```

---

## Core Modules

### bahb.core.engine

**Purpose:** Main orchestration engine coordinating all system components.

**Key Classes:**

```python
class InspectionEngine:
    """
    Orchestrates the entire inspection workflow.

    Responsibilities:
    - Initialize all subsystems
    - Manage inspection sessions
    - Coordinate frame processing
    - Handle callbacks
    - Generate final reports
    """

    def __init__(config: Config)
    async def initialize() -> bool
    async def start_inspection(...) -> str
    async def stop_inspection(...) -> Path
    async def process_single_image(...) -> InspectionResult
    def get_metrics() -> dict
```

**Dependencies:**
- `bahb.core.config` - Configuration
- `bahb.camera.h30t` - Camera input
- `bahb.models.pipeline` - AI processing
- `bahb.thermal.analyzer` - Thermal analysis
- `bahb.reporting.generator` - Report output

**Design Pattern:** **Facade Pattern** - Provides simplified interface to complex subsystem.

---

### bahb.core.config

**Purpose:** Centralized configuration management using Pydantic.

**Key Classes:**

```python
class Config(BaseSettings):
    """Main configuration with validation."""

    # System
    name: str
    version: str
    data_dir: Path

    # Components
    camera: H30TConfig
    models: ModelsConfig
    thermal: ThermalAnalysisConfig
    optimization: OptimizationConfig

    @classmethod
    def from_yaml(path: Path) -> Config

    def ensure_directories() -> None
```

**Sub-Configurations:**
- `H30TConfig` - Camera settings
- `ModelsConfig` - AI model paths and parameters
- `ThermalAnalysisConfig` - Thermal thresholds
- `OptimizationConfig` - Performance tuning

**Design Pattern:** **Builder Pattern** - Constructs complex configuration objects step-by-step.

---

### bahb.core.types

**Purpose:** Shared type definitions for the entire system.

**Key Types:**

```python
@dataclass
class Detection:
    class_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox
    mask: Optional[NDArray]
    track_id: Optional[int]

@dataclass
class Anomaly:
    id: str
    type: str
    severity: SeverityLevel
    description: str
    detection: Detection
    thermal: Optional[ThermalReading]
    location: Optional[GeoLocation]
    timestamp: datetime
    recommendations: list[str]

@dataclass
class InspectionResult:
    frame_id: int
    timestamp: datetime
    location: Optional[GeoLocation]
    detections: list[Detection]
    anomalies: list[Anomaly]
    thermal_reading: Optional[ThermalReading]
    vlm_description: Optional[str]
    vlm_recommendations: Optional[list[str]]

@dataclass
class FrameData:
    timestamp: datetime
    frame_id: int
    wide_image: Optional[NDArray]
    zoom_image: Optional[NDArray]
    thermal_image: Optional[NDArray]
    thermal_raw: Optional[NDArray]
    location: Optional[GeoLocation]
    gimbal_attitude: Optional[tuple]
```

**Design Pattern:** **Data Transfer Object (DTO)** - Carries data between processes.

---

### bahb.core.edge_optimization

**Purpose:** Runtime optimization for edge AI performance.

**Key Features:**

```python
class EdgeOptimizer:
    """
    Optimizes inference pipeline based on hardware capabilities.

    Features:
    - Adaptive VLM scheduling (skip frames when FPS low)
    - INT8 quantization management
    - CUDA stream coordination
    - Memory budget enforcement
    - NMS-free detection optimization
    """

    def should_run_vlm(frame_count: int, has_critical: bool) -> bool
    def update_metrics(frame_time_ms: float, ...) -> None
    def get_performance_stats() -> dict
```

**Optimizations Implemented:**
- VLM runs every 5th frame normally, 15th frame when FPS < 15
- INT8 quantization for 1.8x speedup
- Stream overlap for 30% throughput boost
- NMS-free detection reduces latency

**Design Pattern:** **Strategy Pattern** - Selects optimization strategies at runtime.

---

## AI/ML Modules

### bahb.models.pipeline

**Purpose:** Unified inference pipeline coordinating all AI models.

**Architecture:**

```python
class InferencePipeline:
    """
    Multi-stage AI inference pipeline.

    Pipeline Stages:
    1. YOLOv12 Detection (fast, all frames)
    2. RF-DETR Segmentation (selective, important objects)
    3. SAM3 Masks (precision, anomaly candidates)
    4. Qwen-VL Analysis (adaptive scheduling)
    5. Anomaly Classification & Severity Assessment
    """

    async def initialize() -> bool
    async def process_frame(frame_data, thermal) -> InspectionResult

    # Internal pipeline stages
    def _filter_important_detections(...)
    def _find_anomaly_candidates(...)
    def _detect_anomalies(...)
    def _assess_severity(...)
```

**Processing Flow:**

```
Frame → [YOLOv12] → Detections
              ↓
        [RF-DETR] → Segmentations (selective)
              ↓
        [SAM3] → Precision Masks (anomalies)
              ↓
        [Qwen-VL] → Natural Language Analysis (adaptive)
              ↓
        [Anomaly Detector] → Classified Anomalies
              ↓
        InspectionResult
```

**Performance Characteristics:**
- **Baseline:** 2ms (YOLO) + 15ms (RF-DETR) + 8ms (SAM3) = 25ms → 40 FPS
- **With VLM (every 5th frame):** Average 35 FPS
- **Adaptive (low FPS mode):** Skips VLM, maintains 40+ FPS

**Design Pattern:** **Chain of Responsibility** - Each model processes and passes to next stage.

---

### bahb.models.base

**Purpose:** Abstract base class for all AI models.

**Interface:**

```python
class BaseModel(ABC):
    """Base class enforcing common model interface."""

    @abstractmethod
    def load() -> bool

    @abstractmethod
    def unload() -> None

    @abstractmethod
    def preprocess(image: NDArray) -> Any

    @abstractmethod
    def forward(inputs: Any) -> Any

    @abstractmethod
    def postprocess(outputs: Any, shape: tuple) -> Any

    def __call__(image: NDArray) -> Any  # Full pipeline with timing
    def warmup() -> None  # Model warmup
```

**Implementations:**
- `YOLOv12Detector`
- `RFDETRSegmenter`
- `SAM3NanoSegmenter`
- `QwenVLAnalyzer`

**Design Pattern:** **Template Method** - Defines skeleton, subclasses implement details.

---

### bahb.models.yolov12

**Purpose:** Fast object detection using YOLOv12.

**Specifications:**
- **Input:** 1280x720 RGB image
- **Output:** List[Detection] with bbox, class, confidence
- **Inference Time:** ~2ms (TensorRT INT8)
- **Classes:** 17 infrastructure classes

**Optimizations:**
- TensorRT engine with INT8 quantization
- NMS-free detection (if model supports)
- Tracking integration (ByteTrack)

---

### bahb.models.qwen_vl

**Purpose:** Visual-language model for contextual analysis.

**Specifications:**
- **Model:** Qwen2.5-VL-3B-AWQ (quantized)
- **Input:** Image + text prompt
- **Output:** Natural language description + recommendations
- **Inference Time:** 50-80ms
- **Context Length:** 4096 tokens

**Prompt Templates:**
- `substation` - Electrical equipment analysis
- `datacenter` - Server/cooling system analysis
- `thermal` - Temperature anomaly interpretation
- `general` - General inspection description

---

## Integration Modules

### bahb.camera.h30t

**Purpose:** Interface to DJI H30T multi-sensor camera.

**Architecture:**

```python
class CameraStream:
    """Individual camera stream handler."""
    def __init__(stream_type: CameraType, rtsp_url: str)
    def connect() -> bool
    def start() -> None
    def stop() -> None
    def get_latest_frame() -> Optional[tuple[NDArray, datetime]]

class H30TCamera:
    """Multi-sensor camera coordinator."""

    streams: dict[CameraType, CameraStream]
    # CameraType: WIDE, ZOOM, THERMAL

    async def start() -> None
    async def stop() -> None
    def set_zoom(level: float) -> None
    def update_telemetry(...) -> None
    def capture_still(camera: CameraType) -> NDArray
```

**Stream Management:**
- GStreamer pipeline for hardware-accelerated decode
- Frame buffering (max 5 frames per stream)
- Automatic synchronization (50ms tolerance)
- Fallback to FFmpeg if GStreamer unavailable

**Design Pattern:** **Adapter Pattern** - Adapts RTSP streams to unified interface.

---

### bahb.streaming.webrtc

**Purpose:** Real-time data streaming to RC Plus 2.

**Protocol:**

```
WebSocket Connection (ws://manifold-ip:8080/ws/inspection)

Messages (Manifold → RC):
{
  "type": "inspection_result",
  "data": {
    "frame_id": 12345,
    "timestamp": "2026-01-05T10:30:15Z",
    "detections": [...],
    "anomalies": [...],
    "thermal": {...}
  }
}

{
  "type": "system_status",
  "data": {
    "fps": 35.2,
    "gpu_memory": 68.5,
    "models_loaded": ["yolov12", "qwen_vl"]
  }
}

Commands (RC → Manifold):
{
  "type": "start_inspection",
  "inspection_type": "substation",
  "site_name": "Main Substation"
}
```

**Design Pattern:** **Observer Pattern** - RC subscribes to Manifold events.

---

### bahb.thermal.analyzer

**Purpose:** Advanced thermal image analysis.

**Key Features:**

```python
class ThermalAnalyzer:
    """
    Thermal analysis with equipment-specific zones.

    Features:
    - Hotspot/coldspot detection
    - Equipment-specific temperature thresholds
    - Gradient analysis
    - Trend tracking
    - Radiometric calibration
    """

    def analyze(thermal_image, roi=None) -> ThermalReading
    def analyze_region(temp_map, bbox, equipment_type) -> dict
    def compare_regions(temp_map, region1, region2) -> dict
    def track_temperature(region_id, temp) -> dict
```

**Temperature Zones:**
- **Transformer:** Normal 20-65°C, Warning 65-85°C, Critical 85-150°C
- **Conductor:** Normal 15-50°C, Warning 50-75°C, Critical 75-120°C
- **Server:** Normal 25-45°C, Warning 45-60°C, Critical 60-85°C

---

### bahb.reporting.generator

**Purpose:** Multi-format inspection report generation.

**Supported Formats:**
- **PDF:** Professional printable reports (WeasyPrint)
- **HTML:** Interactive web reports (Jinja2 templates)
- **JSON:** Machine-readable data export
- **Markdown:** Documentation-friendly format

**Report Sections:**
1. Executive Summary (metrics overview)
2. Severity Breakdown (anomaly categorization)
3. Recommendations (prioritized action items)
4. Anomalies Detail (with images)
5. Thermal Analysis (temperature trends)
6. Detection Summary (object counts)

**Design Pattern:** **Factory Method** - Creates reports based on format.

---

## Android Application Structure

### Package: com.bahb

```
com.bahb/
├── BAHBApplication.kt             # Application class, DJI SDK init
│
├── model/                         # Data models
│   └── BAHBModels.kt
│       ├── data class Detection
│       ├── data class Anomaly
│       ├── data class ThermalReading
│       ├── enum class SeverityLevel
│       └── enum class InspectionState
│
├── service/                       # Background services
│   └── ManifoldConnection.kt
│       ├── class ManifoldConnection  # WebSocket client
│       ├── fun connect()
│       ├── fun sendCommand()
│       ├── flow latestDetections
│       ├── flow anomalies
│       └── flow systemStatus
│
└── ui/                            # User interface
    ├── MainActivity.kt            # Main activity
    │   ├── setupDJIWidgets()
    │   ├── observeManifoldData()
    │   ├── toggleInspection()
    │   └── onKeyDown()  # Physical button handling
    │
    ├── overlay/
    │   └── DetectionOverlayView.kt  # Custom view for AI overlay
    │       ├── fun updateDetections(List<Detection>)
    │       ├── fun updateThermal(ThermalReading?)
    │       ├── fun onDraw(Canvas)
    │       └── fun drawBoundingBox()
    │
    ├── adapter/
    │   └── AnomalyListAdapter.kt  # RecyclerView adapter
    │
    └── widget/
        └── SystemStatusWidget.kt  # Status indicators
```

---

## Module Dependencies

### Dependency Graph (Backend)

```
┌─────────────────────────────────────────────────────────────┐
│                    MODULE DEPENDENCIES                       │
└─────────────────────────────────────────────────────────────┘

bahb.main
    └──► bahb.core.engine
            ├──► bahb.core.config
            ├──► bahb.core.types
            ├──► bahb.camera.h30t
            │       └──► bahb.core.config
            ├──► bahb.models.pipeline
            │       ├──► bahb.core.config
            │       ├──► bahb.core.types
            │       ├──► bahb.core.edge_optimization
            │       ├──► bahb.models.yolov12
            │       │       └──► bahb.models.base
            │       ├──► bahb.models.rf_detr
            │       │       └──► bahb.models.base
            │       ├──► bahb.models.sam3
            │       │       └──► bahb.models.base
            │       └──► bahb.models.qwen_vl
            │               └──► bahb.models.base
            ├──► bahb.thermal.analyzer
            │       └──► bahb.core.config
            ├──► bahb.reporting.generator
            │       └──► bahb.core.types
            └──► bahb.streaming.webrtc
                    └──► bahb.core.types

No circular dependencies!
All dependencies flow downward.
Core types are shared, no cross-module coupling.
```

### Interface Dependencies

```
Interfaces (Abstract)            Implementations (Concrete)
─────────────────────            ───────────────────────────

bahb.models.base.BaseModel  ──►  bahb.models.yolov12.YOLOv12Detector
                            ──►  bahb.models.rf_detr.RFDETRSegmenter
                            ──►  bahb.models.sam3.SAM3NanoSegmenter
                            ──►  bahb.models.qwen_vl.QwenVLAnalyzer

bahb.core.types.FrameData   ──►  Used by all processing modules

Callbacks (Type Hints):
  Callable[[List[Detection]], None]  # Detection callback
  Callable[[Anomaly], None]           # Anomaly callback
  Callable[[InspectionResult], None]  # Result callback
```

---

## Design Patterns

### 1. Facade Pattern (bahb.core.engine)

**Problem:** Complex subsystem with many components
**Solution:** Single unified interface (InspectionEngine) hiding complexity

```python
# Instead of:
camera = H30TCamera(config)
pipeline = InferencePipeline(config)
thermal = ThermalAnalyzer(config)
# ... manually coordinate everything

# Use facade:
engine = InspectionEngine(config)
await engine.initialize()
await engine.start_inspection(...)
```

---

### 2. Strategy Pattern (bahb.core.edge_optimization)

**Problem:** Different optimization strategies based on runtime conditions
**Solution:** Selectable algorithms for VLM scheduling, quantization, etc.

```python
class EdgeOptimizer:
    def should_run_vlm(self, frame_count, has_critical):
        if has_critical:
            return True  # Always analyze critical frames

        if self.current_fps < self.vlm_low_fps_threshold:
            # Low FPS strategy: less frequent VLM
            return frame_count % self.vlm_low_fps_interval == 0
        else:
            # Normal strategy: regular VLM
            return frame_count % self.vlm_base_interval == 0
```

---

### 3. Template Method (bahb.models.base)

**Problem:** Common inference pipeline structure, model-specific details
**Solution:** Base class defines template, subclasses implement steps

```python
class BaseModel(ABC):
    def __call__(self, image):
        # Template method
        inputs = self.preprocess(image)      # Step 1 (abstract)
        outputs = self.forward(inputs)       # Step 2 (abstract)
        return self.postprocess(outputs)     # Step 3 (abstract)
```

---

### 4. Observer Pattern (WebSocket Streaming)

**Problem:** RC needs to react to Manifold events
**Solution:** RC subscribes to event stream, receives updates

```kotlin
// RC subscribes
manifoldConnection.inspectionResults.collectLatest { result ->
    detectionOverlay.updateDetections(result.detections)
}
```

---

### 5. Factory Method (Report Generation)

**Problem:** Different report formats require different generators
**Solution:** Factory creates appropriate generator based on format

```python
def generate(format: str):
    if format == "pdf":
        return self._generate_pdf(...)
    elif format == "html":
        return self._generate_html(...)
    elif format == "json":
        return self._generate_json(...)
```

---

### 6. Singleton Pattern (Configuration)

**Problem:** Configuration should be loaded once, shared globally
**Solution:** Config loaded once, accessed throughout application

```python
# Load once
config = load_config("configs/production.yaml")

# Share everywhere
engine = InspectionEngine(config)
camera = H30TCamera(config.camera)
pipeline = InferencePipeline(config.models)
```

---

### 7. Adapter Pattern (Camera Streams)

**Problem:** RTSP streams have different interfaces than our system
**Solution:** Adapter wraps RTSP into common FrameData interface

```python
class H30TCamera:
    def _get_synchronized_frame(self) -> FrameData:
        # Adapt RTSP streams to FrameData
        wide_frame = self.streams[WIDE].get_latest_frame()
        thermal_frame = self.streams[THERMAL].get_latest_frame()

        return FrameData(
            wide_image=wide_frame[0],
            thermal_image=thermal_frame[0],
            # ... map to common interface
        )
```

---

## Module Cohesion Analysis

| Module | Cohesion Type | Score | Notes |
|--------|--------------|-------|-------|
| bahb.core.engine | Functional | HIGH | All functions work toward single goal (orchestration) |
| bahb.core.config | Logical | HIGH | All config-related, but different types |
| bahb.models.pipeline | Sequential | HIGH | Steps in a sequence (detection → segmentation → analysis) |
| bahb.camera.h30t | Communicational | MEDIUM | Operate on same data (camera frames) |
| bahb.thermal.analyzer | Functional | HIGH | Single purpose (thermal analysis) |
| bahb.reporting.generator | Procedural | MEDIUM | Steps in report generation process |

**Target:** Functional or Sequential cohesion (highest quality)

---

## Coupling Analysis

| Relationship | Coupling Type | Score | Mitigation |
|--------------|--------------|-------|------------|
| Engine → Pipeline | Data | LOW | Only passes FrameData, receives InspectionResult |
| Pipeline → Models | Control | MEDIUM | Calls model methods, but through interface |
| Camera → Engine | Stamp | LOW | Callback with FrameData (no internal structure exposed) |
| RC → Manifold | Message | VERY LOW | WebSocket JSON messages only |

**Target:** Data or Stamp coupling (loose, maintainable)

---

## Testing Strategy Per Module

### Unit Testing

```python
# bahb.models.yolov12
def test_yolov12_detection():
    model = YOLOv12Detector(config)
    model.load()

    image = np.zeros((640, 640, 3), dtype=np.uint8)
    detections = model(image)

    assert isinstance(detections, list)
    assert all(isinstance(d, Detection) for d in detections)
```

### Integration Testing

```python
# bahb.core.engine
async def test_inspection_engine_integration():
    config = load_config("configs/test.yaml")
    engine = InspectionEngine(config)

    assert await engine.initialize()

    session_id = await engine.start_inspection(...)
    assert session_id is not None

    await engine.stop_inspection()
```

### End-to-End Testing

```python
# Full pipeline test
async def test_end_to_end_inspection():
    # Start engine
    engine = InspectionEngine(config)
    await engine.initialize()

    # Process test image
    image = cv2.imread("test_data/substation.jpg")
    result = await engine.process_single_image(image)

    # Verify output
    assert len(result.detections) > 0
    assert result.vlm_description is not None
```

---

## Module Extension Guidelines

### Adding a New AI Model

1. **Subclass BaseModel:**
   ```python
   class NewModel(BaseModel):
       def load(self): ...
       def preprocess(self, image): ...
       def forward(self, inputs): ...
       def postprocess(self, outputs): ...
   ```

2. **Add Configuration:**
   ```python
   class NewModelConfig(BaseModel):
       enabled: bool = True
       weights: str = "models/new_model.engine"
   ```

3. **Integrate into Pipeline:**
   ```python
   # In InferencePipeline.__init__
   self.new_model = NewModel(config.new_model) if config.new_model.enabled else None

   # In InferencePipeline.process_frame
   if self.new_model:
       new_output = self.new_model(image)
   ```

4. **Update Dependencies:**
   - Add to `requirements.txt`
   - Document in `MODULE_STRUCTURE.md`
   - Add tests

---

## Conclusion

The BAHB module structure is designed for:

- **Maintainability:** Clear separation, low coupling
- **Extensibility:** Easy to add new models, sensors, outputs
- **Testability:** Each module can be tested independently
- **Performance:** Optimized data flow, minimal overhead
- **Reliability:** Fail-safe design, graceful degradation

All modules follow SOLID principles and use proven design patterns.

---

**Document Status:** APPROVED
**Next Review:** Q2 2026
