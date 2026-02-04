import { motion } from 'framer-motion';
import { Brain, Zap, Trophy, Calendar, Grid3X3 } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface DashboardProps {
  onStartGame: () => void;
  onStartFlashMemory: () => void;
  brainCharge: number;
  highScore: number;
  flashHighScore: number;
  streak: number;
}

export const Dashboard = ({ onStartGame, onStartFlashMemory, brainCharge, highScore, flashHighScore, streak }: DashboardProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12 safe-top safe-bottom relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Brain className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight">
            <span className="text-gradient-neon">Neuro</span>
            <span className="text-foreground">Flow</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-sm uppercase tracking-widest">Neural Training System</p>
      </motion.div>

      {/* Main Progress Ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="relative z-10"
      >
        <CircularProgress percentage={brainCharge} size={300} strokeWidth={18}>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-7xl font-black text-glow-cyan"
            >
              {brainCharge}%
            </motion.div>
            <p className="text-muted-foreground text-sm mt-2 uppercase tracking-wider">Brain Charge</p>
          </div>
        </CircularProgress>

        {/* Floating energy orbs */}
        <motion.div
          animate={{ y: [0, -15, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-6 -right-6 w-12 h-12 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-cyan) / 0.6), transparent)',
            filter: 'blur(4px)',
          }}
        />
        <motion.div
          animate={{ y: [0, 12, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute -bottom-4 -left-8 w-10 h-10 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-magenta) / 0.5), transparent)',
            filter: 'blur(4px)',
          }}
        />
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm grid grid-cols-3 gap-3 z-10"
      >
        <div className="card-glass card-glass-hover rounded-2xl p-4 transition-all duration-300">
          <div className="flex items-center gap-1 mb-2">
            <Trophy className="w-4 h-4 text-neon-gold" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Best</span>
          </div>
          <p className="text-2xl font-black font-mono text-glow-gold">{highScore.toLocaleString()}</p>
        </div>
        
        <div className="card-glass card-glass-hover rounded-2xl p-4 transition-all duration-300">
          <div className="flex items-center gap-1 mb-2">
            <Grid3X3 className="w-4 h-4 text-secondary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Flash</span>
          </div>
          <p className="text-2xl font-black font-mono">L{flashHighScore}</p>
        </div>
        
        <div className="card-glass card-glass-hover rounded-2xl p-4 transition-all duration-300">
          <div className="flex items-center gap-1 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Streak</span>
          </div>
          <p className="text-2xl font-black font-mono">{streak}</p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm space-y-4 z-10"
      >
        {/* Epic Reactor Start Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStartGame}
          className="w-full py-6 rounded-3xl btn-primary-glow reactor-pulse text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-3"
        >
          <Zap className="w-7 h-7" />
          Start Training
        </motion.button>

        {/* Secondary Flash Memory Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartFlashMemory}
          className="w-full py-5 rounded-2xl btn-secondary-glow text-xl font-bold uppercase tracking-wider flex items-center justify-center gap-3"
        >
          <Grid3X3 className="w-6 h-6" />
          Flash Memory
        </motion.button>
      </motion.div>
    </div>
  );
};
