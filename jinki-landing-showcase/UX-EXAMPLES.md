# Premium UX Code Examples
Quick reference for common implementation patterns

## 🎯 Quick Copy-Paste Snippets

### 1. Basic Page Setup (Minimum Code)

```jsx
import { useLenis } from '../hooks/useLenis'
import { CustomCursor } from '../components/CustomCursor'

export default function MyPage() {
  useLenis() // That's it for smooth scroll!

  return (
    <div>
      <CustomCursor />
      {/* Your content */}
    </div>
  )
}
```

---

### 2. Navigation with Magnetic CTA

```jsx
import { MagneticLink } from '../components/MagneticButton'

<header className="nav">
  <div className="nav__container">
    <a href="#" className="nav__brand">Logo</a>

    <nav className="nav__menu">
      <a href="#about">About</a>
      <a href="#services">Services</a>
    </nav>

    {/* Magnetic CTA Button */}
    <MagneticLink
      href="#contact"
      className="nav__cta liquid-metal"
      strength={0.4}
      radius={120}
    >
      Get Started
    </MagneticLink>
  </div>
</header>
```

---

### 3. Hero Section with Magnetic Buttons

```jsx
import { MagneticLink } from '../components/MagneticButton'

<section className="hero">
  <h1>Premium Landing Page</h1>
  <p>Smooth interactions that feel amazing</p>

  <div className="hero__actions">
    {/* Primary CTA - Strong magnetic pull */}
    <MagneticLink
      href="#demo"
      className="btn btn--primary liquid-metal"
      strength={0.6}
      radius={180}
    >
      <span>Schedule Demo</span>
      <svg className="btn__arrow">...</svg>
    </MagneticLink>

    {/* Secondary CTA - Subtle magnetic pull */}
    <MagneticLink
      href="#learn-more"
      className="btn btn--glass glass-panel"
      strength={0.3}
      radius={120}
    >
      Learn More
    </MagneticLink>
  </div>
</section>
```

---

### 4. Scroll Progress Indicator with Lenis

```jsx
import { useLenis } from '../hooks/useLenis'
import { useRef, useEffect } from 'react'

export default function MyPage() {
  const progressRef = useRef(null)

  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    lenis.on('scroll', ({ scroll, limit }) => {
      const progress = Math.min(scroll / limit, 1)
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`
      }
    })
  }, [lenis])

  return (
    <>
      <div ref={progressRef} className="scroll-progress" />
      {/* Content */}
    </>
  )
}

// CSS
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, cyan, blue);
  transform-origin: left;
  transform: scaleX(0);
  z-index: 9999;
}
```

---

### 5. Programmatic Smooth Scrolling

```jsx
import { useLenisControls } from '../hooks/useLenis'

export default function Navigation() {
  const { scrollTo } = useLenisControls()

  const handleNavClick = (e, target) => {
    e.preventDefault()
    scrollTo(target, {
      offset: -80,      // Account for fixed header
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    })
  }

  return (
    <nav>
      <a href="#about" onClick={(e) => handleNavClick(e, '#about')}>
        About
      </a>
      <a href="#services" onClick={(e) => handleNavClick(e, '#services')}>
        Services
      </a>
    </nav>
  )
}
```

---

### 6. Magnetic Card Grid

```jsx
import { useMagneticButton } from '../hooks/useMagneticButton'

function Card({ title, description }) {
  const cardRef = useMagneticButton({
    strength: 0.2,
    radius: 150,
    ease: 0.12
  })

  return (
    <article ref={cardRef} className="card glass-panel">
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}

export default function CardGrid() {
  return (
    <div className="card-grid">
      <Card title="Fast" description="Lightning fast performance" />
      <Card title="Smooth" description="Buttery smooth animations" />
      <Card title="Premium" description="World-class UX" />
    </div>
  )
}
```

---

### 7. Magnetic Rotating Elements

```jsx
import { useMagneticRotate } from '../hooks/useMagneticButton'

function RotatingCard({ title, image }) {
  const cardRef = useMagneticRotate({
    maxRotation: 12,
    ease: 0.1
  })

  return (
    <div ref={cardRef} className="card-3d">
      <img src={image} alt={title} />
      <h3>{title}</h3>
    </div>
  )
}

// CSS for 3D effect
.card-3d {
  transform-style: preserve-3d;
  transition: box-shadow 0.3s ease;
}

.card-3d:hover {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
```

---

### 8. Custom Cursor State Change

```jsx
import { useCustomCursor } from '../hooks/useCustomCursor'

function InteractiveArea() {
  const { setCursorState } = useCustomCursor()

  return (
    <div
      className="interactive-zone"
      onMouseEnter={() => setCursorState('hover')}
      onMouseLeave={() => setCursorState('default')}
      onMouseDown={() => setCursorState('click')}
      onMouseUp={() => setCursorState('hover')}
    >
      Hover over me to change cursor
    </div>
  )
}
```

---

### 9. Cursor Inversion on Light Backgrounds

```jsx
import { useCursorInvert } from '../hooks/useCustomCursor'
import { useRef } from 'react'

function LightSection() {
  const sectionRef = useRef(null)
  useCursorInvert(sectionRef, true)

  return (
    <section
      ref={sectionRef}
      style={{
        background: 'white',
        color: 'black',
        padding: '100px 20px'
      }}
    >
      <h2>Light Background Section</h2>
      <p>Cursor automatically inverts to dark here</p>
    </section>
  )
}
```

---

### 10. Parallax Scroll Effect with Lenis

```jsx
import { useLenisScroll } from '../hooks/useLenis'
import { useRef, useState } from 'react'

function ParallaxSection() {
  const [scrollY, setScrollY] = useState(0)

  useLenisScroll(({ scroll }) => {
    setScrollY(scroll)
  })

  return (
    <section className="parallax-section">
      {/* Background layer - slow */}
      <div
        className="parallax-bg"
        style={{
          transform: `translateY(${scrollY * 0.3}px)`
        }}
      />

      {/* Midground - medium */}
      <div
        className="parallax-mid"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`
        }}
      />

      {/* Foreground - fast */}
      <div
        className="parallax-front"
        style={{
          transform: `translateY(${scrollY * 0.8}px)`
        }}
      />
    </section>
  )
}
```

---

### 11. Stop/Start Scroll Programmatically

```jsx
import { useLenisControls } from '../hooks/useLenis'
import { useState } from 'react'

function ModalWithScrollLock() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { stop, start } = useLenisControls()

  const openModal = () => {
    setIsModalOpen(true)
    stop() // Disable scroll
  }

  const closeModal = () => {
    setIsModalOpen(false)
    start() // Re-enable scroll
  }

  return (
    <>
      <button onClick={openModal}>Open Modal</button>

      {isModalOpen && (
        <div className="modal">
          <button onClick={closeModal}>Close</button>
          <p>Modal content</p>
        </div>
      )}
    </>
  )
}
```

---

### 12. Scroll-Triggered Animations with Lenis

```jsx
import { useLenisScroll } from '../hooks/useLenis'
import { useRef, useEffect, useState } from 'react'

function FadeInSection({ children }) {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useLenisScroll(() => {
    if (!sectionRef.current) return

    const rect = sectionRef.current.getBoundingClientRect()
    const inView = rect.top < window.innerHeight * 0.8

    if (inView && !isVisible) {
      setIsVisible(true)
    }
  })

  return (
    <section
      ref={sectionRef}
      className={`fade-section ${isVisible ? 'visible' : ''}`}
    >
      {children}
    </section>
  )
}

// CSS
.fade-section {
  opacity: 0;
  transform: translateY(50px);
  transition: opacity 0.8s, transform 0.8s;
}

.fade-section.visible {
  opacity: 1;
  transform: translateY(0);
}
```

---

### 13. Complete Landing Page Template

```jsx
import { useLenis } from '../hooks/useLenis'
import { CustomCursor } from '../components/CustomCursor'
import { MagneticLink } from '../components/MagneticButton'

export default function LandingPage() {
  useLenis({
    duration: 1.2,
    smooth: true,
    smoothTouch: false
  })

  return (
    <>
      <CustomCursor />

      <header className="nav">
        <MagneticLink href="#contact" className="nav__cta">
          Get Started
        </MagneticLink>
      </header>

      <section className="hero">
        <h1>Premium Landing Page</h1>
        <MagneticLink href="#demo" className="btn btn--primary">
          Schedule Demo
        </MagneticLink>
      </section>

      <section className="features">
        {/* Feature cards with magnetic effect */}
      </section>

      <section className="cta">
        <MagneticLink href="mailto:hello@example.com" className="btn btn--lg">
          Contact Us
        </MagneticLink>
      </section>
    </>
  )
}
```

---

## 🎨 Styling Patterns

### Magnetic Button Base Styles

```css
.magnetic-button {
  display: inline-block;
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### Liquid Metal Button

```css
.liquid-metal {
  background: linear-gradient(
    135deg,
    #E8E8E8 0%,
    #06b6d4 15%,
    #D0D0D0 30%,
    #22d3ee 50%,
    #D0D0D0 70%,
    #06b6d4 85%,
    #F0F0F0 100%
  );
  background-size: 300% 300%;
  animation: metalShimmer 2s infinite;
}

@keyframes metalShimmer {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
}
```

### Glass Panel

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

---

## ⚡ Performance Tips

```jsx
// ✅ Good - Single Lenis instance at root
function App() {
  useLenis()
  return <Router>...</Router>
}

// ❌ Bad - Multiple instances
function Page1() {
  useLenis() // Don't do this in every page
}
function Page2() {
  useLenis() // Only initialize once at root
}
```

```jsx
// ✅ Good - Passive event listeners
window.addEventListener('mousemove', handler, { passive: true })

// ✅ Good - RAF for smooth animations
requestAnimationFrame(animate)

// ✅ Good - GPU acceleration
transform: translate3d(0, 0, 0)
will-change: transform

// ❌ Bad - Top/left positioning
position: absolute;
left: 100px; // Use transform instead
```

---

## 🐛 Common Issues & Fixes

### Issue: Cursor not visible
```jsx
// Solution: Check media query
@media (hover: hover) {
  * { cursor: none !important; }
}
```

### Issue: Scroll feels laggy
```jsx
// Solution: Increase scroll speed
useLenis({
  duration: 0.8,  // Faster (default 1.2)
  touchMultiplier: 2
})
```

### Issue: Magnetic effect too subtle
```jsx
// Solution: Increase strength and radius
<MagneticButton
  strength={0.6}  // Increase from 0.3
  radius={200}    // Increase from 100
>
```

---

## 📱 Mobile Considerations

All effects automatically handle mobile:

```jsx
// Custom cursor - automatically hidden on touch devices
// Magnetic buttons - automatically disabled on touch devices
// Smooth scroll - smoothTouch: false by default

// Manual check if needed:
const isMobile = window.matchMedia('(hover: none)').matches
```

---

## ♿ Accessibility

All components respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

**More examples in:** `/src/pages/LandingPage3-INTEGRATED.jsx`
