"""
NVIDIA DeepStream 8 Pipeline for Real-time Power Infrastructure Detection

DeepStream provides:
1. Hardware-accelerated video decode/encode (NVDEC/NVENC)
2. Multi-stream processing (8+ simultaneous streams)
3. TensorRT inference integration
4. Object tracking (NvDCF, DeepSORT)
5. Analytics and metadata export

Pipeline Architecture:
┌──────────────────────────────────────────────────────────────────────────┐
│                     DEEPSTREAM MULTI-STAGE PIPELINE                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────┐   ┌─────────┐   ┌─────────────┐   ┌──────────────────────┐ │
│  │ SOURCE  │──▶│ DECODE  │──▶│ PREPROCESS  │──▶│ PRIMARY INFERENCE    │ │
│  │ H30T    │   │ NVDEC   │   │ NVSTREAMMUX │   │ YOLO26/TAO Detection │ │
│  │ Camera  │   │ HW Accel│   │ Batching    │   │ TensorRT INT8        │ │
│  └─────────┘   └─────────┘   └─────────────┘   └──────────┬───────────┘ │
│                                                            │             │
│                                                            ▼             │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    SECONDARY CLASSIFIERS                            ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ ││
│  │  │ Defect      │  │ Severity    │  │ Component                   │ ││
│  │  │ Classifier  │  │ Classifier  │  │ Condition Classifier        │ ││
│  │  │ (damage,    │  │ (normal,    │  │ (good, degraded, critical)  │ ││
│  │  │ corrosion)  │  │ warning,    │  │                             │ ││
│  │  │             │  │ critical)   │  │                             │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘ ││
│  └──────────────────────────────────┬──────────────────────────────────┘│
│                                     │                                   │
│                                     ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         TRACKER                                   │  │
│  │  NvDCF/DeepSORT - Temporal consistency, Re-ID across frames      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                     │                                   │
│                     ┌───────────────┼───────────────┐                  │
│                     ▼               ▼               ▼                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────┐│
│  │ OSD         │  │ MESSAGE     │  │ ANALYTICS                       ││
│  │ Overlay     │  │ CONVERTER   │  │ - Defect counting               ││
│  │ Bounding    │  │ Metadata    │  │ - Severity aggregation          ││
│  │ Boxes       │  │ Export      │  │ - Trend detection               ││
│  └─────────────┘  └─────────────┘  └─────────────────────────────────┘│
│                     │               │               │                  │
│                     ▼               ▼               ▼                  │
│              ┌──────────┐    ┌───────────┐   ┌──────────────┐         │
│              │ Display  │    │ Kafka/MQTT│   │ Cloud Sync   │         │
│              │ RTSP Out │    │ Streaming │   │ Historical   │         │
│              └──────────┘    └───────────┘   └──────────────┘         │
└──────────────────────────────────────────────────────────────────────────┘

Performance Targets on Orin NX:
- 30+ FPS @ 1080p
- <33ms end-to-end latency
- 4+ simultaneous streams
- <8W power consumption
"""

import os
import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Callable
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class TrackerType(Enum):
    """Available tracking algorithms in DeepStream."""
    NVDCF = "NvDCF"          # NVIDIA DCF tracker (fast, accurate)
    DEEPSORT = "DeepSORT"    # Deep learning based (more accurate)
    IOU = "IOU"              # Simple IoU tracker (fastest)
    NVMOT = "NvMOT"          # Multi-object tracker


class InferencePrecision(Enum):
    """TensorRT inference precision levels."""
    FP32 = "fp32"
    FP16 = "fp16"
    INT8 = "int8"  # Recommended for Orin NX


@dataclass
class PipelineConfig:
    """Configuration for DeepStream pipeline."""

    # Input Configuration
    source_type: str = "rtsp"  # rtsp, v4l2, file
    source_uri: str = "rtsp://192.168.1.1:554/live"
    source_width: int = 1920
    source_height: int = 1080
    source_fps: int = 30

    # Multi-stream support
    num_sources: int = 1
    batch_size: int = 1

    # Primary Detector Configuration
    primary_model: str = "/home/user/BAHB/models/tao/best.engine"
    primary_config: str = "/home/user/BAHB/configs/deepstream/primary_detector.txt"
    primary_labels: str = "/home/user/BAHB/configs/deepstream/labels.txt"
    primary_precision: InferencePrecision = InferencePrecision.INT8

    # Secondary Classifiers
    enable_secondary: bool = True
    secondary_models: List[Dict[str, str]] = field(default_factory=lambda: [
        {
            "name": "defect_classifier",
            "model": "/home/user/BAHB/models/tao/defect_classifier.engine",
            "config": "/home/user/BAHB/configs/deepstream/defect_classifier.txt",
            "operate_on_class_ids": [10, 11, 12, 13, 14, 15, 16],  # Defect classes
        },
        {
            "name": "severity_classifier",
            "model": "/home/user/BAHB/models/tao/severity_classifier.engine",
            "config": "/home/user/BAHB/configs/deepstream/severity_classifier.txt",
        },
    ])

    # Tracker Configuration
    tracker_type: TrackerType = TrackerType.NVDCF
    tracker_config: str = "/home/user/BAHB/configs/deepstream/tracker_config.txt"

    # Output Configuration
    output_rtsp: bool = True
    output_rtsp_port: int = 8554
    output_display: bool = False
    output_file: Optional[str] = None

    # Analytics Configuration
    enable_analytics: bool = True
    analytics_config: Dict[str, Any] = field(default_factory=lambda: {
        "enable_defect_counting": True,
        "enable_severity_aggregation": True,
        "enable_trend_detection": True,
        "alert_threshold": {
            "critical_count": 5,
            "warning_count": 10,
        },
    })

    # Message Broker Configuration
    enable_msg_broker: bool = True
    msg_broker_type: str = "kafka"  # kafka, mqtt, amqp
    msg_broker_config: Dict[str, str] = field(default_factory=lambda: {
        "proto-lib": "/opt/nvidia/deepstream/lib/libnvds_kafka_proto.so",
        "conn-str": "localhost:9092",
        "topic": "bahb-detections",
    })

    # Performance Tuning
    gpu_id: int = 0
    nvbuf_memory_type: int = 0  # 0=NVBUF_MEM_DEFAULT, 4=NVBUF_MEM_CUDA_UNIFIED
    async_inference: bool = True
    maintain_aspect_ratio: bool = True


class DeepStreamPipeline:
    """
    NVIDIA DeepStream 8 Pipeline for Power Infrastructure Detection.

    This pipeline provides:
    1. Real-time video analytics at 30+ FPS
    2. Multi-stage detection and classification
    3. Object tracking for temporal consistency
    4. Edge-optimized inference with TensorRT INT8
    5. Message broker integration for cloud sync

    Expected Performance on Orin NX:
    - Latency: <33ms end-to-end
    - Throughput: 30+ FPS @ 1080p
    - Memory: <4GB
    - Power: <15W
    """

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.pipeline = None
        self.loop = None
        self.callbacks: Dict[str, List[Callable]] = {
            "on_detection": [],
            "on_analytics": [],
            "on_error": [],
        }

    def generate_config_files(self) -> Dict[str, str]:
        """
        Generate all DeepStream configuration files.

        Returns:
            Dictionary mapping config type to file path
        """

        config_dir = Path("/home/user/BAHB/configs/deepstream")
        config_dir.mkdir(parents=True, exist_ok=True)

        configs = {}

        # Generate main pipeline config
        configs["pipeline"] = self._generate_pipeline_config(config_dir)

        # Generate primary detector config
        configs["primary"] = self._generate_primary_config(config_dir)

        # Generate tracker config
        configs["tracker"] = self._generate_tracker_config(config_dir)

        # Generate labels file
        configs["labels"] = self._generate_labels_file(config_dir)

        # Generate analytics config
        if self.config.enable_analytics:
            configs["analytics"] = self._generate_analytics_config(config_dir)

        # Generate message broker config
        if self.config.enable_msg_broker:
            configs["msg_broker"] = self._generate_msg_broker_config(config_dir)

        return configs

    def _generate_pipeline_config(self, config_dir: Path) -> str:
        """Generate main DeepStream pipeline configuration."""

        config = f"""
[application]
enable-perf-measurement=1
perf-measurement-interval-sec=5

[tiled-display]
enable=1
rows=1
columns={self.config.num_sources}
width=1920
height=1080
gpu-id={self.config.gpu_id}
nvbuf-memory-type={self.config.nvbuf_memory_type}

[source0]
enable=1
type=4
uri={self.config.source_uri}
num-sources={self.config.num_sources}
gpu-id={self.config.gpu_id}
cudadec-memtype={self.config.nvbuf_memory_type}

[streammux]
gpu-id={self.config.gpu_id}
live-source=1
batch-size={self.config.batch_size}
batched-push-timeout=40000
width={self.config.source_width}
height={self.config.source_height}
enable-padding=0
nvbuf-memory-type={self.config.nvbuf_memory_type}

[primary-gie]
enable=1
gpu-id={self.config.gpu_id}
gie-unique-id=1
nvbuf-memory-type={self.config.nvbuf_memory_type}
config-file={config_dir}/primary_detector.txt

[tracker]
enable=1
gpu-id={self.config.gpu_id}
tracker-width=640
tracker-height=384
ll-lib-file=/opt/nvidia/deepstream/deepstream/lib/libnvds_nvmultiobjecttracker.so
ll-config-file={config_dir}/tracker_config.txt
enable-batch-process=1

[osd]
enable=1
gpu-id={self.config.gpu_id}
border-width=3
text-size=15
text-color=1;1;1;1
text-bg-color=0.3;0.3;0.3;1
font=Serif
nvbuf-memory-type={self.config.nvbuf_memory_type}

[sink0]
enable={1 if self.config.output_rtsp else 0}
type=4
rtsp-port={self.config.output_rtsp_port}
sync=0
source-id=0
codec=1
bitrate=4000000
gpu-id={self.config.gpu_id}
nvbuf-memory-type={self.config.nvbuf_memory_type}

[sink1]
enable={1 if self.config.enable_msg_broker else 0}
type=6
msg-conv-config={config_dir}/msg_conv_config.txt
msg-broker-proto-lib={self.config.msg_broker_config.get('proto-lib', '')}
msg-broker-conn-str={self.config.msg_broker_config.get('conn-str', '')}
topic={self.config.msg_broker_config.get('topic', '')}

[tests]
file-loop=0
"""

        config_path = config_dir / "deepstream_app_config.txt"
        with open(config_path, 'w') as f:
            f.write(config)

        return str(config_path)

    def _generate_primary_config(self, config_dir: Path) -> str:
        """Generate primary detector (YOLO26/TAO) configuration."""

        # Determine model architecture
        is_yolo = "yolo" in self.config.primary_model.lower()

        config = f"""
[property]
gpu-id={self.config.gpu_id}
net-scale-factor=0.0039215697906911373
model-engine-file={self.config.primary_model}
labelfile-path={config_dir}/labels.txt
batch-size={self.config.batch_size}
network-mode={'1' if self.config.primary_precision == InferencePrecision.INT8 else '0'}
num-detected-classes=17
interval=0
gie-unique-id=1
process-mode=1
network-type=0
cluster-mode=2
maintain-aspect-ratio={1 if self.config.maintain_aspect_ratio else 0}
symmetric-padding=1
workspace-size=2000
parse-bbox-func-name=NvDsInferParseYolo
custom-lib-path=/opt/nvidia/deepstream/deepstream/lib/libnvdsinfer_custom_impl_Yolo.so

[class-attrs-all]
pre-cluster-threshold=0.25
topk=300
nms-iou-threshold=0.45
"""

        config_path = config_dir / "primary_detector.txt"
        with open(config_path, 'w') as f:
            f.write(config)

        return str(config_path)

    def _generate_tracker_config(self, config_dir: Path) -> str:
        """Generate object tracker configuration."""

        config = f"""
[tracker]
tracker-width=640
tracker-height=384
gpu-id={self.config.gpu_id}
ll-lib-file=/opt/nvidia/deepstream/deepstream/lib/libnvds_nvmultiobjecttracker.so
enable-past-frame=1
enable-batch-process=1

[NvDCF]
useBufferedOutput=1
surfaceTransform=0
maxObjectPerFrame=50
"""

        # Add tracker-specific settings
        if self.config.tracker_type == TrackerType.NVDCF:
            config += """
# NvDCF Tracker - Fast and accurate
maxTargetsPerStream=50
minTargetAppearance=0.3
minTrackingConfidence=0.2
maxTrackingAge=30
"""
        elif self.config.tracker_type == TrackerType.DEEPSORT:
            config += """
# DeepSORT Tracker - Deep learning based
useUniqueID=1
reidModelPath=/opt/nvidia/deepstream/deepstream/samples/models/Tracker/resnet50_market1501.onnx
"""

        config_path = config_dir / "tracker_config.txt"
        with open(config_path, 'w') as f:
            f.write(config)

        return str(config_path)

    def _generate_labels_file(self, config_dir: Path) -> str:
        """Generate labels file for detected classes."""

        labels = [
            "insulator",
            "transformer",
            "conductor",
            "surge_arrester",
            "disconnect_switch",
            "fuse",
            "recloser",
            "capacitor_bank",
            "voltage_regulator",
            "bird_nest",
            "corrosion",
            "damage",
            "vegetation_encroachment",
            "hot_spot",
            "oil_leak",
            "broken_strand",
            "missing_hardware",
        ]

        labels_path = config_dir / "labels.txt"
        with open(labels_path, 'w') as f:
            f.write("\n".join(labels))

        return str(labels_path)

    def _generate_analytics_config(self, config_dir: Path) -> str:
        """Generate analytics configuration for defect analysis."""

        config = {
            "analytics": {
                "enable": True,
                "modules": {
                    "defect_counter": {
                        "enable": True,
                        "classes": ["corrosion", "damage", "hot_spot", "oil_leak", "broken_strand"],
                        "alert_threshold": 5,
                    },
                    "severity_aggregator": {
                        "enable": True,
                        "severity_mapping": {
                            "critical": ["hot_spot", "broken_strand", "oil_leak"],
                            "warning": ["corrosion", "damage", "vegetation_encroachment"],
                            "info": ["bird_nest"],
                        },
                    },
                    "trend_detector": {
                        "enable": True,
                        "window_size": 100,  # frames
                        "threshold_increase": 0.2,  # 20% increase triggers alert
                    },
                },
            }
        }

        config_path = config_dir / "analytics_config.json"
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)

        return str(config_path)

    def _generate_msg_broker_config(self, config_dir: Path) -> str:
        """Generate message broker configuration for cloud sync."""

        config = f"""
[message-converter]
payload-type=1
msg2p-newapi=1
schema=kafka

[sensor]
id=bahb-drone-001
type=DJI-Matrice400
location=inspection-site
coordinate=0.0;0.0;0.0
"""

        config_path = config_dir / "msg_conv_config.txt"
        with open(config_path, 'w') as f:
            f.write(config)

        return str(config_path)

    def build_gstreamer_pipeline(self) -> str:
        """
        Build GStreamer pipeline string for DeepStream.

        Returns:
            GStreamer pipeline string
        """

        pipeline_parts = []

        # Source element
        if self.config.source_type == "rtsp":
            pipeline_parts.append(
                f"rtspsrc location={self.config.source_uri} ! "
                f"rtph264depay ! h264parse ! nvv4l2decoder ! "
            )
        elif self.config.source_type == "v4l2":
            pipeline_parts.append(
                f"v4l2src device=/dev/video0 ! "
                f"video/x-raw,width={self.config.source_width},height={self.config.source_height} ! "
                f"nvvideoconvert ! "
            )

        # Stream muxer
        pipeline_parts.append(
            f"nvstreammux name=mux batch-size={self.config.batch_size} "
            f"width={self.config.source_width} height={self.config.source_height} ! "
        )

        # Primary inference
        pipeline_parts.append(
            f"nvinfer config-file-path={self.config.primary_config} ! "
        )

        # Tracker
        pipeline_parts.append(
            f"nvtracker ll-lib-file=/opt/nvidia/deepstream/deepstream/lib/libnvds_nvmultiobjecttracker.so "
            f"ll-config-file={self.config.tracker_config} ! "
        )

        # OSD (On-Screen Display)
        pipeline_parts.append(
            "nvdsosd ! "
        )

        # Output
        if self.config.output_rtsp:
            pipeline_parts.append(
                f"nvv4l2h264enc bitrate=4000000 ! h264parse ! "
                f"rtph264pay ! udpsink host=224.224.255.255 port={self.config.output_rtsp_port} "
            )
        elif self.config.output_display:
            pipeline_parts.append(
                "nv3dsink "
            )

        return "".join(pipeline_parts)

    def register_callback(self, event_type: str, callback: Callable):
        """Register callback for pipeline events."""
        if event_type in self.callbacks:
            self.callbacks[event_type].append(callback)

    def start(self):
        """Start the DeepStream pipeline."""
        try:
            import gi
            gi.require_version('Gst', '1.0')
            gi.require_version('GstRtspServer', '1.0')
            from gi.repository import Gst, GLib, GstRtspServer

            Gst.init(None)

            # Generate config files
            configs = self.generate_config_files()
            logger.info(f"Generated DeepStream configs: {configs}")

            # Build pipeline
            pipeline_str = self.build_gstreamer_pipeline()
            logger.info(f"Pipeline: {pipeline_str}")

            self.pipeline = Gst.parse_launch(pipeline_str)

            # Start pipeline
            self.pipeline.set_state(Gst.State.PLAYING)

            # Run main loop
            self.loop = GLib.MainLoop()
            self.loop.run()

        except ImportError:
            logger.error("GStreamer/DeepStream not available. Install DeepStream SDK.")
            raise

    def stop(self):
        """Stop the DeepStream pipeline."""
        if self.pipeline:
            self.pipeline.set_state(Gst.State.NULL)
        if self.loop:
            self.loop.quit()


def create_bahb_deepstream_pipeline() -> DeepStreamPipeline:
    """
    Factory function to create optimized DeepStream pipeline for BAHB.

    Optimized for:
    - DJI H30T camera (visual + thermal)
    - NVIDIA Orin NX (15W TDP)
    - Real-time power infrastructure inspection
    """

    config = PipelineConfig(
        # DJI H30T camera input
        source_type="rtsp",
        source_uri="rtsp://192.168.1.1:554/live",
        source_width=1920,
        source_height=1080,
        source_fps=30,

        # TensorRT INT8 for Orin NX
        primary_precision=InferencePrecision.INT8,

        # Enable all analytics
        enable_secondary=True,
        enable_analytics=True,

        # NvDCF tracker for speed
        tracker_type=TrackerType.NVDCF,

        # RTSP output for monitoring
        output_rtsp=True,
        output_rtsp_port=8554,

        # Kafka for cloud sync
        enable_msg_broker=True,
        msg_broker_config={
            "proto-lib": "/opt/nvidia/deepstream/lib/libnvds_kafka_proto.so",
            "conn-str": "localhost:9092",
            "topic": "bahb-detections",
        },
    )

    return DeepStreamPipeline(config)
