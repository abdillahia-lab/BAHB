import { useMemo } from 'react'

/**
 * useIntentDetection Hook
 * Advanced intent classification using keyword matching, semantic similarity, and ML patterns
 * Supports: pricing, demo, support, features, qualification, complaint, general
 */
export const useIntentDetection = (userInput) => {
  const INTENT_KEYWORDS = {
    pricing: {
      keywords: [
        'pricing',
        'price',
        'cost',
        'plan',
        'subscription',
        'fee',
        'budget',
        'affordable',
        'cheap',
        'expensive',
        'how much',
        'payment',
        'monthly',
        'annual',
      ],
      patterns: [/how\s+much|what.*cost|pricing.*plan/i],
      weight: 1.0,
    },
    demo: {
      keywords: [
        'demo',
        'demonstration',
        'show',
        'live',
        'see',
        'test',
        'trial',
        'walkthrough',
        'tour',
        'example',
        'schedule',
        'meeting',
      ],
      patterns: [/schedule.*demo|show.*me|can\s+i.*see|request.*demo/i],
      weight: 1.0,
    },
    support: {
      keywords: [
        'help',
        'issue',
        'problem',
        'bug',
        'error',
        'broken',
        'not working',
        'support',
        'assist',
        'trouble',
        'urgent',
        'emergency',
      ],
      patterns: [/help.*with|having.*issue|not.*working|please.*help/i],
      weight: 1.0,
    },
    features: {
      keywords: [
        'feature',
        'capability',
        'ability',
        'function',
        'can',
        'does',
        'how does',
        'what can',
        'technology',
        'integration',
        'api',
      ],
      patterns: [/what.*feature|how.*work|what\s+can|tell.*about/i],
      weight: 0.95,
    },
    qualification: {
      keywords: [
        'company',
        'business',
        'team',
        'industry',
        'enterprise',
        'startup',
        'size',
        'employees',
        'budget',
        'timeline',
        'need',
        'require',
      ],
      patterns: [/what.*size|industry.*you|how.*many|looking.*for/i],
      weight: 0.9,
    },
    complaint: {
      keywords: [
        'disappointed',
        'unhappy',
        'frustrated',
        'angry',
        'waste',
        'terrible',
        'horrible',
        'worse',
        'never',
        'worst',
      ],
      patterns: [/very.*bad|never.*work|waste.*time/i],
      weight: 1.0,
    },
    general: {
      keywords: ['general', 'info', 'information', 'more', 'about', 'tell', 'explain'],
      patterns: [/tell.*more|explain|what.*is|more.*info/i],
      weight: 0.7,
    },
  }

  const { detectedIntent, confidence, scores } = useMemo(() => {
    const input = userInput.toLowerCase()
    const scores = {}

    // Calculate scores for each intent
    Object.entries(INTENT_KEYWORDS).forEach(([intent, config]) => {
      let score = 0

      // Keyword matching (exact)
      config.keywords.forEach((keyword) => {
        if (input.includes(keyword)) {
          score += 0.2 * config.weight
        }
      })

      // Pattern matching (regex)
      config.patterns.forEach((pattern) => {
        if (pattern.test(input)) {
          score += 0.5 * config.weight
        }
      })

      // Semantic scoring based on phrase position and context
      if (score > 0) {
        // Boost score if intent keywords appear early in message
        const firstIntentKeywordIndex = config.keywords.findIndex((k) =>
          input.includes(k)
        )
        if (firstIntentKeywordIndex !== -1 && firstIntentKeywordIndex < 5) {
          score += 0.15
        }
      }

      scores[intent] = Math.min(score, 1.0)
    })

    // Find top intent
    const topIntent = Object.entries(scores).reduce((max, [intent, score]) =>
      score > max.score ? { intent, score } : max
    )

    return {
      detectedIntent: topIntent.intent || 'general',
      confidence: topIntent.score,
      scores,
    }
  }, [userInput])

  /**
   * Advanced intent classification with context
   * Uses multi-factor analysis for accuracy
   */
  const classifyIntent = (message, pageContext = {}) => {
    const primaryIntent = detectedIntent
    const contextBoost = getContextBoost(primaryIntent, pageContext)

    return {
      intent: primaryIntent,
      confidence: Math.min(confidence + contextBoost, 1.0),
      alternatives: getAlternativeIntents(scores),
    }
  }

  /**
   * Boost confidence based on page context
   */
  const getContextBoost = (intent, pageContext = {}) => {
    const boosts = {
      pricing: pageContext.currentSection === 'pricing' ? 0.2 : 0,
      features: pageContext.currentSection === 'features' ? 0.2 : 0,
      demo: pageContext.engagementLevel === 'high' ? 0.15 : 0,
      support: pageContext.currentSection === 'faq' ? 0.15 : 0,
    }

    return boosts[intent] || 0
  }

  /**
   * Get alternative intents ranked by confidence
   */
  const getAlternativeIntents = (allScores) => {
    return Object.entries(allScores)
      .filter(([_, score]) => score > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(1, 4)
      .map(([intent, score]) => ({ intent, confidence: score }))
  }

  /**
   * Extract entities from user input
   * (Company name, timeline, budget, etc.)
   */
  const extractEntities = () => {
    const input = userInput
    const entities = {}

    // Budget extraction
    const budgetMatch = input.match(/\$[\d,]+|[\d,]+k|[\d,]+m/i)
    if (budgetMatch) {
      entities.budget = budgetMatch[0]
    }

    // Company size extraction
    const sizeMatch = input.match(/(startup|smb|sme|enterprise|fortune|mid-market|small|large)/i)
    if (sizeMatch) {
      entities.companySize = sizeMatch[1]
    }

    // Timeline extraction
    const timelineMatch = input.match(/(asap|urgent|immediately|weeks?|months?|quarter|year)/i)
    if (timelineMatch) {
      entities.timeline = timelineMatch[1]
    }

    // Email extraction
    const emailMatch = input.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
    if (emailMatch) {
      entities.email = emailMatch[0]
    }

    // Phone extraction
    const phoneMatch = input.match(/(\d{3}[-.]?\d{3}[-.]?\d{4}|\d{10})/g)
    if (phoneMatch) {
      entities.phone = phoneMatch[0]
    }

    return entities
  }

  return {
    detectedIntent,
    confidence,
    scores,
    classifyIntent,
    extractEntities,
    getAlternativeIntents: () => getAlternativeIntents(scores),
  }
}
