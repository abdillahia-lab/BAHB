/* ════════════════════════════════════════════════════════════════════════════════
   TEAM SCROLL-FLUIDITY - Scroll Animation Controller
   Minimal JS with Maximum Performance
   ════════════════════════════════════════════════════════════════════════════════ */

/**
 * Initialize all scroll-based animations
 * Call this once when your app/page loads
 */
export function initScrollAnimations(options = {}) {
  const config = {
    // IntersectionObserver options
    revealThreshold: 0.1,
    revealRootMargin: '50px',
    revealTriggerOnce: true,

    // Parallax options
    enableParallax: true,
    parallaxFPS: 60,

    // Smooth scroll options
    enableSmoothScroll: true,
    smoothScrollDuration: 1000,

    // Progress indicator options
    enableProgressBar: true,
    enableProgressCircle: true,
    progressCircleShowAt: 300, // Show after scrolling 300px

    // Sticky options
    enableStickyTransforms: true,

    ...options
  }

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    console.log('🎯 Scroll animations disabled: user prefers reduced motion')
    return
  }

  // Initialize features
  if (config.revealThreshold !== false) {
    initRevealOnScroll(config)
  }

  if (config.enableParallax) {
    initParallax(config)
  }

  if (config.enableProgressBar || config.enableProgressCircle) {
    initScrollProgress(config)
  }

  if (config.enableStickyTransforms) {
    initStickyTransforms()
  }

  if (config.enableSmoothScroll) {
    initSmoothScroll(config)
  }

  console.log('🎬 TEAM SCROLL-FLUIDITY: All animations initialized')
}

/* ════════════════════════════════════════════════════════════════════════════════
   1. REVEAL ON SCROLL - IntersectionObserver
   ════════════════════════════════════════════════════════════════════════════════ */

function initRevealOnScroll(config) {
  const revealElements = document.querySelectorAll(
    '.reveal, .reveal--fade, .reveal--up, .reveal--down, .reveal--left, .reveal--right, .reveal--scale, .reveal--scale-large, .reveal--zoom, .reveal--blur, .reveal--rotate, .reveal-stagger'
  )

  if (revealElements.length === 0) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')

          // Unobserve if triggerOnce is true
          if (config.revealTriggerOnce) {
            observer.unobserve(entry.target)
          }
        } else if (!config.revealTriggerOnce) {
          // Remove revealed class if element leaves viewport and triggerOnce is false
          entry.target.classList.remove('revealed')
        }
      })
    },
    {
      threshold: config.revealThreshold,
      rootMargin: config.revealRootMargin
    }
  )

  revealElements.forEach((el) => observer.observe(el))

  console.log(`👁️  IntersectionObserver watching ${revealElements.length} elements`)
}

/* ════════════════════════════════════════════════════════════════════════════════
   2. PARALLAX EFFECTS - RequestAnimationFrame
   ════════════════════════════════════════════════════════════════════════════════ */

function initParallax(config) {
  const parallaxLayers = document.querySelectorAll('[class*="parallax-layer"]')

  if (parallaxLayers.length === 0) return

  let ticking = false
  let lastScrollY = window.scrollY

  function updateParallax() {
    const scrollY = window.scrollY
    const windowHeight = window.innerHeight

    parallaxLayers.forEach((layer) => {
      const rect = layer.getBoundingClientRect()
      const elementTop = rect.top + scrollY
      const elementHeight = rect.height

      // Calculate progress (0 to 1) based on element position in viewport
      const progress = Math.max(0, Math.min(1,
        (scrollY + windowHeight - elementTop) / (windowHeight + elementHeight)
      ))

      // Set CSS custom property for parallax transform
      layer.style.setProperty('--scroll-progress', progress)
    })

    ticking = false
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateParallax)
      ticking = true
    }
  }

  // Throttle scroll events
  window.addEventListener('scroll', requestTick, { passive: true })

  // Initial update
  updateParallax()

  console.log(`🎨 Parallax initialized for ${parallaxLayers.length} layers`)
}

/* ════════════════════════════════════════════════════════════════════════════════
   3. SCROLL PROGRESS INDICATORS
   ════════════════════════════════════════════════════════════════════════════════ */

function initScrollProgress(config) {
  // Create progress bar
  if (config.enableProgressBar) {
    createProgressBar()
  }

  // Create circular progress indicator
  if (config.enableProgressCircle) {
    createProgressCircle(config.progressCircleShowAt)
  }

  let ticking = false

  function updateProgress() {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY
    const scrollPercentage = scrollTop / (documentHeight - windowHeight)

    // Update progress bar
    document.documentElement.style.setProperty('--scroll-percentage', scrollPercentage)

    // Show/hide circular progress
    const progressCircle = document.querySelector('.scroll-progress-circle')
    if (progressCircle) {
      if (scrollTop > config.progressCircleShowAt) {
        progressCircle.classList.add('scroll-progress-circle--visible')
      } else {
        progressCircle.classList.remove('scroll-progress-circle--visible')
      }
    }

    ticking = false
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateProgress)
      ticking = true
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true })
  updateProgress()

  console.log('📊 Scroll progress tracking initialized')
}

function createProgressBar() {
  if (document.querySelector('.scroll-progress')) return

  const progressBar = document.createElement('div')
  progressBar.className = 'scroll-progress'
  progressBar.innerHTML = '<div class="scroll-progress__bar"></div>'
  document.body.appendChild(progressBar)
}

function createProgressCircle(showAt) {
  if (document.querySelector('.scroll-progress-circle')) return

  const progressCircle = document.createElement('div')
  progressCircle.className = 'scroll-progress-circle'
  progressCircle.setAttribute('role', 'button')
  progressCircle.setAttribute('aria-label', 'Scroll to top')
  progressCircle.innerHTML = `
    <svg class="scroll-progress-circle__svg" viewBox="0 0 60 60">
      <circle class="scroll-progress-circle__bg" cx="30" cy="30" r="25"/>
      <circle class="scroll-progress-circle__progress" cx="30" cy="30" r="25"/>
    </svg>
    <svg class="scroll-progress-circle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 19V5M5 12l7-7 7 7"/>
    </svg>
  `

  // Click to scroll to top
  progressCircle.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })

  document.body.appendChild(progressCircle)
}

/* ════════════════════════════════════════════════════════════════════════════════
   4. STICKY ELEMENT TRANSFORMS
   ════════════════════════════════════════════════════════════════════════════════ */

function initStickyTransforms() {
  const stickyElements = document.querySelectorAll(
    '.sticky-header, .sticky-shrink, .sticky-blur'
  )

  if (stickyElements.length === 0) return

  let lastScrollY = window.scrollY
  let ticking = false

  function updateStickyElements() {
    const scrollY = window.scrollY

    stickyElements.forEach((element) => {
      if (scrollY > 50) {
        if (element.classList.contains('sticky-header')) {
          element.classList.add('sticky-header--scrolled')
        }
        if (element.classList.contains('sticky-shrink')) {
          element.classList.add('sticky-shrink--scrolled')
        }
        if (element.classList.contains('sticky-blur')) {
          element.classList.add('sticky-blur--scrolled')
        }
      } else {
        if (element.classList.contains('sticky-header')) {
          element.classList.remove('sticky-header--scrolled')
        }
        if (element.classList.contains('sticky-shrink')) {
          element.classList.remove('sticky-shrink--scrolled')
        }
        if (element.classList.contains('sticky-blur')) {
          element.classList.remove('sticky-blur--scrolled')
        }
      }
    })

    lastScrollY = scrollY
    ticking = false
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateStickyElements)
      ticking = true
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true })
  updateStickyElements()

  console.log(`📌 Sticky transforms initialized for ${stickyElements.length} elements`)
}

/* ════════════════════════════════════════════════════════════════════════════════
   5. SMOOTH SCROLL WITH EASING
   ════════════════════════════════════════════════════════════════════════════════ */

function initSmoothScroll(config) {
  // Smooth scroll for anchor links
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a[href^="#"]')
    if (!target) return

    const href = target.getAttribute('href')
    if (href === '#' || href === '#!') return

    const targetElement = document.querySelector(href)
    if (!targetElement) return

    e.preventDefault()
    smoothScrollTo(targetElement, config.smoothScrollDuration)
  })

  console.log('🎯 Smooth scroll enabled for anchor links')
}

/**
 * Smooth scroll to an element with easing
 * @param {HTMLElement} target - Element to scroll to
 * @param {number} duration - Animation duration in ms
 */
export function smoothScrollTo(target, duration = 1000) {
  const targetPosition = target.getBoundingClientRect().top + window.scrollY
  const startPosition = window.scrollY
  const distance = targetPosition - startPosition
  let startTime = null

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)

    // Easing function: ease-out-expo
    const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

    window.scrollTo(0, startPosition + distance * ease)

    if (timeElapsed < duration) {
      requestAnimationFrame(animation)
    }
  }

  requestAnimationFrame(animation)
}

/* ════════════════════════════════════════════════════════════════════════════════
   6. UTILITY FUNCTIONS
   ════════════════════════════════════════════════════════════════════════════════ */

/**
 * Get scroll percentage of the page
 * @returns {number} - Value between 0 and 1
 */
export function getScrollPercentage() {
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const scrollTop = window.scrollY
  return Math.max(0, Math.min(1, scrollTop / (documentHeight - windowHeight)))
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} threshold - Percentage of element that should be visible (0-1)
 * @returns {boolean}
 */
export function isInViewport(element, threshold = 0) {
  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight
  const elementHeight = rect.height
  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)
  const visiblePercentage = visibleHeight / elementHeight

  return visiblePercentage >= threshold
}

/**
 * Get element's scroll progress
 * @param {HTMLElement} element - Element to check
 * @returns {number} - Value between 0 and 1
 */
export function getElementScrollProgress(element) {
  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight
  const elementTop = rect.top
  const elementHeight = rect.height

  // Progress from 0 (top of viewport) to 1 (bottom of viewport)
  const progress = Math.max(0, Math.min(1,
    (windowHeight - elementTop) / (windowHeight + elementHeight)
  ))

  return progress
}

/**
 * Throttle function for scroll events
 * @param {Function} func - Function to throttle
 * @param {number} limit - Throttle limit in ms
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Debounce function for scroll events
 * @param {Function} func - Function to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {Function}
 */
export function debounce(func, delay) {
  let timeoutId
  return function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

/* ════════════════════════════════════════════════════════════════════════════════
   7. REACT HOOK (Optional)
   ════════════════════════════════════════════════════════════════════════════════ */

/**
 * React hook for scroll animations
 * Usage: useScrollAnimations()
 */
export function useScrollAnimations(options = {}) {
  if (typeof window === 'undefined') return

  // Use useEffect if in React environment
  if (typeof React !== 'undefined' && React.useEffect) {
    React.useEffect(() => {
      initScrollAnimations(options)
    }, [])
  } else {
    // Vanilla JS initialization
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initScrollAnimations(options))
    } else {
      initScrollAnimations(options)
    }
  }
}

/* ════════════════════════════════════════════════════════════════════════════════
   8. CLEANUP FUNCTION
   ════════════════════════════════════════════════════════════════════════════════ */

/**
 * Cleanup all scroll animations (useful for SPAs)
 */
export function cleanupScrollAnimations() {
  // Remove progress indicators
  const progressBar = document.querySelector('.scroll-progress')
  const progressCircle = document.querySelector('.scroll-progress-circle')

  if (progressBar) progressBar.remove()
  if (progressCircle) progressCircle.remove()

  console.log('🧹 Scroll animations cleaned up')
}

/* ════════════════════════════════════════════════════════════════════════════════
   9. DEFAULT EXPORT
   ════════════════════════════════════════════════════════════════════════════════ */

export default {
  init: initScrollAnimations,
  cleanup: cleanupScrollAnimations,
  smoothScrollTo,
  getScrollPercentage,
  isInViewport,
  getElementScrollProgress,
  throttle,
  debounce,
  useScrollAnimations
}
