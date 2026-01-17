#!/usr/bin/env python3
"""
BAHB Monitoring System Demo

Demonstrates how to use the comprehensive monitoring system.
"""

import asyncio
import sys
from pathlib import Path

# Add BAHB to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from bahb.monitoring import (
    MonitoringService,
    MonitoringConfig,
    MetricsCollector,
    AlertSystem,
    AlertSeverity,
    AlertCategory,
    ThermalMonitor,
)


async def demo_metrics_collector():
    """Demo metrics collection."""
    logger.info("=" * 60)
    logger.info("Demo: Metrics Collector")
    logger.info("=" * 60)

    metrics = MetricsCollector()
    await metrics.start()

    # Simulate some processing
    for i in range(10):
        metrics.record_frame()
        metrics.record_inference_latency(15.0 + i * 0.5)
        metrics.record_detection("transformer")

        if i % 3 == 0:
            metrics.record_anomaly("corrosion", "warning")

        await asyncio.sleep(0.1)

    # Get summary
    summary = metrics.get_summary()
    logger.info(f"Processed {summary['session']['total_frames']} frames")
    logger.info(f"Average FPS: {summary['throughput']['average_fps']:.2f}")
    logger.info(f"Average inference latency: {summary['latency']['inference_avg_ms']:.2f}ms")
    logger.info(f"P95 latency: {summary['latency']['inference_p95_ms']:.2f}ms")
    logger.info(f"Total detections: {summary['session']['total_detections']}")

    await metrics.stop()
    logger.info("")


async def demo_alert_system():
    """Demo alert system."""
    logger.info("=" * 60)
    logger.info("Demo: Alert System")
    logger.info("=" * 60)

    alerts = AlertSystem(
        enable_local_alerts=True,
        # Uncomment to enable MQTT:
        # mqtt_broker="localhost",
        # mqtt_topic="bahb/alerts",
    )

    await alerts.start()

    # Send various alerts
    await alerts.send_alert(
        severity=AlertSeverity.INFO,
        category=AlertCategory.SYSTEM,
        title="System Started",
        message="BAHB monitoring system initialized successfully",
    )

    await alerts.alert_thermal_hotspot(
        temperature=85.5,
        location="Transformer T-123",
    )

    await alerts.alert_critical_detection(
        detection_type="oil_leak",
        location="Grid A-5",
        confidence=0.95,
    )

    await alerts.alert_gpu_memory_high(
        usage_mb=14500,
        total_mb=16000,
    )

    # Get statistics
    stats = alerts.get_statistics()
    logger.info(f"Total alerts sent: {stats['total_alerts']}")
    logger.info(f"Critical alerts: {stats['alerts_by_severity']['critical']}")
    logger.info(f"Deduplicated: {stats['deduplicated_alerts']}")

    await alerts.stop()
    logger.info("")


async def demo_thermal_monitor():
    """Demo thermal monitoring."""
    logger.info("=" * 60)
    logger.info("Demo: Thermal Monitor")
    logger.info("=" * 60)

    async def on_thermal_alert(severity, message, temperature):
        logger.warning(f"Thermal Alert [{severity}]: {message} ({temperature:.1f}°C)")

    async def on_throttle(should_throttle):
        if should_throttle:
            logger.critical("THROTTLING ENABLED - Reducing workload")
        else:
            logger.info("THROTTLING DISABLED - Resuming normal operation")

    thermal = ThermalMonitor(
        alert_callback=on_thermal_alert,
        throttle_callback=on_throttle,
    )

    await thermal.start(check_interval_seconds=1.0)

    # Monitor for a few seconds
    for _ in range(5):
        await asyncio.sleep(1)

        temps = thermal.get_current_temperatures()
        if temps:
            logger.info(f"Current temperatures: {temps}")

    # Print summary
    logger.info("")
    logger.info(thermal.get_thermal_summary())

    await thermal.stop()
    logger.info("")


async def demo_full_monitoring_service():
    """Demo full monitoring service."""
    logger.info("=" * 60)
    logger.info("Demo: Full Monitoring Service")
    logger.info("=" * 60)

    config = MonitoringConfig(
        health_check_enabled=True,
        health_check_port=8081,
        metrics_enabled=True,
        alerts_enabled=True,
        thermal_monitor_enabled=True,
        recording_path=Path("/tmp/bahb_demo"),
        model_paths=[
            Path("/home/user/BAHB/models/yolo26l-inspection.pt"),
        ],
    )

    # Create recording path
    config.recording_path.mkdir(parents=True, exist_ok=True)

    service = MonitoringService(config=config)

    await service.start()

    logger.info("")
    logger.info("Monitoring service is running!")
    logger.info("Try these commands:")
    logger.info("  curl http://localhost:8081/health")
    logger.info("  curl http://localhost:8081/health/detailed")
    logger.info("  curl http://localhost:8081/metrics")
    logger.info("")
    logger.info("Press Ctrl+C to stop...")

    try:
        # Simulate some activity
        for i in range(30):
            if service.metrics:
                service.metrics.record_frame()
                service.metrics.record_inference_latency(15.0 + (i % 5))

                if i % 5 == 0:
                    service.metrics.record_detection("transformer")

            await asyncio.sleep(1)

            # Print status every 10 seconds
            if i % 10 == 9:
                status = service.get_status()
                logger.info(f"Status: {status['running']}")
                if 'metrics' in status:
                    logger.info(
                        f"  FPS: {status['metrics']['throughput']['current_fps']:.2f}"
                    )

    except KeyboardInterrupt:
        logger.info("Stopping monitoring service...")

    await service.stop()
    logger.info("")


async def main():
    """Run all demos."""
    logger.info("BAHB Monitoring System Demo")
    logger.info("=" * 60)
    logger.info("")

    # Run individual demos
    await demo_metrics_collector()
    await demo_alert_system()
    await demo_thermal_monitor()

    # Run full monitoring service
    # This will run until Ctrl+C
    await demo_full_monitoring_service()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Demo stopped by user")
        sys.exit(0)
