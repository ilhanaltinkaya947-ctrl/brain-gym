import SwiftUI
import WebKit

struct GameWebView: UIViewRepresentable {
    @EnvironmentObject var appState: AppState
    let coordinator: GameBridgeCoordinator

    func makeCoordinator() -> WebViewNavigationDelegate {
        WebViewNavigationDelegate()
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.mediaTypesRequiringUserActionForPlayback = []

        // Register custom scheme handler to serve GameBundle files
        let schemeHandler = GameBundleSchemeHandler()
        config.setURLSchemeHandler(schemeHandler, forURLScheme: GameBundleSchemeHandler.scheme)

        // Register message handler for game bridge
        config.userContentController.add(coordinator, name: "axonNative")

        // Inject JS console.log/error capture -> forward to native
        let consoleScript = WKUserScript(
            source: """
            window.onerror = function(msg, url, line, col, error) {
                window.webkit.messageHandlers.axonNative.postMessage({
                    type: 'jsError', message: msg + ' at ' + url + ':' + line
                });
                return false;
            };
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        config.userContentController.addUserScript(consoleScript)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.02, green: 0.02, blue: 0.02, alpha: 1)
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.navigationDelegate = context.coordinator

        coordinator.webView = webView
        coordinator.appState = appState

        // Load game via custom scheme (avoids file:// CORS issues with ES modules)
        let gameURL = URL(string: "\(GameBundleSchemeHandler.scheme)://localhost/game.html")!
        webView.load(URLRequest(url: gameURL))

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: WebViewNavigationDelegate) {
        uiView.configuration.userContentController.removeAllScriptMessageHandlers()
    }
}

class WebViewNavigationDelegate: NSObject, WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        #if DEBUG
        NSLog("[GameWebView] Page loaded successfully: %@", webView.url?.absoluteString ?? "nil")
        #endif
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        #if DEBUG
        NSLog("[GameWebView] Navigation failed: %@", error.localizedDescription)
        #endif
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        #if DEBUG
        NSLog("[GameWebView] Provisional navigation failed: %@", error.localizedDescription)
        #endif
    }
}
