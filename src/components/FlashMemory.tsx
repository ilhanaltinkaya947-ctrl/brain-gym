import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleExplosion } from './ParticleExplosion';

interface FlashMemoryProps {
  onGameOver: (level: number, score: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

interface Cell {
  index: number;
  number: number | null;
  revealed: boolean;
  tapped: boolean;
}

const GRID_SIZE = 9; // 3x3
const BASE_NUMBERS = [1, 2, 3]; // Level 1 starts with 3 numbers

const getNumbersForLevel = (level: number): number[] => {
  const count = Math.min(2 + level, 7); // Level 1 = 3, Level 2 = 4, etc. max 7
  return Array.from({ length: count }, (_, i) => i + 1);
};

const getShowTimeForLevel = (level: number): number => {
  if (level <= 2) return 1000;
  if (level <= 4) return 800;
  return 600;
};

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const FlashMemory = ({ onGameOver, playSound, triggerHaptic }: FlashMemoryProps) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [cells, setCells] = useState<Cell[]>([]);
  const [phase, setPhase] = useState<'showing' | 'hiding' | 'playing'>('showing');
  const [nextExpected, setNextExpected] = useState(1);
  const [isShaking, setIsShaking] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [particleKey, setParticleKey] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const initializeRound = useCallback((currentLevel: number) => {
    const numbers = getNumbersForLevel(currentLevel);
    const positions = shuffleArray(Array.from({ length: GRID_SIZE }, (_, i) => i));
    
    const newCells: Cell[] = Array.from({ length: GRID_SIZE }, (_, index) => ({
      index,
      number: null,
      revealed: false,
      tapped: false,
    }));

    // Place numbers in random positions
    numbers.forEach((num, i) => {
      const pos = positions[i];
      newCells[pos] = {
        index: pos,
        number: num,
        revealed: true,
        tapped: false,
      };
    });

    setCells(newCells);
    setPhase('showing');
    setNextExpected(1);

    // Show numbers for calculated time, then hide
    const showTime = getShowTimeForLevel(currentLevel);
    setTimeout(() => {
      setPhase('hiding');
      setCells(prev => prev.map(cell => ({ ...cell, revealed: false })));
      setTimeout(() => setPhase('playing'), 200);
    }, showTime);
  }, []);

  useEffect(() => {
    initializeRound(level);
  }, []);

  const handleCellTap = (cellIndex: number) => {
    if (phase !== 'playing') return;

    const cell = cells[cellIndex];
    
    // Already tapped
    if (cell.tapped) return;

    // Check if this cell has a number
    if (cell.number === null) {
      // Wrong - tapped empty cell
      playSound('wrong');
      triggerHaptic('heavy');
      setIsShaking(true);
      setTimeout(() => {
        onGameOver(level, score);
      }, 400);
      return;
    }

    // Check if it's the correct number in sequence
    if (cell.number !== nextExpected) {
      // Wrong order
      playSound('wrong');
      triggerHaptic('heavy');
      setIsShaking(true);
      setTimeout(() => {
        onGameOver(level, score);
      }, 400);
      return;
    }

    // Correct tap!
    playSound('correct');
    triggerHaptic('light');
    setShowParticles(true);
    setParticleKey(prev => prev + 1);
    setTimeout(() => setShowParticles(false), 100);

    // Update cell state
    setCells(prev => prev.map(c => 
      c.index === cellIndex ? { ...c, tapped: true, revealed: true } : c
    ));

    const numbersInLevel = getNumbersForLevel(level).length;
    
    if (nextExpected === numbersInLevel) {
      // Level complete!
      const levelBonus = level * 20;
      setScore(prev => prev + levelBonus);
      
      // Show level up animation
      setShowLevelUp(true);
      setTimeout(() => {
        setShowLevelUp(false);
        setLevel(prev => prev + 1);
        initializeRound(level + 1);
      }, 800);
    } else {
      setNextExpected(prev => prev + 1);
      setScore(prev => prev + 10);
    }
  };

  return (
    <motion.div
      animate={isShaking ? { x: [-8, 8, -8, 8, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-6"
    >
      <ParticleExplosion key={particleKey} trigger={showParticles} x={50} y={50} />

      {/* Level & Score Header */}
      <div className="text-center mb-8">
        <motion.div
          key={level}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-sm uppercase tracking-widest text-muted-foreground mb-2"
        >
          Level {level}
        </motion.div>
        <motion.div 
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-4xl font-bold font-mono text-primary"
        >
          {score}
        </motion.div>
      </div>

      {/* Instructions */}
      <AnimatePresence mode="wait">
        {phase === 'showing' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg text-secondary mb-6 uppercase tracking-wider text-center"
          >
            Memorize!
          </motion.p>
        )}
        {phase === 'playing' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg text-muted-foreground mb-6 uppercase tracking-wider text-center"
          >
            Tap in order: <span className="text-primary font-bold">{nextExpected}</span>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          >
            <div className="text-5xl font-black text-glow-neon uppercase">
              Level {level + 1}!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs aspect-square">
        {cells.map((cell) => (
          <motion.button
            key={cell.index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              backgroundColor: cell.tapped 
                ? 'hsl(var(--primary) / 0.3)' 
                : 'hsl(var(--muted) / 0.5)',
            }}
            whileHover={phase === 'playing' && !cell.tapped ? { scale: 1.05 } : {}}
            whileTap={phase === 'playing' && !cell.tapped ? { scale: 0.95 } : {}}
            onClick={() => handleCellTap(cell.index)}
            disabled={phase !== 'playing' || cell.tapped}
            className="rounded-xl border-2 border-border flex items-center justify-center text-4xl font-black font-mono transition-all duration-200"
            style={{
              borderColor: cell.tapped 
                ? 'hsl(var(--primary))' 
                : cell.revealed 
                  ? 'hsl(var(--secondary))' 
                  : 'hsl(var(--border))',
            }}
          >
            <AnimatePresence mode="wait">
              {(cell.revealed || cell.tapped) && cell.number && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={cell.tapped ? "text-primary" : "text-secondary text-glow-cyan"}
                >
                  {cell.number}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="mt-8 text-sm text-muted-foreground text-center"
      >
        {getNumbersForLevel(level).length} numbers • {getShowTimeForLevel(level)}ms
      </motion.p>
    </motion.div>
  );
};
