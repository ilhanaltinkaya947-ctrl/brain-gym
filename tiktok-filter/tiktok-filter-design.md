# AXON Brain — TikTok Filter Design Document

## Overview

A 25-second promotional TikTok filter that gives users a rapid-fire taste of AXON Brain's cognitive training. The filter cycles through 3 simplified mini-games over the user's camera feed, builds a score, and ends with a branded results screen encouraging download.

**Goal**: Hook viewers in the first 2 seconds, deliver a satisfying brain-test experience, and convert to App Store downloads.

---

## Selected Mini-Games (3 of 10)

### Why These 3?

| Game | Why Selected |
|------|-------------|
| **Pattern Hunter** | Instantly understandable ("find the odd one"), colorful emoji grid is eye-catching on camera, no instructions needed |
| **Flash Sequence** | Animated cell flashes are visually dramatic, memory tests are universally engaging, creates tension |
| **Color Chaos** | Stroop effect is scientifically fascinating, colorful text pops on camera, generates genuine "wait, what?" moments |

### Why NOT the Others?

| Game | Why Excluded |
|------|-------------|
| WordConnect | Requires drag input (Effect House limitation: tap only) |
| ParadoxFlow | Requires drag/swipe input |
| SpatialStack | 3D isometric rendering too complex for Effect House |
| SpeedMath | Visually boring (just text + numbers) |
| ChimpMemory | Too similar to Flash Sequence; pick one |
| OperatorChaos | Too mathy, requires explanation |
| SuitDeception | Too similar to Pattern Hunter; pick one |

---

## Full Timeline (25 seconds total)

```
[0.0s - 3.0s]  3, 2, 1, GO! countdown (camera visible behind)
[3.0s - 3.3s]  Flash transition to Game 1
[3.3s - 10.3s] PATTERN HUNTER — Find the odd emoji (7 seconds)
[10.3s - 10.6s] Flash transition to Game 2
[10.6s - 17.6s] FLASH SEQUENCE — Repeat the pattern (7 seconds: 3s watch + 4s play)
[17.6s - 17.9s] Flash transition to Game 3
[17.9s - 23.9s] COLOR CHAOS — Name the ink color (6 seconds: 3 rounds x 2s)
[23.9s - 24.2s] Flash transition to Results
[24.2s - 30.0s] RESULTS SCREEN with score + CTA (5.8 seconds)
```

Total: ~30 seconds (fits TikTok short format)

---

## Countdown Phase (0 - 3s)

- Camera feed fills screen
- Semi-transparent dark overlay (40% opacity black)
- Large centered numbers: **3** → **2** → **1** → **GO!**
- Each number scales up from 0.5x to 1.2x then settles at 1.0x (pop effect)
- Color progression: Cyan → Gold → Red → Green (GO!)
- Subtle haptic-style screen flash on each beat
- Small "AXON BRAIN" text at top, muted (brand presence from frame 1)

---

## Game 1: Pattern Hunter (3s - 10.3s)

### Simplified Mechanic
- 4x4 grid (16 cells) of colored circles
- 15 circles are one color, 1 circle is a slightly different color
- Player taps the odd one out
- **One tap to win or lose** — no multi-find

### Visual Design
- Grid overlaid on camera feed with semi-transparent dark backing (60% opacity)
- Circles are large, vibrant (neon cyan base, odd one is neon magenta)
- Header: "FIND THE ODD ONE" in uppercase tracking-wide text
- Timer bar at top depleting left-to-right (cyan → magenta gradient)

### Scoring
- Correct: +100 points, circle explodes (scale up + fade), screen flash green
- Wrong: +0 points, grid shakes, screen flash red
- Timeout (7s): +0 points, odd circle pulses to reveal itself

### Color Pairs (randomized each play)
1. Cyan vs Magenta
2. Green vs Yellow
3. Orange vs Red
4. Purple vs Blue

The odd color is always 30-40 degrees offset in hue — noticeable but requires focus.

---

## Game 2: Flash Sequence (10.6s - 17.6s)

### Simplified Mechanic
- 3x3 grid (9 cells)
- **Watch phase (3s)**: 4 cells light up in sequence (700ms each), with trail effect
- **Play phase (4s)**: Tap the cells back in the same order
- One mistake = fail

### Visual Design
- Grid overlaid on camera with dark backing
- Cells are rounded squares with subtle border glow
- Active cell: bright cyan with radial glow pulse
- Trail: previous cell dims to 40% opacity cyan
- Header: "WATCH..." during show phase, "YOUR TURN!" during play phase
- Progress dots below grid showing sequence position

### Scoring
- All 4 correct: +150 points, checkmark overlay + confetti burst
- Any wrong: +0 points, X overlay + red flash
- Timeout: +0 points, sequence replays in red to show correct answer

---

## Game 3: Color Chaos (17.9s - 23.9s)

### Simplified Mechanic
- 3 rapid rounds, 2 seconds each
- Large word displayed in a DIFFERENT color than its meaning (Stroop effect)
- Example: The word "BLUE" displayed in RED ink
- 3 color buttons at bottom: player taps the INK COLOR (not the word)

### Visual Design
- Word takes center screen, huge bold text (fills ~40% of width)
- Semi-transparent dark backing behind word area
- 3 large colored buttons at bottom (the actual colors, not text labels)
- Buttons: circles or rounded rectangles filled with solid color
- Header: "TAP THE INK COLOR" with underline on "INK"

### Color Pool
- Red, Blue, Green, Yellow (4 colors, 3 shown as options per round)
- One option is always the ink color (correct), one is the word meaning (trap), one is random

### Scoring (per round)
- Correct: +75 points, button pulses gold, quick "NICE!" text
- Wrong: +0 points, red flash
- Timeout: +0 points, correct button pulses to reveal

---

## Transitions Between Games

- **Duration**: 300ms
- **Effect**: Screen flashes white (opacity 0 → 0.8 → 0 over 300ms)
- **Game label appears**: e.g., "PATTERN HUNTER" in bold caps, fades after 500ms
- **Sound**: Quick "whoosh" transition feel (Effect House has limited audio)

---

## Results Screen (24.2s - 30s)

### Layout (top to bottom)
1. **Score** — Large number with gold glow, counts up from 0 to final score (1s animation)
2. **Reactive Message** — Based on score tier:
   - 275-325 (perfect/near-perfect): "You're a GENIUS!" (gold text, sparkle)
   - 150-274: "Not bad... can you do better?" (cyan text)
   - 0-149: "Think you can beat this?" (white text)
3. **Breakdown** — 3 small icons showing per-game result (checkmark or X)
4. **Brand CTA**:
   - "AXON BRAIN" logo text (large, gradient cyan→magenta)
   - "Train your brain with 10+ challenges"
   - "Available on the App Store" with App Store badge outline
5. **Camera feed visible behind** all elements (20% visible through dark overlay)

### Animation
- Score counter rolls up with easing (0 → final in 1.2s)
- Reactive message fades in at 1.5s
- Breakdown icons pop in sequentially at 2s
- CTA fades in at 2.5s
- Everything holds until filter ends

### Max Possible Score
- Pattern Hunter: 100
- Flash Sequence: 150
- Color Chaos: 75 x 3 = 225
- **Total max: 475** (but realistically 200-325 is "good")

---

## Visual Language

### Colors (AXON Brand)
| Name | Value | Usage |
|------|-------|-------|
| Neon Cyan | `#00D4FF` / hsl(192, 100%, 50%) | Primary accent, correct feedback |
| Neon Magenta | `#FF00FF` / hsl(300, 100%, 50%) | Secondary accent, wrong feedback |
| Neon Gold | `#FFD700` / hsl(51, 100%, 50%) | Score, success, highlights |
| Deep Black | `#0A0A0F` | Overlay background |
| Pure White | `#FFFFFF` | Text, borders |

### Typography
- All caps, tracking-wide (letter-spacing: 0.1em+)
- Bold/Black weight for numbers and headers
- Monospace for score counter
- Font: System default (Effect House uses device font)

### Design Principles
- Camera feed ALWAYS visible (this is TikTok — the person's face is the content)
- Dark overlays max 70% opacity (user stays visible)
- All game elements contained within safe area (top 15% and bottom 15% reserved)
- Neon glow effects on key elements (score, correct feedback, countdown numbers)
- Motion: everything enters/exits with purpose — no static pops

---

## Input Model

- **Tap only** — no drag, no swipe, no multi-touch
- Touch areas must be large (minimum 80x80pt equivalent)
- Tap feedback: immediate visual response (< 50ms perceived)
- Tap regions should not overlap or be too close (minimum 20pt gap)

---

## Performance Constraints

- Effect House runs at 30fps on older devices
- Minimize simultaneous animations (max 3 concurrent tweens)
- No particle systems beyond simple scale+fade (no physics)
- Text changes are cheap; transform changes are medium; opacity changes are cheap
- Avoid spawning/destroying objects at runtime — pre-create and show/hide instead

---

## Audio Notes

Effect House has limited audio support:
- Use built-in "tap" sound for button presses
- Use pitch variation for correct (higher) vs wrong (lower)
- Countdown beeps can use the same tap sound with timing
- No custom audio files needed — keep it silent-friendly (most TikTok is watched on mute)

All feedback must work WITHOUT sound (visual-only must be sufficient).
