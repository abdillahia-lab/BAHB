#!/usr/bin/env python3
"""
Dataset Merging Script for BAHB Infrastructure Detection
Converts and merges multiple power infrastructure datasets into unified YOLO format.
"""

import json
import os
import shutil
from pathlib import Path
from collections import defaultdict
import random

# BAHB Target Classes (17 classes)
BAHB_CLASSES = {
    0: 'insulator',
    1: 'insulator_damaged',
    2: 'contamination',
    3: 'tower',
    4: 'conductor',
    5: 'conductor_damaged',
    6: 'damper',
    7: 'spacer',
    8: 'connector',
    9: 'transformer',
    10: 'arrester',
    11: 'breaker',
    12: 'bushing',
    13: 'disconnector',
    14: 'vegetation',
    15: 'bird_nest',
    16: 'foreign_object'
}

# InsPLAD class mapping to BAHB classes
INSPLAD_TO_BAHB = {
    'yoke': 8,                          # connector
    'yoke suspension': 8,               # connector
    'spacer': 7,                        # spacer
    'stockbridge damper': 6,            # damper
    'lightning rod shackle': 8,         # connector
    'lightning rod suspension': 10,     # arrester
    'polymer insulator': 0,             # insulator
    'glass insulator': 0,               # insulator
    'tower id plate': 3,                # tower
    'vari-grip': 8,                     # connector
    'polymer insulator lower shackle': 8,   # connector
    'polymer insulator upper shackle': 8,   # connector
    'polymer insulator tower shackle': 8,   # connector
    'glass insulator big shackle': 8,       # connector
    'glass insulator small shackle': 8,     # connector
    'glass insulator tower shackle': 8,     # connector
    'spiral damper': 6,                 # damper
    'sphere': 8,                        # connector
}

# Figshare Substation class mapping to BAHB classes
FIGSHARE_TO_BAHB = {
    'Open blade disconnect switch': 13,     # disconnector
    'Closed blade disconnect switch': 13,   # disconnector
    'Open tandem disconnect switch': 13,    # disconnector
    'Closed tandem disconnect switch': 13,  # disconnector
    'Breaker': 11,                          # breaker
    'Fuse disconnect switch': 13,           # disconnector
    'Glass disc insulator': 0,              # insulator
    'Porcelain pin insulator': 0,           # insulator
    'Muffle': 8,                            # connector
    'Lightning arrester': 10,               # arrester
    'Recloser': 11,                         # breaker
    'Power transformer': 9,                 # transformer
    'Current transformer': 9,               # transformer
    'Potential transformer': 9,             # transformer
    'Tripolar disconnect switch': 13,       # disconnector
}

# TTPLA class mapping (from their data.yaml or annotations)
TTPLA_TO_BAHB = {
    'tower': 3,                 # tower
    'cable': 4,                 # conductor
    'transmission_line': 4,    # conductor
    'void': None,              # skip
}

# CPLID - all insulators
CPLID_TO_BAHB = {
    'insulator': 0,
    0: 0,  # numeric class
}


def convert_coco_to_yolo(coco_json_path, images_dir, output_labels_dir, class_mapping, id_to_name=None):
    """Convert COCO format annotations to YOLO format with class mapping."""

    with open(coco_json_path, 'r') as f:
        coco_data = json.load(f)

    # Build category id to name mapping
    cat_id_to_name = {}
    for cat in coco_data.get('categories', []):
        cat_id_to_name[cat['id']] = cat['name']

    # Build image id to filename mapping
    img_id_to_info = {}
    for img in coco_data.get('images', []):
        img_id_to_info[img['id']] = {
            'file_name': img['file_name'],
            'width': img['width'],
            'height': img['height']
        }

    # Group annotations by image
    img_annotations = defaultdict(list)
    for ann in coco_data.get('annotations', []):
        img_annotations[ann['image_id']].append(ann)

    os.makedirs(output_labels_dir, exist_ok=True)

    converted_count = 0
    skipped_count = 0

    for img_id, img_info in img_id_to_info.items():
        annotations = img_annotations.get(img_id, [])
        if not annotations:
            continue

        label_filename = Path(img_info['file_name']).stem + '.txt'
        label_path = os.path.join(output_labels_dir, label_filename)

        img_width = img_info['width']
        img_height = img_info['height']

        yolo_lines = []
        for ann in annotations:
            cat_id = ann['category_id']
            cat_name = cat_id_to_name.get(cat_id, str(cat_id))

            # Map to BAHB class
            bahb_class = class_mapping.get(cat_name)
            if bahb_class is None:
                bahb_class = class_mapping.get(cat_id)
            if bahb_class is None:
                skipped_count += 1
                continue

            # Convert bbox from COCO [x, y, width, height] to YOLO [x_center, y_center, width, height] normalized
            bbox = ann['bbox']
            x, y, w, h = bbox

            x_center = (x + w / 2) / img_width
            y_center = (y + h / 2) / img_height
            w_norm = w / img_width
            h_norm = h / img_height

            # Clamp values to [0, 1]
            x_center = max(0, min(1, x_center))
            y_center = max(0, min(1, y_center))
            w_norm = max(0, min(1, w_norm))
            h_norm = max(0, min(1, h_norm))

            yolo_lines.append(f"{bahb_class} {x_center:.6f} {y_center:.6f} {w_norm:.6f} {h_norm:.6f}")

        if yolo_lines:
            with open(label_path, 'w') as f:
                f.write('\n'.join(yolo_lines))
            converted_count += 1

    return converted_count, skipped_count


def convert_yolo_labels(input_labels_dir, output_labels_dir, class_mapping):
    """Convert YOLO labels with different class mapping to BAHB classes."""

    os.makedirs(output_labels_dir, exist_ok=True)
    converted_count = 0

    for label_file in Path(input_labels_dir).glob('*.txt'):
        if label_file.name == 'classes.txt':
            continue

        new_lines = []
        with open(label_file, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    old_class = int(parts[0])
                    bahb_class = class_mapping.get(old_class)
                    if bahb_class is not None:
                        parts[0] = str(bahb_class)
                        new_lines.append(' '.join(parts))

        if new_lines:
            output_path = os.path.join(output_labels_dir, label_file.name)
            with open(output_path, 'w') as f:
                f.write('\n'.join(new_lines))
            converted_count += 1

    return converted_count


def copy_images_and_labels(src_images_dir, src_labels_dir, dst_images_dir, dst_labels_dir, prefix=''):
    """Copy images and their corresponding labels to destination."""

    os.makedirs(dst_images_dir, exist_ok=True)
    os.makedirs(dst_labels_dir, exist_ok=True)

    copied_count = 0

    for img_file in Path(src_images_dir).glob('*'):
        if img_file.suffix.lower() not in ['.jpg', '.jpeg', '.png', '.bmp']:
            continue

        label_file = Path(src_labels_dir) / (img_file.stem + '.txt')

        # Only copy if label exists
        if label_file.exists():
            new_name = f"{prefix}_{img_file.name}" if prefix else img_file.name
            new_label_name = f"{prefix}_{label_file.name}" if prefix else label_file.name

            shutil.copy2(img_file, os.path.join(dst_images_dir, new_name))
            shutil.copy2(label_file, os.path.join(dst_labels_dir, new_label_name))
            copied_count += 1

    return copied_count


def process_insplad(base_dir, output_dir):
    """Process InsPLAD dataset."""
    print("\n=== Processing InsPLAD Dataset ===")

    detection_dir = os.path.join(base_dir, 'InsPLAD', 'detection')
    annotations_dir = os.path.join(detection_dir, 'annotations')

    total_converted = 0

    for split in ['train', 'val']:
        json_file = os.path.join(annotations_dir, f'instances_{split}.json')
        images_dir = os.path.join(detection_dir, split)
        labels_dir = os.path.join(output_dir, 'insplad', split, 'labels')

        if os.path.exists(json_file):
            converted, skipped = convert_coco_to_yolo(
                json_file, images_dir, labels_dir, INSPLAD_TO_BAHB
            )
            print(f"  {split}: Converted {converted} images, skipped {skipped} annotations")
            total_converted += converted

    return total_converted


def process_figshare(base_dir, output_dir):
    """Process Figshare Substation dataset."""
    print("\n=== Processing Figshare Substation Dataset ===")

    data_dir = os.path.join(base_dir, 'data')

    # Read the dataset.yaml to get class names
    yaml_path = os.path.join(data_dir, 'dataset.yaml')
    class_names = []
    if os.path.exists(yaml_path):
        with open(yaml_path, 'r') as f:
            for line in f:
                if line.startswith('- '):
                    class_names.append(line[2:].strip())

    # Create mapping from numeric class to BAHB class
    figshare_numeric_to_bahb = {}
    for i, name in enumerate(class_names):
        bahb_class = FIGSHARE_TO_BAHB.get(name)
        if bahb_class is not None:
            figshare_numeric_to_bahb[i] = bahb_class

    print(f"  Class mapping: {len(figshare_numeric_to_bahb)} classes mapped")

    total_converted = 0

    for split in ['train', 'val', 'test']:
        split_dir = os.path.join(data_dir, split)
        if not os.path.exists(split_dir):
            continue

        images_dir = os.path.join(split_dir, 'images')
        labels_dir = os.path.join(split_dir, 'labels')
        output_labels_dir = os.path.join(output_dir, 'figshare', split, 'labels')

        if os.path.exists(labels_dir):
            converted = convert_yolo_labels(labels_dir, output_labels_dir, figshare_numeric_to_bahb)
            print(f"  {split}: Converted {converted} label files")
            total_converted += converted

    return total_converted


def process_ttpla(base_dir, output_dir):
    """Process TTPLA dataset."""
    print("\n=== Processing TTPLA Dataset ===")

    # Find the actual data directory
    data_dir = None
    for root, dirs, files in os.walk(base_dir):
        if 'coco_annotation.json' in files or any(f.endswith('.json') for f in files):
            data_dir = root
            break

    if not data_dir:
        # Try the ttpla_images subdirectory
        ttpla_images = os.path.join(base_dir, 'ttpla_images')
        if os.path.exists(ttpla_images):
            for root, dirs, files in os.walk(ttpla_images):
                if any(f.endswith('.json') for f in files):
                    data_dir = root
                    break

    if not data_dir:
        print("  Could not find TTPLA annotations")
        return 0

    print(f"  Found data at: {data_dir}")

    # Find JSON annotation file
    json_files = list(Path(data_dir).glob('*.json'))
    if not json_files:
        json_files = list(Path(data_dir).rglob('*.json'))

    total_converted = 0

    for json_file in json_files:
        # Determine images directory (usually same as json or images subdir)
        images_dir = json_file.parent
        if (images_dir / 'images').exists():
            images_dir = images_dir / 'images'

        labels_dir = os.path.join(output_dir, 'ttpla', 'labels')

        try:
            converted, skipped = convert_coco_to_yolo(
                str(json_file), str(images_dir), labels_dir, TTPLA_TO_BAHB
            )
            print(f"  Converted {converted} images from {json_file.name}")
            total_converted += converted
        except Exception as e:
            print(f"  Error processing {json_file}: {e}")

    return total_converted


def process_cplid(base_dir, output_dir):
    """Process CPLID dataset."""
    print("\n=== Processing CPLID Dataset ===")

    total_converted = 0

    # CPLID typically has YOLO format already
    for split_dir in Path(base_dir).iterdir():
        if not split_dir.is_dir():
            continue

        labels_dir = split_dir / 'labels'
        if not labels_dir.exists():
            # Check for txt files directly
            txt_files = list(split_dir.glob('*.txt'))
            if txt_files:
                labels_dir = split_dir

        if labels_dir.exists():
            output_labels_dir = os.path.join(output_dir, 'cplid', split_dir.name, 'labels')
            converted = convert_yolo_labels(str(labels_dir), output_labels_dir, CPLID_TO_BAHB)
            print(f"  {split_dir.name}: Converted {converted} label files")
            total_converted += converted

    return total_converted


def merge_to_unified(output_dir, final_dir, val_split=0.15):
    """Merge all converted datasets into unified train/val sets."""
    print("\n=== Merging All Datasets ===")

    final_train_images = os.path.join(final_dir, 'train', 'images')
    final_train_labels = os.path.join(final_dir, 'train', 'labels')
    final_val_images = os.path.join(final_dir, 'val', 'images')
    final_val_labels = os.path.join(final_dir, 'val', 'labels')

    os.makedirs(final_train_images, exist_ok=True)
    os.makedirs(final_train_labels, exist_ok=True)
    os.makedirs(final_val_images, exist_ok=True)
    os.makedirs(final_val_labels, exist_ok=True)

    dataset_sources = {
        'insplad': '/home/user/BAHB/data/external_datasets/insplad/InsPLAD/detection',
        'figshare': '/home/user/BAHB/data/external_datasets/figshare_substation/data',
        'ttpla': '/home/user/BAHB/data/external_datasets/ttpla/ttpla_images',
        'cplid': '/home/user/BAHB/data/external_datasets/cplid',
    }

    total_train = 0
    total_val = 0

    for dataset_name, source_base in dataset_sources.items():
        converted_dir = os.path.join(output_dir, dataset_name)

        print(f"\n  Processing {dataset_name}...")

        # Handle different dataset structures
        if dataset_name == 'insplad':
            # InsPLAD has train/val splits
            for split in ['train', 'val']:
                src_images = os.path.join(source_base, split)
                src_labels = os.path.join(converted_dir, split, 'labels')

                if os.path.exists(src_labels):
                    dst_images = final_train_images if split == 'train' else final_val_images
                    dst_labels = final_train_labels if split == 'train' else final_val_labels

                    count = copy_images_and_labels(
                        src_images, src_labels, dst_images, dst_labels, f'insplad_{split}'
                    )
                    if split == 'train':
                        total_train += count
                    else:
                        total_val += count
                    print(f"    {split}: Copied {count} image-label pairs")

        elif dataset_name == 'figshare':
            # Figshare has train/val/test splits
            for split in ['train', 'val', 'test']:
                src_images = os.path.join(source_base, split, 'images')
                src_labels = os.path.join(converted_dir, split, 'labels')

                if os.path.exists(src_labels) and os.path.exists(src_images):
                    # Put test into val
                    if split in ['train']:
                        dst_images, dst_labels = final_train_images, final_train_labels
                    else:
                        dst_images, dst_labels = final_val_images, final_val_labels

                    count = copy_images_and_labels(
                        src_images, src_labels, dst_images, dst_labels, f'figshare_{split}'
                    )
                    if split == 'train':
                        total_train += count
                    else:
                        total_val += count
                    print(f"    {split}: Copied {count} image-label pairs")

        elif dataset_name == 'ttpla':
            # TTPLA - find images and pair with converted labels
            src_labels = os.path.join(converted_dir, 'labels')
            if os.path.exists(src_labels):
                # Find images directory
                for img_dir in Path(source_base).rglob('*'):
                    if img_dir.is_dir():
                        jpg_files = list(img_dir.glob('*.jpg')) + list(img_dir.glob('*.png'))
                        if jpg_files:
                            # Split 85/15 for train/val
                            label_files = list(Path(src_labels).glob('*.txt'))
                            random.shuffle(label_files)
                            split_idx = int(len(label_files) * (1 - val_split))

                            train_labels = label_files[:split_idx]
                            val_labels = label_files[split_idx:]

                            for lf in train_labels:
                                img_name = lf.stem + '.jpg'
                                img_path = img_dir / img_name
                                if not img_path.exists():
                                    img_path = img_dir / (lf.stem + '.png')
                                if img_path.exists():
                                    shutil.copy2(img_path, os.path.join(final_train_images, f'ttpla_{img_path.name}'))
                                    shutil.copy2(lf, os.path.join(final_train_labels, f'ttpla_{lf.name}'))
                                    total_train += 1

                            for lf in val_labels:
                                img_name = lf.stem + '.jpg'
                                img_path = img_dir / img_name
                                if not img_path.exists():
                                    img_path = img_dir / (lf.stem + '.png')
                                if img_path.exists():
                                    shutil.copy2(img_path, os.path.join(final_val_images, f'ttpla_{img_path.name}'))
                                    shutil.copy2(lf, os.path.join(final_val_labels, f'ttpla_{lf.name}'))
                                    total_val += 1

                            print(f"    Copied {len(train_labels)} train, {len(val_labels)} val pairs")
                            break

        elif dataset_name == 'cplid':
            # CPLID structure
            cplid_base = '/home/user/BAHB/data/external_datasets/cplid'
            for subdir in Path(cplid_base).iterdir():
                if subdir.is_dir() and subdir.name not in ['.git', '__pycache__']:
                    images_subdir = subdir / 'images'
                    labels_subdir = os.path.join(converted_dir, subdir.name, 'labels')

                    if not images_subdir.exists():
                        images_subdir = subdir

                    if os.path.exists(labels_subdir):
                        # Determine if train or val based on name
                        if 'val' in subdir.name.lower() or 'test' in subdir.name.lower():
                            dst_images, dst_labels = final_val_images, final_val_labels
                            count = copy_images_and_labels(
                                str(images_subdir), labels_subdir, dst_images, dst_labels, 'cplid'
                            )
                            total_val += count
                        else:
                            dst_images, dst_labels = final_train_images, final_train_labels
                            count = copy_images_and_labels(
                                str(images_subdir), labels_subdir, dst_images, dst_labels, 'cplid'
                            )
                            total_train += count
                        print(f"    {subdir.name}: Copied {count} pairs")

    print(f"\n  Total: {total_train} training, {total_val} validation pairs")
    return total_train, total_val


def copy_original_bahb(original_dir, final_dir):
    """Copy original BAHB dataset to final merged directory."""
    print("\n=== Copying Original BAHB Dataset ===")

    train_copied = 0
    val_copied = 0

    for split in ['train', 'val']:
        src_images = os.path.join(original_dir, split, 'images')
        src_labels = os.path.join(original_dir, split, 'labels')
        dst_images = os.path.join(final_dir, split, 'images')
        dst_labels = os.path.join(final_dir, split, 'labels')

        if os.path.exists(src_images) and os.path.exists(src_labels):
            count = copy_images_and_labels(src_images, src_labels, dst_images, dst_labels, 'bahb_orig')
            if split == 'train':
                train_copied = count
            else:
                val_copied = count
            print(f"  {split}: Copied {count} original BAHB pairs")

    return train_copied, val_copied


def create_merged_yaml(final_dir, yaml_path):
    """Create data.yaml for merged dataset."""

    yaml_content = f"""# BAHB Merged Infrastructure Detection Dataset
# Generated by merge_datasets.py

path: {final_dir}
train: train/images
val: val/images

nc: 17
names:
  0: insulator
  1: insulator_damaged
  2: contamination
  3: tower
  4: conductor
  5: conductor_damaged
  6: damper
  7: spacer
  8: connector
  9: transformer
  10: arrester
  11: breaker
  12: bushing
  13: disconnector
  14: vegetation
  15: bird_nest
  16: foreign_object
"""

    with open(yaml_path, 'w') as f:
        f.write(yaml_content)

    print(f"\nCreated merged dataset.yaml at: {yaml_path}")


def main():
    print("=" * 60)
    print("BAHB Dataset Merger - Power Infrastructure Detection")
    print("=" * 60)

    # Directories
    external_datasets_dir = '/home/user/BAHB/data/external_datasets'
    converted_dir = '/home/user/BAHB/data/converted'
    merged_dir = '/home/user/BAHB/data/merged'
    original_dir = '/home/user/BAHB/data/processed'

    # Clean and create directories
    for d in [converted_dir, merged_dir]:
        if os.path.exists(d):
            shutil.rmtree(d)
        os.makedirs(d, exist_ok=True)

    # Process each dataset
    insplad_count = process_insplad(
        os.path.join(external_datasets_dir, 'insplad'),
        converted_dir
    )

    figshare_count = process_figshare(
        os.path.join(external_datasets_dir, 'figshare_substation'),
        converted_dir
    )

    ttpla_count = process_ttpla(
        os.path.join(external_datasets_dir, 'ttpla'),
        converted_dir
    )

    cplid_count = process_cplid(
        os.path.join(external_datasets_dir, 'cplid'),
        converted_dir
    )

    print("\n" + "=" * 60)
    print("Conversion Summary:")
    print(f"  InsPLAD: {insplad_count} images")
    print(f"  Figshare: {figshare_count} images")
    print(f"  TTPLA: {ttpla_count} images")
    print(f"  CPLID: {cplid_count} images")
    print("=" * 60)

    # Copy original BAHB dataset first
    orig_train, orig_val = copy_original_bahb(original_dir, merged_dir)

    # Merge all datasets
    ext_train, ext_val = merge_to_unified(converted_dir, merged_dir)

    # Create merged yaml
    create_merged_yaml(merged_dir, os.path.join(merged_dir, 'dataset.yaml'))

    # Final summary
    print("\n" + "=" * 60)
    print("FINAL MERGED DATASET SUMMARY")
    print("=" * 60)

    final_train = len(list(Path(merged_dir, 'train', 'images').glob('*')))
    final_val = len(list(Path(merged_dir, 'val', 'images').glob('*')))

    print(f"  Training images: {final_train}")
    print(f"  Validation images: {final_val}")
    print(f"  Total: {final_train + final_val}")
    print(f"\n  Dataset location: {merged_dir}")
    print(f"  Config file: {merged_dir}/dataset.yaml")
    print("=" * 60)


if __name__ == '__main__':
    main()
