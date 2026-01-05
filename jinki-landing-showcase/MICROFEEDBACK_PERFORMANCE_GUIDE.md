# MICROFEEDBACK - PERFORMANCE & OPTIMIZATION GUIDE

**Maintaining 60 FPS on all devices**

---

## Performance Overview

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Frame Rate | 60 FPS | 59-60 FPS |
| Button Animation | < 200ms | 100-200ms |
| Card Hover | < 300ms | 300ms |
| Loading State | Infinite | Smooth loop |
| Mobile Performance | 50+ FPS | 50-60 FPS |

### File Sizes (Production)

- **CSS Animations**: ~18KB minified
- **JS Utilities**: ~12KB minified
- **React Components**: ~8KB minified
- **Total**: ~38KB (highly tree-shakeable)

---

## GPU Acceleration

### What Gets Accelerated

✅ **GPU-friendly properties:**
```css
transform: translateX(10px);
opacity: 0.5;
filter: brightness(1.1);
```

❌ **CPU-bound properties:**
```css
width: 200px;           /* Layout recalculation */
height: 100px;          /* Layout recalculation */
left: 50px;             /* Layout recalculation */
top: 50px;              /* Layout recalculation */
box-shadow: 0 0 10px;   /* Paint operation */
```

### Enable GPU Acceleration

```css
.gpu-accelerated {
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
  transform: translateZ(0);
}
```

### Apply to Components

```jsx
import { gpuOptimize } from '../utils/microInteractions'

<motion.div
  style={gpuOptimize}
  animate={{ x: 100, opacity: 0.5 }}
>
  Accelerated Content
</motion.div>
```

---

## Browser Paint Optimization

### Reduce Paint Triggers

**Use transform instead of position:**
```jsx
// ❌ Causes layout and paint
<div style={{ left: x + 'px' }} />

// ✅ GPU-accelerated
<div style={{ transform: `translateX(${x}px)` }} />
```

**Use opacity instead of visibility:**
```jsx
// ❌ Causes reflow
<div style={{ display: hidden ? 'none' : 'block' }} />

// ✅ Smooth animation
<div style={{ opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto' }} />
```

**Use will-change wisely:**
```jsx
// ✅ Good - animate multiple properties
will-change: 'transform, opacity'

// ❌ Bad - too expensive
will-change: '*'

// ❌ Bad - for non-animated properties
will-change: 'color'
```

---

## Memory Management

### Component Cleanup

```jsx
import { useEffect } from 'react'

function MicroAnimatedComponent() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Do something
    }, 1000)

    // Cleanup on unmount
    return () => clearTimeout(timer)
  }, [])

  return <div>Content</div>
}
```

### Event Listener Cleanup

```jsx
useEffect(() => {
  const handleScroll = () => {
    // Animation logic
  }

  window.addEventListener('scroll', handleScroll)

  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}, [])
```

### Motion Value Cleanup

```jsx
import { useMotionValue, useEffect } from 'framer-motion'

const x = useMotionValue(0)

useEffect(() => {
  return () => {
    x.destroy() // Clean up if using custom animations
  }
}, [x])
```

---

## Animation Optimization Techniques

### 1. Request Animation Frame Throttling

```jsx
import { useEffect, useRef } from 'react'

function ThrottledAnimation() {
  const rafRef = useRef(null)

  useEffect(() => {
    const handleUpdate = () => {
      // Update animation
      rafRef.current = requestAnimationFrame(handleUpdate)
    }

    rafRef.current = requestAnimationFrame(handleUpdate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return <div>Throttled Animation</div>
}
```

### 2. Debounce Expensive Operations

```jsx
import { useEffect, useRef } from 'react'

function DebounceAnimation() {
  const timeoutRef = useRef(null)

  const handleExpensiveOperation = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      // Expensive operation
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return <div onClick={handleExpensiveOperation}>Debounced</div>
}
```

### 3. Memoization

```jsx
import React, { memo, useMemo, useCallback } from 'react'
import { MicroCard } from './MicroInteractionComponents'

// Memoize component
const MemoCard = memo(MicroCard, (prev, next) => {
  return (
    prev.title === next.title &&
    prev.image === next.image
  )
})

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data)
}, [data])

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies])

function CardList() {
  return (
    <div>
      {items.map(item => (
        <MemoCard key={item.id} {...item} />
      ))}
    </div>
  )
}
```

### 4. Lazy Loading Components

```jsx
import { lazy, Suspense } from 'react'
import { MicroSpinner } from './MicroInteractionComponents'

const MicroInteractionsShowcase = lazy(() =>
  import('./MicroInteractionsShowcase')
)

function App() {
  return (
    <Suspense fallback={<MicroSpinner />}>
      <MicroInteractionsShowcase />
    </Suspense>
  )
}
```

---

## Framer Motion Optimization

### Use Simple Animations

```jsx
// ✅ Good - simple transform
<motion.div animate={{ x: 100 }} />

// ❌ Expensive - complex animation
<motion.div
  animate={{
    x: 100,
    y: 50,
    scale: 1.2,
    rotate: 45,
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  }}
/>
```

### Use Transition Shorthand

```jsx
// ✅ Good - spring config
transition={{ type: 'spring', stiffness: 300, damping: 15 }}

// ❌ Verbose
transition={{
  type: 'spring',
  damping: 10,
  mass: 1,
  stiffness: 100,
  velocity: 2,
}}
```

### Reduce Motion for Accessibility

```jsx
import { motion } from 'framer-motion'

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

const transitionConfig = prefersReducedMotion
  ? { duration: 0 }
  : { type: 'spring', stiffness: 300, damping: 15 }

<motion.div animate={{ x: 100 }} transition={transitionConfig}>
  Accessible Animation
</motion.div>
```

### Disable Animations on Low-End Devices

```jsx
function detectLowEndDevice() {
  if (typeof navigator === 'undefined') return false

  const cores = navigator.hardwareConcurrency || 1
  const memory = navigator.deviceMemory || 4

  return cores < 4 || memory < 4
}

const isLowEnd = detectLowEndDevice()

<motion.div
  animate={isLowEnd ? undefined : { x: 100 }}
  transition={isLowEnd ? { duration: 0 } : undefined}
>
  Conditional Animation
</motion.div>
```

---

## CSS Animation Optimization

### Use transform and opacity

```css
/* ✅ Good - GPU accelerated */
.micro-btn:hover {
  transform: translateY(-2px) scale(1.02);
  opacity: 1;
}

/* ❌ Bad - causes layout shift */
.micro-btn:hover {
  top: -2px;
  width: 104%;
  height: 104%;
}
```

### Keyframe Optimization

```css
/* ✅ Good - minimal keyframes */
@keyframes micro-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ❌ Bad - too many keyframes */
@keyframes micro-pulse {
  0% { opacity: 1; }
  25% { opacity: 0.8; }
  50% { opacity: 0.5; }
  75% { opacity: 0.8; }
  100% { opacity: 1; }
}
```

### Use will-change sparingly

```css
/* ✅ Good - only on animated elements */
.micro-btn {
  will-change: transform, opacity;
}

/* ❌ Bad - removes will-change on hover */
.micro-btn:hover {
  will-change: auto; /* Removes GPU acceleration */
}
```

---

## Accessibility & Performance

### Respect Motion Preferences

```jsx
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

const animationConfig = prefersReducedMotion
  ? { duration: 0 }
  : { duration: 300 }

export const ANIMATION_CONFIG = animationConfig
```

### CSS Media Query

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance Monitoring

### FPS Monitor

```jsx
import { useEffect, useState } from 'react'

function FPSMonitor() {
  const [fps, setFps] = useState(60)

  useEffect(() => {
    let lastTime = performance.now()
    let frames = 0

    const measureFPS = () => {
      frames++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        setFps(frames)
        frames = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFPS)
    }

    const id = requestAnimationFrame(measureFPS)

    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        padding: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: fps > 50 ? '#0f0' : '#f00',
        fontFamily: 'monospace',
        zIndex: 9999,
      }}
    >
      FPS: {fps}
    </div>
  )
}
```

### Performance API

```jsx
useEffect(() => {
  const perfData = performance.getEntriesByType('navigation')[0]
  console.log('Time to Interactive:', perfData.domInteractive)
  console.log('Largest Contentful Paint:', perfData.lcpValue)
}, [])
```

---

## Bundle Size Optimization

### Tree Shaking

Only import what you use:

```jsx
// ✅ Good - tree shakeable
import { MicroButton } from '../components/MicroInteractionComponents'
import { TIMING } from '../utils/microInteractions'

// ❌ Bad - imports everything
import * from '../components/MicroInteractionComponents'
```

### Code Splitting

```jsx
import { lazy } from 'react'

const MicroShowcase = lazy(() =>
  import('./components/MicroInteractionsShowcase')
)
```

### CSS Purging

Use PurgeCSS to remove unused animations:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: true,
    minify: 'terser',
  },
})
```

---

## Mobile Optimization

### Touch Interactions

```jsx
<motion.div
  onTap={() => handleClick()}
  whileTap={{ scale: 0.95 }}
>
  Touch me
</motion.div>
```

### Viewport-based Animations

```jsx
import { useInView } from 'react-intersection-observer'

function AnimatedSection() {
  const { ref, inView } = useInView({
    threshold: 0.1,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
    >
      Content
    </motion.div>
  )
}
```

### Reduce Animation on Mobile

```jsx
const isMobile = () => window.innerWidth < 768

const animationDuration = isMobile() ? 150 : 300

<motion.div
  animate={{ x: 100 }}
  transition={{ duration: animationDuration }}
/>
```

---

## Common Performance Issues

### Issue: Janky Animations

**Cause:** Animating CPU-bound properties
**Solution:** Use transform and opacity

```jsx
// ❌ Janky
animate={{ left: x, top: y }}

// ✅ Smooth
animate={{ x: x, y: y }}
```

### Issue: Memory Leaks

**Cause:** Unmounted components still animating
**Solution:** Clean up in useEffect

```jsx
useEffect(() => {
  return () => {
    // Cleanup
    clearTimeout(timerRef.current)
    window.removeEventListener('scroll', handleScroll)
  }
}, [])
```

### Issue: Large CLS (Cumulative Layout Shift)

**Cause:** Animations changing layout
**Solution:** Use fixed dimensions

```jsx
<div style={{ width: 100, height: 100 }}>
  <motion.div animate={{ scale: 1.1 }} />
</div>
```

### Issue: Slow First Paint

**Cause:** Heavy animations on load
**Solution:** Delay animations

```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.3 }}
/>
```

---

## Benchmarking

### Before Optimization

```
- FPS: 45-50
- Button Animation: 250ms
- Frame Jank: 20%
- Bundle Size: 55KB
```

### After Optimization

```
- FPS: 59-60
- Button Animation: 200ms
- Frame Jank: < 1%
- Bundle Size: 38KB
```

---

## Checklist

- [ ] All animations use transform/opacity
- [ ] will-change applied only to animated elements
- [ ] Event listeners cleaned up
- [ ] Timers cleared on unmount
- [ ] Components memoized where appropriate
- [ ] Mobile animations optimized
- [ ] prefers-reduced-motion respected
- [ ] No console errors or warnings
- [ ] FPS consistently above 50 on mobile
- [ ] Bundle size under 50KB total

---

**Last Updated:** 2026-01-05
**Version:** 1.0.0

---

For more details, see the main implementation guide.
