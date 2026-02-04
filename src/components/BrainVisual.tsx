import { motion } from 'framer-motion';

export const BrainVisual = () => {
  return (
    <div className="relative w-56 h-56">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0"
        animate={{
          boxShadow: [
            '0 0 40px hsl(25 90% 55% / 0.15), 0 0 80px hsl(45 90% 55% / 0.1)',
            '0 0 60px hsl(25 90% 55% / 0.25), 0 0 100px hsl(45 90% 55% / 0.15)',
            '0 0 40px hsl(25 90% 55% / 0.15), 0 0 80px hsl(45 90% 55% / 0.1)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ borderRadius: '50%' }}
      />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 0 8px hsl(25 90% 55% / 0.4))' }}
      >
        <defs>
          <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(25 90% 55%)" />
            <stop offset="100%" stopColor="hsl(45 90% 55%)" />
          </linearGradient>
          <linearGradient id="brainGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(25 90% 40%)" />
            <stop offset="100%" stopColor="hsl(45 90% 40%)" />
          </linearGradient>
        </defs>

        {/* Brain outline - left hemisphere */}
        <motion.path
          d="M50 15 
             C35 15 25 22 22 32
             C18 42 15 52 18 62
             C20 72 28 82 38 85
             C45 87 50 85 50 85"
          fill="none"
          stroke="url(#brainGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />

        {/* Brain outline - right hemisphere */}
        <motion.path
          d="M50 15 
             C65 15 75 22 78 32
             C82 42 85 52 82 62
             C80 72 72 82 62 85
             C55 87 50 85 50 85"
          fill="none"
          stroke="url(#brainGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeOut', delay: 0.2 }}
        />

        {/* Brain folds - left */}
        <motion.path
          d="M28 35 Q35 40 30 50 Q25 58 32 65"
          fill="none"
          stroke="url(#brainGradientDark)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.7 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.path
          d="M35 28 Q42 35 38 48 Q34 60 40 72"
          fill="none"
          stroke="url(#brainGradientDark)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.7 }}
          transition={{ duration: 1.5, delay: 0.7 }}
        />

        {/* Brain folds - right */}
        <motion.path
          d="M72 35 Q65 40 70 50 Q75 58 68 65"
          fill="none"
          stroke="url(#brainGradientDark)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.7 }}
          transition={{ duration: 1.5, delay: 0.6 }}
        />
        <motion.path
          d="M65 28 Q58 35 62 48 Q66 60 60 72"
          fill="none"
          stroke="url(#brainGradientDark)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.7 }}
          transition={{ duration: 1.5, delay: 0.8 }}
        />

        {/* Center division */}
        <motion.line
          x1="50"
          y1="18"
          x2="50"
          y2="82"
          stroke="url(#brainGradientDark)"
          strokeWidth="1"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1, delay: 1 }}
        />

        {/* Pulsing neurons */}
        {[
          { cx: 32, cy: 42, delay: 0 },
          { cx: 40, cy: 55, delay: 0.3 },
          { cx: 35, cy: 68, delay: 0.6 },
          { cx: 68, cy: 42, delay: 0.2 },
          { cx: 60, cy: 55, delay: 0.5 },
          { cx: 65, cy: 68, delay: 0.8 },
          { cx: 50, cy: 35, delay: 0.4 },
          { cx: 50, cy: 65, delay: 0.7 },
        ].map((neuron, i) => (
          <motion.circle
            key={i}
            cx={neuron.cx}
            cy={neuron.cy}
            r="2"
            fill="url(#brainGradient)"
            initial={{ opacity: 0.3, scale: 0.8 }}
            animate={{ 
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: neuron.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Neural connections */}
        <motion.path
          d="M32 42 L40 55 L35 68 M68 42 L60 55 L65 68 M40 55 L50 35 L60 55 M40 55 L50 65 L60 55"
          fill="none"
          stroke="url(#brainGradient)"
          strokeWidth="0.5"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </svg>
    </div>
  );
};
