import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { ArrowRight, Play, ChevronDown, Shield, Cpu, Eye, Target, Zap, Server, Building2, Leaf, Menu, X } from 'lucide-react'
import './LandingPage2.css'

gsap.registerPlugin(ScrollTrigger)

// ============================================
// ANIMATED LOGO COMPONENT
// ============================================
function AnimatedLogo() {
  return (
    <div className="logo">
      <div className="logo-mark">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ff88" />
              <stop offset="50%" stopColor="#4D49FC" />
              <stop offset="100%" stopColor="#ff006e" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Hexagon base */}
          <path
            d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
            stroke="url(#logoGrad)"
            strokeWidth="2"
            fill="none"
            filter="url(#glow)"
            className="logo-hex"
          />
          {/* Inner circle with pulse */}
          <circle
            cx="24"
            cy="24"
            r="8"
            fill="url(#logoGrad)"
            className="logo-core"
          />
          {/* Orbiting ring */}
          <circle
            cx="24"
            cy="24"
            r="14"
            stroke="url(#logoGrad)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="4 4"
            className="logo-orbit"
          />
        </svg>
      </div>
      <div className="logo-text">
        <span className="logo-name">Jinki</span>
        <span className="logo-tag">Intelligence</span>
      </div>
    </div>
  )
}

// ============================================
// LIQUID GLASS CARD COMPONENT
// ============================================
function LiquidGlassCard({ children, className = '', delay = 0 }) {
  const cardRef = useRef(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      card.style.setProperty('--mouse-x', `${x}px`)
      card.style.setProperty('--mouse-y', `${y}px`)
    }

    card.addEventListener('mousemove', handleMouseMove)
    return () => card.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <motion.div
      ref={cardRef}
      className={`liquid-glass ${className}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="glass-shine" />
      <div className="glass-content">{children}</div>
    </motion.div>
  )
}

// ============================================
// PARALLAX IMAGE COMPONENT
// ============================================
function ParallaxLayer({ children, speed = 0.5, className = '' }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    gsap.to(element, {
      y: () => window.innerHeight * speed * -1,
      ease: 'none',
      scrollTrigger: {
        trigger: element.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    })
  }, [speed])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
function LandingPage2() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const containerRef = useRef(null)
  const heroRef = useRef(null)
  const lenisRef = useRef(null)

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })

    lenisRef.current = lenis

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    return () => {
      lenis.destroy()
    }
  }, [])

  // Scroll detection for nav
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // GSAP Animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text reveal
      gsap.from('.hero-title-line', {
        y: 120,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.3
      })

      // Hero elements fade in
      gsap.from('.hero-badge', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.8,
        ease: 'power2.out'
      })

      gsap.from('.hero-description', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 1,
        ease: 'power2.out'
      })

      gsap.from('.hero-cta', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 1.2,
        ease: 'power2.out'
      })

      gsap.from('.hero-stats', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 1.4,
        ease: 'power2.out'
      })

      // Floating orbs parallax
      gsap.to('.floating-orb', {
        y: -100,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      })

      // Section reveals
      gsap.utils.toArray('.section-reveal').forEach((section) => {
        gsap.from(section, {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const capabilities = [
    {
      icon: <Eye size={28} />,
      title: 'Infrastructure Inspection',
      tagline: 'See What Others Miss',
      description: 'Autonomous drones with centimeter-level precision detect equipment degradation before it becomes an outage.',
      stats: { value: '99.8%', label: 'Detection Rate' }
    },
    {
      icon: <Zap size={28} />,
      title: 'Thermal Analytics',
      tagline: 'Heat Reveals Truth',
      description: 'Radiometric imaging with ±0.03°C sensitivity predicts failures weeks in advance.',
      stats: { value: '±0.03°C', label: 'Sensitivity' }
    },
    {
      icon: <Target size={28} />,
      title: 'Precision Mapping',
      tagline: 'Survey-Grade Accuracy',
      description: 'RTK-GPS delivers ±2cm accuracy for engineering-grade deliverables.',
      stats: { value: '±2cm', label: 'RTK Accuracy' }
    },
    {
      icon: <Shield size={28} />,
      title: 'Security Advisory',
      tagline: 'Zero Trust Architecture',
      description: 'CISSP-certified team builds resilient security postures for critical infrastructure.',
      stats: { value: 'Zero', label: 'Breaches' }
    }
  ]

  const industries = [
    { icon: <Zap size={28} />, name: 'Electric Utilities', clients: 'Serving 12 of top 20 US utilities' },
    { icon: <Server size={28} />, name: 'Data Centers', clients: 'Trusted by hyperscale operators' },
    { icon: <Building2 size={28} />, name: 'Oil & Gas', clients: 'Deployed across 3 continents' },
    { icon: <Leaf size={28} />, name: 'Agriculture', clients: 'Managing 500,000+ acres' }
  ]

  const credentials = [
    { badge: 'CISSP', name: 'Certified Information Systems Security Professional', desc: 'The gold standard for security leadership. Only 150,000 professionals worldwide hold this credential.' },
    { badge: 'CCSP', name: 'Certified Cloud Security Professional', desc: 'Essential for protecting your cloud infrastructure and hybrid environments.' },
    { badge: 'AIGP', name: 'AI Governance Professional', desc: 'Navigating AI implementation with ethics, compliance, and risk management.' },
    { badge: 'PMP', name: 'Project Management Professional', desc: 'Ensuring your inspection programs deliver on time and on budget.' }
  ]

  return (
    <div ref={containerRef} className="jinki-ultra">
      {/* SVG Filters for Liquid Glass */}
      <svg className="svg-filters" aria-hidden="true">
        <defs>
          <filter id="liquid-glass">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          </filter>
        </defs>
      </svg>

      {/* Premium Navigation */}
      <header className={`nav-header ${scrolled ? 'scrolled' : ''}`}>
        <nav className="nav-container">
          <AnimatedLogo />

          <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
            <a href="#capabilities" onClick={() => setMenuOpen(false)}>Capabilities</a>
            <a href="#industries" onClick={() => setMenuOpen(false)}>Industries</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          </div>

          <div className="nav-actions">
            <a href="#contact" className="nav-cta">
              <span>Request Demo</span>
              <ArrowRight size={16} />
            </a>
            <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section with Liquid Glass */}
      <section ref={heroRef} className="hero-section">
        {/* Animated Gradient Background */}
        <div className="hero-gradient-bg" />

        {/* Floating Orbs */}
        <div className="floating-orbs">
          <div className="floating-orb orb-1" />
          <div className="floating-orb orb-2" />
          <div className="floating-orb orb-3" />
          <div className="floating-orb orb-4" />
        </div>

        {/* Grid Pattern */}
        <div className="hero-grid" />

        {/* Hero Content */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse" />
            <span>Now serving Fortune 500 utilities</span>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-line">Critical Infrastructure</span>
            <span className="hero-title-line gradient-text">Deserves Critical Attention</span>
          </h1>

          <p className="hero-description">
            Autonomous drone inspection and enterprise security advisory for utilities,
            data centers, and critical infrastructure operators.
            <strong> CISSP-certified team. Zero breaches. Ever.</strong>
          </p>

          <div className="hero-cta">
            <a href="#contact" className="btn-primary">
              <span>Schedule Inspection</span>
              <ArrowRight size={18} />
            </a>
            <button className="btn-glass">
              <Play size={18} />
              <span>Watch Demo</span>
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">2.4M+</span>
              <span className="stat-label">Acres Surveyed</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">99.8%</span>
              <span className="stat-label">Detection Rate</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">Zero</span>
              <span className="stat-label">Security Breaches</span>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <ChevronDown size={28} />
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="capabilities-section">
        <div className="container">
          <div className="section-reveal section-header">
            <span className="section-tag">Capabilities</span>
            <h2>Four Pillars of <span className="gradient-text">Operational Intelligence</span></h2>
          </div>

          <div className="capabilities-grid">
            {capabilities.map((cap, i) => (
              <LiquidGlassCard key={i} className="capability-card" delay={i * 0.1}>
                <div className="card-icon">{cap.icon}</div>
                <span className="card-tagline">{cap.tagline}</span>
                <h3>{cap.title}</h3>
                <p>{cap.description}</p>
                <div className="card-stat">
                  <span className="stat-value">{cap.stats.value}</span>
                  <span className="stat-label">{cap.stats.label}</span>
                </div>
              </LiquidGlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="industries-section">
        <div className="container">
          <div className="section-reveal section-header center">
            <span className="section-tag">Industries</span>
            <h2>Built for <span className="gradient-text">Critical Operations</span></h2>
            <p className="section-desc">
              We specialize in industries where downtime isn't an inconvenience—it's a crisis.
            </p>
          </div>

          <div className="industries-grid">
            {industries.map((ind, i) => (
              <LiquidGlassCard key={i} className="industry-card" delay={i * 0.1}>
                <div className="industry-icon">{ind.icon}</div>
                <h3>{ind.name}</h3>
                <span className="industry-clients">{ind.clients}</span>
              </LiquidGlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials Section */}
      <section id="about" className="credentials-section">
        <div className="container">
          <div className="credentials-layout">
            <div className="section-reveal credentials-content">
              <span className="section-tag">Why Jinki</span>
              <h2>15 Years Protecting <span className="gradient-text">Critical Infrastructure</span></h2>
              <p className="lead">
                We're not just drone operators or security consultants. We're infrastructure
                specialists who understand that a single point of failure in your grid,
                data center, or pipeline can affect millions of people.
              </p>

              <div className="credentials-list">
                {credentials.map((cred, i) => (
                  <motion.div
                    key={i}
                    className="credential-item"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                  >
                    <div className="cred-badge">{cred.badge}</div>
                    <div className="cred-info">
                      <strong>{cred.name}</strong>
                      <span>{cred.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="credentials-visual">
              <div className="shield-orb">
                <div className="orb-ring ring-1" />
                <div className="orb-ring ring-2" />
                <div className="orb-ring ring-3" />
                <div className="orb-core">
                  <Shield size={56} />
                </div>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="orb-node" style={{ '--i': i }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="tech-section">
        <div className="container">
          <div className="section-reveal section-header center">
            <span className="section-tag">Technology</span>
            <h2>Technology That <span className="gradient-text">Actually Works</span></h2>
          </div>

          <div className="tech-grid">
            <LiquidGlassCard className="tech-card featured">
              <div className="tech-orb">
                <Cpu size={36} />
              </div>
              <h3>Edge AI Processing</h3>
              <p>On-device inference at 50ms latency. No cloud dependency. Air-gapped option available for the most sensitive operations.</p>
              <div className="tech-tags">
                <span>Sub-50ms Latency</span>
                <span>Air-gapped Option</span>
              </div>
            </LiquidGlassCard>

            {[
              { icon: <Eye size={24} />, name: 'Computer Vision', spec: 'YOLOv8+ Detection' },
              { icon: <Target size={24} />, name: 'RTK Positioning', spec: '±2cm Accuracy' },
              { icon: <Shield size={24} />, name: 'Zero Trust Security', spec: 'AES-256 Encrypted' }
            ].map((tech, i) => (
              <LiquidGlassCard key={i} className="tech-card" delay={0.1 + i * 0.1}>
                <div className="tech-icon">{tech.icon}</div>
                <h4>{tech.name}</h4>
                <span className="tech-spec">{tech.spec}</span>
              </LiquidGlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="cta-section">
        <div className="container">
          <LiquidGlassCard className="cta-card">
            <h2>Ready to See What You've Been Missing?</h2>
            <p>
              Schedule a 30-minute discovery call. We'll discuss your infrastructure,
              your challenges, and whether we're the right fit. No pressure, no pitch deck—
              just a conversation between professionals.
            </p>
            <div className="cta-actions">
              <a href="mailto:hello@jinki.io" className="btn-primary btn-lg">
                <span>Schedule Discovery Call</span>
                <ArrowRight size={20} />
              </a>
            </div>
            <span className="cta-note">Usually respond within 4 hours</span>
          </LiquidGlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <AnimatedLogo />
              <p>Critical infrastructure inspection and enterprise security advisory for utilities, data centers, and government agencies.</p>
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
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage2
