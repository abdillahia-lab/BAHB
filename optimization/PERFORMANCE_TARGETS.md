# BAHB Performance Targets & Metrics

**System:** Power Infrastructure Detection (Aerial Inspection)
**Version:** 2.0 (Optimized)
**Updated:** 2026-01-05

---

## Executive Summary

This document defines concrete performance targets for the optimized BAHB system across different deployment scenarios and hardware configurations. These targets are research-backed and achievable through the optimization strategies outlined in `OPTIMIZATION_REPORT.md`.

**Key Performance Indicators (KPIs):**
- **Real-time Detection:** 60 FPS sustained on edge hardware
- **VLM Analysis:** 30 FPS with adaptive scheduling
- **Memory Footprint:** <6GB VRAM on Jetson Orin NX
- **Power Efficiency:** <16W sustained operation
- **Accuracy:** >95% mAP50 (min 1.5% degradation from FP32)

---

## 1. Hardware Configurations

### 1.1 Primary Target: Jetson Orin NX

**Specifications:**
- GPU: NVIDIA Ampere (1024 CUDA cores, 32 Tensor Cores)
- Compute Capability: 8.7
- Memory: 16GB unified (shared CPU/GPU)
- TDP: 10W (efficiency) to 25W (max performance)
- INT8 Tensor Cores: Available
- DLA (Deep Learning Accelerator): 2x cores available

**Performance Targets:**
```
Metric                          Baseline (FP16)    Target (INT8)    Status
────────────────────────────────────────────────────────────────────────
YOLOv12 Latency (p50)          15ms               6ms              ⚡
YOLOv12 Throughput             66 FPS             120 FPS          ⚡
RF-DETR Latency (p50)          50ms               18ms             ⚡
SAM3 Latency (p50)             35ms               15ms             ⚡
Qwen-VL Latency (p50)          400ms              180ms            ⚡
Full Pipeline (detection)       15ms               8ms              ⚡
Full Pipeline (w/ VLM)         500ms              150ms            ⚡
Sustained FPS (detection)      60+ FPS            120+ FPS         ⚡
Sustained FPS (w/ VLM)         12 FPS             35 FPS           ⚡
Peak Memory Usage              10.1GB             5.2GB            ⚡
Power Draw (sustained)         22W                16W              ⚡
mAP50 Accuracy                 98.77%             97.5%            ✓
```

**Operating Modes:**

1. **Performance Mode (MAXN - 25W):**
   - Detection: 120 FPS
   - Full pipeline: 35 FPS
   - Use for: Active inspection, real-time alerts

2. **Balanced Mode (15W):**
   - Detection: 80 FPS
   - Full pipeline: 25 FPS
   - Use for: Extended missions, thermal management

3. **Efficiency Mode (10W):**
   - Detection: 50 FPS
   - Full pipeline: 15 FPS
   - Use for: Battery conservation, hover operations

### 1.2 Secondary Target: DJI RC Plus 2 (Qualcomm QCS6490)

**Specifications:**
- GPU: Adreno 643
- CPU: Kryo 670 (8-core)
- Memory: 8GB LPDDR5
- TDP: 15W sustained, 20W burst

**Performance Targets:**
```
Metric                          Target              Notes
────────────────────────────────────────────────────────────────
YOLOv12 Latency (p50)          10ms                Optimized for Adreno
YOLOv12 Throughput             60+ FPS             Real-time target met
Memory Usage                   3.5GB               Fits in 8GB budget
Power Draw                     12W                 Allows 3h+ runtime
Battery Life (5000mAh)         2.5-3h              Continuous inference
```

**Optimization Strategy:**
- Qualcomm Neural Processing SDK (SNPE)
- FP16 precision (Adreno native)
- OpenCL fallback for unsupported ops
- Reduced model complexity (YOLOv12m instead of YOLOv12l)

**Note:** VLM (Qwen-VL) not deployable on RC Plus 2 due to memory constraints. VLM analysis runs on companion device (Manifold 3) or cloud.

### 1.3 Alternative: DJI Manifold 3C

**Specifications:**
- Platform: Jetson Orin NX (same as 1.1)
- Form factor: Optimized for DJI drones
- Same performance targets as Jetson Orin NX above

---

## 2. Model-Specific Targets

### 2.1 YOLOv12 Object Detection

**Model Configuration:**
- Architecture: YOLOv12l (or YOLOv12m for mobile)
- Input size: 1280x720 (16:9 for aerial footage)
- Parameters: 25.3M (YOLOv12l), 15.8M (YOLOv12m)
- Classes: 25 infrastructure objects + anomalies

**Performance Targets:**

| Metric | Baseline (FP16) | Target (INT8) | Stretch Goal |
|--------|-----------------|---------------|--------------|
| **Latency (ms)** | | | |
| Mean | 15.2 | 6.0 | 4.5 |
| p50 | 15.0 | 6.0 | 4.5 |
| p95 | 17.5 | 7.5 | 5.5 |
| p99 | 20.0 | 9.0 | 7.0 |
| **Throughput** | | | |
| FPS (single) | 66 | 120 | 150 |
| FPS (sustained) | 60 | 115 | 140 |
| **Accuracy** | | | |
| mAP50 | 98.77% | 97.5% | 98.0% |
| mAP50-95 | 83.79% | 82.5% | 83.0% |
| Precision | 96.2% | 95.0% | 95.5% |
| Recall | 94.8% | 93.5% | 94.0% |
| **Resources** | | | |
| Memory (MB) | 2500 | 1500 | 1200 |
| Power (W) | 8.5 | 4.5 | 3.5 |

**Optimization Checklist:**
- [x] TensorRT INT8 engine
- [ ] Calibration with 500+ representative images
- [ ] NMS-free architecture (YOLOv10-style)
- [ ] CUDA stream overlap (4 streams)
- [ ] DLA offload (encoder backbone)
- [ ] Buffer pooling (4 input, 4 output buffers)

### 2.2 RF-DETR Segmentation

**Model Configuration:**
- Architecture: RT-DETR with ResNet101 backbone
- Input size: 640x640
- Queries: 300
- Classes: Same as YOLOv12

**Performance Targets:**

| Metric | Baseline (FP16) | Target (INT8) | Usage |
|--------|-----------------|---------------|-------|
| Latency (p50) | 50ms | 18ms | Selective processing |
| Throughput | 20 FPS | 55 FPS | Top 10 detections |
| Memory | 1800 MB | 1200 MB | Concurrent w/ YOLO |
| mAP (mask) | 76.5% | 75.0% | Acceptable loss |

**Usage Pattern:**
- Process only top 10 high-confidence detections
- Skip when detection count < 3
- Adaptive based on FPS (disable below 20 FPS)

### 2.3 SAM3 Nano Segmentation

**Model Configuration:**
- Architecture: Segment Anything Model 3 (Nano variant)
- Encoder: ViT-Tiny
- Decoder: Lightweight mask generator
- Input: 1024x1024

**Performance Targets:**

| Component | Baseline (FP16) | Target (FP16) | Notes |
|-----------|-----------------|---------------|-------|
| Encoder | 30ms | 20ms | TensorRT + graph opt |
| Decoder | 5ms | 3ms | Per prompt |
| Total (1 prompt) | 35ms | 23ms | Anomaly candidates |
| Total (5 prompts) | 55ms | 35ms | Multi-point |
| Memory | 800 MB | 600 MB | Keep encoder resident |

**Note:** SAM3 kept at FP16 due to segmentation sensitivity. INT8 tested but degraded IoU by >5%.

**Usage Pattern:**
- Invoke only for anomaly candidates
- Batch prompts (up to 64 points)
- Cache encoder embeddings (1 image = multiple prompts)

### 2.4 Qwen2.5-VL-3B Visual Language Model

**Model Configuration:**
- Architecture: Qwen2.5-VL-3B (vision-language)
- Quantization: AWQ INT4
- Context: 4096 tokens
- Flash Attention 2

**Performance Targets:**

| Metric | Baseline (FP16) | Target (AWQ INT4) | Adaptive |
|--------|-----------------|-------------------|----------|
| Latency | 400ms | 180ms | 50ms (avg w/ scheduling) |
| Memory | 4500 MB | 2500 MB | Significant reduction |
| Throughput | 2.5 tok/s | 5.5 tok/s | 2.2x faster |
| Power | 9W | 5W | Major savings |
| Quality (PPL) | 7.2 | 7.4 | Minimal degradation |

**Adaptive Scheduling Targets:**

| FPS Range | VLM Interval | Effective Latency |
|-----------|--------------|-------------------|
| >30 FPS | Every 5 frames | 36ms avg |
| 15-30 FPS | Every 10 frames | 18ms avg |
| 10-15 FPS | Every 20 frames | 9ms avg |
| <10 FPS | Anomalies only | <5ms avg |

**Always Analyze:**
- Critical anomalies (severity ≥ HIGH)
- Thermal hotspots >80°C
- Manual trigger events

---

## 3. End-to-End Pipeline Targets

### 3.1 Detection-Only Mode

**Configuration:**
- YOLOv12 INT8
- No VLM, no segmentation (unless anomaly)
- Real-time video streaming

**Targets:**
```
Pipeline Stage              Latency (ms)    Cumulative
────────────────────────────────────────────────────
Frame capture               1.0             1.0
Preprocessing               0.5             1.5
YOLOv12 inference           6.0             7.5
Postprocessing              0.5             8.0
────────────────────────────────────────────────────
Total (p50)                                 8.0ms
Throughput                                  120 FPS
Memory                                      2.0 GB
Power                                       6W
```

**Use Cases:**
- High-speed transmission line patrol
- Wide-area scanning
- Initial pass (before detailed inspection)

### 3.2 Full Pipeline Mode

**Configuration:**
- YOLOv12 INT8 (every frame)
- RF-DETR INT8 (top detections)
- SAM3 FP16 (anomalies)
- Qwen-VL AWQ (adaptive)

**Targets:**
```
Pipeline Stage              Latency (ms)    Frequency       Effective
────────────────────────────────────────────────────────────────────
YOLOv12                     6.0             Every frame     6.0
RF-DETR                     18.0            Top 10/frame    3.6 (avg)
SAM3                        23.0            Anomalies       2.3 (avg)
Qwen-VL                     180.0           Every 5th       36.0 (avg)
Thermal analysis            2.0             Every frame     2.0
Pipeline overhead           4.0             -               4.0
────────────────────────────────────────────────────────────────────
Total (avg)                                                 53.9ms
Effective FPS                                               18-35 FPS
Memory (peak)                                               5.2 GB
Power (avg)                                                 16W
```

**Use Cases:**
- Detailed substation inspection
- Anomaly investigation
- Report generation

### 3.3 Efficiency Mode

**Configuration:**
- YOLOv12m INT8 (smaller model)
- No RF-DETR
- SAM3 disabled
- Qwen-VL disabled (cloud offload)

**Targets:**
```
Total latency:              5.0ms
Throughput:                 150 FPS
Memory:                     1.2 GB
Power:                      4W
Battery life:               4+ hours
```

**Use Cases:**
- Extended missions
- Battery-constrained operations
- Thermal throttling mitigation

---

## 4. Quality Assurance Targets

### 4.1 Accuracy Requirements

**Minimum Acceptable Performance:**
```
Metric                      Baseline        Minimum         Target
────────────────────────────────────────────────────────────────
mAP50                       98.77%          96.0%           97.5%
mAP50-95                    83.79%          81.0%           82.5%
Precision                   96.2%           94.0%           95.0%
Recall                      94.8%           92.0%           93.5%
False Positive Rate         3.8%            <6.0%           <5.0%
False Negative Rate         5.2%            <8.0%           <6.5%
```

**Critical Classes (Higher Standards):**
```
Class                       Minimum Recall  Min Precision
────────────────────────────────────────────────────────
Damage                      95%             90%
Crack                       92%             88%
Corrosion                   90%             85%
Thermal anomaly             98%             95%
```

**Reasoning:** False negatives on critical defects are unacceptable for safety.

### 4.2 Robustness Requirements

**Environmental Conditions:**
- Lighting: 50 lux to direct sunlight (100,000 lux)
- Weather: Light rain, fog (visibility >500m)
- Motion: Up to 5 m/s drone speed, 15° gimbal stabilization
- Distance: 5m to 100m from target

**Performance Degradation Limits:**
```
Condition                   Max FPS Drop    Max Accuracy Drop
──────────────────────────────────────────────────────────────
Low light (<200 lux)        30%             5%
Motion blur (>3 m/s)        20%             8%
Extreme distance (>50m)     10%             10%
Thermal noise               0%              3%
```

### 4.3 Reliability Requirements

**Uptime & Stability:**
- Mean Time Between Failures (MTBF): >100 hours
- Crash rate: <0.1% of frames
- Memory leak: <10 MB/hour
- Thermal throttling: <5% of operating time

**Error Handling:**
- Graceful degradation on model failure
- Automatic fallback to lower precision
- Recovery from GPU OOM without restart

---

## 5. Power & Thermal Targets

### 5.1 Power Consumption Budget

**Jetson Orin NX (25W TDP):**
```
Component               Power (W)   % of Total
────────────────────────────────────────────
GPU (inference)         10.0        40%
CPU (pipeline)          3.0         12%
Memory                  2.0         8%
System overhead         1.0         4%
────────────────────────────────────────────
Total AI                16.0        64%
Available for system    9.0         36%
```

**Power Efficiency Metrics:**
- Frames per Watt: 7.5 FPS/W (detection mode)
- Detections per Joule: 0.5 detections/J
- Energy per inference: 50 mJ (YOLOv12 INT8)

### 5.2 Thermal Management

**Temperature Targets:**
```
Component               Normal      Warning     Critical    Throttle
────────────────────────────────────────────────────────────────────
GPU Die                 <70°C       70-80°C     80-90°C     >90°C
CPU                     <60°C       60-70°C     70-80°C     >80°C
Memory                  <85°C       85-95°C     95-100°C    >100°C
Board                   <55°C       55-65°C     65-75°C     >75°C
```

**Thermal Mitigation:**
- Active cooling required (fan)
- Adaptive clock scaling (DVFS)
- Model throttling (reduce VLM frequency)
- Emergency shutdown at >95°C sustained

### 5.3 Battery Life Targets (DJI RC Plus 2)

**Battery:** 5000 mAh @ 3.85V = 19.25 Wh

**Operating Modes:**
```
Mode                Power   Runtime     Use Case
────────────────────────────────────────────────────
Detection only      8W      2.4h        Wide scanning
Full pipeline       12W     1.6h        Detailed inspection
Efficiency          6W      3.2h        Extended missions
Standby             2W      9.6h        Monitoring
```

**Target:** Minimum 2 hours continuous full-pipeline operation.

---

## 6. Deployment & Validation

### 6.1 Deployment Checklist

**Pre-Deployment:**
- [ ] All models converted to TensorRT INT8/AWQ
- [ ] Calibration completed (500+ images per model)
- [ ] Accuracy validation passed (>95% mAP50)
- [ ] Latency benchmarks met (<10ms YOLOv12)
- [ ] Memory budget verified (<6GB)
- [ ] Power profiling completed (<16W)
- [ ] Thermal testing passed (no throttling)
- [ ] 100-hour stability test completed

**Field Validation:**
- [ ] 50+ flight missions
- [ ] 5000+ frames analyzed
- [ ] Various environmental conditions
- [ ] Anomaly detection accuracy verified
- [ ] False alarm rate acceptable

### 6.2 Continuous Monitoring

**Real-time Metrics Dashboard:**
- Current FPS, latency (p50/p95/p99)
- Memory usage, GPU utilization
- Power draw, thermal state
- Anomaly detection rate
- VLM analysis frequency

**Alerting Thresholds:**
- FPS < 20: Warning
- FPS < 10: Critical (reduce VLM)
- Memory > 90%: Evict cache
- Temp > 80°C: Throttle
- Accuracy drop >10%: Flag for review

### 6.3 Regression Testing

**Automated Tests (CI/CD):**
- Nightly performance benchmarks
- Accuracy regression (>5% drop = fail)
- Memory leak detection
- Power consumption trends

**Monthly Validation:**
- Full benchmark suite
- Comparison to baseline
- Field performance review
- Model refresh if needed

---

## 7. Success Metrics

### 7.1 Primary KPIs

**Must-Have (P0):**
- ✅ Detection latency <10ms (p50)
- ✅ Sustained FPS ≥30 (full pipeline)
- ✅ Memory usage <6GB
- ✅ Accuracy >95% mAP50
- ✅ Power draw <16W

**Should-Have (P1):**
- ⚡ Detection latency <8ms (p50)
- ⚡ Sustained FPS ≥35 (full pipeline)
- ⚡ Memory usage <5.5GB
- ⚡ Accuracy >97% mAP50
- ⚡ Power draw <15W

**Nice-to-Have (P2):**
- 🎯 Detection latency <6ms (p50)
- 🎯 Sustained FPS ≥40 (full pipeline)
- 🎯 Memory usage <5GB
- 🎯 Accuracy >97.5% mAP50
- 🎯 Power draw <14W

### 7.2 User Experience Metrics

**Responsiveness:**
- Frame-to-result latency: <200ms
- Anomaly alert time: <500ms
- VLM description: <2s (when triggered)

**Reliability:**
- Crash rate: <0.1%
- False alarm rate: <5%
- Missed critical defect rate: <2%

**Efficiency:**
- Inspection time: -50% vs manual
- Data transmission: -60% (edge inference)
- Post-processing: -80% (real-time results)

---

## 8. Optimization Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Targets:**
- TensorRT engines built
- Basic INT8 quantization
- Benchmark harness operational

**Success Criteria:**
- YOLOv12 INT8 engine: <10ms latency
- No accuracy regression >3%

### Phase 2: Advanced Optimization (Weeks 3-4)
**Targets:**
- Full INT8 calibration
- CUDA stream parallelization
- Buffer pooling

**Success Criteria:**
- YOLOv12: <8ms latency
- Full pipeline: <150ms latency

### Phase 3: Adaptive Systems (Weeks 5-6)
**Targets:**
- Adaptive VLM scheduling
- Thermal management
- Power optimization

**Success Criteria:**
- Sustained 30+ FPS full pipeline
- <16W power consumption

### Phase 4: Deployment (Weeks 7-8)
**Targets:**
- Hardware-specific optimization
- Field testing
- Production readiness

**Success Criteria:**
- All P0 KPIs met
- 50+ successful flights
- Zero critical failures

---

## Appendix: Measurement Methodology

### Latency Measurement
- **Tool:** PyTorch Profiler, NVIDIA Nsight Systems
- **Method:** Warm cache, 1000 iterations, exclude outliers (>3σ)
- **Reporting:** p50, p95, p99 percentiles

### Accuracy Measurement
- **Dataset:** 1000-image validation set (CPLID + TTPLA + custom)
- **Metrics:** COCO mAP (50, 50-95), Precision, Recall, F1
- **Tool:** Ultralytics validation, custom evaluation

### Power Measurement
- **Tool:** `tegrastats` (Jetson), `powertop` (Linux)
- **Method:** Sustained operation (5 minutes), average power draw
- **Reporting:** Mean, max, idle baseline

### Memory Measurement
- **Tool:** NVIDIA-SMI, PyTorch CUDA memory profiler
- **Method:** Peak allocation during steady-state
- **Reporting:** VRAM used, VRAM peak, system RAM

---

**Document Owner:** BAHB Optimization Team
**Last Updated:** 2026-01-05
**Next Review:** 2026-02-05 (post Phase 2)
