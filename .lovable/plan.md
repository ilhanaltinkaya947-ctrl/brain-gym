
# AXON: Elite Brain Training Platform Overhaul

## Overview

Transform AXON from a simple quiz app into an adaptive, high-cognitive-load brain training platform with 5 elite mini-games and real-time difficulty adjustment based on user performance.

---

## Part 1: Architecture Changes

### New Core Files

```text
src/
├── hooks/
│   ├── useAdaptiveEngine.ts      (NEW - Adaptive difficulty algorithm)
│   └── useGameGenerator.ts       (NEW - Procedural question generation)
├── components/
│   ├── games/
│   │   ├── FlashMemory.tsx       (REFACTOR - Already exists, enhance)
│   │   ├── NBackGhost.tsx        (NEW - N-Back with runes)
│   │   ├── OperatorChaos.tsx     (NEW - Missing operators)
│   │   ├── SpatialStack.tsx      (NEW - 3D cube counting)
│   │   └── ParadoxFlow.tsx       (NEW - Follow/Avoid arrows)
│   └── HeatBackground.tsx        (NEW - Reactive background)
└── types/
    └── game.ts                   (UPDATE - New game types)
```

---

## Part 2: The 5 Elite Mini-Games

### Game 1: Flash Memory (Existing - Enhanced)
- **Current**: 3x3 grid, numbers shown then hidden
- **Enhancement**: 
  - Grid scales from 3x3 to 4x4 to 5x5 based on adaptive difficulty
  - Number count increases: 3 → 4 → 5 → 6 → 7
  - Show time decreases: 1000ms → 800ms → 600ms → 400ms
- **Theme**: Deep Purple (`hsl(280, 70%, 50%)`)

### Game 2: N-Back Ghost (NEW)
- **Mechanic**: Symbols appear one-by-one in center
- **Input**: Two buttons - "MATCH" / "NO MATCH"
- **Rule**: Press MATCH if current symbol === symbol from 2 steps ago
- **Symbols**: Mystical runes (ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ)
- **Progression**: Start 2-back, adaptive can increase to 3-back
- **Theme**: Ethereal Teal (`hsl(180, 60%, 45%)`)

### Game 3: Operator Chaos (NEW)
- **Mechanic**: Equations with missing operators
- **Easy**: `6 [?] 2 = 3` → Select `÷`
- **Hard**: `4 [?] 2 [?] 1 = 9` → Select `×` then `+`
- **Input**: Four operator buttons (+, −, ×, ÷)
- **Theme**: Electric Gold (`hsl(45, 90%, 55%)`)

### Game 4: Spatial Stack (NEW)
- **Mechanic**: Isometric 3D cube stack rendered on canvas
- **Goal**: Count ALL cubes including hidden support cubes
- **Input**: Numpad (1-9) or tap number buttons
- **Difficulty**: 3 cubes → 6 cubes → 10 cubes
- **Theme**: Matrix Green (`hsl(140, 70%, 45%)`)

### Game 5: Paradox Flow (Replaces DirectionLogic)
- **Mechanic**: Large arrow pointing in cardinal direction
- **Instruction**: "FOLLOW" (green) or "AVOID" (red)
- **FOLLOW**: Swipe arrow's direction
- **AVOID**: Swipe ANY direction except arrow's
- **Input**: Swipe or arrow keys
- **Theme**: Warning Orange (`hsl(25, 90%, 55%)`)

---

## Part 3: Adaptive Flow Algorithm

### New Hook: `useAdaptiveEngine.ts`

```text
State:
├── gameSpeed: number (starts at 1.0)
├── phase: 'warmup' | 'ramping' | 'overdrive'
├── lastResponseTimes: number[] (rolling window of 5)
└── difficulty: number (1-10 scale)

Speed Adjustment Logic:
├── If responseTime < 30% of allowed → gameSpeed += 0.05
├── If responseTime > 80% of allowed → gameSpeed -= 0.05
├── On wrong answer → gameSpeed *= 0.9 (10% drop)
└── Clamp: 0.5 ≤ gameSpeed ≤ 2.5

Time Calculation:
└── allowedTime = baseTime / gameSpeed

Phase Transitions:
├── warmup: gameSpeed < 1.2
├── ramping: 1.2 ≤ gameSpeed < 1.5
└── overdrive: gameSpeed ≥ 1.5
```

### Difficulty Scaling Per Game

| Game | Warmup | Ramping | Overdrive |
|------|--------|---------|-----------|
| Flash Memory | 3 numbers, 1000ms | 4-5 numbers, 800ms | 6-7 numbers, 600ms |
| N-Back | 2-back, simple runes | 2-back, more runes | 3-back |
| Operator Chaos | 1 operator | 1-2 operators | 2 operators |
| Spatial Stack | 3-4 cubes | 5-6 cubes | 7-10 cubes |
| Paradox Flow | 70% FOLLOW | 50% FOLLOW | 30% FOLLOW |

---

## Part 4: Heat System (Visual Feedback)

### New Component: `HeatBackground.tsx`

Replaces `NeuralBackground.tsx` with dynamic color based on `gameSpeed`:

```text
Color Interpolation:
├── Cold (gameSpeed < 1.0):
│   └── Deep Teal → Cyan → Black
│   └── Node color: #00CED1
│
├── Warm (1.0 ≤ gameSpeed < 1.5):
│   └── Purple → Magenta → Neon Pink
│   └── Node color: #FF00FF
│
└── Overdrive (gameSpeed ≥ 1.5):
    └── Burning Gold → Bright Orange → White Hot
    └── Node color: #FF6A00 → #FFD700

Transition: CSS transition 0.5s ease for smooth color shifts
```

### Audio Enhancements

- Keep pentatonic scale (faster = higher notes)
- In Overdrive: Add heartbeat bass that matches tempo
- Heartbeat interval: `1000 / gameSpeed` milliseconds

---

## Part 5: Endless Mode Fix

### Current Problem
The endless mode is NOT endless - it's limited to 10 questions.

### Solution
- Remove any question limits
- Questions are procedurally generated infinitely
- No repeated questions (each generator uses randomization)
- Game continues until user makes a mistake
- Track: streak count, peak gameSpeed reached, total time played

### State Changes in `MixedGameScreen.tsx`

```text
Remove:
└── Any hardcoded question limits

Add:
├── questionsAnswered: number (counter for stats)
├── peakGameSpeed: number (highest speed reached)
└── sessionDuration: number (for result screen)
```

---

## Part 6: Implementation Phases

### Phase 1: Core Adaptive Engine
1. Create `useAdaptiveEngine.ts` hook
2. Implement gameSpeed calculation
3. Add phase detection logic
4. Integrate with existing game loop

### Phase 2: New Mini-Games
1. Create `NBackGhost.tsx` - rune matching
2. Create `OperatorChaos.tsx` - equation solving
3. Create `SpatialStack.tsx` - cube counting
4. Update `DirectionLogic.tsx` → `ParadoxFlow.tsx`
5. Enhance `FlashMemory.tsx` with adaptive scaling

### Phase 3: Heat System
1. Create `HeatBackground.tsx` with gameSpeed prop
2. Implement color interpolation
3. Add overdrive heartbeat audio
4. Update CSS variables for theme colors

### Phase 4: Integration
1. Update `MixedGameScreen.tsx` to use adaptive engine
2. Connect gameSpeed to all mini-games
3. Pass gameSpeed to HeatBackground
4. Update result screen with new stats

### Phase 5: Endless Mode Fix
1. Remove question limits
2. Add infinite procedural generation
3. Track new metrics
4. Update result screen display

---

## Technical Details

### Question Generation (Infinite, No Repeats)

Each game uses procedural generation with sufficient randomization:

- **Flash Memory**: Random positions from n!/k! combinations
- **N-Back**: Sequence from 8 runes = ~16M possible 10-step sequences
- **Operator Chaos**: Random numbers + operators = millions of combinations
- **Spatial Stack**: Random cube arrangements = thousands of configurations
- **Paradox Flow**: 4 directions × 2 modes = 8 base states, randomized

### Performance Considerations

- Use `useMemo` for expensive calculations
- Debounce speed updates (update every 3 answers, not every answer)
- Canvas-based rendering for SpatialStack (isometric cubes)
- RequestAnimationFrame for HeatBackground transitions

### Files to Create
1. `src/hooks/useAdaptiveEngine.ts`
2. `src/components/games/NBackGhost.tsx`
3. `src/components/games/OperatorChaos.tsx`
4. `src/components/games/SpatialStack.tsx`
5. `src/components/games/ParadoxFlow.tsx`
6. `src/components/HeatBackground.tsx`

### Files to Modify
1. `src/types/game.ts` - Add new game types
2. `src/components/FlashMemory.tsx` - Adaptive scaling
3. `src/components/MixedGameScreen.tsx` - Integrate adaptive engine
4. `src/hooks/useSounds.ts` - Add overdrive heartbeat
5. `src/pages/Index.tsx` - Update game config options
6. `src/components/GameConfigPanel.tsx` - New game toggles
