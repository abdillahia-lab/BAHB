import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import './LandingPage3.css'

// ═══════════════════════════════════════════════════════════════
// SIMPLE COUNTER
// ═══════════════════════════════════════════════════════════════
function Counter({ value, suffix = '', prefix = '', label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    let current = 0
    const step = num / 40
    const tick = () => {
      current += step
      if (current < num) {
        setDisplay(Math.floor(current))
        requestAnimationFrame(tick)
      } else {
        setDisplay(num)
      }
    }
    tick()
  }, [inView, value])

  return (
    <div ref={ref} className="counter">
      <span className="counter__value">{prefix}{display}{suffix}</span>
      <span className="counter__label">{label}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// INDUSTRY CARD
// ═══════════════════════════════════════════════════════════════
function IndustryCard({ image, title, problem, solution, stats }) {
  return (
    <motion.div
      className="industry-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
    >
      <div className="industry-card__media">
        <img src={image} alt={title} loading="lazy"/>
      </div>
      <div className="industry-card__body">
        <h3 className="industry-card__title">{title}</h3>
        <div className="industry-card__problem">
          <span className="industry-card__label">The Problem</span>
          <p>{problem}</p>
        </div>
        <div className="industry-card__solution">
          <span className="industry-card__label">Our Solution</span>
          <p>{solution}</p>
        </div>
        <div className="industry-card__stats">
          {stats.map((stat, i) => (
            <div key={i} className="industry-card__stat">
              <span className="industry-card__stat-value">{stat.value}</span>
              <span className="industry-card__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function LandingPage3() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const industries = [
    {
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
      title: 'Data Centers',
      problem: '19% of outages stem from cooling failures. Average cost: $700K.',
      solution: 'Thermal monitoring with 0.05°C sensitivity detects hotspots 72 hours early.',
      stats: [
        { value: '$700K', label: 'Avg Outage Cost' },
        { value: '72hrs', label: 'Early Detection' }
      ]
    },
    {
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
      title: 'Electric Utilities',
      problem: 'Ground crews miss 48% of defects. Helicopters cost $2,000+/hour.',
      solution: 'LiDAR at 2.4M points/sec. 60% cost reduction vs helicopter.',
      stats: [
        { value: '60%', label: 'Cost Reduction' },
        { value: '4.5x', label: 'More Defects' }
      ]
    },
    {
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80',
      title: 'Precision Agriculture',
      problem: 'Crop stress visible to eye only after 14+ days of damage.',
      solution: 'NDVI multispectral imaging detects stress 14 days earlier.',
      stats: [
        { value: '14 days', label: 'Earlier Detection' },
        { value: '150%', label: 'Proven ROI' }
      ]
    },
    {
      image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80',
      title: 'Oil & Gas',
      problem: 'EPA requires continuous methane monitoring. Manual inspection takes days.',
      solution: 'Optical Gas Imaging with 99.2% detection. 14km daily coverage.',
      stats: [
        { value: '99.2%', label: 'Detection Rate' },
        { value: '14km', label: 'Daily Coverage' }
      ]
    }
  ]

  return (
    <div className="page">
      {/* NAV */}
      <header className="nav">
        <div className="nav__inner">
          <a href="/" className="logo">
            <span className="logo__name">JINKI</span>
            <span className="logo__tag">INTELLIGENCE</span>
          </a>
          <nav className="nav__links">
            <a href="#industries">Industries</a>
            <a href="#platform">Platform</a>
            <a href="#advisory">Advisory</a>
          </nav>
          <a href="#contact" className="btn btn--primary">Get Started</a>
        </div>
      </header>

      {/* HERO */}
      <motion.section ref={heroRef} className="hero" style={{ opacity: heroOpacity }}>
        <div className="hero__bg"/>
        <div className="hero__content">
          <motion.span
            className="hero__tag"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Enterprise Drone Intelligence
          </motion.span>

          <motion.h1
            className="hero__title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Prevent<br/>
            <span className="hero__title-accent">Million-Dollar</span><br/>
            Failures
          </motion.h1>

          <motion.p
            className="hero__desc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Autonomous thermal intelligence for critical infrastructure.
            Detect anomalies 72 hours before catastrophic failure.
          </motion.p>

          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <a href="#contact" className="btn btn--primary btn--lg">Schedule Assessment</a>
            <a href="#industries" className="btn btn--secondary btn--lg">View Capabilities</a>
          </motion.div>

          <motion.div
            className="hero__stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Counter value="700" prefix="$" suffix="K" label="Avg Outage Prevented"/>
            <Counter value="72" suffix="hrs" label="Early Detection"/>
            <Counter value="94" suffix="%" label="Fault Accuracy"/>
            <Counter value="58" suffix="%" label="Cost Reduction"/>
          </motion.div>
        </div>

        <motion.div
          className="hero__visual"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <img
            src="https://www-cdn.djiits.com/cms/uploads/67bb8244fb64295b08f9186279ba5b35.png"
            alt="DJI Matrice 400 RTK"
            className="hero__drone"
          />
        </motion.div>
      </motion.section>

      {/* INDUSTRIES */}
      <section id="industries" className="industries">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Industry Solutions</h2>
          <p>Research-backed protocols for mission-critical infrastructure</p>
        </motion.div>

        <div className="industries__grid">
          {industries.map((industry, i) => (
            <IndustryCard key={i} {...industry}/>
          ))}
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="platform">
        <motion.div
          className="platform__content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Enterprise-Grade Platform</h2>
          <p className="platform__lead">
            Military-adjacent inspection technology. IP55 rated. 59-minute endurance. ±1cm RTK.
          </p>

          <div className="platform__features">
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
                className="platform__feature"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="platform__check">✓</span>
                {feature}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="platform__visual"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <img
            src="https://www-cdn.djiits.com/cms/uploads/67bb8244fb64295b08f9186279ba5b35.png"
            alt="Enterprise Drone Platform"
          />
        </motion.div>
      </section>

      {/* ADVISORY */}
      <section id="advisory" className="advisory">
        <motion.div
          className="advisory__content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Cyber & AI Advisory</h2>
          <p className="advisory__lead">Enterprise security architecture meets aerial intelligence</p>

          <div className="advisory__card">
            <div className="advisory__avatar">AA</div>
            <h3>Abdillahi A.</h3>
            <span className="advisory__role">Principal Security Architect</span>
            <p>
              Enterprise security architecture, AI governance, and risk management
              for critical infrastructure. Zero-trust frameworks and regulatory
              compliance for energy, utilities, and data center sectors.
            </p>
            <div className="advisory__creds">
              <span>CISSP</span>
              <span>CCSP</span>
              <span>AIGP</span>
              <span>PMP</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section id="contact" className="cta">
        <motion.div
          className="cta__inner"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Ready to Modernize Inspections?</h2>
          <p>Schedule a consultation. Prevent the next million-dollar outage.</p>
          <div className="cta__buttons">
            <a href="tel:+15551234567" className="btn btn--primary btn--lg">Call Now</a>
            <a href="mailto:contact@jinki.io" className="btn btn--secondary btn--lg">Email Us</a>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="footer__logo">JINKI INTELLIGENCE</span>
            <span className="footer__tagline">Autonomous Inspection. Intelligent Analysis.</span>
          </div>
          <span className="footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
