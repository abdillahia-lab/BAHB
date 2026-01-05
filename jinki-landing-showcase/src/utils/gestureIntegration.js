// GESTURAL: Integration utilities for common gesture patterns
// Ready-to-use handlers for common UI interactions

import { GESTURE_TYPES } from './gestureConfig'

/**
 * Create a swipe-based slide/carousel controller
 */
export const createSlideController = (itemCount, onSlideChange) => {
  let currentSlide = 0

  return {
    handleSwipe: (direction) => {
      if (direction === 'right' || direction === 'up') {
        currentSlide = (currentSlide - 1 + itemCount) % itemCount
      } else if (direction === 'left' || direction === 'down') {
        currentSlide = (currentSlide + 1) % itemCount
      }
      onSlideChange(currentSlide)
    },
    getCurrentSlide: () => currentSlide,
    goToSlide: (index) => {
      currentSlide = Math.max(0, Math.min(index, itemCount - 1))
      onSlideChange(currentSlide)
    },
  }
}

/**
 * Create a pinch-zoom controller for images
 */
export const createZoomController = (minZoom = 1, maxZoom = 3, onZoomChange) => {
  let currentZoom = minZoom

  return {
    handlePinch: (data) => {
      const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * data.scale))
      currentZoom = newZoom
      onZoomChange(currentZoom)
    },
    getZoom: () => currentZoom,
    reset: () => {
      currentZoom = minZoom
      onZoomChange(currentZoom)
    },
    zoomIn: () => {
      currentZoom = Math.min(maxZoom, currentZoom * 1.2)
      onZoomChange(currentZoom)
    },
    zoomOut: () => {
      currentZoom = Math.max(minZoom, currentZoom / 1.2)
      onZoomChange(currentZoom)
    },
  }
}

/**
 * Create a 3D rotation controller
 */
export const createRotationController = (onRotationChange) => {
  let rotation = { x: 0, y: 0, z: 0 }

  return {
    handleRotate: (data) => {
      rotation.z = (rotation.z + data.angleDelta) % 360
      onRotationChange(rotation)
    },
    getRotation: () => ({ ...rotation }),
    reset: () => {
      rotation = { x: 0, y: 0, z: 0 }
      onRotationChange(rotation)
    },
    setRotation: (x, y, z) => {
      rotation = { x: x % 360, y: y % 360, z: z % 360 }
      onRotationChange(rotation)
    },
  }
}

/**
 * Create a context menu controller (for long press)
 */
export const createContextMenuController = () => {
  let isVisible = false
  let position = { x: 0, y: 0 }

  return {
    handleLongPress: (data) => {
      position = { x: data.x, y: data.y }
      isVisible = true
    },
    getPosition: () => ({ ...position }),
    isMenuVisible: () => isVisible,
    close: () => {
      isVisible = false
    },
  }
}

/**
 * Create an easter egg manager
 */
export const createEasterEggManager = (maxCount = 5) => {
  let shakeCount = 0
  let shakeTime = 0
  const eggs = new Map()

  return {
    handleShake: () => {
      shakeCount++
      shakeTime = Date.now()

      const egg = eggs.get(shakeCount)
      if (egg) {
        egg.trigger()
        return shakeCount
      }

      return null
    },
    registerEgg: (count, callback) => {
      eggs.set(count, { trigger: callback })
    },
    getShakeCount: () => shakeCount,
    resetShakeCount: () => {
      shakeCount = 0
    },
    resetIfExpired: (timeout = 2000) => {
      if (Date.now() - shakeTime > timeout) {
        shakeCount = 0
      }
    },
  }
}

/**
 * Create a gesture-based filter/search controller
 */
export const createDrawGestureController = () => {
  const shapes = {
    circle: () => console.log('Circle detected'),
    zigzag: () => console.log('Zigzag detected'),
    line: () => console.log('Line detected'),
  }

  return {
    handleDraw: (data) => {
      const handler = shapes[data.shape]
      if (handler) {
        handler()
      }
    },
    registerShape: (shapeName, callback) => {
      shapes[shapeName] = callback
    },
  }
}

/**
 * Create a gesture recorder for analytics
 */
export class GestureRecorder {
  constructor() {
    this.gestures = []
    this.sessionStart = Date.now()
  }

  record(gesture) {
    this.gestures.push({
      ...gesture,
      sessionTime: Date.now() - this.sessionStart,
    })
  }

  getRecordedGestures() {
    return [...this.gestures]
  }

  getStats() {
    const stats = {
      totalGestures: this.gestures.length,
      byType: {},
      sessionDuration: Date.now() - this.sessionStart,
    }

    for (const gesture of this.gestures) {
      stats.byType[gesture.type] = (stats.byType[gesture.type] || 0) + 1
    }

    return stats
  }

  export() {
    return {
      session: {
        start: new Date(this.sessionStart),
        duration: Date.now() - this.sessionStart,
      },
      gestures: this.getRecordedGestures(),
      stats: this.getStats(),
    }
  }

  reset() {
    this.gestures = []
    this.sessionStart = Date.now()
  }
}

/**
 * Gesture combos - detect sequences of gestures
 */
export class GestureComboDetector {
  constructor() {
    this.gestures = []
    this.timeout = 2000
    this.lastGestureTime = 0
    this.combos = new Map()
  }

  record(gesture) {
    // Clear old gestures
    const now = Date.now()
    if (now - this.lastGestureTime > this.timeout) {
      this.gestures = []
    }

    this.gestures.push(gesture)
    this.lastGestureTime = now

    // Check for registered combos
    for (const [pattern, callback] of this.combos) {
      if (this.matchesPattern(pattern)) {
        callback()
        this.gestures = [] // Reset after match
      }
    }
  }

  registerCombo(pattern, callback) {
    // pattern is array of gesture types
    // e.g., [GESTURE_TYPES.SWIPE, GESTURE_TYPES.TAP]
    this.combos.set(JSON.stringify(pattern), callback)
  }

  matchesPattern(pattern) {
    if (this.gestures.length < pattern.length) return false

    const recentGestures = this.gestures.slice(-pattern.length)
    return pattern.every((type, i) => recentGestures[i].type === type)
  }

  clear() {
    this.gestures = []
  }
}

/**
 * Gesture analytics - track and analyze gesture usage
 */
export class GestureAnalytics {
  constructor() {
    this.events = []
    this.sessionStart = Date.now()
  }

  recordGesture(gesture) {
    this.events.push({
      type: gesture.type,
      direction: gesture.direction,
      timestamp: Date.now(),
      duration: gesture.duration,
      distance: gesture.distance,
      velocity: gesture.velocity,
    })
  }

  getMostUsedGestures(limit = 5) {
    const counts = {}
    for (const event of this.events) {
      counts[event.type] = (counts[event.type] || 0) + 1
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([type, count]) => ({ type, count }))
  }

  getAverageVelocity(gestureType) {
    const matching = this.events.filter(e => e.type === gestureType)
    if (matching.length === 0) return 0

    const sum = matching.reduce((acc, e) => acc + e.velocity, 0)
    return sum / matching.length
  }

  getSessionDuration() {
    return Date.now() - this.sessionStart
  }

  getReport() {
    return {
      sessionDuration: this.getSessionDuration(),
      totalGestures: this.events.length,
      mostUsed: this.getMostUsedGestures(),
      byType: this.getByType(),
    }
  }

  getByType() {
    const grouped = {}
    for (const event of this.events) {
      if (!grouped[event.type]) {
        grouped[event.type] = []
      }
      grouped[event.type].push(event)
    }
    return grouped
  }

  reset() {
    this.events = []
    this.sessionStart = Date.now()
  }
}

/**
 * Gesture accessibility utilities
 */
export const createAccessibleGestureAlternative = () => {
  return {
    createKeyboardShortcuts: () => ({
      'ArrowRight': 'next',
      'ArrowLeft': 'previous',
      'ArrowUp': 'previous',
      'ArrowDown': 'next',
      'Enter': 'select',
      'Escape': 'close',
      '+': 'zoom-in',
      '-': 'zoom-out',
      'r': 'rotate',
    }),
    announceGesture: (gesture, ariaLive = 'polite') => {
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.setAttribute('aria-live', ariaLive)
      announcement.setAttribute('aria-atomic', 'true')
      announcement.textContent = `${gesture.type} gesture detected${gesture.direction ? ` (${gesture.direction})` : ''}`
      document.body.appendChild(announcement)

      setTimeout(() => announcement.remove(), 1000)
    },
  }
}
