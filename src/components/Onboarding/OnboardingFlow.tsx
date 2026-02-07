import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Plus, Minus, X, Divide, Spade, Heart, ArrowLeftRight, Brain } from 'lucide-react';
import { NeuralCore } from '../NeuralCore';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface Slide {
  id: string;
  title: string;
  description: string;
  visual: 'neural' | 'math' | 'paradox' | 'suit' | 'chimp';
}

const SLIDES: Slide[] = [
  {
    id: 'mission',
    title: 'Unlock Your Potential',
    description: 'Welcome to your Bio-Digital Dojo. Elevate your cognitive performance through high-intensity mental intervals.',
    visual: 'neural',
  },
  {
    id: 'speed-math',
    title: 'Speed Math',
    description: 'Neural Overclocking. Train your brain\'s processing speed and arithmetic reflexes under time pressure.',
    visual: 'math',
  },
  {
    id: 'paradox-flow',
    title: 'Paradox Flow',
    description: 'Impulse Control. Rewire your reaction to conflict. Swipe based on meaning, not appearance.',
    visual: 'paradox',
  },
  {
    id: 'suit-deception',
    title: 'Suit Deception',
    description: 'Pattern Recognition. Spot subtle mismatches in a stream of visual data. Focus is your currency.',
    visual: 'suit',
  },
  {
    id: 'chimp-memory',
    title: 'Chimp Memory',
    description: 'Working Memory. Expand your mental RAM. Recall complex sequences instantly.',
    visual: 'chimp',
  },
];

// Spring transition config for native feel
const springTransition = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 20,
};

// Color palette
const COLORS = {
  arcticAzure: 'hsl(190, 90%, 50%)',
  nebulaViolet: 'hsl(270, 50%, 55%)',
  silver: '#A0A0A0',
  midnight: '#050505',
};

// Math operators animation component
const MathVisual = () => {
  const operators = [
    { icon: Plus, delay: 0 },
    { icon: Minus, delay: 0.15 },
    { icon: X, delay: 0.3 },
    { icon: Divide, delay: 0.45 },
  ];

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {operators.map((op, i) => {
        const Icon = op.icon;
        const angle = (i / operators.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 36;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ x, y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.4, 0.9, 0.4],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 3,
              delay: op.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Icon 
              className="w-7 h-7" 
              style={{ color: COLORS.arcticAzure, filter: `drop-shadow(0 0 8px ${COLORS.arcticAzure})` }}
              strokeWidth={2}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

// Paradox swipe cards animation
const ParadoxVisual = () => {
  return (
    <div className="relative w-36 h-20 flex items-center justify-center gap-3">
      <motion.div
        className="w-14 h-18 rounded-xl flex items-center justify-center"
        style={{ 
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: `0 0 20px ${COLORS.nebulaViolet}30`,
        }}
        animate={{ 
          x: [-15, -30, -15],
          rotate: [-3, -10, -3],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ArrowLeftRight className="w-5 h-5" style={{ color: COLORS.nebulaViolet }} />
      </motion.div>
      
      <motion.div
        className="w-14 h-18 rounded-xl flex items-center justify-center"
        style={{ 
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: `0 0 20px ${COLORS.arcticAzure}30`,
        }}
        animate={{ 
          x: [15, 30, 15],
          rotate: [3, 10, 3],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      >
        <ArrowLeftRight className="w-5 h-5" style={{ color: COLORS.arcticAzure }} />
      </motion.div>
    </div>
  );
};

// Suit pulsing animation
const SuitVisual = () => {
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <motion.div
        className="absolute"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Spade 
          className="w-14 h-14" 
          style={{ 
            color: 'white',
            filter: `drop-shadow(0 0 15px ${COLORS.arcticAzure})`,
          }} 
        />
      </motion.div>
      
      <motion.div
        className="absolute"
        style={{ top: '50%', left: '65%' }}
        animate={{
          scale: [1.1, 0.9, 1.1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <Heart 
          className="w-8 h-8" 
          style={{ 
            color: COLORS.nebulaViolet,
            filter: `drop-shadow(0 0 10px ${COLORS.nebulaViolet})`,
          }} 
        />
      </motion.div>
    </div>
  );
};

// Grid memory visual
const ChimpVisual = () => {
  const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const activePattern = [0, 4, 8, 2, 6]; // Diagonal + cross pattern
  
  return (
    <div className="grid grid-cols-3 gap-1.5 w-28 h-28">
      {cells.map((_, i) => {
        const isActive = activePattern.includes(i);
        const displayNum = activePattern.indexOf(i) + 1;
        
        return (
          <motion.div
            key={i}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{
              background: isActive 
                ? `linear-gradient(135deg, ${COLORS.nebulaViolet}40, ${COLORS.arcticAzure}20)`
                : 'rgba(255,255,255,0.03)',
              border: isActive 
                ? `1px solid ${COLORS.nebulaViolet}60` 
                : '1px solid rgba(255,255,255,0.05)',
              boxShadow: isActive ? `0 0 12px ${COLORS.nebulaViolet}30` : 'none',
            }}
            animate={isActive ? {
              opacity: [0.5, 1, 0.5],
              scale: [0.95, 1.02, 0.95],
            } : {}}
            transition={{
              duration: 2.5,
              delay: i * 0.08,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {isActive && (
              <motion.span
                style={{ color: COLORS.arcticAzure }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2.5, delay: i * 0.08, repeat: Infinity }}
              >
                {displayNum}
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

// Neural brain visual (simplified version for first slide)
const NeuralVisual = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springTransition}
      className="flex items-center justify-center"
    >
      <Brain 
        className="w-20 h-20" 
        style={{ 
          color: COLORS.arcticAzure,
          filter: `drop-shadow(0 0 25px ${COLORS.arcticAzure}) drop-shadow(0 0 50px ${COLORS.nebulaViolet}50)`,
        }} 
      />
    </motion.div>
  );
};

// Slide visual renderer
const SlideVisual = ({ type }: { type: Slide['visual'] }) => {
  switch (type) {
    case 'neural':
      return <NeuralVisual />;
    case 'math':
      return <MathVisual />;
    case 'paradox':
      return <ParadoxVisual />;
    case 'suit':
      return <SuitVisual />;
    case 'chimp':
      return <ChimpVisual />;
    default:
      return null;
  }
};

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLastSlide = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      localStorage.setItem('axon-hasSeenOnboarding', 'true');
      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  }, [isLastSlide, onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem('axon-hasSeenOnboarding', 'true');
    onComplete();
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: COLORS.midnight }}
    >
      {/* Persistent NeuralCore background - stays while content changes */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <NeuralCore size={380} />
        </motion.div>
      </div>

      {/* Gradient overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 60%, transparent 0%, ${COLORS.midnight} 70%)`,
        }}
      />

      {/* Skip button - top right */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...springTransition }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSkip}
        className="absolute top-6 right-6 px-4 py-2 text-sm font-medium transition-colors z-20 rounded-full"
        style={{ 
          color: COLORS.silver,
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        Skip
      </motion.button>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 60, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.98 }}
            transition={springTransition}
            className="flex flex-col items-center text-center max-w-sm"
          >
            {/* Visual with glassmorphism container */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...springTransition, delay: 0 }}
              className="mb-8 h-32 w-32 flex items-center justify-center rounded-3xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: `0 0 40px ${COLORS.nebulaViolet}15, inset 0 0 30px rgba(255,255,255,0.02)`,
              }}
            >
              <SlideVisual type={slide.visual} />
            </motion.div>

            {/* Title - staggered */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
              className="text-3xl font-black tracking-tight mb-4"
              style={{ 
                color: 'white',
                textShadow: `0 0 30px ${COLORS.arcticAzure}40`,
              }}
            >
              {slide.title}
            </motion.h1>

            {/* Description - glassmorphism card, staggered */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.2 }}
              className="px-5 py-4 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <p 
                className="text-base leading-relaxed"
                style={{ color: COLORS.silver }}
              >
                {slide.description}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="pb-10 px-6 relative z-10">
        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === currentSlide ? 24 : 8,
                backgroundColor: i === currentSlide 
                  ? COLORS.arcticAzure
                  : i < currentSlide 
                    ? `${COLORS.arcticAzure}60`
                    : 'rgba(255,255,255,0.15)',
                boxShadow: i === currentSlide ? `0 0 12px ${COLORS.arcticAzure}` : 'none',
              }}
              animate={i === currentSlide ? { 
                opacity: [0.8, 1, 0.8],
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          ))}
        </div>

        {/* Next/Start button - staggered */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
          style={{
            background: `linear-gradient(135deg, ${COLORS.arcticAzure}, ${COLORS.nebulaViolet})`,
            color: 'white',
            boxShadow: `0 4px 30px ${COLORS.arcticAzure}40, 0 0 60px ${COLORS.nebulaViolet}20`,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {isLastSlide ? (
            'Start Training'
          ) : (
            <>
              Next
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        {/* Slide counter */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-4 text-xs font-mono"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {currentSlide + 1} / {SLIDES.length}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
