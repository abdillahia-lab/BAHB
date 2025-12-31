# CEO Personal OS - iOS App

A beautiful, intuitive iOS companion app for your personal productivity system.

## Overview

This SwiftUI-based iOS app provides a calm, focused interface for:

- **Daily Check-ins** - 5-minute guided reflection with energy tracking
- **Weekly Reviews** - 30-minute structured review of what moved the needle
- **Quarterly Reviews** - Deep-dive goal progress and life map assessment
- **Annual Reviews** - Comprehensive year-in-review with vivid vision updates
- **Goal Tracking** - 1, 3, and 10-year goals with milestone tracking
- **Memory/Insights** - Capture and categorize patterns, lessons, and wisdom
- **Life Map** - Visual radar chart of six life domains

## Requirements

- iOS 17.0+
- Xcode 15.0+
- Swift 5.9+

## Installation

1. Open `CEOProductivityOS.xcodeproj` in Xcode
2. Select your target device or simulator
3. Build and run (⌘R)

## Architecture

```
CEOProductivityOS/
├── App/
│   ├── CEOProductivityOSApp.swift    # App entry point
│   └── ContentView.swift             # Root view with navigation
│
├── Models/
│   └── Models.swift                  # Data models (CheckIn, Review, Goal, etc.)
│
├── Views/
│   ├── Home/                         # Dashboard and overview
│   ├── DailyCheckIn/                 # 5-minute check-in flow
│   ├── WeeklyReview/                 # Weekly review interface
│   ├── QuarterlyReview/              # Quarterly deep-dive
│   ├── Goals/                        # Goal management
│   ├── Frameworks/                   # Life Map, Vivid Vision
│   ├── Insights/                     # Memory bank
│   └── Settings/                     # App configuration
│
├── Services/
│   └── DataManager.swift             # Data persistence & business logic
│
├── Extensions/
│   └── Extensions.swift              # Swift extensions
│
└── Resources/
    └── Assets.xcassets/              # Colors, icons
```

## Features

### Daily Check-In (5 minutes)
- Energy level slider (1-10)
- One meaningful win
- One friction point
- One thing to let go of
- One priority for tomorrow

### Weekly Review (30 minutes)
- What moved the needle
- What was noise
- Where time leaked
- Strategic insight
- Next week adjustment

### Life Map
- Visual radar chart of 6 domains
- Career, Relationships, Health
- Meaning, Finances, Fun
- Historical tracking

### Goals
- 1-year, 3-year, 10-year timeframes
- Category tagging (Career, Health, etc.)
- Milestone tracking
- Progress visualization

### Memory Bank
- Pattern recognition
- Lesson capture
- Strength identification
- Blind spot awareness

## Data Persistence

All data is stored locally on device using:
- JSON files in the app's Documents directory
- UserDefaults for preferences
- No cloud sync (by design - this is private data)

## Design Philosophy

- **Calm over busy** - Muted colors, ample whitespace
- **Clarity over complexity** - Simple flows, obvious actions
- **Progress over perfection** - Easy to start, easy to continue
- **Privacy first** - All data stays on device

## Customization

Colors can be customized in `Assets.xcassets`:
- `AccentColor` - Primary brand color
- `BackgroundTop/Bottom` - Gradient backgrounds

## License

Private use only. Not for distribution.
