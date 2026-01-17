#!/bin/bash
#
# BAHB Deployment Verification Script
#
# This script performs comprehensive checks to verify that BAHB
# is properly installed and configured on Jetson Orin NX
#
# Usage:
#   sudo ./verify_deployment.sh
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
WARNINGS=0

# ==========================================
# Helper Functions
# ==========================================

print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}$1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

test_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# ==========================================
# Platform Checks
# ==========================================

check_platform() {
    print_header "Platform Verification"

    # Check if running on Jetson
    if [ -f /etc/nv_tegra_release ]; then
        local jetpack=$(head -n 1 /etc/nv_tegra_release)
        test_pass "Running on NVIDIA Jetson: ${jetpack}"
    else
        test_fail "Not running on NVIDIA Jetson platform"
    fi

    # Check Jetson model
    if [ -f /proc/device-tree/model ]; then
        local model=$(cat /proc/device-tree/model 2>/dev/null || echo "Unknown")
        if [[ "${model}" =~ "Orin" ]]; then
            test_pass "Jetson model: ${model}"
        else
            test_warn "Not running on Orin NX. Current: ${model}"
        fi
    fi

    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        test_pass "Running as root"
    else
        test_fail "Not running as root. Use: sudo $0"
        exit 1
    fi
}

# ==========================================
# Docker Checks
# ==========================================

check_docker() {
    print_header "Docker Environment"

    # Check Docker installation
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version)
        test_pass "Docker installed: ${docker_version}"
    else
        test_fail "Docker not installed"
        return 1
    fi

    # Check Docker service
    if systemctl is-active --quiet docker; then
        test_pass "Docker service is running"
    else
        test_fail "Docker service is not running"
    fi

    # Check Docker Compose
    if docker compose version &> /dev/null; then
        local compose_version=$(docker compose version)
        test_pass "Docker Compose installed: ${compose_version}"
    else
        test_fail "Docker Compose not installed"
    fi

    # Check NVIDIA runtime
    if docker info 2>/dev/null | grep -q nvidia; then
        test_pass "NVIDIA Docker runtime is configured"
    else
        test_fail "NVIDIA Docker runtime not found"
    fi

    # Test NVIDIA runtime
    echo "  Testing NVIDIA runtime..."
    if docker run --rm --runtime=nvidia nvcr.io/nvidia/l4t-base:r36.2.0 nvidia-smi &>/dev/null; then
        test_pass "NVIDIA runtime test successful"
    else
        test_fail "NVIDIA runtime test failed"
    fi
}

# ==========================================
# Directory Structure
# ==========================================

check_directories() {
    print_header "Directory Structure"

    local required_dirs=(
        "/opt/bahb"
        "/opt/bahb/deployment"
        "/data/bahb"
        "/data/bahb/logs"
        "/data/bahb/recordings"
        "/data/bahb/reports"
    )

    for dir in "${required_dirs[@]}"; do
        if [ -d "${dir}" ]; then
            test_pass "Directory exists: ${dir}"
        else
            test_fail "Directory missing: ${dir}"
        fi
    done

    # Check deployment files
    local required_files=(
        "/opt/bahb/deployment/Dockerfile.jetson"
        "/opt/bahb/deployment/docker-compose.yml"
        "/opt/bahb/deployment/install.sh"
        "/opt/bahb/deployment/bahb.service"
    )

    for file in "${required_files[@]}"; do
        if [ -f "${file}" ]; then
            test_pass "File exists: ${file}"
        else
            test_fail "File missing: ${file}"
        fi
    done
}

# ==========================================
# Container Status
# ==========================================

check_containers() {
    print_header "Container Status"

    cd /opt/bahb

    # Check if containers are running
    if docker compose -f deployment/docker-compose.yml ps --quiet bahb &>/dev/null; then
        local bahb_status=$(docker inspect -f '{{.State.Status}}' bahb-main 2>/dev/null || echo "not found")
        if [ "${bahb_status}" == "running" ]; then
            test_pass "BAHB main container is running"
        else
            test_warn "BAHB main container status: ${bahb_status}"
        fi
    else
        test_warn "BAHB containers not started (use 'make up' to start)"
    fi

    # Check MQTT broker
    if docker ps --filter name=bahb-mqtt --filter status=running --quiet &>/dev/null; then
        test_pass "MQTT broker container is running"
    else
        test_warn "MQTT broker container not running"
    fi

    # Display all BAHB containers
    echo ""
    echo "  Container Status:"
    docker compose -f deployment/docker-compose.yml ps 2>/dev/null || echo "  No containers found"
}

# ==========================================
# NVIDIA/CUDA Checks
# ==========================================

check_cuda() {
    print_header "CUDA and GPU"

    # Check nvidia-smi
    if command -v nvidia-smi &> /dev/null; then
        test_pass "nvidia-smi available"
        echo ""
        nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader | \
            sed 's/^/  /'
    else
        test_fail "nvidia-smi not found"
    fi

    # Check if BAHB container is running
    if docker ps --filter name=bahb-main --filter status=running --quiet &>/dev/null; then
        # Test PyTorch CUDA
        echo "  Testing PyTorch CUDA in container..."
        if docker exec bahb-main python3 -c "import torch; assert torch.cuda.is_available()" 2>/dev/null; then
            test_pass "PyTorch CUDA is available in container"
            local device_name=$(docker exec bahb-main python3 -c "import torch; print(torch.cuda.get_device_name(0))" 2>/dev/null)
            echo "    GPU: ${device_name}"
        else
            test_fail "PyTorch CUDA not available in container"
        fi

        # Test TensorRT
        echo "  Testing TensorRT in container..."
        if docker exec bahb-main python3 -c "import tensorrt" 2>/dev/null; then
            local trt_version=$(docker exec bahb-main python3 -c "import tensorrt; print(tensorrt.__version__)" 2>/dev/null)
            test_pass "TensorRT available: ${trt_version}"
        else
            test_fail "TensorRT not available in container"
        fi
    else
        test_warn "BAHB container not running - skipping CUDA tests"
    fi
}

# ==========================================
# Model Files
# ==========================================

check_models() {
    print_header "Model Files"

    local model_dir="/opt/bahb/deployment/models"

    if [ -d "${model_dir}" ]; then
        test_pass "Model directory exists"

        local model_count=$(find "${model_dir}" -type f \( -name "*.engine" -o -name "*.trt" \) 2>/dev/null | wc -l)
        if [ ${model_count} -gt 0 ]; then
            test_pass "Found ${model_count} TensorRT model file(s)"
            echo "  Model files:"
            find "${model_dir}" -type f \( -name "*.engine" -o -name "*.trt" \) -exec ls -lh {} \; 2>/dev/null | \
                awk '{print "    " $9 " (" $5 ")"}' || true
        else
            test_warn "No TensorRT model files found in ${model_dir}"
            echo "    Copy your .engine files to: ${model_dir}/"
        fi

        # Check for Qwen model
        if [ -d "${model_dir}/Qwen2.5-VL-3B-AWQ" ]; then
            test_pass "Qwen2.5-VL model directory found"
        else
            test_warn "Qwen2.5-VL model not found (optional)"
        fi
    else
        test_fail "Model directory not found: ${model_dir}"
    fi
}

# ==========================================
# Configuration
# ==========================================

check_configuration() {
    print_header "Configuration Files"

    # Check main config
    if [ -f "/home/user/BAHB/configs/production.yaml" ]; then
        test_pass "Production config exists"
    else
        test_fail "Production config missing: /home/user/BAHB/configs/production.yaml"
    fi

    # Check environment file
    if [ -f "/opt/bahb/deployment/.env" ]; then
        test_pass "Environment file exists"
    else
        test_warn "Environment file missing (optional)"
        echo "    Copy .env.example to .env and configure"
    fi

    # Check MQTT config
    if [ -f "/opt/bahb/deployment/mosquitto/config/mosquitto.conf" ]; then
        test_pass "MQTT configuration exists"
    else
        test_warn "MQTT configuration missing"
    fi
}

# ==========================================
# Network and Services
# ==========================================

check_network() {
    print_header "Network and Services"

    # Check port availability
    local ports=(8080 8554 1883)
    local port_names=("WebRTC" "RTSP" "MQTT")

    for i in "${!ports[@]}"; do
        local port="${ports[$i]}"
        local name="${port_names[$i]}"

        if netstat -tuln 2>/dev/null | grep -q ":${port} "; then
            test_pass "Port ${port} (${name}) is in use (service running)"
        else
            test_warn "Port ${port} (${name}) not in use (service may not be running)"
        fi
    done

    # Test MQTT if container is running
    if docker ps --filter name=bahb-mqtt --filter status=running --quiet &>/dev/null; then
        echo "  Testing MQTT broker..."
        if timeout 5 mosquitto_sub -h localhost -t '$SYS/#' -C 1 &>/dev/null; then
            test_pass "MQTT broker is responding"
        else
            test_warn "MQTT broker not responding"
        fi
    fi
}

# ==========================================
# Systemd Service
# ==========================================

check_systemd() {
    print_header "Systemd Service"

    # Check if service file exists
    if [ -f "/etc/systemd/system/bahb.service" ]; then
        test_pass "Systemd service file installed"

        # Check if enabled
        if systemctl is-enabled --quiet bahb 2>/dev/null; then
            test_pass "Service is enabled (will start on boot)"
        else
            test_warn "Service not enabled (use: systemctl enable bahb)"
        fi

        # Check if active
        if systemctl is-active --quiet bahb 2>/dev/null; then
            test_pass "Service is active"
        else
            test_warn "Service not active (use: systemctl start bahb)"
        fi
    else
        test_warn "Systemd service not installed"
        echo "    Install with: sudo cp deployment/bahb.service /etc/systemd/system/"
    fi
}

# ==========================================
# Performance Settings
# ==========================================

check_performance() {
    print_header "Performance Settings"

    # Check power mode
    if command -v nvpmodel &> /dev/null; then
        local power_mode=$(nvpmodel -q 2>/dev/null | grep "NV Power Mode" | awk '{print $NF}')
        if [ "${power_mode}" == "MODE_15W" ] || [ "${power_mode}" == "MAXN" ]; then
            test_pass "Power mode: ${power_mode}"
        else
            test_warn "Power mode: ${power_mode} (consider MAXN for best performance)"
        fi
    else
        test_warn "nvpmodel not available"
    fi

    # Check jetson_clocks
    if command -v jetson_clocks &> /dev/null; then
        test_pass "jetson_clocks available"
    else
        test_warn "jetson_clocks not available"
    fi

    # Check available disk space
    local available_space=$(df -h /data/bahb 2>/dev/null | awk 'NR==2 {print $4}' || echo "Unknown")
    echo "  Available disk space: ${available_space}"

    local available_gb=$(df -BG /data/bahb 2>/dev/null | awk 'NR==2 {print $4}' | sed 's/G//' || echo "0")
    if [ "${available_gb}" -gt 10 ]; then
        test_pass "Sufficient disk space: ${available_space}"
    else
        test_warn "Low disk space: ${available_space}"
    fi
}

# ==========================================
# Optional: Health Endpoint Test
# ==========================================

check_health() {
    print_header "Health Checks"

    # Only if container is running
    if docker ps --filter name=bahb-main --filter status=running --quiet &>/dev/null; then
        echo "  Testing BAHB health endpoint..."
        if timeout 5 curl -f http://localhost:8080/health &>/dev/null; then
            test_pass "BAHB health endpoint responding"
        else
            test_warn "BAHB health endpoint not responding (may still be starting)"
        fi

        # Check container health status
        local health_status=$(docker inspect -f '{{.State.Health.Status}}' bahb-main 2>/dev/null || echo "none")
        if [ "${health_status}" == "healthy" ]; then
            test_pass "Container health status: healthy"
        elif [ "${health_status}" == "none" ]; then
            test_warn "No health check configured"
        else
            test_warn "Container health status: ${health_status}"
        fi
    else
        test_warn "BAHB container not running - skipping health checks"
    fi
}

# ==========================================
# Summary
# ==========================================

print_summary() {
    print_header "Verification Summary"

    local total=$((PASSED + FAILED + WARNINGS))

    echo ""
    echo -e "  ${GREEN}Passed:${NC}   ${PASSED}/${total}"
    echo -e "  ${RED}Failed:${NC}   ${FAILED}/${total}"
    echo -e "  ${YELLOW}Warnings:${NC} ${WARNINGS}/${total}"
    echo ""

    if [ ${FAILED} -eq 0 ]; then
        if [ ${WARNINGS} -eq 0 ]; then
            echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${GREEN}✓ All checks passed! BAHB is ready to use.${NC}"
            echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo ""
            echo "Next steps:"
            echo "  1. Start BAHB: sudo systemctl start bahb"
            echo "  2. View logs: make logs"
            echo "  3. Check status: make status"
        else
            echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${YELLOW}⚠ Some warnings found. Review above.${NC}"
            echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        fi
    else
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}✗ Some checks failed. Please review errors above.${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Common fixes:"
        echo "  - Run installation: sudo ./deployment/install.sh"
        echo "  - Check Docker: sudo systemctl status docker"
        echo "  - Check logs: sudo docker logs bahb-main"
        return 1
    fi
}

# ==========================================
# Main Execution
# ==========================================

main() {
    clear
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║          BAHB Deployment Verification                      ║"
    echo "║          Jetson Orin NX                                    ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"

    check_platform
    check_docker
    check_directories
    check_configuration
    check_models
    check_containers
    check_cuda
    check_network
    check_systemd
    check_performance
    check_health
    print_summary
}

# Run main function
main "$@"
