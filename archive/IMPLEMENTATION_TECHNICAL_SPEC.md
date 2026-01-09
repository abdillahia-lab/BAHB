# TEAM NEXUS - Technical Implementation Specification
## Conversational Continuity Layer for Jinki Intelligence

---

## EXECUTIVE SUMMARY

This document provides the technical blueprint for implementing the Conversational Continuity Layer. This is a pure **integration layer** (not new features) that bridges four existing systems:

1. ConversationalUI (chatbot)
2. Voice Context (speech input)
3. PersonalizationContext (user profiling)
4. useLeadQualification (lead tracking)

**Estimated effort:** 4-5 hours (technical implementation) + 1.5-2 hours (testing/QA)

---

## SYSTEM ARCHITECTURE

### Current State (Fragmented)

```
[Voice Input] → [Voice Context] → (isolated)
                                ↓
[User Text Input] → [ConversationalUI] → [Response]
                                           (generic)

[User Interaction] → [PersonalizationContext] → (unused by chatbot)

[User Message] → [useLeadQualification] → (background data)
                                         ↓
                                    [Contact Form]
                                    (manual entry)
```

### Proposed State (Unified)

```
                    ┌─────────────────────────────────────┐
                    │ CONVERSATIONAL CONTINUITY LAYER     │
                    │ (New Orchestrator Component)        │
                    └─────────────────────┬───────────────┘
                              ▲           │           ▲
                              │           │           │
        ┌─────────────┐ ┌─────▼─────┐   │   ┌────────┴──────────┐
        │Voice Input  │ │Text Input  │   │   │Form Auto-fill     │
        │(Web Speech) │ │(Keyboard)  │   │   │(Lead Data Mapper) │
        └─────────────┘ └─────┬─────┘   │   └───────────────────┘
                              │         │
                        ┌─────▼─────────▼──────┐
                        │ Unified Pipeline     │
                        │ • NLP               │
                        │ • Entity extraction │
                        │ • Intent detection  │
                        └──────┬──────┬───────┘
                               │      │
                ┌──────────────┴──┐  │
                │                 │  │
        ┌───────▼────────┐  ┌────▼─────────────┐
        │Personalization │  │Lead Qualification│
        │Context         │  │• BANT extraction │
        │• Industry      │  │• Lead scoring    │
        │• Role          │  │• Readiness check │
        │• Complexity    │  └────┬─────────────┘
        └────────┬───────┘       │
                 │               │
        ┌────────▼───────────────▼──────────┐
        │Response Generation (Context-Aware)│
        │• Tone adapted to user segment    │
        │• Industry-specific examples       │
        │• Include qual questions if needed │
        │• Suggest next actions             │
        └────────┬───────────────────────┬─┘
                 │                       │
        ┌────────▼──────┐        ┌──────▼──────┐
        │Display        │        │Form Fields  │
        │(Voice or Chat)│        │(Auto-filled)│
        └───────────────┘        └─────────────┘
```

---

## IMPLEMENTATION COMPONENTS

### 1. NEW: ConversationalContinuity.jsx

**Purpose:** Orchestrator that unifies voice, chat, personalization, and lead qualification

**Location:** `/src/components/ConversationalContinuity.jsx`

**Dependencies:**
```javascript
import { useState, useCallback, useMemo } from 'react'
import { usePersonalization } from '../context/PersonalizationContext'
import { useVoice } from '../context/VoiceCommandContext'
import { useLeadQualification } from '../hooks/useLeadQualification'
import { processNLQuery } from '../utils/nlpPipeline'
import { generateResponse } from '../utils/responseGenerator'
import ConversationalUI from './ConversationalUI'
```

**Key Methods:**

```javascript
// Unified message handler for voice OR text input
const handleUnifiedMessage = useCallback((message, source) => {
  // 1. Process message (existing NLP)
  const nlpResult = processNLQuery(message, conversationContext)

  // 2. Extract lead qualification data
  updateQualification({
    type: 'user',
    content: message,
    intent: nlpResult.intent
  })

  // 3. Generate response with personalization context
  const contextAwareResponse = generateResponse(nlpResult, messages, {
    userSegment: personalization.userSegment,
    detectedIndustry: personalization.detectedIndustry,
    uiComplexity: personalization.uiComplexity,
    leadQualificationScore: qualificationData.qualificationScore
  })

  // 4. Return response with metadata for UI
  return {
    text: contextAwareResponse.text,
    intent: contextAwareResponse.intent,
    qualificationUpdate: {
      score: qualificationData.qualificationScore,
      readyForHandoff: qualificationData.readyForHandoff
    },
    formDataSnapshot: extractFormData(qualificationData),
    personalizationApplied: true
  }
}, [personalization, qualificationData])

// Auto-populate form data from lead qualification
const extractFormData = useCallback((qualData) => {
  return {
    email: qualData.email,
    phone: qualData.phone,
    company: qualData.companyName,
    industry: qualData.industry,
    role: qualData.authority,
    timeline: qualData.timeline,
    budget: qualData.budget,
    notes: `Segment: ${qualData.needType} | Stage: ${qualData.evaluationStage}`
  }
}, [])

// Signal when lead becomes "hot"
const shouldShowHandoffPrompt = useCallback(() => {
  return qualificationData.leadGrade === 'hot' ||
         (qualificationData.leadGrade === 'warm' && qualificationData.email)
}, [qualificationData])
```

**UI Structure:**
```jsx
return (
  <div className="conversational-continuity">
    {/* Personalized header based on detected segment */}
    {personalization.detectedIndustry && (
      <div className="context-indicator">
        Optimized for: {personalization.detectedIndustry}
      </div>
    )}

    {/* Unified chat + voice interface */}
    <ConversationalUI
      onNavigate={handleNavigate}
      onMessage={handleUnifiedMessage}
      enableVoiceInput={true}
      voiceContext={voice}
      personalizationContext={personalization}
      qualificationData={qualificationData}
    />

    {/* Lead qualification status (visible when qualified) */}
    {qualificationData.qualificationScore >= 60 && (
      <QualificationStatus
        score={qualificationData.qualificationScore}
        grade={qualificationData.leadGrade}
        readyForHandoff={shouldShowHandoffPrompt()}
      />
    )}

    {/* Form with pre-populated lead data */}
    <ContactForm
      initialData={extractFormData(qualificationData)}
      onSubmit={handleFormSubmit}
      autoFillIndicator={true}
    />
  </div>
)
```

---

### 2. MODIFY: ConversationalUI.jsx

**Changes Required:**

#### Add Voice Input Capability
```javascript
// Current structure: Only text input
// New: Add voice input option alongside text

const ConversationalUI = ({
  onNavigate = null,
  onMessage = null,           // NEW: unified handler
  enableVoiceInput = false,   // NEW: voice toggle
  voiceContext = null,        // NEW: voice API
  personalizationContext = null, // NEW: personalization
  qualificationData = null    // NEW: lead data
}) => {

  // Voice input handler
  const handleVoiceInput = useCallback(async (transcript) => {
    if (onMessage) {
      // Route through unified handler
      const response = await onMessage(transcript, 'voice')
      // Display response in chat
      setMessages(prev => [...prev, {
        type: 'bot',
        text: response.text,
        source: 'voice'
      }])
    }
  }, [onMessage])

  // Wire voice context
  useEffect(() => {
    if (enableVoiceInput && voiceContext) {
      voiceContext.registerCommandHandler(handleVoiceInput)
    }
  }, [enableVoiceInput, voiceContext, handleVoiceInput])
}
```

#### Adapt Response Tone Based on Personalization
```javascript
// In renderMessage() or message styling:

const getMessageTone = () => {
  if (!personalizationContext) return 'standard'

  const segment = personalizationContext.userSegment
  const industry = personalizationContext.detectedIndustry

  // Executive-level users: formal, concise
  if (segment === 'executive') return 'executive'

  // Technical users: detailed, spec-focused
  if (segment === 'technical') return 'detailed'

  // Default: friendly, accessible
  return 'standard'
}

// Apply tone to message rendering
<div className={`message message--${getMessageTone()}`}>
  {message.text}
</div>
```

#### Display Lead Qualification Status
```javascript
// Add to chat footer or as persistent indicator:

{qualificationData && qualificationData.qualificationScore >= 60 && (
  <div className="qualification-indicator">
    <span className={`grade grade--${qualificationData.leadGrade}`}>
      {qualificationData.leadGrade.toUpperCase()}
    </span>
    <span className="score">{qualificationData.qualificationScore}pts</span>
  </div>
)}
```

---

### 3. EXTEND: responseGenerator.js

**New Parameter:** Personalization Context

**Current:**
```javascript
export const generateResponse = (nlpResult, messages) => {
  // Generate generic response
}
```

**Updated:**
```javascript
export const generateResponse = (nlpResult, messages, personalizationData = {}) => {
  const {
    userSegment,
    detectedIndustry,
    uiComplexity,
    leadQualificationScore
  } = personalizationData

  // Generate base response (existing logic)
  let response = generateBaseResponse(nlpResult)

  // Adapt tone based on segment
  if (userSegment === 'executive') {
    response.text = adaptToExecutive(response.text)
    response.tone = 'concise_technical'
  } else if (userSegment === 'technical') {
    response.text = addTechnicalDetails(response.text, nlpResult)
    response.tone = 'detailed_specs'
  }

  // Add industry-specific examples
  if (detectedIndustry) {
    response.text = addIndustryExamples(
      response.text,
      detectedIndustry,
      nlpResult.entities
    )
  }

  // Include qualification question if needed
  if (leadQualificationScore < 80 && nlpResult.entities.length > 0) {
    const nextQuestion = getNextQualificationQuestion(leadQualificationScore)
    if (nextQuestion) {
      response.suggestedActions = [
        ...response.suggestedActions,
        {
          label: 'Continue Qualification',
          question: nextQuestion
        }
      ]
    }
  }

  return response
}

// Helper: Adapt language for executive audience
function adaptToExecutive(text) {
  return text
    .replace(/super technical detail/gi, 'key specification')
    .replace(/like really/gi, '')
    .replace(/so basically/gi, 'specifically')
    // Remove filler, add directness
}

// Helper: Add industry context
function addIndustryExamples(text, industry, entities) {
  const examples = {
    'electric utilities': 'For utilities like yours, our LiDAR detection prevents outages...',
    'data centers': 'For data centers, thermal sensitivity catches failures...',
    'agriculture': 'For farming operations, NDVI detection identifies crop stress...',
  }

  return text + (examples[industry] || '')
}
```

---

### 4. EXTEND: useLeadQualification.js Hook

**New Export:** Form-ready data transformer

```javascript
// Add to existing hook:

/**
 * Transform qualification data into form-ready format
 * Removes null values, formats for display
 */
export const getFormReadyData = useCallback((qualData) => {
  return {
    email: qualData.email || '',
    phone: qualData.phone || '',
    companyName: qualData.companyName || '',
    industry: qualData.industry || 'other',
    role: qualData.authority || '',
    timeline: qualData.timeline || '',
    budget: qualData.budget || '',
    primaryNeed: qualData.needType || '',
    evaluationStage: qualData.evaluationStage || 'awareness',
    additionalNotes: [
      qualData.leadGrade && `Lead Grade: ${qualData.leadGrade}`,
      qualData.currentSolution && `Current Solution: ${qualData.currentSolution}`,
      qualData.messageCount && `Engagement: ${qualData.messageCount} messages`
    ].filter(Boolean).join(' | ')
  }
}, [qualificationData])

// Also return data with metadata about what's been filled
export const getFormCompleteness = useCallback(() => {
  const fields = ['email', 'phone', 'companyName', 'authority', 'budget', 'timeline']
  const filled = fields.filter(f => qualificationData[f])

  return {
    percentComplete: (filled.length / fields.length) * 100,
    filledFields: filled,
    missingFields: fields.filter(f => !qualificationData[f])
  }
}, [qualificationData])
```

---

### 5. NEW: Integration Utilities

**File:** `/src/utils/continuityIntegration.js`

```javascript
/**
 * Utilities for Conversational Continuity integration
 */

/**
 * Determine if response should include qualification prompt
 */
export const shouldIncludeQualificationPrompt = (
  messageCount,
  leadGrade,
  evaluationStage
) => {
  // After 3 meaningful messages, start qualifying
  if (messageCount < 3) return false

  // If already hot, don't ask more questions
  if (leadGrade === 'hot') return false

  // If in awareness stage, ask about needs
  if (evaluationStage === 'awareness') return true

  // If in consideration, ask about timeline
  if (evaluationStage === 'consideration') return true

  return false
}

/**
 * Get contextual next action based on lead state
 */
export const getContextualNextAction = (qualData, personalization) => {
  // If hot lead with contact info
  if (qualData.leadGrade === 'hot' && (qualData.email || qualData.phone)) {
    return {
      type: 'schedule_call',
      label: 'Schedule Technical Walkthrough',
      description: 'Connect with our sales engineer'
    }
  }

  // If warm lead in decision stage
  if (qualData.leadGrade === 'warm' && qualData.evaluationStage === 'decision') {
    return {
      type: 'request_demo',
      label: 'Request Live Demo',
      description: 'See the platform in action'
    }
  }

  // If in consideration, ask for more info
  if (qualData.evaluationStage === 'consideration') {
    return {
      type: 'continue_conversation',
      label: 'Learn More',
      description: 'Continue exploring features'
    }
  }

  return null
}

/**
 * Build handoff summary for CRM integration
 */
export const buildLeadHandoffSummary = (qualData, messages) => {
  return {
    // Basic info
    contact: {
      email: qualData.email,
      phone: qualData.phone,
      name: qualData.authority // Role, but can be used as name placeholder
    },
    company: {
      name: qualData.companyName,
      size: qualData.companySize,
      industry: qualData.industry
    },
    // Sales context
    opportunity: {
      primaryNeed: qualData.needType,
      evaluationStage: qualData.evaluationStage,
      timeline: qualData.timeline,
      budget: qualData.budget,
      currentSolution: qualData.currentSolution
    },
    // Engagement metrics
    engagement: {
      messageCount: qualData.messageCount,
      conversationDuration: calculateDuration(
        qualData.firstInteractionTime,
        qualData.lastInteractionTime
      ),
      topicsDiscussed: qualData.intentSequence,
      readinessScore: qualData.qualificationScore,
      leadGrade: qualData.leadGrade
    },
    // Conversation summary
    conversationSummary: summarizeConversation(messages),
    // Recommended next step
    recommendedAction: getContextualNextAction(qualData),
    // Timestamp
    handoffTime: new Date().toISOString()
  }
}

function calculateDuration(start, end) {
  if (!start || !end) return null
  return Math.round((new Date(end) - new Date(start)) / 1000 / 60) // minutes
}

function summarizeConversation(messages) {
  // Extract key discussion points from message history
  return messages
    .filter(m => m.type === 'user')
    .slice(-5) // Last 5 user messages
    .map(m => m.text)
    .join(' | ')
}
```

---

## INTEGRATION CHECKLIST

### Phase 1: Setup (30 min)
- [ ] Create `/src/components/ConversationalContinuity.jsx`
- [ ] Create `/src/utils/continuityIntegration.js`
- [ ] Verify all dependencies exist and import correctly
- [ ] Test component rendering in App.jsx

### Phase 2: Voice Integration (60 min)
- [ ] Add voice input to ConversationalUI
- [ ] Wire voice context into unified handler
- [ ] Test voice → text flow
- [ ] Verify voice input appears in chat history

### Phase 3: Personalization Integration (70 min)
- [ ] Inject personalization context into response generator
- [ ] Test tone adaptation (executive vs technical)
- [ ] Add industry-specific examples
- [ ] Verify personalization data flows through chat

### Phase 4: Lead Qualification Integration (60 min)
- [ ] Wire useLeadQualification hook into orchestrator
- [ ] Test BANT extraction from messages
- [ ] Implement form data export
- [ ] Display lead score/grade in UI

### Phase 5: Form Auto-fill (40 min)
- [ ] Create/modify contact form component
- [ ] Wire form data pre-population
- [ ] Test data accuracy
- [ ] Verify form submission flow

### Phase 6: Testing & Refinement (90 min)
- [ ] End-to-end testing: voice → chat → form
- [ ] Edge cases: missing data, switching modalities
- [ ] Performance profiling (voice latency)
- [ ] UX polish and accessibility review

### Phase 7: Documentation (30 min)
- [ ] Code comments and JSDoc
- [ ] Integration guide for team
- [ ] Demo video walkthrough
- [ ] Deployment checklist

---

## FILE CHANGES SUMMARY

| File | Change | Effort |
|---|---|---|
| NEW: ConversationalContinuity.jsx | Create orchestrator component | 120 min |
| NEW: continuityIntegration.js | Create utility functions | 60 min |
| MODIFY: ConversationalUI.jsx | Add voice input, personalization display | 90 min |
| MODIFY: responseGenerator.js | Add personalization parameter, adapt tone | 70 min |
| MODIFY: useLeadQualification.js | Export form-ready data, completeness check | 40 min |
| MODIFY: App.jsx | Swap ConversationalUI with ConversationalContinuity | 10 min |
| NEW: ConversationalContinuity.css | Styling for orchestrator UI | 40 min |

**Total:** ~430 minutes = **7.2 hours** (includes testing, polish, documentation)

---

## TESTING STRATEGY

### Unit Tests
- Voice input handler
- Lead qualification extraction
- Form data transformation
- Personalization adaptation logic

### Integration Tests
- Voice → Chat message flow
- Chat → Form data population
- Personalization context propagation
- Lead qualification scoring

### E2E Tests
1. User speaks: "Tell me about LiDAR for utilities"
   - Verify voice is transcribed
   - Verify industry detected
   - Verify response includes LiDAR details

2. User switches to chat
   - Verify full conversation history visible
   - Verify context preserved

3. User fills form
   - Verify email, company, industry pre-filled
   - Verify other fields empty (not filled with wrong data)

4. Lead qualification
   - Verify scoring after 3+ messages
   - Verify handoff prompt when "hot"
   - Verify summary data for CRM

### Performance Tests
- Voice input latency: <500ms
- Message processing: <300ms
- Form pre-fill: <100ms
- No new bundle size increase (integration only)

---

## DEPLOYMENT & ROLLBACK

**Deployment:**
- Feature flag: `ENABLE_CONVERSATIONAL_CONTINUITY`
- Gradual rollout: 10% → 50% → 100%
- Monitor: voice input latency, form completion rate, lead data accuracy

**Rollback:**
- If voice latency >1s: disable voice input, keep chat
- If form data accuracy <90%: disable pre-fill, keep manual entry
- If performance degradation: revert to isolated ConversationalUI

---

## SUCCESS CRITERIA

| Criterion | Target | Measurement |
|---|---|---|
| Voice → Chat continuity | 100% | Messages persist across modality switch |
| Form pre-fill accuracy | >95% | Correct data in ≥95% of fields |
| Lead qualification extraction | >90% | BANT extraction precision |
| Response time (voice) | <500ms | P95 latency |
| Response time (chat) | <300ms | P95 latency |
| Zero regressions | 100% | All existing features work as before |

---

**This specification provides the technical blueprint for TEAM NEXUS's integration solution. The focus is on orchestration, not new features. Every component either already exists or is a thin integration layer.**
