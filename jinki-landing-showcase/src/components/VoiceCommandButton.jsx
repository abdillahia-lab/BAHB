/**
 * VoiceCommandButton - Voice Control Trigger Component
 *
 * Displays voice command status and provides visual feedback
 * Shows listening state, confidence level, and last command
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useVoice } from '../context/VoiceCommandContext'
import './VoiceCommandButton.css'

export function VoiceCommandButton({ className = '' }) {
  const { voiceCommand, setShowVoiceIndicator, showVoiceIndicator, commandResponse } = useVoice()
  const [isHovering, setIsHovering] = useState(false)

  return (
    <motion.div
      className={`voice-command-button ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
    >
      <button
        className={`voice-btn ${voiceCommand.isListening ? 'listening' : ''} ${
          showVoiceIndicator ? 'active' : ''
        }`}
        onClick={() => {
          voiceCommand.toggleListening()
          setShowVoiceIndicator(!showVoiceIndicator)
        }}
        title={voiceCommand.isListening ? 'Voice listening... Say "Hey Jinki"' : 'Click to enable voice'}
        aria-label={voiceCommand.isListening ? 'Voice listening active' : 'Activate voice commands'}
        aria-pressed={voiceCommand.isListening}
      >
        {/* Microphone icon */}
        <svg className="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>

        {/* Listening indicator */}
        {voiceCommand.isListening && (
          <div className="listening-indicator">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="pulse-ring"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }}
              />
            ))}
          </div>
        )}

        {/* Confidence indicator */}
        {voiceCommand.isListening && (
          <div className="confidence-indicator">
            <div
              className="confidence-bar"
              style={{ width: `${voiceCommand.confidence * 100}%` }}
            />
          </div>
        )}
      </button>

      {/* Tooltip */}
      <motion.div
        className="voice-tooltip"
        animate={{ opacity: isHovering ? 1 : 0, y: isHovering ? 0 : 10 }}
        transition={{ duration: 0.2 }}
        pointerEvents="none"
      >
        <p>
          {voiceCommand.isListening ? (
            <>
              <span className="listening-status">Listening...</span>
              <span className="listening-hint">Say "Hey Jinki" to start</span>
            </>
          ) : (
            <>
              <span className="idle-status">Voice Commands</span>
              <span className="idle-hint">Click to activate</span>
            </>
          )}
        </p>
        {commandResponse && (
          <p className="last-command">Last: {commandResponse.text}</p>
        )}
      </motion.div>

      {/* Browser support warning */}
      {!voiceCommand.isSupported && (
        <div className="voice-warning" title="Voice not supported">
          <span>Voice unavailable</span>
        </div>
      )}
    </motion.div>
  )
}

export default VoiceCommandButton
