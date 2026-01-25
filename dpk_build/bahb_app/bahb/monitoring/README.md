# BAHB Monitoring System

Comprehensive monitoring and watchdog system for the BAHB drone inspection platform.

## Components

### 1. Process Watchdog (`watchdog.py`)

Monitors critical processes and provides auto-recovery capabilities.

**Features:**
- Auto-restart on crash with exponential backoff
- Memory leak detection
- GPU memory monitoring
- Process health checks
- Alert on repeated failures
- Graceful shutdown handling

**Usage:**
```python
from bahb.monitoring import ProcessWatchdog, WatchdogConfig

async def start_inference_engine():
    # Your process start logic
    return process

config = WatchdogConfig(
    max_restarts=5,
    initial_backoff_seconds=1.0,
    memory_leak_threshold_mb=1000.0,
)

watchdog = ProcessWatchdog(
    process_name="inference_engine",
    start_command=start_inference_engine,
    config=config,
    alert_callback=send_alert,
)

await watchdog.start()
```

### 2. Health Check Server (`health_check.py`)

HTTP server providing comprehensive health status endpoints.

**Endpoints:**
- `GET /health` - Simple health check (200 OK or 503 Unhealthy)
- `GET /health/detailed` - Detailed health status with all components
- `GET /health/components/{component}` - Component-specific health
- `GET /metrics` - System metrics (CPU, memory, disk, network)
- `GET /ready` - Readiness probe for Kubernetes
- `GET /live` - Liveness probe for Kubernetes

**Usage:**
```python
from bahb.monitoring import HealthCheckServer

health_server = HealthCheckServer(port=8081)

# Configure components to monitor
health_server.camera = camera_instance
health_server.inference_engine = engine_instance
health_server.model_paths = [Path("models/yolo26l.pt")]
health_server.recording_path = Path("/data/bahb/recordings")

await health_server.start()

# Access health status
# curl http://localhost:8081/health
```

**Example Response:**
```json
{
  "healthy": true,
  "timestamp": "2026-01-17T10:30:00",
  "uptime_seconds": 3600,
  "components": {
    "camera": {
      "healthy": true,
      "status": "All 3 streams connected"
    },
    "gpu": {
      "healthy": true,
      "status": "GPU OK: 12.5GB free (20.3% used)"
    },
    "disk": {
      "healthy": true,
      "status": "Disk space OK: 450.2GB free (15.3% used)"
    }
  },
  "warnings": [],
  "errors": []
}
```

### 3. Metrics Collector (`metrics.py`)

Collects and exports performance metrics in Prometheus format.

**Metrics Tracked:**
- **Latency:** p50, p95, p99 for inference, preprocessing, postprocessing
- **Throughput:** Current and average FPS
- **Detections:** Counts per class
- **Anomalies:** Counts by type and severity
- **Thermal:** Hotspot and coldspot counts
- **GPU:** Utilization, memory, temperature, power
- **System:** Memory and CPU usage

**Usage:**
```python
from bahb.monitoring import MetricsCollector

metrics = MetricsCollector()
await metrics.start()

# Record metrics
metrics.record_frame()
metrics.record_inference_latency(15.3)  # ms
metrics.record_detection("transformer")
metrics.record_anomaly("corrosion", "warning")

# Get summary
summary = metrics.get_summary()

# Export to Prometheus
prometheus_metrics = metrics.export_prometheus()
```

**Prometheus Export Example:**
```
# HELP bahb_throughput_fps Current processing throughput in frames per second
# TYPE bahb_throughput_fps gauge
bahb_throughput_fps 30.5

# HELP bahb_inference_latency_p95_ms P95 inference latency in milliseconds
# TYPE bahb_inference_latency_p95_ms gauge
bahb_inference_latency_p95_ms 18.3

# HELP bahb_gpu_temperature_celsius GPU temperature in Celsius
# TYPE bahb_gpu_temperature_celsius gauge
bahb_gpu_temperature_celsius 65.2
```

### 4. Alert System (`alerts.py`)

Comprehensive alerting with multiple channels and intelligent filtering.

**Features:**
- MQTT publishing
- Webhook notifications
- Local logging
- Alert deduplication
- Rate limiting
- Priority routing by severity

**Alert Categories:**
- **DETECTION:** Critical infrastructure detections (damage, leaks)
- **THERMAL:** Thermal anomalies (hotspots, coldspots)
- **SYSTEM:** System health issues
- **HEALTH:** Component health (camera, GPU, disk)
- **PERFORMANCE:** Performance degradation

**Usage:**
```python
from bahb.monitoring import AlertSystem, AlertSeverity, AlertCategory

alerts = AlertSystem(
    mqtt_broker="localhost",
    mqtt_topic="bahb/alerts",
    webhook_url="https://api.example.com/alerts",
)

await alerts.start()

# Send custom alert
await alerts.send_alert(
    severity=AlertSeverity.CRITICAL,
    category=AlertCategory.DETECTION,
    title="Critical Damage Detected",
    message="Severe corrosion on transformer T-123",
    metadata={"confidence": 0.95, "location": "Grid A-5"}
)

# Pre-configured alerts
await alerts.alert_thermal_hotspot(
    temperature=95.5,
    location="Transformer T-123"
)

await alerts.alert_gpu_memory_high(
    usage_mb=14500,
    total_mb=16000
)
```

### 5. Thermal Monitor (`thermal_monitor.py`)

Monitors Jetson CPU/GPU temperatures and prevents thermal throttling.

**Features:**
- Real-time temperature monitoring
- Thermal state classification (Normal, Warm, Hot, Critical, Throttling)
- Auto-reduce workload on overheating
- Thermal event logging
- Integration with power management (nvpmodel)

**Thermal States:**
- **Normal:** < 60°C
- **Warm:** 60-75°C (increased monitoring)
- **Hot:** 75-85°C (warning state)
- **Critical:** 85-90°C (critical alerts)
- **Throttling:** > 90°C (workload reduction)

**Usage:**
```python
from bahb.monitoring import ThermalMonitor, ThermalThresholds

thresholds = ThermalThresholds(
    warm_threshold=60.0,
    hot_threshold=75.0,
    critical_threshold=85.0,
    throttle_threshold=90.0,
)

thermal_monitor = ThermalMonitor(
    thresholds=thresholds,
    alert_callback=send_thermal_alert,
    throttle_callback=handle_throttling,
)

await thermal_monitor.start(check_interval_seconds=2.0)

# Get current status
status = thermal_monitor.get_status()
print(thermal_monitor.get_thermal_summary())
```

**Output Example:**
```
Thermal Status: NORMAL
Throttling: NO

Current Temperatures:
  ✓ CPU-therm      :  58.5°C (normal)
  ✓ GPU-therm      :  62.3°C (warm)
  ✓ AUX-therm      :  55.0°C (normal)

Max Temperature: 62.3°C
```

### 6. Monitoring Service (`monitor_service.py`)

Unified service that runs all monitors together.

**Usage:**
```python
from bahb.monitoring import MonitoringService, MonitoringConfig
from pathlib import Path

config = MonitoringConfig(
    health_check_enabled=True,
    health_check_port=8081,
    metrics_enabled=True,
    alerts_enabled=True,
    mqtt_broker="localhost",
    webhook_url="https://api.example.com/webhooks/bahb",
    thermal_monitor_enabled=True,
    recording_path=Path("/data/bahb/recordings"),
    model_paths=[
        Path("/home/user/BAHB/models/yolo26l-inspection.pt"),
    ],
    camera_streams=[
        "rtsp://192.168.42.2:8554/wide",
        "rtsp://192.168.42.2:8554/thermal",
    ],
)

service = MonitoringService(
    config=config,
    inference_engine=engine,
    camera=camera,
    deepstream_pipeline=pipeline,
)

await service.start()

# Get comprehensive status
status = service.get_status()

# Get Prometheus metrics
metrics = await service.get_metrics_prometheus()
```

## Integration with BAHB

### In Inference Engine

```python
from bahb.core.engine import InspectionEngine
from bahb.monitoring import MonitoringService, MonitoringConfig

async def main():
    # Initialize engine
    engine = InspectionEngine()
    await engine.initialize()

    # Initialize monitoring
    monitoring = MonitoringService(
        config=MonitoringConfig(
            health_check_port=8081,
            mqtt_broker="localhost",
        ),
        inference_engine=engine,
    )
    await monitoring.start()

    # Start inspection
    session_id = await engine.start_inspection(
        inspection_type=InspectionType.SUBSTATION,
        site_name="Main Substation Alpha",
    )

    # Monitoring runs in background
    # Access via http://localhost:8081/health
```

### With DeepStream Pipeline

```python
from bahb.integrations.nvidia_metropolis import DeepStreamPipeline
from bahb.monitoring import ProcessWatchdog

async def start_deepstream():
    pipeline = create_bahb_deepstream_pipeline()
    pipeline.start()
    return pipeline

# Monitor DeepStream with watchdog
watchdog = ProcessWatchdog(
    process_name="deepstream_pipeline",
    start_command=start_deepstream,
)
await watchdog.start()
```

## Deployment

### Systemd Service

Create `/etc/systemd/system/bahb-monitoring.service`:

```ini
[Unit]
Description=BAHB Monitoring Service
After=network.target

[Service]
Type=simple
User=bahb
WorkingDirectory=/home/user/BAHB
ExecStart=/usr/bin/python3 -m bahb.monitoring.monitor_service
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable bahb-monitoring
sudo systemctl start bahb-monitoring
```

### Docker Compose

```yaml
version: '3.8'

services:
  bahb-monitoring:
    image: bahb:latest
    command: python -m bahb.monitoring.monitor_service
    ports:
      - "8081:8081"  # Health check
    environment:
      - BAHB_MQTT_BROKER=mqtt-broker
      - BAHB_WEBHOOK_URL=https://api.example.com/webhooks
    devices:
      - /dev/nvhost-gpu:/dev/nvhost-gpu
    volumes:
      - /data/bahb:/data/bahb
      - /sys:/sys:ro
    restart: unless-stopped
```

## Prometheus Integration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'bahb'
    static_configs:
      - targets: ['localhost:8081']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

## Grafana Dashboard

Example queries:

- **FPS:** `bahb_throughput_fps`
- **Inference Latency (p95):** `bahb_inference_latency_p95_ms`
- **GPU Temperature:** `bahb_gpu_temperature_celsius`
- **Total Detections:** `rate(bahb_detections_total[5m])`
- **Critical Alerts:** `bahb_anomalies_by_severity{severity="critical"}`

## Alert Rules

Configure alert rules in `alerts.py`:

```python
from bahb.monitoring.alerts import AlertRule, AlertSeverity, AlertCategory

# Add custom rule
alerts.add_rule(AlertRule(
    name="high_temperature_transformer",
    severity=AlertSeverity.CRITICAL,
    category=AlertCategory.THERMAL,
    message_template="Transformer temperature {temperature}°C exceeds limit",
    rate_limit_seconds=60,
    deduplicate=True,
))
```

## Troubleshooting

### Health Check Not Responding

```bash
# Check if server is running
curl http://localhost:8081/health

# Check logs
journalctl -u bahb-monitoring -f

# Verify port is open
netstat -tulpn | grep 8081
```

### MQTT Not Connecting

```bash
# Test MQTT broker
mosquitto_sub -h localhost -t bahb/alerts -v

# Check configuration
python3 -c "from bahb.monitoring import AlertSystem; print(AlertSystem.__doc__)"
```

### GPU Metrics Not Available

```bash
# Install pynvml
pip install pynvml

# Test GPU access
nvidia-smi

# Check permissions
ls -la /dev/nvhost-*
```

### Thermal Monitoring Not Working

```bash
# Check thermal zones
ls -la /sys/devices/virtual/thermal/

# Read temperature manually
cat /sys/devices/virtual/thermal/thermal_zone0/temp

# Verify permissions
sudo usermod -aG video $USER
```

## Performance Impact

The monitoring system is designed to have minimal overhead:

- **CPU Usage:** < 2%
- **Memory Usage:** ~100MB
- **Network:** Minimal (alerts only)
- **Disk I/O:** Minimal (logging only)

## License

Part of the BAHB project. See main LICENSE file.
