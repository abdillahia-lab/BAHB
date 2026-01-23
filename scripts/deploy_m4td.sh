#!/bin/bash
# BAHB Deployment Script for Matrice 4TD / Manifold 3
#
# Prerequisites:
# 1. Manifold 3 connected to drone and powered on
# 2. SSH access configured (default: 192.168.42.10)
# 3. JetPack 6.x installed on Manifold 3
# 4. ONNX models exported and ready

set -e

# Configuration
MANIFOLD_IP="${MANIFOLD_IP:-192.168.42.10}"
MANIFOLD_USER="${MANIFOLD_USER:-bahb}"
DEPLOY_DIR="/opt/bahb"
MODEL_DIR="/data/bahb/models"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  BAHB Deployment to Matrice 4TD       ${NC}"
echo -e "${GREEN}========================================${NC}"

# Check SSH connectivity
echo -e "\n${YELLOW}[1/6] Checking Manifold 3 connectivity...${NC}"
if ssh -o ConnectTimeout=5 "${MANIFOLD_USER}@${MANIFOLD_IP}" "echo 'Connected'" 2>/dev/null; then
    echo -e "${GREEN}✓ Manifold 3 reachable at ${MANIFOLD_IP}${NC}"
else
    echo -e "${RED}✗ Cannot reach Manifold 3 at ${MANIFOLD_IP}${NC}"
    echo "  Ensure:"
    echo "  1. Drone is powered on"
    echo "  2. Manifold 3 is connected via E-Port"
    echo "  3. You're on the same network (or USB-C direct)"
    exit 1
fi

# Create deployment package
echo -e "\n${YELLOW}[2/6] Creating deployment package...${NC}"
PACKAGE_DIR=$(mktemp -d)
PACKAGE_NAME="bahb-m4td-$(date +%Y%m%d-%H%M%S).tar.gz"

# Copy application code
cp -r bahb "${PACKAGE_DIR}/"
cp -r configs "${PACKAGE_DIR}/"
cp -r scripts "${PACKAGE_DIR}/"
cp requirements.txt "${PACKAGE_DIR}/"
cp pyproject.toml "${PACKAGE_DIR}/" 2>/dev/null || true

# Copy M4TD-specific config as default
cp configs/matrice_4td.yaml "${PACKAGE_DIR}/configs/production.yaml"

# Create systemd service file
cat > "${PACKAGE_DIR}/bahb.service" << 'EOF'
[Unit]
Description=BAHB Infrastructure Inspection System
After=network.target nvidia-persistenced.service

[Service]
Type=simple
User=bahb
WorkingDirectory=/opt/bahb
Environment="BAHB_CONFIG=/opt/bahb/configs/production.yaml"
Environment="CUDA_VISIBLE_DEVICES=0"
ExecStart=/opt/bahb/venv/bin/python -m bahb.main
Restart=on-failure
RestartSec=10

# Resource limits for Orin NX
MemoryMax=14G
CPUQuota=800%

[Install]
WantedBy=multi-user.target
EOF

# Create package
tar -czf "${PACKAGE_NAME}" -C "${PACKAGE_DIR}" .
echo -e "${GREEN}✓ Package created: ${PACKAGE_NAME}${NC}"

# Transfer to Manifold 3
echo -e "\n${YELLOW}[3/6] Transferring to Manifold 3...${NC}"
scp "${PACKAGE_NAME}" "${MANIFOLD_USER}@${MANIFOLD_IP}:/tmp/"
echo -e "${GREEN}✓ Package transferred${NC}"

# Deploy on Manifold 3
echo -e "\n${YELLOW}[4/6] Installing on Manifold 3...${NC}"
ssh "${MANIFOLD_USER}@${MANIFOLD_IP}" << REMOTE_SCRIPT
set -e

# Extract package
sudo mkdir -p ${DEPLOY_DIR}
sudo tar -xzf /tmp/${PACKAGE_NAME} -C ${DEPLOY_DIR}
sudo chown -R ${MANIFOLD_USER}:${MANIFOLD_USER} ${DEPLOY_DIR}

# Create virtual environment if needed
if [ ! -d "${DEPLOY_DIR}/venv" ]; then
    python3 -m venv ${DEPLOY_DIR}/venv
fi

# Install dependencies
source ${DEPLOY_DIR}/venv/bin/activate
pip install --upgrade pip
pip install -r ${DEPLOY_DIR}/requirements.txt

# Install TensorRT Python bindings (JetPack specific)
pip install tensorrt

echo "Application installed successfully"
REMOTE_SCRIPT
echo -e "${GREEN}✓ Application installed${NC}"

# Transfer and build models
echo -e "\n${YELLOW}[5/6] Transferring AI models...${NC}"
echo "  Note: TensorRT engines must be built ON the Manifold 3"

# Check for ONNX models
if [ -d "models" ]; then
    # Transfer ONNX models (not .engine files - those are platform-specific)
    scp models/*.onnx "${MANIFOLD_USER}@${MANIFOLD_IP}:${MODEL_DIR}/" 2>/dev/null || true
    echo -e "${GREEN}✓ ONNX models transferred${NC}"

    # Build TensorRT engines on Manifold 3
    echo -e "\n${YELLOW}Building TensorRT engines on Manifold 3...${NC}"
    ssh "${MANIFOLD_USER}@${MANIFOLD_IP}" << 'BUILD_SCRIPT'
cd /data/bahb/models

# Build RF-DETR Seg engine (FP16)
if [ -f "rf_detr_seg_medium_infrastructure.onnx" ]; then
    echo "Building RF-DETR Seg TensorRT engine (FP16)..."
    /usr/src/tensorrt/bin/trtexec \
        --onnx=rf_detr_seg_medium_infrastructure.onnx \
        --saveEngine=rf_detr_seg_medium_infrastructure.engine \
        --fp16 \
        --workspace=4096 \
        --verbose 2>&1 | tail -20
    echo "RF-DETR Seg engine built"
fi

# Build SAM3 encoder
if [ -f "sam3_nano_encoder.onnx" ]; then
    echo "Building SAM3 encoder engine..."
    /usr/src/tensorrt/bin/trtexec \
        --onnx=sam3_nano_encoder.onnx \
        --saveEngine=sam3_nano_encoder.engine \
        --fp16 \
        --workspace=2048
fi

# Build SAM3 decoder
if [ -f "sam3_nano_decoder.onnx" ]; then
    echo "Building SAM3 decoder engine..."
    /usr/src/tensorrt/bin/trtexec \
        --onnx=sam3_nano_decoder.onnx \
        --saveEngine=sam3_nano_decoder.engine \
        --fp16 \
        --workspace=1024
fi

echo "TensorRT engines built successfully"
BUILD_SCRIPT
    echo -e "${GREEN}✓ TensorRT engines built${NC}"
else
    echo -e "${YELLOW}⚠ No models/ directory found. Transfer models manually.${NC}"
fi

# Install and start service
echo -e "\n${YELLOW}[6/6] Setting up systemd service...${NC}"
ssh "${MANIFOLD_USER}@${MANIFOLD_IP}" << 'SERVICE_SCRIPT'
# Install service
sudo cp /opt/bahb/bahb.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable bahb.service

# Start service
sudo systemctl start bahb.service

# Check status
sleep 3
if systemctl is-active --quiet bahb.service; then
    echo "BAHB service is running"
    systemctl status bahb.service --no-pager | head -10
else
    echo "Warning: Service may not have started correctly"
    journalctl -u bahb.service -n 20 --no-pager
fi
SERVICE_SCRIPT

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!                  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access BAHB:"
echo "  - WebSocket UI: ws://${MANIFOLD_IP}:8080"
echo "  - Logs: ssh ${MANIFOLD_USER}@${MANIFOLD_IP} journalctl -u bahb -f"
echo "  - Status: ssh ${MANIFOLD_USER}@${MANIFOLD_IP} systemctl status bahb"
echo ""
echo "On RC Plus 2:"
echo "  1. Connect to drone WiFi"
echo "  2. Open DJI Pilot 2 → Accessories → BAHB"
echo "  3. Or use browser: http://${MANIFOLD_IP}:8080"

# Cleanup
rm -rf "${PACKAGE_DIR}" "${PACKAGE_NAME}"
