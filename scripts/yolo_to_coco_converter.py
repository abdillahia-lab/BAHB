#!/usr/bin/env python3
"""
Convert YOLO format dataset to COCO JSON format for RF-DETR training.

This script converts the merged YOLO dataset to COCO format required by RF-DETR.
It also analyzes class distribution and generates class weights for balanced training.

Usage:
    python scripts/yolo_to_coco_converter.py
"""

import json
import os
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from PIL import Image
from tqdm import tqdm
import numpy as np
from datetime import datetime


@dataclass
class ConversionStats:
    """Statistics from dataset conversion."""
    total_images: int = 0
    total_annotations: int = 0
    images_without_labels: int = 0
    invalid_annotations: int = 0
    class_distribution: Dict[int, int] = None

    def __post_init__(self):
        if self.class_distribution is None:
            self.class_distribution = defaultdict(int)


class YOLOtoCOCOConverter:
    """Convert YOLO format to COCO JSON format."""

    # BAHB Infrastructure Classes (17 classes)
    CLASS_NAMES = [
        'insulator',           # 0 - Glass/ceramic insulators
        'insulator_damaged',   # 1 - Cracked, broken, or flashover damage
        'contamination',       # 2 - Pollution, dust, or deposits
        'tower',               # 3 - Transmission/distribution towers
        'conductor',           # 4 - Power lines/cables
        'conductor_damaged',   # 5 - Broken strands, sagging
        'damper',              # 6 - Vibration dampers
        'spacer',              # 7 - Conductor spacers
        'connector',           # 8 - Cable connectors/splices
        'transformer',         # 9 - Pole/pad-mount transformers
        'arrester',            # 10 - Surge/lightning arresters
        'breaker',             # 11 - Circuit breakers
        'bushing',             # 12 - Transformer bushings
        'disconnector',        # 13 - Disconnect switches
        'vegetation',          # 14 - Tree/vegetation encroachment
        'bird_nest',           # 15 - Bird nests on equipment
        'foreign_object',      # 16 - Foreign objects on lines
    ]

    # Supercategory mapping for COCO hierarchy
    SUPERCATEGORIES = {
        'insulator': 'equipment',
        'insulator_damaged': 'defect',
        'contamination': 'defect',
        'tower': 'structure',
        'conductor': 'equipment',
        'conductor_damaged': 'defect',
        'damper': 'equipment',
        'spacer': 'equipment',
        'connector': 'equipment',
        'transformer': 'equipment',
        'arrester': 'equipment',
        'breaker': 'equipment',
        'bushing': 'equipment',
        'disconnector': 'equipment',
        'vegetation': 'hazard',
        'bird_nest': 'hazard',
        'foreign_object': 'hazard',
    }

    def __init__(self, class_names: Optional[List[str]] = None):
        self.class_names = class_names or self.CLASS_NAMES
        self.image_id_counter = 1
        self.annotation_id_counter = 1
        self.stats = ConversionStats()

    def _create_coco_structure(self, description: str = "BAHB Dataset") -> Dict:
        """Create base COCO JSON structure."""
        return {
            "info": {
                "description": description,
                "version": "1.0.0",
                "year": datetime.now().year,
                "contributor": "BAHB Infrastructure Detection",
                "date_created": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "url": "https://github.com/BAHB"
            },
            "licenses": [
                {
                    "id": 1,
                    "name": "Proprietary - BAHB",
                    "url": ""
                }
            ],
            "images": [],
            "annotations": [],
            "categories": self._create_categories()
        }

    def _create_categories(self) -> List[Dict]:
        """Create COCO category definitions."""
        categories = []
        for i, name in enumerate(self.class_names):
            categories.append({
                "id": i,
                "name": name,
                "supercategory": self.SUPERCATEGORIES.get(name, "infrastructure")
            })
        return categories

    def _yolo_to_coco_bbox(
        self,
        x_center_norm: float,
        y_center_norm: float,
        width_norm: float,
        height_norm: float,
        img_width: int,
        img_height: int
    ) -> Tuple[List[float], float]:
        """
        Convert YOLO normalized bbox to COCO pixel coordinates.

        YOLO: [x_center, y_center, width, height] (normalized 0-1)
        COCO: [x_min, y_min, width, height] (pixels)

        Returns: (bbox, area)
        """
        # Convert to pixel coordinates
        width_px = width_norm * img_width
        height_px = height_norm * img_height
        x_min = (x_center_norm * img_width) - (width_px / 2)
        y_min = (y_center_norm * img_height) - (height_px / 2)

        # Clamp to image bounds
        x_min = max(0, min(img_width - 1, x_min))
        y_min = max(0, min(img_height - 1, y_min))
        width_px = max(1, min(img_width - x_min, width_px))
        height_px = max(1, min(img_height - y_min, height_px))

        # Calculate area
        area = width_px * height_px

        return [round(x_min, 2), round(y_min, 2), round(width_px, 2), round(height_px, 2)], area

    def _bbox_to_polygon(self, bbox: List[float]) -> List[List[float]]:
        """
        Convert bbox to polygon segmentation (rectangle).
        This is a simple approximation; true instance segmentation would need masks.
        """
        x, y, w, h = bbox
        # Create rectangle polygon (clockwise from top-left)
        return [[
            x, y,           # top-left
            x + w, y,       # top-right
            x + w, y + h,   # bottom-right
            x, y + h        # bottom-left
        ]]

    def convert_dataset(
        self,
        images_dir: Path,
        labels_dir: Path,
        output_json: Path,
        description: str = "BAHB Dataset",
        generate_masks: bool = True,
        verbose: bool = True
    ) -> Dict:
        """
        Convert YOLO dataset to COCO format.

        Args:
            images_dir: Directory containing images
            labels_dir: Directory containing YOLO label files
            output_json: Output path for COCO JSON
            description: Dataset description
            generate_masks: Generate polygon masks from bboxes
            verbose: Show progress bar

        Returns:
            COCO format dictionary
        """
        coco_data = self._create_coco_structure(description)

        # Get all image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files = sorted([
            f for f in Path(images_dir).iterdir()
            if f.suffix.lower() in image_extensions
        ])

        if verbose:
            print(f"Processing {len(image_files)} images from {images_dir}")
            image_files = tqdm(image_files, desc="Converting")

        for img_path in image_files:
            # Read image dimensions using PIL (much faster - only reads header)
            try:
                with Image.open(img_path) as img:
                    width, height = img.size
            except Exception:
                self.stats.images_without_labels += 1
                continue

            # Find corresponding label file
            label_path = Path(labels_dir) / (img_path.stem + '.txt')

            # Add image to COCO
            image_id = self.image_id_counter
            self.image_id_counter += 1
            self.stats.total_images += 1

            image_info = {
                "id": image_id,
                "file_name": img_path.name,
                "height": height,
                "width": width,
                "date_captured": datetime.now().strftime("%Y-%m-%d"),
                # Metadata for drone imagery
                "altitude_m": 50.0,  # Default estimate
                "gsd_cm": 1.5,       # Ground sample distance estimate
                "camera": "wide",    # Camera type
                "sensor": "RGB"      # Sensor type
            }
            coco_data["images"].append(image_info)

            # Process annotations if label file exists
            if not label_path.exists():
                self.stats.images_without_labels += 1
                continue

            with open(label_path, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) < 5:
                        self.stats.invalid_annotations += 1
                        continue

                    try:
                        class_id = int(parts[0])
                        x_center_norm = float(parts[1])
                        y_center_norm = float(parts[2])
                        width_norm = float(parts[3])
                        height_norm = float(parts[4])
                    except (ValueError, IndexError):
                        self.stats.invalid_annotations += 1
                        continue

                    # Validate class ID
                    if class_id < 0 or class_id >= len(self.class_names):
                        self.stats.invalid_annotations += 1
                        continue

                    # Validate normalized coordinates
                    if not all(0 <= v <= 1 for v in [x_center_norm, y_center_norm, width_norm, height_norm]):
                        self.stats.invalid_annotations += 1
                        continue

                    # Convert bbox
                    bbox, area = self._yolo_to_coco_bbox(
                        x_center_norm, y_center_norm,
                        width_norm, height_norm,
                        width, height
                    )

                    # Skip tiny annotations
                    if area < 10:
                        self.stats.invalid_annotations += 1
                        continue

                    # Create annotation
                    annotation = {
                        "id": self.annotation_id_counter,
                        "image_id": image_id,
                        "category_id": class_id,
                        "bbox": bbox,
                        "area": round(area, 2),
                        "iscrowd": 0,
                        # Additional metadata
                        "severity": "normal",
                        "thermal_delta_t": 0.0,
                        "confidence": 1.0  # Ground truth
                    }

                    # Add segmentation (polygon from bbox)
                    if generate_masks:
                        annotation["segmentation"] = self._bbox_to_polygon(bbox)
                    else:
                        annotation["segmentation"] = []

                    coco_data["annotations"].append(annotation)
                    self.annotation_id_counter += 1
                    self.stats.total_annotations += 1
                    self.stats.class_distribution[class_id] += 1

        # Save JSON
        output_json.parent.mkdir(parents=True, exist_ok=True)
        with open(output_json, 'w') as f:
            json.dump(coco_data, f, indent=2)

        if verbose:
            self._print_stats()

        return coco_data

    def _print_stats(self):
        """Print conversion statistics."""
        print("\n" + "="*60)
        print("CONVERSION STATISTICS")
        print("="*60)
        print(f"Total images processed: {self.stats.total_images}")
        print(f"Total annotations: {self.stats.total_annotations}")
        print(f"Images without labels: {self.stats.images_without_labels}")
        print(f"Invalid annotations skipped: {self.stats.invalid_annotations}")
        print("\nClass Distribution:")
        print("-"*40)

        total = sum(self.stats.class_distribution.values())
        for class_id, count in sorted(self.stats.class_distribution.items()):
            class_name = self.class_names[class_id] if class_id < len(self.class_names) else f"Unknown_{class_id}"
            pct = (count / total * 100) if total > 0 else 0
            bar = "█" * int(pct / 2)
            print(f"  {class_id:2d} {class_name:20s}: {count:6d} ({pct:5.1f}%) {bar}")

        print("-"*40)
        print(f"Total: {total}")

    def compute_class_weights(self) -> Dict[int, float]:
        """
        Compute class weights for balanced training.
        Uses inverse frequency weighting.
        """
        total = sum(self.stats.class_distribution.values())
        num_classes = len(self.class_names)

        weights = {}
        for class_id in range(num_classes):
            count = self.stats.class_distribution.get(class_id, 0)
            if count > 0:
                # Inverse frequency weighting
                weights[class_id] = total / (num_classes * count)
            else:
                # Missing class - assign maximum weight
                weights[class_id] = 10.0  # High weight for missing classes

        # Normalize weights
        max_weight = max(weights.values())
        weights = {k: min(v / max_weight * 10, 10.0) for k, v in weights.items()}

        return weights

    def get_missing_classes(self) -> List[Tuple[int, str]]:
        """Get list of classes with zero instances."""
        missing = []
        for class_id, name in enumerate(self.class_names):
            if self.stats.class_distribution.get(class_id, 0) == 0:
                missing.append((class_id, name))
        return missing

    def get_rare_classes(self, threshold: int = 100) -> List[Tuple[int, str, int]]:
        """Get list of classes with fewer than threshold instances."""
        rare = []
        for class_id, name in enumerate(self.class_names):
            count = self.stats.class_distribution.get(class_id, 0)
            if 0 < count < threshold:
                rare.append((class_id, name, count))
        return rare


def main():
    """Main conversion function."""
    import argparse

    parser = argparse.ArgumentParser(description="Convert YOLO to COCO format")
    parser.add_argument("--input-dir", type=str, default="data/merged",
                        help="Input YOLO dataset directory")
    parser.add_argument("--output-dir", type=str, default="data/rf_detr",
                        help="Output COCO dataset directory")
    parser.add_argument("--no-masks", action="store_true",
                        help="Skip generating segmentation masks")
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)

    print("="*60)
    print("YOLO to COCO Converter for RF-DETR Training")
    print("="*60)

    # Convert training set
    print("\n[1/2] Converting TRAINING set...")
    train_converter = YOLOtoCOCOConverter()
    train_coco = train_converter.convert_dataset(
        images_dir=input_dir / "train" / "images",
        labels_dir=input_dir / "train" / "labels",
        output_json=output_dir / "train_instances.json",
        description="BAHB Infrastructure Detection - Training Set",
        generate_masks=not args.no_masks
    )

    # Compute class weights from training set
    class_weights = train_converter.compute_class_weights()
    missing_classes = train_converter.get_missing_classes()
    rare_classes = train_converter.get_rare_classes()

    # Convert validation set
    print("\n[2/2] Converting VALIDATION set...")
    val_converter = YOLOtoCOCOConverter()
    val_coco = val_converter.convert_dataset(
        images_dir=input_dir / "val" / "images",
        labels_dir=input_dir / "val" / "labels",
        output_json=output_dir / "val_instances.json",
        description="BAHB Infrastructure Detection - Validation Set",
        generate_masks=not args.no_masks
    )

    # Save metadata
    metadata = {
        "dataset_info": {
            "name": "BAHB Infrastructure Detection",
            "version": "1.0.0",
            "num_classes": len(YOLOtoCOCOConverter.CLASS_NAMES),
            "classes": YOLOtoCOCOConverter.CLASS_NAMES,
            "created": datetime.now().isoformat()
        },
        "training_set": {
            "images": train_converter.stats.total_images,
            "annotations": train_converter.stats.total_annotations,
            "class_distribution": dict(train_converter.stats.class_distribution)
        },
        "validation_set": {
            "images": val_converter.stats.total_images,
            "annotations": val_converter.stats.total_annotations,
            "class_distribution": dict(val_converter.stats.class_distribution)
        },
        "class_weights": class_weights,
        "missing_classes": [{"id": c[0], "name": c[1]} for c in missing_classes],
        "rare_classes": [{"id": c[0], "name": c[1], "count": c[2]} for c in rare_classes]
    }

    metadata_path = output_dir / "metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    # Print summary
    print("\n" + "="*60)
    print("CONVERSION COMPLETE")
    print("="*60)
    print(f"\nOutput files:")
    print(f"  - {output_dir / 'train_instances.json'}")
    print(f"  - {output_dir / 'val_instances.json'}")
    print(f"  - {output_dir / 'metadata.json'}")

    if missing_classes:
        print(f"\n⚠️  WARNING: {len(missing_classes)} classes have ZERO instances:")
        for class_id, name in missing_classes:
            print(f"     - [{class_id}] {name}")
        print("   Consider adding synthetic data for these classes.")

    if rare_classes:
        print(f"\n⚠️  WARNING: {len(rare_classes)} classes have <100 instances (rare):")
        for class_id, name, count in rare_classes:
            print(f"     - [{class_id}] {name}: {count} instances")
        print("   Consider oversampling or augmentation for these classes.")

    print(f"\nClass weights saved to: {metadata_path}")
    print("Use these weights during training for balanced learning.")


if __name__ == "__main__":
    main()
