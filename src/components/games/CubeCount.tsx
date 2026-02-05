import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CubeCountProps {
  tier: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

export const CubeCount = ({ tier, onAnswer, playSound, triggerHaptic }: CubeCountProps) => {
  const [grid, setGrid] = useState<number[]>([]);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [options, setOptions] = useState<number[]>([]);

  const gridSize = tier <= 2 ? 3 : 4;

  useEffect(() => {
    const newGrid: number[] = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      newGrid.push(Math.floor(Math.random() * 3));
    }
    // Ensure at least one block exists
    const hasBlocks = newGrid.some(h => h > 0);
    if (!hasBlocks) {
      newGrid[0] = 1;
    }
    
    const actualHeights = newGrid.map(h => h + 1);
    const correctSum = actualHeights.reduce((a, b) => a + b, 0);
    
    setGrid(actualHeights);
    setTotalBlocks(correctSum);

    const opts = new Set([correctSum]);
    while (opts.size < 4) {
      opts.add(correctSum + Math.floor(Math.random() * 5) - 2);
    }
    setOptions(Array.from(opts).sort((a, b) => a - b).filter(n => n > 0));
  }, [tier, gridSize]);

  const handleGuess = (guess: number) => {
    if (guess === totalBlocks) {
      playSound('correct');
      triggerHaptic('light');
      onAnswer(true, 1, tier);
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      onAnswer(false, 0, tier);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4">
      {/* Isometric Grid Container */}
      <div 
        className="relative mb-8" 
        style={{ 
          transform: 'rotateX(60deg) rotateZ(-45deg)', 
          transformStyle: 'preserve-3d',
          width: gridSize === 3 ? '180px' : '220px',
          height: gridSize === 3 ? '180px' : '220px',
        }}
      >
        <div className={`grid ${gridSize === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-1`}>
          {grid.map((height, i) => (
            <div 
              key={i} 
              className="relative" 
              style={{ 
                transformStyle: 'preserve-3d',
                width: gridSize === 3 ? '56px' : '50px',
                height: gridSize === 3 ? '56px' : '50px',
              }}
            >
              {Array.from({ length: height }).map((_, hIndex) => (
                <motion.div
                  key={hIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (i * 0.02) + (hIndex * 0.05) }}
                  className="absolute inset-0 border border-border/30 bg-primary/80 shadow-lg rounded-sm"
                  style={{ 
                    transform: `translateZ(${hIndex * 14}px)`,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-4 opacity-60">
        Count all cubes
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[280px] z-10">
        {options.map(opt => (
          <motion.button
            key={opt}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleGuess(opt)}
            className="p-4 bg-card/40 border border-border/30 rounded-xl text-2xl font-bold hover:bg-primary hover:text-primary-foreground transition-colors backdrop-blur-sm"
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
