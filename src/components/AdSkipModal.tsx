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

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.88, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 24, delay: 0.05 },
  },
  exit: { opacity: 0, scale: 0.92, y: 20, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24, delay: 0.12 + i * 0.06 },
  }),
};

export const AdSkipModal = ({ isOpen, currentXP, onWatchAd, onSkipWithXP }: AdSkipModalProps) => {
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const canSkip = currentXP >= AD_CONFIG.SKIP_COST;

  const handleWatchAd = async () => {
    setIsLoadingAd(true);
    try {
      await showInterstitial();
      onWatchAd();
    } catch {
      onWatchAd();
    } finally {
      setIsLoadingAd(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        >
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          {/* Card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-sm glass-panel rounded-3xl p-6 flex flex-col items-center gap-5"
            style={{
              boxShadow: '0 0 60px -15px hsl(var(--bio-teal) / 0.15)',
            }}
          >
            {/* Title */}
            <motion.h2
              custom={0}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-xl font-semibold text-foreground tracking-wide"
            >
              Continue Training
            </motion.h2>

            {/* XP Balance */}
            <motion.div
              custom={1}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-neon-gold/10 border border-neon-gold/20"
            >
              <Star className="w-4 h-4 text-neon-gold fill-neon-gold/50" />
              <span className="text-sm font-medium text-neon-gold tabular-nums">
                {currentXP.toLocaleString()} XP
              </span>
            </motion.div>

            {/* Watch Ad Button */}
            <motion.button
              custom={2}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleWatchAd}
              disabled={isLoadingAd}
              className="w-full py-4 rounded-2xl font-semibold tracking-wide flex items-center justify-center gap-3 transition-colors"
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
                  Watch Ad
                </>
              )}
            </motion.button>

            {/* Skip with XP Button */}
            <motion.button
              custom={3}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={canSkip ? { scale: 1.02 } : {}}
              whileTap={canSkip ? { scale: 0.96 } : {}}
              onClick={canSkip ? onSkipWithXP : undefined}
              disabled={!canSkip || isLoadingAd}
              className={`w-full py-4 rounded-2xl font-medium tracking-wide flex items-center justify-center gap-3 border transition-all ${
                canSkip
                  ? 'glass-panel border-foreground/20 text-foreground'
                  : 'border-foreground/10 text-muted-foreground/40'
              }`}
            >
              <Zap className="w-4 h-4" />
              {canSkip ? `Skip (-${AD_CONFIG.SKIP_COST.toLocaleString()} XP)` : 'Not enough XP'}
            </motion.button>

            {/* Footer */}
            <motion.p
              custom={4}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-[10px] text-muted-foreground/50 uppercase tracking-wider"
            >
              Ads help keep AXON free
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
