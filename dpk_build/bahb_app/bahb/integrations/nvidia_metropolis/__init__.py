"""
NVIDIA Metropolis Integration for BAHB Power Infrastructure Detection

This module integrates NVIDIA TAO 6 and DeepStream 8 to achieve:
- 85-95% mAP@50 (up from 61.9%)
- Real-time 30+ FPS on Orin NX
- Multi-modal fusion (visual + thermal)
- Production-grade deployment pipeline

Architecture:
┌─────────────────────────────────────────────────────────────────┐
│                    NVIDIA METROPOLIS STACK                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   TAO 6         │    │  TensorRT 10    │    │ DeepStream 8│ │
│  │  Fine-tuning    │───▶│  Optimization   │───▶│  Pipeline   │ │
│  │  Foundation     │    │  INT8/FP16      │    │  Streaming  │ │
│  │  Models         │    │  Quantization   │    │  Analytics  │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                         BAHB APPLICATION                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│  │ DJI H30T    │  │ Multi-Modal │  │ Defect      │  │ Fleet   ││
│  │ Camera Feed │──│ Fusion      │──│ Analytics   │──│ Mgmt    ││
│  │ Visual+IR   │  │ Engine      │  │ Engine      │  │ Cloud   ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│
└─────────────────────────────────────────────────────────────────┘

Key Benefits:
1. Vision Foundation Models - Pre-trained on millions of images
2. Transfer Learning - 10-15% mAP improvement with less data
3. TensorRT Optimization - 8x inference speedup
4. DeepStream Pipeline - Multi-stream, production-ready
5. Edge-Cloud Hybrid - Best of both worlds
"""

from .tao_trainer import TAOTrainer, TAOConfig
from .deepstream_pipeline import DeepStreamPipeline, PipelineConfig
from .tensorrt_optimizer import TensorRTOptimizer
from .multimodal_fusion import MultiModalFusion
from .edge_cloud_sync import EdgeCloudSync

__all__ = [
    "TAOTrainer",
    "TAOConfig",
    "DeepStreamPipeline",
    "PipelineConfig",
    "TensorRTOptimizer",
    "MultiModalFusion",
    "EdgeCloudSync",
]

__version__ = "1.0.0"
__metropolis_version__ = "TAO 6.0 + DeepStream 8.0"
