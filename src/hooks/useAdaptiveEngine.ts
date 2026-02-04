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
  baseTime: number; // Base time allowed per question (ms)
  minSpeed: number;
  maxSpeed: number;
  speedUpThreshold: number; // Answer faster than this % of allowed time = speed up
  slowDownThreshold: number; // Answer slower than this % = slow down
  speedIncrement: number;
  speedDecrement: number;
  errorPenalty: number; // Multiply speed by this on error
}

const DEFAULT_CONFIG: AdaptiveConfig = {
  baseTime: 5000, // 5 seconds base
  minSpeed: 0.5,
  maxSpeed: 2.5,
  speedUpThreshold: 0.3, // 30% of allowed time
  slowDownThreshold: 0.8, // 80% of allowed time
  speedIncrement: 0.05,
  speedDecrement: 0.05,
  errorPenalty: 0.9, // 10% drop
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

  // Calculate allowed time based on current speed
  const allowedTime = useMemo(() => {
    return Math.floor(settings.baseTime / state.gameSpeed);
  }, [state.gameSpeed, settings.baseTime]);

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
      const currentAllowedTime = settings.baseTime / prev.gameSpeed;

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

      // Only update speed every 3 answers to avoid jitter
      const shouldUpdateSpeed = answerCountRef.current % 3 === 0 || !isCorrect;
      const finalSpeed = shouldUpdateSpeed ? newSpeed : prev.gameSpeed;

      const newPhase = getPhase(finalSpeed);
      const newDifficulty = getDifficulty(finalSpeed, newPhase);

      return {
        ...prev,
        gameSpeed: finalSpeed,
        phase: newPhase,
        difficulty: newDifficulty,
        questionsAnswered: prev.questionsAnswered + 1,
        peakGameSpeed: Math.max(prev.peakGameSpeed, finalSpeed),
      };
    });
  }, [settings, getPhase, getDifficulty]);

  // Reset engine for new game
  const reset = useCallback(() => {
    responseTimesRef.current = [];
    answerCountRef.current = 0;
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
      
      case 'nBackGhost':
        return {
          nBack: phase === 'overdrive' && difficulty > 7 ? 3 : 2,
          runeCount: phase === 'overdrive' ? 8 : phase === 'ramping' ? 6 : 5,
        };
      
      case 'operatorChaos':
        return {
          operatorCount: phase === 'overdrive' ? 2 : phase === 'ramping' && difficulty > 5 ? 2 : 1,
          maxNumber: phase === 'overdrive' ? 20 : phase === 'ramping' ? 15 : 10,
        };
      
      case 'spatialStack':
        return {
          cubeCount: phase === 'overdrive' ? 7 + Math.floor(difficulty / 3) : 
                     phase === 'ramping' ? 5 + Math.floor(difficulty / 4) : 3 + Math.floor(difficulty / 3),
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
  };
};
