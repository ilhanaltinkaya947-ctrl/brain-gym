import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

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
  originalIndex?: number; // Track original position for rotation
}

const GRID_SIZE = 9; // 3x3

const getNumbersForLevel = (level: number): number[] => {
  const count = Math.min(2 + level, 7); // Level 1 = 3, Level 2 = 4, etc. max 7
  return Array.from({ length: count }, (_, i) => i + 1);
};

const getShowTimeForLevel = (level: number): number => {
  if (level <= 2) return 1000;
  if (level <= 4) return 800;
  return 600;
};

// Check if rotation should be applied (level 4+)
const shouldRotate = (level: number): boolean => level >= 4;

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Rotate a 3x3 grid 90 degrees clockwise
// Original:     Rotated:
// 0 1 2         6 3 0
// 3 4 5    ->   7 4 1
// 6 7 8         8 5 2
const rotateGrid90 = (cells: Cell[]): Cell[] => {
  const rotationMap = [6, 3, 0, 7, 4, 1, 8, 5, 2];
  const rotated = new Array(9).fill(null);
  
  cells.forEach((cell, oldIndex) => {
    const newIndex = rotationMap.indexOf(oldIndex);
    rotated[newIndex] = {
      ...cell,
      index: newIndex,
      originalIndex: cell.originalIndex ?? oldIndex,
    };
  });
  
  return rotated;
};

export const FlashMemory = ({ onGameOver, playSound, triggerHaptic }: FlashMemoryProps) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [cells, setCells] = useState<Cell[]>([]);
  const [phase, setPhase] = useState<'showing' | 'hiding' | 'rotating' | 'playing'>('showing');
  const [nextExpected, setNextExpected] = useState(1);
  const [isShaking, setIsShaking] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [gridRotation, setGridRotation] = useState(0);

  const initializeRound = useCallback((currentLevel: number) => {
    const numbers = getNumbersForLevel(currentLevel);
    const positions = shuffleArray(Array.from({ length: GRID_SIZE }, (_, i) => i));
    
    const newCells: Cell[] = Array.from({ length: GRID_SIZE }, (_, index) => ({
      index,
      number: null,
      revealed: false,
      tapped: false,
      originalIndex: index,
    }));

    // Place numbers in random positions
    numbers.forEach((num, i) => {
      const pos = positions[i];
      newCells[pos] = {
        index: pos,
        number: num,
        revealed: true,
        tapped: false,
        originalIndex: pos,
      };
    });

    setCells(newCells);
    setPhase('showing');
    setNextExpected(1);
    setGridRotation(0);

    // Show numbers for calculated time, then hide
    const showTime = getShowTimeForLevel(currentLevel);
    setTimeout(() => {
      setPhase('hiding');
      setCells(prev => prev.map(cell => ({ ...cell, revealed: false })));
      
      // Apply rotation for level 4+
      if (shouldRotate(currentLevel)) {
        setTimeout(() => {
          setPhase('rotating');
          setGridRotation(90);
          setCells(prev => rotateGrid90(prev));
          setTimeout(() => setPhase('playing'), 400);
        }, 200);
      } else {
        setTimeout(() => setPhase('playing'), 200);
      }
    }, showTime);
  }, []);

  useEffect(() => {
    initializeRound(level);
  }, []);

  const triggerConfetti = (event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { x, y },
      colors: ['#00D4FF', '#FF00FF', '#FFD700'],
      scalar: 0.8,
    });
  };

  const handleCellTap = (cellIndex: number, event: React.MouseEvent) => {
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
    triggerConfetti(event);

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
      {/* Level & Score Header */}
      <div className="text-center mb-8">
        <motion.div
          key={level}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-sm uppercase tracking-widest text-muted-foreground mb-2"
        >
          Level {level}
          {shouldRotate(level) && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-neon-magenta/20 text-neon-magenta text-[10px] font-bold">
              ROTATION
            </span>
          )}
        </motion.div>
        <motion.div 
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-4xl font-black font-mono text-primary text-glow-cyan"
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
            className="text-lg text-secondary mb-6 uppercase tracking-widest text-center text-glow-magenta font-bold"
          >
            Memorize!
          </motion.p>
        )}
        {phase === 'rotating' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg text-neon-magenta mb-6 uppercase tracking-widest text-center font-bold"
          >
            ↻ Grid Rotating...
          </motion.p>
        )}
        {phase === 'playing' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg text-muted-foreground mb-6 uppercase tracking-wider text-center"
          >
            Tap in order: <span className="text-primary font-black text-glow-cyan">{nextExpected}</span>
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
            <div className="text-5xl font-black text-gradient-neon uppercase">
              Level {level + 1}!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3x3 Grid - Energy Cell Style with Rotation */}
      <motion.div 
        className="grid grid-cols-3 gap-3 w-full max-w-xs aspect-square"
        animate={{ 
          rotate: gridRotation,
        }}
        transition={{ 
          duration: 0.4, 
          ease: 'easeInOut',
        }}
      >
        {cells.map((cell) => {
          const isActive = cell.revealed || cell.tapped;
          const isTapped = cell.tapped;
          
          return (
            <motion.button
              key={cell.index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                // Counter-rotate the cells so numbers stay upright
                rotate: -gridRotation,
              }}
              whileHover={phase === 'playing' && !cell.tapped ? { scale: 1.05, borderColor: 'hsl(var(--neon-cyan))' } : {}}
              whileTap={phase === 'playing' && !cell.tapped ? { scale: 0.95 } : {}}
              onClick={(e) => handleCellTap(cell.index, e)}
              disabled={phase !== 'playing' || cell.tapped}
              className="rounded-xl flex items-center justify-center text-4xl font-black font-mono transition-all duration-200 backdrop-blur-sm"
              style={{
                background: isTapped 
                  ? 'linear-gradient(145deg, hsl(var(--neon-gold) / 0.4), hsl(var(--neon-gold) / 0.2))'
                  : cell.revealed
                    ? 'linear-gradient(145deg, hsl(var(--neon-magenta) / 0.3), hsl(var(--neon-magenta) / 0.1))'
                    : 'linear-gradient(145deg, hsl(260 30% 14% / 0.8), hsl(260 30% 8% / 0.6))',
                border: isTapped 
                  ? '2px solid hsl(var(--neon-gold))'
                  : cell.revealed 
                    ? '2px solid hsl(var(--neon-magenta) / 0.8)' 
                    : '2px solid hsl(var(--neon-cyan) / 0.4)',
                boxShadow: isTapped
                  ? '0 0 30px hsl(var(--neon-gold) / 0.5), inset 0 0 20px hsl(var(--neon-gold) / 0.2)'
                  : cell.revealed
                    ? '0 0 25px hsl(var(--neon-magenta) / 0.4)'
                    : '0 0 15px hsl(var(--neon-cyan) / 0.2)',
              }}
            >
              <AnimatePresence mode="wait">
                {isActive && cell.number && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    style={{
                      color: isTapped ? 'hsl(var(--neon-gold))' : 'hsl(var(--neon-magenta))',
                      textShadow: isTapped 
                        ? '0 0 20px hsl(var(--neon-gold) / 0.8)' 
                        : '0 0 20px hsl(var(--neon-magenta) / 0.8)',
                    }}
                  >
                    {cell.number}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="mt-8 text-sm text-muted-foreground text-center"
      >
        {getNumbersForLevel(level).length} numbers • {getShowTimeForLevel(level)}ms
        {shouldRotate(level) && ' • 90° rotation'}
      </motion.p>
    </motion.div>
  );
};
