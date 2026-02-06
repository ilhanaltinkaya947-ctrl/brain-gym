import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface SpatialStackProps {
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  cubeCount?: number;
  tier?: number;
}

interface Cube {
  x: number;
  y: number;
  z: number;
}

interface Question {
  visibleCubes: Cube[];
  totalCount: number;
}

// Generate isometric cube stack
const generateStack = (targetCount: number): Question => {
  const cubes: Cube[] = [];
  
  // Generate a random stack configuration
  // Start with base layer, then add upper layers
  const maxWidth = Math.min(3, Math.ceil(Math.sqrt(targetCount)));
  const maxDepth = Math.min(3, Math.ceil(Math.sqrt(targetCount)));
  
  // Fill bottom layer first
  for (let x = 0; x < maxWidth && cubes.length < targetCount; x++) {
    for (let y = 0; y < maxDepth && cubes.length < targetCount; y++) {
      if (Math.random() > 0.2 || cubes.length === 0) { // Some randomness
        cubes.push({ x, y, z: 0 });
      }
    }
  }
  
  // Add upper layers (must have support)
  for (let z = 1; z <= 2 && cubes.length < targetCount; z++) {
    for (let x = 0; x < maxWidth && cubes.length < targetCount; x++) {
      for (let y = 0; y < maxDepth && cubes.length < targetCount; y++) {
        // Check if there's support below
        const hasSupport = cubes.some(c => c.x === x && c.y === y && c.z === z - 1);
        if (hasSupport && Math.random() > 0.4) {
          cubes.push({ x, y, z });
        }
      }
    }
  }
  
  return {
    visibleCubes: cubes,
    totalCount: cubes.length,
  };
};

// Convert 3D position to 2D isometric position
const toIsometric = (x: number, y: number, z: number, size: number) => {
  const isoX = (x - y) * size * 0.866;
  const isoY = (x + y) * size * 0.5 - z * size;
  return { isoX, isoY };
};

export const SpatialStack = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  cubeCount = 5,
}: SpatialStackProps) => {
  const [question, setQuestion] = useState<Question>(() => generateStack(cubeCount));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [questionKey, setQuestionKey] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);

  const questionStartTime = useRef(Date.now());
  const isProcessing = useRef(false);

  // Sort cubes for proper rendering order (back to front, bottom to top)
  const sortedCubes = useMemo(() => {
    return [...question.visibleCubes].sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z;
      return (a.x + a.y) - (b.x + b.y);
    });
  }, [question.visibleCubes]);

  const handleAnswerSelect = useCallback((answer: number) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    setSelectedAnswer(answer);
    
    const responseTime = Date.now() - questionStartTime.current;
    const speedBonus = Math.max(0, Math.floor((8000 - responseTime) / 100));
    
    const isCorrect = answer === question.totalCount;

    if (isCorrect) {
      playSound('correct');
      triggerHaptic('light');
      setLastFeedback('correct');
      
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#00FF00', '#32CD32', '#7CFC00'],
        scalar: 0.8,
      });
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
      setLastFeedback('wrong');
    }

    onAnswer(isCorrect, speedBonus);

    // Next question
    setTimeout(() => {
      setQuestion(generateStack(cubeCount));
      setSelectedAnswer(null);
      setQuestionKey(k => k + 1);
      questionStartTime.current = Date.now();
      setLastFeedback(null);
      isProcessing.current = false;
    }, 300);
  }, [question.totalCount, cubeCount, onAnswer, playSound, triggerHaptic, onScreenShake]);

  // Keyboard support (1-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        handleAnswerSelect(num);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswerSelect]);

  const cubeSize = 30;
  const baseColor = { h: 140, s: 70, l: 45 };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8">
      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-game-pattern/70 mb-2">
          Spatial Stack
        </div>
        <div className="text-sm text-muted-foreground">
          Count ALL cubes (including hidden ones)
        </div>
      </motion.div>

      {/* Isometric Cube Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={questionKey}
          initial={{ opacity: 0, scale: 0.9, rotateY: -30 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            rotateY: 0,
            boxShadow: lastFeedback === 'correct' 
              ? '0 0 50px hsl(140, 70%, 45% / 0.5)' 
              : lastFeedback === 'wrong'
              ? '0 0 50px hsl(0, 70%, 50% / 0.5)'
              : '0 0 25px hsl(140, 70%, 45% / 0.2)',
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-64 h-56 mb-8 rounded-2xl border border-border/30 bg-card/30 flex items-center justify-center"
        >
          <svg width="200" height="180" viewBox="-80 -60 160 140">
            {sortedCubes.map((cube, i) => {
              const { isoX, isoY } = toIsometric(cube.x, cube.y, cube.z, cubeSize);
              const s = cubeSize;
              
              // Isometric cube faces
              const topFace = `
                M ${isoX} ${isoY - s * 0.5}
                L ${isoX + s * 0.866} ${isoY}
                L ${isoX} ${isoY + s * 0.5}
                L ${isoX - s * 0.866} ${isoY}
                Z
              `;
              
              const leftFace = `
                M ${isoX - s * 0.866} ${isoY}
                L ${isoX} ${isoY + s * 0.5}
                L ${isoX} ${isoY + s * 1.5}
                L ${isoX - s * 0.866} ${isoY + s}
                Z
              `;
              
              const rightFace = `
                M ${isoX + s * 0.866} ${isoY}
                L ${isoX} ${isoY + s * 0.5}
                L ${isoX} ${isoY + s * 1.5}
                L ${isoX + s * 0.866} ${isoY + s}
                Z
              `;

              return (
                <g key={`cube-${i}`}>
                  <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    d={leftFace}
                    fill={`hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l - 15}%)`}
                    stroke={`hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l - 25}%)`}
                    strokeWidth="1"
                  />
                  <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    d={rightFace}
                    fill={`hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l - 5}%)`}
                    stroke={`hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l - 20}%)`}
                    strokeWidth="1"
                  />
                  <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    d={topFace}
                    fill={`hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l + 10}%)`}
                    stroke={`hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l}%)`}
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </svg>
        </motion.div>
      </AnimatePresence>

      {/* Number Pad */}
      <div className="grid grid-cols-5 gap-2 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAnswerSelect(num)}
            disabled={isProcessing.current}
            className={`h-12 rounded-xl text-lg font-bold border-2 transition-all ${
              selectedAnswer === num
                ? num === question.totalCount
                  ? 'border-success bg-success/20 text-success'
                  : 'border-destructive bg-destructive/20 text-destructive'
                : ''
            }`}
            style={selectedAnswer !== num ? {
              background: 'linear-gradient(135deg, hsl(140, 70%, 45% / 0.15), hsl(140, 70%, 45% / 0.05))',
              borderColor: 'hsl(140, 70%, 45% / 0.4)',
              color: 'hsl(140, 70%, 55%)',
            } : {}}
          >
            {num}
          </motion.button>
        ))}
      </div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="mt-6 text-xs text-muted-foreground text-center uppercase tracking-wider"
      >
        Press number keys 1-9
      </motion.p>
    </div>
  );
};
