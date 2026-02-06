import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';

interface CubeCountProps {
  tier: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

// VISUAL COMPONENT: BLUE 3D CUBE
const SingleCube = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const SIZE = 44;
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
      {/* TOP FACE (Brightest / Light Source) */}
      <div 
        className="absolute inset-0 bg-[#22d3ee] border border-white/30" 
        style={{ transform: `translateZ(${HALF}px)` }} 
      />
      
      {/* RIGHT FACE (Darkest / Shadow) */}
      <div 
        className="absolute inset-0 bg-[#0369a1] border border-white/30" 
        style={{ transform: `rotateY(90deg) translateZ(${HALF}px)` }} 
      />

      {/* FRONT FACE (Medium / Base Color) */}
      <div 
        className="absolute inset-0 bg-[#0ea5e9] border border-white/30" 
        style={{ transform: `rotateX(-90deg) translateZ(${HALF}px)` }} 
      />
    </div>
  );
};

export const CubeCount = memo(({ tier, onAnswer, playSound, triggerHaptic }: CubeCountProps) => {
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
      playSound('correct'); triggerHaptic('light'); onAnswer(true, 1, tier);
    } else {
      playSound('wrong'); triggerHaptic('heavy'); onAnswer(false, 0, tier);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden bg-gradient-to-b from-black/20 to-black/60">
      
      {/* 3D SCENE WRAPPER */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-10" style={{ perspective: '1200px' }}>
        <div 
          className="relative w-full h-full"
          style={{ 
            transformStyle: 'preserve-3d', 
            transform: 'rotateX(60deg) rotateZ(45deg) scale(0.85)',
            marginLeft: '-15%', 
            marginTop: '-15%'
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, z: -100 }}
            animate={{ opacity: 1, scale: 1, z: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            {cubes.map((c, i) => (
              <SingleCube key={i} x={c.x} y={c.y} z={c.z} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* ANSWER BUTTONS */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-md z-10 px-4">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleGuess(opt)}
            className="h-16 bg-card/80 border border-white/10 backdrop-blur rounded-2xl text-2xl font-black shadow-lg hover:bg-cyan-500 hover:text-white hover:border-cyan-400 active:scale-95 transition-all"
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
});
