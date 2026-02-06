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

// Calculate difficulty tier based on streak and mode (5-tier system)
export const getDifficultyTier = (streak: number, mode: 'classic' | 'endless'): number => {
  // Endless ramps up 1.5x faster
  const multiplier = mode === 'endless' ? 1.5 : 1;
  const effectiveStreak = Math.floor(streak * multiplier);
  
  if (effectiveStreak <= 5) return 1;   // Basics
  if (effectiveStreak <= 12) return 2;  // Focus
  if (effectiveStreak <= 20) return 3;  // Flow
  if (effectiveStreak <= 30) return 4;  // Elite
  return 5; // God Mode
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

  const generateMathQuestion = useCallback((overrideStreak?: number, overrideMode?: 'classic' | 'endless'): MathQuestion => {
    const effectiveStreak = overrideStreak !== undefined ? overrideStreak : gameState.streak;
    const effectiveMode = overrideMode !== undefined ? overrideMode : gameState.mode;
    const tier = getDifficultyTier(effectiveStreak, effectiveMode);
    let question: string;
    let answer: number;

    if (tier === 1) {
      // TIER 1 "Basics": Simple addition/subtraction (1-50)
      const ops = ['+', '-'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      const a = Math.floor(Math.random() * 45) + 5;
      const b = Math.floor(Math.random() * 40) + 5;
      if (op === '+') {
        answer = a + b;
        question = `${a} + ${b}`;
      } else {
        const larger = Math.max(a, b);
        const smaller = Math.min(a, b);
        answer = larger - smaller;
        question = `${larger} - ${smaller}`;
      }
    } else if (tier === 2) {
      // TIER 2 "Focus": Multiplication (up to 12x12) & three-number addition
      const questionType = Math.random();
      if (questionType < 0.5) {
        // Multiplication
        const a = Math.floor(Math.random() * 11) + 2;
        const b = Math.floor(Math.random() * 11) + 2;
        answer = a * b;
        question = `${a} × ${b}`;
      } else {
        // Three-number addition
        const a = Math.floor(Math.random() * 30) + 10;
        const b = Math.floor(Math.random() * 30) + 10;
        const c = Math.floor(Math.random() * 20) + 5;
        answer = a + b + c;
        question = `${a} + ${b} + ${c}`;
      }
    } else if (tier === 3) {
      // TIER 3 "Flow": Division & large-scale add/subtract (100-500)
      const questionType = Math.random();
      if (questionType < 0.4) {
        // Division with clean results
        const divisor = Math.floor(Math.random() * 10) + 2;
        const quotient = Math.floor(Math.random() * 15) + 5;
        const dividend = divisor * quotient;
        answer = quotient;
        question = `${dividend} ÷ ${divisor}`;
      } else {
        // Large subtraction (100-500 range)
        const a = Math.floor(Math.random() * 300) + 200;
        const b = Math.floor(Math.random() * 150) + 50;
        answer = a - b;
        question = `${a} - ${b}`;
      }
    } else if (tier === 4) {
      // TIER 4 "Elite": Percentages, cubes, harder algebra, larger squares
      const questionType = Math.random();
      if (questionType < 0.25) {
        // Percentages: x% of y
        const percent = PERCENTAGES[Math.floor(Math.random() * PERCENTAGES.length)];
        const base = Math.floor(Math.random() * 8 + 2) * 20; // 40, 60, 80, ..., 180
        answer = (percent / 100) * base;
        question = `${percent}% of ${base}`;
      } else if (questionType < 0.45) {
        // Cubes of small numbers
        const cube = PERFECT_CUBES[Math.floor(Math.random() * PERFECT_CUBES.length)];
        answer = cube.result;
        question = `${cube.base}³`;
      } else if (questionType < 0.65) {
        // Harder algebra: ax + b = c (larger numbers)
        const x = Math.floor(Math.random() * 12) + 3;
        const a = Math.floor(Math.random() * 6) + 2;
        const b = Math.floor(Math.random() * 25) + 5;
        const c = a * x + b;
        answer = x;
        question = `${a}x + ${b} = ${c}`;
      } else if (questionType < 0.85) {
        // Larger squares (11-18)
        const base = Math.floor(Math.random() * 8) + 11;
        answer = base * base;
        question = `${base}²`;
      } else {
        // Large multiplication
        const a = Math.floor(Math.random() * 15) + 12;
        const b = Math.floor(Math.random() * 10) + 3;
        answer = a * b;
        question = `${a} × ${b}`;
      }
    } else {
      // TIER 5 "God Mode": Logarithms, factorials, modular arithmetic, power combos
      const questionType = Math.random();
      if (questionType < 0.2) {
        // Square root of perfect squares
        const square = PERFECT_SQUARES[Math.floor(Math.random() * PERFECT_SQUARES.length)];
        answer = Math.sqrt(square);
        question = `√${square}`;
      } else if (questionType < 0.4) {
        // Simple logarithms (base 10)
        const log = LOG_VALUES[Math.floor(Math.random() * LOG_VALUES.length)];
        answer = log.result;
        question = `log₁₀(${log.value})`;
      } else if (questionType < 0.55) {
        // Factorials
        const fact = FACTORIALS[Math.floor(Math.random() * FACTORIALS.length)];
        answer = fact.result;
        question = `${fact.n}!`;
      } else if (questionType < 0.7) {
        // Modular arithmetic
        const divisors = [3, 5, 7];
        const divisor = divisors[Math.floor(Math.random() * divisors.length)];
        const num = Math.floor(Math.random() * 30) + 10;
        answer = num % divisor;
        question = `${num} mod ${divisor}`;
      } else if (questionType < 0.85) {
        // Power combinations: 2^a + 2^b
        const powers = [
          { exp1: 3, exp2: 2, result: 12 },  // 8 + 4
          { exp1: 4, exp2: 3, result: 24 },  // 16 + 8
          { exp1: 4, exp2: 2, result: 20 },  // 16 + 4
          { exp1: 5, exp2: 3, result: 40 },  // 32 + 8
          { exp1: 5, exp2: 4, result: 48 },  // 32 + 16
        ];
        const combo = powers[Math.floor(Math.random() * powers.length)];
        answer = combo.result;
        question = `2${superscript(combo.exp1)} + 2${superscript(combo.exp2)}`;
      } else {
        // Multi-step: (a × b) - c or negative operations
        const useNegative = Math.random() < 0.5;
        if (useNegative) {
          const a = Math.floor(Math.random() * 8) + 2;
          const b = Math.floor(Math.random() * 6) + 2;
          answer = -a * b;
          question = `(-${a}) × ${b}`;
        } else {
          const a = Math.floor(Math.random() * 10) + 3;
          const b = Math.floor(Math.random() * 8) + 3;
          const c = Math.floor(Math.random() * 20) + 5;
          answer = (a * b) - c;
          question = `(${a} × ${b}) - ${c}`;
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
    
    while (options.size < 4) {
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
    // Calculate initial streak to match starting tier
    // Tier 1: streak 0, Tier 2: streak 6, Tier 3: streak 13, Tier 4: streak 21, Tier 5: streak 31
    const tierStreakMap: Record<number, number> = { 1: 0, 2: 6, 3: 13, 4: 21, 5: 31 };
    const initialStreak = tierStreakMap[startTier] || 0;
    
    // God Tier (tier 4+) starts with 2.5x speed multiplier
    const initialSpeedMultiplier = startTier >= 4 ? 2.5 : startTier === 3 ? 1.5 : 1.0;
    
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
      
      // Adaptive difficulty and speed
      let newSpeed = prev.speedMultiplier;
      if (isCorrect) {
        newSpeed = Math.min(3.0, prev.speedMultiplier + 0.04);
      } else {
        newSpeed = Math.max(0.8, prev.speedMultiplier * 0.85);
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
