import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Daily Check-In Widget

struct DailyCheckInWidget: Widget {
    let kind: String = "DailyCheckInWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: CheckInWidgetIntent.self,
            provider: CheckInTimelineProvider()
        ) { entry in
            DailyCheckInWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Daily Check-In")
        .description("Quick access to your daily reflection")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
        .contentMarginsDisabled()
    }
}

struct CheckInEntry: TimelineEntry {
    let date: Date
    let hasCheckedIn: Bool
    let currentStreak: Int
    let lastEnergy: Int?
    let tomorrowPriority: String?
}

struct CheckInTimelineProvider: AppIntentTimelineProvider {
    typealias Entry = CheckInEntry
    typealias Intent = CheckInWidgetIntent

    func placeholder(in context: Context) -> CheckInEntry {
        CheckInEntry(
            date: Date(),
            hasCheckedIn: false,
            currentStreak: 5,
            lastEnergy: 7,
            tomorrowPriority: "Focus on key priorities"
        )
    }

    func snapshot(for configuration: CheckInWidgetIntent, in context: Context) async -> CheckInEntry {
        CheckInEntry(
            date: Date(),
            hasCheckedIn: true,
            currentStreak: 12,
            lastEnergy: 8,
            tomorrowPriority: "Complete quarterly review"
        )
    }

    func timeline(for configuration: CheckInWidgetIntent, in context: Context) async -> Timeline<CheckInEntry> {
        let entry = await fetchCurrentState()
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        return Timeline(entries: [entry], policy: .after(nextUpdate))
    }

    private func fetchCurrentState() async -> CheckInEntry {
        // In production, this would fetch from SwiftData/shared container
        let defaults = UserDefaults(suiteName: "group.com.ceo.productivity")
        let hasCheckedIn = defaults?.bool(forKey: "todayCheckedIn") ?? false
        let streak = defaults?.integer(forKey: "currentStreak") ?? 0
        let energy = defaults?.integer(forKey: "lastEnergy")
        let priority = defaults?.string(forKey: "tomorrowPriority")

        return CheckInEntry(
            date: Date(),
            hasCheckedIn: hasCheckedIn,
            currentStreak: streak,
            lastEnergy: energy == 0 ? nil : energy,
            tomorrowPriority: priority
        )
    }
}

struct DailyCheckInWidgetView: View {
    var entry: CheckInEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallCheckInView(entry: entry)
        case .systemMedium:
            MediumCheckInView(entry: entry)
        case .accessoryCircular:
            CircularCheckInView(entry: entry)
        case .accessoryRectangular:
            RectangularCheckInView(entry: entry)
        default:
            SmallCheckInView(entry: entry)
        }
    }
}

struct SmallCheckInView: View {
    let entry: CheckInEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: entry.hasCheckedIn ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(entry.hasCheckedIn ? .green : .secondary)
                Text("Check-In")
                    .font(.headline)
            }

            Spacer()

            if entry.hasCheckedIn {
                if let energy = entry.lastEnergy {
                    HStack {
                        Text("Energy")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("\(energy)/10")
                            .font(.title3)
                            .fontWeight(.bold)
                    }
                }
            } else {
                Text("Tap to reflect")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack {
                Image(systemName: "flame.fill")
                    .foregroundStyle(.orange)
                Text("\(entry.currentStreak) day streak")
                    .font(.caption)
            }
        }
        .padding()
    }
}

struct MediumCheckInView: View {
    let entry: CheckInEntry

    var body: some View {
        HStack(spacing: 16) {
            // Left side - Status
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: entry.hasCheckedIn ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(entry.hasCheckedIn ? .green : .secondary)
                    Text(entry.hasCheckedIn ? "Complete" : "Check-In")
                        .font(.headline)
                }

                if let energy = entry.lastEnergy {
                    HStack {
                        ForEach(1...10, id: \.self) { i in
                            Circle()
                                .fill(i <= energy ? energyColor(for: energy) : Color.gray.opacity(0.3))
                                .frame(width: 8, height: 8)
                        }
                    }
                }

                HStack {
                    Image(systemName: "flame.fill")
                        .foregroundStyle(.orange)
                    Text("\(entry.currentStreak) days")
                        .font(.caption)
                }
            }

            Divider()

            // Right side - Priority
            VStack(alignment: .leading, spacing: 4) {
                Text("Tomorrow's Focus")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let priority = entry.tomorrowPriority {
                    Text(priority)
                        .font(.subheadline)
                        .lineLimit(2)
                } else {
                    Text("Set your priority")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
    }

    private func energyColor(for level: Int) -> Color {
        switch level {
        case 1...3: return .red
        case 4...6: return .orange
        case 7...8: return .yellow
        default: return .green
        }
    }
}

struct CircularCheckInView: View {
    let entry: CheckInEntry

    var body: some View {
        ZStack {
            if entry.hasCheckedIn {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title)
            } else {
                VStack(spacing: 2) {
                    Image(systemName: "pencil.circle")
                        .font(.title2)
                    Text("Check-In")
                        .font(.system(size: 8))
                }
            }
        }
    }
}

struct RectangularCheckInView: View {
    let entry: CheckInEntry

    var body: some View {
        HStack {
            Image(systemName: entry.hasCheckedIn ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(entry.hasCheckedIn ? .green : .secondary)

            VStack(alignment: .leading) {
                Text(entry.hasCheckedIn ? "Checked In" : "Daily Check-In")
                    .font(.headline)
                Text("\(entry.currentStreak) day streak")
                    .font(.caption)
            }
        }
    }
}

// MARK: - Goals Progress Widget

struct GoalsWidget: Widget {
    let kind: String = "GoalsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GoalsTimelineProvider()) { entry in
            GoalsWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Goal Progress")
        .description("Track your goal progress at a glance")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct GoalEntry: TimelineEntry {
    let date: Date
    let goals: [GoalSnapshot]
    let overallProgress: Int
}

struct GoalSnapshot {
    let title: String
    let progress: Int
    let category: String
}

struct GoalsTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> GoalEntry {
        GoalEntry(
            date: Date(),
            goals: [
                GoalSnapshot(title: "Q4 Revenue Target", progress: 75, category: "Career"),
                GoalSnapshot(title: "Exercise 4x/week", progress: 60, category: "Health"),
            ],
            overallProgress: 68
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (GoalEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GoalEntry>) -> Void) {
        let entry = placeholder(in: context)
        let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(3600)))
        completion(timeline)
    }
}

struct GoalsWidgetView: View {
    var entry: GoalEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Goals")
                    .font(.headline)
                Spacer()
                Text("\(entry.overallProgress)%")
                    .font(.title3)
                    .fontWeight(.bold)
            }

            if family == .systemMedium {
                ForEach(entry.goals.prefix(3), id: \.title) { goal in
                    GoalRowView(goal: goal)
                }
            } else {
                if let topGoal = entry.goals.first {
                    GoalRowView(goal: topGoal)
                }
            }
        }
        .padding()
    }
}

struct GoalRowView: View {
    let goal: GoalSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(goal.title)
                    .font(.caption)
                    .lineLimit(1)
                Spacer()
                Text("\(goal.progress)%")
                    .font(.caption)
                    .fontWeight(.medium)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 4)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(categoryColor(goal.category))
                        .frame(width: geometry.size.width * CGFloat(goal.progress) / 100, height: 4)
                }
            }
            .frame(height: 4)
        }
    }

    private func categoryColor(_ category: String) -> Color {
        switch category {
        case "Career": return .blue
        case "Health": return .green
        case "Relationships": return .pink
        case "Finances": return .yellow
        case "Fun": return .orange
        default: return .purple
        }
    }
}

// MARK: - Life Map Widget

struct LifeMapWidget: Widget {
    let kind: String = "LifeMapWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LifeMapTimelineProvider()) { entry in
            LifeMapWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Life Map")
        .description("Your six life domains at a glance")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct LifeMapEntry: TimelineEntry {
    let date: Date
    let scores: [String: Int]
    let average: Double
    let lowestDomain: String
}

struct LifeMapTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> LifeMapEntry {
        LifeMapEntry(
            date: Date(),
            scores: ["Career": 8, "Relations": 7, "Health": 6, "Meaning": 7, "Finances": 5, "Fun": 6],
            average: 6.5,
            lowestDomain: "Finances"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (LifeMapEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LifeMapEntry>) -> Void) {
        let entry = placeholder(in: context)
        let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(3600)))
        completion(timeline)
    }
}

struct LifeMapWidgetView: View {
    var entry: LifeMapEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Life Map")
                    .font(.headline)
                Spacer()
                Text(String(format: "%.1f", entry.average))
                    .font(.title3)
                    .fontWeight(.bold)
            }

            // Mini bar chart
            HStack(spacing: 4) {
                ForEach(["Career", "Relations", "Health", "Meaning", "Finances", "Fun"], id: \.self) { domain in
                    VStack(spacing: 2) {
                        ZStack(alignment: .bottom) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.gray.opacity(0.2))
                                .frame(width: 16, height: 40)

                            RoundedRectangle(cornerRadius: 2)
                                .fill(domainColor(domain))
                                .frame(width: 16, height: CGFloat(entry.scores[domain] ?? 5) * 4)
                        }

                        Text(String(domain.prefix(1)))
                            .font(.system(size: 8))
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Text("Focus: \(entry.lowestDomain)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
    }

    private func domainColor(_ domain: String) -> Color {
        switch domain {
        case "Career": return .blue
        case "Relations": return .pink
        case "Health": return .green
        case "Meaning": return .purple
        case "Finances": return .yellow
        case "Fun": return .orange
        default: return .gray
        }
    }
}

// MARK: - Widget Intent for Interactive Widgets

struct CheckInWidgetIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Configure Check-In Widget"
    static var description = IntentDescription("Configure your daily check-in widget")

    @Parameter(title: "Show Streak", default: true)
    var showStreak: Bool

    @Parameter(title: "Show Priority", default: true)
    var showPriority: Bool
}

// MARK: - Widget Bundle

@main
struct CEOProductivityWidgets: WidgetBundle {
    var body: some Widget {
        DailyCheckInWidget()
        GoalsWidget()
        LifeMapWidget()
    }
}
