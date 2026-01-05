# BAHB Data Flow Architecture

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**Status:** APPROVED

---

## Table of Contents

1. [Overview](#overview)
2. [Data Pipeline Stages](#data-pipeline-stages)
3. [Frame Processing Flow](#frame-processing-flow)
4. [Streaming Architecture](#streaming-architecture)
5. [Data Synchronization](#data-synchronization)
6. [Storage and Persistence](#storage-and-persistence)
7. [Performance Optimization](#performance-optimization)
8. [Error Handling and Recovery](#error-handling-and-recovery)

---

## Overview

The BAHB data flow is optimized for **real-time processing** with **minimal latency**. Data flows through a multi-stage pipeline from camera capture to operator display in under 100ms.

### Key Data Paths

```
PRIMARY PATH (Real-time Inspection):
Camera → Sync → AI Pipeline → Anomaly Detection → WebSocket → Display

SECONDARY PATH (Recording):
Camera → Recorder → Disk Storage

TERTIARY PATH (Reporting):
InspectionResults → Report Generator → PDF/HTML/JSON
```

### Data Flow Characteristics

- **Throughput:** 30+ frames/second
- **Latency:** <100ms end-to-end
- **Data Rate:** ~50 MB/s (multi-camera streams)
- **Processing:** Asynchronous, non-blocking
- **Buffering:** Minimal (5 frames max per stream)

---

## Data Pipeline Stages

### Stage 1: Camera Capture

**Input:** RTSP video streams from H30T camera
**Output:** Raw frame data with timestamps
**Latency:** ~33ms (network + decode)

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAMERA CAPTURE STAGE                        │
└─────────────────────────────────────────────────────────────────┘

H30T Multi-Sensor Camera
│
├─► Wide RGB (4096x2160 @ 30fps, H.265)
│   └─► RTSP: rtsp://192.168.42.2:8554/wide
│
├─► Zoom RGB (3840x2160 @ 30fps, H.265)
│   └─► RTSP: rtsp://192.168.42.2:8554/zoom
│
└─► Thermal IR (640x512 @ 30fps, H.265)
    └─► RTSP: rtsp://192.168.42.2:8554/thermal

                    ▼

        GStreamer Hardware Pipeline
        │
        ├─► H.265 Decoder (nvv4l2decoder)
        ├─► Color Conversion (nvvidconv)
        └─► Format: BGRx → BGR
                    ▼

        Frame Buffer (deque, maxlen=5)
        │
        └─► Output: (NDArray, datetime)
```

**Data Structure:**

```python
# Raw frame from stream
frame: NDArray[np.uint8]  # Shape: (H, W, 3), dtype: uint8
timestamp: datetime       # Frame capture time

# Buffered in CameraStream
frame_buffer: deque[tuple[NDArray, datetime], maxlen=5]
```

**Processing Details:**

1. **RTSP Connection:**
   - Protocol: RTSP/RTP over TCP
   - Codec: H.265 (HEVC)
   - Bitrate: 20 Mbps (configurable)
   - Latency: 50ms (network delay)

2. **Hardware Decoding (Orin NX):**
   - nvv4l2decoder (NVIDIA Video4Linux2 decoder)
   - Zero-copy from GPU memory
   - ~3ms per frame decode

3. **Frame Buffering:**
   - Circular buffer (5 frames)
   - Drop oldest on overflow (backpressure handling)
   - Lock-free for producer thread

---

### Stage 2: Frame Synchronization

**Input:** Asynchronous frames from multiple streams
**Output:** Synchronized FrameData with all sensors
**Latency:** ~2ms (sync + packaging)

```
┌─────────────────────────────────────────────────────────────────┐
│                  FRAME SYNCHRONIZATION STAGE                     │
└─────────────────────────────────────────────────────────────────┘

Wide Stream Buffer      Zoom Stream Buffer      Thermal Stream Buffer
    │                       │                           │
    │ (frame_w, ts_w)       │ (frame_z, ts_z)          │ (frame_t, ts_t)
    │                       │                           │
    └───────────────────────┴───────────────────────────┘
                            │
                     Sync Coordinator
                            │
                    (Check timestamps)
                            │
                    |ts_w - ts_t| < 50ms?
                            │
                    ┌───────┴────────┐
                   YES              NO
                    │                │
                    ▼                ▼
            Package Frame      Drop outlier,
            into FrameData     wait for next
                    │
                    ▼
            Add Telemetry:
            - GPS location
            - Gimbal attitude
            - Zoom level
            - Laser distance
                    │
                    ▼
            Output: FrameData
```

**Data Structure:**

```python
@dataclass
class FrameData:
    timestamp: datetime           # Reference timestamp
    frame_id: int                 # Sequential ID

    # Images (all synchronized)
    wide_image: Optional[NDArray]     # 4096x2160x3
    zoom_image: Optional[NDArray]     # 3840x2160x3
    thermal_image: Optional[NDArray]  # 640x512x3 (colorized)
    thermal_raw: Optional[NDArray]    # 640x512 (float32, °C)

    # Metadata
    location: Optional[GeoLocation]   # GPS coordinates
    gimbal_attitude: Optional[tuple]  # (roll, pitch, yaw)
    zoom_level: float                 # 1.0 - 200.0
    laser_distance: Optional[float]   # meters
```

**Synchronization Algorithm:**

```python
async def _get_synchronized_frame(self) -> Optional[FrameData]:
    """
    Synchronize frames from multiple streams.

    Algorithm:
    1. Get latest frame from each stream
    2. Use first available timestamp as reference
    3. Accept frames within 50ms of reference
    4. Package into FrameData
    5. Increment frame_id
    """

    frames = {}
    reference_time = None

    for camera_type, stream in self.streams.items():
        result = stream.get_latest_frame()
        if result:
            frame, timestamp = result

            if reference_time is None:
                reference_time = timestamp

            time_diff = abs((timestamp - reference_time).total_seconds() * 1000)

            if time_diff <= 50:  # 50ms tolerance
                frames[camera_type] = (frame, timestamp)

    if not frames:
        return None  # No synchronized frames available

    # Package into FrameData
    frame_data = FrameData(
        timestamp=reference_time,
        frame_id=self._frame_id,
        wide_image=frames.get(WIDE, (None, None))[0],
        zoom_image=frames.get(ZOOM, (None, None))[0],
        thermal_image=frames.get(THERMAL, (None, None))[0],
        # ... telemetry
    )

    self._frame_id += 1
    return frame_data
```

---

### Stage 3: AI Processing Pipeline

**Input:** FrameData
**Output:** InspectionResult
**Latency:** 25-75ms (depends on VLM scheduling)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI PROCESSING PIPELINE                        │
└─────────────────────────────────────────────────────────────────┘

FrameData.wide_image (1920x1080, downsampled from 4K)
    │
    │ [Stage 1: Fast Detection]
    ├──► YOLOv12-L (TensorRT INT8)
    │    Input: 1280x720
    │    Latency: ~2ms
    │    Output: List[Detection] (bbox, class, conf)
    │         │
    │         │ [Stage 2: Selective Segmentation]
    │         ├──► Filter Important (transformers, defects)
    │         │    ↓
    │         ├──► RF-DETR Transformer Segmenter
    │         │    Input: 640x640
    │         │    Latency: ~15ms
    │         │    Output: List[Segmentation] (mask, class)
    │         │         │
    │         │         │ [Stage 3: Precision Masks]
    │         │         ├──► Find Anomaly Candidates
    │         │         │    (defects + thermal hotspots)
    │         │         │    ↓
    │         │         ├──► SAM3 Nano
    │         │         │    Input: 1024x1024 + box prompts
    │         │         │    Latency: ~8ms
    │         │         │    Output: High-quality masks
    │         │         │
    │         │         ▼
    │         │    Enhanced Detections with Masks
    │         │
    │         ▼
    │    All Detections
    │
    ├──► [Parallel] Thermal Analysis
    │    │
    │    ├──► ThermalAnalyzer.analyze()
    │    │    Input: thermal_raw (640x512 float32)
    │    │    Latency: ~1ms
    │    │    Output: ThermalReading
    │    │         ├─► min_temp, max_temp, mean_temp
    │    │         ├─► hotspot_locations: List[(x, y)]
    │    │         ├─► coldspot_locations: List[(x, y)]
    │    │         └─► temperature_map: NDArray
    │    │
    │    └──► Equipment-Specific Zone Analysis
    │         For each detection:
    │           - Crop temp_map to bbox
    │           - Compare to zone thresholds
    │           - Assess severity
    │
    ├──► [Stage 4: Anomaly Classification]
    │    │
    │    ├──► Defect-Class Filter
    │    │    (damage, crack, corrosion, hotspot, leak)
    │    │
    │    ├──► Thermal-Based Anomalies
    │    │    (hotspots > threshold, not covered by defects)
    │    │
    │    ├──► Severity Assessment
    │    │    ├─► Base: defect type severity
    │    │    ├─► Adjust: thermal severity
    │    │    └─► Boost: high confidence (>0.9)
    │    │
    │    └──► Generate Recommendations
    │         (per defect type)
    │
    │    Output: List[Anomaly]
    │
    └──► [Stage 5: VLM Analysis] (Adaptive)
         │
         ├──► Check: should_run_vlm(frame_count, has_critical)
         │    ├─► YES if critical anomaly
         │    ├─► YES if frame_count % interval == 0
         │    └─► NO otherwise
         │
         └──► Qwen2.5-VL-3B-AWQ
              Input: Image + Prompt Template
              Latency: ~50ms
              Output: Natural language description + recommendations
                    │
                    ▼
         InspectionResult
         ├─► frame_id, timestamp, location
         ├─► detections: List[Detection]
         ├─► segmentations: List[Segmentation]
         ├─► anomalies: List[Anomaly]
         ├─► thermal_reading: ThermalReading
         ├─► vlm_description: str
         ├─► vlm_recommendations: List[str]
         └─► inference_time_ms: float
```

**Parallel Processing:**

YOLOv12 and Thermal Analysis run **in parallel** using ThreadPoolExecutor:

```python
with ThreadPoolExecutor(max_workers=2) as executor:
    detection_future = executor.submit(yolo, image)
    thermal_future = executor.submit(thermal_analyzer, thermal_image)

    detections = detection_future.result()
    thermal_reading = thermal_future.result()
```

**Data Transformations:**

```
Input Image (4096x2160 RGB)
    ↓ [Resize for YOLO]
1280x720 RGB
    ↓ [Normalize]
1280x720 Float32 [0-1]
    ↓ [To Tensor]
Tensor(1, 3, 720, 1280)
    ↓ [Inference]
Detections: Tensor(1, 25200, 85)
    ↓ [Post-process]
List[Detection(bbox, class_id, conf)]
    ↓ [Scale back to original]
Detection with bbox in (4096x2160) coordinates
```

---

### Stage 4: Result Aggregation

**Input:** InspectionResult from pipeline
**Output:** Callbacks triggered, data stored
**Latency:** <1ms

```
┌─────────────────────────────────────────────────────────────────┐
│                   RESULT AGGREGATION STAGE                       │
└─────────────────────────────────────────────────────────────────┘

InspectionResult
    │
    ├──► Callback: on_detection(detections)
    │    └─► (Optional user callback)
    │
    ├──► Callback: on_anomaly(anomaly)  [for each]
    │    ├─► Alert Manager (if severity >= HIGH)
    │    │   ├─► MQTT Publish
    │    │   ├─► Webhook POST
    │    │   └─► Local Alert (sound/visual)
    │    └─► Log: logger.warning(...)
    │
    ├──► Callback: on_result(result)
    │    └─► WebSocket Broadcast
    │         └─► RC Plus 2 receives JSON
    │
    ├──► Store in Session Results
    │    └─► List[InspectionResult] (max 1000, rolling)
    │
    ├──► Update Metrics
    │    ├─► frame_count++
    │    ├─► anomaly_counts[severity]++
    │    ├─► avg_inference_time (EMA)
    │    └─► fps (rolling average)
    │
    └──► Optional: Video Recording
         └─► Write annotated frame to MP4
```

---

### Stage 5: Display Rendering (RC Plus 2)

**Input:** JSON over WebSocket
**Output:** Visual overlay on FPV display
**Latency:** ~16ms (60 Hz display)

```
┌─────────────────────────────────────────────────────────────────┐
│                   DISPLAY RENDERING (ANDROID)                    │
└─────────────────────────────────────────────────────────────────┘

WebSocket Message
    │
    ├──► Parse JSON
    │    └─► Gson.fromJson(data, InspectionResult::class)
    │
    ├──► Update UI State (Kotlin Flow)
    │    ├─► latestDetections.value = result.detections
    │    ├─► latestThermal.value = result.thermal
    │    └─► anomalies.emit(each anomaly)
    │
    ├──► DetectionOverlayView.updateDetections()
    │    └─► Trigger onDraw() invalidation
    │
    └──► onDraw(canvas: Canvas)
         │
         ├──► For each Detection:
         │    ├─► Draw Bounding Box (color by class)
         │    ├─► Draw Label (class + confidence)
         │    └─► Draw Mask (if available, alpha blend)
         │
         ├──► For each Anomaly:
         │    ├─► Highlight Box (color by severity)
         │    ├─► Draw Severity Badge
         │    └─► Pulse Animation (critical only)
         │
         ├──► Thermal Overlay (if enabled):
         │    ├─► Hotspot Markers (red circles)
         │    ├─► Temperature Labels
         │    └─► Color Gradient Background
         │
         └──► System Info (top-right):
              ├─► FPS
              ├─► Detection Count
              └─► GPU Usage
```

**Rendering Performance:**

- Canvas drawing: ~8ms
- DJI FPV stream: 30 fps (33ms per frame)
- Overlay: 60 fps (16ms per frame)
- Total latency (Manifold → Display): ~25ms

---

## Streaming Architecture

### WebSocket Protocol

**Connection:** `ws://192.168.42.3:8080/ws/inspection`

**Message Types:**

```typescript
// Manifold → RC
interface InspectionResultMessage {
  type: "inspection_result";
  data: {
    frame_id: number;
    timestamp: string;  // ISO 8601
    detections: Detection[];
    anomalies: Anomaly[];
    thermal?: ThermalReading;
    vlm_description?: string;
  }
}

interface SystemStatusMessage {
  type: "system_status";
  data: {
    fps: number;
    gpu_memory: number;  // percentage
    models_loaded: string[];
  }
}

interface AlertMessage {
  type: "alert";
  level: number;  // SeverityLevel value
  message: string;
}

// RC → Manifold
interface StartInspectionCommand {
  type: "start_inspection";
  inspection_type: string;
  site_name: string;
}

interface StopInspectionCommand {
  type: "stop_inspection";
}

interface CaptureSnapshotCommand {
  type: "capture_snapshot";
}
```

**Message Flow:**

```
Manifold (Server)                 RC Plus 2 (Client)
═════════════════                 ══════════════════

[WebSocket Server]                [WebSocket Client]
    │                                     │
    │◄────── ws://.../ CONNECT ───────────┤
    │                                     │
    ├──── {"type":"system_status"} ─────►│
    │         (every 1 second)            │
    │                                     │
    │◄─── {"type":"start_inspection"} ───┤
    │                                     │
    │ [Start processing loop]             │
    │                                     │
    ├─ {"type":"inspection_result"} ────►│
    ├─ {"type":"inspection_result"} ────►│ [Update overlay]
    ├─ {"type":"inspection_result"} ────►│
    │    (30 per second)                  │
    │                                     │
    │ [Anomaly detected!]                 │
    ├──── {"type":"alert"} ──────────────►│ [Haptic feedback]
    │                                     │
    │◄──── {"type":"stop_inspection"} ───┤
    │                                     │
    │ [Stop processing]                   │
    │                                     │
```

---

## Data Synchronization

### Multi-Stream Timestamp Synchronization

**Challenge:** Three camera streams with slightly different timestamps

**Solution:** Reference timestamp + tolerance window

```
Stream     Timestamp (ms)    Delta from Ref    Include?
───────────────────────────────────────────────────────
Wide       1000              0                 ✓
Zoom       1015              +15               ✓ (< 50ms)
Thermal    1008              +8                ✓ (< 50ms)

Reference: 1000ms (first available)
Tolerance: 50ms
Result: All streams synchronized ✓
```

### GPS/IMU Synchronization

**Challenge:** GPS updates at 10 Hz, camera at 30 Hz

**Solution:** Interpolation + caching

```python
class TelemetrySynchronizer:
    def __init__(self):
        self._last_gps: Optional[GeoLocation] = None
        self._gps_timestamp: Optional[datetime] = None

    def get_location_for_frame(self, frame_timestamp: datetime) -> GeoLocation:
        # Use most recent GPS reading
        # (Drone doesn't move significantly in 100ms)
        if self._last_gps and (frame_timestamp - self._gps_timestamp).total_seconds() < 0.5:
            return self._last_gps
        else:
            # Request fresh GPS
            return self._fetch_gps()
```

---

## Storage and Persistence

### Real-Time Buffer (In-Memory)

```
Component              Data Structure          Size      Retention
─────────────────────────────────────────────────────────────────
Camera Frame Buffer    deque[Frame]            5 frames  ~200ms
Sync Frame Queue       asyncio.Queue           30 frames ~1s
Session Results        list[InspectionResult]  1000      Rolling
FPS History           list[float]             30 samples ~1s
Timing History        list[dict]              100 samples ~3s
```

### Persistent Storage (Disk)

```
/data/bahb/
├── inspections/
│   └── {session_id}/
│       ├── metadata.json           # Session info
│       ├── frames/
│       │   ├── frame_00001.jpg
│       │   ├── frame_00001_thermal.jpg
│       │   └── ...
│       ├── detections/
│       │   └── detections.jsonl    # One JSON per line
│       ├── video/
│       │   └── recording.mp4       # H.265 encoded
│       └── report/
│           ├── report.pdf
│           ├── report.html
│           └── report.json
│
├── models/                         # AI model weights
│   ├── yolov12l-inspection.engine
│   ├── rf_detr_large.engine
│   └── ...
│
└── logs/
    └── bahb_YYYYMMDD.log
```

### Data Export

**JSON Lines Format (detections.jsonl):**

```jsonl
{"frame_id": 1, "timestamp": "...", "detections": [...], "anomalies": [...]}
{"frame_id": 2, "timestamp": "...", "detections": [...], "anomalies": [...]}
...
```

**Advantages:**
- Streamable (process one line at a time)
- Append-only (no file rewriting)
- Grep-friendly (filter by timestamp, severity)

---

## Performance Optimization

### Async/Await Pipeline

```python
async def _processing_loop(self):
    """Main processing loop with async I/O."""

    while self._running:
        # Non-blocking frame fetch
        frame_data = await self._wait_for_frame(timeout=0.1)
        if frame_data is None:
            continue

        # CPU-bound processing (runs in executor)
        result = await self.pipeline.process_frame(frame_data, ...)

        # Non-blocking storage
        await self._store_result(result)

        # Non-blocking network I/O
        await self._broadcast_result(result)
```

**Key Optimizations:**

1. **Non-blocking I/O:**
   - Camera capture: separate thread
   - WebSocket: asyncio
   - File writes: executor thread

2. **GPU Batching:**
   - TensorRT processes batches
   - Batch size = 1 for minimal latency

3. **Zero-Copy:**
   - GStreamer → GPU memory (no CPU copy)
   - CUDA streams overlap H2D / Compute / D2H

4. **Adaptive Processing:**
   - Skip VLM when FPS drops
   - Reduce RF-DETR to critical objects only
   - Drop frames if queue full (backpressure)

### Memory Management

```
GPU Memory Budget: 12 GB (of 16 GB total)
─────────────────────────────────────────
Model Weights:
  - YOLOv12:       800 MB
  - RF-DETR:       1.2 GB
  - SAM3 Nano:     150 MB
  - Qwen-VL:       3.5 GB
  Total Models:    5.65 GB

Working Memory:
  - Input buffers:  200 MB
  - Activations:    1.0 GB
  - Output buffers: 100 MB
  Total Working:    1.3 GB

Total Usage:       ~7 GB (58% of budget)
Reserve:           5 GB (for spikes, other processes)
```

---

## Error Handling and Recovery

### Network Interruption

```python
class H30TCamera:
    def _capture_loop(self):
        retry_count = 0
        max_retries = 10

        while self._running:
            try:
                ret, frame = self._capture.read()
                if not ret:
                    retry_count += 1
                    if retry_count > max_retries:
                        logger.error("Stream lost, attempting reconnect...")
                        self.connect()  # Re-establish RTSP
                        retry_count = 0
                    continue

                retry_count = 0  # Reset on success
                self._handle_frame(frame)

            except Exception as e:
                logger.error(f"Capture error: {e}")
                time.sleep(0.1)
```

### Model Inference Failure

```python
async def process_frame(self, frame_data, thermal_data):
    try:
        detections = self.yolo(image) if self.yolo else []
    except Exception as e:
        logger.error(f"YOLO failed: {e}")
        detections = []  # Graceful degradation

    # Continue with empty detections (no crash)
    result = InspectionResult(
        detections=detections,
        # ... other fields
    )
```

### WebSocket Reconnection

```kotlin
class ManifoldConnection {
    private fun scheduleReconnect() {
        scope.launch {
            delay(5000)  // Wait 5 seconds
            if (connectionState.value != CONNECTED) {
                Timber.i("Attempting reconnection...")
                connect()
            }
        }
    }

    override fun onFailure(...) {
        connectionState.value = ERROR
        scheduleReconnect()
    }
}
```

---

## Data Flow Metrics

### Throughput

| Component | Input Rate | Output Rate | Bottleneck |
|-----------|-----------|-------------|------------|
| Camera Capture | 30 fps | 30 fps | Network |
| Frame Sync | 30 fps | 30 fps | CPU (minimal) |
| YOLO Detection | 30 fps | 30 fps | None (500+ fps capable) |
| RF-DETR Segmentation | ~10 fps (selective) | ~10 fps | GPU compute |
| Qwen-VL Analysis | 2-6 fps (adaptive) | 2-6 fps | GPU memory |
| **End-to-End** | **30 fps** | **30 fps** | **Balanced** |

### Latency Breakdown

```
Component                 Latency (ms)    Cumulative
────────────────────────────────────────────────────
Network (RTSP)            30              30
H.265 Decode              3               33
Frame Sync                2               35
YOLOv12                   2               37
RF-DETR (selective)       15              52
SAM3 (anomalies)          8               60
Thermal Analysis          1               61
Qwen-VL (adaptive)        50              111 (when running)
Anomaly Classification    1               62 / 112
Result Packaging          1               63 / 113
WebSocket Transmission    5               68 / 118
RC Display Update         16              84 / 134
────────────────────────────────────────────────────
Total (no VLM):           84ms
Total (with VLM):         134ms
Average (VLM every 5th):  ~94ms
```

**Target:** <100ms average ✓ (meets requirement)

---

## Data Security

### In-Transit

- **WebSocket:** WSS (TLS 1.3) in production
- **RTSP:** IPsec tunnel (optional)
- **MQTT:** TLS + client certificates

### At-Rest

- **Disk Encryption:** LUKS on NVMe SSD
- **Sensitive Data:** GPS coordinates, site names
- **Access Control:** File permissions (600 for sensitive files)

### Data Retention

- **Raw Video:** 30 days (configurable)
- **Reports:** 90 days
- **Logs:** 7 days (rotated)
- **Models:** Permanent

---

## Conclusion

The BAHB data flow architecture is optimized for:

- **Low Latency:** <100ms end-to-end
- **High Throughput:** 30 fps sustained
- **Reliability:** Graceful degradation, auto-recovery
- **Scalability:** Adaptive processing, efficient resource usage

All data paths are non-blocking, error-tolerant, and designed for 24/7 operation in field conditions.

---

**Document Status:** APPROVED
**Next Review:** Q2 2026
