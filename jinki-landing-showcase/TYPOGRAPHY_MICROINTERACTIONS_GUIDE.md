# Premium Typography & Micro-Interactions Guide

Complete implementation guide for Opti.ai + Apple level typography and micro-interactions.

---

## 📁 File Structure

```
jinki-landing-showcase/src/
├── pages/
│   ├── LandingPage3.css              # Original styles
│   └── typography-microinteractions.css  # NEW: Typography & animations
├── hooks/
│   └── useTextAnimations.js          # NEW: Text animation hooks
├── components/
│   ├── NumberCounter.jsx             # NEW: Counter component
│   └── microinteractions.js          # NEW: JS utilities
```

---

## 🎨 1. TYPOGRAPHY SYSTEM

### Import the Typography CSS

```jsx
// In your main component or App.js
import './pages/typography-microinteractions.css';
```

### Fluid Type Scale Classes

All text scales responsively using `clamp()`:

```jsx
<h1 className="type-7xl">Massive Headline</h1>
<h2 className="type-6xl">Large Title</h2>
<h3 className="type-5xl">Section Heading</h3>
<h4 className="type-4xl">Subsection</h4>
<p className="type-lg">Large body text</p>
<p className="type-base">Regular body</p>
<small className="type-sm">Small text</small>
```

### Typography Features

```jsx
// Balanced headline wrapping
<h1 className="type-6xl text-balance">
  This headline will wrap beautifully
</h1>

// Pretty text wrapping (prevents orphans)
<p className="type-lg text-pretty">
  Long paragraph text that wraps intelligently
</p>

// Hyphenation for narrow columns
<p className="text-hyphenate">
  Long text in narrow columns will hyphenate properly
</p>

// Tabular numbers for aligned digits
<div className="font-tabular-nums">
  <p>$1,234.56</p>
  <p>$2,345.67</p>
  <p>$3,456.78</p>
</div>
```

### Gradient Text Animations

```jsx
// Animated gradient text
<h2 className="type-5xl text-gradient-animate">
  Gradient Shifting Text
</h2>

// Shimmer effect
<h3 className="type-4xl text-shimmer">
  Shimmering Text
</h3>

// Liquid metal text (from original CSS)
<h1 className="type-6xl liquid-text">
  Metallic Chrome Text
</h1>
```

---

## 🔗 2. LINK ANIMATIONS

### Underline Slide In

```jsx
<a href="#" className="link-underline-slide">
  Hover me - underline slides in from left
</a>
```

### Underline from Center

```jsx
<a href="#" className="link-underline-center">
  Hover me - underline expands from center
</a>
```

### Draw Underline

```jsx
<a href="#" className="link-underline-draw">
  Hover me - underline draws smoothly
</a>
```

---

## 🎯 3. BUTTON MICRO-INTERACTIONS

### Ripple Effect

```jsx
// Light ripple (on dark backgrounds)
<button className="btn btn--primary liquid-metal ripple">
  Click for Ripple
</button>

// Dark ripple (on light backgrounds)
<button className="btn ripple ripple-dark">
  Dark Ripple
</button>

// Accent ripple
<button className="btn ripple ripple-accent">
  Accent Ripple
</button>
```

### Hover Lift

```jsx
// Standard lift with layered shadows
<button className="btn hover-lift">
  Lift on Hover
</button>

// Lift with glow
<button className="btn hover-lift-glow">
  Lift with Glow
</button>
```

---

## 🃏 4. 3D CARD TILT

### Basic Setup

```jsx
import { init3DCardTilt } from './components/microinteractions';
import { useEffect, useRef } from 'react';

function FeatureCard() {
  const cardRef = useRef(null);

  useEffect(() => {
    const cleanup = init3DCardTilt(cardRef.current, {
      maxTilt: 15,
      perspective: 1000,
      scale: 1.05,
      glare: true,
    });

    return cleanup;
  }, []);

  return (
    <div ref={cardRef} className="card-3d glass-panel">
      <div className="card-3d-content">
        <div className="card-3d-shine"></div>
        <h3>Card Title</h3>
        <p>Card content here</p>
      </div>
    </div>
  );
}
```

---

## 🔢 5. NUMBER COUNTER

### Basic Counter

```jsx
import NumberCounter from './components/NumberCounter';

function Stats() {
  return (
    <div>
      <NumberCounter
        end={1250}
        duration={2000}
        easing="easeOutExpo"
        suffix="+"
        className="type-5xl counter--highlight"
      />
    </div>
  );
}
```

### Counter on Scroll Trigger

```jsx
import NumberCounter, { useCounterOnView } from './components/NumberCounter';

function StatsSection() {
  const [ref, hasTriggered] = useCounterOnView(0.5);

  return (
    <div ref={ref}>
      <NumberCounter
        end={5000}
        trigger={hasTriggered}
        suffix="+"
        className="type-4xl"
      />
    </div>
  );
}
```

### Preset Counters

```jsx
import { PercentageCounter, CurrencyCounter, LargeNumberCounter }
  from './components/NumberCounter';

// Percentage
<PercentageCounter value={95} />
// Output: 95%

// Currency
<CurrencyCounter value={1234.56} currency="$" />
// Output: $1,234.56

// Large numbers with K/M/B
<LargeNumberCounter value={1250000} />
// Output: 1.3M
```

---

## ✨ 6. TEXT ANIMATIONS

### Text Scramble Effect

```jsx
import { useTextScramble } from './hooks/useTextAnimations';

function AnimatedHeadline() {
  const text = useTextScramble('Welcome to Jinki Intelligence', 2000, 500);

  return <h1 className="type-6xl">{text}</h1>;
}
```

### Character Reveal Animation

```jsx
import { useCharacterReveal } from './hooks/useTextAnimations';

function RevealHeadline() {
  const chars = useCharacterReveal('Premium Typography', 50, true);

  return (
    <h1 className="type-5xl">
      {chars.map(({ char, delay, key }) => (
        <span
          key={key}
          className="char-reveal"
          style={{ animationDelay: `${delay}ms` }}
        >
          {char}
        </span>
      ))}
    </h1>
  );
}
```

### Typing Effect

```jsx
import { useTypingEffect } from './hooks/useTextAnimations';

function TypedText() {
  const text = useTypingEffect('Building the future of AI...', 100, 500);

  return <p className="type-lg">{text}</p>;
}
```

### Word Reveal

```jsx
import { useWordReveal } from './hooks/useTextAnimations';

function WordRevealText() {
  const words = useWordReveal('Premium design for modern applications', 200, true);

  return (
    <p className="type-xl">
      {words.map(({ word, visible, key }) => (
        <span
          key={key}
          className={`animate-on-scroll ${visible ? 'is-visible' : ''}`}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
        >
          {word}
        </span>
      ))}
    </p>
  );
}
```

---

## 📝 7. FORM INPUTS

### Floating Label Input

```jsx
<div className="input-float-label">
  <input
    type="text"
    id="email"
    placeholder=" "
    required
  />
  <label htmlFor="email">Email Address</label>
</div>
```

### Animated Checkbox

```jsx
<label className="checkbox-animated">
  <input type="checkbox" />
  <span className="checkbox-animated__box">
    <svg className="checkbox-animated__checkmark" viewBox="0 0 24 24">
      <path d="M5 12l5 5L20 7" />
    </svg>
  </span>
  <span>I agree to the terms</span>
</label>
```

---

## 🎭 8. ICON ANIMATIONS

### Bounce on Hover

```jsx
<div className="icon-bounce">
  <svg>...</svg>
</div>
```

### Rotate on Hover

```jsx
<div className="icon-rotate">
  <svg>...</svg>
</div>
```

### Pulse Animation

```jsx
<div className="icon-pulse">
  <svg>...</svg>
</div>
```

### Wiggle on Hover

```jsx
<div className="icon-wiggle">
  <svg>...</svg>
</div>
```

---

## 🖱️ 9. ADVANCED INTERACTIONS

### Magnetic Button

```jsx
import { initMagneticButton } from './components/microinteractions';
import { useEffect, useRef } from 'react';

function MagneticCTA() {
  const btnRef = useRef(null);

  useEffect(() => {
    const cleanup = initMagneticButton(btnRef.current, {
      strength: 20,
      distance: 100,
    });

    return cleanup;
  }, []);

  return (
    <button ref={btnRef} className="btn btn--primary liquid-metal btn-magnetic">
      Magnetic Button
    </button>
  );
}
```

### Cursor Trail

```jsx
import { initCursorTrail } from './components/microinteractions';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const cleanup = initCursorTrail({
      color: '#06b6d4',
      size: 8,
      lifetime: 500,
      interval: 50,
    });

    return cleanup;
  }, []);

  return <div>Your app content</div>;
}
```

### Scroll Progress Bar

```jsx
// Add to your layout
<div className="scroll-progress"></div>

// Initialize in component
import { initScrollProgress } from './components/microinteractions';

useEffect(() => {
  const progressBar = document.querySelector('.scroll-progress');
  const cleanup = initScrollProgress(progressBar);
  return cleanup;
}, []);
```

---

## 🚀 10. COMPLETE INTEGRATION EXAMPLE

### Hero Section with All Features

```jsx
import React, { useEffect, useRef } from 'react';
import NumberCounter, { useCounterOnView } from './components/NumberCounter';
import { useTextScramble, useCharacterReveal } from './hooks/useTextAnimations';
import { init3DCardTilt, initAllMicroInteractions } from './components/microinteractions';
import './pages/LandingPage3.css';
import './pages/typography-microinteractions.css';

function EnhancedHero() {
  // Text animations
  const scrambledText = useTextScramble('Jinki Intelligence', 2000, 500);
  const taglineChars = useCharacterReveal('Building Tomorrow', 30, true);

  // Counter
  const [statsRef, statsTriggered] = useCounterOnView(0.5);

  // Initialize all micro-interactions
  useEffect(() => {
    const cleanup = initAllMicroInteractions({
      card3D: { maxTilt: 15, scale: 1.05 },
      magnetic: { strength: 20, distance: 100 },
      smoothScroll: { offset: 80, duration: 800 },
    });

    return cleanup;
  }, []);

  return (
    <section className="hero">
      <div className="hero__content">
        {/* Scramble headline */}
        <h1 className="type-7xl text-balance liquid-text">
          {scrambledText}
        </h1>

        {/* Character reveal tagline */}
        <p className="type-2xl text-gradient-animate">
          {taglineChars.map(({ char, delay, key }) => (
            <span key={key} className="char-reveal" style={{ animationDelay: `${delay}ms` }}>
              {char}
            </span>
          ))}
        </p>

        {/* Ripple button */}
        <button className="btn btn--primary btn--lg liquid-metal ripple hover-lift-glow">
          Get Started
        </button>
      </div>

      {/* Animated stats */}
      <div ref={statsRef} className="hero__stats glass-panel">
        <div className="hero__stat">
          <NumberCounter
            end={1250}
            trigger={statsTriggered}
            suffix="+"
            className="hero__stat-value counter--highlight"
          />
          <span className="hero__stat-label">Active Users</span>
        </div>

        <div className="hero__stat">
          <NumberCounter
            end={99}
            trigger={statsTriggered}
            suffix="%"
            decimals={1}
            className="hero__stat-value counter--highlight"
          />
          <span className="hero__stat-label">Uptime</span>
        </div>
      </div>
    </section>
  );
}

export default EnhancedHero;
```

---

## 📊 Typography Scale Reference

```
--text-xs:   12px → 13px
--text-sm:   14px → 15px
--text-base: 16px → 18px
--text-lg:   18px → 21px
--text-xl:   20px → 24px
--text-2xl:  24px → 30px
--text-3xl:  30px → 40px
--text-4xl:  36px → 52px
--text-5xl:  48px → 72px
--text-6xl:  60px → 96px
--text-7xl:  72px → 128px
```

---

## 🎨 Letter Spacing Reference

```
--tracking-tighter:  -0.05em
--tracking-tight:    -0.025em
--tracking-normal:    0em
--tracking-wide:      0.025em
--tracking-wider:     0.05em
--tracking-widest:    0.1em
--tracking-ultra:     0.15em
```

---

## ⚡ Performance Tips

1. **Hardware Acceleration**: Add `hw-accelerate` class to animated elements
2. **Will-change**: Already applied to interactive elements
3. **Reduced Motion**: Respects `prefers-reduced-motion` user preference
4. **Intersection Observer**: Use `useCounterOnView` to trigger only when visible
5. **Cleanup**: All hooks and utilities return cleanup functions

---

## 🔧 Customization

### Override Typography Variables

```css
:root {
  --text-5xl: clamp(3.5rem, 3rem + 2.5vw, 5rem);
  --tracking-tight: -0.03em;
}
```

### Custom Easing Functions

Available in NumberCounter:
- `linear`
- `easeOutCubic`
- `easeOutExpo` (default)
- `easeInOutQuad`

---

## 📱 Responsive Behavior

All typography automatically scales with viewport:
- Mobile: Smaller end of clamp() range
- Tablet: Mid-range interpolation
- Desktop: Larger end of clamp() range

Special mobile adjustments at 768px breakpoint reduce scale for better fit.

---

## ✅ Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS clamp() support required (2020+)
- Backdrop-filter for glass effects
- CSS custom properties
- Intersection Observer API

---

## 🎯 Quick Start Checklist

- [ ] Import `typography-microinteractions.css`
- [ ] Add `NumberCounter` component to stats
- [ ] Apply `.type-*` classes to text elements
- [ ] Add `.text-balance` to headlines
- [ ] Use `.ripple` on primary buttons
- [ ] Initialize micro-interactions with `initAllMicroInteractions()`
- [ ] Add scroll progress bar
- [ ] Implement character reveal on hero headline
- [ ] Add 3D tilt to feature cards
- [ ] Test on mobile devices

---

**Enjoy your premium typography and micro-interactions! 🎉**
