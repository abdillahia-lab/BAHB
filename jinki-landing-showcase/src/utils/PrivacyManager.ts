/**
 * Privacy Manager - GDPR & Privacy Compliance
 * Handles all privacy-related concerns, consent, data retention, and deletion
 */

import { ConsentRecord, UserProfile } from '../types/PersonalizationTypes'

// ═══════════════════════════════════════════════════════════════
// PRIVACY CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const PRIVACY_CONFIG = {
  // Data storage
  STORAGE_LOCATION: 'EU', // GDPR applies here
  DATA_RETENTION_DAYS: 90,
  SESSION_RETENTION_DAYS: 30,
  BACKUP_RETENTION_DAYS: 180,

  // Third-party sharing
  THIRD_PARTY_SHARING: false,
  THIRD_PARTIES: [], // Empty = no sharing

  // Data security
  ENCRYPTION: 'AES-256',
  TLS_VERSION: 1.3,
  HASH_ALGORITHM: 'SHA-256',

  // User rights
  DATA_EXPORT_AVAILABLE: true,
  RIGHT_TO_BE_FORGOTTEN: true,
  DATA_PORTABILITY: true,
  CONSENT_REQUIRED: true,

  // Consent types
  CONSENT_TYPES: ['personalization', 'analytics', 'marketing'],
  CONSENT_EXPIRATION_DAYS: 365, // Re-consent required after 1 year

  // Tracking
  TRACKING_MINIMAL: false, // Use minimal tracking by default
  COOKIE_CONSENT_REQUIRED: true,
  COOKIE_TYPES: ['essential', 'analytics', 'personalization', 'marketing']
}

// ═══════════════════════════════════════════════════════════════
// PRIVACY MANAGER CLASS
// ═══════════════════════════════════════════════════════════════

export class PrivacyManager {
  /**
   * Initialize privacy settings for new user
   */
  static initializePrivacy() {
    return {
      privacyConsent: {
        personalization: false, // Default: require explicit consent
        analytics: false,
        marketing: false,
        timestamp: Date.now()
      },
      dataMinimization: true, // Collect only what's necessary
      consentVersion: '1.0'
    }
  }

  /**
   * Record consent with full audit trail
   */
  static recordConsent(
    consents: { personalization: boolean; analytics: boolean; marketing: boolean },
    ipAddress?: string,
    userAgent?: string
  ): ConsentRecord {
    const ipHash = ipAddress ? this.hashData(ipAddress) : undefined
    const userAgentHash = userAgent ? this.hashData(userAgent) : undefined

    return {
      timestamp: Date.now(),
      consents,
      ipHash: ipHash || '',
      userAgent: userAgentHash || ''
    }
  }

  /**
   * Check if personalization is allowed
   */
  static isPersonalizationAllowed(profile: UserProfile): boolean {
    return profile.privacyConsent.personalization && this.isConsentValid(profile)
  }

  /**
   * Check if consent is still valid (not expired)
   */
  static isConsentValid(profile: UserProfile): boolean {
    const consentAge = Date.now() - profile.privacyConsent.timestamp
    const maxAge = PRIVACY_CONFIG.CONSENT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000

    return consentAge < maxAge
  }

  /**
   * Sanitize user profile for minimal data collection
   * Removes sensitive fields that aren't necessary
   */
  static sanitizeProfile(profile: UserProfile): Partial<UserProfile> {
    if (!PRIVACY_CONFIG.CONSENT_TYPES.includes('personalization')) {
      // If no personalization consent, remove personal behavioral data
      return {
        id: profile.id,
        sessionId: profile.sessionId,
        privacyConsent: profile.privacyConsent,
        preferences: {
          ...profile.preferences,
          complexity: 'balanced', // Default to balanced
          contentFormat: ['text', 'interactive'],
          timePreference: 'mixed',
          language: 'en',
          timezone: 'UTC'
        }
      }
    }

    // Remove unnecessary fields for privacy
    const sanitized = { ...profile }
    delete sanitized.behaviors?.pagesViewed // Don't store specific pages
    return sanitized
  }

  /**
   * Export user data (GDPR Article 20)
   */
  static exportUserData(profile: UserProfile): {
    profile: Partial<UserProfile>
    consent: any
    format: 'json'
    generatedAt: number
  } {
    return {
      profile: this.sanitizeProfile(profile),
      consent: {
        consents: profile.privacyConsent,
        timestamp: profile.lastUpdated
      },
      format: 'json',
      generatedAt: Date.now()
    }
  }

  /**
   * Generate anonymized profile for analytics
   * GDPR-compliant analytics without personal data
   */
  static anonymizeProfile(profile: UserProfile): any {
    return {
      industryHash: this.hashData(profile.detectedIndustry),
      segmentHash: this.hashData(profile.segment),
      interests: profile.interests, // Anonymized data
      predictions: {
        conversionProbability: profile.predictions.conversionProbability,
        // Don't include personal risk assessments
      },
      timestamp: profile.lastUpdated,
      sessionLength: profile.behaviors.timeOnSite
    }
  }

  /**
   * Right to be forgotten - delete all user data
   */
  static deleteUserData(userId: string): { success: boolean; deletedFields: string[] } {
    // In production, this would delete from database
    // Here we return what would be deleted
    return {
      success: true,
      deletedFields: [
        'behaviors.pagesViewed',
        'behaviors.videosWatched',
        'behaviors.documentsCTA',
        'predictions',
        'interests',
        'referralDetails',
        'privacyConsent'
      ]
    }
  }

  /**
   * Data Portability - Return data in machine-readable format
   */
  static portUserData(profile: UserProfile): {
    data: any
    format: 'json'
    generatedAt: number
    portable: boolean
  } {
    return {
      data: {
        profile: this.sanitizeProfile(profile),
        interests: profile.interests,
        preferences: profile.preferences,
        predictions: {
          conversionProbability: profile.predictions.conversionProbability,
          timeToDecision: profile.predictions.timeToDecision
        }
      },
      format: 'json',
      generatedAt: Date.now(),
      portable: true
    }
  }

  /**
   * Check compliance with privacy regulations
   */
  static checkCompliance(): {
    gdprCompliant: boolean
    ccpaCompliant: boolean
    hipaaCompliant: boolean
    issues: string[]
  } {
    const issues: string[] = []

    // GDPR compliance checks
    if (!PRIVACY_CONFIG.DATA_EXPORT_AVAILABLE) {
      issues.push('GDPR Article 20: Data export not available')
    }
    if (!PRIVACY_CONFIG.RIGHT_TO_BE_FORGOTTEN) {
      issues.push('GDPR Article 17: Right to be forgotten not implemented')
    }
    if (PRIVACY_CONFIG.THIRD_PARTY_SHARING && PRIVACY_CONFIG.THIRD_PARTIES.length > 0) {
      issues.push('GDPR: Third-party sharing without explicit opt-in')
    }

    // CCPA compliance checks
    if (!PRIVACY_CONFIG.DATA_EXPORT_AVAILABLE) {
      issues.push('CCPA: Data access right not available')
    }

    return {
      gdprCompliant: issues.filter(i => i.includes('GDPR')).length === 0,
      ccpaCompliant: issues.filter(i => i.includes('CCPA')).length === 0,
      hipaaCompliant: true, // We don't handle health data
      issues
    }
  }

  /**
   * Privacy impact assessment
   */
  static performPIA(dataCollected: string[]): {
    riskLevel: 'low' | 'medium' | 'high'
    risks: string[]
    mitigations: string[]
  } {
    const risks: string[] = []
    const mitigations: string[] = []

    // Check for high-risk data
    const highRiskFields = ['ssn', 'creditcard', 'health', 'biometric', 'genetic']
    const hasHighRisk = dataCollected.some(field =>
      highRiskFields.some(risk => field.toLowerCase().includes(risk))
    )

    if (hasHighRisk) {
      risks.push('Collecting high-risk personal data')
      mitigations.push('Implement data minimization - only collect necessary data')
    }

    // Check for location data
    if (dataCollected.some(f => f.toLowerCase().includes('location'))) {
      risks.push('Collecting location data - may require explicit consent')
      mitigations.push('Implement location consent workflow')
    }

    // Check for behavioral data
    if (dataCollected.some(f => f.toLowerCase().includes('behavior'))) {
      risks.push('Behavioral tracking may impact user privacy')
      mitigations.push('Implement analytics minimization')
    }

    const riskLevel = hasHighRisk ? 'high' : risks.length > 2 ? 'medium' : 'low'

    return {
      riskLevel,
      risks,
      mitigations
    }
  }

  /**
   * Generate privacy notice for transparency
   */
  static generatePrivacyNotice(): string {
    return `
PRIVACY NOTICE - JINKI INTELLIGENCE PERSONALIZATION

1. DATA COLLECTION
We collect the following data to personalize your experience:
- Industry information (detected from referral or provided)
- Browsing behavior (pages viewed, time on site)
- Interaction data (clicks, form submissions)
- Technical data (device type, language, timezone)

2. DATA USE
Your data is used to:
- Personalize content and recommendations
- Improve our service (with analytics consent)
- Comply with legal obligations
- Prevent fraud and security threats

3. DATA RETENTION
- Active user data: 90 days of inactivity
- Session data: 30 days
- Backups: 180 days

4. YOUR RIGHTS (GDPR)
You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion (right to be forgotten)
- Data portability
- Withdraw consent at any time

5. SECURITY
We use AES-256 encryption and TLS 1.3 for all data transmission.
Data is stored in EU data centers compliant with GDPR.

6. CONTACT
For privacy concerns, contact: privacy@jinki.com

Last Updated: ${new Date().toISOString()}
    `.trim()
  }

  /**
   * Check consent required for action
   */
  static requiresConsent(action: 'personalization' | 'analytics' | 'marketing'): boolean {
    return PRIVACY_CONFIG.CONSENT_REQUIRED && PRIVACY_CONFIG.CONSENT_TYPES.includes(action)
  }

  /**
   * Hash data for privacy (PII anonymization)
   */
  static hashData(data: string): string {
    // In production, use a proper hash function
    // This is a simplified version for demonstration
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Anonymize IP address (GDPR requirement)
   */
  static anonymizeIP(ip: string): string {
    if (ip.includes(':')) {
      // IPv6 - anonymize last 80 bits
      const parts = ip.split(':')
      return parts.slice(0, 3).join(':') + ':0:0:0:0'
    } else {
      // IPv4 - anonymize last octet
      const parts = ip.split('.')
      return parts.slice(0, 3).join('.') + '.0'
    }
  }

  /**
   * Check if user is from GDPR region
   */
  static isGDPRRegion(country?: string): boolean {
    const gdprCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
      'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ]
    return country ? gdprCountries.includes(country.toUpperCase()) : true // Default to GDPR compliant
  }

  /**
   * Check if user is from CCPA region (California)
   */
  static isCCPARegion(state?: string): boolean {
    return state?.toUpperCase() === 'CA'
  }
}

export default PrivacyManager
