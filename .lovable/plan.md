
## Cinematic Splash Screen & Dashboard Header Cleanup

This plan implements a premium launch experience where the AXON branding appears as a cinematic splash screen on app load, then fades away to reveal a cleaner dashboard.

---

### Overview

```text
┌─────────────────────────────────────────────────────┐
│                   APP LAUNCH                        │
│                                                     │
│  [SplashScreen]  ─────(2.5s)─────▶  [Dashboard]     │
│    • AXON logo                       • Clean header │
│    • Blur-in effect                  • Stats only   │
│    • Slogan fade-in                  • Brain visual │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Step 1: Create `src/components/SplashScreen.tsx`

A new component with cinematic animations:

**Visual Elements:**
- Pitch black background (OLED-friendly)
- Zap icon with pulsing blue glow effect
- "AXON" title with blur-in reveal animation (starts blurred/spread, snaps into focus)
- Slogan fades in slowly with wide letter spacing

**Animation Timing:**
- Icon: Spring animation over 1.2s
- Title blur-in: 1.5s ease-out
- Slogan fade: Starts at 1s delay, 1s duration
- Exit: Smooth fade-out with blur after 2.5s total

**Props:**
- `onComplete: () => void` - Callback when splash finishes

---

### Step 2: Update `src/pages/Index.tsx`

**Add splash screen state:**
- New boolean state `showSplash` initialized to `true`
- Import and render `SplashScreen` component
- Pass `onComplete` callback that sets `showSplash` to `false`

**Conditional rendering:**
- When `showSplash` is `true`: Only render `SplashScreen`
- When `showSplash` is `false`: Render normal app flow (Dashboard/Game/Result)

---

### Step 3: Clean Up `src/components/Dashboard.tsx`

**Remove from header:**
- The AXON logo (Zap icon in orange box)
- The "AXON" title text
- The slogan "Train Your Neural Pathways"

**Keep in header:**
- Streak Fire indicator
- XP display badge
- Settings button (top right)
- Help button (top left)

**New header layout:**
- Centered row with just StreakFire and XP badge
- Cleaner, minimal appearance since branding is shown on splash

---

### Technical Details

**SplashScreen Animation Sequence:**
```text
0.0s  ─▶  Icon starts (scale 0, rotated)
0.0s  ─▶  Title starts (blurred, spread letters)
1.0s  ─▶  Slogan starts fading in
1.2s  ─▶  Icon completes spring animation
1.5s  ─▶  Title blur clears, letters snap together
2.0s  ─▶  Slogan fully visible (0.5 opacity)
2.5s  ─▶  Trigger onComplete callback
2.5s  ─▶  Screen fades out with blur effect
```

**State Flow:**
```text
App Mount
    │
    ▼
showSplash: true  ─────▶  Render SplashScreen
    │
    │ (2.5s timeout)
    ▼
onComplete()  ─────────▶  showSplash: false
    │
    ▼
Render Dashboard/Game Flow
```

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/SplashScreen.tsx` | **Create** - New cinematic splash component |
| `src/pages/Index.tsx` | **Modify** - Add splash state and conditional rendering |
| `src/components/Dashboard.tsx` | **Modify** - Remove AXON branding, keep stats indicators |

---

### Result

- **First Launch**: Users see a premium cinematic reveal of the AXON brand
- **Dashboard**: Cleaner, more minimal header focused on user stats (streak, XP)
- **Native Feel**: The splash mimics iOS app launch patterns
