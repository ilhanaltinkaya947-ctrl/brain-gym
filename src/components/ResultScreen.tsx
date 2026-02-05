import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home, Trophy, Target, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultScreenProps {
  score: number;
  correct: number;
  wrong: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
  isNewHighScore: boolean;
  xpGained?: number;
  totalXP?: number;
}

export const ResultScreen = ({
  score,
  correct,
  wrong,
  onPlayAgain,
  onGoHome,
  isNewHighScore,
  xpGained = 0,
}: ResultScreenProps) => {
  const [displayScore, setDisplayScore] = useState(0);

  // Calculate some "Bio-Metrics"
  const totalAttempts = correct + wrong;
  const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;
  const xpEarned = xpGained > 0 ? xpGained : score * 2;

  // Count-up animation logic
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = score / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
        if (isNewHighScore) triggerConfetti();
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score, isNewHighScore]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#8b5cf6', '#fbbf24']
    });
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-primary/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.1 }}
        className="w-full max-w-sm z-10 flex flex-col gap-6"
      >
        {/* Header */}
        <motion.div variants={item} className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-2">Session Complete</p>
          <h1 className="text-5xl font-thin tracking-tighter text-foreground tabular-nums">
            {displayScore}
          </h1>
          {isNewHighScore && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-neon-gold/20 text-neon-gold border border-neon-gold/20"
            >
              <Trophy className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">New Personal Best</span>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Grid (Bento Style) */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          
          {/* Accuracy */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
            <Target className="w-5 h-5 text-primary mb-1" />
            <span className="text-2xl font-light text-foreground">{accuracy}%</span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Accuracy</span>
          </div>

          {/* XP Earned */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
            <Zap className="w-5 h-5 text-neon-gold mb-1" />
            <span className="text-2xl font-light text-foreground">+{xpEarned}</span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">XP Gained</span>
          </div>

          {/* Correct/Wrong (Mini Detail) */}
          <div className="col-span-2 glass-panel p-4 rounded-2xl flex items-center justify-between px-8">
             <div className="text-center">
                <div className="text-xl font-light text-success">{correct}</div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Correct</div>
             </div>
             <div className="h-8 w-[1px] bg-border" />
             <div className="text-center">
                <div className="text-xl font-light text-destructive">{wrong}</div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Missed</div>
             </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={item} className="space-y-3 pt-4">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 rounded-2xl bg-foreground text-background font-semibold tracking-wide flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            Train Again
          </button>
          <button
            onClick={onGoHome}
            className="w-full py-4 rounded-2xl glass-panel text-foreground font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-card-hover transition-colors"
          >
            <Home className="w-4 h-4 text-muted-foreground" />
            Dashboard
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};
