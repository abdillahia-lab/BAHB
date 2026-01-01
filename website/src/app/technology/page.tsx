"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Camera,
  Cpu,
  Eye,
  Flame,
  Layers,
  MessageSquare,
  Radar,
  Scan,
  Target,
  Zap,
} from "lucide-react";

const aiPipeline = [
  {
    stage: 1,
    name: "YOLOv12",
    role: "Fast Object Detection",
    icon: Eye,
    color: "blue",
    specs: [
      { label: "Inference", value: "~2ms" },
      { label: "Throughput", value: "500+ FPS" },
      { label: "Resolution", value: "1280x720" },
    ],
    description:
      "Attention-based architecture for robust multi-scale detection. Identifies 25+ infrastructure object classes including transformers, insulators, conductors, server racks, HVAC units, and various types of damage or anomalies.",
    capabilities: [
      "Multi-scale feature detection",
      "Real-time object tracking",
      "Confidence-based filtering",
      "Batch inference optimization",
    ],
  },
  {
    stage: 2,
    name: "RF-DETR",
    role: "Detailed Segmentation",
    icon: Scan,
    color: "cyan",
    specs: [
      { label: "Inference", value: "~15ms" },
      { label: "Throughput", value: "66 FPS" },
      { label: "Resolution", value: "640x640" },
    ],
    description:
      "Transformer-based detection with ResNet101 backbone for precise equipment boundary segmentation. Generates pixel-level masks for detected infrastructure components.",
    capabilities: [
      "Transformer architecture",
      "Pixel-level segmentation",
      "Equipment boundary detection",
      "High-precision masks",
    ],
  },
  {
    stage: 3,
    name: "SAM3 Nano",
    role: "Precision Instance Segmentation",
    icon: Target,
    color: "purple",
    specs: [
      { label: "Inference", value: "~8ms" },
      { label: "Throughput", value: "125 FPS" },
      { label: "Resolution", value: "1024x1024" },
    ],
    description:
      "Ultra-precise point-based instance segmentation optimized for edge deployment. Uses point prompts from anomaly detections to generate precise segmentation masks.",
    capabilities: [
      "Point-prompt segmentation",
      "Edge-optimized nano variant",
      "Instance-level precision",
      "Anomaly boundary mapping",
    ],
  },
  {
    stage: 4,
    name: "Qwen2.5-VL",
    role: "Visual Language Analysis",
    icon: MessageSquare,
    color: "green",
    specs: [
      { label: "Inference", value: "~50ms" },
      { label: "Throughput", value: "20 FPS" },
      { label: "Parameters", value: "3B AWQ" },
    ],
    description:
      "Advanced visual language model with 3B parameters and AWQ quantization. Provides natural language understanding, detailed defect descriptions, and contextual maintenance recommendations.",
    capabilities: [
      "Multi-image understanding",
      "Detailed defect descriptions",
      "Contextual analysis",
      "Maintenance recommendations",
    ],
  },
];

const hardware = {
  compute: {
    name: "DJI Manifold 3",
    processor: "NVIDIA Orin NX",
    features: [
      "CUDA/GPU acceleration",
      "TensorRT optimization",
      "FP16 inference",
      "Multi-stream processing",
    ],
  },
  aircraft: {
    name: "DJI Matrice 400 RTK",
    specs: [
      "Industrial-grade construction",
      "45-minute flight time",
      "RTK GPS precision",
      "Obstacle avoidance",
    ],
  },
  camera: {
    name: "DJI H30T",
    sensors: [
      { name: "Wide Camera", spec: "4K RGB, 1/2\" CMOS" },
      { name: "Zoom Camera", spec: "8MP, 5-200x optical" },
      { name: "Thermal Camera", spec: "640×512, -40°C to 550°C" },
      { name: "Laser Rangefinder", spec: "1200m range, ±0.2m" },
    ],
  },
};

export default function TechnologyPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        {/* Neural Network Background */}
        <div className="neural-connections opacity-40" />

        <div className="container-narrow relative z-10 pt-32 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="label mb-4 block">Technology</span>
            <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              <span className="text-gradient">Multi-Stage AI</span>
              <br />
              <span className="text-gradient-accent">Inference Pipeline</span>
            </h1>
            <p className="body-large max-w-2xl mx-auto">
              Four-stage AI architecture optimized for edge computing on NVIDIA Orin NX.
              From rapid detection to natural language analysis—all in real-time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pipeline Overview */}
      <section className="py-12 border-y border-white/5">
        <div className="container-wide">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {aiPipeline.map((stage, index) => (
              <div key={stage.name} className="flex items-center gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15 }}
                  className="flex items-center gap-3 glass rounded-full px-4 py-2"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      stage.color === "blue"
                        ? "bg-blue-500/20"
                        : stage.color === "cyan"
                        ? "bg-cyan-500/20"
                        : stage.color === "purple"
                        ? "bg-purple-500/20"
                        : "bg-green-500/20"
                    }`}
                  >
                    <stage.icon
                      className={`w-4 h-4 ${
                        stage.color === "blue"
                          ? "text-blue-500"
                          : stage.color === "cyan"
                          ? "text-cyan-500"
                          : stage.color === "purple"
                          ? "text-purple-500"
                          : "text-green-500"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium">{stage.name}</span>
                </motion.div>
                {index < aiPipeline.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-zinc-600 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Pipeline Details */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="space-y-24">
            {aiPipeline.map((stage, index) => (
              <motion.div
                key={stage.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? "lg:grid-flow-dense" : ""
                }`}
              >
                {/* Content */}
                <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-sm text-zinc-500 font-mono">
                      Stage {stage.stage}
                    </div>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        stage.color === "blue"
                          ? "bg-blue-500/20"
                          : stage.color === "cyan"
                          ? "bg-cyan-500/20"
                          : stage.color === "purple"
                          ? "bg-purple-500/20"
                          : "bg-green-500/20"
                      }`}
                    >
                      <stage.icon
                        className={`w-6 h-6 ${
                          stage.color === "blue"
                            ? "text-blue-500"
                            : stage.color === "cyan"
                            ? "text-cyan-500"
                            : stage.color === "purple"
                            ? "text-purple-500"
                            : "text-green-500"
                        }`}
                      />
                    </div>
                  </div>

                  <h2 className="text-3xl font-semibold mb-2">{stage.name}</h2>
                  <p className="text-zinc-400 mb-6">{stage.role}</p>

                  <p className="body-large mb-8">{stage.description}</p>

                  {/* Specs */}
                  <div className="flex gap-6 mb-8">
                    {stage.specs.map((spec) => (
                      <div key={spec.label}>
                        <div className="text-xl font-bold text-gradient-accent">
                          {spec.value}
                        </div>
                        <div className="text-xs text-zinc-500">{spec.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capabilities Card */}
                <div className={index % 2 === 1 ? "lg:col-start-1" : ""}>
                  <div className="card-premium card">
                    <h3 className="text-lg font-semibold mb-4">Capabilities</h3>
                    <ul className="space-y-3">
                      {stage.capabilities.map((capability) => (
                        <li
                          key={capability}
                          className="flex items-center gap-3 text-sm text-zinc-400"
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              stage.color === "blue"
                                ? "bg-blue-500"
                                : stage.color === "cyan"
                                ? "bg-cyan-500"
                                : stage.color === "purple"
                                ? "bg-purple-500"
                                : "bg-green-500"
                            }`}
                          />
                          {capability}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hardware Section */}
      <section className="section-padding bg-[#0d0e11]">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="label mb-4 block">Hardware Platform</span>
            <h2 className="heading-section text-3xl sm:text-4xl md:text-5xl mb-6 text-gradient">
              Industrial-Grade Equipment
            </h2>
            <p className="body-large max-w-2xl mx-auto">
              Purpose-built hardware stack combining DJI's industrial drone platform
              with NVIDIA's edge AI capabilities.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Compute */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card-premium card"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{hardware.compute.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">{hardware.compute.processor}</p>
              <ul className="space-y-2">
                {hardware.compute.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-zinc-400">
                    <Zap className="w-3 h-3 text-blue-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Aircraft */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="card-premium card"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                <Radar className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{hardware.aircraft.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">Enterprise Drone Platform</p>
              <ul className="space-y-2">
                {hardware.aircraft.specs.map((spec) => (
                  <li key={spec} className="flex items-center gap-2 text-sm text-zinc-400">
                    <Zap className="w-3 h-3 text-blue-500" />
                    {spec}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Camera */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="card-premium card"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{hardware.camera.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">Multi-Sensor Payload</p>
              <ul className="space-y-2">
                {hardware.camera.sensors.map((sensor) => (
                  <li key={sensor.name} className="text-sm">
                    <span className="text-zinc-300">{sensor.name}</span>
                    <span className="text-zinc-500 text-xs block">{sensor.spec}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Thermal Analysis Section */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="label mb-4 block">Thermal Intelligence</span>
              <h2 className="heading-section text-3xl sm:text-4xl mb-6 text-gradient">
                Advanced Thermal Analysis
              </h2>
              <p className="body-large mb-8">
                Equipment-specific thermal zones with automatic hotspot detection
                and temperature anomaly classification. Our thermal pipeline understands
                the expected temperature profiles for different infrastructure types.
              </p>

              <div className="space-y-4">
                {[
                  "Real-time hotspot detection",
                  "Equipment-specific temperature zones",
                  "Automatic severity classification",
                  "Historical trend analysis",
                  "Temperature mapping visualization",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Flame className="w-3 h-3 text-orange-500" />
                    </div>
                    <span className="text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-orange-500/10 via-red-500/10 to-yellow-500/10 border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-white/10">
                    <Flame className="w-12 h-12 text-orange-500" />
                  </div>
                  <p className="text-zinc-500 text-sm">Thermal Visualization</p>
                  <p className="text-zinc-600 text-xs">-40°C to 550°C Range</p>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-500/10 blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-[#0d0e11]">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-12 md:p-16 text-center"
          >
            <h2 className="heading-section text-3xl sm:text-4xl mb-6 text-gradient">
              Experience Our Technology
            </h2>
            <p className="body-large max-w-xl mx-auto mb-8">
              See our AI pipeline in action with a live demonstration
              tailored to your infrastructure needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="btn-primary">
                Request Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/services" className="btn-secondary">
                View Services
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
