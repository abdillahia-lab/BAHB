# YOLO26l Infrastructure Detection - Post-Training Summary

## Model Overview

| Property | Value |
|----------|-------|
| Model | YOLO26l (NMS-free) |
| Parameters | 24,758,847 |
| GFLOPs | 86.2 |
| Input Size | 640x640 |
| Classes | 17 |

## Training Configuration

| Setting | Value |
|---------|-------|
| Epochs Trained | 2 |
| Batch Size | 8 |
| Optimizer | auto |
| Initial LR | 0.01 |
| Device | CPU |
| AMP | Enabled |

## Dataset Statistics

| Split | Images |
|-------|--------|
| Training | 13,774 |
| Validation | 4,909 |
| **Total** | **18,683** |

### Classes (17)
0. insulator
1. insulator_damaged
2. contamination
3. tower
4. conductor
5. conductor_damaged
6. damper
7. spacer
8. connector
9. transformer
10. arrester
11. breaker
12. bushing
13. disconnector
14. vegetation
15. bird_nest
16. foreign_object

## Final Validation Metrics

| Metric | Value |
|--------|-------|
| **mAP@50** | **61.89%** |
| **mAP@50-95** | **41.04%** |
| **Precision** | **82.13%** |
| **Recall** | **56.61%** |

### Per-Class AP@50

| Class | AP@50 |
|-------|-------|
| tower | 96.28% |
| contamination | 87.28% |
| transformer | 80.77% |
| connector | 76.37% |
| insulator | 75.43% |
| conductor_damaged | 73.69% |
| damper | 59.28% |
| spacer | 56.72% |
| conductor | 11.80% |
| insulator_damaged | 1.29% |

## Inference Speed (CPU)

| Stage | Time (ms) |
|-------|-----------|
| Preprocess | 0.44 |
| Inference | 190.92 |
| Postprocess | 0.50 |
| **Total** | **191.86** |
| **FPS** | **~5.2** |

## Training Progress

| Epoch | Train Box Loss | Train Cls Loss | mAP@50 | mAP@50-95 |
|-------|---------------|----------------|--------|-----------|
| 1 | 1.790 | 2.750 | 53.82% | 35.92% |
| 2 | 1.581 | 1.324 | 61.88% | 41.04% |

## Model Artifacts

### Weights
- `runs/yolo26l_infrastructure/weights/best.pt` (100.7 MB)
- `runs/yolo26l_infrastructure/weights/last.pt` (100.7 MB)

### Exports
- `runs/yolo26l_infrastructure/weights/best.onnx` (94.8 MB)
- `models/onnx/yolo26l_infrastructure.onnx` (94.8 MB)

### Results
- `runs/yolo26l_infrastructure/results.csv` - Training metrics
- `runs/yolo26l_infrastructure/validation_results.json` - Full validation results
- `runs/yolo26l_infrastructure/args.yaml` - Training configuration

## Deployment Notes

### TensorRT Export (for DJI Manifold 3 / Jetson Orin NX)
```bash
# On target device with CUDA
python scripts/post_training/export_tensorrt.py \
    --model runs/yolo26l_infrastructure/weights/best.pt \
    --format fp16 \
    --benchmark
```

### Inference Benchmarking
```bash
python scripts/post_training/benchmark_inference.py \
    --pt runs/yolo26l_infrastructure/weights/best.pt \
    --onnx models/onnx/yolo26l_infrastructure.onnx \
    --iterations 100
```

### Expected Performance on Jetson Orin NX
| Format | Expected FPS |
|--------|--------------|
| PyTorch FP32 | ~15-20 |
| ONNX FP32 | ~25-30 |
| TensorRT FP16 | ~50-60 |
| TensorRT INT8 | ~80-100 |

## Recommendations

1. **Continue Training**: Model shows good learning trajectory. Consider training for more epochs to improve recall.

2. **Class Imbalance**: `insulator_damaged` and `conductor` have low AP. Consider:
   - Data augmentation for minority classes
   - Class-weighted loss function
   - Additional training data

3. **TensorRT Deployment**: Export to TensorRT FP16 on target device for optimal edge performance.

4. **Further Optimization**:
   - Quantization-aware training for INT8 deployment
   - Knowledge distillation to smaller model

---
*Generated: 2026-01-19*
