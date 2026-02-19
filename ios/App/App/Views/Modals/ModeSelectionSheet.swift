import SwiftUI

struct ModeSelectionSheet: View {
    @EnvironmentObject var appState: AppState
    @State private var appeared = false
    @State private var classicPulse = false
    @State private var endlessPulse = false
    @State private var focusPulse = false
    @State private var showClassicChoice = false

    private var theme: AxonTheme { appState.currentTheme }

    var body: some View {
        ZStack {
            // Dismiss classic sub-choice on background tap
            Color.clear
                .contentShape(Rectangle())
                .onTapGesture {
                    if showClassicChoice {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                            showClassicChoice = false
                        }
                    }
                }

            ambientBackground
            modeSelectionView
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.6)) { appeared = true }
            withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) { classicPulse = true }
            withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true).delay(0.5)) { endlessPulse = true }
            withAnimation(.easeInOut(duration: 2.8).repeatForever(autoreverses: true).delay(1.0)) { focusPulse = true }
        }
    }

    // MARK: - Ambient Background
    private var ambientBackground: some View {
        Circle()
            .fill(
                RadialGradient(
                    colors: [
                        theme.primary.color.opacity(appeared ? 0.06 : 0),
                        .clear
                    ],
                    center: .center,
                    startRadius: 10,
                    endRadius: 200
                )
            )
            .frame(width: min(400, UIScreen.main.bounds.width), height: min(400, UIScreen.main.bounds.width))
            .offset(y: -120)
            .blur(radius: 30)
            .accessibilityHidden(true)
    }

    // MARK: - Mode Selection
    private var modeSelectionView: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 10) {
                Text("SELECT PROTOCOL")
                    .font(.system(size: 11, weight: .bold))
                    .tracking(4)
                    .foregroundStyle(theme.primary.color.opacity(0.6))

                Text("Choose Your Challenge")
                    .font(.system(size: 26, weight: .thin))
                    .tracking(0.5)
                    .foregroundStyle(Color.textPrimary)
            }
            .padding(.top, 44)
            .padding(.bottom, 8)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)

            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 12) {
                    classicCard
                        .opacity(appeared ? 1 : 0)
                        .offset(y: appeared ? 0 : 20)

                    endlessCard
                        .opacity(appeared ? 1 : 0)
                        .offset(y: appeared ? 0 : 30)

                    focusCard
                        .opacity(appeared ? 1 : 0)
                        .offset(y: appeared ? 0 : 40)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
            }

            // Cancel
            Button {
                appState.showModeSelection = false
            } label: {
                Text("Cancel")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.textMuted)
                    .frame(maxWidth: .infinity, minHeight: 44)
            }
            .accessibilityLabel("Cancel")
            .accessibilityHint("Dismisses mode selection")
            .padding(.top, 8)
            .padding(.horizontal, 20)
            .padding(.bottom, max(16, UIApplication.shared.windowSafeAreaBottom))
        }
    }

    // MARK: - Classic Card

    private var recommendedTier: Int {
        appState.cognitiveProfile.baselineComplete ? appState.cognitiveProfile.recommendedStartTier : 1
    }

    private var classicCard: some View {
        VStack(spacing: 0) {
            Button {
                HapticService.shared.light()
                withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                    showClassicChoice.toggle()
                }
            } label: {
                VStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [theme.primary.color.opacity(0.25), .clear],
                                    center: .center,
                                    startRadius: 12,
                                    endRadius: 40
                                )
                            )
                            .frame(width: 80, height: 80)
                            .scaleEffect(classicPulse ? 1.15 : 0.95)

                        Circle()
                            .fill(theme.primary.color.opacity(0.12))
                            .frame(width: 46, height: 46)
                            .overlay(
                                Circle()
                                    .strokeBorder(theme.primary.color.opacity(0.3), lineWidth: 1)
                            )

                        Image(systemName: "clock")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(theme.primary.color)
                    }

                    VStack(spacing: 5) {
                        HStack(spacing: 8) {
                            Text("Classic Protocol")
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundStyle(Color.textPrimary)

                            Text("TIMED")
                                .font(.system(size: 9, weight: .heavy))
                                .tracking(1)
                                .foregroundStyle(theme.primary.color)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(theme.primary.color.opacity(0.15), in: Capsule())
                        }

                        Text("3-minute endurance and accuracy test")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.textSecondary)

                        HStack(spacing: 4) {
                            Image(systemName: "bolt.fill")
                                .font(.system(size: 9))
                            Text("180 seconds")
                                .font(.system(size: 10, weight: .medium, design: .monospaced))
                        }
                        .foregroundStyle(theme.primary.color.opacity(0.6))
                        .padding(.top, 1)
                    }
                }
                .padding(.vertical, 18)
                .padding(.horizontal, 20)
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(CardPressStyle())
            .accessibilityLabel("Classic Protocol, timed. 3-minute endurance and accuracy test.")
            .accessibilityHint("Tap to choose warmup or ranked start")

            // Warmup vs Ranked sub-selection
            if showClassicChoice {
                classicChoiceButtons
                    .transition(.opacity.combined(with: .move(edge: .top)))
                    .padding(.top, 4)
                    .padding(.bottom, 16)
                    .padding(.horizontal, 16)
            }
        }
        .background {
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.04))
                .overlay {
                    RoundedRectangle(cornerRadius: 20)
                        .strokeBorder(
                            LinearGradient(
                                colors: [theme.primary.color.opacity(showClassicChoice ? 0.35 : 0.25), theme.primary.color.opacity(0.06)],
                                startPoint: .top,
                                endPoint: .bottom
                            ),
                            lineWidth: 1
                        )
                }
                .shadow(color: theme.primary.color.opacity(0.08), radius: 20, y: 4)
        }
    }

    private var classicChoiceButtons: some View {
        HStack(spacing: 10) {
            // Warmup
            Button {
                HapticService.shared.light()
                SoundService.shared.playClassicProtocol()
                appState.requestGameStart(mode: .classic, tier: 1)
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: "flame")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(theme.primary.color.opacity(0.8))

                    Text("Warmup")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Color.textPrimary)

                    Text("Start easy")
                        .font(.system(size: 10))
                        .foregroundStyle(Color.textSecondary)

                    Text("LVL 1")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundStyle(theme.primary.color.opacity(0.7))
                        .padding(.top, 1)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(theme.primary.color.opacity(0.06))
                        .overlay {
                            RoundedRectangle(cornerRadius: 14)
                                .strokeBorder(theme.primary.color.opacity(0.15), lineWidth: 1)
                        }
                }
            }
            .buttonStyle(CardPressStyle())
            .accessibilityLabel("Warmup. Start from level 1.")

            // Ranked
            Button {
                HapticService.shared.medium()
                SoundService.shared.playClassicProtocol()
                appState.requestGameStart(mode: .classic, tier: recommendedTier)
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: "trophy")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(theme.primary.color)

                    Text("Ranked")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Color.textPrimary)

                    Text("Your level")
                        .font(.system(size: 10))
                        .foregroundStyle(Color.textSecondary)

                    Text("LVL \(recommendedTier)")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundStyle(theme.primary.color)
                        .padding(.top, 1)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(theme.primary.color.opacity(0.10))
                        .overlay {
                            RoundedRectangle(cornerRadius: 14)
                                .strokeBorder(theme.primary.color.opacity(0.25), lineWidth: 1)
                        }
                }
            }
            .buttonStyle(CardPressStyle())
            .accessibilityLabel("Ranked. Start from level \(recommendedTier).")
        }
    }

    // MARK: - Endless Card
    private var endlessCard: some View {
        Button {
            HapticService.shared.medium()
            SoundService.shared.playEndlessProtocol()
            appState.requestGameStart(mode: .endless, tier: appState.cognitiveProfile.baselineComplete ? appState.cognitiveProfile.recommendedStartTier : 1)
        } label: {
            VStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [Color.bioOrange.opacity(0.2), Color.danger.opacity(0.08), .clear],
                                center: .center,
                                startRadius: 8,
                                endRadius: 40
                            )
                        )
                        .frame(width: 80, height: 80)
                        .scaleEffect(endlessPulse ? 1.2 : 0.9)

                    Circle()
                        .fill(Color.bioOrange.opacity(0.12))
                        .frame(width: 46, height: 46)
                        .overlay(
                            Circle()
                                .strokeBorder(Color.bioOrange.opacity(0.3), lineWidth: 1)
                        )

                    Image(systemName: "infinity")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundStyle(Color.bioOrange)
                }

                VStack(spacing: 5) {
                    HStack(spacing: 8) {
                        Text("Endless Protocol")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(Color.textPrimary)

                        Text("SURVIVAL")
                            .font(.system(size: 9, weight: .heavy))
                            .tracking(1)
                            .foregroundStyle(Color.bioOrange)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Color.bioOrange.opacity(0.15), in: Capsule())
                    }

                    Text("One mistake ends the session")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.textSecondary)

                    HStack(spacing: 4) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 9))
                        Text("Zero tolerance")
                            .font(.system(size: 10, weight: .medium, design: .monospaced))
                    }
                    .foregroundStyle(Color.danger.opacity(0.6))
                    .padding(.top, 1)
                }
            }
            .padding(.vertical, 18)
            .padding(.horizontal, 20)
            .frame(maxWidth: .infinity)
            .background {
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.white.opacity(0.04))
                    .overlay {
                        RoundedRectangle(cornerRadius: 20)
                            .strokeBorder(
                                LinearGradient(
                                    colors: [Color.bioOrange.opacity(0.2), Color.bioOrange.opacity(0.04)],
                                    startPoint: .top,
                                    endPoint: .bottom
                                ),
                                lineWidth: 1
                            )
                    }
                    .shadow(color: Color.bioOrange.opacity(0.06), radius: 20, y: 4)
            }
        }
        .buttonStyle(CardPressStyle())
        .accessibilityLabel("Endless Protocol, survival. One mistake ends the session.")
        .accessibilityHint("Starts an endless survival game session")
    }

    // MARK: - Focus Card
    private var focusCard: some View {
        let focusColor = Color.bioTeal

        return Button {
            HapticService.shared.light()
            appState.showModeSelection = false
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                appState.showFocusPicker = true
            }
        } label: {
            VStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [focusColor.opacity(0.2), .clear],
                                center: .center,
                                startRadius: 10,
                                endRadius: 40
                            )
                        )
                        .frame(width: 80, height: 80)
                        .scaleEffect(focusPulse ? 1.12 : 0.92)

                    Circle()
                        .fill(focusColor.opacity(0.12))
                        .frame(width: 46, height: 46)
                        .overlay(
                            Circle()
                                .strokeBorder(focusColor.opacity(0.3), lineWidth: 1)
                        )

                    Image(systemName: "slider.horizontal.3")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundStyle(focusColor)
                }

                VStack(spacing: 5) {
                    HStack(spacing: 8) {
                        Text("Focus Protocol")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(Color.textPrimary)

                        Text("CUSTOM")
                            .font(.system(size: 9, weight: .heavy))
                            .tracking(1)
                            .foregroundStyle(focusColor)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(focusColor.opacity(0.15), in: Capsule())
                    }

                    Text("Pick your games, choose your rules")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.textSecondary)

                    HStack(spacing: 4) {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 9))
                        Text("Select games")
                            .font(.system(size: 10, weight: .medium, design: .monospaced))
                    }
                    .foregroundStyle(focusColor.opacity(0.6))
                    .padding(.top, 1)
                }
            }
            .padding(.vertical, 18)
            .padding(.horizontal, 20)
            .frame(maxWidth: .infinity)
            .background {
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.white.opacity(0.04))
                    .overlay {
                        RoundedRectangle(cornerRadius: 20)
                            .strokeBorder(
                                LinearGradient(
                                    colors: [focusColor.opacity(0.2), focusColor.opacity(0.04)],
                                    startPoint: .top,
                                    endPoint: .bottom
                                ),
                                lineWidth: 1
                            )
                    }
                    .shadow(color: focusColor.opacity(0.06), radius: 20, y: 4)
            }
        }
        .buttonStyle(CardPressStyle())
        .accessibilityLabel("Focus Protocol, custom. Pick your games, choose your rules.")
        .accessibilityHint("Opens game picker to select specific games")
    }
}

// MARK: - Press Animation
struct CardPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .opacity(configuration.isPressed ? 0.85 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: - Safe Area Helper
extension UIApplication {
    /// Bottom safe area inset (34pt on Face ID devices, 0 on home-button devices)
    var windowSafeAreaBottom: CGFloat {
        connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }?
            .safeAreaInsets.bottom ?? 0
    }
}
