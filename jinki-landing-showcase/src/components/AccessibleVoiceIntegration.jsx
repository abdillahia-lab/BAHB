/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ACCESSIBLE VOICE INTEGRATION - HOC for Voice + Transcript Panel
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Wraps voice UI components with real-time transcript display
 * Provides full accessibility for voice-first experiences
 *
 * Usage:
 * <AccessibleVoiceIntegration onCommandExecute={handleCommand}>
 *   <VoiceControlPanel />
 * </AccessibleVoiceIntegration>
 */

import React, { useState, useCallback, useRef } from 'react'
import { useVoiceTranscript } from '../hooks/useVoiceTranscript'
import VoiceTranscriptPanel from './VoiceTranscriptPanel'

// Command recognition patterns
const COMMAND_PATTERNS = {
  'industries': ['show industries', 'show solutions', 'industries'],
  'platform': ['show platform', 'show features', 'platform'],
  'advisory': ['show advisory', 'show experts', 'advisory', 'cybersecurity'],
  'contact': ['show contact', 'contact us', 'get contact', 'show contact section'],
  'roi': ['roi calculator', 'roi', 'calculate roi', 'see roi', 'show roi'],
  'start': ['get started', 'start', 'begin', 'start demo'],
}

/**
 * Recognize voice command from transcript
 */
function recognizeCommand(transcript, threshold = 0.5) {
  const normalized = transcript.toLowerCase().trim()

  for (const [command, patterns] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        return command
      }
    }
  }

  return null
}

export default function AccessibleVoiceIntegration({
  children,
  onCommandExecute = null,
  panelPosition = 'bottom',
  showPanel = true,
  language = 'en-US',
  onTranscriptChange = null,
}) {
  const [recognizedCommand, setRecognizedCommand] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [currentConfidence, setCurrentConfidence] = useState(0)
  const lastFinalTranscriptRef = useRef('')

  // Initialize voice transcript hook
  const {
    isSupported,
    isListening: vrIsListening,
    transcript,
    isFinal,
    confidence,
    language: vrLanguage,
    start,
    stop,
    abort,
    clear,
    changeLanguage,
  } = useVoiceTranscript({
    language,
    interimResults: true,
    continuous: true,
    onFinal: (finalTranscript, conf) => {
      handleFinalTranscript(finalTranscript, conf)
    },
    onConfidence: (conf) => {
      setCurrentConfidence(conf)
    },
  })

  // Handle final transcript
  const handleFinalTranscript = useCallback((finalTranscript, conf) => {
    lastFinalTranscriptRef.current = finalTranscript

    // Try to recognize command
    const recognized = recognizeCommand(finalTranscript)
    setRecognizedCommand(recognized)

    // Trigger callback
    if (recognized && onCommandExecute) {
      // Small delay to show recognition UI
      setTimeout(() => {
        onCommandExecute(recognized, finalTranscript, conf)
      }, 300)
    }

    // Notify parent of transcript change
    if (onTranscriptChange) {
      onTranscriptChange(finalTranscript, recognized, conf)
    }

    // Auto-clear after successful command recognition
    if (recognized) {
      setTimeout(() => {
        clear()
        setRecognizedCommand(null)
      }, 2000)
    }
  }, [onCommandExecute, onTranscriptChange, clear])

  // Update listening state
  const handleListeningChange = useCallback(() => {
    setIsListening(vrIsListening)
  }, [vrIsListening])

  // Handle command selection from panel
  const handleCommandSelect = useCallback((commandText) => {
    const command = recognizeCommand(commandText)
    if (command && onCommandExecute) {
      onCommandExecute(command, commandText, 1.0)
    }
  }, [onCommandExecute])

  // Re-monitor listening state changes
  React.useEffect(() => {
    handleListeningChange()
  }, [vrIsListening, handleListeningChange])

  return (
    <>
      {children && React.cloneElement(children, {
        voiceTranscript: {
          isSupported,
          isListening: vrIsListening,
          transcript,
          isFinal,
          confidence,
          language: vrLanguage,
          start,
          stop,
          abort,
          clear,
          changeLanguage,
        }
      })}

      {/* Voice Transcript Panel - Always visible for accessibility */}
      {showPanel && isSupported && (
        <VoiceTranscriptPanel
          isOpen={true}
          position={panelPosition}
          transcript={transcript}
          isFinal={isFinal}
          confidence={confidence}
          recognizedCommand={recognizedCommand}
          isListening={vrIsListening}
          onCommandSelect={handleCommandSelect}
          onClose={abort}
        />
      )}

      {/* Fallback message for unsupported browsers */}
      {!isSupported && (
        <div
          className="voice-integration-fallback"
          role="status"
          aria-label="Voice recognition not available"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#ef4444',
          }}
        >
          Voice recognition not supported in your browser. Use text commands instead.
        </div>
      )}
    </>
  )
}
