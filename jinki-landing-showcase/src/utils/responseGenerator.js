/**
 * ═══════════════════════════════════════════════════════════════
 * RESPONSE GENERATION SYSTEM
 * ═══════════════════════════════════════════════════════════════
 * Context-aware, sentiment-aware response generation
 */

import {
  INTENTS,
  ENTITIES,
} from './nlpPipeline'
import {
  searchFAQ,
  getIndustryInfo,
  getFeatureInfo,
  findRelatedContent,
  FAQ_DB,
  INDUSTRIES_DB,
  FEATURES_DB,
  PLATFORM_SPECS,
} from './knowledgeBase'

// ─────────────────────────────────────────────────────────────
// RESPONSE TEMPLATES
// ─────────────────────────────────────────────────────────────
const RESPONSE_TEMPLATES = {
  positive: {
    greeting: 'Wonderful! I\'m here to help you explore Jinki Intelligence.',
    confirmation: 'Excellent question! Let me clarify that for you.',
    follow_up: 'Great! Would you like to know more about any specific aspect?',
  },
  negative: {
    empathy: 'I understand your concern. Let me address that.',
    help: 'I\'m here to help resolve any issues. Can you tell me more?',
    follow_up: 'I appreciate your directness. Let me provide more details.',
  },
  neutral: {
    greeting: 'Hello! I\'m ready to help. What would you like to know?',
    confirmation: 'I see. Let me provide you with relevant information.',
    follow_up: 'Would you like more details on that?',
  },
}

// ─────────────────────────────────────────────────────────────
// INTENT-BASED RESPONSE GENERATORS
// ─────────────────────────────────────────────────────────────

const generateSearchResponse = (nlpResult) => {
  const { entities, sentiment, urgency } = nlpResult
  let response = ''

  const template = sentiment === 'positive'
    ? RESPONSE_TEMPLATES.positive.confirmation
    : sentiment === 'negative'
    ? RESPONSE_TEMPLATES.negative.help
    : RESPONSE_TEMPLATES.neutral.confirmation

  response += template + '\n\n'

  if (entities.length > 0) {
    const industryEntity = entities.find(e => e.type === ENTITIES.INDUSTRY)
    const featureEntity = entities.find(e => e.type === ENTITIES.FEATURE)

    if (industryEntity) {
      const industryInfo = getIndustryInfo(industryEntity.value)
      if (industryInfo) {
        response += `**${industryInfo.title}**\n`
        response += `${industryInfo.description}\n\n`
        response += `**Challenge:** ${industryInfo.problem}\n\n`
        response += `**Our Solution:** ${industryInfo.solution}\n\n`
      }
    }

    if (featureEntity) {
      const featureInfo = getFeatureInfo(featureEntity.value)
      if (featureInfo) {
        response += `**${featureInfo.name}**\n`
        response += `${featureInfo.description}\n\n`
        response += `Specifications: ${featureInfo.specs.join(' • ')}\n\n`
      }
    }
  } else {
    // Generic search response
    response += 'Here\'s what I found about Jinki Intelligence:\n\n'
    response += '• **Industries:** Data Centers, Electric Utilities, Agriculture, Oil & Gas\n'
    response += '• **Core Technology:** Thermal, LiDAR, Multispectral Imaging, Optical Gas Imaging\n'
    response += '• **Key Benefit:** Detect anomalies before catastrophic failure\n\n'
  }

  if (urgency) {
    response += '\nI notice this is urgent for you. Would you like to schedule a priority consultation?'
  } else {
    response += `\n**Want more details?** Try asking about specific industries, technologies, or pricing.`
  }

  return response
}

const generateNavigateResponse = (nlpResult) => {
  const { navigation, sentiment } = nlpResult

  if (navigation) {
    return {
      text: `I'm taking you to the ${navigation.section} section. You can also navigate directly to ${navigation.route}.`,
      action: 'navigate',
      target: navigation.route,
      sentiment_aware: sentiment === 'positive'
        ? '🎯 Perfect, let me show you exactly what you\'re looking for.'
        : sentiment === 'negative'
        ? 'Let me help you find what you need.'
        : 'Let me navigate you there.',
    }
  }

  return {
    text: 'I can help you navigate to:\n• Industries & Solutions\n• Platform & Technology\n• Advisory & Team\n• Pricing & Contact\n\nWhich section interests you?',
    action: 'show_menu',
  }
}

const generateProductInfoResponse = (nlpResult) => {
  const { entities, sentiment } = nlpResult
  let response = ''

  const template = sentiment === 'positive'
    ? 'Great question! Here\'s the detailed information:'
    : 'Here\'s comprehensive information about that:'

  response += template + '\n\n'

  if (entities.length === 0) {
    response += 'Here\'s an overview of the Jinki platform:\n\n'
    PLATFORM_SPECS.specs.forEach(spec => {
      response += `• **${spec.name}**: ${spec.value}\n`
    })
  } else {
    entities.forEach(entity => {
      if (entity.type === ENTITIES.FEATURE) {
        const featureInfo = getFeatureInfo(entity.value)
        if (featureInfo) {
          response += `**${featureInfo.name}**\n`
          response += `${featureInfo.description}\n\n`
          response += 'Specifications:\n'
          featureInfo.specs.forEach(spec => {
            response += `• ${spec}\n`
          })
          response += `\nBenefits: ${featureInfo.benefits}\n\n`
        }
      }
    })
  }

  response += '\nWould you like to know more about implementation or pricing?'
  return response
}

const generatePricingResponse = (nlpResult) => {
  const { sentiment, urgency } = nlpResult

  let response = ''

  if (sentiment === 'negative') {
    response = 'I understand pricing is an important consideration. Here\'s what you should know:\n\n'
  } else if (sentiment === 'positive') {
    response = 'Excellent! Let me break down our flexible pricing models:\n\n'
  } else {
    response = 'Here\'s information about Jinki pricing:\n\n'
  }

  response += '**Pricing Models:**\n'
  response += '• **Mission-based:** Pay per inspection flight\n'
  response += '• **Quarterly Retainers:** Ongoing monitoring programs\n'
  response += '• **Enterprise Contracts:** Custom solutions for large deployments\n\n'

  response += '**ROI Examples:**\n'
  response += '• **Data Centers:** Prevent $700K outages with 72-hour early warning\n'
  response += '• **Utilities:** 60% cost reduction vs. helicopter inspections\n'
  response += '• **Agriculture:** 150% proven ROI within first season\n\n'

  if (urgency) {
    response += '**Would you like a custom quote? I can connect you with our team immediately.**'
  } else {
    response += 'Each industry has different requirements. Ready to discuss your specific needs?'
  }

  return response
}

const generateContactResponse = (nlpResult) => {
  const { sentiment, urgency } = nlpResult
  let response = ''

  if (urgency) {
    response = 'I understand this is urgent. Here\'s the fastest way to reach us:\n\n'
    response += '📞 **Call Now:** +1 (555) 123-4567\n'
    response += '📧 **Email:** contact@jinki.io\n'
    response += '🗓️ **Schedule:** Available for priority consultation\n\n'
    response += 'Let me connect you with our team immediately.'
  } else {
    response = 'Great! Here are multiple ways to get in touch:\n\n'
    response += '📞 **Phone:** +1 (555) 123-4567\n'
    response += '📧 **Email:** contact@jinki.io\n'
    response += '🗓️ **Schedule Consultation:** Book a time that works for you\n\n'
    response += 'What would work best for you?'
  }

  return {
    text: response,
    action: 'show_contact_options',
    contact_data: {
      phone: '+1 (555) 123-4567',
      email: 'contact@jinki.io',
    },
  }
}

const generateFAQResponse = (nlpResult) => {
  const { originalInput, sentiment } = nlpResult
  const matches = searchFAQ(originalInput)

  if (matches.length === 0) {
    return {
      text: 'I couldn\'t find a direct answer to that question. Would you like to explore our knowledge base or contact our team directly?',
      action: 'escalate',
    }
  }

  let response = ''

  if (sentiment === 'positive') {
    response = `Great question! Here are the most relevant answers:\n\n`
  } else if (sentiment === 'negative') {
    response = `I understand your concern. Here\'s what I can clarify:\n\n`
  } else {
    response = `Here are answers to your question:\n\n`
  }

  matches.slice(0, 2).forEach((faq, index) => {
    response += `**Q: ${faq.question}**\n`
    response += `${faq.answer}\n\n`
  })

  if (matches.length > 2) {
    response += `I found ${matches.length} answers to your question. Would you like to see more?`
  } else {
    response += `Is there anything else you'd like to know?`
  }

  return response
}

const generateFilterResponse = (nlpResult) => {
  const { entities, originalInput, sentiment } = nlpResult
  let response = ''

  response += 'Let me filter the results for you.\n\n'

  if (entities.length === 0) {
    response += 'What criteria would you like to filter by?\n'
    response += '• By industry\n'
    response += '• By feature\n'
    response += '• By performance metric\n'
  } else {
    response += 'Filtering by: '
    response += entities.map(e => e.value).join(', ')
    response += '\n\n'

    if (entities.some(e => e.type === ENTITIES.INDUSTRY)) {
      const industry = entities.find(e => e.type === ENTITIES.INDUSTRY)
      const industryInfo = getIndustryInfo(industry.value)
      if (industryInfo) {
        response += `**${industryInfo.title}**\n`
        response += `Solution: ${industryInfo.solution}\n\n`
      }
    }
  }

  response += 'Would you like to refine these results further?'
  return response
}

const generateCompareResponse = (nlpResult) => {
  const { entities, originalInput, sentiment } = nlpResult
  let response = ''

  response += 'I can help with comparisons. Let me analyze that:\n\n'

  if (originalInput.toLowerCase().includes('vs') || originalInput.toLowerCase().includes('versus')) {
    const parts = originalInput.split(/vs|versus/i)
    if (parts.length === 2) {
      const item1 = parts[0].trim()
      const item2 = parts[1].trim()

      response += `**Comparing:** ${item1} vs ${item2}\n\n`

      const info1 = getIndustryInfo(item1) || getFeatureInfo(item1)
      const info2 = getIndustryInfo(item2) || getFeatureInfo(item2)

      if (info1 && info2) {
        response += `${info1.title || info1.name}:\n`
        response += `• ${info1.solution || info1.description}\n\n`
        response += `${info2.title || info2.name}:\n`
        response += `• ${info2.solution || info2.description}\n\n`
      }
    }
  } else {
    response += 'What would you like to compare? You can ask about:\n'
    response += '• Industries and their benefits\n'
    response += '• Different sensor technologies\n'
    response += '• Jinki vs competitors\n'
  }

  return response
}

// ─────────────────────────────────────────────────────────────
// GENERIC FALLBACK RESPONSE
// ─────────────────────────────────────────────────────────────
const generateGenericResponse = (nlpResult) => {
  const { sentiment } = nlpResult
  let response = ''

  if (sentiment === 'positive') {
    response = RESPONSE_TEMPLATES.positive.follow_up
  } else if (sentiment === 'negative') {
    response = RESPONSE_TEMPLATES.negative.follow_up
  } else {
    response = RESPONSE_TEMPLATES.neutral.follow_up
  }

  response += '\n\n'
  response += 'I can help you with:\n'
  response += '• **Learn** about our technology and industries\n'
  response += '• **Navigate** to specific sections\n'
  response += '• **Explore** pricing and ROI\n'
  response += '• **Schedule** a consultation\n'
  response += '• **Answer** your FAQs\n\n'
  response += 'What interests you most?'

  return response
}

// ─────────────────────────────────────────────────────────────
// CONTEXT CONTINUATION & CONVERSATION MEMORY
// ─────────────────────────────────────────────────────────────
export const enhanceResponseWithContext = (response, conversationHistory) => {
  if (conversationHistory.length === 0) return response

  const recentTopics = conversationHistory
    .slice(-3)
    .map(msg => msg.entities || [])
    .flat()

  if (recentTopics.length > 0) {
    const lastTopic = recentTopics[recentTopics.length - 1]
    return response + `\n\n**Related to your previous interest in ${lastTopic.value}:** ` +
      `Would you like to explore related solutions?`
  }

  return response
}

// ─────────────────────────────────────────────────────────────
// MAIN RESPONSE GENERATION FUNCTION
// ─────────────────────────────────────────────────────────────
export const generateResponse = (nlpResult, conversationHistory = []) => {
  const { intent, sentiment, urgency } = nlpResult
  let response = ''

  // Select response generator based on intent
  switch (intent) {
    case INTENTS.SEARCH:
      response = generateSearchResponse(nlpResult)
      break
    case INTENTS.NAVIGATE:
      return generateNavigateResponse(nlpResult)
    case INTENTS.PRODUCT_INFO:
      response = generateProductInfoResponse(nlpResult)
      break
    case INTENTS.PRICING:
      response = generatePricingResponse(nlpResult)
      break
    case INTENTS.CONTACT:
      return generateContactResponse(nlpResult)
    case INTENTS.FAQ:
      response = generateFAQResponse(nlpResult)
      break
    case INTENTS.FILTER:
      response = generateFilterResponse(nlpResult)
      break
    case INTENTS.COMPARE:
      response = generateCompareResponse(nlpResult)
      break
    case INTENTS.GENERIC:
    default:
      response = generateGenericResponse(nlpResult)
  }

  // Enhance with context
  if (conversationHistory.length > 0) {
    response = enhanceResponseWithContext(response, conversationHistory)
  }

  return {
    text: response,
    intent,
    sentiment,
    urgency,
    suggestedActions: generateSuggestedActions(nlpResult),
  }
}

// ─────────────────────────────────────────────────────────────
// SUGGESTED ACTIONS FOR FOLLOW-UP
// ─────────────────────────────────────────────────────────────
export const generateSuggestedActions = (nlpResult) => {
  const { intent, entities, sentiment } = nlpResult
  const actions = []

  if (intent === INTENTS.SEARCH && entities.length > 0) {
    actions.push({
      label: 'View Full Details',
      action: 'navigate',
      target: '#industries',
    })
  }

  if (intent === INTENTS.PRICING || sentiment === 'positive') {
    actions.push({
      label: 'Get Custom Quote',
      action: 'contact',
      target: 'sales',
    })
  }

  if (entities.some(e => e.type === ENTITIES.FEATURE)) {
    actions.push({
      label: 'See Specifications',
      action: 'navigate',
      target: '#platform',
    })
  }

  if (intent === INTENTS.FAQ) {
    actions.push({
      label: 'Browse All FAQs',
      action: 'show_menu',
      category: 'faq',
    })
  }

  // Always offer scheduling
  if (sentiment !== 'negative' || intent === INTENTS.CONTACT) {
    actions.push({
      label: 'Schedule Consultation',
      action: 'contact',
      target: 'schedule',
    })
  }

  return actions.slice(0, 3) // Return top 3 actions
}

export default {
  generateResponse,
  generateSuggestedActions,
  enhanceResponseWithContext,
}
