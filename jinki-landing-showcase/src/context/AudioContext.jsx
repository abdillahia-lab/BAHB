/**
 * AudioContext - Global Audio State Management
 *
 * Provides audio manager to entire application
 * Handles initialization, preferences, and global audio controls
 */

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import useAudioManager from '../hooks/useAudioManager'

const AudioContextInstance = createContext(null)

export function AudioProvider({ children }) {
  const audioManager = useAudioManager()

  return (
    <AudioContextInstance.Provider value={audioManager}>
      {children}
    </AudioContextInstance.Provider>
  )
}

/**
 * Hook to use audio context
 */
export function useAudio() {
  const context = useContext(AudioContextInstance)
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}

export default AudioContextInstance
