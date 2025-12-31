import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Live Activity Attributes

struct EnergyTrackingAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var currentEnergy: Int
        var checkInsToday: Int
        var streakDays: Int
        var todaysPriority: String
        var nextCheckInTime: Date?
    }

    var userName: String
    var startDate: Date
}

// MARK: - Live Activity Widget

struct EnergyLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: EnergyTrackingAttributes.self) { context in
            // Lock Screen / Banner UI
            EnergyLockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    HStack {
                        Image(systemName: "bolt.fill")
                            .foregroundStyle(.yellow)
                        Text("\(context.state.currentEnergy)/10")
                            .font(.headline)
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    HStack {
                        Image(systemName: "flame.fill")
                            .foregroundStyle(.orange)
                        Text("\(context.state.streakDays)")
                            .font(.headline)
                    }
                }

                DynamicIslandExpandedRegion(.center) {
                    Text("Today's Focus")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.todaysPriority)
                        .font(.subheadline)
                        .lineLimit(2)
                        .multilineTextAlignment(.center)
                }
            } compactLeading: {
                Image(systemName: "bolt.fill")
                    .foregroundStyle(.yellow)
            } compactTrailing: {
                Text("\(context.state.currentEnergy)")
                    .font(.headline)
                    .foregroundStyle(energyColor(context.state.currentEnergy))
            } minimal: {
                Image(systemName: "bolt.fill")
                    .foregroundStyle(energyColor(context.state.currentEnergy))
            }
        }
    }

    private func energyColor(_ level: Int) -> Color {
        switch level {
        case 1...3: return .red
        case 4...6: return .orange
        case 7...8: return .yellow
        default: return .green
        }
    }
}

// MARK: - Lock Screen View

struct EnergyLockScreenView: View {
    let context: ActivityViewContext<EnergyTrackingAttributes>

    var body: some View {
        HStack(spacing: 16) {
            // Energy Circle
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 6)
                    .frame(width: 60, height: 60)

                Circle()
                    .trim(from: 0, to: CGFloat(context.state.currentEnergy) / 10)
                    .stroke(energyColor, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .frame(width: 60, height: 60)
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 0) {
                    Text("\(context.state.currentEnergy)")
                        .font(.title2)
                        .fontWeight(.bold)
                    Text("energy")
                        .font(.system(size: 8))
                        .foregroundStyle(.secondary)
                }
            }

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text("Good \(timeOfDay), \(context.attributes.userName)")
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(context.state.todaysPriority)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)

                HStack(spacing: 12) {
                    Label("\(context.state.streakDays)d", systemImage: "flame.fill")
                        .font(.caption2)
                        .foregroundStyle(.orange)

                    if context.state.checkInsToday > 0 {
                        Label("Done", systemImage: "checkmark.circle.fill")
                            .font(.caption2)
                            .foregroundStyle(.green)
                    }
                }
            }

            Spacer()

            // Quick Action
            if context.state.checkInsToday == 0 {
                Link(destination: URL(string: "ceoos://checkin")!) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title)
                        .foregroundStyle(.blue)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground).opacity(0.9))
    }

    private var energyColor: Color {
        switch context.state.currentEnergy {
        case 1...3: return .red
        case 4...6: return .orange
        case 7...8: return .yellow
        default: return .green
        }
    }

    private var timeOfDay: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12: return "morning"
        case 12..<17: return "afternoon"
        default: return "evening"
        }
    }
}

// MARK: - Live Activity Manager

@MainActor
class LiveActivityManager: ObservableObject {
    static let shared = LiveActivityManager()

    @Published var currentActivity: Activity<EnergyTrackingAttributes>?

    func startTracking(userName: String, energy: Int, priority: String, streak: Int) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

        let attributes = EnergyTrackingAttributes(
            userName: userName,
            startDate: Date()
        )

        let state = EnergyTrackingAttributes.ContentState(
            currentEnergy: energy,
            checkInsToday: 0,
            streakDays: streak,
            todaysPriority: priority,
            nextCheckInTime: nil
        )

        do {
            let activity = try Activity<EnergyTrackingAttributes>.request(
                attributes: attributes,
                content: .init(state: state, staleDate: nil),
                pushType: nil
            )
            currentActivity = activity
        } catch {
            print("Error starting live activity: \(error)")
        }
    }

    func updateEnergy(_ energy: Int, priority: String? = nil) {
        guard let activity = currentActivity else { return }

        Task {
            var state = activity.content.state
            state.currentEnergy = energy
            if let priority = priority {
                state.todaysPriority = priority
            }

            await activity.update(.init(state: state, staleDate: nil))
        }
    }

    func recordCheckIn(energy: Int, priority: String) {
        guard let activity = currentActivity else { return }

        Task {
            var state = activity.content.state
            state.currentEnergy = energy
            state.checkInsToday += 1
            state.todaysPriority = priority

            await activity.update(.init(state: state, staleDate: nil))
        }
    }

    func endTracking() {
        guard let activity = currentActivity else { return }

        Task {
            await activity.end(.init(state: activity.content.state, staleDate: nil), dismissalPolicy: .immediate)
            currentActivity = nil
        }
    }
}

// MARK: - Focus Session Live Activity

struct FocusSessionAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var remainingMinutes: Int
        var currentTask: String
        var sessionType: String // "deep work", "recovery", "admin"
    }

    var startTime: Date
    var totalMinutes: Int
}

struct FocusSessionLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: FocusSessionAttributes.self) { context in
            // Lock Screen UI
            HStack {
                VStack(alignment: .leading) {
                    Text(context.state.sessionType.capitalized)
                        .font(.headline)
                    Text(context.state.currentTask)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text("\(context.state.remainingMinutes)m")
                    .font(.title)
                    .fontWeight(.bold)
                    .monospacedDigit()
            }
            .padding()
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.center) {
                    VStack {
                        Text(context.state.currentTask)
                            .font(.headline)
                        Text("\(context.state.remainingMinutes) minutes remaining")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                Image(systemName: sessionIcon(context.state.sessionType))
            } compactTrailing: {
                Text("\(context.state.remainingMinutes)m")
                    .font(.caption)
                    .monospacedDigit()
            } minimal: {
                Image(systemName: sessionIcon(context.state.sessionType))
            }
        }
    }

    private func sessionIcon(_ type: String) -> String {
        switch type {
        case "deep work": return "brain.head.profile"
        case "recovery": return "leaf.fill"
        case "admin": return "tray.full.fill"
        default: return "clock.fill"
        }
    }
}
