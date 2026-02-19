import Foundation
import WebKit

/// Serves files from the GameBundle directory via a custom URL scheme.
/// This avoids CORS/ES-module restrictions that occur with file:// URLs in WKWebView.
final class GameBundleSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "axon-game"

    private let bundlePath: String?

    override init() {
        if let url = Bundle.main.url(forResource: "game", withExtension: "html", subdirectory: "GameBundle") {
            self.bundlePath = url.deletingLastPathComponent().path
        } else {
            self.bundlePath = nil
            #if DEBUG
            NSLog("[SchemeHandler] ERROR: GameBundle not found in app bundle")
            #endif
        }
        super.init()
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: any WKURLSchemeTask) {
        guard let requestURL = urlSchemeTask.request.url,
              let bundlePath = bundlePath else {
            urlSchemeTask.didFailWithError(NSError(domain: "GameBundleSchemeHandler", code: 404))
            return
        }

        // Convert axon-game://localhost/game.html -> GameBundle/game.html
        let relativePath = requestURL.path
        let filePath = bundlePath + relativePath

        guard FileManager.default.fileExists(atPath: filePath),
              let data = try? Data(contentsOf: URL(fileURLWithPath: filePath)) else {
            #if DEBUG
            NSLog("[SchemeHandler] File not found: %@", relativePath)
            #endif
            urlSchemeTask.didFailWithError(NSError(domain: "GameBundleSchemeHandler", code: 404))
            return
        }

        let mimeType = Self.mimeType(for: filePath)
        let response = URLResponse(
            url: requestURL,
            mimeType: mimeType,
            expectedContentLength: data.count,
            textEncodingName: mimeType.hasPrefix("text/") || mimeType.contains("javascript") ? "utf-8" : nil
        )

        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: any WKURLSchemeTask) {
        // Nothing to cancel
    }

    private static func mimeType(for path: String) -> String {
        let ext = (path as NSString).pathExtension.lowercased()
        switch ext {
        case "html": return "text/html"
        case "js":   return "application/javascript"
        case "css":  return "text/css"
        case "json": return "application/json"
        case "png":  return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "svg":  return "image/svg+xml"
        case "ico":  return "image/x-icon"
        case "woff": return "font/woff"
        case "woff2": return "font/woff2"
        case "ttf":  return "font/ttf"
        default:     return "application/octet-stream"
        }
    }
}
