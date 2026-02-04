import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface DirectionLogicProps {
  onAnswer: (correct: boolean, speedBonus: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Question {
  arrowDirection: Direction;
  textDirection: Direction;
  correctSwipe: Direction;
}

const DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const ARROW_ICONS: Record<Direction, React.ReactNode> = {
  UP: <ArrowUp className="w-24 h-24" />,
  DOWN: <ArrowDown className="w-24 h-24" />,
  LEFT: <ArrowLeft className="w-24 h-24" />,
  RIGHT: <ArrowRight className="w-24 h-24" />,
};

const generateQuestion = (): Question => {
  const arrowDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  let textDirection: Direction;
  
  // 70% chance of contradiction for difficulty
  if (Math.random() < 0.7) {
    const others = DIRECTIONS.filter(d => d !== arrowDirection);
    textDirection = others[Math.floor(Math.random() * others.length)];
  } else {
    textDirection = arrowDirection;
  }
  
  return {
    arrowDirection,
    textDirection,
    correctSwipe: textDirection, // Rule: Swipe according to TEXT
  };
};

export const DirectionLogic = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
}: DirectionLogicProps) => {
  const [question, setQuestion] = useState<Question>(() => generateQuestion());
  const [questionKey, setQuestionKey] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);
  const questionStartTime = useRef(Date.now());
  const isProcessing = useRef(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateZ = useTransform(x, [-200, 200], [-15, 15]);

  const handleSwipe = useCallback((swipeDirection: Direction) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const responseTime = Date.now() - questionStartTime.current;
    const speedBonus = Math.max(0, Math.floor((3000 - responseTime) / 100));
    const isCorrect = swipeDirection === question.correctSwipe;

    if (isCorrect) {
      playSound('correct');
      triggerHaptic('medium');
      onScreenShake();
      setLastFeedback('correct');
      
      // Particle explosion
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#FF8C00', '#FFA500', '#FFD700'],
        scalar: 0.8,
      });
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
      setLastFeedback('wrong');
    }

    onAnswer(isCorrect, speedBonus);

    setTimeout(() => {
      setQuestion(generateQuestion());
      setQuestionKey(k => k + 1);
      questionStartTime.current = Date.now();
      setLastFeedback(null);
      isProcessing.current = false;
    }, 150);
  }, [question.correctSwipe, onAnswer, playSound, triggerHaptic, onScreenShake]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 50;
    const { offset, velocity } = info;
    
    let direction: Direction | null = null;
    
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      if (offset.x > threshold || velocity.x > 200) direction = 'RIGHT';
      else if (offset.x < -threshold || velocity.x < -200) direction = 'LEFT';
    } else {
      if (offset.y > threshold || velocity.y > 200) direction = 'DOWN';
      else if (offset.y < -threshold || velocity.y < -200) direction = 'UP';
    }
    
    if (direction) {
      handleSwipe(direction);
    }
    
    // Reset position
    x.set(0);
    y.set(0);
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

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8">
      {/* Instruction */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-game-direction/70 mb-2">
          Swipe According To
        </div>
        <div className="text-2xl font-black text-game-direction uppercase tracking-wider">
          The Text
        </div>
      </motion.div>

      {/* Card Container */}
      <div className="relative w-64 h-80">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={questionKey}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            style={{ x, y, rotateZ }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: lastFeedback === 'correct' 
                ? '0 0 60px hsl(var(--game-direction) / 0.8)' 
                : lastFeedback === 'wrong'
                ? '0 0 60px hsl(var(--destructive) / 0.8)'
                : '0 0 30px hsl(var(--game-direction) / 0.3)',
            }}
            exit={{ opacity: 0, scale: 0.5, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-3xl border-2 flex flex-col items-center justify-center bg-gradient-to-br from-game-direction/15 to-card/90 border-game-direction/50"
          >
            {/* Arrow */}
            <motion.div
              className="text-game-direction mb-6"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {ARROW_ICONS[question.arrowDirection]}
            </motion.div>

            {/* Text Direction (the answer) */}
            <div className="text-4xl font-black tracking-widest text-foreground">
              {question.textDirection}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe Hints */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          Swipe or use Arrow Keys
        </div>
      </motion.div>
    </div>
  );
};
