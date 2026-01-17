# BAHB Testing Guide

Complete guide for running and writing tests for the BAHB infrastructure inspection system.

## Quick Start

### 1. Install Test Dependencies
```bash
pip install -r tests/requirements-test.txt
```

### 2. Generate Test Data
```bash
python tests/generate_test_data.py
```

### 3. Run Tests
```bash
# All tests
pytest tests/

# Quick check (unit tests only)
./tests/run_tests.sh quick

# With coverage
./tests/run_tests.sh coverage
```

## Test Organization

### Test Files Structure
```
tests/
├── conftest.py                    # Shared fixtures and configuration
├── pytest.ini                     # Pytest settings
├── test_detection_pipeline.py     # 350+ lines, 30+ tests
├── test_deepstream_pipeline.py    # 400+ lines, 25+ tests
├── test_thermal_fusion.py         # 450+ lines, 35+ tests
├── test_camera_streams.py         # 380+ lines, 28+ tests
├── test_end_to_end.py            # 420+ lines, 22+ tests
└── test_data/                     # Sample data for tests
    ├── images/                    # 7 infrastructure images
    ├── thermal/                   # 2 thermal images + raw data
    └── expected/                  # 4 expected result files
```

### Total Test Coverage
- **~140 individual test functions**
- **~2000 lines of test code**
- **5 major test modules**
- **60+ pytest fixtures**

## Running Specific Tests

### By Category
```bash
# Unit tests (fast, no dependencies)
pytest tests/ -m unit

# Integration tests
pytest tests/ -m integration

# GPU tests (requires CUDA)
pytest tests/ -m gpu

# Performance benchmarks
pytest tests/ -m benchmark

# Skip slow tests
pytest tests/ -m "not slow"
```

### By File
```bash
# Detection pipeline tests
pytest tests/test_detection_pipeline.py

# Specific test class
pytest tests/test_detection_pipeline.py::TestYOLO26ModelLoading

# Specific test function
pytest tests/test_detection_pipeline.py::TestYOLO26ModelLoading::test_model_init_with_config
```

### By Pattern
```bash
# All tests with 'thermal' in name
pytest tests/ -k thermal

# All tests with 'inference' in name
pytest tests/ -k inference

# Multiple patterns (OR)
pytest tests/ -k "thermal or detection"
```

## Test Categories Breakdown

### 1. Detection Pipeline Tests (test_detection_pipeline.py)
**Purpose**: Test YOLO26 model loading, inference, and output processing

**Test Classes**:
- `TestYOLO26ModelLoading` (3 tests): Model initialization and loading
- `TestInference` (6 tests): Basic detection functionality
- `TestBatchProcessing` (2 tests): Batch inference capabilities
- `TestInferenceSpeed` (4 tests): Performance benchmarks
- `TestPreprocessing` (3 tests): Image preprocessing
- `TestPostprocessing` (2 tests): NMS and coordinate scaling
- `TestErrorHandling` (3 tests): Error cases
- `TestModelRegistry` (2 tests): Model management

**Total**: 30 tests

**Key Features**:
- Mock and real model support
- TensorRT engine testing
- Batch processing verification
- FPS benchmarking
- Output format validation

### 2. DeepStream Pipeline Tests (test_deepstream_pipeline.py)
**Purpose**: Test DeepStream integration and multi-stream processing

**Test Classes**:
- `TestDeepStreamConfig` (6 tests): Config file parsing
- `TestPipelineInitialization` (4 tests): Pipeline creation
- `TestMultiStreamProcessing` (2 tests): Dual-stream handling
- `TestTrackerIntegration` (2 tests): NvDCF tracker
- `TestOutputFormats` (2 tests): Metadata structures
- `TestPipelinePerformance` (3 tests): Performance testing
- `TestErrorHandling` (2 tests): Error recovery
- `TestRTSPStreaming` (2 tests): RTSP handling

**Total**: 25 tests

**Key Features**:
- Config validation
- GStreamer pipeline testing
- Tracker integration
- Zero-copy optimization checks
- RTSP stream handling

### 3. Thermal Fusion Tests (test_thermal_fusion.py)
**Purpose**: Test thermal analysis and visual-thermal fusion

**Test Classes**:
- `TestThermalImageProcessing` (4 tests): Thermal conversion
- `TestVisualThermalAlignment` (3 tests): Image registration
- `TestTemperatureExtraction` (3 tests): Temperature data
- `TestConfidenceBoostingLogic` (2 tests): Detection enhancement
- `TestEquipmentZoneThresholds` (4 tests): Equipment-specific zones
- `TestThermalTrendAnalysis` (3 tests): Time-series analysis
- `TestThermalOverlay` (2 tests): Visualization
- `TestThermalReporting` (2 tests): Report generation
- `TestEdgeCases` (4 tests): Error handling
- `TestGradientAnalysis` (2 tests): Thermal gradients

**Total**: 35 tests

**Key Features**:
- Hot/cold spot detection
- Equipment zone thresholds
- Temperature trend analysis
- Thermal-visual alignment
- Confidence boosting

### 4. Camera Stream Tests (test_camera_streams.py)
**Purpose**: Test camera streaming, RTSP, and frame synchronization

**Test Classes**:
- `TestRTSPConnection` (4 tests): RTSP connection handling
- `TestFrameCapture` (4 tests): Frame acquisition
- `TestStreamReconnection` (2 tests): Auto-reconnect
- `TestFrameSynchronization` (4 tests): Multi-camera sync
- `TestStreamStatistics` (3 tests): Stream monitoring
- `TestThermalStreamDecoding` (1 test): Thermal decoding
- `TestMultiCameraCoordination` (2 tests): H30T coordination
- `TestErrorHandling` (3 tests): Error cases
- `TestLowLatencyOptimization` (2 tests): Latency optimization

**Total**: 28 tests

**Key Features**:
- RTSP stream mocking
- Frame synchronization (< 50ms tolerance)
- Auto-reconnection logic
- Stream health monitoring
- H30T multi-sensor support

### 5. End-to-End Tests (test_end_to_end.py)
**Purpose**: Test complete pipeline from input to output

**Test Classes**:
- `TestFullPipelineWithVideo` (2 tests): Video processing
- `TestDetectionVerification` (2 tests): Result validation
- `TestAlertGeneration` (3 tests): Alert system
- `TestRecordingOutput` (2 tests): Video recording
- `TestPerformanceBenchmarks` (3 tests): E2E performance
- `TestCompleteInspectionWorkflow` (2 tests): Full workflow
- `TestReportGeneration` (2 tests): Report creation
- `TestErrorRecovery` (2 tests): Error handling
- `TestIntegrationWithRealModels` (2 tests): Real model testing

**Total**: 22 tests

**Key Features**:
- Complete video processing
- Alert generation
- Report creation
- Performance benchmarking
- Real-world scenario testing

## Test Fixtures

### Image Fixtures (from conftest.py)
- `sample_image`: 640x640 RGB test image
- `sample_thermal_image`: 640x512 colorized thermal
- `sample_thermal_raw`: Raw temperature data (float32)
- `sample_hires_image`: 4K test image (2160x4096)
- `batch_images`: Batch of 4 test images

### Mock Fixtures
- `mock_rtsp_stream`: Mocked VideoCapture
- `mock_h30t_streams`: Mocked H30T camera streams
- `mock_yolo_model`: Mocked YOLO detector
- `mock_config`: Mocked configuration object

### Data Fixtures
- `sample_detections`: 3 sample Detection objects
- `expected_detections_json`: Expected results file
- `temp_dir`: Temporary directory
- `output_dir`: Output directory for artifacts

### Configuration Fixtures
- `thermal_config`: ThermalAnalyzer config
- `deepstream_config_path`: DeepStream config file path

### Utility Fixtures
- `benchmark_context`: Performance timing
- `save_test_artifact`: Save debug images

## Performance Benchmarks

### Target Metrics
```
Detection (640x640):
  Average Latency: < 50ms
  Target FPS: > 20
  GPU Memory: < 2GB

Thermal Analysis:
  Average Latency: < 10ms
  Hot Spot Detection: < 5ms

End-to-End Pipeline:
  Total Latency: < 100ms
  Throughput: > 15 FPS
  Memory Usage: < 4GB
```

### Running Benchmarks
```bash
# Run all benchmarks
pytest tests/ -m benchmark -v

# Specific benchmark
pytest tests/test_detection_pipeline.py::TestInferenceSpeed -v

# Save results
pytest tests/ -m benchmark --benchmark-json=results.json
```

## Code Coverage

### Generate Coverage Report
```bash
pytest tests/ --cov=bahb --cov-report=html --cov-report=term
```

### View Report
```bash
open htmlcov/index.html
```

### Coverage Targets
- Overall: > 80%
- Core modules: > 90%
- Models: > 85%
- Thermal: > 90%

## Writing New Tests

### Test Template
```python
import pytest
from bahb.models.yolov12 import YOLOv12Detector

class TestMyFeature:
    """Test my new feature."""

    @pytest.mark.unit
    def test_basic_functionality(self, mock_config):
        """Test basic functionality."""
        # Arrange
        detector = YOLOv12Detector(mock_config)

        # Act
        result = detector.some_method()

        # Assert
        assert result is not None

    @pytest.mark.integration
    def test_integration(self, sample_image):
        """Test integration with other components."""
        # Integration test
        pass
```

### Best Practices
1. **Use descriptive test names**: `test_should_return_empty_list_when_no_detections`
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Use appropriate markers**: `@pytest.mark.unit`, `@pytest.mark.integration`
4. **Keep tests independent**: Each test should run in isolation
5. **Use fixtures**: Don't repeat setup code
6. **Test edge cases**: Empty inputs, invalid data, boundary conditions
7. **Mock external dependencies**: Network, filesystem, GPU when appropriate

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'

    - name: Install dependencies
      run: |
        pip install -r tests/requirements-test.txt

    - name: Generate test data
      run: python tests/generate_test_data.py

    - name: Run unit tests
      run: pytest tests/ -m "unit and not gpu" --cov=bahb

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## Troubleshooting

### Common Issues

**1. Import Errors**
```bash
# Solution: Install package in development mode
pip install -e .
```

**2. Missing Test Data**
```bash
# Solution: Generate test data
python tests/generate_test_data.py
```

**3. GPU Tests Fail**
```bash
# Solution: Skip GPU tests if no GPU available
pytest tests/ -m "not gpu"
```

**4. Slow Tests Timeout**
```bash
# Solution: Increase timeout or skip slow tests
pytest tests/ --timeout=600
pytest tests/ -m "not slow"
```

**5. Module Not Found: pytest**
```bash
# Solution: Install test requirements
pip install pytest pytest-cov pytest-mock
```

## Test Data Management

### Generating Fresh Test Data
```bash
# Remove old data
rm -rf tests/test_data/images/*
rm -rf tests/test_data/thermal/*
rm -rf tests/test_data/expected/*

# Generate new data
python tests/generate_test_data.py
```

### Using Real Data
```bash
# Copy real images from training set
cp data/processed/train/images/img_*.jpg tests/test_data/images/
```

## Debugging Tests

### Run with Debugger
```bash
# Drop into pdb on failure
pytest tests/ --pdb

# Drop into pdb on first failure
pytest tests/ -x --pdb
```

### Verbose Output
```bash
# Show print statements
pytest tests/ -v -s

# Show full tracebacks
pytest tests/ -v --tb=long
```

### Run Single Test with Details
```bash
pytest tests/test_detection_pipeline.py::test_inference_basic -vv -s
```

## Contributing Tests

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass: `pytest tests/`
3. Add appropriate markers
4. Update this guide if needed
5. Maintain > 80% coverage

## Additional Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [BAHB Architecture](../docs/architecture.md)
- [Model Documentation](../docs/models.md)
- [DeepStream Guide](https://docs.nvidia.com/metropolis/deepstream/)

## Contact

For questions about testing:
- Check test docstrings for detailed explanations
- Review conftest.py for available fixtures
- See README.md in tests/ directory
