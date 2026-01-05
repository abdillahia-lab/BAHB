import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import './Competitor2.css'

const ease = [0.25, 0.1, 0.25, 1]

// Floating glass orb with depth layers
function GlassOrb() {
  return (
    <div className="glass-orb">
      <div className="glass-orb__layer glass-orb__layer--1" />
      <div className="glass-orb__layer glass-orb__layer--2" />
      <div className="glass-orb__layer glass-orb__layer--3" />
      <div className="glass-orb__core" />
      <div className="glass-orb__shimmer" />
      <div className="glass-orb__refraction glass-orb__refraction--1" />
      <div className="glass-orb__refraction glass-orb__refraction--2" />
    </div>
  )
}

// Floating particles for depth
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4
  }))

  return (
    <div className="particles">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="particle"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Smooth scroll hook
function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])
}

// Fade up animation component
function FadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

// Counter with glass styling
function Counter({ value, suffix = '', prefix = '', label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    const duration = 1500
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(num * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    tick()
  }, [inView, value])

  return (
    <div ref={ref} className="glass-stat">
      <div className="glass-stat__inner">
        <span className="glass-stat__value">{prefix}{display}{suffix}</span>
        <span className="glass-stat__label">{label}</span>
      </div>
    </div>
  )
}

// Industry glass card with parallax
function IndustryCard({ image, title, problem, solution, stats, index }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })
  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 })

  return (
    <motion.div
      ref={ref}
      className="glass-card"
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, delay: index * 0.1, ease }}
    >
      <div className="glass-card__border" />
      <motion.div className="glass-card__image" style={{ y: smoothY }}>
        <img src={image} alt={title} loading="lazy"/>
        <div className="glass-card__image-overlay" />
      </motion.div>
      <div className="glass-card__content">
        <h3>{title}</h3>
        <div className="glass-card__section">
          <span className="glass-card__label">Challenge</span>
          <p>{problem}</p>
        </div>
        <div className="glass-card__section">
          <span className="glass-card__label">Solution</span>
          <p>{solution}</p>
        </div>
        <div className="glass-card__stats">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card__stat">
              <span className="glass-card__stat-value">{stat.value}</span>
              <span className="glass-card__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card__shine" />
    </motion.div>
  )
}

export default function Competitor2() {
  useSmoothScroll()

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  const orbY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const orbRotate = useTransform(scrollYProgress, [0, 1], [0, 360])

  const industries = [
    {
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
      title: 'Data Centers',
      problem: '19% of outages stem from cooling failures. Average cost: $700K.',
      solution: 'Thermal monitoring with 0.05°C sensitivity detects hotspots 72 hours early.',
      stats: [{ value: '$700K', label: 'Avg Outage Cost' }, { value: '72hrs', label: 'Early Detection' }]
    },
    {
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
      title: 'Electric Utilities',
      problem: 'Ground crews miss 48% of defects. Helicopters cost $2,000+/hour.',
      solution: 'LiDAR at 2.4M points/sec. 60% cost reduction vs helicopter.',
      stats: [{ value: '60%', label: 'Cost Reduction' }, { value: '4.5x', label: 'More Defects' }]
    },
    {
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80',
      title: 'Precision Agriculture',
      problem: 'Crop stress visible to eye only after 14+ days of damage.',
      solution: 'NDVI multispectral imaging detects stress 14 days earlier.',
      stats: [{ value: '14 days', label: 'Earlier Detection' }, { value: '150%', label: 'Proven ROI' }]
    },
    {
      image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80',
      title: 'Oil & Gas',
      problem: 'EPA requires continuous methane monitoring. Manual inspection takes days.',
      solution: 'Optical Gas Imaging with 99.2% detection. 14km daily coverage.',
      stats: [{ value: '99.2%', label: 'Detection Rate' }, { value: '14km', label: 'Daily Coverage' }]
    }
  ]

  return (
    <div className="glass-page">
      {/* Gradient background layers */}
      <div className="glass-bg">
        <div className="glass-bg__gradient glass-bg__gradient--1" />
        <div className="glass-bg__gradient glass-bg__gradient--2" />
        <div className="glass-bg__gradient glass-bg__gradient--3" />
      </div>

      {/* Floating particles */}
      <FloatingParticles />

      {/* Navigation */}
      <motion.header
        className="glass-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="glass-nav__inner">
          <a href="/" className="glass-nav__logo">
            <span className="glass-nav__logo-text">JINKI</span>
          </a>
          <nav className="glass-nav__links">
            <a href="#industries">Industries</a>
            <a href="#platform">Platform</a>
            <a href="#advisory">Advisory</a>
          </nav>
          <a href="#contact" className="glass-btn glass-btn--primary">Get Started</a>
        </div>
        <div className="glass-nav__border" />
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="glass-hero">
        {/* Floating Glass Orb */}
        <motion.div
          className="glass-hero__orb"
          style={{ y: orbY, rotate: orbRotate }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.2, ease }}
        >
          <GlassOrb />
        </motion.div>

        <motion.div className="glass-hero__content" style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}>
          <motion.p
            className="glass-hero__tagline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease }}
          >
            Ex Alto Omnia
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease }}
          >
            From Above, <span className="glass-gradient-text">All Things</span>
          </motion.h1>

          <motion.p
            className="glass-hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1, ease }}
          >
            Autonomous aerial intelligence for critical infrastructure.<br/>
            Detect anomalies before catastrophic failure.
          </motion.p>

          <motion.div
            className="glass-hero__actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.3, ease }}
          >
            <a href="#contact" className="glass-btn glass-btn--primary glass-btn--lg">Schedule Assessment</a>
            <a href="#industries" className="glass-btn glass-btn--ghost glass-btn--lg">Explore Solutions</a>
          </motion.div>
        </motion.div>

        <motion.div
          className="glass-hero__stats"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5, ease }}
        >
          <Counter value="700" prefix="$" suffix="K" label="Avg Outage Prevented"/>
          <Counter value="72" suffix="hrs" label="Early Detection"/>
          <Counter value="94" suffix="%" label="Fault Accuracy"/>
          <Counter value="58" suffix="%" label="Cost Reduction"/>
        </motion.div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="glass-section">
        <FadeUp className="glass-section__header">
          <div className="glass-panel glass-panel--header">
            <p className="glass-section__eyebrow">Solutions</p>
            <h2>Critical Infrastructure Intelligence</h2>
            <p className="glass-section__subtitle">Research-backed aerial protocols trusted by industry leaders</p>
          </div>
        </FadeUp>

        <div className="glass-cards">
          {industries.map((industry, i) => (
            <IndustryCard key={i} {...industry} index={i}/>
          ))}
        </div>
      </section>

      {/* Platform Section */}
      <section id="platform" className="glass-section glass-section--platform">
        <div className="glass-platform">
          <FadeUp className="glass-platform__text">
            <div className="glass-panel glass-panel--left">
              <p className="glass-section__eyebrow">Technology</p>
              <h2>Enterprise-Grade Platform</h2>
              <p className="glass-platform__lead">
                Military-adjacent inspection technology. IP55 rated for all-weather.
                Redundant flight systems. 59-minute endurance.
              </p>
              <div className="glass-features">
                {[
                  '0.05°C Thermal Sensitivity',
                  'LiDAR @ 2.4M pts/sec',
                  'IP55 Weather Sealed',
                  'Redundant Flight Systems',
                  '20km Transmission Range',
                  '±1cm RTK Accuracy'
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    className="glass-feature"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease }}
                  >
                    <span className="glass-feature__icon">◉</span>
                    <span>{f}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.2} className="glass-platform__visual">
            <div className="glass-panel glass-panel--visual">
              <div className="glass-visual">
                <div className="glass-visual__ring glass-visual__ring--1" />
                <div className="glass-visual__ring glass-visual__ring--2" />
                <div className="glass-visual__ring glass-visual__ring--3" />
                <div className="glass-visual__center">
                  <span>JINKI</span>
                  <span className="glass-visual__subtitle">Platform</span>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Advisory Section */}
      <section id="advisory" className="glass-section">
        <FadeUp className="glass-section__header">
          <div className="glass-panel glass-panel--header">
            <p className="glass-section__eyebrow">Advisory</p>
            <h2>Cyber & AI Expertise</h2>
            <p className="glass-section__subtitle">Enterprise security architecture meets aerial intelligence</p>
          </div>
        </FadeUp>

        <FadeUp delay={0.2} className="glass-advisor">
          <div className="glass-panel glass-panel--advisor">
            <div className="glass-advisor__avatar">
              <div className="glass-avatar">
                <div className="glass-avatar__ring" />
                <span className="glass-avatar__initial">A</span>
              </div>
            </div>
            <h3>Abdillahi A.</h3>
            <p className="glass-advisor__role">Principal Security Architect</p>
            <p className="glass-advisor__bio">
              Enterprise security architecture, AI governance, and risk management
              for critical infrastructure. Zero-trust frameworks and regulatory
              compliance for energy, utilities, and data center sectors.
            </p>
            <div className="glass-advisor__certs">
              {['CISSP', 'CCSP', 'AIGP', 'PMP'].map(c => (
                <span key={c} className="glass-cert">{c}</span>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>

      {/* CTA Section */}
      <section id="contact" className="glass-section glass-section--cta">
        <FadeUp className="glass-cta">
          <div className="glass-panel glass-panel--cta">
            <div className="glass-cta__icon">
              <div className="glass-cta__eye">
                <div className="glass-cta__eye-outer" />
                <div className="glass-cta__eye-inner" />
              </div>
            </div>
            <h2>Ready to See Everything?</h2>
            <p className="glass-cta__tagline">Ex Alto Omnia — From Above, All Things</p>
            <p>Schedule a consultation. Prevent the next million-dollar outage.</p>
            <div className="glass-cta__actions">
              <a href="tel:+15551234567" className="glass-btn glass-btn--primary glass-btn--lg">Call Now</a>
              <a href="mailto:contact@jinki.io" className="glass-btn glass-btn--ghost glass-btn--lg">Email Us</a>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* Footer */}
      <footer className="glass-footer">
        <div className="glass-footer__inner">
          <div className="glass-footer__brand">
            <span className="glass-footer__logo">JINKI INTELLIGENCE</span>
            <span className="glass-footer__tagline">Ex Alto Omnia</span>
          </div>
          <span className="glass-footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
