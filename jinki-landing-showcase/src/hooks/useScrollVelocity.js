import { useState, useEffect, useRef } from 'react'

/**
 * LAZYMASTER: Scroll Velocity Hook
 * Predicts user scroll behavior and prefetches content
 *
 * Psychology: Users scrolling fast are exploring, slow scrollers are reading
 */
export const useScrollVelocity = () => {
  const [velocity, setVelocity] = useState(0)
  const [direction, setDirection] = useState('down')
  const lastScrollY = useRef(0)
  const lastTimestamp = useRef(Date.now())
  const rafId = useRef(null)

  useEffect(() => {
    const calculateVelocity = () => {
      const currentScrollY = window.scrollY
      const currentTime = Date.now()

      const deltaY = currentScrollY - lastScrollY.current
      const deltaTime = currentTime - lastTimestamp.current

      // Pixels per second
      const currentVelocity = Math.abs(deltaY / deltaTime) * 1000

      setVelocity(currentVelocity)
      setDirection(deltaY > 0 ? 'down' : 'up')

      lastScrollY.current = currentScrollY
      lastTimestamp.current = currentTime

      rafId.current = requestAnimationFrame(calculateVelocity)
    }

    rafId.current = requestAnimationFrame(calculateVelocity)

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [])

  // Classify scroll behavior
  const getBehavior = () => {
    if (velocity < 200) return 'reading' // Slow scroll
    if (velocity < 800) return 'browsing' // Medium scroll
    return 'exploring' // Fast scroll
  }

  // Get adaptive rootMargin based on velocity
  const getAdaptiveRootMargin = () => {
    if (velocity > 1000) return '400px' // Fast scroll - aggressive prefetch
    if (velocity > 500) return '200px' // Medium scroll
    return '100px' // Slow scroll
  }

  return {
    velocity,
    direction,
    behavior: getBehavior(),
    adaptiveRootMargin: getAdaptiveRootMargin()
  }
}

export default useScrollVelocity
