import { useEffect, useRef, useState } from 'react'
import '../styles/NeuralNetwork.css'

/**
 * CONSTELLATION VISUALIZATION
 * Creates dynamic, data-driven constellation patterns with:
 * - Network graph rendering
 * - Hierarchical clustering
 * - Interactive data exploration
 * - Real-time animation
 */

class ConstellationStar {
  constructor(x, y, magnitude = 5, label = '', value = 0) {
    this.x = x
    this.y = y
    this.magnitude = magnitude
    this.label = label
    this.value = value
    this.intensity = 0.5
    this.targetIntensity = 0.5
    this.pulsePhase = Math.random() * Math.PI * 2
    this.connections = []
  }

  update() {
    this.targetIntensity = 0.5 + Math.sin(this.pulsePhase) * 0.3
    this.intensity += (this.targetIntensity - this.intensity) * 0.1
    this.pulsePhase += 0.02
  }

  draw(ctx, hue, saturation) {
    const brightness = 40 + this.intensity * 60
    const size = this.magnitude * (1 + this.intensity * 0.5)

    // Star core
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${brightness}%, ${this.intensity})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2)
    ctx.fill()

    // Star glow
    const glowSize = size * 2.5
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${brightness}%, ${this.intensity * 0.4})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2)
    ctx.fill()

    // Star twinkling lines (six-point star effect)
    const points = 6
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${brightness}%, ${this.intensity * 0.6})`
    ctx.lineWidth = 1
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2
      const rayLength = size * (2 + this.intensity * 3)
      const x2 = this.x + Math.cos(angle) * rayLength
      const y2 = this.y + Math.sin(angle) * rayLength
      ctx.beginPath()
      ctx.moveTo(this.x, this.y)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }
}

export default function ConstellationVisualization({
  data = null,
  width = 800,
  height = 600,
  hue = 180,
  saturation = 100,
  showLabels = true,
  interactive = true,
  className = ''
}) {
  const canvasRef = useRef(null)
  const starsRef = useRef([])
  const animationRef = useRef(null)
  const [hoveredStar, setHoveredStar] = useState(null)

  // Default constellation data if none provided
  const getDefaultConstellation = () => {
    const stars = []
    const centerX = width / 2
    const centerY = height / 2

    // Create a Pleiades-like cluster
    const clusters = [
      { x: centerX, y: centerY, count: 8, radius: 80, label: 'Core' },
      { x: centerX - 150, y: centerY - 100, count: 6, radius: 60, label: 'Data' },
      { x: centerX + 150, y: centerY - 100, count: 6, radius: 60, label: 'Processing' },
      { x: centerX - 100, y: centerY + 150, count: 5, radius: 50, label: 'Storage' },
      { x: centerX + 100, y: centerY + 150, count: 5, radius: 50, label: 'Network' },
    ]

    let starIndex = 0
    clusters.forEach((cluster) => {
      for (let i = 0; i < cluster.count; i++) {
        const angle = (i / cluster.count) * Math.PI * 2
        const r = Math.random() * cluster.radius
        const x = cluster.x + Math.cos(angle) * r
        const y = cluster.y + Math.sin(angle) * r
        const magnitude = 3 + Math.random() * 5
        stars.push(
          new ConstellationStar(x, y, magnitude, `${cluster.label}-${i}`, Math.random() * 100)
        )
        starIndex++
      }
    })

    // Connect nearby stars
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const dx = stars[i].x - stars[j].x
        const dy = stars[i].y - stars[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < 120) {
          stars[i].connections.push({
            target: stars[j],
            distance: distance,
            strength: 1 - distance / 120
          })
        }
      }
    }

    return stars
  }

  // Initialize constellation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio

    const stars = data || getDefaultConstellation()
    starsRef.current = stars

    if (interactive) {
      const handleMouseMove = (e) => {
        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        let nearest = null
        let nearestDist = 20

        stars.forEach((star) => {
          const dx = star.x - mouseX
          const dy = star.y - mouseY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < nearestDist) {
            nearestDist = dist
            nearest = star
          }
        })

        setHoveredStar(nearest)
      }

      const handleMouseLeave = () => {
        setHoveredStar(null)
      }

      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [data, width, height, interactive])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio
    ctx.scale(dpr, dpr)

    const animate = () => {
      // Clear canvas with gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#0a1428')
      gradient.addColorStop(0.5, '#0d1b2a')
      gradient.addColorStop(1, '#081020')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      const stars = starsRef.current

      // Update all stars
      stars.forEach((star) => {
        star.update()
      })

      // Draw connections first
      stars.forEach((star) => {
        star.connections.forEach((conn) => {
          const opacity = conn.strength * (0.3 + star.intensity * 0.3)
          ctx.strokeStyle = `hsla(${hue}, ${saturation}%, 60%, ${opacity})`
          ctx.lineWidth = 1 + conn.strength * 2
          ctx.beginPath()
          ctx.moveTo(star.x, star.y)
          ctx.lineTo(conn.target.x, conn.target.y)
          ctx.stroke()

          // Animated pulse along connection
          if (Math.random() < 0.05) {
            const t = 0.5
            const pulseX = star.x + (conn.target.x - star.x) * t
            const pulseY = star.y + (conn.target.y - star.y) * t
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, 70%, ${opacity})`
            ctx.beginPath()
            ctx.arc(pulseX, pulseY, 2, 0, Math.PI * 2)
            ctx.fill()
          }
        })
      })

      // Draw stars
      stars.forEach((star) => {
        star.draw(ctx, hue, saturation)
      })

      // Draw labels if enabled
      if (showLabels && hoveredStar) {
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, 80%, 1)`
        ctx.font = 'bold 12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(hoveredStar.label, hoveredStar.x, hoveredStar.y - 20)
        ctx.font = '10px monospace'
        ctx.fillText(`${hoveredStar.value.toFixed(1)}`, hoveredStar.x, hoveredStar.y - 8)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [width, height, hue, saturation, showLabels, hoveredStar])

  return (
    <div className={`constellation-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="constellation-canvas"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'block',
          margin: '0 auto'
        }}
      />
    </div>
  )
}
