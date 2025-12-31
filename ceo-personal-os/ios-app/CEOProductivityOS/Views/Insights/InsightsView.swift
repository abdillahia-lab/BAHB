import SwiftUI

struct InsightsView: View {
    @EnvironmentObject var dataManager: DataManager
    @State private var showingAddInsight = false
    @State private var selectedCategory: InsightCategory?

    var filteredInsights: [Insight] {
        if let category = selectedCategory {
            return dataManager.insights.filter { $0.category == category }
        }
        return dataManager.insights
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Category Filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        CategoryChip(
                            title: "All",
                            isSelected: selectedCategory == nil
                        ) {
                            selectedCategory = nil
                        }

                        ForEach(InsightCategory.allCases, id: \.self) { category in
                            CategoryChip(
                                title: category.rawValue,
                                isSelected: selectedCategory == category
                            ) {
                                selectedCategory = category
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 12)
                .background(Color(.secondarySystemGroupedBackground))

                // Insights List
                if filteredInsights.isEmpty {
                    EmptyInsightsView()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredInsights.sorted { $0.createdAt > $1.createdAt }) { insight in
                                InsightCard(insight: insight)
                            }
                        }
                        .padding()
                    }
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Memory")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showingAddInsight = true }) {
                        Image(systemName: "plus.circle.fill")
                    }
                }
            }
            .sheet(isPresented: $showingAddInsight) {
                AddInsightView()
            }
        }
    }
}

// MARK: - Category Chip
struct CategoryChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundStyle(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.accentColor : Color(.tertiarySystemGroupedBackground))
                .cornerRadius(20)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Empty Insights View
struct EmptyInsightsView: View {
    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            Image(systemName: "brain.head.profile")
                .font(.system(size: 60))
                .foregroundStyle(.secondary)

            Text("No Insights Yet")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Your memory bank is empty.\nCapture patterns, lessons, and wisdom\nas you complete reviews and reflections.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Spacer()
        }
    }
}

// MARK: - Insight Card
struct InsightCard: View {
    @EnvironmentObject var dataManager: DataManager
    let insight: Insight

    var categoryColor: Color {
        switch insight.category {
        case .pattern: return .blue
        case .lesson: return .green
        case .strength: return .yellow
        case .blindSpot: return .orange
        case .quote: return .purple
        case .decision: return .red
        }
    }

    var categoryIcon: String {
        switch insight.category {
        case .pattern: return "arrow.triangle.2.circlepath"
        case .lesson: return "lightbulb.fill"
        case .strength: return "bolt.fill"
        case .blindSpot: return "eye.slash.fill"
        case .quote: return "quote.opening"
        case .decision: return "arrow.triangle.branch"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Label(insight.category.rawValue, systemImage: categoryIcon)
                    .font(.caption)
                    .foregroundStyle(categoryColor)

                Spacer()

                Text(insight.createdAt, style: .date)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            // Content
            Text(insight.content)
                .font(.body)

            // Source
            if !insight.source.isEmpty {
                Text("From: \(insight.source)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
        .contextMenu {
            Button(role: .destructive) {
                dataManager.deleteInsight(insight)
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}

// MARK: - Add Insight View
struct AddInsightView: View {
    @EnvironmentObject var dataManager: DataManager
    @Environment(\.dismiss) var dismiss

    @State private var content = ""
    @State private var category: InsightCategory = .pattern
    @State private var source = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextEditor(text: $content)
                        .frame(minHeight: 120)
                } header: {
                    Text("Insight")
                }

                Section("Category") {
                    Picker("Category", selection: $category) {
                        ForEach(InsightCategory.allCases, id: \.self) { cat in
                            Text(cat.rawValue).tag(cat)
                        }
                    }
                    .pickerStyle(.menu)
                }

                Section("Source (Optional)") {
                    TextField("e.g., Weekly Review, Annual Review", text: $source)
                }
            }
            .navigationTitle("Add Insight")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let insight = Insight(
                            content: content,
                            category: category,
                            source: source
                        )
                        dataManager.saveInsight(insight)
                        dismiss()
                    }
                    .disabled(content.isEmpty)
                }
            }
        }
    }
}

// MARK: - Energy Trend Chart
struct EnergyTrendView: View {
    @EnvironmentObject var dataManager: DataManager

    var trend: [Double] {
        dataManager.energyTrend(days: 14)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Energy Trend (14 Days)")
                .font(.headline)

            if trend.isEmpty {
                Text("Not enough data yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                GeometryReader { geometry in
                    Path { path in
                        let stepX = geometry.size.width / CGFloat(trend.count - 1)
                        let stepY = geometry.size.height / 10

                        for (index, value) in trend.enumerated() {
                            let x = CGFloat(index) * stepX
                            let y = geometry.size.height - (CGFloat(value) * stepY)

                            if index == 0 {
                                path.move(to: CGPoint(x: x, y: y))
                            } else {
                                path.addLine(to: CGPoint(x: x, y: y))
                            }
                        }
                    }
                    .stroke(Color.accentColor, lineWidth: 2)
                }
                .frame(height: 100)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }
}

#Preview {
    InsightsView()
        .environmentObject(DataManager())
}
