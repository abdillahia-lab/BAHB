# MICROFEEDBACK - ADVANCED PATTERNS & USE CASES

**Complex micro-interaction patterns for real-world scenarios**

---

## Table of Contents

1. [Advanced Button Patterns](#advanced-button-patterns)
2. [Gesture-Based Animations](#gesture-based-animations)
3. [Scroll-Triggered Animations](#scroll-triggered-animations)
4. [Complex Form Interactions](#complex-form-interactions)
5. [Real-Time Feedback Systems](#real-time-feedback-systems)
6. [Navigation Patterns](#navigation-patterns)
7. [Data Visualization Animations](#data-visualization-animations)
8. [Page Transitions](#page-transitions)

---

## Advanced Button Patterns

### Multi-State Button with Loading

```jsx
import { MicroButton, MicroSpinner, MicroFormFeedback } from './MicroInteractionComponents'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { TIMING, feedbackVariants } from '../utils/microInteractions'

export function AdvancedAsyncButton() {
  const [state, setState] = useState('idle') // idle | loading | success | error

  const handleClick = async () => {
    setState('loading')

    try {
      // Simulate async operation
      await new Promise(r => setTimeout(r, 2000))
      setState('success')

      // Reset after delay
      setTimeout(() => setState('idle'), 2000)
    } catch (error) {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }

  return (
    <div className="relative inline-block">
      {state === 'idle' && (
        <MicroButton onClick={handleClick}>
          Submit Form
        </MicroButton>
      )}

      {state === 'loading' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2"
        >
          <MicroSpinner size="sm" />
          <span>Processing...</span>
        </motion.div>
      )}

      {state === 'success' && (
        <motion.div
          variants={feedbackVariants.success}
          initial="initial"
          animate="animate"
          className="text-green-600 font-semibold"
        >
          ✓ Success!
        </motion.div>
      )}

      {state === 'error' && (
        <motion.div
          variants={feedbackVariants.error}
          animate="animate"
          className="text-red-600 font-semibold"
        >
          ✕ Try Again
        </motion.div>
      )}
    </div>
  )
}
```

### Button with Progress Indicator

```jsx
import { motion } from 'framer-motion'
import { TIMING } from '../utils/microInteractions'

export function ProgressButton({ progress = 0.5 }) {
  return (
    <motion.button
      className="relative px-6 py-3 bg-blue-500 text-white rounded-lg overflow-hidden"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Progress bar */}
      <motion.div
        className="absolute inset-0 bg-blue-600 opacity-50"
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <span className="relative z-10">
        {Math.round(progress * 100)}% Complete
      </span>
    </motion.button>
  )
}
```

### Segmented Button Group

```jsx
import { motion } from 'framer-motion'
import { useState } from 'react'
import { TIMING } from '../utils/microInteractions'

export function SegmentedButtonGroup({ options = [] }) {
  const [selected, setSelected] = useState(0)

  return (
    <div className="flex gap-1 p-1 bg-gray-200 rounded-lg">
      {options.map((option, i) => (
        <motion.button
          key={i}
          onClick={() => setSelected(i)}
          className={`flex-1 py-2 rounded relative ${
            selected === i ? 'text-white' : 'text-gray-700'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Animated background */}
          {selected === i && (
            <motion.div
              layoutId="activeSegment"
              className="absolute inset-0 bg-blue-500 rounded"
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
            />
          )}

          <span className="relative z-10">{option}</span>
        </motion.button>
      ))}
    </div>
  )
}
```

---

## Gesture-Based Animations

### Swipe-to-Delete Card

```jsx
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useState } from 'react'

export function SwipeDeleteCard({ onDelete, children }) {
  const [isDeleted, setIsDeleted] = useState(false)
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-200, 0], [0, 1])
  const rotate = useTransform(x, [-200, 0], [-20, 0])

  const handleDragEnd = () => {
    if (x.get() < -100) {
      // Trigger delete animation
      setIsDeleted(true)
      onDelete?.()
    } else {
      // Snap back
      x.set(0)
    }
  }

  return (
    <motion.div
      drag="x"
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      x={x}
      opacity={opacity}
      rotate={rotate}
      className="cursor-grab active:cursor-grabbing"
    >
      <div className="relative">
        {/* Delete indicator behind */}
        <div className="absolute inset-0 bg-red-500 rounded-lg flex items-center justify-end pr-4">
          <span className="text-white font-bold">Delete</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg p-4 shadow">
          {children}
        </div>
      </div>
    </motion.div>
  )
}
```

### Long-Press Button

```jsx
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { TIMING } from '../utils/microInteractions'

export function LongPressButton({ onLongPress, children }) {
  const [isPressed, setIsPressed] = useState(false)
  const timeoutRef = useRef(null)

  const handleMouseDown = () => {
    setIsPressed(true)
    timeoutRef.current = setTimeout(() => {
      onLongPress?.()
      setIsPressed(false)
    }, 500)
  }

  const handleMouseUp = () => {
    clearTimeout(timeoutRef.current)
    setIsPressed(false)
  }

  return (
    <motion.button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative px-6 py-3 bg-blue-500 text-white rounded-lg"
    >
      {/* Progress ring */}
      {isPressed && (
        <motion.svg
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.circle
            cx="50%"
            cy="50%"
            r="40%"
            fill="none"
            stroke="white"
            strokeWidth="2"
            pathLength={1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
        </motion.svg>
      )}

      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
```

---

## Scroll-Triggered Animations

### Parallax Background

```jsx
import { motion, useScroll, useTransform } from 'framer-motion'

export function ParallaxSection() {
  const { scrollY } = useScroll()
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 300])
  const textY = useTransform(scrollY, [0, 1000], [0, 100])

  return (
    <motion.section
      style={{
        backgroundImage: 'url(/parallax-bg.jpg)',
        backgroundPosition: '50%',
        y: backgroundY,
      }}
      className="relative h-screen"
    >
      <motion.h1 style={{ y: textY }} className="text-4xl text-white">
        Parallax Hero
      </motion.h1>
    </motion.section>
  )
}
```

### Scroll Progress with Multiple Indicators

```jsx
import { motion, useScroll, useSpring } from 'framer-motion'
import { useRef } from 'react'

export function AdvancedScrollProgress() {
  const ref = useRef(null)
  const { scrollYProgress: yProgress } = useScroll({
    target: ref,
  })

  // Smooth spring animation
  const yProgressSmoothed = useSpring(yProgress, {
    stiffness: 100,
    damping: 30,
  })

  return (
    <>
      {/* Main progress bar */}
      <motion.div
        className="fixed top-0 left-0 h-1 bg-blue-500 z-50"
        style={{ scaleX: yProgressSmoothed }}
        transformOrigin="0%"
      />

      {/* Circular progress */}
      <motion.div className="fixed bottom-8 right-8">
        <svg width="60" height="60" className="transform -rotate-90">
          <motion.circle
            cx="30"
            cy="30"
            r="25"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray={2 * Math.PI * 25}
            style={{
              strokeDashoffset: useTransform(
                yProgressSmoothed,
                [0, 1],
                [2 * Math.PI * 25, 0]
              ),
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
          <motion.span>
            {useTransform(yProgressSmoothed, v => `${Math.round(v * 100)}%`)}
          </motion.span>
        </div>
      </motion.div>

      <div ref={ref} className="h-[200vh]">
        {/* Scrollable content */}
      </div>
    </>
  )
}
```

### Fade In on Scroll

```jsx
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

export function FadeInOnScroll({ children, delay = 0 }) {
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}
```

---

## Complex Form Interactions

### Multi-Step Form with Progress

```jsx
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { MicroButton, MicroInput } from './MicroInteractionComponents'
import { TIMING } from '../utils/microInteractions'

export function MultiStepForm() {
  const [step, setStep] = useState(0)
  const steps = ['Email', 'Password', 'Profile', 'Confirm']

  return (
    <div className="w-full max-w-md">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 h-1 bg-gray-200 rounded overflow-hidden"
            >
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: i < step ? '100%' : '0%' }}
                transition={{ duration: TIMING.NORMAL }}
              />
            </motion.div>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Step {step + 1} of {steps.length}
        </p>
      </div>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: TIMING.QUICK }}
        >
          {step === 0 && <MicroInput label="Email" type="email" />}
          {step === 1 && <MicroInput label="Password" type="password" />}
          {step === 2 && <MicroInput label="Full Name" />}
          {step === 3 && <p>Review and confirm all information</p>}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex gap-4 mt-8">
        <MicroButton
          onClick={() => setStep(Math.max(0, step - 1))}
          variant="secondary"
          disabled={step === 0}
        >
          Previous
        </MicroButton>

        <MicroButton
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          variant="primary"
        >
          {step === steps.length - 1 ? 'Submit' : 'Next'}
        </MicroButton>
      </div>
    </div>
  )
}
```

### Inline Form Validation with Live Feedback

```jsx
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { MicroInput } from './MicroInteractionComponents'

export function LiveValidationForm() {
  const [email, setEmail] = useState('')
  const [validation, setValidation] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!email) {
        setValidation(null)
      } else if (email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setValidation('valid')
      } else {
        setValidation('invalid')
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [email])

  return (
    <div className="space-y-4">
      <MicroInput
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={validation === 'invalid' ? 'Invalid email format' : ''}
        success={validation === 'valid'}
      />

      <AnimatePresence>
        {validation === 'valid' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm"
          >
            Email is valid and ready to use
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

## Real-Time Feedback Systems

### Status Badge with Animation

```jsx
import { motion } from 'framer-motion'

export function AnimatedStatusBadge({ status = 'active' }) {
  const statusConfig = {
    active: { color: 'bg-green-500', pulse: true },
    pending: { color: 'bg-yellow-500', pulse: true },
    offline: { color: 'bg-gray-500', pulse: false },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-3 h-3">
        <div className={`absolute inset-0 rounded-full ${config.color}`} />

        {config.pulse && (
          <motion.div
            className={`absolute inset-0 rounded-full ${config.color}`}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        )}
      </div>

      <span className="text-sm font-medium capitalize">{status}</span>
    </div>
  )
}
```

### Notification Counter

```jsx
import { motion } from 'framer-motion'

export function NotificationBadge({ count = 0 }) {
  return (
    <div className="relative w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer">
      <span>📬</span>

      {count > 0 && (
        <motion.div
          key={count}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 15,
          }}
        >
          {count > 99 ? '99+' : count}
        </motion.div>
      )}
    </div>
  )
}
```

---

## Navigation Patterns

### Animated Tab Navigation with Underline

```jsx
import { motion } from 'framer-motion'
import { useState } from 'react'

export function AnimatedTabs({ tabs = [] }) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex border-b border-gray-200 relative">
        {tabs.map((tab, i) => (
          <motion.button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-6 py-3 font-medium relative ${
              activeTab === i ? 'text-blue-600' : 'text-gray-600'
            }`}
            whileHover={{ color: '#2563eb' }}
          >
            {tab.label}

            {/* Animated underline */}
            {activeTab === i && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"
                layoutId="underline"
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="py-6"
      >
        {tabs[activeTab]?.content}
      </motion.div>
    </div>
  )
}
```

### Breadcrumb Navigation

```jsx
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

export function AnimatedBreadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center gap-2">
      {items.map((item, i) => (
        <motion.div key={i} className="flex items-center gap-2">
          <motion.a
            href={item.href}
            whileHover={{ color: '#2563eb' }}
            className="text-gray-600"
          >
            {item.label}
          </motion.a>

          {i < items.length - 1 && (
            <motion.div
              className="text-gray-400"
              whileHover={{ x: 3 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={16} />
            </motion.div>
          )}
        </motion.div>
      ))}
    </nav>
  )
}
```

---

## Data Visualization Animations

### Animated Counter

```jsx
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { useEffect } from 'react'

export function AnimatedCounter({ value = 0, duration = 1 }) {
  const count = useMotionValue(0)
  const rounded = useSpring(count, {
    damping: 15,
    mass: 1,
    stiffness: 100,
  })

  useEffect(() => {
    count.set(value)
  }, [value, count])

  return (
    <motion.span
      as="span"
      onUpdate={(latest) => {
        // Custom counter logic
      }}
    >
      {rounded}
    </motion.span>
  )
}
```

### Animated Progress Ring

```jsx
import { motion } from 'framer-motion'

export function ProgressRing({ value = 0.5 }) {
  const circumference = 2 * Math.PI * 45
  const offset = circumference * (1 - value)

  return (
    <div className="relative w-32 h-32">
      <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />

        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5 }}
        />
      </svg>

      {/* Center value */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span className="text-2xl font-bold">
          {Math.round(value * 100)}%
        </motion.span>
      </div>
    </div>
  )
}
```

---

## Page Transitions

### Fade Through Transition

```jsx
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

export function FadeThroughPageTransition({ children }) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

### Slide In Page Transition

```jsx
import { motion, AnimatePresence } from 'framer-motion'

export function SlidePageTransition({ children, direction = 'right' }) {
  const directions = {
    left: { from: 100, to: -100 },
    right: { from: -100, to: 100 },
  }

  const dir = directions[direction]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: dir.from }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: dir.to }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

---

## Combining Multiple Patterns

### Complete User Onboarding Flow

```jsx
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { MicroButton, MicroInput } from './MicroInteractionComponents'

export function OnboardingFlow() {
  const [stage, setStage] = useState('welcome')

  const stages = {
    welcome: {
      title: 'Welcome to Jinki Intelligence',
      content: <p>Let's get you started</p>,
      next: 'setup',
    },
    setup: {
      title: 'Set Up Your Account',
      content: <MicroInput label="Full Name" />,
      next: 'complete',
    },
    complete: {
      title: 'You're All Set!',
      content: <p>Your account is ready to use</p>,
    },
  }

  const current = stages[stage]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div
        key={stage}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl p-12 max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6">{current.title}</h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {current.content}
        </motion.div>

        {current.next && (
          <MicroButton
            onClick={() => setStage(current.next)}
            className="w-full mt-8"
          >
            Continue
          </MicroButton>
        )}
      </motion.div>
    </div>
  )
}
```

---

## Performance Considerations for Advanced Patterns

### Use Efficient Re-renders

```jsx
import React, { useMemo } from 'react'

// Memoize complex animations
const MemoizedAnimatedComponent = React.memo(
  ({ value }) => {
    const animationConfig = useMemo(() => ({
      duration: 0.3,
      easing: 'easeOut',
    }), [])

    return (
      <motion.div animate={animationConfig}>
        {value}
      </motion.div>
    )
  }
)
```

### Lazy Load Animation-Heavy Components

```jsx
import { lazy, Suspense } from 'react'

const HeavyAnimationComponent = lazy(() =>
  import('./HeavyAnimationComponent')
)

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyAnimationComponent />
    </Suspense>
  )
}
```

---

**Last Updated:** 2026-01-05
**Version:** 1.0.0

---

For more information, see:
- `MICROFEEDBACK_IMPLEMENTATION_GUIDE.md` - Comprehensive guide
- `MICROFEEDBACK_PERFORMANCE_GUIDE.md` - Performance optimization
- `MICROFEEDBACK_QUICK_REFERENCE.md` - Quick lookup guide
