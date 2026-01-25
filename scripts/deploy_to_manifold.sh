#!/bin/bash
# ============================================================
# Deploy BAHB to DJI Manifold 3 (Orin NX)
# ============================================================
#
# This script transfers the complete BAHB application to the
# Manifold 3 for training and inference.
#
# PREREQUISITES:
#   1. M4TD powered on (battery or AC adapter)
#   2. Connected to M4TD network (WiFi or USB-C ethernet)
#   3. SSH access configured (ssh-copy-id bahb@192.168.42.1)
#
# USAGE:
#   ./scripts/deploy_to_manifold.sh [full|code|data|models]
#
#   full   - Deploy everything (first time setup)
#   code   - Deploy code only (updates)
#   data   - Deploy training data only
#   models - Deploy trained models only
# ============================================================

set -e

# Configuration
MANIFOLD_IP="${MANIFOLD_IP:-192.168.42.1}"
MANIFOLD_USER="${MANIFOLD_USER:-bahb}"
REMOTE_DIR="/data/bahb"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

DEPLOY_MODE="${1:-full}"

echo "============================================================"
echo "BAHB Deployment to Manifold 3"
echo "============================================================"
echo ""
echo "Local:  $LOCAL_DIR"
echo "Remote: ${MANIFOLD_USER}@${MANIFOLD_IP}:${REMOTE_DIR}"
echo "Mode:   $DEPLOY_MODE"
echo ""

# Check connectivity
echo "Checking connection to Manifold 3..."
if ! ping -c 1 -W 2 "$MANIFOLD_IP" &>/dev/null; then
    echo ""
    echo "ERROR: Cannot reach Manifold 3 at $MANIFOLD_IP"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Is M4TD powered on?"
    echo "  2. Are you connected to M4TD network?"
    echo "     - WiFi: Connect to 'DJI-M4TD-XXXXX'"
    echo "     - USB-C: Connect USB-C cable to Manifold"
    echo "  3. Check IP: ping 192.168.42.1"
    echo ""
    exit 1
fi
echo "  Connected!"

# Check SSH
echo "Checking SSH access..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "${MANIFOLD_USER}@${MANIFOLD_IP}" "echo ok" &>/dev/null; then
    echo ""
    echo "ERROR: SSH authentication failed"
    echo ""
    echo "Setup SSH key (run once):"
    echo "  ssh-copy-id ${MANIFOLD_USER}@${MANIFOLD_IP}"
    echo ""
    echo "Default credentials (if not changed):"
    echo "  User: bahb"
    echo "  Pass: bahb2024"
    echo ""
    exit 1
fi
echo "  SSH OK!"
echo ""

# Create remote directory structure
echo "Creating remote directories..."
ssh "${MANIFOLD_USER}@${MANIFOLD_IP}" "mkdir -p ${REMOTE_DIR}/{data/rf_detr,configs,scripts,runs,models,logs}"

deploy_code() {
    echo ""
    echo "[1/4] Deploying application code..."

    # Sync core application
    rsync -avz --progress \
        --exclude '__pycache__' \
        --exclude '*.pyc' \
        --exclude '.git' \
        --exclude 'data' \
        --exclude 'runs' \
        --exclude 'models/*.pt' \
        --exclude 'models/*.engine' \
        --exclude '.venv' \
        --exclude 'node_modules' \
        "$LOCAL_DIR/bahb" \
        "$LOCAL_DIR/configs" \
        "$LOCAL_DIR/scripts" \
        "$LOCAL_DIR/train_rf_detr_seg.py" \
        "$LOCAL_DIR/requirements.txt" \
        "${MANIFOLD_USER}@${MANIFOLD_IP}:${REMOTE_DIR}/"

    echo "  Code deployed!"
}

deploy_data() {
    echo ""
    echo "[2/4] Deploying training data..."

    # Check if data exists
    if [ ! -f "$LOCAL_DIR/data/rf_detr/train_instances.json" ]; then
        echo "  WARNING: Training data not found at data/rf_detr/"
        echo "  Run converter first: python scripts/yolo_to_coco_converter.py"
        return
    fi

    # Get data size
    DATA_SIZE=$(du -sh "$LOCAL_DIR/data/rf_detr" | cut -f1)
    echo "  Data size: $DATA_SIZE"

    # Sync training data
    rsync -avz --progress \
        "$LOCAL_DIR/data/rf_detr/" \
        "${MANIFOLD_USER}@${MANIFOLD_IP}:${REMOTE_DIR}/data/rf_detr/"

    # Sync images (if using merged dataset for training)
    if [ -d "$LOCAL_DIR/data/merged/train/images" ]; then
        echo ""
        echo "  Syncing training images (this may take a while)..."
        rsync -avz --progress \
            "$LOCAL_DIR/data/merged/" \
            "${MANIFOLD_USER}@${MANIFOLD_IP}:${REMOTE_DIR}/data/merged/"
    fi

    echo "  Data deployed!"
}

deploy_models() {
    echo ""
    echo "[3/4] Deploying trained models..."

    # Sync YOLO models
    if [ -d "$LOCAL_DIR/runs/yolov11l_bahb_v3" ]; then
        rsync -avz --progress \
            "$LOCAL_DIR/runs/yolov11l_bahb_v3/weights/best.pt" \
            "${MANIFOLD_USER}@${MANIFOLD_IP}:${REMOTE_DIR}/runs/yolov11l_bahb_v3/weights/"
    fi

    if [ -d "$LOCAL_DIR/runs/yolo26l_infrastructure" ]; then
        rsync -avz --progress \
            "$LOCAL_DIR/runs/yolo26l_infrastructure/weights/best.pt" \
            "${MANIFOLD_USER}@${MANIFOLD_IP}:${REMOTE_DIR}/runs/yolo26l_infrastructure/weights/"
    fi

    echo "  Models deployed!"
}

setup_environment() {
    echo ""
    echo "[4/4] Setting up environment on Manifold 3..."

    ssh "${MANIFOLD_USER}@${MANIFOLD_IP}" bash << 'REMOTE_SCRIPT'
set -e
cd /data/bahb

echo "  Checking Python environment..."
python3 --version

echo "  Installing dependencies..."
pip3 install --user -q torch torchvision --index-url https://download.pytorch.org/whl/cu121 2>/dev/null || true
pip3 install --user -q -r requirements.txt 2>/dev/null || echo "  (some packages may need manual install)"

echo "  Checking CUDA..."
python3 -c "import torch; print(f'    PyTorch: {torch.__version__}'); print(f'    CUDA: {torch.cuda.is_available()}')"

echo "  Setting permissions..."
chmod +x scripts/*.sh

echo "  Environment ready!"
REMOTE_SCRIPT
}

# Execute based on mode
case "$DEPLOY_MODE" in
    full)
        deploy_code
        deploy_data
        deploy_models
        setup_environment
        ;;
    code)
        deploy_code
        ;;
    data)
        deploy_data
        ;;
    models)
        deploy_models
        ;;
    *)
        echo "Unknown mode: $DEPLOY_MODE"
        echo "Usage: $0 [full|code|data|models]"
        exit 1
        ;;
esac

echo ""
echo "============================================================"
echo "Deployment Complete!"
echo "============================================================"
echo ""
echo "Next steps:"
echo ""
echo "  1. SSH into Manifold 3:"
echo "     ssh ${MANIFOLD_USER}@${MANIFOLD_IP}"
echo ""
echo "  2. Start training:"
echo "     cd ${REMOTE_DIR}"
echo "     ./scripts/train_on_manifold.sh medium 100"
echo ""
echo "  3. Monitor training:"
echo "     tail -f ${REMOTE_DIR}/runs/rf_detr_*/training.log"
echo ""
