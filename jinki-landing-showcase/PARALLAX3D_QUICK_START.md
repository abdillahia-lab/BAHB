# PARALLAX3D Quick Start Guide

## 5-Minute Setup

### Step 1: View the Showcase
```bash
# Navigate to the 3D showcase page
http://localhost:5173/3d
```

### Step 2: Import Components
```jsx
import {
  Parallax3DCard,
  VolumetricLightRays,
  InfiniteZoomParallax,
  TiltShiftDepthBlur,
  DepthText
} from './components/Parallax3D'

import {
  useMouseTracking,
  useDeviceOrientation,
  useDepthBlur
} from './hooks/useMouseTracking'
```

### Step 3: Add to Your Page
```jsx
import { Parallax3DCard } from './components/Parallax3D'

export function MySection() {
  return (
    <Parallax3DCard
      image="/image.jpg"
      title="My Card"
      mouseTracking={true}
      gyroTracking={true}
      isFlippable={true}
      backContent={<div>Back side</div>}
    >
      <h3>Front Content</h3>
      <p>This card has 3D depth</p>
    </Parallax3DCard>
  )
}
```

---

## Component Cheat Sheet

### Parallax3DCard
**Interactive card with 3D depth, mouse tracking, and flip**
```jsx
<Parallax3DCard
  image={string}           // Image URL
  title={string}           // Card title
  depth={number}           // Z-axis (default 0)
  isFlippable={boolean}    // Enable flip (default false)
  mouseTracking={boolean}  // Enable mouse tracking (default false)
  gyroTracking={boolean}   // Enable gyroscope (default false)
  backContent={JSX}        // Content for flip side
>
  {children}
</Parallax3DCard>
```

### VolumetricLightRays
**3D light rays with perspective distortion**
```jsx
<VolumetricLightRays intensity={0.5} />
```

### InfiniteZoomParallax
**Scales on scroll proximity**
```jsx
<InfiniteZoomParallax speed={0.5} maxZoom={1.8}>
  {children}
</InfiniteZoomParallax>
```

### TiltShiftDepthBlur
**Focus-following blur effect**
```jsx
<TiltShiftDepthBlur depth={20} blurAmount={10}>
  {children}
</TiltShiftDepthBlur>
```

### DepthText
**Stacked text with 3D perspective**
```jsx
<DepthText text="3D Text" layers={5} spacing={10} />
```

---

## Hooks Cheat Sheet

### useMouseTracking
**Track cursor for perspective shifts**
```jsx
const { containerRef, position, perspective } = useMouseTracking(0.8)
// perspective.rotateX, perspective.rotateY
```

### useDeviceOrientation
**Device gyroscope/accelerometer**
```jsx
const {
  orientation,      // { alpha, beta, gamma }
  isSupported,      // boolean
  isActive,         // boolean
  requestPermission // async function
} = useDeviceOrientation(0.6)
```

### useDepthBlur
**Calculate blur based on depth**
```jsx
const { filter, opacity } = useDepthBlur(depth, maxBlur)
```

---

## CSS Classes

Add 3D effects with utility classes:

```html
<!-- Perspective containers -->
<div class="perspective-1000">...</div>
<div class="perspective-800">...</div>

<!-- Preserve 3D style -->
<div class="preserve-3d">...</div>

<!-- Z-axis translations -->
<div class="translate-z-10">...</div>
<div class="translate-z-20">...</div>

<!-- Rotations -->
<div class="rotate-x-10">...</div>
<div class="rotate-y-10">...</div>

<!-- Depth field effects -->
<div class="depth-field-blur is-background">...</div>
<div class="depth-field-blur is-midground">...</div>

<!-- 3D Glow -->
<div class="glow-3d">...</div>
```

---

## Common Patterns

### Pattern 1: Hero Section with 3D Depth
```jsx
export function HeroSection() {
  const { containerRef, perspective } = useMouseTracking(1.0)

  return (
    <section ref={containerRef} style={{ perspective: '1200px' }}>
      <h1 style={{
        transform: `
          rotateX(${perspective.rotateX * 0.5}deg)
          rotateY(${perspective.rotateY * 0.5}deg)
        `
      }}>
        3D Hero Title
      </h1>
      <VolumetricLightRays intensity={0.6} />
    </section>
  )
}
```

### Pattern 2: Card Grid with Mouse Tracking
```jsx
export function CardGrid() {
  return (
    <div className="grid">
      {cards.map(card => (
        <Parallax3DCard
          key={card.id}
          image={card.image}
          mouseTracking={true}
          gyroTracking={true}
        >
          {card.content}
        </Parallax3DCard>
      ))}
    </div>
  )
}
```

### Pattern 3: Scroll-Triggered Zoom
```jsx
export function ZoomSection() {
  return (
    <>
      <InfiniteZoomParallax speed={0.5} maxZoom={1.8}>
        <div className="card">Zoom Content 1</div>
      </InfiniteZoomParallax>

      <InfiniteZoomParallax speed={0.3} maxZoom={1.5}>
        <div className="card">Zoom Content 2</div>
      </InfiniteZoomParallax>
    </>
  )
}
```

### Pattern 4: Mobile Responsive 3D
```jsx
export function ResponsiveCard() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <Parallax3DCard
      image="/image.jpg"
      mouseTracking={!isMobile}        // Disable on mobile
      gyroTracking={isMobile}          // Enable on mobile
      depth={isMobile ? 0 : -40}      // Adjust for mobile
    >
      Content
    </Parallax3DCard>
  )
}
```

---

## Performance Tuning

### For Desktop
```jsx
<Parallax3DCard
  mouseTracking={1.0}    // High sensitivity
  gyroTracking={false}   // Disable
  depth={-40}            // Full depth
/>
```

### For Mobile
```jsx
<Parallax3DCard
  mouseTracking={false}  // Disable (touch doesn't work well)
  gyroTracking={true}    // Use gyroscope
  depth={0}              // Reduce depth
/>
```

### For Low-End Devices
```jsx
<InfiniteZoomParallax speed={0.2} maxZoom={1.2}>
  {/* Lower speed and zoom */}
</InfiniteZoomParallax>
```

---

## Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| 3D effects not visible | Add `perspective` to parent |
| Mouse tracking doesn't work | Attach `containerRef` to element |
| Gyroscope not responding | Ensure HTTPS + user interaction |
| Performance laggy | Reduce `mouseTracking` sensitivity |
| Blurry on mobile | Lower `gyroTracking` sensitivity |
| Elements disappearing | Adjust `depth` values (0 to -200) |

---

## Next Steps

1. ✅ View showcase: `/3d`
2. ✅ Copy component code
3. ✅ Adjust sensitivity values
4. ✅ Test on mobile devices
5. ✅ Check accessibility
6. ✅ Profile performance

---

## Examples in This Project

- **Full Showcase**: `/src/pages/Parallax3DShowcase.jsx`
- **Components**: `/src/components/Parallax3D.jsx`
- **Hooks**: `/src/hooks/useMouseTracking.js`
- **Integration**: Add to `/src/pages/LandingPage3.jsx`

---

## File Locations

```
src/
├── hooks/
│   └── useMouseTracking.js      ← Hooks
├── components/
│   ├── Parallax3D.jsx           ← Components
│   └── Parallax3D.css           ← Styles
└── pages/
    ├── Parallax3DShowcase.jsx   ← Full page
    └── Parallax3DShowcase.css
```

**Route**: `/3d` → Parallax3DShowcase page

---

## Browser DevTools Tips

### Check 3D Transform Support
```javascript
// In console:
CSS.supports('transform', 'translateZ(0)')  // true/false
CSS.supports('transform-style', 'preserve-3d') // true/false
```

### Performance Profiling
1. Open DevTools → Performance tab
2. Record interaction
3. Look for:
   - FPS drops
   - Long frames (>16ms)
   - GPU-accelerated transforms

### Mobile Testing
- Use Chrome DevTools device emulation
- Test gyroscope with: Device → Sensors → [select device]
- Check Lighthouse for accessibility

---

**Ready to create 3D magic? View `/3d` now!**
