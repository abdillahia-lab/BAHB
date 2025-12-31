import SwiftUI
import SwiftData

// MARK: - Daily Check-In Model
@Model
final class CheckInData {
    @Attribute(.unique) var id: UUID
    var date: Date
    var energyLevel: Int
    var meaningfulWin: String
    var frictionPoint: String
    var thingToLetGo: String
    var tomorrowPriority: String
    var gratitude: String?
    var insight: String?
    var moodWord: String?
    var aiCoachingFeedback: String?
    var createdAt: Date

    init(
        id: UUID = UUID(),
        date: Date = Date(),
        energyLevel: Int = 5,
        meaningfulWin: String = "",
        frictionPoint: String = "",
        thingToLetGo: String = "",
        tomorrowPriority: String = "",
        gratitude: String? = nil,
        insight: String? = nil,
        moodWord: String? = nil,
        aiCoachingFeedback: String? = nil
    ) {
        self.id = id
        self.date = date
        self.energyLevel = energyLevel
        self.meaningfulWin = meaningfulWin
        self.frictionPoint = frictionPoint
        self.thingToLetGo = thingToLetGo
        self.tomorrowPriority = tomorrowPriority
        self.gratitude = gratitude
        self.insight = insight
        self.moodWord = moodWord
        self.aiCoachingFeedback = aiCoachingFeedback
        self.createdAt = Date()
    }

    var isComplete: Bool {
        !meaningfulWin.isEmpty && !frictionPoint.isEmpty && !thingToLetGo.isEmpty && !tomorrowPriority.isEmpty
    }
}

// MARK: - Goal Model
@Model
final class GoalData {
    @Attribute(.unique) var id: UUID
    var title: String
    var goalDescription: String
    var category: String
    var timeframe: String
    var progress: Int
    var whyItMatters: String
    var isActive: Bool
    var createdAt: Date
    var updatedAt: Date

    @Relationship(deleteRule: .cascade) var milestones: [MilestoneData]?

    init(
        id: UUID = UUID(),
        title: String = "",
        goalDescription: String = "",
        category: String = "Career",
        timeframe: String = "1 Year",
        progress: Int = 0,
        whyItMatters: String = "",
        isActive: Bool = true
    ) {
        self.id = id
        self.title = title
        self.goalDescription = goalDescription
        self.category = category
        self.timeframe = timeframe
        self.progress = progress
        self.whyItMatters = whyItMatters
        self.isActive = isActive
        self.createdAt = Date()
        self.updatedAt = Date()
        self.milestones = []
    }
}

// MARK: - Milestone Model
@Model
final class MilestoneData {
    @Attribute(.unique) var id: UUID
    var title: String
    var isCompleted: Bool
    var targetDate: Date?
    var completedDate: Date?

    @Relationship(inverse: \GoalData.milestones) var goal: GoalData?

    init(
        id: UUID = UUID(),
        title: String = "",
        isCompleted: Bool = false,
        targetDate: Date? = nil
    ) {
        self.id = id
        self.title = title
        self.isCompleted = isCompleted
        self.targetDate = targetDate
    }
}

// MARK: - Weekly Review Model
@Model
final class WeeklyReviewData {
    @Attribute(.unique) var id: UUID
    var weekStartDate: Date
    var movedTheNeedle: [String]
    var wasNoise: [String]
    var timeLeaks: [String]
    var strategicInsight: String
    var adjustmentForNextWeek: String
    var dailyEnergies: [Int]
    var relationships: String
    var overallRating: Int
    var summaryWord: String
    var aiInsights: String?
    var createdAt: Date

    init(
        id: UUID = UUID(),
        weekStartDate: Date = Date()
    ) {
        self.id = id
        self.weekStartDate = weekStartDate
        self.movedTheNeedle = []
        self.wasNoise = []
        self.timeLeaks = []
        self.strategicInsight = ""
        self.adjustmentForNextWeek = ""
        self.dailyEnergies = Array(repeating: 5, count: 7)
        self.relationships = ""
        self.overallRating = 5
        self.summaryWord = ""
        self.createdAt = Date()
    }
}

// MARK: - Insight Model
@Model
final class InsightData {
    @Attribute(.unique) var id: UUID
    var content: String
    var category: String // Pattern, Lesson, Strength, BlindSpot, Quote, Decision
    var source: String
    var isFromAI: Bool
    var createdAt: Date

    init(
        id: UUID = UUID(),
        content: String = "",
        category: String = "Pattern",
        source: String = "",
        isFromAI: Bool = false
    ) {
        self.id = id
        self.content = content
        self.category = category
        self.source = source
        self.isFromAI = isFromAI
        self.createdAt = Date()
    }
}

// MARK: - North Star Model
@Model
final class NorthStarData {
    @Attribute(.unique) var id: UUID
    var greatLife: String
    var optimizingFor: String
    var wouldRegret: String
    var unwillingToSacrifice: String
    var whoBecoming: String
    var oneSentence: String
    var lastUpdated: Date

    init(id: UUID = UUID()) {
        self.id = id
        self.greatLife = ""
        self.optimizingFor = ""
        self.wouldRegret = ""
        self.unwillingToSacrifice = ""
        self.whoBecoming = ""
        self.oneSentence = ""
        self.lastUpdated = Date()
    }
}

// MARK: - Life Map Scores Model
@Model
final class LifeMapData {
    @Attribute(.unique) var id: UUID
    var date: Date
    var career: Int
    var relationships: Int
    var health: Int
    var meaning: Int
    var finances: Int
    var fun: Int
    var notes: String?

    init(
        id: UUID = UUID(),
        date: Date = Date(),
        career: Int = 5,
        relationships: Int = 5,
        health: Int = 5,
        meaning: Int = 5,
        finances: Int = 5,
        fun: Int = 5
    ) {
        self.id = id
        self.date = date
        self.career = career
        self.relationships = relationships
        self.health = health
        self.meaning = meaning
        self.finances = finances
        self.fun = fun
    }

    var average: Double {
        Double(career + relationships + health + meaning + finances + fun) / 6.0
    }
}

// MARK: - Streak Model
@Model
final class StreakData {
    @Attribute(.unique) var id: UUID
    var currentStreak: Int
    var longestStreak: Int
    var lastCheckInDate: Date?
    var totalCheckIns: Int

    init(id: UUID = UUID()) {
        self.id = id
        self.currentStreak = 0
        self.longestStreak = 0
        self.totalCheckIns = 0
    }

    func recordCheckIn() {
        let today = Calendar.current.startOfDay(for: Date())

        if let lastDate = lastCheckInDate {
            let lastDay = Calendar.current.startOfDay(for: lastDate)
            let daysBetween = Calendar.current.dateComponents([.day], from: lastDay, to: today).day ?? 0

            if daysBetween == 1 {
                currentStreak += 1
            } else if daysBetween > 1 {
                currentStreak = 1
            }
        } else {
            currentStreak = 1
        }

        longestStreak = max(longestStreak, currentStreak)
        lastCheckInDate = today
        totalCheckIns += 1
    }
}

// MARK: - AI Conversation Model
@Model
final class AIConversationData {
    @Attribute(.unique) var id: UUID
    var question: String
    var response: String
    var context: String?
    var agentType: String // coaching, reflection, pattern, goal
    var createdAt: Date

    init(
        id: UUID = UUID(),
        question: String = "",
        response: String = "",
        context: String? = nil,
        agentType: String = "coaching"
    ) {
        self.id = id
        self.question = question
        self.response = response
        self.context = context
        self.agentType = agentType
        self.createdAt = Date()
    }
}

// MARK: - Model Container Configuration
extension ModelContainer {
    static var appContainer: ModelContainer {
        let schema = Schema([
            CheckInData.self,
            GoalData.self,
            MilestoneData.self,
            WeeklyReviewData.self,
            InsightData.self,
            NorthStarData.self,
            LifeMapData.self,
            StreakData.self,
            AIConversationData.self,
        ])

        let configuration = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: false,
            cloudKitDatabase: .none // Keep local only for privacy
        )

        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Failed to create model container: \(error)")
        }
    }
}
