# CURSOR EFFECTS - Code Snippets & Examples

Quick copy-paste examples for common use cases.

---

## 🚀 Basic Setup

### Add to App.jsx (Simplest)
```jsx
import CustomCursor from './components/CustomCursor'

function App() {
  return (
    <>
      <CustomCursor />
      {/* Rest of your app */}
    </>
  )
}
```

### With Configuration
```jsx
<CustomCursor
  enableTrail={true}
  enableMagnetic={true}
  trailLength={8}
  magneticStrength={0.3}
/>
```

---

## 🧲 Magnetic Effects

### Basic Magnetic Button
```jsx
<button className="cursor-magnetic">
  Hover Me
</button>
```

### Strong Magnetic Effect
```jsx
<button className="cursor-magnetic" data-magnetic-strength="0.8">
  Strong Magnet
</button>
```

### Weak Magnetic Effect
```jsx
<div className="cursor-magnetic" data-magnetic-strength="0.1">
  Subtle Pull
</div>
```

### Magnetic Card Component
```jsx
function MagneticCard({ children }) {
  return (
    <div className="card cursor-magnetic" data-magnetic-strength="0.4">
      {children}
    </div>
  )
}
```

---

## 🎯 Common Patterns

### CTA Button with Magnetic Effect
```jsx
function CTAButton({ children, onClick }) {
  return (
    <button
      className="btn-primary cursor-magnetic"
      onClick={onClick}
      data-magnetic-strength="0.5"
    >
      {children}
    </button>
  )
}

// Usage
<CTAButton onClick={handleClick}>
  Get Started
</CTAButton>
```

### Magnetic Navigation Links
```jsx
function NavLink({ to, children }) {
  return (
    <a href={to} className="nav-link cursor-magnetic">
      {children}
    </a>
  )
}

// Navigation
<nav>
  <NavLink to="/">Home</NavLink>
  <NavLink to="/about">About</NavLink>
  <NavLink to="/contact">Contact</NavLink>
</nav>
```

### Magnetic Social Icons
```jsx
function SocialIcon({ icon, href }) {
  return (
    <a
      href={href}
      className="social-icon cursor-magnetic"
      data-magnetic-strength="0.6"
      target="_blank"
      rel="noopener noreferrer"
    >
      {icon}
    </a>
  )
}
```

---

## 🎨 Custom Styling

### Change Cursor Color
```css
/* In your CSS */
:root {
  --cursor-color: #ff006e;  /* Hot pink */
  --cursor-glow: rgba(255, 0, 110, 0.3);
}
```

### Larger Cursor
```css
:root {
  --cursor-size: 24px;
  --cursor-ring-size: 60px;
}
```

### Minimal Cursor (No Glow)
```css
.custom-cursor__dot {
  box-shadow: none;
}
```

---

## 🎛️ Dynamic Configuration

### Toggle Cursor Effects
```jsx
function App() {
  const [cursorEnabled, setCursorEnabled] = useState(true)

  return (
    <>
      {cursorEnabled && <CustomCursor />}

      <button onClick={() => setCursorEnabled(!cursorEnabled)}>
        Toggle Cursor
      </button>
    </>
  )
}
```

### User Preference Settings
```jsx
function App() {
  const [settings, setSettings] = useState({
    trail: true,
    magnetic: true,
    trailLength: 8,
  })

  return (
    <>
      <CustomCursor
        enableTrail={settings.trail}
        enableMagnetic={settings.magnetic}
        trailLength={settings.trailLength}
      />

      <SettingsPanel settings={settings} onChange={setSettings} />
    </>
  )
}
```

---

## 🚫 Disable Cursor on Specific Areas

### Disable on Form Inputs
```jsx
<div className="no-custom-cursor">
  <input type="text" placeholder="Default cursor here" />
  <textarea placeholder="Normal cursor" />
</div>
```

### Disable on Entire Section
```jsx
<section className="no-custom-cursor">
  {/* All elements here use default cursor */}
  <button>Default Cursor Button</button>
</section>
```

---

## 🎪 Hero Section Example

```jsx
function HeroSection() {
  return (
    <section className="hero">
      <div className="hero__content">
        <h1 className="hero__title">Welcome to Our Site</h1>
        <p className="hero__subtitle">
          Experience the future of web interactions
        </p>

        <div className="hero__ctas">
          <button
            className="btn-primary cursor-magnetic"
            data-magnetic-strength="0.5"
          >
            Get Started
          </button>

          <button
            className="btn-secondary cursor-magnetic"
            data-magnetic-strength="0.3"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  )
}
```

---

## 📱 Responsive Behavior

### Show Message on Mobile
```jsx
function CursorInfo() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)

  if (isMobile) {
    return (
      <div className="cursor-info">
        💡 Custom cursor visible on desktop only
      </div>
    )
  }

  return null
}
```

### Desktop-Only Features
```jsx
function App() {
  const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches

  return (
    <>
      {isDesktop && <CustomCursor />}
      <YourContent />
    </>
  )
}
```

---

## 🎯 Landing Page Integration

```jsx
import CustomCursor from './components/CustomCursor'
import './styles/global.css'

function LandingPage() {
  return (
    <>
      <CustomCursor enableMagnetic={true} enableTrail={true} />

      <nav className="navbar">
        <div className="navbar__logo">Brand</div>
        <div className="navbar__links">
          <a href="#features" className="cursor-magnetic">Features</a>
          <a href="#pricing" className="cursor-magnetic">Pricing</a>
          <a href="#about" className="cursor-magnetic">About</a>
        </div>
        <button className="navbar__cta cursor-magnetic" data-magnetic-strength="0.5">
          Sign Up
        </button>
      </nav>

      <section className="hero">
        <h1>Amazing Product</h1>
        <p>Tagline goes here</p>
        <button className="hero__cta cursor-magnetic" data-magnetic-strength="0.6">
          Get Started Free
        </button>
      </section>

      <section className="features">
        {features.map(feature => (
          <div key={feature.id} className="feature-card cursor-magnetic">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </section>
    </>
  )
}
```

---

## 🔧 Advanced Customization

### Custom Cursor State on Specific Elements
```jsx
function InteractiveImage() {
  const handleMouseEnter = () => {
    document.querySelector('.custom-cursor')?.classList.add('custom-cursor--drag')
  }

  const handleMouseLeave = () => {
    document.querySelector('.custom-cursor')?.classList.remove('custom-cursor--drag')
  }

  return (
    <img
      src="/image.jpg"
      alt="Draggable"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      draggable
    />
  )
}
```

### Multiple Magnetic Zones
```jsx
function MagneticZones() {
  return (
    <div className="zones">
      <div className="zone zone--weak">
        <button className="cursor-magnetic" data-magnetic-strength="0.1">
          Subtle
        </button>
      </div>

      <div className="zone zone--medium">
        <button className="cursor-magnetic" data-magnetic-strength="0.4">
          Medium
        </button>
      </div>

      <div className="zone zone--strong">
        <button className="cursor-magnetic" data-magnetic-strength="0.8">
          Strong
        </button>
      </div>
    </div>
  )
}
```

---

## 🎨 Themed Cursors

### Dark Theme
```css
[data-theme="dark"] {
  --cursor-color: #00d4ff;
  --cursor-glow: rgba(0, 212, 255, 0.3);
}
```

### Light Theme
```css
[data-theme="light"] {
  --cursor-color: #0066cc;
  --cursor-glow: rgba(0, 102, 204, 0.2);
}
```

### Theme Switcher Component
```jsx
function ThemeToggle() {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="cursor-magnetic"
    >
      Toggle Theme
    </button>
  )
}
```

---

## ⚡ Performance Tips

### Disable Trail on Slow Devices
```jsx
function App() {
  const isLowPerf = navigator.hardwareConcurrency <= 4

  return (
    <CustomCursor
      enableTrail={!isLowPerf}
      trailLength={isLowPerf ? 0 : 8}
    />
  )
}
```

### Reduce Effects on Battery Saver
```jsx
function App() {
  const [battery, setBattery] = useState(null)

  useEffect(() => {
    navigator.getBattery?.().then(setBattery)
  }, [])

  const lowPower = battery?.level < 0.2

  return (
    <CustomCursor
      enableTrail={!lowPower}
      enableMagnetic={!lowPower}
      trailLength={lowPower ? 0 : 8}
    />
  )
}
```

---

## 🧪 Testing Helpers

### Check if Cursor is Active
```js
// In browser console
const cursorActive = document.querySelector('.custom-cursor') !== null
console.log('Custom cursor active:', cursorActive)
```

### Debug Cursor Position
```js
// Add to useCursorEffects.js for debugging
console.log('Mouse:', mousePosition.current)
console.log('Dot:', dotPosition.current)
console.log('Ring:', ringPosition.current)
```

### Test Touch Detection
```js
// In browser console
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
console.log('Touch device:', isTouch)
```

---

## 📋 Integration Checklist Code

```jsx
// ✅ Step 1: Import
import CustomCursor from './components/CustomCursor'

// ✅ Step 2: Add to App
function App() {
  return (
    <>
      <CustomCursor />  {/* ← Added */}
      {/* Rest of app */}
    </>
  )
}

// ✅ Step 3: Test
// Navigate to your app in browser
// Move mouse around
// Hover over buttons
// Click anywhere
// Try on mobile (should be hidden)

// ✅ Step 4: Add magnetic to CTAs
<button className="cursor-magnetic">Click Me</button>
```

---

**Copy, paste, customize!** 🎯
