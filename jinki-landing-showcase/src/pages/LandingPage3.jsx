import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import './LandingPage3.css'

// Logo
const logoUrl = '/jinki-logo.svg'

const ease = [0.25, 0.1, 0.25, 1]

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
    <div ref={ref} className="stat">
      <span className="stat__value">{prefix}{display}{suffix}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}

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
      className="card"
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, delay: index * 0.1, ease }}
    >
      <motion.div className="card__image" style={{ y: smoothY }}>
        <img src={image} alt={title} loading="lazy"/>
      </motion.div>
      <div className="card__content">
        <h3>{title}</h3>
        <div className="card__section">
          <span className="card__label">Challenge</span>
          <p>{problem}</p>
        </div>
        <div className="card__section">
          <span className="card__label">Solution</span>
          <p>{solution}</p>
        </div>
        <div className="card__stats">
          {stats.map((stat, i) => (
            <div key={i} className="card__stat">
              <span className="card__stat-value">{stat.value}</span>
              <span className="card__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function LandingPage3() {
  useSmoothScroll()

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  const logoY = useTransform(scrollYProgress, [0, 1], [0, -80])
  const logoRotate = useTransform(scrollYProgress, [0, 1], [0, 15])

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
    <div className="page">
      {/* NAV */}
      <motion.header
        className="nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="nav__inner">
          <a href="/" className="nav__logo">
            <img src={logoUrl} alt="Jinki Intelligence" />
          </a>
          <nav className="nav__links">
            <a href="#industries">Industries</a>
            <a href="#platform">Platform</a>
            <a href="#advisory">Advisory</a>
          </nav>
          <a href="#contact" className="btn">Get Started</a>
        </div>
      </motion.header>

      {/* HERO */}
      <section ref={heroRef} className="hero">
        <div className="hero__bg">
          <div className="hero__grid"/>
        </div>

        <motion.div
          className="hero__logo"
          style={{ y: logoY, rotate: logoRotate }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease }}
        >
          <img src={logoUrl} alt="Jinki Intelligence" />
          <div className="hero__logo-glow"/>
        </motion.div>

        <motion.div className="hero__content" style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}>
          <motion.p
            className="hero__tagline"
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
            From Above, <span className="gradient-text">All Things</span>
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1, ease }}
          >
            Autonomous aerial intelligence for critical infrastructure.<br/>
            Detect anomalies before catastrophic failure.
          </motion.p>

          <motion.div
            className="hero__actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.3, ease }}
          >
            <a href="#contact" className="btn btn--primary">Schedule Assessment</a>
            <a href="#industries" className="btn btn--ghost">Explore Solutions</a>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero__stats"
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

      {/* INDUSTRIES */}
      <section id="industries" className="section">
        <FadeUp className="section__header">
          <p className="section__eyebrow">Solutions</p>
          <h2>Critical Infrastructure Intelligence</h2>
          <p className="section__subtitle">Research-backed aerial protocols trusted by industry leaders</p>
        </FadeUp>

        <div className="cards">
          {industries.map((industry, i) => (
            <IndustryCard key={i} {...industry} index={i}/>
          ))}
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="section section--alt">
        <div className="platform">
          <FadeUp className="platform__text">
            <p className="section__eyebrow">Technology</p>
            <h2>Enterprise-Grade Platform</h2>
            <p className="platform__lead">
              Military-adjacent inspection technology. IP55 rated for all-weather.
              Redundant flight systems. 59-minute endurance.
            </p>
            <div className="features">
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
                  className="feature"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease }}
                >
                  <span className="feature__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </span>
                  {f}
                </motion.div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.2} className="platform__visual">
            <div className="eye-visual">
              <div className="eye-visual__ring eye-visual__ring--1"/>
              <div className="eye-visual__ring eye-visual__ring--2"/>
              <div className="eye-visual__ring eye-visual__ring--3"/>
              <div className="eye-visual__core"/>
              <div className="eye-visual__glow"/>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ADVISORY */}
      <section id="advisory" className="section">
        <FadeUp className="section__header">
          <p className="section__eyebrow">Advisory</p>
          <h2>Cyber & AI Expertise</h2>
          <p className="section__subtitle">Enterprise security architecture meets aerial intelligence</p>
        </FadeUp>

        <FadeUp delay={0.2} className="advisor">
          <div className="advisor__avatar">
            <span>AA</span>
            <div className="advisor__avatar-ring"/>
          </div>
          <h3>Abdillahi A.</h3>
          <p className="advisor__role">Principal Security Architect</p>
          <p className="advisor__bio">
            Enterprise security architecture, AI governance, and risk management
            for critical infrastructure. Zero-trust frameworks and regulatory
            compliance for energy, utilities, and data center sectors.
          </p>
          <div className="advisor__certs">
            {['CISSP', 'CCSP', 'AIGP', 'PMP'].map(c => (
              <span key={c} className="cert">{c}</span>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* CTA */}
      <section id="contact" className="section section--cta">
        <FadeUp className="cta">
          <div className="cta__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            </svg>
          </div>
          <h2>Ready to See Everything?</h2>
          <p className="cta__tagline">Ex Alto Omnia — From Above, All Things</p>
          <p>Schedule a consultation. Prevent the next million-dollar outage.</p>
          <div className="cta__actions">
            <a href="tel:+15551234567" className="btn btn--primary btn--lg">Call Now</a>
            <a href="mailto:contact@jinki.io" className="btn btn--ghost btn--lg">Email Us</a>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <img src={logoUrl} alt="Jinki Intelligence" className="footer__logo"/>
            <span className="footer__tagline">Ex Alto Omnia</span>
          </div>
          <span className="footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
