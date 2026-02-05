import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CubeCountProps {
  tier: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

const SingleCube = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const translate = `translate3d(${x * 50}px, ${y * 50}px, ${z * 50}px)`;
  return (
    <div 
      className="absolute w-12 h-12"
      style={{ transformStyle: 'preserve-3d', transform: translate, zIndex: (x + y + z) }}
    >
      <div className="absolute inset-0 bg-primary/90 border border-white/20" style={{ transform: 'translateZ(24px)' }} />
      <div className="absolute inset-0 bg-primary/60 border border-white/20" style={{ transform: 'rotateX(-90deg) translateZ(24px)', height: '100%' }} />
      <div className="absolute inset-0 bg-primary/40 border border-white/20" style={{ transform: 'rotateY(90deg) translateZ(24px)', width: '100%' }} />
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
      const val = count + Math.floor(Math.random() * 5) - 2;
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
      <div className="relative w-64 h-64 flex items-center justify-center mb-10">
        <div 
          className="relative w-full h-full" 
          style={{ 
            transformStyle: 'preserve-3d', 
            transform: 'rotateX(60deg) rotateZ(45deg) scale(0.8)', 
            marginLeft: '-20px', 
            marginTop: '-50px' 
          }}
        >
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
            {cubes.map((c, i) => <SingleCube key={i} x={c.x} y={c.y} z={c.z} />)}
          </motion.div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 w-full max-w-md z-10 px-4">
        {options.map(opt => (
          <button 
            key={opt} 
            onClick={() => handleGuess(opt)} 
            className="h-16 bg-card/80 border border-white/10 backdrop-blur rounded-2xl text-2xl font-black hover:bg-primary hover:text-primary-foreground transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};
