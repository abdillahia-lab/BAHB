#!/bin/bash
# Build lightweight DJI .dpk package for Manifold 3
# Contains only essential files: code + trained model weights

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/build/dpk_lite"
OUTPUT_DIR="$PROJECT_ROOT/dist"

APP_NAME="bahb"
APP_VERSION="1.0.0"

echo "========================================"
echo "  BAHB DPK Lite Builder for Manifold 3"
echo "========================================"

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/app"
mkdir -p "$OUTPUT_DIR"

# Create DJI manifest.json
cat > "$BUILD_DIR/manifest.json" << EOF
{
    "app_id": "com.bahb.inspection",
    "app_name": "$APP_NAME",
    "app_version": "$APP_VERSION",
    "app_type": "psdk_app",
    "platform": "manifold3",
    "min_psdk_version": "3.15.0",
    "description": "Autonomous Drone Inspection System",
    "entry_point": "run.sh",
    "install_path": "/data/bahb"
}
EOF

# Create run.sh entry point
cat > "$BUILD_DIR/app/run.sh" << 'EOF'
#!/bin/bash
cd /data/bahb
export BAHB_ROOT=/data/bahb
export PYTHONPATH=/data/bahb:$PYTHONPATH
python3 -m bahb.main "$@"
EOF
chmod +x "$BUILD_DIR/app/run.sh"

# Create install.sh
cat > "$BUILD_DIR/install.sh" << 'EOF'
#!/bin/bash
set -e
INSTALL_DIR="/data/bahb"
echo "Installing BAHB to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
cp -r app/* "$INSTALL_DIR/"
cd "$INSTALL_DIR"
pip3 install torch torchvision ultralytics opencv-python numpy pyyaml loguru pydantic aiohttp --user 2>/dev/null || true
chmod +x "$INSTALL_DIR/run.sh"
echo "BAHB installed! Run: /data/bahb/run.sh"
EOF
chmod +x "$BUILD_DIR/install.sh"

# Copy application code (no __pycache__)
echo "Copying application code..."
cp -r "$PROJECT_ROOT/bahb" "$BUILD_DIR/app/"
cp -r "$PROJECT_ROOT/configs" "$BUILD_DIR/app/"
cp "$PROJECT_ROOT/pyproject.toml" "$BUILD_DIR/app/"
find "$BUILD_DIR/app" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$BUILD_DIR/app" -name "*.pyc" -delete 2>/dev/null || true

# Copy ONLY the best model weights (not all checkpoints)
echo "Copying trained model weights..."
mkdir -p "$BUILD_DIR/app/runs/yolov11l_bahb_v3/weights"
mkdir -p "$BUILD_DIR/app/runs/yolo26l_infrastructure/weights"

cp "$PROJECT_ROOT/runs/yolov11l_bahb_v3/weights/best.pt" "$BUILD_DIR/app/runs/yolov11l_bahb_v3/weights/" 2>/dev/null || true
cp "$PROJECT_ROOT/runs/yolo26l_infrastructure/weights/best.pt" "$BUILD_DIR/app/runs/yolo26l_infrastructure/weights/" 2>/dev/null || true

# Copy ONNX models only
echo "Copying ONNX models..."
mkdir -p "$BUILD_DIR/app/models/onnx"
cp "$PROJECT_ROOT/models/onnx/"*.onnx "$BUILD_DIR/app/models/onnx/" 2>/dev/null || true

# Create the .dpk package
echo "Creating .dpk package..."
DPK_FILE="$OUTPUT_DIR/${APP_NAME}_${APP_VERSION}_manifold3_lite.dpk"
cd "$BUILD_DIR"
tar -czvf "$DPK_FILE" manifest.json install.sh app/

echo "========================================"
echo "  DPK Lite Package created!"
echo "  Output: $DPK_FILE"
echo "  Size: $(du -h "$DPK_FILE" | cut -f1)"
echo "========================================"
echo ""
echo "Copy this file to your microSD card, then:"
echo "1. Insert microSD into RC remote"
echo "2. DJI Pilot 2 > Manifold 3 > Application Management"
echo "3. Tap '+' and select the .dpk file"
