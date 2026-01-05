# SOUNDSCAPE Audio Experience - Implementation Guide

**SOUNDSCAPE** is an innovative audio integration system for Jinki Intelligence featuring procedural audio synthesis, spatial audio effects, and real-time audio-reactive visualizations.

## Architecture Overview

```
Audio System Architecture
├── Audio Context Provider
│   └── useAudioManager Hook (Core)
│       ├── Audio Synthesis Engine
│       ├── Sound Player Instance
│       └── State Management
├── Section Soundscapes
│   └── useSoundscape Hook
│       └── Ambient Audio Layering
├── Audio Reactivity
│   └── useAudioReactivity Hook
│       ├── FFT Analysis
│       └── Effect Mapping
└── UI Components
    ├── AudioControls (Accessibility-First)
    └── AudioVisualizer (Multiple Modes)
```

## Quick Start

### 1. Wrap Your App with AudioProvider

```jsx
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AudioProvider } from './context/AudioContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AudioProvider>
      <App />
    </AudioProvider>
  </React.StrictMode>,
)
```

### 2. Add AudioControls to Your UI

```jsx
// src/App.jsx
import AudioControls from './components/AudioControls'

function App() {
  return (
    <>
      {/* Your app content */}
      <AudioControls />
    </>
  )
}
```

### 3. Use Audio in Components

```jsx
import { useAudio } from './context/AudioContext'
import useAudioReactivity from './hooks/useAudioReactivity'

function MyComponent() {
  const { playSound, isEnabled, audioContext } = useAudio()
  const { scale, opacity } = useAudioReactivity(audioContext, isEnabled)

  return (
    <button
      onClick={() => playSound('UI.click')}
      style={{
        transform: `scale(${1 + (scale - 1) * 0.1})`,
        opacity: opacity,
      }}
    >
      Click Me
    </button>
  )
}
```

## Core Features

### 1. Procedural Audio Synthesis

All sounds are generated on-the-fly using the Web Audio API without external files:

```javascript
// Zero-dependency sound generation
const sound = playSound('AMBIENT.hero', {
  volume: 0.5,
  loop: true,
  fadeInDuration: 1000,
})

// Custom frequency synthesis
const customSound = playSound('UI.hover', {
  frequency: 880, // A5 note
  duration: 100,
})
```

**Benefits:**
- No audio file downloads
- Perfectly smooth loops
- Infinite scalability
- Real-time parameter control

### 2. Ambient Soundscapes for Sections

Automatically play section-specific ambient audio:

```jsx
import useSoundscape from './hooks/useSoundscape'

function HeroSection() {
  const { playSoundscape, stopSoundscape } = useSoundscape(
    useAudio(),
    'hero-section',
    true // isVisible
  )

  return (
    <section id="hero-section">
      {/* Content with ambient audio */}
    </section>
  )
}
```

**Supported Sections:**
- `hero-section` - Deep cyber ambience (55Hz base)
- `features-section` - Processing ambience (82Hz base)
- `showcase-section` - Data flow ambience (110Hz base)
- `footer-section` - Resonance (73Hz base)

### 3. UI Sound Design

Play feedback sounds for user interactions:

```jsx
const { playSound } = useAudio()

// Hover feedback
<button onMouseEnter={() => playSound('UI.hover')}>
  Hover Effect
</button>

// Click confirmation
<button onClick={() => playSound('UI.click')}>
  Click Me
</button>

// Success feedback
onSuccess={() => playSound('UI.success')}

// Error alert
onError={() => playSound('UI.error')}

// Transition sound
onClick={() => {
  playSound('UI.transition')
  navigateToNextSection()
}}
```

**Available UI Sounds:**
- `UI.hover` - Subtle high tone (880Hz)
- `UI.click` - Confirmation chime (1320Hz)
- `UI.transition` - Frequency sweep (440Hz → 880Hz)
- `UI.success` - Harmonic chord (E Major triad)
- `UI.error` - Dissonant alert (D4-F4)

### 4. Spatial Audio Effects

Create 3D sound positioning based on scroll position:

```jsx
import { useScroll, useTransform } from 'framer-motion'

function SpatialAudioElement() {
  const { scrollY } = useScroll()
  const panValue = useTransform(scrollY, [0, 1000], [-1, 1])

  return (
    <SpatialAudioBox
      panValue={panValue}
      frequency={440}
    />
  )
}
```

### 5. Audio-Reactive Visualizations

Real-time visual effects driven by audio frequencies:

```jsx
import AudioVisualizer from './components/AudioVisualizer'

function AudioReactiveSection() {
  return (
    <AudioVisualizer
      mode="circle"  // or 'bars', 'waveform', 'spectrum', 'reactive'
      width={800}
      height={200}
    />
  )
}
```

**Visualization Modes:**
- `bars` - Frequency spectrum bars
- `waveform` - Audio waveform trace
- `circle` - Circular frequency display
- `spectrum` - Color-mapped spectrum
- `reactive` - Advanced reactive effects

### 6. Adaptive Volume

Automatically adjust volume based on interaction speed:

```javascript
// Volume adapts to scroll speed and interaction velocity
// Faster interactions = higher volume
// Slower interactions = lower volume

// Range: minVolume (0.05) to maxVolume (0.6)
```

### 7. Accessibility Features

**Audio is disabled by default** to respect user preferences:

```javascript
// User must explicitly enable audio
// Preferences saved to localStorage
// Keyboard shortcuts available:
// - Alt+A: Toggle audio
// - Alt+Up/Down: Adjust volume

// Full keyboard navigation support
// Screen reader friendly labels
// prefers-reduced-motion support
```

## Sound Specifications

### Ambient Soundscapes

```javascript
{
  name: 'Cyber Ambience - Hero Section',
  baseFreq: 55,        // Subsonic layer
  harmonics: [110, 165, 220],  // Harmonic series
  duration: 8000,      // 8 seconds
  envelope: {
    attack: 2000,      // Fade in
    decay: 1000,       // Peak to sustain
    sustain: 0.4,      // Steady level
    release: 2000,     // Fade out
  }
}
```

### UI Sounds

```javascript
{
  name: 'Click Confirmation',
  frequency: 1320,     // E6 note
  duration: 150,
  envelope: {
    attack: 20,
    decay: 100,
    sustain: 0,
    release: 30,
  }
}
```

## Performance Optimization

### Buffer Caching

Frequently used sounds are cached in memory:

```javascript
// Automatic LRU cache management
// Default cache size: 10 buffers
// Each buffer: 8 seconds at 44.1kHz ≈ 1.4MB

getCacheStats() // Returns cache info
clearBufferCache() // Manually clear cache
```

### Lazy Loading

Sounds are only generated when needed:

```javascript
// Sound generates on first playback
playSound('AMBIENT.hero')  // Generates buffer
playSound('AMBIENT.hero')  // Uses cached buffer

// Pre-load for immediate playback
preloadSoundscape('hero-section')
```

### Concurrent Sound Limits

Maximum 8 simultaneous sounds to prevent audio context overload:

```javascript
// Older sounds automatically stopped when limit reached
// Configurable via PERFORMANCE.maxConcurrentSounds
```

### Offline Buffer Rendering

Pre-rendered ambient soundscapes for smooth playback:

```javascript
// 8-second pre-rendered buffers
// Seamless looping
// 44.1kHz sample rate
```

## Advanced Usage

### Custom Sound Generation

```javascript
import { SoundPlayer, getAudioContext } from './utils/audioSynthesis'

const player = new SoundPlayer()

// Play custom tone
const sound = player.playSound('CUSTOM_PATH', {
  volume: 0.8,
  loop: false,
  panValue: 0.5,
  onEnd: () => console.log('Sound finished'),
})

// Control playback
sound.setVolume(0.5)
sound.fadeOut(1000)
sound.stop()
```

### FFT Analysis for Custom Effects

```jsx
import useAudioReactivity from './hooks/useAudioReactivity'

function CustomReactiveComponent() {
  const {
    frequencyData,
    getFrequencyBand,
    getFrequencyRange,
    visualizationData,
  } = useAudioReactivity(audioContext, isEnabled)

  // Get specific frequency band (0-63)
  const bassBand = getFrequencyBand(0)      // Low frequencies
  const midBand = getFrequencyBand(32)      // Mid frequencies
  const trebleBand = getFrequencyBand(63)   // High frequencies

  // Get average in range
  const lowFreqs = getFrequencyRange(0, 10)   // Bass range
  const highFreqs = getFrequencyRange(50, 63) // Treble range

  return (
    <div style={{
      transform: `scale(${1 + bassBand / 500})`
    }}>
      Bass-reactive scaling
    </div>
  )
}
```

### Master Volume Control

```javascript
const { volume, setVolume, audioContext } = useAudio()

// Adjust master volume (0-1)
setVolume(0.5)

// Or adjust directly
if (audioContext) {
  audioContext.destination.maxChannelCount = 2
}
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (requires user interaction)
- Mobile: Full support (requires user interaction)

**Note:** Web Audio API requires user interaction before audio can play (security restriction).

## Troubleshooting

### Audio Not Playing

1. Check if audio is enabled: `useAudio().isEnabled`
2. Ensure AudioProvider wraps your app
3. User must interact with page first (click/tap)
4. Check browser console for errors

### Performance Issues

1. Reduce `maxConcurrentSounds` in PERFORMANCE config
2. Disable audio-reactive visualizations if not needed
3. Check cache size: `getCacheStats()`
4. Profile with Chrome DevTools (Performance tab)

### Sound Quality

1. Increase envelope times for smoother transitions
2. Use harmonic stacks instead of single frequencies
3. Add frequency-dependent volume automation
4. Apply post-processing filters if needed

## File Structure

```
src/
├── hooks/
│   ├── useAudioManager.js          # Main audio hook
│   ├── useAudioReactivity.js       # FFT analysis hook
│   └── useSoundscape.js            # Ambient audio hook
├── utils/
│   ├── audioAssets.js              # Sound specifications
│   └── audioSynthesis.js           # Audio synthesis engine
├── context/
│   └── AudioContext.jsx            # Global audio state
├── components/
│   ├── AudioControls.jsx           # Control UI
│   ├── AudioControls.css
│   ├── AudioVisualizer.jsx         # Visualization
│   └── AudioVisualizer.css
```

## Innovation Highlights

1. **Zero Dependencies** - No external audio libraries required
2. **Procedural Generation** - All sounds created on-the-fly
3. **Infinite Scalability** - No file size limitations
4. **Real-time Reactivity** - Audio drives visual effects
5. **Accessibility First** - Off by default, full keyboard control
6. **Performance Optimized** - Smart caching and concurrent limits
7. **Spatial Awareness** - Pan effects follow user interaction
8. **Harmonic Design** - Scientifically-tuned frequencies

## Next Steps

1. Import `AudioProvider` in main.jsx
2. Add `AudioControls` component to your layout
3. Update sections with `useSoundscape` hooks
4. Add UI sound effects with `playSound`
5. Implement audio-reactive visualizations
6. Test on various browsers and devices
7. Adjust sound specifications to taste

---

**SOUNDSCAPE is now ready for immersive audio experience!**
