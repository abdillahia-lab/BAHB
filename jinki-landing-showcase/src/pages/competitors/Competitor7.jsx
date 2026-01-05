import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import './Competitor7.css'

const ease = [0.25, 0.1, 0.25, 1]

// 3D Rotating Cube Component
function RotatingCube({ children, speed = 20 }) {
  return (
    <div className="cube-container">
      <div className="cube" style={{ '--rotation-speed': `${speed}s` }}>
        <div className="cube__face cube__face--front">{children}</div>
        <div className="cube__face cube__face--back">{children}</div>
        <div className="cube__face cube__face--right">{children}</div>
        <div className="cube__face cube__face--left">{children}</div>
        <div className="cube__face cube__face--top">{children}</div>
        <div className="cube__face cube__face--bottom">{children}</div>
      </div>
    </div>
  )
}

// 3D Isometric Eye Platform
function IsometricEyePlatform() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="iso-platform">
      <motion.div
        className="iso-platform__scene"
        style={{
          rotateX: mousePos.y + 25,
          rotateY: mousePos.x,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      >
        {/* Platform layers */}
        <div className="iso-layer iso-layer--base"></div>
        <div className="iso-layer iso-layer--mid"></div>
        <div className="iso-layer iso-layer--top">
          {/* Cyber Eye */}
          <div className="cyber-eye">
            <div className="cyber-eye__outer">
              <div className="cyber-eye__ring cyber-eye__ring--1"></div>
              <div className="cyber-eye__ring cyber-eye__ring--2"></div>
              <div className="cyber-eye__ring cyber-eye__ring--3"></div>
              <div className="cyber-eye__core">
                <div className="cyber-eye__pupil"></div>
              </div>
            </div>
          </div>
        </div>
        {/* Floating data points */}
        <div className="data-point data-point--1" style={{ '--z': '100px', '--delay': '0s' }}>◉</div>
        <div className="data-point data-point--2" style={{ '--z': '150px', '--delay': '0.5s' }}>◉</div>
        <div className="data-point data-point--3" style={{ '--z': '120px', '--delay': '1s' }}>◉</div>
        <div className="data-point data-point--4" style={{ '--z': '180px', '--delay': '1.5s' }}>◉</div>
      </motion.div>
    </div>
  )
}

// Smooth scroll hook
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

// Fade up animation component
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

// 3D Floating Counter
function FloatingCounter({ value, suffix = '', prefix = '', label, zIndex }) {
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
    <div ref={ref} className="floating-stat" style={{ '--z-depth': `${zIndex}px` }}>
      <div className="floating-stat__inner">
        <span className="floating-stat__value">{prefix}{display}{suffix}</span>
        <span className="floating-stat__label">{label}</span>
      </div>
    </div>
  )
}

// 3D Card with rotation on hover
function Card3D({ image, title, problem, solution, stats, index }) {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef(null)

  return (
    <motion.div
      ref={ref}
      className="card-3d"
      initial={{ opacity: 0, z: -200, rotateX: 45 }}
      whileInView={{ opacity: 1, z: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, delay: index * 0.1, ease }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="card-3d__inner"
        animate={{
          rotateY: isHovered ? 8 : 0,
          rotateX: isHovered ? -5 : 0,
          z: isHovered ? 50 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="card-3d__shine"></div>
        <div className="card-3d__image">
          <img src={image} alt={title} loading="lazy"/>
        </div>
        <div className="card-3d__content">
          <h3>{title}</h3>
          <div className="card-3d__section">
            <span className="card-3d__label">Challenge</span>
            <p>{problem}</p>
          </div>
          <div className="card-3d__section">
            <span className="card-3d__label">Solution</span>
            <p>{solution}</p>
          </div>
          <div className="card-3d__stats">
            {stats.map((stat, i) => (
              <div key={i} className="card-3d__stat">
                <span className="card-3d__stat-value">{stat.value}</span>
                <span className="card-3d__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Isometric Feature Blocks
function IsometricFeature({ icon, text, delay }) {
  return (
    <motion.div
      className="iso-feature"
      initial={{ opacity: 0, z: -100, rotateX: 45 }}
      whileInView={{ opacity: 1, z: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease }}
    >
      <div className="iso-feature__block">
        <div className="iso-feature__face iso-feature__face--top">{icon}</div>
        <div className="iso-feature__face iso-feature__face--left"></div>
        <div className="iso-feature__face iso-feature__face--right"></div>
      </div>
      <span className="iso-feature__text">{text}</span>
    </motion.div>
  )
}

export default function Competitor7() {
  useSmoothScroll()

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const gridRotate = useTransform(scrollYProgress, [0, 1], [0, 10])

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
    <div className="spatial-page">
      {/* 3D Perspective Grid Background */}
      <div className="perspective-grid">
        <motion.div className="perspective-grid__lines" style={{ rotateX: gridRotate }} />
      </div>

      {/* NAV with depth */}
      <motion.header
        className="spatial-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="spatial-nav__inner">
          <a href="/" className="spatial-nav__logo">
            <div className="logo-cube">
              <RotatingCube speed={15}>
                <span className="logo-cube__text">J</span>
              </RotatingCube>
            </div>
            <span className="spatial-nav__text">JINKI</span>
          </a>
          <nav className="spatial-nav__links">
            <a href="#industries">Industries</a>
            <a href="#platform">Platform</a>
            <a href="#advisory">Advisory</a>
          </nav>
          <a href="#contact" className="btn-3d">Get Started</a>
        </div>
      </motion.header>

      {/* HERO with 3D Isometric Platform */}
      <section ref={heroRef} className="spatial-hero">
        <motion.div className="spatial-hero__content" style={{ y: heroY }}>
          <motion.p
            className="spatial-hero__tagline"
            initial={{ opacity: 0, z: -100 }}
            animate={{ opacity: 1, z: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
          >
            Ex Alto Omnia
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, z: -150 }}
            animate={{ opacity: 1, z: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease }}
          >
            From Above, <span className="gradient-text">All Things</span>
          </motion.h1>

          <motion.p
            className="spatial-hero__subtitle"
            initial={{ opacity: 0, z: -100 }}
            animate={{ opacity: 1, z: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease }}
          >
            Autonomous aerial intelligence for critical infrastructure.<br/>
            Detect anomalies before catastrophic failure.
          </motion.p>

          <motion.div
            className="spatial-hero__actions"
            initial={{ opacity: 0, z: -100 }}
            animate={{ opacity: 1, z: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease }}
          >
            <a href="#contact" className="btn-3d btn-3d--primary">Schedule Assessment</a>
            <a href="#industries" className="btn-3d btn-3d--ghost">Explore Solutions</a>
          </motion.div>
        </motion.div>

        {/* 3D Isometric Eye Platform */}
        <motion.div
          className="spatial-hero__platform"
          initial={{ opacity: 0, scale: 0.8, rotateX: 60 }}
          animate={{ opacity: 1, scale: 1, rotateX: 25 }}
          transition={{ duration: 1.2, delay: 0.4, ease }}
        >
          <IsometricEyePlatform />
        </motion.div>

        {/* Floating Stats in 3D Space */}
        <motion.div
          className="spatial-hero__stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2, ease }}
        >
          <FloatingCounter value="700" prefix="$" suffix="K" label="Avg Outage Prevented" zIndex={50} />
          <FloatingCounter value="72" suffix="hrs" label="Early Detection" zIndex={100} />
          <FloatingCounter value="94" suffix="%" label="Fault Accuracy" zIndex={75} />
          <FloatingCounter value="58" suffix="%" label="Cost Reduction" zIndex={125} />
        </motion.div>
      </section>

      {/* INDUSTRIES - 3D Rotating Cards */}
      <section id="industries" className="spatial-section">
        <FadeUp className="spatial-section__header">
          <p className="spatial-section__eyebrow">Solutions</p>
          <h2>Critical Infrastructure Intelligence</h2>
          <p className="spatial-section__subtitle">Research-backed aerial protocols trusted by industry leaders</p>
        </FadeUp>

        <div className="cards-3d">
          {industries.map((industry, i) => (
            <Card3D key={i} {...industry} index={i}/>
          ))}
        </div>
      </section>

      {/* PLATFORM - Isometric View */}
      <section id="platform" className="spatial-section spatial-section--dark">
        <div className="spatial-platform">
          <FadeUp className="spatial-platform__text">
            <p className="spatial-section__eyebrow">Technology</p>
            <h2>Enterprise-Grade Platform</h2>
            <p className="spatial-platform__lead">
              Military-adjacent inspection technology. IP55 rated for all-weather.
              Redundant flight systems. 59-minute endurance.
            </p>
            <div className="iso-features">
              {[
                { icon: '◉', text: '0.05°C Thermal Sensitivity' },
                { icon: '◉', text: 'LiDAR @ 2.4M pts/sec' },
                { icon: '◉', text: 'IP55 Weather Sealed' },
                { icon: '◉', text: 'Redundant Flight Systems' },
                { icon: '◉', text: '20km Transmission Range' },
                { icon: '◉', text: '±1cm RTK Accuracy' }
              ].map((f, i) => (
                <IsometricFeature key={i} icon={f.icon} text={f.text} delay={i * 0.08} />
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.2} className="spatial-platform__visual">
            <div className="platform-cube-stack">
              <div className="cube-stack">
                <div className="cube-stack__cube cube-stack__cube--1">
                  <div className="cube-stack__face cube-stack__face--front">THERMAL</div>
                  <div className="cube-stack__face cube-stack__face--top"></div>
                  <div className="cube-stack__face cube-stack__face--right"></div>
                </div>
                <div className="cube-stack__cube cube-stack__cube--2">
                  <div className="cube-stack__face cube-stack__face--front">LiDAR</div>
                  <div className="cube-stack__face cube-stack__face--top"></div>
                  <div className="cube-stack__face cube-stack__face--right"></div>
                </div>
                <div className="cube-stack__cube cube-stack__cube--3">
                  <div className="cube-stack__face cube-stack__face--front">NDVI</div>
                  <div className="cube-stack__face cube-stack__face--top"></div>
                  <div className="cube-stack__face cube-stack__face--right"></div>
                </div>
                <div className="cube-stack__cube cube-stack__cube--4">
                  <div className="cube-stack__face cube-stack__face--front">OGI</div>
                  <div className="cube-stack__face cube-stack__face--top"></div>
                  <div className="cube-stack__face cube-stack__face--right"></div>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ADVISORY - 3D Card */}
      <section id="advisory" className="spatial-section">
        <FadeUp className="spatial-section__header">
          <p className="spatial-section__eyebrow">Advisory</p>
          <h2>Cyber & AI Expertise</h2>
          <p className="spatial-section__subtitle">Enterprise security architecture meets aerial intelligence</p>
        </FadeUp>

        <FadeUp delay={0.2} className="advisor-3d">
          <div className="advisor-3d__card">
            <div className="advisor-3d__avatar">
              <div className="avatar-cube">
                <div className="avatar-cube__icon">◉</div>
              </div>
            </div>
            <h3>Abdillahi A.</h3>
            <p className="advisor-3d__role">Principal Security Architect</p>
            <p className="advisor-3d__bio">
              Enterprise security architecture, AI governance, and risk management
              for critical infrastructure. Zero-trust frameworks and regulatory
              compliance for energy, utilities, and data center sectors.
            </p>
            <div className="advisor-3d__certs">
              {['CISSP', 'CCSP', 'AIGP', 'PMP'].map(c => (
                <span key={c} className="cert-3d">{c}</span>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>

      {/* CTA - 3D Floating */}
      <section id="contact" className="spatial-section spatial-section--cta">
        <FadeUp className="cta-3d">
          <div className="cta-3d__icon">
            <RotatingCube speed={12}>
              <div className="cta-cube-icon">◉</div>
            </RotatingCube>
          </div>
          <h2>Ready to See Everything?</h2>
          <p className="cta-3d__tagline">Ex Alto Omnia — From Above, All Things</p>
          <p>Schedule a consultation. Prevent the next million-dollar outage.</p>
          <div className="cta-3d__actions">
            <a href="tel:+15551234567" className="btn-3d btn-3d--primary btn-3d--lg">Call Now</a>
            <a href="mailto:contact@jinki.io" className="btn-3d btn-3d--ghost btn-3d--lg">Email Us</a>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER */}
      <footer className="spatial-footer">
        <div className="spatial-footer__inner">
          <div className="spatial-footer__brand">
            <span className="spatial-footer__logo">◉ JINKI INTELLIGENCE</span>
            <span className="spatial-footer__tagline">Ex Alto Omnia</span>
          </div>
          <span className="spatial-footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
