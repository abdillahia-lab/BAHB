/**
 * useSoundscape - Section-Specific Ambient Audio Management
 *
 * Handles:
 * - Smooth transitions between section soundscapes
 * - Adaptive ambient audio playback
 * - Scroll-based audio layering
 * - Performance optimization through lazy loading
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { SECTION_SOUNDSCAPES } from '../utils/audioAssets'

export function useSoundscape(audioManager, currentSection, isVisible = true) {
  const [currentSoundscape, setCurrentSoundscape] = useState(null)
  const activeSoundRef = useRef(null)
  const loadingRef = useRef(new Set())
  const fadeOutTimeoutRef = useRef(null)

  // Preload soundscape when section is nearby
  const preloadSoundscape = useCallback((sectionId) => {
    const soundPath = SECTION_SOUNDSCAPES[sectionId]
    if (!soundPath || loadingRef.current.has(soundPath)) return

    loadingRef.current.add(soundPath)
    // Pre-buffer the sound (lazy loading)
    setTimeout(() => {
      try {
        const dummy = audioManager.playSound(soundPath, {
          volume: 0,
          onEnd: () => {
            loadingRef.current.delete(soundPath)
          }
        })
        if (dummy) {
          audioManager.stopSound(dummy.id)
        }
      } catch (e) {
        loadingRef.current.delete(soundPath)
      }
    }, 0)
  }, [audioManager])

  // Play soundscape for section
  const playSoundscape = useCallback((sectionId) => {
    const soundPath = SECTION_SOUNDSCAPES[sectionId]
    if (!soundPath) {
      console.warn(`No soundscape defined for section: ${sectionId}`)
      return
    }

    // Stop current soundscape if different
    if (currentSoundscape !== sectionId && activeSoundRef.current) {
      const oldSoundId = activeSoundRef.current
      // Fade out existing sound
      audioManager.fadeOutSound(oldSoundId, 500)
    }

    // Clear fade out timeout
    if (fadeOutTimeoutRef.current) {
      clearTimeout(fadeOutTimeoutRef.current)
      fadeOutTimeoutRef.current = null
    }

    // Play new soundscape
    const sound = audioManager.playSoundWithFade(soundPath, {
      volume: 0.15, // Subtle background level
      loop: true,
      fadeInDuration: 800,
      sourceId: `soundscape-${sectionId}`,
    })

    if (sound) {
      activeSoundRef.current = sound.id
      setCurrentSoundscape(sectionId)
    }
  }, [audioManager, currentSoundscape])

  // Stop soundscape with fade
  const stopSoundscape = useCallback((fadeDuration = 1000) => {
    if (activeSoundRef.current) {
      audioManager.fadeOutSound(activeSoundRef.current, fadeDuration)
      fadeOutTimeoutRef.current = setTimeout(() => {
        activeSoundRef.current = null
        setCurrentSoundscape(null)
      }, fadeDuration)
    }
  }, [audioManager])

  // Change soundscape volume
  const setSoundscapeVolume = useCallback((volume) => {
    if (activeSoundRef.current) {
      // Get the sound player instance and update volume
      const sound = audioManager.playSound // Simplified - in real impl, need sound ref
      // This would require extending audioManager
    }
  }, [audioManager])

  // Handle visibility changes
  useEffect(() => {
    if (!audioManager.isEnabled) {
      if (isVisible && currentSection) {
        // Pre-load nearby soundscapes
        preloadSoundscape(currentSection)
      }
      return
    }

    if (isVisible && currentSection) {
      playSoundscape(currentSection)
    } else {
      stopSoundscape(1000)
    }

    return () => {
      if (fadeOutTimeoutRef.current) {
        clearTimeout(fadeOutTimeoutRef.current)
      }
    }
  }, [currentSection, isVisible, audioManager.isEnabled, playSoundscape, stopSoundscape, preloadSoundscape])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSoundscape(500)
      if (fadeOutTimeoutRef.current) {
        clearTimeout(fadeOutTimeoutRef.current)
      }
    }
  }, [stopSoundscape])

  return {
    currentSoundscape,
    playSoundscape,
    stopSoundscape,
    setSoundscapeVolume,
    preloadSoundscape,
  }
}

export default useSoundscape
