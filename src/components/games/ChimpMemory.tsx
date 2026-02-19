import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check } from 'lucide-react';
import { useScreenScale } from '@/hooks/useScreenScale';

interface ChimpMemoryProps {
  tier: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  overclockFactor?: number;
}

interface Cell { index: number; number: number | null; revealed: boolean; tapped: boolean; isError?: boolean; }

// Adaptive grid: 4x4 for T1-T3 (bigger cells), 5x5 for T4-T5
const getGridConfig = (tier: number) => {
  if (tier >= 4) return { size: 25, cols: 5 };
  return { size: 16, cols: 4 };
};

export const ChimpMemory = memo(({ tier, onAnswer, playSound, triggerHaptic, overclockFactor = 1 }: ChimpMemoryProps) => {
  const { s } = useScreenScale();
  const gridConfig = getGridConfig(tier);
  const [cells, setCells] = useState<Cell[]>([]);
  const [phase, setPhase] = useState<'showing' | 'hiding' | 'playing' | 'success'>('showing');
  const [nextExpected, setNextExpected] = useState(1);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [roundKey, setRoundKey] = useState(0);

  // Difficulty Config - Minimum 2s display for harder tiers, scaled by count
  const getDifficultyConfig = (t: number) => {
    switch (t) {
      case 1: return { count: 4, showTime: 2000 };
      case 2: return { count: 5, showTime: 2200 };
      case 3: return { count: 6, showTime: 2400 };
      case 4: return { count: 7, showTime: 2600 };
      case 5: return { count: 9, showTime: 3000 };
      default: return { count: 4, showTime: 2000 };
    }
  };

  const initializeRound = useCallback(() => {
    const baseConfig = getDifficultyConfig(tier);
    const config = {
      count: baseConfig.count + (overclockFactor > 1.5 ? 1 : 0),
      showTime: Math.floor(baseConfig.showTime / overclockFactor),
    };

    // Create empty grid
    const newCells: Cell[] = Array.from({ length: gridConfig.size }, (_, index) => ({
      index,
      number: null,
      revealed: false,
      tapped: false,
    }));

    // Randomize positions (Fisher-Yates shuffle)
    const availableIndices = Array.from({ length: gridConfig.size }, (_, i) => i);
    for (let i = availableIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
    }

    // Place numbers with T5 consecutive-number spacing enforcement
    const placeNumbers = (indices: number[], count: number, cols: number, enforceTier: number): number[] => {
      const getManhattanDist = (a: number, b: number) => {
        const ax = a % cols, ay = Math.floor(a / cols);
        const bx = b % cols, by = Math.floor(b / cols);
        return Math.abs(ax - bx) + Math.abs(ay - by);
      };

      const checkSpacing = (positions: number[]) => {
        for (let n = 0; n < positions.length - 1; n++) {
          if (getManhattanDist(positions[n], positions[n + 1]) < 2) return false;
        }
        return true;
      };

      let chosen = indices.slice(0, count);

      // For tier >= 5, enforce minimum manhattan distance 2 between consecutive numbers
      if (enforceTier >= 5) {
        for (let attempt = 0; attempt < 10; attempt++) {
          if (checkSpacing(chosen)) break;
          // Re-shuffle positions
          const pool = [...indices];
          for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
          }
          chosen = pool.slice(0, count);
        }
      }

      return chosen;
    };

    const chosenPositions = placeNumbers(availableIndices, config.count, gridConfig.cols, tier);
    for (let i = 0; i < config.count; i++) {
      const pos = chosenPositions[i];
      newCells[pos] = { ...newCells[pos], number: i + 1, revealed: true };
    }

    setCells(newCells);
    setPhase('showing');
    setNextExpected(1);
    setRoundKey(prev => prev + 1);

    // Timer to hide numbers
    setTimeout(() => {
      setPhase('hiding');
      setCells(prev => prev.map(cell => ({ ...cell, revealed: false })));
      setTimeout(() => setPhase('playing'), 200);
    }, config.showTime);
  }, [tier, overclockFactor]);

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

    // Use overclock-adjusted count (same as initializeRound) to avoid unreachable last number
    const baseConfig = getDifficultyConfig(tier);
    const totalCount = baseConfig.count + (overclockFactor > 1.5 ? 1 : 0);
    if (nextExpected === totalCount) {
      // Show success indicator before completing
      setPhase('success');
      confetti({
        particleCount: 20,
        spread: 60,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#00D4FF', '#FF00FF', '#FFD700', '#00FF88'],
        gravity: 1.5,
        ticks: 60,
        decay: 0.94,
        disableForReducedMotion: true,
      });
      setTimeout(() => onAnswer(true, 1.0, tier), 400);
    } else {
      setNextExpected(prev => prev + 1);
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'showing': return 'Memorize';
      case 'hiding': return 'Get ready...';
      case 'success': return 'Perfect!';
      default: return 'Tap in order';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4" role="region" aria-label="Chimp Memory Game">
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {phase === 'showing' && `Memorize ${getDifficultyConfig(tier).count} numbers on the grid`}
        {phase === 'playing' && `Tap numbers in order, starting from ${nextExpected}`}
        {phase === 'success' && 'Perfect! All numbers found correctly'}
      </div>

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
              className="rounded-full bg-green-500/20 backdrop-blur-sm flex items-center justify-center border-2 border-green-500"
              style={{ width: s(80), height: s(80) }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.3 }}
            >
              <Check className="text-green-500" style={{ width: s(40), height: s(40) }} strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        <div
          key={roundKey}
          style={{
            transition: 'opacity 250ms ease-out, transform 250ms ease-out',
            opacity: 1,
            transform: 'scale(1)',
          }}
        >
          <div
            role="grid"
            aria-label={`${gridConfig.cols} by ${gridConfig.cols} memory grid, ${getDifficultyConfig(tier).count} numbers to memorize`}
            className={`grid w-full aspect-square ${gridConfig.cols === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}
            style={{
              gap: s(12),
              maxWidth: gridConfig.cols === 4 ? s(340) : s(360),
              transition: 'transform 200ms ease-out, opacity 200ms ease-out',
              transform: phase === 'success' ? 'scale(0.95)' : 'scale(1)',
              opacity: phase === 'success' ? 0.5 : 1,
            }}
          >
            {cells.map((cell) => (
              <button
                key={cell.index}
                role="gridcell"
                aria-label={
                  cell.revealed && cell.number
                    ? `Number ${cell.number}${cell.tapped ? ', already tapped' : ''}`
                    : cell.tapped
                      ? `Cell ${cell.number}, tapped`
                      : phase === 'playing' ? 'Hidden cell, tap to reveal' : 'Hidden cell'
                }
                aria-disabled={cell.tapped || phase !== 'playing'}
                onClick={() => handleCellTap(cell.index)}
                style={{
                  transition: 'transform 150ms ease-out, opacity 150ms ease-out',
                  transform: cell.tapped ? 'scale(0.9)' : 'scale(1)',
                  opacity: cell.tapped ? 0.4 : 1,
                  minWidth: s(52),
                  minHeight: s(52),
                }}
                className={`relative rounded-xl flex items-center justify-center text-xl font-bold aspect-square transition-colors touch-manipulation
                  ${cell.revealed && cell.number ? 'bg-primary text-primary-foreground' : 'bg-muted/30 active:bg-muted/50'}
                  ${cell.isError ? 'bg-destructive animate-shake' : ''}
                  ${cell.tapped ? 'pointer-events-none' : ''}
                  ${phase === 'playing' && !cell.tapped ? 'active:scale-95' : ''}
                `}
                disabled={cell.tapped || phase !== 'playing'}
              >
                <span className="select-none">
                  {(cell.revealed || cell.tapped) && cell.number}
                </span>
              </button>
            ))}
          </div>
        </div>

      <p
        style={{
          transition: 'opacity 200ms ease-out',
          opacity: phase === 'success' ? 1 : 0.6,
        }}
        className={`mt-6 text-xs font-mono tracking-widest uppercase ${
          phase === 'success' ? 'text-green-500' : 'text-muted-foreground'
        }`}
      >
        {getPhaseLabel()}
      </p>
    </div>
  );
});
