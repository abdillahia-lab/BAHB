import SwiftUI

struct ReviewsHubView: View {
    @EnvironmentObject var dataManager: DataManager

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Current Period Status
                    CurrentPeriodSection(dataManager: dataManager)

                    // Review Types
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Start a Review")
                            .font(.headline)
                            .padding(.horizontal)

                        ReviewTypeCard(
                            title: "Weekly Review",
                            duration: "30 min",
                            description: "What moved the needle? What was noise?",
                            icon: "calendar.badge.clock",
                            color: .blue
                        ) {
                            WeeklyReviewView()
                        }

                        ReviewTypeCard(
                            title: "Quarterly Review",
                            duration: "2-3 hrs",
                            description: "Goal progress, alignment, course correction",
                            icon: "chart.bar.doc.horizontal",
                            color: .purple
                        ) {
                            QuarterlyReviewView()
                        }

                        ReviewTypeCard(
                            title: "Annual Review",
                            duration: "Half day",
                            description: "Full reflection, vision refresh, next year planning",
                            icon: "sparkles.rectangle.stack",
                            color: .orange
                        ) {
                            AnnualReviewView()
                        }
                    }

                    // Frameworks Section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Frameworks")
                            .font(.headline)
                            .padding(.horizontal)

                        FrameworkCard(
                            title: "Life Map",
                            description: "Assess your six life domains",
                            icon: "map.fill",
                            color: .green
                        ) {
                            LifeMapView()
                        }

                        FrameworkCard(
                            title: "Vivid Vision",
                            description: "Design your future in detail",
                            icon: "eye.fill",
                            color: .indigo
                        ) {
                            VividVisionView()
                        }
                    }

                    // Past Reviews
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Past Reviews")
                            .font(.headline)
                            .padding(.horizontal)

                        PastReviewsCard(dataManager: dataManager)
                    }
                }
                .padding(.vertical)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Reviews")
        }
    }
}

// MARK: - Current Period Section
struct CurrentPeriodSection: View {
    @ObservedObject var dataManager: DataManager

    var weeklyComplete: Bool {
        dataManager.currentWeekReview() != nil
    }

    var quarterlyComplete: Bool {
        dataManager.currentQuarterReview() != nil
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("This Period")
                .font(.headline)
                .padding(.horizontal)

            HStack(spacing: 16) {
                PeriodStatusCard(
                    title: "This Week",
                    isComplete: weeklyComplete,
                    icon: "calendar"
                )

                PeriodStatusCard(
                    title: "This Quarter",
                    isComplete: quarterlyComplete,
                    icon: "chart.pie"
                )
            }
            .padding(.horizontal)
        }
    }
}

struct PeriodStatusCard: View {
    let title: String
    let isComplete: Bool
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: isComplete ? "checkmark.circle.fill" : icon)
                .foregroundStyle(isComplete ? .green : .secondary)

            VStack(alignment: .leading) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(isComplete ? "Complete" : "Pending")
                    .font(.caption)
                    .foregroundStyle(isComplete ? .green : .secondary)
            }

            Spacer()
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Review Type Card
struct ReviewTypeCard<Destination: View>: View {
    let title: String
    let duration: String
    let description: String
    let icon: String
    let color: Color
    @ViewBuilder let destination: () -> Destination

    var body: some View {
        NavigationLink(destination: destination) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(color)
                    .frame(width: 44, height: 44)
                    .background(color.opacity(0.15))
                    .cornerRadius(10)

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(title)
                            .font(.headline)
                        Spacer()
                        Text(duration)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Text(description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Image(systemName: "chevron.right")
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(16)
        }
        .buttonStyle(.plain)
        .padding(.horizontal)
    }
}

// MARK: - Framework Card
struct FrameworkCard<Destination: View>: View {
    let title: String
    let description: String
    let icon: String
    let color: Color
    @ViewBuilder let destination: () -> Destination

    var body: some View {
        NavigationLink(destination: destination) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(color)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
        .padding(.horizontal)
    }
}

// MARK: - Past Reviews Card
struct PastReviewsCard: View {
    @ObservedObject var dataManager: DataManager

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    Text("\(dataManager.weeklyReviews.count) weekly reviews")
                        .font(.subheadline)
                    Text("\(dataManager.quarterlyReviews.count) quarterly reviews")
                        .font(.subheadline)
                }
                .foregroundStyle(.secondary)

                Spacer()

                NavigationLink(destination: ReviewHistoryView()) {
                    Text("View All")
                        .font(.subheadline)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
        .padding(.horizontal)
    }
}

// MARK: - Review History View
struct ReviewHistoryView: View {
    @EnvironmentObject var dataManager: DataManager

    var body: some View {
        List {
            Section("Weekly Reviews") {
                ForEach(dataManager.weeklyReviews.sorted { $0.weekStartDate > $1.weekStartDate }) { review in
                    WeeklyReviewRow(review: review)
                }
            }

            Section("Quarterly Reviews") {
                ForEach(dataManager.quarterlyReviews.sorted { ($0.year, $0.quarter) > ($1.year, $1.quarter) }) { review in
                    QuarterlyReviewRow(review: review)
                }
            }
        }
        .navigationTitle("Review History")
    }
}

struct WeeklyReviewRow: View {
    let review: WeeklyReview

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(review.weekStartDate, style: .date)
                .font(.headline)
            if !review.summaryWord.isEmpty {
                Text(review.summaryWord)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct QuarterlyReviewRow: View {
    let review: QuarterlyReview

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Q\(review.quarter) \(review.year)")
                .font(.headline)
            if !review.highlights.isEmpty {
                Text(review.highlights.joined(separator: ", "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
    }
}

#Preview {
    ReviewsHubView()
        .environmentObject(DataManager())
}
