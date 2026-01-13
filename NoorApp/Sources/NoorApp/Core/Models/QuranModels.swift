// MARK: - QuranModels.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import Foundation
import SwiftData

// MARK: - Surah

/// Represents a chapter (Surah) of the Quran
public struct Surah: Codable, Identifiable, Equatable, Sendable {
    public let id: Int // 1-114
    public let nameArabic: String
    public let nameEnglish: String
    public let nameTransliteration: String
    public let revelationType: RevelationType
    public let numberOfAyahs: Int
    public let juzStart: Int // Starting Juz
    public let pageStart: Int // Starting page (Medina Mushaf)
    public let rukuCount: Int // Number of Ruku sections

    /// Order of revelation (chronological)
    public let revelationOrder: Int

    public var displayName: String {
        "Surah \(nameTransliteration)"
    }

    public var formattedNumber: String {
        String(format: "%03d", id)
    }
}

/// Where the Surah was revealed
public enum RevelationType: String, Codable, Sendable {
    case meccan = "Meccan"
    case medinan = "Medinan"

    public var arabicName: String {
        switch self {
        case .meccan: return "مكية"
        case .medinan: return "مدنية"
        }
    }
}

// MARK: - Ayah

/// Represents a verse (Ayah) of the Quran
public struct Ayah: Codable, Identifiable, Equatable, Sendable {
    public let surahNumber: Int
    public let ayahNumber: Int
    public let textArabic: String
    public let textUthmani: String // With Uthmani script diacritics
    public let juz: Int
    public let hizb: Int
    public let page: Int // Medina Mushaf page
    public let sajdah: SajdahType?

    public var id: String {
        "\(surahNumber):\(ayahNumber)"
    }

    /// Reference format (e.g., "2:255" for Ayatul Kursi)
    public var reference: String {
        "\(surahNumber):\(ayahNumber)"
    }
}

/// Type of Sajdah (prostration) if applicable
public enum SajdahType: String, Codable, Sendable {
    case obligatory = "Obligatory"
    case recommended = "Recommended"
}

// MARK: - Translation

/// Translation of Quranic text
public struct Translation: Codable, Identifiable, Equatable, Sendable {
    public let id: String
    public let translatorName: String
    public let language: String
    public let languageCode: String
    public let direction: TextDirection
    public let isPremium: Bool

    public static let saheeInternational = Translation(
        id: "sahih_international",
        translatorName: "Saheeh International",
        language: "English",
        languageCode: "en",
        direction: .leftToRight,
        isPremium: false
    )

    public static let clearQuran = Translation(
        id: "clear_quran",
        translatorName: "Dr. Mustafa Khattab",
        language: "English",
        languageCode: "en",
        direction: .leftToRight,
        isPremium: false
    )
}

public enum TextDirection: String, Codable, Sendable {
    case leftToRight = "ltr"
    case rightToLeft = "rtl"
}

// MARK: - Ayah Translation

/// Translation for a specific ayah
public struct AyahTranslation: Codable, Identifiable, Equatable, Sendable {
    public let ayahReference: String // "surah:ayah"
    public let translationId: String
    public let text: String

    public var id: String {
        "\(ayahReference)_\(translationId)"
    }
}

// MARK: - Tafsir (Exegesis)

/// Tafsir source information
public struct TafsirSource: Codable, Identifiable, Equatable, Sendable {
    public let id: String
    public let name: String
    public let nameArabic: String
    public let author: String
    public let authorArabic: String?
    public let language: String
    public let languageCode: String
    public let description: String
    public let isPremium: Bool

    public static let ibnKathir = TafsirSource(
        id: "ibn_kathir",
        name: "Tafsir Ibn Kathir",
        nameArabic: "تفسير ابن كثير",
        author: "Ibn Kathir",
        authorArabic: "ابن كثير",
        language: "English",
        languageCode: "en",
        description: "Classical tafsir known for hadith-based approach",
        isPremium: false
    )

    public static let saadi = TafsirSource(
        id: "saadi",
        name: "Tafsir As-Sa'di",
        nameArabic: "تيسير الكريم الرحمن",
        author: "Abdur Rahman As-Sa'di",
        authorArabic: "عبد الرحمن السعدي",
        language: "English",
        languageCode: "en",
        description: "Concise and accessible modern tafsir",
        isPremium: false
    )
}

/// Tafsir content for a specific ayah
public struct TafsirContent: Codable, Identifiable, Equatable, Sendable {
    public let ayahReference: String
    public let tafsirSourceId: String
    public let text: String

    public var id: String {
        "\(ayahReference)_\(tafsirSourceId)"
    }
}

// MARK: - Reciter

/// Quran reciter information
public struct Reciter: Codable, Identifiable, Equatable, Sendable {
    public let id: String
    public let nameEnglish: String
    public let nameArabic: String
    public let style: RecitationStyle
    public let bitrate: Int // kbps
    public let format: AudioFormat
    public let isPremium: Bool
    public let country: String?

    public var displayName: String {
        "\(nameEnglish) (\(style.rawValue))"
    }

    public static let misharyRashid = Reciter(
        id: "mishary_rashid_murattal",
        nameEnglish: "Mishary Rashid Alafasy",
        nameArabic: "مشاري راشد العفاسي",
        style: .murattal,
        bitrate: 128,
        format: .mp3,
        isPremium: false,
        country: "Kuwait"
    )

    public static let abdulBasit = Reciter(
        id: "abdul_basit_mujawwad",
        nameEnglish: "Abdul Basit Abdul Samad",
        nameArabic: "عبد الباسط عبد الصمد",
        style: .mujawwad,
        bitrate: 192,
        format: .mp3,
        isPremium: false,
        country: "Egypt"
    )
}

public enum RecitationStyle: String, Codable, Sendable {
    case murattal = "Murattal" // Slow, measured recitation for study
    case mujawwad = "Mujawwad" // Melodious, beautified recitation
    case muallim = "Muallim" // Teaching style with pauses
}

public enum AudioFormat: String, Codable, Sendable {
    case mp3 = "mp3"
    case aac = "aac"
    case alac = "alac" // Lossless for premium
}

// MARK: - Juz (Part)

/// Represents one of the 30 parts of the Quran
public struct Juz: Codable, Identifiable, Equatable, Sendable {
    public let id: Int // 1-30
    public let startSurah: Int
    public let startAyah: Int
    public let endSurah: Int
    public let endAyah: Int
    public let startPage: Int
    public let endPage: Int

    public var reference: String {
        "Juz \(id)"
    }

    public var pageCount: Int {
        endPage - startPage + 1
    }
}

// MARK: - Hizb (Half-Juz)

/// Represents a Hizb (half of a Juz) - 60 total
public struct Hizb: Codable, Identifiable, Equatable, Sendable {
    public let id: Int // 1-60
    public let juz: Int
    public let quarter: Int // 1-4 within each Hizb
    public let startSurah: Int
    public let startAyah: Int

    public var reference: String {
        "Hizb \(id)"
    }
}

// MARK: - Quran Position

/// Current reading position in the Quran
public struct QuranPosition: Codable, Equatable, Sendable {
    public let surah: Int
    public let ayah: Int
    public let page: Int
    public let juz: Int
    public let scrollOffset: Double? // For precise scroll position

    public init(surah: Int, ayah: Int, page: Int, juz: Int, scrollOffset: Double? = nil) {
        self.surah = surah
        self.ayah = ayah
        self.page = page
        self.juz = juz
        self.scrollOffset = scrollOffset
    }

    public var reference: String {
        "\(surah):\(ayah)"
    }

    public static let beginning = QuranPosition(surah: 1, ayah: 1, page: 1, juz: 1)
}

// MARK: - Quran Progress (SwiftData Model)

/// Persistent record of Quran reading progress
@Model
public final class QuranProgress {
    @Attribute(.unique) public var id: UUID
    public var surah: Int
    public var ayah: Int
    public var page: Int
    public var juz: Int
    public var timestamp: Date
    public var durationSeconds: Int // Time spent on this session
    public var audioListened: Bool
    public var reciterId: String?

    public init(
        id: UUID = UUID(),
        surah: Int,
        ayah: Int,
        page: Int,
        juz: Int,
        timestamp: Date = Date(),
        durationSeconds: Int = 0,
        audioListened: Bool = false,
        reciterId: String? = nil
    ) {
        self.id = id
        self.surah = surah
        self.ayah = ayah
        self.page = page
        self.juz = juz
        self.timestamp = timestamp
        self.durationSeconds = durationSeconds
        self.audioListened = audioListened
        self.reciterId = reciterId
    }

    public var position: QuranPosition {
        QuranPosition(surah: surah, ayah: ayah, page: page, juz: juz)
    }

    public var reference: String {
        "\(surah):\(ayah)"
    }
}

// MARK: - Quran Bookmark

/// User bookmark in the Quran
@Model
public final class QuranBookmark {
    @Attribute(.unique) public var id: UUID
    public var surah: Int
    public var ayah: Int
    public var page: Int
    public var name: String?
    public var color: String // Hex color
    public var createdAt: Date
    public var note: String?

    public init(
        id: UUID = UUID(),
        surah: Int,
        ayah: Int,
        page: Int,
        name: String? = nil,
        color: String = "#0D7377",
        createdAt: Date = Date(),
        note: String? = nil
    ) {
        self.id = id
        self.surah = surah
        self.ayah = ayah
        self.page = page
        self.name = name
        self.color = color
        self.createdAt = createdAt
        self.note = note
    }

    public var reference: String {
        "\(surah):\(ayah)"
    }
}

// MARK: - Quran Reading Streak

/// Tracks daily Quran reading streaks
@Model
public final class QuranStreak {
    @Attribute(.unique) public var id: UUID
    public var currentStreak: Int
    public var longestStreak: Int
    public var lastReadDate: Date?
    public var totalPagesRead: Int
    public var totalDaysRead: Int
    public var dailyGoalPages: Int
    public var streakStartDate: Date?
    public var freezesRemaining: Int
    public var freezesUsedThisMonth: Int

    public init(
        id: UUID = UUID(),
        currentStreak: Int = 0,
        longestStreak: Int = 0,
        lastReadDate: Date? = nil,
        totalPagesRead: Int = 0,
        totalDaysRead: Int = 0,
        dailyGoalPages: Int = 2,
        streakStartDate: Date? = nil,
        freezesRemaining: Int = 3,
        freezesUsedThisMonth: Int = 0
    ) {
        self.id = id
        self.currentStreak = currentStreak
        self.longestStreak = longestStreak
        self.lastReadDate = lastReadDate
        self.totalPagesRead = totalPagesRead
        self.totalDaysRead = totalDaysRead
        self.dailyGoalPages = dailyGoalPages
        self.streakStartDate = streakStartDate
        self.freezesRemaining = freezesRemaining
        self.freezesUsedThisMonth = freezesUsedThisMonth
    }

    /// Check if streak is at risk (not read today yet)
    public var isAtRisk: Bool {
        guard let lastRead = lastReadDate else { return false }
        return !Calendar.current.isDateInToday(lastRead)
    }

    /// Progress towards khatm (complete reading)
    public var khatmProgress: Double {
        Double(totalPagesRead) / 604.0 * 100 // 604 pages in Medina Mushaf
    }

    /// Number of complete readings (khatm)
    public var completeReadings: Int {
        totalPagesRead / 604
    }
}

// MARK: - Quran Audio Session

/// Represents an audio playback session
public struct QuranAudioSession: Codable, Equatable, Sendable {
    public let id: UUID
    public let reciterId: String
    public let startSurah: Int
    public let startAyah: Int
    public var currentSurah: Int
    public var currentAyah: Int
    public let startTime: Date
    public var totalDuration: TimeInterval
    public var playbackSpeed: Float
    public var repeatMode: RepeatMode
    public var spatialAudioEnabled: Bool

    public init(
        id: UUID = UUID(),
        reciterId: String,
        startSurah: Int,
        startAyah: Int,
        currentSurah: Int? = nil,
        currentAyah: Int? = nil,
        startTime: Date = Date(),
        totalDuration: TimeInterval = 0,
        playbackSpeed: Float = 1.0,
        repeatMode: RepeatMode = .none,
        spatialAudioEnabled: Bool = true
    ) {
        self.id = id
        self.reciterId = reciterId
        self.startSurah = startSurah
        self.startAyah = startAyah
        self.currentSurah = currentSurah ?? startSurah
        self.currentAyah = currentAyah ?? startAyah
        self.startTime = startTime
        self.totalDuration = totalDuration
        self.playbackSpeed = playbackSpeed
        self.repeatMode = repeatMode
        self.spatialAudioEnabled = spatialAudioEnabled
    }
}

public enum RepeatMode: String, Codable, Sendable {
    case none = "None"
    case ayah = "Repeat Ayah"
    case surah = "Repeat Surah"
    case range = "Repeat Range"
}

// MARK: - Quran Display Settings

/// User preferences for Quran display
public struct QuranDisplaySettings: Codable, Sendable {
    public var fontSize: Int // Base font size
    public var fontFamily: QuranFont
    public var showTranslation: Bool
    public var selectedTranslationId: String
    public var showTransliteration: Bool
    public var showTafsir: Bool
    public var selectedTafsirId: String
    public var displayMode: QuranDisplayMode
    public var colorScheme: QuranColorScheme
    public var lineSpacing: Double
    public var wordByWordEnabled: Bool

    public static let `default` = QuranDisplaySettings(
        fontSize: 24,
        fontFamily: .uthmani,
        showTranslation: true,
        selectedTranslationId: Translation.saheeInternational.id,
        showTransliteration: false,
        showTafsir: false,
        selectedTafsirId: TafsirSource.ibnKathir.id,
        displayMode: .reading,
        colorScheme: .classic,
        lineSpacing: 1.5,
        wordByWordEnabled: false
    )
}

public enum QuranFont: String, Codable, Sendable {
    case uthmani = "Uthmani"
    case indopak = "IndoPak"
    case naskh = "Naskh"
}

public enum QuranDisplayMode: String, Codable, Sendable {
    case reading = "Reading"
    case mushaf = "Mushaf Page"
    case translation = "Translation Focus"
}

public enum QuranColorScheme: String, Codable, Sendable {
    case classic = "Classic (Ivory)"
    case dark = "Dark"
    case sepia = "Sepia"
    case emerald = "Emerald"
}
