/**
 * Magnetic Button Hook - Elements pull toward cursor
 * Features:
 * - Calculates vector from button center to cursor
 * - Applies transform based on distance
 * - Elastic snap-back animation on mouse leave
 * - Configurable magnetic strength and radius
 */

import { useEffect, useRef } from 'react'

export function useMagneticButton(options = {}) {
  const buttonRef = useRef(null)

  const {
    strength = 0.3,        // How strongly element is pulled (0-1)
    radius = 100,          // Magnetic activation radius in pixels
    ease = 0.15,           // Smoothness of movement (0.1-0.2)
    disabled = false       // Disable magnetic effect
  } = options

  useEffect(() => {
    if (disabled) return

    const button = buttonRef.current
    if (!button) return

    // Check if device supports hover (desktop only)
    const hasHover = window.matchMedia('(hover: hover)').matches
    if (!hasHover) return

    let rafId = null
    let isHovering = false
    const currentPos = { x: 0, y: 0 }
    const targetPos = { x: 0, y: 0 }

    // Mouse move handler
    const handleMouseMove = (e) => {
      if (!isHovering) return

      const rect = button.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate distance from center
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Only apply magnetic effect within radius
      if (distance < radius) {
        // Calculate magnetic force (stronger when closer)
        const force = 1 - distance / radius
        targetPos.x = deltaX * strength * force
        targetPos.y = deltaY * strength * force
      } else {
        targetPos.x = 0
        targetPos.y = 0
      }
    }

    // Mouse enter handler
    const handleMouseEnter = () => {
      isHovering = true
      button.style.transition = 'none' // Disable CSS transitions during magnetic movement
    }

    // Mouse leave handler - elastic snap-back
    const handleMouseLeave = () => {
      isHovering = false
      targetPos.x = 0
      targetPos.y = 0

      // Re-enable CSS transition for smooth snap-back
      button.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' // Elastic ease
      button.style.transform = 'translate3d(0px, 0px, 0)'
    }

    // Animation loop for smooth interpolation
    const animate = () => {
      if (isHovering) {
        // Lerp (Linear Interpolation) for smooth movement
        currentPos.x += (targetPos.x - currentPos.x) * ease
        currentPos.y += (targetPos.y - currentPos.y) * ease

        // Apply transform
        button.style.transform = `translate3d(${currentPos.x}px, ${currentPos.y}px, 0)`

        rafId = requestAnimationFrame(animate)
      }
    }

    // Attach event listeners
    button.addEventListener('mouseenter', handleMouseEnter)
    button.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Start animation when hovering
    const startAnimation = () => {
      if (isHovering && !rafId) {
        rafId = requestAnimationFrame(animate)
      }
    }

    button.addEventListener('mouseenter', startAnimation)

    // Cleanup
    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter)
      button.removeEventListener('mouseleave', handleMouseLeave)
      button.removeEventListener('mouseenter', startAnimation)
      window.removeEventListener('mousemove', handleMouseMove)

      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [strength, radius, ease, disabled])

  return buttonRef
}

/**
 * Magnetic wrapper component
 * Use this to wrap any element and make it magnetic
 */
export function MagneticElement({ children, strength = 0.3, radius = 100, ease = 0.15, disabled = false, className = '', style = {} }) {
  const ref = useMagneticButton({ strength, radius, ease, disabled })

  return (
    <div ref={ref} className={className} style={{ display: 'inline-block', ...style }}>
      {children}
    </div>
  )
}

/**
 * Advanced hook with cursor following
 * Makes element rotate toward cursor position
 */
export function useMagneticRotate(options = {}) {
  const elementRef = useRef(null)

  const {
    maxRotation = 15,      // Maximum rotation in degrees
    ease = 0.1,            // Smoothness of rotation
    disabled = false
  } = options

  useEffect(() => {
    if (disabled) return

    const element = elementRef.current
    if (!element) return

    const hasHover = window.matchMedia('(hover: hover)').matches
    if (!hasHover) return

    let rafId = null
    let isHovering = false
    const currentRotate = { x: 0, y: 0 }
    const targetRotate = { x: 0, y: 0 }

    const handleMouseMove = (e) => {
      if (!isHovering) return

      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate rotation based on cursor position
      const deltaX = (e.clientX - centerX) / rect.width
      const deltaY = (e.clientY - centerY) / rect.height

      targetRotate.x = -deltaY * maxRotation // Rotate X based on Y position
      targetRotate.y = deltaX * maxRotation  // Rotate Y based on X position
    }

    const handleMouseEnter = () => {
      isHovering = true
      element.style.transition = 'none'
    }

    const handleMouseLeave = () => {
      isHovering = false
      targetRotate.x = 0
      targetRotate.y = 0
      element.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
      element.style.transform = 'rotateX(0deg) rotateY(0deg)'
    }

    const animate = () => {
      if (isHovering) {
        currentRotate.x += (targetRotate.x - currentRotate.x) * ease
        currentRotate.y += (targetRotate.y - currentRotate.y) * ease

        element.style.transform = `perspective(1000px) rotateX(${currentRotate.x}deg) rotateY(${currentRotate.y}deg)`

        rafId = requestAnimationFrame(animate)
      }
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    const startAnimation = () => {
      if (isHovering && !rafId) {
        rafId = requestAnimationFrame(animate)
      }
    }

    element.addEventListener('mouseenter', startAnimation)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.removeEventListener('mouseenter', startAnimation)
      window.removeEventListener('mousemove', handleMouseMove)

      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [maxRotation, ease, disabled])

  return elementRef
}
