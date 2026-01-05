import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * BEHAVIOR TRACKING SYSTEM
 * Captures granular user interactions with privacy-conscious approach
 * - Scroll patterns
 * - Mouse movements & intent
 * - Time on sections
 * - CTA interactions
 * - Exit signals
 */

const TRACKING_CONFIG = {
  SCROLL_THROTTLE: 100, // ms between scroll events
  MOUSE_SAMPLE_RATE: 50, // ms between mouse position samples
  SECTION_THRESHOLD: 0.5, // % of section visible for tracking
  EXIT_INTENT_THRESHOLD: 100, // pixels from top before exit
  LOCAL_STORAGE_KEY: 'jinki_behavior_data',
  MAX_STORED_SESSIONS: 10,
  PRIVACY_MODE: true, // Disable tracking if Do Not Track is set
}

export const useBehaviorTracking = (sessionId) => {
  const [behaviorData, setBehaviorData] = useState(null)
  const trackingRef = useRef({
    scrollPositions: [],
    mousePatterns: [],
    sectionTimes: {},
    ctaInteractions: [],
    entryTime: Date.now(),
    exitSignals: [],
    viewportSize: { width: 0, height: 0 },
    deviceType: 'desktop',
    conversionActions: [],
    returnVisits: 0,
  })
  const scrollTimeoutRef = useRef(null)
  const mouseTimeoutRef = useRef(null)
  const intersectionObserversRef = useRef(new Map())

  // Check privacy settings
  const isPrivacyMode = useCallback(() => {
    if (!TRACKING_CONFIG.PRIVACY_MODE) return false
    if (typeof window === 'undefined') return false

    // Respect Do Not Track header
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
      return true
    }

    // Check localStorage for user opt-out
    const optOut = localStorage.getItem('jinki_tracking_optout')
    return optOut === 'true'
  }, [])

  // Initialize tracking
  useEffect(() => {
    if (isPrivacyMode()) return

    const trackingData = trackingRef.current

    // Detect device type
    trackingData.deviceType =
      /mobile|android|iphone|ipad|tablet/i.test(navigator.userAgent)
        ? 'mobile'
        : 'desktop'

    // Store viewport size
    trackingData.viewportSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    // Load previous session if exists
    try {
      const stored = localStorage.getItem(TRACKING_CONFIG.LOCAL_STORAGE_KEY)
      if (stored) {
        const sessions = JSON.parse(stored)
        if (Array.isArray(sessions) && sessions.length > 0) {
          trackingData.returnVisits = sessions.length
        }
      }
    } catch (e) {
      console.warn('Error loading previous sessions:', e)
    }
  }, [isPrivacyMode])

  // SCROLL TRACKING - Predict next section the user will see
  const trackScrollBehavior = useCallback(() => {
    if (isPrivacyMode()) return

    const trackingData = trackingRef.current
    const scrollY = window.scrollY || window.pageYOffset
    const scrollPercentage = (
      scrollY / (document.documentElement.scrollHeight - window.innerHeight)
    ) * 100

    trackingData.scrollPositions.push({
      timestamp: Date.now(),
      scrollY,
      scrollPercentage,
      velocity: calculateScrollVelocity(trackingData.scrollPositions),
    })

    // Keep only last 100 scroll events
    if (trackingData.scrollPositions.length > 100) {
      trackingData.scrollPositions = trackingData.scrollPositions.slice(-100)
    }

    setBehaviorData({ ...trackingData })
  }, [isPrivacyMode])

  // MOUSE PATTERN TRACKING - Detect intent signals
  const trackMousePattern = useCallback((e) => {
    if (isPrivacyMode()) return

    const trackingData = trackingRef.current
    const { clientX, clientY } = e

    trackingData.mousePatterns.push({
      timestamp: Date.now(),
      x: clientX,
      y: clientY,
      // Determine if hovering over interactive element
      elementType: getElementType(e.target),
      isClickable: isClickableElement(e.target),
    })

    // Keep only last 200 mouse events
    if (trackingData.mousePatterns.length > 200) {
      trackingData.mousePatterns = trackingData.mousePatterns.slice(-200)
    }

    setBehaviorData({ ...trackingData })
  }, [isPrivacyMode])

  // SECTION TIME TRACKING - Measure engagement per section
  const trackSectionTime = useCallback((sectionId, timeSpent) => {
    if (isPrivacyMode()) return

    const trackingData = trackingRef.current

    if (!trackingData.sectionTimes[sectionId]) {
      trackingData.sectionTimes[sectionId] = {
        totalTime: 0,
        visits: 0,
        lastVisit: Date.now(),
      }
    }

    trackingData.sectionTimes[sectionId].totalTime += timeSpent
    trackingData.sectionTimes[sectionId].visits += 1
    trackingData.sectionTimes[sectionId].lastVisit = Date.now()

    setBehaviorData({ ...trackingData })
  }, [isPrivacyMode])

  // CTA INTERACTION TRACKING
  const trackCTAInteraction = useCallback((ctaId, ctaText, action = 'click') => {
    if (isPrivacyMode()) return

    const trackingData = trackingRef.current

    trackingData.ctaInteractions.push({
      timestamp: Date.now(),
      ctaId,
      ctaText,
      action,
      scrollPosition: window.scrollY,
      timeOnPage: Date.now() - trackingData.entryTime,
    })

    // Track conversion action
    if (action === 'click' || action === 'signup') {
      trackingData.conversionActions.push({
        timestamp: Date.now(),
        type: action,
        ctaId,
      })
    }

    setBehaviorData({ ...trackingData })
  }, [isPrivacyMode])

  // EXIT INTENT DETECTION - Predict if user is about to leave
  const trackExitIntent = useCallback((e) => {
    if (isPrivacyMode()) return
    if (e.clientY > TRACKING_CONFIG.EXIT_INTENT_THRESHOLD) return // Not at top

    const trackingData = trackingRef.current

    trackingData.exitSignals.push({
      timestamp: Date.now(),
      timeOnPage: Date.now() - trackingData.entryTime,
      scrollDepth: (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100,
      interactionCount: trackingData.ctaInteractions.length,
    })

    setBehaviorData({ ...trackingData })
  }, [isPrivacyMode])

  // Setup scroll event listener
  useEffect(() => {
    if (isPrivacyMode()) return

    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(
        trackScrollBehavior,
        TRACKING_CONFIG.SCROLL_THROTTLE
      )
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [trackScrollBehavior, isPrivacyMode])

  // Setup mouse tracking
  useEffect(() => {
    if (isPrivacyMode()) return

    const handleMouseMove = (e) => {
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current)
      mouseTimeoutRef.current = setTimeout(
        () => trackMousePattern(e),
        TRACKING_CONFIG.MOUSE_SAMPLE_RATE
      )
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current)
    }
  }, [trackMousePattern, isPrivacyMode])

  // Setup exit intent
  useEffect(() => {
    if (isPrivacyMode()) return

    const handleMouseLeave = (e) => {
      if (e.clientY <= TRACKING_CONFIG.EXIT_INTENT_THRESHOLD) {
        trackExitIntent(e)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [trackExitIntent, isPrivacyMode])

  // Persist data on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isPrivacyMode()) return

      const trackingData = trackingRef.current
      trackingData.sessionDuration = Date.now() - trackingData.entryTime

      try {
        const stored = localStorage.getItem(TRACKING_CONFIG.LOCAL_STORAGE_KEY)
        let sessions = []

        if (stored) {
          sessions = JSON.parse(stored)
        }

        // Keep only last N sessions
        sessions.push(trackingData)
        if (sessions.length > TRACKING_CONFIG.MAX_STORED_SESSIONS) {
          sessions = sessions.slice(-TRACKING_CONFIG.MAX_STORED_SESSIONS)
        }

        localStorage.setItem(
          TRACKING_CONFIG.LOCAL_STORAGE_KEY,
          JSON.stringify(sessions)
        )
      } catch (e) {
        console.warn('Error persisting tracking data:', e)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isPrivacyMode])

  return {
    trackSectionTime,
    trackCTAInteraction,
    trackExitIntent,
    getBehaviorData: () => trackingRef.current,
    reset: () => {
      trackingRef.current = {
        scrollPositions: [],
        mousePatterns: [],
        sectionTimes: {},
        ctaInteractions: [],
        entryTime: Date.now(),
        exitSignals: [],
        viewportSize: { width: 0, height: 0 },
        deviceType: 'desktop',
        conversionActions: [],
        returnVisits: 0,
      }
    },
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function calculateScrollVelocity(positions) {
  if (positions.length < 2) return 0
  const recent = positions.slice(-2)
  const timeDiff = recent[1].timestamp - recent[0].timestamp
  const distDiff = recent[1].scrollY - recent[0].scrollY
  return timeDiff > 0 ? distDiff / timeDiff : 0
}

function getElementType(element) {
  if (!element) return 'unknown'
  const tagName = element.tagName.toLowerCase()
  const classList = element.className || ''

  if (tagName === 'button' || classList.includes('btn')) return 'button'
  if (tagName === 'a') return 'link'
  if (tagName === 'input') return 'input'
  if (classList.includes('cta')) return 'cta'
  if (classList.includes('card')) return 'card'

  return tagName
}

function isClickableElement(element) {
  if (!element) return false
  const clickableSelectors = [
    'button',
    'a',
    'input',
    '[role="button"]',
    '.cta',
    '.btn',
  ]

  return clickableSelectors.some((selector) => {
    try {
      return element.matches(selector) || element.closest(selector)
    } catch {
      return false
    }
  })
}
