/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE VOICE TRANSCRIPT - Hook for integrated voice recognition with transcription
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Integrates with Web Speech API to provide:
 * - Real-time speech-to-text transcription
 * - Confidence scores
 * - Final transcript handling
 * - Error management
 * - Multi-language support
 */

import { useEffect, useRef, useState, useCallback } from 'react'

const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

const DEFAULT_CONFIG = {
  language: 'en-US',
  continuous: false,
  interimResults: true,
  maxAlternatives: 1,
}

export function useVoiceTranscript(config = {}) {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    onTranscript = null,
    onFinal = null,
    onError = null,
    onStart = null,
    onEnd = null,
    onConfidence = null,
  } = config

  const recognitionRef = useRef(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [isFinal, setIsFinal] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState(null)
  const [language_, setLanguage] = useState(language)

  // Initialize Speech Recognition
  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false)
      setError('Speech Recognition not supported in this browser')
      return
    }

    setIsSupported(true)

    recognitionRef.current = new SpeechRecognition()
    const recognition = recognitionRef.current

    // Configure recognition
    recognition.lang = language_
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.maxAlternatives = maxAlternatives

    // Start event
    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
      setFinalTranscript('')
      setError(null)
      setConfidence(0)
      if (onStart) onStart()
    }

    // Result event - handles both interim and final results
    recognition.onresult = (event) => {
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript_ = event.results[i][0].transcript

        if (event.results[i].isFinal) {
          // Final result
          setFinalTranscript(prev => prev + transcript_ + ' ')
          setTranscript(prev => prev + transcript_ + ' ')
          setIsFinal(true)

          // Get confidence from final result
          const conf = event.results[i][0].confidence
          setConfidence(conf)
          if (onConfidence) onConfidence(conf)

          if (onFinal) onFinal(finalTranscript + transcript_, conf)
        } else {
          // Interim result
          interimTranscript += transcript_

          // Get confidence from interim result
          const conf = event.results[i][0].confidence
          setConfidence(conf)
          if (onConfidence) onConfidence(conf)
        }
      }

      // Update interim transcript
      if (interimTranscript) {
        setTranscript(finalTranscript + interimTranscript)
        setIsFinal(false)
      } else {
        setTranscript(finalTranscript)
        setIsFinal(true)
      }

      if (onTranscript) onTranscript(transcript, isFinal)
    }

    // Error event
    recognition.onerror = (event) => {
      const errorMessage = event.error
      setError(errorMessage)
      if (onError) onError(errorMessage)
    }

    // End event
    recognition.onend = () => {
      setIsListening(false)
      if (onEnd) onEnd()
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [language_, continuous, interimResults, maxAlternatives, onStart, onEnd, onError, onTranscript, onFinal, onConfidence])

  // Start listening
  const start = useCallback(() => {
    if (recognitionRef.current && isSupported && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (e) {
        // Already started, ignore
      }
    }
  }, [isSupported, isListening])

  // Stop listening
  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  // Abort listening
  const abort = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
  }, [])

  // Clear transcript
  const clear = useCallback(() => {
    setTranscript('')
    setFinalTranscript('')
    setIsFinal(false)
    setConfidence(0)
    setError(null)
  }, [])

  // Change language
  const changeLanguage = useCallback((lang) => {
    setLanguage_(lang)
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang
    }
  }, [])

  return {
    // State
    isSupported,
    isListening,
    transcript,
    finalTranscript,
    isFinal,
    confidence,
    error,
    language: language_,

    // Controls
    start,
    stop,
    abort,
    clear,
    changeLanguage,
  }
}

export default useVoiceTranscript
