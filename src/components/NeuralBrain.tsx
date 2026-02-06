import { motion } from 'framer-motion';

interface NeuralBrainProps {
  size?: number;
  brainCharge?: number;
}

export const NeuralBrain = ({ size = 200, brainCharge = 0 }: NeuralBrainProps) => {
  const glowIntensity = Math.max(0.4, brainCharge / 100);

  // Dendrite paths (branching from soma)
  const dendrites = [
    // Upper left branches
    "M50 45 L35 30 L25 20",
    "M50 45 L35 30 L30 15",
    "M50 45 L40 28 L35 12",
    // Upper right branches
    "M50 45 L65 30 L75 20",
    "M50 45 L65 30 L70 15",
    "M50 45 L60 28 L65 12",
    // Side branches
    "M50 45 L30 40 L15 35",
    "M50 45 L70 40 L85 35",
  ];

  // Axon path (single long extension downward)
  const axonPath = "M50 55 L50 75 Q50 80 45 85 L40 92";
  const axonTerminals = [
    "M40 92 L35 95",
    "M40 92 L40 97",
    "M40 92 L45 96",
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Ambient background glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 40%, hsl(var(--neon-cyan) / ${glowIntensity * 0.25}) 0%, transparent 60%)`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Glow filter for the neuron */}
          <filter id="neuronGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Stronger glow for signals */}
          <filter id="signalGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial gradient for soma */}
          <radialGradient id="somaGradient" cx="40%" cy="40%">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="1" />
            <stop offset="50%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* Dendrites - static structure */}
        {dendrites.map((path, i) => (
          <motion.path
            key={`dendrite-${i}`}
            d={path}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity={0.4}
            filter="url(#neuronGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
          />
        ))}

        {/* Axon - main pathway */}
        <motion.path
          d={axonPath}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity={0.5}
          filter="url(#neuronGlow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
        />

        {/* Axon terminals */}
        {axonTerminals.map((path, i) => (
          <motion.path
            key={`terminal-${i}`}
            d={path}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity={0.4}
            filter="url(#neuronGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 1.5 + i * 0.1, ease: "easeOut" }}
          />
        ))}

        {/* Soma (Cell Body) - central glowing sphere */}
        <motion.circle
          cx="50"
          cy="50"
          r="8"
          fill="url(#somaGradient)"
          filter="url(#neuronGlow)"
          animate={{
            scale: [1, 1.1, 1],
          }}
          style={{ transformOrigin: '50px 50px' }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Inner soma highlight */}
        <circle
          cx="48"
          cy="48"
          r="3"
          fill="hsl(var(--foreground))"
          fillOpacity="0.3"
        />

        {/* Traveling Signal Pulses along dendrites */}
        {dendrites.slice(0, 4).map((path, i) => (
          <motion.circle
            key={`signal-${i}`}
            r="2"
            fill="hsl(var(--neon-cyan))"
            filter="url(#signalGlow)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              offsetDistance: ['0%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.8 + 2,
              ease: 'easeInOut',
            }}
            style={{
              offsetPath: `path('${path}')`,
            }}
          />
        ))}

        {/* Signal pulse traveling down axon */}
        <motion.circle
          r="2.5"
          fill="hsl(var(--neon-gold))"
          filter="url(#signalGlow)"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 1, 0.5, 0],
            offsetDistance: ['0%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 3,
            repeatDelay: 2,
            ease: 'easeIn',
          }}
          style={{
            offsetPath: `path('${axonPath}')`,
          }}
        />
      </svg>

      {/* Outer soma glow ring */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '5%' }}>
        <motion.div
          className="rounded-full"
          style={{
            width: size * 0.18,
            height: size * 0.18,
            boxShadow: `
              0 0 ${size * 0.1}px hsl(var(--neon-cyan) / ${glowIntensity * 0.4}),
              0 0 ${size * 0.2}px hsl(var(--neon-cyan) / ${glowIntensity * 0.2})
            `,
          }}
          animate={{
            boxShadow: [
              `0 0 ${size * 0.1}px hsl(var(--neon-cyan) / ${glowIntensity * 0.3}), 0 0 ${size * 0.15}px hsl(var(--neon-cyan) / ${glowIntensity * 0.15})`,
              `0 0 ${size * 0.15}px hsl(var(--neon-cyan) / ${glowIntensity * 0.5}), 0 0 ${size * 0.25}px hsl(var(--neon-cyan) / ${glowIntensity * 0.3})`,
              `0 0 ${size * 0.1}px hsl(var(--neon-cyan) / ${glowIntensity * 0.3}), 0 0 ${size * 0.15}px hsl(var(--neon-cyan) / ${glowIntensity * 0.15})`,
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Synaptic end bulbs - small glowing dots at dendrite tips */}
      {[
        { x: 25, y: 20 },
        { x: 30, y: 15 },
        { x: 35, y: 12 },
        { x: 75, y: 20 },
        { x: 70, y: 15 },
        { x: 65, y: 12 },
        { x: 15, y: 35 },
        { x: 85, y: 35 },
      ].map((pos, i) => (
        <motion.div
          key={`bulb-${i}`}
          className="absolute rounded-full"
          style={{
            width: 4,
            height: 4,
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            background: 'hsl(var(--foreground))',
            boxShadow: '0 0 6px hsl(var(--neon-cyan) / 0.6)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.2, 0.8], 
            opacity: [0.4, 0.8, 0.4] 
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 1.5 + i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Axon terminal bulbs */}
      {[
        { x: 35, y: 95 },
        { x: 40, y: 97 },
        { x: 45, y: 96 },
      ].map((pos, i) => (
        <motion.div
          key={`axon-bulb-${i}`}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 3,
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            background: 'hsl(var(--neon-gold))',
            boxShadow: '0 0 4px hsl(var(--neon-gold) / 0.5)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0.6, 1, 0.6], 
            opacity: [0.3, 0.7, 0.3] 
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 2 + i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
