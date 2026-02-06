import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';

interface CubeCountProps {
  tier: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

// HIGH-CONTRAST 3D CUBE with shadows and staggered animation
const SingleCube = ({ x, y, z, delay }: { x: number; y: number; z: number; delay: number }) => {
  const SIZE = 40;
  const HALF = SIZE / 2;
  
  // Isometric positioning
  const translate = `translate3d(${x * SIZE}px, ${y * SIZE}px, ${z * SIZE}px)`;
  
  // Proper depth sorting: higher x + y + z = in front
  const sortOrder = (x + y) * 10 + z * 100;
  
  return (
    <motion.div 
      className="absolute"
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ 
        delay, 
        type: 'spring', 
        stiffness: 500, 
        damping: 30 
      }}
      style={{ 
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        transformStyle: 'preserve-3d', 
        transform: translate, 
        zIndex: sortOrder,
      }}
    >
      {/* TOP FACE - Brightest (Light source from above) */}
      <div 
        className="absolute inset-0"
        style={{ 
          transform: `translateZ(${HALF}px)`,
          background: 'linear-gradient(135deg, #67e8f9 0%, #22d3ee 100%)',
          boxShadow: 'inset 0 0 8px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
        }} 
      />
      
      {/* RIGHT FACE - Darkest (Shadow side) */}
      <div 
        className="absolute inset-0"
        style={{ 
          transform: `rotateY(90deg) translateZ(${HALF}px)`,
          background: 'linear-gradient(180deg, #0369a1 0%, #0c4a6e 100%)',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
          border: '1px solid rgba(0,0,0,0.2)',
        }} 
      />

      {/* FRONT FACE - Medium (Base color) */}
      <div 
        className="absolute inset-0"
        style={{ 
          transform: `rotateX(-90deg) translateZ(${HALF}px)`,
          background: 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)',
          boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.15), inset 0 -2px 6px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.15)',
        }} 
      />
    </motion.div>
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

    // Sort cubes for proper rendering order (back to front)
    newCubes.sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z));

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
    <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
      
      {/* 3D SCENE WRAPPER */}
      <div 
        className="relative w-64 h-64 flex items-center justify-center mb-8" 
        style={{ perspective: '800px' }}
      >
        <div 
          className="relative w-full h-full"
          style={{ 
            transformStyle: 'preserve-3d', 
            // Lower angle (50deg) shows more of the cube walls
            transform: 'rotateX(50deg) rotateZ(45deg) scale(0.9)',
            marginLeft: '-10%', 
            marginTop: '-20%'
          }}
        >
          <div style={{ transformStyle: 'preserve-3d' }}>
            {cubes.map((c, i) => (
              <SingleCube 
                key={`${c.x}-${c.y}-${c.z}-${i}`} 
                x={c.x} 
                y={c.y} 
                z={c.z} 
                delay={i * 0.01} // Ultra-fast stagger: ~0.3s for 30 cubes
              />
            ))}
          </div>
        </div>
      </div>

      {/* ANSWER BUTTONS */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-xs z-10 px-4">
        {options.map(opt => (
          <motion.button
            key={opt}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleGuess(opt)}
            className="h-14 bg-card/60 border border-border/30 backdrop-blur-sm rounded-2xl text-xl font-bold shadow-lg hover:bg-primary hover:text-primary-foreground hover:border-primary/50 active:scale-95 transition-all"
          >
            {opt}
          </motion.button>
        ))}
      </div>
      
      <p className="mt-4 text-xs text-muted-foreground/60 font-mono uppercase tracking-widest">
        Count all blocks
      </p>
    </div>
  );
});
