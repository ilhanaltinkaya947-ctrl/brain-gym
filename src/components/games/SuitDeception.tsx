import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface SuitDeceptionProps {
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  streak?: number;
}

type SuitType = 'heart' | 'diamond' | 'club' | 'spade';

interface CardCell {
  suit: SuitType;
  isImposter: boolean;
  selected: boolean;
}

// Suit SVG paths for cleaner rendering
const SUIT_ICONS: Record<SuitType, string> = {
  heart: '♥',
  diamond: '♦',
  club: '♣',
  spade: '♠',
};

// Visual pairs that look similar
const SIMILAR_PAIRS: [SuitType, SuitType][] = [
  ['heart', 'spade'],    // Same shape, inverted
  ['diamond', 'heart'],  // Pointed shapes
  ['club', 'spade'],     // Both black-style shapes
];

const getDifficultyConfig = (streak: number) => {
  if (streak < 6) {
    return { gridSize: 3, imposterCount: 1, tier: 1, timeLimit: 8000, label: 'TIER 1' };
  } else if (streak < 15) {
    return { gridSize: 4, imposterCount: 1, tier: 2, timeLimit: 6000, label: 'TIER 2' };
  } else if (streak < 25) {
    return { gridSize: 5, imposterCount: 2, tier: 3, timeLimit: 5000, label: 'ADVANCED' };
  } else {
    return { gridSize: 6, imposterCount: 3, tier: 4, timeLimit: 4000, label: 'GOD TIER' };
  }
};

export const SuitDeception = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  streak = 0,
}: SuitDeceptionProps) => {
  const [grid, setGrid] = useState<CardCell[]>([]);
  const [config, setConfig] = useState(() => getDifficultyConfig(streak));
  const [impostersFound, setImpostersFound] = useState(0);
  const [wrongSelections, setWrongSelections] = useState(0);
  const [questionKey, setQuestionKey] = useState(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [suitColor, setSuitColor] = useState<'red' | 'black'>('red');
  
  const questionStartTime = useRef(Date.now());
  const isProcessing = useRef(false);

  // Generate puzzle
  const generatePuzzle = useCallback(() => {
    const { gridSize, imposterCount } = getDifficultyConfig(streak);
    const totalCells = gridSize * gridSize;
    
    // Pick color (all suits will be this color)
    const color: 'red' | 'black' = Math.random() > 0.5 ? 'red' : 'black';
    setSuitColor(color);
    
    // Pick main suit type based on color
    const mainSuits: SuitType[] = color === 'red' ? ['heart', 'diamond'] : ['club', 'spade'];
    const mainSuit = mainSuits[Math.floor(Math.random() * mainSuits.length)];
    
    // Pick imposter suit (visually similar)
    const imposterSuits = mainSuits.filter(s => s !== mainSuit);
    const imposterSuit = imposterSuits[0] || (color === 'red' ? 'diamond' : 'club');
    
    // Create grid with all main suits
    const newGrid: CardCell[] = Array.from({ length: totalCells }, () => ({
      suit: mainSuit,
      isImposter: false,
      selected: false,
    }));
    
    // Place imposters randomly
    const imposterPositions = new Set<number>();
    while (imposterPositions.size < imposterCount) {
      imposterPositions.add(Math.floor(Math.random() * totalCells));
    }
    
    imposterPositions.forEach(pos => {
      newGrid[pos] = {
        suit: imposterSuit,
        isImposter: true,
        selected: false,
      };
    });
    
    setGrid(newGrid);
    setConfig(getDifficultyConfig(streak));
    setImpostersFound(0);
    setWrongSelections(0);
    questionStartTime.current = Date.now();
    isProcessing.current = false;
  }, [streak]);

  useEffect(() => {
    generatePuzzle();
  }, []);

  const handleCellTap = useCallback((index: number) => {
    if (isProcessing.current || grid[index].selected) return;
    
    const cell = grid[index];
    
    // Mark as selected
    setGrid(prev => prev.map((c, i) => 
      i === index ? { ...c, selected: true } : c
    ));
    
    if (cell.isImposter) {
      // Correct - found an imposter!
      playSound('correct');
      triggerHaptic('light');
      
      const rect = document.querySelector(`[data-cell="${index}"]`)?.getBoundingClientRect();
      if (rect) {
        confetti({
          particleCount: 15,
          spread: 30,
          origin: { 
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
          colors: suitColor === 'red' ? ['#FF4444', '#FF6666', '#FFD700'] : ['#4444FF', '#6666FF', '#FFD700'],
          scalar: 0.6,
        });
      }
      
      const newFound = impostersFound + 1;
      setImpostersFound(newFound);
      
      // Check if all imposters found
      if (newFound >= config.imposterCount) {
        isProcessing.current = true;
        setShowFeedback('correct');
        
        const responseTime = Date.now() - questionStartTime.current;
        const speedBonus = Math.max(0, Math.floor((config.timeLimit - responseTime) / 200));
        
        setTimeout(() => {
          onAnswer(true, speedBonus, config.tier);
          setShowFeedback(null);
          setQuestionKey(k => k + 1);
          generatePuzzle();
        }, 300);
      }
    } else {
      // Wrong - selected a non-imposter
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
      
      const newWrong = wrongSelections + 1;
      setWrongSelections(newWrong);
      
      // Allow 1 mistake at tier 1-2, 0 mistakes at tier 3+
      const maxMistakes = config.tier <= 2 ? 1 : 0;
      
      if (newWrong > maxMistakes) {
        isProcessing.current = true;
        setShowFeedback('wrong');
        
        setTimeout(() => {
          onAnswer(false, 0, config.tier);
          setShowFeedback(null);
          setQuestionKey(k => k + 1);
          generatePuzzle();
        }, 400);
      }
    }
  }, [grid, impostersFound, wrongSelections, config, onAnswer, playSound, triggerHaptic, onScreenShake, generatePuzzle, suitColor]);

  const suitColorHsl = suitColor === 'red' ? 'hsl(0, 80%, 55%)' : 'hsl(220, 15%, 25%)';

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-6">
      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70 mb-2">
          {config.label}
        </div>
        <div className="text-sm text-muted-foreground">
          Find {config.imposterCount === 1 ? 'the imposter' : `all ${config.imposterCount} imposters`}
        </div>
        {config.imposterCount > 1 && (
          <div className="text-xs text-neon-gold mt-1 font-mono tabular-nums">
            {impostersFound} / {config.imposterCount} found
          </div>
        )}
      </motion.div>

      {/* Card Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={questionKey}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
            width: `${Math.min(config.gridSize * 56 + (config.gridSize - 1) * 8, 340)}px`,
          }}
        >
          {grid.map((cell, index) => (
            <motion.button
              key={index}
              data-cell={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                backgroundColor: cell.selected 
                  ? cell.isImposter 
                    ? 'hsl(var(--neon-gold) / 0.3)'
                    : 'hsl(var(--destructive) / 0.3)'
                  : 'hsl(var(--card))',
              }}
              transition={{ delay: index * 0.02 }}
              whileHover={!cell.selected ? { scale: 1.1, borderColor: 'hsl(var(--primary))' } : {}}
              whileTap={!cell.selected ? { scale: 0.95 } : {}}
              onClick={() => handleCellTap(index)}
              disabled={cell.selected}
              className="aspect-square rounded-xl flex items-center justify-center text-3xl font-bold border-2 transition-all"
              style={{
                borderColor: cell.selected 
                  ? cell.isImposter 
                    ? 'hsl(var(--neon-gold))'
                    : 'hsl(var(--destructive))'
                  : 'hsl(var(--border) / 0.5)',
                color: suitColorHsl,
                fontSize: config.gridSize >= 5 ? '1.25rem' : '1.75rem',
                boxShadow: cell.selected && cell.isImposter 
                  ? '0 0 20px hsl(var(--neon-gold) / 0.5)' 
                  : 'none',
              }}
            >
              {SUIT_ICONS[cell.suit]}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Feedback overlay */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            style={{
              background: showFeedback === 'correct' 
                ? 'radial-gradient(circle, hsl(var(--neon-gold) / 0.2), transparent 70%)'
                : 'radial-gradient(circle, hsl(var(--destructive) / 0.3), transparent 70%)',
            }}
          >
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl"
            >
              {showFeedback === 'correct' ? '✓' : '✗'}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="mt-8 text-xs text-muted-foreground text-center uppercase tracking-wider"
      >
        All {suitColor} • Find the different shape
      </motion.p>
    </div>
  );
};
