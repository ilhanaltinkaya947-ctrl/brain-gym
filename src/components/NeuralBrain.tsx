import { motion } from 'framer-motion';

interface NeuralBrainProps {
  size?: number;
  brainCharge?: number;
}

export const NeuralBrain = ({ size = 200, brainCharge = 0 }: NeuralBrainProps) => {
  // Ring configurations - different speeds and directions
  const rings = [
    { radius: 0.9, duration: 20, direction: 1, strokeWidth: 1, opacity: 0.3 },
    { radius: 0.7, duration: 15, direction: -1, strokeWidth: 1.5, opacity: 0.5 },
    { radius: 0.5, duration: 12, direction: 1, strokeWidth: 1, opacity: 0.4 },
  ];

  // Core glow intensity based on brain charge
  const glowIntensity = Math.max(0.3, brainCharge / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Ambient glow behind everything */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--neon-cyan) / ${glowIntensity * 0.2}) 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* SVG Container for rings */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {/* Concentric rotating rings */}
        {rings.map((ring, index) => (
          <motion.circle
            key={index}
            cx="50"
            cy="50"
            r={ring.radius * 45}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth={ring.strokeWidth}
            strokeOpacity={ring.opacity}
            strokeDasharray="4 8"
            style={{ transformOrigin: '50px 50px' }}
            animate={{ rotate: 360 * ring.direction }}
            transition={{
              duration: ring.duration,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}

        {/* Inner decorative arcs */}
        <motion.path
          d="M 50 20 A 30 30 0 0 1 80 50"
          fill="none"
          stroke="hsl(var(--neon-cyan))"
          strokeWidth="0.5"
          strokeOpacity="0.6"
          style={{ transformOrigin: '50px 50px' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <motion.path
          d="M 50 80 A 30 30 0 0 1 20 50"
          fill="none"
          stroke="hsl(var(--neon-gold))"
          strokeWidth="0.5"
          strokeOpacity="0.4"
          style={{ transformOrigin: '50px 50px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
      </svg>

      {/* Central Core - Breathing Sphere */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute -inset-4 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(var(--neon-cyan) / 0.3) 0%, transparent 70%)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Core sphere */}
          <div
            className="w-8 h-8 rounded-full relative"
            style={{
              background: `radial-gradient(circle at 30% 30%, 
                hsl(var(--foreground) / 0.9) 0%, 
                hsl(var(--neon-cyan) / 0.4) 50%, 
                hsl(var(--background)) 100%)`,
              boxShadow: `
                0 0 20px hsl(var(--neon-cyan) / ${glowIntensity * 0.5}),
                0 0 40px hsl(var(--neon-cyan) / ${glowIntensity * 0.3}),
                inset 0 0 10px hsl(var(--foreground) / 0.2)
              `,
            }}
          />
        </motion.div>
      </div>

      {/* Data particles orbiting */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-foreground/60"
          style={{
            top: '50%',
            left: '50%',
          }}
          animate={{
            x: [
              Math.cos((i / 6) * Math.PI * 2) * (size * 0.35),
              Math.cos((i / 6) * Math.PI * 2 + Math.PI) * (size * 0.35),
              Math.cos((i / 6) * Math.PI * 2) * (size * 0.35),
            ],
            y: [
              Math.sin((i / 6) * Math.PI * 2) * (size * 0.35),
              Math.sin((i / 6) * Math.PI * 2 + Math.PI) * (size * 0.35),
              Math.sin((i / 6) * Math.PI * 2) * (size * 0.35),
            ],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
};
