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

// Fisher-Yates shuffle - ensures true randomization
const shuffleArray = <T,>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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
    const operations = ['+', '-', '×'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    let a: number, b: number, answer: number;

    switch (op) {
      case '+':
        a = Math.floor(Math.random() * 50) + 5;
        b = Math.floor(Math.random() * 50) + 5;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * 50) + 30;
        b = Math.floor(Math.random() * 30) + 5;
        answer = a - b;
        break;
      case '×':
        a = Math.floor(Math.random() * 12) + 2;
        b = Math.floor(Math.random() * 12) + 2;
        answer = a * b;
        break;
      default:
        a = 10;
        b = 5;
        answer = 15;
    }

    const options = new Set<number>([answer]);
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * 20) - 10;
      const wrongAnswer = answer + offset;
      if (wrongAnswer !== answer && wrongAnswer > 0) {
        options.add(wrongAnswer);
      }
    }

    return {
      question: `${a} ${op} ${b}`,
      answer,
      options: shuffleArray(Array.from(options)),
    };
  }, []);

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

  const submitAnswer = useCallback((isCorrect: boolean, speedBonus: number = 0) => {
    setGameState(prev => {
      // End Endless mode on wrong answer
      if (!isCorrect && prev.mode === 'endless') {
        if (timerRef.current) clearInterval(timerRef.current);
        return { 
          ...prev, 
          wrong: prev.wrong + 1, 
          lastResult: 'wrong', 
          isRunning: false 
        };
      }

      // Score calculation (quality over quantity)
      const streakMultiplier = Math.min(1 + prev.streak * 0.1, 3.0);
      const difficultyBonus = prev.difficulty * 5;
      const basePoints = isCorrect ? (10 + speedBonus * 20 + difficultyBonus) : -25;
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
