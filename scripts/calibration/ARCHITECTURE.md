# INT8 Calibration Pipeline Architecture

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BAHB INT8 Calibration Pipeline                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Training Dataset    │
│  - Images + Labels   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 1: Calibration Data Preparation (prepare_calibration_data.py)      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ • Analyze class distribution                                        │ │
│ │ • Select 1000 diverse images                                        │ │
│ │ • Ensure min 50 images per class                                    │ │
│ │ • Generate calibration manifest                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────┐         ┌─────────────────────────────────────────┐
│  PyTorch Model       │         │  Calibration Manifest                   │
│  (best.pt)           │         │  - Selected images                      │
└──────────┬───────────┘         │  - Class distribution                   │
           │                     │  - Statistics                           │
           │                     └────────────┬────────────────────────────┘
           ▼                                  │
┌──────────────────────────────────────────┐ │
│ Step 2: ONNX Export                      │ │
│ ┌──────────────────────────────────────┐ │ │
│ │ • Export to ONNX format              │ │ │
│ │ • Simplify graph                     │ │ │
│ │ • Validate model                     │ │ │
│ └──────────────────────────────────────┘ │ │
└──────────┬───────────────────────────────┘ │
           │                                  │
           ▼                                  │
┌──────────────────────┐                     │
│  ONNX Model          │                     │
│  (~100 MB)           │                     │
└──────────┬───────────┘                     │
           │                                  │
           ▼                                  │
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 3: TensorRT Engine Building (build_engine.py + calibrator.py)      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                      │ │
│ │  ┌────────────┐      ┌────────────┐      ┌────────────┐            │ │
│ │  │  FP32      │      │  FP16      │      │  INT8      │◄───────────┼─┘
│ │  │  Engine    │      │  Engine    │      │  Engine    │  Calibration
│ │  │            │      │            │      │            │  Manifest
│ │  │ • Baseline │      │ • 2x faster│      │ • 4x faster│
│ │  │ • ~100 MB  │      │ • ~50 MB   │      │ • ~25 MB   │
│ │  └────────────┘      └────────────┘      └──────┬─────┘
│ │                                                  │
│ │  INT8 Calibration Process:                      │
│ │  1. Load calibration images                     │
│ │  2. IInt8EntropyCalibrator2                     │
│ │  3. Collect activation statistics               │
│ │  4. Compute quantization scales                 │
│ │  5. Mixed precision (FP16 detection heads)      │
│ │  6. Build optimized engine                      │
│ │                                                  │
│ └──────────────────────────────────────────────────┘
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 4: Accuracy Validation (validate_accuracy.py)                      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                      │ │
│ │  ┌─────────────┐              ┌─────────────┐                       │ │
│ │  │ FP32 Engine │──┐           │ INT8 Engine │──┐                    │ │
│ │  └─────────────┘  │           └─────────────┘  │                    │ │
│ │                   │                            │                    │ │
│ │                   ▼                            ▼                    │ │
│ │           ┌───────────────┐          ┌────────────────┐            │ │
│ │           │  Predictions  │          │  Predictions   │            │ │
│ │           └───────┬───────┘          └────────┬───────┘            │ │
│ │                   │                           │                    │ │
│ │                   └───────────┬───────────────┘                    │ │
│ │                               ▼                                    │ │
│ │                    ┌──────────────────────┐                        │ │
│ │                    │  Comparison Engine   │                        │ │
│ │                    │  • mAP calculation   │                        │ │
│ │                    │  • Per-class AP      │                        │ │
│ │                    │  • Degradation %     │                        │ │
│ │                    │  • Problematic classes│                       │ │
│ │                    └──────────┬───────────┘                        │ │
│ │                               │                                    │ │
│ │                               ▼                                    │ │
│ │                    ┌──────────────────────┐                        │ │
│ │                    │ Validation Results   │                        │ │
│ │                    │ Target: <2% loss     │                        │ │
│ │                    └──────────────────────┘                        │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 5: Performance Benchmark (benchmark.py)                            │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                      │ │
│ │  INT8 Engine ──► ┌──────────────────────────────────────────┐      │ │
│ │                  │                                           │      │ │
│ │                  │  Warmup (50 iterations)                  │      │ │
│ │                  │                                           │      │ │
│ │                  └──────────────┬────────────────────────────┘      │ │
│ │                                 │                                   │ │
│ │                  ┌──────────────┴────────────────────────────┐      │ │
│ │                  │  Latency Benchmark (1000 iterations)      │      │ │
│ │                  │  • Mean, P50, P95, P99                    │      │ │
│ │                  └──────────────┬────────────────────────────┘      │ │
│ │                                 │                                   │ │
│ │                  ┌──────────────┴────────────────────────────┐      │ │
│ │                  │  Throughput Benchmark (10s duration)      │      │ │
│ │                  │  • FPS                                    │      │ │
│ │                  │  • Target: ≥55 FPS                        │      │ │
│ │                  └──────────────┬────────────────────────────┘      │ │
│ │                                 │                                   │ │
│ │                  ┌──────────────┴────────────────────────────┐      │ │
│ │                  │  Resource Monitoring                      │      │ │
│ │                  │  • GPU memory usage                       │      │ │
│ │                  │  • Power consumption                      │      │ │
│ │                  └──────────────┬────────────────────────────┘      │ │
│ │                                 │                                   │ │
│ │                                 ▼                                   │ │
│ │                  ┌────────────────────────────────────────┐         │ │
│ │                  │  Benchmark Results                     │         │ │
│ │                  │  • Performance metrics                 │         │ │
│ │                  │  • Resource utilization                │         │ │
│ │                  └────────────────────────────────────────┘         │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 6: Report Generation                                               │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                      │ │
│ │  Inputs: Validation Results + Benchmark Results                     │ │
│ │                                                                      │ │
│ │  Output: Comprehensive Markdown Report                              │ │
│ │  • Summary                                                           │ │
│ │  • Accuracy metrics                                                  │ │
│ │  • Performance metrics                                               │ │
│ │  • Deployment readiness                                              │ │
│ │  • Recommendations                                                   │ │
│ │                                                                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          Final Deliverables                              │
│                                                                          │
│  ✓ Optimized INT8 Engine (~25 MB, 55+ FPS)                              │
│  ✓ Accuracy Report (<2% mAP degradation)                                │
│  ✓ Performance Report (latency, throughput, memory)                     │
│  ✓ Deployment Package (ready for Orin NX)                               │
└──────────────────────────────────────────────────────────────────────────┘
```

## Module Architecture

### 1. prepare_calibration_data.py

```python
CalibrationDatasetPreparer
├── analyze_dataset()
│   └── Returns: class_to_images, image_stats
├── select_diverse_images()
│   ├── Ensure minimum per-class representation
│   └── Fill quota with diverse samples
├── analyze_selection()
│   └── Generate statistics
└── create_manifest()
    └── Save calibration metadata
```

**Key Features:**
- Smart class distribution balancing
- Diversity scoring (multi-class images preferred)
- Image size analysis
- Reproducible selection (random seed)

### 2. calibrator.py

```python
YOLOEntropyCalibrator (IInt8EntropyCalibrator2)
├── __init__()
│   └── Setup calibration parameters
├── get_batch()
│   ├── Load image batch
│   ├── Preprocess (normalize, resize)
│   └── Copy to GPU
├── read_calibration_cache()
│   └── Load cached calibration data
└── write_calibration_cache()
    └── Save calibration data for reuse

Preprocessing Options:
├── default_preprocess() - Simple resize + normalize
└── letterbox_preprocess() - Maintain aspect ratio
```

**Key Features:**
- Entropy-based calibration (optimal for CNNs)
- Batch processing for efficiency
- Cache support (skip recalibration)
- Multiple preprocessing modes

### 3. build_engine.py

```python
EngineBuilder
├── create_network()
│   └── Load ONNX model
├── create_config()
│   ├── Set precision flags
│   ├── Configure calibrator
│   └── Set layer precisions
├── set_layer_precisions()
│   └── FP16 for detection heads
└── build_engine()
    ├── Build serialized network
    ├── Save timing cache
    └── Save engine file
```

**Key Features:**
- Multi-precision support (FP32/FP16/INT8)
- Mixed precision (INT8 + FP16 heads)
- Timing cache for faster rebuilds
- Detailed layer information logging

### 4. validate_accuracy.py

```python
TensorRTInference
├── __init__() - Load engine
├── infer() - Run inference
└── __del__() - Cleanup

AccuracyValidator
├── preprocess_image()
├── postprocess_predictions()
│   ├── Filter by confidence
│   ├── Convert bbox format
│   └── Apply NMS
├── calculate_ap()
│   └── Per-class Average Precision
└── validate()
    ├── Run on both engines
    ├── Calculate mAP
    └── Identify problematic classes
```

**Key Features:**
- Side-by-side FP32 vs INT8 comparison
- Per-class accuracy analysis
- IoU-based matching
- NMS post-processing

### 5. benchmark.py

```python
TensorRTBenchmark
├── warmup() - GPU warmup
├── benchmark_latency()
│   └── Mean, P50, P95, P99
├── benchmark_throughput()
│   └── FPS measurement
├── measure_memory_usage()
│   └── GPU memory via nvidia-smi
└── estimate_power_consumption()
    └── Power draw monitoring

compare_engines()
└── Multi-engine comparison
```

**Key Features:**
- Comprehensive performance metrics
- Percentile latency analysis
- Resource monitoring (memory, power)
- Multi-engine comparison mode

### 6. run_full_pipeline.sh

```bash
Main Pipeline Flow:
├── preflight_checks()
│   ├── Python packages
│   ├── NVIDIA GPU
│   ├── Model files
│   └── Permissions
├── prepare_calibration_data()
├── export_to_onnx()
├── build_tensorrt_engines()
│   ├── FP32 (baseline)
│   ├── FP16 (optional)
│   └── INT8 (calibrated)
├── validate_accuracy()
│   └── Compare FP32 vs INT8
├── benchmark_performance()
│   └── Measure FPS, latency
└── generate_report()
    └── Markdown deployment report
```

## Data Flow

```
Training Images (10K+)
    │
    ├──► Calibration Selection (1000)
    │        │
    │        └──► Calibration Manifest
    │                  │
    │                  ▼
PyTorch Model ──► ONNX Model ──► TensorRT Builder
                                       │
                       ┌───────────────┼───────────────┐
                       │               │               │
                       ▼               ▼               ▼
                   FP32 Engine    FP16 Engine     INT8 Engine
                       │                               │
                       └───────────┬───────────────────┘
                                   │
                                   ▼
                          Validation Dataset
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
            Accuracy Validation          Performance Benchmark
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                         Deployment Report
```

## Performance Targets

| Metric | Target | Validation |
|--------|--------|------------|
| mAP Degradation | <2% | validation_results.json |
| Throughput (Orin NX) | ≥55 FPS | benchmark_results.json |
| Latency P50 | <20 ms | benchmark_results.json |
| Model Size | <30 MB | Engine file size |
| Memory Usage | <2 GB | nvidia-smi monitoring |

## Error Handling

```
┌─────────────────┐
│  Pre-flight     │
│  Checks         │
└────┬────────────┘
     │ FAIL
     ├──► GPU not found ──────────► Exit: Install NVIDIA driver
     ├──► TensorRT missing ───────► Exit: Install TensorRT
     ├──► Model not found ────────► Exit: Check model path
     └──► No write access ────────► Exit: Fix permissions

┌─────────────────┐
│  Calibration    │
│  Build          │
└────┬────────────┘
     │ FAIL
     ├──► OOM ─────────────────────► Reduce batch size
     ├──► INT8 not supported ─────► Use FP16 instead
     └──► Build timeout ──────────► Increase workspace

┌─────────────────┐
│  Validation     │
└────┬────────────┘
     │ FAIL (>2% degradation)
     ├──► Few calibration images ─► Increase to 2000
     ├──► Poor class coverage ────► Adjust min_per_class
     └──► Specific class fails ───► Review class samples

┌─────────────────┐
│  Benchmark      │
└────┬────────────┘
     │ FAIL (<55 FPS)
     ├──► Thermal throttling ─────► Improve cooling
     ├──► Power limit ────────────► Adjust power mode
     └──► Wrong GPU mode ─────────► Check max clocks
```

## Deployment Integration

```
INT8 Engine (yolo26l_int8.engine)
    │
    ├──► Orin NX Deployment
    │        │
    │        ├──► Single Stream: 55+ FPS
    │        ├──► Dual Stream: 30+ FPS each
    │        └──► Power: 15-20W
    │
    ├──► Triton Inference Server
    │        │
    │        └──► Multi-model serving
    │
    └──► Custom Application
             │
             └──► Direct TensorRT integration
```

## Caching Strategy

```
Calibration Cache (calibration.cache)
    │
    ├──► Reusable across builds
    ├──► Skip re-calibration
    └──► Model-specific

Timing Cache (timing.cache)
    │
    ├──► Faster rebuilds
    ├──► Layer optimization hints
    └──► Hardware-specific
```

## Summary

**Total Pipeline:**
- **6 Python Scripts** (2,400+ lines)
- **1 Bash Script** (630+ lines)
- **4 Documentation Files**
- **1 Setup Checker**

**Capabilities:**
- ✓ Automated end-to-end INT8 quantization
- ✓ Smart calibration dataset selection
- ✓ Mixed precision optimization
- ✓ Comprehensive accuracy validation
- ✓ Detailed performance benchmarking
- ✓ Production-ready deployment package

**Expected Results:**
- 4x smaller model size (100MB → 25MB)
- 3-4x faster inference (15ms → 4ms)
- <2% accuracy degradation
- 55+ FPS on Orin NX
- Ready for edge deployment
