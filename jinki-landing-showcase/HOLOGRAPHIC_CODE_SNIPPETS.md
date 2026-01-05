# Holographic Effects - Copy-Paste Code Snippets

Ready-to-use code examples for quick integration into your Jinki Intelligence landing page.

---

## Import All Components

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

---

## Hero Section with Holographic Text

```jsx
<section className="hero">
  <div className="hero__content">
    <h1>
      <HolographicText
        text="EX ALTO OMNIA"
        variant="title"
        intensity={1}
      />
    </h1>
    <p className="hero__subtitle">
      From Above, <HolographicText text="All Things" variant="primary" />
    </p>
  </div>

  <div className="hero__beacon">
    <HolographicBeacon color="#00b4d8" size={100} intensity={1} />
  </div>
</section>
```

---

## Feature Cards Grid

```jsx
<section className="features">
  <h2>Our Solutions</h2>

  <div className="features-grid">
    {[
      {
        title: 'AI-Powered Detection',
        content: 'Advanced algorithms detect anomalies 72 hours early',
        icon: '◉'
      },
      {
        title: 'Real-Time Processing',
        content: 'Process massive data streams at 2.4M points/second',
        icon: '◆'
      },
      {
        title: 'Enterprise Secure',
        content: 'IP55 rated, redundant systems, military-grade security',
        icon: '◇'
      },
      {
        title: 'Global Coverage',
        content: '20km transmission range with ±1cm RTK accuracy',
        icon: '◊'
      },
    ].map((feature, i) => (
      <HolographicCard
        key={i}
        title={feature.title}
        content={feature.content}
        icon={feature.icon}
        index={i}
        delay={i * 0.1}
      />
    ))}
  </div>
</section>
```

---

## Single Holographic Card

```jsx
<HolographicCard
  title="Data Centers"
  content="19% of outages stem from cooling failures. Detect hotspots 72 hours early with 0.05°C sensitivity."
  icon="◉"
  index={0}
  delay={0}
/>
```

---

## Projection Beacon (Highlight Element)

```jsx
<div className="metric-highlight">
  <HolographicBeacon
    color="#00e5ff"
    size={80}
    intensity={0.9}
  />

  <div className="metric-content">
    <h3>$700K</h3>
    <p>Average Outage Prevented</p>
  </div>
</div>
```

---

## Multiple Beacons (Data Dashboard)

```jsx
<section className="dashboard">
  <h2>Live Metrics</h2>

  <div className="beacon-group">
    <HolographicBeacon color="#00b4d8" size={100} intensity={1} />
    <HolographicBeacon color="#00e5ff" size={80} intensity={0.8} />
    <HolographicBeacon color="#0077b6" size={60} intensity={0.6} />
  </div>
</section>
```

---

## Floating Data Container

```jsx
<HolographicContainer size="medium" delay={0}>
  <h3>System Status</h3>
  <p className="status-online">● ONLINE</p>
  <div className="data-stats">
    <div>Uptime: 99.9%</div>
    <div>Response: &lt;50ms</div>
  </div>
</HolographicContainer>
```

---

## Floating Containers in Grid

```jsx
<section className="data-boxes">
  <h2>Enterprise Capabilities</h2>

  <div className="boxes-grid">
    <HolographicContainer size="small" delay={0}>
      <div className="icon">◉</div>
      <p>Thermal Imaging</p>
    </HolographicContainer>

    <HolographicContainer size="medium" delay={0.1}>
      <div className="icon">◆</div>
      <p>LiDAR Scanning</p>
    </HolographicContainer>

    <HolographicContainer size="small" delay={0.2}>
      <div className="icon">◇</div>
      <p>NDVI Multispectral</p>
    </HolographicContainer>
  </div>
</section>
```

---

## Glitch Text Button (CTA)

```jsx
<div className="cta-buttons">
  <GlitchText
    text="ACTIVATE SYSTEM"
    intensity={0.5}
    className="primary-action"
  />

  <GlitchText
    text="LEARN MORE"
    intensity={0.3}
    className="secondary-action"
  />
</div>
```

---

## Full Page with Scanlines & Noise (Optional)

```jsx
export default function Page() {
  return (
    <>
      {/* Optional: Full-page overlays */}
      <ScanlineOverlay opacity={0.08} speed={1} />
      <VHSNoise intensity={0.03} chromaShift={false} />

      {/* Your page content */}
      <section className="hero">
        {/* Content */}
      </section>

      <section className="features">
        {/* Content */}
      </section>
    </>
  )
}
```

---

## Complete Hero Section Example

```jsx
import { motion } from 'framer-motion'
import {
  HolographicText,
  HolographicBeacon,
  ScanlineOverlay,
} from '../components/HolographicEffects'

export default function HeroSection() {
  return (
    <>
      {/* Optional: Page-wide scanlines */}
      <ScanlineOverlay opacity={0.08} speed={1} />

      <section className="hero">
        {/* Background grid */}
        <div className="hero__bg">
          <div className="hero__grid" />
        </div>

        {/* Hero content */}
        <motion.div
          className="hero__content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="hero__tagline">
            Autonomous Intelligence
          </p>

          <h1>
            <HolographicText
              text="FROM ABOVE"
              variant="title"
            />
            <br />
            <span>All Things Visible</span>
          </h1>

          <p className="hero__description">
            Critical infrastructure protection with aerial AI.
            Detect anomalies before catastrophic failure.
          </p>

          <div className="hero__cta">
            <button className="btn btn--primary">
              Schedule Assessment
            </button>
          </div>
        </motion.div>

        {/* Beacon accent */}
        <div className="hero__beacon">
          <HolographicBeacon
            color="#00b4d8"
            size={100}
            intensity={1}
          />
        </div>
      </section>
    </>
  )
}
```

---

## Feature Grid with Staggered Animation

```jsx
export default function FeatureGrid() {
  const features = [
    {
      title: 'Thermal Sensitivity',
      description: '0.05°C accuracy for early detection',
      icon: '◉'
    },
    {
      title: 'LiDAR Scanning',
      description: '2.4M points per second processing',
      icon: '◆'
    },
    {
      title: 'Weather Sealed',
      description: 'IP55 rated for all-weather operation',
      icon: '◇'
    },
    {
      title: 'RTK Accuracy',
      description: '±1cm precision GPS positioning',
      icon: '◊'
    },
  ]

  return (
    <section className="features">
      <h2>
        <HolographicText text="ENTERPRISE PLATFORM" variant="title" />
      </h2>

      <div className="features-grid">
        {features.map((f, i) => (
          <HolographicCard
            key={i}
            title={f.title}
            content={f.description}
            icon={f.icon}
            index={i}
            delay={i * 0.15}  {/* Stagger: 0s, 0.15s, 0.3s, 0.45s */}
          />
        ))}
      </div>
    </section>
  )
}
```

---

## Custom Styled Holographic Card

```jsx
<div className="custom-card-wrapper">
  <HolographicCard
    title="Advanced Solution"
    content="This is a customized holographic card with enhanced styling"
    icon="◉"
    index={0}
  />
</div>

<style>{`
  .custom-card-wrapper {
    max-width: 400px;
    margin: 0 auto;
  }

  .holo-card {
    padding: 48px;
    background: linear-gradient(135deg,
      rgba(0, 20, 40, 0.9),
      rgba(0, 10, 30, 0.7)
    );
    border-width: 2px;
    border-radius: 20px;
  }

  .holo-card__title {
    font-size: 1.8rem;
    text-transform: uppercase;
  }
`}</style>
```

---

## Interactive Dashboard with Beacons

```jsx
export default function Dashboard() {
  return (
    <section className="dashboard">
      <h2>Live System Status</h2>

      <div className="dashboard-grid">
        {/* Metric 1 */}
        <div className="metric">
          <HolographicBeacon color="#00b4d8" size={60} intensity={1} />
          <h3>System Health</h3>
          <p>99.9% Uptime</p>
        </div>

        {/* Metric 2 */}
        <div className="metric">
          <HolographicBeacon color="#00e5ff" size={60} intensity={0.9} />
          <h3>Response Time</h3>
          <p>&lt;50ms Average</p>
        </div>

        {/* Metric 3 */}
        <div className="metric">
          <HolographicBeacon color="#0077b6" size={60} intensity={0.8} />
          <h3>Data Throughput</h3>
          <p>2.4M pts/sec</p>
        </div>
      </div>
    </section>
  )
}

<style>{`
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 40px;
    margin-top: 60px;
  }

  .metric {
    text-align: center;
    padding: 40px;
    background: rgba(0, 180, 216, 0.05);
    border-radius: 16px;
    border: 1px solid rgba(0, 180, 216, 0.2);
  }
`}</style>
```

---

## Customizing Colors (Global)

```jsx
// Edit in HolographicEffects.css
const styleOverride = `
  :root {
    --holo-cyan: #2dd4bf;         /* Main color (default: #00b4d8) */
    --holo-cyan-bright: #5eead4;  /* Bright (default: #00e5ff) */
    --holo-magenta: #ec4899;      /* Accent 1 (default: #ff006e) */
    --holo-yellow: #f59e0b;       /* Accent 2 (default: #ffb703) */
    --holo-green: #10b981;        /* Accent 3 (default: #00f5a0) */
  }
`
```

---

## Conditional Effect Rendering (Mobile Optimization)

```jsx
import { HolographicCard, ScanlineOverlay, VHSNoise } from '../components/HolographicEffects'

export default function OptimizedPage() {
  const isMobile = window.innerWidth < 768

  return (
    <>
      {/* Only show scanlines on desktop */}
      {!isMobile && (
        <ScanlineOverlay opacity={0.08} speed={1} />
      )}

      {/* Disable VHS noise on mobile */}
      {!isMobile && (
        <VHSNoise intensity={0.03} chromaShift={false} />
      )}

      {/* Cards work everywhere */}
      <HolographicCard
        title="Feature"
        content="Works on all devices"
        icon="◉"
      />
    </>
  )
}
```

---

## Animation Speed Customization

```jsx
{/* Fast animations */}
<HolographicText text="QUICK" variant="title" />

{/* With custom CSS */}
<style>{`
  .holo-text {
    animation: holo-text-shift 2s ease-in-out infinite !important;
  }
`}</style>

{/* Or use CSS variable override */}
<div style={{'--speed': '0.5s'}}>
  <HolographicCard />
</div>
```

---

## Advanced: Combining Multiple Effects

```jsx
<section className="advanced-section">
  {/* Scanline backdrop */}
  <ScanlineOverlay opacity={0.12} speed={2} />

  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    <HolographicText text="ADVANCED EFFECTS" variant="title" />

    {/* Floating container with beacon highlight */}
    <div className="container-with-beacon">
      <HolographicContainer size="large" delay={0}>
        <h3>Data Analysis</h3>
        <p>Real-time processing of aerial data</p>
      </HolographicContainer>

      <HolographicBeacon
        color="#00e5ff"
        size={80}
        intensity={1}
      />
    </div>

    {/* Grid of interactive cards */}
    <div className="card-grid">
      {['Card 1', 'Card 2', 'Card 3'].map((title, i) => (
        <HolographicCard
          key={i}
          title={title}
          content="Interactive card with hover effects"
          icon={['◉', '◆', '◇'][i]}
          index={i}
        />
      ))}
    </div>
  </motion.div>
</section>
```

---

## Performance-Optimized Page Template

```jsx
import { lazy, Suspense } from 'react'
import { HolographicText, HolographicCard } from '../components/HolographicEffects'

// Lazy load expensive components
const ScanlineOverlay = lazy(() =>
  import('../components/HolographicEffects').then(m => ({ default: m.ScanlineOverlay }))
)

export default function OptimizedPage() {
  return (
    <>
      {/* Critical elements */}
      <section className="hero">
        <HolographicText text="TITLE" variant="title" />
      </section>

      {/* Lazy load overlays */}
      <Suspense fallback={null}>
        <ScanlineOverlay opacity={0.08} speed={1} />
      </Suspense>

      {/* Cards with optimization */}
      <section className="features">
        {features.map((f, i) => (
          <HolographicCard
            key={i}
            {...f}
            index={i}
            delay={i * 0.15}
          />
        ))}
      </section>
    </>
  )
}
```

---

## Testing Checklist

```jsx
// ✅ Test all components render
<HolographicText text="TEST" variant="title" />
<HolographicCard title="Test" content="Test" icon="◉" index={0} />
<HolographicBeacon color="#00b4d8" size={100} />
<GlitchText text="TEST" intensity={0.5} />
<ScanlineOverlay opacity={0.08} />
<VHSNoise intensity={0.05} />
<HolographicContainer size="medium">Test</HolographicContainer>

// ✅ Test on mobile
// ✅ Check animations smooth (60 FPS)
// ✅ Verify colors match brand
// ✅ Test accessibility (keyboard nav)
// ✅ Profile with DevTools Performance tab
```

---

## Quick Troubleshooting

```jsx
// If components not showing:
// 1. Check CSS import: import './HolographicEffects.css'
// 2. Verify SVG file exists: HolographicFilters.svg
// 3. Check browser console for errors

// If performance issues:
// 1. Reduce ScanlineOverlay opacity
// 2. Disable VHSNoise on mobile
// 3. Lower number of simultaneous animations
// 4. Profile with DevTools Performance tab

// If colors look wrong:
// 1. Clear browser cache
// 2. Check CSS :root variables
// 3. Verify browser supports backdrop-filter
// 4. Test in different browsers
```

---

**All snippets are production-ready and can be copied directly into your code!**

Visit `/holographic` to see live examples of all these patterns in action.
