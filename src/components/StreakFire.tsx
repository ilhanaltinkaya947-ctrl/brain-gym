import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakFireProps {
  streak: number;
  isActive?: boolean;
}

export const StreakFire = ({ streak, isActive = true }: StreakFireProps) => {
  const intensity = Math.min(streak / 7, 1); // Max intensity at 7-day streak
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center"
    >
      {/* Fire icon with animation */}
      <motion.div
        className="relative"
        animate={isActive && streak > 0 ? {
          scale: [1, 1.1, 1],
          y: [0, -3, 0],
        } : {}}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Glow effect */}
        {streak > 0 && (
          <motion.div
            className="absolute inset-0 blur-xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              background: `radial-gradient(circle, hsl(${25 + intensity * 20} 90% 55% / ${0.5 + intensity * 0.3}) 0%, transparent 70%)`,
            }}
          />
        )}
        
        {/* Fire icon */}
        <motion.div
          className="relative z-10"
          animate={streak > 0 ? {
            filter: [
              'drop-shadow(0 0 8px hsl(25 90% 55% / 0.6))',
              'drop-shadow(0 0 16px hsl(45 90% 55% / 0.8))',
              'drop-shadow(0 0 8px hsl(25 90% 55% / 0.6))',
            ],
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Flame
            className={`w-10 h-10 ${
              streak > 0 
                ? 'text-orange-500' 
                : 'text-muted-foreground/40'
            }`}
            style={{
              fill: streak > 0 
                ? `hsl(${25 + intensity * 20} 90% 55%)` 
                : 'transparent',
            }}
          />
        </motion.div>

        {/* Particle effects for high streaks */}
        {streak >= 3 && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-orange-400"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, (i - 1) * 15],
                  y: [0, -25 - i * 5],
                  opacity: [1, 0],
                  scale: [1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Streak count */}
      <motion.div
        className="mt-1 flex items-center gap-1"
        animate={streak > 0 ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span 
          className={`text-2xl font-black ${
            streak > 0 ? 'text-orange-500' : 'text-muted-foreground/50'
          }`}
        >
          {streak}
        </span>
      </motion.div>

      {/* Label */}
      <span className={`text-[10px] uppercase tracking-widest ${
        streak > 0 ? 'text-orange-500/70' : 'text-muted-foreground/40'
      }`}>
        Day Streak
      </span>

      {/* Streak milestones */}
      {streak >= 7 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30"
        >
          <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wider">
            🔥 On Fire!
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};
