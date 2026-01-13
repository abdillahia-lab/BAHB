// MARK: - NoorLocalAI.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import Foundation
import CoreML
import NaturalLanguage

// MARK: - On-Device AI Service

/// On-device AI processing using iPhone 17's Neural Engine
/// Provides privacy-preserving Islamic knowledge assistance
@available(iOS 18.0, *)
public final class NoorLocalAI {

    // MARK: - Properties

    private var model: MLModel?
    private var tokenizer: NoorTokenizer?
    private let modelQueue = DispatchQueue(label: "com.noor.localai", qos: .userInitiated)
    private var isModelLoaded = false

    // Model configuration
    private let maxContextLength = 4096
    private let maxResponseTokens = 1024
    private let temperature: Float = 0.7
    private let topP: Float = 0.9

    // Content databases for verification
    private var quranDatabase: QuranDatabase?
    private var hadithDatabase: HadithDatabase?

    // MARK: - Initialization

    public init() {}

    // MARK: - Model Loading

    /// Load the on-device AI model
    /// - Parameter progressHandler: Callback for loading progress
    public func loadModel(progressHandler: ((Double) -> Void)? = nil) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            modelQueue.async { [weak self] in
                guard let self = self else {
                    continuation.resume(throwing: NoorAIError.serviceUnavailable)
                    return
                }

                do {
                    progressHandler?(0.1)

                    // Load Core ML model from bundle
                    guard let modelURL = Bundle.main.url(
                        forResource: "NoorLocal3B",
                        withExtension: "mlmodelc"
                    ) else {
                        throw NoorAIError.modelNotFound
                    }

                    progressHandler?(0.3)

                    // Configure for Neural Engine optimization
                    let config = MLModelConfiguration()
                    config.computeUnits = .cpuAndNeuralEngine
                    config.allowLowPrecisionAccumulationOnGPU = true

                    progressHandler?(0.5)

                    // Load model
                    self.model = try MLModel(contentsOf: modelURL, configuration: config)

                    progressHandler?(0.7)

                    // Initialize tokenizer
                    self.tokenizer = NoorTokenizer()

                    progressHandler?(0.8)

                    // Load content databases
                    self.quranDatabase = try QuranDatabase()
                    self.hadithDatabase = try HadithDatabase()

                    progressHandler?(0.95)

                    self.isModelLoaded = true
                    progressHandler?(1.0)

                    continuation.resume()
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    /// Check if model is ready
    public var isReady: Bool {
        isModelLoaded && model != nil
    }

    // MARK: - Query Processing

    /// Process a query using on-device AI
    /// - Parameters:
    ///   - request: The AI query request
    ///   - streamHandler: Optional handler for streaming responses
    /// - Returns: AI response with citations
    public func processQuery(
        _ request: AIQueryRequest,
        streamHandler: ((String) -> Void)? = nil
    ) async throws -> AIQueryResponse {
        guard isReady else {
            throw NoorAIError.modelNotLoaded
        }

        // Classify the query
        let classification = classifyQuery(request.query)

        // Check if query is within scope
        guard classification.isWithinScope else {
            return createRejectionResponse(reason: classification.rejectionReason ?? .nonIslamicTopic)
        }

        // Build context with relevant Islamic content
        let context = await buildContext(for: request, classification: classification)

        // Generate response
        let response = try await generateResponse(
            query: request.query,
            context: context,
            classification: classification,
            streamHandler: streamHandler
        )

        // Verify citations
        let verifiedResponse = await verifyCitations(in: response)

        return verifiedResponse
    }

    // MARK: - Query Classification

    private func classifyQuery(_ query: String) -> AIQueryClassification {
        let lowercased = query.lowercased()

        // Check for non-Islamic topics
        let nonIslamicKeywords = [
            "stock", "invest", "movie", "music", "game", "sport",
            "politics", "election", "weather", "recipe", "code", "program"
        ]

        for keyword in nonIslamicKeywords {
            if lowercased.contains(keyword) && !isIslamicContext(query) {
                return AIQueryClassification(
                    topic: .outOfScope,
                    complexity: .simple,
                    requiresCloudProcessing: false,
                    isWithinScope: false,
                    rejectionReason: .nonIslamicTopic
                )
            }
        }

        // Check for fatwa requests
        let fatwaIndicators = ["is it haram", "is it halal", "is it permissible", "can i", "should i", "ruling on"]
        for indicator in fatwaIndicators {
            if lowercased.contains(indicator) {
                // Allow general questions but flag specific personal fatwas
                if containsPersonalContext(query) {
                    return AIQueryClassification(
                        topic: .generalFiqh,
                        complexity: .complex,
                        requiresCloudProcessing: true,
                        isWithinScope: true,
                        rejectionReason: nil
                    )
                }
            }
        }

        // Determine topic
        let topic = detectTopic(query)

        // Determine complexity
        let complexity = assessComplexity(query, topic: topic)

        // Determine if cloud is needed
        let requiresCloud = complexity == .complex || complexity == .scholarly

        return AIQueryClassification(
            topic: topic,
            complexity: complexity,
            requiresCloudProcessing: requiresCloud,
            isWithinScope: true,
            rejectionReason: nil
        )
    }

    private func detectTopic(_ query: String) -> AIQueryTopic {
        let lowercased = query.lowercased()

        // Quran-related
        if lowercased.contains("quran") || lowercased.contains("surah") ||
           lowercased.contains("ayah") || lowercased.contains("verse") {
            return .quranExplanation
        }

        // Hadith-related
        if lowercased.contains("hadith") || lowercased.contains("prophet said") ||
           lowercased.contains("sunnah") {
            return .hadithLookup
        }

        // Prayer-related
        if lowercased.contains("prayer") || lowercased.contains("salah") ||
           lowercased.contains("wudu") || lowercased.contains("ablution") {
            return .prayerFiqh
        }

        // Fasting-related
        if lowercased.contains("fast") || lowercased.contains("ramadan") ||
           lowercased.contains("suhoor") || lowercased.contains("iftar") {
            return .fastingFiqh
        }

        // Dua-related
        if lowercased.contains("dua") || lowercased.contains("supplication") ||
           lowercased.contains("dhikr") {
            return .dua
        }

        // Seerah-related
        if lowercased.contains("prophet muhammad") || lowercased.contains("messenger") ||
           lowercased.contains("seerah") || lowercased.contains("biography") {
            return .seerah
        }

        // History-related
        if lowercased.contains("history") || lowercased.contains("companion") ||
           lowercased.contains("sahaba") || lowercased.contains("caliphate") {
            return .islamicHistory
        }

        // Aqeedah-related
        if lowercased.contains("believe") || lowercased.contains("faith") ||
           lowercased.contains("aqeedah") || lowercased.contains("pillars of islam") {
            return .aqeedah
        }

        // Default to general fiqh
        return .generalFiqh
    }

    private func assessComplexity(_ query: String, topic: AIQueryTopic) -> AIQueryComplexity {
        let wordCount = query.split(separator: " ").count

        // Long queries are typically more complex
        if wordCount > 30 { return .complex }

        // Questions comparing madhabs or scholarly opinions
        if query.lowercased().contains("difference") ||
           query.lowercased().contains("madhab") ||
           query.lowercased().contains("scholar") {
            return .scholarly
        }

        // Fiqh questions tend to be moderate to complex
        if topic == .generalFiqh || topic == .prayerFiqh || topic == .fastingFiqh {
            return .moderate
        }

        // Simple lookups
        if topic == .quranExplanation || topic == .hadithLookup || topic == .dua {
            return .simple
        }

        return .moderate
    }

    private func isIslamicContext(_ query: String) -> Bool {
        let islamicKeywords = [
            "islam", "muslim", "quran", "hadith", "prayer", "halal", "haram",
            "prophet", "allah", "mosque", "ramadan", "zakat", "hajj"
        ]

        let lowercased = query.lowercased()
        return islamicKeywords.contains { lowercased.contains($0) }
    }

    private func containsPersonalContext(_ query: String) -> Bool {
        let personalIndicators = ["my", "i have", "i am", "my family", "my situation"]
        let lowercased = query.lowercased()
        return personalIndicators.contains { lowercased.contains($0) }
    }

    // MARK: - Context Building

    private func buildContext(
        for request: AIQueryRequest,
        classification: AIQueryClassification
    ) async -> String {
        var contextParts: [String] = []

        // System prompt
        contextParts.append("""
        You are Noor, an Islamic knowledge assistant. You provide accurate information based only on:
        - The Holy Quran
        - Authentic Hadith (Sahih Bukhari, Sahih Muslim, and other authenticated collections)
        - Classical Islamic scholarship

        Rules:
        1. Always cite sources with specific references (Surah:Ayah for Quran, Book and number for Hadith)
        2. If you're unsure, say so clearly
        3. For personal fiqh matters, recommend consulting a local scholar
        4. Present scholarly differences when they exist
        5. Never issue personal fatwas
        6. Be respectful and gentle in your responses
        """)

        // Add relevant Quran verses if applicable
        if classification.topic == .quranExplanation {
            if let relevantVerses = await quranDatabase?.searchRelevantVerses(for: request.query) {
                contextParts.append("Relevant Quran Verses:\n\(relevantVerses)")
            }
        }

        // Add relevant Hadith if applicable
        if classification.topic == .hadithLookup || classification.topic == .prayerFiqh ||
           classification.topic == .fastingFiqh {
            if let relevantHadith = await hadithDatabase?.searchRelevantHadith(for: request.query) {
                contextParts.append("Relevant Hadith:\n\(relevantHadith)")
            }
        }

        // Add conversation context if provided
        if let conversationContext = request.conversationContext, !conversationContext.isEmpty {
            let recentMessages = conversationContext.suffix(6).map { msg in
                "\(msg.role.rawValue): \(msg.content)"
            }.joined(separator: "\n")
            contextParts.append("Previous conversation:\n\(recentMessages)")
        }

        return contextParts.joined(separator: "\n\n")
    }

    // MARK: - Response Generation

    private func generateResponse(
        query: String,
        context: String,
        classification: AIQueryClassification,
        streamHandler: ((String) -> Void)?
    ) async throws -> AIQueryResponse {
        guard let model = model, let tokenizer = tokenizer else {
            throw NoorAIError.modelNotLoaded
        }

        // Tokenize input
        let fullPrompt = "\(context)\n\nUser Question: \(query)\n\nAssistant:"
        let inputTokens = tokenizer.encode(fullPrompt)

        // Ensure we don't exceed context length
        let truncatedTokens = Array(inputTokens.suffix(maxContextLength - maxResponseTokens))

        // Prepare model input
        let inputArray = try MLMultiArray(shape: [1, NSNumber(value: truncatedTokens.count)], dataType: .int32)
        for (index, token) in truncatedTokens.enumerated() {
            inputArray[index] = NSNumber(value: token)
        }

        // Generate response tokens
        var responseTokens: [Int] = []
        var responseText = ""

        // Simulate streaming generation (actual implementation would use model inference loop)
        // This is a placeholder for the actual Core ML inference
        for _ in 0..<maxResponseTokens {
            // In actual implementation:
            // 1. Run model inference
            // 2. Sample from output distribution
            // 3. Append token
            // 4. Check for end token

            // Placeholder: In production, this would be actual model inference
            break
        }

        // For now, create a structured response based on classification
        responseText = generateStructuredResponse(query: query, classification: classification)

        // Parse citations from response
        let citations = extractCitations(from: responseText)

        // Determine confidence
        let confidence = determineConfidence(
            classification: classification,
            citationCount: citations.count
        )

        // Create message
        let message = AIMessage(
            role: .assistant,
            content: responseText,
            citations: citations,
            confidence: confidence,
            processingLocation: .onDevice
        )

        // Generate follow-ups
        let followUps = generateFollowUpSuggestions(classification: classification, query: query)

        return AIQueryResponse(
            message: message,
            suggestedFollowUps: followUps,
            relatedTopics: nil,
            warnings: generateWarnings(classification: classification)
        )
    }

    private func generateStructuredResponse(query: String, classification: AIQueryClassification) -> String {
        // This would be replaced by actual model output in production
        // For now, return a template response indicating proper handling

        switch classification.topic {
        case .quranExplanation:
            return """
            Based on classical tafsir sources:

            [This response would contain the AI-generated explanation of the Quranic content requested, including:
            - Arabic text
            - Translation
            - Explanation from Ibn Kathir, Al-Tabari, or other classical scholars
            - Related verses]

            Sources:
            - Quran [Surah:Ayah]
            - Tafsir Ibn Kathir
            """

        case .hadithLookup:
            return """
            Regarding your question about hadith:

            [This response would contain the relevant hadith with:
            - Arabic text
            - Translation
            - Chain of narration
            - Grading (Sahih, Hasan, etc.)
            - Context and explanation]

            Source: Sahih Bukhari/Muslim [Book:Number]
            """

        case .prayerFiqh, .fastingFiqh, .generalFiqh:
            return """
            Based on Islamic jurisprudence:

            [This response would contain:
            - Direct answer based on Quran and Sunnah
            - Evidence from primary sources
            - Different scholarly opinions if applicable
            - Practical guidance]

            Note: For specific personal situations, please consult a local scholar.
            """

        case .dua:
            return """
            Here is the supplication you requested:

            [This would include:
            - Arabic text
            - Transliteration
            - Translation
            - When and how to recite
            - Source reference]

            Source: [Hadith reference or Quran reference]
            """

        default:
            return """
            [Response based on authenticated Islamic sources]

            Please note: This is general Islamic knowledge. For personal rulings, consult a qualified scholar.
            """
        }
    }

    // MARK: - Citation Handling

    private func extractCitations(from text: String) -> [AICitation] {
        var citations: [AICitation] = []

        // Extract Quran references (e.g., "2:255", "Surah Al-Baqarah 2:255")
        let quranPattern = #"(\d{1,3}):(\d{1,3})"#
        if let regex = try? NSRegularExpression(pattern: quranPattern) {
            let range = NSRange(text.startIndex..., in: text)
            let matches = regex.matches(in: text, range: range)

            for match in matches {
                if let matchRange = Range(match.range, in: text) {
                    let reference = String(text[matchRange])
                    citations.append(AICitation(
                        type: .quran,
                        reference: reference,
                        deepLink: "noor://quran/\(reference)"
                    ))
                }
            }
        }

        // Extract Hadith references (e.g., "Bukhari 1234", "Muslim 567")
        let hadithPattern = #"(Bukhari|Muslim|Tirmidhi|Abu Dawud|Nasai|Ibn Majah)\s*(\d+)"#
        if let regex = try? NSRegularExpression(pattern: hadithPattern, options: .caseInsensitive) {
            let range = NSRange(text.startIndex..., in: text)
            let matches = regex.matches(in: text, range: range)

            for match in matches {
                if let matchRange = Range(match.range, in: text) {
                    let reference = String(text[matchRange])
                    citations.append(AICitation(
                        type: .hadith,
                        reference: reference,
                        source: "Authenticated Hadith Collection"
                    ))
                }
            }
        }

        return citations
    }

    private func verifyCitations(in response: AIQueryResponse) async -> AIQueryResponse {
        guard let citations = response.message.citations else { return response }

        var verifiedCitations: [AICitation] = []

        for citation in citations {
            switch citation.type {
            case .quran:
                if let verified = await quranDatabase?.verifyCitation(citation) {
                    verifiedCitations.append(verified)
                }
            case .hadith:
                if let verified = await hadithDatabase?.verifyCitation(citation) {
                    verifiedCitations.append(verified)
                }
            default:
                verifiedCitations.append(citation)
            }
        }

        let verifiedMessage = AIMessage(
            id: response.message.id,
            role: response.message.role,
            content: response.message.content,
            timestamp: response.message.timestamp,
            citations: verifiedCitations,
            confidence: response.message.confidence,
            processingLocation: response.message.processingLocation
        )

        return AIQueryResponse(
            message: verifiedMessage,
            suggestedFollowUps: response.suggestedFollowUps,
            relatedTopics: response.relatedTopics,
            warnings: response.warnings
        )
    }

    // MARK: - Helper Methods

    private func determineConfidence(classification: AIQueryClassification, citationCount: Int) -> AIConfidenceLevel {
        if citationCount >= 2 && (classification.topic == .quranExplanation || classification.topic == .hadithLookup) {
            return .high
        } else if citationCount >= 1 {
            return .medium
        } else {
            return .low
        }
    }

    private func generateFollowUpSuggestions(classification: AIQueryClassification, query: String) -> [String] {
        switch classification.topic {
        case .quranExplanation:
            return [
                "What is the historical context of this verse?",
                "Are there related verses on this topic?",
                "What do the scholars say about this verse?"
            ]
        case .hadithLookup:
            return [
                "Are there other hadith on this topic?",
                "What is the chain of narration?",
                "How do scholars explain this hadith?"
            ]
        case .prayerFiqh:
            return [
                "What are the common mistakes to avoid?",
                "What is the sunnah method?",
                "Are there different scholarly opinions?"
            ]
        default:
            return [
                "Can you explain more?",
                "What are the sources for this?",
                "Are there different opinions on this?"
            ]
        }
    }

    private func generateWarnings(classification: AIQueryClassification) -> [AIResponseWarning]? {
        var warnings: [AIResponseWarning] = []

        if classification.topic == .generalFiqh || classification.topic == .prayerFiqh ||
           classification.topic == .fastingFiqh {
            warnings.append(AIResponseWarning(
                type: .consultScholar,
                message: "For specific personal rulings, please consult a qualified local scholar."
            ))
        }

        if classification.complexity == .scholarly {
            warnings.append(AIResponseWarning(
                type: .scholarlyDisagreement,
                message: "This topic has varying scholarly opinions. The response presents the majority view."
            ))
        }

        return warnings.isEmpty ? nil : warnings
    }

    private func createRejectionResponse(reason: AIRejectionReason) -> AIQueryResponse {
        let message: String
        switch reason {
        case .nonIslamicTopic:
            message = "I'm designed to help with Islamic knowledge and practice. This question appears to be outside my area of expertise. Please ask me about Quran, Hadith, prayer, fasting, or other Islamic topics."
        case .fatwaRequest:
            message = "I cannot issue personal religious rulings (fatwas). Please consult a qualified local scholar or mufti for personal religious guidance."
        case .sectarianContent:
            message = "I aim to present mainstream Islamic knowledge that unites Muslims. I avoid content that could promote division."
        case .harmfulContent:
            message = "I cannot assist with this request as it could lead to harm."
        case .personalAdvice:
            message = "For personal matters requiring specific religious guidance, please consult a qualified scholar who can understand your full situation."
        }

        return AIQueryResponse(
            message: AIMessage(
                role: .assistant,
                content: message,
                confidence: .high,
                processingLocation: .onDevice
            ),
            suggestedFollowUps: PredefinedQuery.examples.prefix(3).map { $0.displayText },
            relatedTopics: nil,
            warnings: nil
        )
    }
}

// MARK: - Supporting Types

public enum NoorAIError: Error, LocalizedError {
    case modelNotFound
    case modelNotLoaded
    case tokenizationFailed
    case inferenceError
    case serviceUnavailable
    case quotaExceeded

    public var errorDescription: String? {
        switch self {
        case .modelNotFound:
            return "AI model file not found. Please reinstall the app."
        case .modelNotLoaded:
            return "AI model not loaded. Please wait for initialization."
        case .tokenizationFailed:
            return "Failed to process your question. Please try rephrasing."
        case .inferenceError:
            return "Error generating response. Please try again."
        case .serviceUnavailable:
            return "AI service is temporarily unavailable."
        case .quotaExceeded:
            return "Daily question limit reached. Upgrade to Premium for unlimited questions."
        }
    }
}

// MARK: - Placeholder Types (Would be implemented separately)

/// Tokenizer for the NoorLocal model
private class NoorTokenizer {
    func encode(_ text: String) -> [Int] {
        // Placeholder: Actual BPE tokenization implementation
        return []
    }

    func decode(_ tokens: [Int]) -> String {
        // Placeholder: Actual decoding implementation
        return ""
    }
}

/// Quran database for verification and search
private class QuranDatabase {
    init() throws {
        // Load Quran database from bundle
    }

    func searchRelevantVerses(for query: String) async -> String? {
        // Search for relevant verses
        return nil
    }

    func verifyCitation(_ citation: AICitation) async -> AICitation? {
        // Verify the citation exists and is accurate
        return citation
    }
}

/// Hadith database for verification and search
private class HadithDatabase {
    init() throws {
        // Load Hadith database from bundle
    }

    func searchRelevantHadith(for query: String) async -> String? {
        // Search for relevant hadith
        return nil
    }

    func verifyCitation(_ citation: AICitation) async -> AICitation? {
        // Verify the citation exists and is accurate
        return citation
    }
}
