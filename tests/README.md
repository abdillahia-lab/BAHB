# BAHB Integration Test Suite

Comprehensive integration and unit tests for the BAHB infrastructure inspection system.

## Test Structure

```
tests/
├── conftest.py                    # Pytest fixtures and configuration
├── pytest.ini                     # Pytest settings
├── test_detection_pipeline.py     # YOLO26 detection tests
├── test_deepstream_pipeline.py    # DeepStream integration tests
├── test_thermal_fusion.py         # Thermal analysis tests
├── test_camera_streams.py         # Camera streaming tests
├── test_end_to_end.py            # End-to-end pipeline tests
└── test_data/                     # Test data directory
    ├── images/                    # Sample infrastructure images
    ├── thermal/                   # Sample thermal images
    └── expected/                  # Expected detection results
```

## Running Tests

### Run All Tests
```bash
pytest tests/
```

### Run Specific Test Categories

**Unit Tests Only** (fast, no external dependencies):
```bash
pytest tests/ -m unit
```

**Integration Tests**:
```bash
pytest tests/ -m integration
```

**GPU Tests** (requires CUDA):
```bash
pytest tests/ -m gpu
```

**Benchmarks**:
```bash
pytest tests/ -m benchmark
```

**Exclude Slow Tests**:
```bash
pytest tests/ -m "not slow"
```

### Run Specific Test Files

```bash
# Detection pipeline tests
pytest tests/test_detection_pipeline.py

# Thermal fusion tests
pytest tests/test_thermal_fusion.py

# End-to-end tests
pytest tests/test_end_to_end.py -v
```

### Run Specific Test Classes or Functions

```bash
# Run specific test class
pytest tests/test_detection_pipeline.py::TestYOLO26ModelLoading

# Run specific test function
pytest tests/test_detection_pipeline.py::TestYOLO26ModelLoading::test_model_init_with_config
```

## Test Categories

### 1. Detection Pipeline Tests (`test_detection_pipeline.py`)
- **Model Loading**: Test YOLO26 model initialization and loading
- **Inference**: Test detection on sample images
- **Output Format**: Verify detection results format
- **Batch Processing**: Test multi-image processing
- **Performance**: Benchmark inference speed and FPS

**Key Tests:**
- `test_model_init_with_config`: Model initialization
- `test_inference_basic`: Basic detection functionality
- `test_inference_output_format`: Output validation
- `test_batch_inference`: Batch processing
- `test_inference_latency`: Performance benchmarking

### 2. DeepStream Pipeline Tests (`test_deepstream_pipeline.py`)
- **Config Parsing**: Validate DeepStream configuration files
- **Pipeline Init**: Test pipeline component creation
- **Multi-Stream**: Test dual-stream processing (visual + thermal)
- **Tracker**: Test NvDCF tracker integration
- **Output**: Test metadata and RTSP output formats

**Key Tests:**
- `test_parse_config_file`: Config file validation
- `test_pipeline_creation`: Pipeline initialization
- `test_nvdcf_tracker_config`: Tracker configuration
- `test_multi_stream_sync`: Frame synchronization

### 3. Thermal Fusion Tests (`test_thermal_fusion.py`)
- **Image Processing**: Thermal image conversion and processing
- **Alignment**: Visual-thermal image registration
- **Temperature**: Temperature extraction and statistics
- **Confidence Boost**: Thermal-based confidence boosting
- **Zones**: Equipment-specific temperature thresholds

**Key Tests:**
- `test_analyze_thermal_image`: Thermal analysis
- `test_bbox_projection`: Coordinate mapping
- `test_hotspot_detection`: Hot spot identification
- `test_thermal_confidence_boost`: Confidence adjustment
- `test_zone_based_analysis`: Equipment zones

### 4. Camera Stream Tests (`test_camera_streams.py`)
- **RTSP Connection**: Test RTSP stream connection (mocked)
- **Frame Capture**: Test frame acquisition and buffering
- **Reconnection**: Test automatic reconnection
- **Synchronization**: Test multi-camera frame sync
- **Statistics**: Test stream health monitoring

**Key Tests:**
- `test_rtsp_stream_creation`: Stream initialization
- `test_mock_rtsp_connection`: Connection handling
- `test_frame_timestamp_sync`: Frame synchronization
- `test_stream_health_monitoring`: Health checks

### 5. End-to-End Tests (`test_end_to_end.py`)
- **Full Pipeline**: Complete processing workflow
- **Detection Verify**: Verify results match expected
- **Alert Generation**: Test anomaly alerting
- **Recording**: Test video recording output
- **Performance**: End-to-end benchmarks

**Key Tests:**
- `test_process_sample_video`: Full video processing
- `test_verify_detections_match_expected`: Result validation
- `test_generate_alert_for_hotspot`: Alert generation
- `test_end_to_end_latency`: Performance benchmarking
- `test_full_inspection_session`: Complete workflow

## Test Fixtures

Common fixtures provided by `conftest.py`:

### Image Fixtures
- `sample_image`: 640x640 RGB test image
- `sample_thermal_image`: 640x512 colorized thermal image
- `sample_thermal_raw`: Raw temperature data (float32)
- `sample_hires_image`: 4K test image
- `batch_images`: Batch of 4 test images

### Mock Fixtures
- `mock_rtsp_stream`: Mocked camera stream
- `mock_h30t_streams`: Mocked H30T multi-sensor streams
- `mock_yolo_model`: Mocked YOLO detector
- `mock_config`: Mocked configuration

### Data Fixtures
- `sample_detections`: Sample detection results
- `expected_detections_json`: Expected results in JSON

### Utility Fixtures
- `temp_dir`: Temporary directory for test outputs
- `output_dir`: Output directory for artifacts
- `benchmark_context`: Performance benchmarking context

## Writing New Tests

### Test Naming Convention
- Test files: `test_<component>.py`
- Test classes: `Test<Feature>`
- Test functions: `test_<what_it_tests>`

### Example Test
```python
import pytest
from bahb.models.yolov12 import YOLOv12Detector

class TestMyFeature:
    """Test my new feature."""

    @pytest.mark.unit
    def test_basic_functionality(self, sample_image, mock_config):
        """Test basic functionality."""
        detector = YOLOv12Detector(mock_config)
        # Test implementation
        assert detector is not None

    @pytest.mark.integration
    @pytest.mark.slow
    def test_integration_feature(self, sample_video):
        """Test integration with other components."""
        # Integration test implementation
        pass
```

### Using Markers
```python
@pytest.mark.unit          # Fast unit test
@pytest.mark.integration   # Integration test
@pytest.mark.gpu           # Requires GPU
@pytest.mark.slow          # Takes > 1 second
@pytest.mark.benchmark     # Performance benchmark
```

## Test Data

### Adding Test Images
Place test images in `test_data/images/`:
```bash
tests/test_data/images/
├── transformer_01.jpg
├── insulator_defect.jpg
└── thermal_hotspot.jpg
```

### Adding Expected Results
Place expected detection results in `test_data/expected/`:
```json
{
  "detections": [
    {
      "class_id": 0,
      "class_name": "transformer",
      "confidence": 0.92,
      "bbox": [150, 150, 350, 350]
    }
  ]
}
```

## Continuous Integration

### GitHub Actions
```yaml
- name: Run tests
  run: |
    pytest tests/ -m "not gpu and not slow"
```

### Pre-commit Hook
```bash
#!/bin/bash
pytest tests/ -m unit -x
```

## Coverage

Generate coverage report:
```bash
pytest tests/ --cov=bahb --cov-report=html
```

View report:
```bash
open htmlcov/index.html
```

## Benchmarking

Run only benchmark tests:
```bash
pytest tests/ -m benchmark -v
```

Save benchmark results:
```bash
pytest tests/ -m benchmark --benchmark-json=benchmark_results.json
```

## Troubleshooting

### Tests Fail Due to Missing Dependencies
```bash
pip install -r requirements.txt
```

### GPU Tests Fail
- Ensure CUDA is available
- Check GPU memory
- Run CPU tests only: `pytest tests/ -m "not gpu"`

### Slow Tests Timeout
- Increase timeout: `pytest tests/ --timeout=600`
- Skip slow tests: `pytest tests/ -m "not slow"`

### Import Errors
```bash
# Install package in development mode
pip install -e .
```

## Performance Targets

### Inference Speed
- **Target Latency**: < 50ms per frame (640x640)
- **Target FPS**: > 20 FPS on Jetson Orin NX
- **Batch Processing**: > 30 FPS for batch size 4

### Memory Usage
- **Peak Memory**: < 4GB on Orin NX 16GB
- **Stable Operation**: No memory leaks over 1000 frames

### Accuracy (with real data)
- **Detection mAP**: > 0.85
- **Thermal Correlation**: > 90% accuracy

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure all tests pass: `pytest tests/`
3. Add appropriate markers (@pytest.mark.*)
4. Update this README if needed
5. Maintain >80% code coverage

## License

Copyright (c) 2026 BAHB Project
