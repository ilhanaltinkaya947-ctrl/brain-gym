import SwiftUI

private struct GameDisplay {
    let type: MiniGameType
    let icon: String
    let name: String
    let color: Color
}

private let allGames: [GameDisplay] = [
    GameDisplay(type: .speedMath, icon: "bolt.fill", name: "Speed Math", color: .neonCyan),
    GameDisplay(type: .colorMatch, icon: "paintpalette.fill", name: "Color Match", color: .neonMagenta),
    GameDisplay(type: .operatorChaos, icon: "divide", name: "Operator Chaos", color: .neonGold),
    GameDisplay(type: .paradoxFlow, icon: "arrow.left.arrow.right", name: "Paradox Flow", color: .gameParadox),
    GameDisplay(type: .patternHunter, icon: "magnifyingglass", name: "Pattern Hunter", color: .bioTeal),
    GameDisplay(type: .flashMemory, icon: "bolt.circle.fill", name: "Flash Memory", color: .neonCyan),
    GameDisplay(type: .chimpMemory, icon: "square.grid.3x3.fill", name: "Chimp Memory", color: .gameChimp),
    GameDisplay(type: .suitDeception, icon: "suit.spade.fill", name: "Suit Deception", color: .danger),
    GameDisplay(type: .wordConnect, icon: "textformat.abc", name: "Word Connect", color: .gameWord),
    GameDisplay(type: .spatialStack, icon: "cube.fill", name: "Spatial Stack", color: .success),
]

struct FocusPickerSheet: View {
    @EnvironmentObject var appState: AppState
    @State private var appeared = false

    private var theme: AxonTheme { appState.currentTheme }

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 10) {
                Text("FOCUS PROTOCOL")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(4)
                    .foregroundStyle(theme.primary.color.opacity(0.6))

                Text("Choose Your Games")
                    .font(.system(size: 26, weight: .thin))
                    .tracking(0.5)
                    .foregroundStyle(Color.textPrimary)

                Text("\(appState.focusGames.count) of \(allGames.count) selected")
                    .font(.system(size: 13, weight: .medium, design: .monospaced))
                    .foregroundStyle(appState.focusGames.isEmpty ? Color.textMuted : theme.primary.color.opacity(0.7))
                    .animation(.easeOut(duration: 0.2), value: appState.focusGames.count)
                    .accessibilityLabel("\(appState.focusGames.count) of \(allGames.count) games selected")
            }
            .padding(.top, 28)
            .padding(.bottom, 20)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)

            // Game Grid
            ScrollView(showsIndicators: false) {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(allGames, id: \.type) { game in
                        gameCard(game)
                    }
                }
                .padding(.horizontal, 20)
            }
            .opacity(appeared ? 1 : 0)

            Spacer().frame(height: 16)

            // Mode buttons
            VStack(spacing: 10) {
                // Classic (timed)
                Button {
                    HapticService.shared.medium()
                    SoundService.shared.playClassicProtocol()
                    appState.requestGameStart(mode: .classic, tier: 1, focus: true)
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "clock")
                            .font(.system(size: 14))
                        Text("Timed · 3 min")
                            .font(.system(size: 16, weight: .semibold))
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
                .disabled(appState.focusGames.isEmpty)
                .opacity(appState.focusGames.isEmpty ? 0.4 : 1)
                .accessibilityLabel("Timed, 3 minutes")
                .accessibilityHint(appState.focusGames.isEmpty ? "Select at least one game first" : "Starts a timed focus session")

                // Endless (survival)
                Button {
                    HapticService.shared.medium()
                    SoundService.shared.playEndlessProtocol()
                    appState.requestGameStart(mode: .endless, tier: 1, focus: true)
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "infinity")
                            .font(.system(size: 14))
                        Text("Survival")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .foregroundColor(Color.textPrimary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color.white.opacity(0.06))
                            .overlay {
                                RoundedRectangle(cornerRadius: 14)
                                    .strokeBorder(Color.white.opacity(0.1), lineWidth: 1)
                            }
                    }
                }
                .disabled(appState.focusGames.isEmpty)
                .opacity(appState.focusGames.isEmpty ? 0.4 : 1)
                .accessibilityLabel("Survival mode")
                .accessibilityHint(appState.focusGames.isEmpty ? "Select at least one game first" : "Starts a survival focus session")
            }
            .padding(.horizontal, 20)
            .opacity(appeared ? 1 : 0)

            // Cancel
            Button {
                appState.showFocusPicker = false
            } label: {
                Text("Cancel")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.textMuted)
                    .frame(maxWidth: .infinity, minHeight: 44)
            }
            .accessibilityLabel("Cancel")
            .accessibilityHint("Dismisses the focus game picker")
            .padding(.top, 8)
            .padding(.horizontal, 20)
            .padding(.bottom, max(16, UIApplication.shared.windowSafeAreaBottom))
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.5)) { appeared = true }
        }
    }

    private func gameCard(_ game: GameDisplay) -> some View {
        let isSelected = appState.focusGames.contains(game.type)

        return Button {
            HapticService.shared.light()
            if isSelected {
                appState.focusGames.remove(game.type)
            } else {
                appState.focusGames.insert(game.type)
            }
        } label: {
            VStack(spacing: 10) {
                // Icon
                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [game.color.opacity(isSelected ? 0.25 : 0.08), .clear],
                                center: .center,
                                startRadius: 5,
                                endRadius: 30
                            )
                        )
                        .frame(width: 56, height: 56)

                    Circle()
                        .fill(game.color.opacity(isSelected ? 0.15 : 0.06))
                        .frame(width: 40, height: 40)
                        .overlay(
                            Circle()
                                .strokeBorder(game.color.opacity(isSelected ? 0.4 : 0.15), lineWidth: 1)
                        )

                    Image(systemName: game.icon)
                        .font(.system(size: 18, weight: .medium))
                        .foregroundStyle(game.color.opacity(isSelected ? 1.0 : 0.4))
                }

                Text(game.name)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(isSelected ? Color.textPrimary : Color.textMuted)
                    .lineLimit(1)

                // Mastery level badge
                let level = appState.userStats.gameLevels[game.type.rawValue] ?? 1
                Text("Lv.\(level)")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(game.color.opacity(isSelected ? 0.7 : 0.3))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background {
                RoundedRectangle(cornerRadius: 16)
                    .fill(isSelected ? game.color.opacity(0.06) : Color.white.opacity(0.02))
                    .overlay {
                        RoundedRectangle(cornerRadius: 16)
                            .strokeBorder(
                                isSelected ? game.color.opacity(0.25) : Color.white.opacity(0.06),
                                lineWidth: isSelected ? 1.5 : 0.5
                            )
                    }
            }
        }
        .buttonStyle(CardPressStyle())
        .animation(.easeOut(duration: 0.2), value: isSelected)
        .accessibilityLabel("\(game.name), level \(appState.userStats.gameLevels[game.type.rawValue] ?? 1)")
        .accessibilityValue(isSelected ? "Selected" : "Not selected")
        .accessibilityHint(isSelected ? "Double tap to deselect" : "Double tap to select")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}
