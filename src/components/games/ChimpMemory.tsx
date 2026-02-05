import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface ChimpMemoryProps {
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  streak?: number;
  mode?: 'classic' | 'endless';
}

interface Cell {
  index: number;
  number: number | null;
  revealed: boolean;
  tapped: boolean;
}

type RotationType = 0 | 90 | 180 | 270;

const getDifficultyConfig = (streak: number) => {
  if (streak < 6) {
    return { 
      gridCols: 3, gridRows: 3, numberCount: 3, 
      showTime: 1200, rotation: 0 as RotationType, 
      tier: 1, label: 'TIER 1' 
    };
  } else if (streak < 15) {
    return { 
      gridCols: 4, gridRows: 4, numberCount: 5, 
      showTime: 1000, rotation: 0 as RotationType, 
      tier: 2, label: 'TIER 2' 
    };
  } else if (streak < 25) {
    return { 
      gridCols: 4, gridRows: 5, numberCount: 7, 
      showTime: 900, rotation: 90 as RotationType, 
      tier: 3, label: 'ADVANCED' 
    };
  } else {
    // God Tier - 9 numbers, 5x5 grid, 180° or 270° rotation, halved show time
    const godRotation = Math.random() > 0.5 ? 180 : 270;
    return { 
      gridCols: 5, gridRows: 5, numberCount: 9, 
      showTime: 450, rotation: godRotation as RotationType, 
      tier: 4, label: 'GOD TIER' 
    };
  }
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

// Rotation transformation maps
const getRotationMap = (cols: number, rows: number, rotation: RotationType): number[] => {
  const totalCells = cols * rows;
  const indices = Array.from({ length: totalCells }, (_, i) => i);
  
  if (rotation === 0) return indices;
  
  return indices.map(i => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    if (rotation === 90) {
      // 90° clockwise: (row, col) -> (col, rows - 1 - row)
      const newRow = col;
      const newCol = rows - 1 - row;
      return newRow * rows + newCol;
    } else if (rotation === 180) {
      // 180°: (row, col) -> (rows - 1 - row, cols - 1 - col)
      const newRow = rows - 1 - row;
      const newCol = cols - 1 - col;
      return newRow * cols + newCol;
    } else {
      // 270° clockwise: (row, col) -> (cols - 1 - col, row)
      const newRow = cols - 1 - col;
      const newCol = row;
      return newRow * cols + newCol;
    }
  });
};

export const ChimpMemory = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  streak = 0,
  mode = 'classic',
}: ChimpMemoryProps) => {
  const [config, setConfig] = useState(() => getDifficultyConfig(streak));
  const [cells, setCells] = useState<Cell[]>([]);
  const [phase, setPhase] = useState<'showing' | 'hiding' | 'rotating' | 'playing'>('showing');
  const [nextExpected, setNextExpected] = useState(1);
  const [isShaking, setIsShaking] = useState(false);
  const [gridRotation, setGridRotation] = useState<RotationType>(0);
  const [questionKey, setQuestionKey] = useState(0);

  const initializeRound = useCallback(() => {
    const newConfig = getDifficultyConfig(streak);
    setConfig(newConfig);
    
    const { gridCols, gridRows, numberCount } = newConfig;
    const totalCells = gridCols * gridRows;
    const positions = shuffleArray(Array.from({ length: totalCells }, (_, i) => i));
    
    const newCells: Cell[] = Array.from({ length: totalCells }, (_, index) => ({
      index,
      number: null,
      revealed: false,
      tapped: false,
    }));

    // Place numbers 1 to numberCount in random positions
    for (let num = 1; num <= numberCount; num++) {
      const pos = positions[num - 1];
      newCells[pos] = {
        index: pos,
        number: num,
        revealed: true,
        tapped: false,
      };
    }

    setCells(newCells);
    setPhase('showing');
    setNextExpected(1);
    setGridRotation(0);

    // Show numbers, then hide and optionally rotate
    setTimeout(() => {
      setPhase('hiding');
      setCells(prev => prev.map(cell => ({ ...cell, revealed: false })));
      
      if (newConfig.rotation !== 0) {
        setTimeout(() => {
          setPhase('rotating');
          setGridRotation(newConfig.rotation);
          setTimeout(() => setPhase('playing'), 500);
        }, 300);
      } else {
        setTimeout(() => setPhase('playing'), 200);
      }
    }, newConfig.showTime);
  }, [streak]);

  useEffect(() => {
    initializeRound();
  }, []);

  const handleCellTap = useCallback((cellIndex: number, event: React.MouseEvent) => {
    if (phase !== 'playing') return;

    const cell = cells[cellIndex];
    
    if (cell.tapped) return;

    // Tapped empty cell or wrong number
    if (cell.number === null || cell.number !== nextExpected) {
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
      setIsShaking(true);
      
      setTimeout(() => {
        onAnswer(false, 0, config.tier);
        setIsShaking(false);
        setQuestionKey(k => k + 1);
        initializeRound();
      }, 400);
      return;
    }

    // Correct tap!
    playSound('correct');
    triggerHaptic('light');
    
    // Confetti burst
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    confetti({
      particleCount: 15,
      spread: 40,
      origin: { 
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
      colors: ['#00D4FF', '#FF00FF', '#FFD700'],
      scalar: 0.6,
    });

    // Mark cell as tapped
    setCells(prev => prev.map(c => 
      c.index === cellIndex ? { ...c, tapped: true, revealed: true } : c
    ));

    // Check if completed
    if (nextExpected === config.numberCount) {
      // Success!
      setTimeout(() => {
        onAnswer(true, Math.max(0, 10 - Math.floor(streak / 5)), config.tier);
        setQuestionKey(k => k + 1);
        initializeRound();
      }, 300);
    } else {
      setNextExpected(prev => prev + 1);
    }
  }, [cells, phase, nextExpected, config, onAnswer, playSound, triggerHaptic, onScreenShake, initializeRound, streak]);

  const getRotationLabel = (rotation: RotationType): string => {
    switch (rotation) {
      case 90: return '↻ 90°';
      case 180: return '↻ 180°';
      case 270: return '↻ 270°';
      default: return '';
    }
  };

  return (
    <motion.div
      animate={isShaking ? { x: [-8, 8, -8, 8, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col items-center justify-center px-4 py-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70 mb-2 flex items-center justify-center gap-2">
          {config.label}
          {config.rotation !== 0 && (
            <span className="px-2 py-0.5 rounded-full bg-neon-magenta/20 text-neon-magenta text-[10px] font-bold">
              {getRotationLabel(config.rotation)}
            </span>
          )}
        </div>
        
        <AnimatePresence mode="wait">
          {phase === 'showing' && (
            <motion.p
              key="memorize"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-secondary uppercase tracking-widest font-bold"
              style={{ color: 'hsl(var(--neon-magenta))', textShadow: '0 0 10px hsl(var(--neon-magenta) / 0.5)' }}
            >
              Memorize!
            </motion.p>
          )}
          {phase === 'rotating' && (
            <motion.p
              key="rotating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-neon-magenta uppercase tracking-widest font-bold"
            >
              Spatial Shift!
            </motion.p>
          )}
          {phase === 'playing' && (
            <motion.p
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-muted-foreground"
            >
              Tap <span className="text-primary font-black" style={{ textShadow: '0 0 10px hsl(var(--primary) / 0.5)' }}>{nextExpected}</span> → {config.numberCount}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Grid with Rotation */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={questionKey}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            rotate: gridRotation,
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ 
            rotate: { duration: 0.5, ease: 'easeInOut' },
            default: { duration: 0.3 },
          }}
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${config.gridCols}, 1fr)`,
            width: `${Math.min(config.gridCols * 56 + (config.gridCols - 1) * 8, 300)}px`,
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
                  rotate: -gridRotation, // Counter-rotate content
                }}
                transition={{ 
                  delay: cell.index * 0.02,
                  rotate: { duration: 0.5, ease: 'easeInOut' },
                }}
                whileHover={phase === 'playing' && !cell.tapped ? { scale: 1.08, borderColor: 'hsl(var(--primary))' } : {}}
                whileTap={phase === 'playing' && !cell.tapped ? { scale: 0.95 } : {}}
                onClick={(e) => handleCellTap(cell.index, e)}
                disabled={phase !== 'playing' || cell.tapped}
                className="aspect-square rounded-xl flex items-center justify-center text-2xl font-black font-mono transition-all duration-200 backdrop-blur-sm border-2"
                style={{
                  background: isTapped 
                    ? 'linear-gradient(145deg, hsl(var(--neon-gold) / 0.4), hsl(var(--neon-gold) / 0.2))'
                    : cell.revealed
                      ? 'linear-gradient(145deg, hsl(var(--neon-cyan) / 0.3), hsl(var(--neon-cyan) / 0.1))'
                      : 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.8))',
                  borderColor: isTapped 
                    ? 'hsl(var(--neon-gold))'
                    : cell.revealed 
                      ? 'hsl(var(--neon-cyan) / 0.8)' 
                      : 'hsl(var(--border) / 0.4)',
                  boxShadow: isActive
                    ? isTapped
                      ? '0 0 25px hsl(var(--neon-gold) / 0.5)'
                      : '0 0 20px hsl(var(--neon-cyan) / 0.4)'
                    : 'none',
                }}
              >
                <AnimatePresence mode="wait">
                  {isActive && cell.number && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="tabular-nums"
                      style={{
                        color: isTapped ? 'hsl(var(--neon-gold))' : 'hsl(var(--neon-cyan))',
                        textShadow: isTapped 
                          ? '0 0 15px hsl(var(--neon-gold) / 0.8)' 
                          : '0 0 15px hsl(var(--neon-cyan) / 0.8)',
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
      </AnimatePresence>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="mt-8 text-xs text-muted-foreground text-center uppercase tracking-wider"
      >
        {config.numberCount} numbers • {config.showTime}ms preview
        {config.rotation !== 0 && ` • ${config.rotation}° rotation`}
      </motion.p>
    </motion.div>
  );
};
