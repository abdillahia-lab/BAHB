# MORPHEUS: Ready-to-Use Code Snippets

Copy and paste these code snippets into your project for immediate implementation.

---

## SNIPPET 1: ASCII to Rendered Image Transition

**File:** `/src/components/AsciiToRendered.jsx`

```jsx
import { useState, useRef } from 'react';
import { AsciiToRenderedTransition } from '@/utils/advancedTransitions';
import '@/styles/morpheusTransitions.css';

export default function AsciiToRendered() {
  const [showRendered, setShowRendered] = useState(false);
  const asciiRef = useRef(null);
  const imageRef = useRef(null);
  const transitionRef = useRef(
    new AsciiToRenderedTransition({ duration: 1200 })
  );

  const handleTransform = async () => {
    if (showRendered) {
      setShowRendered(false);
      imageRef.current.style.display = 'none';
      asciiRef.current.style.display = 'block';
    } else {
      await transitionRef.current.transform(asciiRef.current, imageRef.current);
      setShowRendered(true);
    }
  };

  const asciiArt = `
    ╔════════════════════════════╗
    ║     ◉ JINKI VISION ◉      ║
    ╠════════════════════════════╣
    ║  ███████████████████████  ║
    ║  ███ EX ALTO OMNIA ███  ║
    ║  ███████████████████████  ║
    ║  ─────────────────────────  ║
    ║  From Above, All Things  ║
    ╚════════════════════════════╝
  `;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
      <h2 style={{ color: '#00e5ff', marginBottom: '20px' }}>
        ASCII to Rendered Transform
      </h2>

      <div style={{ minHeight: '300px', marginBottom: '20px' }}>
        <pre
          ref={asciiRef}
          style={{
            display: !showRendered ? 'block' : 'none',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#00b4d8',
            textShadow: '0 0 20px rgba(0, 180, 216, 0.8)',
            background: 'rgba(0, 20, 40, 0.5)',
            border: '1px solid rgba(0, 180, 216, 0.3)',
            padding: '20px',
            borderRadius: '12px',
          }}
        >
          {asciiArt}
        </pre>

        <div
          ref={imageRef}
          style={{
            display: showRendered ? 'flex' : 'none',
            height: '280px',
            background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(0, 40, 80, 0.2) 100%)',
            border: '2px solid rgba(0, 180, 216, 0.6)',
            borderRadius: '12px',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: '#00e5ff',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)',
          }}
        >
          ◉ VISION RENDERED
        </div>
      </div>

      <button
        onClick={handleTransform}
        style={{
          padding: '12px 32px',
          fontSize: '14px',
          color: '#00e5ff',
          background: 'rgba(0, 180, 216, 0.1)',
          border: '2px solid rgba(0, 180, 216, 0.5)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
        }}
      >
        {showRendered ? '← Back to ASCII' : 'Transform →'}
      </button>
    </div>
  );
}
```

**Usage:**
```jsx
import AsciiToRendered from '@/components/AsciiToRendered';

export default function App() {
  return (
    <div>
      <AsciiToRendered />
    </div>
  );
}
```

---

## SNIPPET 2: Portal Section Carousel

**File:** `/src/components/PortalCarousel.jsx`

```jsx
import { useState, useRef } from 'react';
import { PortalTransition } from '@/utils/advancedTransitions';
import '@/styles/morpheusTransitions.css';

export default function PortalCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef(null);
  const portalRef = useRef(new PortalTransition({ duration: 800 }));

  const sections = [
    {
      title: 'Thermal Intelligence',
      description: 'Detect anomalies 72 hours early',
      icon: '🌡️',
      color: 'rgba(0, 180, 216, 0.1)',
    },
    {
      title: 'LiDAR Precision',
      description: '2.4M points per second mapping',
      icon: '📡',
      color: 'rgba(0, 100, 180, 0.1)',
    },
    {
      title: 'Real-time Analytics',
      description: 'Instant data processing',
      icon: '⚡',
      color: 'rgba(0, 150, 200, 0.1)',
    },
  ];

  const handleNext = async () => {
    if (sectionRef.current) {
      await portalRef.current.applyPortal(sectionRef.current, 'forward');
      setActiveIndex((prev) => (prev + 1) % sections.length);
    }
  };

  const current = sections[activeIndex];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
      <h2 style={{ color: '#00e5ff', marginBottom: '40px', textAlign: 'center' }}>
        Portal Carousel
      </h2>

      <div
        ref={sectionRef}
        style={{
          background: current.color,
          border: '2px solid rgba(0, 180, 216, 0.4)',
          borderRadius: '12px',
          padding: '60px 40px',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.8s ease',
        }}
        key={activeIndex}
      >
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>
          {current.icon}
        </div>
        <h3 style={{ color: '#00e5ff', fontSize: '24px', marginBottom: '12px' }}>
          {current.title}
        </h3>
        <p style={{ color: '#8b949e', fontSize: '16px' }}>
          {current.description}
        </p>
      </div>

      <button
        onClick={handleNext}
        style={{
          marginTop: '40px',
          padding: '12px 32px',
          fontSize: '14px',
          color: '#00e5ff',
          background: 'rgba(0, 180, 216, 0.1)',
          border: '2px solid rgba(0, 180, 216, 0.5)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          width: '100%',
        }}
      >
        Next Portal →
      </button>

      <div style={{ marginTop: '20px', textAlign: 'center', color: '#8b949e' }}>
        {activeIndex + 1} / {sections.length}
      </div>
    </div>
  );
}
```

**Usage:**
```jsx
import PortalCarousel from '@/components/PortalCarousel';

export default function App() {
  return <PortalCarousel />;
}
```

---

## SNIPPET 3: Liquid Glass Morphing States

**File:** `/src/components/LiquidGlass.jsx`

```jsx
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { GlassShatterEffect } from '@/utils/advancedTransitions';
import '@/styles/morpheusTransitions.css';

export default function LiquidGlass() {
  const [state, setState] = useState('liquid');
  const [isAnimating, setIsAnimating] = useState(false);
  const glassRef = useRef(null);
  const effectRef = useRef(new GlassShatterEffect({ duration: 800 }));

  const states = {
    liquid: {
      label: 'LIQUID',
      desc: 'Flowing freely',
      color: 'rgba(0, 180, 216, 0.2)',
      border: 'rgba(0, 180, 216, 0.6)',
      size: '200px',
    },
    crystal: {
      label: 'CRYSTAL',
      desc: 'Solidified form',
      color: 'rgba(0, 100, 180, 0.2)',
      border: 'rgba(0, 100, 180, 0.8)',
      size: '240px',
    },
    reformed: {
      label: 'REFORMED',
      desc: 'Reconstructed',
      color: 'rgba(100, 180, 216, 0.2)',
      border: 'rgba(100, 180, 216, 0.8)',
      size: '220px',
    },
  };

  const handleMorph = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const stateKeys = Object.keys(states);
    const nextIdx = (stateKeys.indexOf(state) + 1) % stateKeys.length;

    if (glassRef.current) {
      await effectRef.current.shatter(glassRef.current);
    }

    setState(stateKeys[nextIdx]);
    setIsAnimating(false);
  };

  const current = states[state];

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
      <h2 style={{ color: '#00e5ff', marginBottom: '40px', textAlign: 'center' }}>
        Liquid Glass Morphing
      </h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          ref={glassRef}
          key={state}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            width: current.size,
            height: current.size,
            background: current.color,
            border: `3px solid ${current.border}`,
            borderRadius: state === 'crystal' ? '0%' : '50%',
            backdropFilter: 'blur(10px)',
            boxShadow: `0 0 60px ${current.border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            textAlign: 'center',
            padding: '20px',
            transition: 'all 0.8s ease',
          }}
        >
          <div style={{ fontSize: '48px', fontWeight: '900' }}>◆</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#00e5ff' }}>
            {current.label}
          </div>
          <div style={{ fontSize: '13px', color: '#8b949e' }}>
            {current.desc}
          </div>
        </motion.div>
      </div>

      <button
        onClick={handleMorph}
        disabled={isAnimating}
        style={{
          marginTop: '40px',
          padding: '12px 32px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#00e5ff',
          background: 'rgba(0, 180, 216, 0.1)',
          border: '2px solid rgba(0, 180, 216, 0.5)',
          borderRadius: '8px',
          cursor: isAnimating ? 'not-allowed' : 'pointer',
          opacity: isAnimating ? 0.6 : 1,
          width: '100%',
        }}
      >
        {isAnimating ? 'MORPHING...' : 'MORPH STATE'}
      </button>
    </div>
  );
}
```

**Usage:**
```jsx
import LiquidGlass from '@/components/LiquidGlass';

export default function App() {
  return <LiquidGlass />;
}
```

---

## SNIPPET 4: Page Navigation with Transitions

**File:** `/src/hooks/useNavigationTransition.js`

```jsx
import { useCallback, useState } from 'react';
import { ViewTransition, MorphingEasings } from '@/utils/advancedTransitions';

export function useNavigationTransition(transitionType = 'portal') {
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateTo = useCallback(async (path) => {
    setIsNavigating(true);

    const easing =
      MorphingEasings[`${transitionType}Morph`] ||
      MorphingEasings.liquidMorph;

    try {
      await ViewTransition.execute(
        () => {
          window.location.href = path;
        },
        {
          duration: 600,
          easing,
        }
      );
    } catch (error) {
      console.error('Navigation failed:', error);
      window.location.href = path;
    }
  }, [transitionType]);

  return { navigateTo, isNavigating };
}

// Usage in Navigation component:
export function Navigation() {
  const { navigateTo, isNavigating } = useNavigationTransition('portal');

  return (
    <nav>
      <button
        onClick={() => navigateTo('/about')}
        disabled={isNavigating}
        style={{ opacity: isNavigating ? 0.6 : 1 }}
      >
        About
      </button>
      <button
        onClick={() => navigateTo('/services')}
        disabled={isNavigating}
      >
        Services
      </button>
    </nav>
  );
}
```

---

## SNIPPET 5: Scroll-Triggered Element Morphing

**File:** `/src/hooks/useScrollMorphElement.js`

```jsx
import { useEffect, useRef } from 'react';
import { ScrollMorph, MorphingEasings } from '@/utils/advancedTransitions';

export function useScrollMorphElement(morphConfig = {}) {
  const ref = useRef(null);
  const unregisterRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    unregisterRef.current = ScrollMorph.register(ref.current, {
      threshold: 0.3,
      fromState: {
        opacity: '0',
        transform: 'translateY(40px)',
      },
      toState: {
        opacity: '1',
        transform: 'translateY(0px)',
      },
      duration: 800,
      easing: MorphingEasings.liquidMorph,
      ...morphConfig,
    });

    return () => {
      if (unregisterRef.current) {
        unregisterRef.current();
      }
      ScrollMorph.cleanup();
    };
  }, [morphConfig]);

  return ref;
}

// Usage in component:
export function ScrollSection() {
  const morphRef = useScrollMorphElement({
    fromState: { opacity: '0', transform: 'scale(0.8)' },
    toState: { opacity: '1', transform: 'scale(1)' },
  });

  return (
    <section ref={morphRef}>
      <h2>This morphs when you scroll into view!</h2>
    </section>
  );
}
```

---

## SNIPPET 6: Complete Integration Example

**File:** `/src/pages/TransitionsDemo.jsx`

```jsx
import { Suspense, lazy } from 'react';
import '@/styles/morpheusTransitions.css';

const AsciiToRendered = lazy(() => import('@/components/AsciiToRendered'));
const PortalCarousel = lazy(() => import('@/components/PortalCarousel'));
const LiquidGlass = lazy(() => import('@/components/LiquidGlass'));

export default function TransitionsDemo() {
  return (
    <div style={{ background: '#0d1117', color: '#f0f6fc', minHeight: '100vh' }}>
      <header
        style={{
          textAlign: 'center',
          padding: '60px 20px 40px',
          background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, transparent 100%)',
        }}
      >
        <h1
          style={{
            fontSize: '48px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #00e5ff 0%, #00b4d8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '12px',
          }}
        >
          MORPHEUS Transitions
        </h1>
        <p style={{ fontSize: '18px', color: '#8b949e' }}>
          Reality-bending page transitions with View Transitions API
        </p>
      </header>

      <main>
        <Suspense
          fallback={
            <div style={{ textAlign: 'center', padding: '40px' }}>
              Loading transitions...
            </div>
          }
        >
          <div style={{ borderTop: '1px solid rgba(0, 180, 216, 0.1)', paddingTop: '60px' }}>
            <AsciiToRendered />
          </div>

          <div style={{ borderTop: '1px solid rgba(0, 180, 216, 0.1)', paddingTop: '60px', marginTop: '60px' }}>
            <PortalCarousel />
          </div>

          <div style={{ borderTop: '1px solid rgba(0, 180, 216, 0.1)', paddingTop: '60px', marginTop: '60px', paddingBottom: '60px' }}>
            <LiquidGlass />
          </div>
        </Suspense>
      </main>
    </div>
  );
}
```

---

## SNIPPET 7: CSS-Only Implementation

For browsers without View Transitions API, use these CSS classes:

```html
<!-- ASCII to Rendered -->
<div class="transition-ascii">ASCII Art Here</div>

<!-- Portal Effect -->
<div class="transition-portal">Portal Content</div>

<!-- Glass Shatter -->
<div class="transition-glass">Glass Content</div>

<!-- Liquid Morph -->
<div class="transition-liquid">Morphing Content</div>

<!-- Quantum Effect -->
<div class="transition-quantum">Quantum Content</div>

<!-- Reality Distort -->
<div class="transition-distort">Reality Content</div>

<!-- Elastic Bounce -->
<div class="transition-elastic">Elastic Content</div>

<!-- Dimensional Fold -->
<div class="transition-fold">Fold Content</div>

<!-- Chrono Distort -->
<div class="transition-chrono">Temporal Content</div>
```

---

## SNIPPET 8: TypeScript Version

**File:** `/src/utils/advancedTransitions.ts`

```typescript
interface TransitionOptions {
  duration?: number;
  easing?: (t: number) => number;
  name?: string;
}

interface MorphConfig {
  threshold?: number;
  fromState?: Record<string, string>;
  toState?: Record<string, string>;
  duration?: number;
}

export async function executeTransition(
  callback: () => void,
  options: TransitionOptions = {}
): Promise<void> {
  const {
    duration = 600,
    easing = liquidMorph,
    name = 'default',
  } = options;

  if ('startViewTransition' in document) {
    return new Promise((resolve) => {
      document.startViewTransition(() => {
        callback();
        setTimeout(resolve, duration);
      });
    });
  }

  callback();
  return Promise.resolve();
}

// ... rest of type definitions
```

---

## Installation Instructions

1. **Copy files to your project:**
   ```bash
   cp src/utils/advancedTransitions.js your-project/src/utils/
   cp src/styles/morpheusTransitions.css your-project/src/styles/
   cp src/hooks/useMorpheusTransition.js your-project/src/hooks/
   ```

2. **Import in your app:**
   ```jsx
   import '@/styles/morpheusTransitions.css';
   import { ViewTransition } from '@/utils/advancedTransitions';
   ```

3. **Use in components:**
   ```jsx
   const { execute } = useMorphTransition();
   await execute(() => updateDOM());
   ```

---

## Troubleshooting

**Q: Animations not playing?**
A: Ensure `morpheusTransitions.css` is imported at the top of your app.

**Q: Fallback not working?**
A: Check browser console for errors. Some old browsers may need polyfills.

**Q: Performance issues?**
A: Reduce `duration` values or disable animations for lower-end devices using:
```javascript
const userPrefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

---

## Support

For questions or issues, refer to:
- `MORPHEUS_IMPLEMENTATION_GUIDE.md` - Complete API documentation
- Browser DevTools - Inspect animated elements
- View Transitions API docs - https://developer.chrome.com/docs/web-platform/view-transitions/

Happy morphing! 🌀
