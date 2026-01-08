# Premium UX Integration Guide
Complete implementation guide for Lenis Smooth Scroll + Custom Cursor + Magnetic Buttons

## Table of Contents
1. [Quick Start](#quick-start)
2. [Lenis Smooth Scroll](#lenis-smooth-scroll)
3. [Custom Cursor](#custom-cursor)
4. [Magnetic Buttons](#magnetic-buttons)
5. [Full Integration Example](#full-integration-example)
6. [Advanced Usage](#advanced-usage)

---

## Quick Start

### 1. Install Dependencies
```bash
npm install @studio-freight/lenis
# Already installed in your package.json
```

### 2. File Structure
```
src/
├── hooks/
│   ├── useLenis.js              ✓ Created
│   ├── useCustomCursor.js        ✓ Created
│   └── useMagneticButton.js      ✓ Created
├── components/
│   ├── CustomCursor.jsx          ✓ Created
│   ├── CustomCursor.css          ✓ Created
│   └── MagneticButton.jsx        ✓ Created
└── pages/
    └── LandingPage3.jsx          → Update this
```

---

## Lenis Smooth Scroll

### Basic Implementation

```jsx
import { useLenis } from '../hooks/useLenis'

function MyPage() {
  // Initialize Lenis with default settings
  const lenis = useLenis()

  // Or with custom options
  const lenis = useLenis({
    duration: 1.2,        // Scroll duration (seconds)
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,   // Disable on mobile for better native feel
  })

  return <div>Your content</div>
}
```

### Listen to Scroll Events

```jsx
import { useLenisScroll } from '../hooks/useLenis'

function MyPage() {
  const lenis = useLenisScroll(({ scroll, limit, velocity, direction, progress }) => {
    // Update UI based on scroll
    console.log('Scroll position:', scroll)
    console.log('Scroll progress:', progress)
  })

  return <div>Your content</div>
}
```

### Programmatic Scrolling

```jsx
import { useLenisControls } from '../hooks/useLenis'

function MyPage() {
  const { scrollTo, stop, start } = useLenisControls()

  const handleClick = () => {
    // Scroll to element
    scrollTo('#section-id', { offset: -100, duration: 2 })

    // Or scroll to position
    scrollTo(1000, { duration: 1.5 })
  }

  return <button onClick={handleClick}>Scroll</button>
}
```

---

## Custom Cursor

### Basic Setup

**Step 1: Add CustomCursor to your root component**

```jsx
// In App.jsx or your main layout
import { CustomCursor } from './components/CustomCursor'

function App() {
  return (
    <>
      <CustomCursor />
      {/* Rest of your app */}
    </>
  )
}
```

**Step 2: That's it!** The cursor automatically:
- Follows mouse with smooth easing
- Grows on buttons/links
- Changes to I-beam on text inputs
- Shrinks on click
- Hides on mobile/touch devices

### Cursor States

The cursor has 4 built-in states:
- **default** - Normal state
- **hover** - On buttons/links (grows larger)
- **click** - On mouse down (shrinks)
- **text** - On input fields (I-beam style)

### Custom Cursor State

```jsx
import { useCustomCursor } from '../hooks/useCustomCursor'

function MyComponent() {
  const { setCursorState } = useCustomCursor()

  return (
    <div
      onMouseEnter={() => setCursorState('hover')}
      onMouseLeave={() => setCursorState('default')}
    >
      Custom hover area
    </div>
  )
}
```

### Cursor Inversion (for light backgrounds)

```jsx
import { useCursorInvert } from '../hooks/useCustomCursor'
import { useRef } from 'react'

function LightSection() {
  const sectionRef = useRef(null)
  useCursorInvert(sectionRef, true)

  return (
    <section ref={sectionRef} style={{ background: 'white' }}>
      Cursor will invert to dark when hovering here
    </section>
  )
}
```

---

## Magnetic Buttons

### Using MagneticButton Component

```jsx
import { MagneticButton, MagneticLink } from '../components/MagneticButton'

// Magnetic button
<MagneticButton
  className="btn btn--primary"
  strength={0.5}      // How strong the pull (0-1)
  radius={150}        // Magnetic radius in pixels
  ease={0.15}         // Smoothness (0.1-0.2 recommended)
>
  Click Me
</MagneticButton>

// Magnetic link
<MagneticLink
  href="/demo"
  className="nav__cta"
  strength={0.4}
  radius={120}
>
  Request Demo
</MagneticLink>
```

### Using the Hook Directly

```jsx
import { useMagneticButton } from '../hooks/useMagneticButton'

function MyButton() {
  const buttonRef = useMagneticButton({
    strength: 0.3,
    radius: 100,
    ease: 0.15
  })

  return (
    <button ref={buttonRef} className="my-button">
      Magnetic Button
    </button>
  )
}
```

### Magnetic with Rotation

```jsx
import { useMagneticRotate } from '../hooks/useMagneticButton'

function CardComponent() {
  const cardRef = useMagneticRotate({
    maxRotation: 15,  // Max degrees of rotation
    ease: 0.1
  })

  return (
    <div ref={cardRef} className="card">
      I rotate toward your cursor!
    </div>
  )
}
```

---

## Full Integration Example

### Update LandingPage3.jsx

```jsx
import { useEffect, useState, useRef } from 'react'
import './LandingPage3.css'

// ═══ Add these imports ═══
import { useLenis } from '../hooks/useLenis'
import { CustomCursor } from '../components/CustomCursor'
import { MagneticLink } from '../components/MagneticButton'

export default function LandingPage3() {
  // Your existing state...
  const [navSolid, setNavSolid] = useState(false)
  const scrollProgressRef = useRef(null)

  // ═══ Initialize Lenis ═══
  const lenis = useLenis({
    duration: 1.2,
    smooth: true,
    smoothTouch: false
  })

  useEffect(() => {
    if (!lenis) return

    // ═══ Replace window scroll listener with Lenis listener ═══
    lenis.on('scroll', ({ scroll, limit }) => {
      setNavSolid(scroll > 60)

      const progress = Math.min(scroll / limit, 1)
      if (scrollProgressRef.current) {
        scrollProgressRef.current.style.transform = `scaleX(${progress})`
      }
    })

    // Rest of your useEffect code...
  }, [lenis])

  return (
    <div className="page">
      {/* ═══ Add Custom Cursor ═══ */}
      <CustomCursor />

      {/* Your existing content... */}

      {/* ═══ Replace regular links with MagneticLink ═══ */}
      <header className="nav">
        <MagneticLink
          href="#contact"
          className="nav__cta liquid-metal"
          strength={0.4}
          radius={120}
        >
          Request Demo
        </MagneticLink>
      </header>

      {/* In Hero section */}
      <section className="hero">
        <div className="hero__actions">
          <MagneticLink
            href="#contact"
            className="btn btn--primary liquid-metal"
            strength={0.5}
            radius={150}
          >
            Schedule Assessment
          </MagneticLink>
        </div>
      </section>
    </div>
  )
}
```

---

## Advanced Usage

### Combine All Features

```jsx
import { useLenis, useLenisScroll } from '../hooks/useLenis'
import { useCustomCursor } from '../hooks/useCustomCursor'
import { useMagneticButton } from '../hooks/useMagneticButton'

function AdvancedPage() {
  // Smooth scroll with events
  const lenis = useLenisScroll(({ scroll, progress }) => {
    // React to scroll
    console.log('Scroll:', scroll, 'Progress:', progress)
  })

  // Custom cursor state
  const { cursorState, setCursorState } = useCustomCursor()

  // Magnetic button
  const buttonRef = useMagneticButton({ strength: 0.4 })

  return (
    <div>
      <button
        ref={buttonRef}
        onMouseEnter={() => setCursorState('hover')}
        onMouseLeave={() => setCursorState('default')}
      >
        Advanced Button
      </button>
    </div>
  )
}
```

### Custom Cursor Styling

Modify `/src/components/CustomCursor.css` to customize:

```css
/* Change cursor colors */
.custom-cursor {
  border-color: rgba(255, 0, 0, 0.5); /* Red cursor */
}

.custom-cursor-dot {
  background: rgba(255, 0, 0, 1);
}

/* Change hover size */
.custom-cursor--hover {
  width: 80px;   /* Larger */
  height: 80px;
}
```

### Disable Magnetic Effect on Mobile

Magnetic effects automatically disable on touch devices, but you can manually control:

```jsx
const isMobile = window.matchMedia('(hover: none)').matches

<MagneticButton
  disabled={isMobile}
  strength={0.5}
>
  Button
</MagneticButton>
```

---

## Performance Tips

1. **Lenis**: Already optimized with RAF loop
2. **Custom Cursor**: Uses `transform` and `will-change` for GPU acceleration
3. **Magnetic Buttons**:
   - Only activates on hover
   - Uses RAF only when needed
   - Automatically cleans up event listeners

---

## Troubleshooting

### Cursor not showing
- Check if device supports hover: `(hover: hover)` media query
- Cursor automatically hides on touch devices
- Ensure `CustomCursor` component is rendered

### Smooth scroll not working
- Make sure `useLenis()` is called
- Check browser console for errors
- Lenis requires `overflow: hidden` to be removed from body

### Magnetic effect too weak/strong
- Adjust `strength` (0-1)
- Increase/decrease `radius`
- Lower `ease` for more responsiveness (0.1-0.2)

---

## Configuration Reference

### Lenis Options
```js
{
  duration: 1.2,              // Scroll duration (seconds)
  easing: (t) => t,          // Easing function
  smooth: true,               // Enable smooth scroll
  smoothTouch: false,         // Smooth on touch (usually false)
  touchMultiplier: 2,         // Touch scroll speed
  infinite: false,            // Infinite scroll
  direction: 'vertical',      // 'vertical' or 'horizontal'
}
```

### Magnetic Button Options
```js
{
  strength: 0.3,    // Pull strength (0-1)
  radius: 100,      // Activation radius (px)
  ease: 0.15,       // Smoothness (0.1-0.2)
  disabled: false   // Disable effect
}
```

---

## Browser Support

- **Lenis**: All modern browsers (IE11+ with polyfills)
- **Custom Cursor**: Modern browsers with `pointer: fine` support
- **Magnetic Buttons**: All browsers (gracefully degrades)

All effects automatically disable on:
- Touch devices
- `prefers-reduced-motion: reduce`
- Browsers without hover support

---

## Credits

Built with:
- [@studio-freight/lenis](https://github.com/studio-freight/lenis) - Smooth scroll
- React Hooks - State management
- CSS3 Transforms - GPU-accelerated animations

---

**Need Help?** Check the reference implementation in:
`/src/pages/LandingPage3-INTEGRATED.jsx`
