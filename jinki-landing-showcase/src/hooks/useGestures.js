// GESTURAL: Advanced gesture recognition hook
// Handles all gesture types: swipe, pinch, rotate, long-press, shake, draw, palm rejection

import { useEffect, useRef, useCallback, useState } from 'react'
import { createGestureStateMachine } from '../utils/gestureStateMachine'
import {
  GESTURE_TYPES,
  GESTURE_THRESHOLDS,
  getSwipeDirection,
  getDistanceBetweenPoints,
  getAngleBetweenPoints,
  detectGestureShape,
  isPalmTouch,
  isStypuTouch,
  DEVICE_DETECTION,
} from '../utils/gestureConfig'

export const useGestures = (ref, options = {}) => {
  const stateMachineRef = useRef(createGestureStateMachine())
  const touchStartTimeRef = useRef(0)
  const touchStartPosRef = useRef({ x: 0, y: 0 })
  const lastTapTimeRef = useRef(0)
  const shakeDetectorRef = useRef({ acceleration: 0, shakeCount: 0, lastTime: 0 })
  const drawPointsRef = useRef([])
  const doubleTapTimerRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const previousPinchDistanceRef = useRef(0)
  const previousRotationRef = useRef(0)
  const activeTouchPointsRef = useRef(new Map())
  const [gestureState, setGestureState] = useState({})
  const [isEnabled, setIsEnabled] = useState(true)

  const sm = stateMachineRef.current
  const defaultOptions = {
    enableSwipe: true,
    enablePinch: true,
    enableRotate: true,
    enableLongPress: true,
    enableShake: true,
    enableDraw: true,
    enablePalmReject: true,
    enableDoubleTap: true,
    onSwipe: () => {},
    onPinch: () => {},
    onRotate: () => {},
    onLongPress: () => {},
    onShake: () => {},
    onDraw: () => {},
    onTap: () => {},
    onDoubleTab: () => {},
    onGestureStateChange: () => {},
  }

  const config = { ...defaultOptions, ...options }

  // Subscribe to state machine changes
  useEffect(() => {
    const unsubscribe = sm.subscribe('state_change', (data) => {
      setGestureState(data)
      config.onGestureStateChange(data)
    })

    return unsubscribe
  }, [config])

  // Handle swipe gesture
  const handleSwipe = useCallback((startX, startY, endX, endY) => {
    if (!config.enableSwipe) return

    const dx = endX - startX
    const dy = endY - startY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const duration = Date.now() - touchStartTimeRef.current
    const velocity = distance / duration

    if (
      distance >= GESTURE_THRESHOLDS.SWIPE_DISTANCE &&
      velocity >= GESTURE_THRESHOLDS.SWIPE_VELOCITY
    ) {
      const direction = getSwipeDirection(startX, startY, endX, endY)
      sm.recognizeGesture(GESTURE_TYPES.SWIPE, direction, {
        dx,
        dy,
        distance,
        velocity,
        duration,
      })
      config.onSwipe({ direction, distance, velocity, duration })
    }
  }, [config])

  // Handle pinch gesture
  const handlePinch = useCallback((touch1, touch2) => {
    if (!config.enablePinch) return

    const distance = getDistanceBetweenPoints(touch1, touch2)
    const scaleDelta = previousPinchDistanceRef.current
      ? distance - previousPinchDistanceRef.current
      : 0

    if (
      Math.abs(scaleDelta) >= GESTURE_THRESHOLDS.PINCH_DISTANCE &&
      previousPinchDistanceRef.current > 0
    ) {
      const scale = distance / previousPinchDistanceRef.current
      sm.recognizeGesture(GESTURE_TYPES.PINCH, null, {
        distance,
        scale,
        scaleDelta,
      })
      config.onPinch({ scale, distance, scaleDelta })
    }

    previousPinchDistanceRef.current = distance
  }, [config])

  // Handle rotate gesture
  const handleRotate = useCallback((touch1, touch2) => {
    if (!config.enableRotate) return

    const angle = getAngleBetweenPoints(touch1, touch2)
    const angleDelta = previousRotationRef.current
      ? angle - previousRotationRef.current
      : 0

    if (
      Math.abs(angleDelta) >= GESTURE_THRESHOLDS.ROTATE_ANGLE &&
      previousRotationRef.current !== 0
    ) {
      sm.recognizeGesture(GESTURE_TYPES.ROTATE, null, {
        angle,
        angleDelta,
      })
      config.onRotate({ angle, angleDelta })
    }

    previousRotationRef.current = angle
  }, [config])

  // Handle long press
  const startLongPressDetection = useCallback((x, y) => {
    if (!config.enableLongPress) return

    longPressTimerRef.current = setTimeout(() => {
      const distance = Math.sqrt(
        Math.pow(x - touchStartPosRef.current.x, 2) +
        Math.pow(y - touchStartPosRef.current.y, 2)
      )

      if (distance <= GESTURE_THRESHOLDS.LONG_PRESS_MOVEMENT_TOLERANCE) {
        sm.recognizeGesture(GESTURE_TYPES.LONG_PRESS, null, { x, y })
        config.onLongPress({ x, y })
      }
    }, GESTURE_THRESHOLDS.LONG_PRESS_DURATION)
  }, [config])

  // Cancel long press detection
  const cancelLongPressDetection = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  // Handle shake gesture
  const handleShakeDetection = useCallback((accelX, accelY, accelZ) => {
    if (!config.enableShake) return

    const acceleration = Math.sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ)
    const now = Date.now()

    if (acceleration >= GESTURE_THRESHOLDS.SHAKE_THRESHOLD) {
      if (now - shakeDetectorRef.current.lastTime > 100) {
        shakeDetectorRef.current.shakeCount++
        shakeDetectorRef.current.lastTime = now

        if (shakeDetectorRef.current.shakeCount >= GESTURE_THRESHOLDS.SHAKE_COUNT) {
          sm.recognizeGesture(GESTURE_TYPES.SHAKE, null, { acceleration })
          config.onShake({ acceleration })
          shakeDetectorRef.current.shakeCount = 0
        }
      }
    }
  }, [config])

  // Handle draw gesture
  const handleDraw = useCallback((x, y) => {
    if (!config.enableDraw) return

    drawPointsRef.current.push({ x, y, timestamp: Date.now() })

    if (drawPointsRef.current.length >= GESTURE_THRESHOLDS.DRAW_MIN_POINTS) {
      const shape = detectGestureShape(drawPointsRef.current)
      if (shape === 'circle') {
        sm.recognizeGesture(GESTURE_TYPES.DRAW, 'circle', { shape })
        config.onDraw({ shape: 'circle' })
        drawPointsRef.current = []
      }
    }
  }, [config])

  // Handle tap and double tap
  const handleTap = useCallback((x, y) => {
    const now = Date.now()
    const lastTapTime = lastTapTimeRef.current

    if (now - lastTapTime < GESTURE_THRESHOLDS.DOUBLE_TAP_DELAY) {
      // Double tap detected
      config.onDoubleTab?.({ x, y })
      lastTapTimeRef.current = 0
    } else {
      // Single tap
      if (doubleTapTimerRef.current) {
        clearTimeout(doubleTapTimerRef.current)
      }

      doubleTapTimerRef.current = setTimeout(() => {
        sm.recognizeGesture(GESTURE_TYPES.TAP, null, { x, y })
        config.onTap?.({ x, y })
      }, GESTURE_THRESHOLDS.DOUBLE_TAP_DELAY)

      lastTapTimeRef.current = now
    }
  }, [config])

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    if (!isEnabled) return

    const touches = e.touches
    touchStartTimeRef.current = Date.now()

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i]
      const id = touch.identifier

      // Palm rejection
      if (config.enablePalmReject && isPalmTouch(touch)) {
        sm.palmDetected = true
        continue
      }

      if (isStypuTouch(touch)) {
        sm.stylusDetected = true
      }

      const touchPoint = {
        id,
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      }

      activeTouchPointsRef.current.set(id, touchPoint)
      sm.recordTouch(touch.clientX, touch.clientY, id)

      if (i === 0) {
        touchStartPosRef.current = { x: touch.clientX, y: touch.clientY }
        drawPointsRef.current = [{ x: touch.clientX, y: touch.clientY, timestamp: Date.now() }]
        startLongPressDetection(touch.clientX, touch.clientY)
        sm.setState('touch_start', { x: touch.clientX, y: touch.clientY })
      }
    }

    sm.emit('touch_start', {
      touchCount: touches.length,
      touches: Array.from(activeTouchPointsRef.current.values()),
    })
  }, [config, isEnabled, startLongPressDetection])

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (!isEnabled) return

    const touches = e.touches
    const touchArray = Array.from(touches)

    // Update touch positions
    for (let touch of touchArray) {
      const id = touch.identifier
      if (activeTouchPointsRef.current.has(id)) {
        activeTouchPointsRef.current.get(id).x = touch.clientX
        activeTouchPointsRef.current.get(id).y = touch.clientY
      }
    }

    if (touches.length === 1) {
      const touch = touches[0]
      sm.updateCurrentPosition(touch.clientX, touch.clientY)
      handleDraw(touch.clientX, touch.clientY)

      sm.setState('move', {
        x: touch.clientX,
        y: touch.clientY,
        distance: sm.getDistance(),
      })
    } else if (touches.length === 2) {
      cancelLongPressDetection()
      drawPointsRef.current = []

      const touch1 = { x: touches[0].clientX, y: touches[0].clientY }
      const touch2 = { x: touches[1].clientX, y: touches[1].clientY }

      handlePinch(touch1, touch2)
      handleRotate(touch1, touch2)
    }

    sm.emit('touch_move', {
      touchCount: touches.length,
      touches: Array.from(activeTouchPointsRef.current.values()),
    })
  }, [isEnabled, handleDraw, handlePinch, handleRotate, cancelLongPressDetection])

  // Handle touch end
  const handleTouchEnd = useCallback((e) => {
    if (!isEnabled) return

    cancelLongPressDetection()
    previousPinchDistanceRef.current = 0
    previousRotationRef.current = 0

    const touches = e.touches
    const changedTouches = e.changedTouches

    // Remove ended touches
    for (let touch of changedTouches) {
      activeTouchPointsRef.current.delete(touch.identifier)
    }

    if (touches.length === 0) {
      // All touches ended
      const lastTouch = changedTouches[changedTouches.length - 1]
      handleSwipe(
        touchStartPosRef.current.x,
        touchStartPosRef.current.y,
        lastTouch.clientX,
        lastTouch.clientY
      )

      // Check if it's a tap
      const duration = Date.now() - touchStartTimeRef.current
      const distance = Math.sqrt(
        Math.pow(lastTouch.clientX - touchStartPosRef.current.x, 2) +
        Math.pow(lastTouch.clientY - touchStartPosRef.current.y, 2)
      )

      if (
        duration <= GESTURE_THRESHOLDS.TAP_DURATION &&
        distance <= GESTURE_THRESHOLDS.TAP_MOVEMENT_TOLERANCE
      ) {
        handleTap(lastTouch.clientX, lastTouch.clientY)
      }

      sm.setState('release')
      sm.emit('touch_end', {
        touchCount: 0,
        touches: [],
      })
    }
  }, [isEnabled, cancelLongPressDetection, handleSwipe, handleTap])

  // Mouse gesture handlers (desktop fallback)
  const handleMouseDown = useCallback((e) => {
    if (!isEnabled || e.button !== 0) return // Only left mouse button

    touchStartTimeRef.current = Date.now()
    touchStartPosRef.current = { x: e.clientX, y: e.clientY }
    drawPointsRef.current = [{ x: e.clientX, y: e.clientY, timestamp: Date.now() }]

    activeTouchPointsRef.current.set('mouse', {
      id: 'mouse',
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
    })

    startLongPressDetection(e.clientX, e.clientY)
    sm.setState('touch_start', { x: e.clientX, y: e.clientY })

    sm.emit('touch_start', {
      touchCount: 1,
      touches: [{ id: 'mouse', x: e.clientX, y: e.clientY }],
    })
  }, [isEnabled, startLongPressDetection])

  const handleMouseMove = useCallback((e) => {
    if (!isEnabled || !activeTouchPointsRef.current.has('mouse')) return

    sm.updateCurrentPosition(e.clientX, e.clientY)
    handleDraw(e.clientX, e.clientY)

    sm.setState('move', {
      x: e.clientX,
      y: e.clientY,
      distance: sm.getDistance(),
    })

    sm.emit('touch_move', {
      touchCount: 1,
      touches: [{ id: 'mouse', x: e.clientX, y: e.clientY }],
    })
  }, [isEnabled, handleDraw])

  const handleMouseUp = useCallback((e) => {
    if (!isEnabled || !activeTouchPointsRef.current.has('mouse')) return

    cancelLongPressDetection()

    handleSwipe(
      touchStartPosRef.current.x,
      touchStartPosRef.current.y,
      e.clientX,
      e.clientY
    )

    const duration = Date.now() - touchStartTimeRef.current
    const distance = Math.sqrt(
      Math.pow(e.clientX - touchStartPosRef.current.x, 2) +
      Math.pow(e.clientY - touchStartPosRef.current.y, 2)
    )

    if (
      duration <= GESTURE_THRESHOLDS.TAP_DURATION &&
      distance <= GESTURE_THRESHOLDS.TAP_MOVEMENT_TOLERANCE
    ) {
      handleTap(e.clientX, e.clientY)
    }

    activeTouchPointsRef.current.delete('mouse')
    sm.setState('release')

    sm.emit('touch_end', {
      touchCount: 0,
      touches: [],
    })
  }, [isEnabled, cancelLongPressDetection, handleSwipe, handleTap])

  // Accelerometer for shake detection
  const handleDeviceMotion = useCallback((event) => {
    if (!config.enableShake) return

    const acc = event.acceleration
    if (acc) {
      handleShakeDetection(acc.x || 0, acc.y || 0, acc.z || 0)
    }
  }, [config.enableShake, handleShakeDetection])

  // Attach event listeners
  useEffect(() => {
    const element = ref?.current || window

    // Touch events
    if (DEVICE_DETECTION.isTouch) {
      element.addEventListener('touchstart', handleTouchStart, { passive: false })
      element.addEventListener('touchmove', handleTouchMove, { passive: false })
      element.addEventListener('touchend', handleTouchEnd, { passive: false })
    }

    // Mouse events (desktop fallback)
    if (DEVICE_DETECTION.isMouse) {
      element.addEventListener('mousedown', handleMouseDown)
      element.addEventListener('mousemove', handleMouseMove)
      element.addEventListener('mouseup', handleMouseUp)
    }

    // Device motion for shake detection
    if (config.enableShake && typeof window !== 'undefined') {
      window.addEventListener('devicemotion', handleDeviceMotion)
    }

    return () => {
      if (DEVICE_DETECTION.isTouch) {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchmove', handleTouchMove)
        element.removeEventListener('touchend', handleTouchEnd)
      }

      if (DEVICE_DETECTION.isMouse) {
        element.removeEventListener('mousedown', handleMouseDown)
        element.removeEventListener('mousemove', handleMouseMove)
        element.removeEventListener('mouseup', handleMouseUp)
      }

      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleDeviceMotion)
      }
    }
  }, [
    ref,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDeviceMotion,
  ])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current)
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }
  }, [])

  return {
    gestureState,
    isEnabled,
    setIsEnabled,
    stateMachine: sm,
    getRecentGestures: () => sm.getRecentGestures(),
    debugInfo: () => sm.debugInfo(),
    reset: () => {
      sm.reset()
      activeTouchPointsRef.current.clear()
      drawPointsRef.current = []
    },
  }
}
