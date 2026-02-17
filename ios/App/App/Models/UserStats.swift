import Foundation

struct UserStats: Codable, Equatable {
    var classicHighScore: Int
    var endlessBestStreak: Int
    var totalXP: Int
    var totalGamesPlayed: Int
    var totalCorrectAnswers: Int
    var gameLevels: [String: Int]
    var gameMasteryXP: [String: Int]
    var lastPlayedDate: String?
    var dayStreak: Int

    // Theme/rank
    var activeThemeId: String
    var unlockedThemeIds: [String]

    // Daily challenge
    var lastDailyChallengeDate: String?
    var dailyChallengeProgress: Int
    var dailyChallengesCompleted: Int

    static let allGameTypes = [
        "speedMath", "colorMatch", "flashMemory", "paradoxFlow",
        "patternHunter", "operatorChaos", "spatialStack",
        "wordConnect", "suitDeception", "chimpMemory",
    ]

    static let masteryThresholds = [0, 30, 80, 160, 300, 500, 800, 1200, 1800, 2500]

    static func masteryLevel(for xp: Int) -> Int {
        for (level, threshold) in masteryThresholds.enumerated().reversed() {
            if xp >= threshold { return level + 1 }
        }
        return 1
    }

    static let `default` = UserStats(
        classicHighScore: 0,
        endlessBestStreak: 0,
        totalXP: 0,
        totalGamesPlayed: 0,
        totalCorrectAnswers: 0,
        gameLevels: Dictionary(uniqueKeysWithValues: allGameTypes.map { ($0, 1) }),
        gameMasteryXP: Dictionary(uniqueKeysWithValues: allGameTypes.map { ($0, 0) }),
        lastPlayedDate: nil,
        dayStreak: 0,
        activeThemeId: "spark",
        unlockedThemeIds: ["spark"],
        lastDailyChallengeDate: nil,
        dailyChallengeProgress: 0,
        dailyChallengesCompleted: 0
    )

    // Migration: fill in missing fields for old persisted data
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        classicHighScore = try container.decodeIfPresent(Int.self, forKey: .classicHighScore) ?? 0
        endlessBestStreak = try container.decodeIfPresent(Int.self, forKey: .endlessBestStreak) ?? 0
        totalXP = try container.decodeIfPresent(Int.self, forKey: .totalXP) ?? 0
        totalGamesPlayed = try container.decodeIfPresent(Int.self, forKey: .totalGamesPlayed) ?? 0
        totalCorrectAnswers = try container.decodeIfPresent(Int.self, forKey: .totalCorrectAnswers) ?? 0
        lastPlayedDate = try container.decodeIfPresent(String.self, forKey: .lastPlayedDate)
        dayStreak = try container.decodeIfPresent(Int.self, forKey: .dayStreak) ?? 0

        // Migrate gameLevels — ensure all 10 games present
        let savedLevels = try container.decodeIfPresent([String: Int].self, forKey: .gameLevels) ?? [:]
        var levels: [String: Int] = [:]
        for game in Self.allGameTypes {
            levels[game] = savedLevels[game] ?? 1
        }
        gameLevels = levels

        // Migrate gameMasteryXP — new field, default to 0
        let savedMastery = try container.decodeIfPresent([String: Int].self, forKey: .gameMasteryXP) ?? [:]
        var mastery: [String: Int] = [:]
        for game in Self.allGameTypes {
            mastery[game] = savedMastery[game] ?? 0
        }
        gameMasteryXP = mastery

        // Theme fields — new, default to spark
        activeThemeId = try container.decodeIfPresent(String.self, forKey: .activeThemeId) ?? "spark"
        unlockedThemeIds = try container.decodeIfPresent([String].self, forKey: .unlockedThemeIds) ?? ["spark"]

        // Daily challenge fields — new
        lastDailyChallengeDate = try container.decodeIfPresent(String.self, forKey: .lastDailyChallengeDate)
        dailyChallengeProgress = try container.decodeIfPresent(Int.self, forKey: .dailyChallengeProgress) ?? 0
        dailyChallengesCompleted = try container.decodeIfPresent(Int.self, forKey: .dailyChallengesCompleted) ?? 0
    }

    // Memberwise init for `default` and other programmatic construction
    init(
        classicHighScore: Int, endlessBestStreak: Int, totalXP: Int,
        totalGamesPlayed: Int, totalCorrectAnswers: Int,
        gameLevels: [String: Int], gameMasteryXP: [String: Int],
        lastPlayedDate: String?, dayStreak: Int,
        activeThemeId: String, unlockedThemeIds: [String],
        lastDailyChallengeDate: String?, dailyChallengeProgress: Int, dailyChallengesCompleted: Int
    ) {
        self.classicHighScore = classicHighScore
        self.endlessBestStreak = endlessBestStreak
        self.totalXP = totalXP
        self.totalGamesPlayed = totalGamesPlayed
        self.totalCorrectAnswers = totalCorrectAnswers
        self.gameLevels = gameLevels
        self.gameMasteryXP = gameMasteryXP
        self.lastPlayedDate = lastPlayedDate
        self.dayStreak = dayStreak
        self.activeThemeId = activeThemeId
        self.unlockedThemeIds = unlockedThemeIds
        self.lastDailyChallengeDate = lastDailyChallengeDate
        self.dailyChallengeProgress = dailyChallengeProgress
        self.dailyChallengesCompleted = dailyChallengesCompleted
    }
}
