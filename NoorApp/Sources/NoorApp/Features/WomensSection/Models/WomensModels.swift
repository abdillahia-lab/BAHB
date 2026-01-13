// MARK: - WomensModels.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import Foundation
import SwiftData

// MARK: - Women's Content Category

/// Categories of content in the Women's Section
public enum WomensContentCategory: String, Codable, CaseIterable, Identifiable, Sendable {
    case motherhood = "Motherhood"
    case marriage = "Marriage"
    case patience = "Patience"
    case selfWorth = "Self-Worth"
    case scholarship = "Scholarship"
    case spirituality = "Spirituality"
    case community = "Community"
    case dailyReflection = "Daily Reflection"

    public var id: String { rawValue }

    public var iconName: String {
        switch self {
        case .motherhood: return "figure.and.child.holdinghands"
        case .marriage: return "heart.fill"
        case .patience: return "leaf.fill"
        case .selfWorth: return "sparkles"
        case .scholarship: return "book.fill"
        case .spirituality: return "hands.sparkles.fill"
        case .community: return "person.3.fill"
        case .dailyReflection: return "sun.horizon.fill"
        }
    }

    public var description: String {
        switch self {
        case .motherhood:
            return "Verses and reflections on the honor of motherhood in Islam"
        case .marriage:
            return "Islamic guidance on marriage, rights, and responsibilities"
        case .patience:
            return "Stories of patience from the Quran and lives of the Sahabiyyat"
        case .selfWorth:
            return "Reminders of your dignity and worth in the sight of Allah"
        case .scholarship:
            return "Celebrating women scholars and teachers of Islam"
        case .spirituality:
            return "Deepening your connection with Allah"
        case .community:
            return "Inspiring quotes and stories from the Muslim sisterhood"
        case .dailyReflection:
            return "Daily verses and thoughts to start your day"
        }
    }

    public var primaryColor: String {
        switch self {
        case .motherhood: return "#B76E79" // Rose
        case .marriage: return "#9E6B8A" // Mauve
        case .patience: return "#8A9A6B" // Sage
        case .selfWorth: return "#D4AF37" // Gold
        case .scholarship: return "#0D7377" // Emerald
        case .spirituality: return "#7B8FA1" // Dusty Blue
        case .community: return "#A67B5B" // Warm Brown
        case .dailyReflection: return "#E8B89D" // Peach
        }
    }
}

// MARK: - Women's Reflection

/// A daily reflection specifically curated for Muslim women
public struct WomensReflection: Codable, Identifiable, Equatable, Sendable {
    public let id: UUID
    public let category: WomensContentCategory
    public let arabicText: String?
    public let englishText: String
    public let source: ReflectionSource
    public let reference: String? // Quran reference or Hadith reference
    public let context: String? // Additional context or explanation
    public let relatedTopics: [String]?
    public let datePublished: Date
    public let authorName: String? // For community quotes

    public init(
        id: UUID = UUID(),
        category: WomensContentCategory,
        arabicText: String? = nil,
        englishText: String,
        source: ReflectionSource,
        reference: String? = nil,
        context: String? = nil,
        relatedTopics: [String]? = nil,
        datePublished: Date = Date(),
        authorName: String? = nil
    ) {
        self.id = id
        self.category = category
        self.arabicText = arabicText
        self.englishText = englishText
        self.source = source
        self.reference = reference
        self.context = context
        self.relatedTopics = relatedTopics
        self.datePublished = datePublished
        self.authorName = authorName
    }
}

public enum ReflectionSource: String, Codable, Sendable {
    case quran = "Quran"
    case hadith = "Hadith"
    case sahabiyyat = "Sahabiyyat" // Female companions
    case scholar = "Scholar"
    case community = "Community"
    case poetry = "Poetry"
}

// MARK: - Featured Woman

/// Profile of a notable Muslim woman for inspiration
public struct FeaturedWoman: Codable, Identifiable, Equatable, Sendable {
    public let id: UUID
    public let name: String
    public let nameArabic: String?
    public let title: String // e.g., "Mother of the Believers", "Scholar"
    public let era: String // e.g., "Prophet's Era", "8th Century"
    public let biography: String
    public let accomplishments: [String]
    public let lessonsLearned: [String]
    public let relatedVerses: [String]? // Quran references
    public let relatedHadith: [String]?
    public let imagePlaceholder: String? // For illustration

    public init(
        id: UUID = UUID(),
        name: String,
        nameArabic: String? = nil,
        title: String,
        era: String,
        biography: String,
        accomplishments: [String],
        lessonsLearned: [String],
        relatedVerses: [String]? = nil,
        relatedHadith: [String]? = nil,
        imagePlaceholder: String? = nil
    ) {
        self.id = id
        self.name = name
        self.nameArabic = nameArabic
        self.title = title
        self.era = era
        self.biography = biography
        self.accomplishments = accomplishments
        self.lessonsLearned = lessonsLearned
        self.relatedVerses = relatedVerses
        self.relatedHadith = relatedHadith
        self.imagePlaceholder = imagePlaceholder
    }

    // Notable women from Islamic history
    public static let khadijah = FeaturedWoman(
        name: "Khadijah bint Khuwaylid",
        nameArabic: "خديجة بنت خويلد",
        title: "Mother of the Believers",
        era: "Prophet's Era",
        biography: "Khadijah (RA) was the first wife of Prophet Muhammad (PBUH) and the first person to embrace Islam. A successful businesswoman, she supported the Prophet through the early difficult years of prophethood with her wealth, wisdom, and unwavering faith.",
        accomplishments: [
            "First person to accept Islam",
            "Successful international trader",
            "Supported the early Muslim community financially",
            "Mother of Fatimah (RA)"
        ],
        lessonsLearned: [
            "Faith requires courage and conviction",
            "Supporting others in their calling is noble",
            "Success in business and faith can coexist",
            "True partnership is built on mutual respect"
        ],
        relatedHadith: [
            "The best women of Paradise are Khadijah bint Khuwaylid, Fatimah bint Muhammad, Maryam bint 'Imran, and Asiyah."
        ]
    )

    public static let aisha = FeaturedWoman(
        name: "Aisha bint Abu Bakr",
        nameArabic: "عائشة بنت أبي بكر",
        title: "Mother of the Believers, Scholar",
        era: "Prophet's Era",
        biography: "Aisha (RA) was one of the most knowledgeable scholars of early Islam. She narrated over 2,000 hadith and was consulted by the Sahaba on matters of jurisprudence, theology, and history. Her sharp intellect and excellent memory made her an invaluable teacher.",
        accomplishments: [
            "Narrated over 2,000 hadith",
            "Expert in Islamic jurisprudence",
            "Taught many prominent scholars",
            "Known for her eloquence and poetry"
        ],
        lessonsLearned: [
            "Knowledge is power and responsibility",
            "Women have always been teachers of Islam",
            "Never stop learning and questioning",
            "Share knowledge generously with others"
        ]
    )

    public static let maryam = FeaturedWoman(
        name: "Maryam (Mary)",
        nameArabic: "مريم",
        title: "The Chosen One",
        era: "Pre-Islamic, mentioned in Quran",
        biography: "Maryam (AS) is the only woman mentioned by name in the Quran, with an entire surah named after her. She is described as chosen above the women of all nations for her piety, devotion, and miraculous motherhood of Prophet Isa (Jesus).",
        accomplishments: [
            "Chosen above all women of the worlds",
            "Mother of Prophet Isa (AS)",
            "Only woman named in the Quran",
            "Example of perfect devotion to Allah"
        ],
        lessonsLearned: [
            "Trust in Allah even when facing the impossible",
            "Patience and piety are honored by Allah",
            "Miraculous things happen to those who trust",
            "Solitude and worship strengthen the soul"
        ],
        relatedVerses: [
            "3:42 - And mention when the angels said, 'O Mary, indeed Allah has chosen you and purified you and chosen you above the women of the worlds.'",
            "19:16-36 - The full story of Maryam in Surah Maryam"
        ]
    )
}

// MARK: - Private Journal Entry (SwiftData Model)

/// Encrypted journal entry for personal reflections
@Model
public final class WomensJournalEntry {
    @Attribute(.unique) public var id: UUID
    public var date: Date
    public var encryptedContent: Data // AES-256 encrypted
    public var promptUsed: String? // The reflection prompt if used
    public var mood: String? // JournalMood.rawValue
    public var gratitudeItems: [String]?
    public var prayerRequests: [String]?
    public var relatedReflectionId: UUID? // Link to daily reflection
    public var tags: [String]?

    public init(
        id: UUID = UUID(),
        date: Date = Date(),
        encryptedContent: Data,
        promptUsed: String? = nil,
        mood: JournalMood? = nil,
        gratitudeItems: [String]? = nil,
        prayerRequests: [String]? = nil,
        relatedReflectionId: UUID? = nil,
        tags: [String]? = nil
    ) {
        self.id = id
        self.date = date
        self.encryptedContent = encryptedContent
        self.promptUsed = promptUsed
        self.mood = mood?.rawValue
        self.gratitudeItems = gratitudeItems
        self.prayerRequests = prayerRequests
        self.relatedReflectionId = relatedReflectionId
        self.tags = tags
    }

    public var moodValue: JournalMood? {
        guard let mood = mood else { return nil }
        return JournalMood(rawValue: mood)
    }
}

public enum JournalMood: String, Codable, CaseIterable, Sendable {
    case grateful = "Grateful"
    case peaceful = "Peaceful"
    case hopeful = "Hopeful"
    case reflective = "Reflective"
    case struggling = "Struggling"
    case seeking = "Seeking"
    case joyful = "Joyful"
    case patient = "Patient"

    public var iconName: String {
        switch self {
        case .grateful: return "hands.sparkles.fill"
        case .peaceful: return "leaf.fill"
        case .hopeful: return "sun.horizon.fill"
        case .reflective: return "moon.fill"
        case .struggling: return "cloud.fill"
        case .seeking: return "magnifyingglass"
        case .joyful: return "sparkles"
        case .patient: return "heart.fill"
        }
    }

    public var relatedDua: String {
        switch self {
        case .grateful:
            return "Alhamdulillah (All praise is due to Allah)"
        case .peaceful:
            return "Rabbi inni lima anzalta ilayya min khayrin faqir (My Lord, I am in need of whatever good You send down to me)"
        case .hopeful:
            return "La tahzan innallaha ma'ana (Do not grieve, Allah is with us)"
        case .reflective:
            return "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan (Our Lord, give us good in this world and good in the Hereafter)"
        case .struggling:
            return "Hasbunallahu wa ni'mal wakeel (Allah is sufficient for us and He is the best disposer of affairs)"
        case .seeking:
            return "Rabbi zidni 'ilma (My Lord, increase me in knowledge)"
        case .joyful:
            return "Subhanallah wa bihamdihi (Glory be to Allah and praise Him)"
        case .patient:
            return "Innallaha ma'as-sabireen (Indeed, Allah is with the patient)"
        }
    }
}

// MARK: - Journal Prompt

/// Prompts to inspire journal entries
public struct JournalPrompt: Codable, Identifiable, Equatable, Sendable {
    public let id: UUID
    public let category: WomensContentCategory
    public let prompt: String
    public let relatedAyah: String?
    public let relatedHadith: String?

    public init(
        id: UUID = UUID(),
        category: WomensContentCategory,
        prompt: String,
        relatedAyah: String? = nil,
        relatedHadith: String? = nil
    ) {
        self.id = id
        self.category = category
        self.prompt = prompt
        self.relatedAyah = relatedAyah
        self.relatedHadith = relatedHadith
    }

    public static let samplePrompts: [JournalPrompt] = [
        JournalPrompt(
            category: .motherhood,
            prompt: "What is one way you can embody the patience of Maryam (AS) in your role as a mother or caregiver today?",
            relatedAyah: "19:26 - So eat and drink and be contented."
        ),
        JournalPrompt(
            category: .patience,
            prompt: "Reflect on a difficulty you're facing. How might this be a test that will bring you closer to Allah?",
            relatedAyah: "2:155 - And We will surely test you with something of fear and hunger and a loss of wealth and lives and fruits."
        ),
        JournalPrompt(
            category: .selfWorth,
            prompt: "List three qualities Allah has blessed you with. How can you use these to serve others?",
            relatedAyah: "95:4 - We have certainly created man in the best of stature."
        ),
        JournalPrompt(
            category: .marriage,
            prompt: "What is one way you can bring more tranquility (sakina) into your relationship or home today?",
            relatedAyah: "30:21 - And He placed between you affection and mercy."
        ),
        JournalPrompt(
            category: .spirituality,
            prompt: "When do you feel closest to Allah? How can you create more of those moments?",
            relatedAyah: "2:186 - I am near. I respond to the invocation of the supplicant when he calls upon Me."
        )
    ]
}

// MARK: - Community Quote

/// Moderated community-submitted quotes
public struct CommunityQuote: Codable, Identifiable, Equatable, Sendable {
    public let id: UUID
    public let quote: String
    public let authorDisplayName: String
    public let category: WomensContentCategory
    public let dateSubmitted: Date
    public let isVerified: Bool // Reviewed by moderators
    public let likeCount: Int
    public let reportCount: Int

    public init(
        id: UUID = UUID(),
        quote: String,
        authorDisplayName: String,
        category: WomensContentCategory,
        dateSubmitted: Date = Date(),
        isVerified: Bool = false,
        likeCount: Int = 0,
        reportCount: Int = 0
    ) {
        self.id = id
        self.quote = quote
        self.authorDisplayName = authorDisplayName
        self.category = category
        self.dateSubmitted = dateSubmitted
        self.isVerified = isVerified
        self.likeCount = likeCount
        self.reportCount = reportCount
    }
}

// MARK: - Women's Section Settings

/// User preferences for Women's Section
public struct WomensSectionSettings: Codable, Sendable {
    public var isEnabled: Bool
    public var preferredCategories: [WomensContentCategory]
    public var dailyReflectionTime: Date? // When to send daily notification
    public var journalReminderEnabled: Bool
    public var journalReminderTime: Date?
    public var showCommunityQuotes: Bool
    public var useRoseTheme: Bool // Feminine color scheme

    public static let `default` = WomensSectionSettings(
        isEnabled: true,
        preferredCategories: WomensContentCategory.allCases,
        dailyReflectionTime: nil,
        journalReminderEnabled: false,
        journalReminderTime: nil,
        showCommunityQuotes: true,
        useRoseTheme: true
    )
}

// MARK: - Shareable Quote Card

/// Configuration for generating shareable quote cards
public struct ShareableQuoteCard: Codable, Sendable {
    public let reflection: WomensReflection
    public let designTemplate: QuoteCardTemplate
    public let includeSource: Bool
    public let includeAppBranding: Bool

    public init(
        reflection: WomensReflection,
        designTemplate: QuoteCardTemplate = .floral,
        includeSource: Bool = true,
        includeAppBranding: Bool = true
    ) {
        self.reflection = reflection
        self.designTemplate = designTemplate
        self.includeSource = includeSource
        self.includeAppBranding = includeAppBranding
    }
}

public enum QuoteCardTemplate: String, Codable, CaseIterable, Sendable {
    case floral = "Floral"
    case geometric = "Geometric"
    case minimal = "Minimal"
    case calligraphy = "Calligraphy"
    case watercolor = "Watercolor"

    public var backgroundPatternName: String {
        switch self {
        case .floral: return "card_bg_floral"
        case .geometric: return "card_bg_geometric"
        case .minimal: return "card_bg_minimal"
        case .calligraphy: return "card_bg_calligraphy"
        case .watercolor: return "card_bg_watercolor"
        }
    }
}
