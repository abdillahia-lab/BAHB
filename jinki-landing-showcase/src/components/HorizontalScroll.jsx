import { useEffect, useRef, useState } from 'react'
import './HorizontalScroll.css'

/**
 * Horizontal Scroll Section
 * Allows horizontal scrolling through cards with keyboard nav and progress indicator
 */
export default function HorizontalScroll({ children, title }) {
  const scrollRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Update scroll progress
  const updateScrollState = () => {
    if (!scrollRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    const maxScroll = scrollWidth - clientWidth
    const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0

    setScrollProgress(progress)
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < maxScroll - 1)
  }

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    scrollContainer.addEventListener('scroll', updateScrollState, { passive: true })
    updateScrollState()

    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (!scrollContainer) return

      const scrollAmount = 400 // pixels to scroll per key press

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      } else if (e.key === 'Home') {
        e.preventDefault()
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' })
      } else if (e.key === 'End') {
        e.preventDefault()
        scrollContainer.scrollTo({ left: scrollContainer.scrollWidth, behavior: 'smooth' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      scrollContainer.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })
  }

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })
  }

  return (
    <div className="horizontal-scroll-wrapper">
      {title && (
        <div className="horizontal-scroll-header">
          <h3 className="horizontal-scroll-title">{title}</h3>
          <div className="horizontal-scroll-hint">
            <span>Scroll horizontally</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M8 12H16M16 12L12 8M16 12L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}

      <div className="horizontal-scroll-container">
        {/* Left Navigation Button */}
        <button
          className={`horizontal-scroll-nav horizontal-scroll-nav--left ${!canScrollLeft ? 'horizontal-scroll-nav--disabled' : ''}`}
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          className="horizontal-scroll-content"
          role="region"
          aria-label="Horizontally scrollable content"
          tabIndex="0"
        >
          {children}
        </div>

        {/* Right Navigation Button */}
        <button
          className={`horizontal-scroll-nav horizontal-scroll-nav--right ${!canScrollRight ? 'horizontal-scroll-nav--disabled' : ''}`}
          onClick={scrollRight}
          disabled={!canScrollRight}
          aria-label="Scroll right"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="horizontal-scroll-progress-container">
        <div className="horizontal-scroll-progress-track">
          <div
            className="horizontal-scroll-progress-bar"
            style={{ transform: `scaleX(${scrollProgress})` }}
          />
        </div>
        <div className="horizontal-scroll-progress-text">
          {Math.round(scrollProgress * 100)}%
        </div>
      </div>
    </div>
  )
}
