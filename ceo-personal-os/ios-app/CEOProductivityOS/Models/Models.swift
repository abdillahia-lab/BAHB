import Foundation

// MARK: - Daily Check-In
struct DailyCheckIn: Identifiable, Codable {
    let id: UUID
    let date: Date
    var energyLevel: Int // 1-10
    var meaningfulWin: String
    var frictionPoint: String
    var thingToLetGo: String
    var tomorrowPriority: String
    var gratitude: String?
    var insight: String?
    var moodWord: String?

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
        moodWord: String? = nil
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
    }

    var isComplete: Bool {
        !meaningfulWin.isEmpty && !frictionPoint.isEmpty && !thingToLetGo.isEmpty && !tomorrowPriority.isEmpty
    }
}

// MARK: - Weekly Review
struct WeeklyReview: Identifiable, Codable {
    let id: UUID
    let weekStartDate: Date
    var movedTheNeedle: [String]
    var wasNoise: [String]
    var timeLeaks: [String]
    var strategicInsight: String
    var adjustmentForNextWeek: String
    var dailyEnergies: [Int] // 7 values for each day
    var relationships: String
    var overallRating: Int
    var summaryWord: String

    init(
        id: UUID = UUID(),
        weekStartDate: Date = Date(),
        movedTheNeedle: [String] = [],
        wasNoise: [String] = [],
        timeLeaks: [String] = [],
        strategicInsight: String = "",
        adjustmentForNextWeek: String = "",
        dailyEnergies: [Int] = Array(repeating: 5, count: 7),
        relationships: String = "",
        overallRating: Int = 5,
        summaryWord: String = ""
    ) {
        self.id = id
        self.weekStartDate = weekStartDate
        self.movedTheNeedle = movedTheNeedle
        self.wasNoise = wasNoise
        self.timeLeaks = timeLeaks
        self.strategicInsight = strategicInsight
        self.adjustmentForNextWeek = adjustmentForNextWeek
        self.dailyEnergies = dailyEnergies
        self.relationships = relationships
        self.overallRating = overallRating
        self.summaryWord = summaryWord
    }
}

// MARK: - Quarterly Review
struct QuarterlyReview: Identifiable, Codable {
    let id: UUID
    let quarter: Int // 1-4
    let year: Int
    var narrative: String
    var highlights: [String]
    var lowlights: [String]
    var goalProgress: [GoalProgress]
    var lifeMapScores: LifeMapScores
    var keyLessons: [String]
    var courseCorrections: String
    var prioritiesForNextQuarter: [String]

    init(
        id: UUID = UUID(),
        quarter: Int = 1,
        year: Int = Calendar.current.component(.year, from: Date()),
        narrative: String = "",
        highlights: [String] = [],
        lowlights: [String] = [],
        goalProgress: [GoalProgress] = [],
        lifeMapScores: LifeMapScores = LifeMapScores(),
        keyLessons: [String] = [],
        courseCorrections: String = "",
        prioritiesForNextQuarter: [String] = []
    ) {
        self.id = id
        self.quarter = quarter
        self.year = year
        self.narrative = narrative
        self.highlights = highlights
        self.lowlights = lowlights
        self.goalProgress = goalProgress
        self.lifeMapScores = lifeMapScores
        self.keyLessons = keyLessons
        self.courseCorrections = courseCorrections
        self.prioritiesForNextQuarter = prioritiesForNextQuarter
    }
}

// MARK: - Goal
struct Goal: Identifiable, Codable {
    let id: UUID
    var title: String
    var description: String
    var category: GoalCategory
    var timeframe: GoalTimeframe
    var progress: Int // 0-100
    var milestones: [Milestone]
    var whyItMatters: String
    var isActive: Bool
    let createdAt: Date

    init(
        id: UUID = UUID(),
        title: String = "",
        description: String = "",
        category: GoalCategory = .career,
        timeframe: GoalTimeframe = .oneYear,
        progress: Int = 0,
        milestones: [Milestone] = [],
        whyItMatters: String = "",
        isActive: Bool = true,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.category = category
        self.timeframe = timeframe
        self.progress = progress
        self.milestones = milestones
        self.whyItMatters = whyItMatters
        self.isActive = isActive
        self.createdAt = createdAt
    }
}

struct Milestone: Identifiable, Codable {
    let id: UUID
    var title: String
    var isCompleted: Bool
    var targetDate: Date?

    init(id: UUID = UUID(), title: String = "", isCompleted: Bool = false, targetDate: Date? = nil) {
        self.id = id
        self.title = title
        self.isCompleted = isCompleted
        self.targetDate = targetDate
    }
}

struct GoalProgress: Identifiable, Codable {
    let id: UUID
    let goalId: UUID
    var goalTitle: String
    var percentComplete: Int
    var notes: String

    init(id: UUID = UUID(), goalId: UUID, goalTitle: String = "", percentComplete: Int = 0, notes: String = "") {
        self.id = id
        self.goalId = goalId
        self.goalTitle = goalTitle
        self.percentComplete = percentComplete
        self.notes = notes
    }
}

enum GoalCategory: String, Codable, CaseIterable {
    case career = "Career"
    case relationships = "Relationships"
    case health = "Health"
    case meaning = "Meaning"
    case finances = "Finances"
    case fun = "Fun"
    case growth = "Growth"

    var icon: String {
        switch self {
        case .career: return "briefcase.fill"
        case .relationships: return "heart.fill"
        case .health: return "heart.text.square.fill"
        case .meaning: return "sparkles"
        case .finances: return "dollarsign.circle.fill"
        case .fun: return "star.fill"
        case .growth: return "leaf.fill"
        }
    }

    var color: String {
        switch self {
        case .career: return "blue"
        case .relationships: return "pink"
        case .health: return "green"
        case .meaning: return "purple"
        case .finances: return "yellow"
        case .fun: return "orange"
        case .growth: return "teal"
        }
    }
}

enum GoalTimeframe: String, Codable, CaseIterable {
    case oneYear = "1 Year"
    case threeYear = "3 Years"
    case tenYear = "10 Years"
}

// MARK: - Life Map
struct LifeMapScores: Codable {
    var career: Int
    var relationships: Int
    var health: Int
    var meaning: Int
    var finances: Int
    var fun: Int

    init(
        career: Int = 5,
        relationships: Int = 5,
        health: Int = 5,
        meaning: Int = 5,
        finances: Int = 5,
        fun: Int = 5
    ) {
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

// MARK: - North Star
struct NorthStar: Codable {
    var greatLife: String
    var optimizingFor: String
    var wouldRegret: String
    var unwillingToSacrifice: String
    var whoBecoming: String
    var oneSentence: String
    var lastUpdated: Date

    init(
        greatLife: String = "",
        optimizingFor: String = "",
        wouldRegret: String = "",
        unwillingToSacrifice: String = "",
        whoBecoming: String = "",
        oneSentence: String = "",
        lastUpdated: Date = Date()
    ) {
        self.greatLife = greatLife
        self.optimizingFor = optimizingFor
        self.wouldRegret = wouldRegret
        self.unwillingToSacrifice = unwillingToSacrifice
        self.whoBecoming = whoBecoming
        self.oneSentence = oneSentence
        self.lastUpdated = lastUpdated
    }
}

// MARK: - Memory / Insight
struct Insight: Identifiable, Codable {
    let id: UUID
    var content: String
    var category: InsightCategory
    var source: String
    let createdAt: Date

    init(
        id: UUID = UUID(),
        content: String = "",
        category: InsightCategory = .pattern,
        source: String = "",
        createdAt: Date = Date()
    ) {
        self.id = id
        self.content = content
        self.category = category
        self.source = source
        self.createdAt = createdAt
    }
}

enum InsightCategory: String, Codable, CaseIterable {
    case pattern = "Pattern"
    case lesson = "Lesson"
    case strength = "Strength"
    case blindSpot = "Blind Spot"
    case quote = "Quote"
    case decision = "Decision"
}

// MARK: - Streak
struct Streak: Codable {
    var currentStreak: Int
    var longestStreak: Int
    var lastCheckInDate: Date?

    init(currentStreak: Int = 0, longestStreak: Int = 0, lastCheckInDate: Date? = nil) {
        self.currentStreak = currentStreak
        self.longestStreak = longestStreak
        self.lastCheckInDate = lastCheckInDate
    }

    mutating func recordCheckIn() {
        let today = Calendar.current.startOfDay(for: Date())

        if let lastDate = lastCheckInDate {
            let lastDay = Calendar.current.startOfDay(for: lastDate)
            let daysBetween = Calendar.current.dateComponents([.day], from: lastDay, to: today).day ?? 0

            if daysBetween == 1 {
                // Consecutive day
                currentStreak += 1
            } else if daysBetween > 1 {
                // Streak broken
                currentStreak = 1
            }
            // If daysBetween == 0, already checked in today
        } else {
            currentStreak = 1
        }

        longestStreak = max(longestStreak, currentStreak)
        lastCheckInDate = today
    }
}
