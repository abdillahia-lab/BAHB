/**
 * AI Personalization Type Definitions
 * Complete schema for user profiles, content, and personalization state
 */

// ═══════════════════════════════════════════════════════════════
// INDUSTRY ENUMS & TYPES
// ═══════════════════════════════════════════════════════════════

export enum Industry {
  DATA_CENTERS = 'data_centers',
  UTILITIES = 'utilities',
  AGRICULTURE = 'agriculture',
  OIL_GAS = 'oil_gas',
  UNKNOWN = 'unknown'
}

export enum RiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum UserSegment {
  EXECUTIVE = 'executive',
  TECHNICAL = 'technical',
  OPERATIONS = 'operations',
  COMPLIANCE = 'compliance',
  UNKNOWN = 'unknown'
}

// ═══════════════════════════════════════════════════════════════
// USER PROFILE SCHEMA
// ═══════════════════════════════════════════════════════════════

export interface UserProfile {
  // Identity
  id: string
  sessionId: string
  createdAt: number
  lastUpdated: number

  // Detection & Classification
  detectedIndustry: Industry
  industryConfidence: number // 0-1

  // Behavioral Insights
  segment: UserSegment
  primaryPainPoint: string | null
  secondaryPainPoints: string[]
  estimatedCompanySize: 'small' | 'medium' | 'enterprise' | 'unknown'
  decisionMakerLevel: 'C-suite' | 'Manager' | 'Individual Contributor' | 'unknown'

  // Behavioral Data
  behaviors: {
    pagesViewed: string[]
    timeOnSite: number // milliseconds
    scrollDepth: number // 0-100
    interactionCount: number
    videosWatched: string[]
    documentsCTA: string[]
    lastInteraction: number
  }

  // Interest Profile
  interests: {
    automationLevel: number // 0-100
    scalabilityFocus: number
    costOptimization: number
    sustainability: number
    realTimeAnalytics: number
    predictiveMaintenance: number
    securityCompliance: number
    resiliency: number
  }

  // Referral & Source
  referralSource: string | null
  referralDetails: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
  }

  // Personalization Preferences
  preferences: {
    complexity: 'simplified' | 'balanced' | 'technical'
    contentFormat: ('video' | 'text' | 'interactive' | 'case-study')[]
    timePreference: 'quick' | 'detailed' | 'mixed'
    language: string
    timezone: string
  }

  // Privacy & Compliance
  privacyConsent: {
    personalization: boolean
    analytics: boolean
    marketing: boolean
    timestamp: number
  }

  // ML Model Predictions
  predictions: {
    conversionProbability: number
    timeToDecision: number // days
    estimatedDealSize: number
    productFit: Record<string, number> // product -> fit score (0-1)
    nextBestAction: string | null
  }
}

// ═══════════════════════════════════════════════════════════════
// CONTENT VARIATION SYSTEM
// ═══════════════════════════════════════════════════════════════

export interface HeroVariant {
  id: string
  industry: Industry
  segment: UserSegment
  title: string
  subtitle: string
  cta: string
  imageUrl: string
  backgroundColor: string
  accentColor: string
  metrics: string[] // What metrics to show
  riskEmphasis: RiskLevel
}

export interface SolutionCard {
  id: string
  name: string
  description: string
  icon: string
  relevanceScore: Record<Industry, number> // 0-1 score per industry
  keyBenefits: string[]
  estimatedROI: string
  implementationTime: string
  testimonialRelevance: Record<Industry, number>
}

export interface PricingVariant {
  id: string
  industry: Industry
  planName: string
  price: number
  billingCycle: 'monthly' | 'annual'
  features: string[]
  emphasis: string // What to highlight
  targetSegment: UserSegment[]
  riskMitigation: Record<string, string> // risk -> mitigation
}

export interface CaseStudy {
  id: string
  industry: Industry
  companyName: string
  challenge: string
  solution: string
  metrics: {
    label: string
    value: string
    improvement: number // percentage
  }[]
  testimonial: string
  testimonialAuthor: string
  testimonialRole: string
  imageUrl: string
  caseStudyUrl: string
  relevanceKeywords: string[]
}

export interface Testimonial {
  id: string
  author: string
  role: string
  company: string
  industry: Industry
  quote: string
  imageUrl: string
  relevanceScore: Record<Industry, number>
  riskContext: RiskLevel
}

// ═══════════════════════════════════════════════════════════════
// PERSONALIZATION ENGINE STATE
// ═══════════════════════════════════════════════════════════════

export interface PersonalizationState {
  userProfile: UserProfile
  isLoading: boolean
  isInitialized: boolean

  // Personalized Content Rankings
  contentRankings: {
    solutions: { item: SolutionCard; score: number }[]
    caseStudies: { item: CaseStudy; score: number }[]
    testimonials: { item: Testimonial; score: number }[]
    features: { id: string; score: number }[]
  }

  // Hero Variant Selection
  selectedHeroVariant: HeroVariant | null

  // Pricing Variant Selection
  selectedPricingVariant: PricingVariant | null

  // Next Best Action
  nextAction: {
    type: 'download' | 'schedule' | 'video' | 'contact' | 'pricing'
    label: string
    priority: number
  } | null

  // A/B Test Groups
  experimentGroups: Record<string, string>

  // Tracking & Analytics
  events: PersonalizationEvent[]
}

export interface PersonalizationEvent {
  type: 'view' | 'click' | 'scroll' | 'conversion' | 'form-fill'
  component: string
  timestamp: number
  metadata: Record<string, any>
}

// ═══════════════════════════════════════════════════════════════
// INDUSTRY DETECTION
// ═══════════════════════════════════════════════════════════════

export interface IndustrySignal {
  type: 'referral' | 'keyword' | 'behavior' | 'form' | 'metadata'
  industry: Industry
  confidence: number
  evidence: string
}

export interface MLClassifierInput {
  referralSource?: string
  keywords?: string[]
  behaviors?: Record<string, any>
  formData?: Record<string, any>
  metadata?: Record<string, any>
}

// ═══════════════════════════════════════════════════════════════
// CONTENT ORDERING & RANKING
// ═══════════════════════════════════════════════════════════════

export interface ContentRanker {
  rankSolutions(solutions: SolutionCard[], profile: UserProfile): { item: SolutionCard; score: number }[]
  rankCaseStudies(studies: CaseStudy[], profile: UserProfile): { item: CaseStudy; score: number }[]
  rankTestimonials(testimonials: Testimonial[], profile: UserProfile): { item: Testimonial; score: number }[]
  rankFeatures(features: string[], profile: UserProfile): { id: string; score: number }[]
}

// ═══════════════════════════════════════════════════════════════
// ADAPTIVE UI COMPLEXITY
// ═══════════════════════════════════════════════════════════════

export interface UIComplexityLevel {
  level: 'simplified' | 'balanced' | 'technical'
  showDetailedMetrics: boolean
  showTechnicalDocs: boolean
  showCodeSamples: boolean
  animationLevel: 'minimal' | 'moderate' | 'full'
  contentDepth: 'overview' | 'intermediate' | 'deep'
}

// ═══════════════════════════════════════════════════════════════
// GDPR & PRIVACY
// ═══════════════════════════════════════════════════════════════

export interface PrivacyPolicy {
  collectPersonalData: boolean
  storageLocation: string
  retentionDays: number
  thirdPartySharing: boolean
  dataExportable: boolean
  gdprCompliant: boolean
}

export interface ConsentRecord {
  timestamp: number
  consents: {
    personalization: boolean
    analytics: boolean
    marketing: boolean
  }
  ipHash: string
  userAgent: string
}
