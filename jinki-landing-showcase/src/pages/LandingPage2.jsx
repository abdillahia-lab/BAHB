import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Shield, Eye, Target, Zap, Server, Building2, Leaf, Menu, X, CheckCircle2, Phone, Mail, Thermometer, Map, BarChart3, Clock, Crosshair, Layers, Mountain, Scan, Activity } from 'lucide-react'
import './LandingPage2.css'

// ============================================
// 4K IMAGES - Real, high-quality imagery
// ============================================
const IMAGES = {
  // Hero - DJI Matrice 400 RTK style enterprise drone
  heroDrone: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=3840&q=95',

  // Industry-specific images
  electricUtility: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1920&q=90',
  dataCenter: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=90',
  oilGas: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=1920&q=90',
  agriculture: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=90',

  // Service images
  thermalScan: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=90',
  topography: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=90',
}

// ============================================
// LOGO - Minimalist hexagon with eye/lens
// Inspired by DJI's simplicity, drone's aerial view
// ============================================
function Logo({ variant = 'default' }) {
  return (
    <a href="/" className={`logo logo--${variant}`}>
      <div className="logo__mark">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Hexagon - represents drone from above */}
          <path
            d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          {/* Inner lens/eye - represents intelligence/vision */}
          <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="24" cy="24" r="3" fill="currentColor" />
          {/* Subtle crosshair - precision */}
          <path d="M24 12V16M24 32V36M12 24H16M32 24H36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        </svg>
      </div>
      <span className="logo__wordmark">JINKI</span>
    </a>
  )
}

// ============================================
// FLUID SIMULATION BACKGROUND
// ============================================
function FluidCanvas() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const particlesRef = useRef([])
  const frameRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      particlesRef.current = []
      const count = Math.min(150, Math.floor((canvas.width * canvas.height) / 20000))
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: 0,
          vy: 0,
          size: Math.random() * 2 + 0.5,
          life: Math.random()
        })
      }
    }

    const handleMouseMove = (e) => {
      mouseRef.current.px = mouseRef.current.x
      mouseRef.current.py = mouseRef.current.y
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }

    const animate = () => {
      const { width, height } = canvas
      ctx.fillStyle = 'rgba(8, 8, 12, 0.08)'
      ctx.fillRect(0, 0, width, height)

      const mouse = mouseRef.current
      const dx = mouse.x - mouse.px
      const dy = mouse.y - mouse.py
      const speed = Math.sqrt(dx * dx + dy * dy)

      particlesRef.current.forEach((p, i) => {
        const distX = mouse.x - p.x
        const distY = mouse.y - p.y
        const dist = Math.sqrt(distX * distX + distY * distY)

        if (dist < 150 && speed > 0.5) {
          const force = (1 - dist / 150) * speed * 0.02
          p.vx += dx * force * 0.1
          p.vy += dy * force * 0.1
        }

        p.vx += (Math.random() - 0.5) * 0.05
        p.vy += (Math.random() - 0.5) * 0.05
        p.vx *= 0.98
        p.vy *= 0.98
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        p.life += 0.005
        const pulse = 0.5 + 0.5 * Math.sin(p.life * 2)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 200, 255, ${0.15 + pulse * 0.1})`
        ctx.fill()

        // Connect nearby particles
        particlesRef.current.slice(i + 1).forEach(p2 => {
          const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2)
          if (d < 80) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(0, 200, 255, ${0.03 * (1 - d / 80)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      frameRef.current = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return <canvas ref={canvasRef} className="fluid-canvas" />
}

// ============================================
// GLASS CARD COMPONENT
// ============================================
function GlassCard({ children, className = '', hover = true }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })

  const handleMove = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    })
  }, [])

  return (
    <motion.div
      ref={ref}
      className={`glass-card ${className}`}
      onMouseMove={handleMove}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ '--mx': `${pos.x}%`, '--my': `${pos.y}%` }}
    >
      <div className="glass-card__shine" />
      <div className="glass-card__content">{children}</div>
    </motion.div>
  )
}

// ============================================
// THERMAL SCANNER - Interactive
// ============================================
function ThermalScanner() {
  const containerRef = useRef(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [temp, setTemp] = useState(42)
  const [active, setActive] = useState(false)

  const hotspots = [
    { x: 25, y: 30, temp: 94 },
    { x: 68, y: 55, temp: 71 },
    { x: 42, y: 78, temp: 53 }
  ]

  const handleMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPos({ x, y })

    let t = 28 + (y / 100) * 15
    hotspots.forEach(h => {
      const dist = Math.sqrt((x - h.x) ** 2 + (y - h.y) ** 2)
      if (dist < 20) t += (20 - dist) * ((h.temp - t) / 20)
    })
    setTemp(Math.min(120, Math.max(20, t)))
  }, [])

  const getColor = (t) => t >= 80 ? '#ef4444' : t >= 60 ? '#f97316' : t >= 45 ? '#eab308' : '#3b82f6'
  const getStatus = (t) => t >= 80 ? 'CRITICAL' : t >= 60 ? 'WARNING' : t >= 45 ? 'ELEVATED' : 'NOMINAL'

  return (
    <GlassCard className="thermal-scanner" hover={false}>
      <div
        ref={containerRef}
        className="thermal-scanner__viewport"
        onMouseMove={handleMove}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
      >
        <img src={IMAGES.thermalScan} alt="Solar array thermal scan" className="thermal-scanner__image" />
        <div className="thermal-scanner__overlay" />

        <div
          className="thermal-scanner__beam"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            background: `radial-gradient(circle 100px, ${getColor(temp)}40 0%, transparent 70%)`
          }}
        />

        {hotspots.map((h, i) => (
          <div key={i} className="thermal-hotspot" style={{ left: `${h.x}%`, top: `${h.y}%`, '--color': getColor(h.temp) }}>
            <span className="thermal-hotspot__ring" />
            <span className="thermal-hotspot__temp">{h.temp}°C</span>
          </div>
        ))}

        <div className="thermal-hud">
          <span className="thermal-hud__label">FLIR ZENMUSE H30T</span>
          <span className="thermal-hud__live">● LIVE</span>
        </div>

        <div className="thermal-scale">
          <div className="thermal-scale__bar" />
          <div className="thermal-scale__labels">
            <span>120°C</span>
            <span>60°C</span>
            <span>0°C</span>
          </div>
        </div>

        <AnimatePresence>
          {active && (
            <motion.div
              className="thermal-cursor"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <Crosshair size={24} style={{ color: getColor(temp) }} />
              <div className="thermal-cursor__readout" style={{ background: getColor(temp) }}>
                <span className="thermal-cursor__temp">{temp.toFixed(1)}°C</span>
                <span className="thermal-cursor__status">{getStatus(temp)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="thermal-scanner__hint">
          <Scan size={14} />
          <span>Move cursor to scan</span>
        </div>
      </div>
    </GlassCard>
  )
}

// ============================================
// LIDAR POINT CLOUD
// ============================================
function LiDARCloud() {
  const canvasRef = useRef(null)
  const [layer, setLayer] = useState('terrain')
  const frameRef = useRef(0)
  const rotationRef = useRef(0)
  const pointsRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    const cx = w / 2
    const cy = h / 2

    pointsRef.current = []
    for (let i = 0; i < 600; i++) {
      const x = (Math.random() - 0.5) * 280
      const y = (Math.random() - 0.5) * 280
      const z = Math.sin(x * 0.02) * 25 + Math.cos(y * 0.02) * 25 + Math.random() * 15
      pointsRef.current.push({ x, y, z, size: Math.random() * 1.5 + 0.5 })
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 10, 0.12)'
      ctx.fillRect(0, 0, w, h)

      rotationRef.current += 0.002
      const cos = Math.cos(rotationRef.current)
      const sin = Math.sin(rotationRef.current)

      const projected = pointsRef.current.map(p => {
        const rx = p.x * cos - p.y * sin
        const ry = p.x * sin + p.y * cos
        const scale = 350 / (350 + p.z * 0.4)
        return { ...p, px: cx + rx * scale, py: cy + ry * scale * 0.5 - p.z * 0.7, scale, depth: ry }
      }).sort((a, b) => a.depth - b.depth)

      projected.forEach(p => {
        const elev = (p.z + 40) / 80
        let hue = layer === 'terrain' ? 120 + elev * 50 : layer === 'vegetation' ? 90 + elev * 35 : 200 + elev * 70
        ctx.beginPath()
        ctx.arc(p.px, p.py, p.size * p.scale, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue}, 70%, ${40 + elev * 25}%, ${0.5 + p.scale * 0.25})`
        ctx.fill()
      })

      frameRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(frameRef.current)
  }, [layer])

  return (
    <GlassCard className="lidar-cloud" hover={false}>
      <div className="lidar-cloud__viewport">
        <canvas ref={canvasRef} className="lidar-cloud__canvas" />
        <div className="lidar-cloud__data">
          <div><span>Points</span><strong>2.4M</strong></div>
          <div><span>Density</span><strong>45 pts/m²</strong></div>
          <div><span>Accuracy</span><strong>±2 cm</strong></div>
        </div>
        <div className="lidar-cloud__badge"><Activity size={12} /> ZENMUSE L2</div>
      </div>
      <div className="lidar-cloud__controls">
        {['terrain', 'vegetation', 'structures'].map(l => (
          <button key={l} className={layer === l ? 'active' : ''} onClick={() => setLayer(l)}>
            {l === 'terrain' && <Mountain size={14} />}
            {l === 'vegetation' && <Leaf size={14} />}
            {l === 'structures' && <Layers size={14} />}
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>
    </GlassCard>
  )
}

// ============================================
// MAIN LANDING PAGE
// ============================================
export default function LandingPage2() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Services - clean, focused
  const services = [
    {
      icon: <Eye size={24} />,
      title: 'Visual Inspection',
      description: '4K aerial imagery with AI-powered defect detection across power lines, solar arrays, and infrastructure.',
    },
    {
      icon: <Thermometer size={24} />,
      title: 'Thermal Analysis',
      description: 'FLIR radiometric imaging identifies hotspots, faults, and anomalies invisible to the naked eye.',
    },
    {
      icon: <Map size={24} />,
      title: 'LiDAR Mapping',
      description: 'Survey-grade 3D point clouds with centimeter accuracy for terrain modeling and volumetric analysis.',
    },
    {
      icon: <Shield size={24} />,
      title: 'Cyber & AI Advisory',
      description: 'Zero Trust architecture and AI governance for critical infrastructure. CISSP | CCSP | AIGP | PMP certified.',
    },
  ]

  // Industries with REAL IMAGES
  const industries = [
    {
      icon: <Zap size={28} />,
      name: 'Electric Utilities',
      description: 'Power line, substation, and transmission tower inspection',
      image: IMAGES.electricUtility,
      stat: 'Top 20 US Utilities'
    },
    {
      icon: <Server size={28} />,
      name: 'Data Centers',
      description: 'Thermal monitoring and perimeter security',
      image: IMAGES.dataCenter,
      stat: 'Hyperscale Ready'
    },
    {
      icon: <Building2 size={28} />,
      name: 'Oil & Gas',
      description: 'Pipeline, refinery, and offshore platform inspection',
      image: IMAGES.oilGas,
      stat: '3 Continents'
    },
    {
      icon: <Leaf size={28} />,
      name: 'Agriculture',
      description: 'Crop health, irrigation, and yield optimization',
      image: IMAGES.agriculture,
      stat: '500K+ Acres'
    },
  ]

  const metrics = [
    { value: '2.4M+', label: 'Acres Surveyed', icon: <BarChart3 size={18} /> },
    { value: '99.8%', label: 'Detection Rate', icon: <Target size={18} /> },
    { value: '<24hr', label: 'Report Delivery', icon: <Clock size={18} /> },
    { value: 'Zero', label: 'Security Breaches', icon: <Shield size={18} /> },
  ]

  return (
    <div className="jinki">
      <FluidCanvas />
      <div className="noise-overlay" />

      {/* Navigation */}
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__inner">
          <Logo />
          <nav className={`nav__links ${menuOpen ? 'nav__links--open' : ''}`}>
            <a href="#services">Services</a>
            <a href="#technology">Technology</a>
            <a href="#industries">Industries</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="nav__actions">
            <a href="tel:+15551234567" className="nav__phone"><Phone size={16} />(555) 123-4567</a>
            <a href="#contact" className="btn btn--primary">Get Quote</a>
            <button className="nav__toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero - DRONE IMAGE ONLY, NO TEXT SPECS */}
      <section ref={heroRef} className="hero">
        <motion.div className="hero__bg" style={{ scale: heroScale }}>
          <img src={IMAGES.heroDrone} alt="Enterprise inspection drone" />
          <div className="hero__gradient" />
        </motion.div>

        <motion.div className="hero__content" style={{ opacity: heroOpacity }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Critical Infrastructure<br />
            <span className="hero__highlight">Deserves Critical Attention</span>
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Enterprise drone inspection with thermal imaging, LiDAR mapping,
            and cybersecurity advisory for utilities, data centers, and critical operations.
          </motion.p>

          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <a href="#contact" className="btn btn--primary btn--lg">
              Schedule Inspection <ArrowRight size={20} />
            </a>
            <a href="#technology" className="btn btn--ghost btn--lg">
              <Play size={18} /> See Technology
            </a>
          </motion.div>
        </motion.div>

        {/* Metrics Bar */}
        <motion.div
          className="hero__metrics"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard className="metrics-card">
            <div className="metrics-grid">
              {metrics.map((m, i) => (
                <div key={i} className="metric">
                  {m.icon}
                  <div>
                    <span className="metric__value">{m.value}</span>
                    <span className="metric__label">{m.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <a href="#services" className="hero__scroll">
          <span>Explore</span>
          <ChevronDown size={20} />
        </a>
      </section>

      {/* Services */}
      <section id="services" className="section services">
        <div className="container">
          <div className="section__header">
            <span className="section__tag">Services</span>
            <h2>What We Do</h2>
            <p>Four specialized capabilities protecting critical infrastructure.</p>
          </div>

          <div className="services__grid">
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="service-card">
                  <div className="service-card__icon">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology - Thermal */}
      <section id="technology" className="section technology">
        <div className="container">
          <div className="technology__grid">
            <div className="technology__content">
              <span className="section__tag">Thermal Imaging</span>
              <h2>See What Others Miss</h2>
              <p className="technology__lead">
                Move your cursor over the solar array to scan temperatures in real-time.
                Our FLIR Zenmuse H30T detects anomalies invisible to the naked eye.
              </p>
              <ul className="feature-list">
                <li><CheckCircle2 size={20} /><div><strong>1280×1024 Resolution</strong><span>4× the detail of previous generation</span></div></li>
                <li><CheckCircle2 size={20} /><div><strong>±0.03°C Sensitivity</strong><span>Detect micro-temperature differentials</span></div></li>
                <li><CheckCircle2 size={20} /><div><strong>Real-Time AI Analysis</strong><span>Critical issues flagged during flight</span></div></li>
              </ul>
            </div>
            <ThermalScanner />
          </div>
        </div>
      </section>

      {/* Technology - LiDAR */}
      <section className="section technology technology--alt">
        <div className="container">
          <div className="technology__grid technology__grid--reverse">
            <LiDARCloud />
            <div className="technology__content">
              <span className="section__tag">LiDAR Mapping</span>
              <h2>Survey-Grade 3D Point Clouds</h2>
              <p className="technology__lead">
                Zenmuse L2 captures millions of data points per second,
                creating engineering-grade terrain models and vegetation analysis.
              </p>
              <div className="deliverables">
                <div className="deliverable"><Map size={18} /><span>Digital Terrain Models</span></div>
                <div className="deliverable"><Mountain size={18} /><span>Contour Mapping</span></div>
                <div className="deliverable"><Layers size={18} /><span>Vegetation Classification</span></div>
                <div className="deliverable"><Target size={18} /><span>Volumetric Analysis</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries - WITH IMAGES */}
      <section id="industries" className="section industries">
        <div className="container">
          <div className="section__header section__header--center">
            <span className="section__tag">Industries</span>
            <h2>Built for Critical Operations</h2>
            <p>We specialize in sectors where downtime isn't an inconvenience—it's a crisis.</p>
          </div>

          <div className="industries__grid">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="industry-card">
                  <div className="industry-card__image">
                    <img src={ind.image} alt={ind.name} />
                    <div className="industry-card__overlay" />
                  </div>
                  <div className="industry-card__content">
                    <div className="industry-card__icon">{ind.icon}</div>
                    <h3>{ind.name}</h3>
                    <p>{ind.description}</p>
                    <span className="industry-card__stat">{ind.stat}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="section cta">
        <div className="container">
          <GlassCard className="cta__card">
            <h2>Ready to See What You've Been Missing?</h2>
            <p>Schedule a 30-minute discovery call. We'll discuss your infrastructure, your challenges, and whether we're the right fit.</p>
            <a href="mailto:hello@jinki.io" className="btn btn--primary btn--xl">
              Schedule Discovery Call <ArrowRight size={24} />
            </a>
            <span className="cta__note">Usually respond within 4 hours</span>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div className="footer__brand">
              <Logo variant="light" />
              <p>Critical infrastructure inspection powered by enterprise drone technology.</p>
              <div className="footer__contact">
                <a href="mailto:hello@jinki.io"><Mail size={16} /> hello@jinki.io</a>
                <a href="tel:+15551234567"><Phone size={16} /> (555) 123-4567</a>
              </div>
            </div>
            <div className="footer__links">
              <div>
                <h4>Services</h4>
                <a href="#services">Visual Inspection</a>
                <a href="#technology">Thermal Imaging</a>
                <a href="#technology">LiDAR Mapping</a>
                <a href="#services">Cyber Advisory</a>
              </div>
              <div>
                <h4>Industries</h4>
                <a href="#industries">Electric Utilities</a>
                <a href="#industries">Data Centers</a>
                <a href="#industries">Oil & Gas</a>
                <a href="#industries">Agriculture</a>
              </div>
              <div>
                <h4>Company</h4>
                <a href="#contact">Contact</a>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© 2026 Jinki Intelligence. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
