/**
 * ════════════════════════════════════════════════════════════════
 * READING TIME COMPONENT
 * Smart reading time estimation for content sections
 * ════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useReadingTime } from './useSmartAssistance'
import { UI_PATTERNS } from './assistanceConfig'
import './ReadingTime.css'

export function ReadingTime({
  content,
  position = 'top-right',
  showIcon = true,
  className = '',
}) {
  const { minutes, display } = useReadingTime(content)
  const readingTimeStyle = UI_PATTERNS.READING_TIME

  if (minutes === 0) {
    return null
  }

  return (
    <motion.div
      className={`reading-time ${position} ${className}`}
      style={{
        color: readingTimeStyle.color,
        fontSize: readingTimeStyle.fontSize,
        backgroundColor: readingTimeStyle.backgroundColor,
        padding: readingTimeStyle.padding,
        borderRadius: readingTimeStyle.borderRadius,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {showIcon && (
        <span className="reading-time-icon">
          <Clock size={12} />
        </span>
      )}
      <span className="reading-time-text">{display}</span>
    </motion.div>
  )
}

export default ReadingTime
