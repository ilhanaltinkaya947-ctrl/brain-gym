import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Plus, Minus, X, Divide, Spade, Heart, Grid3X3, ArrowLeftRight, Brain } from 'lucide-react';
import { NeuralCore } from '../NeuralCore';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface Slide {
  id: string;
  title: string;
  description: string;
  visual: 'neural' | 'math' | 'paradox' | 'suit' | 'chimp';
  color: string;
}

const SLIDES: Slide[] = [
  {
    id: 'mission',
    title: 'Unlock Your Potential',
    description: 'AXON is not just a game. It is a bio-digital dojo designed to elevate your cognitive performance through high-intensity mental intervals.',
    visual: 'neural',
    color: 'hsl(var(--neon-cyan))',
  },
  {
    id: 'speed-math',
    title: 'Speed Math',
    description: 'Neural Overclocking. Train your brain\'s processing speed and arithmetic reflexes under time pressure.',
    visual: 'math',
    color: 'hsl(45 90% 55%)',
  },
  {
    id: 'paradox-flow',
    title: 'Paradox Flow',
    description: 'Impulse Control. Rewire your reaction to conflict. Swipe based on meaning, not appearance.',
    visual: 'paradox',
    color: 'hsl(25 90% 55%)',
  },
  {
    id: 'suit-deception',
    title: 'Suit Deception',
    description: 'Pattern Recognition. Spot subtle mismatches in a stream of visual data. Focus is your currency.',
    visual: 'suit',
    color: 'hsl(0 75% 55%)',
  },
  {
    id: 'chimp-memory',
    title: 'Chimp Memory',
    description: 'Working Memory. Expand your mental RAM. Recall complex sequences instantly.',
    visual: 'chimp',
    color: 'hsl(280 70% 55%)',
  },
];

// Math operators animation component
const MathVisual = () => {
  const operators = [
    { icon: Plus, delay: 0 },
    { icon: Minus, delay: 0.2 },
    { icon: X, delay: 0.4 },
    { icon: Divide, delay: 0.6 },
  ];

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {operators.map((op, i) => {
        const Icon = op.icon;
        const angle = (i / operators.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 40;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ x, y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.5, 1, 0.5],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              delay: op.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Icon 
              className="w-8 h-8" 
              style={{ color: 'hsl(45 90% 55%)' }}
              strokeWidth={2.5}
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
    <div className="relative w-40 h-24 flex items-center justify-center gap-4">
      <motion.div
        className="w-16 h-20 rounded-xl border-2 flex items-center justify-center"
        style={{ 
          borderColor: 'hsl(25 90% 55%)',
          background: 'linear-gradient(135deg, hsla(25, 90%, 55%, 0.2), transparent)',
        }}
        animate={{ 
          x: [-20, -40, -20],
          rotate: [-5, -15, -5],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ArrowLeftRight className="w-6 h-6 text-foreground/80" />
      </motion.div>
      
      <motion.div
        className="w-16 h-20 rounded-xl border-2 flex items-center justify-center"
        style={{ 
          borderColor: 'hsl(25 90% 55%)',
          background: 'linear-gradient(135deg, hsla(25, 90%, 55%, 0.2), transparent)',
        }}
        animate={{ 
          x: [20, 40, 20],
          rotate: [5, 15, 5],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <ArrowLeftRight className="w-6 h-6 text-foreground/80" />
      </motion.div>
    </div>
  );
};

// Suit pulsing animation
const SuitVisual = () => {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Spade className="w-16 h-16 text-foreground absolute" style={{ filter: 'drop-shadow(0 0 20px hsl(0 75% 55%))' }} />
      </motion.div>
      
      <motion.div
        className="absolute"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <Heart className="w-12 h-12" style={{ color: 'hsl(0 75% 55%)', filter: 'drop-shadow(0 0 15px hsl(0 75% 55%))' }} />
      </motion.div>
    </div>
  );
};

// Grid memory visual
const ChimpVisual = () => {
  const cells = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const showNumbers = [0, 2, 4, 6, 8]; // Diagonal pattern
  
  return (
    <div className="grid grid-cols-3 gap-2 w-32 h-32">
      {cells.map((num, i) => (
        <motion.div
          key={i}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{
            background: showNumbers.includes(i) 
              ? 'linear-gradient(135deg, hsla(280, 70%, 55%, 0.4), hsla(280, 70%, 55%, 0.1))'
              : 'hsla(0, 0%, 100%, 0.05)',
            border: showNumbers.includes(i) ? '1px solid hsla(280, 70%, 55%, 0.5)' : '1px solid hsla(0, 0%, 100%, 0.1)',
          }}
          animate={showNumbers.includes(i) ? {
            opacity: [0.4, 1, 0.4],
            scale: [0.95, 1.05, 0.95],
          } : {}}
          transition={{
            duration: 2,
            delay: i * 0.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {showNumbers.includes(i) && (
            <motion.span
              style={{ color: 'hsl(280 70% 70%)' }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
            >
              {showNumbers.indexOf(i) + 1}
            </motion.span>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Slide visual renderer
const SlideVisual = ({ type }: { type: Slide['visual'] }) => {
  switch (type) {
    case 'neural':
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center"
        >
          <Brain className="w-24 h-24" style={{ color: 'hsl(var(--neon-cyan))', filter: 'drop-shadow(0 0 30px hsl(var(--neon-cyan)))' }} />
        </motion.div>
      );
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
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Background NeuralCore - dimmed */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <NeuralCore size={400} />
      </div>

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleSkip}
        className="absolute top-6 right-6 text-sm text-muted-foreground hover:text-foreground transition-colors z-20 font-medium"
      >
        Skip
      </motion.button>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            {/* Visual */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-10 h-32 flex items-center justify-center"
            >
              <SlideVisual type={slide.visual} />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black tracking-tight mb-4"
              style={{ color: slide.color }}
            >
              {slide.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base text-muted-foreground leading-relaxed"
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="pb-12 px-8 relative z-10">
        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i === currentSlide 
                  ? slide.color
                  : i < currentSlide 
                    ? `${slide.color}80`
                    : 'hsl(0 0% 25%)',
              }}
              animate={i === currentSlide ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>

        {/* Next/Start button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
          style={{
            background: `linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--neon-cyan) / 0.7))`,
            color: 'black',
            boxShadow: '0 0 30px hsla(var(--neon-cyan), 0.4)',
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
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
