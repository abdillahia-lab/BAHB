# BAHB Monitoring System - Quick Start Guide

## Overview

The BAHB monitoring system provides comprehensive real-time monitoring for your drone inspection platform with:

- ✅ **Process Watchdog** - Auto-restart on crashes
- ✅ **Health Checks** - HTTP endpoints for system health
- ✅ **Metrics Collection** - Prometheus-compatible metrics
- ✅ **Alert System** - MQTT/webhook notifications
- ✅ **Thermal Monitoring** - Prevent Jetson overheating

## Quick Start (3 minutes)

### 1. Basic Monitoring Setup

```python
from bahb.monitoring import MonitoringService, MonitoringConfig
from pathlib import Path

# Configure monitoring
config = MonitoringConfig(
    health_check_enabled=True,
    health_check_port=8081,
    metrics_enabled=True,
    alerts_enabled=True,
    thermal_monitor_enabled=True,
)

# Create and start service
monitoring = MonitoringService(config=config)
await monitoring.start()

# Service runs in background
# Access health at: http://localhost:8081/health
```

### 2. Integrate with Inference Engine

```python
from bahb.core.engine import InspectionEngine
from bahb.monitoring import MonitoringService, MonitoringConfig

async def main():
    # Start your engine
    engine = InspectionEngine()
    await engine.initialize()

    # Add monitoring
    monitoring = MonitoringService(
        config=MonitoringConfig(health_check_port=8081),
        inference_engine=engine,
    )
    await monitoring.start()

    # Start inspection
    session_id = await engine.start_inspection(
        site_name="Main Substation"
    )

    # Monitoring runs automatically
    # Check: curl http://localhost:8081/health
```

### 3. Standalone Monitoring Service

```bash
# Run monitoring as standalone service
python -m bahb.monitoring.monitor_service

# In another terminal, check health
curl http://localhost:8081/health

# Get detailed status
curl http://localhost:8081/health/detailed | jq

# Get metrics
curl http://localhost:8081/metrics
```

## Common Use Cases

### Monitor GPU and Send Alerts

```python
from bahb.monitoring import MetricsCollector, AlertSystem

# Setup
metrics = MetricsCollector()
alerts = AlertSystem(mqtt_broker="localhost")

await metrics.start()
await alerts.start()

# In your processing loop
for frame in camera_stream:
    start = time.time()

    # Your processing
    result = process_frame(frame)

    # Record metrics
    latency = (time.time() - start) * 1000
    metrics.record_frame()
    metrics.record_inference_latency(latency)

    # Check GPU and alert if needed
    if metrics.gpu_metrics.memory_free_mb < 1000:
        await alerts.alert_gpu_memory_high(
            usage_mb=metrics.gpu_metrics.memory_used_mb,
            total_mb=metrics.gpu_metrics.memory_total_mb,
        )
```

### Thermal Protection

```python
from bahb.monitoring import ThermalMonitor

async def on_thermal_throttle(should_throttle: bool):
    if should_throttle:
        print("Too hot! Reducing FPS...")
        engine.target_fps = 15  # Reduce from 30 to 15
    else:
        print("Temperature OK, resuming normal FPS")
        engine.target_fps = 30

thermal = ThermalMonitor(throttle_callback=on_thermal_throttle)
await thermal.start(check_interval_seconds=2.0)

# Thermal monitor runs in background
# Automatically reduces workload when temperature > 90°C
```

### Critical Detection Alerts

```python
from bahb.monitoring import AlertSystem, AlertSeverity

alerts = AlertSystem(
    mqtt_broker="localhost",
    webhook_url="https://api.example.com/alerts",
)
await alerts.start()

# In your detection callback
def on_detection(detections):
    for det in detections:
        if det.class_name in ["oil_leak", "damage", "broken_strand"]:
            await alerts.alert_critical_detection(
                detection_type=det.class_name,
                location=f"Grid {det.location}",
                confidence=det.confidence,
            )
```

## Monitoring Endpoints

Once running, access these endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Simple health check (200 or 503) |
| `GET /health/detailed` | Full health status with all components |
| `GET /health/components/gpu` | GPU-specific health |
| `GET /health/components/camera` | Camera health |
| `GET /metrics` | System metrics (CPU, RAM, disk) |
| `GET /ready` | Readiness probe (Kubernetes) |
| `GET /live` | Liveness probe (Kubernetes) |

### Example Health Response

```bash
$ curl http://localhost:8081/health/detailed
```

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
    "models": {
      "healthy": true,
      "status": "All 4 models loaded"
    },
    "gpu": {
      "healthy": true,
      "status": "GPU OK: 12.5GB free (20.3% used)",
      "details": {
        "name": "NVIDIA Orin NX",
        "temperature_celsius": 62.3,
        "utilization_percent": 75.5
      }
    },
    "disk": {
      "healthy": true,
      "status": "Disk space OK: 450.2GB free"
    }
  },
  "warnings": [],
  "errors": []
}
```

## Prometheus Integration

### 1. Expose Metrics

Metrics are automatically available at `/metrics`:

```bash
curl http://localhost:8081/metrics
```

### 2. Configure Prometheus

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'bahb'
    static_configs:
      - targets: ['localhost:8081']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

### 3. Key Metrics

```promql
# Current FPS
bahb_throughput_fps

# Inference latency (p95)
bahb_inference_latency_p95_ms

# GPU temperature
bahb_gpu_temperature_celsius

# Detection rate
rate(bahb_detections_total[5m])

# Critical anomalies
bahb_anomalies_by_severity{severity="critical"}
```

## MQTT Alerts

### Setup

```python
config = MonitoringConfig(
    alerts_enabled=True,
    mqtt_broker="localhost",  # or your MQTT broker IP
    mqtt_port=1883,
    mqtt_topic="bahb/alerts",
)
```

### Subscribe to Alerts

```bash
# Terminal 1: Start BAHB with monitoring
python -m bahb.monitoring.monitor_service

# Terminal 2: Subscribe to alerts
mosquitto_sub -h localhost -t "bahb/alerts" -v
```

### Alert Message Format

```json
{
  "id": "BAHB-000042",
  "timestamp": "2026-01-17T10:35:12",
  "severity": "critical",
  "category": "detection",
  "title": "Critical Damage Detected",
  "message": "Severe corrosion on transformer T-123",
  "source": "BAHB",
  "metadata": {
    "confidence": 0.95,
    "location": "Grid A-5"
  }
}
```

## Systemd Service

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
Environment="PYTHONUNBUFFERED=1"

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bahb-monitoring
sudo systemctl start bahb-monitoring
sudo systemctl status bahb-monitoring
```

View logs:

```bash
sudo journalctl -u bahb-monitoring -f
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM nvcr.io/nvidia/l4t-pytorch:r35.2.1-pth2.0-py3

WORKDIR /app
COPY . .

RUN pip install -r requirements.txt

EXPOSE 8081

CMD ["python", "-m", "bahb.monitoring.monitor_service"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  bahb-monitoring:
    build: .
    ports:
      - "8081:8081"
    environment:
      - BAHB_MQTT_BROKER=mqtt-broker
      - BAHB_WEBHOOK_URL=https://api.example.com/alerts
    devices:
      - /dev/nvhost-gpu:/dev/nvhost-gpu
    volumes:
      - /data/bahb:/data/bahb
      - /sys:/sys:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mqtt-broker:
    image: eclipse-mosquitto:latest
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
```

## Troubleshooting

### Health Check Not Responding

```bash
# Check if server is running
curl -v http://localhost:8081/health

# Check port is open
netstat -tulpn | grep 8081

# Check logs
tail -f /data/bahb/logs/monitoring.log
```

### GPU Metrics Not Available

```bash
# Install pynvml
pip install pynvml

# Test GPU
nvidia-smi

# Test in Python
python -c "import pynvml; pynvml.nvmlInit(); print('GPU OK')"
```

### MQTT Not Connecting

```bash
# Test broker
mosquitto_sub -h localhost -t test -v

# Check connection
telnet localhost 1883

# Check configuration
python -c "from bahb.monitoring import AlertSystem; s = AlertSystem(mqtt_broker='localhost'); print(s.mqtt_broker)"
```

### Thermal Monitoring Not Working

```bash
# Check thermal zones
ls -la /sys/devices/virtual/thermal/

# Read temperature
cat /sys/devices/virtual/thermal/thermal_zone0/temp

# Check permissions
sudo chmod a+r /sys/devices/virtual/thermal/thermal_zone*/temp
```

## Performance Impact

The monitoring system is lightweight:

- **CPU:** < 2% overhead
- **Memory:** ~100MB
- **Network:** Minimal (alerts only)
- **Disk I/O:** Minimal (logging)

## Next Steps

1. **Grafana Dashboard**: Create visualizations for metrics
2. **Custom Alerts**: Add application-specific alert rules
3. **Log Aggregation**: Send logs to ELK/Loki
4. **Backup**: Configure automated backup of metrics

## Support

- Documentation: `/home/user/BAHB/bahb/monitoring/README.md`
- Examples: `/home/user/BAHB/examples/monitoring_demo.py`
- Tests: `/home/user/BAHB/tests/test_monitoring.py`
- Configuration: `/home/user/BAHB/configs/monitoring.yaml`

## Example: Complete Setup

```python
#!/usr/bin/env python3
import asyncio
from bahb.core.engine import InspectionEngine
from bahb.monitoring import MonitoringService, MonitoringConfig
from pathlib import Path

async def main():
    # Configure monitoring
    monitoring_config = MonitoringConfig(
        health_check_enabled=True,
        health_check_port=8081,
        metrics_enabled=True,
        alerts_enabled=True,
        mqtt_broker="localhost",
        webhook_url="https://api.example.com/alerts",
        thermal_monitor_enabled=True,
        recording_path=Path("/data/bahb/recordings"),
        camera_streams=[
            "rtsp://192.168.42.2:8554/wide",
            "rtsp://192.168.42.2:8554/thermal",
        ],
    )

    # Initialize inspection engine
    engine = InspectionEngine()
    await engine.initialize()

    # Start monitoring
    monitoring = MonitoringService(
        config=monitoring_config,
        inference_engine=engine,
    )
    await monitoring.start()

    # Start inspection
    session_id = await engine.start_inspection(
        site_name="Main Substation Alpha"
    )

    print(f"Inspection started: {session_id}")
    print(f"Health: http://localhost:8081/health")
    print(f"Metrics: http://localhost:8081/metrics")

    # Run indefinitely
    try:
        while True:
            await asyncio.sleep(60)

            # Print status every minute
            status = monitoring.get_status()
            print(f"FPS: {status['metrics']['throughput']['current_fps']:.1f}")

    except KeyboardInterrupt:
        print("Stopping...")
        await engine.stop_inspection()
        await monitoring.stop()

if __name__ == "__main__":
    asyncio.run(main())
```

Save and run:

```bash
python complete_setup.py
```

You're now monitoring BAHB! 🚀
