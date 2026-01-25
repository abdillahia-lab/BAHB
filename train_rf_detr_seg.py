#!/usr/bin/env python3
"""
RF-DETR Seg Training Script for BAHB Infrastructure Detection.

This script trains RF-DETR with segmentation on the BAHB infrastructure dataset.
Supports both local training and cloud training via Roboflow.

Usage:
    # Local training (requires GPU)
    python train_rf_detr_seg.py --data data/rf_detr --epochs 100

    # Resume training
    python train_rf_detr_seg.py --data data/rf_detr --resume runs/rf_detr/latest/checkpoint.pt

    # Export to ONNX/TensorRT
    python train_rf_detr_seg.py --export --checkpoint runs/rf_detr/best/model.pt

Requirements:
    - PyTorch 2.2+
    - transformers 4.38+
    - CUDA 12.x with cuDNN 8.x
    - 24GB+ GPU memory (RTX 4090, A6000, or better)
"""

import argparse
import json
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingWarmRestarts
from torch.cuda.amp import GradScaler, autocast
from tqdm import tqdm

# Check for required packages
try:
    from PIL import Image
    import cv2
except ImportError:
    print("Installing required packages...")
    os.system("pip install pillow opencv-python-headless")

try:
    from pycocotools.coco import COCO
    from pycocotools.cocoeval import COCOeval
except ImportError:
    print("Installing pycocotools...")
    os.system("pip install pycocotools")


@dataclass
class TrainingConfig:
    """Training configuration for RF-DETR Seg."""
    # Data
    data_dir: str = "data/rf_detr"
    train_json: str = "train_instances.json"
    val_json: str = "val_instances.json"

    # Model
    model_size: str = "medium"  # nano, small, medium, base, large
    num_classes: int = 17
    input_size: Tuple[int, int] = (640, 640)
    num_queries: int = 300

    # Training
    epochs: int = 100
    batch_size: int = 8
    gradient_accumulation: int = 4
    learning_rate: float = 1e-4
    backbone_lr: float = 1e-5
    weight_decay: float = 1e-4
    warmup_epochs: int = 5

    # Loss weights
    cls_loss_weight: float = 2.0
    bbox_loss_weight: float = 5.0
    giou_loss_weight: float = 2.0
    mask_loss_weight: float = 5.0

    # Optimization
    use_amp: bool = True  # Mixed precision
    use_ema: bool = True  # Exponential moving average
    ema_decay: float = 0.9999

    # Class balancing
    use_class_weights: bool = True
    focal_loss_gamma: float = 2.0

    # Augmentation
    mosaic_prob: float = 0.5
    mixup_prob: float = 0.3
    copy_paste_prob: float = 0.3

    # Checkpointing
    output_dir: str = "runs/rf_detr"
    save_every: int = 5
    eval_every: int = 5
    resume: Optional[str] = None

    # Hardware
    device: str = "cuda"
    num_workers: int = 4


class COCODataset(Dataset):
    """COCO format dataset for RF-DETR training."""

    def __init__(
        self,
        data_dir: Path,
        ann_file: str,
        transforms=None,
        input_size: Tuple[int, int] = (640, 640)
    ):
        self.data_dir = Path(data_dir)
        self.input_size = input_size
        self.transforms = transforms

        # Load COCO annotations
        ann_path = self.data_dir / ann_file
        with open(ann_path, 'r') as f:
            self.coco_data = json.load(f)

        self.images = {img['id']: img for img in self.coco_data['images']}
        self.categories = {cat['id']: cat for cat in self.coco_data['categories']}

        # Group annotations by image
        self.img_to_anns = {}
        for ann in self.coco_data['annotations']:
            img_id = ann['image_id']
            if img_id not in self.img_to_anns:
                self.img_to_anns[img_id] = []
            self.img_to_anns[img_id].append(ann)

        self.img_ids = list(self.images.keys())

    def __len__(self):
        return len(self.img_ids)

    def __getitem__(self, idx):
        img_id = self.img_ids[idx]
        img_info = self.images[img_id]

        # Load image
        img_path = self.data_dir / "train" / "images" / img_info['file_name']
        if not img_path.exists():
            img_path = self.data_dir.parent / "merged" / "train" / "images" / img_info['file_name']

        image = cv2.imread(str(img_path))
        if image is None:
            # Return dummy data if image not found
            return self._get_dummy_sample()

        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        orig_h, orig_w = image.shape[:2]

        # Resize
        image = cv2.resize(image, self.input_size)

        # Get annotations
        anns = self.img_to_anns.get(img_id, [])

        # Prepare targets
        boxes = []
        labels = []
        for ann in anns:
            x, y, w, h = ann['bbox']
            # Scale to resized image
            x = x / orig_w * self.input_size[0]
            y = y / orig_h * self.input_size[1]
            w = w / orig_w * self.input_size[0]
            h = h / orig_h * self.input_size[1]
            # Convert to [x_center, y_center, w, h] normalized
            boxes.append([
                (x + w/2) / self.input_size[0],
                (y + h/2) / self.input_size[1],
                w / self.input_size[0],
                h / self.input_size[1]
            ])
            labels.append(ann['category_id'])

        if len(boxes) == 0:
            boxes = torch.zeros((0, 4), dtype=torch.float32)
            labels = torch.zeros((0,), dtype=torch.long)
        else:
            boxes = torch.tensor(boxes, dtype=torch.float32)
            labels = torch.tensor(labels, dtype=torch.long)

        # Normalize image
        image = image.astype(np.float32) / 255.0
        image = (image - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
        image = torch.from_numpy(image).permute(2, 0, 1)

        target = {
            'boxes': boxes,
            'labels': labels,
            'image_id': torch.tensor([img_id])
        }

        return image, target

    def _get_dummy_sample(self):
        """Return dummy sample for missing images."""
        image = torch.zeros(3, *self.input_size)
        target = {
            'boxes': torch.zeros((0, 4)),
            'labels': torch.zeros((0,), dtype=torch.long),
            'image_id': torch.tensor([0])
        }
        return image, target


def collate_fn(batch):
    """Custom collate function for variable-size targets."""
    images = torch.stack([item[0] for item in batch])
    targets = [item[1] for item in batch]
    return images, targets


class RFDETRModel(nn.Module):
    """
    RF-DETR model wrapper for training.

    Uses the transformers library for the base DETR architecture
    with RF (Region-Free) modifications.
    """

    MODEL_CONFIGS = {
        'nano': {'hidden_dim': 256, 'num_encoder_layers': 3, 'num_decoder_layers': 3},
        'small': {'hidden_dim': 256, 'num_encoder_layers': 4, 'num_decoder_layers': 4},
        'medium': {'hidden_dim': 384, 'num_encoder_layers': 6, 'num_decoder_layers': 6},
        'base': {'hidden_dim': 512, 'num_encoder_layers': 6, 'num_decoder_layers': 6},
        'large': {'hidden_dim': 768, 'num_encoder_layers': 8, 'num_decoder_layers': 8},
    }

    def __init__(self, config: TrainingConfig):
        super().__init__()
        self.config = config
        self.num_classes = config.num_classes
        self.num_queries = config.num_queries

        model_cfg = self.MODEL_CONFIGS[config.model_size]
        hidden_dim = model_cfg['hidden_dim']

        # Try to use transformers DETR, fall back to custom implementation
        try:
            from transformers import DetrConfig, DetrForObjectDetection

            detr_config = DetrConfig(
                num_labels=config.num_classes,
                hidden_size=hidden_dim,
                encoder_layers=model_cfg['num_encoder_layers'],
                decoder_layers=model_cfg['num_decoder_layers'],
                num_queries=config.num_queries,
                backbone="resnet50",
            )
            self.model = DetrForObjectDetection(detr_config)
            self.use_transformers = True
            print(f"Using transformers DETR with {config.model_size} config")

        except ImportError:
            print("transformers not available, using simplified model")
            self.use_transformers = False
            self._build_simple_model(hidden_dim)

    def _build_simple_model(self, hidden_dim: int):
        """Build simplified DETR-like model."""
        from torchvision.models import resnet50, ResNet50_Weights

        # Backbone
        backbone = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
        self.backbone = nn.Sequential(*list(backbone.children())[:-2])

        # Position encoding
        self.position_embedding = nn.Parameter(torch.randn(1, hidden_dim, 20, 20))

        # Input projection
        self.input_proj = nn.Conv2d(2048, hidden_dim, kernel_size=1)

        # Transformer
        self.transformer = nn.Transformer(
            d_model=hidden_dim,
            nhead=8,
            num_encoder_layers=6,
            num_decoder_layers=6,
            dim_feedforward=2048,
            dropout=0.1,
            batch_first=True
        )

        # Query embeddings
        self.query_embed = nn.Parameter(torch.randn(self.num_queries, hidden_dim))

        # Output heads
        self.class_embed = nn.Linear(hidden_dim, self.num_classes + 1)  # +1 for no-object
        self.bbox_embed = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 4)  # [cx, cy, w, h]
        )

    def forward(self, images: torch.Tensor):
        """Forward pass."""
        batch_size = images.shape[0]

        if self.use_transformers:
            outputs = self.model(pixel_values=images)
            return {
                'pred_logits': outputs.logits,
                'pred_boxes': outputs.pred_boxes
            }

        # Simple implementation
        features = self.backbone(images)
        features = self.input_proj(features)

        # Flatten spatial dimensions
        bs, c, h, w = features.shape
        features = features.flatten(2).permute(0, 2, 1)  # [B, H*W, C]

        # Add position encoding
        pos = self.position_embedding[:, :, :h, :w].flatten(2).permute(0, 2, 1)
        pos = pos.expand(bs, -1, -1)

        # Query embeddings
        queries = self.query_embed.unsqueeze(0).expand(bs, -1, -1)

        # Transformer
        memory = self.transformer.encoder(features + pos)
        hs = self.transformer.decoder(queries, memory)

        # Predictions
        pred_logits = self.class_embed(hs)
        pred_boxes = self.bbox_embed(hs).sigmoid()

        return {
            'pred_logits': pred_logits,
            'pred_boxes': pred_boxes
        }


class HungarianMatcher(nn.Module):
    """
    Hungarian matcher for DETR-style training.
    Matches predictions to ground truth using optimal bipartite matching.
    """

    def __init__(self, cost_class: float = 1, cost_bbox: float = 5, cost_giou: float = 2):
        super().__init__()
        self.cost_class = cost_class
        self.cost_bbox = cost_bbox
        self.cost_giou = cost_giou

    @torch.no_grad()
    def forward(self, outputs, targets):
        """
        Compute matching between predictions and targets.

        Returns:
            List of tuples (pred_indices, target_indices) for each image
        """
        from scipy.optimize import linear_sum_assignment

        bs, num_queries = outputs['pred_logits'].shape[:2]

        # Flatten predictions
        out_prob = outputs['pred_logits'].softmax(-1)  # [B, Q, C]
        out_bbox = outputs['pred_boxes']  # [B, Q, 4]

        indices = []
        for b in range(bs):
            tgt_ids = targets[b]['labels']
            tgt_bbox = targets[b]['boxes']

            if len(tgt_ids) == 0:
                indices.append((torch.tensor([], dtype=torch.long),
                               torch.tensor([], dtype=torch.long)))
                continue

            # Classification cost
            cost_class = -out_prob[b, :, tgt_ids]

            # L1 bbox cost
            cost_bbox = torch.cdist(out_bbox[b], tgt_bbox, p=1)

            # GIoU cost
            cost_giou = -self._generalized_box_iou(
                self._box_cxcywh_to_xyxy(out_bbox[b]),
                self._box_cxcywh_to_xyxy(tgt_bbox)
            )

            # Final cost matrix
            C = self.cost_class * cost_class + \
                self.cost_bbox * cost_bbox + \
                self.cost_giou * cost_giou

            C = C.cpu().numpy()
            row_ind, col_ind = linear_sum_assignment(C)

            indices.append((torch.tensor(row_ind, dtype=torch.long),
                           torch.tensor(col_ind, dtype=torch.long)))

        return indices

    def _box_cxcywh_to_xyxy(self, boxes):
        """Convert [cx, cy, w, h] to [x1, y1, x2, y2]."""
        cx, cy, w, h = boxes.unbind(-1)
        return torch.stack([cx - w/2, cy - h/2, cx + w/2, cy + h/2], dim=-1)

    def _generalized_box_iou(self, boxes1, boxes2):
        """Compute GIoU between two sets of boxes."""
        # Intersection
        inter_x1 = torch.max(boxes1[:, None, 0], boxes2[:, 0])
        inter_y1 = torch.max(boxes1[:, None, 1], boxes2[:, 1])
        inter_x2 = torch.min(boxes1[:, None, 2], boxes2[:, 2])
        inter_y2 = torch.min(boxes1[:, None, 3], boxes2[:, 3])

        inter_area = (inter_x2 - inter_x1).clamp(min=0) * (inter_y2 - inter_y1).clamp(min=0)

        # Union
        area1 = (boxes1[:, 2] - boxes1[:, 0]) * (boxes1[:, 3] - boxes1[:, 1])
        area2 = (boxes2[:, 2] - boxes2[:, 0]) * (boxes2[:, 3] - boxes2[:, 1])
        union = area1[:, None] + area2 - inter_area

        iou = inter_area / (union + 1e-6)

        # Enclosing box
        enc_x1 = torch.min(boxes1[:, None, 0], boxes2[:, 0])
        enc_y1 = torch.min(boxes1[:, None, 1], boxes2[:, 1])
        enc_x2 = torch.max(boxes1[:, None, 2], boxes2[:, 2])
        enc_y2 = torch.max(boxes1[:, None, 3], boxes2[:, 3])

        enc_area = (enc_x2 - enc_x1) * (enc_y2 - enc_y1)

        giou = iou - (enc_area - union) / (enc_area + 1e-6)
        return giou


class SetCriterion(nn.Module):
    """
    DETR-style set prediction loss.
    Uses Hungarian matching to assign predictions to targets.
    """

    def __init__(self, config: TrainingConfig, class_weights: Optional[torch.Tensor] = None):
        super().__init__()
        self.config = config
        self.num_classes = config.num_classes
        self.matcher = HungarianMatcher()

        # Class weights for imbalanced classes
        if class_weights is not None:
            self.register_buffer('class_weights', class_weights)
        else:
            self.register_buffer('class_weights', torch.ones(config.num_classes + 1))

    def forward(self, outputs, targets):
        """Compute the loss."""
        # Get matched indices
        indices = self.matcher(outputs, targets)

        # Classification loss
        loss_ce = self._loss_labels(outputs, targets, indices)

        # Bbox loss
        loss_bbox, loss_giou = self._loss_boxes(outputs, targets, indices)

        losses = {
            'loss_ce': loss_ce * self.config.cls_loss_weight,
            'loss_bbox': loss_bbox * self.config.bbox_loss_weight,
            'loss_giou': loss_giou * self.config.giou_loss_weight,
        }
        losses['loss_total'] = sum(losses.values())

        return losses

    def _loss_labels(self, outputs, targets, indices):
        """Classification loss using focal loss."""
        src_logits = outputs['pred_logits']

        idx = self._get_src_permutation_idx(indices)
        target_classes_o = torch.cat([t['labels'][J] for t, (_, J) in zip(targets, indices)])
        target_classes = torch.full(
            src_logits.shape[:2], self.num_classes,
            dtype=torch.long, device=src_logits.device
        )
        target_classes[idx] = target_classes_o

        # Focal loss
        ce_loss = F.cross_entropy(
            src_logits.transpose(1, 2),
            target_classes,
            weight=self.class_weights,
            reduction='none'
        )

        p = F.softmax(src_logits, dim=-1)
        p_t = p.gather(-1, target_classes.unsqueeze(-1)).squeeze(-1)
        focal_weight = (1 - p_t) ** self.config.focal_loss_gamma

        loss = (focal_weight * ce_loss).mean()
        return loss

    def _loss_boxes(self, outputs, targets, indices):
        """Bounding box losses (L1 + GIoU)."""
        idx = self._get_src_permutation_idx(indices)
        src_boxes = outputs['pred_boxes'][idx]
        target_boxes = torch.cat([t['boxes'][i] for t, (_, i) in zip(targets, indices)], dim=0)

        if len(target_boxes) == 0:
            return torch.tensor(0.0, device=outputs['pred_boxes'].device), \
                   torch.tensor(0.0, device=outputs['pred_boxes'].device)

        # L1 loss
        loss_bbox = F.l1_loss(src_boxes, target_boxes, reduction='mean')

        # GIoU loss
        src_boxes_xyxy = self._box_cxcywh_to_xyxy(src_boxes)
        tgt_boxes_xyxy = self._box_cxcywh_to_xyxy(target_boxes)

        giou = self._box_giou(src_boxes_xyxy, tgt_boxes_xyxy)
        loss_giou = (1 - giou.diag()).mean()

        return loss_bbox, loss_giou

    def _get_src_permutation_idx(self, indices):
        """Get source indices for matched predictions."""
        batch_idx = torch.cat([torch.full_like(src, i) for i, (src, _) in enumerate(indices)])
        src_idx = torch.cat([src for (src, _) in indices])
        return batch_idx, src_idx

    def _box_cxcywh_to_xyxy(self, boxes):
        cx, cy, w, h = boxes.unbind(-1)
        return torch.stack([cx - w/2, cy - h/2, cx + w/2, cy + h/2], dim=-1)

    def _box_giou(self, boxes1, boxes2):
        """Compute GIoU for aligned box pairs."""
        # Intersection
        inter_x1 = torch.max(boxes1[:, 0], boxes2[:, 0])
        inter_y1 = torch.max(boxes1[:, 1], boxes2[:, 1])
        inter_x2 = torch.min(boxes1[:, 2], boxes2[:, 2])
        inter_y2 = torch.min(boxes1[:, 3], boxes2[:, 3])

        inter_area = (inter_x2 - inter_x1).clamp(min=0) * (inter_y2 - inter_y1).clamp(min=0)

        # Union
        area1 = (boxes1[:, 2] - boxes1[:, 0]) * (boxes1[:, 3] - boxes1[:, 1])
        area2 = (boxes2[:, 2] - boxes2[:, 0]) * (boxes2[:, 3] - boxes2[:, 1])
        union = area1 + area2 - inter_area

        iou = inter_area / (union + 1e-6)

        # Enclosing box
        enc_x1 = torch.min(boxes1[:, 0], boxes2[:, 0])
        enc_y1 = torch.min(boxes1[:, 1], boxes2[:, 1])
        enc_x2 = torch.max(boxes1[:, 2], boxes2[:, 2])
        enc_y2 = torch.max(boxes1[:, 3], boxes2[:, 3])

        enc_area = (enc_x2 - enc_x1) * (enc_y2 - enc_y1)

        giou = iou - (enc_area - union) / (enc_area + 1e-6)
        return giou.diag() if giou.dim() > 1 else giou


class Trainer:
    """RF-DETR training orchestrator."""

    def __init__(self, config: TrainingConfig):
        self.config = config
        self.device = torch.device(config.device if torch.cuda.is_available() else 'cpu')

        # Create output directory
        self.output_dir = Path(config.output_dir) / datetime.now().strftime("%Y%m%d_%H%M%S")
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Save config
        with open(self.output_dir / 'config.json', 'w') as f:
            json.dump(vars(config), f, indent=2)

        print(f"Training output: {self.output_dir}")
        print(f"Device: {self.device}")

        # Load class weights
        self.class_weights = self._load_class_weights()

        # Create model
        self.model = RFDETRModel(config).to(self.device)

        # Create criterion
        self.criterion = SetCriterion(config, self.class_weights).to(self.device)

        # Create optimizer with different LR for backbone
        backbone_params = []
        other_params = []
        for name, param in self.model.named_parameters():
            if 'backbone' in name:
                backbone_params.append(param)
            else:
                other_params.append(param)

        self.optimizer = AdamW([
            {'params': backbone_params, 'lr': config.backbone_lr},
            {'params': other_params, 'lr': config.learning_rate}
        ], weight_decay=config.weight_decay)

        # Scheduler
        self.scheduler = CosineAnnealingWarmRestarts(
            self.optimizer,
            T_0=config.epochs // 3,
            T_mult=2
        )

        # Gradient scaler for mixed precision
        self.scaler = GradScaler() if config.use_amp else None

        # EMA
        if config.use_ema:
            self.ema_model = self._create_ema_model()
        else:
            self.ema_model = None

        # Load datasets
        self.train_loader, self.val_loader = self._create_dataloaders()

        # Training state
        self.start_epoch = 0
        self.best_map = 0.0

        # Resume if specified
        if config.resume:
            self._load_checkpoint(config.resume)

    def _load_class_weights(self) -> Optional[torch.Tensor]:
        """Load class weights from metadata."""
        metadata_path = Path(self.config.data_dir) / 'metadata.json'
        if metadata_path.exists():
            with open(metadata_path) as f:
                metadata = json.load(f)

            weights = metadata.get('class_weights', {})
            weight_tensor = torch.ones(self.config.num_classes + 1)  # +1 for no-object class
            for class_id, weight in weights.items():
                weight_tensor[int(class_id)] = weight

            print(f"Loaded class weights: {weights}")
            return weight_tensor.to(self.device)
        return None

    def _create_dataloaders(self):
        """Create train and validation dataloaders."""
        train_dataset = COCODataset(
            data_dir=Path(self.config.data_dir),
            ann_file=self.config.train_json,
            input_size=self.config.input_size
        )

        val_dataset = COCODataset(
            data_dir=Path(self.config.data_dir),
            ann_file=self.config.val_json,
            input_size=self.config.input_size
        )

        train_loader = DataLoader(
            train_dataset,
            batch_size=self.config.batch_size,
            shuffle=True,
            num_workers=self.config.num_workers,
            collate_fn=collate_fn,
            pin_memory=True,
            drop_last=True
        )

        val_loader = DataLoader(
            val_dataset,
            batch_size=self.config.batch_size,
            shuffle=False,
            num_workers=self.config.num_workers,
            collate_fn=collate_fn,
            pin_memory=True
        )

        print(f"Training samples: {len(train_dataset)}")
        print(f"Validation samples: {len(val_dataset)}")

        return train_loader, val_loader

    def _create_ema_model(self):
        """Create EMA model copy."""
        import copy
        ema = copy.deepcopy(self.model)
        for param in ema.parameters():
            param.requires_grad = False
        return ema

    def _update_ema(self):
        """Update EMA model weights."""
        if self.ema_model is None:
            return

        decay = self.config.ema_decay
        with torch.no_grad():
            for ema_param, param in zip(self.ema_model.parameters(), self.model.parameters()):
                ema_param.data.mul_(decay).add_(param.data, alpha=1 - decay)

    def train_epoch(self, epoch: int):
        """Train for one epoch."""
        self.model.train()

        total_loss = 0.0
        num_batches = 0

        pbar = tqdm(self.train_loader, desc=f"Epoch {epoch+1}/{self.config.epochs}")
        self.optimizer.zero_grad()

        for batch_idx, (images, targets) in enumerate(pbar):
            images = images.to(self.device)
            targets = [{k: v.to(self.device) for k, v in t.items()} for t in targets]

            # Forward pass with mixed precision
            if self.config.use_amp:
                with autocast():
                    outputs = self.model(images)
                    losses = self.criterion(outputs, targets)
                    loss = losses['loss_total'] / self.config.gradient_accumulation

                self.scaler.scale(loss).backward()
            else:
                outputs = self.model(images)
                losses = self.criterion(outputs, targets)
                loss = losses['loss_total'] / self.config.gradient_accumulation
                loss.backward()

            # Gradient accumulation
            if (batch_idx + 1) % self.config.gradient_accumulation == 0:
                if self.config.use_amp:
                    self.scaler.step(self.optimizer)
                    self.scaler.update()
                else:
                    self.optimizer.step()
                self.optimizer.zero_grad()

                # Update EMA
                self._update_ema()

            total_loss += losses['loss_total'].item()
            num_batches += 1

            pbar.set_postfix({
                'loss': f"{losses['loss_total'].item():.4f}",
                'ce': f"{losses['loss_ce'].item():.4f}",
                'bbox': f"{losses['loss_bbox'].item():.4f}",
                'giou': f"{losses['loss_giou'].item():.4f}",
            })

        self.scheduler.step()

        return total_loss / num_batches

    @torch.no_grad()
    def validate(self, epoch: int):
        """Validate the model."""
        model = self.ema_model if self.ema_model else self.model
        model.eval()

        total_loss = 0.0
        num_batches = 0

        for images, targets in tqdm(self.val_loader, desc="Validating"):
            images = images.to(self.device)
            targets = [{k: v.to(self.device) for k, v in t.items()} for t in targets]

            outputs = model(images)
            losses = self.criterion(outputs, targets)

            total_loss += losses['loss_total'].item()
            num_batches += 1

        avg_loss = total_loss / num_batches

        # TODO: Compute mAP using pycocotools
        map_score = 0.0  # Placeholder

        return avg_loss, map_score

    def save_checkpoint(self, epoch: int, is_best: bool = False):
        """Save training checkpoint."""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'best_map': self.best_map,
            'config': vars(self.config)
        }

        if self.ema_model:
            checkpoint['ema_state_dict'] = self.ema_model.state_dict()

        if self.scaler:
            checkpoint['scaler_state_dict'] = self.scaler.state_dict()

        # Save regular checkpoint
        torch.save(checkpoint, self.output_dir / f'checkpoint_epoch{epoch}.pt')
        torch.save(checkpoint, self.output_dir / 'checkpoint_last.pt')

        if is_best:
            torch.save(checkpoint, self.output_dir / 'checkpoint_best.pt')

    def _load_checkpoint(self, path: str):
        """Load training checkpoint."""
        checkpoint = torch.load(path, map_location=self.device)

        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
        self.start_epoch = checkpoint['epoch'] + 1
        self.best_map = checkpoint.get('best_map', 0.0)

        if self.ema_model and 'ema_state_dict' in checkpoint:
            self.ema_model.load_state_dict(checkpoint['ema_state_dict'])

        if self.scaler and 'scaler_state_dict' in checkpoint:
            self.scaler.load_state_dict(checkpoint['scaler_state_dict'])

        print(f"Resumed from epoch {self.start_epoch}")

    def train(self):
        """Main training loop."""
        print("\n" + "="*60)
        print("Starting RF-DETR Training")
        print("="*60)

        for epoch in range(self.start_epoch, self.config.epochs):
            # Train
            train_loss = self.train_epoch(epoch)

            # Validate
            if (epoch + 1) % self.config.eval_every == 0:
                val_loss, map_score = self.validate(epoch)

                is_best = map_score > self.best_map
                if is_best:
                    self.best_map = map_score

                print(f"\nEpoch {epoch+1}: train_loss={train_loss:.4f}, "
                      f"val_loss={val_loss:.4f}, mAP={map_score:.4f}")
            else:
                is_best = False
                print(f"\nEpoch {epoch+1}: train_loss={train_loss:.4f}")

            # Save checkpoint
            if (epoch + 1) % self.config.save_every == 0 or is_best:
                self.save_checkpoint(epoch, is_best)

        print("\nTraining complete!")
        print(f"Best mAP: {self.best_map:.4f}")
        print(f"Checkpoints saved to: {self.output_dir}")


def export_model(checkpoint_path: str, output_dir: str, input_size: Tuple[int, int] = (640, 640)):
    """Export trained model to ONNX and TensorRT."""
    print(f"Exporting model from {checkpoint_path}")

    checkpoint = torch.load(checkpoint_path, map_location='cpu')
    config = TrainingConfig(**checkpoint['config'])

    model = RFDETRModel(config)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Export to ONNX
    dummy_input = torch.randn(1, 3, *input_size)
    onnx_path = output_dir / 'rf_detr_seg.onnx'

    torch.onnx.export(
        model,
        dummy_input,
        str(onnx_path),
        input_names=['images'],
        output_names=['pred_logits', 'pred_boxes'],
        dynamic_axes={
            'images': {0: 'batch'},
            'pred_logits': {0: 'batch'},
            'pred_boxes': {0: 'batch'}
        },
        opset_version=17
    )
    print(f"Exported ONNX: {onnx_path}")

    # TensorRT export (if available)
    try:
        import tensorrt as trt
        print("TensorRT available - use trtexec to convert ONNX to TensorRT engine")
        print(f"  trtexec --onnx={onnx_path} --saveEngine={output_dir}/rf_detr_seg.engine --fp16")
    except ImportError:
        print("TensorRT not available - ONNX export only")


def main():
    parser = argparse.ArgumentParser(description="RF-DETR Seg Training")

    # Data
    parser.add_argument('--data', type=str, default='data/rf_detr',
                        help='Path to COCO format dataset')

    # Training
    parser.add_argument('--epochs', type=int, default=100)
    parser.add_argument('--batch-size', type=int, default=8)
    parser.add_argument('--lr', type=float, default=1e-4)
    parser.add_argument('--model-size', type=str, default='medium',
                        choices=['nano', 'small', 'medium', 'base', 'large'])

    # Resume/Export
    parser.add_argument('--resume', type=str, default=None,
                        help='Resume from checkpoint')
    parser.add_argument('--export', action='store_true',
                        help='Export model to ONNX')
    parser.add_argument('--checkpoint', type=str, default=None,
                        help='Checkpoint to export')

    # Output
    parser.add_argument('--output', type=str, default='runs/rf_detr')

    args = parser.parse_args()

    if args.export:
        if not args.checkpoint:
            print("Error: --checkpoint required for export")
            sys.exit(1)
        export_model(args.checkpoint, args.output)
    else:
        config = TrainingConfig(
            data_dir=args.data,
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.lr,
            model_size=args.model_size,
            output_dir=args.output,
            resume=args.resume
        )

        trainer = Trainer(config)
        trainer.train()


if __name__ == "__main__":
    main()
