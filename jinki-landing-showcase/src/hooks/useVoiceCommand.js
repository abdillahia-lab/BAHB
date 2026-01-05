/**
 * useVoiceCommand - Web Speech API Voice Command Recognition Hook
 *
 * Handles:
 * - Continuous speech recognition
 * - Wake word detection ("Hey Jinki")
 * - Command parsing and matching
 * - Confidence thresholds
 * - Multi-language support
 * - Error recovery
 * - Accessibility support
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { voiceCommandGrammar } from '../utils/voiceCommandGrammar'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useVoiceCommand(options = {}) {
  const {
    enabled = true,
    language = 'en-US',
    wakeWord = 'hey jinki',
    confidenceThreshold = 0.7,
    maxAlternatives = 3,
    onCommand = null,
    onError = null,
    onListening = null,
  } = options

  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [lastCommand, setLastCommand] = useState(null)
  const [confidence, setConfidence] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState(null)
  const wakeWordDetectedRef = useRef(false)
  const abortControllerRef = useRef(null)

  // Initialize Speech Recognition
  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false)
      setError('Speech Recognition not supported in this browser')
      return
    }

    setIsSupported(true)
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language
    recognition.maxAlternatives = maxAlternatives

    // Start event - user started speaking
    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      if (onListening) onListening(true)
    }

    // Result event - speech recognized
    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        const isFinal = event.results[i].isFinal
        const conf = event.results[i][0].confidence

        if (isFinal) {
          finalTranscript += transcript + ' '
          setConfidence(conf)
        } else {
          interimTranscript += transcript
        }
      }

      const currentTranscript = (finalTranscript || interimTranscript).toLowerCase().trim()
      setTranscript(currentTranscript)

      // Check for wake word
      if (currentTranscript.includes(wakeWord.toLowerCase())) {
        wakeWordDetectedRef.current = true
      }

      // Process commands after wake word
      if (finalTranscript && wakeWordDetectedRef.current) {
        const cleanCommand = finalTranscript
          .toLowerCase()
          .replace(wakeWord.toLowerCase(), '')
          .trim()

        const matchedCommand = matchVoiceCommand(cleanCommand, language)

        if (matchedCommand && matchedCommand.confidence >= confidenceThreshold) {
          setLastCommand(matchedCommand)
          setConfidence(matchedCommand.confidence)

          if (onCommand) {
            onCommand({
              command: matchedCommand.command,
              action: matchedCommand.action,
              confidence: matchedCommand.confidence,
              transcript: cleanCommand,
            })
          }

          wakeWordDetectedRef.current = false
        }
      }
    }

    // Error event
    recognition.onerror = (event) => {
      const errorMessage = `Voice error: ${event.error}`
      setError(errorMessage)
      if (onError) onError(event.error)
    }

    // End event
    recognition.onend = () => {
      setIsListening(false)
      if (onListening) onListening(false)
    }

    recognitionRef.current = recognition
    abortControllerRef.current = new AbortController()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [language, wakeWord, confidenceThreshold, maxAlternatives, onCommand, onError, onListening])

  // Start listening
  const startListening = useCallback(() => {
    if (recognitionRef.current && enabled && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (e) {
        console.error('Error starting recognition:', e)
      }
    }
  }, [enabled, isListening])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Reset state
  const reset = useCallback(() => {
    setTranscript('')
    setLastCommand(null)
    setConfidence(0)
    setError(null)
    wakeWordDetectedRef.current = false
  }, [])

  return {
    // State
    isListening,
    isSupported,
    transcript,
    lastCommand,
    confidence,
    error,

    // Controls
    startListening,
    stopListening,
    toggleListening,
    reset,
  }
}

/**
 * Match voice command against grammar
 */
function matchVoiceCommand(transcript, language) {
  const grammar = voiceCommandGrammar[language] || voiceCommandGrammar['en-US']

  for (const category of Object.values(grammar)) {
    for (const command of category) {
      for (const pattern of command.patterns) {
        const isMatch = matchPattern(transcript, pattern)
        if (isMatch) {
          return {
            command: command.name,
            action: command.action,
            confidence: calculateConfidence(transcript, pattern),
            pattern: pattern,
          }
        }
      }
    }
  }

  return null
}

/**
 * Pattern matching with fuzzy tolerance
 */
function matchPattern(transcript, pattern) {
  const patternStr = pattern.toLowerCase()
  const transcriptStr = transcript.toLowerCase()

  // Exact match
  if (transcriptStr === patternStr) return true

  // Contains match
  if (transcriptStr.includes(patternStr)) return true

  // Fuzzy match with edit distance
  const editDistance = calculateEditDistance(transcriptStr, patternStr)
  const maxDistance = Math.max(patternStr.length / 4, 2)
  return editDistance <= maxDistance
}

/**
 * Calculate confidence based on transcript match
 */
function calculateConfidence(transcript, pattern) {
  const patternStr = pattern.toLowerCase()
  const transcriptStr = transcript.toLowerCase()

  if (transcriptStr === patternStr) return 1.0
  if (transcriptStr.includes(patternStr)) return 0.95

  const editDistance = calculateEditDistance(transcriptStr, patternStr)
  const similarity = 1 - editDistance / Math.max(transcriptStr.length, patternStr.length)
  return Math.max(0, similarity)
}

/**
 * Levenshtein distance for fuzzy matching
 */
function calculateEditDistance(a, b) {
  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0))

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  return matrix[b.length][a.length]
}

export default useVoiceCommand
