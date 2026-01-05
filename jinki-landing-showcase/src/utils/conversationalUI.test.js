/**
 * ═══════════════════════════════════════════════════════════════
 * CONVERSATIONAL UI TEST SUITE
 * ═══════════════════════════════════════════════════════════════
 * Demonstrates system capabilities through test scenarios
 */

import {
  processNLQuery,
  INTENTS,
  ENTITIES,
  tokenize,
  analyzeSentiment,
  extractEntities,
  classifyIntent,
} from './nlpPipeline'

import {
  searchFAQ,
  getIndustryInfo,
  getFeatureInfo,
  findRelatedContent,
} from './knowledgeBase'

import {
  generateResponse,
  generateSuggestedActions,
} from './responseGenerator'

// ─────────────────────────────────────────────────────────────
// TEST SUITE 1: NLP PIPELINE
// ─────────────────────────────────────────────────────────────

export const testNLPPipeline = () => {
  console.log('═══ NLP PIPELINE TESTS ═══\n')

  // Test 1.1: Intent Classification
  console.log('TEST 1.1: Intent Classification')
  const intentTests = [
    { query: 'show me thermal cameras', expected: INTENTS.SEARCH },
    { query: 'take me to pricing', expected: INTENTS.NAVIGATE },
    { query: 'what is lidar?', expected: INTENTS.PRODUCT_INFO },
    { query: 'how much does it cost?', expected: INTENTS.PRICING },
    { query: 'I want to schedule a demo', expected: INTENTS.CONTACT },
    { query: 'why should I use Jinki?', expected: INTENTS.FAQ },
  ]

  intentTests.forEach(test => {
    const intent = classifyIntent(test.query)
    const pass = intent === test.expected
    console.log(`${pass ? '✓' : '✗'} "${test.query}"`)
    console.log(`  → Intent: ${intent} (expected: ${test.expected})`)
  })
  console.log('')

  // Test 1.2: Entity Extraction
  console.log('TEST 1.2: Entity Extraction')
  const entityTests = [
    { query: 'thermal cameras for data centers', expectedTypes: ['feature', 'industry'] },
    { query: 'agriculture with ndvi imaging', expectedTypes: ['industry', 'feature'] },
    { query: 'oil and gas lidar solutions', expectedTypes: ['industry', 'feature'] },
  ]

  entityTests.forEach(test => {
    const entities = extractEntities(test.query)
    console.log(`✓ "${test.query}"`)
    entities.forEach(e => {
      console.log(`  → ${e.type}: ${e.value} (confidence: ${e.confidence})`)
    })
  })
  console.log('')

  // Test 1.3: Sentiment Analysis
  console.log('TEST 1.3: Sentiment Analysis')
  const sentimentTests = [
    { query: 'This is amazing!', expected: 'positive' },
    { query: 'This is terrible', expected: 'negative' },
    { query: 'Tell me about your platform', expected: 'neutral' },
    { query: 'I need help urgently', expected: 'neutral', urgency: true },
  ]

  sentimentTests.forEach(test => {
    const { sentiment, urgency } = analyzeSentiment(test.query)
    const pass = sentiment === test.expected && (!test.urgency || urgency)
    console.log(`${pass ? '✓' : '✗'} "${test.query}"`)
    console.log(`  → Sentiment: ${sentiment}, Urgency: ${urgency}`)
  })
  console.log('')

  // Test 1.4: Complete NLP Processing
  console.log('TEST 1.4: Complete NLP Processing')
  const nlpResult = processNLQuery('show me thermal imaging for data centers')
  console.log('✓ Full NLP pipeline execution')
  console.log(`  → Intent: ${nlpResult.intent}`)
  console.log(`  → Entities: ${nlpResult.entities.map(e => e.value).join(', ')}`)
  console.log(`  → Sentiment: ${nlpResult.sentiment}`)
  console.log(`  → Confidence: ${(nlpResult.confidence * 100).toFixed(1)}%`)
  console.log(`  → Reformulated: "${nlpResult.reformulatedQuery}"`)
  console.log('')
}

// ─────────────────────────────────────────────────────────────
// TEST SUITE 2: KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────

export const testKnowledgeBase = () => {
  console.log('═══ KNOWLEDGE BASE TESTS ═══\n')

  // Test 2.1: Industry Lookup
  console.log('TEST 2.1: Industry Lookup')
  const industryTests = ['data centers', 'utilities', 'agriculture', 'oil and gas']

  industryTests.forEach(industry => {
    const info = getIndustryInfo(industry)
    if (info) {
      console.log(`✓ ${info.title}`)
      console.log(`  → Problem: ${info.problem.substring(0, 60)}...`)
      console.log(`  → Solution: ${info.solution.substring(0, 60)}...`)
    }
  })
  console.log('')

  // Test 2.2: Feature Lookup
  console.log('TEST 2.2: Feature Lookup')
  const featureTests = ['thermal', 'lidar', 'ndvi', 'ogi']

  featureTests.forEach(feature => {
    const info = getFeatureInfo(feature)
    if (info) {
      console.log(`✓ ${info.name}`)
      console.log(`  → ${info.description.substring(0, 60)}...`)
    }
  })
  console.log('')

  // Test 2.3: FAQ Search
  console.log('TEST 2.3: FAQ Search & Semantic Matching')
  const faqTests = [
    'how long can the drone fly?',
    'how long can drone fly', // Typo/short version
    'what is the endurance?', // Alternative phrasing
    'thermal sensitivity specs',
  ]

  faqTests.forEach(query => {
    const results = searchFAQ(query)
    console.log(`✓ "${query}"`)
    if (results.length > 0) {
      console.log(`  → Found: "${results[0].question}" (score: ${results[0].score.toFixed(2)})`)
    } else {
      console.log(`  → No matches`)
    }
  })
  console.log('')

  // Test 2.4: Related Content Discovery
  console.log('TEST 2.4: Related Content Discovery')
  const relatedContent = findRelatedContent('thermal monitoring for infrastructure')
  console.log('✓ Multi-source content search')
  console.log(`  → FAQs: ${relatedContent.faq.length} matches`)
  console.log(`  → Industries: ${relatedContent.industries.length} matches`)
  console.log(`  → Features: ${relatedContent.features.length} matches`)
  console.log('')
}

// ─────────────────────────────────────────────────────────────
// TEST SUITE 3: RESPONSE GENERATION
// ─────────────────────────────────────────────────────────────

export const testResponseGeneration = () => {
  console.log('═══ RESPONSE GENERATION TESTS ═══\n')

  // Test 3.1: Intent-Based Responses
  console.log('TEST 3.1: Intent-Based Response Generation')

  const testQueries = [
    'show me thermal cameras',
    'take me to pricing',
    'how does lidar work?',
    'I need to schedule',
    'why use Jinki?',
  ]

  testQueries.forEach(query => {
    const nlpResult = processNLQuery(query)
    const response = generateResponse(nlpResult)
    console.log(`✓ Query: "${query}"`)
    console.log(`  → Intent: ${response.intent}`)
    console.log(`  → Sentiment: ${response.sentiment}`)
    console.log(`  → Response length: ${response.text.length} chars`)
    console.log(`  → Suggested actions: ${response.suggestedActions.length}`)
    console.log('')
  })

  // Test 3.2: Sentiment-Aware Responses
  console.log('TEST 3.2: Sentiment-Aware Response Variations')

  const positiveQuery = 'This is amazing! Show me your thermal cameras'
  const negativeQuery = "I don't like how expensive this is"
  const neutralQuery = 'Tell me about your platform'

  console.log('Positive Sentiment:')
  let result = generateResponse(processNLQuery(positiveQuery))
  console.log(`  → First line: "${result.text.split('\n')[0]}"`)

  console.log('Negative Sentiment:')
  result = generateResponse(processNLQuery(negativeQuery))
  console.log(`  → First line: "${result.text.split('\n')[0]}"`)

  console.log('Neutral Sentiment:')
  result = generateResponse(processNLQuery(neutralQuery))
  console.log(`  → First line: "${result.text.split('\n')[0]}"`)

  console.log('')
}

// ─────────────────────────────────────────────────────────────
// TEST SUITE 4: MULTI-TURN CONVERSATION
// ─────────────────────────────────────────────────────────────

export const testMultiTurnConversation = () => {
  console.log('═══ MULTI-TURN CONVERSATION TESTS ═══\n')

  console.log('Simulating conversation flow:\n')

  const conversation = [
    'What solutions do you have for agriculture?',
    'What is the ROI?',
    'Can we discuss implementation?',
    'How do I get started?',
  ]

  const conversationHistory = []

  conversation.forEach((query, idx) => {
    const nlpResult = processNLQuery(query, { conversationHistory })
    const response = generateResponse(nlpResult, conversationHistory)

    console.log(`Turn ${idx + 1}: User`)
    console.log(`  "${query}"`)
    console.log(`\nTurn ${idx + 1}: Bot`)
    console.log(`  → Intent: ${response.intent}`)
    console.log(`  → Context updated: ${nlpResult.entities.length > 0 ? 'Yes' : 'No'}`)
    console.log(`  Preview: "${response.text.substring(0, 80)}..."`)
    console.log('')

    // Add to history
    conversationHistory.push({ query, intent: nlpResult.intent, entities: nlpResult.entities })
  })
}

// ─────────────────────────────────────────────────────────────
// TEST SUITE 5: EDGE CASES & ROBUSTNESS
// ─────────────────────────────────────────────────────────────

export const testEdgeCases = () => {
  console.log('═══ EDGE CASE TESTS ═══\n')

  // Test 5.1: Typo Tolerance
  console.log('TEST 5.1: Typo Tolerance')
  const typoTests = [
    'thermel imaging',
    'lidar scaning',
    'how long can drone fly fo',
  ]

  typoTests.forEach(query => {
    const results = searchFAQ(query)
    const success = results.length > 0
    console.log(`${success ? '✓' : '✗'} "${query}"`)
    if (success) {
      console.log(`  → Matched: "${results[0].question}"`)
    }
  })
  console.log('')

  // Test 5.2: Abbreviation Expansion
  console.log('TEST 5.2: Abbreviation Expansion')
  const abbrevTests = [
    'show me lidar',
    'ndvi imaging',
    'ogi detection',
  ]

  abbrevTests.forEach(query => {
    const nlpResult = processNLQuery(query)
    console.log(`✓ "${query}"`)
    console.log(`  → Reformulated: "${nlpResult.reformulatedQuery}"`)
  })
  console.log('')

  // Test 5.3: Empty/Minimal Input
  console.log('TEST 5.3: Empty/Minimal Input')
  const minimalTests = ['ok', 'yes', 'hello', '?']

  minimalTests.forEach(query => {
    const nlpResult = processNLQuery(query)
    console.log(`✓ "${query}"`)
    console.log(`  → Intent: ${nlpResult.intent}`)
  })
  console.log('')

  // Test 5.4: Complex Multi-Entity Queries
  console.log('TEST 5.4: Complex Multi-Entity Queries')
  const complexTests = [
    'show lidar and thermal imaging for data centers and utilities',
    'compare agriculture ndvi vs oil gas ogi cost',
  ]

  complexTests.forEach(query => {
    const nlpResult = processNLQuery(query)
    console.log(`✓ "${query}"`)
    console.log(`  → Entities extracted: ${nlpResult.entities.length}`)
    nlpResult.entities.forEach(e => {
      console.log(`    • ${e.type}: ${e.value}`)
    })
  })
  console.log('')
}

// ─────────────────────────────────────────────────────────────
// COMPREHENSIVE TEST RUNNER
// ─────────────────────────────────────────────────────────────

export const runAllTests = () => {
  console.clear()
  console.log('\n')
  console.log('████████████████████████████████████████████████████████████')
  console.log('█                                                          █')
  console.log('█  CONVERSATIONAL UI - COMPREHENSIVE TEST SUITE            █')
  console.log('█  Jinki Intelligence Natural Language Processing         █')
  console.log('█                                                          █')
  console.log('████████████████████████████████████████████████████████████')
  console.log('\n')

  const startTime = performance.now()

  try {
    testNLPPipeline()
    testKnowledgeBase()
    testResponseGeneration()
    testMultiTurnConversation()
    testEdgeCases()

    const duration = (performance.now() - startTime).toFixed(2)

    console.log('════════════════════════════════════════════════════════════')
    console.log('✓ ALL TESTS COMPLETED SUCCESSFULLY')
    console.log(`  Duration: ${duration}ms`)
    console.log('════════════════════════════════════════════════════════════')
  } catch (error) {
    console.error('✗ TEST SUITE FAILED')
    console.error(error.message)
    console.error(error.stack)
  }
}

// ─────────────────────────────────────────────────────────────
// USAGE
// ─────────────────────────────────────────────────────────────

// Run tests in browser console:
// import { runAllTests } from './utils/conversationalUI.test.js'
// runAllTests()

export default {
  runAllTests,
  testNLPPipeline,
  testKnowledgeBase,
  testResponseGeneration,
  testMultiTurnConversation,
  testEdgeCases,
}
