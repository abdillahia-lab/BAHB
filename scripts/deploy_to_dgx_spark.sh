#!/bin/bash
# ============================================================
# Deploy BAHB to DGX Spark on Local Network
# ============================================================
#
# Usage:
#   ./scripts/deploy_to_dgx_spark.sh full     # First time: code + data + build
#   ./scripts/deploy_to_dgx_spark.sh code     # Sync application code only
#   ./scripts/deploy_to_dgx_spark.sh data     # Sync datasets only
#   ./scripts/deploy_to_dgx_spark.sh build    # Build Docker image on DGX
#   ./scripts/deploy_to_dgx_spark.sh train    # Launch training (interactive)
#
# Environment variables:
#   DGX_HOST    DGX Spark hostname (default: jinki)
#   DGX_USER    SSH user (default: nvidia)
#   REMOTE_DIR  Remote directory (default: /data/bahb)
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

DGX_HOST="${DGX_HOST:-jinki}"
DGX_USER="${DGX_USER:-nvidia}"
REMOTE_DIR="${REMOTE_DIR:-/data/bahb}"
DGX="${DGX_USER}@${DGX_HOST}"

MODE="${1:-full}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ============================================================
# Connectivity Check
# ============================================================
check_connection() {
    log "Checking connectivity to ${DGX_HOST}..."

    if ! ping -c 1 -W 3 "$DGX_HOST" &>/dev/null; then
        err "Cannot reach ${DGX_HOST}. Check network connection."
    fi

    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$DGX" "echo ok" &>/dev/null; then
        err "SSH to ${DGX} failed. Set up SSH key auth:\n  ssh-copy-id ${DGX}"
    fi

    log "Connected to ${DGX_HOST}"
}

# ============================================================
# Create Remote Directories
# ============================================================
setup_remote() {
    log "Creating directory structure on ${DGX_HOST}..."
    ssh "$DGX" "mkdir -p ${REMOTE_DIR}/{data,runs,models,logs}"
    log "Directories ready at ${REMOTE_DIR}/"
}

# ============================================================
# Sync Application Code
# ============================================================
sync_code() {
    log "Syncing application code to ${DGX_HOST}:${REMOTE_DIR}/..."

    rsync -avz --progress \
        --exclude='.git' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='.venv' \
        --exclude='venv' \
        --exclude='node_modules' \
        --exclude='runs/' \
        --exclude='data/' \
        --exclude='models/*.pt' \
        --exclude='models/*.onnx' \
        --exclude='models/*.engine' \
        --exclude='.env' \
        --exclude='android/' \
        --exclude='notebooks/' \
        --exclude='dpk_build/' \
        "$PROJECT_DIR/" "${DGX}:${REMOTE_DIR}/"

    log "Code synced successfully"
}

# ============================================================
# Prepare and Sync Datasets
# ============================================================
sync_data() {
    log "Syncing datasets to ${DGX_HOST}..."

    # Check if local data exists
    if [ ! -d "$PROJECT_DIR/data" ]; then
        warn "No local data/ directory found."
        echo ""
        echo "To prepare datasets, run one of:"
        echo "  python3 train_bahb.py            # Downloads and prepares all datasets"
        echo "  python3 scripts/merge_datasets.py # Merge existing datasets"
        echo ""
        echo "Then re-run: $0 data"
        return 1
    fi

    # Sync with resumability for large transfers
    rsync -avz --progress --partial --append-verify \
        "$PROJECT_DIR/data/" "${DGX}:${REMOTE_DIR}/data/"

    # Show transfer summary
    ssh "$DGX" "du -sh ${REMOTE_DIR}/data/*/ 2>/dev/null" || true

    log "Dataset sync complete"
}

# ============================================================
# Sync Pretrained Models
# ============================================================
sync_models() {
    log "Syncing pretrained models to ${DGX_HOST}..."

    if [ -d "$PROJECT_DIR/models" ]; then
        rsync -avz --progress --partial \
            --include='*.pt' \
            --include='*.pth' \
            --exclude='*.engine' \
            "$PROJECT_DIR/models/" "${DGX}:${REMOTE_DIR}/models/"
        log "Models synced"
    else
        warn "No local models/ directory — skipping"
    fi
}

# ============================================================
# Build Docker Image on DGX Spark
# ============================================================
build_image() {
    log "Building Docker image on ${DGX_HOST}..."
    log "This may take 10-15 minutes on first build..."

    ssh -t "$DGX" "cd ${REMOTE_DIR} && \
        docker compose -f deployment/docker-compose.dgx-spark.yml build"

    log "Docker image built successfully"
}

# ============================================================
# Launch Training (interactive)
# ============================================================
launch_training() {
    echo ""
    echo "============================================================"
    echo "Launch Training on DGX Spark"
    echo "============================================================"
    echo ""
    echo "Available training commands:"
    echo ""
    echo "  YOLO26 (recommended first):"
    echo "    ./scripts/train_on_dgx_spark.sh yolo26 x 200"
    echo ""
    echo "  RF-DETR Segmentation:"
    echo "    ./scripts/train_on_dgx_spark.sh rf_detr large 150"
    echo ""
    echo "  Adversarial Robustness:"
    echo "    ./scripts/train_on_dgx_spark.sh adversarial 100"
    echo ""
    echo "  Full Pipeline (download + prepare + train):"
    echo "    ./scripts/train_on_dgx_spark.sh full"
    echo ""
    echo "  Interactive shell:"
    echo "    docker compose -f deployment/docker-compose.dgx-spark.yml run --rm bahb-training"
    echo ""
    echo "  Monitor from workstation:"
    echo "    TensorBoard: http://${DGX_HOST}:6007"
    echo "    SSH:         ssh ${DGX} 'docker logs bahb-dgx-training -f'"
    echo ""
    echo "  Retrieve results:"
    echo "    rsync -avz ${DGX}:${REMOTE_DIR}/runs/ ./runs/"
    echo "============================================================"

    # Offer to SSH in
    read -p "SSH into ${DGX_HOST} now? [y/N] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ssh -t "$DGX" "cd ${REMOTE_DIR} && bash"
    fi
}

# ============================================================
# Verify Deployment
# ============================================================
verify() {
    log "Verifying deployment on ${DGX_HOST}..."

    ssh "$DGX" "
        echo '--- Docker ---'
        docker --version
        echo ''
        echo '--- GPU ---'
        nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
        echo ''
        echo '--- BAHB Files ---'
        ls -la ${REMOTE_DIR}/deployment/Dockerfile.dgx-spark 2>/dev/null && echo 'Dockerfile: OK' || echo 'Dockerfile: MISSING'
        ls -la ${REMOTE_DIR}/deployment/docker-compose.dgx-spark.yml 2>/dev/null && echo 'Compose: OK' || echo 'Compose: MISSING'
        echo ''
        echo '--- Data ---'
        du -sh ${REMOTE_DIR}/data/ 2>/dev/null || echo 'No data yet'
        echo ''
        echo '--- Docker Image ---'
        docker images bahb:dgx-spark-latest --format 'Image: {{.Repository}}:{{.Tag}} ({{.Size}})' 2>/dev/null || echo 'Image not built yet'
    "

    log "Verification complete"
}

# ============================================================
# Main
# ============================================================
echo ""
echo "============================================================"
echo "BAHB DGX Spark Deployment"
echo "Target: ${DGX} (${REMOTE_DIR})"
echo "Mode:   ${MODE}"
echo "============================================================"
echo ""

check_connection

case "$MODE" in
    full)
        setup_remote
        sync_code
        sync_data || warn "Data sync skipped — prepare datasets first"
        sync_models
        build_image
        verify
        launch_training
        ;;
    code)
        sync_code
        ;;
    data)
        sync_data
        ;;
    models)
        sync_models
        ;;
    build)
        build_image
        ;;
    train)
        launch_training
        ;;
    verify)
        verify
        ;;
    *)
        echo "Usage: $0 {full|code|data|models|build|train|verify}"
        exit 1
        ;;
esac
