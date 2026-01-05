import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue, useVelocity, useAnimationFrame } from 'framer-motion'
import Lenis from 'lenis'
import './Competitor3.css'

// ═══════════════════════════════════════════════════════════════
// KINETIC TEXT - Split and animate each character
// ═══════════════════════════════════════════════════════════════
function KineticText({ children, className = '', delay = 0, stagger = 0.03 }) {
  const letters = Array.from(children)

  return (
    <span className={className}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.6,
            delay: delay + (i * stagger),
            ease: [0.34, 1.56, 0.64, 1] // Elastic ease
          }}
          style={{ display: 'inline-block', transformOrigin: 'center bottom' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// MORPHING EYE - Liquid morphing cyber eye
// ═══════════════════════════════════════════════════════════════
function MorphingEye() {
  const [frame, setFrame] = useState(0)

  const variants = {
    morph: {
      scale: [1, 1.05, 0.98, 1],
      rotateZ: [0, 2, -2, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 3)
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="morphing-eye"
      variants={variants}
      animate="morph"
      whileHover={{ scale: 1.1, rotateZ: 5 }}
    >
      <motion.div
        className="morphing-eye__outer"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="morphing-eye__ring"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              delay: i * 0.7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
      <motion.div
        className="morphing-eye__pupil"
        animate={{
          scale: [1, 0.9, 1.1, 1],
          boxShadow: [
            "0 0 30px rgba(0, 180, 216, 0.5)",
            "0 0 60px rgba(0, 229, 255, 0.8)",
            "0 0 30px rgba(0, 180, 216, 0.5)"
          ]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FLOATING PARTICLES - Physics-based particles
// ═══════════════════════════════════════════════════════════════
function FloatingParticles({ count = 20 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 15 + Math.random() * 10
  }))

  return (
    <div className="floating-particles">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="particle"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SCROLL PROGRESS - Visual scroll indicator
// ═══════════════════════════════════════════════════════════════
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════
// MAGNETIC BUTTON - Button with magnetic hover effect
// ═══════════════════════════════════════════════════════════════
function MagneticButton({ children, href, variant = 'primary' }) {
  const ref = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * 0.3
    const y = (e.clientY - rect.top - rect.height / 2) * 0.3
    setPosition({ x, y })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.a
      ref={ref}
      href={href}
      className={`magnetic-btn magnetic-btn--${variant}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        animate={{ x: position.x * 0.5, y: position.y * 0.5 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {children}
      </motion.span>
    </motion.a>
  )
}

// ═══════════════════════════════════════════════════════════════
// ORCHESTRATED FADE UP - Staggered reveal animation
// ═══════════════════════════════════════════════════════════════
function OrchestrateFadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 100, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED COUNTER - Spring physics counter
// ═══════════════════════════════════════════════════════════════
function AnimatedCounter({ value, suffix = '', prefix = '', label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { stiffness: 50, damping: 30 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (inView) {
      const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
      motionValue.set(num)
    }
  }, [inView, value, motionValue])

  useEffect(() => {
    return springValue.on('change', (latest) => {
      setDisplay(Math.floor(latest))
    })
  }, [springValue])

  return (
    <motion.div
      ref={ref}
      className="animated-stat"
      initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
      whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.8,
        ease: [0.34, 1.56, 0.64, 1],
        delay: 0.2
      }}
    >
      <motion.span
        className="animated-stat__value"
        whileHover={{ scale: 1.1, color: '#00e5ff' }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {prefix}{display}{suffix}
      </motion.span>
      <span className="animated-stat__label">{label}</span>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CARD WITH DEPTH - Multi-layer parallax card
// ═══════════════════════════════════════════════════════════════
function DepthCard({ image, title, problem, solution, stats, index }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })

  const y = useTransform(scrollYProgress, [0, 1], [80, -80])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 })
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [5, 0, -5])

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height
    setMousePosition({ x: x * 10, y: y * 10 })
  }

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 })
  }

  return (
    <motion.div
      ref={ref}
      className="depth-card"
      initial={{ opacity: 0, y: 150, rotateX: 30 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 1,
        delay: index * 0.15,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
    >
      <motion.div
        className="depth-card__image-container"
        style={{
          y: smoothY,
          rotateY: mousePosition.x,
          rotateX: mousePosition.y * -1
        }}
      >
        <motion.img
          src={image}
          alt={title}
          className="depth-card__image"
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </motion.div>

      <motion.div
        className="depth-card__content"
        style={{
          rotateY: mousePosition.x * 0.5,
          rotateX: mousePosition.y * -0.5
        }}
      >
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.15 + 0.2 }}
        >
          {title}
        </motion.h3>

        <motion.div
          className="depth-card__section"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.15 + 0.3 }}
        >
          <span className="depth-card__label">Challenge</span>
          <p>{problem}</p>
        </motion.div>

        <motion.div
          className="depth-card__section"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.15 + 0.4 }}
        >
          <span className="depth-card__label">Solution</span>
          <p>{solution}</p>
        </motion.div>

        <motion.div
          className="depth-card__stats"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.15 + 0.5 }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="depth-card__stat"
              whileHover={{
                scale: 1.1,
                transition: { type: "spring", stiffness: 400 }
              }}
            >
              <span className="depth-card__stat-value">{stat.value}</span>
              <span className="depth-card__stat-label">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SMOOTH SCROLL HOOK
// ═══════════════════════════════════════════════════════════════
function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
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
// MAIN COMPONENT - COMPETITOR 3: MOTION
// ═══════════════════════════════════════════════════════════════
export default function Competitor3() {
  useSmoothScroll()

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 200]),
    { stiffness: 100, damping: 30 }
  )
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useSpring(
    useTransform(scrollYProgress, [0, 0.5], [1, 0.9]),
    { stiffness: 100, damping: 30 }
  )

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
    <div className="motion-page">
      <ScrollProgress />
      <FloatingParticles count={30} />

      {/* ANIMATED NAVBAR */}
      <motion.header
        className="motion-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 1,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: 0.5
        }}
      >
        <div className="motion-nav__inner">
          <motion.a
            href="/"
            className="motion-nav__logo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={{
                textShadow: [
                  "0 0 10px rgba(0, 180, 216, 0.5)",
                  "0 0 20px rgba(0, 229, 255, 0.8)",
                  "0 0 10px rgba(0, 180, 216, 0.5)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              JINKI
            </motion.span>
          </motion.a>

          <nav className="motion-nav__links">
            {['Industries', 'Platform', 'Advisory'].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ y: -2, color: '#00e5ff' }}
              >
                {item}
              </motion.a>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
          >
            <MagneticButton href="#contact">Get Started</MagneticButton>
          </motion.div>
        </div>
      </motion.header>

      {/* HERO SECTION */}
      <section ref={heroRef} className="motion-hero">
        <motion.div
          className="motion-hero__content"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          <motion.div className="motion-hero__eye-container">
            <MorphingEye />
          </motion.div>

          <motion.p
            className="motion-hero__tagline"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <KineticText delay={1.3} stagger={0.05}>
              Ex Alto Omnia
            </KineticText>
          </motion.p>

          <motion.h1
            className="motion-hero__title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.5 }}
          >
            <KineticText delay={1.6} stagger={0.04}>
              From Above,
            </KineticText>
            <br />
            <span className="gradient-flow">
              <KineticText delay={2} stagger={0.04}>
                All Things
              </KineticText>
            </span>
          </motion.h1>

          <motion.p
            className="motion-hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.6 }}
          >
            Autonomous aerial intelligence for critical infrastructure.
            <br />
            Detect anomalies before catastrophic failure.
          </motion.p>

          <motion.div
            className="motion-hero__actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.9 }}
          >
            <MagneticButton href="#contact" variant="primary">
              Schedule Assessment
            </MagneticButton>
            <MagneticButton href="#industries" variant="ghost">
              Explore Solutions
            </MagneticButton>
          </motion.div>

          <motion.div
            className="motion-hero__stats"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 3.2 }}
          >
            <AnimatedCounter value="700" prefix="$" suffix="K" label="Avg Outage Prevented" />
            <AnimatedCounter value="72" suffix="hrs" label="Early Detection" />
            <AnimatedCounter value="94" suffix="%" label="Fault Accuracy" />
            <AnimatedCounter value="58" suffix="%" label="Cost Reduction" />
          </motion.div>
        </motion.div>
      </section>

      {/* INDUSTRIES SECTION */}
      <section id="industries" className="motion-section">
        <OrchestrateFadeUp className="motion-section__header">
          <motion.p
            className="motion-section__eyebrow"
            whileInView={{ opacity: [0, 1], x: [-30, 0] }}
            viewport={{ once: true }}
          >
            Solutions
          </motion.p>
          <h2>
            <KineticText delay={0.2} stagger={0.02}>
              Critical Infrastructure Intelligence
            </KineticText>
          </h2>
          <motion.p
            className="motion-section__subtitle"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            Research-backed aerial protocols trusted by industry leaders
          </motion.p>
        </OrchestrateFadeUp>

        <div className="motion-cards">
          {industries.map((industry, i) => (
            <DepthCard key={i} {...industry} index={i} />
          ))}
        </div>
      </section>

      {/* PLATFORM SECTION */}
      <section id="platform" className="motion-section motion-section--alt">
        <div className="motion-platform">
          <OrchestrateFadeUp className="motion-platform__text">
            <p className="motion-section__eyebrow">Technology</p>
            <h2>
              <KineticText delay={0.2} stagger={0.03}>
                Enterprise-Grade Platform
              </KineticText>
            </h2>
            <motion.p
              className="motion-platform__lead"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Military-adjacent inspection technology. IP55 rated for all-weather.
              Redundant flight systems. 59-minute endurance.
            </motion.p>

            <div className="motion-features">
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
                  className="motion-feature"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                  whileHover={{
                    x: 10,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                >
                  <motion.span
                    className="motion-feature__icon"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    ◉
                  </motion.span>
                  {feature}
                </motion.div>
              ))}
            </div>
          </OrchestrateFadeUp>

          <OrchestrateFadeUp delay={0.3} className="motion-platform__visual">
            <motion.div
              className="motion-tech-orb"
              animate={{
                rotateY: 360,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              whileHover={{
                scale: 1.1,
                transition: { type: "spring", stiffness: 200 }
              }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="motion-tech-orb__ring"
                  animate={{
                    rotateZ: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    rotateZ: { duration: 15 - i * 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 3, delay: i * 0.2, repeat: Infinity }
                  }}
                  style={{
                    width: `${100 + i * 40}px`,
                    height: `${100 + i * 40}px`
                  }}
                />
              ))}
              <motion.div
                className="motion-tech-orb__core"
                animate={{
                  boxShadow: [
                    "0 0 40px rgba(0, 180, 216, 0.6)",
                    "0 0 80px rgba(0, 229, 255, 1)",
                    "0 0 40px rgba(0, 180, 216, 0.6)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </OrchestrateFadeUp>
        </div>
      </section>

      {/* ADVISORY SECTION */}
      <section id="advisory" className="motion-section">
        <OrchestrateFadeUp className="motion-section__header">
          <p className="motion-section__eyebrow">Advisory</p>
          <h2>
            <KineticText delay={0.2} stagger={0.03}>
              Cyber & AI Expertise
            </KineticText>
          </h2>
          <motion.p
            className="motion-section__subtitle"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Enterprise security architecture meets aerial intelligence
          </motion.p>
        </OrchestrateFadeUp>

        <OrchestrateFadeUp delay={0.3} className="motion-advisor">
          <motion.div
            className="motion-advisor__avatar"
            whileHover={{
              scale: 1.05,
              rotateY: 180,
              transition: { type: "spring", stiffness: 200 }
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              ◉
            </motion.div>
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Abdillahi A.
          </motion.h3>

          <motion.p
            className="motion-advisor__role"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Principal Security Architect
          </motion.p>

          <motion.p
            className="motion-advisor__bio"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Enterprise security architecture, AI governance, and risk management
            for critical infrastructure. Zero-trust frameworks and regulatory
            compliance for energy, utilities, and data center sectors.
          </motion.p>

          <motion.div
            className="motion-advisor__certs"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {['CISSP', 'CCSP', 'AIGP', 'PMP'].map((cert, i) => (
              <motion.span
                key={cert}
                className="motion-cert"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.8 + i * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                whileHover={{
                  scale: 1.2,
                  rotate: 5,
                  transition: { type: "spring", stiffness: 400 }
                }}
              >
                {cert}
              </motion.span>
            ))}
          </motion.div>
        </OrchestrateFadeUp>
      </section>

      {/* CTA SECTION */}
      <section id="contact" className="motion-section motion-section--cta">
        <OrchestrateFadeUp className="motion-cta">
          <motion.div
            className="motion-cta__icon"
            animate={{
              rotateZ: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              rotateZ: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
          >
            <svg viewBox="0 0 100 100" width="80" height="80">
              <motion.circle
                cx="50" cy="30"
                r="5"
                fill="#00b4d8"
                animate={{ r: [5, 7, 5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.circle
                cx="30" cy="70"
                r="5"
                fill="#00b4d8"
                animate={{ r: [5, 7, 5] }}
                transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
              />
              <motion.circle
                cx="70" cy="70"
                r="5"
                fill="#00b4d8"
                animate={{ r: [5, 7, 5] }}
                transition={{ duration: 1.5, delay: 1, repeat: Infinity }}
              />
              <motion.line
                x1="50" y1="30" x2="30" y2="70"
                stroke="#00b4d8"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.line
                x1="30" y1="70" x2="70" y2="70"
                stroke="#00b4d8"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
              />
              <motion.line
                x1="70" y1="70" x2="50" y2="30"
                stroke="#00b4d8"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 1, repeat: Infinity }}
              />
            </svg>
          </motion.div>

          <h2>
            <KineticText delay={0.2} stagger={0.03}>
              Ready to See Everything?
            </KineticText>
          </h2>

          <motion.p
            className="motion-cta__tagline"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Ex Alto Omnia — From Above, All Things
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Schedule a consultation. Prevent the next million-dollar outage.
          </motion.p>

          <motion.div
            className="motion-cta__actions"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <MagneticButton href="tel:+15551234567" variant="primary">
              Call Now
            </MagneticButton>
            <MagneticButton href="mailto:contact@jinki.io" variant="ghost">
              Email Us
            </MagneticButton>
          </motion.div>
        </OrchestrateFadeUp>
      </section>

      {/* FOOTER */}
      <motion.footer
        className="motion-footer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="motion-footer__inner">
          <div className="motion-footer__brand">
            <motion.span
              className="motion-footer__logo"
              whileHover={{ scale: 1.05, textShadow: "0 0 20px rgba(0, 229, 255, 0.8)" }}
            >
              ◉ JINKI INTELLIGENCE
            </motion.span>
            <span className="motion-footer__tagline">Ex Alto Omnia</span>
          </div>
          <span className="motion-footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </motion.footer>
    </div>
  )
}
