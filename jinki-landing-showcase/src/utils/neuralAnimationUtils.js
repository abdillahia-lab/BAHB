/**
 * NEURAL ANIMATION UTILITIES
 * Shared utilities for all neural network components
 */

/**
 * Calculate distance between two points
 */
export const calculateDistance = (x1, y1, x2, y2) => {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Normalize vector
 */
export const normalize = (x, y) => {
  const magnitude = Math.sqrt(x * x + y * y)
  if (magnitude === 0) return { x: 0, y: 0 }
  return { x: x / magnitude, y: y / magnitude }
}

/**
 * Limit magnitude of vector
 */
export const limit = (x, y, max) => {
  const magnitude = Math.sqrt(x * x + y * y)
  if (magnitude > max) {
    const ratio = max / magnitude
    return { x: x * ratio, y: y * ratio }
  }
  return { x, y }
}

/**
 * Interpolate between values
 */
export const lerp = (a, b, t) => {
  return a + (b - a) * t
}

/**
 * Clamp value between min and max
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value))
}

/**
 * Ease in cubic
 */
export const easeInCubic = (t) => t * t * t

/**
 * Ease out cubic
 */
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

/**
 * Ease in-out cubic
 */
export const easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Smooth step interpolation
 */
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Random float between min and max
 */
export const randomFloat = (min, max) => {
  return Math.random() * (max - min) + min
}

/**
 * Random integer between min and max (inclusive)
 */
export const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate random HSL color
 */
export const randomHSL = (hue, saturation, lightness) => {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Generate random HSLA color
 */
export const randomHSLA = (hue, saturation, lightness, alpha) => {
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
}

/**
 * Perlin noise approximation using sine waves
 */
export const perlinNoise = (x, y, time = 0) => {
  const result = Math.sin(x * 0.1) * Math.sin(y * 0.1) +
                 Math.sin((x + y) * 0.05) * Math.cos((x - y) * 0.05) +
                 Math.sin(time * 0.01) * 0.5
  return (result + 2) / 4 // Normalize to 0-1
}

/**
 * Grid index from x, y coordinates
 */
export const getGridIndex = (x, y, gridWidth) => {
  return y * gridWidth + x
}

/**
 * Grid coordinates from index
 */
export const getGridCoords = (index, gridWidth) => {
  return {
    x: index % gridWidth,
    y: Math.floor(index / gridWidth)
  }
}

/**
 * Calculate centroid of points
 */
export const calculateCentroid = (points) => {
  if (points.length === 0) return { x: 0, y: 0 }
  let sumX = 0
  let sumY = 0
  points.forEach(p => {
    sumX += p.x
    sumY += p.y
  })
  return {
    x: sumX / points.length,
    y: sumY / points.length
  }
}

/**
 * Convert degrees to radians
 */
export const toRadians = (degrees) => {
  return degrees * (Math.PI / 180)
}

/**
 * Convert radians to degrees
 */
export const toDegrees = (radians) => {
  return radians * (180 / Math.PI)
}

/**
 * Get angle between two points
 */
export const getAngle = (x1, y1, x2, y2) => {
  return Math.atan2(y2 - y1, x2 - x1)
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  constructor() {
    this.frames = 0
    this.lastTime = performance.now()
    this.fps = 60
    this.frameTime = 16.67
  }

  tick() {
    this.frames++
    const now = performance.now()
    const elapsed = now - this.lastTime

    if (elapsed >= 1000) {
      this.fps = this.frames
      this.frameTime = elapsed / this.frames
      this.frames = 0
      this.lastTime = now
    }
  }

  getStats() {
    return {
      fps: this.fps,
      frameTime: this.frameTime.toFixed(2) + 'ms',
      isPerforming: this.fps >= 50
    }
  }
}

/**
 * Throttle function calls
 */
export const throttle = (func, delay) => {
  let lastCall = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      return func(...args)
    }
  }
}

/**
 * Debounce function calls
 */
export const debounce = (func, delay) => {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Map range of values
 */
export const mapRange = (value, inMin, inMax, outMin, outMax) => {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
}

/**
 * Check if point is inside circle
 */
export const pointInCircle = (px, py, cx, cy, radius) => {
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= radius * radius
}

/**
 * Check if point is inside rectangle
 */
export const pointInRect = (px, py, x, y, width, height) => {
  return px >= x && px <= x + width && py >= y && py <= y + height
}

/**
 * Get average value of array
 */
export const average = (arr) => {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

/**
 * Get max value of array
 */
export const getMax = (arr) => {
  return Math.max(...arr)
}

/**
 * Get min value of array
 */
export const getMin = (arr) => {
  return Math.min(...arr)
}

/**
 * Create gradient for canvas
 */
export const createNeuralGradient = (ctx, x0, y0, x1, y1, hue, saturation) => {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
  gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, 40%, 0.8)`)
  gradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, 60%, 1)`)
  gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, 40%, 0.8)`)
  return gradient
}

/**
 * Animation frame controller
 */
export class AnimationFrameController {
  constructor() {
    this.frameId = null
    this.isRunning = false
  }

  start(callback) {
    if (this.isRunning) return
    this.isRunning = true

    const animate = () => {
      callback()
      if (this.isRunning) {
        this.frameId = requestAnimationFrame(animate)
      }
    }

    this.frameId = requestAnimationFrame(animate)
  }

  stop() {
    this.isRunning = false
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  isActive() {
    return this.isRunning
  }
}

/**
 * Particle pool for efficient memory management
 */
export class ParticlePool {
  constructor(ParticleClass, size) {
    this.ParticleClass = ParticleClass
    this.size = size
    this.available = []
    this.inUse = []

    // Pre-allocate particles
    for (let i = 0; i < size; i++) {
      this.available.push(new ParticleClass())
    }
  }

  acquire(...args) {
    let particle
    if (this.available.length > 0) {
      particle = this.available.pop()
      particle.init?.(...args)
    } else {
      particle = new this.ParticleClass(...args)
    }
    this.inUse.push(particle)
    return particle
  }

  release(particle) {
    const index = this.inUse.indexOf(particle)
    if (index > -1) {
      this.inUse.splice(index, 1)
      particle.reset?.()
      this.available.push(particle)
    }
  }

  releaseAll() {
    while (this.inUse.length > 0) {
      this.release(this.inUse[0])
    }
  }

  getActive() {
    return this.inUse
  }

  getAvailable() {
    return this.available.length
  }
}

export default {
  calculateDistance,
  normalize,
  limit,
  lerp,
  clamp,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  smoothstep,
  randomFloat,
  randomInt,
  randomHSL,
  randomHSLA,
  perlinNoise,
  getGridIndex,
  getGridCoords,
  calculateCentroid,
  toRadians,
  toDegrees,
  getAngle,
  PerformanceMonitor,
  throttle,
  debounce,
  mapRange,
  pointInCircle,
  pointInRect,
  average,
  getMax,
  getMin,
  createNeuralGradient,
  AnimationFrameController,
  ParticlePool
}
