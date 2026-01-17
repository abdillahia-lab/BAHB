# DJI H30T Quick Reference

## Module Import

```python
from bahb.camera import (
    H30TCamera,
    H30TThermalProcessor,
    DJIMSDKBridge,
    StreamManager,
)
from bahb.core.config import H30TConfig
from bahb.core.types import CameraType, FrameData, GeoLocation
```

## Quick Start

### 1. Initialize Camera (30 seconds)

```python
# Configure
config = H30TConfig(
    streams={
        "wide": "rtsp://192.168.42.2:8554/wide",
        "thermal": "rtsp://192.168.42.2:8554/thermal",
        "zoom": "rtsp://192.168.42.2:8554/zoom",
    }
)

# Create camera
camera = H30TCamera(config)

# Set callback
camera.set_frame_callback(lambda frame_data: print(f"Frame {frame_data.frame_id}"))

# Start
await camera.start()
```

### 2. Process Thermal Data

```python
# Initialize processor
thermal = H30TThermalProcessor(
    temperature_range=(-40.0, 550.0),
    emissivity=0.95,
    hotspot_threshold_celsius=15.0,
)

# Parse thermal frame
temp_map = thermal.parse_radiometric_frame(thermal_frame)

# Detect hotspots
hotspots = thermal.detect_hotspots(temp_map, reference_temp=25.0)

# Get temperature at point
point_temp = thermal.extract_temperature_at_point(temp_map, x=320, y=256)
print(f"Temperature: {point_temp['mean_temp']:.1f}°C")
```

### 3. Manage Streams

```python
# Create stream manager
manager = StreamManager(buffer_size=10, sync_tolerance_ms=50.0)

# Add frames
manager.add_frame(CameraType.WIDE, frame, timestamp)
manager.add_frame(CameraType.THERMAL, thermal_frame, timestamp)

# Get synchronized frames
synced = manager.get_synchronized_frames()

# Get frames for DeepStream
batch = manager.get_buffer_for_deepstream(CameraType.WIDE, max_frames=4)
```

## Common Operations

### Camera Control

```python
# Zoom
camera.set_zoom(50.0)  # 50x zoom

# Thermal palette
camera.set_thermal_palette("ironbow")

# Update telemetry
camera.update_telemetry(
    location=GeoLocation(lat=37.7749, lon=-122.4194, altitude=100.0),
    gimbal=(0.0, -90.0, 0.0),
)

# Statistics
stats = camera.get_stream_stats()
```

### Thermal Processing

```python
# Adjust emissivity
thermal.set_emissivity(0.85)  # Oxidized metal

# Align to visual
aligned = thermal.align_thermal_to_visual(temp_map, target_shape=(1080, 1920))

# Colorize
colorized = thermal.create_colorized_overlay(
    temp_map,
    colormap=cv2.COLORMAP_INFERNO,
)

# Load calibration
thermal.load_calibration("calibration.json")
```

### DJI SDK (Stub)

```python
# Initialize bridge
dji = DJIMSDKBridge(connection_type="msdk")

# Connect (stub - not implemented)
dji.connect(app_key="your-key")

# Get telemetry
location = dji.get_aircraft_location()
status = dji.get_flight_status()

# Control
dji.set_gimbal_attitude(pitch=-90.0)
dji.set_camera_zoom(50.0)
```

## Configuration

### Camera Config

```python
config = H30TConfig(
    streams={
        "wide": "rtsp://192.168.42.2:8554/wide",
        "thermal": "rtsp://192.168.42.2:8554/thermal",
        "zoom": "rtsp://192.168.42.2:8554/zoom",
    },
    wide=CameraStreamConfig(
        enabled=True,
        resolution=(1920, 1080),
        fps=30,
    ),
    thermal=ThermalCameraConfig(
        enabled=True,
        resolution=(640, 512),
        fps=30,
        temperature_range=(-40, 550),
        emissivity=0.95,
    ),
)
```

### Thermal Processor Config

```python
processor = H30TThermalProcessor(
    temperature_range=(-40.0, 550.0),
    emissivity=0.95,              # Material emissivity
    enable_hotspot_detection=True,
    hotspot_threshold_celsius=15.0,  # °C above ambient
)
```

### Stream Manager Config

```python
manager = StreamManager(
    buffer_size=10,           # Frames per stream
    sync_tolerance_ms=50.0,   # Max time difference
    enable_buffer_pooling=True,
)
```

## Emissivity Values

| Material | Emissivity |
|----------|-----------|
| Polished metal | 0.05 - 0.15 |
| Oxidized metal | 0.60 - 0.85 |
| Concrete | 0.92 - 0.95 |
| Paint | 0.90 - 0.96 |
| Vegetation | 0.95 - 0.98 |
| Water | 0.95 - 0.96 |

## Stream URLs

```
Wide:    rtsp://192.168.42.2:8554/wide
Thermal: rtsp://192.168.42.2:8554/thermal
Zoom:    rtsp://192.168.42.2:8554/zoom
```

## Network Setup

```bash
# Configure Jetson IP
sudo ip addr add 192.168.42.1/24 dev eth0
sudo ip link set eth0 up

# Test connection
ping 192.168.42.2

# Test streams
ffprobe rtsp://192.168.42.2:8554/wide
```

## Performance Targets (Orin NX)

- Wide stream: 30 FPS @ 1920×1080
- Thermal stream: 30 FPS @ 640×512
- Decode latency: <10ms (wide), <5ms (thermal)
- Power: <8W for 3 streams
- Memory: <2GB

## Error Handling

```python
# Check connection
stats = camera.get_stream_stats()
if stats['wide'].frames_received == 0:
    print("Wide stream not connected")

# Handle sync failure
synced = manager.get_synchronized_frames()
if synced is None:
    # Fall back to individual streams
    wide = manager.get_latest_frame(CameraType.WIDE)
```

## Examples

```bash
# Run example
python examples/h30t_integration_example.py

# Thermal processing only (no hardware required)
python -c "from examples.h30t_integration_example import thermal_processing_example; thermal_processing_example()"
```

## Documentation

- Full guide: `docs/H30T_CAMERA_INTEGRATION.md`
- Code examples: `examples/h30t_integration_example.py`
- Module source: `bahb/camera/h30t.py`

## Support

For issues, see troubleshooting section in `docs/H30T_CAMERA_INTEGRATION.md`
