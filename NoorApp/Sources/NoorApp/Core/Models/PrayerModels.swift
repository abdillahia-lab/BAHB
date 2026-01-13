// MARK: - PrayerModels.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import Foundation
import SwiftData
import CoreLocation

// MARK: - Prayer Type Enumeration

/// Represents the five daily obligatory prayers in Islam
public enum PrayerType: String, Codable, CaseIterable, Identifiable, Sendable {
    case fajr = "Fajr"
    case dhuhr = "Dhuhr"
    case asr = "Asr"
    case maghrib = "Maghrib"
    case isha = "Isha"

    public var id: String { rawValue }

    /// Arabic name of the prayer
    public var arabicName: String {
        switch self {
        case .fajr: return "الفجر"
        case .dhuhr: return "الظهر"
        case .asr: return "العصر"
        case .maghrib: return "المغرب"
        case .isha: return "العشاء"
        }
    }

    /// Number of required rak'ahs for each prayer
    public var requiredRakah: Int {
        switch self {
        case .fajr: return 2
        case .dhuhr: return 4
        case .asr: return 4
        case .maghrib: return 3
        case .isha: return 4
        }
    }

    /// Sunnah prayers associated with each obligatory prayer
    public var sunnahRakah: (before: Int, after: Int) {
        switch self {
        case .fajr: return (2, 0)
        case .dhuhr: return (4, 2)
        case .asr: return (0, 0)
        case .maghrib: return (0, 2)
        case .isha: return (0, 2)
        }
    }

    /// SF Symbol icon name for the prayer
    public var iconName: String {
        switch self {
        case .fajr: return "sunrise.fill"
        case .dhuhr: return "sun.max.fill"
        case .asr: return "sun.haze.fill"
        case .maghrib: return "sunset.fill"
        case .isha: return "moon.stars.fill"
        }
    }

    /// Display order (chronological)
    public var order: Int {
        switch self {
        case .fajr: return 0
        case .dhuhr: return 1
        case .asr: return 2
        case .maghrib: return 3
        case .isha: return 4
        }
    }

    /// Returns the next prayer in sequence
    public var next: PrayerType {
        switch self {
        case .fajr: return .dhuhr
        case .dhuhr: return .asr
        case .asr: return .maghrib
        case .maghrib: return .isha
        case .isha: return .fajr
        }
    }
}

// MARK: - Prayer Status

/// Status of a prayer for tracking purposes
public enum PrayerStatus: String, Codable, Sendable {
    case pending = "Pending"
    case completed = "Completed"
    case missed = "Missed"
    case qada = "Qada" // Makeup prayer

    public var iconName: String {
        switch self {
        case .pending: return "circle"
        case .completed: return "checkmark.circle.fill"
        case .missed: return "xmark.circle"
        case .qada: return "arrow.counterclockwise.circle"
        }
    }
}

// MARK: - Calculation Method

/// Islamic prayer time calculation methods used by major organizations
public enum CalculationMethod: String, Codable, CaseIterable, Identifiable, Sendable {
    case muslimWorldLeague = "Muslim World League"
    case isna = "Islamic Society of North America"
    case egypt = "Egyptian General Authority of Survey"
    case makkah = "Umm Al-Qura University, Makkah"
    case karachi = "University of Islamic Sciences, Karachi"
    case tehran = "Institute of Geophysics, Tehran"
    case jafari = "Shia Ithna-Ashari, Leva Institute, Qum"
    case singapore = "Singapore/Malaysia/Indonesia"
    case france = "Union of Islamic Organisations of France"
    case turkey = "Diyanet İşleri Başkanlığı, Turkey"
    case russia = "Spiritual Administration of Muslims of Russia"
    case dubai = "Gulf Region"
    case custom = "Custom"

    public var id: String { rawValue }

    /// Fajr angle (degrees below horizon)
    public var fajrAngle: Double {
        switch self {
        case .muslimWorldLeague: return 18.0
        case .isna: return 15.0
        case .egypt: return 19.5
        case .makkah: return 18.5
        case .karachi: return 18.0
        case .tehran: return 17.7
        case .jafari: return 16.0
        case .singapore: return 20.0
        case .france: return 12.0
        case .turkey: return 18.0
        case .russia: return 16.0
        case .dubai: return 18.2
        case .custom: return 18.0
        }
    }

    /// Isha angle (degrees below horizon) or minutes after Maghrib
    public var ishaParameter: (angle: Double?, minutesAfterMaghrib: Int?) {
        switch self {
        case .muslimWorldLeague: return (17.0, nil)
        case .isna: return (15.0, nil)
        case .egypt: return (17.5, nil)
        case .makkah: return (nil, 90) // 90 minutes after Maghrib
        case .karachi: return (18.0, nil)
        case .tehran: return (14.0, nil)
        case .jafari: return (14.0, nil)
        case .singapore: return (18.0, nil)
        case .france: return (12.0, nil)
        case .turkey: return (17.0, nil)
        case .russia: return (15.0, nil)
        case .dubai: return (18.2, nil)
        case .custom: return (17.0, nil)
        }
    }
}

// MARK: - Asr Calculation Juristic Method

/// Juristic method for calculating Asr prayer time
public enum AsrJuristicMethod: String, Codable, CaseIterable, Sendable {
    case shafii = "Shafi'i, Maliki, Hanbali" // Shadow = object height + noon shadow
    case hanafi = "Hanafi" // Shadow = 2x object height + noon shadow

    /// Shadow length factor for calculation
    public var shadowFactor: Double {
        switch self {
        case .shafii: return 1.0
        case .hanafi: return 2.0
        }
    }
}

// MARK: - High Latitude Method

/// Methods for calculating prayer times at high latitudes (>48°)
public enum HighLatitudeMethod: String, Codable, CaseIterable, Sendable {
    case none = "None (Standard)"
    case nightMiddle = "Middle of the Night"
    case oneSeventh = "One Seventh of the Night"
    case angleBased = "Angle Based"

    public var description: String {
        switch self {
        case .none: return "Standard calculation"
        case .nightMiddle: return "Fajr/Isha at middle of night"
        case .oneSeventh: return "Fajr/Isha at 1/7 of night"
        case .angleBased: return "Based on angle proportion"
        }
    }
}

// MARK: - Prayer Time Model

/// Represents prayer times for a specific date and location
public struct PrayerTimes: Codable, Equatable, Sendable {
    public let date: Date
    public let location: PrayerLocation
    public let calculationMethod: CalculationMethod
    public let asrMethod: AsrJuristicMethod

    public let fajr: Date
    public let sunrise: Date
    public let dhuhr: Date
    public let asr: Date
    public let maghrib: Date
    public let isha: Date

    // Additional useful times
    public let midnight: Date
    public let lastThirdOfNight: Date
    public let imsak: Date // Time to stop eating for fasting (usually 10 min before Fajr)

    /// Returns prayer time for a specific prayer type
    public func time(for prayer: PrayerType) -> Date {
        switch prayer {
        case .fajr: return fajr
        case .dhuhr: return dhuhr
        case .asr: return asr
        case .maghrib: return maghrib
        case .isha: return isha
        }
    }

    /// Returns all prayers as an array sorted by time
    public var allPrayers: [(type: PrayerType, time: Date)] {
        PrayerType.allCases.map { ($0, time(for: $0)) }
            .sorted { $0.time < $1.time }
    }

    /// Returns the current or next prayer based on current time
    public func currentOrNextPrayer(at currentTime: Date = Date()) -> (type: PrayerType, time: Date, isOngoing: Bool)? {
        let prayers = allPrayers

        // Find the current prayer window or next prayer
        for i in 0..<prayers.count {
            let current = prayers[i]
            let nextIndex = (i + 1) % prayers.count
            let next = prayers[nextIndex]

            // Handle day boundary (Isha to Fajr)
            if i == prayers.count - 1 {
                if currentTime >= current.time {
                    // After Isha, next is Fajr tomorrow
                    return (current.type, current.time, true)
                }
            } else {
                if currentTime >= current.time && currentTime < next.time {
                    return (current.type, current.time, true)
                }
            }
        }

        // Before Fajr
        if currentTime < prayers[0].time {
            return (prayers[0].type, prayers[0].time, false)
        }

        return nil
    }

    /// Returns the next prayer after the current time
    public func nextPrayer(after currentTime: Date = Date()) -> (type: PrayerType, time: Date)? {
        for prayer in allPrayers {
            if prayer.time > currentTime {
                return prayer
            }
        }
        // If after Isha, next is Fajr (tomorrow's times needed)
        return nil
    }

    /// Time remaining until the next prayer
    public func timeUntilNextPrayer(from currentTime: Date = Date()) -> TimeInterval? {
        guard let next = nextPrayer(after: currentTime) else { return nil }
        return next.time.timeIntervalSince(currentTime)
    }
}

// MARK: - Prayer Location

/// Location data for prayer time calculations
public struct PrayerLocation: Codable, Equatable, Sendable {
    public let latitude: Double
    public let longitude: Double
    public let altitude: Double
    public let timezone: TimeZone
    public let locationName: String?

    public init(
        latitude: Double,
        longitude: Double,
        altitude: Double = 0,
        timezone: TimeZone = .current,
        locationName: String? = nil
    ) {
        self.latitude = latitude
        self.longitude = longitude
        self.altitude = altitude
        self.timezone = timezone
        self.locationName = locationName
    }

    public init(coordinate: CLLocationCoordinate2D, altitude: Double = 0, timezone: TimeZone = .current, locationName: String? = nil) {
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
        self.altitude = altitude
        self.timezone = timezone
        self.locationName = locationName
    }

    public var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

// MARK: - Prayer Log (SwiftData Model)

/// Persistent record of prayer completion
@Model
public final class PrayerLog {
    @Attribute(.unique) public var id: UUID
    public var prayerType: String // PrayerType.rawValue
    public var date: Date
    public var scheduledTime: Date
    public var completedAt: Date?
    public var status: String // PrayerStatus.rawValue
    public var latitude: Double?
    public var longitude: Double?
    public var notes: String?
    public var isJamaa: Bool // Prayed in congregation
    public var mosqueName: String?

    public init(
        id: UUID = UUID(),
        prayerType: PrayerType,
        date: Date,
        scheduledTime: Date,
        completedAt: Date? = nil,
        status: PrayerStatus = .pending,
        latitude: Double? = nil,
        longitude: Double? = nil,
        notes: String? = nil,
        isJamaa: Bool = false,
        mosqueName: String? = nil
    ) {
        self.id = id
        self.prayerType = prayerType.rawValue
        self.date = date
        self.scheduledTime = scheduledTime
        self.completedAt = completedAt
        self.status = status.rawValue
        self.latitude = latitude
        self.longitude = longitude
        self.notes = notes
        self.isJamaa = isJamaa
        self.mosqueName = mosqueName
    }

    public var prayer: PrayerType? {
        PrayerType(rawValue: prayerType)
    }

    public var prayerStatus: PrayerStatus? {
        PrayerStatus(rawValue: status)
    }
}

// MARK: - Qibla Direction

/// Qibla direction information
public struct QiblaDirection: Codable, Sendable {
    public let bearing: Double // Degrees from true north (0-360)
    public let distance: Double // Distance to Ka'bah in kilometers
    public let kaabahCoordinate: CLLocationCoordinate2D

    public static let kaabahLocation = CLLocationCoordinate2D(
        latitude: 21.4225,
        longitude: 39.8262
    )

    public init(bearing: Double, distance: Double) {
        self.bearing = bearing
        self.distance = distance
        self.kaabahCoordinate = Self.kaabahLocation
    }

    /// Compass direction description (N, NE, E, etc.)
    public var compassDirection: String {
        let directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                         "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        let index = Int((bearing + 11.25).truncatingRemainder(dividingBy: 360) / 22.5)
        return directions[index]
    }

    /// Formatted distance string
    public var formattedDistance: String {
        if distance >= 1000 {
            return String(format: "%.0f km", distance)
        } else {
            return String(format: "%.0f m", distance * 1000)
        }
    }
}

// MARK: - Prayer Settings

/// User preferences for prayer features
public struct PrayerSettings: Codable, Sendable {
    public var calculationMethod: CalculationMethod
    public var asrMethod: AsrJuristicMethod
    public var highLatitudeMethod: HighLatitudeMethod
    public var manualAdjustments: [PrayerType: Int] // Minutes adjustment

    // Notification settings
    public var notificationsEnabled: Bool
    public var adhanEnabled: Bool
    public var selectedAdhan: String
    public var preNotificationMinutes: Int // Minutes before prayer
    public var vibrationOnly: Bool

    // Display settings
    public var use24HourFormat: Bool
    public var showSeconds: Bool
    public var showSunrise: Bool
    public var showMidnight: Bool

    public static let `default` = PrayerSettings(
        calculationMethod: .isna,
        asrMethod: .shafii,
        highLatitudeMethod: .angleBased,
        manualAdjustments: [:],
        notificationsEnabled: true,
        adhanEnabled: true,
        selectedAdhan: "makkah_default",
        preNotificationMinutes: 15,
        vibrationOnly: false,
        use24HourFormat: false,
        showSeconds: false,
        showSunrise: true,
        showMidnight: false
    )
}

// MARK: - Prayer Streak

/// Tracks prayer completion streaks
@Model
public final class PrayerStreak {
    @Attribute(.unique) public var id: UUID
    public var prayerType: String // PrayerType.rawValue or "all" for overall
    public var currentStreak: Int
    public var longestStreak: Int
    public var lastCompletedDate: Date?
    public var totalCompleted: Int
    public var totalMissed: Int
    public var streakStartDate: Date?

    public init(
        id: UUID = UUID(),
        prayerType: String,
        currentStreak: Int = 0,
        longestStreak: Int = 0,
        lastCompletedDate: Date? = nil,
        totalCompleted: Int = 0,
        totalMissed: Int = 0,
        streakStartDate: Date? = nil
    ) {
        self.id = id
        self.prayerType = prayerType
        self.currentStreak = currentStreak
        self.longestStreak = longestStreak
        self.lastCompletedDate = lastCompletedDate
        self.totalCompleted = totalCompleted
        self.totalMissed = totalMissed
        self.streakStartDate = streakStartDate
    }

    /// Completion percentage
    public var completionPercentage: Double {
        let total = totalCompleted + totalMissed
        guard total > 0 else { return 0 }
        return Double(totalCompleted) / Double(total) * 100
    }
}
