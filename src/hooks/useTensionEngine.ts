import { useState, useCallback, useRef } from 'react';
import { MiniGameType } from '../types/game';

// Cognitive domains — each game is tagged with one
export type CognitiveDomain = 'math' | 'memory' | 'spatial' | 'linguistic' | 'reaction' | 'logic' | 'perception';

export interface GameTensionProfile {
  primaryDomain: CognitiveDomain;
  generationWeight: number;     // G: how much tension this game produces (0-1)
  susceptibilityWeight: number; // S: how much tension amplifies this game (0-1)
}

// Tension profiles for all 11 games
export const GAME_TENSION_PROFILES: Record<MiniGameType, GameTensionProfile> = {
  speedMath:      { primaryDomain: 'math',       generationWeight: 1.0, susceptibilityWeight: 0.6 },
  operatorChaos:  { primaryDomain: 'math',       generationWeight: 0.8, susceptibilityWeight: 0.7 },
  colorMatch:     { primaryDomain: 'reaction',   generationWeight: 0.7, susceptibilityWeight: 0.8 },
  paradoxFlow:    { primaryDomain: 'logic',       generationWeight: 0.9, susceptibilityWeight: 0.9 },
  suitDeception:  { primaryDomain: 'perception', generationWeight: 0.6, susceptibilityWeight: 0.7 },
  patternHunter:  { primaryDomain: 'perception', generationWeight: 0.5, susceptibilityWeight: 0.8 },
  chimpMemory:    { primaryDomain: 'memory',     generationWeight: 0.7, susceptibilityWeight: 1.0 },
  flashMemory:    { primaryDomain: 'memory',     generationWeight: 0.8, susceptibilityWeight: 0.9 },
  wordConnect:    { primaryDomain: 'linguistic', generationWeight: 0.6, susceptibilityWeight: 0.7 },
  spatialStack:   { primaryDomain: 'spatial',    generationWeight: 0.7, susceptibilityWeight: 0.8 },
};

// Constants
const TENSION_FLOOR = 0.1;
const TENSION_CEILING = 3.0;
const TENSION_GAIN_RATE = 0.15;
const TENSION_DECAY_ON_ERROR = 0.7;
const TENSION_DECAY_AGGRESSIVE = 0.5;
const IDLE_DECAY_RATE = 0.10;
const OVERCLOCK_SCALE = 0.25;
const OVERCLOCK_MAX = 2.0;
const TENSION_BONUS_SCALE = 0.2;

// Tier → complexity multiplier
const TIER_MULT: Record<number, number> = {
  1: 0.10,
  2: 0.20,
  3: 0.35,
  4: 0.50,
  5: 0.70,
};

export interface TensionState {
  tension: number;
  overclockFactor: number;
  peakTension: number;
  tensionHistory: number[];
  consecutiveWrong: number;
  lastDomain: CognitiveDomain | null;
  currentGame: MiniGameType | null;
}

const initialState: TensionState = {
  tension: TENSION_FLOOR,
  overclockFactor: 1.0,
  peakTension: TENSION_FLOOR,
  tensionHistory: [],
  consecutiveWrong: 0,
  lastDomain: null,
  currentGame: null,
};

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function useTensionEngine() {
  const [state, setState] = useState<TensionState>(initialState);
  const lastSwitchTime = useRef<number>(Date.now());

  const processCorrectAnswer = useCallback((
    gameType: MiniGameType,
    tier: number,
    speedBonus: number
  ) => {
    setState(prev => {
      const profile = GAME_TENSION_PROFILES[gameType];
      const tierMult = TIER_MULT[tier] ?? 0.1;
      const complexityScore = tierMult * clamp(speedBonus, 0.5, 2.0) * profile.generationWeight;
      const newTension = clamp(
        prev.tension + complexityScore * TENSION_GAIN_RATE,
        TENSION_FLOOR,
        TENSION_CEILING
      );
      const newPeak = Math.max(prev.peakTension, newTension);
      const newHistory = [...prev.tensionHistory.slice(-99), newTension];

      return {
        ...prev,
        tension: newTension,
        peakTension: newPeak,
        tensionHistory: newHistory,
        consecutiveWrong: 0,
      };
    });
  }, []);

  const processWrongAnswer = useCallback(() => {
    setState(prev => {
      let newTension: number;
      const newConsecutive = prev.consecutiveWrong + 1;

      if (newConsecutive >= 3) {
        // Full reset — anti-frustration
        newTension = TENSION_FLOOR;
      } else if (newConsecutive >= 2) {
        // Aggressive halving
        newTension = Math.max(TENSION_FLOOR, prev.tension * TENSION_DECAY_AGGRESSIVE);
      } else {
        // Standard 30% drop
        newTension = Math.max(TENSION_FLOOR, prev.tension * TENSION_DECAY_ON_ERROR);
      }

      const newHistory = [...prev.tensionHistory.slice(-99), newTension];

      return {
        ...prev,
        tension: newTension,
        tensionHistory: newHistory,
        consecutiveWrong: newConsecutive,
        // Recalculate overclock with new tension
        overclockFactor: prev.currentGame
          ? calcOverclock(newTension, prev.lastDomain, prev.currentGame)
          : 1.0,
      };
    });
  }, []);

  const switchToGame = useCallback((gameType: MiniGameType) => {
    const now = Date.now();

    setState(prev => {
      // Apply idle decay based on time since last switch
      const deltaSeconds = (now - lastSwitchTime.current) / 1000;
      const decayedTension = Math.max(
        TENSION_FLOOR,
        prev.tension * (1 - IDLE_DECAY_RATE * deltaSeconds)
      );

      const newOverclock = calcOverclock(decayedTension, prev.lastDomain, gameType);
      const prevDomain = prev.currentGame
        ? GAME_TENSION_PROFILES[prev.currentGame].primaryDomain
        : null;

      return {
        ...prev,
        tension: decayedTension,
        overclockFactor: newOverclock,
        lastDomain: prevDomain,
        currentGame: gameType,
      };
    });

    lastSwitchTime.current = now;
  }, []);

  const getOverclockForGame = useCallback((gameType: MiniGameType): number => {
    return calcOverclock(state.tension, state.lastDomain, gameType);
  }, [state.tension, state.lastDomain]);

  // Tension bonus for scoring: 1.0 to 1.6x
  const getTensionBonus = useCallback((): number => {
    return 1.0 + state.tension * TENSION_BONUS_SCALE;
  }, [state.tension]);

  const reset = useCallback(() => {
    setState(initialState);
    lastSwitchTime.current = Date.now();
  }, []);

  return {
    state,
    processCorrectAnswer,
    processWrongAnswer,
    switchToGame,
    getOverclockForGame,
    getTensionBonus,
    reset,
  };
}

// Pure function: calculate overclock factor for a game given current tension
function calcOverclock(
  tension: number,
  lastDomain: CognitiveDomain | null,
  gameType: MiniGameType
): number {
  const profile = GAME_TENSION_PROFILES[gameType];
  const currentDomain = profile.primaryDomain;

  // Cross-domain switch = full overclock transfer, same domain = partial
  const domainDiff = (lastDomain !== null && lastDomain !== currentDomain) ? 1.0 : 0.3;

  return clamp(
    1.0 + tension * profile.susceptibilityWeight * domainDiff * OVERCLOCK_SCALE,
    1.0,
    OVERCLOCK_MAX
  );
}

// Utility: weighted random selection for smart game rotation
export function selectNextGameWeighted(
  currentGame: MiniGameType,
  availableGames: MiniGameType[]
): MiniGameType {
  const currentDomain = GAME_TENSION_PROFILES[currentGame].primaryDomain;
  const candidates = availableGames.filter(g => g !== currentGame);

  if (candidates.length === 0) return currentGame;

  // Cross-domain games are 2x more likely (balanced for more variety)
  const weights = candidates.map(g => {
    const domain = GAME_TENSION_PROFILES[g].primaryDomain;
    return domain !== currentDomain ? 2 : 1;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < candidates.length; i++) {
    random -= weights[i];
    if (random <= 0) return candidates[i];
  }

  return candidates[candidates.length - 1];
}
