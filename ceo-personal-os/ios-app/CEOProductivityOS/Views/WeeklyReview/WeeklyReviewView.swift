import SwiftUI

struct WeeklyReviewView: View {
    @EnvironmentObject var dataManager: DataManager
    @Environment(\.dismiss) var dismiss
    @State private var review: WeeklyReview = WeeklyReview()
    @State private var currentSection = 0
    @State private var newItem = ""

    private let sections = [
        "What Moved the Needle",
        "What Was Noise",
        "Time Leaks",
        "Strategic Insight",
        "Next Week"
    ]

    var body: some View {
        VStack(spacing: 0) {
            // Section Tabs
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(0..<sections.count, id: \.self) { index in
                        SectionTab(
                            title: sections[index],
                            isSelected: currentSection == index
                        ) {
                            withAnimation { currentSection = index }
                        }
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical, 8)
            .background(Color(.secondarySystemGroupedBackground))

            // Content
            TabView(selection: $currentSection) {
                MovedNeedleSection(items: $review.movedTheNeedle, newItem: $newItem)
                    .tag(0)

                NoiseSection(items: $review.wasNoise, newItem: $newItem)
                    .tag(1)

                TimeLeaksSection(items: $review.timeLeaks, newItem: $newItem)
                    .tag(2)

                StrategicInsightSection(insight: $review.strategicInsight)
                    .tag(3)

                NextWeekSection(
                    adjustment: $review.adjustmentForNextWeek,
                    rating: $review.overallRating,
                    summaryWord: $review.summaryWord
                )
                    .tag(4)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
        }
        .navigationTitle("Weekly Review")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    dataManager.saveWeeklyReview(review)
                    dismiss()
                }
            }
        }
        .onAppear {
            if let existing = dataManager.currentWeekReview() {
                review = existing
            }
        }
    }
}

// MARK: - Section Tab
struct SectionTab: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundStyle(isSelected ? .primary : .secondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.accentColor.opacity(0.15) : Color.clear)
                .cornerRadius(16)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Moved Needle Section
struct MovedNeedleSection: View {
    @Binding var items: [String]
    @Binding var newItem: String

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("What moved the needle this week?")
                        .font(.title3)
                        .fontWeight(.semibold)

                    Text("The 2-3 things that created disproportionate value")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                // Add Item
                HStack {
                    TextField("Add an item...", text: $newItem)
                        .textFieldStyle(.roundedBorder)

                    Button(action: addItem) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                    .disabled(newItem.isEmpty)
                }

                // Items List
                ForEach(items, id: \.self) { item in
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text(item)
                        Spacer()
                        Button(action: { removeItem(item) }) {
                            Image(systemName: "xmark.circle")
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .cornerRadius(12)
                }

                Spacer()
            }
            .padding()
        }
    }

    private func addItem() {
        guard !newItem.isEmpty else { return }
        items.append(newItem)
        newItem = ""
    }

    private func removeItem(_ item: String) {
        items.removeAll { $0 == item }
    }
}

// MARK: - Noise Section
struct NoiseSection: View {
    @Binding var items: [String]
    @Binding var newItem: String

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("What was noise?")
                        .font(.title3)
                        .fontWeight(.semibold)

                    Text("Activities that felt busy but didn't actually matter")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                HStack {
                    TextField("Add an item...", text: $newItem)
                        .textFieldStyle(.roundedBorder)

                    Button(action: addItem) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                    .disabled(newItem.isEmpty)
                }

                ForEach(items, id: \.self) { item in
                    HStack {
                        Image(systemName: "speaker.wave.1")
                            .foregroundStyle(.orange)
                        Text(item)
                        Spacer()
                        Button(action: { removeItem(item) }) {
                            Image(systemName: "xmark.circle")
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .cornerRadius(12)
                }

                Spacer()
            }
            .padding()
        }
    }

    private func addItem() {
        guard !newItem.isEmpty else { return }
        items.append(newItem)
        newItem = ""
    }

    private func removeItem(_ item: String) {
        items.removeAll { $0 == item }
    }
}

// MARK: - Time Leaks Section
struct TimeLeaksSection: View {
    @Binding var items: [String]
    @Binding var newItem: String

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Where did time leak?")
                        .font(.title3)
                        .fontWeight(.semibold)

                    Text("Unplanned activities, rabbit holes, interruptions")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                HStack {
                    TextField("Add an item...", text: $newItem)
                        .textFieldStyle(.roundedBorder)

                    Button(action: addItem) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                    .disabled(newItem.isEmpty)
                }

                ForEach(items, id: \.self) { item in
                    HStack {
                        Image(systemName: "clock.badge.exclamationmark")
                            .foregroundStyle(.red)
                        Text(item)
                        Spacer()
                        Button(action: { removeItem(item) }) {
                            Image(systemName: "xmark.circle")
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .cornerRadius(12)
                }

                Spacer()
            }
            .padding()
        }
    }

    private func addItem() {
        guard !newItem.isEmpty else { return }
        items.append(newItem)
        newItem = ""
    }

    private func removeItem(_ item: String) {
        items.removeAll { $0 == item }
    }
}

// MARK: - Strategic Insight Section
struct StrategicInsightSection: View {
    @Binding var insight: String

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("One strategic insight")
                        .font(.title3)
                        .fontWeight(.semibold)

                    Text("Something you realized that changes how you think or act")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                TextEditor(text: $insight)
                    .frame(minHeight: 200)
                    .padding(8)
                    .background(Color(.secondarySystemGroupedBackground))
                    .cornerRadius(12)

                Spacer()
            }
            .padding()
        }
    }
}

// MARK: - Next Week Section
struct NextWeekSection: View {
    @Binding var adjustment: String
    @Binding var rating: Int
    @Binding var summaryWord: String

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Overall Rating
                VStack(alignment: .leading, spacing: 12) {
                    Text("Overall, how was this week?")
                        .font(.title3)
                        .fontWeight(.semibold)

                    HStack {
                        ForEach(1...10, id: \.self) { value in
                            Button(action: { rating = value }) {
                                Text("\(value)")
                                    .font(.headline)
                                    .frame(width: 32, height: 32)
                                    .background(rating == value ? Color.accentColor : Color(.secondarySystemGroupedBackground))
                                    .foregroundStyle(rating == value ? .white : .primary)
                                    .cornerRadius(8)
                            }
                        }
                    }
                }

                // Summary Word
                VStack(alignment: .leading, spacing: 8) {
                    Text("One word to describe it")
                        .font(.headline)

                    TextField("One word...", text: $summaryWord)
                        .textFieldStyle(.roundedBorder)
                }

                // Adjustment
                VStack(alignment: .leading, spacing: 8) {
                    Text("One adjustment for next week")
                        .font(.headline)

                    Text("Based on what you learned, one thing to change")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    TextEditor(text: $adjustment)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                }

                Spacer()
            }
            .padding()
        }
    }
}

#Preview {
    NavigationStack {
        WeeklyReviewView()
            .environmentObject(DataManager())
    }
}
