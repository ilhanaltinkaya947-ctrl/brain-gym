import Foundation
import WebKit

/// One-time migration from Capacitor localStorage to UserDefaults.
/// Loads a hidden WKWebView to read the old localStorage data.
final class DataMigration {
    private static let migrationKey = "axon-data-migrated"

    static var needsMigration: Bool {
        !UserDefaults.standard.bool(forKey: migrationKey)
    }

    /// Attempts to migrate localStorage data from the old Capacitor WebView.
    /// Call this once during app startup if `needsMigration` is true.
    static func migrateFromLocalStorage(webView: WKWebView, completion: @escaping () -> Void) {
        let js = """
        JSON.stringify({
            settings: localStorage.getItem('axon-settings'),
            stats: localStorage.getItem('axon-user-stats'),
            config: localStorage.getItem('neuroflow-config'),
            adState: localStorage.getItem('axon-ad-state'),
            hasSeenOnboarding: localStorage.getItem('axon-hasSeenOnboarding')
        })
        """

        webView.evaluateJavaScript(js) { result, error in
            guard let jsonString = result as? String,
                  let data = jsonString.data(using: .utf8),
                  let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            else {
                markComplete()
                completion()
                return
            }

            // Migrate UserStats
            if let statsJSON = dict["stats"] as? String,
               let statsData = statsJSON.data(using: .utf8) {
                UserDefaults.standard.set(statsData, forKey: "axon-user-stats")
            }

            // Migrate AppSettings
            if let settingsJSON = dict["settings"] as? String,
               let settingsData = settingsJSON.data(using: .utf8) {
                UserDefaults.standard.set(settingsData, forKey: "axon-settings")
            }

            // Migrate GameConfig
            if let configJSON = dict["config"] as? String,
               let configData = configJSON.data(using: .utf8) {
                UserDefaults.standard.set(configData, forKey: "axon-game-config")
            }

            // Migrate AdState
            if let adJSON = dict["adState"] as? String,
               let adData = adJSON.data(using: .utf8) {
                UserDefaults.standard.set(adData, forKey: "axon-ad-state")
            }

            // Migrate onboarding flag
            if dict["hasSeenOnboarding"] as? String != nil {
                UserDefaults.standard.set(true, forKey: "axon-hasSeenOnboarding")
            }

            markComplete()
            completion()
        }
    }

    private static func markComplete() {
        UserDefaults.standard.set(true, forKey: migrationKey)
    }
}
