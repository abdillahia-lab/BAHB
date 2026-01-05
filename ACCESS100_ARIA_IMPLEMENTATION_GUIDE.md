# ACCESS100: ARIA Implementation Guide
## Complete WCAG 2.2 AAA ARIA Reference for Jinki Intelligence

**Purpose:** Comprehensive guide to implement ARIA attributes for screen reader users
**Standard:** WCAG 2.2 Level AAA
**Duration:** ~3-4 hours to implement all recommendations

---

## TABLE OF CONTENTS

1. [Core ARIA Attributes](#core-aria-attributes)
2. [Semantic HTML vs ARIA](#semantic-html-vs-aria)
3. [Component-Specific Implementations](#component-specific-implementations)
4. [Live Regions & Announcements](#live-regions--announcements)
5. [Focus Management ARIA](#focus-management-aria)
6. [Testing ARIA Implementation](#testing-aria-implementation)

---

## CORE ARIA ATTRIBUTES

### 1. aria-label
**Use When:** Element has no visible text, or visible text is insufficient

```jsx
// Example 1: Icon button
<button aria-label="Close navigation menu">
  <span>×</span>
</button>

// Example 2: Icon without text
<span className="icon" aria-label="Warning">⚠</span>

// Example 3: Link with only icon
<a href="/search" aria-label="Search the site">
  <SearchIcon />
</a>

// WRONG - aria-label conflicts with visible text
<button aria-label="Click me">Submit Form</button> // Don't do this

// CORRECT - use aria-label only when needed
<button>Submit Form</button> // Visible text is sufficient
```

---

### 2. aria-labelledby
**Use When:** Element is labeled by another element via ID

```jsx
// Example 1: Section labeled by heading
<section aria-labelledby="industries-heading">
  <h2 id="industries-heading">Critical Infrastructure Intelligence</h2>
  <p>Content here...</p>
</section>

// Example 2: Dialog labeled by title
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Contact Form</h2>
  <form>...</form>
</div>

// Example 3: Card with title
<div className="card" aria-labelledby="card-title-1">
  <h3 id="card-title-1">Data Centers</h3>
  <p>Challenge...</p>
</div>

// MULTIPLE LABELLEDBY (if needed)
<div aria-labelledby="title subtitle">
  <h2 id="title">Main Title</h2>
  <p id="subtitle">Subtitle text</p>
</div>
```

---

### 3. aria-describedby
**Use When:** Element needs additional description beyond label

```jsx
// Example 1: Form field with help text
<div>
  <label htmlFor="email">Email Address</label>
  <input
    id="email"
    type="email"
    aria-describedby="email-help"
  />
  <span id="email-help">We'll never share your email address</span>
</div>

// Example 2: Button with description
<button aria-describedby="submit-help">
  Submit
</button>
<p id="submit-help">Your information will be processed securely</p>

// Example 3: Complex content
<div aria-describedby="chart-description">
  <img src="chart.png" alt="Sales Chart" />
  <p id="chart-description">
    Shows 25% growth in Q4 with peak sales in December
  </p>
</div>
```

---

### 4. aria-live
**Use When:** Content updates dynamically

```jsx
// POLITE: Announce when user stops interacting
<div aria-live="polite">
  Items added to cart: 3
</div>

// ASSERTIVE: Interrupt user for important updates
<div aria-live="assertive">
  Error: Your session has expired
</div>

// ATOMIC: Announce entire region even if only part changes
<div aria-live="polite" aria-atomic="true">
  Price: $100 (was $150)
</div>

// Example: Counter animation
<div
  className="stat"
  aria-live="polite"
  aria-atomic="true"
  aria-label="Average outage cost prevented"
>
  <span className="stat__value">$700K</span>
  <span className="stat__label">Avg Outage Prevented</span>
</div>
```

**aria-live Values:**
- `off` (default): Changes not announced
- `polite`: Announce when user pauses
- `assertive`: Announce immediately, interrupt if needed
- `rude`: Announce immediately, always interrupt

**Related Attributes:**
- `aria-atomic`: Announce full region or just changes
- `aria-relevant`: What changes to announce (additions, removals, text, all)

---

### 5. aria-current
**Use When:** Indicating current navigation item

```jsx
// Navigation example
<nav aria-label="Main navigation">
  <a href="/">Home</a>
  <a href="/about" aria-current="page">About</a>
  <a href="/contact">Contact</a>
</nav>

// In complex navigation
<div role="navigation" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span>/</span>
  <a href="/products">Products</a>
  <span>/</span>
  <span aria-current="page">Product Details</span>
</div>

// aria-current values:
// - "page": Current page
// - "step": Current step in process
// - "location": Current location
// - "date": Current date
// - "time": Current time
// - "true": Generic current (avoid, use specific values)
```

---

### 6. aria-expanded
**Use When:** Control expands/collapses content

```jsx
// Accordion
const [expanded, setExpanded] = useState(false)

<button
  aria-expanded={expanded}
  aria-controls="content-panel"
  onClick={() => setExpanded(!expanded)}
>
  Show Details
</button>

<div id="content-panel" hidden={!expanded}>
  Details content here
</div>

// Menu button
<button
  aria-expanded={menuOpen}
  aria-controls="dropdown-menu"
  aria-label="Toggle menu"
>
  Menu
</button>

<ul id="dropdown-menu" hidden={!menuOpen}>
  <li><a href="/items">Items</a></li>
</ul>
```

---

### 7. aria-selected
**Use When:** Item is selected in a list/tab group

```jsx
// Tabs
<div role="tablist">
  <button
    role="tab"
    aria-selected={activeTab === 1}
    aria-controls="panel-1"
  >
    Tab 1
  </button>
  <button
    role="tab"
    aria-selected={activeTab === 2}
    aria-controls="panel-2"
  >
    Tab 2
  </button>
</div>

<div id="panel-1" role="tabpanel" aria-labelledby="tab-1">
  Content 1
</div>

// List with selections
<div role="listbox">
  <div role="option" aria-selected={selected.includes(1)}>
    Option 1
  </div>
  <div role="option" aria-selected={selected.includes(2)}>
    Option 2
  </div>
</div>
```

---

### 8. aria-hidden
**Use When:** Element is purely decorative or already labeled

```jsx
// Decorative icon with text label
<button>
  <span aria-hidden="true">→</span>
  <span>Next</span>
</button>

// Decorative background
<div className="background" aria-hidden="true">
  Decorative pattern
</div>

// ASCII art that's described elsewhere
<pre aria-hidden="true">
  {asciiArt}
</pre>
<div className="sr-only">
  ASCII art representation of cyber eye logo
</div>

// Hidden from screen readers but visible (opposite of display:none)
<div aria-hidden="true" style={{ opacity: 0.5 }}>
  This is visible but not announced
</div>
```

**IMPORTANT:** Don't hide interactive elements with aria-hidden="true"

---

### 9. aria-disabled
**Use When:** Element appears disabled but isn't a native form element

```jsx
// When can't use HTML disabled attribute
<div
  role="button"
  tabindex="0"
  aria-disabled="true"
  className="btn btn--disabled"
>
  Disabled Button
</div>

// Better: Use actual disabled attribute if possible
<button disabled>
  Disabled Button
</button>

// For custom form controls
<input
  type="text"
  aria-disabled="true"
  disabled
  value="Can't edit"
/>
```

---

### 10. aria-invalid & aria-required
**Use When:** Form validation and requirements

```jsx
const [email, setEmail] = useState('')
const [error, setError] = useState('')

<div>
  <label htmlFor="email">Email *</label>
  <input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    onBlur={() => {
      if (!email.includes('@')) {
        setError('Invalid email')
      }
    }}
    aria-required="true"
    aria-invalid={error ? 'true' : 'false'}
    aria-describedby={error ? 'email-error' : ''}
  />
  {error && (
    <span id="email-error" role="alert" className="error">
      {error}
    </span>
  )}
</div>
```

---

## SEMANTIC HTML VS ARIA

### Rule: SEMANTIC HTML FIRST

> If you can use native HTML, always prefer it over ARIA

```jsx
// ❌ WRONG - Using ARIA instead of semantic HTML
<div role="heading" aria-level="1">Page Title</div>

// ✅ CORRECT - Use semantic HTML
<h1>Page Title</h1>

// ❌ WRONG - ARIA for button
<div role="button" onClick={handleClick}>
  Click me
</div>

// ✅ CORRECT - Semantic button
<button onClick={handleClick}>
  Click me
</button>

// ❌ WRONG - ARIA for navigation
<div role="navigation" aria-label="Main">
  <div role="link">Home</div>
</div>

// ✅ CORRECT - Semantic nav
<nav aria-label="Main">
  <a href="/">Home</a>
</nav>

// ❌ WRONG - ARIA for list
<div role="list">
  <div role="listitem">Item 1</div>
  <div role="listitem">Item 2</div>
</div>

// ✅ CORRECT - Semantic list
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

---

## COMPONENT-SPECIFIC IMPLEMENTATIONS

### Implementation 1: Accessible Navigation

```jsx
// File: /src/components/AccessibleNav.jsx
import { useState } from 'react'

export function AccessibleNav() {
  const [currentSection, setCurrentSection] = useState('home')

  const sections = [
    { id: 'industries', label: 'Industries' },
    { id: 'platform', label: 'Platform' },
    { id: 'advisory', label: 'Advisory' },
  ]

  return (
    <header role="banner" className="nav">
      <div className="nav__inner">
        <a href="/" className="nav__logo" aria-label="Jinki Intelligence - Home">
          <span className="nav__logo-text">JINKI</span>
        </a>

        <nav aria-label="Main navigation" className="nav__links">
          {sections.map(section => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={currentSection === section.id ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById(section.id)
                if (element) {
                  setCurrentSection(section.id)
                  element.focus()
                  element.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              {section.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          className="btn btn--primary"
          aria-label="Get Started - Schedule an Assessment"
        >
          Get Started
        </a>
      </div>
    </header>
  )
}
```

---

### Implementation 2: Accessible Sections

```jsx
// Wrap all major sections with proper ARIA
<section id="industries" className="section" aria-labelledby="industries-heading">
  <div className="section__header">
    <p className="section__eyebrow">Solutions</p>
    <h2 id="industries-heading">Critical Infrastructure Intelligence</h2>
    <p className="section__subtitle">
      Research-backed aerial protocols trusted by industry leaders
    </p>
  </div>

  <div className="cards" role="list">
    {industries.map((industry, i) => (
      <article
        key={i}
        className="card"
        role="listitem"
        aria-labelledby={`card-title-${i}`}
      >
        <div className="card__image">
          <img
            src={industry.image}
            alt={`${industry.title} infrastructure inspection`}
            loading="lazy"
          />
        </div>

        <div className="card__content">
          <h3 id={`card-title-${i}`}>{industry.title}</h3>

          <div className="card__section">
            <dt className="card__label">Challenge</dt>
            <dd>{industry.problem}</dd>
          </div>

          <div className="card__section">
            <dt className="card__label">Solution</dt>
            <dd>{industry.solution}</dd>
          </div>

          <div className="card__stats" role="list">
            {industry.stats.map((stat, j) => (
              <div key={j} className="card__stat" role="listitem">
                <span className="card__stat-value">{stat.value}</span>
                <span className="card__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </article>
    ))}
  </div>
</section>
```

---

### Implementation 3: Accessible Counter

```jsx
// File: /src/components/AccessibleCounter.jsx
import { useState, useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

export function AccessibleCounter({ value, suffix = '', prefix = '', label }) {
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
      const eased = 1 - Math.pow(1 - progress, 3)
      const newDisplay = Math.floor(num * eased)

      setDisplay(newDisplay)

      if (progress >= 1) {
        setIsAnimating(false)
        // Announce completion to screen readers
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
      {/* Visible value (with aria-hidden for screen reader) */}
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

### Implementation 4: Accessible Card List

```jsx
// File: /src/components/AccessibleCardGrid.jsx
export function AccessibleCardGrid({ items, title }) {
  return (
    <section className="card-grid" aria-labelledby="grid-title">
      <h2 id="grid-title" className="sr-only">
        {title}
      </h2>

      <div className="cards" role="list">
        {items.map((item, index) => (
          <article
            key={index}
            className="card"
            role="listitem"
            aria-labelledby={`card-title-${index}`}
            aria-describedby={`card-description-${index}`}
          >
            <img
              src={item.image}
              alt={item.imageAlt}
              loading="lazy"
            />

            <h3 id={`card-title-${index}`}>{item.title}</h3>

            <div id={`card-description-${index}`}>
              <p>{item.description}</p>
            </div>

            <ul className="card__features">
              {item.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
```

---

## LIVE REGIONS & ANNOUNCEMENTS

### Pattern 1: Polite Status Updates

```jsx
const [message, setMessage] = useState('')

<div
  aria-live="polite"
  aria-atomic="true"
  role="status"
  className="sr-only"
>
  {message}
</div>

// Usage:
setMessage('3 items added to cart')
```

---

### Pattern 2: Alert/Error Messages

```jsx
const [error, setError] = useState('')

<div
  aria-live="assertive"
  aria-atomic="true"
  role="alert"
  className="error-message"
>
  {error}
</div>

// Usage:
setError('Session expired. Please log in again.')
```

---

### Pattern 3: Progress Announcements

```jsx
const [progress, setProgress] = useState(0)

<div aria-live="polite" role="status">
  <span className="sr-only">Loading progress</span>
  {progress}% complete
</div>

// Usage in upload:
uploadFile(file, (loaded, total) => {
  setProgress(Math.round((loaded / total) * 100))
})
```

---

## FOCUS MANAGEMENT ARIA

### Pattern 1: Focus on Dynamic Content

```jsx
const contentRef = useRef(null)

const handleNavClick = (sectionId) => {
  const section = document.getElementById(sectionId)
  if (section) {
    // Set tabindex for focus
    section.setAttribute('tabindex', '-1')
    section.focus()
    section.scrollIntoView({ behavior: 'smooth' })
  }
}

<a onClick={() => handleNavClick('industries')}>
  Industries
</a>

<section id="industries" ref={contentRef} tabindex="-1">
  Content
</section>
```

---

### Pattern 2: Focus Trap in Modal

```jsx
// File: /src/hooks/useFocusTrap.js
import { useEffect } from 'react'

export const useFocusTrap = (containerRef, isActive = true) => {
  useEffect(() => {
    if (!isActive) return

    const container = containerRef.current
    if (!container) return

    // Get all focusable elements
    const focusableSelector = `
      a[href],
      button:not([disabled]),
      textarea:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      [tabindex]:not([tabindex="-1"])
    `
    const focusables = Array.from(container.querySelectorAll(focusableSelector))

    if (focusables.length === 0) return

    const firstFocusable = focusables[0]
    const lastFocusable = focusables[focusables.length - 1]

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab backwards
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        // Tab forwards
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

// Usage in modal
function AccessibleModal({ isOpen, onClose, children }) {
  const modalRef = useRef(null)
  useFocusTrap(modalRef, isOpen)

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {children}
    </div>
  )
}
```

---

## TESTING ARIA IMPLEMENTATION

### 1. Screen Reader Testing

**With NVDA (Free, Windows):**
```bash
1. Download NVDA from https://www.nvaccess.org/
2. Install and launch
3. Open page in Firefox
4. Listen for announcements
5. Press H to navigate headings
6. Press L to list links
```

**With JAWS (Commercial, Windows):**
```bash
1. Launch JAWS
2. Open page in Chrome or Firefox
3. Use keyboard shortcuts for navigation
4. Test aria-live announcements
5. Verify form field labels
```

**With VoiceOver (Built-in, Mac/iOS):**
```bash
Cmd+F5 to enable VoiceOver
VO = Control+Option
VO+U: Web rotor
VO+Right Arrow: Next item
VO+Left Arrow: Previous item
```

---

### 2. Browser DevTools ARIA Testing

```javascript
// Chrome DevTools Console

// Test aria-label
const btn = document.querySelector('button')
console.log(btn.getAttribute('aria-label'))

// Test aria-labelledby
const section = document.querySelector('section')
console.log(section.getAttribute('aria-labelledby'))

// Test live regions
const liveRegion = document.querySelector('[aria-live]')
liveRegion.textContent = 'This will be announced'

// Test accessible name
function getAccessibleName(el) {
  return el.getAttribute('aria-label') ||
         el.getAttribute('aria-labelledby') ||
         el.textContent.trim()
}
```

---

### 3. Automated Testing

```jsx
// File: /src/__tests__/accessibility.test.jsx
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<LandingPage3 />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper skip link', () => {
    const { getByText } = render(<LandingPage3 />)
    const skipLink = getByText('Skip to main content')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('should have aria-current on active nav item', () => {
    const { container } = render(<LandingPage3 />)
    const activeLink = container.querySelector('[aria-current="page"]')
    expect(activeLink).toBeInTheDocument()
  })
})
```

---

### 4. Manual Testing Checklist

- [ ] All headings use h1-h6 (no skipped levels)
- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] All buttons have visible text or aria-label
- [ ] Links have descriptive text
- [ ] Focus order is logical
- [ ] Focus indicators are visible
- [ ] Color isn't the only way to convey information
- [ ] Interactive elements are 44x44px minimum
- [ ] Motion can be disabled via prefers-reduced-motion
- [ ] All content is keyboard accessible
- [ ] Dynamic content uses aria-live
- [ ] Sections use aria-labelledby
- [ ] Navigation shows aria-current

---

## ARIA QUICK REFERENCE

| Situation | ARIA Attribute | Example |
|-----------|---|---|
| Icon needs label | `aria-label` | `<button aria-label="Close">×</button>` |
| Section needs label | `aria-labelledby` | `<section aria-labelledby="heading">` |
| Extra description needed | `aria-describedby` | `<input aria-describedby="help">` |
| Content updates | `aria-live` | `<div aria-live="polite">New message</div>` |
| Current page/item | `aria-current` | `<a aria-current="page">Current</a>` |
| Element expands/collapses | `aria-expanded` | `<button aria-expanded="false">Menu</button>` |
| Item is selected | `aria-selected` | `<div role="option" aria-selected="true">` |
| Decorative/hidden from SR | `aria-hidden` | `<div aria-hidden="true">Pattern</div>` |
| Form field disabled | `aria-disabled` | `<button aria-disabled="true">Disabled</button>` |
| Form validation | `aria-invalid` | `<input aria-invalid="true">` |
| Required form field | `aria-required` | `<input aria-required="true">` |

---

## WCAG CRITERIA COVERED

- **1.1.1** Non-text Content (A)
- **1.3.1** Info and Relationships (A)
- **1.3.6** Identify Purpose (AAA)
- **4.1.2** Name, Role, Value (A)
- **4.1.3** Status Messages (AAA)
- **2.4.8** Location and Set Information (AAA)

---

**Next Steps:** Implement the components in the order specified, test with a screen reader, and verify all ARIA attributes are properly set.
