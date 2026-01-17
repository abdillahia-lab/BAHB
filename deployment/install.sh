#!/bin/bash
#
# BAHB One-Line Installer for Jetson Orin NX
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/your-repo/BAHB/main/deployment/install.sh | bash
#   OR
#   ./install.sh
#
# This script will:
# 1. Verify Jetson platform
# 2. Install Docker and Docker Compose if needed
# 3. Configure NVIDIA Container Runtime
# 4. Set up BAHB deployment directories
# 5. Build/pull Docker images
# 6. Configure systemd service for auto-start
# 7. Initialize MQTT broker
# 8. Start BAHB services
#

set -e  # Exit on error
set -u  # Exit on undefined variable

# =============================================================================
# Configuration
# =============================================================================
BAHB_VERSION="1.0.0"
BAHB_DIR="/opt/bahb"
DEPLOYMENT_DIR="${BAHB_DIR}/deployment"
DATA_DIR="/data/bahb"
LOG_FILE="/tmp/bahb_install.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Logging Functions
# =============================================================================
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "${LOG_FILE}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $*" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $*" | tee -a "${LOG_FILE}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $*" | tee -a "${LOG_FILE}"
}

# =============================================================================
# Platform Detection
# =============================================================================
check_platform() {
    log "Checking platform..."

    if [ ! -f /etc/nv_tegra_release ]; then
        error "This script is designed for NVIDIA Jetson platforms only!"
    fi

    # Check for Orin NX specifically
    local jetson_model
    jetson_model=$(cat /proc/device-tree/model 2>/dev/null || echo "Unknown")

    log "Detected Jetson: ${jetson_model}"

    if [[ ! "${jetson_model}" =~ "Orin" ]]; then
        warn "This script is optimized for Jetson Orin NX. Current device: ${jetson_model}"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Check JetPack version
    if [ -f /etc/nv_tegra_release ]; then
        local jetpack_version
        jetpack_version=$(head -n 1 /etc/nv_tegra_release)
        log "JetPack version: ${jetpack_version}"
    fi
}

# =============================================================================
# Dependency Checks and Installation
# =============================================================================
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "Please run as root (use sudo)"
    fi
}

install_docker() {
    if command -v docker &> /dev/null; then
        log "Docker is already installed: $(docker --version)"
        return 0
    fi

    log "Installing Docker..."

    # Remove old versions
    apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

    # Install prerequisites
    apt-get update
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # Add Docker's official GPG key
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Set up repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    log "Docker installed successfully: $(docker --version)"
}

install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        log "Docker Compose is already installed: $(docker-compose --version)"
        return 0
    fi

    log "Installing Docker Compose..."

    # Install docker-compose-plugin (recommended method)
    apt-get install -y docker-compose-plugin

    # Verify installation
    if docker compose version &> /dev/null; then
        log "Docker Compose installed successfully: $(docker compose version)"
    else
        error "Docker Compose installation failed"
    fi
}

configure_nvidia_runtime() {
    log "Configuring NVIDIA Container Runtime..."

    # Check if nvidia-docker2 is installed
    if ! dpkg -l | grep -q nvidia-docker2; then
        log "Installing nvidia-docker2..."

        # Add NVIDIA Docker repository
        distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
        curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add -
        curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
            tee /etc/apt/sources.list.d/nvidia-docker.list

        apt-get update
        apt-get install -y nvidia-docker2
    fi

    # Set NVIDIA as default runtime
    if [ -f /etc/docker/daemon.json ]; then
        log "Backing up existing Docker daemon.json..."
        cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
    fi

    cat > /etc/docker/daemon.json <<EOF
{
    "default-runtime": "nvidia",
    "runtimes": {
        "nvidia": {
            "path": "nvidia-container-runtime",
            "runtimeArgs": []
        }
    },
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "5"
    }
}
EOF

    # Restart Docker
    systemctl restart docker

    # Test NVIDIA runtime
    log "Testing NVIDIA Container Runtime..."
    if docker run --rm --runtime=nvidia nvcr.io/nvidia/l4t-base:r36.2.0 nvidia-smi; then
        log "NVIDIA Container Runtime is working correctly!"
    else
        warn "NVIDIA Container Runtime test failed. Please check manually."
    fi
}

# =============================================================================
# Directory Setup
# =============================================================================
setup_directories() {
    log "Setting up BAHB directories..."

    # Create main directories
    mkdir -p "${BAHB_DIR}"
    mkdir -p "${DEPLOYMENT_DIR}"
    mkdir -p "${DATA_DIR}"/{logs,recordings,reports,cache}
    mkdir -p "${DEPLOYMENT_DIR}"/{models,mosquitto/{config,data,log},prometheus,grafana/{dashboards,datasources}}

    # Set permissions
    chmod -R 755 "${BAHB_DIR}"
    chmod -R 777 "${DATA_DIR}"  # For Docker container access

    log "Directories created successfully"
}

# =============================================================================
# MQTT Configuration
# =============================================================================
configure_mqtt() {
    log "Configuring MQTT broker..."

    local mqtt_config="${DEPLOYMENT_DIR}/mosquitto/config/mosquitto.conf"

    cat > "${mqtt_config}" <<EOF
# Mosquitto Configuration for BAHB
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout

# Listeners
listener 1883
protocol mqtt

listener 9001
protocol websockets

# Security (configure as needed)
allow_anonymous true

# Logging
log_type error
log_type warning
log_type notice
log_type information

# Connection settings
max_connections -1
EOF

    chmod 644 "${mqtt_config}"
    log "MQTT configuration created"
}

# =============================================================================
# Prometheus Configuration
# =============================================================================
configure_prometheus() {
    log "Configuring Prometheus..."

    local prom_config="${DEPLOYMENT_DIR}/prometheus/prometheus.yml"

    cat > "${prom_config}" <<EOF
# Prometheus Configuration for BAHB
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'bahb'
    static_configs:
      - targets: ['bahb:9090']
        labels:
          instance: 'bahb-main'
          service: 'inspection'

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
        labels:
          instance: 'jetson-orin-nx'
EOF

    chmod 644 "${prom_config}"
    log "Prometheus configuration created"
}

# =============================================================================
# Docker Image Build
# =============================================================================
build_images() {
    log "Building BAHB Docker images..."

    cd "${BAHB_DIR}"

    # Build the image (this will take a while on first run)
    info "This may take 30-60 minutes on first build..."
    docker compose -f "${DEPLOYMENT_DIR}/docker-compose.yml" build --progress=plain 2>&1 | tee -a "${LOG_FILE}"

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log "Docker images built successfully"
    else
        error "Docker image build failed. Check ${LOG_FILE} for details."
    fi
}

# =============================================================================
# Systemd Service Configuration
# =============================================================================
configure_systemd() {
    log "Configuring systemd service..."

    # Copy service file to systemd directory
    if [ -f "${DEPLOYMENT_DIR}/bahb.service" ]; then
        cp "${DEPLOYMENT_DIR}/bahb.service" /etc/systemd/system/bahb.service
    else
        warn "bahb.service not found in ${DEPLOYMENT_DIR}, creating default..."
        create_default_service_file
    fi

    # Reload systemd
    systemctl daemon-reload

    # Enable service
    systemctl enable bahb.service

    log "Systemd service configured and enabled"
}

create_default_service_file() {
    cat > /etc/systemd/system/bahb.service <<'EOF'
[Unit]
Description=BAHB - Building And Hardware Baseline Inspection System
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/bahb
ExecStart=/usr/bin/docker compose -f /opt/bahb/deployment/docker-compose.yml up -d
ExecStop=/usr/bin/docker compose -f /opt/bahb/deployment/docker-compose.yml down
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF
}

# =============================================================================
# Performance Optimization
# =============================================================================
optimize_jetson() {
    log "Optimizing Jetson performance..."

    # Set to maximum performance mode
    if command -v nvpmodel &> /dev/null; then
        info "Setting MAXN power mode..."
        nvpmodel -m 0 || warn "Could not set power mode"
    fi

    # Enable maximum clocks
    if command -v jetson_clocks &> /dev/null; then
        info "Enabling maximum clocks..."
        jetson_clocks || warn "Could not set maximum clocks"
    fi

    # Disable GUI to free up resources (optional)
    read -p "Disable GUI to free up resources? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        systemctl set-default multi-user.target
        warn "GUI disabled. Reboot to apply. Re-enable with: systemctl set-default graphical.target"
    fi
}

# =============================================================================
# Main Installation
# =============================================================================
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║          BAHB Installer for Jetson Orin NX                ║"
    echo "║          Version: ${BAHB_VERSION}                                     ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    log "Starting BAHB installation..."
    log "Log file: ${LOG_FILE}"

    # Pre-flight checks
    check_root
    check_platform

    # Install dependencies
    install_docker
    install_docker_compose
    configure_nvidia_runtime

    # Setup
    setup_directories
    configure_mqtt
    configure_prometheus

    # Build images
    read -p "Build Docker images now? This will take 30-60 minutes. (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        build_images
    else
        warn "Skipping image build. You'll need to run 'docker compose build' manually."
    fi

    # Configure systemd
    configure_systemd

    # Optimize performance
    optimize_jetson

    # Final steps
    log ""
    log "╔════════════════════════════════════════════════════════════╗"
    log "║                                                            ║"
    log "║          Installation Complete!                            ║"
    log "║                                                            ║"
    log "╚════════════════════════════════════════════════════════════╝"
    log ""
    log "Next steps:"
    log "  1. Copy your TensorRT model files to: ${DEPLOYMENT_DIR}/models/"
    log "  2. Configure BAHB settings in: ${BAHB_DIR}/configs/production.yaml"
    log "  3. Start BAHB with: systemctl start bahb"
    log "  4. Check status with: systemctl status bahb"
    log "  5. View logs with: docker logs bahb-main -f"
    log ""
    log "Useful commands:"
    log "  docker compose -f ${DEPLOYMENT_DIR}/docker-compose.yml ps       # Check status"
    log "  docker compose -f ${DEPLOYMENT_DIR}/docker-compose.yml logs -f  # View logs"
    log "  docker compose -f ${DEPLOYMENT_DIR}/docker-compose.yml restart  # Restart services"
    log ""
    log "For monitoring (optional):"
    log "  docker compose --profile monitoring up -d  # Start Prometheus + Grafana"
    log "  Access Grafana at: http://localhost:3000"
    log ""

    info "Installation log saved to: ${LOG_FILE}"
}

# =============================================================================
# Run Main Installation
# =============================================================================
main "$@"
