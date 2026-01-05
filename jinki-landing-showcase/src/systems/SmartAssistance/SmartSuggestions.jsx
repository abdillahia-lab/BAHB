/**
 * ════════════════════════════════════════════════════════════════
 * SMART SUGGESTIONS COMPONENT
 * Context-aware suggestions that appear based on user confusion
 * ════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowDown, Menu, MousePointer, CursorClick, Lightbulb } from 'lucide-react'
import { useSmartSuggestions } from './useSmartAssistance'
import { UI_PATTERNS } from './assistanceConfig'
import './SmartSuggestions.css'

const ICON_MAP = {
  'arrow-down': ArrowDown,
  'menu': Menu,
  'mouse-pointer': MousePointer,
  'cursor-click': CursorClick,
  'lightbulb': Lightbulb,
}

export function SmartSuggestions({ sectionId, autoShow = true }) {
  const { suggestions, hasSuggestions, dismiss, dismissed } = useSmartSuggestions(sectionId)
  const [dismissTimer, setDismissTimer] = useState(null)
  const suggestionStyle = UI_PATTERNS.SUGGESTION

  // Auto-dismiss after timeout
  useEffect(() => {
    if (hasSuggestions && !dismissed) {
      const timer = setTimeout(() => {
        dismiss()
      }, suggestionStyle.autoDismissAfter || 8000)

      setDismissTimer(timer)

      return () => clearTimeout(timer)
    }
  }, [hasSuggestions, dismissed, dismiss, suggestionStyle])

  if (!autoShow || !hasSuggestions || dismissed) {
    return null
  }

  return (
    <div className="smart-suggestions-container">
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            className="smart-suggestions"
            style={{
              background: suggestionStyle.backgroundColor,
              borderLeft: suggestionStyle.borderLeft,
            }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="suggestions-content">
              <div className="suggestions-icon">
                <Lightbulb size={18} />
              </div>

              <div className="suggestions-body">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    className="suggestion-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="suggestion-icon-small">
                      {ICON_MAP[suggestion.icon] &&
                        React.createElement(ICON_MAP[suggestion.icon], {
                          size: 14,
                        })}
                    </div>
                    <span className="suggestion-text">{suggestion.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {suggestionStyle.showTimerBar && <div className="suggestion-timer-bar" />}

            <button
              className="suggestion-close"
              onClick={dismiss}
              aria-label="Dismiss suggestions"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SmartSuggestions
