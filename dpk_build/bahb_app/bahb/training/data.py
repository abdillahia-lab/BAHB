"""
Training Data Management - Based on "Solving a Million-Step LLM Task with Zero Errors"

Key principles:
1. Data validation before training
2. Format conversion with verification
3. Dataset integrity checks
4. Automatic repair of common issues
"""

from __future__ import annotations

import hashlib
import json
import shutil
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from pathlib import Path
from typing import Any, Optional

import numpy as np
from loguru import logger


class DatasetFormat(Enum):
    """Supported dataset formats."""
    YOLO = auto()
    PASCAL_VOC = auto()
    COCO = auto()
    CUSTOM = auto()


class ValidationSeverity(Enum):
    """Data validation issue severity."""
    INFO = auto()
    WARNING = auto()
    ERROR = auto()
    CRITICAL = auto()


@dataclass
class ValidationIssue:
    """A single validation issue found in data."""
    severity: ValidationSeverity
    category: str
    message: str
    file_path: Optional[Path] = None
    can_auto_fix: bool = False


@dataclass
class DataValidationResult:
    """Result of data validation."""
    is_valid: bool
    total_images: int
    total_labels: int
    issues: list[ValidationIssue] = field(default_factory=list)
    class_distribution: dict[str, int] = field(default_factory=dict)
    fixes_applied: list[str] = field(default_factory=list)

    @property
    def error_count(self) -> int:
        return sum(1 for i in self.issues
                   if i.severity in (ValidationSeverity.ERROR, ValidationSeverity.CRITICAL))

    @property
    def warning_count(self) -> int:
        return sum(1 for i in self.issues if i.severity == ValidationSeverity.WARNING)

    def to_dict(self) -> dict:
        return {
            "is_valid": self.is_valid,
            "total_images": self.total_images,
            "total_labels": self.total_labels,
            "error_count": self.error_count,
            "warning_count": self.warning_count,
            "class_distribution": self.class_distribution,
            "fixes_applied": self.fixes_applied,
        }


class DataValidator:
    """
    Validates training data before use.

    Checks:
    - Image file integrity
    - Label format correctness
    - Bounding box validity
    - Class consistency
    - Train/val split balance
    """

    def __init__(
        self,
        dataset_format: DatasetFormat = DatasetFormat.YOLO,
        auto_fix: bool = True,
        strict_mode: bool = False,
    ):
        self.dataset_format = dataset_format
        self.auto_fix = auto_fix
        self.strict_mode = strict_mode

    def validate_dataset(
        self,
        data_dir: Path,
        classes: list[str] = None,
    ) -> DataValidationResult:
        """Validate an entire dataset directory."""
        issues = []
        fixes = []

        data_dir = Path(data_dir)
        if not data_dir.exists():
            return DataValidationResult(
                is_valid=False,
                total_images=0,
                total_labels=0,
                issues=[ValidationIssue(
                    severity=ValidationSeverity.CRITICAL,
                    category="directory",
                    message=f"Dataset directory does not exist: {data_dir}",
                )],
            )

        # Find images and labels
        image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
        images = []
        for ext in image_extensions:
            images.extend(data_dir.rglob(f"*{ext}"))
            images.extend(data_dir.rglob(f"*{ext.upper()}"))

        total_images = len(images)
        total_labels = 0
        class_counts: dict[str, int] = {}

        # Validate each image and its label
        for img_path in images:
            # Check image integrity
            img_issue = self._validate_image(img_path)
            if img_issue:
                issues.append(img_issue)
                continue

            # Find corresponding label
            label_path = self._find_label(img_path)

            if label_path is None:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    category="label",
                    message="No label file found",
                    file_path=img_path,
                ))
                continue

            total_labels += 1

            # Validate label format
            label_issues, label_classes = self._validate_label(
                label_path, img_path, classes
            )
            issues.extend(label_issues)

            # Count classes
            for cls in label_classes:
                class_counts[cls] = class_counts.get(cls, 0) + 1

        # Check class balance
        if class_counts:
            max_count = max(class_counts.values())
            min_count = min(class_counts.values())
            if max_count > 10 * min_count:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    category="balance",
                    message=f"Significant class imbalance: {max_count}:{min_count}",
                ))

        # Apply auto-fixes
        if self.auto_fix:
            for issue in issues:
                if issue.can_auto_fix:
                    fixed = self._auto_fix_issue(issue)
                    if fixed:
                        fixes.append(f"Fixed: {issue.message}")

        # Determine validity
        is_valid = (
            total_images > 0 and
            total_labels > 0 and
            not any(i.severity == ValidationSeverity.CRITICAL for i in issues)
        )

        if self.strict_mode:
            is_valid = is_valid and not any(
                i.severity == ValidationSeverity.ERROR for i in issues
            )

        return DataValidationResult(
            is_valid=is_valid,
            total_images=total_images,
            total_labels=total_labels,
            issues=issues,
            class_distribution=class_counts,
            fixes_applied=fixes,
        )

    def _validate_image(self, img_path: Path) -> Optional[ValidationIssue]:
        """Validate a single image file."""
        try:
            import cv2
            img = cv2.imread(str(img_path))
            if img is None:
                return ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    category="image",
                    message="Failed to read image",
                    file_path=img_path,
                )

            h, w = img.shape[:2]
            if h < 32 or w < 32:
                return ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    category="image",
                    message=f"Image too small: {w}x{h}",
                    file_path=img_path,
                )

            if h > 8192 or w > 8192:
                return ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    category="image",
                    message=f"Image very large: {w}x{h}",
                    file_path=img_path,
                )

        except Exception as e:
            return ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category="image",
                message=f"Error reading image: {e}",
                file_path=img_path,
            )

        return None

    def _find_label(self, img_path: Path) -> Optional[Path]:
        """Find label file for an image."""
        if self.dataset_format == DatasetFormat.YOLO:
            # YOLO: same name, .txt extension
            label_path = img_path.with_suffix(".txt")
            if label_path.exists():
                return label_path

            # Try labels subdirectory
            labels_dir = img_path.parent.parent / "labels" / img_path.parent.name
            label_path = labels_dir / img_path.with_suffix(".txt").name
            if label_path.exists():
                return label_path

        elif self.dataset_format == DatasetFormat.PASCAL_VOC:
            # VOC: same name, .xml extension
            label_path = img_path.with_suffix(".xml")
            if label_path.exists():
                return label_path

            # Try Annotations directory
            annot_dir = img_path.parent.parent / "Annotations"
            label_path = annot_dir / img_path.with_suffix(".xml").name
            if label_path.exists():
                return label_path

        elif self.dataset_format == DatasetFormat.COCO:
            # COCO uses single JSON file - return parent for checking
            for json_file in img_path.parent.parent.glob("*.json"):
                return json_file

        return None

    def _validate_label(
        self,
        label_path: Path,
        img_path: Path,
        valid_classes: list[str] = None,
    ) -> tuple[list[ValidationIssue], list[str]]:
        """Validate a label file."""
        issues = []
        classes_found = []

        if self.dataset_format == DatasetFormat.YOLO:
            issues, classes_found = self._validate_yolo_label(
                label_path, img_path, valid_classes
            )
        elif self.dataset_format == DatasetFormat.PASCAL_VOC:
            issues, classes_found = self._validate_voc_label(
                label_path, img_path, valid_classes
            )

        return issues, classes_found

    def _validate_yolo_label(
        self,
        label_path: Path,
        img_path: Path,
        valid_classes: list[str] = None,
    ) -> tuple[list[ValidationIssue], list[str]]:
        """Validate YOLO format label."""
        issues = []
        classes_found = []

        try:
            with open(label_path, 'r') as f:
                lines = f.readlines()

            if not lines:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    category="label",
                    message="Empty label file",
                    file_path=label_path,
                ))
                return issues, classes_found

            for i, line in enumerate(lines):
                line = line.strip()
                if not line:
                    continue

                parts = line.split()
                if len(parts) < 5:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        category="label",
                        message=f"Invalid YOLO format at line {i+1}",
                        file_path=label_path,
                        can_auto_fix=False,
                    ))
                    continue

                try:
                    class_id = int(parts[0])
                    x_center = float(parts[1])
                    y_center = float(parts[2])
                    width = float(parts[3])
                    height = float(parts[4])

                    # Validate ranges
                    if not (0 <= x_center <= 1):
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            category="bbox",
                            message=f"x_center out of range at line {i+1}: {x_center}",
                            file_path=label_path,
                            can_auto_fix=True,
                        ))

                    if not (0 <= y_center <= 1):
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            category="bbox",
                            message=f"y_center out of range at line {i+1}: {y_center}",
                            file_path=label_path,
                            can_auto_fix=True,
                        ))

                    if not (0 < width <= 1):
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            category="bbox",
                            message=f"width invalid at line {i+1}: {width}",
                            file_path=label_path,
                        ))

                    if not (0 < height <= 1):
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            category="bbox",
                            message=f"height invalid at line {i+1}: {height}",
                            file_path=label_path,
                        ))

                    classes_found.append(str(class_id))

                except ValueError as e:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        category="label",
                        message=f"Parse error at line {i+1}: {e}",
                        file_path=label_path,
                    ))

        except Exception as e:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category="label",
                message=f"Failed to read label: {e}",
                file_path=label_path,
            ))

        return issues, classes_found

    def _validate_voc_label(
        self,
        label_path: Path,
        img_path: Path,
        valid_classes: list[str] = None,
    ) -> tuple[list[ValidationIssue], list[str]]:
        """Validate Pascal VOC format label."""
        issues = []
        classes_found = []

        try:
            tree = ET.parse(label_path)
            root = tree.getroot()

            # Get image dimensions from annotation
            size = root.find("size")
            if size is None:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    category="label",
                    message="Missing size element in VOC annotation",
                    file_path=label_path,
                ))

            objects = root.findall("object")
            if not objects:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    category="label",
                    message="No objects in VOC annotation",
                    file_path=label_path,
                ))

            for obj in objects:
                name = obj.find("name")
                if name is None:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        category="label",
                        message="Object missing name",
                        file_path=label_path,
                    ))
                    continue

                class_name = name.text
                classes_found.append(class_name)

                if valid_classes and class_name not in valid_classes:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        category="class",
                        message=f"Unknown class: {class_name}",
                        file_path=label_path,
                    ))

                bndbox = obj.find("bndbox")
                if bndbox is None:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        category="bbox",
                        message=f"Object '{class_name}' missing bounding box",
                        file_path=label_path,
                    ))
                    continue

                # Validate bounding box
                try:
                    xmin = float(bndbox.find("xmin").text)
                    ymin = float(bndbox.find("ymin").text)
                    xmax = float(bndbox.find("xmax").text)
                    ymax = float(bndbox.find("ymax").text)

                    if xmax <= xmin:
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            category="bbox",
                            message=f"Invalid bbox: xmax <= xmin",
                            file_path=label_path,
                        ))

                    if ymax <= ymin:
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            category="bbox",
                            message=f"Invalid bbox: ymax <= ymin",
                            file_path=label_path,
                        ))

                except (AttributeError, ValueError) as e:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        category="bbox",
                        message=f"Bbox parse error: {e}",
                        file_path=label_path,
                    ))

        except ET.ParseError as e:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.CRITICAL,
                category="label",
                message=f"XML parse error: {e}",
                file_path=label_path,
            ))
        except Exception as e:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category="label",
                message=f"Failed to process VOC label: {e}",
                file_path=label_path,
            ))

        return issues, classes_found

    def _auto_fix_issue(self, issue: ValidationIssue) -> bool:
        """Attempt to auto-fix an issue."""
        if not issue.can_auto_fix or not issue.file_path:
            return False

        # Handle bbox out of range fixes
        if issue.category == "bbox" and "out of range" in issue.message:
            return self._fix_bbox_range(issue.file_path)

        return False

    def _fix_bbox_range(self, label_path: Path) -> bool:
        """Fix bounding box values out of [0, 1] range."""
        try:
            with open(label_path, 'r') as f:
                lines = f.readlines()

            fixed_lines = []
            for line in lines:
                parts = line.strip().split()
                if len(parts) >= 5:
                    class_id = parts[0]
                    x = max(0, min(1, float(parts[1])))
                    y = max(0, min(1, float(parts[2])))
                    w = max(0.001, min(1, float(parts[3])))
                    h = max(0.001, min(1, float(parts[4])))
                    fixed_lines.append(f"{class_id} {x:.6f} {y:.6f} {w:.6f} {h:.6f}\n")
                else:
                    fixed_lines.append(line)

            with open(label_path, 'w') as f:
                f.writelines(fixed_lines)

            return True
        except Exception:
            return False


class DatasetManager:
    """
    Manages dataset operations with validation.

    Features:
    - Format conversion
    - Train/val splitting
    - Data augmentation preparation
    - Dataset merging
    """

    def __init__(
        self,
        output_dir: Path,
        classes: list[str],
    ):
        self.output_dir = Path(output_dir)
        self.classes = classes
        self.validator = DataValidator()

    def convert_voc_to_yolo(
        self,
        voc_dir: Path,
        validate: bool = True,
    ) -> tuple[int, int, list[str]]:
        """
        Convert Pascal VOC format to YOLO format.

        Returns:
            Tuple of (converted_count, skipped_count, error_messages)
        """
        voc_dir = Path(voc_dir)
        errors = []

        # Find all XML files
        xml_files = list(voc_dir.rglob("*.xml"))

        if not xml_files:
            errors.append(f"No XML files found in {voc_dir}")
            return 0, 0, errors

        converted = 0
        skipped = 0

        for xml_path in xml_files:
            try:
                result = self._convert_single_voc_to_yolo(xml_path)
                if result:
                    converted += 1
                else:
                    skipped += 1
            except Exception as e:
                skipped += 1
                errors.append(f"Error converting {xml_path.name}: {e}")

        logger.info(f"Converted {converted} files, skipped {skipped}")

        return converted, skipped, errors

    def _convert_single_voc_to_yolo(self, xml_path: Path) -> bool:
        """Convert a single VOC annotation to YOLO format."""
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()

            # Get image dimensions
            size = root.find("size")
            if size is None:
                return False

            width = int(size.find("width").text)
            height = int(size.find("height").text)

            if width <= 0 or height <= 0:
                return False

            # Convert objects
            yolo_lines = []
            for obj in root.findall("object"):
                name = obj.find("name")
                if name is None:
                    continue

                class_name = name.text.strip().lower()

                # Map class name to ID
                if class_name in self.classes:
                    class_id = self.classes.index(class_name)
                else:
                    # Try to find similar class
                    class_id = self._find_similar_class(class_name)
                    if class_id is None:
                        continue

                bndbox = obj.find("bndbox")
                if bndbox is None:
                    continue

                xmin = float(bndbox.find("xmin").text)
                ymin = float(bndbox.find("ymin").text)
                xmax = float(bndbox.find("xmax").text)
                ymax = float(bndbox.find("ymax").text)

                # Convert to YOLO format (normalized x_center, y_center, width, height)
                x_center = ((xmin + xmax) / 2) / width
                y_center = ((ymin + ymax) / 2) / height
                bbox_width = (xmax - xmin) / width
                bbox_height = (ymax - ymin) / height

                # Clamp values
                x_center = max(0, min(1, x_center))
                y_center = max(0, min(1, y_center))
                bbox_width = max(0.001, min(1, bbox_width))
                bbox_height = max(0.001, min(1, bbox_height))

                yolo_lines.append(
                    f"{class_id} {x_center:.6f} {y_center:.6f} {bbox_width:.6f} {bbox_height:.6f}\n"
                )

            if not yolo_lines:
                return False

            # Write YOLO label file
            output_path = xml_path.with_suffix(".txt")
            with open(output_path, 'w') as f:
                f.writelines(yolo_lines)

            return True

        except Exception as e:
            logger.debug(f"Conversion error for {xml_path}: {e}")
            return False

    def _find_similar_class(self, class_name: str) -> Optional[int]:
        """Find similar class by name matching."""
        class_name = class_name.lower()

        # Direct mapping
        class_mapping = {
            "insulator": "insulator",
            "defect": "damage",
            "defective": "damage",
            "normal": None,  # Skip normal class
            "good": None,
        }

        if class_name in class_mapping:
            mapped = class_mapping[class_name]
            if mapped is None:
                return None
            if mapped in self.classes:
                return self.classes.index(mapped)

        # Fuzzy matching
        for i, cls in enumerate(self.classes):
            if class_name in cls or cls in class_name:
                return i

        return None

    def create_split(
        self,
        source_dir: Path,
        train_ratio: float = 0.85,
        shuffle: bool = True,
        seed: int = 42,
    ) -> tuple[Path, Path]:
        """
        Create train/val split.

        Returns:
            Tuple of (train_dir, val_dir)
        """
        source_dir = Path(source_dir)

        # Find all images
        image_extensions = {".jpg", ".jpeg", ".png", ".bmp"}
        images = []
        for ext in image_extensions:
            images.extend(source_dir.rglob(f"*{ext}"))
            images.extend(source_dir.rglob(f"*{ext.upper()}"))

        if not images:
            raise ValueError(f"No images found in {source_dir}")

        # Shuffle
        if shuffle:
            np.random.seed(seed)
            np.random.shuffle(images)

        # Split
        split_idx = int(len(images) * train_ratio)
        train_images = images[:split_idx]
        val_images = images[split_idx:]

        # Create output directories
        train_dir = self.output_dir / "train"
        val_dir = self.output_dir / "val"

        train_img_dir = train_dir / "images"
        train_lbl_dir = train_dir / "labels"
        val_img_dir = val_dir / "images"
        val_lbl_dir = val_dir / "labels"

        for d in [train_img_dir, train_lbl_dir, val_img_dir, val_lbl_dir]:
            d.mkdir(parents=True, exist_ok=True)

        # Copy files
        self._copy_dataset_files(train_images, train_img_dir, train_lbl_dir)
        self._copy_dataset_files(val_images, val_img_dir, val_lbl_dir)

        logger.info(f"Created split: {len(train_images)} train, {len(val_images)} val")

        return train_dir, val_dir

    def _copy_dataset_files(
        self,
        images: list[Path],
        img_dir: Path,
        lbl_dir: Path,
    ) -> None:
        """Copy image and label files to destination."""
        for img_path in images:
            # Copy image
            dst_img = img_dir / img_path.name
            shutil.copy2(img_path, dst_img)

            # Copy label if exists
            label_path = img_path.with_suffix(".txt")
            if label_path.exists():
                dst_lbl = lbl_dir / label_path.name
                shutil.copy2(label_path, dst_lbl)

    def create_yaml(
        self,
        output_path: Path = None,
        train_dir: Path = None,
        val_dir: Path = None,
    ) -> Path:
        """Create YOLO dataset YAML file."""
        output_path = output_path or self.output_dir / "dataset.yaml"
        train_dir = train_dir or self.output_dir / "train"
        val_dir = val_dir or self.output_dir / "val"

        yaml_content = f"""# BAHB Infrastructure Detection Dataset
# Auto-generated with validation

path: {self.output_dir.absolute()}
train: {train_dir.relative_to(self.output_dir) if train_dir.is_relative_to(self.output_dir) else train_dir}
val: {val_dir.relative_to(self.output_dir) if val_dir.is_relative_to(self.output_dir) else val_dir}

nc: {len(self.classes)}
names: {self.classes}
"""

        with open(output_path, 'w') as f:
            f.write(yaml_content)

        logger.info(f"Created dataset YAML: {output_path}")
        return output_path

    def get_dataset_stats(self, dataset_dir: Path) -> dict:
        """Get statistics about a dataset."""
        dataset_dir = Path(dataset_dir)

        stats = {
            "total_images": 0,
            "total_labels": 0,
            "class_counts": {},
            "avg_objects_per_image": 0,
        }

        image_extensions = {".jpg", ".jpeg", ".png", ".bmp"}
        images = []
        for ext in image_extensions:
            images.extend(dataset_dir.rglob(f"*{ext}"))

        stats["total_images"] = len(images)

        total_objects = 0
        for img_path in images:
            label_path = img_path.with_suffix(".txt")
            if not label_path.exists():
                # Try labels subdirectory
                labels_dir = img_path.parent.parent / "labels"
                label_path = labels_dir / img_path.with_suffix(".txt").name

            if label_path.exists():
                stats["total_labels"] += 1
                with open(label_path, 'r') as f:
                    lines = f.readlines()

                for line in lines:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        class_id = int(parts[0])
                        class_name = self.classes[class_id] if class_id < len(self.classes) else f"class_{class_id}"
                        stats["class_counts"][class_name] = stats["class_counts"].get(class_name, 0) + 1
                        total_objects += 1

        if stats["total_labels"] > 0:
            stats["avg_objects_per_image"] = total_objects / stats["total_labels"]

        return stats
