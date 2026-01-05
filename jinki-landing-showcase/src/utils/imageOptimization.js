/**
 * LAZYMASTER: Image Optimization Utilities
 * Generates optimized srcSet, blur placeholders, and loading strategies
 */

// Generate responsive srcSet for various screen sizes
export const generateSrcSet = (baseUrl, sizes = [400, 800, 1200, 1600]) => {
  return sizes
    .map(size => `${baseUrl}?w=${size}&q=80&auto=format ${size}w`)
    .join(', ')
}

// Generate sizes attribute for responsive images
export const generateSizes = (breakpoints = {
  mobile: '(max-width: 768px) 100vw',
  tablet: '(max-width: 1024px) 50vw',
  desktop: '33vw'
}) => {
  return Object.values(breakpoints).join(', ')
}

// Create low-quality image placeholder (LQIP)
export const generateBlurDataURL = (width = 40, height = 30) => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Cfilter id='blur'%3E%3CfeGaussianBlur in='SourceGraphic' stdDeviation='20'/%3E%3C/filter%3E%3Crect width='${width}' height='${height}' fill='%230d1117' filter='url(%23blur)'/%3E%3C/svg%3E`
}

// WebP detection with fallback
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false

  const canvas = document.createElement('canvas')
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }
  return false
}

// Image format selection based on browser support
export const getOptimalFormat = (url) => {
  const format = supportsWebP() ? 'webp' : 'jpg'
  return `${url}?fm=${format}&q=80&auto=format`
}

// Priority calculation for image loading
export const calculateImagePriority = (position, viewport) => {
  // Hero images: high priority
  if (position === 'hero' || position === 'above-fold') {
    return 'high'
  }

  // Images near viewport: medium priority
  if (position === 'near-viewport') {
    return 'medium'
  }

  // Below fold: low priority
  return 'low'
}

// Estimate bandwidth and adjust quality
export const getAdaptiveQuality = () => {
  if (!navigator.connection) return 80 // Default quality

  const { effectiveType } = navigator.connection

  // Map connection types to quality settings
  const qualityMap = {
    'slow-2g': 40,
    '2g': 50,
    '3g': 65,
    '4g': 80,
    '5g': 90
  }

  return qualityMap[effectiveType] || 80
}

// Decode image with priority
export const decodeImage = async (img, priority = 'low') => {
  if (!img.decode) return Promise.resolve()

  try {
    if (priority === 'high') {
      // Decode immediately
      await img.decode()
    } else {
      // Defer decoding to next idle period
      if ('requestIdleCallback' in window) {
        await new Promise(resolve => {
          requestIdleCallback(() => {
            img.decode().then(resolve).catch(resolve)
          })
        })
      } else {
        await img.decode()
      }
    }
  } catch (error) {
    // Decoding error - image will still display
    console.warn('Image decode error:', error)
  }
}

// Preload critical image
export const preloadImage = (url, priority = 'high') => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = url
  link.importance = priority
  document.head.appendChild(link)
}

// Image dimension calculation for aspect ratio
export const calculateDimensions = (aspectRatio, maxWidth) => {
  const [width, height] = aspectRatio.split('/').map(Number)
  const ratio = height / width
  return {
    width: maxWidth,
    height: Math.round(maxWidth * ratio)
  }
}

// Check if image is in viewport
export const isImageInViewport = (element, threshold = 0) => {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= -threshold &&
    rect.left >= -threshold &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
  )
}

export default {
  generateSrcSet,
  generateSizes,
  generateBlurDataURL,
  supportsWebP,
  getOptimalFormat,
  calculateImagePriority,
  getAdaptiveQuality,
  decodeImage,
  preloadImage,
  calculateDimensions,
  isImageInViewport
}
