import { useEffect, useRef, useState } from 'react'
import { useScroll, useTransform } from 'framer-motion'
import '../styles/NeuralNetwork.css'

/**
 * GENERATIVE PATTERNS
 * Canvas-based generative art that evolves with scroll:
 * - Perlin noise-based patterns
 * - Scroll-reactive mutation
 * - Organic growth algorithms
 * - Performance-optimized rendering
 */

class GenerativeFieldNode {
  constructor(x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.value = Math.random()
    this.velocity = (Math.random() - 0.5) * 0.1
    this.neighbors = []
  }

  step() {
    // Influence from neighbors
    if (this.neighbors.length > 0) {
      let sum = 0
      this.neighbors.forEach(neighbor => {
        sum += neighbor.value
      })
      const average = sum / this.neighbors.length
      this.value = this.value * 0.7 + average * 0.3
    }

    // Self-evolution
    this.value += this.velocity
    this.value = Math.max(0, Math.min(1, this.value))

    // Spontaneous mutation
    if (Math.random() < 0.01) {
      this.velocity = (Math.random() - 0.5) * 0.15
    }
  }

  draw(ctx, hue, saturation) {
    const brightness = 30 + this.value * 70
    const size = Math.sqrt(this.width * this.height) / 2

    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${brightness}%, ${this.value * 0.8})`
    ctx.fillRect(this.x, this.y, this.width, this.height)

    if (this.value > 0.5) {
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${brightness}%, ${(this.value - 0.5) * 0.4})`
      ctx.lineWidth = 1
      ctx.strokeRect(this.x, this.y, this.width, this.height)
    }
  }
}

export default function GenerativePatterns({
  gridSize = 30,
  hue = 180,
  saturation = 100,
  scrollInfluence = 0.3,
  updateSpeed = 2,
  className = ''
}) {
  const canvasRef = useRef(null)
  const gridRef = useRef([])
  const animationRef = useRef(null)
  const scrollRef = useRef(0)
  const [isVisible, setIsVisible] = useState(false)

  // Intersection observer for optimization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  // Initialize generative grid
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio

    const cellWidth = width / gridSize
    const cellHeight = height / gridSize

    const grid = []
    for (let y = 0; y < gridSize; y++) {
      grid[y] = []
      for (let x = 0; x < gridSize; x++) {
        grid[y][x] = new GenerativeFieldNode(x * cellWidth, y * cellHeight, cellWidth, cellHeight)
      }
    }

    // Connect neighbors
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = grid[y][x]
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = (x + dx + gridSize) % gridSize
            const ny = (y + dy + gridSize) % gridSize
            cell.neighbors.push(grid[ny][nx])
          }
        }
      }
    }

    gridRef.current = grid
  }, [gridSize])

  // Scroll listener for pattern mutation
  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isVisible) return

    const width = canvas.width / window.devicePixelRatio
    const height = canvas.height / window.devicePixelRatio
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio
    ctx.scale(dpr, dpr)

    let frameCount = 0

    const animate = () => {
      frameCount++

      // Clear canvas
      ctx.fillStyle = 'rgba(8, 16, 32, 0.2)'
      ctx.fillRect(0, 0, width, height)

      const grid = gridRef.current
      if (grid.length === 0) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      // Apply scroll influence
      const scrollMutation = (scrollRef.current / window.innerHeight) * scrollInfluence
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          grid[y][x].value += scrollMutation * 0.01
        }
      }

      // Update grid
      if (frameCount % updateSpeed === 0) {
        for (let y = 0; y < grid.length; y++) {
          for (let x = 0; x < grid[y].length; x++) {
            grid[y][x].step()
          }
        }
      }

      // Draw grid
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          grid[y][x].draw(ctx, hue, saturation)
        }
      }

      // Draw connections between high-value nodes
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const cell = grid[y][x]
          if (cell.value > 0.6) {
            cell.neighbors.forEach(neighbor => {
              if (neighbor.value > 0.6) {
                ctx.strokeStyle = `hsla(${hue}, ${saturation}%, 60%, ${(cell.value + neighbor.value) * 0.15})`
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(
                  cell.x + cell.width / 2,
                  cell.y + cell.height / 2
                )
                ctx.lineTo(
                  neighbor.x + neighbor.width / 2,
                  neighbor.y + neighbor.height / 2
                )
                ctx.stroke()
              }
            })
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [hue, saturation, scrollInfluence, updateSpeed, isVisible])

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
    <div className={`generative-pattern-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="generative-pattern-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  )
}
