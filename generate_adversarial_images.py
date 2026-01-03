#!/usr/bin/env python3
"""
Adversarial Image Generator for Infrastructure Detection Model Testing

This script generates challenging augmented images to stress-test and potentially
confuse the infrastructure detection model. Techniques include:

1. Weather effects (fog, rain, snow, haze)
2. Lighting extremes (night, overexposure, harsh shadows)
3. Motion and camera blur
4. Occlusion and partial visibility
5. Noise and compression artifacts
6. Perspective distortions
7. Color/texture confusion patterns
8. Adversarial patches (confusing backgrounds)
"""

import os
import cv2
import numpy as np
from pathlib import Path
import random
import shutil

# Try to import albumentations, fall back to basic OpenCV if not available
try:
    import albumentations as A
    HAS_ALBUMENTATIONS = True
except ImportError:
    HAS_ALBUMENTATIONS = False
    print("Warning: albumentations not installed. Using basic OpenCV augmentations.")


class AdversarialImageGenerator:
    """Generate challenging images to test model robustness."""

    def __init__(self, output_dir: str = "adversarial_test_images"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Create subdirectories for different challenge types
        self.challenge_types = [
            'weather', 'lighting', 'blur', 'occlusion',
            'noise', 'perspective', 'color_shift', 'combined'
        ]
        for challenge in self.challenge_types:
            (self.output_dir / challenge).mkdir(exist_ok=True)

    # ============= WEATHER EFFECTS =============
    def add_fog(self, image: np.ndarray, intensity: float = 0.5) -> np.ndarray:
        """Add realistic fog effect."""
        fog_layer = np.ones_like(image, dtype=np.float32) * 255
        # Create varying fog density
        h, w = image.shape[:2]
        gradient = np.linspace(0.3, 1.0, h).reshape(-1, 1)
        gradient = np.tile(gradient, (1, w))
        gradient = np.stack([gradient] * 3, axis=-1)

        fog_layer = (fog_layer * gradient * intensity).astype(np.float32)
        image_float = image.astype(np.float32)
        result = image_float * (1 - intensity * 0.7) + fog_layer * intensity * 0.7
        return np.clip(result, 0, 255).astype(np.uint8)

    def add_rain(self, image: np.ndarray, intensity: float = 0.5) -> np.ndarray:
        """Add rain streaks effect."""
        h, w = image.shape[:2]
        rain_layer = np.zeros((h, w), dtype=np.uint8)

        # Create rain streaks
        num_drops = int(intensity * 500)
        for _ in range(num_drops):
            x = random.randint(0, w - 1)
            y = random.randint(0, h - 1)
            length = random.randint(10, 30)
            thickness = 1
            # Rain falls at an angle
            angle = random.uniform(-0.2, 0.2)
            x2 = int(x + length * angle)
            y2 = min(h - 1, y + length)
            cv2.line(rain_layer, (x, y), (x2, y2), 200, thickness)

        # Blur the rain slightly
        rain_layer = cv2.GaussianBlur(rain_layer, (3, 3), 0)

        # Darken the image slightly (rain = overcast)
        darkened = cv2.addWeighted(image, 0.85, np.zeros_like(image), 0, 0)

        # Add rain layer
        rain_layer = cv2.cvtColor(rain_layer, cv2.COLOR_GRAY2BGR)
        result = cv2.add(darkened, rain_layer)
        return result

    def add_snow(self, image: np.ndarray, intensity: float = 0.5) -> np.ndarray:
        """Add snow effect."""
        h, w = image.shape[:2]
        snow_layer = np.zeros((h, w), dtype=np.uint8)

        num_flakes = int(intensity * 1000)
        for _ in range(num_flakes):
            x = random.randint(0, w - 1)
            y = random.randint(0, h - 1)
            radius = random.randint(1, 3)
            cv2.circle(snow_layer, (x, y), radius, 255, -1)

        snow_layer = cv2.GaussianBlur(snow_layer, (5, 5), 0)
        snow_layer = cv2.cvtColor(snow_layer, cv2.COLOR_GRAY2BGR)

        # Brighten image slightly for snow conditions
        brightened = cv2.addWeighted(image, 1.1, np.ones_like(image) * 30, 0.1, 0)
        result = cv2.add(brightened, snow_layer)
        return np.clip(result, 0, 255).astype(np.uint8)

    # ============= LIGHTING EFFECTS =============
    def simulate_night(self, image: np.ndarray, darkness: float = 0.7) -> np.ndarray:
        """Simulate nighttime/low-light conditions."""
        # Reduce brightness significantly
        dark = cv2.addWeighted(image, 1 - darkness, np.zeros_like(image), 0, 0)

        # Add noise typical of low-light cameras
        noise = np.random.normal(0, 15, image.shape).astype(np.float32)
        result = dark.astype(np.float32) + noise

        # Shift color slightly blue (night sky reflection)
        result[:, :, 0] = result[:, :, 0] * 1.1  # Increase blue
        result[:, :, 2] = result[:, :, 2] * 0.9  # Decrease red

        return np.clip(result, 0, 255).astype(np.uint8)

    def simulate_overexposure(self, image: np.ndarray, intensity: float = 0.5) -> np.ndarray:
        """Simulate overexposed/washed out conditions."""
        # Increase brightness and reduce contrast
        bright = cv2.addWeighted(image, 1.0 + intensity,
                                  np.ones_like(image) * 50, intensity, 0)
        # Reduce saturation
        hsv = cv2.cvtColor(bright, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = hsv[:, :, 1] * (1 - intensity * 0.5)
        result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        return np.clip(result, 0, 255).astype(np.uint8)

    def add_harsh_shadows(self, image: np.ndarray) -> np.ndarray:
        """Add harsh shadow patterns that might confuse detection."""
        h, w = image.shape[:2]
        shadow_mask = np.ones((h, w), dtype=np.float32)

        # Create random diagonal shadow bands
        num_shadows = random.randint(2, 5)
        for _ in range(num_shadows):
            angle = random.uniform(-45, 45)
            width = random.randint(50, 150)
            start_x = random.randint(-w, w)

            for y in range(h):
                x_offset = int(y * np.tan(np.radians(angle)))
                x1 = max(0, start_x + x_offset)
                x2 = min(w, x1 + width)
                shadow_mask[y, x1:x2] *= 0.4

        shadow_mask = cv2.GaussianBlur(shadow_mask, (21, 21), 0)
        shadow_mask = np.stack([shadow_mask] * 3, axis=-1)
        result = (image.astype(np.float32) * shadow_mask).astype(np.uint8)
        return result

    # ============= BLUR EFFECTS =============
    def add_motion_blur(self, image: np.ndarray, kernel_size: int = 15) -> np.ndarray:
        """Add motion blur simulating camera/subject movement."""
        kernel = np.zeros((kernel_size, kernel_size))
        angle = random.uniform(0, 180)
        kernel[kernel_size // 2, :] = 1

        # Rotate kernel for angled motion blur
        M = cv2.getRotationMatrix2D((kernel_size / 2, kernel_size / 2), angle, 1)
        kernel = cv2.warpAffine(kernel, M, (kernel_size, kernel_size))
        kernel = kernel / kernel.sum()

        return cv2.filter2D(image, -1, kernel)

    def add_defocus_blur(self, image: np.ndarray, intensity: int = 15) -> np.ndarray:
        """Add defocus/out-of-focus blur."""
        return cv2.GaussianBlur(image, (intensity * 2 + 1, intensity * 2 + 1), 0)

    # ============= OCCLUSION EFFECTS =============
    def add_random_occlusion(self, image: np.ndarray, coverage: float = 0.3) -> np.ndarray:
        """Add random occlusion blocks simulating obstacles."""
        h, w = image.shape[:2]
        result = image.copy()

        num_blocks = int(coverage * 10)
        for _ in range(num_blocks):
            block_w = random.randint(w // 10, w // 4)
            block_h = random.randint(h // 10, h // 4)
            x = random.randint(0, w - block_w)
            y = random.randint(0, h - block_h)

            # Fill with random color or pattern
            if random.random() > 0.5:
                color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
                cv2.rectangle(result, (x, y), (x + block_w, y + block_h), color, -1)
            else:
                # Use noise pattern
                noise = np.random.randint(0, 255, (block_h, block_w, 3), dtype=np.uint8)
                result[y:y+block_h, x:x+block_w] = noise

        return result

    def add_grid_overlay(self, image: np.ndarray, grid_size: int = 50) -> np.ndarray:
        """Add grid pattern that might interfere with detection."""
        h, w = image.shape[:2]
        result = image.copy()

        # Draw grid lines
        for x in range(0, w, grid_size):
            cv2.line(result, (x, 0), (x, h), (0, 0, 0), 2)
        for y in range(0, h, grid_size):
            cv2.line(result, (0, y), (w, y), (0, 0, 0), 2)

        return result

    # ============= NOISE EFFECTS =============
    def add_gaussian_noise(self, image: np.ndarray, sigma: float = 30) -> np.ndarray:
        """Add Gaussian noise."""
        noise = np.random.normal(0, sigma, image.shape).astype(np.float32)
        result = image.astype(np.float32) + noise
        return np.clip(result, 0, 255).astype(np.uint8)

    def add_salt_pepper_noise(self, image: np.ndarray, amount: float = 0.05) -> np.ndarray:
        """Add salt and pepper noise."""
        result = image.copy()
        h, w = image.shape[:2]

        # Salt
        num_salt = int(amount * h * w)
        coords = [np.random.randint(0, i - 1, num_salt) for i in (h, w)]
        result[coords[0], coords[1]] = 255

        # Pepper
        num_pepper = int(amount * h * w)
        coords = [np.random.randint(0, i - 1, num_pepper) for i in (h, w)]
        result[coords[0], coords[1]] = 0

        return result

    def add_jpeg_artifacts(self, image: np.ndarray, quality: int = 10) -> np.ndarray:
        """Add JPEG compression artifacts."""
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        _, encoded = cv2.imencode('.jpg', image, encode_param)
        return cv2.imdecode(encoded, cv2.IMREAD_COLOR)

    # ============= PERSPECTIVE EFFECTS =============
    def random_perspective(self, image: np.ndarray, intensity: float = 0.2) -> np.ndarray:
        """Apply random perspective transformation."""
        h, w = image.shape[:2]

        # Define source points (corners)
        src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])

        # Add random offsets to destination points
        offset = int(min(h, w) * intensity)
        dst = np.float32([
            [random.randint(0, offset), random.randint(0, offset)],
            [w - random.randint(0, offset), random.randint(0, offset)],
            [w - random.randint(0, offset), h - random.randint(0, offset)],
            [random.randint(0, offset), h - random.randint(0, offset)]
        ])

        M = cv2.getPerspectiveTransform(src, dst)
        return cv2.warpPerspective(image, M, (w, h))

    # ============= COLOR CONFUSION =============
    def shift_hue(self, image: np.ndarray, shift: int = 30) -> np.ndarray:
        """Shift hue to create unusual color combinations."""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        hsv[:, :, 0] = (hsv[:, :, 0].astype(int) + shift) % 180
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    def invert_colors(self, image: np.ndarray) -> np.ndarray:
        """Invert colors (negative)."""
        return 255 - image

    def reduce_colors(self, image: np.ndarray, levels: int = 4) -> np.ndarray:
        """Posterize - reduce color levels."""
        divisor = 256 // levels
        return (image // divisor) * divisor

    # ============= COMBINED STRESS TEST =============
    def extreme_stress_test(self, image: np.ndarray) -> np.ndarray:
        """Apply multiple challenging augmentations."""
        result = image.copy()

        # Apply random combination
        augmentations = [
            lambda img: self.add_fog(img, random.uniform(0.3, 0.7)),
            lambda img: self.simulate_night(img, random.uniform(0.5, 0.8)),
            lambda img: self.add_motion_blur(img, random.randint(10, 25)),
            lambda img: self.add_gaussian_noise(img, random.uniform(20, 50)),
            lambda img: self.add_random_occlusion(img, random.uniform(0.1, 0.3)),
            lambda img: self.random_perspective(img, random.uniform(0.1, 0.3)),
        ]

        # Apply 2-4 random augmentations
        num_augs = random.randint(2, 4)
        selected = random.sample(augmentations, num_augs)

        for aug in selected:
            result = aug(result)

        return result

    def generate_all_variants(self, image: np.ndarray, base_name: str):
        """Generate all adversarial variants of an image."""
        variants = {}

        # Weather
        variants['weather/fog_light'] = self.add_fog(image, 0.3)
        variants['weather/fog_heavy'] = self.add_fog(image, 0.7)
        variants['weather/rain'] = self.add_rain(image, 0.6)
        variants['weather/snow'] = self.add_snow(image, 0.5)

        # Lighting
        variants['lighting/night'] = self.simulate_night(image, 0.7)
        variants['lighting/overexposed'] = self.simulate_overexposure(image, 0.6)
        variants['lighting/harsh_shadows'] = self.add_harsh_shadows(image)

        # Blur
        variants['blur/motion'] = self.add_motion_blur(image, 20)
        variants['blur/defocus'] = self.add_defocus_blur(image, 10)

        # Occlusion
        variants['occlusion/random_blocks'] = self.add_random_occlusion(image, 0.25)
        variants['occlusion/grid'] = self.add_grid_overlay(image, 40)

        # Noise
        variants['noise/gaussian'] = self.add_gaussian_noise(image, 40)
        variants['noise/salt_pepper'] = self.add_salt_pepper_noise(image, 0.05)
        variants['noise/jpeg_artifacts'] = self.add_jpeg_artifacts(image, 15)

        # Perspective
        variants['perspective/distorted'] = self.random_perspective(image, 0.25)

        # Color
        variants['color_shift/hue_shift'] = self.shift_hue(image, 60)
        variants['color_shift/inverted'] = self.invert_colors(image)
        variants['color_shift/posterized'] = self.reduce_colors(image, 4)

        # Combined stress tests
        for i in range(3):
            variants[f'combined/stress_test_{i+1}'] = self.extreme_stress_test(image)

        # Save all variants
        for variant_path, variant_img in variants.items():
            save_path = self.output_dir / f"{variant_path}_{base_name}"
            save_path.parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(save_path), variant_img)

        return len(variants)


def process_images(input_dir: str, output_dir: str, num_images: int = 20):
    """Process a sample of images and generate adversarial variants."""
    generator = AdversarialImageGenerator(output_dir)

    input_path = Path(input_dir)
    images = list(input_path.glob("*.jpg")) + list(input_path.glob("*.png"))

    if len(images) == 0:
        print(f"No images found in {input_dir}")
        return

    # Sample random images
    sample = random.sample(images, min(num_images, len(images)))

    total_generated = 0
    for img_path in sample:
        print(f"Processing: {img_path.name}")
        image = cv2.imread(str(img_path))
        if image is None:
            continue

        count = generator.generate_all_variants(image, img_path.name)
        total_generated += count
        print(f"  Generated {count} variants")

    print(f"\nTotal adversarial images generated: {total_generated}")
    print(f"Output directory: {output_dir}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate adversarial test images")
    parser.add_argument("--input", "-i", default="/home/user/BAHB/data/processed/val/images",
                        help="Input image directory")
    parser.add_argument("--output", "-o", default="/home/user/BAHB/adversarial_test_images",
                        help="Output directory for adversarial images")
    parser.add_argument("--num", "-n", type=int, default=20,
                        help="Number of source images to process")

    args = parser.parse_args()

    print("=" * 60)
    print("ADVERSARIAL IMAGE GENERATOR")
    print("Generating challenging images to stress-test the model")
    print("=" * 60)

    process_images(args.input, args.output, args.num)
