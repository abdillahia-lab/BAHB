/**
 * useTextToSpeech - Text-to-Speech Accessibility Hook
 *
 * Handles:
 * - Speech synthesis with Web Speech API
 * - Voice selection and rate control
 * - Queue management
 * - Auto-read for accessibility
 * - Language support
 * - Fallback handling
 */

import { useEffect, useRef, useState, useCallback } from 'react'

const SpeechSynthesisUtterance = typeof window !== 'undefined' ? window.SpeechSynthesisUtterance : null
const speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null

export function useTextToSpeech(options = {}) {
  const {
    enabled = true,
    language = 'en-US',
    rate = 1,
    pitch = 1,
    volume = 0.8,
    voiceIndex = 0,
    onStart = null,
    onEnd = null,
    onError = null,
  } = options

  const utteranceQueueRef = useRef([])
  const currentUtteranceRef = useRef(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState([])
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(voiceIndex)
  const [error, setError] = useState(null)
  const [queueLength, setQueueLength] = useState(0)

  // Initialize Speech Synthesis
  useEffect(() => {
    if (!SpeechSynthesisUtterance || !speechSynthesis) {
      setIsSupported(false)
      setError('Text-to-Speech not supported in this browser')
      return
    }

    setIsSupported(true)

    // Get available voices
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      setVoices(availableVoices)

      // Try to select a voice matching the language
      const matchingVoice = availableVoices.findIndex((v) =>
        v.lang.startsWith(language.split('-')[0])
      )
      if (matchingVoice >= 0) {
        setSelectedVoiceIndex(matchingVoice)
      }
    }

    loadVoices()

    // Voices may load asynchronously
    speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel()
      }
    }
  }, [language])

  // Speak text
  const speak = useCallback(
    (text, options = {}) => {
      if (!isSupported || !enabled || !SpeechSynthesisUtterance) {
        return
      }

      const {
        priority = 'normal', // 'normal' or 'urgent' (skip queue)
        onComplete = null,
      } = options

      const utterance = new SpeechSynthesisUtterance(text)

      // Configure utterance
      utterance.rate = options.rate ?? rate
      utterance.pitch = options.pitch ?? pitch
      utterance.volume = options.volume ?? volume
      utterance.lang = options.language ?? language

      if (voices.length > 0) {
        utterance.voice = voices[selectedVoiceIndex]
      }

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true)
        if (onStart) onStart(text)
      }

      utterance.onend = () => {
        if (onComplete) onComplete()
        processSpeechQueue()
        if (utteranceQueueRef.current.length === 0) {
          setIsSpeaking(false)
        }
      }

      utterance.onerror = (event) => {
        const errorMsg = `Speech error: ${event.error}`
        setError(errorMsg)
        if (onError) onError(event.error)
        processSpeechQueue()
      }

      currentUtteranceRef.current = utterance

      // Queue management
      if (priority === 'urgent') {
        speechSynthesis.cancel()
        utteranceQueueRef.current = [utterance]
      } else {
        utteranceQueueRef.current.push(utterance)
      }

      setQueueLength(utteranceQueueRef.current.length)
      processSpeechQueue()
    },
    [isSupported, enabled, rate, pitch, volume, language, voices, selectedVoiceIndex, onStart, onEnd, onError]
  )

  // Process speech queue
  const processSpeechQueue = useCallback(() => {
    if (!speechSynthesis || utteranceQueueRef.current.length === 0) {
      return
    }

    if (!speechSynthesis.speaking) {
      const nextUtterance = utteranceQueueRef.current.shift()
      if (nextUtterance) {
        speechSynthesis.speak(nextUtterance)
        setQueueLength(utteranceQueueRef.current.length)
      }
    }
  }, [])

  // Stop speaking
  const stop = useCallback(() => {
    if (speechSynthesis) {
      speechSynthesis.cancel()
      utteranceQueueRef.current = []
      setIsSpeaking(false)
      setQueueLength(0)
    }
  }, [])

  // Pause speaking
  const pause = useCallback(() => {
    if (speechSynthesis?.paused === false) {
      speechSynthesis.pause()
    }
  }, [])

  // Resume speaking
  const resume = useCallback(() => {
    if (speechSynthesis?.paused === true) {
      speechSynthesis.resume()
    }
  }, [])

  // Clear queue
  const clearQueue = useCallback(() => {
    utteranceQueueRef.current = []
    setQueueLength(0)
  }, [])

  // Change voice
  const setVoice = useCallback((index) => {
    if (index >= 0 && index < voices.length) {
      setSelectedVoiceIndex(index)
    }
  }, [voices.length])

  // Announce for accessibility
  const announce = useCallback(
    (message, priority = 'normal') => {
      speak(message, { priority })
    },
    [speak]
  )

  return {
    // State
    isSupported,
    isSpeaking,
    voices,
    selectedVoiceIndex,
    error,
    queueLength,

    // Controls
    speak,
    stop,
    pause,
    resume,
    clearQueue,
    setVoice,
    announce,
  }
}

export default useTextToSpeech
