import { useState, useCallback, useRef, useMemo } from 'react';

export type AdaptivePhase = 'warmup' | 'ramping' | 'overdrive';

export interface AdaptiveState {
  gameSpeed: number;
  phase: AdaptivePhase;
  difficulty: number;
  questionsAnswered: number;
  peakGameSpeed: number;
  sessionStartTime: number;
}

interface AdaptiveConfig {
  minSpeed: number;
  maxSpeed: number;
  speedUpThreshold: number; // Answer faster than this % of allowed time = speed up
  slowDownThreshold: number; // Answer slower than this % = slow down
  speedIncrement: number;
  speedDecrement: number;
  errorPenalty: number; // Multiply speed by this on error
}

// Per-game base times (ms) — each game gets its own thinking time budget
const GAME_BASE_TIMES: Record<string, number> = {
  speedMath: 10000,      // Mental math needs thinking time
  colorMatch: 5000,      // Reaction-based, should be snappy
  flashMemory: 12000,    // Memorization phase included
  paradoxFlow: 7000,     // Logic processing
  patternHunter: 8000,   // Visual scanning
  operatorChaos: 10000,  // Multi-step math
  spatialStack: 9000,    // Spatial reasoning
  wordConnect: 8000,     // Word association
  suitDeception: 5000,   // Quick recognition
  chimpMemory: 10000,    // Memory recall
};

const DEFAULT_FALLBACK_BASE_TIME = 8000;

const DEFAULT_CONFIG: AdaptiveConfig = {
  minSpeed: 0.4,
  maxSpeed: 2.2,
  speedUpThreshold: 0.25, // 25% of allowed time
  slowDownThreshold: 0.75, // 75% of allowed time
  speedIncrement: 0.06,
  speedDecrement: 0.06,
  errorPenalty: 0.92, // Gentler penalty
};

export const useAdaptiveEngine = (config: Partial<AdaptiveConfig> = {}) => {
  const settings = { ...DEFAULT_CONFIG, ...config };

  const [state, setState] = useState<AdaptiveState>({
    gameSpeed: 1.0,
    phase: 'warmup',
    difficulty: 1,
    questionsAnswered: 0,
    peakGameSpeed: 1.0,
    sessionStartTime: Date.now(),
  });

  const responseTimesRef = useRef<number[]>([]);
  const answerCountRef = useRef(0);
  const currentGameTypeRef = useRef<string>('speedMath');

  // Get base time for current game type
  const getBaseTime = useCallback(() => {
    return GAME_BASE_TIMES[currentGameTypeRef.current] ?? DEFAULT_FALLBACK_BASE_TIME;
  }, []);

  // Set current game type (called by MixedGameScreen on game switch)
  const setCurrentGameType = useCallback((gameType: string) => {
    currentGameTypeRef.current = gameType;
  }, []);

  // Calculate allowed time based on current speed and game type
  const allowedTime = useMemo(() => {
    const baseTime = GAME_BASE_TIMES[currentGameTypeRef.current] ?? DEFAULT_FALLBACK_BASE_TIME;
    return Math.floor(baseTime / state.gameSpeed);
  }, [state.gameSpeed]);

  // Determine phase based on game speed
  const getPhase = useCallback((speed: number): AdaptivePhase => {
    if (speed < 1.2) return 'warmup';
    if (speed < 1.5) return 'ramping';
    return 'overdrive';
  }, []);

  // Get difficulty level (1-10) based on speed and phase
  const getDifficulty = useCallback((speed: number, phase: AdaptivePhase): number => {
    const baseLevel = Math.floor(speed * 4); // 1.0 = 4, 2.0 = 8, 2.5 = 10
    const phaseBonus = phase === 'overdrive' ? 2 : phase === 'ramping' ? 1 : 0;
    return Math.min(10, Math.max(1, baseLevel + phaseBonus));
  }, []);

  // Process answer and adjust speed
  const processAnswer = useCallback((isCorrect: boolean, responseTimeMs: number) => {
    answerCountRef.current += 1;

    setState(prev => {
      let newSpeed = prev.gameSpeed;
      const currentBaseTime = getBaseTime();
      const currentAllowedTime = currentBaseTime / prev.gameSpeed;

      if (!isCorrect) {
        // Wrong answer: penalize speed and drop back
        newSpeed = Math.max(settings.minSpeed, prev.gameSpeed * settings.errorPenalty);
      } else {
        // Track response time
        responseTimesRef.current.push(responseTimeMs);
        if (responseTimesRef.current.length > 5) {
          responseTimesRef.current.shift();
        }

        // Adjust speed based on response time
        const responseRatio = responseTimeMs / currentAllowedTime;

        if (responseRatio < settings.speedUpThreshold) {
          // Very fast answer - speed up
          newSpeed = Math.min(settings.maxSpeed, prev.gameSpeed + settings.speedIncrement);
        } else if (responseRatio > settings.slowDownThreshold) {
          // Slow answer - slow down slightly
          newSpeed = Math.max(settings.minSpeed, prev.gameSpeed - settings.speedDecrement);
        }
        // If in middle range, maintain current speed
      }

      const newPhase = getPhase(newSpeed);
      const newDifficulty = getDifficulty(newSpeed, newPhase);

      return {
        ...prev,
        gameSpeed: newSpeed,
        phase: newPhase,
        difficulty: newDifficulty,
        questionsAnswered: prev.questionsAnswered + 1,
        peakGameSpeed: Math.max(prev.peakGameSpeed, newSpeed),
      };
    });
  }, [settings, getPhase, getDifficulty, getBaseTime]);

  // Reset engine for new game
  const reset = useCallback(() => {
    responseTimesRef.current = [];
    answerCountRef.current = 0;
    currentGameTypeRef.current = 'speedMath';
    setState({
      gameSpeed: 1.0,
      phase: 'warmup',
      difficulty: 1,
      questionsAnswered: 0,
      peakGameSpeed: 1.0,
      sessionStartTime: Date.now(),
    });
  }, []);

  // Get session duration in seconds
  const getSessionDuration = useCallback(() => {
    return Math.floor((Date.now() - state.sessionStartTime) / 1000);
  }, [state.sessionStartTime]);

  // Get difficulty parameters for specific games
  const getGameParams = useCallback((gameType: string) => {
    const { phase, difficulty } = state;

    switch (gameType) {
      case 'flashMemory':
        return {
          numberCount: phase === 'overdrive' ? 6 + Math.floor(difficulty / 3) :
                       phase === 'ramping' ? 4 + Math.floor(difficulty / 4) : 3,
          showTime: phase === 'overdrive' ? 400 : phase === 'ramping' ? 600 : 800,
          gridSize: phase === 'overdrive' ? 16 : 9, // 4x4 or 3x3
        };

      case 'operatorChaos':
        return {
          operatorCount: phase === 'overdrive' ? 2 : phase === 'ramping' && difficulty > 4 ? 2 : 1,
          maxNumber: phase === 'overdrive' ? 40 : phase === 'ramping' ? 25 : 12,
        };

      case 'spatialStack':
        return {
          cubeCount: phase === 'overdrive' ? 12 + Math.floor(difficulty / 2) :
                     phase === 'ramping' ? 8 + Math.floor(difficulty / 3) : 4 + Math.floor(difficulty / 2),
          complexity: difficulty,
        };

      case 'paradoxFlow':
        return {
          followChance: phase === 'overdrive' ? 0.3 : phase === 'ramping' ? 0.5 : 0.7,
        };

      default:
        return { difficulty };
    }
  }, [state]);

  return {
    state,
    allowedTime,
    processAnswer,
    reset,
    getSessionDuration,
    getGameParams,
    setCurrentGameType,
  };
};
