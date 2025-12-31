import SwiftUI

struct LifeMapView: View {
    @EnvironmentObject var dataManager: DataManager
    @Environment(\.dismiss) var dismiss
    @State private var scores: LifeMapScores = LifeMapScores()
    @State private var selectedDomain: GoalCategory?

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Visual Map
                LifeMapRadarView(scores: scores)
                    .frame(height: 280)
                    .padding()

                // Average Score
                HStack {
                    Text("Overall Balance")
                        .font(.headline)
                    Spacer()
                    Text(String(format: "%.1f", scores.average))
                        .font(.title)
                        .fontWeight(.bold)
                    Text("/ 10")
                        .foregroundStyle(.secondary)
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(16)
                .padding(.horizontal)

                // Domain Sliders
                VStack(spacing: 16) {
                    LifeMapDomainSlider(
                        title: "Career",
                        description: "Work, professional growth, impact",
                        icon: "briefcase.fill",
                        color: .blue,
                        value: $scores.career
                    )

                    LifeMapDomainSlider(
                        title: "Relationships",
                        description: "Partner, family, friends, community",
                        icon: "heart.fill",
                        color: .pink,
                        value: $scores.relationships
                    )

                    LifeMapDomainSlider(
                        title: "Health",
                        description: "Physical, mental, energy",
                        icon: "heart.text.square.fill",
                        color: .green,
                        value: $scores.health
                    )

                    LifeMapDomainSlider(
                        title: "Meaning",
                        description: "Purpose, contribution, spirituality",
                        icon: "sparkles",
                        color: .purple,
                        value: $scores.meaning
                    )

                    LifeMapDomainSlider(
                        title: "Finances",
                        description: "Money, security, freedom",
                        icon: "dollarsign.circle.fill",
                        color: .yellow,
                        value: $scores.finances
                    )

                    LifeMapDomainSlider(
                        title: "Fun",
                        description: "Joy, adventure, play",
                        icon: "star.fill",
                        color: .orange,
                        value: $scores.fun
                    )
                }
                .padding(.horizontal)

                // Save Button
                Button(action: {
                    dataManager.saveLifeMapScores(scores)
                    dismiss()
                }) {
                    Text("Save Life Map")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundStyle(.white)
                        .cornerRadius(12)
                }
                .padding()
            }
            .padding(.vertical)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Life Map")
        .onAppear {
            if let existing = dataManager.latestLifeMapScores() {
                scores = existing
            }
        }
    }
}

// MARK: - Radar View
struct LifeMapRadarView: View {
    let scores: LifeMapScores

    private let labels = ["Career", "Relations", "Health", "Meaning", "Finance", "Fun"]
    private let colors: [Color] = [.blue, .pink, .green, .purple, .yellow, .orange]

    private var values: [Int] {
        [scores.career, scores.relationships, scores.health, scores.meaning, scores.finances, scores.fun]
    }

    var body: some View {
        GeometryReader { geometry in
            let center = CGPoint(x: geometry.size.width / 2, y: geometry.size.height / 2)
            let radius = min(geometry.size.width, geometry.size.height) / 2 - 40

            ZStack {
                // Grid circles
                ForEach([2, 4, 6, 8, 10], id: \.self) { level in
                    Circle()
                        .stroke(Color(.systemGray4), lineWidth: 0.5)
                        .frame(width: radius * 2 * CGFloat(level) / 10, height: radius * 2 * CGFloat(level) / 10)
                }

                // Grid lines
                ForEach(0..<6, id: \.self) { i in
                    let angle = Angle(degrees: Double(i) * 60 - 90)
                    Path { path in
                        path.move(to: center)
                        path.addLine(to: pointOnCircle(center: center, radius: radius, angle: angle))
                    }
                    .stroke(Color(.systemGray4), lineWidth: 0.5)
                }

                // Data shape
                Path { path in
                    for (index, value) in values.enumerated() {
                        let angle = Angle(degrees: Double(index) * 60 - 90)
                        let valueRadius = radius * CGFloat(value) / 10
                        let point = pointOnCircle(center: center, radius: valueRadius, angle: angle)

                        if index == 0 {
                            path.move(to: point)
                        } else {
                            path.addLine(to: point)
                        }
                    }
                    path.closeSubpath()
                }
                .fill(Color.accentColor.opacity(0.2))
                .overlay(
                    Path { path in
                        for (index, value) in values.enumerated() {
                            let angle = Angle(degrees: Double(index) * 60 - 90)
                            let valueRadius = radius * CGFloat(value) / 10
                            let point = pointOnCircle(center: center, radius: valueRadius, angle: angle)

                            if index == 0 {
                                path.move(to: point)
                            } else {
                                path.addLine(to: point)
                            }
                        }
                        path.closeSubpath()
                    }
                    .stroke(Color.accentColor, lineWidth: 2)
                )

                // Data points
                ForEach(0..<6, id: \.self) { index in
                    let angle = Angle(degrees: Double(index) * 60 - 90)
                    let valueRadius = radius * CGFloat(values[index]) / 10
                    let point = pointOnCircle(center: center, radius: valueRadius, angle: angle)

                    Circle()
                        .fill(colors[index])
                        .frame(width: 12, height: 12)
                        .position(point)
                }

                // Labels
                ForEach(0..<6, id: \.self) { index in
                    let angle = Angle(degrees: Double(index) * 60 - 90)
                    let labelPoint = pointOnCircle(center: center, radius: radius + 25, angle: angle)

                    VStack(spacing: 2) {
                        Text(labels[index])
                            .font(.caption2)
                            .fontWeight(.medium)
                        Text("\(values[index])")
                            .font(.caption)
                            .foregroundStyle(colors[index])
                    }
                    .position(labelPoint)
                }
            }
        }
    }

    private func pointOnCircle(center: CGPoint, radius: CGFloat, angle: Angle) -> CGPoint {
        CGPoint(
            x: center.x + radius * cos(CGFloat(angle.radians)),
            y: center.y + radius * sin(CGFloat(angle.radians))
        )
    }
}

// MARK: - Domain Slider
struct LifeMapDomainSlider: View {
    let title: String
    let description: String
    let icon: String
    let color: Color
    @Binding var value: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text("\(value)")
                    .font(.title2)
                    .fontWeight(.bold)
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
        .cornerRadius(16)
    }
}

#Preview {
    NavigationStack {
        LifeMapView()
            .environmentObject(DataManager())
    }
}
