import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Sun, Moon,
  Hexagon, Satellite, Shield, Leaf, Scan,
  Cpu, Database, Layers, Workflow, Activity,
  Play, Sparkles, Zap, Globe, Lock, Eye
} from 'lucide-react'
import './LandingPage2.css'

gsap.registerPlugin(ScrollTrigger)

function LandingPage2() {
  const [isDark, setIsDark] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cursorVariant, setCursorVariant] = useState('default')
  const containerRef = useRef(null)
  const heroRef = useRef(null)
  const capabilitiesRef = useRef(null)
  const techRef = useRef(null)

  // Smooth scroll with Lenis
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

    return () => lenis.destroy()
  }, [])

  // Mouse tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // GSAP ScrollTrigger animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text reveal
      gsap.fromTo('.hero-title-word',
        { y: 120, opacity: 0, rotateX: -90 },
        {
          y: 0, opacity: 1, rotateX: 0,
          duration: 1.2,
          stagger: 0.08,
          ease: 'power4.out',
          delay: 0.3
        }
      )

      // Capability cards stagger
      gsap.fromTo('.capability-card',
        { y: 100, opacity: 0, scale: 0.9 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.capabilities-grid',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      )

      // Tech features parallax
      gsap.to('.floating-orb', {
        y: -100,
        scrollTrigger: {
          trigger: '.lp2-technology',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1
        }
      })

      // Horizontal text scroll
      gsap.to('.marquee-track', {
        xPercent: -50,
        ease: 'none',
        duration: 20,
        repeat: -1
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  const { scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 0.95])

  const capabilities = [
    {
      icon: <Satellite size={28} />,
      title: 'Aerial Intelligence',
      description: 'Multi-spectral drone surveys with centimeter precision.',
      metric: '0.02m',
      metricLabel: 'Accuracy',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      icon: <Scan size={28} />,
      title: 'Thermal Analysis',
      description: 'AI-powered predictive maintenance detection.',
      metric: '99.8%',
      metricLabel: 'Detection',
      gradient: 'from-orange-500 to-red-600'
    },
    {
      icon: <Shield size={28} />,
      title: 'Cyber Defense',
      description: 'Zero-trust architecture for enterprise systems.',
      metric: '24/7',
      metricLabel: 'Monitoring',
      gradient: 'from-purple-500 to-violet-600'
    },
    {
      icon: <Leaf size={28} />,
      title: 'AgriTech Analytics',
      description: 'Precision agriculture with yield optimization.',
      metric: '+34%',
      metricLabel: 'Yield',
      gradient: 'from-green-500 to-emerald-600'
    }
  ]

  const stats = [
    { value: '2.4M+', label: 'Data Points Daily' },
    { value: '<50ms', label: 'Latency' },
    { value: '150+', label: 'Deployments' },
    { value: '99.99%', label: 'Uptime' }
  ]

  const techStack = [
    { name: 'YOLOv12', desc: 'Object Detection', icon: <Eye size={20} /> },
    { name: 'SAM 3.0', desc: 'Segmentation', icon: <Layers size={20} /> },
    { name: 'RF-DETR', desc: 'Real-time', icon: <Zap size={20} /> },
    { name: 'Qwen-VL', desc: 'Vision Language', icon: <Sparkles size={20} /> },
    { name: 'Edge AI', desc: 'On-device', icon: <Cpu size={20} /> },
    { name: 'Fusion', desc: 'Multi-modal', icon: <Globe size={20} /> }
  ]

  return (
    <div
      ref={containerRef}
      className={`lp2 ${isDark ? 'dark' : 'light'}`}
      data-theme={isDark ? 'dark' : 'light'}
    >
      {/* Custom Cursor */}
      <motion.div
        className="custom-cursor"
        animate={{
          x: mousePosition.x * 20,
          y: mousePosition.y * 20,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      />

      {/* Animated Background */}
      <div className="lp2-bg">
        <div className="noise-overlay" />
        <div className="gradient-orbs">
          <motion.div
            className="orb orb-1"
            animate={{
              x: mousePosition.x * 30,
              y: mousePosition.y * 30,
            }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
          />
          <motion.div
            className="orb orb-2"
            animate={{
              x: mousePosition.x * -20,
              y: mousePosition.y * -20,
            }}
            transition={{ type: 'spring', stiffness: 30, damping: 20 }}
          />
          <motion.div
            className="orb orb-3"
            animate={{
              x: mousePosition.x * 15,
              y: mousePosition.y * -25,
            }}
            transition={{ type: 'spring', stiffness: 40, damping: 20 }}
          />
        </div>
        <div className="grid-pattern" />
      </div>

      {/* Progress Bar */}
      <motion.div
        className="scroll-progress"
        style={{ scaleX: smoothProgress }}
      />

      {/* Back Button */}
      <Link to="/" className="back-btn">
        <motion.div
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          className="back-btn-inner"
        >
          <ArrowLeft size={18} />
          <span>Directory</span>
        </motion.div>
      </Link>

      {/* Theme Toggle */}
      <motion.button
        className="theme-toggle"
        onClick={() => setIsDark(!isDark)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Navigation */}
      <motion.nav
        className="lp2-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container">
          <div className="nav-content">
            <motion.div
              className="logo"
              whileHover={{ scale: 1.02 }}
            >
              <div className="logo-mark">
                <Hexagon size={32} strokeWidth={1} />
                <span>J</span>
              </div>
              <div className="logo-text">
                <span className="logo-name">JINKI</span>
                <span className="logo-tagline">Intelligence</span>
              </div>
            </motion.div>

            <div className="nav-links">
              {['Capabilities', 'Technology', 'Platform', 'Contact'].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="nav-link"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i + 0.3 }}
                  whileHover={{ y: -2 }}
                >
                  <span className="link-index">0{i + 1}</span>
                  <span>{item}</span>
                </motion.a>
              ))}
            </div>

            <motion.button
              className="nav-cta"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Get Started</span>
              <ArrowUpRight size={16} />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="lp2-hero"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <div className="container">
          <div className="hero-content">
            <motion.div
              className="hero-badge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Activity size={14} className="badge-icon" />
              <span>Systems Online</span>
              <span className="badge-divider" />
              <span>All Modules Operational</span>
            </motion.div>

            <h1 className="hero-title">
              <div className="title-line">
                {'NEXT-GEN'.split('').map((char, i) => (
                  <span key={i} className="hero-title-word">{char}</span>
                ))}
              </div>
              <div className="title-line title-accent">
                {'INTELLIGENCE'.split('').map((char, i) => (
                  <span key={i} className="hero-title-word">{char}</span>
                ))}
              </div>
              <div className="title-line">
                {'SYSTEMS'.split('').map((char, i) => (
                  <span key={i} className="hero-title-word">{char}</span>
                ))}
              </div>
            </h1>

            <motion.p
              className="hero-description"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              Advanced AI-powered surveillance, analysis, and security solutions
              for mission-critical operations. Built for precision. Designed for scale.
            </motion.p>

            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <motion.button
                className="btn-primary"
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Start Free Trial</span>
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                className="btn-secondary"
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play size={18} />
                <span>Watch Demo</span>
              </motion.button>
            </motion.div>
          </div>

          {/* 3D-like Visual */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="visual-wrapper">
              <motion.div
                className="visual-sphere"
                animate={{
                  rotateY: 360,
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <div className="sphere-ring sphere-ring-1" />
                <div className="sphere-ring sphere-ring-2" />
                <div className="sphere-ring sphere-ring-3" />
                <div className="sphere-core">
                  <Hexagon size={40} strokeWidth={1} />
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                className="floating-element fe-1"
                animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Satellite size={24} />
                <span>UAV-01</span>
              </motion.div>
              <motion.div
                className="floating-element fe-2"
                animate={{ y: [0, 12, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <Shield size={24} />
                <span>Secure</span>
              </motion.div>
              <motion.div
                className="floating-element fe-3"
                animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <Cpu size={24} />
                <span>AI Core</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Stats Marquee */}
        <div className="stats-marquee">
          <div className="marquee-track">
            {[...stats, ...stats, ...stats, ...stats].map((stat, i) => (
              <div key={i} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
                <span className="stat-divider">◆</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Capabilities Section */}
      <section ref={capabilitiesRef} className="lp2-capabilities" id="capabilities">
        <div className="container">
          <div className="section-header">
            <motion.span
              className="section-tag"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              01 — Capabilities
            </motion.span>
            <motion.h2
              className="section-title"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Mission-Critical
              <br />
              <span className="title-accent">Solutions</span>
            </motion.h2>
          </div>

          <div className="capabilities-grid">
            {capabilities.map((cap, i) => (
              <motion.div
                key={i}
                className="capability-card"
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="card-glow" />
                <div className="card-content">
                  <div className={`card-icon bg-gradient-to-br ${cap.gradient}`}>
                    {cap.icon}
                  </div>
                  <h3 className="card-title">{cap.title}</h3>
                  <p className="card-description">{cap.description}</p>
                  <div className="card-metric">
                    <span className="metric-value">{cap.metric}</span>
                    <span className="metric-label">{cap.metricLabel}</span>
                  </div>
                </div>
                <div className="card-border" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section ref={techRef} className="lp2-technology" id="technology">
        <div className="floating-orb fo-1" />
        <div className="floating-orb fo-2" />

        <div className="container">
          <div className="tech-layout">
            <div className="tech-content">
              <motion.span
                className="section-tag"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                02 — Technology
              </motion.span>
              <motion.h2
                className="section-title"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Powered by
                <br />
                <span className="title-accent">Cutting-Edge AI</span>
              </motion.h2>
              <motion.p
                className="tech-description"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Our proprietary AI stack combines state-of-the-art computer vision,
                natural language processing, and edge computing to deliver real-time
                intelligence where it matters most.
              </motion.p>

              <div className="tech-features">
                {[
                  { icon: <Cpu size={20} />, title: 'Edge Processing', desc: 'Sub-50ms latency' },
                  { icon: <Database size={20} />, title: 'Secure Storage', desc: 'E2E encrypted' },
                  { icon: <Workflow size={20} />, title: 'Automation', desc: 'Smart workflows' },
                  { icon: <Lock size={20} />, title: 'Zero Trust', desc: 'Enterprise grade' }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    className="tech-feature"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    whileHover={{ x: 8 }}
                  >
                    <div className="feature-icon">{feature.icon}</div>
                    <div className="feature-text">
                      <span className="feature-title">{feature.title}</span>
                      <span className="feature-desc">{feature.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              className="tech-stack-visual"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="stack-header">
                <span className="stack-label">// AI_STACK</span>
                <div className="stack-status">
                  <span className="status-dot" />
                  <span>Active</span>
                </div>
              </div>
              <div className="stack-grid">
                {techStack.map((tech, i) => (
                  <motion.div
                    key={i}
                    className="stack-item"
                    whileHover={{ scale: 1.05, y: -4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className="stack-icon">{tech.icon}</div>
                    <div className="stack-info">
                      <span className="stack-name">{tech.name}</span>
                      <span className="stack-desc">{tech.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp2-cta" id="contact">
        <div className="container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="cta-content">
              <h2>Ready to Deploy?</h2>
              <p>Connect with our solutions team to discuss your operational requirements.</p>
              <div className="cta-actions">
                <motion.button
                  className="btn-primary"
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Schedule Briefing</span>
                  <ArrowUpRight size={18} />
                </motion.button>
                <motion.button
                  className="btn-ghost"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>View Documentation</span>
                </motion.button>
              </div>
            </div>
            <div className="cta-visual">
              <div className="cta-orb" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp2-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <div className="logo-mark">
                  <Hexagon size={28} strokeWidth={1} />
                  <span>J</span>
                </div>
                <div className="logo-text">
                  <span className="logo-name">JINKI</span>
                  <span className="logo-tagline">Intelligence</span>
                </div>
              </div>
              <p>Next-generation intelligence systems for mission-critical operations.</p>
            </div>
            <div className="footer-links">
              <div className="links-column">
                <h4>Solutions</h4>
                <a href="#">Aerial Surveying</a>
                <a href="#">Thermal Inspections</a>
                <a href="#">Cyber Security</a>
                <a href="#">AgriTech</a>
              </div>
              <div className="links-column">
                <h4>Platform</h4>
                <a href="#">Command Center</a>
                <a href="#">API Access</a>
                <a href="#">Documentation</a>
                <a href="#">Status</a>
              </div>
              <div className="links-column">
                <h4>Company</h4>
                <a href="#">About</a>
                <a href="#">Careers</a>
                <a href="#">Press</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 Jinki Intelligence. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage2
