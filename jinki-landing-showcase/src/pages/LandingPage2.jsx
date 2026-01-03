import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Shield, Eye, Zap, Server, Building2, Leaf, Menu, X, Phone, Mail, Thermometer, Map, Target, Check, FileText, Download, Users, Award, Clock } from 'lucide-react'
import './LandingPage2.css'

// ============================================
// LOGO - Clean wordmark with subtle icon
// ============================================
function Logo() {
  return (
    <a href="/" className="logo">
      <svg className="logo__icon" viewBox="0 0 32 32" fill="none">
        <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="16" cy="16" r="4" fill="currentColor"/>
      </svg>
      <span className="logo__text">JINKI</span>
    </a>
  )
}

// ============================================
// THERMAL COMPARISON - Static, professional
// RGB vs Thermal split with annotations
// ============================================
function ThermalComparison() {
  return (
    <div className="thermal-comparison">
      {/* Visual Side */}
      <div className="thermal-comparison__panel">
        <div className="thermal-panel__header">
          <span className="thermal-panel__badge">RGB Visual</span>
        </div>
        <div className="thermal-panel__image thermal-panel__image--rgb">
          <img
            src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=85"
            alt="Solar array visual"
          />
        </div>
        <div className="thermal-panel__caption">Standard visual inspection</div>
      </div>

      {/* Thermal Side */}
      <div className="thermal-comparison__panel">
        <div className="thermal-panel__header">
          <span className="thermal-panel__badge thermal-panel__badge--thermal">Thermal IR</span>
          <span className="thermal-panel__live">● Recording</span>
        </div>
        <div className="thermal-panel__image thermal-panel__image--thermal">
          <img
            src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=85"
            alt="Solar array thermal"
          />
          <div className="thermal-overlay" />

          {/* Hotspot annotations */}
          <div className="thermal-hotspot" style={{ top: '25%', left: '30%' }}>
            <div className="hotspot__marker hotspot__marker--critical" />
            <div className="hotspot__label">
              <span className="hotspot__temp">87.3°C</span>
              <span className="hotspot__delta">ΔT +42.1°C</span>
              <span className="hotspot__status">CRITICAL - Cell Failure</span>
            </div>
          </div>

          <div className="thermal-hotspot" style={{ top: '55%', left: '65%' }}>
            <div className="hotspot__marker hotspot__marker--warning" />
            <div className="hotspot__label">
              <span className="hotspot__temp">62.8°C</span>
              <span className="hotspot__delta">ΔT +17.6°C</span>
              <span className="hotspot__status">WARNING - Bypass Diode</span>
            </div>
          </div>

          <div className="thermal-hotspot" style={{ top: '75%', left: '40%' }}>
            <div className="hotspot__marker hotspot__marker--elevated" />
            <div className="hotspot__label">
              <span className="hotspot__temp">53.4°C</span>
              <span className="hotspot__delta">ΔT +8.2°C</span>
              <span className="hotspot__status">ELEVATED - Monitor</span>
            </div>
          </div>

          {/* Temperature Scale */}
          <div className="thermal-scale">
            <div className="thermal-scale__bar" />
            <div className="thermal-scale__values">
              <span>100°C</span>
              <span>50°C</span>
              <span>0°C</span>
            </div>
          </div>
        </div>
        <div className="thermal-panel__caption">
          3 anomalies detected • FLIR Zenmuse H30T • 1280×1024
        </div>
      </div>
    </div>
  )
}

// ============================================
// LIDAR OUTPUTS - Three DISTINCT visualizations
// DEM, DSM, Classified Point Cloud
// ============================================
function LiDAROutputs() {
  const [activeOutput, setActiveOutput] = useState('dem')

  const outputs = {
    dem: {
      title: 'Digital Elevation Model',
      subtitle: 'Bare-earth terrain surface',
      description: 'Ground points only, vegetation and structures removed. Used for drainage analysis, grading design, and flood modeling.',
      gradient: 'linear-gradient(180deg, #8B4513 0%, #D2691E 25%, #F4A460 50%, #90EE90 75%, #228B22 100%)',
      specs: ['±5cm vertical accuracy', '1m grid resolution', 'Hydro-enforced']
    },
    dsm: {
      title: 'Digital Surface Model',
      subtitle: 'All surfaces including structures',
      description: 'First-return data showing top of canopy, buildings, and infrastructure. Used for line-of-sight analysis and solar studies.',
      gradient: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 20%, #0f3460 40%, #e94560 60%, #ff6b6b 80%, #feca57 100%)',
      specs: ['Building footprints', 'Canopy heights', 'Infrastructure mapping']
    },
    pointcloud: {
      title: 'Classified Point Cloud',
      subtitle: '45 pts/m² density',
      description: 'Full 3D point cloud with automated classification: ground, vegetation, buildings, power lines. Export to CAD/GIS.',
      gradient: 'none',
      isPointCloud: true,
      specs: ['2.4M points', 'LAS 1.4 format', '8 classification codes']
    }
  }

  const current = outputs[activeOutput]

  return (
    <div className="lidar-outputs">
      {/* Output Selector */}
      <div className="lidar-outputs__tabs">
        {Object.entries(outputs).map(([key, output]) => (
          <button
            key={key}
            className={`lidar-tab ${activeOutput === key ? 'lidar-tab--active' : ''}`}
            onClick={() => setActiveOutput(key)}
          >
            {output.title}
          </button>
        ))}
      </div>

      {/* Visualization */}
      <div className="lidar-outputs__display">
        <div className="lidar-display__visual">
          {current.isPointCloud ? (
            <div className="pointcloud-viz">
              {/* Static point cloud representation with distinct colors */}
              <div className="pointcloud-layer pointcloud-layer--ground">
                <span className="pointcloud-legend">Ground</span>
              </div>
              <div className="pointcloud-layer pointcloud-layer--vegetation">
                <span className="pointcloud-legend">Vegetation</span>
              </div>
              <div className="pointcloud-layer pointcloud-layer--buildings">
                <span className="pointcloud-legend">Buildings</span>
              </div>
              <div className="pointcloud-layer pointcloud-layer--powerlines">
                <span className="pointcloud-legend">Power Lines</span>
              </div>
              <div className="pointcloud-stats">
                <div><strong>2,418,392</strong> points</div>
                <div><strong>45</strong> pts/m²</div>
                <div><strong>±2cm</strong> accuracy</div>
              </div>
            </div>
          ) : (
            <div
              className="elevation-viz"
              style={{ background: current.gradient }}
            >
              <div className="elevation-contours" />
              <div className="elevation-label">{current.subtitle}</div>
            </div>
          )}
        </div>

        <div className="lidar-display__info">
          <h4>{current.title}</h4>
          <p>{current.description}</p>
          <ul className="lidar-specs">
            {current.specs.map((spec, i) => (
              <li key={i}><Check size={16} /> {spec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ============================================
// CLIENT LOGOS - Trust indicators
// ============================================
function ClientLogos() {
  const clients = [
    'FORTUNE 500 UTILITY',
    'REGIONAL POWER CO',
    'SOLAR DEVELOPER',
    'AG COOPERATIVE',
    'DATA CENTER OPS',
    'PIPELINE SERVICES'
  ]

  return (
    <div className="client-logos">
      <span className="client-logos__label">Trusted by critical infrastructure operators</span>
      <div className="client-logos__grid">
        {clients.map((client, i) => (
          <div key={i} className="client-logo">
            <span>{client}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// DELIVERABLE PREVIEW
// ============================================
function DeliverablePreview() {
  return (
    <div className="deliverable-preview">
      <div className="deliverable-preview__header">
        <FileText size={20} />
        <span>Sample Inspection Report</span>
        <Download size={16} />
      </div>
      <div className="deliverable-preview__content">
        <div className="report-section">
          <h5>Executive Summary</h5>
          <p>Inspection of 2.4MW solar installation revealed 3 critical defects, 7 moderate issues, and 12 items requiring monitoring...</p>
        </div>
        <div className="report-section">
          <h5>Thermal Findings</h5>
          <div className="report-stats">
            <div className="report-stat report-stat--critical">
              <span className="report-stat__value">3</span>
              <span className="report-stat__label">Critical</span>
            </div>
            <div className="report-stat report-stat--warning">
              <span className="report-stat__value">7</span>
              <span className="report-stat__label">Warning</span>
            </div>
            <div className="report-stat report-stat--monitor">
              <span className="report-stat__value">12</span>
              <span className="report-stat__label">Monitor</span>
            </div>
          </div>
        </div>
        <div className="report-section">
          <h5>Recommendations</h5>
          <ul>
            <li>Replace failed module at Array 3, String 7, Position 12</li>
            <li>Inspect bypass diodes at Array 1, String 2</li>
            <li>Schedule re-inspection in 90 days for monitored items</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function LandingPage2() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const capabilities = [
    {
      icon: <Eye size={24} />,
      title: 'Visual Inspection',
      description: '4K aerial imagery with AI-powered defect detection. Capture entire facilities in hours, not weeks.',
      image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80',
    },
    {
      icon: <Thermometer size={24} />,
      title: 'Thermal Analysis',
      description: 'Radiometric thermal imaging identifies hotspots, faults, and energy loss invisible to the eye.',
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80',
    },
    {
      icon: <Map size={24} />,
      title: 'LiDAR Mapping',
      description: 'Survey-grade 3D point clouds. DEM, DSM, contours, and volumetrics with centimeter accuracy.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    },
    {
      icon: <Shield size={24} />,
      title: 'Cyber & AI Advisory',
      description: 'Zero Trust architecture and AI governance for critical infrastructure protection.',
      credentials: 'CISSP • CCSP • AIGP • PMP',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80',
    },
  ]

  const industries = [
    {
      icon: <Zap size={32} />,
      name: 'Electric Utilities',
      description: 'Transmission lines, substations, and distribution infrastructure',
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=85',
      stats: ['15,000+ miles inspected', '99.7% uptime maintained']
    },
    {
      icon: <Server size={32} />,
      name: 'Data Centers',
      description: 'Thermal monitoring, roof inspection, and perimeter security',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=85',
      stats: ['Hyperscale certified', '24/7 response capability']
    },
    {
      icon: <Building2 size={32} />,
      name: 'Oil & Gas',
      description: 'Pipeline ROW, tank farms, and offshore platform inspection',
      image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=85',
      stats: ['3 continents', 'API 653 compliant']
    },
    {
      icon: <Leaf size={32} />,
      name: 'Agriculture',
      description: 'Crop health, irrigation mapping, and yield optimization',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=85',
      stats: ['500K+ acres mapped', 'NDVI analysis']
    },
  ]

  const process = [
    { step: '01', title: 'Scope', description: 'Define inspection requirements and success criteria' },
    { step: '02', title: 'Capture', description: 'Execute mission with redundant data collection' },
    { step: '03', title: 'Analyze', description: 'Process data with AI-assisted defect detection' },
    { step: '04', title: 'Deliver', description: 'Actionable report within 24 hours of flight' },
  ]

  return (
    <div className="jinki">
      {/* Navigation */}
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__container">
          <Logo />
          <nav className={`nav__menu ${menuOpen ? 'nav__menu--open' : ''}`}>
            <a href="#capabilities">Capabilities</a>
            <a href="#technology">Technology</a>
            <a href="#industries">Industries</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="nav__actions">
            <a href="tel:+15551234567" className="nav__phone">
              <Phone size={16} />
              <span>(555) 123-4567</span>
            </a>
            <a href="#contact" className="btn btn--primary">Request Quote</a>
            <button className="nav__toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="hero">
        <div className="hero__bg">
          <img
            src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=90"
            alt="Enterprise drone inspection"
          />
          <div className="hero__overlay" />
        </div>

        <motion.div className="hero__content" style={{ opacity: heroOpacity }}>
          <motion.div
            className="hero__badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span>DJI Matrice 400 RTK Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Leave No Asset<br />Unmonitored
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Enterprise drone inspection with thermal imaging, LiDAR mapping, and
            AI-powered analytics. Protecting utilities, data centers, and critical
            infrastructure across the United States.
          </motion.p>

          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <a href="#contact" className="btn btn--primary btn--lg">
              Schedule Inspection <ArrowRight size={20} />
            </a>
            <a href="#technology" className="btn btn--outline btn--lg">
              <Play size={18} /> View Capabilities
            </a>
          </motion.div>

          <motion.div
            className="hero__stats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="hero-stat">
              <span className="hero-stat__value">2.4M+</span>
              <span className="hero-stat__label">Acres Surveyed</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat__value">99.8%</span>
              <span className="hero-stat__label">Detection Rate</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat__value">&lt;24hr</span>
              <span className="hero-stat__label">Report Delivery</span>
            </div>
          </motion.div>
        </motion.div>

        <a href="#clients" className="hero__scroll">
          <ChevronDown size={24} />
        </a>
      </section>

      {/* Client Logos */}
      <section id="clients" className="section section--dark">
        <div className="container">
          <ClientLogos />
        </div>
      </section>

      {/* Process */}
      <section className="section">
        <div className="container">
          <div className="section__header section__header--center">
            <h2>How We Work</h2>
            <p>From scope to deliverable in as little as 48 hours</p>
          </div>

          <div className="process">
            {process.map((p, i) => (
              <div key={i} className="process__step">
                <span className="process__number">{p.step}</span>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="section section--alt">
        <div className="container">
          <div className="section__header">
            <span className="section__label">Capabilities</span>
            <h2>Four Core Services</h2>
            <p>Specialized inspection and advisory services for critical infrastructure</p>
          </div>

          <div className="capabilities">
            {capabilities.map((cap, i) => (
              <motion.div
                key={i}
                className="capability"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="capability__image">
                  <img src={cap.image} alt={cap.title} />
                  <div className="capability__icon">{cap.icon}</div>
                </div>
                <div className="capability__content">
                  <h3>{cap.title}</h3>
                  <p>{cap.description}</p>
                  {cap.credentials && (
                    <span className="capability__credentials">{cap.credentials}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Thermal Technology */}
      <section id="technology" className="section">
        <div className="container">
          <div className="section__header">
            <span className="section__label">Thermal Imaging</span>
            <h2>Detect What You Can't See</h2>
            <p>Side-by-side comparison showing visual inspection vs thermal analysis</p>
          </div>

          <ThermalComparison />

          <div className="thermal-features">
            <div className="thermal-feature">
              <strong>FLIR Zenmuse H30T</strong>
              <span>1280×1024 radiometric sensor</span>
            </div>
            <div className="thermal-feature">
              <strong>±0.03°C Sensitivity</strong>
              <span>Micro-differential detection</span>
            </div>
            <div className="thermal-feature">
              <strong>Real-Time Processing</strong>
              <span>AI-flagged anomalies during flight</span>
            </div>
          </div>
        </div>
      </section>

      {/* LiDAR Technology */}
      <section className="section section--alt">
        <div className="container">
          <div className="technology-split">
            <div className="technology-split__content">
              <span className="section__label">LiDAR Mapping</span>
              <h2>Survey-Grade 3D Data</h2>
              <p className="technology-split__lead">
                Zenmuse L2 captures 2.4 million points per second, delivering
                engineering-grade deliverables for terrain modeling, vegetation
                analysis, and infrastructure documentation.
              </p>
              <p>
                Each output serves a distinct purpose. Toggle between DEM, DSM,
                and classified point cloud to see the difference.
              </p>

              <DeliverablePreview />
            </div>

            <div className="technology-split__visual">
              <LiDAROutputs />
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="section">
        <div className="container">
          <div className="section__header section__header--center">
            <span className="section__label">Industries</span>
            <h2>Built for Critical Operations</h2>
            <p>We specialize in sectors where downtime costs millions</p>
          </div>

          <div className="industries">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                className="industry"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="industry__image">
                  <img src={ind.image} alt={ind.name} />
                  <div className="industry__overlay" />
                </div>
                <div className="industry__content">
                  <div className="industry__icon">{ind.icon}</div>
                  <h3>{ind.name}</h3>
                  <p>{ind.description}</p>
                  <ul className="industry__stats">
                    {ind.stats.map((stat, j) => (
                      <li key={j}><Check size={14} /> {stat}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="section section--cta">
        <div className="container">
          <div className="cta">
            <div className="cta__content">
              <h2>Ready to See What You're Missing?</h2>
              <p>
                Schedule a 30-minute discovery call. We'll discuss your infrastructure,
                your challenges, and whether we're the right fit.
              </p>
              <a href="mailto:hello@jinki.io" className="btn btn--primary btn--lg">
                Schedule Discovery Call <ArrowRight size={20} />
              </a>
              <span className="cta__note">Usually respond within 4 hours</span>
            </div>
            <div className="cta__contact">
              <div className="cta__contact-item">
                <Mail size={20} />
                <div>
                  <strong>Email</strong>
                  <span>hello@jinki.io</span>
                </div>
              </div>
              <div className="cta__contact-item">
                <Phone size={20} />
                <div>
                  <strong>Phone</strong>
                  <span>(555) 123-4567</span>
                </div>
              </div>
              <div className="cta__contact-item">
                <Clock size={20} />
                <div>
                  <strong>Response Time</strong>
                  <span>Within 4 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div className="footer__brand">
              <Logo />
              <p>Critical infrastructure inspection and cybersecurity advisory.</p>
            </div>
            <div className="footer__links">
              <div>
                <h4>Services</h4>
                <a href="#capabilities">Visual Inspection</a>
                <a href="#technology">Thermal Analysis</a>
                <a href="#technology">LiDAR Mapping</a>
                <a href="#capabilities">Cyber Advisory</a>
              </div>
              <div>
                <h4>Industries</h4>
                <a href="#industries">Electric Utilities</a>
                <a href="#industries">Data Centers</a>
                <a href="#industries">Oil & Gas</a>
                <a href="#industries">Agriculture</a>
              </div>
              <div>
                <h4>Contact</h4>
                <a href="mailto:hello@jinki.io">hello@jinki.io</a>
                <a href="tel:+15551234567">(555) 123-4567</a>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© 2026 Jinki Intelligence. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
