import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var dataManager: DataManager
    @State private var showingExportSheet = false
    @State private var showingResetAlert = false

    var body: some View {
        NavigationStack {
            Form {
                // Profile Section
                Section {
                    HStack {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 50))
                            .foregroundStyle(.secondary)

                        VStack(alignment: .leading) {
                            TextField("Your Name", text: $appState.userName)
                                .font(.title3)
                                .fontWeight(.semibold)

                            Text("CEO Personal OS")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }

                // Appearance
                Section("Appearance") {
                    Toggle(isOn: $appState.isDarkMode) {
                        Label("Dark Mode", systemImage: "moon.fill")
                    }
                }

                // Statistics
                Section("Your Journey") {
                    StatRow(label: "Check-ins completed", value: "\(dataManager.dailyCheckIns.count)")
                    StatRow(label: "Current streak", value: "\(dataManager.streak.currentStreak) days")
                    StatRow(label: "Longest streak", value: "\(dataManager.streak.longestStreak) days")
                    StatRow(label: "Weekly reviews", value: "\(dataManager.weeklyReviews.count)")
                    StatRow(label: "Goals tracked", value: "\(dataManager.goals.count)")
                    StatRow(label: "Insights captured", value: "\(dataManager.insights.count)")
                }

                // Frameworks Reference
                Section("Framework Credits") {
                    CreditRow(name: "Dr. Anthony Gustin", framework: "Annual Review")
                    CreditRow(name: "Tim Ferriss", framework: "Ideal Lifestyle Costing")
                    CreditRow(name: "Tony Robbins", framework: "Vivid Vision")
                    CreditRow(name: "Alex Lieberman", framework: "Life Map")
                    CreditRow(name: "Jeff Bezos", framework: "Regret Minimization")
                }

                // Data Management
                Section("Data") {
                    Button(action: { showingExportSheet = true }) {
                        Label("Export Data", systemImage: "square.and.arrow.up")
                    }

                    Button(role: .destructive, action: { showingResetAlert = true }) {
                        Label("Reset All Data", systemImage: "trash")
                    }
                }

                // About
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundStyle(.secondary)
                    }

                    Link(destination: URL(string: "https://github.com")!) {
                        Label("Documentation", systemImage: "book")
                    }
                }

                // Philosophy
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Philosophy")
                            .font(.headline)

                        Text("This system exists to serve you, not the other way around. If something doesn't work, change it. If something is missing, add it. The best personal operating system is the one you'll actually use.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 8)
                }
            }
            .navigationTitle("Settings")
            .onChange(of: appState.userName) { _, _ in
                appState.saveState()
            }
            .onChange(of: appState.isDarkMode) { _, _ in
                appState.saveState()
            }
            .alert("Reset All Data?", isPresented: $showingResetAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Reset", role: .destructive) {
                    resetAllData()
                }
            } message: {
                Text("This will permanently delete all your check-ins, reviews, goals, and insights. This action cannot be undone.")
            }
            .sheet(isPresented: $showingExportSheet) {
                ExportView()
            }
        }
    }

    private func resetAllData() {
        // Reset would clear all UserDefaults and document files
        // Implementation depends on full data structure
    }
}

struct StatRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
        }
    }
}

struct CreditRow: View {
    let name: String
    let framework: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(name)
                .font(.subheadline)
            Text(framework)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

struct ExportView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Image(systemName: "doc.text")
                    .font(.system(size: 60))
                    .foregroundStyle(.blue)

                Text("Export Your Data")
                    .font(.title2)
                    .fontWeight(.semibold)

                Text("Export all your check-ins, reviews, goals, and insights as JSON files that you can keep as backups or use in other tools.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                VStack(spacing: 12) {
                    ExportButton(title: "Export All", icon: "square.and.arrow.up")
                    ExportButton(title: "Export Check-ins", icon: "checkmark.circle")
                    ExportButton(title: "Export Reviews", icon: "calendar")
                    ExportButton(title: "Export Goals", icon: "target")
                    ExportButton(title: "Export Insights", icon: "lightbulb")
                }
                .padding()

                Spacer()
            }
            .padding(.top, 40)
            .navigationTitle("Export")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

struct ExportButton: View {
    let title: String
    let icon: String

    var body: some View {
        Button(action: {}) {
            HStack {
                Image(systemName: icon)
                Text(title)
                Spacer()
                Image(systemName: "chevron.right")
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState())
        .environmentObject(DataManager())
}
