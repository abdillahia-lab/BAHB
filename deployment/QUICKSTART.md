# BAHB Quick Start Guide

Get BAHB running on your Jetson Orin NX in 15 minutes.

## Prerequisites

- NVIDIA Jetson Orin NX with JetPack 6.0 or later
- DJI Manifold 3 (optional, but recommended)
- DJI Matrice 400 with H30T camera
- At least 32GB storage available
- Internet connection for initial setup

## Installation Methods

### Method 1: Automated Installation (Recommended)

One command to install everything:

```bash
cd /home/user/BAHB/deployment
sudo ./install.sh
```

This will take 30-60 minutes on first run. Grab a coffee!

### Method 2: Using Makefile (After Manual Docker Setup)

```bash
cd /home/user/BAHB
make install
```

### Method 3: Manual Step-by-Step

For those who want full control:

```bash
# 1. Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Install NVIDIA Container Runtime
sudo apt-get update
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker

# 3. Test NVIDIA runtime
sudo docker run --rm --runtime=nvidia nvcr.io/nvidia/l4t-base:r36.2.0 nvidia-smi

# 4. Build BAHB
cd /home/user/BAHB
sudo docker compose -f deployment/docker-compose.yml build

# 5. Start services
sudo docker compose -f deployment/docker-compose.yml up -d
```

## Post-Installation Setup

### 1. Copy Model Files

```bash
# Create models directory
sudo mkdir -p /opt/bahb/deployment/models

# Copy your TensorRT engines
sudo cp path/to/yolov12l-inspection.engine /opt/bahb/deployment/models/
sudo cp path/to/rf_detr_large.engine /opt/bahb/deployment/models/
sudo cp path/to/sam3_nano_encoder.engine /opt/bahb/deployment/models/
sudo cp path/to/sam3_nano_decoder.engine /opt/bahb/deployment/models/

# Or copy the entire Qwen model directory
sudo cp -r path/to/Qwen2.5-VL-3B-AWQ /opt/bahb/deployment/models/
```

### 2. Configure Environment

```bash
cd /home/user/BAHB/deployment

# Copy example environment file
cp .env.example .env

# Edit with your settings
nano .env
```

Update these critical values:
```bash
AIRCRAFT_SERIAL=M400-YOUR-SERIAL
WEBHOOK_URL=https://your-webhook-url.com/alerts
```

### 3. Start BAHB

Choose one method:

**Option A: Using systemd (auto-start on boot)**
```bash
sudo systemctl enable bahb
sudo systemctl start bahb
sudo systemctl status bahb
```

**Option B: Using Docker Compose directly**
```bash
cd /home/user/BAHB
sudo docker compose -f deployment/docker-compose.yml up -d
```

**Option C: Using Makefile**
```bash
cd /home/user/BAHB
make up
```

## Verification

### Check Services

```bash
# View all services
sudo docker ps

# Check BAHB main service
sudo docker logs bahb-main --tail 50

# Check MQTT broker
sudo docker logs bahb-mqtt --tail 20
```

Expected output: You should see 2-4 containers running:
- `bahb-main` - Main application
- `bahb-mqtt` - MQTT broker
- `bahb-prometheus` (optional)
- `bahb-grafana` (optional)

### Test GPU Access

```bash
# Test CUDA
sudo docker exec bahb-main python3 -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"

# Expected output: CUDA: True

# Test TensorRT
sudo docker exec bahb-main python3 -c "import tensorrt; print(f'TensorRT: {tensorrt.__version__}')"

# Expected output: TensorRT: 8.6.x
```

### Test MQTT

```bash
# Subscribe to alerts
mosquitto_sub -h localhost -t 'bahb/alerts/#' &

# Publish test message
mosquitto_pub -h localhost -t 'bahb/test' -m 'Hello BAHB'
```

## Usage

### View Logs

```bash
# Real-time logs from all services
sudo docker compose -f deployment/docker-compose.yml logs -f

# Just BAHB main
sudo docker logs bahb-main -f

# Using Makefile
make logs
```

### Performance Optimization

```bash
# Set Jetson to maximum performance
sudo nvpmodel -m 0
sudo jetson_clocks

# Or using Makefile
make optimize

# Monitor resources
sudo tegrastats
```

### Camera Connection

Ensure your DJI H30T camera is streaming:

```bash
# Test RTSP stream (requires gstreamer-tools)
gst-launch-1.0 rtspsrc location=rtsp://192.168.42.2:8554/wide ! fakesink

# Or using Makefile
make test-camera
```

### Running an Inspection

BAHB starts automatically and connects to the camera streams. To run a manual inspection:

```bash
sudo docker exec -it bahb-main python3 -m bahb.main \
    --profile substation \
    --site "Main Substation" \
    --duration 300
```

Or process a single image:

```bash
sudo docker exec -it bahb-main python3 -m bahb.main \
    --image /path/to/image.jpg \
    --output /data/bahb/reports/
```

## Monitoring (Optional)

Start Prometheus and Grafana for advanced monitoring:

```bash
# Start monitoring stack
sudo docker compose -f deployment/docker-compose.yml --profile monitoring up -d

# Or using Makefile
make up-monitoring
```

Access Grafana:
- URL: `http://<jetson-ip>:3000`
- Username: `admin`
- Password: `admin` (change on first login)

## Common Commands

```bash
# Start BAHB
make start              # Using systemd
make up                 # Using Docker Compose

# Stop BAHB
make stop               # Using systemd
make down               # Using Docker Compose

# Restart BAHB
make restart            # Restart all services
make restart-bahb       # Restart only BAHB main

# Check status
make status             # Service status
make health             # Health check

# View logs
make logs               # All services
make logs-bahb          # BAHB main only

# Debug
make debug              # Show debug info
make shell              # Open shell in container
```

## Troubleshooting

### BAHB Won't Start

```bash
# Check logs
sudo docker logs bahb-main

# Common issues:
# 1. Missing model files
ls -la /opt/bahb/deployment/models/

# 2. NVIDIA runtime issue
sudo docker run --rm --runtime=nvidia nvcr.io/nvidia/l4t-base:r36.2.0 nvidia-smi

# 3. Port conflict
sudo netstat -tulpn | grep -E '8080|1883|8554'
```

### GPU Not Detected

```bash
# Verify NVIDIA runtime in Docker
sudo docker info | grep -A 5 Runtimes

# Should show:
#   Runtimes:
#     nvidia: /usr/bin/nvidia-container-runtime

# Check daemon.json
cat /etc/docker/daemon.json

# Restart Docker
sudo systemctl restart docker
sudo docker compose -f deployment/docker-compose.yml restart
```

### MQTT Not Working

```bash
# Check MQTT container
sudo docker logs bahb-mqtt

# Test connection
mosquitto_sub -h localhost -t '$SYS/#' -C 1

# Restart MQTT
sudo docker restart bahb-mqtt
```

### Camera Not Detected

```bash
# Check video devices
ls -la /dev/video*

# Verify device access in container
sudo docker exec bahb-main ls -la /dev/video*

# Test RTSP stream
gst-launch-1.0 rtspsrc location=rtsp://192.168.42.2:8554/wide ! fakesink
```

### High Memory Usage

```bash
# Check resource usage
sudo docker stats

# Adjust GPU memory in configs/production.yaml:
hardware:
  manifold:
    gpu_memory_fraction: 0.8  # Reduce from 0.9
```

## Next Steps

1. **Configure Camera Streams**: Update RTSP URLs in `/home/user/BAHB/configs/production.yaml`

2. **Set Up Alerts**: Configure webhook or MQTT endpoints for critical alerts

3. **Test Detection**: Run an inspection and verify detections are working

4. **Tune Performance**: Adjust batch sizes, input resolutions for your use case

5. **Enable Monitoring**: Set up Grafana dashboards for long-term monitoring

6. **Schedule Inspections**: Create cron jobs or use DJI flight planning software

## Support

- Full documentation: `deployment/README.md`
- View logs: `/data/bahb/logs`
- Configuration: `/home/user/BAHB/configs/production.yaml`

## Performance Expectations

On Jetson Orin NX (MAXN mode):
- **YOLOv12 Detection**: 25-30 FPS
- **Full Pipeline**: 15-20 FPS
- **With VLM Analysis**: 5-10 FPS
- **Power Consumption**: 15-25W

## Security Reminder

Before deploying in production:

1. Change default passwords in `.env`
2. Enable MQTT authentication
3. Configure firewall rules
4. Use HTTPS/TLS for remote access
5. Regularly update JetPack and Docker

---

**Congratulations!** You now have BAHB running on your Jetson Orin NX.

For detailed information, see the full [README.md](README.md).
