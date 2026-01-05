import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import './LandingPage3.css'

// GPU RENDERING PERFORMANCE CONFIG
const PERF_CONFIG = {
  RAF_THROTTLE: true,
  OFFSCREEN_CANVAS: true,
  BATCH_UPDATES: true,
  MEMORY_CLEANUP: true,
}

// Logo
const logoUrl = '/jinki-logo.svg'

const ease = [0.25, 0.1, 0.25, 1]

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE MONITOR - Real-time FPS tracking
// ═══════════════════════════════════════════════════════════════
class PerformanceMonitor {
  constructor() {
    this.frames = 0
    this.lastTime = performance.now()
    this.fps = 60
    this.metrics = { paints: 0, composites: 0, memory: 0 }
  }

  tick() {
    this.frames++
    const now = performance.now()
    if (now - this.lastTime >= 1000) {
      this.fps = this.frames
      this.frames = 0
      this.lastTime = now
      if (typeof window !== 'undefined' && window.__PERF__) {
        window.__PERF__.fps = this.fps
      }
    }
  }

  report() {
    if (typeof window !== 'undefined') {
      window.__PERF__ = { fps: this.fps, metrics: this.metrics }
    }
  }
}

const perfMonitor = new PerformanceMonitor()

// ═══════════════════════════════════════════════════════════════
// ASCII LIQUID GLASS - GPU-OPTIMIZED with requestAnimationFrame
// ═══════════════════════════════════════════════════════════════
function AsciiLiquidGlass() {
  const [frame, setFrame] = useState(0)
  const frameRequestRef = useRef(null)
  const animationStartRef = useRef(Date.now())

  // Eye ASCII frames - memoized to prevent recreation
  const eyeFrames = useMemo(() => [
    [
      "            ░░░░░░░░░░░░            ",
      "        ░░▒▒▓▓██████▓▓▒▒░░        ",
      "      ░▒▓██            ██▓▒░      ",
      "    ░▒▓█    ▄▄████▄▄    █▓▒░    ",
      "   ░▓█   ▄██▀▀    ▀▀██▄   █▓░   ",
      "  ░▓█  ▄█▀   ●●●●   ▀█▄  █▓░  ",
      "  ▒█  ██   ●●▓▓▓▓●●   ██  █▒  ",
      "  ▓█  █   ●▓▓████▓▓●   █  █▓  ",
      "  ▓█  █   ●▓██▀▀██▓●   █  █▓  ",
      "  ▒█  ██   ●●▓▓▓▓●●   ██  █▒  ",
      "  ░▓█  ▀█▄   ●●●●   ▄█▀  █▓░  ",
      "   ░▓█   ▀██▄▄    ▄▄██▀   █▓░   ",
      "    ░▒▓█    ▀▀████▀▀    █▓▒░    ",
      "      ░▒▓██            ██▓▒░      ",
      "        ░░▒▒▓▓██████▓▓▒▒░░        ",
      "            ░░░░░░░░░░░░            ",
    ],
    [
      "            ▒▒▒▒▒▒▒▒▒▒▒▒            ",
      "        ▒▒▓▓████████████▓▓▒▒        ",
      "      ▒▓██                ██▓▒      ",
      "    ▒▓█      ▄▄████▄▄      █▓▒    ",
      "   ▒▓█    ▄██▀▀    ▀▀██▄    █▓▒   ",
      "  ▒▓█   ▄█▀    ○○○○    ▀█▄   █▓▒  ",
      "  ▓█   ██    ○○████○○    ██   █▓  ",
      "  █▓   █    ○████████○    █   ▓█  ",
      "  █▓   █    ○████████○    █   ▓█  ",
      "  ▓█   ██    ○○████○○    ██   █▓  ",
      "  ▒▓█   ▀█▄    ○○○○    ▄█▀   █▓▒  ",
      "   ▒▓█    ▀██▄▄    ▄▄██▀    █▓▒   ",
      "    ▒▓█      ▀▀████▀▀      █▓▒    ",
      "      ▒▓██                ██▓▒      ",
      "        ▒▒▓▓████████████▓▓▒▒        ",
      "            ▒▒▒▒▒▒▒▒▒▒▒▒            ",
    ],
    [
      "            ▓▓▓▓▓▓▓▓▓▓▓▓            ",
      "        ▓▓██████████████████▓▓        ",
      "      ▓██▀                ▀██▓      ",
      "    ▓█▀      ▄▄▀▀▀▀▄▄      ▀█▓    ",
      "   ▓█     ▄▀▀        ▀▀▄     █▓   ",
      "  ▓█    ▄▀      ◐◐      ▀▄    █▓  ",
      "  █▓   █      ◐◐██◐◐      █   ▓█  ",
      "  █    █     ◐██████◐     █    █  ",
      "  █    █     ◐██████◐     █    █  ",
      "  █▓   █      ◐◐██◐◐      █   ▓█  ",
      "  ▓█    ▀▄      ◐◐      ▄▀    █▓  ",
      "   ▓█     ▀▀▄        ▄▀▀     █▓   ",
      "    ▓█▀      ▀▀▄▄▄▄▀▀      ▀█▓    ",
      "      ▓██▄                ▄██▓      ",
      "        ▓▓██████████████████▓▓        ",
      "            ▓▓▓▓▓▓▓▓▓▓▓▓            ",
    ],
  ], [])

  // GPU-OPTIMIZED: RAF-driven animation without setInterval
  useEffect(() => {
    const animate = (now) => {
      const elapsed = now - animationStartRef.current
      const newFrame = Math.floor((elapsed / 800) % eyeFrames.length)
      if (newFrame !== frame) {
        setFrame(newFrame)
      }
      frameRequestRef.current = requestAnimationFrame(animate)
    }
    frameRequestRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current)
      }
    }
  }, [frame, eyeFrames.length])

  const currentFrame = eyeFrames[frame]

  return (
    <div className="ascii-glass">
      <div className="ascii-glass__container">
        <pre className="ascii-glass__art">
          {currentFrame.map((line, i) => (
            <motion.span
              key={i}
              className="ascii-glass__line"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              style={{ willChange: 'opacity, transform' }}
            >
              {line}
            </motion.span>
          ))}
        </pre>
        <div className="ascii-glass__glow" />
        <div className="ascii-glass__reflection" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LIQUID WAVE ASCII - GPU-OPTIMIZED with CSS animation
// ═══════════════════════════════════════════════════════════════
function LiquidWaveAscii() {
  // Memoize wave lines - prevent recalculation on every render
  const waveLines = useMemo(() => {
    const wave = '░▒▓█▓▒░  '
    const rows = []
    for (let rowOffset = 0; rowOffset < 5; rowOffset++) {
      let line = ''
      for (let i = 0; i < 50; i++) {
        const charIndex = (i + rowOffset) % wave.length
        line += wave[charIndex]
      }
      rows.push(line)
    }
    return rows
  }, [])

  return (
    <div className="liquid-wave">
      {waveLines.map((line, idx) => (
        <div
          key={idx}
          className="liquid-wave__row"
          style={{
            willChange: 'transform',
            contain: 'layout paint',
            transform: 'translateZ(0)',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}

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

// GPU-OPTIMIZED Counter with RAF-based animation
const Counter = ({ value, suffix = '', prefix = '', label }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!inView) return

    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(num * eased))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [inView, value])

  return (
    <div
      ref={ref}
      className="stat"
      style={{
        willChange: 'contents',
        contain: 'content',
      }}
    >
      <span className="stat__value">{prefix}{display}{suffix}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}

// GPU-OPTIMIZED IndustryCard with transform3d promotion
const IndustryCard = ({ image, title, problem, solution, stats, index }) => {
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
      style={{
        willChange: 'transform, opacity',
        contain: 'layout paint',
        transform: 'translateZ(0)',
      }}
    >
      <motion.div
        className="card__image"
        style={{
          y: smoothY,
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        <img
          src={image}
          alt={title}
          loading="lazy"
          style={{ transform: 'translateZ(0)' }}
        />
      </motion.div>
      <div className="card__content" style={{ contain: 'content' }}>
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
  const asciiY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const asciiRotate = useTransform(scrollYProgress, [0, 1], [0, 10])

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
      {/* Liquid wave background */}
      <div className="liquid-bg">
        <LiquidWaveAscii />
      </div>

      {/* NAV */}
      <motion.header
        className="nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="nav__inner">
          <a href="/" className="nav__logo">
            <span className="nav__logo-text">JINKI</span>
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

        {/* ASCII Liquid Glass Eye */}
        <motion.div
          className="hero__ascii"
          style={{ y: asciiY, rotate: asciiRotate }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease }}
        >
          <AsciiLiquidGlass />
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
                  <span className="feature__icon">◉</span>
                  {f}
                </motion.div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.2} className="platform__visual">
            <div className="platform__ascii">
              <pre className="ascii-box">
{`┌──────────────────────────────┐
│  ╔═══════════════════════╗  │
│  ║   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄   ║  │
│  ║  █ JINKI PLATFORM █  ║  │
│  ║   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀   ║  │
│  ╠═══════════════════════╣  │
│  ║  ○ Thermal    [████] ║  │
│  ║  ○ LiDAR      [████] ║  │
│  ║  ○ NDVI       [████] ║  │
│  ║  ○ OGI        [████] ║  │
│  ╚═══════════════════════╝  │
│    ◄ 59min  ●  ±1cm RTK ►   │
└──────────────────────────────┘`}
              </pre>
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
            <pre className="ascii-avatar">
{`┌─────┐
│ ◉ ◉ │
│  ▽  │
│ ─── │
└─────┘`}
            </pre>
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
          <pre className="cta__ascii">
{`    ◉
   ╱ ╲
  ╱   ╲
 ◉─────◉`}
          </pre>
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
            <span className="footer__logo">◉ JINKI INTELLIGENCE</span>
            <span className="footer__tagline">Ex Alto Omnia</span>
          </div>
          <span className="footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
