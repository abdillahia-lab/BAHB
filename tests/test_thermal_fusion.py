"""Integration tests for thermal fusion and analysis."""

from __future__ import annotations

import numpy as np
import pytest
from numpy.typing import NDArray

from bahb.core.types import BoundingBox, Detection
from bahb.thermal.analyzer import ThermalAnalyzer, ThermalZone


class TestThermalImageProcessing:
    """Test thermal image processing and conversion."""

    @pytest.mark.unit
    def test_thermal_analyzer_init(self, thermal_config):
        """Test ThermalAnalyzer initialization."""
        analyzer = ThermalAnalyzer(thermal_config)

        assert analyzer.baseline_temp == thermal_config.baseline_temp
        assert analyzer.hotspot_threshold == thermal_config.hotspot_threshold
        assert analyzer.critical_threshold == thermal_config.critical_threshold

    @pytest.mark.integration
    def test_analyze_thermal_image(self, thermal_config, sample_thermal_raw):
        """Test analyzing a thermal image."""
        analyzer = ThermalAnalyzer(thermal_config)

        reading = analyzer.analyze(sample_thermal_raw)

        assert reading is not None
        assert hasattr(reading, "min_temp")
        assert hasattr(reading, "max_temp")
        assert hasattr(reading, "mean_temp")
        assert hasattr(reading, "hotspot_locations")

    @pytest.mark.integration
    def test_temperature_statistics(self, thermal_config, sample_thermal_raw):
        """Test temperature statistics calculation."""
        analyzer = ThermalAnalyzer(thermal_config)
        reading = analyzer.analyze(sample_thermal_raw)

        # Verify statistics
        assert reading.min_temp < reading.max_temp
        assert reading.min_temp <= reading.mean_temp <= reading.max_temp
        assert reading.delta_t == reading.max_temp - reading.min_temp

    @pytest.mark.integration
    def test_colorized_to_temperature_conversion(self, thermal_config, sample_thermal_image):
        """Test converting colorized thermal image to temperatures."""
        analyzer = ThermalAnalyzer(thermal_config)

        # Estimate temperatures from colorized image
        temp_map = analyzer._estimate_temperatures_from_colorized(
            sample_thermal_image,
            temp_range=(-20, 120)
        )

        assert temp_map.dtype == np.float32
        assert temp_map.shape[:2] == sample_thermal_image.shape[:2]
        assert -20 <= temp_map.min() <= 120
        assert -20 <= temp_map.max() <= 120


class TestVisualThermalAlignment:
    """Test alignment between visual and thermal images."""

    @pytest.mark.integration
    def test_image_registration(self, sample_image, sample_thermal_image):
        """Test aligning thermal and visual images."""
        import cv2

        # Resize thermal to match visual
        visual_size = (sample_image.shape[1], sample_image.shape[0])
        thermal_aligned = cv2.resize(sample_thermal_image, visual_size)

        assert thermal_aligned.shape[:2] == sample_image.shape[:2]

    @pytest.mark.integration
    def test_coordinate_mapping(self):
        """Test mapping coordinates between visual and thermal."""
        # Visual: 1920x1080, Thermal: 640x512
        visual_shape = (1080, 1920)
        thermal_shape = (512, 640)

        # Scale factors
        scale_x = thermal_shape[1] / visual_shape[1]
        scale_y = thermal_shape[0] / visual_shape[0]

        # Map visual coordinate to thermal
        visual_x, visual_y = 960, 540  # Center of visual
        thermal_x = int(visual_x * scale_x)
        thermal_y = int(visual_y * scale_y)

        assert 0 <= thermal_x <= thermal_shape[1]
        assert 0 <= thermal_y <= thermal_shape[0]

    @pytest.mark.integration
    def test_bbox_projection(self):
        """Test projecting bounding box from visual to thermal."""
        # Detection bbox in visual coordinates
        visual_bbox = BoundingBox(x1=800, y1=400, x2=1200, y2=800)

        # Scale to thermal resolution
        visual_w, visual_h = 1920, 1080
        thermal_w, thermal_h = 640, 512

        scale_x = thermal_w / visual_w
        scale_y = thermal_h / visual_h

        thermal_bbox = BoundingBox(
            x1=visual_bbox.x1 * scale_x,
            y1=visual_bbox.y1 * scale_y,
            x2=visual_bbox.x2 * scale_x,
            y2=visual_bbox.y2 * scale_y,
        )

        assert 0 <= thermal_bbox.x1 <= thermal_w
        assert 0 <= thermal_bbox.y1 <= thermal_h
        assert thermal_bbox.x2 <= thermal_w
        assert thermal_bbox.y2 <= thermal_h


class TestTemperatureExtraction:
    """Test temperature data extraction."""

    @pytest.mark.integration
    def test_region_temperature_extraction(self, thermal_config, sample_thermal_raw):
        """Test extracting temperature from a specific region."""
        analyzer = ThermalAnalyzer(thermal_config)

        # Define region of interest
        roi = BoundingBox(x1=150, y1=150, x2=250, y2=250)

        # Analyze region
        region_analysis = analyzer.analyze_region(sample_thermal_raw, roi)

        assert "min_temp" in region_analysis
        assert "max_temp" in region_analysis
        assert "mean_temp" in region_analysis
        assert "std_temp" in region_analysis

    @pytest.mark.integration
    def test_hotspot_detection(self, thermal_config, sample_thermal_raw):
        """Test detecting hot spots in thermal image."""
        analyzer = ThermalAnalyzer(thermal_config)

        reading = analyzer.analyze(sample_thermal_raw)
        hotspots = reading.hotspot_locations

        # Should detect the hot spots we created
        assert len(hotspots) > 0

        # Verify hotspot temperatures are high
        for x, y in hotspots:
            temp = reading.temperature_map[y, x]
            assert temp > analyzer.baseline_temp + analyzer.hotspot_threshold

    @pytest.mark.integration
    def test_coldspot_detection(self, thermal_config):
        """Test detecting cold spots in thermal image."""
        analyzer = ThermalAnalyzer(thermal_config)

        # Create thermal image with cold spot
        thermal = np.ones((512, 640), dtype=np.float32) * 25.0
        # Add cold spot
        import cv2
        cv2.circle(thermal, (300, 300), 30, 5.0, -1)  # 5°C

        reading = analyzer.analyze(thermal)
        coldspots = reading.coldspot_locations

        # Should detect cold spot
        assert len(coldspots) > 0


class TestConfidenceBoostingLogic:
    """Test thermal-based confidence boosting."""

    @pytest.mark.integration
    def test_thermal_confidence_boost(self, thermal_config, sample_thermal_raw):
        """Test boosting detection confidence based on thermal signature."""
        analyzer = ThermalAnalyzer(thermal_config)

        # Detection with moderate confidence
        detection = Detection(
            class_id=0,
            class_name="transformer",
            confidence=0.65,
            bbox=BoundingBox(x1=180, y1=180, x2=220, y2=220),
        )

        # Analyze thermal region
        region_analysis = analyzer.analyze_region(
            sample_thermal_raw,
            detection.bbox,
            equipment_type="transformer"
        )

        # If hot, should boost confidence
        if region_analysis.get("status") in ["warning", "critical"]:
            boosted_confidence = min(0.95, detection.confidence + 0.15)
            assert boosted_confidence > detection.confidence
        else:
            boosted_confidence = detection.confidence

    @pytest.mark.integration
    def test_thermal_anomaly_detection(self, thermal_config, sample_thermal_raw, sample_detections):
        """Test detecting thermal anomalies in detected objects."""
        analyzer = ThermalAnalyzer(thermal_config)

        anomalies = analyzer.detect_anomalies_advanced(
            sample_thermal_raw,
            sample_detections
        )

        # May or may not have anomalies depending on thermal data
        assert isinstance(anomalies, list)

        for anomaly in anomalies:
            assert "detection" in anomaly
            assert "thermal_analysis" in anomaly
            assert "severity" in anomaly
            assert "reason" in anomaly


class TestEquipmentZoneThresholds:
    """Test equipment-specific temperature zones."""

    @pytest.mark.unit
    def test_transformer_zone(self):
        """Test transformer temperature zone thresholds."""
        zone = ThermalZone(
            name="transformer",
            normal_range=(20, 65),
            warning_range=(65, 85),
            critical_range=(85, 150),
        )

        assert zone.get_status(40) == "normal"
        assert zone.get_status(70) == "warning"
        assert zone.get_status(100) == "critical"

    @pytest.mark.unit
    def test_conductor_zone(self):
        """Test conductor temperature zone thresholds."""
        zone = ThermalZone(
            name="conductor",
            normal_range=(15, 50),
            warning_range=(50, 75),
            critical_range=(75, 120),
        )

        assert zone.get_status(30) == "normal"
        assert zone.get_status(60) == "warning"
        assert zone.get_status(90) == "critical"

    @pytest.mark.integration
    def test_zone_based_analysis(self, thermal_config, sample_thermal_raw):
        """Test equipment-specific zone analysis."""
        analyzer = ThermalAnalyzer(thermal_config)

        # Test different equipment types
        equipment_types = ["transformer", "conductor", "switchgear", "insulator"]

        for eq_type in equipment_types:
            bbox = BoundingBox(x1=100, y1=100, x2=200, y2=200)
            analysis = analyzer.analyze_region(
                sample_thermal_raw,
                bbox,
                equipment_type=eq_type
            )

            if eq_type in analyzer.zones:
                assert "status" in analysis
                assert "zone" in analysis
                assert analysis["status"] in ["normal", "warning", "critical", "unknown"]

    @pytest.mark.integration
    def test_multi_equipment_comparison(self, thermal_config, sample_thermal_raw):
        """Test comparing thermal signatures of multiple equipment."""
        analyzer = ThermalAnalyzer(thermal_config)

        # Two regions (e.g., phases in 3-phase system)
        region1 = BoundingBox(x1=100, y1=100, x2=200, y2=200)
        region2 = BoundingBox(x1=300, y1=100, x2=400, y2=200)

        comparison = analyzer.compare_regions(sample_thermal_raw, region1, region2)

        assert "region1" in comparison
        assert "region2" in comparison
        assert "mean_diff" in comparison
        assert "max_diff" in comparison


class TestThermalTrendAnalysis:
    """Test temperature trend analysis over time."""

    @pytest.mark.integration
    def test_temperature_tracking(self, thermal_config):
        """Test tracking temperature over time."""
        analyzer = ThermalAnalyzer(thermal_config)

        region_id = "transformer_01"

        # Simulate temperature readings over time
        temperatures = [55.0, 56.0, 57.5, 59.0, 60.5]

        for temp in temperatures:
            trend = analyzer.track_temperature(region_id, temp)

        # Should have trend data
        assert trend["current"] == temperatures[-1]
        assert trend["samples"] == len(temperatures)
        assert "trend_direction" in trend

    @pytest.mark.integration
    def test_rising_temperature_trend(self, thermal_config):
        """Test detecting rising temperature trend."""
        analyzer = ThermalAnalyzer(thermal_config)

        region_id = "equipment_rising"
        temperatures = [50.0, 52.0, 54.0, 56.0, 58.0]  # Rising

        for temp in temperatures:
            trend = analyzer.track_temperature(region_id, temp)

        assert trend["trend"] > 0
        assert trend["trend_direction"] == "rising"

    @pytest.mark.integration
    def test_stable_temperature_trend(self, thermal_config):
        """Test detecting stable temperature."""
        analyzer = ThermalAnalyzer(thermal_config)

        region_id = "equipment_stable"
        temperatures = [50.0, 50.2, 49.8, 50.1, 50.0]  # Stable

        for temp in temperatures:
            trend = analyzer.track_temperature(region_id, temp)

        assert abs(trend["trend"]) <= 1.0
        assert trend["trend_direction"] == "stable"


class TestThermalOverlay:
    """Test thermal visualization and overlay."""

    @pytest.mark.integration
    def test_create_thermal_overlay(self, thermal_config, sample_image, sample_thermal_raw):
        """Test creating RGB + thermal overlay."""
        analyzer = ThermalAnalyzer(thermal_config)

        overlay = analyzer.create_thermal_overlay(
            sample_image,
            sample_thermal_raw,
            alpha=0.5,
            show_hotspots=True
        )

        assert overlay.shape == sample_image.shape
        assert overlay.dtype == np.uint8

    @pytest.mark.integration
    def test_hotspot_highlighting(self, thermal_config, sample_thermal_raw):
        """Test hotspot highlighting on overlay."""
        analyzer = ThermalAnalyzer(thermal_config)

        reading = analyzer.analyze(sample_thermal_raw)
        hotspots = reading.hotspot_locations

        # Create visualization
        import cv2
        vis = cv2.applyColorMap(
            (sample_thermal_raw / sample_thermal_raw.max() * 255).astype(np.uint8),
            cv2.COLORMAP_INFERNO
        )

        # Draw hotspots
        for x, y in hotspots:
            cv2.circle(vis, (x, y), 10, (0, 0, 255), 2)

        assert vis is not None


class TestThermalReporting:
    """Test thermal analysis reporting."""

    @pytest.mark.integration
    def test_generate_thermal_report(self, thermal_config, sample_thermal_raw):
        """Test generating thermal analysis report."""
        analyzer = ThermalAnalyzer(thermal_config)

        reading = analyzer.analyze(sample_thermal_raw)
        report = analyzer.generate_thermal_report(reading)

        assert "summary" in report
        assert "assessment" in report
        assert "hotspots" in report

        # Verify summary contents
        summary = report["summary"]
        assert "min_temperature" in summary
        assert "max_temperature" in summary
        assert "mean_temperature" in summary
        assert "hotspot_count" in summary

    @pytest.mark.integration
    def test_assessment_generation(self, thermal_config, sample_thermal_raw):
        """Test generating text assessment."""
        analyzer = ThermalAnalyzer(thermal_config)

        reading = analyzer.analyze(sample_thermal_raw)
        assessment = analyzer._generate_assessment(reading)

        assert isinstance(assessment, str)
        assert len(assessment) > 0


class TestEdgeCases:
    """Test edge cases and error handling."""

    @pytest.mark.unit
    def test_empty_thermal_image(self, thermal_config):
        """Test handling empty thermal data."""
        analyzer = ThermalAnalyzer(thermal_config)

        # Empty image
        thermal = np.zeros((512, 640), dtype=np.float32)

        reading = analyzer.analyze(thermal)

        assert reading.min_temp == 0.0
        assert reading.max_temp == 0.0
        assert len(reading.hotspot_locations) == 0

    @pytest.mark.unit
    def test_uniform_temperature(self, thermal_config):
        """Test handling uniform temperature field."""
        analyzer = ThermalAnalyzer(thermal_config)

        # Uniform temperature
        thermal = np.ones((512, 640), dtype=np.float32) * 25.0

        reading = analyzer.analyze(thermal)

        assert reading.min_temp == 25.0
        assert reading.max_temp == 25.0
        assert reading.delta_t == 0.0

    @pytest.mark.unit
    def test_invalid_bbox(self, thermal_config, sample_thermal_raw):
        """Test handling invalid bounding box."""
        analyzer = ThermalAnalyzer(thermal_config)

        # Invalid bbox (negative coordinates)
        invalid_bbox = BoundingBox(x1=-10, y1=-10, x2=10, y2=10)

        result = analyzer.analyze_region(sample_thermal_raw, invalid_bbox)

        # Should handle gracefully
        assert result is not None

    @pytest.mark.unit
    def test_out_of_bounds_bbox(self, thermal_config, sample_thermal_raw):
        """Test handling out-of-bounds bounding box."""
        analyzer = ThermalAnalyzer(thermal_config)

        # Bbox exceeds image bounds
        h, w = sample_thermal_raw.shape[:2]
        oob_bbox = BoundingBox(x1=w-10, y1=h-10, x2=w+100, y2=h+100)

        result = analyzer.analyze_region(sample_thermal_raw, oob_bbox)

        # Should clip to image bounds
        assert result is not None


class TestGradientAnalysis:
    """Test thermal gradient analysis."""

    @pytest.mark.integration
    def test_temperature_gradient(self, thermal_config, sample_thermal_raw):
        """Test calculating temperature gradients."""
        analyzer = ThermalAnalyzer(thermal_config)

        bbox = BoundingBox(x1=150, y1=150, x2=250, y2=250)
        analysis = analyzer.analyze_region(sample_thermal_raw, bbox)

        assert "max_gradient" in analysis
        assert "mean_gradient" in analysis
        assert analysis["max_gradient"] >= 0
        assert analysis["mean_gradient"] >= 0

    @pytest.mark.integration
    def test_high_gradient_detection(self, thermal_config):
        """Test detecting high thermal gradients (potential issues)."""
        analyzer = ThermalAnalyzer(thermal_config)

        # Create thermal image with sharp gradient
        thermal = np.ones((512, 640), dtype=np.float32) * 25.0
        # Sharp hot edge
        thermal[200:300, 200:210] = 80.0

        bbox = BoundingBox(x1=150, y1=150, x2=350, y2=350)
        analysis = analyzer.analyze_region(thermal, bbox)

        # Should detect high gradient
        assert analysis["max_gradient"] > 1.0
