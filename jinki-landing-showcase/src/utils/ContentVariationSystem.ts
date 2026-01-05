/**
 * Content Variation System
 * Intelligent content ranking, ordering, and personalization
 */

import {
  Industry,
  UserProfile,
  UserSegment,
  SolutionCard,
  CaseStudy,
  Testimonial,
  HeroVariant,
  PricingVariant,
  ContentRanker,
  RiskLevel
} from '../types/PersonalizationTypes'

// ═══════════════════════════════════════════════════════════════
// CONTENT DATABASE (Reference data)
// ═══════════════════════════════════════════════════════════════

export const SOLUTIONS_DATABASE: SolutionCard[] = [
  {
    id: 'predictive-maintenance',
    name: 'Predictive Maintenance AI',
    description: 'ML models that predict equipment failures before they happen',
    icon: '🔮',
    relevanceScore: {
      [Industry.DATA_CENTERS]: 0.95,
      [Industry.UTILITIES]: 0.98,
      [Industry.AGRICULTURE]: 0.7,
      [Industry.OIL_GAS]: 0.99
    },
    keyBenefits: ['90% fewer unplanned outages', '40% maintenance cost reduction', 'Extended asset lifetime'],
    estimatedROI: '350%',
    implementationTime: '4-6 weeks',
    testimonialRelevance: {
      [Industry.DATA_CENTERS]: 0.85,
      [Industry.UTILITIES]: 0.95,
      [Industry.AGRICULTURE]: 0.6,
      [Industry.OIL_GAS]: 1.0
    }
  },
  {
    id: 'real-time-monitoring',
    name: 'Real-Time Monitoring & Alerts',
    description: 'Enterprise-grade monitoring with sub-second latency alerts',
    icon: '📊',
    relevanceScore: {
      [Industry.DATA_CENTERS]: 0.92,
      [Industry.UTILITIES]: 0.96,
      [Industry.AGRICULTURE]: 0.75,
      [Industry.OIL_GAS]: 0.94
    },
    keyBenefits: ['99.99% uptime SLA', 'Millisecond alerts', 'Multi-sensor fusion'],
    estimatedROI: '280%',
    implementationTime: '2-4 weeks',
    testimonialRelevance: {
      [Industry.DATA_CENTERS]: 0.9,
      [Industry.UTILITIES]: 0.92,
      [Industry.AGRICULTURE]: 0.7,
      [Industry.OIL_GAS]: 0.88
    }
  },
  {
    id: 'anomaly-detection',
    name: 'Anomaly Detection Engine',
    description: 'Advanced AI to identify unusual patterns in real-time data streams',
    icon: '🎯',
    relevanceScore: {
      [Industry.DATA_CENTERS]: 0.88,
      [Industry.UTILITIES]: 0.92,
      [Industry.AGRICULTURE]: 0.82,
      [Industry.OIL_GAS]: 0.96
    },
    keyBenefits: ['Detect threats 10x faster', 'Reduce false positives by 85%', 'Zero-day threat detection'],
    estimatedROI: '420%',
    implementationTime: '3-5 weeks',
    testimonialRelevance: {
      [Industry.DATA_CENTERS]: 0.82,
      [Industry.UTILITIES]: 0.88,
      [Industry.AGRICULTURE]: 0.75,
      [Industry.OIL_GAS]: 0.94
    }
  },
  {
    id: 'demand-forecasting',
    name: 'AI Demand Forecasting',
    description: 'Predict demand patterns with 95% accuracy using ensemble ML models',
    icon: '📈',
    relevanceScore: {
      [Industry.DATA_CENTERS]: 0.75,
      [Industry.UTILITIES]: 0.98,
      [Industry.AGRICULTURE]: 0.88,
      [Industry.OIL_GAS]: 0.72
    },
    keyBenefits: ['95% forecast accuracy', 'Optimize inventory 35%', 'Reduce waste significantly'],
    estimatedROI: '310%',
    implementationTime: '3-6 weeks',
    testimonialRelevance: {
      [Industry.DATA_CENTERS]: 0.65,
      [Industry.UTILITIES]: 0.94,
      [Industry.AGRICULTURE]: 0.85,
      [Industry.OIL_GAS]: 0.68
    }
  },
  {
    id: 'asset-lifecycle',
    name: 'Asset Lifecycle Optimization',
    description: 'Maximize ROI on critical assets with intelligent lifecycle management',
    icon: '♻️',
    relevanceScore: {
      [Industry.DATA_CENTERS]: 0.82,
      [Industry.UTILITIES]: 0.85,
      [Industry.AGRICULTURE]: 0.78,
      [Industry.OIL_GAS]: 0.88
    },
    keyBenefits: ['Extend asset life 25%', 'Reduce capex by 20%', 'Optimize replacement timing'],
    estimatedROI: '250%',
    implementationTime: '4-7 weeks',
    testimonialRelevance: {
      [Industry.DATA_CENTERS]: 0.75,
      [Industry.UTILITIES]: 0.8,
      [Industry.AGRICULTURE]: 0.72,
      [Industry.OIL_GAS]: 0.85
    }
  },
  {
    id: 'sustainability-tracking',
    name: 'Sustainability & Emissions Tracking',
    description: 'Real-time carbon footprint monitoring and optimization',
    icon: '🌱',
    relevanceScore: {
      [Industry.DATA_CENTERS]: 0.75,
      [Industry.UTILITIES]: 0.92,
      [Industry.AGRICULTURE]: 0.96,
      [Industry.OIL_GAS]: 0.68
    },
    keyBenefits: ['Track scope 1-3 emissions', 'Identify savings opportunities', 'ESG reporting ready'],
    estimatedROI: '200%',
    implementationTime: '2-4 weeks',
    testimonialRelevance: {
      [Industry.DATA_CENTERS]: 0.7,
      [Industry.UTILITIES]: 0.88,
      [Industry.AGRICULTURE]: 0.92,
      [Industry.OIL_GAS]: 0.6
    }
  }
]

export const CASE_STUDIES_DATABASE: CaseStudy[] = [
  {
    id: 'dc-outage-prevention',
    industry: Industry.DATA_CENTERS,
    companyName: 'CloudVault Inc.',
    challenge: 'Experienced 3 major unplanned outages annually costing $2.5M each',
    solution: 'Deployed Jinki predictive maintenance AI across 500 racks',
    metrics: [
      { label: 'Outage Reduction', value: '100%', improvement: 100 },
      { label: 'ROI', value: '380%', improvement: 380 },
      { label: 'Cost Savings', value: '$7.5M', improvement: 100 }
    ],
    testimonial: 'Jinki eliminated our catastrophic outages entirely. This is mission-critical infrastructure we\'re talking about.',
    testimonialAuthor: 'Sarah Chen',
    testimonialRole: 'VP Infrastructure',
    imageUrl: '/case-studies/cloud-vault.jpg',
    caseStudyUrl: '/case-studies/cloudvault',
    relevanceKeywords: ['outage', 'downtime', 'availability', 'infrastructure']
  },
  {
    id: 'utility-grid-stability',
    industry: Industry.UTILITIES,
    companyName: 'MidState Power',
    challenge: 'Managing 40% renewable energy integration with grid stability concerns',
    solution: 'Implemented Jinki demand forecasting and real-time optimization',
    metrics: [
      { label: 'Forecast Accuracy', value: '96.2%', improvement: 96 },
      { label: 'Peak Load Reduction', value: '18%', improvement: 18 },
      { label: 'Grid Stability Score', value: '+34%', improvement: 34 }
    ],
    testimonial: 'Managing renewable energy variability is complex. Jinki\'s AI gave us the confidence to scale renewables.',
    testimonialAuthor: 'Michael Torres',
    testimonialRole: 'Director of Operations',
    imageUrl: '/case-studies/midstate-power.jpg',
    caseStudyUrl: '/case-studies/midstate-power',
    relevanceKeywords: ['renewable', 'grid', 'demand', 'forecast', 'stability']
  },
  {
    id: 'agriculture-yield-increase',
    industry: Industry.AGRICULTURE,
    companyName: 'GreenAcre Farms',
    challenge: 'Improving yield with water constraints and climate variability',
    solution: 'Deployed sensor network with Jinki anomaly detection and irrigation optimization',
    metrics: [
      { label: 'Yield Increase', value: '24%', improvement: 24 },
      { label: 'Water Savings', value: '31%', improvement: 31 },
      { label: 'Cost per Bushel', value: '-18%', improvement: 18 }
    ],
    testimonial: 'We increased yield while using less water. That\'s the agricultural efficiency story we\'ve been trying to achieve.',
    testimonialAuthor: 'James Patterson',
    testimonialRole: 'Farm Operations Manager',
    imageUrl: '/case-studies/greenacre-farms.jpg',
    caseStudyUrl: '/case-studies/greenacre-farms',
    relevanceKeywords: ['yield', 'water', 'optimization', 'efficiency', 'sustainability']
  },
  {
    id: 'oil-gas-safety-compliance',
    industry: Industry.OIL_GAS,
    companyName: 'DesertGold Exploration',
    challenge: 'Maintaining 99.8% safety uptime across remote wells with aging infrastructure',
    solution: 'Implemented Jinki predictive maintenance for equipment, anomaly detection for safety events',
    metrics: [
      { label: 'Safety Incidents', value: '-78%', improvement: 78 },
      { label: 'Unplanned Downtime', value: '-65%', improvement: 65 },
      { label: 'Compliance Score', value: '99.7%', improvement: 99 }
    ],
    testimonial: 'In oil & gas, safety isn\'t optional. Jinki gave us the predictive intelligence we needed to operate with confidence.',
    testimonialAuthor: 'Dr. Robert Martinez',
    testimonialRole: 'Chief Safety Officer',
    imageUrl: '/case-studies/desertgold.jpg',
    caseStudyUrl: '/case-studies/desertgold',
    relevanceKeywords: ['safety', 'compliance', 'downtime', 'maintenance', 'risk']
  }
]

export const TESTIMONIALS_DATABASE: Testimonial[] = [
  {
    id: 'testimonial-1',
    author: 'Sarah Chen',
    role: 'VP Infrastructure',
    company: 'CloudVault Inc.',
    industry: Industry.DATA_CENTERS,
    quote: 'Jinki eliminated our catastrophic outages entirely. This is mission-critical infrastructure.',
    imageUrl: '/testimonials/sarah-chen.jpg',
    relevanceScore: {
      [Industry.DATA_CENTERS]: 0.95,
      [Industry.UTILITIES]: 0.7,
      [Industry.AGRICULTURE]: 0.3,
      [Industry.OIL_GAS]: 0.6
    },
    riskContext: RiskLevel.CRITICAL
  },
  {
    id: 'testimonial-2',
    author: 'Michael Torres',
    role: 'Director of Operations',
    company: 'MidState Power',
    industry: Industry.UTILITIES,
    quote: 'Managing renewable energy variability is complex. Jinki gave us the confidence to scale renewables.',
    imageUrl: '/testimonials/michael-torres.jpg',
    relevanceScore: {
      [Industry.DATA_CENTERS]: 0.5,
      [Industry.UTILITIES]: 0.98,
      [Industry.AGRICULTURE]: 0.4,
      [Industry.OIL_GAS]: 0.3
    },
    riskContext: RiskLevel.HIGH
  },
  {
    id: 'testimonial-3',
    author: 'James Patterson',
    role: 'Operations Manager',
    company: 'GreenAcre Farms',
    industry: Industry.AGRICULTURE,
    quote: 'We increased yield while using less water. That\'s the agricultural efficiency story we\'ve been trying to achieve.',
    imageUrl: '/testimonials/james-patterson.jpg',
    relevanceScore: {
      [Industry.DATA_CENTERS]: 0.2,
      [Industry.UTILITIES]: 0.4,
      [Industry.AGRICULTURE]: 0.98,
      [Industry.OIL_GAS]: 0.2
    },
    riskContext: RiskLevel.MEDIUM
  },
  {
    id: 'testimonial-4',
    author: 'Dr. Robert Martinez',
    role: 'Chief Safety Officer',
    company: 'DesertGold Exploration',
    industry: Industry.OIL_GAS,
    quote: 'In oil & gas, safety isn\'t optional. Jinki gave us the predictive intelligence we needed.',
    imageUrl: '/testimonials/robert-martinez.jpg',
    relevanceScore: {
      [Industry.DATA_CENTERS]: 0.6,
      [Industry.UTILITIES]: 0.65,
      [Industry.AGRICULTURE]: 0.2,
      [Industry.OIL_GAS]: 0.99
    },
    riskContext: RiskLevel.CRITICAL
  }
]

// ═══════════════════════════════════════════════════════════════
// CONTENT RANKER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

export class ContentRankerImpl implements ContentRanker {
  /**
   * Rank solutions based on user profile
   */
  rankSolutions(
    solutions: SolutionCard[],
    profile: UserProfile
  ): { item: SolutionCard; score: number }[] {
    return solutions.map(solution => ({
      item: solution,
      score: this.calculateSolutionRelevance(solution, profile)
    }))
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Rank case studies based on relevance
   */
  rankCaseStudies(
    studies: CaseStudy[],
    profile: UserProfile
  ): { item: CaseStudy; score: number }[] {
    return studies.map(study => ({
      item: study,
      score: this.calculateCaseStudyRelevance(study, profile)
    }))
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Rank testimonials for maximum relevance
   */
  rankTestimonials(
    testimonials: Testimonial[],
    profile: UserProfile
  ): { item: Testimonial; score: number }[] {
    return testimonials.map(testimonial => ({
      item: testimonial,
      score: this.calculateTestimonialRelevance(testimonial, profile)
    }))
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Rank features for industry
   */
  rankFeatures(features: string[], profile: UserProfile): { id: string; score: number }[] {
    // Map features to industries and score them
    const industryFeatureMap: Record<Industry, Record<string, number>> = {
      [Industry.DATA_CENTERS]: {
        'Uptime SLA': 0.95,
        'Latency Optimization': 0.92,
        'Cost Reduction': 0.85,
        'Scalability': 0.88,
        'Security': 0.8
      },
      [Industry.UTILITIES]: {
        'Grid Stability': 0.98,
        'Demand Forecasting': 0.96,
        'Renewable Integration': 0.94,
        'Asset Lifecycle': 0.85,
        'Compliance': 0.92
      },
      [Industry.AGRICULTURE]: {
        'Yield Optimization': 0.98,
        'Water Management': 0.96,
        'Sustainability': 0.94,
        'Equipment Health': 0.85,
        'Pest Detection': 0.8
      },
      [Industry.OIL_GAS]: {
        'Safety': 0.99,
        'Compliance': 0.98,
        'Predictive Maintenance': 0.97,
        'Risk Management': 0.96,
        'Production Optimization': 0.85
      },
      [Industry.UNKNOWN]: {
        'General Analytics': 0.5,
        'Monitoring': 0.5,
        'Optimization': 0.5,
        'Reporting': 0.5,
        'Integration': 0.5
      }
    }

    const featureScores = industryFeatureMap[profile.detectedIndustry]

    return features.map(feature => ({
      id: feature,
      score: featureScores[feature] || 0.5
    }))
      .sort((a, b) => b.score - a.score)
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE SCORING METHODS
  // ═══════════════════════════════════════════════════════════════

  private calculateSolutionRelevance(solution: SolutionCard, profile: UserProfile): number {
    let score = 0

    // Industry match (0.4 weight)
    const industryScore = solution.relevanceScore[profile.detectedIndustry] || 0.3
    score += industryScore * 0.4

    // Interest alignment (0.3 weight)
    const interestMatch = this.calculateInterestMatch(solution, profile)
    score += interestMatch * 0.3

    // Segment alignment (0.2 weight)
    const segmentMatch = this.calculateSegmentSolutionMatch(solution, profile.segment)
    score += segmentMatch * 0.2

    // Primary pain point match (0.1 weight)
    const painPointMatch = this.calculatePainPointMatch(solution, profile.primaryPainPoint)
    score += painPointMatch * 0.1

    return score
  }

  private calculateCaseStudyRelevance(study: CaseStudy, profile: UserProfile): number {
    let score = 0

    // Industry match (0.5 weight) - case studies are very industry-specific
    score += (study.industry === profile.detectedIndustry ? 1 : 0) * 0.5

    // Relevance keywords (0.3 weight)
    const keywordMatch = study.relevanceKeywords.some(
      keyword => profile.primaryPainPoint?.toLowerCase().includes(keyword.toLowerCase())
    ) ? 1 : 0.5
    score += keywordMatch * 0.3

    // Segment alignment (0.2 weight)
    score += (this.caseStudyMatchesSegment(study, profile.segment) ? 1 : 0.5) * 0.2

    return score
  }

  private calculateTestimonialRelevance(testimonial: Testimonial, profile: UserProfile): number {
    let score = 0

    // Industry match (0.6 weight)
    const industryScore = testimonial.relevanceScore[profile.detectedIndustry] || 0.3
    score += industryScore * 0.6

    // Risk level alignment (0.2 weight)
    const riskScore = testimonial.riskContext === RiskLevel.CRITICAL ? 0.9 : 0.6
    score += riskScore * 0.2

    // Segment alignment (0.2 weight)
    const segmentMatch = this.testimonialMatchesSegment(testimonial, profile.segment) ? 1 : 0.5
    score += segmentMatch * 0.2

    return score
  }

  private calculateInterestMatch(solution: SolutionCard, profile: UserProfile): number {
    const interestMap: Record<string, keyof typeof profile.interests> = {
      'predictive-maintenance': 'predictiveMaintenance',
      'real-time-monitoring': 'realTimeAnalytics',
      'anomaly-detection': 'securityCompliance',
      'demand-forecasting': 'scalabilityFocus',
      'asset-lifecycle': 'costOptimization',
      'sustainability-tracking': 'sustainability'
    }

    const interestKey = interestMap[solution.id]
    if (!interestKey) return 0.5

    return profile.interests[interestKey] / 100
  }

  private calculateSegmentSolutionMatch(solution: SolutionCard, segment: UserSegment): number {
    const segmentPriorities: Record<UserSegment, Record<string, number>> = {
      [UserSegment.EXECUTIVE]: {
        'predictive-maintenance': 0.9,
        'demand-forecasting': 0.85,
        'asset-lifecycle': 0.8,
        'sustainability-tracking': 0.7,
        'real-time-monitoring': 0.6,
        'anomaly-detection': 0.5
      },
      [UserSegment.TECHNICAL]: {
        'real-time-monitoring': 0.95,
        'anomaly-detection': 0.9,
        'predictive-maintenance': 0.85,
        'asset-lifecycle': 0.7,
        'demand-forecasting': 0.6,
        'sustainability-tracking': 0.5
      },
      [UserSegment.OPERATIONS]: {
        'predictive-maintenance': 0.95,
        'real-time-monitoring': 0.9,
        'asset-lifecycle': 0.85,
        'anomaly-detection': 0.8,
        'demand-forecasting': 0.7,
        'sustainability-tracking': 0.6
      },
      [UserSegment.COMPLIANCE]: {
        'anomaly-detection': 0.95,
        'sustainability-tracking': 0.9,
        'predictive-maintenance': 0.8,
        'real-time-monitoring': 0.75,
        'asset-lifecycle': 0.7,
        'demand-forecasting': 0.5
      },
      [UserSegment.UNKNOWN]: {
        'predictive-maintenance': 0.7,
        'real-time-monitoring': 0.7,
        'anomaly-detection': 0.7,
        'demand-forecasting': 0.7,
        'asset-lifecycle': 0.7,
        'sustainability-tracking': 0.7
      }
    }

    const priorities = segmentPriorities[segment]
    return priorities[solution.id] || 0.5
  }

  private calculatePainPointMatch(solution: SolutionCard, painPoint: string | null): number {
    if (!painPoint) return 0.5

    const painPointMap: Record<string, string[]> = {
      'Preventing Catastrophic Downtime': ['predictive-maintenance', 'real-time-monitoring'],
      'Optimizing Operational Costs': ['asset-lifecycle', 'demand-forecasting'],
      'Scaling Infrastructure Seamlessly': ['real-time-monitoring', 'anomaly-detection'],
      'Achieving Ultra-Low Latency': ['real-time-monitoring'],
      'Preventing Grid Failures': ['predictive-maintenance', 'real-time-monitoring'],
      'Managing Peak Demand': ['demand-forecasting', 'real-time-monitoring'],
      'Integrating Renewable Energy': ['demand-forecasting', 'sustainability-tracking'],
      'Maintaining Aging Infrastructure': ['predictive-maintenance', 'asset-lifecycle'],
      'Maximizing Yield per Acre': ['demand-forecasting', 'anomaly-detection'],
      'Optimizing Water Usage': ['anomaly-detection', 'sustainability-tracking'],
      'Mitigating Weather Impact': ['demand-forecasting', 'anomaly-detection'],
      'Reducing Labor Costs': ['predictive-maintenance', 'asset-lifecycle'],
      'Ensuring Operational Safety': ['anomaly-detection', 'predictive-maintenance'],
      'Meeting Regulatory Compliance': ['anomaly-detection', 'real-time-monitoring'],
      'Minimizing Unplanned Downtime': ['predictive-maintenance', 'real-time-monitoring'],
      'Maximizing Production Efficiency': ['demand-forecasting', 'real-time-monitoring']
    }

    const solutions = painPointMap[painPoint] || []
    return solutions.includes(solution.id) ? 1.0 : 0.5
  }

  private caseStudyMatchesSegment(study: CaseStudy, segment: UserSegment): boolean {
    const segmentKeywords: Record<UserSegment, string[]> = {
      [UserSegment.EXECUTIVE]: ['roi', 'cost savings', 'revenue', 'investment'],
      [UserSegment.TECHNICAL]: ['infrastructure', 'architecture', 'deployment', 'integration'],
      [UserSegment.OPERATIONS]: ['downtime', 'maintenance', 'efficiency', 'monitoring'],
      [UserSegment.COMPLIANCE]: ['compliance', 'safety', 'risk', 'audit'],
      [UserSegment.UNKNOWN]: ['metrics', 'improvement', 'savings']
    }

    const keywords = segmentKeywords[segment]
    const studyText = `${study.challenge} ${study.solution}`.toLowerCase()

    return keywords.some(kw => studyText.includes(kw.toLowerCase()))
  }

  private testimonialMatchesSegment(testimonial: Testimonial, segment: UserSegment): boolean {
    const segmentKeywords: Record<UserSegment, string[]> = {
      [UserSegment.EXECUTIVE]: ['mission-critical', 'scale', 'confidence', 'capability'],
      [UserSegment.TECHNICAL]: ['infrastructure', 'technical', 'architecture', 'integration'],
      [UserSegment.OPERATIONS]: ['operations', 'uptime', 'monitoring', 'maintenance'],
      [UserSegment.COMPLIANCE]: ['safety', 'compliance', 'risk', 'security'],
      [UserSegment.UNKNOWN]: ['intelligent', 'improved', 'achieved']
    }

    const keywords = segmentKeywords[segment]
    const testimonialText = testimonial.quote.toLowerCase()

    return keywords.some(kw => testimonialText.includes(kw.toLowerCase()))
  }
}

export default ContentRankerImpl
