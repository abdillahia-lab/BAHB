/**
 * AI Industry Detection System
 * Multi-signal ML-based industry classification from referral, behavior, and metadata
 */

import { Industry, IndustrySignal, MLClassifierInput, UserSegment } from '../types/PersonalizationTypes'

// ═══════════════════════════════════════════════════════════════
// INDUSTRY SIGNAL DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const INDUSTRY_SIGNALS = {
  [Industry.DATA_CENTERS]: {
    keywords: [
      'data center', 'cloud', 'server', 'hosting', 'colocation', 'infra',
      'rack', 'bandwidth', 'latency', 'uptime', 'redundancy', 'failover',
      'racks per hour', 'power consumption', 'cooling efficiency',
      'virtualization', 'containerization', 'kubernetes', 'hypervisor'
    ],
    referralDomains: [
      'redhat.com', 'oracle.com', 'vmware.com', 'ibm.com',
      'dell.com', 'emc.com', 'equinix.com', 'digitalrealty.com',
      'aws.amazon.com', 'azure.microsoft.com', 'cloud.google.com'
    ],
    pageBehaviors: {
      'perf-metrics': 0.9,
      'scalability': 0.85,
      'case-studies-tech': 0.8,
      'api-docs': 0.7
    }
  },

  [Industry.UTILITIES]: {
    keywords: [
      'utility', 'power', 'grid', 'outage', 'demand', 'supply',
      'meter', 'monitoring', 'scada', 'iot', 'sensor', 'renewable',
      'smart grid', 'demand response', 'load balancing', 'distribution',
      'transmission', 'substation', 'asset management', 'predictive maintenance'
    ],
    referralDomains: [
      'engie.com', 'edf.fr', 'exelon.com', 'dominion.com',
      'duke-energy.com', 'firstenergy.com', 'enel.com',
      'ge.com', 'siemens.com', 'schneider-electric.com'
    ],
    pageBehaviors: {
      'reliability': 0.95,
      'predictive-maintenance': 0.9,
      'asset-tracking': 0.85,
      'sustainability': 0.7
    }
  },

  [Industry.AGRICULTURE]: {
    keywords: [
      'farm', 'crop', 'soil', 'irrigation', 'yield', 'harvest',
      'weather', 'drone', 'precision', 'sensor', 'iot', 'automation',
      'equipment', 'livestock', 'commodity', 'sustainability',
      'vertical farming', 'agtech', 'remote sensing', 'anomaly detection'
    ],
    referralDomains: [
      'deere.com', 'trimble.com', 'ag-tech.io', 'raven.com',
      'claas.com', 'cnh.com', 'bayer.com', 'corteva.com',
      'monsanto.com', 'agworld.com'
    ],
    pageBehaviors: {
      'sustainability': 0.95,
      'cost-optimization': 0.85,
      'real-time-monitoring': 0.8,
      'anomaly-detection': 0.75
    }
  },

  [Industry.OIL_GAS]: {
    keywords: [
      'oil', 'gas', 'drilling', 'well', 'pipeline', 'refinery',
      'extraction', 'production', 'reservoir', 'compliance', 'safety',
      'risk assessment', 'catastrophic failure', 'preventive maintenance',
      'downtime', 'inspection', 'corrosion', 'pressure', 'flow rate',
      'emissions', 'environmental'
    ],
    referralDomains: [
      'exxonmobil.com', 'chevron.com', 'bp.com', 'shell.com',
      'equinor.com', 'totalenergies.com', 'conocophillips.com',
      'schlumberger.com', 'halliburton.com', 'baker-hughes.com'
    ],
    pageBehaviors: {
      'safety': 0.98,
      'compliance': 0.95,
      'risk-management': 0.9,
      'predictive-maintenance': 0.85
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// INDUSTRY DETECTOR CLASS
// ═══════════════════════════════════════════════════════════════

export class IndustryDetector {
  /**
   * Detect industry from multiple signals using Bayesian inference
   */
  static detectIndustry(input: MLClassifierInput): { industry: Industry; confidence: number; signals: IndustrySignal[] } {
    const signals: IndustrySignal[] = []

    // Run all detection methods
    signals.push(...this.detectFromReferral(input.referralSource))
    signals.push(...this.detectFromKeywords(input.keywords))
    signals.push(...this.detectFromBehavior(input.behaviors))
    signals.push(...this.detectFromFormData(input.formData))

    // Bayesian aggregation of signals
    const industryScores = this.aggregateSignals(signals)

    // Find best match
    const sorted = Object.entries(industryScores).sort(([, a], [, b]) => b - a)
    const [bestIndustry, confidence] = sorted[0] || [Industry.UNKNOWN, 0]

    return {
      industry: bestIndustry as Industry,
      confidence: Math.min(confidence, 1),
      signals: signals.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
    }
  }

  /**
   * Detect industry from referral source
   */
  private static detectFromReferral(referral?: string): IndustrySignal[] {
    if (!referral) return []

    const signals: IndustrySignal[] = []
    const referrerUrl = referral.toLowerCase()

    for (const [industry, config] of Object.entries(INDUSTRY_SIGNALS)) {
      for (const domain of config.referralDomains) {
        if (referrerUrl.includes(domain.toLowerCase())) {
          signals.push({
            type: 'referral',
            industry: industry as Industry,
            confidence: 0.8,
            evidence: `Referral from ${domain}`
          })
        }
      }
    }

    return signals
  }

  /**
   * Detect industry from keywords in page content or search terms
   */
  private static detectFromKeywords(keywords?: string[]): IndustrySignal[] {
    if (!keywords || keywords.length === 0) return []

    const signals: IndustrySignal[] = []
    const keywordLower = keywords.map(k => k.toLowerCase())

    for (const [industry, config] of Object.entries(INDUSTRY_SIGNALS)) {
      let matchCount = 0
      const matches: string[] = []

      for (const keyword of config.keywords) {
        if (keywordLower.some(k => k.includes(keyword.toLowerCase()))) {
          matchCount++
          matches.push(keyword)
        }
      }

      if (matchCount > 0) {
        // Confidence based on number of keyword matches
        const confidence = Math.min(0.3 + (matchCount / config.keywords.length) * 0.7, 1)
        signals.push({
          type: 'keyword',
          industry: industry as Industry,
          confidence,
          evidence: `Matched ${matchCount} keywords: ${matches.slice(0, 3).join(', ')}`
        })
      }
    }

    return signals
  }

  /**
   * Detect from user behavior on site
   */
  private static detectFromBehavior(behaviors?: Record<string, any>): IndustrySignal[] {
    if (!behaviors) return []

    const signals: IndustrySignal[] = []
    const behaviorLower = JSON.stringify(behaviors).toLowerCase()

    for (const [industry, config] of Object.entries(INDUSTRY_SIGNALS)) {
      for (const [page, relevance] of Object.entries(config.pageBehaviors)) {
        if (behaviorLower.includes(page.toLowerCase())) {
          signals.push({
            type: 'behavior',
            industry: industry as Industry,
            confidence: relevance,
            evidence: `Viewed ${page} page`
          })
        }
      }
    }

    return signals
  }

  /**
   * Detect from form submissions
   */
  private static detectFromFormData(formData?: Record<string, any>): IndustrySignal[] {
    if (!formData) return []

    const signals: IndustrySignal[] = []
    const formStr = JSON.stringify(formData).toLowerCase()

    // Check industry field
    if (formData.industry) {
      const industryField = String(formData.industry).toLowerCase()
      for (const [industry] of Object.entries(INDUSTRY_SIGNALS)) {
        if (industryField.includes(industry.toLowerCase().replace(/_/g, ' '))) {
          signals.push({
            type: 'form',
            industry: industry as Industry,
            confidence: 0.95,
            evidence: 'User selected industry in form'
          })
        }
      }
    }

    // Check company field
    if (formData.company) {
      const company = String(formData.company).toLowerCase()
      for (const [industry, config] of Object.entries(INDUSTRY_SIGNALS)) {
        for (const domain of config.referralDomains) {
          if (company.includes(domain.replace(/\.com/g, '').toLowerCase())) {
            signals.push({
              type: 'form',
              industry: industry as Industry,
              confidence: 0.8,
              evidence: `Company field matches ${domain}`
            })
          }
        }
      }
    }

    return signals
  }

  /**
   * Aggregate signals using Bayesian inference
   */
  private static aggregateSignals(signals: IndustrySignal[]): Record<string, number> {
    const scores: Record<string, number> = {}

    // Initialize with priors (uniform)
    for (const industry of Object.values(Industry)) {
      scores[industry] = 0.2
    }

    if (signals.length === 0) return scores

    // Weight signals by type (referral > form > keyword > behavior)
    const typeWeights = { referral: 1.5, form: 1.4, keyword: 1.0, behavior: 0.8 }

    // Aggregate using multiplicative Bayesian approach
    for (const signal of signals) {
      const weight = typeWeights[signal.type as keyof typeof typeWeights] || 1
      scores[signal.industry] += signal.confidence * weight
    }

    // Normalize to 0-1
    const max = Math.max(...Object.values(scores))
    for (const industry in scores) {
      scores[industry] = max > 0 ? scores[industry] / max : 0
    }

    return scores
  }

  /**
   * Detect user segment (role) from signals
   */
  static detectSegment(input: MLClassifierInput): { segment: UserSegment; confidence: number } {
    const keywords = input.keywords || []
    const keywordStr = keywords.join(' ').toLowerCase()

    const segmentSignals = {
      [UserSegment.EXECUTIVE]: {
        keywords: ['roi', 'investment', 'board', 'strategy', 'cost', 'business case', 'budget'],
        confidence: 0.8
      },
      [UserSegment.TECHNICAL]: {
        keywords: ['api', 'integration', 'architecture', 'scaling', 'deployment', 'technical', 'code'],
        confidence: 0.85
      },
      [UserSegment.OPERATIONS]: {
        keywords: ['monitoring', 'uptime', 'maintenance', 'incident', 'response', 'automation', 'efficiency'],
        confidence: 0.8
      },
      [UserSegment.COMPLIANCE]: {
        keywords: ['compliance', 'audit', 'gdpr', 'security', 'risk', 'policy', 'governance'],
        confidence: 0.9
      }
    }

    let bestSegment = UserSegment.UNKNOWN
    let bestScore = 0

    for (const [segment, config] of Object.entries(segmentSignals)) {
      const matches = config.keywords.filter(k => keywordStr.includes(k)).length
      const score = (matches / config.keywords.length) * config.confidence

      if (score > bestScore) {
        bestScore = score
        bestSegment = segment as UserSegment
      }
    }

    return {
      segment: bestSegment,
      confidence: Math.min(bestScore, 1)
    }
  }

  /**
   * Extract primary pain point from signals
   */
  static extractPainPoint(industry: Industry, keywords?: string[]): string | null {
    if (!keywords) return null

    const painPointMap = {
      [Industry.DATA_CENTERS]: {
        'outage|downtime|availability': 'Preventing Catastrophic Downtime',
        'cost|optimization|efficiency': 'Optimizing Operational Costs',
        'scaling|growth': 'Scaling Infrastructure Seamlessly',
        'latency|performance': 'Achieving Ultra-Low Latency'
      },
      [Industry.UTILITIES]: {
        'outage|blackout|disruption': 'Preventing Grid Failures',
        'demand|load': 'Managing Peak Demand',
        'renewable|sustainability': 'Integrating Renewable Energy',
        'aging|maintenance': 'Maintaining Aging Infrastructure'
      },
      [Industry.AGRICULTURE]: {
        'yield|crop|harvest': 'Maximizing Yield per Acre',
        'water|irrigation': 'Optimizing Water Usage',
        'weather|climate': 'Mitigating Weather Impact',
        'labor|cost': 'Reducing Labor Costs'
      },
      [Industry.OIL_GAS]: {
        'safety|catastrophic': 'Ensuring Operational Safety',
        'compliance|environmental': 'Meeting Regulatory Compliance',
        'downtime|maintenance': 'Minimizing Unplanned Downtime',
        'production|efficiency': 'Maximizing Production Efficiency'
      }
    }

    const painPointMap_ = painPointMap[industry]
    if (!painPointMap_) return null

    const keywordLower = keywords.join(' ').toLowerCase()

    for (const [pattern, painPoint] of Object.entries(painPointMap_)) {
      const regex = new RegExp(pattern, 'i')
      if (regex.test(keywordLower)) {
        return painPoint
      }
    }

    return null
  }
}

export default IndustryDetector
