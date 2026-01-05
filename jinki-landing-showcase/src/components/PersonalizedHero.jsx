/**
 * PersonalizedHero - Dynamic hero section based on user profile
 * Shows personalized headline, messaging, and CTA based on detected industry/segment
 */

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePersonalization } from '../context/PersonalizationContext'
import './PersonalizedHero.css'

export function PersonalizedHero() {
  const {
    heroVariant,
    userProfile,
    trackInteraction,
    detectedIndustry,
    userSegment
  } = usePersonalization()

  useEffect(() => {
    // Track hero view
    if (heroVariant) {
      trackInteraction('personalized-hero', 'hero_view', {
        variant_id: heroVariant.id,
        industry: detectedIndustry,
        segment: userSegment
      })
    }
  }, [heroVariant])

  if (!heroVariant) {
    return <DefaultHero />
  }

  const handleCTAClick = () => {
    trackInteraction('personalized-hero', 'cta_click', {
      variant_id: heroVariant.id,
      cta_text: heroVariant.cta
    })
  }

  return (
    <motion.section
      className="personalized-hero"
      style={{
        backgroundColor: heroVariant.backgroundColor
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Image */}
      <div
        className="hero-background"
        style={{
          backgroundImage: `url(${heroVariant.imageUrl})`
        }}
      />

      {/* Gradient Overlay */}
      <div className="hero-overlay" />

      {/* Content */}
      <div className="hero-content">
        <motion.div
          className="hero-badge"
          style={{ borderColor: heroVariant.accentColor }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <span style={{ color: heroVariant.accentColor }}>
            {getIndustryLabel(detectedIndustry)}
          </span>
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {heroVariant.title}
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {heroVariant.subtitle}
        </motion.p>

        {/* Metrics Row */}
        <motion.div
          className="hero-metrics"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {heroVariant.metrics.map((metric, idx) => (
            <div key={idx} className="metric-item">
              <div className="metric-value" style={{ color: heroVariant.accentColor }}>
                {metric.split(' ')[0]}
              </div>
              <div className="metric-label">{metric.split(' ').slice(1).join(' ')}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <button
            className="hero-cta"
            style={{
              backgroundColor: heroVariant.accentColor,
              color: heroVariant.backgroundColor
            }}
            onClick={handleCTAClick}
          >
            {heroVariant.cta}
            <span className="cta-arrow">→</span>
          </button>
        </motion.div>

        {/* Risk Context (for critical industries) */}
        {heroVariant.riskEmphasis === 'critical' && (
          <motion.p
            className="hero-risk-context"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <span className="risk-icon">⚠️</span>
            {getRiskMessage(detectedIndustry)}
          </motion.p>
        )}
      </div>

      {/* Right-side accent */}
      <motion.div
        className="hero-accent"
        style={{ backgroundColor: heroVariant.accentColor }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      />
    </motion.section>
  )
}

/**
 * Default Hero - Fallback when personalization unavailable
 */
function DefaultHero() {
  return (
    <section className="personalized-hero default-hero">
      <div className="hero-content">
        <h1>Welcome to Jinki Intelligence</h1>
        <p>AI-Powered Solutions for Critical Operations</p>
        <button className="hero-cta">Get Started</button>
      </div>
    </section>
  )
}

/**
 * Helper functions
 */

function getIndustryLabel(industry) {
  const labels = {
    data_centers: 'Data Center Operations',
    utilities: 'Utility Management',
    agriculture: 'Precision Agriculture',
    oil_gas: 'Energy & Gas',
    unknown: 'Enterprise Solutions'
  }
  return labels[industry] || 'Enterprise Solutions'
}

function getRiskMessage(industry) {
  const messages = {
    data_centers: 'Every minute of downtime costs thousands. Jinki prevents catastrophic failures.',
    utilities: 'Grid reliability depends on perfect orchestration. We handle the complexity.',
    agriculture: 'Weather waits for no one. Maximize yield with predictive intelligence.',
    oil_gas: 'Safety is non-negotiable. Real-time monitoring for every asset.',
    unknown: 'Minimize risk while optimizing operations.'
  }
  return messages[industry] || 'Minimize risk while optimizing operations.'
}

export default PersonalizedHero
