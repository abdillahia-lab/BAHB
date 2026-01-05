# DATAVIZ - Quick Reference Guide

## Component Quick Start

### 1️⃣ AnimatedCounter - Live Numbers with Style
```jsx
<AnimatedCounter
  value={700000}
  duration={3}
  prefix="$"
  suffix="K"
  easing="easeOutExpo"
/>
```
**Best for:** Key metrics, statistics, financial data

---

### 2️⃣ BeforeAfterSlider - Compare & Contrast
```jsx
<BeforeAfterSlider
  beforeSrc="/old.jpg"
  afterSrc="/new.jpg"
  beforeLabel="Without"
  afterLabel="With"
/>
```
**Best for:** Infrastructure changes, cost savings visual proof

---

### 3️⃣ ParticleFlowSystem - Data Stream Visualization
```jsx
<ParticleFlowSystem
  width={800}
  height={600}
  particleCount={200}
  color="#06f"
  glowColor="#0ff"
/>
```
**Best for:** Data flow, connections, network visualization

---

### 4️⃣ TimelineAnimation - Event Progression
```jsx
<TimelineAnimation
  events={[
    { id: '1', icon: '🚀', title: 'Launch', time: '0:00' },
    { id: '2', icon: '📈', title: 'Growth', time: '5:00' }
  ]}
  direction="vertical"
/>
```
**Best for:** Process steps, timeline, milestones

---

### 5️⃣ DroneInspectionSimulator - Real-time Data
```jsx
<DroneInspectionSimulator
  duration={30000}
  autoPlay={true}
/>
```
**Best for:** Live monitoring, process simulation, status tracking

---

### 6️⃣ Data3DLandscape - 3D Metrics
```jsx
<Data3DLandscape
  data={[
    { label: 'Accuracy', value: 94 },
    { label: 'Speed', value: 72 }
  ]}
  rotation={true}
/>
```
**Best for:** Multi-metric comparison, 3D exploration

---

### 7️⃣ ScrollInfographic - Story-driven Sections
```jsx
<ScrollInfographic
  sections={[
    {
      title: 'Impact',
      columns: [{ text: '...' }]
    }
  ]}
/>
```
**Best for:** Narrative-driven data, multi-part stories

---

## Key Metrics for Jinki Intelligence

| Metric | Value | Component | Animation |
|--------|-------|-----------|-----------|
| Cost Savings | $700K | AnimatedCounter | easeOutExpo (3s) |
| Early Detection | 72 hours | AnimatedCounter | easeOutElastic (2.5s) |
| Accuracy | 94% | AnimatedCounter | easeOutQuad (2.5s) |
| Cost Reduction | 58% | AnimatedCounter | easeOutQuad (2.5s) |

---

## Easing Function Quick Reference

| Function | Behavior | Use Case |
|----------|----------|----------|
| `linear` | Constant speed | Progress bars |
| `easeInQuad` | Slow → Fast | Elements entering |
| `easeOutQuad` | Fast → Slow | Standard animations |
| `easeInOutQuad` | Slow → Fast → Slow | Dialog opens |
| `easeOutCubic` | Dramatic slow-down | Bouncy effects |
| `easeOutExpo` | Very dramatic | Big reveals |
| `easeOutElastic` | Overshoot bounce | Playful animations |

---

## CSS Variables

All components use these customizable colors:

```css
--color-primary: #0066ff    /* Main blue */
--color-secondary: #00ffff  /* Cyan accent */
--color-accent: #ff0066     /* Pink/red accent */
--color-dark: #0a0a1e       /* Background */
--color-dark-light: #1a1a3e /* Card background */
--color-text: #e0e0ff       /* Main text */
--color-text-secondary: #a0a0c0 /* Secondary text */
```

**Customize in your CSS:**
```css
:root {
  --color-primary: #your-color;
  --color-secondary: #your-color;
}
```

---

## Common Props

### Animation Props
```javascript
{
  duration: number,        // milliseconds
  delay: number,           // milliseconds
  easing: string,          // 'easeOutQuad', etc.
  once: boolean,           // Trigger only once
  amount: number           // 0-1 trigger threshold
}
```

### Data Props
```javascript
{
  value: number,
  label: string,
  color: string,
  metrics: Array
}
```

### Event Props
```javascript
{
  id: string,
  icon: string,
  title: string,
  time: string,
  description: string,
  details: string | string[],
  metrics: Array
}
```

---

## Integration Patterns

### In a Dashboard
```jsx
<section className="metrics-dashboard">
  <AnimatedCounter value={700000} prefix="$" />
  <ParticleFlowSystem />
  <TimelineAnimation events={events} />
</section>
```

### In a Landing Page
```jsx
<ScrollInfographic sections={sections} />
<Data3DLandscape data={metrics} />
<BeforeAfterSlider before={img1} after={img2} />
```

### In a Monitoring System
```jsx
<DroneInspectionSimulator autoPlay={true} />
<AnimatedCounter value={currentCount} />
```

---

## Performance Tips

1. **Reduce particle count on mobile**
   ```jsx
   const particleCount = window.innerWidth < 768 ? 75 : 150
   <ParticleFlowSystem particleCount={particleCount} />
   ```

2. **Lazy load 3D components**
   ```jsx
   <Suspense fallback={<div>Loading...</div>}>
     <Data3DLandscape {...props} />
   </Suspense>
   ```

3. **Pause animations off-screen**
   ```jsx
   const isInView = useInView(ref, { once: false })
   const [play, setPlay] = useState(isInView)
   ```

4. **Use `will-change` in CSS**
   ```css
   .animated-element {
     will-change: transform, opacity;
   }
   ```

---

## Responsive Design Breakpoints

```css
/* Desktop */
@media (min-width: 1024px) { }

/* Tablet */
@media (max-width: 1023px) and (min-width: 768px) { }

/* Mobile */
@media (max-width: 767px) { }

/* Small Mobile */
@media (max-width: 480px) { }
```

---

## Color Schemes

### High-Tech Blue/Cyan (Default)
```
Primary: #0066ff
Secondary: #00ffff
Accent: #ff0066
```

### Corporate Green/Blue
```
Primary: #0066ff
Secondary: #00cc88
Accent: #ffaa00
```

### Warm Orange/Red
```
Primary: #ff6600
Secondary: #ff9933
Accent: #cc0000
```

---

## Browser Compatibility

✅ **Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Mobile 90+

⚠️ **Limited Support:**
- IE 11 (no WebGL for 3D)

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Particles not visible | Increase `particleCount` or check `color` |
| Timeline not expandable | Ensure `onClick` handler is present |
| Counter not animating | Check if element is in viewport |
| 3D landscape blank | Verify Three.js is loaded, check console |
| Slider not draggable | Ensure touch/mouse events are enabled |

---

## Real Data Integration

### Fetch from API
```jsx
const [data, setData] = useState([])

useEffect(() => {
  fetchMetrics().then(metrics => {
    setData(metrics.map(m => ({
      label: m.name,
      value: m.count,
      color: m.color
    })))
  })
}, [])

<Data3DLandscape data={data} />
```

### Real-time Updates
```jsx
useEffect(() => {
  const interval = setInterval(() => {
    setMetrics(prev => ({
      ...prev,
      anomalies: prev.anomalies + random()
    }))
  }, 1000)
  return () => clearInterval(interval)
}, [])
```

---

## Export & Integration

### As NPM Package
```javascript
// Create package.json entry
{
  "exports": {
    "./": "./src/components/DataViz/"
  }
}
```

### Standalone Script
```html
<script src="dataviz.min.js"></script>
<script>
  new DataViz.AnimatedCounter({ value: 1000 })
</script>
```

---

## Accessibility

All components include:
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation support
- ✅ Color contrast compliance (WCAG AA)
- ✅ Screen reader friendly

```jsx
<div
  role="region"
  aria-live="polite"
  aria-label="Animation region"
>
  <AnimatedCounter value={1000} />
</div>
```

---

## Files to Remember

```
Core Components:
└── /src/components/DataViz/
    ├── AnimatedCounter.jsx
    ├── BeforeAfterSlider.jsx
    ├── ParticleFlowSystem.jsx
    ├── TimelineAnimation.jsx
    ├── DroneInspectionSimulator.jsx
    ├── Data3DLandscape.jsx
    ├── ScrollInfographic.jsx
    └── DataVizStyles.css

Demo Page:
└── /src/pages/DataVizShowcase.jsx

Documentation:
├── DATAVIZ_IMPLEMENTATION_GUIDE.md
└── DATAVIZ_QUICK_REFERENCE.md (this file)
```

---

## Next Steps

1. ✅ Import components in your page
2. ✅ Add route to App.jsx
3. ✅ Customize colors in CSS
4. ✅ Feed real data
5. ✅ Deploy and measure performance
6. ✅ Collect user feedback
7. ✅ Iterate on animations

---

**DATAVIZ: Transform Data Into Visual Impact** 🚀

Created for Jinki Intelligence | 25 Competitors | $100,000 Prize
