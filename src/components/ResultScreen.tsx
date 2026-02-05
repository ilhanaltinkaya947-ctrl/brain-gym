import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home, Trophy, Target, Zap, Flame, Clock, Star } from 'lucide-react';
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
  sessionDuration?: number;
  previousBest?: number;
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
  previousBest = 0,
}: ResultScreenProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [displayXP, setDisplayXP] = useState(0);
  const [displayStreak, setDisplayStreak] = useState(0);

  // Calculate Bio-Metrics
  const totalAttempts = correct + wrong;
  const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;
  const xpEarned = xpGained > 0 ? xpGained : Math.floor(correct * 10 + Math.floor(streak / 5) * 25);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => num.toLocaleString();

  const isEndless = mode === 'endless';

  // Count-up animation for score (Classic hero)
  useEffect(() => {
    if (isEndless) {
      setDisplayScore(score);
      return;
    }
    
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
  }, [score, isNewHighScore, isEndless]);

  // Count-up animation for streak (Endless hero)
  useEffect(() => {
    if (!isEndless) {
      setDisplayStreak(streak);
      return;
    }

    let start = 0;
    const duration = 800;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = streak / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= streak) {
        setDisplayStreak(streak);
        clearInterval(timer);
        if (isNewHighScore) triggerConfetti();
      } else {
        setDisplayStreak(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [streak, isNewHighScore, isEndless]);

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
        {/* Header - Mode Specific Hero */}
        <motion.div variants={item} className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">
            {isEndless ? 'Endless Run Complete' : 'Classic Session Complete'}
          </p>
          
          {isEndless ? (
            /* ENDLESS MODE: Hero = Streak */
            <>
              <div className="flex items-center justify-center gap-3 mb-2">
                <Flame className="w-10 h-10 text-bio-orange" />
              </div>
              <h1 className="text-7xl font-thin tracking-tighter text-foreground tabular-nums">
                {displayStreak}
              </h1>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mt-2">Max Streak</p>
              
              {/* Best Streak Comparison - Large, Bold, Aesthetic */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-base font-semibold text-foreground/70 mt-4 tabular-nums"
              >
                {isNewHighScore ? (
                  <span className="text-neon-gold">🔥 New Record!</span>
                ) : (
                  <>Best Streak: {previousBest}</>
                )}
              </motion.p>
            </>
          ) : (
            /* CLASSIC MODE: Hero = Score */
            <>
              <div className="flex items-center justify-center gap-3 mb-2">
                <Trophy className="w-10 h-10 text-bio-teal" />
              </div>
              <h1 className="text-6xl font-thin tracking-tighter text-foreground tabular-nums">
                {formatNumber(displayScore)}
              </h1>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mt-2">Total Score</p>
              
              {/* High Score Comparison - Large, Bold, Aesthetic */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-base font-semibold text-foreground/70 mt-4 tabular-nums"
              >
                {isNewHighScore ? (
                  <span className="text-neon-gold">🏆 New Personal Best!</span>
                ) : (
                  <>High Score: {formatNumber(previousBest)}</>
                )}
              </motion.p>
            </>
          )}
          
          {/* New Record Badge */}
          {isNewHighScore && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-neon-gold/20 text-neon-gold border border-neon-gold/30"
            >
              <Star className="w-4 h-4 fill-neon-gold" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {isEndless ? 'New Longevity Record' : 'New Personal Best'}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Grid - Mode Specific */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          {isEndless ? (
            /* ENDLESS MODE STATS: Survival Time + XP Gained */
            <>
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-bio-orange/5 to-transparent pointer-events-none" />
                <Clock className="w-5 h-5 text-bio-teal mb-1" />
                <span className="text-2xl font-light text-foreground tabular-nums">
                  {formatDuration(sessionDuration)}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Survival Time</span>
              </div>

              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-gold/5 to-transparent pointer-events-none" />
                <Zap className="w-5 h-5 text-neon-gold mb-1" />
                <span className="text-2xl font-light text-foreground tabular-nums">+{displayXP}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">XP Gained</span>
              </div>
            </>
          ) : (
            /* CLASSIC MODE STATS: Accuracy + XP Gained */
            <>
              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-bio-teal/5 to-transparent pointer-events-none" />
                <Target className="w-5 h-5 text-bio-teal mb-1" />
                <span className="text-2xl font-light text-foreground tabular-nums">{accuracy}%</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Accuracy</span>
              </div>

              <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-gold/5 to-transparent pointer-events-none" />
                <Zap className="w-5 h-5 text-neon-gold mb-1" />
                <span className="text-2xl font-light text-foreground tabular-nums">+{displayXP}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">XP Gained</span>
              </div>
            </>
          )}
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
