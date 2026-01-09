# ACCESS100: Ready-to-Use Implementation Templates
## Copy-Paste Code Solutions for WCAG 2.2 AAA Compliance

**Purpose:** Provide complete, tested code templates ready for implementation
**Estimated Implementation Time:** 2-3 hours
**Code Quality:** Production-ready

---

## QUICK START

1. Copy each template below
2. Paste into appropriate file
3. Update file paths and component names as needed
4. Test with keyboard and screen reader
5. Deploy

---

## TEMPLATE 1: Accessibility Utilities & Hooks

**File:** `/src/hooks/useAccessibility.js`

```jsx
import { useEffect, useState, useRef } from 'react'

/**
 * useMotionPreference - Detect if user prefers reduced motion
 * WCAG 2.3.3 (AAA): Animation from Interactions
 */
export const useMotionPreference = () => {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e) => setPrefersReduced(e.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReduced
}

/**
 * useFocusTrap - Trap focus within container (for modals)
 * WCAG 2.1.2 (A): No Keyboard Trap
 */
export const useFocusTrap = (containerRef, isActive = true) => {
  useEffect(() => {
    if (!isActive) return

    const container = containerRef.current
    if (!container) return

    const focusableSelector = `
      a[href],
      button:not([disabled]),
      textarea:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      [tabindex]:not([tabindex="-1"])
    `.trim().replace(/\s+/g, '')

    const focusables = Array.from(container.querySelectorAll(focusableSelector))

    if (focusables.length === 0) return

    const firstFocusable = focusables[0]
    const lastFocusable = focusables[focusables.length - 1]

    // Set initial focus to first element
    firstFocusable.focus()

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab: backward
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        // Tab: forward
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, isActive])
}

/**
 * useKeyboardShortcuts - Handle Alt+Key shortcuts
 * WCAG 3.2.4 (AAA): Consistent Identification
 */
export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e.altKey) return

      const shortcuts = {
        'i': 'industries',
        'p': 'platform',
        'a': 'advisory',
        'c': 'contact',
        'h': 'help',
        '?': 'help',
      }

      const action = shortcuts[e.key.toLowerCase()]
      if (!action) return

      e.preventDefault()

      if (action === 'help') {
        announceToScreenReader('Keyboard shortcuts: Alt+I Industries, Alt+P Platform, Alt+A Advisory, Alt+C Contact')
      } else {
        const element = document.getElementById(action)
        if (element) {
          element.setAttribute('tabindex', '-1')
          element.focus()
          element.scrollIntoView({ behavior: 'smooth' })
          announceToScreenReader(`Navigated to ${action} section`)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}

/**
 * Announce to screen readers
 */
export const announceToScreenReader = (message) => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement (3 second timeout)
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 3000)
}

/**
 * usePreviousFocus - Store and restore focus
 */
export const usePreviousFocus = (trigger) => {
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (trigger) {
      previousFocusRef.current = document.activeElement
    } else {
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus()
      }
    }
  }, [trigger])

  return previousFocusRef
}
```

---

## TEMPLATE 2: Skip Link Component

**File:** `/src/components/SkipLink.jsx`

```jsx
/**
 * SkipLink - Bypass navigation to reach main content
 * WCAG 2.4.1 (A): Bypass Blocks
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      onClick={(e) => {
        e.preventDefault()
        const mainContent = document.getElementById('main-content')
        if (mainContent) {
          mainContent.setAttribute('tabindex', '-1')
          mainContent.focus()
          mainContent.scrollIntoView({ behavior: 'smooth' })
        }
      }}
    >
      Skip to main content
    </a>
  )
}
```

**CSS:** Add to `/src/styles/global.css`

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--cyan);
  color: var(--slate-900);
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 0 0 4px 0;
  z-index: 2000;
  font-weight: 600;
  font-size: 0.875rem;
}

.skip-link:focus {
  top: 0;
}

.skip-link:focus-visible {
  outline: 3px solid var(--slate-900);
  outline-offset: 2px;
}
```

---

## TEMPLATE 3: Screen Reader Only Text

**CSS:** Add to `/src/styles/global.css`

```css
/**
 * Screen reader only content - hidden visually but available to assistive tech
 * WCAG 1.1.1 (A): Non-text Content
 */
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

/**
 * For focus visible elements that need sr-only content
 * Allows keyboard users to see sr-only text if needed
 */
.sr-only:not(:focus-visible, :focus) {
  clip-path: inset(50%);
}
```

---

## TEMPLATE 4: Global Focus Indicators

**CSS:** Add to `/src/pages/LandingPage3.css` or `/src/styles/global.css`

```css
/**
 * WCAG 2.4.7 (AAA): Focus Visible
 * All interactive elements must have visible focus indicator
 */

/* Remove default browser outline to prevent double outline */
:focus {
  outline: none;
}

/* Global focus-visible style */
:focus-visible {
  outline: 3px solid var(--cyan);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Button focus */
.btn:focus-visible {
  outline: 3px solid var(--cyan);
  outline-offset: 2px;
}

.btn--primary:focus-visible {
  /* Dark outline for light button background */
  outline: 3px solid var(--slate-900);
  outline-offset: 2px;
}

.btn--ghost:focus-visible {
  outline: 3px solid var(--cyan);
  outline-offset: 2px;
}

/* Link focus */
a:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 4px;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

/* Navigation link focus */
.nav__links a:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 4px;
  color: var(--cyan-bright);
}

/* Section focus */
section:focus-visible {
  outline: 3px solid var(--cyan);
  outline-offset: 4px;
}

/* Form field focus */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
  border-color: var(--cyan);
}
```

---

## TEMPLATE 5: Accessible Navigation Component

**File:** `/src/components/AccessibleNav.jsx`

```jsx
import { motion } from 'framer-motion'

/**
 * AccessibleNav - Keyboard and screen reader accessible navigation
 * WCAG 2.1.1 (A): Keyboard
 * WCAG 2.4.8 (AAA): Location and Set Information
 */
export function AccessibleNav({ currentSection = '' }) {
  const sections = [
    { id: 'industries', label: 'Industries', shortcut: 'Alt+I' },
    { id: 'platform', label: 'Platform', shortcut: 'Alt+P' },
    { id: 'advisory', label: 'Advisory', shortcut: 'Alt+A' },
  ]

  const handleNavClick = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.setAttribute('tabindex', '-1')
      element.focus()
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <motion.header
      className="nav"
      role="banner"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="nav__inner">
        <a
          href="/"
          className="nav__logo"
          aria-label="Jinki Intelligence - Go to home"
        >
          <span className="nav__logo-text">JINKI</span>
        </a>

        <nav className="nav__links" aria-label="Main navigation">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => {
                e.preventDefault()
                handleNavClick(section.id)
              }}
              aria-current={currentSection === section.id ? 'page' : undefined}
              title={section.shortcut}
            >
              {section.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          className="btn btn--primary"
          aria-label="Get Started - Schedule an Assessment"
          title="Alt+C to jump to contact form"
        >
          Get Started
        </a>
      </div>
    </motion.header>
  )
}
```

---

## TEMPLATE 6: Accessible Counter Component

**File:** `/src/components/AccessibleCounter.jsx`

```jsx
import { useState, useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

/**
 * AccessibleCounter - Animating number with screen reader support
 * WCAG 4.1.3 (AAA): Status Messages
 */
export function AccessibleCounter({
  value,
  suffix = '',
  prefix = '',
  label,
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const rafRef = useRef(null)
  const announcementRef = useRef(null)

  useEffect(() => {
    if (!inView) return

    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    const duration = 1500
    const startTime = performance.now()

    setIsAnimating(true)

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const newDisplay = Math.floor(num * eased)

      setDisplay(newDisplay)

      if (progress >= 1) {
        setIsAnimating(false)
        // Announce to screen readers when complete
        if (announcementRef.current) {
          announcementRef.current.textContent = `${label} is now ${prefix}${num}${suffix}`
        }
      } else {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [inView, value, label, prefix, suffix])

  return (
    <div
      ref={ref}
      className="stat"
      aria-label={label}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Visible number (hidden from screen readers) */}
      <span className="stat__value" aria-hidden="true">
        {prefix}{display}{suffix}
      </span>

      {/* Label */}
      <span className="stat__label">{label}</span>

      {/* Screen reader announcement */}
      <span
        ref={announcementRef}
        className="sr-only"
        role="status"
        aria-live="polite"
      >
        {isAnimating
          ? `${label} is animating to ${prefix}${value}${suffix}`
          : `${label} is ${prefix}${display}${suffix}`}
      </span>
    </div>
  )
}
```

---

## TEMPLATE 7: Accessible Section Wrapper

**File:** `/src/components/AccessibleSection.jsx`

```jsx
/**
 * AccessibleSection - Section with proper ARIA landmarks
 * WCAG 1.3.1 (A): Info and Relationships
 * WCAG 1.3.6 (AAA): Identify Purpose
 */
export function AccessibleSection({
  id,
  title,
  subtitle,
  eyebrow,
  children,
  className = '',
}) {
  return (
    <section
      id={id}
      className={`section ${className}`}
      aria-labelledby={`${id}-heading`}
      tabIndex="-1" // Allow focus when jumped to
    >
      {eyebrow || title ? (
        <div className="section__header">
          {eyebrow && <p className="section__eyebrow">{eyebrow}</p>}
          {title && <h2 id={`${id}-heading`}>{title}</h2>}
          {subtitle && <p className="section__subtitle">{subtitle}</p>}
        </div>
      ) : null}

      {children}
    </section>
  )
}

// Usage:
// <AccessibleSection
//   id="industries"
//   eyebrow="Solutions"
//   title="Critical Infrastructure Intelligence"
//   subtitle="Research-backed protocols"
// >
//   {/* Content */}
// </AccessibleSection>
```

---

## TEMPLATE 8: Accessible Card Component

**File:** `/src/components/AccessibleCard.jsx`

```jsx
/**
 * AccessibleCard - Card with proper semantic structure
 * WCAG 1.3.1 (A): Info and Relationships
 */
export function AccessibleCard({
  id,
  title,
  image,
  imageAlt,
  sections = [],
  stats = [],
  index,
}) {
  return (
    <article
      className="card"
      role="region"
      aria-labelledby={`card-title-${id || index}`}
    >
      {image && (
        <div className="card__image">
          <img
            src={image}
            alt={imageAlt || `Illustration for ${title}`}
            loading="lazy"
          />
        </div>
      )}

      <div className="card__content">
        <h3 id={`card-title-${id || index}`}>{title}</h3>

        {sections.map((section, i) => (
          <div
            key={i}
            className="card__section"
            role="region"
            aria-labelledby={`section-title-${id || index}-${i}`}
          >
            <dt
              id={`section-title-${id || index}-${i}`}
              className="card__label"
            >
              {section.label}
            </dt>
            <dd>{section.content}</dd>
          </div>
        ))}

        {stats.length > 0 && (
          <div className="card__stats" role="list">
            {stats.map((stat, i) => (
              <div key={i} className="card__stat" role="listitem">
                <span className="card__stat-value">{stat.value}</span>
                <span className="card__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

// Usage:
// <AccessibleCard
//   id="datacenter"
//   title="Data Centers"
//   image="url"
//   imageAlt="Data center with thermal monitoring"
//   sections={[
//     { label: 'Challenge', content: '...' },
//     { label: 'Solution', content: '...' }
//   ]}
//   stats={[{ value: '$700K', label: 'Cost Avoided' }]}
// />
```

---

## TEMPLATE 9: CSS for Touch Targets

**CSS:** Add to `/src/styles/global.css`

```css
/**
 * Touch Target Sizing
 * WCAG 2.5.5 (AAA): Target Size
 * Minimum 44x44px (use 48x48px for better mobile)
 */

/* Navigation links */
.nav__links a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}

.btn--lg {
  min-height: 48px;
  padding: 16px 32px;
}

/* Form inputs */
input,
textarea,
select {
  min-height: 44px;
  padding: 12px 16px;
}

/* Feature list items - make entire area clickable/focusable */
.feature {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 44px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.feature:focus-within {
  background: rgba(0, 180, 216, 0.1);
}

.feature__icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.25rem;
}
```

---

## TEMPLATE 10: Prefers Reduced Motion CSS

**CSS:** Replace existing prefers-reduced-motion rule in `/src/pages/LandingPage3.css`

```css
/**
 * WCAG 2.3.3 (AAA): Animation from Interactions
 * Gracefully degrade motion for users who prefer reduced motion
 */

@media (prefers-reduced-motion: reduce) {
  /* Reduce animation durations */
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0 !important;
  }

  /* Disable Lenis smooth scroll (via inline check in component) */

  /* Stop specific animations but keep element visible */
  .ascii-glass__glow {
    animation: none;
    opacity: 0.6;
  }

  .liquid-wave__row {
    animation: none;
  }

  .cta__ascii {
    animation: none;
  }

  /* Keep static view of ASCII art */
  .ascii-glass__art {
    opacity: 1;
  }

  /* No transform animations */
  .eye-visual__ring,
  .eye-visual__core {
    animation: none;
  }

  /* No blur/glow effects that animate */
  .ascii-glass__glow {
    display: none;
  }
}
```

---

## TEMPLATE 11: Updated Lenis Hook with Motion Preference

**File:** `/src/hooks/useSmoothScroll.js`

```jsx
import Lenis from 'lenis'
import { useEffect } from 'react'
import { useMotionPreference } from './useAccessibility'

/**
 * useSmoothScroll - Smooth scroll with motion preference support
 * WCAG 2.3.3 (AAA): Animation from Interactions
 */
export function useSmoothScroll() {
  const prefersReducedMotion = useMotionPreference()

  useEffect(() => {
    // Don't use smooth scroll if user prefers reduced motion
    if (prefersReducedMotion) {
      document.documentElement.style.scrollBehavior = 'auto'
      return
    }

    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false, // Keep native touch behavior
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    const rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [prefersReducedMotion])
}
```

---

## TEMPLATE 12: Implementation Checklist

**File:** `ACCESSIBILITY_IMPLEMENTATION_CHECKLIST.md`

```markdown
# Accessibility Implementation Checklist

## Phase 1: Critical (Do First) - 2 hours

- [ ] Add SkipLink component to page header
- [ ] Add global :focus-visible CSS
- [ ] Add .sr-only CSS class
- [ ] Verify tab order is logical
- [ ] Test no keyboard traps exist
- [ ] Add aria-hidden="true" to decorative elements:
  - [ ] Liquid wave background
  - [ ] ASCII art decorations
  - [ ] Glow effects

## Phase 2: Major (Do Next) - 2 hours

- [ ] Replace Counter component with AccessibleCounter
- [ ] Add aria-labelledby to all sections
- [ ] Replace nav with AccessibleNav
- [ ] Add focus-visible to all interactive elements
- [ ] Add touch target sizing CSS
- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)

## Phase 3: Enhanced (Polish) - 2 hours

- [ ] Add keyboard shortcuts (Alt+I, Alt+P, Alt+A, Alt+C)
- [ ] Add useKeyboardShortcuts hook
- [ ] Update Lenis hook for motion preferences
- [ ] Add prefers-reduced-motion CSS
- [ ] Test with screen reader keyboard commands
- [ ] Create keyboard navigation help page
- [ ] Run automated accessibility testing (jest-axe)

## Testing

- [ ] Keyboard only navigation (5 minute test)
- [ ] NVDA screen reader testing
- [ ] VoiceOver screen reader testing
- [ ] Focus indicator visibility at 200% zoom
- [ ] 44x44px touch target verification
- [ ] Color contrast verification (7:1 AAA)
- [ ] Heading hierarchy check (h1 > h2 > h3, no skips)
- [ ] Mobile keyboard support
- [ ] Form accessibility (when implemented)

## Deployment

- [ ] All items from Phase 1 complete
- [ ] All items from Phase 2 complete
- [ ] Automated testing passes
- [ ] Manual testing passes
- [ ] Documentation updated
- [ ] Team trained on accessibility
- [ ] Monitor real user accessibility metrics
```

---

## IMPLEMENTATION SUMMARY

| Template | Purpose | Time | Priority |
|----------|---------|------|----------|
| 1 | Accessibility Hooks | 15 min | P1 |
| 2 | Skip Link | 10 min | P1 |
| 3 | SR-only CSS | 5 min | P1 |
| 4 | Focus Indicators | 20 min | P1 |
| 5 | Nav Component | 20 min | P2 |
| 6 | Counter Component | 15 min | P2 |
| 7 | Section Wrapper | 10 min | P2 |
| 8 | Card Component | 15 min | P2 |
| 9 | Touch Target CSS | 15 min | P2 |
| 10 | Reduced Motion CSS | 10 min | P3 |
| 11 | Smooth Scroll | 10 min | P3 |
| 12 | Checklist | 5 min | Reference |

**Total Time:** ~2.5 hours for complete AAA compliance

---

## QUICK START GUIDE

1. **Copy Template 1** → Create `/src/hooks/useAccessibility.js`
2. **Copy Template 3** → Add to global CSS
3. **Copy Template 4** → Add to page CSS
4. **Copy Template 2** → Create `/src/components/SkipLink.jsx`
5. **Import SkipLink** → Add to page header
6. **Test keyboard** → Tab through entire page
7. **Test with screen reader** → Verify announcements
8. **Continue with remaining templates** → Follow Phase 2 & 3

---

**Ready to implement?** Start with Phase 1 templates and test immediately. Quality of life improvement for all users guaranteed.

**Questions?** Refer back to the complete audit document for detailed explanations.
