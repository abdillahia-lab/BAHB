import SwiftUI

struct VividVisionView: View {
    @EnvironmentObject var dataManager: DataManager
    @State private var currentSection = 0
    @State private var vision = VividVision()

    private let sections = [
        "Morning",
        "Work",
        "Relationships",
        "Health",
        "Lifestyle"
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
                VisionMorningSection(vision: $vision)
                    .tag(0)

                VisionWorkSection(vision: $vision)
                    .tag(1)

                VisionRelationshipsSection(vision: $vision)
                    .tag(2)

                VisionHealthSection(vision: $vision)
                    .tag(3)

                VisionLifestyleSection(vision: $vision)
                    .tag(4)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
        }
        .navigationTitle("Vivid Vision")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    saveVision()
                }
            }
        }
        .onAppear {
            loadVision()
        }
    }

    private func saveVision() {
        let encoder = JSONEncoder()
        if let data = try? encoder.encode(vision) {
            UserDefaults.standard.set(data, forKey: "vividVision")
        }
    }

    private func loadVision() {
        if let data = UserDefaults.standard.data(forKey: "vividVision"),
           let decoded = try? JSONDecoder().decode(VividVision.self, from: data) {
            vision = decoded
        }
    }
}

// MARK: - Vivid Vision Model
struct VividVision: Codable {
    var targetDate: Date = Calendar.current.date(byAdding: .year, value: 3, to: Date()) ?? Date()
    var morningSnapshot: String = ""
    var workRole: String = ""
    var workDay: String = ""
    var workImpact: String = ""
    var partnerRelationship: String = ""
    var friendships: String = ""
    var physicalState: String = ""
    var energyLevels: String = ""
    var mentalState: String = ""
    var livingLocation: String = ""
    var typicalDay: String = ""
    var overallFeeling: String = ""
    var oneWord: String = ""
}

// MARK: - Morning Section
struct VisionMorningSection: View {
    @Binding var vision: VividVision

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("Morning Snapshot")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("Describe a typical morning in your future life. Write in present tense, as if it's already true.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                // Target Date
                DatePicker(
                    "Vision Date",
                    selection: $vision.targetDate,
                    displayedComponents: .date
                )
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)

                // Morning Description
                VStack(alignment: .leading, spacing: 8) {
                    Text("I wake up...")
                        .font(.headline)

                    Text("Where are you? What do you see? Who is there? How do you feel?")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    TextEditor(text: $vision.morningSnapshot)
                        .frame(minHeight: 200)
                        .padding(8)
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                }
            }
            .padding()
        }
    }
}

// MARK: - Work Section
struct VisionWorkSection: View {
    @Binding var vision: VividVision

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Work & Career")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("Describe your professional life in vivid detail.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VisionTextField(title: "My role is...", text: $vision.workRole)
                VisionTextField(title: "My typical work day involves...", text: $vision.workDay)
                VisionTextField(title: "The impact I'm having is...", text: $vision.workImpact)
            }
            .padding()
        }
    }
}

// MARK: - Relationships Section
struct VisionRelationshipsSection: View {
    @Binding var vision: VividVision

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Relationships")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("Describe your key relationships in this future life.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VisionTextField(title: "My relationship with my partner is...", text: $vision.partnerRelationship)
                VisionTextField(title: "My friendships look like...", text: $vision.friendships)
            }
            .padding()
        }
    }
}

// MARK: - Health Section
struct VisionHealthSection: View {
    @Binding var vision: VividVision

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Health & Energy")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("Describe your physical and mental state.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VisionTextField(title: "My body feels...", text: $vision.physicalState)
                VisionTextField(title: "My energy levels are...", text: $vision.energyLevels)
                VisionTextField(title: "My mental and emotional state is...", text: $vision.mentalState)
            }
            .padding()
        }
    }
}

// MARK: - Lifestyle Section
struct VisionLifestyleSection: View {
    @Binding var vision: VividVision

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Environment & Lifestyle")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("Describe the texture of your daily life.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VisionTextField(title: "I live in...", text: $vision.livingLocation)
                VisionTextField(title: "My typical day feels like...", text: $vision.typicalDay)

                VStack(alignment: .leading, spacing: 8) {
                    Text("The Feeling")
                        .font(.headline)

                    Text("On a typical day in this future life, I feel...")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    TextEditor(text: $vision.overallFeeling)
                        .frame(minHeight: 120)
                        .padding(8)
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("One Word")
                        .font(.headline)

                    Text("The single word that captures this life is...")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    TextField("One word...", text: $vision.oneWord)
                        .font(.title2)
                        .textFieldStyle(.roundedBorder)
                }
            }
            .padding()
        }
    }
}

// MARK: - Vision Text Field
struct VisionTextField: View {
    let title: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)

            TextEditor(text: $text)
                .frame(minHeight: 100)
                .padding(8)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
        }
    }
}

// MARK: - Annual Review View
struct AnnualReviewView: View {
    @State private var currentSection = 0

    private let sections = [
        "Year Story",
        "Achievements",
        "Lessons",
        "Gratitude",
        "Next Year"
    ]

    var body: some View {
        VStack(spacing: 0) {
            // Progress indicator
            ProgressView(value: Double(currentSection + 1), total: Double(sections.count))
                .padding(.horizontal)
                .padding(.top, 8)

            Text("Section \(currentSection + 1) of \(sections.count): \(sections[currentSection])")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.vertical, 8)

            TabView(selection: $currentSection) {
                AnnualStorySection()
                    .tag(0)

                AnnualAchievementsSection()
                    .tag(1)

                AnnualLessonsSection()
                    .tag(2)

                AnnualGratitudeSection()
                    .tag(3)

                AnnualNextYearSection()
                    .tag(4)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
        }
        .navigationTitle("Annual Review")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct AnnualStorySection: View {
    @State private var narrative = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("The Year's Story")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("Write the story of your year—not a list, but a narrative of what happened.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                TextEditor(text: $narrative)
                    .frame(minHeight: 300)
                    .padding(8)
                    .background(Color(.secondarySystemGroupedBackground))
                    .cornerRadius(12)
            }
            .padding()
        }
    }
}

struct AnnualAchievementsSection: View {
    @State private var achievements: [String] = []
    @State private var newAchievement = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("What did you accomplish?")
                    .font(.title2)
                    .fontWeight(.semibold)

                ForEach(achievements, id: \.self) { achievement in
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text(achievement)
                        Spacer()
                    }
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .cornerRadius(12)
                }

                HStack {
                    TextField("Add achievement...", text: $newAchievement)
                        .textFieldStyle(.roundedBorder)
                    Button(action: {
                        achievements.append(newAchievement)
                        newAchievement = ""
                    }) {
                        Image(systemName: "plus.circle.fill")
                    }
                    .disabled(newAchievement.isEmpty)
                }
            }
            .padding()
        }
    }
}

struct AnnualLessonsSection: View {
    @State private var lessons: [String] = []
    @State private var newLesson = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("What did you learn?")
                    .font(.title2)
                    .fontWeight(.semibold)

                ForEach(lessons, id: \.self) { lesson in
                    HStack {
                        Image(systemName: "lightbulb.fill")
                            .foregroundStyle(.yellow)
                        Text(lesson)
                        Spacer()
                    }
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .cornerRadius(12)
                }

                HStack {
                    TextField("Add lesson...", text: $newLesson)
                        .textFieldStyle(.roundedBorder)
                    Button(action: {
                        lessons.append(newLesson)
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

struct AnnualGratitudeSection: View {
    @State private var gratitude: [String] = []
    @State private var newGratitude = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("What are you grateful for?")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("List 10 things—big and small. People, moments, luck, effort.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                ForEach(Array(gratitude.enumerated()), id: \.offset) { index, item in
                    HStack {
                        Text("\(index + 1).")
                            .foregroundStyle(.secondary)
                        Text(item)
                        Spacer()
                    }
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .cornerRadius(12)
                }

                if gratitude.count < 10 {
                    HStack {
                        TextField("Add gratitude...", text: $newGratitude)
                            .textFieldStyle(.roundedBorder)
                        Button(action: {
                            gratitude.append(newGratitude)
                            newGratitude = ""
                        }) {
                            Image(systemName: "plus.circle.fill")
                        }
                        .disabled(newGratitude.isEmpty)
                    }
                }
            }
            .padding()
        }
    }
}

struct AnnualNextYearSection: View {
    @State private var nextYearFocus = ""
    @State private var oneWord = ""
    @State private var feeling = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Next Year")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("Set your intention for the year ahead.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("What do you want next year to be about?")
                        .font(.headline)

                    TextEditor(text: $nextYearFocus)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("One word for next year")
                        .font(.headline)

                    TextField("One word...", text: $oneWord)
                        .font(.title2)
                        .textFieldStyle(.roundedBorder)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("How do you want to feel at the end of next year?")
                        .font(.headline)

                    TextEditor(text: $feeling)
                        .frame(minHeight: 80)
                        .padding(8)
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                }
            }
            .padding()
        }
    }
}

#Preview {
    NavigationStack {
        VividVisionView()
            .environmentObject(DataManager())
    }
}
