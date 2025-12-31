import SwiftUI

@main
struct CEOProductivityOSApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var dataManager = DataManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(dataManager)
                .preferredColorScheme(appState.isDarkMode ? .dark : .light)
        }
    }
}

// MARK: - App State
class AppState: ObservableObject {
    @Published var isDarkMode: Bool = false
    @Published var hasCompletedOnboarding: Bool = false
    @Published var userName: String = ""
    @Published var currentTab: Tab = .home

    enum Tab: String, CaseIterable {
        case home = "Home"
        case checkIn = "Check-In"
        case reviews = "Reviews"
        case goals = "Goals"
        case insights = "Insights"
    }

    init() {
        loadState()
    }

    func loadState() {
        isDarkMode = UserDefaults.standard.bool(forKey: "isDarkMode")
        hasCompletedOnboarding = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding")
        userName = UserDefaults.standard.string(forKey: "userName") ?? ""
    }

    func saveState() {
        UserDefaults.standard.set(isDarkMode, forKey: "isDarkMode")
        UserDefaults.standard.set(hasCompletedOnboarding, forKey: "hasCompletedOnboarding")
        UserDefaults.standard.set(userName, forKey: "userName")
    }
}
