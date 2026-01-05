/**
 * ════════════════════════════════════════════════════════════════
 * FORM ASSISTANCE COMPONENT
 * Smart form field validation and contextual hints
 * ════════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import { useFormAssistance } from './useSmartAssistance'
import { UI_PATTERNS } from './assistanceConfig'
import './FormAssistance.css'

export function FormAssistance({
  fieldName,
  label,
  placeholder,
  type = 'text',
  config = {},
  onChange,
  value,
  required = false,
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [localValue, setLocalValue] = useState(value || '')
  const {
    hint,
    error,
    suggestions,
    isValidating,
    validateField,
    clearHint,
    selectSuggestion,
  } = useFormAssistance(fieldName, config)

  const formHelperStyle = UI_PATTERNS.FORM_HELPER

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    validateField(localValue)
  }, [localValue, validateField])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    clearHint()
  }, [clearHint])

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value
      setLocalValue(newValue)
      validateField(newValue)
      onChange?.(newValue)
    },
    [validateField, onChange]
  )

  const handleSuggestionClick = useCallback(
    (suggestion) => {
      setLocalValue(suggestion)
      selectSuggestion(suggestion)
      validateField(suggestion)
      onChange?.(suggestion)
    },
    [selectSuggestion, validateField, onChange]
  )

  const isValid = !error && localValue.length > 0
  const hasError = error && localValue.length > 0

  return (
    <div className="form-assistance-wrapper">
      {/* Field Label */}
      {label && (
        <label className="form-field-label" htmlFor={fieldName}>
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className={`form-field-container ${isFocused ? 'focused' : ''}`}>
        <input
          id={fieldName}
          type={type}
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`form-field-input ${hasError ? 'error' : ''} ${
            isValid ? 'valid' : ''
          }`}
          aria-invalid={hasError}
          aria-describedby={`${fieldName}-hint`}
        />

        {/* Status Icon */}
        <div className="form-field-status">
          {isValidating && (
            <div className="spinner" title="Validating..." />
          )}
          {isValid && (
            <CheckCircle2 size={16} className="status-icon valid" />
          )}
          {hasError && (
            <AlertCircle size={16} className="status-icon error" />
          )}
        </div>
      </div>

      {/* Hint & Error Messages */}
      <AnimatePresence mode="wait">
        {hint && !error && (
          <motion.div
            key="hint"
            className="form-assistance-message hint"
            style={{
              color: formHelperStyle.color,
              backgroundColor: formHelperStyle.backgroundColor,
              borderLeft: formHelperStyle.borderLeft,
            }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <HelpCircle size={14} />
            <span>{hint}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            className="form-assistance-message error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {suggestions.length > 0 && isFocused && (
          <motion.div
            className="form-suggestions-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                className="suggestion-option"
                onClick={() => handleSuggestionClick(suggestion)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="suggestion-text">{suggestion}</span>
                <span className="suggestion-hint">Click to use</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FormAssistance
