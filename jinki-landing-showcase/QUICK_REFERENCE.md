# Quick Reference - Typography & Micro-Interactions

## 📚 Imports Needed

```javascript
// CSS
import './pages/LandingPage3.css';
import './pages/typography-microinteractions.css';

// Components
import NumberCounter, {
  useCounterOnView,
  PercentageCounter,
  LargeNumberCounter
} from './components/NumberCounter';

// Hooks
import {
  useTextScramble,
  useCharacterReveal,
  useTypingEffect,
  useWordReveal
} from './hooks/useTextAnimations';

// Utilities
import {
  init3DCardTilt,
  initMagneticButton,
  initScrollProgress,
  initAllMicroInteractions
} from './components/microinteractions';
```

---

## 🎨 Typography Patterns

```jsx
// Massive Hero Headline
<h1 className="type-7xl text-balance liquid-text">
  Your Headline
</h1>

// Section Title
<h2 className="type-5xl text-balance">
  Section Title
</h2>

// Body Text with Proper Wrapping
<p className="type-lg text-pretty">
  Long paragraph text
</p>

// Gradient Animated Text
<h2 className="type-4xl text-gradient-animate">
  Gradient Text
</h2>

// Shimmer Effect
<h3 className="type-3xl text-shimmer">
  Shimmering Text
</h3>

// Tabular Numbers (for alignment)
<div className="font-tabular-nums">
  $1,234.56
</div>
```

---

## 🔢 Number Counters

```jsx
// Basic Counter
<NumberCounter
  end={1250}
  suffix="+"
  className="type-4xl counter--highlight"
/>

// Trigger on Scroll
const [ref, triggered] = useCounterOnView(0.5);
<div ref={ref}>
  <NumberCounter end={5000} trigger={triggered} />
</div>

// Percentage
<PercentageCounter value={99.9} decimals={1} />

// Currency
<CurrencyCounter value={1234.56} currency="$" />

// Large Numbers (K/M/B)
<LargeNumberCounter value={2500000} />
// Shows: 2.5M
```

---

## ✨ Text Animations

```jsx
// Scramble Effect
const text = useTextScramble('Final Text', 2000, 500);
<h1>{text}</h1>

// Character Reveal
const chars = useCharacterReveal('Reveal Me', 50, true);
<h1>
  {chars.map(({ char, delay, key }) => (
    <span key={key} className="char-reveal" style={{ animationDelay: `${delay}ms` }}>
      {char}
    </span>
  ))}
</h1>

// Typing Effect
const text = useTypingEffect('Type this out', 100, 0);
<p>{text}<span className="cursor-blink">|</span></p>

// Word Reveal
const words = useWordReveal('Reveal word by word', 200, true);
<p>
  {words.map(({ word, visible, key }) => (
    <span key={key} className={visible ? 'is-visible' : ''}>
      {word}{' '}
    </span>
  ))}
</p>
```

---

## 🎯 Button Patterns

```jsx
// Primary with Ripple + Lift
<button className="btn btn--primary btn--lg liquid-metal ripple hover-lift-glow">
  Click Me
</button>

// Glass Button with Dark Ripple
<button className="btn btn--glass ripple ripple-dark">
  Secondary
</button>

// Magnetic Button
const btnRef = useRef(null);
useEffect(() => {
  return initMagneticButton(btnRef.current, { strength: 20 });
}, []);

<button ref={btnRef} className="btn btn--primary btn-magnetic">
  Magnetic
</button>
```

---

## 🔗 Link Patterns

```jsx
// Underline Slide In
<a href="#" className="link-underline-slide">Link</a>

// Underline from Center
<a href="#" className="link-underline-center">Link</a>

// Draw Underline
<a href="#" className="link-underline-draw">Link</a>
```

---

## 🃏 Card Patterns

```jsx
// 3D Tilt Card
const cardRef = useRef(null);
useEffect(() => {
  return init3DCardTilt(cardRef.current, {
    maxTilt: 15,
    scale: 1.05,
    glare: true
  });
}, []);

<div ref={cardRef} className="card-3d glass-panel hover-lift">
  <div className="card-3d-content">
    <div className="card-3d-shine"></div>
    Content here
  </div>
</div>

// Simple Glass Card
<div className="glass-card hover-lift">
  Content
</div>
```

---

## 🎭 Icon Animations

```jsx
// Bounce on Hover
<div className="icon-bounce">
  <svg>...</svg>
</div>

// Rotate 360° on Hover
<div className="icon-rotate">
  <svg>...</svg>
</div>

// Continuous Pulse
<div className="icon-pulse">
  <svg>...</svg>
</div>

// Wiggle on Hover
<div className="icon-wiggle">
  <svg>...</svg>
</div>
```

---

## 📝 Form Patterns

```jsx
// Floating Label Input
<div className="input-float-label">
  <input type="text" id="email" placeholder=" " />
  <label htmlFor="email">Email Address</label>
</div>

// Animated Checkbox
<label className="checkbox-animated">
  <input type="checkbox" />
  <span className="checkbox-animated__box">
    <svg className="checkbox-animated__checkmark" viewBox="0 0 24 24">
      <path d="M5 12l5 5L20 7" />
    </svg>
  </span>
  <span>I agree</span>
</label>
```

---

## 🚀 Initialize Everything at Once

```jsx
// In your main component
useEffect(() => {
  const cleanup = initAllMicroInteractions({
    card3D: { maxTilt: 15, scale: 1.05 },
    magnetic: { strength: 20, distance: 100 },
    smoothScroll: { offset: 80, duration: 800 },
    scrollAnimations: { threshold: 0.15, once: true }
  });

  return cleanup;
}, []);
```

---

## 📊 Common Combinations

### Hero Stats Section
```jsx
const [ref, triggered] = useCounterOnView(0.3);

<div ref={ref} className="hero__stats glass-panel">
  <div className="hero__stat">
    <NumberCounter
      end={1250}
      trigger={triggered}
      suffix="+"
      className="hero__stat-value counter--highlight font-tabular-nums"
    />
    <span className="hero__stat-label type-xs">Active Users</span>
  </div>
</div>
```

### Animated Hero Headline
```jsx
const headline = useTextScramble('Transform Healthcare', 2000, 300);
const chars = useCharacterReveal('With Intelligence', 40, true);

<div className="hero__headline">
  <h1 className="type-7xl text-balance">{headline}</h1>
  <h2 className="type-7xl text-balance">
    {chars.map(({ char, delay, key }) => (
      <span
        key={key}
        className="char-reveal liquid-text"
        style={{ animationDelay: `${delay}ms` }}
      >
        {char}
      </span>
    ))}
  </h2>
</div>
```

### Feature Card with 3D Tilt
```jsx
const cardRef = useRef(null);
useEffect(() => {
  return init3DCardTilt(cardRef.current);
}, []);

<div
  ref={cardRef}
  className="solution-card glass-panel card-3d hover-lift animate-on-scroll"
>
  <div className="card-3d-content">
    <div className="card-3d-shine"></div>
    <div className="solution-card__icon icon-bounce">
      <Icon />
    </div>
    <h3 className="solution-card__title type-xl">Title</h3>
    <p className="solution-card__desc type-base text-pretty">Description</p>
  </div>
</div>
```

### CTA with Magnetic Button
```jsx
const btnRef = useRef(null);
useEffect(() => {
  return initMagneticButton(btnRef.current, { strength: 20 });
}, []);

<button
  ref={btnRef}
  className="btn btn--primary btn--lg liquid-metal ripple btn-magnetic hover-lift-glow"
>
  Request Demo
</button>
```

---

## 🎨 Color Classes

```css
--color-accent: #06b6d4          /* Cyan */
--color-accent-light: #22d3ee    /* Light Cyan */
--color-accent-warm: #c8893d     /* Gold */
--color-text-primary: #ffffff    /* White */
--color-text-secondary: rgba(255, 255, 255, 0.75)
--color-text-tertiary: rgba(255, 255, 255, 0.55)
--color-text-muted: rgba(255, 255, 255, 0.38)
```

---

## ⚡ Performance Tips

1. **Use `font-tabular-nums` for numbers that update**
2. **Add `hw-accelerate` class to heavily animated elements**
3. **Use `useCounterOnView` to trigger counters only when visible**
4. **Clean up effects with returned cleanup functions**
5. **Limit number of 3D tilt cards per page (3-6 max)**

---

## 🐛 Common Issues

### Counter doesn't animate
- Make sure `trigger` prop is set to `true`
- Check if `useCounterOnView` ref is attached to element
- Verify element enters viewport (check threshold)

### Text animation not showing
- Ensure CSS is imported
- Check if `trigger` prop is set for hooks that use it
- Verify characters are wrapped in spans with class

### 3D tilt not working
- Check if ref is properly attached
- Ensure `.card-3d-content` wrapper exists
- Verify cleanup function is returned from useEffect

### Ripple not visible on click
- Add `:active` state trigger by clicking (not just hovering)
- Check if button has `overflow: hidden`
- Verify `ripple` class is on the element

---

## 📱 Responsive Behavior

All typography automatically scales:
- **Mobile (< 768px)**: Smaller clamp() values
- **Tablet (768px - 1024px)**: Mid-range
- **Desktop (> 1024px)**: Full size

Disable hover effects on touch devices with media query:
```css
@media (hover: none) and (pointer: coarse) {
  /* Touch-specific overrides */
}
```

---

## ✅ Quick Checklist for New Page

- [ ] Import both CSS files
- [ ] Add scroll progress bar: `<div className="scroll-progress"></div>`
- [ ] Initialize micro-interactions with `initAllMicroInteractions()`
- [ ] Use `type-*` classes instead of hardcoded font sizes
- [ ] Add `text-balance` to all headlines
- [ ] Add `text-pretty` to body paragraphs
- [ ] Use `NumberCounter` for all animated numbers
- [ ] Add `ripple` to primary buttons
- [ ] Add `hover-lift` or `hover-lift-glow` to cards
- [ ] Use `link-underline-slide` on nav links
- [ ] Add `animate-on-scroll` to sections
- [ ] Test on mobile, tablet, desktop

---

## 🎓 Learning Path

1. **Start with Typography**: Apply `type-*` classes
2. **Add Simple Animations**: Links, buttons, icons
3. **Implement Counters**: Hero stats, metrics
4. **Advanced Text**: Scramble, character reveal
5. **3D Effects**: Card tilt, magnetic buttons
6. **Full Integration**: Combine everything

---

**Pro Tip**: Copy patterns from `INTEGRATION_EXAMPLE.jsx` and customize!
