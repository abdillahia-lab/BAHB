"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  Eye,
  Flame,
  LineChart,
  Play,
  Shield,
  Zap,
  Building2,
  CircuitBoard,
  Sun,
  Wind,
} from "lucide-react";

const services = [
  {
    icon: CircuitBoard,
    title: "Substation Inspection",
    description:
      "Comprehensive analysis of transformers, insulators, conductors, and switchgear with thermal anomaly detection.",
    href: "/services#substation",
  },
  {
    icon: Building2,
    title: "Data Center Inspection",
    description:
      "Server rack monitoring, HVAC performance analysis, electrical panel assessment, and thermal hotspot detection.",
    href: "/services#datacenter",
  },
  {
    icon: Zap,
    title: "Transmission Lines",
    description:
      "Overhead line inspection with vegetation management and conductor condition assessment.",
    href: "/services#transmission",
  },
  {
    icon: Sun,
    title: "Solar & Wind",
    description:
      "Renewable energy infrastructure monitoring with panel efficiency and turbine condition analysis.",
    href: "/services#solar",
  },
];

const features = [
  {
    icon: Cpu,
    title: "Edge AI Processing",
    description: "Real-time analysis on NVIDIA Orin NX with sub-10ms inference latency.",
  },
  {
    icon: Eye,
    title: "Multi-Modal Vision",
    description: "4K RGB, thermal imaging, and laser rangefinding in a single flight.",
  },
  {
    icon: Flame,
    title: "Thermal Analysis",
    description: "Equipment-specific temperature zones with automatic anomaly classification.",
  },
  {
    icon: LineChart,
    title: "Automated Reporting",
    description: "Professional PDF reports with visual evidence and maintenance recommendations.",
  },
];

const stats = [
  { value: "500+", label: "FPS Processing", sublabel: "YOLOv12 Detection" },
  { value: "<10ms", label: "Inference Time", sublabel: "Edge Computing" },
  { value: "25+", label: "Object Classes", sublabel: "Infrastructure" },
  { value: "99.7%", label: "Accuracy Rate", sublabel: "Anomaly Detection" },
];

const logos = [
  "Pacific Gas & Electric",
  "Amazon Web Services",
  "Microsoft Azure",
  "Duke Energy",
  "Equinix",
  "Digital Realty",
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="container-narrow relative z-10 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-sm text-zinc-300">
                Now powered by YOLOv12 + Qwen-VL
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              <span className="text-gradient">Autonomous Drone</span>
              <br />
              <span className="text-gradient-accent">Inspection Intelligence</span>
            </h1>

            {/* Subheadline */}
            <p className="body-large max-w-2xl mx-auto mb-10">
              Enterprise-grade AI-powered inspection for critical infrastructure.
              Real-time analysis, thermal imaging, and automated insights—all at the edge.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="btn-primary">
                Request Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="btn-secondary group">
                <Play className="w-4 h-4 text-blue-500 group-hover:text-blue-400 transition-colors" />
                Watch Overview
              </button>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="relative aspect-video max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/10 glow-subtle">
              {/* Placeholder for drone footage / dashboard visual */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#12141a] to-[#1a1d24]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
                      <Eye className="w-10 h-10 text-blue-500" />
                    </div>
                    <p className="text-zinc-500 text-sm">Live Inspection Dashboard</p>
                  </div>
                </div>
                {/* Floating Stats */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="absolute top-6 left-6 glass rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Status</p>
                      <p className="text-sm font-medium text-green-500">All Systems Normal</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute top-6 right-6 glass rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">AI Processing</p>
                      <p className="text-sm font-medium">462 FPS</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-transparent to-cyan-500/20 blur-3xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 border-y border-white/5">
        <div className="container-wide">
          <p className="text-center text-sm text-zinc-500 mb-8">
            Trusted by industry leaders in energy and data infrastructure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {logos.map((logo) => (
              <div
                key={logo}
                className="text-zinc-600 text-sm font-medium tracking-wide hover:text-zinc-400 transition-colors cursor-default"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="label mb-4 block">Services</span>
            <h2 className="heading-section text-3xl sm:text-4xl md:text-5xl mb-6 text-gradient">
              Comprehensive Infrastructure Inspection
            </h2>
            <p className="body-large max-w-2xl mx-auto">
              From substations to server rooms, our autonomous drones deliver
              precision inspection services across critical infrastructure sectors.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={service.href}
                  className="card-premium card group block h-full"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center shrink-0 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-colors">
                      <service.icon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5" />
        <div className="container-narrow relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-gradient-accent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-white mb-1">{stat.label}</div>
                <div className="text-xs text-zinc-500">{stat.sublabel}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-[#0d0e11]">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="label mb-4 block">Capabilities</span>
            <h2 className="heading-section text-3xl sm:text-4xl md:text-5xl mb-6 text-gradient">
              Enterprise-Grade Technology
            </h2>
            <p className="body-large max-w-2xl mx-auto">
              Built on cutting-edge AI and industrial-grade hardware for
              mission-critical infrastructure inspection.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center border border-white/5">
                  <feature.icon className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="container-narrow relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-12 md:p-16 text-center"
          >
            <h2 className="heading-section text-3xl sm:text-4xl mb-6 text-gradient">
              Ready to Transform Your Inspections?
            </h2>
            <p className="body-large max-w-xl mx-auto mb-8">
              Schedule a demo to see how BAHB can enhance your infrastructure
              monitoring with AI-powered precision.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="btn-primary">
                Schedule Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/technology" className="btn-secondary">
                Explore Technology
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
