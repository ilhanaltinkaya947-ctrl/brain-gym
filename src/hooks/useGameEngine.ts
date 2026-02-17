import { useState, useCallback, useRef } from 'react';

export type GameType = 'speedMath' | 'paradoxFlow' | 'suitDeception' | 'chimpMemory';

export interface GameState {
  score: number;
  streak: number;
  correct: number;
  wrong: number;
  totalQuestions: number;
  currentGame: GameType;
  isRunning: boolean;
  timeLeft: number;
  speedMultiplier: number;
  lastResult: 'correct' | 'wrong' | null;
  difficulty: number;
  mode: 'classic' | 'endless';
}

export interface MathQuestion {
  question: string;
  answer: number;
  options: number[];
  tier?: number; // Difficulty tier for scoring
}

export interface ColorQuestion {
  word: string;
  wordColor: string;
  options: { label: string; color: string }[];
  correctColor: string;
}

// Game rotation configuration - focused on high cognitive load
// 4 core games: Math, Stroop/Swipes, Cards, Memory
const ENABLED_GAMES: GameType[] = ['speedMath', 'paradoxFlow', 'suitDeception', 'chimpMemory'];
const TOTAL_GAME_TIME = 180; // 3 minutes for Classic mode

const COLORS = [
  { name: 'RED', hsl: 'hsl(0, 85%, 55%)' },
  { name: 'BLUE', hsl: 'hsl(210, 85%, 55%)' },
  { name: 'GREEN', hsl: 'hsl(120, 60%, 45%)' },
  { name: 'YELLOW', hsl: 'hsl(45, 90%, 55%)' },
];

// Perfect squares for tier 3+
const PERFECT_SQUARES = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225];

// Perfect cubes for tier 4
const PERFECT_CUBES = [
  { base: 2, result: 8 },
  { base: 3, result: 27 },
  { base: 4, result: 64 },
  { base: 5, result: 125 },
];

// Logarithms for tier 5 (base 10)
const LOG_VALUES = [
  { value: 10, result: 1 },
  { value: 100, result: 2 },
  { value: 1000, result: 3 },
  { value: 10000, result: 4 },
];

// Factorials for tier 5
const FACTORIALS = [
  { n: 3, result: 6 },
  { n: 4, result: 24 },
  { n: 5, result: 120 },
  { n: 6, result: 720 },
];

// Percentage values for tier 4
const PERCENTAGES = [10, 20, 25, 50, 75];

// Fisher-Yates shuffle - ensures true randomization
const shuffleArray = <T,>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Helper: Convert number to superscript for display
const superscript = (n: number): string => {
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  };
  return String(n).split('').map(d => superscripts[d] || d).join('');
};

/**
 * Calculate difficulty tier based on streak, mode, and time elapsed.
 * 
 * NEW THRESHOLDS (slower progression):
 * - Tier 1: streak 0-8
 * - Tier 2: streak 9-18
 * - Tier 3: streak 19-30
 * - Tier 4: streak 31-45
 * - Tier 5: streak 46+
 * 
 * CLASSIC MODE TIME CAPS:
 * - 0:00-1:00 (first minute): Max Tier 2
 * - 1:00-2:00 (second minute): Max Tier 3
 * - 2:00-3:00 (final minute): Max Tier 4 (Tier 5 only at 40+ streak)
 * 
 * Endless mode ramps 1.5x faster via effective streak multiplier.
 */
export const getDifficultyTier = (
  streak: number, 
  mode: 'classic' | 'endless',
  timeElapsed?: number
): number => {
  // Endless ramps up 1.5x faster
  const multiplier = mode === 'endless' ? 1.5 : 1;
  const effectiveStreak = Math.floor(streak * multiplier);
  
  // Calculate tier from streak with SLOWER thresholds
  let calculatedTier: number;
  if (effectiveStreak <= 8) {
    calculatedTier = 1;   // Basics (streak 0-8)
  } else if (effectiveStreak <= 18) {
    calculatedTier = 2;   // Focus (streak 9-18)
  } else if (effectiveStreak <= 30) {
    calculatedTier = 3;   // Flow (streak 19-30)
  } else if (effectiveStreak <= 45) {
    calculatedTier = 4;   // Elite (streak 31-45)
  } else {
    calculatedTier = 5;   // God Mode (streak 46+)
  }
  
  // For classic mode, cap the max tier based on time phase
  if (mode === 'classic' && timeElapsed !== undefined) {
    let maxTier: number;
    
    if (timeElapsed < 60) {
      // First minute: Stay easy (Tier 1-2)
      maxTier = 2;
    } else if (timeElapsed < 120) {
      // Second minute: Medium difficulty (Tier 2-3)
      maxTier = 3;
    } else {
      // Final minute: Allow harder content (Tier 3-4)
      // Tier 5 only at extreme streak (40+)
      maxTier = streak >= 40 ? 5 : 4;
    }
    
    return Math.min(calculatedTier, maxTier);
  }
  
  return calculatedTier;
};

export const getDifficultyLabel = (tier: number): string => {
  switch (tier) {
    case 1: return 'LVL 1';
    case 2: return 'LVL 2';
    case 3: return 'LVL 3';
    case 4: return 'LVL 4';
    case 5: return 'GOD';
    default: return 'LVL 1';
  }
};

export const getTierName = (tier: number): string => {
  switch (tier) {
    case 1: return 'Basics';
    case 2: return 'Focus';
    case 3: return 'Flow';
    case 4: return 'Elite';
    case 5: return 'God Mode';
    default: return 'Basics';
  }
};

export const useGameEngine = (initialMode: 'classic' | 'endless' = 'classic') => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    streak: 0,
    correct: 0,
    wrong: 0,
    totalQuestions: 0,
    currentGame: 'speedMath',
    isRunning: false,
    timeLeft: TOTAL_GAME_TIME,
    speedMultiplier: 1.0,
    lastResult: null,
    difficulty: 1,
    mode: initialMode
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic game switching
  const pickNextGame = useCallback((current: GameType): GameType => {
    const available = ENABLED_GAMES.filter(g => g !== current);
    return available[Math.floor(Math.random() * available.length)];
  }, []);

  /**
   * Generate a math question with gradual complexity within tiers.
   * 
   * TIER 1 EARLY (streak 0-4): Addition only, numbers 1-20
   * TIER 1 LATE (streak 5-8): Addition AND subtraction, numbers 1-30
   * TIER 2 EARLY (streak 9-13): Simple multiplication (up to 6x6)
   * TIER 2 LATE (streak 14-18): Full multiplication (12x12), three-number add
   * TIER 3 EARLY (streak 19-24): Division with small numbers
   * TIER 3 LATE (streak 25-30): Mixed operations, larger numbers
   * TIER 4: Percentages, squares, cubes, simple algebra
   * TIER 5: Logs, factorials, modular arithmetic, power combos
   */
  const generateMathQuestion = useCallback((
    overrideStreak?: number, 
    overrideMode?: 'classic' | 'endless',
    timeElapsed?: number
  ): MathQuestion => {
    const effectiveStreak = overrideStreak !== undefined ? overrideStreak : gameState.streak;
    const effectiveMode = overrideMode !== undefined ? overrideMode : gameState.mode;
    const tier = getDifficultyTier(effectiveStreak, effectiveMode, timeElapsed);
    
    let question: string;
    let answer: number;

    if (tier === 1) {
      // TIER 1: Addition and subtraction with meaningful numbers
      const isEarly = effectiveStreak <= 4;
      if (isEarly) {
        // 15-50 + 10-40, requires carrying for most combos
        const a = Math.floor(Math.random() * 36) + 15;
        const b = Math.floor(Math.random() * 31) + 10;
        answer = a + b;
        question = `${a} + ${b}`;
      } else {
        const roll = Math.random();
        if (roll < 0.4) {
          // Addition: 25-65 + 20-55
          const a = Math.floor(Math.random() * 41) + 25;
          const b = Math.floor(Math.random() * 36) + 20;
          answer = a + b;
          question = `${a} + ${b}`;
        } else if (roll < 0.75) {
          // Subtraction: 50-99 - 15-45
          const a = Math.floor(Math.random() * 50) + 50;
          const b = Math.floor(Math.random() * 31) + 15;
          answer = a - b;
          question = `${a} - ${b}`;
        } else {
          // Three-number addition with small numbers: 8-20 each
          const a = Math.floor(Math.random() * 13) + 8;
          const b = Math.floor(Math.random() * 13) + 8;
          const c = Math.floor(Math.random() * 13) + 8;
          answer = a + b + c;
          question = `${a} + ${b} + ${c}`;
        }
      }
    } else if (tier === 2) {
      // TIER 2: Multiplication-heavy, simple division, mixed ops — NO pure addition
      const questionType = Math.random();
      if (questionType < 0.4) {
        // Multiplication up to 15×12, occasionally 2-digit × 1-digit
        const roll = Math.random();
        if (roll < 0.5) {
          // Standard: 2-15 × 2-12
          const a = Math.floor(Math.random() * 14) + 2;
          const b = Math.floor(Math.random() * 11) + 2;
          answer = a * b;
          question = `${a} × ${b}`;
        } else {
          // 2-digit × 1-digit: 13-19 × 3-7
          const a = Math.floor(Math.random() * 7) + 13;
          const b = Math.floor(Math.random() * 5) + 3;
          answer = a * b;
          question = `${a} × ${b}`;
        }
      } else if (questionType < 0.65) {
        // Mixed: multiply then add/subtract
        const a = Math.floor(Math.random() * 8) + 5;
        const b = Math.floor(Math.random() * 7) + 3;
        const c = Math.floor(Math.random() * 21) + 10;
        const useAdd = Math.random() < 0.5;
        answer = useAdd ? a * b + c : a * b - c;
        if (answer < 0) {
          answer = a * b + c;
          question = `${a} × ${b} + ${c}`;
        } else {
          question = useAdd ? `${a} × ${b} + ${c}` : `${a} × ${b} - ${c}`;
        }
      } else if (questionType < 0.85) {
        // Two-digit subtraction (bigger range)
        const a = Math.floor(Math.random() * 60) + 50;
        const b = Math.floor(Math.random() * 40) + 15;
        answer = a - b;
        question = `${a} - ${b}`;
      } else {
        // Simple division: divisor 2-8, quotient 2-12
        const divisor = Math.floor(Math.random() * 7) + 2;
        const quotient = Math.floor(Math.random() * 11) + 2;
        const dividend = divisor * quotient;
        answer = quotient;
        question = `${dividend} ÷ ${divisor}`;
      }
    } else if (tier === 3) {
      // TIER 3: Division, two-digit multiplication, order of operations
      const questionType = Math.random();
      if (questionType < 0.3) {
        // Division with bigger dividends (up to ~200)
        const divisor = Math.floor(Math.random() * 11) + 3;
        const quotient = Math.floor(Math.random() * 15) + 5;
        const dividend = divisor * quotient;
        answer = quotient;
        question = `${dividend} ÷ ${divisor}`;
      } else if (questionType < 0.55) {
        // Two-digit multiplication (15-35 × 3-12)
        const a = Math.floor(Math.random() * 21) + 15;
        const b = Math.floor(Math.random() * 10) + 3;
        answer = a * b;
        question = `${a} × ${b}`;
      } else if (questionType < 0.8) {
        // Order of operations: a + b × c or a - b × c
        const a = Math.floor(Math.random() * 50) + 20;
        const b = Math.floor(Math.random() * 10) + 3;
        const c = Math.floor(Math.random() * 10) + 3;
        const useSub = Math.random() < 0.4;
        if (useSub && a > b * c) {
          answer = a - b * c;
          question = `${a} - ${b} × ${c}`;
        } else {
          answer = a + b * c;
          question = `${a} + ${b} × ${c}`;
        }
      } else {
        // Large subtraction (300-700 range)
        const a = Math.floor(Math.random() * 400) + 300;
        const b = Math.floor(Math.random() * 250) + 50;
        answer = a - b;
        question = `${a} - ${b}`;
      }
    } else if (tier === 4) {
      // TIER 4 "Elite": Percentages, squares, cubes, algebra, hard multiplication
      const questionType = Math.random();
      if (questionType < 0.2) {
        // Percentages: x% of y (harder bases)
        const percent = PERCENTAGES[Math.floor(Math.random() * PERCENTAGES.length)];
        const base = Math.floor(Math.random() * 12 + 3) * 20; // 60 to 300
        answer = (percent / 100) * base;
        question = `${percent}% of ${base}`;
      } else if (questionType < 0.35) {
        // Squares (11-25)
        const base = Math.floor(Math.random() * 15) + 11;
        answer = base * base;
        question = `${base}²`;
      } else if (questionType < 0.45) {
        // Cubes of small numbers
        const cube = PERFECT_CUBES[Math.floor(Math.random() * PERFECT_CUBES.length)];
        answer = cube.result;
        question = `${cube.base}³`;
      } else if (questionType < 0.6) {
        // Algebra: ax + b = c (bigger coefficients)
        const x = Math.floor(Math.random() * 15) + 2;
        const a = Math.floor(Math.random() * 10) + 3;
        const b = Math.floor(Math.random() * 40) + 5;
        const c = a * x + b;
        answer = x;
        question = `${a}x + ${b} = ${c}`;
      } else if (questionType < 0.75) {
        // Missing number: _ × b = c (solve for missing factor)
        const missing = Math.floor(Math.random() * 10) + 3;
        const b = Math.floor(Math.random() * 10) + 3;
        const c = missing * b;
        answer = missing;
        question = `? × ${b} = ${c}`;
      } else {
        // Multi-step: (a × b) + (c × d) with bigger values
        const a = Math.floor(Math.random() * 10) + 5;
        const b = Math.floor(Math.random() * 8) + 3;
        const c = Math.floor(Math.random() * 8) + 3;
        const d = Math.floor(Math.random() * 8) + 3;
        answer = a * b + c * d;
        question = `(${a} × ${b}) + (${c} × ${d})`;
      }
    } else {
      // TIER 5 "God Mode": Multi-step, algebra, powers, modular, factorials
      const questionType = Math.random();
      if (questionType < 0.15) {
        // Square root of perfect squares (bigger ones)
        const bigSquares = [64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324];
        const square = bigSquares[Math.floor(Math.random() * bigSquares.length)];
        answer = Math.sqrt(square);
        question = `√${square}`;
      } else if (questionType < 0.25) {
        // Factorials
        const fact = FACTORIALS[Math.floor(Math.random() * FACTORIALS.length)];
        answer = fact.result;
        question = `${fact.n}!`;
      } else if (questionType < 0.4) {
        // Hard algebra: ax² + b = c (solve for x)
        const x = Math.floor(Math.random() * 6) + 2;
        const a = Math.floor(Math.random() * 4) + 1;
        const b = Math.floor(Math.random() * 20) + 5;
        const c = a * x * x + b;
        answer = x;
        question = `${a}x² + ${b} = ${c}`;
      } else if (questionType < 0.55) {
        // Modular arithmetic (bigger numbers)
        const divisors = [3, 5, 7, 9, 11];
        const divisor = divisors[Math.floor(Math.random() * divisors.length)];
        const num = Math.floor(Math.random() * 80) + 20;
        answer = num % divisor;
        question = `${num} mod ${divisor}`;
      } else if (questionType < 0.7) {
        // Power combinations: 2^a + 2^b or 3^a + b
        const powers = [
          { exp1: 4, exp2: 3, result: 24 },
          { exp1: 5, exp2: 3, result: 40 },
          { exp1: 5, exp2: 4, result: 48 },
          { exp1: 6, exp2: 4, result: 80 },
          { exp1: 6, exp2: 5, result: 96 },
          { exp1: 7, exp2: 5, result: 160 },
          { exp1: 7, exp2: 6, result: 192 },
          { exp1: 8, exp2: 6, result: 320 },
        ];
        const combo = powers[Math.floor(Math.random() * powers.length)];
        answer = combo.result;
        question = `2${superscript(combo.exp1)} + 2${superscript(combo.exp2)}`;
      } else if (questionType < 0.85) {
        // Multi-step: (a × b) - (c × d) or (a + b) × c or a² - b²
        const variant = Math.random();
        if (variant < 0.35) {
          const a = Math.floor(Math.random() * 12) + 8;
          const b = Math.floor(Math.random() * 8) + 4;
          const c = Math.floor(Math.random() * 8) + 3;
          const d = Math.floor(Math.random() * 8) + 3;
          const result = a * b - c * d;
          if (result >= 0) {
            answer = result;
            question = `(${a} × ${b}) - (${c} × ${d})`;
          } else {
            answer = c * d - a * b;
            question = `(${c} × ${d}) - (${a} × ${b})`;
          }
        } else if (variant < 0.65) {
          const a = Math.floor(Math.random() * 20) + 10;
          const b = Math.floor(Math.random() * 20) + 10;
          const c = Math.floor(Math.random() * 7) + 2;
          answer = (a + b) * c;
          question = `(${a} + ${b}) × ${c}`;
        } else {
          // a² - b² where a > b
          const a = Math.floor(Math.random() * 10) + 8;
          const b = Math.floor(Math.random() * (a - 2)) + 2;
          answer = a * a - b * b;
          question = `${a}² - ${b}²`;
        }
      } else {
        // Negative operations + hard division
        const variant = Math.random();
        if (variant < 0.5) {
          const a = Math.floor(Math.random() * 10) + 3;
          const b = Math.floor(Math.random() * 8) + 3;
          answer = -a * b;
          question = `(-${a}) × ${b}`;
        } else {
          // Divide then multiply: (a ÷ b) × c
          const b = Math.floor(Math.random() * 8) + 2;
          const quotient = Math.floor(Math.random() * 10) + 2;
          const a = b * quotient;
          const c = Math.floor(Math.random() * 6) + 2;
          answer = quotient * c;
          question = `(${a} ÷ ${b}) × ${c}`;
        }
      }
    }

    // Generate wrong options based on tier and question type
    const options = new Set<number>([answer]);

    // Special variance handling for different question types
    let variance: number;
    let minValue = 1; // Default minimum for wrong answers

    if (question.includes('mod')) {
      // Modular: answers are 0 to divisor-1
      variance = 3;
      minValue = 0;
    } else if (question.includes('!')) {
      // Factorials: large variance for big numbers
      variance = answer < 100 ? 15 : 100;
    } else if (question.includes('log')) {
      // Logarithms: small variance (1-4 range)
      variance = 2;
    } else {
      // Standard variance by tier
      variance = tier <= 2 ? 10 : tier === 3 ? 15 : tier === 4 ? 25 : 30;
    }

    // Allow negative wrong answers when the correct answer is negative
    if (answer < 0) {
      minValue = answer - variance * 2;
    }

    let safetyCounter = 0;
    while (options.size < 4 && safetyCounter < 100) {
      safetyCounter++;
      const offset = Math.floor(Math.random() * variance * 2) - variance;
      const wrongAnswer = answer + offset;
      if (wrongAnswer !== answer && wrongAnswer >= minValue) {
        options.add(wrongAnswer);
      }
    }

    return {
      question,
      answer,
      options: shuffleArray(Array.from(options)),
      tier,
    };
  }, [gameState.streak, gameState.mode]);

  const generateColorQuestion = useCallback((): ColorQuestion => {
    const shuffledColors = shuffleArray([...COLORS]);
    const wordColor = shuffledColors[0];
    const textColor = shuffledColors[1];

    const options = shuffleArray(
      shuffledColors.slice(0, 4).map(c => ({ label: c.name, color: c.hsl }))
    );

    return {
      word: wordColor.name,
      wordColor: textColor.hsl,
      options,
      correctColor: textColor.name,
    };
  }, []);

  const startGame = useCallback((mode: 'classic' | 'endless' = 'classic', startTier: number = 1) => {
    // Calculate initial streak to match starting tier (using NEW thresholds)
    // Tier 1: streak 0, Tier 2: streak 9, Tier 3: streak 19, Tier 4: streak 31, Tier 5: streak 46
    const tierStreakMap: Record<number, number> = { 1: 0, 2: 9, 3: 19, 4: 31, 5: 46 };
    const initialStreak = tierStreakMap[startTier] || 0;
    
    // Speed multiplier — moderate, difficulty comes from harder content not speed
    const initialSpeedMultiplier = startTier >= 4 ? 1.4 : startTier === 3 ? 1.2 : 1.0;
    
    setGameState({
      score: 0,
      streak: initialStreak,
      correct: 0,
      wrong: 0,
      totalQuestions: 0,
      currentGame: 'speedMath',
      isRunning: true,
      timeLeft: mode === 'classic' ? TOTAL_GAME_TIME : 999,
      speedMultiplier: initialSpeedMultiplier,
      lastResult: null,
      difficulty: startTier,
      mode: mode
    });

    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.mode === 'classic' && prev.timeLeft <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return { ...prev, timeLeft: 0, isRunning: false };
        }
        
        return {
          ...prev,
          timeLeft: prev.mode === 'classic' ? prev.timeLeft - 1 : prev.timeLeft
        };
      });
    }, 1000);
  }, []);

  const submitAnswer = useCallback((isCorrect: boolean, speedBonus: number = 0, tier: number = 1) => {
    setGameState(prev => {
      // End Endless mode on wrong answer
      if (!isCorrect && prev.mode === 'endless') {
        if (timerRef.current) clearInterval(timerRef.current);
        return { 
          ...prev, 
          wrong: prev.wrong + 1,
          totalQuestions: prev.totalQuestions + 1,
          lastResult: 'wrong', 
          isRunning: false 
        };
      }

      // 5-Tier scoring: Tier 1=1x, Tier 2=1.5x, Tier 3=2x, Tier 4=3x, Tier 5=5x
      const tierMultipliers: Record<number, number> = { 1: 1, 2: 1.5, 3: 2, 4: 3, 5: 5 };
      const tierMultiplier = tierMultipliers[tier] || 1;
      const streakMultiplier = Math.min(1 + prev.streak * 0.1, 3.0);
      const difficultyBonus = prev.difficulty * 5;
      const basePoints = isCorrect ? (10 + speedBonus * 20 + difficultyBonus) * tierMultiplier : -25;
      const points = Math.floor(basePoints * (isCorrect ? streakMultiplier : 1));
      
      // Adaptive difficulty and speed — content difficulty matters more than speed
      let newSpeed = prev.speedMultiplier;
      if (isCorrect) {
        newSpeed = Math.min(1.8, prev.speedMultiplier + 0.015);
      } else {
        newSpeed = Math.max(0.8, prev.speedMultiplier * 0.92);
      }
      
      const newDifficulty = Math.floor(newSpeed * 1.5);

      // Game rotation: switch game every 3 attempts (correct + incorrect combined)
      const totalAttempts = prev.correct + prev.wrong;
      const shouldSwitchGame = (totalAttempts + 1) % 3 === 0;
      const nextGame = shouldSwitchGame ? pickNextGame(prev.currentGame) : prev.currentGame;

      return {
        ...prev,
        score: Math.max(0, prev.score + points),
        streak: isCorrect ? prev.streak + 1 : 0,
        correct: prev.correct + (isCorrect ? 1 : 0),
        wrong: prev.wrong + (isCorrect ? 0 : 1),
        totalQuestions: prev.totalQuestions + 1,
        speedMultiplier: newSpeed,
        lastResult: isCorrect ? 'correct' : 'wrong',
        difficulty: newDifficulty,
        currentGame: nextGame
      };
    });
  }, [pickNextGame]);

  const stopGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState(prev => ({ ...prev, isRunning: false }));
  }, []);

  return {
    gameState,
    startGame,
    stopGame,
    submitAnswer,
    generateMathQuestion,
    generateColorQuestion,
  };
};
