# TEAM FUSION: Architecture & Flow Diagrams
## Cross-Device Context Sync System Design

---

## 1. SYSTEM ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         JINKI INTELLIGENCE                               │
│                      (React + Vite Landing Page)                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    React Components                                │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │ │
│  │  │ LandingPage3.jsx │  │ ROICalculator    │  │ ConversationalUI │ │ │
│  │  │ - Scroll track   │  │ - Share button   │  │ - Context aware  │ │ │
│  │  │ - Section expand │  │ - State encode   │  │ - Chat history   │ │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘ │ │
│  │                            ↕️                                       │ │
│  │  ┌────────────────────────────────────────────────────────────────┐ │ │
│  │  │              useDeviceContextSync Hook                        │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────┐  │ │ │
│  │  │  │ • updateContext()     • toggleSection()                │  │ │ │
│  │  │  │ • updateScroll()      • setActivePage()               │  │ │ │
│  │  │  │ • addNote()           • requestSync()                 │  │ │ │
│  │  │  │ • getSyncStatus()     • exportContext()               │  │ │ │
│  │  │  └─────────────────────────────────────────────────────────┘  │ │ │
│  │  └────────────────────────────────────────────────────────────────┘ │ │
│  │                            ↕️                                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │          CrossDeviceContextService (Singleton)                    │ │
│  │                                                                    │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │ Context State (in-memory + persisted)                       │ │ │
│  │  │ {                                                             │ │ │
│  │  │   scrollPosition: 1234,                                      │ │ │
│  │  │   activePage: 'cybersecurity',                               │ │ │
│  │  │   expandedSections: { cbs: true, threat_intel: true },       │ │ │
│  │  │   notes: { note_1: { content, created, ... } },             │ │ │
│  │  │   lastUpdated: 1704465600000,                                │ │ │
│  │  │   deviceId: 'device_...',                                    │ │ │
│  │  │   deviceType: 'desktop'                                      │ │ │
│  │  │ }                                                             │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                            ↕️↕️↕️                                    │ │
│  │  ┌────────────────────────────────────────────────────────────────┐ │ │
│  │  │ STORAGE LAYER                                                │ │ │
│  │  │                                                              │ │ │
│  │  │ localStorage (fastest, cross-tab on same device)           │ │ │
│  │  │       ↓                                                     │ │ │
│  │  │ IndexedDB (offline, larger capacity)                       │ │ │
│  │  │       ↓                                                     │ │ │
│  │  │ Cloud Sync (optional, explicit consent)                    │ │ │
│  │  └────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │            COMMUNICATION LAYER                                    │ │
│  │                                                                    │ │
│  │  Broadcast Channel API                                            │ │
│  │  (Real-time sync between tabs on same device)                    │ │
│  │  • Instant updates (< 1ms)                                       │ │
│  │  • No polling needed                                             │ │
│  │  • Falls back to periodic sync if unavailable                   │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │            SERVICE WORKER (Offline Support)                       │ │
│  │                                                                    │ │
│  │  Cache Strategy:                                                  │ │
│  │  • CRITICAL: Always cached (hero, key features)                  │ │
│  │  • DYNAMIC: Cached on first visit                                │ │
│  │  • NETWORK: Try network first, fallback to cache                 │ │
│  │                                                                    │ │
│  │  Background Sync (when back online):                              │ │
│  │  • Sync stored context with server                               │ │
│  │  • Upload notes/annotations                                       │ │
│  │  • Queue forms for submission                                     │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DATA FLOW: SCROLL TRACKING

```
User scrolls on Desktop
        ↓
┌───────────────────────────────────────────────────────────┐
│  useDeviceContextSync Hook detects scroll event          │
│  (from window scroll listener)                            │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  updateScroll(position) → contextService.updateContext() │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  CrossDeviceContextService stores in memory              │
│  contextState.scrollPosition = 1234                       │
└───────────────────────────────────────────────────────────┘
        ↓↓↓ (parallel operations, all non-blocking) ↓↓↓
        ↓                    ↓                         ↓
  localStorage              IndexedDB              Broadcast Channel
  (immediate,              (async,                (all tabs on
   cross-tab)             offline-safe)           same device)
        ↓                    ↓                         ↓
   Updated ✓         Stored ✓                    Desktop Tab 1: Updated ✓
                                                 Desktop Tab 2: Updated ✓
                                                 Desktop Tab 3: Updated ✓
        ↓↓↓ (listeners notified) ↓↓↓

ReactComponents re-render with new context
        ↓
Users see "Synced • just now" indicator

═════════════════════════════════════════════════════════════

Later: User opens same site on Mobile
        ↓
┌───────────────────────────────────────────────────────────┐
│  Service initializes on mobile browser                    │
│  restoreContext() is called                               │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  Check localStorage first (fastest)                       │
│  → Found context with scrollPosition: 1234                │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  Component mounts, runs useEffect                         │
│  → Scroll page to position 1234                           │
└───────────────────────────────────────────────────────────┘
        ↓
User sees page at exact scroll position they left off
        ↓
User feels: "Wow, it remembered me!"
```

---

## 3. DATA FLOW: SHARING CONTEXT

```
User clicks "Share with team" button in ROICalculator
        ↓
┌───────────────────────────────────────────────────────────┐
│  handleShare() calls ShareableContextEncoder.shareContext()
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  Extract current context:                                │
│  {                                                        │
│    scroll: 3456,                                          │
│    section: 'roi-calculator',                             │
│    expanded: { roi: true, features: true },               │
│    notes: { ... }                                         │
│  }                                                        │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  Sanitize sensitive data                                 │
│  (remove device info, IP, personal metadata)              │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  Encode as base64url:                                     │
│  "eyJzY3JvbGw6MzQ1NixzZWN0aW9uOnJvaS1..."                │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  Generate shareable URL:                                 │
│  https://jinki.com/?ctx=eyJzY3JvbGw6MzQ1NixzZWN0aW9uOnJvaS...│
│           &utm_source=jinki-app                           │
│           &utm_campaign=context-share                     │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  Use native share or copy to clipboard                   │
│  (navigator.share() or clipboard.writeText())             │
└───────────────────────────────────────────────────────────┘
        ↓
User shares with teammate

═════════════════════════════════════════════════════════════

Teammate receives link, clicks it
        ↓
┌───────────────────────────────────────────────────────────┐
│  Page loads, detects ?ctx= parameter                      │
│  (in App.jsx or useEffect hook)                           │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  ShareableContextEncoder.extractContextFromURL()         │
│  → Decodes base64url back to context object              │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  updateContext(decodedContext)                            │
│  → contextService stores decoded state                    │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  Component effects execute:                               │
│  • Scroll to position                                     │
│  • Expand sections                                        │
│  • Show notes                                             │
│  • Highlight ROI calculation                              │
└───────────────────────────────────────────────────────────┘
        ↓
Teammate sees EXACT same view as original user
        ↓
Teammate thinks: "Perfect, this is what my colleague wanted me to see"
```

---

## 4. OFFLINE ACCESS FLOW

```
User browsing site (connected)
        ↓
Service Worker intercepts fetch requests
        ↓
┌───────────────────────────────────────────────────────────┐
│  Caching Strategy:                                        │
│  1. Check localStorage first                             │
│  2. Try network                                           │
│  3. Cache response (for offline later)                    │
│  4. Return response to app                                │
└───────────────────────────────────────────────────────────┘
        ↓
CRITICAL CONTENT cached automatically:
• HTML (index.html)
• CSS (styles)
• JS (vendor bundles)
• Key images (hero, logos)

DYNAMIC CONTENT cached on visit:
• Sections user viewed
• Data visualizations
• Code snippets

═════════════════════════════════════════════════════════════

Internet goes out
        ↓
┌───────────────────────────────────────────────────────────┐
│  User tries to access page                               │
│  → Network request fails                                  │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  Service Worker catches failure                           │
│  → Checks cache                                           │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  Cached resources found                                   │
│  → Returns cached response                                │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│  User sees:                                               │
│  1. Cached HTML + CSS (page loads normally)              │
│  2. Cached context (scroll position, expanded sections)  │
│  3. Offline indicator ("You're offline")                 │
│  4. Can still read key content                           │
└───────────────────────────────────────────────────────────┘
        ↓
Sales rep in conference call with bad wifi still pitches effectively

═════════════════════════════════════════════════════════════

Internet comes back online
        ↓
Service Worker detects reconnection
        ↓
(Optional) Background Sync:
• Queue pending notes/forms
• Sync with server when possible
• Update fresh content
```

---

## 5. CROSS-TAB SYNC FLOW

```
Desktop - Tab 1 (User browsing)
    ↓
User scrolls to section "Cybersecurity"
    ↓
contextService.updateContext({
  scrollPosition: 2000,
  activePage: 'cybersecurity'
})
    ↓
┌─────────────────────────────────────┐
│ localStorage updated                │
│ (immediate, all tabs see it)         │
├─────────────────────────────────────┤
│ Broadcast Channel message sent:      │
│ {                                   │
│   type: 'CONTEXT_UPDATED',          │
│   payload: { scrollPosition: 2000 } │
│ }                                   │
└─────────────────────────────────────┘
    ↓↓↓ (broadcast to other tabs) ↓↓↓
    ↓                 ↓
Tab 2 (Reading about features)  Tab 3 (ROI calc form)
    ↓                               ↓
Receives broadcast message      Receives broadcast message
    ↓                               ↓
Updates context state           Updates context state
    ↓                               ↓
Components re-render            Components re-render
    ↓                               ↓
SyncIndicator shows             SyncIndicator shows
"Synced with Tab 1 • now"       "Synced with Tab 1 • now"

═════════════════════════════════════════════════════════════

In Tab 2:
- Sync indicator appears
- Shows device type icons
- User knows context is synced
- Can see what Tab 1 is doing (if enabled)

This creates psychological connection:
"My browsing is connected across all my tabs"
```

---

## 6. DEVICE SYNC (MULTI-DEVICE)

```
DESKTOP (Morning)
┌────────────────────────┐
│ Jinki Intelligence     │
│ Browsing Cybersecurity │
│ Scroll: 2500           │
│ Sections: 3 expanded   │
│                        │
│ ✓ Synced              │
│ Context saved locally  │
│ IndexedDB updated      │
└────────────────────────┘
        ↓ (Context stored in IndexedDB + localStorage)
        ↓
        └─ Device ID: "device_1704...xyz"
        └─ Last sync: 9:45 AM

═════════════════════════════════════════════════════════════

Later: Open MOBILE at 10 AM
┌────────────────────────────────────┐
│ Jinki Intelligence Mobile          │
│ Service initializing...            │
│                                    │
│ 1. Check localStorage → Found!     │
│ 2. Load context from storage       │
│ 3. Device type detected: mobile    │
│ 4. Generate new device ID          │
│ 5. Page renders                    │
│ 6. Scroll to 2500                  │
│ 7. Expand sections automatically   │
│                                    │
│ ✓ Context Restored                 │
│ "Where you left off"               │
└────────────────────────────────────┘
        ↓
    MOBILE now shows same content as desktop

═════════════════════════════════════════════════════════════

If Cloud Sync enabled (future feature):
        ↓
┌──────────────────────────────────────────────────────────┐
│ Optional: Sync to cloud server                          │
│                                                          │
│ Desktop sends: { userId, context, timestamp }           │
│         ↓                                                │
│ Cloud stores encrypted backup                           │
│         ↓                                                │
│ Mobile retrieves: Latest context from all devices       │
│         ↓                                                │
│ Mobile shows: Most recent version (device-aware merge)  │
└──────────────────────────────────────────────────────────┘
```

---

## 7. STATE MERGE STRATEGY

When multiple devices update context, this is the priority:

```
Latest Timestamp Wins
│
├─ Desktop updates at 2:00 PM
│  └─ Context timestamp: 1704468000000
│
├─ Mobile updates at 2:05 PM
│  └─ Context timestamp: 1704468300000
│
└─ Result: Mobile version is used (more recent)
   BUT can implement sophisticated merge:

   {
     scrollPosition: 3500,        ← From mobile (later)
     activePage: 'roi-calc',      ← From mobile (later)
     expandedSections: {          ← Merged (both have valuable info)
       cybersecurity: true,       ← From desktop
       roi_calc: true             ← From mobile
     },
     notes: {                     ← Merged (accumulate)
       note_1: { ... },           ← From desktop
       note_2: { ... }            ← From mobile
     }
   }
```

---

## 8. ERROR HANDLING & FALLBACKS

```
Perfect Scenario (all systems work)
├─ IndexedDB available? YES
│  ├─ Broadcast Channel available? YES
│  │  └─ BEST: Real-time sync, full offline support
│  └─ Broadcast Channel unavailable
│     └─ GOOD: Use localStorage polling (30s interval)
├─ IndexedDB unavailable
│  └─ localStorage only
│     └─ ACCEPTABLE: Slower offline, no browser restart persistence
└─ All fail
   └─ FALLBACK: State in memory, lost on reload
      (but no data loss - user context is stateless anyway)

Error Detection
├─ Service initialization fails
│  └─ Log error, continue with degraded mode
├─ IndexedDB quota exceeded
│  └─ Clear old entries, preserve recent data
├─ Decode error on shared URL
│  └─ Fall back to normal page load, show notice
└─ Offline for extended time
   └─ Cache stale indicator, refresh when online
```

---

## 9. INTEGRATION WITH EXISTING SERVICES

```
┌────────────────────────────────────────────────────────────┐
│              Existing Jinki Services                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  PersonalizationContext          CrossDeviceContextService│
│  (User profiling)                (UI state sync)          │
│  │                               │                        │
│  ├─ userSegment                  ├─ scrollPosition        │
│  ├─ detectedIndustry             ├─ activePage           │
│  ├─ behaviors                    ├─ expandedSections     │
│  └─ privacyConsent               └─ notes                │
│           ↓                            ↓                  │
│  Used for: Content ranking     Used for: UI restoration  │
│                                                            │
│  ─────────────────────────────────────────────────────────│
│                                                            │
│  useConversationMemory           useDeviceContextSync    │
│  (Chat history)                  (React integration)      │
│  │                               │                        │
│  ├─ Conversation history         └─ All context methods  │
│  └─ Stored in IndexedDB               (useContext hooks) │
│           ↓                                               │
│  Used for: Chatbot context      Used for: Components     │
│                                                            │
│  ─────────────────────────────────────────────────────────│
│                                                            │
│  useBehaviorTracking             ShareableContextEncoder │
│  (Analytics)                     (URL sharing)           │
│  │                               │                        │
│  └─ Track events, page views     └─ Encode context to   │
│           ↓                          shareable URL        │
│  Used for: Event logging         Used for: Sharing UX    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 10. DECISION TREE: WHICH STORAGE TO USE

```
Need to store user context?
│
├─ Simple preference (< 5KB)?
│  └─ localStorage
│     ✓ Fast
│     ✓ Sync across tabs
│     ✓ No async needed
│
├─ Larger data or offline requirement (5KB - 50MB)?
│  └─ IndexedDB
│     ✓ Async (non-blocking)
│     ✓ Much larger capacity
│     ✓ Transaction safety
│     ✓ Persists offline
│
├─ Needs to sync across devices?
│  └─ Cloud API (optional)
│     ✓ Requires user account
│     ✓ HTTPS only
│     ✓ Explicit consent
│
└─ Needs sharing across sessions?
   └─ URL parameters + base64url encoding
      ✓ No server needed
      ✓ Stateless
      ✓ Shareable
      ✓ No user tracking
```

---

## 11. PERFORMANCE PROFILE

```
Operation              Time      Impact     Notes
────────────────────────────────────────────────────
Service init           15-20ms   One-time   Non-blocking
Context update         <1ms      Per scroll Throttled
IndexedDB write        5-10ms    Async      No UI block
IndexedDB read         2-5ms     On load    Parallel with render
Broadcast Channel msg  <1ms      Per sync   Instant
URL encode/decode      <1ms      Per share  In main thread
Service Worker cache   20-50ms   Per fetch  In SW thread
```

---

## 12. MIGRATION PATH FOR EXISTING DATA

```
Old (localStorage only)
│
└─ New (IndexedDB + localStorage)

   Migration on first load:
   1. Check localStorage for old context
   2. If found, validate and migrate
   3. Move to IndexedDB
   4. Keep in localStorage for cross-tab
   5. Set migration flag
   6. Continue normally
```

---

## SUMMARY

**Cross-Device Context Sync is:**
- Decentralized (works without server)
- Offline-capable (Service Worker caching)
- Real-time (Broadcast Channel API)
- Scalable (no infrastructure needed)
- Graceful (fallbacks at each level)
- Privacy-first (local storage by default)
- Performance-optimized (async operations)

**Result:** Enterprise buyers feel like the experience is intelligent, remembers them, and follows them across all their devices.
