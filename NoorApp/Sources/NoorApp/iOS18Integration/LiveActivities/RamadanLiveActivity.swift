// MARK: - RamadanLiveActivity.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Ramadan Fasting Live Activity Attributes

/// Attributes for Ramadan fasting timer Live Activity
public struct RamadanLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public let fastingState: String // FastingState.rawValue
        public let suhoorEndTime: Date
        public let iftarTime: Date
        public let ramadanDay: Int
        public let totalDays: Int
        public let quranPagesRead: Int
        public let quranTarget: Int
        public let dailyHadith: String?
        public let isLaylatulQadrNight: Bool

        public init(
            fastingState: String,
            suhoorEndTime: Date,
            iftarTime: Date,
            ramadanDay: Int,
            totalDays: Int = 30,
            quranPagesRead: Int = 0,
            quranTarget: Int = 20,
            dailyHadith: String? = nil,
            isLaylatulQadrNight: Bool = false
        ) {
            self.fastingState = fastingState
            self.suhoorEndTime = suhoorEndTime
            self.iftarTime = iftarTime
            self.ramadanDay = ramadanDay
            self.totalDays = totalDays
            self.quranPagesRead = quranPagesRead
            self.quranTarget = quranTarget
            self.dailyHadith = dailyHadith
            self.isLaylatulQadrNight = isLaylatulQadrNight
        }

        public var fastingProgress: Double {
            let now = Date()
            guard now >= suhoorEndTime && now <= iftarTime else {
                return now < suhoorEndTime ? 0 : 1
            }
            let total = iftarTime.timeIntervalSince(suhoorEndTime)
            let elapsed = now.timeIntervalSince(suhoorEndTime)
            return elapsed / total
        }

        public var timeUntilIftar: TimeInterval {
            max(0, iftarTime.timeIntervalSince(Date()))
        }

        public var timeUntilSuhoorEnd: TimeInterval {
            max(0, suhoorEndTime.timeIntervalSince(Date()))
        }
    }

    public let hijriYear: Int
    public let locationName: String?

    public init(hijriYear: Int, locationName: String? = nil) {
        self.hijriYear = hijriYear
        self.locationName = locationName
    }
}

// MARK: - Ramadan Live Activity Lock Screen View

@available(iOS 18.0, *)
public struct RamadanLiveActivityView: View {
    let context: ActivityViewContext<RamadanLiveActivityAttributes>

    public init(context: ActivityViewContext<RamadanLiveActivityAttributes>) {
        self.context = context
    }

    public var body: some View {
        VStack(spacing: 10) {
            // Header with Ramadan day
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "moon.stars.fill")
                            .foregroundStyle(NoorColors.gold.gradient)
                        Text("Ramadan Day \(context.state.ramadanDay)")
                            .font(.headline)
                            .fontWeight(.semibold)
                    }

                    if context.state.isLaylatulQadrNight {
                        Text("Potential Laylatul Qadr")
                            .font(.caption)
                            .foregroundStyle(NoorColors.gold)
                    }
                }

                Spacer()

                // Fasting state badge
                fastingStateBadge
            }

            // Main countdown
            VStack(spacing: 6) {
                if context.state.fastingState == FastingState.fasting.rawValue {
                    // Iftar countdown during fasting
                    Text("IFTAR IN")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(.secondary)

                    Text(context.state.iftarTime, style: .timer)
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(NoorColors.emerald)

                    // Progress bar
                    ProgressView(value: context.state.fastingProgress)
                        .tint(progressGradient)
                        .scaleEffect(y: 1.5)

                } else if context.state.fastingState == FastingState.suhoorTime.rawValue {
                    // Suhoor ending countdown
                    Text("SUHOOR ENDS IN")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(.secondary)

                    Text(context.state.suhoorEndTime, style: .timer)
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(NoorColors.gold)

                } else {
                    // Iftar time - celebration
                    VStack(spacing: 4) {
                        Text("IFTAR TIME!")
                            .font(.headline)
                            .foregroundStyle(NoorColors.gold)

                        Text("Break your fast with dates and water")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            // Footer with stats
            HStack {
                // Quran progress
                Label {
                    Text("\(context.state.quranPagesRead)/\(context.state.quranTarget) pages")
                        .font(.caption2)
                } icon: {
                    Image(systemName: "book.fill")
                        .font(.caption2)
                }
                .foregroundStyle(.secondary)

                Spacer()

                // Location
                if let location = context.attributes.locationName {
                    Label(location, systemImage: "location.fill")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            // Daily hadith (if space allows)
            if let hadith = context.state.dailyHadith {
                Text(hadith)
                    .font(.caption2)
                    .italic()
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .padding(.top, 4)
            }
        }
        .padding()
    }

    private var fastingStateBadge: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(fastingStateColor)
                .frame(width: 8, height: 8)

            Text(context.state.fastingState)
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(fastingStateColor.opacity(0.15))
        .clipShape(Capsule())
    }

    private var fastingStateColor: Color {
        switch context.state.fastingState {
        case FastingState.suhoorTime.rawValue:
            return NoorColors.gold
        case FastingState.fasting.rawValue:
            return NoorColors.emerald
        case FastingState.iftarTime.rawValue:
            return NoorColors.gold
        default:
            return .secondary
        }
    }

    private var progressGradient: LinearGradient {
        LinearGradient(
            colors: [NoorColors.emerald.opacity(0.6), NoorColors.gold],
            startPoint: .leading,
            endPoint: .trailing
        )
    }
}

// MARK: - Dynamic Island Views

@available(iOS 18.0, *)
public struct RamadanDynamicIslandExpandedView: View {
    let context: ActivityViewContext<RamadanLiveActivityAttributes>

    public var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Label("Day \(context.state.ramadanDay)", systemImage: "moon.stars.fill")
                    .font(.caption)
                    .foregroundStyle(NoorColors.gold)

                Spacer()

                if context.state.isLaylatulQadrNight {
                    Text("Laylatul Qadr")
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(NoorColors.gold.opacity(0.2))
                        .clipShape(Capsule())
                }
            }

            // Main content based on state
            if context.state.fastingState == FastingState.fasting.rawValue {
                VStack(spacing: 4) {
                    Text("Iftar in")
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    Text(context.state.iftarTime, style: .timer)
                        .font(.title2)
                        .fontWeight(.bold)
                        .monospacedDigit()
                }

                // Progress
                ProgressView(value: context.state.fastingProgress)
                    .tint(NoorColors.emerald)

            } else if context.state.fastingState == FastingState.suhoorTime.rawValue {
                VStack(spacing: 4) {
                    Text("Eat before")
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    Text(context.state.suhoorEndTime, style: .timer)
                        .font(.title2)
                        .fontWeight(.bold)
                        .monospacedDigit()
                        .foregroundStyle(NoorColors.gold)
                }
            } else {
                Text("Iftar Time!")
                    .font(.headline)
                    .foregroundStyle(NoorColors.gold)
            }

            // Action buttons
            if context.state.fastingState == FastingState.fasting.rawValue {
                HStack(spacing: 16) {
                    Button(intent: LogQuranPagesIntent()) {
                        Label("Log Quran", systemImage: "book")
                    }
                    .buttonStyle(.plain)
                    .font(.caption)

                    Button(intent: ViewRamadanDashboardIntent()) {
                        Label("Dashboard", systemImage: "chart.bar")
                    }
                    .buttonStyle(.plain)
                    .font(.caption)
                }
            }
        }
        .padding(.horizontal)
    }
}

@available(iOS 18.0, *)
public struct RamadanDynamicIslandCompactLeadingView: View {
    let context: ActivityViewContext<RamadanLiveActivityAttributes>

    public var body: some View {
        Image(systemName: "moon.stars.fill")
            .foregroundStyle(NoorColors.gold.gradient)
    }
}

@available(iOS 18.0, *)
public struct RamadanDynamicIslandCompactTrailingView: View {
    let context: ActivityViewContext<RamadanLiveActivityAttributes>

    public var body: some View {
        if context.state.fastingState == FastingState.fasting.rawValue {
            Text(context.state.iftarTime, style: .timer)
                .font(.caption)
                .fontWeight(.semibold)
                .monospacedDigit()
        } else if context.state.fastingState == FastingState.suhoorTime.rawValue {
            Text(context.state.suhoorEndTime, style: .timer)
                .font(.caption)
                .fontWeight(.semibold)
                .monospacedDigit()
                .foregroundStyle(NoorColors.gold)
        } else {
            Text("Iftar!")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundStyle(NoorColors.gold)
        }
    }
}

@available(iOS 18.0, *)
public struct RamadanDynamicIslandMinimalView: View {
    let context: ActivityViewContext<RamadanLiveActivityAttributes>

    public var body: some View {
        ZStack {
            Circle()
                .stroke(NoorColors.gold.opacity(0.3), lineWidth: 2)

            Circle()
                .trim(from: 0, to: context.state.fastingProgress)
                .stroke(NoorColors.gold, lineWidth: 2)
                .rotationEffect(.degrees(-90))

            Image(systemName: "moon.fill")
                .font(.system(size: 8))
                .foregroundStyle(NoorColors.gold)
        }
    }
}

// MARK: - Ramadan Live Activity Manager

@available(iOS 18.0, *)
public final class RamadanLiveActivityManager {
    public static let shared = RamadanLiveActivityManager()

    private var currentActivity: Activity<RamadanLiveActivityAttributes>?
    private var updateTimer: Timer?

    private init() {}

    /// Start Ramadan fasting Live Activity
    public func startRamadanFasting(
        ramadanDay: Int,
        hijriYear: Int,
        suhoorEndTime: Date,
        iftarTime: Date,
        locationName: String? = nil,
        quranTarget: Int = 20,
        dailyHadith: String? = nil
    ) async throws {
        // End any existing activity
        await endCurrentActivity()

        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            throw LiveActivityError.notAuthorized
        }

        let attributes = RamadanLiveActivityAttributes(
            hijriYear: hijriYear,
            locationName: locationName
        )

        let isLaylatulQadr = [21, 23, 25, 27, 29].contains(ramadanDay)

        // Determine initial state
        let now = Date()
        let fastingState: FastingState
        if now < suhoorEndTime {
            fastingState = .suhoorTime
        } else if now < iftarTime {
            fastingState = .fasting
        } else {
            fastingState = .iftarTime
        }

        let initialState = RamadanLiveActivityAttributes.ContentState(
            fastingState: fastingState.rawValue,
            suhoorEndTime: suhoorEndTime,
            iftarTime: iftarTime,
            ramadanDay: ramadanDay,
            totalDays: 30,
            quranPagesRead: 0,
            quranTarget: quranTarget,
            dailyHadith: dailyHadith,
            isLaylatulQadrNight: isLaylatulQadr
        )

        // Stale at midnight
        let calendar = Calendar.current
        let staleDate = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: now))

        let content = ActivityContent(
            state: initialState,
            staleDate: staleDate,
            relevanceScore: 100
        )

        do {
            currentActivity = try Activity.request(
                attributes: attributes,
                content: content,
                pushType: .token
            )

            // Start periodic updates
            startPeriodicUpdates(suhoorEndTime: suhoorEndTime, iftarTime: iftarTime)
        } catch {
            throw LiveActivityError.failedToStart(error)
        }
    }

    /// Update with new Quran reading progress
    public func updateQuranProgress(pagesRead: Int) async {
        guard let activity = currentActivity else { return }

        let updatedState = RamadanLiveActivityAttributes.ContentState(
            fastingState: activity.content.state.fastingState,
            suhoorEndTime: activity.content.state.suhoorEndTime,
            iftarTime: activity.content.state.iftarTime,
            ramadanDay: activity.content.state.ramadanDay,
            totalDays: activity.content.state.totalDays,
            quranPagesRead: pagesRead,
            quranTarget: activity.content.state.quranTarget,
            dailyHadith: activity.content.state.dailyHadith,
            isLaylatulQadrNight: activity.content.state.isLaylatulQadrNight
        )

        let content = ActivityContent(
            state: updatedState,
            staleDate: activity.content.staleDate,
            relevanceScore: 100
        )

        await activity.update(content)
    }

    /// Trigger iftar celebration
    public func triggerIftarCelebration() async {
        guard let activity = currentActivity else { return }

        let updatedState = RamadanLiveActivityAttributes.ContentState(
            fastingState: FastingState.iftarTime.rawValue,
            suhoorEndTime: activity.content.state.suhoorEndTime,
            iftarTime: activity.content.state.iftarTime,
            ramadanDay: activity.content.state.ramadanDay,
            totalDays: activity.content.state.totalDays,
            quranPagesRead: activity.content.state.quranPagesRead,
            quranTarget: activity.content.state.quranTarget,
            dailyHadith: activity.content.state.dailyHadith,
            isLaylatulQadrNight: activity.content.state.isLaylatulQadrNight
        )

        let content = ActivityContent(
            state: updatedState,
            staleDate: Date().addingTimeInterval(3600), // Active for 1 hour after iftar
            relevanceScore: 100
        )

        await activity.update(content)

        // Trigger haptic celebration
        // HapticsEngine.shared.playIftarCelebration()
    }

    /// End the current Live Activity
    public func endCurrentActivity() async {
        stopPeriodicUpdates()

        guard let activity = currentActivity else { return }

        await activity.end(
            ActivityContent(state: activity.content.state, staleDate: nil),
            dismissalPolicy: .immediate
        )

        currentActivity = nil
    }

    // MARK: - Private Methods

    private func startPeriodicUpdates(suhoorEndTime: Date, iftarTime: Date) {
        updateTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.updateFastingState(suhoorEndTime: suhoorEndTime, iftarTime: iftarTime)
            }
        }
    }

    private func stopPeriodicUpdates() {
        updateTimer?.invalidate()
        updateTimer = nil
    }

    private func updateFastingState(suhoorEndTime: Date, iftarTime: Date) async {
        guard let activity = currentActivity else { return }

        let now = Date()
        let newState: FastingState

        if now < suhoorEndTime {
            newState = .suhoorTime
        } else if now < iftarTime {
            newState = .fasting
        } else {
            newState = .iftarTime
            // Trigger celebration if just reached iftar
            if activity.content.state.fastingState != FastingState.iftarTime.rawValue {
                await triggerIftarCelebration()
                return
            }
        }

        // Only update if state changed
        guard newState.rawValue != activity.content.state.fastingState else { return }

        let updatedState = RamadanLiveActivityAttributes.ContentState(
            fastingState: newState.rawValue,
            suhoorEndTime: activity.content.state.suhoorEndTime,
            iftarTime: activity.content.state.iftarTime,
            ramadanDay: activity.content.state.ramadanDay,
            totalDays: activity.content.state.totalDays,
            quranPagesRead: activity.content.state.quranPagesRead,
            quranTarget: activity.content.state.quranTarget,
            dailyHadith: activity.content.state.dailyHadith,
            isLaylatulQadrNight: activity.content.state.isLaylatulQadrNight
        )

        let content = ActivityContent(
            state: updatedState,
            staleDate: activity.content.staleDate,
            relevanceScore: 100
        )

        await activity.update(content)
    }

    public var isActivityActive: Bool {
        currentActivity != nil && currentActivity?.activityState == .active
    }
}

// MARK: - App Intents

import AppIntents

@available(iOS 18.0, *)
public struct LogQuranPagesIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "Log Quran Pages"
    public static var description = IntentDescription("Log Quran pages read today")

    public init() {}

    public func perform() async throws -> some IntentResult {
        // Would open Quran logging UI
        return .result()
    }
}

@available(iOS 18.0, *)
public struct ViewRamadanDashboardIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "View Ramadan Dashboard"
    public static var description = IntentDescription("Open the Ramadan dashboard")

    public init() {}

    public func perform() async throws -> some IntentResult {
        // Would open Ramadan dashboard
        return .result()
    }
}
