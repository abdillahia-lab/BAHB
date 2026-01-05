# MICROFEEDBACK - QUICK REFERENCE GUIDE

**One-page cheat sheet for micro-interactions**

---

## Import Everything You Need

```jsx
// Import CSS
import '../styles/micro-interactions.css'

// Import components
import {
  MicroButton,
  MicroCard,
  MicroInput,
  MicroNavItem,
  MicroSkeleton,
  MicroSpinner,
  MicroToast,
  MicroScrollProgress,
  MicroHoverReveal,
  MicroFormFeedback,
  MicroDropdown,
} from '../components/MicroInteractionComponents'

// Import utilities
import {
  TIMING,
  EASING,
  springs,
  buttonVariants,
  cardVariants,
  formFieldVariants,
  navigationVariants,
  loadingVariants,
  feedbackVariants,
} from '../utils/microInteractions'

// Import Framer Motion
import { motion, AnimatePresence, useScroll } from 'framer-motion'
```

---

## Component Quick Start

### Buttons

```jsx
// All variants
<MicroButton variant="primary">Primary</MicroButton>
<MicroButton variant="secondary">Secondary</MicroButton>
<MicroButton variant="ghost">Ghost</MicroButton>
<MicroButton variant="glow">Glowing</MicroButton>

// All sizes
<MicroButton size="sm">Small</MicroButton>
<MicroButton size="md">Medium (default)</MicroButton>
<MicroButton size="lg">Large</MicroButton>

// With click handler
<MicroButton onClick={() => handleClick()}>Click</MicroButton>
```

### Cards

```jsx
// Basic card
<MicroCard title="Title" description="Description">
  Content here
</MicroCard>

// With image
<MicroCard
  title="Card"
  description="Desc"
  image="/path/to/image.jpg"
/>
```

### Input Fields

```jsx
// Basic input
<MicroInput label="Name" />

// With validation
<MicroInput
  label="Email"
  type="email"
  error={emailError}
  success={isValid}
/>

// With character counter
<MicroInput
  label="Message"
  maxLength={100}
  showCounter={true}
/>
```

### Navigation Items

```jsx
<MicroNavItem active={isActive} onClick={handleClick}>
  Home
</MicroNavItem>
```

### Loading States

```jsx
// Spinner
<MicroSpinner size="md" color="#007ACC" />

// Skeleton loader
<MicroSkeleton count={3} height="20px" />
```

### Toasts

```jsx
const [toast, setToast] = useState(null)

<AnimatePresence>
  {toast && (
    <MicroToast
      message="Success!"
      type="success"
      duration={5000}
      onClose={() => setToast(null)}
    />
  )}
</AnimatePresence>

// Show toast
setToast({ message: 'Hello!', type: 'success' })
```

---

## Timing Constants

```javascript
TIMING.INSTANT       // 100ms  - Fastest feedback
TIMING.FAST          // 150ms  - Quick interactions
TIMING.QUICK         // 200ms  - Snappy feeling
TIMING.NORMAL        // 300ms  - Standard (default)
TIMING.MEDIUM        // 400ms  - Deliberate
TIMING.SLOW          // 500ms  - Reveal/build
TIMING.LEISURELY     // 700ms  - Slow reveal
TIMING.EPIC          // 1000ms - Grand entrance

// Stagger for sequences
TIMING.STAGGER_MINI   // 50ms
TIMING.STAGGER_SMALL  // 80ms
TIMING.STAGGER_MEDIUM // 120ms
TIMING.STAGGER_LARGE  // 150ms
```

---

## Common Easing Curves

```javascript
// Material Design
EASING.MATERIAL_STANDARD    // Balanced
EASING.MATERIAL_DECELERATE  // Smooth exit
EASING.MATERIAL_ACCELERATE  // Sharp entry

// Springy
EASING.ELASTIC      // Bouncy
EASING.BOUNCE_OUT   // Lands with bounce
EASING.OVERSHOOT    // Overshoots then settles

// Quick snaps
EASING.SNAP         // Quick snap to place

// Anticipation
EASING.ANTICIPATION // Wind-up effect
```

---

## CSS Classes

### Buttons
```css
.micro-btn           /* Base button */
.micro-btn-glow      /* Glowing button */
.micro-btn-icon      /* Icon button */
```

### Loading
```css
.micro-pulse         /* Pulsing animation */
.micro-shimmer       /* Skeleton shimmer */
.micro-spinner       /* Rotating spinner */
.micro-bounce-dot    /* Bouncing dots */
.micro-wave          /* Wave animation */
```

### Feedback
```css
.micro-success       /* Success animation */
.micro-error         /* Error shake */
.micro-warning       /* Warning pulse */
.micro-info          /* Info slide */
.micro-toast         /* Toast slide */
```

### Cards
```css
.micro-card          /* Base card */
.micro-card-image    /* Card image container */
.micro-card-content  /* Card content */
```

### Forms
```css
.micro-input         /* Input field */
.micro-input-fill    /* Input with fill */
.micro-label         /* Floating label */
.micro-error-message /* Error text */
```

### Navigation
```css
.micro-link          /* Link with underline animation */
.micro-nav-item      /* Navigation item */
.micro-dropdown      /* Dropdown menu */
```

### Scroll
```css
.micro-scroll-progress  /* Progress bar */
.micro-scroll-indicator /* Scroll indicator */
```

### Utilities
```css
.micro-fade-in       /* Fade in */
.micro-slide-left    /* Slide in from left */
.micro-slide-right   /* Slide in from right */
.micro-slide-top     /* Slide in from top */
.micro-slide-bottom  /* Slide in from bottom */
.micro-scale-up      /* Scale up animation */
.micro-bounce-in     /* Bounce in animation */
.micro-flip          /* Flip card animation */
```

---

## Motion Variants Quick Access

### Button Variants

```jsx
const buttonVariants = {
  primary:   { rest, hover, tap, press }
  secondary: { rest, hover, tap }
  ghost:     { rest, hover, tap }
  glow:      { rest, hover, tap }
  icon:      { rest, hover, tap }
}
```

### Card Variants

```jsx
const cardVariants = {
  container:  { rest, hover }
  tilt:       { rest, hover }
  imageZoom:  { rest, hover }
  contentSlide: { rest, hover }
  borderGlow: { rest, hover }
  children:   (index) => ({ initial, animate })
}
```

### Form Field Variants

```jsx
const formFieldVariants = {
  inputUnderline:   { rest, focus }
  floatingLabel:    { rest, focus }
  inputWrapper:     { rest, focus }
  inputFill:        { rest, focus }
  counter:          { initial, animate }
  errorMessage:     { initial, animate, exit }
  successCheckmark: { initial, animate }
}
```

### Navigation Variants

```jsx
const navigationVariants = {
  linkUnderline:      { rest, hover }
  navItem:            { rest, hover, active }
  dropdownMenu:       { initial, animate, exit }
  breadcrumbChevron:  { rest, hover }
  mobileMenu:         { initial, animate, exit }
  activeIndicator:    { layoutId, transition }
}
```

### Loading Variants

```jsx
const loadingVariants = {
  pulse:          { animate }
  shimmer:        { animate }
  spin:           { animate }
  bounce:         (index) => ({ animate })
  progressFill:   { initial, animate }
  wave:           { animate }
  skeletonToContent: { initial, exit }
}
```

### Feedback Variants

```jsx
const feedbackVariants = {
  success: { initial, animate, exit }
  error:   { animate }
  warning: { animate }
  info:    { initial, animate, exit }
  toast:   { initial, animate, exit }
}
```

---

## Spring Presets

```javascript
springs.snappy    // Quick, responsive
springs.bouncy    // Playful, elastic
springs.smooth    // Elegant, controlled
springs.gentle    // Subtle, understated
springs.molasses  // Slow, heavy
```

---

## Usage Patterns

### Form with Validation

```jsx
const [email, setEmail] = useState('')
const [error, setError] = useState('')

const handleChange = (e) => {
  setEmail(e.target.value)
  if (e.target.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    setError('')
  } else {
    setError('Invalid email')
  }
}

<MicroInput
  label="Email"
  type="email"
  value={email}
  onChange={handleChange}
  error={error}
  success={email && !error}
/>
```

### Loading State

```jsx
const [loading, setLoading] = useState(false)

const handleSubmit = async () => {
  setLoading(true)
  await api.call()
  setLoading(false)
}

{loading ? <MicroSpinner /> : <MicroButton>Submit</MicroButton>}
```

### Toast Manager

```jsx
const [toasts, setToasts] = useState([])

const showToast = (message, type) => {
  const id = Date.now()
  setToasts([...toasts, { id, message, type }])
  setTimeout(() => {
    setToasts(t => t.filter(x => x.id !== id))
  }, 5000)
}

<AnimatePresence>
  {toasts.map(t => (
    <MicroToast
      key={t.id}
      message={t.message}
      type={t.type}
      onClose={() => setToasts(toasts.filter(x => x.id !== t.id))}
    />
  ))}
</AnimatePresence>
```

### Custom Motion

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: TIMING.QUICK, ...springs.smooth }}
>
  Content
</motion.div>
```

---

## Accessibility

```jsx
// Always include ARIA labels
<MicroButton aria-label="Submit form">Submit</MicroButton>

// Indicate required fields
<MicroInput
  label="Email"
  aria-required="true"
  aria-invalid={hasError}
/>

// Provide keyboard navigation
<MicroButton
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleClick()
  }}
/>

// Respect motion preferences
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

const duration = prefersReducedMotion ? 0 : TIMING.NORMAL
```

---

## Performance Tips

1. **Memoize components**
   ```jsx
   const MemoCard = React.memo(MicroCard)
   ```

2. **Use will-change sparingly**
   ```jsx
   style={{ willChange: 'transform, opacity' }}
   ```

3. **Batch updates**
   ```jsx
   const [state, setState] = useState({ a: 0, b: 0 })
   setState(prev => ({ ...prev, a: 1, b: 1 }))
   ```

4. **Lazy load animations**
   ```jsx
   const { scrollYProgress } = useScroll()
   ```

---

## Animations at a Glance

| Use Case | Timing | Easing | Component |
|----------|--------|--------|-----------|
| Button press | 100-200ms | SNAP | MicroButton |
| Hover reveal | 150-200ms | ELASTIC | Card |
| Form focus | 150ms | STANDARD | MicroInput |
| Loading | Infinite | LINEAR | MicroSpinner |
| Success | 300ms | BOUNCE_OUT | MicroToast |
| Page transition | 400ms | EASE_IN_OUT | motion |
| Lazy load | 500ms+ | EASE_OUT | MicroSkeleton |

---

## Common Pitfalls

❌ **Don't:**
- Animate everything (causes visual clutter)
- Use long durations (feels sluggish)
- Ignore prefers-reduced-motion (accessibility)
- Animate opacity and transforms together (performance)
- Forget to cleanup animations (memory leaks)

✅ **Do:**
- Use micro-interactions for meaningful feedback
- Keep animations under 500ms for interactions
- Test on mobile and low-end devices
- Use CSS transforms (GPU accelerated)
- Clean up event listeners and timers

---

## File Locations

```
src/
├── utils/
│   └── microInteractions.js          # Core utilities
├── styles/
│   └── micro-interactions.css        # CSS animations
└── components/
    ├── MicroInteractionComponents.jsx # React components
    └── MicroInteractionsShowcase.jsx  # Demo page
```

---

## Getting Help

### Check Examples
```jsx
import MicroInteractionsShowcase from '../components/MicroInteractionsShowcase'

// Add to your routes
<Route path="/showcase" element={<MicroInteractionsShowcase />} />
```

### Read Full Guide
See `MICROFEEDBACK_IMPLEMENTATION_GUIDE.md` for detailed documentation

### View Source
All components are well-commented - check the JSX and CSS files

---

**Last Updated:** 2026-01-05
**Version:** 1.0.0
**Status:** Production Ready

---

Happy micro-interacting! 🎉
