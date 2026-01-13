// MARK: - AppConfiguration.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import Foundation

// MARK: - App Configuration

/// Central configuration for the Noor app
public enum AppConfiguration {

    // MARK: - App Info

    public static let appName = "Noor"
    public static let appNameArabic = "نور"
    public static let appTagline = "Your Daily Spiritual Companion"
    public static let appVersion = "1.0.0"
    public static let buildNumber = "1"

    // MARK: - Feature Flags

    public struct FeatureFlags {
        public static var isAICloudEnabled = true
        public static var isAIOnDeviceEnabled = true
        public static var isPremiumFeaturesEnabled = true
        public static var isRamadanModeEnabled = true
        public static var isAnalyticsEnabled = true
        public static var isVisionProEnabled = true
        public static var isWomensSecctionEnabled = true
        public static var isDebugModeEnabled: Bool {
            #if DEBUG
            return true
            #else
            return false
            #endif
        }
    }

    // MARK: - API Endpoints

    public struct API {
        public static let baseURL = "https://api.noorapp.com/v1"
        public static let aiEndpoint = "\(baseURL)/ai"
        public static let contentEndpoint = "\(baseURL)/content"
        public static let prayerTimesEndpoint = "\(baseURL)/prayer-times"
        public static let authEndpoint = "\(baseURL)/auth"
        public static let analyticsEndpoint = "\(baseURL)/analytics"

        // Third-party APIs
        public static let islamicFinderAPI = "https://api.islamicfinder.org"
        public static let quranAPIEndpoint = "https://api.quran.com/v4"
        public static let hadithAPIEndpoint = "https://api.sunnah.com/v1"
    }

    // MARK: - App Group

    public static let appGroupIdentifier = "group.com.noorapp.app"
    public static let keychainServiceName = "com.noorapp.keychain"

    // MARK: - AI Configuration

    public struct AI {
        // On-device model
        public static let localModelName = "NoorLocal3B"
        public static let localModelVersion = "1.0.0"
        public static let localModelSizeBytes: Int64 = 1_500_000_000 // 1.5GB

        // Context limits
        public static let maxContextTokens = 4096
        public static let maxResponseTokens = 1024

        // Rate limits
        public static let freeUserDailyQueries = 5
        public static let premiumUserDailyQueries = Int.max

        // Temperature settings
        public static let defaultTemperature: Float = 0.7
        public static let creativeTemperature: Float = 0.9
        public static let preciseTemperature: Float = 0.3
    }

    // MARK: - Subscription Configuration

    public struct Subscription {
        public static let monthlyProductId = "com.noorapp.premium.monthly"
        public static let yearlyProductId = "com.noorapp.premium.yearly"
        public static let familyMonthlyProductId = "com.noorapp.family.monthly"
        public static let lifetimeProductId = "com.noorapp.lifetime"

        public static let monthlyPrice = "$4.99"
        public static let yearlyPrice = "$39.99"
        public static let familyPrice = "$9.99"
        public static let lifetimePrice = "$149.99"

        // Trial
        public static let trialDurationDays = 7
    }

    // MARK: - Notification Configuration

    public struct Notifications {
        // Category identifiers
        public static let prayerTimeCategory = "PRAYER_TIME"
        public static let adhanCategory = "ADHAN"
        public static let quranReminderCategory = "QURAN_REMINDER"
        public static let streakRiskCategory = "STREAK_RISK"
        public static let ramadanCategory = "RAMADAN"
        public static let dailyReflectionCategory = "DAILY_REFLECTION"

        // Action identifiers
        public static let markCompleteAction = "MARK_COMPLETE"
        public static let snoozeAction = "SNOOZE"
        public static let openAppAction = "OPEN_APP"
        public static let showQiblaAction = "SHOW_QIBLA"
    }

    // MARK: - Content Configuration

    public struct Content {
        // Quran
        public static let totalSurahs = 114
        public static let totalAyahs = 6236
        public static let totalPages = 604 // Medina Mushaf
        public static let totalJuz = 30

        // Default content
        public static let defaultTranslationId = "sahih_international"
        public static let defaultTafsirId = "ibn_kathir"
        public static let defaultReciterId = "mishary_rashid_murattal"

        // Cache settings
        public static let audioCacheMaxSize: Int64 = 2_000_000_000 // 2GB
        public static let contentCacheMaxAge: TimeInterval = 86400 * 7 // 7 days
    }

    // MARK: - Prayer Configuration

    public struct Prayer {
        // Default settings
        public static let defaultCalculationMethod = CalculationMethod.isna
        public static let defaultAsrMethod = AsrJuristicMethod.shafii
        public static let defaultHighLatitudeMethod = HighLatitudeMethod.angleBased

        // Notification timing
        public static let preNotificationMinutes = 15
        public static let liveActivityStartMinutes = 30
        public static let liveActivityEndMinutes = 30

        // High latitude threshold
        public static let highLatitudeThreshold = 48.0
    }

    // MARK: - Streak Configuration

    public struct Streaks {
        // Grace periods
        public static let quranStreakGraceHours = 2
        public static let prayerStreakGraceMinutes = 30

        // Milestones
        public static let milestones = [7, 14, 30, 60, 90, 100, 180, 365]

        // Freezes (premium)
        public static let monthlyFreezesAllowed = 3
    }

    // MARK: - Haptics Configuration

    public struct Haptics {
        // Pattern names
        public static let prayerComplete = "prayer_complete"
        public static let streakMilestone = "streak_milestone"
        public static let dhikrCount = "dhikr_count"
        public static let iftarArrival = "iftar_arrival"
        public static let adhanAlert = "adhan_alert"
        public static let error = "error"
    }

    // MARK: - Widget Configuration

    public struct Widgets {
        public static let prayerWidgetKind = "PrayerWidget"
        public static let quranWidgetKind = "QuranWidget"
        public static let ramadanWidgetKind = "RamadanWidget"
        public static let dhikrWidgetKind = "DhikrWidget"
        public static let streakWidgetKind = "StreakWidget"

        // Refresh intervals
        public static let minRefreshInterval: TimeInterval = 60 // 1 minute minimum
        public static let defaultRefreshInterval: TimeInterval = 300 // 5 minutes
    }

    // MARK: - Privacy & Security

    public struct Security {
        // Encryption
        public static let journalEncryptionAlgorithm = "AES-256-GCM"

        // Data retention
        public static let analyticsRetentionDays = 90
        public static let conversationHistoryDays = 365

        // Privacy
        public static let anonymizeCloudRequests = true
        public static let localProcessingPreferred = true
    }

    // MARK: - Deep Links

    public struct DeepLinks {
        public static let scheme = "noor"
        public static let quranPath = "/quran"
        public static let prayerPath = "/prayer"
        public static let aiChatPath = "/ai"
        public static let ramadanPath = "/ramadan"
        public static let settingsPath = "/settings"
        public static let qiblaPath = "/qibla"

        public static func quranReference(_ surah: Int, _ ayah: Int) -> URL? {
            URL(string: "\(scheme)://\(quranPath)/\(surah)/\(ayah)")
        }

        public static func hadithReference(_ collection: String, _ number: Int) -> URL? {
            URL(string: "\(scheme)://hadith/\(collection)/\(number)")
        }
    }

    // MARK: - External Links

    public struct ExternalLinks {
        public static let privacyPolicy = URL(string: "https://noorapp.com/privacy")!
        public static let termsOfService = URL(string: "https://noorapp.com/terms")!
        public static let supportEmail = "support@noorapp.com"
        public static let feedbackForm = URL(string: "https://noorapp.com/feedback")!
        public static let scholarAdvisoryInfo = URL(string: "https://noorapp.com/scholars")!

        // Social
        public static let instagram = URL(string: "https://instagram.com/noorapp")!
        public static let twitter = URL(string: "https://twitter.com/noorapp")!
    }

    // MARK: - Development & Debug

    public struct Debug {
        public static let enableLogging = true
        public static let logLevel: LogLevel = .info
        public static let mockPrayerTimes = false
        public static let mockAIResponses = false
        public static let forceRamadanMode = false
        public static let skipOnboarding = false

        public enum LogLevel: Int {
            case verbose = 0
            case debug = 1
            case info = 2
            case warning = 3
            case error = 4
        }
    }
}

// MARK: - Environment-Specific Configuration

public extension AppConfiguration {
    static var environment: Environment {
        #if DEBUG
        return .development
        #elseif STAGING
        return .staging
        #else
        return .production
        #endif
    }

    enum Environment {
        case development
        case staging
        case production

        var baseURL: String {
            switch self {
            case .development:
                return "https://dev-api.noorapp.com/v1"
            case .staging:
                return "https://staging-api.noorapp.com/v1"
            case .production:
                return "https://api.noorapp.com/v1"
            }
        }

        var analyticsEnabled: Bool {
            switch self {
            case .development: return false
            case .staging: return true
            case .production: return true
            }
        }
    }
}
