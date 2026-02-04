import { motion } from 'framer-motion';

interface ThreeRingChartProps {
  accuracy: number;
  speed: number;
  streak: number;
  brainScore: number;
}

export const ThreeRingChart = ({ accuracy, speed, streak, brainScore }: ThreeRingChartProps) => {
  const size = 280;
  const strokeWidth = 10;
  
  // Ring configurations (outer to inner)
  const rings = [
    { value: streak, label: 'Streak', radius: (size - strokeWidth) / 2, gradient: 'gradient-streak' },
    { value: speed, label: 'Speed', radius: (size - strokeWidth) / 2 - 28, gradient: 'gradient-speed' },
    { value: accuracy, label: 'Accuracy', radius: (size - strokeWidth) / 2 - 56, gradient: 'gradient-accuracy' },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <defs>
          {/* Accuracy: Teal to Blue */}
          <linearGradient id="gradient-accuracy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--bio-teal))" />
            <stop offset="100%" stopColor="hsl(var(--bio-blue))" />
          </linearGradient>
          {/* Speed: Orange to Gold */}
          <linearGradient id="gradient-speed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--bio-orange))" />
            <stop offset="100%" stopColor="hsl(var(--bio-gold))" />
          </linearGradient>
          {/* Streak: Purple to Pink */}
          <linearGradient id="gradient-streak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--bio-purple))" />
            <stop offset="100%" stopColor="hsl(var(--bio-pink))" />
          </linearGradient>
        </defs>

        {rings.map((ring, index) => {
          const circumference = ring.radius * 2 * Math.PI;
          const offset = circumference - (ring.value / 100) * circumference;

          return (
            <g key={ring.label}>
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={ring.radius}
                fill="none"
                stroke="hsl(var(--ring-bg))"
                strokeWidth={strokeWidth}
                className="opacity-20"
              />
              {/* Progress ring with liquid fill animation */}
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={ring.radius}
                fill="none"
                stroke={`url(#${ring.gradient})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ 
                  duration: 1.5 + index * 0.2, 
                  ease: [0.4, 0, 0.2, 1],
                  delay: index * 0.15
                }}
                style={{
                  filter: 'drop-shadow(0 0 8px hsl(var(--bio-teal) / 0.4))',
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Center content - Brain Score */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <motion.span 
          key={brainScore}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl font-extralight tracking-tight text-foreground"
        >
          {brainScore}
        </motion.span>
        <span className="text-xs font-light uppercase tracking-[0.3em] text-muted-foreground mt-1">
          Brain Score
        </span>
      </motion.div>
    </div>
  );
};
