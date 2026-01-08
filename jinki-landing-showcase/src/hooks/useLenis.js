/**
 * @studio-freight/lenis Smooth Scroll Hook
 * Momentum-based scrolling inspired by Apple/Stripe
 * Features:
 * - Smooth momentum scrolling with configurable easing
 * - RAF (RequestAnimationFrame) loop for 60fps performance
 * - Mobile optimization with touch detection
 * - Auto-cleanup on unmount
 */

import { useEffect, useRef } from 'react'
import Lenis from '@studio-freight/lenis'

export function useLenis(options = {}) {
  const lenisRef = useRef(null)

  useEffect(() => {
    // Default configuration optimized for premium feel
    const defaultOptions = {
      duration: 1.2,              // Scroll duration (Apple uses ~1.2s)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth ease-out
      direction: 'vertical',      // Scroll direction
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,         // Disable on touch devices (better native feel)
      touchMultiplier: 2,         // Touch scroll speed multiplier
      infinite: false,
      ...options
    }

    // Initialize Lenis
    lenisRef.current = new Lenis(defaultOptions)

    // RequestAnimationFrame loop for smooth scrolling
    function raf(time) {
      lenisRef.current?.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Expose lenis to window for debugging (optional)
    if (typeof window !== 'undefined') {
      window.lenis = lenisRef.current
    }

    // Cleanup
    return () => {
      lenisRef.current?.destroy()
      if (typeof window !== 'undefined') {
        delete window.lenis
      }
    }
  }, []) // Empty deps - only run once on mount

  return lenisRef.current
}

/**
 * Advanced hook with scroll event callback
 * Use this when you need to react to scroll events
 */
export function useLenisScroll(callback) {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis || !callback) return

    lenis.on('scroll', callback)

    return () => {
      lenis.off('scroll', callback)
    }
  }, [lenis, callback])

  return lenis
}

/**
 * Hook for programmatic scrolling
 * Returns methods to control scroll position
 */
export function useLenisControls() {
  const lenis = useLenis()

  return {
    scrollTo: (target, options = {}) => {
      lenis?.scrollTo(target, {
        offset: 0,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        ...options
      })
    },
    stop: () => lenis?.stop(),
    start: () => lenis?.start(),
    resize: () => lenis?.resize(),
    lenis
  }
}
