# BAHB INT8 Calibration Pipeline

Complete TensorRT INT8 quantization pipeline for BAHB power infrastructure detection models.

## Overview

This pipeline automates the complete process of INT8 model quantization:

1. **Calibration Data Preparation** - Selects diverse images with proper class coverage
2. **ONNX Export** - Converts PyTorch model to ONNX format
3. **TensorRT Engine Building** - Creates optimized FP32, FP16, and INT8 engines
4. **Accuracy Validation** - Compares INT8 vs FP32 predictions
5. **Performance Benchmarking** - Measures latency, throughput, and resource usage
6. **Report Generation** - Creates comprehensive deployment report

## Requirements

### Hardware
- NVIDIA GPU with Compute Capability ≥ 6.1 (Pascal or newer)
- Recommended: NVIDIA Jetson Orin NX or desktop GPU with INT8 support
- Minimum 8GB GPU memory

### Software
- Python 3.8+
- TensorRT 8.0+
- CUDA 11.0+
- cuDNN 8.0+

### Python Packages
```bash
pip install tensorrt pycuda numpy opencv-python tqdm ultralytics
```

## Quick Start

### Run Complete Pipeline

```bash
cd /home/user/BAHB/scripts/calibration
./run_full_pipeline.sh
```

This will:
- Prepare 1000 calibration images
- Export model to ONNX
- Build FP32, FP16, and INT8 engines
- Validate accuracy (target: <2% mAP degradation)
- Benchmark performance (target: ≥55 FPS)
- Generate deployment report

**Estimated time:** 20-30 minutes

## Individual Scripts

### 1. Prepare Calibration Data

Select diverse calibration images with proper class distribution:

```bash
python3 prepare_calibration_data.py \
    --train-images /home/user/BAHB/data/merged/train/images \
    --train-labels /home/user/BAHB/data/merged/train/labels \
    --output-dir /home/user/BAHB/data/calibration \
    --num-images 1000 \
    --min-per-class 50
```

**Output:**
- `calibration_manifest.json` - Full calibration metadata
- `calibration_images.txt` - List of selected image paths
- Dataset statistics and class distribution analysis

### 2. Build TensorRT Engine

Build INT8 engine with calibration:

```bash
python3 build_engine.py \
    --onnx /home/user/BAHB/models/tensorrt/yolo26l_infrastructure.onnx \
    --engine /home/user/BAHB/models/tensorrt/yolo26l_int8.engine \
    --precision int8 \
    --calibration-manifest /home/user/BAHB/data/calibration/calibration_manifest.json \
    --workspace-size 4 \
    --fp16-heads
```

**Options:**
- `--precision`: `fp32`, `fp16`, or `int8`
- `--fp16-heads`: Use FP16 for detection heads (recommended for INT8)
- `--workspace-size`: Max workspace in GB (default: 4)
- `--timing-cache`: Path to timing cache for faster rebuilds

### 3. Validate Accuracy

Compare INT8 vs FP32 accuracy:

```bash
python3 validate_accuracy.py \
    --fp32-engine /home/user/BAHB/models/tensorrt/yolo26l_fp32.engine \
    --int8-engine /home/user/BAHB/models/tensorrt/yolo26l_int8.engine \
    --val-images /home/user/BAHB/data/merged/val/images \
    --val-labels /home/user/BAHB/data/merged/val/labels \
    --output /home/user/BAHB/models/tensorrt/validation_results.json
```

**Output:**
- Overall mAP comparison
- Per-class accuracy metrics
- Identification of problematic classes
- JSON results file

### 4. Benchmark Performance

Measure inference performance:

```bash
python3 benchmark.py \
    --engine /home/user/BAHB/models/tensorrt/yolo26l_int8.engine \
    --warmup 50 \
    --iterations 1000 \
    --output /home/user/BAHB/models/tensorrt/benchmark_results.json
```

**Metrics:**
- Latency (mean, P50, P95, P99)
- Throughput (FPS)
- Memory usage
- Power consumption (if available)

**Compare Multiple Engines:**
```bash
python3 benchmark.py \
    --engine yolo26l_fp32.engine yolo26l_int8.engine \
    --labels "FP32" "INT8" \
    --compare \
    --output comparison_results.json
```

## Configuration

Edit `run_full_pipeline.sh` to customize:

```bash
# Model settings
INPUT_SIZE=640
NUM_CALIBRATION_IMAGES=1000
MIN_PER_CLASS=50

# Performance targets
TARGET_FPS=55
MAX_MAP_DEGRADATION=2.0  # percent
```

## Output Files

After running the pipeline, the following files are generated in `/home/user/BAHB/models/tensorrt/`:

| File | Description | Size |
|------|-------------|------|
| `yolo26l_infrastructure.onnx` | ONNX model | ~100 MB |
| `yolo26l_fp32.engine` | FP32 TensorRT engine | ~100 MB |
| `yolo26l_fp16.engine` | FP16 TensorRT engine | ~50 MB |
| `yolo26l_int8.engine` | INT8 TensorRT engine | ~25 MB |
| `calibration.cache` | Calibration cache (reusable) | ~1 MB |
| `timing.cache` | Timing cache (faster rebuilds) | ~1 MB |
| `validation_results.json` | Accuracy validation results | ~10 KB |
| `benchmark_results.json` | Performance benchmark results | ~10 KB |
| `calibration_report.md` | Comprehensive deployment report | ~5 KB |

## Calibration Details

### Calibrator Type

Uses `IInt8EntropyCalibrator2` (recommended for CNNs):
- Minimizes information loss during quantization
- Better accuracy than MinMax calibration
- Requires 500-1000 representative images

### Mixed Precision Strategy

For optimal accuracy, the pipeline uses:
- **INT8**: Backbone and intermediate layers
- **FP16**: Detection heads (class, objectness, bbox)

This preserves accuracy in sensitive layers while maximizing INT8 benefits.

### Dataset Selection

The calibration dataset is selected to ensure:
- Minimum representation per class (default: 50 images)
- Diversity in image sizes and object counts
- Coverage of all infrastructure classes
- Balanced class distribution

## Performance Targets

| Metric | Target | Typical Result |
|--------|--------|----------------|
| mAP Degradation | <2% | 0.5-1.5% |
| Throughput (Orin NX) | ≥55 FPS | 60-70 FPS |
| Throughput (Desktop) | ≥100 FPS | 150-200 FPS |
| Latency (P50) | <20 ms | 10-15 ms |
| Model Size | <30 MB | 25 MB |

## Troubleshooting

### High mAP Degradation (>2%)

1. **Increase calibration images:**
   ```bash
   --num-images 2000 --min-per-class 100
   ```

2. **Use MinMax calibrator** (faster, may help):
   Edit `calibrator.py` to use `IInt8MinMaxCalibrator`

3. **Check problematic classes** in validation report
   - May need more calibration samples for those classes

### Low FPS (<55)

1. **Verify GPU power mode:**
   ```bash
   nvidia-smi -q -d PERFORMANCE
   ```

2. **Check thermal throttling:**
   ```bash
   nvidia-smi -q -d TEMPERATURE
   ```

3. **Increase workspace size:**
   ```bash
   --workspace-size 8
   ```

### Out of Memory

1. **Reduce batch size** in calibrator (edit `build_engine.py`):
   ```python
   batch_size=4  # Default is 8
   ```

2. **Reduce workspace size:**
   ```bash
   --workspace-size 2
   ```

### TensorRT Build Fails

1. **Check ONNX model:**
   ```bash
   python3 -c "import onnx; onnx.checker.check_model('model.onnx')"
   ```

2. **Verify TensorRT version:**
   ```bash
   python3 -c "import tensorrt; print(tensorrt.__version__)"
   ```

3. **Use verbose logging:**
   ```bash
   python3 build_engine.py --precision int8 ... # (no --quiet flag)
   ```

## Advanced Usage

### Custom Preprocessing

Edit `calibrator.py` to use custom preprocessing:

```python
def custom_preprocess(self, image_path: str) -> np.ndarray:
    img = cv2.imread(image_path)
    # Custom preprocessing here
    return processed_img

# In create_calibrator():
calibrator.preprocess_func = calibrator.custom_preprocess
```

### Layer-Specific Precision

Edit `build_engine.py` to set precision for specific layers:

```python
def set_layer_precisions(self):
    for i in range(self.network.num_layers):
        layer = self.network.get_layer(i)
        if 'sensitive_layer' in layer.name:
            layer.precision = trt.float16
```

### Dynamic Shapes

For variable input sizes, add optimization profiles:

```python
profile = self.builder.create_optimization_profile()
profile.set_shape(
    'images',
    min=(1, 3, 320, 320),
    opt=(1, 3, 640, 640),
    max=(1, 3, 1280, 1280)
)
self.config.add_optimization_profile(profile)
```

## Integration with Deployment

### Using the INT8 Engine

```python
import numpy as np
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit

# Load engine
with open('yolo26l_int8.engine', 'rb') as f:
    runtime = trt.Runtime(trt.Logger(trt.Logger.WARNING))
    engine = runtime.deserialize_cuda_engine(f.read())

context = engine.create_execution_context()

# Allocate buffers (see benchmark.py for complete example)
# ... buffer allocation code ...

# Run inference
# ... inference code ...
```

### Triton Inference Server

The generated engines are compatible with NVIDIA Triton:

```
model_repository/
└── yolo26l_infrastructure/
    ├── config.pbtxt
    └── 1/
        └── model.plan  # INT8 engine
```

## Performance Optimization Tips

1. **Use DLA (Deep Learning Accelerator)** on Jetson:
   - Set `config.default_device_type = trt.DeviceType.DLA`
   - Set `config.DLA_core = 0`

2. **Enable CUDA Graphs** for lower latency:
   - Use `context.execute_async_v2()` with CUDA graphs

3. **Batch processing** for higher throughput:
   - Build engine with `max_batch_size > 1`
   - Process multiple images per inference

4. **Multi-stream processing**:
   - Create multiple CUDA streams
   - Overlap data transfer and inference

## References

- [TensorRT Documentation](https://docs.nvidia.com/deeplearning/tensorrt/)
- [INT8 Calibration Guide](https://docs.nvidia.com/deeplearning/tensorrt/developer-guide/index.html#working-with-int8)
- [YOLO TensorRT Deployment](https://github.com/ultralytics/ultralytics/tree/main/examples)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review generated `calibration_report.md`
3. Examine log files in output directory
4. Verify hardware compatibility

---

**Last Updated:** 2026-01-17
**Version:** 1.0.0
