# Noor - Premium Islamic Companion App
## Complete Product Specification for iOS 18 & iPhone 17

**Version:** 1.0.0
**Last Updated:** January 2026
**Target Platform:** iOS 18+, iPhone 17 Series, Vision Pro

---

## Executive Summary

**Noor** (Arabic for "Light") is a premium Islamic mobile application designed to become the indispensable daily spiritual companion for Muslims worldwide. By leveraging cutting-edge iPhone 17 hardware capabilities and iOS 18 software features, Noor removes barriers to consistent Islamic practice while providing an authentically spiritual experience that integrates seamlessly into users' daily routines.

### Mission Statement
*"To illuminate the path of faith through technology that enhances worship, not distracts from it."*

### Key Differentiators
1. **Authentic AI**: GPT-4 tier models fine-tuned exclusively on verified Islamic texts
2. **Hardware Excellence**: Full utilization of iPhone 17 Neural Engine, U2 chip, spatial audio
3. **Ambient Integration**: iOS 18 widgets, Live Activities, and StandBy mode for persistent presence
4. **Privacy-First**: On-device AI processing for offline capability and data protection
5. **Emotional Design**: UI that evokes spiritual calmness, not app fatigue

---

## Table of Contents

1. [Core Features](#core-features)
2. [Technical Architecture](#technical-architecture)
3. [iOS 18 & iPhone 17 Integration](#ios-18--iphone-17-integration)
4. [AI Model Strategy](#ai-model-strategy)
5. [UI/UX Design System](#uiux-design-system)
6. [Content Verification Strategy](#content-verification-strategy)
7. [Habit Formation Framework](#habit-formation-framework)
8. [Monetization Strategy](#monetization-strategy)
9. [Growth & Sharing Strategy](#growth--sharing-strategy)
10. [Performance Requirements](#performance-requirements)

---

## Core Features

### 1. Daily Quran Module

#### 1.1 Audio Recitation Engine
- **Spatial Audio Implementation**: Utilizes iPhone 17's advanced spatial audio processing
  - Head-tracked audio positioning for immersive recitation experience
  - Supports AirPods Pro 3 with lossless spatial audio
  - Dynamic audio that responds to user orientation

- **Reciter Library**
  - 30+ world-renowned reciters (Mishary Rashid, Abdul Basit, etc.)
  - Multiple recitation styles: Murattal, Mujawwad, Warsh, Hafs
  - High-fidelity audio: 24-bit/96kHz for premium tier
  - Verse-by-verse audio sync with visual highlighting

- **Heart-Touching Explanations**
  - AI-generated explanations using fine-tuned GPT-4 model
  - Simple English that resonates emotionally
  - Based on classical tafsir: Ibn Kathir, Al-Tabari, Al-Qurtubi
  - On-device generation via Neural Engine for instant, offline access

#### 1.2 Streak Tracking System
- **iOS 18 Interactive Widgets**
  - Home screen widget showing current streak with flame animation
  - Lock screen widget with daily ayah and streak counter
  - StandBy mode display for bedside Quran motivation
  - Interactive: tap to mark today's reading complete

- **Streak Mechanics**
  - Daily reading goals: customizable (1 page to 1 juz)
  - Grace period: maintains streak if missed by 2 hours
  - Streak freeze: 3 per month for premium users
  - Milestone celebrations: 7, 30, 100, 365 days with shareable badges

#### 1.3 Fajr-Time Reminders
- **Live Activities Integration**
  - Gentle countdown begins 30 minutes before Fajr
  - Dynamic Island pulse animation during active countdown
  - Beautiful sunrise gradient that brightens as Fajr approaches

- **Smart Notification Strategy**
  - Learns user's wake-up patterns via on-device ML
  - Adjusts reminder timing based on historical response
  - Respects Focus Mode: integrates with Sleep Focus
  - Haptic-only option for shared bedrooms

#### 1.4 Offline Mode with On-Device AI
- **Neural Engine Deployment**
  - 3B parameter quantized model running locally
  - Instant tafsir summaries without internet
  - < 500MB model size with INT4 quantization
  - 30ms average response time on Neural Engine

- **Cached Content**
  - Full Quran text (Arabic + translations)
  - Complete audio for selected surah favorites
  - All verified hadith databases
  - User's personal bookmarks and notes

#### 1.5 Adaptive Dark Mode
- **iPhone 17 Display Optimization**
  - True black OLED (#000000) for maximum battery efficiency
  - ProMotion 120Hz for buttery-smooth scrolling
  - Variable refresh rate: 1Hz for static reading
  - Ambient light adaptation via True Tone

- **Night Reading Mode**
  - Warm color temperature shift (2700K-3000K)
  - Reduced blue light with Night Shift integration
  - Minimum brightness optimization for dark rooms
  - Auto-activates based on time and ambient light

---

### 2. Prayer Tracker System

#### 2.1 Precision Salah Times
- **U2 Chip Integration**
  - Ultra-precise GPS: ±3 meter accuracy
  - Indoor location awareness for building-specific times
  - Seamless handoff between GPS and UWB positioning
  - Works in airplane mode with last known location

- **Calculation Methods**
  - All major conventions: ISNA, MWL, Egypt, Makkah, Karachi
  - Hanafi/Shafi'i Asr calculation options
  - High latitude adjustments (7 methods)
  - Manual offset for mosque-specific times

- **Accuracy Verification**
  - Partnership with IslamicFinder API
  - Cross-referenced with local mosque databases
  - User-reported corrections with community voting
  - Annual scholar review for edge cases

#### 2.2 Adhan Audio System
- **Spatial Audio Adhan**
  - Authentic recordings from Makkah and Madinah
  - Spatial audio creates "coming from qibla" effect
  - 15+ beautiful adhan styles selection
  - Fajr-specific gentler adhans available

- **Smart Volume Control**
  - Fades in gently, never jarring
  - Respects system volume and Focus Mode
  - Silent option with haptic-only notification
  - Duration options: full adhan or tasteful excerpt

#### 2.3 AR Qibla Compass
- **iPhone 17 Magnetometer**
  - Enhanced accuracy: ±1 degree heading precision
  - Automatic calibration prompts when needed
  - Works without internet via on-device calculation

- **AR Experience**
  - Camera overlay showing qibla direction
  - Beautiful Ka'bah 3D model in correct orientation
  - Distance to Makkah displayed
  - Works with Vision Pro for immersive guidance

#### 2.4 Prayer Streak Display
- **StandBy Mode Integration**
  - Always-visible prayer dashboard when charging
  - Next prayer countdown with beautiful typography
  - Today's prayers: checkmarks for completed
  - Current streak prominently displayed

- **Individual Prayer Tracking**
  - Separate streaks for each of 5 daily prayers
  - Identifies patterns: "You often miss Fajr on Fridays"
  - Gentle coaching based on prayer history
  - Weekly summary in app with celebration animations

#### 2.5 Missed Prayer Management
- **Qada Tracker**
  - Log missed prayers with optional reason
  - Calculates estimated makeup prayers
  - Suggests prayer times for qada performance
  - Tracks qada completion progress

- **Dynamic Island Nudges**
  - Subtle reminder if prayer window passing
  - Shows "15 minutes until Asr ends" in pill
  - Expandable to show qibla direction
  - Non-intrusive: respects user's agency

#### 2.6 Prayer Widgets
- **Home Screen (Small)**
  - Next prayer name and time
  - Countdown timer with progress ring
  - Tap to mark current prayer complete

- **Home Screen (Medium)**
  - All 5 prayers with completion status
  - Next prayer highlighted
  - Today's streak counter

- **Home Screen (Large)**
  - Full day view with times
  - Qibla compass mini-view
  - Upcoming Islamic date and event

- **Lock Screen**
  - Next prayer name and countdown
  - Optional: current streak badge

---

### 3. Ramadan-Specific Features

#### 3.1 Fasting Timers
- **Live Activities Display**
  - Persistent countdown to iftar on lock screen
  - Progress bar showing fasting completion percentage
  - Beautiful gradient: darker in morning, golden at iftar
  - Celebratory animation when iftar arrives

- **Dynamic Island Integration**
  - Compact: hours:minutes to iftar
  - Expanded: full progress bar with motivational hadith
  - Suhoor mode: countdown to imsak with urgency cues
  - Tap to see full Ramadan dashboard

#### 3.2 Goal Tracking Dashboard
- **Daily Quran Target**
  - Pages read today vs. goal
  - Pace indicator: ahead/behind for Khatm
  - Adjustment recommendations if behind
  - Interactive widget: tap to open today's page

- **Charity Tracker**
  - Log daily sadaqah amounts
  - Monthly total with Zakat calculator
  - Integration with Muslim charity APIs (LaunchGood, etc.)
  - Beautiful visualization of giving history

- **Custom Goals**
  - Dhikr count targets
  - Tafsir pages to read
  - Acts of kindness tracker
  - Fully customizable goal types

#### 3.3 Tarawih Logger
- **Quick Logging**
  - One-tap to log tarawih attendance
  - Track which mosque attended
  - Juz completed during tarawih
  - Integration with prayer streak system

- **Community Features**
  - See friends' tarawih streaks (opt-in)
  - Mosque check-in (optional location sharing)
  - Ramadan leaderboard (private groups only)

#### 3.4 Daily Ramadan Themes
- **Adaptive Widget System**
  - Different visual theme each day
  - Corresponds to that night's significance
  - Laylatul Qadr special themes for last 10 nights
  - Eid countdown in final days

- **Content Rotation**
  - Daily Ramadan hadith
  - Fasting tips and health reminders
  - Historical Ramadan events
  - Dua for each day

---

### 4. Quran AI Chat Assistant

#### 4.1 Model Architecture
- **Primary Model: NoorGPT-4**
  - GPT-4 Turbo fine-tuned on authenticated Islamic corpus
  - Training data: Quran, 6 Sahih Hadith books, major tafsirs
  - Reinforcement learning from Islamic scholars
  - Strict guardrails preventing unverified opinions

- **On-Device Model: NoorLocal-3B**
  - 3 billion parameter model optimized for Neural Engine
  - INT4 quantization: 1.5GB storage
  - Handles 80% of common queries offline
  - Seamless fallback to cloud for complex questions

#### 4.2 Response Capabilities
- **Ayah References**
  - Always cites specific Surah:Ayah
  - Provides Arabic text with transliteration
  - Multiple translation options
  - Deep links to Quran module for full context

- **Hadith Integration**
  - References from Bukhari, Muslim, other Sahih collections
  - Grading always included (Sahih, Hasan, etc.)
  - Chain of narration available on request
  - Distinguishes between hadith types (Qudsi, Nabawi)

- **Simple Explanations**
  - Converts classical Arabic scholarship to accessible English
  - Emotional resonance without scholarly jargon
  - Practical application suggestions
  - Age-appropriate responses (based on user profile)

#### 4.3 Conversation Features
- **Context Awareness**
  - Remembers previous questions in session
  - Builds on prior explanations
  - Suggests related topics
  - Follow-up question prompts

- **Multi-Modal Input**
  - Voice questions via Siri Shortcuts
  - Image input: photograph Arabic text for explanation
  - Screenshot Quran pages for commentary
  - Audio clips for recitation correction

#### 4.4 Content Guardrails
- **Strict Source Limitation**
  - Only responds from verified Islamic sources
  - Clear "I don't know" for questions outside scope
  - No fatwa-giving: redirects to local scholars
  - Disclaimers for scholarly disagreement areas

- **Sectarian Sensitivity**
  - Presents mainstream Sunni views by default
  - Option to include other madhab perspectives
  - Never promotes division or sectarianism
  - Scholarly disagreement presented respectfully

---

### 5. Muslim Women's Section

#### 5.1 Curated Content
- **Daily Verses & Reflections**
  - Motherhood: Maryam (AS), mothers of prophets
  - Marriage: rights and responsibilities
  - Patience: Asiya (AS), Khadijah (RA) examples
  - Self-worth: verses on creation and dignity
  - Scholarship: Aisha (RA) as teacher

- **Content Sources**
  - Quran verses with feminine-focused tafsir
  - Hadith about/from women companions
  - Stories of women scholars in Islamic history
  - Contemporary female scholar contributions

#### 5.2 Design Aesthetic
- **Soft Feminine Theme**
  - Rose gold and sage green accents
  - Softer typography weight
  - Floral geometric patterns (Islamic art inspired)
  - Optional: switch to main app theme

- **Display Optimization**
  - iPhone 17 HDR for rich, warm colors
  - ProMotion smoothness for meditation-like scrolling
  - Thoughtful whitespace for calm reading

#### 5.3 Private Journaling
- **On-Device Encryption**
  - AES-256 encryption with Secure Enclave key
  - FaceID/TouchID required to access
  - No cloud sync: completely local
  - Export option for personal backup only

- **Journaling Features**
  - Prompted reflections based on daily content
  - Gratitude tracking
  - Prayer request log
  - Emotional check-in with dua suggestions

#### 5.4 Community Quotes
- **Curated Positivity**
  - Inspiring quotes from Muslim women
  - No negativity or complaint content
  - Moderated by female scholars
  - User submissions reviewed before publish

- **Sharing Optimized**
  - Beautiful quote card designs
  - One-tap share to Instagram Stories
  - WhatsApp-optimized format
  - Attribution always included

---

## iOS 18 & iPhone 17 Integration

### 6.1 Interactive Widgets

#### Home Screen Widgets
```
┌─────────────────────────────────────┐
│  SMALL (2x2)                        │
├─────────────────────────────────────┤
│  • Prayer countdown with tap-complete
│  • Quran streak with fire animation
│  • Dhikr counter with tap-increment
│  • Next Ramadan meal countdown      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  MEDIUM (4x2)                       │
├─────────────────────────────────────┤
│  • All 5 prayers with tap-complete
│  • Quran reading progress + continue
│  • Ramadan dashboard with timers
│  • AI quick question input          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  LARGE (4x4)                        │
├─────────────────────────────────────┤
│  • Full day prayer schedule
│  • Quran page with audio control
│  • Ramadan comprehensive dashboard
│  • Islamic calendar with events     │
└─────────────────────────────────────┘
```

#### Lock Screen Widgets
- **Inline**: Next prayer time, streak count
- **Circular**: Prayer progress ring, countdown timer
- **Rectangular**: Prayer name + time, daily ayah snippet

#### Widget Interactions (iOS 18)
- **Prayer Widget**: Tap checkmark to log prayer
- **Dhikr Widget**: Tap to increment counter, haptic feedback
- **Quran Widget**: Tap to hear verse audio
- **AI Widget**: Type quick question, see answer in widget

### 6.2 StandBy Mode

#### Bedside Display Modes
- **Night Clock + Quran**
  - Time display with next Fajr countdown
  - Rotating Quranic verses
  - Soft, dim display for dark rooms

- **Prayer Dashboard**
  - All five prayers visible
  - Next prayer prominently highlighted
  - Streak counters for motivation

- **Ramadan Mode**
  - Suhoor/Iftar countdown dominant
  - Fasting progress visualization
  - Daily goal status

### 6.3 Dynamic Island

#### Prayer Time Alerts
- **Compact View**
  - Prayer name + "5 min" countdown
  - Gentle pulsing animation

- **Expanded View**
  - Full prayer details
  - Quick mark-complete button
  - Qibla direction indicator

#### Active Sessions
- **Quran Recitation**
  - Surah name + current ayah
  - Play/pause controls
  - Progress through surah

- **Dhikr Counter**
  - Current count / target
  - Tap to increment
  - Completion celebration animation

### 6.4 Live Activities

#### Ramadan Fasting Timer
```
┌────────────────────────────────────────┐
│  ☪ FASTING UNTIL MAGHRIB              │
│  ████████████████████░░░░ 75%         │
│  ⏱ 2:34:15 remaining                  │
│  "Whoever fasts Ramadan with faith..." │
└────────────────────────────────────────┘
```

#### Prayer Countdown
```
┌────────────────────────────────────────┐
│  🕌 ASR PRAYER                         │
│  Begins in 23 minutes                  │
│  [Mark Complete] [Show Qibla]          │
└────────────────────────────────────────┘
```

#### Quran Session
```
┌────────────────────────────────────────┐
│  📖 SURAH AL-KAHF                      │
│  Verse 45 of 110 | ▶ Playing          │
│  [⏸] [⏭ Next Verse]                   │
└────────────────────────────────────────┘
```

### 6.5 Focus Mode Integration

#### Prayer Focus
- Auto-activates 5 minutes before each prayer
- Silences all non-essential notifications
- Allows only emergency contacts
- Duration: until prayer marked complete or 30 min

#### Quran Study Focus
- User-triggered for dedicated reading time
- Blocks social media notifications
- Allows Noor notifications only
- Suggested duration based on reading goal

### 6.6 Siri Shortcuts

#### Voice Commands
- "Hey Siri, when is Maghrib?" → Speaks prayer time
- "Hey Siri, start dhikr" → Opens counter with timer
- "Hey Siri, which way is qibla?" → Opens AR compass
- "Hey Siri, ask Noor about [topic]" → AI responds
- "Hey Siri, play Surah Mulk" → Starts recitation
- "Hey Siri, log Dhuhr prayer" → Marks complete

#### Custom Shortcuts
- "Morning Adhkar" → Opens morning remembrance
- "Bedtime Routine" → Night adhkar + next Fajr alarm
- "Ramadan Check" → Iftar time + goals status

### 6.7 Action Button (iPhone 17 Pro)

#### Customization Options
- **Qibla Compass**: Instant AR direction
- **Prayer Log**: Quick-log current prayer
- **Dhikr Counter**: Start/resume counting
- **AI Question**: Voice-activated query
- **Random Ayah**: Hear inspiring verse

### 6.8 Vision Pro Compatibility

#### Immersive Experiences
- **Virtual Ka'bah**: 3D qibla visualization
- **Quran Study Space**: Immersive reading environment
- **Makkah/Madinah Tours**: 360° historical sites
- **Prayer Environment**: Beautiful prayer space overlay

### 6.9 Haptic Feedback Design

#### Spiritual Haptics
- **Prayer Complete**: Gentle, satisfying confirmation
- **Streak Milestone**: Celebration pattern
- **Dhikr Count**: Subtle tick on each count
- **Iftar Arrival**: Joyful notification pattern
- **All custom-designed to feel calming, not jarring**

### 6.10 Always-On Display

#### Optimized Displays
- **Prayer Time**: Next prayer always visible
- **Quran Verse**: Rotating daily ayahs
- **Ramadan**: Fasting progress bar
- **Battery efficient**: 1Hz refresh, minimal elements**

---

## AI Model Strategy

### 7.1 Model Hierarchy

```
┌─────────────────────────────────────────────────┐
│              AI MODEL ARCHITECTURE               │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │         CLOUD: NoorGPT-4 Turbo            │  │
│  │  • Full conversational capability          │  │
│  │  • Complex tafsir explanations             │  │
│  │  • Multi-turn reasoning                    │  │
│  │  • Fiqh question handling                  │  │
│  │  • Scholar-level responses                 │  │
│  └───────────────────────────────────────────┘  │
│                      ▲                          │
│                      │ Fallback                 │
│                      ▼                          │
│  ┌───────────────────────────────────────────┐  │
│  │      ON-DEVICE: NoorLocal-3B (Neural)     │  │
│  │  • Common question answering               │  │
│  │  • Ayah explanations                       │  │
│  │  • Hadith lookup and context               │  │
│  │  • Privacy-preserving                      │  │
│  │  • Offline capable                         │  │
│  └───────────────────────────────────────────┘  │
│                      ▲                          │
│                      │ Route                    │
│                      ▼                          │
│  ┌───────────────────────────────────────────┐  │
│  │        ROUTER: Query Classifier            │  │
│  │  • Determines on-device vs cloud           │  │
│  │  • Complexity assessment                   │  │
│  │  • Privacy sensitivity check               │  │
│  │  • Offline availability detection          │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
├─────────────────────────────────────────────────┤
│              SUPPORTING MODELS                   │
├─────────────────────────────────────────────────┤
│  • Content Guard: Filters non-Islamic queries   │
│  • Explanation Generator: Scholarly → Simple    │
│  • Personalization: Learns user's interests     │
│  • Translation: Arabic ↔ English refinement     │
└─────────────────────────────────────────────────┘
```

### 7.2 Training Data Sources

#### Quran
- Full Arabic text with diacritics
- 50+ English translations
- 10 major tafsirs (Arabic)
- 5 English tafsirs (Ibn Kathir, etc.)

#### Hadith
- Sahih Bukhari (complete)
- Sahih Muslim (complete)
- Sunan Abu Dawud
- Jami' at-Tirmidhi
- Sunan an-Nasa'i
- Sunan Ibn Majah
- Muwatta Malik
- Musnad Ahmad (selections)

#### Scholarly Works
- Classical fiqh texts (4 madhabs)
- Seerah (Ibn Hisham, Ibn Kathir)
- Aqeedah texts (Tahawiyyah, etc.)
- Contemporary fatwa databases (with verification)

### 7.3 Content Guardrails

```
┌─────────────────────────────────────────────────┐
│            GUARDRAIL SYSTEM                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  INPUT FILTERING                                 │
│  ├── Reject non-Islamic topics                  │
│  ├── Identify potential fatwa requests          │
│  ├── Flag sectarian queries                     │
│  └── Detect harmful intent                      │
│                                                  │
│  RESPONSE VALIDATION                             │
│  ├── Verify all citations exist                 │
│  ├── Cross-check hadith grading                 │
│  ├── Ensure balanced madhab representation      │
│  └── Add appropriate disclaimers                │
│                                                  │
│  OUTPUT SANITIZATION                             │
│  ├── Remove any unverified opinions             │
│  ├── Add "consult local scholar" for fiqh       │
│  ├── Flag low-confidence responses              │
│  └── Include source citations                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 7.4 Privacy Architecture

- **On-Device First**: 80% of queries processed locally
- **No Query Logging**: Cloud queries not stored
- **Anonymization**: User IDs stripped from cloud requests
- **Secure Transit**: TLS 1.3 with certificate pinning
- **Data Residency**: Option for regional cloud processing

---

## UI/UX Design System

### 8.1 Design Principles

#### Spiritual Calm
- No aggressive colors or animations
- Generous whitespace
- Slow, peaceful transitions
- UI recedes, content shines

#### Authentic Islamic Aesthetic
- Geometric patterns from Islamic art
- Arabic calligraphy as design element
- Colors inspired by mosque architecture
- No cartoonish or casual imagery

#### Modern Simplicity
- Clean, uncluttered interfaces
- Obvious navigation paths
- Minimal cognitive load
- Feature discoverability without overwhelm

### 8.2 Color System

```
┌─────────────────────────────────────────────────┐
│              NOOR COLOR PALETTE                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  PRIMARY COLORS                                  │
│  ┌─────────┐                                    │
│  │ Emerald │  #0D7377  - Trust, Islam, growth   │
│  └─────────┘                                    │
│  ┌─────────┐                                    │
│  │ Gold    │  #D4AF37  - Illumination, premium  │
│  └─────────┘                                    │
│                                                  │
│  NEUTRAL PALETTE                                 │
│  ┌─────────┐                                    │
│  │ Ivory   │  #F5F5DC  - Parchment, scholarly   │
│  └─────────┘                                    │
│  ┌─────────┐                                    │
│  │ Charcoal│  #2D2D2D  - Depth, sophistication  │
│  └─────────┘                                    │
│                                                  │
│  ACCENT COLORS                                   │
│  ┌─────────┐                                    │
│  │ Azure   │  #0077B6  - Sky, spirituality      │
│  └─────────┘                                    │
│  ┌─────────┐                                    │
│  │ Rose    │  #B76E79  - Warmth (women's sect.) │
│  └─────────┘                                    │
│                                                  │
│  DARK MODE                                       │
│  ┌─────────┐                                    │
│  │ Black   │  #000000  - True black for OLED    │
│  └─────────┘                                    │
│  ┌─────────┐                                    │
│  │ Dark    │  #121212  - Surface elevation      │
│  └─────────┘                                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 8.3 Typography

#### Arabic Text
- **Primary**: Scheherazade New (Quran)
- **Headers**: Amiri (elegant headings)
- **UI**: SF Arabic (system integration)

#### English Text
- **Primary**: SF Pro (iOS native)
- **Reading**: Source Serif Pro (long-form)
- **Accent**: Cormorant Garamond (quotes)

#### Size Scale
- Body: 17pt (Dynamic Type base)
- Quran: 24pt minimum (customizable to 48pt)
- Headers: 28/22/17pt hierarchy
- Captions: 13pt

### 8.4 Animation Principles

- **Duration**: 300-500ms standard, 800ms celebrations
- **Easing**: Ease-out for entries, ease-in-out for transitions
- **Spring**: Gentle spring for bouncy elements
- **Purpose**: Every animation serves function, not decoration

### 8.5 Haptic Design

```
┌─────────────────────────────────────────────────┐
│            HAPTIC FEEDBACK PATTERNS              │
├─────────────────────────────────────────────────┤
│                                                  │
│  PRAYER COMPLETE                                 │
│  └── Soft double-tap: ∙∙                        │
│                                                  │
│  STREAK MILESTONE                                │
│  └── Rising crescendo: ∙∙∙∙∙                    │
│                                                  │
│  DHIKR COUNT                                     │
│  └── Subtle click: ∙                            │
│                                                  │
│  IFTAR TIME                                      │
│  └── Joyful pattern: ∙∙ ∙∙ ∙∙∙                  │
│                                                  │
│  ADHAN ALERT                                     │
│  └── Gentle pulse: ∙ ∙ ∙                        │
│                                                  │
│  ERROR                                           │
│  └── Soft warning: ∙∙                           │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Content Verification Strategy

### 9.1 Scholar Partnerships

#### Advisory Board
- **Quranic Studies**: Dr. [TBD] - Tafsir specialist
- **Hadith Sciences**: Sh. [TBD] - Isnad expert
- **Fiqh**: Representatives from 4 madhabs
- **Women's Issues**: Female scholars specializing in fiqh

#### Review Process
1. All AI training data reviewed by scholars
2. Monthly content audits of AI responses
3. User-reported issues reviewed within 24 hours
4. Annual comprehensive review

### 9.2 Source Authentication

```
┌─────────────────────────────────────────────────┐
│          CONTENT VERIFICATION PIPELINE           │
├─────────────────────────────────────────────────┤
│                                                  │
│  QURAN                                           │
│  └── Verified against Medina Mushaf             │
│  └── Digital certification from authorities     │
│  └── Multiple qira'at cross-referenced          │
│                                                  │
│  HADITH                                          │
│  └── Sunnah.com API (verified database)         │
│  └── Hadith grading always included             │
│  └── Chain of narrators available               │
│                                                  │
│  TAFSIR                                          │
│  └── Published printed editions as source       │
│  └── Altafsir.com partnership                   │
│  └── Scholar review of AI summaries             │
│                                                  │
│  FIQH                                            │
│  └── Classical texts only (no opinions)         │
│  └── Madhab clearly identified                  │
│  └── "Consult scholar" for personal rulings     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 9.3 User Trust Indicators

- Source citation on every AI response
- Confidence level indicator (High/Medium)
- "Scholarly disagreement exists" flag
- Easy reporting for inaccurate content
- Transparent about AI limitations

---

## Habit Formation Framework

### 10.1 Daily Touchpoints

```
┌─────────────────────────────────────────────────┐
│           DAILY HABIT INTEGRATION                │
├─────────────────────────────────────────────────┤
│                                                  │
│  MORNING (FAJR)                                  │
│  ├── Live Activity countdown to Fajr            │
│  ├── Morning adhkar notification                │
│  ├── Daily ayah on lock screen widget           │
│  └── StandBy display if phone charging          │
│                                                  │
│  THROUGHOUT DAY                                  │
│  ├── Prayer countdowns in Dynamic Island        │
│  ├── Widgets showing streaks (motivation)       │
│  ├── Dhikr reminder (customizable times)        │
│  └── Quick AI questions from widget             │
│                                                  │
│  EVENING (MAGHRIB/ISHA)                         │
│  ├── Quran reading reminder                     │
│  ├── Daily review notification                  │
│  ├── Night adhkar before bed                    │
│  └── Next Fajr time displayed                   │
│                                                  │
│  RAMADAN ADDITIONAL                              │
│  ├── Suhoor countdown/alarm                     │
│  ├── All-day iftar countdown                    │
│  ├── Tarawih reminder                           │
│  └── Daily goal check-in                        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 10.2 Streak Psychology

#### Motivation Without Guilt
- Celebrate streaks, never shame breaks
- "Welcome back" not "You missed X days"
- Streak freezes available (premium)
- Grace periods for near-misses

#### Visible Progress
- Home screen widget shows streak prominently
- Milestone celebrations with shareable badges
- Monthly/yearly progress visualizations
- Comparison to personal best, not others

### 10.3 Notification Strategy

#### Principles
- **Gentle**: Never jarring or anxiety-inducing
- **Valuable**: Every notification provides benefit
- **Customizable**: User controls frequency
- **Respectful**: Honors Focus Mode and quiet hours

#### Types
- **Time-Sensitive**: Prayer times, Ramadan timers
- **Motivational**: Streak reminders, milestones
- **Content**: Daily ayah, hadith (opt-in)
- **Social**: Community activity (opt-in)

---

## Monetization Strategy

### 11.1 Tier Structure

```
┌─────────────────────────────────────────────────┐
│              NOOR SUBSCRIPTION TIERS             │
├─────────────────────────────────────────────────┤
│                                                  │
│  FREE TIER                                       │
│  ├── Prayer times (accurate, all locations)     │
│  ├── Basic qibla compass                        │
│  ├── Quran reading (1 translation)              │
│  ├── 5 AI questions per day                     │
│  ├── Basic widgets (non-interactive)            │
│  ├── 7-day streak tracking                      │
│  └── Ramadan basic features                     │
│                                                  │
│  PREMIUM - $4.99/month or $39.99/year           │
│  ├── All free features, plus:                   │
│  ├── Unlimited AI questions                     │
│  ├── Offline AI (on-device model)               │
│  ├── All reciters (30+)                         │
│  ├── Interactive widgets                        │
│  ├── All translations (50+)                     │
│  ├── Advanced streak features                   │
│  ├── Women's section full access                │
│  ├── Priority support                           │
│  └── All Ramadan premium features               │
│                                                  │
│  FAMILY - $9.99/month (up to 6 members)         │
│  ├── All premium features for family            │
│  ├── Family prayer tracking                     │
│  ├── Shared Ramadan goals                       │
│  └── Child-friendly AI mode                     │
│                                                  │
│  LIFETIME - $149.99 (one-time)                  │
│  ├── All premium features forever               │
│  ├── Early access to new features               │
│  └── Founding supporter recognition             │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 11.2 Value Proposition

#### Why Users Pay
- **AI Value**: Unlimited scholarly answers
- **Convenience**: Offline access everywhere
- **Aesthetics**: Beautiful interactive widgets
- **Community**: Family features
- **Faith Investment**: Supporting Islamic tech

#### Conversion Strategy
- Free tier genuinely useful (not crippled)
- Premium previews (try feature X 3 times free)
- Ramadan discount (annual subscription)
- Zakat-compliant: portion of revenue to charity

---

## Growth & Sharing Strategy

### 12.1 Shareable Content

#### Beautiful Quote Cards
- One-tap generation from any ayah/hadith
- Multiple design templates
- Automatic size optimization for Stories/Posts
- Optional user attribution
- Deep link back to app

#### Streak Badges
- Milestone celebrations (7, 30, 100 days)
- Shareable badge images
- "Join me on Noor" call-to-action
- Family challenge invites

#### Ramadan Specials
- "Day X of Ramadan" shareable cards
- Iftar countdown shares
- Quran completion certificates
- Eid greeting cards

### 12.2 Organic Growth Channels

```
┌─────────────────────────────────────────────────┐
│            GROWTH CHANNEL STRATEGY               │
├─────────────────────────────────────────────────┤
│                                                  │
│  FAMILY WHATSAPP GROUPS                          │
│  ├── Primary sharing destination                 │
│  ├── Quote cards optimized for WhatsApp         │
│  ├── Family subscription encourages sharing     │
│  └── "Invite family" prominent in app           │
│                                                  │
│  INSTAGRAM STORIES                               │
│  ├── Story-formatted content                    │
│  ├── Daily ayah perfect for Stories             │
│  ├── Streak milestones shareable               │
│  └── Ramadan countdown aesthetics               │
│                                                  │
│  MOSQUE COMMUNITIES                              │
│  ├── Mosque partnership program                 │
│  ├── QR codes for easy download                 │
│  ├── Community features for congregations       │
│  └── Imam recommendation program                │
│                                                  │
│  APP STORE OPTIMIZATION                          │
│  ├── Ramadan keyword targeting                  │
│  ├── Seasonal feature highlighting              │
│  ├── Review solicitation at happy moments       │
│  └── Localization for Muslim-majority regions   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 12.3 Ramadan Strategy

#### Pre-Ramadan (1 month before)
- Feature announcements building anticipation
- Early-bird subscription discount
- "Prepare for Ramadan" content series
- Influencer partnerships

#### During Ramadan
- Daily content refresh
- Iftar countdown prominent in stores
- Live Activities showcase
- Community challenges

#### Post-Ramadan Retention
- "Continue your streak" encouragement
- Shawwal fasting feature
- Year-round habit building
- Preview of next year's features

---

## Performance Requirements

### 13.1 Technical Specifications

```
┌─────────────────────────────────────────────────┐
│           PERFORMANCE REQUIREMENTS               │
├─────────────────────────────────────────────────┤
│                                                  │
│  APP LAUNCH                                      │
│  └── Cold start: < 1.5 seconds                  │
│  └── Warm start: < 0.5 seconds                  │
│  └── Widget load: < 100ms                       │
│                                                  │
│  AI RESPONSE                                     │
│  └── On-device: < 500ms first token             │
│  └── Cloud: < 2 seconds first token             │
│  └── Streaming: continuous output               │
│                                                  │
│  AUDIO                                           │
│  └── Playback start: < 200ms                    │
│  └── Seek: instant                              │
│  └── Background: zero interruption              │
│                                                  │
│  LOCATION                                        │
│  └── Prayer time calculation: < 100ms           │
│  └── GPS acquisition: < 3 seconds               │
│  └── Qibla accuracy: ±1 degree                  │
│                                                  │
│  BATTERY                                         │
│  └── Background: < 1% per hour                  │
│  └── Active use: < 5% per hour                  │
│  └── Location services: optimized batching      │
│                                                  │
│  STORAGE                                         │
│  └── App size: < 100MB (without audio)          │
│  └── On-device AI model: ~1.5GB optional        │
│  └── Full Quran audio: ~2GB optional            │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 13.2 Reliability Requirements

- **Uptime**: 99.9% for cloud services
- **Prayer Times**: 100% accuracy guarantee
- **Offline**: Core features work without internet
- **Sync**: Eventual consistency within 30 seconds
- **Backup**: User data recoverable within 24 hours

---

## Appendix A: Competitive Analysis

| Feature | Noor | Muslim Pro | Quran.com | Hallow (Benchmark) |
|---------|------|------------|-----------|-------------------|
| Prayer Times | U2 Chip Precision | Standard GPS | N/A | N/A |
| AI Assistant | GPT-4 Fine-tuned | None | Basic Search | GPT-4 Fine-tuned |
| iOS 18 Widgets | Full Interactive | Basic | None | Full Interactive |
| Live Activities | Full Support | None | None | Full Support |
| Offline AI | Neural Engine | None | None | Neural Engine |
| StandBy Mode | Optimized | None | None | Optimized |
| Spatial Audio | Full Support | Basic | None | Full Support |

---

## Appendix B: Development Phases

### Phase 1: Foundation (Months 1-3)
- Core app architecture
- Prayer times engine
- Basic Quran module
- Widget framework

### Phase 2: Intelligence (Months 4-6)
- AI chat integration
- On-device model deployment
- Content verification pipeline
- Advanced widgets

### Phase 3: Polish (Months 7-8)
- UI/UX refinement
- Performance optimization
- Beta testing
- Scholar review

### Phase 4: Launch (Month 9)
- App Store submission
- Marketing campaign
- Ramadan timing (if applicable)
- Community building

---

*Document Version: 1.0.0*
*Classification: Internal Product Specification*
*Next Review: Pre-Development Kickoff*
