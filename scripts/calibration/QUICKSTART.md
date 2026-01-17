# INT8 Calibration Quick Start Guide

## 1-Minute Setup

```bash
cd /home/user/BAHB/scripts/calibration

# Install dependencies (if needed)
pip install -r requirements.txt

# Run complete pipeline
./run_full_pipeline.sh
```

## Expected Timeline

| Step | Duration | Output |
|------|----------|--------|
| Calibration Data Prep | 2-3 min | 1000 selected images |
| ONNX Export | 1-2 min | ONNX model (~100MB) |
| FP32 Engine Build | 2-3 min | FP32 baseline |
| FP16 Engine Build | 2-3 min | FP16 engine |
| INT8 Engine Build | 10-15 min | INT8 engine (~25MB) |
| Accuracy Validation | 5-8 min | mAP comparison |
| Performance Benchmark | 2-3 min | FPS metrics |
| Report Generation | <1 min | Markdown report |
| **Total** | **25-35 min** | **Complete deployment package** |

## Quick Commands

### Prepare Calibration Data Only
```bash
python3 prepare_calibration_data.py \
    --num-images 1000 \
    --min-per-class 50
```

### Build INT8 Engine Only
```bash
# First, ensure you have ONNX model and calibration manifest
python3 build_engine.py \
    --onnx /home/user/BAHB/models/tensorrt/yolo26l_infrastructure.onnx \
    --engine /home/user/BAHB/models/tensorrt/yolo26l_int8.engine \
    --precision int8 \
    --calibration-manifest /home/user/BAHB/data/calibration/calibration_manifest.json
```

### Validate Accuracy Only
```bash
python3 validate_accuracy.py \
    --fp32-engine /home/user/BAHB/models/tensorrt/yolo26l_fp32.engine \
    --int8-engine /home/user/BAHB/models/tensorrt/yolo26l_int8.engine
```

### Benchmark Performance Only
```bash
python3 benchmark.py \
    --engine /home/user/BAHB/models/tensorrt/yolo26l_int8.engine
```

## Success Criteria

After running the pipeline, check:

✅ **Accuracy**: mAP degradation < 2%
✅ **Performance**: Throughput ≥ 55 FPS (Orin NX)
✅ **Size**: INT8 engine < 30 MB
✅ **Validation**: All classes have reasonable AP

## Output Location

All results in: `/home/user/BAHB/models/tensorrt/`

Key files:
- `yolo26l_int8.engine` - Optimized INT8 engine
- `calibration_report.md` - Comprehensive report
- `validation_results.json` - Accuracy metrics
- `benchmark_results.json` - Performance metrics

## Next Steps

1. **Review Report**: Check `calibration_report.md` for detailed results
2. **Test on Hardware**: Deploy to NVIDIA Orin NX
3. **Validate Real Data**: Test with field imagery
4. **Integrate**: Add to inference pipeline

## Troubleshooting

### Pipeline Fails Immediately
- Check GPU availability: `nvidia-smi`
- Verify model exists: `ls -lh /home/user/BAHB/runs/yolo26l_infrastructure/weights/best.pt`

### Out of Memory
- Reduce batch size in calibrator (edit `build_engine.py`, line ~200)
- Close other GPU applications

### Low Accuracy
- Increase calibration images: `--num-images 2000`
- Check validation dataset quality

### Low FPS
- Verify GPU power mode: `nvidia-smi -q -d PERFORMANCE`
- Check thermal throttling: `nvidia-smi dmon -s t`

## Support

See [README.md](README.md) for detailed documentation.
