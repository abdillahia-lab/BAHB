import { createContext, useContext, useState, useEffect, useCallback } from 'react'

/**
 * LAZYMASTER: Predictive Prefetch Context
 * Prefetch resources based on cursor position and scroll direction
 * Psychology: User is likely to interact with elements they're hovering over
 */

const PrefetchContext = createContext()

export const usePrefetch = () => {
  const context = useContext(PrefetchContext)
  if (!context) {
    throw new Error('usePrefetch must be used within PrefetchProvider')
  }
  return context
}

export const PrefetchProvider = ({ children }) => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [scrollDir, setScrollDir] = useState('down')
  const [lastScrollY, setLastScrollY] = useState(0)
  const [prefetchedUrls, setPrefetchedUrls] = useState(new Set())

  // Track cursor position
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Track scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollDir(currentScrollY > lastScrollY ? 'down' : 'up')
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Prefetch URL
  const prefetch = useCallback((url) => {
    if (prefetchedUrls.has(url)) return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    link.as = 'image'
    link.importance = 'low'
    document.head.appendChild(link)

    setPrefetchedUrls(prev => new Set([...prev, url]))
  }, [prefetchedUrls])

  // Prefetch images in a given region (useful for cards below fold)
  const prefetchRegion = useCallback((urls) => {
    urls.forEach(url => prefetch(url))
  }, [prefetch])

  // Predict what user will interact with based on cursor
  const getPredictedElements = useCallback(() => {
    const elements = document.querySelectorAll('[data-prefetch]')
    const predictions = []

    elements.forEach(el => {
      const rect = el.getBoundingClientRect()
      const distance = Math.sqrt(
        Math.pow(cursorPos.x - (rect.left + rect.width / 2), 2) +
        Math.pow(cursorPos.y - (rect.top + rect.height / 2), 2)
      )

      predictions.push({
        element: el,
        distance,
        url: el.getAttribute('data-prefetch')
      })
    })

    // Sort by distance and return closest 3
    return predictions.sort((a, b) => a.distance - b.distance).slice(0, 3)
  }, [cursorPos])

  // Auto-prefetch based on cursor position
  useEffect(() => {
    const predicted = getPredictedElements()
    predicted.forEach(item => prefetch(item.url))
  }, [cursorPos, getPredictedElements, prefetch])

  return (
    <PrefetchContext.Provider
      value={{
        cursorPos,
        scrollDir,
        prefetch,
        prefetchRegion,
        getPredictedElements,
        prefetchedUrls
      }}
    >
      {children}
    </PrefetchContext.Provider>
  )
}
