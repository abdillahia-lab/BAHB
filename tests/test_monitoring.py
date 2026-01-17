#!/usr/bin/env python3
"""
Unit tests for BAHB monitoring system.
"""

import asyncio
import pytest
from pathlib import Path
from datetime import datetime

# Import monitoring components
from bahb.monitoring import (
    MetricsCollector,
    AlertSystem,
    AlertSeverity,
    AlertCategory,
    ThermalMonitor,
    ThermalThresholds,
)


class TestMetricsCollector:
    """Test metrics collector."""

    @pytest.mark.asyncio
    async def test_metrics_initialization(self):
        """Test metrics collector initialization."""
        metrics = MetricsCollector()
        assert metrics.throughput.frame_count == 0
        assert metrics.total_frames_processed == 0

    @pytest.mark.asyncio
    async def test_frame_recording(self):
        """Test frame recording."""
        metrics = MetricsCollector()
        await metrics.start()

        # Record some frames
        for _ in range(10):
            metrics.record_frame()

        assert metrics.total_frames_processed == 10
        assert metrics.throughput.frame_count == 10

        await metrics.stop()

    @pytest.mark.asyncio
    async def test_latency_recording(self):
        """Test latency recording."""
        metrics = MetricsCollector()

        # Record some latencies
        for i in range(10):
            metrics.record_inference_latency(10.0 + i)

        assert metrics.inference_latency.count == 10
        assert metrics.inference_latency.min_ms == 10.0
        assert metrics.inference_latency.max_ms == 19.0

    @pytest.mark.asyncio
    async def test_detection_recording(self):
        """Test detection recording."""
        metrics = MetricsCollector()

        metrics.record_detection("transformer")
        metrics.record_detection("transformer")
        metrics.record_detection("insulator")

        assert metrics.detection_counts["transformer"] == 2
        assert metrics.detection_counts["insulator"] == 1
        assert metrics.total_detections == 3

    @pytest.mark.asyncio
    async def test_prometheus_export(self):
        """Test Prometheus export."""
        metrics = MetricsCollector()
        metrics.record_frame()
        metrics.record_inference_latency(15.0)

        prometheus = metrics.export_prometheus()

        assert "bahb_throughput_fps" in prometheus
        assert "bahb_inference_latency_avg_ms" in prometheus
        assert "# HELP" in prometheus
        assert "# TYPE" in prometheus


class TestAlertSystem:
    """Test alert system."""

    @pytest.mark.asyncio
    async def test_alert_initialization(self):
        """Test alert system initialization."""
        alerts = AlertSystem(enable_local_alerts=True)
        await alerts.start()

        assert alerts._running == False  # Not running until start() completes
        assert len(alerts._rules) > 0  # Default rules loaded

        await alerts.stop()

    @pytest.mark.asyncio
    async def test_send_alert(self):
        """Test sending an alert."""
        alerts = AlertSystem(enable_local_alerts=True)
        await alerts.start()

        alert_id = await alerts.send_alert(
            severity=AlertSeverity.WARNING,
            category=AlertCategory.SYSTEM,
            title="Test Alert",
            message="This is a test",
        )

        assert alert_id is not None
        assert alerts.stats["total_alerts"] == 1
        assert alerts.stats["alerts_by_severity"]["warning"] == 1

        await alerts.stop()

    @pytest.mark.asyncio
    async def test_alert_deduplication(self):
        """Test alert deduplication."""
        alerts = AlertSystem(enable_local_alerts=True)
        await alerts.start()

        # Send same alert twice
        alert_id1 = await alerts.send_alert(
            severity=AlertSeverity.WARNING,
            category=AlertCategory.SYSTEM,
            title="Test Alert",
            message="Duplicate test",
        )

        alert_id2 = await alerts.send_alert(
            severity=AlertSeverity.WARNING,
            category=AlertCategory.SYSTEM,
            title="Test Alert",
            message="Duplicate test",
        )

        assert alert_id1 is not None
        assert alert_id2 is None  # Deduplicated
        assert alerts.stats["deduplicated_alerts"] == 1

        await alerts.stop()

    @pytest.mark.asyncio
    async def test_rate_limiting(self):
        """Test rate limiting."""
        alerts = AlertSystem(enable_local_alerts=True)
        await alerts.start()

        # Modify rule to have short rate limit
        alerts._rules["test_rule"] = type('obj', (object,), {
            'name': 'test_rule',
            'enabled': True,
            'severity': AlertSeverity.WARNING,
            'category': AlertCategory.SYSTEM,
            'rate_limit_seconds': 1,
            'deduplicate': False,
        })()

        # Send first alert (should succeed)
        alert_id1 = await alerts.send_alert(
            severity=AlertSeverity.WARNING,
            category=AlertCategory.SYSTEM,
            title="Rate Test 1",
            message="First",
            rule_name="test_rule",
        )

        # Send second alert immediately (should be rate-limited)
        alert_id2 = await alerts.send_alert(
            severity=AlertSeverity.WARNING,
            category=AlertCategory.SYSTEM,
            title="Rate Test 2",
            message="Second",
            rule_name="test_rule",
        )

        assert alert_id1 is not None
        assert alert_id2 is None  # Rate limited
        assert alerts.stats["rate_limited_alerts"] >= 1

        await alerts.stop()


class TestThermalMonitor:
    """Test thermal monitor."""

    @pytest.mark.asyncio
    async def test_thermal_initialization(self):
        """Test thermal monitor initialization."""
        thermal = ThermalMonitor()

        assert thermal.thresholds.warm_threshold == 60.0
        assert thermal.thresholds.hot_threshold == 75.0
        assert thermal._thermal_state.value == "normal"

    def test_temperature_classification(self):
        """Test temperature classification."""
        thermal = ThermalMonitor()

        assert thermal._classify_temperature(50.0).value == "normal"
        assert thermal._classify_temperature(65.0).value == "warm"
        assert thermal._classify_temperature(80.0).value == "hot"
        assert thermal._classify_temperature(88.0).value == "critical"
        assert thermal._classify_temperature(92.0).value == "throttling"

    @pytest.mark.asyncio
    async def test_thermal_callback(self):
        """Test thermal alert callback."""
        callback_called = False
        callback_data = {}

        async def on_alert(severity, message, temperature):
            nonlocal callback_called, callback_data
            callback_called = True
            callback_data = {
                "severity": severity,
                "message": message,
                "temperature": temperature,
            }

        thermal = ThermalMonitor(alert_callback=on_alert)

        # Simulate state change
        from bahb.monitoring.thermal_monitor import ThermalState, ThermalReading

        reading = ThermalReading(
            zone="GPU-therm",
            temperature_celsius=85.0,
            timestamp=datetime.now(),
            state=ThermalState.CRITICAL,
        )

        await thermal._handle_state_change(
            ThermalState.NORMAL,
            ThermalState.CRITICAL,
            reading
        )

        assert callback_called
        assert callback_data["temperature"] == 85.0


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
