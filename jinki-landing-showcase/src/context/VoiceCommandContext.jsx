/**
 * VoiceCommandContext - Global Voice Command State Management
 *
 * Provides voice command functionality to entire application
 * Handles initialization, preferences, and global voice controls
 */

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { useVoiceCommand } from '../hooks/useVoiceCommand'
import { useTextToSpeech } from '../hooks/useTextToSpeech'
import { useVoiceSearch } from '../hooks/useVoiceSearch'

const VoiceContextInstance = createContext(null)

const VOICE_PREFERENCES_KEY = 'jinki-voice-preferences'

function getVoicePreferences() {
  try {
    const stored = localStorage.getItem(VOICE_PREFERENCES_KEY)
    return stored
      ? JSON.parse(stored)
      : {
          enabled: true,
          language: 'en-US',
          wakeWord: 'hey jinki',
          ttsEnabled: true,
          searchEnabled: true,
          confidenceThreshold: 0.7,
        }
  } catch {
    return {
      enabled: true,
      language: 'en-US',
      wakeWord: 'hey jinki',
      ttsEnabled: true,
      searchEnabled: true,
      confidenceThreshold: 0.7,
    }
  }
}

function saveVoicePreferences(prefs) {
  try {
    localStorage.setItem(VOICE_PREFERENCES_KEY, JSON.stringify(prefs))
  } catch (e) {
    console.warn('Could not save voice preferences:', e)
  }
}

export function VoiceProvider({ children, searchableContent = [] }) {
  const [preferences, setPreferences] = useState(getVoicePreferences)
  const [commandHistory, setCommandHistory] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [commandResponse, setCommandResponse] = useState(null)
  const [showVoiceIndicator, setShowVoiceIndicator] = useState(false)

  // Initialize voice modules
  const voiceCommand = useVoiceCommand({
    enabled: preferences.enabled,
    language: preferences.language,
    wakeWord: preferences.wakeWord,
    confidenceThreshold: preferences.confidenceThreshold,
    onCommand: handleVoiceCommand,
  })

  const textToSpeech = useTextToSpeech({
    enabled: preferences.ttsEnabled,
    language: preferences.language,
  })

  const voiceSearch = useVoiceSearch({
    enabled: preferences.searchEnabled && preferences.enabled,
    language: preferences.language,
    searchableContent,
  })

  // Handle voice commands
  function handleVoiceCommand(command) {
    const newCommand = {
      ...command,
      timestamp: Date.now(),
    }

    setCommandHistory((prev) => [newCommand, ...prev].slice(0, 50))
    setCommandResponse({
      text: `Command: ${command.command}`,
      confidence: command.confidence,
      timestamp: Date.now(),
    })

    // Announce command execution if TTS enabled
    if (preferences.ttsEnabled && textToSpeech.isSupported) {
      const response = getCommandResponse(command.command)
      textToSpeech.announce(response, 'normal')
    }

    // Notify listeners
    if (window.__VOICE_COMMAND_HANDLER__) {
      window.__VOICE_COMMAND_HANDLER__(newCommand)
    }
  }

  // Initialize on mount
  useEffect(() => {
    setIsInitialized(true)
  }, [])

  // Update preferences
  const updatePreferences = useCallback((newPrefs) => {
    const updated = { ...preferences, ...newPrefs }
    setPreferences(updated)
    saveVoicePreferences(updated)
  }, [preferences])

  // Toggle voice commands
  const toggleVoiceCommands = useCallback(() => {
    const newState = !preferences.enabled
    updatePreferences({ enabled: newState })

    if (newState) {
      voiceCommand.startListening()
    } else {
      voiceCommand.stopListening()
    }
  }, [preferences.enabled, updatePreferences, voiceCommand])

  // Toggle TTS
  const toggleTextToSpeech = useCallback(() => {
    updatePreferences({ ttsEnabled: !preferences.ttsEnabled })
  }, [preferences.ttsEnabled, updatePreferences])

  // Change language
  const changeLanguage = useCallback((lang) => {
    updatePreferences({ language: lang })
  }, [updatePreferences])

  // Register command handler
  const registerCommandHandler = useCallback((handler) => {
    window.__VOICE_COMMAND_HANDLER__ = handler
  }, [])

  return (
    <VoiceContextInstance.Provider
      value={{
        // State
        isInitialized,
        preferences,
        commandHistory,
        commandResponse,
        showVoiceIndicator,

        // Voice Command API
        voiceCommand,
        textToSpeech,
        voiceSearch,

        // Controls
        updatePreferences,
        toggleVoiceCommands,
        toggleTextToSpeech,
        changeLanguage,
        registerCommandHandler,
        setShowVoiceIndicator,
      }}
    >
      {children}
    </VoiceContextInstance.Provider>
  )
}

/**
 * Hook to use voice context
 */
export function useVoice() {
  const context = useContext(VoiceContextInstance)
  if (!context) {
    throw new Error('useVoice must be used within VoiceProvider')
  }
  return context
}

/**
 * Get human-readable response for command
 */
function getCommandResponse(command) {
  const responses = {
    go_home: 'Navigating to home page',
    go_pricing: 'Opening pricing information',
    go_features: 'Showing features page',
    go_about: 'Opening about page',
    go_contact: 'Opening contact page',
    go_demo: 'Starting interactive demo',
    go_back: 'Going back',
    search: 'Starting voice search',
    scroll_up: 'Scrolling up',
    scroll_down: 'Scrolling down',
    toggle_menu: 'Toggling navigation menu',
    toggle_voice: 'Toggling voice commands',
    toggle_audio: 'Toggling audio',
    increase_volume: 'Increasing volume',
    decrease_volume: 'Decreasing volume',
    start_demo: 'Starting demonstration',
    stop_demo: 'Stopping demonstration',
    next_demo: 'Moving to next step',
    previous_demo: 'Going to previous step',
    help: 'Showing help',
    submit_form: 'Submitting form',
    clear_form: 'Clearing form',
  }

  return responses[command] || `Executing ${command}`
}

export default VoiceContextInstance
