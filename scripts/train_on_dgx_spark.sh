#!/bin/bash
# ============================================================
# BAHB Training on DGX Spark (GB10 Blackwell)
# ============================================================
#
# Usage:
#   ./scripts/train_on_dgx_spark.sh yolo26 [model_size] [epochs]
#   ./scripts/train_on_dgx_spark.sh rf_detr [model_size] [epochs]
#   ./scripts/train_on_dgx_spark.sh adversarial [epochs]
#   ./scripts/train_on_dgx_spark.sh full [epochs]
#
# Examples:
#   ./scripts/train_on_dgx_spark.sh yolo26 x 200
#   ./scripts/train_on_dgx_spark.sh rf_detr large 150
#   ./scripts/train_on_dgx_spark.sh full 50
#
# PREREQUISITES:
#   1. Run ./scripts/deploy_to_dgx_spark.sh full (first time)
#   2. Or SSH to jinki and run this script from /data/bahb
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/deployment/docker-compose.dgx-spark.yml"

TRAINING_TYPE="${1:-yolo26}"
MODEL_SIZE="${2:-x}"
EPOCHS="${3:-200}"

# DGX Spark optimized defaults (128GB unified memory)
YOLO_BATCH=64
YOLO_IMGSZ=1280
RFDETR_BATCH=32
ADV_BATCH=32
FULL_BATCH=32
WORKERS=16

echo "============================================================"
echo "BAHB Training on DGX Spark (GB10 Blackwell)"
echo "============================================================"
echo ""
echo "Training Type: $TRAINING_TYPE"
echo "Model Size:    $MODEL_SIZE"
echo "Epochs:        $EPOCHS"
echo ""

# Verify Docker and GPU
echo "Verifying environment..."
if ! command -v docker &>/dev/null; then
    echo "ERROR: docker not found"
    exit 1
fi

if ! nvidia-smi &>/dev/null; then
    echo "ERROR: nvidia-smi not found — GPU driver not available"
    exit 1
fi

echo "GPU:"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
echo ""

# Start TensorBoard in background
echo "Starting TensorBoard..."
docker compose -f "$COMPOSE_FILE" up -d tensorboard 2>/dev/null || true
echo "  TensorBoard: http://$(hostname -I | awk '{print $1}'):6007"
echo ""

# Build training command based on type
case "$TRAINING_TYPE" in
    yolo26)
        echo "Configuration:"
        echo "  Model:      YOLO26-${MODEL_SIZE}"
        echo "  Batch:      $YOLO_BATCH"
        echo "  Image Size: $YOLO_IMGSZ"
        echo "  Epochs:     $EPOCHS"
        echo ""
        TRAIN_CMD="python3 train_yolo26.py \
            --model $MODEL_SIZE \
            --epochs $EPOCHS \
            --batch $YOLO_BATCH \
            --imgsz $YOLO_IMGSZ \
            --device 0"
        ;;
    rf_detr)
        echo "Configuration:"
        echo "  Model:      RF-DETR-${MODEL_SIZE}"
        echo "  Batch:      $RFDETR_BATCH (effective: $((RFDETR_BATCH * 2)))"
        echo "  Epochs:     $EPOCHS"
        echo ""
        TRAIN_CMD="python3 train_rf_detr_seg.py \
            --data /workspace/data/rf_detr \
            --epochs $EPOCHS \
            --batch-size $RFDETR_BATCH \
            --model-size $MODEL_SIZE \
            --output /workspace/runs/rf_detr_${MODEL_SIZE}_$(date +%Y%m%d)"
        ;;
    adversarial)
        echo "Configuration:"
        echo "  Batch:      $ADV_BATCH"
        echo "  Epochs:     $EPOCHS"
        echo ""
        TRAIN_CMD="python3 train_adversarial_manifold3.py \
            --epochs $EPOCHS \
            --batch-size $ADV_BATCH"
        ;;
    full)
        echo "Configuration:"
        echo "  Full pipeline (download + convert + train)"
        echo "  Epochs:     $EPOCHS"
        echo ""
        TRAIN_CMD="python3 train_bahb.py"
        ;;
    *)
        echo "ERROR: Unknown training type '$TRAINING_TYPE'"
        echo "Valid options: yolo26, rf_detr, adversarial, full"
        exit 1
        ;;
esac

echo "============================================================"
echo "Starting training..."
echo "Monitor GPU: watch -n 1 nvidia-smi"
echo "============================================================"
echo ""

# Run training in Docker container
docker compose -f "$COMPOSE_FILE" run --rm \
    bahb-training \
    bash -c "$TRAIN_CMD 2>&1 | tee /workspace/logs/train_${TRAINING_TYPE}_$(date +%Y%m%d_%H%M%S).log"

echo ""
echo "============================================================"
echo "Training Complete!"
echo "============================================================"
echo "Results: /data/bahb/runs/"
echo "Logs:    /data/bahb/logs/"
echo ""
echo "To retrieve results from your workstation:"
echo "  rsync -avz nvidia@jinki:/data/bahb/runs/ ./runs/"
