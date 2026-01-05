// GESTURAL: Image component with gesture-based zoom and rotation
// Pinch to zoom, two-finger rotate, long press for details

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGestures } from '../hooks/useGestures'
import { createZoomController, createRotationController } from '../utils/gestureIntegration'
import './GestureEnabledImage.css'

const GestureEnabledImage = ({
  src,
  alt = 'Gesture-enabled image',
  minZoom = 1,
  maxZoom = 3,
  showHints = true,
  onImageClick = () => {},
}) => {
  const containerRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showDetails, setShowDetails] = useState(false)
  const [detailsPos, setDetailsPos] = useState({ x: 0, y: 0 })
  const dragStartRef = useRef(null)

  // Initialize gesture handlers
  const zoomController = createZoomController(minZoom, maxZoom, setZoom)
  const rotationController = createRotationController((rot) => setRotation(rot.z))

  const { gestureState } = useGestures(containerRef, {
    enablePinch: true,
    enableRotate: true,
    enableLongPress: true,
    enableSwipe: true,
    onPinch: (data) => {
      zoomController.handlePinch(data)
    },
    onRotate: (data) => {
      rotationController.handleRotate(data)
    },
    onLongPress: (data) => {
      setDetailsPos({ x: data.x, y: data.y })
      setShowDetails(true)

      // Auto-hide after 3 seconds
      setTimeout(() => setShowDetails(false), 3000)
    },
    onSwipe: (data) => {
      // Swipe can reset zoom/rotation
      if (zoom !== 1 || rotation !== 0) {
        zoomController.reset()
        rotationController.reset()
      }
    },
  })

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      }
    }
  }

  const handleTouchMove = (e) => {
    if (dragStartRef.current && e.touches.length === 1 && zoom > 1) {
      const touch = e.touches[0]
      setPosition({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y,
      })
    }
  }

  const handleTouchEnd = () => {
    dragStartRef.current = null
  }

  return (
    <div
      ref={containerRef}
      className="gesture-enabled-image-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className="image-wrapper"
        style={{
          scale: zoom,
          rotate: rotation,
          x: position.x,
          y: position.y,
        }}
        animate={{
          scale: zoom,
          rotate: rotation,
          x: position.x,
          y: position.y,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <img
          src={src}
          alt={alt}
          className="gesture-image"
          onClick={() => {
            onImageClick()
            if (zoom === 1 && rotation === 0) {
              zoomController.zoomIn()
            }
          }}
        />
      </motion.div>

      {/* Gesture Hints */}
      {showHints && (
        <motion.div
          className="gesture-hints-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="hint pinch-hint">
            <span className="hint-icon">🤏</span>
            <span className="hint-text">Pinch to zoom</span>
          </div>
          <div className="hint rotate-hint">
            <span className="hint-icon">🔄</span>
            <span className="hint-text">Two fingers to rotate</span>
          </div>
          <div className="hint longpress-hint">
            <span className="hint-icon">👆</span>
            <span className="hint-text">Long press for details</span>
          </div>
        </motion.div>
      )}

      {/* Details Popup */}
      {showDetails && (
        <motion.div
          className="image-details-popup"
          style={{
            left: detailsPos.x,
            top: detailsPos.y,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="details-content">
            <p className="detail-info">Current Zoom: {zoom.toFixed(1)}x</p>
            <p className="detail-info">Rotation: {Math.round(rotation)}°</p>
            <p className="detail-hint">Release to close</p>
          </div>
        </motion.div>
      )}

      {/* Gesture State Indicator */}
      <motion.div
        className="gesture-state-indicator"
        animate={{
          opacity: gestureState?.to ? 1 : 0,
        }}
      >
        <span className="state-badge">{gestureState?.to}</span>
      </motion.div>

      {/* Reset Button (appears when zoomed/rotated) */}
      {(zoom !== 1 || rotation !== 0) && (
        <motion.button
          className="reset-button"
          onClick={() => {
            zoomController.reset()
            rotationController.reset()
            setPosition({ x: 0, y: 0 })
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <span className="reset-icon">🔄</span>
          <span className="reset-text">Reset</span>
        </motion.button>
      )}
    </div>
  )
}

export default GestureEnabledImage
