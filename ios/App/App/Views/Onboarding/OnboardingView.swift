import SwiftUI

// MARK: - Data Models

private struct GameInfo {
    let icon: String
    let name: String
    let tagline: String
    let color: Color
}

private struct CategorySlide {
    let id: String
    let category: String
    let subtitle: String
    let games: [GameInfo]
}

private let categorySlides: [CategorySlide] = [
    CategorySlide(
        id: "processing",
        category: "PROCESSING SPEED",
        subtitle: "How fast can you think?",
        games: [
            GameInfo(icon: "bolt.fill", name: "Speed Math", tagline: "Solve arithmetic under pressure. Your brain's raw clock speed, measured.", color: .neonCyan),
            GameInfo(icon: "divide", name: "Operator Chaos", tagline: "Find the missing operator. Logic and number sense fused together.", color: .neonGold),
        ]
    ),
    CategorySlide(
        id: "attention",
        category: "ATTENTION & CONTROL",
        subtitle: "Override your instincts",
        games: [
            GameInfo(icon: "arrow.left.arrow.right", name: "Paradox Flow", tagline: "Follow or avoid the arrow. Swipe based on meaning, not appearance.", color: .gameParadox),
            GameInfo(icon: "paintpalette.fill", name: "Color Chaos", tagline: "Read the word, ignore the color. Master the Stroop effect.", color: .neonMagenta),
        ]
    ),
    CategorySlide(
        id: "memory",
        category: "WORKING MEMORY",
        subtitle: "Expand your mental RAM",
        games: [
            GameInfo(icon: "square.grid.3x3.fill", name: "Chimp Memory", tagline: "Memorize number positions instantly. Can you outperform a chimpanzee?", color: .gameChimp),
            GameInfo(icon: "bolt.circle.fill", name: "Flash Sequence", tagline: "Watch the sequence, replay it. Push your short-term memory buffer.", color: .neonCyan),
        ]
    ),
    CategorySlide(
        id: "pattern",
        category: "PATTERN & PERCEPTION",
        subtitle: "See what others miss",
        games: [
            GameInfo(icon: "magnifyingglass", name: "Pattern Hunter", tagline: "Spot the odd one out. Visual processing at speed.", color: .bioTeal),
            GameInfo(icon: "suit.spade.fill", name: "Suit Deception", tagline: "Match suits in a stream of deception. Focus is your currency.", color: .danger),
        ]
    ),
    CategorySlide(
        id: "language",
        category: "LANGUAGE & SPATIAL",
        subtitle: "Words and dimensions",
        games: [
            GameInfo(icon: "textformat.abc", name: "Word Connect", tagline: "Form words from scrambled letters. Verbal fluency under the clock.", color: .gameWord),
            GameInfo(icon: "cube.fill", name: "Spatial Stack", tagline: "Track positions in space. Mental rotation and spatial reasoning.", color: .success),
        ]
    ),
]

// MARK: - OnboardingView

struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @State private var currentPage = 0
    @State private var appeared = false
    @State private var corePulse = false

    // Total: welcome + 5 categories + modes + progression + begin = 9
    private let totalPages = 9

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            VStack(spacing: 0) {
                // Skip button
                HStack {
                    Spacer()
                    Button("Skip") {
                        HapticService.shared.light()
                        appState.completeOnboarding()
                    }
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.textSecondary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial, in: Capsule())
                    .accessibilityLabel("Skip onboarding")
                    .accessibilityHint("Skips introduction and starts the baseline assessment")
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .opacity(currentPage < totalPages - 1 ? 1 : 0)
                .animation(.easeOut(duration: 0.3), value: currentPage)

                // Slide content
                TabView(selection: $currentPage) {
                    welcomeSlide.tag(0)

                    ForEach(Array(categorySlides.enumerated()), id: \.element.id) { index, slide in
                        categorySlideView(slide: slide)
                            .tag(index + 1)
                    }

                    modesSlide.tag(6)
                    progressionSlide.tag(7)
                    beginSlide.tag(8)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                // Progress dots
                HStack(spacing: 6) {
                    ForEach(0..<totalPages, id: \.self) { index in
                        Capsule()
                            .fill(index == currentPage ? Color.neonCyan : Color.white.opacity(index < currentPage ? 0.35 : 0.12))
                            .frame(width: index == currentPage ? 24 : 6, height: 6)
                            .animation(.spring(response: 0.3), value: currentPage)
                    }
                }
                .padding(.bottom, 20)
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Page \(currentPage + 1) of \(totalPages)")

                // CTA Button
                Button {
                    HapticService.shared.medium()
                    if currentPage == totalPages - 1 {
                        SoundService.shared.playStartTraining()
                        appState.completeOnboarding()
                    } else {
                        withAnimation { currentPage += 1 }
                    }
                } label: {
                    HStack(spacing: 8) {
                        Text(currentPage == totalPages - 1 ? "Start Assessment" : "Continue")
                            .font(.system(size: 17, weight: .semibold))

                        if currentPage < totalPages - 1 {
                            Image(systemName: "chevron.right")
                                .font(.system(size: 13, weight: .semibold))
                        }
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(
                                currentPage == totalPages - 1
                                    ? LinearGradient(colors: [.neonCyan, .neonCyan.opacity(0.7)], startPoint: .leading, endPoint: .trailing)
                                    : LinearGradient(colors: [Color.white.opacity(0.12), Color.white.opacity(0.06)], startPoint: .leading, endPoint: .trailing)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .strokeBorder(
                                        currentPage == totalPages - 1
                                            ? Color.neonCyan.opacity(0.4)
                                            : Color.white.opacity(0.1),
                                        lineWidth: 1
                                    )
                            )
                    }
                }
                .accessibilityLabel(currentPage == totalPages - 1 ? "Start Assessment" : "Continue")
                .accessibilityHint(currentPage == totalPages - 1 ? "Starts the baseline cognitive assessment" : "Goes to the next onboarding page")
                .padding(.horizontal, 20)
                .padding(.bottom, max(16, UIApplication.shared.windowSafeAreaBottom))
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.8)) { appeared = true }
            withAnimation(.easeInOut(duration: 3.0).repeatForever(autoreverses: true)) { corePulse = true }
        }
    }

    // MARK: - Welcome Slide

    private var welcomeSlide: some View {
        VStack(spacing: 0) {
            Spacer()

            // Neural Core
            NeuralCoreView(charge: 65)
                .frame(width: 180, height: 180)
                .scaleEffect(corePulse ? 1.03 : 0.97)
                .opacity(appeared ? 1 : 0)
                .accessibilityHidden(true)

            Spacer().frame(height: 36)

            VStack(spacing: 16) {
                Text("axon")
                    .font(.system(size: 34, weight: .thin))
                    .tracking(14)
                    .padding(.leading, 14)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.white.opacity(0.9), .white.opacity(0.55)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .accessibilityLabel("Axon")

                RoundedRectangle(cornerRadius: 0.5)
                    .fill(
                        LinearGradient(
                            colors: [.clear, Color.neonCyan.opacity(0.35), .clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: 50, height: 1)
                    .accessibilityHidden(true)

                Text("COGNITIVE TRAINING SYSTEM")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(5)
                    .padding(.leading, 5)
                    .foregroundStyle(Color.neonCyan.opacity(0.5))

                Text("10 scientifically-inspired exercises targeting\nprocessing speed, memory, attention, and logic.\nAdaptive difficulty. Real-time performance tracking.")
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(Color.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(5)
                    .padding(.horizontal, 24)
                    .padding(.top, 8)
            }
            .opacity(appeared ? 1 : 0)

            Spacer()
            Spacer()
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Category Slide

    private func categorySlideView(slide: CategorySlide) -> some View {
        VStack(spacing: 0) {
            Spacer()

            // Category header
            VStack(spacing: 8) {
                Text(slide.category)
                    .font(.system(size: 10, weight: .bold))
                    .tracking(4)
                    .foregroundStyle(Color.neonCyan.opacity(0.6))

                Text(slide.subtitle)
                    .font(.system(size: 24, weight: .thin))
                    .tracking(0.3)
                    .foregroundStyle(Color.textPrimary)
            }

            Spacer().frame(height: 32)

            // Game cards
            VStack(spacing: 14) {
                ForEach(Array(slide.games.enumerated()), id: \.offset) { _, game in
                    gameCard(game: game)
                }
            }
            .padding(.horizontal, 20)

            Spacer()
            Spacer()
        }
    }

    private func gameCard(game: GameInfo) -> some View {
        HStack(spacing: 16) {
            // Glowing icon
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [game.color.opacity(0.2), .clear],
                            center: .center,
                            startRadius: 5,
                            endRadius: 35
                        )
                    )
                    .frame(width: 70, height: 70)

                Circle()
                    .fill(game.color.opacity(0.1))
                    .frame(width: 48, height: 48)
                    .overlay(
                        Circle()
                            .strokeBorder(game.color.opacity(0.25), lineWidth: 1)
                    )

                Image(systemName: game.icon)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(game.color)
            }
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 6) {
                Text(game.name)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Color.textPrimary)

                Text(game.tagline)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(Color.textSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(game.name): \(game.tagline)")
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(
                            LinearGradient(
                                colors: [game.color.opacity(0.15), game.color.opacity(0.03)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }

    // MARK: - Game Modes Slide

    private var modesSlide: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: 8) {
                Text("PROTOCOLS")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(4)
                    .foregroundStyle(Color.neonCyan.opacity(0.6))

                Text("Choose How You Train")
                    .font(.system(size: 24, weight: .thin))
                    .tracking(0.3)
                    .foregroundStyle(Color.textPrimary)
            }

            Spacer().frame(height: 32)

            VStack(spacing: 14) {
                // Classic mode card
                modeCard(
                    icon: "clock",
                    name: "Classic Protocol",
                    badge: "TIMED",
                    description: "3-minute session. Score as high as you can. Difficulty escalates with your streak. Choose your starting difficulty.",
                    color: .neonCyan
                )

                // Endless mode card
                modeCard(
                    icon: "infinity",
                    name: "Endless Protocol",
                    badge: "SURVIVAL",
                    description: "One wrong answer ends the session. Pure focus. How far can your streak go?",
                    color: .bioOrange
                )

                // Focus mode card
                modeCard(
                    icon: "slider.horizontal.3",
                    name: "Focus Protocol",
                    badge: "CUSTOM",
                    description: "Pick your games and choose your rules. Train exactly the skills you want to sharpen.",
                    color: .bioTeal
                )
            }
            .padding(.horizontal, 20)

            Spacer()
            Spacer()
        }
    }

    private func modeCard(icon: String, name: String, badge: String, description: String, color: Color) -> some View {
        HStack(spacing: 16) {
            // Icon
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [color.opacity(0.2), .clear],
                            center: .center,
                            startRadius: 5,
                            endRadius: 35
                        )
                    )
                    .frame(width: 70, height: 70)

                Circle()
                    .fill(color.opacity(0.1))
                    .frame(width: 48, height: 48)
                    .overlay(
                        Circle()
                            .strokeBorder(color.opacity(0.25), lineWidth: 1)
                    )

                Image(systemName: icon)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(color)
            }
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Text(name)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(Color.textPrimary)

                    Text(badge)
                        .font(.system(size: 8, weight: .heavy))
                        .tracking(1)
                        .foregroundStyle(color)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(color.opacity(0.15), in: Capsule())
                }

                Text(description)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(Color.textSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(name), \(badge). \(description)")
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(
                            LinearGradient(
                                colors: [color.opacity(0.15), color.opacity(0.03)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }

    // MARK: - Progression Slide

    private var progressionSlide: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: 8) {
                Text("PROGRESSION")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(4)
                    .foregroundStyle(Color.neonCyan.opacity(0.6))

                Text("Evolve Your Neural Core")
                    .font(.system(size: 24, weight: .thin))
                    .tracking(0.3)
                    .foregroundStyle(Color.textPrimary)
            }

            Spacer().frame(height: 24)

            // Rank tiers
            VStack(spacing: 10) {
                ForEach(AxonTheme.allThemes, id: \.id) { rank in
                    HStack(spacing: 14) {
                        // Color swatch
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [rank.primary.color, rank.secondary.color.opacity(0.5)],
                                    center: .center,
                                    startRadius: 2,
                                    endRadius: 16
                                )
                            )
                            .frame(width: 32, height: 32)
                            .overlay(
                                Circle()
                                    .strokeBorder(rank.primary.color.opacity(0.4), lineWidth: 1)
                            )
                            .accessibilityHidden(true)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(rank.rankName)
                                .font(.system(size: 13, weight: .bold))
                                .tracking(1.5)
                                .foregroundStyle(rank.primary.color)

                            Text(rank.name)
                                .font(.system(size: 12))
                                .foregroundStyle(Color.textSecondary)
                        }

                        Spacer()

                        if rank.xpRequired > 0 {
                            Text("\(formatXP(rank.xpRequired)) XP")
                                .font(.system(size: 11, weight: .medium, design: .monospaced))
                                .foregroundStyle(Color.textMuted)
                        } else {
                            Text("START")
                                .font(.system(size: 10, weight: .bold))
                                .tracking(1)
                                .foregroundStyle(Color.textMuted)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(rank.primary.color.opacity(0.04))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .strokeBorder(rank.primary.color.opacity(0.1), lineWidth: 0.5)
                            )
                    )
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("\(rank.rankName), \(rank.name), \(rank.xpRequired > 0 ? "\(formatXP(rank.xpRequired)) XP required" : "Starting rank")")
                }
            }
            .padding(.horizontal, 20)

            Spacer().frame(height: 20)

            VStack(spacing: 6) {
                Text("Each rank unlocks a unique color theme")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.textSecondary)
                Text("Your Neural Core evolves as you progress")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.textSecondary)
            }
            .multilineTextAlignment(.center)

            Spacer()
            Spacer()
        }
    }

    private func formatXP(_ xp: Int) -> String {
        if xp >= 1000 {
            return String(format: "%.0fk", Double(xp) / 1000.0)
        }
        return "\(xp)"
    }

    // MARK: - Begin Slide

    private var beginSlide: some View {
        VStack(spacing: 0) {
            Spacer()

            // Neural Core — larger, fully charged
            NeuralCoreView(charge: 100)
                .frame(width: 220, height: 220)
                .scaleEffect(corePulse ? 1.04 : 0.96)
                .accessibilityHidden(true)

            Spacer().frame(height: 40)

            VStack(spacing: 14) {
                Text("System Ready")
                    .font(.system(size: 28, weight: .thin))
                    .tracking(1)
                    .foregroundStyle(Color.textPrimary)

                RoundedRectangle(cornerRadius: 0.5)
                    .fill(
                        LinearGradient(
                            colors: [.clear, Color.neonCyan.opacity(0.4), .clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: 60, height: 1)
                    .accessibilityHidden(true)

                Text("A 3-minute baseline assessment across all\ncognitive domains will calibrate your starting\nlevel and establish your Cognitive Index.")
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(Color.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(5)
                    .padding(.horizontal, 24)
            }

            Spacer()
            Spacer()
        }
        .padding(.horizontal, 20)
    }
}
