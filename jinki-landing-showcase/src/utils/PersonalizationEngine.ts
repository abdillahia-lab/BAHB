/**
 * Personalization Engine - Core ML-driven personalization logic
 * Orchestrates industry detection, content ranking, and next-best-action recommendations
 */

import {
  Industry,
  UserProfile,
  UserSegment,
  PersonalizationState,
  HeroVariant,
  PricingVariant,
  PersonalizationEvent,
  RiskLevel,
  MLClassifierInput,
  UIComplexityLevel
} from '../types/PersonalizationTypes'
import { IndustryDetector } from './IndustryDetector'
import { ContentRankerImpl, SOLUTIONS_DATABASE, CASE_STUDIES_DATABASE, TESTIMONIALS_DATABASE } from './ContentVariationSystem'
import { PrivacyManager } from './PrivacyManager'

// ═══════════════════════════════════════════════════════════════
// PERSONALIZATION ENGINE CLASS
// ═══════════════════════════════════════════════════════════════

export class PersonalizationEngine {
  private static instance: PersonalizationEngine
  private contentRanker: ContentRankerImpl
  private eventQueue: PersonalizationEvent[] = []

  private constructor() {
    this.contentRanker = new ContentRankerImpl()
  }

  /**
   * Singleton pattern - ensure only one instance
   */
  static getInstance(): PersonalizationEngine {
    if (!this.instance) {
      this.instance = new PersonalizationEngine()
    }
    return this.instance
  }

  /**
   * Initialize personalization for new user
   */
  static initializeUser(input: MLClassifierInput): UserProfile {
    const detection = IndustryDetector.detectIndustry(input)
    const segmentDetection = IndustryDetector.detectSegment(input)
    const painPoint = IndustryDetector.extractPainPoint(detection.industry, input.keywords)

    const profile: UserProfile = {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      lastUpdated: Date.now(),

      // Detection
      detectedIndustry: detection.industry,
      industryConfidence: detection.confidence,

      // Behavioral
      segment: segmentDetection.segment,
      primaryPainPoint: painPoint,
      secondaryPainPoints: [],
      estimatedCompanySize: 'unknown',
      decisionMakerLevel: 'unknown',

      // Behaviors
      behaviors: {
        pagesViewed: [],
        timeOnSite: 0,
        scrollDepth: 0,
        interactionCount: 0,
        videosWatched: [],
        documentsCTA: [],
        lastInteraction: Date.now()
      },

      // Interests - initialized based on industry
      interests: this.initializeInterests(detection.industry),

      // Referral
      referralSource: input.referralSource || null,
      referralDetails: input.metadata || {},

      // Preferences
      preferences: {
        complexity: segmentDetection.segment === UserSegment.TECHNICAL ? 'technical' : 'balanced',
        contentFormat: ['video', 'text', 'interactive', 'case-study'],
        timePreference: 'mixed',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },

      // Privacy
      privacyConsent: PrivacyManager.initializePrivacy().privacyConsent,

      // Predictions
      predictions: {
        conversionProbability: this.estimateConversionProbability(detection.industry, segmentDetection.segment),
        timeToDecision: this.estimateTimeToDecision(detection.industry),
        estimatedDealSize: this.estimateDealSize(detection.industry),
        productFit: this.calculateProductFit(detection.industry),
        nextBestAction: null
      }
    }

    return profile
  }

  /**
   * Build complete personalization state
   */
  static buildPersonalizationState(profile: UserProfile): PersonalizationState {
    const engine = this.getInstance()

    // Check if personalization is allowed
    if (!PrivacyManager.isPersonalizationAllowed(profile)) {
      return {
        userProfile: profile,
        isLoading: false,
        isInitialized: true,
        contentRankings: {
          solutions: [],
          caseStudies: [],
          testimonials: [],
          features: []
        },
        selectedHeroVariant: null,
        selectedPricingVariant: null,
        nextAction: null,
        experimentGroups: {},
        events: []
      }
    }

    // Rank all content
    const rankedSolutions = engine.contentRanker.rankSolutions(SOLUTIONS_DATABASE, profile)
    const rankedCaseStudies = engine.contentRanker.rankCaseStudies(CASE_STUDIES_DATABASE, profile)
    const rankedTestimonials = engine.contentRanker.rankTestimonials(TESTIMONIALS_DATABASE, profile)
    const rankedFeatures = engine.contentRanker.rankFeatures(
      ['Uptime SLA', 'Latency Optimization', 'Cost Reduction', 'Scalability', 'Security', 'Compliance'],
      profile
    )

    // Select hero variant
    const selectedHeroVariant = this.selectHeroVariant(profile)

    // Select pricing variant
    const selectedPricingVariant = this.selectPricingVariant(profile)

    // Determine next best action
    const nextAction = this.determineNextBestAction(profile, rankedSolutions, rankedCaseStudies)

    return {
      userProfile: profile,
      isLoading: false,
      isInitialized: true,
      contentRankings: {
        solutions: rankedSolutions,
        caseStudies: rankedCaseStudies,
        testimonials: rankedTestimonials,
        features: rankedFeatures
      },
      selectedHeroVariant,
      selectedPricingVariant,
      nextAction,
      experimentGroups: this.assignExperimentGroups(profile),
      events: engine.eventQueue
    }
  }

  /**
   * Track user interaction event
   */
  static trackEvent(
    type: PersonalizationEvent['type'],
    component: string,
    metadata: Record<string, any>
  ): void {
    const engine = this.getInstance()
    const event: PersonalizationEvent = {
      type,
      component,
      timestamp: Date.now(),
      metadata
    }
    engine.eventQueue.push(event)

    // Keep only last 100 events
    if (engine.eventQueue.length > 100) {
      engine.eventQueue = engine.eventQueue.slice(-100)
    }
  }

  /**
   * Update user profile based on behavior
   */
  static updateProfile(profile: UserProfile, behaviors: {
    pageViewed?: string
    scrollDepth?: number
    videoWatched?: string
    documentCTA?: string
    formFilled?: Record<string, any>
  }): UserProfile {
    const updated = { ...profile }
    updated.lastUpdated = Date.now()

    if (behaviors.pageViewed) {
      updated.behaviors.pagesViewed.push(behaviors.pageViewed)
    }
    if (behaviors.scrollDepth !== undefined) {
      updated.behaviors.scrollDepth = Math.max(updated.behaviors.scrollDepth, behaviors.scrollDepth)
    }
    if (behaviors.videoWatched) {
      updated.behaviors.videosWatched.push(behaviors.videoWatched)
    }
    if (behaviors.documentCTA) {
      updated.behaviors.documentsCTA.push(behaviors.documentCTA)
    }
    if (behaviors.formFilled) {
      // Update interests based on form data
      this.updateInterestsFromForm(updated, behaviors.formFilled)
    }

    // Recalculate predictions
    updated.predictions.conversionProbability = this.estimateConversionProbability(
      updated.detectedIndustry,
      updated.segment,
      updated.behaviors.interactionCount
    )

    return updated
  }

  /**
   * Get UI complexity level based on profile
   */
  static getUIComplexityLevel(profile: UserProfile): UIComplexityLevel {
    const complexityMap: Record<string, UIComplexityLevel> = {
      simplified: {
        level: 'simplified',
        showDetailedMetrics: false,
        showTechnicalDocs: false,
        showCodeSamples: false,
        animationLevel: 'minimal',
        contentDepth: 'overview'
      },
      balanced: {
        level: 'balanced',
        showDetailedMetrics: true,
        showTechnicalDocs: true,
        showCodeSamples: false,
        animationLevel: 'moderate',
        contentDepth: 'intermediate'
      },
      technical: {
        level: 'technical',
        showDetailedMetrics: true,
        showTechnicalDocs: true,
        showCodeSamples: true,
        animationLevel: 'full',
        contentDepth: 'deep'
      }
    }

    return complexityMap[profile.preferences.complexity] || complexityMap.balanced
  }

  /**
   * Calculate conversion probability using ML signals
   */
  private static estimateConversionProbability(
    industry: Industry,
    segment: UserSegment,
    interactionCount: number = 0
  ): number {
    // Base conversion rates by industry
    const industryBase: Record<Industry, number> = {
      [Industry.DATA_CENTERS]: 0.12,
      [Industry.UTILITIES]: 0.15,
      [Industry.AGRICULTURE]: 0.18,
      [Industry.OIL_GAS]: 0.14,
      [Industry.UNKNOWN]: 0.08
    }

    // Segment multipliers
    const segmentMultiplier: Record<UserSegment, number> = {
      [UserSegment.EXECUTIVE]: 1.5,
      [UserSegment.TECHNICAL]: 1.2,
      [UserSegment.OPERATIONS]: 1.3,
      [UserSegment.COMPLIANCE]: 1.4,
      [UserSegment.UNKNOWN]: 1.0
    }

    // Interaction boost
    const interactionBoost = Math.min(interactionCount * 0.02, 0.3)

    const probability = (industryBase[industry] || industryBase[Industry.UNKNOWN]) *
                       segmentMultiplier[segment] +
                       interactionBoost

    return Math.min(probability, 0.95)
  }

  /**
   * Estimate time to decision in days
   */
  private static estimateTimeToDecision(industry: Industry): number {
    const decisionTimeMap: Record<Industry, number> = {
      [Industry.DATA_CENTERS]: 45,
      [Industry.UTILITIES]: 60,
      [Industry.AGRICULTURE]: 30,
      [Industry.OIL_GAS]: 90,
      [Industry.UNKNOWN]: 45
    }
    return decisionTimeMap[industry] || 45
  }

  /**
   * Estimate deal size based on industry
   */
  private static estimateDealSize(industry: Industry): number {
    const dealSizeMap: Record<Industry, number> = {
      [Industry.DATA_CENTERS]: 500000,
      [Industry.UTILITIES]: 2000000,
      [Industry.AGRICULTURE]: 150000,
      [Industry.OIL_GAS]: 3000000,
      [Industry.UNKNOWN]: 250000
    }
    return dealSizeMap[industry] || 250000
  }

  /**
   * Calculate product-market fit scores
   */
  private static calculateProductFit(industry: Industry): Record<string, number> {
    const fitMap: Record<Industry, Record<string, number>> = {
      [Industry.DATA_CENTERS]: {
        'Predictive Maintenance': 0.98,
        'Real-Time Monitoring': 0.95,
        'Anomaly Detection': 0.90,
        'Cost Optimization': 0.85,
        'Scalability': 0.92
      },
      [Industry.UTILITIES]: {
        'Demand Forecasting': 0.98,
        'Grid Stability': 0.96,
        'Renewable Integration': 0.94,
        'Asset Lifecycle': 0.88,
        'Compliance': 0.92
      },
      [Industry.AGRICULTURE]: {
        'Yield Optimization': 0.97,
        'Water Management': 0.96,
        'Sustainability': 0.94,
        'Equipment Health': 0.85,
        'Weather Prediction': 0.88
      },
      [Industry.OIL_GAS]: {
        'Safety Management': 0.99,
        'Predictive Maintenance': 0.97,
        'Compliance': 0.98,
        'Production Optimization': 0.94,
        'Risk Management': 0.96
      },
      [Industry.UNKNOWN]: {
        'General Analytics': 0.70,
        'Monitoring': 0.70,
        'Optimization': 0.70,
        'Reporting': 0.65,
        'Integration': 0.65
      }
    }
    return fitMap[industry] || fitMap[Industry.UNKNOWN]
  }

  /**
   * Initialize interests based on industry
   */
  private static initializeInterests(industry: Industry) {
    const baseInterests = {
      automationLevel: 50,
      scalabilityFocus: 50,
      costOptimization: 50,
      sustainability: 50,
      realTimeAnalytics: 50,
      predictiveMaintenance: 50,
      securityCompliance: 50,
      resiliency: 50
    }

    const industryInterests: Record<Industry, Partial<typeof baseInterests>> = {
      [Industry.DATA_CENTERS]: {
        resiliency: 95,
        realTimeAnalytics: 90,
        scalabilityFocus: 92,
        costOptimization: 85
      },
      [Industry.UTILITIES]: {
        resiliency: 98,
        realTimeAnalytics: 95,
        predictiveMaintenance: 92,
        securityCompliance: 90
      },
      [Industry.AGRICULTURE]: {
        sustainability: 95,
        costOptimization: 90,
        realTimeAnalytics: 85,
        predictiveMaintenance: 80
      },
      [Industry.OIL_GAS]: {
        securityCompliance: 99,
        resiliency: 96,
        predictiveMaintenance: 95,
        realTimeAnalytics: 90
      },
      [Industry.UNKNOWN]: {}
    }

    return {
      ...baseInterests,
      ...(industryInterests[industry] || {})
    }
  }

  /**
   * Select best hero variant for user
   */
  private static selectHeroVariant(profile: UserProfile): HeroVariant | null {
    const variants: HeroVariant[] = [
      {
        id: 'hero-safety',
        industry: Industry.OIL_GAS,
        segment: UserSegment.COMPLIANCE,
        title: 'Prevent Catastrophic Failures',
        subtitle: 'AI-powered predictive maintenance for critical operations',
        cta: 'See How It Works',
        imageUrl: '/hero/safety.jpg',
        backgroundColor: '#1a1a2e',
        accentColor: '#e74c3c',
        metrics: ['99.8% uptime', '78% fewer incidents', '$10M+ saved'],
        riskEmphasis: RiskLevel.CRITICAL
      },
      {
        id: 'hero-efficiency',
        industry: Industry.UTILITIES,
        segment: UserSegment.OPERATIONS,
        title: 'Master Grid Complexity',
        subtitle: 'Real-time optimization for renewable energy integration',
        cta: 'Schedule Demo',
        imageUrl: '/hero/grid.jpg',
        backgroundColor: '#0f3460',
        accentColor: '#16a085',
        metrics: ['96.2% forecast accuracy', '18% peak reduction', '40% faster response'],
        riskEmphasis: RiskLevel.HIGH
      },
      {
        id: 'hero-yield',
        industry: Industry.AGRICULTURE,
        segment: UserSegment.OPERATIONS,
        title: 'Maximize Yield, Minimize Waste',
        subtitle: 'Precision agriculture powered by AI',
        cta: 'Learn More',
        imageUrl: '/hero/agriculture.jpg',
        backgroundColor: '#1a4d2e',
        accentColor: '#d4af37',
        metrics: ['24% yield increase', '31% water savings', '18% cost reduction'],
        riskEmphasis: RiskLevel.MEDIUM
      },
      {
        id: 'hero-scale',
        industry: Industry.DATA_CENTERS,
        segment: UserSegment.TECHNICAL,
        title: 'Scale Without Breaking',
        subtitle: 'Intelligent infrastructure for massive workloads',
        cta: 'Get Started',
        imageUrl: '/hero/datacenter.jpg',
        backgroundColor: '#0d1b2a',
        accentColor: '#00d4ff',
        metrics: ['99.99% SLA', '<10ms latency', '10x efficiency'],
        riskEmphasis: RiskLevel.HIGH
      }
    ]

    // Find best matching variant
    let bestVariant = variants[0]
    let bestScore = 0

    for (const variant of variants) {
      let score = 0

      if (variant.industry === profile.detectedIndustry) score += 0.5
      if (variant.segment === profile.segment) score += 0.3
      if (variant.riskEmphasis === RiskLevel.CRITICAL &&
          profile.primaryPainPoint?.includes('safety')) score += 0.2

      if (score > bestScore) {
        bestScore = score
        bestVariant = variant
      }
    }

    return bestVariant
  }

  /**
   * Select best pricing variant
   */
  private static selectPricingVariant(profile: UserProfile): PricingVariant | null {
    const variants: PricingVariant[] = [
      {
        id: 'pricing-essentials',
        industry: Industry.AGRICULTURE,
        planName: 'Essentials',
        price: 2999,
        billingCycle: 'monthly',
        features: ['Real-time monitoring', 'Basic anomaly detection', 'Email support'],
        emphasis: 'affordability',
        targetSegment: [UserSegment.OPERATIONS],
        riskMitigation: {
          'water-waste': 'Automated irrigation optimization',
          'yield-loss': 'Early pest detection alerts'
        }
      },
      {
        id: 'pricing-enterprise',
        industry: Industry.UTILITIES,
        planName: 'Enterprise',
        price: 49999,
        billingCycle: 'monthly',
        features: ['Full ML suite', 'Demand forecasting', '24/7 support', 'Custom integrations'],
        emphasis: 'comprehensive',
        targetSegment: [UserSegment.EXECUTIVE, UserSegment.COMPLIANCE],
        riskMitigation: {
          'grid-failure': 'Predictive load balancing',
          'compliance': 'Automated reporting and audit trails',
          'downtime': 'Redundant systems with failover'
        }
      },
      {
        id: 'pricing-premium',
        industry: Industry.OIL_GAS,
        planName: 'Premium',
        price: 99999,
        billingCycle: 'monthly',
        features: ['Everything + custom models', 'Dedicated success team', 'SLA 99.99%'],
        emphasis: 'safety',
        targetSegment: [UserSegment.EXECUTIVE, UserSegment.COMPLIANCE],
        riskMitigation: {
          'catastrophic-failure': 'Real-time safety monitoring across all assets',
          'compliance-violation': 'Automated compliance tracking and alerting',
          'environmental-damage': 'Predictive environmental risk assessment'
        }
      }
    ]

    // Select best variant based on industry and segment
    let bestVariant = variants[0]
    for (const variant of variants) {
      if (variant.industry === profile.detectedIndustry &&
          variant.targetSegment.includes(profile.segment)) {
        bestVariant = variant
        break
      }
    }

    return bestVariant
  }

  /**
   * Determine next best action
   */
  private static determineNextBestAction(
    profile: UserProfile,
    rankedSolutions: any[],
    rankedCaseStudies: any[]
  ) {
    // Determine action based on profile and time on site
    if (profile.behaviors.timeOnSite < 30000) {
      // < 30 seconds: show video
      return {
        type: 'video' as const,
        label: 'Watch 3-Min Overview',
        priority: 1
      }
    }

    if (profile.behaviors.interactionCount < 3) {
      // Low interaction: download case study
      return {
        type: 'download' as const,
        label: `Get ${rankedCaseStudies[0]?.item?.companyName || 'Case Study'} Case Study`,
        priority: 2
      }
    }

    if (profile.predictions.conversionProbability > 0.3) {
      // Good fit: schedule demo
      return {
        type: 'schedule' as const,
        label: 'Schedule 30-Min Demo',
        priority: 1
      }
    }

    // Default: view pricing
    return {
      type: 'pricing' as const,
      label: 'View Pricing Plans',
      priority: 3
    }
  }

  /**
   * Assign to A/B test groups
   */
  private static assignExperimentGroups(profile: UserProfile): Record<string, string> {
    const hash = profile.id.charCodeAt(0)

    return {
      hero_variant: hash % 2 === 0 ? 'A' : 'B',
      cta_position: hash % 3 === 0 ? 'top' : hash % 3 === 1 ? 'middle' : 'bottom',
      pricing_display: hash % 2 === 0 ? 'cards' : 'comparison',
      content_density: hash % 2 === 0 ? 'dense' : 'spacious'
    }
  }

  /**
   * Update interests from form submission
   */
  private static updateInterestsFromForm(profile: UserProfile, formData: Record<string, any>) {
    if (formData.primaryConcern) {
      const concern = String(formData.primaryConcern).toLowerCase()
      if (concern.includes('safety')) profile.interests.securityCompliance = 95
      if (concern.includes('cost')) profile.interests.costOptimization = 95
      if (concern.includes('efficiency')) profile.interests.automationLevel = 95
      if (concern.includes('scale')) profile.interests.scalabilityFocus = 95
    }
  }
}

export default PersonalizationEngine
