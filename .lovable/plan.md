
# Despia Native Integration Plan

## Overview
Despia provides a simpler path to native mobile deployment than Capacitor. Instead of setting up local development environments with Xcode/Android Studio, Despia handles cloud builds and offers one-click publishing with built-in native features.

---

## 1. Add Despia SDK

### Package Installation
```
@aspect/despia-runtime - The Despia JavaScript SDK
```

This single package provides access to all native features through a unified API.

---

## 2. Create Despia Utility Module

### `src/utils/despia.ts`
A utility module to safely interact with Despia features with web fallbacks:

```text
Features to wrap:
├── isNative()        - Check if running in native app
├── haptics
│   ├── light()       - Light tap feedback
│   ├── medium()      - Medium impact
│   ├── heavy()       - Heavy impact
│   └── success()     - Success pattern
├── notifications
│   ├── requestPermission()
│   └── scheduleDaily()
└── platform
    ├── isIOS()
    └── isAndroid()
```

The wrapper will check if Despia is available (native) and gracefully fall back to web APIs or no-ops when running in browser.

---

## 3. Create useDespia Hook

### `src/hooks/useDespia.ts`
A React hook providing easy access to Despia features:

```text
Hook returns:
├── isNative: boolean
├── platform: 'ios' | 'android' | 'web'
├── haptic: {
│   ├── light: () => void
│   ├── medium: () => void
│   ├── heavy: () => void
│   └── success: () => void
│ }
└── notifications: {
    └── requestPermission: () => Promise<boolean>
}
```

---

## 4. Integrate Haptics into Game Flow

### Files to Modify

**`src/hooks/useSounds.ts`**
- Add haptic feedback alongside sound effects
- `playSuccess()` → light haptic
- `playError()` → heavy haptic
- `playLevelUp()` → success pattern

**`src/components/MixedGameScreen.tsx`**
- Add haptic on correct answer (medium)
- Add haptic on wrong answer (heavy)
- Add haptic on streak milestone (success pattern)
- Add haptic on game complete (success)

**`src/components/games/ChimpMemory.tsx`**
- Light haptic on cell tap
- Success haptic on completing a sequence

**`src/components/SpeedMath.tsx`**
- Light haptic on option selection
- Medium haptic on correct answer

---

## 5. Safe Area & Status Bar

Despia provides built-in safe area handling:

**`src/App.tsx`**
- Add Despia status bar configuration on mount
- Set status bar style to light content (for dark theme)
- Enable fullscreen mode for immersive gameplay

---

## 6. Future Native Features (Post-Launch)

These can be added later without code changes in Lovable:

| Feature | Use Case |
|---------|----------|
| **RevenueCat** | Premium subscription ($4.99/month) |
| **OneSignal** | Daily training reminders at user's preferred time |
| **AdMob Rewarded** | Watch ad for extra life or XP boost |
| **Home Widgets** | Show current streak and brain charge |
| **Biometrics** | Secure login with Face ID/Touch ID |
| **Offline Mode** | Cache games for airplane mode |

---

## 7. Files to Create/Modify

### New Files
1. **`src/utils/despia.ts`** - Despia wrapper with web fallbacks
2. **`src/hooks/useDespia.ts`** - React hook for native features

### Modified Files
1. **`package.json`** - Add `@aspect/despia-runtime` dependency
2. **`src/hooks/useSounds.ts`** - Integrate haptic feedback with sounds
3. **`src/components/MixedGameScreen.tsx`** - Add haptics to game events
4. **`src/components/games/ChimpMemory.tsx`** - Add tap haptics
5. **`src/components/SpeedMath.tsx`** - Add answer haptics
6. **`src/App.tsx`** - Initialize Despia on app mount

---

## 8. Deployment Process

After I make these code changes, here's your Despia workflow:

1. **Publish your Lovable app** to get the live URL
2. **Go to v3.despia.com** and create an account
3. **Enter your published URL** (e.g., `https://neuro-flow-brain-boost.lovable.app`)
4. **Configure app details**: Name, icons, splash screen
5. **Select native features** you want enabled
6. **One-click build** - Despia builds on their M2 machines
7. **Download** the .ipa (iOS) or .aab (Android) file
8. **Submit to stores** or use their one-click submission

### Over-the-Air Updates
After initial app store approval, any changes you make in Lovable will automatically reflect in the native app - no new app store submission needed for web code changes.

---

## Pricing Summary

| Option | Price | Includes |
|--------|-------|----------|
| Solo (iOS only) | $249 one-time | 200 build minutes, source export |
| Solo (Android only) | $249 one-time | 200 build minutes, source export |
| Hybrid (Both) | $498 one-time | 400 build minutes, source export |

All native plugins (haptics, notifications, payments, ads) are **free** and included.

---

## Summary

This integration will:
- Add native haptic feedback throughout the game
- Prepare the codebase for Despia's native features
- Keep web compatibility (graceful fallbacks)
- Enable future monetization (RevenueCat, AdMob)
- Allow over-the-air updates after initial store approval
