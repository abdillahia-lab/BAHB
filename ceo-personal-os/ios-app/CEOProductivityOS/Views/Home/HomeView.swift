import SwiftUI

struct HomeView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var dataManager: DataManager
    @State private var showingNorthStar = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Greeting Section
                    GreetingCard(userName: appState.userName)

                    // Streak and Quick Stats
                    StatsRow(dataManager: dataManager)

                    // Today's Check-In Status
                    TodayStatusCard(dataManager: dataManager)

                    // Life Map Overview
                    LifeMapMiniCard(dataManager: dataManager)

                    // Quick Actions
                    QuickActionsGrid()

                    // North Star Reminder
                    NorthStarCard(northStar: dataManager.northStar)
                        .onTapGesture { showingNorthStar = true }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showingNorthStar) {
                NorthStarEditorView()
            }
        }
    }
}

// MARK: - Greeting Card
struct GreetingCard: View {
    let userName: String

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    private var dateString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d"
        return formatter.string(from: Date())
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(greeting), \(userName)")
                .font(.title2)
                .fontWeight(.bold)

            Text(dateString)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }
}

// MARK: - Stats Row
struct StatsRow: View {
    @ObservedObject var dataManager: DataManager

    var body: some View {
        HStack(spacing: 16) {
            StatCard(
                title: "Streak",
                value: "\(dataManager.streak.currentStreak)",
                subtitle: "days",
                icon: "flame.fill",
                color: .orange
            )

            StatCard(
                title: "Energy",
                value: String(format: "%.1f", dataManager.averageEnergy()),
                subtitle: "avg",
                icon: "bolt.fill",
                color: .yellow
            )

            StatCard(
                title: "Consistency",
                value: "\(Int(dataManager.checkInCompletionRate() * 100))%",
                subtitle: "30 days",
                icon: "chart.bar.fill",
                color: .green
            )
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            Text(subtitle)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Today Status Card
struct TodayStatusCard: View {
    @ObservedObject var dataManager: DataManager

    var hasCheckedIn: Bool {
        dataManager.todaysCheckIn() != nil
    }

    var body: some View {
        NavigationLink(destination: DailyCheckInView()) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: hasCheckedIn ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(hasCheckedIn ? .green : .secondary)

                        Text(hasCheckedIn ? "Today's Check-In Complete" : "Daily Check-In")
                            .font(.headline)
                    }

                    if hasCheckedIn, let checkIn = dataManager.todaysCheckIn() {
                        Text("Energy: \(checkIn.energyLevel)/10")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    } else {
                        Text("5 minutes to reflect and align")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(16)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Life Map Mini Card
struct LifeMapMiniCard: View {
    @ObservedObject var dataManager: DataManager

    var scores: LifeMapScores {
        dataManager.latestLifeMapScores() ?? LifeMapScores()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Life Map")
                    .font(.headline)
                Spacer()
                Text("Avg: \(String(format: "%.1f", scores.average))")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 8) {
                LifeMapMiniBar(label: "Career", value: scores.career, color: .blue)
                LifeMapMiniBar(label: "Relations", value: scores.relationships, color: .pink)
                LifeMapMiniBar(label: "Health", value: scores.health, color: .green)
                LifeMapMiniBar(label: "Meaning", value: scores.meaning, color: .purple)
                LifeMapMiniBar(label: "Finance", value: scores.finances, color: .yellow)
                LifeMapMiniBar(label: "Fun", value: scores.fun, color: .orange)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }
}

struct LifeMapMiniBar: View {
    let label: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(.systemGray5))
                    .frame(width: 24, height: 60)

                RoundedRectangle(cornerRadius: 4)
                    .fill(color)
                    .frame(width: 24, height: CGFloat(value) * 6)
            }

            Text("\(value)")
                .font(.caption2)
                .fontWeight(.medium)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Quick Actions Grid
struct QuickActionsGrid: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                QuickActionCard(title: "Weekly Review", icon: "calendar.badge.clock", color: .blue)
                QuickActionCard(title: "Add Insight", icon: "lightbulb.fill", color: .yellow)
                QuickActionCard(title: "Update Goals", icon: "target", color: .green)
                QuickActionCard(title: "Frameworks", icon: "rectangle.3.group", color: .purple)
            }
        }
    }
}

struct QuickActionCard: View {
    let title: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)

            Text(title)
                .font(.caption)
                .fontWeight(.medium)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - North Star Card
struct NorthStarCard: View {
    let northStar: NorthStar

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "star.fill")
                    .foregroundStyle(.yellow)
                Text("North Star")
                    .font(.headline)
                Spacer()
                Image(systemName: "pencil")
                    .foregroundStyle(.secondary)
            }

            if northStar.oneSentence.isEmpty {
                Text("Tap to define your North Star—the direction that anchors everything else.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } else {
                Text(northStar.oneSentence)
                    .font(.subheadline)
                    .italic()
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }
}

// MARK: - North Star Editor
struct NorthStarEditorView: View {
    @EnvironmentObject var dataManager: DataManager
    @Environment(\.dismiss) var dismiss
    @State private var northStar: NorthStar = NorthStar()

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("These five questions anchor everything else in this system. Answer them honestly.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Section("What does a great life look like for you?") {
                    TextEditor(text: $northStar.greatLife)
                        .frame(minHeight: 100)
                }

                Section("What are you optimizing for right now?") {
                    TextEditor(text: $northStar.optimizingFor)
                        .frame(minHeight: 80)
                }

                Section("What would you regret not doing?") {
                    TextEditor(text: $northStar.wouldRegret)
                        .frame(minHeight: 80)
                }

                Section("What are you unwilling to sacrifice?") {
                    TextEditor(text: $northStar.unwillingToSacrifice)
                        .frame(minHeight: 80)
                }

                Section("Who are you becoming?") {
                    TextEditor(text: $northStar.whoBecoming)
                        .frame(minHeight: 80)
                }

                Section("Your direction in one sentence") {
                    TextField("The one sentence version", text: $northStar.oneSentence, axis: .vertical)
                        .lineLimit(2...4)
                }
            }
            .navigationTitle("North Star")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        northStar.lastUpdated = Date()
                        dataManager.saveNorthStar(northStar)
                        dismiss()
                    }
                }
            }
            .onAppear {
                northStar = dataManager.northStar
            }
        }
    }
}

#Preview {
    HomeView()
        .environmentObject(AppState())
        .environmentObject(DataManager())
}
