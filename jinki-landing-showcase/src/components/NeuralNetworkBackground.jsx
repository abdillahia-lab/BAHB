import { useEffect, useRef, useState, useCallback } from 'react'
import '../styles/NeuralNetwork.css'

/**
 * NEURAL NETWORK BACKGROUND
 * Canvas-based animated neural network with:
 * - Dynamic node generation and connection
 * - GPU-optimized rendering
 * - Adaptive complexity based on device performance
 * - Synaptic pulse propagation through connections
 */

class NeuralNode {
  constructor(x, y, radius = 3, intensity = 0.5) {
    this.x = x
    this.y = y
    this.radius = radius
    this.intensity = intensity
    this.targetIntensity = intensity
    this.activation = 0
    this.pulseIntensity = 0
    this.vx = (Math.random() - 0.5) * 0.5
    this.vy = (Math.random() - 0.5) * 0.5
    this.connections = []
  }

  update(width, height) {
    // Subtle drift movement
    this.x += this.vx
    this.y += this.vy

    // Boundary wrapping
    if (this.x < 0) this.x = width
    if (this.x > width) this.x = 0
    if (this.y < 0) this.y = height
    if (this.y > height) this.y = 0

    // Intensity easing
    this.intensity += (this.targetIntensity - this.intensity) * 0.1
    this.activation *= 0.95 // Decay activation
    this.pulseIntensity *= 0.92 // Decay pulse
  }

  activate(strength = 1) {
    this.activation = Math.min(this.activation + strength, 1)
    this.pulseIntensity = Math.min(this.pulseIntensity + strength * 0.8, 1)
  }

  draw(ctx, hue, saturation, lightness) {
    const totalIntensity = this.intensity + this.activation * 0.5 + this.pulseIntensity * 0.3
    const radius = this.radius + this.pulseIntensity * 2

    // Glow effect
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${totalIntensity * 0.6})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, radius * 2.5, 0, Math.PI * 2)
    ctx.fill()

    // Core node
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${Math.min(lightness + 10, 100)}%, ${totalIntensity})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

class NeuralConnection {
  constructor(nodeA, nodeB, weight = 0.5) {
    this.nodeA = nodeA
    this.nodeB = nodeB
    this.weight = weight
    this.synapseIntensity = 0
    this.signalStrength = 0
  }

  update() {
    // Calculate distance for connection strength
    const dx = this.nodeB.x - this.nodeA.x
    const dy = this.nodeB.y - this.nodeA.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Synaptic signal decay and propagation
    this.synapseIntensity *= 0.93
    this.signalStrength = (this.nodeA.activation + this.nodeB.activation) * 0.5 * this.weight

    // Propagate activation along connection
    const signal = this.nodeA.activation * this.weight
    if (signal > 0.1) {
      this.nodeB.activate(signal * 0.3)
      this.synapseIntensity = Math.max(this.synapseIntensity, signal * 0.6)
    }
  }

  draw(ctx, hue, saturation) {
    const intensity = this.synapseIntensity + this.signalStrength * 0.5
    if (intensity < 0.01) return

    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, 60%, ${intensity * 0.7})`
    ctx.lineWidth = 1 + intensity * 2
    ctx.beginPath()
    ctx.moveTo(this.nodeA.x, this.nodeA.y)
    ctx.lineTo(this.nodeB.x, this.nodeB.y)
    ctx.stroke()

    // Draw synaptic pulse particles along the connection
    const t = 0.5 + Math.sin(Date.now() * 0.002) * 0.5
    const pulseX = this.nodeA.x + (this.nodeB.x - this.nodeA.x) * t
    const pulseY = this.nodeA.y + (this.nodeB.y - this.nodeA.y) * t

    ctx.fillStyle = `hsla(${hue}, ${saturation}%, 70%, ${intensity * 0.9})`
    ctx.beginPath()
    ctx.arc(pulseX, pulseY, 2 + intensity, 0, Math.PI * 2)
    ctx.fill()
  }
}

export default function NeuralNetworkBackground({
  nodeCount = 45,
  connectionDistance = 150,
  hue = 180, // Cyan
  saturation = 100,
  lightness = 50,
  autoActivate = true,
  className = ''
}) {
  const canvasRef = useRef(null)
  const nodesRef = useRef([])
  const connectionsRef = useRef([])
  const animationRef = useRef(null)
  const performanceRef = useRef({ fps: 0, lastTime: Date.now() })

  // Initialize neural network
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio

    const ctx = canvas.getContext('2d')
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Create nodes
    const nodes = []
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(
        new NeuralNode(
          Math.random() * width,
          Math.random() * height,
          2 + Math.random() * 3,
          0.3 + Math.random() * 0.5
        )
      )
    }
    nodesRef.current = nodes

    // Create connections based on proximity
    const connections = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < connectionDistance) {
          connections.push(
            new NeuralConnection(nodes[i], nodes[j], 0.5 + Math.random() * 0.5)
          )
        }
      }
    }
    connectionsRef.current = connections

    // Activate random nodes periodically
    let activationInterval
    if (autoActivate) {
      activationInterval = setInterval(() => {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)]
        randomNode.activate(0.8)

        // Cascade activation through network
        for (let i = 0; i < 3; i++) {
          const cascadeNode = nodes[Math.floor(Math.random() * nodes.length)]
          cascadeNode.activate(0.4)
        }
      }, 800)
    }

    return () => {
      if (activationInterval) clearInterval(activationInterval)
    }
  }, [nodeCount, connectionDistance])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.width / window.devicePixelRatio
    const height = canvas.height / window.devicePixelRatio
    const ctx = canvas.getContext('2d')

    const animate = () => {
      // Performance monitoring
      const now = Date.now()
      if (now - performanceRef.current.lastTime >= 1000) {
        performanceRef.current.fps = performanceRef.current.frameCount || 0
        performanceRef.current.frameCount = 0
        performanceRef.current.lastTime = now
      }
      performanceRef.current.frameCount = (performanceRef.current.frameCount || 0) + 1

      // Clear canvas with minimal alpha trail
      ctx.fillStyle = 'rgba(8, 16, 32, 0.15)'
      ctx.fillRect(0, 0, width, height)

      // Update all nodes
      nodesRef.current.forEach(node => node.update(width, height))

      // Update all connections
      connectionsRef.current.forEach(conn => conn.update())

      // Draw connections first (background)
      connectionsRef.current.forEach(conn => conn.draw(ctx, hue, saturation))

      // Draw nodes on top
      nodesRef.current.forEach(node => node.draw(ctx, hue, saturation, lightness))

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [hue, saturation, lightness])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio

      // Recalculate connections after resize
      const nodes = nodesRef.current
      const connections = []
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            connections.push(
              new NeuralConnection(nodes[i], nodes[j], 0.5 + Math.random() * 0.5)
            )
          }
        }
      }
      connectionsRef.current = connections
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [connectionDistance])

  return (
    <div className={`neural-network-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="neural-network-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  )
}
