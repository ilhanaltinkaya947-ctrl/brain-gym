import SwiftUI

struct SettingsSheet: View {
    @EnvironmentObject var appState: AppState
    @State private var showResetConfirm = false

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }

    private var buildNumber: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Settings")
                    .font(.system(size: 22, weight: .semibold))
                    .tracking(-0.3)
                    .foregroundStyle(Color.textPrimary)

                Spacer()

                Button {
                    HapticService.shared.light()
                    appState.showSettings = false
                } label: {
                    ZStack {
                        Color.clear.frame(width: 44, height: 44)
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Color.textSecondary)
                            .frame(width: 36, height: 36)
                            .background(Color.bgMuted, in: Circle())
                    }
                    .contentShape(Rectangle())
                }
                .accessibilityLabel("Close settings")
                .accessibilityHint("Dismisses the settings panel")
            }
            .padding(.horizontal, 24)
            .padding(.top, 8)
            .padding(.bottom, 20)

            // Scrollable content
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 24) {
                    // MARK: - Preferences
                    settingsSection("PREFERENCES") {
                        VStack(spacing: 1) {
                            settingRow(
                                icon: appState.appSettings.soundEnabled ? "speaker.wave.2.fill" : "speaker.slash.fill",
                                iconColor: appState.appSettings.soundEnabled ? .neonCyan : .textMuted,
                                title: "Sound",
                                subtitle: "Game audio effects",
                                isOn: Binding(
                                    get: { appState.appSettings.soundEnabled },
                                    set: { newValue in
                                        HapticService.shared.light()
                                        appState.appSettings.soundEnabled = newValue
                                    }
                                )
                            )

                            divider

                            settingRow(
                                icon: "iphone.radiowaves.left.and.right",
                                iconColor: appState.appSettings.hapticsEnabled ? .neonCyan : .textMuted,
                                title: "Haptics",
                                subtitle: "Vibration feedback",
                                isOn: Binding(
                                    get: { appState.appSettings.hapticsEnabled },
                                    set: { newValue in
                                        if newValue { HapticService.shared.medium() }
                                        appState.appSettings.hapticsEnabled = newValue
                                    }
                                )
                            )
                        }
                    }

                    // MARK: - Data
                    settingsSection("DATA") {
                        actionRow(
                            icon: "arrow.counterclockwise",
                            iconColor: .red,
                            title: "Reset Statistics",
                            subtitle: "Clear all scores, streaks & XP"
                        ) {
                            HapticService.shared.light()
                            showResetConfirm = true
                        }
                    }

                    // MARK: - About
                    settingsSection("ABOUT") {
                        VStack(spacing: 1) {
                            infoRow(
                                icon: "info.circle",
                                title: "Version",
                                value: "\(appVersion) (\(buildNumber))"
                            )

                            divider

                            infoRow(
                                icon: "brain.head.profile",
                                title: "Crafted by",
                                value: "axon team"
                            )
                        }
                    }

                    // Footer tagline
                    Text("Train Your Neural Pathways")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.white.opacity(0.12))
                        .padding(.top, 4)
                        .padding(.bottom, 24)
                }
                .padding(.horizontal, 24)
            }
        }
        .alert("Reset Statistics", isPresented: $showResetConfirm) {
            Button("Cancel", role: .cancel) { }
            Button("Reset", role: .destructive) {
                appState.resetStats()
                HapticService.shared.medium()
            }
        } message: {
            Text("This will reset all your scores, streaks, and XP. This cannot be undone.")
        }
    }

    // MARK: - Section Container

    @ViewBuilder
    private func settingsSection<Content: View>(
        _ header: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(header)
                .font(.system(size: 11, weight: .semibold))
                .tracking(1.2)
                .foregroundStyle(Color.textMuted)
                .padding(.leading, 4)

            content()
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.bgMuted.opacity(0.5))
                        .overlay {
                            RoundedRectangle(cornerRadius: 16)
                                .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
                        }
                )
        }
    }

    // MARK: - Divider

    private var divider: some View {
        Rectangle()
            .fill(Color.white.opacity(0.06))
            .frame(height: 1)
            .padding(.leading, 52)
    }

    // MARK: - Toggle Row (existing)

    @ViewBuilder
    private func settingRow(
        icon: String,
        iconColor: Color,
        title: String,
        subtitle: String,
        isOn: Binding<Bool>
    ) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundStyle(iconColor)
                .frame(width: 32, height: 32)
                .background(iconColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(Color.textPrimary)

                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundStyle(Color.textMuted)
            }

            Spacer()

            Toggle("", isOn: isOn)
                .tint(.neonCyan)
                .labelsHidden()
                .accessibilityLabel(title)
                .accessibilityHint(subtitle)
                .accessibilityValue(isOn.wrappedValue ? "On" : "Off")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    // MARK: - Action Row (tappable)

    @ViewBuilder
    private func actionRow(
        icon: String,
        iconColor: Color,
        title: String,
        subtitle: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 15))
                    .foregroundStyle(iconColor)
                    .frame(width: 32, height: 32)
                    .background(iconColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(Color.textPrimary)

                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundStyle(Color.textMuted)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.textMuted.opacity(0.5))
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityHint(subtitle)
    }

    // MARK: - Info Row (non-interactive)

    @ViewBuilder
    private func infoRow(
        icon: String,
        title: String,
        value: String
    ) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundStyle(Color.textMuted)
                .frame(width: 32, height: 32)
                .background(Color.textMuted.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
                .accessibilityHidden(true)

            Text(title)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Color.textPrimary)

            Spacer()

            Text(value)
                .font(.system(size: 14))
                .foregroundStyle(Color.textSecondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title): \(value)")
    }
}
