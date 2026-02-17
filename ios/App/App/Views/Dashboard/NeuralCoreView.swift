import SwiftUI

// MARK: - Animated Dendrite Branch

private struct DendriteData: Identifiable {
    let id: Int
    let angle: Double
    let length: Double
    let curvature: Double
    let width: Double
    let isSub: Bool
}

private let allDendrites: [DendriteData] = {
    var branches: [DendriteData] = []
    var id = 0
    let count = 10
    for i in 0..<count {
        let angle = Double(i) / Double(count) * .pi * 2
        let length = 0.38 + Double(i * 7 % 30) / 100.0 * 0.35
        let curvature = 0.2 + Double(i * 13 % 40) / 100.0
        branches.append(DendriteData(id: id, angle: angle, length: length, curvature: curvature, width: 2.0, isSub: false))
        id += 1
        let subAngle = angle + Double(i * 11 % 60 - 30) / 100.0
        let subLength = length * (0.5 + Double(i * 7 % 30) / 100.0)
        branches.append(DendriteData(id: id, angle: subAngle, length: subLength, curvature: -curvature, width: 1.0, isSub: true))
        id += 1
    }
    return branches
}()

// MARK: - Single Dendrite Shape

private struct DendritePath: Shape {
    var angle: Double
    var length: Double
    var curvature: Double

    func path(in rect: CGRect) -> Path {
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let scale = min(rect.width, rect.height) / 2
        let len = length * scale

        let endX = center.x + cos(angle) * len
        let endY = center.y + sin(angle) * len
        let cp1X = center.x + cos(angle - curvature) * len * 0.45
        let cp1Y = center.y + sin(angle - curvature) * len * 0.45
        let cp2X = center.x + cos(angle + curvature) * len * 0.75
        let cp2Y = center.y + sin(angle + curvature) * len * 0.75

        var path = Path()
        path.move(to: center)
        path.addCurve(to: CGPoint(x: endX, y: endY),
                      control1: CGPoint(x: cp1X, y: cp1Y),
                      control2: CGPoint(x: cp2X, y: cp2Y))
        return path
    }
}

// MARK: - Signal Dot

private struct SignalDot: View {
    let branchIndex: Int
    let dendrite: DendriteData
    let isGold: Bool
    let center: CGPoint
    let halfSize: CGFloat
    let primaryColor: Color
    let accentColor: Color

    @State private var progress: CGFloat = 0

    var body: some View {
        let len = dendrite.length * halfSize
        let pos = bezierPoint(t: isGold ? progress : (1 - progress), center: center, length: len, angle: dendrite.angle, curvature: dendrite.curvature)
        let envelope = sin(progress * .pi)

        Circle()
            .fill(
                RadialGradient(
                    colors: [
                        .white.opacity(envelope * 0.9),
                        (isGold ? accentColor : primaryColor).opacity(envelope * 0.6),
                        .clear
                    ],
                    center: .center,
                    startRadius: 0,
                    endRadius: 8
                )
            )
            .frame(width: 16, height: 16)
            .position(pos)
            .onAppear {
                let delay = Double(branchIndex) * 1.2 + (isGold ? 2.0 : 0)
                let speed = isGold ? 5.0 : 3.5
                withAnimation(
                    .easeInOut(duration: speed)
                    .repeatForever(autoreverses: false)
                    .delay(delay)
                ) {
                    progress = 1
                }
            }
    }

    private func bezierPoint(t: CGFloat, center: CGPoint, length: CGFloat, angle: Double, curvature: Double) -> CGPoint {
        let endX = center.x + cos(angle) * length
        let endY = center.y + sin(angle) * length
        let cp1X = center.x + cos(angle - curvature) * length * 0.45
        let cp1Y = center.y + sin(angle - curvature) * length * 0.45
        let cp2X = center.x + cos(angle + curvature) * length * 0.75
        let cp2Y = center.y + sin(angle + curvature) * length * 0.75

        let mt: CGFloat = 1 - t
        let x = mt*mt*mt * center.x + 3*mt*mt*t * cp1X + 3*mt*t*t * cp2X + t*t*t * endX
        let y = mt*mt*mt * center.y + 3*mt*mt*t * cp1Y + 3*mt*t*t * cp2Y + t*t*t * endY
        return CGPoint(x: x, y: y)
    }
}

// MARK: - Orbital Ring

private struct OrbitalRing: View {
    let center: CGPoint
    let radius: CGFloat
    let dotCount: Int
    let primaryColor: Color

    @State private var rotation: Double = 0

    var body: some View {
        ForEach(0..<dotCount, id: \.self) { i in
            OrbitalDot(index: i, count: dotCount, center: center, radius: radius, rotation: rotation, primaryColor: primaryColor)
        }
        .onAppear {
            withAnimation(.linear(duration: 60).repeatForever(autoreverses: false)) {
                rotation = 360
            }
        }
    }
}

private struct OrbitalDot: View {
    let index: Int
    let count: Int
    let center: CGPoint
    let radius: CGFloat
    let rotation: Double
    let primaryColor: Color

    @State private var pulse: Bool = false

    private var angle: Double {
        (Double(index) / Double(count) * 360 + rotation) * .pi / 180
    }

    var body: some View {
        Circle()
            .fill(primaryColor)
            .frame(width: 3, height: 3)
            .opacity(pulse ? 0.5 : 0.12)
            .position(
                x: center.x + cos(angle) * radius,
                y: center.y + sin(angle) * radius
            )
            .onAppear {
                withAnimation(.easeInOut(duration: 3 + Double(index) * 0.5).repeatForever(autoreverses: true)) {
                    pulse = true
                }
            }
    }
}

// MARK: - Floating Particle

private struct FloatingParticle: View {
    let index: Int
    let total: Int
    let center: CGPoint
    let halfSize: CGFloat
    let primaryColor: Color

    @State private var rotation: Double = 0
    @State private var pulse: Bool = false

    private var orbitRadius: CGFloat { CGFloat(40 + (index % 5) * 16) / 150.0 }
    private var scaleY: CGFloat { 0.6 + CGFloat(index % 4) * 0.06 }
    private var particleSize: CGFloat { CGFloat(2 + index % 3) }

    var body: some View {
        let baseAngle = (Double(index) / Double(total) * .pi * 2) + rotation * .pi / 180
        let r = orbitRadius * halfSize

        Circle()
            .fill(
                RadialGradient(
                    colors: [.white.opacity(0.7), primaryColor.opacity(0.3), .clear],
                    center: .center,
                    startRadius: 0,
                    endRadius: particleSize * 2
                )
            )
            .frame(width: particleSize * 4, height: particleSize * 4)
            .opacity(pulse ? 0.5 : 0.1)
            .position(
                x: center.x + cos(baseAngle) * r,
                y: center.y + sin(baseAngle) * r * scaleY
            )
            .onAppear {
                let orbitDuration = 50.0 + Double(index % 5) * 8
                withAnimation(.linear(duration: orbitDuration).repeatForever(autoreverses: false)) {
                    rotation = 360
                }
                withAnimation(.easeInOut(duration: 3 + Double(index) * 0.4).repeatForever(autoreverses: true).delay(Double(index) * 0.2)) {
                    pulse = true
                }
            }
    }
}

// MARK: - Soma (center)

private struct SomaView: View {
    let charge: Int
    let center: CGPoint
    let scale: CGFloat
    let primaryColor: Color
    let secondaryColor: Color
    let breatheDuration: Double

    @State private var breathe = false
    @State private var innerPulse = false

    private var glowIntensity: Double { 0.4 + Double(min(100, max(0, charge))) / 100.0 * 0.6 }

    var body: some View {
        ZStack {
            // Outer concentric ring
            Circle()
                .strokeBorder(
                    primaryColor.opacity(0.15),
                    lineWidth: 0.8 * scale
                )
                .frame(width: 76 * scale * (breathe ? 1.12 : 1.0), height: 76 * scale * (breathe ? 1.12 : 1.0))
                .position(center)

            // Middle ring
            Circle()
                .strokeBorder(
                    primaryColor.opacity(0.2),
                    lineWidth: 1.0 * scale
                )
                .frame(width: 64 * scale * (breathe ? 1.15 : 1.0), height: 64 * scale * (breathe ? 1.15 : 1.0))
                .position(center)

            // Pulse ring
            Circle()
                .fill(primaryColor.opacity(breathe ? 0.15 : 0.05))
                .frame(width: 52 * scale * (breathe ? 1.3 : 1.0), height: 52 * scale * (breathe ? 1.3 : 1.0))
                .position(center)

            // Main soma gradient
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            .white,
                            primaryColor.opacity(0.7 + glowIntensity * 0.3),
                            secondaryColor.opacity(0.05 + glowIntensity * 0.15)
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: 22 * scale
                    )
                )
                .frame(width: 44 * scale * (breathe ? 1.08 : 0.93), height: 44 * scale * (breathe ? 1.08 : 0.93))
                .position(center)

            // Core white
            Circle()
                .fill(.white)
                .frame(width: 16 * scale * (innerPulse ? 1.15 : 1.0), height: 16 * scale * (innerPulse ? 1.15 : 1.0))
                .opacity(innerPulse ? 0.95 : 0.7)
                .position(center)

            // Inner highlight
            Circle()
                .fill(.white.opacity(0.35))
                .frame(width: 7 * scale, height: 7 * scale)
                .position(x: center.x - 3 * scale, y: center.y - 3 * scale)
        }
        .onAppear {
            let bd = charge > 70 ? breatheDuration * 0.75 : charge > 40 ? breatheDuration : breatheDuration * 1.25
            withAnimation(.easeInOut(duration: bd).repeatForever(autoreverses: true)) {
                breathe = true
            }
            withAnimation(.easeInOut(duration: bd * 0.5).repeatForever(autoreverses: true)) {
                innerPulse = true
            }
        }
    }
}

// MARK: - Spark Burst

private struct SparkBurst: View {
    let index: Int
    let center: CGPoint
    let primaryColor: Color
    let sparkFrequency: Double

    @State private var fire = false

    var body: some View {
        ForEach(0..<4, id: \.self) { i in
            let angle = Double(i) / 4.0 * .pi * 2 + Double(index) * 1.3
            let dist: CGFloat = fire ? 35 : 0

            Circle()
                .fill(primaryColor)
                .frame(width: 3, height: 3)
                .position(
                    x: center.x + cos(angle) * dist,
                    y: center.y + sin(angle) * dist
                )
                .opacity(fire ? 0 : 0.8)
        }
        .onAppear {
            let delay = Double(index) * sparkFrequency * 0.75 + 2.0
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                startBurst()
            }
        }
    }

    private func startBurst() {
        fire = false
        withAnimation(.easeOut(duration: 0.6)) {
            fire = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + Double.random(in: sparkFrequency * 0.7...sparkFrequency * 1.3)) {
            startBurst()
        }
    }
}

// MARK: - Background Glow

private struct BackgroundGlow: View {
    let charge: Int
    let primaryColor: Color
    let secondaryColor: Color
    @State private var pulse = false

    var body: some View {
        let glowIntensity = 0.4 + Double(min(100, max(0, charge))) / 100.0 * 0.6

        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            primaryColor.opacity(glowIntensity * 0.2),
                            secondaryColor.opacity(glowIntensity * 0.08),
                            .clear
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: 220
                    )
                )
                .scaleEffect(pulse ? 1.15 : 1.0)
                .opacity(pulse ? 1.0 : 0.5)

            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            primaryColor.opacity(glowIntensity * 0.08),
                            .clear
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: 260
                    )
                )
                .scaleEffect(pulse ? 1.1 : 1.0)
                .opacity(pulse ? 0.7 : 0.3)
        }
        .onAppear {
            let speed = charge > 70 ? 5.0 : charge > 40 ? 7.0 : 9.0
            withAnimation(.easeInOut(duration: speed).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }
}

// MARK: - Main NeuralCoreView
// Single GeometryReader at top level — all children receive pre-computed geometry
// This eliminates ~40 redundant GeometryReaders that each triggered separate layout passes

struct NeuralCoreView: View {
    let charge: Int
    var theme: AxonTheme = .spark

    @State private var breatheScale: Bool = false

    private var mainBranches: [DendriteData] {
        allDendrites.filter { !$0.isSub }
    }

    private var activeSignalCount: Int {
        min(theme.signalDotCount, charge > 80 ? theme.signalDotCount : charge > 50 ? max(2, theme.signalDotCount - 1) : 2)
    }

    var body: some View {
        let primary = theme.primary.color
        let secondary = theme.secondary.color
        let accent = theme.accent.color

        GeometryReader { geo in
            let center = CGPoint(x: geo.size.width / 2, y: geo.size.height / 2)
            let halfSize = min(geo.size.width, geo.size.height) / 2
            let somaScale = min(geo.size.width, geo.size.height) / 300.0
            let orbitalRadius = min(geo.size.width, geo.size.height) * 0.235

            ZStack {
                // Background glow
                if charge > 20 {
                    BackgroundGlow(charge: charge, primaryColor: primary, secondaryColor: secondary)
                }

                // Floating particles
                ForEach(0..<theme.particleCount, id: \.self) { i in
                    FloatingParticle(index: i, total: theme.particleCount, center: center, halfSize: halfSize, primaryColor: primary)
                }

                // Orbital ring
                OrbitalRing(center: center, radius: orbitalRadius, dotCount: theme.orbitalDotCount, primaryColor: primary)

                // Dendrite branches
                ForEach(allDendrites) { dendrite in
                    DendritePath(angle: dendrite.angle, length: dendrite.length, curvature: dendrite.curvature)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    primary.opacity(dendrite.isSub ? 0.25 : 0.45),
                                    secondary.opacity(dendrite.isSub ? 0.1 : 0.2)
                                ],
                                startPoint: .center,
                                endPoint: .leading
                            ),
                            style: StrokeStyle(lineWidth: dendrite.width, lineCap: .round)
                        )

                    // Terminal dot with micro-sway for main branches
                    if !dendrite.isSub {
                        TerminalDot(dendrite: dendrite, center: center, halfSize: halfSize)
                    }
                }

                // Signal pulses
                ForEach(0..<activeSignalCount, id: \.self) { i in
                    if i < mainBranches.count {
                        SignalDot(branchIndex: i, dendrite: mainBranches[i], isGold: false, center: center, halfSize: halfSize, primaryColor: primary, accentColor: accent)
                    }
                }

                // Gold outgoing signals
                if charge > 40 {
                    ForEach(0..<max(1, activeSignalCount / 3), id: \.self) { i in
                        if i < mainBranches.count {
                            SignalDot(branchIndex: i, dendrite: mainBranches[i], isGold: true, center: center, halfSize: halfSize, primaryColor: primary, accentColor: accent)
                        }
                    }
                }

                // Spark bursts — fire outward from soma
                ForEach(0..<3, id: \.self) { i in
                    SparkBurst(index: i, center: center, primaryColor: primary, sparkFrequency: theme.sparkFrequency)
                }

                // Soma
                SomaView(charge: charge, center: center, scale: somaScale, primaryColor: primary, secondaryColor: secondary, breatheDuration: theme.breatheDuration)
            }
        }
        // Breathing sync — whole view scales subtly
        .scaleEffect(breatheScale ? 1.02 : 0.98)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear {
            withAnimation(.easeInOut(duration: 6.0).repeatForever(autoreverses: true)) {
                breatheScale = true
            }
        }
    }
}

// Terminal dot at the end of a dendrite with micro-sway
private struct TerminalDot: View {
    let dendrite: DendriteData
    let center: CGPoint
    let halfSize: CGFloat

    @State private var pulse = false
    @State private var sway = false

    var body: some View {
        let len = dendrite.length * halfSize
        let x = center.x + cos(dendrite.angle) * len
        let y = center.y + sin(dendrite.angle) * len
        // Sway perpendicular to dendrite direction
        let swayX = cos(dendrite.angle + .pi / 2) * (sway ? 3.0 : -3.0)
        let swayY = sin(dendrite.angle + .pi / 2) * (sway ? 3.0 : -3.0)

        Circle()
            .fill(.white)
            .frame(width: pulse ? 5 : 3, height: pulse ? 5 : 3)
            .opacity(pulse ? 0.7 : 0.2)
            .position(x: x + swayX, y: y + swayY)
            .onAppear {
                withAnimation(.easeInOut(duration: 3 + Double(dendrite.id) * 0.3).repeatForever(autoreverses: true)) {
                    pulse = true
                }
                let swayDuration = 2.0 + Double(dendrite.id % 5) * 0.4
                withAnimation(.easeInOut(duration: swayDuration).repeatForever(autoreverses: true).delay(Double(dendrite.id) * 0.2)) {
                    sway = true
                }
            }
    }
}
