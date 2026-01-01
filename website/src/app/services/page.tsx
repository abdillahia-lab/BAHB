"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircuitBoard,
  Flame,
  Gauge,
  Leaf,
  Radio,
  Server,
  Sun,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";

const services = [
  {
    id: "substation",
    icon: CircuitBoard,
    title: "Substation Inspection",
    subtitle: "Power Grid Infrastructure",
    description:
      "Comprehensive autonomous inspection of electrical substations with real-time thermal analysis and AI-powered defect detection. Our drones identify potential failures before they become critical issues.",
    features: [
      {
        icon: Thermometer,
        title: "Transformer Monitoring",
        description: "Oil leak detection, thermal anomaly identification, cooling performance analysis",
      },
      {
        icon: Radio,
        title: "Insulator Assessment",
        description: "Crack detection, contamination analysis, flashover damage identification",
      },
      {
        icon: Zap,
        title: "Conductor Inspection",
        description: "Sagging analysis, corrosion detection, hot joint identification",
      },
      {
        icon: Leaf,
        title: "Vegetation Management",
        description: "Encroachment detection, clearance enforcement, growth monitoring",
      },
    ],
    stats: [
      { value: "40%", label: "Faster inspections" },
      { value: "95%", label: "Defect accuracy" },
      { value: "60%", label: "Cost reduction" },
    ],
  },
  {
    id: "datacenter",
    icon: Building2,
    title: "Data Center Inspection",
    subtitle: "Mission-Critical Facilities",
    description:
      "Interior and exterior autonomous inspection for data centers and colocation facilities. Monitor server infrastructure, cooling systems, and electrical distribution with precision AI analysis.",
    features: [
      {
        icon: Server,
        title: "Server Rack Monitoring",
        description: "Status indicators, cable management, physical security verification",
      },
      {
        icon: Gauge,
        title: "HVAC Performance",
        description: "Fan operation, vent analysis, airflow optimization assessment",
      },
      {
        icon: Flame,
        title: "Thermal Hotspots",
        description: "Real-time thermal mapping, equipment temperature monitoring",
      },
      {
        icon: Zap,
        title: "Electrical Systems",
        description: "Panel assessment, connection verification, load analysis",
      },
    ],
    stats: [
      { value: "99.9%", label: "Uptime monitoring" },
      { value: "24/7", label: "Autonomous patrol" },
      { value: "15min", label: "Full facility scan" },
    ],
  },
  {
    id: "transmission",
    icon: Zap,
    title: "Transmission Lines",
    subtitle: "High-Voltage Infrastructure",
    description:
      "Long-range autonomous inspection of transmission lines and towers. Identify conductor issues, tower structural problems, and vegetation encroachment across extensive grid infrastructure.",
    features: [
      {
        icon: Radio,
        title: "Tower Inspection",
        description: "Structural integrity, bolt security, corrosion assessment",
      },
      {
        icon: Thermometer,
        title: "Line Analysis",
        description: "Conductor temperature, splice condition, connector integrity",
      },
      {
        icon: Leaf,
        title: "Right-of-Way",
        description: "Vegetation clearance, encroachment alerts, growth prediction",
      },
      {
        icon: Gauge,
        title: "Sag Monitoring",
        description: "Real-time sag measurement, temperature correlation, load analysis",
      },
    ],
    stats: [
      { value: "50mi", label: "Per flight" },
      { value: "RTK", label: "GPS precision" },
      { value: "4K", label: "Visual capture" },
    ],
  },
  {
    id: "solar",
    icon: Sun,
    title: "Solar & Wind",
    subtitle: "Renewable Energy Assets",
    description:
      "Automated inspection of solar farms and wind turbines with specialized thermal and visual analysis. Maximize energy production by identifying underperforming panels and turbine issues.",
    features: [
      {
        icon: Sun,
        title: "Panel Efficiency",
        description: "Hotspot detection, shading analysis, soiling assessment",
      },
      {
        icon: Wind,
        title: "Turbine Inspection",
        description: "Blade condition, nacelle analysis, tower structural check",
      },
      {
        icon: Thermometer,
        title: "Thermal Mapping",
        description: "Full-farm thermal scans, inverter monitoring, junction analysis",
      },
      {
        icon: Gauge,
        title: "Performance Tracking",
        description: "Production correlation, degradation analysis, maintenance prioritization",
      },
    ],
    stats: [
      { value: "1000+", label: "Panels/hour" },
      { value: "2%", label: "Efficiency gain" },
      { value: "ROI", label: "Within 6 months" },
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero Section with Topography Background */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* AI-Infused Topography Background */}
        <div className="topography-bg" />
        <div className="topography-lines" />
        <div className="ai-grid-overlay" />
        <div className="ai-particles" />
        <div className="neural-connections" />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0b0d]/80 via-[#0a0b0d]/60 to-[#0a0b0d]" />

        <div className="container-narrow relative z-10 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="label mb-4 block">Our Services</span>
            <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              <span className="text-gradient">Precision Inspection</span>
              <br />
              <span className="text-gradient-accent">For Critical Infrastructure</span>
            </h1>
            <p className="body-large max-w-2xl mx-auto">
              From power substations to data centers, our AI-powered autonomous drones
              deliver enterprise-grade inspection services that transform how you monitor
              and maintain your infrastructure.
            </p>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2"
          >
            <motion.div className="w-1 h-2 bg-blue-500 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Services Detail Sections */}
      {services.map((service, index) => (
        <section
          key={service.id}
          id={service.id}
          className={`section-padding ${index % 2 === 1 ? "bg-[#0d0e11]" : ""}`}
        >
          <div className="container-narrow">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={index % 2 === 1 ? "lg:order-2" : ""}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
                    <service.icon className="w-7 h-7 text-blue-500" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">
                      {service.subtitle}
                    </span>
                    <h2 className="text-2xl font-semibold">{service.title}</h2>
                  </div>
                </div>

                <p className="body-large mb-8">{service.description}</p>

                {/* Stats */}
                <div className="flex gap-8 mb-8">
                  {service.stats.map((stat) => (
                    <div key={stat.label}>
                      <div className="text-2xl font-bold text-gradient-accent">
                        {stat.value}
                      </div>
                      <div className="text-xs text-zinc-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <Link href="/contact" className="btn-primary inline-flex">
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`grid grid-cols-2 gap-4 ${index % 2 === 1 ? "lg:order-1" : ""}`}
              >
                {service.features.map((feature, featureIndex) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: featureIndex * 0.1 }}
                    className="card group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                      <feature.icon className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* Process Section */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="topography-bg opacity-20" />
          <div className="topography-lines opacity-20" />
        </div>
        <div className="container-narrow relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="label mb-4 block">How It Works</span>
            <h2 className="heading-section text-3xl sm:text-4xl md:text-5xl mb-6 text-gradient">
              Seamless Inspection Process
            </h2>
            <p className="body-large max-w-2xl mx-auto">
              From deployment to delivery, our end-to-end inspection workflow
              ensures comprehensive coverage and actionable insights.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Site Assessment",
                description: "We analyze your facility and create a custom flight plan",
              },
              {
                step: "02",
                title: "Autonomous Flight",
                description: "AI-powered drones execute precision inspection patterns",
              },
              {
                step: "03",
                title: "Real-Time Analysis",
                description: "Multi-stage AI pipeline processes visual and thermal data",
              },
              {
                step: "04",
                title: "Actionable Reports",
                description: "Detailed findings with prioritized maintenance recommendations",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-500/30 to-transparent -translate-x-4" />
                )}
                <div className="text-5xl font-bold text-gradient-accent opacity-30 mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.description}</p>
              </motion.div>
            ))}
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
            className="glass-strong rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            {/* Background Effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="topography-bg" />
              <div className="neural-connections" />
            </div>

            <div className="relative">
              <h2 className="heading-section text-3xl sm:text-4xl mb-6 text-gradient">
                Ready to Modernize Your Inspections?
              </h2>
              <p className="body-large max-w-xl mx-auto mb-8">
                Contact us for a customized assessment of your infrastructure
                inspection needs and discover the BAHB advantage.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/contact" className="btn-primary">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/technology" className="btn-secondary">
                  View Technology
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
