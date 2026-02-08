import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, Star, Loader2 } from 'lucide-react';
import { showInterstitial, AD_CONFIG } from '@/utils/adManager';

interface AdSkipModalProps {
  isOpen: boolean;
  currentXP: number;
  onWatchAd: () => void;
  onSkipWithXP: () => void;
}

export const AdSkipModal = ({ isOpen, currentXP, onWatchAd, onSkipWithXP }: AdSkipModalProps) => {
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const canSkip = currentXP >= AD_CONFIG.SKIP_COST;

  const handleWatchAd = async () => {
    setIsLoadingAd(true);
    try {
      await showInterstitial();
      onWatchAd();
    } catch {
      onWatchAd(); // Continue even if ad fails
    } finally {
      setIsLoadingAd(false);
    }
  };

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
          <div className="absolute inset-0 bg-black/80" />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm glass-panel rounded-3xl p-6 flex flex-col items-center gap-5"
          >
            {/* Title */}
            <h2 className="text-xl font-semibold text-foreground tracking-wide">
              Continue Training
            </h2>

            {/* XP Balance */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neon-gold/10 border border-neon-gold/20">
              <Star className="w-4 h-4 text-neon-gold fill-neon-gold/50" />
              <span className="text-sm font-medium text-neon-gold tabular-nums">
                {currentXP.toLocaleString()} XP
              </span>
            </div>

            {/* Watch Ad Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleWatchAd}
              disabled={isLoadingAd}
              className="w-full py-4 rounded-2xl font-semibold tracking-wide flex items-center justify-center gap-3 transition-all"
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
                  Watch Ad
                </>
              )}
            </motion.button>

            {/* Skip with XP Button */}
            <motion.button
              whileTap={canSkip ? { scale: 0.97 } : {}}
              onClick={canSkip ? onSkipWithXP : undefined}
              disabled={!canSkip || isLoadingAd}
              className={`w-full py-4 rounded-2xl font-medium tracking-wide flex items-center justify-center gap-3 border transition-all ${
                canSkip
                  ? 'glass-panel border-foreground/20 text-foreground'
                  : 'border-foreground/10 text-muted-foreground/40'
              }`}
            >
              <Zap className="w-4 h-4" />
              {canSkip ? (
                `Skip (-${AD_CONFIG.SKIP_COST} XP)`
              ) : (
                'Not enough XP'
              )}
            </motion.button>

            {/* Footer */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Ads help keep AXON free
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
