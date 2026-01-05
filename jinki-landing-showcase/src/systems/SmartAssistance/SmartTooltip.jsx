/**
 * ════════════════════════════════════════════════════════════════
 * SMART TOOLTIP COMPONENT
 * Contextual, non-intrusive help tooltips
 * ════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useSmartTooltip } from './useSmartAssistance'
import { UI_PATTERNS } from './assistanceConfig'
import './SmartTooltip.css'

export function SmartTooltip({
  id,
  title,
  content,
  children,
  trigger = 'hover',
  position = 'top',
  autoShow = false,
  delay = 1500,
  className = '',
}) {
  const tooltip = useSmartTooltip(id, { position })
  const [isHovered, setIsHovered] = useState(false)
  const [showDelay, setShowDelay] = useState(!autoShow)

  useEffect(() => {
    if (!autoShow) return

    const timer = setTimeout(() => {
      setShowDelay(false)
      tooltip.show()
    }, delay)

    return () => clearTimeout(timer)
  }, [autoShow, delay, tooltip])

  useEffect(() => {
    if (trigger === 'hover' && isHovered && showDelay) {
      const timer = setTimeout(() => {
        tooltip.show()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isHovered, showDelay, trigger, tooltip])

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    tooltip.hide()
  }

  const tooltipStyle = UI_PATTERNS.TOOLTIP

  return (
    <div
      ref={tooltip.elementRef}
      className={`smart-tooltip-wrapper ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {tooltip.shouldShow && (
          <motion.div
            className="smart-tooltip"
            style={{
              backgroundColor: tooltipStyle.backgroundColor,
              color: tooltipStyle.textColor,
              maxWidth: tooltipStyle.maxWidth,
              fontSize: tooltipStyle.fontSize,
              padding: tooltipStyle.padding,
              borderRadius: tooltipStyle.borderRadius,
              border: `1px solid ${tooltipStyle.borderColor}`,
              backdropFilter: tooltipStyle.backdropFilter,
              boxShadow: tooltipStyle.boxShadow,
              zIndex: tooltipStyle.zIndex,
              top: `${tooltip.position.top}px`,
              left: `${tooltip.position.left}px`,
            }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="smart-tooltip-content">
              {title && <div className="smart-tooltip-title">{title}</div>}
              <div className="smart-tooltip-body">{content}</div>
            </div>

            <button
              className="smart-tooltip-close"
              onClick={tooltip.dismiss}
              aria-label="Close tooltip"
            >
              <X size={14} />
            </button>

            {/* Gradient arrow pointing to element */}
            <div className="smart-tooltip-arrow" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SmartTooltip
