import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import './Competitor4.css'

// Typography-driven design where text IS the visual

function TypePattern({ text, className = '' }) {
  return (
    <div className={`type-pattern ${className}`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="type-pattern__row" style={{ animationDelay: `${i * 0.1}s` }}>
          {text.repeat(20)}
        </div>
      ))}
    </div>
  )
}

function AnimatedWeight({ children, className = '' }) {
  return (
    <motion.span
      className={className}
      style={{
        fontVariationSettings: "'wght' 900"
      }}
      animate={{
        fontVariationSettings: ["'wght' 300", "'wght' 900", "'wght' 300"]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.span>
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
    <div ref={ref} className="type-stat">
      <div className="type-stat__value">{prefix}{display}{suffix}</div>
      <div className="type-stat__label">{label}</div>
    </div>
  )
}

function IndustryType({ title, problem, solution, stats, index }) {
  return (
    <motion.div
      className="industry-type"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <h3 className="industry-type__title">{title}</h3>
      <div className="industry-type__content">
        <div className="industry-type__block">
          <span className="industry-type__label">PROBLEM</span>
          <p>{problem}</p>
        </div>
        <div className="industry-type__block">
          <span className="industry-type__label">SOLUTION</span>
          <p>{solution}</p>
        </div>
      </div>
      <div className="industry-type__stats">
        {stats.map((stat, i) => (
          <div key={i} className="industry-type__stat">
            <div className="industry-type__stat-value">{stat.value}</div>
            <div className="industry-type__stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function Competitor4() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const titleY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const titleOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

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
    <div className="type-page">
      {/* Background text pattern */}
      <div className="type-bg">
        <TypePattern text="JINKI " className="type-bg__pattern" />
      </div>

      {/* NAV - Minimal type */}
      <motion.header
        className="type-nav"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="type-nav__inner">
          <a href="/" className="type-nav__logo">JINKI</a>
          <nav className="type-nav__links">
            <a href="#industries">Industries</a>
            <a href="#platform">Platform</a>
            <a href="#advisory">Advisory</a>
          </nav>
          <a href="#contact" className="type-nav__cta">Start</a>
        </div>
      </motion.header>

      {/* HERO - Massive display type */}
      <section ref={heroRef} className="type-hero">
        <motion.div className="type-hero__content" style={{ y: titleY, opacity: titleOpacity }}>
          {/* Tagline */}
          <motion.div
            className="type-hero__tagline"
            initial={{ opacity: 0, letterSpacing: '2em' }}
            animate={{ opacity: 1, letterSpacing: '0.3em' }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            EX ALTO OMNIA
          </motion.div>

          {/* Massive Hero Title */}
          <div className="type-hero__title-wrapper">
            <motion.h1
              className="type-hero__title"
              initial={{ opacity: 0, y: 100, scale: 1.2 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <span className="type-hero__title-line">
                <AnimatedWeight className="type-hero__word type-hero__word--massive">FROM</AnimatedWeight>
              </span>
              <span className="type-hero__title-line">
                <span className="type-hero__word type-hero__word--outlined">ABOVE</span>
              </span>
              <span className="type-hero__title-line">
                <span className="type-hero__word type-hero__word--stacked">ALL</span>
                <span className="type-hero__word type-hero__word--condensed">THINGS</span>
              </span>
            </motion.h1>
          </div>

          {/* Subtitle as vertical text */}
          <motion.div
            className="type-hero__subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <p className="type-hero__subtitle-text">
              Autonomous aerial intelligence for critical infrastructure.
              Detect anomalies before catastrophic failure.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="type-hero__actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.4 }}
          >
            <a href="#contact" className="type-btn type-btn--primary">SCHEDULE ASSESSMENT</a>
            <a href="#industries" className="type-btn type-btn--ghost">EXPLORE SOLUTIONS</a>
          </motion.div>
        </motion.div>

        {/* Stats as type pattern */}
        <motion.div
          className="type-hero__stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <Counter value="700" prefix="$" suffix="K" label="Avg Outage Prevented"/>
          <Counter value="72" suffix="hrs" label="Early Detection"/>
          <Counter value="94" suffix="%" label="Fault Accuracy"/>
          <Counter value="58" suffix="%" label="Cost Reduction"/>
        </motion.div>
      </section>

      {/* INDUSTRIES - Type as grid */}
      <section id="industries" className="type-section">
        <motion.div
          className="type-section__header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="type-section__title">
            <span className="type-section__title-word">CRITICAL</span>
            <span className="type-section__title-word">INFRASTRUCTURE</span>
            <span className="type-section__title-word type-section__title-word--outlined">INTELLIGENCE</span>
          </h2>
          <p className="type-section__subtitle">Research-backed aerial protocols trusted by industry leaders</p>
        </motion.div>

        <div className="type-industries">
          {industries.map((industry, i) => (
            <IndustryType key={i} {...industry} index={i}/>
          ))}
        </div>
      </section>

      {/* PLATFORM - Text as architecture */}
      <section id="platform" className="type-section type-section--alt">
        <motion.div
          className="type-platform"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <div className="type-platform__header">
            <h2 className="type-platform__title">
              <span className="type-platform__title-line">ENTERPRISE</span>
              <span className="type-platform__title-line type-platform__title-line--heavy">GRADE</span>
              <span className="type-platform__title-line">PLATFORM</span>
            </h2>
          </div>

          <div className="type-platform__content">
            <div className="type-platform__lead">
              Military-adjacent inspection technology. IP55 rated for all-weather.
              Redundant flight systems. 59-minute endurance.
            </div>

            <div className="type-platform__features">
              {[
                ['0.05°C', 'Thermal Sensitivity'],
                ['2.4M pts/sec', 'LiDAR'],
                ['IP55', 'Weather Sealed'],
                ['Redundant', 'Flight Systems'],
                ['20km', 'Transmission Range'],
                ['±1cm', 'RTK Accuracy']
              ].map(([value, label], i) => (
                <motion.div
                  key={i}
                  className="type-feature"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <div className="type-feature__value">{value}</div>
                  <div className="type-feature__label">{label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ADVISORY - Type portrait */}
      <section id="advisory" className="type-section">
        <motion.div
          className="type-advisory"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <div className="type-advisory__header">
            <h2 className="type-advisory__title">
              <span className="type-advisory__title-line">CYBER</span>
              <span className="type-advisory__title-line type-advisory__title-line--ampersand">&</span>
              <span className="type-advisory__title-line">AI</span>
              <span className="type-advisory__title-line type-advisory__title-line--small">EXPERTISE</span>
            </h2>
          </div>

          <div className="type-advisor">
            <div className="type-advisor__name">ABDILLAHI A.</div>
            <div className="type-advisor__role">Principal Security Architect</div>
            <p className="type-advisor__bio">
              Enterprise security architecture, AI governance, and risk management
              for critical infrastructure. Zero-trust frameworks and regulatory
              compliance for energy, utilities, and data center sectors.
            </p>
            <div className="type-advisor__certs">
              {['CISSP', 'CCSP', 'AIGP', 'PMP'].map(c => (
                <span key={c} className="type-cert">{c}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA - Type as pattern */}
      <section id="contact" className="type-section type-section--cta">
        <motion.div
          className="type-cta"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="type-cta__title">
            <span className="type-cta__title-line">READY</span>
            <span className="type-cta__title-line">TO SEE</span>
            <span className="type-cta__title-line type-cta__title-line--outlined">EVERYTHING?</span>
          </h2>

          <div className="type-cta__tagline">Ex Alto Omnia — From Above, All Things</div>

          <p className="type-cta__text">
            Schedule a consultation. Prevent the next million-dollar outage.
          </p>

          <div className="type-cta__actions">
            <a href="tel:+15551234567" className="type-btn type-btn--primary type-btn--lg">CALL NOW</a>
            <a href="mailto:contact@jinki.io" className="type-btn type-btn--ghost type-btn--lg">EMAIL US</a>
          </div>
        </motion.div>
      </section>

      {/* FOOTER - Type lockup */}
      <footer className="type-footer">
        <div className="type-footer__inner">
          <div className="type-footer__brand">
            <div className="type-footer__logo">JINKI INTELLIGENCE</div>
            <div className="type-footer__tagline">Ex Alto Omnia</div>
          </div>
          <div className="type-footer__copy">© 2026 Jinki Intelligence</div>
        </div>
      </footer>
    </div>
  )
}
