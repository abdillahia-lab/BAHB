# SOUNDSCAPE Quick Start Guide

Get the audio experience running in 5 minutes.

## Step 1: Wrap Your App (1 minute)

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

## Step 2: Add Audio Controls (1 minute)

```jsx
// src/App.jsx
import AudioControls from './components/AudioControls'

function App() {
  return (
    <>
      <AudioControls />
      {/* Your app content */}
    </>
  )
}
```

## Step 3: Use Audio in Components (2 minutes)

```jsx
import { useAudio } from './context/AudioContext'

function MyButton() {
  const { playSound } = useAudio()

  return (
    <button
      onClick={() => playSound('UI.click')}
      onMouseEnter={() => playSound('UI.hover')}
    >
      Click Me
    </button>
  )
}
```

## Step 4: Add Ambient Audio to Sections (1 minute)

```jsx
import useSoundscape from './hooks/useSoundscape'
import { useAudio } from './context/AudioContext'

function HeroSection() {
  const audioManager = useAudio()
  useSoundscape(audioManager, 'hero-section', true)

  return (
    <section id="hero-section">
      <h1>Welcome</h1>
    </section>
  )
}
```

## Done! 🎵

Your audio experience is now live. Users can:
- Press **Alt+A** to toggle audio
- Press **Alt+Up/Down** to adjust volume
- Click buttons and hear feedback sounds
- Experience ambient audio in each section

---

## Available Sounds

### UI Sounds
```javascript
playSound('UI.hover')       // Subtle 880Hz tone
playSound('UI.click')       // Confirmation 1320Hz
playSound('UI.success')     // E-G-B chord
playSound('UI.error')       // D-F dissonant
playSound('UI.transition')  // 440→880Hz sweep
```

### Ambient Soundscapes
```javascript
useSoundscape(audioManager, 'hero-section', true)
useSoundscape(audioManager, 'features-section', true)
useSoundscape(audioManager, 'showcase-section', true)
useSoundscape(audioManager, 'footer-section', true)
```

### Visualizers
```jsx
import AudioVisualizer from './components/AudioVisualizer'

<AudioVisualizer mode="bars" width={800} height={200} />
<AudioVisualizer mode="circle" width={300} height={300} />
<AudioVisualizer mode="reactive" width={400} height={400} />
```

---

## Common Tasks

### Play Sound on Button Click

```jsx
<button onClick={() => playSound('UI.click')}>
  Click Me
</button>
```

### Play Sound on Hover

```jsx
<div onMouseEnter={() => playSound('UI.hover')}>
  Hover over me
</div>
```

### Play Success Sound

```jsx
const handleSuccess = () => {
  playSound('UI.success')
  showConfirmation()
}
```

### Add Ambient Audio to Section

```jsx
const { audioManager } = useAudio()
useSoundscape(audioManager, 'hero-section', true)
```

### Control Volume Programmatically

```jsx
const { volume, setVolume } = useAudio()

<input
  type="range"
  min="0"
  max="1"
  step="0.1"
  value={volume}
  onChange={(e) => setVolume(parseFloat(e.target.value))}
/>
```

### Add Audio Visualization

```jsx
import AudioVisualizer from './components/AudioVisualizer'

<AudioVisualizer mode="spectrum" width={800} height={300} />
```

---

## Keyboard Shortcuts (for users)

| Key | Action |
|-----|--------|
| Alt+A | Toggle audio |
| Alt+↑ | Volume up |
| Alt+↓ | Volume down |

---

## Troubleshooting

### No Sound Playing?
1. Check if audio is enabled (button in bottom-right)
2. Try clicking the page first (browser security)
3. Check browser console for errors

### Visualizer Not Showing?
1. Enable audio first
2. Check if component is mounted
3. Verify audio context is active

### Performance Issues?
1. Disable visualizers if not needed
2. Check browser DevTools Performance tab
3. Reduce number of concurrent sounds

---

## File Locations

```
Audio System:
  hooks/useAudioManager.js
  hooks/useAudioReactivity.js
  hooks/useSoundscape.js
  utils/audioAssets.js
  utils/audioSynthesis.js
  context/AudioContext.jsx
  components/AudioControls.jsx
  components/AudioVisualizer.jsx

Documentation:
  SOUNDSCAPE_IMPLEMENTATION.md
  SOUNDSCAPE_TECHNICAL_SPECS.md
  SOUNDSCAPE_INTEGRATION_EXAMPLE.md
  SOUNDSCAPE_DELIVERABLES.md
```

---

## Next Steps

1. Read `SOUNDSCAPE_IMPLEMENTATION.md` for full feature guide
2. Check `SOUNDSCAPE_INTEGRATION_EXAMPLE.md` for code examples
3. Review `SOUNDSCAPE_TECHNICAL_SPECS.md` for deep dive
4. Customize sounds in `audioAssets.js`

---

**That's it! You now have a world-class audio experience.**
