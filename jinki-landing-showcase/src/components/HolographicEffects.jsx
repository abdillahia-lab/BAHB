import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import './HolographicEffects.css'

// ═══════════════════════════════════════════════════════════════
// HOLOGRAPHIC TEXT - Chromatic Aberration + Scanlines
// ═══════════════════════════════════════════════════════════════
export function HolographicText({
  text,
  className = '',
  variant = 'primary',
  intensity = 1
}) {
  return (
    <motion.span
      className={`holo-text holo-text--${variant} ${className}`}
      style={{ '--intensity': intensity }}
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.8 }}
    >
      <svg
        className="holo-text__filters"
        style={{ display: 'none' }}
      >
        <defs>
          <filter id="holo-aberration">
            <feOffset in="SourceGraphic" dx="2" dy="0" result="r" />
            <feOffset in="SourceGraphic" dx="-2" dy="0" result="b" />
            <feBlend in="r" in2="SourceGraphic" mode="screen" />
            <feBlend in="b" in2="SourceGraphic" mode="multiply" />
          </filter>
          <filter id="holo-glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
      {text}
    </motion.span>
  )
}

// ═══════════════════════════════════════════════════════════════
// HOLOGRAPHIC CARD - Prismatic Color Shifts + Floating
// ═══════════════════════════════════════════════════════════════
export function HolographicCard({
  title,
  content,
  icon,
  index = 0,
  delay = 0
}) {
  const cardRef = useRef(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    })
  }, [])

  return (
    <motion.div
      ref={cardRef}
      className="holo-card"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setMousePosition({ x: 0.5, y: 0.5 })
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      style={{
        '--mouse-x': isHovered ? `${mousePosition.x * 100}%` : '50%',
        '--mouse-y': isHovered ? `${mousePosition.y * 100}%` : '50%',
      }}
    >
      {/* Holographic shimmer background */}
      <div className="holo-card__shimmer" />

      {/* Prismatic gradient overlay */}
      <div className="holo-card__prism" />

      {/* Content container */}
      <div className="holo-card__content">
        {icon && <div className="holo-card__icon">{icon}</div>}
        <h3 className="holo-card__title">{title}</h3>
        <p className="holo-card__text">{content}</p>
      </div>

      {/* Floating hologram effect */}
      <div className="holo-card__float" />

      {/* Scanline overlay */}
      <div className="holo-card__scanlines" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HOLOGRAPHIC BEACON - Projection Beam Effect
// ═══════════════════════════════════════════════════════════════
export function HolographicBeacon({
  color = '#00b4d8',
  size = 120,
  intensity = 1
}) {
  return (
    <div
      className="holo-beacon"
      style={{
        '--beacon-color': color,
        '--beacon-size': `${size}px`,
        '--beacon-intensity': intensity
      }}
    >
      {/* Core light */}
      <div className="holo-beacon__core" />

      {/* Projection beams */}
      <div className="holo-beacon__beam holo-beacon__beam--1" />
      <div className="holo-beacon__beam holo-beacon__beam--2" />
      <div className="holo-beacon__beam holo-beacon__beam--3" />

      {/* Pulse rings */}
      <div className="holo-beacon__ring holo-beacon__ring--1" />
      <div className="holo-beacon__ring holo-beacon__ring--2" />
      <div className="holo-beacon__ring holo-beacon__ring--3" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// GLITCH TEXT - Dynamic Corruption Effect
// ═══════════════════════════════════════════════════════════════
export function GlitchText({
  text,
  intensity = 0.5,
  className = ''
}) {
  const [glitchActive, setGlitchActive] = useState(false)

  useEffect(() => {
    if (!glitchActive) return
    const timer = setTimeout(() => setGlitchActive(false), 200)
    return () => clearTimeout(timer)
  }, [glitchActive])

  return (
    <button
      className={`glitch-text ${className} ${glitchActive ? 'glitch-active' : ''}`}
      onClick={() => setGlitchActive(true)}
      style={{ '--glitch-intensity': intensity }}
    >
      <span className="glitch-text__main">{text}</span>
      <span className="glitch-text__ghost glitch-text__ghost--1">{text}</span>
      <span className="glitch-text__ghost glitch-text__ghost--2">{text}</span>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// SCANLINE OVERLAY - Canvas-based Perfect Scanlines
// ═══════════════════════════════════════════════════════════════
export function ScanlineOverlay({
  opacity = 0.15,
  speed = 1,
  color = 'rgba(0, 229, 255, 0.5)'
}) {
  const canvasRef = useRef(null)
  const animationRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: false })
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const animate = () => {
      animationRef.current += speed * 0.5
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw horizontal scanlines
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.globalAlpha = opacity

      for (let i = 0; i < canvas.height; i += 8) {
        const offset = (animationRef.current + i) % 40
        ctx.beginPath()
        ctx.moveTo(0, i + offset)
        ctx.lineTo(canvas.width, i + offset)
        ctx.stroke()
      }

      // Draw vertical scanlines (subtle)
      ctx.globalAlpha = opacity * 0.3
      for (let i = 0; i < canvas.width; i += 60) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [opacity, speed, color])

  return (
    <canvas
      ref={canvasRef}
      className="scanline-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════
// VHS NOISE - Retro-futuristic Distortion
// ═══════════════════════════════════════════════════════════════
export function VHSNoise({
  intensity = 0.3,
  chromaShift = true
}) {
  const canvasRef = useRef(null)
  const animationRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: false })
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const animate = () => {
      animationRef.current++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Random glitch lines
      const glitchAmount = Math.random() * intensity
      if (glitchAmount > intensity * 0.7) {
        ctx.fillStyle = `rgba(0, 229, 255, ${glitchAmount})`
        const glitchHeight = Math.random() * 20 + 5
        const glitchY = Math.random() * canvas.height
        ctx.fillRect(0, glitchY, canvas.width, glitchHeight)
      }

      // Chroma shift effect
      if (chromaShift && Math.random() > 0.95) {
        const shift = Math.random() * 3
        ctx.fillStyle = `rgba(255, 0, 100, ${intensity * 0.3})`
        ctx.fillRect(Math.random() * canvas.width - 50, Math.random() * canvas.height, 100, 30)
      }

      // Film grain noise
      ctx.globalAlpha = intensity * 0.2
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000'
        ctx.fillRect(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 2,
          Math.random() * 2
        )
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [intensity, chromaShift])

  return (
    <canvas
      ref={canvasRef}
      className="vhs-noise"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 40,
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════
// HOLOGRAPHIC CONTAINER - Floating hologram box
// ═══════════════════════════════════════════════════════════════
export function HolographicContainer({
  children,
  delay = 0,
  size = 'medium'
}) {
  return (
    <motion.div
      className={`holo-container holo-container--${size}`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
    >
      {/* Hologram glow layers */}
      <div className="holo-container__glow holo-container__glow--1" />
      <div className="holo-container__glow holo-container__glow--2" />
      <div className="holo-container__glow holo-container__glow--3" />

      {/* Wireframe edges */}
      <div className="holo-container__wireframe" />

      {/* Main content */}
      <div className="holo-container__content">
        {children}
      </div>

      {/* Corner accents */}
      <div className="holo-container__corner holo-container__corner--tl" />
      <div className="holo-container__corner holo-container__corner--tr" />
      <div className="holo-container__corner holo-container__corner--bl" />
      <div className="holo-container__corner holo-container__corner--br" />

      {/* Pulse animation */}
      <div className="holo-container__pulse" />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HOLOGRAPHIC SHOWCASE - Combined Demo
// ═══════════════════════════════════════════════════════════════
export function HolographicShowcase() {
  const [activeEffect, setActiveEffect] = useState('cards')

  return (
    <section className="holo-showcase">
      <div className="holo-showcase__header">
        <h2>
          <HolographicText
            text="Holographic Effects"
            variant="title"
          />
        </h2>
        <p>Prismatic • Glitch • Projection • Scanlines • VHS Noise</p>
      </div>

      {/* Holographic Cards Grid */}
      <div className="holo-grid">
        <HolographicCard
          title="Prismatic Shift"
          content="Colors flow and refract like a hologram displaying through multiple planes. Responsive mouse tracking creates depth."
          icon="◉"
          index={0}
          delay={0}
        />
        <HolographicCard
          title="Chromatic Aberration"
          content="Red, green, blue channels split slightly—classic retro-futuristic visual effect seen in VHS and old CRTs."
          icon="◆"
          index={1}
          delay={0.1}
        />
        <HolographicCard
          title="Scanline Overlay"
          content="Authentic CRT scanlines animate across the entire viewport. Performance-optimized with canvas rendering."
          icon="◇"
          index={2}
          delay={0.2}
        />
        <HolographicCard
          title="Projection Beams"
          content="Multi-layer beacon effect with emanating light rays. Perfect for highlighting important UI elements."
          icon="◊"
          index={3}
          delay={0.3}
        />
      </div>

      {/* Holographic Containers */}
      <div className="holo-showcase__section">
        <h3>Floating Holograms</h3>
        <div className="holo-containers">
          <HolographicContainer size="small" delay={0}>
            <div className="holo-card__icon">◉</div>
            <p>Drone AI</p>
          </HolographicContainer>
          <HolographicContainer size="medium" delay={0.1}>
            <div className="holo-card__icon">◆</div>
            <p>Secure Network</p>
          </HolographicContainer>
          <HolographicContainer size="small" delay={0.2}>
            <div className="holo-card__icon">◇</div>
            <p>Data Flow</p>
          </HolographicContainer>
        </div>
      </div>

      {/* Beacon Effects */}
      <div className="holo-showcase__beacons">
        <HolographicBeacon color="#00b4d8" size={100} intensity={1} />
        <HolographicBeacon color="#00e5ff" size={80} intensity={0.8} />
        <HolographicBeacon color="#0077b6" size={60} intensity={0.6} />
      </div>

      {/* Glitch Text Demo */}
      <div className="holo-showcase__glitch">
        <h3>Click to Glitch</h3>
        <GlitchText text="HOLOGRAPHIC_SYSTEM" intensity={0.4} />
        <GlitchText text="JINKI.CYBER" intensity={0.6} />
      </div>
    </section>
  )
}

export default HolographicShowcase
