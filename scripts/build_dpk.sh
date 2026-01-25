#!/bin/bash
# Build DJI .dpk package for Manifold 3
# DPK format: tar.gz archive with manifest and app files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/build/dpk"
OUTPUT_DIR="$PROJECT_ROOT/dist"

APP_NAME="bahb"
APP_VERSION="1.0.0"
APP_ID="com.bahb.inspection"

echo "========================================"
echo "  BAHB DPK Package Builder for Manifold 3"
echo "========================================"

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/app"
mkdir -p "$OUTPUT_DIR"

# Create DJI manifest.json (PSDK app manifest format)
cat > "$BUILD_DIR/manifest.json" << EOF
{
    "app_id": "$APP_ID",
    "app_name": "$APP_NAME",
    "app_version": "$APP_VERSION",
    "app_type": "psdk_app",
    "platform": "manifold3",
    "min_psdk_version": "3.15.0",
    "description": "Autonomous Drone Inspection System - Infrastructure Detection",
    "author": "BAHB Team",
    "entry_point": "run.sh",
    "install_path": "/data/bahb",
    "permissions": [
        "camera",
        "gimbal",
        "flight_control",
        "storage",
        "network"
    ],
    "dependencies": {
        "python": ">=3.10",
        "cuda": ">=11.4"
    }
}
EOF

# Create run.sh entry point
cat > "$BUILD_DIR/app/run.sh" << 'EOF'
#!/bin/bash
cd /data/bahb
source venv/bin/activate 2>/dev/null || true
export BAHB_ROOT=/data/bahb
export PYTHONPATH=/data/bahb:$PYTHONPATH
python3 -m bahb.main "$@"
EOF
chmod +x "$BUILD_DIR/app/run.sh"

# Create install.sh for post-installation
cat > "$BUILD_DIR/install.sh" << 'EOF'
#!/bin/bash
set -e
INSTALL_DIR="/data/bahb"

echo "Installing BAHB to $INSTALL_DIR..."

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Copy application files
cp -r app/* "$INSTALL_DIR/"

# Create Python virtual environment if not exists
if [ ! -d "$INSTALL_DIR/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$INSTALL_DIR/venv"
fi

# Activate and install dependencies
source "$INSTALL_DIR/venv/bin/activate"
pip install --upgrade pip
pip install -e "$INSTALL_DIR" || pip install torch torchvision ultralytics opencv-python numpy pyyaml loguru

# Set permissions
chmod +x "$INSTALL_DIR/run.sh"

echo "BAHB installed successfully!"
echo "Run with: /data/bahb/run.sh"
EOF
chmod +x "$BUILD_DIR/install.sh"

# Copy application code
echo "Copying application files..."
cp -r "$PROJECT_ROOT/bahb" "$BUILD_DIR/app/"
cp -r "$PROJECT_ROOT/configs" "$BUILD_DIR/app/"
cp "$PROJECT_ROOT/pyproject.toml" "$BUILD_DIR/app/"
cp "$PROJECT_ROOT/setup.py" "$BUILD_DIR/app/" 2>/dev/null || true

# Copy trained models if they exist
if [ -d "$PROJECT_ROOT/runs" ]; then
    echo "Copying trained models..."
    mkdir -p "$BUILD_DIR/app/runs"
    # Copy YOLOv11-L model
    if [ -d "$PROJECT_ROOT/runs/yolov11l_bahb_v3" ]; then
        cp -r "$PROJECT_ROOT/runs/yolov11l_bahb_v3" "$BUILD_DIR/app/runs/"
    fi
    # Copy YOLO26-L model
    if [ -d "$PROJECT_ROOT/runs/yolo26l_infrastructure" ]; then
        cp -r "$PROJECT_ROOT/runs/yolo26l_infrastructure" "$BUILD_DIR/app/runs/"
    fi
fi

# Copy ONNX models if they exist
if [ -d "$PROJECT_ROOT/models" ]; then
    echo "Copying ONNX models..."
    cp -r "$PROJECT_ROOT/models" "$BUILD_DIR/app/"
fi

# Create the .dpk package (tar.gz with .dpk extension)
echo "Creating .dpk package..."
DPK_FILE="$OUTPUT_DIR/${APP_NAME}_${APP_VERSION}_manifold3.dpk"
cd "$BUILD_DIR"
tar -czvf "$DPK_FILE" manifest.json install.sh app/

echo "========================================"
echo "  DPK Package created successfully!"
echo "  Output: $DPK_FILE"
echo "  Size: $(du -h "$DPK_FILE" | cut -f1)"
echo "========================================"
echo ""
echo "To install on Manifold 3:"
echo "1. Copy $DPK_FILE to microSD card"
echo "2. Insert microSD into RC remote"
echo "3. Open DJI Pilot 2 > Manifold 3 > Application Management"
echo "4. Tap '+' and select the .dpk file"
echo ""
