/**
 * ════════════════════════════════════════════════════════════════
 * SMART RECOMMENDATIONS COMPONENT
 * "You might also like" intelligent suggestions
 * ════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useRecommendations } from './useSmartAssistance'
import { UI_PATTERNS } from './assistanceConfig'
import './SmartRecommendations.css'

export function SmartRecommendations({
  sectionId,
  variant = 'card',
  className = '',
}) {
  const { recommendations, trackClick } = useRecommendations(sectionId)
  const recStyle = UI_PATTERNS.RECOMMENDATION

  if (recommendations.length === 0) {
    return null
  }

  return (
    <motion.div
      className={`smart-recommendations ${variant} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
    >
      <div className="recommendations-header">
        <div className="recommendations-title">
          <Sparkles size={16} />
          You might also like
        </div>
      </div>

      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <motion.a
            key={rec.id}
            href={`#${rec.sectionId}`}
            className="recommendation-card"
            onClick={() => trackClick(rec.id)}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="rec-badge">{index + 1}</div>

            <div className="rec-content">
              <h3 className="rec-title">{rec.title}</h3>
              <p className="rec-description">{rec.description}</p>
            </div>

            <div className="rec-arrow">
              <ArrowRight size={14} />
            </div>

            {/* Glow effect on hover */}
            <div className="rec-glow" />
          </motion.a>
        ))}
      </div>
    </motion.div>
  )
}

export default SmartRecommendations
