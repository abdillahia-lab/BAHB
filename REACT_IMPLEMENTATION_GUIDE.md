# React Implementation Guide - Jinki Contextual Chatbot

## Integration with Landing Page

### Step 1: Add to App.jsx

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage3 from './pages/LandingPage3'
import JinkiContextualChatbot from './components/JinkiContextualChatbot'
import './styles/global.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage3 />} />
        {/* ... other routes ... */}
      </Routes>
      {/* Chatbot at root level - visible on all pages */}
      <JinkiContextualChatbot />
    </Router>
  )
}

export default App
```

### Step 2: Add Section Markers to Landing Page

```jsx
// pages/LandingPage3.jsx

export default function LandingPage3() {
  return (
    <div>
      {/* Hero Section */}
      <section data-section="hero">
        <h1>Jinki Intelligence</h1>
        <p>Enterprise Drone Inspection & Cybersecurity</p>
      </section>

      {/* Features Section */}
      <section data-section="features">
        <h2>Our Solutions</h2>
        <div>
          <h3>Drone Inspection</h3>
          <p>AI-powered autonomous inspections</p>
        </div>
        <div>
          <h3>Cybersecurity</h3>
          <p>Enterprise threat management</p>
        </div>
      </section>

      {/* Pricing Section */}
      <section data-section="pricing">
        <h2>Pricing Plans</h2>
        <div>
          <h3>Starter - $2.5k/month</h3>
          <p>Perfect for SMBs</p>
        </div>
        <div>
          <h3>Professional - $7.5k/month</h3>
          <p>For growing teams</p>
        </div>
        <div>
          <h3>Enterprise - Custom</h3>
          <p>Large-scale operations</p>
        </div>
      </section>

      {/* Case Studies */}
      <section data-section="caseStudies">
        <h2>Success Stories</h2>
        {/* Case study cards */}
      </section>

      {/* Testimonials */}
      <section data-section="testimonials">
        <h2>What Customers Say</h2>
        {/* Testimonial quotes */}
      </section>

      {/* FAQ */}
      <section data-section="faq">
        <h2>Frequently Asked Questions</h2>
        {/* FAQ accordion */}
      </section>

      {/* Contact */}
      <section data-section="contact">
        <h2>Get Started Today</h2>
        <p>Schedule a demo or speak with our team</p>
      </section>
    </div>
  )
}
```

---

## Advanced Usage Patterns

### Pattern 1: Context Provider for Global Chatbot State

```jsx
// context/ChatbotContext.jsx
import { createContext, useContext, useState } from 'react'

const ChatbotContext = createContext()

export function ChatbotProvider({ children }) {
  const [globalState, setGlobalState] = useState({
    userId: null,
    userEmail: null,
    userCompany: null,
    totalLeadScore: 0,
  })

  const updateGlobalState = (updates) => {
    setGlobalState(prev => ({ ...prev, ...updates }))
  }

  return (
    <ChatbotContext.Provider value={{ globalState, updateGlobalState }}>
      {children}
    </ChatbotContext.Provider>
  )
}

export const useChatbotContext = () => useContext(ChatbotContext)

// App.jsx
import { ChatbotProvider } from './context/ChatbotContext'

function App() {
  return (
    <ChatbotProvider>
      <Router>
        {/* ... routes ... */}
      </Router>
      <JinkiContextualChatbot />
    </ChatbotProvider>
  )
}
```

### Pattern 2: Custom API Response Handler

```jsx
// utils/chatbotApi.ts
import axios from 'axios'

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.jinki.com'

interface ChatMessage {
  message: string
  context: {
    section: string
    intent: string
    userProfile: any
  }
  conversationHistory: any[]
}

interface ChatResponse {
  response: string
  suggestions: string[]
  confidence: number
  intent: string
}

export async function generateChatResponse(
  input: ChatMessage
): Promise<ChatResponse> {
  try {
    const response = await axios.post<ChatResponse>(
      `${API_BASE}/api/chat/generate`,
      input,
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  } catch (error) {
    console.error('Chat API error:', error)
    // Fallback response
    return {
      response: "I'm having trouble connecting. Please try again or refresh the page.",
      suggestions: ['Refresh page', 'Try again'],
      confidence: 0.3,
      intent: 'error',
    }
  }
}

export async function qualifyLead(
  qualificationData: any,
  conversationHistory: any[]
): Promise<{ leadScore: number; grade: string }> {
  try {
    const response = await axios.post(
      `${API_BASE}/api/leads/qualify`,
      {
        qualificationData,
        conversationHistory,
      }
    )

    return response.data
  } catch (error) {
    console.error('Lead qualification error:', error)
    return { leadScore: 0, grade: 'unqualified' }
  }
}

export async function createLeadInCRM(
  leadData: any
): Promise<{ crm_id: string; assigned_rep: string }> {
  try {
    const response = await axios.post(
      `${API_BASE}/api/crm/create-lead`,
      leadData
    )

    return response.data
  } catch (error) {
    console.error('CRM creation error:', error)
    throw error
  }
}
```

### Pattern 3: Analytics Integration

```jsx
// utils/chatbotAnalytics.ts
import { event } from 'analytics'

export interface ChatbotEvent {
  eventType:
    | 'chat_opened'
    | 'message_sent'
    | 'intent_detected'
    | 'lead_qualified'
    | 'handoff_triggered'
    | 'conversation_ended'
  metadata: Record<string, any>
}

export function trackChatbotEvent(eventData: ChatbotEvent) {
  try {
    // Send to your analytics platform (Mixpanel, Amplitude, etc.)
    event(eventData.eventType, {
      timestamp: new Date().toISOString(),
      ...eventData.metadata,
    })

    // Optional: Log to backend
    if (process.env.REACT_APP_ENABLE_ANALYTICS === 'true') {
      fetch(`${process.env.REACT_APP_API_URL}/api/analytics/event`, {
        method: 'POST',
        body: JSON.stringify(eventData),
      }).catch(err => console.error('Analytics error:', err))
    }
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

export function trackConversationStart(contextData: any) {
  trackChatbotEvent({
    eventType: 'chat_opened',
    metadata: {
      section: contextData.currentSection,
      engagement_level: contextData.engagementLevel,
      time_on_page: contextData.timeOnPage,
    },
  })
}

export function trackIntentDetected(intent: string, confidence: number) {
  trackChatbotEvent({
    eventType: 'intent_detected',
    metadata: {
      intent,
      confidence,
    },
  })
}

export function trackLeadQualified(score: number, grade: string) {
  trackChatbotEvent({
    eventType: 'lead_qualified',
    metadata: {
      lead_score: score,
      lead_grade: grade,
    },
  })
}

export function trackHandoff(leadData: any) {
  trackChatbotEvent({
    eventType: 'handoff_triggered',
    metadata: {
      lead_id: leadData.id,
      lead_score: leadData.qualificationData.qualificationScore,
      assigned_rep: leadData.assigned_rep,
    },
  })
}
```

### Pattern 4: Enhanced Message Component with Markdown

```jsx
// components/ChatMessage.jsx
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessageProps {
  message: {
    id: string | number
    type: 'user' | 'bot'
    content: string
    intent?: string
    suggestions?: Array<{ text: string; intent?: string }>
    isHandoff?: boolean
  }
  onSuggestionClick: (suggestion: any) => void
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  return (
    <div className={`message ${message.type}`}>
      <div className="message-content">
        {message.type === 'bot' && (
          <div className="bot-avatar">
            <span>🤖</span>
          </div>
        )}

        <div className="message-text">
          {message.type === 'bot' ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h3: ({ node, ...props }) => <h3 style={{ marginTop: '10px' }} {...props} />,
                ul: ({ node, ...props }) => <ul style={{ marginLeft: '20px' }} {...props} />,
                li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            message.content
          )}
        </div>
      </div>

      {message.suggestions && message.type === 'bot' && (
        <div className="message-suggestions">
          {message.suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              className="suggestion-btn"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      )}

      {message.isHandoff && (
        <div className="handoff-notice">
          <p>🎯 You've been connected to our sales team!</p>
        </div>
      )}
    </div>
  )
}
```

### Pattern 5: Error Boundary for Chatbot

```jsx
// components/ChatbotErrorBoundary.jsx
import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ChatbotErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chatbot error:', error, errorInfo)
    // Send error to monitoring service
    if (window.Sentry) {
      window.Sentry.captureException(error)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '24px',
          width: '350px',
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
        }}>
          <p>Something went wrong with the chat.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '8px' }}
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// App.jsx
import { ChatbotErrorBoundary } from './components/ChatbotErrorBoundary'

function App() {
  return (
    <ChatbotErrorBoundary>
      <JinkiContextualChatbot />
    </ChatbotErrorBoundary>
  )
}
```

---

## Performance Optimization

### Optimization 1: Lazy Load Heavy Dependencies

```jsx
// hooks/useLazyIntentDetection.js
import { lazy, Suspense } from 'react'

const IntentDetectionLogic = lazy(() =>
  import('./useIntentDetection').then(mod => ({
    default: mod.useIntentDetection
  }))
)

export function useLazyIntentDetection(input) {
  return (
    <Suspense fallback={null}>
      {/* Lazy loaded intent detection */}
    </Suspense>
  )
}
```

### Optimization 2: Memoize Context Updates

```jsx
// components/JinkiContextualChatbot.jsx
import { useMemo, useCallback } from 'react'

const JinkiContextualChatbot = () => {
  // ... existing code ...

  const memoizedContextData = useMemo(() => ({
    ...contextData,
    primaryIntent: contextData.primaryIntent || 'product',
  }), [contextData])

  const memoizedSuggestions = useMemo(() =>
    getInitialSuggestions(),
    [contextData.currentSection]
  )

  const handleSendMessage = useCallback(async () => {
    // ... message handling logic ...
  }, [messages, inputValue, detectedIntent])

  return (
    // ... JSX ...
  )
}
```

### Optimization 3: Virtual Scrolling for Long Conversations

```jsx
// components/VirtualizedChatMessages.jsx
import { FixedSizeList } from 'react-window'

export function VirtualizedChatMessages({ messages, onSuggestionClick }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ChatMessage
        message={messages[index]}
        onSuggestionClick={onSuggestionClick}
      />
    </div>
  )

  return (
    <FixedSizeList
      height={400}
      itemCount={messages.length}
      itemSize={60}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

---

## Testing

### Unit Tests Example

```jsx
// __tests__/useIntentDetection.test.js
import { renderHook } from '@testing-library/react'
import { useIntentDetection } from '../hooks/useIntentDetection'

describe('useIntentDetection', () => {
  test('detects pricing intent with high confidence', () => {
    const { result } = renderHook(() =>
      useIntentDetection('How much does this cost?')
    )

    expect(result.current.detectedIntent).toBe('pricing')
    expect(result.current.confidence).toBeGreaterThan(0.85)
  })

  test('extracts budget entity', () => {
    const { result } = renderHook(() =>
      useIntentDetection('We have a $50k budget')
    )

    const entities = result.current.extractEntities()
    expect(entities.budget).toBe('$50k')
  })

  test('detects multiple intents', () => {
    const { result } = renderHook(() =>
      useIntentDetection('Show me pricing and features')
    )

    expect(result.current.scores.pricing).toBeGreaterThan(0.6)
    expect(result.current.scores.features).toBeGreaterThan(0.6)
  })
})
```

### Integration Tests Example

```jsx
// __tests__/chatbot.integration.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import JinkiContextualChatbot from '../components/JinkiContextualChatbot'

describe('Chatbot Integration', () => {
  test('complete conversation flow: greeting -> qualification -> handoff', async () => {
    render(<JinkiContextualChatbot />)

    // Open chatbot
    const fab = screen.getByRole('button', { name: /open chatbot/i })
    fireEvent.click(fab)

    // Verify greeting appears
    await waitFor(() => {
      expect(screen.getByText(/Jinki Assistant/i)).toBeInTheDocument()
    })

    // Send first message
    const input = screen.getByPlaceholderText(/Ask about/i)
    fireEvent.change(input, { target: { value: 'Tell me about pricing' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    // Verify bot response
    await waitFor(() => {
      expect(screen.getByText(/pricing/i)).toBeInTheDocument()
    })

    // Verify suggestions appear
    const suggestions = screen.getAllByRole('button', { name: /pricing|plan/i })
    expect(suggestions.length).toBeGreaterThan(0)
  })
})
```

---

## Environment Configuration

### .env.example
```
# API Configuration
REACT_APP_API_URL=https://api.jinki.com
REACT_APP_API_TIMEOUT=5000

# Analytics
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ANALYTICS_KEY=xxx

# CRM
REACT_APP_CRM_PROVIDER=salesforce
REACT_APP_SALESFORCE_API_KEY=xxx

# Feature Flags
REACT_APP_ENABLE_HANDOFF=true
REACT_APP_ENABLE_MULTI_LANGUAGE=true
REACT_APP_ENABLE_OFFLINE_MODE=true

# Environment
REACT_APP_ENVIRONMENT=production
```

---

## Production Deployment

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'chatbot': [
            './src/components/JinkiContextualChatbot',
            './src/hooks/use*'
          ]
        }
      }
    },
    // Minimize bundle
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  },
  // Performance hints
  define: {
    __DEV__: false
  }
})
```

### Bundle Analysis

```bash
# Install analyzer
npm install -D rollup-plugin-visualizer

# Add to vite config
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  ...
  visualizer({
    open: true,
    gzipSize: true,
    brotliSize: true,
  })
]

# Run build and analyze
npm run build
```

---

## Migration from Old Contact Form

### Step-by-Step Migration

```jsx
// pages/LandingPage3.jsx - OLD CODE
<section>
  <h2>Contact Us</h2>
  <form onSubmit={handleContactFormSubmit}>
    <input type="email" required />
    <textarea required />
    <button type="submit">Send</button>
  </form>
</section>

// MIGRATION: Keep form, add data-section marker
<section data-section="contact">
  <h2>Get Started Today</h2>
  <p>Chat with our team or fill out the form below:</p>

  {/* Old form still works */}
  <form onSubmit={handleContactFormSubmit}>
    <input type="email" placeholder="Your email" required />
    <textarea placeholder="Your message" required />
    <button type="submit">Send</button>
  </form>

  <p style={{ marginTop: '24px', textAlign: 'center' }}>
    💬 Or chat with our assistant on the right!
  </p>
</section>

// App.jsx - Add chatbot
function App() {
  return (
    <>
      <LandingPage3 />
      <JinkiContextualChatbot /> {/* New! */}
    </>
  )
}
```

---

## Troubleshooting Common Issues

### Issue: Chatbot Not Appearing

```javascript
// Debug checklist
console.log('1. Component rendered?', document.querySelector('[class*="chatbot"]'))
console.log('2. CSS loaded?', document.styleSheets)
console.log('3. Z-index issue?', getComputedStyle(el).zIndex)
console.log('4. Hidden by overflow?', getComputedStyle(parent).overflow)
```

### Issue: Slow Performance

```javascript
// Performance profiling
import { PerformanceMonitor } from './utils/PerformanceMonitor'

const monitor = new PerformanceMonitor()

// Monitor specific operations
monitor.start('intent-detection')
detectedIntent = detectIntent(input)
console.log(`Intent detection took: ${monitor.end('intent-detection')}ms`)

// Profile entire conversation
window.performance.mark('conversation-start')
// ... conversation logic ...
window.performance.mark('conversation-end')
window.performance.measure('conversation', 'conversation-start', 'conversation-end')
```

---

## Next Steps

1. Follow the Deployment Checklist: `CHATBOT_DEPLOYMENT_CHECKLIST.md`
2. Review Architecture: `CHATBOT_SYSTEM_ARCHITECTURE.md`
3. Study Conversation Flows: `CONVERSATION_FLOW_DIAGRAMS.md`
4. Review Intent Guide: `INTENT_CLASSIFICATION_GUIDE.md`

---

**Document Version:** 1.0
**Last Updated:** January 5, 2025
**Status:** Production Ready
