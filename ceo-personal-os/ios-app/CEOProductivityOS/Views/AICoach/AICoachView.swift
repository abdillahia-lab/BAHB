import SwiftUI
import TipKit

struct AICoachView: View {
    @StateObject private var coachingService = AICoachingService.shared
    @State private var question = ""
    @State private var selectedMode: CoachingMode = .ask
    @State private var showingPatternAnalysis = false

    enum CoachingMode: String, CaseIterable {
        case ask = "Ask"
        case patterns = "Patterns"
        case goals = "Goals"
        case energy = "Energy"
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Mode Selector
                Picker("Mode", selection: $selectedMode) {
                    ForEach(CoachingMode.allCases, id: \.self) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Content based on mode
                switch selectedMode {
                case .ask:
                    AskCoachView(coachingService: coachingService, question: $question)
                case .patterns:
                    PatternAnalysisView(coachingService: coachingService)
                case .goals:
                    GoalCoachingView(coachingService: coachingService)
                case .energy:
                    EnergyCoachingView(coachingService: coachingService)
                }
            }
            .navigationTitle("AI Coach")
            .background(Color(.systemGroupedBackground))
        }
    }
}

// MARK: - Ask Coach View

struct AskCoachView: View {
    @ObservedObject var coachingService: AICoachingService
    @Binding var question: String
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            // Conversation History
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        // Intro message if empty
                        if coachingService.conversationHistory.isEmpty {
                            CoachIntroView()
                        }

                        ForEach(coachingService.conversationHistory) { turn in
                            ConversationBubble(turn: turn)
                        }

                        if coachingService.isProcessing {
                            TypingIndicator()
                        }
                    }
                    .padding()
                }
                .onChange(of: coachingService.conversationHistory.count) { _, _ in
                    if let last = coachingService.conversationHistory.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }

            Divider()

            // Input Area
            HStack(spacing: 12) {
                TextField("Ask your coach...", text: $question, axis: .vertical)
                    .textFieldStyle(.plain)
                    .focused($isFocused)
                    .lineLimit(1...4)
                    .padding(12)
                    .background(Color(.tertiarySystemGroupedBackground))
                    .cornerRadius(20)

                Button(action: sendQuestion) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title)
                        .foregroundStyle(question.isEmpty ? .secondary : .blue)
                }
                .disabled(question.isEmpty || coachingService.isProcessing)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
        }
    }

    private func sendQuestion() {
        let q = question
        question = ""
        isFocused = false

        Task {
            _ = await coachingService.askCoach(question: q)
        }
    }
}

struct CoachIntroView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 48))
                .foregroundStyle(.blue)

            Text("Your Executive Coach")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Ask questions, explore decisions, or request feedback. I'm here to help you think clearly, not to give easy answers.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            // Suggested questions
            VStack(alignment: .leading, spacing: 8) {
                Text("Try asking:")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                SuggestedQuestionChip(text: "How should I prioritize this week?")
                SuggestedQuestionChip(text: "I'm facing a tough decision...")
                SuggestedQuestionChip(text: "My energy has been low lately")
                SuggestedQuestionChip(text: "Are my goals aligned with what matters?")
            }
            .padding(.top)
        }
        .padding(24)
    }
}

struct SuggestedQuestionChip: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.caption)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color(.tertiarySystemGroupedBackground))
            .cornerRadius(16)
    }
}

struct ConversationBubble: View {
    let turn: AICoachingService.ConversationTurn

    var body: some View {
        HStack {
            if turn.role == .user { Spacer() }

            VStack(alignment: turn.role == .user ? .trailing : .leading, spacing: 4) {
                Text(turn.content)
                    .font(.body)
                    .padding(12)
                    .background(turn.role == .user ? Color.blue : Color(.secondarySystemGroupedBackground))
                    .foregroundStyle(turn.role == .user ? .white : .primary)
                    .cornerRadius(16)

                Text(turn.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: 280, alignment: turn.role == .user ? .trailing : .leading)

            if turn.role == .assistant { Spacer() }
        }
    }
}

struct TypingIndicator: View {
    @State private var animating = false

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color.secondary)
                    .frame(width: 8, height: 8)
                    .offset(y: animating ? -5 : 0)
                    .animation(
                        .easeInOut(duration: 0.5)
                            .repeatForever()
                            .delay(Double(index) * 0.2),
                        value: animating
                    )
            }
        }
        .padding(12)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .onAppear { animating = true }
    }
}

// MARK: - Pattern Analysis View

struct PatternAnalysisView: View {
    @ObservedObject var coachingService: AICoachingService
    @State private var analysis: PatternAnalysis?
    @State private var isLoading = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Analyzing patterns...")
                        .padding(40)
                } else if let analysis = analysis {
                    PatternResultsView(analysis: analysis)
                } else {
                    PatternIntroView {
                        runAnalysis()
                    }
                }
            }
            .padding()
        }
    }

    private func runAnalysis() {
        isLoading = true
        Task {
            // In production, would fetch real check-ins from SwiftData
            let mockCheckIns = (0..<14).map { i in
                CheckInSummary(
                    date: Calendar.current.date(byAdding: .day, value: -i, to: Date())!,
                    energy: Int.random(in: 4...9),
                    win: ["Completed project", "Good meeting", "Made decision", "Helped team"].randomElement()!,
                    friction: ["Time pressure", "Too many meetings", "Unclear priority", "Energy dip"].randomElement()!
                )
            }
            analysis = await coachingService.analyzePatterns(checkIns: mockCheckIns)
            isLoading = false
        }
    }
}

struct PatternIntroView: View {
    let action: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 48))
                .foregroundStyle(.purple)

            Text("Pattern Analysis")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Analyze your check-ins to discover patterns in energy, wins, and frictions over time.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button("Run Analysis", action: action)
                .buttonStyle(.borderedProminent)
        }
        .padding(40)
    }
}

struct PatternResultsView: View {
    let analysis: PatternAnalysis

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Energy Overview
            VStack(alignment: .leading, spacing: 8) {
                Label("Energy Pattern", systemImage: "bolt.fill")
                    .font(.headline)

                HStack {
                    VStack(alignment: .leading) {
                        Text("Average")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(String(format: "%.1f", analysis.averageEnergy))
                            .font(.title)
                            .fontWeight(.bold)
                    }

                    Spacer()

                    VStack(alignment: .trailing) {
                        Text("Trend")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(analysis.energyTrend.capitalized)
                            .font(.title3)
                            .fontWeight(.medium)
                            .foregroundStyle(trendColor(analysis.energyTrend))
                    }
                }
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(16)

            // Best/Worst Days
            HStack(spacing: 16) {
                DayPatternCard(title: "High Energy Days", days: analysis.bestDays, color: .green)
                DayPatternCard(title: "Low Energy Days", days: analysis.worstDays, color: .red)
            }

            // Win Patterns
            PatternListCard(title: "Win Themes", icon: "trophy.fill", items: analysis.winPatterns, color: .yellow)

            // Friction Patterns
            PatternListCard(title: "Friction Themes", icon: "exclamationmark.triangle.fill", items: analysis.frictionPatterns, color: .orange)

            // Recommendations
            VStack(alignment: .leading, spacing: 8) {
                Label("Recommendations", systemImage: "lightbulb.fill")
                    .font(.headline)
                    .foregroundStyle(.yellow)

                ForEach(analysis.recommendations, id: \.self) { rec in
                    HStack(alignment: .top) {
                        Image(systemName: "arrow.right.circle.fill")
                            .foregroundStyle(.blue)
                        Text(rec)
                            .font(.subheadline)
                    }
                }
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(16)
        }
    }

    private func trendColor(_ trend: String) -> Color {
        switch trend {
        case "improving": return .green
        case "declining": return .red
        default: return .secondary
        }
    }
}

struct DayPatternCard: View {
    let title: String
    let days: [String]
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)

            ForEach(days, id: \.self) { day in
                Text(day)
                    .font(.caption)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

struct PatternListCard: View {
    let title: String
    let icon: String
    let items: [String]
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundStyle(color)

            FlowLayout(spacing: 8) {
                ForEach(items, id: \.self) { item in
                    Text(item)
                        .font(.caption)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color(.tertiarySystemGroupedBackground))
                        .cornerRadius(12)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(16)
    }
}

// MARK: - Goal Coaching View

struct GoalCoachingView: View {
    @ObservedObject var coachingService: AICoachingService
    @State private var alignment: AlignmentAnalysis?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let alignment = alignment {
                    GoalAlignmentResultsView(alignment: alignment)
                } else {
                    GoalCoachingIntroView {
                        analyzeAlignment()
                    }
                }
            }
            .padding()
        }
    }

    private func analyzeAlignment() {
        Task {
            alignment = await coachingService.evaluateGoalAlignment(
                goals: [
                    GoalSummary(title: "Q4 Revenue", category: "Career", progress: 65),
                    GoalSummary(title: "Exercise routine", category: "Health", progress: 40),
                ],
                northStar: NorthStarSummary(
                    greatLife: "Freedom and impact",
                    optimizingFor: "Company growth",
                    wouldRegret: "Not spending time with family"
                ),
                lifeMapScores: ["Career": 8, "Relationships": 6, "Health": 5, "Meaning": 7, "Finances": 7, "Fun": 4]
            )
        }
    }
}

struct GoalCoachingIntroView: View {
    let action: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "target")
                .font(.system(size: 48))
                .foregroundStyle(.green)

            Text("Goal Alignment Check")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Evaluate how well your goals align with your North Star and life priorities.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button("Check Alignment", action: action)
                .buttonStyle(.borderedProminent)
        }
        .padding(40)
    }
}

struct GoalAlignmentResultsView: View {
    let alignment: AlignmentAnalysis

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Alignment Score
            HStack {
                Text("Alignment Score")
                    .font(.headline)
                Spacer()
                Text("\(alignment.overallScore)/10")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundStyle(scoreColor(alignment.overallScore))
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(16)

            // Aligned Goals
            if !alignment.alignedGoals.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Well-Aligned", systemImage: "checkmark.circle.fill")
                        .font(.headline)
                        .foregroundStyle(.green)

                    ForEach(alignment.alignedGoals, id: \.self) { goal in
                        Text("• \(goal)")
                            .font(.subheadline)
                    }
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(16)
            }

            // Gaps
            if !alignment.gapAreas.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Gap Areas", systemImage: "exclamationmark.triangle.fill")
                        .font(.headline)
                        .foregroundStyle(.orange)

                    ForEach(alignment.gapAreas, id: \.self) { gap in
                        Text("• \(gap)")
                            .font(.subheadline)
                    }
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(16)
            }

            // Recommendation
            VStack(alignment: .leading, spacing: 8) {
                Label("Recommendation", systemImage: "lightbulb.fill")
                    .font(.headline)
                    .foregroundStyle(.yellow)

                Text(alignment.recommendation)
                    .font(.subheadline)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(16)
        }
    }

    private func scoreColor(_ score: Int) -> Color {
        switch score {
        case 8...10: return .green
        case 5...7: return .orange
        default: return .red
        }
    }
}

// MARK: - Energy Coaching View

struct EnergyCoachingView: View {
    @ObservedObject var coachingService: AICoachingService
    @State private var recentEnergies: [Int] = [6, 7, 5, 6, 8, 7, 6]
    @State private var advice: AICoachingService.CoachingResponse?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Energy History Chart
                EnergyChartView(energies: recentEnergies)

                // Get Advice Button
                Button(action: getAdvice) {
                    Label("Get Energy Advice", systemImage: "bolt.fill")
                }
                .buttonStyle(.borderedProminent)

                // Advice Display
                if let advice = advice {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Coach's Advice")
                            .font(.headline)

                        Text(advice.content)
                            .font(.body)

                        if !advice.suggestedActions.isEmpty {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Actions:")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)

                                ForEach(advice.suggestedActions, id: \.self) { action in
                                    Text("• \(action)")
                                        .font(.subheadline)
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .cornerRadius(16)
                }
            }
            .padding()
        }
    }

    private func getAdvice() {
        Task {
            advice = await coachingService.processDailyCheckIn(
                energy: recentEnergies.last ?? 5,
                win: "Made progress",
                friction: "Time pressure",
                lettingGo: "Perfectionism",
                priority: "Focus on key deliverable",
                recentEnergies: recentEnergies
            )
        }
    }
}

struct EnergyChartView: View {
    let energies: [Int]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Energy Trend (7 days)")
                .font(.headline)

            GeometryReader { geometry in
                Path { path in
                    let stepX = geometry.size.width / CGFloat(energies.count - 1)
                    let stepY = geometry.size.height / 10

                    for (index, energy) in energies.enumerated() {
                        let x = CGFloat(index) * stepX
                        let y = geometry.size.height - (CGFloat(energy) * stepY)

                        if index == 0 {
                            path.move(to: CGPoint(x: x, y: y))
                        } else {
                            path.addLine(to: CGPoint(x: x, y: y))
                        }
                    }
                }
                .stroke(Color.blue, lineWidth: 2)

                // Data points
                ForEach(0..<energies.count, id: \.self) { index in
                    let x = CGFloat(index) * (geometry.size.width / CGFloat(energies.count - 1))
                    let y = geometry.size.height - (CGFloat(energies[index]) * geometry.size.height / 10)

                    Circle()
                        .fill(Color.blue)
                        .frame(width: 8, height: 8)
                        .position(x: x, y: y)
                }
            }
            .frame(height: 120)
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(16)
        }
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.width ?? 0, subviews: subviews, spacing: spacing)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x,
                                       y: bounds.minY + result.positions[index].y),
                          proposal: .unspecified)
        }
    }

    struct FlowResult {
        var size: CGSize = .zero
        var positions: [CGPoint] = []

        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var x: CGFloat = 0
            var y: CGFloat = 0
            var rowHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if x + size.width > maxWidth && x > 0 {
                    x = 0
                    y += rowHeight + spacing
                    rowHeight = 0
                }

                positions.append(CGPoint(x: x, y: y))
                rowHeight = max(rowHeight, size.height)
                x += size.width + spacing
            }

            self.size = CGSize(width: maxWidth, height: y + rowHeight)
        }
    }
}

#Preview {
    AICoachView()
}
