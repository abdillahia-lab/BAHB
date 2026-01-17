# BAHB Test Data

This directory contains test data for BAHB integration tests.

## Directory Structure

```
test_data/
├── images/           # Sample infrastructure images
├── thermal/          # Sample thermal images
└── expected/         # Expected detection results
```

## Generating Test Data

### Using Training Data
Copy sample images from the training dataset:
```bash
# Copy a few sample images
cp /home/user/BAHB/data/processed/train/images/img_000001.jpg test_data/images/
cp /home/user/BAHB/data/processed/train/images/img_000002.jpg test_data/images/
cp /home/user/BAHB/data/processed/train/images/img_000003.jpg test_data/images/
```

### Creating Synthetic Test Images
Run the generate script:
```bash
python tests/generate_test_data.py
```

## Test Data Types

### Infrastructure Images (`images/`)
- **transformer_01.jpg**: Sample transformer image
- **insulator_01.jpg**: Sample insulator image
- **substation_wide.jpg**: Wide-angle substation view
- **datacenter_rack.jpg**: Server rack image

### Thermal Images (`thermal/`)
- **transformer_thermal.jpg**: Thermal image of transformer
- **hotspot_sample.jpg**: Sample with thermal hotspot
- **normal_thermal.jpg**: Normal operating temperature

### Expected Results (`expected/`)
JSON files with expected detection outputs:
- **transformer_01_expected.json**
- **insulator_01_expected.json**

## File Formats

### Expected Detection Format
```json
{
  "image": "transformer_01.jpg",
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

### Thermal Data Format
- Colorized images: Standard JPG/PNG
- Raw temperature data: NumPy .npy files (float32)

## Adding New Test Data

1. Add images to appropriate subdirectory
2. Create corresponding expected results JSON
3. Update test fixtures in `conftest.py` if needed
4. Reference in tests using fixtures

Example:
```python
def test_my_feature(self):
    img_path = TEST_DATA_DIR / "images" / "my_test_image.jpg"
    img = cv2.imread(str(img_path))
    # Test with image
```
