import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './LandingPage3.css'

gsap.registerPlugin(ScrollTrigger)

// ═══════════════════════════════════════════════════════════════
// FLUID CURSOR WITH TRAIL
// ═══════════════════════════════════════════════════════════════
function FluidCursor() {
  const cursorRef = useRef(null)
  const cursorDotRef = useRef(null)
  const trailRef = useRef([])
  const mousePos = useRef({ x: 0, y: 0 })
  const cursorPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const cursor = cursorRef.current
    const dot = cursorDotRef.current
    if (!cursor || !dot) return

    let animId

    const onMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY }

      // Immediate dot position
      gsap.to(dot, {
        x: e.clientX - 4,
        y: e.clientY - 4,
        duration: 0.1,
        ease: 'power2.out'
      })

      // Trail particles
      trailRef.current.push({
        x: e.clientX,
        y: e.clientY,
        life: 1
      })
      if (trailRef.current.length > 20) {
        trailRef.current.shift()
      }
    }

    const animate = () => {
      const { x: mouseX, y: mouseY } = mousePos.current

      // Smooth lag for main cursor
      cursorPos.current.x += (mouseX - cursorPos.current.x) * 0.15
      cursorPos.current.y += (mouseY - cursorPos.current.y) * 0.15

      gsap.set(cursor, {
        x: cursorPos.current.x - 20,
        y: cursorPos.current.y - 20
      })

      animId = requestAnimationFrame(animate)
    }

    animate()
    window.addEventListener('mousemove', onMouseMove)

    // Hide on mobile
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (isMobile) {
      cursor.style.display = 'none'
      dot.style.display = 'none'
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <>
      <div ref={cursorRef} className="fluid-cursor">
        <svg viewBox="0 0 40 40" width="40" height="40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="url(#cursorGrad)" strokeWidth="1.5" opacity="0.8"/>
          <defs>
            <linearGradient id="cursorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff"/>
              <stop offset="100%" stopColor="#a855f7"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div ref={cursorDotRef} className="fluid-cursor-dot"/>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// MORPHING BLOB BACKGROUND
// ═══════════════════════════════════════════════════════════════
function MorphingBlobs() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animId
    let mouseX = 0.5, mouseY = 0.5
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const handleMouse = (e) => {
      mouseX = e.clientX / window.innerWidth
      mouseY = e.clientY / window.innerHeight
    }
    window.addEventListener('mousemove', handleMouse)

    // Organic blob particles with physics
    const blobs = Array.from({ length: 6 }, (_, i) => ({
      x: 0.2 + (i % 3) * 0.3,
      y: 0.3 + Math.floor(i / 3) * 0.4,
      vx: 0,
      vy: 0,
      baseRadius: 150 + Math.random() * 200,
      hue: 180 + i * 30,
      phase: Math.random() * Math.PI * 2
    }))

    const animate = () => {
      time += 0.006
      const w = canvas.width
      const h = canvas.height

      // Fade with motion blur
      ctx.fillStyle = 'rgba(5, 5, 12, 0.025)'
      ctx.fillRect(0, 0, w, h)

      blobs.forEach((blob, i) => {
        // Physics-based movement with mouse attraction
        const dx = mouseX - blob.x
        const dy = mouseY - blob.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Attract to mouse when close
        if (dist < 0.5) {
          blob.vx += dx * 0.0003
          blob.vy += dy * 0.0003
        }

        // Organic drifting
        blob.vx += Math.sin(time * 0.5 + blob.phase) * 0.00008
        blob.vy += Math.cos(time * 0.4 + blob.phase) * 0.00008

        // Apply velocity with damping
        blob.x += blob.vx
        blob.y += blob.vy
        blob.vx *= 0.995
        blob.vy *= 0.995

        // Soft boundaries
        if (blob.x < 0.1) blob.vx += 0.0002
        if (blob.x > 0.9) blob.vx -= 0.0002
        if (blob.y < 0.1) blob.vy += 0.0002
        if (blob.y > 0.9) blob.vy -= 0.0002

        const px = blob.x * w
        const py = blob.y * h

        // Morphing radius
        const morphRadius = blob.baseRadius +
          Math.sin(time * 2 + blob.phase) * 40 +
          Math.cos(time * 1.5 + blob.phase * 2) * 30

        // Multi-layer gradients for depth
        for (let layer = 3; layer >= 0; layer--) {
          const layerRadius = morphRadius * (1 + layer * 0.4)
          const gradient = ctx.createRadialGradient(px, py, 0, px, py, layerRadius)

          const hueShift = Math.sin(time + i) * 20
          const baseLightness = 60 - layer * 10
          const baseOpacity = 0.15 - layer * 0.03

          gradient.addColorStop(0, `hsla(${blob.hue + hueShift}, 100%, ${baseLightness}%, ${baseOpacity})`)
          gradient.addColorStop(0.5, `hsla(${blob.hue + hueShift + 30}, 80%, ${baseLightness - 15}%, ${baseOpacity * 0.5})`)
          gradient.addColorStop(1, 'transparent')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(px, py, layerRadius, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouse)
      cancelAnimationFrame(animId)
    }
  }, [])

  return <canvas ref={canvasRef} className="morphing-blobs" />
}

// ═══════════════════════════════════════════════════════════════
// NOISE GRAIN OVERLAY
// ═══════════════════════════════════════════════════════════════
function NoiseOverlay() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 256

    const imageData = ctx.createImageData(256, 256)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const value = Math.random() * 255
      imageData.data[i] = value
      imageData.data[i + 1] = value
      imageData.data[i + 2] = value
      imageData.data[i + 3] = 15 // Very subtle
    }
    ctx.putImageData(imageData, 0, 0)
  }, [])

  return <canvas ref={canvasRef} className="noise-overlay" />
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED GRADIENT MESH
// ═══════════════════════════════════════════════════════════════
function GradientMesh() {
  return (
    <div className="gradient-mesh">
      <div className="gradient-mesh__orb gradient-mesh__orb--1"/>
      <div className="gradient-mesh__orb gradient-mesh__orb--2"/>
      <div className="gradient-mesh__orb gradient-mesh__orb--3"/>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LENIS SMOOTH SCROLL
// ═══════════════════════════════════════════════════════════════
function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.8,
    })

    const raf = (time) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    return () => lenis.destroy()
  }, [])
}

// ═══════════════════════════════════════════════════════════════
// LIQUID RIPPLE BUTTON
// ═══════════════════════════════════════════════════════════════
function LiquidButton({ children, href, variant = 'primary', className = '' }) {
  const ref = useRef(null)
  const [ripples, setRipples] = useState([])

  const handleClick = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700)
  }

  useEffect(() => {
    const btn = ref.current
    if (!btn) return

    const onMove = (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power2.out' })
    }

    const onLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' })
    }

    btn.addEventListener('mousemove', onMove)
    btn.addEventListener('mouseleave', onLeave)
    return () => {
      btn.removeEventListener('mousemove', onMove)
      btn.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <a ref={ref} href={href} className={`liquid-btn liquid-btn--${variant} ${className}`} onClick={handleClick}>
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="liquid-btn__ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
      <span className="liquid-btn__text">{children}</span>
      <span className="liquid-btn__glow"/>
    </a>
  )
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED LOGO
// ═══════════════════════════════════════════════════════════════
function AnimatedLogo() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.a
      href="/"
      className="logo"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        className="logo__mark"
        animate={{ rotate: isHovered ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg viewBox="0 0 40 40" fill="none">
          <motion.path
            d="M20 5L35 15V30L20 40L5 30V15L20 5Z"
            stroke="url(#logoGrad)"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          <motion.path
            d="M20 12L28 17V27L20 32L12 27V17L20 12Z"
            fill="url(#logoGrad)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff"/>
              <stop offset="50%" stopColor="#6366f1"/>
              <stop offset="100%" stopColor="#a855f7"/>
            </linearGradient>
          </defs>
        </svg>
        <div className="logo__shimmer"/>
      </motion.div>
      <div className="logo__text">
        <span className="logo__name">JINKI</span>
        <span className="logo__tag">INTELLIGENCE</span>
      </div>
    </motion.a>
  )
}

// ═══════════════════════════════════════════════════════════════
// SPLIT TEXT ANIMATION
// ═══════════════════════════════════════════════════════════════
function SplitText({ children, className = '', delay = 0 }) {
  const text = children.toString()
  const words = text.split(' ')

  return (
    <span className={`split-text ${className}`}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="split-text__word">
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={charIndex}
              className="split-text__char"
              initial={{ opacity: 0, y: 40, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                duration: 0.6,
                delay: delay + wordIndex * 0.1 + charIndex * 0.03,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              {char}
            </motion.span>
          ))}
          {wordIndex < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// 3D TILT CARD
// ═══════════════════════════════════════════════════════════════
function TiltCard({ children, className = '' }) {
  const ref = useRef(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const rotateX = ((mouseY - centerY) / centerY) * -8
    const rotateY = ((mouseX - centerX) / centerX) * 8

    setRotation({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={ref}
      className={`tilt-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotation.x,
        rotateY: rotation.y,
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30
      }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
    >
      {children}
      <motion.div
        className="tilt-card__glare"
        animate={{
          opacity: isHovered ? 0.15 : 0,
          x: `${50 + rotation.y * 5}%`,
          y: `${50 + rotation.x * 5}%`
        }}
      />
    </motion.div>
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
    let animId

    const draw = () => {
      time += 0.015

      // Multi-zone thermal gradient
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x += 8) {
          const noise = Math.sin(x * 0.02 + time) * Math.cos(y * 0.015 + time * 0.5) * 0.3
          const tempValue = (y / h) + noise + Math.sin(time + x * 0.01) * 0.1

          let r, g, b
          if (tempValue < 0.3) {
            r = 30; g = 80 + tempValue * 300; b = 200
          } else if (tempValue < 0.5) {
            r = 50 + tempValue * 200; g = 180; b = 50
          } else if (tempValue < 0.7) {
            r = 255; g = 200 - tempValue * 150; b = 30
          } else {
            r = 255; g = 80 - tempValue * 50; b = 50
          }

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
          ctx.fillRect(x, y, 8, 1)
        }
      }

      // Hotspot
      const hx = (temp.x / 100) * w
      const hy = (temp.y / 100) * h
      const hotGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 100)
      hotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
      hotGrad.addColorStop(0.3, 'rgba(255, 100, 50, 0.6)')
      hotGrad.addColorStop(0.6, 'rgba(255, 50, 30, 0.3)')
      hotGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = hotGrad
      ctx.fillRect(0, 0, w, h)

      // Animated scan line
      const scanY = (time * 50) % h
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'
      ctx.lineWidth = 2
      ctx.shadowColor = 'rgba(0, 255, 255, 0.8)'
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.moveTo(0, scanY)
      ctx.lineTo(w, scanY)
      ctx.stroke()
      ctx.shadowBlur = 0

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => cancelAnimationFrame(animId)
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
      <motion.div
        className="thermal__crosshair"
        style={{ left: `${temp.x}%`, top: `${temp.y}%` }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <span className="thermal__temp">{temp.value}°C</span>
      </motion.div>
      <div className="thermal__badge">LIVE THERMAL</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LIDAR POINT CLOUD
// ═══════════════════════════════════════════════════════════════
function LidarCloud() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const w = canvas.width = 500
    const h = canvas.height = 320
    let time = 0
    let animId

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      }
    }
    canvas.addEventListener('mousemove', handleMouse)

    const points = Array.from({ length: 1500 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random(),
      size: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    }))

    const draw = () => {
      time += 0.01

      ctx.fillStyle = 'rgba(5, 5, 15, 0.1)'
      ctx.fillRect(0, 0, w, h)

      const mx = mouseRef.current.x * w
      const my = mouseRef.current.y * h

      points.forEach(p => {
        // Mouse interaction
        const dx = mx - p.x
        const dy = my - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 80) {
          p.vx -= (dx / dist) * 0.3
          p.vy -= (dy / dist) * 0.3
        }

        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.98
        p.vy *= 0.98
        p.z = (p.z + 0.003) % 1

        // Wrap around
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        const brightness = 50 + p.z * 50
        const hue = 170 + p.z * 40
        ctx.fillStyle = `hsla(${hue}, 90%, ${brightness}%, ${0.5 + p.z * 0.5})`

        const size = p.size * (0.7 + p.z * 0.6)
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Scan line with glow
      const scanY = (time * 60) % h
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)'
      ctx.lineWidth = 3
      ctx.shadowColor = 'rgba(0, 255, 255, 0.8)'
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.moveTo(0, scanY)
      ctx.lineTo(w, scanY)
      ctx.stroke()
      ctx.shadowBlur = 0

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      canvas.removeEventListener('mousemove', handleMouse)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <div className="lidar">
      <canvas ref={canvasRef}/>
      <div className="lidar__badge">LIDAR SCAN</div>
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
    let animId

    const draw = () => {
      time += 0.012

      ctx.fillStyle = 'rgba(5, 15, 10, 0.06)'
      ctx.fillRect(0, 0, w, h)

      for (let layer = 0; layer < 16; layer++) {
        const progress = layer / 16
        const hue = 100 + progress * 50
        ctx.strokeStyle = `hsla(${hue}, 75%, ${50 + progress * 30}%, ${0.4 + progress * 0.4})`
        ctx.lineWidth = 1.5 + progress * 1.5
        ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.3)`
        ctx.shadowBlur = 5

        ctx.beginPath()
        for (let x = 0; x <= w; x += 3) {
          const amplitude = 30 + layer * 12
          const freq = 0.006 + layer * 0.0012
          const phase = time * (0.5 + layer * 0.1)

          const y = h / 2 +
            Math.sin(x * freq + phase) * amplitude +
            Math.sin(x * freq * 2.2 + phase * 1.3) * (amplitude * 0.35) +
            Math.cos(x * freq * 0.5 + phase * 0.8) * (amplitude * 0.5)

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div className="topo">
      <canvas ref={canvasRef}/>
      <div className="topo__badge">NDVI ANALYSIS</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED COUNTER WITH SPRING
// ═══════════════════════════════════════════════════════════════
function Counter({ value, suffix = '', prefix = '', label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    const duration = 2500
    const start = Date.now()

    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // Spring-like easing
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplay(Math.floor(num * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    tick()
  }, [inView, value])

  return (
    <motion.div
      ref={ref}
      className="counter"
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="counter__value">{prefix}{display}{suffix}</span>
      <span className="counter__label">{label}</span>
    </motion.div>
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
        y: 100,
        opacity: 0,
        duration: 1.4,
        delay,
        ease: 'power4.out',
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
// INDUSTRY CARD WITH TILT
// ═══════════════════════════════════════════════════════════════
function IndustryCard({ image, title, problem, solution, stats, visualization, index }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: 150,
        opacity: 0,
        scale: 0.9,
        rotateX: 15,
        duration: 1.2,
        delay: index * 0.15,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 90%',
        }
      })
    }, ref)
    return () => ctx.revert()
  }, [index])

  return (
    <TiltCard className="industry-card-wrapper">
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
    </TiltCard>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function LandingPage3() {
  const heroRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  useSmoothScroll()

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92])
  const heroBlur = useTransform(scrollYProgress, [0, 0.5], [0, 10])

  const industries = [
    {
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=90',
      title: 'Data Centers',
      problem: '19% of all data center outages stem from cooling failures. Average outage costs $700,000, with 25% exceeding $1M.',
      solution: 'Autonomous thermal monitoring with 0.05°C sensitivity detects hotspots 72 hours before failure.',
      stats: [
        { value: '$700K', label: 'Avg Outage Cost' },
        { value: '72hrs', label: 'Early Detection' }
      ],
      visualization: <ThermalHeatmap/>
    },
    {
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=90',
      title: 'Electric Utilities',
      problem: 'Ground crews identify 48% fewer defects than aerial inspection. Helicopter surveys cost $2,000+/hour.',
      solution: 'LiDAR scanning at 2.4M points/sec with ±2cm accuracy. 60% cost reduction vs helicopter.',
      stats: [
        { value: '60%', label: 'Cost Reduction' },
        { value: '4.5x', label: 'More Defects' }
      ],
      visualization: <LidarCloud/>
    },
    {
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&q=90',
      title: 'Precision Agriculture',
      problem: 'Crop stress visible to the eye only after 14+ days of damage. Manual scouting covers <5% effectively.',
      solution: 'NDVI multispectral imaging detects stress 14 days early. Variable rate maps optimize inputs.',
      stats: [
        { value: '14 days', label: 'Earlier Detection' },
        { value: '150%', label: 'Proven ROI' }
      ],
      visualization: <TopoContours/>
    },
    {
      image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=1200&q=90',
      title: 'Oil & Gas',
      problem: 'EPA LDAR requires continuous methane monitoring. Manual inspection of 14km pipeline takes days.',
      solution: 'Optical Gas Imaging with 99.2% detection. Cover 14km daily. Automated EPA compliance.',
      stats: [
        { value: '99.2%', label: 'Detection Rate' },
        { value: '14km', label: 'Daily Coverage' }
      ]
    }
  ]

  return (
    <div className={`page ${isLoaded ? 'is-loaded' : ''}`}>
      <FluidCursor/>
      <MorphingBlobs/>
      <GradientMesh/>
      <NoiseOverlay/>

      {/* ═══ iOS LIQUID GLASS NAVIGATION ═══ */}
      <motion.header
        className="nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="nav__glass"/>
        <div className="nav__inner">
          <AnimatedLogo/>
          <nav className="nav__links">
            <a href="#industries">Industries</a>
            <a href="#platform">Platform</a>
            <a href="#advisory">Advisory</a>
          </nav>
          <LiquidButton href="#contact" variant="glass">
            Get Started
          </LiquidButton>
        </div>
      </motion.header>

      {/* ═══ CINEMATIC HERO ═══ */}
      <motion.section ref={heroRef} className="hero" style={{ y: heroY }}>
        <motion.div
          className="hero__content"
          style={{
            opacity: heroOpacity,
            scale: heroScale,
            filter: useTransform(heroBlur, v => `blur(${v}px)`)
          }}
        >
          <motion.div
            className="hero__tag"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <span className="hero__tag-dot"/>
            Enterprise Drone Intelligence
          </motion.div>

          <motion.h1
            className="hero__title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <SplitText delay={1}>Prevent</SplitText>
            <br/>
            <span className="hero__title-accent">
              <SplitText delay={1.2}>Million-Dollar</SplitText>
            </span>
            <br/>
            <SplitText delay={1.5}>Failures</SplitText>
          </motion.h1>

          <motion.p
            className="hero__desc"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2 }}
          >
            Autonomous thermal intelligence for critical infrastructure.
            Detect anomalies 72 hours before catastrophic failure.
          </motion.p>

          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.3 }}
          >
            <LiquidButton href="#contact" variant="primary">
              Schedule Assessment
            </LiquidButton>
            <LiquidButton href="#industries" variant="secondary">
              View Capabilities
            </LiquidButton>
          </motion.div>

          <motion.div
            className="hero__stats"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.6 }}
          >
            <Counter value="700" prefix="$" suffix="K" label="Avg Outage Prevented"/>
            <Counter value="72" suffix="hrs" label="Early Detection"/>
            <Counter value="94" suffix="%" label="Fault Accuracy"/>
            <Counter value="58" suffix="%" label="Cost Reduction"/>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero__visual"
          initial={{ opacity: 0, scale: 0.8, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero__drone">
            <motion.img
              src="https://www-cdn.djiits.com/cms/uploads/67bb8244fb64295b08f9186279ba5b35.png"
              alt="DJI Matrice 400 RTK"
              animate={{
                y: [0, -20, 0],
                rotateY: [0, 5, 0, -5, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </div>
          <div className="hero__glow"/>
          <div className="hero__glow hero__glow--2"/>
        </motion.div>

        <motion.div
          className="hero__scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 3 }}
        >
          <motion.span
            className="hero__scroll-arrow"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ↓
          </motion.span>
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
            {[
              { icon: '🌡️', text: '0.05°C Thermal Sensitivity' },
              { icon: '📐', text: 'LiDAR @ 2.4M pts/sec' },
              { icon: '🛡️', text: 'IP55 Weather Sealed' },
              { icon: '🔄', text: 'Redundant Systems' },
              { icon: '📡', text: '20km Transmission' },
              { icon: '🎯', text: '±1cm RTK Accuracy' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="platform__feature"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <span className="platform__feature-icon">{feature.icon}</span>
                <span>{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </Reveal>

        <Reveal className="platform__visual" delay={0.2}>
          <motion.img
            src="https://www-cdn.djiits.com/cms/uploads/67bb8244fb64295b08f9186279ba5b35.png"
            alt="Enterprise Drone Platform"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
          />
        </Reveal>
      </section>

      {/* ═══ ADVISORY ═══ */}
      <section id="advisory" className="advisory">
        <Reveal className="advisory__content">
          <h2>Cyber & AI Advisory</h2>
          <p className="advisory__lead">Enterprise security architecture meets aerial intelligence</p>

          <TiltCard className="advisory__card-wrapper">
            <div className="advisory__card">
              <motion.div
                className="advisory__avatar"
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <span>AA</span>
              </motion.div>
              <h3>Abdillahi A.</h3>
              <span className="advisory__role">Principal Security Architect</span>
              <p>
                Enterprise security architecture, AI governance, and risk management
                for critical infrastructure. Zero-trust frameworks and regulatory
                compliance for energy, utilities, and data center sectors.
              </p>
              <div className="advisory__creds">
                <motion.span whileHover={{ scale: 1.1, y: -3 }}>CISSP</motion.span>
                <motion.span whileHover={{ scale: 1.1, y: -3 }}>CCSP</motion.span>
                <motion.span whileHover={{ scale: 1.1, y: -3 }}>AIGP</motion.span>
                <motion.span whileHover={{ scale: 1.1, y: -3 }}>PMP</motion.span>
              </div>
            </div>
          </TiltCard>
        </Reveal>
      </section>

      {/* ═══ CTA ═══ */}
      <section id="contact" className="cta">
        <Reveal className="cta__inner">
          <h2>Ready to Modernize Inspections?</h2>
          <p>Schedule a consultation. Prevent the next million-dollar outage.</p>
          <div className="cta__buttons">
            <LiquidButton href="tel:+15551234567" variant="primary">
              Call Now
            </LiquidButton>
            <LiquidButton href="mailto:contact@jinki.io" variant="secondary">
              Email Us
            </LiquidButton>
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
