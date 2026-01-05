// GESTURAL: Finite State Machine for gesture recognition
// Manages gesture states and transitions with validation

import { GESTURE_TYPES, GESTURE_DIRECTIONS, GESTURE_THRESHOLDS } from './gestureConfig'

export class GestureStateMachine {
  constructor() {
    this.state = 'idle'
    this.previousState = 'idle'
    this.touchStartTime = 0
    this.touchStartPos = { x: 0, y: 0 }
    this.currentTouchPos = { x: 0, y: 0 }
    this.gestureData = {}
    this.listeners = new Map()
    this.touchHistory = []
    this.recognizedGestures = []
    this.activeTouches = new Map()
    this.palmDetected = false
    this.stylusDetected = false

    // Transition rules
    this.transitions = {
      idle: ['touch_start', 'mouse_move'],
      touch_start: ['move', 'long_press', 'double_tap'],
      move: ['swipe', 'pinch', 'rotate', 'draw'],
      long_press: ['move', 'release'],
      swipe: ['release'],
      pinch: ['release', 'move'],
      rotate: ['release', 'move'],
      draw: ['release'],
      release: ['idle'],
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
    return () => this.listeners.get(event).splice(
      this.listeners.get(event).indexOf(callback), 1
    )
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data))
    }
  }

  setState(newState, data = {}) {
    if (!this.isValidTransition(this.state, newState)) {
      console.warn(`Invalid transition: ${this.state} -> ${newState}`)
      return false
    }

    this.previousState = this.state
    this.state = newState
    this.gestureData = { ...this.gestureData, ...data }

    this.emit('state_change', {
      from: this.previousState,
      to: newState,
      data: this.gestureData,
    })

    return true
  }

  isValidTransition(from, to) {
    return this.transitions[from]?.includes(to) || to === 'idle'
  }

  recordTouch(x, y, touchId = 'primary') {
    const timestamp = Date.now()
    const touch = { x, y, timestamp, touchId }

    this.touchHistory.push(touch)
    this.activeTouches.set(touchId, touch)

    // Keep history limited
    if (this.touchHistory.length > 100) {
      this.touchHistory.shift()
    }

    return touch
  }

  getTouchHistory() {
    return [...this.touchHistory]
  }

  updateCurrentPosition(x, y) {
    this.currentTouchPos = { x, y }
  }

  getDistance() {
    const dx = this.currentTouchPos.x - this.touchStartPos.x
    const dy = this.currentTouchPos.y - this.touchStartPos.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  getVelocity() {
    const distance = this.getDistance()
    const duration = Date.now() - this.touchStartTime
    return duration > 0 ? distance / duration : 0
  }

  getDuration() {
    return Date.now() - this.touchStartTime
  }

  validateSwipe() {
    const distance = this.getDistance()
    const velocity = this.getVelocity()
    const duration = this.getDuration()

    return (
      distance >= GESTURE_THRESHOLDS.SWIPE_DISTANCE &&
      velocity >= GESTURE_THRESHOLDS.SWIPE_VELOCITY &&
      duration < 1000 // Swipe should be quick
    )
  }

  validatePinch(distance1, distance2) {
    const pinchDistance = Math.abs(distance2 - distance1)
    return pinchDistance >= GESTURE_THRESHOLDS.PINCH_DISTANCE
  }

  validateRotate(angle) {
    return Math.abs(angle) >= GESTURE_THRESHOLDS.ROTATE_ANGLE
  }

  validateLongPress() {
    const duration = this.getDuration()
    const distance = this.getDistance()

    return (
      duration >= GESTURE_THRESHOLDS.LONG_PRESS_DURATION &&
      distance <= GESTURE_THRESHOLDS.LONG_PRESS_MOVEMENT_TOLERANCE
    )
  }

  validateShake(acceleration) {
    return acceleration >= GESTURE_THRESHOLDS.SHAKE_THRESHOLD
  }

  reset() {
    this.state = 'idle'
    this.previousState = 'idle'
    this.touchHistory = []
    this.gestureData = {}
    this.activeTouches.clear()
    this.recognizedGestures = []
    this.palmDetected = false
    this.stylusDetected = false
  }

  recognizeGesture(type, direction = null, data = {}) {
    const gesture = {
      type,
      direction,
      timestamp: Date.now(),
      duration: this.getDuration(),
      distance: this.getDistance(),
      velocity: this.getVelocity(),
      startPos: { ...this.touchStartPos },
      endPos: { ...this.currentTouchPos },
      ...data,
    }

    this.recognizedGestures.push(gesture)
    this.emit('gesture_recognized', gesture)

    // Log gesture recognition
    console.log(`Gesture recognized: ${type}${direction ? ' (' + direction + ')' : ''}`, gesture)

    return gesture
  }

  getRecentGestures(count = 5) {
    return this.recognizedGestures.slice(-count)
  }

  createDragPredictor() {
    // Create momentum prediction for swipe continuation
    return {
      velocity: this.getVelocity(),
      direction: this.getSwipeDirection(),
      momentum: this.getVelocity() * 0.98, // Friction factor
    }
  }

  getSwipeDirection() {
    const dx = this.currentTouchPos.x - this.touchStartPos.x
    const dy = this.currentTouchPos.y - this.touchStartPos.y
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)

    const normalizedAngle = (angle + 360) % 360

    if (normalizedAngle < 45 || normalizedAngle >= 315) return GESTURE_DIRECTIONS.RIGHT
    if (normalizedAngle < 135) return GESTURE_DIRECTIONS.DOWN
    if (normalizedAngle < 225) return GESTURE_DIRECTIONS.LEFT
    return GESTURE_DIRECTIONS.UP
  }

  getState() {
    return {
      current: this.state,
      previous: this.previousState,
      data: { ...this.gestureData },
      activeTouches: this.activeTouches.size,
      palmDetected: this.palmDetected,
      stylusDetected: this.stylusDetected,
    }
  }

  debugInfo() {
    return {
      state: this.state,
      duration: this.getDuration(),
      distance: this.getDistance(),
      velocity: this.getVelocity(),
      touchCount: this.activeTouches.size,
      gestureCount: this.recognizedGestures.length,
      recentGestures: this.getRecentGestures(3),
    }
  }
}

export const createGestureStateMachine = () => {
  return new GestureStateMachine()
}
