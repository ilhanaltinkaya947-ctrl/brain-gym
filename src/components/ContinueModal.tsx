import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, Star, Flame, Loader2 } from 'lucide-react';
import { showRewarded, AD_CONFIG } from '@/utils/adManager';

interface ContinueModalProps {
  isOpen: boolean;
  currentXP: number;
  currentStreak: number;
  currentScore: number;
  onContinueWithAd: () => void;
  onContinueWithXP: () => void;
  onEndRun: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15, delay: 0.05 } },
};

const cardVariants = {
  hidden: { y: 120, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 26, delay: 0.05 },
  },
  exit: { y: 80, opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

const itemFade = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24, delay: 0.15 + i * 0.05 },
  }),
};

export const ContinueModal = ({
  isOpen,
  currentXP,
  currentStreak,
  currentScore,
  onContinueWithAd,
  onContinueWithXP,
  onEndRun,
}: ContinueModalProps) => {
  const [countdown, setCountdown] = useState(AD_CONFIG.CONTINUE_COUNTDOWN);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const canContinue = currentXP >= AD_CONFIG.CONTINUE_COST;

  useEffect(() => {
    if (!isOpen) {
      setCountdown(AD_CONFIG.CONTINUE_COUNTDOWN);
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          onEndRun();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isOpen, onEndRun]);

  const handleWatchAd = async () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsLoadingAd(true);
    try {
      await showRewarded();
      onContinueWithAd();
    } catch {
      onContinueWithAd();
    } finally {
      setIsLoadingAd(false);
    }
  };

  const handleSkipWithXP = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    onContinueWithXP();
  };

  const progress = countdown / AD_CONFIG.CONTINUE_COUNTDOWN;
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference * (1 - progress);
  const isUrgent = countdown <= 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-sm glass-panel rounded-3xl p-6 flex flex-col items-center gap-4 mb-safe"
            style={{
              border: `1px solid ${isUrgent ? 'hsl(0, 70%, 45% / 0.5)' : 'hsl(25, 80%, 50% / 0.3)'}`,
              boxShadow: isUrgent
                ? '0 0 50px hsl(0, 70%, 40% / 0.3)'
                : '0 0 40px hsl(25, 80%, 50% / 0.15)',
              transition: 'border-color 0.5s, box-shadow 0.5s',
            }}
          >
            {/* Countdown Ring */}
            <motion.div
              className="relative w-24 h-24 flex items-center justify-center"
              animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
            >
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="hsl(0, 0%, 100%, 0.08)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke={isUrgent ? 'hsl(0, 80%, 55%)' : 'hsl(25, 90%, 55%)'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.9, ease: 'linear' }}
                  style={{
                    filter: `drop-shadow(0 0 6px ${isUrgent ? 'hsl(0, 80%, 55% / 0.6)' : 'hsl(25, 90%, 55% / 0.4)'})`,
                  }}
                />
              </svg>
              <AnimatePresence mode="wait">
                <motion.span
                  key={countdown}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`text-3xl font-bold tabular-nums ${isUrgent ? 'text-red-400' : 'text-foreground'}`}
                >
                  {countdown}
                </motion.span>
              </AnimatePresence>
            </motion.div>

            {/* Title */}
            <motion.h2
              custom={0}
              variants={itemFade}
              initial="hidden"
              animate="visible"
              className="text-2xl font-bold text-foreground tracking-wide"
            >
              Continue?
            </motion.h2>

            {/* Current Stats */}
            <motion.div
              custom={1}
              variants={itemFade}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-bio-orange" />
                <span className="text-sm font-medium text-foreground tabular-nums">{currentStreak}</span>
              </div>
              <div className="w-px h-4 bg-foreground/20" />
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-neon-gold" />
                <span className="text-sm font-medium text-foreground tabular-nums">{currentScore.toLocaleString()} pts</span>
              </div>
            </motion.div>

            {/* XP Balance */}
            <motion.div
              custom={2}
              variants={itemFade}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-gold/10 border border-neon-gold/20"
            >
              <Star className="w-3.5 h-3.5 text-neon-gold fill-neon-gold/50" />
              <span className="text-xs font-medium text-neon-gold tabular-nums">{currentXP.toLocaleString()} XP</span>
            </motion.div>

            {/* Watch Ad */}
            <motion.button
              custom={3}
              variants={itemFade}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleWatchAd}
              disabled={isLoadingAd}
              className="w-full py-4 rounded-2xl font-semibold tracking-wide flex items-center justify-center gap-3"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--bio-teal)), hsl(var(--bio-teal) / 0.8))',
                color: 'hsl(var(--background))',
                boxShadow: '0 6px 24px -6px hsl(var(--bio-teal) / 0.35)',
              }}
            >
              {isLoadingAd ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading ad...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Watch Ad to Continue
                </>
              )}
            </motion.button>

            {/* Continue with XP */}
            <motion.button
              custom={4}
              variants={itemFade}
              initial="hidden"
              animate="visible"
              whileHover={canContinue ? { scale: 1.02 } : {}}
              whileTap={canContinue ? { scale: 0.96 } : {}}
              onClick={canContinue ? handleSkipWithXP : undefined}
              disabled={!canContinue || isLoadingAd}
              className={`w-full py-4 rounded-2xl font-medium tracking-wide flex items-center justify-center gap-3 border transition-all ${
                canContinue
                  ? 'glass-panel border-foreground/20 text-foreground'
                  : 'border-foreground/10 text-muted-foreground/40'
              }`}
            >
              <Zap className="w-4 h-4" />
              {canContinue ? `Use ${AD_CONFIG.CONTINUE_COST.toLocaleString()} XP` : 'Not enough XP'}
            </motion.button>

            {/* End Run */}
            <motion.button
              custom={5}
              variants={itemFade}
              initial="hidden"
              animate="visible"
              whileTap={{ scale: 0.95 }}
              onClick={onEndRun}
              disabled={isLoadingAd}
              className="text-xs text-muted-foreground/60 uppercase tracking-wider py-2 hover:text-foreground/80 transition-colors"
            >
              End Run
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
