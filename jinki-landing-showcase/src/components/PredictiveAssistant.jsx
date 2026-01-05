import { useState, useEffect, useCallback, useRef } from 'react'
import { useBehaviorTracking } from '../hooks/useBehaviorTracking'
import { usePredictiveEngine } from '../hooks/usePredictiveEngine'
import { IntentAnalyzer } from '../utils/intentAnalyzer'
import { AnalyticsProcessor } from '../utils/analyticsProcessor'
import { ConversionScorer } from '../utils/conversionScorer'
import { ABTestingFramework } from '../utils/abTestingFramework'
import './PredictiveAssistant.css'

/**
 * PREDICTIVE ASSISTANT COMPONENT
 * Orchestrates all predictive systems:
 * - Tracks user behavior
 * - Makes predictions
 * - Suggests interventions
 * - A/B tests recommendations
 * - Adapts in real-time
 */

export function PredictiveAssistant({
  children,
  onPredictionUpdate = () => {},
  enableDebugPanel = true,
  sectionsToTrack = [],
}) {
  // Initialize behavior tracking
  const { trackSectionTime, trackCTAInteraction, getBehaviorData } =
    useBehaviorTracking('session-' + Date.now())

  // Get behavior data state
  const [behaviorData, setBehaviorData] = useState(null)

  // Get predictions from engine
  const predictions = usePredictiveEngine(behaviorData)

  // State for interventions and recommendations
  const [recommendations, setRecommendations] = useState({
    cta: null,
    content: null,
    exitIntervention: null,
    prefetchSuggestions: [],
  })

  const [diagnostics, setDiagnostics] = useState({
    userSegment: 'exploring',
    conversionScore: 0,
    risks: {},
    ltv: 0,
  })

  // Reference for section elements
  const sectionRefsRef = useRef(new Map())
  const timeTrackerRef = useRef(null)

  // Update behavior data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getBehaviorData()
      setBehaviorData({ ...current })
    }, 1000)

    return () => clearInterval(interval)
  }, [getBehaviorData])

  // Generate predictions and recommendations
  useEffect(() => {
    if (!behaviorData) return

    // 1. Analyze user intent
    const microIntents = IntentAnalyzer.analyzeMouseMicroIntents(
      behaviorData.mousePatterns
    )
    const frictionPoints = IntentAnalyzer.detectFrictionPoints(
      behaviorData,
      behaviorData.sessionDuration
    )
    const userSegment = IntentAnalyzer.segmentUserByPattern(behaviorData)
    const nextMicroConversion = IntentAnalyzer.predictNextMicroConversion(
      behaviorData,
      predictions.userIntent
    )

    // 2. Calculate conversion metrics
    const conversionScore = ConversionScorer.calculateConversionScore(
      behaviorData,
      userSegment
    )
    const ltv = ConversionScorer.estimateCustomerLTV(null, behaviorData)
    const risks = ConversionScorer.assessRisk(
      behaviorData,
      behaviorData.sessionDuration
    )
    const nextAction = ConversionScorer.predictNextAction(
      behaviorData,
      predictions.userIntent
    )

    // 3. Generate recommendations
    const newRecommendations = {
      cta: predictions.recommendedCTA,
      ctaId: predictions.recommendedCTAId,
      content: nextMicroConversion.action,
      exitIntervention:
        predictions.exitProbability > 0.7
          ? {
              enabled: true,
              message: 'Wait! Get 20% off your first month',
              cta: 'Claim Offer',
              placement: 'exit-intent',
            }
          : null,
      prefetchSuggestions:
        predictions.nextSectionId && predictions.nextSectionConfidence > 0.6
          ? [
              {
                sectionId: predictions.nextSectionId,
                confidence: predictions.nextSectionConfidence,
                priority: 'high',
              },
            ]
          : [],
      frictionPoints,
      microIntents,
    }

    setRecommendations(newRecommendations)

    // Update diagnostics
    setDiagnostics({
      userSegment,
      conversionScore,
      risks,
      ltv: ltv.estimatedLTV,
      nextAction,
      microIntents,
    })

    // Notify parent component
    onPredictionUpdate({
      predictions,
      recommendations: newRecommendations,
      diagnostics: {
        userSegment,
        conversionScore,
        risks,
        ltv,
        nextAction,
      },
    })
  }, [behaviorData, predictions, onPredictionUpdate])

  // Register section for time tracking
  const registerSection = useCallback((sectionId, element) => {
    if (element) {
      sectionRefsRef.current.set(sectionId, element)
    }
  }, [])

  // Trigger CTA tracking
  const onCTAClick = useCallback((ctaId, ctaText) => {
    trackCTAInteraction(ctaId, ctaText, 'click')

    // Record in A/B test if active
    const activeTests = ABTestingFramework.getActiveTests()
    activeTests.forEach((test) => {
      const variant = localStorage.getItem(`${test.id}_${ctaId}`)
      if (variant) {
        ABTestingFramework.recordConversion(test.id, variant, {
          ctaId,
          timestamp: Date.now(),
        })
      }
    })
  }, [trackCTAInteraction])

  // Setup section time tracking
  useEffect(() => {
    if (sectionRefsRef.current.size === 0) return

    const sections = Array.from(sectionRefsRef.current.values())
    const tracker = AnalyticsProcessor.createSectionTimeTracker(
      sections,
      (data) => {
        trackSectionTime(data.sectionId, data.timeSpent)
      }
    )

    timeTrackerRef.current = tracker

    return () => {
      tracker.disconnect()
    }
  }, [trackSectionTime])

  // Prefetch content for next section
  useEffect(() => {
    recommendations.prefetchSuggestions?.forEach((suggestion) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          const element = sectionRefsRef.current.get(suggestion.sectionId)
          if (element) {
            // Trigger lazy loading or prefetch images
            const images = element.querySelectorAll('img[loading="lazy"]')
            images.forEach((img) => {
              img.loading = 'eager'
            })
          }
        })
      }
    })
  }, [recommendations.prefetchSuggestions])

  // Render debug panel if enabled
  const renderDebugPanel = () => {
    if (!enableDebugPanel) return null

    return (
      <div className="predictive-assistant-debug">
        <div className="debug-header">PREDICTIVE INTELLIGENCE</div>

        <div className="debug-section">
          <h4>User Intent</h4>
          <p>
            <strong>Intent:</strong> {predictions.userIntent}
          </p>
          <p>
            <strong>Confidence:</strong>{' '}
            {(predictions.intentConfidence * 100).toFixed(0)}%
          </p>
        </div>

        <div className="debug-section">
          <h4>Conversion Metrics</h4>
          <p>
            <strong>Conversion Score:</strong>{' '}
            {diagnostics.conversionScore.toFixed(0)}/100
          </p>
          <p>
            <strong>Exit Probability:</strong>{' '}
            {(predictions.exitProbability * 100).toFixed(0)}%
          </p>
          <p>
            <strong>Est. LTV:</strong> ${diagnostics.ltv}
          </p>
        </div>

        <div className="debug-section">
          <h4>Behavior Tracking</h4>
          <p>
            <strong>Scroll Interactions:</strong>{' '}
            {behaviorData?.scrollPositions?.length || 0}
          </p>
          <p>
            <strong>CTA Clicks:</strong> {behaviorData?.ctaInteractions?.length || 0}
          </p>
          <p>
            <strong>Mouse Movements:</strong>{' '}
            {behaviorData?.mousePatterns?.length || 0}
          </p>
        </div>

        <div className="debug-section">
          <h4>Recommendations</h4>
          <p>
            <strong>Suggested CTA:</strong>{' '}
            {recommendations.cta || 'Standard'}
          </p>
          {recommendations.prefetchSuggestions.length > 0 && (
            <p>
              <strong>Prefetch:</strong>{' '}
              {recommendations.prefetchSuggestions[0].sectionId}
            </p>
          )}
        </div>

        {recommendations.frictionPoints?.length > 0 && (
          <div className="debug-section warning">
            <h4>Friction Detected</h4>
            {recommendations.frictionPoints.map((point, idx) => (
              <p key={idx} style={{ color: '#ff6b6b', fontSize: '0.9em' }}>
                • {point.type}: {point.recommendation}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="predictive-assistant-wrapper">
      {/* Provide tracking functions to children via context-like pattern */}
      {children({
        registerSection,
        onCTAClick,
        predictions,
        recommendations,
        diagnostics,
      })}

      {renderDebugPanel()}
    </div>
  )
}

/**
 * HOOK: useTrackedSection
 * Register a section for predictive tracking
 */
export function useTrackedSection(sectionId, registerSection) {
  const ref = useCallback(
    (element) => {
      registerSection(sectionId, element)
    },
    [sectionId, registerSection]
  )

  return ref
}

/**
 * HOOK: usePredictiveState
 * Access current predictions in any component
 */
export function usePredictiveState() {
  // This would typically come from React Context
  // Simplified for this implementation
  return {
    getPredictions: () => {
      return {
        userIntent: 'exploring',
        conversionScore: 0,
        exitProbability: 0,
      }
    },
  }
}

export default PredictiveAssistant
