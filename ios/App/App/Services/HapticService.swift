import UIKit

final class HapticService {
    static let shared = HapticService()

    private let lightGenerator = UIImpactFeedbackGenerator(style: .light)
    private let mediumGenerator = UIImpactFeedbackGenerator(style: .medium)
    private let heavyGenerator = UIImpactFeedbackGenerator(style: .heavy)
    private let notificationGenerator = UINotificationFeedbackGenerator()
    private let selectionGenerator = UISelectionFeedbackGenerator()

    private var isEnabled: Bool {
        guard let data = UserDefaults.standard.data(forKey: "axon-settings"),
              let settings = try? JSONDecoder().decode(AppSettings.self, from: data) else {
            return true // default to enabled if no settings saved
        }
        return settings.hapticsEnabled
    }

    private init() {
        // Pre-warm generators for instant response
        lightGenerator.prepare()
        mediumGenerator.prepare()
        heavyGenerator.prepare()
        notificationGenerator.prepare()
        selectionGenerator.prepare()
    }

    func light() {
        guard isEnabled else { return }
        lightGenerator.impactOccurred()
        lightGenerator.prepare()
    }

    func medium() {
        guard isEnabled else { return }
        mediumGenerator.impactOccurred()
        mediumGenerator.prepare()
    }

    func heavy() {
        guard isEnabled else { return }
        heavyGenerator.impactOccurred()
        heavyGenerator.prepare()
    }

    func success() {
        guard isEnabled else { return }
        notificationGenerator.notificationOccurred(.success)
        notificationGenerator.prepare()
    }

    func warning() {
        guard isEnabled else { return }
        notificationGenerator.notificationOccurred(.warning)
        notificationGenerator.prepare()
    }

    func error() {
        guard isEnabled else { return }
        notificationGenerator.notificationOccurred(.error)
        notificationGenerator.prepare()
    }

    func selection() {
        guard isEnabled else { return }
        selectionGenerator.selectionChanged()
        selectionGenerator.prepare()
    }

    /// Handle bridge messages from WebView
    func handle(style: String) {
        switch style {
        case "light": light()
        case "medium": medium()
        case "heavy": heavy()
        case "success": success()
        case "warning": warning()
        case "error": error()
        case "selection": selection()
        default: light()
        }
    }
}
