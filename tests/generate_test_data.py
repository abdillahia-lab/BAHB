#!/usr/bin/env python3
"""Generate synthetic test data for BAHB tests.

This script creates sample images and expected results for testing.
"""

import json
from pathlib import Path

import cv2
import numpy as np


# Directories
TEST_DATA_DIR = Path(__file__).parent / "test_data"
IMAGES_DIR = TEST_DATA_DIR / "images"
THERMAL_DIR = TEST_DATA_DIR / "thermal"
EXPECTED_DIR = TEST_DATA_DIR / "expected"


def create_sample_infrastructure_image(output_path: Path, equipment_type: str):
    """Create a synthetic infrastructure image with labeled equipment."""
    # Create base image
    img = np.ones((1080, 1920, 3), dtype=np.uint8) * 100

    # Add gradient for realism
    gradient = np.linspace(80, 120, 1920).reshape(1, -1).repeat(1080, axis=0)
    img[:, :, 0] = gradient
    img[:, :, 1] = gradient * 0.8
    img[:, :, 2] = gradient * 0.6

    if equipment_type == "transformer":
        # Draw transformer-like structure
        cv2.rectangle(img, (700, 300), (1200, 800), (80, 80, 100), -1)
        cv2.rectangle(img, (700, 300), (1200, 800), (60, 60, 80), 3)

        # Cooling fins
        for i in range(5):
            y = 350 + i * 80
            cv2.rectangle(img, (650, y), (700, y + 50), (70, 70, 90), -1)
            cv2.rectangle(img, (1200, y), (1250, y + 50), (70, 70, 90), -1)

        # Bushings on top
        cv2.circle(img, (850, 280), 30, (120, 120, 140), -1)
        cv2.circle(img, (950, 280), 30, (120, 120, 140), -1)
        cv2.circle(img, (1050, 280), 30, (120, 120, 140), -1)

    elif equipment_type == "insulator":
        # Draw insulator string
        for i in range(8):
            y = 200 + i * 80
            cv2.ellipse(img, (960, y), (40, 30), 0, 0, 360, (140, 140, 160), -1)
            cv2.ellipse(img, (960, y), (40, 30), 0, 0, 360, (120, 120, 140), 2)

    elif equipment_type == "conductor":
        # Draw conductor lines
        cv2.line(img, (100, 300), (1820, 350), (100, 100, 120), 15)
        cv2.line(img, (100, 450), (1820, 500), (100, 100, 120), 15)
        cv2.line(img, (100, 600), (1820, 650), (100, 100, 120), 15)

    elif equipment_type == "substation":
        # Complex substation scene
        # Transformer
        cv2.rectangle(img, (400, 400), (700, 800), (80, 80, 100), -1)
        # Switchgear
        cv2.rectangle(img, (900, 500), (1100, 850), (90, 90, 110), -1)
        # Conductors
        cv2.line(img, (200, 200), (1700, 200), (100, 100, 120), 10)
        cv2.line(img, (200, 300), (1700, 300), (100, 100, 120), 10)
        # Insulators
        for x in [500, 700, 900, 1100]:
            for i in range(4):
                y = 250 + i * 40
                cv2.ellipse(img, (x, y), (20, 15), 0, 0, 360, (130, 130, 150), -1)

    # Add some noise for realism
    noise = np.random.normal(0, 5, img.shape).astype(np.uint8)
    img = cv2.add(img, noise)

    cv2.imwrite(str(output_path), img)
    print(f"Created: {output_path}")

    return img


def create_thermal_image(output_path: Path, has_hotspot: bool = False):
    """Create a synthetic thermal image."""
    # Base thermal image (ambient temperature ~25°C mapped to pixel value)
    thermal = np.ones((512, 640), dtype=np.uint8) * 80

    # Add some variation
    noise = np.random.normal(0, 3, thermal.shape)
    thermal = np.clip(thermal + noise, 0, 255).astype(np.uint8)

    if has_hotspot:
        # Add hot spots
        cv2.circle(thermal, (200, 200), 40, 200, -1)
        cv2.circle(thermal, (200, 200), 50, 180, 3)

        cv2.circle(thermal, (450, 300), 35, 220, -1)
        cv2.circle(thermal, (450, 300), 45, 190, 3)

    # Convert to colorized thermal (Ironbow/Inferno colormap)
    thermal_colored = cv2.applyColorMap(thermal, cv2.COLORMAP_INFERNO)

    cv2.imwrite(str(output_path), thermal_colored)
    print(f"Created: {output_path}")

    # Also save raw temperature data
    temp_raw_path = output_path.with_suffix(".npy")
    # Convert pixel values to temperature (simplified linear mapping)
    temperatures = (thermal.astype(np.float32) / 255.0) * 100.0 + 10.0  # 10°C to 110°C
    np.save(temp_raw_path, temperatures)
    print(f"Created: {temp_raw_path}")

    return thermal_colored


def create_expected_detections(image_name: str, equipment_type: str) -> dict:
    """Create expected detection results for an image."""

    detections_map = {
        "transformer": [
            {
                "class_id": 0,
                "class_name": "transformer",
                "confidence": 0.92,
                "bbox": [700, 300, 1200, 800]
            }
        ],
        "insulator": [
            {
                "class_id": 1,
                "class_name": "insulator",
                "confidence": 0.88,
                "bbox": [920, 200, 1000, 800]
            }
        ],
        "conductor": [
            {
                "class_id": 2,
                "class_name": "conductor",
                "confidence": 0.85,
                "bbox": [100, 290, 1820, 360]
            },
            {
                "class_id": 2,
                "class_name": "conductor",
                "confidence": 0.85,
                "bbox": [100, 440, 1820, 510]
            },
            {
                "class_id": 2,
                "class_name": "conductor",
                "confidence": 0.85,
                "bbox": [100, 590, 1820, 660]
            }
        ],
        "substation": [
            {
                "class_id": 0,
                "class_name": "transformer",
                "confidence": 0.91,
                "bbox": [400, 400, 700, 800]
            },
            {
                "class_id": 3,
                "class_name": "switchgear",
                "confidence": 0.87,
                "bbox": [900, 500, 1100, 850]
            },
            {
                "class_id": 2,
                "class_name": "conductor",
                "confidence": 0.83,
                "bbox": [200, 190, 1700, 210]
            },
            {
                "class_id": 2,
                "class_name": "conductor",
                "confidence": 0.83,
                "bbox": [200, 290, 1700, 310]
            }
        ]
    }

    expected = {
        "image": image_name,
        "image_size": [1920, 1080],
        "detections": detections_map.get(equipment_type, [])
    }

    return expected


def main():
    """Generate all test data."""
    print("Generating BAHB test data...")
    print("=" * 60)

    # Ensure directories exist
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    THERMAL_DIR.mkdir(parents=True, exist_ok=True)
    EXPECTED_DIR.mkdir(parents=True, exist_ok=True)

    # Generate infrastructure images
    equipment_types = ["transformer", "insulator", "conductor", "substation"]

    for eq_type in equipment_types:
        # Create image
        img_name = f"{eq_type}_sample.jpg"
        img_path = IMAGES_DIR / img_name
        create_sample_infrastructure_image(img_path, eq_type)

        # Create expected detections
        expected = create_expected_detections(img_name, eq_type)
        expected_path = EXPECTED_DIR / f"{eq_type}_expected.json"
        with open(expected_path, "w") as f:
            json.dump(expected, f, indent=2)
        print(f"Created: {expected_path}")

    # Generate thermal images
    create_thermal_image(THERMAL_DIR / "normal_thermal.jpg", has_hotspot=False)
    create_thermal_image(THERMAL_DIR / "hotspot_thermal.jpg", has_hotspot=True)

    # Copy some real training images if available
    training_images = Path("/home/user/BAHB/data/processed/train/images")
    if training_images.exists():
        print("\nCopying sample training images...")
        import shutil
        for i, img_file in enumerate(list(training_images.glob("*.jpg"))[:3]):
            dest = IMAGES_DIR / f"real_sample_{i+1}.jpg"
            shutil.copy(img_file, dest)
            print(f"Copied: {dest}")

    print("\n" + "=" * 60)
    print("Test data generation complete!")
    print(f"Images: {len(list(IMAGES_DIR.glob('*.jpg')))}")
    print(f"Thermal: {len(list(THERMAL_DIR.glob('*.jpg')))}")
    print(f"Expected: {len(list(EXPECTED_DIR.glob('*.json')))}")


if __name__ == "__main__":
    main()
