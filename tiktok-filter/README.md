# AXON Brain — TikTok Filter

A promotional TikTok filter that gives users a 30-second brain challenge featuring 3 mini-games from the full AXON Brain app.

## Quick Start

### Prerequisites
- [Effect House](https://effecthouse.tiktok.com/) (TikTok's AR/effect creation tool)
- Basic familiarity with Effect House's visual editor

### Setup Steps

1. **Create a new project** in Effect House (choose "Blank" template)

2. **Set up the camera**
   - The default camera captures the user's face — keep it
   - Add an **Orthographic Camera** for the UI overlay
   - Set the Orthographic Camera's render target to **Screen Region** (full screen)

3. **Build the scene hierarchy**
   - Follow `ui-layout.md` to create all SceneObjects
   - Use the exact naming convention (e.g., `cell_0`, `flash_cell_3`, `colorBtn_1`)
   - Parent objects correctly (all cells under their game container, etc.)

4. **Add visual components**
   - Add **Image** components to all cells, buttons, overlays, and dots
   - Add **Text** components to all text objects
   - Set up circle textures for Pattern Hunter cells and dots
   - Set up rounded rectangle textures for Flash Sequence cells and Color Chaos buttons
   - Add **TouchComponent** to all tappable elements (cells and buttons)

5. **Attach scripts**

   | Script | Attach To | Inspector Bindings |
   |--------|-----------|-------------------|
   | `GameController.js` | GameController (empty object) | Bind all `@input` references — countdown, transitions, results, game containers |
   | `PatternHunter.js` | PatternHunterContainer | Bind `cells[]` (16 cells), `feedbackOverlay`, `oddHighlight` |
   | `FlashSequence.js` | FlashSequenceContainer | Bind `cells[]` (9 cells), `progressDots[]` (4 dots), `feedbackOverlay`, `checkmarkIcon`, `crossIcon` |
   | `ColorChaos.js` | ColorChaosContainer | Bind `stroopWord`, `colorButtons[]` (3 buttons), `roundIndicators[]` (3 dots), `feedbackOverlay`, `feedbackText` |

6. **Configure touch components**
   - Each tappable cell/button must have a `TouchComponent`
   - Set touch type to **Tap**
   - Ensure touch regions don't overlap (follow sizes in `ui-layout.md`)

7. **Test in Effect House**
   - Use the Preview panel to test on your device
   - Watch the full 30-second cycle: countdown → 3 games → results
   - Verify tap detection works on all buttons

8. **Publish**
   - Submit through Effect House's publish flow
   - Add tags: `braintraining`, `puzzle`, `challenge`, `IQ`, `memory`
   - Set effect name to "AXON Brain Challenge"

---

## File Structure

```
tiktok-filter/
├── tiktok-filter-design.md     — Full design document (game selection rationale,
│                                  timeline, scoring, visual language)
├── scripts/
│   ├── GameController.js       — Main orchestrator: countdown, transitions,
│   │                             scoring, results screen
│   ├── PatternHunter.js        — Game 1: Find the odd colored circle in 4x4 grid
│   ├── FlashSequence.js        — Game 2: Watch 4-cell sequence, tap it back
│   └── ColorChaos.js           — Game 3: Stroop test — tap the ink color,
│                                 not the word (3 rounds)
├── ui-layout.md                — Complete visual specification: every element's
│                                 position, size, color, and component requirements
└── README.md                   — This file
```

---

## How It Works

### Flow
```
[Countdown 3-2-1-GO] → [Pattern Hunter] → [Flash Sequence] → [Color Chaos] → [Results]
     3 seconds             7 seconds          7 seconds          6 seconds       ~6 seconds
```

### Scoring
| Game | Max Points | Mechanic |
|------|-----------|----------|
| Pattern Hunter | 100 | Find 1 odd circle in 4x4 grid |
| Flash Sequence | 150 | Replay 4-cell sequence from memory |
| Color Chaos | 225 (75 x 3) | 3 rounds of Stroop color naming |
| **Total Max** | **475** | |

### Results Messages
| Score Range | Message |
|-------------|---------|
| 275-475 | "You're a GENIUS!" (gold text) |
| 150-274 | "Not bad... can you do better?" (cyan text) |
| 0-149 | "Think you can beat this?" (white text) |

### Architecture
- **GameController.js** owns the state machine and global score
- Each mini-game script registers a `start` function on `global.AxonFilter`
- GameController calls the start function when it's time for that game
- Mini-games call `global.AxonFilter.onGameComplete(points, passed)` when done
- GameController advances to the next game or results screen

---

## Customization

### Swapping Mini-Games
The modular architecture makes it easy to swap games:

1. Create a new `MiniGameX.js` following the same pattern:
   - Register `global.AxonFilter.startMiniGameX = function() { ... }`
   - Call `global.AxonFilter.onGameComplete(points, passed)` when done
   - Use shared utilities: `setHeaderText()`, `updateTimerBar()`

2. In `GameController.js`:
   - Update `GAME_LABELS` array
   - Update `startGame()` switch statement
   - Add/bind the new container in Inspector

### Adjusting Difficulty
- **Pattern Hunter**: Change `COLOR_PAIRS` hue offsets (closer = harder)
- **Flash Sequence**: Change `SEQUENCE_LENGTH` (4 is default, 3 = easier, 5 = harder)
- **Color Chaos**: Change `ROUND_DURATION` (2s default, 1.5s = harder, 3s = easier)

### Adjusting Timing
All durations are constants at the top of each script:
- `GAME_1_DURATION`, `GAME_2_DURATION`, `GAME_3_DURATION` in GameController.js
- `GAME_DURATION` in PatternHunter.js
- `PLAY_TIMEOUT` in FlashSequence.js
- `ROUND_DURATION` in ColorChaos.js

---

## Effect House API Reference

Key APIs used in these scripts:

| API | Usage |
|-----|-------|
| `script.createEvent('UpdateEvent')` | Per-frame update loop |
| `script.createEvent('TurnOnEvent')` | Initialization |
| `script.createEvent('DelayedCallbackEvent')` | One-shot delayed callback |
| `obj.getComponent('Component.Image')` | Access Image for color/opacity |
| `obj.getComponent('Component.Text')` | Access Text for content/color |
| `obj.getComponent('Component.TouchComponent')` | Access touch input |
| `obj.getTransform().setLocalScale(vec3)` | Scale animations |
| `obj.getTransform().setLocalPosition(vec3)` | Position animations |
| `obj.enabled = true/false` | Show/hide objects |
| `img.mainPass.baseColor = vec4` | Set color of Image |
| `txt.textFill.color = vec4` | Set color of Text |
| `touchComp.onTouchStart.add(callback)` | Handle tap input |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Taps not registering | Ensure TouchComponent is added AND touch regions don't overlap |
| Elements invisible | Check `obj.enabled` is true AND alpha > 0 AND z-order is correct |
| Animations jittery | Effect House runs at 30fps — keep concurrent animations under 3 |
| Text not showing | Verify Text component exists AND text string is not empty |
| Score shows NaN | Check that `global.AxonFilter.score` is initialized to 0 |
| Games not starting | Verify start functions are registered before GameController calls them |
