/**
 * Custom Cursor Hook - Premium magnetic cursor system
 * Features:
 * - Smooth cursor tracking with easing
 * - Multiple cursor states (default, hover, click, text)
 * - Automatic size changes on interactive elements
 * - Color inversion on light backgrounds
 * - Hides on mobile/touch devices
 */

import { useEffect, useRef, useState } from 'react'

export function useCustomCursor() {
  const cursorRef = useRef(null)
  const cursorDotRef = useRef(null)
  const [cursorState, setCursorState] = useState('default')

  // Mouse position with smooth interpolation
  const mousePos = useRef({ x: 0, y: 0 })
  const cursorPos = useRef({ x: 0, y: 0 })
  const cursorSpeed = 0.15 // Lower = smoother/slower (0.1-0.2 is ideal)

  useEffect(() => {
    // Check if device supports hover (desktop only)
    const hasHover = window.matchMedia('(hover: hover)').matches
    if (!hasHover) return // Don't show custom cursor on touch devices

    const cursor = cursorRef.current
    const cursorDot = cursorDotRef.current
    if (!cursor || !cursorDot) return

    let rafId = null

    // Mouse move handler - updates target position
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
    }

    // Smooth cursor animation loop
    const animateCursor = () => {
      // Lerp (Linear Interpolation) for smooth following
      cursorPos.current.x += (mousePos.current.x - cursorPos.current.x) * cursorSpeed
      cursorPos.current.y += (mousePos.current.y - cursorPos.current.y) * cursorSpeed

      // Update cursor position
      cursor.style.transform = `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0)`
      cursorDot.style.transform = `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0)`

      rafId = requestAnimationFrame(animateCursor)
    }

    // Mouse enter/leave handlers for interactive elements
    const handleMouseEnter = (e) => {
      const target = e.currentTarget
      const tagName = target.tagName.toLowerCase()

      // Determine cursor state based on element
      if (tagName === 'button' || tagName === 'a' || target.classList.contains('cursor-pointer')) {
        setCursorState('hover')
      } else if (tagName === 'input' || tagName === 'textarea' || target.contentEditable === 'true') {
        setCursorState('text')
      }
    }

    const handleMouseLeave = () => {
      setCursorState('default')
    }

    const handleMouseDown = () => {
      setCursorState('click')
    }

    const handleMouseUp = () => {
      setCursorState('default')
    }

    // Attach event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    // Start animation loop
    rafId = requestAnimationFrame(animateCursor)

    // Auto-detect interactive elements and attach hover listeners
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, [role="button"], .cursor-pointer')
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    })

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)

      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })

      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return {
    cursorRef,
    cursorDotRef,
    cursorState,
    setCursorState
  }
}

/**
 * Hook for cursor inversion on light backgrounds
 * Call this from components with light backgrounds
 */
export function useCursorInvert(ref, isLight = true) {
  useEffect(() => {
    if (!ref.current) return

    const element = ref.current

    const handleMouseEnter = () => {
      if (isLight) {
        document.body.classList.add('cursor-invert')
      }
    }

    const handleMouseLeave = () => {
      document.body.classList.remove('cursor-invert')
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      document.body.classList.remove('cursor-invert')
    }
  }, [ref, isLight])
}
