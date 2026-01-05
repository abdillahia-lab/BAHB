/**
 * MICROFEEDBACK - MICRO-INTERACTIONS LIBRARY
 * Exceptional micro-interactions for Jinki Intelligence
 * Framer Motion variants + CSS animations for responsive feedback
 *
 * Performance-optimized with GPU acceleration and proper timing
 */

// ═══════════════════════════════════════════════════════════════
// TIMING CONFIGURATIONS - Optimized for user perception
// ═══════════════════════════════════════════════════════════════

export const TIMING = {
  // Instant feedback (perceptual instantaneity)
  INSTANT: 0.1,           // 100ms - button presses, toggles
  FAST: 0.15,             // 150ms - quick confirmations
  QUICK: 0.2,             // 200ms - snappy interactions
  NORMAL: 0.3,            // 300ms - standard transitions
  MEDIUM: 0.4,            // 400ms - deliberate movements
  SLOW: 0.5,              // 500ms - reveal animations
  LEISURELY: 0.7,         // 700ms - slow reveals
  EPIC: 1.0,              // 1000ms - grand entrances

  // Stagger delays for sequential elements
  STAGGER_MINI: 0.05,
  STAGGER_SMALL: 0.08,
  STAGGER_MEDIUM: 0.12,
  STAGGER_LARGE: 0.15,
}

// ═══════════════════════════════════════════════════════════════
// EASING FUNCTIONS - Carefully curated for different contexts
// ═══════════════════════════════════════════════════════════════

export const EASING = {
  // Standard easing curves
  LINEAR: [0.25, 0.25, 0.75, 0.75],
  EASE_IN: [0.42, 0, 1, 1],
  EASE_OUT: [0, 0, 0.58, 1],
  EASE_IN_OUT: [0.42, 0, 0.58, 1],

  // Material Design easing
  MATERIAL_STANDARD: [0.4, 0.0, 0.2, 1.0],
  MATERIAL_DECELERATE: [0.0, 0.0, 0.2, 1.0],
  MATERIAL_ACCELERATE: [0.4, 0.0, 1.0, 1.0],

  // Custom spring curves
  BOUNCE_OUT: [0.34, 1.56, 0.64, 1],
  ELASTIC: [0.175, 0.885, 0.32, 1.275],
  CUBIC_EASE: [0.33, 0.66, 0.66, 1],
  QUINTIC_EASE: [0.86, 0, 0.07, 1],

  // For micro-interactions
  SNAP: [0.85, 0, 0.15, 1],          // Quick snap to place
  ANTICIPATION: [0.68, -0.55, 0.265, 1.55],
  OVERSHOOT: [0.34, 1.56, 0.64, 1],
}

// ═══════════════════════════════════════════════════════════════
// BUTTON VARIANTS - Scale, ripple, glow feedback
// ═══════════════════════════════════════════════════════════════

export const buttonVariants = {
  // Primary button (scale + shadow depth)
  primary: {
    rest: {
      scale: 1,
      y: 0,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: { type: 'spring', stiffness: 400, damping: 17 },
    },
    hover: {
      scale: 1.02,
      y: -2,
      boxShadow: '0 12px 24px rgba(0, 122, 204, 0.25)',
      transition: { type: 'spring', stiffness: 400, damping: 17 },
    },
    tap: {
      scale: 0.98,
      y: 0,
      boxShadow: '0 4px 12px rgba(0, 122, 204, 0.15)',
      transition: { type: 'spring', stiffness: 600, damping: 20 },
    },
    press: {
      scale: 0.96,
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    },
  },

  // Secondary button (subtle highlight)
  secondary: {
    rest: {
      scale: 1,
      backgroundColor: 'rgba(100, 100, 100, 0.1)',
      transition: { type: 'spring', stiffness: 300, damping: 15 },
    },
    hover: {
      scale: 1.02,
      backgroundColor: 'rgba(100, 100, 100, 0.2)',
      transition: { type: 'spring', stiffness: 300, damping: 15 },
    },
    tap: {
      scale: 0.98,
      backgroundColor: 'rgba(100, 100, 100, 0.15)',
    },
  },

  // Ghost button (outline only)
  ghost: {
    rest: {
      scale: 1,
      borderColor: 'currentColor',
      color: 'currentColor',
      backgroundColor: 'transparent',
    },
    hover: {
      scale: 1.03,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    tap: {
      scale: 0.97,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  },

  // Glow button (luminous feedback)
  glow: {
    rest: {
      scale: 1,
      boxShadow: '0 0 0 0px rgba(0, 122, 204, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: { type: 'spring', stiffness: 300, damping: 15 },
    },
    hover: {
      scale: 1.02,
      boxShadow: '0 0 20px 2px rgba(0, 122, 204, 0.6), 0 8px 16px rgba(0, 122, 204, 0.2)',
    },
    tap: {
      scale: 0.98,
      boxShadow: '0 0 10px 0px rgba(0, 122, 204, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)',
    },
  },

  // Icon button (minimal, sharp)
  icon: {
    rest: {
      scale: 1,
      rotate: 0,
      opacity: 0.7,
    },
    hover: {
      scale: 1.1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 500, damping: 15 },
    },
    tap: {
      scale: 0.95,
    },
  },
}

// ═══════════════════════════════════════════════════════════════
// RIPPLE EFFECT - Classic Material Design ripple
// ═══════════════════════════════════════════════════════════════

export const rippleVariants = {
  initial: {
    scale: 0,
    opacity: 0.75,
  },
  animate: {
    scale: 4,
    opacity: 0,
    transition: {
      duration: TIMING.QUICK,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
  },
}

// ═══════════════════════════════════════════════════════════════
// HOVER STATE PROGRESSIONS - 3-stage reveals
// ═══════════════════════════════════════════════════════════════

export const hoverProgressionVariants = {
  // Stage 1: Subtle scale + brightness
  stage1: {
    rest: {
      scale: 1,
      filter: 'brightness(1)',
    },
    hover: {
      scale: 1.02,
      filter: 'brightness(1.1)',
      transition: { duration: TIMING.FAST },
    },
  },

  // Stage 2: Scale + color shift
  stage2: {
    rest: {
      scale: 1,
      backgroundColor: 'rgba(0, 122, 204, 0.05)',
    },
    hover: {
      scale: 1.04,
      backgroundColor: 'rgba(0, 122, 204, 0.15)',
      transition: { duration: TIMING.QUICK },
    },
  },

  // Stage 3: Full reveal with glow
  stage3: {
    rest: {
      scale: 1,
      boxShadow: '0 0 0 0px rgba(0, 122, 204, 0)',
      y: 0,
    },
    hover: {
      scale: 1.05,
      boxShadow: '0 0 30px 3px rgba(0, 122, 204, 0.3)',
      y: -4,
      transition: { duration: TIMING.NORMAL },
    },
  },

  // Sequential three-stage: Combine all
  sequential: (stageIndex) => ({
    rest: {
      scale: 1,
      opacity: 0.8,
      y: 0,
    },
    hover: {
      scale: 1.02 + stageIndex * 0.015,
      opacity: 1,
      y: -2 - stageIndex * 2,
      transition: {
        duration: TIMING.FAST + stageIndex * TIMING.FAST,
        delay: stageIndex * TIMING.STAGGER_MINI,
      },
    },
  }),
}

// ═══════════════════════════════════════════════════════════════
// LOADING ANIMATIONS - Skeletons, spinners, progress
// ═══════════════════════════════════════════════════════════════

export const loadingVariants = {
  // Pulse effect
  pulse: {
    animate: {
      opacity: [1, 0.5, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },

  // Shimmer skeleton
  shimmer: {
    animate: {
      backgroundPosition: ['200% 0%', '-200% 0%'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },

  // Rotating spinner
  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },

  // Bouncing dots
  bounce: (index) => ({
    animate: {
      y: [0, -12, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        delay: index * 0.1,
        ease: 'easeInOut',
      },
    },
  }),

  // Progress bar fill
  progressFill: {
    initial: { width: '0%' },
    animate: (progress) => ({
      width: `${progress}%`,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  },

  // Wave loading
  wave: {
    animate: {
      x: ['0%', '100%'],
      opacity: [0.2, 1, 0.2],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },

  // Skeleton fade-in to content
  skeletonToContent: {
    initial: { opacity: 1 },
    exit: {
      opacity: 0,
      transition: { duration: TIMING.QUICK },
    },
  },
}

// ═══════════════════════════════════════════════════════════════
// SUCCESS/ERROR FEEDBACK ANIMATIONS
// ═══════════════════════════════════════════════════════════════

export const feedbackVariants = {
  // Success checkmark
  success: {
    initial: {
      scale: 0,
      rotate: -180,
    },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 15,
        duration: TIMING.QUICK,
      },
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: { duration: TIMING.FAST },
    },
  },

  // Error shake
  error: {
    animate: {
      x: [-10, 10, -10, 10, 0],
      transition: {
        duration: TIMING.NORMAL,
        type: 'spring',
      },
    },
  },

  // Warning pulse
  warning: {
    animate: {
      scale: [1, 1.05, 1],
      boxShadow: [
        '0 0 0 0px rgba(255, 193, 7, 0.4)',
        '0 0 0 12px rgba(255, 193, 7, 0)',
      ],
      transition: {
        duration: 1,
        repeat: Infinity,
      },
    },
  },

  // Info fade-in with slide
  info: {
    initial: {
      opacity: 0,
      y: -20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: TIMING.QUICK,
        ease: EASING.MATERIAL_DECELERATE,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: TIMING.FAST },
    },
  },

  // Toast notification slide-in
  toast: {
    initial: { x: 400, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
    exit: {
      x: 400,
      opacity: 0,
      transition: { duration: TIMING.FAST },
    },
  },
}

// ═══════════════════════════════════════════════════════════════
// SCROLL PROGRESS INDICATORS
// ═══════════════════════════════════════════════════════════════

export const scrollProgressVariants = {
  // Horizontal progress bar
  progressBar: {
    animate: (scrollProgress) => ({
      width: `${scrollProgress * 100}%`,
      transition: {
        type: 'tween',
        ease: 'linear',
        duration: 0,
      },
    }),
  },

  // Vertical scroll indicator
  scrollIndicator: {
    animate: (scrollProgress) => ({
      height: `${scrollProgress * 100}%`,
      transition: { duration: 0, ease: 'linear' },
    }),
  },

  // Dot progress indicator
  progressDot: (isActive) => ({
    scale: isActive ? 1.2 : 1,
    opacity: isActive ? 1 : 0.5,
    backgroundColor: isActive ? '#007ACC' : 'rgba(255,255,255,0.3)',
    transition: { duration: TIMING.QUICK },
  }),

  // Circular progress
  circleProgress: {
    initial: {
      pathLength: 0,
    },
    animate: (progress) => ({
      pathLength: progress,
      transition: { duration: 0.2 },
    }),
  },
}

// ═══════════════════════════════════════════════════════════════
// FORM FIELD FOCUS ANIMATIONS
// ═══════════════════════════════════════════════════════════════

export const formFieldVariants = {
  // Input field with underline animation
  inputUnderline: {
    rest: {
      borderBottomWidth: '1px',
      borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    },
    focus: {
      borderBottomWidth: '2px',
      borderBottomColor: '#007ACC',
      transition: { duration: TIMING.FAST },
    },
  },

  // Label animation (floating label)
  floatingLabel: {
    rest: {
      y: 0,
      fontSize: '1rem',
      color: 'rgba(0, 0, 0, 0.6)',
    },
    focus: {
      y: -24,
      fontSize: '0.75rem',
      color: '#007ACC',
      transition: { duration: TIMING.QUICK },
    },
  },

  // Input wrapper with glow
  inputWrapper: {
    rest: {
      boxShadow: '0 0 0 0px rgba(0, 122, 204, 0)',
      transition: { duration: TIMING.NORMAL },
    },
    focus: {
      boxShadow: '0 0 0 3px rgba(0, 122, 204, 0.1)',
    },
  },

  // Input background fill
  inputFill: {
    rest: {
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    focus: {
      backgroundColor: 'rgba(0, 122, 204, 0.05)',
      transition: { duration: TIMING.FAST },
    },
  },

  // Character counter animation
  counter: {
    initial: { opacity: 0, y: -4 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: TIMING.FAST },
  },

  // Error message with shake
  errorMessage: {
    initial: { opacity: 0, x: -8 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: TIMING.FAST },
    },
    exit: {
      opacity: 0,
      x: -8,
      transition: { duration: TIMING.FAST },
    },
  },

  // Success checkmark in field
  successCheckmark: {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 12,
      },
    },
  },
}

// ═══════════════════════════════════════════════════════════════
// CARD HOVER MICRO-MOVEMENTS
// ═══════════════════════════════════════════════════════════════

export const cardVariants = {
  // Lift and shadow depth
  container: {
    rest: {
      y: 0,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      transition: { type: 'spring', stiffness: 300, damping: 15 },
    },
    hover: {
      y: -8,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
      transition: { type: 'spring', stiffness: 300, damping: 15 },
    },
  },

  // Subtle rotation on hover
  tilt: {
    rest: {
      rotateX: 0,
      rotateY: 0,
    },
    hover: (x, y) => ({
      rotateX: y * 0.02,
      rotateY: x * 0.02,
      transition: { type: 'spring', stiffness: 400, damping: 20 },
    }),
  },

  // Image zoom effect
  imageZoom: {
    rest: {
      scale: 1,
    },
    hover: {
      scale: 1.05,
      transition: { duration: TIMING.MEDIUM },
    },
  },

  // Content slide up
  contentSlide: {
    rest: {
      y: 0,
      opacity: 1,
    },
    hover: {
      y: -4,
      opacity: 1,
      transition: { duration: TIMING.QUICK },
    },
  },

  // Border animation
  borderGlow: {
    rest: {
      borderColor: 'rgba(0, 0, 0, 0.1)',
      boxShadow: '0 0 0 0px rgba(0, 122, 204, 0)',
    },
    hover: {
      borderColor: 'rgba(0, 122, 204, 0.3)',
      boxShadow: '0 0 0 1px rgba(0, 122, 204, 0.2)',
      transition: { duration: TIMING.QUICK },
    },
  },

  // Multiple children stagger
  children: (index) => ({
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * TIMING.STAGGER_SMALL,
        duration: TIMING.QUICK,
      },
    },
  }),
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION ITEM FEEDBACK
// ═══════════════════════════════════════════════════════════════

export const navigationVariants = {
  // Link underline animation
  linkUnderline: {
    rest: {
      width: '0%',
      opacity: 0,
    },
    hover: {
      width: '100%',
      opacity: 1,
      transition: { duration: TIMING.QUICK },
    },
  },

  // Nav item highlight
  navItem: {
    rest: {
      backgroundColor: 'transparent',
      color: 'inherit',
      scale: 1,
    },
    hover: {
      backgroundColor: 'rgba(0, 122, 204, 0.1)',
      color: '#007ACC',
      scale: 1.02,
      transition: { duration: TIMING.FAST },
    },
    active: {
      backgroundColor: 'rgba(0, 122, 204, 0.15)',
      color: '#007ACC',
      fontWeight: 600,
      borderBottomColor: '#007ACC',
    },
  },

  // Dropdown menu
  dropdownMenu: {
    initial: {
      opacity: 0,
      y: -12,
      pointerEvents: 'none',
    },
    animate: {
      opacity: 1,
      y: 0,
      pointerEvents: 'auto',
      transition: {
        duration: TIMING.QUICK,
        ease: EASING.MATERIAL_DECELERATE,
      },
    },
    exit: {
      opacity: 0,
      y: -12,
      pointerEvents: 'none',
      transition: { duration: TIMING.FAST },
    },
  },

  // Breadcrumb chevron
  breadcrumbChevron: {
    rest: {
      x: 0,
      opacity: 0.5,
    },
    hover: {
      x: 2,
      opacity: 1,
      transition: { duration: TIMING.QUICK },
    },
  },

  // Mobile menu slide
  mobileMenu: {
    initial: {
      x: '-100%',
      opacity: 0,
    },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
    exit: {
      x: '-100%',
      opacity: 0,
      transition: { duration: TIMING.QUICK },
    },
  },

  // Active indicator animation
  activeIndicator: {
    layoutId: 'activeIndicator',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
}

// ═══════════════════════════════════════════════════════════════
// UTILITY ANIMATIONS - General purpose
// ═══════════════════════════════════════════════════════════════

export const utilityVariants = {
  // Fade in
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: TIMING.QUICK },
  },

  // Slide in from left
  slideInLeft: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: TIMING.QUICK },
  },

  // Slide in from right
  slideInRight: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: TIMING.QUICK },
  },

  // Slide in from top
  slideInTop: {
    initial: { opacity: 0, y: -40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: TIMING.QUICK },
  },

  // Slide in from bottom
  slideInBottom: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: TIMING.QUICK },
  },

  // Scale up
  scaleUp: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },

  // Rotate in
  rotateIn: {
    initial: { opacity: 0, rotate: -180 },
    animate: { opacity: 1, rotate: 0 },
    transition: { duration: TIMING.NORMAL },
  },

  // Bounce in
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 15,
      },
    },
  },

  // Flip card effect
  flipCard: {
    initial: { rotateY: -90 },
    animate: { rotateY: 0 },
    transition: { duration: TIMING.NORMAL },
  },

  // Stagger container
  staggerContainer: (staggerChildren = TIMING.STAGGER_MEDIUM) => ({
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren: 0.2,
      },
    },
  }),

  // Stagger children
  staggerChildren: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
}

// ═══════════════════════════════════════════════════════════════
// SPRING PRESETS - Reusable spring configurations
// ═══════════════════════════════════════════════════════════════

export const springs = {
  // Snappy, responsive
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 20,
    mass: 1,
  },

  // Bouncy, playful
  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 10,
    mass: 1,
  },

  // Smooth, elegant
  smooth: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 1,
  },

  // Gentle, subtle
  gentle: {
    type: 'spring',
    stiffness: 200,
    damping: 30,
    mass: 1,
  },

  // Molasses, slow and heavy
  molasses: {
    type: 'spring',
    stiffness: 100,
    damping: 40,
    mass: 1.5,
  },
}

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE OPTIMIZATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Apply GPU acceleration to element
 * Use on frequently animated elements
 */
export const gpuOptimize = {
  willChange: 'transform, opacity',
  backfaceVisibility: 'hidden',
  perspective: 1000,
}

/**
 * Motion configuration for performance
 */
export const motionConfig = {
  // Reduce motion for accessibility
  reducedMotion: {
    initial: false,
    animate: true,
    transition: { duration: 0 },
  },

  // Disable transitions on low-end devices
  lowEndDevice: {
    skipAnimation: typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: no-preference)').matches,
  },
}

// ═══════════════════════════════════════════════════════════════
// INTERSECTION OBSERVER CONFIG - For scroll-triggered animations
// ═══════════════════════════════════════════════════════════════

export const observerConfig = {
  // Trigger animation when 10% visible
  minimal: {
    threshold: 0.1,
    rootMargin: '0px',
  },

  // Trigger when element is fully in viewport
  full: {
    threshold: 1.0,
    rootMargin: '0px',
  },

  // Trigger early for slow reveals
  early: {
    threshold: 0,
    rootMargin: '100px',
  },

  // Lazy load images/content
  lazy: {
    threshold: 0.01,
    rootMargin: '50px',
  },
}

export default {
  TIMING,
  EASING,
  buttonVariants,
  rippleVariants,
  hoverProgressionVariants,
  loadingVariants,
  feedbackVariants,
  scrollProgressVariants,
  formFieldVariants,
  cardVariants,
  navigationVariants,
  utilityVariants,
  springs,
  gpuOptimize,
  motionConfig,
  observerConfig,
}
