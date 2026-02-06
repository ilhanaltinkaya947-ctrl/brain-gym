import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CubeCountProps {
  tier: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

// ROBUST 3D CUBE COMPONENT
const SingleCube = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const SIZE = 40;
  const HALF = SIZE / 2;
  const translate = `translate3d(${x * SIZE}px, ${y * SIZE}px, ${z * SIZE}px)`;
  
  return (
    <div 
      className="absolute transition-all duration-300 ease-out"
      style={{ 
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        transformStyle: 'preserve-3d', 
        transform: translate, 
        zIndex: (x * 100) + (y * 100) + (z * 100) 
      }}
    >
      {/* TOP FACE (Bright White) */}
      <div 
        className="absolute inset-0 bg-white border-2 border-slate-300" 
        style={{ transform: `translateZ(${HALF}px)` }} 
      />
      
      {/* RIGHT FACE (Dark Shadow) */}
      <div 
        className="absolute inset-0 bg-slate-500 border-2 border-slate-600" 
        style={{ transform: `rotateY(90deg) translateZ(${HALF}px)` }} 
      />

      {/* FRONT FACE (Medium Shadow) */}
      <div 
        className="absolute inset-0 bg-slate-300 border-2 border-slate-400" 
        style={{ transform: `rotateX(-90deg) translateZ(${HALF}px)` }} 
      />
    </div>
  );
};

export const CubeCount = ({ tier, onAnswer, playSound, triggerHaptic }: CubeCountProps) => {
  const [cubes, setCubes] = useState<{x: number, y: number, z: number}[]>([]);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [options, setOptions] = useState<number[]>([]);

  useEffect(() => {
    const gridSize = tier <= 2 ? 3 : 4; 
    const maxHeight = tier <= 2 ? 3 : tier === 3 ? 4 : 5; 
    
    const newCubes: {x: number, y: number, z: number}[] = [];
    let count = 0;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        let height = Math.floor(Math.random() * maxHeight);
        if (x === 0 && y === 0 && height === 0) height = 1;
        for (let z = 0; z < height; z++) {
          newCubes.push({ x, y, z });
          count++;
        }
      }
    }

    setCubes(newCubes);
    setTotalBlocks(count);

    const opts = new Set([count]);
    while (opts.size < 4) {
      const variance = Math.max(2, Math.floor(count * 0.2));
      const val = count + Math.floor(Math.random() * (variance * 2)) - variance;
      if (val > 0 && val !== count) opts.add(val);
    }
    while (opts.size < 4) opts.add(count + opts.size + 1);
    setOptions(Array.from(opts).sort((a, b) => a - b));
  }, [tier]);

  const handleGuess = (val: number) => {
    if (val === totalBlocks) {
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
    <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden bg-black/20">
      
      {/* 3D SCENE CONTAINER */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-8" style={{ perspective: '1000px' }}>
        <div 
          className="relative w-full h-full"
          style={{ 
            transformStyle: 'preserve-3d', 
            transform: 'rotateX(60deg) rotateZ(45deg) scale(0.8)',
            marginLeft: '-15%', 
            marginTop: '-15%'
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.3 }}
          >
            {cubes.map((c, i) => (
              <SingleCube key={i} x={c.x} y={c.y} z={c.z} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Answer Buttons */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-md z-10 px-4">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleGuess(opt)}
            className="h-16 bg-card/80 border border-white/10 backdrop-blur rounded-2xl text-2xl font-black shadow-lg hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
      
      <p className="mt-6 text-xs text-muted-foreground font-mono uppercase tracking-widest opacity-60">
        Count the blocks
      </p>
    </div>
  );
};
