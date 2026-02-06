import { motion } from 'framer-motion';
import { Zap, Settings, Star, Flame, Trophy } from 'lucide-react';
import { NeuralBrain } from './NeuralBrain';
import AnimatedHeroIcon from './AnimatedHeroIcon';

interface DashboardProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  brainCharge: number;
  totalXP: number;
  classicHighScore: number;
  endlessBestStreak: number;
}

export const Dashboard = ({ 
  onStartGame, 
  onOpenSettings, 
  brainCharge,
  totalXP, 
  classicHighScore,
  endlessBestStreak,
}: DashboardProps) => {
  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  // Readiness based on brain charge (or default to random for demo)
  const readiness = brainCharge > 0 ? brainCharge : 85;

  return (
    <div className="h-screen flex flex-col px-5 py-6 safe-top safe-bottom relative bg-background overflow-hidden">
      {/* Minimal Header - Settings Only */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end mb-4 z-10"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={onOpenSettings}
          className="p-3 glass-panel rounded-full"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </motion.div>

      {/* Bento Grid */}
      <div className="flex-1 flex flex-col gap-4 z-10">
        {/* Hero Card - Neural Core + Readiness */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 glass-panel rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden"
        >
          {/* Ambient background glow */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at 50% 50%, hsl(var(--neon-cyan) / 0.15) 0%, transparent 60%)',
            }}
          />
          
          {/* Dynamic Animated Hero Icon */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <AnimatedHeroIcon />
            <NeuralBrain size={160} brainCharge={readiness} />
          </div>
        </motion.div>

      {/* Metric Cards - 3 Block Layout */}
      <div className="grid grid-cols-3 gap-3">
        {/* Max Streak Card (Endless Style - Warm) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden"
        >
          {/* Warm glow background */}
          <div className="absolute inset-0 bg-gradient-to-br from-bio-orange/10 to-transparent pointer-events-none" />
          <Flame className="w-5 h-5 text-bio-orange mb-2" />
          <span className="text-2xl font-extralight text-foreground tabular-nums">
            {endlessBestStreak}
          </span>
          <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
            Max Streak
          </span>
        </motion.div>

        {/* XP Card (Currency Style - Gold) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden"
        >
          {/* Gold glow background */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-gold/10 to-transparent pointer-events-none" />
          <Star className="w-5 h-5 text-neon-gold fill-neon-gold/50 mb-2" />
          <span className="text-2xl font-extralight text-foreground tabular-nums">
            {formatNumber(totalXP)}
          </span>
          <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
            Total XP
          </span>
        </motion.div>

        {/* Personal Best Card (Classic Style - Cool/Teal) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden"
        >
          {/* Cool glow background */}
          <div className="absolute inset-0 bg-gradient-to-br from-bio-teal/10 to-transparent pointer-events-none" />
          <Trophy className="w-5 h-5 text-bio-teal mb-2" />
          <span className="text-2xl font-extralight text-foreground tabular-nums">
            {formatNumber(classicHighScore)}
          </span>
          <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
            Personal Best
          </span>
        </motion.div>
      </div>
      </div>

      {/* Floating Action Button - Start Training */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
        className="pt-6 pb-2 z-10"
      >
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          onClick={onStartGame}
          className="w-full py-5 rounded-2xl bg-foreground text-background text-lg font-semibold tracking-wide flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg"
          style={{
            boxShadow: '0 10px 40px -10px hsl(var(--foreground) / 0.3)',
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-background/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
          />
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            <Zap className="w-5 h-5" />
          </motion.div>
          Start Training
        </motion.button>
      </motion.div>
    </div>
  );
};
