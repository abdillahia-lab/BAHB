# BAHB System Architecture Overview

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**Author:** Architecture Team
**Status:** APPROVED

---

## Executive Summary

BAHB (Building And Hardware Baseline) is an enterprise-grade autonomous aerial inspection system designed for critical infrastructure monitoring. The system combines cutting-edge AI inference with industrial-grade drone hardware to deliver real-time anomaly detection and comprehensive reporting.

### Key Characteristics

- **Real-time Performance:** 30+ FPS detection pipeline with sub-100ms latency
- **Multi-modal Analysis:** RGB + Thermal + Laser ranging fusion
- **Edge AI:** All inference runs on-device (Jetson Orin NX)
- **Industrial Grade:** Designed for 24/7 operation in harsh environments
- **Scalable:** Modular architecture supports future enhancements

---

## System Context

### Purpose

BAHB provides autonomous inspection capabilities for:
- **Electrical Substations:** Transformer health, insulator defects, thermal anomalies
- **Data Centers:** Server thermal monitoring, cooling system analysis, cable management
- **Transmission Lines:** Conductor damage, vegetation encroachment, tower condition
- **Solar/Wind Farms:** Panel defects, turbine blade damage, structural issues

### Stakeholders

| Stakeholder | Primary Concerns |
|-------------|-----------------|
| **Operators** | Real-time anomaly alerts, ease of use, reliability |
| **Maintenance Teams** | Detailed reports, actionable recommendations, trend analysis |
| **Safety Officers** | Hazard detection, compliance reporting, audit trails |
| **IT/DevOps** | System health, data security, integration capabilities |

---

## High-Level Architecture

### Logical View

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BAHB SYSTEM ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐          ┌──────────────────────┐
│   DJI RC Plus 2      │          │   DJI Matrice 400    │
│   (Android 11)       │◄────────►│   + H30T Camera      │
│                      │   MSDK   │                      │
│  ┌────────────────┐  │          │  ┌────────────────┐  │
│  │  Companion App │  │          │  │  Manifold 3    │  │
│  │   (Kotlin)     │  │          │  │  (Orin NX)     │  │
│  │                │  │◄─────────┼──┤                │  │
│  │  - FPV Display │  │ WebSocket│  │  - BAHB Core   │  │
│  │  - AI Overlay  │  │   8080   │  │  - AI Pipeline │  │
│  │  - Controls    │  │          │  │  - Thermal     │  │
│  └────────────────┘  │          │  │  - Reporting   │  │
└──────────────────────┘          │  └────────────────┘  │
                                  │                      │
                                  │  ┌────────────────┐  │
                                  │  │  H30T Cameras  │  │
                                  │  │  - Wide (4K)   │  │
                                  │  │  - Zoom (200x) │  │
                                  │  │  - Thermal IR  │  │
                                  │  │  - Laser RF    │  │
                                  │  └────────────────┘  │
                                  └──────────────────────┘
```

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT TOPOLOGY                               │
└─────────────────────────────────────────────────────────────────────┘

  Field Environment                     Cloud/Backend (Optional)
  ═════════════════                     ═════════════════════════

  ┌──────────────┐                      ┌──────────────────────┐
  │  Drone       │                      │  Cloud Storage       │
  │  Platform    │                      │  - S3/MinIO          │
  │              │                      │  - Video Archive     │
  │  • M400      │                      │  - Report Repository │
  │  • Manifold3 │──────MQTT───────────►│                      │
  │  • H30T      │      LTE/5G          │  ┌────────────────┐  │
  └──────────────┘                      │  │  Analytics     │  │
         │                              │  │  Dashboard     │  │
         │ WiFi                         │  │  - Grafana     │  │
         │ 192.168.42.x                 │  │  - Trend Viz   │  │
         ▼                              │  └────────────────┘  │
  ┌──────────────┐                      └──────────────────────┘
  │  RC Plus 2   │
  │  Controller  │
  │              │
  │  • Display   │
  │  • Control   │
  │  • Alerts    │
  └──────────────┘
```

---

## Core Components

### 1. Edge Compute Platform (Manifold 3)

**Hardware Specifications:**
- **Compute:** NVIDIA Jetson Orin NX (8-core ARM + 1024-core Ampere GPU)
- **Memory:** 16GB LPDDR5 (8GB allocated to AI workloads)
- **Storage:** 128GB NVMe SSD
- **Connectivity:** Gigabit Ethernet, WiFi 6, 4G/5G modem (optional)
- **Power:** 15-25W TDP (dynamic power management)

**Software Stack:**
- **OS:** Ubuntu 22.04 LTS (JetPack 6.0)
- **Runtime:** Python 3.10, CUDA 12.2, TensorRT 8.6
- **Framework:** PyTorch 2.1, OpenCV 4.8

**Responsibilities:**
- Real-time AI inference
- Multi-camera stream processing
- Thermal analysis
- Anomaly classification
- Report generation
- Data streaming to RC

### 2. Remote Controller (RC Plus 2 Enterprise)

**Hardware Specifications:**
- **Display:** 7" 1920x1200 IPS, 1400 nits
- **OS:** Android 11 (DJI customized)
- **CPU:** Qualcomm Snapdragon
- **RAM:** 8GB
- **Storage:** 256GB internal

**Software Components:**
- **BAHB Companion App** (Kotlin/Android)
  - DJI MSDK v5 integration
  - WebSocket client
  - Real-time overlay rendering
  - Control interface

**Responsibilities:**
- Live video display (FPV)
- AI detection overlay
- Operator controls
- Alert notifications
- Flight parameter monitoring

### 3. Multi-Sensor Camera (H30T)

**Sensor Specifications:**

| Sensor | Resolution | FOV | Frame Rate | Capabilities |
|--------|-----------|-----|------------|--------------|
| Wide RGB | 4096x2160 (4K) | 82° | 30 fps | General inspection |
| Zoom RGB | 3840x2160 | Variable | 30 fps | 5x-200x optical zoom |
| Thermal | 640x512 | 40.6° | 30 fps | -40°C to +550°C, NETD 0.03°C |
| Laser RF | - | Narrow | - | 1200m range, ±0.2m accuracy |

**Stream Delivery:**
- RTSP over Ethernet (H.265 encoded)
- Synchronized timestamps
- GPS/IMU telemetry embedded

---

## Technology Stack

### Backend (Manifold 3)

```
Application Layer
├── bahb.main                 # Entry point, CLI interface
├── bahb.core.engine          # Main orchestration engine
└── bahb.core.types           # Shared type definitions

Processing Layer
├── bahb.camera.h30t          # Camera stream management
├── bahb.camera.frame_sync    # Multi-stream synchronization
├── bahb.thermal.analyzer     # Thermal image analysis
└── bahb.models.pipeline      # AI inference pipeline

AI/ML Layer
├── bahb.models.yolov12       # YOLOv12 detection (2ms)
├── bahb.models.rf_detr       # RF-DETR segmentation (15ms)
├── bahb.models.sam3          # SAM3 Nano masks (8ms)
└── bahb.models.qwen_vl       # Qwen2.5-VL analysis (50ms)

Output Layer
├── bahb.reporting.generator  # Report generation (PDF/HTML/JSON)
├── bahb.streaming.webrtc     # Real-time streaming
├── bahb.streaming.recorder   # Video recording
└── bahb.alerts.manager       # Alert dispatch (MQTT/Webhook)

Infrastructure
├── bahb.core.config          # Configuration management
├── bahb.core.validation      # Data validation
├── bahb.core.edge_optimization  # Performance optimization
└── bahb.core.correction      # Error correction
```

### Frontend (RC Plus 2)

```
com.bahb
├── BAHBApplication.kt           # Application initialization
├── ui
│   ├── MainActivity.kt          # Main inspection UI
│   ├── overlay
│   │   └── DetectionOverlayView.kt  # AI overlay rendering
│   ├── adapter
│   │   └── AnomalyListAdapter.kt    # Anomaly list display
│   └── widget
│       └── SystemStatusWidget.kt    # Status indicators
├── service
│   └── ManifoldConnection.kt    # WebSocket client
└── model
    └── BAHBModels.kt            # Data models (Detection, Anomaly, etc.)
```

---

## Data Flow Architecture

### Primary Inspection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW PIPELINE                            │
└─────────────────────────────────────────────────────────────────────┘

1. CAPTURE PHASE
   H30T Camera Streams (RTSP/H.265)
   │
   ├──► Wide RGB (4K @ 30fps)
   ├──► Zoom RGB (4K @ 30fps)
   ├──► Thermal IR (640x512 @ 30fps)
   └──► Telemetry (GPS, IMU, Laser)
         │
         ▼
   Frame Synchronizer (50ms tolerance)
         │
         ▼
   FrameData {timestamp, wide, thermal, location, gimbal}

2. PROCESSING PHASE
   InferencePipeline.process_frame()
   │
   ├──► [2ms] YOLOv12 Detection
   │    └─► List[Detection] (bbox, class, confidence)
   │
   ├──► [15ms] RF-DETR Segmentation (selective)
   │    └─► List[Segmentation] (mask, class, area)
   │
   ├──► [8ms] SAM3 Precision Masks (anomalies only)
   │    └─► Enhanced Detection.mask
   │
   ├──► [Parallel] Thermal Analysis
   │    └─► ThermalReading (hotspots, temps, gradients)
   │
   └──► [50ms] Qwen-VL Analysis (every 5th frame, adaptive)
        └─► Natural language description + recommendations
              │
              ▼
   InspectionResult {detections, anomalies, thermal, vlm_desc}

3. CLASSIFICATION PHASE
   Anomaly Detection Logic
   │
   ├──► Defect Class Filtering (damage, crack, corrosion)
   ├──► Thermal Threshold Checking (>80°C warning, >100°C critical)
   ├──► Severity Assessment (INFO → LOW → MEDIUM → HIGH → CRITICAL)
   └──► Recommendation Generation
         │
         ▼
   List[Anomaly] with severity + recommendations

4. OUTPUT PHASE
   Multi-Channel Distribution
   │
   ├──► WebSocket → RC Plus 2 (real-time overlay)
   ├──► Local Storage (video + metadata)
   ├──► MQTT → Alert System (critical anomalies)
   └──► Report Generator (session end)
         │
         ▼
   Comprehensive PDF/HTML Report
```

### Frame Processing Timeline

```
Timeline (milliseconds)
0ms ────────────────────► 100ms
│
├─[2ms]─► YOLOv12 Detection
│
├─[15ms]─► RF-DETR Segmentation
│
├─[8ms]──► SAM3 Masks
│
├─[50ms]─► Qwen-VL (adaptive: every 5-15 frames)
│
└─[~75ms Total] → 13 FPS baseline, 30+ FPS with VLM skipping
```

---

## Quality Attributes

### Performance Requirements

| Attribute | Target | Current | Notes |
|-----------|--------|---------|-------|
| **Detection FPS** | ≥30 fps | 35-45 fps | YOLOv12 optimized with TensorRT INT8 |
| **End-to-end Latency** | <100ms | 75ms | Frame capture → detection display |
| **VLM Analysis Time** | <100ms | 50-80ms | Qwen2.5-VL-3B-AWQ quantized |
| **Memory Footprint** | <12GB | 8-10GB | GPU memory for all models |
| **Power Consumption** | <25W | 18-22W | Manifold 3 typical load |
| **Startup Time** | <30s | 15-20s | Model loading + warmup |

### Reliability Requirements

- **Uptime:** 99.9% during flight operations
- **MTBF:** >1000 flight hours
- **Graceful Degradation:** System continues with reduced functionality if individual models fail
- **Auto-Recovery:** Automatic reconnection on network failures

### Scalability

- **Concurrent Streams:** Up to 3 camera streams @ 30fps
- **Detection Throughput:** 1000+ detections/minute
- **Storage:** 500GB/day @ max recording
- **Report Generation:** <30s for 1-hour inspection

### Security

- **Data Encryption:** TLS 1.3 for all network communication
- **Access Control:** Role-based permissions (operator, admin, viewer)
- **Audit Logging:** All actions logged with timestamps
- **Data Retention:** Configurable (default: 90 days)

---

## Design Principles

### 1. Modularity
Each component is independently replaceable. AI models can be swapped without changing the core engine.

### 2. Real-time First
All processing is optimized for low latency. Asynchronous pipelines prevent blocking.

### 3. Fail-Safe
System degrades gracefully. If VLM fails, detection continues. If thermal fails, RGB analysis continues.

### 4. Edge-Native
All critical processing happens on-device. No cloud dependency for core functionality.

### 5. Data-Driven
Comprehensive telemetry enables performance optimization and anomaly trend analysis.

### 6. Operator-Centric
UI design prioritizes quick decision-making. Critical alerts are immediately visible.

---

## Integration Points

### External Systems

| System | Protocol | Purpose | Criticality |
|--------|----------|---------|-------------|
| DJI MSDK | Proprietary | Flight control, camera control | CRITICAL |
| RTSP Streams | RTSP/RTP | Video ingestion | CRITICAL |
| WebSocket | WS/WSS | Real-time data to RC | HIGH |
| MQTT Broker | MQTT 3.1.1 | Alert distribution | MEDIUM |
| S3/MinIO | HTTP/S3 API | Long-term storage | LOW |
| Webhook | HTTPS | External notifications | LOW |

### API Contracts

**WebSocket Protocol (Manifold → RC):**
```json
{
  "type": "inspection_result",
  "data": {
    "frame_id": 12345,
    "timestamp": "2026-01-05T10:30:15Z",
    "detections": [...],
    "anomalies": [...],
    "thermal": {...}
  }
}
```

**MQTT Alert Topic:**
```
bahb/alerts/{severity}/{site_id}
```

---

## Future Architecture Considerations

### Planned Enhancements

1. **Multi-Drone Coordination**
   - Swarm intelligence for large sites
   - Distributed processing across multiple Manifolds
   - Centralized mission planning

2. **Cloud-Edge Hybrid**
   - Edge: Real-time detection (current)
   - Cloud: Historical analysis, ML retraining, fleet management

3. **Advanced AI Capabilities**
   - Predictive maintenance (trend analysis)
   - Automated mission planning (optimal flight paths)
   - Natural language query interface

4. **Extended Platform Support**
   - Ground robots for indoor inspections
   - Fixed surveillance cameras
   - Handheld inspection devices

### Technology Roadmap

| Capability | Timeline | Dependencies |
|------------|----------|--------------|
| Multi-drone coordination | Q2 2026 | Fleet management software |
| Cloud analytics dashboard | Q3 2026 | Cloud infrastructure |
| Predictive maintenance ML | Q4 2026 | 6+ months of training data |
| AR overlay for technicians | Q1 2027 | AR glasses integration |

---

## Appendices

### A. Glossary

- **BAHB:** Building And Hardware Baseline
- **H30T:** DJI's hybrid camera (RGB + Thermal + Laser)
- **MSDK:** Mobile SDK from DJI for drone control
- **Manifold:** DJI's onboard computer platform
- **TensorRT:** NVIDIA's inference optimization runtime
- **VLM:** Vision-Language Model
- **FPV:** First-Person View

### B. References

- DJI MSDK v5 Documentation
- NVIDIA Jetson Orin Technical Reference
- TensorRT Optimization Guide
- PyTorch Deployment Best Practices

### C. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-05 | Architecture Team | Initial comprehensive architecture |

---

**Document Status:** APPROVED FOR IMPLEMENTATION
**Next Review:** Q2 2026
