import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Play, ChevronDown,
  Shield, Cpu, Eye, Radio, Target, Layers, Lock,
  Server, Zap, Building2, Leaf, CheckCircle2,
  ArrowUpRight, Menu, X
} from 'lucide-react'
import './LandingPage2.css'

// Smooth spring config for premium feel
const smoothSpring = { stiffness: 100, damping: 30, mass: 1 }

function LandingPage2() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCapability, setActiveCapability] = useState(0)
  const containerRef = useRef(null)
  const heroRef = useRef(null)

  // Mouse tracking for 3D effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, smoothSpring)
  const smoothY = useSpring(mouseY, smoothSpring)

  // Scroll-based animations
  const { scrollYProgress } = useScroll()
  const headerBg = useTransform(scrollYProgress, [0, 0.1], [0, 1])

  useEffect(() => {
    const handleMouse = (e) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      mouseX.set((clientX - innerWidth / 2) / innerWidth)
      mouseY.set((clientY - innerHeight / 2) / innerHeight)
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  // Auto-rotate capabilities
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCapability(prev => (prev + 1) % capabilities.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const capabilities = [
    {
      title: 'Infrastructure Inspection',
      tagline: 'See What Others Miss',
      description: 'Our autonomous drones inspect transmission lines, substations, and data centers with centimeter-level precision. We identify equipment degradation, thermal anomalies, and structural issues before they become outages.',
      stats: [
        { value: '99.8%', label: 'Detection Rate' },
        { value: '< 4hr', label: 'Report Delivery' },
        { value: '10x', label: 'Faster Than Manual' }
      ],
      visual: 'infrastructure'
    },
    {
      title: 'Thermal Analytics',
      tagline: 'Heat Reveals Truth',
      description: 'Radiometric thermal imaging with ±0.03°C sensitivity detects hotspots invisible to the naked eye. Our AI analyzes thermal patterns to predict equipment failures weeks in advance.',
      stats: [
        { value: '±0.03°C', label: 'Sensitivity' },
        { value: '87%', label: 'Early Detection' },
        { value: '24/7', label: 'Monitoring' }
      ],
      visual: 'thermal'
    },
    {
      title: 'Precision Mapping',
      tagline: 'Survey-Grade Accuracy',
      description: 'RTK-GPS positioning delivers ±2cm accuracy for engineering-grade deliverables. Generate orthomosaics, digital surface models, and volumetric analysis for construction and mining.',
      stats: [
        { value: '±2cm', label: 'RTK Accuracy' },
        { value: '500ha', label: 'Daily Capacity' },
        { value: '10M', label: 'Points/Flight' }
      ],
      visual: 'mapping'
    },
    {
      title: 'Security Advisory',
      tagline: 'Protecting What Matters',
      description: 'Enterprise cybersecurity and AI governance consulting for critical infrastructure. We help utilities, data centers, and government agencies build resilient security postures.',
      stats: [
        { value: '15+', label: 'Years Experience' },
        { value: '200+', label: 'Assessments' },
        { value: 'Zero', label: 'Breaches' }
      ],
      visual: 'security'
    }
  ]

  const industries = [
    {
      icon: <Zap size={24} />,
      name: 'Electric Utilities',
      description: 'Transmission line inspection, substation monitoring, vegetation management',
      clients: 'Serving 12 of the top 20 US utilities'
    },
    {
      icon: <Server size={24} />,
      name: 'Data Centers',
      description: 'Thermal imaging, roof inspection, perimeter security assessment',
      clients: 'Trusted by hyperscale operators'
    },
    {
      icon: <Building2 size={24} />,
      name: 'Oil & Gas',
      description: 'Pipeline inspection, flare stack monitoring, leak detection',
      clients: 'Deployed across 3 continents'
    },
    {
      icon: <Leaf size={24} />,
      name: 'Agriculture',
      description: 'Crop health analysis, irrigation optimization, yield prediction',
      clients: 'Managing 500,000+ acres'
    }
  ]

  return (
    <div ref={containerRef} className="jinki-app">
      {/* Premium Navigation */}
      <motion.header
        className="header"
        style={{ '--header-bg': headerBg }}
      >
        <nav className="nav">
          <a href="/" className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 40 40" fill="none">
                <path d="M20 4L36 12V28L20 36L4 28V12L20 4Z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="20" cy="20" r="6" fill="currentColor"/>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-name">Jinki</span>
              <span className="logo-tag">Intelligence</span>
            </div>
          </a>

          <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
            <a href="#capabilities" onClick={() => setMenuOpen(false)}>Capabilities</a>
            <a href="#industries" onClick={() => setMenuOpen(false)}>Industries</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          </div>

          <div className="nav-actions">
            <a href="#contact" className="btn-primary">
              <span>Request Demo</span>
              <ArrowRight size={16} />
            </a>
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Hero Section - Premium Glass Design */}
      <section ref={heroRef} className="hero">
        {/* Animated Background */}
        <div className="hero-bg">
          <motion.div
            className="hero-orb orb-1"
            style={{ x: useTransform(smoothX, v => v * 30), y: useTransform(smoothY, v => v * 30) }}
          />
          <motion.div
            className="hero-orb orb-2"
            style={{ x: useTransform(smoothX, v => v * -20), y: useTransform(smoothY, v => v * -20) }}
          />
          <div className="hero-grid" />
        </div>

        {/* 3D Floating Elements */}
        <div className="hero-3d">
          <motion.div
            className="floating-card card-1"
            style={{
              rotateX: useTransform(smoothY, v => v * 10),
              rotateY: useTransform(smoothX, v => v * 10)
            }}
          >
            <div className="card-content">
              <Eye size={20} />
              <span>Real-time Analysis</span>
            </div>
          </motion.div>
          <motion.div
            className="floating-card card-2"
            style={{
              rotateX: useTransform(smoothY, v => v * -8),
              rotateY: useTransform(smoothX, v => v * -8)
            }}
          >
            <div className="card-content">
              <Shield size={20} />
              <span>Enterprise Security</span>
            </div>
          </motion.div>
          <motion.div
            className="floating-card card-3"
            style={{
              rotateX: useTransform(smoothY, v => v * 12),
              rotateY: useTransform(smoothX, v => v * -12)
            }}
          >
            <div className="card-content">
              <Target size={20} />
              <span>±2cm Precision</span>
            </div>
          </motion.div>
        </div>

        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="badge-pulse" />
            <span>Now serving Fortune 500 utilities</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Critical Infrastructure
            <br />
            <span className="title-gradient">Deserves Critical Attention</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Autonomous drone inspection and enterprise security advisory for
            utilities, data centers, and critical infrastructure operators.
            <strong> CISSP-certified team. Zero breaches. Ever.</strong>
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <a href="#contact" className="btn-primary btn-lg">
              <span>Schedule Inspection</span>
              <ArrowRight size={18} />
            </a>
            <button className="btn-secondary btn-lg">
              <Play size={18} />
              <span>Watch 2-Min Overview</span>
            </button>
          </motion.div>

          {/* Trust Bar */}
          <motion.div
            className="hero-trust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="trust-item">
              <strong>2.4M+</strong>
              <span>Acres Surveyed</span>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <strong>99.8%</strong>
              <span>Detection Rate</span>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <strong>Zero</strong>
              <span>Security Breaches</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="capabilities">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">What We Do</span>
            <h2 className="section-title">
              Four Pillars of<br />
              <span className="title-gradient">Operational Intelligence</span>
            </h2>
          </div>

          <div className="capabilities-grid">
            <div className="cap-nav">
              {capabilities.map((cap, i) => (
                <button
                  key={i}
                  className={`cap-nav-item ${activeCapability === i ? 'active' : ''}`}
                  onClick={() => setActiveCapability(i)}
                >
                  <span className="cap-num">0{i + 1}</span>
                  <span className="cap-title">{cap.title}</span>
                  <div className="cap-progress">
                    <motion.div
                      className="cap-progress-fill"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: activeCapability === i ? 1 : 0 }}
                      transition={{ duration: 5, ease: 'linear' }}
                    />
                  </div>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCapability}
                className="cap-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="cap-visual">
                  <CapabilityVisual type={capabilities[activeCapability].visual} />
                </div>
                <div className="cap-content">
                  <span className="cap-tagline">{capabilities[activeCapability].tagline}</span>
                  <h3>{capabilities[activeCapability].title}</h3>
                  <p>{capabilities[activeCapability].description}</p>

                  <div className="cap-stats">
                    {capabilities[activeCapability].stats.map((stat, i) => (
                      <div key={i} className="stat-item">
                        <span className="stat-value">{stat.value}</span>
                        <span className="stat-label">{stat.label}</span>
                      </div>
                    ))}
                  </div>

                  <a href="#contact" className="btn-secondary">
                    <span>Learn More</span>
                    <ArrowUpRight size={16} />
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="industries">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">Who We Serve</span>
            <h2 className="section-title">
              Built for <span className="title-gradient">Critical Operations</span>
            </h2>
            <p className="section-desc">
              We specialize in industries where downtime isn't an inconvenience—it's a crisis.
              Our clients operate infrastructure that powers communities and economies.
            </p>
          </div>

          <div className="industries-grid">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                className="industry-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="industry-icon">{ind.icon}</div>
                <h3>{ind.name}</h3>
                <p>{ind.description}</p>
                <span className="industry-clients">{ind.clients}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Credentials Section - WITH CONTEXT */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <span className="section-tag">Why Jinki</span>
              <h2 className="section-title">
                15 Years Protecting<br />
                <span className="title-gradient">Critical Infrastructure</span>
              </h2>

              <p className="about-lead">
                We're not just drone operators or security consultants. We're infrastructure
                specialists who understand that a single point of failure in your grid,
                data center, or pipeline can affect millions of people.
              </p>

              <p>
                Our founder spent 15 years in enterprise security before combining that
                expertise with autonomous inspection technology. The result: a team that
                thinks like hackers, flies like pilots, and advises like board members.
              </p>

              <div className="credentials-section">
                <h4>Our Certifications Explained</h4>
                <div className="cred-list">
                  <div className="cred-item">
                    <div className="cred-badge">CISSP</div>
                    <div className="cred-detail">
                      <strong>Certified Information Systems Security Professional</strong>
                      <p>The gold standard for security leadership. Only 150,000 professionals worldwide hold this credential.</p>
                    </div>
                  </div>
                  <div className="cred-item">
                    <div className="cred-badge">CCSP</div>
                    <div className="cred-detail">
                      <strong>Certified Cloud Security Professional</strong>
                      <p>Essential for protecting your cloud infrastructure and hybrid environments.</p>
                    </div>
                  </div>
                  <div className="cred-item">
                    <div className="cred-badge">AIGP</div>
                    <div className="cred-detail">
                      <strong>AI Governance Professional</strong>
                      <p>Navigating AI implementation with ethics, compliance, and risk management.</p>
                    </div>
                  </div>
                  <div className="cred-item">
                    <div className="cred-badge">PMP</div>
                    <div className="cred-detail">
                      <strong>Project Management Professional</strong>
                      <p>Ensuring your inspection programs deliver on time and on budget.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-visual">
              <div className="shield-animation">
                <div className="shield-ring ring-1" />
                <div className="shield-ring ring-2" />
                <div className="shield-ring ring-3" />
                <div className="shield-center">
                  <Shield size={48} />
                </div>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="shield-node" style={{ '--i': i }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="technology">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">Our Stack</span>
            <h2 className="section-title">
              Technology That <span className="title-gradient">Actually Works</span>
            </h2>
          </div>

          <div className="tech-grid">
            <div className="tech-card tech-featured">
              <div className="tech-visual">
                <div className="ai-orb">
                  <Cpu size={32} />
                </div>
              </div>
              <h3>Edge AI Processing</h3>
              <p>
                On-device inference means real-time anomaly detection at 50ms latency.
                No cloud dependency. No data leaves your premises unless you want it to.
              </p>
              <div className="tech-tags">
                <span>Sub-50ms Latency</span>
                <span>Air-gapped Option</span>
              </div>
            </div>

            {[
              { icon: <Eye size={22} />, name: 'Computer Vision', spec: 'YOLOv8+' },
              { icon: <Radio size={22} />, name: 'Multi-Spectral', spec: '5-Band NDVI' },
              { icon: <Target size={22} />, name: 'RTK Positioning', spec: '±2cm Accuracy' },
              { icon: <Layers size={22} />, name: '3D Modeling', spec: '10M Points/Flight' },
              { icon: <Lock size={22} />, name: 'Zero Trust', spec: 'AES-256 Encrypted' }
            ].map((tech, i) => (
              <div key={i} className="tech-card tech-small">
                <div className="tech-icon">{tech.icon}</div>
                <h4>{tech.name}</h4>
                <span className="tech-spec">{tech.spec}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="cta">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Ready to See What You've Been Missing?</h2>
              <p>
                Schedule a 30-minute discovery call. We'll discuss your infrastructure,
                your challenges, and whether we're the right fit. No pressure, no pitch deck—
                just a conversation between professionals.
              </p>
              <div className="cta-actions">
                <a href="mailto:hello@jinki.io" className="btn-primary btn-lg">
                  <span>Schedule Discovery Call</span>
                  <ArrowRight size={18} />
                </a>
                <span className="cta-note">Usually respond within 4 hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <div className="logo-icon">
                  <svg viewBox="0 0 40 40" fill="none">
                    <path d="M20 4L36 12V28L20 36L4 28V12L20 4Z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="20" cy="20" r="6" fill="currentColor"/>
                  </svg>
                </div>
                <div className="logo-text">
                  <span className="logo-name">Jinki</span>
                  <span className="logo-tag">Intelligence</span>
                </div>
              </div>
              <p>Critical infrastructure inspection and enterprise security advisory.</p>
              <div className="footer-certs">
                <span>CISSP</span>
                <span>CCSP</span>
                <span>AIGP</span>
                <span>PMP</span>
              </div>
            </div>

            <div className="footer-links">
              <div className="footer-col">
                <h4>Capabilities</h4>
                <a href="#capabilities">Infrastructure Inspection</a>
                <a href="#capabilities">Thermal Analytics</a>
                <a href="#capabilities">Precision Mapping</a>
                <a href="#capabilities">Security Advisory</a>
              </div>
              <div className="footer-col">
                <h4>Industries</h4>
                <a href="#industries">Electric Utilities</a>
                <a href="#industries">Data Centers</a>
                <a href="#industries">Oil & Gas</a>
                <a href="#industries">Agriculture</a>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
                <a href="#">Careers</a>
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
        </div>
      </footer>
    </div>
  )
}

// Capability Visualizations
function CapabilityVisual({ type }) {
  switch(type) {
    case 'infrastructure':
      return (
        <svg viewBox="0 0 400 300" className="viz">
          <defs>
            <linearGradient id="towerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8"/>
            </linearGradient>
          </defs>
          {/* Power tower silhouette */}
          <path d="M200 260 L185 260 L172 180 L180 180 L176 150 L168 150 L175 100 L182 100 L188 60 L200 30 L212 60 L218 100 L225 100 L232 150 L224 150 L220 180 L228 180 L215 260 Z"
            fill="url(#towerGrad)" stroke="#3b82f6" strokeWidth="1"/>
          {/* Power lines */}
          <path d="M0 80 Q100 95 200 80 T400 80" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.5"/>
          <path d="M0 110 Q100 125 200 110 T400 110" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.5"/>
          {/* Drone */}
          <g>
            <circle r="8" fill="#22c55e">
              <animateMotion dur="5s" repeatCount="indefinite" path="M30,50 Q150,30 250,60 T380,40"/>
            </circle>
            <circle r="20" fill="#22c55e" opacity="0.2">
              <animateMotion dur="5s" repeatCount="indefinite" path="M30,50 Q150,30 250,60 T380,40"/>
            </circle>
          </g>
          {/* Hotspot detected */}
          <circle cx="200" cy="100" r="8" fill="#f97316">
            <animate attributeName="r" values="8;12;8" dur="1s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
          </circle>
          <text x="220" y="95" fill="#f97316" fontSize="11" fontWeight="600">Anomaly Detected</text>
        </svg>
      )
    case 'thermal':
      return (
        <svg viewBox="0 0 400 300" className="viz">
          <defs>
            <linearGradient id="thermalScale" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1e40af"/>
              <stop offset="30%" stopColor="#7c3aed"/>
              <stop offset="60%" stopColor="#f97316"/>
              <stop offset="100%" stopColor="#fef3c7"/>
            </linearGradient>
          </defs>
          {/* Thermal grid */}
          {[...Array(10)].map((_, y) =>
            [...Array(14)].map((_, x) => {
              const heat = Math.sin(x * 0.4 + y * 0.3) * 0.5 + 0.5
              return (
                <rect key={`${x}-${y}`} x={x * 26 + 20} y={y * 26 + 20} width="24" height="24" rx="4"
                  fill={`hsl(${240 - heat * 200}, 80%, ${25 + heat * 45}%)`}
                  opacity="0.9"/>
              )
            })
          )}
          {/* Hotspot */}
          <g>
            <circle cx="180" cy="130" r="25" fill="none" stroke="#f97316" strokeWidth="3">
              <animate attributeName="r" values="25;35;25" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text x="180" y="90" fill="#f97316" fontSize="14" fontWeight="700" textAnchor="middle">87.3°C</text>
            <text x="180" y="105" fill="#f97316" fontSize="10" textAnchor="middle">Critical</text>
          </g>
          {/* Legend */}
          <rect x="360" y="40" width="20" height="200" rx="10" fill="url(#thermalScale)"/>
          <text x="352" y="35" fill="#94a3b8" fontSize="9" textAnchor="end">Hot</text>
          <text x="352" y="245" fill="#94a3b8" fontSize="9" textAnchor="end">Cold</text>
        </svg>
      )
    case 'mapping':
      return (
        <svg viewBox="0 0 400 300" className="viz">
          <defs>
            <linearGradient id="topoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4"/>
              <stop offset="100%" stopColor="#0891b2"/>
            </linearGradient>
          </defs>
          {/* Topographic contours */}
          {[...Array(12)].map((_, i) => {
            const y = 30 + i * 20
            const amp = 30 - i * 2
            let d = `M 20 ${y}`
            for (let x = 20; x <= 380; x += 15) {
              d += ` L ${x} ${y + Math.sin(x * 0.02 + i * 0.5) * amp}`
            }
            return <path key={i} d={d} fill="none" stroke="url(#topoGrad)" strokeWidth={2 - i * 0.1} opacity={0.2 + i * 0.06}/>
          })}
          {/* Elevation markers */}
          {[120, 200, 280].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={140 + i * 30} r="5" fill="#06b6d4"/>
              <text x={x + 12} y={145 + i * 30} fill="#06b6d4" fontSize="11" fontWeight="600">{350 + i * 75}m</text>
            </g>
          ))}
          {/* Survey drone path */}
          <path d="M30 100 L370 100 L370 200 L30 200 Z" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="8 4" opacity="0.5"/>
          <circle r="6" fill="#22c55e">
            <animateMotion dur="8s" repeatCount="indefinite" path="M30 100 L370 100 L370 200 L30 200 Z"/>
          </circle>
        </svg>
      )
    case 'security':
      return (
        <svg viewBox="0 0 400 300" className="viz">
          {/* Network nodes */}
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2
            const x = 200 + Math.cos(angle) * 100
            const y = 150 + Math.sin(angle) * 100
            return (
              <g key={i}>
                <line x1="200" y1="150" x2={x} y2={y} stroke="#8b5cf6" strokeWidth="1" opacity="0.3"/>
                <circle cx={x} cy={y} r="6" fill="#8b5cf6">
                  <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" begin={`${i * 0.2}s`}/>
                </circle>
              </g>
            )
          })}
          {/* Shield rings */}
          <circle cx="200" cy="150" r="70" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.2"/>
          <circle cx="200" cy="150" r="50" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity="0.4"/>
          {/* Central shield */}
          <circle cx="200" cy="150" r="30" fill="rgba(139,92,246,0.1)"/>
          <path d="M200 130 L218 142 L218 162 L200 175 L182 162 L182 142 Z" fill="none" stroke="#8b5cf6" strokeWidth="2"/>
          <text x="200" y="210" fill="#8b5cf6" fontSize="11" fontWeight="600" textAnchor="middle">Zero Trust Architecture</text>
          {/* Data packets */}
          {[0, 1, 2].map(i => (
            <circle key={i} r="4" fill="#22c55e">
              <animateMotion dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite"
                path={`M${200 + Math.cos(i * 2) * 100},${150 + Math.sin(i * 2) * 100} L200,150`}/>
            </circle>
          ))}
        </svg>
      )
    default:
      return null
  }
}

export default LandingPage2
