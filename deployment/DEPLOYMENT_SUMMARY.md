# BAHB Docker Deployment - Complete Package

This document summarizes the complete Docker deployment setup created for BAHB on Jetson Orin NX.

## Files Created

### Core Deployment Files

| File | Description | Size |
|------|-------------|------|
| **Dockerfile.jetson** | Multi-stage Docker image for Jetson Orin NX with DeepStream 8, TensorRT, OpenCV CUDA, and all dependencies | ~11 KB |
| **docker-compose.yml** | Production orchestration with BAHB, MQTT, Prometheus, and Grafana services | ~6 KB |
| **bahb.service** | Systemd service file for auto-start on boot | ~2.4 KB |
| **install.sh** | One-line automated installer with platform verification and optimization | ~15 KB |

### Documentation

| File | Description |
|------|-------------|
| **README.md** | Comprehensive deployment documentation (9.1 KB) |
| **QUICKSTART.md** | 15-minute quick start guide (7.8 KB) |
| **DEPLOYMENT_SUMMARY.md** | This file - overview of deployment package |

### Configuration Files

| File | Description |
|------|-------------|
| **.env.example** | Environment variable template with all configurable options |
| **.dockerignore** | Optimized Docker build context exclusions |
| **mosquitto/config/mosquitto.conf** | MQTT broker configuration |

### Utilities

| File | Description |
|------|-------------|
| **Makefile** | Convenience commands for deployment management (8.7 KB) |
| **verify_deployment.sh** | Comprehensive deployment verification script |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Jetson Orin NX                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             Docker Environment                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  BAHB Main Container                         │   │   │
│  │  │  - PyTorch + CUDA                           │   │   │
│  │  │  - TensorRT                                 │   │   │
│  │  │  - DeepStream 8                             │   │   │
│  │  │  - OpenCV with CUDA                         │   │   │
│  │  │  - YOLOv12, RF-DETR, SAM3, Qwen2.5-VL     │   │   │
│  │  │  - WebRTC, RTSP streaming                  │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  MQTT Broker (Mosquitto)                    │   │   │
│  │  │  - Port 1883 (MQTT)                         │   │   │
│  │  │  - Port 9001 (WebSockets)                   │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Prometheus (Optional)                       │   │   │
│  │  │  - Metrics collection                        │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Grafana (Optional)                          │   │   │
│  │  │  - Visualization dashboards                  │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Systemd Service (bahb.service)                     │   │
│  │  - Auto-start on boot                               │   │
│  │  - Performance optimization                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                      │                    │
         │                      │                    │
         ▼                      ▼                    ▼
    DJI H30T              Data Storage          Network
    RTSP Streams          /data/bahb            (MQTT, WebRTC)
```

## Installation Methods

### Method 1: One-Line Automated Install (Recommended)
```bash
cd /home/user/BAHB/deployment
sudo ./install.sh
```

### Method 2: Using Makefile
```bash
cd /home/user/BAHB
make install
```

### Method 3: Manual Installation
See QUICKSTART.md for step-by-step instructions.

## Key Features

### Multi-Stage Dockerfile
- **Stage 1**: Base image with PyTorch and CUDA
- **Stage 2**: OpenCV with CUDA support (optimized for Jetson)
- **Stage 3**: DeepStream SDK 8.0
- **Stage 4**: Python dependencies and BAHB application
- **Stage 5**: Final runtime image with optimizations

**Benefits**:
- Smaller final image size
- Better layer caching
- Optimized build times
- Production-ready configuration

### Docker Compose Services

#### BAHB Main Service
- GPU access with NVIDIA runtime
- Host network mode for RTSP/WebRTC
- Volume mounts for models, configs, and data
- Health checks
- Automatic restart policy

#### MQTT Broker
- Persistent message storage
- WebSocket support
- Security-ready configuration
- Health monitoring

#### Monitoring Stack (Optional)
- Prometheus for metrics collection
- Grafana for visualization
- Pre-configured for BAHB metrics

### Systemd Integration
- Auto-start on boot
- Performance optimization (MAXN mode)
- Graceful shutdown
- Service management via systemctl

### Installation Script Features
- Platform verification (Jetson detection)
- Automatic Docker installation
- NVIDIA runtime configuration
- Directory structure creation
- Image building
- Service configuration
- Performance optimization

## Directory Structure

```
/home/user/BAHB/
├── deployment/              # All deployment files (THIS DIRECTORY)
│   ├── Dockerfile.jetson
│   ├── docker-compose.yml
│   ├── install.sh
│   ├── verify_deployment.sh
│   ├── Makefile
│   ├── bahb.service
│   ├── README.md
│   ├── QUICKSTART.md
│   ├── .env.example
│   ├── .dockerignore
│   ├── mosquitto/
│   │   └── config/
│   │       └── mosquitto.conf
│   ├── models/              # TensorRT model files (create this)
│   ├── logs/                # Container logs
│   ├── recordings/          # Video recordings
│   └── reports/             # Inspection reports

/opt/bahb/                   # Symlink to /home/user/BAHB
├── configs/                 # BAHB configuration files
└── bahb/                    # Application code

/data/bahb/                  # Persistent data storage
├── logs/
├── recordings/
├── reports/
└── cache/
```

## Configuration

### Required Configurations

1. **Model Files**: Copy TensorRT engines to `deployment/models/`
   ```bash
   sudo cp *.engine /home/user/BAHB/deployment/models/
   ```

2. **Environment Variables**: Copy and edit `.env`
   ```bash
   cp deployment/.env.example deployment/.env
   nano deployment/.env
   ```

3. **BAHB Config**: Update `configs/production.yaml`
   - Aircraft serial number
   - RTSP stream URLs
   - Webhook endpoints

### Optional Configurations

- MQTT authentication
- Prometheus alerts
- Grafana dashboards
- TLS/SSL certificates

## Usage Examples

### Starting BAHB

**Using Systemd**:
```bash
sudo systemctl start bahb
sudo systemctl status bahb
```

**Using Makefile**:
```bash
make up          # Start services
make logs        # View logs
make status      # Check status
```

**Using Docker Compose**:
```bash
docker compose -f deployment/docker-compose.yml up -d
```

### Monitoring

**View Logs**:
```bash
make logs-bahb                    # BAHB main service
make logs-mqtt                    # MQTT broker
journalctl -u bahb -f             # Systemd logs
```

**Check Health**:
```bash
make health                       # Run health checks
./deployment/verify_deployment.sh # Full verification
```

**Resource Monitoring**:
```bash
make stats                        # Docker stats
sudo tegrastats                   # Jetson stats
```

### Maintenance

**Update BAHB**:
```bash
make update      # Pull, rebuild, restart
```

**Backup**:
```bash
make backup      # Backup everything
make backup-data # Backup data only
```

**Clean Up**:
```bash
make clean       # Remove stopped containers
make clean-logs  # Remove old logs
```

## Performance Optimization

### Jetson Settings
```bash
make optimize         # Set MAXN mode + max clocks
make optimize-status  # Check current mode
```

### GPU Memory Tuning
Edit `configs/production.yaml`:
```yaml
hardware:
  manifold:
    gpu_memory_fraction: 0.9  # Adjust 0.0-1.0
```

### Model Optimization
- Use FP16 precision for TensorRT
- Optimize input sizes
- Adjust batch sizes
- Enable CUDA streams

## Verification

Run comprehensive verification:
```bash
sudo ./deployment/verify_deployment.sh
```

Checks:
- ✓ Platform (Jetson Orin NX)
- ✓ Docker installation
- ✓ NVIDIA runtime
- ✓ Directory structure
- ✓ Configuration files
- ✓ Model files
- ✓ Container status
- ✓ CUDA availability
- ✓ TensorRT
- ✓ Network services
- ✓ Systemd service
- ✓ Performance settings

## Troubleshooting

See the following files for detailed troubleshooting:
- **README.md**: Comprehensive troubleshooting section
- **QUICKSTART.md**: Common issues and quick fixes

Quick diagnostics:
```bash
make debug       # Show debug information
make health      # Run health checks
make logs        # View recent logs
```

## Performance Expectations

On Jetson Orin NX with MAXN power mode:

| Operation | Performance | Power |
|-----------|-------------|-------|
| YOLOv12 Detection | 25-30 FPS | ~15W |
| Full Pipeline (YOLO + RF-DETR + SAM3) | 15-20 FPS | ~20W |
| With VLM Analysis (Qwen2.5-VL) | 5-10 FPS | ~25W |
| Thermal Analysis | Real-time | Minimal |
| Video Recording | 30 FPS @ 4K | ~5W |

Total system power: 20-30W typical

## Security Considerations

Production deployment checklist:
- [ ] Change default passwords in `.env`
- [ ] Enable MQTT authentication
- [ ] Configure firewall rules
- [ ] Use TLS for MQTT and RTSP
- [ ] Set up VPN for remote access
- [ ] Regular updates (JetPack, Docker)
- [ ] Backup encryption
- [ ] Access control lists

## Support and Documentation

- **Quick Start**: See `QUICKSTART.md`
- **Full Documentation**: See `README.md`
- **Verification**: Run `./verify_deployment.sh`
- **Makefile Help**: Run `make help`

## Version Information

- **BAHB Version**: 1.0.0
- **Docker Compose**: 3.8
- **Base Image**: nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3
- **DeepStream**: 8.0
- **TensorRT**: 8.6+
- **OpenCV**: 4.9.0 (with CUDA)
- **Python**: 3.10+

## License

See main project LICENSE file.

---

## Quick Reference

**Essential Commands**:
```bash
# Installation
sudo ./deployment/install.sh

# Verification
sudo ./deployment/verify_deployment.sh

# Start/Stop
make up
make down

# Logs
make logs

# Status
make status

# Performance
make optimize

# Help
make help
```

**Important Paths**:
- Deployment: `/home/user/BAHB/deployment/`
- Models: `/home/user/BAHB/deployment/models/`
- Configs: `/home/user/BAHB/configs/`
- Data: `/data/bahb/`
- Logs: `/data/bahb/logs/`

**Port Reference**:
- 8080: WebRTC control
- 8554: RTSP streaming
- 1883: MQTT
- 9001: MQTT WebSockets
- 3000: Grafana (optional)
- 9091: Prometheus (optional)

---

**Created**: 2026-01-17
**For**: BAHB - Building And Hardware Baseline Inspection System
**Platform**: NVIDIA Jetson Orin NX / DJI Manifold 3
