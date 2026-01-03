import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Shield, Eye, Zap, Server, Building2, Leaf, Menu, X, Phone, Mail, Thermometer, Map, Check, Clock, Crosshair, Radar, Mountain, Trees, Home, Cable } from 'lucide-react'
import './LandingPage2.css'

// ============================================
// WEBGL FLUID SIMULATION
// Premium interactive background
// ============================================
function FluidCanvas() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const particlesRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let width = window.innerWidth
    let height = window.innerHeight

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialize particles
    const numParticles = 80
    particlesRef.current = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 100 + 50,
      hue: Math.random() * 60 + 200, // Blue to purple range
      alpha: Math.random() * 0.15 + 0.05
    }))

    const animate = () => {
      ctx.fillStyle = 'rgba(8, 8, 12, 0.03)'
      ctx.fillRect(0, 0, width, height)

      particlesRef.current.forEach((p, i) => {
        // Attract to mouse
        const dx = mouseRef.current.x * width - p.x
        const dy = mouseRef.current.y * height - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 300) {
          p.vx += dx * 0.00005
          p.vy += dy * 0.00005
        }

        // Flow motion
        p.vx += Math.sin(p.y * 0.002 + Date.now() * 0.0005) * 0.02
        p.vy += Math.cos(p.x * 0.002 + Date.now() * 0.0003) * 0.02

        // Damping
        p.vx *= 0.99
        p.vy *= 0.99

        // Update position
        p.x += p.vx
        p.y += p.vy

        // Wrap around
        if (p.x < -p.radius) p.x = width + p.radius
        if (p.x > width + p.radius) p.x = -p.radius
        if (p.y < -p.radius) p.y = height + p.radius
        if (p.y > height + p.radius) p.y = -p.radius

        // Draw
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius)
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 60%, ${p.alpha})`)
        gradient.addColorStop(0.5, `hsla(${p.hue + 20}, 70%, 50%, ${p.alpha * 0.5})`)
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const handleMouseMove = useCallback((e) => {
    mouseRef.current = {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fluid-canvas"
      onMouseMove={handleMouseMove}
    />
  )
}

// ============================================
// LIQUID GLASS CARD
// Premium glassmorphism component
// ============================================
function GlassCard({ children, className = '', hover = true }) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="glass-card__inner">
        {children}
      </div>
      <div className="glass-card__glow" />
    </motion.div>
  )
}

// ============================================
// 3D TOPOGRAPHY VISUALIZATION
// Real terrain rendering with distinct layers
// ============================================
function TopographyVisualization({ activeLayer }) {
  return (
    <div className="topo-viz">
      <div className="topo-viz__terrain">
        {/* Base terrain contours */}
        <svg className="topo-contours" viewBox="0 0 400 300" preserveAspectRatio="none">
          <defs>
            <linearGradient id="terrainGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1a3d1a" />
              <stop offset="30%" stopColor="#2d5a2d" />
              <stop offset="60%" stopColor="#8B7355" />
              <stop offset="80%" stopColor="#A0522D" />
              <stop offset="100%" stopColor="#F5F5DC" />
            </linearGradient>
          </defs>
          {/* Contour lines */}
          {[...Array(12)].map((_, i) => (
            <path
              key={i}
              d={`M0 ${280 - i * 20} Q100 ${270 - i * 22 + Math.sin(i) * 10} 200 ${275 - i * 21} T400 ${280 - i * 20}`}
              fill="none"
              stroke={`hsla(${120 + i * 8}, 40%, ${30 + i * 4}%, 0.6)`}
              strokeWidth="1.5"
            />
          ))}
        </svg>

        {/* Ground Layer - visible when ground selected */}
        <motion.div
          className="topo-layer topo-layer--ground"
          initial={{ opacity: 0 }}
          animate={{ opacity: activeLayer === 'ground' || activeLayer === 'all' ? 1 : 0.2 }}
        >
          <div className="ground-surface">
            <div className="ground-elevation ground-elevation--low" />
            <div className="ground-elevation ground-elevation--mid" />
            <div className="ground-elevation ground-elevation--high" />
          </div>
          <span className="topo-label topo-label--ground">
            <Mountain size={14} />
            Ground Surface
          </span>
        </motion.div>

        {/* Vegetation Layer - organic shapes */}
        <motion.div
          className="topo-layer topo-layer--vegetation"
          initial={{ opacity: 0 }}
          animate={{ opacity: activeLayer === 'vegetation' || activeLayer === 'all' ? 1 : 0.15 }}
        >
          <div className="vegetation-canopy">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="tree-cluster"
                style={{
                  left: `${10 + i * 12}%`,
                  bottom: `${20 + Math.sin(i * 1.5) * 15}%`,
                  transform: `scale(${0.6 + Math.random() * 0.6})`
                }}
              />
            ))}
          </div>
          <span className="topo-label topo-label--vegetation">
            <Trees size={14} />
            Vegetation Canopy
          </span>
        </motion.div>

        {/* Buildings Layer - geometric */}
        <motion.div
          className="topo-layer topo-layer--buildings"
          initial={{ opacity: 0 }}
          animate={{ opacity: activeLayer === 'buildings' || activeLayer === 'all' ? 1 : 0.15 }}
        >
          <div className="building-footprints">
            <div className="building building--1" />
            <div className="building building--2" />
            <div className="building building--3" />
          </div>
          <span className="topo-label topo-label--buildings">
            <Home size={14} />
            Structures
          </span>
        </motion.div>

        {/* Power Lines Layer */}
        <motion.div
          className="topo-layer topo-layer--powerlines"
          initial={{ opacity: 0 }}
          animate={{ opacity: activeLayer === 'powerlines' || activeLayer === 'all' ? 1 : 0.15 }}
        >
          <div className="powerline-corridor">
            <div className="tower tower--1" />
            <div className="tower tower--2" />
            <svg className="powerline-wire" viewBox="0 0 100 20">
              <path d="M0 10 Q25 15 50 10 T100 10" stroke="#22d3ee" strokeWidth="2" fill="none" />
              <path d="M0 12 Q25 17 50 12 T100 12" stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.6" />
            </svg>
          </div>
          <span className="topo-label topo-label--powerlines">
            <Cable size={14} />
            Power Lines
          </span>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="topo-legend">
        <div className="topo-legend__item">
          <span className="legend-dot legend-dot--ground" />
          <span>Ground: 2,418,392 pts</span>
        </div>
        <div className="topo-legend__item">
          <span className="legend-dot legend-dot--vegetation" />
          <span>Vegetation: 892,104 pts</span>
        </div>
        <div className="topo-legend__item">
          <span className="legend-dot legend-dot--buildings" />
          <span>Buildings: 156,847 pts</span>
        </div>
        <div className="topo-legend__item">
          <span className="legend-dot legend-dot--powerlines" />
          <span>Power Lines: 24,891 pts</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// THERMAL IMAGING VISUALIZATION
// Real infrared with temperature data
// ============================================
function ThermalVisualization() {
  const [hoveredHotspot, setHoveredHotspot] = useState(null)

  const hotspots = [
    { id: 1, x: 25, y: 30, temp: 87.3, delta: 42.1, status: 'CRITICAL', type: 'Cell Failure', color: '#ef4444' },
    { id: 2, x: 65, y: 45, temp: 62.8, delta: 17.6, status: 'WARNING', type: 'Bypass Diode', color: '#f59e0b' },
    { id: 3, x: 40, y: 70, temp: 53.4, delta: 8.2, status: 'MONITOR', type: 'Hot Spot', color: '#22c55e' },
  ]

  return (
    <div className="thermal-viz">
      <div className="thermal-viz__display">
        {/* Thermal gradient background */}
        <div className="thermal-viz__gradient" />

        {/* Grid overlay */}
        <div className="thermal-viz__grid" />

        {/* Hotspots */}
        {hotspots.map((spot) => (
          <motion.div
            key={spot.id}
            className={`thermal-hotspot thermal-hotspot--${spot.status.toLowerCase()}`}
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            onHoverStart={() => setHoveredHotspot(spot.id)}
            onHoverEnd={() => setHoveredHotspot(null)}
            animate={{
              scale: hoveredHotspot === spot.id ? 1.3 : 1,
              boxShadow: `0 0 ${hoveredHotspot === spot.id ? 30 : 15}px ${spot.color}`
            }}
          >
            <div className="hotspot-pulse" style={{ borderColor: spot.color }} />
            <AnimatePresence>
              {hoveredHotspot === spot.id && (
                <motion.div
                  className="hotspot-tooltip"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                >
                  <div className="hotspot-tooltip__temp">{spot.temp}°C</div>
                  <div className="hotspot-tooltip__delta">ΔT +{spot.delta}°C</div>
                  <div className="hotspot-tooltip__status" style={{ color: spot.color }}>
                    {spot.status}: {spot.type}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Temperature scale */}
        <div className="thermal-scale">
          <div className="thermal-scale__bar" />
          <div className="thermal-scale__labels">
            <span>100°C</span>
            <span>50°C</span>
            <span>0°C</span>
          </div>
        </div>

        {/* Crosshairs */}
        <Crosshair className="thermal-crosshair" />

        {/* Camera info */}
        <div className="thermal-cam-info">
          <span className="thermal-cam-info__recording">● REC</span>
          <span>FLIR Zenmuse H30T</span>
          <span>1280×1024</span>
        </div>
      </div>

      <div className="thermal-viz__stats">
        <div className="thermal-stat thermal-stat--critical">
          <span className="thermal-stat__count">3</span>
          <span className="thermal-stat__label">Critical</span>
        </div>
        <div className="thermal-stat thermal-stat--warning">
          <span className="thermal-stat__count">7</span>
          <span className="thermal-stat__label">Warning</span>
        </div>
        <div className="thermal-stat thermal-stat--monitor">
          <span className="thermal-stat__count">12</span>
          <span className="thermal-stat__label">Monitor</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// DRONE 3D SHOWCASE
// Premium drone visualization
// ============================================
function DroneShowcase() {
  return (
    <div className="drone-showcase">
      <div className="drone-showcase__visual">
        {/* DJI Matrice 400 RTK image from official source */}
        <img
          src="https://stormsend1.djicdn.com/tpc/uploads/imgs/4f72b4a38f91a1bc8a4d1d1c89b6b1e8.png"
          alt="DJI Matrice 400 RTK"
          className="drone-showcase__image"
          onError={(e) => {
            // Fallback to a different source if DJI CDN fails
            e.target.src = 'https://www1.djicdn.com/cms_uploads/product/20250609/Matrice-400-RTK_2560.png'
          }}
        />

        {/* Glow effect behind drone */}
        <div className="drone-showcase__glow" />

        {/* Specs floating around drone */}
        <motion.div
          className="drone-spec drone-spec--left"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="drone-spec__value">59 min</span>
          <span className="drone-spec__label">Flight Time</span>
        </motion.div>

        <motion.div
          className="drone-spec drone-spec--right"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className="drone-spec__value">6 kg</span>
          <span className="drone-spec__label">Payload</span>
        </motion.div>

        <motion.div
          className="drone-spec drone-spec--bottom"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="drone-spec__value">40 km</span>
          <span className="drone-spec__label">Transmission</span>
        </motion.div>
      </div>
    </div>
  )
}

// ============================================
// MAIN LANDING PAGE
// ============================================
export default function LandingPage2() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeTopoLayer, setActiveTopoLayer] = useState('all')
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const capabilities = [
    {
      icon: <Eye size={24} />,
      title: 'Visual Inspection',
      description: '4K aerial imagery with AI-powered defect detection across your entire facility.',
      features: ['20MP sensor', 'AI anomaly detection', '4K/60fps video'],
    },
    {
      icon: <Thermometer size={24} />,
      title: 'Thermal Analysis',
      description: 'Radiometric thermal imaging reveals faults invisible to the naked eye.',
      features: ['±0.03°C sensitivity', 'Real-time processing', 'Automated reports'],
    },
    {
      icon: <Map size={24} />,
      title: 'LiDAR Mapping',
      description: 'Survey-grade 3D point clouds with centimeter accuracy for any terrain.',
      features: ['45 pts/m² density', 'DEM/DSM output', '8 classification codes'],
    },
    {
      icon: <Shield size={24} />,
      title: 'Cyber & AI Advisory',
      description: 'Zero Trust architecture and AI governance for critical infrastructure.',
      credentials: 'CISSP • CCSP • AIGP • PMP',
      features: ['Zero Trust design', 'AI risk assessment', 'Compliance audits'],
    },
  ]

  const industries = [
    {
      icon: <Zap size={28} />,
      name: 'Electric Utilities',
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=90',
      stat: '15,000+ mi inspected',
    },
    {
      icon: <Server size={28} />,
      name: 'Data Centers',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=90',
      stat: 'Hyperscale certified',
    },
    {
      icon: <Building2 size={28} />,
      name: 'Oil & Gas',
      image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=90',
      stat: 'API 653 compliant',
    },
    {
      icon: <Leaf size={28} />,
      name: 'Agriculture',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=90',
      stat: '500K+ acres mapped',
    },
  ]

  const topoLayers = [
    { id: 'all', label: 'All Layers' },
    { id: 'ground', label: 'Ground' },
    { id: 'vegetation', label: 'Vegetation' },
    { id: 'buildings', label: 'Buildings' },
    { id: 'powerlines', label: 'Power Lines' },
  ]

  return (
    <div className="jinki">
      {/* Fluid background */}
      <FluidCanvas />

      {/* Navigation */}
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__container">
          <a href="/" className="nav__logo">
            <svg viewBox="0 0 32 32" className="nav__logo-icon">
              <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="16" cy="16" r="4" fill="currentColor"/>
            </svg>
            <span className="nav__logo-text">JINKI</span>
          </a>

          <nav className={`nav__menu ${menuOpen ? 'nav__menu--open' : ''}`}>
            <a href="#capabilities">Capabilities</a>
            <a href="#technology">Technology</a>
            <a href="#industries">Industries</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="nav__actions">
            <a href="tel:+15551234567" className="nav__phone">
              <Phone size={16} />
              <span>(555) 123-4567</span>
            </a>
            <a href="#contact" className="btn btn--primary">Get Quote</a>
            <button className="nav__toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="hero">
        <motion.div className="hero__content" style={{ opacity: heroOpacity, scale: heroScale }}>
          <motion.div
            className="hero__badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Radar size={14} />
            <span>Powered by DJI Matrice 400 RTK</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Enterprise Drone<br />
            <span className="hero__gradient-text">Intelligence</span>
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Thermal imaging, LiDAR mapping, and AI-powered analytics
            for critical infrastructure across the United States.
          </motion.p>

          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <a href="#contact" className="btn btn--primary btn--lg">
              Schedule Inspection <ArrowRight size={18} />
            </a>
            <a href="#technology" className="btn btn--glass btn--lg">
              <Play size={16} /> Watch Demo
            </a>
          </motion.div>

          <motion.div
            className="hero__stats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="hero-stat">
              <span className="hero-stat__value">2.4M+</span>
              <span className="hero-stat__label">Acres Surveyed</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat__value">99.8%</span>
              <span className="hero-stat__label">Detection Rate</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat__value">&lt;24hr</span>
              <span className="hero-stat__label">Report Delivery</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero__drone"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <DroneShowcase />
        </motion.div>

        <a href="#capabilities" className="hero__scroll">
          <ChevronDown size={24} />
        </a>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="section">
        <div className="container">
          <div className="section__header">
            <motion.span
              className="section__label"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Capabilities
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Four Core Services
            </motion.h2>
          </div>

          <div className="capabilities-grid">
            {capabilities.map((cap, i) => (
              <GlassCard key={i} className="capability-card">
                <div className="capability-card__icon">{cap.icon}</div>
                <h3>{cap.title}</h3>
                <p>{cap.description}</p>
                <ul className="capability-card__features">
                  {cap.features.map((f, j) => (
                    <li key={j}><Check size={14} /> {f}</li>
                  ))}
                </ul>
                {cap.credentials && (
                  <div className="capability-card__credentials">
                    {cap.credentials}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Thermal Technology */}
      <section id="technology" className="section section--dark">
        <div className="container">
          <div className="tech-split">
            <div className="tech-split__content">
              <span className="section__label">Thermal Imaging</span>
              <h2>Detect Invisible Faults</h2>
              <p className="tech-split__lead">
                Radiometric thermal imaging identifies hotspots, cell failures, and
                energy loss that visual inspection simply cannot see.
              </p>
              <div className="tech-features">
                <div className="tech-feature">
                  <strong>FLIR Zenmuse H30T</strong>
                  <span>1280×1024 radiometric sensor</span>
                </div>
                <div className="tech-feature">
                  <strong>±0.03°C Sensitivity</strong>
                  <span>Micro-differential detection</span>
                </div>
                <div className="tech-feature">
                  <strong>Real-Time AI</strong>
                  <span>Anomalies flagged during flight</span>
                </div>
              </div>
            </div>
            <div className="tech-split__visual">
              <ThermalVisualization />
            </div>
          </div>
        </div>
      </section>

      {/* LiDAR Technology */}
      <section className="section">
        <div className="container">
          <div className="tech-split tech-split--reverse">
            <div className="tech-split__content">
              <span className="section__label">LiDAR Mapping</span>
              <h2>Survey-Grade 3D Data</h2>
              <p className="tech-split__lead">
                Zenmuse L2 captures 2.4 million points per second, delivering
                engineering-grade deliverables for terrain modeling and infrastructure.
              </p>

              {/* Layer selector */}
              <div className="layer-selector">
                {topoLayers.map((layer) => (
                  <button
                    key={layer.id}
                    className={`layer-btn ${activeTopoLayer === layer.id ? 'layer-btn--active' : ''}`}
                    onClick={() => setActiveTopoLayer(layer.id)}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>

              <div className="tech-features">
                <div className="tech-feature">
                  <strong>45 pts/m²</strong>
                  <span>Point cloud density</span>
                </div>
                <div className="tech-feature">
                  <strong>±2cm Accuracy</strong>
                  <span>RTK positioning</span>
                </div>
                <div className="tech-feature">
                  <strong>8 Classifications</strong>
                  <span>Automated point labeling</span>
                </div>
              </div>
            </div>
            <div className="tech-split__visual">
              <TopographyVisualization activeLayer={activeTopoLayer} />
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="section section--dark">
        <div className="container">
          <div className="section__header section__header--center">
            <span className="section__label">Industries</span>
            <h2>Built for Critical Operations</h2>
            <p>We specialize in sectors where downtime costs millions</p>
          </div>

          <div className="industries-grid">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                className="industry-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <div className="industry-card__image">
                  <img src={ind.image} alt={ind.name} />
                  <div className="industry-card__overlay" />
                </div>
                <div className="industry-card__content">
                  <div className="industry-card__icon">{ind.icon}</div>
                  <h3>{ind.name}</h3>
                  <span className="industry-card__stat">{ind.stat}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="section">
        <div className="container">
          <GlassCard className="cta-card" hover={false}>
            <div className="cta-card__content">
              <h2>Ready to See What You're Missing?</h2>
              <p>
                Schedule a 30-minute discovery call. We'll discuss your infrastructure,
                your challenges, and whether we're the right fit.
              </p>
              <a href="mailto:hello@jinki.io" className="btn btn--primary btn--lg">
                Schedule Discovery Call <ArrowRight size={18} />
              </a>
              <span className="cta-card__note">Usually respond within 4 hours</span>
            </div>
            <div className="cta-card__contact">
              <div className="cta-contact-item">
                <Mail size={20} />
                <div>
                  <strong>Email</strong>
                  <span>hello@jinki.io</span>
                </div>
              </div>
              <div className="cta-contact-item">
                <Phone size={20} />
                <div>
                  <strong>Phone</strong>
                  <span>(555) 123-4567</span>
                </div>
              </div>
              <div className="cta-contact-item">
                <Clock size={20} />
                <div>
                  <strong>Response</strong>
                  <span>Within 4 hours</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div className="footer__brand">
              <a href="/" className="nav__logo">
                <svg viewBox="0 0 32 32" className="nav__logo-icon">
                  <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <circle cx="16" cy="16" r="4" fill="currentColor"/>
                </svg>
                <span className="nav__logo-text">JINKI</span>
              </a>
              <p>Critical infrastructure inspection and cybersecurity advisory.</p>
            </div>
            <div className="footer__links">
              <div>
                <h4>Services</h4>
                <a href="#capabilities">Visual Inspection</a>
                <a href="#technology">Thermal Analysis</a>
                <a href="#technology">LiDAR Mapping</a>
                <a href="#capabilities">Cyber Advisory</a>
              </div>
              <div>
                <h4>Industries</h4>
                <a href="#industries">Electric Utilities</a>
                <a href="#industries">Data Centers</a>
                <a href="#industries">Oil & Gas</a>
                <a href="#industries">Agriculture</a>
              </div>
              <div>
                <h4>Contact</h4>
                <a href="mailto:hello@jinki.io">hello@jinki.io</a>
                <a href="tel:+15551234567">(555) 123-4567</a>
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
