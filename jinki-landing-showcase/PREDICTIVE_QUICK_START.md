# PREDICTIVE ASSISTANT - QUICK START GUIDE

## 30-Second Setup

### Step 1: Wrap Your App

```javascript
// App.jsx
import PredictiveAssistant from './components/PredictiveAssistant'

export default function App() {
  return (
    <PredictiveAssistant enableDebugPanel={true}>
      {(predictive) => <YourLandingPage {...predictive} />}
    </PredictiveAssistant>
  )
}
```

### Step 2: Register Sections

```javascript
// LandingPage.jsx
function LandingPage({ registerSection, onCTAClick }) {
  return (
    <>
      <section ref={registerSection('hero')}>
        {/* Hero content */}
      </section>

      <section ref={registerSection('features')}>
        {/* Features content */}
      </section>

      <section ref={registerSection('pricing')}>
        {/* Pricing content */}
      </section>
    </>
  )
}
```

### Step 3: Track CTA Clicks

```javascript
<button onClick={() => onCTAClick('cta-demo')}>
  Get Demo
</button>
```

**Done!** Debug panel now shows real-time predictions.

---

## REAL-WORLD SCENARIOS

### Scenario 1: User is about to leave

**Signal:** `predictions.exitProbability > 0.7`

**Action:**
```javascript
if (recommendations.exitIntervention?.enabled) {
  return (
    <ExitModal
      message={recommendations.exitIntervention.message}
      cta={recommendations.exitIntervention.cta}
    />
  )
}
```

---

### Scenario 2: User is highly engaged

**Signal:** `diagnostics.conversionScore > 80`

**Action:**
```javascript
if (diagnostics.conversionScore > 80) {
  return (
    <button className="btn-primary-large">
      {recommendations.cta}
      <span className="hot-badge">Ready to convert</span>
    </button>
  )
}
```

---

### Scenario 3: User is just exploring

**Signal:** `predictions.userIntent === 'exploring'`

**Action:**
```javascript
if (predictions.userIntent === 'exploring') {
  return (
    <section className="feature-showcase">
      <h2>See Real Results</h2>
      <CaseStudyCarousel />
      <button>{recommendations.cta}</button>
    </section>
  )
}
```

---

### Scenario 4: Prefetch next section

**Signal:** `recommendations.prefetchSuggestions`

**Action:**
```javascript
useEffect(() => {
  recommendations.prefetchSuggestions?.forEach(sug => {
    const next = document.getElementById(sug.sectionId)
    if (next) {
      // Prefetch images
      next.querySelectorAll('img').forEach(img => {
        const preload = new Image()
        preload.src = img.src
      })
    }
  })
}, [recommendations.prefetchSuggestions])
```

---

## DEBUG PANEL EXPLAINED

```
PREDICTIVE INTELLIGENCE
══════════════════════════

User Intent
───────────
Intent: interested
Confidence: 78%

Conversion Metrics
──────────────────
Conversion Score: 67/100
Exit Probability: 22%
Est. LTV: $249

Behavior Tracking
─────────────────
Scroll Interactions: 18
CTA Clicks: 3
Mouse Movements: 156

Recommendations
───────────────
Suggested CTA: Contact Sales
Prefetch: pricing
```

### What Each Metric Means

| Metric | What It Shows | Action When High |
|--------|---------------|-----------------|
| Conversion Score | Likelihood to convert (0-100) | Show urgent CTA |
| Exit Probability | Chance user will leave (0-1) | Deploy rescue offer |
| Intent | User's stage (exploring → converting) | Tailor content |
| Scroll Interactions | Page engagement depth | Content is working |
| CTA Clicks | Interest in your offers | User is interested |

---

## COMMON IMPLEMENTATIONS

### Implementation 1: Smart CTA Component

```javascript
function SmartCTA({ predictive }) {
  const { recommendations, diagnostics } = predictive

  const ctas = {
    default: { text: 'Learn More', style: 'outline' },
    urgent: { text: recommendations.cta, style: 'solid-large' },
    exit: { text: recommendations.exitIntervention?.cta, style: 'glow' }
  }

  let currentCTA = ctas.default

  if (recommendations.exitIntervention?.enabled) {
    currentCTA = ctas.exit
  } else if (diagnostics.conversionScore > 75) {
    currentCTA = ctas.urgent
  }

  return <button className={`btn-${currentCTA.style}`}>{currentCTA.text}</button>
}
```

### Implementation 2: Section Visibility Tracker

```javascript
function SectionWithTracking({ sectionId, children, predictive }) {
  const { registerSection } = predictive

  return (
    <section id={sectionId} ref={registerSection(sectionId)}>
      {children}
    </section>
  )
}
```

### Implementation 3: Exit Intent Modal

```javascript
function ExitIntentModal({ predictive }) {
  const { recommendations } = predictive
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (recommendations.exitIntervention?.enabled) {
      // Delay slightly to avoid annoying user
      const timer = setTimeout(() => setVisible(true), 500)
      return () => clearTimeout(timer)
    }
  }, [recommendations.exitIntervention])

  if (!visible) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>🎁 Wait! Special Offer Inside</h3>
        <p>{recommendations.exitIntervention.message}</p>
        <button className="btn-primary">
          {recommendations.exitIntervention.cta}
        </button>
        <button onClick={() => setVisible(false)}>No thanks</button>
      </div>
    </div>
  )
}
```

### Implementation 4: A/B Test Setup

```javascript
// On page load
useEffect(() => {
  ABTestingFramework.createTest('cta-text-v1', {
    name: 'CTA Text Test',
    hypothesis: 'Action verbs increase CTR by 15%',
    variants: [
      { id: 'control', name: 'Learn More' },
      { id: 'variant', name: 'See How It Works' }
    ]
  })
}, [])

// When user clicks CTA
function onDemoClick() {
  const variant = assignVariant('cta-text-v1', userId)
  recordConversion('cta-text-v1', variant)
}
```

---

## KEY METRICS TO WATCH

### Baseline Metrics (Before Implementation)
- Current conversion rate: ____%
- Current exit rate: ____%
- Avg session duration: _____ seconds
- Avg scroll depth: _____%

### Target Metrics (After 2 Weeks)
- Conversion rate: +15-25%
- Exit rate: -10-15%
- Session duration: +30-60 seconds
- Scroll depth: +10-20%

### Success Criteria
- At least 100 sessions tracked
- Statistical significance (p > 0.95)
- Positive trend in 3+ metrics

---

## TROUBLESHOOTING QUICK ANSWERS

### Q: Debug panel not showing?
**A:** Check `enableDebugPanel={true}` in component props

### Q: Exit intent not firing?
**A:** Check `exitProbability > 0.7` in metrics; may need more data

### Q: Predictions all "exploring"?
**A:** User needs to scroll/interact more. Normal for first 30 seconds.

### Q: CTA tracking not working?
**A:** Verify `onCTAClick()` is called with correct ctaId

### Q: Scroll depth low?
**A:** Content above fold may be too long. Reduce hero height.

---

## PRIVACY CHECKLIST

- [ ] Users can opt-out: `localStorage.setItem('jinki_tracking_optout', 'true')`
- [ ] Respect Do Not Track header
- [ ] Show privacy policy notice
- [ ] No personal data collected
- [ ] No cookies set (localStorage only)
- [ ] Data cleared on browser clear

---

## NEXT A/B TEST IDEAS

1. **CTA Button Style** - Solid vs. Outline vs. Ghost
2. **Content Order** - Different section arrangements
3. **Video vs. Image** - Engagement comparison
4. **Form Fields** - Reduce fields vs. multi-step
5. **Price Display** - Show yearly savings vs. monthly
6. **Social Proof** - Different testimonials/stats
7. **Mobile Layout** - Sticky CTA vs. scrollable

---

## SUCCESS STORY TEMPLATE

**Before:**
```
Conversion Rate: 2.1%
Exit Rate: 45%
Avg Session: 45 seconds
```

**After (Predictive System):**
```
Conversion Rate: 3.8% (+81%)
Exit Rate: 31% (-31%)
Avg Session: 78 seconds (+73%)
```

**Implementation Time:** 2 hours
**Time to First Result:** 3 days
**ROI:** $X,000+ per month

---

## FINAL CHECKLIST

- [ ] Import PredictiveAssistant component
- [ ] Wrap app with component
- [ ] Register at least 3 sections
- [ ] Add CTA click tracking
- [ ] Enable debug panel
- [ ] Monitor for 24 hours
- [ ] Create first A/B test
- [ ] Collect 100+ samples per variant
- [ ] Calculate significance
- [ ] Deploy winning variant
- [ ] Create next test
- [ ] Repeat monthly

**Estimated first month improvement: +18% conversion rate**

---

*Remember: Anticipation beats reaction. Know what users want before they ask.*
