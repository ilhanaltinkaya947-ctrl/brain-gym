import SwiftUI

struct MetricCard: View {
    let icon: String
    let value: String
    let label: String
    let accentColor: Color

    @State private var iconPulse = false
    @State private var appeared = false

    var body: some View {
        VStack(spacing: 8) {
            // Animated icon
            ZStack {
                // Glow behind icon
                Circle()
                    .fill(accentColor.opacity(iconPulse ? 0.2 : 0.08))
                    .frame(width: 32, height: 32)
                    .scaleEffect(iconPulse ? 1.2 : 1.0)

                Image(systemName: icon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(accentColor)
                    .scaleEffect(iconPulse ? 1.1 : 1.0)
                    .rotationEffect(icon == "star.fill" ? .degrees(iconPulse ? 15 : -15) : .zero)
            }

            Text(value)
                .font(.system(size: 24, weight: .ultraLight, design: .default))
                .monospacedDigit()
                .foregroundStyle(Color.textPrimary)

            Text(label.uppercased())
                .font(.system(size: 9, weight: .bold))
                .tracking(1.5)
                .foregroundStyle(Color.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .padding(.horizontal, 8)
        .background {
            RoundedRectangle(cornerRadius: 18)
                .fill(
                    LinearGradient(
                        colors: [accentColor.opacity(0.08), accentColor.opacity(0.02)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay {
                    RoundedRectangle(cornerRadius: 18)
                        .strokeBorder(accentColor.opacity(0.12), lineWidth: 0.5)
                }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(label)")
        .accessibilityValue(value)
        .opacity(appeared ? 1 : 0)
        .offset(y: appeared ? 0 : 15)
        .onAppear {
            withAnimation(.easeOut(duration: 0.6).delay(0.2)) {
                appeared = true
            }
            let animDuration = icon == "flame" ? 1.5 : icon == "star.fill" ? 2.0 : 2.5
            withAnimation(.easeInOut(duration: animDuration).repeatForever(autoreverses: true).delay(0.5)) {
                iconPulse = true
            }
        }
    }
}
