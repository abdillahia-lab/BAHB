import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Sun, Moon, Play,
  Thermometer, Map, Shield, Leaf, Cpu, Zap,
  Radio, Target, Layers, Lock,
  Satellite, Eye, Activity,
  Award, Brain, ShieldCheck, CheckCircle2,
  ChevronDown, Building2, Gauge, Server, Workflow
} from 'lucide-react'
import './LandingPage2.css'

// Smooth easing
const smoothEase = [0.22, 1, 0.36, 1]

function LandingPage2() {
  const [isDark, setIsDark] = useState(true)
  const [activeService, setActiveService] = useState(0)
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])

  // Auto-rotate services
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService(prev => (prev + 1) % 4)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const services = [
    {
      id: 'infrastructure',
      title: 'Infrastructure Inspection',
      subtitle: 'Substations • Transmission Lines • Data Centers',
      description: 'Autonomous thermal and visual inspection of critical infrastructure. Detect faults before failures occur with AI-powered anomaly detection.',
      icon: <Server size={24} />,
      color: '#3b82f6',
      metrics: ['99.8% Detection Rate', '< 4hr Turnaround', 'NERC CIP Compliant']
    },
    {
      id: 'thermal',
      title: 'Thermal Analytics',
      subtitle: 'Predictive Maintenance • Fault Detection',
      description: 'Radiometric thermal imaging with ±0.03°C sensitivity. Identify hotspots, insulation failures, and equipment degradation.',
      icon: <Thermometer size={24} />,
      color: '#f97316',
      metrics: ['±0.03°C Sensitivity', 'Real-time Analysis', 'Historical Trending']
    },
    {
      id: 'mapping',
      title: 'Precision Mapping',
      subtitle: 'Topographic • Volumetric • 3D Models',
      description: 'RTK-GPS accuracy for survey-grade deliverables. Orthomosaics, DSM/DTM, and point clouds for engineering workflows.',
      icon: <Map size={24} />,
      color: '#06b6d4',
      metrics: ['±2cm RTK Accuracy', '500ha/day Capacity', 'CAD/GIS Export']
    },
    {
      id: 'security',
      title: 'Cyber & AI Advisory',
      subtitle: 'CISSP • CCSP • AIGP • PMP',
      description: 'Enterprise security strategy for critical infrastructure. AI governance, zero-trust architecture, and regulatory compliance.',
      icon: <ShieldCheck size={24} />,
      color: '#8b5cf6',
      metrics: ['NIST Framework', 'AI Governance', 'SOC 2 / ISO 27001']
    }
  ]

  const credentials = [
    { cert: 'CISSP', name: 'Certified Information Systems Security Professional' },
    { cert: 'CCSP', name: 'Certified Cloud Security Professional' },
    { cert: 'AIGP', name: 'AI Governance Professional' },
    { cert: 'PMP', name: 'Project Management Professional' }
  ]

  const industries = [
    { icon: <Zap size={20} />, name: 'Utilities', desc: 'Transmission & Distribution' },
    { icon: <Server size={20} />, name: 'Data Centers', desc: 'Facility Inspection' },
    { icon: <Building2 size={20} />, name: 'Substations', desc: 'Equipment Monitoring' },
    { icon: <Leaf size={20} />, name: 'Agriculture', desc: 'Precision Farming' }
  ]

  const stats = [
    { value: '2.4M+', label: 'Acres Surveyed' },
    { value: '99.8%', label: 'Detection Accuracy' },
    { value: '500+', label: 'Enterprise Clients' },
    { value: '<50ms', label: 'AI Inference' }
  ]

  return (
    <div className={`jinki ${isDark ? 'dark' : 'light'}`}>
      {/* Navigation */}
      <nav className="jinki-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <Satellite size={22} />
            <div className="brand-text">
              <span className="brand-name">JINKI</span>
              <span className="brand-tag">INTELLIGENCE</span>
            </div>
          </div>

          <div className="nav-links">
            <a href="#services">Services</a>
            <a href="#industries">Industries</a>
            <a href="#advisory">Advisory</a>
            <a href="#technology">Technology</a>
          </div>

          <div className="nav-actions">
            <button className="theme-toggle" onClick={() => setIsDark(!isDark)}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="nav-cta">
              Request Demo
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        ref={heroRef}
        className="jinki-hero"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* 3D Grid Background */}
        <div className="hero-grid">
          <div className="grid-perspective">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="grid-line horizontal" style={{ '--i': i }} />
            ))}
            {[...Array(20)].map((_, i) => (
              <div key={i} className="grid-line vertical" style={{ '--i': i }} />
            ))}
          </div>
          <div className="hero-gradient" />
        </div>

        {/* Floating 3D Elements */}
        <div className="hero-3d-elements">
          <div className="floating-cube cube-1">
            <div className="cube-face front" />
            <div className="cube-face back" />
            <div className="cube-face left" />
            <div className="cube-face right" />
            <div className="cube-face top" />
            <div className="cube-face bottom" />
          </div>
          <div className="floating-cube cube-2">
            <div className="cube-face front" />
            <div className="cube-face back" />
            <div className="cube-face left" />
            <div className="cube-face right" />
            <div className="cube-face top" />
            <div className="cube-face bottom" />
          </div>
          <div className="floating-ring ring-1" />
          <div className="floating-ring ring-2" />
          <div className="data-stream">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="data-particle" style={{ '--delay': i }} />
            ))}
          </div>
        </div>

        <div className="hero-content">
          <motion.div
            className="hero-eyebrow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="status-dot" />
            Autonomous Aerial Intelligence
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Critical Infrastructure
            <span className="title-accent">Inspection & Security</span>
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Enterprise drone inspection and cybersecurity advisory for utilities,
            data centers, and critical infrastructure. AI-powered analytics with
            CISSP/CCSP certified expertise.
          </motion.p>

          <motion.div
            className="hero-cta-group"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button className="btn-primary">
              Schedule Inspection
              <ArrowRight size={18} />
            </button>
            <button className="btn-secondary">
              <Play size={18} />
              Watch Overview
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="hero-trust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="trust-label">Trusted by</span>
            <div className="trust-logos">
              <div className="trust-item">Fortune 500 Utilities</div>
              <div className="trust-item">Hyperscale Data Centers</div>
              <div className="trust-item">Federal Agencies</div>
            </div>
          </motion.div>
        </div>

        <div className="scroll-indicator">
          <ChevronDown size={24} />
        </div>
      </motion.section>

      {/* Stats Bar */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, i) => (
            <div key={i} className="stat-block">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="services-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Capabilities</span>
            <h2 className="section-title">Inspection & Advisory Services</h2>
            <p className="section-desc">
              End-to-end solutions for critical infrastructure monitoring and enterprise security
            </p>
          </div>

          <div className="services-layout">
            <div className="services-nav">
              {services.map((service, i) => (
                <button
                  key={service.id}
                  className={`service-nav-item ${activeService === i ? 'active' : ''}`}
                  onClick={() => setActiveService(i)}
                  style={{ '--accent': service.color }}
                >
                  <span className="nav-icon">{service.icon}</span>
                  <div className="nav-text">
                    <span className="nav-title">{service.title}</span>
                    <span className="nav-subtitle">{service.subtitle}</span>
                  </div>
                  <div className="nav-indicator" />
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeService}
                className="service-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                style={{ '--accent': services[activeService].color }}
              >
                <div className="detail-visual">
                  <div className="visual-container">
                    {/* Dynamic visualization based on service */}
                    {activeService === 0 && <InfrastructureViz />}
                    {activeService === 1 && <ThermalViz />}
                    {activeService === 2 && <MappingViz />}
                    {activeService === 3 && <SecurityViz />}
                  </div>
                </div>
                <div className="detail-content">
                  <h3>{services[activeService].title}</h3>
                  <p>{services[activeService].description}</p>
                  <div className="detail-metrics">
                    {services[activeService].metrics.map((metric, i) => (
                      <div key={i} className="metric-tag">
                        <CheckCircle2 size={14} />
                        {metric}
                      </div>
                    ))}
                  </div>
                  <button className="detail-cta">
                    Learn More
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="industries-section">
        <div className="section-container">
          <div className="section-header center">
            <span className="section-label">Industries</span>
            <h2 className="section-title">Built for Critical Operations</h2>
          </div>

          <div className="industries-grid">
            {industries.map((ind, i) => (
              <div key={i} className="industry-card">
                <div className="industry-icon">{ind.icon}</div>
                <h3>{ind.name}</h3>
                <p>{ind.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advisory Section */}
      <section id="advisory" className="advisory-section">
        <div className="section-container">
          <div className="advisory-layout">
            <div className="advisory-content">
              <span className="section-label">Security Advisory</span>
              <h2 className="section-title">Enterprise Cybersecurity & AI Governance</h2>
              <p className="advisory-desc">
                Strategic security consulting backed by industry-leading certifications.
                We help critical infrastructure operators navigate AI implementation,
                regulatory compliance, and zero-trust architecture.
              </p>

              <div className="credentials-list">
                {credentials.map((cred, i) => (
                  <div key={i} className="credential-item">
                    <div className="cred-badge">{cred.cert}</div>
                    <span className="cred-name">{cred.name}</span>
                  </div>
                ))}
              </div>

              <button className="btn-primary">
                Schedule Consultation
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="advisory-visual">
              <div className="shield-graphic">
                <div className="shield-ring r1" />
                <div className="shield-ring r2" />
                <div className="shield-ring r3" />
                <div className="shield-core">
                  <Shield size={48} />
                </div>
                <div className="shield-nodes">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="shield-node" style={{ '--i': i }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="tech-section">
        <div className="section-container">
          <div className="section-header center">
            <span className="section-label">Technology</span>
            <h2 className="section-title">AI-Powered Intelligence</h2>
          </div>

          <div className="tech-grid">
            <div className="tech-card large">
              <div className="tech-visual">
                <div className="ai-core">
                  <div className="core-pulse" />
                  <div className="core-ring" />
                  <Cpu size={32} />
                </div>
              </div>
              <h3>Edge AI Processing</h3>
              <p>On-device inference with sub-50ms latency. Real-time anomaly detection and classification.</p>
            </div>

            {[
              { icon: <Eye />, title: 'Computer Vision', stat: 'YOLOv8+' },
              { icon: <Radio />, title: 'Multi-Spectral', stat: '5-Band' },
              { icon: <Target />, title: 'RTK GPS', stat: '±2cm' },
              { icon: <Layers />, title: '3D Modeling', stat: '10M pts' },
              { icon: <Lock />, title: 'Zero Trust', stat: 'AES-256' },
              { icon: <Workflow />, title: 'API Access', stat: 'REST/gRPC' }
            ].map((tech, i) => (
              <div key={i} className="tech-card">
                <div className="tech-icon">{tech.icon}</div>
                <h4>{tech.title}</h4>
                <span className="tech-stat">{tech.stat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-card">
            <h2>Ready to modernize your inspection operations?</h2>
            <p>Schedule a demo or consultation with our team.</p>
            <div className="cta-buttons">
              <button className="btn-primary">
                Request Demo
                <ArrowRight size={18} />
              </button>
              <button className="btn-outline">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="jinki-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="nav-brand">
              <Satellite size={22} />
              <div className="brand-text">
                <span className="brand-name">JINKI</span>
                <span className="brand-tag">INTELLIGENCE</span>
              </div>
            </div>
            <p>Critical infrastructure inspection and enterprise security advisory.</p>
            <div className="footer-certs">
              {credentials.map(c => (
                <span key={c.cert} className="cert-tag">{c.cert}</span>
              ))}
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Services</h4>
              <a href="#">Infrastructure Inspection</a>
              <a href="#">Thermal Analytics</a>
              <a href="#">Precision Mapping</a>
              <a href="#">Security Advisory</a>
            </div>
            <div className="footer-col">
              <h4>Industries</h4>
              <a href="#">Utilities</a>
              <a href="#">Data Centers</a>
              <a href="#">Substations</a>
              <a href="#">Agriculture</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
              <a href="#">Blog</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Jinki Intelligence. All rights reserved.</span>
          <div className="footer-legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Security</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Visualization Components
function InfrastructureViz() {
  return (
    <svg viewBox="0 0 400 300" className="viz-svg">
      <defs>
        <linearGradient id="infraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      {/* Transmission tower */}
      <path d="M200 280 L180 280 L165 180 L175 180 L180 160 L170 160 L175 120 L185 120 L190 80 L200 40 L210 80 L215 120 L225 120 L230 160 L220 160 L225 180 L235 180 L220 280 L200 280"
        fill="none" stroke="url(#infraGrad)" strokeWidth="2" />

      {/* Power lines */}
      <path d="M0 100 Q100 120 200 100 T400 100" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />
      <path d="M0 140 Q100 160 200 140 T400 140" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />

      {/* Drone path */}
      <circle r="8" fill="#22c55e">
        <animateMotion dur="4s" repeatCount="indefinite" path="M50,60 Q150,40 200,80 T350,50" />
      </circle>

      {/* Scan beam */}
      <ellipse cx="0" cy="0" rx="30" ry="60" fill="#22c55e" opacity="0.2">
        <animateMotion dur="4s" repeatCount="indefinite" path="M50,60 Q150,40 200,80 T350,50" />
      </ellipse>

      {/* Detection points */}
      <circle cx="200" cy="120" r="6" fill="#f97316" className="pulse-dot" />
      <circle cx="175" cy="160" r="4" fill="#22c55e" className="pulse-dot" style={{ animationDelay: '0.5s' }} />
    </svg>
  )
}

function ThermalViz() {
  return (
    <svg viewBox="0 0 400 300" className="viz-svg">
      <defs>
        <linearGradient id="thermalGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="30%" stopColor="#7c3aed" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
      </defs>

      {/* Thermal grid */}
      {[...Array(12)].map((_, y) =>
        [...Array(16)].map((_, x) => {
          const heat = Math.sin(x * 0.4) * Math.cos(y * 0.5) * 0.5 + 0.5
          return (
            <rect
              key={`${x}-${y}`}
              x={x * 25}
              y={y * 22 + 20}
              width="23"
              height="20"
              rx="2"
              fill={`hsl(${240 - heat * 200}, 80%, ${30 + heat * 40}%)`}
              opacity="0.9"
              className="thermal-cell"
              style={{ animationDelay: `${(x + y) * 50}ms` }}
            />
          )
        })
      )}

      {/* Hotspot indicator */}
      <g className="hotspot">
        <circle cx="200" cy="130" r="20" fill="none" stroke="#f97316" strokeWidth="2" />
        <circle cx="200" cy="130" r="30" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.5" className="pulse-ring" />
        <text x="200" y="100" fill="#f97316" fontSize="12" textAnchor="middle" fontWeight="600">87°C</text>
      </g>

      {/* Legend */}
      <rect x="320" y="60" width="16" height="180" rx="8" fill="url(#thermalGrad)" />
      <text x="348" y="70" fill="currentColor" fontSize="10" opacity="0.6">Hot</text>
      <text x="348" y="240" fill="currentColor" fontSize="10" opacity="0.6">Cold</text>
    </svg>
  )
}

function MappingViz() {
  return (
    <svg viewBox="0 0 400 300" className="viz-svg">
      <defs>
        <linearGradient id="topoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>

      {/* Topographic lines */}
      {[...Array(15)].map((_, i) => {
        const y = 40 + i * 15
        const amp = 25 - i * 1.2
        let d = `M 0 ${y}`
        for (let x = 0; x <= 400; x += 20) {
          const noise = Math.sin(x * 0.03 + i * 0.5) * amp
          d += ` L ${x} ${y + noise}`
        }
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="url(#topoGrad)"
            strokeWidth={1.5 - i * 0.08}
            opacity={0.3 + (i / 15) * 0.6}
            className="topo-line"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        )
      })}

      {/* Elevation markers */}
      {[100, 200, 300].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={120 + i * 20} r="4" fill="#06b6d4" />
          <text x={x + 10} y={125 + i * 20} fill="#06b6d4" fontSize="10" fontWeight="500">
            {300 + i * 50}m
          </text>
        </g>
      ))}

      {/* Survey drone */}
      <g className="survey-drone">
        <circle r="6" fill="#22c55e">
          <animateMotion dur="6s" repeatCount="indefinite" path="M20,80 L380,80 L380,180 L20,180 Z" />
        </circle>
      </g>

      {/* Point cloud dots */}
      {[...Array(30)].map((_, i) => (
        <circle
          key={i}
          cx={50 + Math.random() * 300}
          cy={60 + Math.random() * 180}
          r="2"
          fill="#06b6d4"
          opacity={0.3 + Math.random() * 0.4}
          className="point-cloud"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </svg>
  )
}

function SecurityViz() {
  return (
    <svg viewBox="0 0 400 300" className="viz-svg">
      <defs>
        <radialGradient id="shieldGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Network nodes */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const r = 100
        const x = 200 + Math.cos(angle) * r
        const y = 150 + Math.sin(angle) * r
        return (
          <g key={i}>
            <line x1="200" y1="150" x2={x} y2={y} stroke="#8b5cf6" strokeWidth="1" opacity="0.3" />
            <circle cx={x} cy={y} r="6" fill="#8b5cf6" className="node-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          </g>
        )
      })}

      {/* Shield rings */}
      <circle cx="200" cy="150" r="60" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.4" className="shield-pulse" />
      <circle cx="200" cy="150" r="80" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.2" className="shield-pulse" style={{ animationDelay: '0.3s' }} />

      {/* Central shield */}
      <circle cx="200" cy="150" r="40" fill="url(#shieldGrad)" />
      <path d="M200 120 L225 140 L225 165 L200 185 L175 165 L175 140 Z" fill="none" stroke="#8b5cf6" strokeWidth="2" />
      <path d="M200 135 L210 145 L190 145 Z" fill="#8b5cf6" />

      {/* Data packets */}
      {[0, 1, 2].map(i => (
        <circle key={i} r="3" fill="#22c55e" className="data-packet">
          <animateMotion dur={`${2 + i * 0.3}s`} repeatCount="indefinite"
            path={`M${200 + Math.cos(i * 2) * 100},${150 + Math.sin(i * 2) * 100} L200,150`} />
        </circle>
      ))}
    </svg>
  )
}

export default LandingPage2
