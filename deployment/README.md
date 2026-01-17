# BAHB Docker Deployment for Jetson Orin NX

Complete production-ready Docker deployment for the BAHB (Building And Hardware Baseline) Inspection System on NVIDIA Jetson Orin NX.

## Quick Start

### One-Line Installation

```bash
sudo ./install.sh
```

This will:
- Verify Jetson platform and JetPack version
- Install Docker and Docker Compose
- Configure NVIDIA Container Runtime
- Set up directories and configurations
- Build BAHB Docker images
- Configure systemd service for auto-start
- Optimize Jetson performance settings

### Manual Installation

If you prefer step-by-step installation:

1. **Install Docker and NVIDIA Runtime**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install NVIDIA Container Runtime
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

2. **Build BAHB Images**
```bash
cd /home/user/BAHB
sudo docker compose -f deployment/docker-compose.yml build
```

3. **Start Services**
```bash
sudo docker compose -f deployment/docker-compose.yml up -d
```

## Architecture

### Services

| Service | Description | Port | Status |
|---------|-------------|------|--------|
| **bahb** | Main inspection application | 8080, 8554 | Required |
| **mqtt-broker** | Mosquitto MQTT broker for alerts | 1883, 9001 | Required |
| **prometheus** | Metrics collection (optional) | 9091 | Optional |
| **grafana** | Metrics visualization (optional) | 3000 | Optional |

### Directory Structure

```
/opt/bahb/
├── deployment/
│   ├── Dockerfile.jetson          # Multi-stage Dockerfile
│   ├── docker-compose.yml         # Service orchestration
│   ├── install.sh                 # One-line installer
│   ├── bahb.service              # Systemd service file
│   ├── models/                    # TensorRT model files
│   ├── mosquitto/                 # MQTT broker config
│   ├── prometheus/                # Prometheus config
│   └── grafana/                   # Grafana dashboards
└── configs/
    └── production.yaml            # BAHB configuration

/data/bahb/
├── logs/                          # Application logs
├── recordings/                    # Video recordings
├── reports/                       # Inspection reports
└── cache/                         # Temporary cache
```

## Configuration

### 1. Model Files

Copy your TensorRT model engines to `/opt/bahb/deployment/models/`:

```bash
# Required models:
sudo cp yolov12l-inspection.engine /opt/bahb/deployment/models/
sudo cp rf_detr_large.engine /opt/bahb/deployment/models/
sudo cp sam3_nano_encoder.engine /opt/bahb/deployment/models/
sudo cp sam3_nano_decoder.engine /opt/bahb/deployment/models/

# Optional: Copy Qwen2.5-VL-3B-AWQ model directory
sudo cp -r Qwen2.5-VL-3B-AWQ/ /opt/bahb/deployment/models/
```

### 2. BAHB Configuration

Edit `/home/user/BAHB/configs/production.yaml`:

```yaml
# Update these values for your deployment:
hardware:
  aircraft:
    serial: "YOUR_AIRCRAFT_SERIAL"

camera:
  h30t:
    streams:
      wide: "rtsp://192.168.42.2:8554/wide"
      zoom: "rtsp://192.168.42.2:8554/zoom"
      thermal: "rtsp://192.168.42.2:8554/thermal"

alerts:
  channels:
    webhook:
      url: "https://your-webhook-url.com/alerts"
```

### 3. Environment Variables

Create `.env` file in deployment directory:

```bash
# deployment/.env
AIRCRAFT_SERIAL=M400-12345
WEBHOOK_URL=https://your-webhook-url.com/alerts
GRAFANA_PASSWORD=secure_password_here
```

## Usage

### Systemd Service (Recommended)

The systemd service provides automatic startup on boot and easy management:

```bash
# Enable auto-start on boot
sudo systemctl enable bahb

# Start BAHB
sudo systemctl start bahb

# Check status
sudo systemctl status bahb

# View logs
journalctl -u bahb -f

# Restart
sudo systemctl restart bahb

# Stop
sudo systemctl stop bahb

# Disable auto-start
sudo systemctl disable bahb
```

### Docker Compose (Manual)

For manual control without systemd:

```bash
cd /opt/bahb

# Start all services
sudo docker compose -f deployment/docker-compose.yml up -d

# Start with monitoring (Prometheus + Grafana)
sudo docker compose -f deployment/docker-compose.yml --profile monitoring up -d

# View logs
sudo docker compose -f deployment/docker-compose.yml logs -f

# View logs for specific service
sudo docker logs bahb-main -f

# Stop all services
sudo docker compose -f deployment/docker-compose.yml down

# Restart specific service
sudo docker compose -f deployment/docker-compose.yml restart bahb

# Check status
sudo docker compose -f deployment/docker-compose.yml ps
```

### Health Checks

```bash
# Check container health
sudo docker ps --filter name=bahb

# Check BAHB main service
curl http://localhost:8080/health

# Check MQTT broker
mosquitto_sub -h localhost -t '$SYS/#' -C 1
```

## Performance Optimization

### Jetson Configuration

```bash
# Set maximum performance mode
sudo nvpmodel -m 0

# Enable maximum clocks
sudo jetson_clocks

# Check current mode
sudo nvpmodel -q

# Monitor GPU/CPU usage
sudo tegrastats
```

### GPU Memory Optimization

Edit `configs/production.yaml`:

```yaml
hardware:
  manifold:
    gpu_memory_fraction: 0.9  # Adjust based on available memory
    power_mode: "MAXN"
```

### Model Optimization

If models aren't already optimized for TensorRT:

```bash
# Convert YOLO model to TensorRT
docker exec -it bahb-main python3 -c "
from ultralytics import YOLO
model = YOLO('models/yolov12l.pt')
model.export(format='engine', device=0, half=True, workspace=4)
"
```

## Monitoring

### Prometheus + Grafana (Optional)

Start monitoring stack:

```bash
sudo docker compose -f deployment/docker-compose.yml --profile monitoring up -d
```

Access Grafana:
- URL: http://jetson-ip:3000
- Default credentials: admin / admin (change on first login)

### MQTT Monitoring

Subscribe to BAHB alerts:

```bash
# All alerts
mosquitto_sub -h localhost -t 'bahb/alerts/#'

# Critical alerts only
mosquitto_sub -h localhost -t 'bahb/alerts/critical'
```

## Troubleshooting

### Check Container Logs

```bash
# All services
sudo docker compose -f deployment/docker-compose.yml logs

# BAHB main application
sudo docker logs bahb-main --tail 100 -f

# MQTT broker
sudo docker logs bahb-mqtt --tail 50
```

### NVIDIA Runtime Issues

```bash
# Verify NVIDIA runtime
sudo docker run --rm --runtime=nvidia nvcr.io/nvidia/l4t-base:r36.2.0 nvidia-smi

# Check Docker daemon configuration
cat /etc/docker/daemon.json

# Restart Docker service
sudo systemctl restart docker
```

### GPU Not Detected

```bash
# Check CUDA availability
sudo docker exec -it bahb-main python3 -c "import torch; print(torch.cuda.is_available())"

# Check TensorRT
sudo docker exec -it bahb-main python3 -c "import tensorrt; print(tensorrt.__version__)"
```

### MQTT Connection Issues

```bash
# Check MQTT broker is running
sudo docker ps | grep mqtt

# Test MQTT connection
mosquitto_pub -h localhost -t 'test' -m 'hello'
mosquitto_sub -h localhost -t 'test' -C 1
```

### High CPU/Memory Usage

```bash
# Check resource usage
sudo docker stats

# Limit BAHB memory (in docker-compose.yml)
deploy:
  resources:
    limits:
      memory: 6G
```

### Camera/RTSP Issues

```bash
# Test RTSP stream
gst-launch-1.0 rtspsrc location=rtsp://192.168.42.2:8554/wide ! fakesink

# Check device access
ls -la /dev/video*

# Verify camera permissions in container
sudo docker exec -it bahb-main ls -la /dev/video*
```

## Updates and Maintenance

### Update BAHB

```bash
# Pull latest code
cd /home/user/BAHB
git pull

# Rebuild images
sudo docker compose -f deployment/docker-compose.yml build

# Restart services
sudo systemctl restart bahb
```

### Backup Data

```bash
# Backup recordings and reports
sudo tar -czf bahb-backup-$(date +%Y%m%d).tar.gz /data/bahb/

# Backup configuration
sudo tar -czf bahb-config-backup.tar.gz /opt/bahb/configs /opt/bahb/deployment
```

### Clean Up Old Data

```bash
# Clean old recordings (older than 30 days)
find /data/bahb/recordings -mtime +30 -delete

# Clean old logs
find /data/bahb/logs -name "*.log.gz" -mtime +7 -delete

# Prune Docker resources
sudo docker system prune -a
```

## Security Considerations

### MQTT Security

For production deployments, enable authentication:

1. Create password file:
```bash
sudo docker exec -it bahb-mqtt mosquitto_passwd -c /mosquitto/config/passwd bahb_user
```

2. Update `mosquitto/config/mosquitto.conf`:
```
allow_anonymous false
password_file /mosquitto/config/passwd
```

3. Restart MQTT broker:
```bash
sudo docker compose -f deployment/docker-compose.yml restart mqtt-broker
```

### Network Security

- Use firewall rules to restrict access
- Enable TLS for MQTT and RTSP
- Use VPN for remote access
- Keep JetPack and Docker updated

## Performance Metrics

Expected performance on Jetson Orin NX (MAXN mode):

| Operation | FPS | Latency | Power |
|-----------|-----|---------|-------|
| YOLOv12 Detection | 25-30 | 33ms | ~15W |
| Full Pipeline | 15-20 | 50-60ms | ~20W |
| With VLM Analysis | 5-10 | 100-200ms | ~25W |

## Support

- Documentation: `/docs` directory
- Logs: `/data/bahb/logs`
- Issues: GitHub Issues
- Contact: support@your-org.com

## License

Proprietary - See LICENSE file for details
