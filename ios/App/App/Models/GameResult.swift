import Foundation

struct GameBreakdownEntry: Codable {
    let correct: Int
    let wrong: Int
}

struct GameResult: Codable {
    let score: Int
    let streak: Int
    let correct: Int
    let wrong: Int
    let sessionXP: Int
    let mode: String
    let duration: Int?
    let peakTension: Double?
    let gameBreakdown: [String: GameBreakdownEntry]?
    let assessmentType: String?
    let perGameResponseTimes: [String: Int]?
    let perGamePeakTiers: [String: Int]?
}

enum BridgeMessage: Decodable {
    case gameEnd(GameResult)
    case requestContinue(GameResult)
    case quit
    case haptic(style: String)

    private enum CodingKeys: String, CodingKey {
        case type
        case payload
        case style
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "gameEnd":
            let result = try container.decode(GameResult.self, forKey: .payload)
            self = .gameEnd(result)
        case "requestContinue":
            let result = try container.decode(GameResult.self, forKey: .payload)
            self = .requestContinue(result)
        case "quit":
            self = .quit
        case "haptic":
            let style = try container.decode(String.self, forKey: .style)
            self = .haptic(style: style)
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .type,
                in: container,
                debugDescription: "Unknown message type: \(type)"
            )
        }
    }
}
