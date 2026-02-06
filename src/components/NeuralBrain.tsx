import { motion } from 'framer-motion';

interface NeuralBrainProps {
  size?: number;
  brainCharge?: number;
}

export const NeuralBrain = ({ size = 200, brainCharge = 0 }: NeuralBrainProps) => {
  const glowIntensity = Math.max(0.5, brainCharge / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Soft ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, hsl(var(--neon-cyan) / ${glowIntensity * 0.25}) 0%, transparent 55%)`,
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
            <feGaussianBlur stdDeviation="3" result="blur" />
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
          
          {/* Upper Left Main Branch + Sub-branches */}
          <motion.path 
            d="M46 42 Q38 30 28 18" 
            strokeWidth="2" opacity="0.6"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.path 
            d="M35 28 Q28 24 20 22" 
            strokeWidth="1.2" opacity="0.4"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
          />
          <motion.path 
            d="M28 18 Q22 12 15 8" 
            strokeWidth="1" opacity="0.35"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
          />
          
          {/* Upper Center Branch + Sub-branches */}
          <motion.path 
            d="M50 40 L50 22" 
            strokeWidth="2" opacity="0.6"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
          />
          <motion.path 
            d="M50 22 Q45 14 40 8" 
            strokeWidth="1.2" opacity="0.4"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          />
          <motion.path 
            d="M50 22 Q55 14 60 8" 
            strokeWidth="1.2" opacity="0.4"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.65, ease: "easeOut" }}
          />
          
          {/* Upper Right Main Branch + Sub-branches */}
          <motion.path 
            d="M54 42 Q62 30 72 18" 
            strokeWidth="2" opacity="0.6"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          />
          <motion.path 
            d="M65 28 Q72 24 80 22" 
            strokeWidth="1.2" opacity="0.4"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: 0.55, ease: "easeOut" }}
          />
          <motion.path 
            d="M72 18 Q78 12 85 8" 
            strokeWidth="1" opacity="0.35"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.75, ease: "easeOut" }}
          />
          
          {/* Left Side Branch */}
          <motion.path 
            d="M42 50 Q30 48 18 44" 
            strokeWidth="1.8" opacity="0.55"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          />
          <motion.path 
            d="M18 44 Q12 42 6 40" 
            strokeWidth="1" opacity="0.35"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
          />
          
          {/* Right Side Branch */}
          <motion.path 
            d="M58 50 Q70 48 82 44" 
            strokeWidth="1.8" opacity="0.55"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
          />
          <motion.path 
            d="M82 44 Q88 42 94 40" 
            strokeWidth="1" opacity="0.35"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.85, ease: "easeOut" }}
          />
        </g>

        {/* === AXON === */}
        <motion.path
          d="M50 58 C50 68 50 75 46 82 Q42 88 38 92"
          stroke="hsl(var(--foreground))"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
          filter="url(#softGlow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
        />
        
        {/* Axon terminals */}
        <g stroke="hsl(var(--foreground))" strokeLinecap="round" fill="none" filter="url(#softGlow)">
          <motion.path 
            d="M38 92 Q34 95 30 97" strokeWidth="1.2" opacity="0.45"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 1.2, ease: "easeOut" }}
          />
          <motion.path 
            d="M38 92 Q38 96 37 99" strokeWidth="1.2" opacity="0.45"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 1.25, ease: "easeOut" }}
          />
          <motion.path 
            d="M38 92 Q42 95 46 97" strokeWidth="1.2" opacity="0.45"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 1.3, ease: "easeOut" }}
          />
        </g>

        {/* === SOMA (Cell Body) === */}
        <motion.circle
          cx="50"
          cy="50"
          r="11"
          fill="url(#somaGrad)"
          filter="url(#strongGlow)"
          animate={{ scale: [1, 1.06, 1] }}
          style={{ transformOrigin: '50px 50px' }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Soma inner highlight */}
        <circle cx="47" cy="47" r="4" fill="hsl(var(--foreground))" fillOpacity="0.25" />
        <circle cx="46" cy="46" r="1.5" fill="hsl(var(--foreground))" fillOpacity="0.4" />

        {/* === SIGNAL PULSES === */}
        {/* Incoming signals on dendrites */}
        <motion.circle
          r="2.5"
          fill="hsl(var(--neon-cyan))"
          filter="url(#strongGlow)"
          animate={{ opacity: [0, 1, 1, 0], offsetDistance: ['100%', '0%'] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3, delay: 2, ease: 'easeIn' }}
          style={{ offsetPath: "path('M28 18 Q38 30 46 42')" }}
        />
        <motion.circle
          r="2.5"
          fill="hsl(var(--neon-cyan))"
          filter="url(#strongGlow)"
          animate={{ opacity: [0, 1, 1, 0], offsetDistance: ['100%', '0%'] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3, delay: 3.5, ease: 'easeIn' }}
          style={{ offsetPath: "path('M72 18 Q62 30 54 42')" }}
        />
        
        {/* Outgoing signal on axon */}
        <motion.circle
          r="3"
          fill="hsl(var(--neon-cyan))"
          filter="url(#strongGlow)"
          animate={{ opacity: [0, 1, 1, 0], offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5, delay: 2.8, ease: 'easeOut' }}
          style={{ offsetPath: "path('M50 58 C50 68 50 75 46 82 Q42 88 38 92')" }}
        />
        
        {/* === SYNAPTIC TERMINALS (SVG circles for precise positioning) === */}
        {/* Dendrite tips */}
        <motion.circle cx="15" cy="8" r="2.5" fill="hsl(var(--foreground))" fillOpacity="0.7" filter="url(#softGlow)"
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.9, 1.1, 0.9] }} style={{ transformOrigin: '15px 8px' }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
        />
        <motion.circle cx="20" cy="22" r="2" fill="hsl(var(--foreground))" fillOpacity="0.6" filter="url(#softGlow)"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }} style={{ transformOrigin: '20px 22px' }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
        />
        <motion.circle cx="40" cy="8" r="2" fill="hsl(var(--foreground))" fillOpacity="0.6" filter="url(#softGlow)"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }} style={{ transformOrigin: '40px 8px' }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
        />
        <motion.circle cx="60" cy="8" r="2" fill="hsl(var(--foreground))" fillOpacity="0.6" filter="url(#softGlow)"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }} style={{ transformOrigin: '60px 8px' }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.85 }}
        />
        <motion.circle cx="80" cy="22" r="2" fill="hsl(var(--foreground))" fillOpacity="0.6" filter="url(#softGlow)"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }} style={{ transformOrigin: '80px 22px' }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.75 }}
        />
        <motion.circle cx="85" cy="8" r="2.5" fill="hsl(var(--foreground))" fillOpacity="0.7" filter="url(#softGlow)"
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.9, 1.1, 0.9] }} style={{ transformOrigin: '85px 8px' }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.95 }}
        />
        <motion.circle cx="6" cy="40" r="2" fill="hsl(var(--foreground))" fillOpacity="0.6" filter="url(#softGlow)"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }} style={{ transformOrigin: '6px 40px' }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
        <motion.circle cx="94" cy="40" r="2" fill="hsl(var(--foreground))" fillOpacity="0.6" filter="url(#softGlow)"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }} style={{ transformOrigin: '94px 40px' }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.05 }}
        />
        
        {/* Axon terminal bulbs */}
        <motion.circle cx="30" cy="97" r="2.5" fill="hsl(var(--neon-cyan))" fillOpacity="0.8" filter="url(#strongGlow)"
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1.15, 0.85] }} style={{ transformOrigin: '30px 97px' }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 1.4 }}
        />
        <motion.circle cx="37" cy="99" r="2.5" fill="hsl(var(--neon-cyan))" fillOpacity="0.8" filter="url(#strongGlow)"
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1.15, 0.85] }} style={{ transformOrigin: '37px 99px' }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 1.5 }}
        />
        <motion.circle cx="46" cy="97" r="2.5" fill="hsl(var(--neon-cyan))" fillOpacity="0.8" filter="url(#strongGlow)"
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1.15, 0.85] }} style={{ transformOrigin: '46px 97px' }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 1.6 }}
        />
      </svg>

      {/* Central soma glow overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="rounded-full"
          style={{
            width: size * 0.12,
            height: size * 0.12,
            boxShadow: `
              0 0 ${size * 0.06}px hsl(var(--neon-cyan) / 0.5),
              0 0 ${size * 0.12}px hsl(var(--neon-cyan) / 0.3)
            `,
          }}
          animate={{
            boxShadow: [
              `0 0 ${size * 0.05}px hsl(var(--neon-cyan) / 0.4), 0 0 ${size * 0.1}px hsl(var(--neon-cyan) / 0.2)`,
              `0 0 ${size * 0.08}px hsl(var(--neon-cyan) / 0.6), 0 0 ${size * 0.16}px hsl(var(--neon-cyan) / 0.35)`,
              `0 0 ${size * 0.05}px hsl(var(--neon-cyan) / 0.4), 0 0 ${size * 0.1}px hsl(var(--neon-cyan) / 0.2)`,
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
};
