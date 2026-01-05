/**
 * CONVERSION SCORER
 * Sophisticated conversion likelihood prediction
 * - Real-time conversion probability
 * - Revenue potential estimation
 * - Customer lifetime value prediction
 * - Risk assessment
 */

export const ConversionScorer = {
  /**
   * Calculate real-time conversion score (0-100)
   * Uses weighted factors from current session
   */
  calculateConversionScore(behaviorData, userSegment) {
    if (!behaviorData) return 0

    let score = 0
    const weights = {
      scrollDepth: 0.15,
      timeInvested: 0.15,
      ctaEngagement: 0.25,
      mouseIntent: 0.15,
      returnVisitor: 0.15,
      conversionHistory: 0.15,
    }

    // Factor 1: Scroll Depth (how far they've scrolled)
    const scrollDepth = calculateScrollDepth(behaviorData)
    score += scrollDepth * weights.scrollDepth

    // Factor 2: Time Invested
    const timeScore = calculateTimeScore(behaviorData.sessionDuration)
    score += timeScore * weights.timeInvested

    // Factor 3: CTA Engagement
    const ctaScore = calculateCTAEngagementScore(
      behaviorData.ctaInteractions
    )
    score += ctaScore * weights.ctaEngagement

    // Factor 4: Mouse Intent Patterns
    const mouseScore = calculateMouseIntentScore(behaviorData.mousePatterns)
    score += mouseScore * weights.mouseIntent

    // Factor 5: Return Visitor Bonus
    const returnBonus = behaviorData.returnVisits > 0 ? 1 : 0
    score += returnBonus * weights.returnVisitor

    // Factor 6: Previous Conversions
    const conversionBonus =
      behaviorData.conversionActions?.length > 0 ? 1 : 0
    score += conversionBonus * weights.conversionHistory

    // Apply segment-based adjustments
    const adjustedScore = applySegmentAdjustment(score, userSegment)

    return Math.min(100, adjustedScore)
  },

  /**
   * Estimate customer lifetime value based on behavioral patterns
   */
  estimateCustomerLTV(initialConversionValue, behaviorData) {
    const baseValue = initialConversionValue || 100

    let ltv = baseValue

    // Increase LTV based on engagement depth
    if (behaviorData?.scrollPositions) {
      const maxScroll = Math.max(
        ...behaviorData.scrollPositions.map((p) => p.scrollPercentage)
      )
      ltv *= 1 + maxScroll / 100
    }

    // Increase LTV for return visitors (repeat purchase potential)
    if (behaviorData?.returnVisits > 0) {
      ltv *= 1 + behaviorData.returnVisits * 0.3
    }

    // Increase LTV for high CTA engagement
    if (behaviorData?.ctaInteractions?.length > 3) {
      ltv *= 1.5
    }

    // Increase LTV for previous converters
    if (behaviorData?.conversionActions?.length > 0) {
      ltv *= 2
    }

    return {
      estimatedLTV: Math.round(ltv),
      factors: {
        baseValue,
        engagementMultiplier: behaviorData?.scrollPositions
          ? 1 + Math.max(...behaviorData.scrollPositions.map((p) => p.scrollPercentage)) / 100
          : 1,
        returnVisitorMultiplier: 1 + (behaviorData?.returnVisits || 0) * 0.3,
        ctaEngagementMultiplier: (behaviorData?.ctaInteractions?.length || 0) > 3 ? 1.5 : 1,
        conversionHistoryMultiplier: (behaviorData?.conversionActions?.length || 0) > 0 ? 2 : 1,
      },
    }
  },

  /**
   * Risk assessment - identify users likely to churn/bounce
   */
  assessRisk(behaviorData, sessionDuration) {
    const risks = {
      bounceRisk: calculateBounceRisk(behaviorData, sessionDuration),
      churnRisk: calculateChurnRisk(behaviorData),
      abandonmentRisk: calculateAbandonmentRisk(behaviorData),
      overallRisk: 0,
      recommendations: [],
    }

    risks.overallRisk = (
      risks.bounceRisk +
      risks.churnRisk +
      risks.abandonmentRisk
    ) / 3

    // Generate recommendations based on risks
    if (risks.bounceRisk > 0.7) {
      risks.recommendations.push({
        type: 'high-bounce-risk',
        action: 'show-engagement-cta',
        urgency: 'critical',
      })
    }

    if (risks.abandonmentRisk > 0.7) {
      risks.recommendations.push({
        type: 'abandon-risk',
        action: 'deploy-exit-intent',
        urgency: 'critical',
      })
    }

    if (risks.churnRisk > 0.5 && behaviorData?.returnVisits > 0) {
      risks.recommendations.push({
        type: 'churn-risk',
        action: 'send-re-engagement-email',
        urgency: 'high',
      })
    }

    return risks
  },

  /**
   * Predict next conversion action with high confidence
   */
  predictNextAction(behaviorData, userIntent) {
    const actionMap = {
      exploring: {
        action: 'view-case-studies',
        cta: 'See Real Results',
        channel: 'content',
        timeframe: 'within-5min',
        confidence: 0.4,
      },
      interested: {
        action: 'request-consultation',
        cta: 'Book a Demo',
        channel: 'contact',
        timeframe: 'within-15min',
        confidence: 0.6,
      },
      'ready-to-convert': {
        action: 'initiate-purchase',
        cta: 'Start Free Trial',
        channel: 'direct',
        timeframe: 'within-2min',
        confidence: 0.8,
      },
      converting: {
        action: 'complete-purchase',
        cta: 'Complete Purchase',
        channel: 'direct',
        timeframe: 'immediate',
        confidence: 0.95,
      },
    }

    const prediction = actionMap[userIntent] || actionMap.exploring

    // Boost confidence based on behavioral signals
    let confidenceBoost = 0
    if (behaviorData?.ctaInteractions?.length > 2) confidenceBoost += 0.1
    if (behaviorData?.sessionDuration > 30000) confidenceBoost += 0.1
    if (behaviorData?.conversionActions?.length > 0) confidenceBoost += 0.15

    return {
      ...prediction,
      confidence: Math.min(1, prediction.confidence + confidenceBoost),
    }
  },

  /**
   * Generate conversion funnel analysis
   */
  analyzeFunnel(pageViewData) {
    if (!pageViewData || pageViewData.length === 0) {
      return null
    }

    const funnel = {
      landingViews: 0,
      featureViews: 0,
      pricingViews: 0,
      ctaClicks: 0,
      conversions: 0,
    }

    // This would aggregate from multiple sessions
    // Simplified for demonstration
    pageViewData.forEach((view) => {
      if (view.section === 'landing') funnel.landingViews++
      if (view.section === 'features') funnel.featureViews++
      if (view.section === 'pricing') funnel.pricingViews++
      if (view.type === 'cta-click') funnel.ctaClicks++
      if (view.type === 'conversion') funnel.conversions++
    })

    // Calculate drop-off rates
    const dropoffs = {
      landingToFeatures: (
        ((funnel.landingViews - funnel.featureViews) / funnel.landingViews) *
        100
      ).toFixed(1),
      featuresToPricing: (
        ((funnel.featureViews - funnel.pricingViews) / funnel.featureViews) *
        100
      ).toFixed(1),
      pricingToCTA: (
        ((funnel.pricingViews - funnel.ctaClicks) / funnel.pricingViews) *
        100
      ).toFixed(1),
      ctaToConversion: (
        ((funnel.ctaClicks - funnel.conversions) / funnel.ctaClicks) *
        100
      ).toFixed(1),
    }

    return {
      funnel,
      dropoffs,
      conversionRate: (
        (funnel.conversions / funnel.landingViews) *
        100
      ).toFixed(2),
    }
  },

  /**
   * Compare user to ideal conversion profile
   */
  compareToIdealProfile(behaviorData, industryBenchmarks) {
    if (!industryBenchmarks) {
      // Use default SaaS benchmarks
      industryBenchmarks = {
        avgTimeOnPage: 45000,
        avgScrollDepth: 65,
        avgCTAInteractions: 2,
        conversionRate: 0.025,
      }
    }

    const userMetrics = {
      timeOnPage: behaviorData?.sessionDuration || 0,
      scrollDepth: calculateScrollDepth(behaviorData),
      ctaInteractions: behaviorData?.ctaInteractions?.length || 0,
      conversionRate: behaviorData?.conversionActions?.length > 0 ? 1 : 0,
    }

    const comparison = {
      timeOnPage: {
        user: userMetrics.timeOnPage,
        benchmark: industryBenchmarks.avgTimeOnPage,
        percentDiff: (
          ((userMetrics.timeOnPage - industryBenchmarks.avgTimeOnPage) /
            industryBenchmarks.avgTimeOnPage) *
          100
        ).toFixed(1),
        status:
          userMetrics.timeOnPage > industryBenchmarks.avgTimeOnPage
            ? 'above'
            : 'below',
      },
      scrollDepth: {
        user: userMetrics.scrollDepth,
        benchmark: industryBenchmarks.avgScrollDepth,
        percentDiff: (
          ((userMetrics.scrollDepth - industryBenchmarks.avgScrollDepth) /
            industryBenchmarks.avgScrollDepth) *
          100
        ).toFixed(1),
        status:
          userMetrics.scrollDepth > industryBenchmarks.avgScrollDepth
            ? 'above'
            : 'below',
      },
      ctaInteractions: {
        user: userMetrics.ctaInteractions,
        benchmark: industryBenchmarks.avgCTAInteractions,
        status:
          userMetrics.ctaInteractions > industryBenchmarks.avgCTAInteractions
            ? 'high'
            : 'low',
      },
    }

    // Calculate profile match score
    let matchScore = 0
    if (comparison.timeOnPage.status === 'above') matchScore += 25
    if (comparison.scrollDepth.status === 'above') matchScore += 25
    if (comparison.ctaInteractions.status === 'high') matchScore += 25
    if (behaviorData?.conversionActions?.length > 0) matchScore += 25

    return {
      comparison,
      matchScore,
      recommendation:
        matchScore > 70
          ? 'High conversion probability'
          : 'Engage with personalized content',
    }
  },
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function calculateScrollDepth(behaviorData) {
  if (!behaviorData?.scrollPositions || behaviorData.scrollPositions.length === 0) {
    return 0
  }
  const maxScroll = Math.max(
    ...behaviorData.scrollPositions.map((p) => p.scrollPercentage)
  )
  return Math.min(100, maxScroll)
}

function calculateTimeScore(sessionDuration) {
  if (!sessionDuration) return 0
  const minutes = sessionDuration / 60000
  if (minutes > 5) return 1
  if (minutes > 2) return 0.8
  if (minutes > 1) return 0.5
  return 0.2
}

function calculateCTAEngagementScore(ctaInteractions) {
  if (!ctaInteractions) return 0
  if (ctaInteractions.length > 4) return 1
  if (ctaInteractions.length > 2) return 0.8
  if (ctaInteractions.length > 0) return 0.5
  return 0
}

function calculateMouseIntentScore(mousePatterns) {
  if (!mousePatterns || mousePatterns.length === 0) return 0
  const clickableCount = mousePatterns.filter((m) => m.isClickable).length
  return Math.min(1, clickableCount / 20)
}

function applySegmentAdjustment(score, userSegment) {
  const adjustments = {
    bouncer: 0.7,
    lurker: 0.8,
    skimmer: 0.85,
    reader: 0.95,
    converter: 1.2,
    'engaged-visitor': 1.1,
  }

  const multiplier = adjustments[userSegment] || 1
  return score * multiplier
}

function calculateBounceRisk(behaviorData, sessionDuration) {
  if (!sessionDuration || sessionDuration < 5000) return 1
  if (!behaviorData?.scrollPositions || behaviorData.scrollPositions.length === 0) {
    return 0.8
  }
  const maxScroll = Math.max(
    ...behaviorData.scrollPositions.map((p) => p.scrollPercentage)
  )
  if (maxScroll < 20) return 0.7
  return 0.2
}

function calculateChurnRisk(behaviorData) {
  if (!behaviorData?.conversionActions || behaviorData.conversionActions.length === 0) {
    return 0.5
  }
  return 0.1
}

function calculateAbandonmentRisk(behaviorData) {
  if (behaviorData?.exitSignals && behaviorData.exitSignals.length > 2) {
    return 0.9
  }
  if (!behaviorData?.ctaInteractions || behaviorData.ctaInteractions.length === 0) {
    return 0.6
  }
  return 0.1
}
