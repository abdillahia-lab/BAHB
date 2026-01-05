# SOUNDSCAPE Integration Examples

Complete examples for integrating SOUNDSCAPE audio experience into Jinki Intelligence.

## 1. Basic App Setup

### Step 1: Update main.jsx

```jsx
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AudioProvider } from './context/AudioContext'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AudioProvider>
      <App />
    </AudioProvider>
  </React.StrictMode>,
)
```

### Step 2: Update App.jsx

```jsx
// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage3 from './pages/LandingPage3'
import Parallax3DShowcase from './pages/Parallax3DShowcase'
import AudioControls from './components/AudioControls'
import './styles/global.css'

function App() {
  return (
    <Router>
      <AudioControls />
      <Routes>
        <Route path="/" element={<LandingPage3 />} />
        <Route path="/3d" element={<Parallax3DShowcase />} />
      </Routes>
    </Router>
  )
}

export default App
```

## 2. Section-Specific Ambient Audio

### Hero Section with Soundscape

```jsx
// src/components/HeroSection.jsx
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAudio } from '../context/AudioContext'
import useSoundscape from '../hooks/useSoundscape'

export function HeroSection() {
  const audioManager = useAudio()
  const { currentSoundscape, playSoundscape, stopSoundscape } = useSoundscape(
    audioManager,
    'hero-section',
    true // isVisible
  )

  return (
    <motion.section
      className="hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <h1>Jinki Intelligence</h1>
      <p>Cybersecurity Intelligence for Drones</p>

      {currentSoundscape === 'hero-section' && (
        <div className="soundscape-indicator">
          <span className="pulse" /> Audio experience active
        </div>
      )}
    </motion.section>
  )
}
```

### Features Section

```jsx
// src/components/FeaturesSection.jsx
import { useAudio } from '../context/AudioContext'
import useSoundscape from '../hooks/useSoundscape'

export function FeaturesSection() {
  const audioManager = useAudio()
  const { playSoundscape, stopSoundscape } = useSoundscape(
    audioManager,
    'features-section',
    true
  )

  return (
    <section className="features">
      <h2>Advanced Features</h2>

      <div className="feature-grid">
        <FeatureCard
          title="Real-time Detection"
          onClick={() => audioManager.playSound('UI.click')}
        />
        <FeatureCard
          title="Threat Analysis"
          onClick={() => audioManager.playSound('UI.click')}
        />
        <FeatureCard
          title="Pattern Recognition"
          onClick={() => audioManager.playSound('UI.click')}
        />
      </div>
    </section>
  )
}

function FeatureCard({ title, onClick }) {
  const { playSound } = useAudio()

  return (
    <div
      className="feature-card"
      onMouseEnter={() => playSound('UI.hover')}
      onClick={onClick}
    >
      {title}
    </div>
  )
}
```

## 3. Interactive UI Sound Effects

### Button with Audio Feedback

```jsx
// src/components/InteractiveButton.jsx
import { useAudio } from '../context/AudioContext'

export function InteractiveButton({ children, onAction }) {
  const { playSound } = useAudio()

  const handleClick = () => {
    playSound('UI.click')
    onAction?.()
  }

  const handleHover = () => {
    playSound('UI.hover', { volume: 0.3 })
  }

  const handleSuccess = () => {
    playSound('UI.success')
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleHover}
      className="interactive-button"
    >
      {children}
    </button>
  )
}
```

### Form with Error/Success Feedback

```jsx
// src/components/AudioForm.jsx
import { useState } from 'react'
import { useAudio } from '../context/AudioContext'

export function AudioForm({ onSubmit }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const { playSound } = useAudio()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.includes('@')) {
      setError('Invalid email')
      playSound('UI.error')
      return
    }

    try {
      await onSubmit(email)
      setSubmitted(true)
      playSound('UI.success')
    } catch (err) {
      setError(err.message)
      playSound('UI.error')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button type="submit">
        {submitted ? 'Subscribed' : 'Subscribe'}
      </button>
      {error && <span className="error">{error}</span>}
    </form>
  )
}
```

## 4. Audio-Reactive Visualizations

### Frequency Visualization

```jsx
// src/components/AudioVisualizationShowcase.jsx
import { useAudio } from '../context/AudioContext'
import AudioVisualizer from '../components/AudioVisualizer'

export function AudioVisualizationShowcase() {
  return (
    <section className="visualization-showcase">
      <h2>Audio Visualization</h2>

      <div className="visualizations">
        <div className="viz-container">
          <h3>Frequency Spectrum</h3>
          <AudioVisualizer mode="bars" width={600} height={200} />
        </div>

        <div className="viz-container">
          <h3>Waveform</h3>
          <AudioVisualizer mode="waveform" width={600} height={150} />
        </div>

        <div className="viz-container">
          <h3>Circular Spectrum</h3>
          <AudioVisualizer mode="circle" width={300} height={300} />
        </div>

        <div className="viz-container">
          <h3>Reactive Effects</h3>
          <AudioVisualizer mode="reactive" width={400} height={400} />
        </div>
      </div>
    </section>
  )
}
```

## 5. Scroll-Based Audio Effects

### Spatial Audio Following Scroll

```jsx
// src/components/ScrollReactiveAudio.jsx
import { useScroll, useTransform, useMotionValue } from 'framer-motion'
import { useEffect } from 'react'
import { useAudio } from '../context/AudioContext'

export function ScrollReactiveAudio() {
  const { scrollY } = useScroll()
  const audioManager = useAudio()

  // Map scroll position to pan value (-1 to 1)
  const panValue = useTransform(scrollY, [0, 3000], [-1, 1])

  // Map scroll speed to volume
  useEffect(() => {
    let lastScroll = 0
    let scrollSpeed = 0

    const updateScrollSpeed = () => {
      const currentScroll = window.scrollY
      scrollSpeed = Math.abs(currentScroll - lastScroll)
      lastScroll = currentScroll

      // Adapt volume based on scroll speed
      const maxVolume = 0.6
      const minVolume = 0.1
      const speed = Math.min(scrollSpeed / 100, 1)
      const adaptiveVolume = minVolume + (maxVolume - minVolume) * speed

      // Update volume (if using ambient audio)
      audioManager.setVolume(adaptiveVolume)
    }

    window.addEventListener('scroll', updateScrollSpeed)
    return () => window.removeEventListener('scroll', updateScrollSpeed)
  }, [audioManager])

  return null
}
```

## 6. Real-Time Audio Reactivity

### Audio-Driven Visual Effects

```jsx
// src/components/AudioReactiveUI.jsx
import { motion } from 'framer-motion'
import { useAudio } from '../context/AudioContext'
import useAudioReactivity from '../hooks/useAudioReactivity'

export function AudioReactiveUI() {
  const { audioContext, isEnabled } = useAudio()
  const { scale, opacity, rotation, blur } = useAudioReactivity(
    audioContext,
    isEnabled
  )

  return (
    <motion.div
      className="reactive-element"
      animate={{
        scale: scale,
        opacity: opacity,
        rotate: rotation,
        filter: `blur(${blur}px)`,
      }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
      }}
    >
      <h3>Audio Reactive Element</h3>
      <p>This element responds in real-time to audio frequencies</p>
    </motion.div>
  )
}
```

## 7. Custom Audio Effects

### Frequency Band Analysis

```jsx
// src/components/FrequencyBandAnalyzer.jsx
import { useAudio } from '../context/AudioContext'
import useAudioReactivity from '../hooks/useAudioReactivity'

export function FrequencyBandAnalyzer() {
  const { audioContext, isEnabled } = useAudio()
  const { getFrequencyBand, getFrequencyRange } = useAudioReactivity(
    audioContext,
    isEnabled
  )

  // Get frequency ranges
  const bass = getFrequencyRange(0, 10)
  const mids = getFrequencyRange(20, 40)
  const treble = getFrequencyRange(50, 64)

  return (
    <div className="frequency-bands">
      <div className="band" style={{ height: `${bass}px` }}>
        Bass
      </div>
      <div className="band" style={{ height: `${mids}px` }}>
        Mids
      </div>
      <div className="band" style={{ height: `${treble}px` }}>
        Treble
      </div>
    </div>
  )
}
```

## 8. Page Transition Sounds

### Navigation with Audio

```jsx
// src/components/NavigationWithAudio.jsx
import { useNavigate } from 'react-router-dom'
import { useAudio } from '../context/AudioContext'

export function Navigation() {
  const navigate = useNavigate()
  const { playSound } = useAudio()

  const handleNavigate = (path) => {
    playSound('UI.transition')
    setTimeout(() => {
      navigate(path)
    }, 300)
  }

  return (
    <nav className="navigation">
      <button onClick={() => handleNavigate('/')}>Home</button>
      <button onClick={() => handleNavigate('/3d')}>3D Showcase</button>
      <button onClick={() => handleNavigate('/about')}>About</button>
    </nav>
  )
}
```

## 9. Complete Landing Page Integration

```jsx
// src/pages/LandingPageWithAudio.jsx
import { useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useAudio } from '../context/AudioContext'
import useSoundscape from '../hooks/useSoundscape'
import AudioVisualizer from '../components/AudioVisualizer'

export function LandingPageWithAudio() {
  const audioManager = useAudio()

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <HeroWithAudio audioManager={audioManager} />

      {/* Features Section */}
      <FeaturesWithAudio audioManager={audioManager} />

      {/* Audio Showcase */}
      <AudioShowcaseSection audioManager={audioManager} />

      {/* CTA Section */}
      <CTAWithAudio audioManager={audioManager} />
    </div>
  )
}

function HeroWithAudio({ audioManager }) {
  const { playSoundscape } = useSoundscape(audioManager, 'hero-section', true)

  return (
    <section className="hero">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Jinki Intelligence
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Cybersecurity Intelligence for Drones
      </motion.p>
    </section>
  )
}

function FeaturesWithAudio({ audioManager }) {
  const { playSoundscape } = useSoundscape(
    audioManager,
    'features-section',
    true
  )

  return (
    <section className="features">
      <h2>Features</h2>
      <div className="feature-grid">
        {['Detection', 'Analysis', 'Recognition'].map((feature) => (
          <motion.div
            key={feature}
            className="feature"
            onClick={() => audioManager.playSound('UI.click')}
            onMouseEnter={() => audioManager.playSound('UI.hover')}
            whileHover={{ scale: 1.05 }}
          >
            {feature}
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function AudioShowcaseSection({ audioManager }) {
  return (
    <section className="audio-showcase">
      <h2>Audio Experience</h2>
      <AudioVisualizer mode="reactive" width={800} height={400} />
      <p>This visualization responds to the ambient audio</p>
    </section>
  )
}

function CTAWithAudio({ audioManager }) {
  return (
    <section className="cta">
      <button
        onClick={() => {
          audioManager.playSound('UI.success')
        }}
        onMouseEnter={() => audioManager.playSound('UI.hover')}
        className="cta-button"
      >
        Get Started
      </button>
    </section>
  )
}

export default LandingPageWithAudio
```

## 10. Accessibility Best Practices

### Respecting User Preferences

```jsx
// src/hooks/useAccessibleAudio.js
import { useEffect } from 'react'
import { useAudio } from '../context/AudioContext'

export function useAccessibleAudio() {
  const audioManager = useAudio()

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion) {
      // Disable audio-reactive visualizations
      // Keep UI sound effects but at lower volume
      audioManager.setVolume(0.1)
    }
  }, [audioManager])

  return audioManager
}
```

### Providing Alternatives

```jsx
// Always provide visual feedback
<motion.button
  onClick={() => audioManager.playSound('UI.click')}
  onMouseEnter={() => audioManager.playSound('UI.hover')}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>
```

---

## Testing Audio Integration

### Manual Testing Checklist

- [ ] Audio disabled on first load
- [ ] Audio toggles with Alt+A
- [ ] Volume adjusts with Alt+Up/Down
- [ ] UI sounds play on interaction
- [ ] Ambient audio fades in when enabled
- [ ] Ambient audio changes per section
- [ ] Visualizations respond to audio
- [ ] Audio persists across navigation
- [ ] No audio cracking/distortion
- [ ] Performance remains 60 FPS

### Browser Testing

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari
- [ ] Chrome Mobile

---

**Ready to implement SOUNDSCAPE audio experience!**
