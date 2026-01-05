# FLOWMASTER CTA & CONVERSION IMPLEMENTATION GUIDE
## Jinki Intelligence - Ready-to-Build Specifications

---

## PART 1: FLOATING CTA BUTTON IMPLEMENTATION

### Component Specifications

```jsx
// FloatingCTA.jsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './FloatingCTA.css';

const FloatingCTA = ({ ctaRef = useRef(null) }) => {
  const [section, setSection] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // CTA Configuration by section
  const ctaConfig = {
    hero: {
      text: 'Schedule Assessment',
      icon: '📅',
      color: 'cyan',
      action: () => scrollToElement('#contact'),
      tooltip: 'Get your free audit'
    },
    problems: {
      text: 'See Your Savings',
      icon: '💰',
      color: 'amber',
      action: () => openCalculator(),
      tooltip: 'Calculate your ROI'
    },
    solutions: {
      text: 'View Case Study',
      icon: '📊',
      color: 'green',
      action: () => downloadCaseStudy(),
      tooltip: '10+ success stories'
    },
    trust: {
      text: 'Talk to Expert',
      icon: '👤',
      color: 'blue',
      action: () => openCalendly(),
      tooltip: 'Meet Abdillahi'
    },
    platform: {
      text: 'Request Demo',
      icon: '▶️',
      color: 'purple',
      action: () => bookDemo(),
      tooltip: 'See it in action'
    },
    cta: {
      text: 'Get Quote',
      icon: '✓',
      color: 'cyan-bright',
      action: () => scrollToElement('#contact'),
      tooltip: 'Complete your journey'
    }
  };

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(scrollPercent);

      // Determine section
      const heroElement = document.querySelector('.hero');
      const problemsElement = document.querySelector('[data-section="problems"]');
      const solutionsElement = document.querySelector('[data-section="solutions"]');
      const trustElement = document.querySelector('[data-section="trust"]');
      const platformElement = document.querySelector('[data-section="platform"]');
      const ctaElement = document.querySelector('[data-section="cta"]');

      if (scrollTop < heroElement?.offsetHeight) setSection('hero');
      else if (scrollTop < problemsElement?.offsetTop) setSection('hero');
      else if (scrollTop < solutionsElement?.offsetTop) setSection('problems');
      else if (scrollTop < trustElement?.offsetTop) setSection('solutions');
      else if (scrollTop < platformElement?.offsetTop) setSection('trust');
      else if (scrollTop < ctaElement?.offsetTop) setSection('platform');
      else setSection('cta');
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle CTA click
  const handleClick = () => {
    ctaConfig[section].action();
    // Track conversion
    window.analytics?.track('floating_cta_click', { section });
  };

  const config = ctaConfig[section];

  return (
    <motion.div
      ref={ctaRef}
      className={`floating-cta floating-cta--${config.color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDismissed ? 0 : 1, y: isDismissed ? 100 : 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main button */}
      <motion.button
        className="floating-cta__button"
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={config.tooltip}
      >
        <span className="floating-cta__icon">{config.icon}</span>
        <span className="floating-cta__text">{config.text}</span>
        <span className="floating-cta__arrow">→</span>
      </motion.button>

      {/* Progress bar */}
      <div className="floating-cta__progress-bar">
        <motion.div
          className="floating-cta__progress-fill"
          initial={{ width: '0%' }}
          animate={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Dismiss button */}
      <button
        className="floating-cta__dismiss"
        onClick={() => setIsDismissed(true)}
        title="Dismiss for 30 seconds"
      >
        ✕
      </button>
    </motion.div>
  );
};

export default FloatingCTA;
```

### CSS Styling

```css
/* FloatingCTA.css */

.floating-cta {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 90;
  display: flex;
  flex-direction: column;
  gap: 8px;
  will-change: transform, opacity;
}

/* Desktop layout */
@media (min-width: 1024px) {
  .floating-cta {
    right: 32px;
    bottom: 32px;
  }
}

/* Mobile layout - bottom sheet */
@media (max-width: 768px) {
  .floating-cta {
    right: 12px;
    left: 12px;
    bottom: 12px;
    flex-direction: row;
  }

  .floating-cta__button {
    flex: 1;
  }
}

/* Button styles */
.floating-cta__button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--cyan);
  color: var(--slate-900);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 180, 216, 0.3);
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.floating-cta__button:hover {
  box-shadow: 0 12px 32px rgba(0, 180, 216, 0.5);
  transform: translateY(-2px);
}

.floating-cta__button:active {
  transform: translateY(0);
}

.floating-cta__icon {
  flex-shrink: 0;
  font-size: 1rem;
  line-height: 1;
}

.floating-cta__text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.floating-cta__arrow {
  flex-shrink: 0;
  opacity: 0.8;
}

/* Color variants */
.floating-cta--cyan .floating-cta__button {
  background: linear-gradient(135deg, var(--cyan) 0%, var(--cyan-dim) 100%);
  box-shadow: 0 8px 24px rgba(0, 180, 216, 0.3);
}

.floating-cta--amber .floating-cta__button {
  background: linear-gradient(135deg, #ff9500 0%, #ff7f00 100%);
  box-shadow: 0 8px 24px rgba(255, 149, 0, 0.3);
}

.floating-cta--green .floating-cta__button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.floating-cta--blue .floating-cta__button {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

.floating-cta--purple .floating-cta__button {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}

.floating-cta--cyan-bright .floating-cta__button {
  background: linear-gradient(135deg, var(--cyan-bright) 0%, var(--cyan) 100%);
  box-shadow: 0 8px 24px rgba(0, 229, 255, 0.4);
}

/* Progress bar */
.floating-cta__progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

.floating-cta__progress-fill {
  height: 100%;
  background: currentColor;
  border-radius: 0 0 12px 12px;
}

/* Dismiss button */
.floating-cta__dismiss {
  align-self: flex-end;
  width: 32px;
  height: 32px;
  background: rgba(139, 148, 158, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--slate-400);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-cta__dismiss:hover {
  background: rgba(139, 148, 158, 0.3);
  color: var(--white);
}

/* Mobile dismiss */
@media (max-width: 768px) {
  .floating-cta__dismiss {
    align-self: center;
  }
}

/* Animation on entry */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.floating-cta__button {
  animation: slideUp 0.5s ease-out 0.5s both;
}

/* Pulse on new section */
.floating-cta__button.pulse {
  animation: pulse 0.5s ease;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

---

## PART 2: EXIT INTENT MODAL IMPLEMENTATION

### Component Code

```jsx
// ExitIntentModal.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ExitIntentModal.css';

const ExitIntentModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [visitorSegment, setVisitorSegment] = useState('cold');
  const [dismissed, setDismissed] = useState(false);

  // Determine visitor segment
  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem('visitorProfile') || '{}');

    if (profile.visitCount > 2 && profile.timeOnPage > 180000) {
      setVisitorSegment('hot');
    } else if (profile.timeOnPage > 90000 || profile.industryViewed) {
      setVisitorSegment('warm');
    } else {
      setVisitorSegment('cold');
    }
  }, []);

  // Detect exit intent
  useEffect(() => {
    if (dismissed) return;

    const handleMouseLeave = (e) => {
      // Only trigger at top of page
      if (e.clientY < 0) {
        setIsVisible(true);
      }
    };

    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      // Show at 70% scroll
      if (scrollPercent > 70 && !isVisible) {
        setIsVisible(true);
      }
    };

    // Only add listener if not dismissed
    if (!dismissed) {
      document.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('scroll', handleScroll);

      return () => {
        document.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [dismissed, isVisible]);

  const modalContent = {
    cold: {
      title: '🚀 Wait! One More Thing',
      subtitle: 'Get your FREE Infrastructure Audit Report',
      description: '(Customized to your industry)',
      benefits: [
        'Vulnerable areas in your system',
        'Downtime risk assessment',
        'Recommended monitoring strategy'
      ],
      ctaText: 'Get Free Report',
      secondaryCta: 'Maybe Later',
      formFields: [{ type: 'email', placeholder: 'Enter email address' }],
      note: 'Takes 2 minutes. No credit card.',
      action: 'email_capture'
    },
    warm: {
      title: '⏰ Limited: First Consultation 20% OFF',
      subtitle: 'We noticed you're serious about this',
      description: 'Schedule a 30-minute consultation this week',
      benefits: [
        'Understand your compliance gaps',
        'Calculate ROI specific to your operations',
        'Plan your monitoring upgrade'
      ],
      ctaText: 'Schedule Call',
      secondaryCta: 'Send Proposal',
      note: 'Offer expires in 24 hours',
      action: 'calendly'
    },
    hot: {
      title: '🎯 Meet Your Implementation Expert',
      subtitle: "You've done your research",
      description: 'Ready to talk implementation with Abdillahi?',
      benefits: [
        '20+ years enterprise security experience',
        'Guides 50+ Fortune 500 companies',
        'Zero-trust architecture specialist'
      ],
      ctaText: 'Schedule Expert Call',
      secondaryCta: 'Email Proposal',
      note: 'Pick your time. No back & forth.',
      action: 'expert_intro'
    }
  };

  const content = modalContent[visitorSegment];

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');

    // Send to backend
    fetch('/api/lead-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        segment: visitorSegment,
        source: 'exit_intent_modal'
      })
    });

    // Track event
    window.analytics?.track('exit_intent_converted', {
      segment: visitorSegment,
      action: content.action
    });

    // Show confirmation
    setIsVisible(false);
    setDismissed(true);

    // Mark in localStorage
    const profile = JSON.parse(localStorage.getItem('visitorProfile') || '{}');
    profile.emailCaptured = true;
    localStorage.setItem('visitorProfile', JSON.stringify(profile));
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="exit-intent__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsVisible(false);
              setDismissed(true);
            }}
          />

          {/* Modal */}
          <motion.div
            className={`exit-intent__modal exit-intent__modal--${visitorSegment}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              className="exit-intent__close"
              onClick={() => {
                setIsVisible(false);
                setDismissed(true);
              }}
            >
              ✕
            </button>

            {/* Content */}
            <div className="exit-intent__header">
              <h2>{content.title}</h2>
              <p className="exit-intent__subtitle">{content.subtitle}</p>
            </div>

            {content.action === 'email_capture' && (
              <>
                <p className="exit-intent__description">{content.description}</p>

                <div className="exit-intent__benefits">
                  <p className="exit-intent__benefits-title">We'll analyze:</p>
                  <ul>
                    {content.benefits.map((benefit, i) => (
                      <li key={i}>✓ {benefit}</li>
                    ))}
                  </ul>
                </div>

                <form onSubmit={handleSubmit} className="exit-intent__form">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    required
                    className="exit-intent__input"
                  />
                  <button type="submit" className="exit-intent__cta">
                    {content.ctaText} →
                  </button>
                </form>

                <p className="exit-intent__note">{content.note}</p>
              </>
            )}

            {content.action === 'calendly' && (
              <>
                <p className="exit-intent__description">{content.description}</p>

                <div className="exit-intent__benefits">
                  {content.benefits.map((benefit, i) => (
                    <div key={i} className="exit-intent__benefit-item">
                      → {benefit}
                    </div>
                  ))}
                </div>

                <div className="exit-intent__actions">
                  <a
                    href="https://calendly.com/jinki"
                    className="exit-intent__cta"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      window.analytics?.track('exit_intent_calendly_clicked', {
                        segment: visitorSegment
                      });
                    }}
                  >
                    {content.ctaText}
                  </a>
                  <button
                    className="exit-intent__secondary"
                    onClick={() => {
                      // Open email proposal
                      setIsVisible(false);
                    }}
                  >
                    {content.secondaryCta}
                  </button>
                </div>

                <p className="exit-intent__note">{content.note}</p>
              </>
            )}

            {content.action === 'expert_intro' && (
              <>
                <div className="exit-intent__benefits">
                  {content.benefits.map((benefit, i) => (
                    <div key={i} className="exit-intent__benefit-item">
                      <span className="exit-intent__checkmark">✓</span>
                      {benefit}
                    </div>
                  ))}
                </div>

                <div className="exit-intent__actions">
                  <a
                    href="https://calendly.com/abdillahi-jinki"
                    className="exit-intent__cta"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      window.analytics?.track('exit_intent_expert_clicked', {
                        segment: visitorSegment
                      });
                    }}
                  >
                    {content.ctaText}
                  </a>
                  <button className="exit-intent__secondary">
                    {content.secondaryCta}
                  </button>
                </div>

                <p className="exit-intent__note">{content.note}</p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentModal;
```

### Exit Intent CSS

```css
/* ExitIntentModal.css */

.exit-intent__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 99;
}

.exit-intent__modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  max-width: 480px;
  width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  padding: 40px 32px;
  background: var(--slate-900);
  border: 1px solid var(--slate-700);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

/* Segment variants */
.exit-intent__modal--cold {
  border-color: rgba(0, 180, 216, 0.2);
  box-shadow: 0 20px 60px rgba(0, 180, 216, 0.1);
}

.exit-intent__modal--warm {
  border-color: rgba(255, 149, 0, 0.2);
  box-shadow: 0 20px 60px rgba(255, 149, 0, 0.1);
}

.exit-intent__modal--hot {
  border-color: rgba(59, 130, 246, 0.2);
  box-shadow: 0 20px 60px rgba(59, 130, 246, 0.1);
}

/* Close button */
.exit-intent__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background: rgba(139, 148, 158, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--slate-400);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.exit-intent__close:hover {
  background: rgba(139, 148, 158, 0.2);
  color: var(--white);
}

/* Header */
.exit-intent__header {
  margin-bottom: 24px;
}

.exit-intent__header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--white);
}

.exit-intent__subtitle {
  font-size: 0.875rem;
  color: var(--slate-400);
}

.exit-intent__description {
  font-size: 0.9375rem;
  color: var(--slate-300);
  margin-bottom: 20px;
}

/* Benefits */
.exit-intent__benefits {
  margin: 24px 0;
}

.exit-intent__benefits-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--slate-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.exit-intent__benefits ul {
  list-style: none;
  padding: 0;
}

.exit-intent__benefits li {
  padding: 8px 0;
  color: var(--slate-300);
  font-size: 0.9375rem;
}

.exit-intent__benefit-item {
  padding: 12px 0;
  color: var(--slate-300);
  font-size: 0.9375rem;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.exit-intent__checkmark {
  flex-shrink: 0;
  color: var(--cyan);
  font-weight: 700;
}

/* Form */
.exit-intent__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0;
}

.exit-intent__input {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--white);
  font-size: 0.9375rem;
  transition: all 0.2s ease;
}

.exit-intent__input:focus {
  outline: none;
  border-color: var(--cyan);
  background: rgba(0, 180, 216, 0.05);
  box-shadow: 0 0 12px rgba(0, 180, 216, 0.2);
}

.exit-intent__input::placeholder {
  color: var(--slate-500);
}

/* Actions */
.exit-intent__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0;
}

.exit-intent__cta {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--cyan-dim) 100%);
  color: var(--slate-900);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.exit-intent__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 180, 216, 0.3);
}

.exit-intent__secondary {
  padding: 12px 24px;
  background: transparent;
  color: var(--cyan);
  border: 1px solid var(--cyan);
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.exit-intent__secondary:hover {
  background: rgba(0, 180, 216, 0.1);
}

/* Note */
.exit-intent__note {
  text-align: center;
  font-size: 0.75rem;
  color: var(--slate-500);
  margin-top: 16px;
}

/* Mobile */
@media (max-width: 640px) {
  .exit-intent__modal {
    max-width: 100%;
    width: 100%;
    max-height: 100%;
    border-radius: 16px 16px 0 0;
    padding: 32px 24px;
  }

  .exit-intent__header h2 {
    font-size: 1.25rem;
  }

  .exit-intent__actions {
    flex-direction: row;
  }

  .exit-intent__cta,
  .exit-intent__secondary {
    flex: 1;
  }
}
```

---

## PART 3: SECTION REORGANIZATION CHECKLIST

### Current State → Optimized State

```
CURRENT LAYOUT:
1. Hero
2. Industries (cards)
3. Platform
4. Advisory
5. CTA
6. Footer

OPTIMIZED LAYOUT:
1. Hero + Problem Validation
2. Problem Cards Section (NEW)
3. Industry Solutions (Tabbed)
4. Trust & Social Proof (Repositioned)
5. Platform Comparison (Moved)
6. ROI Calculator (NEW)
7. Final CTA + Exit Intent
8. Footer + Retention

IMPLEMENTATION STEPS:
[ ] Step 1: Add data-section attributes to all major sections
    └─ <section data-section="problems">
    └─ <section data-section="solutions">
    └─ <section data-section="trust">
    └─ <section data-section="platform">
    └─ <section data-section="cta">

[ ] Step 2: Create Problem Cards component
    └─ 4 cards with hover expand
    └─ Styling matches design language
    └─ Mobile responsive

[ ] Step 3: Convert Industries to Tabs
    └─ Create TabSelector component
    └─ One industry visible at a time
    └─ Smooth transitions
    └─ Mobile: Horizontal scroll tabs

[ ] Step 4: Reorganize Advisory
    └─ Move from standalone section
    └─ Integrate into Trust section
    └─ Add logos + certs above

[ ] Step 5: Platform to comparison table
    └─ Create FeatureComparison component
    └─ Toggle: All features vs. my industry
    └─ Add competitor comparison rows

[ ] Step 6: Create ROI Calculator
    └─ 4-5 question form
    └─ Real-time calculation
    └─ Email results option
    └─ Lead capture

[ ] Step 7: Integrate Exit Intent Modal
    └─ 3-variant system (cold/warm/hot)
    └─ Trigger logic
    └─ Lead capture
    └─ Tracking

[ ] Step 8: Add Floating CTA
    └─ Sticky button (right side)
    └─ Changes per section
    └─ Mobile: bottom sticky
    └─ Scroll progress bar

[ ] Step 9: Add Breadcrumbs/Progress
    └─ Show at top of key sections
    └─ "Step X of 3"
    └─ Progress bar indicator

[ ] Step 10: Return Visitor Detection
    └─ localStorage tracking
    └─ localStorage personalization
    └─ Display welcome back banner
```

---

## PART 4: A/B TESTING SETUP

### Test Configuration Template

```javascript
// ABTestManager.js
class ABTestManager {
  constructor() {
    this.tests = {};
    this.variants = {};
  }

  createTest(testId, variants, sampleSizePerVariant = 500) {
    this.tests[testId] = {
      id: testId,
      startDate: new Date(),
      variants: variants.map(v => v.id),
      sampleSizePerVariant,
      results: {}
    };

    // Initialize tracking
    variants.forEach(v => {
      this.results[`${testId}_${v.id}`] = {
        views: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        conversionRate: 0
      };
    });
  }

  assignVariant(testId, userId) {
    // Deterministic assignment based on user hash
    const hash = this.hashCode(userId);
    const variants = this.tests[testId].variants;
    const index = Math.abs(hash) % variants.length;
    return variants[index];
  }

  trackView(testId, variantId, userId) {
    const key = `${testId}_${variantId}`;
    this.results[key].views++;

    // Send to analytics
    window.analytics?.track('ab_test_view', {
      test: testId,
      variant: variantId,
      userId
    });
  }

  trackClick(testId, variantId, userId) {
    const key = `${testId}_${variantId}`;
    this.results[key].clicks++;
    this.calculateCTR(key);

    window.analytics?.track('ab_test_click', {
      test: testId,
      variant: variantId,
      userId
    });
  }

  trackConversion(testId, variantId, userId, value) {
    const key = `${testId}_${variantId}`;
    this.results[key].conversions++;
    this.calculateConversionRate(key);

    window.analytics?.track('ab_test_conversion', {
      test: testId,
      variant: variantId,
      userId,
      value
    });
  }

  calculateCTR(key) {
    const result = this.results[key];
    result.ctr = result.views > 0 ? (result.clicks / result.views) * 100 : 0;
  }

  calculateConversionRate(key) {
    const result = this.results[key];
    result.conversionRate = result.views > 0 ? (result.conversions / result.views) * 100 : 0;
  }

  getResults(testId) {
    return this.results;
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

export default new ABTestManager();
```

### Usage Example

```jsx
// App.jsx
import ABTestManager from './utils/ABTestManager';

// Initialize tests
useEffect(() => {
  ABTestManager.createTest('hero_cta_copy', [
    { id: 'control', text: 'Schedule Assessment' },
    { id: 'urgency', text: 'Get Free Risk Assessment' },
    { id: 'fomo', text: 'Schedule Your Audit' }
  ], 500);

  ABTestManager.createTest('hero_stats', [
    { id: 'control', format: 'simple' },
    { id: 'comparative', format: 'vs_industry' }
  ], 500);
}, []);

// In Hero component
const userId = getUserId(); // Get or generate UUID
const ctaCopyVariant = ABTestManager.assignVariant('hero_cta_copy', userId);
const statsVariant = ABTestManager.assignVariant('hero_stats', userId);

// Track exposure
useEffect(() => {
  ABTestManager.trackView('hero_cta_copy', ctaCopyVariant, userId);
  ABTestManager.trackView('hero_stats', statsVariant, userId);
}, []);

// Track interaction
const handleCTAClick = () => {
  ABTestManager.trackClick('hero_cta_copy', ctaCopyVariant, userId);
};

// Track conversion
const handleConversion = (value) => {
  ABTestManager.trackConversion('hero_cta_copy', ctaCopyVariant, userId, value);
};
```

---

## PART 5: RETURN VISITOR DETECTION

### localStorage Integration

```javascript
// visitorTracking.js
export const VisitorTracker = {
  // Initialize profile
  initProfile() {
    let profile = JSON.parse(localStorage.getItem('visitorProfile'));

    if (!profile) {
      profile = {
        visitCount: 1,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        totalTimeSpent: 0,
        industriesViewed: [],
        ctasClicked: [],
        emailCaptured: false,
        calendarlyScheduled: false,
        segment: 'cold'
      };
    } else {
      profile.visitCount++;
      profile.lastVisit = new Date().toISOString();
    }

    localStorage.setItem('visitorProfile', JSON.stringify(profile));
    return profile;
  },

  // Track section view
  trackSectionView(sectionName, timeSpent) {
    const profile = JSON.parse(localStorage.getItem('visitorProfile')) || {};

    const existing = profile.industriesViewed?.find(s => s.name === sectionName);
    if (existing) {
      existing.timeViewed += timeSpent;
      existing.lastViewed = new Date().toISOString();
    } else {
      if (!profile.industriesViewed) profile.industriesViewed = [];
      profile.industriesViewed.push({
        name: sectionName,
        timeViewed: timeSpent,
        lastViewed: new Date().toISOString(),
        calculatorUsed: false
      });
    }

    localStorage.setItem('visitorProfile', JSON.stringify(profile));
  },

  // Track CTA click
  trackCTAClick(ctaName) {
    const profile = JSON.parse(localStorage.getItem('visitorProfile')) || {};

    if (!profile.ctasClicked) profile.ctasClicked = [];
    if (!profile.ctasClicked.includes(ctaName)) {
      profile.ctasClicked.push(ctaName);
    }

    localStorage.setItem('visitorProfile', JSON.stringify(profile));
  },

  // Track calculator usage
  trackCalculatorUse(industryName) {
    const profile = JSON.parse(localStorage.getItem('visitorProfile')) || {};

    const industry = profile.industriesViewed?.find(i => i.name === industryName);
    if (industry) {
      industry.calculatorUsed = true;
    }

    profile.calculatorUsed = true;
    localStorage.setItem('visitorProfile', JSON.stringify(profile));
  },

  // Determine segment
  getSegment() {
    const profile = JSON.parse(localStorage.getItem('visitorProfile')) || {};

    if (profile.visitCount > 3 && profile.ctasClicked?.length > 2) {
      return 'hot';
    } else if (profile.timeOnPage > 180000 || profile.industriesViewed?.length > 1) {
      return 'warm';
    }
    return 'cold';
  },

  // Get profile
  getProfile() {
    return JSON.parse(localStorage.getItem('visitorProfile')) || {};
  }
};
```

### Usage in Components

```jsx
// In App.jsx
import { VisitorTracker } from './utils/visitorTracking';

useEffect(() => {
  const profile = VisitorTracker.initProfile();

  // Show personalized welcome
  if (profile.visitCount > 1) {
    showReturnVisitorBanner(profile);
  }
}, []);

// In Hero component
<FloatingCTA segment={VisitorTracker.getSegment()} />

// In Industries section
const handleIndustrySelect = (industry) => {
  VisitorTracker.trackSectionView(industry.name, timeSpent);
};

// In Exit Intent
const visitorSegment = VisitorTracker.getSegment();
<ExitIntentModal segment={visitorSegment} />
```

---

## IMPLEMENTATION PRIORITY

### Priority 1 (Week 1) - Must Have
- [ ] Floating CTA button (changes per section)
- [ ] Exit intent modal (email capture)
- [ ] Basic return visitor detection

### Priority 2 (Week 2) - High Value
- [ ] Problem cards section
- [ ] Industry tabbed selector
- [ ] Repositioned trust section
- [ ] Breadcrumb indicators

### Priority 3 (Week 3) - Growth
- [ ] ROI calculator
- [ ] Exit intent segmentation (3 variants)
- [ ] Return visitor personalization
- [ ] A/B testing framework

### Priority 4 (Week 4+) - Optimization
- [ ] Platform comparison table
- [ ] Advanced personalization
- [ ] Newsletter integration
- [ ] Progressive discounting

---

## SUCCESS METRICS

```javascript
const successMetrics = {
  conversionRate: {
    baseline: 1.2,
    target: 4.8,
    unit: '%'
  },
  bounceRate: {
    baseline: 42,
    target: 25,
    unit: '%'
  },
  avgSessionDuration: {
    baseline: 80,
    target: 225,
    unit: 'seconds'
  },
  emailCaptureRate: {
    baseline: 0.3,
    target: 2.1,
    unit: '%'
  },
  floatingCTAUtilization: {
    baseline: 0,
    target: 8,
    unit: '%'
  },
  exitIntentRecovery: {
    baseline: 0,
    target: 12,
    unit: '%'
  },
  returnVisitorConversion: {
    baseline: 0.6,
    target: 2.4,
    unit: '%'
  }
};
```

---

**Ready to implement? Start with Priority 1, measure, then move to Priority 2.**
