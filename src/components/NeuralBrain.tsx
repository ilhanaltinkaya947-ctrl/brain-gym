import { motion } from 'framer-motion';

interface NeuralBrainProps {
  size?: number;
  brainCharge?: number;
}

export const NeuralBrain = ({ size = 200, brainCharge = 0 }: NeuralBrainProps) => {
  const glowIntensity = Math.max(0.5, brainCharge / 100);

  // Main dendrite branches (thicker, primary)
  const primaryDendrites = [
    // Upper branches - more spread out
    "M50 42 Q45 35 35 25 Q30 18 22 10",
    "M50 42 Q50 30 50 18 Q50 10 50 5",
    "M50 42 Q55 35 65 25 Q70 18 78 10",
    // Side branches - wider reach
    "M50 45 Q35 42 20 38 Q10 35 5 30",
    "M50 45 Q65 42 80 38 Q90 35 95 30",
  ];

  // Secondary dendrite branches (thinner, more detail)
  const secondaryDendrites = [
    // Upper-left sub-branches
    "M35 25 Q28 22 20 18",
    "M35 25 Q32 18 28 10",
    "M22 10 Q18 5 12 2",
    "M22 10 Q25 5 22 0",
    // Upper-center sub-branches
    "M50 18 Q42 12 35 8",
    "M50 18 Q58 12 65 8",
    // Upper-right sub-branches
    "M65 25 Q72 22 80 18",
    "M65 25 Q68 18 72 10",
    "M78 10 Q82 5 88 2",
    "M78 10 Q75 5 78 0",
    // Left side sub-branches
    "M20 38 Q15 32 8 28",
    "M20 38 Q18 42 12 45",
    // Right side sub-branches
    "M80 38 Q85 32 92 28",
    "M80 38 Q82 42 88 45",
  ];

  // Tertiary micro-branches (finest detail)
  const tertiaryDendrites = [
    "M20 18 L15 12",
    "M28 10 L25 3",
    "M35 8 L32 2",
    "M65 8 L68 2",
    "M72 10 L75 3",
    "M80 18 L85 12",
    "M8 28 L3 25",
    "M12 45 L5 48",
    "M92 28 L97 25",
    "M88 45 L95 48",
  ];

  // Axon path (main trunk going down)
  const axonPath = "M50 58 L50 72 Q50 78 45 82 L38 88";
  
  // Axon collateral branches
  const axonCollaterals = [
    "M50 65 Q55 68 60 65",
    "M50 72 Q45 75 40 72",
  ];

  // Axon terminals (synaptic boutons)
  const axonTerminals = [
    "M38 88 Q35 90 32 94",
    "M38 88 Q38 92 36 96",
    "M38 88 Q42 91 45 95",
    "M38 88 Q40 92 42 97",
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Deep ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 35%, hsl(var(--neon-cyan) / ${glowIntensity * 0.35}) 0%, hsl(var(--neon-cyan) / 0.1) 40%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary glow layer */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, hsl(var(--neon-cyan) / 0.15) 0%, transparent 50%)`,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Enhanced glow filter */}
          <filter id="neuronGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="blur1" />
            <feGaussianBlur stdDeviation="3" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Strong signal glow */}
          <filter id="signalGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2" result="blur1" />
            <feGaussianBlur stdDeviation="4" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soma gradient */}
          <radialGradient id="somaGradient" cx="35%" cy="35%">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="1" />
            <stop offset="40%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.3" />
          </radialGradient>

          {/* Axon terminal gradient */}
          <radialGradient id="terminalGradient" cx="40%" cy="40%">
            <stop offset="0%" stopColor="hsl(var(--neon-gold))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--neon-gold))" stopOpacity="0.4" />
          </radialGradient>
        </defs>

        {/* Tertiary dendrites (finest, draw first) */}
        {tertiaryDendrites.map((path, i) => (
          <motion.path
            key={`tertiary-${i}`}
            d={path}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="0.6"
            strokeLinecap="round"
            strokeOpacity={0.25}
            filter="url(#neuronGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.25 }}
            transition={{ duration: 0.8, delay: 1.8 + i * 0.05, ease: "easeOut" }}
          />
        ))}

        {/* Secondary dendrites */}
        {secondaryDendrites.map((path, i) => (
          <motion.path
            key={`secondary-${i}`}
            d={path}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeOpacity={0.35}
            filter="url(#neuronGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.35 }}
            transition={{ duration: 1, delay: 1 + i * 0.06, ease: "easeOut" }}
          />
        ))}

        {/* Primary dendrites (thickest, most visible) */}
        {primaryDendrites.map((path, i) => (
          <motion.path
            key={`primary-${i}`}
            d={path}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity={0.6}
            filter="url(#neuronGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
          />
        ))}

        {/* Axon - main trunk */}
        <motion.path
          d={axonPath}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity={0.65}
          filter="url(#neuronGlow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
        />

        {/* Axon collaterals */}
        {axonCollaterals.map((path, i) => (
          <motion.path
            key={`collateral-${i}`}
            d={path}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeOpacity={0.4}
            filter="url(#neuronGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 1.5 + i * 0.2, ease: "easeOut" }}
          />
        ))}

        {/* Axon terminals */}
        {axonTerminals.map((path, i) => (
          <motion.path
            key={`terminal-${i}`}
            d={path}
            fill="none"
            stroke="hsl(var(--neon-gold))"
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity={0.6}
            filter="url(#neuronGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 1.8 + i * 0.1, ease: "easeOut" }}
          />
        ))}

        {/* SOMA (Cell Body) - larger, more prominent */}
        <motion.ellipse
          cx="50"
          cy="50"
          rx="10"
          ry="9"
          fill="url(#somaGradient)"
          filter="url(#neuronGlow)"
          animate={{
            scale: [1, 1.08, 1],
          }}
          style={{ transformOrigin: '50px 50px' }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Soma nucleus */}
        <circle
          cx="47"
          cy="48"
          r="3.5"
          fill="hsl(var(--foreground))"
          fillOpacity="0.4"
        />
        <circle
          cx="46"
          cy="47"
          r="1.5"
          fill="hsl(var(--foreground))"
          fillOpacity="0.6"
        />

        {/* Axon hillock (connection point) */}
        <ellipse
          cx="50"
          cy="55"
          rx="4"
          ry="3"
          fill="hsl(var(--foreground))"
          fillOpacity="0.3"
        />

        {/* Traveling Signal Pulses - Dendrites to Soma */}
        {primaryDendrites.map((path, i) => (
          <motion.circle
            key={`signal-in-${i}`}
            r="2.5"
            fill="hsl(var(--neon-cyan))"
            filter="url(#signalGlow)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              offsetDistance: ['100%', '0%'],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: 2.5 + i * 1.2,
              repeatDelay: 3,
              ease: 'easeIn',
            }}
            style={{
              offsetPath: `path('${path}')`,
            }}
          />
        ))}

        {/* Signal pulse down axon */}
        <motion.circle
          r="3"
          fill="hsl(var(--neon-gold))"
          filter="url(#signalGlow)"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 1, 0.6, 0],
            offsetDistance: ['0%', '100%'],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: 3.5,
            repeatDelay: 2.5,
            ease: 'easeIn',
          }}
          style={{
            offsetPath: `path('${axonPath}')`,
          }}
        />
      </svg>

      {/* Central soma glow effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="rounded-full"
          style={{
            width: size * 0.22,
            height: size * 0.2,
            boxShadow: `
              0 0 ${size * 0.08}px hsl(var(--neon-cyan) / ${glowIntensity * 0.5}),
              0 0 ${size * 0.15}px hsl(var(--neon-cyan) / ${glowIntensity * 0.3}),
              0 0 ${size * 0.25}px hsl(var(--neon-cyan) / ${glowIntensity * 0.15})
            `,
          }}
          animate={{
            boxShadow: [
              `0 0 ${size * 0.08}px hsl(var(--neon-cyan) / ${glowIntensity * 0.4}), 0 0 ${size * 0.15}px hsl(var(--neon-cyan) / ${glowIntensity * 0.2}), 0 0 ${size * 0.25}px hsl(var(--neon-cyan) / ${glowIntensity * 0.1})`,
              `0 0 ${size * 0.12}px hsl(var(--neon-cyan) / ${glowIntensity * 0.7}), 0 0 ${size * 0.22}px hsl(var(--neon-cyan) / ${glowIntensity * 0.4}), 0 0 ${size * 0.35}px hsl(var(--neon-cyan) / ${glowIntensity * 0.2})`,
              `0 0 ${size * 0.08}px hsl(var(--neon-cyan) / ${glowIntensity * 0.4}), 0 0 ${size * 0.15}px hsl(var(--neon-cyan) / ${glowIntensity * 0.2}), 0 0 ${size * 0.25}px hsl(var(--neon-cyan) / ${glowIntensity * 0.1})`,
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Dendritic spine bulbs - synaptic contacts */}
      {[
        { x: 22, y: 10, size: 5 },
        { x: 50, y: 5, size: 5 },
        { x: 78, y: 10, size: 5 },
        { x: 12, y: 2, size: 4 },
        { x: 22, y: 0, size: 3 },
        { x: 88, y: 2, size: 4 },
        { x: 78, y: 0, size: 3 },
        { x: 35, y: 8, size: 3 },
        { x: 65, y: 8, size: 3 },
        { x: 5, y: 30, size: 5 },
        { x: 95, y: 30, size: 5 },
        { x: 3, y: 25, size: 3 },
        { x: 97, y: 25, size: 3 },
        { x: 5, y: 48, size: 3 },
        { x: 95, y: 48, size: 3 },
        { x: 15, y: 12, size: 3 },
        { x: 85, y: 12, size: 3 },
        { x: 25, y: 3, size: 3 },
        { x: 75, y: 3, size: 3 },
        { x: 32, y: 2, size: 2 },
        { x: 68, y: 2, size: 2 },
      ].map((pos, i) => (
        <motion.div
          key={`spine-${i}`}
          className="absolute rounded-full"
          style={{
            width: pos.size,
            height: pos.size,
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            background: 'hsl(var(--foreground))',
            boxShadow: `0 0 ${pos.size + 4}px hsl(var(--neon-cyan) / 0.5)`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0.7, 1.1, 0.7], 
            opacity: [0.3, 0.7, 0.3] 
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: 1.5 + i * 0.08,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Axon terminal boutons - larger, gold colored */}
      {[
        { x: 32, y: 94, size: 5 },
        { x: 36, y: 96, size: 5 },
        { x: 45, y: 95, size: 5 },
        { x: 42, y: 97, size: 4 },
        { x: 60, y: 65, size: 3 },
        { x: 40, y: 72, size: 3 },
      ].map((pos, i) => (
        <motion.div
          key={`bouton-${i}`}
          className="absolute rounded-full"
          style={{
            width: pos.size,
            height: pos.size,
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            background: 'hsl(var(--neon-gold))',
            boxShadow: `0 0 ${pos.size + 3}px hsl(var(--neon-gold) / 0.6)`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0.6, 1.2, 0.6], 
            opacity: [0.4, 0.9, 0.4] 
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 2 + i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
