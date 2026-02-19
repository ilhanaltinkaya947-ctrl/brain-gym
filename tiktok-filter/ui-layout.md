# UI Layout Specification — AXON Brain TikTok Filter

This document describes every visual element you need to create in Effect House's visual editor. All positions use **screen-space coordinates** where (0, 0) is center, X range is -0.5 to +0.5 (left to right), Y range is -0.5 to +0.5 (bottom to top).

Effect House uses a **Full Frame Region** for screen-space UI. All elements below should be children of an **Orthographic Camera** with a **Screen Region** render target.

---

## Scene Hierarchy

```
[Orthographic Camera]
├── OverlayBackground          (full-screen dark tint)
├── CountdownContainer
│   └── CountdownText
├── TransitionFlash            (full-screen white flash)
├── GameLabelText              (game name during transitions)
├── HeaderText                 (instruction text above games)
├── TimerBar
│   ├── TimerBarBg             (grey background track)
│   └── TimerBarFill           (colored fill, scales X)
├── PatternHunterContainer
│   ├── cell_0 ... cell_15     (16 circles in 4x4 grid)
│   ├── FeedbackOverlay
│   └── OddHighlight
├── FlashSequenceContainer
│   ├── flash_cell_0 ... flash_cell_8  (9 squares in 3x3 grid)
│   ├── progressDot_0 ... progressDot_3 (4 dots)
│   ├── FeedbackOverlay
│   ├── CheckmarkIcon
│   └── CrossIcon
├── ColorChaosContainer
│   ├── StroopWord             (large text)
│   ├── colorBtn_0 ... colorBtn_2  (3 color buttons)
│   ├── roundIndicator_0 ... roundIndicator_2 (3 dots)
│   ├── FeedbackOverlay
│   └── FeedbackText
├── ResultsContainer
│   ├── ScoreText
│   ├── ReactiveMessageText
│   ├── Breakdown1Icon
│   ├── Breakdown2Icon
│   ├── Breakdown3Icon
│   └── CTAContainer
│       ├── BrandText          ("AXON BRAIN")
│       ├── SubtitleText       ("Train your brain...")
│       └── AppStoreText       ("Available on the App Store")
└── GameController             (empty object, script host)
```

---

## Shared Elements

### OverlayBackground
- **Type**: Image (rectangle)
- **Size**: Full screen (1.0 x 1.0 in screen units)
- **Position**: Center (0, 0)
- **Color**: `rgba(10, 10, 15, 0.6)` — semi-transparent near-black
- **Z-order**: Behind all game elements, in front of camera feed
- **Notes**: Opacity controlled by scripts (0.4 during countdown, 0.6 during games, 0.8 during results)

### HeaderText
- **Type**: Text
- **Position**: (0, +0.32) — top area, below safe zone
- **Font Size**: 28pt
- **Font Weight**: Bold
- **Color**: White, 80% opacity
- **Letter Spacing**: 0.12em (wide tracking)
- **Alignment**: Center
- **Text Transform**: Uppercase
- **Content**: Set by scripts ("FIND THE ODD ONE", "WATCH...", "TAP THE INK COLOR", etc.)

### TimerBar
- **Position**: (0, +0.27) — just below header text
- **Size**: 0.7 x 0.008 (70% screen width, thin bar)

#### TimerBarBg (background track)
- **Type**: Image (rectangle, rounded corners 4px)
- **Color**: `rgba(255, 255, 255, 0.1)`
- **Size**: Same as TimerBar

#### TimerBarFill (active fill)
- **Type**: Image (rectangle, rounded corners 4px)
- **Color**: `#00D4FF` (neon cyan) — changes to red near timeout
- **Size**: Same width as TimerBarBg
- **Pivot**: Left edge (0, 0.5) — so scaling X shrinks from right
- **Transform**: Scale X from 1.0 (full) to 0.0 (empty), controlled by scripts
- **Glow**: Add subtle outer glow (box shadow equivalent) via material

---

## Countdown Elements

### CountdownContainer
- **Position**: Center (0, 0)
- **Initially**: Disabled (hidden)

### CountdownText
- **Type**: Text
- **Position**: (0, +0.05) — slightly above center
- **Font Size**: 120pt
- **Font Weight**: Black (900)
- **Color**: Changes per number (see GameController.js)
- **Alignment**: Center
- **Text Shadow**: Glow effect via material (20px blur, same color at 50% opacity)
- **Content**: "3", "2", "1", "GO!"

---

## Pattern Hunter Elements

### PatternHunterContainer
- **Position**: Center (0, -0.02) — slightly below center to account for header
- **Initially**: Disabled (hidden)

### Cells (cell_0 through cell_15)
- **Type**: Image with **circle** texture/shape
- **Count**: 16 (arranged in 4x4 grid)
- **Individual Size**: 0.12 x 0.12 (12% of screen width — large, tappable)
- **Gap**: 0.025 between cells
- **Grid Layout** (positions relative to container center):

```
Row 0 (top):    cell_0  (-0.22, +0.22)   cell_1  (-0.07, +0.22)   cell_2  (+0.07, +0.22)   cell_3  (+0.22, +0.22)
Row 1:          cell_4  (-0.22, +0.07)   cell_5  (-0.07, +0.07)   cell_6  (+0.07, +0.07)   cell_7  (+0.22, +0.07)
Row 2:          cell_8  (-0.22, -0.07)   cell_9  (-0.07, -0.07)   cell_10 (+0.07, -0.07)   cell_11 (+0.22, -0.07)
Row 3 (bottom): cell_12 (-0.22, -0.22)   cell_13 (-0.07, -0.22)   cell_14 (+0.07, -0.22)   cell_15 (+0.22, -0.22)
```

- **Each cell needs**: Image component + TouchComponent (touch type: Tap)
- **Default Color**: Set by script (base color of current pair)
- **Corner Radius**: Maximum (fully circular)

### FeedbackOverlay (Pattern Hunter)
- **Type**: Image (rectangle)
- **Size**: 0.6 x 0.6 (covers the grid area)
- **Position**: Same as container center
- **Color**: Set by script (green or red, semi-transparent)
- **Initially**: Disabled

### OddHighlight
- **Type**: Image (circle, ring/outline only — use a donut texture or hollow circle)
- **Size**: 0.15 x 0.15 (slightly larger than cell)
- **Color**: `#FFD700` (gold)
- **Position**: Moved by script to match odd cell position
- **Initially**: Disabled

---

## Flash Sequence Elements

### FlashSequenceContainer
- **Position**: Center (0, -0.02)
- **Initially**: Disabled (hidden)

### Cells (flash_cell_0 through flash_cell_8)
- **Type**: Image (rounded rectangle, corner radius ~8px)
- **Count**: 9 (arranged in 3x3 grid)
- **Individual Size**: 0.15 x 0.15 (15% of screen — larger than Pattern Hunter since fewer cells)
- **Gap**: 0.03 between cells
- **Grid Layout** (positions relative to container center):

```
Row 0 (top):    flash_cell_0 (-0.18, +0.18)   flash_cell_1 (0, +0.18)   flash_cell_2 (+0.18, +0.18)
Row 1:          flash_cell_3 (-0.18, 0)        flash_cell_4 (0, 0)       flash_cell_5 (+0.18, 0)
Row 2 (bottom): flash_cell_6 (-0.18, -0.18)   flash_cell_7 (0, -0.18)   flash_cell_8 (+0.18, -0.18)
```

- **Each cell needs**: Image component + TouchComponent
- **Default Color**: Dark purple-grey `rgba(30, 25, 46, 0.8)`
- **Border**: 1px white at 15% opacity (via material or outline texture)

### Progress Dots (progressDot_0 through progressDot_3)
- **Type**: Image (circle)
- **Count**: 4 (one per sequence element)
- **Size**: 0.02 x 0.02 (small dots)
- **Gap**: 0.015 between dots
- **Position**: Centered row below grid at Y = -0.32
- **Layout**:

```
progressDot_0 (-0.05, -0.32)
progressDot_1 (-0.017, -0.32)
progressDot_2 (+0.017, -0.32)
progressDot_3 (+0.05, -0.32)
```

- **Default Color**: White at 20% opacity

### CheckmarkIcon
- **Type**: Text (using "✓" character) or Image with checkmark texture
- **Size**: 0.2 x 0.2
- **Position**: Center (0, 0)
- **Color**: `#00D959` (green)
- **Font Size**: 80pt (if Text)
- **Initially**: Disabled

### CrossIcon
- **Type**: Text (using "✗" character) or Image with X texture
- **Size**: 0.2 x 0.2
- **Position**: Center (0, 0)
- **Color**: `#FF3333` (red)
- **Font Size**: 80pt (if Text)
- **Initially**: Disabled

### FeedbackOverlay (Flash Sequence)
- **Type**: Image (rectangle)
- **Size**: 0.6 x 0.6
- **Position**: Container center
- **Initially**: Disabled

---

## Color Chaos Elements

### ColorChaosContainer
- **Position**: Center (0, 0)
- **Initially**: Disabled (hidden)

### StroopWord
- **Type**: Text
- **Position**: (0, +0.08) — upper center of game area
- **Font Size**: 72pt (very large — this is the star of the show)
- **Font Weight**: Black (900)
- **Alignment**: Center
- **Color**: Set dynamically by script (the INK color, not the word meaning)
- **Text Shadow**: Glow effect (same color, 30px blur, 40% opacity)

### Color Buttons (colorBtn_0, colorBtn_1, colorBtn_2)
- **Type**: Image (rounded rectangle, corner radius ~16px)
- **Count**: 3
- **Size**: 0.18 x 0.12 (wide rectangles — easy tap targets)
- **Gap**: 0.04 between buttons
- **Position**: Horizontal row near bottom

```
colorBtn_0 (-0.22, -0.18)
colorBtn_1 (0, -0.18)
colorBtn_2 (+0.22, -0.18)
```

- **Each needs**: Image component + TouchComponent
- **Color**: Set by script (solid fill of the color option)
- **Border**: 2px white at 30% opacity

### Round Indicators (roundIndicator_0, roundIndicator_1, roundIndicator_2)
- **Type**: Image (circle)
- **Count**: 3
- **Size**: 0.015 x 0.015 (tiny dots)
- **Position**: Centered row between word and buttons at Y = -0.06

```
roundIndicator_0 (-0.025, -0.06)
roundIndicator_1 (0, -0.06)
roundIndicator_2 (+0.025, -0.06)
```

- **Default Color**: White at 20% opacity

### FeedbackOverlay (Color Chaos)
- **Type**: Image (rectangle)
- **Size**: 0.7 x 0.5
- **Position**: Center
- **Initially**: Disabled

### FeedbackText
- **Type**: Text
- **Position**: (0, -0.02) — center
- **Font Size**: 40pt
- **Font Weight**: Black
- **Color**: Set by script ("NICE!" = green, "NOPE" = red)
- **Initially**: Disabled

---

## Transition Elements

### TransitionFlash
- **Type**: Image (rectangle)
- **Size**: Full screen (1.0 x 1.0)
- **Position**: Center (0, 0)
- **Color**: White
- **Z-order**: Above everything except results
- **Initially**: Disabled (alpha = 0)

### GameLabelText
- **Type**: Text
- **Position**: Center (0, 0)
- **Font Size**: 36pt
- **Font Weight**: Black
- **Color**: White
- **Letter Spacing**: 0.15em
- **Text Transform**: Uppercase
- **Initially**: Disabled

---

## Results Screen Elements

### ResultsContainer
- **Position**: Center (0, 0)
- **Initially**: Disabled (hidden)
- **Z-order**: Above all game elements

### ScoreText
- **Type**: Text
- **Position**: (0, +0.15) — upper area
- **Font Size**: 96pt
- **Font Weight**: Black (900)
- **Font Family**: Monospace
- **Color**: `#FFD700` (neon gold)
- **Text Shadow**: Gold glow (0 0 30px rgba(255, 215, 0, 0.5))
- **Alignment**: Center
- **Content**: Animated counter "0" → final score

### ReactiveMessageText
- **Type**: Text
- **Position**: (0, +0.05) — below score
- **Font Size**: 24pt
- **Font Weight**: Bold
- **Color**: Set by script (gold/cyan/white based on score tier)
- **Alignment**: Center
- **Letter Spacing**: 0.05em
- **Initially**: Alpha 0 (fades in)

### Breakdown Icons (Breakdown1Icon, Breakdown2Icon, Breakdown3Icon)
- **Type**: Text (checkmark or X character)
- **Size**: 0.06 x 0.06
- **Position**: Horizontal row at Y = -0.04

```
Breakdown1Icon (-0.08, -0.04)
Breakdown2Icon (0, -0.04)
Breakdown3Icon (+0.08, -0.04)
```

- **Font Size**: 28pt
- **Color**: Set by script (green ✓ or red ✗)
- **Initially**: Disabled

### CTAContainer
- **Position**: (0, -0.18) — lower portion of screen
- **Initially**: Disabled (fades in late)

### BrandText
- **Type**: Text
- **Position**: (0, -0.14) relative to screen center
- **Font Size**: 36pt
- **Font Weight**: Black
- **Color**: Gradient cyan → magenta (if Effect House supports text gradients; otherwise use cyan `#00D4FF`)
- **Letter Spacing**: 0.1em
- **Text**: "AXON BRAIN"

### SubtitleText
- **Type**: Text
- **Position**: (0, -0.20)
- **Font Size**: 14pt
- **Font Weight**: Medium
- **Color**: White at 60% opacity
- **Text**: "Train your brain with 10+ challenges"

### AppStoreText
- **Type**: Text
- **Position**: (0, -0.25)
- **Font Size**: 12pt
- **Font Weight**: Bold
- **Color**: White at 80% opacity
- **Text Transform**: Uppercase
- **Letter Spacing**: 0.08em
- **Text**: "AVAILABLE ON THE APP STORE"

---

## Materials & Visual Effects

### Glow Effect (for text)
Effect House doesn't have CSS-style text shadows. To create glow:
1. Duplicate the text object
2. Place the duplicate behind the original
3. Scale it up 1.05x
4. Set its color to same hue but lower opacity (30-50%)
5. Apply a Gaussian blur material to the duplicate

### Cell Border Effect
For bordered cells (Flash Sequence):
1. Create a slightly larger rectangle behind each cell
2. Color it white at 15% opacity
3. The cell sits on top, creating a border appearance

### Circle Shape
For Pattern Hunter cells:
1. Use a circular image texture (white circle on transparent background)
2. Tint via `mainPass.baseColor`

---

## Touch Regions

All tappable elements must have:
- **TouchComponent** attached
- Minimum touch area: 80x80pt (0.1 x 0.1 in screen units)
- Touch type: `TouchTypeTap` (single tap only)
- No overlap between adjacent touch regions

For Pattern Hunter cells (0.12 size, 0.025 gap): touch regions don't overlap.
For Flash Sequence cells (0.15 size, 0.03 gap): touch regions don't overlap.
For Color Chaos buttons (0.18 width, 0.04 gap): touch regions don't overlap.

---

## Safe Areas

- **Top 12%** of screen: Reserved for TikTok UI (username, follow button)
- **Bottom 10%** of screen: Reserved for TikTok UI (like, comment, share buttons)
- All interactive elements must be within Y range -0.35 to +0.35
- Brand CTA can extend to Y = -0.38 (non-interactive, just text)
