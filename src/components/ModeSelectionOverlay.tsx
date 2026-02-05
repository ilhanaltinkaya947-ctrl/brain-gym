import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Infinity, X, Zap, Skull } from 'lucide-react';

interface ModeSelectionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'classic' | 'endless') => void;
}

export const ModeSelectionOverlay = ({ 
  isOpen, 
  onClose, 
  onSelectMode 
}: ModeSelectionOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-sm"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-2">
                  Select Protocol
                </p>
                <h2 className="text-2xl font-thin tracking-tight text-foreground">
                  Choose Your Challenge
                </h2>
              </motion.div>
            </div>

            {/* Mode Cards */}
            <div className="space-y-3">
              {/* Classic Mode */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectMode('classic')}
                className="w-full glass-panel rounded-2xl p-5 text-left group relative overflow-hidden"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
                    <Clock className="w-6 h-6 text-neon-cyan" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">Classic Protocol</h3>
                      <span className="px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan text-[9px] uppercase tracking-wider font-bold">
                        Timed
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      2-minute endurance and accuracy test. Score as high as possible before time runs out.
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Zap className="w-3 h-3 text-neon-gold" />
                      <span>120 seconds</span>
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* Endless Mode */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectMode('endless')}
                className="w-full glass-panel rounded-2xl p-5 text-left group relative overflow-hidden"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-bio-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-bio-orange/10 border border-bio-orange/20">
                    <Infinity className="w-6 h-6 text-bio-orange" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">Endless Protocol</h3>
                      <span className="px-2 py-0.5 rounded-full bg-bio-orange/20 text-bio-orange text-[9px] uppercase tracking-wider font-bold">
                        Survival
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Sudden death mode. One mistake ends the session. How long can you survive?
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Skull className="w-3 h-3 text-destructive" />
                      <span>Zero tolerance</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={onClose}
              className="w-full mt-4 py-3 rounded-xl text-muted-foreground text-sm font-medium hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
