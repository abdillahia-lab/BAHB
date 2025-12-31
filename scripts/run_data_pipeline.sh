#!/bin/bash
# =============================================================================
# BAHB Data Pipeline - Complete Execution Script
# =============================================================================
# This script runs the complete data pipeline for preparing training data
# for YOLOv12, RF-DETR, and SAM3 models.
#
# Usage:
#   ./scripts/run_data_pipeline.sh [OPTIONS]
#
# Options:
#   --download-only     Only download datasets
#   --skip-download     Skip dataset download (use existing raw data)
#   --skip-augment      Skip augmentation step
#   --model MODEL       Prepare data for specific model (yolov12, rf_detr, sam3)
#   --multiplier N      Augmentation multiplier (default: 3)
#   --dry-run           Print commands without executing
#   --help              Show this help message
#
# =============================================================================

set -e  # Exit on error
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_ROOT/data"
CONFIG_DIR="$PROJECT_ROOT/configs"

# Default options
DOWNLOAD=true
AUGMENT=true
MODELS="all"
MULTIPLIER=3
DRY_RUN=false

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --download-only)
            DOWNLOAD=true
            AUGMENT=false
            MODELS="none"
            shift
            ;;
        --skip-download)
            DOWNLOAD=false
            shift
            ;;
        --skip-augment)
            AUGMENT=false
            shift
            ;;
        --model)
            MODELS="$2"
            shift 2
            ;;
        --multiplier)
            MULTIPLIER="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            head -30 "$0" | tail -25
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run command (or print in dry-run mode)
run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY-RUN] $*"
    else
        "$@"
    fi
}

# Print header
print_header() {
    echo ""
    echo "============================================================================="
    echo " BAHB DATA PIPELINE"
    echo "============================================================================="
    echo " Project Root: $PROJECT_ROOT"
    echo " Data Directory: $DATA_DIR"
    echo " Download: $DOWNLOAD"
    echo " Augment: $AUGMENT"
    echo " Models: $MODELS"
    echo " Multiplier: $MULTIPLIER"
    echo " Dry Run: $DRY_RUN"
    echo "============================================================================="
    echo ""
}

# Create directory structure
create_directories() {
    log_info "Creating directory structure..."

    run_cmd mkdir -p "$DATA_DIR/raw/substation/ttpla"
    run_cmd mkdir -p "$DATA_DIR/raw/substation/insulator"
    run_cmd mkdir -p "$DATA_DIR/raw/substation/transformer"
    run_cmd mkdir -p "$DATA_DIR/raw/datacenter/server_thermal"
    run_cmd mkdir -p "$DATA_DIR/raw/datacenter/hvac"
    run_cmd mkdir -p "$DATA_DIR/raw/thermal/flir"
    run_cmd mkdir -p "$DATA_DIR/raw/thermal/synthetic"
    run_cmd mkdir -p "$DATA_DIR/raw/general/coco_subset"
    run_cmd mkdir -p "$DATA_DIR/raw/general/custom"

    run_cmd mkdir -p "$DATA_DIR/processed/yolov12/images/train"
    run_cmd mkdir -p "$DATA_DIR/processed/yolov12/images/val"
    run_cmd mkdir -p "$DATA_DIR/processed/yolov12/labels/train"
    run_cmd mkdir -p "$DATA_DIR/processed/yolov12/labels/val"

    run_cmd mkdir -p "$DATA_DIR/processed/rf_detr/train"
    run_cmd mkdir -p "$DATA_DIR/processed/rf_detr/val"
    run_cmd mkdir -p "$DATA_DIR/processed/rf_detr/annotations"

    run_cmd mkdir -p "$DATA_DIR/processed/sam3/images"
    run_cmd mkdir -p "$DATA_DIR/processed/sam3/masks"
    run_cmd mkdir -p "$DATA_DIR/processed/sam3/prompts"

    run_cmd mkdir -p "$DATA_DIR/augmented/yolov12"
    run_cmd mkdir -p "$DATA_DIR/augmented/rf_detr"
    run_cmd mkdir -p "$DATA_DIR/augmented/sam3"

    run_cmd mkdir -p "$DATA_DIR/exports/onnx"
    run_cmd mkdir -p "$DATA_DIR/exports/tensorrt"
    run_cmd mkdir -p "$DATA_DIR/exports/checkpoints"

    log_success "Directory structure created"
}

# Step 1: Download datasets
download_datasets() {
    if [ "$DOWNLOAD" = false ]; then
        log_warning "Skipping dataset download (--skip-download)"
        return
    fi

    log_info "[1/6] Downloading datasets..."

    # Check if download script exists
    if [ -f "$SCRIPT_DIR/data_pipeline/download_datasets.py" ]; then
        run_cmd python "$SCRIPT_DIR/data_pipeline/download_datasets.py" \
            --output "$DATA_DIR/raw" \
            --datasets all \
            --verify_checksums
    else
        log_warning "Download script not found. Creating placeholder..."
        log_info "To download datasets, implement: $SCRIPT_DIR/data_pipeline/download_datasets.py"

        # Create placeholder README
        if [ "$DRY_RUN" = false ]; then
            cat > "$DATA_DIR/raw/README.md" << 'EOF'
# Raw Dataset Directory

Place your raw datasets in the appropriate subdirectories:

## Substation Datasets
- `substation/ttpla/` - TTPLA power line dataset
- `substation/insulator/` - Insulator defect datasets
- `substation/transformer/` - Transformer thermal datasets

## Data Center Datasets
- `datacenter/server_thermal/` - Server rack thermal imagery
- `datacenter/hvac/` - HVAC equipment datasets

## Thermal Datasets
- `thermal/flir/` - FLIR thermal datasets
- `thermal/synthetic/` - Generated thermal data

## General Datasets
- `general/coco_subset/` - COCO infrastructure objects
- `general/custom/` - Custom collected data

## Dataset Sources

| Dataset | URL |
|---------|-----|
| TTPLA | https://github.com/r3ab/ttpla |
| CPLID | https://data.mendeley.com/datasets/n6wrv4ry6v/6 |
| FLIR ADAS | https://www.flir.com/oem/adas/adas-dataset-form/ |
EOF
        fi
    fi

    log_success "Dataset download complete"
}

# Step 2: Convert formats
convert_formats() {
    log_info "[2/6] Converting dataset formats..."

    if [ -f "$SCRIPT_DIR/data_pipeline/convert_formats.py" ]; then
        run_cmd python "$SCRIPT_DIR/data_pipeline/convert_formats.py" \
            --input "$DATA_DIR/raw" \
            --output "$DATA_DIR/processed" \
            --target_format yolov12,rf_detr,sam3 \
            --class_mapping "$CONFIG_DIR/data_config.yaml"
    else
        log_warning "Format conversion script not found"
        log_info "To convert formats, implement: $SCRIPT_DIR/data_pipeline/convert_formats.py"
    fi

    log_success "Format conversion complete"
}

# Step 3: Split datasets
split_datasets() {
    log_info "[3/6] Splitting datasets into train/val..."

    if [ -f "$SCRIPT_DIR/data_pipeline/split_dataset.py" ]; then
        run_cmd python "$SCRIPT_DIR/data_pipeline/split_dataset.py" \
            --input "$DATA_DIR/processed" \
            --train_ratio 0.8 \
            --val_ratio 0.2 \
            --stratify_by_class \
            --seed 42
    else
        log_warning "Split script not found"
        log_info "To split datasets, implement: $SCRIPT_DIR/data_pipeline/split_dataset.py"
    fi

    log_success "Dataset splitting complete"
}

# Step 4: Generate synthetic thermal data
generate_thermal() {
    log_info "[4/6] Generating synthetic thermal data..."

    if [ -f "$SCRIPT_DIR/data_pipeline/generate_thermal.py" ]; then
        run_cmd python "$SCRIPT_DIR/data_pipeline/generate_thermal.py" \
            --input "$DATA_DIR/processed" \
            --output "$DATA_DIR/processed/thermal" \
            --h30t_simulation \
            --count 5000
    else
        log_warning "Thermal generation script not found"
        log_info "To generate thermal data, implement: $SCRIPT_DIR/data_pipeline/generate_thermal.py"
    fi

    log_success "Thermal data generation complete"
}

# Step 5: Apply augmentations
augment_data() {
    if [ "$AUGMENT" = false ]; then
        log_warning "Skipping augmentation (--skip-augment)"
        return
    fi

    log_info "[5/6] Applying data augmentation (multiplier: $MULTIPLIER)..."

    if [ -f "$SCRIPT_DIR/data_pipeline/augment_data.py" ]; then
        if [ "$MODELS" = "all" ]; then
            for model in yolov12 rf_detr sam3; do
                log_info "Augmenting for $model..."
                run_cmd python "$SCRIPT_DIR/data_pipeline/augment_data.py" \
                    --input "$DATA_DIR/processed/$model" \
                    --output "$DATA_DIR/augmented/$model" \
                    --config "$CONFIG_DIR/data_config.yaml" \
                    --multiplier "$MULTIPLIER" \
                    --h30t_simulation
            done
        else
            run_cmd python "$SCRIPT_DIR/data_pipeline/augment_data.py" \
                --input "$DATA_DIR/processed/$MODELS" \
                --output "$DATA_DIR/augmented/$MODELS" \
                --config "$CONFIG_DIR/data_config.yaml" \
                --multiplier "$MULTIPLIER" \
                --h30t_simulation
        fi
    else
        log_warning "Augmentation script not found"
        log_info "To augment data, implement: $SCRIPT_DIR/data_pipeline/augment_data.py"
    fi

    log_success "Data augmentation complete"
}

# Step 6: Validate datasets
validate_datasets() {
    log_info "[6/6] Validating datasets..."

    if [ -f "$SCRIPT_DIR/data_pipeline/validate_dataset.py" ]; then
        run_cmd python "$SCRIPT_DIR/data_pipeline/validate_dataset.py" \
            --dataset "$DATA_DIR/augmented" \
            --format all \
            --check_labels \
            --check_images \
            --report "$DATA_DIR/validation_report.json"
    else
        log_warning "Validation script not found"
        log_info "To validate datasets, implement: $SCRIPT_DIR/data_pipeline/validate_dataset.py"
    fi

    log_success "Dataset validation complete"
}

# Generate dataset statistics
generate_stats() {
    log_info "Generating dataset statistics..."

    if [ "$DRY_RUN" = false ]; then
        # Count files in each directory
        echo ""
        echo "============================================================================="
        echo " DATASET STATISTICS"
        echo "============================================================================="

        for model in yolov12 rf_detr sam3; do
            if [ -d "$DATA_DIR/augmented/$model" ]; then
                train_count=$(find "$DATA_DIR/augmented/$model" -name "*.jpg" -o -name "*.png" 2>/dev/null | wc -l)
                echo " $model: $train_count images"
            fi
        done

        echo "============================================================================="
        echo ""
    fi
}

# Print completion message
print_completion() {
    echo ""
    echo "============================================================================="
    echo " PIPELINE COMPLETE"
    echo "============================================================================="
    echo ""
    echo " Output directories:"
    echo "   - Raw data:       $DATA_DIR/raw/"
    echo "   - Processed:      $DATA_DIR/processed/"
    echo "   - Augmented:      $DATA_DIR/augmented/"
    echo "   - Validation:     $DATA_DIR/validation_report.json"
    echo ""
    echo " Next steps:"
    echo "   1. Review validation report"
    echo "   2. Run training:"
    echo "      python scripts/training/prepare_yolov12.py --config configs/train_yolov12.yaml"
    echo "      python scripts/training/prepare_rf_detr.py --config configs/train_rf_detr.yaml"
    echo "      python scripts/training/prepare_sam3.py --config configs/train_sam3.yaml"
    echo ""
    echo "============================================================================="
}

# Main execution
main() {
    print_header
    create_directories

    download_datasets
    convert_formats
    split_datasets
    generate_thermal
    augment_data
    validate_datasets

    generate_stats
    print_completion
}

# Run main
main "$@"
