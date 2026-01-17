#!/usr/bin/env python3
"""
Custom TensorRT INT8 Calibrator for YOLO models.
Implements IInt8EntropyCalibrator2 for optimal INT8 quantization.
"""

import os
import json
from pathlib import Path
from typing import List, Optional, Tuple
import numpy as np
import cv2
import tensorrt as trt
from tqdm import tqdm


class YOLOEntropyCalibrator(trt.IInt8EntropyCalibrator2):
    """
    INT8 Entropy Calibrator for YOLO models.
    Uses entropy calibration (v2) which is recommended for CNN-based models.
    """

    def __init__(
        self,
        calibration_images: List[str],
        cache_file: str,
        batch_size: int = 8,
        input_shape: Tuple[int, int, int] = (3, 640, 640),
        preprocess_func=None
    ):
        """
        Initialize calibrator.

        Args:
            calibration_images: List of image paths for calibration
            cache_file: Path to save/load calibration cache
            batch_size: Batch size for calibration
            input_shape: Model input shape (C, H, W)
            preprocess_func: Optional custom preprocessing function
        """
        super().__init__()

        self.calibration_images = calibration_images
        self.cache_file = cache_file
        self.batch_size = batch_size
        self.input_shape = input_shape
        self.preprocess_func = preprocess_func or self.default_preprocess

        # Calculate total batches
        self.num_images = len(calibration_images)
        self.num_batches = (self.num_images + batch_size - 1) // batch_size
        self.current_batch = 0

        # Allocate device memory for batch
        self.device_input = None
        self.batch_data = None

        print(f"Calibrator initialized:")
        print(f"  Images: {self.num_images}")
        print(f"  Batch size: {self.batch_size}")
        print(f"  Total batches: {self.num_batches}")
        print(f"  Input shape: {input_shape}")
        print(f"  Cache file: {cache_file}")

    def default_preprocess(self, image_path: str) -> np.ndarray:
        """
        Default YOLO preprocessing.

        Args:
            image_path: Path to image file

        Returns:
            Preprocessed image tensor (C, H, W)
        """
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to read image: {image_path}")

        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Resize to input shape
        h, w = self.input_shape[1], self.input_shape[2]
        img = cv2.resize(img, (w, h), interpolation=cv2.INTER_LINEAR)

        # Normalize to [0, 1]
        img = img.astype(np.float32) / 255.0

        # Transpose to CHW format
        img = np.transpose(img, (2, 0, 1))

        return img

    def letterbox_preprocess(self, image_path: str) -> np.ndarray:
        """
        Letterbox preprocessing (maintains aspect ratio).

        Args:
            image_path: Path to image file

        Returns:
            Preprocessed image tensor (C, H, W)
        """
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to read image: {image_path}")

        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Letterbox resize
        h, w = self.input_shape[1], self.input_shape[2]
        img_h, img_w = img.shape[:2]

        # Calculate scale
        scale = min(w / img_w, h / img_h)
        new_w = int(img_w * scale)
        new_h = int(img_h * scale)

        # Resize
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        # Create padded image
        padded = np.full((h, w, 3), 114, dtype=np.uint8)

        # Calculate padding
        pad_w = (w - new_w) // 2
        pad_h = (h - new_h) // 2

        # Place resized image
        padded[pad_h:pad_h+new_h, pad_w:pad_w+new_w] = img

        # Normalize
        padded = padded.astype(np.float32) / 255.0

        # Transpose to CHW
        padded = np.transpose(padded, (2, 0, 1))

        return padded

    def load_batch(self) -> Optional[np.ndarray]:
        """
        Load next batch of images.

        Returns:
            Batch of preprocessed images or None if no more batches
        """
        if self.current_batch >= self.num_batches:
            return None

        # Calculate batch range
        start_idx = self.current_batch * self.batch_size
        end_idx = min(start_idx + self.batch_size, self.num_images)
        batch_images = self.calibration_images[start_idx:end_idx]

        # Load and preprocess images
        batch_data = []

        for img_path in batch_images:
            try:
                img = self.preprocess_func(img_path)
                batch_data.append(img)
            except Exception as e:
                print(f"Warning: Failed to process {img_path}: {e}")
                # Use a blank image as fallback
                img = np.zeros(self.input_shape, dtype=np.float32)
                batch_data.append(img)

        # Pad batch if needed
        while len(batch_data) < self.batch_size:
            batch_data.append(np.zeros(self.input_shape, dtype=np.float32))

        # Stack into batch
        batch = np.stack(batch_data, axis=0)

        self.current_batch += 1

        return batch

    def get_batch_size(self) -> int:
        """Return the batch size."""
        return self.batch_size

    def get_batch(self, names: List[str]) -> Optional[List[int]]:
        """
        Get next batch for calibration.

        Args:
            names: Names of network inputs

        Returns:
            List of device memory pointers or None if no more batches
        """
        batch = self.load_batch()

        if batch is None:
            return None

        # Allocate device memory on first call
        if self.device_input is None:
            import pycuda.driver as cuda
            import pycuda.autoinit

            self.device_input = cuda.mem_alloc(batch.nbytes)

        # Copy batch to device
        import pycuda.driver as cuda
        cuda.memcpy_htod(self.device_input, np.ascontiguousarray(batch))

        # Show progress
        print(f"Calibration progress: {self.current_batch}/{self.num_batches} batches", end='\r')

        return [int(self.device_input)]

    def read_calibration_cache(self) -> Optional[bytes]:
        """
        Read calibration cache from file.

        Returns:
            Cached calibration data or None if cache doesn't exist
        """
        if os.path.exists(self.cache_file):
            print(f"Reading calibration cache from {self.cache_file}")
            with open(self.cache_file, 'rb') as f:
                return f.read()
        return None

    def write_calibration_cache(self, cache: bytes):
        """
        Write calibration cache to file.

        Args:
            cache: Calibration cache data
        """
        cache_dir = os.path.dirname(self.cache_file)
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)

        with open(self.cache_file, 'wb') as f:
            f.write(cache)

        print(f"\nCalibration cache saved to {self.cache_file}")


class MinMaxCalibrator(trt.IInt8MinMaxCalibrator):
    """
    MinMax calibrator - uses min/max statistics.
    Faster but may be less accurate than entropy calibration.
    """

    def __init__(
        self,
        calibration_images: List[str],
        cache_file: str,
        batch_size: int = 8,
        input_shape: Tuple[int, int, int] = (3, 640, 640),
        preprocess_func=None
    ):
        super().__init__()

        # Reuse YOLOEntropyCalibrator implementation
        self._impl = YOLOEntropyCalibrator(
            calibration_images,
            cache_file,
            batch_size,
            input_shape,
            preprocess_func
        )

    def get_batch_size(self) -> int:
        return self._impl.get_batch_size()

    def get_batch(self, names: List[str]) -> Optional[List[int]]:
        return self._impl.get_batch(names)

    def read_calibration_cache(self) -> Optional[bytes]:
        return self._impl.read_calibration_cache()

    def write_calibration_cache(self, cache: bytes):
        return self._impl.write_calibration_cache(cache)


def create_calibrator(
    manifest_file: str,
    cache_file: str,
    batch_size: int = 8,
    input_shape: Tuple[int, int, int] = (3, 640, 640),
    calibrator_type: str = 'entropy',
    use_letterbox: bool = False
) -> trt.IInt8Calibrator:
    """
    Create calibrator from manifest file.

    Args:
        manifest_file: Path to calibration manifest JSON
        cache_file: Path to calibration cache file
        batch_size: Batch size for calibration
        input_shape: Model input shape (C, H, W)
        calibrator_type: Type of calibrator ('entropy' or 'minmax')
        use_letterbox: Use letterbox preprocessing

    Returns:
        TensorRT calibrator instance
    """
    # Load manifest
    with open(manifest_file, 'r') as f:
        manifest = json.load(f)

    calibration_images = manifest['images']

    print(f"Creating {calibrator_type} calibrator...")
    print(f"Loaded {len(calibration_images)} calibration images from manifest")

    # Select calibrator class
    if calibrator_type.lower() == 'entropy':
        calibrator_class = YOLOEntropyCalibrator
    elif calibrator_type.lower() == 'minmax':
        calibrator_class = MinMaxCalibrator
    else:
        raise ValueError(f"Unknown calibrator type: {calibrator_type}")

    # Create calibrator instance
    calibrator = calibrator_class(
        calibration_images=calibration_images,
        cache_file=cache_file,
        batch_size=batch_size,
        input_shape=input_shape,
        preprocess_func=None  # Will use default or letterbox based on flag
    )

    # Override preprocess function if letterbox requested
    if use_letterbox and hasattr(calibrator, '_impl'):
        calibrator._impl.preprocess_func = calibrator._impl.letterbox_preprocess
    elif use_letterbox:
        calibrator.preprocess_func = calibrator.letterbox_preprocess

    return calibrator


def test_calibrator():
    """Test calibrator with sample data."""
    print("Testing calibrator...")

    # Create dummy calibration data
    import tempfile

    with tempfile.TemporaryDirectory() as tmpdir:
        # Create sample images
        sample_images = []
        for i in range(10):
            img_path = os.path.join(tmpdir, f"test_{i}.jpg")
            img = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
            cv2.imwrite(img_path, img)
            sample_images.append(img_path)

        # Create manifest
        manifest_path = os.path.join(tmpdir, "manifest.json")
        with open(manifest_path, 'w') as f:
            json.dump({'images': sample_images}, f)

        # Create calibrator
        cache_path = os.path.join(tmpdir, "calibration.cache")
        calibrator = create_calibrator(
            manifest_file=manifest_path,
            cache_file=cache_path,
            batch_size=4,
            input_shape=(3, 640, 640),
            calibrator_type='entropy'
        )

        # Simulate calibration
        batch_idx = 0
        while True:
            batch = calibrator.get_batch(['images'])
            if batch is None:
                break
            batch_idx += 1
            print(f"Processed batch {batch_idx}")

        print("Calibrator test passed!")


if __name__ == '__main__':
    test_calibrator()
