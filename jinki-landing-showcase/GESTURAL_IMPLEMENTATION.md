# GESTURAL: Advanced Touch Gesture Recognition System

## $100,000 SUPER INNOVATIVE Prize Entry
### 25 Competitors Battle - GESTURAL Wins with Advanced Gesture Recognition

---

## Overview

GESTURAL is a revolutionary gesture recognition system built for the Jinki Intelligence landing page. It provides intuitive, multi-touch gesture support with advanced state management, visual feedback, and desktop/mouse fallbacks.

### Key Features

1. **Swipe Navigation** - Navigate between sections with fluid swipe gestures
2. **Pinch-to-Zoom** - Scale images and diagrams with two-finger pinch
3. **Two-Finger Rotate** - 3D element rotation with intuitive gesture controls
4. **Long-Press Details** - Reveal contextual information with sustained press
5. **Shake Gestures** - Trigger easter eggs and special interactions
6. **Draw Gestures** - Navigate using gesture shapes (circle = home)
7. **Palm Rejection** - Smart palm detection for stylus users
8. **Desktop Fallbacks** - Full mouse gesture support for non-touch devices

---

## Architecture

### Core Components

#### 1. `gestureConfig.js` - Configuration & Utilities
- Gesture type definitions
- Threshold configurations
- Detection algorithms
- Device capability detection
- Mathematical utilities (angles, distances, velocity)

#### 2. `gestureStateMachine.js` - State Management
- Finite state machine for gesture recognition
- Event emission system
- Gesture validation
- History tracking
- Momentum prediction

#### 3. `useGestures.js` - Main Hook
- Touch event handling
- Mouse event handling (desktop)
- Gesture recognition pipeline
- Accelerometer integration (shake detection)
- Multiple gesture simultaneous handling

#### 4. `GestureVisualFeedback.jsx` - Visual Indicators
- Particle effects
- SVG animations
- Gesture-specific feedback UI
- Real-time canvas rendering
- GPU-optimized animations

#### 5. `GestureNavigator.jsx` - Navigation Control
- Section-based navigation
- Swipe-based routing
- Draw gesture shortcuts
- Easter egg triggers
- Navigation history

#### 6. `GestureDebugger.jsx` - Development Tools
- Real-time gesture state display
- Recent gesture history
- Performance metrics
- Debug information console

---

## Installation & Setup

### 1. Install Dependencies (if using Hammer.js alternative)

```bash
npm install hammerjs
# OR stick with vanilla implementation (already included)
```

### 2. Integration in Your Landing Page

```jsx
// src/pages/LandingPage3.jsx
import { useRef, useState, useEffect } from 'react'
import { useGestures } from '../hooks/useGestures'
import GestureVisualFeedback from '../components/GestureVisualFeedback'
import GestureNavigator from '../components/GestureNavigator'
import GestureDebugger from '../components/GestureDebugger'

export default function LandingPage3() {
  const pageRef = useRef(null)
  const [recentGesture, setRecentGesture] = useState(null)
  const [showDebugger, setShowDebugger] = useState(false)

  // Initialize gesture system
  const { gestureState, stateMachine } = useGestures(pageRef, {
    enableSwipe: true,
    enablePinch: true,
    enableRotate: true,
    enableLongPress: true,
    enableShake: true,
    enableDraw: true,
    enablePalmReject: true,
    enableDoubleTap: true,
    onSwipe: (data) => console.log('Swipe:', data),
    onPinch: (data) => console.log('Pinch:', data),
    onRotate: (data) => console.log('Rotate:', data),
    onLongPress: (data) => console.log('Long Press:', data),
    onShake: (data) => {
      console.log('Shake detected!')
      setShowDebugger(!showDebugger)
    },
    onDraw: (data) => console.log('Draw:', data),
    onTap: (data) => console.log('Tap:', data),
  })

  // Listen to gesture recognition
  useEffect(() => {
    const unsubscribe = stateMachine.subscribe('gesture_recognized', (gesture) => {
      setRecentGesture(gesture)
    })
    return unsubscribe
  }, [stateMachine])

  // Setup gesture-based navigation
  const sections = [
    { id: 'hero', name: 'Hero' },
    { id: 'features', name: 'Features' },
    { id: 'showcase', name: 'Showcase' },
    { id: 'competitors', name: 'Competitors' },
    { id: 'contact', name: 'Contact' },
  ]

  const navigator = GestureNavigator({
    sections,
    onSectionChange: (data) => {
      console.log('Navigation:', data)
    },
  })

  return (
    <div ref={pageRef} className="landing-page">
      {/* Your existing sections */}
      {sections.map((section, idx) => (
        <section
          key={idx}
          id={`section-${idx}`}
          className="landing-section"
        >
          {/* Your content */}
        </section>
      ))}

      {/* Visual Feedback */}
      <GestureVisualFeedback
        gesture={recentGesture}
        isActive={!!recentGesture}
      />

      {/* Debugger (disable in production) */}
      <GestureDebugger
        stateMachine={stateMachine}
        visible={showDebugger}
        compact={false}
      />

      {/* Gesture Hints */}
      <div className="gesture-hints">
        <p>Swipe to navigate • Pinch to zoom • Draw circle to go home</p>
      </div>
    </div>
  )
}
```

---

## Usage Examples

### Example 1: Pinch-to-Zoom on Images

```jsx
const ImageWithPinch = ({ src }) => {
  const imgRef = useRef(null)
  const [scale, setScale] = useState(1)

  const { gestureState } = useGestures(imgRef, {
    enablePinch: true,
    onPinch: (data) => {
      setScale(prev => Math.max(1, Math.min(3, prev * data.scale)))
    },
  })

  return (
    <img
      ref={imgRef}
      src={src}
      style={{ transform: `scale(${scale})` }}
    />
  )
}
```

### Example 2: Long-Press Context Menu

```jsx
const ContentCard = ({ children }) => {
  const cardRef = useRef(null)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })

  const { gestureState } = useGestures(cardRef, {
    enableLongPress: true,
    onLongPress: (data) => {
      setMenuPos({ x: data.x, y: data.y })
      setShowMenu(true)
    },
  })

  return (
    <>
      <div ref={cardRef} className="content-card">
        {children}
      </div>
      {showMenu && (
        <ContextMenu
          position={menuPos}
          onClose={() => setShowMenu(false)}
        />
      )}
    </>
  )
}
```

### Example 3: 3D Element Rotation

```jsx
const RotatableElement = ({ children }) => {
  const elementRef = useRef(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 })

  const { gestureState } = useGestures(elementRef, {
    enableRotate: true,
    onRotate: (data) => {
      setRotation(prev => ({
        ...prev,
        z: (prev.z + data.angleDelta) % 360,
      }))
    },
  })

  return (
    <div
      ref={elementRef}
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  )
}
```

### Example 4: Gesture-Based Drawing

```jsx
const DrawableCanvas = () => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const { gestureState, stateMachine } = useGestures(canvasRef, {
    enableDraw: true,
    onDraw: (data) => {
      if (data.shape === 'circle') {
        console.log('Circle drawn - trigger action')
      } else if (data.shape === 'zigzag') {
        console.log('Zigzag drawn - trigger undo')
      }
    },
  })

  return (
    <canvas
      ref={canvasRef}
      className="drawable-canvas"
      width={800}
      height={600}
    />
  )
}
```

---

## Gesture Thresholds (Customizable)

```javascript
// src/utils/gestureConfig.js
export const GESTURE_THRESHOLDS = {
  // Swipe: min distance and velocity
  SWIPE_DISTANCE: 50,           // pixels
  SWIPE_VELOCITY: 0.5,          // px/ms
  SWIPE_ANGLE_TOLERANCE: 25,    // degrees

  // Pinch: min scale change
  PINCH_DISTANCE: 20,           // pixels
  PINCH_VELOCITY: 0.1,          // px/ms

  // Rotate: min angle change
  ROTATE_ANGLE: 15,             // degrees
  ROTATE_VELOCITY: 0.5,         // degrees/ms

  // Long press: duration + movement tolerance
  LONG_PRESS_DURATION: 500,     // milliseconds
  LONG_PRESS_MOVEMENT_TOLERANCE: 10,  // pixels

  // Shake: acceleration threshold
  SHAKE_THRESHOLD: 15,          // acceleration units
  SHAKE_DURATION: 300,          // milliseconds
  SHAKE_COUNT: 3,               // number of shakes

  // Draw: min points and time
  DRAW_MIN_POINTS: 20,
  DRAW_COMPLETION_TIME: 500,    // milliseconds

  // Palm rejection
  PALM_MIN_AREA: 3000,          // pixels²
  PALM_MIN_WIDTH: 80,           // pixels

  // Tap thresholds
  TAP_DURATION: 250,            // milliseconds
  TAP_MOVEMENT_TOLERANCE: 10,   // pixels
  DOUBLE_TAP_DELAY: 300,        // milliseconds
}
```

---

## Visual Feedback Customization

```javascript
// Customize gesture colors and feedback
export const GESTURE_FEEDBACK = {
  COLORS: {
    SWIPE: '#00D4FF',      // Cyan
    PINCH: '#FF00FF',      // Magenta
    ROTATE: '#FFD700',     // Gold
    LONG_PRESS: '#FF6B6B', // Red
    SHAKE: '#00FF00',      // Green
    DRAW: '#00FF88',       // Bright green
    TAP: '#00D4FF',        // Cyan
  },
  DURATION: 300,           // Feedback duration (ms)
  PARTICLE_COUNT: 12,      // Particles per gesture
  TRAIL_LENGTH: 30,        // Trail points
}
```

---

## Advanced Features

### 1. Gesture State Machine

```javascript
// Access the state machine directly
const { stateMachine } = useGestures(ref, {})

// Listen to state changes
stateMachine.subscribe('state_change', (data) => {
  console.log('State changed:', data.from, '->', data.to)
})

// Get recent gestures
const recentGestures = stateMachine.getRecentGestures(5)

// Debug information
console.log(stateMachine.debugInfo())
```

### 2. Palm Rejection

Automatically detects and ignores palm touches:

```javascript
const { isPalmDetected } = stateMachine.getState()
if (isPalmDetected) {
  console.log('Palm detected - gesture ignored')
}
```

### 3. Stylus Detection

Identifies stylus vs finger touches:

```javascript
const { stylusDetected } = stateMachine.getState()
if (stylusDetected) {
  console.log('Stylus detected - enable precise drawing')
}
```

### 4. Gesture History

Track user's gesture patterns:

```javascript
const history = stateMachine.getTouchHistory()
// Use for analytics, user behavior tracking, etc.
```

---

## Desktop/Mouse Support

Full mouse gesture support automatically activates on non-touch devices:

- **Mouse Drag** = Touch drag (swipe)
- **Mouse Wheel** = Pinch (with keyboard modifier)
- **Right-Click Hold** = Long press
- **Double-Click** = Double tap

---

## Performance Optimizations

1. **GPU Acceleration**: Uses `transform: translate3d()` and `will-change`
2. **Request Animation Frame**: Optimized particle rendering
3. **Throttled Updates**: Batch updates to avoid layout thrashing
4. **Canvas Rendering**: Particles rendered on canvas, not DOM
5. **Event Delegation**: Minimal event listeners
6. **Memory Cleanup**: Automatic cleanup of old touch history

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Touch Events | ✓ | ✓ | ✓ | ✓ |
| Multi-touch | ✓ | ✓ | ✓ | ✓ |
| DeviceMotion | ✓ | ✓ | ✓ | ✓ |
| Canvas | ✓ | ✓ | ✓ | ✓ |
| Backdrop-filter | ✓ | ✓ (15.4+) | ✓ | ✓ |

---

## File Structure

```
src/
├── hooks/
│   └── useGestures.js           # Main gesture hook
├── utils/
│   ├── gestureConfig.js         # Configuration and utilities
│   └── gestureStateMachine.js   # State machine
├── components/
│   ├── GestureVisualFeedback.jsx    # Visual feedback component
│   ├── GestureVisualFeedback.css    # Feedback styling
│   ├── GestureNavigator.jsx         # Navigation controller
│   ├── GestureDebugger.jsx          # Debug interface
│   └── GestureDebugger.css          # Debugger styling
└── pages/
    └── LandingPage3.jsx         # Integration example
```

---

## Debugging

### Enable Debug Mode

```jsx
// In your landing page
const [showDebugger, setShowDebugger] = useState(false)

// Shake device to toggle debugger
<GestureDebugger
  stateMachine={stateMachine}
  visible={showDebugger}
/>

// Or add keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'g' && e.ctrlKey) {
      setShowDebugger(prev => !prev)
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

### Log Gesture Events

```javascript
// All gestures are logged to console
// with detailed information
stateMachine.subscribe('gesture_recognized', (gesture) => {
  console.log('🎯 Gesture:', gesture)
})
```

---

## Production Considerations

1. **Disable Debugger**: Set `visible={false}` in production
2. **Optimize Thresholds**: Adjust based on your use case
3. **Test on Real Devices**: Touch behavior varies
4. **Performance Monitoring**: Monitor FPS and touch latency
5. **Accessibility**: Ensure non-gesture alternatives exist

---

## Easter Eggs

The system includes built-in easter egg support:

```javascript
// Listen to shake gestures
onShake: (data) => {
  // Trigger easter egg
  window.dispatchEvent(new CustomEvent('gesture-easter-egg'))
}
```

---

## Future Enhancements

- [ ] Gesture recording and playback
- [ ] Machine learning gesture recognition
- [ ] Custom gesture definition
- [ ] Gesture macros and shortcuts
- [ ] Haptic feedback integration
- [ ] Neural network gesture classification
- [ ] Real-time gesture analytics dashboard

---

## License

Built for Jinki Intelligence - Advanced gesture recognition system.

---

## Support & Customization

For more gesture types or custom implementations:

1. Extend `GESTURE_TYPES` in `gestureConfig.js`
2. Add validation in `gestureStateMachine.js`
3. Handle in `useGestures.js`
4. Create visual feedback in `GestureVisualFeedback.jsx`

---

**GESTURAL: Where touch meets intelligence.**
