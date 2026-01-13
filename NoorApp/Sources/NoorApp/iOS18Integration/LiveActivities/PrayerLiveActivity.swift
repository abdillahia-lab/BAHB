// MARK: - PrayerLiveActivity.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Prayer Live Activity Attributes

/// Attributes for Prayer countdown Live Activity
public struct PrayerLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public let prayerName: String
        public let prayerNameArabic: String
        public let prayerTime: Date
        public let isCompleted: Bool
        public let currentStreak: Int
        public let qiblaDirection: Double? // Degrees from north

        public init(
            prayerName: String,
            prayerNameArabic: String,
            prayerTime: Date,
            isCompleted: Bool = false,
            currentStreak: Int = 0,
            qiblaDirection: Double? = nil
        ) {
            self.prayerName = prayerName
            self.prayerNameArabic = prayerNameArabic
            self.prayerTime = prayerTime
            self.isCompleted = isCompleted
            self.currentStreak = currentStreak
            self.qiblaDirection = qiblaDirection
        }
    }

    public let prayerType: String
    public let locationName: String?

    public init(prayerType: String, locationName: String? = nil) {
        self.prayerType = prayerType
        self.locationName = locationName
    }
}

// MARK: - Prayer Live Activity View

@available(iOS 18.0, *)
public struct PrayerLiveActivityView: View {
    let context: ActivityViewContext<PrayerLiveActivityAttributes>

    public init(context: ActivityViewContext<PrayerLiveActivityAttributes>) {
        self.context = context
    }

    public var body: some View {
        VStack(spacing: 8) {
            // Header
            HStack {
                Image(systemName: prayerIcon)
                    .font(.title3)
                    .foregroundStyle(NoorColors.emerald.gradient)

                VStack(alignment: .leading, spacing: 2) {
                    Text(context.state.prayerName)
                        .font(.headline)
                        .fontWeight(.semibold)

                    Text(context.state.prayerNameArabic)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                if context.state.isCompleted {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.title2)
                        .foregroundStyle(NoorColors.emerald)
                } else {
                    // Countdown timer
                    Text(context.state.prayerTime, style: .timer)
                        .font(.title2)
                        .fontWeight(.bold)
                        .monospacedDigit()
                        .foregroundStyle(NoorColors.emerald)
                }
            }

            // Progress bar (time until prayer)
            if !context.state.isCompleted {
                ProgressView(
                    timerInterval: Date()...context.state.prayerTime,
                    countsDown: true
                ) {
                    EmptyView()
                } currentValueLabel: {
                    EmptyView()
                }
                .tint(NoorColors.emerald)
            }

            // Footer with streak and actions
            HStack {
                // Streak badge
                if context.state.currentStreak > 0 {
                    Label("\(context.state.currentStreak) day streak", systemImage: "flame.fill")
                        .font(.caption)
                        .foregroundStyle(NoorColors.gold)
                }

                Spacer()

                // Location if available
                if let location = context.attributes.locationName {
                    Label(location, systemImage: "location.fill")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
    }

    private var prayerIcon: String {
        switch context.attributes.prayerType {
        case "Fajr": return "sunrise.fill"
        case "Dhuhr": return "sun.max.fill"
        case "Asr": return "sun.haze.fill"
        case "Maghrib": return "sunset.fill"
        case "Isha": return "moon.stars.fill"
        default: return "clock.fill"
        }
    }
}

// MARK: - Dynamic Island Views

@available(iOS 18.0, *)
public struct PrayerDynamicIslandExpandedView: View {
    let context: ActivityViewContext<PrayerLiveActivityAttributes>

    public init(context: ActivityViewContext<PrayerLiveActivityAttributes>) {
        self.context = context
    }

    public var body: some View {
        VStack(spacing: 12) {
            // Main content
            HStack(alignment: .center, spacing: 16) {
                // Prayer info
                VStack(alignment: .leading, spacing: 4) {
                    Text(context.state.prayerName.uppercased())
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)

                    if context.state.isCompleted {
                        Text("Completed")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundStyle(NoorColors.emerald)
                    } else {
                        Text(context.state.prayerTime, style: .timer)
                            .font(.title2)
                            .fontWeight(.bold)
                            .monospacedDigit()
                    }
                }

                Spacer()

                // Actions
                if !context.state.isCompleted {
                    HStack(spacing: 12) {
                        // Mark Complete button
                        Button(intent: MarkPrayerCompleteIntent(prayerType: context.attributes.prayerType)) {
                            Image(systemName: "checkmark.circle")
                                .font(.title2)
                        }
                        .buttonStyle(.plain)

                        // Qibla button
                        if context.state.qiblaDirection != nil {
                            Button(intent: ShowQiblaIntent()) {
                                Image(systemName: "safari")
                                    .font(.title2)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }

            // Progress bar
            if !context.state.isCompleted {
                ProgressView(
                    timerInterval: Date()...context.state.prayerTime,
                    countsDown: true
                ) {
                    EmptyView()
                } currentValueLabel: {
                    EmptyView()
                }
                .tint(NoorColors.emerald)
            }
        }
        .padding(.horizontal)
    }
}

@available(iOS 18.0, *)
public struct PrayerDynamicIslandCompactLeadingView: View {
    let context: ActivityViewContext<PrayerLiveActivityAttributes>

    public var body: some View {
        Image(systemName: prayerIcon)
            .foregroundStyle(NoorColors.emerald.gradient)
    }

    private var prayerIcon: String {
        switch context.attributes.prayerType {
        case "Fajr": return "sunrise.fill"
        case "Dhuhr": return "sun.max.fill"
        case "Asr": return "sun.haze.fill"
        case "Maghrib": return "sunset.fill"
        case "Isha": return "moon.stars.fill"
        default: return "clock.fill"
        }
    }
}

@available(iOS 18.0, *)
public struct PrayerDynamicIslandCompactTrailingView: View {
    let context: ActivityViewContext<PrayerLiveActivityAttributes>

    public var body: some View {
        if context.state.isCompleted {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(NoorColors.emerald)
        } else {
            Text(context.state.prayerTime, style: .timer)
                .font(.caption)
                .fontWeight(.semibold)
                .monospacedDigit()
        }
    }
}

@available(iOS 18.0, *)
public struct PrayerDynamicIslandMinimalView: View {
    let context: ActivityViewContext<PrayerLiveActivityAttributes>

    public var body: some View {
        Image(systemName: prayerIcon)
            .foregroundStyle(NoorColors.emerald.gradient)
    }

    private var prayerIcon: String {
        switch context.attributes.prayerType {
        case "Fajr": return "sunrise.fill"
        case "Dhuhr": return "sun.max.fill"
        case "Asr": return "sun.haze.fill"
        case "Maghrib": return "sunset.fill"
        case "Isha": return "moon.stars.fill"
        default: return "clock.fill"
        }
    }
}

// MARK: - Live Activity Manager

@available(iOS 18.0, *)
public final class PrayerLiveActivityManager {
    public static let shared = PrayerLiveActivityManager()

    private var currentActivity: Activity<PrayerLiveActivityAttributes>?

    private init() {}

    /// Start a prayer countdown Live Activity
    public func startPrayerCountdown(
        prayerType: PrayerType,
        prayerTime: Date,
        locationName: String? = nil,
        currentStreak: Int = 0,
        qiblaDirection: Double? = nil
    ) async throws {
        // End any existing activity
        await endCurrentActivity()

        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            throw LiveActivityError.notAuthorized
        }

        let attributes = PrayerLiveActivityAttributes(
            prayerType: prayerType.rawValue,
            locationName: locationName
        )

        let initialState = PrayerLiveActivityAttributes.ContentState(
            prayerName: prayerType.rawValue,
            prayerNameArabic: prayerType.arabicName,
            prayerTime: prayerTime,
            isCompleted: false,
            currentStreak: currentStreak,
            qiblaDirection: qiblaDirection
        )

        // Set stale date to 30 minutes after prayer time
        let staleDate = Calendar.current.date(byAdding: .minute, value: 30, to: prayerTime)

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
        } catch {
            throw LiveActivityError.failedToStart(error)
        }
    }

    /// Mark the current prayer as completed
    public func markPrayerCompleted() async {
        guard let activity = currentActivity else { return }

        let updatedState = PrayerLiveActivityAttributes.ContentState(
            prayerName: activity.content.state.prayerName,
            prayerNameArabic: activity.content.state.prayerNameArabic,
            prayerTime: activity.content.state.prayerTime,
            isCompleted: true,
            currentStreak: activity.content.state.currentStreak + 1,
            qiblaDirection: activity.content.state.qiblaDirection
        )

        let content = ActivityContent(
            state: updatedState,
            staleDate: Date().addingTimeInterval(60), // End in 1 minute
            relevanceScore: 50
        )

        await activity.update(content)

        // End after brief celebration
        try? await Task.sleep(nanoseconds: 3_000_000_000) // 3 seconds
        await endCurrentActivity()
    }

    /// Update the Live Activity with new prayer info
    public func updateActivity(
        prayerTime: Date? = nil,
        qiblaDirection: Double? = nil
    ) async {
        guard let activity = currentActivity else { return }

        let updatedState = PrayerLiveActivityAttributes.ContentState(
            prayerName: activity.content.state.prayerName,
            prayerNameArabic: activity.content.state.prayerNameArabic,
            prayerTime: prayerTime ?? activity.content.state.prayerTime,
            isCompleted: activity.content.state.isCompleted,
            currentStreak: activity.content.state.currentStreak,
            qiblaDirection: qiblaDirection ?? activity.content.state.qiblaDirection
        )

        let content = ActivityContent(
            state: updatedState,
            staleDate: activity.content.staleDate,
            relevanceScore: 100
        )

        await activity.update(content)
    }

    /// End the current Live Activity
    public func endCurrentActivity() async {
        guard let activity = currentActivity else { return }

        let finalState = activity.content.state

        await activity.end(
            ActivityContent(state: finalState, staleDate: nil),
            dismissalPolicy: .immediate
        )

        currentActivity = nil
    }

    /// Check if a Live Activity is currently active
    public var isActivityActive: Bool {
        currentActivity != nil && currentActivity?.activityState == .active
    }
}

// MARK: - App Intents for Live Activity Actions

import AppIntents

@available(iOS 18.0, *)
public struct MarkPrayerCompleteIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "Mark Prayer Complete"
    public static var description = IntentDescription("Mark the current prayer as completed")

    @Parameter(title: "Prayer Type")
    public var prayerType: String

    public init() {
        self.prayerType = ""
    }

    public init(prayerType: String) {
        self.prayerType = prayerType
    }

    public func perform() async throws -> some IntentResult {
        await PrayerLiveActivityManager.shared.markPrayerCompleted()

        // Also log the prayer in the database
        // PrayerLogService.shared.logPrayer(type: prayerType)

        return .result()
    }
}

@available(iOS 18.0, *)
public struct ShowQiblaIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "Show Qibla Direction"
    public static var description = IntentDescription("Open the Qibla compass")

    public init() {}

    public func perform() async throws -> some IntentResult {
        // This would open the app to the Qibla view
        return .result()
    }
}

// MARK: - Errors

public enum LiveActivityError: Error, LocalizedError {
    case notAuthorized
    case failedToStart(Error)
    case activityNotFound

    public var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Live Activities are not enabled. Please enable them in Settings."
        case .failedToStart(let error):
            return "Failed to start Live Activity: \(error.localizedDescription)"
        case .activityNotFound:
            return "No active prayer Live Activity found."
        }
    }
}

// MARK: - Color Constants (Placeholder)

enum NoorColors {
    static let emerald = Color(red: 13/255, green: 115/255, blue: 119/255)
    static let gold = Color(red: 212/255, green: 175/255, blue: 55/255)
    static let ivory = Color(red: 245/255, green: 245/255, blue: 220/255)
}
