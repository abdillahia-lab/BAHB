"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Building,
  Globe,
  Heart,
  Lightbulb,
  Shield,
  Target,
  Users,
  Zap,
} from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Every decision we make prioritizes the safety of infrastructure operators, the public, and the environment.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We push the boundaries of AI and autonomous systems to deliver capabilities that weren't possible before.",
  },
  {
    icon: Target,
    title: "Precision",
    description:
      "Our technology is built for accuracy. We don't accept false positives or missed defects.",
  },
  {
    icon: Heart,
    title: "Reliability",
    description:
      "Critical infrastructure demands systems that work every time. We engineer for 99.99% uptime.",
  },
];

const milestones = [
  {
    year: "2021",
    title: "Founded",
    description: "BAHB is founded with a mission to revolutionize infrastructure inspection.",
  },
  {
    year: "2022",
    title: "First AI Model",
    description: "Developed our first multi-stage AI pipeline for substation inspection.",
  },
  {
    year: "2023",
    title: "Data Center Expansion",
    description: "Expanded capabilities to include interior data center inspections.",
  },
  {
    year: "2024",
    title: "Edge AI Launch",
    description: "Released our edge-optimized AI stack running on NVIDIA Orin NX.",
  },
  {
    year: "2025",
    title: "YOLOv12 Integration",
    description: "Integrated latest YOLOv12 with Qwen-VL for natural language insights.",
  },
];

const stats = [
  { value: "50+", label: "Enterprise Clients" },
  { value: "10K+", label: "Inspections Completed" },
  { value: "99.7%", label: "Detection Accuracy" },
  { value: "40%", label: "Cost Reduction" },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container-narrow relative z-10 pt-32 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="label mb-4 block">About BAHB</span>
            <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              <span className="text-gradient">Building the Future</span>
              <br />
              <span className="text-gradient-accent">of Infrastructure Inspection</span>
            </h1>
            <p className="body-large max-w-2xl mx-auto">
              We believe that critical infrastructure deserves better than manual inspections
              and reactive maintenance. BAHB combines autonomous drones with advanced AI
              to deliver proactive, precision infrastructure intelligence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/5">
        <div className="container-wide">
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
                <div className="text-sm text-zinc-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="label mb-4 block">Our Mission</span>
              <h2 className="heading-section text-3xl sm:text-4xl mb-6 text-gradient">
                Preventing Failures Before They Happen
              </h2>
              <p className="body-large mb-6">
                Critical infrastructure—power grids, data centers, renewable energy assets—forms
                the backbone of modern society. Yet most inspection methods haven't evolved
                in decades.
              </p>
              <p className="text-zinc-400 mb-6">
                BAHB was founded to change that. By combining autonomous drones with
                state-of-the-art AI, we enable infrastructure operators to identify
                potential failures before they become emergencies, reduce inspection costs,
                and keep their teams safe.
              </p>
              <p className="text-zinc-400">
                Our vision is a world where every piece of critical infrastructure is
                continuously monitored, intelligently analyzed, and proactively maintained.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#12141a] to-[#1a1d24] border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
                    <Globe className="w-12 h-12 text-blue-500" />
                  </div>
                  <p className="text-zinc-500 text-sm">Global Infrastructure</p>
                  <p className="text-zinc-600 text-xs">Powering Safer Communities</p>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10 blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-[#0d0e11]">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="label mb-4 block">Our Values</span>
            <h2 className="heading-section text-3xl sm:text-4xl md:text-5xl mb-6 text-gradient">
              What Drives Us
            </h2>
            <p className="body-large max-w-2xl mx-auto">
              These principles guide every decision we make, from product development
              to customer partnerships.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center border border-white/5">
                  <value.icon className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-zinc-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section-padding">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="label mb-4 block">Our Journey</span>
            <h2 className="heading-section text-3xl sm:text-4xl md:text-5xl mb-6 text-gradient">
              Milestones
            </h2>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-cyan-500/30 to-transparent" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`relative grid md:grid-cols-2 gap-8 ${
                    index % 2 === 0 ? "" : "md:grid-flow-dense"
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full border-4 border-[#0a0b0d] z-10" />

                  {/* Content */}
                  <div
                    className={`pl-12 md:pl-0 ${
                      index % 2 === 0 ? "md:pr-16 md:text-right" : "md:col-start-2 md:pl-16"
                    }`}
                  >
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium mb-2">
                      {milestone.year}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                    <p className="text-zinc-400">{milestone.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-padding bg-[#0d0e11]">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="label mb-4 block">Our Team</span>
            <h2 className="heading-section text-3xl sm:text-4xl md:text-5xl mb-6 text-gradient">
              Built by Experts
            </h2>
            <p className="body-large max-w-2xl mx-auto">
              Our team combines deep expertise in AI, robotics, and critical infrastructure.
              We've worked at leading companies including Google, DJI, NVIDIA, and major utilities.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "AI & ML", count: "12" },
              { icon: Building, title: "Infrastructure", count: "8" },
              { icon: Users, title: "Operations", count: "15" },
            ].map((dept, index) => (
              <motion.div
                key={dept.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-premium card text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center border border-white/5">
                  <dept.icon className="w-7 h-7 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gradient-accent mb-1">
                  {dept.count}
                </div>
                <div className="text-zinc-400">{dept.title} Team</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/careers" className="btn-secondary">
              Join Our Team
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-12 md:p-16 text-center"
          >
            <h2 className="heading-section text-3xl sm:text-4xl mb-6 text-gradient">
              Partner With Us
            </h2>
            <p className="body-large max-w-xl mx-auto mb-8">
              Ready to transform how you inspect and maintain your critical infrastructure?
              Let's start a conversation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="btn-primary">
                Contact Us
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/services" className="btn-secondary">
                Explore Services
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
