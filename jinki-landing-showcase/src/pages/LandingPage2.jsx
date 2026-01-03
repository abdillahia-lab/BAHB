import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Shield, Zap, Server, Leaf, Menu, X, Phone, Mail, Clock, Gauge, Radio, Crosshair, Factory, Thermometer, Radar, Wheat, Flame, AlertTriangle, TrendingUp } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './LandingPage2.css'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// ============================================
// SMOOTH SCROLL WITH LENIS
// ============================================
function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
    }
  }, [])
}

// ============================================
// ANIMATED TEXT REVEAL
// ============================================
function AnimatedText({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.4, 0.25, 1]
      }}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// PARALLAX IMAGE
// ============================================
function ParallaxImage({ src, alt, className = '' }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-15%', '15%'])

  return (
    <div ref={ref} className={`parallax-container ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y }}
        className="parallax-image"
      />
    </div>
  )
}

// ============================================
// FLOATING PARTICLES
// ============================================
function FloatingParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }))

  return (
    <div className="floating-particles">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// ANIMATED DRONE SVG
// ============================================
function AnimatedDrone() {
  const droneRef = useRef(null)

  useEffect(() => {
    if (!droneRef.current) return

    // Floating animation
    gsap.to(droneRef.current, {
      y: -20,
      duration: 2,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: -1,
    })

    // Subtle rotation
    gsap.to(droneRef.current, {
      rotateZ: 2,
      duration: 3,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: -1,
    })
  }, [])

  return (
    <div className="drone-wrapper" ref={droneRef}>
      <svg viewBox="0 0 200 120" className="drone-svg">
        {/* Drone body */}
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0f0f1a" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Arms */}
        <line x1="40" y1="60" x2="20" y2="40" stroke="#333" strokeWidth="4" strokeLinecap="round" />
        <line x1="160" y1="60" x2="180" y2="40" stroke="#333" strokeWidth="4" strokeLinecap="round" />
        <line x1="40" y1="60" x2="20" y2="80" stroke="#333" strokeWidth="4" strokeLinecap="round" />
        <line x1="160" y1="60" x2="180" y2="80" stroke="#333" strokeWidth="4" strokeLinecap="round" />

        {/* Rotors */}
        <g className="rotor rotor-1">
          <ellipse cx="20" cy="40" rx="18" ry="4" fill="url(#accentGrad)" opacity="0.6" />
        </g>
        <g className="rotor rotor-2">
          <ellipse cx="180" cy="40" rx="18" ry="4" fill="url(#accentGrad)" opacity="0.6" />
        </g>
        <g className="rotor rotor-3">
          <ellipse cx="20" cy="80" rx="18" ry="4" fill="url(#accentGrad)" opacity="0.6" />
        </g>
        <g className="rotor rotor-4">
          <ellipse cx="180" cy="80" rx="18" ry="4" fill="url(#accentGrad)" opacity="0.6" />
        </g>

        {/* Body */}
        <rect x="60" y="45" width="80" height="30" rx="8" fill="url(#bodyGrad)" />

        {/* Camera gimbal */}
        <rect x="85" y="75" width="30" height="20" rx="4" fill="#1a1a2e" />
        <circle cx="100" cy="85" r="8" fill="#0a0a15" />
        <circle cx="100" cy="85" r="5" fill="url(#accentGrad)" filter="url(#glow)" />

        {/* Status lights */}
        <circle cx="70" cy="55" r="3" fill="#22c55e" className="status-light" />
        <circle cx="130" cy="55" r="3" fill="#00d4ff" className="status-light-2" />

        {/* Sensor array */}
        <rect x="90" y="48" width="20" height="6" rx="2" fill="#00d4ff" opacity="0.8" />
      </svg>

      {/* Spec badges */}
      <div className="drone-specs">
        <motion.div
          className="drone-spec"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Clock size={14} />
          <span>59 min</span>
        </motion.div>
        <motion.div
          className="drone-spec"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Gauge size={14} />
          <span>6 kg</span>
        </motion.div>
        <motion.div
          className="drone-spec"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Radio size={14} />
          <span>40 km</span>
        </motion.div>
        <motion.div
          className="drone-spec"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Crosshair size={14} />
          <span>±1 cm</span>
        </motion.div>
      </div>
    </div>
  )
}

// ============================================
// GSAP SCROLL-TRIGGERED SECTION
// ============================================
function ScrollSection({ children, className = '' }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current.children, {
        y: 100,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      })
    }, ref)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

// ============================================
// MAGNETIC BUTTON
// ============================================
function MagneticButton({ children, href, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const btn = ref.current
    if (!btn) return

    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      gsap.to(btn, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    const handleMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)',
      })
    }

    btn.addEventListener('mousemove', handleMouseMove)
    btn.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      btn.removeEventListener('mousemove', handleMouseMove)
      btn.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <a ref={ref} href={href} className={`magnetic-btn ${className}`}>
      {children}
    </a>
  )
}

// ============================================
// INDUSTRY CARD WITH REVEAL
// ============================================
function IndustryCard({ icon, title, description, stats, delay = 0 }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: 80,
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
        },
      })
    }, ref)

    return () => ctx.revert()
  }, [delay])

  return (
    <div ref={ref} className="industry-card">
      <div className="industry-card__icon">{icon}</div>
      <h3 className="industry-card__title">{title}</h3>
      <p className="industry-card__desc">{description}</p>
      <div className="industry-card__stats">
        {stats.map((stat, i) => (
          <div key={i} className="industry-card__stat">
            <span className="industry-card__stat-value">{stat.value}</span>
            <span className="industry-card__stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function LandingPage2() {
  const [menuOpen, setMenuOpen] = useState(false)
  const heroRef = useRef(null)

  // Initialize smooth scroll
  useSmoothScroll()

  // Parallax for hero
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const industries = [
    {
      icon: <Server size={32} />,
      title: 'Data Centers',
      description: 'Thermal anomaly detection preventing $540K/hour downtime. ASHRAE compliance with 0.03°C sensitivity.',
      stats: [
        { value: '$540K', label: 'Hourly Cost Saved' },
        { value: '0.03°C', label: 'Detection' },
      ],
    },
    {
      icon: <Zap size={32} />,
      title: 'Electric Utilities',
      description: 'NERC FAC-003 compliance with LiDAR vegetation analysis. 60% cost reduction vs helicopters.',
      stats: [
        { value: '60%', label: 'Cost Reduction' },
        { value: '4.5x', label: 'More Defects' },
      ],
    },
    {
      icon: <Leaf size={32} />,
      title: 'Agriculture',
      description: 'NDVI and CWSI analysis detecting crop stress 14 days before visible symptoms.',
      stats: [
        { value: '150%', label: 'ROI Documented' },
        { value: '14 days', label: 'Early Detection' },
      ],
    },
    {
      icon: <Factory size={32} />,
      title: 'Oil & Gas',
      description: 'Optical Gas Imaging for methane detection. Pipeline thermal profiling with 99.2% accuracy.',
      stats: [
        { value: '99.2%', label: 'Detection Rate' },
        { value: '14 km', label: 'Daily Coverage' },
      ],
    },
  ]

  return (
    <div className="jinki-cinematic">
      <FloatingParticles />

      {/* Navigation */}
      <header className="nav-cinematic">
        <div className="nav-cinematic__container">
          <a href="/" className="nav-cinematic__logo">
            <span className="nav-cinematic__logo-text">JINKI</span>
            <span className="nav-cinematic__logo-sub">INTELLIGENCE</span>
          </a>

          <nav className="nav-cinematic__menu">
            <a href="#industries">Industries</a>
            <a href="#technology">Technology</a>
            <a href="#team">Team</a>
          </nav>

          <MagneticButton href="#contact" className="nav-cinematic__cta">
            Get Started
            <ArrowRight size={16} />
          </MagneticButton>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="hero-cinematic"
        style={{ y: heroY }}
      >
        <motion.div className="hero-cinematic__content" style={{ opacity: heroOpacity }}>
          <AnimatedText className="hero-cinematic__badge" delay={0}>
            <span className="hero-cinematic__badge-dot" />
            Enterprise Drone Intelligence
          </AnimatedText>

          <AnimatedText delay={0.1}>
            <h1 className="hero-cinematic__title">
              <span>Autonomous</span>
              <span className="hero-cinematic__title--accent">Inspection</span>
              <span>Intelligence</span>
            </h1>
          </AnimatedText>

          <AnimatedText delay={0.2}>
            <p className="hero-cinematic__desc">
              Military-grade thermal imaging and LiDAR inspection for critical infrastructure.
              Powered by DJI Matrice 400 RTK with 59-minute flight time and ±1cm positioning.
            </p>
          </AnimatedText>

          <AnimatedText delay={0.3} className="hero-cinematic__ctas">
            <MagneticButton href="#contact" className="btn-primary">
              Schedule Assessment
              <ArrowRight size={18} />
            </MagneticButton>
            <MagneticButton href="#industries" className="btn-secondary">
              <Play size={18} />
              Watch Demo
            </MagneticButton>
          </AnimatedText>
        </motion.div>

        <div className="hero-cinematic__drone">
          <AnimatedDrone />
        </div>

        <motion.div
          className="hero-cinematic__scroll"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown size={24} />
          <span>Scroll to explore</span>
        </motion.div>
      </motion.section>

      {/* Industries Section */}
      <section id="industries" className="industries-cinematic">
        <div className="industries-cinematic__container">
          <ScrollSection className="industries-cinematic__header">
            <h2>Industry Solutions</h2>
            <p>Specialized inspection protocols for critical infrastructure</p>
          </ScrollSection>

          <div className="industries-cinematic__grid">
            {industries.map((industry, i) => (
              <IndustryCard
                key={i}
                {...industry}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="tech-cinematic">
        <ScrollSection className="tech-cinematic__container">
          <div className="tech-cinematic__content">
            <h2>DJI Matrice 400 RTK</h2>
            <p>The most advanced enterprise drone platform, featuring 59-minute flight time,
               6kg payload capacity, and centimeter-level RTK positioning accuracy.</p>

            <div className="tech-cinematic__features">
              <div className="tech-feature">
                <Thermometer size={24} />
                <span>Thermal Imaging</span>
              </div>
              <div className="tech-feature">
                <Radar size={24} />
                <span>LiDAR Scanning</span>
              </div>
              <div className="tech-feature">
                <Shield size={24} />
                <span>IP55 Rated</span>
              </div>
            </div>
          </div>

          <div className="tech-cinematic__image">
            <img
              src="https://www-cdn.djiits.com/cms/uploads/67bb8244fb64295b08f9186279ba5b35.png"
              alt="DJI Matrice 400 RTK"
              onError={(e) => {
                e.target.src = 'https://www-cdn.djiits.com/cms/uploads/2ed1e47f4631274604877fa57933c373.png'
              }}
            />
          </div>
        </ScrollSection>
      </section>

      {/* Team Section */}
      <section id="team" className="team-cinematic">
        <ScrollSection className="team-cinematic__container">
          <h2>Leadership</h2>
          <p>Enterprise security expertise meets aerial intelligence</p>

          <div className="team-cinematic__card">
            <div className="team-cinematic__avatar">
              <Shield size={40} />
            </div>
            <h3>Abdillahi A.</h3>
            <span className="team-cinematic__role">Cyber & AI Security Advisor</span>
            <p>Enterprise security architecture, AI governance, and risk management for critical infrastructure.</p>
            <div className="team-cinematic__creds">
              CISSP • CCSP • AIGP • PMP
            </div>
          </div>
        </ScrollSection>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-cinematic">
        <ScrollSection className="contact-cinematic__container">
          <h2>Ready to Modernize Your Inspections?</h2>
          <p>Schedule a consultation to discuss your infrastructure monitoring needs.</p>

          <div className="contact-cinematic__buttons">
            <MagneticButton href="tel:+15551234567" className="btn-primary">
              <Phone size={18} />
              Call Now
            </MagneticButton>
            <MagneticButton href="mailto:contact@jinki.io" className="btn-secondary">
              <Mail size={18} />
              Email Us
            </MagneticButton>
          </div>
        </ScrollSection>
      </section>

      {/* Footer */}
      <footer className="footer-cinematic">
        <div className="footer-cinematic__container">
          <div className="footer-cinematic__brand">
            <span className="footer-cinematic__logo">JINKI INTELLIGENCE</span>
            <span className="footer-cinematic__tagline">Autonomous Inspection. Intelligent Analysis.</span>
          </div>
          <span className="footer-cinematic__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
