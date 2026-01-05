# GESTURAL: Quick Start Guide

## 30-Second Setup

```jsx
import { useRef } from 'react'
import { useGestures } from './hooks/useGestures'

function MyComponent() {
  const ref = useRef(null)

  const { gestureState } = useGestures(ref, {
    onSwipe: (data) => console.log('Swiped:', data.direction),
    onPinch: (data) => console.log('Pinched:', data.scale),
  })

  return <div ref={ref}>Touch me!</div>
}
```

---

## Common Patterns

### 1. Image Zoom
```jsx
import GestureEnabledImage from './components/GestureEnabledImage'

<GestureEnabledImage src="photo.jpg" minZoom={1} maxZoom={3} />
```

### 2. Section Navigation
```jsx
const { gestureState } = useGestures(containerRef, {
  onSwipe: (data) => {
    if (data.direction === 'left') goToNextSection()
    if (data.direction === 'right') goToPreviousSection()
  }
})
```

### 3. Long Press Menu
```jsx
const [showMenu, setShowMenu] = useState(false)
const [menuPos, setMenuPos] = useState(null)

const { gestureState } = useGestures(ref, {
  onLongPress: (data) => {
    setMenuPos({ x: data.x, y: data.y })
    setShowMenu(true)
  }
})
```

### 4. Shape Recognition
```jsx
const { gestureState } = useGestures(ref, {
  onDraw: (data) => {
    if (data.shape === 'circle') goHome()
    if (data.shape === 'zigzag') undo()
  }
})
```

### 5. Easter Eggs
```jsx
const { gestureState } = useGestures(ref, {
  onShake: () => {
    console.log('🎉 Easter egg!')
    playConfetti()
  }
})
```

---

## Hook Options

```javascript
useGestures(ref, {
  // Enable/disable gestures
  enableSwipe: true,
  enablePinch: true,
  enableRotate: true,
  enableLongPress: true,
  enableShake: true,
  enableDraw: true,
  enablePalmReject: true,
  enableDoubleTap: true,

  // Callbacks
  onSwipe: (data) => {},      // {direction, distance, velocity}
  onPinch: (data) => {},      // {scale, distance, scaleDelta}
  onRotate: (data) => {},     // {angle, angleDelta}
  onLongPress: (data) => {},  // {x, y}
  onShake: (data) => {},      // {acceleration}
  onDraw: (data) => {},       // {shape}
  onTap: (data) => {},        // {x, y}
  onDoubleTab: (data) => {},  // {x, y}
})
```

---

## Gesture Data Structure

### Swipe
```javascript
{
  type: 'swipe',
  direction: 'left' | 'right' | 'up' | 'down' | 'diagonal-...',
  distance: number,
  velocity: number,
  duration: number,
  startPos: {x, y},
  endPos: {x, y}
}
```

### Pinch
```javascript
{
  type: 'pinch',
  scale: number,           // 1.5 = 150% zoom
  distance: number,
  scaleDelta: number
}
```

### Rotate
```javascript
{
  type: 'rotate',
  angle: number,           // 0-360 degrees
  angleDelta: number       // Change in degrees
}
```

### Long Press
```javascript
{
  type: 'long_press',
  x: number,
  y: number,
  duration: number
}
```

### Draw
```javascript
{
  type: 'draw',
  direction: 'circle' | 'zigzag' | 'line' | 'free',
  points: [{x, y}, ...]
}
```

---

## Theme/Styling

### Customize Colors
```javascript
// In gestureConfig.js
export const GESTURE_FEEDBACK = {
  COLORS: {
    SWIPE: '#00D4FF',    // Change to your brand color
    PINCH: '#FF00FF',
    ROTATE: '#FFD700',
    // ...
  }
}
```

### Customize Thresholds
```javascript
export const GESTURE_THRESHOLDS = {
  SWIPE_DISTANCE: 50,      // Lower = more sensitive
  PINCH_DISTANCE: 20,
  LONG_PRESS_DURATION: 500,
  // ...
}
```

---

## Debugging

### Show Debugger
```jsx
import GestureDebugger from './components/GestureDebugger'

<GestureDebugger stateMachine={stateMachine} visible={true} />
```

### Log Gestures
```javascript
stateMachine.subscribe('gesture_recognized', (gesture) => {
  console.log('Gesture:', gesture)
})
```

### Get Debug Info
```javascript
console.log(stateMachine.debugInfo())
// Output:
// {
//   state: 'idle',
//   duration: 1234,
//   distance: 150.5,
//   velocity: 0.12,
//   touchCount: 1,
//   gestureCount: 3,
//   recentGestures: [...]
// }
```

---

## Integration Points

### In Landing Page
```jsx
import { useRef, useState } from 'react'
import { useGestures } from './hooks/useGestures'
import GestureVisualFeedback from './components/GestureVisualFeedback'

export default function LandingPage3() {
  const pageRef = useRef(null)
  const [recentGesture, setRecentGesture] = useState(null)

  const { gestureState, stateMachine } = useGestures(pageRef, {
    onSwipe: handleNavigation,
    onPinch: handleZoom,
    // ...
  })

  useEffect(() => {
    stateMachine.subscribe('gesture_recognized', setRecentGesture)
  }, [])

  return (
    <div ref={pageRef}>
      {/* Your content */}
      <GestureVisualFeedback gesture={recentGesture} isActive={!!recentGesture} />
    </div>
  )
}
```

---

## Advanced Usage

### Create Custom Controllers
```javascript
import { createZoomController } from './utils/gestureIntegration'

const zoomController = createZoomController(1, 3, (zoom) => {
  setImageScale(zoom)
})

onPinch: (data) => zoomController.handlePinch(data)
```

### Track Gesture History
```javascript
const recentGestures = stateMachine.getRecentGestures(10)
console.log(recentGestures)
```

### Analytics
```javascript
import { GestureAnalytics } from './utils/gestureIntegration'

const analytics = new GestureAnalytics()

stateMachine.subscribe('gesture_recognized', (gesture) => {
  analytics.recordGesture(gesture)
})

console.log(analytics.getReport())
```

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Touch | ✓ | ✓ | ✓ | ✓ |
| Multi-touch | ✓ | ✓ | ✓ | ✓ |
| Accelerometer | ✓ | ✓ | ✓ | ✓ |
| Canvas | ✓ | ✓ | ✓ | ✓ |

---

## Performance Tips

1. **Use gesture state for animations** - Don't re-render on every touch move
2. **Debounce callbacks** - Use `useCallback` to prevent recreations
3. **Disable unused gestures** - Reduces event listener overhead
4. **Use RequestAnimationFrame** - Already optimized in the hook
5. **Mobile: Test on real devices** - Touch behavior varies

---

## Troubleshooting

### Gestures not detecting?
- Check if touch events are being fired: `useGestures(..., { onSwipe: () => console.log('swipe') })`
- Verify `ref` is properly attached to element
- Disable `enablePalmReject` if using stylus

### Performance issues?
- Reduce `PARTICLE_COUNT` in gestureConfig.js
- Disable visual feedback if not needed
- Check for memory leaks with DevTools

### Conflict with scrolling?
- Add `touch-action: manipulation` to CSS
- Use `{ passive: false }` for event listeners (already done)

---

## File Reference

```
src/
├── hooks/useGestures.js                    # Main hook
├── utils/
│   ├── gestureConfig.js                   # Config & utilities
│   ├── gestureStateMachine.js             # State machine
│   └── gestureIntegration.js              # Controllers & analytics
├── components/
│   ├── GestureVisualFeedback.jsx          # Visual feedback
│   ├── GestureVisualFeedback.css
│   ├── GestureNavigator.jsx               # Navigation
│   ├── GestureDebugger.jsx                # Debug UI
│   ├── GestureDebugger.css
│   ├── GestureEnabledImage.jsx            # Example component
│   └── GestureEnabledImage.css
└── GESTURAL_IMPLEMENTATION.md             # Full documentation
```

---

## Next Steps

1. ✅ Copy files to your project
2. ✅ Import `useGestures` hook
3. ✅ Attach ref to your container
4. ✅ Add gesture callbacks
5. ✅ Test on touch device
6. ✅ Customize thresholds if needed
7. ✅ Add visual feedback as needed
8. ✅ Deploy and monitor

---

**That's it! GESTURAL is now integrated. Happy gesturing! 🎯**
