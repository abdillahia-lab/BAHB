/**
 * INTENT ANALYZER
 * Advanced intent detection using heuristics and pattern matching
 * - Identifies user purpose on page
 * - Detects decision-making signals
 * - Predicts next micro-conversion
 */

export const IntentAnalyzer = {
  /**
   * Analyze mouse patterns for micro-intent signals
   * Returns detailed intent breakdown
   */
  analyzeMouseMicroIntents(mousePatterns) {
    if (!mousePatterns || mousePatterns.length === 0) {
      return {
        isScanning: false,
        isReading: false,
        isDeciding: false,
        isAvoiding: false,
        dominantBehavior: 'idle',
      }
    }

    const recent = mousePatterns.slice(-30)
    const metrics = calculateMouseMetrics(recent)

    return {
      isScanning: metrics.rapidMovements > 0.6,
      isReading: metrics.dwellTime > 3000,
      isDeciding: metrics.hoveredClickables > 0.5 && metrics.dwellTime > 2000,
      isAvoiding: metrics.avoidanceScore > 0.7,
      dominantBehavior: identifyDominantBehavior(metrics),
      confidence: calculateConfidence(metrics),
    }
  },

  /**
   * Detect friction points that indicate abandonment risk
   */
  detectFrictionPoints(behaviorData, sessionDuration) {
    const frictionPoints = []

    if (!behaviorData) return frictionPoints

    // Friction 1: Sudden scroll stops
    if (behaviorData.scrollPositions && behaviorData.scrollPositions.length > 10) {
      const scrollData = behaviorData.scrollPositions
      const velocities = calculateVelocities(scrollData)
      const zeroVelocityCount = velocities.filter((v) => v === 0).length

      if (zeroVelocityCount / velocities.length > 0.4) {
        frictionPoints.push({
          type: 'scroll-friction',
          severity: 'high',
          description: 'User frequently stops scrolling',
          recommendation: 'Add engaging content or clear CTAs at current position',
        })
      }
    }

    // Friction 2: CTA avoidance
    if (behaviorData.ctaInteractions && behaviorData.ctaInteractions.length === 0) {
      frictionPoints.push({
        type: 'cta-avoidance',
        severity: 'critical',
        description: 'User has not interacted with any CTAs',
        recommendation: 'Improve CTA visibility or relevance',
      })
    }

    // Friction 3: Rapid exit signals
    if (
      behaviorData.exitSignals &&
      behaviorData.exitSignals.length > 1 &&
      sessionDuration < 20000
    ) {
      frictionPoints.push({
        type: 'rapid-exit',
        severity: 'critical',
        description: 'User showing strong exit intent signals',
        recommendation: 'Deploy exit-intent offer or content adjustment',
      })
    }

    // Friction 4: Low engagement depth
    if (behaviorData.scrollPositions && behaviorData.scrollPositions.length > 0) {
      const maxScroll = Math.max(...behaviorData.scrollPositions.map((p) => p.scrollPercentage))
      if (maxScroll < 30 && sessionDuration > 10000) {
        frictionPoints.push({
          type: 'shallow-engagement',
          severity: 'medium',
          description: 'User scrolling minimally despite time on page',
          recommendation: 'Add progressive disclosure or lazy-loaded content',
        })
      }
    }

    return frictionPoints
  },

  /**
   * Predict next micro-conversion (smallest possible action)
   */
  predictNextMicroConversion(behaviorData, userIntent) {
    const conversions = {
      exploring: {
        action: 'view-case-study',
        trigger: 'auto-play-video',
        urgency: 'low',
      },
      interested: {
        action: 'request-demo',
        trigger: 'show-testimonial',
        urgency: 'medium',
      },
      'ready-to-convert': {
        action: 'start-trial',
        trigger: 'urgency-badge',
        urgency: 'high',
      },
      converting: {
        action: 'complete-signup',
        trigger: 'progress-indicator',
        urgency: 'critical',
      },
    }

    const prediction = conversions[userIntent] || conversions.exploring

    // Add timing prediction
    return {
      ...prediction,
      estimatedTimeToAction: estimateConversionTiming(behaviorData),
      confidence: calculateConversionConfidence(behaviorData),
    }
  },

  /**
   * Segment users by behavior pattern
   */
  segmentUserByPattern(behaviorData) {
    if (!behaviorData) return 'unknown'

    const scrollDepth = behaviorData.scrollPositions
      ? Math.max(...behaviorData.scrollPositions.map((p) => p.scrollPercentage))
      : 0
    const ctaCount = behaviorData.ctaInteractions?.length || 0
    const timeOnPage = behaviorData.sessionDuration || 0

    if (timeOnPage < 10000) {
      return 'bouncer'
    } else if (ctaCount === 0) {
      return 'lurker'
    } else if (scrollDepth < 40) {
      return 'skimmer'
    } else if (scrollDepth < 75) {
      return 'reader'
    } else if (ctaCount > 2) {
      return 'converter'
    } else {
      return 'engaged-visitor'
    }
  },

  /**
   * Calculate user lifecycle stage
   */
  predictUserLifecycle(behaviorData, returnVisits) {
    if (returnVisits > 3) {
      return 'loyal'
    } else if (returnVisits > 0) {
      return 'returning'
    } else if (behaviorData?.conversionActions?.length > 0) {
      return 'converted'
    } else if (behaviorData?.ctaInteractions?.length > 2) {
      return 'engaged'
    } else {
      return 'new'
    }
  },

  /**
   * Predict attention drop-off points
   */
  predictAttentionDropoff(scrollData) {
    if (!scrollData || scrollData.length < 10) {
      return []
    }

    const dropoffs = []
    const velocities = calculateVelocities(scrollData)

    for (let i = 1; i < velocities.length; i++) {
      const prevVelocity = velocities[i - 1]
      const currVelocity = velocities[i]

      // Detect significant velocity decrease
      if (
        prevVelocity > 1 &&
        currVelocity < 0.3 &&
        prevVelocity / (currVelocity + 0.1) > 3
      ) {
        dropoffs.push({
          position: scrollData[i].scrollY,
          percentage: scrollData[i].scrollPercentage,
          severity: 'high',
          timestamp: scrollData[i].timestamp,
        })
      }
    }

    return dropoffs
  },
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function calculateMouseMetrics(mousePatterns) {
  let rapidMovements = 0
  let dwellTime = 0
  let hoveredClickables = 0
  let avoidanceScore = 0

  for (let i = 1; i < mousePatterns.length; i++) {
    const prev = mousePatterns[i - 1]
    const curr = mousePatterns[i]

    const distance = Math.hypot(curr.x - prev.x, curr.y - prev.y)
    const timeDiff = curr.timestamp - prev.timestamp

    // Fast movement
    if (distance / timeDiff > 2) {
      rapidMovements++
    }

    // Hovering over clickables
    if (curr.isClickable) {
      hoveredClickables++
      if (distance < 5) {
        dwellTime += timeDiff
      }
    } else {
      avoidanceScore++
    }
  }

  return {
    rapidMovements: rapidMovements / mousePatterns.length,
    dwellTime,
    hoveredClickables: hoveredClickables / mousePatterns.length,
    avoidanceScore: avoidanceScore / mousePatterns.length,
  }
}

function calculateVelocities(scrollData) {
  const velocities = []
  for (let i = 1; i < scrollData.length; i++) {
    const timeDiff = scrollData[i].timestamp - scrollData[i - 1].timestamp
    const distDiff = scrollData[i].scrollY - scrollData[i - 1].scrollY
    velocities.push(timeDiff > 0 ? Math.abs(distDiff) / timeDiff : 0)
  }
  return velocities
}

function identifyDominantBehavior(metrics) {
  if (metrics.rapidMovements > 0.6) return 'scanning'
  if (metrics.dwellTime > 3000) return 'reading'
  if (metrics.hoveredClickables > 0.5) return 'considering'
  if (metrics.avoidanceScore > 0.7) return 'abandoning'
  return 'neutral'
}

function calculateConfidence(metrics) {
  const signals = [
    metrics.rapidMovements > 0.3,
    metrics.dwellTime > 1000,
    metrics.hoveredClickables > 0.3,
  ].filter(Boolean).length

  return Math.min(1, signals * 0.33)
}

function estimateConversionTiming(behaviorData) {
  if (!behaviorData) return 'unknown'

  const { sessionDuration, ctaInteractions } = behaviorData
  const avgCTAInterval =
    ctaInteractions && ctaInteractions.length > 1
      ? sessionDuration / ctaInteractions.length
      : 30000

  if (avgCTAInterval < 20000) return 'immediate'
  if (avgCTAInterval < 60000) return 'soon'
  return 'later'
}

function calculateConversionConfidence(behaviorData) {
  if (!behaviorData) return 0

  let score = 0

  if (behaviorData.ctaInteractions?.length > 0) score += 0.3
  if (behaviorData.conversionActions?.length > 0) score += 0.4
  if (behaviorData.sessionDuration > 30000) score += 0.2
  if (behaviorData.returnVisits > 0) score += 0.1

  return Math.min(1, score)
}
