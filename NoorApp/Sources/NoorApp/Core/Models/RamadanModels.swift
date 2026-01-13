// MARK: - RamadanModels.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import Foundation
import SwiftData

// MARK: - Ramadan Status

/// Current status of Ramadan observance
public struct RamadanStatus: Codable, Equatable, Sendable {
    public let isRamadan: Bool
    public let currentDay: Int? // 1-30
    public let totalDays: Int // 29 or 30
    public let startDate: Date?
    public let endDate: Date?
    public let daysRemaining: Int?
    public let nextRamadanDate: Date?
    public let isLastTenNights: Bool
    public let isOddNight: Bool // For Laylatul Qadr potential

    public init(
        isRamadan: Bool,
        currentDay: Int? = nil,
        totalDays: Int = 30,
        startDate: Date? = nil,
        endDate: Date? = nil,
        daysRemaining: Int? = nil,
        nextRamadanDate: Date? = nil,
        isLastTenNights: Bool = false,
        isOddNight: Bool = false
    ) {
        self.isRamadan = isRamadan
        self.currentDay = currentDay
        self.totalDays = totalDays
        self.startDate = startDate
        self.endDate = endDate
        self.daysRemaining = daysRemaining
        self.nextRamadanDate = nextRamadanDate
        self.isLastTenNights = isLastTenNights
        self.isOddNight = isOddNight
    }

    /// Potential Laylatul Qadr nights (21, 23, 25, 27, 29)
    public var isPotentialLaylatulQadr: Bool {
        guard let day = currentDay, isLastTenNights else { return false }
        return [21, 23, 25, 27, 29].contains(day)
    }

    /// Progress through Ramadan (0.0 - 1.0)
    public var progress: Double {
        guard let day = currentDay else { return 0 }
        return Double(day) / Double(totalDays)
    }
}

// MARK: - Fasting Timer

/// Tracks current fasting state and timers
public struct FastingTimer: Codable, Equatable, Sendable {
    public let date: Date
    public let suhoorEndTime: Date // Imsak time
    public let iftarTime: Date // Maghrib time
    public let currentState: FastingState
    public let timeUntilIftar: TimeInterval?
    public let timeUntilSuhoorEnd: TimeInterval?
    public let fastingDuration: TimeInterval
    public let elapsedFastingTime: TimeInterval?
    public let remainingFastingTime: TimeInterval?

    public init(
        date: Date,
        suhoorEndTime: Date,
        iftarTime: Date,
        currentTime: Date = Date()
    ) {
        self.date = date
        self.suhoorEndTime = suhoorEndTime
        self.iftarTime = iftarTime
        self.fastingDuration = iftarTime.timeIntervalSince(suhoorEndTime)

        // Determine current state
        if currentTime < suhoorEndTime {
            self.currentState = .suhoorTime
            self.timeUntilSuhoorEnd = suhoorEndTime.timeIntervalSince(currentTime)
            self.timeUntilIftar = iftarTime.timeIntervalSince(currentTime)
            self.elapsedFastingTime = nil
            self.remainingFastingTime = nil
        } else if currentTime < iftarTime {
            self.currentState = .fasting
            self.timeUntilSuhoorEnd = nil
            self.timeUntilIftar = iftarTime.timeIntervalSince(currentTime)
            self.elapsedFastingTime = currentTime.timeIntervalSince(suhoorEndTime)
            self.remainingFastingTime = iftarTime.timeIntervalSince(currentTime)
        } else {
            self.currentState = .iftarTime
            self.timeUntilSuhoorEnd = nil
            self.timeUntilIftar = nil
            self.elapsedFastingTime = fastingDuration
            self.remainingFastingTime = 0
        }
    }

    /// Progress through the fast (0.0 - 1.0)
    public var fastingProgress: Double {
        guard let elapsed = elapsedFastingTime else { return 0 }
        return min(1.0, elapsed / fastingDuration)
    }

    /// Formatted time until iftar
    public var formattedTimeUntilIftar: String {
        guard let time = timeUntilIftar else { return "—" }
        let hours = Int(time) / 3600
        let minutes = (Int(time) % 3600) / 60
        let seconds = Int(time) % 60
        return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
    }
}

public enum FastingState: String, Codable, Sendable {
    case suhoorTime = "Suhoor Time"
    case fasting = "Fasting"
    case iftarTime = "Iftar Time"

    public var iconName: String {
        switch self {
        case .suhoorTime: return "moon.stars.fill"
        case .fasting: return "sun.max.fill"
        case .iftarTime: return "sunset.fill"
        }
    }

    public var motivationalMessage: String {
        switch self {
        case .suhoorTime: return "Eat well and make your intention"
        case .fasting: return "May Allah accept your fast"
        case .iftarTime: return "Break your fast with dates and water"
        }
    }
}

// MARK: - Ramadan Daily Log (SwiftData Model)

/// Daily record of Ramadan activities
@Model
public final class RamadanDailyLog {
    @Attribute(.unique) public var id: UUID
    public var date: Date
    public var ramadanDay: Int // 1-30
    public var hijriYear: Int

    // Fasting
    public var fastedToday: Bool
    public var fastingStatus: String // FastingDayStatus.rawValue
    public var suhoorTime: Date?
    public var iftarTime: Date?
    public var fastingNotes: String?

    // Quran
    public var quranPagesRead: Int
    public var quranTarget: Int
    public var completedJuz: [Int] // Juz numbers completed today

    // Prayer
    public var tarawihPrayed: Bool
    public var tarawihRakahs: Int
    public var tahajjudPrayed: Bool
    public var witirPrayed: Bool

    // Charity
    public var charityAmount: Double
    public var charityDescription: String?

    // Other goals
    public var customGoalsData: Data // Encoded [CustomGoalProgress]

    // Reflection
    public var dailyReflection: String?
    public var gratitudeNotes: String?
    public var duasMade: [String]?

    public init(
        id: UUID = UUID(),
        date: Date = Date(),
        ramadanDay: Int,
        hijriYear: Int,
        fastedToday: Bool = false,
        fastingStatus: FastingDayStatus = .planned,
        suhoorTime: Date? = nil,
        iftarTime: Date? = nil,
        fastingNotes: String? = nil,
        quranPagesRead: Int = 0,
        quranTarget: Int = 20,
        completedJuz: [Int] = [],
        tarawihPrayed: Bool = false,
        tarawihRakahs: Int = 0,
        tahajjudPrayed: Bool = false,
        witirPrayed: Bool = false,
        charityAmount: Double = 0,
        charityDescription: String? = nil,
        customGoals: [CustomGoalProgress] = [],
        dailyReflection: String? = nil,
        gratitudeNotes: String? = nil,
        duasMade: [String]? = nil
    ) {
        self.id = id
        self.date = date
        self.ramadanDay = ramadanDay
        self.hijriYear = hijriYear
        self.fastedToday = fastedToday
        self.fastingStatus = fastingStatus.rawValue
        self.suhoorTime = suhoorTime
        self.iftarTime = iftarTime
        self.fastingNotes = fastingNotes
        self.quranPagesRead = quranPagesRead
        self.quranTarget = quranTarget
        self.completedJuz = completedJuz
        self.tarawihPrayed = tarawihPrayed
        self.tarawihRakahs = tarawihRakahs
        self.tahajjudPrayed = tahajjudPrayed
        self.witirPrayed = witirPrayed
        self.charityAmount = charityAmount
        self.charityDescription = charityDescription
        self.customGoalsData = (try? JSONEncoder().encode(customGoals)) ?? Data()
        self.dailyReflection = dailyReflection
        self.gratitudeNotes = gratitudeNotes
        self.duasMade = duasMade
    }

    public var customGoals: [CustomGoalProgress] {
        get {
            (try? JSONDecoder().decode([CustomGoalProgress].self, from: customGoalsData)) ?? []
        }
        set {
            customGoalsData = (try? JSONEncoder().encode(newValue)) ?? Data()
        }
    }

    public var status: FastingDayStatus? {
        FastingDayStatus(rawValue: fastingStatus)
    }

    /// Overall completion score for the day (0-100)
    public var completionScore: Int {
        var score = 0
        if fastedToday { score += 30 }
        if quranPagesRead >= quranTarget { score += 25 }
        if tarawihPrayed { score += 20 }
        if charityAmount > 0 { score += 10 }
        if tahajjudPrayed { score += 10 }
        if witirPrayed { score += 5 }
        return min(100, score)
    }
}

public enum FastingDayStatus: String, Codable, Sendable {
    case planned = "Planned"
    case completed = "Completed"
    case missed = "Missed"
    case exemptMenstruation = "Exempt (Menstruation)"
    case exemptPostpartum = "Exempt (Postpartum)"
    case exemptIllness = "Exempt (Illness)"
    case exemptTravel = "Exempt (Travel)"
    case exemptPregnancy = "Exempt (Pregnancy)"
    case exemptBreastfeeding = "Exempt (Breastfeeding)"
    case makeup = "Makeup Fast"

    public var requiresMakeup: Bool {
        switch self {
        case .missed, .exemptMenstruation, .exemptPostpartum, .exemptIllness, .exemptTravel:
            return true
        case .exemptPregnancy, .exemptBreastfeeding:
            return true // Fidyah or makeup depending on situation
        case .planned, .completed, .makeup:
            return false
        }
    }
}

// MARK: - Custom Goal Progress

/// Progress on a custom Ramadan goal
public struct CustomGoalProgress: Codable, Identifiable, Equatable, Sendable {
    public let id: UUID
    public let goalId: UUID
    public var currentValue: Int
    public let targetValue: Int
    public let date: Date

    public init(
        id: UUID = UUID(),
        goalId: UUID,
        currentValue: Int = 0,
        targetValue: Int,
        date: Date = Date()
    ) {
        self.id = id
        self.goalId = goalId
        self.currentValue = currentValue
        self.targetValue = targetValue
        self.date = date
    }

    public var progress: Double {
        guard targetValue > 0 else { return 0 }
        return Double(currentValue) / Double(targetValue)
    }

    public var isComplete: Bool {
        currentValue >= targetValue
    }
}

// MARK: - Ramadan Goal (SwiftData Model)

/// User-defined Ramadan goals
@Model
public final class RamadanGoal {
    @Attribute(.unique) public var id: UUID
    public var hijriYear: Int
    public var name: String
    public var goalDescription: String?
    public var goalType: String // RamadanGoalType.rawValue
    public var targetValue: Int
    public var currentValue: Int
    public var unit: String
    public var iconName: String
    public var color: String // Hex color
    public var isDaily: Bool // Daily target vs overall Ramadan target
    public var createdAt: Date
    public var isActive: Bool

    public init(
        id: UUID = UUID(),
        hijriYear: Int,
        name: String,
        goalDescription: String? = nil,
        goalType: RamadanGoalType,
        targetValue: Int,
        currentValue: Int = 0,
        unit: String,
        iconName: String = "star.fill",
        color: String = "#0D7377",
        isDaily: Bool = true,
        createdAt: Date = Date(),
        isActive: Bool = true
    ) {
        self.id = id
        self.hijriYear = hijriYear
        self.name = name
        self.goalDescription = goalDescription
        self.goalType = goalType.rawValue
        self.targetValue = targetValue
        self.currentValue = currentValue
        self.unit = unit
        self.iconName = iconName
        self.color = color
        self.isDaily = isDaily
        self.createdAt = createdAt
        self.isActive = isActive
    }

    public var type: RamadanGoalType? {
        RamadanGoalType(rawValue: goalType)
    }

    public var progress: Double {
        guard targetValue > 0 else { return 0 }
        return min(1.0, Double(currentValue) / Double(targetValue))
    }

    public var isComplete: Bool {
        currentValue >= targetValue
    }

    /// Creates standard Quran khatm goal (complete reading in Ramadan)
    public static func quranKhatm(hijriYear: Int) -> RamadanGoal {
        RamadanGoal(
            hijriYear: hijriYear,
            name: "Complete Quran",
            goalDescription: "Read the entire Quran during Ramadan",
            goalType: .quranPages,
            targetValue: 604,
            unit: "pages",
            iconName: "book.fill",
            color: "#0D7377",
            isDaily: false
        )
    }

    /// Creates daily Quran goal for khatm pace
    public static func dailyQuranForKhatm(hijriYear: Int) -> RamadanGoal {
        RamadanGoal(
            hijriYear: hijriYear,
            name: "Daily Quran",
            goalDescription: "Read 20 pages daily for Khatm",
            goalType: .quranPages,
            targetValue: 20,
            unit: "pages",
            iconName: "book.fill",
            color: "#0D7377",
            isDaily: true
        )
    }
}

public enum RamadanGoalType: String, Codable, Sendable {
    case quranPages = "Quran Pages"
    case quranJuz = "Quran Juz"
    case charity = "Charity"
    case tarawih = "Tarawih"
    case dhikr = "Dhikr"
    case dua = "Dua"
    case kindness = "Acts of Kindness"
    case learning = "Islamic Learning"
    case custom = "Custom"
}

// MARK: - Ramadan Statistics

/// Aggregated statistics for Ramadan
public struct RamadanStatistics: Codable, Sendable {
    public let hijriYear: Int
    public let totalDaysFasted: Int
    public let totalDaysMissed: Int
    public let makeupDaysRequired: Int
    public let totalQuranPagesRead: Int
    public let khatmCompleted: Int
    public let totalTarawihPrayed: Int
    public let totalTahajjudPrayed: Int
    public let totalCharityGiven: Double
    public let averageDailyScore: Double
    public let currentStreak: Int
    public let longestStreak: Int
    public let goalsCompleted: Int
    public let totalGoals: Int

    public init(
        hijriYear: Int,
        totalDaysFasted: Int = 0,
        totalDaysMissed: Int = 0,
        makeupDaysRequired: Int = 0,
        totalQuranPagesRead: Int = 0,
        khatmCompleted: Int = 0,
        totalTarawihPrayed: Int = 0,
        totalTahajjudPrayed: Int = 0,
        totalCharityGiven: Double = 0,
        averageDailyScore: Double = 0,
        currentStreak: Int = 0,
        longestStreak: Int = 0,
        goalsCompleted: Int = 0,
        totalGoals: Int = 0
    ) {
        self.hijriYear = hijriYear
        self.totalDaysFasted = totalDaysFasted
        self.totalDaysMissed = totalDaysMissed
        self.makeupDaysRequired = makeupDaysRequired
        self.totalQuranPagesRead = totalQuranPagesRead
        self.khatmCompleted = khatmCompleted
        self.totalTarawihPrayed = totalTarawihPrayed
        self.totalTahajjudPrayed = totalTahajjudPrayed
        self.totalCharityGiven = totalCharityGiven
        self.averageDailyScore = averageDailyScore
        self.currentStreak = currentStreak
        self.longestStreak = longestStreak
        self.goalsCompleted = goalsCompleted
        self.totalGoals = totalGoals
    }

    /// Completion percentage (fasted days / total days)
    public var fastingCompletion: Double {
        let total = totalDaysFasted + totalDaysMissed
        guard total > 0 else { return 0 }
        return Double(totalDaysFasted) / Double(total) * 100
    }

    /// Progress towards Quran khatm (0-100%)
    public var quranProgress: Double {
        min(100, Double(totalQuranPagesRead) / 604.0 * 100)
    }
}

// MARK: - Ramadan Theme

/// Daily theme for Ramadan display
public struct RamadanDailyTheme: Codable, Identifiable, Equatable, Sendable {
    public let id: Int // Day number
    public let day: Int
    public let themeName: String
    public let themeNameArabic: String
    public let primaryColor: String // Hex
    public let secondaryColor: String // Hex
    public let gradientColors: [String] // Hex array
    public let backgroundPattern: String?
    public let dailyHadith: String
    public let dailyHadithSource: String
    public let specialNight: SpecialNight?
    public let motivationalMessage: String

    public var isLastTenNights: Bool {
        day >= 21
    }

    public var isOddNight: Bool {
        day % 2 == 1
    }
}

public enum SpecialNight: String, Codable, Sendable {
    case night21 = "21st Night"
    case night23 = "23rd Night"
    case night25 = "25th Night"
    case night27 = "27th Night - Most Likely Laylatul Qadr"
    case night29 = "29th Night"
    case eidEve = "Eve of Eid"

    public var isPotentialLaylatulQadr: Bool {
        switch self {
        case .night21, .night23, .night25, .night27, .night29:
            return true
        case .eidEve:
            return false
        }
    }
}

// MARK: - Tarawih Log (SwiftData Model)

/// Record of Tarawih prayer attendance
@Model
public final class TarawihLog {
    @Attribute(.unique) public var id: UUID
    public var date: Date
    public var ramadanDay: Int
    public var hijriYear: Int
    public var rakahsPrayed: Int // Usually 8 or 20
    public var prayedAtMosque: Bool
    public var mosqueName: String?
    public var juzCompleted: [Int] // Which juz were recited
    public var imamName: String?
    public var notes: String?
    public var startTime: Date?
    public var endTime: Date?

    public init(
        id: UUID = UUID(),
        date: Date = Date(),
        ramadanDay: Int,
        hijriYear: Int,
        rakahsPrayed: Int = 8,
        prayedAtMosque: Bool = false,
        mosqueName: String? = nil,
        juzCompleted: [Int] = [],
        imamName: String? = nil,
        notes: String? = nil,
        startTime: Date? = nil,
        endTime: Date? = nil
    ) {
        self.id = id
        self.date = date
        self.ramadanDay = ramadanDay
        self.hijriYear = hijriYear
        self.rakahsPrayed = rakahsPrayed
        self.prayedAtMosque = prayedAtMosque
        self.mosqueName = mosqueName
        self.juzCompleted = juzCompleted
        self.imamName = imamName
        self.notes = notes
        self.startTime = startTime
        self.endTime = endTime
    }

    public var duration: TimeInterval? {
        guard let start = startTime, let end = endTime else { return nil }
        return end.timeIntervalSince(start)
    }
}

// MARK: - Zakat Calculator

/// Zakat calculation helper
public struct ZakatCalculation: Codable, Sendable {
    public let nisabGold: Double // Current gold nisab value
    public let nisabSilver: Double // Current silver nisab value
    public let totalWealth: Double
    public let zakatableAmount: Double
    public let zakatDue: Double // 2.5% of zakatable amount
    public let calculationDate: Date
    public let currency: String

    public init(
        nisabGold: Double,
        nisabSilver: Double,
        totalWealth: Double,
        zakatableAmount: Double,
        calculationDate: Date = Date(),
        currency: String = "USD"
    ) {
        self.nisabGold = nisabGold
        self.nisabSilver = nisabSilver
        self.totalWealth = totalWealth
        self.zakatableAmount = zakatableAmount
        self.zakatDue = zakatableAmount * 0.025 // 2.5%
        self.calculationDate = calculationDate
        self.currency = currency
    }

    public var meetsNisab: Bool {
        zakatableAmount >= nisabSilver // Using silver nisab (more inclusive)
    }

    /// Formatted zakat amount with currency
    public var formattedZakatDue: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: zakatDue)) ?? "\(currency) \(zakatDue)"
    }
}
