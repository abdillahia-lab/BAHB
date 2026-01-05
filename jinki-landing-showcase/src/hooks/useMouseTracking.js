import { useState, useEffect, useRef } from 'react'

/**
 * PARALLAX3D: Mouse Tracking Hook for Depth-Based Perspective Shifts
 * Tracks mouse position and converts to 3D perspective transform values
 * Performance optimized with RAF throttling
 */
export function useMouseTracking(sensitivity = 0.5) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [perspective, setPerspective] = useState({ rotateX: 0, rotateY: 0 })
  const containerRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      rafRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const moveX = (x - centerX) / centerX
        const moveY = (y - centerY) / centerY

        setPosition({ x: moveX, y: moveY })
        setPerspective({
          rotateX: -moveY * 10 * sensitivity,
          rotateY: moveX * 10 * sensitivity
        })
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [sensitivity])

  return { containerRef, position, perspective }
}

/**
 * PARALLAX3D: Device Orientation Hook (Gyroscope for Mobile)
 * Uses device's accelerometer for immersive mobile 3D experience
 */
export function useDeviceOrientation(sensitivity = 0.5) {
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const [isSupported, setIsSupported] = useState(false)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const handlePermission = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined') {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          try {
            const permission = await DeviceOrientationEvent.requestPermission()
            if (permission === 'granted') {
              setIsSupported(true)
              setIsActive(true)
            }
          } catch (err) {
            console.log('Device orientation permission denied', err)
          }
        } else {
          // Non-iOS 13 devices
          setIsSupported(true)
          setIsActive(true)
        }
      }
    }

    const handleDeviceOrientation = (event) => {
      const alpha = event.alpha || 0
      const beta = event.beta || 0
      const gamma = event.gamma || 0

      setOrientation({
        alpha: (gamma * sensitivity * 0.5),
        beta: (beta * sensitivity * 0.5),
        gamma: (alpha * sensitivity * 0.05)
      })
    }

    window.addEventListener('deviceorientation', handleDeviceOrientation)

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation)
    }
  }, [sensitivity])

  return {
    orientation,
    isSupported,
    isActive,
    requestPermission: async () => {
      if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission()
        return permission === 'granted'
      }
      return true
    }
  }
}

/**
 * PARALLAX3D: Depth Blur Hook
 * Calculates blur based on z-depth and proximity to viewport center
 */
export function useDepthBlur(depth = 0, maxBlur = 15) {
  return {
    filter: `blur(${Math.abs(depth) * maxBlur}px)`,
    opacity: Math.max(0.3, 1 - Math.abs(depth) * 0.5)
  }
}

export default useMouseTracking
