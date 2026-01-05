/**
 * ════════════════════════════════════════════════════════════════
 * SMART ASSISTANCE HOOKS
 * React hooks for easy integration of proactive help
 * ════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSmartAssistanceEngine } from './SmartAssistanceEngine'

/**
 * useConfusionDetector - Detects when user is confused based on behavior
 * Returns active confusion signals
 */
export function useConfusionDetector() {
  const [signals, setSignals] = useState([])
  const engine = getSmartAssistanceEngine()

  useEffect(() => {
    const unsubscribe = engine.subscribe((event) => {
      if (event.type === 'confusion_signal') {
        setSignals(engine.getConfusionSignals())
      }
    })

    return unsubscribe
  }, [engine])

  return {
    signals,
    hasConfusion: signals.length > 0,
    highestConfidence: signals.length > 0 ? Math.max(...signals.map((s) => s.confidence)) : 0,
  }
}

/**
 * useSectionTracking - Tracks when user enters/exits sections
 * Triggers section-specific help
 */
export function useSectionTracking(sectionId) {
  const engine = getSmartAssistanceEngine()
  const observerRef = useRef(null)

  useEffect(() => {
    const element = document.querySelector(`[data-section="${sectionId}"]`)
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            engine.trackSectionView(sectionId)
          }
        })
      },
      { threshold: 0.3 }
    )

    observer.observe(element)
    observerRef.current = observer

    return () => observer.disconnect()
  }, [sectionId, engine])
}

/**
 * useScrollTracking - Tracks scroll behavior for confusion detection
 */
export function useScrollTracking() {
  const engine = getSmartAssistanceEngine()
  const lastScrollRef = useRef(0)
  const scrollTimeoutRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY
      const direction = currentScroll > lastScrollRef.current ? 'down' : 'up'

      engine.trackScroll(currentScroll, direction)
      lastScrollRef.current = currentScroll

      // Mark end of scrolling
      clearTimeout(scrollTimeoutRef.current)
      engine.sessionMetrics.isScrolling = true

      scrollTimeoutRef.current = setTimeout(() => {
        engine.sessionMetrics.isScrolling = false
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeoutRef.current)
    }
  }, [engine])
}

/**
 * useClickTracking - Tracks user clicks for interaction patterns
 */
export function useClickTracking(sectionId) {
  const engine = getSmartAssistanceEngine()

  useEffect(() => {
    const handleClick = (e) => {
      engine.trackClick(e.target, sectionId)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [sectionId, engine])
}

/**
 * useSmartTooltip - Shows/hides contextual tooltips based on help logic
 */
export function useSmartTooltip(tooltipId, options = {}) {
  const [shouldShow, setShouldShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const engine = getSmartAssistanceEngine()
  const elementRef = useRef(null)

  const show = useCallback(async () => {
    const canShow = await engine.shouldShowAssistance('tooltip', { id: tooltipId })
    if (canShow) {
      setShouldShow(true)
      engine.registerAssistanceShown(tooltipId)

      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect()
        const positioningStrategy = options.position || 'smart'
        const pos = calculateTooltipPosition(rect, positioningStrategy)
        setPosition(pos)
      }
    }
  }, [tooltipId, engine, options])

  const hide = useCallback(() => {
    setShouldShow(false)
  }, [])

  const dismiss = useCallback(() => {
    hide()
    engine.recordAssistanceEngagement(tooltipId, 'dismissHelp')
  }, [tooltipId, engine, hide])

  return {
    shouldShow,
    position,
    elementRef,
    show,
    hide,
    dismiss,
  }
}

/**
 * useGuidedTour - Manages multi-step guided tours
 */
export function useGuidedTour(tourId, steps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const engine = getSmartAssistanceEngine()

  const startTour = useCallback(async () => {
    const canShow = await engine.shouldShowAssistance('tour', { id: tourId })
    if (canShow && !engine.userProfile.dismissedTours.includes(tourId)) {
      setIsActive(true)
      engine.registerAssistanceShown(tourId)
    }
  }, [tourId, engine])

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }, [currentStep, steps])

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const skipTour = useCallback(() => {
    setIsActive(false)
    engine.userProfile.dismissedTours.push(tourId)
    engine.recordAssistanceEngagement(tourId, 'skipGuidedTour')
    engine.saveUserProfile()
  }, [tourId, engine])

  const completeTour = useCallback(() => {
    setIsActive(false)
    engine.userProfile.completedTours.push(tourId)
    engine.recordAssistanceEngagement(tourId, 'completeGuidedTour')
    engine.saveUserProfile()
  }, [tourId, engine])

  useEffect(() => {
    if (isActive) {
      // Highlight current step element
      const element = document.querySelector(steps[currentStep].selector)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [isActive, currentStep, steps])

  return {
    isActive,
    currentStep,
    totalSteps: steps.length,
    currentStepData: steps[currentStep],
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
  }
}

/**
 * useSmartSuggestions - Shows smart suggestions based on confusion detection
 */
export function useSmartSuggestions(sectionId) {
  const [suggestions, setSuggestions] = useState([])
  const [dismissed, setDismissed] = useState(false)
  const { signals } = useConfusionDetector()
  const engine = getSmartAssistanceEngine()

  useEffect(() => {
    if (signals.length > 0 && !dismissed) {
      const relevantSuggestions = generateSuggestionsForSignals(
        signals,
        sectionId
      )
      setSuggestions(relevantSuggestions)
      engine.registerAssistanceShown(`suggestion_${sectionId}`)
    }
  }, [signals, sectionId, dismissed, engine])

  const dismiss = useCallback(() => {
    setDismissed(true)
    setSuggestions([])
  }, [])

  return {
    suggestions,
    hasSuggestions: suggestions.length > 0,
    dismissed,
    dismiss,
  }
}

/**
 * useReadingTime - Estimates reading time for content
 */
export function useReadingTime(content) {
  const [readingTime, setReadingTime] = useState(0)

  useEffect(() => {
    if (!content) return

    // Count words
    const wordCount = content
      .split(/\s+/)
      .filter((word) => word.length > 0).length

    // Standard reading speed: 200 words per minute
    const minutes = Math.ceil(wordCount / 200)
    setReadingTime(minutes)
  }, [content])

  return {
    minutes: readingTime,
    display: readingTime === 1 ? '1 min read' : `${readingTime} min read`,
  }
}

/**
 * useFormAssistance - Intelligent form field assistance
 */
export function useFormAssistance(fieldName, config = {}) {
  const [hint, setHint] = useState('')
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isValidating, setIsValidating] = useState(false)
  const engine = getSmartAssistanceEngine()

  const validateField = useCallback(
    (value) => {
      setIsValidating(true)

      // Show hint on focus
      if (config.hint) {
        setHint(config.hint)
      }

      // Check if value matches validation rule
      if (config.validation) {
        const isValid = validateValue(value, config.validation)
        if (!isValid) {
          setError(config.errorMessage || 'Invalid input')
        } else {
          setError('')
        }
      }

      // Show suggestions
      if (config.suggestions && value.length < 2) {
        setSuggestions(config.suggestions)
      } else {
        setSuggestions([])
      }

      setIsValidating(false)
    },
    [config]
  )

  const clearHint = useCallback(() => {
    setHint('')
  }, [])

  const selectSuggestion = useCallback((suggestion) => {
    setSuggestions([])
    engine.recordAssistanceEngagement(`form_${fieldName}`, 'clickHelp')
  }, [fieldName, engine])

  return {
    hint,
    error,
    suggestions,
    isValidating,
    validateField,
    clearHint,
    selectSuggestion,
  }
}

/**
 * useRecommendations - Smart "You might also like" recommendations
 */
export function useRecommendations(currentSectionId) {
  const [recommendations, setRecommendations] = useState([])
  const engine = getSmartAssistanceEngine()

  useEffect(() => {
    const recs = generateRecommendations(currentSectionId, engine)
    setRecommendations(recs)
  }, [currentSectionId, engine])

  const trackClick = useCallback(
    (recommendationId) => {
      engine.recordAssistanceEngagement(recommendationId, 'clickHelp')
    },
    [engine]
  )

  return {
    recommendations,
    trackClick,
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function calculateTooltipPosition(elementRect, strategy = 'smart') {
  const offset = 10
  let top = elementRect.top - offset
  let left = elementRect.left

  if (strategy === 'smart') {
    // Auto-position to avoid viewport clipping
    const tooltipHeight = 100
    const tooltipWidth = 280

    if (top < tooltipHeight) {
      top = elementRect.bottom + offset
    }

    if (left + tooltipWidth > window.innerWidth) {
      left = window.innerWidth - tooltipWidth - offset
    }
  }

  return { top, left }
}

function validateValue(value, validationType) {
  switch (validationType) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    case 'phone':
      return /^\+?[\d\s\-()]+$/.test(value)
    case 'url':
      return /^https?:\/\/.+/.test(value)
    case 'required':
      return value.trim().length > 0
    default:
      return true
  }
}

function generateSuggestionsForSignals(signals, sectionId) {
  const suggestions = []

  signals.forEach((signal) => {
    switch (signal.type) {
      case 'RAPID_SCROLL':
        suggestions.push({
          id: 'rapid_scroll_hint',
          text: 'Try scrolling slower to explore each section',
          icon: 'arrow-down',
        })
        break
      case 'BACK_FORTH_SCROLL':
        suggestions.push({
          id: 'navigate_hint',
          text: 'Use the navigation menu to jump to sections',
          icon: 'menu',
        })
        break
      case 'IDLE_ON_SECTION':
        suggestions.push({
          id: 'interact_hint',
          text: 'Try clicking or hovering on elements to interact',
          icon: 'mouse-pointer',
        })
        break
      case 'HOVER_WITHOUT_ACTION':
        suggestions.push({
          id: 'click_hint',
          text: 'Click on highlighted elements to see more',
          icon: 'cursor-click',
        })
        break
      default:
        break
    }
  })

  return suggestions
}

function generateRecommendations(sectionId, engine) {
  const recommendations = [
    {
      id: 'rec_1',
      title: 'View Security Case Study',
      description: 'See how enterprises reduce risk with our AI',
      sectionId: 'security-deep-dive',
    },
    {
      id: 'rec_2',
      title: 'Start Free Trial',
      description: 'Experience live drone inspection',
      sectionId: 'demo',
    },
  ]

  // Filter based on current section
  return recommendations.filter((rec) => rec.sectionId !== sectionId).slice(0, 2)
}

export default {
  useConfusionDetector,
  useSectionTracking,
  useScrollTracking,
  useClickTracking,
  useSmartTooltip,
  useGuidedTour,
  useSmartSuggestions,
  useReadingTime,
  useFormAssistance,
  useRecommendations,
}
