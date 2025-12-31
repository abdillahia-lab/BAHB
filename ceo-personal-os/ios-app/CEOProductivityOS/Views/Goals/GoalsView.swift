import SwiftUI

struct GoalsView: View {
    @EnvironmentObject var dataManager: DataManager
    @State private var selectedTimeframe: GoalTimeframe = .oneYear
    @State private var showingAddGoal = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Timeframe Picker
                Picker("Timeframe", selection: $selectedTimeframe) {
                    ForEach(GoalTimeframe.allCases, id: \.self) { timeframe in
                        Text(timeframe.rawValue).tag(timeframe)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Goals List
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(dataManager.goalsForTimeframe(selectedTimeframe)) { goal in
                            GoalCard(goal: goal)
                        }

                        if dataManager.goalsForTimeframe(selectedTimeframe).isEmpty {
                            EmptyGoalsView(timeframe: selectedTimeframe)
                        }
                    }
                    .padding()
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Goals")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showingAddGoal = true }) {
                        Image(systemName: "plus.circle.fill")
                    }
                }
            }
            .sheet(isPresented: $showingAddGoal) {
                AddGoalView(timeframe: selectedTimeframe)
            }
        }
    }
}

// MARK: - Goal Card
struct GoalCard: View {
    let goal: Goal
    @State private var showingDetail = false

    var body: some View {
        Button(action: { showingDetail = true }) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    Image(systemName: goal.category.icon)
                        .foregroundStyle(categoryColor)

                    Text(goal.title)
                        .font(.headline)
                        .foregroundStyle(.primary)

                    Spacer()

                    Text("\(goal.progress)%")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.secondary)
                }

                // Progress Bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color(.systemGray5))
                            .frame(height: 8)

                        RoundedRectangle(cornerRadius: 4)
                            .fill(categoryColor)
                            .frame(width: geometry.size.width * CGFloat(goal.progress) / 100, height: 8)
                    }
                }
                .frame(height: 8)

                // Description
                if !goal.description.isEmpty {
                    Text(goal.description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                // Milestones Preview
                if !goal.milestones.isEmpty {
                    HStack(spacing: 8) {
                        let completed = goal.milestones.filter { $0.isCompleted }.count
                        Text("\(completed)/\(goal.milestones.count) milestones")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(16)
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showingDetail) {
            GoalDetailView(goal: goal)
        }
    }

    private var categoryColor: Color {
        switch goal.category {
        case .career: return .blue
        case .relationships: return .pink
        case .health: return .green
        case .meaning: return .purple
        case .finances: return .yellow
        case .fun: return .orange
        case .growth: return .teal
        }
    }
}

// MARK: - Empty Goals View
struct EmptyGoalsView: View {
    let timeframe: GoalTimeframe

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "target")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)

            Text("No \(timeframe.rawValue) Goals Yet")
                .font(.headline)

            Text("Set goals that align with your North Star.\nStart with what matters most.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
    }
}

// MARK: - Add Goal View
struct AddGoalView: View {
    @EnvironmentObject var dataManager: DataManager
    @Environment(\.dismiss) var dismiss
    let timeframe: GoalTimeframe

    @State private var title = ""
    @State private var description = ""
    @State private var category: GoalCategory = .career
    @State private var whyItMatters = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Goal Title", text: $title)

                    TextEditor(text: $description)
                        .frame(minHeight: 60)
                }

                Section("Category") {
                    Picker("Category", selection: $category) {
                        ForEach(GoalCategory.allCases, id: \.self) { cat in
                            Label(cat.rawValue, systemImage: cat.icon)
                                .tag(cat)
                        }
                    }
                }

                Section("Why It Matters") {
                    TextEditor(text: $whyItMatters)
                        .frame(minHeight: 80)
                }

                Section {
                    Text("Timeframe: \(timeframe.rawValue)")
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("New Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let goal = Goal(
                            title: title,
                            description: description,
                            category: category,
                            timeframe: timeframe,
                            whyItMatters: whyItMatters
                        )
                        dataManager.saveGoal(goal)
                        dismiss()
                    }
                    .disabled(title.isEmpty)
                }
            }
        }
    }
}

// MARK: - Goal Detail View
struct GoalDetailView: View {
    @EnvironmentObject var dataManager: DataManager
    @Environment(\.dismiss) var dismiss
    @State var goal: Goal
    @State private var newMilestone = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Image(systemName: goal.category.icon)
                            .foregroundStyle(.accentColor)
                        Text(goal.category.rawValue)
                            .foregroundStyle(.secondary)
                    }

                    if !goal.description.isEmpty {
                        Text(goal.description)
                    }
                }

                Section("Progress") {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("\(goal.progress)%")
                                .font(.title2)
                                .fontWeight(.bold)
                            Spacer()
                        }

                        Slider(value: Binding(
                            get: { Double(goal.progress) },
                            set: { goal.progress = Int($0) }
                        ), in: 0...100, step: 5)
                    }
                }

                Section("Milestones") {
                    ForEach($goal.milestones) { $milestone in
                        HStack {
                            Button(action: { milestone.isCompleted.toggle() }) {
                                Image(systemName: milestone.isCompleted ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(milestone.isCompleted ? .green : .secondary)
                            }

                            Text(milestone.title)
                                .strikethrough(milestone.isCompleted)
                                .foregroundStyle(milestone.isCompleted ? .secondary : .primary)
                        }
                    }
                    .onDelete { indexSet in
                        goal.milestones.remove(atOffsets: indexSet)
                    }

                    HStack {
                        TextField("Add milestone...", text: $newMilestone)
                        Button(action: addMilestone) {
                            Image(systemName: "plus.circle.fill")
                        }
                        .disabled(newMilestone.isEmpty)
                    }
                }

                if !goal.whyItMatters.isEmpty {
                    Section("Why It Matters") {
                        Text(goal.whyItMatters)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle(goal.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        dataManager.saveGoal(goal)
                        dismiss()
                    }
                }
            }
        }
    }

    private func addMilestone() {
        let milestone = Milestone(title: newMilestone)
        goal.milestones.append(milestone)
        newMilestone = ""
    }
}

#Preview {
    GoalsView()
        .environmentObject(DataManager())
}
