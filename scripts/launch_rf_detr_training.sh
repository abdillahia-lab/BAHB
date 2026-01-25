#!/bin/bash
# ============================================================
# RF-DETR Infrastructure Detection Training Script
# ============================================================
#
# REQUIREMENTS:
#   - NVIDIA GPU with 24GB+ VRAM (RTX 4090, A6000, or better)
#   - CUDA 12.x with cuDNN 8.x
#   - PyTorch 2.2+
#
# USAGE:
#   ./scripts/launch_rf_detr_training.sh [model_size] [epochs]
#
# EXAMPLES:
#   ./scripts/launch_rf_detr_training.sh medium 100
#   ./scripts/launch_rf_detr_training.sh large 200
# ============================================================

set -e

# Configuration
MODEL_SIZE=${1:-medium}
EPOCHS=${2:-100}
BATCH_SIZE=${3:-8}
DATA_DIR="data/rf_detr"
OUTPUT_DIR="runs/rf_detr_${MODEL_SIZE}_$(date +%Y%m%d_%H%M%S)"

echo "============================================================"
echo "RF-DETR Infrastructure Detection Training"
echo "============================================================"
echo ""
echo "Configuration:"
echo "  Model Size:  $MODEL_SIZE"
echo "  Epochs:      $EPOCHS"
echo "  Batch Size:  $BATCH_SIZE"
echo "  Data Dir:    $DATA_DIR"
echo "  Output Dir:  $OUTPUT_DIR"
echo ""

# Check GPU availability
echo "Checking GPU availability..."
if ! command -v nvidia-smi &> /dev/null; then
    echo "ERROR: nvidia-smi not found. NVIDIA GPU required."
    exit 1
fi

nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv
echo ""

# Check for CUDA in PyTorch
python3 -c "import torch; assert torch.cuda.is_available(), 'CUDA not available in PyTorch'"
echo "PyTorch CUDA: Available"
echo ""

# Check dataset exists
if [ ! -f "$DATA_DIR/train_instances.json" ]; then
    echo "ERROR: Dataset not found at $DATA_DIR/train_instances.json"
    echo "Please run: python scripts/yolo_to_coco_converter.py --input-dir data/merged --output-dir data/rf_detr"
    exit 1
fi

# Show dataset info
echo "Dataset Info:"
python3 -c "
import json
with open('$DATA_DIR/metadata.json') as f:
    m = json.load(f)
    print(f\"  Training:   {m['training_set']['images']} images, {m['training_set']['annotations']} annotations\")
    print(f\"  Validation: {m['validation_set']['images']} images, {m['validation_set']['annotations']} annotations\")
    print(f\"  Classes:    {m['dataset_info']['num_classes']} total ({17 - len(m['missing_classes'])} with data)\")
"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Launch training
echo "Starting training..."
echo "Logs will be saved to: $OUTPUT_DIR/training.log"
echo ""

python3 train_rf_detr_seg.py \
    --data "$DATA_DIR" \
    --epochs "$EPOCHS" \
    --batch-size "$BATCH_SIZE" \
    --model-size "$MODEL_SIZE" \
    --output "$OUTPUT_DIR" \
    2>&1 | tee "$OUTPUT_DIR/training.log"

# Training complete
echo ""
echo "============================================================"
echo "Training Complete!"
echo "============================================================"
echo ""
echo "Outputs:"
echo "  Model:  $OUTPUT_DIR/best.pt"
echo "  Logs:   $OUTPUT_DIR/training.log"
echo ""
echo "To export to ONNX:"
echo "  python train_rf_detr_seg.py --export --checkpoint $OUTPUT_DIR/best.pt"
