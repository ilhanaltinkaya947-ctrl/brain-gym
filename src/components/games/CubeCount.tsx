import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CubeCountProps {
  tier: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

// Single 3D Cube Component
const SingleCube = ({ x, y, z }: { x: number; y: number; z: number }) => {
  // Isometric offset calculations
  // We use CSS transforms to position cubes in 3D space
  const translate = `translate3d(${x * 50}px, ${y * 50}px, ${z * 50}px)`;

  return (
    <div 
      className="absolute w-12 h-12 transition-all duration-500"
      style={{ 
        transformStyle: 'preserve-3d', 
        transform: translate,
        // Z-index ensures correct rendering order (back to front)
        zIndex: (x + y + z) 
      }}
    >
      {/* TOP FACE (Lightest) */}
      <div className="absolute inset-0 bg-primary/90 border border-white/20" 
           style={{ transform: 'translateZ(24px)' }} />
      
      {/* FRONT FACE (Medium) */}
      <div className="absolute inset-0 bg-primary/60 border border-white/20" 
           style={{ transform: 'rotateX(-90deg) translateZ(24px)', height: '100%' }} />

      {/* RIGHT FACE (Darkest) */}
      <div className="absolute inset-0 bg-primary/40 border border-white/20" 
           style={{ transform: 'rotateY(90deg) translateZ(24px)', width: '100%' }} />
    </div>
  );
};

export const CubeCount = ({ tier, onAnswer, playSound, triggerHaptic }: CubeCountProps) => {
  const [cubes, setCubes] = useState<{x: number, y: number, z: number}[]>([]);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [options, setOptions] = useState<number[]>([]);

  useEffect(() => {
    // 1. Config based on Tier
    const gridSize = tier <= 2 ? 3 : 4; // 3x3 or 4x4 base
    const maxHeight = tier <= 2 ? 3 : tier === 3 ? 4 : 5; 
    
    // 2. Generate Stacks (Height Map)
    // We start from back (0,0) to front to ensure correct visual stacking
    const newCubes: {x: number, y: number, z: number}[] = [];
    let count = 0;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        // Random height for this stack (0 to maxHeight)
        // Ensure center stacks are generally taller for "hidden" effect
        let height = Math.floor(Math.random() * maxHeight);
        
        // Ensure at least one block exists in the grid
        if (x === 0 && y === 0 && height === 0) height = 1;

        for (let z = 0; z < height; z++) {
          newCubes.push({ x, y, z });
          count++;
        }
      }
    }

    setCubes(newCubes);
    setTotalBlocks(count);

    // 3. Generate Options
    const opts = new Set([count]);
    while (opts.size < 4) {
      const offset = Math.floor(Math.random() * 5) - 2; // +/- 2
      const val = count + offset;
      if (val > 0 && val !== count) opts.add(val);
    }
    // Fill remaining if needed
    while (opts.size < 4) opts.add(count + opts.size + 1);
    
    setOptions(Array.from(opts).sort((a, b) => a - b));
  }, [tier]);

  const handleGuess = (val: number) => {
    if (val === totalBlocks) {
      playSound('correct'); triggerHaptic('light');
      onAnswer(true, 1, tier);
    } else {
      playSound('wrong'); triggerHaptic('heavy');
      onAnswer(false, 0, tier);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
      
      {/* 3D SCENE CONTAINER */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-10">
        {/* The Camera / World Pivot */}
        <div 
          className="relative w-full h-full"
          style={{ 
            transformStyle: 'preserve-3d', 
            // Isometric Angle: Rotate X to look down, Rotate Z to spin
            transform: 'rotateX(60deg) rotateZ(45deg) scale(0.8)',
            // Center the grid
            marginLeft: '-20px', 
            marginTop: '-50px'
          }}
        >
          <motion.div 
             initial={{ opacity: 0, scale: 0.5 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ type: 'spring' }}
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
            className="h-16 bg-card/80 border border-white/10 backdrop-blur rounded-2xl text-2xl font-black shadow-lg hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all"
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
