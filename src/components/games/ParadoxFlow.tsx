import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ParadoxFlowProps {
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  followChance?: number;
  streak?: number;
  mode?: 'classic' | 'endless';
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Question {
  arrowDirection: Direction;
  instruction: 'FOLLOW' | 'AVOID';
  validDirections: Direction[];
  tier: number;
  distractorColor?: string;
}

const DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const ARROW_ICONS: Record<Direction, React.ReactNode> = {
  UP: <ArrowUp className="w-24 h-24" strokeWidth={2} />,
  DOWN: <ArrowDown className="w-24 h-24" strokeWidth={2} />,
  LEFT: <ArrowLeft className="w-24 h-24" strokeWidth={2} />,
  RIGHT: <ArrowRight className="w-24 h-24" strokeWidth={2} />,
};

// Distractor colors that conflict with direction semantics
const DISTRACTOR_COLORS: Record<Direction, string> = {
  UP: 'hsl(0, 85%, 55%)', // Red for UP (confusion: stop vs go up)
  DOWN: 'hsl(120, 60%, 45%)', // Green for DOWN (confusion: go vs go down)
  LEFT: 'hsl(45, 90%, 55%)', // Yellow for LEFT (caution vs direction)
  RIGHT: 'hsl(0, 85%, 55%)', // Red for RIGHT
};

// Exit animation destinations
const EXIT_TRANSFORMS: Record<Direction, { x: number; y: number; rotate: number }> = {
  UP: { x: 0, y: -400, rotate: -15 },
  DOWN: { x: 0, y: 400, rotate: 15 },
  LEFT: { x: -400, y: 0, rotate: -25 },
  RIGHT: { x: 400, y: 0, rotate: 25 },
};

// Calculate difficulty tier for ParadoxFlow
const getParadoxTier = (streak: number, mode: 'classic' | 'endless'): number => {
  const multiplier = mode === 'endless' ? 1.5 : 1;
  const effectiveStreak = Math.floor(streak * multiplier);
  
  if (effectiveStreak < 5) return 1;
  if (effectiveStreak < 12) return 2;
  if (effectiveStreak < 20) return 3;
  return 4;
};

const generateQuestion = (followChance: number, streak: number, mode: 'classic' | 'endless'): Question => {
  const tier = getParadoxTier(streak, mode);
  const arrowDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  
  // Tier 3+: Bias towards AVOID (harder) - 60% chance
  const adjustedFollowChance = tier >= 3 ? Math.min(followChance, 0.4) : followChance;
  const instruction: 'FOLLOW' | 'AVOID' = Math.random() < adjustedFollowChance ? 'FOLLOW' : 'AVOID';
  
  const validDirections = instruction === 'FOLLOW' 
    ? [arrowDirection]
    : DIRECTIONS.filter(d => d !== arrowDirection);
  
  // Tier 2+: Add distractor colors
  const distractorColor = tier >= 2 ? DISTRACTOR_COLORS[arrowDirection] : undefined;
  
  return {
    arrowDirection,
    instruction,
    validDirections,
    tier,
    distractorColor,
  };
};

export const ParadoxFlow = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  followChance = 0.5,
  streak = 0,
  mode = 'classic',
}: ParadoxFlowProps) => {
  const [question, setQuestion] = useState<Question>(() => generateQuestion(followChance, streak, mode));
  const [questionKey, setQuestionKey] = useState(0);
  const [exitDirection, setExitDirection] = useState<Direction | null>(null);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const questionStartTime = useRef(Date.now());
  const isProcessing = useRef(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateZ = useTransform(x, [-200, 200], [-20, 20]);
  const scale = useTransform(
    [x, y],
    ([latestX, latestY]: number[]) => {
      const distance = Math.sqrt(latestX ** 2 + latestY ** 2);
      return Math.min(1 + distance * 0.001, 1.1);
    }
  );

  // Reaction window decreases with tier (rapid mode)
  const getMaxReactionTime = () => {
    switch (question.tier) {
      case 1: return 3000;
      case 2: return 2500;
      case 3: return 2000;
      case 4: return 1500;
      default: return 3000;
    }
  };

  const handleSwipe = useCallback((swipeDirection: Direction) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const responseTime = Date.now() - questionStartTime.current;
    const maxTime = getMaxReactionTime();
    const speedBonus = Math.max(0, Math.floor((maxTime - responseTime) / 100));
    const isCorrect = question.validDirections.includes(swipeDirection);

    // Set exit direction for fly-off animation
    setExitDirection(swipeDirection);
    setLastFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      playSound('correct');
      triggerHaptic('medium');
      
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { x: 0.5, y: 0.5 },
        colors: question.instruction === 'FOLLOW' 
          ? ['#00FF88', '#00D4FF', '#7CFC00']
          : ['#FF6A00', '#FFD60A', '#FF3366'],
        scalar: 0.8,
      });
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
    }

    onAnswer(isCorrect, speedBonus, question.tier);

    // Wait for exit animation, then reset
    setTimeout(() => {
      setExitDirection(null);
      setQuestion(generateQuestion(followChance, streak, mode));
      setQuestionKey(k => k + 1);
      questionStartTime.current = Date.now();
      setLastFeedback(null);
      isProcessing.current = false;
      x.set(0);
      y.set(0);
    }, 200);
  }, [question.validDirections, question.instruction, question.tier, followChance, streak, mode, onAnswer, playSound, triggerHaptic, onScreenShake, x, y]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 60;
    const velocityThreshold = 300;
    const { offset, velocity } = info;
    
    let direction: Direction | null = null;
    
    // Determine swipe direction based on offset and velocity
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    
    if (absX > absY) {
      if (offset.x > threshold || velocity.x > velocityThreshold) direction = 'RIGHT';
      else if (offset.x < -threshold || velocity.x < -velocityThreshold) direction = 'LEFT';
    } else {
      if (offset.y > threshold || velocity.y > velocityThreshold) direction = 'DOWN';
      else if (offset.y < -threshold || velocity.y < -velocityThreshold) direction = 'UP';
    }
    
    if (direction) {
      handleSwipe(direction);
    } else {
      // Snap back if not enough movement
      x.set(0);
      y.set(0);
    }
  }, [handleSwipe, x, y]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
      };
      
      if (keyMap[e.key]) {
        handleSwipe(keyMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipe]);

  const isFollow = question.instruction === 'FOLLOW';
  const instructionColor = isFollow ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
  const cardGradient = isFollow 
    ? 'linear-gradient(135deg, hsl(var(--success) / 0.15), hsl(var(--success) / 0.05))'
    : 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))';

  const exitTransform = exitDirection ? EXIT_TRANSFORMS[exitDirection] : null;

  // Visual interference based on tier
  const shouldShake = question.tier >= 3;
  const shouldDrift = question.tier >= 4;
  const arrowColor = question.distractorColor || (isFollow ? 'hsl(var(--success))' : 'hsl(var(--primary))');

  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-4 py-6">
      {/* Tier Indicator */}
      {question.tier >= 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          className="absolute top-2 right-2 text-[9px] font-mono uppercase tracking-wider text-muted-foreground"
        >
          {question.tier === 4 ? '⚡ RAPID' : `T${question.tier}`}
        </motion.div>
      )}

      {/* Instruction Banner */}
      <motion.div
        key={`instruction-${questionKey}`}
        initial={{ opacity: 0, y: -15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="text-center mb-4"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.03, 1],
            textShadow: [
              `0 0 15px ${instructionColor}`,
              `0 0 30px ${instructionColor}`,
              `0 0 15px ${instructionColor}`,
            ],
          }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="text-3xl font-black uppercase tracking-[0.2em]"
          style={{ color: instructionColor }}
        >
          {question.instruction}
        </motion.div>
        <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">
          {isFollow ? 'Swipe the arrow direction' : 'Swipe any other direction'}
        </div>
      </motion.div>

      {/* Swipeable Card Container */}
      <div className="relative w-48 h-48 mb-4">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={questionKey}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            style={{ 
              x, 
              y, 
              rotateZ,
              scale,
              background: cardGradient,
            }}
            initial={{ opacity: 0, scale: 0.6, rotate: -5 }}
            animate={{ 
              opacity: exitDirection ? 0 : 1, 
              scale: exitDirection ? 0.8 : 1,
              rotate: exitDirection ? exitTransform?.rotate || 0 : 0,
              x: exitDirection ? exitTransform?.x || 0 : (shouldDrift ? [0, 8, -8, 0] : 0),
              y: exitDirection ? exitTransform?.y || 0 : (shouldDrift ? [0, 5, -5, 0] : 0),
              boxShadow: lastFeedback === 'correct' 
                ? `0 0 50px ${isFollow ? 'hsl(var(--success))' : 'hsl(var(--primary))'}`
                : lastFeedback === 'wrong'
                ? '0 0 50px hsl(var(--destructive))'
                : '0 0 20px hsl(var(--border) / 0.3)',
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.5,
              x: exitTransform?.x || 0,
              y: exitTransform?.y || 0,
              rotate: exitTransform?.rotate || 0,
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 30,
              opacity: { duration: 0.15 },
              x: shouldDrift ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : undefined,
              y: shouldDrift ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : undefined,
            }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-3xl border border-border/50 backdrop-blur-xl flex items-center justify-center select-none"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.06, 1],
                rotate: shouldShake ? [0, 2, -2, 0] : 0,
              }}
              transition={{ 
                duration: 0.7, 
                repeat: Infinity,
                rotate: shouldShake ? { duration: 0.15, repeat: Infinity } : undefined,
              }}
              style={{ color: arrowColor }}
            >
              {ARROW_ICONS[question.arrowDirection]}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.3 }}
        className="text-[9px] text-muted-foreground text-center uppercase tracking-[0.2em]"
      >
        Swipe or Arrow Keys
      </motion.p>
    </div>
  );
};