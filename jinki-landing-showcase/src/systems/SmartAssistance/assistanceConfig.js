/**
 * ════════════════════════════════════════════════════════════════
 * SMART ASSISTANCE CONFIGURATION
 * Proactive AI help system for Jinki Intelligence
 * ════════════════════════════════════════════════════════════════
 */

// CONFUSION SIGNALS - Behavioral indicators that user needs help
export const CONFUSION_SIGNALS = {
  // Scroll patterns indicating user is lost
  RAPID_SCROLL: {
    threshold: 5, // 5 scroll events in 2 seconds
    timeWindow: 2000,
    confidence: 0.6,
  },

  // User scrolling back and forth (search behavior)
  BACK_FORTH_SCROLL: {
    threshold: 3,
    timeWindow: 5000,
    confidence: 0.7,
  },

  // Extended idle time on section without interaction
  IDLE_ON_SECTION: {
    threshold: 8000, // 8 seconds
    confidence: 0.5,
  },

  // Mouse hovering without clicking (exploration mode)
  HOVER_WITHOUT_ACTION: {
    threshold: 3,
    timeWindow: 5000,
    confidence: 0.4,
  },

  // Form field focus but no input
  FORM_HESITATION: {
    threshold: 3000, // 3 seconds
    confidence: 0.7,
  },

  // Multiple click attempts on non-interactive element
  CLICK_HUNTING: {
    threshold: 3,
    timeWindow: 3000,
    confidence: 0.8,
  }
}

// ASSISTANCE TRIGGERS - When and where to show help
export const ASSISTANCE_TRIGGERS = {
  // Hero section - Welcome tour for first-time visitors
  HERO_SECTION: {
    type: 'guided_tour',
    trigger: 'page_load',
    delay: 2000,
    condition: (user) => user.isFirstVisit && !user.dismissedTours.includes('hero'),
    maxShowsPerSession: 1,
  },

  // Drone Inspection section - Interactive help
  DRONE_INSPECTION: {
    type: 'contextual_tooltip',
    trigger: 'hover',
    topics: [
      { selector: '.drone-demo', content: 'Click to interact with live drone footage' },
      { selector: '.inspection-3d', content: 'Drag to rotate the 3D model' },
    ],
    delay: 1500,
    dismissible: true,
  },

  // Cybersecurity section - Data visualization guide
  CYBERSECURITY_SECTION: {
    type: 'smart_suggestion',
    trigger: 'confusion_detected',
    timeWindow: 5000,
    suggestions: [
      { text: 'Scroll to see threat detection in action', icon: 'arrow-down' },
      { text: 'Use your mouse to interact with the security dashboard', icon: 'mouse-pointer' },
    ],
  },

  // CTA Forms - Intelligent form assistance
  CONTACT_FORM: {
    type: 'form_assistance',
    trigger: 'form_focus',
    fields: {
      email: {
        hint: 'Enter your work email for faster setup',
        validation: 'email',
        errorMessage: 'Please enter a valid email',
      },
      company: {
        hint: 'Organization name helps us tailor recommendations',
        suggestions: ['Tech Startup', 'Enterprise', 'Government', 'Other'],
      },
      useCase: {
        hint: 'Tell us what you want to solve',
        options: ['Drone Inspection', 'Cybersecurity', 'Risk Assessment', 'Other'],
      }
    },
    successCelebration: true,
  },

  // Features section - "You might also like"
  FEATURE_DISCOVERY: {
    type: 'recommendation',
    trigger: 'section_complete',
    maxRecommendations: 2,
    basedOn: ['currentSection', 'viewingTime', 'scrollDepth'],
  },

  // Complex sections - Reading time estimates
  READING_TIME: {
    type: 'reading_estimate',
    trigger: 'section_enter',
    showFor: ['features', 'use-cases', 'security-deep-dive'],
    readingSpeedWPM: 200,
  },

  // CTA buttons - Conversion nudges
  CTA_NUDGE: {
    type: 'subtle_nudge',
    trigger: 'near_viewport',
    delay: 3000,
    animation: 'pulse-glow',
    maxShowsPerSession: 2,
  },

  // Mobile-specific - Simplified assistance
  MOBILE_ASSISTANCE: {
    type: 'simplified_tooltip',
    trigger: 'device_mobile',
    positioning: 'bottom',
    maxWidth: '90vw',
  },
}

// UI PATTERNS - Non-intrusive display rules
export const UI_PATTERNS = {
  // Tooltips - Subtle and contextual
  TOOLTIP: {
    style: 'glassmorphism', // frosted glass effect
    position: 'smart', // auto-position to avoid clipping
    animation: 'fade-slide', // smooth appearance
    backgroundColor: 'rgba(10, 20, 40, 0.85)',
    borderColor: 'rgba(0, 255, 200, 0.3)',
    textColor: '#e0e7ff',
    maxWidth: '280px',
    fontSize: '13px',
    padding: '10px 12px',
    borderRadius: '8px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 32px rgba(0, 255, 200, 0.1)',
    zIndex: 1000,
  },

  // Guided tours - Step-by-step with highlight
  GUIDED_TOUR: {
    overlay: true,
    overlayOpacity: 0.7,
    highlightPadding: 8,
    stepAnimation: 'bounce-in',
    arrowStyle: 'gradient',
    stepIndicator: true, // Shows "Step 1 of 5"
    maxWidth: '400px',
    allowKeyboardNav: true,
    allowSkip: true,
  },

  // Suggestions - Non-blocking, dismissible
  SUGGESTION: {
    position: 'sticky-bottom', // follows user
    maxWidth: '320px',
    animation: 'slide-up',
    showCloseButton: true,
    showTimerBar: true, // Auto-dismiss timer
    autoDismissAfter: 8000,
    backgroundColor: 'linear-gradient(135deg, rgba(0, 255, 200, 0.1), rgba(100, 200, 255, 0.05))',
    borderLeft: '3px solid #00ffc8',
  },

  // Nudges - Very subtle, barely noticeable
  NUDGE: {
    animation: 'gentle-pulse',
    opacity: 0.7,
    scale: 1.02,
    duration: 0.6,
    repeat: 2,
    spacing: '4px',
  },

  // Form assistance - Inline and contextual
  FORM_HELPER: {
    position: 'inline',
    animation: 'fade-in',
    color: '#00ffc8',
    fontSize: '12px',
    lineHeight: '1.4',
    marginTop: '6px',
    padding: '8px 10px',
    backgroundColor: 'rgba(0, 255, 200, 0.05)',
    borderLeft: '2px solid rgba(0, 255, 200, 0.3)',
    borderRadius: '4px',
  },

  // Recommendations - Card-based
  RECOMMENDATION: {
    layout: 'horizontal-card',
    maxCards: 2,
    cardWidth: '280px',
    animation: 'slide-in-left',
    backgroundColor: 'rgba(10, 20, 40, 0.6)',
    borderColor: 'rgba(0, 255, 200, 0.2)',
    hoverEffect: 'glow-border',
  },

  // Reading time - Badge
  READING_TIME: {
    position: 'top-right',
    animation: 'fade-in-slow',
    style: 'badge',
    color: '#a0aec0',
    fontSize: '12px',
    backgroundColor: 'rgba(0, 255, 200, 0.08)',
    padding: '4px 10px',
    borderRadius: '12px',
  },
}

// TIMING & FREQUENCY RULES - When NOT to show help
export const TIMING_RULES = {
  // Don't show multiple helps at same time
  MAX_CONCURRENT_HELPS: 1,

  // Gap between showing helps to same user
  MIN_GAP_BETWEEN_HELPS: 5000, // 5 seconds

  // Maximum helps per session (prevent annoyance)
  MAX_HELPS_PER_SESSION: 8,

  // Don't show help if user is in "flow" (smooth scrolling, steady interaction)
  FLOW_DETECTION: {
    scrollDuration: 1000, // smooth scroll over 1 sec = flow
    interactionRate: 0.5, // clicks/second
    maxHelpFrequency: 'every_10_seconds',
  },

  // Reduce frequency for returning users
  USER_EXPERIENCE_MULTIPLIER: {
    firstVisit: 1.0, // Show all helps
    returning: 0.6, // Show 60% as frequently
    regular: 0.3, // Show 30% as frequently
  },

  // Time-based suppression
  QUIET_HOURS: {
    enable: false,
    start: '21:00',
    end: '07:00',
  },

  // Device-specific timing
  DEVICE_TIMING: {
    mobile: { delayMultiplier: 1.5, dismissibleTimeout: 6000 },
    tablet: { delayMultiplier: 1.2, dismissibleTimeout: 8000 },
    desktop: { delayMultiplier: 1.0, dismissibleTimeout: 10000 },
  },
}

// SMART CONTENT - Context-aware help messages
export const SMART_CONTENT = {
  hero: {
    firstVisit: {
      title: 'Welcome to Jinki Intelligence',
      steps: [
        'We protect enterprises with AI-powered drone inspection',
        'Secure cybersecurity that learns from your data',
        'Explore the live demo below',
      ],
    },
    returning: {
      title: 'Welcome back!',
      message: 'Check out our new security features',
    },
  },

  droneSection: {
    confused: 'Try clicking on the drone to interact with it',
    explored: 'Drag to rotate the 3D model for different angles',
    hesitating: 'This is an interactive demo - feel free to explore!',
  },

  securitySection: {
    confused: 'This shows how we detect and neutralize threats in real-time',
    scrollHint: 'Scroll to see threat detection in action',
    interactionHint: 'Click elements to see detailed threat analysis',
  },

  formValidation: {
    email: {
      hint: 'We use this to send you setup instructions',
      error: 'Please enter a valid email address',
      success: 'Great! We\'ll reach out shortly',
    },
    company: {
      hint: 'Helps us understand your enterprise needs',
      error: 'Please provide a company name',
    },
  },
}

// USER PREFERENCE LEARNING - Adaptive assistance
export const LEARNING_CONFIG = {
  // Track what help user engages with
  ENGAGEMENT_TRACKING: {
    clickHelp: 10, // points
    dismissHelp: -5,
    completeGuidedTour: 25,
    skipGuidedTour: -10,
    readTooltip: 5,
    ignoreTooltip: -2,
  },

  // Adjust help frequency based on engagement
  ADAPTATION_RULES: {
    highEngagement: 'show_more_help', // User engages with 80%+ of help
    mediumEngagement: 'show_normal_help', // User engages with 30-80%
    lowEngagement: 'show_less_help', // User dismisses 70%+ of help
  },

  // Learn user patterns
  PATTERN_LEARNING: {
    trackScrollSpeed: true,
    trackClickPatterns: true,
    trackTimeOnSection: true,
    trackFormInteractions: true,
    updateFrequency: 'every_session',
  },

  // Personalization triggers
  PERSONALIZATION: {
    roleDetection: ['developer', 'manager', 'security-officer', 'c-suite'],
    industryDetection: true,
    useCase: true,
  },
}

// CONVERSION NUDGES - Subtle pushes to CTAs
export const CONVERSION_NUDGES = {
  'contact-form': {
    triggerAfterScroll: 0.6, // 60% page scrolled
    triggerAfterTime: 15000, // 15 seconds
    nudgeType: 'gentle-glow',
    frequency: 'once-per-session',
  },

  'demo-button': {
    triggerAfterInteraction: 3, // After 3 interactions
    nudgeType: 'subtle-pulse',
    frequency: 'once-per-section',
  },

  'pricing-section': {
    triggerAfterFeaturesExplored: true,
    nudgeType: 'color-highlight',
    frequency: 'once-per-visit',
  },
}

// FEATURE FLAGS - Control assistance globally
export const FEATURE_FLAGS = {
  ENABLE_SMART_ASSISTANCE: true,
  ENABLE_GUIDED_TOURS: true,
  ENABLE_CONTEXTUAL_TOOLTIPS: true,
  ENABLE_CONFUSION_DETECTION: true,
  ENABLE_FORM_ASSISTANCE: true,
  ENABLE_READING_TIME: true,
  ENABLE_RECOMMENDATIONS: true,
  ENABLE_CONVERSION_NUDGES: true,

  // Debug mode
  DEBUG_MODE: false,
  LOG_CONFUSION_SIGNALS: false,
  LOG_ASSISTANCE_TRIGGERS: false,
}

export default {
  CONFUSION_SIGNALS,
  ASSISTANCE_TRIGGERS,
  UI_PATTERNS,
  TIMING_RULES,
  SMART_CONTENT,
  LEARNING_CONFIG,
  CONVERSION_NUDGES,
  FEATURE_FLAGS,
}
