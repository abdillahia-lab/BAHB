# QUICK INTEGRATION - 3 Simple Steps

## Step 1: Update App.jsx

Replace your current App.jsx with:

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useCallback, lazy, Suspense } from 'react'
import LandingPage3 from './pages/LandingPage3'
import ConversationalUI from './components/ConversationalUI'
import AccessibleVoiceIntegration from './components/AccessibleVoiceIntegration'
import PageSkeleton from './components/PageSkeleton'
import './styles/global.css'

const Parallax3DShowcase = lazy(() => import('./pages/Parallax3DShowcase'))
const HolographicShowcasePage = lazy(() => import('./pages/HolographicShowcasePage'))

function App() {
  const handleNavigate = useCallback((target) => {
    if (target && target.startsWith('#')) {
      const element = document.querySelector(target)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [])

  // NEW: Handle voice commands
  const handleVoiceCommand = useCallback((command, transcript, confidence) => {
    console.log(`Voice Command: ${command}`, { transcript, confidence })

    switch(command) {
      case 'industries':
        handleNavigate('#industries')
        break
      case 'platform':
        handleNavigate('#platform')
        break
      case 'advisory':
        handleNavigate('#advisory')
        break
      case 'contact':
        handleNavigate('#contact')
        break
      case 'roi':
        // Dispatch event to open ROI modal
        window.dispatchEvent(new CustomEvent('openROICalculator'))
        break
      case 'start':
        handleNavigate('#contact')
        break
      default:
        break
    }
  }, [handleNavigate])

  return (
    // NEW: Wrap with AccessibleVoiceIntegration
    <AccessibleVoiceIntegration
      onCommandExecute={handleVoiceCommand}
      panelPosition="bottom"
      showPanel={true}
      language="en-US"
    >
      <Router>
        <ConversationalUI onNavigate={handleNavigate} />
        <Routes>
          <Route path="/" element={<LandingPage3 />} />
          <Route
            path="/3d"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Parallax3DShowcase />
              </Suspense>
            }
          />
          <Route
            path="/holographic"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <HolographicShowcasePage />
              </Suspense>
            }
          />
        </Routes>
      </Router>
    </AccessibleVoiceIntegration>
  )
}

export default App
```

**What Changed:**
- Added import for `AccessibleVoiceIntegration`
- Added `handleVoiceCommand` callback
- Wrapped entire app with `<AccessibleVoiceIntegration>`
- Wired voice commands to navigation

---

## Step 2: Update LandingPage3.jsx

Add this useEffect to handle ROI modal from voice commands:

```jsx
// Add near the top of LandingPage3 component, after other useEffects
useEffect(() => {
  const handleOpenROI = () => {
    setRoiModalOpen(true)
    // Announce for accessibility
    if (window.announceForAccessibility) {
      window.announceForAccessibility('ROI Calculator opened')
    }
  }

  window.addEventListener('openROICalculator', handleOpenROI)

  return () => {
    window.removeEventListener('openROICalculator', handleOpenROI)
  }
}, [])
```

**What This Does:**
- Listens for custom event from voice commands
- Opens ROI modal when "roi calculator" or "roi" command is spoken
- Announces action for accessibility

---

## Step 3: Import CSS (if not auto-imported)

In your main stylesheet or App.jsx, make sure VoiceTranscriptPanel CSS is imported:

```jsx
// In App.jsx, near top with other imports
import './components/VoiceTranscriptPanel.css'
```

Or add to your main CSS file:
```css
@import './components/VoiceTranscriptPanel.css';
```

---

## That's It!

Your app now has:
✓ Real-time voice transcript display
✓ Confidence scores (0-100%)
✓ Text alternatives for all commands
✓ Keyboard navigation support
✓ Full accessibility for deaf/HoH users
✓ Trust building for all users

---

## Testing Your Integration

### 1. Test Voice Recognition
```bash
# In browser console
- Open DevTools (F12)
- Go to Console tab
- Try saying: "Show industries"
- See transcript panel update in real-time
- Watch confidence percentage change
- Confirm "Navigate to Industries" badge appears
```

### 2. Test Keyboard Navigation
```
- Press Tab to navigate to command buttons
- Press Arrow Up/Down to move between commands
- Press Enter to activate selected command
- Press Escape to close panel
```

### 3. Test Screen Reader (if you have NVDA or JAWS)
```
- Enable screen reader
- Tab through voice commands
- Hear each button's aria-label
- Hear confidence percentage announced
- Hear status updates in live region
```

### 4. Test Mobile
```
- Open on iOS or Android
- Panel appears at bottom
- Voice works with mobile browsers
- Keyboard (if external) navigates properly
- Touch targets are >44x44px
```

---

## Customization Options

### Change Panel Position
```jsx
<AccessibleVoiceIntegration
  panelPosition="top"  // or "bottom" (default)
  ...
>
```

### Add More Commands

1. Edit `COMMAND_PATTERNS` in `AccessibleVoiceIntegration.jsx`:
```jsx
const COMMAND_PATTERNS = {
  'industries': ['show industries', 'show solutions', 'industries'],
  'platform': ['show platform', 'show features', 'platform'],
  // Add new command:
  'demo': ['show demo', 'start demo', 'demo'],
}
```

2. Add handler in `handleVoiceCommand`:
```jsx
case 'demo':
  window.location.href = '/demo'
  break
```

### Hide Panel on Certain Pages
```jsx
<AccessibleVoiceIntegration
  showPanel={!isProductPage}  // Hide on product page
  ...
>
```

### Change Language
```jsx
<AccessibleVoiceIntegration
  language="es-ES"  // Spanish
  ...
>
```

---

## Troubleshooting

### Voice Recognition Not Working
1. Check browser support: Chrome, Edge, Safari work best
2. Check microphone permissions
3. Check browser console for errors
4. Try in a different browser

### Panel Not Showing
1. Check that `showPanel={true}` is set
2. Check z-index conflicts in CSS
3. Look for console errors

### Commands Not Recognized
1. Speak clearly and naturally
2. Speak one command at a time
3. Wait for transcription to complete (green bar)
4. Try exact phrases from the command list

### Keyboard Navigation Not Working
1. Check that component is focused
2. Clear any CSS that removes outline
3. Test with browser default styles first

---

## Files You Created/Modified

### New Files
- `/src/components/VoiceTranscriptPanel.jsx`
- `/src/components/VoiceTranscriptPanel.css`
- `/src/hooks/useVoiceTranscript.js`
- `/src/components/AccessibleVoiceIntegration.jsx`

### Modified Files
- `/src/App.jsx` (import + wrapper)
- `/src/pages/LandingPage3.jsx` (add ROI modal listener)

### Documentation
- `/ACCESSIBILITY_IMPLEMENTATION.md`
- `/TEAM_SPECTRUM_ACCESSIBILITY_PROPOSAL.md`
- `/QUICK_INTEGRATION_EXAMPLE.md` (this file)

---

## Next Steps

1. Copy the new component files to your project
2. Update App.jsx (Step 1 above)
3. Update LandingPage3.jsx (Step 2 above)
4. Test in browser
5. Adjust styling to match your brand
6. Deploy!

---

## Support

All components are fully documented with comments.
Check the JSDoc comments in each file for detailed API info.

Questions? Check `/ACCESSIBILITY_IMPLEMENTATION.md` for complete guide.

