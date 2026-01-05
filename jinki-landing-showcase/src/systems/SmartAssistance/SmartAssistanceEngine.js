/**
 * ════════════════════════════════════════════════════════════════
 * SMART ASSISTANCE ENGINE
 * Core logic for proactive help detection and delivery
 * ════════════════════════════════════════════════════════════════
 */

import {
  CONFUSION_SIGNALS,
  ASSISTANCE_TRIGGERS,
  TIMING_RULES,
  LEARNING_CONFIG,
  FEATURE_FLAGS,
} from './assistanceConfig'

export class SmartAssistanceEngine {
  constructor() {
    this.userProfile = this.initializeUserProfile()
    this.sessionMetrics = this.initializeSessionMetrics()
    this.confusionDetector = new ConfusionDetector()
    this.assistanceQueue = []
    this.shownAssistance = new Map()
    this.listeners = []
    this.isEnabled = FEATURE_FLAGS.ENABLE_SMART_ASSISTANCE
  }

  // ═══════════════════════════════════════════════════════════════
  // USER PROFILE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  initializeUserProfile() {
    const saved = localStorage.getItem('jinki_user_profile')
    if (saved) {
      return JSON.parse(saved)
    }

    return {
      id: this.generateUserId(),
      isFirstVisit: true,
      sessionCount: 1,
      totalTimeOnSite: 0,
      engagementScore: 0,
      preferredLearningStyle: null,
      dismissedTours: [],
      dismissedTooltips: [],
      completedTours: [],
      preferences: {
        showAssistance: true,
        maxHelpFrequency: 'normal',
        preferredFormat: 'tooltip', // tooltip, tour, suggestion
      },
      patterns: {
        avgScrollSpeed: null,
        avgTimePerSection: {},
        clickPatterns: [],
        formInteractionStyle: null,
      },
    }
  }

  saveUserProfile() {
    localStorage.setItem('jinki_user_profile', JSON.stringify(this.userProfile))
  }

  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ═══════════════════════════════════════════════════════════════
  // SESSION METRICS TRACKING
  // ═══════════════════════════════════════════════════════════════

  initializeSessionMetrics() {
    return {
      startTime: Date.now(),
      lastAssistanceTime: 0,
      assistanceShownCount: 0,
      scrollEvents: [],
      clickEvents: [],
      hoverEvents: [],
      focusEvents: [],
      sectionViews: {},
      currentSection: null,
      isScrolling: false,
      scrollDirection: null,
      lastScrollPos: 0,
    }
  }

  trackScroll(scrollPos, scrollDirection) {
    this.sessionMetrics.scrollEvents.push({
      pos: scrollPos,
      direction: scrollDirection,
      time: Date.now(),
    })

    // Keep only last 30 scroll events
    if (this.sessionMetrics.scrollEvents.length > 30) {
      this.sessionMetrics.scrollEvents.shift()
    }

    this.sessionMetrics.isScrolling = true
    this.sessionMetrics.scrollDirection = scrollDirection
    this.sessionMetrics.lastScrollPos = scrollPos

    // Check for confusion signals
    this.confusionDetector.detectFromScroll(this.sessionMetrics.scrollEvents)
  }

  trackClick(target, section) {
    this.sessionMetrics.clickEvents.push({
      target,
      section,
      time: Date.now(),
    })

    // Check for click hunting
    this.confusionDetector.detectClickHunting(target, this.sessionMetrics.clickEvents)
  }

  trackHover(target, section) {
    this.sessionMetrics.hoverEvents.push({
      target,
      section,
      time: Date.now(),
      duration: 0,
    })

    this.confusionDetector.detectHoverWithoutAction(this.sessionMetrics.hoverEvents)
  }

  trackSectionView(sectionId) {
    if (this.sessionMetrics.currentSection === sectionId) return

    // Record previous section
    if (this.sessionMetrics.currentSection) {
      const prevKey = this.sessionMetrics.currentSection
      if (!this.sessionMetrics.sectionViews[prevKey]) {
        this.sessionMetrics.sectionViews[prevKey] = { count: 0, time: 0 }
      }
      this.sessionMetrics.sectionViews[prevKey].count++
    }

    this.sessionMetrics.currentSection = sectionId
    this.confusionDetector.detectIdleOnSection(sectionId)
  }

  // ═══════════════════════════════════════════════════════════════
  // CONFUSION DETECTION
  // ═══════════════════════════════════════════════════════════════

  getConfusionSignals() {
    return this.confusionDetector.getActiveSignals()
  }

  // ═══════════════════════════════════════════════════════════════
  // ASSISTANCE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  async shouldShowAssistance(assistanceType, context = {}) {
    if (!this.isEnabled || !this.userProfile.preferences.showAssistance) {
      return false
    }

    // Check timing rules
    const timingSatisfied = this.checkTimingRules()
    if (!timingSatisfied) return false

    // Check user preferences
    if (!this.checkUserPreferences(assistanceType)) return false

    // Check if already shown
    const key = `${assistanceType}_${context.id || ''}`
    if (this.shownAssistance.has(key)) {
      const lastShown = this.shownAssistance.get(key)
      if (Date.now() - lastShown < 60000) { // 1 minute cooldown
        return false
      }
    }

    return true
  }

  checkTimingRules() {
    const timeSinceLastAssistance =
      Date.now() - this.sessionMetrics.lastAssistanceTime

    if (timeSinceLastAssistance < TIMING_RULES.MIN_GAP_BETWEEN_HELPS) {
      return false
    }

    if (this.sessionMetrics.assistanceShownCount >= TIMING_RULES.MAX_HELPS_PER_SESSION) {
      return false
    }

    // Check if in flow state
    if (this.isInFlowState()) {
      return false
    }

    return true
  }

  checkUserPreferences(assistanceType) {
    const dismissed =
      assistanceType === 'tour'
        ? this.userProfile.dismissedTours
        : this.userProfile.dismissedTooltips

    return !dismissed.includes(assistanceType)
  }

  isInFlowState() {
    const recentScrolls = this.sessionMetrics.scrollEvents.slice(-10)
    if (recentScrolls.length < 5) return false

    // Check if scrolling is smooth and consistent
    let smoothCount = 0
    for (let i = 1; i < recentScrolls.length; i++) {
      const timeDiff = recentScrolls[i].time - recentScrolls[i - 1].time
      if (timeDiff > 50 && timeDiff < 200) smoothCount++
    }

    return smoothCount > 3
  }

  registerAssistanceShown(id) {
    this.shownAssistance.set(id, Date.now())
    this.sessionMetrics.lastAssistanceTime = Date.now()
    this.sessionMetrics.assistanceShownCount++
    this.saveUserProfile()
  }

  // ═══════════════════════════════════════════════════════════════
  // LEARNING & ADAPTATION
  // ═══════════════════════════════════════════════════════════════

  recordAssistanceEngagement(assistanceId, engagementType) {
    const points = LEARNING_CONFIG.ENGAGEMENT_TRACKING[engagementType] || 0
    this.userProfile.engagementScore += points

    // Update adaptation level
    this.updateAdaptationLevel()
  }

  updateAdaptationLevel() {
    const engagementRate = this.calculateEngagementRate()

    if (engagementRate > 0.8) {
      this.userProfile.preferences.maxHelpFrequency = 'high'
    } else if (engagementRate > 0.3) {
      this.userProfile.preferences.maxHelpFrequency = 'normal'
    } else {
      this.userProfile.preferences.maxHelpFrequency = 'low'
    }
  }

  calculateEngagementRate() {
    const totalEngagements = this.sessionMetrics.clickEvents.length
    if (totalEngagements === 0) return 0

    const assistanceRelatedClicks = this.sessionMetrics.clickEvents.filter(
      (e) => e.target?.classList?.contains('assistance-interactive')
    ).length

    return assistanceRelatedClicks / totalEngagements
  }

  // ═══════════════════════════════════════════════════════════════
  // EVENT SUBSCRIPTION
  // ═══════════════════════════════════════════════════════════════

  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)
    }
  }

  emit(event) {
    this.listeners.forEach((callback) => callback(event))
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════

  getSession() {
    return {
      duration: Date.now() - this.sessionMetrics.startTime,
      assistanceShown: this.sessionMetrics.assistanceShownCount,
      engagementScore: this.userProfile.engagementScore,
    }
  }

  reset() {
    this.sessionMetrics = this.initializeSessionMetrics()
    this.shownAssistance.clear()
    this.confusionDetector.reset()
  }

  destroy() {
    this.listeners = []
    this.reset()
    this.saveUserProfile()
  }
}

// ═══════════════════════════════════════════════════════════════
// CONFUSION DETECTOR
// Analyzes user behavior to detect when they're confused
// ═══════════════════════════════════════════════════════════════

export class ConfusionDetector {
  constructor() {
    this.activeSignals = new Map()
    this.timers = new Map()
  }

  detectFromScroll(scrollEvents) {
    if (!FEATURE_FLAGS.ENABLE_CONFUSION_DETECTION) return

    // Rapid scroll detection
    const recentEvents = scrollEvents.slice(-5)
    if (recentEvents.length >= CONFUSION_SIGNALS.RAPID_SCROLL.threshold) {
      const timeSpan =
        recentEvents[recentEvents.length - 1].time - recentEvents[0].time
      if (timeSpan < CONFUSION_SIGNALS.RAPID_SCROLL.timeWindow) {
        this.setSignal('RAPID_SCROLL', CONFUSION_SIGNALS.RAPID_SCROLL.confidence)
      }
    }

    // Back and forth detection
    const directions = recentEvents.map((e) => e.direction)
    const alternations = this.countAlternations(directions)
    if (alternations >= 3) {
      this.setSignal(
        'BACK_FORTH_SCROLL',
        CONFUSION_SIGNALS.BACK_FORTH_SCROLL.confidence
      )
    }
  }

  detectIdleOnSection(sectionId) {
    const key = `IDLE_${sectionId}`
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    const timer = setTimeout(() => {
      this.setSignal('IDLE_ON_SECTION', CONFUSION_SIGNALS.IDLE_ON_SECTION.confidence)
    }, CONFUSION_SIGNALS.IDLE_ON_SECTION.threshold)

    this.timers.set(key, timer)
  }

  detectHoverWithoutAction(hoverEvents) {
    if (hoverEvents.length < CONFUSION_SIGNALS.HOVER_WITHOUT_ACTION.threshold) {
      return
    }

    const recentHovers = hoverEvents.slice(-CONFUSION_SIGNALS.HOVER_WITHOUT_ACTION.threshold)
    const timeSpan = recentHovers[recentHovers.length - 1].time - recentHovers[0].time

    if (timeSpan < CONFUSION_SIGNALS.HOVER_WITHOUT_ACTION.timeWindow) {
      this.setSignal(
        'HOVER_WITHOUT_ACTION',
        CONFUSION_SIGNALS.HOVER_WITHOUT_ACTION.confidence
      )
    }
  }

  detectClickHunting(target, clickEvents) {
    const clicksOnSameTarget = clickEvents.filter(
      (e) => e.target === target
    ).length

    if (clicksOnSameTarget >= CONFUSION_SIGNALS.CLICK_HUNTING.threshold) {
      const timeSpan =
        clickEvents[clickEvents.length - 1].time - clickEvents[0].time
      if (timeSpan < CONFUSION_SIGNALS.CLICK_HUNTING.timeWindow) {
        this.setSignal(
          'CLICK_HUNTING',
          CONFUSION_SIGNALS.CLICK_HUNTING.confidence
        )
      }
    }
  }

  setSignal(signalType, confidence) {
    this.activeSignals.set(signalType, {
      type: signalType,
      confidence,
      timestamp: Date.now(),
    })

    // Auto-clear signal after 10 seconds
    if (this.timers.has(signalType)) {
      clearTimeout(this.timers.get(signalType))
    }

    const timer = setTimeout(() => {
      this.activeSignals.delete(signalType)
      this.timers.delete(signalType)
    }, 10000)

    this.timers.set(signalType, timer)
  }

  getActiveSignals() {
    return Array.from(this.activeSignals.values())
  }

  countAlternations(arr) {
    let count = 0
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] !== arr[i - 1]) count++
    }
    return count
  }

  reset() {
    this.activeSignals.clear()
    this.timers.forEach((timer) => clearTimeout(timer))
    this.timers.clear()
  }
}

// Global singleton instance
let smartAssistanceInstance = null

export function getSmartAssistanceEngine() {
  if (!smartAssistanceInstance) {
    smartAssistanceInstance = new SmartAssistanceEngine()
  }
  return smartAssistanceInstance
}

export default SmartAssistanceEngine
