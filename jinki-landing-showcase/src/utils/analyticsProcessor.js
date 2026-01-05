/**
 * ANALYTICS PROCESSOR
 * Real-time processing of behavioral analytics
 * - Section visibility tracking
 * - Engagement scoring
 * - Heat map generation
 * - Content performance analysis
 */

export const AnalyticsProcessor = {
  /**
   * Track time spent in each section using Intersection Observer
   */
  createSectionTimeTracker(sectionElements, callback) {
    const sectionTimings = {}

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.id || entry.target.dataset.section
          const now = Date.now()

          if (entry.isIntersecting) {
            // Section entered viewport
            if (!sectionTimings[sectionId]) {
              sectionTimings[sectionId] = {
                enteredAt: now,
                exitedAt: null,
                totalTime: 0,
                visits: 0,
              }
            }
            sectionTimings[sectionId].enteredAt = now
          } else {
            // Section exited viewport
            if (sectionTimings[sectionId]?.enteredAt) {
              const timeSpent = now - sectionTimings[sectionId].enteredAt
              sectionTimings[sectionId].totalTime += timeSpent
              sectionTimings[sectionId].visits += 1
              sectionTimings[sectionId].exitedAt = now

              // Trigger callback
              if (callback) {
                callback({
                  sectionId,
                  timeSpent,
                  totalTime: sectionTimings[sectionId].totalTime,
                  visits: sectionTimings[sectionId].visits,
                  engagement: calculateEngagementLevel(timeSpent),
                })
              }
            }
          }
        })
      },
      {
        threshold: 0.5, // 50% of section must be visible
        rootMargin: '0px',
      }
    )

    // Observe all section elements
    sectionElements.forEach((el) => {
      if (el) observer.observe(el)
    })

    return {
      observer,
      getTimings: () => sectionTimings,
      disconnect: () => observer.disconnect(),
    }
  },

  /**
   * Calculate engagement metrics for a section
   */
  calculateSectionEngagement(sectionTimings, sectionId) {
    if (!sectionTimings[sectionId]) {
      return { score: 0, level: 'unknown', metrics: {} }
    }

    const { totalTime, visits } = sectionTimings[sectionId]
    const avgTimePerVisit = visits > 0 ? totalTime / visits : 0

    const metrics = {
      totalTime,
      visits,
      avgTimePerVisit,
      bounceRate: visits === 1 ? 1 : Math.max(0, 1 - visits / 3),
      repeatVisitRate: visits > 1 ? visits / 10 : 0,
    }

    // Score calculation (0-100)
    let score = 0
    score += Math.min(50, avgTimePerVisit / 100) // Max 50 points for time
    score += Math.min(30, visits * 10) // Max 30 points for repeat visits
    score += Math.min(20, metrics.repeatVisitRate * 100) // Max 20 points for return rate

    const level =
      score > 70 ? 'high' : score > 40 ? 'medium' : score > 0 ? 'low' : 'none'

    return {
      score: Math.round(score),
      level,
      metrics,
    }
  },

  /**
   * Generate heat map data for user interactions
   */
  generateInteractionHeatmap(mousePatterns, viewportHeight, viewportWidth) {
    if (!mousePatterns || mousePatterns.length === 0) {
      return {
        grid: [],
        hotspots: [],
      }
    }

    // Create grid (10x10)
    const gridSize = 10
    const cellWidth = viewportWidth / gridSize
    const cellHeight = viewportHeight / gridSize
    const grid = Array(gridSize)
      .fill(0)
      .map(() => Array(gridSize).fill(0))

    // Count interactions per cell
    mousePatterns.forEach((pattern) => {
      const cellX = Math.floor(pattern.x / cellWidth)
      const cellY = Math.floor(pattern.y / cellHeight)

      if (cellX >= 0 && cellX < gridSize && cellY >= 0 && cellY < gridSize) {
        grid[cellY][cellX]++
      }
    })

    // Find hotspots (cells with high interaction)
    const hotspots = []
    const maxInteractions = Math.max(...grid.flat())
    const hotspotThreshold = maxInteractions * 0.5

    grid.forEach((row, y) => {
      row.forEach((count, x) => {
        if (count > hotspotThreshold) {
          hotspots.push({
            x: x * cellWidth + cellWidth / 2,
            y: y * cellHeight + cellHeight / 2,
            intensity: count / maxInteractions,
            interactionCount: count,
          })
        }
      })
    })

    return {
      grid,
      hotspots,
      maxInteractions,
      intensity: hotspots.length > 0 ? 'high' : 'low',
    }
  },

  /**
   * Analyze scroll patterns to identify content consumption style
   */
  analyzeScrollPattern(scrollData) {
    if (!scrollData || scrollData.length < 5) {
      return {
        style: 'unknown',
        metrics: {},
      }
    }

    const velocities = []
    const accelerations = []

    for (let i = 1; i < scrollData.length; i++) {
      const timeDiff = scrollData[i].timestamp - scrollData[i - 1].timestamp
      const distDiff = scrollData[i].scrollY - scrollData[i - 1].scrollY

      const velocity = timeDiff > 0 ? distDiff / timeDiff : 0
      velocities.push(Math.abs(velocity))

      if (i > 1) {
        const prevVelocity = Math.abs(
          (scrollData[i - 1].scrollY - scrollData[i - 2].scrollY) /
            (scrollData[i - 1].timestamp - scrollData[i - 2].timestamp)
        )
        const acceleration = velocity - prevVelocity
        accelerations.push(acceleration)
      }
    }

    const avgVelocity =
      velocities.reduce((a, b) => a + b, 0) / velocities.length
    const avgAcceleration =
      accelerations.reduce((a, b) => a + b, 0) / accelerations.length || 0
    const maxVelocity = Math.max(...velocities)
    const scrollStops = velocities.filter((v) => v === 0).length

    let style = 'unknown'
    if (avgVelocity > 5 && scrollStops < 3) {
      style = 'skimmer'
    } else if (avgVelocity < 1 && scrollStops > 5) {
      style = 'reader'
    } else if (maxVelocity > 10 && avgVelocity < 2) {
      style = 'jumper'
    } else {
      style = 'balanced'
    }

    return {
      style,
      metrics: {
        avgVelocity: Math.round(avgVelocity * 100) / 100,
        maxVelocity: Math.round(maxVelocity * 100) / 100,
        avgAcceleration: Math.round(avgAcceleration * 100) / 100,
        scrollStops,
        totalScrollEvents: scrollData.length,
      },
    }
  },

  /**
   * Calculate content performance score
   */
  calculateContentPerformance(sectionEngagement, conversionData) {
    if (!sectionEngagement || !conversionData) {
      return { score: 0, recommendation: 'insufficient data' }
    }

    let score = 0
    const issues = []

    // Check engagement
    if (sectionEngagement.score < 30) {
      issues.push('low-engagement')
      score += 20
    } else if (sectionEngagement.score < 60) {
      issues.push('medium-engagement')
      score += 50
    } else {
      score += 80
    }

    // Check conversion contribution
    if (conversionData.conversionRate > 0.1) {
      score += 20
    } else if (conversionData.conversionRate > 0.05) {
      score += 10
    }

    // Calculate recommendation
    let recommendation = 'performing-well'
    if (issues.length > 0) {
      if (issues.includes('low-engagement')) {
        recommendation = 'needs-improvement'
      }
    }

    return {
      score: Math.min(100, score),
      issues,
      recommendation,
      priority: calculatePriority(score, issues),
    }
  },

  /**
   * Session quality scoring
   */
  scoreSessionQuality(behaviorData) {
    if (!behaviorData) return { score: 0, grade: 'F' }

    let score = 0

    // Depth score (0-30)
    const maxScroll = behaviorData.scrollPositions
      ? Math.max(...behaviorData.scrollPositions.map((p) => p.scrollPercentage))
      : 0
    score += Math.min(30, (maxScroll / 100) * 30)

    // Duration score (0-25)
    const durationMinutes = (behaviorData.sessionDuration || 0) / 60000
    score += Math.min(25, durationMinutes * 10)

    // Interaction score (0-25)
    const interactions = (behaviorData.ctaInteractions?.length || 0) * 5
    score += Math.min(25, interactions)

    // Conversion score (0-20)
    if (behaviorData.conversionActions?.length > 0) {
      score += 20
    }

    const grade =
      score >= 90
        ? 'A'
        : score >= 80
          ? 'B'
          : score >= 70
            ? 'C'
            : score >= 60
              ? 'D'
              : 'F'

    return {
      score: Math.round(score),
      grade,
      details: {
        depthScore: Math.min(30, (maxScroll / 100) * 30),
        durationScore: Math.min(25, durationMinutes * 10),
        interactionScore: Math.min(25, interactions),
        conversionScore: behaviorData.conversionActions?.length > 0 ? 20 : 0,
      },
    }
  },
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function calculateEngagementLevel(timeSpent) {
  if (timeSpent < 5000) return 'low'
  if (timeSpent < 15000) return 'medium'
  if (timeSpent < 30000) return 'high'
  return 'very-high'
}

function calculatePriority(score, issues) {
  if (score >= 70 && issues.length === 0) {
    return 'low'
  } else if (score >= 50) {
    return 'medium'
  } else {
    return 'high'
  }
}
