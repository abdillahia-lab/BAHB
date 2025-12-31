# CEO Personal OS - iOS App

A beautiful, intuitive iOS companion app for your personal productivity system with AI coaching and iOS 17+ features.

## Overview

This SwiftUI-based iOS app provides a calm, focused interface for:

- **Daily Check-ins** - 5-minute guided reflection with energy tracking
- **Weekly Reviews** - 30-minute structured review of what moved the needle
- **Quarterly Reviews** - Deep-dive goal progress and life map assessment
- **Annual Reviews** - Comprehensive year-in-review with vivid vision updates
- **Goal Tracking** - 1, 3, and 10-year goals with milestone tracking
- **AI Coaching** - On-demand coaching with pattern detection and insights
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
│   ├── CEOProductivityOSApp.swift         # Basic app entry point
│   └── CEOProductivityOSApp_Enhanced.swift # Enhanced iOS 17+ entry point
│
├── Models/
│   └── Models.swift                       # Legacy data models
│
├── SwiftData/
│   └── SwiftDataModels.swift              # SwiftData @Model classes
│
├── Views/
│   ├── Home/                              # Dashboard and overview
│   ├── DailyCheckIn/                      # 5-minute check-in flow
│   ├── WeeklyReview/                      # Weekly review interface
│   ├── QuarterlyReview/                   # Quarterly deep-dive
│   ├── Goals/                             # Goal management
│   ├── Frameworks/                        # Life Map, Vivid Vision
│   ├── Insights/                          # Memory bank
│   ├── AICoach/                           # AI coaching interface
│   │   └── AICoachView.swift              # Chat-based AI coach
│   └── Settings/                          # App configuration
│
├── AIServices/
│   └── AICoachingService.swift            # AI integration & local fallback
│
├── Widgets/
│   └── CEOWidgets.swift                   # Interactive widgets
│
├── LiveActivities/
│   └── EnergyLiveActivity.swift           # Dynamic Island & Lock Screen
│
├── AppIntents/
│   └── CEOAppIntents.swift                # Siri Shortcuts & Focus Filters
│
├── TipKit/
│   └── CEOTips.swift                      # Contextual onboarding tips
│
├── Services/
│   └── DataManager.swift                  # Legacy data persistence
│
├── Extensions/
│   └── Extensions.swift                   # Swift extensions
│
└── Resources/
    └── Assets.xcassets/                   # Colors, icons
```

## iOS 17+ Features

### SwiftData Persistence

All data is now persisted using SwiftData with `@Model` classes:

```swift
@Model
final class CheckInData {
    @Attribute(.unique) var id: UUID
    var date: Date
    var energyLevel: Int
    var meaningfulWin: String
    var frictionPoint: String
    var thingToLetGo: String
    var tomorrowPriority: String
    var aiCoachingFeedback: String?
}
```

**Models include:**
- `CheckInData` - Daily check-in records
- `GoalData` - Goals with relationships to milestones
- `MilestoneData` - Goal milestones with completion tracking
- `WeeklyReviewData` - Weekly review entries
- `InsightData` - Patterns, lessons, and wisdom
- `NorthStarData` - Core identity questions
- `LifeMapData` - Domain score snapshots
- `StreakData` - Check-in streak tracking
- `AIConversationData` - AI coach conversation history

### Interactive Widgets

Three widget families with interactive elements:

**Daily Check-In Widget**
- Quick energy logging (1-10 slider)
- Shows current streak and today's priority
- Available in: Small, Medium, Circular, Rectangular, Lock Screen

**Goals Widget**
- Progress bars for active goals
- Category color coding
- Available in: Small, Medium

**Life Map Widget**
- Radar chart visualization of 6 domains
- Historical comparison
- Available in: Medium, Large

**Configuration:**
```swift
struct CheckInWidgetIntent: WidgetConfigurationIntent {
    @Parameter(title: "Show Streak") var showStreak: Bool
    @Parameter(title: "Show Quote") var showQuote: Bool
}
```

### Live Activities & Dynamic Island

Track energy and focus sessions in real-time:

**Energy Tracking Activity**
- Shows current energy level, priority, and streak
- Dynamic Island support (expanded, compact, minimal)
- Lock Screen presence
- StandBy mode compatible

**Usage:**
```swift
LiveActivityManager.shared.startTracking(
    userName: "Alex",
    energy: 7,
    priority: "Complete quarterly review",
    streak: 14
)
```

### Siri Shortcuts (App Intents)

Voice-activated productivity:

| Phrase | Action |
|--------|--------|
| "Check in with CEO OS" | Start quick check-in |
| "Log my energy" | Record energy level |
| "Get coaching from CEO OS" | Ask AI coach |
| "Start focus session" | Begin timed deep work |
| "Show my goals" | View goal progress |

**Focus Filters:**
```swift
struct CEOFocusFilter: SetFocusFilterIntent {
    @Parameter(title: "Enable Minimal Mode") var minimalMode: Bool?
    @Parameter(title: "Pause Notifications") var pauseNotifications: Bool?
}
```

### TipKit Onboarding

Contextual tips that appear at the right moment:

- `DailyCheckInTip` - First-time users
- `EnergyTrackingTip` - Energy feature discovery
- `WeeklyReviewTip` - Weekend reminder (rule-based)
- `PatternsTip` - After 7+ check-ins
- `StreakTip` - At streak milestones (7, 30, 100 days)
- `AskCoachTip` - AI coaching introduction
- `WidgetTip` - Widget setup guidance
- `SiriTip` - Voice shortcut discovery

### AI Coaching

On-demand coaching with pattern detection:

**Features:**
- Chat interface with AI coach
- Daily check-in analysis
- Weekly review insights
- Pattern detection (energy trends, friction themes)
- Goal alignment evaluation
- Decision frameworks (10/10/10, regret minimization)

**Modes:**
1. **Ask** - Free-form coaching questions
2. **Patterns** - Energy and theme analysis
3. **Goals** - Alignment and progress check
4. **Energy** - Energy management advice

**MCP Integration:**
The AI service connects to the MCP server for enhanced coaching:
```swift
let response = await AICoachingService.shared.askCoach(
    question: "How should I prioritize my goals?",
    context: "Feeling low energy lately"
)
```

## Features

### Daily Check-In (5 minutes)
- Energy level slider (1-10)
- One meaningful win
- One friction point
- One thing to let go of
- One priority for tomorrow
- AI coaching feedback (optional)

### Weekly Review (30 minutes)
- What moved the needle
- What was noise
- Where time leaked
- Strategic insight
- Next week adjustment
- Pattern analysis

### Life Map
- Visual radar chart of 6 domains
- Career, Relationships, Health
- Meaning, Finances, Fun
- Historical tracking
- Trend visualization

### Goals
- 1-year, 3-year, 10-year timeframes
- Category tagging (Career, Health, etc.)
- Milestone tracking
- Progress visualization
- AI alignment checking

### Memory Bank
- Pattern recognition
- Lesson capture
- Strength identification
- Blind spot awareness

## Deep Linking

The app supports deep links for quick navigation:

```
ceoos://checkin    → Open daily check-in
ceoos://goals      → Open goals view
ceoos://coach      → Open AI coach
```

## Data Privacy

- **All data stays on device** - No cloud sync by design
- **SwiftData local storage** - Encrypted SQLite database
- **No analytics** - Zero tracking or telemetry
- **App Group sharing** - Widgets access data via app group

## Design Philosophy

- **Calm over busy** - Muted colors, ample whitespace
- **Clarity over complexity** - Simple flows, obvious actions
- **Progress over perfection** - Easy to start, easy to continue
- **Privacy first** - All data stays on device
- **AI as coach, not manager** - Prompts are mirrors, not mandates

## Customization

Colors can be customized in `Assets.xcassets`:
- `AccentColor` - Primary brand color
- `BackgroundTop/Bottom` - Gradient backgrounds

## MCP Server Connection

The app connects to the MCP server for enhanced AI capabilities:

1. Set environment variable: `MCP_ENDPOINT=http://localhost:3000`
2. Optionally set: `HF_TOKEN=your_huggingface_token`

If the MCP server is unavailable, the app falls back to local coaching responses.

## License

Private use only. Not for distribution.
