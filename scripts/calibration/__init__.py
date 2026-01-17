"""
BAHB INT8 Calibration Pipeline

Complete TensorRT INT8 quantization pipeline for YOLO-based
power infrastructure detection models.

Modules:
    prepare_calibration_data: Dataset preparation and selection
    calibrator: TensorRT INT8 calibrators
    build_engine: TensorRT engine builder
    validate_accuracy: Accuracy validation
    benchmark: Performance benchmarking
"""

__version__ = '1.0.0'
__author__ = 'BAHB Team'

from pathlib import Path

# Package root directory
PACKAGE_ROOT = Path(__file__).parent

# Default paths
DEFAULT_BAHB_ROOT = Path('/home/user/BAHB')
DEFAULT_MODEL_PATH = DEFAULT_BAHB_ROOT / 'runs/yolo26l_infrastructure/weights/best.pt'
DEFAULT_OUTPUT_DIR = DEFAULT_BAHB_ROOT / 'models/tensorrt'
DEFAULT_CALIBRATION_DIR = DEFAULT_BAHB_ROOT / 'data/calibration'
DEFAULT_TRAIN_IMAGES = DEFAULT_BAHB_ROOT / 'data/merged/train/images'
DEFAULT_TRAIN_LABELS = DEFAULT_BAHB_ROOT / 'data/merged/train/labels'
DEFAULT_VAL_IMAGES = DEFAULT_BAHB_ROOT / 'data/merged/val/images'
DEFAULT_VAL_LABELS = DEFAULT_BAHB_ROOT / 'data/merged/val/labels'

# Configuration
DEFAULT_CONFIG = {
    'input_size': 640,
    'num_calibration_images': 1000,
    'min_per_class': 50,
    'target_fps': 55,
    'max_map_degradation': 2.0,
    'batch_size': 8,
    'workspace_size_gb': 4,
    'warmup_iterations': 50,
    'benchmark_iterations': 1000,
}

# Class names for infrastructure detection
CLASS_NAMES = [
    'power_line',
    'power_pole',
    'transmission_tower',
    'insulator',
    'transformer',
    'solar_panel',
    'wind_turbine',
    'substation',
    'utility_box',
    'meter',
    'cable',
    'junction_box'
]

__all__ = [
    '__version__',
    'PACKAGE_ROOT',
    'DEFAULT_CONFIG',
    'CLASS_NAMES',
]
