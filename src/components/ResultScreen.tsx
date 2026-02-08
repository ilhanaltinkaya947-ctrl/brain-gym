import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Home, Trophy, Target, Zap, Flame, Clock, Star, Sparkles } from 'lucide-react';
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

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

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

  // Faster count-up: 600ms
  useEffect(() => {
    const target = isEndless ? streak : score;
    const setter = isEndless ? setDisplayStreak : setDisplayScore;
    if (isEndless) setDisplayScore(score); else setDisplayStreak(streak);

    let start = 0;
    const duration = 600;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setter(target);
        clearInterval(timer);
        if (isNewHighScore) triggerConfetti();
      } else {
        setter(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score, streak, isNewHighScore, isEndless]);

  // XP count-up: 500ms
  useEffect(() => {
    let start = 0;
    const duration = 500;
    const stepTime = 16;
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
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#FF6A00', '#FFD60A', '#00D4FF'],
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          background: isEndless
            ? 'radial-gradient(circle at 50% 40%, hsl(25 90% 55% / 0.08) 0%, transparent 60%)'
            : 'radial-gradient(circle at 50% 40%, hsl(173 80% 40% / 0.08) 0%, transparent 60%)',
        }}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm z-10 flex flex-col gap-5"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">
            {isEndless ? 'Endless Run Complete' : 'Classic Session Complete'}
          </p>

          {isEndless ? (
            <>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
                className="flex items-center justify-center mb-2"
              >
                <Flame className="w-10 h-10 text-bio-orange" />
              </motion.div>
              <h1 className="text-7xl font-thin tracking-tighter text-foreground tabular-nums">
                {displayStreak}
              </h1>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mt-2">Max Streak</p>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
                className="flex items-center justify-center mb-2"
              >
                <Trophy className="w-10 h-10 text-bio-teal" />
              </motion.div>
              <h1 className="text-6xl font-thin tracking-tighter text-foreground tabular-nums">
                {formatNumber(displayScore)}
              </h1>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mt-2">Total Score</p>
            </>
          )}

          {/* Best comparison */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className="text-base font-semibold text-foreground/70 mt-4 tabular-nums"
          >
            {isNewHighScore ? (
              <span className="text-neon-gold">New Record!</span>
            ) : (
              <>{isEndless ? 'Best Streak' : 'High Score'}: {isEndless ? previousBest : formatNumber(previousBest)}</>
            )}
          </motion.p>

          {/* New Record Badge */}
          <AnimatePresence>
            {isNewHighScore && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 15 }}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-neon-gold/20 text-neon-gold border border-neon-gold/30"
                style={{ boxShadow: '0 0 20px hsl(45 100% 50% / 0.15)' }}
              >
                <Star className="w-4 h-4 fill-neon-gold" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isEndless ? 'New Longevity Record' : 'New Personal Best'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          {/* Left stat */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.3 }}
            className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1 relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${isEndless ? 'from-bio-orange/5' : 'from-bio-teal/5'} to-transparent pointer-events-none`} />
            {isEndless ? (
              <>
                <Clock className="w-5 h-5 text-bio-teal mb-1" />
                <span className="text-2xl font-light text-foreground tabular-nums">{formatDuration(sessionDuration)}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Survival Time</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5 text-bio-teal mb-1" />
                <span className="text-2xl font-light text-foreground tabular-nums">{accuracy}%</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Accuracy</span>
              </>
            )}
          </motion.div>

          {/* XP Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.35 }}
            className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-1 relative overflow-hidden"
            style={{
              boxShadow: displayXP === xpEarned ? '0 0 20px hsl(45 100% 50% / 0.15)' : 'none',
              transition: 'box-shadow 0.3s',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-neon-gold/10 to-transparent pointer-events-none" />
            <motion.div
              animate={displayXP === xpEarned ? { rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Zap className="w-5 h-5 text-neon-gold mb-1" />
            </motion.div>
            <motion.span
              className="text-2xl font-light text-neon-gold tabular-nums"
              animate={displayXP === xpEarned ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.25 }}
            >
              +{displayXP}
            </motion.span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">XP Gained</span>

            {/* Sparkles */}
            <AnimatePresence>
              {displayXP === xpEarned && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0.5],
                        x: (Math.random() - 0.5) * 40,
                        y: -20 - Math.random() * 20,
                      }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className="absolute"
                    >
                      <Sparkles className="w-3 h-3 text-neon-gold" />
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={fadeUp} className="space-y-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            onClick={onPlayAgain}
            className="w-full py-4 rounded-2xl bg-foreground text-background font-semibold tracking-wide flex items-center justify-center gap-2"
            style={{ boxShadow: '0 8px 30px -8px hsl(var(--foreground) / 0.25)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Train Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            onClick={onGoHome}
            className="w-full py-4 rounded-2xl glass-panel text-foreground font-medium tracking-wide flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-muted-foreground" />
            Dashboard
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};
