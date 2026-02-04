import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, RotateCcw, Skull, Home } from 'lucide-react';

interface FlashMemoryResultProps {
  level: number;
  score: number;
  highLevel: number;
  isNewHighLevel: boolean;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const FlashMemoryResult = ({ 
  level, 
  score, 
  highLevel, 
  isNewHighLevel,
  onPlayAgain, 
  onGoHome 
}: FlashMemoryResultProps) => {
  const [displayScore, setDisplayScore] = useState(0);

  // Fast score animation
  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const increment = score / steps;
    let current = 0;
    
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [score]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12 safe-top safe-bottom">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center"
        >
          <Skull className="w-8 h-8 text-destructive" />
        </motion.div>
        <h1 className="text-2xl font-bold text-destructive mb-2">Game Over</h1>
        {isNewHighLevel && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary"
          >
            <Trophy className="w-5 h-5" />
            <span className="font-bold">NEW RECORD!</span>
          </motion.div>
        )}
      </motion.div>

      {/* Main Stats */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="text-center space-y-6"
      >
        {/* Level Reached */}
        <div>
          <motion.div
            className="relative"
            animate={{ 
              textShadow: [
                '0 0 20px hsl(var(--secondary) / 0.5)',
                '0 0 40px hsl(var(--secondary) / 0.8)',
                '0 0 20px hsl(var(--secondary) / 0.5)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-8xl font-black font-mono text-secondary">
              {level}
            </span>
          </motion.div>
          <p className="text-muted-foreground text-lg mt-2">Level Reached</p>
        </div>

        {/* Score */}
        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center justify-center gap-3">
            <Zap className="w-6 h-6 text-primary" />
            <span className="text-4xl font-bold font-mono text-primary">
              {displayScore}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Points Earned</p>
        </div>

        {/* Best Level */}
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Target className="w-5 h-5" />
          <span className="font-mono">Best: Level {highLevel}</span>
        </div>
      </motion.div>

      {/* Action Buttons - INSTANT retry */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm space-y-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPlayAgain}
          className="w-full py-5 rounded-2xl btn-primary-glow text-xl font-bold uppercase tracking-wider flex items-center justify-center gap-3"
        >
          <RotateCcw className="w-6 h-6" />
          Retry Instantly
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoHome}
          className="w-full py-4 rounded-2xl bg-muted text-muted-foreground text-lg font-semibold flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Home
        </motion.button>
      </motion.div>
    </div>
  );
};
