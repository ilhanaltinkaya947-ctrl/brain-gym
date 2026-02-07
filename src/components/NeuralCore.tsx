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
  const cp1X = Math.cos(angle - curvature) * (length * 0.45);
  const cp1Y = Math.sin(angle - curvature) * (length * 0.45);
  const cp2X = Math.cos(angle + curvature) * (length * 0.75);
  const cp2Y = Math.sin(angle + curvature) * (length * 0.75);

  return `M 0 0 C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
};

export const NeuralCore = ({ size = 300, brainCharge = 50 }: NeuralCoreProps) => {
  // Generate random dendrites only once on mount
  const dendrites = useMemo(() => {
    const branches = [];
    const count = 12; // Number of main branches
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const length = 110 + Math.random() * 30; // Slightly longer for elegance
      const curvature = 0.2 + Math.random() * 0.4; // More curve
      
      // Main branch
      branches.push({
        d: createDendritePath(angle, length, curvature),
        width: 2.5 + Math.random(),
        delay: Math.random() * 5, // Spread out start times
        duration: 8 + Math.random() * 4, // Slow duration (8-12s)
        swayDuration: 10 + Math.random() * 5,
        isSub: false
      });

      // Sub-branches (smaller tendrils)
      const subCount = 2;
      for (let j = 0; j < subCount; j++) {
        const subAngle = angle + (Math.random() - 0.5) * 0.6;
        const subLength = length * (0.5 + Math.random() * 0.3);
        branches.push({
          d: createDendritePath(subAngle, subLength, -curvature),
          width: 1 + Math.random(),
          delay: Math.random() * 5,
          duration: 7 + Math.random() * 4,
          swayDuration: 9 + Math.random() * 5,
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
        transition={{ duration: 2 }}
      >
        <defs>
          <radialGradient id="neuronGradient" cx="0" cy="0" r="100%" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="30%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render Dendrites (Branches) */}
        {dendrites.map((branch, i) => (
          <motion.g 
            key={i}
            /* Swaying Motion: Rotates the branch very slightly back and forth */
            animate={{ rotate: [-2, 2, -2] }}
            transition={{
              duration: branch.swayDuration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.path
              d={branch.d}
              stroke="url(#neuronGradient)"
              strokeWidth={branch.width}
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
              /* Pulse Motion: Opacity breathes instead of drawing the line */
              initial={{ opacity: 0.4 }}
              animate={{ 
                opacity: branch.isSub ? [0.3, 0.7, 0.3] : [0.6, 1, 0.6],
                strokeWidth: branch.isSub ? [1, 1.5, 1] : [2.5, 3.5, 2.5]
              }}
              transition={{
                duration: branch.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: branch.delay
              }}
            />
            
            {/* Synaptic Terminal (Glowing dot) */}
            <motion.circle
              r={branch.isSub ? 1.5 : 3}
              fill="#fff"
              filter="url(#glow)"
              style={{ offsetPath: `path('${branch.d}')`, offsetDistance: "100%" }}
              animate={{
                opacity: [0.2, 0.9, 0.2],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: branch.duration * 0.8, // Slightly faster than the branch pulse
                repeat: Infinity,
                ease: "easeInOut",
                delay: branch.delay + 1
              }}
            />
          </motion.g>
        ))}

        {/* Central Soma (The Body) - Breathing Slowly */}
        <motion.circle
          cx="0"
          cy="0"
          r="22"
          fill="url(#neuronGradient)"
          filter="url(#glow)"
          animate={{
            scale: [0.95, 1.05, 0.95],
            opacity: [0.85, 1, 0.85]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Core Light - Intense Heartbeat */}
        <motion.circle
          cx="0"
          cy="0"
          r="8"
          fill="#FFFFFF"
          animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    </div>
  );
};

export default NeuralCore;
