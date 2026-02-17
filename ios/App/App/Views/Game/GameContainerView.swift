import SwiftUI

struct GameContainerView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var coordinator = GameBridgeCoordinator()
    @State private var appeared = false
    @State private var linePhase = false
    @State private var glowPulse = false

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            GameWebView(coordinator: coordinator)
                .environmentObject(appState)
                .ignoresSafeArea()

            // Loading overlay — hides WebView init + React mount
            if !coordinator.gameReady {
                loadingOverlay
                    .transition(.opacity)
                    .accessibilityLabel("Loading game")
            }

            // Continue Modal Overlay (Endless mode death)
            if appState.showContinueModal {
                ContinueModalView(coordinator: coordinator)
                    .transition(.opacity.combined(with: .scale(scale: 0.9)))
            }
        }
        .opacity(appeared ? 1 : 0)
        .animation(.easeOut(duration: 0.3), value: coordinator.gameReady)
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: appState.showContinueModal)
        .onAppear {
            withAnimation(.easeOut(duration: 0.3)) {
                appeared = true
            }
            withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) {
                linePhase = true
            }
            withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                glowPulse = true
            }
        }
    }

    private var loadingOverlay: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            // Green ambient pulse behind the brand
            RadialGradient(
                colors: [
                    Color(hue: 0.38, saturation: 0.7, brightness: 0.55).opacity(glowPulse ? 0.10 : 0.03),
                    Color(hue: 0.38, saturation: 0.7, brightness: 0.55).opacity(glowPulse ? 0.03 : 0.01),
                    Color.clear
                ],
                center: .center,
                startRadius: 10,
                endRadius: 350
            )
            .ignoresSafeArea()
            .scaleEffect(glowPulse ? 1.1 : 0.9)
            .accessibilityHidden(true)

            VStack(spacing: 0) {
                // axon wordmark
                Text("axon")
                    .font(.system(size: 32, weight: .thin))
                    .tracking(12)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(glowPulse ? 0.9 : 0.7),
                                Color.white.opacity(glowPulse ? 0.6 : 0.45)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )

                // Animated line indicator
                ZStack {
                    RoundedRectangle(cornerRadius: 1)
                        .fill(Color.white.opacity(0.06))
                        .frame(width: 48, height: 1.5)

                    RoundedRectangle(cornerRadius: 1)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(hue: 0.38, saturation: 0.7, brightness: 0.55).opacity(0.0),
                                    Color(hue: 0.38, saturation: 0.7, brightness: 0.55).opacity(0.7),
                                    Color(hue: 0.38, saturation: 0.7, brightness: 0.55).opacity(0.0)
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: 48, height: 1.5)
                        .offset(x: linePhase ? 16 : -16)
                }
                .padding(.top, 16)
            }
        }
    }
}
