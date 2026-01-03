#!/usr/bin/env python3
"""
Generate confusion/hard negative images to stress test the infrastructure detection model.
Creates images that look similar to power infrastructure but aren't, forcing the model
to learn better discrimination.
"""

import os
import cv2
import numpy as np
from pathlib import Path
import random


class ConfusionImageGenerator:
    """Generate images designed to confuse the infrastructure detection model."""

    def __init__(self, output_dir: str = "confusion_images"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def create_random_lines(self, width: int = 640, height: int = 640) -> np.ndarray:
        """Create random line patterns that might look like power lines."""
        img = np.random.randint(150, 220, (height, width, 3), dtype=np.uint8)

        # Add random lines (like power lines)
        num_lines = random.randint(3, 8)
        for _ in range(num_lines):
            color = (random.randint(20, 80), random.randint(20, 80), random.randint(20, 80))
            thickness = random.randint(1, 3)
            y = random.randint(height // 4, 3 * height // 4)
            sag = random.randint(10, 50)  # Line sag

            pts = []
            for x in range(0, width, 20):
                # Create sagging line effect
                offset = int(sag * np.sin(np.pi * x / width))
                pts.append([x, y + offset])

            pts = np.array(pts, np.int32)
            cv2.polylines(img, [pts], False, color, thickness)

        return img

    def create_pole_like_structures(self, width: int = 640, height: int = 640) -> np.ndarray:
        """Create vertical structures that might look like utility poles."""
        # Sky-like gradient background
        img = np.zeros((height, width, 3), dtype=np.uint8)
        for y in range(height):
            blue = int(200 - 100 * y / height)
            img[y, :] = [blue + 50, blue + 30, blue]

        # Add random vertical structures
        num_poles = random.randint(2, 5)
        for _ in range(num_poles):
            x = random.randint(50, width - 50)
            pole_width = random.randint(5, 15)
            pole_color = (random.randint(40, 80), random.randint(30, 60), random.randint(20, 50))

            # Draw pole
            cv2.rectangle(img, (x, height // 3), (x + pole_width, height), pole_color, -1)

            # Add cross arms
            if random.random() > 0.3:
                arm_y = random.randint(height // 3, height // 2)
                arm_length = random.randint(30, 80)
                cv2.line(img, (x - arm_length, arm_y), (x + arm_length + pole_width, arm_y),
                         pole_color, random.randint(3, 8))

        return img

    def create_industrial_texture(self, width: int = 640, height: int = 640) -> np.ndarray:
        """Create industrial-looking textures (metal, rust, equipment)."""
        # Base metallic gray
        img = np.random.randint(100, 150, (height, width, 3), dtype=np.uint8)

        # Add rust-like patches
        for _ in range(random.randint(5, 15)):
            cx = random.randint(0, width)
            cy = random.randint(0, height)
            radius = random.randint(20, 80)
            rust_color = (random.randint(30, 80), random.randint(60, 120), random.randint(120, 180))
            cv2.circle(img, (cx, cy), radius, rust_color, -1)

        # Add bolt/rivet patterns
        for _ in range(random.randint(10, 30)):
            x = random.randint(0, width)
            y = random.randint(0, height)
            cv2.circle(img, (x, y), random.randint(3, 8), (60, 60, 60), -1)
            cv2.circle(img, (x, y), random.randint(1, 3), (120, 120, 120), -1)

        # Add structural lines
        for _ in range(random.randint(3, 8)):
            x1, y1 = random.randint(0, width), random.randint(0, height)
            x2, y2 = random.randint(0, width), random.randint(0, height)
            cv2.line(img, (x1, y1), (x2, y2), (80, 80, 80), random.randint(2, 5))

        return img

    def create_ceramic_texture(self, width: int = 640, height: int = 640) -> np.ndarray:
        """Create textures similar to ceramic insulators."""
        # White/cream base
        img = np.random.randint(200, 240, (height, width, 3), dtype=np.uint8)

        # Add disc-like patterns (like insulator discs)
        num_discs = random.randint(3, 8)
        disc_width = width // (num_discs + 1)

        for i in range(num_discs):
            x = (i + 1) * disc_width
            y = height // 2 + random.randint(-50, 50)

            # Draw multiple concentric ellipses
            for r in range(3, 40, 8):
                color_val = 180 - r * 2
                color = (color_val, color_val, color_val + 10)
                cv2.ellipse(img, (x, y), (r * 2, r), 0, 0, 360, color, 2)

        return img

    def create_wire_mesh(self, width: int = 640, height: int = 640) -> np.ndarray:
        """Create wire mesh/fence patterns that might confuse detection."""
        img = np.random.randint(80, 120, (height, width, 3), dtype=np.uint8)

        # Create mesh pattern
        spacing = random.randint(20, 40)
        wire_color = (40, 40, 40)

        for x in range(0, width, spacing):
            cv2.line(img, (x, 0), (x + random.randint(-20, 20), height), wire_color, 1)
        for y in range(0, height, spacing):
            cv2.line(img, (0, y), (width, y + random.randint(-20, 20)), wire_color, 1)

        return img

    def create_tree_branches(self, width: int = 640, height: int = 640) -> np.ndarray:
        """Create tree branch patterns that might look like power lines."""
        # Sky background
        img = np.zeros((height, width, 3), dtype=np.uint8)
        for y in range(height):
            blue = int(180 - 50 * y / height)
            img[y, :] = [blue + 40, blue + 20, blue]

        def draw_branch(img, x, y, angle, length, thickness):
            if length < 5 or thickness < 1:
                return

            end_x = int(x + length * np.cos(angle))
            end_y = int(y + length * np.sin(angle))

            # Brown branch color with variation
            color = (random.randint(20, 50), random.randint(40, 80), random.randint(60, 100))
            cv2.line(img, (x, y), (end_x, end_y), color, int(thickness))

            # Recursively draw smaller branches
            if random.random() > 0.3:
                new_angle = angle + random.uniform(-0.5, 0.5)
                draw_branch(img, end_x, end_y, new_angle, length * 0.7, thickness * 0.7)
            if random.random() > 0.4:
                new_angle = angle + random.uniform(0.3, 0.8) * (1 if random.random() > 0.5 else -1)
                draw_branch(img, end_x, end_y, new_angle, length * 0.5, thickness * 0.6)

        # Draw several main branches
        for _ in range(random.randint(2, 4)):
            start_x = random.randint(width // 4, 3 * width // 4)
            angle = random.uniform(-2.5, -0.5)  # Pointing upward
            draw_branch(img, start_x, height, angle, random.randint(150, 300), random.randint(8, 15))

        return img

    def create_antenna_structure(self, width: int = 640, height: int = 640) -> np.ndarray:
        """Create antenna/tower structures."""
        img = np.zeros((height, width, 3), dtype=np.uint8)

        # Sky gradient
        for y in range(height):
            val = int(200 - 80 * y / height)
            img[y, :] = [val + 20, val, val - 20]

        # Draw tower structure
        tower_x = width // 2
        tower_color = (80, 80, 80)

        # Main vertical supports
        base_width = 100
        top_width = 20

        for y in range(height - 50, 50, -20):
            progress = (height - 50 - y) / (height - 100)
            current_width = int(base_width - (base_width - top_width) * progress)

            # Horizontal beam
            cv2.line(img, (tower_x - current_width // 2, y),
                     (tower_x + current_width // 2, y), tower_color, 2)

            # Diagonal supports
            if y < height - 70:
                cv2.line(img, (tower_x - current_width // 2, y),
                         (tower_x, y - 20), tower_color, 2)
                cv2.line(img, (tower_x + current_width // 2, y),
                         (tower_x, y - 20), tower_color, 2)

        # Vertical supports
        cv2.line(img, (tower_x - base_width // 2, height - 50),
                 (tower_x - top_width // 2, 50), tower_color, 3)
        cv2.line(img, (tower_x + base_width // 2, height - 50),
                 (tower_x + top_width // 2, 50), tower_color, 3)

        return img

    def generate_all(self, num_each: int = 20):
        """Generate all types of confusion images."""
        generators = [
            ("random_lines", self.create_random_lines),
            ("pole_structures", self.create_pole_like_structures),
            ("industrial", self.create_industrial_texture),
            ("ceramic", self.create_ceramic_texture),
            ("wire_mesh", self.create_wire_mesh),
            ("tree_branches", self.create_tree_branches),
            ("antenna", self.create_antenna_structure),
        ]

        total = 0
        for name, gen_func in generators:
            category_dir = self.output_dir / name
            category_dir.mkdir(exist_ok=True)

            for i in range(num_each):
                img = gen_func()
                save_path = category_dir / f"{name}_{i:04d}.jpg"
                cv2.imwrite(str(save_path), img)
                total += 1

            print(f"Generated {num_each} {name} images")

        print(f"\nTotal confusion images generated: {total}")
        return total


if __name__ == "__main__":
    print("=" * 60)
    print("CONFUSION IMAGE GENERATOR")
    print("Creating hard negative images to test model robustness")
    print("=" * 60)

    generator = ConfusionImageGenerator("/home/user/BAHB/confusion_images")
    generator.generate_all(num_each=15)

    print(f"\nOutput directory: /home/user/BAHB/confusion_images")
