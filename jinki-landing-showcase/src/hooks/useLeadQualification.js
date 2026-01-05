import { useCallback, useState } from 'react'

/**
 * useLeadQualification Hook
 * Extracts and qualifies leads through conversation
 * Tracks BANT metrics: Budget, Authority, Need, Timeline
 * Plus additional business metrics for better segmentation
 */
export const useLeadQualification = () => {
  const [qualificationData, setQualificationData] = useState({
    // BANT Metrics
    budget: null,
    authority: null, // Title/role
    need: null, // Primary pain point
    timeline: null,

    // Extended Qualification
    companyName: null,
    companySize: null,
    industry: null,
    email: null,
    phone: null,
    website: null,

    // Engagement Metrics
    needType: null, // drone_inspection, cybersecurity, both
    primaryPain: null,
    currentSolution: null,
    evaluationStage: null, // awareness, consideration, decision

    // Scoring
    qualificationScore: 0, // 0-100
    leadGrade: 'unqualified', // hot, warm, cold, unqualified
    readyForHandoff: false,

    // Metadata
    firstInteractionTime: null,
    lastInteractionTime: null,
    messageCount: 0,
    intentSequence: [],
  })

  const QUALIFICATION_RULES = {
    hot: {
      minScore: 80,
      requirements: ['budget', 'timeline', 'authority'],
      description: 'Ready for immediate sales engagement',
    },
    warm: {
      minScore: 60,
      requirements: ['authority', 'need'],
      description: 'Strong prospect, needs nurturing',
    },
    cold: {
      minScore: 30,
      requirements: [],
      description: 'Needs education/awareness',
    },
  }

  const INDUSTRY_MAPPING = {
    energy: { name: 'Energy & Utilities', droneValue: 'high', securityValue: 'high' },
    manufacturing: { name: 'Manufacturing', droneValue: 'high', securityValue: 'medium' },
    infrastructure: { name: 'Infrastructure', droneValue: 'high', securityValue: 'high' },
    finance: { name: 'Financial Services', droneValue: 'low', securityValue: 'high' },
    healthcare: { name: 'Healthcare', droneValue: 'medium', securityValue: 'high' },
    retail: { name: 'Retail', droneValue: 'low', securityValue: 'medium' },
    other: { name: 'Other', droneValue: 'medium', securityValue: 'medium' },
  }

  /**
   * Update qualification data based on user messages
   */
  const updateQualification = useCallback((userMessage) => {
    if (!userMessage || userMessage.type !== 'user') return

    setQualificationData((prev) => {
      const updated = { ...prev }
      const input = userMessage.content.toLowerCase()

      // Extract entities from message
      const entities = extractEntities(userMessage.content)

      // Update BANT metrics
      if (entities.budget) updated.budget = entities.budget
      if (entities.title) updated.authority = entities.title
      if (entities.timeline) updated.timeline = entities.timeline
      if (entities.email) updated.email = entities.email
      if (entities.phone) updated.phone = entities.phone
      if (entities.companyName) updated.companyName = entities.companyName
      if (entities.industry) updated.industry = entities.industry

      // Detect primary need/pain point
      if (userMessage.intent === 'drone_inspection' || input.includes('drone')) {
        updated.needType = 'drone_inspection'
      } else if (userMessage.intent === 'cybersecurity' || input.includes('security')) {
        updated.needType = 'cybersecurity'
      } else if (userMessage.intent === 'features') {
        updated.needType = updated.needType || 'both'
      }

      // Detect evaluation stage
      if (input.includes('demo') || input.includes('try')) {
        updated.evaluationStage = 'decision'
      } else if (input.includes('learn') || input.includes('features')) {
        updated.evaluationStage = 'consideration'
      } else if (input.includes('tell') || input.includes('about')) {
        updated.evaluationStage = 'awareness'
      }

      // Update metadata
      if (!updated.firstInteractionTime) {
        updated.firstInteractionTime = new Date().toISOString()
      }
      updated.lastInteractionTime = new Date().toISOString()
      updated.messageCount = updated.messageCount + 1
      updated.intentSequence = [
        ...updated.intentSequence,
        userMessage.intent,
      ].slice(-10)

      // Recalculate qualification score
      updated.qualificationScore = calculateQualificationScore(updated)
      updated.leadGrade = determineLeadGrade(
        updated.qualificationScore,
        updated
      )
      updated.readyForHandoff = shouldHandoffToSales(updated)

      return updated
    })
  }, [])

  /**
   * Calculate lead qualification score (0-100)
   */
  const calculateQualificationScore = (data) => {
    let score = 0

    // BANT scoring (40 points total)
    if (data.budget) score += 10
    if (data.authority) score += 10
    if (data.need || data.needType) score += 10
    if (data.timeline) score += 10

    // Engagement scoring (30 points)
    const messageBonus = Math.min(data.messageCount * 2, 10)
    score += messageBonus

    if (data.evaluationStage === 'decision') score += 15
    else if (data.evaluationStage === 'consideration') score += 8
    else if (data.evaluationStage === 'awareness') score += 3

    // Contact info scoring (20 points)
    if (data.email) score += 10
    if (data.phone) score += 10

    // Industry fit scoring (10 points)
    const industryValue = INDUSTRY_MAPPING[data.industry]
    if (industryValue) {
      const droneScore =
        industryValue.droneValue === 'high'
          ? 5
          : industryValue.droneValue === 'medium'
            ? 2
            : 0
      const securityScore =
        industryValue.securityValue === 'high'
          ? 5
          : industryValue.securityValue === 'medium'
            ? 2
            : 0
      score += Math.min(droneScore + securityScore, 10)
    }

    return Math.min(score, 100)
  }

  /**
   * Determine lead grade based on score and qualification metrics
   */
  const determineLeadGrade = (score, data) => {
    const hotRequirements = QUALIFICATION_RULES.hot.requirements.filter(
      (req) => data[req]
    ).length
    const warmRequirements = QUALIFICATION_RULES.warm.requirements.filter(
      (req) => data[req]
    ).length

    if (
      score >= QUALIFICATION_RULES.hot.minScore &&
      hotRequirements === QUALIFICATION_RULES.hot.requirements.length
    ) {
      return 'hot'
    }

    if (
      score >= QUALIFICATION_RULES.warm.minScore &&
      warmRequirements >= QUALIFICATION_RULES.warm.requirements.length
    ) {
      return 'warm'
    }

    if (score >= QUALIFICATION_RULES.cold.minScore) {
      return 'cold'
    }

    return 'unqualified'
  }

  /**
   * Determine if lead should be handed off to sales
   */
  const shouldHandoffToSales = (data) => {
    const isHot = data.leadGrade === 'hot'
    const hasEmail = !!data.email
    const hasPhone = !!data.phone
    const inDecision = data.evaluationStage === 'decision'

    return (
      isHot ||
      (data.leadGrade === 'warm' && (hasEmail || hasPhone) && inDecision)
    )
  }

  /**
   * Extract structured entities from text
   */
  const extractEntities = (text) => {
    const entities = {}

    // Email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
    if (emailMatch) entities.email = emailMatch[0]

    // Phone
    const phoneMatch = text.match(/(\d{3}[-.]?\d{3}[-.]?\d{4}|\d{10})/g)
    if (phoneMatch) entities.phone = phoneMatch[0]

    // Budget
    const budgetMatch = text.match(/\$[\d,]+|[\d,]+k|[\d,]+m/i)
    if (budgetMatch) entities.budget = budgetMatch[0]

    // Company name (after "at" or "work at")
    const companyMatch = text.match(/(?:at|work at|from|company)\s+([A-Z][a-zA-Z0-9\s&]*)/i)
    if (companyMatch) entities.companyName = companyMatch[1]

    // Job title
    const titleMatch = text.match(/(ceo|cto|cfo|vp|director|manager|engineer|architect|analyst)(?:\s+of)?/i)
    if (titleMatch) entities.title = titleMatch[1]

    // Timeline
    const timelineMatch = text.match(/(asap|urgent|immediately|this week|next week|in \d+ weeks?|in \d+ months?|q[1-4]|early|mid|late|2025|2026)/i)
    if (timelineMatch) entities.timeline = timelineMatch[1]

    // Industry
    const industryMatch = text.match(
      /(energy|manufacturing|infrastructure|finance|financial|healthcare|medical|retail|ecommerce)/i
    )
    if (industryMatch) {
      const industry = industryMatch[1].toLowerCase()
      if (industry.includes('finance') || industry.includes('bank'))
        entities.industry = 'finance'
      else if (industry.includes('health') || industry.includes('medical'))
        entities.industry = 'healthcare'
      else entities.industry = industry
    }

    return entities
  }

  /**
   * Get lead summary for handoff to sales
   */
  const getLeadSummary = useCallback(() => {
    return {
      grade: qualificationData.leadGrade,
      score: qualificationData.qualificationScore,
      contact: {
        email: qualificationData.email,
        phone: qualificationData.phone,
        name: qualificationData.authority,
      },
      company: {
        name: qualificationData.companyName,
        size: qualificationData.companySize,
        industry: qualificationData.industry,
      },
      opportunity: {
        type: qualificationData.needType,
        stage: qualificationData.evaluationStage,
        timeline: qualificationData.timeline,
        budget: qualificationData.budget,
      },
      engagement: {
        totalMessages: qualificationData.messageCount,
        firstInteraction: qualificationData.firstInteractionTime,
        lastInteraction: qualificationData.lastInteractionTime,
        primaryIntents: getMostFrequentIntents(qualificationData.intentSequence, 3),
      },
    }
  }, [qualificationData])

  /**
   * Generate qualification questions
   */
  const getNextQualificationQuestion = useCallback(() => {
    const questionsMap = {
      budget: {
        question: "What's your allocated budget for this initiative?",
        followUp: 'Do you have budget approved for this year?',
      },
      authority: {
        question: 'What is your role in the decision-making process?',
        followUp: 'Who else is involved in this evaluation?',
      },
      timeline: {
        question: 'When are you looking to implement this?',
        followUp: 'Do you have a specific go-live date in mind?',
      },
      need: {
        question: 'What is your primary business challenge?',
        followUp: "What's been the impact of this challenge?",
      },
    }

    // Ask about missing BANT elements
    for (const [key, value] of Object.entries(questionsMap)) {
      if (!qualificationData[key]) {
        return value.question
      }
    }

    // If BANT complete, ask about implementation
    if (qualificationData.evaluationStage !== 'decision') {
      return 'What would moving forward look like for your team?'
    }

    return null
  }, [qualificationData])

  /**
   * Helper: Get most frequent intents
   */
  const getMostFrequentIntents = (sequence, limit) => {
    const counts = {}
    sequence.forEach((intent) => {
      counts[intent] = (counts[intent] || 0) + 1
    })

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([intent, count]) => ({ intent, count }))
  }

  return {
    qualificationData,
    updateQualification,
    getLeadSummary,
    getNextQualificationQuestion,
    extractEntities,
    shouldHandoffToSales: () => qualificationData.readyForHandoff,
  }
}
