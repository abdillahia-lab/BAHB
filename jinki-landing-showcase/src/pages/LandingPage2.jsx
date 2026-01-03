import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Shield, Cpu, Eye, Target, Zap, Server, Building2, Leaf, Menu, X, CheckCircle2, Phone, Mail, Thermometer, Map, Radio, BarChart3, Clock, Crosshair, Layers, Mountain } from 'lucide-react'
import './LandingPage2.css'

// 4K High-Resolution Images
const IMAGES = {
  // DJI Matrice 400 RTK - Using DJI's official enterprise CDN
  matrice400: 'https://dji-official-fe.djicdn.com/dps/7a9a7e3b3c3f4c8a9e1b2c3d4e5f6a7b.jpg',
  // Fallback to high-quality enterprise drone images
  enterpriseDrone: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=3840&q=95',
  droneClose: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=3840&q=95',

  // 4K Infrastructure images
  solarFarm4K: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=3840&q=95',
  powerLines4K: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=3840&q=95',
  dataCenter4K: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=3840&q=95',

  // Topography & Mapping
  topography: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=3840&q=95',
  aerialTerrain: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=3840&q=95',
  mountainAerial: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=3840&q=95',
  valleyAerial: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=3840&q=95',

  // Industries 4K
  agriculture4K: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=3840&q=95',
  oilGas4K: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=3840&q=95',

  // Team
  team4K: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=3840&q=95',
}

// ============================================
// PROFESSIONAL LOGO
// ============================================
function Logo({ variant = 'default' }) {
  return (
    <a href="/" className={`logo logo--${variant}`}>
      <div className="logo__icon">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <circle cx="16" cy="16" r="5" fill="currentColor"/>
          <path d="M16 6V11M16 21V26M6 11L11 14M21 18L26 21M6 21L11 18M21 14L26 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="logo__text">
        <span className="logo__name">JINKI</span>
        <span className="logo__tagline">Intelligence</span>
      </div>
    </a>
  )
}

// ============================================
// INTERACTIVE THERMAL SOLAR PANEL
// Mouse position determines temperature reading
// ============================================
function InteractiveThermalPanel() {
  const containerRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [temperature, setTemperature] = useState(45)
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = useCallback((e) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setMousePos({ x, y })

    // Temperature calculation based on position
    // Hotspots in certain areas
    const distFromHotspot1 = Math.sqrt(Math.pow(x - 30, 2) + Math.pow(y - 25, 2))
    const distFromHotspot2 = Math.sqrt(Math.pow(x - 70, 2) + Math.pow(y - 60, 2))
    const distFromHotspot3 = Math.sqrt(Math.pow(x - 45, 2) + Math.pow(y - 75, 2))

    let temp = 35 + (y / 100) * 20 // Base temperature gradient

    // Add heat from hotspots
    if (distFromHotspot1 < 20) temp += (20 - distFromHotspot1) * 3
    if (distFromHotspot2 < 15) temp += (15 - distFromHotspot2) * 4
    if (distFromHotspot3 < 18) temp += (18 - distFromHotspot3) * 2.5

    setTemperature(Math.min(120, Math.max(25, temp)))
  }, [])

  const getTemperatureColor = (temp) => {
    if (temp >= 80) return '#ff0000'
    if (temp >= 60) return '#ff6600'
    if (temp >= 45) return '#ffcc00'
    return '#00aaff'
  }

  const getTemperatureStatus = (temp) => {
    if (temp >= 80) return 'CRITICAL'
    if (temp >= 60) return 'WARNING'
    if (temp >= 45) return 'ELEVATED'
    return 'NORMAL'
  }

  return (
    <div
      ref={containerRef}
      className="thermal-interactive"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Solar Panel Base Image */}
      <div className="thermal-interactive__image">
        <img src={IMAGES.solarFarm4K} alt="Solar farm thermal scan" />

        {/* Dynamic thermal overlay based on mouse position */}
        <div
          className="thermal-interactive__heat-overlay"
          style={{
            background: `radial-gradient(circle 200px at ${mousePos.x}% ${mousePos.y}%,
              ${getTemperatureColor(temperature)}40 0%,
              transparent 70%)`
          }}
        />

        {/* Thermal gradient overlay */}
        <div className="thermal-interactive__gradient" />

        {/* Fixed hotspots */}
        <div className="thermal-hotspot thermal-hotspot--critical" style={{ top: '25%', left: '30%' }}>
          <div className="thermal-hotspot__ring" />
          <span>87.3°C</span>
        </div>
        <div className="thermal-hotspot thermal-hotspot--warning" style={{ top: '60%', left: '70%' }}>
          <div className="thermal-hotspot__ring" />
          <span>62.1°C</span>
        </div>
        <div className="thermal-hotspot thermal-hotspot--elevated" style={{ top: '75%', left: '45%' }}>
          <div className="thermal-hotspot__ring" />
          <span>48.7°C</span>
        </div>
      </div>

      {/* Glassmorphism HUD */}
      <div className="thermal-interactive__hud">
        <div className="thermal-hud__top">
          <div className="thermal-hud__camera">
            <span className="thermal-hud__label">FLIR ZENMUSE H30T</span>
            <span className="thermal-hud__spec">1280×1024 | 30Hz</span>
          </div>
          <div className="thermal-hud__time">
            {new Date().toLocaleTimeString()} UTC
          </div>
        </div>

        {/* Temperature scale */}
        <div className="thermal-hud__scale">
          <div className="thermal-hud__scale-gradient" />
          <div className="thermal-hud__scale-labels">
            <span>120°C</span>
            <span>80°C</span>
            <span>40°C</span>
            <span>0°C</span>
          </div>
        </div>
      </div>

      {/* Mouse-following temperature readout */}
      <AnimatePresence>
        {isHovering && (
          <motion.div
            className="thermal-interactive__cursor"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              left: `${mousePos.x}%`,
              top: `${mousePos.y}%`,
              borderColor: getTemperatureColor(temperature)
            }}
          >
            <div className="thermal-cursor__crosshair">
              <Crosshair size={24} style={{ color: getTemperatureColor(temperature) }} />
            </div>
            <div
              className="thermal-cursor__readout"
              style={{ backgroundColor: getTemperatureColor(temperature) }}
            >
              <span className="thermal-cursor__temp">{temperature.toFixed(1)}°C</span>
              <span className="thermal-cursor__status">{getTemperatureStatus(temperature)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruction */}
      <div className="thermal-interactive__hint">
        <Mouse size={16} />
        <span>Move cursor to scan temperature</span>
      </div>
    </div>
  )
}

// Simple mouse icon
function Mouse({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="3" width="12" height="18" rx="6" />
      <line x1="12" y1="7" x2="12" y2="11" />
    </svg>
  )
}

// ============================================
// LIDAR POINT CLOUD VISUALIZATION
// ============================================
function LiDARVisualization() {
  const [activeLayer, setActiveLayer] = useState('terrain')
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width = canvas.offsetWidth * 2
    const height = canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    let animationId
    let points = []

    // Generate point cloud
    for (let i = 0; i < 500; i++) {
      points.push({
        x: Math.random() * (width / 2),
        y: Math.random() * (height / 2),
        z: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        hue: Math.random() * 60 + 180 // Blue to cyan
      })
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.1)'
      ctx.fillRect(0, 0, width / 2, height / 2)

      points.forEach(point => {
        // Update position
        point.x += point.vx
        point.y += point.vy

        // Bounce off edges
        if (point.x < 0 || point.x > width / 2) point.vx *= -1
        if (point.y < 0 || point.y > height / 2) point.vy *= -1

        // Draw point
        const elevation = point.z / 100
        const hue = activeLayer === 'terrain'
          ? 120 + elevation * 60 // Green to yellow
          : activeLayer === 'vegetation'
          ? 90 + elevation * 30 // Green shades
          : 200 + elevation * 60 // Blue to purple

        ctx.beginPath()
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue}, 80%, ${50 + elevation * 30}%, ${0.6 + elevation * 0.4})`
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationId)
  }, [activeLayer])

  return (
    <div className="lidar-viz">
      <div className="lidar-viz__display">
        <canvas ref={canvasRef} className="lidar-viz__canvas" />

        {/* Grid overlay */}
        <div className="lidar-viz__grid" />

        {/* Data overlay */}
        <div className="lidar-viz__data">
          <div className="lidar-data__row">
            <span>Points</span>
            <span className="lidar-data__value">2.4M</span>
          </div>
          <div className="lidar-data__row">
            <span>Density</span>
            <span className="lidar-data__value">45 pts/m²</span>
          </div>
          <div className="lidar-data__row">
            <span>Accuracy</span>
            <span className="lidar-data__value">±2 cm</span>
          </div>
          <div className="lidar-data__row">
            <span>Coverage</span>
            <span className="lidar-data__value">12.4 km²</span>
          </div>
        </div>
      </div>

      {/* Layer controls */}
      <div className="lidar-viz__controls">
        <button
          className={activeLayer === 'terrain' ? 'active' : ''}
          onClick={() => setActiveLayer('terrain')}
        >
          <Mountain size={16} />
          Terrain
        </button>
        <button
          className={activeLayer === 'vegetation' ? 'active' : ''}
          onClick={() => setActiveLayer('vegetation')}
        >
          <Leaf size={16} />
          Vegetation
        </button>
        <button
          className={activeLayer === 'structures' ? 'active' : ''}
          onClick={() => setActiveLayer('structures')}
        >
          <Layers size={16} />
          Structures
        </button>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
function LandingPage2() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const capabilities = [
    {
      icon: <Eye size={24} />,
      title: 'Visual Inspection',
      description: '4K aerial imagery with AI-powered defect detection using DJI Matrice 400 RTK.',
      image: IMAGES.droneClose
    },
    {
      icon: <Thermometer size={24} />,
      title: 'Thermal Analysis',
      description: 'FLIR Zenmuse H30T radiometric imaging with 1280×1024 resolution.',
      image: IMAGES.solarFarm4K
    },
    {
      icon: <Map size={24} />,
      title: 'LiDAR Mapping',
      description: 'Zenmuse L2 LiDAR with 45 pts/m² density and centimeter-level accuracy.',
      image: IMAGES.topography
    },
    {
      icon: <Shield size={24} />,
      title: 'Cyber Advisory',
      description: 'CISSP-certified team builds Zero Trust security for critical infrastructure.',
      image: IMAGES.dataCenter4K
    }
  ]

  const industries = [
    {
      icon: <Zap size={32} />,
      name: 'Electric Utilities',
      description: 'Power line, substation, and transmission tower inspection',
      image: IMAGES.powerLines4K,
      stat: '12 of Top 20 US Utilities'
    },
    {
      icon: <Server size={32} />,
      name: 'Data Centers',
      description: 'Thermal monitoring and security assessment',
      image: IMAGES.dataCenter4K,
      stat: 'Hyperscale Operators'
    },
    {
      icon: <Building2 size={32} />,
      name: 'Oil & Gas',
      description: 'Pipeline, refinery, and offshore platform inspection',
      image: IMAGES.oilGas4K,
      stat: '3 Continents'
    },
    {
      icon: <Leaf size={32} />,
      name: 'Agriculture',
      description: 'Crop health, irrigation, and yield optimization',
      image: IMAGES.agriculture4K,
      stat: '500,000+ Acres'
    }
  ]

  const metrics = [
    { icon: <BarChart3 size={24} />, value: '2.4M+', label: 'Acres Surveyed' },
    { icon: <Target size={24} />, value: '99.8%', label: 'Detection Rate' },
    { icon: <Clock size={24} />, value: '< 24hr', label: 'Report Delivery' },
    { icon: <Shield size={24} />, value: 'Zero', label: 'Security Breaches' }
  ]

  const credentials = [
    { abbr: 'CISSP', full: 'Certified Information Systems Security Professional', desc: 'The gold standard. Only 150,000 worldwide.' },
    { abbr: 'CCSP', full: 'Certified Cloud Security Professional', desc: 'Protecting hybrid cloud infrastructure.' },
    { abbr: 'AIGP', full: 'AI Governance Professional', desc: 'Ethical AI implementation and compliance.' },
    { abbr: 'PMP', full: 'Project Management Professional', desc: 'On-time, on-budget delivery.' }
  ]

  const droneSpecs = [
    { label: 'Flight Time', value: '59 min' },
    { label: 'Payload', value: '6 kg' },
    { label: 'Transmission', value: '20 km' },
    { label: 'Wind Resistance', value: '15 m/s' }
  ]

  return (
    <div className="jinki">
      {/* Navigation */}
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__container">
          <Logo />
          <nav className={`nav__menu ${menuOpen ? 'nav__menu--open' : ''}`}>
            <a href="#capabilities">Capabilities</a>
            <a href="#thermal">Technology</a>
            <a href="#industries">Industries</a>
            <a href="#about">About</a>
          </nav>
          <div className="nav__actions">
            <a href="tel:+1234567890" className="nav__phone">
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

      {/* Hero with DJI Matrice 400 */}
      <section ref={heroRef} className="hero">
        <motion.div className="hero__bg" style={{ scale: heroScale }}>
          <img src={IMAGES.enterpriseDrone} alt="DJI Matrice 400 RTK drone" />
          <div className="hero__gradient" />
        </motion.div>

        <motion.div className="hero__content" style={{ opacity: heroOpacity }}>
          <motion.div
            className="hero__drone-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="hero__drone-model">DJI Matrice 400 RTK</span>
            <div className="hero__drone-specs">
              {droneSpecs.map((spec, i) => (
                <div key={i} className="hero__drone-spec">
                  <span className="hero__drone-spec-value">{spec.value}</span>
                  <span className="hero__drone-spec-label">{spec.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.h1
            className="hero__title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Critical Infrastructure
            <span>Deserves Critical Attention</span>
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Enterprise-grade drone inspection powered by the DJI Matrice 400 RTK
            with thermal, LiDAR, and 4K visual payloads.
          </motion.p>

          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <a href="#contact" className="btn btn--primary btn--lg">
              Schedule Inspection
              <ArrowRight size={20} />
            </a>
            <a href="#thermal" className="btn btn--ghost btn--lg">
              <Play size={18} />
              See Technology
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero__metrics"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {metrics.map((m, i) => (
            <div key={i} className="hero__metric">
              {m.icon}
              <div>
                <span className="hero__metric-value">{m.value}</span>
                <span className="hero__metric-label">{m.label}</span>
              </div>
            </div>
          ))}
        </motion.div>

        <a href="#capabilities" className="hero__scroll">
          <span>Explore</span>
          <ChevronDown size={20} />
        </a>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="capabilities">
        <div className="container">
          <div className="section-header section-header--center">
            <span className="section-tag">What We Do</span>
            <h2>Four Pillars of Operational Intelligence</h2>
            <p>From thermal anomaly detection to LiDAR mapping—we protect what matters most.</p>
          </div>

          <div className="capabilities__grid">
            {capabilities.map((cap, i) => (
              <motion.div
                key={i}
                className="capability"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="capability__image">
                  <img src={cap.image} alt={cap.title} />
                  <div className="capability__icon">{cap.icon}</div>
                </div>
                <div className="capability__content">
                  <h3>{cap.title}</h3>
                  <p>{cap.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Thermal Section */}
      <section id="thermal" className="thermal-section">
        <div className="container">
          <div className="thermal-section__layout">
            <div className="thermal-section__content">
              <span className="section-tag">Thermal Imaging</span>
              <h2>See What Others Miss</h2>
              <p className="lead">
                Move your cursor over the solar farm to scan temperatures in real-time.
                Our FLIR Zenmuse H30T detects anomalies invisible to the naked eye.
              </p>
              <ul className="feature-list">
                <li>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>1280×1024 Resolution</strong>
                    <span>4× the detail of previous generation</span>
                  </div>
                </li>
                <li>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>±0.03°C Sensitivity</strong>
                    <span>Detect micro-temperature differentials</span>
                  </div>
                </li>
                <li>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Real-Time Analysis</strong>
                    <span>AI flags critical issues during flight</span>
                  </div>
                </li>
              </ul>
            </div>
            <InteractiveThermalPanel />
          </div>
        </div>
      </section>

      {/* LiDAR & Topography Section */}
      <section className="lidar-section">
        <div className="container">
          <div className="lidar-section__layout">
            <LiDARVisualization />
            <div className="lidar-section__content">
              <span className="section-tag">LiDAR Mapping</span>
              <h2>Survey-Grade 3D Point Clouds</h2>
              <p className="lead">
                Zenmuse L2 LiDAR captures millions of data points per second,
                creating engineering-grade terrain models and vegetation analysis.
              </p>
              <div className="deliverables">
                <div className="deliverable">
                  <Map size={20} />
                  <span>Digital Terrain Models</span>
                </div>
                <div className="deliverable">
                  <Mountain size={20} />
                  <span>Contour Mapping</span>
                </div>
                <div className="deliverable">
                  <Layers size={20} />
                  <span>Vegetation Classification</span>
                </div>
                <div className="deliverable">
                  <Target size={20} />
                  <span>Volumetric Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Topography Showcase */}
      <section className="topography-section">
        <div className="topography-section__bg">
          <img src={IMAGES.mountainAerial} alt="Aerial topography" />
          <div className="topography-section__overlay" />
        </div>
        <div className="container">
          <div className="topography-section__content">
            <span className="section-tag">Precision Surveying</span>
            <h2>Centimeter-Level Accuracy</h2>
            <p>
              RTK-GPS integration delivers ±2cm positional accuracy for
              engineering-grade deliverables across any terrain.
            </p>
            <div className="topography-section__stats">
              <div className="topo-stat">
                <span className="topo-stat__value">±2 cm</span>
                <span className="topo-stat__label">RTK Accuracy</span>
              </div>
              <div className="topo-stat">
                <span className="topo-stat__value">45 pts/m²</span>
                <span className="topo-stat__label">Point Density</span>
              </div>
              <div className="topo-stat">
                <span className="topo-stat__value">240 m</span>
                <span className="topo-stat__label">Max Range</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="industries">
        <div className="container">
          <div className="section-header section-header--center">
            <span className="section-tag">Industries</span>
            <h2>Built for Critical Operations</h2>
            <p>We specialize in sectors where downtime isn't an inconvenience—it's a crisis.</p>
          </div>

          <div className="industries__grid">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                className="industry"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="industry__image">
                  <img src={ind.image} alt={ind.name} />
                  <div className="industry__overlay" />
                </div>
                <div className="industry__content">
                  <div className="industry__icon">{ind.icon}</div>
                  <h3>{ind.name}</h3>
                  <p>{ind.description}</p>
                  <span className="industry__stat">{ind.stat}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Credentials */}
      <section id="about" className="about">
        <div className="container">
          <div className="about__layout">
            <div className="about__image">
              <img src={IMAGES.team4K} alt="Jinki Intelligence team" />
            </div>
            <div className="about__content">
              <span className="section-tag">About Us</span>
              <h2>15 Years Protecting Critical Infrastructure</h2>
              <p className="lead">
                We're not just drone operators. We're infrastructure specialists
                who understand that a single point of failure can affect millions.
              </p>
              <p>
                Our team combines FAA Part 107 certified pilots, FLIR thermographers,
                and cybersecurity professionals with deep experience in utility,
                energy, and government sectors.
              </p>

              <div className="credentials">
                {credentials.map((cred, i) => (
                  <motion.div
                    key={i}
                    className="credential"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="credential__badge">{cred.abbr}</div>
                    <div className="credential__info">
                      <strong>{cred.full}</strong>
                      <span>{cred.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="cta">
        <div className="container">
          <div className="cta__content">
            <h2>Ready to See What You've Been Missing?</h2>
            <p>
              Schedule a 30-minute discovery call. We'll discuss your infrastructure,
              your challenges, and whether we're the right fit.
            </p>
            <a href="mailto:hello@jinki.io" className="btn btn--primary btn--xl">
              Schedule Discovery Call
              <ArrowRight size={24} />
            </a>
            <span className="cta__note">Usually respond within 4 hours</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__main">
            <div className="footer__brand">
              <Logo variant="light" />
              <p>Critical infrastructure inspection powered by DJI Matrice 400 RTK with thermal, LiDAR, and 4K visual capabilities.</p>
              <div className="footer__contact">
                <a href="mailto:hello@jinki.io"><Mail size={16} /> hello@jinki.io</a>
                <a href="tel:+15551234567"><Phone size={16} /> (555) 123-4567</a>
              </div>
            </div>
            <div className="footer__nav">
              <div>
                <h4>Technology</h4>
                <a href="#capabilities">Visual Inspection</a>
                <a href="#thermal">Thermal Imaging</a>
                <a href="#thermal">LiDAR Mapping</a>
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
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
                <a href="#">Careers</a>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© 2026 Jinki Intelligence. All rights reserved.</span>
            <div className="footer__certs">
              {['CISSP', 'CCSP', 'AIGP', 'PMP'].map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage2
