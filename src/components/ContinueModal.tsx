import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, Star, Flame, Loader2, X } from 'lucide-react';
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

  // Countdown timer
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
    // Pause countdown while watching ad
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsLoadingAd(true);
    try {
      await showRewarded();
      onContinueWithAd();
    } catch {
      onContinueWithAd(); // Continue even if ad fails
    } finally {
      setIsLoadingAd(false);
    }
  };

  const handleSkipWithXP = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    onContinueWithXP();
  };

  // Countdown ring progress (1 = full, 0 = empty)
  const progress = countdown / AD_CONFIG.CONTINUE_COUNTDOWN;
  const circumference = 2 * Math.PI * 44; // r=44
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" />

          {/* Card — slides up from bottom */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full max-w-sm glass-panel rounded-3xl p-6 flex flex-col items-center gap-4"
            style={{
              border: '1px solid hsl(0, 70%, 40% / 0.4)',
              boxShadow: '0 0 40px hsl(0, 70%, 40% / 0.2), 0 0 80px hsl(25, 80%, 50% / 0.1)',
            }}
          >
            {/* Countdown Ring */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                {/* Background ring */}
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="hsl(0, 0%, 100%, 0.1)"
                  strokeWidth="4"
                />
                {/* Progress ring */}
                <motion.circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke={countdown <= 2 ? 'hsl(0, 80%, 55%)' : 'hsl(25, 90%, 55%)'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.9, ease: 'linear' }}
                />
              </svg>
              <motion.span
                key={countdown}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold text-foreground tabular-nums"
              >
                {countdown}
              </motion.span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground tracking-wide">
              Continue?
            </h2>

            {/* Current Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-bio-orange" />
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {currentStreak}
                </span>
              </div>
              <div className="w-px h-4 bg-foreground/20" />
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-neon-gold" />
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {currentScore.toLocaleString()} pts
                </span>
              </div>
            </div>

            {/* XP Balance */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-gold/10 border border-neon-gold/20">
              <Star className="w-3.5 h-3.5 text-neon-gold fill-neon-gold/50" />
              <span className="text-xs font-medium text-neon-gold tabular-nums">
                {currentXP.toLocaleString()} XP
              </span>
            </div>

            {/* Watch Ad to Continue */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleWatchAd}
              disabled={isLoadingAd}
              className="w-full py-4 rounded-2xl font-semibold tracking-wide flex items-center justify-center gap-3"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--bio-teal)), hsl(var(--bio-teal) / 0.8))',
                color: 'hsl(var(--background))',
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
              whileTap={canContinue ? { scale: 0.97 } : {}}
              onClick={canContinue ? handleSkipWithXP : undefined}
              disabled={!canContinue || isLoadingAd}
              className={`w-full py-4 rounded-2xl font-medium tracking-wide flex items-center justify-center gap-3 border transition-all ${
                canContinue
                  ? 'glass-panel border-foreground/20 text-foreground'
                  : 'border-foreground/10 text-muted-foreground/40'
              }`}
            >
              <Zap className="w-4 h-4" />
              {canContinue ? (
                `Use ${AD_CONFIG.CONTINUE_COST} XP to Continue`
              ) : (
                'Not enough XP'
              )}
            </motion.button>

            {/* End Run */}
            <button
              onClick={onEndRun}
              disabled={isLoadingAd}
              className="text-xs text-muted-foreground/50 uppercase tracking-wider py-2 hover:text-muted-foreground transition-colors"
            >
              End Run
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
