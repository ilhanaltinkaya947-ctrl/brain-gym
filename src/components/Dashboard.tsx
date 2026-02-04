import { motion } from 'framer-motion';
import { Zap, Activity, Settings } from 'lucide-react';
import { AnimatedBrain } from './AnimatedBrain';

interface DashboardProps {
  onStartGame: () => void;
  onStartFlashMemory: () => void;
  onOpenSettings: () => void;
  brainCharge: number;
  highScore: number;
  flashHighScore: number;
  streak: number;
}

export const Dashboard = ({ onStartGame, onStartFlashMemory, onOpenSettings }: DashboardProps) => {
  return (
    <div className="h-screen flex flex-col items-center justify-between px-6 py-10 safe-top safe-bottom relative bg-background overflow-hidden">
      {/* Settings Button - Top Right */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        onClick={onOpenSettings}
        className="absolute top-6 right-6 p-3 rounded-full bg-muted/30 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors border border-border/30 z-10"
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      {/* Header - AXON Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10 pt-4"
      >
        <motion.div 
          className="flex items-center justify-center gap-3 mb-1"
          whileHover={{ scale: 1.02 }}
        >
          {/* AXON Logo - Stylized neural pulse */}
          <motion.div
            animate={{ 
              boxShadow: [
                '0 0 20px hsl(25 90% 55% / 0.3)',
                '0 0 35px hsl(25 90% 55% / 0.5)',
                '0 0 20px hsl(25 90% 55% / 0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-bio-orange to-bio-gold flex items-center justify-center"
          >
            <Zap className="w-5 h-5 text-black" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-widest">
            <span className="text-gradient-speed">AXON</span>
          </h1>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-[9px] font-medium uppercase tracking-[0.4em]"
        >
          Train Your Neural Pathways
        </motion.p>
      </motion.div>

      {/* Animated Brain - Hero Element */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 60 }}
        className="flex-1 flex items-center justify-center z-0"
      >
        <AnimatedBrain />
      </motion.div>

      {/* Action Buttons - Brilliant-style micro-interactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm space-y-3 z-10 pb-4"
      >
        {/* Primary Start Button - Big, juicy, satisfying */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          onClick={onStartGame}
          className="w-full py-5 rounded-2xl btn-primary-glow text-lg font-semibold tracking-wide flex items-center justify-center gap-3 relative overflow-hidden group"
        >
          {/* Shine effect on hover */}
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

        {/* Secondary Flash Memory Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          onClick={onStartFlashMemory}
          className="w-full py-4 rounded-xl btn-secondary-glow text-base font-medium tracking-wide flex items-center justify-center gap-3"
        >
          <Activity className="w-4 h-4" />
          Flash Memory
        </motion.button>
      </motion.div>
    </div>
  );
};
