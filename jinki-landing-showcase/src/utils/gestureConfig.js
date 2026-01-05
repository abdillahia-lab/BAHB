// GESTURAL: Advanced gesture configuration and detection
// Handles all gesture types with precise thresholds and customization

export const GESTURE_TYPES = {
  SWIPE: 'swipe',
  PINCH: 'pinch',
  ROTATE: 'rotate',
  LONG_PRESS: 'long_press',
  SHAKE: 'shake',
  DRAW: 'draw',
  PALM_REJECT: 'palm_reject',
  TAP: 'tap',
  DOUBLE_TAP: 'double_tap',
}

export const GESTURE_DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  DIAGONAL_UP_LEFT: 'diagonal-up-left',
  DIAGONAL_UP_RIGHT: 'diagonal-up-right',
  DIAGONAL_DOWN_LEFT: 'diagonal-down-left',
  DIAGONAL_DOWN_RIGHT: 'diagonal-down-right',
}

export const GESTURE_THRESHOLDS = {
  // Swipe thresholds
  SWIPE_VELOCITY: 0.5, // px/ms
  SWIPE_DISTANCE: 50, // px
  SWIPE_ANGLE_TOLERANCE: 25, // degrees

  // Pinch thresholds
  PINCH_DISTANCE: 20, // px change
  PINCH_VELOCITY: 0.1,

  // Rotate thresholds
  ROTATE_ANGLE: 15, // degrees
  ROTATE_VELOCITY: 0.5, // degrees/ms

  // Long press thresholds
  LONG_PRESS_DURATION: 500, // ms
  LONG_PRESS_MOVEMENT_TOLERANCE: 10, // px

  // Shake thresholds
  SHAKE_THRESHOLD: 15, // acceleration units
  SHAKE_DURATION: 300, // ms
  SHAKE_COUNT: 3, // number of shakes

  // Draw gesture thresholds
  DRAW_MIN_POINTS: 20,
  DRAW_COMPLETION_TIME: 500, // ms

  // Palm rejection
  PALM_MIN_AREA: 3000, // px²
  PALM_MIN_WIDTH: 80, // px

  // Tap thresholds
  TAP_DURATION: 250, // ms
  TAP_MOVEMENT_TOLERANCE: 10, // px
  DOUBLE_TAP_DELAY: 300, // ms
}

export const GESTURE_FEEDBACK = {
  COLORS: {
    SWIPE: '#00D4FF', // Cyan
    PINCH: '#FF00FF', // Magenta
    ROTATE: '#FFD700', // Gold
    LONG_PRESS: '#FF6B6B', // Red
    SHAKE: '#00FF00', // Green
    DRAW: '#00FF88', // Bright green
    TAP: '#00D4FF', // Cyan
  },
  DURATION: 300, // ms
  PARTICLE_COUNT: 12,
  TRAIL_LENGTH: 30,
}

export const MOUSE_TO_TOUCH_MAPPING = {
  // Desktop mouse gestures mapped to touch equivalents
  LEFT_BUTTON: 'touch',
  MIDDLE_BUTTON: 'middle',
  RIGHT_BUTTON: 'right',
  MOUSE_WHEEL: 'pinch',
}

export const DEVICE_DETECTION = {
  isTouch: typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0),
  isMouse: typeof window !== 'undefined' &&
    matchMedia('(pointer:fine)').matches,
  isStylus: typeof window !== 'undefined' &&
    navigator.maxTouchPoints >= 1,
}

export const getAngleBetweenPoints = (p1, p2) => {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.atan2(dy, dx) * (180 / Math.PI)
}

export const getDistanceBetweenPoints = (p1, p2) => {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

export const getVelocity = (distance, time) => {
  return time > 0 ? distance / time : 0
}

export const getSwipeDirection = (startX, startY, endX, endY) => {
  const dx = endX - startX
  const dy = endY - startY
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  // Normalize angle to 0-360
  const normalizedAngle = (angle + 360) % 360

  if (normalizedAngle < 22.5 || normalizedAngle > 337.5) return GESTURE_DIRECTIONS.RIGHT
  if (normalizedAngle < 67.5) return GESTURE_DIRECTIONS.DIAGONAL_DOWN_RIGHT
  if (normalizedAngle < 112.5) return GESTURE_DIRECTIONS.DOWN
  if (normalizedAngle < 157.5) return GESTURE_DIRECTIONS.DIAGONAL_DOWN_LEFT
  if (normalizedAngle < 202.5) return GESTURE_DIRECTIONS.LEFT
  if (normalizedAngle < 247.5) return GESTURE_DIRECTIONS.DIAGONAL_UP_LEFT
  if (normalizedAngle < 292.5) return GESTURE_DIRECTIONS.UP
  return GESTURE_DIRECTIONS.DIAGONAL_UP_RIGHT
}

export const detectGestureShape = (points) => {
  if (points.length < 10) return null

  // Calculate bounding box
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const width = maxX - minX
  const height = maxY - minY
  const ratio = width / height

  // Check if it's a circle
  if (Math.abs(ratio - 1) < 0.3) {
    // Calculate how circular the shape is
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const radius = (width + height) / 4

    let circularityScore = 0
    for (let point of points) {
      const dist = getDistanceBetweenPoints(point, { x: centerX, y: centerY })
      circularityScore += Math.abs(dist - radius)
    }
    circularityScore /= points.length

    if (circularityScore < radius * 0.3) {
      return 'circle'
    }
  }

  // Check if it's a zigzag
  if (points.length > 20) {
    let directionChanges = 0
    let lastDx = 0
    let lastDy = 0

    for (let i = 2; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x
      const dy = points[i].y - points[i - 1].y

      if (lastDx * dx < 0 || lastDy * dy < 0) {
        directionChanges++
      }
      lastDx = dx
      lastDy = dy
    }

    if (directionChanges > 5) {
      return 'zigzag'
    }
  }

  // Check if it's a line
  if (ratio > 2 || ratio < 0.5) {
    return 'line'
  }

  return 'free'
}

export const isPalmTouch = (touchEvent) => {
  // Palm rejection based on touch area and width
  if (touchEvent.radiusX && touchEvent.radiusY) {
    const area = Math.PI * touchEvent.radiusX * touchEvent.radiusY
    const width = touchEvent.radiusX * 2

    return (
      area > GESTURE_THRESHOLDS.PALM_MIN_AREA ||
      width > GESTURE_THRESHOLDS.PALM_MIN_WIDTH
    )
  }
  return false
}

export const isStypuTouch = (touchEvent) => {
  // Stylus detection: small touch area, high pressure
  if (touchEvent.force !== undefined && touchEvent.force > 0.5) {
    return true
  }
  if (touchEvent.radiusX && touchEvent.radiusY) {
    const area = Math.PI * touchEvent.radiusX * touchEvent.radiusY
    return area < 500 // Small contact area
  }
  return false
}
