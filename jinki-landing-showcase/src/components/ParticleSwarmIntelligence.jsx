import { useEffect, useRef, useState } from 'react'
import '../styles/NeuralNetwork.css'

/**
 * PARTICLE SWARM INTELLIGENCE
 * Implements flocking behavior and swarm algorithms:
 * - Separation: avoid crowding neighbors
 * - Alignment: steer towards average heading of neighbors
 * - Cohesion: steer to move toward average location of neighbors
 * - Attraction to target: pursue interactive goals
 */

class SwarmParticle {
  constructor(x, y, targetX, targetY) {
    this.x = x
    this.y = y
    this.targetX = targetX
    this.targetY = targetY
    this.vx = (Math.random() - 0.5) * 2
    this.vy = (Math.random() - 0.5) * 2
    this.ax = 0
    this.ay = 0
    this.radius = 2 + Math.random() * 1.5
    this.mass = this.radius
    this.maxSpeed = 2 + Math.random() * 1
    this.energy = 1
    this.color = Math.random()
  }

  applyForce(fx, fy) {
    this.ax += fx / this.mass
    this.ay += fy / this.mass
  }

  separate(particles, desiredSeparation) {
    let steer = [0, 0]
    let count = 0

    for (let other of particles) {
      const dx = this.x - other.x
      const dy = this.y - other.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0 && distance < desiredSeparation) {
        const sx = (dx / distance) * (desiredSeparation - distance)
        const sy = (dy / distance) * (desiredSeparation - distance)
        steer[0] += sx
        steer[1] += sy
        count++
      }
    }

    if (count > 0) {
      steer[0] /= count
      steer[1] /= count
    }

    const magnitude = Math.sqrt(steer[0] * steer[0] + steer[1] * steer[1])
    if (magnitude > 0) {
      steer[0] = (steer[0] / magnitude) * this.maxSpeed * 0.5
      steer[1] = (steer[1] / magnitude) * this.maxSpeed * 0.5
    }

    return steer
  }

  align(particles, perceptionRadius) {
    let sumVx = 0
    let sumVy = 0
    let count = 0

    for (let other of particles) {
      const dx = this.x - other.x
      const dy = this.y - other.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0 && distance < perceptionRadius) {
        sumVx += other.vx
        sumVy += other.vy
        count++
      }
    }

    if (count > 0) {
      sumVx /= count
      sumVy /= count
      const magnitude = Math.sqrt(sumVx * sumVx + sumVy * sumVy)
      if (magnitude > 0) {
        sumVx = (sumVx / magnitude) * this.maxSpeed * 0.3
        sumVy = (sumVy / magnitude) * this.maxSpeed * 0.3
      }
    }

    return [sumVx, sumVy]
  }

  cohesion(particles, perceptionRadius) {
    let sumX = 0
    let sumY = 0
    let count = 0

    for (let other of particles) {
      const dx = this.x - other.x
      const dy = this.y - other.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0 && distance < perceptionRadius) {
        sumX += other.x
        sumY += other.y
        count++
      }
    }

    if (count > 0) {
      sumX /= count
      sumY /= count
      const dirX = sumX - this.x
      const dirY = sumY - this.y
      const magnitude = Math.sqrt(dirX * dirX + dirY * dirY)

      if (magnitude > 0) {
        return [(dirX / magnitude) * this.maxSpeed * 0.3, (dirY / magnitude) * this.maxSpeed * 0.3]
      }
    }

    return [0, 0]
  }

  seek(targetX, targetY, weight = 0.5) {
    const dx = targetX - this.x
    const dy = targetY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 10) return [0, 0]

    if (distance > 0) {
      return [(dx / distance) * this.maxSpeed * weight, (dy / distance) * this.maxSpeed * weight]
    }

    return [0, 0]
  }

  update(width, height) {
    // Update velocity
    this.vx += this.ax * 0.1
    this.vy += this.ay * 0.1

    // Limit speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed
      this.vy = (this.vy / speed) * this.maxSpeed
    }

    // Update position
    this.x += this.vx
    this.y += this.vy

    // Boundary wrapping
    if (this.x < 0) this.x = width
    if (this.x > width) this.x = 0
    if (this.y < 0) this.y = height
    if (this.y > height) this.y = 0

    // Reset acceleration
    this.ax = 0
    this.ay = 0

    // Decay energy
    this.energy *= 0.98
  }

  draw(ctx, hue, saturation) {
    const brightness = 40 + this.energy * 40
    const size = this.radius + this.energy * 2

    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${brightness}%, ${this.energy})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2)
    ctx.fill()

    if (this.energy > 0.5) {
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${brightness}%, ${this.energy * 0.5})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
}

export default function ParticleSwarmIntelligence({
  particleCount = 80,
  targetX = null,
  targetY = null,
  hue = 180,
  saturation = 100,
  separationWeight = 1.5,
  alignmentWeight = 1,
  cohesionWeight = 1,
  seekWeight = 0.8,
  className = ''
}) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationRef = useRef(null)
  const mouseRef = useRef({ x: null, y: null })

  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio

    const targetPosX = targetX !== null ? targetX : width / 2
    const targetPosY = targetY !== null ? targetY : height / 2

    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push(
        new SwarmParticle(
          Math.random() * width,
          Math.random() * height,
          targetPosX,
          targetPosY
        )
      )
    }
    particlesRef.current = particles

    // Mouse tracking
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = (e.clientX - rect.left) * window.devicePixelRatio
      mouseRef.current.y = (e.clientY - rect.top) * window.devicePixelRatio
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [particleCount, targetX, targetY])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.width / window.devicePixelRatio
    const height = canvas.height / window.devicePixelRatio
    const ctx = canvas.getContext('2d')

    const desiredSeparation = 25
    const perceptionRadius = 50

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(8, 16, 32, 0.1)'
      ctx.fillRect(0, 0, width, height)

      const particles = particlesRef.current

      // Update each particle
      for (let particle of particles) {
        // Flocking forces
        const separate = particle.separate(particles, desiredSeparation)
        const align = particle.align(particles, perceptionRadius)
        const cohesion = particle.cohesion(particles, perceptionRadius)

        // Apply forces
        particle.applyForce(separate[0] * separationWeight, separate[1] * separationWeight)
        particle.applyForce(align[0] * alignmentWeight, align[1] * alignmentWeight)
        particle.applyForce(cohesion[0] * cohesionWeight, cohesion[1] * cohesionWeight)

        // Seek target
        let seekTarget = [particle.targetX, particle.targetY]
        if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
          seekTarget = [mouseRef.current.x, mouseRef.current.y]
        }
        const seek = particle.seek(seekTarget[0], seekTarget[1], seekWeight)
        particle.applyForce(seek[0], seek[1])

        // Update position
        particle.update(width, height)

        // Draw particle
        particle.draw(ctx, hue, saturation)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [hue, saturation, separationWeight, alignmentWeight, cohesionWeight, seekWeight])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`particle-swarm-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="particle-swarm-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair'
        }}
      />
    </div>
  )
}
