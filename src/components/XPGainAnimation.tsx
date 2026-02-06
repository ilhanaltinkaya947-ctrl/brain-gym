import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star } from 'lucide-react';

interface XPGainAnimationProps {
  xpGained: number;
  isVisible: boolean;
  onComplete?: () => void;
  tier?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  delay: number;
}

const TIER_COLORS = {
  1: { primary: 'hsl(173, 80%, 40%)', glow: 'hsl(173, 80%, 50%)' },
  2: { primary: 'hsl(210, 100%, 55%)', glow: 'hsl(210, 100%, 65%)' },
  3: { primary: 'hsl(280, 90%, 55%)', glow: 'hsl(280, 100%, 65%)' },
  4: { primary: 'hsl(25, 95%, 55%)', glow: 'hsl(25, 100%, 60%)' },
  5: { primary: 'hsl(0, 85%, 55%)', glow: 'hsl(0, 100%, 60%)' },
};

export const XPGainAnimation = ({ 
  xpGained, 
  isVisible, 
  onComplete,
  tier = 1 
}: XPGainAnimationProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [displayXP, setDisplayXP] = useState(0);

  const colors = TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS[1];

  // Generate particles when visible
  useEffect(() => {
    if (isVisible && xpGained > 0) {
      const particleCount = Math.min(12, Math.floor(xpGained / 5) + 4);
      const newParticles: Particle[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: (Math.random() - 0.5) * 120,
          y: -Math.random() * 80 - 40,
          scale: 0.5 + Math.random() * 0.5,
          rotation: Math.random() * 360,
          delay: i * 0.05,
        });
      }
      setParticles(newParticles);

      // Animated count-up
      let current = 0;
      const step = Math.max(1, Math.floor(xpGained / 20));
      const interval = setInterval(() => {
        current += step;
        if (current >= xpGained) {
          setDisplayXP(xpGained);
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 800);
        } else {
          setDisplayXP(current);
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [isVisible, xpGained, onComplete]);

  if (!isVisible || xpGained <= 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      >
        {/* Radial Glow Background */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.6, 0.3], scale: [0, 1.5, 2] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute w-64 h-64 rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.glow}40 0%, transparent 70%)`,
          }}
        />

        {/* Particle Burst */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              opacity: 1, 
              scale: 0, 
              x: 0, 
              y: 0,
              rotate: 0 
            }}
            animate={{ 
              opacity: [1, 1, 0], 
              scale: [0, particle.scale, particle.scale * 0.5], 
              x: particle.x,
              y: particle.y,
              rotate: particle.rotation
            }}
            transition={{ 
              duration: 0.8, 
              delay: particle.delay,
              ease: "easeOut" 
            }}
            className="absolute"
          >
            {particle.id % 2 === 0 ? (
              <Star 
                className="w-4 h-4" 
                style={{ color: colors.primary, fill: colors.primary }}
              />
            ) : (
              <Zap 
                className="w-3 h-3" 
                style={{ color: colors.glow }}
              />
            )}
          </motion.div>
        ))}

        {/* Main XP Display */}
        <motion.div
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: [0, 1.2, 1], y: [20, -10, 0] }}
          transition={{ duration: 0.5, ease: "backOut" }}
          className="flex flex-col items-center gap-2"
        >
          {/* XP Icon with Glow */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              boxShadow: [
                `0 0 20px ${colors.glow}60`,
                `0 0 40px ${colors.glow}80`,
                `0 0 20px ${colors.glow}60`,
              ]
            }}
            transition={{ duration: 0.6, repeat: 2 }}
            className="p-3 rounded-full"
            style={{ backgroundColor: `${colors.primary}20` }}
          >
            <Zap className="w-8 h-8" style={{ color: colors.primary }} />
          </motion.div>

          {/* XP Value */}
          <motion.div
            className="text-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3, repeat: 3 }}
          >
            <motion.span
              className="text-5xl font-black tabular-nums block"
              style={{ 
                color: colors.primary,
                textShadow: `0 0 30px ${colors.glow}`,
              }}
            >
              +{displayXP}
            </motion.span>
            <span className="text-sm uppercase tracking-widest text-muted-foreground">
              XP Gained
            </span>
          </motion.div>
        </motion.div>

        {/* Ring Pulse Effect */}
        <motion.div
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: [0.5, 2, 2.5], opacity: [0.8, 0.3, 0] }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute w-32 h-32 rounded-full border-2"
          style={{ borderColor: colors.glow }}
        />
        <motion.div
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: [0.5, 1.8, 2.2], opacity: [0.6, 0.2, 0] }}
          transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
          className="absolute w-32 h-32 rounded-full border-2"
          style={{ borderColor: colors.primary }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

// Floating XP indicator for in-game use
export const FloatingXP = ({ 
  amount, 
  x = 0, 
  y = 0,
  tier = 1 
}: { 
  amount: number; 
  x?: number; 
  y?: number;
  tier?: number;
}) => {
  const colors = TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS[1];
  
  return (
    <motion.div
      initial={{ opacity: 1, y: y, x: x, scale: 0.5 }}
      animate={{ opacity: [1, 1, 0], y: y - 60, scale: [0.5, 1.2, 1] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="absolute pointer-events-none z-40 flex items-center gap-1"
    >
      <Zap className="w-4 h-4" style={{ color: colors.glow }} />
      <span 
        className="text-lg font-bold"
        style={{ 
          color: colors.primary,
          textShadow: `0 0 10px ${colors.glow}`,
        }}
      >
        +{amount}
      </span>
    </motion.div>
  );
};
