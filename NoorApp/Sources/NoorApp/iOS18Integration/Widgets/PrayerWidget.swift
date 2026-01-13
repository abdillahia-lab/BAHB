// MARK: - PrayerWidget.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Prayer Widget Entry

struct PrayerWidgetEntry: TimelineEntry {
    let date: Date
    let configuration: PrayerWidgetConfigurationIntent
    let prayerTimes: WidgetPrayerTimes
    let currentStreak: Int
    let locationName: String?

    struct WidgetPrayerTimes {
        let fajr: (time: Date, completed: Bool)
        let dhuhr: (time: Date, completed: Bool)
        let asr: (time: Date, completed: Bool)
        let maghrib: (time: Date, completed: Bool)
        let isha: (time: Date, completed: Bool)

        var nextPrayer: (name: String, time: Date)? {
            let now = Date()
            let prayers = [
                ("Fajr", fajr),
                ("Dhuhr", dhuhr),
                ("Asr", asr),
                ("Maghrib", maghrib),
                ("Isha", isha)
            ]

            for (name, prayer) in prayers {
                if !prayer.completed && prayer.time > now {
                    return (name, prayer.time)
                }
            }

            // All prayers completed or past, return tomorrow's Fajr
            return nil
        }

        var allCompleted: Bool {
            fajr.completed && dhuhr.completed && asr.completed && maghrib.completed && isha.completed
        }

        var completedCount: Int {
            [fajr, dhuhr, asr, maghrib, isha].filter { $0.completed }.count
        }
    }
}

// MARK: - Prayer Widget Configuration Intent

struct PrayerWidgetConfigurationIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Configure Prayer Widget"
    static var description = IntentDescription("Configure your prayer widget display")

    @Parameter(title: "Show Countdown")
    var showCountdown: Bool

    @Parameter(title: "Show Streak")
    var showStreak: Bool

    @Parameter(title: "Compact Mode")
    var compactMode: Bool

    init() {
        self.showCountdown = true
        self.showStreak = true
        self.compactMode = false
    }

    init(showCountdown: Bool, showStreak: Bool, compactMode: Bool) {
        self.showCountdown = showCountdown
        self.showStreak = showStreak
        self.compactMode = compactMode
    }
}

// MARK: - Prayer Widget Provider

struct PrayerWidgetProvider: AppIntentTimelineProvider {
    typealias Entry = PrayerWidgetEntry
    typealias Intent = PrayerWidgetConfigurationIntent

    func placeholder(in context: Context) -> PrayerWidgetEntry {
        PrayerWidgetEntry(
            date: Date(),
            configuration: PrayerWidgetConfigurationIntent(),
            prayerTimes: samplePrayerTimes(),
            currentStreak: 7,
            locationName: "New York"
        )
    }

    func snapshot(for configuration: PrayerWidgetConfigurationIntent, in context: Context) async -> PrayerWidgetEntry {
        PrayerWidgetEntry(
            date: Date(),
            configuration: configuration,
            prayerTimes: samplePrayerTimes(),
            currentStreak: 7,
            locationName: "New York"
        )
    }

    func timeline(for configuration: PrayerWidgetConfigurationIntent, in context: Context) async -> Timeline<PrayerWidgetEntry> {
        var entries: [PrayerWidgetEntry] = []

        // Get actual prayer times from shared data
        let prayerTimes = await fetchPrayerTimes()
        let streak = await fetchCurrentStreak()
        let location = await fetchLocationName()

        let currentDate = Date()

        // Create entries for each prayer time transition
        let entry = PrayerWidgetEntry(
            date: currentDate,
            configuration: configuration,
            prayerTimes: prayerTimes,
            currentStreak: streak,
            locationName: location
        )
        entries.append(entry)

        // Schedule updates at each prayer time
        let prayerDates = [
            prayerTimes.fajr.time,
            prayerTimes.dhuhr.time,
            prayerTimes.asr.time,
            prayerTimes.maghrib.time,
            prayerTimes.isha.time
        ].filter { $0 > currentDate }

        for prayerDate in prayerDates {
            let futureEntry = PrayerWidgetEntry(
                date: prayerDate,
                configuration: configuration,
                prayerTimes: prayerTimes,
                currentStreak: streak,
                locationName: location
            )
            entries.append(futureEntry)
        }

        return Timeline(entries: entries, policy: .atEnd)
    }

    // MARK: - Data Fetching

    private func fetchPrayerTimes() async -> PrayerWidgetEntry.WidgetPrayerTimes {
        // In production, fetch from App Group UserDefaults or SwiftData
        return samplePrayerTimes()
    }

    private func fetchCurrentStreak() async -> Int {
        // In production, fetch from App Group
        return 7
    }

    private func fetchLocationName() async -> String? {
        // In production, fetch from App Group
        return "New York"
    }

    private func samplePrayerTimes() -> PrayerWidgetEntry.WidgetPrayerTimes {
        let calendar = Calendar.current
        let now = Date()

        return PrayerWidgetEntry.WidgetPrayerTimes(
            fajr: (calendar.date(bySettingHour: 5, minute: 30, second: 0, of: now)!, true),
            dhuhr: (calendar.date(bySettingHour: 12, minute: 30, second: 0, of: now)!, true),
            asr: (calendar.date(bySettingHour: 15, minute: 45, second: 0, of: now)!, false),
            maghrib: (calendar.date(bySettingHour: 18, minute: 15, second: 0, of: now)!, false),
            isha: (calendar.date(bySettingHour: 19, minute: 45, second: 0, of: now)!, false)
        )
    }
}

// MARK: - Prayer Widget Views

struct PrayerWidgetSmallView: View {
    let entry: PrayerWidgetEntry

    var body: some View {
        VStack(spacing: 8) {
            // Header
            HStack {
                Image(systemName: nextPrayerIcon)
                    .font(.caption)
                    .foregroundStyle(NoorColors.emerald.gradient)

                Text(entry.prayerTimes.nextPrayer?.name ?? "All Complete")
                    .font(.caption)
                    .fontWeight(.semibold)

                Spacer()
            }

            Spacer()

            // Next prayer time
            if let nextPrayer = entry.prayerTimes.nextPrayer {
                if entry.configuration.showCountdown {
                    Text(nextPrayer.time, style: .timer)
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(NoorColors.emerald)
                } else {
                    Text(nextPrayer.time, style: .time)
                        .font(.title2)
                        .fontWeight(.bold)
                }
            } else {
                Image(systemName: "checkmark.circle.fill")
                    .font(.largeTitle)
                    .foregroundStyle(NoorColors.emerald)
            }

            Spacer()

            // Footer with streak
            if entry.configuration.showStreak && entry.currentStreak > 0 {
                HStack {
                    Image(systemName: "flame.fill")
                        .font(.caption2)
                        .foregroundStyle(NoorColors.gold)

                    Text("\(entry.currentStreak)")
                        .font(.caption2)
                        .fontWeight(.semibold)
                }
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            NoorColors.ivory
        }
    }

    private var nextPrayerIcon: String {
        guard let name = entry.prayerTimes.nextPrayer?.name else {
            return "checkmark.seal.fill"
        }
        switch name {
        case "Fajr": return "sunrise.fill"
        case "Dhuhr": return "sun.max.fill"
        case "Asr": return "sun.haze.fill"
        case "Maghrib": return "sunset.fill"
        case "Isha": return "moon.stars.fill"
        default: return "clock.fill"
        }
    }
}

struct PrayerWidgetMediumView: View {
    let entry: PrayerWidgetEntry

    var body: some View {
        HStack(spacing: 16) {
            // Left side - Next prayer
            VStack(alignment: .leading, spacing: 8) {
                Text("Next Prayer")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let nextPrayer = entry.prayerTimes.nextPrayer {
                    HStack(spacing: 6) {
                        Image(systemName: prayerIcon(for: nextPrayer.name))
                            .foregroundStyle(NoorColors.emerald.gradient)

                        Text(nextPrayer.name)
                            .font(.headline)
                            .fontWeight(.bold)
                    }

                    Text(nextPrayer.time, style: .timer)
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(NoorColors.emerald)
                } else {
                    Text("All Complete!")
                        .font(.headline)
                        .foregroundStyle(NoorColors.emerald)
                }

                if entry.configuration.showStreak && entry.currentStreak > 0 {
                    Label("\(entry.currentStreak) day streak", systemImage: "flame.fill")
                        .font(.caption2)
                        .foregroundStyle(NoorColors.gold)
                }
            }

            Spacer()

            // Right side - All prayers
            VStack(spacing: 4) {
                prayerRow("Fajr", entry.prayerTimes.fajr)
                prayerRow("Dhuhr", entry.prayerTimes.dhuhr)
                prayerRow("Asr", entry.prayerTimes.asr)
                prayerRow("Maghrib", entry.prayerTimes.maghrib)
                prayerRow("Isha", entry.prayerTimes.isha)
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            NoorColors.ivory
        }
    }

    private func prayerRow(_ name: String, _ prayer: (time: Date, completed: Bool)) -> some View {
        HStack(spacing: 6) {
            // Interactive button to mark complete
            Button(intent: MarkPrayerIntent(prayerName: name)) {
                Image(systemName: prayer.completed ? "checkmark.circle.fill" : "circle")
                    .font(.caption)
                    .foregroundStyle(prayer.completed ? NoorColors.emerald : .secondary)
            }
            .buttonStyle(.plain)

            Text(name)
                .font(.caption2)
                .frame(width: 50, alignment: .leading)
                .foregroundStyle(prayer.completed ? .secondary : .primary)

            Text(prayer.time, style: .time)
                .font(.caption2)
                .monospacedDigit()
                .foregroundStyle(prayer.completed ? .secondary : .primary)
        }
    }

    private func prayerIcon(for name: String) -> String {
        switch name {
        case "Fajr": return "sunrise.fill"
        case "Dhuhr": return "sun.max.fill"
        case "Asr": return "sun.haze.fill"
        case "Maghrib": return "sunset.fill"
        case "Isha": return "moon.stars.fill"
        default: return "clock.fill"
        }
    }
}

struct PrayerWidgetLargeView: View {
    let entry: PrayerWidgetEntry

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Prayer Times")
                        .font(.headline)
                        .fontWeight(.bold)

                    if let location = entry.locationName {
                        Label(location, systemImage: "location.fill")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                if entry.configuration.showStreak && entry.currentStreak > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .foregroundStyle(NoorColors.gold)
                        Text("\(entry.currentStreak)")
                            .fontWeight(.bold)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(NoorColors.gold.opacity(0.15))
                    .clipShape(Capsule())
                }
            }

            // Next prayer highlight
            if let nextPrayer = entry.prayerTimes.nextPrayer {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("NEXT")
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .foregroundStyle(.secondary)

                        HStack(spacing: 8) {
                            Image(systemName: prayerIcon(for: nextPrayer.name))
                                .font(.title2)
                                .foregroundStyle(NoorColors.emerald.gradient)

                            Text(nextPrayer.name)
                                .font(.title2)
                                .fontWeight(.bold)
                        }
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        Text(nextPrayer.time, style: .time)
                            .font(.title3)
                            .fontWeight(.semibold)

                        Text(nextPrayer.time, style: .timer)
                            .font(.caption)
                            .monospacedDigit()
                            .foregroundStyle(.secondary)
                    }
                }
                .padding()
                .background(NoorColors.emerald.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            // All prayers grid
            VStack(spacing: 8) {
                largePrayerRow("Fajr", "sunrise.fill", entry.prayerTimes.fajr)
                largePrayerRow("Dhuhr", "sun.max.fill", entry.prayerTimes.dhuhr)
                largePrayerRow("Asr", "sun.haze.fill", entry.prayerTimes.asr)
                largePrayerRow("Maghrib", "sunset.fill", entry.prayerTimes.maghrib)
                largePrayerRow("Isha", "moon.stars.fill", entry.prayerTimes.isha)
            }

            Spacer()

            // Footer
            HStack {
                Text("\(entry.prayerTimes.completedCount)/5 prayers completed")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Spacer()

                Text(entry.date, style: .date)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            NoorColors.ivory
        }
    }

    private func largePrayerRow(_ name: String, _ icon: String, _ prayer: (time: Date, completed: Bool)) -> some View {
        HStack(spacing: 12) {
            Button(intent: MarkPrayerIntent(prayerName: name)) {
                Image(systemName: prayer.completed ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(prayer.completed ? NoorColors.emerald : Color.secondary.opacity(0.5))
            }
            .buttonStyle(.plain)

            Image(systemName: icon)
                .font(.body)
                .foregroundStyle(prayer.completed ? .secondary : NoorColors.emerald.gradient)
                .frame(width: 20)

            Text(name)
                .font(.subheadline)
                .foregroundStyle(prayer.completed ? .secondary : .primary)

            Spacer()

            Text(prayer.time, style: .time)
                .font(.subheadline)
                .monospacedDigit()
                .foregroundStyle(prayer.completed ? .secondary : .primary)
        }
        .padding(.vertical, 4)
    }

    private func prayerIcon(for name: String) -> String {
        switch name {
        case "Fajr": return "sunrise.fill"
        case "Dhuhr": return "sun.max.fill"
        case "Asr": return "sun.haze.fill"
        case "Maghrib": return "sunset.fill"
        case "Isha": return "moon.stars.fill"
        default: return "clock.fill"
        }
    }
}

// MARK: - Lock Screen Widget Views

struct PrayerLockScreenCircularView: View {
    let entry: PrayerWidgetEntry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()

            if let next = entry.prayerTimes.nextPrayer {
                VStack(spacing: 1) {
                    Image(systemName: prayerIcon(for: next.name))
                        .font(.caption)

                    Text(next.time, style: .time)
                        .font(.system(size: 10))
                        .monospacedDigit()
                }
            } else {
                Image(systemName: "checkmark.seal.fill")
            }
        }
    }

    private func prayerIcon(for name: String) -> String {
        switch name {
        case "Fajr": return "sunrise.fill"
        case "Dhuhr": return "sun.max.fill"
        case "Asr": return "sun.haze.fill"
        case "Maghrib": return "sunset.fill"
        case "Isha": return "moon.stars.fill"
        default: return "clock.fill"
        }
    }
}

struct PrayerLockScreenRectangularView: View {
    let entry: PrayerWidgetEntry

    var body: some View {
        HStack(spacing: 8) {
            if let next = entry.prayerTimes.nextPrayer {
                Image(systemName: prayerIcon(for: next.name))
                    .font(.title3)

                VStack(alignment: .leading, spacing: 1) {
                    Text(next.name)
                        .font(.caption)
                        .fontWeight(.semibold)

                    Text(next.time, style: .timer)
                        .font(.caption2)
                        .monospacedDigit()
                }
            } else {
                Image(systemName: "checkmark.seal.fill")
                    .font(.title3)

                Text("All prayers complete")
                    .font(.caption)
            }

            Spacer()
        }
    }

    private func prayerIcon(for name: String) -> String {
        switch name {
        case "Fajr": return "sunrise.fill"
        case "Dhuhr": return "sun.max.fill"
        case "Asr": return "sun.haze.fill"
        case "Maghrib": return "sunset.fill"
        case "Isha": return "moon.stars.fill"
        default: return "clock.fill"
        }
    }
}

struct PrayerLockScreenInlineView: View {
    let entry: PrayerWidgetEntry

    var body: some View {
        if let next = entry.prayerTimes.nextPrayer {
            Label {
                Text("\(next.name) \(next.time, style: .time)")
            } icon: {
                Image(systemName: "moon.stars.fill")
            }
        } else {
            Label("All prayers complete", systemImage: "checkmark.seal.fill")
        }
    }
}

// MARK: - Interactive Intent for Marking Prayer

struct MarkPrayerIntent: AppIntent {
    static var title: LocalizedStringResource = "Mark Prayer Complete"
    static var description = IntentDescription("Mark a prayer as completed")

    @Parameter(title: "Prayer Name")
    var prayerName: String

    init() {
        self.prayerName = ""
    }

    init(prayerName: String) {
        self.prayerName = prayerName
    }

    func perform() async throws -> some IntentResult {
        // In production, this would update the prayer log in SwiftData
        // and trigger widget timeline refresh

        // PrayerLogService.shared.markComplete(prayerName)
        // WidgetCenter.shared.reloadTimelines(ofKind: "PrayerWidget")

        return .result()
    }
}

// MARK: - Widget Definition

struct PrayerWidget: Widget {
    let kind: String = "PrayerWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: PrayerWidgetConfigurationIntent.self,
            provider: PrayerWidgetProvider()
        ) { entry in
            PrayerWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Prayer Times")
        .description("Track your daily prayers and upcoming prayer times.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline
        ])
    }
}

struct PrayerWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: PrayerWidgetEntry

    var body: some View {
        switch family {
        case .systemSmall:
            PrayerWidgetSmallView(entry: entry)
        case .systemMedium:
            PrayerWidgetMediumView(entry: entry)
        case .systemLarge:
            PrayerWidgetLargeView(entry: entry)
        case .accessoryCircular:
            PrayerLockScreenCircularView(entry: entry)
        case .accessoryRectangular:
            PrayerLockScreenRectangularView(entry: entry)
        case .accessoryInline:
            PrayerLockScreenInlineView(entry: entry)
        default:
            PrayerWidgetSmallView(entry: entry)
        }
    }
}

// MARK: - Preview

#Preview(as: .systemMedium) {
    PrayerWidget()
} timeline: {
    PrayerWidgetEntry(
        date: Date(),
        configuration: PrayerWidgetConfigurationIntent(),
        prayerTimes: PrayerWidgetEntry.WidgetPrayerTimes(
            fajr: (Calendar.current.date(bySettingHour: 5, minute: 30, second: 0, of: Date())!, true),
            dhuhr: (Calendar.current.date(bySettingHour: 12, minute: 30, second: 0, of: Date())!, true),
            asr: (Calendar.current.date(bySettingHour: 15, minute: 45, second: 0, of: Date())!, false),
            maghrib: (Calendar.current.date(bySettingHour: 18, minute: 15, second: 0, of: Date())!, false),
            isha: (Calendar.current.date(bySettingHour: 19, minute: 45, second: 0, of: Date())!, false)
        ),
        currentStreak: 7,
        locationName: "New York"
    )
}
