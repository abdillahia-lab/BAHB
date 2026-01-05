# BAHB Refactoring Suggestions

**Goal**: Improve code quality, readability, and maintainability through targeted refactorings.

---

## 1. Function Complexity Reduction

### 1.1 Pipeline `process_frame()` Method

**Current**: 140+ lines in single method
**File**: `bahb/models/pipeline.py` lines 197-353

**Problem**:
```python
async def process_frame(self, frame_data, thermal_data):
    # Line 197-353 (156 lines total)
    # Too much logic in one function:
    # - Frame validation
    # - YOLO inference
    # - RF-DETR inference
    # - SAM3 segmentation
    # - Anomaly detection
    # - VLM analysis
    # - Metrics update
    # - Result construction
```

**Refactored**:
```python
async def process_frame(
    self,
    frame_data: FrameData,
    thermal_data: Optional[ThermalReading] = None,
) -> InspectionResult:
    """Process single frame through pipeline."""
    start_time = time.perf_counter()

    # Validate input
    image = self._get_primary_image(frame_data)
    if image is None:
        return self._empty_result(frame_data)

    # Stage 1: Detection
    detections = await self._run_detection(image)

    # Stage 2: Segmentation (if needed)
    segmentations = await self._run_segmentation(image, detections)

    # Stage 3: Anomaly detection
    anomalies = self._detect_anomalies(
        image, detections, segmentations, thermal_data, frame_data.location
    )

    # Stage 4: VLM analysis (conditional)
    vlm_result = await self._run_vlm_analysis(
        image, detections, anomalies, thermal_data
    )

    # Build result
    total_time = (time.perf_counter() - start_time) * 1000
    return self._build_result(
        frame_data, detections, segmentations,
        thermal_data, anomalies, vlm_result, total_time
    )

# Extract methods (each 10-30 lines):

def _get_primary_image(self, frame_data: FrameData) -> Optional[NDArray]:
    """Get primary image from frame data."""
    return frame_data.wide_image or frame_data.zoom_image

async def _run_detection(self, image: NDArray) -> list[Detection]:
    """Run YOLO detection."""
    if not self.yolo or not self.yolo.is_loaded:
        return []

    if self.enable_tracking:
        return self.yolo.detect_with_tracking(image)
    return self.yolo(image)

async def _run_segmentation(
    self, image: NDArray, detections: list[Detection]
) -> list[Segmentation]:
    """Run detailed segmentation on important detections."""
    if not self.rf_detr or not self.rf_detr.is_loaded or not detections:
        return []

    important = self._filter_important_detections(detections)
    if not important:
        return []

    _, segmentations = self.rf_detr(image)
    return segmentations

# ... etc
```

**Benefits**:
- Each method < 30 lines
- Clear separation of concerns
- Easier to test individually
- Easier to understand flow

---

### 1.2 Training Script Main Function

**Current**: `train_bahb.py` main() is 22 lines calling sequential functions
**Better**: Use a class-based approach

**Refactored**:
```python
class TrainingPipeline:
    """Manages the complete training workflow."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.data_dir = project_root / "data"
        self.runs_dir = project_root / "runs"

    def run(self, config: TrainingConfig):
        """Execute full training pipeline."""
        steps = [
            ("Setup directories", self.setup_directories),
            ("Download datasets", self.download_datasets),
            ("Convert to YOLO", self.convert_datasets),
            ("Create config", self.create_dataset_yaml),
            ("Train model", self.train_model),
        ]

        for name, step_func in steps:
            print(f"\n{'='*60}")
            print(f"STEP: {name}")
            print("="*60)
            try:
                step_func(config)
            except Exception as e:
                print(f"ERROR in {name}: {e}")
                raise

        print("\nTraining pipeline complete!")

    def setup_directories(self, config):
        """Create necessary directories."""
        for dir_path in [self.data_dir / "raw", self.data_dir / "processed", ...]:
            dir_path.mkdir(parents=True, exist_ok=True)

    # ... other methods
```

**Benefits**:
- State management (self.project_root, etc)
- Easier to test individual steps
- Clear error handling
- Reusable components

---

## 2. Eliminate Inline Code Generation

### 2.1 Roboflow Download Script

**Current**: Lines 89-122 in `train_bahb.py`

**Problem**:
```python
roboflow_script = '''
from roboflow import Roboflow
from pathlib import Path
# ... 50 lines of embedded Python code ...
'''

script_path = PROJECT_ROOT / "_roboflow_download.py"
script_path.write_text(roboflow_script)
run(f"python {script_path}")
script_path.unlink(missing_ok=True)
```

**Refactored**: `bahb/training/dataset_download.py`
```python
"""Dataset download utilities."""
from pathlib import Path
from roboflow import Roboflow

def download_roboflow_datasets(
    output_dir: str | Path,
    datasets: list[tuple[str, str, int]] = None
) -> int:
    """
    Download datasets from Roboflow.

    Args:
        output_dir: Directory to save datasets
        datasets: List of (workspace, project, version) tuples

    Returns:
        Number of datasets downloaded
    """
    if datasets is None:
        datasets = [
            ("project-vmgqx", "insulator-faults-detection", 1),
            ("pavithraa-sekar", "transmission-line-detection", 1),
            ("power-transmission-line", "84-vlr8w", 1),
        ]

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    rf = Roboflow()
    downloaded = 0

    for workspace, project, version in datasets:
        target = output_path / project
        if target.exists() and any(target.iterdir()):
            print(f"  [SKIP] {project} already exists")
            continue

        try:
            print(f"  [DOWNLOAD] {project}")
            proj = rf.workspace(workspace).project(project)
            proj.version(version).download("yolov8", location=str(target))
            downloaded += 1
        except Exception as e:
            print(f"  [ERROR] {project}: {e}")

    return downloaded
```

**Usage**:
```python
from bahb.training.dataset_download import download_roboflow_datasets

# Clean, testable code
count = download_roboflow_datasets("data/raw/roboflow")
print(f"Downloaded {count} datasets")
```

**Benefits**:
- Syntax checking at write time
- IDE autocomplete and type hints
- Can be imported and tested
- No temp files created

---

### 2.2 Dataset Conversion Script

**Current**: Lines 130-368 (238 lines!) as string in `train_bahb.py`

**Refactored**: `bahb/training/dataset_converter.py`
```python
"""Dataset format conversion utilities."""
from pathlib import Path
import xml.etree.ElementTree as ET
import shutil
import random

class DatasetConverter:
    """Convert various dataset formats to YOLO format."""

    # Class mapping for infrastructure detection
    CLASS_MAP = {
        "insulator": 0,
        "normal": 0,
        "good": 0,
        "defect": 1,
        "broken": 1,
        "damaged": 1,
        "fault": 1,
        "broken_insulator": 1,
        "insulator_damaged": 1,
    }

    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def convert_cplid(self, cplid_dir: Path) -> int:
        """Convert CPLID dataset (Pascal VOC format)."""
        # Extracted from inline script
        # Now properly formatted with docstrings
        # Can be tested independently
        ...

    def convert_voc_to_yolo(
        self,
        xml_file: Path,
        img_dir: Path,
        out_images: Path,
        out_labels: Path,
        start_idx: int = 0,
        default_class: int = 0
    ) -> int:
        """Convert single Pascal VOC XML to YOLO format."""
        # Extracted logic, properly indented
        # Clear function signature
        # Type hints for all parameters
        ...

    def split_train_val(
        self,
        images_dir: Path,
        labels_dir: Path,
        train_ratio: float = 0.85,
        seed: int = 42
    ) -> tuple[int, int]:
        """Split dataset into train/val sets."""
        random.seed(seed)

        all_images = list(images_dir.glob("*"))
        random.shuffle(all_images)

        split_idx = int(len(all_images) * train_ratio)
        train_imgs = all_images[:split_idx]
        val_imgs = all_images[split_idx:]

        # Move images and labels
        for split_name, imgs in [("train", train_imgs), ("val", val_imgs)]:
            # ...

        return len(train_imgs), len(val_imgs)
```

**Benefits**:
- 238 lines now properly formatted and documented
- Can unit test each method
- Reusable across different projects
- Clear API

---

## 3. Simplify Configuration Loading

### 3.1 Current Config System

**Problem**: Complex nested structure with environment variable expansion

```python
# Current: 346 lines in config.py
class Config(BaseSettings):
    # 14 top-level fields
    camera: H30TConfig = Field(default_factory=H30TConfig)
    models: ModelsConfig = Field(default_factory=ModelsConfig)
    thermal: ThermalAnalysisConfig = Field(default_factory=ThermalAnalysisConfig)
    # ... 10 more nested configs

    @classmethod
    def _expand_env_vars(cls, data: Any) -> Any:
        # Recursive environment variable expansion
        ...

    @classmethod
    def _flatten_config(cls, data: dict) -> dict:
        # Complex YAML flattening logic
        ...
```

**Refactored**: Simple, flat structure
```python
from pydantic import BaseModel, Field
from pathlib import Path
import yaml

class SimpleConfig(BaseModel):
    """Simplified configuration for BAHB."""

    # System
    data_dir: Path = Field(default=Path("./data"))
    log_level: str = "INFO"
    device: str = "cuda:0"

    # Model
    model_path: Path = Field(default=Path("runs/yolov12/bahb_v2/weights/best.pt"))
    confidence_threshold: float = 0.35
    iou_threshold: float = 0.45

    # Thermal
    thermal_enabled: bool = False
    thermal_baseline_temp: float = 25.0

    # Camera (optional)
    camera_enabled: bool = False
    camera_url: str = ""

    @classmethod
    def from_yaml(cls, path: str | Path) -> "SimpleConfig":
        """Load from YAML file."""
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls(**data)

    @classmethod
    def from_env(cls) -> "SimpleConfig":
        """Load from environment variables with BAHB_ prefix."""
        import os
        return cls(
            data_dir=os.getenv("BAHB_DATA_DIR", "./data"),
            log_level=os.getenv("BAHB_LOG_LEVEL", "INFO"),
            device=os.getenv("BAHB_DEVICE", "cuda:0"),
            # ... simple getenv() calls
        )
```

**YAML becomes simpler**:
```yaml
# configs/simple.yaml
data_dir: "./data"
log_level: "INFO"
device: "cuda:0"
model_path: "runs/yolov12/bahb_v2/weights/best.pt"
confidence_threshold: 0.35
iou_threshold: 0.45
thermal_enabled: false
thermal_baseline_temp: 25.0
camera_enabled: false
```

**Benefits**:
- 84 params → 10 params
- No nested structures
- No complex flattening logic
- Easy for utility workers to understand

---

## 4. Improve Error Handling

### 4.1 Current Pattern

**Problem**: Generic exceptions, unclear error messages
```python
async def initialize(self) -> bool:
    try:
        # ... initialization code
        return True
    except Exception as e:
        logger.error(f"Engine initialization failed: {e}")
        return False
```

**Issues**:
- User doesn't know what failed
- No guidance on how to fix
- Silent failures (returns False)

**Refactored**:
```python
class InitializationError(Exception):
    """Raised when system initialization fails."""
    pass

async def initialize(self) -> bool:
    """
    Initialize all engine components.

    Returns:
        True if initialization successful

    Raises:
        InitializationError: If critical components fail to load
    """
    # Camera
    try:
        self.camera = H30TCamera(self.config.camera)
        self.camera.set_frame_callback(self._on_camera_frame)
        logger.info("Camera initialized successfully")
    except Exception as e:
        if self.config.camera.enabled:
            raise InitializationError(
                f"Failed to initialize camera. Is the H30T connected?\n"
                f"Error: {e}\n"
                f"Try: Check camera connection or set camera_enabled=false in config"
            )
        else:
            logger.info("Camera disabled, skipping initialization")

    # AI Pipeline
    try:
        self.pipeline = InferencePipeline(self.config)
        if not await self.pipeline.initialize():
            raise InitializationError(
                "AI pipeline failed to load.\n"
                "Possible causes:\n"
                "- Model file not found (check model_path in config)\n"
                "- CUDA not available (set device='cpu' in config)\n"
                "- Insufficient GPU memory (try smaller model)\n"
            )
        logger.info("AI pipeline initialized successfully")
    except InitializationError:
        raise
    except Exception as e:
        raise InitializationError(f"Unexpected error loading AI pipeline: {e}")

    return True
```

**Benefits**:
- Clear error messages
- Actionable guidance
- Distinguishes expected vs unexpected errors

---

## 5. Reduce Type Complexity

### 5.1 Deeply Nested Types

**Current**: `InspectionResult` has 11 fields, many complex types

```python
@dataclass
class InspectionResult:
    frame_id: int
    timestamp: datetime
    location: Optional[GeoLocation]
    detections: list[Detection]
    segmentations: list[Segmentation]
    thermal_reading: Optional[ThermalReading]
    anomalies: list[Anomaly]
    vlm_description: Optional[str]
    vlm_recommendations: Optional[list[str]]
    inference_time_ms: float

    def to_dict(self) -> dict:
        # 15 lines of dict conversion
        ...
```

**Refactored**: Simpler core, optional extensions

```python
@dataclass
class DetectionResult:
    """Simple detection result (essential fields only)."""
    frame_id: int
    timestamp: datetime
    detections: list[Detection]
    inference_time_ms: float

    def to_dict(self) -> dict:
        return {
            "frame_id": self.frame_id,
            "timestamp": self.timestamp.isoformat(),
            "detections": [d.to_dict() for d in self.detections],
            "inference_time_ms": self.inference_time_ms,
        }

@dataclass
class InspectionResult(DetectionResult):
    """Extended result with thermal and anomaly analysis."""
    location: Optional[GeoLocation] = None
    thermal_reading: Optional[ThermalReading] = None
    anomalies: list[Anomaly] = field(default_factory=list)

    def to_dict(self) -> dict:
        base = super().to_dict()
        base.update({
            "location": self.location.to_dict() if self.location else None,
            "thermal": self.thermal_reading.to_dict() if self.thermal_reading else None,
            "anomalies": [a.to_dict() for a in self.anomalies],
        })
        return base
```

**Benefits**:
- Simple use case (DetectionResult) is simple
- Advanced features (InspectionResult) inherit from base
- Clear hierarchy

---

## 6. Consolidate Similar Functions

### 6.1 Augmentation Duplicate Code

**Problem**: Same augmentations in 2 files with different APIs

**adversarial_images.py**:
```python
def add_fog(self, image: np.ndarray, intensity: float = 0.5) -> np.ndarray:
    """Add realistic fog effect."""
    fog_layer = np.ones_like(image, dtype=np.float32) * 255
    # ... 15 lines of CV2 code
    return result
```

**robustness_testing.py**:
```python
def get_weather_augmentations(self, severity='medium'):
    """Weather-related augmentations: fog, rain, snow."""
    if severity == 'medium':
        return A.Compose([
            A.OneOf([
                A.RandomFog(fog_coef_lower=0.3, fog_coef_upper=0.6, p=1.0),
                # ...
            ])
        ])
```

**Unified**: `bahb/testing/augmentation.py`
```python
"""Unified augmentation module using Albumentations."""
import albumentations as A
from albumentations.pytorch import ToTensorV2

class AugmentationFactory:
    """Factory for creating augmentation pipelines."""

    @staticmethod
    def training(strength='medium'):
        """Get augmentation pipeline for training."""
        if strength == 'light':
            return A.Compose([
                A.HorizontalFlip(p=0.5),
                A.RandomBrightnessContrast(p=0.3, brightness_limit=0.1, contrast_limit=0.1),
            ])
        # ... medium, heavy

    @staticmethod
    def weather(severity='medium'):
        """Weather augmentations for testing."""
        severities = {
            'light': (0.1, 0.3),
            'medium': (0.3, 0.6),
            'heavy': (0.6, 0.9),
        }
        fog_range = severities[severity]

        return A.Compose([
            A.OneOf([
                A.RandomFog(fog_coef_lower=fog_range[0], fog_coef_upper=fog_range[1], p=1.0),
                A.RandomRain(brightness_coefficient=0.8, drop_width=2, blur_value=5, p=1.0),
                A.RandomSnow(brightness_coeff=2.0, p=1.0),
            ], p=1.0)
        ])

    @staticmethod
    def lighting(severity='medium'):
        """Lighting augmentations for testing."""
        # ...

# Simple CLI
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--type", choices=['weather', 'lighting', 'blur'], default='weather')
    parser.add_argument("--severity", choices=['light', 'medium', 'heavy'], default='medium')

    args = parser.parse_args()

    # Apply augmentations
    factory = AugmentationFactory()
    aug = getattr(factory, args.type)(args.severity)
    # ... process images
```

**Benefits**:
- One implementation (Albumentations)
- Consistent API
- Delete 400+ lines of duplicate CV2 code
- Easier to maintain

---

## 7. Improve CLI Design

### 7.1 Current Main Script

**Problem**: Many flags, unclear usage
```python
parser.add_argument("--config", type=str, help="Path to configuration file")
parser.add_argument("--profile", type=str, choices=[...], default="substation")
parser.add_argument("--site", type=str, default="Unknown Site")
parser.add_argument("--pilot", type=str, default="")
parser.add_argument("--duration", type=int, help="Inspection duration...")
parser.add_argument("--image", type=str, help="Process single image...")
parser.add_argument("--thermal", type=str, help="Thermal image...")
parser.add_argument("--output", type=str, default="./output")
parser.add_argument("--no-report", action="store_true")
parser.add_argument("--dev", action="store_true")
parser.add_argument("--visualize", action="store_true")
parser.add_argument("--log-level", type=str, choices=[...])
parser.add_argument("--log-file", type=str)
```

**Refactored**: Subcommands for clarity
```python
def create_cli():
    """Create BAHB CLI with subcommands."""
    parser = argparse.ArgumentParser(
        prog="bahb",
        description="BAHB - Power Infrastructure Detection System"
    )
    parser.add_argument("--version", action="version", version=f"BAHB {__version__}")

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Detect command (most common)
    detect_parser = subparsers.add_parser(
        "detect",
        help="Run detection on images"
    )
    detect_parser.add_argument("input", help="Image file or directory")
    detect_parser.add_argument("--output", default="./results", help="Output directory")
    detect_parser.add_argument("--conf", type=float, default=0.35, help="Confidence threshold")
    detect_parser.add_argument("--visualize", action="store_true", help="Show results")

    # Inspect command (live inspection)
    inspect_parser = subparsers.add_parser(
        "inspect",
        help="Run live inspection (requires drone)"
    )
    inspect_parser.add_argument("--site", required=True, help="Site name")
    inspect_parser.add_argument("--profile", choices=["substation", "datacenter"],
                                default="substation")
    inspect_parser.add_argument("--duration", type=int, help="Duration in seconds")

    # Train command
    train_parser = subparsers.add_parser(
        "train",
        help="Train a new model"
    )
    train_parser.add_argument("--data", default="data/dataset.yaml", help="Dataset config")
    train_parser.add_argument("--epochs", type=int, default=50, help="Training epochs")
    train_parser.add_argument("--batch", type=int, default=8, help="Batch size")

    return parser

# Usage:
# bahb detect image.jpg
# bahb detect images/ --output results/ --visualize
# bahb inspect --site "Main Substation" --profile substation
# bahb train --epochs 100 --batch 16
```

**Benefits**:
- Clear separation of use cases
- Fewer flags per command
- More intuitive for users
- Easier to extend

---

## 8. Add Defensive Programming

### 8.1 Input Validation

**Current**: Assumes inputs are valid
```python
async def process_frame(self, frame_data, thermal_data):
    image = frame_data.wide_image
    # What if image is None?
    # What if image has wrong shape?
    results = self.yolo(image)
```

**Refactored**: Validate early
```python
async def process_frame(
    self,
    frame_data: FrameData,
    thermal_data: Optional[ThermalReading] = None
) -> InspectionResult:
    """Process frame with input validation."""

    # Validate frame data
    if frame_data is None:
        raise ValueError("frame_data cannot be None")

    if not isinstance(frame_data, FrameData):
        raise TypeError(f"Expected FrameData, got {type(frame_data)}")

    # Get image with fallbacks
    image = frame_data.wide_image
    if image is None:
        image = frame_data.zoom_image

    if image is None:
        logger.warning(f"No image in frame {frame_data.frame_id}, returning empty result")
        return InspectionResult(
            frame_id=frame_data.frame_id,
            timestamp=frame_data.timestamp,
            location=frame_data.location,
            detections=[],
        )

    # Validate image shape
    if len(image.shape) != 3 or image.shape[2] != 3:
        raise ValueError(
            f"Invalid image shape: {image.shape}. Expected (H, W, 3) color image."
        )

    # Now safe to process
    results = self.yolo(image)
    ...
```

---

## 9. Use Context Managers for Resources

### 9.1 Current Pattern

**Problem**: Manual resource management
```python
class InferencePipeline:
    async def initialize(self):
        self.yolo = YOLOv12Detector(...)
        self.yolo.load()
        # ...

    async def shutdown(self):
        if self.yolo:
            self.yolo.unload()
        # What if shutdown() is not called?
```

**Refactored**: Use context manager
```python
class InferencePipeline:
    """Pipeline with automatic resource management."""

    async def __aenter__(self):
        """Async context manager entry."""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.shutdown()
        return False

# Usage:
async with InferencePipeline(config) as pipeline:
    result = await pipeline.process_frame(frame)
    # Automatically cleaned up, even on exception
```

---

## 10. Logging Improvements

### 10.1 Current Logging

**Problem**: Inconsistent log levels and messages
```python
logger.info(f"Loading {name}...")
logger.warning(f"{name} failed to load")
logger.error(f"Error loading {name}: {e}")
```

**Refactored**: Structured logging
```python
import structlog

logger = structlog.get_logger()

# Structured logs with context
logger.info(
    "model_loading",
    model_name=name,
    model_path=str(path),
    status="started"
)

# On error
logger.error(
    "model_loading_failed",
    model_name=name,
    model_path=str(path),
    error=str(e),
    error_type=type(e).__name__,
    status="failed"
)

# Easier to parse, filter, and analyze
# Can export to JSON for log aggregation
```

---

## Summary of Refactorings

| Refactoring | Files | Lines Saved | Complexity Reduced |
|-------------|-------|-------------|-------------------|
| Extract inline scripts | 1 | 238 | High |
| Merge augmentation tools | 3 | 400 | High |
| Simplify configuration | 1 | 200+ | High |
| Reduce function complexity | 2 | 0 (restructure) | Medium |
| Improve error handling | 5 | 0 (additions) | Medium |
| Simplify types | 1 | 50 | Medium |
| Add input validation | 3 | 0 (additions) | Low |
| Use context managers | 2 | 20 | Low |

**Total Lines Saved**: ~900 lines
**Code Quality Improvement**: Significant

---

## Implementation Priority

### Phase 1 (High Impact, Low Risk)
1. Extract inline script generation
2. Merge augmentation tools
3. Simplify configuration

### Phase 2 (Medium Impact, Medium Risk)
4. Reduce function complexity
5. Improve CLI design
6. Better error handling

### Phase 3 (Maintenance)
7. Add input validation
8. Use context managers
9. Improve logging
10. Simplify types

---

## Testing Strategy

For each refactoring:
1. Write tests for current behavior
2. Refactor code
3. Verify tests still pass
4. Add new tests for edge cases
5. Update documentation

Example:
```python
# tests/test_dataset_converter.py
def test_convert_cplid_dataset():
    """Test CPLID dataset conversion."""
    converter = DatasetConverter(output_dir="test_output")
    count = converter.convert_cplid(Path("test_data/cplid"))
    assert count > 0
    # Verify output files exist
    assert (Path("test_output/train/images")).exists()
    assert (Path("test_output/train/labels")).exists()
```

---

## Code Style Guidelines

After refactoring, maintain consistency:

1. **Function length**: Max 50 lines (prefer 20-30)
2. **Class size**: Max 300 lines (split if larger)
3. **Nesting depth**: Max 3 levels
4. **Parameter count**: Max 5 parameters (use dataclasses for more)
5. **Line length**: 88 characters (Black formatter)
6. **Docstrings**: Required for all public functions/classes
7. **Type hints**: Required for all function signatures

**Enforce with tools**:
```bash
# Format code
black bahb/

# Check style
flake8 bahb/ --max-line-length=88

# Type check
mypy bahb/ --strict

# Sort imports
isort bahb/
```
