import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

/**
 * HIGH-PERFORMANCE ANIMATED COUNTER
 * Live counter with easing functions, locale formatting, and symbol suffixes
 */
export function AnimatedCounter({
  value = 0,
  duration = 2.5,
  easing = 'easeOutQuad',
  suffix = '',
  prefix = '',
  decimals = 0,
  onComplete = () => {},
  format = null, // Custom formatter function
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isCountingRef, setIsCounting] = useState(false)
  const elementRef = useRef(null)
  const isInView = useInView(elementRef, { once: false, amount: 0.5 })
  const frameRef = useRef(null)
  const startTimeRef = useRef(null)

  // Easing functions
  const easings = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeOutCubic: (t) => 1 + (--t) ** 3 * (2 * (t - 1)),
    easeOutExpo: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
    easeOutElastic: (t) => {
      const c5 = (2 * Math.PI) / 4.5
      return t === 0 ? 0 : t === 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 40 - 3) * c5) + 1
    },
  }

  const ease = easings[easing] || easings.easeOutQuad

  useEffect(() => {
    if (!isInView) return

    setIsCounting(true)
    startTimeRef.current = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const easeProgress = ease(progress)
      const newValue = value * easeProgress

      setDisplayValue(newValue)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
        setIsCounting(false)
        onComplete()
        cancelAnimationFrame(frameRef.current)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [isInView, value, duration, easing])

  const formatValue = (num) => {
    if (format) return format(num)
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  return (
    <span ref={elementRef} className="animated-counter">
      {prefix}
      {formatValue(displayValue)}
      {suffix}
    </span>
  )
}

export default AnimatedCounter
