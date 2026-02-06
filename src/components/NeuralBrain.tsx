import { motion } from 'framer-motion';
import { memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface NeuralBrainProps {
  size?: number;
  brainCharge?: number;
}

// Simplified static brain for mobile - no animations
const MobileBrain = memo(({ size = 200 }: { size: number }) => (
  <div className="relative" style={{ width: size, height: size }}>
    {/* Simple static glow */}
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background: `radial-gradient(circle at 50% 50%, hsl(var(--neon-cyan) / 0.2) 0%, transparent 50%)`,
      }}
    />

    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
      {/* Simplified gradients - no filters for performance */}
      <defs>
        <radialGradient id="somaGradSimple" cx="35%" cy="35%">
          <stop offset="0%" stopColor="hsl(var(--foreground))" />
          <stop offset="50%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Static dendrites */}
      <g stroke="hsl(var(--foreground))" strokeLinecap="round" fill="none" opacity="0.5">
        <path d="M45 42 Q38 32 30 22" strokeWidth="2" />
        <path d="M30 22 Q26 17 22 13" strokeWidth="1.2" />
        <path d="M50 40 L50 25" strokeWidth="2" />
        <path d="M50 25 Q46 18 42 13" strokeWidth="1.2" />
        <path d="M50 25 Q54 18 58 13" strokeWidth="1.2" />
        <path d="M55 42 Q62 32 70 22" strokeWidth="2" />
        <path d="M70 22 Q74 17 78 13" strokeWidth="1.2" />
        <path d="M42 50 Q32 48 22 46" strokeWidth="1.6" />
        <path d="M58 50 Q68 48 78 46" strokeWidth="1.6" />
      </g>

      {/* Static axon */}
      <path
        d="M50 58 Q50 66 48 72 Q46 78 44 82"
        stroke="hsl(var(--foreground))"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      
      <g stroke="hsl(var(--foreground))" strokeLinecap="round" fill="none" opacity="0.4">
        <path d="M44 82 Q40 85 36 87" strokeWidth="1.2" />
        <path d="M44 82 Q44 86 43 89" strokeWidth="1.2" />
        <path d="M44 82 Q48 85 52 87" strokeWidth="1.2" />
      </g>

      {/* Soma */}
      <circle cx="50" cy="50" r="10" fill="url(#somaGradSimple)" />
      <circle cx="47" cy="47" r="3.5" fill="hsl(var(--foreground))" fillOpacity="0.2" />
      
      {/* Terminal dots - static */}
      <circle cx="22" cy="13" r="2" fill="hsl(var(--foreground))" opacity="0.5" />
      <circle cx="78" cy="13" r="2" fill="hsl(var(--foreground))" opacity="0.5" />
      <circle cx="36" cy="87" r="2" fill="hsl(var(--neon-cyan))" opacity="0.7" />
      <circle cx="43" cy="89" r="2" fill="hsl(var(--neon-cyan))" opacity="0.7" />
      <circle cx="52" cy="87" r="2" fill="hsl(var(--neon-cyan))" opacity="0.7" />
    </svg>
  </div>
));

MobileBrain.displayName = 'MobileBrain';

// Full animated brain for desktop
const DesktopBrain = memo(({ size = 200, brainCharge = 0 }: NeuralBrainProps) => {
  const glowIntensity = Math.max(0.5, brainCharge / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Soft ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, hsl(var(--neon-cyan) / ${glowIntensity * 0.25}) 0%, transparent 50%)`,
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <radialGradient id="somaGrad" cx="35%" cy="35%">
            <stop offset="0%" stopColor="hsl(var(--foreground))" />
            <stop offset="50%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* === DENDRITES === */}
        <g stroke="hsl(var(--foreground))" strokeLinecap="round" fill="none" filter="url(#softGlow)">
          <path d="M45 42 Q38 32 30 22" strokeWidth="2" opacity="0.55" />
          <path d="M30 22 Q26 17 22 13" strokeWidth="1.2" opacity="0.4" />
          <path d="M36 30 Q30 28 24 26" strokeWidth="1" opacity="0.35" />
          <path d="M50 40 L50 25" strokeWidth="2" opacity="0.55" />
          <path d="M50 25 Q46 18 42 13" strokeWidth="1.2" opacity="0.4" />
          <path d="M50 25 Q54 18 58 13" strokeWidth="1.2" opacity="0.4" />
          <path d="M55 42 Q62 32 70 22" strokeWidth="2" opacity="0.55" />
          <path d="M70 22 Q74 17 78 13" strokeWidth="1.2" opacity="0.4" />
          <path d="M64 30 Q70 28 76 26" strokeWidth="1" opacity="0.35" />
          <path d="M42 50 Q32 48 22 46" strokeWidth="1.6" opacity="0.5" />
          <path d="M22 46 Q17 45 12 44" strokeWidth="1" opacity="0.35" />
          <path d="M58 50 Q68 48 78 46" strokeWidth="1.6" opacity="0.5" />
          <path d="M78 46 Q83 45 88 44" strokeWidth="1" opacity="0.35" />
        </g>

        {/* === AXON === */}
        <path
          d="M50 58 Q50 66 48 72 Q46 78 44 82"
          stroke="hsl(var(--foreground))"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
          filter="url(#softGlow)"
        />
        
        <g stroke="hsl(var(--foreground))" strokeLinecap="round" fill="none" filter="url(#softGlow)">
          <path d="M44 82 Q40 85 36 87" strokeWidth="1.2" opacity="0.4" />
          <path d="M44 82 Q44 86 43 89" strokeWidth="1.2" opacity="0.4" />
          <path d="M44 82 Q48 85 52 87" strokeWidth="1.2" opacity="0.4" />
        </g>

        {/* === SOMA === */}
        <motion.circle
          cx="50"
          cy="50"
          r="10"
          fill="url(#somaGrad)"
          filter="url(#strongGlow)"
          animate={{ scale: [1, 1.05, 1] }}
          style={{ transformOrigin: '50px 50px' }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <circle cx="47" cy="47" r="3.5" fill="hsl(var(--foreground))" fillOpacity="0.2" />
        <circle cx="46" cy="46" r="1.5" fill="hsl(var(--foreground))" fillOpacity="0.35" />

        {/* === SIGNAL PULSES === */}
        <motion.circle
          r="2"
          fill="hsl(var(--neon-cyan))"
          filter="url(#strongGlow)"
          animate={{ opacity: [0, 1, 1, 0], offsetDistance: ['100%', '0%'] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3, delay: 2, ease: 'easeIn' }}
          style={{ offsetPath: "path('M30 22 Q38 32 45 42')" }}
        />
        <motion.circle
          r="2"
          fill="hsl(var(--neon-cyan))"
          filter="url(#strongGlow)"
          animate={{ opacity: [0, 1, 1, 0], offsetDistance: ['100%', '0%'] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3, delay: 3.2, ease: 'easeIn' }}
          style={{ offsetPath: "path('M70 22 Q62 32 55 42')" }}
        />
        
        <motion.circle
          r="2.5"
          fill="hsl(var(--neon-cyan))"
          filter="url(#strongGlow)"
          animate={{ opacity: [0, 1, 1, 0], offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 2.5, delay: 2.5, ease: 'easeOut' }}
          style={{ offsetPath: "path('M50 58 Q50 66 48 72 Q46 78 44 82')" }}
        />
        
        {/* === TERMINAL DOTS === */}
        <motion.circle cx="22" cy="13" r="2" fill="hsl(var(--foreground))" filter="url(#softGlow)"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
        />
        <motion.circle cx="78" cy="13" r="2" fill="hsl(var(--foreground))" filter="url(#softGlow)"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.85 }}
        />
        
        {/* Axon terminal bulbs */}
        <motion.circle cx="36" cy="87" r="2" fill="hsl(var(--neon-cyan))" filter="url(#strongGlow)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 1.2 }}
        />
        <motion.circle cx="43" cy="89" r="2" fill="hsl(var(--neon-cyan))" filter="url(#strongGlow)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 1.3 }}
        />
        <motion.circle cx="52" cy="87" r="2" fill="hsl(var(--neon-cyan))" filter="url(#strongGlow)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 1.4 }}
        />
      </svg>

      {/* Central soma glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="rounded-full"
          style={{
            width: size * 0.11,
            height: size * 0.11,
          }}
          animate={{
            boxShadow: [
              `0 0 ${size * 0.04}px hsl(var(--neon-cyan) / 0.4), 0 0 ${size * 0.08}px hsl(var(--neon-cyan) / 0.2)`,
              `0 0 ${size * 0.07}px hsl(var(--neon-cyan) / 0.6), 0 0 ${size * 0.14}px hsl(var(--neon-cyan) / 0.35)`,
              `0 0 ${size * 0.04}px hsl(var(--neon-cyan) / 0.4), 0 0 ${size * 0.08}px hsl(var(--neon-cyan) / 0.2)`,
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
});

DesktopBrain.displayName = 'DesktopBrain';

export const NeuralBrain = memo(({ size = 200, brainCharge = 0 }: NeuralBrainProps) => {
  const isMobile = useIsMobile();
  
  return isMobile 
    ? <MobileBrain size={size} /> 
    : <DesktopBrain size={size} brainCharge={brainCharge} />;
});

NeuralBrain.displayName = 'NeuralBrain';
