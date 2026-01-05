# NEURAL COMPONENTS - QUICK INDEX

## Component Directory

### Core Components

#### 1. NeuralNetworkBackground
**Path**: `src/components/NeuralNetworkBackground.jsx`
**Size**: ~4.5KB
**Dependencies**: React, React Hooks

**What it does**: Renders animated neural network with nodes and connections
**Best for**: Hero sections, full-screen backgrounds
**Key props**: nodeCount, connectionDistance, hue, saturation, lightness, autoActivate

**Quick example**:
```javascript
<NeuralNetworkBackground nodeCount={60} connectionDistance={150} />
```

---

#### 2. ParticleSwarmIntelligence
**Path**: `src/components/ParticleSwarmIntelligence.jsx`
**Size**: ~6KB
**Dependencies**: React, React Hooks

**What it does**: Implements flocking behavior with boids algorithm
**Best for**: Data visualization, background effects, interactive sections
**Key props**: particleCount, separationWeight, alignmentWeight, cohesionWeight, seekWeight

**Quick example**:
```javascript
<ParticleSwarmIntelligence particleCount={100} />
```

---

#### 3. ConstellationVisualization
**Path**: `src/components/ConstellationVisualization.jsx`
**Size**: ~4KB
**Dependencies**: React, React Hooks

**What it does**: Renders data as constellation of stars with connections
**Best for**: Metrics visualization, network topology, data relationships
**Key props**: data, width, height, interactive, showLabels

**Quick example**:
```javascript
<ConstellationVisualization width={1000} height={600} interactive={true} />
```

---

#### 4. NeuralNodeNavigation
**Path**: `src/components/NeuralNodeNavigation.jsx`
**Size**: ~3.5KB
**Dependencies**: React, Framer Motion

**What it does**: Node-based navigation with animated connections
**Best for**: Main navigation, section switchers, interactive menus
**Key props**: nodes, onNodeClick

**Quick example**:
```javascript
<NeuralNodeNavigation
  nodes={[
    { id: 'section1', icon: '◯', label: 'Section 1' }
  ]}
  onNodeClick={(id) => console.log(id)}
/>
```

---

#### 5. GenerativePatterns
**Path**: `src/components/GenerativePatterns.jsx`
**Size**: ~4KB
**Dependencies**: React, React Hooks, Framer Motion

**What it does**: Scroll-responsive generative art patterns
**Best for**: Background patterns, organic visual interest
**Key props**: gridSize, scrollInfluence, updateSpeed

**Quick example**:
```javascript
<GenerativePatterns gridSize={25} scrollInfluence={0.3} />
```

---

#### 6. AdaptiveLearningSystems
**Path**: `src/components/AdaptiveLearningSystems.jsx`
**Size**: ~5KB
**Dependencies**: React, Framer Motion

**What it does**: Tracks user behavior and adapts animations
**Best for**: Wrapper component for entire pages/sections
**Key props**: children, className

**Quick example**:
```javascript
<AdaptiveLearningSystems>
  <YourContent />
</AdaptiveLearningSystems>
```

---

## Utility Functions

**Path**: `src/utils/neuralAnimationUtils.js`
**Size**: ~8KB
**Type**: Pure functions and utility classes

### Math Functions
- `calculateDistance(x1, y1, x2, y2)` - Euclidean distance
- `normalize(x, y)` - Vector normalization
- `limit(x, y, max)` - Magnitude limiting
- `lerp(a, b, t)` - Linear interpolation
- `clamp(value, min, max)` - Value clamping
- `mapRange(value, inMin, inMax, outMin, outMax)` - Range mapping

### Easing Functions
- `easeInCubic(t)` - Cubic ease-in
- `easeOutCubic(t)` - Cubic ease-out
- `easeInOutCubic(t)` - Cubic ease-in-out
- `smoothstep(edge0, edge1, x)` - Smooth interpolation

### Random Functions
- `randomFloat(min, max)` - Random float
- `randomInt(min, max)` - Random integer
- `randomHSL(h, s, l)` - Random HSL color
- `randomHSLA(h, s, l, a)` - Random HSLA color

### Geometry Functions
- `getGridIndex(x, y, gridWidth)` - 2D to 1D index
- `getGridCoords(index, gridWidth)` - 1D to 2D coords
- `calculateCentroid(points)` - Average position
- `getAngle(x1, y1, x2, y2)` - Angle between points
- `pointInCircle(px, py, cx, cy, radius)` - Point-circle collision
- `pointInRect(px, py, x, y, w, h)` - Point-rect collision

### Array Functions
- `average(arr)` - Average of array
- `getMax(arr)` - Maximum value
- `getMin(arr)` - Minimum value

### Performance Classes
- `PerformanceMonitor` - FPS and frame time tracking
- `AnimationFrameController` - RAF management
- `ParticlePool` - Memory pooling for particles

### Helper Functions
- `throttle(func, delay)` - Function throttling
- `debounce(func, delay)` - Function debouncing
- `createNeuralGradient(ctx, x0, y0, x1, y1, hue, saturation)` - Canvas gradient

---

## Styling

**Path**: `src/styles/NeuralNetwork.css`
**Size**: ~6KB
**Type**: CSS3

### Included Styles
- Container layouts
- Animation keyframes (synaptic-pulse, neural-glow, connection-pulse, etc.)
- Component-specific styling
- Responsive breakpoints
- Accessibility (prefers-reduced-motion)

---

## Demo Page

**Path**: `src/pages/NeuralShowcase.jsx`
**Size**: ~8KB
**Type**: Complete page example

**What it does**: Comprehensive showcase of all components
**Route**: `/neural`

---

## CSS Styling

**Path**: `src/styles/NeuralNetwork.css`
**Size**: ~6KB

### Key Animation Names
- `@keyframes synaptic-pulse` - Pulsing glow effect
- `@keyframes neural-glow` - Breathing glow
- `@keyframes connection-pulse` - Line animation
- `@keyframes learning-activate` - Activation indicator
- `@keyframes learning-scan` - Scanning effect
- `@keyframes neural-activation-pulse` - Section activation

### Key Classes
- `.neural-network-container` - Container styling
- `.particle-swarm-container` - Swarm styling
- `.constellation-container` - Data viz styling
- `.neural-node-nav` - Navigation styling
- `.nav-node` - Individual nav node
- `.learning-indicator` - Status indicator

---

## Integration Map

### By Use Case

#### Hero Section
```
Use: NeuralNetworkBackground
Size: 1 full-screen instance
Config: 60-100 nodes
```

#### Features Section
```
Use: ParticleSwarmIntelligence + Content
Size: 50% width
Config: 80-120 particles
```

#### Data Section
```
Use: ConstellationVisualization
Size: Centered, constrained width
Config: Custom data array
```

#### Navigation
```
Use: NeuralNodeNavigation
Size: Sticky header or sidebar
Config: 4-6 nodes
```

#### Full Page Background
```
Use: GenerativePatterns (fixed) + Content (relative)
Size: Full viewport
Config: 20-30 grid size
```

#### Adaptive Content
```
Use: AdaptiveLearningSystems wrapper
Size: Entire page/section
Config: Default (no props needed)
```

---

## Performance Presets

### Mobile Optimized
```javascript
{
  nodes: 30,
  particles: 50,
  gridSize: 15,
  updateSpeed: 3
}
```

### Balanced (Recommended)
```javascript
{
  nodes: 60,
  particles: 100,
  gridSize: 25,
  updateSpeed: 2
}
```

### High-End Desktop
```javascript
{
  nodes: 120,
  particles: 150,
  gridSize: 30,
  updateSpeed: 1
}
```

---

## Color Palette Presets

### Cyan (Default)
```javascript
hue={180}
saturation={100}
lightness={50}
```

### Purple
```javascript
hue={280}
saturation={100}
lightness={50}
```

### Green/Neon
```javascript
hue={120}
saturation={100}
lightness={50}
```

### Pink/Rose
```javascript
hue={340}
saturation={100}
lightness={50}
```

### Orange/Amber
```javascript
hue={30}
saturation={100}
lightness={50}
```

---

## Common Patterns

### Full Screen Hero with Neural Background
```javascript
<div style={{ height: '100vh', position: 'relative' }}>
  <NeuralNetworkBackground autoActivate={true} />
  <div style={{ position: 'relative', zIndex: 10 }}>
    {/* Content */}
  </div>
</div>
```

### Two Column Layout
```javascript
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
  <ParticleSwarmIntelligence />
  <div style={{ padding: '60px' }}>
    {/* Content */}
  </div>
</div>
```

### Scroll-Responsive Background
```javascript
<div style={{ position: 'relative' }}>
  <GenerativePatterns style={{
    position: 'fixed',
    top: 0,
    zIndex: -1
  }} />
  <div style={{ position: 'relative', zIndex: 1 }}>
    {/* Scrollable content */}
  </div>
</div>
```

### Nested Navigation
```javascript
<AdaptiveLearningSystems>
  <header>
    <NeuralNodeNavigation nodes={navNodes} />
  </header>
  <main>
    <section id="section1">{/* ... */}</section>
    <section id="section2">{/* ... */}</section>
  </main>
</AdaptiveLearningSystems>
```

---

## Debugging

### Enable Performance Monitor
```javascript
useEffect(() => {
  const monitor = new PerformanceMonitor()
  const interval = setInterval(() => {
    console.log(monitor.getStats())
    monitor.tick()
  }, 1000)
  return () => clearInterval(interval)
}, [])
```

### Check Canvas Size
```javascript
useEffect(() => {
  const canvas = canvasRef.current
  console.log('Canvas:', {
    offsetWidth: canvas.offsetWidth,
    offsetHeight: canvas.offsetHeight,
    width: canvas.width,
    height: canvas.height,
    dpr: window.devicePixelRatio
  })
}, [])
```

### Monitor Component Visibility
```javascript
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    console.log('Visible:', entry.isIntersecting)
  })
  observer.observe(containerRef.current)
  return () => observer.disconnect()
}, [])
```

---

## Troubleshooting Quick Guide

| Issue | Solution |
|-------|----------|
| Components not rendering | Check z-index and overflow |
| Low performance | Reduce nodeCount/particleCount |
| Canvas blurry | Handled automatically via DPR |
| Colors not showing | Check hue (0-360) range |
| Mobile lag | Use mobile preset config |
| No animations | Check autoActivate prop |
| Memory leak | Verify cleanup in useEffect |
| Canvas overflow | Add overflow: hidden to container |

---

## File Reference

### Components (6 files, ~25KB)
- `NeuralNetworkBackground.jsx` - 4.5KB
- `ParticleSwarmIntelligence.jsx` - 6KB
- `ConstellationVisualization.jsx` - 4KB
- `NeuralNodeNavigation.jsx` - 3.5KB
- `GenerativePatterns.jsx` - 4KB
- `AdaptiveLearningSystems.jsx` - 5KB

### Styles (1 file, 6KB)
- `NeuralNetwork.css` - 6KB

### Utils (1 file, 8KB)
- `neuralAnimationUtils.js` - 8KB

### Pages (1 file, 8KB)
- `NeuralShowcase.jsx` - 8KB

### Documentation (4 files, 50KB)
- `NEURAL_DESIGN_SYSTEM.md` - Technical deep dive
- `NEURAL_INTEGRATION_GUIDE.md` - Step-by-step integration
- `NEURAL_README.md` - Overview and features
- `NEURAL_COMPONENTS_INDEX.md` - This file

### Total: ~118KB (uncompressed, gzipped ~45KB)

---

## Next Steps

1. **View Demo**: Run `npm run dev` and visit `/neural`
2. **Read Docs**: Start with `NEURAL_README.md`
3. **Understand Algorithms**: Review `NEURAL_DESIGN_SYSTEM.md`
4. **Integrate**: Follow `NEURAL_INTEGRATION_GUIDE.md`
5. **Customize**: Modify props and colors
6. **Deploy**: Include in production bundle

---

## Contact & Support

All components are self-contained and well-documented. Refer to in-code comments for detailed explanations of algorithms and implementation details.

Ready to integrate. Ready to innovate. **Ready to win.**

