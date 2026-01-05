import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import './Mega8.css'

const ease = [0.25, 0.1, 0.25, 1]

// ═══════════════════════════════════════════════════════════════
// HOLOGRAPHIC EYE - Iridescent animated eye with rainbow refractions
// ═══════════════════════════════════════════════════════════════
function HolographicEye() {
  const [pulsePhase, setPulsePhase] = useState(0)
  const eyeRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 1) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="holo-eye" ref={eyeRef}>
      <div className="holo-eye__outer">
        <div className="holo-eye__iris" style={{ '--pulse': pulsePhase }}>
          <div className="holo-eye__pupil">
            <div className="holo-eye__reflection" />
          </div>
          <div className="holo-eye__ring holo-eye__ring--1" />
          <div className="holo-eye__ring holo-eye__ring--2" />
          <div className="holo-eye__ring holo-eye__ring--3" />
        </div>
        <div className="holo-eye__glow" />
        <div className="holo-eye__prism" />
      </div>
      <svg className="holo-eye__rays" viewBox="0 0 400 400">
        <g className="holo-eye__ray-group">
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1="200"
              y1="200"
              x2="200"
              y2="50"
              stroke="url(#rainbow-gradient)"
              strokeWidth="2"
              transform={`rotate(${i * 30} 200 200)`}
              opacity="0.6"
            />
          ))}
        </g>
        <defs>
          <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff0080" />
            <stop offset="33%" stopColor="#7928ca" />
            <stop offset="66%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#00ff88" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PRISM WAVE - Animated rainbow wave background
// ═══════════════════════════════════════════════════════════════
function PrismWave() {
  return (
    <div className="prism-wave">
      <div className="prism-wave__layer prism-wave__layer--1" />
      <div className="prism-wave__layer prism-wave__layer--2" />
      <div className="prism-wave__layer prism-wave__layer--3" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HOLOGRAPHIC COUNTER
// ═══════════════════════════════════════════════════════════════
function HoloCounter({ value, suffix = '', prefix = '', label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    const duration = 2000
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplay(Math.floor(num * eased))
      if (progress < 1) requestAnimationFrame(tick)
      else setDisplay(num)
    }
    tick()
  }, [inView, value])

  return (
    <div ref={ref} className="holo-stat">
      <div className="holo-stat__value">
        <span className="holo-stat__foil">{prefix}{display}{suffix}</span>
      </div>
      <div className="holo-stat__label">{label}</div>
      <div className="holo-stat__shine" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// IRIDESCENT CARD
// ═══════════════════════════════════════════════════════════════
function IridescentCard({ image, title, problem, solution, stats, index }) {
  const cardRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePos({ x, y })
  }

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start']
  })

  const y = useTransform(scrollYProgress, [0, 1], [60, -60])
  const smoothY = useSpring(y, { stiffness: 80, damping: 30 })

  return (
    <motion.div
      ref={cardRef}
      className="iridescent-card"
      initial={{ opacity: 0, y: 100, rotateX: -15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1, delay: index * 0.15, ease }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0.5, y: 0.5 })}
      style={{
        '--mouse-x': mousePos.x,
        '--mouse-y': mousePos.y,
      }}
    >
      <div className="iridescent-card__shine" />
      <div className="iridescent-card__hologram" />

      <motion.div className="iridescent-card__image" style={{ y: smoothY }}>
        <img src={image} alt={title} loading="lazy" />
        <div className="iridescent-card__image-overlay" />
      </motion.div>

      <div className="iridescent-card__content">
        <h3 className="iridescent-card__title">{title}</h3>

        <div className="iridescent-card__section">
          <span className="iridescent-card__label">Challenge</span>
          <p>{problem}</p>
        </div>

        <div className="iridescent-card__section">
          <span className="iridescent-card__label">Solution</span>
          <p>{solution}</p>
        </div>

        <div className="iridescent-card__stats">
          {stats.map((stat, i) => (
            <div key={i} className="iridescent-card__stat">
              <div className="iridescent-card__stat-value">{stat.value}</div>
              <div className="iridescent-card__stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="iridescent-card__border" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FADE UP ANIMATION
// ═══════════════════════════════════════════════════════════════
function FadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 1, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SMOOTH SCROLL HOOK
// ═══════════════════════════════════════════════════════════════
function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Mega8() {
  useSmoothScroll()

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92])
  const eyeY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const eyeRotate = useTransform(scrollYProgress, [0, 1], [0, 15])

  // Global scroll progress for holographic effects
  const { scrollYProgress: globalScroll } = useScroll()
  const hueRotate = useTransform(globalScroll, [0, 1], [0, 360])

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
    <div className="mega8">
      {/* Prism wave background */}
      <PrismWave />

      {/* Holographic scroll indicator */}
      <motion.div
        className="holo-scroll-progress"
        style={{ scaleX: scrollYProgress }}
      />

      {/* NAV */}
      <motion.header
        className="holo-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease }}
      >
        <div className="holo-nav__inner">
          <a href="/" className="holo-nav__logo">
            <span className="holo-nav__logo-text foil-text">JINKI</span>
            <div className="holo-nav__logo-shine" />
          </a>
          <nav className="holo-nav__links">
            <a href="#industries" className="holo-nav__link">Industries</a>
            <a href="#platform" className="holo-nav__link">Platform</a>
            <a href="#advisory" className="holo-nav__link">Advisory</a>
          </nav>
          <a href="#contact" className="holo-btn holo-btn--primary">
            <span>Get Started</span>
            <div className="holo-btn__shine" />
          </a>
        </div>
      </motion.header>

      {/* HERO */}
      <section ref={heroRef} className="holo-hero">
        <div className="holo-hero__bg">
          <div className="holo-hero__grid" />
          <div className="holo-hero__gradient" />
        </div>

        {/* Holographic Eye */}
        <motion.div
          className="holo-hero__eye"
          style={{ y: eyeY, rotate: eyeRotate }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3, ease }}
        >
          <HolographicEye />
        </motion.div>

        <motion.div
          className="holo-hero__content"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          <motion.div
            className="holo-hero__tagline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease }}
          >
            <span className="rainbow-text">Ex Alto Omnia</span>
          </motion.div>

          <motion.h1
            className="holo-hero__title"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2, ease }}
          >
            From Above, <span className="foil-text">All Things</span>
          </motion.h1>

          <motion.p
            className="holo-hero__subtitle"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.4, ease }}
          >
            Autonomous aerial intelligence for critical infrastructure.<br/>
            Detect anomalies before catastrophic failure.
          </motion.p>

          <motion.div
            className="holo-hero__actions"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.6, ease }}
          >
            <a href="#contact" className="holo-btn holo-btn--large holo-btn--primary">
              <span>Schedule Assessment</span>
              <div className="holo-btn__shine" />
            </a>
            <a href="#industries" className="holo-btn holo-btn--large holo-btn--glass">
              <span>Explore Solutions</span>
              <div className="holo-btn__shine" />
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="holo-hero__stats"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.8, ease }}
        >
          <HoloCounter value="700" prefix="$" suffix="K" label="Avg Outage Prevented"/>
          <HoloCounter value="72" suffix="hrs" label="Early Detection"/>
          <HoloCounter value="94" suffix="%" label="Fault Accuracy"/>
          <HoloCounter value="58" suffix="%" label="Cost Reduction"/>
        </motion.div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="holo-section">
        <FadeUp className="holo-section__header">
          <div className="holo-section__eyebrow rainbow-text">Solutions</div>
          <h2 className="holo-section__title">
            Critical Infrastructure <span className="foil-text">Intelligence</span>
          </h2>
          <p className="holo-section__subtitle">
            Research-backed aerial protocols trusted by industry leaders
          </p>
        </FadeUp>

        <div className="holo-cards">
          {industries.map((industry, i) => (
            <IridescentCard key={i} {...industry} index={i}/>
          ))}
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="holo-section holo-section--platform">
        <div className="holo-platform">
          <FadeUp className="holo-platform__text">
            <div className="holo-section__eyebrow rainbow-text">Technology</div>
            <h2 className="holo-section__title">
              Enterprise-Grade <span className="foil-text">Platform</span>
            </h2>
            <p className="holo-platform__lead">
              Military-adjacent inspection technology. IP55 rated for all-weather.
              Redundant flight systems. 59-minute endurance.
            </p>
            <div className="holo-features">
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
                  className="holo-feature"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease }}
                >
                  <div className="holo-feature__icon">◆</div>
                  <span>{f}</span>
                  <div className="holo-feature__shine" />
                </motion.div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.2} className="holo-platform__visual">
            <div className="holo-glass-panel">
              <div className="holo-glass-panel__shine" />
              <div className="holo-glass-panel__content">
                <div className="holo-platform__badge foil-text">JINKI PLATFORM</div>
                <div className="holo-platform__metrics">
                  <div className="holo-metric">
                    <div className="holo-metric__label">Thermal</div>
                    <div className="holo-metric__bar">
                      <div className="holo-metric__fill" style={{ width: '96%' }} />
                    </div>
                  </div>
                  <div className="holo-metric">
                    <div className="holo-metric__label">LiDAR</div>
                    <div className="holo-metric__bar">
                      <div className="holo-metric__fill" style={{ width: '94%' }} />
                    </div>
                  </div>
                  <div className="holo-metric">
                    <div className="holo-metric__label">NDVI</div>
                    <div className="holo-metric__bar">
                      <div className="holo-metric__fill" style={{ width: '98%' }} />
                    </div>
                  </div>
                  <div className="holo-metric">
                    <div className="holo-metric__label">OGI</div>
                    <div className="holo-metric__bar">
                      <div className="holo-metric__fill" style={{ width: '99%' }} />
                    </div>
                  </div>
                </div>
                <div className="holo-platform__footer">
                  <span className="rainbow-text">59min endurance</span>
                  <span className="holo-platform__separator">●</span>
                  <span className="rainbow-text">±1cm RTK</span>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ADVISORY */}
      <section id="advisory" className="holo-section">
        <FadeUp className="holo-section__header">
          <div className="holo-section__eyebrow rainbow-text">Advisory</div>
          <h2 className="holo-section__title">
            Cyber & AI <span className="foil-text">Expertise</span>
          </h2>
          <p className="holo-section__subtitle">
            Enterprise security architecture meets aerial intelligence
          </p>
        </FadeUp>

        <FadeUp delay={0.2} className="holo-advisor">
          <div className="holo-advisor__card">
            <div className="holo-advisor__shine" />
            <div className="holo-advisor__avatar">
              <div className="holo-advisor__avatar-inner">
                <div className="holo-advisor__avatar-icon foil-text">AA</div>
              </div>
            </div>
            <h3 className="holo-advisor__name">Abdillahi A.</h3>
            <p className="holo-advisor__role rainbow-text">Principal Security Architect</p>
            <p className="holo-advisor__bio">
              Enterprise security architecture, AI governance, and risk management
              for critical infrastructure. Zero-trust frameworks and regulatory
              compliance for energy, utilities, and data center sectors.
            </p>
            <div className="holo-advisor__certs">
              {['CISSP', 'CCSP', 'AIGP', 'PMP'].map(c => (
                <span key={c} className="holo-cert">
                  <span className="holo-cert__text">{c}</span>
                  <div className="holo-cert__shine" />
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>

      {/* CTA */}
      <section id="contact" className="holo-section holo-section--cta">
        <FadeUp className="holo-cta">
          <div className="holo-cta__icon">
            <div className="holo-cta__triangle" />
          </div>
          <h2 className="holo-cta__title">
            Ready to See <span className="foil-text">Everything?</span>
          </h2>
          <p className="holo-cta__tagline rainbow-text">
            Ex Alto Omnia — From Above, All Things
          </p>
          <p className="holo-cta__text">
            Schedule a consultation. Prevent the next million-dollar outage.
          </p>
          <div className="holo-cta__actions">
            <a href="tel:+15551234567" className="holo-btn holo-btn--large holo-btn--primary">
              <span>Call Now</span>
              <div className="holo-btn__shine" />
            </a>
            <a href="mailto:contact@jinki.io" className="holo-btn holo-btn--large holo-btn--glass">
              <span>Email Us</span>
              <div className="holo-btn__shine" />
            </a>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER */}
      <footer className="holo-footer">
        <div className="holo-footer__inner">
          <div className="holo-footer__brand">
            <span className="holo-footer__logo foil-text">◆ JINKI INTELLIGENCE</span>
            <span className="holo-footer__tagline rainbow-text">Ex Alto Omnia</span>
          </div>
          <span className="holo-footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
