import SwiftUI

struct WeeklyAssessmentGateView: View {
    @EnvironmentObject var appState: AppState
    @State private var glowPulse = false

    private var profile: CognitiveProfile { appState.cognitiveProfile }

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            // Ambient glow
            Circle()
                .fill(Color.neonCyan.opacity(glowPulse ? 0.08 : 0.04))
                .frame(width: 300, height: 300)
                .blur(radius: 80)
                .offset(y: -100)
                .ignoresSafeArea()
                .accessibilityHidden(true)

            VStack(spacing: 0) {
                Spacer().frame(height: 80)

                // Brain icon
                ZStack {
                    Circle()
                        .fill(Color.neonCyan.opacity(0.1))
                        .frame(width: 80, height: 80)
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 36))
                        .foregroundStyle(Color.neonCyan)
                        .scaleEffect(glowPulse ? 1.05 : 0.95)
                }
                .accessibilityHidden(true)

                Spacer().frame(height: 28)

                // Header
                Text("WEEKLY ASSESSMENT DUE")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(4)
                    .foregroundStyle(Color.neonCyan.opacity(0.7))

                Spacer().frame(height: 12)

                Text("Track Your Progress")
                    .font(.system(size: 28, weight: .thin))
                    .tracking(0.5)
                    .foregroundStyle(Color.textPrimary)

                Spacer().frame(height: 16)

                // Current score summary
                VStack(spacing: 8) {
                    Text("Current Cognitive Index")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.textMuted)

                    Text("\(Int(profile.compositeScore))")
                        .font(.system(size: 48, weight: .ultraLight, design: .monospaced))
                        .foregroundStyle(Color.textPrimary)

                    Text(profile.classificationLevel.uppercased())
                        .font(.system(size: 9, weight: .heavy))
                        .tracking(2)
                        .foregroundStyle(Color.neonCyan)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color.neonCyan.opacity(0.15), in: Capsule())
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Current cognitive index: \(Int(profile.compositeScore)), level: \(profile.classificationLevel)")

                Spacer().frame(height: 28)

                // Explanation
                Text("Complete your weekly assessment to unlock\nstreak bonuses and daily challenge rewards.")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 12)

                Text("Without it, XP multiplier stays at 1.0x")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.textMuted)

                Spacer()

                // Buttons
                VStack(spacing: 12) {
                    Button {
                        HapticService.shared.medium()
                        SoundService.shared.playStartTraining()
                        // Start assessment immediately — game loads under the cover
                        appState.startAssessment(type: "weekly")
                        appState.showWeeklyAssessmentGate = false
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "brain")
                            Text("Start Assessment")
                        }
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.bgPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            LinearGradient(
                                colors: [.neonCyan, .neonCyan.opacity(0.7)],
                                startPoint: .leading,
                                endPoint: .trailing
                            ),
                            in: Capsule()
                        )
                    }
                    .accessibilityLabel("Start Assessment")
                    .accessibilityHint("Begins the weekly cognitive assessment")

                    Button {
                        HapticService.shared.light()
                        appState.weeklyGateSkippedThisSession = true
                        appState.showWeeklyAssessmentGate = false
                    } label: {
                        Text("Play Later")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.textSecondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .accessibilityLabel("Play Later")
                    .accessibilityHint("Skip the assessment and play at reduced XP")
                }
                .padding(.horizontal, 32)
                .padding(.bottom, max(20, UIApplication.shared.windowSafeAreaBottom))
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
                glowPulse = true
            }
        }
    }
}
