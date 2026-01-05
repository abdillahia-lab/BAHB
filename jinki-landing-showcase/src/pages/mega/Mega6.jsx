import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import './Mega6.css'

const ease = [0.25, 0.1, 0.25, 1]

// ═══════════════════════════════════════════════════════════════
// RETRO GRID - Classic synthwave perspective grid
// ═══════════════════════════════════════════════════════════════
function RetroGrid() {
  return (
    <div className="retro-grid">
      <div className="retro-grid__horizon" />
      <div className="retro-grid__lines">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`h-${i}`} className="retro-grid__line-h" style={{ '--i': i }} />
        ))}
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={`v-${i}`} className="retro-grid__line-v" style={{ '--i': i }} />
        ))}
      </div>
      <div className="retro-grid__sun" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// NEON EYE - Glowing cyber eye with scan line effects
// ═══════════════════════════════════════════════════════════════
function NeonEye() {
  const [scanPos, setScanPos] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setScanPos(p => (p + 1) % 100)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="neon-eye">
      <div className="neon-eye__outer">
        <div className="neon-eye__middle">
          <div className="neon-eye__iris">
            <div className="neon-eye__pupil" />
            <div className="neon-eye__reflection" />
          </div>
        </div>
      </div>
      <div className="neon-eye__scanline" style={{ top: `${scanPos}%` }} />
      <div className="neon-eye__glitch" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VHS GLITCH TEXT - Chromatic aberration text effect
// ═══════════════════════════════════════════════════════════════
function VHSText({ children, className = '' }) {
  return (
    <div className={`vhs-text ${className}`}>
      <span className="vhs-text__layer vhs-text__layer--r">{children}</span>
      <span className="vhs-text__layer vhs-text__layer--g">{children}</span>
      <span className="vhs-text__layer vhs-text__layer--b">{children}</span>
      <span className="vhs-text__main">{children}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// WIREFRAME CUBE - Rotating 3D wireframe
// ═══════════════════════════════════════════════════════════════
function WireframeCube() {
  return (
    <div className="wireframe-cube">
      <div className="wireframe-cube__inner">
        <div className="wireframe-cube__face wireframe-cube__face--front" />
        <div className="wireframe-cube__face wireframe-cube__face--back" />
        <div className="wireframe-cube__face wireframe-cube__face--right" />
        <div className="wireframe-cube__face wireframe-cube__face--left" />
        <div className="wireframe-cube__face wireframe-cube__face--top" />
        <div className="wireframe-cube__face wireframe-cube__face--bottom" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SMOOTH SCROLL
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// FADE UP ANIMATION
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// COUNTER
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// RETRO CARD - Industry card with neon borders
// ═══════════════════════════════════════════════════════════════
function RetroCard({ image, title, problem, solution, stats, index }) {
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
      className="retro-card"
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, delay: index * 0.1, ease }}
    >
      <div className="retro-card__corner retro-card__corner--tl" />
      <div className="retro-card__corner retro-card__corner--tr" />
      <div className="retro-card__corner retro-card__corner--bl" />
      <div className="retro-card__corner retro-card__corner--br" />

      <motion.div className="retro-card__image" style={{ y: smoothY }}>
        <img src={image} alt={title} loading="lazy"/>
        <div className="retro-card__image-overlay" />
      </motion.div>

      <div className="retro-card__content">
        <h3 className="retro-card__title">
          <VHSText>{title}</VHSText>
        </h3>

        <div className="retro-card__section">
          <span className="retro-card__label">/// CHALLENGE</span>
          <p>{problem}</p>
        </div>

        <div className="retro-card__section">
          <span className="retro-card__label">/// SOLUTION</span>
          <p>{solution}</p>
        </div>

        <div className="retro-card__stats">
          {stats.map((stat, i) => (
            <div key={i} className="retro-card__stat">
              <span className="retro-card__stat-value">{stat.value}</span>
              <span className="retro-card__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="retro-card__glow" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Mega6() {
  useSmoothScroll()

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const gridY = useTransform(scrollYProgress, [0, 1], [0, -100])

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
    <div className="mega6">
      {/* CRT Scanlines overlay */}
      <div className="crt-overlay" />
      <div className="vhs-noise" />

      {/* Retro Grid Background */}
      <motion.div className="retro-grid-bg" style={{ y: gridY }}>
        <RetroGrid />
      </motion.div>

      {/* NAV */}
      <motion.header
        className="nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="nav__inner">
          <div className="nav__logo">
            <span className="nav__logo-bracket">[</span>
            <VHSText className="nav__logo-text">JINKI</VHSText>
            <span className="nav__logo-bracket">]</span>
          </div>
          <nav className="nav__links">
            <a href="#industries" className="nav__link">
              <span className="nav__link-symbol">►</span> Industries
            </a>
            <a href="#platform" className="nav__link">
              <span className="nav__link-symbol">►</span> Platform
            </a>
            <a href="#advisory" className="nav__link">
              <span className="nav__link-symbol">►</span> Advisory
            </a>
          </nav>
          <a href="#contact" className="btn">
            <span className="btn__text">Get Started</span>
          </a>
        </div>
      </motion.header>

      {/* HERO */}
      <section ref={heroRef} className="hero">
        <motion.div className="hero__content" style={{ y: heroY, opacity: heroOpacity }}>
          <motion.div
            className="hero__eye"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease }}
          >
            <NeonEye />
          </motion.div>

          <motion.p
            className="hero__tagline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease }}
          >
            <span className="chrome-text">Ex Alto Omnia</span>
          </motion.p>

          <motion.h1
            className="hero__title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease }}
          >
            <VHSText>From Above,</VHSText>
            <br />
            <span className="neon-text">All Things</span>
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1, ease }}
          >
            Autonomous aerial intelligence for critical infrastructure.
            <br />
            Detect anomalies before catastrophic failure.
          </motion.p>

          <motion.div
            className="hero__actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.3, ease }}
          >
            <a href="#contact" className="btn btn--primary">
              <span className="btn__text">Schedule Assessment</span>
            </a>
            <a href="#industries" className="btn btn--ghost">
              <span className="btn__text">Explore Solutions</span>
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero__stats"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5, ease }}
        >
          <Counter value="700" prefix="$" suffix="K" label="Avg Outage Prevented" />
          <Counter value="72" suffix="hrs" label="Early Detection" />
          <Counter value="94" suffix="%" label="Fault Accuracy" />
          <Counter value="58" suffix="%" label="Cost Reduction" />
        </motion.div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="section">
        <FadeUp className="section__header">
          <p className="section__eyebrow">
            <span className="terminal-text">{'>'} SOLUTIONS_</span>
          </p>
          <h2 className="section__title">
            <VHSText>Critical Infrastructure Intelligence</VHSText>
          </h2>
          <p className="section__subtitle">
            Research-backed aerial protocols trusted by industry leaders
          </p>
        </FadeUp>

        <div className="cards">
          {industries.map((industry, i) => (
            <RetroCard key={i} {...industry} index={i} />
          ))}
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="section section--alt">
        <div className="platform">
          <FadeUp className="platform__text">
            <p className="section__eyebrow">
              <span className="terminal-text">{'>'} TECHNOLOGY_</span>
            </p>
            <h2 className="section__title">
              <VHSText>Enterprise-Grade Platform</VHSText>
            </h2>
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
                  <span className="feature__icon">◆</span>
                  {f}
                </motion.div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.2} className="platform__visual">
            <WireframeCube />
            <div className="terminal-box">
              <div className="terminal-box__header">
                <span className="terminal-box__title">JINKI_PLATFORM.SYS</span>
              </div>
              <pre className="terminal-box__content">
{`> INITIALIZING SYSTEMS...
> ████████████████ 100%

[THERMAL]    ████████ ONLINE
[LIDAR]      ████████ ONLINE
[NDVI]       ████████ ONLINE
[OGI]        ████████ ONLINE

UPTIME: 59min | ACCURACY: ±1cm
STATUS: OPERATIONAL`}
              </pre>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ADVISORY */}
      <section id="advisory" className="section">
        <FadeUp className="section__header">
          <p className="section__eyebrow">
            <span className="terminal-text">{'>'} ADVISORY_</span>
          </p>
          <h2 className="section__title">
            <VHSText>Cyber & AI Expertise</VHSText>
          </h2>
          <p className="section__subtitle">
            Enterprise security architecture meets aerial intelligence
          </p>
        </FadeUp>

        <FadeUp delay={0.2} className="advisor">
          <div className="advisor__avatar">
            <div className="avatar-frame">
              <div className="avatar-frame__corner" />
              <div className="avatar-frame__corner" />
              <div className="avatar-frame__corner" />
              <div className="avatar-frame__corner" />
              <div className="avatar-icon">👁</div>
            </div>
          </div>
          <h3 className="advisor__name">
            <VHSText>Abdillahi A.</VHSText>
          </h3>
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
            <div className="pulse-ring" />
            <div className="pulse-ring" />
            <div className="pulse-ring" />
            <span className="cta__symbol">◆</span>
          </div>
          <h2 className="cta__title">
            <VHSText>Ready to See Everything?</VHSText>
          </h2>
          <p className="cta__tagline">
            <span className="chrome-text">Ex Alto Omnia — From Above, All Things</span>
          </p>
          <p className="cta__subtitle">
            Schedule a consultation. Prevent the next million-dollar outage.
          </p>
          <div className="cta__actions">
            <a href="tel:+15551234567" className="btn btn--primary btn--lg">
              <span className="btn__text">Call Now</span>
            </a>
            <a href="mailto:contact@jinki.io" className="btn btn--ghost btn--lg">
              <span className="btn__text">Email Us</span>
            </a>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="footer__logo">
              <span className="terminal-text">{'>'}</span> JINKI INTELLIGENCE
            </span>
            <span className="footer__tagline">Ex Alto Omnia</span>
          </div>
          <span className="footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
