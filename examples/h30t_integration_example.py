"""
Example usage of DJI H30T camera integration with BAHB.

This example demonstrates:
1. Initializing H30T camera with multi-stream support
2. Processing thermal data with H30TThermalProcessor
3. Managing streams with StreamManager for DeepStream integration
4. DJI SDK bridge for telemetry (stub)
"""

import asyncio
import cv2
import numpy as np
from datetime import datetime
from pathlib import Path

from bahb.camera import (
    H30TCamera,
    H30TThermalProcessor,
    DJIMSDKBridge,
    StreamManager,
)
from bahb.core.config import H30TConfig
from bahb.core.types import CameraType, FrameData, GeoLocation


async def main():
    """Main example function."""

    print("=" * 80)
    print("DJI H30T Camera Integration Example")
    print("=" * 80)

    # 1. Initialize H30T Camera Configuration
    print("\n[1] Initializing H30T Camera...")
    config = H30TConfig(
        streams={
            "wide": "rtsp://192.168.42.2:8554/wide",
            "thermal": "rtsp://192.168.42.2:8554/thermal",
            "zoom": "rtsp://192.168.42.2:8554/zoom",
        }
    )

    camera = H30TCamera(config)

    # 2. Initialize Thermal Processor
    print("[2] Initializing Thermal Processor...")
    thermal_processor = H30TThermalProcessor(
        temperature_range=(-40.0, 550.0),
        emissivity=0.95,  # Standard emissivity for most materials
        enable_hotspot_detection=True,
        hotspot_threshold_celsius=15.0,
    )

    # Set specific emissivity for different materials if needed
    # thermal_processor.set_emissivity(0.85)  # For oxidized metal

    # 3. Initialize Stream Manager for DeepStream
    print("[3] Initializing Stream Manager...")
    stream_manager = StreamManager(
        buffer_size=10,
        sync_tolerance_ms=50.0,
        enable_buffer_pooling=True,
    )

    # 4. Initialize DJI SDK Bridge (stub)
    print("[4] Initializing DJI SDK Bridge...")
    dji_bridge = DJIMSDKBridge(connection_type="msdk")

    # Try to connect (will fail in stub mode)
    if dji_bridge.connect():
        print("   ✓ Connected to DJI aircraft")

        # Get telemetry
        location = dji_bridge.get_aircraft_location()
        gimbal = dji_bridge.get_gimbal_attitude()

        # Control gimbal
        dji_bridge.set_gimbal_attitude(pitch=-90.0, yaw=0.0)

        # Control zoom
        dji_bridge.set_camera_zoom(50.0)
    else:
        print("   ✗ DJI SDK not connected (stub mode)")

    # 5. Set up frame callback
    print("\n[5] Setting up frame processing callback...")

    def on_frame_received(frame_data: FrameData):
        """Process synchronized frame data."""
        print(f"\n   Frame {frame_data.frame_id} @ {frame_data.timestamp}")

        # Process thermal data if available
        if frame_data.thermal_image is not None:
            # Parse radiometric data
            temp_map = thermal_processor.parse_radiometric_frame(
                frame_data.thermal_image
            )

            # Detect hotspots
            hotspots = thermal_processor.detect_hotspots(
                temp_map,
                reference_temp=25.0,  # Ambient temperature
            )

            print(f"   - Thermal: {temp_map.shape}, Range: "
                  f"{temp_map.min():.1f}°C - {temp_map.max():.1f}°C")
            print(f"   - Hotspots detected: {len(hotspots)}")

            for i, hs in enumerate(hotspots[:3], 1):  # Show top 3
                print(f"     {i}. {hs['max_temp']:.1f}°C at "
                      f"{hs['centroid']}, Δ={hs['delta_from_reference']:.1f}°C")

            # Align thermal to visual frame if wide image available
            if frame_data.wide_image is not None:
                aligned_temp = thermal_processor.align_thermal_to_visual(
                    temp_map,
                    target_shape=frame_data.wide_image.shape[:2],
                )

                # Create colorized overlay
                overlay = thermal_processor.create_colorized_overlay(
                    aligned_temp,
                    colormap=cv2.COLORMAP_INFERNO,
                )

                # Save visualization (optional)
                # cv2.imwrite(f"thermal_overlay_{frame_data.frame_id}.jpg", overlay)

        # Add frames to stream manager for DeepStream
        if frame_data.wide_image is not None:
            stream_manager.add_frame(
                CameraType.WIDE,
                frame_data.wide_image,
                frame_data.timestamp,
            )

        if frame_data.thermal_image is not None:
            stream_manager.add_frame(
                CameraType.THERMAL,
                frame_data.thermal_image,
                frame_data.timestamp,
            )

    camera.set_frame_callback(on_frame_received)

    # 6. Start camera streams
    print("\n[6] Starting camera streams...")
    print("   Note: This will fail if H30T camera is not available at RTSP URLs")

    try:
        await camera.start()

        # Let it run for a bit to capture frames
        print("\n[7] Capturing frames (running for 10 seconds)...")
        await asyncio.sleep(10)

        # Get stream statistics
        print("\n[8] Stream Statistics:")
        stats = camera.get_stream_stats()
        for stream_name, stream_stats in stats.items():
            print(f"   {stream_name}:")
            print(f"     - Frames received: {stream_stats.frames_received}")
            print(f"     - Frames dropped: {stream_stats.frames_dropped}")
            print(f"     - Average FPS: {stream_stats.avg_fps:.1f}")

        # Get stream manager statistics
        print("\n   Stream Manager Statistics:")
        mgr_stats = stream_manager.get_statistics()
        print(f"     - Sync successful: {mgr_stats['sync_successful']}")
        print(f"     - Sync failed: {mgr_stats['sync_failed']}")
        print(f"     - Sync rate: {mgr_stats['sync_rate']:.1%}")

        # Get DJI telemetry status
        print("\n   DJI Aircraft Status:")
        flight_status = dji_bridge.get_flight_status()
        print(f"     - Connected: {flight_status['connected']}")
        print(f"     - Battery: {flight_status['battery_percent']}%")
        print(f"     - Flight mode: {flight_status['flight_mode']}")

        # 9. Get frames for DeepStream inference
        print("\n[9] Retrieving frames for DeepStream inference...")
        ds_frames = stream_manager.get_buffer_for_deepstream(
            camera_type=CameraType.WIDE,
            max_frames=4,  # Batch size for inference
        )
        print(f"   Retrieved {len(ds_frames)} frames for batched inference")

    except Exception as e:
        print(f"\n   Error: {e}")
        print("   This is expected if H30T camera is not physically connected")

    finally:
        # 10. Cleanup
        print("\n[10] Stopping camera streams...")
        await camera.stop()

        if dji_bridge.is_connected():
            dji_bridge.disconnect()

    print("\n" + "=" * 80)
    print("Example completed")
    print("=" * 80)


def thermal_processing_example():
    """Standalone example of thermal processing."""

    print("\n" + "=" * 80)
    print("Thermal Processing Example (Simulated Data)")
    print("=" * 80)

    # Create thermal processor
    thermal_processor = H30TThermalProcessor(
        temperature_range=(-40.0, 550.0),
        emissivity=0.95,
    )

    # Simulate thermal frame (640x512)
    # In production, this comes from H30T camera
    thermal_frame = np.random.randint(0, 255, (512, 640), dtype=np.uint8)

    # Add simulated hotspots
    cv2.circle(thermal_frame, (200, 200), 30, 255, -1)
    cv2.circle(thermal_frame, (400, 300), 20, 220, -1)

    print("\n[1] Parsing radiometric data...")
    temp_map = thermal_processor.parse_radiometric_frame(thermal_frame)
    print(f"   Temperature range: {temp_map.min():.1f}°C to {temp_map.max():.1f}°C")

    print("\n[2] Detecting hotspots...")
    hotspots = thermal_processor.detect_hotspots(temp_map, reference_temp=20.0)
    print(f"   Found {len(hotspots)} hotspots")

    for i, hs in enumerate(hotspots, 1):
        print(f"   Hotspot {i}:")
        print(f"     - Location: {hs['centroid']}")
        print(f"     - Max temp: {hs['max_temp']:.1f}°C")
        print(f"     - Area: {hs['area_pixels']} pixels")
        print(f"     - Delta: +{hs['delta_from_reference']:.1f}°C")

    print("\n[3] Extracting point temperature...")
    point_temp = thermal_processor.extract_temperature_at_point(
        temp_map, x=320, y=256, radius=5
    )
    print(f"   Center point temperature: {point_temp['mean_temp']:.1f}°C")
    print(f"   Std dev: {point_temp['std_temp']:.1f}°C")

    print("\n[4] Creating colorized visualization...")
    colorized = thermal_processor.create_colorized_overlay(
        temp_map,
        colormap=cv2.COLORMAP_INFERNO,
        normalize=True,
    )
    print(f"   Colorized image: {colorized.shape}")

    # Save visualization
    output_path = Path("/tmp/thermal_example.jpg")
    cv2.imwrite(str(output_path), colorized)
    print(f"   Saved to: {output_path}")

    print("\n" + "=" * 80)


if __name__ == "__main__":
    # Run thermal processing example first (works without hardware)
    thermal_processing_example()

    # Run full integration example (requires H30T camera)
    print("\n\nPress Enter to run full H30T integration example...")
    print("(This requires H30T camera connected at RTSP URLs)")
    input()

    asyncio.run(main())
