import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue, useAnimationFrame } from 'framer-motion'
import Lenis from 'lenis'
import './Competitor6.css'

const ease = [0.25, 0.1, 0.25, 1]

// ═══════════════════════════════════════════════════════════════
// CUSTOM CURSOR - Magnetic cursor with trail effect
// ═══════════════════════════════════════════════════════════════
function CustomCursor() {
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const [isHovering, setIsHovering] = useState(false)
  const [trails, setTrails] = useState([])

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)

      // Add trail
      setTrails(prev => [...prev.slice(-8), { x: e.clientX, y: e.clientY, id: Date.now() }])
    }

    const handleMouseOver = (e) => {
      if (e.target.closest('.interactive')) {
        setIsHovering(true)
      } else {
        setIsHovering(false)
      }
    }

    window.addEventListener('mousemove', moveCursor)
    window.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [])

  return (
    <div className="custom-cursor-container">
      {trails.map((trail, i) => (
        <motion.div
          key={trail.id}
          className="cursor-trail"
          initial={{ x: trail.x - 4, y: trail.y - 4, opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.4 }}
        />
      ))}
      <motion.div
        className="custom-cursor"
        style={{ x: cursorX, y: cursorY }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? 'rgba(0, 229, 255, 0.3)' : 'rgba(0, 180, 216, 0.8)'
        }}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// RIPPLE BUTTON - Button with ripple effect on click
// ═══════════════════════════════════════════════════════════════
function RippleButton({ children, href, className = '', variant = 'primary' }) {
  const [ripples, setRipples] = useState([])
  const buttonRef = useRef(null)

  const createRipple = (e) => {
    const button = buttonRef.current
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ripple = {
      x,
      y,
      id: Date.now()
    }

    setRipples(prev => [...prev, ripple])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id))
    }, 600)
  }

  return (
    <motion.a
      ref={buttonRef}
      href={href}
      className={`ripple-btn ripple-btn--${variant} interactive ${className}`}
      onClick={createRipple}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="ripple"
          style={{ left: ripple.x, top: ripple.y }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
      {children}
    </motion.a>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAGNETIC ELEMENT - Elements attracted to cursor
// ═══════════════════════════════════════════════════════════════
function MagneticElement({ children, strength = 0.3 }) {
  const ref = useRef(null)
  const x = useSpring(0, { stiffness: 150, damping: 15 })
  const y = useSpring(0, { stiffness: 150, damping: 15 })

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = (e.clientX - centerX) * strength
    const distanceY = (e.clientY - centerY) * strength
    x.set(distanceX)
    y.set(distanceY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="magnetic-element"
    >
      {children}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TILT CARD - 3D card tilt on mouse move
// ═══════════════════════════════════════════════════════════════
function TiltCard({ image, title, problem, solution, stats, index }) {
  const ref = useRef(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })
  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 })

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateXValue = ((y - centerY) / centerY) * -10
    const rotateYValue = ((x - centerX) / centerX) * 10

    setRotateX(rotateXValue)
    setRotateY(rotateYValue)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={ref}
      className="tilt-card interactive"
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, delay: index * 0.1, ease }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovered ? 'translateZ(20px)' : 'translateZ(0)'}`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      <motion.div className="tilt-card__glow" style={{ opacity: isHovered ? 1 : 0 }} />
      <motion.div className="tilt-card__image" style={{ y: smoothY }}>
        <img src={image} alt={title} loading="lazy"/>
      </motion.div>
      <div className="tilt-card__content">
        <motion.h3
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {title}
        </motion.h3>
        <div className="tilt-card__section">
          <span className="tilt-card__label">Challenge</span>
          <p>{problem}</p>
        </div>
        <div className="tilt-card__section">
          <span className="tilt-card__label">Solution</span>
          <p>{solution}</p>
        </div>
        <div className="tilt-card__stats">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="tilt-card__stat"
              whileHover={{ scale: 1.1, color: '#00e5ff' }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="tilt-card__stat-value">{stat.value}</span>
              <span className="tilt-card__stat-label">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FLOATING PARTICLES - Animated particles on hover
// ═══════════════════════════════════════════════════════════════
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 3 + 2
  }))

  return (
    <div className="floating-particles">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BOUNCY COUNTER - Counter with spring animation
// ═══════════════════════════════════════════════════════════════
function BouncyCounter({ value, suffix = '', prefix = '', label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

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
    <motion.div
      ref={ref}
      className="bouncy-stat interactive"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 10 }}
    >
      <motion.span
        className="bouncy-stat__value"
        animate={{
          scale: isHovered ? 1.1 : 1,
          color: isHovered ? '#00e5ff' : '#f0f6fc'
        }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {prefix}{display}{suffix}
      </motion.span>
      <span className="bouncy-stat__label">{label}</span>
      {isHovered && (
        <motion.div
          className="bouncy-stat__ring"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}
    </motion.div>
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
// INTERACTIVE FEATURE - Feature with hover effect
// ═══════════════════════════════════════════════════════════════
function InteractiveFeature({ text, index }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="interactive-feature interactive"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ x: 10, backgroundColor: 'rgba(0, 180, 216, 0.1)' }}
    >
      <motion.span
        className="interactive-feature__icon"
        animate={{
          rotate: isHovered ? 360 : 0,
          scale: isHovered ? 1.3 : 1
        }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        ◉
      </motion.span>
      <span>{text}</span>
      {isHovered && (
        <motion.div
          className="interactive-feature__pulse"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MORPHING EYE - Simplified animated eye
// ═══════════════════════════════════════════════════════════════
function MorphingEye() {
  const [frame, setFrame] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 3)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="morphing-eye interactive"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <motion.div
        className="morphing-eye__outer"
        animate={{
          scale: isHovered ? 1.2 : 1,
          borderColor: isHovered ? '#00e5ff' : '#00b4d8'
        }}
      />
      <motion.div
        className="morphing-eye__middle"
        animate={{ rotate: frame * 120 }}
        transition={{ duration: 0.8 }}
      />
      <motion.div
        className="morphing-eye__inner"
        animate={{
          scale: [1, 1.2, 1],
          backgroundColor: isHovered ? '#00e5ff' : '#00b4d8'
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="morphing-eye__glow"
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [1, 1.3, 1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Competitor6() {
  useSmoothScroll()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

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
    <div className="micro-page">
      {!isMobile && <CustomCursor />}
      <FloatingParticles />

      {/* NAV */}
      <motion.header
        className="micro-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="micro-nav__inner">
          <MagneticElement strength={0.2}>
            <a href="/" className="micro-nav__logo interactive">
              <motion.span
                className="micro-nav__logo-text"
                whileHover={{ letterSpacing: '0.3em', scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                JINKI
              </motion.span>
            </a>
          </MagneticElement>
          <nav className="micro-nav__links">
            {['Industries', 'Platform', 'Advisory'].map((link, i) => (
              <MagneticElement key={link} strength={0.15}>
                <motion.a
                  href={`#${link.toLowerCase()}`}
                  className="interactive"
                  whileHover={{ scale: 1.1, color: '#00e5ff' }}
                  whileTap={{ scale: 0.95 }}
                >
                  {link}
                </motion.a>
              </MagneticElement>
            ))}
          </nav>
          <RippleButton href="#contact" variant="primary">Get Started</RippleButton>
        </div>
      </motion.header>

      {/* HERO */}
      <section ref={heroRef} className="micro-hero">
        <div className="micro-hero__bg">
          <div className="micro-hero__grid"/>
        </div>

        <motion.div
          className="micro-hero__eye"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          <MorphingEye />
        </motion.div>

        <motion.div className="micro-hero__content" style={{ y: heroY, opacity: heroOpacity }}>
          <motion.p
            className="micro-hero__tagline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Ex Alto Omnia
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            From Above, <span className="gradient-text">All Things</span>
          </motion.h1>

          <motion.p
            className="micro-hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
          >
            Autonomous aerial intelligence for critical infrastructure.<br/>
            Detect anomalies before catastrophic failure.
          </motion.p>

          <motion.div
            className="micro-hero__actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.3 }}
          >
            <RippleButton href="#contact" variant="primary">Schedule Assessment</RippleButton>
            <RippleButton href="#industries" variant="ghost">Explore Solutions</RippleButton>
          </motion.div>
        </motion.div>

        <motion.div
          className="micro-hero__stats"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <BouncyCounter value="700" prefix="$" suffix="K" label="Avg Outage Prevented"/>
          <BouncyCounter value="72" suffix="hrs" label="Early Detection"/>
          <BouncyCounter value="94" suffix="%" label="Fault Accuracy"/>
          <BouncyCounter value="58" suffix="%" label="Cost Reduction"/>
        </motion.div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="micro-section">
        <FadeUp className="micro-section__header">
          <p className="micro-section__eyebrow">Solutions</p>
          <h2>Critical Infrastructure Intelligence</h2>
          <p className="micro-section__subtitle">Research-backed aerial protocols trusted by industry leaders</p>
        </FadeUp>

        <div className="micro-cards">
          {industries.map((industry, i) => (
            <TiltCard key={i} {...industry} index={i}/>
          ))}
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="micro-section micro-section--alt">
        <div className="micro-platform">
          <FadeUp className="micro-platform__text">
            <p className="micro-section__eyebrow">Technology</p>
            <h2>Enterprise-Grade Platform</h2>
            <p className="micro-platform__lead">
              Military-adjacent inspection technology. IP55 rated for all-weather.
              Redundant flight systems. 59-minute endurance.
            </p>
            <div className="micro-features">
              {[
                '0.05°C Thermal Sensitivity',
                'LiDAR @ 2.4M pts/sec',
                'IP55 Weather Sealed',
                'Redundant Flight Systems',
                '20km Transmission Range',
                '±1cm RTK Accuracy'
              ].map((f, i) => (
                <InteractiveFeature key={i} text={f} index={i} />
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.2} className="micro-platform__visual">
            <MagneticElement strength={0.4}>
              <motion.div
                className="micro-platform__box interactive"
                whileHover={{
                  boxShadow: '0 0 60px rgba(0, 180, 216, 0.4)',
                  borderColor: '#00e5ff',
                  scale: 1.05
                }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <pre className="micro-ascii-box">
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
              </motion.div>
            </MagneticElement>
          </FadeUp>
        </div>
      </section>

      {/* ADVISORY */}
      <section id="advisory" className="micro-section">
        <FadeUp className="micro-section__header">
          <p className="micro-section__eyebrow">Advisory</p>
          <h2>Cyber & AI Expertise</h2>
          <p className="micro-section__subtitle">Enterprise security architecture meets aerial intelligence</p>
        </FadeUp>

        <FadeUp delay={0.2} className="micro-advisor">
          <MagneticElement strength={0.3}>
            <motion.div
              className="micro-advisor__card interactive"
              whileHover={{
                boxShadow: '0 20px 60px rgba(0, 180, 216, 0.3)',
                y: -10
              }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <motion.div
                className="micro-advisor__avatar"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="micro-avatar-ring" />
                <div className="micro-avatar-core">A</div>
              </motion.div>
              <h3>Abdillahi A.</h3>
              <p className="micro-advisor__role">Principal Security Architect</p>
              <p className="micro-advisor__bio">
                Enterprise security architecture, AI governance, and risk management
                for critical infrastructure. Zero-trust frameworks and regulatory
                compliance for energy, utilities, and data center sectors.
              </p>
              <div className="micro-advisor__certs">
                {['CISSP', 'CCSP', 'AIGP', 'PMP'].map(c => (
                  <motion.span
                    key={c}
                    className="micro-cert interactive"
                    whileHover={{
                      scale: 1.2,
                      backgroundColor: 'rgba(0, 229, 255, 0.2)',
                      borderColor: '#00e5ff'
                    }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {c}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </MagneticElement>
        </FadeUp>
      </section>

      {/* CTA */}
      <section id="contact" className="micro-section micro-section--cta">
        <FadeUp className="micro-cta">
          <motion.div
            className="micro-cta__icon"
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <MagneticElement strength={0.5}>
              <motion.div
                whileHover={{ scale: 1.2, rotate: 180 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                ◉
              </motion.div>
            </MagneticElement>
          </motion.div>
          <h2>Ready to See Everything?</h2>
          <p className="micro-cta__tagline">Ex Alto Omnia — From Above, All Things</p>
          <p>Schedule a consultation. Prevent the next million-dollar outage.</p>
          <div className="micro-cta__actions">
            <RippleButton href="tel:+15551234567" variant="primary" className="btn--lg">Call Now</RippleButton>
            <RippleButton href="mailto:contact@jinki.io" variant="ghost" className="btn--lg">Email Us</RippleButton>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER */}
      <footer className="micro-footer">
        <div className="micro-footer__inner">
          <div className="micro-footer__brand">
            <MagneticElement strength={0.2}>
              <motion.span
                className="micro-footer__logo interactive"
                whileHover={{ letterSpacing: '0.2em', scale: 1.05 }}
              >
                ◉ JINKI INTELLIGENCE
              </motion.span>
            </MagneticElement>
            <span className="micro-footer__tagline">Ex Alto Omnia</span>
          </div>
          <span className="micro-footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
