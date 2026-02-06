import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface PatternHunterProps {
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  tier?: number;
}

const EMOJI_SETS = [
  ['🟦', '🟥'],
  ['🌟', '⭐'],
  ['🔵', '🟣'],
  ['🟩', '🟨'],
  ['💎', '💠'],
  ['🔺', '🔻'],
  ['⬛', '⬜'],
  ['🟠', '🟤'],
];

const SHAPE_SETS = [
  { base: '●', odd: '○' },
  { base: '■', odd: '□' },
  { base: '▲', odd: '△' },
  { base: '◆', odd: '◇' },
];

interface Question {
  grid: { emoji: string; isOdd: boolean }[];
  oddIndex: number;
}

const generateQuestion = (): Question => {
  const gridSize = 16; // 4x4
  const oddIndex = Math.floor(Math.random() * gridSize);
  
  // Randomly choose between emoji sets or shape sets
  const useShapes = Math.random() < 0.4;
  
  let baseEmoji: string;
  let oddEmoji: string;
  
  if (useShapes) {
    const shapeSet = SHAPE_SETS[Math.floor(Math.random() * SHAPE_SETS.length)];
    baseEmoji = shapeSet.base;
    oddEmoji = shapeSet.odd;
  } else {
    const emojiSet = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
    baseEmoji = emojiSet[0];
    oddEmoji = emojiSet[1];
  }
  
  const grid = Array(gridSize).fill(null).map((_, i) => ({
    emoji: i === oddIndex ? oddEmoji : baseEmoji,
    isOdd: i === oddIndex,
  }));
  
  return { grid, oddIndex };
};

export const PatternHunter = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
}: PatternHunterProps) => {
  const [question, setQuestion] = useState<Question>(() => generateQuestion());
  const [questionKey, setQuestionKey] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);
  const questionStartTime = useRef(Date.now());
  const isProcessing = useRef(false);

  const handleSelect = useCallback((index: number) => {
    if (isProcessing.current || selectedIndex !== null) return;
    isProcessing.current = true;

    setSelectedIndex(index);
    
    const responseTime = Date.now() - questionStartTime.current;
    const speedBonus = Math.max(0, Math.floor((2000 - responseTime) / 50));
    const isCorrect = question.grid[index].isOdd;

    if (isCorrect) {
      playSound('correct');
      triggerHaptic('medium');
      onScreenShake();
      setLastFeedback('correct');
      
      // Calculate position for confetti
      const col = index % 4;
      const row = Math.floor(index / 4);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { x: 0.25 + col * 0.17, y: 0.35 + row * 0.1 },
        colors: ['#00BFFF', '#1E90FF', '#00D4FF'],
        scalar: 0.8,
      });
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
      setLastFeedback('wrong');
    }

    onAnswer(isCorrect, speedBonus);

    setTimeout(() => {
      setQuestion(generateQuestion());
      setQuestionKey(k => k + 1);
      questionStartTime.current = Date.now();
      setSelectedIndex(null);
      setLastFeedback(null);
      isProcessing.current = false;
    }, 200);
  }, [question, selectedIndex, onAnswer, playSound, triggerHaptic, onScreenShake]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8">
      {/* Instruction */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-game-pattern/70 mb-2">
          Find The
        </div>
        <div className="text-2xl font-black text-game-pattern uppercase tracking-wider">
          Odd One Out
        </div>
      </motion.div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={questionKey}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="grid grid-cols-4 gap-3 p-4 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--game-pattern) / 0.1), hsl(var(--card) / 0.5))',
            border: '1px solid hsl(var(--game-pattern) / 0.3)',
          }}
        >
          {question.grid.map((cell, index) => (
            <motion.button
              key={index}
              onClick={() => handleSelect(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                backgroundColor: 
                  selectedIndex === index
                    ? cell.isOdd
                      ? 'hsl(var(--game-pattern) / 0.5)'
                      : 'hsl(var(--destructive) / 0.5)'
                    : 'hsl(var(--card) / 0.6)',
                boxShadow:
                  selectedIndex === index && cell.isOdd
                    ? '0 0 30px hsl(var(--game-pattern) / 0.8)'
                    : selectedIndex === index && !cell.isOdd
                    ? '0 0 30px hsl(var(--destructive) / 0.8)'
                    : '0 0 10px hsl(var(--game-pattern) / 0.2)',
              }}
              className="w-16 h-16 rounded-xl border border-game-pattern/30 flex items-center justify-center text-3xl transition-colors"
              style={{
                textShadow: '0 0 10px rgba(255,255,255,0.3)',
              }}
            >
              {cell.emoji}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          Tap the different one
        </div>
      </motion.div>
    </div>
  );
};
