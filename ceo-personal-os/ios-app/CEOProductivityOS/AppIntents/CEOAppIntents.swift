import AppIntents
import SwiftUI
import SwiftData

// MARK: - Quick Check-In Intent

struct QuickCheckInIntent: AppIntent {
    static var title: LocalizedStringResource = "Quick Check-In"
    static var description = IntentDescription("Record a quick daily check-in")

    static var openAppWhenRun: Bool = false

    @Parameter(title: "Energy Level", description: "Your energy level from 1 to 10")
    var energyLevel: Int

    @Parameter(title: "Today's Win", description: "One meaningful win from today")
    var win: String

    @Parameter(title: "Tomorrow's Priority", description: "Your top priority for tomorrow")
    var priority: String

    static var parameterSummary: some ParameterSummary {
        Summary("Check in with energy \(\.$energyLevel), win: \(\.$win), priority: \(\.$priority)")
    }

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Save check-in
        let defaults = UserDefaults(suiteName: "group.com.ceo.productivity")
        defaults?.set(true, forKey: "todayCheckedIn")
        defaults?.set(energyLevel, forKey: "lastEnergy")
        defaults?.set(priority, forKey: "tomorrowPriority")

        // Update streak
        let currentStreak = (defaults?.integer(forKey: "currentStreak") ?? 0) + 1
        defaults?.set(currentStreak, forKey: "currentStreak")

        // Update Live Activity if active
        await MainActor.run {
            LiveActivityManager.shared.recordCheckIn(energy: energyLevel, priority: priority)
        }

        return .result(dialog: "Check-in recorded! Energy: \(energyLevel)/10. \(currentStreak) day streak.")
    }
}

// MARK: - Log Energy Intent

struct LogEnergyIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Energy"
    static var description = IntentDescription("Quickly log your current energy level")

    @Parameter(title: "Energy Level", description: "1-10 scale")
    var level: Int

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let defaults = UserDefaults(suiteName: "group.com.ceo.productivity")
        defaults?.set(level, forKey: "lastEnergy")

        await MainActor.run {
            LiveActivityManager.shared.updateEnergy(level)
        }

        let feedback: String
        switch level {
        case 1...3: feedback = "Low energy noted. Consider recovery."
        case 4...6: feedback = "Moderate energy. Match tasks accordingly."
        case 7...8: feedback = "Good energy! Use it wisely."
        default: feedback = "Peak energy! Do your hardest work now."
        }

        return .result(dialog: "Energy logged: \(level)/10. \(feedback)")
    }
}

// MARK: - Get Coaching Intent

struct GetCoachingIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Coaching"
    static var description = IntentDescription("Ask your AI coach a question")

    @Parameter(title: "Question")
    var question: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // In production, this would call the MCP server
        let response = generateLocalCoachingResponse(for: question)
        return .result(dialog: "\(response)")
    }

    private func generateLocalCoachingResponse(for question: String) -> String {
        let lowercased = question.lowercased()

        if lowercased.contains("energy") || lowercased.contains("tired") {
            return "Your energy is a signal, not a problem to fix. What drained you most recently? That's usually where to look."
        } else if lowercased.contains("priority") || lowercased.contains("focus") {
            return "What's the one thing that, if accomplished, would make everything else easier or unnecessary?"
        } else if lowercased.contains("decision") {
            return "Picture yourself 10 years from now. Which choice would you regret NOT making?"
        } else {
            return "That's worth exploring. What does your gut already tell you about this? Often the answer is there—you just haven't given yourself permission to act on it."
        }
    }
}

// MARK: - Start Focus Session Intent

struct StartFocusSessionIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Focus Session"
    static var description = IntentDescription("Start a focused work session")

    @Parameter(title: "Duration (minutes)", default: 90)
    var duration: Int

    @Parameter(title: "Task")
    var task: String

    @Parameter(title: "Session Type", default: .deepWork)
    var sessionType: SessionType

    enum SessionType: String, AppEnum {
        case deepWork = "Deep Work"
        case recovery = "Recovery"
        case admin = "Admin"

        static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Session Type")
        static var caseDisplayRepresentations: [SessionType: DisplayRepresentation] = [
            .deepWork: "Deep Work",
            .recovery: "Recovery",
            .admin: "Admin"
        ]
    }

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Would start a Live Activity for focus session tracking
        return .result(dialog: "Starting \(duration) minute \(sessionType.rawValue.lowercased()) session: \(task)")
    }
}

// MARK: - View Goals Intent

struct ViewGoalsIntent: AppIntent {
    static var title: LocalizedStringResource = "View Goals"
    static var description = IntentDescription("See your current goals summary")

    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        // Opens app to goals view
        return .result()
    }
}

// MARK: - Weekly Review Reminder Intent

struct WeeklyReviewReminderIntent: AppIntent {
    static var title: LocalizedStringResource = "Weekly Review Reminder"
    static var description = IntentDescription("Remind yourself to do weekly review")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let calendar = Calendar.current
        let weekday = calendar.component(.weekday, from: Date())

        if weekday == 1 || weekday == 7 { // Weekend
            return .result(dialog: "Good time for your weekly review! What moved the needle this week? What was noise?")
        } else {
            return .result(dialog: "Weekly review is best on weekends. Want me to remind you then?")
        }
    }
}

// MARK: - Shortcuts Provider

struct CEOShortcutsProvider: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: QuickCheckInIntent(),
            phrases: [
                "Check in with \(.applicationName)",
                "Daily check in",
                "Log my day in \(.applicationName)",
                "Record check-in"
            ],
            shortTitle: "Check In",
            systemImageName: "checkmark.circle"
        )

        AppShortcut(
            intent: LogEnergyIntent(),
            phrases: [
                "Log my energy in \(.applicationName)",
                "Record energy level",
                "How's my energy"
            ],
            shortTitle: "Log Energy",
            systemImageName: "bolt.fill"
        )

        AppShortcut(
            intent: GetCoachingIntent(),
            phrases: [
                "Get coaching from \(.applicationName)",
                "Ask my coach",
                "I need advice"
            ],
            shortTitle: "Get Coaching",
            systemImageName: "person.wave.2"
        )

        AppShortcut(
            intent: StartFocusSessionIntent(),
            phrases: [
                "Start focus session in \(.applicationName)",
                "Begin deep work",
                "Start working"
            ],
            shortTitle: "Focus Session",
            systemImageName: "brain.head.profile"
        )

        AppShortcut(
            intent: ViewGoalsIntent(),
            phrases: [
                "Show my goals in \(.applicationName)",
                "View goals",
                "Check goal progress"
            ],
            shortTitle: "View Goals",
            systemImageName: "target"
        )
    }
}

// MARK: - Entity for Goals

struct GoalEntity: AppEntity {
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Goal")

    var id: UUID
    var title: String
    var progress: Int
    var category: String

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(title)", subtitle: "\(progress)% complete")
    }

    static var defaultQuery = GoalQuery()
}

struct GoalQuery: EntityQuery {
    func entities(for identifiers: [UUID]) async throws -> [GoalEntity] {
        // Would fetch from SwiftData
        return []
    }

    func suggestedEntities() async throws -> [GoalEntity] {
        // Return top goals
        return [
            GoalEntity(id: UUID(), title: "Sample Goal", progress: 50, category: "Career")
        ]
    }
}

// MARK: - Focus Filter

struct CEOFocusFilter: SetFocusFilterIntent {
    static var title: LocalizedStringResource = "CEO OS Focus"
    static var description: IntentDescription? = IntentDescription("Customize CEO OS during Focus modes")

    @Parameter(title: "Enable Minimal Mode")
    var minimalMode: Bool?

    @Parameter(title: "Pause Notifications")
    var pauseNotifications: Bool?

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "CEO OS Focus Settings")
    }

    func perform() async throws -> some IntentResult {
        // Apply focus filter settings
        let defaults = UserDefaults.standard
        defaults.set(minimalMode ?? false, forKey: "focusMinimalMode")
        defaults.set(pauseNotifications ?? true, forKey: "focusPauseNotifications")
        return .result()
    }
}
