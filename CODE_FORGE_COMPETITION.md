# 🔥 CODE FORGE COMPETITION 2026
## BAHB Infrastructure Detection - Manifold 3 Optimization Challenge

**Competition Start:** January 5, 2026 09:00 UTC
**Status:** 🟢 LIVE - Round 1 in Progress

---

## 🎯 Challenge Brief

Optimize the BAHB (Building and Highway Bridge) infrastructure detection system for deployment on DJI Manifold 3 edge computing platform. Solutions must achieve:

- **Inference Speed:** <10ms per frame at 1280×720
- **Accuracy:** mAP50 ≥95% on infrastructure classes
- **Power Efficiency:** <15W sustained operation
- **Robustness:** Maintain accuracy under adverse conditions

### Target Hardware: DJI Manifold 3
```
┌─────────────────────────────────────────────────────────────┐
│  DJI MANIFOLD 3 (Jetson Orin NX)                           │
├─────────────────────────────────────────────────────────────┤
│  CPU:     8-core ARM Cortex-A78AE @ 2.0 GHz                │
│  GPU:     1024-core NVIDIA Ampere (32 Tensor Cores)        │
│  Memory:  16GB LPDDR5 @ 204.8 GB/s                         │
│  Storage: 64GB eMMC + NVMe expansion                       │
│  AI:      275 TOPS (INT8) / 137 TFLOPS (FP16)              │
│  Power:   10W / 15W / 25W modes                            │
│  TensorRT: 8.6 with DLA support                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 👨‍⚖️ JUDGES PANEL

| Judge | Expertise | Organization |
|-------|-----------|--------------|
| **Dr. Sarah Chen** | Edge AI & TensorRT Optimization | NVIDIA Deep Learning Institute |
| **Prof. Marcus Webb** | Computer Vision & Real-time Systems | MIT CSAIL |
| **Elena Kowalski** | Drone Systems & Embedded ML | DJI Enterprise R&D |
| **Dr. James Okonkwo** | Model Compression & Quantization | Google DeepMind |
| **Lisa Tanaka** | Infrastructure Inspection AI | Skydio Autonomy Team |

---

## 🏆 CONTESTANTS

| # | Contestant | Specialty | Approach |
|---|------------|-----------|----------|
| 1 | **Yuki Hashimoto** | Quantization Expert | INT4/INT8 hybrid quantization |
| 2 | **Carlos Mendez** | Architecture Design | Custom lightweight backbone |
| 3 | **Dr. Aisha Patel** | Knowledge Distillation | Teacher-student framework |
| 4 | **Viktor Sorokin** | TensorRT Specialist | Kernel fusion & DLA offload |
| 5 | **Mei-Lin Wu** | Pruning & Sparsity | Structured channel pruning |
| 6 | **Thomas Bergström** | Multi-task Learning | Unified detection + segmentation |
| 7 | **Fatima Al-Hassan** | Temporal Optimization | Frame-to-frame tracking |
| 8 | **Ryan O'Brien** | Hardware-aware NAS | Neural architecture search |
| 9 | **Dr. Priya Sharma** | Attention Mechanisms | Efficient attention for detection |
| 10 | **Aleksandr Volkov** | Pipeline Optimization | Async preprocessing + batching |

---

# 📋 ROUND 1: STRATEGY PROPOSALS
## Status: ✅ COMPLETE

---

## Contestant 1: Yuki Hashimoto
### Strategy: INT4/INT8 Hybrid Quantization with Dynamic Precision

```
┌─────────────────────────────────────────────────────────────┐
│  HYBRID QUANTIZATION STRATEGY                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Backbone (INT4)      Neck (INT8)      Head (INT8)        │
│   ┌──────────┐        ┌──────────┐     ┌──────────┐        │
│   │ Conv1-5  │───────▶│ FPN/PAN  │────▶│ Detect   │        │
│   │ 4-bit    │        │ 8-bit    │     │ 8-bit    │        │
│   └──────────┘        └──────────┘     └──────────┘        │
│        │                   │                │               │
│        ▼                   ▼                ▼               │
│   [2.1ms]             [1.8ms]          [1.4ms]             │
│                                                             │
│   Total Inference: 5.3ms @ 1280×720                        │
│   Memory: 6.2MB (75% reduction)                            │
│   Accuracy: mAP50 = 96.2% (1.5% drop from FP32)           │
└─────────────────────────────────────────────────────────────┘
```

**Key Innovation:** Layer-wise sensitivity analysis determines which layers can tolerate INT4 vs INT8. Backbone features are more redundant and can use INT4, while detection head needs INT8 precision.

```python
# Yuki's quantization config
QUANTIZATION_CONFIG = {
    "backbone": {
        "precision": "int4",
        "calibration_method": "entropy",
        "per_channel": True,
        "layers": ["conv1", "conv2", "c3k2_1", "c3k2_2", "c3k2_3"]
    },
    "neck": {
        "precision": "int8",
        "calibration_method": "minmax",
        "per_channel": True,
        "layers": ["fpn_*", "pan_*"]
    },
    "head": {
        "precision": "int8",
        "calibration_method": "percentile",
        "percentile": 99.99,
        "layers": ["detect_*"]
    },
    "skip_layers": ["dfl"],  # Keep DFL in FP16
}
```

**Judge Notes (Round 1):**
- Dr. Chen: "Innovative INT4 approach, but calibration stability concerns"
- Prof. Webb: "Need to see real benchmark numbers on Orin NX"

---

## Contestant 2: Carlos Mendez
### Strategy: MobileViT-YOLO Hybrid Backbone

```
┌─────────────────────────────────────────────────────────────┐
│  MOBILEVIT-YOLO ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Input ──▶ MobileViT-S ──▶ YOLO Neck ──▶ Detect Head      │
│              (2.5M)          (3.1M)        (1.2M)           │
│                                                             │
│   ┌─────────────────────────────────────┐                  │
│   │ MobileViT Block                     │                  │
│   │ ┌───────┐   ┌───────┐   ┌───────┐  │                  │
│   │ │ Conv  │──▶│ Trans │──▶│ Conv  │  │                  │
│   │ │ 3×3   │   │ 2-head│   │ 1×1   │  │                  │
│   │ └───────┘   └───────┘   └───────┘  │                  │
│   └─────────────────────────────────────┘                  │
│                                                             │
│   Parameters: 6.8M (73% reduction from YOLO11l)            │
│   GFLOPs: 12.4 (86% reduction)                             │
│   Inference: 7.2ms @ 1280×720 (FP16)                       │
│   mAP50: 94.1%                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Innovation:** Replace CSPDarknet backbone with MobileViT-S, keeping YOLO detection head. Global attention in MobileViT helps with large infrastructure detection.

```python
class MobileViTYOLO(nn.Module):
    def __init__(self, num_classes=17):
        super().__init__()
        # MobileViT-S backbone (pretrained on ImageNet)
        self.backbone = MobileViT(
            mode="small",
            patch_size=(2, 2),
            dims=[96, 128, 160],
            channels=[16, 32, 48, 64, 80, 96],
        )

        # YOLO-style FPN neck
        self.neck = YOLONeck(
            in_channels=[64, 80, 96],
            out_channels=[128, 256, 512],
        )

        # Detection head
        self.head = DetectHead(
            num_classes=num_classes,
            anchors=3,
            channels=[128, 256, 512],
        )
```

**Judge Notes (Round 1):**
- Elena Kowalski: "Interesting backbone swap, but integration complexity is high"
- Lisa Tanaka: "mAP drop of 4% might be too much for infrastructure inspection"

---

## Contestant 3: Dr. Aisha Patel
### Strategy: Progressive Knowledge Distillation

```
┌─────────────────────────────────────────────────────────────┐
│  3-STAGE KNOWLEDGE DISTILLATION                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Stage 1: YOLO11x Teacher (99.1% mAP50)                   │
│      │                                                      │
│      ▼  [Feature distillation + Response distillation]     │
│   Stage 2: YOLO11l Intermediate (98.2% mAP50)              │
│      │                                                      │
│      ▼  [Attention transfer + Hard mining]                 │
│   Stage 3: YOLO11s Student (96.8% mAP50)                   │
│                                                             │
│   ┌───────────────────────────────────────────┐            │
│   │ Distillation Losses                       │            │
│   │ L = L_det + α*L_feat + β*L_attn + γ*L_dfl│            │
│   │ α=0.5, β=0.3, γ=0.2                       │            │
│   └───────────────────────────────────────────┘            │
│                                                             │
│   Final Model: 9.4M params, 21.5 GFLOPs                    │
│   Inference: 6.1ms @ 1280×720 (INT8)                       │
│   mAP50: 96.8%                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Innovation:** Three-stage progressive distillation preserves more knowledge than direct large-to-small distillation. Attention transfer focuses on infrastructure-relevant regions.

```python
class ProgressiveDistiller:
    def __init__(self, teacher_path, student_config):
        self.teacher = YOLO(teacher_path)
        self.teacher.eval()

        self.distill_stages = [
            {"model": "yolo11l", "epochs": 50, "alpha": 0.7},
            {"model": "yolo11m", "epochs": 40, "alpha": 0.5},
            {"model": "yolo11s", "epochs": 30, "alpha": 0.3},
        ]

    def distill_loss(self, student_out, teacher_out, targets):
        # Detection loss
        det_loss = self.detection_loss(student_out, targets)

        # Feature distillation (L2 on intermediate features)
        feat_loss = F.mse_loss(
            student_out['features'],
            teacher_out['features'].detach()
        )

        # Attention transfer
        attn_loss = self.attention_transfer(
            student_out['attention_maps'],
            teacher_out['attention_maps']
        )

        return det_loss + 0.5*feat_loss + 0.3*attn_loss
```

**Judge Notes (Round 1):**
- Dr. Okonkwo: "Solid distillation approach, well-documented methodology"
- Prof. Webb: "Three-stage approach is elegant but training time is 3x"

---

## Contestant 4: Viktor Sorokin
### Strategy: TensorRT Kernel Fusion + DLA Offload

```
┌─────────────────────────────────────────────────────────────┐
│  TENSORRT OPTIMIZATION PIPELINE                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │   DLA 0     │    │    GPU      │    │   DLA 1     │    │
│   │  Backbone   │───▶│    Neck     │───▶│    Head     │    │
│   │  (async)    │    │  (fused)    │    │  (async)    │    │
│   └─────────────┘    └─────────────┘    └─────────────┘    │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│      [1.8ms]           [1.2ms]            [1.1ms]          │
│                                                             │
│   Parallel Execution:                                       │
│   ┌────────────────────────────────────────────┐           │
│   │ Frame N:   [DLA0]─────[GPU]─────[DLA1]    │           │
│   │ Frame N+1:      [DLA0]─────[GPU]─────     │           │
│   │ Frame N+2:           [DLA0]─────          │           │
│   └────────────────────────────────────────────┘           │
│                                                             │
│   Effective throughput: 4.1ms/frame (244 FPS theoretical)  │
│   Actual w/overhead: 5.8ms/frame (172 FPS)                 │
│   Power: 12.3W @ 15W mode                                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Innovation:** Leverage Orin NX's dual DLA (Deep Learning Accelerators) for backbone and head, freeing GPU for complex neck operations. Pipeline parallelism achieves near-theoretical throughput.

```python
import tensorrt as trt

def build_dla_engine(onnx_path, dla_core=0):
    """Build TensorRT engine with DLA offload."""
    builder = trt.Builder(TRT_LOGGER)
    config = builder.create_builder_config()

    # Enable DLA
    config.default_device_type = trt.DeviceType.DLA
    config.DLA_core = dla_core
    config.set_flag(trt.BuilderFlag.GPU_FALLBACK)  # Fallback for unsupported ops
    config.set_flag(trt.BuilderFlag.FP16)

    # Optimize for Orin NX
    config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, 1 << 30)

    # Layer-specific DLA assignment
    dla_layers = ["backbone.*", "detect.cv2.*", "detect.cv3.*"]

    return build_engine(onnx_path, config, dla_layers)

class PipelinedInference:
    def __init__(self, engine_paths):
        self.backbone_engine = load_engine(engine_paths['backbone'], dla=0)
        self.neck_engine = load_engine(engine_paths['neck'], gpu=True)
        self.head_engine = load_engine(engine_paths['head'], dla=1)

        # CUDA streams for async execution
        self.streams = [cuda.Stream() for _ in range(3)]

    async def infer_pipelined(self, frames):
        results = []
        for i, frame in enumerate(frames):
            # Async backbone on DLA0
            backbone_out = self.backbone_engine.infer_async(
                frame, stream=self.streams[0]
            )

            # Async neck on GPU (waits for backbone)
            neck_out = self.neck_engine.infer_async(
                backbone_out, stream=self.streams[1]
            )

            # Async head on DLA1 (waits for neck)
            result = self.head_engine.infer_async(
                neck_out, stream=self.streams[2]
            )

            results.append(result)

        return await asyncio.gather(*results)
```

**Judge Notes (Round 1):**
- Dr. Chen: "⭐ Excellent use of Orin NX architecture! DLA utilization is key"
- Elena Kowalski: "This is exactly how DJI's internal teams optimize"

---

## Contestant 5: Mei-Lin Wu
### Strategy: Structured Channel Pruning with Importance Scoring

```
┌─────────────────────────────────────────────────────────────┐
│  CHANNEL PRUNING PIPELINE                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Original YOLO11l ──▶ Importance Analysis ──▶ Pruned Model│
│   (25.3M params)        (per-channel)         (8.7M params)│
│                                                             │
│   Channel Importance Score:                                 │
│   ┌─────────────────────────────────────┐                  │
│   │ I(c) = |W_c| × Grad_c × Act_c       │                  │
│   │                                      │                  │
│   │ W_c: Channel weight magnitude        │                  │
│   │ Grad_c: Gradient importance          │                  │
│   │ Act_c: Activation statistics         │                  │
│   └─────────────────────────────────────┘                  │
│                                                             │
│   Pruning Schedule:                                         │
│   ┌─────────────────────────────────────┐                  │
│   │ Epoch 1-20:  No pruning (warmup)    │                  │
│   │ Epoch 21-40: 20% channels pruned    │                  │
│   │ Epoch 41-60: 40% channels pruned    │                  │
│   │ Epoch 61-80: 60% channels pruned    │                  │
│   │ Epoch 81-100: Fine-tune             │                  │
│   └─────────────────────────────────────┘                  │
│                                                             │
│   Final: 8.7M params, 29.4 GFLOPs                          │
│   Inference: 5.9ms @ 1280×720 (FP16)                       │
│   mAP50: 95.9%                                              │
└─────────────────────────────────────────────────────────────┘
```

```python
class StructuredPruner:
    def __init__(self, model, target_sparsity=0.6):
        self.model = model
        self.target_sparsity = target_sparsity
        self.importance_scores = {}

    def compute_importance(self, dataloader):
        """Compute channel importance using Taylor expansion."""
        self.model.train()

        for name, module in self.model.named_modules():
            if isinstance(module, nn.Conv2d):
                self.importance_scores[name] = torch.zeros(module.out_channels)

        for batch in dataloader:
            outputs = self.model(batch['images'])
            loss = self.compute_loss(outputs, batch['targets'])
            loss.backward()

            for name, module in self.model.named_modules():
                if isinstance(module, nn.Conv2d):
                    # Taylor importance: |weight * gradient|
                    importance = (module.weight * module.weight.grad).abs()
                    importance = importance.sum(dim=(1, 2, 3))  # Sum over spatial
                    self.importance_scores[name] += importance.detach()

        # Normalize
        for name in self.importance_scores:
            self.importance_scores[name] /= len(dataloader)

    def prune_channels(self, prune_ratio):
        """Remove least important channels."""
        for name, module in self.model.named_modules():
            if name in self.importance_scores:
                scores = self.importance_scores[name]
                num_prune = int(len(scores) * prune_ratio)

                # Keep top channels
                _, keep_idx = torch.topk(scores, len(scores) - num_prune)

                # Prune weights
                module.weight.data = module.weight.data[keep_idx]
                if module.bias is not None:
                    module.bias.data = module.bias.data[keep_idx]
```

**Judge Notes (Round 1):**
- Dr. Okonkwo: "Clean implementation, gradual pruning is good practice"
- Lisa Tanaka: "65% parameter reduction with only 2.4% mAP drop is solid"

---

## Contestant 6: Thomas Bergström
### Strategy: Multi-Task Detection + Damage Segmentation

```
┌─────────────────────────────────────────────────────────────┐
│  MULTI-TASK ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Shared Backbone                          │
│                    ┌──────────┐                            │
│                    │ YOLO11l  │                            │
│                    │ Backbone │                            │
│                    └────┬─────┘                            │
│                         │                                   │
│            ┌────────────┼────────────┐                     │
│            ▼            ▼            ▼                      │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│     │ Detect   │ │ Segment  │ │ Classify │                │
│     │ Head     │ │ Head     │ │ Head     │                │
│     └──────────┘ └──────────┘ └──────────┘                │
│            │            │            │                      │
│            ▼            ▼            ▼                      │
│     [Infrastructure] [Damage Mask] [Severity]              │
│                                                             │
│   Shared backbone = efficient feature reuse                 │
│   Single forward pass for all tasks                         │
│                                                             │
│   Parameters: 28.1M (only +11% vs detection-only)          │
│   Inference: 9.2ms @ 1280×720 (FP16)                       │
│   Detection mAP50: 97.1%                                    │
│   Segmentation mIoU: 78.4%                                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Innovation:** Add lightweight segmentation head for damage localization without separate model. Useful for detailed inspection reports.

```python
class MultiTaskYOLO(nn.Module):
    def __init__(self, num_det_classes=17, num_seg_classes=5):
        super().__init__()

        # Shared backbone (frozen during multi-task training)
        self.backbone = YOLO11lBackbone()

        # Detection head (original YOLO head)
        self.detect_head = DetectHead(num_classes=num_det_classes)

        # Lightweight segmentation head
        self.segment_head = nn.Sequential(
            nn.Conv2d(512, 256, 1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.Upsample(scale_factor=4, mode='bilinear'),
            nn.Conv2d(256, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.Upsample(scale_factor=4, mode='bilinear'),
            nn.Conv2d(128, num_seg_classes, 1),
        )

        # Severity classifier (global average pool → FC)
        self.severity_head = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 4),  # None, Minor, Moderate, Severe
        )

    def forward(self, x):
        features = self.backbone(x)

        detections = self.detect_head(features)
        segmentation = self.segment_head(features[-1])
        severity = self.severity_head(features[-1])

        return {
            'detections': detections,
            'segmentation': segmentation,
            'severity': severity,
        }
```

**Judge Notes (Round 1):**
- Prof. Webb: "Multi-task adds value for inspection workflows"
- Elena Kowalski: "9.2ms is borderline for 60fps requirement"

---

## Contestant 7: Fatima Al-Hassan
### Strategy: Temporal Frame Differencing + Selective Inference

```
┌─────────────────────────────────────────────────────────────┐
│  TEMPORAL OPTIMIZATION PIPELINE                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Frame N      Frame N+1    Frame N+2    Frame N+3         │
│   ┌──────┐    ┌──────┐     ┌──────┐     ┌──────┐          │
│   │ FULL │    │ DIFF │     │ DIFF │     │ FULL │          │
│   │INFER │    │CHECK │     │CHECK │     │INFER │          │
│   └──────┘    └──────┘     └──────┘     └──────┘          │
│   [8ms]       [0.5ms]      [0.5ms]      [8ms]              │
│                                                             │
│   Keyframe selection based on:                              │
│   - Motion magnitude (optical flow)                         │
│   - Scene change detection                                  │
│   - Fixed interval (every 4th frame minimum)               │
│                                                             │
│   Average effective latency: 2.4ms/frame                    │
│   Power savings: 68%                                        │
│   Tracking accuracy: 94.2% (vs 98.8% full inference)       │
└─────────────────────────────────────────────────────────────┘
```

**Key Innovation:** Not every frame needs full inference. Use optical flow and tracking for intermediate frames, only run detection on keyframes.

```python
class TemporalOptimizer:
    def __init__(self, detector, flow_threshold=0.1, max_skip=4):
        self.detector = detector
        self.flow_threshold = flow_threshold
        self.max_skip = max_skip

        self.tracker = ByteTracker()
        self.prev_frame = None
        self.frame_count = 0
        self.last_detections = None

    def process_frame(self, frame):
        self.frame_count += 1

        # Compute motion
        if self.prev_frame is not None:
            flow = cv2.calcOpticalFlowFarneback(
                self.prev_frame, frame, None,
                0.5, 3, 15, 3, 5, 1.2, 0
            )
            motion = np.mean(np.abs(flow))
        else:
            motion = float('inf')

        self.prev_frame = frame.copy()

        # Decide: full inference or tracking update?
        need_detection = (
            motion > self.flow_threshold or
            self.frame_count % self.max_skip == 0 or
            self.last_detections is None
        )

        if need_detection:
            # Full YOLO inference
            detections = self.detector(frame)
            self.last_detections = detections
            self.tracker.update(detections)
            return detections, "full"
        else:
            # Just update tracker with motion
            tracked = self.tracker.predict(flow)
            return tracked, "tracked"
```

**Judge Notes (Round 1):**
- Lisa Tanaka: "Great for power efficiency, but 4.6% accuracy drop is significant"
- Dr. Chen: "Temporal approaches work well for steady drone flight"

---

## Contestant 8: Ryan O'Brien
### Strategy: Hardware-Aware Neural Architecture Search

```
┌─────────────────────────────────────────────────────────────┐
│  NAS FOR ORIN NX                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Search Space:                                             │
│   ┌─────────────────────────────────────┐                  │
│   │ Operators: Conv3x3, Conv5x5, DWConv │                  │
│   │           MBConv, C3k2, SPPF        │                  │
│   │ Channels: [32, 64, 128, 256, 512]   │                  │
│   │ Depths: [1, 2, 3, 4]                │                  │
│   │ Attention: [None, SE, CBAM, ECA]    │                  │
│   └─────────────────────────────────────┘                  │
│                                                             │
│   Hardware Constraints (Orin NX):                           │
│   ┌─────────────────────────────────────┐                  │
│   │ Latency: < 10ms @ 1280×720          │                  │
│   │ Memory: < 8GB peak                  │                  │
│   │ Power: < 15W                        │                  │
│   │ DLA compatible operations only      │                  │
│   └─────────────────────────────────────┘                  │
│                                                             │
│   Search Method: Differentiable NAS + Latency predictor    │
│   Search Cost: 8 GPU-days                                  │
│   Result: BAHB-NAS-Orin (custom architecture)              │
│                                                             │
│   Parameters: 11.2M                                         │
│   Inference: 5.1ms @ 1280×720 (INT8)                       │
│   mAP50: 96.4%                                              │
└─────────────────────────────────────────────────────────────┘
```

```python
# NAS-derived architecture (simplified)
BAHB_NAS_ORIN = {
    "backbone": [
        {"op": "conv3x3", "c": 48, "s": 2},
        {"op": "mbconv", "c": 96, "e": 4, "s": 2},
        {"op": "c3k2", "c": 192, "n": 2, "s": 2},
        {"op": "mbconv", "c": 384, "e": 6, "s": 2, "se": True},
        {"op": "c3k2", "c": 512, "n": 3, "s": 2},
        {"op": "sppf", "c": 512, "k": 5},
    ],
    "neck": [
        {"op": "c2psa", "c": 384, "n": 1},
        {"op": "upsample", "scale": 2},
        {"op": "concat", "layers": [-1, 3]},
        {"op": "c3k2", "c": 256, "n": 2},
        {"op": "upsample", "scale": 2},
        {"op": "concat", "layers": [-1, 2]},
        {"op": "c3k2", "c": 128, "n": 1},
    ],
    "head": {
        "channels": [128, 256, 384],
        "num_classes": 17,
    }
}
```

**Judge Notes (Round 1):**
- Dr. Okonkwo: "NAS is expensive but results are impressive"
- Elena Kowalski: "Custom architecture = harder maintenance long-term"

---

## Contestant 9: Dr. Priya Sharma
### Strategy: Efficient Attention via Linear Complexity

```
┌─────────────────────────────────────────────────────────────┐
│  LINEAR ATTENTION MECHANISM                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Standard Self-Attention: O(N²)                            │
│   ┌────────────────────────────────────┐                   │
│   │ Attn(Q,K,V) = softmax(QK^T/√d)V   │                   │
│   │ Memory: 1280×720 = 921,600 tokens  │                   │
│   │ Complexity: 849 billion ops        │                   │
│   └────────────────────────────────────┘                   │
│                                                             │
│   Linear Attention: O(N)                                    │
│   ┌────────────────────────────────────┐                   │
│   │ Attn(Q,K,V) = φ(Q)(φ(K)^T V)      │                   │
│   │ φ = elu(x) + 1 (feature map)       │                   │
│   │ Complexity: 1.8 million ops        │                   │
│   └────────────────────────────────────┘                   │
│                                                             │
│   Applied to:                                               │
│   - C2PSA blocks (replace standard attention)              │
│   - Cross-scale feature fusion                             │
│                                                             │
│   Speedup: 3.2× on attention operations                    │
│   Total inference: 6.4ms @ 1280×720                        │
│   mAP50: 97.3% (slight improvement!)                       │
└─────────────────────────────────────────────────────────────┘
```

```python
class LinearAttention(nn.Module):
    """O(N) complexity attention for detection."""

    def __init__(self, dim, heads=8, dim_head=64):
        super().__init__()
        self.heads = heads
        self.dim_head = dim_head
        inner_dim = heads * dim_head

        self.to_qkv = nn.Linear(dim, inner_dim * 3, bias=False)
        self.to_out = nn.Linear(inner_dim, dim)

    def feature_map(self, x):
        """ELU-based feature map for linear attention."""
        return F.elu(x) + 1

    def forward(self, x):
        b, n, _ = x.shape
        qkv = self.to_qkv(x).chunk(3, dim=-1)
        q, k, v = map(
            lambda t: t.view(b, n, self.heads, self.dim_head).transpose(1, 2),
            qkv
        )

        # Apply feature map
        q = self.feature_map(q)
        k = self.feature_map(k)

        # Linear attention: (Q @ (K^T @ V)) instead of ((Q @ K^T) @ V)
        kv = torch.einsum('bhnd,bhne->bhde', k, v)
        qkv = torch.einsum('bhnd,bhde->bhne', q, kv)

        # Normalize
        k_sum = k.sum(dim=-2, keepdim=True)
        normalizer = torch.einsum('bhnd,bhkd->bhn', q, k_sum)
        out = qkv / (normalizer.unsqueeze(-1) + 1e-6)

        out = out.transpose(1, 2).reshape(b, n, -1)
        return self.to_out(out)
```

**Judge Notes (Round 1):**
- Prof. Webb: "⭐ Elegant solution! Linear attention is underexplored in detection"
- Dr. Chen: "mAP improvement is surprising - attention helps infrastructure"

---

## Contestant 10: Aleksandr Volkov
### Strategy: Async Pipeline with Smart Batching

```
┌─────────────────────────────────────────────────────────────┐
│  ASYNC INFERENCE PIPELINE                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Camera ──▶ Preprocess ──▶ Inference ──▶ Postprocess      │
│   (async)    (CPU thread)   (GPU)        (CPU thread)       │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐ │
│   │ Pipeline Stages (overlapped execution)               │ │
│   │                                                      │ │
│   │ Time: ─────────────────────────────────────────────▶│ │
│   │                                                      │ │
│   │ Pre:   [F1][F2][F3][F4][F5]...                      │ │
│   │ Infer:    [F1][F2][F3][F4][F5]...                   │ │
│   │ Post:        [F1][F2][F3][F4][F5]...               │ │
│   │                                                      │ │
│   │ Effective latency: 1 frame = 1 inference time       │ │
│   └──────────────────────────────────────────────────────┘ │
│                                                             │
│   Smart Batching:                                           │
│   - Batch size adapts to GPU memory pressure               │
│   - Priority queue for ROI crops                           │
│   - Skip frames under high load                            │
│                                                             │
│   Throughput: 142 FPS sustained                            │
│   Latency: 9.8ms (1 frame behind real-time)               │
│   Power: 14.2W @ 25W mode                                  │
└─────────────────────────────────────────────────────────────┘
```

```python
import asyncio
import queue
from concurrent.futures import ThreadPoolExecutor

class AsyncInferencePipeline:
    def __init__(self, model_path, batch_size=4):
        self.model = TensorRTEngine(model_path)
        self.batch_size = batch_size

        # Async queues
        self.preprocess_queue = asyncio.Queue(maxsize=16)
        self.inference_queue = asyncio.Queue(maxsize=8)
        self.result_queue = asyncio.Queue(maxsize=16)

        # Thread pool for CPU-bound preprocessing
        self.cpu_executor = ThreadPoolExecutor(max_workers=4)

    async def preprocess_worker(self):
        """CPU worker for image preprocessing."""
        while True:
            frame_data = await self.preprocess_queue.get()

            # Offload to thread pool
            loop = asyncio.get_event_loop()
            processed = await loop.run_in_executor(
                self.cpu_executor,
                self._preprocess,
                frame_data
            )

            await self.inference_queue.put(processed)

    async def inference_worker(self):
        """GPU worker for batched inference."""
        batch = []

        while True:
            try:
                # Collect batch with timeout
                item = await asyncio.wait_for(
                    self.inference_queue.get(),
                    timeout=0.001  # 1ms timeout
                )
                batch.append(item)

            except asyncio.TimeoutError:
                pass

            # Run inference when batch is ready
            if len(batch) >= self.batch_size or (batch and self.inference_queue.empty()):
                results = self.model.infer_batch(batch)

                for result in results:
                    await self.result_queue.put(result)

                batch = []

    async def run(self, frame_source):
        """Main pipeline orchestrator."""
        workers = [
            asyncio.create_task(self.preprocess_worker()),
            asyncio.create_task(self.inference_worker()),
        ]

        async for frame in frame_source:
            await self.preprocess_queue.put(frame)

            # Yield results as available
            while not self.result_queue.empty():
                yield await self.result_queue.get()
```

**Judge Notes (Round 1):**
- Elena Kowalski: "Good systems engineering, but 1-frame latency might matter"
- Lisa Tanaka: "142 FPS is overkill for 60fps requirement, trade for power"

---

# 📊 ROUND 1 SCORING

## Criteria & Weights:
| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Speed** | 25% | Inference latency on Orin NX |
| **Accuracy** | 25% | mAP50 on infrastructure classes |
| **Innovation** | 20% | Novel approach or technique |
| **Practicality** | 15% | Ease of implementation |
| **Power** | 15% | Energy efficiency |

## Round 1 Detailed Scores:

### Judge: Dr. Sarah Chen (NVIDIA DLI)
| Contestant | Speed | Accuracy | Innovation | Practicality | Power | Total |
|------------|-------|----------|------------|--------------|-------|-------|
| Yuki Hashimoto | 9.0 | 8.5 | 9.0 | 7.0 | 9.0 | **8.45** |
| Carlos Mendez | 7.5 | 7.0 | 8.0 | 7.5 | 8.0 | **7.55** |
| Dr. Aisha Patel | 8.0 | 8.5 | 7.5 | 8.0 | 7.5 | **7.95** |
| **Viktor Sorokin** | 9.5 | 8.0 | 9.5 | 8.5 | 9.0 | **⭐8.95** |
| Mei-Lin Wu | 8.5 | 8.0 | 7.0 | 9.0 | 8.0 | **8.05** |
| Thomas Bergström | 6.5 | 9.0 | 8.0 | 7.0 | 6.5 | **7.45** |
| Fatima Al-Hassan | 9.0 | 7.0 | 8.5 | 7.5 | 9.5 | **8.15** |
| Ryan O'Brien | 9.0 | 8.5 | 9.0 | 5.0 | 8.5 | **8.00** |
| **Dr. Priya Sharma** | 8.0 | 9.0 | 9.5 | 8.0 | 8.0 | **⭐8.55** |
| Aleksandr Volkov | 8.5 | 8.0 | 7.5 | 8.5 | 7.0 | **7.95** |

### Judge: Prof. Marcus Webb (MIT CSAIL)
| Contestant | Speed | Accuracy | Innovation | Practicality | Power | Total |
|------------|-------|----------|------------|--------------|-------|-------|
| Yuki Hashimoto | 8.5 | 8.0 | 8.5 | 7.5 | 8.5 | **8.15** |
| Carlos Mendez | 7.0 | 6.5 | 8.5 | 6.5 | 7.5 | **7.10** |
| Dr. Aisha Patel | 7.5 | 8.5 | 8.0 | 8.5 | 7.0 | **7.95** |
| **Viktor Sorokin** | 9.0 | 8.0 | 9.0 | 9.0 | 8.5 | **⭐8.65** |
| Mei-Lin Wu | 8.0 | 8.0 | 7.5 | 9.0 | 8.0 | **8.05** |
| Thomas Bergström | 6.0 | 9.0 | 8.5 | 7.0 | 6.0 | **7.35** |
| Fatima Al-Hassan | 8.5 | 6.5 | 8.0 | 7.5 | 9.0 | **7.75** |
| Ryan O'Brien | 9.0 | 8.5 | 9.0 | 4.5 | 8.0 | **7.85** |
| **Dr. Priya Sharma** | 8.0 | 9.5 | 9.5 | 8.0 | 8.0 | **⭐8.70** |
| Aleksandr Volkov | 8.0 | 8.0 | 7.0 | 9.0 | 7.0 | **7.80** |

### Judge: Elena Kowalski (DJI Enterprise R&D)
| Contestant | Speed | Accuracy | Innovation | Practicality | Power | Total |
|------------|-------|----------|------------|--------------|-------|-------|
| Yuki Hashimoto | 8.5 | 8.5 | 8.0 | 7.0 | 9.0 | **8.25** |
| Carlos Mendez | 7.0 | 7.0 | 7.5 | 7.0 | 8.0 | **7.25** |
| Dr. Aisha Patel | 7.5 | 8.5 | 7.0 | 8.0 | 7.5 | **7.75** |
| **Viktor Sorokin** | 9.5 | 8.0 | 9.5 | 9.5 | 9.0 | **⭐9.05** |
| Mei-Lin Wu | 8.0 | 8.0 | 7.0 | 9.0 | 8.5 | **8.05** |
| Thomas Bergström | 6.5 | 9.0 | 8.0 | 7.0 | 6.5 | **7.45** |
| Fatima Al-Hassan | 8.5 | 7.0 | 8.5 | 8.0 | 9.0 | **8.10** |
| Ryan O'Brien | 8.5 | 8.5 | 8.5 | 5.0 | 8.5 | **7.80** |
| Dr. Priya Sharma | 7.5 | 9.0 | 9.0 | 8.0 | 7.5 | **8.25** |
| Aleksandr Volkov | 9.0 | 8.0 | 7.5 | 9.0 | 7.5 | **8.20** |

### Judge: Dr. James Okonkwo (Google DeepMind)
| Contestant | Speed | Accuracy | Innovation | Practicality | Power | Total |
|------------|-------|----------|------------|--------------|-------|-------|
| Yuki Hashimoto | 9.0 | 8.0 | 9.0 | 7.5 | 8.5 | **8.40** |
| Carlos Mendez | 7.0 | 6.5 | 8.0 | 7.0 | 7.5 | **7.15** |
| **Dr. Aisha Patel** | 8.0 | 8.5 | 8.0 | 9.0 | 7.5 | **⭐8.25** |
| Viktor Sorokin | 8.5 | 7.5 | 8.5 | 8.5 | 8.5 | **8.25** |
| **Mei-Lin Wu** | 8.5 | 8.0 | 7.5 | 9.5 | 8.5 | **⭐8.30** |
| Thomas Bergström | 6.0 | 9.0 | 8.0 | 7.5 | 6.0 | **7.35** |
| Fatima Al-Hassan | 8.0 | 6.5 | 8.0 | 8.0 | 9.0 | **7.75** |
| Ryan O'Brien | 8.5 | 8.5 | 9.5 | 5.0 | 8.0 | **7.90** |
| Dr. Priya Sharma | 7.5 | 9.0 | 9.5 | 8.0 | 7.5 | **8.35** |
| Aleksandr Volkov | 8.0 | 8.0 | 7.0 | 8.5 | 7.0 | **7.75** |

### Judge: Lisa Tanaka (Skydio Autonomy Team)
| Contestant | Speed | Accuracy | Innovation | Practicality | Power | Total |
|------------|-------|----------|------------|--------------|-------|-------|
| Yuki Hashimoto | 8.5 | 8.5 | 8.5 | 7.5 | 9.0 | **8.35** |
| Carlos Mendez | 7.5 | 6.0 | 8.0 | 7.0 | 8.0 | **7.15** |
| Dr. Aisha Patel | 7.5 | 8.5 | 7.5 | 8.5 | 7.5 | **7.95** |
| **Viktor Sorokin** | 9.0 | 8.0 | 9.0 | 9.0 | 9.0 | **⭐8.75** |
| Mei-Lin Wu | 8.0 | 8.0 | 7.0 | 9.0 | 8.5 | **8.05** |
| Thomas Bergström | 6.0 | 9.0 | 8.0 | 7.5 | 6.0 | **7.35** |
| Fatima Al-Hassan | 8.5 | 7.0 | 8.0 | 8.0 | 9.5 | **8.05** |
| Ryan O'Brien | 8.5 | 8.5 | 9.0 | 5.5 | 8.0 | **7.95** |
| **Dr. Priya Sharma** | 7.5 | 9.5 | 9.5 | 8.5 | 7.5 | **⭐8.55** |
| Aleksandr Volkov | 8.5 | 8.0 | 7.5 | 8.5 | 7.0 | **7.95** |

---

## 📊 ROUND 1 AGGREGATE SCORES

| Rank | Contestant | Avg Score | Advancement |
|------|------------|-----------|-------------|
| 🥇 | **Viktor Sorokin** | **8.73** | ✅ Finals |
| 🥈 | **Dr. Priya Sharma** | **8.48** | ✅ Finals |
| 🥉 | **Yuki Hashimoto** | **8.32** | ✅ Finals |
| 4 | Mei-Lin Wu | 8.10 | ✅ Finals |
| 5 | Fatima Al-Hassan | 7.96 | ✅ Finals |
| 6 | Dr. Aisha Patel | 7.97 | ❌ Eliminated |
| 7 | Aleksandr Volkov | 7.93 | ❌ Eliminated |
| 8 | Ryan O'Brien | 7.90 | ❌ Eliminated |
| 9 | Thomas Bergström | 7.39 | ❌ Eliminated |
| 10 | Carlos Mendez | 7.24 | ❌ Eliminated |

---

# 🏆 ROUND 2: FINAL SHOWDOWN
## Top 5 Contestants - Implementation Deep Dive

**Status:** 🔴 LIVE NOW

The top 5 contestants must now provide complete, production-ready implementations with benchmarks.

---

## 🥇 FINALIST 1: Viktor Sorokin
### Complete TensorRT DLA Pipeline Implementation

```python
#!/usr/bin/env python3
"""
BAHB TensorRT DLA Pipeline for DJI Manifold 3
Viktor Sorokin - Code Forge 2026 Finals

Achieves 5.8ms inference with dual DLA offload
"""

import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit
import numpy as np
import asyncio
from dataclasses import dataclass
from typing import List, Tuple, Optional
from pathlib import Path
import time

TRT_LOGGER = trt.Logger(trt.Logger.WARNING)


@dataclass
class OrinNXConfig:
    """DJI Manifold 3 (Orin NX) hardware configuration."""
    dla_cores: int = 2
    gpu_sm_count: int = 32
    tensor_cores: int = 32
    memory_bandwidth: float = 204.8  # GB/s
    power_mode: str = "15W"  # 10W, 15W, or 25W

    # Optimal batch sizes per compute unit
    dla_batch_size: int = 1
    gpu_batch_size: int = 4


class DLAEngineBuilder:
    """Build optimized TensorRT engines with DLA offload."""

    def __init__(self, onnx_path: str, config: OrinNXConfig):
        self.onnx_path = Path(onnx_path)
        self.config = config
        self.builder = trt.Builder(TRT_LOGGER)
        self.network = None
        self.parser = None

    def parse_onnx(self) -> bool:
        """Parse ONNX model."""
        self.network = self.builder.create_network(
            1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH)
        )
        self.parser = trt.OnnxParser(self.network, TRT_LOGGER)

        with open(self.onnx_path, 'rb') as f:
            if not self.parser.parse(f.read()):
                for i in range(self.parser.num_errors):
                    print(f"ONNX Parse Error: {self.parser.get_error(i)}")
                return False
        return True

    def build_dla_engine(self, dla_core: int = 0) -> trt.ICudaEngine:
        """Build engine optimized for DLA execution."""
        config = self.builder.create_builder_config()

        # Memory allocation
        config.set_memory_pool_limit(
            trt.MemoryPoolType.WORKSPACE,
            1 << 30  # 1GB workspace
        )

        # Enable DLA
        config.default_device_type = trt.DeviceType.DLA
        config.DLA_core = dla_core
        config.set_flag(trt.BuilderFlag.FP16)
        config.set_flag(trt.BuilderFlag.GPU_FALLBACK)

        # DLA-specific optimizations
        config.set_flag(trt.BuilderFlag.PREFER_PRECISION_CONSTRAINTS)

        # Build engine
        engine = self.builder.build_serialized_network(self.network, config)
        runtime = trt.Runtime(TRT_LOGGER)
        return runtime.deserialize_cuda_engine(engine)

    def build_gpu_engine(self, int8_calibrator=None) -> trt.ICudaEngine:
        """Build engine optimized for GPU execution."""
        config = self.builder.create_builder_config()

        config.set_memory_pool_limit(
            trt.MemoryPoolType.WORKSPACE,
            2 << 30  # 2GB workspace
        )

        # Enable optimizations
        config.set_flag(trt.BuilderFlag.FP16)
        if int8_calibrator:
            config.set_flag(trt.BuilderFlag.INT8)
            config.int8_calibrator = int8_calibrator

        # Tensor Core optimizations
        config.set_flag(trt.BuilderFlag.SPARSE_WEIGHTS)

        engine = self.builder.build_serialized_network(self.network, config)
        runtime = trt.Runtime(TRT_LOGGER)
        return runtime.deserialize_cuda_engine(engine)


class PipelinedInference:
    """
    Async inference pipeline using dual DLA + GPU.

    Pipeline structure:
    - DLA 0: Backbone (layers 0-10)
    - GPU:   Neck (FPN/PAN fusion)
    - DLA 1: Detection head

    Achieves 5.8ms effective latency through pipelining.
    """

    def __init__(
        self,
        backbone_engine: trt.ICudaEngine,
        neck_engine: trt.ICudaEngine,
        head_engine: trt.ICudaEngine,
    ):
        self.engines = {
            'backbone': backbone_engine,
            'neck': neck_engine,
            'head': head_engine,
        }

        # Create execution contexts
        self.contexts = {
            name: engine.create_execution_context()
            for name, engine in self.engines.items()
        }

        # Create CUDA streams for async execution
        self.streams = {
            'backbone': cuda.Stream(),
            'neck': cuda.Stream(),
            'head': cuda.Stream(),
        }

        # Allocate device memory
        self._allocate_buffers()

        # Pipeline state
        self.pipeline_depth = 3
        self.frame_queue = asyncio.Queue(maxsize=self.pipeline_depth)

    def _allocate_buffers(self):
        """Pre-allocate device memory for all stages."""
        self.buffers = {}

        for name, engine in self.engines.items():
            self.buffers[name] = {
                'inputs': [],
                'outputs': [],
                'd_inputs': [],
                'd_outputs': [],
            }

            for i in range(engine.num_io_tensors):
                tensor_name = engine.get_tensor_name(i)
                shape = engine.get_tensor_shape(tensor_name)
                dtype = trt.nptype(engine.get_tensor_dtype(tensor_name))
                size = np.prod(shape) * np.dtype(dtype).itemsize

                # Host memory
                host_mem = cuda.pagelocked_empty(int(np.prod(shape)), dtype)
                # Device memory
                device_mem = cuda.mem_alloc(int(size))

                if engine.get_tensor_mode(tensor_name) == trt.TensorIOMode.INPUT:
                    self.buffers[name]['inputs'].append(host_mem)
                    self.buffers[name]['d_inputs'].append(device_mem)
                else:
                    self.buffers[name]['outputs'].append(host_mem)
                    self.buffers[name]['d_outputs'].append(device_mem)

    async def infer_async(self, image: np.ndarray) -> dict:
        """
        Run pipelined inference on a single image.

        Returns detection results with bounding boxes, classes, and confidences.
        """
        start_time = time.perf_counter()

        # Stage 1: Backbone on DLA 0
        backbone_out = await self._run_stage(
            'backbone',
            image,
            self.streams['backbone']
        )

        # Stage 2: Neck on GPU (waits for backbone)
        self.streams['neck'].synchronize()
        neck_out = await self._run_stage(
            'neck',
            backbone_out,
            self.streams['neck']
        )

        # Stage 3: Head on DLA 1 (waits for neck)
        self.streams['head'].synchronize()
        detections = await self._run_stage(
            'head',
            neck_out,
            self.streams['head']
        )

        # Synchronize final output
        self.streams['head'].synchronize()

        inference_time = (time.perf_counter() - start_time) * 1000

        return {
            'detections': self._postprocess(detections),
            'inference_ms': inference_time,
        }

    async def _run_stage(
        self,
        stage_name: str,
        input_data: np.ndarray,
        stream: cuda.Stream,
    ) -> np.ndarray:
        """Execute a single pipeline stage asynchronously."""

        buffers = self.buffers[stage_name]
        context = self.contexts[stage_name]

        # Copy input to device
        np.copyto(buffers['inputs'][0], input_data.ravel())
        cuda.memcpy_htod_async(
            buffers['d_inputs'][0],
            buffers['inputs'][0],
            stream
        )

        # Set tensor addresses
        engine = self.engines[stage_name]
        for i, d_input in enumerate(buffers['d_inputs']):
            tensor_name = engine.get_tensor_name(i)
            context.set_tensor_address(tensor_name, int(d_input))

        for i, d_output in enumerate(buffers['d_outputs']):
            tensor_name = engine.get_tensor_name(
                len(buffers['d_inputs']) + i
            )
            context.set_tensor_address(tensor_name, int(d_output))

        # Execute
        context.execute_async_v3(stream.handle)

        # Copy output back (async)
        cuda.memcpy_dtoh_async(
            buffers['outputs'][0],
            buffers['d_outputs'][0],
            stream
        )

        return buffers['outputs'][0]

    def _postprocess(self, raw_output: np.ndarray) -> List[dict]:
        """Convert raw network output to detection results."""
        # YOLO output format: [batch, num_detections, 4+1+num_classes]
        detections = []

        for det in raw_output.reshape(-1, 22):  # 4 bbox + 1 conf + 17 classes
            conf = det[4]
            if conf < 0.25:
                continue

            class_scores = det[5:]
            class_id = np.argmax(class_scores)
            class_conf = class_scores[class_id]

            if conf * class_conf < 0.25:
                continue

            detections.append({
                'bbox': det[:4].tolist(),  # x, y, w, h
                'confidence': float(conf * class_conf),
                'class_id': int(class_id),
            })

        return detections


class BAHBManifold3Detector:
    """
    Complete BAHB detector optimized for DJI Manifold 3.

    Usage:
        detector = BAHBManifold3Detector("models/bahb_yolo11l.onnx")
        detector.warmup()

        for frame in video_stream:
            results = await detector.detect(frame)
            print(f"Found {len(results['detections'])} objects in {results['inference_ms']:.1f}ms")
    """

    def __init__(self, onnx_path: str, power_mode: str = "15W"):
        self.config = OrinNXConfig(power_mode=power_mode)

        print(f"Building TensorRT engines for Manifold 3 ({power_mode} mode)...")

        # Build segmented engines
        builder = DLAEngineBuilder(onnx_path, self.config)
        builder.parse_onnx()

        # In production, these would be separate ONNX files
        # Here we build the same model 3 times for demonstration
        self.backbone_engine = builder.build_dla_engine(dla_core=0)
        self.neck_engine = builder.build_gpu_engine()
        self.head_engine = builder.build_dla_engine(dla_core=1)

        # Create pipeline
        self.pipeline = PipelinedInference(
            self.backbone_engine,
            self.neck_engine,
            self.head_engine,
        )

        print("Engines built successfully!")

    def warmup(self, num_iterations: int = 10):
        """Warm up the inference pipeline."""
        dummy_input = np.random.rand(1, 3, 720, 1280).astype(np.float32)

        for _ in range(num_iterations):
            asyncio.run(self.pipeline.infer_async(dummy_input))

        print(f"Warmup complete ({num_iterations} iterations)")

    async def detect(self, image: np.ndarray) -> dict:
        """Run detection on a single image."""
        # Preprocess
        input_tensor = self._preprocess(image)

        # Inference
        results = await self.pipeline.infer_async(input_tensor)

        return results

    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for inference."""
        # Resize to 1280x720
        import cv2
        resized = cv2.resize(image, (1280, 720))

        # Normalize and transpose
        normalized = resized.astype(np.float32) / 255.0
        transposed = np.transpose(normalized, (2, 0, 1))

        return np.expand_dims(transposed, axis=0)


# Benchmark results on Manifold 3 (Orin NX)
BENCHMARK_RESULTS = """
╔══════════════════════════════════════════════════════════════════════════════╗
║  VIKTOR SOROKIN - DLA PIPELINE BENCHMARK RESULTS                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Hardware: DJI Manifold 3 (Jetson Orin NX)                                   ║
║  Power Mode: 15W                                                              ║
║  Image Size: 1280×720                                                         ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  LATENCY BREAKDOWN                                                      │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Preprocessing (CPU):     0.8ms                                        │ ║
║  │  Backbone (DLA 0):        1.8ms                                        │ ║
║  │  Neck (GPU):              1.2ms                                        │ ║
║  │  Head (DLA 1):            1.1ms                                        │ ║
║  │  Postprocessing (CPU):    0.9ms                                        │ ║
║  │  ─────────────────────────────────                                      │ ║
║  │  TOTAL (pipelined):       5.8ms                                        │ ║
║  │  TOTAL (sequential):      5.8ms                                        │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ACCURACY METRICS                                                       │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  mAP@50:       97.2%  (vs 98.8% FP32 baseline)                         │ ║
║  │  mAP@50-95:    82.4%  (vs 83.8% FP32 baseline)                         │ ║
║  │  Precision:    96.8%                                                    │ ║
║  │  Recall:       95.4%                                                    │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  POWER & THERMAL                                                        │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Average Power:    12.3W (@ 15W mode)                                  │ ║
║  │  Peak Power:       14.1W                                                │ ║
║  │  GPU Utilization:  34%                                                  │ ║
║  │  DLA 0 Util:       89%                                                  │ ║
║  │  DLA 1 Util:       76%                                                  │ ║
║  │  Temperature:      58°C (sustained)                                     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  THROUGHPUT: 172 FPS (theoretical) / 156 FPS (measured sustained)            ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

if __name__ == "__main__":
    print(BENCHMARK_RESULTS)
```

**Judge Comments - Viktor Sorokin:**
- Dr. Chen: "⭐ Exemplary use of Orin NX architecture. DLA utilization is textbook."
- Elena Kowalski: "This is production-ready. Matches DJI internal optimization patterns."
- Prof. Webb: "Clean async architecture. Pipeline efficiency is excellent."

---

## 🥈 FINALIST 2: Dr. Priya Sharma
### Linear Attention YOLO Implementation

```python
#!/usr/bin/env python3
"""
BAHB Linear Attention YOLO for DJI Manifold 3
Dr. Priya Sharma - Code Forge 2026 Finals

O(N) attention mechanism for efficient detection
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, List, Optional
import math


class LinearAttention(nn.Module):
    """
    Linear complexity attention mechanism.

    Reduces O(N²) to O(N) using kernel feature maps.
    Critical for high-resolution infrastructure detection.
    """

    def __init__(
        self,
        dim: int,
        heads: int = 8,
        dim_head: int = 64,
        dropout: float = 0.0,
    ):
        super().__init__()
        self.heads = heads
        self.dim_head = dim_head
        self.scale = dim_head ** -0.5
        inner_dim = heads * dim_head

        self.to_qkv = nn.Linear(dim, inner_dim * 3, bias=False)
        self.to_out = nn.Sequential(
            nn.Linear(inner_dim, dim),
            nn.Dropout(dropout),
        )

        # Learnable temperature for attention sharpening
        self.temperature = nn.Parameter(torch.ones(1))

    def feature_map(self, x: torch.Tensor) -> torch.Tensor:
        """
        ELU-based feature map for linear attention.

        φ(x) = elu(x) + 1 ensures non-negative features
        """
        return F.elu(x) + 1

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, n, _ = x.shape
        h = self.heads

        # Project to Q, K, V
        qkv = self.to_qkv(x).chunk(3, dim=-1)
        q, k, v = map(
            lambda t: t.view(b, n, h, self.dim_head).transpose(1, 2),
            qkv
        )

        # Apply feature map (makes attention linear)
        q = self.feature_map(q * self.temperature)
        k = self.feature_map(k)

        # Linear attention computation
        # Instead of: softmax(Q @ K^T) @ V  [O(N²)]
        # We compute: Q @ (K^T @ V)         [O(N)]

        # K^T @ V: (b, h, d, d)
        kv = torch.einsum('bhnd,bhne->bhde', k, v)

        # Q @ (K^T @ V): (b, h, n, d)
        out = torch.einsum('bhnd,bhde->bhne', q, kv)

        # Normalize by sum of keys
        k_sum = k.sum(dim=2, keepdim=True)  # (b, h, 1, d)
        normalizer = torch.einsum('bhnd,bhkd->bhn', q, k_sum)
        normalizer = normalizer.unsqueeze(-1) + 1e-6

        out = out / normalizer

        # Reshape and project
        out = out.transpose(1, 2).reshape(b, n, -1)
        return self.to_out(out)


class EfficientC2PSA(nn.Module):
    """
    Efficient C2PSA block with linear attention.

    Replaces quadratic self-attention in YOLO11's C2PSA
    with O(N) linear attention.
    """

    def __init__(
        self,
        c1: int,
        c2: int,
        n: int = 1,
        e: float = 0.5,
    ):
        super().__init__()
        self.c = int(c2 * e)
        self.cv1 = Conv(c1, 2 * self.c, 1, 1)
        self.cv2 = Conv(2 * self.c, c2, 1, 1)

        self.attention_blocks = nn.ModuleList([
            nn.Sequential(
                nn.LayerNorm(self.c),
                LinearAttention(self.c, heads=4, dim_head=self.c // 4),
            )
            for _ in range(n)
        ])

        self.ffn_blocks = nn.ModuleList([
            nn.Sequential(
                nn.LayerNorm(self.c),
                nn.Linear(self.c, self.c * 4),
                nn.GELU(),
                nn.Linear(self.c * 4, self.c),
            )
            for _ in range(n)
        ])

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Split into two branches
        a, b = self.cv1(x).chunk(2, dim=1)

        # Reshape for attention: (B, C, H, W) -> (B, H*W, C)
        B, C, H, W = a.shape
        a_flat = a.flatten(2).transpose(1, 2)

        # Apply attention + FFN blocks
        for attn, ffn in zip(self.attention_blocks, self.ffn_blocks):
            a_flat = a_flat + attn(a_flat)
            a_flat = a_flat + ffn(a_flat)

        # Reshape back: (B, H*W, C) -> (B, C, H, W)
        a = a_flat.transpose(1, 2).view(B, C, H, W)

        # Combine and project
        return self.cv2(torch.cat([a, b], dim=1))


class Conv(nn.Module):
    """Standard convolution with BatchNorm and activation."""

    def __init__(self, c1, c2, k=1, s=1, p=None, g=1, act=True):
        super().__init__()
        self.conv = nn.Conv2d(
            c1, c2, k, s,
            autopad(k, p),
            groups=g,
            bias=False
        )
        self.bn = nn.BatchNorm2d(c2)
        self.act = nn.SiLU() if act else nn.Identity()

    def forward(self, x):
        return self.act(self.bn(self.conv(x)))


def autopad(k, p=None):
    if p is None:
        p = k // 2 if isinstance(k, int) else [x // 2 for x in k]
    return p


class LinearAttentionYOLO(nn.Module):
    """
    YOLO11l with linear attention replacing C2PSA.

    Architecture modifications:
    - Replace all C2PSA blocks with EfficientC2PSA
    - Add linear attention cross-scale fusion
    - Maintain detection head unchanged
    """

    def __init__(self, num_classes: int = 17):
        super().__init__()

        # Backbone (unchanged from YOLO11l)
        self.backbone = nn.Sequential(
            Conv(3, 64, 3, 2),          # P1/2
            Conv(64, 128, 3, 2),        # P2/4
            C3k2(128, 256, 2, True),
            Conv(256, 256, 3, 2),       # P3/8
            C3k2(256, 512, 2, True),
            Conv(512, 512, 3, 2),       # P4/16
            C3k2(512, 512, 2, True),
            Conv(512, 512, 3, 2),       # P5/32
            C3k2(512, 512, 2, True),
            SPPF(512, 512, 5),
            EfficientC2PSA(512, 512, 2),  # Linear attention here
        )

        # Neck with linear attention fusion
        self.neck = LinearAttentionNeck(
            in_channels=[256, 512, 512],
            out_channels=[256, 512, 512],
        )

        # Detection head (unchanged)
        self.head = DetectHead(
            num_classes=num_classes,
            channels=[256, 512, 512],
        )

    def forward(self, x: torch.Tensor) -> dict:
        # Backbone features
        features = []
        for i, layer in enumerate(self.backbone):
            x = layer(x)
            if i in [4, 6, 10]:  # P3, P4, P5
                features.append(x)

        # Neck with cross-scale attention
        neck_features = self.neck(features)

        # Detection head
        return self.head(neck_features)


class LinearAttentionNeck(nn.Module):
    """FPN/PAN neck with linear attention cross-scale fusion."""

    def __init__(
        self,
        in_channels: List[int],
        out_channels: List[int],
    ):
        super().__init__()

        # Top-down pathway (FPN)
        self.lateral_convs = nn.ModuleList([
            Conv(in_c, out_c, 1)
            for in_c, out_c in zip(in_channels, out_channels)
        ])

        # Cross-scale attention (replaces simple addition)
        self.cross_attention = nn.ModuleList([
            CrossScaleLinearAttention(out_channels[i], out_channels[i-1])
            for i in range(1, len(out_channels))
        ])

        # Bottom-up pathway (PAN)
        self.downsample_convs = nn.ModuleList([
            Conv(out_c, out_c, 3, 2)
            for out_c in out_channels[:-1]
        ])

        self.pan_blocks = nn.ModuleList([
            C3k2(out_channels[i] * 2, out_channels[i+1], 2, True)
            for i in range(len(out_channels) - 1)
        ])

    def forward(self, features: List[torch.Tensor]) -> List[torch.Tensor]:
        # Apply lateral convs
        laterals = [
            conv(feat)
            for conv, feat in zip(self.lateral_convs, features)
        ]

        # Top-down with cross-scale attention
        for i in range(len(laterals) - 1, 0, -1):
            upsampled = F.interpolate(
                laterals[i],
                size=laterals[i-1].shape[2:],
                mode='nearest'
            )
            # Cross-scale attention instead of simple add
            laterals[i-1] = self.cross_attention[i-1](
                laterals[i-1], upsampled
            )

        # Bottom-up (PAN)
        outputs = [laterals[0]]
        for i in range(len(laterals) - 1):
            downsampled = self.downsample_convs[i](outputs[-1])
            fused = torch.cat([downsampled, laterals[i+1]], dim=1)
            outputs.append(self.pan_blocks[i](fused))

        return outputs


class CrossScaleLinearAttention(nn.Module):
    """Cross-scale feature fusion using linear attention."""

    def __init__(self, dim1: int, dim2: int):
        super().__init__()

        self.proj1 = nn.Linear(dim1, dim1)
        self.proj2 = nn.Linear(dim2, dim1)

        self.attention = LinearAttention(dim1, heads=4)

        self.gate = nn.Sequential(
            nn.Linear(dim1 * 2, dim1),
            nn.Sigmoid(),
        )

    def forward(
        self,
        x1: torch.Tensor,  # Current scale
        x2: torch.Tensor,  # Upsampled from higher scale
    ) -> torch.Tensor:
        B, C, H, W = x1.shape

        # Flatten spatial dimensions
        x1_flat = x1.flatten(2).transpose(1, 2)  # (B, H*W, C)
        x2_flat = x2.flatten(2).transpose(1, 2)

        # Project
        x1_proj = self.proj1(x1_flat)
        x2_proj = self.proj2(x2_flat)

        # Concatenate and apply attention
        combined = torch.cat([x1_proj, x2_proj], dim=1)  # (B, 2*H*W, C)
        attended = self.attention(combined)

        # Split and gate
        att1, att2 = attended.chunk(2, dim=1)
        gate_input = torch.cat([att1, att2], dim=-1)
        gate = self.gate(gate_input)

        # Weighted combination
        out = gate * att1 + (1 - gate) * x1_flat

        # Reshape back
        return out.transpose(1, 2).view(B, C, H, W)


# Benchmark results
BENCHMARK_RESULTS = """
╔══════════════════════════════════════════════════════════════════════════════╗
║  DR. PRIYA SHARMA - LINEAR ATTENTION BENCHMARK RESULTS                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Hardware: DJI Manifold 3 (Jetson Orin NX)                                   ║
║  Power Mode: 15W                                                              ║
║  Image Size: 1280×720                                                         ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ATTENTION COMPARISON                                                   │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │                        Standard          Linear                         │ ║
║  │  Attention FLOPs:      849B ops    →     1.8M ops   (99.99% reduction) │ ║
║  │  Attention Memory:     3.4 GB      →     8.2 MB     (99.76% reduction) │ ║
║  │  Attention Latency:    12.4ms      →     0.4ms      (96.8% reduction)  │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  OVERALL PERFORMANCE                                                    │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Total Inference:  6.4ms (FP16)                                        │ ║
║  │  Total Inference:  4.2ms (INT8)                                        │ ║
║  │  Throughput:       156 FPS (FP16) / 238 FPS (INT8)                     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ACCURACY METRICS (Improved!)                                           │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  mAP@50:       97.8%  (vs 98.8% baseline, +0.5% vs standard C2PSA)     │ ║
║  │  mAP@50-95:    84.1%  (vs 83.8% baseline, +0.3%)                       │ ║
║  │  Precision:    97.2%                                                    │ ║
║  │  Recall:       96.1%                                                    │ ║
║  │                                                                         │ ║
║  │  Note: Linear attention actually IMPROVES accuracy on infrastructure   │ ║
║  │        detection due to better global context modeling.                 │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  POWER & THERMAL                                                        │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Average Power:    11.8W (@ 15W mode)                                  │ ║
║  │  GPU Utilization:  78%                                                  │ ║
║  │  Temperature:      54°C (sustained)                                     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

if __name__ == "__main__":
    print(BENCHMARK_RESULTS)

    # Quick test
    model = LinearAttentionYOLO(num_classes=17)
    x = torch.randn(1, 3, 720, 1280)

    with torch.no_grad():
        out = model(x)

    print(f"\nModel parameters: {sum(p.numel() for p in model.parameters()):,}")
```

**Judge Comments - Dr. Priya Sharma:**
- Prof. Webb: "⭐ Brilliant! Linear attention is the future of efficient vision."
- Dr. Okonkwo: "Accuracy improvement is surprising and well-validated."
- Lisa Tanaka: "Global context helps with large infrastructure - makes sense."

---

## 🥉 FINALIST 3: Yuki Hashimoto
### INT4/INT8 Hybrid Quantization Implementation

```python
#!/usr/bin/env python3
"""
BAHB INT4/INT8 Hybrid Quantization for DJI Manifold 3
Yuki Hashimoto - Code Forge 2026 Finals

Layer-wise precision optimization for maximum efficiency
"""

import torch
import torch.nn as nn
from torch.quantization import quantize_dynamic, prepare_qat, convert
import numpy as np
from typing import Dict, List, Tuple
from dataclasses import dataclass
import json


@dataclass
class LayerSensitivity:
    """Sensitivity analysis results for a layer."""
    name: str
    fp32_loss: float
    int8_loss: float
    int4_loss: float
    sensitivity_score: float  # Higher = more sensitive to quantization
    recommended_precision: str


class HybridQuantizer:
    """
    INT4/INT8 hybrid quantization with layer-wise precision selection.

    Strategy:
    - Analyze each layer's sensitivity to quantization
    - Backbone layers (redundant features) → INT4
    - Neck layers (feature fusion) → INT8
    - Head layers (precise detection) → INT8 with higher calibration
    """

    def __init__(self, model: nn.Module, calibration_data: List[torch.Tensor]):
        self.model = model
        self.calibration_data = calibration_data
        self.layer_sensitivities: Dict[str, LayerSensitivity] = {}

    def analyze_sensitivity(self) -> Dict[str, LayerSensitivity]:
        """Analyze quantization sensitivity for each layer."""
        print("Analyzing layer sensitivities...")

        # Get baseline FP32 outputs
        self.model.eval()
        with torch.no_grad():
            fp32_outputs = [self.model(x) for x in self.calibration_data[:100]]

        # Test each layer with different precisions
        for name, module in self.model.named_modules():
            if not isinstance(module, (nn.Conv2d, nn.Linear)):
                continue

            # Test INT8
            int8_loss = self._test_precision(name, module, bits=8, fp32_outputs=fp32_outputs)

            # Test INT4
            int4_loss = self._test_precision(name, module, bits=4, fp32_outputs=fp32_outputs)

            # Calculate sensitivity score
            sensitivity = (int4_loss - int8_loss) / (int8_loss + 1e-6)

            # Recommend precision
            if sensitivity > 0.5:
                precision = "int8"  # Sensitive layer
            elif sensitivity > 0.2:
                precision = "int8"  # Moderately sensitive
            else:
                precision = "int4"  # Can tolerate INT4

            self.layer_sensitivities[name] = LayerSensitivity(
                name=name,
                fp32_loss=0.0,
                int8_loss=int8_loss,
                int4_loss=int4_loss,
                sensitivity_score=sensitivity,
                recommended_precision=precision,
            )

        return self.layer_sensitivities

    def _test_precision(
        self,
        layer_name: str,
        module: nn.Module,
        bits: int,
        fp32_outputs: List
    ) -> float:
        """Test a layer with specific bit precision."""
        # Simulate quantization error
        weight = module.weight.data

        # Calculate scale and zero point
        w_min, w_max = weight.min(), weight.max()
        scale = (w_max - w_min) / (2**bits - 1)
        zero_point = (-w_min / scale).round()

        # Quantize and dequantize
        q_weight = ((weight / scale) + zero_point).round().clamp(0, 2**bits - 1)
        dq_weight = (q_weight - zero_point) * scale

        # Calculate MSE
        mse = ((weight - dq_weight) ** 2).mean().item()
        return mse

    def create_quantization_config(self) -> Dict:
        """Generate optimal quantization configuration."""
        config = {
            "backbone": {"layers": [], "precision": "int4"},
            "neck": {"layers": [], "precision": "int8"},
            "head": {"layers": [], "precision": "int8"},
        }

        for name, sens in self.layer_sensitivities.items():
            if "backbone" in name or any(x in name for x in ["conv1", "conv2", "c3k2"]):
                if sens.recommended_precision == "int4":
                    config["backbone"]["layers"].append(name)
                else:
                    # Move to neck if too sensitive
                    config["neck"]["layers"].append(name)
            elif "neck" in name or "fpn" in name or "pan" in name:
                config["neck"]["layers"].append(name)
            else:
                config["head"]["layers"].append(name)

        return config

    def quantize_model(self, config: Dict) -> nn.Module:
        """Apply hybrid quantization based on config."""
        quantized_model = self.model

        # Apply INT4 to backbone
        for layer_name in config["backbone"]["layers"]:
            module = self._get_module(layer_name)
            if module:
                self._quantize_layer(module, bits=4)

        # Apply INT8 to neck and head
        for section in ["neck", "head"]:
            for layer_name in config[section]["layers"]:
                module = self._get_module(layer_name)
                if module:
                    self._quantize_layer(module, bits=8)

        return quantized_model

    def _get_module(self, name: str) -> nn.Module:
        """Get module by name."""
        parts = name.split('.')
        module = self.model
        for part in parts:
            if hasattr(module, part):
                module = getattr(module, part)
            else:
                return None
        return module

    def _quantize_layer(self, module: nn.Module, bits: int):
        """Quantize a single layer."""
        if not hasattr(module, 'weight'):
            return

        weight = module.weight.data

        # Calculate optimal scale using entropy calibration
        w_min, w_max = weight.min(), weight.max()
        scale = (w_max - w_min) / (2**bits - 1)
        zero_point = (-w_min / scale).round()

        # Store quantization parameters
        module.register_buffer('scale', torch.tensor(scale))
        module.register_buffer('zero_point', torch.tensor(zero_point))
        module.register_buffer('bits', torch.tensor(bits))

        # Quantize weights
        q_weight = ((weight / scale) + zero_point).round().clamp(0, 2**bits - 1)
        module.weight.data = (q_weight - zero_point) * scale


class INT4Conv2d(nn.Module):
    """INT4 quantized convolution for maximum efficiency."""

    def __init__(self, original_conv: nn.Conv2d):
        super().__init__()
        self.in_channels = original_conv.in_channels
        self.out_channels = original_conv.out_channels
        self.kernel_size = original_conv.kernel_size
        self.stride = original_conv.stride
        self.padding = original_conv.padding
        self.groups = original_conv.groups

        # Quantize weights to INT4
        weight = original_conv.weight.data
        self.scale = (weight.max() - weight.min()) / 15  # 4-bit = 16 levels
        self.zero_point = (-weight.min() / self.scale).round().int()

        # Pack INT4 weights (2 weights per byte)
        q_weight = ((weight / self.scale) + self.zero_point).round().clamp(0, 15).to(torch.uint8)
        self.register_buffer('packed_weight', self._pack_int4(q_weight))

        if original_conv.bias is not None:
            self.register_buffer('bias', original_conv.bias.data)
        else:
            self.bias = None

    def _pack_int4(self, weights: torch.Tensor) -> torch.Tensor:
        """Pack two INT4 values into one INT8."""
        # Reshape for packing
        flat = weights.view(-1)
        if len(flat) % 2 != 0:
            flat = torch.cat([flat, torch.zeros(1, dtype=torch.uint8)])

        # Pack pairs
        packed = (flat[0::2] << 4) | flat[1::2]
        return packed.view(weights.shape[0], -1)

    def _unpack_int4(self, packed: torch.Tensor) -> torch.Tensor:
        """Unpack INT4 weights for computation."""
        high = (packed >> 4) & 0x0F
        low = packed & 0x0F
        unpacked = torch.stack([high, low], dim=-1).view(
            self.out_channels, self.in_channels // self.groups, *self.kernel_size
        )
        return unpacked

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Dequantize weights
        weights = self._unpack_int4(self.packed_weight)
        dq_weights = (weights.float() - self.zero_point) * self.scale

        # Compute convolution
        return nn.functional.conv2d(
            x, dq_weights, self.bias,
            self.stride, self.padding, groups=self.groups
        )


# Benchmark results
BENCHMARK_RESULTS = """
╔══════════════════════════════════════════════════════════════════════════════╗
║  YUKI HASHIMOTO - INT4/INT8 HYBRID BENCHMARK RESULTS                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Hardware: DJI Manifold 3 (Jetson Orin NX)                                   ║
║  Power Mode: 15W                                                              ║
║  Image Size: 1280×720                                                         ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  QUANTIZATION BREAKDOWN                                                 │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Backbone (INT4):  62 layers, 8.2MB  → 2.1MB   (74% reduction)         │ ║
║  │  Neck (INT8):      48 layers, 12.4MB → 3.1MB   (75% reduction)         │ ║
║  │  Head (INT8):      24 layers, 4.8MB  → 1.2MB   (75% reduction)         │ ║
║  │  ─────────────────────────────────────────────────                      │ ║
║  │  TOTAL:            134 layers, 25.4MB → 6.4MB  (75% reduction)         │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  LATENCY BREAKDOWN                                                      │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Backbone (INT4):     2.1ms                                            │ ║
║  │  Neck (INT8):         1.8ms                                            │ ║
║  │  Head (INT8):         1.4ms                                            │ ║
║  │  ─────────────────────────────────                                      │ ║
║  │  TOTAL:               5.3ms                                            │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ACCURACY METRICS                                                       │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  mAP@50:       96.2%  (vs 98.8% FP32, -2.6%)                           │ ║
║  │  mAP@50-95:    81.1%  (vs 83.8% FP32, -2.7%)                           │ ║
║  │  Precision:    95.4%                                                    │ ║
║  │  Recall:       94.8%                                                    │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  POWER & THERMAL                                                        │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Average Power:    9.8W (@ 15W mode) - BEST IN CLASS                   │ ║
║  │  GPU Utilization:  52%                                                  │ ║
║  │  Temperature:      48°C (sustained) - COOLEST                          │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  THROUGHPUT: 189 FPS sustained                                                ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

if __name__ == "__main__":
    print(BENCHMARK_RESULTS)
```

**Judge Comments - Yuki Hashimoto:**
- Dr. Chen: "Impressive power efficiency! 9.8W is remarkable for this accuracy."
- Dr. Okonkwo: "INT4 backbone is risky but the sensitivity analysis justifies it."
- Elena Kowalski: "Best thermal profile - critical for sustained drone operations."

---

## 4️⃣ FINALIST 4: Mei-Lin Wu
### Structured Channel Pruning Implementation

```python
#!/usr/bin/env python3
"""
BAHB Structured Channel Pruning for DJI Manifold 3
Mei-Lin Wu - Code Forge 2026 Finals

65% parameter reduction with minimal accuracy loss
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import numpy as np


@dataclass
class PruningConfig:
    """Configuration for structured pruning."""
    target_sparsity: float = 0.65  # 65% channels removed
    warmup_epochs: int = 20
    pruning_epochs: int = 60
    finetune_epochs: int = 20
    importance_metric: str = "taylor"  # "taylor", "magnitude", "gradient"


class TaylorImportanceScorer:
    """
    Compute channel importance using Taylor expansion.

    Importance(c) = |W_c * ∂L/∂W_c|

    This captures both weight magnitude and gradient information,
    indicating how much each channel contributes to the loss.
    """

    def __init__(self, model: nn.Module):
        self.model = model
        self.importance_scores: Dict[str, torch.Tensor] = {}
        self.hooks = []

    def register_hooks(self):
        """Register backward hooks to capture gradients."""
        for name, module in self.model.named_modules():
            if isinstance(module, nn.Conv2d):
                hook = module.register_backward_hook(
                    self._create_hook(name)
                )
                self.hooks.append(hook)
                self.importance_scores[name] = torch.zeros(module.out_channels)

    def _create_hook(self, name: str):
        def hook(module, grad_input, grad_output):
            # Taylor importance: |weight * gradient|
            if module.weight.grad is not None:
                importance = (module.weight * module.weight.grad).abs()
                # Sum over input channels, height, width
                importance = importance.sum(dim=(1, 2, 3))
                self.importance_scores[name] += importance.detach().cpu()
        return hook

    def compute_importance(self, dataloader, num_batches: int = 100):
        """Compute importance scores over calibration data."""
        self.model.train()

        for i, batch in enumerate(dataloader):
            if i >= num_batches:
                break

            images, targets = batch
            outputs = self.model(images)
            loss = self._compute_loss(outputs, targets)
            loss.backward()

        # Normalize scores
        for name in self.importance_scores:
            self.importance_scores[name] /= num_batches

        # Remove hooks
        for hook in self.hooks:
            hook.remove()

        return self.importance_scores

    def _compute_loss(self, outputs, targets):
        """Compute detection loss."""
        # Simplified detection loss
        return outputs['loss'] if isinstance(outputs, dict) else outputs.mean()


class StructuredPruner:
    """
    Structured channel pruning with gradual sparsity scheduling.

    Pruning Schedule:
    - Epochs 1-20:   No pruning (warmup)
    - Epochs 21-40:  Prune to 20% sparsity
    - Epochs 41-60:  Prune to 40% sparsity
    - Epochs 61-80:  Prune to 65% sparsity
    - Epochs 81-100: Fine-tune (no pruning)
    """

    def __init__(self, model: nn.Module, config: PruningConfig):
        self.model = model
        self.config = config
        self.importance_scores: Dict[str, torch.Tensor] = {}
        self.pruned_channels: Dict[str, List[int]] = {}

    def get_sparsity_schedule(self, epoch: int) -> float:
        """Get target sparsity for current epoch."""
        if epoch < self.config.warmup_epochs:
            return 0.0
        elif epoch < self.config.warmup_epochs + self.config.pruning_epochs // 3:
            return self.config.target_sparsity * 0.3
        elif epoch < self.config.warmup_epochs + 2 * self.config.pruning_epochs // 3:
            return self.config.target_sparsity * 0.6
        elif epoch < self.config.warmup_epochs + self.config.pruning_epochs:
            return self.config.target_sparsity
        else:
            return self.config.target_sparsity  # Maintain during fine-tune

    def prune_channels(self, sparsity: float):
        """Remove least important channels up to target sparsity."""
        for name, module in self.model.named_modules():
            if not isinstance(module, nn.Conv2d):
                continue
            if name not in self.importance_scores:
                continue

            scores = self.importance_scores[name]
            num_channels = len(scores)
            num_prune = int(num_channels * sparsity)

            if num_prune == 0:
                continue

            # Find channels to prune (lowest importance)
            _, prune_indices = torch.topk(scores, num_prune, largest=False)
            keep_indices = [i for i in range(num_channels) if i not in prune_indices]

            # Store pruned channels
            self.pruned_channels[name] = prune_indices.tolist()

            # Prune weights
            module.weight.data = module.weight.data[keep_indices]
            if module.bias is not None:
                module.bias.data = module.bias.data[keep_indices]
            module.out_channels = len(keep_indices)

            # Update next layer's input channels
            self._update_dependent_layers(name, keep_indices)

    def _update_dependent_layers(self, pruned_name: str, keep_indices: List[int]):
        """Update layers that depend on the pruned layer."""
        # Find and update BatchNorm
        bn_name = pruned_name.replace('conv', 'bn')
        for name, module in self.model.named_modules():
            if name == bn_name and isinstance(module, nn.BatchNorm2d):
                module.weight.data = module.weight.data[keep_indices]
                module.bias.data = module.bias.data[keep_indices]
                module.running_mean = module.running_mean[keep_indices]
                module.running_var = module.running_var[keep_indices]
                module.num_features = len(keep_indices)

    def create_pruned_model(self) -> nn.Module:
        """Create a new model with pruned architecture."""
        # This would create a compact model without zero channels
        # Implementation depends on model architecture
        return self.model


class GradualPruningTrainer:
    """Training loop with gradual pruning."""

    def __init__(
        self,
        model: nn.Module,
        pruner: StructuredPruner,
        optimizer: torch.optim.Optimizer,
        dataloader,
    ):
        self.model = model
        self.pruner = pruner
        self.optimizer = optimizer
        self.dataloader = dataloader

    def train_epoch(self, epoch: int) -> Dict[str, float]:
        """Train one epoch with pruning."""
        self.model.train()

        # Get current sparsity target
        target_sparsity = self.pruner.get_sparsity_schedule(epoch)

        # Update importance scores periodically
        if epoch % 5 == 0 and target_sparsity > 0:
            scorer = TaylorImportanceScorer(self.model)
            scorer.register_hooks()
            self.pruner.importance_scores = scorer.compute_importance(
                self.dataloader, num_batches=50
            )

        # Apply pruning
        if target_sparsity > 0:
            self.pruner.prune_channels(target_sparsity)

        # Standard training loop
        total_loss = 0
        for batch in self.dataloader:
            self.optimizer.zero_grad()

            images, targets = batch
            outputs = self.model(images)
            loss = self._compute_loss(outputs, targets)

            loss.backward()
            self.optimizer.step()

            total_loss += loss.item()

        return {
            "loss": total_loss / len(self.dataloader),
            "sparsity": target_sparsity,
            "params": sum(p.numel() for p in self.model.parameters()),
        }

    def _compute_loss(self, outputs, targets):
        return outputs['loss'] if isinstance(outputs, dict) else outputs.mean()


# Benchmark results
BENCHMARK_RESULTS = """
╔══════════════════════════════════════════════════════════════════════════════╗
║  MEI-LIN WU - STRUCTURED PRUNING BENCHMARK RESULTS                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Hardware: DJI Manifold 3 (Jetson Orin NX)                                   ║
║  Power Mode: 15W                                                              ║
║  Image Size: 1280×720                                                         ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  PRUNING RESULTS                                                        │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Original Parameters:  25.3M                                           │ ║
║  │  Pruned Parameters:    8.7M    (65.6% reduction)                       │ ║
║  │  Original GFLOPs:      87.3                                            │ ║
║  │  Pruned GFLOPs:        29.4    (66.3% reduction)                       │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  LATENCY                                                                │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  FP16 Inference:   5.9ms                                               │ ║
║  │  INT8 Inference:   3.8ms                                               │ ║
║  │  Throughput:       169 FPS (FP16) / 263 FPS (INT8)                     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ACCURACY METRICS                                                       │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  mAP@50:       95.9%  (vs 98.8% FP32, -2.9%)                           │ ║
║  │  mAP@50-95:    80.8%  (vs 83.8% FP32, -3.0%)                           │ ║
║  │  Precision:    95.1%                                                    │ ║
║  │  Recall:       94.2%                                                    │ ║
║  │                                                                         │ ║
║  │  Note: Taylor importance scoring preserves critical detection          │ ║
║  │        channels while aggressively pruning redundant features.         │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  POWER & THERMAL                                                        │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Average Power:    10.4W (@ 15W mode)                                  │ ║
║  │  GPU Utilization:  61%                                                  │ ║
║  │  Temperature:      51°C (sustained)                                     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  KEY ADVANTAGE: Simple implementation, no custom ops required                 ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

if __name__ == "__main__":
    print(BENCHMARK_RESULTS)
```

**Judge Comments - Mei-Lin Wu:**
- Dr. Okonkwo: "⭐ Best practicality score - this can be deployed immediately."
- Lisa Tanaka: "Clean approach. Taylor importance is well-established."
- Elena Kowalski: "65% reduction with 3% mAP drop is acceptable for many use cases."

---

## 5️⃣ FINALIST 5: Fatima Al-Hassan
### Temporal Frame Optimization Implementation

```python
#!/usr/bin/env python3
"""
BAHB Temporal Frame Optimization for DJI Manifold 3
Fatima Al-Hassan - Code Forge 2026 Finals

68% power savings through intelligent frame skipping
"""

import torch
import numpy as np
import cv2
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from collections import deque
import time


@dataclass
class TrackingConfig:
    """Configuration for temporal optimization."""
    motion_threshold: float = 0.08  # Optical flow magnitude threshold
    max_skip_frames: int = 4        # Maximum frames between full inference
    min_confidence: float = 0.3     # Minimum tracking confidence
    iou_threshold: float = 0.5      # IoU threshold for track matching
    max_age: int = 10               # Maximum frames to keep lost tracks


class KalmanTracker:
    """
    Kalman filter for bounding box tracking.

    State: [x, y, w, h, vx, vy, vw, vh]
    Measurement: [x, y, w, h]
    """

    def __init__(self, bbox: np.ndarray):
        # State transition matrix
        self.F = np.array([
            [1, 0, 0, 0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0, 0, 0, 1],
            [0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 1],
        ], dtype=np.float32)

        # Measurement matrix
        self.H = np.array([
            [1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0],
        ], dtype=np.float32)

        # Initialize state
        self.x = np.zeros(8, dtype=np.float32)
        self.x[:4] = bbox

        # Covariance matrices
        self.P = np.eye(8, dtype=np.float32) * 10
        self.Q = np.eye(8, dtype=np.float32) * 0.1  # Process noise
        self.R = np.eye(4, dtype=np.float32) * 1    # Measurement noise

        self.age = 0
        self.hits = 1
        self.time_since_update = 0

    def predict(self) -> np.ndarray:
        """Predict next state."""
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q
        self.age += 1
        self.time_since_update += 1
        return self.x[:4]

    def update(self, bbox: np.ndarray):
        """Update state with measurement."""
        y = bbox - self.H @ self.x  # Innovation
        S = self.H @ self.P @ self.H.T + self.R  # Innovation covariance
        K = self.P @ self.H.T @ np.linalg.inv(S)  # Kalman gain

        self.x = self.x + K @ y
        self.P = (np.eye(8) - K @ self.H) @ self.P

        self.hits += 1
        self.time_since_update = 0

    def get_bbox(self) -> np.ndarray:
        """Get current bounding box estimate."""
        return self.x[:4]


class MotionEstimator:
    """Estimate frame motion using optical flow."""

    def __init__(self):
        self.prev_frame = None
        self.flow_params = dict(
            pyr_scale=0.5,
            levels=3,
            winsize=15,
            iterations=3,
            poly_n=5,
            poly_sigma=1.2,
            flags=0,
        )

    def compute_motion(self, frame: np.ndarray) -> Tuple[float, np.ndarray]:
        """
        Compute motion magnitude and flow field.

        Returns:
            motion_magnitude: Average flow magnitude
            flow: Optical flow field (H, W, 2)
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        if self.prev_frame is None:
            self.prev_frame = gray
            return float('inf'), np.zeros((*gray.shape, 2))

        # Compute optical flow
        flow = cv2.calcOpticalFlowFarneback(
            self.prev_frame, gray, None, **self.flow_params
        )

        # Calculate magnitude
        magnitude = np.sqrt(flow[..., 0]**2 + flow[..., 1]**2)
        avg_motion = magnitude.mean()

        self.prev_frame = gray
        return avg_motion, flow


class TemporalOptimizer:
    """
    Intelligent frame skipping with tracking.

    Strategy:
    - Run full detection on keyframes
    - Use Kalman tracking for intermediate frames
    - Trigger new keyframe on high motion or tracking failure
    """

    def __init__(self, detector, config: TrackingConfig):
        self.detector = detector
        self.config = config
        self.motion_estimator = MotionEstimator()
        self.trackers: Dict[int, KalmanTracker] = {}
        self.next_track_id = 0
        self.frames_since_detection = 0
        self.last_detections = []

    def process_frame(self, frame: np.ndarray) -> Dict:
        """Process a single frame with temporal optimization."""
        start_time = time.perf_counter()

        # Compute motion
        motion, flow = self.motion_estimator.compute_motion(frame)

        # Decide: full detection or tracking update?
        need_detection = self._should_detect(motion)

        if need_detection:
            # Full YOLO inference
            detections = self.detector(frame)
            self._update_trackers(detections)
            self.frames_since_detection = 0
            self.last_detections = detections
            mode = "detection"
        else:
            # Predict using Kalman trackers
            detections = self._predict_tracks(flow)
            self.frames_since_detection += 1
            mode = "tracking"

        inference_time = (time.perf_counter() - start_time) * 1000

        return {
            'detections': detections,
            'mode': mode,
            'motion': motion,
            'inference_ms': inference_time,
            'power_saved': mode == "tracking",
        }

    def _should_detect(self, motion: float) -> bool:
        """Determine if full detection is needed."""
        # Always detect on first frame
        if self.frames_since_detection == 0 and not self.trackers:
            return True

        # High motion triggers detection
        if motion > self.config.motion_threshold:
            return True

        # Maximum frame skip reached
        if self.frames_since_detection >= self.config.max_skip_frames:
            return True

        # Low tracking confidence
        if self._get_tracking_confidence() < self.config.min_confidence:
            return True

        return False

    def _get_tracking_confidence(self) -> float:
        """Calculate overall tracking confidence."""
        if not self.trackers:
            return 0.0

        confidences = []
        for tracker in self.trackers.values():
            # Confidence decreases with time since update
            conf = 1.0 / (1.0 + tracker.time_since_update * 0.2)
            confidences.append(conf)

        return np.mean(confidences)

    def _update_trackers(self, detections: List[Dict]):
        """Update trackers with new detections."""
        # Match detections to existing tracks using IoU
        matched, unmatched_dets, unmatched_tracks = self._match_detections(
            detections
        )

        # Update matched trackers
        for track_id, det_idx in matched:
            bbox = detections[det_idx]['bbox']
            self.trackers[track_id].update(np.array(bbox))

        # Create new trackers for unmatched detections
        for det_idx in unmatched_dets:
            bbox = detections[det_idx]['bbox']
            self.trackers[self.next_track_id] = KalmanTracker(np.array(bbox))
            self.next_track_id += 1

        # Remove old unmatched tracks
        for track_id in unmatched_tracks:
            if self.trackers[track_id].time_since_update > self.config.max_age:
                del self.trackers[track_id]

    def _match_detections(self, detections: List[Dict]):
        """Match detections to existing tracks using IoU."""
        if not self.trackers or not detections:
            return [], list(range(len(detections))), list(self.trackers.keys())

        # Compute IoU matrix
        track_ids = list(self.trackers.keys())
        iou_matrix = np.zeros((len(track_ids), len(detections)))

        for i, track_id in enumerate(track_ids):
            track_bbox = self.trackers[track_id].get_bbox()
            for j, det in enumerate(detections):
                iou_matrix[i, j] = self._compute_iou(track_bbox, det['bbox'])

        # Hungarian matching (simplified greedy version)
        matched = []
        unmatched_dets = list(range(len(detections)))
        unmatched_tracks = list(track_ids)

        while iou_matrix.size > 0:
            max_idx = np.unravel_index(iou_matrix.argmax(), iou_matrix.shape)
            if iou_matrix[max_idx] < self.config.iou_threshold:
                break

            track_id = track_ids[max_idx[0]]
            det_idx = max_idx[1]

            matched.append((track_id, det_idx))
            unmatched_dets.remove(det_idx)
            unmatched_tracks.remove(track_id)

            iou_matrix = np.delete(iou_matrix, max_idx[0], axis=0)
            iou_matrix = np.delete(iou_matrix, max_idx[1], axis=1)
            track_ids.pop(max_idx[0])

        return matched, unmatched_dets, unmatched_tracks

    def _compute_iou(self, bbox1: np.ndarray, bbox2: List[float]) -> float:
        """Compute IoU between two bounding boxes."""
        x1, y1, w1, h1 = bbox1
        x2, y2, w2, h2 = bbox2

        # Convert to corners
        box1 = [x1, y1, x1 + w1, y1 + h1]
        box2 = [x2, y2, x2 + w2, y2 + h2]

        # Intersection
        xi1 = max(box1[0], box2[0])
        yi1 = max(box1[1], box2[1])
        xi2 = min(box1[2], box2[2])
        yi2 = min(box1[3], box2[3])

        inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)

        # Union
        box1_area = w1 * h1
        box2_area = w2 * h2
        union_area = box1_area + box2_area - inter_area

        return inter_area / (union_area + 1e-6)

    def _predict_tracks(self, flow: np.ndarray) -> List[Dict]:
        """Predict track positions using Kalman filter."""
        predictions = []

        for track_id, tracker in self.trackers.items():
            bbox = tracker.predict()

            # Optionally adjust prediction using optical flow
            cx, cy = int(bbox[0] + bbox[2]/2), int(bbox[1] + bbox[3]/2)
            if 0 <= cy < flow.shape[0] and 0 <= cx < flow.shape[1]:
                flow_vec = flow[cy, cx]
                bbox[0] += flow_vec[0]
                bbox[1] += flow_vec[1]

            predictions.append({
                'bbox': bbox.tolist(),
                'track_id': track_id,
                'confidence': 1.0 / (1.0 + tracker.time_since_update * 0.2),
                'class_id': 0,  # Would need to store from detection
            })

        return predictions


# Benchmark results
BENCHMARK_RESULTS = """
╔══════════════════════════════════════════════════════════════════════════════╗
║  FATIMA AL-HASSAN - TEMPORAL OPTIMIZATION BENCHMARK RESULTS                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Hardware: DJI Manifold 3 (Jetson Orin NX)                                   ║
║  Power Mode: 15W                                                              ║
║  Image Size: 1280×720                                                         ║
║  Test Video: Infrastructure inspection flight (30 min)                        ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  FRAME PROCESSING STATISTICS                                            │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Total Frames:        54,000 (30 min @ 30fps)                          │ ║
║  │  Full Detection:      13,500 (25%)                                     │ ║
║  │  Tracking Only:       40,500 (75%)                                     │ ║
║  │  Avg Skip:            3.2 frames                                       │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  LATENCY                                                                │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Detection Frame:     8.2ms                                            │ ║
║  │  Tracking Frame:      0.5ms                                            │ ║
║  │  Average Frame:       2.4ms  (weighted by frame type)                  │ ║
║  │  Effective FPS:       416 FPS (theoretical max)                        │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ACCURACY METRICS                                                       │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Detection mAP@50:    98.8%  (keyframes only)                          │ ║
║  │  Tracking MOTA:       94.2%  (Multi-Object Tracking Accuracy)          │ ║
║  │  ID Switches:         0.3%                                              │ ║
║  │  Overall Accuracy:    94.2%  (vs 98.8% full inference every frame)     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  POWER & BATTERY                                                        │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │  Average Power:       4.8W  (@ 15W mode) - 68% SAVINGS                 │ ║
║  │  vs Full Inference:   15.2W                                            │ ║
║  │  Battery Extension:   +45 min flight time on M30 series                │ ║
║  │  Temperature:         42°C (sustained) - COOLEST                       │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  BEST FOR: Long-duration inspection flights with power constraints            ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

if __name__ == "__main__":
    print(BENCHMARK_RESULTS)
```

**Judge Comments - Fatima Al-Hassan:**
- Elena Kowalski: "⭐ 68% power savings is transformative for drone operations!"
- Lisa Tanaka: "Brilliant for inspection workflows. The 4.6% accuracy trade-off is worth it."
- Dr. Chen: "Kalman tracking is lightweight but effective. Great systems thinking."

---

# 🏆 FINAL JUDGING ROUND

## Finalist Comparison Matrix

| Metric | Viktor S. | Dr. Priya S. | Yuki H. | Mei-Lin W. | Fatima A. |
|--------|-----------|--------------|---------|------------|-----------|
| **Latency (ms)** | 5.8 | 6.4 | 5.3 | 5.9 | 2.4 avg |
| **mAP@50** | 97.2% | 97.8% | 96.2% | 95.9% | 94.2% |
| **Power (W)** | 12.3 | 11.8 | 9.8 | 10.4 | 4.8 |
| **Model Size** | 25.3MB | 25.3MB | 6.4MB | 8.7MB | 25.3MB |
| **Complexity** | High | Medium | Medium | Low | Medium |

## Final Round Scores (Out of 100)

### Judge: Dr. Sarah Chen (NVIDIA DLI)
| Finalist | Technical | Innovation | Practicality | Manifold 3 Fit | Total |
|----------|-----------|------------|--------------|----------------|-------|
| Viktor Sorokin | 28/30 | 24/25 | 22/25 | 19/20 | **93** |
| Dr. Priya Sharma | 27/30 | 25/25 | 21/25 | 18/20 | **91** |
| Yuki Hashimoto | 26/30 | 23/25 | 20/25 | 20/20 | **89** |
| Mei-Lin Wu | 24/30 | 20/25 | 24/25 | 18/20 | **86** |
| Fatima Al-Hassan | 23/30 | 22/25 | 23/25 | 19/20 | **87** |

### Judge: Prof. Marcus Webb (MIT CSAIL)
| Finalist | Technical | Innovation | Practicality | Manifold 3 Fit | Total |
|----------|-----------|------------|--------------|----------------|-------|
| Viktor Sorokin | 27/30 | 23/25 | 23/25 | 19/20 | **92** |
| Dr. Priya Sharma | 29/30 | 25/25 | 21/25 | 18/20 | **93** |
| Yuki Hashimoto | 25/30 | 22/25 | 21/25 | 19/20 | **87** |
| Mei-Lin Wu | 24/30 | 20/25 | 24/25 | 17/20 | **85** |
| Fatima Al-Hassan | 24/30 | 21/25 | 22/25 | 18/20 | **85** |

### Judge: Elena Kowalski (DJI Enterprise R&D)
| Finalist | Technical | Innovation | Practicality | Manifold 3 Fit | Total |
|----------|-----------|------------|--------------|----------------|-------|
| **Viktor Sorokin** | 29/30 | 24/25 | 24/25 | 20/20 | **⭐97** |
| Dr. Priya Sharma | 26/30 | 24/25 | 21/25 | 18/20 | **89** |
| Yuki Hashimoto | 26/30 | 22/25 | 22/25 | 20/20 | **90** |
| Mei-Lin Wu | 25/30 | 20/25 | 25/25 | 18/20 | **88** |
| Fatima Al-Hassan | 25/30 | 23/25 | 24/25 | 19/20 | **91** |

### Judge: Dr. James Okonkwo (Google DeepMind)
| Finalist | Technical | Innovation | Practicality | Manifold 3 Fit | Total |
|----------|-----------|------------|--------------|----------------|-------|
| Viktor Sorokin | 27/30 | 23/25 | 22/25 | 18/20 | **90** |
| **Dr. Priya Sharma** | 28/30 | 25/25 | 22/25 | 18/20 | **⭐93** |
| Yuki Hashimoto | 27/30 | 24/25 | 21/25 | 19/20 | **91** |
| Mei-Lin Wu | 26/30 | 21/25 | 25/25 | 17/20 | **89** |
| Fatima Al-Hassan | 24/30 | 22/25 | 23/25 | 17/20 | **86** |

### Judge: Lisa Tanaka (Skydio Autonomy Team)
| Finalist | Technical | Innovation | Practicality | Manifold 3 Fit | Total |
|----------|-----------|------------|--------------|----------------|-------|
| Viktor Sorokin | 28/30 | 24/25 | 23/25 | 19/20 | **94** |
| Dr. Priya Sharma | 27/30 | 25/25 | 21/25 | 18/20 | **91** |
| Yuki Hashimoto | 25/30 | 22/25 | 21/25 | 19/20 | **87** |
| Mei-Lin Wu | 24/30 | 20/25 | 24/25 | 18/20 | **86** |
| **Fatima Al-Hassan** | 26/30 | 23/25 | 24/25 | 19/20 | **⭐92** |

---

## 📊 FINAL AGGREGATE SCORES

| Rank | Finalist | Avg Score | Judges Voting |
|------|----------|-----------|---------------|
| 🥇 | **Viktor Sorokin** | **93.2** | 2 first-place votes |
| 🥈 | **Dr. Priya Sharma** | **91.4** | 2 first-place votes |
| 🥉 | **Yuki Hashimoto** | **88.8** | 0 first-place votes |
| 4 | Fatima Al-Hassan | 88.2 | 1 first-place vote |
| 5 | Mei-Lin Wu | 86.8 | 0 first-place votes |

---

# 🏆🏆🏆 WINNER ANNOUNCEMENT 🏆🏆🏆

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ██╗    ██╗██╗███╗   ██╗███╗   ██╗███████╗██████╗                           ║
║   ██║    ██║██║████╗  ██║████╗  ██║██╔════╝██╔══██╗                          ║
║   ██║ █╗ ██║██║██╔██╗ ██║██╔██╗ ██║█████╗  ██████╔╝                          ║
║   ██║███╗██║██║██║╚██╗██║██║╚██╗██║██╔══╝  ██╔══██╗                          ║
║   ╚███╔███╔╝██║██║ ╚████║██║ ╚████║███████╗██║  ██║                          ║
║    ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝                          ║
║                                                                               ║
║                     🏆 VIKTOR SOROKIN 🏆                                      ║
║                                                                               ║
║              TensorRT DLA Pipeline Optimization                               ║
║                                                                               ║
║   "Exemplary use of Orin NX hardware capabilities. This implementation       ║
║    demonstrates production-ready code that perfectly matches DJI's           ║
║    internal optimization patterns. The dual DLA + GPU pipeline achieves      ║
║    best-in-class latency while maintaining high accuracy."                   ║
║                                                                               ║
║                    — Elena Kowalski, DJI Enterprise R&D                       ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   WINNING SOLUTION HIGHLIGHTS:                                                ║
║   ┌─────────────────────────────────────────────────────────────────────────┐║
║   │  • Inference Latency:  5.8ms @ 1280×720                                │║
║   │  • Accuracy:           mAP@50 = 97.2%                                  │║
║   │  • Power Efficiency:   12.3W @ 15W mode                                │║
║   │  • Throughput:         172 FPS theoretical, 156 FPS sustained          │║
║   │  • DLA Utilization:    89% (DLA0), 76% (DLA1)                          │║
║   │  • GPU Utilization:    34% (available for other tasks)                 │║
║   └─────────────────────────────────────────────────────────────────────────┘║
║                                                                               ║
║   KEY INNOVATIONS:                                                            ║
║   1. Dual DLA offload for backbone and head                                  ║
║   2. GPU-accelerated neck with kernel fusion                                 ║
║   3. Async pipelined inference with CUDA streams                            ║
║   4. Production-ready TensorRT engine builder                                ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## 🥈 Runner-Up: Dr. Priya Sharma

**Linear Attention YOLO** - A close second with innovative O(N) attention that actually **improves** accuracy while reducing computational cost. Her approach represents the future of efficient vision transformers.

## 🥉 Third Place: Yuki Hashimoto

**INT4/INT8 Hybrid Quantization** - Best power efficiency (9.8W) and smallest model size (6.4MB). Ideal for power-constrained deployments.

---

## Honorable Mentions

**Fatima Al-Hassan** - Temporal optimization with 68% power savings is transformative for long-duration inspection flights. Her approach is complementary to any of the top solutions.

**Mei-Lin Wu** - Best practicality score. Her structured pruning can be implemented immediately without custom operators.

---

## 📋 RECOMMENDED DEPLOYMENT STRATEGY

For production BAHB deployment on DJI Manifold 3, we recommend:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  OPTIMAL DEPLOYMENT: Viktor's DLA Pipeline + Fatima's Temporal Optimization │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Use Viktor's DLA pipeline for keyframe detection                       │
│     - 5.8ms inference with 97.2% mAP                                       │
│     - Dual DLA offload maximizes hardware utilization                      │
│                                                                             │
│  2. Add Fatima's temporal tracking for intermediate frames                  │
│     - Run full detection every 3-4 frames                                  │
│     - Track objects with Kalman filter between detections                  │
│                                                                             │
│  3. Combined Performance:                                                   │
│     - Average latency: ~2.5ms per frame                                    │
│     - Power consumption: ~7W (54% savings)                                 │
│     - Accuracy: 96.5% (tracking + detection weighted)                      │
│     - Flight time extension: +30 minutes                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Competition Complete

**Total Duration:** 4 hours 23 minutes
**Submissions Reviewed:** 10 initial + 5 final implementations
**Lines of Code Evaluated:** 4,200+
**Judge Hours:** 25 cumulative

Thank you to all contestants and judges for an exceptional competition!

---
*Code Forge 2026 - BAHB Infrastructure Detection Challenge*
*Organized by: BAHB Development Team*
*Sponsored by: DJI Enterprise*

