# BAHB Data Pipeline Documentation

## Overview

This document describes the complete data pipeline for training and fine-tuning the BAHB inspection AI models. The pipeline is designed to integrate with the existing BAHB architecture and supports the DJI H30T multi-sensor camera system.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BAHB DATA PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  │
│  │  Public  │    │  Custom  │    │ Thermal  │    │  Synthetic Data      │  │
│  │ Datasets │    │  Data    │    │  Data    │    │  (H30T Simulation)   │  │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └──────────┬───────────┘  │
│       │               │               │                     │              │
│       └───────────────┴───────────────┴─────────────────────┘              │
│                                       │                                     │
│                                       ▼                                     │
│                        ┌─────────────────────────────┐                      │
│                        │      DATA UNIFICATION       │                      │
│                        │  • Format Conversion        │                      │
│                        │  • Class Mapping            │                      │
│                        │  • Quality Filtering        │                      │
│                        └──────────────┬──────────────┘                      │
│                                       │                                     │
│                                       ▼                                     │
│                        ┌─────────────────────────────┐                      │
│                        │      AUGMENTATION           │                      │
│                        │  • H30T Simulation          │                      │
│                        │  • Thermal Effects          │                      │
│                        │  • Drone Motion Blur        │                      │
│                        └──────────────┬──────────────┘                      │
│                                       │                                     │
│               ┌───────────────────────┼───────────────────────┐             │
│               ▼                       ▼                       ▼             │
│        ┌──────────────┐       ┌──────────────┐       ┌──────────────┐      │
│        │   YOLOv12    │       │   RF-DETR    │       │    SAM3      │      │
│        │   Dataset    │       │   Dataset    │       │   Dataset    │      │
│        │  1280x720    │       │   640x640    │       │  1024x1024   │      │
│        └──────────────┘       └──────────────┘       └──────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
BAHB/
├── data/                              # Data pipeline directory
│   ├── raw/                           # Downloaded/collected raw data
│   │   ├── substation/               # Substation inspection datasets
│   │   │   ├── ttpla/               # TTPLA power line dataset
│   │   │   ├── insulator/           # Insulator defect datasets
│   │   │   └── transformer/         # Transformer thermal datasets
│   │   ├── datacenter/               # Data center datasets
│   │   │   ├── server_thermal/      # Server rack thermal imagery
│   │   │   └── hvac/                # HVAC equipment datasets
│   │   ├── thermal/                  # Thermal imagery collections
│   │   │   ├── flir/                # FLIR thermal datasets
│   │   │   └── synthetic/           # Generated thermal data
│   │   └── general/                  # General object datasets
│   │       ├── coco_subset/         # COCO infrastructure objects
│   │       └── custom/              # Custom collected data
│   │
│   ├── processed/                     # Unified format per model
│   │   ├── yolov12/                  # YOLOv12 format
│   │   │   ├── images/
│   │   │   │   ├── train/
│   │   │   │   └── val/
│   │   │   └── labels/
│   │   │       ├── train/
│   │   │       └── val/
│   │   ├── rf_detr/                  # RF-DETR COCO format
│   │   │   ├── train/
│   │   │   ├── val/
│   │   │   └── annotations/
│   │   └── sam3/                     # SAM3 format
│   │       ├── images/
│   │       └── masks/
│   │
│   ├── augmented/                     # Training-ready augmented data
│   │   ├── yolov12/
│   │   ├── rf_detr/
│   │   └── sam3/
│   │
│   └── exports/                       # Model exports
│       ├── onnx/
│       ├── tensorrt/
│       └── checkpoints/
│
├── scripts/
│   ├── data_pipeline/                 # Pipeline scripts
│   │   ├── download_datasets.py      # Dataset downloaders
│   │   ├── convert_formats.py        # Format conversion
│   │   ├── split_dataset.py          # Train/val splitting
│   │   ├── augment_data.py           # Augmentation pipeline
│   │   ├── generate_thermal.py       # Synthetic thermal generation
│   │   └── validate_dataset.py       # Data validation
│   │
│   └── training/                      # Training preparation
│       ├── prepare_yolov12.py        # YOLOv12 data prep
│       ├── prepare_rf_detr.py        # RF-DETR data prep
│       ├── prepare_sam3.py           # SAM3 data prep
│       └── export_tensorrt.py        # TensorRT export
│
├── configs/
│   ├── data_config.yaml              # Master class definitions
│   ├── train_yolov12.yaml            # YOLOv12 training config
│   ├── train_rf_detr.yaml            # RF-DETR training config
│   └── train_sam3.yaml               # SAM3 training config
│
└── docs/
    └── DATA_PIPELINE.md              # This document
```

---

## Class Definitions

### Detection Classes (0-29)

Classes are organized by inspection domain and aligned with `bahb/core/types.py:DetectionClass`:

```yaml
# Substation Equipment (0-7)
0: transformer          # Power transformers
1: insulator           # Ceramic/composite insulators
2: conductor           # Power lines, cables
3: switchgear          # Circuit breakers, switches
4: circuit_breaker     # Individual circuit breakers
5: disconnect_switch   # Disconnect switches
6: capacitor_bank      # Capacitor assemblies
7: lightning_arrester  # Surge arresters

# Data Center/Cooling (8-15)
8: server_rack         # Server cabinet/rack
9: hvac_unit          # HVAC systems
10: cooling_fan        # Cooling fans
11: electrical_panel   # Electrical distribution panels
12: cable              # Data/power cables
13: ups                # Uninterruptible power supply
14: pdu                # Power distribution unit
15: fire_suppression   # Fire suppression systems

# General (16-18)
16: vegetation         # Trees, bushes (clearance violations)
17: person             # Personnel
18: vehicle            # Service vehicles

# Hazards/Defects (19-25)
19: damage             # General physical damage
20: corrosion          # Rust, oxidation
21: hotspot            # Thermal anomaly
22: leak               # Oil/water leaks
23: crack              # Structural cracks
24: contamination      # Surface contamination
25: bird_nest          # Bird nests on equipment

# Reserved (26-29)
26: corona_discharge   # Electrical discharge
27: oil_stain          # Oil stain patterns
28: missing_component  # Missing parts
29: foreign_object     # Foreign objects on equipment
```

### Thermal Categories

Aligned with `bahb/thermal/analyzer.py:ThermalZone`:

```yaml
thermal_classes:
  hotspot_critical:
    description: "Critical temperature anomaly"
    delta_above_ambient: ">40°C"
    severity: critical
    color_code: "#FF0000"  # Red

  hotspot_warning:
    description: "Warning temperature anomaly"
    delta_above_ambient: "15-40°C"
    severity: warning
    color_code: "#FFA500"  # Orange

  hotspot_notice:
    description: "Notable temperature elevation"
    delta_above_ambient: "5-15°C"
    severity: info
    color_code: "#FFFF00"  # Yellow

  coldspot:
    description: "Abnormal cold area"
    delta_below_ambient: ">10°C"
    severity: warning
    color_code: "#00BFFF"  # Light blue

  normal:
    description: "Normal temperature range"
    delta_from_ambient: "<5°C"
    severity: none
    color_code: "#00FF00"  # Green
```

### Equipment-Specific Temperature Zones

From `configs/production.yaml`:

| Equipment | Normal (°C) | Warning (°C) | Critical (°C) |
|-----------|-------------|--------------|---------------|
| Transformer | 20-65 | 65-85 | 85-150 |
| Conductor | 15-50 | 50-75 | 75-120 |
| Switchgear | 20-55 | 55-75 | 75-110 |
| Insulator | 15-45 | 45-65 | 65-100 |
| Server | 25-45 | 45-60 | 60-85 |
| HVAC | 10-40 | 40-55 | 55-80 |

---

## Public Dataset Sources

### Substation Inspection

| Dataset | Classes | Size | Format | URL |
|---------|---------|------|--------|-----|
| TTPLA | Transmission towers, lines | 1,100 images | COCO | [GitHub](https://github.com/r3ab/ttpla) |
| CPLID | Insulators, defects | 2,462 images | VOC | [Mendeley](https://data.mendeley.com/datasets/n6wrv4ry6v/6) |
| Insulator Defect | Insulators, damage | 1,200 images | YOLO | [Kaggle](https://www.kaggle.com/datasets/insulator-defect) |
| Corona Discharge | Corona patterns | 500 images | Custom | Research datasets |

### Thermal Imaging

| Dataset | Classes | Size | Format | URL |
|---------|---------|------|--------|-----|
| FLIR ADAS | Vehicles, people, thermal | 26,442 images | COCO | [FLIR](https://www.flir.com/oem/adas/adas-dataset-form/) |
| Electrical Thermal | Panels, hotspots | 2,000 images | Custom | Industrial sources |
| KAIST Multispectral | RGB + Thermal pairs | 95,328 images | COCO | [KAIST](https://github.com/SoonminHwang/rgbt-ped-detection) |

### Data Center Equipment

| Dataset | Classes | Size | Format | URL |
|---------|---------|------|--------|-----|
| Server Room | Racks, cables, panels | Custom | YOLO | Internal collection |
| HVAC Detection | Cooling units, vents | Custom | COCO | Internal collection |

---

## Data Format Specifications

### YOLOv12 Format

```
data/processed/yolov12/
├── images/
│   ├── train/
│   │   ├── img_000001.jpg  # 1280x720 RGB
│   │   └── ...
│   └── val/
└── labels/
    ├── train/
    │   ├── img_000001.txt  # YOLO format
    │   └── ...
    └── val/
```

**Label format** (one line per object):
```
<class_id> <x_center> <y_center> <width> <height>
```

Example:
```
0 0.456 0.312 0.234 0.189
3 0.721 0.567 0.123 0.098
```

### RF-DETR Format (COCO)

```
data/processed/rf_detr/
├── train/
│   ├── img_000001.jpg  # 640x640 RGB
│   └── ...
├── val/
└── annotations/
    ├── train.json      # COCO format
    └── val.json
```

**Annotation structure**:
```json
{
  "images": [
    {"id": 1, "file_name": "img_000001.jpg", "width": 640, "height": 640}
  ],
  "annotations": [
    {
      "id": 1,
      "image_id": 1,
      "category_id": 0,
      "bbox": [x, y, width, height],
      "area": 1234,
      "iscrowd": 0,
      "segmentation": [[x1, y1, x2, y2, ...]]
    }
  ],
  "categories": [
    {"id": 0, "name": "transformer", "supercategory": "substation"}
  ]
}
```

### SAM3 Format

```
data/processed/sam3/
├── images/
│   ├── img_000001.jpg  # 1024x1024 RGB
│   └── ...
├── masks/
│   ├── img_000001/
│   │   ├── mask_0.png  # Binary mask per instance
│   │   ├── mask_1.png
│   │   └── ...
│   └── ...
└── prompts/
    └── prompts.json    # Point/box prompts
```

**Prompts format**:
```json
{
  "img_000001": {
    "points": [[512, 384], [256, 512]],
    "boxes": [[100, 100, 400, 300]],
    "labels": [1, 1]
  }
}
```

### Thermal Data Format

```
data/raw/thermal/
├── images/
│   ├── thermal_000001.png  # 640x512 16-bit radiometric
│   └── ...
├── colorized/
│   ├── thermal_000001.jpg  # 640x512 8-bit colorized
│   └── ...
└── metadata/
    └── thermal_metadata.json
```

**Metadata format**:
```json
{
  "thermal_000001": {
    "min_temp": -5.2,
    "max_temp": 87.3,
    "ambient_temp": 25.0,
    "emissivity": 0.95,
    "distance": 15.0,
    "camera": "H30T",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## Augmentation Pipeline

### Standard Augmentations

```python
# configs/augmentation.yaml
augmentation:
  geometric:
    horizontal_flip: 0.5
    vertical_flip: 0.0  # Infrastructure has orientation
    rotation_range: [-15, 15]
    scale_range: [0.8, 1.2]
    translate_range: [-0.1, 0.1]

  photometric:
    brightness_range: [-0.2, 0.2]
    contrast_range: [0.8, 1.2]
    saturation_range: [0.8, 1.2]
    hue_shift: 0.05

  noise:
    gaussian_noise: 0.02
    motion_blur_prob: 0.1
    motion_blur_kernel: [3, 7]

  cutout:
    prob: 0.3
    max_holes: 3
    max_size: 0.1
```

### H30T-Specific Augmentations

```python
# Simulates DJI H30T camera characteristics
h30t_simulation:
  # Wide camera simulation (4K)
  wide:
    resolution: [4096, 2160]
    lens_distortion: 0.02
    chromatic_aberration: 0.01

  # Zoom camera simulation
  zoom:
    resolution: [3840, 2160]
    zoom_levels: [5, 20, 50, 100, 200]
    digital_noise_at_zoom: true

  # Thermal camera simulation
  thermal:
    resolution: [640, 512]
    netd: 0.03  # Noise equivalent temperature difference
    temperature_range: [-40, 550]
    palettes: ["ironbow", "whitehot", "rainbow"]
```

### Drone Motion Simulation

```python
drone_motion:
  # Hover vibration
  vibration:
    frequency_range: [10, 50]  # Hz
    amplitude_range: [0.5, 2.0]  # pixels

  # Flight motion blur
  motion_blur:
    direction: "random"
    intensity_range: [0.5, 3.0]

  # Gimbal stabilization artifacts
  gimbal:
    stabilization_noise: 0.01
    jitter_prob: 0.05
```

### Thermal Augmentation

```python
thermal_augmentation:
  # Temperature variation
  temperature:
    ambient_shift: [-5, 5]  # °C
    local_hotspot_prob: 0.2
    gradient_noise: 0.05

  # Palette variations
  colormap:
    palettes: ["ironbow", "arctic", "rainbow", "grayscale"]
    random_palette_prob: 0.3

  # Atmospheric effects
  atmospheric:
    transmission_variation: [0.9, 1.0]
    reflection_simulation: 0.1
```

---

## Training Configurations

### YOLOv12 Training

```yaml
# configs/train_yolov12.yaml
model:
  architecture: "yolov12l"
  pretrained: "yolov12l.pt"
  input_size: [1280, 720]
  num_classes: 30

training:
  epochs: 100
  batch_size: 16
  optimizer:
    type: "AdamW"
    lr: 0.001
    weight_decay: 0.0005

  scheduler:
    type: "cosine"
    warmup_epochs: 3

  augmentation:
    mosaic: 1.0
    mixup: 0.1
    copy_paste: 0.1

data:
  train: "data/augmented/yolov12/train"
  val: "data/augmented/yolov12/val"
  workers: 8
  cache: true

device:
  gpu: 0
  half_precision: true

export:
  format: ["onnx", "tensorrt"]
  tensorrt_workspace: 4  # GB
  tensorrt_precision: "fp16"
```

### RF-DETR Training

```yaml
# configs/train_rf_detr.yaml
model:
  architecture: "rf_detr_large"
  backbone: "resnet101"
  pretrained: "detr-resnet-101"
  input_size: [640, 640]
  num_queries: 300
  num_classes: 30

training:
  epochs: 50
  batch_size: 8
  optimizer:
    type: "AdamW"
    lr: 0.0001
    lr_backbone: 0.00001
    weight_decay: 0.0001

  scheduler:
    type: "step"
    step_size: 40
    gamma: 0.1

  losses:
    classification_weight: 1.0
    bbox_weight: 5.0
    giou_weight: 2.0
    mask_weight: 1.0

data:
  train: "data/augmented/rf_detr/train"
  val: "data/augmented/rf_detr/val"
  annotations:
    train: "data/augmented/rf_detr/annotations/train.json"
    val: "data/augmented/rf_detr/annotations/val.json"

device:
  gpu: 0
  half_precision: true
```

### SAM3 Fine-tuning

```yaml
# configs/train_sam3.yaml
model:
  architecture: "sam3_nano"
  encoder: "vit_tiny"
  pretrained: "sam3_nano.pth"
  input_size: [1024, 1024]

training:
  epochs: 20
  batch_size: 4

  # Only fine-tune mask decoder
  freeze_encoder: true
  freeze_prompt_encoder: true

  optimizer:
    type: "AdamW"
    lr: 0.0001

  losses:
    focal_weight: 20.0
    dice_weight: 1.0
    iou_weight: 1.0

data:
  train: "data/augmented/sam3/train"
  val: "data/augmented/sam3/val"
  points_per_batch: 64

device:
  gpu: 0
  half_precision: true
```

---

## Pipeline Scripts

### 1. Download Datasets

```bash
# scripts/data_pipeline/download_datasets.py
python scripts/data_pipeline/download_datasets.py \
    --datasets ttpla,cplid,flir_adas \
    --output data/raw \
    --verify_checksums
```

### 2. Convert Formats

```bash
# scripts/data_pipeline/convert_formats.py
python scripts/data_pipeline/convert_formats.py \
    --input data/raw \
    --output data/processed \
    --target_format yolov12,rf_detr,sam3 \
    --class_mapping configs/data_config.yaml
```

### 3. Split Dataset

```bash
# scripts/data_pipeline/split_dataset.py
python scripts/data_pipeline/split_dataset.py \
    --input data/processed \
    --train_ratio 0.8 \
    --val_ratio 0.2 \
    --stratify_by_class
```

### 4. Augment Data

```bash
# scripts/data_pipeline/augment_data.py
python scripts/data_pipeline/augment_data.py \
    --input data/processed \
    --output data/augmented \
    --config configs/augmentation.yaml \
    --multiplier 3
```

### 5. Generate Thermal

```bash
# scripts/data_pipeline/generate_thermal.py
python scripts/data_pipeline/generate_thermal.py \
    --input data/processed/yolov12/images \
    --output data/augmented/thermal \
    --h30t_simulation \
    --count 5000
```

### 6. Validate Dataset

```bash
# scripts/data_pipeline/validate_dataset.py
python scripts/data_pipeline/validate_dataset.py \
    --dataset data/augmented \
    --format yolov12 \
    --check_labels \
    --check_images \
    --report validation_report.json
```

### Complete Pipeline

```bash
#!/bin/bash
# scripts/run_data_pipeline.sh

set -e

echo "=== BAHB Data Pipeline ==="

# Step 1: Download datasets
echo "[1/6] Downloading datasets..."
python scripts/data_pipeline/download_datasets.py \
    --datasets all \
    --output data/raw

# Step 2: Convert to unified format
echo "[2/6] Converting formats..."
python scripts/data_pipeline/convert_formats.py \
    --input data/raw \
    --output data/processed \
    --class_mapping configs/data_config.yaml

# Step 3: Split datasets
echo "[3/6] Splitting datasets..."
python scripts/data_pipeline/split_dataset.py \
    --input data/processed \
    --train_ratio 0.8 \
    --val_ratio 0.2

# Step 4: Generate synthetic thermal data
echo "[4/6] Generating thermal data..."
python scripts/data_pipeline/generate_thermal.py \
    --input data/processed \
    --output data/processed/thermal \
    --h30t_simulation

# Step 5: Apply augmentations
echo "[5/6] Augmenting data..."
python scripts/data_pipeline/augment_data.py \
    --input data/processed \
    --output data/augmented \
    --multiplier 3

# Step 6: Validate
echo "[6/6] Validating datasets..."
python scripts/data_pipeline/validate_dataset.py \
    --dataset data/augmented \
    --format all \
    --report data/validation_report.json

echo "=== Pipeline Complete ==="
echo "Datasets ready in data/augmented/"
```

---

## Training Preparation Scripts

### Prepare YOLOv12 Dataset

```python
# scripts/training/prepare_yolov12.py
"""
Prepares dataset for YOLOv12 training with BAHB class mappings.

Usage:
    python scripts/training/prepare_yolov12.py \
        --input data/augmented \
        --output data/final/yolov12 \
        --config configs/train_yolov12.yaml
"""

import yaml
from pathlib import Path
import shutil

def create_dataset_yaml(output_dir: Path, config: dict):
    """Generate YOLOv12 dataset.yaml"""
    dataset_yaml = {
        'path': str(output_dir),
        'train': 'images/train',
        'val': 'images/val',
        'nc': config['model']['num_classes'],
        'names': [
            'transformer', 'insulator', 'conductor', 'switchgear',
            'circuit_breaker', 'disconnect_switch', 'capacitor_bank',
            'lightning_arrester', 'server_rack', 'hvac_unit',
            'cooling_fan', 'electrical_panel', 'cable', 'ups', 'pdu',
            'fire_suppression', 'vegetation', 'person', 'vehicle',
            'damage', 'corrosion', 'hotspot', 'leak', 'crack',
            'contamination', 'bird_nest', 'corona_discharge',
            'oil_stain', 'missing_component', 'foreign_object'
        ]
    }

    with open(output_dir / 'dataset.yaml', 'w') as f:
        yaml.dump(dataset_yaml, f)

    print(f"Created dataset.yaml at {output_dir}")
```

### Prepare RF-DETR Dataset

```python
# scripts/training/prepare_rf_detr.py
"""
Prepares COCO-format dataset for RF-DETR training.

Usage:
    python scripts/training/prepare_rf_detr.py \
        --input data/augmented \
        --output data/final/rf_detr \
        --config configs/train_rf_detr.yaml
"""

import json
from pathlib import Path

def create_coco_annotations(image_dir: Path, label_dir: Path, output_file: Path):
    """Convert YOLO labels to COCO format."""
    annotations = {
        'images': [],
        'annotations': [],
        'categories': []
    }

    # Add categories (matches BAHB DetectionClass)
    categories = [
        {'id': 0, 'name': 'transformer', 'supercategory': 'substation'},
        {'id': 1, 'name': 'insulator', 'supercategory': 'substation'},
        # ... all 30 classes
    ]
    annotations['categories'] = categories

    # Process images and labels
    # ... conversion logic

    with open(output_file, 'w') as f:
        json.dump(annotations, f)
```

### Export to TensorRT

```python
# scripts/training/export_tensorrt.py
"""
Export trained models to TensorRT for Manifold 3 deployment.

Usage:
    python scripts/training/export_tensorrt.py \
        --model yolov12 \
        --weights runs/train/best.pt \
        --output data/exports/tensorrt \
        --device orin_nx
"""

def export_yolov12_tensorrt(weights: Path, output: Path, config: dict):
    """Export YOLOv12 to TensorRT."""
    from ultralytics import YOLO

    model = YOLO(weights)
    model.export(
        format='engine',
        imgsz=config['model']['input_size'],
        half=True,
        device=0,
        workspace=4,  # 4GB for Orin NX
        verbose=True
    )

def export_rf_detr_tensorrt(weights: Path, output: Path, config: dict):
    """Export RF-DETR to TensorRT via ONNX."""
    import torch
    import tensorrt as trt

    # Load PyTorch model
    model = load_rf_detr(weights)

    # Export to ONNX
    onnx_path = output / 'rf_detr.onnx'
    torch.onnx.export(
        model,
        torch.randn(1, 3, 640, 640),
        onnx_path,
        input_names=['input'],
        output_names=['logits', 'boxes'],
        dynamic_axes={'input': {0: 'batch'}}
    )

    # Convert to TensorRT
    # ... TensorRT conversion
```

---

## Quality Assurance

### Dataset Validation Checks

```python
# Validation criteria
validation_checks = {
    'image_checks': {
        'min_resolution': (320, 240),
        'max_resolution': (8192, 8192),
        'valid_formats': ['jpg', 'jpeg', 'png'],
        'corrupt_check': True,
    },
    'label_checks': {
        'valid_class_range': (0, 29),
        'bbox_range': (0.0, 1.0),
        'min_bbox_area': 0.0001,  # 0.01% of image
        'orphan_labels': True,    # Labels without images
        'orphan_images': True,    # Images without labels
    },
    'thermal_checks': {
        'valid_temp_range': (-50, 600),
        'resolution': (640, 512),
        'bit_depth': 16,
    }
}
```

### Class Distribution Report

```
┌─────────────────────────────────────────────────────────────┐
│                 CLASS DISTRIBUTION REPORT                    │
├─────────────────────────────────────────────────────────────┤
│ Class               │ Train   │ Val     │ Total   │ %      │
├─────────────────────┼─────────┼─────────┼─────────┼────────┤
│ transformer         │ 12,450  │ 3,112   │ 15,562  │ 12.3%  │
│ insulator           │ 18,230  │ 4,557   │ 22,787  │ 18.0%  │
│ conductor           │ 8,920   │ 2,230   │ 11,150  │ 8.8%   │
│ switchgear          │ 6,780   │ 1,695   │ 8,475   │ 6.7%   │
│ ...                 │ ...     │ ...     │ ...     │ ...    │
│ hotspot             │ 4,560   │ 1,140   │ 5,700   │ 4.5%   │
│ damage              │ 2,340   │ 585     │ 2,925   │ 2.3%   │
├─────────────────────┼─────────┼─────────┼─────────┼────────┤
│ TOTAL               │ 101,250 │ 25,312  │ 126,562 │ 100%   │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration with BAHB

### Model Configuration Alignment

The data pipeline outputs directly integrate with the existing BAHB model configurations:

```yaml
# configs/production.yaml alignment
models:
  yolov12:
    weights: "models/yolov12l-inspection.engine"  # → data/exports/tensorrt/
    input_size: [1280, 720]                        # → Matches training config
    classes: [...]                                  # → 30 classes from data_config.yaml

  rf_detr:
    weights: "models/rf_detr_large.engine"
    input_size: [640, 640]

  sam3_nano:
    encoder_weights: "models/sam3_nano_encoder.engine"
    decoder_weights: "models/sam3_nano_decoder.engine"
    input_size: [1024, 1024]
```

### Class Mapping Verification

```python
# Verify class alignment with bahb/core/types.py
from bahb.core.types import DetectionClass

def verify_class_mapping():
    """Ensure data pipeline classes match BAHB DetectionClass."""
    bahb_classes = [e.value for e in DetectionClass]
    pipeline_classes = load_yaml('configs/data_config.yaml')['classes']

    for idx, (bahb, pipeline) in enumerate(zip(bahb_classes, pipeline_classes)):
        assert bahb == pipeline['name'], f"Mismatch at {idx}: {bahb} vs {pipeline['name']}"

    print("✓ All classes aligned with BAHB DetectionClass")
```

---

## Performance Targets

| Model | Training Dataset | Target mAP | Inference (Orin NX) |
|-------|-----------------|------------|---------------------|
| YOLOv12-L | 100k+ images | >0.75 mAP@50 | ~2ms |
| RF-DETR | 50k+ images | >0.65 mAP@50 | ~15ms |
| SAM3 Nano | 20k+ masks | >0.85 IoU | ~8ms |

---

## Appendix: H30T Sensor Specifications

Reference specifications for data simulation:

| Sensor | Resolution | FPS | FOV | Notes |
|--------|------------|-----|-----|-------|
| Wide | 4096x2160 | 30 | 82.9° | 1/2" CMOS |
| Zoom | 3840x2160 | 30 | 0.4°-17° | 5x-200x optical |
| Thermal | 640x512 | 30 | 40.6° | Uncooled VOx, NETD <30mK |
| Laser RF | - | - | - | 1200m range, ±0.2m accuracy |
