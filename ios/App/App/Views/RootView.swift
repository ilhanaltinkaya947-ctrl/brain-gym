import SwiftUI

struct RootView: View {
    @EnvironmentObject var appState: AppState
    @State private var showSplash = true

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            if showSplash {
                SplashView()
                    .transition(.opacity)
            } else if appState.showOnboarding {
                OnboardingView()
                    .transition(.opacity)
            } else {
                ContentView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.6), value: showSplash)
        .animation(.easeInOut(duration: 0.5), value: appState.showOnboarding)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                withAnimation { showSplash = false }
            }
        }
        .sheet(isPresented: $appState.showSettings) {
            SettingsSheet()
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
                .sheetBackground()
        }
        .sheet(isPresented: $appState.showModeSelection) {
            ModeSelectionSheet()
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
                .sheetBackground()
        }
        .sheet(isPresented: $appState.showFocusPicker) {
            FocusPickerSheet()
                .presentationDetents([.fraction(0.92)])
                .presentationDragIndicator(.visible)
                .sheetBackground()
        }
        .overlay {
            if appState.showDailyChallenge {
                DailyChallengePopup()
                    .transition(.opacity)
                    .animation(.easeOut(duration: 0.25), value: appState.showDailyChallenge)
            }
        }
    }
}

extension View {
    @ViewBuilder
    func sheetBackground() -> some View {
        if #available(iOS 16.4, *) {
            self.presentationBackground(Color.bgCard)
        } else {
            self.background(Color.bgCard)
        }
    }
}
