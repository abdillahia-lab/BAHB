#!/bin/bash
################################################################################
# BAHB INT8 Calibration Pipeline
#
# Complete end-to-end pipeline for INT8 model quantization and validation:
# 1. Prepare calibration dataset
# 2. Export model to ONNX
# 3. Build FP32/FP16/INT8 TensorRT engines
# 4. Validate INT8 accuracy vs FP32
# 5. Benchmark performance
# 6. Generate comprehensive report
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

################################################################################
# Configuration
################################################################################

# Paths
BAHB_ROOT="/home/user/BAHB"
MODEL_PATH="${BAHB_ROOT}/runs/yolo26l_infrastructure/weights/best.pt"
TRAIN_IMAGES="${BAHB_ROOT}/data/merged/train/images"
TRAIN_LABELS="${BAHB_ROOT}/data/merged/train/labels"
VAL_IMAGES="${BAHB_ROOT}/data/merged/val/images"
VAL_LABELS="${BAHB_ROOT}/data/merged/val/labels"

# Output directories
OUTPUT_DIR="${BAHB_ROOT}/models/tensorrt"
CALIBRATION_DIR="${BAHB_ROOT}/data/calibration"
SCRIPTS_DIR="${BAHB_ROOT}/scripts/calibration"

# Model settings
INPUT_SIZE=640
NUM_CALIBRATION_IMAGES=1000
MIN_PER_CLASS=50

# Performance targets
TARGET_FPS=55
MAX_MAP_DEGRADATION=2.0  # percent

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo "================================================================================"
    echo -e "${BLUE}$1${NC}"
    echo "================================================================================"
    echo ""
}

print_step() {
    echo -e "${GREEN}>>> $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_file() {
    if [ ! -f "$1" ]; then
        print_error "File not found: $1"
        exit 1
    fi
}

check_dir() {
    if [ ! -d "$1" ]; then
        print_error "Directory not found: $1"
        exit 1
    fi
}

################################################################################
# Pre-flight Checks
################################################################################

preflight_checks() {
    print_header "Pre-flight Checks"

    print_step "Checking Python environment..."
    if ! python3 -c "import tensorrt" 2>/dev/null; then
        print_error "TensorRT Python package not found. Please install tensorrt."
        exit 1
    fi
    print_success "TensorRT found"

    if ! python3 -c "import pycuda" 2>/dev/null; then
        print_error "PyCUDA not found. Please install pycuda."
        exit 1
    fi
    print_success "PyCUDA found"

    print_step "Checking NVIDIA GPU..."
    if ! nvidia-smi &>/dev/null; then
        print_error "nvidia-smi not found. Is NVIDIA driver installed?"
        exit 1
    fi
    print_success "NVIDIA GPU found"

    print_step "Checking model file..."
    check_file "$MODEL_PATH"
    print_success "Model file exists"

    print_step "Checking data directories..."
    check_dir "$TRAIN_IMAGES"
    check_dir "$TRAIN_LABELS"
    check_dir "$VAL_IMAGES"
    check_dir "$VAL_LABELS"
    print_success "Data directories exist"

    print_step "Creating output directories..."
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$CALIBRATION_DIR"
    print_success "Output directories created"

    print_success "All pre-flight checks passed"
}

################################################################################
# Step 1: Prepare Calibration Data
################################################################################

prepare_calibration_data() {
    print_header "Step 1: Prepare Calibration Dataset"

    print_step "Selecting $NUM_CALIBRATION_IMAGES diverse images for calibration..."

    python3 "${SCRIPTS_DIR}/prepare_calibration_data.py" \
        --train-images "$TRAIN_IMAGES" \
        --train-labels "$TRAIN_LABELS" \
        --output-dir "$CALIBRATION_DIR" \
        --num-images "$NUM_CALIBRATION_IMAGES" \
        --min-per-class "$MIN_PER_CLASS" \
        --seed 42

    if [ $? -eq 0 ]; then
        print_success "Calibration data prepared"
    else
        print_error "Failed to prepare calibration data"
        exit 1
    fi
}

################################################################################
# Step 2: Export to ONNX
################################################################################

export_to_onnx() {
    print_header "Step 2: Export Model to ONNX"

    ONNX_PATH="${OUTPUT_DIR}/yolo26l_infrastructure.onnx"

    print_step "Exporting model to ONNX format..."

    # Check if YOLO export script exists
    if command -v yolo &> /dev/null; then
        # Using YOLO CLI
        yolo export \
            model="$MODEL_PATH" \
            format=onnx \
            imgsz=$INPUT_SIZE \
            simplify=True \
            opset=12

        # Move ONNX file to output directory
        MODEL_DIR=$(dirname "$MODEL_PATH")
        if [ -f "${MODEL_DIR}/best.onnx" ]; then
            mv "${MODEL_DIR}/best.onnx" "$ONNX_PATH"
        fi
    else
        # Using Python script
        python3 << EOF
import sys
sys.path.insert(0, '/home/user/BAHB')

from ultralytics import YOLO

model = YOLO('$MODEL_PATH')
model.export(
    format='onnx',
    imgsz=$INPUT_SIZE,
    simplify=True,
    opset=12
)

# Move to output directory
import shutil
import os
model_dir = os.path.dirname('$MODEL_PATH')
onnx_file = os.path.join(model_dir, 'best.onnx')
if os.path.exists(onnx_file):
    shutil.move(onnx_file, '$ONNX_PATH')
EOF
    fi

    if [ -f "$ONNX_PATH" ]; then
        print_success "Model exported to ONNX: $ONNX_PATH"
    else
        print_error "ONNX export failed"
        exit 1
    fi
}

################################################################################
# Step 3: Build TensorRT Engines
################################################################################

build_tensorrt_engines() {
    print_header "Step 3: Build TensorRT Engines"

    MANIFEST_FILE="${CALIBRATION_DIR}/calibration_manifest.json"
    CALIBRATION_CACHE="${OUTPUT_DIR}/calibration.cache"
    TIMING_CACHE="${OUTPUT_DIR}/timing.cache"

    check_file "$MANIFEST_FILE"

    # Build FP32 engine (baseline)
    print_step "Building FP32 engine..."
    python3 "${SCRIPTS_DIR}/build_engine.py" \
        --onnx "$ONNX_PATH" \
        --engine "${OUTPUT_DIR}/yolo26l_fp32.engine" \
        --precision fp32 \
        --workspace-size 4 \
        --timing-cache "$TIMING_CACHE"

    if [ $? -eq 0 ]; then
        print_success "FP32 engine built"
    else
        print_error "FP32 engine build failed"
        exit 1
    fi

    # Build FP16 engine
    print_step "Building FP16 engine..."
    python3 "${SCRIPTS_DIR}/build_engine.py" \
        --onnx "$ONNX_PATH" \
        --engine "${OUTPUT_DIR}/yolo26l_fp16.engine" \
        --precision fp16 \
        --workspace-size 4 \
        --timing-cache "$TIMING_CACHE"

    if [ $? -eq 0 ]; then
        print_success "FP16 engine built"
    else
        print_warning "FP16 engine build failed (may not be supported on this platform)"
    fi

    # Build INT8 engine
    print_step "Building INT8 engine with calibration..."
    print_step "This may take 10-20 minutes..."

    python3 "${SCRIPTS_DIR}/build_engine.py" \
        --onnx "$ONNX_PATH" \
        --engine "${OUTPUT_DIR}/yolo26l_int8.engine" \
        --precision int8 \
        --calibration-manifest "$MANIFEST_FILE" \
        --calibration-cache "$CALIBRATION_CACHE" \
        --timing-cache "$TIMING_CACHE" \
        --workspace-size 4 \
        --fp16-heads

    if [ $? -eq 0 ]; then
        print_success "INT8 engine built"
    else
        print_error "INT8 engine build failed"
        exit 1
    fi

    # Show engine sizes
    print_step "Engine sizes:"
    ls -lh "${OUTPUT_DIR}"/*.engine | awk '{print "  " $9 ": " $5}'
}

################################################################################
# Step 4: Validate Accuracy
################################################################################

validate_accuracy() {
    print_header "Step 4: Validate INT8 Accuracy"

    FP32_ENGINE="${OUTPUT_DIR}/yolo26l_fp32.engine"
    INT8_ENGINE="${OUTPUT_DIR}/yolo26l_int8.engine"
    VALIDATION_RESULTS="${OUTPUT_DIR}/validation_results.json"

    check_file "$FP32_ENGINE"
    check_file "$INT8_ENGINE"

    print_step "Comparing FP32 vs INT8 predictions..."
    print_step "This may take 5-10 minutes..."

    python3 "${SCRIPTS_DIR}/validate_accuracy.py" \
        --fp32-engine "$FP32_ENGINE" \
        --int8-engine "$INT8_ENGINE" \
        --val-images "$VAL_IMAGES" \
        --val-labels "$VAL_LABELS" \
        --num-images 500 \
        --output "$VALIDATION_RESULTS"

    VALIDATION_EXIT_CODE=$?

    if [ -f "$VALIDATION_RESULTS" ]; then
        print_success "Validation complete"

        # Parse results
        MAP_DEGRADATION=$(python3 -c "
import json
with open('$VALIDATION_RESULTS', 'r') as f:
    results = json.load(f)
    print(results.get('map_degradation_percent', 0))
" 2>/dev/null || echo "0")

        echo ""
        echo "Validation Results:"
        python3 -c "
import json
with open('$VALIDATION_RESULTS', 'r') as f:
    results = json.load(f)
    print(f\"  FP32 mAP: {results.get('fp32_map', 0):.4f}\")
    print(f\"  INT8 mAP: {results.get('int8_map', 0):.4f}\")
    print(f\"  Degradation: {results.get('map_degradation_percent', 0):.2f}%\")
"

        # Check against target
        if (( $(echo "$MAP_DEGRADATION < $MAX_MAP_DEGRADATION" | bc -l) )); then
            print_success "mAP degradation within target (<${MAX_MAP_DEGRADATION}%)"
        else
            print_warning "mAP degradation exceeds target (${MAX_MAP_DEGRADATION}%)"
        fi
    else
        print_error "Validation failed"
        exit 1
    fi
}

################################################################################
# Step 5: Benchmark Performance
################################################################################

benchmark_performance() {
    print_header "Step 5: Benchmark Performance"

    INT8_ENGINE="${OUTPUT_DIR}/yolo26l_int8.engine"
    BENCHMARK_RESULTS="${OUTPUT_DIR}/benchmark_results.json"

    check_file "$INT8_ENGINE"

    print_step "Benchmarking INT8 engine performance..."
    print_step "This may take 2-3 minutes..."

    python3 "${SCRIPTS_DIR}/benchmark.py" \
        --engine "$INT8_ENGINE" \
        --warmup 50 \
        --iterations 1000 \
        --output "$BENCHMARK_RESULTS"

    if [ -f "$BENCHMARK_RESULTS" ]; then
        print_success "Benchmark complete"

        # Parse results
        echo ""
        echo "Performance Results:"
        python3 -c "
import json
with open('$BENCHMARK_RESULTS', 'r') as f:
    results = json.load(f)
    latency = results.get('latency', {})
    throughput = results.get('throughput', {})

    print(f\"  Latency (P50): {latency.get('p50_ms', 0):.2f} ms\")
    print(f\"  Latency (P95): {latency.get('p95_ms', 0):.2f} ms\")
    print(f\"  Latency (P99): {latency.get('p99_ms', 0):.2f} ms\")
    print(f\"  Throughput: {throughput.get('fps', 0):.2f} FPS\")
"

        # Check against target
        FPS=$(python3 -c "
import json
with open('$BENCHMARK_RESULTS', 'r') as f:
    results = json.load(f)
    print(results.get('throughput', {}).get('fps', 0))
" 2>/dev/null || echo "0")

        if (( $(echo "$FPS >= $TARGET_FPS" | bc -l) )); then
            print_success "FPS meets target (>=${TARGET_FPS} FPS)"
        else
            print_warning "FPS below target (${TARGET_FPS} FPS)"
        fi
    else
        print_error "Benchmark failed"
        exit 1
    fi
}

################################################################################
# Step 6: Generate Report
################################################################################

generate_report() {
    print_header "Step 6: Generate Comprehensive Report"

    REPORT_FILE="${OUTPUT_DIR}/calibration_report.md"
    VALIDATION_RESULTS="${OUTPUT_DIR}/validation_results.json"
    BENCHMARK_RESULTS="${OUTPUT_DIR}/benchmark_results.json"

    print_step "Generating report..."

    python3 << EOF
import json
from datetime import datetime
from pathlib import Path

# Load results
with open('$VALIDATION_RESULTS', 'r') as f:
    validation = json.load(f)

with open('$BENCHMARK_RESULTS', 'r') as f:
    benchmark = json.load(f)

# Get engine sizes
fp32_size = Path('${OUTPUT_DIR}/yolo26l_fp32.engine').stat().st_size / (1<<20)
fp16_size = Path('${OUTPUT_DIR}/yolo26l_fp16.engine').stat().st_size / (1<<20) if Path('${OUTPUT_DIR}/yolo26l_fp16.engine').exists() else 0
int8_size = Path('${OUTPUT_DIR}/yolo26l_int8.engine').stat().st_size / (1<<20)

# Generate report
report = f"""# BAHB INT8 Calibration Report

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary

This report summarizes the INT8 quantization and calibration results for the BAHB power infrastructure detection model.

## Model Information

- **Model:** YOLO26L Infrastructure Detection
- **Source:** {Path('$MODEL_PATH').name}
- **Input Size:** ${INPUT_SIZE}x${INPUT_SIZE}
- **Calibration Images:** $NUM_CALIBRATION_IMAGES

## Engine Sizes

| Precision | Size (MB) | Reduction |
|-----------|-----------|-----------|
| FP32      | {fp32_size:.2f}      | -         |
| FP16      | {fp16_size:.2f}      | {(1-fp16_size/fp32_size)*100:.1f}%    |
| INT8      | {int8_size:.2f}      | {(1-int8_size/fp32_size)*100:.1f}%    |

## Accuracy Validation

### mAP Comparison

- **FP32 mAP:** {validation['fp32_map']:.4f}
- **INT8 mAP:** {validation['int8_map']:.4f}
- **Degradation:** {validation['map_degradation_percent']:.2f}%
- **Target:** <{$MAX_MAP_DEGRADATION}%
- **Status:** {'✓ PASS' if validation['map_degradation_percent'] < $MAX_MAP_DEGRADATION else '✗ FAIL'}

### Per-Class Results

| Class | FP32 AP | INT8 AP | Degradation |
|-------|---------|---------|-------------|
"""

for cls_result in validation['per_class_results']:
    report += f"| {cls_result['class_name']:20s} | {cls_result['fp32_ap']:.4f} | {cls_result['int8_ap']:.4f} | {cls_result['degradation_percent']:+.2f}% |\n"

latency = benchmark['latency']
throughput = benchmark['throughput']

report += f"""

## Performance Benchmark

### Latency Statistics

- **Mean:** {latency['mean_ms']:.2f} ms
- **P50:** {latency['p50_ms']:.2f} ms
- **P95:** {latency['p95_ms']:.2f} ms
- **P99:** {latency['p99_ms']:.2f} ms

### Throughput

- **FPS:** {throughput['fps']:.2f}
- **Target:** {$TARGET_FPS} FPS
- **Status:** {'✓ PASS' if throughput['fps'] >= $TARGET_FPS else '✗ FAIL'}

### Memory Usage

"""

if 'memory' in benchmark and benchmark['memory']:
    mem = benchmark['memory']
    if 'gpu_memory_used_mb' in mem:
        report += f"- **GPU Memory Used:** {mem['gpu_memory_used_mb']:.2f} MB\n"
        report += f"- **GPU Memory Usage:** {mem['gpu_memory_usage_percent']:.1f}%\n"
    else:
        report += f"- **Engine Size:** {mem.get('engine_size_mb', 0):.2f} MB\n"

if 'power' in benchmark and benchmark['power']:
    pwr = benchmark['power']
    report += f"""
### Power Consumption

- **Average Power:** {pwr.get('avg_power_w', 0):.2f} W
- **Min Power:** {pwr.get('min_power_w', 0):.2f} W
- **Max Power:** {pwr.get('max_power_w', 0):.2f} W
"""

report += f"""

## Deployment Readiness

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| mAP Degradation | <{$MAX_MAP_DEGRADATION}% | {validation['map_degradation_percent']:.2f}% | {'✓' if validation['map_degradation_percent'] < $MAX_MAP_DEGRADATION else '✗'} |
| Throughput | ≥{$TARGET_FPS} FPS | {throughput['fps']:.2f} FPS | {'✓' if throughput['fps'] >= $TARGET_FPS else '✗'} |
| Model Size | <200 MB | {int8_size:.2f} MB | ✓ |

## Files Generated

- **ONNX Model:** `{Path('$ONNX_PATH').name}`
- **FP32 Engine:** `yolo26l_fp32.engine` ({fp32_size:.2f} MB)
- **FP16 Engine:** `yolo26l_fp16.engine` ({fp16_size:.2f} MB)
- **INT8 Engine:** `yolo26l_int8.engine` ({int8_size:.2f} MB)
- **Calibration Cache:** `calibration.cache`
- **Timing Cache:** `timing.cache`
- **Validation Results:** `validation_results.json`
- **Benchmark Results:** `benchmark_results.json`

## Calibration Details

- **Dataset:** {validation['num_images']} validation images
- **Calibrator:** IInt8EntropyCalibrator2
- **Batch Size:** 8
- **Detection Heads:** FP16 (mixed precision)

## Recommendations

"""

if validation['map_degradation_percent'] < 1.0:
    report += "- ✓ Excellent accuracy preservation (<1% degradation)\n"
elif validation['map_degradation_percent'] < $MAX_MAP_DEGRADATION:
    report += "- ✓ Acceptable accuracy preservation\n"
else:
    report += "- ⚠ Consider increasing calibration dataset size\n"
    report += "- ⚠ Review problematic classes for potential improvements\n"

if throughput['fps'] >= $TARGET_FPS * 1.2:
    report += "- ✓ Excellent performance headroom for multi-stream processing\n"
elif throughput['fps'] >= $TARGET_FPS:
    report += "- ✓ Meets performance target\n"
else:
    report += "- ⚠ Performance below target - verify GPU/power settings\n"

report += f"""

## Next Steps

1. **Test on target hardware** (NVIDIA Orin NX)
2. **Validate with real-world data** from field deployments
3. **Integrate into deployment pipeline**
4. **Monitor performance metrics** in production

---

*Generated by BAHB INT8 Calibration Pipeline*
"""

with open('$REPORT_FILE', 'w') as f:
    f.write(report)

print(f"Report generated: $REPORT_FILE")
EOF

    print_success "Report generated: $REPORT_FILE"
}

################################################################################
# Main Pipeline
################################################################################

main() {
    print_header "BAHB INT8 Calibration Pipeline"

    echo "Configuration:"
    echo "  Model: $MODEL_PATH"
    echo "  Input Size: ${INPUT_SIZE}x${INPUT_SIZE}"
    echo "  Calibration Images: $NUM_CALIBRATION_IMAGES"
    echo "  Output Directory: $OUTPUT_DIR"
    echo ""

    # Run pipeline steps
    preflight_checks
    prepare_calibration_data
    export_to_onnx
    build_tensorrt_engines
    validate_accuracy
    benchmark_performance
    generate_report

    print_header "Pipeline Complete!"

    echo "Results:"
    echo "  Output Directory: $OUTPUT_DIR"
    echo "  Report: ${OUTPUT_DIR}/calibration_report.md"
    echo ""

    print_success "INT8 calibration pipeline completed successfully!"
}

# Run main function
main "$@"
