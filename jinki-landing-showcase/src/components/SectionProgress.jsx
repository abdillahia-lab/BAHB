import { useEffect, useState } from 'react'
import './SectionProgress.css'

/**
 * Vertical Progress Indicator
 * Shows current section and allows jumping to sections
 */
export default function SectionProgress({ sections = [] }) {
  const [activeSection, setActiveSection] = useState(0)
  const [hoveredSection, setHoveredSection] = useState(null)

  useEffect(() => {
    const handleScroll = () => {
      // Find which section is currently in view
      const sectionElements = sections.map(s => document.getElementById(s.id)).filter(Boolean)

      let currentIndex = 0
      const viewportMiddle = window.innerHeight / 2

      sectionElements.forEach((section, index) => {
        const rect = section.getBoundingClientRect()
        // Section is active if its middle is closest to viewport middle
        if (rect.top < viewportMiddle && rect.bottom > viewportMiddle) {
          currentIndex = index
        }
      })

      setActiveSection(currentIndex)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [sections])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (!sections.length) return null

  return (
    <nav className="section-progress" aria-label="Page sections">
      <div className="section-progress-track" />

      {sections.map((section, index) => (
        <button
          key={section.id}
          className={`section-progress-dot ${activeSection === index ? 'section-progress-dot--active' : ''}`}
          onClick={() => scrollToSection(section.id)}
          onMouseEnter={() => setHoveredSection(index)}
          onMouseLeave={() => setHoveredSection(null)}
          aria-label={`Go to ${section.label}`}
          aria-current={activeSection === index ? 'location' : undefined}
        >
          <span className="section-progress-dot-inner" />

          {/* Tooltip */}
          <span
            className={`section-progress-tooltip ${hoveredSection === index || activeSection === index ? 'section-progress-tooltip--visible' : ''}`}
          >
            {section.label}
          </span>
        </button>
      ))}

      {/* Active indicator line */}
      <div
        className="section-progress-active-line"
        style={{
          transform: `translateY(${activeSection * 40}px)`
        }}
      />
    </nav>
  )
}
