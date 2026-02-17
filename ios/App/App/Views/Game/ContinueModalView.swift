import SwiftUI

struct ContinueModalView: View {
    @EnvironmentObject var appState: AppState
    let coordinator: GameBridgeCoordinator

    @State private var countdown = 10
    @State private var timer: Timer?

    // Animations
    @State private var showContent = false
    @State private var glowPulse = false
    @State private var iconBounce = false
    @State private var animatedStreak = 0
    @State private var ringProgress: CGFloat = 1.0

    private let continueCost = 2000

    private var canAffordXP: Bool {
        appState.userStats.totalXP >= continueCost
    }

    private var deathData: GameResult? {
        appState.pendingDeathData
    }

    private var isNewRecord: Bool {
        guard let data = deathData else { return false }
        return data.streak > appState.userStats.endlessBestStreak
    }

    var body: some View {
        ZStack {
            // MARK: - Background
            Color.black.opacity(0.9)
                .ignoresSafeArea()

            // Red vignette
            Rectangle()
                .fill(.clear)
                .overlay {
                    Rectangle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    .clear,
                                    Color.danger.opacity(glowPulse ? 0.14 : 0.06)
                                ],
                                center: .center,
                                startRadius: 80,
                                endRadius: 450
                            )
                        )
                }
                .ignoresSafeArea()
                .accessibilityHidden(true)

            // Depth circles
            Circle()
                .fill(Color.danger.opacity(glowPulse ? 0.1 : 0.04))
                .frame(width: 300, height: 300)
                .blur(radius: 80)
                .offset(x: -100, y: -200)
                .ignoresSafeArea()
                .accessibilityHidden(true)

            Circle()
                .fill(Color.danger.opacity(glowPulse ? 0.08 : 0.03))
                .frame(width: 250, height: 250)
                .blur(radius: 70)
                .offset(x: 120, y: 150)
                .ignoresSafeArea()
                .accessibilityHidden(true)

            // MARK: - Content
            VStack(spacing: 28) {
                Spacer()

                // Header label
                Text("ELIMINATED")
                    .font(.system(size: 11, weight: .bold))
                    .tracking(4)
                    .foregroundStyle(Color.danger.opacity(0.7))
                    .opacity(showContent ? 1 : 0)
                    .offset(y: showContent ? 0 : 10)
                    .animation(.spring(response: 0.4, dampingFraction: 0.85), value: showContent)

                // Skull icon
                ZStack {
                    Circle()
                        .fill(Color.danger.opacity(glowPulse ? 0.25 : 0.1))
                        .frame(width: 70, height: 70)
                        .blur(radius: 20)

                    Image(systemName: "skull.fill")
                        .font(.system(size: 44))
                        .foregroundStyle(Color.danger)
                        .scaleEffect(iconBounce ? 1.1 : 0.95)
                }
                .opacity(showContent ? 1 : 0)
                .offset(y: showContent ? 0 : 15)
                .animation(.spring(response: 0.4, dampingFraction: 0.85).delay(0.05), value: showContent)
                .accessibilityHidden(true)

                // New record badge
                if isNewRecord {
                    HStack(spacing: 6) {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 14))
                        Text("NEW RECORD!")
                            .font(.system(size: 12, weight: .bold))
                            .tracking(2)
                    }
                    .foregroundStyle(Color.neonGold)
                    .opacity(showContent ? 1 : 0)
                    .offset(y: showContent ? 0 : 10)
                    .animation(.spring(response: 0.4, dampingFraction: 0.85).delay(0.1), value: showContent)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("New record")
                }

                // Streak number
                VStack(spacing: 6) {
                    Text("\(animatedStreak)")
                        .font(.system(size: 64, weight: .ultraLight, design: .monospaced))
                        .foregroundStyle(Color.textPrimary)
                        .contentTransition(.numericText())

                    Text("STREAK")
                        .font(.system(size: 10, weight: .bold))
                        .tracking(2)
                        .foregroundStyle(Color.textMuted)
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Streak")
                .accessibilityValue("\(deathData?.streak ?? 0)")
                .opacity(showContent ? 1 : 0)
                .offset(y: showContent ? 0 : 15)
                .animation(.spring(response: 0.4, dampingFraction: 0.85).delay(0.1), value: showContent)

                // Stats row
                HStack(spacing: 0) {
                    animatedStat(
                        icon: "checkmark.circle.fill",
                        value: "\(deathData?.correct ?? 0)",
                        label: "CORRECT",
                        color: .success,
                        delay: 0.15
                    )

                    animatedStat(
                        icon: "star.fill",
                        value: "\(deathData?.sessionXP ?? 0)",
                        label: "XP EARNED",
                        color: .neonGold,
                        delay: 0.25
                    )
                }
                .padding(.horizontal, 24)

                Spacer()

                // Countdown ring
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.08), lineWidth: 3)
                        .frame(width: 72, height: 72)

                    Circle()
                        .trim(from: 0, to: ringProgress)
                        .stroke(Color.danger.opacity(0.6), style: StrokeStyle(lineWidth: 3, lineCap: .round))
                        .frame(width: 72, height: 72)
                        .rotationEffect(.degrees(-90))

                    Text("\(countdown)")
                        .font(.system(size: 32, weight: .ultraLight, design: .monospaced))
                        .foregroundStyle(Color.textPrimary.opacity(0.6))
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Countdown timer")
                .accessibilityValue("\(countdown) seconds remaining")
                .opacity(showContent ? 1 : 0)
                .animation(.spring(response: 0.4, dampingFraction: 0.85).delay(0.3), value: showContent)

                // Action buttons
                VStack(spacing: 12) {
                    // Continue with XP
                    Button {
                        stopTimer()
                        appState.userStats.totalXP -= continueCost
                        appState.continueWithXP()
                        coordinator.sendContinueGame()
                    } label: {
                        VStack(spacing: 4) {
                            HStack(spacing: 8) {
                                Image(systemName: "star.fill")
                                Text("Continue for \(continueCost.formatted()) XP")
                            }
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(canAffordXP ? .bgPrimary : .textMuted)

                            if !canAffordXP {
                                Text("Not enough XP")
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(canAffordXP ? Color.bgPrimary.opacity(0.6) : Color.textMuted.opacity(0.6))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            canAffordXP ? Color.neonGold : Color.textMuted.opacity(0.2),
                            in: RoundedRectangle(cornerRadius: 14)
                        )
                    }
                    .disabled(!canAffordXP)
                    .accessibilityLabel("Continue for \(continueCost.formatted()) XP")
                    .accessibilityHint(canAffordXP ? "Spends XP to continue the run" : "Not enough XP to continue")

                    // End Run
                    Button {
                        stopTimer()
                        appState.endRun()
                    } label: {
                        Text("End Run")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.textSecondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                RoundedRectangle(cornerRadius: 14)
                                    .strokeBorder(Color.white.opacity(0.1), lineWidth: 1)
                            )
                    }
                    .accessibilityLabel("End Run")
                    .accessibilityHint("Ends the current run and shows results")
                }
                .padding(.horizontal, 32)
                .opacity(showContent ? 1 : 0)
                .offset(y: showContent ? 0 : 20)
                .animation(.spring(response: 0.4, dampingFraction: 0.85).delay(0.35), value: showContent)

                Spacer().frame(height: 20)
            }
            .padding(24)
        }
        .onAppear {
            startTimer()
            animateStreak()

            showContent = true

            withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
                glowPulse = true
            }
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true).delay(0.3)) {
                iconBounce = true
            }

            // Ring depletion
            withAnimation(.linear(duration: 10)) {
                ringProgress = 0
            }
        }
        .onDisappear {
            stopTimer()
        }
    }

    // MARK: - Animated Stat

    @ViewBuilder
    private func animatedStat(icon: String, value: String, label: String, color: Color, delay: Double) -> some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .fill(color.opacity(iconBounce ? 0.2 : 0.08))
                    .frame(width: 36, height: 36)
                    .blur(radius: 10)
                    .accessibilityHidden(true)

                Image(systemName: icon)
                    .font(.system(size: 22, weight: .medium))
                    .foregroundStyle(color)
                    .scaleEffect(iconBounce ? 1.1 : 0.95)
            }

            Text(value)
                .font(.system(size: 26, weight: .light))
                .monospacedDigit()
                .foregroundStyle(Color.textPrimary)

            Text(label)
                .font(.system(size: 9, weight: .bold))
                .tracking(1.5)
                .foregroundStyle(Color.textMuted)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(label)
        .accessibilityValue(value)
        .opacity(showContent ? 1 : 0)
        .offset(y: showContent ? 0 : 15)
        .animation(.spring(response: 0.4, dampingFraction: 0.85).delay(delay), value: showContent)
    }

    // MARK: - Streak Count-Up

    private func animateStreak() {
        let target = deathData?.streak ?? 0
        guard target > 0 else { return }
        let steps = 20
        let duration = 0.5
        let interval = duration / Double(steps)

        for i in 0...steps {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * interval) {
                let progress = Double(i) / Double(steps)
                let eased = 1 - pow(1 - progress, 3) // Cubic ease-out
                animatedStreak = Int(Double(target) * eased)
            }
        }
    }

    // MARK: - Timer

    private func startTimer() {
        countdown = 10
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            Task { @MainActor in
                if countdown > 1 {
                    countdown -= 1
                } else {
                    stopTimer()
                    appState.endRun()
                }
            }
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
}
