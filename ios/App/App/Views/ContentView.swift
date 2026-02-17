import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            switch appState.currentScreen {
            case .dashboard:
                DashboardView()
                    .transition(.opacity.combined(with: .scale(scale: 0.97)))

            case .game:
                GameContainerView()
                    .transition(.opacity)

            case .result:
                ResultView()
                    .transition(.opacity)
            }
        }
        .animation(.easeOut(duration: 0.35), value: appState.currentScreen)
        .fullScreenCover(isPresented: $appState.showWeeklyAssessmentGate) {
            WeeklyAssessmentGateView()
                .environmentObject(appState)
        }
    }
}
