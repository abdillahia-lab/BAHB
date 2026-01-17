# BAHB Docker Deployment - Complete Package Index

## Quick Navigation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **QUICKSTART.md** | Get running in 15 minutes | First-time setup |
| **README.md** | Complete documentation | Reference and troubleshooting |
| **FILES_MANIFEST.txt** | File listing and descriptions | Understanding the package |
| **DEPLOYMENT_SUMMARY.md** | Architecture overview | Understanding the system |

## Installation Flow

```
1. Read QUICKSTART.md (5 min)
   ↓
2. Run ./install.sh (30-60 min)
   ↓
3. Copy model files to models/
   ↓
4. Configure .env
   ↓
5. Start: make up
   ↓
6. Verify: ./verify_deployment.sh
   ↓
7. Done! Check: make status
```

## File Organization

### Essential Files (Must Use)
- `install.sh` - Run this first
- `Dockerfile.jetson` - Docker image definition
- `docker-compose.yml` - Service orchestration
- `bahb.service` - Systemd service

### Configuration Files (Must Configure)
- `.env.example` → `.env` - Environment variables
- `configs/production.yaml` - BAHB settings

### Documentation (Read First)
- `QUICKSTART.md` - Start here
- `README.md` - Complete guide
- `FILES_MANIFEST.txt` - Package contents

### Utilities (Use as Needed)
- `Makefile` - Convenience commands
- `verify_deployment.sh` - Check installation

## Quick Command Reference

### Installation
```bash
cd /home/user/BAHB/deployment
sudo ./install.sh
```

### Daily Operations
```bash
make up              # Start BAHB
make down            # Stop BAHB
make logs            # View logs
make status          # Check status
make restart         # Restart services
```

### Monitoring
```bash
make logs-bahb       # BAHB logs only
make health          # Health check
make stats           # Resource usage
sudo tegrastats      # Jetson stats
```

### Maintenance
```bash
make backup          # Backup data
make clean           # Clean up
make update          # Update BAHB
make optimize        # Max performance
```

### Troubleshooting
```bash
./verify_deployment.sh    # Full verification
make debug               # Show debug info
docker logs bahb-main    # Container logs
```

## File Paths Quick Reference

### Configuration
- Main config: `/home/user/BAHB/configs/production.yaml`
- Environment: `/home/user/BAHB/deployment/.env`
- MQTT config: `/home/user/BAHB/deployment/mosquitto/config/mosquitto.conf`

### Models
- TensorRT engines: `/home/user/BAHB/deployment/models/`

### Data
- Logs: `/data/bahb/logs/`
- Recordings: `/data/bahb/recordings/`
- Reports: `/data/bahb/reports/`

### System
- Service file: `/etc/systemd/system/bahb.service`
- Application: `/opt/bahb/` (symlink to /home/user/BAHB)

## Port Reference

| Port | Service | Protocol | Usage |
|------|---------|----------|-------|
| 8080 | BAHB | HTTP/WebRTC | Control interface |
| 8554 | BAHB | RTSP | Video streaming |
| 1883 | MQTT | MQTT | Alert messaging |
| 9001 | MQTT | WebSocket | Web-based messaging |
| 3000 | Grafana | HTTP | Dashboard (optional) |
| 9091 | Prometheus | HTTP | Metrics (optional) |

## Common Tasks

### First Time Setup
1. Read `QUICKSTART.md`
2. Run `sudo ./install.sh`
3. Copy models to `models/`
4. Edit `.env` file
5. Run `make up`
6. Run `./verify_deployment.sh`

### Starting BAHB
```bash
# Method 1: Systemd (recommended)
sudo systemctl start bahb

# Method 2: Make
make up

# Method 3: Docker Compose
docker compose -f docker-compose.yml up -d
```

### Checking Status
```bash
make status                    # All services
systemctl status bahb          # Systemd service
docker ps                      # Containers
./verify_deployment.sh         # Full check
```

### Viewing Logs
```bash
make logs                      # All services
make logs-bahb                 # BAHB only
journalctl -u bahb -f          # Systemd
docker logs bahb-main -f       # Container
```

### Performance Tuning
```bash
make optimize                  # Set MAXN mode
sudo nvpmodel -q               # Check power mode
sudo tegrastats                # Monitor resources
```

### Troubleshooting
See `README.md` troubleshooting section or run:
```bash
make debug                     # Debug info
./verify_deployment.sh         # Full verification
```

## Architecture at a Glance

```
Jetson Orin NX
├── Docker
│   ├── BAHB Container (main)
│   │   ├── PyTorch + CUDA
│   │   ├── TensorRT
│   │   ├── DeepStream 8
│   │   ├── OpenCV CUDA
│   │   └── AI Models (YOLO, SAM, Qwen)
│   ├── MQTT Broker
│   ├── Prometheus (optional)
│   └── Grafana (optional)
├── Systemd Service
│   └── Auto-start + Performance optimization
└── Data Storage
    ├── Models (TensorRT)
    ├── Recordings
    ├── Reports
    └── Logs
```

## Next Steps After Installation

1. **Configure Camera Streams**
   - Edit `configs/production.yaml`
   - Update RTSP URLs for your H30T camera

2. **Set Up Alerts**
   - Configure webhook in `.env`
   - Test MQTT: `mosquitto_sub -h localhost -t 'bahb/alerts/#'`

3. **Test Detection**
   - Run inspection: `make up && make logs`
   - Check results in `/data/bahb/reports/`

4. **Enable Monitoring** (Optional)
   - Start: `make up-monitoring`
   - Access Grafana: `http://<jetson-ip>:3000`

5. **Optimize Performance**
   - Run: `make optimize`
   - Monitor: `sudo tegrastats`
   - Tune: Edit `configs/production.yaml`

## Getting Help

| Issue | Solution |
|-------|----------|
| Installation fails | Check `install.sh` log at `/tmp/bahb_install.log` |
| Containers won't start | Run `./verify_deployment.sh` |
| GPU not detected | Check `make debug`, verify NVIDIA runtime |
| Performance issues | Run `make optimize`, check `tegrastats` |
| General questions | See `README.md` troubleshooting section |

## Performance Expectations

**Jetson Orin NX (MAXN mode)**:
- YOLOv12 Detection: 25-30 FPS @ 15W
- Full Pipeline: 15-20 FPS @ 20W
- With VLM: 5-10 FPS @ 25W

## Package Contents Summary

- **4** Core deployment files
- **3** Documentation files  
- **3** Configuration templates
- **2** Utility scripts
- **1** Makefile with 30+ commands
- **1** Systemd service file

Total: **14 files** ready for production deployment

---

**Start Here**: `QUICKSTART.md`  
**Full Docs**: `README.md`  
**Verify**: `./verify_deployment.sh`

**Installation**: `sudo ./install.sh`
