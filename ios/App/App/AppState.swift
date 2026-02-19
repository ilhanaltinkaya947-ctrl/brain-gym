import Foundation
import SwiftUI
import StoreKit

enum AppScreen {
    case dashboard
    case game
    case result
}

@MainActor
final class AppState: ObservableObject {
    // MARK: - Screen Navigation
    @Published var currentScreen: AppScreen = .dashboard
    @Published var showOnboarding: Bool
    @Published var showSettings = false
    @Published var showModeSelection = false
    @Published var showContinueModal = false
    @Published var showDailyChallenge = false
    @Published var showFocusPicker = false
    @Published var showWeeklyAssessmentGate = false
    var pendingAssessmentType: String? = nil // Set before dismissing gate, executed onDismiss

    // MARK: - Persisted State
    @Published var userStats: UserStats {
        didSet { save(userStats, key: Keys.userStats) }
    }
    @Published var appSettings: AppSettings {
        didSet { save(appSettings, key: Keys.appSettings) }
    }
    @Published var gameConfig: GameConfig {
        didSet { save(gameConfig, key: Keys.gameConfig) }
    }
    @Published var cognitiveProfile: CognitiveProfile {
        didSet { save(cognitiveProfile, key: Keys.cognitiveProfile) }
    }
    @Published var assessmentHistory: AssessmentHistory {
        didSet { save(assessmentHistory, key: Keys.assessmentHistory) }
    }

    // MARK: - Game Session State
    @Published var lastResult: GameResult?
    @Published var pendingDeathData: GameResult?
    @Published var isNewHighScore = false
    @Published var isFirstBaseline = false // Set when first game establishes cognitive profile
    @Published var lastPreviousBest = 0
    @Published var wasEndlessMode = false
    @Published var selectedStartTier = 1
    @Published var focusGames: Set<MiniGameType> = Set(GameConfig.mixableGames)
    var isFocusMode = false
    var weeklyGateSkippedThisSession = false // Lets user bypass gate after tapping "Play Later"
    var gameStartTime: Date = .now

    // Pending game start (deferred until sheet dismisses)
    var pendingGameMode: GameMode?
    var pendingGameTier: Int?

    // MARK: - Derived
    var brainCharge: Int {
        let today = DateFormatter.dayString.string(from: Date())
        return userStats.lastPlayedDate == today ? 100 : 0
    }

    var needsBaselineAssessment: Bool {
        !cognitiveProfile.baselineComplete
    }

    var hasRealCognitiveData: Bool {
        cognitiveProfile.baselineComplete && cognitiveProfile.compositeScore > 0
    }

    var needsWeeklyAssessment: Bool {
        guard hasRealCognitiveData else { return false }
        let calendar = Calendar.current
        let today = Date()
        let week = calendar.component(.weekOfYear, from: today)
        let year = calendar.component(.yearForWeekOfYear, from: today)
        let currentKey = "\(year)-\(String(format: "%02d", week))"
        return (cognitiveProfile.lastWeeklyDate ?? "") != currentKey
    }

    var isWeeklyGated: Bool {
        hasRealCognitiveData && needsWeeklyAssessment
    }

    var streakMultiplier: Double {
        if isWeeklyGated { return 1.0 }
        switch userStats.dayStreak {
        case 0...2: return 1.0
        case 3...6: return 1.2
        case 7...13: return 1.5
        case 14...29: return 1.8
        default: return 2.0
        }
    }

    var dailyChallengeTarget: Int {
        min(30, 10 + userStats.totalGamesPlayed / 5)
    }

    var isDailyChallengeComplete: Bool {
        let today = DateFormatter.dayString.string(from: Date())
        return userStats.lastDailyChallengeDate == today &&
               userStats.dailyChallengeProgress >= dailyChallengeTarget
    }

    var currentTheme: AxonTheme {
        AxonTheme.forId(userStats.activeThemeId)
    }

    var currentRank: AxonTheme {
        AxonTheme.forXP(userStats.totalXP)
    }

    // MARK: - Keys
    private enum Keys {
        static let userStats = "axon-user-stats"
        static let appSettings = "axon-settings"
        static let gameConfig = "axon-game-config"
        static let hasSeenOnboarding = "axon-hasSeenOnboarding"
        static let startTier = "axon-startTier"
        static let cognitiveProfile = "axon-cognitive-profile"
        static let assessmentHistory = "axon-assessment-history"
    }

    // MARK: - Init
    init() {
        self.userStats = Self.load(key: Keys.userStats) ?? .default
        self.appSettings = Self.load(key: Keys.appSettings) ?? .default
        self.gameConfig = Self.load(key: Keys.gameConfig) ?? .default
        self.assessmentHistory = Self.load(key: Keys.assessmentHistory) ?? .default
        let hasSeenOnboarding = UserDefaults.standard.bool(forKey: Keys.hasSeenOnboarding)
        self.showOnboarding = !hasSeenOnboarding

        // Load cognitive profile — grandfather existing users who already completed onboarding
        // but don't have a stored profile (app updated with assessment feature)
        let storedProfile: CognitiveProfile? = Self.load(key: Keys.cognitiveProfile)
        if let profile = storedProfile {
            self.cognitiveProfile = profile
        } else if hasSeenOnboarding {
            // Existing user updating to new version — skip baseline requirement
            var profile = CognitiveProfile.default
            profile.baselineComplete = true
            self.cognitiveProfile = profile
        } else {
            self.cognitiveProfile = .default
        }

        let savedTier = UserDefaults.standard.integer(forKey: Keys.startTier)
        self.selectedStartTier = savedTier > 0 ? savedTier : 1
        #if DEBUG
        print("[AppState] init: hasSeenOnboarding=\(hasSeenOnboarding), baselineComplete=\(self.cognitiveProfile.baselineComplete)")
        #endif
    }

    // MARK: - Onboarding
    func completeOnboarding() {
        UserDefaults.standard.set(true, forKey: Keys.hasSeenOnboarding)
        showOnboarding = false
    }

    // MARK: - Daily Challenge Popup
    func checkDailyChallenge() {
        let today = DateFormatter.dayString.string(from: Date())
        let shownKey = "axon-dailyChallengeShown-\(today)"
        guard !UserDefaults.standard.bool(forKey: shownKey),
              !showOnboarding,
              !isDailyChallengeComplete else { return }
        UserDefaults.standard.set(true, forKey: shownKey)
        showDailyChallenge = true
    }

    // MARK: - Game Lifecycle
    func requestGameStart(mode: GameMode, tier: Int, focus: Bool = false) {
        showModeSelection = false
        showFocusPicker = false
        isFocusMode = focus
        // Delay to let the sheet dismiss animation complete
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { [weak self] in
            self?.startGame(mode: mode, tier: tier)
        }
    }

    func executePendingGameStart() {
        guard let mode = pendingGameMode, let tier = pendingGameTier else { return }
        pendingGameMode = nil
        pendingGameTier = nil
        startGame(mode: mode, tier: tier)
    }

    func startGame(mode: GameMode, tier: Int) {
        gameConfig.mode = mode
        selectedStartTier = tier
        UserDefaults.standard.set(tier, forKey: Keys.startTier)
        gameStartTime = .now
        wasEndlessMode = mode == .endless
        lastPreviousBest = mode == .classic ? userStats.classicHighScore : userStats.endlessBestStreak
        currentScreen = .game
    }

    func startAssessment(type: String) {
        // Guard: don't trigger if already in game or onboarding is showing
        guard currentScreen == .dashboard, !showOnboarding else { return }
        gameConfig.mode = .assessment
        isFocusMode = false // Assessment always uses all games
        selectedStartTier = type == "baseline" ? 1 : cognitiveProfile.recommendedStartTier
        gameStartTime = .now
        wasEndlessMode = false
        currentScreen = .game
    }

    func handleGameEnd(_ result: GameResult) {
        if result.mode == "assessment" {
            handleAssessmentEnd(result)
            return
        }

        lastResult = result
        wasEndlessMode = result.mode == "endless"

        let xpGained = result.sessionXP

        // Check new high score
        if wasEndlessMode {
            isNewHighScore = result.streak > userStats.endlessBestStreak
        } else {
            isNewHighScore = result.score > userStats.classicHighScore
        }

        // Update stats
        let today = DateFormatter.dayString.string(from: Date())
        let isNewDay = userStats.lastPlayedDate != today
        var newDayStreak = userStats.dayStreak

        if isNewDay {
            let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: Date())!
            let yesterdayStr = DateFormatter.dayString.string(from: yesterday)
            newDayStreak = userStats.lastPlayedDate == yesterdayStr ? userStats.dayStreak + 1 : 1
        }

        userStats.classicHighScore = wasEndlessMode
            ? userStats.classicHighScore
            : max(userStats.classicHighScore, result.score)
        userStats.endlessBestStreak = wasEndlessMode
            ? max(userStats.endlessBestStreak, result.streak)
            : userStats.endlessBestStreak
        // Apply streak multiplier to XP
        let multipliedXP = Int(Double(xpGained) * streakMultiplier)
        userStats.totalXP += multipliedXP
        userStats.totalGamesPlayed += 1
        userStats.totalCorrectAnswers += result.correct
        userStats.lastPlayedDate = today
        userStats.dayStreak = newDayStreak

        // Per-game mastery leveling
        if let breakdown = result.gameBreakdown {
            for (gameType, entry) in breakdown {
                let currentMXP = userStats.gameMasteryXP[gameType] ?? 0
                userStats.gameMasteryXP[gameType] = currentMXP + entry.correct
                let newLevel = UserStats.masteryLevel(for: userStats.gameMasteryXP[gameType] ?? 0)
                userStats.gameLevels[gameType] = newLevel
            }
        }

        // Daily challenge progress
        let todayStr = DateFormatter.dayString.string(from: Date())
        if userStats.lastDailyChallengeDate != todayStr {
            userStats.lastDailyChallengeDate = todayStr
            userStats.dailyChallengeProgress = 0
        }
        userStats.dailyChallengeProgress += result.correct
        let target = dailyChallengeTarget
        if userStats.dailyChallengeProgress >= target &&
           userStats.dailyChallengeProgress - result.correct < target {
            userStats.dailyChallengesCompleted += 1
            let bonus = Int(Double(500) * streakMultiplier)
            userStats.totalXP += bonus
        }

        // Rank-up check — auto-unlock and equip new theme
        let newRank = AxonTheme.forXP(userStats.totalXP)
        if !userStats.unlockedThemeIds.contains(newRank.id) {
            userStats.unlockedThemeIds.append(newRank.id)
            userStats.activeThemeId = newRank.id
        }

        // Build cognitive profile from first gameplay (works for new users and grandfathered users)
        if cognitiveProfile.compositeScore == 0, let breakdown = result.gameBreakdown {
            var domainData: [String: (correct: Int, wrong: Int, count: Int, peakTier: Int)] = [:]
            for domain in CognitiveDomain.allCases {
                domainData[domain.rawValue] = (0, 0, 0, 1)
            }
            for (gameType, entry) in breakdown {
                guard let domain = CognitiveScoring.domainMapping[gameType] else { continue }
                var d = domainData[domain]!
                d.correct += entry.correct
                d.wrong += entry.wrong
                d.count += entry.correct + entry.wrong
                domainData[domain] = d
            }
            var domainScores: [String: DomainScore] = [:]
            for domain in CognitiveDomain.allCases {
                let d = domainData[domain.rawValue]!
                domainScores[domain.rawValue] = CognitiveScoring.calculateDomainScore(
                    correct: d.correct, wrong: d.wrong,
                    avgResponseMs: 0, questionsAnswered: d.count, peakTier: d.peakTier
                )
            }
            cognitiveProfile.domainScores = domainScores
            cognitiveProfile.compositeScore = CognitiveScoring.calculateComposite(domainScores)
            cognitiveProfile.classificationLevel = CognitiveScoring.classification(for: cognitiveProfile.compositeScore)
            cognitiveProfile.baselineComplete = true
            cognitiveProfile.assessmentCount = 1
            cognitiveProfile.lastAssessmentDate = DateFormatter.dayString.string(from: Date())
            // Set current week so user isn't immediately weekly-gated
            let calendar = Calendar.current
            let week = calendar.component(.weekOfYear, from: Date())
            let year = calendar.component(.yearForWeekOfYear, from: Date())
            cognitiveProfile.lastWeeklyDate = "\(year)-\(String(format: "%02d", week))"
            isFirstBaseline = true
        }

        currentScreen = .result

        // Prompt for review after 5 games (once)
        if userStats.totalGamesPlayed == 5 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                if let scene = UIApplication.shared.connectedScenes
                    .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                    SKStoreReviewController.requestReview(in: scene)
                }
            }
        }
    }

    func handleRequestContinue(_ result: GameResult) {
        pendingDeathData = result
        showContinueModal = true
    }

    func continueWithAd() {
        showContinueModal = false
        pendingDeathData = nil
        // Native calls continueGame() on the WebView
    }

    func continueWithXP() {
        showContinueModal = false
        pendingDeathData = nil
        // Native calls continueGame() on the WebView
    }

    func endRun() {
        showContinueModal = false
        if let data = pendingDeathData {
            pendingDeathData = nil
            handleGameEnd(data)
        }
    }


    // MARK: - Assessment Processing
    private func handleAssessmentEnd(_ result: GameResult) {
        lastResult = result
        isNewHighScore = false

        let assessmentType = result.assessmentType ?? "baseline"

        // Aggregate per-domain data from game breakdown
        var domainData: [String: (correct: Int, wrong: Int, totalMs: Int, count: Int, peakTier: Int)] = [:]
        for domain in CognitiveDomain.allCases {
            domainData[domain.rawValue] = (0, 0, 0, 0, 1)
        }

        if let breakdown = result.gameBreakdown {
            for (gameType, entry) in breakdown {
                guard let domain = CognitiveScoring.domainMapping[gameType] else { continue }
                var d = domainData[domain]!
                d.correct += entry.correct
                d.wrong += entry.wrong
                let questionCount = entry.correct + entry.wrong
                d.count += questionCount
                if let avgMs = result.perGameResponseTimes?[gameType] {
                    d.totalMs += avgMs * questionCount
                }
                if let peakT = result.perGamePeakTiers?[gameType] {
                    d.peakTier = max(d.peakTier, peakT)
                }
                domainData[domain] = d
            }
        }

        // Calculate domain scores
        var domainScores: [String: DomainScore] = [:]
        for domain in CognitiveDomain.allCases {
            let d = domainData[domain.rawValue]!
            domainScores[domain.rawValue] = CognitiveScoring.calculateDomainScore(
                correct: d.correct, wrong: d.wrong,
                avgResponseMs: d.count > 0 ? d.totalMs / d.count : 0,
                questionsAnswered: d.count, peakTier: d.peakTier
            )
        }

        let composite = CognitiveScoring.calculateComposite(domainScores)
        let classification = CognitiveScoring.classification(for: composite)

        // Update cognitive profile
        cognitiveProfile.domainScores = domainScores
        cognitiveProfile.compositeScore = composite
        cognitiveProfile.classificationLevel = classification
        cognitiveProfile.assessmentCount += 1
        cognitiveProfile.lastAssessmentDate = DateFormatter.dayString.string(from: Date())

        if assessmentType == "baseline" {
            cognitiveProfile.baselineComplete = true
        }
        if assessmentType == "weekly" || assessmentType == "baseline" {
            let calendar = Calendar.current
            let week = calendar.component(.weekOfYear, from: Date())
            let year = calendar.component(.yearForWeekOfYear, from: Date())
            cognitiveProfile.lastWeeklyDate = "\(year)-\(String(format: "%02d", week))"
        }

        // Build game results for history
        var gameResults: [AssessmentGameResult] = []
        if let breakdown = result.gameBreakdown {
            for (gameType, entry) in breakdown {
                let domain = CognitiveScoring.domainMapping[gameType] ?? "unknown"
                gameResults.append(AssessmentGameResult(
                    gameType: gameType,
                    domain: domain,
                    correct: entry.correct,
                    wrong: entry.wrong,
                    avgResponseMs: result.perGameResponseTimes?[gameType] ?? 0,
                    peakTier: result.perGamePeakTiers?[gameType] ?? 1
                ))
            }
        }

        let assessmentResult = AssessmentResult(
            date: ISO8601DateFormatter().string(from: Date()),
            type: assessmentType,
            duration: result.duration ?? 180,
            compositeScore: composite,
            domainScores: domainScores,
            gameResults: gameResults,
            totalCorrect: result.correct,
            totalWrong: result.wrong,
            classificationLevel: classification
        )
        assessmentHistory.addResult(assessmentResult)

        currentScreen = .result
    }

    // MARK: - Reset
    func resetStats() {
        userStats = .default
        selectedStartTier = 1
        UserDefaults.standard.set(1, forKey: Keys.startTier)
    }

    // MARK: - Persistence Helpers
    private func save<T: Encodable>(_ value: T, key: String) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private static func load<T: Decodable>(key: String) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }
}

// MARK: - DateFormatter Extension
extension DateFormatter {
    static let dayString: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .full
        f.timeStyle = .none
        return f
    }()
}
