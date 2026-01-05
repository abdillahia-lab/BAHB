/**
 * useAudioReactivity - Audio Reactive Visualization Hook
 *
 * Handles:
 * - Frequency analysis from audio
 * - Real-time visualization data generation
 * - Audio-to-visual effect mapping
 * - Performance-optimized FFT analysis
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { REACTIVE_CONFIG } from '../utils/audioAssets'

export function useAudioReactivity(audioContext, isEnabled) {
  const analyserRef = useRef(null)
  const dataArrayRef = useRef(null)
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(REACTIVE_CONFIG.frequencyBands))
  const [visualizationData, setVisualizationData] = useState({
    scale: 1,
    opacity: 1,
    rotation: 0,
    blur: 0,
    colorShift: 0,
  })
  const animationIdRef = useRef(null)
  const masterGainRef = useRef(null)

  // Initialize analyser
  useEffect(() => {
    if (!audioContext || !isEnabled) {
      return
    }

    try {
      // Create analyser
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = REACTIVE_CONFIG.fftSize
      analyser.smoothingTimeConstant = REACTIVE_CONFIG.smoothing

      // Find the master gain node and connect analyser
      // We'll connect to the destination if we can't find master gain
      try {
        // Connect to the audio destination to capture all output
        audioContext.destination.connect?.(analyser)
      } catch (e) {
        // Fallback: connect directly
        audioContext.createMediaElementAudioSource?.(document.querySelector('audio'))?.connect(analyser)
      }

      analyserRef.current = analyser
      const bufferLength = analyser.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)
    } catch (error) {
      console.warn('Could not initialize audio analyser:', error)
    }

    return () => {
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect()
        } catch (e) {
          // Already disconnected
        }
      }
    }
  }, [audioContext, isEnabled])

  // Animation loop for frequency analysis
  useEffect(() => {
    if (!analyserRef.current || !isEnabled) {
      return
    }

    const analyseFrequencies = () => {
      if (!analyserRef.current || !dataArrayRef.current) {
        return
      }

      try {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)

        // Downsample to visualization bands
        const downsampledData = downsampleFrequencyData(
          dataArrayRef.current,
          REACTIVE_CONFIG.frequencyBands
        )

        setFrequencyData(new Uint8Array(downsampledData))

        // Calculate visualization effects
        const effects = mapFrequencyToEffects(downsampledData, REACTIVE_CONFIG.effectMappings)
        setVisualizationData(effects)
      } catch (error) {
        // Analyser might have been disconnected
      }

      animationIdRef.current = requestAnimationFrame(analyseFrequencies)
    }

    animationIdRef.current = requestAnimationFrame(analyseFrequencies)

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [isEnabled])

  const getFrequencyBand = useCallback((bandIndex) => {
    if (bandIndex < 0 || bandIndex >= frequencyData.length) {
      return 0
    }
    return frequencyData[bandIndex]
  }, [frequencyData])

  const getFrequencyRange = useCallback((startBand, endBand) => {
    let sum = 0
    let count = 0
    for (let i = startBand; i <= endBand && i < frequencyData.length; i++) {
      sum += frequencyData[i]
      count++
    }
    return count > 0 ? sum / count : 0
  }, [frequencyData])

  return {
    // Raw data
    frequencyData,
    analyser: analyserRef.current,

    // Processed visualization data
    visualizationData,
    scale: visualizationData.scale,
    opacity: visualizationData.opacity,
    rotation: visualizationData.rotation,
    blur: visualizationData.blur,
    colorShift: visualizationData.colorShift,

    // Query functions
    getFrequencyBand,
    getFrequencyRange,

    // For custom processing
    downsampleFrequencyData,
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Downsample frequency data to fewer bands
 */
export function downsampleFrequencyData(data, targetBands) {
  const downsampled = new Uint8Array(targetBands)
  const samplesPerBand = Math.ceil(data.length / targetBands)

  for (let i = 0; i < targetBands; i++) {
    let sum = 0
    let count = 0
    const start = i * samplesPerBand
    const end = Math.min((i + 1) * samplesPerBand, data.length)

    for (let j = start; j < end; j++) {
      sum += data[j]
      count++
    }

    downsampled[i] = Math.floor(sum / count)
  }

  return downsampled
}

/**
 * Map frequency data to visual effects
 */
export function mapFrequencyToEffects(frequencyData, mappings) {
  const effects = {
    scale: 1,
    opacity: 1,
    rotation: 0,
    blur: 0,
    colorShift: 0,
  }

  for (const [effectName, mapping] of Object.entries(mappings)) {
    const [startBand, endBand] = mapping.band
    const [minValue, maxValue] = mapping.range

    // Get average frequency in range
    let sum = 0
    let count = 0
    for (let i = startBand; i <= endBand && i < frequencyData.length; i++) {
      sum += frequencyData[i]
      count++
    }

    const avgFrequency = count > 0 ? sum / count : 0

    // Normalize to 0-1
    const normalized = Math.min(1, avgFrequency / 255)

    // Map to effect range
    const mappedValue = minValue + (maxValue - minValue) * normalized

    if (effectName === 'scale') {
      effects.scale = mappedValue
    } else if (effectName === 'opacity') {
      effects.opacity = mappedValue
    } else if (effectName === 'rotation') {
      effects.rotation = mappedValue
    } else if (effectName === 'blur') {
      effects.blur = mappedValue
    } else if (effectName === 'colorShift') {
      effects.colorShift = mappedValue
    }
  }

  return effects
}

/**
 * Create a visual element from frequency data
 */
export function createFrequencyVisualization(frequencyData, width = 512, height = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const barWidth = width / frequencyData.length
  let x = 0

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#00ffff')
  gradient.addColorStop(0.5, '#0099ff')
  gradient.addColorStop(1, '#0033ff')

  for (let i = 0; i < frequencyData.length; i++) {
    const barHeight = (frequencyData[i] / 255) * height

    ctx.fillStyle = gradient
    ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight)

    x += barWidth
  }

  return canvas
}

export default useAudioReactivity
