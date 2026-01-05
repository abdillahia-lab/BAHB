import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import './Mega4.css'

// ═══════════════════════════════════════════════════════════════
// GRIDMASTER - Mathematical Grid Perfection
// Swiss Design Precision Meets Modern Web
// ═══════════════════════════════════════════════════════════════

const ease = [0.25, 0.1, 0.25, 1]

// Grid coordinates animation
function GridCoordinates() {
  const [coords, setCoords] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const interval = setInterval(() => {
      setCoords({
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100)
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid-coords">
      <span className="grid-coords__label">COORDINATES</span>
      <span className="grid-coords__value">
        X:{coords.x.toString().padStart(3, '0')} Y:{coords.y.toString().padStart(3, '0')}
      </span>
    </div>
  )
}

// Counter with grid styling
function GridCounter({ value, suffix = '', prefix = '', label }) {
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
    <div ref={ref} className="grid-stat">
      <div className="grid-stat__value">{prefix}{display}{suffix}</div>
      <div className="grid-stat__label">{label}</div>
    </div>
  )
}

// Bento card with grid layout
function BentoCard({ title, problem, solution, stats, size, index }) {
  return (
    <motion.div
      className={`bento-card bento-card--${size}`}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease }}
    >
      <div className="bento-card__grid-number">{(index + 1).toString().padStart(2, '0')}</div>
      <h3 className="bento-card__title">{title}</h3>
      <div className="bento-card__divider"></div>
      <div className="bento-card__problem">
        <span className="bento-card__label">PROBLEM</span>
        <p>{problem}</p>
      </div>
      <div className="bento-card__solution">
        <span className="bento-card__label">SOLUTION</span>
        <p>{solution}</p>
      </div>
      <div className="bento-card__stats">
        {stats.map((stat, i) => (
          <div key={i} className="bento-stat">
            <div className="bento-stat__value">{stat.value}</div>
            <div className="bento-stat__label">{stat.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function Mega4() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const gridY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const industries = [
    {
      size: 'large',
      title: 'Data Centers',
      problem: '19% of outages from cooling failures. $700K average cost.',
      solution: 'Thermal monitoring at 0.05°C sensitivity. 72hr early detection.',
      stats: [
        { value: '$700K', label: 'Avg Cost' },
        { value: '72hrs', label: 'Early Alert' }
      ]
    },
    {
      size: 'medium',
      title: 'Electric Utilities',
      problem: 'Ground crews miss 48% of defects. $2K+/hr helicopters.',
      solution: 'LiDAR 2.4M pts/sec. 60% cost reduction.',
      stats: [
        { value: '60%', label: 'Cost Cut' },
        { value: '4.5x', label: 'Defects Found' }
      ]
    },
    {
      size: 'medium',
      title: 'Agriculture',
      problem: 'Crop stress visible only after 14+ days damage.',
      solution: 'NDVI multispectral. 14 days earlier detection.',
      stats: [
        { value: '14d', label: 'Earlier' },
        { value: '150%', label: 'ROI' }
      ]
    },
    {
      size: 'large',
      title: 'Oil & Gas',
      problem: 'EPA requires continuous methane monitoring. Manual takes days.',
      solution: 'OGI with 99.2% detection rate. 14km daily coverage.',
      stats: [
        { value: '99.2%', label: 'Detection' },
        { value: '14km', label: 'Coverage' }
      ]
    }
  ]

  const specs = [
    { metric: '0.05°C', desc: 'Thermal Sensitivity' },
    { metric: '2.4M', desc: 'LiDAR pts/sec' },
    { metric: 'IP55', desc: 'Weather Sealed' },
    { metric: '±1cm', desc: 'RTK Accuracy' },
    { metric: '20km', desc: 'TX Range' },
    { metric: '59min', desc: 'Endurance' }
  ]

  return (
    <div className="gridmaster">
      {/* Global Grid Lines */}
      <div className="grid-lines">
        <div className="grid-lines__vertical"></div>
        <div className="grid-lines__horizontal"></div>
      </div>

      {/* NAV */}
      <motion.header
        className="grid-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="grid-nav__inner">
          <div className="grid-nav__logo">
            <div className="grid-nav__logo-square"></div>
            <span>JINKI</span>
          </div>
          <nav className="grid-nav__links">
            <a href="#industries">Industries</a>
            <a href="#platform">Platform</a>
            <a href="#advisory">Advisory</a>
          </nav>
          <a href="#contact" className="grid-btn">Get Started</a>
        </div>
      </motion.header>

      {/* HERO - Bento Grid Layout */}
      <section ref={heroRef} className="grid-hero">
        <motion.div
          className="grid-hero__background"
          style={{ y: gridY }}
        >
          <div className="grid-hero__pattern"></div>
        </motion.div>

        <motion.div
          className="grid-hero__content"
          style={{ opacity: heroOpacity }}
        >
          <div className="grid-hero__bento">
            {/* Cell 1: Main Title */}
            <motion.div
              className="grid-cell grid-cell--title"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease }}
            >
              <div className="grid-cell__label">01 / IDENTITY</div>
              <h1 className="grid-hero__title">
                FROM ABOVE,<br/>
                <span className="gradient-text">ALL THINGS</span>
              </h1>
              <div className="grid-cell__tagline">EX ALTO OMNIA</div>
            </motion.div>

            {/* Cell 2: Coordinates */}
            <motion.div
              className="grid-cell grid-cell--coords"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease }}
            >
              <GridCoordinates />
            </motion.div>

            {/* Cell 3: Description */}
            <motion.div
              className="grid-cell grid-cell--desc"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
            >
              <div className="grid-cell__label">02 / MISSION</div>
              <p className="grid-hero__desc">
                Autonomous aerial intelligence for critical infrastructure.
                Detect anomalies before catastrophic failure.
              </p>
            </motion.div>

            {/* Cell 4: CTA */}
            <motion.div
              className="grid-cell grid-cell--cta"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease }}
            >
              <a href="#contact" className="grid-btn grid-btn--primary">
                Schedule Assessment
              </a>
              <a href="#industries" className="grid-btn grid-btn--outline">
                Explore Solutions
              </a>
            </motion.div>

            {/* Cell 5-8: Stats */}
            {[
              { value: '700', prefix: '$', suffix: 'K', label: 'Avg Outage Prevented' },
              { value: '72', suffix: 'hrs', label: 'Early Detection' },
              { value: '94', suffix: '%', label: 'Fault Accuracy' },
              { value: '58', suffix: '%', label: 'Cost Reduction' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="grid-cell grid-cell--stat"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.7 + i * 0.1, ease }}
              >
                <GridCounter {...stat} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* INDUSTRIES - Bento Box Grid */}
      <section id="industries" className="grid-section">
        <div className="grid-section__header">
          <motion.div
            className="grid-label"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
          >
            03 / SOLUTIONS
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
          >
            Critical Infrastructure Intelligence
          </motion.h2>
          <motion.p
            className="grid-section__subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
          >
            Research-backed aerial protocols trusted by industry leaders
          </motion.p>
        </div>

        <div className="bento-grid">
          {industries.map((industry, i) => (
            <BentoCard key={i} {...industry} index={i} />
          ))}
        </div>
      </section>

      {/* PLATFORM - Spec Grid */}
      <section id="platform" className="grid-section grid-section--alt">
        <div className="grid-platform">
          <div className="grid-platform__header">
            <motion.div
              className="grid-label"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
            >
              04 / TECHNOLOGY
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease }}
            >
              Enterprise-Grade Platform
            </motion.h2>
            <motion.p
              className="grid-platform__lead"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
            >
              Military-adjacent inspection technology. All-weather rated.
              Redundant flight systems. 59-minute endurance.
            </motion.p>
          </div>

          <div className="spec-grid">
            {specs.map((spec, i) => (
              <motion.div
                key={i}
                className="spec-cell"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
              >
                <div className="spec-cell__number">{(i + 1).toString().padStart(2, '0')}</div>
                <div className="spec-cell__metric">{spec.metric}</div>
                <div className="spec-cell__desc">{spec.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ADVISORY */}
      <section id="advisory" className="grid-section">
        <div className="grid-section__header">
          <motion.div
            className="grid-label"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
          >
            05 / ADVISORY
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
          >
            Cyber & AI Expertise
          </motion.h2>
          <motion.p
            className="grid-section__subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
          >
            Enterprise security architecture meets aerial intelligence
          </motion.p>
        </div>

        <motion.div
          className="advisor-grid"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
        >
          <div className="advisor-grid__avatar">
            <div className="advisor-avatar">
              <div className="advisor-avatar__square"></div>
            </div>
          </div>
          <div className="advisor-grid__info">
            <h3>Abdillahi A.</h3>
            <div className="advisor-role">Principal Security Architect</div>
            <p className="advisor-bio">
              Enterprise security architecture, AI governance, and risk management
              for critical infrastructure. Zero-trust frameworks and regulatory
              compliance for energy, utilities, and data center sectors.
            </p>
            <div className="advisor-certs">
              {['CISSP', 'CCSP', 'AIGP', 'PMP'].map(c => (
                <div key={c} className="cert-badge">{c}</div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section id="contact" className="grid-section grid-section--cta">
        <motion.div
          className="grid-cta"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
        >
          <div className="grid-cta__label">06 / CONTACT</div>
          <h2>Ready to See Everything?</h2>
          <div className="grid-cta__tagline">EX ALTO OMNIA</div>
          <p>Schedule a consultation. Prevent the next million-dollar outage.</p>
          <div className="grid-cta__actions">
            <a href="tel:+15551234567" className="grid-btn grid-btn--primary grid-btn--lg">
              Call Now
            </a>
            <a href="mailto:contact@jinki.io" className="grid-btn grid-btn--outline grid-btn--lg">
              Email Us
            </a>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="grid-footer">
        <div className="grid-footer__inner">
          <div className="grid-footer__brand">
            <div className="grid-footer__logo">
              <div className="grid-footer__logo-square"></div>
              <span>JINKI INTELLIGENCE</span>
            </div>
            <div className="grid-footer__tagline">EX ALTO OMNIA</div>
          </div>
          <div className="grid-footer__copy">© 2026 Jinki Intelligence. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
