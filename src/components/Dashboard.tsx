import { motion } from 'framer-motion';
 import { Zap, Settings, Star } from 'lucide-react';
import { BrainVisual } from './BrainVisual';
import { StreakFire } from './StreakFire';

interface DashboardProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  brainCharge: number;
  highScore: number;
  totalXP: number;
  streak: number;
}

 export const Dashboard = ({ onStartGame, onOpenSettings, totalXP, streak }: DashboardProps) => {
  // Format XP for display
  const formatXP = (xp: number) => {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}k`;
    }
    return xp.toString();
  };

  return (
    <div className="h-screen flex flex-col items-center justify-between px-6 py-10 safe-top safe-bottom relative bg-background overflow-hidden">
      {/* Settings Button - Top Right */}
       {/* Minimal Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
         className="w-full z-10"
      >
         <div className="flex justify-end items-center mb-4">
           <motion.button
             whileHover={{ scale: 1.1, rotate: 15 }}
             whileTap={{ scale: 0.9 }}
             onClick={onOpenSettings}
             className="p-3 bg-muted/30 rounded-full hover:bg-muted/50 transition-colors border border-border/30 backdrop-blur-md"
           >
             <Settings className="w-5 h-5 text-muted-foreground" />
           </motion.button>
         </div>

         {/* Stats Row */}
         <div className="flex items-center justify-center gap-4">
           <StreakFire streak={streak} />
           {totalXP > 0 && (
             <motion.div
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-gold/10 border border-neon-gold/30"
             >
               <Star className="w-3.5 h-3.5 text-neon-gold fill-neon-gold" />
               <span className="text-xs font-bold text-neon-gold">{formatXP(totalXP)} XP</span>
             </motion.div>
           )}
        </div>
      </motion.div>

      {/* Brain Visual - Hero Element */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 60 }}
        className="flex-1 flex items-center justify-center z-0"
      >
        <BrainVisual />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm space-y-3 z-10 pb-4"
      >
        {/* Primary Start Button */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          onClick={onStartGame}
          className="w-full py-5 rounded-2xl btn-primary-glow text-lg font-semibold tracking-wide flex items-center justify-center gap-3 relative overflow-hidden group"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
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
