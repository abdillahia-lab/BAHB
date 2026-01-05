# BAHB Architecture Documentation

**Last Updated:** 2026-01-05
**Status:** Current
**Maintainers:** Architecture Team

---

## Overview

This directory contains comprehensive architecture documentation for the BAHB (Building And Hardware Baseline) autonomous drone inspection system.

### Document Index

| Document | Description | Audience |
|----------|-------------|----------|
| **[ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md)** | High-level system architecture, components, technology stack | All stakeholders |
| **[MODULE_STRUCTURE.md](MODULE_STRUCTURE.md)** | Detailed component organization, design patterns, dependencies | Engineers |
| **[DATA_FLOW.md](DATA_FLOW.md)** | Data pipeline stages, processing flow, performance metrics | Engineers, DevOps |
| **[API_CONTRACTS.md](API_CONTRACTS.md)** | API specifications, message formats, error handling | Engineers, Integrators |
| **[DEPLOYMENT_ARCHITECTURE.md](DEPLOYMENT_ARCHITECTURE.md)** | Hardware platform, deployment scenarios, operations | DevOps, Operations |
| **[ADR/](ADR/)** | Architecture Decision Records | Engineers, Architects |

---

## Quick Start

### For New Engineers

**Start Here:**
1. Read [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) - Get the big picture
2. Skim [MODULE_STRUCTURE.md](MODULE_STRUCTURE.md) - Understand code organization
3. Review [ADR/001-edge-first-architecture.md](ADR/001-edge-first-architecture.md) - Key design decision

### For Integration Partners

**Start Here:**
1. Read [API_CONTRACTS.md](API_CONTRACTS.md) - WebSocket protocol, data formats
2. Review [DEPLOYMENT_ARCHITECTURE.md](DEPLOYMENT_ARCHITECTURE.md) - Network topology

### For DevOps/SRE

**Start Here:**
1. Read [DEPLOYMENT_ARCHITECTURE.md](DEPLOYMENT_ARCHITECTURE.md) - Full deployment guide
2. Review [DATA_FLOW.md](DATA_FLOW.md) - Performance metrics, troubleshooting

---

## System at a Glance

### Components

```
┌───────────────────┐
│  DJI RC Plus 2    │  Operator Interface (Android)
│  - FPV Display    │  - Real-time AI overlay
│  - BAHB App       │  - Control interface
└─────────┬─────────┘
          │ WiFi 6
          │ WebSocket
┌─────────▼─────────┐
│  DJI Manifold 3   │  Edge AI Compute (Orin NX)
│  - BAHB Core      │  - 4-model AI pipeline
│  - AI Inference   │  - Real-time processing
│  - Thermal Anlys  │  - 30+ FPS detection
└─────────┬─────────┘
          │ RTSP
┌─────────▼─────────┐
│  DJI H30T Camera  │  Multi-Sensor Camera
│  - 4K Wide RGB    │  - Thermal (640x512)
│  - 200x Zoom      │  - Laser Rangefinder
└───────────────────┘
```

### Key Metrics

| Metric | Value |
|--------|-------|
| **End-to-end Latency** | 94ms average |
| **Detection FPS** | 35-45 FPS |
| **Model Accuracy** | 98.77% mAP50 |
| **GPU Memory** | 8-10 GB used |
| **Power Consumption** | 18-22W |
| **Uptime** | 99.9% target |

### Technology Stack

**Backend (Manifold 3):**
- Python 3.10 + PyTorch 2.1
- NVIDIA TensorRT 8.6 + CUDA 12.2
- YOLOv12 + RF-DETR + SAM3 + Qwen-VL

**Frontend (RC Plus 2):**
- Kotlin + Jetpack Compose
- DJI MSDK v5.17
- OkHttp WebSocket

**Hardware:**
- NVIDIA Jetson Orin NX (8-core ARM + 1024-core GPU)
- DJI H30T (RGB + Thermal + Laser)
- DJI Matrice 400 (industrial drone)

---

## Architecture Decisions

### Approved ADRs

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](ADR/001-edge-first-architecture.md) | Edge-First Architecture | ACCEPTED | 2026-01-05 |
| [002](ADR/002-multi-model-ai-pipeline.md) | Multi-Model AI Pipeline | ACCEPTED | 2026-01-05 |
| [003](ADR/003-websocket-communication.md) | WebSocket for Real-Time Communication | ACCEPTED | 2026-01-05 |

### Key Design Principles

1. **Edge-First:** All critical processing on-device (zero cloud dependency)
2. **Real-Time:** <100ms latency, 30+ FPS sustained
3. **Fail-Safe:** Graceful degradation, no single point of failure
4. **Modular:** Independently replaceable components
5. **Operator-Centric:** UI optimized for quick decision-making

---

## Data Flow Summary

```
Camera (30 FPS)
    ↓ RTSP (H.265)
Frame Sync (50ms tolerance)
    ↓ FrameData
AI Pipeline:
  ├─ YOLOv12 (2ms) → Detections
  ├─ RF-DETR (15ms) → Segmentations
  ├─ SAM3 (8ms) → Precision Masks
  └─ Qwen-VL (50ms, adaptive) → Descriptions
    ↓ InspectionResult
Anomaly Detection & Classification
    ↓
WebSocket (JSON) → RC Plus 2
    ↓
FPV Overlay Rendering
    ↓
Operator Display
```

**Total Latency:** 84-118ms (avg 94ms) ✅

---

## Module Organization

```
bahb/
├── core/           # Engine, config, types
├── camera/         # H30T interface
├── models/         # AI models (YOLO, DETR, SAM, VLM)
├── thermal/        # Thermal analysis
├── reporting/      # PDF/HTML/JSON reports
├── streaming/      # WebRTC, WebSocket
├── alerts/         # MQTT/webhook alerts
└── training/       # Model training utilities

android/app/src/main/java/com/bahb/
├── ui/             # Activities, overlays, widgets
├── service/        # ManifoldConnection (WebSocket)
└── model/          # Data classes
```

---

## API Overview

### WebSocket Protocol

**Connection:** `ws://192.168.42.3:8080/ws/inspection`

**Message Types:**

| Type | Direction | Frequency | Purpose |
|------|-----------|-----------|---------|
| `inspection_result` | Server → Client | 30/sec | Detection results |
| `system_status` | Server → Client | 1/sec | Health metrics |
| `alert` | Server → Client | On event | Critical anomalies |
| `start_inspection` | Client → Server | On command | Begin session |
| `stop_inspection` | Client → Server | On command | End session |
| `capture_snapshot` | Client → Server | On command | Save image |

**Example:**

```json
{
  "type": "inspection_result",
  "timestamp": "2026-01-05T10:30:15.234Z",
  "data": {
    "frame_id": 12345,
    "detections": [...],
    "anomalies": [...],
    "thermal": {...}
  }
}
```

---

## Deployment Scenarios

### 1. Standalone (Offline)

**Configuration:** Drone WiFi only, no internet
**Use Case:** Remote sites, no connectivity
**Features:** Full AI inspection, local reports

### 2. LTE-Connected

**Configuration:** Drone + cellular modem
**Use Case:** Urban inspections
**Features:** Cloud sync, real-time alerts, fleet dashboard

### 3. Multi-Drone Fleet

**Configuration:** Multiple drones + cloud backend
**Use Case:** Large sites (substations, solar farms)
**Features:** Coordinated missions, centralized analytics

---

## Performance Tuning

### GPU Optimization

```bash
# Maximum performance mode (Orin NX)
sudo nvpmodel -m 0  # MAXN
sudo jetson_clocks
```

### Model Optimization

- **TensorRT:** FP16/INT8 quantization (1.5-2x speedup)
- **NMS-Free:** Reduce post-processing latency
- **Adaptive VLM:** Skip frames when FPS low

### Network Optimization

- **Buffer Tuning:** Increase rmem_max/wmem_max
- **TCP:** Fair queueing (fq) for low latency

---

## Testing Strategy

### Unit Tests

```python
# Test individual models
pytest bahb/models/test_yolov12.py

# Test thermal analyzer
pytest bahb/thermal/test_analyzer.py
```

### Integration Tests

```python
# Test full pipeline
pytest tests/integration/test_pipeline.py

# Test WebSocket
pytest tests/integration/test_websocket.py
```

### End-to-End Tests

```bash
# Benchmark full system
python scripts/benchmark_e2e.py --duration 300
```

---

## Monitoring

### Metrics

- **Application:** FPS, latency, GPU usage, anomaly counts
- **System:** CPU, memory, disk, temperature
- **Network:** Bandwidth, packet loss, latency

### Logging

```bash
# View logs
journalctl -u bahb -f

# Filter errors
journalctl -u bahb -p err --since today
```

### Alerts

- **Critical Anomalies:** MQTT → Operations Center
- **System Health:** Low FPS, high temp, disk full
- **Connection Issues:** Camera disconnected, RC offline

---

## Maintenance

### Regular Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| OS Updates | Monthly | `apt update && apt upgrade` |
| Log Cleanup | Weekly | Automatic (logrotate) |
| Model Updates | Quarterly | `./scripts/download_models.sh` |
| Config Backup | Weekly | `rsync -av /opt/BAHB/configs /backup/` |
| Performance Test | Monthly | `python scripts/benchmark.py` |

---

## Troubleshooting

### Common Issues

**1. Low FPS (<30)**
- Check GPU utilization: `nvidia-smi`
- Verify models loaded: check logs
- Reduce VLM frequency: edit config

**2. Camera Disconnected**
- Check RTSP streams: `gst-launch-1.0 rtspsrc location=rtsp://...`
- Verify network: `ping 192.168.42.2`
- Restart camera service

**3. WebSocket Connection Failed**
- Check firewall: `ufw status`
- Verify service running: `systemctl status bahb`
- Test with curl: `curl -i -N -H "Connection: Upgrade" ...`

---

## Contributing

### Adding New Features

1. **Document First:** Update architecture docs
2. **Design Review:** Get team approval on ADR
3. **Implement:** Follow module structure
4. **Test:** Unit + integration tests
5. **Update Docs:** Keep architecture in sync

### Modifying Architecture

1. **Propose ADR:** Create new ADR in `ADR/`
2. **Review:** Present to architecture team
3. **Decide:** Accept/Reject/Defer
4. **Implement:** Update code + docs

---

## References

### External Documentation

- [DJI MSDK v5 Docs](https://developer.dji.com/doc/mobile-sdk-tutorial/en/)
- [NVIDIA Jetson Docs](https://docs.nvidia.com/jetson/)
- [TensorRT Guide](https://docs.nvidia.com/tensorrt/)
- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)

### Internal Wiki

- [BAHB Developer Guide](https://wiki.example.com/bahb)
- [Operations Runbook](https://wiki.example.com/bahb-ops)
- [Incident Response](https://wiki.example.com/bahb-incidents)

---

## Contact

**Architecture Team:** architecture@bahb.example.com
**Support:** support@bahb.example.com
**Emergency:** +1-555-BAHB-911

---

## Document Maintenance

### Review Schedule

- **ARCHITECTURE_OVERVIEW:** Quarterly
- **MODULE_STRUCTURE:** On major refactoring
- **DATA_FLOW:** On performance changes
- **API_CONTRACTS:** On API version bump
- **DEPLOYMENT_ARCHITECTURE:** On hardware/OS upgrades
- **ADRs:** Permanent (append-only)

### Last Reviews

| Document | Last Review | Next Review | Reviewer |
|----------|-------------|-------------|----------|
| ARCHITECTURE_OVERVIEW | 2026-01-05 | 2026-04-05 | Architecture Team |
| MODULE_STRUCTURE | 2026-01-05 | As needed | Tech Lead |
| DATA_FLOW | 2026-01-05 | 2026-04-05 | Performance Team |
| API_CONTRACTS | 2026-01-05 | On breaking change | API Team |
| DEPLOYMENT_ARCHITECTURE | 2026-01-05 | 2026-04-05 | DevOps |

---

**Document Version:** 1.0
**Status:** APPROVED
**Effective Date:** 2026-01-05
