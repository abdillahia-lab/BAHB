/**
 * QUICK INTEGRATION GUIDE
 * Copy these exact changes to LandingPage3.jsx
 */

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: Add import at the top (line 3)
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react'
import './LandingPage3.css'
import Preloader from '../components/Preloader'  // ← ADD THIS LINE

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: Add state variable (around line 9)
// ═══════════════════════════════════════════════════════════════════════════

export default function LandingPage3() {
  const [navSolid, setNavSolid] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [pageLoaded, setPageLoaded] = useState(false)
  const [showPreloader, setShowPreloader] = useState(true)  // ← ADD THIS LINE

  const videoRef = useRef(null)
  // ... rest of your code

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: Wrap return statement (around line 78)
// ═══════════════════════════════════════════════════════════════════════════

  return (
    <>
      {/* ─── CINEMATIC PRELOADER ─── */}
      {showPreloader && (
        <Preloader onComplete={() => setShowPreloader(false)} />
      )}

      {/* ─── MAIN PAGE CONTENT (your existing code) ─── */}
      <div className={`page ${pageLoaded ? 'page--loaded' : 'page--loading'}`}>
        {/* Scroll Progress Indicator */}
        <div className="scroll-progress" ref={scrollProgressRef} />

        {/* NAVIGATION */}
        <header className={`nav ${navSolid ? 'nav--glass' : ''}`}>
          {/* ... all your existing nav code ... */}
        </header>

        {/* HERO */}
        <section className="hero" ref={heroRef}>
          {/* ... all your existing hero code ... */}
        </section>

        {/* ... rest of your sections ... */}
      </div>
    </>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// THAT'S IT! Three changes:
// 1. Import Preloader
// 2. Add showPreloader state
// 3. Wrap return with <> and add Preloader component
// ═══════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════
// OPTIONAL: Prevent body scroll during preloader
// ═══════════════════════════════════════════════════════════════════════════

// Add this useEffect if you want to prevent scrolling during preloader:

useEffect(() => {
  if (showPreloader) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }

  return () => {
    document.body.style.overflow = ''
  }
}, [showPreloader])


// ═══════════════════════════════════════════════════════════════════════════
// TESTING
// ═══════════════════════════════════════════════════════════════════════════

// To test the preloader multiple times without refreshing:
// 1. Open React DevTools
// 2. Find the LandingPage3 component
// 3. Toggle the showPreloader state to true

// Or add this temporary button for development:
/*
<button
  style={{
    position: 'fixed',
    bottom: 20,
    right: 20,
    zIndex: 10001,
    padding: '10px 20px',
    background: '#06b6d4',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }}
  onClick={() => setShowPreloader(true)}
>
  Show Preloader
</button>
*/


// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMIZE LOADING DURATION
// ═══════════════════════════════════════════════════════════════════════════

// In Preloader.jsx, line 18:
const MINIMUM_DURATION = 2500  // milliseconds

// Change to:
// 2000 = 2 seconds (faster)
// 3000 = 3 seconds (dramatic)
// 4000 = 4 seconds (very dramatic)


// ═══════════════════════════════════════════════════════════════════════════
// ANIMATIONS INCLUDED
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LOGO ANIMATIONS:
 * - Outer ring: 8s counter-clockwise spin
 * - Middle ring: 5s clockwise spin
 * - Inner ring: 3s counter-clockwise spin
 * - Center dot: 2s pulsing (scale 1.0 → 1.2)
 * - Crosshairs: 3s fade in/out
 * - Scan ring: 2.5s expanding pulse
 *
 * PROGRESS BAR:
 * - Liquid metal shimmer (15-stop gradient)
 * - Gleam sweep effect
 * - Smooth width transition
 * - Enhanced glow at 100%
 *
 * PERCENTAGE:
 * - Tabular numbers (fixed width)
 * - Smooth count-up
 * - Scale bounce at 100%
 * - Color change at completion
 *
 * STATUS TEXT:
 * - Changes based on progress:
 *   0-30%: "Initializing systems..."
 *   30-60%: "Loading surveillance assets..."
 *   60-90%: "Establishing secure connection..."
 *   90-100%: "Finalizing..."
 *   100%: "Ready"
 *   Exiting: "Launching..."
 *
 * EXIT ANIMATION:
 * - 1.2s scale up (1.0 → 1.15) + fade out
 * - Content scales up to 1.3x
 * - Smooth cinematic reveal
 */


// ═══════════════════════════════════════════════════════════════════════════
// ASSET PRELOADING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Currently preloads:
 * 1. Hero video (Pexels video)
 * 2. DM Sans font family
 *
 * Progress calculation:
 * - Simulated progress: Smooth incremental updates (0-90%)
 * - Real progress: Actual asset loading updates progress
 * - Uses Math.max() to ensure progress never goes backward
 * - Completes at 100% after all assets + minimum duration
 */


// ═══════════════════════════════════════════════════════════════════════════
// BROWSER COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * FULLY SUPPORTED:
 * ✅ Chrome 90+ (Desktop & Mobile)
 * ✅ Firefox 88+
 * ✅ Safari 14+ (Desktop & iOS)
 * ✅ Edge 90+
 * ✅ Opera 76+
 * ✅ Samsung Internet 15+
 *
 * FEATURES:
 * ✅ CSS animations & keyframes
 * ✅ CSS gradients (multi-stop)
 * ✅ Backdrop-filter (glassmorphism)
 * ✅ SVG animations
 * ✅ Async/await
 * ✅ CSS Grid & Flexbox
 * ✅ CSS custom properties
 *
 * GRACEFUL DEGRADATION:
 * - Older browsers show static logo without rotation
 * - Progress bar still works without shimmer
 * - Fallback fonts if DM Sans fails to load
 */


// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE NOTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GPU ACCELERATION:
 * All animated elements use:
 * - transform: translateZ(0)
 * - will-change: transform
 * - backface-visibility: hidden
 *
 * PAINT OPTIMIZATION:
 * - Separate layers for each animated element
 * - No repaints during animations (only composite)
 * - Fixed positioning prevents layout thrashing
 *
 * MEMORY:
 * - Preloader unmounts completely after exit
 * - Video element only loads metadata (not full video)
 * - No memory leaks (cleanup in useEffect)
 *
 * BUNDLE SIZE:
 * - Preloader.jsx: ~7KB
 * - Preloader.css: ~10KB
 * - Total: ~17KB (minified ~8KB)
 */


// ═══════════════════════════════════════════════════════════════════════════
// DESIGN DECISIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * WHY 2.5 SECONDS MINIMUM?
 * - Gives users time to appreciate the animation
 * - Establishes brand presence
 * - Feels premium (like movie studio intros)
 * - Fast networks would skip too quickly otherwise
 *
 * WHY SCALE UP EXIT?
 * - Creates sense of "entering" the experience
 * - Mimics camera dolly/zoom effect
 * - More dramatic than simple fade
 * - Apple-style reveal aesthetic
 *
 * WHY LIQUID METAL PROGRESS BAR?
 * - Matches existing site design language
 * - More interesting than solid color
 * - Tech/defense contractor aesthetic
 * - High-end feel (not generic loading bar)
 *
 * WHY ROTATING RINGS?
 * - Represents radar/targeting systems
 * - Shows activity during loading
 * - Creates visual interest
 * - Reinforces aerial surveillance theme
 *
 * WHY TABULAR NUMBERS?
 * - Prevents layout shift as numbers change
 * - Professional/technical appearance
 * - Easier to track progress visually
 * - Matches military/aerospace design language
 */


// ═══════════════════════════════════════════════════════════════════════════
// END OF QUICK INTEGRATION GUIDE
// ═══════════════════════════════════════════════════════════════════════════
