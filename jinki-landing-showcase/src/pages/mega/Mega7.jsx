import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import './Mega7.css'

// Editorial ease
const ease = [0.25, 0.1, 0.25, 1]

function useSmoothScroll() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
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
    <div ref={ref} className="m7-stat">
      <div className="m7-stat__value">{prefix}{display}{suffix}</div>
      <div className="m7-stat__label">{label}</div>
    </div>
  )
}

function EditorialFade({ children, delay = 0, className = '' }) {
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

function IndustryFeature({ image, title, kicker, lede, body, pullquote, stats, index }) {
  const imgRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: imgRef,
    offset: ['start end', 'end start']
  })
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 0.95])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.5, 1, 1, 0.7])

  return (
    <EditorialFade delay={index * 0.1} className="m7-feature">
      <div className="m7-feature__grid">
        {/* Hero Image - Magazine style */}
        <div className="m7-feature__image-wrapper" ref={imgRef}>
          <motion.div
            className="m7-feature__image"
            style={{ scale }}
          >
            <motion.img
              src={image}
              alt={title}
              style={{ opacity }}
            />
            <div className="m7-feature__image-overlay" />
          </motion.div>
          <div className="m7-feature__caption">
            <span className="m7-caption__credit">Photography: Unsplash</span>
          </div>
        </div>

        {/* Editorial Content */}
        <div className="m7-feature__content">
          <div className="m7-feature__kicker">{kicker}</div>
          <h2 className="m7-feature__title">{title}</h2>
          <p className="m7-feature__lede">{lede}</p>

          <div className="m7-feature__body">
            {body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {/* Pull Quote */}
          <div className="m7-pullquote">
            <div className="m7-pullquote__mark">"</div>
            <div className="m7-pullquote__text">{pullquote}</div>
          </div>

          {/* Stats Sidebar */}
          <div className="m7-feature__stats">
            <div className="m7-stats__header">By the Numbers</div>
            {stats.map((stat, i) => (
              <div key={i} className="m7-stats__item">
                <div className="m7-stats__value">{stat.value}</div>
                <div className="m7-stats__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </EditorialFade>
  )
}

export default function Mega7() {
  useSmoothScroll()

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const industries = [
    {
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
      kicker: 'Data Centers',
      title: 'The $700,000 Question',
      lede: 'How thermal anomalies three days from now could bankrupt your operation tomorrow.',
      body: [
        'Industry data reveals a stark reality: 19% of data center outages stem from cooling system failures. The average cost of downtime? $700,000. For hyperscale facilities, that number climbs into the millions.',
        'Traditional monitoring catches problems when equipment fails. By then, the damage is done. Jinki\'s autonomous thermal imaging detects temperature anomalies with 0.05°C sensitivity—identifying hotspots 72 hours before catastrophic failure.'
      ],
      pullquote: '72 hours of advance warning transforms crisis management into preventive maintenance.',
      stats: [
        { value: '$700K', label: 'Average outage cost' },
        { value: '19%', label: 'Cooling-related failures' },
        { value: '0.05°C', label: 'Thermal sensitivity' },
        { value: '72hrs', label: 'Early detection window' }
      ]
    },
    {
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80',
      kicker: 'Electric Utilities',
      title: 'Seeing What Ground Crews Cannot',
      lede: 'LiDAR technology at 2.4 million points per second is rewriting the economics of grid inspection.',
      body: [
        'Manual ground inspections miss nearly half of all line defects. Helicopter surveys cost upwards of $2,000 per hour and remain weather-dependent. The industry needed a paradigm shift.',
        'Enter autonomous aerial LiDAR: 2.4 million measurements per second, capturing sub-centimeter details from 400 feet. The result? 60% cost reduction versus helicopters, with 4.5 times the defect detection rate.'
      ],
      pullquote: 'When missing half of defects is the baseline, the only direction is up.',
      stats: [
        { value: '48%', label: 'Defects missed by ground crews' },
        { value: '$2,000+', label: 'Helicopter cost per hour' },
        { value: '2.4M', label: 'LiDAR points per second' },
        { value: '60%', label: 'Cost reduction achieved' }
      ]
    },
    {
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&q=80',
      kicker: 'Precision Agriculture',
      title: 'Two Weeks Too Late',
      lede: 'By the time crop stress is visible to the human eye, yield loss is already irreversible.',
      body: [
        'Agricultural economics are unforgiving. When stress symptoms appear to the naked eye, the crop has already endured 14+ days of damage. Water stress, nutrient deficiency, disease—all invisible until it\'s too late.',
        'NDVI multispectral imaging reveals what eyes cannot see. Normalized Difference Vegetation Index mapping detects chlorophyll variations invisible to human perception, providing 14 days of lead time for intervention.'
      ],
      pullquote: 'The difference between profit and loss is measured in days, not weeks.',
      stats: [
        { value: '14+ days', label: 'Damage before visible signs' },
        { value: '14 days', label: 'Earlier detection via NDVI' },
        { value: '150%', label: 'Documented ROI' },
        { value: '99.3%', label: 'Stress detection accuracy' }
      ]
    },
    {
      image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=1200&q=80',
      kicker: 'Oil & Gas',
      title: 'The Invisible Leak',
      lede: 'EPA mandates are forcing the industry to see emissions invisible to conventional cameras.',
      body: [
        'Methane leaks are both an environmental catastrophe and regulatory liability. EPA requirements demand continuous monitoring across thousands of miles of pipeline. Manual inspection teams can cover perhaps 2-3 kilometers per day.',
        'Optical Gas Imaging (OGI) cameras visualize methane and VOC emissions invisible to standard optics. Mounted on autonomous platforms with 99.2% detection accuracy, operations now cover 14 kilometers daily—all documented for regulatory compliance.'
      ],
      pullquote: 'You cannot fix what you cannot see. Now you can see everything.',
      stats: [
        { value: '99.2%', label: 'Methane detection rate' },
        { value: '14km', label: 'Daily coverage area' },
        { value: '7x', label: 'Faster than manual' },
        { value: '100%', label: 'Regulatory compliance' }
      ]
    }
  ]

  return (
    <div className="m7-page">
      {/* Masthead */}
      <motion.header
        className="m7-masthead"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="m7-masthead__inner">
          <div className="m7-masthead__left">
            <div className="m7-masthead__date">January 2026</div>
            <div className="m7-masthead__divider" />
            <div className="m7-masthead__section">Critical Infrastructure Intelligence</div>
          </div>
          <div className="m7-masthead__brand">
            <div className="m7-masthead__logo">JINKI QUARTERLY</div>
          </div>
          <div className="m7-masthead__right">
            <a href="#subscribe" className="m7-masthead__link">Subscribe</a>
            <a href="#archive" className="m7-masthead__link">Archive</a>
          </div>
        </div>
        <div className="m7-masthead__rule" />
      </motion.header>

      {/* Hero - Front Page Editorial */}
      <section ref={heroRef} className="m7-hero">
        <motion.div
          className="m7-hero__content"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <div className="m7-hero__grid">
            {/* Main Story */}
            <div className="m7-hero__main">
              <motion.div
                className="m7-hero__kicker"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease }}
              >
                Special Report
              </motion.div>

              <motion.h1
                className="m7-hero__headline"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease }}
              >
                Ex Alto Omnia
              </motion.h1>

              <motion.h2
                className="m7-hero__deck"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.7, ease }}
              >
                How Autonomous Aerial Intelligence Is Preventing Catastrophic Infrastructure Failures Before They Happen
              </motion.h2>

              <motion.div
                className="m7-hero__byline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1, ease }}
              >
                <span className="m7-byline__author">By Jinki Intelligence Research Division</span>
                <span className="m7-byline__divider">|</span>
                <span className="m7-byline__date">January 5, 2026</span>
              </motion.div>

              <motion.div
                className="m7-hero__lede"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.2, ease }}
              >
                <p className="m7-lede__dropcap">
                  From above, everything becomes clear. A thermal anomaly invisible to ground crews.
                  A hairline fracture in a transmission tower. Crop stress fourteen days before the
                  human eye can detect it. In critical infrastructure, the difference between seeing
                  and not seeing is measured in millions of dollars—and sometimes, lives.
                </p>
                <p>
                  This is the promise of autonomous aerial intelligence: not just surveillance,
                  but prediction. Not just monitoring, but prevention. As industries face mounting
                  pressure to maintain aging infrastructure with shrinking budgets, the question
                  is no longer whether to adopt these technologies, but how quickly.
                </p>
              </motion.div>
            </div>

            {/* Sidebar */}
            <motion.aside
              className="m7-hero__sidebar"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.4, ease }}
            >
              <div className="m7-sidebar__section">
                <div className="m7-sidebar__header">In This Issue</div>
                <nav className="m7-sidebar__nav">
                  <a href="#data-centers">The $700,000 Question</a>
                  <a href="#utilities">Seeing What Ground Crews Cannot</a>
                  <a href="#agriculture">Two Weeks Too Late</a>
                  <a href="#oil-gas">The Invisible Leak</a>
                </nav>
              </div>

              <div className="m7-sidebar__section">
                <div className="m7-sidebar__header">Key Figures</div>
                <div className="m7-sidebar__stats">
                  <Counter value="700" prefix="$" suffix="K" label="Avg Outage Prevented" />
                  <Counter value="72" suffix="hrs" label="Early Detection" />
                  <Counter value="94" suffix="%" label="Fault Accuracy" />
                  <Counter value="58" suffix="%" label="Cost Reduction" />
                </div>
              </div>

              <div className="m7-callout">
                <div className="m7-callout__header">From the Editor</div>
                <p>
                  "The most expensive moment in infrastructure management is the one
                  just before failure. This report examines how seeing everything from
                  above has become the competitive advantage."
                </p>
                <div className="m7-callout__signature">— Editorial Board</div>
              </div>
            </motion.aside>
          </div>
        </motion.div>
      </section>

      {/* Features - Magazine Layout */}
      <section className="m7-features">
        <div className="m7-features__container">
          {industries.map((industry, i) => (
            <IndustryFeature key={i} {...industry} index={i} />
          ))}
        </div>
      </section>

      {/* Platform - Technical Specifications */}
      <section className="m7-platform">
        <EditorialFade className="m7-platform__header">
          <div className="m7-section__kicker">Technology</div>
          <h2 className="m7-section__title">Enterprise-Grade Platform</h2>
          <p className="m7-section__subtitle">
            Military-adjacent inspection technology. IP55 rated for all-weather operations.
            Redundant flight systems. 59-minute endurance.
          </p>
        </EditorialFade>

        <EditorialFade delay={0.2} className="m7-platform__grid">
          <div className="m7-platform__specs">
            <div className="m7-spec">
              <div className="m7-spec__label">Thermal Imaging</div>
              <div className="m7-spec__value">0.05°C Sensitivity</div>
              <p className="m7-spec__detail">
                Detection of minute temperature variations 72 hours before equipment failure
              </p>
            </div>
            <div className="m7-spec">
              <div className="m7-spec__label">LiDAR Scanning</div>
              <div className="m7-spec__value">2.4M pts/sec</div>
              <p className="m7-spec__detail">
                Sub-centimeter accuracy for structural defect identification
              </p>
            </div>
            <div className="m7-spec">
              <div className="m7-spec__label">Weatherization</div>
              <div className="m7-spec__value">IP55 Sealed</div>
              <p className="m7-spec__detail">
                All-weather operation in rain, snow, and extreme temperatures
              </p>
            </div>
            <div className="m7-spec">
              <div className="m7-spec__label">Flight Time</div>
              <div className="m7-spec__value">59 Minutes</div>
              <p className="m7-spec__detail">
                Extended endurance with redundant power and navigation systems
              </p>
            </div>
            <div className="m7-spec">
              <div className="m7-spec__label">Transmission</div>
              <div className="m7-spec__value">20km Range</div>
              <p className="m7-spec__detail">
                Long-range encrypted video and telemetry transmission
              </p>
            </div>
            <div className="m7-spec">
              <div className="m7-spec__label">Positioning</div>
              <div className="m7-spec__value">±1cm RTK</div>
              <p className="m7-spec__detail">
                Real-Time Kinematic GPS for precise geo-referencing
              </p>
            </div>
          </div>

          <div className="m7-platform__quote">
            <div className="m7-blockquote">
              <div className="m7-blockquote__text">
                The platform combines military-grade reliability with commercial scalability.
                Every component is redundant. Every sensor is calibrated. Every flight is documented.
              </div>
              <div className="m7-blockquote__attribution">
                <div className="m7-attribution__name">Abdillahi A.</div>
                <div className="m7-attribution__title">Principal Security Architect</div>
                <div className="m7-attribution__creds">CISSP, CCSP, AIGP, PMP</div>
              </div>
            </div>
          </div>
        </EditorialFade>
      </section>

      {/* Advisory - Profile Layout */}
      <section className="m7-advisory">
        <EditorialFade className="m7-advisory__content">
          <div className="m7-section__kicker">Leadership</div>
          <h2 className="m7-section__title">Cyber & AI Expertise</h2>

          <div className="m7-profile">
            <div className="m7-profile__text">
              <h3 className="m7-profile__name">Abdillahi A.</h3>
              <div className="m7-profile__role">Principal Security Architect</div>

              <div className="m7-profile__bio">
                <p>
                  Enterprise security architecture, AI governance, and risk management for critical
                  infrastructure. Specializes in zero-trust frameworks and regulatory compliance for
                  energy, utilities, and data center sectors.
                </p>
                <p>
                  With extensive experience architecting security solutions for Fortune 500 operations,
                  Abdillahi brings military-grade cybersecurity principles to autonomous aerial systems.
                  His work ensures that every data transmission, every sensor reading, and every flight
                  log meets the highest standards of security and auditability.
                </p>
              </div>

              <div className="m7-profile__credentials">
                <div className="m7-credentials__header">Certifications</div>
                <div className="m7-credentials__list">
                  <span className="m7-credential">CISSP</span>
                  <span className="m7-credential">CCSP</span>
                  <span className="m7-credential">AIGP</span>
                  <span className="m7-credential">PMP</span>
                </div>
              </div>
            </div>

            <div className="m7-profile__sidebar">
              <div className="m7-profile__highlight">
                <div className="m7-highlight__quote">
                  "Security is not a feature. It's the foundation upon which everything else is built."
                </div>
              </div>

              <div className="m7-profile__expertise">
                <div className="m7-expertise__header">Focus Areas</div>
                <ul className="m7-expertise__list">
                  <li>Zero-Trust Architecture</li>
                  <li>AI Governance Frameworks</li>
                  <li>Critical Infrastructure Security</li>
                  <li>Regulatory Compliance</li>
                  <li>Risk Management</li>
                </ul>
              </div>
            </div>
          </div>
        </EditorialFade>
      </section>

      {/* CTA - Editorial Call to Action */}
      <section className="m7-cta">
        <EditorialFade className="m7-cta__content">
          <div className="m7-cta__rule" />
          <h2 className="m7-cta__headline">Schedule Your Infrastructure Assessment</h2>
          <p className="m7-cta__deck">
            Prevent the next million-dollar outage. See everything from above.
          </p>
          <div className="m7-cta__actions">
            <a href="tel:+15551234567" className="m7-btn m7-btn--primary">Call Now</a>
            <a href="mailto:contact@jinki.io" className="m7-btn m7-btn--secondary">Email Inquiry</a>
          </div>
          <div className="m7-cta__tagline">Ex Alto Omnia — From Above, All Things</div>
        </EditorialFade>
      </section>

      {/* Footer - Magazine Colophon */}
      <footer className="m7-footer">
        <div className="m7-footer__rule" />
        <div className="m7-footer__inner">
          <div className="m7-footer__brand">
            <div className="m7-footer__logo">JINKI QUARTERLY</div>
            <div className="m7-footer__tagline">Intelligence From Above</div>
          </div>
          <div className="m7-footer__meta">
            <span>Vol. 1, No. 1</span>
            <span className="m7-footer__divider">|</span>
            <span>January 2026</span>
            <span className="m7-footer__divider">|</span>
            <span>© 2026 Jinki Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
