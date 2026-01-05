# BAHB Simplification Plan

**Goal**: Transform BAHB from a research prototype into a production-ready, maintainable system that utility workers can operate confidently.

**Timeline**: 4 phases over 2-3 weeks
**Target Complexity Reduction**: 40% fewer files, 30% less code, 90% clearer workflows

---

## Phase 1: Critical Cleanup (Days 1-2)

### Priority: CRITICAL
**Goal**: Remove confusion, establish one clear workflow

### 1.1 Consolidate Training Scripts

**Current State**: 3 overlapping scripts
**Target**: 1 clear entry point

**Actions**:
```bash
# Keep the simplest, most recent version
mv run_training.py train.py

# Delete redundant scripts
rm _train.py
rm train_bahb.py

# Update train.py to include all features
# - Add CLI arguments for all parameters
# - Add clear help text
# - Add progress reporting
```

**New `train.py` should support**:
```bash
python train.py --help

# Simple usage
python train.py

# Advanced usage
python train.py --epochs 100 --batch 16 --data custom.yaml
```

**Estimated Time**: 3 hours

---

### 1.2 Extract Inline Script Generation

**Current**: 238 lines of Python code embedded as strings in `train_bahb.py`

**Target**: Proper importable modules

**Actions**:
```bash
# Create training module structure
mkdir -p bahb/training/
touch bahb/training/__init__.py

# Extract dataset download logic
# train_bahb.py Lines 89-122 → bahb/training/dataset_download.py
# train_bahb.py Lines 130-368 → bahb/training/dataset_converter.py
```

**New API**:
```python
from bahb.training.dataset_download import download_roboflow_datasets
from bahb.training.dataset_converter import convert_datasets_to_yolo

# Clean, testable functions
download_roboflow_datasets(output_dir="data/raw/roboflow")
convert_datasets_to_yolo(source_dir="data/raw", output_dir="data/processed")
```

**Estimated Time**: 4 hours

---

### 1.3 Create Installation Files

**Current**: README references non-existent files
**Target**: Working installation

**Actions**:

**Create `requirements.txt`**:
```txt
# Core dependencies
torch>=2.0.0
torchvision>=0.15.0
ultralytics>=8.0.0
opencv-python>=4.8.0
numpy>=1.24.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
loguru>=0.7.0
PyYAML>=6.0

# Optional (for development)
albumentations>=1.3.0  # For testing augmentations
pytest>=7.0.0          # For unit tests
```

**Create `setup.py` or `pyproject.toml`**:
```toml
[project]
name = "bahb"
version = "0.1.0"
description = "BAHB - Power Infrastructure Detection System"
dependencies = [
    "torch>=2.0.0",
    "ultralytics>=8.0.0",
    # ... all from requirements.txt
]

[project.scripts]
bahb = "bahb.main:cli_main"
bahb-train = "bahb.training.train:main"
```

**Create `scripts/setup.sh`**:
```bash
#!/bin/bash
# Simple setup for utility workers

echo "Setting up BAHB..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -e .

# Create data directories
mkdir -p data/raw data/processed/train data/processed/val

# Download pretrained base model
python -c "from ultralytics import YOLO; YOLO('yolo11l.pt')"

echo "Setup complete! Run 'bahb --help' to get started."
```

**Estimated Time**: 2 hours

---

### 1.4 Clean Up External Datasets

**Current**: 5 full git repositories cloned, 2 are unrelated

**Actions**:
```bash
# Delete unrelated repos
rm -rf external_datasets/open-buildings/
rm -rf external_datasets/qgis-gee-data-catalogs-plugin/

# Move VisDrone to documentation
echo "VisDrone Dataset: https://github.com/VisDrone/VisDrone-Dataset" > docs/external_datasets.md

# Keep only what's used
# external_datasets/InsulatorDataSet/ - used in training
# external_datasets/public-insulator-datasets/ - conversion scripts
```

**Document in `docs/external_datasets.md`**:
```markdown
# External Datasets

## Currently Integrated
- InsulatorDataSet (CPLID) - Used for training
- public-insulator-datasets - Conversion tools

## For Future Integration
- VisDrone Dataset - General drone detection (link)
- TTPLA Dataset - Transmission towers (link)

## Not Needed
- ~~Open Buildings~~ - Unrelated to power infrastructure
- ~~QGIS GEE Plugin~~ - Desktop GIS tool
```

**Estimated Time**: 1 hour

---

## Phase 2: Configuration Simplification (Days 3-4)

### Priority: HIGH
**Goal**: Reduce configuration complexity by 60%

### 2.1 Simplify Config Classes

**Current**: 18 Pydantic models, 84 parameters, 3 levels deep
**Target**: 6 models, 30 parameters, 2 levels

**Create `bahb/core/config_simple.py`**:

```python
from pydantic import BaseModel, Field
from pathlib import Path

class SystemConfig(BaseModel):
    """Core system settings."""
    name: str = "BAHB-Inspection"
    data_dir: Path = Path("/data/bahb")
    log_level: str = "INFO"
    device: str = "cuda:0"

class CameraConfig(BaseModel):
    """Camera settings (simplified for now)."""
    enabled: bool = False  # Disable until hardware available
    stream_url: str = ""

class ModelConfig(BaseModel):
    """AI model settings."""
    # YOLO (the only working model)
    yolo_weights: str = "runs/yolov12/bahb_v2/weights/best.pt"
    yolo_confidence: float = 0.35
    yolo_iou: float = 0.45

    # Thermal analysis
    thermal_enabled: bool = False
    thermal_baseline: float = 25.0
    thermal_hotspot_threshold: float = 15.0

class Config(BaseModel):
    """Main simplified configuration."""
    system: SystemConfig = Field(default_factory=SystemConfig)
    camera: CameraConfig = Field(default_factory=CameraConfig)
    model: ModelConfig = Field(default_factory=ModelConfig)

    @classmethod
    def from_yaml(cls, path: str) -> "Config":
        """Load from YAML file."""
        # Simple implementation
        ...
```

**New `configs/simple.yaml`**:
```yaml
system:
  name: "BAHB-Inspection"
  data_dir: "./data"
  log_level: "INFO"
  device: "cuda:0"

camera:
  enabled: false  # Enable when hardware is connected

model:
  yolo_weights: "runs/yolov12/bahb_v2/weights/best.pt"
  yolo_confidence: 0.35
  yolo_iou: 0.45
  thermal_enabled: false
```

**Migration Path**:
1. Keep old `config.py` for now (rename to `config_advanced.py`)
2. Use `config_simple.py` as default
3. Add `--advanced-config` flag for power users

**Estimated Time**: 5 hours

---

### 2.2 Remove Unimplemented Feature Configs

**Delete or comment out**:
- `MappingConfig` - 3D mapping not implemented
- `StreamingConfig` - WebRTC not implemented
- `AlertConfig` - MQTT not implemented
- Most of `OptimizationConfig` - TensorRT not used

**Move to `config_future.py`**:
```python
# Future features - not yet implemented
class FutureConfig:
    # Placeholder for when these are ready
    pass
```

**Estimated Time**: 2 hours

---

## Phase 3: Code Consolidation (Days 5-7)

### Priority: MEDIUM
**Goal**: Eliminate duplication, merge similar functionality

### 3.1 Merge Augmentation Tools

**Current**: 3 separate tools, 1,162 total lines, 80% overlap
**Target**: 1 unified module, ~400 lines

**Create `bahb/testing/augmentation.py`**:

```python
"""Unified augmentation for testing and training."""
import albumentations as A

class AugmentationPipeline:
    """One pipeline to rule them all."""

    @staticmethod
    def get_training_augmentations():
        """Standard augmentations for training."""
        return A.Compose([
            A.RandomBrightnessContrast(p=0.5),
            A.HueSaturationValue(p=0.3),
            A.GaussNoise(p=0.2),
            A.MotionBlur(p=0.2),
        ])

    @staticmethod
    def get_test_augmentations(severity='medium'):
        """Adversarial augmentations for robustness testing."""
        if severity == 'light':
            return A.Compose([...])
        elif severity == 'medium':
            return A.Compose([...])
        else:  # severe
            return A.Compose([...])

    @staticmethod
    def get_weather_augmentations():
        """Weather-specific augmentations."""
        return A.Compose([
            A.OneOf([
                A.RandomFog(p=1.0),
                A.RandomRain(p=1.0),
                A.RandomSnow(p=1.0),
            ], p=1.0)
        ])
```

**Delete/Archive**:
- `generate_adversarial_images.py` → Use `bahb.testing.augmentation`
- Custom CV2 implementations → Use Albumentations
- Keep `generate_confusion_images.py` (unique functionality)

**New CLI**:
```bash
# Generate test images
python -m bahb.testing.augmentation --input data/val/ --severity medium

# Generate hard negatives
python -m bahb.testing.confusion --output confusion_images/
```

**Estimated Time**: 6 hours

---

### 3.2 Simplify Model Pipeline

**Current**: 632 lines managing 4 models (only 1 works)
**Target**: 300 lines focused on YOLO + thermal

**Create `bahb/models/pipeline_simple.py`**:

```python
class SimpleInferencePipeline:
    """Simplified pipeline for single-model inference."""

    def __init__(self, config: Config):
        self.config = config
        self.yolo = None
        self.thermal_analyzer = None if not config.model.thermal_enabled else ThermalAnalyzer()

    async def initialize(self) -> bool:
        """Initialize YOLO model only."""
        from ultralytics import YOLO
        self.yolo = YOLO(self.config.model.yolo_weights)
        return True

    async def process_frame(self, image: np.ndarray) -> InspectionResult:
        """Process single frame (simplified)."""
        # 1. YOLO detection
        results = self.yolo(image, conf=self.config.model.yolo_confidence)
        detections = self._parse_yolo_results(results)

        # 2. Thermal analysis (if enabled)
        thermal_reading = None
        if self.thermal_analyzer and thermal_image is not None:
            thermal_reading = self.thermal_analyzer.analyze(thermal_image)

        # 3. Detect anomalies (simple rules)
        anomalies = self._detect_anomalies(detections, thermal_reading)

        return InspectionResult(
            frame_id=0,
            timestamp=datetime.now(),
            detections=detections,
            thermal_reading=thermal_reading,
            anomalies=anomalies,
        )
```

**Keep complex pipeline as `pipeline_advanced.py`** for future multi-model work

**Estimated Time**: 8 hours

---

### 3.3 Mark Model Stubs Clearly

**For each stub model file, add clear header**:

```python
"""
RF-DETR Segmentation Model

STATUS: NOT YET IMPLEMENTED
This is a placeholder for future integration.

To implement:
1. Download RF-DETR weights
2. Implement inference logic
3. Integrate into pipeline_advanced.py

See: https://github.com/lyuwenyu/RT-DETR
"""

class RFDETRSegmenter:
    """Placeholder - not implemented."""

    def __init__(self, config):
        raise NotImplementedError(
            "RF-DETR is not yet implemented. "
            "Use SimplePipeline with YOLO only."
        )
```

**Apply to**:
- `bahb/models/rf_detr.py`
- `bahb/models/sam3.py`
- `bahb/models/qwen_vl.py`
- `bahb/camera/h30t.py`
- `bahb/streaming/webrtc.py`
- `bahb/alerts/manager.py`

**Estimated Time**: 2 hours

---

## Phase 4: Documentation and Testing (Days 8-10)

### Priority: HIGH (for production readiness)
**Goal**: Make the system usable by non-experts

### 4.1 Create User Documentation

**Create `docs/USER_GUIDE.md`**:

```markdown
# BAHB User Guide for Utility Workers

## Quick Start

### 1. Installation
```bash
git clone https://github.com/your-org/BAHB.git
cd BAHB
./scripts/setup.sh
```

### 2. Training a Model
```bash
# Download datasets and train
python train.py

# Or with custom settings
python train.py --epochs 100 --batch 16
```

### 3. Running Inspection
```bash
# Process single image
bahb --image photo.jpg --output results/

# Live inspection (requires drone)
bahb --profile substation --site "Main Substation"
```

## Troubleshooting

### "CUDA out of memory"
→ Reduce batch size: `python train.py --batch 4`

### "No module named 'bahb'"
→ Run: `pip install -e .`

### "Model file not found"
→ Train a model first: `python train.py`
```

**Estimated Time**: 4 hours

---

### 4.2 Create Developer Documentation

**Create `docs/ARCHITECTURE.md`**:

```markdown
# BAHB Architecture

## Overview
```
┌─────────────────────────────────────────┐
│          User Interface                 │
│  - CLI (bahb.main)                      │
│  - Training script (train.py)           │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│       Core Application (bahb/)          │
│                                          │
│  ├── models/                            │
│  │   ├── pipeline_simple.py (active)   │
│  │   ├── pipeline_advanced.py (future) │
│  │   └── yolov12.py                    │
│  │                                      │
│  ├── core/                              │
│  │   ├── config_simple.py              │
│  │   ├── types.py                      │
│  │   └── engine.py                     │
│  │                                      │
│  ├── thermal/                           │
│  │   └── analyzer.py                   │
│  │                                      │
│  └── training/                          │
│      ├── dataset_download.py           │
│      └── dataset_converter.py          │
└─────────────────────────────────────────┘
```

## Module Responsibilities

### `bahb.models`
- YOLO detection (working)
- Future: Multi-model fusion

### `bahb.core`
- Configuration management
- Inspection orchestration
- Type definitions

### `bahb.training`
- Dataset download and conversion
- Model training utilities
```

**Estimated Time**: 3 hours

---

### 4.3 Add Basic Tests

**Create `tests/` directory**:
```bash
mkdir -p tests/
touch tests/__init__.py
touch tests/test_config.py
touch tests/test_pipeline.py
touch tests/test_training.py
```

**`tests/test_config.py`**:
```python
import pytest
from bahb.core.config_simple import Config

def test_default_config():
    """Test default configuration loads."""
    config = Config()
    assert config.system.name == "BAHB-Inspection"
    assert config.model.yolo_confidence == 0.35

def test_yaml_config():
    """Test loading from YAML."""
    config = Config.from_yaml("configs/simple.yaml")
    assert config is not None
```

**`tests/test_pipeline.py`**:
```python
import pytest
import numpy as np
from bahb.models.pipeline_simple import SimpleInferencePipeline
from bahb.core.config_simple import Config

@pytest.mark.asyncio
async def test_pipeline_initialization():
    """Test pipeline can initialize."""
    config = Config()
    pipeline = SimpleInferencePipeline(config)
    # Should not crash
    assert pipeline is not None

@pytest.mark.asyncio
async def test_process_dummy_image():
    """Test processing a dummy image."""
    config = Config()
    pipeline = SimpleInferencePipeline(config)

    # Create dummy image
    image = np.zeros((640, 640, 3), dtype=np.uint8)

    # Should not crash (may return empty results)
    result = await pipeline.process_frame(image)
    assert result is not None
```

**Add pytest to requirements**:
```bash
pip install pytest pytest-asyncio
```

**Run tests**:
```bash
pytest tests/ -v
```

**Estimated Time**: 6 hours

---

### 4.4 Create CHANGELOG and ROADMAP

**`CHANGELOG.md`**:
```markdown
# Changelog

## [0.1.0] - 2026-01-XX - Simplification Release

### Changed
- Consolidated 3 training scripts into 1 (`train.py`)
- Simplified configuration from 18 to 6 classes
- Merged 3 augmentation tools into 1 module
- Reduced codebase by 30% (3,500+ lines)
- Improved documentation for utility workers

### Removed
- Unused TensorRT optimization code (moved to future)
- Unrelated external datasets (open-buildings, qgis-plugin)
- Duplicate augmentation implementations
- Unimplemented feature configs (streaming, MQTT, 3D mapping)

### Added
- Complete installation guide
- User documentation for non-experts
- Basic test suite with pytest
- Clear status markers for stub implementations
```

**`ROADMAP.md`**:
```markdown
# BAHB Roadmap

## Phase 1: Core Functionality (DONE)
- [x] YOLO11 training pipeline
- [x] Basic inference and detection
- [x] Configuration system
- [x] Documentation

## Phase 2: Hardware Integration (IN PROGRESS)
- [ ] DJI H30T camera integration
- [ ] Real-time streaming
- [ ] Thermal sensor calibration

## Phase 3: Advanced AI (PLANNED)
- [ ] RF-DETR segmentation
- [ ] SAM3 precision masks
- [ ] Qwen-VL analysis
- [ ] Multi-model fusion

## Phase 4: Production Features (FUTURE)
- [ ] MQTT alerting
- [ ] WebRTC live view
- [ ] 3D point cloud mapping
- [ ] Cloud synchronization
- [ ] Mobile app integration

## Phase 5: Optimization (FUTURE)
- [ ] TensorRT export
- [ ] INT8 quantization
- [ ] Edge deployment to Jetson Orin
```

**Estimated Time**: 2 hours

---

## Phase 5: Automated Cleanup (Day 11)

### Priority: MEDIUM
**Goal**: Automate repetitive cleanup tasks

See `scripts/cleanup.py` for implementation.

**Estimated Time**: 4 hours

---

## Summary Timeline

| Phase | Days | Priority | Effort | Impact |
|-------|------|----------|--------|--------|
| Phase 1: Critical Cleanup | 1-2 | CRITICAL | 10h | High |
| Phase 2: Configuration | 3-4 | HIGH | 7h | High |
| Phase 3: Code Consolidation | 5-7 | MEDIUM | 16h | Medium |
| Phase 4: Documentation & Tests | 8-10 | HIGH | 15h | High |
| Phase 5: Automated Cleanup | 11 | MEDIUM | 4h | Medium |

**Total Estimated Time**: 52 hours (~1.5 weeks full-time)

---

## Success Metrics

### Before Simplification
- 82 Python files
- 13,204 lines of code
- 18 configuration classes
- 3 training scripts
- 0 tests
- 40% documentation coverage

### After Simplification (Target)
- 50 Python files (-39%)
- 9,500 lines of code (-28%)
- 6 configuration classes (-67%)
- 1 training script (-67%)
- 15+ unit tests
- 80% documentation coverage

### User Experience
- **Before**: "Which training script do I run?"
- **After**: "Run `python train.py` - that's it!"

- **Before**: "How do I install this?"
- **After**: "Run `./scripts/setup.sh` - done!"

- **Before**: "Where's the model file?"
- **After**: "`runs/yolov12/bahb_v2/weights/best.pt` (documented)"

---

## Risk Mitigation

### Backup Strategy
```bash
# Before starting, create backup branch
git checkout -b backup/pre-simplification
git push origin backup/pre-simplification

# Work on new branch
git checkout -b simplification/phase1
```

### Rollback Plan
- Each phase is a separate commit
- Can cherry-pick successful changes
- Keep old files temporarily in `deprecated/` folder

### Testing Plan
- Run all training workflows after each phase
- Verify model training still works
- Test inference on sample images
- Check configuration loading

---

## Next Steps

1. Review this plan with team
2. Create GitHub issues for each phase
3. Start with Phase 1 (highest impact, lowest risk)
4. Measure improvements after each phase
5. Iterate based on user feedback

---

## Maintenance Going Forward

### Code Review Checklist
- [ ] No inline script generation
- [ ] No duplicate functionality
- [ ] Configuration changes use simple config
- [ ] New features have tests
- [ ] Documentation updated
- [ ] No premature optimization

### Quarterly Reviews
- Check for code duplication
- Review configuration complexity
- Update roadmap based on user needs
- Refactor as needed to maintain simplicity
