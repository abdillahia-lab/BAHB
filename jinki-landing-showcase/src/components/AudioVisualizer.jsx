/**
 * AudioVisualizer Component
 *
 * Audio-reactive visualization with:
 * - Real-time frequency analysis
 * - Geometric visualizations
 * - Smooth animations
 * - Multiple visualization modes
 */

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useAudio } from '../context/AudioContext'
import useAudioReactivity from '../hooks/useAudioReactivity'
import './AudioVisualizer.css'

export function AudioVisualizer({ mode = 'bars', width = 800, height = 200 }) {
  const { isEnabled, audioContext } = useAudio()
  const { frequencyData, visualizationData } = useAudioReactivity(audioContext, isEnabled)
  const canvasRef = useRef(null)
  const animationIdRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  // Intersection observer for performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (canvasRef.current) {
      observer.observe(canvasRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || !isVisible || !isEnabled) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (mode === 'bars') {
        drawBars(ctx, frequencyData, canvas.width, canvas.height)
      } else if (mode === 'waveform') {
        drawWaveform(ctx, frequencyData, canvas.width, canvas.height)
      } else if (mode === 'circle') {
        drawCircle(ctx, frequencyData, canvas.width, canvas.height)
      } else if (mode === 'spectrum') {
        drawSpectrum(ctx, frequencyData, canvas.width, canvas.height)
      } else if (mode === 'reactive') {
        drawReactive(ctx, frequencyData, canvas.width, canvas.height, visualizationData)
      }

      if (isVisible && isEnabled) {
        animationIdRef.current = requestAnimationFrame(animate)
      }
    }

    animationIdRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [mode, isVisible, isEnabled, frequencyData, visualizationData])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`audio-visualizer visualizer-${mode}`}
      style={{
        opacity: isEnabled ? 1 : 0.2,
        transition: 'opacity 0.3s ease',
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════
// VISUALIZATION MODES
// ═══════════════════════════════════════════════════════════════

function drawBars(ctx, data, width, height) {
  const barWidth = width / data.length
  let x = 0

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#00ffff')
  gradient.addColorStop(0.5, '#0099ff')
  gradient.addColorStop(1, '#0033ff')

  for (let i = 0; i < data.length; i++) {
    const barHeight = (data[i] / 255) * height

    ctx.fillStyle = gradient
    ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight)

    // Glow effect
    ctx.shadowColor = 'rgba(0, 255, 255, 0.5)'
    ctx.shadowBlur = 8
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
    ctx.strokeRect(x, height - barHeight, barWidth - 2, barHeight)

    x += barWidth
  }

  ctx.shadowColor = 'transparent'
}

function drawWaveform(ctx, data, width, height) {
  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 2
  ctx.beginPath()

  const centerY = height / 2
  const pointSpacing = width / data.length

  for (let i = 0; i < data.length; i++) {
    const y = centerY - (data[i] / 255) * (height / 2)
    const x = i * pointSpacing

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.stroke()

  // Fill with gradient
  ctx.lineTo(width, height / 2)
  ctx.lineTo(0, height / 2)
  ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'
  ctx.fill()
}

function drawCircle(ctx, data, width, height) {
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.min(width, height) / 2 - 20

  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 2

  for (let i = 0; i < data.length; i++) {
    const angle = (i / data.length) * Math.PI * 2
    const amplitude = (data[i] / 255) * maxRadius
    const radius = maxRadius * 0.5 + amplitude * 0.5

    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius

    if (i === 0) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.closePath()
  ctx.stroke()

  // Fill with radial gradient
  const radialGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius)
  radialGrad.addColorStop(0, 'rgba(0, 255, 255, 0.2)')
  radialGrad.addColorStop(1, 'rgba(0, 255, 255, 0.05)')
  ctx.fillStyle = radialGrad
  ctx.fill()
}

function drawSpectrum(ctx, data, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, 0)
  gradient.addColorStop(0, '#0033ff')
  gradient.addColorStop(0.5, '#00ffff')
  gradient.addColorStop(1, '#ff0099')

  const pointSpacing = width / data.length

  for (let i = 0; i < data.length; i++) {
    const hue = (i / data.length) * 360
    const saturation = 100
    const lightness = 50

    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    const barHeight = (data[i] / 255) * height

    ctx.fillRect(i * pointSpacing, height - barHeight, pointSpacing - 1, barHeight)
  }
}

function drawReactive(ctx, data, width, height, visualizationData) {
  // Draw animated circle with reactive effects
  const centerX = width / 2
  const centerY = height / 2
  const baseRadius = Math.min(width, height) / 3

  // Apply scale from audio
  const scaledRadius = baseRadius * visualizationData.scale

  // Draw multiple layers
  for (let layer = 0; layer < 3; layer++) {
    const layerRadius = scaledRadius - layer * 10
    if (layerRadius <= 0) continue

    ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 - layer * 0.15})`
    ctx.lineWidth = 2 - layer * 0.3

    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const angle = (i / data.length) * Math.PI * 2
      const amplitude = (data[i] / 255) * baseRadius * 0.3
      const radius = layerRadius + amplitude

      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.stroke()
  }

  // Draw center glow
  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, scaledRadius)
  glowGradient.addColorStop(0, `rgba(0, 255, 255, ${0.3 * visualizationData.opacity})`)
  glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)')
  ctx.fillStyle = glowGradient
  ctx.fillRect(0, 0, width, height)
}

export default AudioVisualizer
