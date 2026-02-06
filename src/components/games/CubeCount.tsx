import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CubeCountProps {
  tier: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

// 3D CUBE COMPONENT
// Renders Top, Right, and Front faces with different brightness to simulate lighting.
const SingleCube = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const translate = `translate3d(${x * 44}px, ${y * 44}px, ${z * 44}px)`;
  
  return (
    <div 
      className="absolute w-11 h-11 transition-all duration-300 ease-out"
      style={{ 
        transformStyle: 'preserve-3d', 
        transform: translate, 
        zIndex: (x * 10) + (y * 10) + (z * 10) 
      }}
    >
      {/* TOP FACE (Brightest) */}
      <div 
        className="absolute inset-0 bg-[#FFFFFF] border border-black/10" 
        style={{ transform: 'translateZ(22px)' }} 
      />
      
      {/* RIGHT FACE (Medium Dark) */}
      <div 
        className="absolute inset-0 bg-[#A0A0A0] border border-black/10" 
        style={{ transform: 'rotateY(90deg) translateZ(22px)' }} 
      />

      {/* FRONT FACE (Darkest) */}
      <div 
        className="absolute inset-0 bg-[#D4D4D4] border border-black/10" 
        style={{ transform: 'rotateX(-90deg) translateZ(22px)' }} 
      />
    </div>
  );
};

export const CubeCount = ({ tier, onAnswer, playSound, triggerHaptic }: CubeCountProps) => {
  const [cubes, setCubes] = useState<{x: number, y: number, z: number}[]>([]);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [options, setOptions] = useState<number[]>([]);

  useEffect(() => {
    // Logic: Tier 1-2 = 3x3 grid, Tier 3+ = 4x4 grid
    const gridSize = tier <= 2 ? 3 : 4; 
    const maxHeight = tier <= 2 ? 3 : tier === 3 ? 4 : 5;
    
    const newCubes: {x: number, y: number, z: number}[] = [];
    let count = 0;

    // Generate stacks from back-to-front for better rendering
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        let height = Math.floor(Math.random() * maxHeight);
        
        // Ensure at least one block exists at 0,0 if empty
        if (x === 0 && y === 0 && height === 0) height = 1;

        // Create a cube for each unit of height
        for (let z = 0; z < height; z++) {
          newCubes.push({ x, y, z });
          count++;
        }
      }
    }

    setCubes(newCubes);
    setTotalBlocks(count);

    // Generate 4 answer options
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
    <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
      
      {/* 3D Viewport */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        <div 
          className="relative w-full h-full"
          style={{ 
            transformStyle: 'preserve-3d', 
            transform: 'rotateX(55deg) rotateZ(45deg) scale(0.8)',
            marginLeft: '-10%', 
            marginTop: '-10%'
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
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
