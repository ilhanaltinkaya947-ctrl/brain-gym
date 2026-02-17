import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.scenePhase) private var scenePhase
    @State private var edgePulse = false
    @State private var floatBob = false
    @State private var floatTilt = false

    private func formatNumber(_ num: Int) -> String {
        if num >= 1000 {
            return String(format: "%.1fk", Double(num) / 1000.0)
        }
        return "\(num)"
    }

    private var theme: AxonTheme { appState.currentTheme }

    private var screenHeight: CGFloat { UIScreen.main.bounds.height }
    private var isCompact: Bool { screenHeight < 700 }
    private var isTall: Bool { screenHeight > 850 }
    private var bottomInset: CGFloat { UIApplication.shared.windowSafeAreaBottom }

    var body: some View {
        ZStack {
            // Ambient edge glow — themed
            EdgeGlowView(pulse: edgePulse, primaryColor: theme.primary.color, secondaryColor: theme.secondary.color)
                .ignoresSafeArea()
                .accessibilityHidden(true)

            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("axon")
                            .font(.system(size: 20, weight: .ultraLight))
                            .tracking(6)
                            .foregroundStyle(Color.textPrimary)

                        Text("NEURAL TRAINING")
                            .font(.system(size: 8, weight: .medium))
                            .tracking(3)
                            .foregroundStyle(Color.textMuted)
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Axon Neural Training")

                    Spacer()

                    // Cognitive index badge
                    if appState.hasRealCognitiveData {
                        HStack(spacing: 5) {
                            Image(systemName: "brain.head.profile")
                                .font(.system(size: 11))
                                .foregroundStyle(cognitiveHeaderColor)
                            Text("\(Int(appState.cognitiveProfile.compositeScore))")
                                .font(.system(size: 13, weight: .semibold, design: .monospaced))
                                .foregroundStyle(Color.textPrimary)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(.ultraThinMaterial.opacity(0.5), in: Capsule())
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel("Cognitive index")
                        .accessibilityValue("\(Int(appState.cognitiveProfile.compositeScore))")
                    }

                    // Settings gear
                    Button {
                        HapticService.shared.light()
                        appState.showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                            .font(.system(size: 16, weight: .regular))
                            .foregroundStyle(Color.textSecondary)
                            .frame(width: 40, height: 40)
                            .background(.ultraThinMaterial.opacity(0.3), in: Circle())
                    }
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
                    .accessibilityLabel("Settings")
                    .accessibilityHint("Opens app settings")
                }
                .padding(.horizontal, 24)
                .padding(.top, 8)

                Spacer().frame(minHeight: isCompact ? 4 : 8, maxHeight: isTall ? 40 : 20)

                // Neural Core Hero Area — floating, no card container
                // Hidden when app is backgrounded to stop all 80+ animations from consuming CPU
                if scenePhase == .active {
                    NeuralCoreView(charge: appState.brainCharge, theme: theme)
                        .frame(width: neuralCoreSize, height: neuralCoreSize)
                        .offset(y: floatBob ? -4 : 4)
                        .rotationEffect(.degrees(floatTilt ? 2 : -2))
                        .accessibilityLabel("Neural core visualization")
                        .accessibilityValue("Brain charge \(appState.brainCharge) percent")
                } else {
                    Color.clear
                        .frame(width: neuralCoreSize, height: neuralCoreSize)
                        .accessibilityHidden(true)
                }

                // Rank badge below neural core
                rankBadge
                    .padding(.top, 4)

                Spacer().frame(minHeight: 8, maxHeight: isTall ? 20 : 12)

                // Metric Cards
                HStack(spacing: 12) {
                    MetricCard(
                        icon: "flame",
                        value: "\(appState.userStats.endlessBestStreak)",
                        label: "Streak",
                        accentColor: .bioOrange
                    )

                    MetricCard(
                        icon: "star.fill",
                        value: formatNumber(appState.userStats.totalXP),
                        label: "Total XP",
                        accentColor: theme.accent.color
                    )

                    MetricCard(
                        icon: "trophy.fill",
                        value: formatNumber(appState.userStats.classicHighScore),
                        label: "Best",
                        accentColor: .bioTeal
                    )
                }
                .padding(.horizontal, 20)

                // Weekly Assessment Reminder
                if appState.isWeeklyGated {
                    weeklyReminderCard
                        .padding(.horizontal, 20)
                        .padding(.top, 8)
                }

                // Daily Challenge Card
                dailyChallengeCard
                    .padding(.horizontal, 20)
                    .padding(.top, isCompact ? 8 : 12)

                Spacer().frame(minHeight: isCompact ? 8 : 12, maxHeight: isTall ? 32 : 20)

                // Start Training CTA
                Button {
                    HapticService.shared.medium()
                    SoundService.shared.playStartTraining()
                    if appState.isWeeklyGated && !appState.weeklyGateSkippedThisSession {
                        appState.showWeeklyAssessmentGate = true
                    } else {
                        appState.showModeSelection = true
                    }
                } label: {
                    HStack(spacing: 10) {
                        Text("Start Training")
                            .font(.system(size: 17, weight: .semibold))
                            .tracking(0.3)

                        Image(systemName: "bolt.fill")
                            .font(.system(size: 14))
                    }
                    .foregroundColor(.bgPrimary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        LinearGradient(
                            colors: [.white, Color(white: 0.85)],
                            startPoint: .top,
                            endPoint: .bottom
                        ),
                        in: RoundedRectangle(cornerRadius: 16)
                    )
                    .shadow(color: .white.opacity(0.1), radius: 20, y: 4)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 8)
                .accessibilityLabel("Start Training")
                .accessibilityHint("Opens game mode selection")

                // Games played subtitle
                if appState.userStats.totalGamesPlayed > 0 {
                    Text("\(appState.userStats.totalGamesPlayed) sessions completed")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.textMuted)
                        .padding(.bottom, bottomInset > 0 ? 4 : 12)
                        .accessibilityLabel("\(appState.userStats.totalGamesPlayed) sessions completed")
                } else {
                    Text("Begin your neural training")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.textMuted)
                        .padding(.bottom, bottomInset > 0 ? 4 : 12)
                        .accessibilityLabel("Begin your neural training")
                }

            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 4.0).repeatForever(autoreverses: true)) {
                edgePulse = true
            }
            withAnimation(.easeInOut(duration: 3.5).repeatForever(autoreverses: true)) {
                floatBob = true
            }
            withAnimation(.easeInOut(duration: 6.0).repeatForever(autoreverses: true)) {
                floatTilt = true
            }
            // Show daily challenge popup on first open of the day
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                appState.checkDailyChallenge()
            }
        }
    }

    // MARK: - Rank Badge
    private var rankBadge: some View {
        VStack(spacing: 4) {
            Text(appState.currentRank.rankName)
                .font(.system(size: 11, weight: .bold))
                .tracking(3)
                .foregroundStyle(theme.primary.color)

            // XP progress to next rank
            if let nextXP = AxonTheme.xpForNextRank(currentXP: appState.userStats.totalXP) {
                let currentRankXP = appState.currentRank.xpRequired
                let progress = Double(appState.userStats.totalXP - currentRankXP) / Double(nextXP - currentRankXP)
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(Color.white.opacity(0.08))
                            .frame(height: 3)
                        Capsule()
                            .fill(
                                LinearGradient(
                                    colors: [theme.primary.color, theme.secondary.color],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geo.size.width * max(0, min(1, progress)), height: 3)
                    }
                }
                .frame(width: 100, height: 3)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Rank: \(appState.currentRank.rankName)")
        .accessibilityValue("\(appState.userStats.totalXP) XP")
    }

    // MARK: - Daily Challenge Card
    @ViewBuilder
    private var dailyChallengeCard: some View {
        let target = appState.dailyChallengeTarget
        let progress = min(appState.userStats.dailyChallengeProgress, target)
        let isComplete = appState.isDailyChallengeComplete
        let today = DateFormatter.dayString.string(from: Date())
        let isActiveToday = appState.userStats.lastDailyChallengeDate == today

        HStack(spacing: 12) {
            // Icon
            ZStack {
                Circle()
                    .fill(isComplete ? Color.success.opacity(0.15) : theme.primary.color.opacity(0.1))
                    .frame(width: 36, height: 36)
                Image(systemName: isComplete ? "checkmark.circle.fill" : "target")
                    .font(.system(size: 18))
                    .foregroundStyle(isComplete ? Color.success : theme.primary.color)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(isComplete ? "CHALLENGE COMPLETE" : "DAILY CHALLENGE")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.5)
                    .foregroundStyle(isComplete ? Color.success : Color.textMuted)

                Text("Get \(target) correct answers")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.textSecondary)
            }

            Spacer()

            // Progress / reward
            VStack(alignment: .trailing, spacing: 2) {
                if isComplete {
                    Text("+500 XP")
                        .font(.system(size: 13, weight: .bold, design: .monospaced))
                        .foregroundStyle(Color.neonGold)
                } else {
                    Text("\(isActiveToday ? progress : 0)/\(target)")
                        .font(.system(size: 15, weight: .bold, design: .monospaced))
                        .foregroundStyle(Color.textPrimary)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background {
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white.opacity(0.04))
                .overlay {
                    RoundedRectangle(cornerRadius: 14)
                        .strokeBorder(
                            (isComplete ? Color.success : theme.primary.color).opacity(0.12),
                            lineWidth: 0.5
                        )
                }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(isComplete ? "Daily challenge complete, plus 500 XP" : "Daily challenge: get \(target) correct answers")
        .accessibilityValue(isComplete ? "Complete" : "\(isActiveToday ? progress : 0) of \(target)")
    }

    // MARK: - Weekly Reminder Card
    private var weeklyReminderCard: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.neonCyan.opacity(0.15))
                    .frame(width: 36, height: 36)
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 18))
                    .foregroundStyle(Color.neonCyan)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text("WEEKLY ASSESSMENT DUE")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.5)
                    .foregroundStyle(Color.neonCyan)
                Text("Complete to unlock streak bonuses")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.textSecondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12))
                .foregroundStyle(Color.textMuted)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background {
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white.opacity(0.04))
                .overlay {
                    RoundedRectangle(cornerRadius: 14)
                        .strokeBorder(Color.neonCyan.opacity(0.15), lineWidth: 0.5)
                }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Weekly assessment due. Complete to unlock streak bonuses.")
        .accessibilityHint("Double tap to start weekly assessment")
        .accessibilityAddTraits(.isButton)
        .onTapGesture {
            HapticService.shared.light()
            appState.showWeeklyAssessmentGate = true
        }
    }

    private var cognitiveHeaderColor: Color {
        switch appState.cognitiveProfile.classificationLevel {
        case "elite": return .neonGold
        case "advanced": return .bioOrange
        case "intermediate": return .neonCyan
        case "developing": return .bioTeal
        default: return .textSecondary
        }
    }

    private var neuralCoreSize: CGFloat {
        let h = UIScreen.main.bounds.height
        if h < 600 { return 220 }
        if h < 750 { return 260 }
        if h < 850 { return 300 }
        return 340
    }
}

// MARK: - Edge Glow Effect (all screen edges)

private struct EdgeGlowView: View {
    let pulse: Bool
    let primaryColor: Color
    let secondaryColor: Color

    var body: some View {
        ZStack {
            // Top edge
            LinearGradient(
                colors: [primaryColor.opacity(pulse ? 0.12 : 0.04), .clear],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: 180)
            .frame(maxHeight: .infinity, alignment: .top)

            // Bottom edge
            LinearGradient(
                colors: [secondaryColor.opacity(pulse ? 0.08 : 0.03), .clear],
                startPoint: .bottom,
                endPoint: .top
            )
            .frame(height: 140)
            .frame(maxHeight: .infinity, alignment: .bottom)

            // Left edge
            LinearGradient(
                colors: [primaryColor.opacity(pulse ? 0.06 : 0.02), .clear],
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(width: 80)
            .frame(maxWidth: .infinity, alignment: .leading)

            // Right edge
            LinearGradient(
                colors: [secondaryColor.opacity(pulse ? 0.06 : 0.02), .clear],
                startPoint: .trailing,
                endPoint: .leading
            )
            .frame(width: 80)
            .frame(maxWidth: .infinity, alignment: .trailing)

            // Top-left corner accent
            RadialGradient(
                colors: [primaryColor.opacity(pulse ? 0.1 : 0.03), .clear],
                center: .topLeading,
                startRadius: 0,
                endRadius: 200
            )
            .opacity(pulse ? 0.8 : 0.4)

            // Bottom-right corner accent
            RadialGradient(
                colors: [secondaryColor.opacity(pulse ? 0.08 : 0.02), .clear],
                center: .bottomTrailing,
                startRadius: 0,
                endRadius: 200
            )
            .opacity(pulse ? 0.8 : 0.4)
        }
        .accessibilityHidden(true)
    }
}
