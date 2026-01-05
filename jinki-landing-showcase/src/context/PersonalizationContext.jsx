/**
 * Personalization Context - Global React Context for AI Personalization
 * Manages personalization state and provides hooks for components
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import PersonalizationEngine from '../utils/PersonalizationEngine'
import PrivacyManager from '../utils/PrivacyManager'

// Create context
const PersonalizationContextInstance = createContext(null)

/**
 * Provider Component
 */
export function PersonalizationProvider({ children }) {
  const [personalizationState, setPersonalizationState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [consentGiven, setConsentGiven] = useState(false)

  // Initialize personalization on mount
  useEffect(() => {
    const initializePersonalization = async () => {
      try {
        setIsLoading(true)

        // Get referrer and other initial signals
        const referrer = document.referrer || null
        const keywords = extractKeywordsFromPage()

        // Initialize user profile
        const profile = PersonalizationEngine.initializeUser({
          referralSource: referrer,
          keywords,
          metadata: {
            utm_source: getURLParam('utm_source'),
            utm_medium: getURLParam('utm_medium'),
            utm_campaign: getURLParam('utm_campaign')
          }
        })

        setUserProfile(profile)

        // Build personalization state
        const state = PersonalizationEngine.buildPersonalizationState(profile)
        setPersonalizationState(state)

        setIsLoading(false)
      } catch (error) {
        console.error('Personalization initialization error:', error)
        setIsLoading(false)
      }
    }

    initializePersonalization()
  }, [])

  // Track page view
  useEffect(() => {
    if (userProfile) {
      const pageName = window.location.pathname
      const updated = PersonalizationEngine.updateProfile(userProfile, {
        pageViewed: pageName
      })
      setUserProfile(updated)
    }
  }, [typeof window !== 'undefined' && window.location.pathname])

  // Handle consent
  const handleConsent = useCallback((consents) => {
    if (!userProfile) return

    // Record consent
    const consentRecord = PrivacyManager.recordConsent(
      consents,
      undefined, // IP would come from server
      navigator.userAgent
    )

    // Update profile
    const updated = {
      ...userProfile,
      privacyConsent: consents
    }

    setUserProfile(updated)
    setConsentGiven(true)

    // Rebuild state with consent
    const newState = PersonalizationEngine.buildPersonalizationState(updated)
    setPersonalizationState(newState)

    // Save to localStorage
    localStorage.setItem('personalization_consent', JSON.stringify({
      consents,
      timestamp: Date.now()
    }))
  }, [userProfile])

  // Handle user interaction
  const trackInteraction = useCallback((component, action, metadata = {}) => {
    PersonalizationEngine.trackEvent('click', component, {
      action,
      ...metadata
    })

    if (userProfile) {
      const updated = {
        ...userProfile,
        behaviors: {
          ...userProfile.behaviors,
          interactionCount: (userProfile.behaviors.interactionCount || 0) + 1,
          lastInteraction: Date.now()
        }
      }
      setUserProfile(updated)
    }
  }, [userProfile])

  // Handle scroll tracking
  const trackScroll = useCallback((scrollPercentage) => {
    if (userProfile) {
      const updated = PersonalizationEngine.updateProfile(userProfile, {
        scrollDepth: scrollPercentage
      })
      setUserProfile(updated)
    }
  }, [userProfile])

  // Handle form submission
  const handleFormSubmit = useCallback((formData) => {
    PersonalizationEngine.trackEvent('form-fill', 'contact-form', formData)

    if (userProfile) {
      const updated = PersonalizationEngine.updateProfile(userProfile, {
        formFilled: formData
      })
      setUserProfile(updated)

      // Rebuild state with new data
      const newState = PersonalizationEngine.buildPersonalizationState(updated)
      setPersonalizationState(newState)
    }
  }, [userProfile])

  // Memoize context value to prevent unnecessary rerenders
  const value = useMemo(() => ({
    // State
    personalizationState,
    userProfile,
    isLoading,
    consentGiven,

    // Methods
    handleConsent,
    trackInteraction,
    trackScroll,
    handleFormSubmit,

    // Derived data
    detectedIndustry: userProfile?.detectedIndustry || 'unknown',
    userSegment: userProfile?.segment || 'unknown',
    heroVariant: personalizationState?.selectedHeroVariant,
    pricingVariant: personalizationState?.selectedPricingVariant,
    nextAction: personalizationState?.nextAction,
    rankedSolutions: personalizationState?.contentRankings?.solutions || [],
    rankedCaseStudies: personalizationState?.contentRankings?.caseStudies || [],
    rankedTestimonials: personalizationState?.contentRankings?.testimonials || [],
    uiComplexity: personalizationState ? PersonalizationEngine.getUIComplexityLevel(userProfile) : null
  }), [
    personalizationState,
    userProfile,
    isLoading,
    consentGiven,
    handleConsent,
    trackInteraction,
    trackScroll,
    handleFormSubmit
  ])

  return (
    <PersonalizationContextInstance.Provider value={value}>
      {children}
    </PersonalizationContextInstance.Provider>
  )
}

/**
 * Hook to use personalization context
 */
export function usePersonalization() {
  const context = useContext(PersonalizationContextInstance)
  if (!context) {
    throw new Error('usePersonalization must be used within PersonalizationProvider')
  }
  return context
}

/**
 * Helper functions
 */

function extractKeywordsFromPage() {
  // Extract from meta tags, title, and page content
  const keywords = []

  const metaTags = document.querySelectorAll('meta[name="keywords"]')
  metaTags.forEach(tag => {
    const content = tag.getAttribute('content')
    if (content) {
      keywords.push(...content.split(',').map(k => k.trim()))
    }
  })

  // Add title words as keywords
  if (document.title) {
    keywords.push(...document.title.split(' ').filter(w => w.length > 3))
  }

  return keywords
}

function getURLParam(param) {
  const params = new URLSearchParams(window.location.search)
  return params.get(param) || null
}

export default PersonalizationContextInstance
