// MARK: - AIModels.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import Foundation
import SwiftData

// MARK: - AI Message

/// Represents a single message in an AI conversation
public struct AIMessage: Codable, Identifiable, Equatable, Sendable {
    public let id: UUID
    public let role: AIMessageRole
    public let content: String
    public let timestamp: Date
    public let citations: [AICitation]?
    public let confidence: AIConfidenceLevel?
    public let processingLocation: AIProcessingLocation?
    public var isStreaming: Bool

    public init(
        id: UUID = UUID(),
        role: AIMessageRole,
        content: String,
        timestamp: Date = Date(),
        citations: [AICitation]? = nil,
        confidence: AIConfidenceLevel? = nil,
        processingLocation: AIProcessingLocation? = nil,
        isStreaming: Bool = false
    ) {
        self.id = id
        self.role = role
        self.content = content
        self.timestamp = timestamp
        self.citations = citations
        self.confidence = confidence
        self.processingLocation = processingLocation
        self.isStreaming = isStreaming
    }
}

public enum AIMessageRole: String, Codable, Sendable {
    case user = "user"
    case assistant = "assistant"
    case system = "system"
}

// MARK: - AI Citation

/// Citation/reference in an AI response
public struct AICitation: Codable, Identifiable, Equatable, Sendable {
    public let id: UUID
    public let type: CitationType
    public let reference: String
    public let text: String?
    public let source: String?
    public let grading: String? // For hadith: Sahih, Hasan, etc.
    public let deepLink: String? // In-app navigation link

    public init(
        id: UUID = UUID(),
        type: CitationType,
        reference: String,
        text: String? = nil,
        source: String? = nil,
        grading: String? = nil,
        deepLink: String? = nil
    ) {
        self.id = id
        self.type = type
        self.reference = reference
        self.text = text
        self.source = source
        self.grading = grading
        self.deepLink = deepLink
    }
}

public enum CitationType: String, Codable, Sendable {
    case quran = "Quran"
    case hadith = "Hadith"
    case tafsir = "Tafsir"
    case scholarly = "Scholarly Opinion"
    case historical = "Historical"
}

// MARK: - AI Confidence Level

/// Confidence level of AI response
public enum AIConfidenceLevel: String, Codable, Sendable {
    case high = "High"
    case medium = "Medium"
    case low = "Low"

    public var description: String {
        switch self {
        case .high: return "Based on clear Quranic or Hadith text"
        case .medium: return "Based on scholarly interpretation"
        case .low: return "Limited sources available"
        }
    }

    public var iconName: String {
        switch self {
        case .high: return "checkmark.seal.fill"
        case .medium: return "checkmark.seal"
        case .low: return "questionmark.circle"
        }
    }
}

// MARK: - AI Processing Location

/// Where the AI query was processed
public enum AIProcessingLocation: String, Codable, Sendable {
    case onDevice = "On-Device"
    case cloud = "Cloud"

    public var privacyDescription: String {
        switch self {
        case .onDevice: return "Processed privately on your device"
        case .cloud: return "Processed securely in the cloud"
        }
    }
}

// MARK: - AI Conversation (SwiftData Model)

/// Persistent conversation with the AI assistant
@Model
public final class AIConversation {
    @Attribute(.unique) public var id: UUID
    public var title: String?
    public var messagesData: Data // Encoded [AIMessage]
    public var createdAt: Date
    public var updatedAt: Date
    public var topic: String?
    public var isBookmarked: Bool
    public var isPinned: Bool

    public init(
        id: UUID = UUID(),
        title: String? = nil,
        messages: [AIMessage] = [],
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        topic: String? = nil,
        isBookmarked: Bool = false,
        isPinned: Bool = false
    ) {
        self.id = id
        self.title = title
        self.messagesData = (try? JSONEncoder().encode(messages)) ?? Data()
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.topic = topic
        self.isBookmarked = isBookmarked
        self.isPinned = isPinned
    }

    public var messages: [AIMessage] {
        get {
            (try? JSONDecoder().decode([AIMessage].self, from: messagesData)) ?? []
        }
        set {
            messagesData = (try? JSONEncoder().encode(newValue)) ?? Data()
        }
    }

    /// Auto-generate title from first user message
    public func generateTitle() -> String {
        guard let firstUserMessage = messages.first(where: { $0.role == .user }) else {
            return "New Conversation"
        }
        let truncated = String(firstUserMessage.content.prefix(50))
        return truncated.count < firstUserMessage.content.count ? "\(truncated)..." : truncated
    }
}

// MARK: - AI Query Request

/// Request structure for AI queries
public struct AIQueryRequest: Codable, Sendable {
    public let query: String
    public let conversationContext: [AIMessage]?
    public let preferOnDevice: Bool
    public let language: String
    public let includeArabic: Bool
    public let detailLevel: AIDetailLevel
    public let madhab: MadhahPreference?

    public init(
        query: String,
        conversationContext: [AIMessage]? = nil,
        preferOnDevice: Bool = true,
        language: String = "en",
        includeArabic: Bool = true,
        detailLevel: AIDetailLevel = .moderate,
        madhab: MadhahPreference? = nil
    ) {
        self.query = query
        self.conversationContext = conversationContext
        self.preferOnDevice = preferOnDevice
        self.language = language
        self.includeArabic = includeArabic
        self.detailLevel = detailLevel
        self.madhab = madhab
    }
}

public enum AIDetailLevel: String, Codable, Sendable {
    case brief = "Brief"
    case moderate = "Moderate"
    case detailed = "Detailed"
    case scholarly = "Scholarly"
}

public enum MadhahPreference: String, Codable, Sendable {
    case hanafi = "Hanafi"
    case maliki = "Maliki"
    case shafii = "Shafi'i"
    case hanbali = "Hanbali"
    case all = "All Madhabs"
}

// MARK: - AI Query Response

/// Response structure from AI queries
public struct AIQueryResponse: Codable, Sendable {
    public let message: AIMessage
    public let suggestedFollowUps: [String]?
    public let relatedTopics: [String]?
    public let warnings: [AIResponseWarning]?

    public init(
        message: AIMessage,
        suggestedFollowUps: [String]? = nil,
        relatedTopics: [String]? = nil,
        warnings: [AIResponseWarning]? = nil
    ) {
        self.message = message
        self.suggestedFollowUps = suggestedFollowUps
        self.relatedTopics = relatedTopics
        self.warnings = warnings
    }
}

// MARK: - AI Response Warning

/// Warnings attached to AI responses
public struct AIResponseWarning: Codable, Identifiable, Equatable, Sendable {
    public let id: UUID
    public let type: AIWarningType
    public let message: String

    public init(
        id: UUID = UUID(),
        type: AIWarningType,
        message: String
    ) {
        self.id = id
        self.type = type
        self.message = message
    }
}

public enum AIWarningType: String, Codable, Sendable {
    case consultScholar = "Consult Scholar"
    case scholarlyDisagreement = "Scholarly Disagreement"
    case limitedSources = "Limited Sources"
    case personalFiqh = "Personal Fiqh Matter"
    case sensitiveTopix = "Sensitive Topic"

    public var iconName: String {
        switch self {
        case .consultScholar: return "person.fill.questionmark"
        case .scholarlyDisagreement: return "arrow.left.arrow.right"
        case .limitedSources: return "doc.questionmark"
        case .personalFiqh: return "hand.raised.fill"
        case .sensitiveTopix: return "exclamationmark.triangle"
        }
    }
}

// MARK: - AI Query Classification

/// Classification result for routing queries
public struct AIQueryClassification: Codable, Sendable {
    public let topic: AIQueryTopic
    public let complexity: AIQueryComplexity
    public let requiresCloudProcessing: Bool
    public let isWithinScope: Bool
    public let rejectionReason: AIRejectionReason?

    public init(
        topic: AIQueryTopic,
        complexity: AIQueryComplexity,
        requiresCloudProcessing: Bool,
        isWithinScope: Bool,
        rejectionReason: AIRejectionReason? = nil
    ) {
        self.topic = topic
        self.complexity = complexity
        self.requiresCloudProcessing = requiresCloudProcessing
        self.isWithinScope = isWithinScope
        self.rejectionReason = rejectionReason
    }
}

public enum AIQueryTopic: String, Codable, Sendable {
    case quranExplanation = "Quran Explanation"
    case hadithLookup = "Hadith Lookup"
    case prayerFiqh = "Prayer Fiqh"
    case fastingFiqh = "Fasting Fiqh"
    case generalFiqh = "General Fiqh"
    case seerah = "Prophetic Biography"
    case islamicHistory = "Islamic History"
    case dua = "Dua/Supplication"
    case aqeedah = "Beliefs/Theology"
    case tazkiyah = "Spiritual Purification"
    case comparativeReligion = "Comparative Religion"
    case outOfScope = "Out of Scope"
}

public enum AIQueryComplexity: String, Codable, Sendable {
    case simple = "Simple"
    case moderate = "Moderate"
    case complex = "Complex"
    case scholarly = "Scholarly"
}

public enum AIRejectionReason: String, Codable, Sendable {
    case nonIslamicTopic = "Non-Islamic Topic"
    case fatwaRequest = "Fatwa Request"
    case sectarianContent = "Sectarian Content"
    case harmfulContent = "Harmful Content"
    case personalAdvice = "Personal Advice Request"
}

// MARK: - AI Model Info

/// Information about available AI models
public struct AIModelInfo: Codable, Identifiable, Equatable, Sendable {
    public let id: String
    public let name: String
    public let version: String
    public let location: AIProcessingLocation
    public let sizeBytes: Int64?
    public let capabilities: [AICapability]
    public let isAvailable: Bool
    public let requiresPremium: Bool

    public static let noorLocal3B = AIModelInfo(
        id: "noor_local_3b",
        name: "NoorLocal-3B",
        version: "1.0.0",
        location: .onDevice,
        sizeBytes: 1_500_000_000, // 1.5GB
        capabilities: [.quranExplanation, .hadithLookup, .basicFiqh, .duaSuggestion],
        isAvailable: true,
        requiresPremium: true
    )

    public static let noorGPT4Cloud = AIModelInfo(
        id: "noor_gpt4_cloud",
        name: "NoorGPT-4",
        version: "1.0.0",
        location: .cloud,
        sizeBytes: nil,
        capabilities: AICapability.allCases,
        isAvailable: true,
        requiresPremium: false
    )
}

public enum AICapability: String, Codable, CaseIterable, Sendable {
    case quranExplanation = "Quran Explanation"
    case hadithLookup = "Hadith Lookup"
    case basicFiqh = "Basic Fiqh"
    case advancedFiqh = "Advanced Fiqh"
    case duaSuggestion = "Dua Suggestion"
    case seerah = "Seerah Knowledge"
    case comparativeAnalysis = "Comparative Analysis"
    case arabicTranslation = "Arabic Translation"
}

// MARK: - AI Usage Stats

/// Tracks AI usage for rate limiting and analytics
@Model
public final class AIUsageStats {
    @Attribute(.unique) public var id: UUID
    public var date: Date // Day for tracking
    public var onDeviceQueries: Int
    public var cloudQueries: Int
    public var totalTokensUsed: Int
    public var averageResponseTime: Double

    public init(
        id: UUID = UUID(),
        date: Date = Date(),
        onDeviceQueries: Int = 0,
        cloudQueries: Int = 0,
        totalTokensUsed: Int = 0,
        averageResponseTime: Double = 0
    ) {
        self.id = id
        self.date = Calendar.current.startOfDay(for: date)
        self.onDeviceQueries = onDeviceQueries
        self.cloudQueries = cloudQueries
        self.totalTokensUsed = totalTokensUsed
        self.averageResponseTime = averageResponseTime
    }

    public var totalQueries: Int {
        onDeviceQueries + cloudQueries
    }
}

// MARK: - AI Settings

/// User preferences for AI features
public struct AISettings: Codable, Sendable {
    public var preferOnDevice: Bool
    public var defaultLanguage: String
    public var includeArabicText: Bool
    public var defaultDetailLevel: AIDetailLevel
    public var defaultMadhab: MadhahPreference?
    public var showConfidenceIndicators: Bool
    public var showCitations: Bool
    public var enableVoiceInput: Bool
    public var enableVoiceOutput: Bool
    public var autoSuggestFollowUps: Bool
    public var saveConversationHistory: Bool
    public var dailyQueryLimit: Int? // nil = unlimited (premium)

    public static let `default` = AISettings(
        preferOnDevice: true,
        defaultLanguage: "en",
        includeArabicText: true,
        defaultDetailLevel: .moderate,
        defaultMadhab: nil,
        showConfidenceIndicators: true,
        showCitations: true,
        enableVoiceInput: true,
        enableVoiceOutput: false,
        autoSuggestFollowUps: true,
        saveConversationHistory: true,
        dailyQueryLimit: 5 // Free tier limit
    )

    public static let premium = AISettings(
        preferOnDevice: true,
        defaultLanguage: "en",
        includeArabicText: true,
        defaultDetailLevel: .moderate,
        defaultMadhab: nil,
        showConfidenceIndicators: true,
        showCitations: true,
        enableVoiceInput: true,
        enableVoiceOutput: true,
        autoSuggestFollowUps: true,
        saveConversationHistory: true,
        dailyQueryLimit: nil // Unlimited
    )
}

// MARK: - Predefined AI Queries

/// Common/suggested queries for quick access
public struct PredefinedQuery: Codable, Identifiable, Equatable, Sendable {
    public let id: String
    public let category: AIQueryTopic
    public let displayText: String
    public let query: String
    public let iconName: String

    public static let examples: [PredefinedQuery] = [
        PredefinedQuery(
            id: "ayatul_kursi",
            category: .quranExplanation,
            displayText: "Explain Ayatul Kursi",
            query: "Please explain the meaning and virtues of Ayatul Kursi (Surah Al-Baqarah 2:255)",
            iconName: "book.fill"
        ),
        PredefinedQuery(
            id: "wudu_steps",
            category: .prayerFiqh,
            displayText: "How to perform wudu",
            query: "What are the correct steps to perform wudu (ablution) according to the Sunnah?",
            iconName: "drop.fill"
        ),
        PredefinedQuery(
            id: "ramadan_fasting",
            category: .fastingFiqh,
            displayText: "What breaks the fast?",
            query: "What actions invalidate fasting during Ramadan?",
            iconName: "moon.fill"
        ),
        PredefinedQuery(
            id: "morning_adhkar",
            category: .dua,
            displayText: "Morning remembrance",
            query: "What are the authentic morning adhkar (remembrances) from the Sunnah?",
            iconName: "sunrise.fill"
        ),
        PredefinedQuery(
            id: "prophet_character",
            category: .seerah,
            displayText: "Prophet's character",
            query: "Describe the noble character and manners of Prophet Muhammad (peace be upon him)",
            iconName: "star.fill"
        )
    ]
}
