/**
 * MEMORY-SAFE REACT HOOKS
 * Production-grade hooks with guaranteed cleanup and zero leaks
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { throttle, debounce, IntervalManager, rafPool } from '../utils/memoryOptimizations'

// ═══════════════════════════════════════════════════════════════
// SAFE INTERVAL HOOK
// Guaranteed cleanup of setInterval
// ═══════════════════════════════════════════════════════════════
export function useSafeInterval(callback, delay, enabled = true) {
  const intervalManagerRef = useRef(new IntervalManager())

  useEffect(() => {
    const manager = intervalManagerRef.current

    if (!enabled) return

    const id = manager.setInterval(callback, delay)

    return () => {
      manager.clearInterval(id)
    }
  }, [callback, delay, enabled])

  useEffect(() => {
    return () => {
      intervalManagerRef.current.cleanup()
    }
  }, [])
}

// ═══════════════════════════════════════════════════════════════
// SAFE ANIMATION FRAME HOOK
// Pooled RAF management with guaranteed cleanup
// ═══════════════════════════════════════════════════════════════
export function useSafeAnimationFrame(callback, enabled = true) {
  const rafIdRef = useRef(null)
  const callbackRef = useRef(callback)

  // Update callback ref without triggering effect
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const animate = (time) => {
      callbackRef.current(time)
      rafIdRef.current = rafPool.schedule(animate)
    }

    rafIdRef.current = rafPool.schedule(animate)

    return () => {
      if (rafIdRef.current !== null) {
        rafPool.cancel(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [enabled])
}

// ═══════════════════════════════════════════════════════════════
// THROTTLED EVENT LISTENER HOOK
// Memory-efficient event handling with throttling
// ═══════════════════════════════════════════════════════════════
export function useThrottledListener(target, eventType, handler, throttleMs = 100) {
  const throttledRef = useRef(null)

  useEffect(() => {
    if (!target) return

    throttledRef.current = throttle(handler, throttleMs)
    target.addEventListener(eventType, throttledRef.current)

    return () => {
      if (target && throttledRef.current) {
        target.removeEventListener(eventType, throttledRef.current)
        throttledRef.current = null
      }
    }
  }, [target, eventType, handler, throttleMs])
}

// ═══════════════════════════════════════════════════════════════
// DEBOUNCED EVENT LISTENER HOOK
// Delays handler execution until events stop firing
// ═══════════════════════════════════════════════════════════════
export function useDebouncedListener(target, eventType, handler, debounceMs = 300) {
  const debouncedRef = useRef(null)

  useEffect(() => {
    if (!target) return

    debouncedRef.current = debounce(handler, debounceMs)
    target.addEventListener(eventType, debouncedRef.current)

    return () => {
      if (debouncedRef.current) {
        debouncedRef.current.cancel()
        target.removeEventListener(eventType, debouncedRef.current)
        debouncedRef.current = null
      }
    }
  }, [target, eventType, handler, debounceMs])
}

// ═══════════════════════════════════════════════════════════════
// INTERSECTION OBSERVER HOOK
// Simplified IntersectionObserver with cleanup
// ═══════════════════════════════════════════════════════════════
export function useIntersectionCleanup(ref, callback, options = {}) {
  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        callback(entry.isIntersecting)
      })
    }, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px',
      root: options.root || null
    })

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref, callback, options])
}

// ═══════════════════════════════════════════════════════════════
// SAFE FETCH HOOK WITH ABORT CONTROLLER
// Automatically cancels fetch on unmount
// ═══════════════════════════════════════════════════════════════
export function useSafeFetch(url, options = {}) {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    abortControllerRef.current = new AbortController()

    fetch(url, {
      ...options,
      signal: abortControllerRef.current.signal
    })
      .then(res => res.json())
      .then(data => {
        if (abortControllerRef.current?.signal.aborted) return
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err)
        }
        setLoading(false)
      })

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [url])

  return { data, loading, error }
}

// ═══════════════════════════════════════════════════════════════
// SAFE TIMEOUT HOOK
// Guaranteed cleanup of setTimeout
// ═══════════════════════════════════════════════════════════════
export function useSafeTimeout(callback, delay, enabled = true) {
  const timeoutIdRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    timeoutIdRef.current = setTimeout(callback, delay)

    return () => {
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
    }
  }, [callback, delay, enabled])
}

// ═══════════════════════════════════════════════════════════════
// WINDOW EVENT LISTENER HOOK
// Safe window event attachment with cleanup
// ═══════════════════════════════════════════════════════════════
export function useWindowListener(eventType, handler, options = {}) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const eventListener = (e) => handlerRef.current(e)

    window.addEventListener(eventType, eventListener, options)

    return () => {
      window.removeEventListener(eventType, eventListener, options)
    }
  }, [eventType, options])
}

// ═══════════════════════════════════════════════════════════════
// RESIZE OBSERVER HOOK
// Memory-safe ResizeObserver management
// ═══════════════════════════════════════════════════════════════
export function useResizeObserver(ref, callback) {
  useEffect(() => {
    if (!ref.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        callback(entry)
      })
    })

    resizeObserver.observe(ref.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [ref, callback])
}

// ═══════════════════════════════════════════════════════════════
// MUTATION OBSERVER HOOK
// Safe MutationObserver with cleanup
// ═══════════════════════════════════════════════════════════════
export function useMutationObserver(ref, callback, options = {}) {
  useEffect(() => {
    if (!ref.current) return

    const mutationObserver = new MutationObserver((mutations) => {
      callback(mutations)
    })

    mutationObserver.observe(ref.current, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
      ...options
    })

    return () => {
      mutationObserver.disconnect()
    }
  }, [ref, callback, options])
}

// ═══════════════════════════════════════════════════════════════
// MEMOIZED CALLBACK HOOK
// useCallback with cleanup support
// ═══════════════════════════════════════════════════════════════
export function useMemoCallback(callback, dependencies = [], cleanup = null) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (cleanup) cleanup()
      callbackRef.current = null
    }
  }, [cleanup])

  return useCallback((...args) => callbackRef.current(...args), dependencies)
}
