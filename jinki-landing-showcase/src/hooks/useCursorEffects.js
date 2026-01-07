/* ════════════════════════════════════════════════════════════════════════════════
   TEAM CURSOR-EFFECTS - Custom Cursor Hook
   Performance-optimized cursor tracking and state management
   ════════════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * Custom cursor effects hook
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableTrail - Enable cursor trail effect
 * @param {boolean} options.enableMagnetic - Enable magnetic effect on elements
 * @param {number} options.trailLength - Number of trail particles (default: 8)
 * @param {number} options.magneticStrength - Magnetic effect strength (default: 0.3)
 * @returns {Object} Cursor state and utilities
 */
export default function useCursorEffects(options = {}) {
  const {
    enableTrail = true,
    enableMagnetic = true,
    trailLength = 8,
    magneticStrength = 0.3,
  } = options

  const cursorRef = useRef(null)
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const trailsRef = useRef([])

  const mousePosition = useRef({ x: 0, y: 0 })
  const dotPosition = useRef({ x: 0, y: 0 })
  const ringPosition = useRef({ x: 0, y: 0 })

  const [isHovering, setIsHovering] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  const animationFrameRef = useRef(null)
  const lastTrailTime = useRef(0)
  const rippleContainer = useRef(null)

  // Check if device supports custom cursor
  const isTouchDevice = useCallback(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }, [])

  // Smooth cursor following using lerp (linear interpolation)
  const lerp = (start, end, factor) => {
    return start + (end - start) * factor
  }

  // Animate cursor position smoothly
  const animateCursor = useCallback(() => {
    if (!dotRef.current || !ringRef.current) return

    // Smooth following with different speeds for dot and ring
    dotPosition.current.x = lerp(dotPosition.current.x, mousePosition.current.x, 0.3)
    dotPosition.current.y = lerp(dotPosition.current.y, mousePosition.current.y, 0.3)

    ringPosition.current.x = lerp(ringPosition.current.x, mousePosition.current.x, 0.15)
    ringPosition.current.y = lerp(ringPosition.current.y, mousePosition.current.y, 0.15)

    // Apply transforms (GPU-accelerated)
    dotRef.current.style.transform = `translate3d(${dotPosition.current.x}px, ${dotPosition.current.y}px, 0) translate(-50%, -50%)`
    ringRef.current.style.transform = `translate3d(${ringPosition.current.x}px, ${ringPosition.current.y}px, 0) translate(-50%, -50%)`

    animationFrameRef.current = requestAnimationFrame(animateCursor)
  }, [])

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    mousePosition.current = { x: e.clientX, y: e.clientY }

    // Create trail effect
    if (enableTrail && Date.now() - lastTrailTime.current > 50) {
      createTrail(e.clientX, e.clientY)
      lastTrailTime.current = Date.now()
    }

    // Handle magnetic effect
    if (enableMagnetic) {
      handleMagneticElements(e)
    }
  }, [enableTrail, enableMagnetic])

  // Create trail particle
  const createTrail = useCallback((x, y) => {
    if (!cursorRef.current) return

    // Limit trail particles
    if (trailsRef.current.length >= trailLength) {
      const oldTrail = trailsRef.current.shift()
      if (oldTrail && oldTrail.parentNode) {
        oldTrail.parentNode.removeChild(oldTrail)
      }
    }

    const trail = document.createElement('div')
    trail.className = 'custom-cursor__trail active'
    trail.style.left = `${x}px`
    trail.style.top = `${y}px`

    cursorRef.current.appendChild(trail)
    trailsRef.current.push(trail)

    // Remove trail after animation
    setTimeout(() => {
      if (trail.parentNode) {
        trail.parentNode.removeChild(trail)
        trailsRef.current = trailsRef.current.filter(t => t !== trail)
      }
    }, 600)
  }, [trailLength])

  // Handle magnetic effect on elements
  const handleMagneticElements = useCallback((e) => {
    const magneticElements = document.querySelectorAll('.cursor-magnetic')

    magneticElements.forEach((element) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const distance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
      )

      const magneticRange = Math.max(rect.width, rect.height) * 1.5

      if (distance < magneticRange) {
        // Get custom strength or use default
        const strength = parseFloat(element.dataset.magneticStrength || magneticStrength)

        const deltaX = (e.clientX - centerX) * strength
        const deltaY = (e.clientY - centerY) * strength

        element.style.transform = `translate(${deltaX}px, ${deltaY}px)`
      } else {
        element.style.transform = 'translate(0, 0)'
      }
    })
  }, [magneticStrength])

  // Handle hover state on interactive elements
  const handleHover = useCallback((isHover) => {
    setIsHovering(isHover)
    if (cursorRef.current) {
      cursorRef.current.classList.toggle('custom-cursor--hover', isHover)
    }
  }, [])

  // Handle mouse click
  const handleClick = useCallback((e) => {
    if (!cursorRef.current) return

    // Add click state
    cursorRef.current.classList.add('custom-cursor--click')

    // Create ripple effect
    const ripple = document.createElement('div')
    ripple.className = 'custom-cursor__ripple'
    ripple.style.left = `${e.clientX}px`
    ripple.style.top = `${e.clientY}px`

    if (!rippleContainer.current) {
      rippleContainer.current = cursorRef.current
    }

    rippleContainer.current.appendChild(ripple)

    // Remove click state
    setTimeout(() => {
      cursorRef.current?.classList.remove('custom-cursor--click')
    }, 150)

    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple)
      }
    }, 600)
  }, [])

  // Handle mouse enter/leave viewport
  const handleMouseEnter = useCallback(() => {
    setIsHidden(false)
    if (cursorRef.current) {
      cursorRef.current.classList.remove('custom-cursor--hidden')
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHidden(true)
    if (cursorRef.current) {
      cursorRef.current.classList.add('custom-cursor--hidden')
    }
  }, [])

  // Add hover listeners to interactive elements
  useEffect(() => {
    if (isTouchDevice()) return

    const interactiveElements = document.querySelectorAll(
      'a, button, [role="button"], input[type="button"], input[type="submit"], .interactive'
    )

    const handleMouseEnterElement = () => handleHover(true)
    const handleMouseLeaveElement = () => handleHover(false)

    interactiveElements.forEach((element) => {
      element.addEventListener('mouseenter', handleMouseEnterElement)
      element.addEventListener('mouseleave', handleMouseLeaveElement)
    })

    return () => {
      interactiveElements.forEach((element) => {
        element.removeEventListener('mouseenter', handleMouseEnterElement)
        element.removeEventListener('mouseleave', handleMouseLeaveElement)
      })
    }
  }, [handleHover, isTouchDevice])

  // Initialize cursor effects
  useEffect(() => {
    if (isTouchDevice()) {
      // Don't enable custom cursor on touch devices
      return
    }

    // Add class to body to hide default cursor
    document.body.classList.add('custom-cursor-enabled')

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('click', handleClick)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animateCursor)

    // Cleanup
    return () => {
      document.body.classList.remove('custom-cursor-enabled')
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // Clean up trails
      trailsRef.current.forEach(trail => {
        if (trail.parentNode) {
          trail.parentNode.removeChild(trail)
        }
      })
      trailsRef.current = []
    }
  }, [
    handleMouseMove,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    animateCursor,
    isTouchDevice,
  ])

  return {
    cursorRef,
    dotRef,
    ringRef,
    isHovering,
    isHidden,
    isTouchDevice: isTouchDevice(),
  }
}
