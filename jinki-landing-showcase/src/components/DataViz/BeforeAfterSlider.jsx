import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './DataVizStyles.css'

/**
 * INTERACTIVE BEFORE/AFTER COMPARISON SLIDER
 * Drag-enabled visual comparison with smooth transitions
 */
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
  height = 400,
  width = '100%',
  showLabels = true,
}) {
  const containerRef = useRef(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  const handleTouchMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  return (
    <motion.div
      ref={containerRef}
      className="before-after-container"
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* After Image (Background) */}
      <motion.div
        className="before-after-image after-image"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <img src={afterSrc} alt={afterLabel} onLoad={() => setIsLoaded(true)} />
      </motion.div>

      {/* Before Image (Overlay) */}
      <motion.div
        className="before-after-image before-image"
        style={{
          width: `${sliderPosition}%`,
          overflow: 'hidden',
        }}
        animate={{ width: `${sliderPosition}%` }}
        transition={{ duration: 0.05 }}
      >
        <img src={beforeSrc} alt={beforeLabel} onLoad={() => setIsLoaded(true)} />
      </motion.div>

      {/* Slider Handle */}
      <motion.div
        className="slider-handle"
        style={{ left: `${sliderPosition}%` }}
        animate={{ left: `${sliderPosition}%` }}
        transition={{ duration: 0.05 }}
        drag="x"
        dragElastic={0.2}
        dragConstraints={{ left: 0, right: 0 }}
        whileDrag={{ scale: 1.1 }}
      >
        <div className="slider-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="15 18 9 12 15 6"></polyline>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </motion.div>

      {/* Labels */}
      {showLabels && (
        <>
          <motion.label className="label before-label" initial={{ opacity: 0 }}>
            {beforeLabel}
          </motion.label>
          <motion.label className="label after-label" initial={{ opacity: 0 }}>
            {afterLabel}
          </motion.label>
        </>
      )}

      {/* Loading State */}
      {!isLoaded && (
        <div className="slider-skeleton">
          <div className="skeleton-pulse"></div>
        </div>
      )}
    </motion.div>
  )
}

export default BeforeAfterSlider
