import Foundation

struct AppSettings: Codable, Equatable {
    var soundEnabled: Bool
    var hapticsEnabled: Bool

    static let `default` = AppSettings(
        soundEnabled: true,
        hapticsEnabled: true
    )
}
