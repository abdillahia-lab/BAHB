/**
 * Procedural Audio Synthesis Engine
 * Generates all sounds on-the-fly without external audio files
 *
 * INNOVATION: Zero-dependency audio generation optimized for performance
 */

import { SOUND_SPECS, REACTIVE_CONFIG } from './audioAssets'

// ═══════════════════════════════════════════════════════════════
// AUDIO CONTEXT SINGLETON
// ═══════════════════════════════════════════════════════════════
let audioContextInstance = null

export function getAudioContext() {
  if (!audioContextInstance) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    audioContextInstance = new AudioContext()
  }
  return audioContextInstance
}

// ═══════════════════════════════════════════════════════════════
// SYNTHESIS UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a waveform buffer
 */
function generateWaveform(audioContext, spec, duration) {
  const sampleRate = audioContext.sampleRate
  const numSamples = duration * sampleRate
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
  const channelData = buffer.getChannelData(0)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const phase = (2 * Math.PI * spec.frequency * t) % (2 * Math.PI)

    // Envelope
    let envelope = 1
    if (t < spec.attack / 1000) {
      envelope = t / (spec.attack / 1000)
    } else if (t < (spec.attack + spec.decay) / 1000) {
      envelope = 1 - (1 - spec.sustain) * ((t - spec.attack / 1000) / (spec.decay / 1000))
    } else if (t < duration - spec.release / 1000) {
      envelope = spec.sustain
    } else {
      envelope = spec.sustain * (1 - (t - (duration - spec.release / 1000)) / (spec.release / 1000))
    }

    // Waveform generation
    let sample = 0
    if (spec.type === 'sine') {
      sample = Math.sin(phase)
    } else if (spec.type === 'square') {
      sample = Math.sin(phase) > 0 ? 1 : -1
    } else if (spec.type === 'sawtooth') {
      sample = 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5))
    } else if (spec.type === 'triangle') {
      sample = 2 * Math.abs(2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5))) - 1
    }

    channelData[i] = sample * envelope * 0.3 // 0.3 for safety headroom
  }

  return buffer
}

/**
 * Generate harmonic stack (multiple frequencies)
 */
function generateHarmonicStack(audioContext, baseFreq, harmonics, duration, spec) {
  const sampleRate = audioContext.sampleRate
  const numSamples = duration * sampleRate
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
  const channelData = buffer.getChannelData(0)

  const allFrequencies = [baseFreq, ...harmonics]

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate

    // Envelope
    let envelope = 1
    if (t < spec.attack / 1000) {
      envelope = t / (spec.attack / 1000)
    } else if (t < (spec.attack + spec.decay) / 1000) {
      envelope = 1 - (1 - spec.sustain) * ((t - spec.attack / 1000) / (spec.decay / 1000))
    } else if (t < duration - spec.release / 1000) {
      envelope = spec.sustain
    } else {
      envelope = spec.sustain * (1 - (t - (duration - spec.release / 1000)) / (spec.release / 1000))
    }

    let sample = 0

    // Mix all frequencies with decreasing amplitude
    for (let j = 0; j < allFrequencies.length; j++) {
      const freq = allFrequencies[j]
      const amplitude = 1 / (j + 1) // Decrease amplitude for higher harmonics
      const phase = 2 * Math.PI * freq * t
      sample += Math.sin(phase) * amplitude
    }

    sample = (sample / allFrequencies.length) * envelope * 0.3
    channelData[i] = Math.max(-1, Math.min(1, sample))
  }

  return buffer
}

/**
 * Generate frequency sweep (glissando)
 */
function generateSweep(audioContext, startFreq, endFreq, duration, spec) {
  const sampleRate = audioContext.sampleRate
  const numSamples = duration * sampleRate
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
  const channelData = buffer.getChannelData(0)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const progress = t / duration
    const freq = startFreq + (endFreq - startFreq) * progress
    const phase = 2 * Math.PI * freq * t

    // Envelope
    let envelope = 1
    if (t < spec.attack / 1000) {
      envelope = t / (spec.attack / 1000)
    } else if (t < (spec.attack + spec.decay) / 1000) {
      envelope = 1 - (1 - spec.sustain) * ((t - spec.attack / 1000) / (spec.decay / 1000))
    } else if (t < duration - spec.release / 1000) {
      envelope = spec.sustain
    } else {
      envelope = spec.sustain * (1 - (t - (duration - spec.release / 1000)) / (spec.release / 1000))
    }

    const sample = Math.sin(phase) * envelope * 0.3
    channelData[i] = sample
  }

  return buffer
}

/**
 * Generate chord (multiple simultaneous frequencies)
 */
function generateChord(audioContext, frequencies, duration, spec) {
  const sampleRate = audioContext.sampleRate
  const numSamples = duration * sampleRate
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
  const channelData = buffer.getChannelData(0)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate

    // Envelope
    let envelope = 1
    if (t < spec.attack / 1000) {
      envelope = t / (spec.attack / 1000)
    } else if (t < (spec.attack + spec.decay) / 1000) {
      envelope = 1 - (1 - spec.sustain) * ((t - spec.attack / 1000) / (spec.decay / 1000))
    } else if (t < duration - spec.release / 1000) {
      envelope = spec.sustain
    } else {
      envelope = spec.sustain * (1 - (t - (duration - spec.release / 1000)) / (spec.release / 1000))
    }

    let sample = 0
    for (const freq of frequencies) {
      const phase = 2 * Math.PI * freq * t
      sample += Math.sin(phase)
    }

    sample = (sample / frequencies.length) * envelope * 0.3
    channelData[i] = Math.max(-1, Math.min(1, sample))
  }

  return buffer
}

// ═══════════════════════════════════════════════════════════════
// SOUND GENERATION FACTORY
// ═══════════════════════════════════════════════════════════════

const bufferCache = new Map()

export function generateSound(specPath, audioContext = null) {
  if (!audioContext) {
    audioContext = getAudioContext()
  }

  // Check cache first
  const cacheKey = `${audioContext.sampleRate}-${specPath}`
  if (bufferCache.has(cacheKey)) {
    return bufferCache.get(cacheKey)
  }

  const spec = getSoundSpecFromPath(specPath)
  if (!spec) {
    console.warn(`Sound spec not found: ${specPath}`)
    return null
  }

  let buffer
  const durationSeconds = spec.duration / 1000

  if (spec.frequencies) {
    // Chord sound
    buffer = generateChord(audioContext, spec.frequencies, durationSeconds, spec)
  } else if (spec.startFreq && spec.endFreq) {
    // Sweep sound
    buffer = generateSweep(audioContext, spec.startFreq, spec.endFreq, durationSeconds, spec)
  } else if (spec.harmonics) {
    // Harmonic stack
    buffer = generateHarmonicStack(audioContext, spec.baseFreq, spec.harmonics, durationSeconds, spec)
  } else if (spec.frequency) {
    // Single frequency tone
    const tempSpec = { ...spec, frequency: spec.frequency }
    buffer = generateWaveform(audioContext, tempSpec, durationSeconds)
  } else {
    console.warn(`Unable to generate sound from spec: ${specPath}`)
    return null
  }

  // Cache the generated buffer
  bufferCache.set(cacheKey, buffer)

  return buffer
}

// ═══════════════════════════════════════════════════════════════
// SOUND PLAYBACK
// ═══════════════════════════════════════════════════════════════

export class SoundPlayer {
  constructor(audioContext = null) {
    this.audioContext = audioContext || getAudioContext()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.connect(this.audioContext.destination)
    this.masterGain.gain.value = 0.5
    this.activeSources = new Map()
    this.maxConcurrentSounds = 8
  }

  /**
   * Play a generated sound
   */
  playSound(specPath, options = {}) {
    const {
      volume = 1,
      loop = false,
      fadeInDuration = 0,
      panValue = 0,
      onEnd = null,
      sourceId = null,
    } = options

    // Stop existing source if sourceId provided
    if (sourceId && this.activeSources.has(sourceId)) {
      this.stopSound(sourceId)
    }

    // Limit concurrent sounds
    if (this.activeSources.size >= this.maxConcurrentSounds) {
      const firstKey = this.activeSources.keys().next().value
      this.stopSound(firstKey)
    }

    const buffer = generateSound(specPath, this.audioContext)
    if (!buffer) {
      console.error(`Failed to generate sound: ${specPath}`)
      return null
    }

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.loop = loop

    // Gain for volume control
    const gainNode = this.audioContext.createGain()
    gainNode.gain.value = volume

    if (fadeInDuration > 0) {
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + fadeInDuration / 1000)
    }

    // Panning
    if (panValue !== 0) {
      const panNode = this.audioContext.createStereoPanner()
      panNode.pan.value = Math.max(-1, Math.min(1, panValue))
      source.connect(panNode)
      panNode.connect(gainNode)
    } else {
      source.connect(gainNode)
    }

    gainNode.connect(this.masterGain)

    source.start(0)

    const id = sourceId || `sound-${Date.now()}-${Math.random()}`
    const soundData = { source, gainNode, buffer, startTime: this.audioContext.currentTime }

    source.onended = () => {
      this.activeSources.delete(id)
      if (onEnd) onEnd()
    }

    this.activeSources.set(id, soundData)

    return {
      id,
      stop: () => this.stopSound(id),
      setVolume: (vol) => {
        if (this.activeSources.has(id)) {
          gainNode.gain.setValueAtTime(vol, this.audioContext.currentTime)
        }
      },
      fadeOut: (duration) => this.fadeOutSound(id, duration),
    }
  }

  /**
   * Stop a sound immediately
   */
  stopSound(id) {
    if (this.activeSources.has(id)) {
      const { source } = this.activeSources.get(id)
      try {
        source.stop()
      } catch (e) {
        // Already stopped
      }
      this.activeSources.delete(id)
    }
  }

  /**
   * Fade out a sound
   */
  fadeOutSound(id, duration = 1000) {
    if (this.activeSources.has(id)) {
      const { source, gainNode } = this.activeSources.get(id)
      const fadeDuration = duration / 1000
      gainNode.gain.setValueAtTime(gainNode.gain.value, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeDuration)

      setTimeout(() => {
        try {
          source.stop()
        } catch (e) {
          // Already stopped
        }
        this.activeSources.delete(id)
      }, duration)
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume) {
    this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime)
  }

  /**
   * Get master volume
   */
  getMasterVolume() {
    return this.masterGain.gain.value
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    for (const id of this.activeSources.keys()) {
      this.stopSound(id)
    }
    this.activeSources.clear()
    bufferCache.clear()
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getSoundSpecFromPath(path) {
  const parts = path.split('.')
  let spec = SOUND_SPECS
  for (const part of parts) {
    spec = spec[part]
    if (!spec) return null
  }
  return spec
}

/**
 * Clear buffer cache
 */
export function clearBufferCache() {
  bufferCache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    cachedSounds: bufferCache.size,
    cacheSize: Array.from(bufferCache.values()).reduce((total, buffer) => {
      return total + (buffer.length * 4 * buffer.numberOfChannels)
    }, 0),
  }
}
