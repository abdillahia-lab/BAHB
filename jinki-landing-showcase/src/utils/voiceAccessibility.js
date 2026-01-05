/**
 * Voice Accessibility Utilities
 *
 * Provides:
 * - ARIA labels and attributes
 * - Screen reader support
 * - Keyboard navigation with voice
 * - Focus management
 * - Accessibility announcements
 */

/**
 * Create ARIA label for voice-enabled button
 */
export function createVoiceAriaLabel(text, voiceCommand = null) {
  let label = text

  if (voiceCommand) {
    label += `. Voice command: "${voiceCommand}"`
  }

  return label
}

/**
 * Get accessibility attributes for voice control
 */
export function getVoiceAccessibilityAttrs(config = {}) {
  const {
    role = 'button',
    label = 'Voice control',
    ariaPressed = false,
    voiceCommand = null,
    isListening = false,
  } = config

  return {
    role,
    'aria-label': createVoiceAriaLabel(label, voiceCommand),
    'aria-pressed': ariaPressed,
    'aria-live': 'polite',
    'aria-atomic': 'true',
    'aria-describedby': isListening ? 'voice-listening-status' : null,
  }
}

/**
 * Create accessibility announcement element
 */
export function createAccessibilityAnnouncement(text, priority = 'polite') {
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', priority)
  el.setAttribute('aria-atomic', 'true')
  el.className = 'sr-only'
  el.textContent = text
  document.body.appendChild(el)

  setTimeout(() => {
    el.remove()
  }, 3000)

  return el
}

/**
 * Announce text for screen readers
 */
export function announceForAccessibility(text, priority = 'polite') {
  return createAccessibilityAnnouncement(text, priority)
}

/**
 * Get voice command hint text
 */
export function getVoiceCommandHint(command) {
  const hints = {
    go_home: 'Say "Hey Jinki, go home" to navigate to home page',
    go_pricing: 'Say "Hey Jinki, show pricing" to view pricing',
    go_features: 'Say "Hey Jinki, features" to see features',
    search: 'Say "Hey Jinki, search for..." to perform voice search',
    scroll_up: 'Say "Hey Jinki, scroll up" to scroll page up',
    scroll_down: 'Say "Hey Jinki, scroll down" to scroll page down',
  }

  return hints[command] || `Say voice command: ${command}`
}

/**
 * Create keyboard shortcut for voice command
 */
export function getVoiceKeyboardShortcut(command) {
  const shortcuts = {
    toggle_voice: 'Alt + V',
    help: 'Alt + H',
    search: 'Alt + S',
    toggle_menu: 'Alt + M',
  }

  return shortcuts[command] || null
}

/**
 * Focus management utilities
 */
export const FocusManager = {
  /**
   * Save current focus
   */
  saveFocus() {
    return document.activeElement
  },

  /**
   * Restore focus
   */
  restoreFocus(element) {
    if (element && element.focus) {
      element.focus()
    }
  },

  /**
   * Move focus to element
   */
  moveFocus(element) {
    if (element && element.focus) {
      element.focus()
    }
  },

  /**
   * Get focusable elements
   */
  getFocusableElements(container = document) {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'video[controls]',
      'audio[controls]',
    ].join(',')

    return Array.from(container.querySelectorAll(focusableSelectors))
  },

  /**
   * Focus first element
   */
  focusFirst(container = document) {
    const elements = FocusManager.getFocusableElements(container)
    if (elements.length > 0) {
      elements[0].focus()
      return elements[0]
    }
    return null
  },

  /**
   * Focus next element
   */
  focusNext(container = document) {
    const elements = FocusManager.getFocusableElements(container)
    const current = document.activeElement
    const index = elements.indexOf(current)

    if (index >= 0 && index < elements.length - 1) {
      elements[index + 1].focus()
      return elements[index + 1]
    } else if (elements.length > 0) {
      elements[0].focus()
      return elements[0]
    }

    return null
  },

  /**
   * Focus previous element
   */
  focusPrevious(container = document) {
    const elements = FocusManager.getFocusableElements(container)
    const current = document.activeElement
    const index = elements.indexOf(current)

    if (index > 0) {
      elements[index - 1].focus()
      return elements[index - 1]
    } else if (elements.length > 0) {
      elements[elements.length - 1].focus()
      return elements[elements.length - 1]
    }

    return null
  },
}

/**
 * Screen reader announcer
 */
export const ScreenReaderAnnouncer = {
  /**
   * Create live region if not exists
   */
  initLiveRegion() {
    let region = document.getElementById('sr-live-region')
    if (!region) {
      region = document.createElement('div')
      region.id = 'sr-live-region'
      region.setAttribute('role', 'status')
      region.setAttribute('aria-live', 'polite')
      region.setAttribute('aria-atomic', 'true')
      region.className = 'sr-only'
      document.body.appendChild(region)
    }
    return region
  },

  /**
   * Announce message
   */
  announce(message, priority = 'polite') {
    const region = this.initLiveRegion()
    region.setAttribute('aria-live', priority)
    region.textContent = message
  },

  /**
   * Clear announcement
   */
  clear() {
    const region = this.initLiveRegion()
    region.textContent = ''
  },
}

/**
 * CSS class for screen-reader-only content
 */
export const screenReaderCSS = `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:active,
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

#sr-live-region {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
`

/**
 * Export CSS for easy injection
 */
export function injectScreenReaderCSS() {
  const style = document.createElement('style')
  style.textContent = screenReaderCSS
  document.head.appendChild(style)
}

export default {
  createVoiceAriaLabel,
  getVoiceAccessibilityAttrs,
  createAccessibilityAnnouncement,
  announceForAccessibility,
  getVoiceCommandHint,
  getVoiceKeyboardShortcut,
  FocusManager,
  ScreenReaderAnnouncer,
  injectScreenReaderCSS,
}
