import SwiftUI

struct DailyCheckInView: View {
    @EnvironmentObject var dataManager: DataManager
    @State private var currentStep = 0
    @State private var checkIn: DailyCheckIn = DailyCheckIn()
    @State private var showingCompletion = false
    @Environment(\.dismiss) var dismiss

    private let steps = [
        "Energy",
        "Win",
        "Friction",
        "Let Go",
        "Tomorrow"
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Progress Bar
                ProgressBar(currentStep: currentStep, totalSteps: steps.count)
                    .padding()

                // Step Content
                TabView(selection: $currentStep) {
                    EnergyStepView(energyLevel: $checkIn.energyLevel)
                        .tag(0)

                    WinStepView(meaningfulWin: $checkIn.meaningfulWin)
                        .tag(1)

                    FrictionStepView(frictionPoint: $checkIn.frictionPoint)
                        .tag(2)

                    LetGoStepView(thingToLetGo: $checkIn.thingToLetGo)
                        .tag(3)

                    TomorrowStepView(tomorrowPriority: $checkIn.tomorrowPriority)
                        .tag(4)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: currentStep)

                // Navigation Buttons
                HStack(spacing: 16) {
                    if currentStep > 0 {
                        Button(action: { withAnimation { currentStep -= 1 } }) {
                            HStack {
                                Image(systemName: "chevron.left")
                                Text("Back")
                            }
                        }
                        .buttonStyle(.bordered)
                    }

                    Spacer()

                    if currentStep < steps.count - 1 {
                        Button(action: { withAnimation { currentStep += 1 } }) {
                            HStack {
                                Text("Next")
                                Image(systemName: "chevron.right")
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(!isCurrentStepValid)
                    } else {
                        Button(action: completeCheckIn) {
                            HStack {
                                Text("Complete")
                                Image(systemName: "checkmark")
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(!isCheckInValid)
                    }
                }
                .padding()
            }
            .navigationTitle("Daily Check-In")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .sheet(isPresented: $showingCompletion) {
                CheckInCompletionView(checkIn: checkIn)
            }
            .onAppear {
                if let existing = dataManager.todaysCheckIn() {
                    checkIn = existing
                }
            }
        }
    }

    private var isCurrentStepValid: Bool {
        switch currentStep {
        case 0: return true // Energy always has a value
        case 1: return !checkIn.meaningfulWin.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        case 2: return !checkIn.frictionPoint.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        case 3: return !checkIn.thingToLetGo.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        case 4: return !checkIn.tomorrowPriority.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        default: return true
        }
    }

    private var isCheckInValid: Bool {
        checkIn.isComplete
    }

    private func completeCheckIn() {
        dataManager.saveCheckIn(checkIn)
        showingCompletion = true
    }
}

// MARK: - Progress Bar
struct ProgressBar: View {
    let currentStep: Int
    let totalSteps: Int

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<totalSteps, id: \.self) { step in
                RoundedRectangle(cornerRadius: 2)
                    .fill(step <= currentStep ? Color.accentColor : Color(.systemGray4))
                    .frame(height: 4)
                    .animation(.easeInOut, value: currentStep)
            }
        }
    }
}

// MARK: - Energy Step
struct EnergyStepView: View {
    @Binding var energyLevel: Int

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            VStack(spacing: 16) {
                Text("How's your energy today?")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .multilineTextAlignment(.center)

                Text("1 = depleted, 10 = fully charged")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            // Energy Slider
            VStack(spacing: 24) {
                Text("\(energyLevel)")
                    .font(.system(size: 72, weight: .bold, design: .rounded))
                    .foregroundStyle(energyColor)

                Slider(value: Binding(
                    get: { Double(energyLevel) },
                    set: { energyLevel = Int($0) }
                ), in: 1...10, step: 1)
                .tint(energyColor)
                .padding(.horizontal, 32)

                HStack {
                    Text("Depleted")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("Fully Charged")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 32)
            }

            Spacer()
        }
        .padding()
    }

    private var energyColor: Color {
        switch energyLevel {
        case 1...3: return .red
        case 4...6: return .orange
        case 7...8: return .yellow
        default: return .green
        }
    }
}

// MARK: - Win Step
struct WinStepView: View {
    @Binding var meaningfulWin: String
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            VStack(spacing: 16) {
                Image(systemName: "trophy.fill")
                    .font(.largeTitle)
                    .foregroundStyle(.yellow)

                Text("One meaningful win")
                    .font(.title2)
                    .fontWeight(.semibold)

                Text("What moved the needle today?\nNot just busy work—actual progress.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            TextEditor(text: $meaningfulWin)
                .frame(height: 120)
                .padding(8)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
                .focused($isFocused)
                .padding(.horizontal)

            Spacer()
        }
        .padding()
        .onAppear { isFocused = true }
    }
}

// MARK: - Friction Step
struct FrictionStepView: View {
    @Binding var frictionPoint: String
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            VStack(spacing: 16) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.largeTitle)
                    .foregroundStyle(.orange)

                Text("One friction point")
                    .font(.title2)
                    .fontWeight(.semibold)

                Text("What created resistance today?\nA person, task, decision, or pattern.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            TextEditor(text: $frictionPoint)
                .frame(height: 120)
                .padding(8)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
                .focused($isFocused)
                .padding(.horizontal)

            Spacer()
        }
        .padding()
        .onAppear { isFocused = true }
    }
}

// MARK: - Let Go Step
struct LetGoStepView: View {
    @Binding var thingToLetGo: String
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            VStack(spacing: 16) {
                Image(systemName: "leaf.fill")
                    .font(.largeTitle)
                    .foregroundStyle(.green)

                Text("One thing to let go of")
                    .font(.title2)
                    .fontWeight(.semibold)

                Text("What are you holding onto that isn't serving you?\nWorry, resentment, perfectionism, a decision already made.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            TextEditor(text: $thingToLetGo)
                .frame(height: 120)
                .padding(8)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
                .focused($isFocused)
                .padding(.horizontal)

            Spacer()
        }
        .padding()
        .onAppear { isFocused = true }
    }
}

// MARK: - Tomorrow Step
struct TomorrowStepView: View {
    @Binding var tomorrowPriority: String
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            VStack(spacing: 16) {
                Image(systemName: "sunrise.fill")
                    .font(.largeTitle)
                    .foregroundStyle(.orange)

                Text("One priority for tomorrow")
                    .font(.title2)
                    .fontWeight(.semibold)

                Text("If you could only accomplish one thing,\nwhat would matter most?")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            TextEditor(text: $tomorrowPriority)
                .frame(height: 120)
                .padding(8)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
                .focused($isFocused)
                .padding(.horizontal)

            Spacer()
        }
        .padding()
        .onAppear { isFocused = true }
    }
}

// MARK: - Completion View
struct CheckInCompletionView: View {
    let checkIn: DailyCheckIn
    @Environment(\.dismiss) var dismiss

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundStyle(.green)

            VStack(spacing: 8) {
                Text("Check-In Complete")
                    .font(.title)
                    .fontWeight(.bold)

                Text("You took 5 minutes for clarity.\nThat compounds over time.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            // Summary Card
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Energy")
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(checkIn.energyLevel)/10")
                        .fontWeight(.medium)
                }

                Divider()

                VStack(alignment: .leading, spacing: 4) {
                    Text("Tomorrow's Priority")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(checkIn.tomorrowPriority)
                        .font(.subheadline)
                }
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(16)
            .padding(.horizontal)

            Spacer()

            Button("Done") {
                dismiss()
                // Pop to root
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .padding(.bottom, 32)
        }
    }
}

#Preview {
    DailyCheckInView()
        .environmentObject(DataManager())
}
