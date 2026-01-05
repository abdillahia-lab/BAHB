/**
 * ════════════════════════════════════════════════════════════════
 * SMART ASSISTANCE INTEGRATION EXAMPLE
 * Complete example showing all Smart Assistance features
 * ════════════════════════════════════════════════════════════════
 */

import React, { useEffect } from 'react'
import {
  getSmartAssistanceEngine,
  useScrollTracking,
  useClickTracking,
  useSectionTracking,
  useConfusionDetector,
  SmartTooltip,
  GuidedTour,
  SmartSuggestions,
  FormAssistance,
  ReadingTime,
  SmartRecommendations,
} from './index'

/**
 * STEP 1: Initialize Smart Assistance in your main App component
 */
export function SmartAssistanceProvider({ children }) {
  const engine = getSmartAssistanceEngine()

  useEffect(() => {
    // Initialize user profile on first visit
    const isNewUser = localStorage.getItem('jinki_user_profile') === null
    if (isNewUser) {
      engine.userProfile.isFirstVisit = true
      engine.saveUserProfile()
    }

    return () => {
      // Cleanup on unmount
      engine.destroy()
    }
  }, [engine])

  // Global scroll and click tracking
  useScrollTracking()
  useClickTracking('main-app')

  return <>{children}</>
}

/**
 * STEP 2: Add Smart Assistance to your Hero Section
 */
export function HeroSectionWithAssistance() {
  useSectionTracking('hero')
  const { hasConfusion } = useConfusionDetector()

  const heroTourSteps = [
    {
      selector: '.hero-title',
      title: 'Welcome to Jinki Intelligence',
      description: 'Enterprise AI for drone inspection and cybersecurity',
      action: 'Explore below to see it in action',
    },
    {
      selector: '.hero-cta',
      title: 'Get Started',
      description: 'Schedule a free demo to see live drone inspection',
      action: 'Click when ready to book',
    },
  ]

  return (
    <section data-section="hero" className="hero-section">
      {/* Guided tour for first-time visitors */}
      <GuidedTour
        id="hero-tour"
        steps={heroTourSteps}
        autoStart={true}
      />

      {/* Smart suggestion if user seems confused */}
      <SmartSuggestions sectionId="hero" />

      <div className="hero-content">
        <h1 className="hero-title">
          Jinki Intelligence
          <SmartTooltip
            id="hero-title-tooltip"
            title="Our Mission"
            content="Protecting enterprises with AI-powered drone inspection and cybersecurity"
            trigger="hover"
          >
            <span style={{ cursor: 'help', textDecoration: 'underline dotted' }}>
              *
            </span>
          </SmartTooltip>
        </h1>

        <p className="hero-description">
          Advanced drone inspection + AI cybersecurity for enterprises
        </p>

        <SmartTooltip
          id="hero-cta"
          title="Start Your Journey"
          content="Book a 15-minute demo to see live drone footage and threat detection"
          trigger="hover"
          autoShow={true}
          delay={3000}
        >
          <button className="cta-button">Schedule Demo</button>
        </SmartTooltip>
      </div>
    </section>
  )
}

/**
 * STEP 3: Add Smart Assistance to Drone Inspection Section
 */
export function DroneInspectionSection() {
  useSectionTracking('drone-inspection')

  return (
    <section data-section="drone-inspection" className="drone-section">
      <div className="section-title">
        Drone Inspection in Action
        <SmartTooltip
          id="drone-info"
          title="Advanced Inspection"
          content="Our drones use AI to detect infrastructure issues before they become problems"
          trigger="hover"
        >
          <span className="info-icon">ℹ️</span>
        </SmartTooltip>
      </div>

      <SmartSuggestions sectionId="drone-inspection" />

      <div className="drone-demo">
        <SmartTooltip
          id="drone-demo"
          content="Click or drag to interact with the 3D drone model"
          trigger="hover"
        >
          <div style={{ padding: '20px', border: '1px solid #00ffc8' }}>
            {/* 3D Model would go here */}
            Interactive 3D Drone Model
          </div>
        </SmartTooltip>
      </div>
    </section>
  )
}

/**
 * STEP 4: Add Smart Assistance to Cybersecurity Section
 */
export function CybersecuritySection() {
  useSectionTracking('cybersecurity')

  const securityContent = `
    Our AI-powered cybersecurity platform detects threats in real-time using
    advanced machine learning algorithms. We analyze patterns across your
    infrastructure and provide actionable insights within milliseconds. The system
    learns from every interaction to improve protection over time, ensuring your
    enterprise stays ahead of emerging threats. With 99.99% uptime and enterprise-grade
    encryption, your data is protected 24/7.
  `

  return (
    <section data-section="cybersecurity" className="security-section" style={{ position: 'relative' }}>
      {/* Reading time estimate */}
      <ReadingTime
        content={securityContent}
        position="top-right"
        showIcon={true}
      />

      <div className="section-title">
        AI Cybersecurity
        <SmartTooltip
          id="security-info"
          title="Threat Detection"
          content="Real-time AI analysis of security threats with millisecond response times"
          trigger="hover"
        >
          <span className="info-icon">🔒</span>
        </SmartTooltip>
      </div>

      {/* Smart suggestions for this section */}
      <SmartSuggestions sectionId="cybersecurity" />

      <div className="security-content">
        <p>{securityContent}</p>
      </div>

      {/* Recommendations for related content */}
      <SmartRecommendations sectionId="cybersecurity" variant="card" />
    </section>
  )
}

/**
 * STEP 5: Add Smart Assistance to Contact Form
 */
export function ContactFormWithAssistance() {
  useSectionTracking('contact')
  const [formData, setFormData] = React.useState({
    email: '',
    company: '',
    useCase: '',
    message: '',
  })

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Track successful form submission
    const engine = getSmartAssistanceEngine()
    engine.recordAssistanceEngagement('contact_form', 'completeGuidedTour')

    console.log('Form submitted:', formData)
    // Submit form...
  }

  return (
    <section data-section="contact" className="contact-section">
      <h2>Get Started Today</h2>
      <SmartSuggestions sectionId="contact" />

      <form onSubmit={handleSubmit} className="contact-form">
        {/* Smart form fields with validation and suggestions */}
        <FormAssistance
          fieldName="email"
          label="Email Address"
          placeholder="you@company.com"
          type="email"
          config={{
            hint: 'We\'ll send you setup instructions and a demo invite',
            validation: 'email',
            errorMessage: 'Please enter a valid email address',
          }}
          value={formData.email}
          onChange={(value) => handleFormChange('email', value)}
          required
        />

        <FormAssistance
          fieldName="company"
          label="Company Name"
          placeholder="Your organization"
          config={{
            hint: 'Helps us understand your industry and needs',
            suggestions: ['Tech Startup', 'Enterprise Corp', 'Government', 'Healthcare', 'Finance'],
          }}
          value={formData.company}
          onChange={(value) => handleFormChange('company', value)}
          required
        />

        <FormAssistance
          fieldName="useCase"
          label="What are you interested in?"
          placeholder="Select your primary use case"
          config={{
            hint: 'This helps us tailor the demo to your needs',
            suggestions: ['Drone Inspection', 'Cybersecurity', 'Risk Assessment', 'Both'],
          }}
          value={formData.useCase}
          onChange={(value) => handleFormChange('useCase', value)}
          required
        />

        <FormAssistance
          fieldName="message"
          label="Tell us more (optional)"
          placeholder="Any additional details..."
          config={{
            hint: 'Let us know if you have specific requirements',
          }}
          value={formData.message}
          onChange={(value) => handleFormChange('message', value)}
        />

        <SmartTooltip
          id="submit-button"
          title="Submit"
          content="Your demo will be scheduled within 1 business day"
          trigger="hover"
        >
          <button type="submit" className="submit-button">
            Schedule Demo
          </button>
        </SmartTooltip>
      </form>
    </section>
  )
}

/**
 * STEP 6: Add Smart Assistance to Features Section
 */
export function FeaturesSection() {
  useSectionTracking('features')

  const features = [
    {
      title: 'Real-Time Detection',
      description: 'AI detects threats in milliseconds',
    },
    {
      title: 'Enterprise Grade',
      description: '99.99% uptime SLA for critical systems',
    },
    {
      title: 'Auto-Learning',
      description: 'System improves with every interaction',
    },
  ]

  return (
    <section data-section="features" className="features-section">
      <h2>Why Choose Jinki?</h2>

      {/* Smart suggestions */}
      <SmartSuggestions sectionId="features" />

      <div className="features-grid">
        {features.map((feature, index) => (
          <SmartTooltip
            key={index}
            id={`feature-${index}`}
            title={feature.title}
            content={feature.description}
            trigger="hover"
          >
            <div className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </SmartTooltip>
        ))}
      </div>

      {/* Recommendations at the bottom */}
      <SmartRecommendations sectionId="features" variant="card" />
    </section>
  )
}

/**
 * COMPLETE PAGE EXAMPLE
 */
export function CompletePageWithSmartAssistance() {
  return (
    <SmartAssistanceProvider>
      <main className="main-content">
        <HeroSectionWithAssistance />
        <DroneInspectionSection />
        <CybersecuritySection />
        <FeaturesSection />
        <ContactFormWithAssistance />
      </main>
    </SmartAssistanceProvider>
  )
}

export default CompletePageWithSmartAssistance

/**
 * ════════════════════════════════════════════════════════════════
 * KEY FEATURES DEMONSTRATED:
 * ════════════════════════════════════════════════════════════════
 *
 * 1. ✅ GUIDED TOURS
 *    - Multi-step onboarding for first-time visitors
 *    - Highlights important UI elements
 *    - Can be skipped or completed
 *
 * 2. ✅ SMART TOOLTIPS
 *    - Context-sensitive help on hover or focus
 *    - Non-intrusive and dismissible
 *    - Glassmorphic design
 *
 * 3. ✅ SMART SUGGESTIONS
 *    - Appears based on confusion signals
 *    - Auto-dismisses after timeout
 *    - Shows contextual tips
 *
 * 4. ✅ FORM ASSISTANCE
 *    - Real-time validation
 *    - Field-level hints
 *    - Smart suggestions for inputs
 *    - Error messages
 *
 * 5. ✅ READING TIME
 *    - Automatically estimates reading time
 *    - Shows as subtle badge
 *    - Helps users decide to read
 *
 * 6. ✅ RECOMMENDATIONS
 *    - "You might also like" suggestions
 *    - Based on current section
 *    - Card-based layout
 *    - Click tracking for engagement
 *
 * 7. ✅ CONFUSION DETECTION
 *    - Automatically detects confusion signals
 *    - Rapid scroll, back-and-forth, idle time, etc.
 *    - Triggers appropriate help
 *
 * 8. ✅ LEARNING & ADAPTATION
 *    - Tracks user engagement
 *    - Adapts help frequency
 *    - Remembers dismissed help
 *    - Saves preferences locally
 *
 * ════════════════════════════════════════════════════════════════
 */
