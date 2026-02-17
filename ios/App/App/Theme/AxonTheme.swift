import SwiftUI

struct ThemeColor: Codable, Equatable {
    let r: Double, g: Double, b: Double
    var color: Color { Color(red: r, green: g, blue: b) }
}

struct AxonTheme: Equatable, Identifiable {
    let id: String
    let name: String
    let rankName: String
    let xpRequired: Int
    let primary: ThemeColor
    let secondary: ThemeColor
    let accent: ThemeColor

    // Per-rank animation scaling
    let signalDotCount: Int
    let orbitalDotCount: Int
    let particleCount: Int
    let breatheDuration: Double
    let sparkFrequency: Double // lower = more frequent
}

extension AxonTheme {
    static let allThemes: [AxonTheme] = [spark, pulse, synapse, cortex, apex]

    static let spark = AxonTheme(
        id: "spark",
        name: "Spark",
        rankName: "INITIATE",
        xpRequired: 0,
        primary: ThemeColor(r: 0.0, g: 0.898, b: 1.0),       // Cyan #00E5FF
        secondary: ThemeColor(r: 0.659, g: 0.333, b: 0.969),  // Magenta #A855F7
        accent: ThemeColor(r: 0.984, g: 0.749, b: 0.145),     // Gold #FBBF24
        signalDotCount: 2,
        orbitalDotCount: 8,
        particleCount: 20,
        breatheDuration: 8.0,
        sparkFrequency: 6.0
    )

    static let pulse = AxonTheme(
        id: "pulse",
        name: "Pulse",
        rankName: "ADEPT",
        xpRequired: 5_000,
        primary: ThemeColor(r: 0.063, g: 0.725, b: 0.506),    // Emerald #10B981
        secondary: ThemeColor(r: 0.078, g: 0.722, b: 0.651),  // Teal #14B8A6
        accent: ThemeColor(r: 0.518, g: 0.800, b: 0.086),     // Lime #84CC16
        signalDotCount: 3,
        orbitalDotCount: 8,
        particleCount: 20,
        breatheDuration: 5.0,
        sparkFrequency: 5.0
    )

    static let synapse = AxonTheme(
        id: "synapse",
        name: "Synapse",
        rankName: "RESONANT",
        xpRequired: 25_000,
        primary: ThemeColor(r: 0.231, g: 0.510, b: 0.965),    // Electric Blue #3B82F6
        secondary: ThemeColor(r: 0.388, g: 0.400, b: 0.945),  // Indigo #6366F1
        accent: ThemeColor(r: 0.024, g: 0.714, b: 0.831),     // Cyan #06B6D4
        signalDotCount: 4,
        orbitalDotCount: 12,
        particleCount: 25,
        breatheDuration: 4.5,
        sparkFrequency: 4.0
    )

    static let cortex = AxonTheme(
        id: "cortex",
        name: "Cortex",
        rankName: "ARCHITECT",
        xpRequired: 100_000,
        primary: ThemeColor(r: 0.961, g: 0.620, b: 0.043),    // Gold #F59E0B
        secondary: ThemeColor(r: 0.851, g: 0.467, b: 0.024),  // Amber #D97706
        accent: ThemeColor(r: 0.961, g: 0.961, b: 0.961),     // White #F5F5F5
        signalDotCount: 5,
        orbitalDotCount: 16,
        particleCount: 30,
        breatheDuration: 4.0,
        sparkFrequency: 3.0
    )

    static let apex = AxonTheme(
        id: "apex",
        name: "Apex",
        rankName: "TRANSCENDENT",
        xpRequired: 500_000,
        primary: ThemeColor(r: 0.937, g: 0.267, b: 0.267),    // Crimson #EF4444
        secondary: ThemeColor(r: 0.957, g: 0.247, b: 0.369),  // Rose #F43F5E
        accent: ThemeColor(r: 0.976, g: 0.451, b: 0.086),     // Orange #F97316
        signalDotCount: 6,
        orbitalDotCount: 20,
        particleCount: 35,
        breatheDuration: 3.5,
        sparkFrequency: 2.5
    )

    static func forXP(_ xp: Int) -> AxonTheme {
        for theme in allThemes.reversed() {
            if xp >= theme.xpRequired { return theme }
        }
        return .spark
    }

    static func forId(_ id: String) -> AxonTheme {
        allThemes.first { $0.id == id } ?? .spark
    }

    /// XP needed for next rank, nil if at max
    static func xpForNextRank(currentXP: Int) -> Int? {
        let current = forXP(currentXP)
        guard let nextIndex = allThemes.firstIndex(where: { $0.id == current.id }),
              nextIndex + 1 < allThemes.count else { return nil }
        return allThemes[nextIndex + 1].xpRequired
    }
}
