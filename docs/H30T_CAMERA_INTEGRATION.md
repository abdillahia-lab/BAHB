# DJI H30T Camera Integration for BAHB

## Overview

The DJI H30T camera integration module provides comprehensive support for the DJI H30T multi-sensor payload, enabling real-time power infrastructure inspection with visual, thermal, and zoom cameras.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DJI H30T Camera System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌─────────────┐  ┌────────────┐               │
│  │   Wide     │  │   Thermal   │  │    Zoom    │               │
│  │  4096x2160 │  │   640x512   │  │  1920x1080 │               │
│  │  82.9° FOV │  │  40.6° FOV  │  │  5-200x    │               │
│  └─────┬──────┘  └──────┬──────┘  └─────┬──────┘               │
│        │                 │                │                      │
│        └─────────────────┴────────────────┘                      │
│                          │                                       │
│                    RTSP Streams                                  │
│         rtsp://192.168.42.2:8554/{wide,thermal,zoom}            │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                    BAHB Camera Module                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              H30TCamera (Main Interface)                 │   │
│  │  - Multi-stream RTSP connection with retry logic        │   │
│  │  - Hardware-accelerated decode (NVDEC on Jetson)        │   │
│  │  - Frame synchronization across streams                 │   │
│  │  - Telemetry integration                                │   │
│  └────────┬─────────────────────────────────────────────────┘   │
│           │                                                      │
│  ┌────────▼─────────────────────────────────────────────────┐   │
│  │           H30TThermalProcessor                           │   │
│  │  - Radiometric thermal data parsing                      │   │
│  │  - Temperature extraction (-40°C to +550°C)             │   │
│  │  - Emissivity corrections                                │   │
│  │  - Hot spot detection with clustering                    │   │
│  │  - Thermal-to-visual alignment                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              StreamManager                                │   │
│  │  - Multi-stream buffer management                         │   │
│  │  - Frame synchronization (50ms tolerance)                │   │
│  │  - DeepStream pipeline integration                        │   │
│  │  - Reconnection handling                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            DJIMSDKBridge (Stub)                           │   │
│  │  - Aircraft telemetry (GPS, altitude, heading)           │   │
│  │  - Gimbal control interface                              │   │
│  │  - Camera zoom control                                    │   │
│  │  - Flight status monitoring                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                  DeepStream Pipeline                             │
│  - TensorRT INT8 inference (YOLO26/TAO)                         │
│  - Real-time detection @ 30+ FPS                                 │
│  - Thermal + visual fusion                                       │
└──────────────────────────────────────────────────────────────────┘
```

## Components

### 1. H30TCamera

Main camera interface for managing multiple H30T streams.

**Features:**
- Simultaneous wide, thermal, and zoom stream capture
- RTSP connection with automatic retry logic
- Hardware-accelerated video decode (GStreamer + NVDEC)
- Frame synchronization across all sensors
- Telemetry integration (GPS, gimbal, laser rangefinder)

**Example Usage:**

```python
from bahb.camera import H30TCamera
from bahb.core.config import H30TConfig

# Configure camera
config = H30TConfig(
    streams={
        "wide": "rtsp://192.168.42.2:8554/wide",
        "thermal": "rtsp://192.168.42.2:8554/thermal",
        "zoom": "rtsp://192.168.42.2:8554/zoom",
    }
)

# Initialize camera
camera = H30TCamera(config)

# Set frame callback
def on_frame(frame_data):
    print(f"Frame {frame_data.frame_id}: "
          f"Wide={frame_data.wide_image is not None}, "
          f"Thermal={frame_data.thermal_image is not None}")

camera.set_frame_callback(on_frame)

# Start streaming
await camera.start()

# Update telemetry
camera.update_telemetry(
    location=GeoLocation(lat=37.7749, lon=-122.4194, altitude=100.0),
    gimbal=(0.0, -90.0, 0.0),  # roll, pitch, yaw
    laser_distance=45.2,  # meters
)

# Control camera
camera.set_zoom(50.0)  # 50x zoom
camera.set_thermal_palette("ironbow")

# Get statistics
stats = camera.get_stream_stats()
for stream_name, stream_stats in stats.items():
    print(f"{stream_name}: {stream_stats.avg_fps:.1f} FPS, "
          f"{stream_stats.frames_dropped} dropped")
```

### 2. H30TThermalProcessor

Advanced thermal data processor for radiometric analysis.

**Features:**
- Radiometric thermal data parsing from H30T proprietary format
- Temperature extraction with ±2°C accuracy
- Configurable emissivity correction (0.0-1.0)
- Automatic hot spot detection with clustering
- Temperature map alignment with visual frames
- Multiple colormap visualizations

**Thermal Specifications:**
- Resolution: 640×512 pixels
- FOV: 40.6° × 32.5°
- Temperature Range: -40°C to +550°C
- Sensitivity: ≤30mK @ f/1.0
- Refresh Rate: 30Hz

**Example Usage:**

```python
from bahb.camera import H30TThermalProcessor

# Initialize processor
thermal_processor = H30TThermalProcessor(
    temperature_range=(-40.0, 550.0),
    emissivity=0.95,  # Standard for most materials
    enable_hotspot_detection=True,
    hotspot_threshold_celsius=15.0,
)

# Parse thermal frame from camera
temp_map = thermal_processor.parse_radiometric_frame(thermal_frame)

# Detect hotspots
hotspots = thermal_processor.detect_hotspots(
    temp_map,
    reference_temp=25.0,  # Ambient temperature
)

for hotspot in hotspots:
    print(f"Hotspot at {hotspot['centroid']}: "
          f"{hotspot['max_temp']:.1f}°C "
          f"(Δ={hotspot['delta_from_reference']:.1f}°C)")

# Extract point temperature
point_temp = thermal_processor.extract_temperature_at_point(
    temp_map, x=320, y=256, radius=5
)
print(f"Center: {point_temp['mean_temp']:.1f}°C ± {point_temp['std_temp']:.1f}°C")

# Align thermal to visual frame
aligned_temp = thermal_processor.align_thermal_to_visual(
    temp_map,
    target_shape=(1080, 1920),  # Match wide camera resolution
)

# Create colorized visualization
colorized = thermal_processor.create_colorized_overlay(
    aligned_temp,
    colormap=cv2.COLORMAP_INFERNO,
    normalize=True,
)

# Adjust emissivity for different materials
thermal_processor.set_emissivity(0.85)  # Oxidized metal
thermal_processor.set_emissivity(0.95)  # Concrete
```

**Common Emissivity Values:**
- Polished metal: 0.05 - 0.15
- Oxidized metal: 0.60 - 0.85
- Concrete: 0.92 - 0.95
- Paint: 0.90 - 0.96
- Vegetation: 0.95 - 0.98
- Water: 0.95 - 0.96

### 3. StreamManager

Multi-stream buffer manager for DeepStream integration.

**Features:**
- Circular buffer management for all streams
- Frame synchronization with configurable tolerance
- Memory-efficient buffer pooling
- Stream reconnection handling
- DeepStream-compatible output format
- Comprehensive statistics tracking

**Example Usage:**

```python
from bahb.camera import StreamManager
from bahb.core.types import CameraType

# Initialize stream manager
stream_manager = StreamManager(
    buffer_size=10,
    sync_tolerance_ms=50.0,
    enable_buffer_pooling=True,
)

# Add frames from different streams
stream_manager.add_frame(
    CameraType.WIDE,
    wide_frame,
    timestamp,
    metadata={"exposure": 1/1000}
)

stream_manager.add_frame(
    CameraType.THERMAL,
    thermal_frame,
    timestamp,
)

# Get synchronized frames
synced_frames = stream_manager.get_synchronized_frames(
    required_streams=[CameraType.WIDE, CameraType.THERMAL]
)

if synced_frames:
    wide_frame, wide_time = synced_frames[CameraType.WIDE]
    thermal_frame, thermal_time = synced_frames[CameraType.THERMAL]
    print(f"Synced frames with Δt={(thermal_time - wide_time).total_seconds() * 1000:.1f}ms")

# Get frames for DeepStream batched inference
batch = stream_manager.get_buffer_for_deepstream(
    camera_type=CameraType.WIDE,
    max_frames=4,  # Batch size
)

# Get statistics
stats = stream_manager.get_statistics()
print(f"Sync rate: {stats['sync_rate']:.1%}")
print(f"Frames received: {stats['frames_received']}")
print(f"Buffer fill: {stats['buffer_fill']}")
```

### 4. DJIMSDKBridge

Interface for DJI Mobile SDK integration (stub for future implementation).

**Features (Planned):**
- Aircraft telemetry (GPS, altitude, heading, velocity)
- Gimbal control (pitch, yaw, roll)
- Camera control (zoom, focus, exposure)
- Flight status monitoring
- Virtual stick mode for autonomous flight

**Note:** This is currently a stub implementation. Full integration requires:
- DJI MSDK 5.x or Onboard SDK
- DJI developer credentials
- Hardware authentication

**Example Usage:**

```python
from bahb.camera import DJIMSDKBridge

# Initialize bridge
dji_bridge = DJIMSDKBridge(connection_type="msdk")

# Connect to aircraft (requires DJI SDK)
if dji_bridge.connect(app_key="your-dji-app-key"):
    # Get telemetry
    location = dji_bridge.get_aircraft_location()
    gimbal = dji_bridge.get_gimbal_attitude()

    # Control gimbal
    dji_bridge.set_gimbal_attitude(pitch=-90.0, yaw=0.0)

    # Control zoom
    dji_bridge.set_camera_zoom(50.0)

    # Get comprehensive status
    status = dji_bridge.get_flight_status()
    print(f"Battery: {status['battery_percent']}%")
    print(f"Mode: {status['flight_mode']}")
```

## DeepStream Integration

The StreamManager provides seamless integration with NVIDIA DeepStream for real-time inference:

```python
from bahb.integrations.nvidia_metropolis import create_bahb_deepstream_pipeline

# Create DeepStream pipeline
pipeline = create_bahb_deepstream_pipeline()

# Configure for H30T input
pipeline.config.source_uri = "rtsp://192.168.42.2:8554/wide"

# Set thermal stream callback
def process_detections(frame_data):
    # Get thermal data
    thermal_processor = H30TThermalProcessor()
    temp_map = thermal_processor.parse_radiometric_frame(frame_data.thermal_image)

    # Combine with detections
    for detection in frame_data.detections:
        # Extract temperature at detection location
        bbox = detection.bbox
        temp = thermal_processor.extract_temperature_at_point(
            temp_map,
            int(bbox.center[0]),
            int(bbox.center[1])
        )

        if temp['mean_temp'] > 80.0:
            print(f"HOT SPOT: {detection.class_name} at {temp['mean_temp']:.1f}°C")

# Start pipeline
pipeline.start()
```

## Performance Optimization

### Hardware Acceleration

The H30T integration leverages NVIDIA Jetson hardware acceleration:

**GStreamer Pipeline (Optimized for Orin NX):**
```
rtspsrc location=rtsp://192.168.42.2:8554/wide latency=50 !
rtph265depay ! h265parse !
nvv4l2decoder !  # Hardware decode (NVDEC)
nvvidconv !      # Hardware scaling/conversion
video/x-raw, format=BGRx !
appsink
```

**Performance Targets:**
- Wide stream (1920×1080): 30 FPS @ <10ms decode latency
- Thermal stream (640×512): 30 FPS @ <5ms decode latency
- Total power consumption: <8W for all streams
- Memory usage: <2GB for 3 simultaneous streams

### Buffer Tuning

Optimize buffer sizes based on workload:

```python
# Low latency (real-time control)
stream_manager = StreamManager(
    buffer_size=3,
    sync_tolerance_ms=30.0,
)

# High reliability (recording/analysis)
stream_manager = StreamManager(
    buffer_size=30,
    sync_tolerance_ms=100.0,
)
```

## Network Configuration

### H30T Network Setup

The H30T camera creates a network interface at:
- IP: 192.168.42.2
- Gateway: 192.168.42.1
- Netmask: 255.255.255.0

**Configure Jetson/Companion Computer:**

```bash
# Static IP configuration
sudo ip addr add 192.168.42.1/24 dev eth0
sudo ip link set eth0 up

# Test connectivity
ping 192.168.42.2

# Test RTSP streams
ffprobe rtsp://192.168.42.2:8554/wide
```

### Stream URLs

- Wide camera: `rtsp://192.168.42.2:8554/wide`
- Thermal camera: `rtsp://192.168.42.2:8554/thermal`
- Zoom camera: `rtsp://192.168.42.2:8554/zoom`

## Error Handling

### Connection Recovery

The module includes automatic reconnection logic:

```python
camera = H30TCamera(config)

# Automatic retry on connection failure
# - Initial connection: 3 retries @ 1s intervals
# - Stream loss recovery: Infinite retries @ 5s intervals
# - Exponential backoff for persistent failures

# Monitor connection status
stats = camera.get_stream_stats()
if stats['wide'].frames_received == 0:
    print("Wide stream not receiving frames - check connection")
```

### Stream Synchronization

Handle sync failures gracefully:

```python
synced_frames = stream_manager.get_synchronized_frames()

if synced_frames is None:
    # Sync failed - use individual streams
    wide = stream_manager.get_latest_frame(CameraType.WIDE)
    thermal = stream_manager.get_latest_frame(CameraType.THERMAL)
else:
    # Process synchronized data
    process_synced_frames(synced_frames)
```

## Testing

Run the integration example:

```bash
python examples/h30t_integration_example.py
```

This includes:
1. Thermal processing with simulated data
2. Full H30T camera integration (requires hardware)
3. DeepStream pipeline integration
4. Performance benchmarking

## Troubleshooting

### Common Issues

**1. RTSP Connection Fails**
```
Error: Failed to connect to rtsp://192.168.42.2:8554/wide
```
- Check network connectivity: `ping 192.168.42.2`
- Verify H30T is powered on and initialized
- Check firewall rules: `sudo iptables -L`

**2. GStreamer Plugin Missing**
```
Warning: GStreamer failed, falling back to FFmpeg
```
- Install GStreamer plugins: `sudo apt install gstreamer1.0-plugins-bad`
- Install NVIDIA plugins: `/opt/nvidia/deepstream/install.sh`

**3. Low Frame Rate**
```
Wide stream: 5 FPS (expected 30 FPS)
```
- Check network bandwidth: `iftop -i eth0`
- Reduce resolution in config
- Enable hardware decode (GStreamer + NVDEC)

**4. Thermal Data Incorrect**
```
Temperature range: -5°C to 15°C (expected -40°C to 550°C)
```
- Verify emissivity setting matches material
- Load camera calibration file
- Check raw data format (8-bit vs 16-bit)

## References

- [DJI H30T Specifications](https://www.dji.com/h30-series)
- [NVIDIA DeepStream SDK](https://developer.nvidia.com/deepstream-sdk)
- [GStreamer Documentation](https://gstreamer.freedesktop.org/documentation/)
- [BAHB Project Documentation](../README.md)

## License

Copyright © 2026 BAHB Project. All rights reserved.
