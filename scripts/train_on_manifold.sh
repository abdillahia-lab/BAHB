#!/bin/bash
# ============================================================
# RF-DETR Training on DJI Manifold 3 (Orin NX)
# ============================================================
#
# Run this script on the Manifold 3 while M4TD is grounded.
# Drone does NOT need to be flying - just powered on.
#
# SETUP:
#   1. Power on M4TD (battery or AC adapter)
#   2. SSH into Manifold 3: ssh bahb@192.168.42.1
#   3. Transfer dataset: rsync -avz data/rf_detr/ bahb@192.168.42.1:/data/bahb/rf_detr/
#   4. Run this script: ./scripts/train_on_manifold.sh
#
# REQUIREMENTS:
#   - Good cooling (use external fan if training overnight)
#   - Stable power (recommend AC adapter for long training)
#   - ~20GB free storage on NVMe
# ============================================================

set -e

# Orin NX optimized settings
MODEL_SIZE=${1:-medium}
EPOCHS=${2:-100}
BATCH_SIZE=2          # Small batch for 16GB shared memory
GRAD_ACCUM=8          # Effective batch size = 2 * 8 = 16
WORKERS=4             # Don't overload CPU
DATA_DIR="/data/bahb/rf_detr"
OUTPUT_DIR="/data/bahb/runs/rf_detr_${MODEL_SIZE}_$(date +%Y%m%d)"

echo "============================================================"
echo "RF-DETR Training on Manifold 3 (Orin NX)"
echo "============================================================"
echo ""
echo "Configuration:"
echo "  Model:       $MODEL_SIZE"
echo "  Epochs:      $EPOCHS"
echo "  Batch Size:  $BATCH_SIZE (effective: $((BATCH_SIZE * GRAD_ACCUM)))"
echo "  Data Dir:    $DATA_DIR"
echo "  Output:      $OUTPUT_DIR"
echo ""

# Set Orin NX to max performance mode
echo "Setting Orin NX to MAXN power mode..."
sudo nvpmodel -m 0  # MAXN mode (25W)
sudo jetson_clocks  # Max clock speeds

# Check GPU
echo ""
echo "GPU Status:"
tegrastats --interval 1000 &
TEGRA_PID=$!
sleep 2
kill $TEGRA_PID 2>/dev/null || true

# Verify CUDA
python3 -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA: {torch.cuda.is_available()}'); print(f'Device: {torch.cuda.get_device_name(0)}')" || {
    echo "ERROR: CUDA not available. Check JetPack installation."
    exit 1
}

# Check dataset
if [ ! -f "$DATA_DIR/train_instances.json" ]; then
    echo "ERROR: Dataset not found at $DATA_DIR"
    echo ""
    echo "Transfer dataset from host machine:"
    echo "  rsync -avz data/rf_detr/ bahb@192.168.42.1:/data/bahb/rf_detr/"
    exit 1
fi

# Show dataset info
echo ""
echo "Dataset:"
python3 -c "
import json
with open('$DATA_DIR/metadata.json') as f:
    m = json.load(f)
    print(f\"  Training:   {m['training_set']['images']:,} images\")
    print(f\"  Validation: {m['validation_set']['images']:,} images\")
"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Memory optimization for Orin
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128
export CUDA_LAUNCH_BLOCKING=0

echo ""
echo "Starting training... (Ctrl+C to stop, will save checkpoint)"
echo "Monitor GPU: watch -n 1 tegrastats"
echo ""

# Training with Orin-optimized settings
python3 train_rf_detr_seg.py \
    --data "$DATA_DIR" \
    --epochs "$EPOCHS" \
    --batch-size "$BATCH_SIZE" \
    --model-size "$MODEL_SIZE" \
    --lr 5e-5 \
    --output "$OUTPUT_DIR" \
    2>&1 | tee "$OUTPUT_DIR/training.log"

echo ""
echo "============================================================"
echo "Training Complete!"
echo "============================================================"
echo "Model saved to: $OUTPUT_DIR/best.pt"
echo ""
echo "To enable in production:"
echo "  1. Copy model: cp $OUTPUT_DIR/best.pt /data/bahb/models/"
echo "  2. Update configs/production.yaml: rf_detr.enabled = true"
echo "  3. Restart service: systemctl restart bahb-inspection"
