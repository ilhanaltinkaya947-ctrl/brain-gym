import SwiftUI

struct AssessmentResultView: View {
    @EnvironmentObject var appState: AppState
    @State private var animatedScore = 0.0
    @State private var showContent = false
    @State private var glowPulse = false
    @State private var showBars = false

    private var profile: CognitiveProfile { appState.cognitiveProfile }
    private var history: AssessmentHistory { appState.assessmentHistory }
    private var result: GameResult? { appState.lastResult }
    private var isBaseline: Bool { result?.assessmentType == "baseline" }

    private let domainMeta: [(domain: String, label: String, icon: String, color: Color)] = [
        ("memory", "Memory", "brain.head.profile", .neonCyan),
        ("math", "Math", "function", .neonGold),
        ("reaction", "Reaction", "bolt.fill", .bioOrange),
        ("logic", "Logic", "arrow.triangle.branch", .gameParadox),
        ("perception", "Perception", "eye.fill", .bioTeal),
        ("spatial", "Spatial", "cube.fill", .success),
        ("linguistic", "Language", "textformat.abc", .gameWord),
    ]

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            // Ambient glow
            Circle()
                .fill(Color.neonCyan.opacity(glowPulse ? 0.08 : 0.04))
                .frame(width: 300, height: 300)
                .blur(radius: 80)
                .offset(y: -150)
                .ignoresSafeArea()
                .accessibilityHidden(true)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    Spacer().frame(height: 60)

                    // Header
                    Text(isBaseline ? "BASELINE ESTABLISHED" : "WEEKLY ASSESSMENT COMPLETE")
                        .font(.system(size: 10, weight: .bold))
                        .tracking(4)
                        .foregroundStyle(Color.neonCyan.opacity(0.6))
                        .opacity(showContent ? 1 : 0)
                        .animation(.easeOut(duration: 0.3), value: showContent)
                        .accessibilityLabel(isBaseline ? "Baseline established" : "Weekly assessment complete")

                    Spacer().frame(height: 24)

                    // Composite Score
                    VStack(spacing: 8) {
                        Text("\(Int(animatedScore))")
                            .font(.system(size: 72, weight: .ultraLight))
                            .monospacedDigit()
                            .foregroundStyle(Color.textPrimary)

                        Text("COGNITIVE INDEX")
                            .font(.system(size: 9, weight: .bold))
                            .tracking(3)
                            .foregroundStyle(Color.textMuted)

                        // Classification badge
                        classificationBadge
                            .padding(.top, 4)

                        // Improvement indicator (weekly only)
                        if !isBaseline, let improvement = history.latestImprovement {
                            HStack(spacing: 4) {
                                Image(systemName: improvement >= 0 ? "arrow.up.right" : "arrow.down.right")
                                    .font(.system(size: 11, weight: .bold))
                                Text(String(format: "%+.1f%%", improvement))
                                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                            }
                            .foregroundStyle(improvement >= 0 ? Color.success : Color.danger)
                            .padding(.top, 4)
                            .accessibilityElement(children: .combine)
                            .accessibilityLabel("Improvement: \(improvement >= 0 ? "up" : "down") \(String(format: "%.1f", abs(improvement))) percent")
                        }
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Cognitive index: \(Int(profile.compositeScore)), classification: \(profile.classificationLevel)")

                    Spacer().frame(height: 32)

                    // Domain Breakdown
                    VStack(spacing: 14) {
                        Text("DOMAIN BREAKDOWN")
                            .font(.system(size: 9, weight: .bold))
                            .tracking(3)
                            .foregroundStyle(Color.textMuted)

                        VStack(spacing: 10) {
                            ForEach(Array(domainMeta.enumerated()), id: \.element.domain) { index, meta in
                                domainRow(
                                    domain: meta.domain,
                                    label: meta.label,
                                    icon: meta.icon,
                                    color: meta.color,
                                    delay: Double(index) * 0.05
                                )
                            }
                        }
                        .padding(.horizontal, 20)
                    }

                    Spacer().frame(height: 32)

                    // Stats summary
                    if let r = result {
                        HStack(spacing: 24) {
                            statPill(icon: "checkmark.circle.fill", value: "\(r.correct)", label: "Correct", color: .success)
                            statPill(icon: "xmark.circle.fill", value: "\(r.wrong)", label: "Wrong", color: .danger)
                            if r.correct + r.wrong > 0 {
                                let acc = Int(Double(r.correct) / Double(r.correct + r.wrong) * 100)
                                statPill(icon: "target", value: "\(acc)%", label: "Accuracy", color: .neonCyan)
                            }
                        }
                        .opacity(showContent ? 1 : 0)
                        .animation(.easeOut(duration: 0.3).delay(0.3), value: showContent)
                    }

                    Spacer().frame(height: 36)

                    // Action buttons
                    VStack(spacing: 12) {
                        Button {
                            HapticService.shared.medium()
                            appState.currentScreen = .dashboard
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "house")
                                Text("Continue to Dashboard")
                            }
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(.bgPrimary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.textPrimary, in: Capsule())
                        }
                        .accessibilityLabel("Continue to Dashboard")
                        .accessibilityHint("Returns to the main dashboard")
                    }
                    .padding(.horizontal, 32)
                    .opacity(showContent ? 1 : 0)
                    .animation(.easeOut(duration: 0.3).delay(0.4), value: showContent)

                    Spacer().frame(height: 40)
                }
            }
        }
        .onAppear {
            animateCompositeScore()
            showContent = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation(.spring(response: 0.6)) { showBars = true }
            }
            withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
                glowPulse = true
            }
        }
    }

    // MARK: - Classification Badge
    private var classificationBadge: some View {
        let level = profile.classificationLevel.uppercased()
        let color: Color = {
            switch profile.classificationLevel {
            case "elite": return .neonGold
            case "advanced": return .bioOrange
            case "intermediate": return .neonCyan
            case "developing": return .bioTeal
            default: return .textSecondary
            }
        }()

        return Text(level)
            .font(.system(size: 10, weight: .heavy))
            .tracking(2)
            .foregroundStyle(color)
            .padding(.horizontal, 12)
            .padding(.vertical, 5)
            .background(color.opacity(0.15), in: Capsule())
    }

    // MARK: - Domain Row
    @ViewBuilder
    private func domainRow(domain: String, label: String, icon: String, color: Color, delay: Double) -> some View {
        let score = profile.domainScores[domain]?.score ?? 0
        let trend = isBaseline ? nil : history.domainTrend(domain)

        HStack(spacing: 12) {
            // Icon
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(color)
                .frame(width: 24)

            // Label
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.textSecondary)
                .frame(width: 72, alignment: .leading)

            // Bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.white.opacity(0.06))

                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [color.opacity(0.7), color],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: showBars ? geo.size.width * CGFloat(min(score, 1000) / 1000.0) : 0)
                        .animation(.spring(response: 0.8, dampingFraction: 0.75).delay(delay), value: showBars)
                }
            }
            .frame(height: 6)

            // Score
            Text("\(Int(score))")
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .foregroundStyle(Color.textPrimary)
                .frame(width: 36, alignment: .trailing)

            // Trend arrow (weekly only)
            if let trend = trend {
                Image(systemName: trend > 5 ? "arrow.up" : trend < -5 ? "arrow.down" : "minus")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(trend > 5 ? Color.success : trend < -5 ? Color.danger : Color.textMuted)
                    .frame(width: 16)
            } else {
                Spacer().frame(width: 16)
            }
        }
        .frame(height: 28)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(label): \(Int(score))")
    }

    // MARK: - Stat Pill
    private func statPill(icon: String, value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(color)
            Text(value)
                .font(.system(size: 20, weight: .light))
                .monospacedDigit()
                .foregroundStyle(Color.textPrimary)
            Text(label.uppercased())
                .font(.system(size: 8, weight: .bold))
                .tracking(1)
                .foregroundStyle(Color.textMuted)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(label)
        .accessibilityValue(value)
    }

    // MARK: - Animate
    private func animateCompositeScore() {
        let target = profile.compositeScore
        let steps = 25
        let duration = 0.6
        let interval = duration / Double(steps)

        for i in 0...steps {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * interval) {
                let progress = Double(i) / Double(steps)
                let eased = 1 - pow(1 - progress, 3)
                animatedScore = target * eased
            }
        }
    }
}
