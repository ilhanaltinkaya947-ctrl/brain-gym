import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface NeuralCoreProps {
  size?: number;
  brainCharge?: number;
}

// Helper to create organic curved paths (Bézier)
const createDendritePath = (angle: number, length: number, curvature: number) => {
  const endX = Math.cos(angle) * length;
  const endY = Math.sin(angle) * length;
  
  // Control points for the curve to make it look organic
  const cp1X = Math.cos(angle - curvature) * (length * 0.4);
  const cp1Y = Math.sin(angle - curvature) * (length * 0.4);
  const cp2X = Math.cos(angle + curvature) * (length * 0.7);
  const cp2Y = Math.sin(angle + curvature) * (length * 0.7);

  return `M 0 0 C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
};

export const NeuralCore = ({ size = 300, brainCharge = 50 }: NeuralCoreProps) => {
  // Generate random dendrites only once on mount
  const dendrites = useMemo(() => {
    const branches = [];
    const count = 12; // Number of main branches
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const length = 100 + Math.random() * 40;
      const curvature = 0.2 + Math.random() * 0.3;
      
      // Main branch
      branches.push({
        d: createDendritePath(angle, length, curvature),
        width: 3 + Math.random(),
        delay: Math.random() * 2,
        length,
        angle
      });

      // Sub-branches (smaller tendrils splitting off)
      const subCount = 2;
      for (let j = 0; j < subCount; j++) {
        const subAngle = angle + (Math.random() - 0.5) * 0.8;
        const subLength = length * (0.6 + Math.random() * 0.4);
        branches.push({
          d: createDendritePath(subAngle, subLength, -curvature),
          width: 1 + Math.random(),
          delay: Math.random() * 2 + 1,
          isSub: true
        });
      }
    }
    return branches;
  }, []);

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="-150 -150 300 300"
        className="overflow-visible"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Definition for the glowing gradient */}
        <defs>
          <radialGradient id="neuronGradient" cx="0" cy="0" r="100%" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="20%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render Dendrites (Branches) */}
        {dendrites.map((branch, i) => (
          <g key={i}>
            {/* The Path itself */}
            <motion.path
              d={branch.d}
              stroke="url(#neuronGradient)"
              strokeWidth={branch.width}
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0.8, 1, 0.8], 
                opacity: branch.isSub ? 0.6 : 0.9 
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: branch.delay
              }}
            />
            
            {/* Synaptic Terminal (Glowing dot at the tip) */}
            <motion.circle
              r={branch.isSub ? 2 : 4}
              fill="#fff"
              filter="url(#glow)"
              style={{ offsetPath: `path('${branch.d}')`, offsetDistance: "100%" }}
              animate={{
                scale: [0.8, 1.5, 0.8],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: branch.delay
              }}
            />
          </g>
        ))}

        {/* Central Soma (The Body) */}
        <motion.circle
          cx="0"
          cy="0"
          r="25"
          fill="url(#neuronGradient)"
          filter="url(#glow)"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Inner intense core */}
        <motion.circle
          cx="0"
          cy="0"
          r="12"
          fill="#FFFFFF"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.svg>
    </div>
  );
};

export default NeuralCore;
