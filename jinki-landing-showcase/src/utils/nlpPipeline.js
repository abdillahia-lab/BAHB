/**
 * ═══════════════════════════════════════════════════════════════
 * NLP PROCESSING PIPELINE
 * ═══════════════════════════════════════════════════════════════
 * Multi-stage natural language understanding system
 * - Intent classification
 * - Entity extraction
 * - Query reformulation
 * - Context preservation
 */

// ─────────────────────────────────────────────────────────────
// INTENT DEFINITIONS
// ─────────────────────────────────────────────────────────────
export const INTENTS = {
  SEARCH: 'search',
  NAVIGATE: 'navigate',
  PRODUCT_INFO: 'product_info',
  PRICING: 'pricing',
  CONTACT: 'contact',
  FAQ: 'faq',
  FILTER: 'filter',
  COMPARE: 'compare',
  GENERIC: 'generic',
}

// ─────────────────────────────────────────────────────────────
// ENTITY TYPES
// ─────────────────────────────────────────────────────────────
export const ENTITIES = {
  INDUSTRY: 'industry',
  FEATURE: 'feature',
  METRIC: 'metric',
  PRODUCT: 'product',
  LOCATION: 'location',
  PRICE_RANGE: 'price_range',
  TIME: 'time',
}

// ─────────────────────────────────────────────────────────────
// TRAINING DATA - VOCABULARY BANKS
// ─────────────────────────────────────────────────────────────
const INDUSTRY_KEYWORDS = {
  'data center': { entity: 'data centers', category: 'industry' },
  'utilities': { entity: 'electric utilities', category: 'industry' },
  'agriculture': { entity: 'precision agriculture', category: 'industry' },
  'oil': { entity: 'oil & gas', category: 'industry' },
  'gas': { entity: 'oil & gas', category: 'industry' },
  'energy': { entity: 'electric utilities', category: 'industry' },
  'farm': { entity: 'precision agriculture', category: 'industry' },
  'crop': { entity: 'precision agriculture', category: 'industry' },
  'infrastructure': { entity: 'critical infrastructure', category: 'industry' },
}

const FEATURE_KEYWORDS = {
  'thermal': { entity: 'thermal imaging', category: 'feature' },
  'temperature': { entity: 'thermal imaging', category: 'feature' },
  'lidar': { entity: 'LiDAR', category: 'feature' },
  'ndvi': { entity: 'multispectral imaging', category: 'feature' },
  'multispectral': { entity: 'multispectral imaging', category: 'feature' },
  'imaging': { entity: 'imaging', category: 'feature' },
  'detection': { entity: 'detection', category: 'feature' },
  'monitoring': { entity: 'monitoring', category: 'feature' },
  'camera': { entity: 'camera', category: 'feature' },
}

const METRIC_KEYWORDS = {
  'cost': { entity: 'cost reduction', category: 'metric' },
  'accuracy': { entity: 'detection accuracy', category: 'metric' },
  'speed': { entity: 'detection speed', category: 'metric' },
  'coverage': { entity: 'coverage', category: 'metric' },
  'endurance': { entity: 'battery endurance', category: 'metric' },
  'range': { entity: 'transmission range', category: 'metric' },
}

const NAVIGATION_KEYWORDS = {
  'pricing': { route: '#contact', section: 'pricing' },
  'price': { route: '#contact', section: 'pricing' },
  'cost': { route: '#contact', section: 'pricing' },
  'industries': { route: '#industries', section: 'industries' },
  'solutions': { route: '#industries', section: 'solutions' },
  'platform': { route: '#platform', section: 'platform' },
  'technology': { route: '#platform', section: 'technology' },
  'advisory': { route: '#advisory', section: 'advisory' },
  'team': { route: '#advisory', section: 'team' },
  'contact': { route: '#contact', section: 'contact' },
  'about': { route: '#advisory', section: 'about' },
}

// ─────────────────────────────────────────────────────────────
// SENTIMENT ANALYSIS
// ─────────────────────────────────────────────────────────────
const SENTIMENT_WORDS = {
  positive: ['great', 'good', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'impressive', 'awesome', 'fantastic'],
  negative: ['bad', 'poor', 'terrible', 'awful', 'hate', 'disappointing', 'useless', 'broken', 'fail', 'problem'],
  urgent: ['need', 'urgent', 'asap', 'immediately', 'critical', 'emergency', 'quickly', 'fast', 'hurry'],
}

// ─────────────────────────────────────────────────────────────
// INTENT PATTERNS
// ─────────────────────────────────────────────────────────────
const INTENT_PATTERNS = {
  [INTENTS.SEARCH]: [
    /show me|find|search for|what about|tell me about|information on|details on/i,
  ],
  [INTENTS.NAVIGATE]: [
    /take me to|go to|show me|navigate to|where is|how to access/i,
  ],
  [INTENTS.PRODUCT_INFO]: [
    /how does|what is|explain|describe|about|capabilities|features|specifications/i,
  ],
  [INTENTS.PRICING]: [
    /price|cost|expense|rate|fee|payment|afford|budget/i,
  ],
  [INTENTS.CONTACT]: [
    /contact|call|email|reach|get in touch|schedule|book|appointment/i,
  ],
  [INTENTS.FILTER]: [
    /filter|only|just|that (is|are)|specific|particular|specific to|for/i,
  ],
  [INTENTS.COMPARE]: [
    /compare|vs|versus|difference|better|faster|more than|less than/i,
  ],
}

// ─────────────────────────────────────────────────────────────
// TOKENIZATION & PREPROCESSING
// ─────────────────────────────────────────────────────────────
export const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0)
}

export const stemWord = (word) => {
  // Simple Porter stemmer implementation
  const suffixes = [
    'tion', 'sion', 'ment', 'ness', 'able', 'ible', 'ful', 'less', 'ous',
    'ing', 'ed', 'er', 'est', 'ly', 's'
  ]

  let stem = word.toLowerCase()
  for (const suffix of suffixes) {
    if (stem.endsWith(suffix) && stem.length > suffix.length + 2) {
      stem = stem.slice(0, -suffix.length)
      break
    }
  }
  return stem
}

// ─────────────────────────────────────────────────────────────
// SENTIMENT DETECTION
// ─────────────────────────────────────────────────────────────
export const analyzeSentiment = (text) => {
  const words = tokenize(text)
  let sentiment = 'neutral'
  let urgency = false

  const positiveCount = words.filter(w =>
    SENTIMENT_WORDS.positive.some(pos => w.includes(pos))
  ).length

  const negativeCount = words.filter(w =>
    SENTIMENT_WORDS.negative.some(neg => w.includes(neg))
  ).length

  const urgentCount = words.filter(w =>
    SENTIMENT_WORDS.urgent.some(urg => w.includes(urg))
  ).length

  if (negativeCount > positiveCount) {
    sentiment = 'negative'
  } else if (positiveCount > negativeCount) {
    sentiment = 'positive'
  }

  if (urgentCount > 0) {
    urgency = true
  }

  return { sentiment, urgency }
}

// ─────────────────────────────────────────────────────────────
// ENTITY EXTRACTION
// ─────────────────────────────────────────────────────────────
export const extractEntities = (text) => {
  const tokens = tokenize(text)
  const entities = []
  const processed = new Set()

  // Extract industries
  for (const [keyword, data] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (text.toLowerCase().includes(keyword) && !processed.has('industry')) {
      entities.push({
        type: ENTITIES.INDUSTRY,
        value: data.entity,
        confidence: 0.9,
      })
      processed.add('industry')
    }
  }

  // Extract features
  for (const [keyword, data] of Object.entries(FEATURE_KEYWORDS)) {
    if (text.toLowerCase().includes(keyword)) {
      entities.push({
        type: ENTITIES.FEATURE,
        value: data.entity,
        confidence: 0.85,
      })
    }
  }

  // Extract metrics
  for (const [keyword, data] of Object.entries(METRIC_KEYWORDS)) {
    if (text.toLowerCase().includes(keyword)) {
      entities.push({
        type: ENTITIES.METRIC,
        value: data.entity,
        confidence: 0.8,
      })
    }
  }

  // Extract numbers (potential metrics)
  const numberMatches = text.match(/\d+[\d.]*%?|high|low|medium/gi)
  if (numberMatches) {
    entities.push({
      type: ENTITIES.METRIC,
      value: numberMatches[0],
      confidence: 0.7,
    })
  }

  // Remove duplicates
  return Array.from(new Map(entities.map(e => [e.value, e])).values())
}

// ─────────────────────────────────────────────────────────────
// INTENT CLASSIFICATION
// ─────────────────────────────────────────────────────────────
export const classifyIntent = (text) => {
  let bestIntent = INTENTS.GENERIC
  let maxScore = 0

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const score = 1.0
        if (score > maxScore) {
          maxScore = score
          bestIntent = intent
        }
      }
    }
  }

  // Additional heuristics
  if (maxScore === 0) {
    if (/[?]/.test(text)) bestIntent = INTENTS.FAQ
    if (text.split(' ').length < 3) bestIntent = INTENTS.SEARCH
  }

  return bestIntent
}

// ─────────────────────────────────────────────────────────────
// NAVIGATION EXTRACTION
// ─────────────────────────────────────────────────────────────
export const extractNavigation = (text) => {
  const lowerText = text.toLowerCase()

  for (const [keyword, navData] of Object.entries(NAVIGATION_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      return navData
    }
  }

  return null
}

// ─────────────────────────────────────────────────────────────
// QUERY REFORMULATION
// ─────────────────────────────────────────────────────────────
export const reformulateQuery = (originalQuery, intent, entities) => {
  let reformulated = originalQuery

  // Expand abbreviations
  reformulated = reformulated
    .replace(/lidar/gi, 'LiDAR 3D scanning')
    .replace(/ndvi/gi, 'multispectral imaging')
    .replace(/rtk/gi, 'real-time kinematic positioning')
    .replace(/ogi/gi, 'optical gas imaging')

  // Add implicit intent
  if (entities.length > 0 && intent === INTENTS.SEARCH) {
    const features = entities
      .filter(e => e.type === ENTITIES.FEATURE)
      .map(e => e.value)
      .join(' and ')
    if (features) {
      reformulated += ` specifically about ${features}`
    }
  }

  return reformulated
}

// ─────────────────────────────────────────────────────────────
// COMPLETE NLP PIPELINE
// ─────────────────────────────────────────────────────────────
export const processNLQuery = (userInput, conversationContext = {}) => {
  const tokens = tokenize(userInput)
  const intent = classifyIntent(userInput)
  const entities = extractEntities(userInput)
  const navigation = extractNavigation(userInput)
  const { sentiment, urgency } = analyzeSentiment(userInput)
  const reformulatedQuery = reformulateQuery(userInput, intent, entities)

  return {
    originalInput: userInput,
    tokens,
    intent,
    entities,
    navigation,
    sentiment,
    urgency,
    reformulatedQuery,
    confidence: Math.min(1, 0.5 + (entities.length * 0.1)),
    context: conversationContext,
  }
}

export default {
  processNLQuery,
  tokenize,
  stemWord,
  analyzeSentiment,
  extractEntities,
  classifyIntent,
  extractNavigation,
  reformulateQuery,
  INTENTS,
  ENTITIES,
}
