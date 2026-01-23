# BAHB Deployment to Matrice 4TD

## Quick Start

### 1. Connect to Manifold 3

```bash
# Via drone WiFi (when powered on)
ssh bahb@192.168.42.10

# Or via USB-C direct connection
ssh bahb@192.168.55.1
```

### 2. Deploy Application

```bash
# From your dev machine
./scripts/deploy_m4td.sh
```

### 3. Access on RC Plus 2

- **WebSocket**: `ws://192.168.42.10:8080`
- **Web UI**: `http://192.168.42.10:8080`

---

## Manual Deployment

### Step 1: Transfer Code

```bash
# Package and transfer
tar -czf bahb.tar.gz bahb/ configs/ requirements.txt
scp bahb.tar.gz bahb@192.168.42.10:/opt/
```

### Step 2: Install on Manifold 3

```bash
ssh bahb@192.168.42.10

# Extract and install
cd /opt
sudo tar -xzf bahb.tar.gz
cd bahb

# Create venv and install deps
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Transfer & Build Models

**Important**: TensorRT engines are platform-specific. Transfer ONNX files and build on Manifold 3.

```bash
# From dev machine - transfer ONNX models
scp models/*.onnx bahb@192.168.42.10:/data/bahb/models/

# On Manifold 3 - build TensorRT engine
ssh bahb@192.168.42.10

cd /data/bahb/models
/usr/src/tensorrt/bin/trtexec \
    --onnx=rf_detr_seg_medium_infrastructure.onnx \
    --saveEngine=rf_detr_seg_medium_infrastructure.engine \
    --fp16 \
    --workspace=4096
```

### Step 4: Run BAHB

```bash
# Manual run (for testing)
source /opt/bahb/venv/bin/activate
BAHB_CONFIG=/opt/bahb/configs/matrice_4td.yaml python -m bahb.main

# Or install as service
sudo cp /opt/bahb/scripts/bahb.service /etc/systemd/system/
sudo systemctl enable --now bahb.service
```

---

## Network Configuration

| Interface | IP Address | Use Case |
|-----------|------------|----------|
| Drone WiFi | 192.168.42.10 | RC Plus 2 access |
| USB-C | 192.168.55.1 | Direct laptop connection |
| E-Port | 10.0.0.x | Internal drone network |

---

## Viewing Logs

```bash
# Live logs
ssh bahb@192.168.42.10 journalctl -u bahb -f

# Recent errors
ssh bahb@192.168.42.10 journalctl -u bahb -p err -n 50
```

---

## RC Plus 2 Integration

BAHB runs as a background service. Access via:

1. **DJI Pilot 2 Widget** (if PSDK app installed)
2. **Browser**: Navigate to `http://192.168.42.10:8080`
3. **Overlay Mode**: BAHB sends detection boxes via WebSocket

### What You'll See

| DJI Displays | BAHB Adds |
|--------------|-----------|
| Video feed | Infrastructure detection boxes |
| Thermal palette | Anomaly highlighting (red) |
| Vehicle/person boxes | Equipment labels (transformer, insulator, etc.) |
| Temperature readout | Delta-T analysis, hotspot correlation |

---

## Troubleshooting

### Can't reach Manifold 3
```bash
# Check drone is on
# Check you're on drone WiFi
ping 192.168.42.10

# If USB-C connected
ping 192.168.55.1
```

### TensorRT build fails
```bash
# Check JetPack version
cat /etc/nv_tegra_release

# Ensure sufficient memory
free -h

# Build with less workspace
trtexec --onnx=model.onnx --saveEngine=model.engine --fp16 --workspace=2048
```

### BAHB service won't start
```bash
# Check logs
journalctl -u bahb -n 100

# Common issues:
# - Missing model files
# - CUDA out of memory
# - Wrong config path
```

---

## Performance Verification

```bash
# On Manifold 3
ssh bahb@192.168.42.10

# Check GPU usage
tegrastats

# Expected: ~40-60% GPU utilization at 30 FPS input
# RF-DETR Seg should show ~5ms inference time
```
