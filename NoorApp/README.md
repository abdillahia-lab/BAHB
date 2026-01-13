# Noor - Premium Islamic Companion App

<div align="center">

**نور**

*Your Daily Spiritual Companion*

[![iOS](https://img.shields.io/badge/iOS-18.0+-blue.svg)](https://developer.apple.com/ios/)
[![Swift](https://img.shields.io/badge/Swift-5.9+-orange.svg)](https://swift.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

</div>

---

## Overview

**Noor** is a premium Islamic mobile application designed to become the indispensable daily spiritual companion for Muslims worldwide. Built specifically for iOS 18 and iPhone 17, Noor leverages cutting-edge hardware capabilities including the Neural Engine for on-device AI, U2 chip for precision location services, and advanced spatial audio for immersive Quran recitation.

### Mission

*"To illuminate the path of faith through technology that enhances worship, not distracts from it."*

---

## Key Features

### Daily Quran Module
- Crystal-clear spatial audio recitations with 30+ world-renowned reciters
- Heart-touching AI-generated explanations based on classical tafsir
- Interactive streak tracking with iOS 18 widgets
- Offline mode with on-device AI processing
- Beautiful dark mode optimized for ProMotion display

### Prayer Tracker System
- Precision salah times using iPhone 17's U2 chip (±3m accuracy)
- AR qibla compass with Ka'bah visualization
- Spatial audio adhan from the direction of qibla
- Individual prayer streak counters in StandBy mode
- Interactive widgets for quick prayer logging

### Ramadan Features
- Live Activity fasting countdown with Dynamic Island integration
- Suhoor and iftar timers with celebration haptics
- Daily goal tracking (Quran, charity, tarawih)
- Laylatul Qadr night special themes
- Adaptive widget designs for each day

### AI Chat Assistant
- GPT-4 tier model fine-tuned on authenticated Islamic corpus
- On-device processing via Neural Engine for privacy
- Strict guardrails preventing unverified opinions
- Always cites sources (Quran, Hadith, classical scholars)
- Context-aware multi-turn conversations

### Muslim Women's Section
- Curated content on motherhood, marriage, patience, self-worth
- Private encrypted journaling with reflection prompts
- Stories of inspiring Muslim women throughout history
- Beautiful shareable quote cards
- Soft, feminine design aesthetic

---

## iOS 18 & iPhone 17 Integration

| Feature | Technology | Description |
|---------|------------|-------------|
| **Interactive Widgets** | WidgetKit + App Intents | Mark prayers complete, increment dhikr, ask AI questions directly from widgets |
| **Live Activities** | ActivityKit | Persistent fasting timers, prayer countdowns with real-time updates |
| **Dynamic Island** | ActivityKit | Compact prayer info, expanded qibla direction, dhikr counting |
| **StandBy Mode** | WidgetKit | Bedside Quran display, prayer dashboard, Ramadan progress |
| **Spatial Audio** | AVAudioEngine + PHASE | Immersive Quran recitation, adhan from qibla direction |
| **Neural Engine** | Core ML | On-device AI for private, offline question answering |
| **U2 Chip** | CoreLocation | Building-level precision for accurate prayer times |
| **Action Button** | App Intents | Instant qibla compass, prayer logging, dhikr counter |
| **Vision Pro** | RealityKit | Immersive Quran study, virtual Ka'bah direction |

---

## Project Structure

```
NoorApp/
├── Documentation/
│   ├── PRODUCT_SPECIFICATION.md
│   └── TECHNICAL_ARCHITECTURE.md
│
├── Sources/NoorApp/
│   ├── Core/
│   │   ├── Models/           # Domain models
│   │   ├── Services/         # Business logic
│   │   ├── Utilities/        # Helpers
│   │   ├── Extensions/       # Swift extensions
│   │   └── Configuration/    # App config
│   │
│   ├── Features/
│   │   ├── Prayer/           # Salah tracking
│   │   ├── Quran/            # Quran reading
│   │   ├── AIChat/           # AI assistant
│   │   ├── Ramadan/          # Ramadan features
│   │   └── WomensSection/    # Women's content
│   │
│   ├── iOS18Integration/
│   │   ├── Widgets/          # Home & Lock screen widgets
│   │   ├── LiveActivities/   # Live Activity controllers
│   │   ├── DynamicIsland/    # Dynamic Island UI
│   │   ├── StandBy/          # StandBy mode displays
│   │   ├── ActionButton/     # Action button handlers
│   │   ├── Shortcuts/        # Siri Shortcuts
│   │   └── VisionPro/        # visionOS compatibility
│   │
│   ├── UI/
│   │   ├── Theme/            # Design system
│   │   ├── Components/       # Reusable UI
│   │   ├── Animations/       # Custom animations
│   │   └── Haptics/          # Haptic patterns
│   │
│   ├── AI/
│   │   ├── OnDevice/         # Core ML models
│   │   ├── CloudModels/      # API integrations
│   │   └── ContentGuard/     # Response validation
│   │
│   └── Data/
│       ├── Local/            # SwiftData models
│       ├── Sync/             # CloudKit sync
│       └── Cache/            # Caching layer
│
├── NoorWidgets/              # Widget extension target
├── NoorLiveActivity/         # Live Activity extension
├── Tests/                    # Test suite
└── Design/                   # Design assets
```

---

## Technology Stack

### Frameworks
- **SwiftUI** - Declarative UI
- **SwiftData** - Persistence
- **WidgetKit** - Widgets & StandBy
- **ActivityKit** - Live Activities & Dynamic Island
- **Core ML** - On-device AI
- **AVFoundation** - Audio playback
- **CoreLocation** - Location services
- **StoreKit 2** - Subscriptions

### AI Models
- **NoorGPT-4** - Cloud model for complex queries
- **NoorLocal-3B** - On-device model (Neural Engine)
- **Content Guard** - Response validation

### APIs
- Quran.com API - Quran text and translations
- Sunnah.com API - Hadith collections
- IslamicFinder API - Prayer times verification

---

## Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Emerald | `#0D7377` | Primary, trust, growth |
| Gold | `#D4AF37` | Accent, illumination |
| Ivory | `#F5F5DC` | Background, parchment |
| Charcoal | `#2D2D2D` | Text, depth |
| Rose | `#B76E79` | Women's section |

### Typography
- **Quran**: Scheherazade New
- **Arabic Headers**: Amiri
- **English Body**: SF Pro
- **Reading**: Source Serif Pro

### Principles
- Spiritual calm over engagement hacks
- Authentic Islamic aesthetics
- Generous whitespace
- Gentle animations
- Accessible by default

---

## Content Verification

All Islamic content undergoes rigorous verification:

1. **Quran** - Verified against Medina Mushaf digital certification
2. **Hadith** - Authenticated collections with grading (Sahih, Hasan, etc.)
3. **Tafsir** - Classical published editions only
4. **AI Responses** - Scholar-reviewed guardrails, mandatory citations
5. **Advisory Board** - Experts in tafsir, hadith sciences, and fiqh

---

## Monetization

### Free Tier
- Accurate prayer times worldwide
- Basic qibla compass
- Quran reading (1 translation)
- 5 AI questions per day
- Basic widgets

### Premium ($4.99/mo or $39.99/yr)
- Unlimited AI questions
- Offline AI (on-device model)
- 30+ reciters, 50+ translations
- Interactive widgets
- Women's section full access
- Advanced streak features

### Family ($9.99/mo)
- Premium for up to 6 members
- Family prayer tracking
- Shared Ramadan goals

### Lifetime ($149.99)
- All premium features forever
- Founding supporter recognition

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Cold Launch | < 1.5s |
| Warm Launch | < 0.5s |
| Widget Refresh | < 100ms |
| AI Response (local) | < 500ms |
| AI Response (cloud) | < 2s |
| Battery (background) | < 1%/hr |
| Prayer Calculation | < 100ms |

---

## Privacy & Security

- **On-device first**: 80% of AI queries processed locally
- **No query logging**: Cloud queries not stored
- **End-to-end encryption**: Journal entries encrypted with Secure Enclave
- **Anonymized requests**: User IDs stripped from cloud requests
- **Local data only**: Prayer logs never leave device

---

## Building

### Requirements
- Xcode 16.0+
- iOS 18.0 SDK
- Swift 5.9+
- macOS Sonoma 14.0+

### Setup

```bash
# Clone repository
git clone https://github.com/your-org/NoorApp.git
cd NoorApp

# Install dependencies
swift package resolve

# Open in Xcode
open NoorApp.xcodeproj

# Build and run
# Select target device and press Cmd+R
```

### Configuration

1. Copy `Config.example.plist` to `Config.plist`
2. Add API keys for third-party services
3. Configure App Group identifier
4. Set up signing certificates

---

## Contributing

This is a proprietary project. For inquiries about partnerships or contributions, please contact the development team.

---

## License

Copyright © 2026 Noor App. All rights reserved.

---

## Acknowledgments

- **Islamic Scholars Advisory Board** - Content verification
- **Quran.com** - Quran data and translations
- **Sunnah.com** - Hadith collections
- **IslamicFinder** - Prayer time algorithms

---

<div align="center">

**بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْم**

*In the name of Allah, the Most Gracious, the Most Merciful*

</div>
