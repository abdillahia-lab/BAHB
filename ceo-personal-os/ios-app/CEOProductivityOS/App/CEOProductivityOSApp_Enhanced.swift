import SwiftUI
import SwiftData
import TipKit

// MARK: - Enhanced App Entry Point (iOS 17+)

@main
struct CEOProductivityOSApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var liveActivityManager = LiveActivityManager.shared

    // SwiftData container
    var modelContainer: ModelContainer

    init() {
        // Configure TipKit
        TipConfiguration.configure()

        // Initialize SwiftData
        do {
            modelContainer = try ModelContainer(
                for: CheckInData.self,
                GoalData.self,
                MilestoneData.self,
                WeeklyReviewData.self,
                InsightData.self,
                NorthStarData.self,
                LifeMapData.self,
                StreakData.self,
                AIConversationData.self,
                configurations: ModelConfiguration(isStoredInMemoryOnly: false)
            )
        } catch {
            fatalError("Failed to initialize SwiftData: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            EnhancedContentView()
                .environmentObject(appState)
                .environmentObject(liveActivityManager)
                .modelContainer(modelContainer)
                .preferredColorScheme(appState.isDarkMode ? .dark : .light)
                .onOpenURL { url in
                    handleDeepLink(url)
                }
        }
    }

    private func handleDeepLink(_ url: URL) {
        // Handle deep links from widgets, shortcuts, etc.
        guard url.scheme == "ceoos" else { return }

        switch url.host {
        case "checkin":
            appState.currentTab = .checkIn
        case "goals":
            appState.currentTab = .goals
        case "coach":
            appState.currentTab = .insights
        default:
            break
        }
    }
}

// MARK: - Enhanced App State

class AppState: ObservableObject {
    @Published var isDarkMode: Bool = false
    @Published var hasCompletedOnboarding: Bool = false
    @Published var userName: String = ""
    @Published var currentTab: Tab = .home
    @Published var focusMode: Bool = false

    enum Tab: String, CaseIterable {
        case home = "Home"
        case checkIn = "Check-In"
        case reviews = "Reviews"
        case goals = "Goals"
        case insights = "Coach"
    }

    init() {
        loadState()
    }

    func loadState() {
        let defaults = UserDefaults.standard
        isDarkMode = defaults.bool(forKey: "isDarkMode")
        hasCompletedOnboarding = defaults.bool(forKey: "hasCompletedOnboarding")
        userName = defaults.string(forKey: "userName") ?? ""
        focusMode = defaults.bool(forKey: "focusMinimalMode")
    }

    func saveState() {
        let defaults = UserDefaults.standard
        defaults.set(isDarkMode, forKey: "isDarkMode")
        defaults.set(hasCompletedOnboarding, forKey: "hasCompletedOnboarding")
        defaults.set(userName, forKey: "userName")
    }
}

// MARK: - Enhanced Content View

struct EnhancedContentView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        Group {
            if !appState.hasCompletedOnboarding {
                EnhancedOnboardingView()
            } else {
                EnhancedMainTabView()
            }
        }
    }
}

// MARK: - Enhanced Main Tab View

struct EnhancedMainTabView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

            DailyCheckInView()
                .tabItem {
                    Label("Check-In", systemImage: "checkmark.circle.fill")
                }
                .tag(1)

            ReviewsHubView()
                .tabItem {
                    Label("Reviews", systemImage: "calendar")
                }
                .tag(2)

            GoalsView()
                .tabItem {
                    Label("Goals", systemImage: "target")
                }
                .tag(3)

            AICoachView()
                .tabItem {
                    Label("Coach", systemImage: "brain.head.profile")
                }
                .tag(4)
        }
        .tint(Color.accentColor)
        .onChange(of: appState.currentTab) { _, newTab in
            switch newTab {
            case .home: selectedTab = 0
            case .checkIn: selectedTab = 1
            case .reviews: selectedTab = 2
            case .goals: selectedTab = 3
            case .insights: selectedTab = 4
            }
        }
    }
}

// MARK: - Enhanced Onboarding

struct EnhancedOnboardingView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var liveActivityManager: LiveActivityManager
    @State private var currentPage = 0
    @State private var name = ""

    var body: some View {
        ZStack {
            // Gradient Background
            LinearGradient(
                colors: [Color("BackgroundTop"), Color("BackgroundBottom")],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 24) {
                // Progress
                HStack(spacing: 8) {
                    ForEach(0..<5) { index in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(currentPage >= index ? Color.primary : Color.secondary.opacity(0.3))
                            .frame(height: 4)
                    }
                }
                .padding(.horizontal, 32)
                .padding(.top, 20)

                // Content
                TabView(selection: $currentPage) {
                    OnboardingWelcome()
                        .tag(0)

                    OnboardingPhilosophy()
                        .tag(1)

                    OnboardingFeatures()
                        .tag(2)

                    OnboardingName(name: $name)
                        .tag(3)

                    OnboardingReady(name: name)
                        .tag(4)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                // Navigation
                HStack(spacing: 16) {
                    if currentPage > 0 {
                        Button("Back") {
                            withAnimation { currentPage -= 1 }
                        }
                        .buttonStyle(.bordered)
                    }

                    Spacer()

                    if currentPage < 4 {
                        Button("Continue") {
                            withAnimation { currentPage += 1 }
                        }
                        .buttonStyle(.borderedProminent)
                    } else {
                        Button("Begin") {
                            completeOnboarding()
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(name.isEmpty)
                    }
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 32)
            }
        }
    }

    private func completeOnboarding() {
        appState.userName = name
        appState.hasCompletedOnboarding = true
        appState.saveState()

        // Start Live Activity
        liveActivityManager.startTracking(
            userName: name,
            energy: 7,
            priority: "Complete first check-in",
            streak: 0
        )
    }
}

struct OnboardingWelcome: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            // Animated compass icon
            Image(systemName: "compass.drawing")
                .font(.system(size: 80))
                .foregroundStyle(.primary)
                .symbolEffect(.pulse)

            Text("CEO Personal OS")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("A private operating system\nfor clarity, not complexity.")
                .font(.title3)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)

            Spacer()
        }
        .padding()
    }
}

struct OnboardingPhilosophy: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(alignment: .leading, spacing: 20) {
                OnboardingItem(
                    icon: "minus.circle",
                    title: "Less is more",
                    description: "No dashboards. No metrics. Just clarity."
                )

                OnboardingItem(
                    icon: "person.circle",
                    title: "You are the system",
                    description: "Prompts are mirrors, not managers."
                )

                OnboardingItem(
                    icon: "chart.line.uptrend.xyaxis",
                    title: "Compounding insight",
                    description: "Reflections accumulate into wisdom."
                )

                OnboardingItem(
                    icon: "brain.head.profile",
                    title: "AI coaching",
                    description: "On-demand guidance, pattern detection, goal alignment."
                )
            }
            .padding(.horizontal)

            Spacer()
        }
    }
}

struct OnboardingItem: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(.primary)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct OnboardingFeatures: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("What You'll Get")
                .font(.title2)
                .fontWeight(.semibold)

            VStack(spacing: 16) {
                FeatureRow(icon: "clock", title: "5-min daily check-ins", color: .blue)
                FeatureRow(icon: "calendar", title: "Weekly & quarterly reviews", color: .purple)
                FeatureRow(icon: "target", title: "Goal tracking & alignment", color: .green)
                FeatureRow(icon: "brain", title: "AI coaching & patterns", color: .orange)
                FeatureRow(icon: "square.grid.2x2", title: "Home screen widgets", color: .pink)
                FeatureRow(icon: "waveform", title: "Siri shortcuts", color: .indigo)
            }
            .padding(.horizontal, 32)

            Spacer()
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let color: Color

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .frame(width: 24)

            Text(title)
                .font(.body)

            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(.green)
        }
    }
}

struct OnboardingName: View {
    @Binding var name: String

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("What should I call you?")
                .font(.title2)
                .fontWeight(.semibold)

            TextField("Your first name", text: $name)
                .textFieldStyle(.roundedBorder)
                .font(.title3)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 48)

            Text("This personalizes your experience.\nAll data stays on your device.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Spacer()
        }
    }
}

struct OnboardingReady: View {
    let name: String

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 60))
                .foregroundStyle(.green)
                .symbolEffect(.bounce)

            Text("Welcome, \(name)")
                .font(.title)
                .fontWeight(.bold)

            Text("Your personal operating system is ready.\n\nStart with a daily check-in—\njust 5 minutes for clarity.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Spacer()
        }
    }
}

#Preview {
    EnhancedContentView()
        .environmentObject(AppState())
        .environmentObject(LiveActivityManager.shared)
}
