import SwiftUI

struct SplashView: View {
    @State private var showCore = false
    @State private var animatedCharge: Int = 0
    @State private var showText = false
    @State private var showVersion = false
    @State private var lineGlow = false

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            // Ambient radial glow
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            Color.neonCyan.opacity(showCore ? 0.06 : 0),
                            Color.neonCyan.opacity(showCore ? 0.015 : 0),
                            .clear
                        ],
                        center: .center,
                        startRadius: 10,
                        endRadius: 280
                    )
                )
                .frame(
                    width: min(560, UIScreen.main.bounds.width * 1.4),
                    height: min(560, UIScreen.main.bounds.width * 1.4)
                )
                .scaleEffect(showCore ? 1.05 : 0.6)
                .blur(radius: 30)
                .accessibilityHidden(true)

            VStack(spacing: 0) {
                Spacer()

                // Neural Core — large, like the dashboard hero
                NeuralCoreView(charge: animatedCharge)
                    .frame(width: neuralCoreSize, height: neuralCoreSize)
                    .scaleEffect(showCore ? 1.0 : 0.4)
                    .opacity(showCore ? 1 : 0)
                    .accessibilityHidden(true)

                Spacer().frame(height: 40)

                // axon wordmark — clean fade, no spring bounce
                Text("axon")
                    .font(.system(size: 36, weight: .thin))
                    .tracking(16)
                    .padding(.leading, 16)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [
                                .white.opacity(0.9),
                                .white.opacity(0.55)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .opacity(showText ? 1 : 0)
                    .accessibilityLabel("Axon")

                // Thin accent line
                RoundedRectangle(cornerRadius: 0.5)
                    .fill(
                        LinearGradient(
                            colors: [
                                .clear,
                                Color.neonCyan.opacity(lineGlow ? 0.45 : 0.15),
                                .clear
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: 50, height: 1)
                    .padding(.top, 14)
                    .opacity(showText ? 1 : 0)
                    .accessibilityHidden(true)

                // Subtitle
                Text("BRAIN TRAINING")
                    .font(.system(size: 9, weight: .medium))
                    .tracking(6)
                    .padding(.leading, 6)
                    .foregroundStyle(Color.white.opacity(0.25))
                    .padding(.top, 12)
                    .opacity(showText ? 1 : 0)
                    .accessibilityLabel("Brain Training")

                Spacer()

                // Version
                Text("v\(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")")
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(Color.white.opacity(0.12))
                    .opacity(showVersion ? 1 : 0)
                    .padding(.bottom, 34)
            }
        }
        .onAppear {
            // Core fades in with gentle ease (no spring bounce)
            withAnimation(.easeOut(duration: 1.0).delay(0.1)) {
                showCore = true
            }

            // Charge 0 → 80 over 1.5s
            let startTime = DispatchTime.now() + .milliseconds(200)
            let steps = 40
            let duration = 1.5
            for step in 0...steps {
                let delay = duration / Double(steps) * Double(step)
                DispatchQueue.main.asyncAfter(deadline: startTime + delay) {
                    animatedCharge = Int(Double(step) / Double(steps) * 80)
                }
            }

            // Text fades in — simple opacity, no offset/slide
            withAnimation(.easeOut(duration: 0.6).delay(0.7)) {
                showText = true
            }

            // Version
            withAnimation(.easeOut(duration: 0.5).delay(1.0)) {
                showVersion = true
            }

            // Accent line pulse
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true).delay(1.2)) {
                lineGlow = true
            }
        }
    }

    /// Match dashboard sizing for large prominent core
    private var neuralCoreSize: CGFloat {
        let h = UIScreen.main.bounds.height
        if h < 600 { return 200 }
        if h < 750 { return 240 }
        if h < 850 { return 280 }
        return 300
    }
}
