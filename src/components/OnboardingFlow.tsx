import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Zap, Brain, Grid3X3, GitCompare, Calculator, Box, ArrowUpDown, Type } from 'lucide-react';

interface OnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ONBOARDING_SCREENS = [
  {
    id: 'welcome',
    icon: Brain,
    title: 'Welcome to AXON',
    subtitle: 'Train Your Neural Pathways',
    description: 'AXON is a high-cognitive load brain training platform that adapts to your performance in real-time. The faster you answer, the faster the game becomes.',
    color: 'hsl(25 90% 55%)',
  },
  {
    id: 'goal',
    icon: Zap,
    title: 'Your Goal',
    subtitle: 'Push Your Limits',
    description: 'In Endless Mode, survive as long as possible — one mistake ends the game. The app watches your speed and adjusts difficulty dynamically. Enter "Overdrive" to experience maximum intensity.',
    color: 'hsl(45 90% 55%)',
  },
  {
    id: 'flash-memory',
    icon: Grid3X3,
    title: 'Flash Memory',
    subtitle: 'Visual Working Memory',
    description: 'Numbers appear briefly on a grid, then hide. Tap them in order (1 → 2 → 3...). The grid grows larger and numbers appear faster as you improve.',
    color: 'hsl(280 70% 55%)',
  },
  {
    id: 'word-connect',
    icon: Type,
    title: 'Word Connect',
    subtitle: 'Verbal Fluency',
    description: 'Drag through letters arranged in a circle to form words. Find the target word to advance. Bonus words earn extra points! Tests vocabulary and pattern recognition.',
    color: 'hsl(210 80% 55%)',
  },
  {
    id: 'nback',
    icon: GitCompare,
    title: 'N-Back Ghost',
    subtitle: 'Fluid Intelligence',
    description: 'Mystical runes appear one by one. Press "MATCH" if the current rune is the same as the one from 2 steps ago. Tests your working memory capacity.',
    color: 'hsl(180 60% 50%)',
  },
  {
    id: 'operator',
    icon: Calculator,
    title: 'Operator Chaos',
    subtitle: 'Deductive Logic',
    description: 'Equations with missing operators appear: 6 [?] 2 = 3. Select the correct operator (+, −, ×, ÷) to solve it. Harder levels have multiple missing operators.',
    color: 'hsl(45 90% 55%)',
  },
  {
    id: 'spatial',
    icon: Box,
    title: 'Spatial Stack',
    subtitle: 'Spatial Visualization',
    description: 'Count ALL cubes in a 3D stack — including the hidden ones underneath! Enter the total number. Trains your ability to mentally rotate and visualize objects.',
    color: 'hsl(140 70% 50%)',
  },
  {
    id: 'paradox',
    icon: ArrowUpDown,
    title: 'Paradox Flow',
    subtitle: 'Inhibition Control',
    description: 'An arrow points in a direction. "FOLLOW" means swipe that way. "AVOID" means swipe ANY other direction. Tests your ability to override automatic responses.',
    color: 'hsl(25 90% 55%)',
  },
  {
    id: 'ready',
    icon: Zap,
    title: "You're Ready",
    subtitle: 'Begin Your Training',
    description: 'Games are randomly mixed to keep you sharp. Your brain will adapt, and so will AXON. Good luck, and push your neural limits!',
    color: 'hsl(25 90% 55%)',
  },
];

export const OnboardingFlow = ({ isOpen, onClose, onComplete }: OnboardingProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const screen = ONBOARDING_SCREENS[currentIndex];
  const Icon = screen.icon;
  const isLast = currentIndex === ONBOARDING_SCREENS.length - 1;
  const isFirst = currentIndex === 0;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Close/Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={handleSkip}
            className="absolute top-6 right-6 p-2 rounded-full bg-muted/30 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Progress dots */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {ONBOARDING_SCREENS.map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: i === currentIndex 
                    ? screen.color 
                    : i < currentIndex 
                      ? `${screen.color}80` 
                      : 'hsl(0 0% 20%)',
                }}
                animate={i === currentIndex ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="h-full flex flex-col items-center justify-center px-8 py-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={screen.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center max-w-sm"
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
                  style={{
                    background: `linear-gradient(135deg, ${screen.color}30, ${screen.color}10)`,
                    border: `2px solid ${screen.color}50`,
                    boxShadow: `0 0 40px ${screen.color}30`,
                  }}
                >
                  <Icon className="w-12 h-12" style={{ color: screen.color }} />
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-3xl font-black tracking-tight mb-2"
                  style={{ color: screen.color }}
                >
                  {screen.title}
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-6"
                >
                  {screen.subtitle}
                </motion.p>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-base text-foreground/80 leading-relaxed"
                >
                  {screen.description}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="absolute bottom-10 left-0 right-0 px-8">
            <div className="flex items-center justify-between max-w-sm mx-auto">
              {/* Back button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePrev}
                className={`p-4 rounded-full transition-colors ${
                  isFirst 
                    ? 'opacity-0 pointer-events-none' 
                    : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>

              {/* Page indicator */}
              <span className="text-sm text-muted-foreground font-mono">
                {currentIndex + 1} / {ONBOARDING_SCREENS.length}
              </span>

              {/* Next/Complete button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="p-4 rounded-full flex items-center gap-2 font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${screen.color}, ${screen.color}cc)`,
                  color: 'black',
                  boxShadow: `0 0 20px ${screen.color}50`,
                }}
              >
                {isLast ? (
                  <span className="px-2">Start</span>
                ) : (
                  <ChevronRight className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
