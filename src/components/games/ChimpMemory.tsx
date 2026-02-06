import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';

interface ChimpMemoryProps {
  tier: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

interface Cell { index: number; number: number | null; revealed: boolean; tapped: boolean; isError?: boolean; }

const GRID_SIZE = 25; // 5x5 grid

export const ChimpMemory = memo(({ tier, onAnswer, playSound, triggerHaptic }: ChimpMemoryProps) => {
  const [cells, setCells] = useState<Cell[]>([]);
  const [phase, setPhase] = useState<'showing' | 'hiding' | 'playing'>('showing');
  const [nextExpected, setNextExpected] = useState(1);

  // Difficulty Config - Minimum 2s display for harder tiers, scaled by count
  const getDifficultyConfig = (t: number) => {
    // Base time increases with number count for fairness
    switch (t) {
      case 1: return { count: 4, showTime: 2500 }; // Easy - plenty of time
      case 2: return { count: 5, showTime: 2500 }; // Still comfortable
      case 3: return { count: 6, showTime: 2200 }; // Slightly faster
      case 4: return { count: 7, showTime: 2000 }; // Minimum 2s
      case 5: return { count: 8, showTime: 2000 }; // God Mode - 2s minimum
      default: return { count: 4, showTime: 2500 };
    }
  };

  const initializeRound = useCallback(() => {
    const config = getDifficultyConfig(tier);
    
    // Create empty grid
    const newCells: Cell[] = Array.from({ length: GRID_SIZE }, (_, index) => ({
      index,
      number: null,
      revealed: false,
      tapped: false,
    }));

    // Randomize positions (Fisher-Yates shuffle)
    const availableIndices = Array.from({ length: GRID_SIZE }, (_, i) => i);
    for (let i = availableIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
    }

    // Place numbers
    for (let i = 0; i < config.count; i++) {
      const pos = availableIndices[i];
      newCells[pos] = { ...newCells[pos], number: i + 1, revealed: true };
    }

    setCells(newCells);
    setPhase('showing');
    setNextExpected(1);

    // Timer to hide numbers
    setTimeout(() => {
      setPhase('hiding');
      setCells(prev => prev.map(cell => ({ ...cell, revealed: false })));
      setTimeout(() => setPhase('playing'), 200);
    }, config.showTime);
  }, [tier]);

  useEffect(() => { initializeRound(); }, [initializeRound]);

  const handleCellTap = (index: number) => {
    if (phase !== 'playing') return;
    const cell = cells[index];
    if (cell.tapped) return;

    // 1. Mistake
    if (cell.number === null || cell.number !== nextExpected) {
      playSound('wrong'); triggerHaptic('heavy');
      setCells(prev => prev.map(c => c.index === index ? { ...c, isError: true, revealed: true } : c));
      setTimeout(() => onAnswer(false, 0, tier), 500);
      return;
    }

    // 2. Correct
    playSound('correct'); triggerHaptic('light');
    const updatedCells = cells.map(c => c.index === index ? { ...c, tapped: true, revealed: true } : c);
    setCells(updatedCells);

    const config = getDifficultyConfig(tier);
    if (nextExpected === config.count) {
      setTimeout(() => onAnswer(true, 1.0, tier), 300);
    } else {
      setNextExpected(prev => prev + 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4">
      <motion.div 
        className="grid grid-cols-5 gap-1.5 w-full max-w-[300px] aspect-square"
        initial={false}
      >
        {cells.map((cell) => (
          <button
            key={cell.index}
            onClick={() => handleCellTap(cell.index)}
            className={`relative rounded-lg flex items-center justify-center text-xl font-bold aspect-square transition-colors
              ${cell.revealed && cell.number ? 'bg-primary text-primary-foreground' : 'bg-muted/30 active:bg-muted/50'}
              ${cell.isError ? 'bg-destructive animate-shake' : ''}
              ${cell.tapped ? 'opacity-40' : 'opacity-100'}
            `}
          >
            {(cell.revealed || cell.tapped) && cell.number}
          </button>
        ))}
      </motion.div>
      <p className="mt-6 text-xs text-muted-foreground font-mono tracking-widest uppercase opacity-60">
        {phase === 'showing' ? 'Memorize' : 'Tap in order'}
      </p>
    </div>
  );
});
