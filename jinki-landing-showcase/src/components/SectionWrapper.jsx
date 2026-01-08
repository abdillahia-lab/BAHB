import { useEffect, useRef, useState } from 'react'
import './SectionWrapper.css'

/**
 * Premium Section Wrapper with transition effects
 * Each section gets unique entrance/exit animations
 */
export default function SectionWrapper({
  children,
  id,
  transition = 'fade',
  backgroundColor = 'transparent',
  className = ''
}) {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      {
        threshold: [0, 0.1, 0.3, 0.5, 0.7, 1],
        rootMargin: '-10% 0px -10% 0px'
      }
    )

    observer.observe(section)

    // Track scroll progress within section
    const handleScroll = () => {
      const rect = section.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const sectionHeight = rect.height

      // Calculate progress (0 to 1) as section scrolls through viewport
      const progress = Math.max(
        0,
        Math.min(
          1,
          (windowHeight - rect.top) / (windowHeight + sectionHeight)
        )
      )

      setScrollProgress(progress)

      // Update CSS custom property for scroll-linked effects
      section.style.setProperty('--scroll-progress', progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`
        section-wrapper
        section-wrapper--${transition}
        ${isVisible ? 'section-wrapper--visible' : ''}
        ${className}
      `}
      style={{
        '--section-bg': backgroundColor,
        '--scroll-progress': scrollProgress
      }}
      data-scroll-progress={scrollProgress.toFixed(2)}
    >
      {children}
    </section>
  )
}
