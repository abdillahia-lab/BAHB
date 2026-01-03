import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Shield, Cpu, Eye, Target, Zap, Server, Building2, Leaf, Menu, X, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react'
import './LandingPage2.css'

// ============================================
// PROFESSIONAL LOGO - Clean, Minimal, Enterprise
// ============================================
function Logo({ variant = 'default' }) {
  return (
    <a href="/" className={`logo logo--${variant}`}>
      <div className="logo__mark">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Drone icon - abstract quadcopter */}
          <circle cx="20" cy="20" r="4" fill="currentColor" />
          <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
          <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="26" x2="20" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="20" x2="14" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="26" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          {/* Rotor circles */}
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="32" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="8" cy="32" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="32" cy="32" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
      <div className="logo__text">
        <span className="logo__name">JINKI</span>
        <span className="logo__tagline">INTELLIGENCE</span>
      </div>
    </a>
  )
}

// ============================================
// VIDEO BACKGROUND COMPONENT
// ============================================
function VideoBackground({ src, poster, overlay = true }) {
  const videoRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.play().catch(() => {})
    }
  }, [])

  return (
    <div className="video-bg">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        onLoadedData={() => setIsLoaded(true)}
        className={isLoaded ? 'loaded' : ''}
      >
        <source src={src} type="video/mp4" />
      </video>
      {overlay && <div className="video-bg__overlay" />}
    </div>
  )
}

// ============================================
// STAT COUNTER COMPONENT
// ============================================
function StatCounter({ value, label, suffix = '' }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}{suffix}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}

// ============================================
// THERMAL COMPARISON COMPONENT
// ============================================
function ThermalComparison() {
  const [position, setPosition] = useState(50)
  const containerRef = useRef(null)

  const handleMove = (e) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = (x / rect.width) * 100
    setPosition(Math.max(5, Math.min(95, percent)))
  }

  return (
    <div
      ref={containerRef}
      className="thermal-compare"
      onMouseMove={handleMove}
      onTouchMove={(e) => handleMove(e.touches[0])}
    >
      <div className="thermal-compare__visual">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
          alt="Normal view of solar panels"
          className="thermal-compare__normal"
        />
        <div
          className="thermal-compare__thermal-wrap"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          {/* Thermal overlay effect */}
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
            alt="Thermal view"
            className="thermal-compare__thermal"
          />
        </div>
        <div
          className="thermal-compare__slider"
          style={{ left: `${position}%` }}
        >
          <div className="thermal-compare__handle">
            <span>‹›</span>
          </div>
        </div>
      </div>
      <div className="thermal-compare__labels">
        <span>Visual Spectrum</span>
        <span>Thermal Imaging</span>
      </div>
    </div>
  )
}

// ============================================
// MAIN LANDING PAGE
// ============================================
function LandingPage2() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on escape
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const services = [
    {
      icon: <Eye size={32} />,
      title: 'Aerial Inspection',
      description: 'Autonomous drone surveys with centimeter-level precision. We detect equipment degradation before it becomes an outage.',
      features: ['Power Lines & Substations', 'Solar Farm Analysis', 'Cell Tower Inspection'],
      stat: { value: '99.8%', label: 'Detection Rate' }
    },
    {
      icon: <Zap size={32} />,
      title: 'Thermal Analytics',
      description: 'Radiometric thermal imaging with ±0.03°C sensitivity identifies hotspots and predicts failures weeks in advance.',
      features: ['Heat Loss Detection', 'Electrical Fault Finding', 'Predictive Maintenance'],
      stat: { value: '±0.03°C', label: 'Sensitivity' }
    },
    {
      icon: <Target size={32} />,
      title: 'Precision Mapping',
      description: 'RTK-GPS positioning delivers survey-grade accuracy for engineering deliverables and volumetric analysis.',
      features: ['Topographic Surveys', 'Volumetric Calculations', '3D Point Clouds'],
      stat: { value: '±2cm', label: 'RTK Accuracy' }
    },
    {
      icon: <Shield size={32} />,
      title: 'Security Advisory',
      description: 'CISSP-certified team builds Zero Trust security postures for critical infrastructure operators.',
      features: ['Risk Assessment', 'Compliance Audits', 'Incident Response'],
      stat: { value: 'Zero', label: 'Breaches' }
    }
  ]

  const industries = [
    { icon: <Zap size={28} />, name: 'Electric Utilities', stat: '12 of Top 20 US Utilities' },
    { icon: <Server size={28} />, name: 'Data Centers', stat: 'Hyperscale Operators' },
    { icon: <Building2 size={28} />, name: 'Oil & Gas', stat: '3 Continents' },
    { icon: <Leaf size={28} />, name: 'Agriculture', stat: '500,000+ Acres' }
  ]

  const credentials = [
    { abbr: 'CISSP', full: 'Certified Information Systems Security Professional' },
    { abbr: 'CCSP', full: 'Certified Cloud Security Professional' },
    { abbr: 'AIGP', full: 'AI Governance Professional' },
    { abbr: 'PMP', full: 'Project Management Professional' }
  ]

  const processSteps = [
    { num: '01', title: 'Discovery', desc: 'We analyze your infrastructure, identify critical assets, and design a custom inspection program.' },
    { num: '02', title: 'Deploy', desc: 'Our certified pilots deploy autonomous drones with thermal, visual, and LiDAR payloads.' },
    { num: '03', title: 'Analyze', desc: 'AI-powered analysis identifies defects, generates reports, and prioritizes maintenance.' },
    { num: '04', title: 'Protect', desc: 'Ongoing security advisory ensures your data and operations remain protected.' }
  ]

  return (
    <div className="jinki">
      {/* Navigation */}
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__container">
          <Logo />

          <nav className={`nav__menu ${menuOpen ? 'nav__menu--open' : ''}`}>
            <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="#industries" onClick={() => setMenuOpen(false)}>Industries</a>
            <a href="#process" onClick={() => setMenuOpen(false)}>Process</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          </nav>

          <div className="nav__actions">
            <a href="tel:+1234567890" className="nav__phone">
              <Phone size={18} />
              <span>Call Us</span>
            </a>
            <a href="#contact" className="btn btn--primary btn--sm">
              Get Quote
            </a>
            <button
              className="nav__toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <nav className="mobile-menu__nav">
              <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
              <a href="#industries" onClick={() => setMenuOpen(false)}>Industries</a>
              <a href="#process" onClick={() => setMenuOpen(false)}>Process</a>
              <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
              <a href="#contact" className="btn btn--primary" onClick={() => setMenuOpen(false)}>Get Quote</a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="hero">
        <VideoBackground
          src="https://videos.pexels.com/video-files/2833660/2833660-uhd_2560_1440_30fps.mp4"
          poster="https://images.pexels.com/videos/2833660/free-video-2833660.jpg?auto=compress&cs=tinysrgb&w=1920"
        />

        <div className="hero__content">
          <motion.div
            className="hero__badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="hero__badge-dot" />
            Trusted by Fortune 500 utilities
          </motion.div>

          <motion.h1
            className="hero__title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Critical Infrastructure
            <span className="hero__title--accent"> Deserves Critical Attention</span>
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Autonomous drone inspection and enterprise security advisory for utilities,
            data centers, and critical infrastructure operators.
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
            <a href="#services" className="btn btn--outline btn--lg">
              <Play size={18} />
              See How It Works
            </a>
          </motion.div>

          <motion.div
            className="hero__stats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <StatCounter value="2.4M" suffix="+" label="Acres Surveyed" />
            <div className="hero__stats-divider" />
            <StatCounter value="99.8" suffix="%" label="Detection Rate" />
            <div className="hero__stats-divider" />
            <StatCounter value="Zero" label="Security Breaches" />
          </motion.div>
        </div>

        <a href="#services" className="hero__scroll">
          <span>Scroll to explore</span>
          <ChevronDown size={20} />
        </a>
      </section>

      {/* Client Logos */}
      <section className="clients">
        <div className="container">
          <p className="clients__label">Trusted by industry leaders</p>
          <div className="clients__logos">
            {['Fortune 500 Utility', 'Major Data Center', 'Energy Company', 'Agricultural Corp', 'Government Agency'].map((client, i) => (
              <div key={i} className="clients__logo">
                <span>{client}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="container">
          <div className="section-header">
            <span className="section-header__tag">Services</span>
            <h2 className="section-header__title">
              Four Pillars of <span className="text-accent">Operational Intelligence</span>
            </h2>
            <p className="section-header__desc">
              Comprehensive inspection and security solutions for organizations where downtime isn't an inconvenience—it's a crisis.
            </p>
          </div>

          <div className="services__grid">
            {services.map((service, i) => (
              <motion.div
                key={i}
                className="service-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="service-card__icon">{service.icon}</div>
                <h3 className="service-card__title">{service.title}</h3>
                <p className="service-card__desc">{service.description}</p>
                <ul className="service-card__features">
                  {service.features.map((f, j) => (
                    <li key={j}><CheckCircle2 size={16} />{f}</li>
                  ))}
                </ul>
                <div className="service-card__stat">
                  <span className="service-card__stat-value">{service.stat.value}</span>
                  <span className="service-card__stat-label">{service.stat.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Thermal Showcase */}
      <section className="thermal">
        <div className="container">
          <div className="thermal__layout">
            <div className="thermal__content">
              <span className="section-header__tag">Technology</span>
              <h2>See What Others Miss</h2>
              <p>
                Our radiometric thermal imaging detects temperature differentials invisible to the naked eye.
                Identify failing components, insulation gaps, and electrical faults before they become catastrophic failures.
              </p>
              <ul className="thermal__benefits">
                <li><CheckCircle2 size={20} /> ±0.03°C temperature sensitivity</li>
                <li><CheckCircle2 size={20} /> Real-time anomaly detection</li>
                <li><CheckCircle2 size={20} /> Predictive maintenance insights</li>
                <li><CheckCircle2 size={20} /> FLIR-certified operators</li>
              </ul>
            </div>
            <div className="thermal__visual">
              <ThermalComparison />
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="industries">
        <div className="container">
          <div className="section-header section-header--center">
            <span className="section-header__tag">Industries</span>
            <h2 className="section-header__title">
              Built for <span className="text-accent">Critical Operations</span>
            </h2>
          </div>

          <div className="industries__grid">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                className="industry-card"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="industry-card__icon">{ind.icon}</div>
                <h3>{ind.name}</h3>
                <span className="industry-card__stat">{ind.stat}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="process">
        <div className="container">
          <div className="section-header section-header--center">
            <span className="section-header__tag">Process</span>
            <h2 className="section-header__title">
              How We <span className="text-accent">Deliver Results</span>
            </h2>
          </div>

          <div className="process__timeline">
            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                className="process-step"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="process-step__num">{step.num}</div>
                <div className="process-step__content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Credentials */}
      <section id="about" className="about">
        <div className="container">
          <div className="about__layout">
            <div className="about__content">
              <span className="section-header__tag">About Jinki</span>
              <h2>15 Years Protecting Critical Infrastructure</h2>
              <p className="about__lead">
                We're not just drone operators. We're infrastructure specialists who understand
                that a single point of failure in your grid, data center, or pipeline can affect millions.
              </p>
              <p>
                Our team combines FAA Part 107 certified pilots, FLIR-certified thermographers,
                and cybersecurity professionals with deep experience in utility, energy, and
                government sectors.
              </p>

              <div className="credentials">
                <h4>Our Certifications</h4>
                <div className="credentials__grid">
                  {credentials.map((cred, i) => (
                    <div key={i} className="credential">
                      <span className="credential__abbr">{cred.abbr}</span>
                      <span className="credential__full">{cred.full}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="about__image">
              <img
                src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&q=80"
                alt="Drone inspecting infrastructure"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="cta">
        <div className="container">
          <div className="cta__card">
            <h2>Ready to See What You've Been Missing?</h2>
            <p>
              Schedule a 30-minute discovery call. We'll discuss your infrastructure,
              your challenges, and whether we're the right fit.
            </p>
            <div className="cta__actions">
              <a href="mailto:hello@jinki.io" className="btn btn--primary btn--lg">
                Schedule Discovery Call
                <ArrowRight size={20} />
              </a>
            </div>
            <span className="cta__note">Usually respond within 4 hours</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div className="footer__brand">
              <Logo variant="light" />
              <p>Critical infrastructure inspection and enterprise security advisory.</p>
              <div className="footer__contact">
                <a href="mailto:hello@jinki.io"><Mail size={16} /> hello@jinki.io</a>
                <a href="tel:+1234567890"><Phone size={16} /> (123) 456-7890</a>
              </div>
            </div>
            <div className="footer__links">
              <div className="footer__col">
                <h4>Services</h4>
                <a href="#services">Aerial Inspection</a>
                <a href="#services">Thermal Analytics</a>
                <a href="#services">Precision Mapping</a>
                <a href="#services">Security Advisory</a>
              </div>
              <div className="footer__col">
                <h4>Industries</h4>
                <a href="#industries">Electric Utilities</a>
                <a href="#industries">Data Centers</a>
                <a href="#industries">Oil & Gas</a>
                <a href="#industries">Agriculture</a>
              </div>
              <div className="footer__col">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
                <a href="#">Careers</a>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© 2026 Jinki Intelligence. All rights reserved.</span>
            <div className="footer__certs">
              {credentials.map((c, i) => (
                <span key={i} className="footer__cert">{c.abbr}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage2
