# Voice-First Quick Start

## 30-Second Setup

### 1. Wrap Your App
```javascript
import { VoiceProvider } from './context/VoiceCommandContext'

function App() {
  return (
    <VoiceProvider>
      <YourApp />
    </VoiceProvider>
  )
}
```

### 2. Add Voice Button
```javascript
import { VoiceCommandButton } from './components/VoiceCommandButton'

<VoiceCommandButton className="fixed top-4 right-4" />
```

### 3. Done! Users can now:
- Click the microphone button
- Say "Hey Jinki" to activate
- Give voice commands

## Essential Commands (Say "Hey Jinki" first)

```
Navigation
├─ "go to pricing" → Pricing page
├─ "go to features" → Features page
├─ "go home" → Home page
└─ "go back" → Previous page

Scrolling
├─ "scroll down" → Scroll page
├─ "scroll up" → Scroll up
└─ "go to top" → Jump to top

Controls
├─ "toggle menu" → Show/hide menu
├─ "search for [query]" → Voice search
└─ "help" → Show commands
```

## Use Hooks in Components

### In Any Component
```javascript
import { useVoice } from './context/VoiceCommandContext'

function MyComponent() {
  const { voiceCommand, textToSpeech, preferences } = useVoice()

  return (
    <>
      {voiceCommand.isListening && <p>Listening...</p>}
      <p>Confidence: {(voiceCommand.confidence * 100).toFixed(0)}%</p>
      <button onClick={() => textToSpeech.speak('Hello!')}>
        Speak
      </button>
    </>
  )
}
```

## Voice Search Example

```javascript
import { useVoiceSearch } from './hooks/useVoiceSearch'

function SearchBox() {
  const voiceSearch = useVoiceSearch({
    searchableContent: [
      { id: 1, title: 'Pricing', description: 'View our plans' },
      { id: 2, title: 'Features', description: 'What we offer' },
    ],
  })

  return (
    <div>
      <button onClick={() => voiceSearch.startVoiceSearch()}>
        Search with Voice
      </button>
      {voiceSearch.searchResults.map(r => (
        <div key={r.id}>{r.title}</div>
      ))}
    </div>
  )
}
```

## Voice Form Example

```javascript
import { VoiceEnabledForm } from './components/VoiceEnabledForm'

function ContactForm() {
  return (
    <VoiceEnabledForm
      fields={[
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'message', label: 'Message', type: 'textarea' },
      ]}
      title="Contact"
      onSubmit={(data) => {
        console.log('Submitted:', data)
        // Send to server
      }}
    />
  )
}
```

## Voice Settings Panel

```javascript
import { VoiceControlPanel } from './components/VoiceControlPanel'
import { useState } from 'react'

function App() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>
        ⚙️ Voice Settings
      </button>
      <VoiceControlPanel isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
```

## Accessibility (Auto-Included)

- Screen reader support ✓
- Keyboard navigation ✓
- ARIA labels ✓
- Live regions ✓
- Text alternatives ✓

## Check Browser Support

```javascript
import { useVoiceCommand } from './hooks/useVoiceCommand'

function App() {
  const { isSupported } = useVoiceCommand()

  if (!isSupported) {
    return <p>Voice not supported in this browser</p>
  }

  return <YourVoiceApp />
}
```

## Multi-Language Support

```javascript
import { useVoice } from './context/VoiceCommandContext'

function LanguageSwitcher() {
  const { changeLanguage } = useVoice()

  return (
    <select onChange={(e) => changeLanguage(e.target.value)}>
      <option value="en-US">English</option>
      <option value="es-ES">Español</option>
      <option value="fr-FR">Français</option>
      <option value="de-DE">Deutsch</option>
      <option value="ja-JP">日本語</option>
      <option value="zh-CN">中文</option>
    </select>
  )
}
```

## Enable Voice Feedback (Text-to-Speech)

```javascript
import { useVoice } from './context/VoiceCommandContext'

function App() {
  const { toggleTextToSpeech, preferences } = useVoice()

  return (
    <button onClick={toggleTextToSpeech}>
      {preferences.ttsEnabled ? '🔊' : '🔇'} Voice Feedback
    </button>
  )
}
```

## Handle Voice Commands

```javascript
import { useVoice } from './context/VoiceCommandContext'
import { useNavigate } from 'react-router-dom'

function VoiceNavigation() {
  const { registerCommandHandler } = useVoice()
  const navigate = useNavigate()

  useEffect(() => {
    registerCommandHandler((cmd) => {
      const routes = {
        'go_home': '/',
        'go_pricing': '/pricing',
        'go_features': '/features',
        'scroll_down': () => window.scrollBy(0, 300),
      }

      const action = routes[cmd.command]
      if (typeof action === 'function') action()
      else if (action) navigate(action)
    })
  }, [registerCommandHandler, navigate])

  return null
}
```

## Custom Voice Command

```javascript
import { useVoiceCommand } from './hooks/useVoiceCommand'

function CustomVoiceFeature() {
  const voiceCmd = useVoiceCommand({
    enabled: true,
    language: 'en-US',
    onCommand: (cmd) => {
      console.log('Command:', cmd.command)
      console.log('Confidence:', cmd.confidence)
      console.log('Transcript:', cmd.transcript)
    },
  })

  return (
    <div>
      <button onClick={() => voiceCmd.startListening()}>
        Start Listening
      </button>
      <p>Heard: {voiceCmd.transcript}</p>
      <p>Last: {voiceCmd.lastCommand?.command}</p>
    </div>
  )
}
```

## Voice Accessibility Announcements

```javascript
import { ScreenReaderAnnouncer, announceForAccessibility } from './utils/voiceAccessibility'

function App() {
  useEffect(() => {
    // Announce to screen readers
    announceForAccessibility('Welcome to Jinki Intelligence')

    // Or use the live region
    ScreenReaderAnnouncer.announce('Page loaded successfully', 'polite')
  }, [])

  return <div>...</div>
}
```

## Confidence Threshold

```javascript
import { useVoice } from './context/VoiceCommandContext'

function App() {
  const { preferences, updatePreferences } = useVoice()

  return (
    <div>
      <label>
        Confidence Threshold: {(preferences.confidenceThreshold * 100).toFixed(0)}%
      </label>
      <input
        type="range"
        min="50"
        max="100"
        value={preferences.confidenceThreshold * 100}
        onChange={(e) => updatePreferences({
          confidenceThreshold: parseFloat(e.target.value) / 100
        })}
      />
      <p>Lower = more lenient, Higher = stricter</p>
    </div>
  )
}
```

## Available Languages

```
en-US  - English (US) ✓
es-ES  - Spanish ✓
fr-FR  - French ✓
de-DE  - German ✓
ja-JP  - Japanese ✓
zh-CN  - Chinese (Simplified) ✓
```

## Troubleshooting

**No microphone permission?**
```javascript
const { voiceCommand } = useVoiceCommand()
if (voiceCommand.error) {
  console.error('Mic error:', voiceCommand.error)
}
```

**Browser not supported?**
```javascript
const { isSupported } = useVoiceCommand()
if (!isSupported) return <FallbackUI />
```

**Commands not recognized?**
```javascript
// Lower confidence threshold
updatePreferences({ confidenceThreshold: 0.6 })

// Speak clearer, slower
// Check console for transcribed text
```

## Full Demo

See `VOICE_INTEGRATION_GUIDE.md` for complete documentation and examples.

---

**Start speaking. It's that simple.**
