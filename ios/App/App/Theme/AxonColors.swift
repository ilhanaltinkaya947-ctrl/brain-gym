import SwiftUI

extension Color {
    // Primary brand colors (matching CSS custom properties)
    static let neonCyan = Color(red: 0.0, green: 0.898, blue: 1.0)         // #00E5FF / hsl(191, 100%, 50%)
    static let neonGold = Color(red: 0.984, green: 0.749, blue: 0.145)     // #FBBF24
    static let neonMagenta = Color(red: 0.659, green: 0.333, blue: 0.969)  // #A855F7
    static let bioOrange = Color(red: 0.961, green: 0.620, blue: 0.043)    // #F59E0B
    static let bioTeal = Color(red: 0.043, green: 0.788, blue: 0.718)      // #0BC9B7

    // Background colors
    static let bgPrimary = Color(red: 0.02, green: 0.02, blue: 0.02)       // #050505
    static let bgCard = Color(white: 0.08)                                   // ~#141414
    static let bgMuted = Color(white: 0.12)                                  // ~#1F1F1F

    // Text colors
    static let textPrimary = Color(white: 0.95)
    static let textSecondary = Color(white: 0.6)
    static let textMuted = Color(white: 0.4)

    // Game type colors
    static let gameMath = Color(red: 0.0, green: 0.898, blue: 1.0)         // Cyan
    static let gameColor = Color(red: 0.659, green: 0.333, blue: 0.969)    // Purple
    static let gameParadox = Color(red: 0.984, green: 0.749, blue: 0.145)  // Gold
    static let gameSuit = Color(red: 0.937, green: 0.267, blue: 0.267)     // Red
    static let gameChimp = Color(red: 0.659, green: 0.333, blue: 0.969)    // Purple
    static let gameWord = Color(red: 0.337, green: 0.533, blue: 0.937)     // Blue

    // Semantic colors
    static let success = Color(red: 0.204, green: 0.780, blue: 0.349)      // #34C759 (iOS green)
    static let danger = Color(red: 0.937, green: 0.267, blue: 0.267)       // Red
}

extension ShapeStyle where Self == Color {
    static var glassPanel: Color {
        Color.white.opacity(0.06)
    }
}
