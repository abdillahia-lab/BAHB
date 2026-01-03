import { useState, useEffect, useRef, useLayoutEffect, Suspense, lazy } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './LandingPage3.css'

// Lazy load Spline for performance
const Spline = lazy(() => import('@splinetool/react-spline'))

gsap.registerPlugin(ScrollTrigger)

// ============================================
// WEBGL FLUID METABALLS BACKGROUND
// ============================================
function FluidBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const width = () => canvas.width
    const height = () => canvas.height

    // Metaballs with varied colors
    const balls = [
      { x: 0.2, y: 0.3, radius: 200, vx: 0.3, vy: 0.2, color: [0, 212, 255] },
      { x: 0.8, y: 0.2, radius: 180, vx: -0.25, vy: 0.4, color: [99, 102, 241] },
      { x: 0.5, y: 0.7, radius: 190, vx: 0.2, vy: -0.35, color: [139, 92, 246] },
      { x: 0.3, y: 0.85, radius: 150, vx: 0.4, vy: 0.15, color: [0, 212, 255] },
      { x: 0.7, y: 0.6, radius: 130, vx: -0.3, vy: -0.2, color: [99, 102, 241] },
      { x: 0.15, y: 0.5, radius: 110, vx: 0.2, vy: 0.3, color: [139, 92, 246] },
    ]

    let mouseX = 0.5
    let mouseY = 0.5
    let time = 0

    const handleMouseMove = (e) => {
      mouseX = e.clientX / window.innerWidth
      mouseY = e.clientY / window.innerHeight
    }
    window.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      time += 0.003
      const w = width()
      const h = height()

      ctx.fillStyle = 'rgba(5, 5, 12, 0.06)'
      ctx.fillRect(0, 0, w, h)

      balls.forEach((ball, i) => {
        let bx = ball.x * w
        let by = ball.y * h

        // Organic movement with sine waves
        bx += ball.vx * 2.5 + Math.sin(time * 1.5 + i) * 4
        by += ball.vy * 2.5 + Math.cos(time * 1.2 + i * 0.7) * 4

        // Bounce at edges
        if (bx < 0 || bx > w) ball.vx *= -1
        if (by < 0 || by > h) ball.vy *= -1

        // Mouse interaction - attraction
        const dx = mouseX * w - bx
        const dy = mouseY * h - by
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 600) {
          const force = (1 - dist / 600) * 0.02
          bx += dx * force
          by += dy * force
        }

        ball.x = bx / w
        ball.y = by / h

        const pulseRadius = ball.radius + Math.sin(time * 2 + i) * 20

        // Outer glow
        const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, pulseRadius * 1.8)
        gradient.addColorStop(0, `rgba(${ball.color[0]}, ${ball.color[1]}, ${ball.color[2]}, 0.6)`)
        gradient.addColorStop(0.4, `rgba(${ball.color[0]}, ${ball.color[1]}, ${ball.color[2]}, 0.25)`)
        gradient.addColorStop(0.7, `rgba(${ball.color[0]}, ${ball.color[1]}, ${ball.color[2]}, 0.08)`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.beginPath()
        ctx.arc(bx, by, pulseRadius * 1.8, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Inner core
        const coreGrad = ctx.createRadialGradient(bx, by, 0, bx, by, pulseRadius * 0.4)
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)')
        coreGrad.addColorStop(1, `rgba(${ball.color[0]}, ${ball.color[1]}, ${ball.color[2]}, 0)`)
        ctx.beginPath()
        ctx.arc(bx, by, pulseRadius * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = coreGrad
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className="fluid-bg" />
}

// ============================================
// ANIMATED LOGO WITH GRADIENT SHIMMER
// ============================================
function AnimatedLogo() {
  return (
    <a href="/" className="nav__logo">
      <div className="logo-container">
        <span className="logo-text">JINKI</span>
        <span className="logo-shimmer"></span>
      </div>
      <span className="logo-sub">INTELLIGENCE</span>
    </a>
  )
}

// ============================================
// SPLINE 3D DRONE SCENE
// ============================================
function DroneScene() {
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowFallback(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="spline-container">
      <Suspense fallback={
        <div className="spline-loader">
          <div className="spline-loader__ring" />
          <span>Loading 3D Scene...</span>
        </div>
      }>
        <Spline
          scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
          onLoad={() => setShowFallback(false)}
          onError={() => setShowFallback(true)}
        />
      </Suspense>

      {showFallback && (
        <div className="drone-fallback">
          <img
            src="https://www-cdn.djiits.com/cms/uploads/67bb8244fb64295b08f9186279ba5b35.png"
            alt="DJI Matrice 400 RTK"
          />
          <div className="drone-specs-overlay">
            <span className="spec-badge">59 min flight</span>
            <span className="spec-badge">±1cm RTK</span>
            <span className="spec-badge">6kg payload</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// SMOOTH SCROLL WITH LENIS
// ============================================
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

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))

    return () => lenis.destroy()
  }, [])
}

// ============================================
// MAGNETIC BUTTON WITH GSAP
// ============================================
function MagneticButton({ children, href, className = '', variant = 'primary' }) {
  const ref = useRef(null)

  useEffect(() => {
    const btn = ref.current
    if (!btn) return

    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      gsap.to(btn, { x: x * 0.4, y: y * 0.4, duration: 0.3, ease: 'power2.out' })
    }

    const handleMouseLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' })
    }

    btn.addEventListener('mousemove', handleMouseMove)
    btn.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      btn.removeEventListener('mousemove', handleMouseMove)
      btn.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <a ref={ref} href={href} className={`mag-btn mag-btn--${variant} ${className}`}>
      {children}
    </a>
  )
}

// ============================================
// ANIMATED STAT COUNTER
// ============================================
function AnimatedStat({ value, suffix = '', prefix = '', label }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const numValue = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    const duration = 2000
    const start = Date.now()

    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(Math.floor(numValue * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    animate()
  }, [isInView, value])

  return (
    <div ref={ref} className="stat-item">
      <span className="stat-value">{prefix}{displayValue}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

// ============================================
// INTERACTIVE THERMAL HEATMAP
// ============================================
function ThermalHeatmap() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [hotspot, setHotspot] = useState({ x: 50, y: 50, temp: 78 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width = 400
    const height = canvas.height = 300

    const drawHeatmap = () => {
      // Base thermal gradient
      const baseGradient = ctx.createLinearGradient(0, 0, width, height)
      baseGradient.addColorStop(0, '#1a237e')
      baseGradient.addColorStop(0.3, '#0d47a1')
      baseGradient.addColorStop(0.5, '#00897b')
      baseGradient.addColorStop(0.7, '#ffc107')
      baseGradient.addColorStop(0.85, '#ff5722')
      baseGradient.addColorStop(1, '#d32f2f')

      ctx.fillStyle = baseGradient
      ctx.fillRect(0, 0, width, height)

      // Add noise texture
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20
        data[i] = Math.max(0, Math.min(255, data[i] + noise))
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
      }
      ctx.putImageData(imageData, 0, 0)

      // Draw hotspot
      const hx = (hotspot.x / 100) * width
      const hy = (hotspot.y / 100) * height
      const hotGradient = ctx.createRadialGradient(hx, hy, 0, hx, hy, 60)
      hotGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
      hotGradient.addColorStop(0.3, 'rgba(255, 87, 34, 0.8)')
      hotGradient.addColorStop(0.6, 'rgba(211, 47, 47, 0.5)')
      hotGradient.addColorStop(1, 'rgba(211, 47, 47, 0)')

      ctx.fillStyle = hotGradient
      ctx.fillRect(0, 0, width, height)

      // Grid overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }

    drawHeatmap()
  }, [hotspot])

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const temp = Math.round(60 + (y / 100) * 40 + Math.random() * 5)
    setHotspot({ x, y, temp })
  }

  return (
    <div ref={containerRef} className="thermal-heatmap" onMouseMove={handleMouseMove}>
      <canvas ref={canvasRef} className="thermal-canvas" />
      <div className="thermal-overlay">
        <div className="thermal-crosshair" style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}>
          <span className="thermal-temp">{hotspot.temp}°C</span>
        </div>
      </div>
      <div className="thermal-scale">
        <span>60°C</span>
        <div className="thermal-scale-bar" />
        <span>100°C</span>
      </div>
      <div className="thermal-label">LIVE THERMAL IMAGING</div>
    </div>
  )
}

// ============================================
// ANIMATED CONTOUR LINES
// ============================================
function ContourVisualization() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width = 500
    const height = canvas.height = 300
    let time = 0
    let animationId

    const drawContours = () => {
      ctx.fillStyle = 'rgba(5, 5, 12, 0.1)'
      ctx.fillRect(0, 0, width, height)

      const layers = 12
      for (let layer = 0; layer < layers; layer++) {
        const progress = layer / layers
        const hue = 180 + progress * 60 // Cyan to purple
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.3 + progress * 0.4})`
        ctx.lineWidth = 1 + progress

        ctx.beginPath()
        for (let x = 0; x <= width; x += 5) {
          const baseY = height / 2
          const amplitude = 40 + layer * 8
          const frequency = 0.008 + layer * 0.002
          const phase = time * (0.5 + layer * 0.1)

          const y = baseY +
            Math.sin(x * frequency + phase) * amplitude +
            Math.sin(x * frequency * 2 + phase * 1.5) * (amplitude * 0.3) +
            Math.cos(x * frequency * 0.5 + phase * 0.7) * (amplitude * 0.5)

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      // Draw elevation markers
      ctx.fillStyle = 'rgba(0, 212, 255, 0.8)'
      ctx.font = '10px Inter'
      for (let i = 1; i <= 3; i++) {
        const x = (width / 4) * i
        const y = height / 2 + Math.sin(x * 0.01 + time) * 50
        ctx.fillText(`${100 + i * 50}m`, x - 15, y - 10)
      }

      time += 0.02
      animationId = requestAnimationFrame(drawContours)
    }

    drawContours()
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className="contour-viz">
      <canvas ref={canvasRef} />
      <div className="contour-label">TOPOGRAPHIC ANALYSIS</div>
    </div>
  )
}

// ============================================
// LIDAR POINT CLOUD VISUALIZATION
// ============================================
function LidarVisualization() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width = 500
    const height = canvas.height = 300
    let time = 0
    let animationId

    // Generate points
    const points = []
    for (let i = 0; i < 800; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        size: 1 + Math.random() * 2,
      })
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 12, 0.15)'
      ctx.fillRect(0, 0, width, height)

      // Sort by z for depth effect
      points.sort((a, b) => a.z - b.z)

      points.forEach((p, i) => {
        // Animate z
        p.z = (p.z + 0.002) % 1

        const brightness = 0.3 + p.z * 0.7
        const hue = 180 + p.z * 60
        ctx.fillStyle = `hsla(${hue}, 80%, ${50 + p.z * 30}%, ${brightness})`

        const size = p.size * (0.5 + p.z * 1.5)
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fill()

        // Scan line effect
        const scanY = (time * 100) % height
        if (Math.abs(p.y - scanY) < 3) {
          ctx.fillStyle = 'rgba(0, 212, 255, 0.8)'
          ctx.beginPath()
          ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Draw scan line
      const scanY = (time * 100) % height
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, scanY)
      ctx.lineTo(width, scanY)
      ctx.stroke()

      time += 0.016
      animationId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className="lidar-viz">
      <canvas ref={canvasRef} />
      <div className="lidar-label">LIDAR POINT CLOUD</div>
      <div className="lidar-stats">
        <span>2.4M points/sec</span>
        <span>±2cm accuracy</span>
      </div>
    </div>
  )
}

// ============================================
// INDUSTRY CARD WITH DISTINCT VISUALS
// ============================================
function IndustryCard({ image, icon, title, description, stats, index, visualization }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: 100,
        opacity: 0,
        scale: 0.9,
        duration: 1,
        delay: index * 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
        },
      })
    }, ref)
    return () => ctx.revert()
  }, [index])

  return (
    <div ref={ref} className="industry-card glass-card">
      <div className="industry-card__image">
        <img src={image} alt={title} loading="lazy" />
        <div className="industry-card__overlay" />
        <span className="industry-card__icon">{icon}</span>
      </div>
      {visualization && (
        <div className="industry-card__viz">
          {visualization}
        </div>
      )}
      <div className="industry-card__content">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="industry-card__stats">
          {stats.map((stat, i) => (
            <div key={i} className="industry-card__stat">
              <span className="industry-card__stat-value">{stat.value}</span>
              <span className="industry-card__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// GSAP SCROLL REVEAL
// ============================================
function ScrollReveal({ children, className = '' }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current.children, {
        y: 80,
        opacity: 0,
        stagger: 0.12,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
        },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return <div ref={ref} className={className}>{children}</div>
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function LandingPage3() {
  const heroRef = useRef(null)
  useSmoothScroll()

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  // Industry data with DISTINCT images per sector
  const industries = [
    {
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
      icon: '🖥️',
      title: 'Data Centers',
      description: 'ASHRAE-compliant thermal monitoring. Detect anomalies at 0.05°C sensitivity before $1M+ outages occur. 19% of all data center failures stem from cooling issues.',
      stats: [
        { value: '$1M+', label: 'Outage Prevention' },
        { value: '0.05°C', label: 'Sensitivity' },
      ],
      visualization: <ThermalHeatmap />,
    },
    {
      image: 'https://images.pexels.com/photos/7682452/pexels-photo-7682452.jpeg?w=800&h=600&fit=crop',
      icon: '⚡',
      title: 'Electric Utilities',
      description: 'NERC FAC-003 vegetation management with LiDAR. Identify conductor sag, hot joints, and encroachment. 60% cost reduction vs helicopter inspection.',
      stats: [
        { value: '60%', label: 'Cost Reduction' },
        { value: '4.5x', label: 'Defect Detection' },
      ],
      visualization: <LidarVisualization />,
    },
    {
      image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',
      icon: '🌾',
      title: 'Precision Agriculture',
      description: 'NDVI and CWSI multispectral analysis detecting crop stress 14 days before visible symptoms. Variable rate prescription mapping for optimal yield.',
      stats: [
        { value: '150%', label: 'Documented ROI' },
        { value: '14 days', label: 'Early Detection' },
      ],
      visualization: <ContourVisualization />,
    },
    {
      image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80',
      icon: '🛢️',
      title: 'Oil & Gas',
      description: 'Optical Gas Imaging for methane leak detection. Pipeline thermal profiling with 99.2% accuracy. Meet EPA LDAR requirements with automated reporting.',
      stats: [
        { value: '99.2%', label: 'Detection Rate' },
        { value: '14 km', label: 'Daily Coverage' },
      ],
    },
  ]

  return (
    <div className="jinki-premium">
      <FluidBackground />

      {/* iOS Liquid Glass Navigation */}
      <header className="nav glass-nav">
        <div className="nav__inner">
          <AnimatedLogo />
          <nav className="nav__links">
            <a href="#industries">Industries</a>
            <a href="#platform">Platform</a>
            <a href="#team">Advisory</a>
          </nav>
          <MagneticButton href="#contact" variant="outline">
            Get Started →
          </MagneticButton>
        </div>
      </header>

      {/* Hero */}
      <motion.section ref={heroRef} className="hero" style={{ y: heroY }}>
        <motion.div className="hero__content" style={{ opacity: heroOpacity }}>
          <motion.div
            className="hero__badge glass-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="hero__badge-dot" />
            Enterprise Drone Intelligence Platform
          </motion.div>

          <motion.h1
            className="hero__title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <span>Autonomous</span>
            <span className="hero__title--accent">Thermal Intelligence</span>
            <span>for Critical Infrastructure</span>
          </motion.h1>

          <motion.p
            className="hero__desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Military-grade inspection powered by DJI Matrice 400 RTK.
            59-minute flight time. ±1cm RTK positioning. 0.05°C thermal sensitivity.
            Prevent million-dollar outages before they happen.
          </motion.p>

          <motion.div
            className="hero__ctas"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <MagneticButton href="#contact" variant="primary">
              Schedule Assessment →
            </MagneticButton>
            <MagneticButton href="#industries" variant="secondary">
              ▶ Watch Demo
            </MagneticButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="hero__stats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <AnimatedStat value="540" prefix="$" suffix="K" label="Hourly Downtime Saved" />
            <AnimatedStat value="59" suffix=" min" label="Flight Time" />
            <AnimatedStat value="1" prefix="±" suffix=" cm" label="RTK Accuracy" />
            <AnimatedStat value="10" suffix=":1" label="ROI Proven" />
          </motion.div>
        </motion.div>

        <div className="hero__visual">
          <DroneScene />
        </div>

        <motion.div
          className="hero__scroll"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="scroll-arrow">↓</span>
          <span>Scroll to explore</span>
        </motion.div>
      </motion.section>

      {/* Industries */}
      <section id="industries" className="industries">
        <div className="industries__inner">
          <ScrollReveal className="industries__header">
            <h2>Industry Solutions</h2>
            <p>Research-backed inspection protocols for mission-critical infrastructure</p>
          </ScrollReveal>

          <div className="industries__grid">
            {industries.map((industry, i) => (
              <IndustryCard key={i} {...industry} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Platform / DJI Matrice */}
      <section id="platform" className="platform">
        <ScrollReveal className="platform__inner">
          <div className="platform__content">
            <h2>DJI Matrice 400 RTK</h2>
            <p className="platform__lead">
              The most advanced enterprise drone platform for critical infrastructure inspection.
              IP55 rated for all-weather operation with redundant flight systems.
            </p>

            <div className="platform__specs">
              <div className="spec glass-card">
                <span className="spec__icon">🔋</span>
                <span className="spec__value">59 min</span>
                <span className="spec__label">Flight Time</span>
              </div>
              <div className="spec glass-card">
                <span className="spec__icon">📡</span>
                <span className="spec__value">20 km</span>
                <span className="spec__label">O4 Transmission</span>
              </div>
              <div className="spec glass-card">
                <span className="spec__icon">🎯</span>
                <span className="spec__value">±1 cm</span>
                <span className="spec__label">RTK Positioning</span>
              </div>
              <div className="spec glass-card">
                <span className="spec__icon">📦</span>
                <span className="spec__value">2.7 kg</span>
                <span className="spec__label">Max Payload</span>
              </div>
            </div>

            <div className="platform__features">
              <span>🌡️ Radiometric Thermal</span>
              <span>📐 LiDAR Scanning</span>
              <span>🛡️ IP55 Weather Sealed</span>
              <span>🔄 Redundant Systems</span>
            </div>
          </div>

          <div className="platform__image">
            <img
              src="https://www-cdn.djiits.com/cms/uploads/67bb8244fb64295b08f9186279ba5b35.png"
              alt="DJI Matrice 400 RTK"
              loading="lazy"
            />
          </div>
        </ScrollReveal>
      </section>

      {/* Team / Advisory */}
      <section id="team" className="team">
        <ScrollReveal className="team__inner">
          <h2>Cyber & AI Advisory</h2>
          <p className="team__lead">Enterprise security architecture meets aerial intelligence</p>

          <div className="team__card glass-card">
            <div className="team__avatar">🛡️</div>
            <h3>Abdillahi A.</h3>
            <span className="team__role">Principal Security Architect</span>
            <p>
              Enterprise security architecture, AI governance, and risk management
              for critical infrastructure. Specializing in zero-trust frameworks
              and regulatory compliance for energy and utilities sectors.
            </p>
            <div className="team__creds">
              CISSP • CCSP • AIGP • PMP
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* CTA */}
      <section id="contact" className="cta">
        <ScrollReveal className="cta__inner glass-card">
          <h2>Ready to Modernize Your Inspections?</h2>
          <p>
            Schedule a consultation to discuss your infrastructure monitoring needs.
            Prevent the next million-dollar outage.
          </p>
          <div className="cta__buttons">
            <MagneticButton href="tel:+15551234567" variant="primary">
              📞 Call Now
            </MagneticButton>
            <MagneticButton href="mailto:contact@jinki.io" variant="secondary">
              ✉️ Email Us
            </MagneticButton>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="footer__logo">JINKI INTELLIGENCE</span>
            <span className="footer__tagline">Autonomous Inspection. Intelligent Analysis.</span>
          </div>
          <span className="footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
