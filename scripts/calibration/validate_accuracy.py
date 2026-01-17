#!/usr/bin/env python3
"""
Validate INT8 model accuracy against FP32 baseline.
Compares predictions and calculates mAP degradation.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict

import cv2
import numpy as np
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit
from tqdm import tqdm


class TensorRTInference:
    """TensorRT inference engine wrapper."""

    def __init__(self, engine_path: str):
        """Initialize TensorRT inference engine."""
        self.engine_path = engine_path

        # Load engine
        with open(engine_path, 'rb') as f:
            runtime = trt.Runtime(trt.Logger(trt.Logger.WARNING))
            self.engine = runtime.deserialize_cuda_engine(f.read())

        if self.engine is None:
            raise RuntimeError(f"Failed to load engine from {engine_path}")

        self.context = self.engine.create_execution_context()

        # Get input/output information
        self.input_name = self.engine.get_binding_name(0)
        self.output_names = []

        for i in range(self.engine.num_bindings):
            if not self.engine.binding_is_input(i):
                self.output_names.append(self.engine.get_binding_name(i))

        # Allocate buffers
        self.inputs = []
        self.outputs = []
        self.bindings = []

        for binding in range(self.engine.num_bindings):
            shape = self.engine.get_binding_shape(binding)
            size = trt.volume(shape)
            dtype = trt.nptype(self.engine.get_binding_dtype(binding))

            # Allocate host and device buffers
            host_mem = cuda.pagelocked_empty(size, dtype)
            device_mem = cuda.mem_alloc(host_mem.nbytes)

            self.bindings.append(int(device_mem))

            if self.engine.binding_is_input(binding):
                self.inputs.append({'host': host_mem, 'device': device_mem, 'shape': shape})
            else:
                self.outputs.append({'host': host_mem, 'device': device_mem, 'shape': shape})

        self.stream = cuda.Stream()

    def infer(self, image: np.ndarray) -> List[np.ndarray]:
        """
        Run inference on image.

        Args:
            image: Preprocessed image (CHW format)

        Returns:
            List of output tensors
        """
        # Copy input to device
        np.copyto(self.inputs[0]['host'], image.ravel())
        cuda.memcpy_htod_async(self.inputs[0]['device'], self.inputs[0]['host'], self.stream)

        # Run inference
        self.context.execute_async_v2(bindings=self.bindings, stream_handle=self.stream.handle)

        # Copy outputs back to host
        outputs = []
        for output_info in self.outputs:
            cuda.memcpy_dtoh_async(output_info['host'], output_info['device'], self.stream)
            outputs.append(output_info['host'].reshape(output_info['shape']))

        self.stream.synchronize()

        return outputs

    def __del__(self):
        """Cleanup resources."""
        if hasattr(self, 'stream'):
            del self.stream


class AccuracyValidator:
    """Validate INT8 model accuracy against baseline."""

    def __init__(
        self,
        fp32_engine: str,
        int8_engine: str,
        val_images_dir: str,
        val_labels_dir: str,
        input_size: Tuple[int, int] = (640, 640),
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45
    ):
        """Initialize validator."""
        self.fp32_engine = TensorRTInference(fp32_engine)
        self.int8_engine = TensorRTInference(int8_engine)
        self.val_images_dir = Path(val_images_dir)
        self.val_labels_dir = Path(val_labels_dir)
        self.input_size = input_size
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold

        # Class names
        self.class_names = [
            'power_line', 'power_pole', 'transmission_tower', 'insulator',
            'transformer', 'solar_panel', 'wind_turbine', 'substation',
            'utility_box', 'meter', 'cable', 'junction_box'
        ]

    def preprocess_image(self, image_path: str) -> Tuple[np.ndarray, Tuple[float, float]]:
        """
        Preprocess image for inference.

        Args:
            image_path: Path to image

        Returns:
            Preprocessed image and scale factors
        """
        # Read image
        img = cv2.imread(image_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        orig_h, orig_w = img.shape[:2]

        # Resize
        img = cv2.resize(img, self.input_size, interpolation=cv2.INTER_LINEAR)

        # Normalize
        img = img.astype(np.float32) / 255.0

        # CHW format
        img = np.transpose(img, (2, 0, 1))

        # Add batch dimension
        img = np.expand_dims(img, axis=0)

        # Calculate scale factors
        scale_x = self.input_size[0] / orig_w
        scale_y = self.input_size[1] / orig_h

        return img, (scale_x, scale_y)

    def postprocess_predictions(
        self,
        outputs: List[np.ndarray],
        scale: Tuple[float, float]
    ) -> np.ndarray:
        """
        Postprocess model outputs to get detections.

        Args:
            outputs: Model outputs
            scale: Scale factors (scale_x, scale_y)

        Returns:
            Detections array (N, 6) [x1, y1, x2, y2, conf, class]
        """
        # This is a simplified version - actual YOLO postprocessing may vary
        # Assuming output is [batch, num_detections, 6] where 6 = [x, y, w, h, conf, class]

        output = outputs[0]  # First output
        if len(output.shape) == 3:
            output = output[0]  # Remove batch dimension

        # Filter by confidence
        mask = output[:, 4] >= self.conf_threshold
        detections = output[mask]

        if len(detections) == 0:
            return np.array([])

        # Convert from xywh to xyxy
        boxes = detections[:, :4].copy()
        boxes[:, 0] = detections[:, 0] - detections[:, 2] / 2  # x1
        boxes[:, 1] = detections[:, 1] - detections[:, 3] / 2  # y1
        boxes[:, 2] = detections[:, 0] + detections[:, 2] / 2  # x2
        boxes[:, 3] = detections[:, 1] + detections[:, 3] / 2  # y2

        # Scale back to original image size
        boxes[:, [0, 2]] /= scale[0]
        boxes[:, [1, 3]] /= scale[1]

        # Combine boxes, confidence, and class
        result = np.hstack([
            boxes,
            detections[:, 4:5],  # confidence
            detections[:, 5:6]   # class
        ])

        # Apply NMS
        result = self.nms(result, self.iou_threshold)

        return result

    def nms(self, detections: np.ndarray, iou_threshold: float) -> np.ndarray:
        """
        Apply Non-Maximum Suppression.

        Args:
            detections: Detections (N, 6) [x1, y1, x2, y2, conf, class]
            iou_threshold: IoU threshold

        Returns:
            Filtered detections
        """
        if len(detections) == 0:
            return detections

        # Sort by confidence
        indices = np.argsort(detections[:, 4])[::-1]
        detections = detections[indices]

        keep = []

        while len(detections) > 0:
            # Keep highest confidence detection
            keep.append(detections[0])

            if len(detections) == 1:
                break

            # Calculate IoU with remaining detections
            ious = self.calculate_iou(detections[0:1], detections[1:])

            # Filter detections with IoU > threshold
            mask = ious[0] <= iou_threshold
            detections = detections[1:][mask]

        return np.array(keep)

    def calculate_iou(self, boxes1: np.ndarray, boxes2: np.ndarray) -> np.ndarray:
        """Calculate IoU between boxes."""
        # boxes: (N, 4) [x1, y1, x2, y2]

        area1 = (boxes1[:, 2] - boxes1[:, 0]) * (boxes1[:, 3] - boxes1[:, 1])
        area2 = (boxes2[:, 2] - boxes2[:, 0]) * (boxes2[:, 3] - boxes2[:, 1])

        # Intersection
        x1 = np.maximum(boxes1[:, 0:1], boxes2[:, 0:1].T)
        y1 = np.maximum(boxes1[:, 1:2], boxes2[:, 1:2].T)
        x2 = np.minimum(boxes1[:, 2:3], boxes2[:, 2:3].T)
        y2 = np.minimum(boxes1[:, 3:4], boxes2[:, 3:4].T)

        intersection = np.maximum(0, x2 - x1) * np.maximum(0, y2 - y1)

        # Union
        union = area1[:, None] + area2[None, :] - intersection

        # IoU
        iou = intersection / (union + 1e-6)

        return iou

    def calculate_ap(
        self,
        predictions: List[np.ndarray],
        ground_truths: List[np.ndarray],
        class_id: int
    ) -> float:
        """Calculate Average Precision for a class."""
        # Filter predictions and ground truths for this class
        class_preds = []
        class_gts = []

        for pred, gt in zip(predictions, ground_truths):
            if len(pred) > 0:
                class_pred = pred[pred[:, 5] == class_id]
                class_preds.append(class_pred)
            else:
                class_preds.append(np.array([]))

            if len(gt) > 0:
                class_gt = gt[gt[:, 5] == class_id]
                class_gts.append(class_gt)
            else:
                class_gts.append(np.array([]))

        # Calculate TP, FP, FN
        total_gt = sum(len(gt) for gt in class_gts)

        if total_gt == 0:
            return 0.0

        # Collect all predictions with image index
        all_preds = []
        for img_idx, pred in enumerate(class_preds):
            if len(pred) > 0:
                for p in pred:
                    all_preds.append((img_idx, p[4], p[:4]))  # (image_idx, confidence, box)

        if len(all_preds) == 0:
            return 0.0

        # Sort by confidence
        all_preds = sorted(all_preds, key=lambda x: x[1], reverse=True)

        # Calculate precision and recall at each threshold
        tp = 0
        fp = 0
        matched_gts = [set() for _ in range(len(class_gts))]

        precisions = []
        recalls = []

        for img_idx, conf, pred_box in all_preds:
            gt_boxes = class_gts[img_idx]

            if len(gt_boxes) == 0:
                fp += 1
            else:
                # Calculate IoU with ground truth boxes
                ious = self.calculate_iou(
                    pred_box.reshape(1, 4),
                    gt_boxes[:, :4]
                )[0]

                # Find best match
                best_iou_idx = np.argmax(ious)
                best_iou = ious[best_iou_idx]

                if best_iou >= 0.5 and best_iou_idx not in matched_gts[img_idx]:
                    tp += 1
                    matched_gts[img_idx].add(best_iou_idx)
                else:
                    fp += 1

            precision = tp / (tp + fp)
            recall = tp / total_gt

            precisions.append(precision)
            recalls.append(recall)

        # Calculate AP using 11-point interpolation
        ap = 0.0
        for t in np.linspace(0, 1, 11):
            # Find precisions at recall >= t
            precs = [p for p, r in zip(precisions, recalls) if r >= t]
            if len(precs) > 0:
                ap += max(precs) / 11

        return ap

    def validate(self, num_images: Optional[int] = None) -> Dict:
        """
        Run validation on both FP32 and INT8 models.

        Args:
            num_images: Number of images to validate (None = all)

        Returns:
            Validation results dictionary
        """
        print("="*80)
        print("Running Accuracy Validation")
        print("="*80)

        # Get validation images
        image_files = sorted(list(self.val_images_dir.glob('*.jpg')) +
                           list(self.val_images_dir.glob('*.png')))

        if num_images:
            image_files = image_files[:num_images]

        print(f"\nValidating on {len(image_files)} images...")

        # Run inference on both models
        fp32_predictions = []
        int8_predictions = []
        ground_truths = []

        for img_path in tqdm(image_files, desc="Running inference"):
            # Preprocess
            img, scale = self.preprocess_image(str(img_path))

            # FP32 inference
            fp32_output = self.fp32_engine.infer(img)
            fp32_pred = self.postprocess_predictions(fp32_output, scale)
            fp32_predictions.append(fp32_pred)

            # INT8 inference
            int8_output = self.int8_engine.infer(img)
            int8_pred = self.postprocess_predictions(int8_output, scale)
            int8_predictions.append(int8_pred)

            # Load ground truth
            label_path = self.val_labels_dir / f"{img_path.stem}.txt"
            if label_path.exists():
                with open(label_path, 'r') as f:
                    lines = f.readlines()

                gt = []
                for line in lines:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        # Convert YOLO format to xyxy
                        class_id = int(parts[0])
                        x_center = float(parts[1])
                        y_center = float(parts[2])
                        width = float(parts[3])
                        height = float(parts[4])

                        # Get original image size
                        orig_img = cv2.imread(str(img_path))
                        img_h, img_w = orig_img.shape[:2]

                        x1 = (x_center - width / 2) * img_w
                        y1 = (y_center - height / 2) * img_h
                        x2 = (x_center + width / 2) * img_w
                        y2 = (y_center + height / 2) * img_h

                        gt.append([x1, y1, x2, y2, 1.0, class_id])

                ground_truths.append(np.array(gt))
            else:
                ground_truths.append(np.array([]))

        # Calculate mAP for both models
        print("\nCalculating mAP...")

        fp32_aps = []
        int8_aps = []

        for class_id in range(len(self.class_names)):
            fp32_ap = self.calculate_ap(fp32_predictions, ground_truths, class_id)
            int8_ap = self.calculate_ap(int8_predictions, ground_truths, class_id)

            fp32_aps.append(fp32_ap)
            int8_aps.append(int8_ap)

        fp32_map = np.mean(fp32_aps)
        int8_map = np.mean(int8_aps)

        degradation = ((fp32_map - int8_map) / fp32_map) * 100 if fp32_map > 0 else 0

        # Compile results
        results = {
            'num_images': len(image_files),
            'fp32_map': fp32_map,
            'int8_map': int8_map,
            'map_degradation_percent': degradation,
            'per_class_results': []
        }

        print("\n" + "="*80)
        print("Validation Results")
        print("="*80)
        print(f"\nFP32 mAP: {fp32_map:.4f}")
        print(f"INT8 mAP: {int8_map:.4f}")
        print(f"Degradation: {degradation:.2f}%")

        print(f"\nPer-class AP:")
        for class_id, class_name in enumerate(self.class_names):
            fp32_ap = fp32_aps[class_id]
            int8_ap = int8_aps[class_id]
            class_degradation = ((fp32_ap - int8_ap) / fp32_ap * 100) if fp32_ap > 0 else 0

            print(f"  {class_name:20s}: FP32={fp32_ap:.4f}, INT8={int8_ap:.4f}, "
                  f"Degradation={class_degradation:+.2f}%")

            results['per_class_results'].append({
                'class_id': class_id,
                'class_name': class_name,
                'fp32_ap': fp32_ap,
                'int8_ap': int8_ap,
                'degradation_percent': class_degradation
            })

        # Identify problematic classes
        problematic = [r for r in results['per_class_results']
                      if abs(r['degradation_percent']) > 5.0]

        if problematic:
            print(f"\nProblematic classes (>5% degradation):")
            for r in problematic:
                print(f"  {r['class_name']}: {r['degradation_percent']:+.2f}%")

        return results


def main():
    parser = argparse.ArgumentParser(description="Validate INT8 model accuracy")
    parser.add_argument(
        '--fp32-engine',
        type=str,
        required=True,
        help='Path to FP32 TensorRT engine'
    )
    parser.add_argument(
        '--int8-engine',
        type=str,
        required=True,
        help='Path to INT8 TensorRT engine'
    )
    parser.add_argument(
        '--val-images',
        type=str,
        default='/home/user/BAHB/data/merged/val/images',
        help='Path to validation images'
    )
    parser.add_argument(
        '--val-labels',
        type=str,
        default='/home/user/BAHB/data/merged/val/labels',
        help='Path to validation labels'
    )
    parser.add_argument(
        '--num-images',
        type=int,
        help='Number of images to validate (default: all)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='/home/user/BAHB/models/tensorrt/validation_results.json',
        help='Output path for results JSON'
    )

    args = parser.parse_args()

    # Create validator
    validator = AccuracyValidator(
        fp32_engine=args.fp32_engine,
        int8_engine=args.int8_engine,
        val_images_dir=args.val_images,
        val_labels_dir=args.val_labels
    )

    # Run validation
    results = validator.validate(num_images=args.num_images)

    # Save results
    output_dir = os.path.dirname(args.output)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to: {args.output}")

    # Return exit code based on degradation
    if results['map_degradation_percent'] > 2.0:
        print(f"\nWARNING: mAP degradation ({results['map_degradation_percent']:.2f}%) exceeds 2% target")
        sys.exit(1)
    else:
        print(f"\nSUCCESS: mAP degradation within acceptable range (<2%)")
        sys.exit(0)


if __name__ == '__main__':
    main()
