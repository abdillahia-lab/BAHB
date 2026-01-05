import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useMouseTracking, useDeviceOrientation } from '../hooks/useMouseTracking'
import './Parallax3D.css'

/**
 * PARALLAX3D: Revolutionary 3D Card Component
 * Features:
 * - CSS 3D transforms with preserve-3d
 * - Mouse-tracking perspective shifts
 * - Device orientation support (gyroscope)
 * - Depth-based blur and opacity
 * - 3D card flipping on interaction
 * - Performance optimized
 */
export function Parallax3DCard({
  children,
  image,
  title,
  depth = 0,
  isFlippable = false,
  backContent = null,
  mouseTracking = true,
  gyroTracking = false
}) {
  const [isFlipped, setIsFlipped] = useState(false)
  const { containerRef, perspective } = useMouseTracking(mouseTracking ? 0.8 : 0)
  const { orientation, isActive: gyroActive } = useDeviceOrientation(gyroTracking ? 0.6 : 0)

  const transformStyle = {
    transform: mouseTracking || gyroTracking ? `
      perspective(1200px)
      rotateX(${perspective.rotateX + orientation.beta}deg)
      rotateY(${perspective.rotateY + orientation.alpha}deg)
      translateZ(${depth}px)
    ` : `translateZ(${depth}px)`,
    filter: `blur(${Math.abs(depth) * 0.15}px)`,
    opacity: Math.max(0.5, 1 - Math.abs(depth) * 0.3),
    transition: 'transform 0.1s ease-out'
  }

  return (
    <div
      ref={containerRef}
      className="parallax-3d-card__wrapper"
      style={{ perspective: '1200px' }}
    >
      <motion.div
        className={`parallax-3d-card ${isFlipped ? 'is-flipped' : ''}`}
        style={{
          transformStyle: 'preserve-3d',
          ...transformStyle
        }}
        onClick={() => isFlippable && setIsFlipped(!isFlipped)}
        whileHover={isFlippable ? { scale: 1.05 } : {}}
      >
        {/* Front */}
        <div className="parallax-3d-card__front">
          {image && <img src={image} alt={title} className="parallax-3d-card__image"/>}
          <div className="parallax-3d-card__content">
            {children}
          </div>
        </div>

        {/* Back - 3D Flip */}
        {isFlippable && backContent && (
          <div className="parallax-3d-card__back">
            {backContent}
          </div>
        )}
      </motion.div>
    </div>
  )
}

/**
 * PARALLAX3D: Volumetric Light Rays
 * Creates 3D light rays with perspective distortion
 * Uses CSS 3D transforms to create depth
 */
export function VolumetricLightRays({ intensity = 0.5 }) {
  const containerRef = useRef(null)
  const { perspective } = useMouseTracking(0.3)

  return (
    <div
      ref={containerRef}
      className="volumetric-rays"
      style={{
        transform: `perspective(1000px) rotateX(${perspective.rotateX * 0.5}deg) rotateY(${perspective.rotateY * 0.5}deg)`
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="volumetric-ray"
          style={{
            opacity: intensity * (0.3 + i * 0.1),
            transform: `rotateZ(${i * 30}deg) translateY(-${300 + i * 50}px) skewY(${5 + i * 2}deg)`,
            animation: `volumetricFloat ${3 + i * 0.5}s ease-in-out infinite`
          }}
        />
      ))}
      <div className="volumetric-rays__glow" />
    </div>
  )
}

/**
 * PARALLAX3D: Infinite Zoom Parallax
 * Scales and translates elements based on scroll position
 * Creates illusion of infinite depth
 */
export function InfiniteZoomParallax({ children, speed = 0.5, maxZoom = 1.5 }) {
  const ref = useRef(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const viewportCenter = window.innerHeight / 2
      const elementCenter = rect.top + rect.height / 2
      const distance = Math.abs(elementCenter - viewportCenter)

      const maxDistance = window.innerHeight
      const progress = Math.max(0, 1 - (distance / maxDistance))
      const zoom = 1 + (maxZoom - 1) * progress * speed

      setZoomLevel(zoom)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed, maxZoom])

  return (
    <div
      ref={ref}
      className="infinite-zoom-parallax"
      style={{
        transform: `perspective(1000px) scale(${zoomLevel})`,
        transformOrigin: 'center',
        transition: 'transform 0.1s ease-out'
      }}
    >
      {children}
    </div>
  )
}

/**
 * PARALLAX3D: Depth-Based Tilt-Shift Blur
 * Creates focus area with surrounding blur based on depth
 */
export function TiltShiftDepthBlur({ children, depth = 0, blurAmount = 10 }) {
  const ref = useRef(null)
  const [focusPoint, setFocusPoint] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setFocusPoint({ x, y })
  }

  return (
    <div
      ref={ref}
      className="tilt-shift-blur"
      onMouseMove={handleMouseMove}
      style={{
        backgroundImage: `radial-gradient(
          ellipse at ${focusPoint.x}% ${focusPoint.y}%,
          rgba(0,0,0,0) 0%,
          rgba(0,0,0,${blurAmount/100}) 100%
        )`,
        filter: `blur(${Math.abs(depth) * blurAmount}px)`,
        transition: 'filter 0.2s ease-out'
      }}
    >
      {children}
    </div>
  )
}

/**
 * PARALLAX3D: 3D Text Depth Layers
 * Stacked text with varying perspective and depth
 */
export function DepthText({ text, layers = 5, spacing = 10 }) {
  const { containerRef, perspective } = useMouseTracking(0.6)

  return (
    <div
      ref={containerRef}
      className="depth-text"
      style={{
        perspective: '1200px',
        position: 'relative',
        height: '100%'
      }}
    >
      {Array.from({ length: layers }).map((_, i) => (
        <motion.div
          key={i}
          className="depth-text__layer"
          style={{
            transform: `
              perspective(1200px)
              translateZ(${i * spacing}px)
              rotateX(${perspective.rotateX * 0.3}deg)
              rotateY(${perspective.rotateY * 0.3}deg)
            `,
            opacity: 1 - (i * 0.15),
            filter: `blur(${i * 0.5}px)`,
            position: 'absolute',
            width: '100%',
            textAlign: 'center'
          }}
        >
          {text}
        </motion.div>
      ))}
    </div>
  )
}

export default Parallax3DCard
