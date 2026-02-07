import { motion } from 'framer-motion';
import AnimatedHeroIcon from './AnimatedHeroIcon';

interface NeuralCoreProps {
  size?: number;
  brainCharge?: number;
}

// Floating particles configuration
const particles = [
  { id: 1, radius: 85, speed: 12, size: 4, startAngle: 0 },
  { id: 2, radius: 95, speed: 18, startAngle: 60 },
  { id: 3, radius: 75, speed: 15, startAngle: 120 },
  { id: 4, radius: 100, speed: 22, startAngle: 180 },
  { id: 5, radius: 70, speed: 10, startAngle: 240 },
  { id: 6, radius: 90, speed: 16, startAngle: 300 },
  { id: 7, radius: 80, speed: 20, startAngle: 45 },
  { id: 8, radius: 105, speed: 25, startAngle: 225 },
];

export const NeuralCore = ({ size = 240, brainCharge = 50 }: NeuralCoreProps) => {
  // Scale factor based on size
  const scale = size / 240;
  
  // Intensity based on brain charge
  const intensity = 0.5 + (brainCharge / 100) * 0.5;
  
  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* === LAYER 1: Deep Atmospheric Glow === */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3 * intensity, 0.5 * intensity, 0.3 * intensity],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            hsl(var(--neon-cyan) / ${0.4 * intensity}) 0%, 
            hsl(var(--neon-cyan) / ${0.1 * intensity}) 40%, 
            transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* === LAYER 2: Outer Ambient Ring === */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.95,
          height: size * 0.95,
          border: '1px solid hsl(var(--neon-cyan) / 0.1)',
        }}
        animate={{ 
          rotate: 360,
          scale: [1, 1.02, 1],
        }}
        transition={{ 
          rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* === LAYER 3: Tilted Orbital Rings === */}
      {/* Ring 1 - Slow, large tilt */}
      <motion.div
        className="absolute rounded-full border border-white/10"
        style={{
          width: size * 0.85,
          height: size * 0.85,
          transform: 'perspective(500px) rotateX(70deg)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Ring 2 - Medium speed, opposite direction */}
      <motion.div
        className="absolute rounded-full border border-neon-cyan/15"
        style={{
          width: size * 0.75,
          height: size * 0.75,
          transform: 'perspective(500px) rotateX(65deg) rotateZ(30deg)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Ring 3 - Faster, more vertical */}
      <motion.div
        className="absolute rounded-full border border-white/8"
        style={{
          width: size * 0.65,
          height: size * 0.65,
          transform: 'perspective(500px) rotateX(75deg) rotateZ(-20deg)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      {/* === LAYER 4: Floating Particles === */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size * scale,
            height: particle.size * scale,
            background: `radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)`,
            boxShadow: `0 0 ${8 * scale}px hsl(var(--neon-cyan) / 0.8)`,
          }}
          animate={{
            rotate: 360,
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            rotate: { duration: particle.speed, repeat: Infinity, ease: 'linear' },
            opacity: { duration: particle.speed / 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          initial={{
            rotate: particle.startAngle,
          }}
        >
          {/* Position the particle on its orbit path */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: particle.size * scale,
              height: particle.size * scale,
              background: `radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)`,
              boxShadow: `0 0 ${6 * scale}px hsl(var(--neon-cyan) / 0.6)`,
              left: particle.radius * scale,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
        </motion.div>
      ))}

      {/* === LAYER 5: Inner Glow Halo === */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          background: `radial-gradient(circle at 50% 50%, 
            hsl(var(--neon-cyan) / ${0.3 * intensity}) 0%, 
            hsl(var(--neon-cyan) / ${0.1 * intensity}) 50%, 
            transparent 100%)`,
          boxShadow: `
            0 0 ${40 * scale}px hsl(var(--neon-cyan) / ${0.4 * intensity}),
            0 0 ${80 * scale}px hsl(var(--neon-cyan) / ${0.2 * intensity}),
            inset 0 0 ${30 * scale}px hsl(var(--neon-cyan) / ${0.1 * intensity})
          `,
        }}
        animate={{
          scale: [0.95, 1.05, 0.95],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* === LAYER 6: Core Breathing Orb === */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.35,
          height: size * 0.35,
          background: `radial-gradient(circle at 30% 30%, 
            hsl(var(--foreground) / 0.95) 0%, 
            hsl(var(--neon-cyan) / 0.9) 30%, 
            hsl(var(--neon-cyan) / 0.7) 60%, 
            hsl(var(--neon-cyan) / 0.4) 100%)`,
          boxShadow: `
            0 0 ${60 * scale}px hsl(var(--neon-cyan) / ${0.6 * intensity}),
            0 0 ${100 * scale}px hsl(var(--neon-cyan) / ${0.4 * intensity}),
            0 0 ${140 * scale}px hsl(var(--neon-cyan) / ${0.2 * intensity}),
            inset 0 0 ${20 * scale}px hsl(var(--foreground) / 0.3)
          `,
        }}
        animate={{
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* === LAYER 7: Pulsing Core Ring === */}
      <motion.div
        className="absolute rounded-full border-2 border-white/30"
        style={{
          width: size * 0.38,
          height: size * 0.38,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />

      {/* === LAYER 8: The Icon (Center) === */}
      <motion.div
        className="absolute z-20 flex items-center justify-center"
        style={{
          mixBlendMode: 'screen',
          filter: `drop-shadow(0 0 ${10 * scale}px hsl(var(--neon-cyan)))`,
        }}
        animate={{
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AnimatedHeroIcon />
      </motion.div>

      {/* === LAYER 9: Sparkle Highlights === */}
      {[...Array(5)].map((_, i) => {
        const angle = (i * 72) * (Math.PI / 180);
        const radius = size * 0.2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: x,
              marginTop: y,
              boxShadow: '0 0 4px 2px white',
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
};

export default NeuralCore;
