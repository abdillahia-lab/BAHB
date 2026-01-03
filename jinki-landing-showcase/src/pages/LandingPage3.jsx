import { useState, useEffect, useRef, useLayoutEffect, Suspense, lazy } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './LandingPage3.css'

const Spline = lazy(() => import('@splinetool/react-spline'))
gsap.registerPlugin(ScrollTrigger)

// ═══════════════════════════════════════════════════════════════
// WEBGL FLUID SIMULATION BACKGROUND
// ═══════════════════════════════════════════════════════════════
function FluidSimulation() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId
    let mouseX = 0.5, mouseY = 0.5
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Fluid particles
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.002,
      vy: (Math.random() - 0.5) * 0.002,
      radius: 80 + Math.random() * 150,
      hue: 180 + Math.random() * 80
    }))

    const handleMouseMove = (e) => {
      mouseX = e.clientX / window.innerWidth
      mouseY = e.clientY / window.innerHeight
    }
    window.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      time += 0.008
      const w = canvas.width
      const h = canvas.height

      // Fade trail
      ctx.fillStyle = 'rgba(5, 5, 15, 0.04)'
      ctx.fillRect(0, 0, w, h)

      particles.forEach((p, i) => {
        // Organic movement
        p.x += p.vx + Math.sin(time + i * 0.5) * 0.001
        p.y += p.vy + Math.cos(time * 0.8 + i * 0.3) * 0.001

        // Bounce
        if (p.x < 0 || p.x > 1) p.vx *= -1
        if (p.y < 0 || p.y > 1) p.vy *= -1
        p.x = Math.max(0, Math.min(1, p.x))
        p.y = Math.max(0, Math.min(1, p.y))

        // Mouse attraction
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 0.4) {
          p.x += dx * 0.008
          p.y += dy * 0.008
        }

        const px = p.x * w
        const py = p.y * h
        const pulseRadius = p.radius + Math.sin(time * 2 + i) * 30

        // Gradient orb
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, pulseRadius)
        gradient.addColorStop(0, `hsla(${p.hue + Math.sin(time) * 20}, 100%, 70%, 0.4)`)
        gradient.addColorStop(0.4, `hsla(${p.hue}, 80%, 50%, 0.15)`)
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(px, py, pulseRadius, 0, Math.PI * 2)
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

  return <canvas ref={canvasRef} className="fluid-canvas" />
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED LOGO WITH GRADIENT SHIMMER
// ═══════════════════════════════════════════════════════════════
function AnimatedLogo() {
  return (
    <a href="/" className="logo">
      <div className="logo__mark">
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M20 5L35 15V30L20 40L5 30V15L20 5Z" stroke="url(#logoGrad)" strokeWidth="2" fill="none"/>
          <path d="M20 12L28 17V27L20 32L12 27V17L20 12Z" fill="url(#logoGrad)"/>
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff"/>
              <stop offset="50%" stopColor="#6366f1"/>
              <stop offset="100%" stopColor="#a855f7"/>
            </linearGradient>
          </defs>
        </svg>
        <div className="logo__shimmer"/>
      </div>
      <div className="logo__text">
        <span className="logo__name">JINKI</span>
        <span className="logo__tag">INTELLIGENCE</span>
      </div>
    </a>
  )
}

// ═══════════════════════════════════════════════════════════════
// LENIS SMOOTH SCROLL
// ═══════════════════════════════════════════════════════════════
function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    const raf = (time) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))

    return () => lenis.destroy()
  }, [])
}

// ═══════════════════════════════════════════════════════════════
// MAGNETIC BUTTON
// ═══════════════════════════════════════════════════════════════
function MagneticButton({ children, href, variant = 'primary', className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const btn = ref.current
    if (!btn) return

    const onMove = (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      gsap.to(btn, { x: x * 0.35, y: y * 0.35, duration: 0.3, ease: 'power2.out' })
    }

    const onLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' })
    }

    btn.addEventListener('mousemove', onMove)
    btn.addEventListener('mouseleave', onLeave)
    return () => {
      btn.removeEventListener('mousemove', onMove)
      btn.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <a ref={ref} href={href} className={`btn btn--${variant} ${className}`}>
      <span className="btn__text">{children}</span>
      <span className="btn__glow"/>
    </a>
  )
}

// ═══════════════════════════════════════════════════════════════
// INTERACTIVE THERMAL HEATMAP
// ═══════════════════════════════════════════════════════════════
function ThermalHeatmap() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [temp, setTemp] = useState({ value: 72, x: 50, y: 50 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const w = canvas.width = 500
    const h = canvas.height = 320
    let time = 0
    let animationId

    const draw = () => {
      time += 0.02

      // Base thermal gradient
      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, '#1a237e')
      grad.addColorStop(0.25, '#0288d1')
      grad.addColorStop(0.5, '#4caf50')
      grad.addColorStop(0.7, '#ffc107')
      grad.addColorStop(0.85, '#ff5722')
      grad.addColorStop(1, '#f44336')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Noise texture
      const imgData = ctx.getImageData(0, 0, w, h)
      for (let i = 0; i < imgData.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 25
        imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + noise))
        imgData.data[i+1] = Math.max(0, Math.min(255, imgData.data[i+1] + noise))
        imgData.data[i+2] = Math.max(0, Math.min(255, imgData.data[i+2] + noise))
      }
      ctx.putImageData(imgData, 0, 0)

      // Hotspot
      const hx = (temp.x / 100) * w
      const hy = (temp.y / 100) * h
      const hotGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 80)
      hotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
      hotGrad.addColorStop(0.2, 'rgba(255, 87, 34, 0.8)')
      hotGrad.addColorStop(0.5, 'rgba(244, 67, 54, 0.4)')
      hotGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = hotGrad
      ctx.fillRect(0, 0, w, h)

      // Scan line
      const scanY = (time * 60) % h
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 4])
      ctx.beginPath()
      ctx.moveTo(0, scanY)
      ctx.lineTo(w, scanY)
      ctx.stroke()
      ctx.setLineDash([])

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.lineWidth = 1
      for (let x = 0; x < w; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      animationId = requestAnimationFrame(draw)
    }
    draw()

    return () => cancelAnimationFrame(animationId)
  }, [temp])

  const handleMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const value = Math.round(55 + (y / 100) * 50 + Math.random() * 5)
    setTemp({ value, x, y })
  }

  return (
    <div ref={containerRef} className="thermal" onMouseMove={handleMove}>
      <canvas ref={canvasRef}/>
      <div className="thermal__crosshair" style={{ left: `${temp.x}%`, top: `${temp.y}%` }}>
        <span className="thermal__temp">{temp.value}°C</span>
      </div>
      <div className="thermal__scale">
        <span>55°C</span>
        <div className="thermal__scale-bar"/>
        <span>105°C</span>
      </div>
      <div className="thermal__badge">LIVE THERMAL</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LIDAR POINT CLOUD
// ═══════════════════════════════════════════════════════════════
function LidarCloud() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const w = canvas.width = 500
    const h = canvas.height = 320
    let time = 0
    let animationId

    const points = Array.from({ length: 1200 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random(),
      size: 1 + Math.random() * 2.5
    }))

    const draw = () => {
      time += 0.012

      ctx.fillStyle = 'rgba(5, 5, 15, 0.15)'
      ctx.fillRect(0, 0, w, h)

      points.forEach(p => {
        p.z = (p.z + 0.003) % 1

        const brightness = 40 + p.z * 50
        const hue = 170 + p.z * 50
        ctx.fillStyle = `hsla(${hue}, 90%, ${brightness}%, ${0.4 + p.z * 0.6})`

        const size = p.size * (0.6 + p.z)
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fill()

        // Scan highlight
        const scanY = (time * 80) % h
        if (Math.abs(p.y - scanY) < 4) {
          ctx.fillStyle = 'rgba(0, 255, 255, 0.9)'
          ctx.beginPath()
          ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Scan line
      const scanY = (time * 80) % h
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, scanY)
      ctx.lineTo(w, scanY)
      ctx.stroke()

      animationId = requestAnimationFrame(draw)
    }
    draw()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className="lidar">
      <canvas ref={canvasRef}/>
      <div className="lidar__badge">LIDAR SCAN</div>
      <div className="lidar__stats">
        <span>2.4M pts/sec</span>
        <span>±2cm</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TOPOGRAPHY CONTOURS
// ═══════════════════════════════════════════════════════════════
function TopoContours() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const w = canvas.width = 500
    const h = canvas.height = 320
    let time = 0
    let animationId

    const draw = () => {
      time += 0.015

      ctx.fillStyle = 'rgba(5, 15, 10, 0.08)'
      ctx.fillRect(0, 0, w, h)

      // Draw contour layers
      for (let layer = 0; layer < 14; layer++) {
        const progress = layer / 14
        const hue = 90 + progress * 60
        ctx.strokeStyle = `hsla(${hue}, 70%, ${45 + progress * 25}%, ${0.35 + progress * 0.5})`
        ctx.lineWidth = 1 + progress * 1.5

        ctx.beginPath()
        for (let x = 0; x <= w; x += 4) {
          const amplitude = 35 + layer * 10
          const freq = 0.007 + layer * 0.0015
          const phase = time * (0.4 + layer * 0.12)

          const y = h / 2 +
            Math.sin(x * freq + phase) * amplitude +
            Math.sin(x * freq * 2.5 + phase * 1.4) * (amplitude * 0.3) +
            Math.cos(x * freq * 0.6 + phase * 0.7) * (amplitude * 0.45)

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Elevation labels
        if (layer % 4 === 2) {
          const labelX = w * 0.7
          const labelY = h / 2 + Math.sin(labelX * 0.008 + time * 0.5) * (35 + layer * 10)
          ctx.fillStyle = `hsla(${hue}, 80%, 70%, 0.9)`
          ctx.font = 'bold 11px monospace'
          ctx.fillText(`${80 + layer * 25}m`, labelX, labelY - 12)
        }
      }

      animationId = requestAnimationFrame(draw)
    }
    draw()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className="topo">
      <canvas ref={canvasRef}/>
      <div className="topo__badge">NDVI ANALYSIS</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════════
function Counter({ value, suffix = '', prefix = '', label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    const duration = 2200
    const start = Date.now()

    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplay(Math.floor(num * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    tick()
  }, [inView, value])

  return (
    <div ref={ref} className="counter">
      <span className="counter__value">{prefix}{display}{suffix}</span>
      <span className="counter__label">{label}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════════════════════════
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: 80,
        opacity: 0,
        duration: 1.2,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
        }
      })
    }, ref)
    return () => ctx.revert()
  }, [delay])

  return <div ref={ref} className={className}>{children}</div>
}

// ═══════════════════════════════════════════════════════════════
// INDUSTRY CARD
// ═══════════════════════════════════════════════════════════════
function IndustryCard({ image, title, problem, solution, stats, visualization, index }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: 120,
        opacity: 0,
        scale: 0.92,
        duration: 1,
        delay: index * 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 88%',
        }
      })
    }, ref)
    return () => ctx.revert()
  }, [index])

  return (
    <div ref={ref} className="industry-card">
      <div className="industry-card__media">
        <img src={image} alt={title} loading="lazy"/>
        <div className="industry-card__overlay"/>
      </div>
      {visualization && (
        <div className="industry-card__viz">
          {visualization}
        </div>
      )}
      <div className="industry-card__body">
        <h3 className="industry-card__title">{title}</h3>
        <div className="industry-card__problem">
          <span className="industry-card__label">The Problem</span>
          <p>{problem}</p>
        </div>
        <div className="industry-card__solution">
          <span className="industry-card__label">Our Solution</span>
          <p>{solution}</p>
        </div>
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

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function LandingPage3() {
  const heroRef = useRef(null)
  useSmoothScroll()

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  const industries = [
    {
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=90',
      title: 'Data Centers',
      problem: '19% of all data center outages stem from cooling failures. Average outage costs $700,000, with 25% exceeding $1M. Traditional inspections miss thermal anomalies until catastrophic failure.',
      solution: 'Autonomous thermal monitoring with 0.05°C sensitivity detects hotspots 72 hours before failure. ASHRAE TC 9.9 compliant. Real-time alerts prevent million-dollar outages.',
      stats: [
        { value: '$700K', label: 'Avg Outage Cost' },
        { value: '72hrs', label: 'Early Detection' }
      ],
      visualization: <ThermalHeatmap/>
    },
    {
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=90',
      title: 'Electric Utilities',
      problem: 'Ground crews identify 48% fewer defects than aerial inspection. Helicopter surveys cost $2,000+/hour. NERC FAC-003 vegetation encroachment causes 23% of transmission outages.',
      solution: 'LiDAR point cloud scanning at 2.4M points/sec with ±2cm accuracy. Detect conductor sag, hot joints, and vegetation encroachment. 60% cost reduction vs helicopter.',
      stats: [
        { value: '60%', label: 'Cost Reduction' },
        { value: '4.5x', label: 'More Defects Found' }
      ],
      visualization: <LidarCloud/>
    },
    {
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&q=90',
      title: 'Precision Agriculture',
      problem: 'Crop stress becomes visible to the eye only after 14+ days of damage. By then, yield loss is locked in. Manual scouting covers <5% of acreage effectively.',
      solution: 'NDVI and CWSI multispectral imaging detects stress 14 days before visible symptoms. Variable rate prescription maps optimize inputs. 150% documented ROI.',
      stats: [
        { value: '14 days', label: 'Earlier Detection' },
        { value: '150%', label: 'Proven ROI' }
      ],
      visualization: <TopoContours/>
    },
    {
      image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=1200&q=90',
      title: 'Oil & Gas',
      problem: 'EPA LDAR requirements demand continuous methane monitoring. Manual inspection of 14km pipeline takes days. Undetected leaks result in $100K+ fines and environmental damage.',
      solution: 'Optical Gas Imaging with 99.2% detection accuracy. Cover 14km of pipeline daily. Automated reporting meets EPA compliance. Thermal profiling identifies subsurface anomalies.',
      stats: [
        { value: '99.2%', label: 'Detection Rate' },
        { value: '14km', label: 'Daily Coverage' }
      ]
    }
  ]

  return (
    <div className="page">
      <FluidSimulation/>

      {/* ═══ iOS LIQUID GLASS NAVIGATION ═══ */}
      <header className="nav">
        <div className="nav__glass"/>
        <div className="nav__inner">
          <AnimatedLogo/>
          <nav className="nav__links">
            <a href="#industries">Industries</a>
            <a href="#platform">Platform</a>
            <a href="#advisory">Advisory</a>
          </nav>
          <MagneticButton href="#contact" variant="glass">
            Get Started
          </MagneticButton>
        </div>
      </header>

      {/* ═══ CINEMATIC HERO ═══ */}
      <motion.section ref={heroRef} className="hero" style={{ y: heroY }}>
        <motion.div className="hero__content" style={{ opacity: heroOpacity, scale: heroScale }}>
          <motion.div
            className="hero__tag"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="hero__tag-dot"/>
            Enterprise Drone Intelligence
          </motion.div>

          <motion.h1
            className="hero__title"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
          >
            <span>Prevent</span>
            <span className="hero__title-accent">Million-Dollar</span>
            <span>Failures</span>
          </motion.h1>

          <motion.p
            className="hero__desc"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            Autonomous thermal intelligence for critical infrastructure.
            Detect anomalies 72 hours before catastrophic failure.
            Research-backed inspection that pays for itself.
          </motion.p>

          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
          >
            <MagneticButton href="#contact" variant="primary">
              Schedule Assessment
            </MagneticButton>
            <MagneticButton href="#industries" variant="secondary">
              View Capabilities
            </MagneticButton>
          </motion.div>

          <motion.div
            className="hero__stats"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
          >
            <Counter value="700" prefix="$" suffix="K" label="Avg Outage Prevented"/>
            <Counter value="72" suffix="hrs" label="Early Detection"/>
            <Counter value="94" suffix="%" label="Fault Accuracy"/>
            <Counter value="58" suffix="%" label="Cost Reduction"/>
          </motion.div>
        </motion.div>

        <div className="hero__visual">
          <div className="hero__drone">
            <img
              src="https://www-cdn.djiits.com/cms/uploads/67bb8244fb64295b08f9186279ba5b35.png"
              alt="DJI Matrice 400 RTK"
            />
          </div>
          <div className="hero__glow"/>
        </div>

        <motion.div
          className="hero__scroll"
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <span className="hero__scroll-arrow">↓</span>
          Scroll to explore
        </motion.div>
      </motion.section>

      {/* ═══ INDUSTRIES ═══ */}
      <section id="industries" className="industries">
        <Reveal className="industries__header">
          <h2>Industry Solutions</h2>
          <p>Research-backed protocols for mission-critical infrastructure</p>
        </Reveal>

        <div className="industries__grid">
          {industries.map((industry, i) => (
            <IndustryCard key={i} {...industry} index={i}/>
          ))}
        </div>
      </section>

      {/* ═══ PLATFORM ═══ */}
      <section id="platform" className="platform">
        <Reveal className="platform__content">
          <h2>Enterprise-Grade Platform</h2>
          <p className="platform__lead">
            Military-adjacent inspection technology. IP55 rated for all-weather operation.
            Redundant flight systems. 59-minute endurance. ±1cm RTK positioning.
          </p>

          <div className="platform__features">
            <div className="platform__feature">
              <span className="platform__feature-icon">🌡️</span>
              <span>0.05°C Thermal Sensitivity</span>
            </div>
            <div className="platform__feature">
              <span className="platform__feature-icon">📐</span>
              <span>LiDAR @ 2.4M pts/sec</span>
            </div>
            <div className="platform__feature">
              <span className="platform__feature-icon">🛡️</span>
              <span>IP55 Weather Sealed</span>
            </div>
            <div className="platform__feature">
              <span className="platform__feature-icon">🔄</span>
              <span>Redundant Systems</span>
            </div>
            <div className="platform__feature">
              <span className="platform__feature-icon">📡</span>
              <span>20km Transmission</span>
            </div>
            <div className="platform__feature">
              <span className="platform__feature-icon">🎯</span>
              <span>±1cm RTK Accuracy</span>
            </div>
          </div>
        </Reveal>

        <Reveal className="platform__visual" delay={0.2}>
          <img
            src="https://www-cdn.djiits.com/cms/uploads/67bb8244fb64295b08f9186279ba5b35.png"
            alt="Enterprise Drone Platform"
          />
        </Reveal>
      </section>

      {/* ═══ ADVISORY ═══ */}
      <section id="advisory" className="advisory">
        <Reveal className="advisory__content">
          <h2>Cyber & AI Advisory</h2>
          <p className="advisory__lead">Enterprise security architecture meets aerial intelligence</p>

          <div className="advisory__card">
            <div className="advisory__avatar">
              <span>AA</span>
            </div>
            <h3>Abdillahi A.</h3>
            <span className="advisory__role">Principal Security Architect</span>
            <p>
              Enterprise security architecture, AI governance, and risk management
              for critical infrastructure. Zero-trust frameworks and regulatory
              compliance for energy, utilities, and data center sectors.
            </p>
            <div className="advisory__creds">
              <span>CISSP</span>
              <span>CCSP</span>
              <span>AIGP</span>
              <span>PMP</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ CTA ═══ */}
      <section id="contact" className="cta">
        <Reveal className="cta__inner">
          <h2>Ready to Modernize Inspections?</h2>
          <p>
            Schedule a consultation. Prevent the next million-dollar outage.
          </p>
          <div className="cta__buttons">
            <MagneticButton href="tel:+15551234567" variant="primary">
              Call Now
            </MagneticButton>
            <MagneticButton href="mailto:contact@jinki.io" variant="secondary">
              Email Us
            </MagneticButton>
          </div>
        </Reveal>
      </section>

      {/* ═══ FOOTER ═══ */}
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
