# BAHB Performance Optimization Suite

Comprehensive optimization toolkit for edge deployment of the BAHB aerial infrastructure detection system.

---

## Quick Start

```bash
# 1. Quantize models to INT8
cd /home/user/BAHB
python optimization/scripts/quantize_model.py --model yolov12 --precision int8

# 2. Benchmark performance
python optimization/scripts/benchmark.py --model yolov12 --iterations 1000

# 3. Profile for bottlenecks
python optimization/scripts/profile_inference.py --full-pipeline --duration 60

# 4. Generate report
python optimization/scripts/benchmark.py --report --format html
```

---

## Directory Structure

```
optimization/
├── README.md                          # This file
├── OPTIMIZATION_REPORT.md             # Comprehensive optimization analysis
├── PERFORMANCE_TARGETS.md             # Performance goals and metrics
│
├── scripts/                           # Optimization tools
│   ├── quantize_model.py             # INT8/INT4 model quantization
│   ├── benchmark.py                  # Performance benchmarking suite
│   ├── profile_inference.py          # Inference profiling tool
│   ├── convert_to_tensorrt.py        # Automated TensorRT conversion
│   └── optimize_pipeline.py          # End-to-end pipeline optimizer
│
├── configs/                           # Configuration files
│   ├── tensorrt_config.yaml          # TensorRT optimization settings
│   ├── quantization_config.yaml      # Quantization parameters
│   └── hardware_profiles.yaml        # Hardware-specific configs
│
├── models/                            # Optimized model outputs
│   ├── yolov12_int8.engine           # TensorRT INT8 engine
│   ├── rf_detr_int8.engine           # RF-DETR INT8 engine
│   ├── sam3_fp16.engine              # SAM3 FP16 engine
│   └── Qwen2.5-VL-3B-AWQ/            # Qwen-VL INT4 AWQ
│
├── calibration/                       # INT8 calibration data
│   ├── yolov12_calibration.cache     # Calibration cache
│   ├── rf_detr_calibration.cache
│   └── calibration_images/           # Representative images
│
├── benchmarks/                        # Benchmark results
│   ├── results.json                  # Latest benchmark data
│   ├── results.html                  # HTML report
│   └── history/                      # Historical benchmarks
│
├── profiling/                         # Profiling outputs
│   ├── chrome_trace.json             # Chrome trace format
│   ├── pytorch_trace.json            # PyTorch profiler output
│   └── nsight_reports/               # NVIDIA Nsight data
│
└── reports/                           # Generated reports
    ├── optimization_summary.pdf
    └── performance_comparison.html
```

---

## Key Documents

### 1. OPTIMIZATION_REPORT.md
**Comprehensive 4-hour deep-dive analysis covering:**
- Current system profiling and bottleneck identification
- Model quantization strategies (INT8/INT4)
- TensorRT optimization pipeline
- Memory and power optimization
- Adaptive VLM scheduling
- Research-backed recommendations

**Use when:** Planning optimization strategy, understanding trade-offs

### 2. PERFORMANCE_TARGETS.md
**Concrete performance goals and metrics:**
- Hardware-specific targets (Jetson Orin NX, DJI RC Plus 2)
- Model-by-model performance requirements
- End-to-end pipeline targets
- Quality assurance requirements
- Success criteria and KPIs

**Use when:** Defining requirements, validating optimizations

### 3. configs/tensorrt_config.yaml
**TensorRT optimization configuration:**
- Model-specific settings
- Hardware profiles
- Calibration parameters
- Build pipeline configuration

**Use when:** Converting models to TensorRT

---

## Optimization Workflow

### Step 1: Profile Current Performance

```bash
# Profile YOLOv12 baseline (FP16)
python optimization/scripts/profile_inference.py \
    --model yolov12 \
    --model-path runs/yolov12/bahb_v2/weights/best.pt \
    --iterations 100 \
    --trace profiling/baseline_trace.json

# Profile full pipeline
python optimization/scripts/profile_inference.py \
    --full-pipeline \
    --config configs/production.yaml \
    --duration 60 \
    --trace profiling/pipeline_baseline.json
```

**Expected Output:**
- Latency breakdown per component
- Memory usage profile
- GPU utilization
- Chrome trace for visualization

### Step 2: Quantize Models

```bash
# YOLOv12 to INT8
python optimization/scripts/quantize_model.py \
    --model yolov12 \
    --precision int8 \
    --calibration-images data/processed/val/images \
    --num-calibration 500 \
    --validate

# Qwen-VL to INT4 AWQ
python optimization/scripts/quantize_model.py \
    --model qwen_vl \
    --precision int4 \
    --method awq \
    --num-calibration 128

# Batch quantize all models
python optimization/scripts/quantize_model.py --all
```

**Expected Output:**
- Quantized model files (.engine, AWQ weights)
- Calibration caches
- Validation metrics (accuracy comparison)

### Step 3: Benchmark Optimized Models

```bash
# Benchmark YOLOv12 INT8
python optimization/scripts/benchmark.py \
    --model yolov12 \
    --model-path optimization/models/yolov12_int8.engine \
    --iterations 1000 \
    --report \
    --format html

# Compare FP16 vs INT8
python optimization/scripts/benchmark.py \
    --compare fp16 int8 \
    --model-path runs/yolov12/bahb_v2/weights/best.pt \
    --output benchmarks/comparison.json

# Full pipeline benchmark
python optimization/scripts/benchmark.py \
    --full-pipeline \
    --config configs/production.yaml \
    --duration 300 \
    --output benchmarks/pipeline_results.json
```

**Expected Output:**
- Latency metrics (mean, p50, p95, p99)
- Throughput (FPS)
- Memory and power consumption
- HTML/JSON reports

### Step 4: Validate Accuracy

```bash
# Validate quantized model accuracy
python -c "
from ultralytics import YOLO
model = YOLO('optimization/models/yolov12_int8.engine')
results = model.val(data='data/dataset.yaml')
print(f'mAP50: {results.maps[0]:.4f}')
print(f'mAP50-95: {results.maps[1]:.4f}')
"
```

**Acceptance Criteria:**
- mAP50 drop <2%
- mAP50-95 drop <3%
- Precision/Recall drop <2%

### Step 5: Deploy and Monitor

```bash
# Deploy to target hardware
./scripts/deploy_to_jetson.sh optimization/models/

# Start monitoring
python scripts/monitor_performance.py \
    --dashboard \
    --alert-threshold fps=20,memory=90
```

---

## Performance Targets Summary

| Model | Baseline (FP16) | Target (INT8) | Goal |
|-------|-----------------|---------------|------|
| **YOLOv12** | 15ms | 6ms | 2.5x faster |
| **RF-DETR** | 50ms | 18ms | 2.8x faster |
| **SAM3** | 35ms | 15ms | 2.3x faster |
| **Qwen-VL** | 400ms | 180ms | 2.2x faster |
| **Full Pipeline** | 500ms | 150ms | 3.3x faster |
| **Memory** | 10.1GB | 5.2GB | 48% reduction |
| **Power** | 22W | 16W | 27% reduction |
| **Accuracy** | 98.77% mAP50 | >97% mAP50 | <2% drop |

---

## Hardware-Specific Optimization

### Jetson Orin NX

```bash
# Set power mode
sudo nvpmodel -m 0  # MAXN (25W)

# Set max clocks
sudo jetson_clocks

# Optimize TensorRT for Orin
python optimization/scripts/quantize_model.py \
    --model yolov12 \
    --precision int8 \
    --hardware orin_nx
```

**Optimizations:**
- Use INT8 Tensor Cores
- Enable DLA (Deep Learning Accelerator)
- CUDA stream parallelization (4 streams)
- Unified memory optimization

### DJI RC Plus 2 (Qualcomm QCS6490)

```bash
# Use Qualcomm Neural Processing SDK
python optimization/scripts/quantize_model.py \
    --model yolov12 \
    --precision fp16 \
    --hardware qcs6490 \
    --backend snpe
```

**Optimizations:**
- FP16 (native Adreno format)
- Smaller model variant (YOLOv12m)
- OpenCL backend
- Reduced input resolution (960x540)

---

## Troubleshooting

### Issue: INT8 Accuracy Drop >5%

**Solution:**
```bash
# 1. Increase calibration images
python optimization/scripts/quantize_model.py \
    --model yolov12 \
    --num-calibration 1000

# 2. Use mixed precision (sensitive layers in FP16)
# Edit configs/tensorrt_config.yaml:
#   layer_optimizations:
#     precision_constraints:
#       - layer_pattern: "head.*"
#         precision: "fp16"

# 3. Try quantization-aware training (QAT)
python scripts/train_with_qat.py \
    --model runs/yolov12/bahb_v2/weights/best.pt \
    --epochs 10
```

### Issue: TensorRT Build Fails

**Solution:**
```bash
# Check ONNX export
python -c "
from ultralytics import YOLO
model = YOLO('runs/yolov12/bahb_v2/weights/best.pt')
model.export(format='onnx', simplify=True, opset=13)
"

# Verify ONNX
python -c "
import onnx
model = onnx.load('runs/yolov12/bahb_v2/weights/best.onnx')
onnx.checker.check_model(model)
print('ONNX model valid')
"

# Build TensorRT engine manually
trtexec --onnx=best.onnx \
        --saveEngine=best.engine \
        --fp16 \
        --workspace=4096
```

### Issue: Out of Memory

**Solution:**
```bash
# 1. Reduce workspace size
# Edit configs/tensorrt_config.yaml:
#   workspace_size: 2147483648  # 2GB instead of 4GB

# 2. Use model swapping
# Edit configs/production.yaml:
#   models:
#     lazy_loading: true
#     swap_unused: true

# 3. Clear cache
python -c "
import torch
torch.cuda.empty_cache()
"
```

### Issue: Low FPS on Target Hardware

**Solution:**
```bash
# 1. Profile to find bottleneck
python optimization/scripts/profile_inference.py \
    --full-pipeline \
    --visualize \
    --trace profiling/debug_trace.json

# 2. Enable CUDA streams
# Edit configs/production.yaml:
#   optimization:
#     cuda:
#       streams: 4

# 3. Reduce VLM frequency
# Edit configs/production.yaml:
#   optimization:
#     adaptive_vlm_enabled: true
#     vlm_base_interval: 10  # instead of 5
```

---

## Advanced Optimization Techniques

### 1. Structured Pruning

```bash
# Prune 10-15% of weights before quantization
python scripts/prune_model.py \
    --model runs/yolov12/bahb_v2/weights/best.pt \
    --sparsity 0.15 \
    --method magnitude \
    --output optimization/models/yolov12_pruned.pt

# Fine-tune after pruning
python scripts/finetune_pruned.py \
    --model optimization/models/yolov12_pruned.pt \
    --epochs 20
```

### 2. Knowledge Distillation

```bash
# Distill YOLOv12l → YOLOv12m
python scripts/distill_model.py \
    --teacher runs/yolov12/bahb_v2/weights/best.pt \
    --student yolov12m.pt \
    --epochs 50 \
    --temperature 3.0 \
    --alpha 0.7
```

### 3. CUDA Graph Optimization

```python
# Enable CUDA graphs in pipeline
from bahb.core.engine import InspectionEngine

engine = InspectionEngine(config)
engine.pipeline.enable_cuda_graphs = True  # Reduces kernel launch overhead
```

### 4. Adaptive Batch Processing

```python
# Dynamic batch size based on detection count
config.optimization.adaptive_batching = True
config.optimization.max_batch_size = 4
config.optimization.min_batch_size = 1
```

---

## Continuous Optimization

### Nightly Benchmarks

```bash
# Add to crontab
0 2 * * * cd /home/user/BAHB && python optimization/scripts/benchmark.py --full-pipeline --output benchmarks/nightly/$(date +\%Y\%m\%d).json
```

### Performance Monitoring Dashboard

```bash
# Start Grafana + Prometheus for real-time monitoring
docker-compose -f monitoring/docker-compose.yml up -d

# Access dashboard: http://localhost:3000
```

### Regression Detection

```bash
# Compare to baseline
python scripts/detect_regression.py \
    --baseline benchmarks/baseline.json \
    --current benchmarks/latest.json \
    --threshold 0.05  # 5% max degradation
```

---

## Research References

1. **arXiv:2405.14458** - YOLOv10: Real-Time End-to-End Object Detection
2. **arXiv:2502.15737** - YOLO Quantization Study (INT8 on Jetson)
3. **arXiv:2409.16808** - Benchmarking DL on Edge Devices
4. **arXiv:2501.15014** - Edge AI Acceleration Survey
5. **arXiv:2502.07855** - VLM for Edge Networks (Adaptive Scheduling)
6. **arXiv:2511.19495** - Optimal Compression Ordering

---

## Support & Contact

- **Issues:** File GitHub issues for bugs or questions
- **Email:** optimization@bahb.ai
- **Docs:** See `OPTIMIZATION_REPORT.md` for detailed analysis
- **Targets:** See `PERFORMANCE_TARGETS.md` for specific goals

---

**Last Updated:** 2026-01-05
**Version:** 2.0.0
**Status:** Production Ready
