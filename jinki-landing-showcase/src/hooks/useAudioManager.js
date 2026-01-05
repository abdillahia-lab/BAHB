/**
 * useAudioManager - Main Audio Management Hook
 *
 * Handles:
 * - Audio context initialization
 * - Sound playback management
 * - Master volume control
 * - Audio enabling/disabling with accessibility
 * - Performance optimization
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { SoundPlayer, getAudioContext } from '../utils/audioSynthesis'
import { SOUND_SPECS } from '../utils/audioAssets'

// Audio state persistence
const AUDIO_PREFERENCES_KEY = 'jinki-audio-preferences'

function getAudioPreferences() {
  try {
    const stored = localStorage.getItem(AUDIO_PREFERENCES_KEY)
    return stored ? JSON.parse(stored) : { enabled: false, volume: 0.5 }
  } catch {
    return { enabled: false, volume: 0.5 }
  }
}

function saveAudioPreferences(prefs) {
  try {
    localStorage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify(prefs))
  } catch (e) {
    console.warn('Could not save audio preferences:', e)
  }
}

export function useAudioManager() {
  const playerRef = useRef(null)
  const [isEnabled, setIsEnabled] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [isInitialized, setIsInitialized] = useState(false)
  const [audioContext, setAudioContext] = useState(null)
  const fadeOutTimeoutsRef = useRef(new Map())

  // Initialize audio on first interaction
  const initializeAudio = useCallback(() => {
    if (isInitialized) return

    try {
      const context = getAudioContext()
      setAudioContext(context)

      // Resume audio context if suspended (user interaction required)
      if (context.state === 'suspended') {
        context.resume().then(() => {
          console.log('Audio context resumed')
        })
      }

      playerRef.current = new SoundPlayer(context)
      setIsInitialized(true)

      // Load preferences
      const prefs = getAudioPreferences()
      setIsEnabled(prefs.enabled)
      setVolume(prefs.volume)
      if (playerRef.current) {
        playerRef.current.setMasterVolume(prefs.volume)
      }
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }, [isInitialized])

  // Initialize on mount
  useEffect(() => {
    initializeAudio()
  }, [initializeAudio])

  // Handle volume changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setMasterVolume(volume)
      const prefs = getAudioPreferences()
      saveAudioPreferences({ ...prefs, volume })
    }
  }, [volume])

  // Handle enable/disable
  const toggleAudio = useCallback(() => {
    const newState = !isEnabled
    setIsEnabled(newState)

    const prefs = getAudioPreferences()
    saveAudioPreferences({ ...prefs, enabled: newState })

    if (!newState) {
      // Stop all sounds when disabled
      if (playerRef.current) {
        const player = playerRef.current
        for (const [id] of player.activeSources.entries()) {
          player.stopSound(id)
        }
      }
    }
  }, [isEnabled])

  // Play sound with audio enabled check
  const playSound = useCallback((specPath, options = {}) => {
    if (!isEnabled || !playerRef.current) {
      return null
    }

    return playerRef.current.playSound(specPath, options)
  }, [isEnabled])

  // Play with fade
  const playSoundWithFade = useCallback((specPath, options = {}) => {
    const { fadeInDuration = 500, ...rest } = options
    if (!isEnabled || !playerRef.current) {
      return null
    }

    return playerRef.current.playSound(specPath, {
      ...rest,
      fadeInDuration,
    })
  }, [isEnabled])

  // Stop sound
  const stopSound = useCallback((soundId) => {
    if (playerRef.current) {
      playerRef.current.stopSound(soundId)
    }
  }, [])

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    if (playerRef.current) {
      for (const [id] of playerRef.current.activeSources.entries()) {
        playerRef.current.stopSound(id)
      }
    }
  }, [])

  // Fade out sound
  const fadeOutSound = useCallback((soundId, duration = 1000) => {
    if (playerRef.current) {
      playerRef.current.fadeOutSound(soundId, duration)
    }
  }, [])

  // Fade all sounds
  const fadeOutAllSounds = useCallback((duration = 1000) => {
    if (playerRef.current) {
      for (const [id] of playerRef.current.activeSources.entries()) {
        playerRef.current.fadeOutSound(id, duration)
      }
    }
  }, [])

  // Request user permission to play audio
  const requestAudioPermission = useCallback(async () => {
    if (audioContext?.state === 'suspended') {
      try {
        await audioContext.resume()
        console.log('Audio context resumed with user permission')
      } catch (error) {
        console.error('Failed to resume audio context:', error)
      }
    }
  }, [audioContext])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.cleanup()
      }
      // Clear any pending fade out timeouts
      fadeOutTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      fadeOutTimeoutsRef.current.clear()
    }
  }, [])

  return {
    // State
    isEnabled,
    isInitialized,
    volume,
    audioContext,

    // Controls
    toggleAudio,
    setVolume,
    requestAudioPermission,

    // Sound playback
    playSound,
    playSoundWithFade,
    stopSound,
    stopAllSounds,
    fadeOutSound,
    fadeOutAllSounds,

    // Utils
    initializeAudio,
  }
}

export default useAudioManager
