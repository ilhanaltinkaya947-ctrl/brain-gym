import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Infinity as InfinityIcon, X, Zap, Skull, Target, Flame, Crown, LucideIcon } from 'lucide-react';

export type ClassicDifficulty = 'novice' | 'advanced' | 'godTier';

interface ModeSelectionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'classic' | 'endless', startTier?: number) => void;
}

interface DifficultyOption {
  id: ClassicDifficulty;
  label: string;
  description: string;
  startTier: number;
  multiplier: string;
  Icon: LucideIcon;
  color: string;
  colorHsl: string;
}

const CLASSIC_DIFFICULTIES: DifficultyOption[] = [
  {
    id: 'novice',
    label: 'Novice',
    description: 'Start at Tier 1 with basic math. Recommended for beginners.',
    startTier: 1,
    multiplier: '1x',
    Icon: Target,
    color: 'neon-cyan',
    colorHsl: 'var(--neon-cyan)',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Start at Tier 3 with division and large numbers. 2.5x score multiplier.',
    startTier: 3,
    multiplier: '2.5x',
    Icon: Flame,
    color: 'neon-magenta',
    colorHsl: 'var(--neon-magenta)',
  },
  {
    id: 'godTier',
    label: 'God Tier',
    description: 'Extreme algebra and multi-step operations from the start. 5x score multiplier.',
    startTier: 4,
    multiplier: '5x',
    Icon: Crown,
    color: 'destructive',
    colorHsl: 'var(--destructive)',
  },
];

export const ModeSelectionOverlay = ({
  isOpen, 
  onClose, 
  onSelectMode 
}: ModeSelectionOverlayProps) => {
  const [showClassicDifficulty, setShowClassicDifficulty] = useState(false);

  const handleClassicSelect = () => {
    setShowClassicDifficulty(true);
  };

  const handleDifficultySelect = (startTier: number) => {
    setShowClassicDifficulty(false);
    onSelectMode('classic', startTier);
  };

  const handleEndlessSelect = () => {
    setShowClassicDifficulty(false);
    onSelectMode('endless');
  };

  const handleClose = () => {
    setShowClassicDifficulty(false);
    onClose();
  };

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
            onClick={handleClose}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-sm"
          >
            <AnimatePresence mode="wait">
              {!showClassicDifficulty ? (
                <motion.div
                  key="mode-select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
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
                      onClick={handleClassicSelect}
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
                            3-minute endurance and accuracy test. Choose your starting difficulty.
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                            <Zap className="w-3 h-3 text-neon-gold" />
                            <span>180 seconds</span>
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
                      onClick={handleEndlessSelect}
                      className="w-full glass-panel rounded-2xl p-5 text-left group relative overflow-hidden"
                    >
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-bio-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-bio-orange/10 border border-bio-orange/20">
                          <InfinityIcon className="w-6 h-6 text-bio-orange" />
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
                    onClick={handleClose}
                    className="w-full mt-4 py-3 rounded-xl text-muted-foreground text-sm font-medium hover:text-foreground transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="difficulty-select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Header */}
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-2">
                        Classic Protocol
                      </p>
                      <h2 className="text-2xl font-thin tracking-tight text-foreground">
                        Select Difficulty
                      </h2>
                    </motion.div>
                  </div>

                  {/* Difficulty Cards */}
                  <div className="space-y-3">
                    {CLASSIC_DIFFICULTIES.map((diff, index) => (
                      <motion.button
                        key={diff.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDifficultySelect(diff.startTier)}
                        className={`w-full glass-panel rounded-2xl p-4 text-left group relative overflow-hidden ${
                          diff.id === 'godTier' ? 'ring-1 ring-destructive/30' : ''
                        }`}
                      >
                        {/* God Tier special glow */}
                        {diff.id === 'godTier' && (
                          <motion.div
                            className="absolute inset-0 pointer-events-none"
                            animate={{
                              boxShadow: [
                                'inset 0 0 20px hsl(var(--destructive) / 0.2)',
                                'inset 0 0 40px hsl(var(--destructive) / 0.4)',
                                'inset 0 0 20px hsl(var(--destructive) / 0.2)',
                              ],
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                        
                        {/* Glow effect on hover */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: `linear-gradient(90deg, hsl(${diff.colorHsl} / 0.1), transparent)`,
                          }}
                        />
                        
                        <div className="relative flex items-center gap-4">
                          <div 
                            className="p-3 rounded-xl border"
                            style={{
                              background: `hsl(${diff.colorHsl} / 0.1)`,
                              borderColor: `hsl(${diff.colorHsl} / 0.2)`,
                            }}
                          >
                            <diff.Icon 
                              className="w-5 h-5"
                              style={{ color: `hsl(${diff.colorHsl})` }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold text-foreground">{diff.label}</h3>
                              <span 
                                className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold"
                                style={{
                                  background: `hsl(${diff.colorHsl} / 0.2)`,
                                  color: `hsl(${diff.colorHsl})`,
                                }}
                              >
                                {diff.multiplier}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {diff.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Back Button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setShowClassicDifficulty(false)}
                    className="w-full mt-4 py-3 rounded-xl text-muted-foreground text-sm font-medium hover:text-foreground transition-colors flex items-center justify-center gap-2"
                  >
                    ← Back to Modes
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
