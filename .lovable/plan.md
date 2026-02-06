
# HUD Optimization & Difficulty Scaling Plan

## Overview
This plan addresses HUD layout/animation issues and ensures math difficulty scales properly for Advanced (Tier 4) and God Mode (Tier 5). We'll optimize the upper section for Dynamic Island compatibility and enhance the streak fire animation.

---

## 1. HUD Layout Restructure

### Problem
- Upper HUD section is positioned too high and shifted right
- Level badge is on the left with X button (cluttered)
- Doesn't account for Dynamic Island/notch on latest iPhones
- Screenshot shows content overlapping the notch area

### Solution
Restructure the HUD with proper spacing and element positioning:

```text
┌──────────────────────────────────────┐
│          (Dynamic Island)            │  ← Safe area padding
├──────────────────────────────────────┤
│  [X]                         [LVL 3] │  ← X left, Level right
│                                      │
│              ⚡ 1,250                 │  ← Hero metric (centered)
│               2:45                   │  ← Timer (centered below)
│                                      │
│   🏆 Best: 890      🔥 12 streak    │  ← Secondary metrics row
├──────────────────────────────────────┤
│                                      │
│           [GAME AREA]                │
│                                      │
└──────────────────────────────────────┘
```

### Changes to `MixedGameScreen.tsx`
- Add extra top padding (`pt-8`) to the HUD container to push content below Dynamic Island
- Move Level badge from left side (next to X) to right corner
- Center the hero metric section properly
- Add a secondary metrics row below the hero for streak fire and best score
- Improve spacing with `gap-4` between rows

---

## 2. Streak Fire Animation Enhancement

### Problem
Current streak fire is small and lacks visual impact

### Solution
Create a more dynamic, animated streak fire display:

- **Pulsating flame**: Scale animation between 1.0 and 1.3
- **Floating effect**: Subtle Y-axis movement (bounce)
- **Glow intensification**: Radial gradient glow that pulses with the flame
- **Particle sparks**: Small spark particles when streak > 10
- **Color gradient**: Orange to red gradient that shifts based on streak count

### Animation Parameters
```text
Base Streak (1-5):   Small flame, subtle pulse
Medium Streak (6-15): Larger flame, visible glow
High Streak (16+):   Maximum size, intense glow, spark particles
```

---

## 3. Math Difficulty Scaling

### Problem
- God Mode (Tier 5) questions are too easy
- Elite (Tier 4) needs more challenge
- Questions should be solvable in 2-3 seconds but feel advanced

### Solution - Changes to `useGameEngine.ts`

#### Tier 4 "Elite" Enhancements
Current: Simple algebra, squares up to 20, large multiplication

Add:
- **Percentages**: "25% of 80" → 20
- **Larger algebra**: "3x + 12 = 27" → x = 5
- **Cubes of small numbers**: "3³" → 27
- **Division with remainders hint**: "23 ÷ 5 = ?" (options include 4)

#### Tier 5 "God Mode" Enhancements
Current: Square roots, multi-step operations, complex algebra

Add:
- **Simple logarithms**: "log₁₀(100)" → 2, "log₁₀(1000)" → 3
- **Factorials**: "4!" → 24, "5!" → 120
- **Simple modular arithmetic**: "17 mod 5" → 2
- **Percentage of percentage**: "50% of 50% of 200" → 50
- **Negative number operations**: "(-3) × 4" → -12
- **Power combinations**: "2⁴ + 2³" → 24

### Question Distribution (God Mode)
```text
- 20% Square roots (√64, √121)
- 20% Simple logarithms (log₁₀)
- 15% Factorials (3!, 4!, 5!)
- 15% Modular arithmetic (mod 3, mod 5)
- 15% Multi-step operations
- 15% Advanced algebra
```

### Answer Generation
For new question types, generate plausible wrong answers:
- Factorials: ±6, ±12 variance
- Logarithms: ±1, ±2 variance
- Mod: 0 to divisor-1 range

---

## 4. Game Verification Checklist

### Difficulty Application to Endless Mode
The current implementation correctly applies difficulty scaling to Endless mode via:
- `getDifficultyTier()` function uses `mode === 'endless' ? 1.5 : 1` multiplier
- All games receive `tier` prop from `MixedGameScreen`
- `generateMathQuestion(streak, mode)` passes both parameters

### Individual Game Status

| Game | Tier Scaling | Status |
|------|-------------|--------|
| SpeedMath | ✅ Uses generateMathQuestion with tier | Working |
| ParadoxFlow | ✅ Has getParadoxTier with mode multiplier | Working |
| SuitDeception | ✅ Grid scales 3x3 → 5x5 based on tier | Working |
| ChimpMemory | ✅ Number count 4→8 based on tier | Working |
| OperatorChaos | ✅ Operator count scales with tier | Working |

---

## Technical Implementation

### Files to Modify

1. **`src/components/MixedGameScreen.tsx`**
   - Restructure HUD layout (lines 589-746)
   - Add top padding for Dynamic Island safety
   - Move Level badge to right side
   - Create centered hero section
   - Add enhanced streak fire component
   - Add secondary metrics row

2. **`src/hooks/useGameEngine.ts`**
   - Enhance Tier 4 question generation (lines 174-196)
   - Add new God Mode question types (lines 197-221)
   - Add helper functions for new math types
   - Update option generation for new question types

### New Math Question Types Code Structure
```text
Tier 4 additions:
├── Percentages: x% of y (10%, 25%, 50%, 75%)
├── Larger squares: 13², 14², 15²
└── Simple cubes: 2³, 3³, 4³

Tier 5 additions:
├── log₁₀(10, 100, 1000, 10000)
├── Factorials: 3!, 4!, 5!, 6!
├── Modular: x mod 3, x mod 5, x mod 7
└── Power sums: 2ⁿ + 2ᵐ combinations
```

---

## Summary

This plan addresses:
1. HUD repositioned to avoid Dynamic Island interference
2. Level badge moved to aesthetically opposite corner from X
3. Enhanced streak fire with pulsing glow and spark effects
4. Tier 4 math with percentages, cubes, and harder algebra
5. Tier 5 "God Mode" with logarithms, factorials, and modular arithmetic
6. Verification that all games properly scale difficulty in Endless mode
