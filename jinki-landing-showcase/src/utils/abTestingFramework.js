/**
 * A/B TESTING FRAMEWORK
 * Structured approach to testing predictive interventions
 * - Variant assignment
 * - Hypothesis tracking
 * - Result aggregation
 * - Statistical significance calculation
 */

const AB_TEST_CONFIG = {
  LOCAL_STORAGE_KEY: 'jinki_ab_tests',
  SIGNIFICANCE_THRESHOLD: 0.95, // 95% confidence
  MIN_SAMPLE_SIZE: 50,
}

export const ABTestingFramework = {
  /**
   * Initialize a new A/B test
   */
  createTest(testId, config) {
    const test = {
      id: testId,
      name: config.name || testId,
      description: config.description || '',
      startDate: Date.now(),
      endDate: config.endDate || null,
      hypothesis: config.hypothesis || '',
      variants: config.variants || [],
      metrics: config.metrics || ['conversion', 'engagement'],
      results: {},
      isActive: true,
    }

    // Initialize results for each variant
    config.variants.forEach((variant) => {
      test.results[variant.id] = {
        variantName: variant.name,
        participants: 0,
        conversions: 0,
        conversionRate: 0,
        avgEngagementScore: 0,
        avgTimeOnPage: 0,
        exitRate: 0,
        revenuePerVisitor: 0,
        metrics: {},
      }
    })

    // Save to localStorage
    saveTestToStorage(test)
    return test
  },

  /**
   * Assign user to a test variant
   * Returns variant ID for consistent user experience
   */
  assignVariant(testId, userId) {
    const variantKey = `${testId}_${userId}`
    const stored = localStorage.getItem(variantKey)

    if (stored) {
      return stored
    }

    // Get test configuration
    const tests = getTestsFromStorage()
    const test = tests.find((t) => t.id === testId)

    if (!test || !test.isActive) {
      return test?.variants[0]?.id || 'control'
    }

    // Simple 50/50 split (or configurable)
    const variantIndex = Math.random() < 0.5 ? 0 : 1
    const assignedVariant =
      test.variants[variantIndex]?.id || test.variants[0]?.id

    // Store assignment for consistency
    localStorage.setItem(variantKey, assignedVariant)

    return assignedVariant
  },

  /**
   * Record a conversion event in the test
   */
  recordConversion(testId, variantId, conversionData) {
    const tests = getTestsFromStorage()
    const test = tests.find((t) => t.id === testId)

    if (!test) return false

    const result = test.results[variantId]
    if (!result) return false

    result.conversions++
    result.conversionRate = result.conversions / result.participants

    // Update revenue if provided
    if (conversionData?.revenue) {
      result.revenuePerVisitor = calculateAverageRevenue(
        result.revenuePerVisitor,
        result.participants,
        conversionData.revenue
      )
    }

    saveTestToStorage(test)
    return true
  },

  /**
   * Record participant engagement
   */
  recordEngagement(testId, variantId, engagementData) {
    const tests = getTestsFromStorage()
    const test = tests.find((t) => t.id === testId)

    if (!test) return false

    const result = test.results[variantId]
    if (!result) return false

    result.participants++

    // Update engagement metrics
    if (engagementData?.engagementScore) {
      result.avgEngagementScore =
        (result.avgEngagementScore * (result.participants - 1) +
          engagementData.engagementScore) /
        result.participants
    }

    if (engagementData?.timeOnPage) {
      result.avgTimeOnPage =
        (result.avgTimeOnPage * (result.participants - 1) +
          engagementData.timeOnPage) /
        result.participants
    }

    if (engagementData?.didExit !== undefined) {
      const exits = result.participants * result.exitRate
      const newExits = exits + (engagementData.didExit ? 1 : 0)
      result.exitRate = newExits / result.participants
    }

    saveTestToStorage(test)
    return true
  },

  /**
   * Calculate statistical significance
   * Uses Chi-square test for conversion rates
   */
  calculateSignificance(testId) {
    const tests = getTestsFromStorage()
    const test = tests.find((t) => t.id === testId)

    if (!test || Object.keys(test.results).length < 2) {
      return null
    }

    const variants = Object.entries(test.results)
    const [variantA, variantB] = variants

    if (
      variantA[1].participants < AB_TEST_CONFIG.MIN_SAMPLE_SIZE ||
      variantB[1].participants < AB_TEST_CONFIG.MIN_SAMPLE_SIZE
    ) {
      return {
        isSignificant: false,
        confidence: 0,
        message: 'Insufficient sample size',
        minSampleNeeded:
          Math.max(
            AB_TEST_CONFIG.MIN_SAMPLE_SIZE - variantA[1].participants,
            AB_TEST_CONFIG.MIN_SAMPLE_SIZE - variantB[1].participants
          ) + 1,
      }
    }

    // Chi-square calculation
    const p1 = variantA[1].conversionRate
    const p2 = variantB[1].conversionRate
    const n1 = variantA[1].participants
    const n2 = variantB[1].participants

    const pooledP = (variantA[1].conversions + variantB[1].conversions) / (n1 + n2)
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2))

    if (se === 0) {
      return {
        isSignificant: false,
        confidence: 0,
        message: 'Unable to calculate significance',
      }
    }

    const zScore = (p1 - p2) / se
    const confidence = erf(Math.abs(zScore) / Math.sqrt(2))

    return {
      isSignificant: confidence >= AB_TEST_CONFIG.SIGNIFICANCE_THRESHOLD,
      confidence,
      zScore,
      winner: p1 > p2 ? variantA[0] : variantB[0],
      improvementMargin: Math.abs(p1 - p2) * 100,
      recommendation:
        confidence >= AB_TEST_CONFIG.SIGNIFICANCE_THRESHOLD
          ? `Variant ${p1 > p2 ? variantA[0] : variantB[0]} is likely winner`
          : 'Continue test for more data',
    }
  },

  /**
   * Get test results with detailed analysis
   */
  getTestResults(testId) {
    const tests = getTestsFromStorage()
    const test = tests.find((t) => t.id === testId)

    if (!test) return null

    const results = Object.entries(test.results).map(([variantId, data]) => ({
      variantId,
      ...data,
      performanceRating: ratePerformance(data),
    }))

    return {
      test,
      results,
      significance: this.calculateSignificance(testId),
      summary: generateTestSummary(test, results),
    }
  },

  /**
   * End a test and archive results
   */
  concludeTest(testId) {
    const tests = getTestsFromStorage()
    const test = tests.find((t) => t.id === testId)

    if (!test) return false

    test.isActive = false
    test.endDate = Date.now()

    saveTestToStorage(test)
    return true
  },

  /**
   * Get all active tests
   */
  getActiveTests() {
    const tests = getTestsFromStorage()
    return tests.filter((t) => t.isActive)
  },

  /**
   * Get recommendations based on all test results
   */
  getOptimizationRecommendations() {
    const tests = getTestsFromStorage()
    const recommendations = []

    tests.forEach((test) => {
      if (!test.isActive) return

      const significance = this.calculateSignificance(test.id)
      if (significance?.winner) {
        recommendations.push({
          testId: test.id,
          testName: test.name,
          recommendation: `Implement ${significance.winner}`,
          confidence: significance.confidence,
          priority: significance.confidence > 0.99 ? 'critical' : 'high',
          expectedImprovement: significance.improvementMargin,
        })
      }
    })

    return recommendations.sort((a, b) => b.confidence - a.confidence)
  },
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function saveTestToStorage(test) {
  try {
    const tests = getTestsFromStorage()
    const index = tests.findIndex((t) => t.id === test.id)

    if (index >= 0) {
      tests[index] = test
    } else {
      tests.push(test)
    }

    localStorage.setItem(AB_TEST_CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(tests))
    return true
  } catch (e) {
    console.warn('Error saving test to storage:', e)
    return false
  }
}

function getTestsFromStorage() {
  try {
    const stored = localStorage.getItem(AB_TEST_CONFIG.LOCAL_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.warn('Error reading tests from storage:', e)
    return []
  }
}

function calculateAverageRevenue(currentAvg, count, newValue) {
  return (currentAvg * count + newValue) / (count + 1)
}

// Error function approximation for normal distribution
function erf(x) {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x)
  const t = 1.0 / (1.0 + p * absX)
  const y =
    1.0 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX))

  return sign * y
}

function ratePerformance(data) {
  let score = 0

  if (data.conversionRate > 0.1) score += 40
  else if (data.conversionRate > 0.05) score += 25
  else score += 10

  if (data.avgEngagementScore > 70) score += 30
  else if (data.avgEngagementScore > 50) score += 20
  else score += 10

  if (data.exitRate < 0.2) score += 30
  else if (data.exitRate < 0.4) score += 15
  else score += 5

  return Math.min(100, score)
}

function generateTestSummary(test, results) {
  const bestVariant = results.reduce((best, current) =>
    current.conversionRate > best.conversionRate ? current : best
  )

  return {
    testName: test.name,
    duration: test.endDate ? test.endDate - test.startDate : Date.now() - test.startDate,
    totalParticipants: results.reduce((sum, r) => sum + r.participants, 0),
    overallConversionRate:
      results.reduce((sum, r) => sum + r.conversions, 0) /
      results.reduce((sum, r) => sum + r.participants, 0),
    bestVariant: bestVariant.variantName,
    bestConversionRate: bestVariant.conversionRate,
  }
}
