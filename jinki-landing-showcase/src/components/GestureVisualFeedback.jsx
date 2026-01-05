// GESTURAL: Visual feedback for gesture recognition
// Displays particles, trails, and animations for each gesture type

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { GESTURE_TYPES, GESTURE_FEEDBACK } from '../utils/gestureConfig'
import './GestureVisualFeedback.css'

const GestureVisualFeedback = ({ gesture, isActive }) => {
  const [particles, setParticles] = useState([])
  const [trail, setTrail] = useState([])
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationFrameRef = useRef(null)

  // Generate particles
  const generateParticles = (x, y, gestureType) => {
    const count = GESTURE_FEEDBACK.PARTICLE_COUNT
    const newParticles = []
    const color = GESTURE_FEEDBACK.COLORS[gestureType] || '#00D4FF'

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const velocity = 2 + Math.random() * 3
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        color,
        size: 2 + Math.random() * 3,
      })
    }

    return newParticles
  }

  // Update and render particles
  const updateParticles = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particlesRef.current = particlesRef.current.filter(p => p.life > 0)

    particlesRef.current.forEach(particle => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.1 // gravity
      particle.life -= 0.02

      const alpha = particle.life
      ctx.fillStyle = particle.color.replace(')', `, ${alpha})`)
        .replace('rgb', 'rgba')
      ctx.fillStyle = particle.color + Math.round(alpha * 255).toString(16).padStart(2, '0')

      // Draw particle glow
      ctx.shadowBlur = 10 * alpha
      ctx.shadowColor = particle.color
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size)
    })

    if (particlesRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(updateParticles)
    }
  }

  // Handle gesture visualization
  useEffect(() => {
    if (!gesture || !isActive) return

    const { type, startPos, endPos } = gesture
    const startX = startPos.x
    const startY = startPos.y

    // Create particles based on gesture type
    const newParticles = generateParticles(startX, startY, type)
    particlesRef.current = [...particlesRef.current, ...newParticles]
    setParticles(newParticles)

    // Create trail for draw and swipe gestures
    if ((type === GESTURE_TYPES.DRAW || type === GESTURE_TYPES.SWIPE) && endPos) {
      const newTrail = [{ x: startX, y: startY }, { x: endPos.x, y: endPos.y }]
      setTrail(newTrail)
    }

    // Start animation loop
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(updateParticles)
    }

    // Clear trail after duration
    const clearTimer = setTimeout(() => {
      setTrail([])
    }, GESTURE_FEEDBACK.DURATION)

    return () => clearTimeout(clearTimer)
  }, [gesture, isActive])

  // Render different feedback based on gesture type
  const renderGestureVisuals = () => {
    if (!gesture) return null

    const { type, direction, startPos, endPos } = gesture

    switch (type) {
      case GESTURE_TYPES.SWIPE:
        return (
          <div className="gesture-feedback swipe-feedback">
            <motion.div
              className="swipe-arrow"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              style={{
                left: startPos?.x || 0,
                top: startPos?.y || 0,
                transform: `rotate(${getArrowRotation(direction)})`,
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40">
                <defs>
                  <linearGradient id="swipeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={GESTURE_FEEDBACK.COLORS.SWIPE} />
                    <stop offset="100%" stopColor="#00FF88" />
                  </linearGradient>
                </defs>
                <path
                  d="M20,5 L30,25 M20,5 L15,20"
                  stroke="url(#swipeGradient)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>
        )

      case GESTURE_TYPES.PINCH:
        return (
          <div className="gesture-feedback pinch-feedback">
            <motion.div
              className="pinch-circle"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              style={{
                left: startPos?.x || 0,
                top: startPos?.y || 0,
              }}
            >
              <div className="pinch-inner">
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    fill="none"
                    stroke={GESTURE_FEEDBACK.COLORS.PINCH}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  <g stroke={GESTURE_FEEDBACK.COLORS.PINCH} strokeWidth="2" fill="none">
                    <line x1="10" y1="30" x2="5" y2="30" />
                    <line x1="50" y1="30" x2="55" y2="30" />
                    <line x1="30" y1="10" x2="30" y2="5" />
                    <line x1="30" y1="50" x2="30" y2="55" />
                  </g>
                </svg>
              </div>
            </motion.div>
          </div>
        )

      case GESTURE_TYPES.ROTATE:
        return (
          <div className="gesture-feedback rotate-feedback">
            <motion.div
              className="rotate-indicator"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: gesture.angleDelta || 0 }}
              exit={{ opacity: 0 }}
              style={{
                left: startPos?.x || 0,
                top: startPos?.y || 0,
              }}
            >
              <svg width="50" height="50" viewBox="0 0 50 50">
                <defs>
                  <linearGradient id="rotateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={GESTURE_FEEDBACK.COLORS.ROTATE} />
                    <stop offset="100%" stopColor="#FF6B00" />
                  </linearGradient>
                </defs>
                <circle
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="url(#rotateGradient)"
                  strokeWidth="2"
                />
                <path
                  d="M25,5 Q40,10 40,25"
                  fill="none"
                  stroke="url(#rotateGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <polygon
                  points="40,25 45,22 42,32"
                  fill="url(#rotateGradient)"
                />
              </svg>
            </motion.div>
          </div>
        )

      case GESTURE_TYPES.LONG_PRESS:
        return (
          <div className="gesture-feedback long-press-feedback">
            <motion.div
              className="long-press-indicator"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                left: startPos?.x || 0,
                top: startPos?.y || 0,
              }}
            >
              <div className="pulse-ring" />
              <div className="pulse-ring" style={{ animationDelay: '0.3s' }} />
              <div className="pulse-ring" style={{ animationDelay: '0.6s' }} />
            </motion.div>
          </div>
        )

      case GESTURE_TYPES.SHAKE:
        return (
          <div className="gesture-feedback shake-feedback">
            <motion.div
              className="shake-indicator"
              animate={{ x: [0, -5, 5, -5, 5, 0] }}
              transition={{ duration: 0.3 }}
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <svg width="60" height="60" viewBox="0 0 60 60">
                <text
                  x="30"
                  y="35"
                  textAnchor="middle"
                  fontSize="40"
                  fill={GESTURE_FEEDBACK.COLORS.SHAKE}
                  fontWeight="bold"
                >
                  ✨
                </text>
              </svg>
            </motion.div>
          </div>
        )

      case GESTURE_TYPES.DRAW:
        return (
          <div className="gesture-feedback draw-feedback">
            <motion.div
              className="draw-indicator"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              style={{
                left: startPos?.x || 0,
                top: startPos?.y || 0,
              }}
            >
              {gesture.direction === 'circle' && (
                <motion.svg
                  width="70"
                  height="70"
                  viewBox="0 0 70 70"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <circle
                    cx="35"
                    cy="35"
                    r="30"
                    fill="none"
                    stroke={GESTURE_FEEDBACK.COLORS.DRAW}
                    strokeWidth="2"
                    strokeDasharray="10,5"
                  />
                </motion.svg>
              )}
            </motion.div>
          </div>
        )

      case GESTURE_TYPES.TAP:
        return (
          <div className="gesture-feedback tap-feedback">
            <motion.div
              className="tap-ripple"
              initial={{ opacity: 0.8, scale: 0 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.3 }}
              style={{
                left: startPos?.x || 0,
                top: startPos?.y || 0,
              }}
            >
              <div
                className="ripple-inner"
                style={{
                  borderColor: GESTURE_FEEDBACK.COLORS.TAP,
                }}
              />
            </motion.div>
          </div>
        )

      default:
        return null
    }
  }

  const getArrowRotation = (direction) => {
    const rotations = {
      'right': 0,
      'left': 180,
      'up': -90,
      'down': 90,
      'diagonal-up-right': -45,
      'diagonal-up-left': -135,
      'diagonal-down-right': 45,
      'diagonal-down-left': 135,
    }
    return rotations[direction] || 0
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="gesture-particle-canvas"
        width={typeof window !== 'undefined' ? window.innerWidth : 800}
        height={typeof window !== 'undefined' ? window.innerHeight : 600}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
      <div className="gesture-feedback-container">
        {renderGestureVisuals()}
      </div>
    </>
  )
}

export default GestureVisualFeedback
