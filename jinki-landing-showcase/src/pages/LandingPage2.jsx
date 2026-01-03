import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Shield, Cpu, Eye, Target, Zap, Server, Building2, Leaf, Menu, X, CheckCircle2, Phone, Mail, Thermometer, Map, Radio, Lock, BarChart3, Clock, Award } from 'lucide-react'
import './LandingPage2.css'

// High-quality Unsplash images
const IMAGES = {
  heroDrone: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=90',
  droneFlying: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&q=85',
  solarFarm: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=85',
  powerLines: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=85',
  dataCenter: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=85',
  aerial: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85',
  thermalReal: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=85',
  agriculture: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=85',
  oilGas: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=85',
  team: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=85',
  mapping: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=1200&q=85',
}

// ============================================
// PROFESSIONAL LOGO
// ============================================
function Logo({ variant = 'default' }) {
  return (
    <a href="/" className={`logo logo--${variant}`}>
      <div className="logo__icon">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <circle cx="16" cy="16" r="5" fill="currentColor"/>
          <path d="M16 6V11M16 21V26M6 11L11 14M21 18L26 21M6 21L11 18M21 14L26 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="logo__text">
        <span className="logo__name">JINKI</span>
        <span className="logo__tagline">Intelligence</span>
      </div>
    </a>
  )
}

// ============================================
// PARALLAX IMAGE
// ============================================
function ParallaxImage({ src, alt, className = '' }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"])

  return (
    <div ref={ref} className={`parallax-wrap ${className}`}>
      <motion.img src={src} alt={alt} style={{ y }} loading="lazy" />
    </div>
  )
}

// ============================================
// THERMAL SHOWCASE - Real thermal imagery
// ============================================
function ThermalShowcase() {
  const [activeView, setActiveView] = useState('thermal')

  return (
    <div className="thermal-showcase">
      <div className="thermal-showcase__display">
        <div className="thermal-showcase__screen">
          {/* Thermal gradient overlay */}
          <div className={`thermal-showcase__view thermal-showcase__view--${activeView}`}>
            <img
              src={IMAGES.solarFarm}
              alt="Infrastructure thermal scan"
            />
            <div className="thermal-showcase__overlay" />
            <div className="thermal-showcase__hotspots">
              <div className="hotspot hotspot--critical" style={{ top: '30%', left: '45%' }}>
                <span className="hotspot__temp">87.3°C</span>
                <span className="hotspot__label">Critical</span>
              </div>
              <div className="hotspot hotspot--warning" style={{ top: '55%', left: '25%' }}>
                <span className="hotspot__temp">62.1°C</span>
                <span className="hotspot__label">Warning</span>
              </div>
              <div className="hotspot hotspot--normal" style={{ top: '40%', left: '70%' }}>
                <span className="hotspot__temp">34.5°C</span>
                <span className="hotspot__label">Normal</span>
              </div>
            </div>
          </div>

          {/* HUD overlay */}
          <div className="thermal-showcase__hud">
            <div className="hud__top">
              <span>FLIR XT2 | 640×512</span>
              <span>14:32:07 UTC</span>
            </div>
            <div className="hud__scale">
              <div className="hud__gradient" />
              <div className="hud__temps">
                <span>120°C</span>
                <span>60°C</span>
                <span>0°C</span>
              </div>
            </div>
          </div>
        </div>

        <div className="thermal-showcase__controls">
          <button
            className={activeView === 'thermal' ? 'active' : ''}
            onClick={() => setActiveView('thermal')}
          >
            <Thermometer size={16} />
            Thermal
          </button>
          <button
            className={activeView === 'visual' ? 'active' : ''}
            onClick={() => setActiveView('visual')}
          >
            <Eye size={16} />
            Visual
          </button>
          <button
            className={activeView === 'blend' ? 'active' : ''}
            onClick={() => setActiveView('blend')}
          >
            <Radio size={16} />
            MSX Blend
          </button>
        </div>
      </div>

      <div className="thermal-showcase__stats">
        <div className="thermal-stat">
          <span className="thermal-stat__value">±0.03°C</span>
          <span className="thermal-stat__label">Thermal Sensitivity</span>
        </div>
        <div className="thermal-stat">
          <span className="thermal-stat__value">640×512</span>
          <span className="thermal-stat__label">Resolution</span>
        </div>
        <div className="thermal-stat">
          <span className="thermal-stat__value">30Hz</span>
          <span className="thermal-stat__label">Frame Rate</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 3D MAPPING SHOWCASE
// ============================================
function MappingShowcase() {
  return (
    <div className="mapping-showcase">
      <div className="mapping-showcase__visual">
        <img src={IMAGES.mapping} alt="Topographic 3D mapping" />
        <div className="mapping-showcase__grid" />
        <div className="mapping-showcase__points">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="mapping-point"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
        <div className="mapping-showcase__data">
          <div className="data-row">
            <span>Points Captured</span>
            <span className="data-value">2.4M</span>
          </div>
          <div className="data-row">
            <span>Ground Resolution</span>
            <span className="data-value">2.1 cm/px</span>
          </div>
          <div className="data-row">
            <span>RTK Accuracy</span>
            <span className="data-value">±2 cm</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// CASE STUDY CARD
// ============================================
function CaseStudyCard({ image, category, title, stats, description }) {
  return (
    <motion.div
      className="case-study"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="case-study__image">
        <img src={image} alt={title} />
        <span className="case-study__category">{category}</span>
      </div>
      <div className="case-study__content">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="case-study__stats">
          {stats.map((stat, i) => (
            <div key={i} className="case-study__stat">
              <span className="case-study__stat-value">{stat.value}</span>
              <span className="case-study__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
function LandingPage2() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const capabilities = [
    {
      icon: <Eye size={24} />,
      title: 'Visual Inspection',
      description: '4K aerial imagery with AI-powered defect detection. We see what ground crews miss.',
      image: IMAGES.droneFlying
    },
    {
      icon: <Thermometer size={24} />,
      title: 'Thermal Analysis',
      description: 'Radiometric thermal imaging identifies hotspots and predicts failures before they happen.',
      image: IMAGES.thermalReal
    },
    {
      icon: <Map size={24} />,
      title: 'Precision Mapping',
      description: 'Survey-grade 3D models and point clouds with centimeter-level RTK accuracy.',
      image: IMAGES.aerial
    },
    {
      icon: <Shield size={24} />,
      title: 'Cyber Advisory',
      description: 'CISSP-certified team builds Zero Trust security for critical infrastructure.',
      image: IMAGES.dataCenter
    }
  ]

  const industries = [
    {
      icon: <Zap size={32} />,
      name: 'Electric Utilities',
      description: 'Power line, substation, and transmission tower inspection',
      image: IMAGES.powerLines,
      stat: '12 of Top 20 US Utilities'
    },
    {
      icon: <Server size={32} />,
      name: 'Data Centers',
      description: 'Thermal monitoring and security assessment',
      image: IMAGES.dataCenter,
      stat: 'Hyperscale Operators'
    },
    {
      icon: <Building2 size={32} />,
      name: 'Oil & Gas',
      description: 'Pipeline, refinery, and offshore platform inspection',
      image: IMAGES.oilGas,
      stat: '3 Continents'
    },
    {
      icon: <Leaf size={32} />,
      name: 'Agriculture',
      description: 'Crop health, irrigation, and yield optimization',
      image: IMAGES.agriculture,
      stat: '500,000+ Acres'
    }
  ]

  const caseStudies = [
    {
      image: IMAGES.solarFarm,
      category: 'Solar Energy',
      title: '2.4GW Solar Farm Thermal Audit',
      description: 'Identified 847 failing cells across 12,000 acres in 3 days—a task that would take ground crews 6 months.',
      stats: [
        { value: '847', label: 'Defects Found' },
        { value: '3 days', label: 'Completion Time' },
        { value: '$2.1M', label: 'Prevented Losses' }
      ]
    },
    {
      image: IMAGES.powerLines,
      category: 'Electric Utility',
      title: 'Transmission Line LiDAR Survey',
      description: 'Mapped 340 miles of transmission corridor with vegetation encroachment analysis and clearance reporting.',
      stats: [
        { value: '340 mi', label: 'Lines Surveyed' },
        { value: '±2cm', label: 'Accuracy' },
        { value: '12', label: 'Critical Findings' }
      ]
    }
  ]

  const metrics = [
    { icon: <BarChart3 size={24} />, value: '2.4M+', label: 'Acres Surveyed' },
    { icon: <Target size={24} />, value: '99.8%', label: 'Detection Rate' },
    { icon: <Clock size={24} />, value: '< 24hr', label: 'Report Delivery' },
    { icon: <Shield size={24} />, value: 'Zero', label: 'Security Breaches' }
  ]

  const credentials = [
    { abbr: 'CISSP', full: 'Certified Information Systems Security Professional', desc: 'The gold standard. Only 150,000 worldwide.' },
    { abbr: 'CCSP', full: 'Certified Cloud Security Professional', desc: 'Protecting hybrid cloud infrastructure.' },
    { abbr: 'AIGP', full: 'AI Governance Professional', desc: 'Ethical AI implementation and compliance.' },
    { abbr: 'PMP', full: 'Project Management Professional', desc: 'On-time, on-budget delivery.' }
  ]

  return (
    <div className="jinki">
      {/* Navigation */}
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__container">
          <Logo />
          <nav className={`nav__menu ${menuOpen ? 'nav__menu--open' : ''}`}>
            <a href="#capabilities">Capabilities</a>
            <a href="#industries">Industries</a>
            <a href="#work">Case Studies</a>
            <a href="#about">About</a>
          </nav>
          <div className="nav__actions">
            <a href="tel:+1234567890" className="nav__phone">
              <Phone size={16} />
              <span>(555) 123-4567</span>
            </a>
            <a href="#contact" className="btn btn--primary">Get Quote</a>
            <button className="nav__toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="hero">
        <motion.div className="hero__bg" style={{ scale: heroScale }}>
          <img src={IMAGES.heroDrone} alt="Drone aerial inspection" />
          <div className="hero__gradient" />
        </motion.div>

        <motion.div className="hero__content" style={{ opacity: heroOpacity }}>
          <motion.span
            className="hero__eyebrow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="hero__eyebrow-dot" />
            Trusted by Fortune 500 Utilities
          </motion.span>

          <motion.h1
            className="hero__title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Critical Infrastructure
            <span>Deserves Critical Attention</span>
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Autonomous drone inspection and enterprise security advisory
            for utilities, data centers, and critical infrastructure operators.
          </motion.p>

          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <a href="#contact" className="btn btn--primary btn--lg">
              Schedule Inspection
              <ArrowRight size={20} />
            </a>
            <a href="#work" className="btn btn--ghost btn--lg">
              <Play size={18} />
              View Our Work
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero__metrics"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {metrics.map((m, i) => (
            <div key={i} className="hero__metric">
              {m.icon}
              <div>
                <span className="hero__metric-value">{m.value}</span>
                <span className="hero__metric-label">{m.label}</span>
              </div>
            </div>
          ))}
        </motion.div>

        <a href="#capabilities" className="hero__scroll">
          <span>Explore</span>
          <ChevronDown size={20} />
        </a>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="capabilities">
        <div className="container">
          <div className="section-header section-header--center">
            <span className="section-tag">What We Do</span>
            <h2>Four Pillars of Operational Intelligence</h2>
            <p>From thermal anomaly detection to cybersecurity advisory—we protect what matters most.</p>
          </div>

          <div className="capabilities__grid">
            {capabilities.map((cap, i) => (
              <motion.div
                key={i}
                className="capability"
                initial={{ opacity: 0, y: 40 }}
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
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Thermal Technology */}
      <section className="thermal-section">
        <div className="container">
          <div className="thermal-section__layout">
            <div className="thermal-section__content">
              <span className="section-tag">Technology</span>
              <h2>See What Others Miss</h2>
              <p className="lead">
                Our FLIR-certified thermographers use radiometric cameras
                to detect temperature differentials invisible to the naked eye.
              </p>
              <ul className="feature-list">
                <li>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Predictive Failure Detection</strong>
                    <span>Identify failing components weeks before catastrophic failure</span>
                  </div>
                </li>
                <li>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Real-Time Anomaly Alerts</strong>
                    <span>AI-powered detection flags critical issues during flight</span>
                  </div>
                </li>
                <li>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>NFPA 70B Compliant</strong>
                    <span>Meets 2023 infrared thermography requirements</span>
                  </div>
                </li>
              </ul>
            </div>
            <ThermalShowcase />
          </div>
        </div>
      </section>

      {/* Mapping Section */}
      <section className="mapping-section">
        <div className="container">
          <div className="mapping-section__layout">
            <MappingShowcase />
            <div className="mapping-section__content">
              <span className="section-tag">Precision</span>
              <h2>Survey-Grade 3D Mapping</h2>
              <p className="lead">
                Photogrammetry and LiDAR capture millions of data points,
                creating engineering-grade deliverables for your team.
              </p>
              <div className="deliverables">
                <div className="deliverable">
                  <Map size={20} />
                  <span>Orthomosaic Maps</span>
                </div>
                <div className="deliverable">
                  <BarChart3 size={20} />
                  <span>Digital Elevation Models</span>
                </div>
                <div className="deliverable">
                  <Cpu size={20} />
                  <span>3D Point Clouds</span>
                </div>
                <div className="deliverable">
                  <Target size={20} />
                  <span>Volumetric Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="industries">
        <div className="container">
          <div className="section-header section-header--center">
            <span className="section-tag">Industries</span>
            <h2>Built for Critical Operations</h2>
            <p>We specialize in sectors where downtime isn't an inconvenience—it's a crisis.</p>
          </div>

          <div className="industries__grid">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                className="industry"
                initial={{ opacity: 0, y: 40 }}
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
                  <span className="industry__stat">{ind.stat}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section id="work" className="work">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Case Studies</span>
            <h2>Real Results for Real Infrastructure</h2>
          </div>

          <div className="work__grid">
            {caseStudies.map((study, i) => (
              <CaseStudyCard key={i} {...study} />
            ))}
          </div>
        </div>
      </section>

      {/* About / Credentials */}
      <section id="about" className="about">
        <div className="container">
          <div className="about__layout">
            <div className="about__image">
              <ParallaxImage src={IMAGES.team} alt="Jinki Intelligence team" />
            </div>
            <div className="about__content">
              <span className="section-tag">About Us</span>
              <h2>15 Years Protecting Critical Infrastructure</h2>
              <p className="lead">
                We're not just drone operators. We're infrastructure specialists
                who understand that a single point of failure can affect millions.
              </p>
              <p>
                Our team combines FAA Part 107 certified pilots, FLIR thermographers,
                and cybersecurity professionals with deep experience in utility,
                energy, and government sectors.
              </p>

              <div className="credentials">
                {credentials.map((cred, i) => (
                  <motion.div
                    key={i}
                    className="credential"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="credential__badge">{cred.abbr}</div>
                    <div className="credential__info">
                      <strong>{cred.full}</strong>
                      <span>{cred.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="cta">
        <div className="container">
          <div className="cta__content">
            <h2>Ready to See What You've Been Missing?</h2>
            <p>
              Schedule a 30-minute discovery call. We'll discuss your infrastructure,
              your challenges, and whether we're the right fit.
            </p>
            <a href="mailto:hello@jinki.io" className="btn btn--primary btn--xl">
              Schedule Discovery Call
              <ArrowRight size={24} />
            </a>
            <span className="cta__note">Usually respond within 4 hours</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__main">
            <div className="footer__brand">
              <Logo variant="light" />
              <p>Critical infrastructure inspection and enterprise security advisory for utilities, data centers, and government agencies.</p>
              <div className="footer__contact">
                <a href="mailto:hello@jinki.io"><Mail size={16} /> hello@jinki.io</a>
                <a href="tel:+15551234567"><Phone size={16} /> (555) 123-4567</a>
              </div>
            </div>
            <div className="footer__nav">
              <div>
                <h4>Services</h4>
                <a href="#capabilities">Aerial Inspection</a>
                <a href="#capabilities">Thermal Analytics</a>
                <a href="#capabilities">Precision Mapping</a>
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
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#work">Case Studies</a>
                <a href="#contact">Contact</a>
                <a href="#">Careers</a>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© 2026 Jinki Intelligence. All rights reserved.</span>
            <div className="footer__certs">
              {['CISSP', 'CCSP', 'AIGP', 'PMP'].map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage2
