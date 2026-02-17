import SwiftUI

struct ResultView: View {
    @EnvironmentObject var appState: AppState
    @State private var animatedScore = 0
    @State private var showContent = false
    @State private var glowPulse = false
    @State private var iconBounce = false

    private var result: GameResult? { appState.lastResult }
    private var isEndless: Bool { appState.wasEndlessMode }
    private var theme: AxonTheme { appState.currentTheme }
    private var accuracy: Int {
        guard let r = result, r.correct + r.wrong > 0 else { return 0 }
        return Int(Double(r.correct) / Double(r.correct + r.wrong) * 100)
    }

    var body: some View {
        if result?.mode == "assessment" {
            AssessmentResultView()
        } else {
            normalResultView
        }
    }

    private var screenHeight: CGFloat { UIScreen.main.bounds.height }
    private var isCompact: Bool { screenHeight < 750 }
    private var isSmallScreen: Bool { screenHeight < 700 } // iPhone SE, 7/8, mini — needs scroll
    private var bottomSafeArea: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.windows.first?.safeAreaInsets.bottom ?? 0
    }

    private var normalResultView: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            // Full-screen glow
            resultGlow
                .accessibilityHidden(true)

            if isSmallScreen {
                // Small screens — scrollable
                GeometryReader { geo in
                    ScrollView(showsIndicators: false) {
                        resultContentVStack(flexible: false)
                            .frame(minHeight: geo.size.height)
                    }
                }
            } else {
                // Normal/large screens — fixed layout, no scroll
                resultContentVStack(flexible: true)
            }
        }
        .onAppear {
            animateScore()
            showContent = true
            withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
                glowPulse = true
            }
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true).delay(0.3)) {
                iconBounce = true
            }
        }
    }

    // MARK: - Result Content (shared between scroll and fixed layout)
    @ViewBuilder
    private func resultContentVStack(flexible: Bool) -> some View {
        VStack(spacing: 0) {
            Spacer().frame(height: isCompact ? 44 : 60)

            // Header label
            Text(isEndless ? "RUN OVER" : "SESSION COMPLETE")
                .font(.system(size: 10, weight: .bold))
                .tracking(4)
                .foregroundStyle(isEndless ? Color.danger.opacity(0.7) : theme.primary.color.opacity(0.6))
                .opacity(showContent ? 1 : 0)
                .animation(.easeOut(duration: 0.3), value: showContent)
                .accessibilityLabel(isEndless ? "Run over" : "Session complete")

            Spacer().frame(height: isCompact ? 10 : 16)

            // New High Score Badge
            if appState.isNewHighScore {
                HStack(spacing: 6) {
                    Image(systemName: "crown.fill")
                        .font(.system(size: 14))
                    Text("NEW RECORD!")
                        .font(.system(size: 13, weight: .bold))
                        .tracking(2)
                }
                .foregroundStyle(Color.neonGold)
                .padding(.bottom, isCompact ? 8 : 12)
                .opacity(showContent ? 1 : 0)
                .animation(.easeOut(duration: 0.4).delay(0.4), value: showContent)
                .accessibilityElement(children: .combine)
                .accessibilityLabel("New record")
            }

            // Main Score
            VStack(spacing: 0) {
                Text("\(animatedScore)")
                    .font(.system(size: isCompact ? 60 : 72, weight: .ultraLight, design: .default))
                    .monospacedDigit()
                    .foregroundStyle(Color.textPrimary)

                Text(isEndless ? "Streak" : "Score")
                    .font(.system(size: 13, weight: .medium))
                    .tracking(3)
                    .foregroundStyle(Color.textSecondary)
                    .textCase(.uppercase)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel(isEndless ? "Streak" : "Score")
            .accessibilityValue("\(isEndless ? (result?.streak ?? 0) : (result?.score ?? 0))")

            Spacer().frame(height: isCompact ? 24 : 36)

            // Stats Row — no cards, just animated icons
            if isEndless {
                endlessStats
            } else {
                classicStats
            }

            Spacer().frame(height: isCompact ? 16 : 24)

            // XP + Duration Row
            xpRow
                .opacity(showContent ? 1 : 0)
                .animation(.easeOut(duration: 0.3).delay(0.25), value: showContent)

            // Cognitive Profile (shown on first game that establishes baseline)
            if appState.isFirstBaseline {
                cognitiveProfileSection
                    .opacity(showContent ? 1 : 0)
                    .animation(.easeOut(duration: 0.4).delay(0.3), value: showContent)
            }

            // Flexible spacer on normal screens pushes buttons to bottom
            if flexible {
                Spacer(minLength: isCompact ? 24 : 36)
            } else {
                Spacer().frame(height: isCompact ? 24 : 36)
            }

            // Action Buttons
            actionButtons
                .opacity(showContent ? 1 : 0)
                .animation(.easeOut(duration: 0.3).delay(appState.isFirstBaseline ? 0.55 : 0.35), value: showContent)

            // Bottom padding — safe area aware
            Spacer().frame(height: max(32, bottomSafeArea + 16))
        }
    }

    // MARK: - Full Screen Glow
    private var resultGlow: some View {
        ZStack {
            if isEndless {
                // Red death vignette
                Rectangle()
                    .fill(.clear)
                    .overlay {
                        Rectangle()
                            .fill(
                                RadialGradient(
                                    colors: [
                                        .clear,
                                        Color.danger.opacity(glowPulse ? 0.12 : 0.06)
                                    ],
                                    center: .center,
                                    startRadius: 100,
                                    endRadius: 500
                                )
                            )
                    }
                    .ignoresSafeArea()

                Circle()
                    .fill(Color.danger.opacity(glowPulse ? 0.08 : 0.04))
                    .frame(width: 300, height: 300)
                    .blur(radius: 80)
                    .offset(x: -100, y: -200)
                    .ignoresSafeArea()

                Circle()
                    .fill(Color.danger.opacity(glowPulse ? 0.06 : 0.03))
                    .frame(width: 250, height: 250)
                    .blur(radius: 60)
                    .offset(x: 120, y: 300)
                    .ignoresSafeArea()
            } else {
                // Classic — themed ambient glow
                Rectangle()
                    .fill(.clear)
                    .overlay {
                        Rectangle()
                            .fill(
                                RadialGradient(
                                    colors: [
                                        .clear,
                                        theme.primary.color.opacity(glowPulse ? 0.08 : 0.04)
                                    ],
                                    center: .center,
                                    startRadius: 100,
                                    endRadius: 500
                                )
                            )
                    }
                    .ignoresSafeArea()

                Circle()
                    .fill(theme.primary.color.opacity(glowPulse ? 0.1 : 0.05))
                    .frame(width: 300, height: 300)
                    .blur(radius: 80)
                    .offset(y: -150)
                    .ignoresSafeArea()

                Circle()
                    .fill(theme.secondary.color.opacity(glowPulse ? 0.05 : 0.02))
                    .frame(width: 250, height: 250)
                    .blur(radius: 60)
                    .offset(x: 80, y: 250)
                    .ignoresSafeArea()
            }
        }
    }

    // MARK: - Endless Stats
    private var endlessStats: some View {
        HStack(spacing: 0) {
            animatedStat(
                icon: "flame.fill",
                value: "\(result?.streak ?? 0)",
                label: "Streak",
                color: .bioOrange,
                delay: 0.1
            )

            animatedStat(
                icon: "trophy.fill",
                value: "\(appState.userStats.endlessBestStreak)",
                label: "All-Time Best",
                color: .neonGold,
                delay: 0.2
            )
        }
        .padding(.horizontal, 40)
    }

    // MARK: - Classic Stats
    private var classicStats: some View {
        HStack(spacing: 0) {
            animatedStat(
                icon: "checkmark.circle.fill",
                value: "\(result?.correct ?? 0)",
                label: "Correct",
                color: .success,
                delay: 0.1
            )

            animatedStat(
                icon: "xmark.circle.fill",
                value: "\(result?.wrong ?? 0)",
                label: "Wrong",
                color: .danger,
                delay: 0.18
            )

            animatedStat(
                icon: "target",
                value: "\(accuracy)%",
                label: "Accuracy",
                color: theme.primary.color,
                delay: 0.26
            )
        }
        .padding(.horizontal, 40)
    }

    // MARK: - Animated Stat (no card)
    @ViewBuilder
    private func animatedStat(icon: String, value: String, label: String, color: Color, delay: Double) -> some View {
        VStack(spacing: 6) {
            // Icon with glow + bounce
            ZStack {
                // Ambient glow behind icon
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

            Text(label.uppercased())
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

    // MARK: - XP + Duration Row
    private var xpRow: some View {
        HStack(spacing: 20) {
            HStack(spacing: 6) {
                Image(systemName: "star.fill")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.neonGold)
                Text("+\(result?.sessionXP ?? 0) XP")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.neonGold)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("XP earned")
            .accessibilityValue("plus \(result?.sessionXP ?? 0)")

            if let dur = result?.duration, dur > 0 {
                HStack(spacing: 6) {
                    Image(systemName: "clock")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.textSecondary)
                    Text(formatDuration(dur))
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(Color.textSecondary)
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Duration")
                .accessibilityValue(formatDuration(dur))
            }

            if let tension = result?.peakTension, tension > 0.2 {
                HStack(spacing: 6) {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 13))
                        .foregroundStyle(tensionColor(tension))
                    Text(String(format: "%.1f", tension))
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(tensionColor(tension))
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Peak tension")
                .accessibilityValue(String(format: "%.1f", tension))
            }
        }
    }

    // MARK: - Action Buttons
    private var actionButtons: some View {
        VStack(spacing: 12) {
            Button {
                HapticService.shared.medium()
                handlePlayAgain()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.clockwise")
                    Text("Play Again")
                }
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(.bgPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.textPrimary, in: Capsule())
            }
            .accessibilityLabel("Play Again")
            .accessibilityHint("Starts a new game with the same mode")

            Button {
                HapticService.shared.light()
                handleGoHome()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "house")
                    Text("Dashboard")
                }
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Color.textSecondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    Capsule()
                        .strokeBorder(Color.white.opacity(0.1), lineWidth: 1)
                )
            }
            .accessibilityLabel("Dashboard")
            .accessibilityHint("Returns to the main dashboard")
        }
        .padding(.horizontal, 32)
    }

    // MARK: - Cognitive Profile Section (first game baseline)
    @State private var showBars = false

    private let domainMeta: [(domain: String, label: String, icon: String, color: Color)] = [
        ("memory", "Memory", "brain.head.profile", .neonCyan),
        ("math", "Math", "function", .neonGold),
        ("reaction", "Reaction", "bolt.fill", .bioOrange),
        ("logic", "Logic", "arrow.triangle.branch", .gameParadox),
        ("perception", "Perception", "eye.fill", .bioTeal),
        ("spatial", "Spatial", "cube.fill", .success),
        ("linguistic", "Language", "textformat.abc", .gameWord),
    ]

    private var cognitiveProfileSection: some View {
        let profile = appState.cognitiveProfile
        let level = profile.classificationLevel.uppercased()
        let levelColor: Color = {
            switch profile.classificationLevel {
            case "elite": return .neonGold
            case "advanced": return .bioOrange
            case "intermediate": return .neonCyan
            case "developing": return .bioTeal
            default: return .textSecondary
            }
        }()

        return VStack(spacing: 0) {
            Spacer().frame(height: isCompact ? 12 : 16)

            // Divider
            Rectangle()
                .fill(Color.white.opacity(0.06))
                .frame(height: 0.5)
                .padding(.horizontal, 40)

            Spacer().frame(height: isCompact ? 12 : 16)

            Text("YOUR COGNITIVE PROFILE")
                .font(.system(size: 9, weight: .bold))
                .tracking(3)
                .foregroundStyle(Color.neonCyan.opacity(0.6))

            Spacer().frame(height: isCompact ? 8 : 12)

            // Composite score + classification
            VStack(spacing: 4) {
                Text("\(Int(profile.compositeScore))")
                    .font(.system(size: isCompact ? 40 : 48, weight: .ultraLight))
                    .monospacedDigit()
                    .foregroundStyle(Color.textPrimary)

                Text("COGNITIVE INDEX")
                    .font(.system(size: 8, weight: .bold))
                    .tracking(2)
                    .foregroundStyle(Color.textMuted)

                Text(level)
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(2)
                    .foregroundStyle(levelColor)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                    .background(levelColor.opacity(0.15), in: Capsule())
                    .padding(.top, 4)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Cognitive index: \(Int(profile.compositeScore)), classification: \(level)")

            Spacer().frame(height: isCompact ? 12 : 16)

            // Domain bars — contained in a subtle card
            VStack(spacing: isCompact ? 6 : 8) {
                ForEach(Array(domainMeta.enumerated()), id: \.element.domain) { index, meta in
                    let score = profile.domainScores[meta.domain]?.score ?? 0
                    HStack(spacing: 8) {
                        Image(systemName: meta.icon)
                            .font(.system(size: 11))
                            .foregroundStyle(meta.color)
                            .frame(width: 18)

                        Text(meta.label)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(Color.textSecondary)
                            .frame(width: 66, alignment: .leading)

                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(Color.white.opacity(0.06))
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            colors: [meta.color.opacity(0.7), meta.color],
                                            startPoint: .leading, endPoint: .trailing
                                        )
                                    )
                                    .frame(width: showBars ? geo.size.width * CGFloat(min(score, 1000) / 1000.0) : 0)
                                    .animation(.spring(response: 0.8, dampingFraction: 0.75).delay(Double(index) * 0.05), value: showBars)
                            }
                        }
                        .frame(height: 4)

                        Text("\(Int(score))")
                            .font(.system(size: 11, weight: .bold, design: .monospaced))
                            .foregroundStyle(Color.textPrimary)
                            .frame(width: 32, alignment: .trailing)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, isCompact ? 10 : 14)
            .background {
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.white.opacity(0.03))
                    .overlay {
                        RoundedRectangle(cornerRadius: 14)
                            .strokeBorder(Color.neonCyan.opacity(0.08), lineWidth: 0.5)
                    }
            }
            .padding(.horizontal, 20)
        }
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                withAnimation(.spring(response: 0.6)) { showBars = true }
            }
        }
    }

    // MARK: - Logic

    private func animateScore() {
        let target = isEndless ? (result?.streak ?? 0) : (result?.score ?? 0)
        let steps = 20
        let duration = 0.5
        let interval = duration / Double(steps)

        for i in 0...steps {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * interval) {
                let progress = Double(i) / Double(steps)
                let eased = 1 - pow(1 - progress, 3)
                animatedScore = Int(Double(target) * eased)
            }
        }
    }

    private func handlePlayAgain() {
        appState.isFirstBaseline = false
        appState.startGame(mode: appState.gameConfig.mode, tier: appState.selectedStartTier)
    }

    private func handleGoHome() {
        appState.isFirstBaseline = false
        appState.currentScreen = .dashboard
    }

    private func tensionColor(_ tension: Double) -> Color {
        if tension >= 2.0 { return .danger }
        if tension >= 1.0 { return .bioOrange }
        return .neonCyan
    }

    private func formatDuration(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
}
