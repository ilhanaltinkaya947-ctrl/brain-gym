import { useState, useCallback, useRef } from 'react';

export type GameType = 'speedMath' | 'colorMatch' | 'flashMemory' | 'nBack' | 'paradox';

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

// Game rotation configuration
const ENABLED_GAMES: GameType[] = ['speedMath', 'colorMatch', 'paradox', 'nBack', 'flashMemory'];
const TOTAL_GAME_TIME = 120; // 2 minutes for Classic mode

const COLORS = [
  { name: 'RED', hsl: 'hsl(0, 85%, 55%)' },
  { name: 'BLUE', hsl: 'hsl(210, 85%, 55%)' },
  { name: 'GREEN', hsl: 'hsl(120, 60%, 45%)' },
  { name: 'YELLOW', hsl: 'hsl(45, 90%, 55%)' },
];

// Perfect squares for tier 3
const PERFECT_SQUARES = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225];

// Fisher-Yates shuffle - ensures true randomization
const shuffleArray = <T,>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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

  const generateMathQuestion = useCallback((): MathQuestion => {
    const tier = getDifficultyTier(gameState.streak, gameState.mode);
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
      // TIER 4 "Elite": Simple algebra & squares up to 20
      const questionType = Math.random();
      if (questionType < 0.4) {
        // Simple algebra: ax + b = c, find x
        const x = Math.floor(Math.random() * 10) + 2;
        const a = Math.floor(Math.random() * 5) + 2;
        const b = Math.floor(Math.random() * 20) + 5;
        const c = a * x + b;
        answer = x;
        question = `${a}x + ${b} = ${c}`;
      } else if (questionType < 0.7) {
        // Squares of numbers (2-20)
        const base = Math.floor(Math.random() * 18) + 2;
        answer = base * base;
        question = `${base}²`;
      } else {
        // Large multiplication
        const a = Math.floor(Math.random() * 20) + 10;
        const b = Math.floor(Math.random() * 12) + 2;
        answer = a * b;
        question = `${a} × ${b}`;
      }
    } else {
      // TIER 5 "God Mode": Square roots & multi-step operations
      const questionType = Math.random();
      if (questionType < 0.35) {
        // Square root of perfect squares
        const square = PERFECT_SQUARES[Math.floor(Math.random() * PERFECT_SQUARES.length)];
        answer = Math.sqrt(square);
        question = `√${square}`;
      } else if (questionType < 0.7) {
        // Multi-step: (a × b) + c
        const a = Math.floor(Math.random() * 12) + 2;
        const b = Math.floor(Math.random() * 10) + 2;
        const c = Math.floor(Math.random() * 30) + 10;
        answer = (a * b) + c;
        question = `(${a} × ${b}) + ${c}`;
      } else {
        // Complex algebra: (a × x) - b = c
        const x = Math.floor(Math.random() * 12) + 3;
        const a = Math.floor(Math.random() * 6) + 2;
        const b = Math.floor(Math.random() * 30) + 5;
        const c = (a * x) - b;
        answer = x;
        question = `(${a} × x) - ${b} = ${c}`;
      }
    }

    // Generate wrong options based on tier
    const options = new Set<number>([answer]);
    const variance = tier <= 2 ? 10 : tier === 3 ? 15 : tier === 4 ? 20 : 25;
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * variance * 2) - variance;
      const wrongAnswer = answer + offset;
      if (wrongAnswer !== answer && wrongAnswer > 0) {
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

  const startGame = useCallback((mode: 'classic' | 'endless' = 'classic') => {
    setGameState({
      score: 0,
      streak: 0,
      correct: 0,
      wrong: 0,
      totalQuestions: 0,
      currentGame: 'speedMath',
      isRunning: true,
      timeLeft: mode === 'classic' ? TOTAL_GAME_TIME : 999,
      speedMultiplier: 1.0,
      lastResult: null,
      difficulty: 1,
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

      // Game rotation: switch game every 5 correct answers
      const shouldSwitchGame = isCorrect && (prev.correct + 1) % 5 === 0;
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
