# 🎬 SCROLL-FLUIDITY Quick Reference Card

## 📋 Class Names Cheat Sheet

### Basic Reveal Animations
```css
.reveal              /* Default: fade + slide up */
.reveal--fade        /* Fade only, no movement */
.reveal--up          /* Slide up from below */
.reveal--down        /* Slide down from above */
.reveal--left        /* Slide in from left */
.reveal--right       /* Slide in from right */
.reveal--scale       /* Scale up from 90% */
.reveal--scale-large /* Scale up from 80% */
.reveal--zoom        /* Zoom out from 110% */
.reveal--blur        /* Blur to focus */
.reveal--rotate      /* Rotate in from -5deg */
```

### Staggered Reveals
```css
.reveal-stagger             /* Normal stagger (0.1s delay per child) */
.reveal-stagger--fast       /* Fast stagger (0.05s delay) */
.reveal-stagger--slow       /* Slow stagger (0.2s delay) */
```

### Parallax Layers
```css
/* Vertical Parallax */
.parallax-layer--slow       /* Moves -20px upward */
.parallax-layer--medium     /* Moves -40px upward */
.parallax-layer--fast       /* Moves -60px upward */
.parallax-layer--reverse    /* Moves +30px downward */

/* Horizontal Parallax */
.parallax-layer--horizontal-slow    /* Moves -20px left */
.parallax-layer--horizontal-medium  /* Moves -40px left */
.parallax-layer--horizontal-fast    /* Moves -60px left */

/* Other Parallax Effects */
.parallax-layer--scale      /* Scales up 10% */
.parallax-layer--fade       /* Fades out 80% */
```

### Sticky Elements
```css
.sticky-header      /* Sticky with scroll state */
.sticky-shrink      /* Shrinks to 90% when scrolled */
.sticky-blur        /* Adds blur backdrop when scrolled */
.sticky-sidebar     /* Sticky sidebar with offset */
```

### Progress Indicators
```css
.scroll-progress            /* Page progress bar (auto-created by JS) */
.scroll-progress-circle     /* Circular scroll-to-top (auto-created by JS) */
.section-progress           /* Section-specific progress bar */
```

### Utility Classes
```css
.parallax-container         /* Wrapper for parallax layers */
.scroll-snap-container      /* Container with scroll snap */
.scroll-snap-section        /* Section with scroll snap */
.gpu-accelerated            /* Force GPU acceleration */
.scroll-container           /* Paint containment */
```

## 🎯 Usage Patterns

### Single Element Reveal
```html
<div class="reveal--up">Content</div>
```

### Staggered Group
```html
<div class="reveal-stagger">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Parallax Section
```html
<section class="parallax-container">
  <div class="parallax-layer parallax-layer--slow">Background</div>
  <div>Content</div>
  <div class="parallax-layer parallax-layer--fast">Foreground</div>
</section>
```

### Sticky Header
```html
<header class="sticky-header">
  <nav>Navigation</nav>
</header>
```

## ⚙️ JavaScript API

### Initialization
```javascript
import { initScrollAnimations } from './utils/scrollAnimations'

initScrollAnimations({
  revealThreshold: 0.1,
  revealRootMargin: '50px',
  revealTriggerOnce: true,
  enableParallax: true,
  enableProgressBar: true,
  enableProgressCircle: true,
  enableSmoothScroll: true,
  enableStickyTransforms: true,
  progressCircleShowAt: 300
})
```

### Utility Functions
```javascript
import {
  smoothScrollTo,
  getScrollPercentage,
  isInViewport,
  getElementScrollProgress,
  throttle,
  debounce
} from './utils/scrollAnimations'

// Smooth scroll to element
smoothScrollTo(document.querySelector('#target'), 1000)

// Get scroll percentage (0-1)
const progress = getScrollPercentage()

// Check viewport visibility
const visible = isInViewport(element, 0.5)

// Get element scroll progress
const elementProgress = getElementScrollProgress(element)

// Throttle/debounce functions
const throttled = throttle(myFunction, 100)
const debounced = debounce(myFunction, 250)
```

## 🎨 CSS Variables

### Customization
```css
:root {
  /* Animation timing */
  --reveal-duration: 0.8s;
  --reveal-delay-base: 0.1s;
  --reveal-distance: 40px;
  --reveal-distance-small: 24px;
  --reveal-distance-large: 60px;

  /* Easing functions */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);

  /* Progress indicator */
  --progress-height: 3px;
  --progress-color: #00d4ff;
}
```

## 📱 Responsive Breakpoints

```css
/* Desktop: Full animations */
@media (min-width: 769px) { }

/* Tablet: Reduced parallax */
@media (max-width: 768px) { }

/* Mobile: Minimal parallax */
@media (max-width: 480px) { }
```

## ♿ Accessibility

### Automatic Features
- Respects `prefers-reduced-motion`
- All animations disabled for reduced motion users
- ARIA labels on interactive elements
- Keyboard navigation support

### Test Reduced Motion
```javascript
// In browser console
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

## 🎭 Common Combinations

### Hero Section
```html
<section class="parallax-container">
  <div class="parallax-layer parallax-layer--slow">BG</div>
  <h1 class="reveal--fade">Title</h1>
  <p class="reveal--up">Subtitle</p>
  <button class="reveal--scale">CTA</button>
</section>
```

### Feature Grid
```html
<div class="reveal-stagger">
  <div class="feature reveal">Feature 1</div>
  <div class="feature reveal">Feature 2</div>
  <div class="feature reveal">Feature 3</div>
</div>
```

### Stats Section
```html
<section>
  <div class="stat reveal--left">Stat 1</div>
  <div class="stat reveal--up">Stat 2</div>
  <div class="stat reveal--right">Stat 3</div>
</section>
```

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Animations not working | Import CSS and init JS |
| Parallax too fast | Adjust CSS transform values |
| Progress bar not showing | Check `enableProgressBar: true` |
| Animations trigger too early | Increase `revealRootMargin` |
| Performance issues | Reduce parallax on mobile |

## 📊 Performance Tips

1. ✅ Use `transform` and `opacity` only
2. ✅ Add `.gpu-accelerated` to animated elements
3. ✅ Enable `will-change` on active animations
4. ✅ Use `passive: true` on scroll listeners
5. ✅ Throttle expensive scroll handlers
6. ✅ Disable parallax on mobile if needed
7. ✅ Use `triggerOnce: true` for one-time reveals

## 📦 File Paths

```
src/
├── styles/
│   └── scroll-animations.css       (Import this)
└── utils/
    └── scrollAnimations.js         (Import this)
```

## 🎓 Quick Start Template

```jsx
// 1. Import
import './styles/scroll-animations.css'
import { initScrollAnimations } from './utils/scrollAnimations'

// 2. Initialize
useEffect(() => {
  initScrollAnimations()
}, [])

// 3. Use classes
return (
  <div>
    <h1 className="reveal--fade">Title</h1>
    <p className="reveal--up">Description</p>

    <div className="reveal-stagger">
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </div>
  </div>
)
```

## 🏆 Best Practices

1. **Don't over-animate** - Less is more
2. **Group related elements** - Use stagger for lists
3. **Match animation to content** - Scale for images, slide for text
4. **Test on mobile** - Reduce motion on small screens
5. **Honor user preferences** - Reduced motion = happy users
6. **Optimize images** - Large images + parallax = slow
7. **Use appropriate delays** - Don't make users wait

## 🎉 Ready to Go!

Copy this reference card. You now have everything you need to implement beautiful, performant scroll animations!

**TEAM SCROLL-FLUIDITY** 🚀
