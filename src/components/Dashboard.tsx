import { motion } from 'framer-motion';
import { Brain, Zap, Trophy, Calendar } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface DashboardProps {
  onStartGame: () => void;
  brainCharge: number;
  highScore: number;
  streak: number;
}

export const Dashboard = ({ onStartGame, brainCharge, highScore, streak }: DashboardProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12 safe-top safe-bottom">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-glow-neon">Neuro</span>
            <span className="text-secondary">Flow</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">Daily Brain Training</p>
      </motion.div>

      {/* Main Progress Ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="relative"
      >
        <CircularProgress percentage={brainCharge} size={280} strokeWidth={16}>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-6xl font-bold text-glow-neon"
            >
              {brainCharge}%
            </motion.div>
            <p className="text-muted-foreground text-sm mt-1">Brain Charge</p>
          </div>
        </CircularProgress>

        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-primary/30 blur-sm"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-2 -left-6 w-6 h-6 rounded-full bg-secondary/30 blur-sm"
        />
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm grid grid-cols-2 gap-4"
      >
        <div className="card-glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">High Score</span>
          </div>
          <p className="text-2xl font-bold font-mono">{highScore.toLocaleString()}</p>
        </div>
        
        <div className="card-glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-secondary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Day Streak</span>
          </div>
          <p className="text-2xl font-bold font-mono">{streak}</p>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStartGame}
        className="w-full max-w-sm py-5 rounded-2xl btn-primary-glow text-xl font-bold uppercase tracking-wider flex items-center justify-center gap-3 animate-pulse-glow"
      >
        <Zap className="w-6 h-6" />
        Start Training
      </motion.button>
    </div>
  );
};
