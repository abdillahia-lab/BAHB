import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import Lenis from 'lenis'
import './Mega1.css'

const ease = [0.25, 0.1, 0.25, 1]

// ═══════════════════════════════════════════════════════════════
// NEOMORPHIC EYE - Soft, extruded cyber-eye with depth
// ═══════════════════════════════════════════════════════════════
function NeomorphicEye() {
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 3
      const maxMove = 15

      const x = ((e.clientX - centerX) / centerX) * maxMove
      const y = ((e.clientY - centerY) / centerY) * maxMove

      setPupilPos({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="neo-eye">
      <div className="neo-eye__outer">
        <div className="neo-eye__middle">
          <motion.div
            className="neo-eye__iris"
            animate={{ x: pupilPos.x, y: pupilPos.y }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          >
            <div className="neo-eye__pupil">
              <div className="neo-eye__highlight" />
            </div>
            <div className="neo-eye__ring" />
          </motion.div>
        </div>
      </div>
      <div className="neo-eye__glow" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SMOOTH SCROLL HOOK
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
// FADE UP COMPONENT
// ═══════════════════════════════════════════════════════════════
function FadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COUNTER COMPONENT
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
    <div ref={ref} className="neo-stat">
      <div className="neo-stat__value">{prefix}{display}{suffix}</div>
      <div className="neo-stat__label">{label}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// INDUSTRY CARD - Neomorphic elevated surface
// ═══════════════════════════════════════════════════════════════
function IndustryCard({ title, problem, solution, stats, index }) {
  return (
    <motion.div
      className="neo-card"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease }}
    >
      <div className="neo-card__inner">
        <h3 className="neo-card__title">{title}</h3>

        <div className="neo-card__section">
          <div className="neo-card__label">Challenge</div>
          <p className="neo-card__text">{problem}</p>
        </div>

        <div className="neo-card__section">
          <div className="neo-card__label">Solution</div>
          <p className="neo-card__text">{solution}</p>
        </div>

        <div className="neo-card__stats">
          {stats.map((stat, i) => (
            <div key={i} className="neo-card__stat">
              <div className="neo-card__stat-value">{stat.value}</div>
              <div className="neo-card__stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Mega1() {
  useSmoothScroll()

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const industries = [
    {
      title: 'Data Centers',
      problem: '19% of outages stem from cooling failures. Average cost: $700K.',
      solution: 'Thermal monitoring with 0.05°C sensitivity detects hotspots 72 hours early.',
      stats: [{ value: '$700K', label: 'Avg Outage Cost' }, { value: '72hrs', label: 'Early Detection' }]
    },
    {
      title: 'Electric Utilities',
      problem: 'Ground crews miss 48% of defects. Helicopters cost $2,000+/hour.',
      solution: 'LiDAR at 2.4M points/sec. 60% cost reduction vs helicopter.',
      stats: [{ value: '60%', label: 'Cost Reduction' }, { value: '4.5x', label: 'More Defects' }]
    },
    {
      title: 'Precision Agriculture',
      problem: 'Crop stress visible to eye only after 14+ days of damage.',
      solution: 'NDVI multispectral imaging detects stress 14 days earlier.',
      stats: [{ value: '14 days', label: 'Earlier Detection' }, { value: '150%', label: 'Proven ROI' }]
    },
    {
      title: 'Oil & Gas',
      problem: 'EPA requires continuous methane monitoring. Manual inspection takes days.',
      solution: 'Optical Gas Imaging with 99.2% detection. 14km daily coverage.',
      stats: [{ value: '99.2%', label: 'Detection Rate' }, { value: '14km', label: 'Daily Coverage' }]
    }
  ]

  return (
    <div className="neo-page">
      {/* NAV */}
      <motion.header
        className="neo-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="neo-nav__inner">
          <a href="/" className="neo-nav__logo">JINKI</a>
          <nav className="neo-nav__links">
            <a href="#industries" className="neo-nav__link">Industries</a>
            <a href="#platform" className="neo-nav__link">Platform</a>
            <a href="#advisory" className="neo-nav__link">Advisory</a>
          </nav>
          <button className="neo-btn neo-btn--primary">Get Started</button>
        </div>
      </motion.header>

      {/* HERO */}
      <section ref={heroRef} className="neo-hero">
        <motion.div
          className="neo-hero__content"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <motion.div
            className="neo-hero__eye-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease }}
          >
            <NeomorphicEye />
          </motion.div>

          <motion.p
            className="neo-hero__tagline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease }}
          >
            Ex Alto Omnia
          </motion.p>

          <motion.h1
            className="neo-hero__title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1, ease }}
          >
            From Above, All Things
          </motion.h1>

          <motion.p
            className="neo-hero__subtitle"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2, ease }}
          >
            Autonomous aerial intelligence for critical infrastructure.
            <br />Detect anomalies before catastrophic failure.
          </motion.p>

          <motion.div
            className="neo-hero__actions"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4, ease }}
          >
            <button className="neo-btn neo-btn--primary neo-btn--lg">
              Schedule Assessment
            </button>
            <button className="neo-btn neo-btn--secondary neo-btn--lg">
              Explore Solutions
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          className="neo-hero__stats"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.6, ease }}
        >
          <Counter value="700" prefix="$" suffix="K" label="Avg Outage Prevented" />
          <Counter value="72" suffix="hrs" label="Early Detection" />
          <Counter value="94" suffix="%" label="Fault Accuracy" />
          <Counter value="58" suffix="%" label="Cost Reduction" />
        </motion.div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="neo-section">
        <FadeUp className="neo-section__header">
          <p className="neo-section__eyebrow">Solutions</p>
          <h2 className="neo-section__title">Critical Infrastructure Intelligence</h2>
          <p className="neo-section__subtitle">
            Research-backed aerial protocols trusted by industry leaders
          </p>
        </FadeUp>

        <div className="neo-cards">
          {industries.map((industry, i) => (
            <IndustryCard key={i} {...industry} index={i} />
          ))}
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="neo-section">
        <div className="neo-platform">
          <FadeUp className="neo-platform__content">
            <p className="neo-section__eyebrow">Technology</p>
            <h2 className="neo-section__title">Enterprise-Grade Platform</h2>
            <p className="neo-platform__lead">
              Military-adjacent inspection technology. IP55 rated for all-weather.
              Redundant flight systems. 59-minute endurance.
            </p>

            <div className="neo-features">
              {[
                '0.05°C Thermal Sensitivity',
                'LiDAR @ 2.4M pts/sec',
                'IP55 Weather Sealed',
                'Redundant Flight Systems',
                '20km Transmission Range',
                '±1cm RTK Accuracy'
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className="neo-feature"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease }}
                >
                  <div className="neo-feature__icon">✓</div>
                  <div className="neo-feature__text">{feature}</div>
                </motion.div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.2} className="neo-platform__visual">
            <div className="neo-platform__box">
              <div className="neo-platform__display">
                <div className="neo-platform__display-header">JINKI PLATFORM</div>
                <div className="neo-platform__metrics">
                  <div className="neo-metric">
                    <div className="neo-metric__bar">
                      <div className="neo-metric__fill" style={{ width: '95%' }} />
                    </div>
                    <div className="neo-metric__label">Thermal</div>
                  </div>
                  <div className="neo-metric">
                    <div className="neo-metric__bar">
                      <div className="neo-metric__fill" style={{ width: '88%' }} />
                    </div>
                    <div className="neo-metric__label">LiDAR</div>
                  </div>
                  <div className="neo-metric">
                    <div className="neo-metric__bar">
                      <div className="neo-metric__fill" style={{ width: '92%' }} />
                    </div>
                    <div className="neo-metric__label">NDVI</div>
                  </div>
                  <div className="neo-metric">
                    <div className="neo-metric__bar">
                      <div className="neo-metric__fill" style={{ width: '85%' }} />
                    </div>
                    <div className="neo-metric__label">OGI</div>
                  </div>
                </div>
                <div className="neo-platform__footer">
                  <span>59min</span>
                  <div className="neo-platform__dot" />
                  <span>±1cm RTK</span>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ADVISORY */}
      <section id="advisory" className="neo-section">
        <FadeUp className="neo-section__header">
          <p className="neo-section__eyebrow">Advisory</p>
          <h2 className="neo-section__title">Cyber & AI Expertise</h2>
          <p className="neo-section__subtitle">
            Enterprise security architecture meets aerial intelligence
          </p>
        </FadeUp>

        <FadeUp delay={0.2} className="neo-advisor">
          <div className="neo-advisor__avatar">
            <div className="neo-advisor__avatar-inner">AA</div>
          </div>
          <h3 className="neo-advisor__name">Abdillahi A.</h3>
          <p className="neo-advisor__role">Principal Security Architect</p>
          <p className="neo-advisor__bio">
            Enterprise security architecture, AI governance, and risk management
            for critical infrastructure. Zero-trust frameworks and regulatory
            compliance for energy, utilities, and data center sectors.
          </p>
          <div className="neo-advisor__certs">
            {['CISSP', 'CCSP', 'AIGP', 'PMP'].map(cert => (
              <span key={cert} className="neo-cert">{cert}</span>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* CTA */}
      <section id="contact" className="neo-section">
        <FadeUp className="neo-cta">
          <div className="neo-cta__icon">
            <div className="neo-cta__triangle" />
          </div>
          <h2 className="neo-cta__title">Ready to See Everything?</h2>
          <p className="neo-cta__tagline">Ex Alto Omnia — From Above, All Things</p>
          <p className="neo-cta__text">
            Schedule a consultation. Prevent the next million-dollar outage.
          </p>
          <div className="neo-cta__actions">
            <button className="neo-btn neo-btn--primary neo-btn--xl">Call Now</button>
            <button className="neo-btn neo-btn--secondary neo-btn--xl">Email Us</button>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER */}
      <footer className="neo-footer">
        <div className="neo-footer__inner">
          <div className="neo-footer__brand">
            <div className="neo-footer__logo">JINKI INTELLIGENCE</div>
            <div className="neo-footer__tagline">Ex Alto Omnia</div>
          </div>
          <div className="neo-footer__copy">© 2026 Jinki Intelligence. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
