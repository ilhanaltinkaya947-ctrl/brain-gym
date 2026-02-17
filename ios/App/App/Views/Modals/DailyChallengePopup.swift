import SwiftUI

struct DailyChallengePopup: View {
    @EnvironmentObject var appState: AppState
    @State private var appeared = false
    @State private var iconPulse = false

    private var theme: AxonTheme { appState.currentTheme }
    private var target: Int { appState.dailyChallengeTarget }
    private var bonusXP: Int {
        Int(500.0 * appState.streakMultiplier)
    }

    var body: some View {
        ZStack {
            // Dimmed backdrop
            Color.black.opacity(appeared ? 0.6 : 0)
                .ignoresSafeArea()
                .onTapGesture {
                    dismiss()
                }
                .accessibilityHidden(true)

            // Popup card
            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 20) {
                    // Icon
                    ZStack {
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [theme.primary.color.opacity(0.25), .clear],
                                    center: .center,
                                    startRadius: 10,
                                    endRadius: 50
                                )
                            )
                            .frame(width: 100, height: 100)
                            .scaleEffect(iconPulse ? 1.15 : 0.95)

                        Circle()
                            .fill(theme.primary.color.opacity(0.12))
                            .frame(width: 60, height: 60)
                            .overlay(
                                Circle()
                                    .strokeBorder(theme.primary.color.opacity(0.3), lineWidth: 1)
                            )

                        Image(systemName: "target")
                            .font(.system(size: 26, weight: .medium))
                            .foregroundStyle(theme.primary.color)
                    }
                    .accessibilityHidden(true)

                    // Title
                    VStack(spacing: 6) {
                        Text("DAILY CHALLENGE")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(4)
                            .foregroundStyle(theme.primary.color.opacity(0.7))

                        Text("Today's Mission")
                            .font(.system(size: 22, weight: .thin))
                            .tracking(0.5)
                            .foregroundStyle(Color.textPrimary)
                    }

                    // Challenge description
                    VStack(spacing: 8) {
                        Text("Get **\(target)** correct answers")
                            .font(.system(size: 17, weight: .regular))
                            .foregroundStyle(Color.textPrimary)

                        Text("in any game mode")
                            .font(.system(size: 14))
                            .foregroundStyle(Color.textSecondary)
                    }

                    // Reward
                    HStack(spacing: 8) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 14))
                            .foregroundStyle(Color.neonGold)
                        Text("+\(bonusXP) XP")
                            .font(.system(size: 16, weight: .bold, design: .monospaced))
                            .foregroundStyle(Color.neonGold)
                        if appState.streakMultiplier > 1.0 {
                            Text("(\(String(format: "%.1f", appState.streakMultiplier))x)")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(Color.neonGold.opacity(0.6))
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.neonGold.opacity(0.08), in: Capsule())
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Reward: plus \(bonusXP) XP")

                    // Start button
                    Button {
                        HapticService.shared.medium()
                        SoundService.shared.playStartTraining()
                        appState.showDailyChallenge = false
                        // Small delay so popup dismisses first
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            appState.showModeSelection = true
                        }
                    } label: {
                        HStack(spacing: 8) {
                            Text("Start Training")
                                .font(.system(size: 16, weight: .semibold))
                            Image(systemName: "bolt.fill")
                                .font(.system(size: 13))
                        }
                        .foregroundColor(.bgPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            LinearGradient(
                                colors: [.white, Color(white: 0.85)],
                                startPoint: .top,
                                endPoint: .bottom
                            ),
                            in: RoundedRectangle(cornerRadius: 14)
                        )
                    }
                    .accessibilityLabel("Start Training")
                    .accessibilityHint("Starts training to complete the daily challenge")

                    // Dismiss
                    Button {
                        dismiss()
                    } label: {
                        Text("Later")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Color.textMuted)
                    }
                    .accessibilityLabel("Later")
                    .accessibilityHint("Dismisses the daily challenge popup")
                }
                .padding(.horizontal, 28)
                .padding(.vertical, 28)
                .background {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color.bgCard)
                        .overlay {
                            RoundedRectangle(cornerRadius: 24)
                                .strokeBorder(
                                    LinearGradient(
                                        colors: [theme.primary.color.opacity(0.2), theme.primary.color.opacity(0.05)],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    ),
                                    lineWidth: 1
                                )
                        }
                        .shadow(color: theme.primary.color.opacity(0.08), radius: 30, y: 10)
                }
                .padding(.horizontal, 28)
                .scaleEffect(appeared ? 1 : 0.9)
                .opacity(appeared ? 1 : 0)

                Spacer()
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
                appeared = true
            }
            withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
                iconPulse = true
            }
        }
    }

    private func dismiss() {
        HapticService.shared.light()
        withAnimation(.easeOut(duration: 0.25)) {
            appeared = false
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            appState.showDailyChallenge = false
        }
    }
}
