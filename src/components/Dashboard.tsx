import { motion } from 'framer-motion';
import { Zap, Settings, Star, Flame } from 'lucide-react';
import { NeuralBrain } from './NeuralBrain';

interface DashboardProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  brainCharge: number;
  highScore: number;
  totalXP: number;
  streak: number;
}

export const Dashboard = ({ 
  onStartGame, 
  onOpenSettings, 
  brainCharge,
  totalXP, 
  streak 
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
          
          {/* Neural Brain Visual */}
          <div className="relative z-10 mb-4">
            <NeuralBrain size={180} brainCharge={readiness} />
          </div>

          {/* Readiness Score */}
          <div className="text-center z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-baseline justify-center gap-1"
            >
              <span className="text-6xl font-extralight tracking-tight text-foreground">
                {readiness}
              </span>
              <span className="text-2xl font-extralight text-foreground/50">%</span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1"
            >
              Readiness
            </motion.p>
          </div>
        </motion.div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel rounded-2xl p-5 flex flex-col items-center justify-center"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-bio-orange" />
            </div>
            <span className="text-3xl font-extralight text-foreground">
              {streak}
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Day Streak
            </span>
          </motion.div>

          {/* XP Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-panel rounded-2xl p-5 flex flex-col items-center justify-center"
          >
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-neon-gold fill-neon-gold/50" />
            </div>
            <span className="text-3xl font-extralight text-foreground">
              {formatNumber(totalXP)}
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Total XP
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
