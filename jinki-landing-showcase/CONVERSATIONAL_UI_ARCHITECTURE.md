# CONVERSATIONAL UI - SYSTEM ARCHITECTURE

## High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INPUT                                 │
│                    "Show me thermal cameras"                         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NLP PIPELINE (nlpPipeline.js)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. TOKENIZATION                                                     │
│     "show me thermal cameras"                                        │
│     → ["show", "me", "thermal", "cameras"]                          │
│                                                                       │
│  2. INTENT CLASSIFICATION                                           │
│     Keywords: "show me" → Pattern match                             │
│     → Intent: SEARCH                                                │
│                                                                       │
│  3. ENTITY EXTRACTION                                               │
│     "thermal" → FEATURE_KEYWORDS → thermal imaging                 │
│     Confidence: 0.9                                                 │
│     → Entity: { type: FEATURE, value: 'thermal imaging' }          │
│                                                                       │
│  4. SENTIMENT ANALYSIS                                              │
│     Words: ["show", "me", "thermal", "cameras"]                     │
│     Positive words: 0, Negative: 0, Urgent: 0                      │
│     → Sentiment: neutral, Urgency: false                           │
│                                                                       │
│  5. QUERY REFORMULATION                                            │
│     Expand: "thermal" → "thermal imaging"                          │
│     → Reformulated: "Show thermal imaging capabilities"            │
│                                                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              NLP RESULT OBJECT                                       │
├─────────────────────────────────────────────────────────────────────┤
│ {                                                                     │
│   originalInput: "show me thermal cameras",                         │
│   tokens: ["show", "me", "thermal", "cameras"],                    │
│   intent: "search",                                                 │
│   entities: [{ type: "feature", value: "thermal imaging", ... }],  │
│   sentiment: "neutral",                                             │
│   urgency: false,                                                   │
│   reformulatedQuery: "Show thermal imaging capabilities",          │
│   confidence: 0.85                                                  │
│ }                                                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│             KNOWLEDGE BASE LOOKUP (knowledgeBase.js)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Entity: { type: "feature", value: "thermal imaging" }             │
│  Action: getFeatureInfo("thermal imaging")                         │
│                                                                       │
│  Returns:                                                            │
│  {                                                                    │
│    name: "Thermal Imaging",                                         │
│    description: "Military-grade thermal cameras...",               │
│    specs: ["0.05°C sensitivity", ...],                             │
│    benefits: "Detects failures 72 hours early",                   │
│    applications: ["data centers", ...]                             │
│  }                                                                    │
│                                                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│         RESPONSE GENERATION (responseGenerator.js)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Select Intent Handler                                           │
│     Intent: SEARCH → generateSearchResponse()                      │
│                                                                       │
│  2. Apply Sentiment Template                                        │
│     Sentiment: neutral → "I see. Let me provide..."                │
│                                                                       │
│  3. Populate Content                                                │
│     - Feature name and description                                  │
│     - Specifications list                                           │
│     - Benefits explanation                                          │
│     - Applications list                                             │
│                                                                       │
│  4. Generate Suggested Actions                                      │
│     [✓] See Specifications                                         │
│     [✓] Schedule Consultation                                       │
│                                                                       │
│  5. Return Response Object                                          │
│     {                                                                │
│       text: "I see...[full response]...",                           │
│       intent: "search",                                             │
│       sentiment: "neutral",                                         │
│       suggestedActions: [...]                                       │
│     }                                                                │
│                                                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│           CONVERSATIONAL UI COMPONENT (ConversationalUI.jsx)        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Add User Message                                                │
│     ┌──────────────────────────────────────┐                       │
│     │  👤 Show me thermal cameras          │                       │
│     └──────────────────────────────────────┘                       │
│                                                                       │
│  2. Process & Generate Bot Response                                 │
│     [Processing indicator...]                                       │
│                                                                       │
│  3. Display Bot Message with Formatting                            │
│     ┌─────────────────────────────────────────────┐               │
│     │ ◉ Thermal Imaging                           │               │
│     │   Military-grade thermal cameras...         │               │
│     │                                             │               │
│     │   Specifications:                          │               │
│     │   • 0.05°C thermal sensitivity             │               │
│     │   • Real-time monitoring                   │               │
│     │   • 640x512 resolution                     │               │
│     │                                             │               │
│     │   [See Specifications] [Schedule Demo]     │               │
│     └─────────────────────────────────────────────┘               │
│                                                                       │
│  4. Enable Follow-up Conversation                                   │
│     User can click action or type new query...                     │
│                                                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
                         ┌─────────────┐
                         │  END USER   │
                         │  EXPERIENCE │
                         └─────────────┘
```

---

## Component Hierarchy

```
App.jsx
  ├── ConversationalUI (Root Component)
  │   ├── .chat-button (Floating button)
  │   ├── .chat-window (Chat container)
  │   │   ├── .chat-header (Title + close)
  │   │   ├── .chat-messages (Scroll container)
  │   │   │   ├── .quick-prompts (Initial suggestions)
  │   │   │   ├── .message (User message)
  │   │   │   │   ├── .message__avatar
  │   │   │   │   ├── .message__content
  │   │   │   │   ├── .message__text
  │   │   │   │   ├── .message__actions
  │   │   │   │   └── .message__timestamp
  │   │   │   ├── .message (Bot message)
  │   │   │   │   └── [same structure]
  │   │   │   └── [more messages...]
  │   │   ├── .chat-input-area
  │   │   │   ├── .chat-input (Text field)
  │   │   │   └── .chat-send (Send button)
  │   │   └── .chat-footer
  │   └── [Portal for floating chat button]
  └── [Rest of app...]
```

---

## State Management Flow

```
ConversationalUI State:
  ├── isOpen: boolean (chat window visibility)
  ├── messages: Array<Message>
  │   └── Message {
  │       id: string (unique identifier)
  │       type: 'user' | 'bot'
  │       text: string (message content)
  │       timestamp: Date
  │       intent?: string (bot only)
  │       sentiment?: string (bot only)
  │       actions?: Array<Action> (bot only)
  │       nlpMetadata?: {
  │         confidence: number
  │         entities: Array<Entity>
  │         reformulated: string
  │       }
  │     }
  ├── input: string (current input field value)
  ├── isLoading: boolean (processing state)
  └── conversationContext: {
      industryFocus?: string
      featureFocus?: string
      sentiment: string
      lastEntities?: Array<Entity>
    }
```

---

## Intent Classification Decision Tree

```
User Input
  │
  ├─→ Contains "show|find|search" → SEARCH
  │
  ├─→ Contains "take|go to|navigate" → NAVIGATE
  │
  ├─→ Contains "how|explain|describe" → PRODUCT_INFO
  │
  ├─→ Contains "price|cost|budget" → PRICING
  │
  ├─→ Contains "contact|call|email|schedule" → CONTACT
  │
  ├─→ Ends with "?" or contains "why|what is" → FAQ
  │
  ├─→ Contains "filter|only|specific" → FILTER
  │
  ├─→ Contains "vs|compare|difference" → COMPARE
  │
  └─→ No pattern match → GENERIC
      └─→ Fallback: Show menu of options
```

---

## Entity Recognition Process

```
Input: "thermal cameras for data centers"

Step 1: Tokenization
  → ["thermal", "cameras", "for", "data", "centers"]

Step 2: Keyword Matching
  ├─ "thermal" → FEATURE_KEYWORDS
  │  └─→ Match: "thermal" → "thermal imaging"
  │      Confidence: 0.9
  │
  ├─ "data centers" → INDUSTRY_KEYWORDS
  │  └─→ Match: "data center" → "data centers"
  │      Confidence: 0.95
  │
  └─ "cameras" → FEATURE_KEYWORDS
     └─→ Match: "camera" → "camera"
         Confidence: 0.85

Step 3: Deduplication
  Remove duplicate camera entity

Final Entities:
  [
    { type: "feature", value: "thermal imaging", confidence: 0.9 },
    { type: "industry", value: "data centers", confidence: 0.95 }
  ]
```

---

## Sentiment Analysis Algorithm

```
Input: "This is amazing! I need help ASAP"

Step 1: Tokenize
  ["this", "is", "amazing", "i", "need", "help", "asap"]

Step 2: Positive Word Count
  "amazing" ∈ SENTIMENT_WORDS.positive
  Count: 1

Step 3: Negative Word Count
  (no negative words)
  Count: 0

Step 4: Urgent Word Count
  "need", "asap" ∈ SENTIMENT_WORDS.urgent
  Count: 2

Step 5: Determine Sentiment
  if (negativeCount > positiveCount)
    sentiment = "negative"
  else if (positiveCount > negativeCount)
    sentiment = "positive"  ← (1 > 0, so POSITIVE)
  else
    sentiment = "neutral"

Step 6: Check Urgency
  if (urgentCount > 0)
    urgency = true  ← (2 > 0, so URGENT)

Result:
  { sentiment: "positive", urgency: true }
```

---

## FAQ Search & Semantic Matching

```
Query: "How long can the drone fly fo?" (typo)

Step 1: Extract Keywords
  Keywords: ["how", "long", "drone", "fly", "fo"]

Step 2: FAQ Database Scan
  For each FAQ in FAQ_DB:

    FAQ: "How long can the drone fly?"
    Keywords: ["flight", "endurance", "time", "duration"]

    Step A: Keyword Matching Score
      "drone" ∈ question → +0.25
      "how" ∈ keywords → +0.25
      Score: 0.5

    Step B: String Similarity (Levenshtein)
      Distance("how long can the drone fly fo",
               "how long can the drone fly?")
      Similarity: 0.98
      Score: 0.98

    Step C: Combined Score
      (keywordScore * 0.4) + (similarity * 0.6)
      (0.5 * 0.4) + (0.98 * 0.6)
      = 0.2 + 0.588
      = 0.788

Step 3: Sort & Filter
  Results filtered by confidence > 0.3
  Sorted by highest score first

Step 4: Return Top Matches
  [
    {
      question: "How long can the drone fly?",
      answer: "The Jinki platform offers 59 minutes...",
      score: 0.788,
      matched: true
    }
  ]

User sees: Perfect match despite typo!
```

---

## Response Template Selection

```
Generated Response depends on:

1. INTENT (8 types)
   ├─ SEARCH → "Let me provide information..."
   ├─ NAVIGATE → "I'm taking you to..."
   ├─ PRODUCT_INFO → "Here are the specifications..."
   ├─ PRICING → "Flexible pricing models: ..."
   ├─ CONTACT → "Contact methods: ..."
   ├─ FAQ → "Here's the answer: ..."
   ├─ FILTER → "Filtering results for..."
   └─ COMPARE → "Comparing: ..."

2. SENTIMENT (3 tiers)
   ├─ POSITIVE
   │  └─ Prefix: "Wonderful! Great question!"
   │     Tone: Enthusiastic, confirmatory
   │
   ├─ NEGATIVE
   │  └─ Prefix: "I understand your concern..."
   │     Tone: Empathetic, solution-focused
   │
   └─ NEUTRAL
      └─ Prefix: "Here's the information..."
         Tone: Factual, professional

3. URGENCY FLAG (optional)
   ├─ If URGENT: Prioritize contact methods
   ├─ If URGENT: Offer immediate scheduling
   └─ If URGENT: Escalate to sales

4. ENTITIES (extracted)
   ├─ For FEATURE entity: Show specs
   ├─ For INDUSTRY entity: Show ROI
   └─ For METRIC entity: Show data

5. CONVERSATION HISTORY
   └─ Enhance response with context from previous turns

Final Template:
  [Sentiment Prefix] + [Intent Content] + [Entity Details] +
  [Context Enhancement] + [Suggested Actions]
```

---

## Performance Optimization Strategy

```
Layer 1: Preprocessing (Memoization)
  - Tokenization cached per query
  - Keyword lists precompiled
  - Intent patterns pre-matched
  Average time: 5-10ms

Layer 2: NLP Processing (Efficient algorithms)
  - Intent: Pattern matching (O(n) where n = patterns)
  - Entity: Keyword lookup (O(m) where m = keywords)
  - Sentiment: Word scan (O(k) where k = input words)
  Average time: 10-20ms

Layer 3: Knowledge Base (Indexed lookup)
  - INDUSTRIES_DB indexed by slug
  - FEATURES_DB indexed by name
  - FAQ_DB indexed by category
  Average time: 1-2ms

Layer 4: Response Generation (Template-based)
  - Pre-defined templates for each intent
  - Content substitution (string replacement)
  - Action generation (filter predefined actions)
  Average time: 5-10ms

Layer 5: UI Rendering (React optimization)
  - React.memo for message components
  - Framer Motion for smooth animations
  - CSS containment for layout isolation
  Average time: 30-50ms

TOTAL LATENCY: <100ms (user perceives as instant)
```

---

## Error Handling Flow

```
User Input
  │
  ├─→ [Validation]
  │   └─→ If empty: Show warning, don't process
  │
  ├─→ [NLP Processing]
  │   ├─→ If error: Log, fall back to GENERIC intent
  │   └─→ Confidence < 0.3: Add debug message
  │
  ├─→ [Knowledge Lookup]
  │   ├─→ If no matches: Generic fallback response
  │   ├─→ If partial match: Suggest alternatives
  │   └─→ If error: Escalate to contact form
  │
  ├─→ [Response Generation]
  │   ├─→ If timeout: Show "Processing..." message
  │   └─→ If error: Show "Let me connect you with team"
  │
  └─→ [UI Rendering]
      └─→ If error: Log to console, show fallback message

User sees: Always helpful response, never blank/broken state
```

---

## Multi-Turn Conversation Context

```
Turn 1:
  User: "Solutions for agriculture?"
  Context Before: {}

  NLP Result:
    intent: SEARCH
    entities: [INDUSTRY: agriculture]
    sentiment: neutral

  Context After: {
    industryFocus: "agriculture",
    sentiment: "neutral",
    lastEntities: [INDUSTRY: agriculture]
  }

Turn 2:
  User: "What's the ROI?"
  Context Before: {
    industryFocus: "agriculture",
    sentiment: "neutral"
  }

  NLP Result:
    intent: PRICING
    entities: [METRIC: ROI]
    sentiment: neutral

  Response Generation:
    - Recognizes PRICING intent
    - Checks context: industryFocus = "agriculture"
    - Returns: Agriculture-specific ROI metrics!

  Context After: {
    industryFocus: "agriculture",
    sentiment: "neutral",
    lastEntities: [METRIC: ROI]
  }

Turn 3:
  User: "How do I implement?"

  Response Generation:
    - Recognizes PRODUCT_INFO intent
    - Checks context: industryFocus = "agriculture"
    - Returns: Agriculture implementation timeline!
    - No need to re-ask about industry

Result: Seamless, natural conversation where bot "remembers"
```

---

## Quality Metrics & Thresholds

```
Intent Classification:
  ✓ Pattern match found: Confidence 1.0 (100%)
  ✓ Keyword subset match: Confidence 0.8 (80%)
  ✓ Fallback to GENERIC: Confidence 0.5 (50%)

  Decision: Use intent with highest confidence

Entity Extraction:
  ✓ Exact keyword match: Confidence 0.95
  ✓ Partial match (substring): Confidence 0.85
  ✓ Semantic similarity: Confidence 0.75

  Filter threshold: confidence > 0.7

Sentiment Analysis:
  ✓ Clear positive/negative words: Confidence 0.95
  ✓ Mixed sentiment: Confidence 0.65
  ✓ No sentiment indicators: Confidence 0.5 (neutral)

  Always return result, no filtering

FAQ Matching:
  ✓ Exact match: Confidence > 0.95 (return immediately)
  ✓ High match: Confidence > 0.8 (return top 2)
  ✓ Partial match: Confidence > 0.5 (show "related" section)
  ✓ No match: Confidence < 0.3 (show "ask team" option)

Overall Confidence:
  = 0.5 (base) + (0.1 × number of entities)
  Range: 0.5 - 1.0
  Displayed to user if < 0.7 for transparency
```

---

## Future Extensibility Points

```
Easy to Add:
  ├─ New FAQ entries (Just add to FAQ_DB)
  ├─ New industries (Add to INDUSTRIES_DB)
  ├─ New features (Add to FEATURES_DB)
  ├─ New keywords (Update KEYWORD dictionaries)
  ├─ New sentiment words (Update SENTIMENT_WORDS)
  └─ New CSS styles (Update ConversationalUI.css)

Medium Complexity:
  ├─ New intent types (Add pattern to INTENT_PATTERNS)
  ├─ New intent handler (Add to responseGenerator.js)
  ├─ Custom entity types (Extend entity extraction)
  ├─ Integration with CRM (Add to contact handler)
  └─ Analytics tracking (Add to message handler)

Advanced:
  ├─ Voice input/output (Web Speech API)
  ├─ Multi-language support (i18n library)
  ├─ GPT-4 integration (API fallback)
  ├─ User authentication (Session management)
  ├─ Conversation persistence (Database)
  └─ Real-time agent handoff (WebSocket)
```

---

This architecture document provides complete visibility into how the CONVERSATIONAL UI system works at every level, from user input to displayed response.
