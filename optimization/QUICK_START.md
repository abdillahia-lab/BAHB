# BAHB Optimization - Quick Start Guide

**Get started with optimization in 5 minutes!**

---

## Prerequisites Check

```bash
# 1. Verify Python environment
python3 --version  # Should be 3.8+

# 2. Check CUDA (for GPU acceleration)
nvidia-smi

# 3. Check installed packages
pip list | grep -E "torch|ultralytics|tensorrt|loguru"

# 4. Install missing dependencies
pip install ultralytics loguru pyyaml opencv-python numpy tqdm
```

---

## Step 1: Profile Current Performance (5 minutes)

**Understand your baseline before optimizing!**

```bash
cd /home/user/BAHB

# Profile YOLOv12 (if weights exist)
python optimization/scripts/profile_inference.py \
    --model yolov12 \
    --model-path runs/yolov12/bahb_v2/weights/best.pt \
    --iterations 100 \
    --trace optimization/profiling/baseline_trace.json

# View results in Chrome
# Open chrome://tracing and load baseline_trace.json
```

**Expected output:** Latency breakdown, bottleneck identification

---

## Step 2: Benchmark Baseline (10 minutes)

```bash
# Benchmark YOLOv12 performance
python optimization/scripts/benchmark.py \
    --model yolov12 \
    --model-path runs/yolov12/bahb_v2/weights/best.pt \
    --iterations 1000 \
    --output optimization/benchmarks/baseline.json \
    --report \
    --format html

# View report
firefox optimization/benchmarks/baseline.html  # or your browser
```

**Expected metrics:**
- Latency: ~15ms (FP16 baseline)
- FPS: ~66 (single frame processing)
- Memory: ~2.5GB
- Accuracy: 98.77% mAP50

---

## Step 3: Quantize to INT8 (30-60 minutes)

**This is where the magic happens - 2-3x speedup!**

```bash
# Prepare calibration images (if needed)
# Ensure you have 500+ representative images in data/processed/val/images

# Quantize YOLOv12 to INT8
python optimization/scripts/quantize_model.py \
    --model yolov12 \
    --precision int8 \
    --calibration-images data/processed/val/images \
    --num-calibration 500 \
    --validate

# This will:
# 1. Export model to ONNX
# 2. Build INT8 TensorRT engine with calibration
# 3. Validate accuracy against baseline
# 4. Save engine to optimization/models/yolov12_int8.engine
```

**Time estimate:** 30-60 minutes (depending on hardware)

**Expected output:**
- INT8 engine: `optimization/models/yolov12_int8.engine`
- Calibration cache: `optimization/calibration/yolov12_calibration.cache`
- Validation: <2% mAP drop

---

## Step 4: Benchmark Optimized Model (10 minutes)

```bash
# Benchmark INT8 model
python optimization/scripts/benchmark.py \
    --model yolov12 \
    --model-path optimization/models/yolov12_int8.engine \
    --iterations 1000 \
    --output optimization/benchmarks/int8.json \
    --report \
    --format html

# Compare with baseline
python optimization/scripts/benchmark.py \
    --compare baseline int8 \
    --output optimization/benchmarks/comparison.json
```

**Expected improvements:**
- Latency: 15ms → 6ms (2.5x faster)
- FPS: 66 → 120+
- Memory: 2.5GB → 1.5GB
- Accuracy: 98.77% → 97.5% (-1.3%, acceptable)

---

## Step 5: Deploy and Test (varies)

```bash
# Test INT8 model with real images
python -c "
from ultralytics import YOLO
import cv2

# Load INT8 engine
model = YOLO('optimization/models/yolov12_int8.engine')

# Test inference
img = cv2.imread('data/processed/val/images/img_000001.jpg')
results = model.predict(img, verbose=False)

print(f'Detections: {len(results[0].boxes)}')
print(f'Inference time: {results[0].speed[\"inference\"]:.1f}ms')
"
```

---

## Troubleshooting

### Issue: No calibration images

**Solution:**
```bash
# Use training images as calibration data
python optimization/scripts/quantize_model.py \
    --calibration-images data/processed/train/images \
    --num-calibration 500
```

### Issue: TensorRT not installed

**Solution:**
```bash
# Install TensorRT (Ubuntu/Debian)
pip install nvidia-tensorrt

# OR download from NVIDIA:
# https://developer.nvidia.com/tensorrt
```

### Issue: CUDA out of memory

**Solution:**
```bash
# Reduce batch size in config
# Edit optimization/configs/tensorrt_config.yaml:
#   yolov12:
#     calibration:
#       batch_size: 4  # instead of 8
```

### Issue: Accuracy drop >5%

**Solution:**
```bash
# 1. Increase calibration images
python optimization/scripts/quantize_model.py \
    --num-calibration 1000

# 2. Use mixed precision (FP16 for sensitive layers)
# Edit tensorrt_config.yaml to add precision constraints
```

---

## Next Steps

After completing the quick start:

1. **Read the full documentation:**
   - `OPTIMIZATION_REPORT.md` - Comprehensive analysis
   - `PERFORMANCE_TARGETS.md` - Detailed goals
   - `README.md` - Complete usage guide

2. **Optimize other models:**
   ```bash
   # Quantize all models
   python optimization/scripts/quantize_model.py --all
   ```

3. **Profile full pipeline:**
   ```bash
   python optimization/scripts/profile_inference.py \
       --full-pipeline \
       --config configs/production.yaml \
       --duration 60
   ```

4. **Deploy to target hardware:**
   - Copy engines to Jetson Orin NX
   - Update production config to use INT8 engines
   - Monitor performance in production

---

## Expected Timeline

| Task | Time | Complexity |
|------|------|------------|
| Setup & profiling | 15 min | Easy |
| Baseline benchmark | 10 min | Easy |
| INT8 quantization | 30-60 min | Medium |
| Benchmark INT8 | 10 min | Easy |
| Validation | 15 min | Easy |
| **Total** | **1.5-2 hours** | **Medium** |

---

## Success Criteria

You know you're successful when:

- ✅ INT8 engine builds without errors
- ✅ Latency reduced by 2x+ (15ms → <8ms)
- ✅ Accuracy drop <2% (>97% mAP50)
- ✅ Memory usage reduced by 30%+ (<2GB)
- ✅ No crashes during benchmarking (stability)

---

## Getting Help

- **Documentation:** Start with `README.md` and `OPTIMIZATION_REPORT.md`
- **Scripts:** All scripts have `--help` flag for usage
- **Configuration:** Check `configs/tensorrt_config.yaml` for settings
- **Examples:** See code examples in documentation

---

## Pro Tips

1. **Always profile first** - Understand bottlenecks before optimizing
2. **Validate accuracy** - Don't sacrifice quality for speed
3. **Use representative calibration data** - Quality matters for INT8
4. **Monitor GPU utilization** - Use `nvidia-smi` during benchmarks
5. **Save baselines** - Compare against original performance
6. **Iterate incrementally** - Optimize one model at a time
7. **Test in production** - Real-world validation is critical

---

**Ready to achieve 60+ FPS real-time detection? Let's go! 🚀**

For detailed guidance, see:
- `/home/user/BAHB/optimization/OPTIMIZATION_REPORT.md`
- `/home/user/BAHB/optimization/PERFORMANCE_TARGETS.md`
- `/home/user/BAHB/optimization/README.md`
