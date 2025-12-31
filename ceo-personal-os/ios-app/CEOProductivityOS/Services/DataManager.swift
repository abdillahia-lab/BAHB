import Foundation
import Combine

class DataManager: ObservableObject {
    // MARK: - Published Properties
    @Published var dailyCheckIns: [DailyCheckIn] = []
    @Published var weeklyReviews: [WeeklyReview] = []
    @Published var quarterlyReviews: [QuarterlyReview] = []
    @Published var goals: [Goal] = []
    @Published var insights: [Insight] = []
    @Published var northStar: NorthStar = NorthStar()
    @Published var streak: Streak = Streak()
    @Published var lifeMapHistory: [Date: LifeMapScores] = [:]

    // MARK: - Private Properties
    private let fileManager = FileManager.default
    private var documentsDirectory: URL {
        fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }

    // MARK: - Initialization
    init() {
        loadAllData()
    }

    // MARK: - Daily Check-In Methods
    func todaysCheckIn() -> DailyCheckIn? {
        let today = Calendar.current.startOfDay(for: Date())
        return dailyCheckIns.first { Calendar.current.isDate($0.date, inSameDayAs: today) }
    }

    func saveCheckIn(_ checkIn: DailyCheckIn) {
        if let index = dailyCheckIns.firstIndex(where: { $0.id == checkIn.id }) {
            dailyCheckIns[index] = checkIn
        } else {
            dailyCheckIns.append(checkIn)
            streak.recordCheckIn()
        }
        saveDailyCheckIns()
        saveStreak()
    }

    func checkInsForWeek(containing date: Date) -> [DailyCheckIn] {
        let calendar = Calendar.current
        guard let weekStart = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)),
              let weekEnd = calendar.date(byAdding: .day, value: 6, to: weekStart) else {
            return []
        }
        return dailyCheckIns.filter { $0.date >= weekStart && $0.date <= weekEnd }
    }

    func averageEnergy(for days: Int = 7) -> Double {
        let recentCheckIns = dailyCheckIns
            .sorted { $0.date > $1.date }
            .prefix(days)
        guard !recentCheckIns.isEmpty else { return 0 }
        return Double(recentCheckIns.reduce(0) { $0 + $1.energyLevel }) / Double(recentCheckIns.count)
    }

    // MARK: - Weekly Review Methods
    func currentWeekReview() -> WeeklyReview? {
        let weekStart = Calendar.current.date(from: Calendar.current.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date()))!
        return weeklyReviews.first { Calendar.current.isDate($0.weekStartDate, inSameDayAs: weekStart) }
    }

    func saveWeeklyReview(_ review: WeeklyReview) {
        if let index = weeklyReviews.firstIndex(where: { $0.id == review.id }) {
            weeklyReviews[index] = review
        } else {
            weeklyReviews.append(review)
        }
        saveWeeklyReviews()
    }

    // MARK: - Quarterly Review Methods
    func currentQuarterReview() -> QuarterlyReview? {
        let now = Date()
        let quarter = (Calendar.current.component(.month, from: now) - 1) / 3 + 1
        let year = Calendar.current.component(.year, from: now)
        return quarterlyReviews.first { $0.quarter == quarter && $0.year == year }
    }

    func saveQuarterlyReview(_ review: QuarterlyReview) {
        if let index = quarterlyReviews.firstIndex(where: { $0.id == review.id }) {
            quarterlyReviews[index] = review
        } else {
            quarterlyReviews.append(review)
        }
        saveQuarterlyReviews()
    }

    // MARK: - Goal Methods
    func saveGoal(_ goal: Goal) {
        if let index = goals.firstIndex(where: { $0.id == goal.id }) {
            goals[index] = goal
        } else {
            goals.append(goal)
        }
        saveGoals()
    }

    func deleteGoal(_ goal: Goal) {
        goals.removeAll { $0.id == goal.id }
        saveGoals()
    }

    func goalsForTimeframe(_ timeframe: GoalTimeframe) -> [Goal] {
        goals.filter { $0.timeframe == timeframe && $0.isActive }
    }

    // MARK: - Insight Methods
    func saveInsight(_ insight: Insight) {
        if let index = insights.firstIndex(where: { $0.id == insight.id }) {
            insights[index] = insight
        } else {
            insights.append(insight)
        }
        saveInsights()
    }

    func deleteInsight(_ insight: Insight) {
        insights.removeAll { $0.id == insight.id }
        saveInsights()
    }

    // MARK: - North Star Methods
    func saveNorthStar(_ northStar: NorthStar) {
        self.northStar = northStar
        saveNorthStarToFile()
    }

    // MARK: - Life Map Methods
    func saveLifeMapScores(_ scores: LifeMapScores) {
        let today = Calendar.current.startOfDay(for: Date())
        lifeMapHistory[today] = scores
        saveLifeMapHistory()
    }

    func latestLifeMapScores() -> LifeMapScores? {
        lifeMapHistory.sorted { $0.key > $1.key }.first?.value
    }

    // MARK: - Statistics
    func checkInCompletionRate(days: Int = 30) -> Double {
        let calendar = Calendar.current
        guard let startDate = calendar.date(byAdding: .day, value: -days, to: Date()) else { return 0 }
        let checkInsInPeriod = dailyCheckIns.filter { $0.date >= startDate }.count
        return Double(checkInsInPeriod) / Double(days)
    }

    func energyTrend(days: Int = 14) -> [Double] {
        let calendar = Calendar.current
        var trend: [Double] = []

        for dayOffset in (0..<days).reversed() {
            guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: Date()) else { continue }
            if let checkIn = dailyCheckIns.first(where: { calendar.isDate($0.date, inSameDayAs: date) }) {
                trend.append(Double(checkIn.energyLevel))
            }
        }
        return trend
    }

    // MARK: - Persistence
    private func loadAllData() {
        loadDailyCheckIns()
        loadWeeklyReviews()
        loadQuarterlyReviews()
        loadGoals()
        loadInsights()
        loadNorthStarFromFile()
        loadStreak()
        loadLifeMapHistory()
    }

    private func saveDailyCheckIns() {
        save(dailyCheckIns, to: "daily_checkins.json")
    }

    private func loadDailyCheckIns() {
        dailyCheckIns = load("daily_checkins.json") ?? []
    }

    private func saveWeeklyReviews() {
        save(weeklyReviews, to: "weekly_reviews.json")
    }

    private func loadWeeklyReviews() {
        weeklyReviews = load("weekly_reviews.json") ?? []
    }

    private func saveQuarterlyReviews() {
        save(quarterlyReviews, to: "quarterly_reviews.json")
    }

    private func loadQuarterlyReviews() {
        quarterlyReviews = load("quarterly_reviews.json") ?? []
    }

    private func saveGoals() {
        save(goals, to: "goals.json")
    }

    private func loadGoals() {
        goals = load("goals.json") ?? []
    }

    private func saveInsights() {
        save(insights, to: "insights.json")
    }

    private func loadInsights() {
        insights = load("insights.json") ?? []
    }

    private func saveNorthStarToFile() {
        save(northStar, to: "north_star.json")
    }

    private func loadNorthStarFromFile() {
        northStar = load("north_star.json") ?? NorthStar()
    }

    private func saveStreak() {
        save(streak, to: "streak.json")
    }

    private func loadStreak() {
        streak = load("streak.json") ?? Streak()
    }

    private func saveLifeMapHistory() {
        // Convert to array for JSON encoding
        let array = lifeMapHistory.map { DateScorePair(date: $0.key, scores: $0.value) }
        save(array, to: "life_map_history.json")
    }

    private func loadLifeMapHistory() {
        let array: [DateScorePair]? = load("life_map_history.json")
        lifeMapHistory = Dictionary(uniqueKeysWithValues: (array ?? []).map { ($0.date, $0.scores) })
    }

    private func save<T: Encodable>(_ data: T, to filename: String) {
        let url = documentsDirectory.appendingPathComponent(filename)
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let encoded = try encoder.encode(data)
            try encoded.write(to: url)
        } catch {
            print("Error saving \(filename): \(error)")
        }
    }

    private func load<T: Decodable>(_ filename: String) -> T? {
        let url = documentsDirectory.appendingPathComponent(filename)
        guard fileManager.fileExists(atPath: url.path) else { return nil }
        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode(T.self, from: data)
        } catch {
            print("Error loading \(filename): \(error)")
            return nil
        }
    }
}

// Helper for Life Map history persistence
struct DateScorePair: Codable {
    let date: Date
    let scores: LifeMapScores
}
