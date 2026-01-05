# Holographic Effects - Quick Start

## Installation (Already Done!)

All files are already in place:
- `/src/components/HolographicEffects.jsx` - React components
- `/src/components/HolographicEffects.css` - All animations
- `/src/components/HolographicFilters.svg` - SVG filters
- `/src/pages/HolographicShowcasePage.jsx` - Full demo page
- Route: `/holographic` - View the showcase

## Basic Usage

### Import
```jsx
import {
  HolographicText,
  HolographicCard,
  HolographicBeacon,
  GlitchText,
  ScanlineOverlay,
  VHSNoise,
  HolographicContainer,
} from '../components/HolographicEffects'
```

### Add to Your Page

#### 1. Holographic Text (Hero Title)
```jsx
<h1>
  <HolographicText
    text="NEXT GENERATION"
    variant="title"
  />
</h1>
```

#### 2. Card Grid
```jsx
<div className="grid">
  {features.map((f, i) => (
    <HolographicCard
      key={i}
      title={f.name}
      content={f.description}
      icon="◉"
      index={i}
    />
  ))}
</div>
```

#### 3. Beacon (Highlight)
```jsx
<HolographicBeacon
  color="#00b4d8"
  size={100}
/>
```

#### 4. Floating Box
```jsx
<HolographicContainer size="medium">
  <h3>Important Data</h3>
  <p>Content here</p>
</HolographicContainer>
```

#### 5. Interactive Button
```jsx
<GlitchText
  text="ACTIVATE SYSTEM"
  intensity={0.5}
/>
```

#### 6. Global Scanlines (Optional)
```jsx
<ScanlineOverlay opacity={0.08} speed={1} />
```

## Full Page Example

```jsx
import {
  HolographicText,
  HolographicCard,
  HolographicBeacon,
  HolographicContainer,
  ScanlineOverlay,
} from '../components/HolographicEffects'

export default function MyPage() {
  return (
    <div>
      {/* Optional: Add scanlines to entire page */}
      <ScanlineOverlay opacity={0.08} speed={1} />

      {/* Hero Section */}
      <section className="hero">
        <HolographicText
          text="ENTERPRISE SOLUTIONS"
          variant="title"
        />
        <p>Advanced holographic interface</p>
      </section>

      {/* Feature Cards */}
      <section className="features">
        <HolographicCard
          title="AI-Powered"
          content="Advanced algorithms"
          icon="◉"
          index={0}
        />
        <HolographicCard
          title="Real-Time"
          content="Instant processing"
          icon="◆"
          index={1}
        />
        <HolographicCard
          title="Secure"
          content="Enterprise grade"
          icon="◇"
          index={2}
        />
      </section>

      {/* Beacons */}
      <section className="beacons">
        <HolographicBeacon size={100} />
      </section>

      {/* Floating Data Boxes */}
      <section className="data">
        <HolographicContainer size="medium" delay={0}>
          <h3>Live Metrics</h3>
          <p>Status: ONLINE</p>
        </HolographicContainer>
      </section>
    </div>
  )
}
```

## Customization

### Change Colors
Edit `/src/components/HolographicEffects.css`:
```css
:root {
  --holo-cyan: #00b4d8;        /* Main color */
  --holo-cyan-bright: #00e5ff; /* Bright variant */
  --holo-magenta: #ff006e;     /* Accent 1 */
  --holo-yellow: #ffb703;      /* Accent 2 */
  --holo-green: #00f5a0;       /* Accent 3 */
}
```

### Change Animation Speed
```css
.holo-text {
  animation: holo-text-shift 3s ease-in-out infinite;
  /* Change 3s to your preferred duration */
}
```

### Adjust Scanline Opacity
```jsx
<ScanlineOverlay
  opacity={0.2}    /* 0 = invisible, 1 = opaque */
  speed={1}        /* 1 = normal, 0.5 = slower */
/>
```

## Component Props Reference

### HolographicText
| Prop | Type | Default | Options |
|------|------|---------|---------|
| text | string | required | Any text |
| variant | string | 'primary' | 'primary' \| 'title' |
| intensity | number | 1 | 0-1 |

### HolographicCard
| Prop | Type | Default |
|------|------|---------|
| title | string | required |
| content | string | required |
| icon | string | '◉' |
| index | number | 0 |
| delay | number | 0 |

### HolographicBeacon
| Prop | Type | Default |
|------|------|---------|
| color | string | '#00b4d8' |
| size | number | 120 |
| intensity | number | 1 |

### GlitchText
| Prop | Type | Default |
|------|------|---------|
| text | string | required |
| intensity | number | 0.5 |
| className | string | '' |

### HolographicContainer
| Prop | Type | Default | Options |
|------|------|---------|---------|
| size | string | 'medium' | 'small' \| 'medium' \| 'large' |
| delay | number | 0 | 0-2 |
| children | ReactNode | required | Any JSX |

### ScanlineOverlay
| Prop | Type | Default |
|------|------|---------|
| opacity | number | 0.15 |
| speed | number | 1 |
| color | string | 'rgba(0, 229, 255, 0.5)' |

## Common Patterns

### Hero with Beacon
```jsx
<div style={{ position: 'relative' }}>
  <HolographicText text="TITLE" variant="title" />
  <HolographicBeacon color="#00b4d8" size={80} />
</div>
```

### Grid of Effects
```jsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
  <HolographicCard title="A" content="Text" icon="◉" index={0} />
  <HolographicCard title="B" content="Text" icon="◆" index={1} />
  <HolographicCard title="C" content="Text" icon="◇" index={2} />
</div>
```

### Combined Effects
```jsx
<section>
  <ScanlineOverlay opacity={0.1} />
  <HolographicContainer>
    <HolographicText text="CONTENT" variant="primary" />
  </HolographicContainer>
</section>
```

## Viewing the Showcase

Visit: `http://localhost:5173/holographic`

This shows all effects in action with code examples.

## Performance Tips

1. **Don't use VHSNoise on mobile** - It's GPU intensive
   ```jsx
   const isMobile = window.innerWidth < 768
   {!isMobile && <VHSNoise intensity={0.05} />}
   ```

2. **Reduce scanline opacity on slower devices**
   ```jsx
   <ScanlineOverlay opacity={0.05} />
   ```

3. **Limit beacon count** - Use 1-3 per page max

4. **Stagger animations** - Prevents render jank
   ```jsx
   delay={index * 0.1}
   ```

5. **Use contain CSS**
   ```css
   .feature-card {
     contain: layout paint;
   }
   ```

## Troubleshooting

### Components not showing?
- Make sure you imported the CSS file
- Check browser console for errors
- Verify file paths are correct

### Performance issues?
- Check DevTools Performance tab
- Reduce number of simultaneous animations
- Disable VHSNoise
- Lower scanline opacity

### Colors look wrong?
- Clear browser cache
- Check CSS variable definitions
- Verify SVG filter IDs match

## Need Help?

See full documentation: `HOLOGRAPHIC_EFFECTS_GUIDE.md`

Features include:
- Detailed component descriptions
- Advanced customization
- SVG filter reference
- Browser compatibility
- Accessibility notes
- Integration examples
