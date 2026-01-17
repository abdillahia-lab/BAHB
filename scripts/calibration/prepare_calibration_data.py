#!/usr/bin/env python3
"""
Prepare calibration dataset for INT8 quantization.
Selects diverse images from training set with proper class distribution.
"""

import os
import json
import random
import shutil
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Tuple
import argparse

import cv2
import numpy as np
from tqdm import tqdm


class CalibrationDatasetPreparer:
    """Prepare calibration dataset with diverse image selection."""

    def __init__(
        self,
        train_images_dir: str,
        train_labels_dir: str,
        output_dir: str,
        num_images: int = 1000,
        min_per_class: int = 50,
        random_seed: int = 42
    ):
        self.train_images_dir = Path(train_images_dir)
        self.train_labels_dir = Path(train_labels_dir)
        self.output_dir = Path(output_dir)
        self.num_images = num_images
        self.min_per_class = min_per_class
        self.random_seed = random_seed

        # Class names for infrastructure detection
        self.class_names = [
            'power_line', 'power_pole', 'transmission_tower', 'insulator',
            'transformer', 'solar_panel', 'wind_turbine', 'substation',
            'utility_box', 'meter', 'cable', 'junction_box'
        ]

        random.seed(random_seed)
        np.random.seed(random_seed)

    def analyze_dataset(self) -> Dict[int, List[str]]:
        """Analyze dataset and group images by classes."""
        print("Analyzing dataset...")

        class_to_images = defaultdict(set)
        image_stats = {}

        label_files = list(self.train_labels_dir.glob('*.txt'))

        for label_file in tqdm(label_files, desc="Analyzing labels"):
            img_name = label_file.stem
            img_path = self.train_images_dir / f"{img_name}.jpg"

            # Try different extensions
            if not img_path.exists():
                img_path = self.train_images_dir / f"{img_name}.png"
            if not img_path.exists():
                continue

            # Read labels
            with open(label_file, 'r') as f:
                lines = f.readlines()

            if not lines:
                continue

            classes = set()
            boxes = []

            for line in lines:
                parts = line.strip().split()
                if len(parts) >= 5:
                    class_id = int(parts[0])
                    classes.add(class_id)
                    boxes.append(parts)

            # Store image stats
            image_stats[str(img_path)] = {
                'classes': list(classes),
                'num_objects': len(boxes),
                'path': str(img_path)
            }

            # Map classes to images
            for class_id in classes:
                class_to_images[class_id].add(str(img_path))

        # Convert sets to lists
        class_to_images = {k: list(v) for k, v in class_to_images.items()}

        print(f"\nDataset Analysis:")
        print(f"Total images with labels: {len(image_stats)}")
        print(f"Classes found: {len(class_to_images)}")

        for class_id in sorted(class_to_images.keys()):
            class_name = self.class_names[class_id] if class_id < len(self.class_names) else f"class_{class_id}"
            print(f"  Class {class_id} ({class_name}): {len(class_to_images[class_id])} images")

        return class_to_images, image_stats

    def select_diverse_images(
        self,
        class_to_images: Dict[int, List[str]],
        image_stats: Dict[str, Dict]
    ) -> List[str]:
        """Select diverse images ensuring class coverage."""
        print(f"\nSelecting {self.num_images} calibration images...")

        selected_images = set()

        # Step 1: Ensure minimum representation per class
        for class_id, images in class_to_images.items():
            # Sample min_per_class images for this class
            n_samples = min(self.min_per_class, len(images))
            sampled = random.sample(images, n_samples)
            selected_images.update(sampled)

            class_name = self.class_names[class_id] if class_id < len(self.class_names) else f"class_{class_id}"
            print(f"  Added {n_samples} images for class {class_id} ({class_name})")

        print(f"\nImages after per-class sampling: {len(selected_images)}")

        # Step 2: Fill remaining quota with diverse images
        remaining = self.num_images - len(selected_images)

        if remaining > 0:
            # Get all available images not yet selected
            all_images = set(image_stats.keys())
            available = list(all_images - selected_images)

            # Score images by diversity (number of different classes)
            scored_images = []
            for img_path in available:
                num_classes = len(image_stats[img_path]['classes'])
                num_objects = image_stats[img_path]['num_objects']
                # Prefer images with multiple classes and objects
                score = num_classes * 10 + num_objects
                scored_images.append((score, img_path))

            # Sort by score and take top remaining
            scored_images.sort(reverse=True)
            additional = [img for _, img in scored_images[:remaining]]
            selected_images.update(additional)

            print(f"Added {len(additional)} diverse images")

        selected_list = list(selected_images)[:self.num_images]
        random.shuffle(selected_list)

        print(f"\nFinal selection: {len(selected_list)} images")

        return selected_list

    def analyze_selection(
        self,
        selected_images: List[str],
        image_stats: Dict[str, Dict]
    ) -> Dict:
        """Analyze the selected calibration set."""
        print("\nAnalyzing selection...")

        class_distribution = defaultdict(int)
        total_objects = 0
        image_sizes = []

        for img_path in selected_images:
            stats = image_stats[img_path]
            total_objects += stats['num_objects']

            for class_id in stats['classes']:
                class_distribution[class_id] += 1

            # Get image size
            img = cv2.imread(img_path)
            if img is not None:
                image_sizes.append(img.shape[:2])

        analysis = {
            'num_images': len(selected_images),
            'total_objects': total_objects,
            'avg_objects_per_image': total_objects / len(selected_images),
            'class_distribution': dict(class_distribution),
            'image_sizes': {
                'min_height': min(h for h, w in image_sizes),
                'max_height': max(h for h, w in image_sizes),
                'min_width': min(w for h, w in image_sizes),
                'max_width': max(w for h, w in image_sizes),
                'avg_height': np.mean([h for h, w in image_sizes]),
                'avg_width': np.mean([w for h, w in image_sizes])
            }
        }

        print(f"\nCalibration Set Statistics:")
        print(f"  Images: {analysis['num_images']}")
        print(f"  Total objects: {analysis['total_objects']}")
        print(f"  Avg objects/image: {analysis['avg_objects_per_image']:.2f}")
        print(f"\n  Class Distribution:")

        for class_id in sorted(class_distribution.keys()):
            class_name = self.class_names[class_id] if class_id < len(self.class_names) else f"class_{class_id}"
            print(f"    Class {class_id} ({class_name}): {class_distribution[class_id]} images")

        print(f"\n  Image Sizes:")
        print(f"    Height: {analysis['image_sizes']['min_height']}-{analysis['image_sizes']['max_height']} "
              f"(avg: {analysis['image_sizes']['avg_height']:.0f})")
        print(f"    Width: {analysis['image_sizes']['min_width']}-{analysis['image_sizes']['max_width']} "
              f"(avg: {analysis['image_sizes']['avg_width']:.0f})")

        return analysis

    def create_manifest(
        self,
        selected_images: List[str],
        analysis: Dict
    ):
        """Create calibration manifest file."""
        self.output_dir.mkdir(parents=True, exist_ok=True)

        manifest_path = self.output_dir / 'calibration_manifest.json'
        image_list_path = self.output_dir / 'calibration_images.txt'

        # Create manifest
        manifest = {
            'num_images': len(selected_images),
            'random_seed': self.random_seed,
            'statistics': analysis,
            'images': selected_images,
            'class_names': self.class_names
        }

        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)

        # Create simple image list
        with open(image_list_path, 'w') as f:
            for img_path in selected_images:
                f.write(f"{img_path}\n")

        print(f"\nManifest saved to: {manifest_path}")
        print(f"Image list saved to: {image_list_path}")

        return manifest_path, image_list_path

    def copy_calibration_images(self, selected_images: List[str]):
        """Optionally copy calibration images to output directory."""
        output_images_dir = self.output_dir / 'images'
        output_images_dir.mkdir(parents=True, exist_ok=True)

        print(f"\nCopying calibration images to {output_images_dir}...")

        for img_path in tqdm(selected_images, desc="Copying images"):
            img_name = Path(img_path).name
            dst_path = output_images_dir / img_name
            if not dst_path.exists():
                shutil.copy2(img_path, dst_path)

        print(f"Copied {len(selected_images)} images")

    def run(self, copy_images: bool = False):
        """Run the full calibration data preparation pipeline."""
        print("="*80)
        print("BAHB INT8 Calibration Data Preparation")
        print("="*80)

        # Analyze dataset
        class_to_images, image_stats = self.analyze_dataset()

        # Select diverse images
        selected_images = self.select_diverse_images(class_to_images, image_stats)

        # Analyze selection
        analysis = self.analyze_selection(selected_images, image_stats)

        # Create manifest
        manifest_path, image_list_path = self.create_manifest(selected_images, analysis)

        # Optionally copy images
        if copy_images:
            self.copy_calibration_images(selected_images)

        print("\n" + "="*80)
        print("Calibration data preparation complete!")
        print("="*80)

        return manifest_path, image_list_path


def main():
    parser = argparse.ArgumentParser(description="Prepare calibration dataset for INT8 quantization")
    parser.add_argument(
        '--train-images',
        type=str,
        default='/home/user/BAHB/data/merged/train/images',
        help='Path to training images directory'
    )
    parser.add_argument(
        '--train-labels',
        type=str,
        default='/home/user/BAHB/data/merged/train/labels',
        help='Path to training labels directory'
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default='/home/user/BAHB/data/calibration',
        help='Output directory for calibration data'
    )
    parser.add_argument(
        '--num-images',
        type=int,
        default=1000,
        help='Number of calibration images to select'
    )
    parser.add_argument(
        '--min-per-class',
        type=int,
        default=50,
        help='Minimum images per class'
    )
    parser.add_argument(
        '--copy-images',
        action='store_true',
        help='Copy calibration images to output directory'
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for reproducibility'
    )

    args = parser.parse_args()

    preparer = CalibrationDatasetPreparer(
        train_images_dir=args.train_images,
        train_labels_dir=args.train_labels,
        output_dir=args.output_dir,
        num_images=args.num_images,
        min_per_class=args.min_per_class,
        random_seed=args.seed
    )

    preparer.run(copy_images=args.copy_images)


if __name__ == '__main__':
    main()
