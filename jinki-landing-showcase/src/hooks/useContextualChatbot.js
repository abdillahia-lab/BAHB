import { useEffect, useState } from 'react'

/**
 * useContextualChatbot Hook
 * Detects user context based on scroll position, page section, and user behavior
 * Provides context-aware conversation suggestions and responses
 */
export const useContextualChatbot = () => {
  const [contextData, setContextData] = useState({
    scrollPosition: 0,
    currentSection: 'hero',
    timeOnPage: 0,
    viewedSections: [],
    primaryIntent: 'product',
    engagementLevel: 'low',
  })

  const [suggestedResponses, setSuggestedResponses] = useState([])

  // Map sections to content based on page structure
  const SECTION_MAP = {
    hero: { name: 'Hero', intent: 'product', keywords: ['jinki', 'drone', 'security'] },
    features: { name: 'Features', intent: 'features', keywords: ['feature', 'capability', 'ability'] },
    pricing: { name: 'Pricing', intent: 'pricing', keywords: ['pricing', 'price', 'cost', 'plan'] },
    caseStudies: { name: 'Case Studies', intent: 'product', keywords: ['case', 'study', 'example'] },
    testimonials: { name: 'Testimonials', intent: 'social_proof', keywords: ['review', 'testimonial'] },
    faq: { name: 'FAQ', intent: 'support', keywords: ['faq', 'question', 'answer'] },
    contact: { name: 'Contact', intent: 'demo', keywords: ['contact', 'call', 'demo'] },
  }

  // Detect current section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY
      const sections = document.querySelectorAll('[data-section]')
      let currentSection = 'hero'
      let engagementLevel = 'low'

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        if (rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2) {
          currentSection = section.getAttribute('data-section')
        }
      })

      // Determine engagement level
      if (scrollPos > window.innerHeight * 3) {
        engagementLevel = 'high'
      } else if (scrollPos > window.innerHeight) {
        engagementLevel = 'medium'
      }

      setContextData((prev) => {
        const newViewedSections = prev.viewedSections.includes(currentSection)
          ? prev.viewedSections
          : [...prev.viewedSections, currentSection]

        return {
          ...prev,
          scrollPosition: scrollPos,
          currentSection,
          engagementLevel,
          viewedSections: newViewedSections,
          primaryIntent: SECTION_MAP[currentSection]?.intent || 'product',
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track time on page
  useEffect(() => {
    const timer = setInterval(() => {
      setContextData((prev) => ({
        ...prev,
        timeOnPage: prev.timeOnPage + 1,
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Generate contextual suggestions based on scroll position
  useEffect(() => {
    const suggestions = generateContextualSuggestions(contextData)
    setSuggestedResponses(suggestions)
  }, [contextData])

  const generateContextualSuggestions = (context) => {
    const suggestions = {
      hero: [
        'Tell me more about your solutions',
        'Schedule a personalized demo',
        'What industries do you serve?',
      ],
      features: [
        'How does the drone inspection work?',
        "What's included in cybersecurity advisory?",
        'Can I see a live demo?',
      ],
      pricing: [
        'Which plan is best for my company?',
        'What about enterprise pricing?',
        'Are there volume discounts?',
      ],
      caseStudies: [
        'Tell me more about this success story',
        'How can you help my business?',
        'Request a consultation',
      ],
      testimonials: [
        'How do I get started?',
        'What makes you different?',
        'Talk to your team',
      ],
      faq: [
        'I still have questions',
        'Connect me with a specialist',
        'Schedule a call',
      ],
      contact: [
        'Schedule a demo',
        'Request pricing',
        'Technical consultation',
      ],
    }

    return suggestions[context.currentSection] || suggestions.hero
  }

  return {
    contextData,
    suggestedResponses,
    getSectionInfo: (section) => SECTION_MAP[section],
  }
}
