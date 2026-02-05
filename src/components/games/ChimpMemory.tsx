import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ChimpMemoryProps {
  tier: number;
  streak: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

interface Cell { 
  index: number; 
  number: number | null; 
  revealed: boolean; 
  tapped: boolean; 
  isError?: boolean; 
}

const GRID_SIZE = 25;

export const ChimpMemory = ({ tier, streak, onAnswer, playSound, triggerHaptic }: ChimpMemoryProps) => {
  const [cells, setCells] = useState<Cell[]>([]);
  const [phase, setPhase] = useState<'showing' | 'hiding' | 'playing'>('showing');
  const [nextExpected, setNextExpected] = useState(1);
  const [gridRotation, setGridRotation] = useState(0);

  const getDifficultyConfig = (t: number) => {
    switch (t) {
      case 1: return { count: 3, showTime: 1200, rotate: 0 };
      case 2: return { count: 4, showTime: 1000, rotate: 0 };
      case 3: return { count: 5, showTime: 900, rotate: 90 };
      case 4: return { count: 6, showTime: 800, rotate: 180 };
      case 5: return { count: 7, showTime: 600, rotate: 270 };
      default: return { count: 3, showTime: 1000, rotate: 0 };
    }
  };

  const initializeRound = useCallback(() => {
    const config = getDifficultyConfig(tier);
    const newCells: Cell[] = Array.from({ length: GRID_SIZE }, (_, index) => ({ 
      index, 
      number: null, 
      revealed: false, 
      tapped: false 
    }));
    
    const indices = Array.from({ length: GRID_SIZE }, (_, i) => i).sort(() => Math.random() - 0.5);
    for (let i = 0; i < config.count; i++) {
      newCells[indices[i]] = { ...newCells[indices[i]], number: i + 1, revealed: true };
    }
    
    setCells(newCells);
    setPhase('showing');
    setNextExpected(1);
    setGridRotation(0);
    
    setTimeout(() => {
      setPhase('hiding');
      setCells(prev => prev.map(c => ({ ...c, revealed: false })));
      if (config.rotate > 0) {
        setTimeout(() => { 
          setGridRotation(config.rotate); 
          setPhase('playing'); 
        }, 200);
      } else {
        setPhase('playing');
      }
    }, config.showTime);
  }, [tier, streak]);

  useEffect(() => { initializeRound(); }, [initializeRound]);

  const handleCellTap = (index: number) => {
    if (phase !== 'playing') return;
    const cell = cells[index];
    if (cell.tapped) return;
    
    if (cell.number === null || cell.number !== nextExpected) {
      playSound('wrong'); 
      triggerHaptic('heavy');
      setCells(prev => prev.map(c => c.index === index ? { ...c, isError: true, revealed: true } : c));
      setTimeout(() => onAnswer(false, 0, tier), 500);
      return;
    }
    
    playSound('correct'); 
    triggerHaptic('light');
    const updatedCells = cells.map(c => c.index === index ? { ...c, tapped: true, revealed: true } : c);
    setCells(updatedCells);
    
    if (nextExpected === getDifficultyConfig(tier).count) {
      setTimeout(() => onAnswer(true, 1.0, tier), 300);
    } else {
      setNextExpected(prev => prev + 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <motion.div 
        className="grid grid-cols-5 gap-2 w-full max-w-[320px] aspect-square" 
        animate={{ rotate: gridRotation }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {cells.map((cell) => (
          <motion.button
            key={cell.index}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleCellTap(cell.index)}
            style={{ rotate: -gridRotation }}
            className={`rounded-xl flex items-center justify-center text-2xl font-bold transition-all aspect-square 
              ${cell.revealed && cell.number ? 'bg-primary text-primary-foreground' : 'bg-white/5'} 
              ${cell.tapped ? 'bg-primary/60' : ''}
              ${cell.isError ? 'bg-destructive animate-shake' : ''}`}
          >
            {(cell.revealed || cell.tapped) && cell.number}
          </motion.button>
        ))}
      </motion.div>
      <div className="mt-6 text-xs text-muted-foreground font-mono tracking-widest uppercase">
        {phase === 'showing' ? 'Memorize' : 'Find the sequence'}
      </div>
    </div>
  );
};
