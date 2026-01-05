import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import './Mega3.css'

const ease = [0.25, 0.1, 0.25, 1]

// ═══════════════════════════════════════════════════════════════
// BREATHING BLOB - Organic morphing background element
// ═══════════════════════════════════════════════════════════════
function BreathingBlob({ className = '', delay = 0 }) {
  return (
    <svg className={`blob ${className}`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`blobGradient${delay}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3">
            <animate attributeName="stop-color"
              values="var(--color-primary);var(--color-secondary);var(--color-tertiary);var(--color-primary)"
              dur="8s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.2">
            <animate attributeName="stop-color"
              values="var(--color-secondary);var(--color-tertiary);var(--color-primary);var(--color-secondary)"
              dur="8s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <motion.path
        fill={`url(#blobGradient${delay})`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: delay * 0.2, ease }}
      >
        <animate
          attributeName="d"
          dur="12s"
          repeatCount="indefinite"
          values="
            M45,-65C58,-55,68,-43,72,-29C76,-15,74,1,69,15C64,29,56,41,45,51C34,61,20,69,4,71C-12,73,-28,69,-41,61C-54,53,-64,41,-70,26C-76,11,-78,-7,-74,-23C-70,-39,-60,-53,-47,-63C-34,-73,-17,-79,0,-79C17,-79,32,-75,45,-65Z;
            M52,-71C66,-62,75,-46,78,-29C81,-12,78,6,72,22C66,38,57,52,45,61C33,70,18,74,2,73C-14,72,-28,66,-41,57C-54,48,-66,36,-72,21C-78,6,-78,-12,-73,-28C-68,-44,-58,-58,-45,-67C-32,-76,-16,-80,1,-81C18,-82,38,-80,52,-71Z;
            M48,-68C61,-58,69,-43,73,-27C77,-11,77,6,72,21C67,36,57,49,45,58C33,67,19,72,3,70C-13,68,-26,60,-38,51C-50,42,-61,32,-67,18C-73,4,-74,-14,-69,-30C-64,-46,-53,-60,-40,-70C-27,-80,-13,-85,1,-86C15,-87,35,-78,48,-68Z;
            M45,-65C58,-55,68,-43,72,-29C76,-15,74,1,69,15C64,29,56,41,45,51C34,61,20,69,4,71C-12,73,-28,69,-41,61C-54,53,-64,41,-70,26C-76,11,-78,-7,-74,-23C-70,-39,-60,-53,-47,-63C-34,-73,-17,-79,0,-79C17,-79,32,-75,45,-65Z
          "
        />
      </motion.path>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// LIQUID WAVES - Flowing organic wave background
// ═══════════════════════════════════════════════════════════════
function LiquidWaves() {
  return (
    <div className="liquid-waves">
      {[0, 1, 2].map((i) => (
        <svg key={i} className={`wave wave--${i}`} viewBox="0 0 1200 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`waveGradient${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.1 + i * 0.05} />
              <stop offset="50%" stopColor="var(--color-secondary)" stopOpacity={0.15 + i * 0.05} />
              <stop offset="100%" stopColor="var(--color-tertiary)" stopOpacity={0.1 + i * 0.05} />
            </linearGradient>
          </defs>
          <path
            fill={`url(#waveGradient${i})`}
            d="M0,60 C300,90 600,30 900,60 C1200,90 1200,120 0,120 Z"
          >
            <animate
              attributeName="d"
              dur={`${15 + i * 3}s`}
              repeatCount="indefinite"
              values="
                M0,60 C300,90 600,30 900,60 C1200,90 1200,120 0,120 Z;
                M0,50 C300,20 600,80 900,50 C1200,20 1200,120 0,120 Z;
                M0,70 C300,100 600,40 900,70 C1200,100 1200,120 0,120 Z;
                M0,60 C300,90 600,30 900,60 C1200,90 1200,120 0,120 Z
              "
            />
          </path>
        </svg>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ORGANIC EYE - Flowing liquid eye visualization
// ═══════════════════════════════════════════════════════════════
function OrganicEye() {
  return (
    <div className="organic-eye">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="eyeGradient">
            <stop offset="0%" stopColor="var(--color-glow)" stopOpacity="0.8">
              <animate attributeName="stop-opacity" values="0.8;1;0.8" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.6">
              <animate attributeName="stop-opacity" values="0.6;0.8;0.6" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.2" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer eye shape - breathing */}
        <ellipse cx="100" cy="100" rx="80" ry="50" fill="none" stroke="var(--color-primary)" strokeWidth="2" opacity="0.4" filter="url(#glow)">
          <animate attributeName="rx" values="80;85;80" dur="6s" repeatCount="indefinite" />
          <animate attributeName="ry" values="50;55;50" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.6;0.4" dur="6s" repeatCount="indefinite" />
        </ellipse>

        {/* Middle layer */}
        <ellipse cx="100" cy="100" rx="60" ry="40" fill="url(#eyeGradient)" opacity="0.5">
          <animate attributeName="rx" values="60;65;60" dur="5s" repeatCount="indefinite" />
          <animate attributeName="ry" values="40;43;40" dur="5s" repeatCount="indefinite" />
        </ellipse>

        {/* Iris - morphing blob */}
        <path fill="var(--color-secondary)" opacity="0.7" filter="url(#glow)">
          <animate
            attributeName="d"
            dur="8s"
            repeatCount="indefinite"
            values="
              M100,70 Q115,80 110,95 Q105,110 100,110 Q95,110 90,95 Q85,80 100,70Z;
              M100,68 Q117,78 112,95 Q107,112 100,112 Q93,112 88,95 Q83,78 100,68Z;
              M100,70 Q115,80 110,95 Q105,110 100,110 Q95,110 90,95 Q85,80 100,70Z
            "
          />
        </path>

        {/* Pupil - pulsing */}
        <circle cx="100" cy="92" r="12" fill="var(--color-dark)">
          <animate attributeName="r" values="12;14;12" dur="4s" repeatCount="indefinite" />
          <animate attributeName="cy" values="92;90;92" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Highlight */}
        <circle cx="105" cy="88" r="4" fill="var(--color-glow)" opacity="0.9">
          <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
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
// FADE UP ANIMATION
// ═══════════════════════════════════════════════════════════════
function FadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════════
function Counter({ value, suffix = '', prefix = '', label }) {
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
    }
    tick()
  }, [inView, value])

  return (
    <div ref={ref} className="stat">
      <div className="stat__blob"></div>
      <span className="stat__value">{prefix}{display}{suffix}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ORGANIC CARD - Flowing card with blob hover effects
// ═══════════════════════════════════════════════════════════════
function OrganicCard({ image, title, problem, solution, stats, index }) {
  const ref = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })
  const y = useTransform(scrollYProgress, [0, 1], [60, -60])
  const smoothY = useSpring(y, { stiffness: 80, damping: 25 })

  return (
    <motion.div
      ref={ref}
      className="organic-card"
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 1, delay: index * 0.15, ease }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="organic-card__blob-bg">
        <BreathingBlob delay={index} />
      </div>

      <motion.div className="organic-card__image" style={{ y: smoothY }}>
        <div className="organic-card__image-wrapper">
          <motion.img
            src={image}
            alt={title}
            loading="lazy"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.8, ease }}
          />
        </div>
      </motion.div>

      <div className="organic-card__content">
        <h3>{title}</h3>
        <div className="organic-card__section">
          <span className="organic-card__label">Challenge</span>
          <p>{problem}</p>
        </div>
        <div className="organic-card__section">
          <span className="organic-card__label">Solution</span>
          <p>{solution}</p>
        </div>
        <div className="organic-card__stats">
          {stats.map((stat, i) => (
            <div key={i} className="organic-card__stat">
              <span className="organic-card__stat-value">{stat.value}</span>
              <span className="organic-card__stat-label">{stat.label}</span>
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
export default function Mega3() {
  useSmoothScroll()

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96])
  const eyeY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const eyeScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

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
    <div className="organic-page">
      {/* Organic Background Elements */}
      <div className="organic-bg">
        <LiquidWaves />
        <BreathingBlob className="blob--bg blob--1" delay={0} />
        <BreathingBlob className="blob--bg blob--2" delay={1} />
        <BreathingBlob className="blob--bg blob--3" delay={2} />
      </div>

      {/* Navigation */}
      <motion.header
        className="organic-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease }}
      >
        <div className="organic-nav__inner">
          <a href="/" className="organic-nav__logo">
            <div className="organic-nav__logo-blob"></div>
            <span className="organic-nav__logo-text">JINKI</span>
          </a>
          <nav className="organic-nav__links">
            <a href="#industries">Industries</a>
            <a href="#platform">Platform</a>
            <a href="#advisory">Advisory</a>
          </nav>
          <a href="#contact" className="organic-btn organic-btn--primary">Get Started</a>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="organic-hero">
        <motion.div
          className="organic-hero__eye"
          style={{ y: eyeY, scale: eyeScale }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3, ease }}
        >
          <OrganicEye />
        </motion.div>

        <motion.div
          className="organic-hero__content"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          <motion.p
            className="organic-hero__tagline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease }}
          >
            Ex Alto Omnia
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1, ease }}
          >
            From Above, <span className="organic-gradient-text">All Things</span>
          </motion.h1>

          <motion.p
            className="organic-hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.2, ease }}
          >
            Autonomous aerial intelligence for critical infrastructure.<br/>
            Detect anomalies before catastrophic failure.
          </motion.p>

          <motion.div
            className="organic-hero__actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.4, ease }}
          >
            <a href="#contact" className="organic-btn organic-btn--primary organic-btn--lg">Schedule Assessment</a>
            <a href="#industries" className="organic-btn organic-btn--ghost organic-btn--lg">Explore Solutions</a>
          </motion.div>
        </motion.div>

        <motion.div
          className="organic-hero__stats"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.6, ease }}
        >
          <Counter value="700" prefix="$" suffix="K" label="Avg Outage Prevented"/>
          <Counter value="72" suffix="hrs" label="Early Detection"/>
          <Counter value="94" suffix="%" label="Fault Accuracy"/>
          <Counter value="58" suffix="%" label="Cost Reduction"/>
        </motion.div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="organic-section">
        <FadeUp className="organic-section__header">
          <p className="organic-section__eyebrow">Solutions</p>
          <h2>Critical Infrastructure Intelligence</h2>
          <p className="organic-section__subtitle">Research-backed aerial protocols trusted by industry leaders</p>
        </FadeUp>

        <div className="organic-cards">
          {industries.map((industry, i) => (
            <OrganicCard key={i} {...industry} index={i}/>
          ))}
        </div>
      </section>

      {/* Platform Section */}
      <section id="platform" className="organic-section organic-section--platform">
        <div className="organic-platform">
          <FadeUp className="organic-platform__text">
            <p className="organic-section__eyebrow">Technology</p>
            <h2>Enterprise-Grade Platform</h2>
            <p className="organic-platform__lead">
              Military-adjacent inspection technology. IP55 rated for all-weather.
              Redundant flight systems. 59-minute endurance.
            </p>
            <div className="organic-features">
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
                  className="organic-feature"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease }}
                >
                  <span className="organic-feature__blob"></span>
                  <span className="organic-feature__text">{f}</span>
                </motion.div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.3} className="organic-platform__visual">
            <div className="organic-platform__blob-container">
              <BreathingBlob delay={0} />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Advisory Section */}
      <section id="advisory" className="organic-section">
        <FadeUp className="organic-section__header">
          <p className="organic-section__eyebrow">Advisory</p>
          <h2>Cyber & AI Expertise</h2>
          <p className="organic-section__subtitle">Enterprise security architecture meets aerial intelligence</p>
        </FadeUp>

        <FadeUp delay={0.2} className="organic-advisor">
          <div className="organic-advisor__avatar">
            <div className="organic-advisor__blob"></div>
          </div>
          <h3>Abdillahi A.</h3>
          <p className="organic-advisor__role">Principal Security Architect</p>
          <p className="organic-advisor__bio">
            Enterprise security architecture, AI governance, and risk management
            for critical infrastructure. Zero-trust frameworks and regulatory
            compliance for energy, utilities, and data center sectors.
          </p>
          <div className="organic-advisor__certs">
            {['CISSP', 'CCSP', 'AIGP', 'PMP'].map(c => (
              <span key={c} className="organic-cert">{c}</span>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* CTA Section */}
      <section id="contact" className="organic-section organic-section--cta">
        <FadeUp className="organic-cta">
          <div className="organic-cta__blob-container">
            <BreathingBlob delay={0} />
          </div>
          <h2>Ready to See Everything?</h2>
          <p className="organic-cta__tagline">Ex Alto Omnia — From Above, All Things</p>
          <p>Schedule a consultation. Prevent the next million-dollar outage.</p>
          <div className="organic-cta__actions">
            <a href="tel:+15551234567" className="organic-btn organic-btn--primary organic-btn--lg">Call Now</a>
            <a href="mailto:contact@jinki.io" className="organic-btn organic-btn--ghost organic-btn--lg">Email Us</a>
          </div>
        </FadeUp>
      </section>

      {/* Footer */}
      <footer className="organic-footer">
        <div className="organic-footer__inner">
          <div className="organic-footer__brand">
            <span className="organic-footer__logo">JINKI INTELLIGENCE</span>
            <span className="organic-footer__tagline">Ex Alto Omnia</span>
          </div>
          <span className="organic-footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
