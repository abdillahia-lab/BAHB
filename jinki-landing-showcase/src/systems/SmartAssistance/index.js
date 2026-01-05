/**
 * ════════════════════════════════════════════════════════════════
 * SMART ASSISTANCE SYSTEM - MAIN EXPORT
 * Proactive AI help for Jinki Intelligence
 * ════════════════════════════════════════════════════════════════
 */

// Configuration
export {
  CONFUSION_SIGNALS,
  ASSISTANCE_TRIGGERS,
  UI_PATTERNS,
  TIMING_RULES,
  SMART_CONTENT,
  LEARNING_CONFIG,
  CONVERSION_NUDGES,
  FEATURE_FLAGS,
} from './assistanceConfig'

// Engine
export {
  SmartAssistanceEngine,
  ConfusionDetector,
  getSmartAssistanceEngine,
} from './SmartAssistanceEngine'

// React Hooks
export {
  useConfusionDetector,
  useSectionTracking,
  useScrollTracking,
  useClickTracking,
  useSmartTooltip,
  useGuidedTour,
  useSmartSuggestions,
  useReadingTime,
  useFormAssistance,
  useRecommendations,
} from './useSmartAssistance'

// React Components
export { SmartTooltip } from './SmartTooltip'
export { GuidedTour } from './GuidedTour'
export { SmartSuggestions } from './SmartSuggestions'
export { FormAssistance } from './FormAssistance'
export { ReadingTime } from './ReadingTime'
export { SmartRecommendations } from './SmartRecommendations'

export default {
  SmartAssistanceEngine,
  getSmartAssistanceEngine,
}
