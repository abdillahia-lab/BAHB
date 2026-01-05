import { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

/**
 * PARTICLE FLOW SYSTEM - Data visualization via particle animation
 * GPU-optimized canvas rendering with data flow representation
 */
export function ParticleFlowSystem({
  width = 800,
  height = 600,
  particleCount = 150,
  speed = 2,
  color = '#06f',
  glowColor = '#0ff',
  animationSpeed = 1,
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const particlesRef = useRef([])
  const animationRef = useRef(null)
  const isInViewRef = useInView(containerRef)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false })

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Particle class
    class Particle {
      constructor(x, y) {
        this.x = x
        this.y = y
        this.vx = (Math.random() - 0.5) * (speed * animationSpeed)
        this.vy = (Math.random() - 0.5) * (speed * animationSpeed)
        this.radius = Math.random() * 2 + 1
        this.life = Math.random() * 0.5 + 0.5
        this.maxLife = this.life
        this.charge = Math.random() > 0.5 ? 1 : -1
      }

      update(particles) {
        // Movement
        this.x += this.vx
        this.y += this.vy

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width
        if (this.x > canvas.width) this.x = 0
        if (this.y < 0) this.y = canvas.height
        if (this.y > canvas.height) this.y = 0

        // Particle repulsion/attraction
        for (let i = 0; i < particles.length; i++) {
          const other = particles[i]
          if (other === this) continue

          const dx = other.x - this.x
          const dy = other.y - this.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100 && distance > 5) {
            const force = (this.charge === other.charge ? -1 : 1) * 0.3 / distance
            this.vx += (dx / distance) * force
            this.vy += (dy / distance) * force
          }
        }

        // Damping
        this.vx *= 0.99
        this.vy *= 0.99

        // Fade out
        this.life -= 0.005 * animationSpeed
      }

      draw(ctx) {
        const alpha = (this.life / this.maxLife) * 0.8
        ctx.globalAlpha = alpha

        // Glow effect
        ctx.shadowColor = glowColor
        ctx.shadowBlur = 15
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        // Draw particle
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()

        // Draw connection lines to nearby particles
        ctx.globalAlpha = alpha * 0.3
        ctx.strokeStyle = color
        ctx.lineWidth = 0.5
      }

      isAlive() {
        return this.life > 0
      }
    }

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = []
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(
          new Particle(
            Math.random() * canvas.width,
            Math.random() * canvas.height
          )
        )
      }
    }

    initParticles()

    // Animation loop
    const animate = () => {
      // Clear with fade trail
      ctx.globalAlpha = 0.1
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalAlpha = 1

      // Update and draw particles
      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(particles)
        particles[i].draw(ctx)

        if (!particles[i].isAlive()) {
          particles.splice(i, 1)
        }
      }

      // Add new particles
      if (particles.length < particleCount) {
        particles.push(
          new Particle(Math.random() * canvas.width, Math.random() * canvas.height)
        )
      }

      // Draw connection network
      ctx.globalAlpha = 0.15
      ctx.strokeStyle = glowColor
      ctx.lineWidth = 0.5

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particles[i].x
          const dy = particles[j].y - particles[i].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      ctx.globalAlpha = 1
      ctx.shadowColor = 'transparent'

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [width, height, particleCount, speed, color, glowColor, animationSpeed])

  return (
    <div
      ref={containerRef}
      className="particle-flow-container"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: width,
        margin: '0 auto',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: `0 0 40px ${color}40`,
        background: 'linear-gradient(135deg, rgba(10,10,30,0.9) 0%, rgba(20,20,50,0.9) 100%)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          aspectRatio: `${width}/${height}`,
        }}
      />
    </div>
  )
}

export default ParticleFlowSystem
