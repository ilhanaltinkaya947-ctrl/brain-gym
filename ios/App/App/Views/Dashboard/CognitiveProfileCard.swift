import SwiftUI

struct CognitiveProfileCard: View {
    @EnvironmentObject var appState: AppState

    private var profile: CognitiveProfile { appState.cognitiveProfile }

    private let domains: [(key: String, label: String, color: Color)] = [
        ("memory", "MEM", .neonCyan),
        ("math", "MTH", .neonGold),
        ("reaction", "RCT", .bioOrange),
        ("logic", "LGC", .gameParadox),
        ("perception", "PRC", .bioTeal),
        ("spatial", "SPC", .success),
        ("linguistic", "LNG", .gameWord),
    ]

    var body: some View {
        VStack(spacing: 12) {
            // Header row
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text("COGNITIVE INDEX")
                        .font(.system(size: 9, weight: .bold))
                        .tracking(1.5)
                        .foregroundStyle(Color.textMuted)

                    HStack(alignment: .lastTextBaseline, spacing: 6) {
                        Text("\(Int(profile.compositeScore))")
                            .font(.system(size: 28, weight: .light, design: .monospaced))
                            .foregroundStyle(Color.textPrimary)

                        Text(profile.classificationLevel.uppercased())
                            .font(.system(size: 8, weight: .heavy))
                            .tracking(1)
                            .foregroundStyle(classificationColor)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(classificationColor.opacity(0.15), in: Capsule())
                    }
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Cognitive index: \(Int(profile.compositeScore)), level: \(profile.classificationLevel)")

                Spacer()

                // Improvement trend
                if let improvement = appState.assessmentHistory.latestImprovement {
                    HStack(spacing: 3) {
                        Image(systemName: improvement >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 10, weight: .bold))
                        Text(String(format: "%+.0f%%", improvement))
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                    }
                    .foregroundStyle(improvement >= 0 ? Color.success : Color.danger)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Trend: \(improvement >= 0 ? "up" : "down") \(String(format: "%.0f", abs(improvement))) percent")
                }
            }

            // Mini domain bars
            HStack(spacing: 4) {
                ForEach(domains, id: \.key) { domain in
                    let score = profile.domainScores[domain.key]?.score ?? 0
                    VStack(spacing: 4) {
                        // Bar
                        GeometryReader { geo in
                            VStack {
                                Spacer()
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(domain.color.opacity(0.8))
                                    .frame(height: geo.size.height * CGFloat(min(score, 1000) / 1000.0))
                            }
                        }
                        .frame(height: 32)
                        .background(
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.white.opacity(0.04))
                        )

                        // Label
                        Text(domain.label)
                            .font(.system(size: 7, weight: .bold))
                            .tracking(0.5)
                            .foregroundStyle(Color.textMuted)
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("\(domain.label)")
                    .accessibilityValue("\(Int(score))")
                }
            }

            // Last assessed date
            if let lastDate = profile.lastAssessmentDate {
                Text("Last assessed: \(lastDate)")
                    .font(.system(size: 10))
                    .foregroundStyle(Color.textMuted)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background {
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white.opacity(0.04))
                .overlay {
                    RoundedRectangle(cornerRadius: 14)
                        .strokeBorder(Color.neonCyan.opacity(0.1), lineWidth: 0.5)
                }
        }
    }

    private var classificationColor: Color {
        switch profile.classificationLevel {
        case "elite": return .neonGold
        case "advanced": return .bioOrange
        case "intermediate": return .neonCyan
        case "developing": return .bioTeal
        default: return .textSecondary
        }
    }
}
