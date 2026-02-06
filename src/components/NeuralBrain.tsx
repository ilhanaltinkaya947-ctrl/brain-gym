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
          background: `radial-gradient(circle at 50% 45%, hsl(var(--neon-cyan) / 0.2) 0%, transparent 50%)`,
        }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <radialGradient id="somaGrad" cx="40%" cy="40%">
            <stop offset="0%" stopColor="hsl(var(--foreground))" />
            <stop offset="70%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* Dendrites - simple clean lines */}
        <g stroke="hsl(var(--foreground))" strokeLinecap="round" fill="none" opacity="0.5" filter="url(#glow)">
          {/* Top branches */}
          <motion.path 
            d="M50 40 L40 22 L32 10" 
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.path 
            d="M50 40 L50 20 L50 8" 
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
          />
          <motion.path 
            d="M50 40 L60 22 L68 10" 
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          />
          
          {/* Side branches */}
          <motion.path 
            d="M45 48 L28 42 L15 38" 
            strokeWidth="1.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          />
          <motion.path 
            d="M55 48 L72 42 L85 38" 
            strokeWidth="1.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          />
        </g>

        {/* Axon - single clean line going down */}
        <motion.path
          d="M50 58 L50 75 L45 88"
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        />

        {/* Soma - clean glowing circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="10"
          fill="url(#somaGrad)"
          filter="url(#glow)"
          animate={{ scale: [1, 1.05, 1] }}
          style={{ transformOrigin: '50px 50px' }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Signal pulse traveling down */}
        <motion.circle
          r="3"
          fill="hsl(var(--neon-cyan))"
          filter="url(#glow)"
          animate={{
            opacity: [0, 1, 1, 0],
            offsetDistance: ['0%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'easeOut',
          }}
          style={{ offsetPath: "path('M50 50 L50 75 L45 88')" }}
        />
      </svg>

      {/* Dendrite tip dots */}
      {[
        { x: 32, y: 10 },
        { x: 50, y: 8 },
        { x: 68, y: 10 },
        { x: 15, y: 38 },
        { x: 85, y: 38 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-foreground"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            boxShadow: '0 0 8px hsl(var(--neon-cyan) / 0.6)',
          }}
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      {/* Axon terminal */}
      <motion.div
        className="absolute w-2 h-2 rounded-full"
        style={{
          left: '45%',
          top: '88%',
          background: 'hsl(var(--neon-cyan))',
          boxShadow: '0 0 10px hsl(var(--neon-cyan) / 0.7)',
        }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.2, 0.9] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
};
