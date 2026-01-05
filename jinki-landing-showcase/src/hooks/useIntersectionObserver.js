import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * LAZYMASTER: Premium Intersection Observer Hook
 * Detects when elements come into view with configurable thresholds
 * Optimized for performance with proper cleanup
 */
export const useIntersectionObserver = (options = {}) => {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true, // Fire only once, then stop observing
    ...options
  }

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        setHasBeenVisible(true)
        // Unobserve after first intersection if triggerOnce is true
        if (defaultOptions.triggerOnce && observer) {
          observer.unobserve(entry.target)
        }
      } else {
        setIsVisible(false)
      }
    }, {
      threshold: defaultOptions.threshold,
      rootMargin: defaultOptions.rootMargin
    })

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (observer && ref.current) {
        observer.unobserve(ref.current)
      }
      observer.disconnect()
    }
  }, [defaultOptions])

  return { ref, isVisible, hasBeenVisible }
}

/**
 * Batch Intersection Observer for multiple elements
 * More efficient than individual observers
 */
export const useBatchIntersectionObserver = (elements = [], options = {}) => {
  const [visibleIndices, setVisibleIndices] = useState(new Set())
  const refs = useRef([])

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  }

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const newVisibleIndices = new Set(visibleIndices)

      entries.forEach(entry => {
        const index = refs.current.indexOf(entry.target)
        if (entry.isIntersecting) {
          newVisibleIndices.add(index)
        } else {
          newVisibleIndices.delete(index)
        }
      })

      setVisibleIndices(newVisibleIndices)
    }, {
      threshold: defaultOptions.threshold,
      rootMargin: defaultOptions.rootMargin
    })

    refs.current = refs.current.filter(el => el !== null)

    refs.current.forEach(el => {
      if (el) observer.observe(el)
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return { refs, visibleIndices }
}
