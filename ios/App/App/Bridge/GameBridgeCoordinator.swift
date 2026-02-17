import Foundation
import WebKit

@MainActor
final class GameBridgeCoordinator: NSObject, ObservableObject, WKScriptMessageHandler {
    weak var appState: AppState?
    weak var webView: WKWebView?
    @Published var gameReady = false

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard let body = message.body as? [String: Any],
              let type = body["type"] as? String else {
            return
        }

        Task { @MainActor in
            switch type {
            case "gameEnd":
                handleGameEnd(body)
            case "requestContinue":
                handleRequestContinue(body)
            case "quit":
                appState?.currentScreen = .dashboard
            case "haptic":
                if let style = body["style"] as? String,
                   appState?.appSettings.hapticsEnabled == true {
                    HapticService.shared.handle(style: style)
                }
            case "ready":
                gameReady = true
                sendStartGame()
            case "jsError":
                #if DEBUG
                let msg = body["message"] as? String ?? "unknown"
                print("[Bridge] JS Error: \(msg)")
                #endif
            default:
                #if DEBUG
                print("[Bridge] Unknown message type: \(type)")
                #endif
                break
            }
        }
    }

    private func parseGameBreakdown(_ payload: [String: Any]) -> [String: GameBreakdownEntry]? {
        guard let raw = payload["gameBreakdown"] as? [String: [String: Any]] else { return nil }
        var breakdown: [String: GameBreakdownEntry] = [:]
        for (gameType, entry) in raw {
            breakdown[gameType] = GameBreakdownEntry(
                correct: entry["correct"] as? Int ?? 0,
                wrong: entry["wrong"] as? Int ?? 0
            )
        }
        return breakdown.isEmpty ? nil : breakdown
    }

    private func parseIntDict(_ payload: [String: Any], key: String) -> [String: Int]? {
        guard let raw = payload[key] as? [String: Any] else { return nil }
        let dict = raw.compactMapValues { $0 as? Int }
        return dict.isEmpty ? nil : dict
    }

    private func handleGameEnd(_ body: [String: Any]) {
        guard let payload = body["payload"] as? [String: Any] else { return }

        let result = GameResult(
            score: payload["score"] as? Int ?? 0,
            streak: payload["streak"] as? Int ?? 0,
            correct: payload["correct"] as? Int ?? 0,
            wrong: payload["wrong"] as? Int ?? 0,
            sessionXP: payload["sessionXP"] as? Int ?? 0,
            mode: payload["mode"] as? String ?? "classic",
            duration: payload["duration"] as? Int,
            peakTension: payload["peakTension"] as? Double,
            gameBreakdown: parseGameBreakdown(payload),
            assessmentType: payload["assessmentType"] as? String,
            perGameResponseTimes: parseIntDict(payload, key: "perGameResponseTimes"),
            perGamePeakTiers: parseIntDict(payload, key: "perGamePeakTiers")
        )

        appState?.handleGameEnd(result)
    }

    private func handleRequestContinue(_ body: [String: Any]) {
        guard let payload = body["payload"] as? [String: Any] else { return }

        let result = GameResult(
            score: payload["score"] as? Int ?? 0,
            streak: payload["streak"] as? Int ?? 0,
            correct: payload["correct"] as? Int ?? 0,
            wrong: payload["wrong"] as? Int ?? 0,
            sessionXP: payload["sessionXP"] as? Int ?? 0,
            mode: appState?.gameConfig.mode.rawValue ?? "endless",
            duration: nil,
            peakTension: nil,
            gameBreakdown: parseGameBreakdown(payload),
            assessmentType: nil,
            perGameResponseTimes: nil,
            perGamePeakTiers: nil
        )

        appState?.handleRequestContinue(result)
    }

    func sendStartGame() {
        guard let appState = appState else { return }

        let games = appState.isFocusMode ? Array(appState.focusGames) : GameConfig.mixableGames
        let enabledGames = games.map { "\"\($0.rawValue)\"" }.joined(separator: ",")
        let assessmentType: String
        if appState.gameConfig.mode == .assessment {
            assessmentType = appState.cognitiveProfile.baselineComplete ? "\"weekly\"" : "\"baseline\""
        } else {
            assessmentType = "null"
        }

        let js = """
        window.axonBridge && window.axonBridge.startGame({
            mode: "\(appState.gameConfig.mode.rawValue)",
            enabledGames: [\(enabledGames)],
            startTier: \(appState.selectedStartTier),
            bestScore: \(appState.userStats.classicHighScore),
            bestStreak: \(appState.userStats.endlessBestStreak),
            soundEnabled: \(appState.appSettings.soundEnabled),
            hapticsEnabled: \(appState.appSettings.hapticsEnabled),
            streakMultiplier: \(appState.streakMultiplier),
            assessmentType: \(assessmentType)
        })
        """

        webView?.evaluateJavaScript(js) { _, error in
            #if DEBUG
            if let error = error {
                print("[Bridge] startGame error: \(error)")
            }
            #endif
        }
    }

    func sendContinueGame() {
        webView?.evaluateJavaScript("window.axonBridge && window.axonBridge.continueGame()") { _, _ in }
    }
}
