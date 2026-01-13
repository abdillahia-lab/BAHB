# Noor App - Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NOOR APP ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         PRESENTATION LAYER                                  │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │ │
│  │  │   SwiftUI    │ │   Widgets    │ │ Live         │ │ Dynamic Island   │  │ │
│  │  │   Views      │ │ (Home/Lock)  │ │ Activities   │ │ Controller       │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘  │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │ │
│  │  │   StandBy    │ │  Vision Pro  │ │    Siri      │ │ Action Button    │  │ │
│  │  │   Displays   │ │   Scenes     │ │  Intents     │ │ Handler          │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                          │
│                                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                          VIEWMODEL LAYER                                    │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │ │
│  │  │  PrayerVM    │ │   QuranVM    │ │  AIChatVM    │ │   RamadanVM      │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘  │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │ │
│  │  │  WomensVM    │ │  WidgetVM    │ │   StreakVM   │ │   SettingsVM     │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                          │
│                                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                           SERVICE LAYER                                     │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │ │
│  │  │ PrayerTime   │ │   Quran      │ │     AI       │ │   Location       │  │ │
│  │  │  Service     │ │  Service     │ │   Service    │ │   Service        │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘  │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │ │
│  │  │   Audio      │ │  Haptics     │ │ Notification │ │    Sync          │  │ │
│  │  │   Engine     │ │  Engine      │ │   Manager    │ │   Service        │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                          │
│                                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                            DATA LAYER                                       │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │ │
│  │  │  SwiftData   │ │   Keychain   │ │    Cache     │ │   UserDefaults   │  │ │
│  │  │  (Local DB)  │ │  (Secrets)   │ │   Manager    │ │   (App Group)    │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                          │
│                                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         AI/ML LAYER                                         │ │
│  │  ┌─────────────────────────────────┐ ┌────────────────────────────────────┐│ │
│  │  │      ON-DEVICE (Neural Engine)  │ │           CLOUD                    ││ │
│  │  │  ┌───────────┐ ┌─────────────┐  │ │  ┌───────────┐ ┌────────────────┐ ││ │
│  │  │  │NoorLocal  │ │ QueryRouter │  │ │  │ NoorGPT-4 │ │ Content Guard  │ ││ │
│  │  │  │   3B      │ │             │  │ │  │  Turbo    │ │                │ ││ │
│  │  │  └───────────┘ └─────────────┘  │ │  └───────────┘ └────────────────┘ ││ │
│  │  └─────────────────────────────────┘ └────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Architecture

### Core Modules

```
Sources/NoorApp/
├── Core/
│   ├── Models/           # Domain models
│   ├── Services/         # Business logic services
│   ├── Utilities/        # Helper functions
│   ├── Extensions/       # Swift extensions
│   └── Configuration/    # App configuration
│
├── Features/
│   ├── Prayer/           # Salah tracking feature
│   ├── Quran/            # Quran reading feature
│   ├── AIChat/           # AI assistant feature
│   ├── Ramadan/          # Ramadan-specific feature
│   └── WomensSection/    # Women's content feature
│
├── iOS18Integration/
│   ├── Widgets/          # Home & Lock screen widgets
│   ├── LiveActivities/   # Live Activity controllers
│   ├── DynamicIsland/    # Dynamic Island UI
│   ├── StandBy/          # StandBy mode displays
│   ├── ActionButton/     # Action button handlers
│   ├── Shortcuts/        # Siri Shortcuts
│   └── VisionPro/        # Vision Pro compatibility
│
├── UI/
│   ├── Theme/            # Design system
│   ├── Components/       # Reusable UI components
│   ├── Animations/       # Custom animations
│   └── Haptics/          # Haptic feedback patterns
│
├── AI/
│   ├── OnDevice/         # Core ML models
│   ├── CloudModels/      # API integrations
│   └── ContentGuard/     # Response validation
│
├── Data/
│   ├── Local/            # SwiftData models
│   ├── Sync/             # CloudKit sync
│   └── Cache/            # Caching layer
│
└── Resources/
    ├── Quran/            # Quran data & audio
    ├── Hadith/           # Hadith database
    ├── Tafsir/           # Tafsir content
    └── Assets/           # Images, fonts, etc.
```

---

## iPhone 17 Hardware Utilization

### Neural Engine Integration

```swift
// AI Model Deployment Strategy
┌─────────────────────────────────────────────────────────────────┐
│                NEURAL ENGINE DEPLOYMENT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MODEL: NoorLocal-3B                                            │
│  ├── Architecture: Transformer (decoder-only)                   │
│  ├── Parameters: 3 billion                                      │
│  ├── Quantization: INT4 (GPTQ)                                  │
│  ├── Size: ~1.5GB                                               │
│  ├── Inference: ~30ms per token                                 │
│  └── Context: 4096 tokens                                       │
│                                                                  │
│  DEPLOYMENT                                                      │
│  ├── Format: Core ML (.mlpackage)                               │
│  ├── Compute: Neural Engine (preferred)                         │
│  ├── Fallback: GPU → CPU                                        │
│  └── Memory: ~2GB peak                                          │
│                                                                  │
│  CAPABILITIES                                                    │
│  ├── Ayah explanation generation                                │
│  ├── Hadith context lookup                                      │
│  ├── Basic Q&A (80% of queries)                                 │
│  └── Dua suggestions                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### U2 Chip Location Services

```swift
// Precision Location for Prayer Times
┌─────────────────────────────────────────────────────────────────┐
│                  U2 CHIP INTEGRATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CAPABILITIES                                                    │
│  ├── GPS Precision: ±3 meters outdoor                           │
│  ├── UWB Indoor: ±10cm (with anchors)                           │
│  ├── Heading: ±1 degree (magnetometer fusion)                   │
│  └── Altitude: ±5 meters (barometric)                           │
│                                                                  │
│  PRAYER TIME OPTIMIZATION                                        │
│  ├── Building-specific sun angle calculation                    │
│  ├── Elevation-adjusted times (mountains/valleys)               │
│  ├── Indoor/outdoor detection for accuracy                      │
│  └── Background location with minimal battery                   │
│                                                                  │
│  QIBLA COMPASS                                                   │
│  ├── Magnetometer + gyroscope fusion                            │
│  ├── Real-time calibration status                               │
│  ├── True north compensation                                     │
│  └── AR overlay with camera alignment                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Spatial Audio Engine

```swift
// Immersive Quran Recitation
┌─────────────────────────────────────────────────────────────────┐
│                 SPATIAL AUDIO IMPLEMENTATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AUDIO FORMAT                                                    │
│  ├── Codec: AAC-LC / ALAC (lossless)                            │
│  ├── Sample Rate: 48kHz (standard) / 96kHz (premium)            │
│  ├── Bit Depth: 16-bit / 24-bit                                 │
│  └── Channels: Stereo + spatial metadata                        │
│                                                                  │
│  SPATIAL FEATURES                                                │
│  ├── Head tracking (AirPods Pro 3)                              │
│  ├── "From qibla" positioning for adhan                         │
│  ├── Immersive surround for recitation                          │
│  └── Dynamic head-locked for personal listening                 │
│                                                                  │
│  IMPLEMENTATION                                                  │
│  ├── AVAudioEngine with spatial mixer                           │
│  ├── PHASESoundEvent for complex scenes                         │
│  └── CMHeadphoneMotionManager for tracking                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ProMotion Display Optimization

```swift
// Adaptive Refresh Rate Strategy
┌─────────────────────────────────────────────────────────────────┐
│                 PROMOTION DISPLAY USAGE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  REFRESH RATE MODES                                              │
│  ├── 120Hz: Scrolling, animations, transitions                  │
│  ├── 60Hz: Standard interactions                                │
│  ├── 30Hz: Video playback                                       │
│  ├── 10Hz: Static content with cursor                           │
│  └── 1Hz: Always-On Display (static)                            │
│                                                                  │
│  QURAN READING                                                   │
│  ├── Scroll: 120Hz for buttery smoothness                       │
│  ├── Static: 10Hz for battery efficiency                        │
│  └── Page turn: 120Hz animation                                 │
│                                                                  │
│  ALWAYS-ON DISPLAY                                               │
│  ├── Prayer times: 1Hz refresh                                  │
│  ├── Countdown: 1Hz (second updates)                            │
│  └── Ayah rotation: 1Hz with fade                               │
│                                                                  │
│  HDR CONTENT                                                     │
│  ├── Peak brightness: 2000 nits (outdoor)                       │
│  ├── SDR brightness: 1000 nits (typical)                        │
│  └── Night mode: 1 nit minimum                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## iOS 18 Feature Implementation

### Widget Architecture

```swift
// Widget Target Structure
NoorWidgets/
├── NoorWidgetBundle.swift          # Widget bundle entry
├── PrayerWidget/
│   ├── PrayerWidgetProvider.swift  # Timeline provider
│   ├── PrayerWidgetEntry.swift     # Entry model
│   ├── PrayerWidgetView.swift      # SwiftUI view
│   └── PrayerWidgetIntent.swift    # Interactive intent
├── QuranWidget/
│   ├── QuranWidgetProvider.swift
│   ├── QuranWidgetEntry.swift
│   ├── QuranWidgetView.swift
│   └── QuranWidgetIntent.swift
├── RamadanWidget/
│   ├── FastingTimerProvider.swift
│   ├── FastingTimerEntry.swift
│   └── FastingTimerView.swift
├── DhikrWidget/
│   ├── DhikrCounterProvider.swift
│   ├── DhikrCounterEntry.swift
│   ├── DhikrCounterView.swift
│   └── DhikrCounterIntent.swift    # Tap to increment
└── Shared/
    ├── WidgetStyles.swift
    └── WidgetColors.swift
```

### Live Activities Implementation

```swift
// Live Activity Structure
┌─────────────────────────────────────────────────────────────────┐
│                 LIVE ACTIVITIES TYPES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PRAYER COUNTDOWN                                                │
│  ├── Trigger: 15 minutes before prayer                          │
│  ├── Update: Every minute                                       │
│  ├── End: Prayer marked complete or 30 min after               │
│  └── Actions: Mark complete, Show qibla                         │
│                                                                  │
│  RAMADAN FASTING                                                 │
│  ├── Trigger: After Fajr (imsak)                                │
│  ├── Update: Every minute                                       │
│  ├── End: At Maghrib (iftar)                                    │
│  └── Display: Progress bar, time remaining                      │
│                                                                  │
│  QURAN RECITATION                                                │
│  ├── Trigger: Audio playback starts                             │
│  ├── Update: Each verse change                                  │
│  ├── End: Playback stopped                                      │
│  └── Actions: Play/pause, next verse                            │
│                                                                  │
│  DHIKR SESSION                                                   │
│  ├── Trigger: User starts counting                              │
│  ├── Update: Each count increment                               │
│  ├── End: Target reached or user stops                          │
│  └── Actions: Increment, reset                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Dynamic Island States

```swift
// Dynamic Island UI Hierarchy
┌─────────────────────────────────────────────────────────────────┐
│                 DYNAMIC ISLAND LAYOUTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  COMPACT (Minimal)                                               │
│  ┌─────────────────────────────────────────┐                    │
│  │  🕌 ASR    │    14:32                    │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
│  EXPANDED (Tap to reveal)                                        │
│  ┌─────────────────────────────────────────┐                    │
│  │  🕌 ASR PRAYER                          │                    │
│  │  Begins in 14 minutes                   │                    │
│  │  ━━━━━━━━━━━━━━━━━━━░░░░░              │                    │
│  │  [✓ Complete]  [🧭 Qibla]               │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
│  MINIMAL (Lock screen pill)                                      │
│  ┌──────────────┐                                               │
│  │  🕌 14:32    │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Integration Architecture

### Query Routing System

```swift
// Intelligent Query Router
┌─────────────────────────────────────────────────────────────────┐
│                    QUERY ROUTING LOGIC                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INPUT: User question                                            │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────┐                                        │
│  │  CLASSIFIER MODEL   │  (Tiny on-device classifier)           │
│  │  - Topic detection  │                                        │
│  │  - Complexity score │                                        │
│  │  - Privacy check    │                                        │
│  └─────────────────────┘                                        │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    ROUTING DECISION                          ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                              ││
│  │  ON-DEVICE (NoorLocal-3B) if:                               ││
│  │  ├── Simple ayah explanation                                ││
│  │  ├── Basic hadith lookup                                    ││
│  │  ├── Prayer/fasting questions                               ││
│  │  ├── Dua requests                                           ││
│  │  ├── No internet available                                  ││
│  │  └── User prefers offline mode                              ││
│  │                                                              ││
│  │  CLOUD (NoorGPT-4) if:                                      ││
│  │  ├── Complex fiqh question                                  ││
│  │  ├── Multi-source synthesis required                        ││
│  │  ├── Comparative madhab analysis                            ││
│  │  ├── Historical context needed                              ││
│  │  └── On-device confidence < 80%                             ││
│  │                                                              ││
│  │  REJECT if:                                                  ││
│  │  ├── Non-Islamic topic                                      ││
│  │  ├── Fatwa request detected                                 ││
│  │  ├── Harmful content                                        ││
│  │  └── Sectarian promotion                                    ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Content Guard Pipeline

```swift
// Response Validation System
┌─────────────────────────────────────────────────────────────────┐
│                  CONTENT GUARD PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STAGE 1: INPUT VALIDATION                                       │
│  ├── Topic classification (Islamic vs non-Islamic)              │
│  ├── Intent detection (question vs fatwa request)               │
│  ├── Sensitivity check (sectarian content)                      │
│  └── Language detection and normalization                       │
│                                                                  │
│  STAGE 2: CITATION VERIFICATION                                  │
│  ├── Extract all Quran references (Surah:Ayah)                  │
│  ├── Validate against verified Quran database                   │
│  ├── Extract hadith references                                  │
│  ├── Verify hadith exists in authenticated collections          │
│  └── Check grading accuracy (Sahih, Hasan, etc.)               │
│                                                                  │
│  STAGE 3: CONTENT ANALYSIS                                       │
│  ├── Factual accuracy assessment                                │
│  ├── Mainstream scholarly alignment                             │
│  ├── Balanced madhab representation                             │
│  └── Appropriate disclaimer injection                           │
│                                                                  │
│  STAGE 4: OUTPUT FORMATTING                                      │
│  ├── Add source citations                                       │
│  ├── Include confidence indicator                               │
│  ├── Add "consult scholar" where appropriate                    │
│  └── Format for display (markdown, deep links)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Architecture

### SwiftData Models

```swift
// Core Data Models
┌─────────────────────────────────────────────────────────────────┐
│                   SWIFTDATA SCHEMA                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  @Model PrayerLog                                                │
│  ├── id: UUID                                                   │
│  ├── prayerType: PrayerType (enum)                              │
│  ├── date: Date                                                 │
│  ├── completedAt: Date?                                         │
│  ├── status: PrayerStatus (completed/missed/qada)               │
│  ├── location: CLLocationCoordinate2D?                          │
│  └── notes: String?                                             │
│                                                                  │
│  @Model QuranProgress                                            │
│  ├── id: UUID                                                   │
│  ├── surah: Int                                                 │
│  ├── ayah: Int                                                  │
│  ├── juz: Int                                                   │
│  ├── page: Int                                                  │
│  ├── timestamp: Date                                            │
│  ├── duration: TimeInterval                                     │
│  └── audioListened: Bool                                        │
│                                                                  │
│  @Model StreakRecord                                             │
│  ├── id: UUID                                                   │
│  ├── type: StreakType (quran/prayer/dhikr)                      │
│  ├── currentStreak: Int                                         │
│  ├── longestStreak: Int                                         │
│  ├── lastCompletedDate: Date                                    │
│  └── freezesUsed: Int                                           │
│                                                                  │
│  @Model AIConversation                                           │
│  ├── id: UUID                                                   │
│  ├── messages: [AIMessage]                                      │
│  ├── createdAt: Date                                            │
│  ├── topic: String?                                             │
│  └── isBookmarked: Bool                                         │
│                                                                  │
│  @Model RamadanGoal                                              │
│  ├── id: UUID                                                   │
│  ├── year: Int                                                  │
│  ├── type: GoalType                                             │
│  ├── target: Int                                                │
│  ├── current: Int                                               │
│  └── dailyProgress: [DailyProgress]                             │
│                                                                  │
│  @Model JournalEntry (encrypted)                                 │
│  ├── id: UUID                                                   │
│  ├── date: Date                                                 │
│  ├── encryptedContent: Data                                     │
│  ├── mood: Mood?                                                │
│  └── relatedAyah: String?                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### App Group Data Sharing

```swift
// Cross-Target Data Access
┌─────────────────────────────────────────────────────────────────┐
│                    APP GROUP ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  App Group: group.com.noor.app                                  │
│                                                                  │
│  SHARED DATA                                                     │
│  ├── UserDefaults (App Group suite)                             │
│  │   ├── nextPrayerTime: Date                                   │
│  │   ├── currentStreak: Int                                     │
│  │   ├── ramadanIftar: Date                                     │
│  │   ├── dhikrCount: Int                                        │
│  │   └── lastQuranPosition: QuranPosition                       │
│  │                                                               │
│  ├── SwiftData Container (shared)                               │
│  │   └── All @Model types above                                 │
│  │                                                               │
│  └── File Container                                              │
│      ├── cached_audio/                                          │
│      ├── offline_model/                                         │
│      └── widget_snapshots/                                      │
│                                                                  │
│  TARGETS SHARING DATA                                            │
│  ├── NoorApp (main app)                                         │
│  ├── NoorWidgets (widget extension)                             │
│  ├── NoorLiveActivity (live activity extension)                 │
│  ├── NoorIntents (Siri shortcuts)                               │
│  └── NoorWatch (watchOS companion)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Notification Architecture

### Notification Categories

```swift
// Notification Strategy
┌─────────────────────────────────────────────────────────────────┐
│                  NOTIFICATION SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CATEGORY: PRAYER_TIME                                           │
│  ├── Trigger: Prayer time approaches                            │
│  ├── Content: "{Prayer} in {minutes} minutes"                   │
│  ├── Actions: [Mark Complete] [Snooze 5m]                       │
│  ├── Sound: Selected adhan or silent                            │
│  ├── Interruption: Time Sensitive                               │
│  └── Relevance: High                                            │
│                                                                  │
│  CATEGORY: ADHAN                                                 │
│  ├── Trigger: Exact prayer time                                 │
│  ├── Content: "It's time for {Prayer}"                          │
│  ├── Actions: [Open App] [Mark Complete]                        │
│  ├── Sound: Full adhan audio                                    │
│  ├── Interruption: Time Sensitive                               │
│  └── Relevance: Critical                                        │
│                                                                  │
│  CATEGORY: QURAN_REMINDER                                        │
│  ├── Trigger: Custom time or evening                            │
│  ├── Content: "Continue your Quran journey"                     │
│  ├── Actions: [Open Quran] [Not Now]                            │
│  ├── Sound: Gentle chime                                        │
│  ├── Interruption: Passive                                      │
│  └── Relevance: Medium                                          │
│                                                                  │
│  CATEGORY: STREAK_RISK                                           │
│  ├── Trigger: 2 hours before streak loss                        │
│  ├── Content: "Don't lose your {X} day streak!"                 │
│  ├── Actions: [Complete Now]                                    │
│  ├── Sound: Gentle alert                                        │
│  ├── Interruption: Active                                       │
│  └── Relevance: High                                            │
│                                                                  │
│  CATEGORY: RAMADAN_IFTAR                                         │
│  ├── Trigger: Maghrib time                                      │
│  ├── Content: "Iftar time! Break your fast."                    │
│  ├── Actions: [Log Iftar]                                       │
│  ├── Sound: Celebration tone                                    │
│  ├── Interruption: Time Sensitive                               │
│  └── Relevance: Critical                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Encryption Strategy

```swift
// Data Protection
┌─────────────────────────────────────────────────────────────────┐
│                   SECURITY ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  JOURNAL ENCRYPTION                                              │
│  ├── Algorithm: AES-256-GCM                                     │
│  ├── Key Storage: Secure Enclave                                │
│  ├── Key Derivation: PBKDF2 from device secret                  │
│  ├── Access: Face ID / Touch ID required                        │
│  └── Backup: NOT included in iCloud backup                      │
│                                                                  │
│  API COMMUNICATION                                               │
│  ├── Protocol: TLS 1.3                                          │
│  ├── Certificate: Pinned (SHA-256)                              │
│  ├── Authentication: JWT with refresh                           │
│  └── Query Privacy: No PII in AI requests                       │
│                                                                  │
│  LOCAL DATA                                                      │
│  ├── SwiftData: File protection (complete)                      │
│  ├── UserDefaults: App Group protected                          │
│  ├── Cache: Complete until first auth                           │
│  └── Keychain: When unlocked (kSecAttrAccessible)               │
│                                                                  │
│  PRIVACY FEATURES                                                │
│  ├── On-device AI: No query logging                             │
│  ├── Cloud AI: Anonymized requests                              │
│  ├── Analytics: Privacy-preserving aggregates                   │
│  └── Location: Requested only when needed                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Performance Targets

### Benchmark Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cold Launch | < 1.5s | Time to interactive |
| Warm Launch | < 0.5s | Time to interactive |
| Widget Refresh | < 100ms | Timeline update |
| AI Response (local) | < 500ms | First token |
| AI Response (cloud) | < 2s | First token |
| Audio Start | < 200ms | Playback begins |
| Location Fix | < 3s | GPS acquisition |
| Prayer Calculation | < 100ms | Full day times |
| Memory (idle) | < 50MB | Baseline footprint |
| Memory (peak) | < 300MB | Maximum usage |
| Battery (bg) | < 1%/hr | Background drain |
| Battery (active) | < 5%/hr | Active usage |

---

## Testing Strategy

### Test Coverage Requirements

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTING REQUIREMENTS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  UNIT TESTS (>90% coverage)                                      │
│  ├── Prayer time calculations (all methods)                     │
│  ├── Qibla calculations (worldwide locations)                   │
│  ├── Date/time conversions (Islamic calendar)                   │
│  ├── AI response parsing                                        │
│  └── Data model serialization                                   │
│                                                                  │
│  INTEGRATION TESTS                                               │
│  ├── Widget ↔ Main app data sync                                │
│  ├── Live Activity lifecycle                                    │
│  ├── AI pipeline (mock backend)                                 │
│  ├── Audio engine + spatial audio                               │
│  └── Notification scheduling                                    │
│                                                                  │
│  UI TESTS                                                        │
│  ├── Critical user flows                                        │
│  ├── Accessibility compliance                                   │
│  ├── Dark mode rendering                                        │
│  ├── Dynamic Type scaling                                       │
│  └── RTL layout (Arabic)                                        │
│                                                                  │
│  PERFORMANCE TESTS                                               │
│  ├── Launch time benchmarks                                     │
│  ├── Memory leak detection                                      │
│  ├── Battery profiling                                          │
│  └── AI inference speed                                         │
│                                                                  │
│  SPECIAL TESTS                                                   │
│  ├── Ramadan date transitions                                   │
│  ├── High latitude prayer times                                 │
│  ├── Offline mode completeness                                  │
│  └── Edge case locations (poles, date line)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Build Targets

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUILD CONFIGURATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TARGETS                                                         │
│  ├── NoorApp                    iOS 18.0+                       │
│  ├── NoorWidgets                WidgetKit Extension             │
│  ├── NoorLiveActivity           ActivityKit Extension           │
│  ├── NoorIntents                App Intents Extension           │
│  ├── NoorWatch                  watchOS 11.0+                   │
│  └── NoorVision                 visionOS 2.0+                   │
│                                                                  │
│  CONFIGURATIONS                                                  │
│  ├── Debug                      Development builds              │
│  ├── Staging                    TestFlight builds               │
│  └── Release                    App Store builds                │
│                                                                  │
│  FEATURE FLAGS                                                   │
│  ├── AI_CLOUD_ENABLED           Cloud AI access                 │
│  ├── AI_ONDEVICE_ENABLED        Neural Engine AI                │
│  ├── PREMIUM_FEATURES           Subscription features           │
│  ├── RAMADAN_MODE               Ramadan-specific UI             │
│  └── ANALYTICS_ENABLED          Usage analytics                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0.0*
*Last Updated: January 2026*
