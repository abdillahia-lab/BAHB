import TipKit
import SwiftUI

// MARK: - Onboarding Tips

struct DailyCheckInTip: Tip {
    var title: Text {
        Text("Start Your Day Right")
    }

    var message: Text? {
        Text("A 5-minute daily check-in helps you track energy, celebrate wins, and set tomorrow's priority.")
    }

    var image: Image? {
        Image(systemName: "sunrise.fill")
    }

    var actions: [Action] {
        Action(id: "start-checkin", title: "Start Check-In")
    }
}

struct EnergyTrackingTip: Tip {
    var title: Text {
        Text("Track Your Energy")
    }

    var message: Text? {
        Text("Rate your energy 1-10 each day. Over time, you'll see patterns that help optimize your schedule.")
    }

    var image: Image? {
        Image(systemName: "bolt.fill")
    }
}

struct WeeklyReviewTip: Tip {
    static let weeklyReviewCount = Event(id: "weekly-review-shown")

    var title: Text {
        Text("Time for Weekly Review")
    }

    var message: Text? {
        Text("30 minutes to reflect on what moved the needle, what was noise, and set next week's focus.")
    }

    var image: Image? {
        Image(systemName: "calendar.badge.clock")
    }

    var rules: [Rule] {
        #Rule(Self.weeklyReviewCount) { $0.donations.count == 0 }
    }
}

struct LifeMapTip: Tip {
    var title: Text {
        Text("Life Map Check")
    }

    var message: Text? {
        Text("Rate six life domains: Career, Relationships, Health, Meaning, Finances, Fun. Balance matters.")
    }

    var image: Image? {
        Image(systemName: "map.fill")
    }
}

struct NorthStarTip: Tip {
    var title: Text {
        Text("Define Your North Star")
    }

    var message: Text? {
        Text("Five questions that anchor everything. What does a great life look like for you?")
    }

    var image: Image? {
        Image(systemName: "star.fill")
    }

    var actions: [Action] {
        Action(id: "open-northstar", title: "Set North Star")
    }
}

struct GoalAlignmentTip: Tip {
    var title: Text {
        Text("Align Goals to North Star")
    }

    var message: Text? {
        Text("AI coaching can help you check if your goals align with what actually matters to you.")
    }

    var image: Image? {
        Image(systemName: "arrow.triangle.branch")
    }
}

struct PatternsTip: Tip {
    static let checkInCount = Event(id: "checkin-count")

    var title: Text {
        Text("Patterns Emerging")
    }

    var message: Text? {
        Text("With 7+ check-ins, the AI can start detecting patterns in your energy, wins, and frictions.")
    }

    var image: Image? {
        Image(systemName: "waveform.path.ecg")
    }

    var rules: [Rule] {
        #Rule(Self.checkInCount) { $0.donations.count >= 7 }
    }
}

struct StreakTip: Tip {
    static let streakMilestone = Event(id: "streak-milestone")

    var title: Text {
        Text("Streak Milestone!")
    }

    var message: Text? {
        Text("Consistency beats intensity. Keep building your reflection habit.")
    }

    var image: Image? {
        Image(systemName: "flame.fill")
    }

    var rules: [Rule] {
        #Rule(Self.streakMilestone) { $0.donations.count > 0 }
    }
}

struct AskCoachTip: Tip {
    var title: Text {
        Text("Ask Your Coach")
    }

    var message: Text? {
        Text("Stuck on a decision? The AI coach can help you think through it using proven frameworks.")
    }

    var image: Image? {
        Image(systemName: "bubble.left.and.bubble.right.fill")
    }

    var actions: [Action] {
        Action(id: "open-coach", title: "Ask a Question")
    }
}

struct WidgetTip: Tip {
    var title: Text {
        Text("Add Home Screen Widget")
    }

    var message: Text? {
        Text("Quick check-in access and streak tracking right from your home screen.")
    }

    var image: Image? {
        Image(systemName: "square.grid.2x2")
    }
}

struct SiriTip: Tip {
    var title: Text {
        Text("Use Siri Shortcuts")
    }

    var message: Text? {
        Text("Say 'Check in with CEO OS' or 'Log my energy' for hands-free tracking.")
    }

    var image: Image? {
        Image(systemName: "waveform")
    }
}

// MARK: - Tip Store Configuration

struct TipConfiguration {
    static func configure() {
        #if DEBUG
        try? Tips.resetDatastore()
        #endif

        try? Tips.configure([
            .displayFrequency(.immediate),
            .datastoreLocation(.applicationDefault)
        ])
    }
}

// MARK: - Tip Views

struct TipCardView: View {
    let tip: any Tip
    let action: () -> Void

    var body: some View {
        TipView(tip, action: { _ in action() })
            .tipBackground(Color(.secondarySystemGroupedBackground))
            .tipCornerRadius(16)
    }
}

// MARK: - Contextual Tips Container

struct ContextualTipsView: View {
    let checkInCount: Int
    let hasNorthStar: Bool
    let streakDays: Int

    var body: some View {
        VStack(spacing: 12) {
            if !hasNorthStar {
                TipView(NorthStarTip())
            }

            if checkInCount == 0 {
                TipView(DailyCheckInTip())
            }

            if checkInCount >= 7 && checkInCount < 14 {
                TipView(PatternsTip())
            }

            if streakDays == 7 || streakDays == 30 || streakDays == 100 {
                TipView(StreakTip())
            }
        }
        .padding()
    }
}

// MARK: - Discovery Tips

struct FeatureDiscoveryView: View {
    @State private var currentTipIndex = 0

    private let tips: [(title: String, description: String, icon: String)] = [
        ("Daily Check-Ins", "5 minutes for energy, wins, and tomorrow's priority", "checkmark.circle"),
        ("AI Coaching", "Ask questions, get insight, detect patterns", "brain.head.profile"),
        ("Life Map", "Balance across six domains that matter", "map.fill"),
        ("Goal Tracking", "1-year, 3-year, 10-year with milestones", "target"),
        ("Weekly Reviews", "What moved the needle? What was noise?", "calendar"),
        ("Insights", "Patterns, lessons, and wisdom accumulate", "lightbulb.fill"),
    ]

    var body: some View {
        VStack(spacing: 24) {
            TabView(selection: $currentTipIndex) {
                ForEach(0..<tips.count, id: \.self) { index in
                    VStack(spacing: 16) {
                        Image(systemName: tips[index].icon)
                            .font(.system(size: 48))
                            .foregroundStyle(.blue)

                        Text(tips[index].title)
                            .font(.title2)
                            .fontWeight(.semibold)

                        Text(tips[index].description)
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .always))
            .frame(height: 200)

            HStack {
                if currentTipIndex > 0 {
                    Button("Previous") {
                        withAnimation { currentTipIndex -= 1 }
                    }
                }

                Spacer()

                if currentTipIndex < tips.count - 1 {
                    Button("Next") {
                        withAnimation { currentTipIndex += 1 }
                    }
                } else {
                    Button("Get Started") {
                        // Dismiss and mark as seen
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
            .padding(.horizontal)
        }
    }
}
