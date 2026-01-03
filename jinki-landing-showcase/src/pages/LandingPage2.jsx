import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Shield, Cpu, Eye, Target, Zap, Server, Building2, Leaf, Menu, X, CheckCircle2, Phone, Mail, Thermometer, Map, Radio, BarChart3, Clock, Crosshair, Layers, Mountain, Scan, Activity } from 'lucide-react'
import './LandingPage2.css'

// ============================================
// WEBGL FLUID SIMULATION
// Based on Navier-Stokes equations
// ============================================
function FluidSimulation() {
  const canvasRef = useRef(null)
  const contextRef = useRef(null)
  const particlesRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const frameRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    contextRef.current = ctx

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      particlesRef.current = []
      const count = Math.min(200, Math.floor((canvas.width * canvas.height) / 15000))

      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: 0,
          vy: 0,
          radius: Math.random() * 2 + 1,
          color: `hsla(${180 + Math.random() * 40}, 80%, 60%, ${0.1 + Math.random() * 0.2})`,
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

      // Fade trail
      ctx.fillStyle = 'rgba(8, 8, 12, 0.05)'
      ctx.fillRect(0, 0, width, height)

      const mouse = mouseRef.current
      const dx = mouse.x - mouse.px
      const dy = mouse.y - mouse.py
      const mouseSpeed = Math.sqrt(dx * dx + dy * dy)

      particlesRef.current.forEach((p, i) => {
        // Distance to mouse
        const distX = mouse.x - p.x
        const distY = mouse.y - p.y
        const dist = Math.sqrt(distX * distX + distY * distY)

        // Fluid force from mouse
        if (dist < 200 && mouseSpeed > 0.5) {
          const force = (1 - dist / 200) * mouseSpeed * 0.03
          p.vx += dx * force * 0.1
          p.vy += dy * force * 0.1
        }

        // Brownian motion
        p.vx += (Math.random() - 0.5) * 0.1
        p.vy += (Math.random() - 0.5) * 0.1

        // Damping
        p.vx *= 0.98
        p.vy *= 0.98

        // Update position
        p.x += p.vx
        p.y += p.vy

        // Wrap around edges
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        // Pulsing life
        p.life += 0.01
        const pulse = 0.5 + 0.5 * Math.sin(p.life * 2)

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()

        // Draw connections
        particlesRef.current.slice(i + 1).forEach(p2 => {
          const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(0, 210, 255, ${0.05 * (1 - d / 100)})`
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
// ASCII ART RENDERER
// Converts imagery to dynamic ASCII
// ============================================
function ASCIIRenderer({ text, animated = true }) {
  const chars = ' .:-=+*#%@'
  const containerRef = useRef(null)
  const [ascii, setAscii] = useState('')

  // Pre-defined ASCII art for drone
  const droneASCII = useMemo(() => `
      ╔══════════════════════════════════════╗
      ║     ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄     ║
      ║   ▄█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█▄   ║
      ║  ██  ╔═══╗        DJI        ╔═══╗  ██  ║
      ║ ▐█▌ ║ ◉ ║   MATRICE 400    ║ ◉ ║ ▐█▌ ║
      ║  ██  ╚═══╝        RTK        ╚═══╝  ██  ║
      ║   ▀█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█▀   ║
      ║     ▀▀▀████████████████████▀▀▀     ║
      ║         ║              ║         ║
      ║    ◈────╫──────────────╫────◈    ║
      ║   ╱ ╲   ║   ▓▓▓▓▓▓▓▓   ║   ╱ ╲   ║
      ║  ╱   ╲  ║   ▓ FLIR ▓   ║  ╱   ╲  ║
      ║ ◉     ◉ ║   ▓▓▓▓▓▓▓▓   ║ ◉     ◉ ║
      ╚══════════════════════════════════════╝
  `.trim(), [])

  const thermalASCII = useMemo(() => `
    ╔════════════════════════════════════════════╗
    ║  THERMAL SCAN ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
    ║ ┌─────────────────────────────────────────┐ ║
    ║ │ ░░░░░▒▒▒▒▓▓▓▓████████████▓▓▓▒▒▒░░░░░░ │ ║
    ║ │ ░░░▒▒▒▓▓▓████▓▓▒▒▒▒▒▒▓▓████▓▓▓▒▒▒░░░░ │ ║
    ║ │ ░░▒▒▓▓████▒▒░░░░░░░░░░░░▒▒████▓▓▒▒░░░ │ ║
    ║ │ ░▒▓▓███▒░░░░  ██████  ░░░░▒▓██▓▓▒░░░ │ ║
    ║ │ ░▒▓██▓░░░  ████▓▓████  ░░░░▓██▓▒░░░ │ ║
    ║ │ ░▓███░░░  ██▓▒87°▒▓██  ░░░░███▓░░░ │ ║
    ║ │ ░▓██▒░░  ██▓▒▒▒▒▒▒▓██  ░░░▒██▓░░░ │ ║
    ║ │ ░▓██░░░  ████▓▓████  ░░░░██▓░░░░ │ ║
    ║ │ ░▒██▒░░░░  ██████  ░░░░▒██▒░░░░░ │ ║
    ║ │ ░░▓██▒░░░░░░░░░░░░░░▒▒██▓░░░░░░░ │ ║
    ║ │ ░░░▒███▓▒░░░░░░░░░▒▓███▒░░░░░░░░ │ ║
    ║ │ ░░░░░▓████▓▓▒▒▒▓▓████▓░░░░░░░░░░ │ ║
    ║ └─────────────────────────────────────────┘ ║
    ║  TEMP RANGE: 23°C ▬▬▬▬▬▬▬▬▬▬▬▬▬▬ 120°C  ║
    ╚════════════════════════════════════════════╝
  `.trim(), [])

  const lidarASCII = useMemo(() => `
    ╔════════════════════════════════════════════╗
    ║  LIDAR POINT CLOUD ◉ 2.4M pts ◉ 45pts/m²  ║
    ║ ┌─────────────────────────────────────────┐ ║
    ║ │                 ·  ··                   │ ║
    ║ │         ·  · ··▪▪▪▪▪▪·· ·  ·          │ ║
    ║ │      · ·▪▪▪▫▫▫▫▫▫▫▫▫▫▫▫▫▪▪▪· ·       │ ║
    ║ │    ·▪▪▫▫▫░░░░░░░░░░░░░░▫▫▫▪▪·      │ ║
    ║ │   ·▪▫▫░░░░▒▒▒▒▒▒▒▒▒▒░░░░▫▫▪·     │ ║
    ║ │  ·▪▫░░▒▒▒▓▓▓▓▓▓▓▓▓▓▒▒▒░░▫▪·    │ ║
    ║ │  ·▫░░▒▓▓███████████▓▓▒░░▫·    │ ║
    ║ │  ·▫░▒▓██▀▀▀▀▀▀▀▀▀▀▀██▓▒░▫·    │ ║
    ║ │  ·▫░▒▓█▀ ELEVATION ▀█▓▒░▫·    │ ║
    ║ │  ·▪▫░░▒▓▓███████████▓▓▒░░▫▪·    │ ║
    ║ │   ·▪▫▫░░░▒▒▒▒▒▒▒▒▒▒░░░░▫▫▪·     │ ║
    ║ │    ·▪▪▫▫▫░░░░░░░░░░░░▫▫▫▪▪·      │ ║
    ║ │      · ·▪▪▪▫▫▫▫▫▫▫▫▫▫▪▪▪· ·       │ ║
    ║ └─────────────────────────────────────────┘ ║
    ║  ±2cm ACCURACY │ RTK-GPS │ ZENMUSE L2     ║
    ╚════════════════════════════════════════════╝
  `.trim(), [])

  const content = text === 'drone' ? droneASCII : text === 'thermal' ? thermalASCII : text === 'lidar' ? lidarASCII : ''

  return (
    <motion.pre
      ref={containerRef}
      className="ascii-renderer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      {content}
    </motion.pre>
  )
}

// ============================================
// LIQUID GLASS CARD
// Refractive glassmorphism with blur
// ============================================
function LiquidGlass({ children, className = '', hover = true, intensity = 1 }) {
  const cardRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    })
  }, [])

  return (
    <motion.div
      ref={cardRef}
      className={`liquid-glass ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`,
        '--intensity': intensity
      }}
    >
      <div className="liquid-glass__refraction" />
      <div className="liquid-glass__shine" style={{
        opacity: isHovered ? 0.15 : 0,
        background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.3) 0%, transparent 50%)`
      }} />
      <div className="liquid-glass__content">
        {children}
      </div>
    </motion.div>
  )
}

// ============================================
// GRADIENT TEXT - Linear.app style
// ============================================
function GradientText({ children, className = '', gradient = 'primary' }) {
  const gradients = {
    primary: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 50%, #f97316 100%)',
    thermal: 'linear-gradient(135deg, #3b82f6 0%, #f97316 50%, #ef4444 100%)',
    cyber: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #8b5cf6 100%)',
    gold: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ef4444 100%)'
  }

  return (
    <span
      className={`gradient-text ${className}`}
      style={{ backgroundImage: gradients[gradient] || gradients.primary }}
    >
      {children}
    </span>
  )
}

// ============================================
// WAVE DIVIDER - Arc.net style
// ============================================
function WaveDivider({ flip = false, color = 'var(--bg-elevated)' }) {
  return (
    <div className={`wave-divider ${flip ? 'wave-divider--flip' : ''}`}>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          fill={color}
          d="M0,64 C240,120 480,0 720,64 C960,128 1200,32 1440,64 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  )
}

// ============================================
// NOISE TEXTURE OVERLAY
// ============================================
function NoiseOverlay() {
  return <div className="noise-overlay" />
}

// ============================================
// MAGNETIC BUTTON - Frame.io style
// ============================================
function MagneticButton({ children, href, variant = 'primary', size = 'md', className = '' }) {
  const buttonRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { stiffness: 300, damping: 20 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    x.set((e.clientX - centerX) * 0.15)
    y.set((e.clientY - centerY) * 0.15)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const Component = href ? motion.a : motion.button

  return (
    <Component
      ref={buttonRef}
      href={href}
      className={`magnetic-btn magnetic-btn--${variant} magnetic-btn--${size} ${className}`}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.95 }}
    >
      <span className="magnetic-btn__bg" />
      <span className="magnetic-btn__content">{children}</span>
    </Component>
  )
}

// ============================================
// INTERACTIVE THERMAL SCANNER
// Enhanced with liquid glass
// ============================================
function ThermalScanner() {
  const containerRef = useRef(null)
  const [scanPos, setScanPos] = useState({ x: 50, y: 50 })
  const [temp, setTemp] = useState(42)
  const [isScanning, setIsScanning] = useState(false)

  const hotspots = [
    { x: 25, y: 30, temp: 94, label: 'PANEL FAULT' },
    { x: 68, y: 55, temp: 71, label: 'HOTSPOT' },
    { x: 42, y: 78, temp: 53, label: 'JUNCTION' }
  ]

  const handleMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setScanPos({ x, y })

    // Calculate temp based on proximity to hotspots
    let baseTemp = 28 + (y / 100) * 15
    hotspots.forEach(h => {
      const dist = Math.sqrt((x - h.x) ** 2 + (y - h.y) ** 2)
      if (dist < 20) {
        baseTemp += (20 - dist) * ((h.temp - baseTemp) / 20)
      }
    })
    setTemp(Math.min(120, Math.max(20, baseTemp)))
  }, [])

  const getColor = (t) => {
    if (t >= 80) return '#ef4444'
    if (t >= 60) return '#f97316'
    if (t >= 45) return '#eab308'
    return '#3b82f6'
  }

  const getStatus = (t) => {
    if (t >= 80) return 'CRITICAL'
    if (t >= 60) return 'WARNING'
    if (t >= 45) return 'ELEVATED'
    return 'NOMINAL'
  }

  return (
    <LiquidGlass className="thermal-scanner" hover={false}>
      <div
        ref={containerRef}
        className="thermal-scanner__viewport"
        onMouseMove={handleMove}
        onMouseEnter={() => setIsScanning(true)}
        onMouseLeave={() => setIsScanning(false)}
      >
        {/* Base imagery with thermal overlay */}
        <div className="thermal-scanner__layer thermal-scanner__layer--base">
          <img
            src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=90"
            alt="Solar array"
          />
        </div>

        {/* Thermal gradient overlay */}
        <div className="thermal-scanner__layer thermal-scanner__layer--thermal" />

        {/* Scan beam */}
        <div
          className="thermal-scanner__beam"
          style={{
            left: `${scanPos.x}%`,
            top: `${scanPos.y}%`,
            background: `radial-gradient(circle 120px, ${getColor(temp)}40 0%, transparent 70%)`
          }}
        />

        {/* Hotspot markers */}
        {hotspots.map((h, i) => (
          <div
            key={i}
            className="thermal-scanner__hotspot"
            style={{ left: `${h.x}%`, top: `${h.y}%`, '--hotspot-color': getColor(h.temp) }}
          >
            <span className="thermal-scanner__hotspot-ring" />
            <span className="thermal-scanner__hotspot-temp">{h.temp}°C</span>
          </div>
        ))}

        {/* HUD Overlay */}
        <div className="thermal-scanner__hud">
          <div className="thermal-hud__top-left">
            <span className="thermal-hud__badge">FLIR ZENMUSE H30T</span>
            <span className="thermal-hud__spec">1280×1024 @ 30Hz</span>
          </div>
          <div className="thermal-hud__top-right">
            <span className="thermal-hud__live">● LIVE</span>
          </div>
        </div>

        {/* Temperature scale */}
        <div className="thermal-scanner__scale">
          <div className="thermal-scale__gradient" />
          <div className="thermal-scale__labels">
            <span>120°C</span>
            <span>60°C</span>
            <span>0°C</span>
          </div>
        </div>

        {/* Scan cursor */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              className="thermal-scanner__cursor"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{ left: `${scanPos.x}%`, top: `${scanPos.y}%` }}
            >
              <Crosshair size={28} style={{ color: getColor(temp) }} />
              <div
                className="thermal-cursor__readout"
                style={{ backgroundColor: getColor(temp) }}
              >
                <span className="thermal-cursor__temp">{temp.toFixed(1)}°C</span>
                <span className="thermal-cursor__status">{getStatus(temp)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan instruction */}
        <div className="thermal-scanner__instruction">
          <Scan size={16} />
          <span>Move cursor to scan thermal signatures</span>
        </div>
      </div>
    </LiquidGlass>
  )
}

// ============================================
// LIDAR 3D VISUALIZATION
// Enhanced point cloud
// ============================================
function LiDARCloud() {
  const canvasRef = useRef(null)
  const [layer, setLayer] = useState('terrain')
  const frameRef = useRef(0)
  const pointsRef = useRef([])
  const rotationRef = useRef(0)

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

    // Generate 3D terrain points
    pointsRef.current = []
    for (let i = 0; i < 800; i++) {
      const x = (Math.random() - 0.5) * 300
      const y = (Math.random() - 0.5) * 300
      // Create terrain-like height
      const z = Math.sin(x * 0.02) * 30 + Math.cos(y * 0.02) * 30 + Math.random() * 20

      pointsRef.current.push({ x, y, z, size: Math.random() * 2 + 1 })
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 10, 0.15)'
      ctx.fillRect(0, 0, w, h)

      rotationRef.current += 0.003
      const cos = Math.cos(rotationRef.current)
      const sin = Math.sin(rotationRef.current)

      // Sort by z for depth
      const projected = pointsRef.current.map(p => {
        // Rotate
        const rx = p.x * cos - p.y * sin
        const ry = p.x * sin + p.y * cos

        // Project to 2D with perspective
        const scale = 400 / (400 + p.z * 0.5)
        const px = cx + rx * scale
        const py = cy + ry * scale * 0.6 - p.z * 0.8

        return { ...p, px, py, scale, depth: ry }
      }).sort((a, b) => a.depth - b.depth)

      projected.forEach(p => {
        const elevation = (p.z + 50) / 100

        // Color based on layer
        let hue, sat, light
        if (layer === 'terrain') {
          hue = 120 + elevation * 60 // Green to yellow
          sat = 70
          light = 40 + elevation * 30
        } else if (layer === 'vegetation') {
          hue = 90 + elevation * 40
          sat = 80
          light = 30 + elevation * 40
        } else {
          hue = 200 + elevation * 80 // Blue to purple
          sat = 70
          light = 50 + elevation * 20
        }

        ctx.beginPath()
        ctx.arc(p.px, p.py, p.size * p.scale, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${0.4 + p.scale * 0.3})`
        ctx.fill()
      })

      // Grid lines
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.1)'
      ctx.lineWidth = 0.5
      for (let i = 0; i < 10; i++) {
        ctx.beginPath()
        ctx.moveTo(0, h * i / 10)
        ctx.lineTo(w, h * i / 10)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(w * i / 10, 0)
        ctx.lineTo(w * i / 10, h)
        ctx.stroke()
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(frameRef.current)
  }, [layer])

  return (
    <LiquidGlass className="lidar-cloud" hover={false}>
      <div className="lidar-cloud__viewport">
        <canvas ref={canvasRef} className="lidar-cloud__canvas" />

        {/* Data overlay */}
        <div className="lidar-cloud__data">
          <div className="lidar-data__item">
            <span>Points</span>
            <strong>2.4M</strong>
          </div>
          <div className="lidar-data__item">
            <span>Density</span>
            <strong>45 pts/m²</strong>
          </div>
          <div className="lidar-data__item">
            <span>Accuracy</span>
            <strong>±2 cm</strong>
          </div>
        </div>

        {/* Layer badge */}
        <div className="lidar-cloud__badge">
          <Activity size={14} />
          <span>ZENMUSE L2</span>
        </div>
      </div>

      {/* Layer controls */}
      <div className="lidar-cloud__controls">
        {['terrain', 'vegetation', 'structures'].map(l => (
          <button
            key={l}
            className={layer === l ? 'active' : ''}
            onClick={() => setLayer(l)}
          >
            {l === 'terrain' && <Mountain size={16} />}
            {l === 'vegetation' && <Leaf size={16} />}
            {l === 'structures' && <Layers size={16} />}
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>
    </LiquidGlass>
  )
}

// ============================================
// LOGO
// ============================================
function Logo({ variant = 'default' }) {
  return (
    <a href="/" className={`logo logo--${variant}`}>
      <div className="logo__mark">
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M20 4L36 13V27L20 36L4 27V13L20 4Z" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="20" cy="20" r="6" fill="currentColor"/>
          <path d="M20 8V14M20 26V32M8 14L14 17.5M26 22.5L32 26M8 26L14 22.5M26 17.5L32 14"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const capabilities = [
    {
      icon: <Eye size={24} />,
      title: 'Visual Inspection',
      description: '4K aerial imagery with AI-powered defect detection',
      stat: '99.8%',
      statLabel: 'Detection Rate'
    },
    {
      icon: <Thermometer size={24} />,
      title: 'Thermal Analysis',
      description: 'FLIR radiometric imaging with 1280×1024 resolution',
      stat: '±0.03°C',
      statLabel: 'Sensitivity'
    },
    {
      icon: <Map size={24} />,
      title: 'LiDAR Mapping',
      description: 'Survey-grade 3D point clouds with centimeter accuracy',
      stat: '45 pts/m²',
      statLabel: 'Density'
    },
    {
      icon: <Shield size={24} />,
      title: 'Cyber Advisory',
      description: 'Zero Trust architecture for critical infrastructure',
      stat: 'Zero',
      statLabel: 'Breaches'
    }
  ]

  const industries = [
    { icon: <Zap />, name: 'Electric Utilities', stat: 'Top 20 US Utilities' },
    { icon: <Server />, name: 'Data Centers', stat: 'Hyperscale Ready' },
    { icon: <Building2 />, name: 'Oil & Gas', stat: '3 Continents' },
    { icon: <Leaf />, name: 'Agriculture', stat: '500K+ Acres' }
  ]

  const certs = [
    { abbr: 'CISSP', full: 'Certified Information Systems Security Professional' },
    { abbr: 'CCSP', full: 'Certified Cloud Security Professional' },
    { abbr: 'AIGP', full: 'AI Governance Professional' },
    { abbr: 'PMP', full: 'Project Management Professional' }
  ]

  const droneSpecs = [
    { value: '59 min', label: 'Flight Time' },
    { value: '6 kg', label: 'Payload' },
    { value: '20 km', label: 'Range' },
    { value: '15 m/s', label: 'Wind Resist' }
  ]

  return (
    <div className="jinki-v2">
      {/* Fluid simulation background */}
      <FluidSimulation />
      <NoiseOverlay />

      {/* Navigation */}
      <header className={`nav-v2 ${scrolled ? 'nav-v2--scrolled' : ''}`}>
        <div className="nav-v2__container">
          <Logo />

          <nav className={`nav-v2__menu ${menuOpen ? 'nav-v2__menu--open' : ''}`}>
            <a href="#capabilities">Capabilities</a>
            <a href="#thermal">Technology</a>
            <a href="#industries">Industries</a>
            <a href="#about">About</a>
          </nav>

          <div className="nav-v2__actions">
            <a href="tel:+15551234567" className="nav-v2__phone">
              <Phone size={16} />
              <span>(555) 123-4567</span>
            </a>
            <MagneticButton href="#contact" variant="primary" size="sm">
              Get Quote
            </MagneticButton>
            <button className="nav-v2__toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="hero-v2">
        <motion.div className="hero-v2__content" style={{ opacity: heroOpacity, y: heroY }}>
          {/* Drone specs badge */}
          <motion.div
            className="hero-v2__badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="hero-badge__label">DJI Matrice 400 RTK</span>
            <div className="hero-badge__specs">
              {droneSpecs.map((s, i) => (
                <div key={i} className="hero-badge__spec">
                  <span className="hero-badge__value">{s.value}</span>
                  <span className="hero-badge__sublabel">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            className="hero-v2__title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Critical Infrastructure
            <br />
            <GradientText>Deserves Critical Attention</GradientText>
          </motion.h1>

          <motion.p
            className="hero-v2__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Enterprise-grade drone inspection with thermal imaging, LiDAR mapping,
            and AI-powered analytics for utilities, data centers, and critical operations.
          </motion.p>

          <motion.div
            className="hero-v2__cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <MagneticButton href="#contact" variant="primary" size="lg">
              Schedule Inspection
              <ArrowRight size={20} />
            </MagneticButton>
            <MagneticButton href="#thermal" variant="ghost" size="lg">
              <Play size={18} />
              Watch Demo
            </MagneticButton>
          </motion.div>

          {/* ASCII Drone art */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="hero-v2__ascii"
          >
            <ASCIIRenderer text="drone" />
          </motion.div>
        </motion.div>

        {/* Metrics bar */}
        <motion.div
          className="hero-v2__metrics"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <LiquidGlass className="hero-metrics__card">
            <div className="hero-metrics__grid">
              <div className="hero-metric">
                <BarChart3 size={20} />
                <div>
                  <span className="hero-metric__value">2.4M+</span>
                  <span className="hero-metric__label">Acres Surveyed</span>
                </div>
              </div>
              <div className="hero-metric">
                <Target size={20} />
                <div>
                  <span className="hero-metric__value">99.8%</span>
                  <span className="hero-metric__label">Detection Rate</span>
                </div>
              </div>
              <div className="hero-metric">
                <Clock size={20} />
                <div>
                  <span className="hero-metric__value">&lt; 24hr</span>
                  <span className="hero-metric__label">Report Delivery</span>
                </div>
              </div>
              <div className="hero-metric">
                <Shield size={20} />
                <div>
                  <span className="hero-metric__value">Zero</span>
                  <span className="hero-metric__label">Security Breaches</span>
                </div>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>

        <a href="#capabilities" className="hero-v2__scroll">
          <span>Explore</span>
          <ChevronDown size={20} />
        </a>
      </section>

      <WaveDivider color="var(--bg-section)" />

      {/* Capabilities */}
      <section id="capabilities" className="section-v2 capabilities-v2">
        <div className="container-v2">
          <div className="section-header-v2">
            <span className="section-tag-v2">What We Do</span>
            <h2>Four Pillars of <GradientText>Operational Intelligence</GradientText></h2>
            <p>From thermal anomaly detection to survey-grade LiDAR—we protect what matters most.</p>
          </div>

          <div className="capabilities-v2__grid">
            {capabilities.map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <LiquidGlass className="capability-card-v2">
                  <div className="capability-card-v2__icon">{cap.icon}</div>
                  <h3>{cap.title}</h3>
                  <p>{cap.description}</p>
                  <div className="capability-card-v2__stat">
                    <span className="capability-stat__value">{cap.stat}</span>
                    <span className="capability-stat__label">{cap.statLabel}</span>
                  </div>
                </LiquidGlass>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Thermal Section */}
      <section id="thermal" className="section-v2 thermal-v2">
        <div className="container-v2">
          <div className="thermal-v2__layout">
            <div className="thermal-v2__content">
              <span className="section-tag-v2">Thermal Imaging</span>
              <h2>See What <GradientText gradient="thermal">Others Miss</GradientText></h2>
              <p className="thermal-v2__lead">
                Move your cursor over the solar array to scan temperatures in real-time.
                Our FLIR Zenmuse H30T detects anomalies invisible to the naked eye.
              </p>

              <div className="thermal-v2__features">
                <div className="thermal-feature">
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>1280×1024 Resolution</strong>
                    <span>4× the detail of previous generation</span>
                  </div>
                </div>
                <div className="thermal-feature">
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>±0.03°C Sensitivity</strong>
                    <span>Detect micro-temperature differentials</span>
                  </div>
                </div>
                <div className="thermal-feature">
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Real-Time AI Analysis</strong>
                    <span>Critical issues flagged during flight</span>
                  </div>
                </div>
              </div>

              {/* ASCII thermal art */}
              <div className="thermal-v2__ascii">
                <ASCIIRenderer text="thermal" />
              </div>
            </div>

            <div className="thermal-v2__scanner">
              <ThermalScanner />
            </div>
          </div>
        </div>
      </section>

      {/* LiDAR Section */}
      <section className="section-v2 lidar-v2">
        <div className="container-v2">
          <div className="lidar-v2__layout">
            <div className="lidar-v2__cloud">
              <LiDARCloud />
            </div>

            <div className="lidar-v2__content">
              <span className="section-tag-v2">LiDAR Mapping</span>
              <h2>Survey-Grade <GradientText gradient="cyber">3D Point Clouds</GradientText></h2>
              <p className="lidar-v2__lead">
                Zenmuse L2 LiDAR captures millions of data points per second,
                creating engineering-grade terrain models and vegetation analysis.
              </p>

              <div className="lidar-v2__deliverables">
                <div className="lidar-deliverable">
                  <Map size={20} />
                  <span>Digital Terrain Models</span>
                </div>
                <div className="lidar-deliverable">
                  <Mountain size={20} />
                  <span>Contour Mapping</span>
                </div>
                <div className="lidar-deliverable">
                  <Layers size={20} />
                  <span>Vegetation Classification</span>
                </div>
                <div className="lidar-deliverable">
                  <Target size={20} />
                  <span>Volumetric Analysis</span>
                </div>
              </div>

              {/* ASCII LiDAR art */}
              <div className="lidar-v2__ascii">
                <ASCIIRenderer text="lidar" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider flip color="var(--bg-dark)" />

      {/* Industries */}
      <section id="industries" className="section-v2 industries-v2">
        <div className="container-v2">
          <div className="section-header-v2 section-header-v2--center">
            <span className="section-tag-v2">Industries</span>
            <h2>Built for <GradientText gradient="gold">Critical Operations</GradientText></h2>
            <p>We specialize in sectors where downtime isn't an inconvenience—it's a crisis.</p>
          </div>

          <div className="industries-v2__grid">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <LiquidGlass className="industry-card-v2">
                  <div className="industry-card-v2__icon">{ind.icon}</div>
                  <h3>{ind.name}</h3>
                  <span className="industry-card-v2__stat">{ind.stat}</span>
                </LiquidGlass>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Credentials */}
      <section id="about" className="section-v2 about-v2">
        <div className="container-v2">
          <div className="about-v2__layout">
            <div className="about-v2__content">
              <span className="section-tag-v2">About Us</span>
              <h2>15 Years Protecting <GradientText>Critical Infrastructure</GradientText></h2>
              <p className="about-v2__lead">
                We're not just drone operators. We're infrastructure specialists
                who understand that a single point of failure can affect millions.
              </p>
              <p>
                Our team combines FAA Part 107 certified pilots, FLIR thermographers,
                and cybersecurity professionals with deep experience in utility,
                energy, and government sectors.
              </p>
            </div>

            <div className="about-v2__certs">
              {certs.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <LiquidGlass className="cert-card-v2">
                    <span className="cert-card-v2__abbr">{c.abbr}</span>
                    <span className="cert-card-v2__full">{c.full}</span>
                  </LiquidGlass>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="section-v2 cta-v2">
        <div className="container-v2">
          <LiquidGlass className="cta-v2__card" intensity={1.5}>
            <h2>Ready to See What You've Been <GradientText>Missing?</GradientText></h2>
            <p>
              Schedule a 30-minute discovery call. We'll discuss your infrastructure,
              your challenges, and whether we're the right fit.
            </p>
            <MagneticButton href="mailto:hello@jinki.io" variant="primary" size="xl">
              Schedule Discovery Call
              <ArrowRight size={24} />
            </MagneticButton>
            <span className="cta-v2__note">Usually respond within 4 hours</span>
          </LiquidGlass>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-v2">
        <div className="container-v2">
          <div className="footer-v2__main">
            <div className="footer-v2__brand">
              <Logo variant="light" />
              <p>Critical infrastructure inspection powered by DJI Matrice 400 RTK.</p>
              <div className="footer-v2__contact">
                <a href="mailto:hello@jinki.io"><Mail size={16} /> hello@jinki.io</a>
                <a href="tel:+15551234567"><Phone size={16} /> (555) 123-4567</a>
              </div>
            </div>

            <div className="footer-v2__nav">
              <div>
                <h4>Technology</h4>
                <a href="#thermal">Thermal Imaging</a>
                <a href="#capabilities">LiDAR Mapping</a>
                <a href="#capabilities">Visual Inspection</a>
              </div>
              <div>
                <h4>Industries</h4>
                <a href="#industries">Electric Utilities</a>
                <a href="#industries">Data Centers</a>
                <a href="#industries">Oil & Gas</a>
              </div>
              <div>
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
              </div>
            </div>
          </div>

          <div className="footer-v2__bottom">
            <span>© 2026 Jinki Intelligence. All rights reserved.</span>
            <div className="footer-v2__certs">
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
