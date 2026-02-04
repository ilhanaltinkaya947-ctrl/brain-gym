import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ParadoxFlowProps {
  onAnswer: (correct: boolean, speedBonus: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  followChance?: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Question {
  arrowDirection: Direction;
  instruction: 'FOLLOW' | 'AVOID';
  validDirections: Direction[];
}

const DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const ARROW_ICONS: Record<Direction, React.ReactNode> = {
  UP: <ArrowUp className="w-28 h-28" strokeWidth={2.5} />,
  DOWN: <ArrowDown className="w-28 h-28" strokeWidth={2.5} />,
  LEFT: <ArrowLeft className="w-28 h-28" strokeWidth={2.5} />,
  RIGHT: <ArrowRight className="w-28 h-28" strokeWidth={2.5} />,
};

const generateQuestion = (followChance: number): Question => {
  const arrowDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  const instruction: 'FOLLOW' | 'AVOID' = Math.random() < followChance ? 'FOLLOW' : 'AVOID';
  
  // FOLLOW: only the arrow direction is valid
  // AVOID: any direction EXCEPT the arrow direction is valid
  const validDirections = instruction === 'FOLLOW' 
    ? [arrowDirection]
    : DIRECTIONS.filter(d => d !== arrowDirection);
  
  return {
    arrowDirection,
    instruction,
    validDirections,
  };
};

export const ParadoxFlow = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  followChance = 0.5,
}: ParadoxFlowProps) => {
  const [question, setQuestion] = useState<Question>(() => generateQuestion(followChance));
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
    const speedBonus = Math.max(0, Math.floor((2500 - responseTime) / 100));
    const isCorrect = question.validDirections.includes(swipeDirection);

    if (isCorrect) {
      playSound('correct');
      triggerHaptic('medium');
      setLastFeedback('correct');
      
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { x: 0.5, y: 0.5 },
        colors: question.instruction === 'FOLLOW' 
          ? ['#00FF00', '#32CD32', '#7CFC00']
          : ['#FF6A00', '#FFA500', '#FFD700'],
        scalar: 0.7,
      });
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
      setLastFeedback('wrong');
    }

    onAnswer(isCorrect, speedBonus);

    setTimeout(() => {
      setQuestion(generateQuestion(followChance));
      setQuestionKey(k => k + 1);
      questionStartTime.current = Date.now();
      setLastFeedback(null);
      isProcessing.current = false;
    }, 150);
  }, [question.validDirections, question.instruction, followChance, onAnswer, playSound, triggerHaptic, onScreenShake]);

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

  const isFollow = question.instruction === 'FOLLOW';
  const instructionColor = isFollow ? 'hsl(140, 70%, 50%)' : 'hsl(0, 70%, 55%)';
  const arrowColor = isFollow ? 'hsl(140, 70%, 50%)' : 'hsl(25, 90%, 55%)';

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8">
      {/* Instruction Banner */}
      <motion.div
        key={`instruction-${questionKey}`}
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="text-center mb-6"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            textShadow: [
              `0 0 20px ${instructionColor}`,
              `0 0 40px ${instructionColor}`,
              `0 0 20px ${instructionColor}`,
            ],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-4xl font-black uppercase tracking-widest"
          style={{ color: instructionColor }}
        >
          {question.instruction}
        </motion.div>
        <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
          {isFollow ? 'Swipe the arrow direction' : 'Swipe any other direction'}
        </div>
      </motion.div>

      {/* Arrow Card */}
      <div className="relative w-56 h-56 mb-8">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={questionKey}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            style={{ 
              x, 
              y, 
              rotateZ,
              background: `linear-gradient(135deg, ${arrowColor}15, ${arrowColor}05)`,
              borderColor: `${arrowColor}60`,
            }}
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              rotate: 0,
              boxShadow: lastFeedback === 'correct' 
                ? `0 0 60px ${isFollow ? 'hsl(140, 70%, 50%)' : 'hsl(25, 90%, 55%)'}`
                : lastFeedback === 'wrong'
                ? '0 0 60px hsl(0, 70%, 50%)'
                : `0 0 30px ${arrowColor}40`,
            }}
            exit={{ opacity: 0, scale: 0.5, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-3xl border-2 flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.08, 1],
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ color: arrowColor }}
            >
              {ARROW_ICONS[question.arrowDirection]}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Direction Hints */}
      <div className="grid grid-cols-3 gap-2 w-48">
        <div />
        <div 
          className="w-12 h-12 rounded-lg border border-border/30 flex items-center justify-center transition-opacity"
          style={{ opacity: question.validDirections.includes('UP') ? 1 : 0.2 }}
        >
          <ArrowUp className="w-6 h-6 text-muted-foreground" />
        </div>
        <div />
        <div 
          className="w-12 h-12 rounded-lg border border-border/30 flex items-center justify-center transition-opacity"
          style={{ opacity: question.validDirections.includes('LEFT') ? 1 : 0.2 }}
        >
          <ArrowLeft className="w-6 h-6 text-muted-foreground" />
        </div>
        <div 
          className="w-12 h-12 rounded-lg border border-border/30 flex items-center justify-center transition-opacity"
          style={{ opacity: question.validDirections.includes('DOWN') ? 1 : 0.2 }}
        >
          <ArrowDown className="w-6 h-6 text-muted-foreground" />
        </div>
        <div 
          className="w-12 h-12 rounded-lg border border-border/30 flex items-center justify-center transition-opacity"
          style={{ opacity: question.validDirections.includes('RIGHT') ? 1 : 0.2 }}
        >
          <ArrowRight className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-xs text-muted-foreground text-center uppercase tracking-wider"
      >
        Swipe or use Arrow Keys
      </motion.p>
    </div>
  );
};
