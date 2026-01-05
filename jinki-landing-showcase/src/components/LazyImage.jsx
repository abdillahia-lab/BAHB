import { useState, useEffect } from 'react'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import '../styles/lazy-image.css'

/**
 * LAZYMASTER: Premium Lazy Image Component
 * Features:
 * - Blur-up placeholder effect (LQIP - Low Quality Image Placeholder)
 * - Loading state detection
 * - Error handling with fallback
 * - Proper priority hints (fetchpriority, decoding)
 * - Predictive prefetch on hover
 */
export const LazyImage = ({
  src,
  alt = 'Image',
  placeholder = null,
  priority = false,
  className = '',
  containerClassName = '',
  onLoad = () => {},
  onError = () => {},
  width,
  height,
  srcSet,
  sizes
}) => {
  const { ref, hasBeenVisible } = useIntersectionObserver({
    threshold: 0.01,
    rootMargin: '100px'
  })

  const [imageSrc, setImageSrc] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Predictive prefetch on hover
  useEffect(() => {
    if (isHovered && !imageSrc) {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = src
      link.as = 'image'
      document.head.appendChild(link)
    }
  }, [isHovered, imageSrc, src])

  // Load image when visible
  useEffect(() => {
    if (!hasBeenVisible && !priority) return

    const loadImage = () => {
      const img = new Image()

      img.onload = () => {
        setImageSrc(src)
        setIsLoading(false)
        onLoad()
      }

      img.onerror = () => {
        setError(true)
        setIsLoading(false)
        onError()
      }

      // Load with proper priority hints
      img.fetchPriority = priority ? 'high' : 'low'
      img.loading = priority ? 'eager' : 'lazy'
      img.decoding = 'async'
      img.src = src

      if (srcSet) {
        img.srcSet = srcSet
      }
    }

    loadImage()
  }, [hasBeenVisible, priority, src, srcSet, onLoad, onError])

  if (error) {
    return (
      <div
        ref={ref}
        className={`lazy-image lazy-image--error ${containerClassName}`}
        style={{ width, height, aspectRatio: width && height ? `${width}/${height}` : 'auto' }}
      >
        <div className="lazy-image__error-content">
          <span className="lazy-image__error-icon">⚠️</span>
          <p className="lazy-image__error-text">Failed to load image</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={`lazy-image ${isLoading ? 'lazy-image--loading' : 'lazy-image--loaded'} ${containerClassName}`}
      style={{ width, height, aspectRatio: width && height ? `${width}/${height}` : 'auto' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Blur-up placeholder */}
      {placeholder && isLoading && (
        <img
          src={placeholder}
          alt=""
          className="lazy-image__placeholder"
          aria-hidden="true"
          decoding="sync"
        />
      )}

      {/* Main image */}
      {imageSrc && (
        <img
          src={imageSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={`lazy-image__img ${className}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'low'}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && !placeholder && (
        <div className="lazy-image__skeleton">
          <div className="lazy-image__skeleton-pulse" />
        </div>
      )}
    </div>
  )
}

/**
 * Generate responsive blur-up placeholder
 * Usage: src={generateBlurPlaceholder('/image.jpg')}
 */
export const generateBlurPlaceholder = (srcUrl) => {
  // Returns a data URI of a tiny blurred version
  // In production, you'd generate this server-side or use a service
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cfilter id='blur'%3E%3CfeGaussianBlur in='SourceGraphic' stdDeviation='20'/%3E%3C/filter%3E%3Crect width='400' height='300' fill='%23ddd' filter='url(%23blur)'/%3E%3C/svg%3E`
}

export default LazyImage
