import Foundation
import Combine

// MARK: - AI Coaching Service

@MainActor
class AICoachingService: ObservableObject {
    static let shared = AICoachingService()

    @Published var isProcessing = false
    @Published var lastResponse: CoachingResponse?
    @Published var conversationHistory: [ConversationTurn] = []

    private let mcpEndpoint: URL?
    private let hfToken: String?

    struct ConversationTurn: Identifiable {
        let id = UUID()
        let role: Role
        let content: String
        let timestamp: Date

        enum Role {
            case user
            case assistant
        }
    }

    struct CoachingResponse {
        let content: String
        let insights: [String]
        let suggestedActions: [String]
        let sentiment: Sentiment

        enum Sentiment {
            case supportive
            case challenging
            case reflective
            case actionOriented
        }
    }

    init() {
        self.mcpEndpoint = URL(string: ProcessInfo.processInfo.environment["MCP_ENDPOINT"] ?? "http://localhost:3000")
        self.hfToken = ProcessInfo.processInfo.environment["HF_TOKEN"]
    }

    // MARK: - Daily Check-In Coaching

    func processDailyCheckIn(
        energy: Int,
        win: String,
        friction: String,
        lettingGo: String,
        priority: String,
        recentEnergies: [Int] = []
    ) async -> CoachingResponse {
        isProcessing = true
        defer { isProcessing = false }

        // Try MCP server first, fall back to local
        if let response = await callMCPServer(tool: "coach_daily_checkin", arguments: [
            "energyLevel": energy,
            "meaningfulWin": win,
            "frictionPoint": friction,
            "thingToLetGo": lettingGo,
            "tomorrowPriority": priority,
            "previousCheckIns": recentEnergies.enumerated().map { ["energyLevel": $0.element] }
        ]) {
            return response
        }

        // Local fallback
        return generateLocalCheckInResponse(
            energy: energy,
            win: win,
            friction: friction,
            lettingGo: lettingGo,
            priority: priority,
            trend: calculateTrend(recentEnergies + [energy])
        )
    }

    // MARK: - Weekly Reflection Coaching

    func processWeeklyReview(
        movedNeedle: [String],
        wasNoise: [String],
        timeLeaks: [String],
        strategicInsight: String,
        dailyEnergies: [Int]
    ) async -> CoachingResponse {
        isProcessing = true
        defer { isProcessing = false }

        let avgEnergy = dailyEnergies.isEmpty ? 5.0 : Double(dailyEnergies.reduce(0, +)) / Double(dailyEnergies.count)

        if let response = await callMCPServer(tool: "coach_weekly_reflection", arguments: [
            "movedTheNeedle": movedNeedle,
            "wasNoise": wasNoise,
            "timeLeaks": timeLeaks,
            "strategicInsight": strategicInsight,
            "dailyEnergies": dailyEnergies
        ]) {
            return response
        }

        return generateLocalWeeklyResponse(
            needleMoverCount: movedNeedle.count,
            noiseCount: wasNoise.count,
            avgEnergy: avgEnergy,
            insight: strategicInsight
        )
    }

    // MARK: - Ask Coach

    func askCoach(question: String, context: String? = nil) async -> CoachingResponse {
        isProcessing = true
        defer { isProcessing = false }

        // Add to conversation
        conversationHistory.append(ConversationTurn(role: .user, content: question, timestamp: Date()))

        if let response = await callMCPServer(tool: "coach_ask_question", arguments: [
            "question": question,
            "context": context ?? ""
        ]) {
            conversationHistory.append(ConversationTurn(role: .assistant, content: response.content, timestamp: Date()))
            return response
        }

        let localResponse = generateLocalCoachingResponse(question: question)
        conversationHistory.append(ConversationTurn(role: .assistant, content: localResponse.content, timestamp: Date()))
        return localResponse
    }

    // MARK: - Pattern Analysis

    func analyzePatterns(
        checkIns: [CheckInSummary],
        timeRange: String = "month"
    ) async -> PatternAnalysis {
        isProcessing = true
        defer { isProcessing = false }

        // Calculate local patterns
        let energyTrend = calculateEnergyTrend(checkIns.map { $0.energy })
        let commonWinThemes = extractThemes(from: checkIns.map { $0.win })
        let commonFrictionThemes = extractThemes(from: checkIns.map { $0.friction })

        return PatternAnalysis(
            energyTrend: energyTrend,
            averageEnergy: checkIns.isEmpty ? 0 : Double(checkIns.map { $0.energy }.reduce(0, +)) / Double(checkIns.count),
            bestDays: findBestDays(checkIns),
            worstDays: findWorstDays(checkIns),
            winPatterns: commonWinThemes,
            frictionPatterns: commonFrictionThemes,
            recommendations: generateRecommendations(energyTrend: energyTrend, frictions: commonFrictionThemes)
        )
    }

    // MARK: - Goal Alignment

    func evaluateGoalAlignment(
        goals: [GoalSummary],
        northStar: NorthStarSummary,
        lifeMapScores: [String: Int]
    ) async -> AlignmentAnalysis {
        isProcessing = true
        defer { isProcessing = false }

        // Find lowest life map domain
        let lowestDomain = lifeMapScores.min { $0.value < $1.value }

        // Check if goals cover low-scoring domains
        let lowDomainGoals = goals.filter { goal in
            guard let lowest = lowestDomain else { return false }
            return goal.category.lowercased().contains(lowest.key.lowercased())
        }

        return AlignmentAnalysis(
            overallScore: calculateAlignmentScore(goals: goals, northStar: northStar),
            alignedGoals: goals.filter { $0.progress > 30 }.map { $0.title },
            misalignedGoals: identifyMisalignedGoals(goals: goals, northStar: northStar),
            gapAreas: lowestDomain.map { [$0.key] } ?? [],
            recommendation: lowDomainGoals.isEmpty ?
                "Consider adding a goal for your \(lowestDomain?.key ?? "lowest") domain" :
                "Your goals appear balanced. Focus on execution."
        )
    }

    // MARK: - Private Helpers

    private func callMCPServer(tool: String, arguments: [String: Any]) async -> CoachingResponse? {
        guard let endpoint = mcpEndpoint else { return nil }

        // In production, this would make actual HTTP calls to the MCP server
        // For now, return nil to use local fallback
        return nil
    }

    private func calculateTrend(_ values: [Int]) -> String {
        guard values.count >= 2 else { return "stable" }
        let recent = Array(values.suffix(3))
        let earlier = Array(values.prefix(3))
        let recentAvg = Double(recent.reduce(0, +)) / Double(recent.count)
        let earlierAvg = Double(earlier.reduce(0, +)) / Double(earlier.count)

        if recentAvg > earlierAvg + 0.5 { return "improving" }
        if recentAvg < earlierAvg - 0.5 { return "declining" }
        return "stable"
    }

    private func generateLocalCheckInResponse(
        energy: Int,
        win: String,
        friction: String,
        lettingGo: String,
        priority: String,
        trend: String
    ) -> CoachingResponse {
        var content = ""
        var insights: [String] = []
        var actions: [String] = []

        // Acknowledge win
        content += "**Win acknowledged.** \(win.isEmpty ? "Even small progress counts." : "That's meaningful progress.")\n\n"

        // Energy insight
        if energy <= 4 {
            content += "**Energy at \(energy)/10.** This is a signal, not a failure. What's your minimum viable output today?\n\n"
            insights.append("Low energy often precedes burnout. Consider what's draining you.")
            actions.append("Protect recovery time today")
        } else if energy >= 8 {
            content += "**Energy at \(energy)/10.** High energy is an asset—use it for your highest-leverage work.\n\n"
            actions.append("Tackle your hardest task while energy is high")
        } else {
            content += "**Energy at \(energy)/10 (\(trend) trend).** Match task difficulty to current capacity.\n\n"
        }

        // Connection between friction and letting go
        if !friction.isEmpty && !lettingGo.isEmpty {
            insights.append("Notice: your friction and what you're letting go might be connected. Is there a pattern?")
        }

        // Priority question
        content += "**Tomorrow's focus: \(priority)**\n\nQuestion: Is this the most important thing, or the most urgent? They're often different."

        return CoachingResponse(
            content: content,
            insights: insights,
            suggestedActions: actions,
            sentiment: energy <= 4 ? .supportive : .actionOriented
        )
    }

    private func generateLocalWeeklyResponse(
        needleMoverCount: Int,
        noiseCount: Int,
        avgEnergy: Double,
        insight: String
    ) -> CoachingResponse {
        var content = "## Weekly Analysis\n\n"

        // Ratio analysis
        let ratio = needleMoverCount > 0 ? Double(noiseCount) / Double(needleMoverCount) : Double(noiseCount)
        if ratio > 2 {
            content += "**Signal-to-noise concern.** \(noiseCount) noise items vs \(needleMoverCount) needle movers. Where can you say no?\n\n"
        } else {
            content += "**Good signal-to-noise ratio.** Keep protecting time for what moves the needle.\n\n"
        }

        // Energy assessment
        content += "**Average energy: \(String(format: "%.1f", avgEnergy))/10.** "
        if avgEnergy < 5 {
            content += "This is below sustainable. What's the root cause?\n\n"
        } else if avgEnergy > 7 {
            content += "Strong week energetically. What made the difference?\n\n"
        } else {
            content += "Moderate energy. Room for optimization.\n\n"
        }

        // Strategic insight reflection
        if !insight.isEmpty {
            content += "**Your insight:** \"\(insight)\"\n\nThe question isn't whether this is true—it's whether you'll act on it."
        }

        return CoachingResponse(
            content: content,
            insights: ["High noise often indicates boundary issues", "Energy patterns reveal more than productivity metrics"],
            suggestedActions: ["Identify one noise source to eliminate", "Block time for your highest-leverage work"],
            sentiment: .reflective
        )
    }

    private func generateLocalCoachingResponse(question: String) -> CoachingResponse {
        let lowercased = question.lowercased()

        if lowercased.contains("decision") || lowercased.contains("choose") {
            return CoachingResponse(
                content: "Before I share a perspective: What does your gut already tell you? Often the answer is there—you just haven't given yourself permission to act on it.\n\nTry the 10/10/10 test: How will you feel about this decision in 10 minutes? 10 months? 10 years?",
                insights: ["Most decisions are reversible", "The cost of indecision often exceeds the cost of a wrong choice"],
                suggestedActions: ["Write out both options and their 2nd-order consequences", "Ask: What would I advise a friend in this situation?"],
                sentiment: .reflective
            )
        } else if lowercased.contains("energy") || lowercased.contains("tired") || lowercased.contains("burnout") {
            return CoachingResponse(
                content: "Energy is a signal, not a problem to fix with tactics.\n\n**First:** What's draining you most right now? Not symptoms—root causes.\n\n**Second:** What restores you that you're not doing enough of?\n\n**Third:** Which commitments need to be renegotiated or released?",
                insights: ["Sustainable performance comes from recovery, not endurance", "Energy management trumps time management"],
                suggestedActions: ["Audit your calendar for energy drains", "Schedule recovery before it becomes mandatory"],
                sentiment: .supportive
            )
        } else if lowercased.contains("priority") || lowercased.contains("focus") || lowercased.contains("too much") {
            return CoachingResponse(
                content: "The question isn't what to prioritize—it's what to eliminate.\n\n**Ask yourself:**\n- What would I not do if I could only choose three things?\n- What am I doing that a less expensive resource could do?\n- What am I doing out of habit that no longer serves the goal?\n\nClarity comes from subtraction, not addition.",
                insights: ["Every yes is a no to something else", "The best CEOs are editors, not authors"],
                suggestedActions: ["List everything you're doing. Cross off half.", "Delegate one thing this week you've been holding onto"],
                sentiment: .challenging
            )
        } else {
            return CoachingResponse(
                content: "That's worth exploring deeper.\n\n**Reflection prompt:** What would change if this problem disappeared tomorrow? Work backwards from there.\n\n**Challenge:** What's the hardest question you're not asking yourself about this?",
                insights: ["The best questions are the ones we avoid", "Solutions often hide in the problem definition"],
                suggestedActions: ["Journal on this for 10 minutes without editing", "Talk it through with someone who will challenge your assumptions"],
                sentiment: .reflective
            )
        }
    }

    private func calculateEnergyTrend(_ energies: [Int]) -> String {
        guard energies.count >= 5 else { return "insufficient data" }
        let firstHalf = Array(energies.prefix(energies.count / 2))
        let secondHalf = Array(energies.suffix(energies.count / 2))
        let firstAvg = Double(firstHalf.reduce(0, +)) / Double(firstHalf.count)
        let secondAvg = Double(secondHalf.reduce(0, +)) / Double(secondHalf.count)

        if secondAvg > firstAvg + 0.5 { return "improving" }
        if secondAvg < firstAvg - 0.5 { return "declining" }
        return "stable"
    }

    private func extractThemes(from items: [String]) -> [String] {
        let words = items.flatMap { $0.lowercased().split(separator: " ") }
        var counts: [String: Int] = [:]
        let stopWords = Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "i", "my", "was", "is"])

        for word in words {
            let cleaned = String(word).filter { $0.isLetter }
            if cleaned.count > 3 && !stopWords.contains(cleaned) {
                counts[cleaned, default: 0] += 1
            }
        }

        return counts.sorted { $0.value > $1.value }.prefix(5).map { $0.key }
    }

    private func findBestDays(_ checkIns: [CheckInSummary]) -> [String] {
        checkIns.sorted { $0.energy > $1.energy }.prefix(3).map { formatDate($0.date) }
    }

    private func findWorstDays(_ checkIns: [CheckInSummary]) -> [String] {
        checkIns.sorted { $0.energy < $1.energy }.prefix(3).map { formatDate($0.date) }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, MMM d"
        return formatter.string(from: date)
    }

    private func generateRecommendations(energyTrend: String, frictions: [String]) -> [String] {
        var recs: [String] = []

        switch energyTrend {
        case "declining":
            recs.append("Prioritize recovery before it becomes mandatory")
        case "improving":
            recs.append("Identify what's working and do more of it")
        default:
            recs.append("Experiment with one energy optimization this week")
        }

        if !frictions.isEmpty {
            recs.append("Address root cause of '\(frictions[0])' friction")
        }

        return recs
    }

    private func calculateAlignmentScore(goals: [GoalSummary], northStar: NorthStarSummary) -> Int {
        // Simplified alignment scoring
        let activeGoals = goals.filter { $0.progress > 0 }
        guard !activeGoals.isEmpty else { return 5 }

        let avgProgress = activeGoals.map { $0.progress }.reduce(0, +) / activeGoals.count
        return min(10, max(1, avgProgress / 10))
    }

    private func identifyMisalignedGoals(goals: [GoalSummary], northStar: NorthStarSummary) -> [String] {
        // Goals with no progress might indicate misalignment
        goals.filter { $0.progress < 10 }.map { $0.title }
    }
}

// MARK: - Supporting Types

struct CheckInSummary {
    let date: Date
    let energy: Int
    let win: String
    let friction: String
}

struct GoalSummary {
    let title: String
    let category: String
    let progress: Int
}

struct NorthStarSummary {
    let greatLife: String
    let optimizingFor: String
    let wouldRegret: String
}

struct PatternAnalysis {
    let energyTrend: String
    let averageEnergy: Double
    let bestDays: [String]
    let worstDays: [String]
    let winPatterns: [String]
    let frictionPatterns: [String]
    let recommendations: [String]
}

struct AlignmentAnalysis {
    let overallScore: Int
    let alignedGoals: [String]
    let misalignedGoals: [String]
    let gapAreas: [String]
    let recommendation: String
}
