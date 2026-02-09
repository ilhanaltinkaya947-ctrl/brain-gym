import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ColorQuestion } from '../hooks/useGameEngine';

interface ColorMatchProps {
  generateQuestion: () => ColorQuestion;
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  streak: number;
  onScreenShake: () => void;
  tier?: number;
}

// Extended color palette
const BASE_COLORS = [
  { name: 'RED', hsl: 'hsl(0, 85%, 55%)' },
  { name: 'BLUE', hsl: 'hsl(210, 85%, 55%)' },
  { name: 'GREEN', hsl: 'hsl(120, 60%, 45%)' },
  { name: 'YELLOW', hsl: 'hsl(45, 90%, 55%)' },
];

const EXTENDED_COLORS = [
  ...BASE_COLORS,
  { name: 'PURPLE', hsl: 'hsl(270, 70%, 55%)' },
  { name: 'ORANGE', hsl: 'hsl(25, 90%, 55%)' },
];

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Determine tier based on streak
const getTierFromStreak = (streak: number): number => {
  if (streak >= 20) return 5;
  if (streak >= 15) return 4;
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  return 1;
};

// Get time limit based on tier
const getTimeLimit = (tier: number): number => {
  switch (tier) {
    case 5: return 1500;  // 1.5s — inverted mode + time pressure
    case 4: return 1500;  // 1.5s — shorter decision window
    case 3: return 2000;  // 2.0s — faster pace than tier 1-2
    default: return 2500; // 2.5s — comfortable pace
  }
};

// Get color palette based on tier
const getColorPalette = (tier: number) => {
  return tier >= 3 ? EXTENDED_COLORS : BASE_COLORS;
};

interface GameQuestion {
  topWord: string;
  topWordColor: string;
  bottomWord?: string;
  bottomWordColor?: string;
  options: { label: string; color: string }[];
  correctAnswer: string;
  isInverted: boolean;
}

export const ColorMatch = ({ 
  generateQuestion, 
  onAnswer, 
  playSound, 
  triggerHaptic, 
  streak,
  onScreenShake,
  tier: propTier
}: ColorMatchProps) => {
  const currentTier = propTier ?? getTierFromStreak(streak);
  const questionTime = getTimeLimit(currentTier);
  const colorPalette = useMemo(() => getColorPalette(currentTier), [currentTier]);
  
  const generateTieredQuestion = useCallback((): GameQuestion => {
    const shuffledColors = shuffleArray([...colorPalette]);
    const isInverted = currentTier === 5;
    const hasDistractor = currentTier >= 3 && currentTier <= 4;
    
    // Top word setup
    const topWordColor = shuffledColors[0];
    const topInkColor = shuffledColors[1];
    
    // For inverted mode (tier 5): answer is the WORD TEXT, not the ink color
    // For normal mode: answer is the INK COLOR
    const correctAnswer = isInverted ? topWordColor.name : topInkColor.name;
    
    // Distractor word for tier 3-4
    let bottomWord: string | undefined;
    let bottomWordColor: string | undefined;
    if (hasDistractor) {
      const distractorWordColor = shuffledColors[2] || shuffledColors[0];
      const distractorInkColor = shuffledColors[3] || shuffledColors[1];
      bottomWord = distractorWordColor.name;
      bottomWordColor = distractorInkColor.hsl;
    }
    
    // Build options - ensure correct answer is included
    const optionCount = colorPalette.length >= 6 ? 6 : 4;
    const optionsSet = new Set<string>([correctAnswer]);
    
    // Add other colors as options
    for (const color of shuffledColors) {
      if (optionsSet.size >= optionCount) break;
      optionsSet.add(color.name);
    }
    
    const options = shuffleArray(
      Array.from(optionsSet).map(name => {
        const color = colorPalette.find(c => c.name === name);
        return { label: name, color: color?.hsl || 'hsl(0, 0%, 50%)' };
      })
    );
    
    return {
      topWord: topWordColor.name,
      topWordColor: topInkColor.hsl,
      bottomWord,
      bottomWordColor,
      options,
      correctAnswer,
      isInverted,
    };
  }, [currentTier, colorPalette]);

  const [question, setQuestion] = useState<GameQuestion>(() => generateTieredQuestion());
  const [timeLeft, setTimeLeft] = useState(questionTime);
  const [isShaking, setIsShaking] = useState(false);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [correctButton, setCorrectButton] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nextQuestion = useCallback(() => {
    setQuestion(generateTieredQuestion());
    setTimeLeft(getTimeLimit(currentTier));
    setPressedButton(null);
    setCorrectButton(null);
  }, [generateTieredQuestion, currentTier]);

  // Reset question when tier changes
  useEffect(() => {
    nextQuestion();
  }, [currentTier]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          onAnswer(false, 0, currentTier);
          playSound('wrong');
          triggerHaptic('heavy');
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            nextQuestion();
          }, 300);
          return questionTime;
        }
        if (prev <= 800) {
          playSound('tick');
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [question, onAnswer, playSound, triggerHaptic, nextQuestion, currentTier, questionTime]);

  const triggerConfetti = (event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 40 + streak * 8,
      spread: 70,
      origin: { x, y },
      colors: ['#00D4FF', '#FF00FF', '#FFD700', '#00FF88'],
      scalar: 1,
      gravity: 1.2,
      drift: 0,
      ticks: 120,
    });
  };

  const handleAnswer = (selectedColor: string, event: React.MouseEvent) => {
    const isCorrect = selectedColor === question.correctAnswer;
    const speedBonus = Math.floor((timeLeft / questionTime) * 10);

    setPressedButton(selectedColor);

    if (isCorrect) {
      setCorrectButton(selectedColor);
      playSound('correct');
      triggerHaptic('light');
      triggerConfetti(event);
      onScreenShake();
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    onAnswer(isCorrect, speedBonus, currentTier);
    setTimeout(() => nextQuestion(), 100);
  };

  const progress = (timeLeft / questionTime) * 100;

  // Get tier display info
  const getTierInfo = (tier: number) => {
    switch (tier) {
      case 1: return { label: 'T1', color: 'text-muted-foreground' };
      case 2: return { label: 'T2', color: 'text-blue-400' };
      case 3: return { label: 'T3', color: 'text-purple-400' };
      case 4: return { label: 'T4', color: 'text-orange-400' };
      case 5: return { label: 'T5', color: 'text-red-400' };
      default: return { label: 'T1', color: 'text-muted-foreground' };
    }
  };

  const tierInfo = getTierInfo(currentTier);

  // Instructions based on tier
  const getInstruction = () => {
    if (question.isInverted) {
      return (
        <>
          Tap what the <span className="text-destructive font-bold">WORD SAYS</span>
        </>
      );
    }
    if (question.bottomWord) {
      return (
        <>
          Tap the <span className="text-secondary font-bold text-glow-magenta">INK COLOR</span> of the <span className="text-primary font-bold">TOP</span> word
        </>
      );
    }
    return (
      <>
        Tap the <span className="text-secondary font-bold text-glow-magenta">COLOR</span> of the text
      </>
    );
  };

  return (
    <motion.div
      ref={containerRef}
      animate={isShaking ? { x: [-8, 8, -8, 8, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-4 relative"
    >
      {/* Tier Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`absolute top-4 right-4 px-2 py-1 rounded-md bg-muted/30 border border-border/50 text-xs font-mono ${tierInfo.color}`}
      >
        {tierInfo.label}
      </motion.div>

      {/* Inverted Mode Warning */}
      <AnimatePresence>
        {question.isInverted && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-destructive/20 border border-destructive/50"
          >
            <span className="text-destructive font-bold text-sm tracking-wider">⚠️ INVERTED!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer bar */}
      <div className="w-full max-w-sm h-2 bg-muted/30 rounded-full overflow-hidden mb-6 border border-border/50">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: progress > 30 
              ? 'linear-gradient(90deg, hsl(var(--neon-magenta)), hsl(var(--neon-cyan)))' 
              : 'hsl(var(--destructive))',
            boxShadow: progress > 30 
              ? '0 0 10px hsl(var(--neon-magenta) / 0.5)' 
              : '0 0 10px hsl(var(--destructive) / 0.5)'
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Instructions */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-muted-foreground mb-4 uppercase tracking-widest text-center px-4"
      >
        {getInstruction()}
      </motion.p>

      {/* Word Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.topWord + question.topWordColor + currentTier}
          initial={{ opacity: 0, scale: 0.8, rotateX: 90 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotateX: -90 }}
          transition={{ duration: 0.25, type: "spring" }}
          className="mb-8 flex flex-col items-center gap-2"
        >
          {/* Top Word (always the target) */}
          <h2 
            className="text-6xl sm:text-7xl font-black uppercase tracking-wider"
            style={{ 
              color: question.topWordColor,
              textShadow: `0 0 40px ${question.topWordColor}, 0 0 80px ${question.topWordColor}40`,
            }}
          >
            {question.topWord}
          </h2>

          {/* Distractor Word (tier 3-4) */}
          <AnimatePresence>
            {question.bottomWord && question.bottomWordColor && (
              <motion.h3
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.6, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl font-bold uppercase tracking-wider opacity-60"
                style={{ 
                  color: question.bottomWordColor,
                  textShadow: `0 0 20px ${question.bottomWordColor}40`,
                }}
              >
                {question.bottomWord}
              </motion.h3>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Color Buttons - Responsive grid */}
      <div className={`grid gap-3 w-full max-w-sm ${question.options.length > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {question.options.map((option, index) => {
          const isCorrect = correctButton === option.label;
          return (
            <motion.button
              key={`${question.topWord}-${option.label}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: pressedButton === option.label ? 1.15 : 1,
              }}
              transition={{ 
                delay: index * 0.03,
                scale: { type: "spring", stiffness: 500, damping: 15 }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 1.15 }}
              onClick={(e) => handleAnswer(option.label, e)}
              className="p-4 sm:p-5 rounded-2xl text-base sm:text-lg font-black uppercase tracking-wide transition-all duration-150 backdrop-blur-sm touch-manipulation min-h-[52px]"
              style={{
                background: isCorrect 
                  ? `linear-gradient(145deg, ${option.color}40, ${option.color}20)`
                  : `linear-gradient(145deg, hsl(260 30% 14% / 0.8), hsl(260 30% 8% / 0.6))`,
                border: `2px solid ${isCorrect ? 'hsl(var(--neon-gold))' : option.color}80`,
                color: isCorrect ? 'hsl(var(--neon-gold))' : option.color,
                boxShadow: isCorrect 
                  ? `0 0 50px hsl(var(--neon-gold) / 0.7), inset 0 0 30px hsl(var(--neon-gold) / 0.2)`
                  : `0 0 20px ${option.color}30`,
              }}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
