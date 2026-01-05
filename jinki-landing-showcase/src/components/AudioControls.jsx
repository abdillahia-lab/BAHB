/**
 * AudioControls Component
 *
 * Accessible audio control UI with:
 * - Toggle switch
 * - Volume slider
 * - Visual feedback
 * - Keyboard shortcuts
 * - Accessibility features
 */

import React, { useEffect, useRef } from 'react'
import { useAudio } from '../context/AudioContext'
import './AudioControls.css'

export function AudioControls() {
  const {
    isEnabled,
    toggleAudio,
    volume,
    setVolume,
    isInitialized,
    playSound,
  } = useAudio()

  const containerRef = useRef(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+A to toggle audio
      if (e.altKey && e.key === 'a') {
        e.preventDefault()
        toggleAudio()
      }

      // Alt+Up/Down for volume
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        const newVolume = e.key === 'ArrowUp'
          ? Math.min(1, volume + 0.1)
          : Math.max(0, volume - 0.1)
        setVolume(newVolume)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleAudio, volume, setVolume])

  const handleToggle = () => {
    toggleAudio()
    // Play feedback sound when enabled
    setTimeout(() => {
      if (!isEnabled && playSound) {
        try {
          playSound('UI.success')
        } catch (e) {
          // Silent fail if sound can't play
        }
      }
    }, 100)
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)

    // Play feedback sound on volume change
    if (isEnabled && playSound) {
      try {
        playSound('UI.hover', { volume: 0.3 })
      } catch (e) {
        // Silent fail
      }
    }
  }

  if (!isInitialized) {
    return null
  }

  return (
    <div className="audio-controls" ref={containerRef}>
      <button
        className={`audio-toggle ${isEnabled ? 'enabled' : 'disabled'}`}
        onClick={handleToggle}
        aria-label={isEnabled ? 'Disable audio' : 'Enable audio'}
        title="Alt+A to toggle audio"
      >
        <span className="audio-icon">
          {isEnabled ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.6915026,12.4744748 L21.5908951,17.3738673 C22.1273881,17.9103603 22.1273881,18.8377778 21.5908951,19.3742708 C21.0544021,19.9107638 20.1269846,19.9107638 19.5904916,19.3742708 L14.6911085,14.4748879 L9.7917254,19.3742708 C9.25523234,19.9107638 8.32781489,19.9107638 7.79122183,19.3742708 C7.25462876,18.8377778 7.25462876,17.9103603 7.79122183,17.3738673 L12.6906049,12.4744748 L7.79122183,7.57509233 C7.25462876,7.03849926 7.25462876,6.11108181 7.79122183,5.57448875 C8.32781489,5.03789568 9.25523234,5.03789568 9.7917254,5.57448875 L14.6911085,10.4738717 L19.5904916,5.57448875 C20.1269846,5.03789568 21.0544021,5.03789568 21.5908951,5.57448875 C22.1273881,6.11108181 22.1273881,7.03849926 21.5908951,7.57509233 L16.6915026,12.4744748 Z" />
            </svg>
          )}
        </span>
        <span className="audio-label">
          {isEnabled ? 'Sound On' : 'Sound Off'}
        </span>
      </button>

      {isEnabled && (
        <div className="audio-volume-control">
          <label htmlFor="audio-volume" className="volume-label">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02z" />
            </svg>
          </label>
          <input
            id="audio-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            aria-label="Audio volume"
            title="Alt+Up/Down to adjust volume"
          />
          <span className="volume-value">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}

      <div className="audio-info">
        <p className="info-text">
          Audio controls available. Press <kbd>Alt+A</kbd> to toggle,{' '}
          <kbd>Alt+↑↓</kbd> to adjust volume.
        </p>
      </div>
    </div>
  )
}

export default AudioControls
