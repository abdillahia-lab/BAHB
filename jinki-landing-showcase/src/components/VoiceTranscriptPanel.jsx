/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VOICE TRANSCRIPT PANEL - Accessibility + UX Feature
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Makes voice UI accessible to deaf/HoH users + builds trust with ALL users
 * Shows real-time speech recognition transcript & confidence scores
 *
 * Features:
 * - Live speech-to-text transcription display
 * - Confidence scores (0-100%)
 * - Recognized command/intent visualization
 * - Text alternatives for all voice commands
 * - Accessible with full keyboard navigation
 * - ARIA live regions for announcements
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './VoiceTranscriptPanel.css'

// Map voice commands to display names and descriptions
const VOICE_COMMAND_MAP = {
  'show industries': { intent: 'Navigate to Industries', description: 'Scroll to industries section' },
  'show solutions': { intent: 'Navigate to Industries', description: 'Scroll to industries section' },
  'show platform': { intent: 'Navigate to Platform', description: 'View platform features' },
  'show features': { intent: 'Navigate to Platform', description: 'View platform features' },
  'show advisory': { intent: 'Navigate to Advisory', description: 'View cybersecurity expertise' },
  'show contact': { intent: 'Navigate to Contact', description: 'Show contact section' },
  'roi calculator': { intent: 'Open ROI Calculator', description: 'Launch ROI calculator tool' },
  'start': { intent: 'Get Started', description: 'Begin onboarding process' },
}

/**
 * Get confidence color based on percentage
 */
function getConfidenceColor(confidence) {
  if (confidence >= 0.8) return 'high' // green
  if (confidence >= 0.6) return 'medium' // yellow
  return 'low' // red
}

/**
 * Format timestamp for display
 */
function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

export default function VoiceTranscriptPanel({
  isOpen = true,
  transcript = '',
  isFinal = false,
  confidence = 0,
  recognizedCommand = null,
  isListening = false,
  onCommandSelect = null,
  onClose = null,
  position = 'bottom'
}) {
  const [history, setHistory] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Add to history when final transcript received
  useEffect(() => {
    if (isFinal && transcript.trim()) {
      const commandData = VOICE_COMMAND_MAP[transcript.toLowerCase()] || {
        intent: 'Unknown Command',
        description: 'Command not recognized'
      }

      setHistory(prev => [...prev, {
        id: `cmd-${Date.now()}`,
        transcript,
        confidence,
        intent: commandData.intent,
        description: commandData.description,
        timestamp: new Date(),
        status: recognizedCommand ? 'recognized' : 'unrecognized'
      }])
    }
  }, [isFinal, transcript, confidence, recognizedCommand])

  if (!isOpen) return null

  const confidencePercent = Math.round(confidence * 100)
  const confidenceColor = getConfidenceColor(confidence)

  return (
    <AnimatePresence>
      <motion.div
        className={`voice-transcript-panel voice-transcript-panel--${position}`}
        initial={{ opacity: 0, y: position === 'bottom' ? 50 : -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'bottom' ? 50 : -50 }}
        transition={{ duration: 0.3 }}
        role="region"
        aria-label="Voice command transcript and status"
        aria-live="polite"
        aria-atomic="false"
      >
        {/* Current Listening State */}
        <div className="vtp-listening-state">
          <motion.div
            className="vtp-listening-indicator"
            animate={{
              scale: isListening ? [1, 1.2, 1] : 1,
              opacity: isListening ? [1, 0.6, 1] : 0.5,
            }}
            transition={{
              duration: 1,
              repeat: isListening ? Infinity : 0,
            }}
            aria-hidden="true"
          >
            ◉
          </motion.div>

          <div className="vtp-listening-text">
            <div className="vtp-status">
              {isListening ? (
                <>
                  <span className="vtp-listening-label">Listening...</span>
                  <span className="vtp-listening-hint">Speak now</span>
                </>
              ) : (
                <span className="vtp-idle-label">Ready to listen</span>
              )}
            </div>
          </div>

          {onClose && (
            <button
              className="vtp-close-btn"
              onClick={onClose}
              aria-label="Close voice transcript panel"
              title="Close panel"
            >
              ✕
            </button>
          )}
        </div>

        {/* Current Transcript */}
        {transcript && (
          <div className="vtp-current">
            <div className="vtp-transcript">
              <p className="vtp-transcript-text">
                <span aria-label="Transcript">"{transcript}"</span>
              </p>

              {/* Confidence Display */}
              <div className="vtp-confidence">
                <div className={`vtp-confidence-bar vtp-confidence-bar--${confidenceColor}`}>
                  <motion.div
                    className="vtp-confidence-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${confidencePercent}%` }}
                    transition={{ duration: 0.3 }}
                    aria-hidden="true"
                  />
                </div>
                <div className="vtp-confidence-text">
                  <span
                    className={`vtp-confidence-percent vtp-confidence-percent--${confidenceColor}`}
                    role="status"
                    aria-label={`Confidence score ${confidencePercent} percent`}
                  >
                    {confidencePercent}%
                  </span>
                  <span className="vtp-confidence-label">
                    {confidenceColor === 'high' && 'High confidence'}
                    {confidenceColor === 'medium' && 'Medium confidence'}
                    {confidenceColor === 'low' && 'Low confidence'}
                  </span>
                </div>
              </div>

              {/* Recognized Intent */}
              {recognizedCommand && (
                <motion.div
                  className="vtp-recognized"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  role="status"
                  aria-live="assertive"
                >
                  <span className="vtp-recognized-icon">✓</span>
                  <div className="vtp-recognized-text">
                    <span className="vtp-recognized-label">Command recognized</span>
                    <span className="vtp-recognized-intent">
                      {VOICE_COMMAND_MAP[recognizedCommand]?.intent || 'Processing...'}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Command Alternatives List */}
        <div className="vtp-alternatives">
          <div className="vtp-alternatives-header">
            <h4>Voice Commands (or click below)</h4>
            <p className="vtp-hint">
              Can't use voice? Select a command or press Tab to navigate
            </p>
          </div>

          <div
            className="vtp-command-buttons"
            role="group"
            aria-label="Available voice commands"
          >
            {Object.entries(VOICE_COMMAND_MAP).map(([command, { intent, description }], idx) => (
              <motion.button
                key={command}
                className={`vtp-command-btn ${selectedIndex === idx ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedIndex(idx)
                  onCommandSelect?.(command)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setSelectedIndex(Math.min(idx + 1, Object.keys(VOICE_COMMAND_MAP).length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setSelectedIndex(Math.max(idx - 1, 0))
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                tabIndex={selectedIndex === idx ? 0 : -1}
                aria-label={`${command}: ${intent}. ${description}`}
                title={description}
              >
                <span className="vtp-cmd-text">{command}</span>
                <span className="vtp-cmd-intent">{intent}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* History Log */}
        {history.length > 0 && (
          <details className="vtp-history">
            <summary className="vtp-history-toggle">
              Command History
              <span className="vtp-history-count" aria-label={`${history.length} commands`}>
                ({history.length})
              </span>
            </summary>

            <div
              className="vtp-history-list"
              role="log"
              aria-label="Recent voice commands"
            >
              <AnimatePresence>
                {history.slice(-5).reverse().map((item) => (
                  <motion.div
                    key={item.id}
                    className={`vtp-history-item vtp-history-item--${item.status}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="vtp-history-time">
                      {formatTime(item.timestamp)}
                    </div>
                    <div className="vtp-history-content">
                      <div className="vtp-history-transcript">
                        "{item.transcript}"
                      </div>
                      <div className="vtp-history-meta">
                        <span className="vtp-history-status">
                          {item.status === 'recognized' ? '✓ ' : '○ '}
                          {item.intent}
                        </span>
                        <span
                          className={`vtp-history-confidence vtp-history-confidence--${getConfidenceColor(item.confidence)}`}
                          aria-label={`Confidence ${Math.round(item.confidence * 100)} percent`}
                        >
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </details>
        )}

        {/* Accessibility Note */}
        <div className="vtp-a11y-note" role="status">
          <span className="vtp-a11y-icon">♿</span>
          <span className="vtp-a11y-text">
            Full keyboard navigation available. Use Tab to navigate, Enter to select.
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
