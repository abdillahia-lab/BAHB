/**
 * VoiceEnabledForm - Form with Voice Input Support
 *
 * Allows:
 * - Voice-to-text field filling
 * - Voice form submission
 * - Voice field navigation
 * - Voice-based confirmation
 */

import React, { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useVoiceCommand } from '../hooks/useVoiceCommand'
import { useTextToSpeech } from '../hooks/useTextToSpeech'
import { announceForAccessibility, FocusManager } from '../utils/voiceAccessibility'
import './VoiceEnabledForm.css'

export function VoiceEnabledForm({
  fields = [],
  onSubmit = null,
  title = 'Voice Form',
  description = '',
  enableVoiceInput = true,
  language = 'en-US',
}) {
  const [formData, setFormData] = useState(Object.fromEntries(fields.map((f) => [f.name, ''])))
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [voiceMode, setVoiceMode] = useState(false)
  const [recordingFieldName, setRecordingFieldName] = useState(null)
  const formRef = useRef(null)

  const voiceCommand = useVoiceCommand({
    enabled: enableVoiceInput,
    language,
    wakeWord: 'hey',
    onCommand: handleVoiceFormCommand,
  })

  const tts = useTextToSpeech({
    enabled: true,
    language,
  })

  // Handle voice form commands
  function handleVoiceFormCommand(command) {
    const currentField = fields[currentFieldIndex]

    // Check for navigation commands
    if (command.command === 'next_field' || command.transcript.includes('next')) {
      moveToNextField()
      return
    }

    if (command.command === 'previous_field' || command.transcript.includes('previous')) {
      moveToPreviousField()
      return
    }

    if (command.command === 'submit_form' || command.transcript.includes('submit')) {
      submitForm()
      return
    }

    // Otherwise, treat as input for current field
    if (currentField && voiceMode && recordingFieldName === currentField.name) {
      const value = command.transcript.trim()
      setFormData((prev) => ({
        ...prev,
        [currentField.name]: value,
      }))

      announceForAccessibility(`${currentField.label} set to ${value}`)
      tts.announce(`Field set to: ${value}`)
    }
  }

  // Move to next field
  const moveToNextField = useCallback(() => {
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1)
      announceForAccessibility(`Moved to ${fields[currentFieldIndex + 1].label} field`)
      setTimeout(() => {
        tts.announce(`${fields[currentFieldIndex + 1].label}`)
      }, 200)
    } else {
      announceForAccessibility('Last field reached')
      tts.announce('You have reached the last field. Say submit to send the form.')
    }
  }, [currentFieldIndex, fields, tts])

  // Move to previous field
  const moveToPreviousField = useCallback(() => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1)
      announceForAccessibility(`Moved to ${fields[currentFieldIndex - 1].label} field`)
      setTimeout(() => {
        tts.announce(`${fields[currentFieldIndex - 1].label}`)
      }, 200)
    } else {
      announceForAccessibility('First field reached')
    }
  }, [currentFieldIndex, fields, tts])

  // Toggle voice mode for current field
  const toggleVoiceMode = useCallback(() => {
    const newMode = !voiceMode
    setVoiceMode(newMode)

    if (newMode) {
      const fieldName = fields[currentFieldIndex]?.name
      setRecordingFieldName(fieldName)
      voiceCommand.startListening()
      announceForAccessibility(`Voice input enabled for ${fields[currentFieldIndex].label}`)
      tts.announce(`Say something to fill ${fields[currentFieldIndex].label}`)
    } else {
      voiceCommand.stopListening()
      announceForAccessibility('Voice input disabled')
    }
  }, [voiceMode, currentFieldIndex, fields, voiceCommand, tts])

  // Submit form
  const submitForm = useCallback(() => {
    setVoiceMode(false)
    voiceCommand.stopListening()

    if (onSubmit) {
      onSubmit(formData)
    }

    announceForAccessibility('Form submitted')
    tts.announce('Form submitted successfully')
  }, [formData, onSubmit, voiceCommand, tts])

  // Handle text input
  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const currentField = fields[currentFieldIndex]

  return (
    <motion.div
      className="voice-enabled-form"
      ref={formRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="vef-header">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {/* Progress */}
      <div className="vef-progress">
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${((currentFieldIndex + 1) / fields.length) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          {currentFieldIndex + 1} of {fields.length}
        </span>
      </div>

      {/* Fields */}
      <div className="vef-fields">
        {fields.map((field, idx) => (
          <motion.div
            key={field.name}
            className={`vef-field ${idx === currentFieldIndex ? 'active' : ''} ${
              idx < currentFieldIndex ? 'completed' : ''
            }`}
            animate={{
              opacity: idx === currentFieldIndex ? 1 : 0.5,
              scale: idx === currentFieldIndex ? 1 : 0.95,
            }}
          >
            <label htmlFor={field.name}>{field.label}</label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                placeholder={field.placeholder || 'Type here...'}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                disabled={voiceMode && recordingFieldName !== field.name}
                aria-label={field.label}
              />
            ) : (
              <input
                id={field.name}
                type={field.type || 'text'}
                name={field.name}
                placeholder={field.placeholder || 'Type here...'}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                disabled={voiceMode && recordingFieldName !== field.name}
                aria-label={field.label}
              />
            )}

            {/* Voice input button */}
            {idx === currentFieldIndex && enableVoiceInput && (
              <motion.button
                className={`vef-voice-btn ${voiceMode ? 'recording' : ''}`}
                onClick={toggleVoiceMode}
                aria-label={voiceMode ? 'Stop voice input' : 'Start voice input'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {voiceMode ? (
                  <>
                    <span className="recording-indicator" />
                    Recording...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    Voice Input
                  </>
                )}
              </motion.button>
            )}

            {voiceMode && recordingFieldName === field.name && voiceCommand.transcript && (
              <p className="vef-transcript">Heard: "{voiceCommand.transcript}"</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="vef-controls">
        <button
          className="vef-btn prev"
          onClick={moveToPreviousField}
          disabled={currentFieldIndex === 0}
          aria-label="Previous field"
        >
          ← Previous
        </button>

        <div className="vef-field-info">
          <span className="field-name">{currentField?.label}</span>
          {voiceCommand.isListening && <span className="listening-indicator">●</span>}
        </div>

        <button
          className="vef-btn next"
          onClick={moveToNextField}
          disabled={currentFieldIndex === fields.length - 1}
          aria-label="Next field"
        >
          Next →
        </button>
      </div>

      {/* Submit */}
      <motion.button
        className="vef-submit"
        onClick={submitForm}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Submit form"
      >
        <span>Submit Form</span>
        <span className="submit-hint">(or say "submit")</span>
      </motion.button>

      {/* Help */}
      <div className="vef-help">
        <p>Voice Commands:</p>
        <ul>
          <li>"next" - Move to next field</li>
          <li>"previous" - Go to previous field</li>
          <li>"submit" - Submit form</li>
        </ul>
      </div>
    </motion.div>
  )
}

export default VoiceEnabledForm
