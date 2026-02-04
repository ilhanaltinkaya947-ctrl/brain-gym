import { useState, useCallback, useRef } from 'react';

export type GameType = 'speedMath' | 'colorMatch' | 'flashMemory';

export interface GameState {
  score: number;
  streak: number;
  correct: number;
  wrong: number;
  totalQuestions: number;
  currentGame: GameType;
  isRunning: boolean;
  timeLeft: number;
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

const GAME_DURATION = 60; // seconds per game
const TOTAL_GAME_TIME = 120; // 2 minutes total

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

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    streak: 0,
    correct: 0,
    wrong: 0,
    totalQuestions: 0,
    currentGame: 'speedMath',
    isRunning: false,
    timeLeft: TOTAL_GAME_TIME,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Use Fisher-Yates shuffle for true randomization
    return {
      question: `${a} ${op} ${b}`,
      answer,
      options: shuffleArray(Array.from(options)),
    };
  }, []);

  const generateColorQuestion = useCallback((): ColorQuestion => {
    // Use Fisher-Yates for proper randomization
    const shuffledColors = shuffleArray([...COLORS]);
    const wordColor = shuffledColors[0];
    const textColor = shuffledColors[1];

    // Shuffle options again to ensure answer position is random
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

  const startGame = useCallback(() => {
    setGameState({
      score: 0,
      streak: 0,
      correct: 0,
      wrong: 0,
      totalQuestions: 0,
      currentGame: 'speedMath',
      isRunning: true,
      timeLeft: TOTAL_GAME_TIME,
    });

    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return { ...prev, timeLeft: 0, isRunning: false };
        }
        
        // Switch games at halftime
        const newTimeLeft = prev.timeLeft - 1;
        const switchGame = prev.timeLeft === GAME_DURATION + 1 && prev.currentGame === 'speedMath';
        
        return {
          ...prev,
          timeLeft: newTimeLeft,
          currentGame: switchGame ? 'colorMatch' : prev.currentGame,
        };
      });
    }, 1000);
  }, []);

  const submitAnswer = useCallback((isCorrect: boolean, speedBonus: number = 0) => {
    setGameState(prev => {
      const streakMultiplier = Math.min(1 + prev.streak * 0.1, 2);
      const basePoints = isCorrect ? 10 + speedBonus : -50;
      const points = isCorrect ? Math.floor(basePoints * streakMultiplier) : basePoints;

      return {
        ...prev,
        score: Math.max(0, prev.score + points),
        streak: isCorrect ? prev.streak + 1 : 0,
        correct: prev.correct + (isCorrect ? 1 : 0),
        wrong: prev.wrong + (isCorrect ? 0 : 1),
        totalQuestions: prev.totalQuestions + 1,
      };
    });
  }, []);

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
