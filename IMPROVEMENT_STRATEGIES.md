# BAHB Model Improvement Strategies

## Current Status
- **Model**: YOLO11l (25.3M params, 87.3 GFLOPs)
- **Dataset**: 829 train / 237 val images, 17 classes
- **After 2 epochs**: mAP50=89.17%, mAP50-95=51.24%, Recall=91.57%

---

## Critical Issue: Class Imbalance

Current class distribution shows severe imbalance:
- Class 0 (insulator): 467 annotations
- Class 1 (insulator_damaged): 1 annotation
- Classes 2-16: Likely sparse or missing

### Solutions:
1. **Class Weighting** - Add `cls_pw` parameter to training
2. **Focal Loss** - Already default in YOLO, but can tune gamma
3. **Oversampling** - Augment minority class images
4. **Data Collection** - Prioritize collecting underrepresented classes

---

## Improvement Strategies

### 1. Data Augmentation Enhancements
```python
# Enhanced augmentation settings
model.train(
    hsv_h=0.02,        # Increase hue variation
    hsv_s=0.8,         # Increase saturation variation
    hsv_v=0.5,         # Increase value variation
    degrees=15,        # Add rotation (infrastructure is not always level)
    translate=0.15,    # Increase translation
    scale=0.6,         # Increase scale variation
    shear=5,           # Add shear for perspective
    perspective=0.001, # Perspective distortion
    flipud=0.1,        # Vertical flip (drone views)
    mosaic=1.0,        # Keep mosaic augmentation
    mixup=0.1,         # Add mixup for regularization
    copy_paste=0.1,    # Copy-paste augmentation
)
```

### 2. Training Hyperparameter Tuning
```python
# Optimized training settings
model.train(
    epochs=100,        # Increase epochs (current: 50)
    patience=25,       # Increase early stopping patience
    lr0=0.001,         # Lower initial LR for fine-tuning
    lrf=0.001,         # Lower final LR ratio
    warmup_epochs=5,   # Longer warmup
    weight_decay=0.001,# Increase regularization
    label_smoothing=0.1,# Add label smoothing
)
```

### 3. Multi-Scale Training
```python
model.train(
    imgsz=800,         # Increase resolution (if memory allows)
    multi_scale=True,  # Enable multi-scale training
    rect=False,        # Disable rectangular training for better generalization
)
```

### 4. Test-Time Augmentation (TTA)
```python
# During inference
results = model.predict(source, augment=True)  # Enable TTA
```

### 5. Model Architecture Options

| Model | Params | GFLOPs | Pros | Cons |
|-------|--------|--------|------|------|
| YOLO11n | 2.6M | 6.5 | Fast, edge-friendly | Lower accuracy |
| YOLO11s | 9.4M | 21.5 | Good balance | - |
| YOLO11m | 20.1M | 68.0 | Better accuracy | - |
| **YOLO11l** | 25.3M | 87.3 | **Current, good choice** | - |
| YOLO11x | 56.9M | 194.9 | Highest accuracy | Slower |

### 6. Knowledge Distillation (Post-Training)
Train a smaller model using current model as teacher:
```python
# Teacher: YOLO11l (current best)
# Student: YOLO11n or YOLO11s (for edge deployment)
```

### 7. INT8 Quantization for Edge Deployment
Per research (arXiv:2502.15737):
- INT8 achieves 65fps on Orin NX vs ~35fps FP16
- Minimal accuracy loss with proper calibration

```python
# Export with INT8 quantization
model.export(format="engine", int8=True, data="data/dataset.yaml")
```

---

## Recommended Action Plan

### Immediate (Current Training)
1. Let current training complete (50 epochs)
2. Evaluate per-class metrics to identify weak classes

### Short-term
1. Collect more data for underrepresented classes
2. Re-train with enhanced augmentation
3. Add class weighting for imbalanced classes

### Deployment
1. Export to ONNX/TensorRT for edge
2. Apply INT8 quantization with calibration
3. Benchmark on Jetson Orin NX

---

## Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| mAP50 | 89.17% | 95%+ |
| mAP50-95 | 51.24% | 70%+ |
| Precision | 80.82% | 90%+ |
| Recall | 91.57% | 95%+ |
| Inference (Orin NX) | - | 60+ FPS |

---

## Monitoring Training Progress
```bash
# Watch training progress
tail -f runs/yolov12/bahb_v2/results.csv

# Visualize training curves
tensorboard --logdir runs/yolov12/bahb_v2
```
