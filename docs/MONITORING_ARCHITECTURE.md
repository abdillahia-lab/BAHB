# BAHB Monitoring System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       BAHB MONITORING SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    MonitoringService                              │  │
│  │                  (Unified Orchestrator)                           │  │
│  └────────────────────────┬─────────────────────────────────────────┘  │
│                           │                                             │
│         ┌─────────────────┼─────────────────┬─────────────────┐        │
│         │                 │                 │                 │        │
│         ▼                 ▼                 ▼                 ▼        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ Health      │  │ Metrics     │  │ Alert       │  │ Thermal      │ │
│  │ Check       │  │ Collector   │  │ System      │  │ Monitor      │ │
│  │ Server      │  │             │  │             │  │              │ │
│  │             │  │             │  │             │  │              │ │
│  │ Port 8081   │  │ Prometheus  │  │ MQTT/Web    │  │ Jetson SoC  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘ │
│         │                │                │                 │         │
│         │                │                │                 │         │
│         ▼                ▼                ▼                 ▼         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                     Component Checks                              │ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │  Camera  │  GPU  │  Disk  │  Models  │  DeepStream  │  Engine   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────────┐  ┌────────┐  ┌──────────────┐
            │ Prometheus   │  │ MQTT   │  │ Webhooks     │
            │ Grafana      │  │ Broker │  │ (Slack, etc) │
            └──────────────┘  └────────┘  └──────────────┘
```

## Component Interaction Flow

```
┌──────────────┐
│ Inference    │
│ Engine       │──────┐
└──────────────┘      │
                      │  1. Process metrics
┌──────────────┐      │     (FPS, latency)
│ DeepStream   │      │
│ Pipeline     │──────┤
└──────────────┘      │
                      ▼
┌──────────────┐  ┌──────────────────┐
│ Camera       │  │ MetricsCollector │──── 2. Export to Prometheus
└──────────────┘  └──────────────────┘
       │              │
       │              │  3. Detect anomalies
       │              │     (high latency, low FPS)
       │              ▼
       │          ┌──────────────────┐
       │          │ AlertSystem      │──── 4. Send alerts
       │          └──────────────────┘     (MQTT, Webhook)
       │              │
       │              │
       ▼              ▼
┌──────────────────────────────────┐
│ HealthCheckServer                │
│                                  │
│ GET /health          → 200/503   │──── 5. External monitoring
│ GET /health/detailed → JSON      │     (K8s, Prometheus, etc)
│ GET /metrics         → Prom fmt  │
└──────────────────────────────────┘
       │
       │  6. Monitor Jetson thermals
       ▼
┌──────────────────┐
│ ThermalMonitor   │──── 7. Throttle on overheat
│                  │     (reduce FPS, alert)
│ CPU: 65°C  ✓     │
│ GPU: 78°C  ⚠     │
└──────────────────┘
```

## Data Flow

### 1. Metrics Collection Flow

```
Frame Processing
      ↓
  start_time = now()
      ↓
  [Inference]
      ↓
  end_time = now()
      ↓
  latency = end_time - start_time
      ↓
metrics.record_frame()
metrics.record_inference_latency(latency)
      ↓
  [Stored in MetricsCollector]
      ↓
  GET /metrics
      ↓
  Prometheus scrapes
      ↓
  Grafana visualizes
```

### 2. Alert Flow

```
Detection: Oil Leak
      ↓
  confidence > 0.9?
      ↓ YES
alerts.alert_critical_detection(
    detection_type="oil_leak",
    location="Grid A-5",
    confidence=0.95
)
      ↓
  [Check deduplication]
      ↓
  [Check rate limiting]
      ↓
  [Create Alert object]
      ↓
  ├─→ MQTT publish
  ├─→ Webhook POST
  └─→ Local log
      ↓
  [Store in history]
```

### 3. Health Check Flow

```
HTTP GET /health/detailed
      ↓
  [Check Camera]
  ├─→ Test RTSP streams
  └─→ Check connection status
      ↓
  [Check GPU]
  ├─→ pynvml.nvmlInit()
  ├─→ Get memory info
  └─→ Get temperature
      ↓
  [Check Disk]
  ├─→ psutil.disk_usage()
  └─→ Compare to threshold
      ↓
  [Check Models]
  ├─→ Verify file exists
  └─→ Check loading status
      ↓
  [Aggregate Results]
      ↓
  JSON Response {
    healthy: true/false,
    components: {...},
    warnings: [...],
    errors: [...]
  }
```

### 4. Thermal Monitoring Flow

```
Timer (every 2 seconds)
      ↓
  Read /sys/devices/virtual/thermal/*/temp
      ↓
  CPU: 65°C, GPU: 78°C
      ↓
  Classify temperatures
  ├─→ CPU: WARM (60-75°C)
  └─→ GPU: HOT (75-85°C)
      ↓
  Max temp = 78°C (GPU)
      ↓
  State = HOT
      ↓
  State changed? (NORMAL → HOT)
      ↓ YES
  [Trigger alert]
  alert_callback("warning", "Thermal state: hot", 78.0)
      ↓
  Should throttle? (temp > 90°C)
      ↓ NO
  Continue monitoring...
```

## Integration Patterns

### Pattern 1: Integrated Monitoring

```python
# Engine creates and manages monitoring
engine = InspectionEngine(config)
monitoring = MonitoringService(
    inference_engine=engine,
    camera=engine.camera,
)

await engine.initialize()
await monitoring.start()  # Monitoring runs alongside engine

# All metrics automatically collected
# Health automatically tracked
```

### Pattern 2: Standalone Monitoring

```python
# Monitoring runs independently
monitoring = MonitoringService(config)
await monitoring.start()

# Engine reports to monitoring
engine = InspectionEngine()
engine.set_metrics_callback(monitoring.metrics.record_frame)
```

### Pattern 3: External Monitoring

```
Kubernetes
    │
    ├─→ Liveness Probe:  GET /live
    │   (every 10s)      → 200 OK
    │
    └─→ Readiness Probe: GET /ready
        (every 10s)      → 200 OK (models loaded)
                         → 503 (not ready)
```

## Threading Model

All components use asyncio for non-blocking operation:

```
Main Event Loop
    │
    ├─→ MonitoringService._integration_loop()
    │   └─→ Checks critical conditions every 10s
    │
    ├─→ HealthCheckServer (aiohttp)
    │   └─→ Handles HTTP requests asynchronously
    │
    ├─→ MetricsCollector._update_loop()
    │   └─→ Updates GPU/system metrics every 1s
    │
    ├─→ AlertSystem._cleanup_loop()
    │   └─→ Cleans up old dedupe entries every 60s
    │
    └─→ ThermalMonitor._monitor_loop()
        └─→ Reads thermal zones every 2s
```

No thread blocking, minimal CPU overhead.

## State Management

### Metrics State

```
MetricsCollector
    ├─ inference_latency (LatencyStats)
    │  ├─ count: 1000
    │  ├─ samples: deque(maxlen=1000)
    │  └─ p95_ms: 18.3
    │
    ├─ throughput (ThroughputStats)
    │  ├─ current_fps: 30.5
    │  └─ frame_count: 45000
    │
    └─ detection_counts (Dict)
       ├─ "transformer": 150
       └─ "insulator": 320
```

### Alert State

```
AlertSystem
    ├─ _alert_history (List[Alert])
    │  └─ Last 1000 alerts
    │
    ├─ _recent_alerts (Set[str])
    │  └─ Dedupe hashes (5 min window)
    │
    └─ _rate_limit_cache (Dict)
       ├─ "thermal_hotspot": [timestamp1, ...]
       └─ "gpu_memory_high": [timestamp1, ...]
```

### Thermal State

```
ThermalMonitor
    ├─ _current_readings (Dict)
    │  ├─ "CPU-therm": ThermalReading(65.0°C)
    │  └─ "GPU-therm": ThermalReading(78.0°C)
    │
    ├─ _thermal_state: ThermalState.HOT
    │
    └─ _thermal_events (List)
       └─ Last 1000 thermal events
```

## Performance Optimization

1. **Deque for bounded memory**: `samples: Deque[float] = deque(maxlen=1000)`
2. **Efficient percentile calc**: Only when samples > 10
3. **Background updates**: All I/O in async tasks
4. **Rate limiting**: Prevents alert storms
5. **Deduplication**: Hash-based, O(1) lookup
6. **HTTP server**: aiohttp for async request handling

## Error Handling

```
Component Operation
      ↓
  try:
      operation()
      ↓ SUCCESS
      return result
  except Exception as e:
      ↓ ERROR
      logger.error(f"Error: {e}")
      ↓
      metrics.record_error("component_name")
      ↓
      alerts.send_alert(
          severity=CRITICAL,
          message=f"Component failed: {e}"
      )
      ↓
      return fallback_value
```

## Monitoring the Monitors

The monitoring system monitors itself:

- Health server checks its own uptime
- Metrics collector tracks its own performance
- Alert system logs failed alert deliveries
- Thermal monitor validates thermal zone access

## Deployment Topologies

### Single Node (Orin NX)

```
┌─────────────────────────────┐
│      NVIDIA Orin NX         │
│  ┌───────────────────────┐  │
│  │ BAHB Inference Engine │  │
│  └───────────┬───────────┘  │
│              │              │
│  ┌───────────▼───────────┐  │
│  │ Monitoring Service    │  │
│  │ :8081                 │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Distributed (Edge + Cloud)

```
┌─────────────────────────────┐
│      NVIDIA Orin NX         │       ┌──────────────────┐
│  ┌───────────────────────┐  │       │ Cloud            │
│  │ BAHB Inference Engine │  │       │                  │
│  └───────────┬───────────┘  │  MQTT │ ┌──────────────┐ │
│              │              │◄──────┤►│ MQTT Broker  │ │
│  ┌───────────▼───────────┐  │       │ └──────┬───────┘ │
│  │ Monitoring Service    │  │       │        │         │
│  │ Metrics → Prometheus  │  │       │ ┌──────▼───────┐ │
│  └───────────────────────┘  │       │ │ Alert Server │ │
└─────────────────────────────┘       │ └──────────────┘ │
                                      │ ┌──────────────┐ │
                                      │ │ Prometheus   │ │
                                      │ └──────┬───────┘ │
                                      │        │         │
                                      │ ┌──────▼───────┐ │
                                      │ │ Grafana      │ │
                                      │ └──────────────┘ │
                                      └──────────────────┘
```

## Scalability

- **Metrics**: O(1) recording, bounded memory (deque)
- **Alerts**: O(1) deduplication (hash-based), O(n) cleanup
- **Health**: O(k) where k = number of components
- **Thermal**: O(z) where z = number of thermal zones

All designed for edge deployment with minimal resources.

## Security Considerations

1. **HTTP endpoints**: No authentication (internal use)
2. **MQTT**: Optional TLS, username/password
3. **Webhooks**: HTTPS recommended, API key in headers
4. **File access**: Read-only for thermal zones
5. **Process control**: Requires sudo for nvpmodel

## Future Enhancements

- [ ] Authentication for HTTP endpoints
- [ ] Encryption for MQTT
- [ ] Remote configuration updates
- [ ] Historical metrics database
- [ ] Anomaly detection ML model
- [ ] Predictive maintenance alerts
- [ ] Multi-node coordination
- [ ] Service mesh integration

---

**Architecture Version**: 1.0
**Last Updated**: 2026-01-17
**Status**: Production Ready ✅
