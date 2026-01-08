# Cinematic Preloader Integration Guide

## Overview

This preloader creates a movie studio-grade loading experience featuring:
- **Animated Jinki logo** with rotating concentric rings and pulsing center
- **Liquid metal progress bar** with shimmer and gleam effects
- **Real-time percentage counter** with smooth number transitions
- **Asset preloading** for video and fonts
- **Dramatic exit animation** (scale up + fade out)
- **2.5-second minimum display** for cinematic impact

---

## Files Created

1. `/home/user/BAHB/jinki-landing-showcase/src/components/Preloader.jsx`
2. `/home/user/BAHB/jinki-landing-showcase/src/components/Preloader.css`

---

## Integration Steps

### Step 1: Import the Preloader in LandingPage3.jsx

Add this import at the top of the file:

```jsx
import Preloader from '../components/Preloader'
```

### Step 2: Add Preloader State

Add a new state variable to track preloader completion:

```jsx
const [showPreloader, setShowPreloader] = useState(true)
```

Your state section should now look like:

```jsx
const [navSolid, setNavSolid] = useState(false)
const [videoLoaded, setVideoLoaded] = useState(false)
const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
const [scrollProgress, setScrollProgress] = useState(0)
const [pageLoaded, setPageLoaded] = useState(false)
const [showPreloader, setShowPreloader] = useState(true)  // NEW
```

### Step 3: Add Preloader Component to JSX

Replace the existing `return` statement with:

```jsx
return (
  <>
    {/* Preloader - shows first, then reveals page */}
    {showPreloader && (
      <Preloader onComplete={() => setShowPreloader(false)} />
    )}

    <div className={`page ${pageLoaded ? 'page--loaded' : 'page--loading'}`}>
      {/* ... rest of your existing JSX ... */}
    </div>
  </>
)
```

### Step 4: Modify Page Load Logic (Optional)

If you want the page entrance animations to trigger AFTER the preloader exits, modify the useEffect:

```jsx
useEffect(() => {
  // Page load entrance sequence - wait for preloader
  const loadTimer = setTimeout(() => {
    if (!showPreloader) {
      setPageLoaded(true)
    }
  }, 100)

  // ... rest of useEffect
}, [showPreloader])  // Add showPreloader as dependency
```

---

## Complete Modified LandingPage3.jsx

Here's the full modified code showing all integration points:

```jsx
import { useEffect, useState, useRef } from 'react'
import './LandingPage3.css'
import Preloader from '../components/Preloader'  // NEW IMPORT

export default function LandingPage3() {
  const [navSolid, setNavSolid] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [pageLoaded, setPageLoaded] = useState(false)
  const [showPreloader, setShowPreloader] = useState(true)  // NEW STATE

  const videoRef = useRef(null)
  const heroRef = useRef(null)
  const scrollProgressRef = useRef(null)

  useEffect(() => {
    // Page load entrance sequence
    const loadTimer = setTimeout(() => setPageLoaded(true), 100)

    // ... rest of your existing useEffect code
  }, [])

  const heroTransform = {
    transform: `perspective(1200px) rotateY(${mousePos.x * 3}deg) rotateX(${-mousePos.y * 3}deg)`
  }

  return (
    <>
      {/* CINEMATIC PRELOADER */}
      {showPreloader && (
        <Preloader onComplete={() => setShowPreloader(false)} />
      )}

      {/* MAIN PAGE CONTENT */}
      <div className={`page ${pageLoaded ? 'page--loaded' : 'page--loading'}`}>
        {/* ... all your existing JSX ... */}
      </div>
    </>
  )
}
```

---

## Customization Options

### Adjust Loading Duration

In `Preloader.jsx`, line 18:

```jsx
const MINIMUM_DURATION = 2500  // Change to 3000 for 3 seconds
```

### Modify Progress Speed

In `Preloader.jsx`, line 35:

```jsx
simulatedProgress += Math.random() * 8  // Increase for faster progress
```

### Add More Assets to Preload

In `Preloader.jsx`, add to the `assetsToLoad` array:

```jsx
const assetsToLoad = [
  {
    type: 'video',
    url: 'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4'
  },
  {
    type: 'font',
    family: 'DM Sans',
    weight: '300 900'
  },
  // Add your custom assets:
  {
    type: 'image',
    url: '/path/to/your/image.jpg'
  }
]
```

Then add the image loading function:

```jsx
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = resolve
    img.onerror = () => {
      console.warn('Image preload failed, continuing...')
      resolve()
    }
    img.src = url
  })
}
```

And in the loading loop:

```jsx
if (asset.type === 'video') {
  await loadVideo(asset.url)
} else if (asset.type === 'font') {
  await loadFont(asset.family, asset.weight)
} else if (asset.type === 'image') {
  await loadImage(asset.url)
}
```

### Change Colors

In `Preloader.css`, modify the color variables:

```css
/* Change cyan accent color */
color: #06b6d4;  /* Replace with your preferred color */

/* Change the liquid metal gradient */
background: linear-gradient(
  90deg,
  #E8E8E8 0%,
  #YOUR_COLOR 8%,
  /* ... */
);
```

---

## Animation Details

### Logo Animations

- **Outer ring**: 8s counter-clockwise rotation
- **Middle ring**: 5s clockwise rotation
- **Inner ring**: 3s counter-clockwise rotation
- **Center dot**: 2s pulsing scale (1.0 to 1.2)
- **Scan ring**: 2.5s expanding pulse effect

### Progress Bar

- **Liquid metal shimmer**: 2s infinite horizontal sweep
- **Gleam effect**: 2.5s sweeping highlight
- **Complete state**: Enhanced glow with vertical scale bounce

### Exit Animation

- **Duration**: 1.2s
- **Effect**: Scale from 1.0 to 1.15 with fade out
- **Easing**: `cubic-bezier(0.19, 1, 0.22, 1)` (smooth ease-out)

---

## Accessibility Features

### Reduced Motion Support

The preloader respects `prefers-reduced-motion: reduce`:
- All spinning/rotating animations are disabled
- Only opacity transitions remain
- Shorter exit duration (0.6s instead of 1.2s)

### Keyboard Navigation

The preloader is not interactive, so no keyboard navigation is needed. It automatically exits after loading.

### Screen Readers

The preloader uses semantic HTML with descriptive text:
- Status messages update as loading progresses
- Percentage is announced through changing DOM content

---

## Performance Optimization

### GPU Acceleration

All animated elements use:
- `transform: translateZ(0)` - Forces GPU layer
- `will-change: transform` - Prepares browser for animations
- `backface-visibility: hidden` - Prevents flickering

### Asset Loading Strategy

1. **Parallel loading** - All assets load simultaneously
2. **Graceful degradation** - Failed assets don't block the preloader
3. **Smart progress** - Simulated progress for smooth UX, real progress for accuracy
4. **Minimum duration** - Ensures dramatic reveal even with fast connections

---

## Troubleshooting

### Preloader doesn't show

**Check**: Make sure `showPreloader` initial state is `true`

```jsx
const [showPreloader, setShowPreloader] = useState(true)  // Not false!
```

### Preloader never exits

**Check**: Console for asset loading errors

```jsx
// In Preloader.jsx, check the console logs
console.log('Asset loaded:', asset)
console.log('Progress:', progress)
```

### Page content visible behind preloader

**Check**: Preloader z-index in CSS

```css
.preloader {
  z-index: 10000;  /* Should be higher than nav (1000) */
}
```

### Animations not smooth

**Check**: Hardware acceleration

```css
.preloader__content {
  transform: translateZ(0);
  will-change: transform;
}
```

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 90+)

**Fallback**: On older browsers, the preloader still works but with reduced visual effects.

---

## Example Usage Scenarios

### Scenario 1: Skip Preloader in Development

```jsx
const isDevelopment = process.env.NODE_ENV === 'development'
const [showPreloader, setShowPreloader] = useState(!isDevelopment)
```

### Scenario 2: Show Preloader Only on First Visit

```jsx
const [showPreloader, setShowPreloader] = useState(() => {
  return !sessionStorage.getItem('visited')
})

// In onComplete callback:
onComplete={() => {
  sessionStorage.setItem('visited', 'true')
  setShowPreloader(false)
}}
```

### Scenario 3: Track Analytics

```jsx
<Preloader
  onComplete={() => {
    // Track loading completion
    analytics.track('preloader_complete', {
      duration: Date.now() - startTime
    })
    setShowPreloader(false)
  }}
/>
```

---

## Design Philosophy

This preloader embodies:

1. **Movie studio intro** - Dramatic reveal with minimum 2.5s display time
2. **Apple product reveal** - Clean, minimal, sophisticated animations
3. **Defense contractor software** - Technical precision with the targeting reticle logo

The concentric circles logo represents:
- **Surveillance systems** - Targeting and tracking
- **Precision** - Multiple layers of detection
- **Technology** - Sophisticated, high-end systems

---

## Next Steps

1. ✅ Import and integrate the preloader
2. ✅ Test on various devices and browsers
3. ✅ Adjust timing to your preference
4. ✅ Customize colors to match your brand
5. ✅ Add analytics tracking (optional)
6. ✅ Test with slow network throttling

---

**Questions?** Check the inline code comments in both files for detailed explanations of each animation and feature.
