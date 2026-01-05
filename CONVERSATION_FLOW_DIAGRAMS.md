# Jinki Contextual Chatbot - Conversation Flow Diagrams

## Table of Contents
1. [Main Conversation Flow](#main-conversation-flow)
2. [Intent-Specific Flows](#intent-specific-flows)
3. [Lead Qualification Journey](#lead-qualification-journey)
4. [Handoff Workflow](#handoff-workflow)
5. [Error Recovery Flows](#error-recovery-flows)

---

## Main Conversation Flow

### Overview Flow Diagram

```
                     ┌──────────────────┐
                     │ User Visits Page  │
                     │ Scroll Tracking   │
                     │ Begins            │
                     └────────┬──────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Detect Page       │
                    │ Section via Scroll│
                    │ Position          │
                    └────────┬──────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   Hero Section         Features             Pricing
   (Awareness)          (Interest)           (Consideration)
        │                    │                    │
        │    ┌───────────────┼───────────────┐   │
        └────▼──────────────────────────────▼────┘
             │
             │ At time T or on interaction:
             │ Show Chatbot with contextual greeting
             │
      ┌──────▼──────────────────┐
      │ Display FAB or Greeting  │
      │ + Initial Suggestions    │
      │ (Adapt to page section)  │
      └──────┬───────────────────┘
             │
    ┌────────▼──────────┐
    │ User Clicks FAB or│
    │ Sees Greeting     │
    │ Chat Opens ✓      │
    └────────┬──────────┘
             │
    ┌────────▼──────────────────┐
    │ Display System Greeting:  │
    │                           │
    │ "Hi! I'm Jinki Assistant" │
    │ "What brings you here?"   │
    │                           │
    │ Suggestions:              │
    │ • Pricing Info            │
    │ • Feature Details         │
    │ • Request Demo            │
    │ • Speak with Team         │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ User Types Message        │
    │ (e.g., "What's pricing?") │
    └────────┬──────────────────┘
             │
    ┌────────▼───────────────────┐
    │ Real-time Intent           │
    │ Detection                  │
    │ Confidence: 92%            │
    │ Intent: "pricing"          │
    └────────┬───────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Context Boost Applied     │
    │ +20% confidence if on     │
    │ pricing section           │
    │ Final: 95% confidence     │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Route to Intent Handler   │
    │ → generatePricingResponse │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Generate Response:        │
    │ • Reference company size  │
    │ • Suggest plan            │
    │ • Offer consultation      │
    │ • Show next steps         │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Extract Entities:         │
    │ • Budget: $50k            │
    │ • Company: TechCorp       │
    │ • Email: john@company.com │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Update Lead Score:        │
    │ Current: 20 pts           │
    │ +10 (entity extraction)   │
    │ New Total: 30 pts (COLD)  │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Save to Storage:          │
    │ • Message to IndexedDB    │
    │ • Update conversation     │
    │ • Track timestamps        │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Check Handoff Criteria:   │
    │ Score ≥ 80? → NO          │
    │ Continue conversation     │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ Display Response + Next   │
    │ Steps to User             │
    │ Continue Loop ↩           │
    └──────────────────────────┘
```

---

## Intent-Specific Flows

### 1. Pricing Intent Flow

```
User: "How much does this cost?"
      │
      ├─ Intent Detection: "pricing" (95%)
      │
      ├─ Extract Entities:
      │  ├─ Budget: not yet mentioned
      │  ├─ Timeline: not yet mentioned
      │  └─ Company Size: not yet mentioned
      │
      ├─ Qualification Context:
      │  └─ Score: +10 (pricing intent detected)
      │
      ├─ Generate Response:
      │  ├─ "Thanks for asking about pricing!"
      │  ├─ "We offer 3 plans:"
      │  ├─ "  • Starter: $2.5k/month (SMB)"
      │  ├─ "  • Professional: $7.5k/month (Mid)"
      │  ├─ "  • Enterprise: Custom (Large)"
      │  └─ "Which best fits your company?"
      │
      ├─ Display Suggestions:
      │  ├─ "Tell me about your company"
      │  ├─ "Schedule pricing consult"
      │  └─ "See detailed comparison"
      │
      └─ Continue to next message:
         "We're a manufacturing company, 200 employees"
         │
         ├─ Intent: "qualification"
         ├─ Extract: industry="manufacturing", size="200"
         ├─ Score: +20 (company context)
         └─ Total: 30 pts (still COLD)
            │
            Next step: Ask about budget/timeline
```

### 2. Demo Intent Flow

```
User: "Can I see a live demo?"
      │
      ├─ Intent Detection: "demo" (96%)
      │
      ├─ Extract Entities:
      │  └─ Action Type: "demo_request"
      │
      ├─ Qualification Context:
      │  └─ Score: +15 (demo = decision stage)
      │
      ├─ Determine Demo Type:
      │  ├─ Is user interested in drone? → Yes
      │  ├─ Is user interested in security? → Unknown
      │  └─ Suggest: Full platform overview
      │
      ├─ Generate Response:
      │  ├─ "Great! Let me schedule that for you."
      │  ├─ "A few quick questions:"
      │  ├─ "1. What's your role?"
      │  ├─ "2. What specific features interest you?"
      │  ├─ "3. Best time for a 30-min call?"
      │  └─ "Once I know, I'll coordinate with our team"
      │
      ├─ Display Suggestions:
      │  ├─ "I'm the decision maker"
      │  ├─ "Show me drone inspection"
      │  └─ "Tuesday afternoon works"
      │
      └─ Capture Contact:
         User: "I'm the VP Ops, interested in both,
                Tuesday 2pm works. Email: jane@energy.com"
         │
         ├─ Intent: "qualification + demo"
         ├─ Extract:
         │  ├─ authority="VP Ops"
         │  ├─ timeline="Tuesday 2pm"
         │  ├─ email="jane@energy.com"
         │  └─ needType="both"
         ├─ Score: +40 (authority + timeline + email)
         └─ Total: 55 pts (WARM)
            │
            Next: Book calendar, send prep materials
```

### 3. Support Intent Flow

```
User: "I'm having an issue with the API"
      │
      ├─ Intent Detection: "support" (88%)
      │
      ├─ Detect Problem Severity:
      │  ├─ Keywords: "issue" → Medium priority
      │  ├─ Is urgent? → No
      │  └─ Action: Offer chat or escalate
      │
      ├─ Generate Response:
      │  ├─ "Sorry to hear you're experiencing issues!"
      │  ├─ "I can help troubleshoot or connect you to support."
      │  ├─ "Can you describe what's happening?"
      │  └─ "Or prefer to chat with an agent?"
      │
      ├─ Display Suggestions:
      │  ├─ "Share error details"
      │  ├─ "Connect to support agent"
      │  └─ "View documentation"
      │
      └─ If Escalation Needed:
         │
         ├─ Qualification check:
         │  └─ Score: Not relevant for support
         │
         ├─ Generate Escalation:
         │  ├─ "I'm connecting you to our support team"
         │  ├─ "Team available 24/7"
         │  ├─ "You'll hear from them in <5 min"
         │  └─ "Thanks for your patience!"
         │
         └─ Trigger Handoff:
            ├─ Route: support@jinki.com
            ├─ Data: Conversation history
            └─ Queue: High priority
```

### 4. Features Intent Flow

```
User: "What features are included?"
      │
      ├─ Intent Detection: "features" (90%)
      │
      ├─ Determine Feature Category:
      │  ├─ Previous context: drone inspection
      │  └─ Focus: Drone-specific features
      │
      ├─ Generate Response:
      │  ├─ "Our Drone Inspection suite includes:"
      │  │
      │  ├─ "🚁 Autonomous Flight"
      │  │  └─ "AI-powered flight paths, 4K video"
      │  │
      │  ├─ "🔍 Defect Detection"
      │  │  └─ "Real-time anomaly analysis, ML models"
      │  │
      │  ├─ "📊 Analytics Dashboard"
      │  │  └─ "Trend analysis, predictive maintenance"
      │  │
      │  ├─ "🔐 Enterprise Security"
      │  │  └─ "End-to-end encryption, SOC 2 compliant"
      │  │
      │  ├─ "🔌 Third-party Integration"
      │  │  └─ "APIs, webhooks, Salesforce/SAP ready"
      │  │
      │  └─ "Want to see any of these in action?"
      │
      ├─ Display Suggestions:
      │  ├─ "See defect detection demo"
      │  ├─ "View analytics features"
      │  └─ "Integration documentation"
      │
      └─ Continue Context:
         User: "The anomaly detection sounds great"
         │
         ├─ Intent: "features + interest"
         ├─ Extract: interested_feature="anomaly_detection"
         ├─ Score: +10 (deep engagement)
         └─ → Offer detailed demo/case study
```

### 5. Qualification Intent Flow

```
User: "I want to know if you can help my company"
      │
      ├─ Intent Detection: "qualification" (85%)
      │
      ├─ Initiate Structured Qualification:
      │  │
      │  ├─ Question 1: "What industry are you in?"
      │  │  └─ User: "Energy sector"
      │  │     └─ Extract: industry="energy" (+5 pts, high-value)
      │  │
      │  ├─ Question 2: "How many facilities?"
      │  │  └─ User: "12 plants, 45 substations"
      │  │     └─ Extract: company_size="large" (+10 pts)
      │  │
      │  ├─ Question 3: "What's your main challenge?"
      │  │  └─ User: "Inspection costs, safety risks"
      │  │     └─ Extract: pain_point="cost+safety" (+10 pts)
      │  │
      │  ├─ Question 4: "Who else should be involved?"
      │  │  └─ User: "VP Operations & Safety Manager"
      │  │     └─ Extract: authority="VP Operations" (+10 pts)
      │  │
      │  ├─ Question 5: "Budget range?"
      │  │  └─ User: "Looking at $500k annually"
      │  │     └─ Extract: budget="$500k/year" (+10 pts)
      │  │
      │  └─ Question 6: "Timeline?"
      │     └─ User: "Need solution by Q2 2025"
      │        └─ Extract: timeline="Q2 2025" (+10 pts)
      │
      ├─ Score Calculation:
      │  └─ Base: 10
      │     + Industry fit: 5
      │     + Company size: 10
      │     + Need/pain: 10
      │     + Authority: 10
      │     + Budget: 10
      │     + Timeline: 10
      │     + Messages: 12 (6 msgs × 2)
      │     ──────────────────
      │     = 87 pts → HOT LEAD ✓
      │
      ├─ Lead Grade: HOT
      │  └─ "Perfect fit! Ready for sales team"
      │
      └─ Trigger Handoff ✓
         ├─ Prepare Lead Summary
         ├─ Notify Sales Team
         ├─ Schedule Initial Call
         └─ Send Confirmation to User
```

---

## Lead Qualification Journey

### Complete Qualification Timeline

```
┌─ SESSION START ─────────────────────────────────────────┐
│ User arrives at jinki.com from energy company           │
│ Scrolls through features → pricing → case studies       │
│ Time on page: 2 minutes, high engagement detected       │
└──────────────────────┬──────────────────────────────────┘

┌─ MESSAGE 1: INITIAL CONTACT ────────────────────────────┐
│ User: "Tell me more about drone inspection"             │
│ Intent: features (85%)                                  │
│ Score: 0 → 10 pts (engagement)                          │
│ Grade: Unqualified (< 30)                               │
│ Next Action: Send features overview                     │
└──────────────────────┬──────────────────────────────────┘

┌─ MESSAGE 2: COMPANY CONTEXT ────────────────────────────┐
│ User: "We operate 15 facilities in the oil & gas space" │
│ Intent: qualification (90%)                             │
│ Extracted: industry=energy, size=large                  │
│ Score: 10 → 25 pts (+industry: 5, +size: 10)           │
│ Grade: Unqualified → COLD (25 pts)                      │
│ Next Action: Ask about timeline/budget                  │
└──────────────────────┬──────────────────────────────────┘

┌─ MESSAGE 3: PAIN POINT ─────────────────────────────────┐
│ User: "We need to reduce inspection downtime & costs"   │
│ Intent: features (80%)                                  │
│ Extracted: pain_point=cost_reduction                    │
│ Score: 25 → 40 pts (+pain: 10, +engagement: 5)         │
│ Grade: COLD (40 pts)                                    │
│ Next Action: Probe for budget awareness                 │
└──────────────────────┬──────────────────────────────────┘

┌─ MESSAGE 4: DECISION MAKER ─────────────────────────────┐
│ User: "Our VP Ops leads this evaluation"                │
│ Intent: qualification (95%)                             │
│ Extracted: authority=VP Operations                      │
│ Score: 40 → 55 pts (+authority: 10, +engagement: 5)    │
│ Grade: COLD → WARM (55 pts) ✓                           │
│ Next Action: Ask about budget & timeline                │
│ ReadyForHandoff: False (need more BANT)                 │
└──────────────────────┬──────────────────────────────────┘

┌─ MESSAGE 5: BUDGET SIGNAL ──────────────────────────────┐
│ User: "Budget is flexible, we have $300k allocated"     │
│ Intent: qualification (98%)                             │
│ Extracted: budget=$300k                                 │
│ Score: 55 → 70 pts (+budget: 10, +engagement: 5)       │
│ Grade: WARM (70 pts) ✓                                  │
│ Next Action: Ask about implementation timeline          │
│ ReadyForHandoff: False (need timeline for hot grade)    │
└──────────────────────┬──────────────────────────────────┘

┌─ MESSAGE 6: TIMELINE ───────────────────────────────────┐
│ User: "We need this operational by Q2 2025"             │
│ Intent: qualification (96%)                             │
│ Extracted: timeline=Q2_2025 (3 months)                  │
│ Score: 70 → 87 pts (+timeline: 10, +engagement: 7)     │
│ Grade: WARM → HOT (87 pts) ✓✓✓                          │
│ BANT Complete: Budget ✓, Authority ✓, Need ✓,          │
│                Timeline ✓                               │
│ ReadyForHandoff: TRUE                                   │
└──────────────────────┬──────────────────────────────────┘

┌─ HANDOFF TRIGGERED ─────────────────────────────────────┐
│                                                          │
│ Lead Summary Generated:                                 │
│ ├─ Contact: unnamed (VP Operations)                     │
│ ├─ Company: Energy sector, 15 facilities, large         │
│ ├─ Opportunity: Drone inspection, $300k budget          │
│ ├─ Timeline: Q2 2025 (urgent)                           │
│ ├─ Pain Points: Downtime reduction, cost optimization  │
│ ├─ Engagement: 6 messages, high quality signals         │
│ ├─ Lead Score: 87/100 (HOT)                             │
│ └─ Grade: Enterprise buyer, ready for sales            │
│                                                          │
│ Actions:                                                │
│ ├─ Create lead in Salesforce CRM                        │
│ ├─ Assign to Account Executive: Jane Smith              │
│ ├─ Schedule discovery call: Tomorrow 2pm                │
│ ├─ Send: Intro email + case studies + ROI analysis      │
│ ├─ Alert: Sales Slack channel                           │
│ └─ Log: Conversation transcript for AE context          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Handoff Workflow

### Human Handoff Decision Tree

```
                 ┌─ Lead Score Calculated ─┐
                 │ (0-100 pts)              │
                 └────────────┬─────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
           Score ≥ 80?              Score < 80?
           (Hot Lead)               (Not Hot Yet)
                │                           │
                ▼                           ▼
           Has Authority?            Has Authority?
           │                         │
        YES│                      YES│        NO
           │                         │         │
           ▼                         ▼         ▼
      Has Email/Phone?          Email/Phone?  Missing
      │                         │              Contact
   YES│      NO               YES│ NO
      ▼       ▼                 ▼  ▼
    ✓HOT  → Ask for      Ask for  Missing
    Email  contact      contact  contact
      │                  │
      │              Qualify to
      │              Warm/Cold
      │                  │
      ▼                  ▼
   HANDOFF          Nurture Flow
   TO SALES         (Email sequence)
   ├─ CRM            │
   ├─ Calendar       ├─ Educational
   ├─ Email          ├─ Case studies
   └─ Alert rep      ├─ Webinar invites
                     └─ Re-engage in 7 days
```

### Handoff Trigger Conditions

```javascript
shouldHandoff() → {
  // Primary: HOT lead automatic handoff
  if (score ≥ 80 && hasAuthority && hasBudget && hasTimeline) {
    return true  // Immediate handoff
  }

  // Secondary: WARM lead with contact info
  if (score ≥ 60 && hasAuthority && hasNeed && (hasEmail || hasPhone)) {
    if (evaluationStage === 'decision') {
      return true  // Decision stage = ready
    }
  }

  // Manual review trigger
  if (score ≥ 75 && messageCount ≥ 5) {
    return 'manual_review'  // Alert sales team, await approval
  }

  // Not ready yet
  return false
}
```

### Handoff Message to User

```
Agent: "Based on our conversation, I think our team should
        connect with you directly to discuss implementation.

        Would you be open to a quick call tomorrow to dive
        deeper into your 15 facilities and optimization strategy?

        What time works best?"

        Suggestions:
        ├─ "Tomorrow 10am"
        ├─ "Tomorrow 2pm"
        ├─ "Thursday afternoon"
        └─ "Send me an email instead"
```

---

## Error Recovery Flows

### Low Confidence Intent

```
User: "I need something"
      │
      ├─ Intent Detection: "general" (42% confidence)
      │  └─ Too vague, multiple possible intents
      │
      ├─ Response Strategy: Clarify
      │  └─ Bot: "I want to help! Can you tell me more?
      │          Are you interested in:
      │          • Pricing & Plans
      │          • Feature Overview
      │          • Product Demo
      │          • Technical Questions"
      │
      └─ User selects: "Feature Overview"
         └─ Intent now clear: "features" (95%)
```

### Conversation Repair

```
User: "That's not what I asked!"
      │
      ├─ Sentiment: Frustrated
      ├─ Intent: "complaint" (88%)
      │
      ├─ Recovery Response:
      │  ├─ Apologize: "Sorry for the confusion!"
      │  ├─ Clarify: "Let me re-read your question..."
      │  ├─ Correct: "You asked about [X], not [Y]"
      │  ├─ Answer: "Actually, the answer is..."
      │  └─ Verify: "Is that what you were looking for?"
      │
      └─ Log: Flagged response for training improvement
```

### Storage Failure Handling

```
saveConversation() fails
      │
      ├─ Try IndexedDB: FAIL (quota exceeded)
      │
      ├─ Fallback to localStorage: FAIL (quota exceeded)
      │
      ├─ In-Memory only: SUCCESS
      │  └─ Alert user: "⚠️ Chat history not saved
      │     (storage full). Please export and clear."
      │
      ├─ Offer solutions:
      │  ├─ "Export conversation to file"
      │  ├─ "Clear old messages"
      │  └─ "Continue anyway (session only)"
      │
      └─ Continue chatting, warn on close
```

---

## Context-Aware Section Routing

```
Hero Section (Awareness)
├─ Greeting: "Welcome to Jinki Intelligence"
├─ Focus: Product overview, credibility
├─ Suggestions:
│  ├─ "Learn about our solutions"
│  ├─ "See real results"
│  └─ "Schedule a demo"
└─ Score: 0 (new lead)

Features Section (Interest)
├─ Greeting: "Curious about our capabilities?"
├─ Focus: Technical details, differentiation
├─ Suggestions:
│  ├─ "Drone inspection details"
│  ├─ "Security features"
│  └─ "Integration options"
└─ Score: +5 (engaged)

Pricing Section (Consideration)
├─ Greeting: "Let me find the right plan for you"
├─ Focus: Value prop, pricing details, ROI
├─ Suggestions:
│  ├─ "Compare plans"
│  ├─ "Enterprise pricing"
│  └─ "Pricing consultation"
└─ Score: +10 (consideration stage)

Case Studies (Proof)
├─ Greeting: "See how we've helped similar companies"
├─ Focus: Social proof, industry examples
├─ Suggestions:
│  ├─ "Similar case study"
│  ├─ "Schedule case study call"
│  └─ "Request custom analysis"
└─ Score: +10 (validation seeking)

FAQ (Objection Handling)
├─ Greeting: "Have questions? I can help!"
├─ Focus: Problem-solving, reassurance
├─ Suggestions:
│  ├─ "Get answers"
│  ├─ "Talk to expert"
│  └─ "Request documentation"
└─ Score: +8 (objection raised)

Contact Section (Decision)
├─ Greeting: "Ready to get started?"
├─ Focus: Next steps, team connection
├─ Suggestions:
│  ├─ "Schedule call"
│  ├─ "Start free trial"
│  └─ "Speak with sales"
└─ Score: +15 (decision stage)
```

---

## Multi-Language Detection & Response

```
User Browser Language: es-MX (Spanish - Mexico)
      │
      ├─ Auto-detect: Spanish (es)
      │
      ├─ Load translations:
      │  └─ locales/es/chatbot.json
      │
      ├─ Translate greeting:
      │  └─ ES: "¡Hola! Soy el Asistente de Jinki"
      │
      ├─ Detect user language from message:
      │  └─ "Cuánto cuesta?" → Spanish input
      │
      ├─ Respond in detected language:
      │  └─ Spanish response with pricing
      │
      └─ Offer language switch:
         ├─ "¿Prefieres inglés?"
         └─ Allow manual language selection

Supported Languages:
├─ English (en)
├─ Spanish (es)
├─ French (fr)
├─ German (de)
├─ Portuguese (pt)
├─ Mandarin (zh)
├─ Japanese (ja)
├─ Korean (ko)
├─ Arabic (ar)
├─ Italian (it)
├─ Dutch (nl)
└─ Swedish (sv)
```

---

## End-to-End Conversation Example

```
═══════════════════════════════════════════════════════════

TIME: 2:15 PM, User scrolls to pricing section of website

BOT (1): "👋 Hi there! I'm Jinki Assistant.

          I noticed you're looking at our pricing.
          Are you evaluating solutions for your team?

          💡 Suggestions:
          ┌─────────────────────────────┐
          │ Compare Plans               │
          │ Enterprise Pricing           │
          │ ROI Calculator               │
          │ Talk to Sales                │
          └─────────────────────────────┘"

Intent Detected: pricing (88%)
Lead Score: 5/100 (COLD)

─────────────────────────────────────────────────────────

USER: "Yeah, we're looking at options for our manufacturing facility"

Intent Detected: qualification (92%)
Entities: { industry: "manufacturing" }
Lead Score: 20/100 (COLD)

─────────────────────────────────────────────────────────

BOT (2): "Great! Manufacturing is one of our strongest
         verticals. We've helped facilities like yours
         reduce inspection time by 70%.

         A few questions to find the right fit:
         1️⃣  How many facilities do you operate?
         2️⃣  What's your biggest operational challenge?"

Suggestions:
┌──────────────────────────────┐
│ We have 5 facilities         │
│ We need cost reduction       │
│ Tell me more features         │
│ I want to see a demo          │
└──────────────────────────────┘"

─────────────────────────────────────────────────────────

USER: "We have 8 facilities, and downtime costs us $50k/day"

Intent Detected: qualification (96%)
Entities: {
  companySize: 8,
  painPoint: "downtime",
  budget: "$50k/day"
}
Lead Score: 45/100 (COLD → WARM)
Evaluation Stage: consideration

─────────────────────────────────────────────────────────

BOT (3): "That's significant! $50k/day downtime cost means
         drone inspection could save you $15M+ annually.

         Our Starter plan at $2.5k/month pays for itself
         in just 3 days.

         3️⃣  Who owns the decision for this initiative?
         4️⃣  Would Q1 2025 work for implementation?"

Suggestions:
┌──────────────────────────────┐
│ I'm the Operations Manager   │
│ Q1 2025 is perfect           │
│ Let me check with the boss   │
│ Can you show me a demo?      │
└──────────────────────────────┘"

─────────────────────────────────────────────────────────

USER: "I'm the Ops Manager. Q1 2025 works. Can you
       schedule a demo? My email is mike@manufact.com"

Intent Detected: demo + qualification (98%)
Entities: {
  authority: "Operations Manager",
  timeline: "Q1 2025",
  email: "mike@manufact.com",
  needType: "drone_inspection"
}
Lead Score: 78/100 (WARM → HOT threshold)

─────────────────────────────────────────────────────────

BOT (4): "Excellent! Let me get you scheduled with our
         team. One final question:

         5️⃣  What's your annual budget range for this?

         This helps me present the perfect plan."

Suggestions:
┌──────────────────────────────┐
│ $50k-$100k                   │
│ $100k-$250k                  │
│ $250k+                       │
│ Flexible, depends on ROI     │
└──────────────────────────────┘"

─────────────────────────────────────────────────────────

USER: "$100k-250k budget. When can we talk?"

Intent Detected: qualification + demo (99%)
Entities: {
  budget: "$100k-$250k",
  action: "demo_scheduling"
}
Lead Score: 87/100 ⭐ HOT LEAD

BANT Complete: ✓ Budget, ✓ Authority, ✓ Need, ✓ Timeline

Lead Grade: HOT 🔥

ReadyForHandoff: TRUE

─────────────────────────────────────────────────────────

🚨 HANDOFF TRIGGERED

Lead Summary:
├─ Contact: Mike (mike@manufact.com)
├─ Role: Operations Manager
├─ Company: Manufacturing, 8 facilities
├─ Need: Drone inspection, downtime reduction
├─ Budget: $100k-$250k annual
├─ Timeline: Q1 2025 (3 months)
├─ Engagement: 4 messages, decision-ready
└─ Lead Score: 87/100 (HOT)

Actions Taken:
✓ Lead created in Salesforce
✓ Assigned to: Account Exec - Sarah Chen
✓ Calendar: Demo scheduled for tomorrow 10am
✓ Email sent: Welcome + case studies + Q1 roadmap
✓ Slack alert: Sales team notified
✓ Transcript: Available for sales team context

─────────────────────────────────────────────────────────

BOT (5): "Perfect! I'm connecting you with Sarah Chen,
         our Senior Account Executive.

         She'll be reaching out within the next hour to
         confirm your demo tomorrow at 10am.

         I've also sent you:
         ✓ Case studies from similar manufacturers
         ✓ ROI calculator for your facility
         ✓ Q1 2025 implementation roadmap

         Looking forward to helping you save $15M+!

         Questions in the meantime? I'm here."

═══════════════════════════════════════════════════════════
Conversation Duration: 8 minutes
From Lead Capture to Sales Handoff: 8 messages
Success: HIGH QUALITY QUALIFIED LEAD ✓
═══════════════════════════════════════════════════════════
```

---

## Key Metrics Dashboard

```
CONVERSATION ANALYSIS:
├─ Total Messages: 8
├─ User Messages: 4
├─ Bot Messages: 5 (including greeting)
├─ Conversation Duration: 8 min 22 sec
│
ENGAGEMENT METRICS:
├─ Intent Progression: awareness→interest→consideration→decision
├─ Scroll Depth: 3 page sections
├─ Time on Site: 12 minutes
├─ Interaction Score: 92/100
│
LEAD QUALIFICATION:
├─ Final Score: 87/100 (HOT)
├─ BANT Completion: 100% (4/4)
├─ Data Quality: Excellent
│  └─ Contact: ✓ Email (mike@manufact.com)
│  └─ Company: ✓ Industry (Manufacturing)
│  └─ Opportunity: ✓ Budget ($100-250k)
│  └─ Timeline: ✓ Specific (Q1 2025)
│
BUSINESS VALUE:
├─ Lead Quality: Enterprise-Grade
├─ Sales Readiness: Immediate
├─ Estimated Deal Size: $120k-240k (annual)
├─ Sales Cycle Reduction: -5 days (vs. contact form)
└─ Next Step: Demo Call (tomorrow 10am)
```

---

**Document Version:** 1.0
**Last Updated:** January 5, 2025
**Status:** Production Ready
