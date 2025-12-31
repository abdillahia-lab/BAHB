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
import json
import shutil
from pathlib import Path
from PIL import Image
import random

PROJECT_ROOT = Path.cwd()
RAW_DIR = PROJECT_ROOT / "data" / "raw"
OUT_DIR = PROJECT_ROOT / "data" / "processed"

# BAHB class mapping - matches your inspection targets
CLASS_MAP = {
    # Insulators
    "insulator": 0, "glass_insulator": 0, "polymer_insulator": 0,
    "ceramic_insulator": 0, "insulator_string": 0,

    # Insulator defects
    "broken_insulator": 1, "broken_disc": 1, "glass_loss": 1,
    "insulator_damaged": 1, "broken": 1,

    # Contamination
    "glass_dirty": 2, "polymer_dirty": 2, "pollution_flashover": 2,
    "contamination": 2, "flashover": 2,

    # Towers/structures
    "tower": 3, "pylon": 3, "transmission_tower": 3, "pole": 3,

    # Conductors
    "conductor": 4, "cable": 4, "power_line": 4, "wire": 4,
    "broken_cable": 5, "damaged_cable": 5,

    # Hardware
    "damper": 6, "spacer": 7, "connector": 8,

    # Substation equipment
    "transformer": 9, "arrester": 10, "lightning_arrester": 10,
    "breaker": 11, "circuit_breaker": 11,
    "bushing": 12, "disconnector": 13,

    # Hazards
    "vegetation": 14, "bird_nest": 15, "nest": 15,
    "foreign_object": 16,
}

def get_class_id(name):
    name = name.lower().replace(" ", "_").replace("-", "_")
    return CLASS_MAP.get(name, -1)

def convert_coco_to_yolo(coco_file, img_dir, out_images, out_labels):
    """Convert COCO annotations to YOLO format."""
    with open(coco_file) as f:
        coco = json.load(f)

    cat_map = {c["id"]: c["name"] for c in coco.get("categories", [])}
    img_map = {i["id"]: i for i in coco.get("images", [])}

    # Group annotations by image
    ann_by_img = {}
    for ann in coco.get("annotations", []):
        img_id = ann["image_id"]
        if img_id not in ann_by_img:
            ann_by_img[img_id] = []
        ann_by_img[img_id].append(ann)

    count = 0
    for img_id, anns in ann_by_img.items():
        img_info = img_map.get(img_id)
        if not img_info:
            continue

        img_file = img_info["file_name"]
        img_w, img_h = img_info["width"], img_info["height"]

        # Find image file
        src = img_dir / img_file
        if not src.exists():
            src = img_dir / Path(img_file).name
        if not src.exists():
            continue

        # Convert annotations
        lines = []
        for ann in anns:
            cat_name = cat_map.get(ann["category_id"], "")
            cls_id = get_class_id(cat_name)
            if cls_id < 0:
                continue

            x, y, w, h = ann["bbox"]
            cx = (x + w/2) / img_w
            cy = (y + h/2) / img_h
            nw = w / img_w
            nh = h / img_h
            lines.append(f"{cls_id} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")

        if lines:
            out_name = f"img_{count:06d}"
            shutil.copy(src, out_images / f"{out_name}{src.suffix}")
            (out_labels / f"{out_name}.txt").write_text("\\n".join(lines))
            count += 1

    return count

def convert_yolo_to_yolo(src_dir, out_images, out_labels, start_idx=0):
    """Copy and remap YOLO format."""
    # Find images/labels dirs
    img_dir = src_dir / "train" / "images" if (src_dir / "train" / "images").exists() else src_dir / "images"
    lbl_dir = src_dir / "train" / "labels" if (src_dir / "train" / "labels").exists() else src_dir / "labels"

    if not img_dir.exists():
        return 0

    count = start_idx
    for img_path in img_dir.glob("*"):
        if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
            continue

        lbl_path = lbl_dir / f"{img_path.stem}.txt"
        if not lbl_path.exists():
            continue

        shutil.copy(img_path, out_images / f"img_{count:06d}{img_path.suffix}")
        shutil.copy(lbl_path, out_labels / f"img_{count:06d}.txt")
        count += 1

    return count - start_idx

# Process each dataset
out_images = OUT_DIR / "images"
out_labels = OUT_DIR / "labels"
out_images.mkdir(parents=True, exist_ok=True)
out_labels.mkdir(parents=True, exist_ok=True)

total = 0

# TTPLA (COCO format)
ttpla_dir = RAW_DIR / "ttpla"
for json_file in ttpla_dir.rglob("*.json"):
    if "annotation" in json_file.name.lower() or "instances" in json_file.name.lower():
        img_dir = json_file.parent
        n = convert_coco_to_yolo(json_file, img_dir, out_images, out_labels)
        print(f"  TTPLA: {n} images")
        total += n

# InsPLAD (COCO format)
insplad_dir = RAW_DIR / "insplad"
for json_file in insplad_dir.rglob("*.json"):
    if "annotation" in json_file.name.lower():
        img_dir = json_file.parent / "images" if (json_file.parent / "images").exists() else json_file.parent
        n = convert_coco_to_yolo(json_file, img_dir, out_images, out_labels)
        print(f"  InsPLAD: {n} images")
        total += n

# MPID (YOLO format)
mpid_dir = RAW_DIR / "mpid"
n = convert_yolo_to_yolo(mpid_dir, out_images, out_labels, total)
print(f"  MPID: {n} images")
total += n

# Roboflow datasets
roboflow_dir = RAW_DIR / "roboflow"
for dataset_dir in roboflow_dir.iterdir():
    if dataset_dir.is_dir():
        n = convert_yolo_to_yolo(dataset_dir, out_images, out_labels, total)
        print(f"  Roboflow/{dataset_dir.name}: {n} images")
        total += n

print(f"\\nTotal: {total} images converted")

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
        # Use YOLOv8 as base (YOLOv12 uses same ultralytics interface)
        base_weights = "yolov8l.pt"
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
