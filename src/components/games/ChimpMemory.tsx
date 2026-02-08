import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

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
  const [phase, setPhase] = useState<'showing' | 'hiding' | 'rotating' | 'playing' | 'success'>('showing');
  const [nextExpected, setNextExpected] = useState(1);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isRotated, setIsRotated] = useState(false);

  // Difficulty Config - Minimum 2s display for harder tiers, scaled by count
  const getDifficultyConfig = (t: number) => {
    // Base time increases with number count for fairness
    switch (t) {
      case 1: return { count: 4, showTime: 2500 }; // Easy - plenty of time
      case 2: return { count: 5, showTime: 2500 }; // Still comfortable
      case 3: return { count: 6, showTime: 2200 }; // Slightly faster
      case 4: return { count: 7, showTime: 2000 }; // Minimum 2s + rotation
      case 5: return { count: 8, showTime: 2000 }; // God Mode - 2s minimum + rotation
      default: return { count: 4, showTime: 2500 };
    }
  };

  const shouldRotate = tier >= 4;

  const initializeRound = useCallback(() => {
    const config = getDifficultyConfig(tier);
    
    // Reset rotation state
    setIsRotated(false);
    
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
      
      // If tier 4+, rotate the grid after hiding
      if (tier >= 4) {
        setTimeout(() => {
          setPhase('rotating');
          setIsRotated(true);
          // Wait for rotation animation to complete before playing
          setTimeout(() => setPhase('playing'), 600);
        }, 200);
      } else {
        setTimeout(() => setPhase('playing'), 200);
      }
    }, config.showTime);
  }, [tier]);

  useEffect(() => { initializeRound(); }, [initializeRound]);

  const handleCellTap = (index: number) => {
    if (phase !== 'playing') return;
    
    // Debounce rapid taps (150ms minimum between taps)
    const now = Date.now();
    if (now - lastTapTime < 150) return;
    setLastTapTime(now);
    
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
      // Show success indicator before completing
      setPhase('success');
      setTimeout(() => onAnswer(true, 1.0, tier), 400);
    } else {
      setNextExpected(prev => prev + 1);
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'showing': return 'Memorize';
      case 'hiding': return 'Get ready...';
      case 'rotating': return 'Rotating...';
      case 'success': return 'Perfect!';
      default: return 'Tap in order';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4">
      {/* Success Indicator Overlay */}
      <AnimatePresence>
        {phase === 'success' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          >
            <motion.div 
              className="w-20 h-20 rounded-full bg-green-500/20 backdrop-blur-sm flex items-center justify-center border-2 border-green-500"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.3 }}
            >
              <Check className="w-10 h-10 text-green-500" strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        role="grid"
        aria-label={`5 by 5 memory grid${shouldRotate && isRotated ? ', rotated 90 degrees' : ''}`}
        className="grid grid-cols-5 gap-2 w-full max-w-[300px] aspect-square"
        initial={false}
        animate={{ 
          rotate: isRotated ? 90 : 0,
          scale: phase === 'success' ? 0.95 : 1,
          opacity: phase === 'success' ? 0.5 : 1
        }}
        transition={{ 
          rotate: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
          scale: { duration: 0.2 },
          opacity: { duration: 0.2 }
        }}
      >
        {cells.map((cell) => (
          <motion.button
            key={cell.index}
            role="gridcell"
            aria-label={
              cell.revealed && cell.number 
                ? `Number ${cell.number}` 
                : cell.tapped 
                  ? `Tapped cell ${cell.number}` 
                  : 'Hidden cell'
            }
            onClick={() => handleCellTap(cell.index)}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ 
              scale: cell.tapped ? 0.9 : 1,
              opacity: cell.tapped ? 0.4 : 1 
            }}
            whileTap={phase === 'playing' && !cell.tapped ? { scale: 0.95 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`relative rounded-lg flex items-center justify-center text-lg font-bold aspect-square transition-colors touch-manipulation
              min-w-[44px] min-h-[44px]
              ${cell.revealed && cell.number ? 'bg-primary text-primary-foreground' : 'bg-muted/30 active:bg-muted/50'}
              ${cell.isError ? 'bg-destructive animate-shake' : ''}
              ${cell.tapped ? 'pointer-events-none' : ''}
            `}
            disabled={cell.tapped || phase !== 'playing'}
          >
            <span className="select-none">
              {(cell.revealed || cell.tapped) && cell.number}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Rotation indicator for tier 4+ */}
      <AnimatePresence>
        {phase === 'rotating' && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 text-sm text-amber-500 font-medium"
          >
            🔄 Grid rotating...
          </motion.p>
        )}
      </AnimatePresence>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`mt-6 text-xs font-mono tracking-widest uppercase ${
          phase === 'success' ? 'text-green-500 opacity-100' : 'text-muted-foreground opacity-60'
        }`}
      >
        {getPhaseLabel()}
      </motion.p>
    </div>
  );
});
