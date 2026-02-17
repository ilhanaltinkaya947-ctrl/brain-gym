import Foundation

enum GameMode: String, Codable, CaseIterable {
    case classic
    case endless
    case assessment
}

enum MiniGameType: String, Codable, CaseIterable {
    case speedMath
    case colorMatch
    case flashMemory
    case paradoxFlow
    case patternHunter
    case operatorChaos
    case spatialStack
    case wordConnect
    case suitDeception
    case chimpMemory
}

struct GameConfig: Codable, Equatable {
    var mode: GameMode
    var enabledGames: [MiniGameType]

    static let mixableGames: [MiniGameType] = [
        .speedMath, .colorMatch, .paradoxFlow,
        .suitDeception, .chimpMemory, .wordConnect,
        .patternHunter, .flashMemory,
        .operatorChaos, .spatialStack,
    ]

    static let `default` = GameConfig(
        mode: .endless,
        enabledGames: MiniGameType.allCases
    )
}
