#!/bin/bash
# ============================================================
# Create BAHB Deployment Package for Manifold 3
# ============================================================
# Creates a tar.gz that can be copied to microSD and
# transferred to the Manifold 3
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="${PROJECT_DIR}/deployment"
PACKAGE_NAME="bahb_m4td_deployment"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "============================================================"
echo "Creating BAHB Deployment Package"
echo "============================================================"
echo ""

cd "$PROJECT_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Create temporary staging directory
STAGING_DIR=$(mktemp -d)
mkdir -p "$STAGING_DIR/$PACKAGE_NAME"

echo "Copying application files..."

# Copy core application
cp -r bahb "$STAGING_DIR/$PACKAGE_NAME/"
cp -r configs "$STAGING_DIR/$PACKAGE_NAME/"
cp -r scripts "$STAGING_DIR/$PACKAGE_NAME/"
cp train_rf_detr_seg.py "$STAGING_DIR/$PACKAGE_NAME/"
cp requirements.txt "$STAGING_DIR/$PACKAGE_NAME/"

# Copy trained models (only best weights to save space)
echo "Copying trained models..."
mkdir -p "$STAGING_DIR/$PACKAGE_NAME/runs/yolov11l_bahb_v3/weights"
mkdir -p "$STAGING_DIR/$PACKAGE_NAME/runs/yolo26l_infrastructure/weights"
cp runs/yolov11l_bahb_v3/weights/best.pt "$STAGING_DIR/$PACKAGE_NAME/runs/yolov11l_bahb_v3/weights/" 2>/dev/null || echo "  YOLOv11-L not found, skipping"
cp runs/yolo26l_infrastructure/weights/best.pt "$STAGING_DIR/$PACKAGE_NAME/runs/yolo26l_infrastructure/weights/" 2>/dev/null || echo "  YOLO26-L not found, skipping"

# Copy ONNX models if available
if [ -d "models/onnx" ]; then
    echo "Copying ONNX models..."
    mkdir -p "$STAGING_DIR/$PACKAGE_NAME/models/onnx"
    cp models/onnx/*.onnx "$STAGING_DIR/$PACKAGE_NAME/models/onnx/" 2>/dev/null || true
fi

# Copy RF-DETR training data (JSON only, not images - too large)
echo "Copying RF-DETR training metadata..."
mkdir -p "$STAGING_DIR/$PACKAGE_NAME/data/rf_detr"
cp data/rf_detr/*.json "$STAGING_DIR/$PACKAGE_NAME/data/rf_detr/" 2>/dev/null || echo "  RF-DETR data not found"

# Remove Python cache files
find "$STAGING_DIR/$PACKAGE_NAME" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$STAGING_DIR/$PACKAGE_NAME" -type f -name "*.pyc" -delete 2>/dev/null || true

# Create install script for Manifold
cat > "$STAGING_DIR/$PACKAGE_NAME/install.sh" << 'INSTALL_SCRIPT'
#!/bin/bash
# ============================================================
# BAHB Installation Script for Manifold 3
# ============================================================
# Run this script after copying files to Manifold 3
# Usage: sudo ./install.sh
# ============================================================

set -e

INSTALL_DIR="/data/bahb"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================================"
echo "Installing BAHB on Manifold 3"
echo "============================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo ./install.sh"
    exit 1
fi

# Create installation directory
echo "[1/6] Creating installation directory..."
mkdir -p "$INSTALL_DIR"

# Copy files
echo "[2/6] Copying files to $INSTALL_DIR..."
cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/"
rm -f "$INSTALL_DIR/install.sh"  # Don't copy install script

# Set permissions
echo "[3/6] Setting permissions..."
chmod +x "$INSTALL_DIR/scripts/"*.sh
chown -R $SUDO_USER:$SUDO_USER "$INSTALL_DIR"

# Install Python dependencies
echo "[4/6] Installing Python dependencies..."
pip3 install --user -r "$INSTALL_DIR/requirements.txt" 2>/dev/null || {
    echo "  Some packages may need manual installation"
}

# Set environment variable
echo "[5/6] Setting environment variables..."
echo "export BAHB_ROOT=$INSTALL_DIR" >> /home/$SUDO_USER/.bashrc
echo "export PATH=\$PATH:$INSTALL_DIR/scripts" >> /home/$SUDO_USER/.bashrc

# Verify installation
echo "[6/6] Verifying installation..."
cd "$INSTALL_DIR"
python3 -c "
import sys
sys.path.insert(0, '.')
from bahb.operations.inference_engine import InferenceEngine
print('  Inference engine: OK')
" 2>/dev/null && echo "  Import test: PASSED" || echo "  Import test: Some modules may need dependencies"

echo ""
echo "============================================================"
echo "Installation Complete!"
echo "============================================================"
echo ""
echo "Installation directory: $INSTALL_DIR"
echo ""
echo "Next steps:"
echo "  1. Reload shell: source ~/.bashrc"
echo "  2. Test inference:"
echo "     cd $INSTALL_DIR"
echo "     python3 -c \"from bahb.operations.inference_engine import InferenceEngine; print('OK')\""
echo "  3. Start training (optional):"
echo "     ./scripts/train_on_manifold.sh medium 100"
echo ""
INSTALL_SCRIPT

chmod +x "$STAGING_DIR/$PACKAGE_NAME/install.sh"

# Create README
cat > "$STAGING_DIR/$PACKAGE_NAME/README.txt" << 'README'
============================================================
BAHB - Building And Hardware Baseline
Deployment Package for DJI Matrice 4TD + Manifold 3
============================================================

QUICK START:
------------
1. Copy this folder to Manifold 3 (via USB drive or network)
2. Open terminal on Manifold 3
3. Navigate to this folder
4. Run: sudo ./install.sh
5. Follow the on-screen instructions

CONTENTS:
---------
- bahb/           : Core application code
- configs/        : Configuration files
- scripts/        : Deployment and training scripts
- runs/           : Trained model weights
- models/         : ONNX models (if available)
- data/           : Training data metadata
- requirements.txt: Python dependencies
- install.sh      : Installation script

TRAINED MODELS INCLUDED:
------------------------
- YOLOv11-L (146MB) - Primary detector
- YOLO26-L (101MB)  - Fallback detector

SYSTEM REQUIREMENTS:
--------------------
- NVIDIA Jetson Orin NX (Manifold 3)
- JetPack 5.x or 6.x
- Python 3.8+
- CUDA 11.4+ / 12.x

FOR TRAINING RF-DETR:
---------------------
After installation, run:
  cd /data/bahb
  ./scripts/train_on_manifold.sh medium 100

This will train RF-DETR on the Manifold 3 GPU (~12-18 hours).

SUPPORT:
--------
https://github.com/abdillahia-lab/BAHB
============================================================
README

# Create the tar.gz package
echo ""
echo "Creating deployment package..."
cd "$STAGING_DIR"
tar -czvf "$OUTPUT_DIR/${PACKAGE_NAME}_${TIMESTAMP}.tar.gz" "$PACKAGE_NAME"

# Also create a zip for easier Windows/Mac handling
echo "Creating zip package..."
zip -r "$OUTPUT_DIR/${PACKAGE_NAME}_${TIMESTAMP}.zip" "$PACKAGE_NAME"

# Cleanup
rm -rf "$STAGING_DIR"

# Get file sizes
TAR_SIZE=$(du -h "$OUTPUT_DIR/${PACKAGE_NAME}_${TIMESTAMP}.tar.gz" | cut -f1)
ZIP_SIZE=$(du -h "$OUTPUT_DIR/${PACKAGE_NAME}_${TIMESTAMP}.zip" | cut -f1)

echo ""
echo "============================================================"
echo "Deployment Package Created!"
echo "============================================================"
echo ""
echo "Files created in: $OUTPUT_DIR/"
echo ""
echo "  ${PACKAGE_NAME}_${TIMESTAMP}.tar.gz  ($TAR_SIZE)"
echo "  ${PACKAGE_NAME}_${TIMESTAMP}.zip     ($ZIP_SIZE)"
echo ""
echo "To deploy:"
echo "  1. Copy the .zip or .tar.gz to a USB drive / microSD"
echo "  2. Insert into Manifold 3"
echo "  3. Extract and run: sudo ./install.sh"
echo ""
