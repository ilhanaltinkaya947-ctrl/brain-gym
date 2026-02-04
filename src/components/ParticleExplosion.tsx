import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface ParticleExplosionProps {
  trigger: boolean;
  x?: number;
  y?: number;
}

export const ParticleExplosion = ({ trigger, x = 50, y = 50 }: ParticleExplosionProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      const colors = [
        'hsl(var(--neon-lime))',
        'hsl(var(--cyber-blue))',
        'hsl(var(--neon-lime-glow))',
      ];
      
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      
      setParticles(newParticles);
      
      const timeout = setTimeout(() => setParticles([]), 600);
      return () => clearTimeout(timeout);
    }
  }, [trigger]);

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 1, 
              opacity: 1 
            }}
            animate={{ 
              x: particle.x, 
              y: particle.y, 
              scale: 0, 
              opacity: 0 
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.5, 
              ease: "easeOut" 
            }}
            className="absolute w-3 h-3 rounded-full"
            style={{ 
              backgroundColor: particle.color,
              boxShadow: `0 0 10px ${particle.color}`,
              left: '50%',
              top: '50%',
              marginLeft: '-6px',
              marginTop: '-6px',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
