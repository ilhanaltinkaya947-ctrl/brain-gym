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

// Subtle emoji sets for higher tiers — pairs that look more similar
const SUBTLE_EMOJI_SETS = [
  ['🔵', '🫐'],
  ['🟢', '🟩'],
  ['⚪', '⬜'],
  ['🔴', '🟥'],
  ['🟡', '🟨'],
];

const SHAPE_SETS = [
  { base: '●', odd: '○' },
  { base: '■', odd: '□' },
  { base: '▲', odd: '△' },
  { base: '◆', odd: '◇' },
];

// Subtle shape sets for higher tiers — shape + filled/outline combos
const SUBTLE_SHAPE_SETS = [
  { base: '●', odd: '◉' },
  { base: '■', odd: '▪' },
  { base: '▲', odd: '▴' },
];

interface TierConfig {
  gridSize: number;
  cols: number;
  oddCount: number;
  useSubtle: boolean;
  timeLimit: number | null; // ms, null = no time limit
}

const getTierConfig = (tier: number): TierConfig => {
  switch (tier) {
    case 1:
      return { gridSize: 16, cols: 4, oddCount: 1, useSubtle: false, timeLimit: null };
    case 2:
      return { gridSize: 16, cols: 4, oddCount: 1, useSubtle: false, timeLimit: null };
    case 3:
      return { gridSize: 25, cols: 5, oddCount: 1, useSubtle: true, timeLimit: null };
    case 4:
      return { gridSize: 25, cols: 5, oddCount: 2, useSubtle: true, timeLimit: null };
    case 5:
      return { gridSize: 36, cols: 6, oddCount: 2, useSubtle: true, timeLimit: 4000 };
    default:
      return { gridSize: 16, cols: 4, oddCount: 1, useSubtle: false, timeLimit: null };
  }
};

interface Question {
  grid: { emoji: string; isOdd: boolean }[];
  oddIndices: number[];
  cols: number;
}

const generateQuestion = (tier: number): Question => {
  const config = getTierConfig(tier);
  const { gridSize, cols, oddCount, useSubtle } = config;

  // Pick odd indices
  const oddIndices: number[] = [];
  while (oddIndices.length < oddCount) {
    const idx = Math.floor(Math.random() * gridSize);
    if (!oddIndices.includes(idx)) {
      oddIndices.push(idx);
    }
  }

  // Pick emoji/shape set
  const useShapes = Math.random() < 0.4;

  let baseEmoji: string;
  let oddEmoji: string;

  if (useShapes) {
    const sets = useSubtle && Math.random() < 0.5 ? SUBTLE_SHAPE_SETS : SHAPE_SETS;
    const shapeSet = sets[Math.floor(Math.random() * sets.length)];
    baseEmoji = shapeSet.base;
    oddEmoji = shapeSet.odd;
  } else {
    const sets = useSubtle ? SUBTLE_EMOJI_SETS : EMOJI_SETS;
    const emojiSet = sets[Math.floor(Math.random() * sets.length)];
    baseEmoji = emojiSet[0];
    oddEmoji = emojiSet[1];
  }

  const grid = Array(gridSize).fill(null).map((_, i) => ({
    emoji: oddIndices.includes(i) ? oddEmoji : baseEmoji,
    isOdd: oddIndices.includes(i),
  }));

  return { grid, oddIndices, cols };
};

export const PatternHunter = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  tier = 1,
}: PatternHunterProps) => {
  const config = getTierConfig(tier);
  const [question, setQuestion] = useState<Question>(() => generateQuestion(tier));
  const [questionKey, setQuestionKey] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [foundOdds, setFoundOdds] = useState<Set<number>>(new Set());
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(config.timeLimit);
  const questionStartTime = useRef(Date.now());
  const isProcessing = useRef(false);

  // Timer for tier 5
  useEffect(() => {
    if (config.timeLimit === null) {
      setTimeLeft(null);
      return;
    }

    setTimeLeft(config.timeLimit);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 100) {
          // Time's up — wrong answer
          onAnswer(false, 0, tier);
          playSound('wrong');
          triggerHaptic('heavy');
          onScreenShake();

          // Generate next question
          const newQ = generateQuestion(tier);
          setQuestion(newQ);
          setQuestionKey(k => k + 1);
          setFoundOdds(new Set());
          questionStartTime.current = Date.now();
          setSelectedIndex(null);
          setLastFeedback(null);
          isProcessing.current = false;
          return config.timeLimit;
        }
        if (prev <= 1000) {
          playSound('tick');
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [questionKey, config.timeLimit, tier, onAnswer, playSound, triggerHaptic, onScreenShake]);

  const handleSelect = useCallback((index: number) => {
    if (isProcessing.current || selectedIndex !== null) return;

    const cell = question.grid[index];

    // Already found this odd one
    if (foundOdds.has(index)) return;

    if (cell.isOdd) {
      playSound('correct');
      triggerHaptic('medium');

      const newFound = new Set(foundOdds);
      newFound.add(index);
      setFoundOdds(newFound);

      // Calculate position for confetti
      const col = index % question.cols;
      const row = Math.floor(index / question.cols);
      const xFraction = 0.15 + (col / (question.cols - 1)) * 0.7;
      const yFraction = 0.25 + (row / (Math.ceil(question.grid.length / question.cols) - 1)) * 0.4;
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { x: xFraction, y: yFraction },
        colors: ['#00BFFF', '#1E90FF', '#00D4FF'],
        scalar: 0.8,
      });

      // Check if all odds found
      if (newFound.size >= config.oddCount) {
        isProcessing.current = true;
        setSelectedIndex(index);
        setLastFeedback('correct');
        onScreenShake();

        const responseTime = Date.now() - questionStartTime.current;
        const speedBonus = Math.max(0, Math.floor((3000 - responseTime) / 50));
        onAnswer(true, speedBonus, tier);

        setTimeout(() => {
          const newQ = generateQuestion(tier);
          setQuestion(newQ);
          setQuestionKey(k => k + 1);
          setFoundOdds(new Set());
          questionStartTime.current = Date.now();
          setSelectedIndex(null);
          setLastFeedback(null);
          isProcessing.current = false;
        }, 200);
      }
    } else {
      isProcessing.current = true;
      setSelectedIndex(index);
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
      setLastFeedback('wrong');

      const responseTime = Date.now() - questionStartTime.current;
      const speedBonus = Math.max(0, Math.floor((3000 - responseTime) / 50));
      onAnswer(false, speedBonus, tier);

      setTimeout(() => {
        const newQ = generateQuestion(tier);
        setQuestion(newQ);
        setQuestionKey(k => k + 1);
        setFoundOdds(new Set());
        questionStartTime.current = Date.now();
        setSelectedIndex(null);
        setLastFeedback(null);
        isProcessing.current = false;
      }, 200);
    }
  }, [question, selectedIndex, foundOdds, config.oddCount, tier, onAnswer, playSound, triggerHaptic, onScreenShake]);

  // Compute cell size based on grid
  const cellSize = config.cols <= 4 ? 'w-16 h-16' : config.cols === 5 ? 'w-14 h-14' : 'w-11 h-11';
  const textSize = config.cols <= 4 ? 'text-3xl' : config.cols === 5 ? 'text-2xl' : 'text-xl';
  const gap = config.cols <= 4 ? 'gap-3' : config.cols === 5 ? 'gap-2' : 'gap-1.5';

  const timerProgress = timeLeft !== null && config.timeLimit !== null ? (timeLeft / config.timeLimit) * 100 : null;

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8">
      {/* Instruction */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-game-pattern/70 mb-2">
          Find {config.oddCount > 1 ? `All ${config.oddCount}` : 'The'}
        </div>
        <div className="text-2xl font-black text-game-pattern uppercase tracking-wider">
          Odd {config.oddCount > 1 ? 'Ones' : 'One'} Out
        </div>
      </motion.div>

      {/* Timer bar for tier 5 */}
      {timerProgress !== null && (
        <div className="w-full max-w-sm h-2 bg-muted/30 rounded-full overflow-hidden mb-4 border border-border/50">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: timerProgress > 30
                ? 'linear-gradient(90deg, hsl(var(--game-pattern)), hsl(var(--neon-cyan)))'
                : 'hsl(var(--destructive))',
              boxShadow: timerProgress > 30
                ? '0 0 10px hsl(var(--game-pattern) / 0.5)'
                : '0 0 10px hsl(var(--destructive) / 0.5)',
            }}
            animate={{ width: `${timerProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={questionKey}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`grid ${gap} p-4 rounded-3xl`}
          style={{
            gridTemplateColumns: `repeat(${question.cols}, minmax(0, 1fr))`,
            background: 'linear-gradient(135deg, hsl(var(--game-pattern) / 0.1), hsl(var(--card) / 0.5))',
            border: '1px solid hsl(var(--game-pattern) / 0.3)',
          }}
        >
          {question.grid.map((cell, index) => {
            const isFound = foundOdds.has(index);
            return (
              <motion.button
                key={index}
                onClick={() => handleSelect(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  backgroundColor:
                    isFound
                      ? 'hsl(var(--game-pattern) / 0.4)'
                      : selectedIndex === index
                        ? cell.isOdd
                          ? 'hsl(var(--game-pattern) / 0.5)'
                          : 'hsl(var(--destructive) / 0.5)'
                        : 'hsl(var(--card) / 0.6)',
                  boxShadow:
                    isFound
                      ? '0 0 20px hsl(var(--game-pattern) / 0.6)'
                      : selectedIndex === index && cell.isOdd
                        ? '0 0 30px hsl(var(--game-pattern) / 0.8)'
                        : selectedIndex === index && !cell.isOdd
                          ? '0 0 30px hsl(var(--destructive) / 0.8)'
                          : '0 0 10px hsl(var(--game-pattern) / 0.2)',
                }}
                className={`${cellSize} rounded-xl border border-game-pattern/30 flex items-center justify-center ${textSize} transition-colors touch-manipulation`}
                style={{
                  textShadow: '0 0 10px rgba(255,255,255,0.3)',
                }}
                disabled={isFound}
              >
                {cell.emoji}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          {config.oddCount > 1 ? `Tap all ${config.oddCount} different ones` : 'Tap the different one'}
        </div>
      </motion.div>
    </div>
  );
};
