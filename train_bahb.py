#!/usr/bin/env python3
"""
BAHB Training Script
Run this in Claude Code to download datasets and train models.

Usage:
    cd ~/BAHB  # or wherever your BAHB repo is
    python train_bahb.py
"""

import subprocess
import sys
import os
from pathlib import Path

# Ensure we're in the BAHB directory
PROJECT_ROOT = Path.cwd()
if not (PROJECT_ROOT / "bahb").exists():
    print("ERROR: Run this script from the BAHB project root directory")
    print("  cd ~/BAHB && python train_bahb.py")
    sys.exit(1)


def run(cmd, cwd=None):
    """Run shell command."""
    print(f"\n>>> {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd or PROJECT_ROOT)
    if result.returncode != 0:
        print(f"Command failed with code {result.returncode}")
    return result.returncode == 0


def setup_directories():
    """Create data directories."""
    print("\n" + "="*60)
    print("STEP 1: Setting up directories")
    print("="*60)

    dirs = [
        "data/raw/ttpla",
        "data/raw/insplad",
        "data/raw/mpid",
        "data/raw/cplid",
        "data/raw/roboflow",
        "data/processed/train/images",
        "data/processed/train/labels",
        "data/processed/val/images",
        "data/processed/val/labels",
        "runs/yolov12",
        "runs/rf_detr",
    ]

    for d in dirs:
        (PROJECT_ROOT / d).mkdir(parents=True, exist_ok=True)
        print(f"  Created: {d}")


def download_datasets():
    """Download all public datasets."""
    print("\n" + "="*60)
    print("STEP 2: Downloading datasets")
    print("="*60)

    datasets = [
        ("ttpla", "https://github.com/R3ab/ttpla_dataset.git"),
        ("insplad", "https://github.com/andreluizbvs/InsPLAD.git"),
        ("mpid", "https://github.com/phd-benel/MPID.git"),
        ("cplid", "https://github.com/InsulatorData/InsulatorDataSet.git"),
    ]

    for name, url in datasets:
        target = PROJECT_ROOT / "data" / "raw" / name
        if any(target.iterdir()) if target.exists() else False:
            print(f"  [SKIP] {name} already exists")
        else:
            print(f"  [DOWNLOAD] {name}")
            run(f"git clone --depth 1 {url} {target}")


def download_roboflow():
    """Download Roboflow datasets."""
    print("\n" + "="*60)
    print("STEP 3: Downloading Roboflow datasets")
    print("="*60)

    # Install roboflow if needed
    run("pip install -q roboflow")

    roboflow_script = '''
from roboflow import Roboflow
from pathlib import Path
import os

output_dir = Path("data/raw/roboflow")

datasets = [
    ("project-vmgqx", "insulator-faults-detection", 1),
    ("pavithraa-sekar", "transmission-line-detection", 1),
    ("power-transmission-line", "84-vlr8w", 1),
]

rf = Roboflow()

for workspace, project, version in datasets:
    target = output_dir / project
    if target.exists() and any(target.iterdir()):
        print(f"  [SKIP] {project} already exists")
        continue

    try:
        print(f"  [DOWNLOAD] {project}")
        proj = rf.workspace(workspace).project(project)
        proj.version(version).download("yolov8", location=str(target))
    except Exception as e:
        print(f"  [ERROR] {project}: {e}")
'''

    script_path = PROJECT_ROOT / "_roboflow_download.py"
    script_path.write_text(roboflow_script)
    run(f"python {script_path}")
    script_path.unlink(missing_ok=True)


def convert_to_yolo():
    """Convert all datasets to unified YOLO format."""
    print("\n" + "="*60)
    print("STEP 4: Converting datasets to YOLO format")
    print("="*60)

    convert_script = '''
import xml.etree.ElementTree as ET
import shutil
from pathlib import Path
import random

PROJECT_ROOT = Path.cwd()
RAW_DIR = PROJECT_ROOT / "data" / "raw"
OUT_DIR = PROJECT_ROOT / "data" / "processed"

# BAHB class mapping
CLASS_MAP = {
    # Insulators (normal)
    "insulator": 0, "normal": 0, "good": 0,

    # Insulator defects
    "defect": 1, "broken": 1, "damaged": 1, "fault": 1,
    "broken_insulator": 1, "insulator_damaged": 1,
}

def get_class_id(name, default_class=0):
    """Get class ID, with fallback to default."""
    name = name.lower().replace(" ", "_").replace("-", "_")
    return CLASS_MAP.get(name, default_class)

def convert_voc_to_yolo(xml_file, img_dir, out_images, out_labels, start_idx, default_class=0):
    """Convert Pascal VOC XML to YOLO format."""
    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()

        # Get image dimensions
        size = root.find("size")
        if size is None:
            return 0
        img_w = int(size.find("width").text)
        img_h = int(size.find("height").text)

        if img_w == 0 or img_h == 0:
            return 0

        # Get filename
        filename_elem = root.find("filename")
        if filename_elem is None:
            return 0
        filename = filename_elem.text
        if not filename.endswith((".jpg", ".jpeg", ".png")):
            filename = filename + ".jpg"

        # Find image file
        img_path = img_dir / filename
        if not img_path.exists():
            # Try with same name as XML
            img_path = img_dir / (xml_file.stem + ".jpg")
        if not img_path.exists():
            return 0

        # Process objects
        lines = []
        for obj in root.findall("object"):
            name = obj.find("name").text if obj.find("name") is not None else ""
            cls_id = get_class_id(name, default_class)

            bbox = obj.find("bndbox")
            if bbox is None:
                continue

            xmin = float(bbox.find("xmin").text)
            ymin = float(bbox.find("ymin").text)
            xmax = float(bbox.find("xmax").text)
            ymax = float(bbox.find("ymax").text)

            # Convert to YOLO format (center x, center y, width, height) normalized
            cx = ((xmin + xmax) / 2) / img_w
            cy = ((ymin + ymax) / 2) / img_h
            w = (xmax - xmin) / img_w
            h = (ymax - ymin) / img_h

            # Clamp values
            cx = max(0, min(1, cx))
            cy = max(0, min(1, cy))
            w = max(0, min(1, w))
            h = max(0, min(1, h))

            lines.append(f"{cls_id} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")

        if lines or default_class == 0:  # Include images even without annotations for normal class
            out_name = f"img_{start_idx:06d}"
            shutil.copy(img_path, out_images / f"{out_name}{img_path.suffix}")
            (out_labels / f"{out_name}.txt").write_text("\\n".join(lines) if lines else "")
            return 1

        return 0
    except Exception as e:
        print(f"    Error processing {xml_file}: {e}")
        return 0

def convert_cplid(raw_dir, out_images, out_labels, start_idx):
    """Convert CPLID dataset (Pascal VOC format)."""
    cplid_dir = raw_dir / "cplid"
    if not cplid_dir.exists():
        print("  CPLID: Not found")
        return 0

    total = 0

    # Process defective insulators (class 1 - damaged)
    defect_dir = cplid_dir / "Defective_Insulators"
    if defect_dir.exists():
        img_dir = defect_dir / "images"
        label_dirs = [
            defect_dir / "labels" / "defect",
            defect_dir / "labels",
        ]

        for label_dir in label_dirs:
            if label_dir.exists():
                for xml_file in label_dir.glob("*.xml"):
                    n = convert_voc_to_yolo(
                        xml_file, img_dir, out_images, out_labels,
                        start_idx + total, default_class=1
                    )
                    total += n
                break

        print(f"  CPLID Defective: {total} images")

    # Process normal insulators (class 0 - normal)
    normal_dir = cplid_dir / "Normal_Insulators"
    if normal_dir.exists():
        img_dir = normal_dir / "images"
        label_dir = normal_dir / "labels"

        normal_count = 0
        if label_dir.exists():
            for xml_file in label_dir.glob("*.xml"):
                n = convert_voc_to_yolo(
                    xml_file, img_dir, out_images, out_labels,
                    start_idx + total, default_class=0
                )
                total += n
                normal_count += n

        print(f"  CPLID Normal: {normal_count} images")

    return total

def convert_yolo_to_yolo(src_dir, out_images, out_labels, start_idx=0):
    """Copy and remap YOLO format datasets."""
    # Find images/labels dirs
    img_dir = None
    lbl_dir = None

    for subdir in ["train", "valid", "val", ""]:
        test_img = src_dir / subdir / "images" if subdir else src_dir / "images"
        test_lbl = src_dir / subdir / "labels" if subdir else src_dir / "labels"
        if test_img.exists():
            img_dir = test_img
            lbl_dir = test_lbl
            break

    if img_dir is None or not img_dir.exists():
        return 0

    count = 0
    for img_path in img_dir.glob("*"):
        if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
            continue

        lbl_path = lbl_dir / f"{img_path.stem}.txt" if lbl_dir else None

        out_name = f"img_{start_idx + count:06d}"
        shutil.copy(img_path, out_images / f"{out_name}{img_path.suffix}")

        if lbl_path and lbl_path.exists():
            shutil.copy(lbl_path, out_labels / f"{out_name}.txt")
        else:
            (out_labels / f"{out_name}.txt").write_text("")

        count += 1

    return count

# Process each dataset
out_images = OUT_DIR / "images"
out_labels = OUT_DIR / "labels"
out_images.mkdir(parents=True, exist_ok=True)
out_labels.mkdir(parents=True, exist_ok=True)

total = 0

# CPLID (Pascal VOC format) - has actual images and annotations
n = convert_cplid(RAW_DIR, out_images, out_labels, total)
print(f"  CPLID Total: {n} images")
total += n

# Roboflow datasets (if downloaded)
roboflow_dir = RAW_DIR / "roboflow"
if roboflow_dir.exists():
    for dataset_dir in roboflow_dir.iterdir():
        if dataset_dir.is_dir() and any(dataset_dir.iterdir()):
            n = convert_yolo_to_yolo(dataset_dir, out_images, out_labels, total)
            if n > 0:
                print(f"  Roboflow/{dataset_dir.name}: {n} images")
                total += n

print(f"\\nTotal: {total} images converted")

if total == 0:
    print("ERROR: No images converted! Check dataset paths.")
    exit(1)

# Split into train/val
all_images = list(out_images.glob("*"))
random.seed(42)
random.shuffle(all_images)

split_idx = int(len(all_images) * 0.85)
train_imgs = all_images[:split_idx]
val_imgs = all_images[split_idx:]

for split_name, imgs in [("train", train_imgs), ("val", val_imgs)]:
    split_img_dir = OUT_DIR / split_name / "images"
    split_lbl_dir = OUT_DIR / split_name / "labels"
    split_img_dir.mkdir(parents=True, exist_ok=True)
    split_lbl_dir.mkdir(parents=True, exist_ok=True)

    for img in imgs:
        shutil.move(str(img), str(split_img_dir / img.name))
        lbl = out_labels / f"{img.stem}.txt"
        if lbl.exists():
            shutil.move(str(lbl), str(split_lbl_dir / lbl.name))

# Cleanup temp dirs
shutil.rmtree(out_images, ignore_errors=True)
shutil.rmtree(out_labels, ignore_errors=True)

print(f"Train: {len(train_imgs)}, Val: {len(val_imgs)}")
'''

    script_path = PROJECT_ROOT / "_convert.py"
    script_path.write_text(convert_script)
    run(f"python {script_path}")
    script_path.unlink(missing_ok=True)


def create_dataset_yaml():
    """Create dataset.yaml for training."""
    print("\n" + "="*60)
    print("STEP 5: Creating dataset config")
    print("="*60)

    yaml_content = f"""# BAHB Infrastructure Detection Dataset
path: {PROJECT_ROOT / 'data' / 'processed'}
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

    yaml_path = PROJECT_ROOT / "data" / "dataset.yaml"
    yaml_path.write_text(yaml_content)
    print(f"  Created: {yaml_path}")


def train_yolov12():
    """Train YOLOv12 model."""
    print("\n" + "="*60)
    print("STEP 6: Training YOLOv12")
    print("="*60)

    # Check if ultralytics is installed
    run("pip install -q ultralytics")

    dataset_yaml = PROJECT_ROOT / "data" / "dataset.yaml"

    # Check for existing YOLOv12 weights in bahb/models/yolov12/
    weights_dir = PROJECT_ROOT / "bahb" / "models" / "yolov12" / "weights"
    if weights_dir.exists() and list(weights_dir.glob("*.pt")):
        base_weights = list(weights_dir.glob("*.pt"))[0]
        print(f"  Using existing weights: {base_weights}")
    else:
        # Use YOLOv11 as base (latest available in ultralytics)
        base_weights = "yolo11l.pt"
        print(f"  Using base weights: {base_weights}")

    # Training command
    train_cmd = f"""
from ultralytics import YOLO

model = YOLO("{base_weights}")
results = model.train(
    data="{dataset_yaml}",
    epochs=100,
    imgsz=1280,
    batch=8,
    device=0,
    project="{PROJECT_ROOT / 'runs' / 'yolov12'}",
    name="bahb_infrastructure",
    patience=20,
    save=True,
    plots=True,
)
print("Training complete!")
print(f"Best model: {{results.save_dir}}/weights/best.pt")
"""

    script_path = PROJECT_ROOT / "_train.py"
    script_path.write_text(train_cmd)
    run(f"python {script_path}")
    script_path.unlink(missing_ok=True)


def main():
    print("="*60)
    print("BAHB MODEL TRAINING PIPELINE")
    print("="*60)
    print(f"Project root: {PROJECT_ROOT}")

    setup_directories()
    download_datasets()
    download_roboflow()
    convert_to_yolo()
    create_dataset_yaml()
    train_yolov12()

    print("\n" + "="*60)
    print("COMPLETE!")
    print("="*60)
    print(f"\nTrained model saved to: {PROJECT_ROOT}/runs/yolov12/bahb_infrastructure/weights/best.pt")
    print("\nTo use in BAHB app, copy weights to: bahb/models/yolov12/weights/")


if __name__ == "__main__":
    main()
