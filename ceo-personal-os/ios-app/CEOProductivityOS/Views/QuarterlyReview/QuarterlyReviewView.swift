import SwiftUI

struct QuarterlyReviewView: View {
    @EnvironmentObject var dataManager: DataManager
    @Environment(\.dismiss) var dismiss
    @State private var review: QuarterlyReview = QuarterlyReview()
    @State private var currentSection = 0

    private let sections = [
        "Overview",
        "Goals",
        "Life Map",
        "Lessons",
        "Next Quarter"
    ]

    var body: some View {
        VStack(spacing: 0) {
            // Section Navigation
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
                QuarterOverviewSection(review: $review)
                    .tag(0)

                QuarterGoalsSection(review: $review, goals: dataManager.goals)
                    .tag(1)

                QuarterLifeMapSection(scores: $review.lifeMapScores)
                    .tag(2)

                QuarterLessonsSection(review: $review)
                    .tag(3)

                QuarterNextSection(review: $review)
                    .tag(4)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
        }
        .navigationTitle("Q\(review.quarter) \(review.year) Review")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    dataManager.saveQuarterlyReview(review)
                    dataManager.saveLifeMapScores(review.lifeMapScores)
                    dismiss()
                }
            }
        }
        .onAppear {
            if let existing = dataManager.currentQuarterReview() {
                review = existing
            } else {
                let now = Date()
                review.quarter = (Calendar.current.component(.month, from: now) - 1) / 3 + 1
                review.year = Calendar.current.component(.year, from: now)
            }
        }
    }
}

// MARK: - Overview Section
struct QuarterOverviewSection: View {
    @Binding var review: QuarterlyReview
    @State private var newHighlight = ""
    @State private var newLowlight = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Narrative
                VStack(alignment: .leading, spacing: 8) {
                    Text("What happened this quarter?")
                        .font(.headline)

                    TextEditor(text: $review.narrative)
                        .frame(minHeight: 120)
                        .padding(8)
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                }

                // Highlights
                VStack(alignment: .leading, spacing: 8) {
                    Text("Highlights")
                        .font(.headline)

                    ForEach(review.highlights, id: \.self) { highlight in
                        HStack {
                            Image(systemName: "star.fill")
                                .foregroundStyle(.yellow)
                            Text(highlight)
                            Spacer()
                            Button(action: { review.highlights.removeAll { $0 == highlight } }) {
                                Image(systemName: "xmark.circle")
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(8)
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(8)
                    }

                    HStack {
                        TextField("Add highlight...", text: $newHighlight)
                            .textFieldStyle(.roundedBorder)
                        Button(action: {
                            review.highlights.append(newHighlight)
                            newHighlight = ""
                        }) {
                            Image(systemName: "plus.circle.fill")
                        }
                        .disabled(newHighlight.isEmpty)
                    }
                }

                // Lowlights
                VStack(alignment: .leading, spacing: 8) {
                    Text("Lowlights")
                        .font(.headline)

                    ForEach(review.lowlights, id: \.self) { lowlight in
                        HStack {
                            Image(systemName: "exclamationmark.triangle")
                                .foregroundStyle(.orange)
                            Text(lowlight)
                            Spacer()
                            Button(action: { review.lowlights.removeAll { $0 == lowlight } }) {
                                Image(systemName: "xmark.circle")
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(8)
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(8)
                    }

                    HStack {
                        TextField("Add lowlight...", text: $newLowlight)
                            .textFieldStyle(.roundedBorder)
                        Button(action: {
                            review.lowlights.append(newLowlight)
                            newLowlight = ""
                        }) {
                            Image(systemName: "plus.circle.fill")
                        }
                        .disabled(newLowlight.isEmpty)
                    }
                }
            }
            .padding()
        }
    }
}

// MARK: - Goals Section
struct QuarterGoalsSection: View {
    @Binding var review: QuarterlyReview
    let goals: [Goal]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Goal Progress This Quarter")
                    .font(.headline)

                ForEach(goals.filter { $0.isActive }) { goal in
                    GoalProgressCard(goal: goal, review: $review)
                }

                if goals.isEmpty {
                    Text("No active goals to review")
                        .foregroundStyle(.secondary)
                        .padding()
                }
            }
            .padding()
        }
    }
}

struct GoalProgressCard: View {
    let goal: Goal
    @Binding var review: QuarterlyReview

    var progress: Binding<GoalProgress> {
        Binding(
            get: {
                review.goalProgress.first { $0.goalId == goal.id } ??
                GoalProgress(goalId: goal.id, goalTitle: goal.title)
            },
            set: { newValue in
                if let index = review.goalProgress.firstIndex(where: { $0.goalId == goal.id }) {
                    review.goalProgress[index] = newValue
                } else {
                    review.goalProgress.append(newValue)
                }
            }
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(goal.title)
                .font(.subheadline)
                .fontWeight(.medium)

            HStack {
                Text("\(progress.wrappedValue.percentComplete)%")
                    .font(.caption)
                    .fontWeight(.medium)

                Slider(value: Binding(
                    get: { Double(progress.wrappedValue.percentComplete) },
                    set: { progress.wrappedValue.percentComplete = Int($0) }
                ), in: 0...100, step: 5)
            }

            TextField("Notes on progress...", text: progress.notes, axis: .vertical)
                .font(.caption)
                .textFieldStyle(.roundedBorder)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Life Map Section
struct QuarterLifeMapSection: View {
    @Binding var scores: LifeMapScores

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text("Life Map Check")
                    .font(.headline)

                Text("Rate each domain for this quarter (1-10)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                VStack(spacing: 16) {
                    DomainSlider(title: "Career", value: $scores.career, color: .blue)
                    DomainSlider(title: "Relationships", value: $scores.relationships, color: .pink)
                    DomainSlider(title: "Health", value: $scores.health, color: .green)
                    DomainSlider(title: "Meaning", value: $scores.meaning, color: .purple)
                    DomainSlider(title: "Finances", value: $scores.finances, color: .yellow)
                    DomainSlider(title: "Fun", value: $scores.fun, color: .orange)
                }

                // Average
                HStack {
                    Text("Overall Average")
                        .font(.headline)
                    Spacer()
                    Text(String(format: "%.1f", scores.average))
                        .font(.title2)
                        .fontWeight(.bold)
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
            }
            .padding()
        }
    }
}

struct DomainSlider: View {
    let title: String
    @Binding var value: Int
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(title)
                    .font(.subheadline)
                Spacer()
                Text("\(value)")
                    .font(.headline)
                    .foregroundStyle(color)
            }

            Slider(value: Binding(
                get: { Double(value) },
                set: { value = Int($0) }
            ), in: 1...10, step: 1)
            .tint(color)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Lessons Section
struct QuarterLessonsSection: View {
    @Binding var review: QuarterlyReview
    @State private var newLesson = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Key Lessons")
                    .font(.headline)

                ForEach(review.keyLessons, id: \.self) { lesson in
                    HStack(alignment: .top) {
                        Image(systemName: "lightbulb.fill")
                            .foregroundStyle(.yellow)
                        Text(lesson)
                        Spacer()
                        Button(action: { review.keyLessons.removeAll { $0 == lesson } }) {
                            Image(systemName: "xmark.circle")
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .cornerRadius(12)
                }

                HStack {
                    TextField("Add lesson learned...", text: $newLesson)
                        .textFieldStyle(.roundedBorder)
                    Button(action: {
                        review.keyLessons.append(newLesson)
                        newLesson = ""
                    }) {
                        Image(systemName: "plus.circle.fill")
                    }
                    .disabled(newLesson.isEmpty)
                }
            }
            .padding()
        }
    }
}

// MARK: - Next Quarter Section
struct QuarterNextSection: View {
    @Binding var review: QuarterlyReview
    @State private var newPriority = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Course Corrections
                VStack(alignment: .leading, spacing: 8) {
                    Text("Course Corrections")
                        .font(.headline)

                    Text("Based on this review, what needs to change?")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    TextEditor(text: $review.courseCorrections)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                }

                // Next Quarter Priorities
                VStack(alignment: .leading, spacing: 8) {
                    Text("Priorities for Next Quarter")
                        .font(.headline)

                    ForEach(review.prioritiesForNextQuarter, id: \.self) { priority in
                        HStack {
                            Image(systemName: "arrow.right.circle.fill")
                                .foregroundStyle(.blue)
                            Text(priority)
                            Spacer()
                            Button(action: { review.prioritiesForNextQuarter.removeAll { $0 == priority } }) {
                                Image(systemName: "xmark.circle")
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding()
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                    }

                    HStack {
                        TextField("Add priority...", text: $newPriority)
                            .textFieldStyle(.roundedBorder)
                        Button(action: {
                            review.prioritiesForNextQuarter.append(newPriority)
                            newPriority = ""
                        }) {
                            Image(systemName: "plus.circle.fill")
                        }
                        .disabled(newPriority.isEmpty)
                    }
                }
            }
            .padding()
        }
    }
}

#Preview {
    NavigationStack {
        QuarterlyReviewView()
            .environmentObject(DataManager())
    }
}
