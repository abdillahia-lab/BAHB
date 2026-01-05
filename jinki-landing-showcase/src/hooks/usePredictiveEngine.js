import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * PREDICTIVE ENGINE
 * Uses behavior patterns to predict:
 * - Next section user will scroll to
 * - User intent (exploring vs. converting)
 * - Exit probability
 * - Conversion likelihood
 * - Optimal CTA placement
 */

const PREDICTION_CONFIG = {
  SCROLL_PREDICTION_WINDOW: 5000, // ms to analyze for scroll patterns
  MIN_CONFIDENCE_THRESHOLD: 0.5, // 0-1, minimum confidence to act
  MOUSE_VELOCITY_THRESHOLD: 2, // pixels/ms
  ENGAGEMENT_SCORE_WEIGHT: {
    timeOnSection: 0.3,
    mouseInteractions: 0.25,
    scrollBehavior: 0.2,
    ctaInteractions: 0.15,
    returnVisits: 0.1,
  },
}

export const usePredictiveEngine = (behaviorData) => {
  const [predictions, setPredictions] = useState({
    nextSectionId: null,
    nextSectionConfidence: 0,
    userIntent: 'exploring', // exploring | interested | ready-to-convert | leaving
    intentConfidence: 0,
    exitProbability: 0,
    conversionScore: 0,
    recommendedCTA: null,
    recommendedCTAId: null,
    mouseIntentSignal: 'neutral', // neutral | scanning | engaged | abandoning
  })

  const predictionTimeoutRef = useRef(null)

  // SCROLL BEHAVIOR PREDICTION
  const predictNextSection = useCallback((scrollData, sectionPositions) => {
    if (!scrollData || scrollData.length < 3) {
      return { sectionId: null, confidence: 0 }
    }

    // Analyze recent scroll velocity
    const recentScroll = scrollData.slice(-5)
    const velocities = []

    for (let i = 1; i < recentScroll.length; i++) {
      const timeDiff = recentScroll[i].timestamp - recentScroll[i - 1].timestamp
      const distDiff = recentScroll[i].scrollY - recentScroll[i - 1].scrollY
      if (timeDiff > 0) {
        velocities.push(Math.abs(distDiff) / timeDiff)
      }
    }

    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length
    const currentScroll = recentScroll[recentScroll.length - 1].scrollY

    // Predict next section based on scroll velocity
    const estimatedDistance = avgVelocity * 2000 // Estimate 2 seconds ahead
    const nextScrollY = currentScroll + estimatedDistance

    // Find section closest to predicted position
    let nextSection = null
    let minDistance = Infinity
    let confidence = 0

    Object.entries(sectionPositions || {}).forEach(([sectionId, position]) => {
      const distance = Math.abs(position - nextScrollY)
      if (distance < minDistance && position > currentScroll) {
        minDistance = distance
        nextSection = sectionId
        // Higher confidence if velocity is consistent
        confidence = Math.min(1, 0.7 + (velocities.length * 0.05))
      }
    })

    return { sectionId: nextSection, confidence }
  }, [])

  // MOUSE INTENT DETECTION
  const predictMouseIntent = useCallback((mousePatterns) => {
    if (!mousePatterns || mousePatterns.length < 5) {
      return { intent: 'neutral', confidence: 0 }
    }

    // Analyze mouse movement patterns
    const recentMouse = mousePatterns.slice(-20)
    let clickableHovers = 0
    let rapidMovements = 0
    let dwellTime = 0

    for (let i = 1; i < recentMouse.length; i++) {
      const prev = recentMouse[i - 1]
      const curr = recentMouse[i]

      // Calculate mouse velocity
      const timeDiff = curr.timestamp - prev.timestamp
      const distance = Math.hypot(curr.x - prev.x, curr.y - prev.y)
      const velocity = distance / timeDiff

      // Track behaviors
      if (curr.isClickable) clickableHovers++
      if (velocity > PREDICTION_CONFIG.MOUSE_VELOCITY_THRESHOLD)
        rapidMovements++
      if (velocity < 0.5 && curr.isClickable) dwellTime += timeDiff
    }

    const clickRatio = clickableHovers / recentMouse.length
    const rapidRatio = rapidMovements / recentMouse.length

    let intent = 'neutral'
    let confidence = 0

    if (clickRatio > 0.6 && dwellTime > 2000) {
      intent = 'engaged'
      confidence = 0.8
    } else if (clickRatio > 0.4) {
      intent = 'scanning'
      confidence = 0.6
    } else if (rapidRatio > 0.7) {
      intent = 'abandoning'
      confidence = 0.7
    }

    return { intent, confidence }
  }, [])

  // USER INTENT PREDICTION
  const predictUserIntent = useCallback((behaviorData) => {
    if (!behaviorData) {
      return { intent: 'exploring', confidence: 0 }
    }

    const {
      sectionTimes,
      ctaInteractions,
      scrollPositions,
      exitSignals,
      conversionActions,
      timeOnPage,
    } = behaviorData

    let score = 0
    const factors = {
      deepScrolling: false,
      ctaEngagement: false,
      sectionFocus: false,
      timeInvested: false,
      conversionSignals: false,
    }

    // Factor 1: Scroll depth (how far down the page)
    if (scrollPositions && scrollPositions.length > 0) {
      const deepest = Math.max(
        ...scrollPositions.map((p) => p.scrollPercentage)
      )
      if (deepest > 50) {
        factors.deepScrolling = true
        score += 0.25
      }
    }

    // Factor 2: CTA interactions
    if (ctaInteractions && ctaInteractions.length > 2) {
      factors.ctaEngagement = true
      score += 0.25
    }

    // Factor 3: Focused section viewing
    if (sectionTimes) {
      const avgTimePerSection =
        Object.values(sectionTimes).reduce((sum, s) => sum + s.totalTime, 0) /
        Object.keys(sectionTimes).length
      if (avgTimePerSection > 5000) {
        // > 5 seconds
        factors.sectionFocus = true
        score += 0.2
      }
    }

    // Factor 4: Time invested
    if (timeOnPage && timeOnPage > 30000) {
      // > 30 seconds
      factors.timeInvested = true
      score += 0.15
    }

    // Factor 5: Conversion signals
    if (conversionActions && conversionActions.length > 0) {
      factors.conversionSignals = true
      score += 0.15
    }

    // Determine intent
    let intent = 'exploring'
    if (score < 0.3) {
      intent = 'exploring'
    } else if (score < 0.6) {
      intent = 'interested'
    } else if (score < 0.8) {
      intent = 'ready-to-convert'
    } else {
      intent = 'converting'
    }

    return { intent, confidence: Math.min(1, score), factors }
  }, [])

  // EXIT PROBABILITY PREDICTION
  const predictExitProbability = useCallback((behaviorData) => {
    if (!behaviorData) return 0

    const {
      exitSignals,
      ctaInteractions,
      mousePatterns,
      scrollPositions,
      sessionDuration,
    } = behaviorData

    let exitRisk = 0

    // High exit risk signals
    if (exitSignals && exitSignals.length > 2) {
      exitRisk += 0.4
    }

    // Low CTA interaction
    if (!ctaInteractions || ctaInteractions.length === 0) {
      exitRisk += 0.25
    }

    // Short session with minimal scrolling
    if (sessionDuration && sessionDuration < 15000) {
      const minScroll = scrollPositions
        ? Math.min(...scrollPositions.map((p) => p.scrollPercentage))
        : 0
      if (minScroll < 20) exitRisk += 0.35
    }

    // Rapid abandoning mouse patterns
    if (mousePatterns) {
      const recentMouse = mousePatterns.slice(-10)
      const abandoningCount = recentMouse.filter(
        (m) => !m.isClickable
      ).length
      if (abandoningCount > 8) {
        exitRisk += 0.2
      }
    }

    return Math.min(1, exitRisk)
  }, [])

  // CONVERSION LIKELIHOOD SCORING
  const calculateConversionScore = useCallback((behaviorData) => {
    if (!behaviorData) return 0

    const {
      sectionTimes,
      ctaInteractions,
      conversionActions,
      returnVisits,
      timeOnPage,
      scrollPositions,
    } = behaviorData

    let score = 0

    // 1. Previous conversions (50% weight)
    const conversionCount = conversionActions?.length || 0
    if (conversionCount > 0) score += 0.5
    else if (ctaInteractions && ctaInteractions.length > 0) score += 0.1

    // 2. Return visitor bonus (15% weight)
    if (returnVisits && returnVisits > 0) {
      score += Math.min(0.15, returnVisits * 0.05)
    }

    // 3. Time investment (20% weight)
    if (timeOnPage) {
      const minutes = timeOnPage / 60000
      if (minutes > 2) score += 0.2
      else if (minutes > 1) score += 0.1
    }

    // 4. Page exploration depth (15% weight)
    if (scrollPositions && scrollPositions.length > 0) {
      const maxScroll = Math.max(...scrollPositions.map((p) => p.scrollPercentage))
      if (maxScroll > 75) score += 0.15
      else if (maxScroll > 50) score += 0.08
    }

    return Math.min(1, score)
  }, [])

  // RECOMMEND OPTIMAL CTA
  const recommendCTA = useCallback((userIntent, conversionScore) => {
    const ctaMap = {
      exploring: { id: 'cta-learn-more', text: 'Explore Solutions' },
      interested: { id: 'cta-demo', text: 'See Live Demo' },
      'ready-to-convert': { id: 'cta-contact', text: 'Contact Sales' },
      converting: { id: 'cta-signup', text: 'Get Started Now' },
    }

    const recommended = ctaMap[userIntent] || ctaMap.exploring

    return {
      cta: recommended.text,
      ctaId: recommended.id,
      confidence: Math.min(1, conversionScore + 0.3),
    }
  }, [])

  // Main prediction cycle
  useEffect(() => {
    if (!behaviorData) return

    if (predictionTimeoutRef.current) {
      clearTimeout(predictionTimeoutRef.current)
    }

    predictionTimeoutRef.current = setTimeout(() => {
      // Get section positions (would normally come from ref callbacks)
      const sectionPositions = {
        'hero': 0,
        'solutions': 1500,
        'features': 3500,
        'case-studies': 5500,
        'pricing': 7500,
        'cta': 9000,
      }

      // Run all predictions
      const nextSection = predictNextSection(
        behaviorData.scrollPositions,
        sectionPositions
      )
      const mouseIntent = predictMouseIntent(behaviorData.mousePatterns)
      const userIntent = predictUserIntent(behaviorData)
      const exitProb = predictExitProbability(behaviorData)
      const convScore = calculateConversionScore(behaviorData)
      const recommendedCTA = recommendCTA(userIntent.intent, convScore)

      setPredictions({
        nextSectionId: nextSection.sectionId,
        nextSectionConfidence: nextSection.confidence,
        userIntent: userIntent.intent,
        intentConfidence: userIntent.confidence,
        exitProbability: exitProb,
        conversionScore: convScore,
        recommendedCTA: recommendedCTA.cta,
        recommendedCTAId: recommendedCTA.ctaId,
        mouseIntentSignal: mouseIntent.intent,
        intentFactors: userIntent.factors,
      })
    }, PREDICTION_CONFIG.SCROLL_PREDICTION_WINDOW)

    return () => {
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current)
      }
    }
  }, [
    behaviorData,
    predictNextSection,
    predictMouseIntent,
    predictUserIntent,
    predictExitProbability,
    calculateConversionScore,
    recommendCTA,
  ])

  return predictions
}
