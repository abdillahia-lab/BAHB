# BAHB Deployment Architecture

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**Status:** APPROVED

---

## Table of Contents

1. [Overview](#overview)
2. [Hardware Platform](#hardware-platform)
3. [Software Stack](#software-stack)
4. [Network Architecture](#network-architecture)
5. [Deployment Scenarios](#deployment-scenarios)
6. [Installation & Configuration](#installation--configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Disaster Recovery](#disaster-recovery)
9. [Performance Tuning](#performance-tuning)

---

## Overview

BAHB deploys as an **edge-first system** with optional cloud connectivity. All critical processing happens on-device (Manifold 3) for zero-latency operation even without network connectivity.

### Deployment Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT TOPOLOGY                           │
└─────────────────────────────────────────────────────────────────┘

  EDGE (Primary)                    CLOUD (Optional)
  ══════════════                    ════════════════

  ┌────────────────────┐            ┌────────────────────┐
  │  DJI Matrice 400   │            │  Cloud Backend     │
  │  ┌──────────────┐  │            │  ┌──────────────┐  │
  │  │ Manifold 3   │  │◄───LTE────►│  │ Data Lake    │  │
  │  │ (Orin NX)    │  │   /WiFi    │  │ (S3/MinIO)   │  │
  │  │              │  │            │  └──────────────┘  │
  │  │ - BAHB Core  │  │            │  ┌──────────────┐  │
  │  │ - AI Models  │  │            │  │ Analytics    │  │
  │  │ - TensorRT   │  │            │  │ (Grafana)    │  │
  │  │ - WebSocket  │  │            │  └──────────────┘  │
  │  └──────────────┘  │            │  ┌──────────────┐  │
  │  ┌──────────────┐  │            │  │ Fleet Mgmt   │  │
  │  │ H30T Camera  │  │            │  │ (Dashboard)  │  │
  │  └──────────────┘  │            │  └──────────────┘  │
  └────────────────────┘            └────────────────────┘
          │
          │ WiFi 6
          │ 192.168.42.x
          ▼
  ┌────────────────────┐
  │  DJI RC Plus 2     │
  │  ┌──────────────┐  │
  │  │ BAHB App     │  │
  │  │ (Kotlin)     │  │
  │  │              │  │
  │  │ - FPV View   │  │
  │  │ - AI Overlay │  │
  │  │ - Controls   │  │
  │  └──────────────┘  │
  └────────────────────┘

  Field Operator
```

### Key Characteristics

- **Edge Processing:** 100% functionality offline
- **Cloud Sync:** Optional upload for analysis/archival
- **Multi-Drone:** Single RC can control multiple drones (one at a time)
- **Portable:** No external infrastructure required

---

## Hardware Platform

### DJI Matrice 400 Series

**Specifications:**

| Feature | Value |
|---------|-------|
| **Max Takeoff Weight** | 9.2 kg |
| **Max Flight Time** | 32 minutes (no payload) |
| **Max Speed** | 20 m/s (Sport mode) |
| **Operating Temperature** | -20°C to 50°C |
| **Wind Resistance** | 15 m/s |
| **IP Rating** | IP55 (dust/water resistant) |
| **GNSS** | GPS + GLONASS + BeiDou + Galileo |
| **RTK** | Centimeter-level positioning |

**Payload Capacity:** 2.7 kg (with Manifold 3 + H30T)

---

### DJI Manifold 3 (Onboard Computer)

**Hardware Specs:**

```
┌─────────────────────────────────────────────────┐
│           DJI MANIFOLD 3 SPECIFICATIONS          │
└─────────────────────────────────────────────────┘

CPU:        8-core ARM Cortex-A78AE @ 2.2 GHz
GPU:        NVIDIA Ampere (1024 CUDA cores, 32 Tensor cores)
RAM:        16 GB LPDDR5
Storage:    128 GB NVMe SSD
Power:      15-25W TDP (dynamic)
OS:         Ubuntu 22.04 LTS (JetPack 6.0)
Connectivity:
  - Gigabit Ethernet (to drone)
  - WiFi 6 802.11ax
  - 4G/5G Module (optional)
  - USB 3.2 Gen 2
  - HDMI 2.1
  - CAN Bus
Dimensions: 120mm x 100mm x 55mm
Weight:     485g
Temperature: -20°C to 60°C
```

**Compute Capabilities:**

- **INT8:** 184 TOPS
- **FP16:** 92 TFLOPS
- **FP32:** 11.5 TFLOPS

**Cooling:** Active cooling with temperature monitoring

---

### DJI H30T Multi-Sensor Camera

**Sensor Array:**

```
┌────────────────────────────────────────────────────────────┐
│               DJI H30T SENSOR SPECIFICATIONS                │
└────────────────────────────────────────────────────────────┘

Wide Angle Camera:
  - Sensor: 1/1.32" CMOS
  - Resolution: 4096 x 2160 (8.96 MP)
  - Lens: 24mm equivalent, f/1.8
  - FOV: 82°
  - Shutter: Mechanical + Electronic

Zoom Camera:
  - Sensor: 1/1.28" CMOS
  - Resolution: 3840 x 2160 (8.29 MP)
  - Optical Zoom: 5x - 200x (hybrid)
  - FOV: 63° (wide) to 2.3° (max zoom)
  - Stabilization: 3-axis gimbal

Thermal Camera:
  - Sensor: VOx Microbolometer
  - Resolution: 640 x 512 pixels
  - Temperature Range: -40°C to +550°C
  - Accuracy: ±2°C or ±2% (higher)
  - NETD: ≤50mK @ f/1.0
  - Frame Rate: 30 Hz
  - Palettes: White Hot, Black Hot, Ironbow, Rainbow

Laser Rangefinder:
  - Technology: 1550nm ToF
  - Range: 3m - 1200m
  - Accuracy: ±(0.2m + D×0.15%)
  - FOV: <1°
```

**Weight:** 1.3 kg (including gimbal)
**Power:** 18W typical

---

### DJI RC Plus 2 Enterprise Enhanced

**Specifications:**

```
┌────────────────────────────────────────────────┐
│          DJI RC PLUS 2 SPECIFICATIONS           │
└────────────────────────────────────────────────┘

Display:
  - Size: 7 inches
  - Resolution: 1920 x 1200 (WUXGA)
  - Brightness: 1400 nits
  - Type: IPS LCD, Capacitive Touch

Processor:
  - SoC: Qualcomm Snapdragon (8-core)
  - RAM: 8 GB LPDDR5
  - Storage: 256 GB

OS: Android 11 (DJI custom)

Battery:
  - Capacity: 5880 mAh
  - Operating Time: 3.3 hours

Connectivity:
  - WiFi 6 (802.11ax)
  - Bluetooth 5.1
  - 4G LTE (optional)
  - GNSS: GPS + GLONASS + BeiDou + Galileo

Control:
  - Dual joysticks
  - C1/C2 customizable buttons
  - 5D button
  - Scroll wheel
  - Power button
  - RTH button

Ports:
  - USB-C
  - HDMI output
  - Ethernet (optional adapter)

Weight: 1065g
Dimensions: 231 x 176 x 87mm
Operating Temp: -10°C to 40°C
```

---

## Software Stack

### Manifold 3 Software

```
┌─────────────────────────────────────────────────────────────┐
│               MANIFOLD 3 SOFTWARE STACK                      │
└─────────────────────────────────────────────────────────────┘

Operating System Layer
────────────────────────
Ubuntu 22.04 LTS (Kernel 5.15)
├─► JetPack 6.0
├─► systemd (init system)
└─► Network Manager

Hardware Drivers
────────────────
├─► NVIDIA Drivers 535.113
├─► CUDA 12.2
├─► cuDNN 8.9
└─► TensorRT 8.6

Container Runtime (Optional)
─────────────────────────────
Docker 24.0 + NVIDIA Container Runtime
└─► For isolated deployment

Python Runtime
──────────────
Python 3.10.12
├─► pip 23.2
├─► venv (virtual environments)
└─► System packages

Key Libraries
─────────────
├─► PyTorch 2.1 (GPU)
├─► ONNX Runtime 1.16 (GPU)
├─► OpenCV 4.8 (CUDA-enabled)
├─► NumPy 1.24
├─► SciPy 1.11
├─► Pydantic 2.5
└─► loguru 0.7

BAHB Application
────────────────
/opt/bahb/
├─► venv/ (Python virtual env)
├─► bahb/ (Python package)
├─► models/ (AI weights)
├─► configs/ (Configuration)
└─► logs/ (Application logs)

System Services
───────────────
├─► bahb.service (systemd)
├─► bahb-webrtc.service
└─► bahb-recorder.service

Data Storage
────────────
/data/bahb/
├─► inspections/ (Session data)
├─► reports/ (Generated reports)
├─► recordings/ (Video files)
└─► cache/ (Temporary files)
```

---

### RC Plus 2 Software

```
┌─────────────────────────────────────────────────────────────┐
│               RC PLUS 2 SOFTWARE STACK                       │
└─────────────────────────────────────────────────────────────┘

Operating System
────────────────
Android 11 (API Level 30)
└─► DJI customized ROM

DJI Runtime
───────────
├─► DJI MSDK v5.17.0
├─► DJI UX SDK v5.17.0
└─► DJI Video Decoder

BAHB Companion App
──────────────────
com.bahb (Kotlin)
├─► Kotlin 1.9
├─► Jetpack Compose
├─► Coroutines + Flow
├─► OkHttp 4.12 (WebSocket)
├─► Gson 2.10 (JSON)
└─► Timber (Logging)

APK Size: ~45 MB
Installation: Internal storage or SD card

Data Storage
────────────
/storage/emulated/0/Android/data/com.bahb/
├─► cache/ (Temporary)
└─► files/ (Settings)
```

---

## Network Architecture

### Field Network Topology

```
┌─────────────────────────────────────────────────────────────┐
│                   FIELD NETWORK TOPOLOGY                     │
└─────────────────────────────────────────────────────────────┘

DJI Matrice 400 (192.168.42.1)
│
├─► Manifold 3 (192.168.42.3)
│   ├─► eth0: 192.168.42.3/24 (Gigabit)
│   ├─► wlan0: DHCP (WiFi 6, optional)
│   └─► wwan0: Cellular (4G/5G, optional)
│
├─► H30T Camera (192.168.42.2)
│   └─► RTSP Streams:
│       ├─► rtsp://192.168.42.2:8554/wide
│       ├─► rtsp://192.168.42.2:8554/zoom
│       └─► rtsp://192.168.42.2:8554/thermal
│
└─► WiFi AP (192.168.42.1)
    └─► SSID: BAHB-Matrice400-XXXX

RC Plus 2 (192.168.42.10)
└─► WiFi Client (connected to drone AP)

Optional: Cloud Backend
└─► VPN/LTE: Manifold → Cloud
    └─► MQTT: tcp://cloud.example.com:1883
```

**Network Services:**

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| WebSocket | 8080 | TCP | Real-time data (Manifold ↔ RC) |
| RTSP (Wide) | 8554 | TCP/UDP | Video stream |
| RTSP (Zoom) | 8554 | TCP/UDP | Video stream |
| RTSP (Thermal) | 8554 | TCP/UDP | Video stream |
| SSH | 22 | TCP | Remote management |
| HTTP API | 8000 | TCP | REST API (optional) |
| MQTT | 1883 | TCP | Alerts (to cloud) |

---

### Firewall Configuration

```bash
# Manifold 3 firewall (ufw)

# Allow SSH (for maintenance)
ufw allow 22/tcp

# Allow WebSocket (from RC)
ufw allow from 192.168.42.0/24 to any port 8080

# Allow RTSP (from RC/Manifold)
ufw allow from 192.168.42.0/24 to any port 8554

# Allow MQTT (to cloud)
ufw allow out 1883/tcp

# Default deny
ufw default deny incoming
ufw default allow outgoing

# Enable firewall
ufw enable
```

---

## Deployment Scenarios

### Scenario 1: Standalone Field Operation

**Use Case:** Remote inspection site, no internet connectivity

**Configuration:**
- Manifold 3: Fully autonomous
- RC Plus 2: Connected via drone WiFi
- Data Storage: Local SSD only
- Reports: Generated on completion, stored locally

**Workflow:**
1. Power on drone
2. Connect RC to drone WiFi
3. Launch BAHB app
4. Start inspection
5. View real-time AI overlay
6. Complete inspection
7. Transfer reports via USB/SD card

**Limitations:**
- No cloud sync
- No remote monitoring
- Manual data transfer required

---

### Scenario 2: LTE-Connected Operation

**Use Case:** Urban inspection with cellular coverage

**Configuration:**
- Manifold 3: Cellular modem enabled
- Cloud: Backend services running
- MQTT: Real-time alerts to operations center
- S3: Automatic report upload

**Workflow:**
1. Power on drone (auto-connects to LTE)
2. Connect RC to drone WiFi
3. Start inspection (session created in cloud)
4. Real-time alerts sent to ops center
5. Complete inspection
6. Auto-upload: reports, video, data
7. Cloud dashboard updated

**Benefits:**
- Real-time monitoring
- Automatic backups
- Fleet visibility
- Instant alerts

---

### Scenario 3: Multi-Drone Fleet

**Use Case:** Large site requiring multiple drones

**Configuration:**
- Multiple Matrice 400 + Manifold 3 pairs
- Single RC (switches between drones)
- Central cloud backend
- Coordinated mission planning

**Workflow:**
1. Deploy drones to different zones
2. RC connects to Drone #1
3. Complete zone 1 inspection
4. RC disconnects, connects to Drone #2
5. Complete zone 2 inspection
6. All data aggregates in cloud
7. Combined report generated

**Requirements:**
- Cloud backend (mission coordination)
- Unique drone IDs
- Synchronized timing

---

## Installation & Configuration

### Manifold 3 Setup

**1. Initial OS Setup:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install NVIDIA drivers (JetPack)
sudo apt install nvidia-jetpack -y

# Install Python and tools
sudo apt install python3.10 python3.10-venv python3-pip git -y

# Install system dependencies
sudo apt install libopencv-dev ffmpeg gstreamer1.0-tools -y
```

**2. BAHB Installation:**

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/your-org/BAHB.git
sudo chown -R manifold:manifold /opt/BAHB

# Create virtual environment
cd /opt/BAHB
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Download model weights
./scripts/download_models.sh

# Configure
cp configs/production.yaml.example configs/production.yaml
nano configs/production.yaml  # Edit configuration
```

**3. System Service Setup:**

```bash
# Create systemd service
sudo tee /etc/systemd/system/bahb.service << 'EOF'
[Unit]
Description=BAHB Inspection Engine
After=network.target

[Service]
Type=simple
User=manifold
WorkingDirectory=/opt/BAHB
Environment="PATH=/opt/BAHB/venv/bin"
ExecStart=/opt/BAHB/venv/bin/python -m bahb.main --config configs/production.yaml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable bahb
sudo systemctl start bahb

# Check status
sudo systemctl status bahb
```

**4. Network Configuration:**

```bash
# Configure static IP
sudo tee /etc/netplan/01-netcfg.yaml << 'EOF'
network:
  version: 2
  ethernets:
    eth0:
      addresses:
        - 192.168.42.3/24
      gateway4: 192.168.42.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
EOF

sudo netplan apply
```

---

### RC Plus 2 Setup

**1. Enable Developer Options:**
1. Settings → About
2. Tap "Build Number" 7 times
3. Developer Options enabled

**2. Install APK:**

```bash
# Via ADB
adb install bahb-companion-v1.0.apk

# Or: Copy APK to SD card, install via Files app
```

**3. Configure App:**
1. Launch BAHB app
2. Settings → Manifold IP: 192.168.42.3
3. Settings → WebSocket Port: 8080
4. Grant permissions (Camera, Storage)
5. Test connection

**4. DJI MSDK Activation:**
1. Connect to internet
2. Launch app (auto-activates SDK)
3. Log in with DJI account
4. SDK activated (valid for 1 year)

---

## Monitoring & Maintenance

### System Health Monitoring

**Manifold 3 Metrics:**

```bash
# CPU/GPU monitoring
nvidia-smi -l 1

# Temperature
cat /sys/class/thermal/thermal_zone*/temp

# Disk usage
df -h /data/bahb

# Memory
free -h

# Network
ifstat -i eth0
```

**BAHB Metrics Dashboard:**

Access via: `http://192.168.42.3:8000/metrics`

Metrics exported:
- FPS (current, average)
- Inference times (per model)
- GPU memory usage
- Frame drops
- Anomaly counts
- Session duration

---

### Log Management

**Application Logs:**

```bash
# View live logs
journalctl -u bahb -f

# View recent errors
journalctl -u bahb -p err --since today

# Export logs
journalctl -u bahb --since "2026-01-05" > bahb.log
```

**Log Rotation:**

```bash
# Configure logrotate
sudo tee /etc/logrotate.d/bahb << 'EOF'
/var/log/bahb/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    create 0640 manifold manifold
}
EOF
```

---

### Maintenance Schedule

| Task | Frequency | Procedure |
|------|-----------|-----------|
| **OS Updates** | Monthly | `apt update && apt upgrade` |
| **Log Cleanup** | Weekly | Automatic (logrotate) |
| **Model Updates** | Quarterly | Download new weights, validate |
| **Config Backup** | Weekly | `rsync -av /opt/BAHB/configs /backup/` |
| **Disk Cleanup** | Monthly | Delete old inspections (>90 days) |
| **Performance Test** | Monthly | Run test suite, verify FPS |
| **Battery Health** | Weekly | Check RC/drone battery cycles |

---

## Disaster Recovery

### Backup Strategy

**Critical Data:**
- `/opt/BAHB/configs/` - Configuration
- `/data/bahb/inspections/` - Inspection data
- `/data/bahb/reports/` - Generated reports
- Model weights (can be re-downloaded)

**Backup Script:**

```bash
#!/bin/bash
# /opt/scripts/bahb-backup.sh

BACKUP_DIR="/backup/bahb-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup configs
rsync -av /opt/BAHB/configs/ "$BACKUP_DIR/configs/"

# Backup recent inspections (last 7 days)
find /data/bahb/inspections -mtime -7 -type f -exec rsync -av {} "$BACKUP_DIR/inspections/" \;

# Backup reports
rsync -av /data/bahb/reports/ "$BACKUP_DIR/reports/"

# Compress
tar czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

# Upload to cloud (optional)
# aws s3 cp "$BACKUP_DIR.tar.gz" s3://bahb-backups/
```

---

### Recovery Procedures

**Scenario: Manifold 3 Failure**

1. Replace Manifold unit
2. Install OS + JetPack
3. Run installation scripts
4. Restore configs from backup
5. Download model weights
6. Test with RC connection

**Estimated Recovery Time:** 2-4 hours

---

**Scenario: Corrupted Model Weights**

1. Stop BAHB service
2. Delete corrupted weights
3. Run `./scripts/download_models.sh`
4. Restart service
5. Verify with test inference

**Estimated Recovery Time:** 30 minutes

---

## Performance Tuning

### GPU Optimization

```bash
# Set maximum performance mode
sudo nvpmodel -m 0  # MAXN mode
sudo jetson_clocks  # Lock clocks to maximum

# Monitor GPU utilization
tegrastats --interval 1000
```

**Expected Performance:**
- GPU Usage: 60-80% (during active inference)
- GPU Memory: 8-10 GB used
- Temperature: 55-70°C
- Power: 18-22W

---

### Model Optimization

**TensorRT INT8 Quantization:**

```bash
# Convert ONNX → TensorRT INT8
python /opt/BAHB/scripts/optimize_model.py \
  --input models/yolov12l.onnx \
  --output models/yolov12l-int8.engine \
  --precision int8 \
  --calibration-images /data/calibration/images/

# Test performance
python /opt/BAHB/scripts/benchmark_model.py \
  --model models/yolov12l-int8.engine \
  --iterations 100
```

**Expected Speedup:** 1.5-2x faster inference

---

### Network Optimization

```bash
# Increase network buffer sizes
sudo sysctl -w net.core.rmem_max=134217728
sudo sysctl -w net.core.wmem_max=134217728

# Optimize for low latency
sudo tc qdisc add dev eth0 root fq
```

---

## Conclusion

The BAHB deployment architecture is designed for:

- **Field Robustness:** Operates in harsh environments
- **Autonomous Operation:** No external dependencies
- **Scalability:** Single drone to fleet deployment
- **Maintainability:** Clear procedures, automated monitoring
- **Recovery:** Fast disaster recovery procedures

All components are production-grade with proven reliability.

---

**Document Status:** APPROVED
**Next Review:** Q2 2026
