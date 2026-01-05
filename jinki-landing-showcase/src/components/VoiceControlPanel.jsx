/**
 * VoiceControlPanel - Comprehensive Voice Settings Panel
 *
 * Provides:
 * - Voice commands toggle
 * - Language selection
 * - Confidence threshold adjustment
 * - Command history
 * - Voice settings
 * - Help documentation
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoice } from '../context/VoiceCommandContext'
import { formatCommandsForDisplay } from '../utils/voiceCommandGrammar'
import './VoiceControlPanel.css'

const languages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
]

export function VoiceControlPanel({ isOpen = false, onClose = null }) {
  const {
    preferences,
    voiceCommand,
    textToSpeech,
    commandHistory,
    toggleVoiceCommands,
    toggleTextToSpeech,
    changeLanguage,
    updatePreferences,
  } = useVoice()

  const [activeTab, setActiveTab] = useState('status')
  const [showCommandList, setShowCommandList] = useState(false)

  if (!isOpen) return null

  const commands = formatCommandsForDisplay(preferences.language)

  return (
    <AnimatePresence>
      <motion.div
        className="voice-control-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="voice-control-panel"
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="vcp-header">
            <h2>Voice Controls</h2>
            <button
              className="vcp-close"
              onClick={onClose}
              aria-label="Close voice control panel"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="vcp-tabs">
            {['status', 'settings', 'commands', 'history'].map((tab) => (
              <button
                key={tab}
                className={`vcp-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                aria-selected={activeTab === tab}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="vcp-content">
            {/* Status Tab */}
            {activeTab === 'status' && (
              <div className="vcp-section">
                <h3>Voice Status</h3>

                {/* Support Info */}
                <div className="status-item">
                  <span className="label">Browser Support</span>
                  <span className={`value ${voiceCommand.isSupported ? 'ok' : 'error'}`}>
                    {voiceCommand.isSupported ? '✓ Supported' : '✗ Not Supported'}
                  </span>
                </div>

                {voiceCommand.isSupported && (
                  <>
                    {/* Listening Status */}
                    <div className="status-item">
                      <span className="label">Listening</span>
                      <motion.span
                        className={`value ${voiceCommand.isListening ? 'active' : ''}`}
                        animate={{
                          opacity: voiceCommand.isListening ? [0.5, 1] : 1,
                        }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        {voiceCommand.isListening ? '● Active' : '○ Inactive'}
                      </motion.span>
                    </div>

                    {/* Confidence */}
                    {voiceCommand.isListening && (
                      <div className="status-item">
                        <span className="label">Confidence</span>
                        <div className="confidence-display">
                          <div className="conf-bar">
                            <div
                              className="conf-fill"
                              style={{ width: `${voiceCommand.confidence * 100}%` }}
                            />
                          </div>
                          <span className="conf-value">
                            {(voiceCommand.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Transcript */}
                    {voiceCommand.transcript && (
                      <div className="status-item">
                        <span className="label">Transcript</span>
                        <p className="transcript">{voiceCommand.transcript}</p>
                      </div>
                    )}

                    {/* Last Command */}
                    {voiceCommand.lastCommand && (
                      <div className="status-item">
                        <span className="label">Last Command</span>
                        <p className="last-command">
                          {voiceCommand.lastCommand.command}
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {voiceCommand.error && (
                      <div className="status-item error">
                        <span className="label">Error</span>
                        <p className="error-text">{voiceCommand.error}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="vcp-section">
                <h3>Voice Settings</h3>

                {/* Voice Commands Toggle */}
                <div className="setting-item">
                  <label>Voice Commands</label>
                  <button
                    className={`toggle ${preferences.enabled ? 'on' : 'off'}`}
                    onClick={toggleVoiceCommands}
                    aria-label={preferences.enabled ? 'Disable voice commands' : 'Enable voice commands'}
                  >
                    <span className="toggle-switch" />
                  </button>
                </div>

                {/* Language Selection */}
                <div className="setting-item">
                  <label htmlFor="language-select">Language</label>
                  <select
                    id="language-select"
                    className="voice-select"
                    value={preferences.language}
                    onChange={(e) => changeLanguage(e.target.value)}
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wake Word */}
                <div className="setting-item">
                  <label>Wake Word</label>
                  <p className="wake-word-display">{preferences.wakeWord}</p>
                </div>

                {/* Confidence Threshold */}
                <div className="setting-item">
                  <label htmlFor="confidence-slider">Confidence Threshold</label>
                  <div className="slider-container">
                    <input
                      id="confidence-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={preferences.confidenceThreshold * 100}
                      onChange={(e) =>
                        updatePreferences({
                          confidenceThreshold: parseFloat(e.target.value) / 100,
                        })
                      }
                      className="slider"
                      aria-label="Confidence threshold"
                    />
                    <span className="slider-value">
                      {(preferences.confidenceThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="hint">Lower = more lenient, Higher = stricter</p>
                </div>

                {/* Text-to-Speech Toggle */}
                <div className="setting-item">
                  <label>Voice Feedback (TTS)</label>
                  <button
                    className={`toggle ${preferences.ttsEnabled ? 'on' : 'off'}`}
                    onClick={toggleTextToSpeech}
                    aria-label={preferences.ttsEnabled ? 'Disable voice feedback' : 'Enable voice feedback'}
                  >
                    <span className="toggle-switch" />
                  </button>
                </div>

                {textToSpeech.isSupported && preferences.ttsEnabled && (
                  <div className="setting-item">
                    <label>Voice</label>
                    <select
                      className="voice-select"
                      value={textToSpeech.selectedVoiceIndex}
                      onChange={(e) => textToSpeech.setVoice(parseInt(e.target.value))}
                    >
                      {textToSpeech.voices.map((voice, idx) => (
                        <option key={idx} value={idx}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Commands Tab */}
            {activeTab === 'commands' && (
              <div className="vcp-section">
                <h3>Available Commands</h3>
                <p className="section-hint">Say "Hey Jinki" followed by these commands:</p>

                <div className="commands-list">
                  {commands.slice(0, 15).map((cmd, idx) => (
                    <div key={idx} className="command-item">
                      <span className="cmd-name">{cmd.name}</span>
                      <p className="cmd-desc">{cmd.description}</p>
                      <div className="cmd-examples">
                        {cmd.examples.map((ex, i) => (
                          <span key={i} className="example">
                            "{ex}"
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="view-all-btn"
                  onClick={() => setShowCommandList(!showCommandList)}
                >
                  {showCommandList ? 'Hide' : 'View All'} Commands
                </button>

                {showCommandList && (
                  <div className="all-commands">
                    {commands.map((cmd, idx) => (
                      <div key={idx} className="command-item compact">
                        <span className="cmd-name">{cmd.name}</span>
                        <p className="cmd-desc">{cmd.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="vcp-section">
                <h3>Command History</h3>

                {commandHistory.length > 0 ? (
                  <div className="history-list">
                    {commandHistory.map((cmd, idx) => (
                      <div key={idx} className="history-item">
                        <span className="cmd-time">
                          {new Date(cmd.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="cmd-name">{cmd.command}</span>
                        <span className="cmd-conf">
                          {(cmd.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-history">No command history yet</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="vcp-footer">
            <p className="footer-hint">
              💡 Tip: Start with "Hey Jinki" to activate voice commands
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default VoiceControlPanel
