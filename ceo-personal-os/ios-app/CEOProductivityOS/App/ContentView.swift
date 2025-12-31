import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var dataManager: DataManager

    var body: some View {
        Group {
            if !appState.hasCompletedOnboarding {
                OnboardingView()
            } else {
                MainTabView()
            }
        }
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
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

            InsightsView()
                .tabItem {
                    Label("Insights", systemImage: "brain.head.profile")
                }
                .tag(4)
        }
        .tint(Color.accentColor)
    }
}

// MARK: - Onboarding View
struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @State private var currentPage = 0
    @State private var name = ""

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color("BackgroundTop"), Color("BackgroundBottom")],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 24) {
                TabView(selection: $currentPage) {
                    WelcomePage()
                        .tag(0)

                    PhilosophyPage()
                        .tag(1)

                    NameInputPage(name: $name)
                        .tag(2)

                    GetStartedPage(name: name)
                        .tag(3)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                // Page Indicator
                HStack(spacing: 8) {
                    ForEach(0..<4) { index in
                        Circle()
                            .fill(currentPage == index ? Color.primary : Color.secondary.opacity(0.3))
                            .frame(width: 8, height: 8)
                            .animation(.easeInOut, value: currentPage)
                    }
                }
                .padding(.bottom, 20)

                // Navigation Buttons
                HStack(spacing: 16) {
                    if currentPage > 0 {
                        Button("Back") {
                            withAnimation { currentPage -= 1 }
                        }
                        .buttonStyle(.bordered)
                    }

                    Spacer()

                    if currentPage < 3 {
                        Button("Continue") {
                            withAnimation { currentPage += 1 }
                        }
                        .buttonStyle(.borderedProminent)
                    } else {
                        Button("Begin Your Journey") {
                            appState.userName = name
                            appState.hasCompletedOnboarding = true
                            appState.saveState()
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
}

struct WelcomePage: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "compass.drawing")
                .font(.system(size: 80))
                .foregroundStyle(.primary)

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

struct PhilosophyPage: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(alignment: .leading, spacing: 20) {
                PhilosophyItem(
                    icon: "minus.circle",
                    title: "Less is more",
                    description: "No dashboards. No metrics. Just clarity."
                )

                PhilosophyItem(
                    icon: "person.circle",
                    title: "You are the system",
                    description: "These prompts are mirrors, not managers."
                )

                PhilosophyItem(
                    icon: "chart.line.uptrend.xyaxis",
                    title: "Compounding insight",
                    description: "Reflections accumulate into wisdom."
                )
            }
            .padding(.horizontal)

            Spacer()
        }
    }
}

struct PhilosophyItem: View {
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

struct NameInputPage: View {
    @Binding var name: String

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("What should I call you?")
                .font(.title2)
                .fontWeight(.semibold)

            TextField("Your first name", text: $name)
                .textFieldStyle(.roundedBorder)
                .padding(.horizontal, 48)
                .font(.title3)
                .multilineTextAlignment(.center)

            Text("This is for personalization.\nNo data leaves your device.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Spacer()
        }
    }
}

struct GetStartedPage: View {
    let name: String

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 60))
                .foregroundStyle(.green)

            Text("Welcome, \(name.isEmpty ? "there" : name)")
                .font(.title)
                .fontWeight(.bold)

            VStack(alignment: .leading, spacing: 16) {
                FeatureItem(icon: "clock", text: "5-minute daily check-ins")
                FeatureItem(icon: "calendar", text: "Weekly & quarterly reviews")
                FeatureItem(icon: "target", text: "Goal tracking & alignment")
                FeatureItem(icon: "brain", text: "Pattern insights over time")
            }
            .padding(.horizontal, 32)

            Spacer()
        }
    }
}

struct FeatureItem: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
            Text(text)
                .font(.body)
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
        .environmentObject(DataManager())
}
