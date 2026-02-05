import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home, Trophy, Target, Zap, Flame, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultScreenProps {
  score: number;
  correct: number;
  wrong: number;
  streak?: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
  isNewHighScore: boolean;
  xpGained?: number;
  totalXP?: number;
  mode?: 'classic' | 'endless';
  sessionDuration?: number; // in seconds
}

export const ResultScreen = ({
  score,
  correct,
  wrong,
  streak = 0,
  onPlayAgain,
  onGoHome,
  isNewHighScore,
  xpGained = 0,
  mode = 'classic',
  sessionDuration = 0,
}: ResultScreenProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [displayXP, setDisplayXP] = useState(0);

  // Calculate Bio-Metrics with correct formula
  const totalAttempts = correct + wrong;
  const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;
  const xpEarned = xpGained > 0 ? xpGained : Math.floor(correct * 10 + Math.floor(streak / 5) * 25);

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  // XP count-up animation
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = xpEarned / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= xpEarned) {
        setDisplayXP(xpEarned);
        clearInterval(timer);
      } else {
        setDisplayXP(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [xpEarned]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6A00', '#FFD60A', '#00D4FF']
    });
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const isEndless = mode === 'endless';

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
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-2">
            {isEndless ? 'Run Complete' : 'Session Complete'}
          </p>
          
          {/* Hero Metric - Score for Classic, Streak for Endless */}
          {isEndless ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-6xl font-thin tracking-tighter text-foreground tabular-nums">
                {streak}
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Max Streak</p>
            </>
          ) : (
            <h1 className="text-5xl font-thin tracking-tighter text-foreground tabular-nums">
              {displayScore}
            </h1>
          )}
          
          {isNewHighScore && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-neon-gold/20 text-neon-gold border border-neon-gold/20"
            >
              <Trophy className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">New Personal Best</span>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Grid (Bento Style) - Different for each mode */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          
          {isEndless ? (
            <>
              {/* Flow Duration - Endless Mode */}
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
                <Clock className="w-5 h-5 text-bio-teal mb-1" />
                <span className="text-2xl font-light text-foreground tabular-nums">
                  {formatDuration(sessionDuration)}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Flow Duration</span>
              </div>

              {/* Score - Endless Mode */}
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
                <Trophy className="w-5 h-5 text-neon-gold mb-1" />
                <span className="text-2xl font-light text-foreground tabular-nums">{displayScore}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Total Score</span>
              </div>
            </>
          ) : (
            <>
              {/* Accuracy - Classic Mode */}
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
                <Target className="w-5 h-5 text-primary mb-1" />
                <span className="text-2xl font-light text-foreground tabular-nums">{accuracy}%</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Accuracy</span>
              </div>

              {/* Streak - Classic Mode */}
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
                <Flame className="w-5 h-5 text-primary mb-1" />
                <span className="text-2xl font-light text-foreground tabular-nums">{streak}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Best Streak</span>
              </div>
            </>
          )}

          {/* XP Earned - Both Modes */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
            <Zap className="w-5 h-5 text-neon-gold mb-1" />
            <span className="text-2xl font-light text-foreground tabular-nums">+{displayXP}</span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">XP Gained</span>
          </div>

          {/* Correct/Wrong - Both Modes */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-lg font-light text-success tabular-nums">{correct}</div>
                <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Hit</div>
              </div>
              <div className="h-6 w-[1px] bg-border" />
              <div className="text-center">
                <div className="text-lg font-light text-destructive tabular-nums">{wrong}</div>
                <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Miss</div>
              </div>
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
