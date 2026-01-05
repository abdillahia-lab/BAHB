# ⚡ SMART ASSISTANCE QUICK START

Get started with Smart Assistance in 5 minutes.

---

## 📦 What You Get

- ✅ 6 React components (ready to use)
- ✅ 10 React hooks (for your components)
- ✅ 1 core engine (handles everything)
- ✅ 1 config file (customize everything)
- ✅ 0 external dependencies (uses only React + Framer Motion)

---

## 🚀 5-Minute Setup

### Step 1: Import System (30 seconds)

In your `App.jsx`:

```jsx
import { useScrollTracking, useClickTracking } from './systems/SmartAssistance'

function App() {
  // Track user behavior globally
  useScrollTracking()
  useClickTracking('main')

  return (
    // Your app
  )
}
```

### Step 2: Add First Tooltip (1 minute)

```jsx
import { SmartTooltip } from './systems/SmartAssistance'

export function MyButton() {
  return (
    <SmartTooltip
      id="my-btn"
      content="Click to schedule a demo"
    >
      <button>Schedule Demo</button>
    </SmartTooltip>
  )
}
```

### Step 3: Add Guided Tour (2 minutes)

```jsx
import { GuidedTour, useSectionTracking } from './systems/SmartAssistance'

const steps = [
  {
    selector: '.hero',
    title: 'Welcome',
    description: 'This is our hero section'
  },
  {
    selector: '.features',
    title: 'Features',
    description: 'Here are our key features'
  },
]

export function LandingPage() {
  useSectionTracking('hero')

  return (
    <>
      <GuidedTour id="landing-tour" steps={steps} autoStart={true} />
      <div className="hero">Content</div>
    </>
  )
}
```

### Step 4: Add Form Help (1 minute)

```jsx
import { FormAssistance } from './systems/SmartAssistance'

<FormAssistance
  fieldName="email"
  label="Email"
  config={{
    hint: 'We\'ll send you setup instructions',
    validation: 'email',
  }}
/>
```

### Step 5: Customize (30 seconds)

Edit `/systems/SmartAssistance/assistanceConfig.js`:

```javascript
// Change colors
UI_PATTERNS.TOOLTIP.backgroundColor = 'your-color'

// Change timing
TIMING_RULES.MAX_HELPS_PER_SESSION = 10

// Disable a feature
FEATURE_FLAGS.ENABLE_READING_TIME = false
```

---

## 📚 Component Cheatsheet

### SmartTooltip
```jsx
<SmartTooltip
  id="unique-id"
  title="Optional Title"
  content="Your help text"
  trigger="hover"           // 'hover' or auto
  position="top"            // tooltip position
  autoShow={false}          // show automatically
  delay={1500}              // delay in ms
>
  <button>Your element</button>
</SmartTooltip>
```

### GuidedTour
```jsx
<GuidedTour
  id="tour-id"
  steps={[
    {
      selector: '.element',
      title: 'Step Title',
      description: 'Step description',
      action: 'Optional action hint',
    },
  ]}
  autoStart={true}          // start on page load
/>
```

### SmartSuggestions
```jsx
<SmartSuggestions
  sectionId="section-id"
  autoShow={true}
/>
```

### FormAssistance
```jsx
<FormAssistance
  fieldName="email"
  label="Email Address"
  placeholder="you@company.com"
  type="email"
  config={{
    hint: 'Help text here',
    validation: 'email',
    errorMessage: 'Error message',
    suggestions: ['option1', 'option2'],
  }}
  onChange={(value) => console.log(value)}
  value={currentValue}
  required={true}
/>
```

### ReadingTime
```jsx
<ReadingTime
  content="Your long text here..."
  position="top-right"      // Position on screen
  showIcon={true}
/>
```

### SmartRecommendations
```jsx
<SmartRecommendations
  sectionId="current-section"
  variant="card"            // 'card' or 'list'
/>
```

---

## 🎣 Hooks Cheatsheet

### useConfusionDetector
```jsx
const { signals, hasConfusion, highestConfidence } = useConfusionDetector()

// Example:
if (hasConfusion && highestConfidence > 0.7) {
  console.log('User is confused:', signals)
}
```

### useSectionTracking
```jsx
useSectionTracking('section-id')

// Marks section as viewed when user scrolls to it
// Triggers section-specific help
```

### useScrollTracking
```jsx
useScrollTracking()

// Call once in app - tracks all scroll behavior
// Detects rapid scroll, back-and-forth scroll, etc.
```

### useSmartTooltip
```jsx
const tooltip = useSmartTooltip('id')

// Returns:
// - shouldShow (boolean)
// - position (top, left)
// - show() function
// - hide() function
// - dismiss() function
```

### useGuidedTour
```jsx
const tour = useGuidedTour('id', steps)

// Returns:
// - isActive (boolean)
// - currentStep (number)
// - totalSteps (number)
// - nextStep() function
// - previousStep() function
// - skipTour() function
// - completeTour() function
```

### useFormAssistance
```jsx
const {
  hint,           // Current hint text
  error,          // Current error text
  suggestions,    // Array of suggestions
  validateField,  // Function to validate
  selectSuggestion, // Function to select suggestion
} = useFormAssistance('field-name', config)
```

### useReadingTime
```jsx
const { minutes, display } = useReadingTime(content)

// Returns:
// - minutes: number (e.g., 3)
// - display: string (e.g., "3 min read")
```

### useRecommendations
```jsx
const { recommendations, trackClick } = useRecommendations('section-id')

// recommendations: array of suggested sections
// trackClick(id): call when user clicks recommendation
```

---

## ⚙️ Configuration Quick Reference

### Enable/Disable Features
```javascript
FEATURE_FLAGS = {
  ENABLE_SMART_ASSISTANCE: true,
  ENABLE_GUIDED_TOURS: true,
  ENABLE_CONTEXTUAL_TOOLTIPS: true,
  ENABLE_CONFUSION_DETECTION: true,
  // ... more flags
}
```

### Adjust Timing
```javascript
TIMING_RULES = {
  MIN_GAP_BETWEEN_HELPS: 5000,        // 5 seconds
  MAX_HELPS_PER_SESSION: 8,           // Max 8 helps
  MAX_CONCURRENT_HELPS: 1,            // Only 1 at a time
}
```

### Customize Colors
```javascript
UI_PATTERNS.TOOLTIP = {
  backgroundColor: 'rgba(10, 20, 40, 0.85)',
  textColor: '#e0e7ff',
  borderColor: 'rgba(0, 255, 200, 0.3)',
  // ... more options
}
```

### Adjust Learning
```javascript
LEARNING_CONFIG.ENGAGEMENT_TRACKING = {
  clickHelp: 10,              // +10 points for clicking
  dismissHelp: -5,            // -5 points for dismissing
  completeGuidedTour: 25,     // +25 points for completing
}
```

---

## 🐛 Common Issues & Solutions

### Issue: Tooltip not showing
**Solution**: Check that `autoShow={true}` or trigger hover/focus on element

### Issue: Tour overlay too dark
**Solution**: Adjust `UI_PATTERNS.GUIDED_TOUR.overlayOpacity` in config

### Issue: Too many helps showing
**Solution**: Reduce `MAX_HELPS_PER_SESSION` or increase `MIN_GAP_BETWEEN_HELPS`

### Issue: Form hints not appearing
**Solution**: Make sure `config.hint` is set and field is focused

### Issue: Reading time showing for short content
**Solution**: It only shows for content with 200+ words

### Issue: Mobile layout broken
**Solution**: Check that components are within viewport on mobile

---

## 📊 Debugging

Enable debug mode to see what's happening:

```javascript
// In assistanceConfig.js
FEATURE_FLAGS.DEBUG_MODE = true
FEATURE_FLAGS.LOG_CONFUSION_SIGNALS = true
FEATURE_FLAGS.LOG_ASSISTANCE_TRIGGERS = true
```

Then check browser console for logs.

---

## 🎯 Best Practices

### DO ✅
- Show 1 help at a time
- Be contextual and relevant
- Use clear, concise language
- Test on real users
- Monitor engagement

### DON'T ❌
- Show multiple helps simultaneously
- Use jargon
- Show help on every element
- Ignore user dismissals
- Ignore low engagement signals

---

## 📈 Tracking Engagement

```javascript
import { getSmartAssistanceEngine } from './systems/SmartAssistance'

const engine = getSmartAssistanceEngine()

// Get session metrics
const session = engine.getSession()
console.log({
  duration: session.duration,
  assistanceShown: session.assistanceShown,
  engagementScore: session.engagementScore,
})

// Get user profile
console.log(engine.userProfile)

// Record custom engagement
engine.recordAssistanceEngagement('tooltip-id', 'clickHelp')
```

---

## 🎨 Styling

All components use CSS custom properties and can be styled:

```css
.smart-tooltip {
  background-color: var(--assist-bg);
  color: var(--assist-text);
  border: 1px solid var(--assist-border);
}
```

Or override directly in component config.

---

## 📱 Mobile Notes

System automatically:
- ✅ Increases delays on mobile (1.5x)
- ✅ Stacks layouts vertically
- ✅ Uses larger touch targets
- ✅ Adapts positioning

No additional mobile setup needed!

---

## 🔗 Next Steps

1. **Read** `IMPLEMENTATION_GUIDE.md` for details
2. **Study** `EXAMPLE_INTEGRATION.jsx` for full examples
3. **Customize** `assistanceConfig.js` for your brand
4. **Test** with real users
5. **Monitor** engagement and adjust
6. **Iterate** based on feedback

---

## 📞 Help & Support

- **Full Guide**: `IMPLEMENTATION_GUIDE.md`
- **Examples**: `EXAMPLE_INTEGRATION.jsx`
- **Config Docs**: `assistanceConfig.js` (commented)
- **Component Docs**: Each component file (JSDoc)

---

## ⚡ You're Ready!

You now have everything needed to add smart, proactive assistance to your application. Start with Step 1-5 above and you'll have a working system in 5 minutes.

**Good luck! 🚀**
