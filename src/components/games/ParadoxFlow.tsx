import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo, animate } from 'framer-motion';
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
  tier?: number;
  overclockFactor?: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Question {
  arrowDirection: Direction;
  instruction: 'FOLLOW' | 'AVOID';
  validDirections: Direction[];
  tier: number;
  distractorColor?: string;
  conflictText?: string;        // Direction text that conflicts with arrow (T2, T4)
  isSequenceMode?: boolean;     // T3 flag
  secondArrow?: Direction;      // Second arrow direction for T3
  isRecallMode?: boolean;       // T5 flag
  displayInstruction?: string;  // What to show ("RECALL" for T5)
}

const DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const DIRECTION_LABELS: Record<Direction, string> = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

const ARROW_ICONS: Record<Direction, React.ReactNode> = {
  UP: <ArrowUp className="w-24 h-24" strokeWidth={2} />,
  DOWN: <ArrowDown className="w-24 h-24" strokeWidth={2} />,
  LEFT: <ArrowLeft className="w-24 h-24" strokeWidth={2} />,
  RIGHT: <ArrowRight className="w-24 h-24" strokeWidth={2} />,
};

// Distractor colors that conflict with direction semantics
const DISTRACTOR_COLORS: Record<Direction, string> = {
  UP: 'hsl(0, 85%, 55%)',
  DOWN: 'hsl(120, 60%, 45%)',
  LEFT: 'hsl(45, 90%, 55%)',
  RIGHT: 'hsl(0, 85%, 55%)',
};

// Exit animation destinations
const EXIT_TRANSFORMS: Record<Direction, { x: number; y: number; rotate: number }> = {
  UP: { x: 0, y: -400, rotate: -15 },
  DOWN: { x: 0, y: 400, rotate: 15 },
  LEFT: { x: -400, y: 0, rotate: -25 },
  RIGHT: { x: 400, y: 0, rotate: 25 },
};

// Get a conflicting direction (different from the given one)
const getConflictingDirection = (dir: Direction): Direction => {
  const others = DIRECTIONS.filter(d => d !== dir);
  return others[Math.floor(Math.random() * others.length)];
};

// Calculate difficulty tier for ParadoxFlow
const getParadoxTier = (streak: number, mode: 'classic' | 'endless'): number => {
  const multiplier = mode === 'endless' ? 1.5 : 1;
  const effectiveStreak = Math.floor(streak * multiplier);

  if (effectiveStreak < 5) return 1;
  if (effectiveStreak < 12) return 2;
  if (effectiveStreak < 20) return 3;
  if (effectiveStreak < 30) return 4;
  return 5;
};

const generateQuestion = (
  followChance: number,
  streak: number,
  mode: 'classic' | 'endless',
  overrideTier?: number,
  previousInstruction?: 'FOLLOW' | 'AVOID',
  isFirstInSession?: boolean,
): Question => {
  const tier = overrideTier ?? getParadoxTier(streak, mode);
  const arrowDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

  // --- T1: Single arrow, FOLLOW/AVOID (70% follow) ---
  if (tier === 1) {
    const instruction: 'FOLLOW' | 'AVOID' = Math.random() < 0.7 ? 'FOLLOW' : 'AVOID';
    const validDirections = instruction === 'FOLLOW'
      ? [arrowDirection]
      : DIRECTIONS.filter(d => d !== arrowDirection);
    return { arrowDirection, instruction, validDirections, tier };
  }

  // --- T2: Text-arrow conflict (Stroop-like), 50/50 follow/avoid ---
  if (tier === 2) {
    const instruction: 'FOLLOW' | 'AVOID' = Math.random() < 0.5 ? 'FOLLOW' : 'AVOID';
    // The conflicting text word (always different from arrow direction)
    const conflictDir = getConflictingDirection(arrowDirection);
    const conflictText = DIRECTION_LABELS[conflictDir];
    // Instruction is based on the TEXT direction, not the arrow
    const validDirections = instruction === 'FOLLOW'
      ? [conflictDir]
      : DIRECTIONS.filter(d => d !== conflictDir);
    return {
      arrowDirection,
      instruction,
      validDirections,
      tier,
      conflictText,
      distractorColor: DISTRACTOR_COLORS[arrowDirection],
    };
  }

  // --- T3: Sequence mode - two arrows, react to second only, 40% follow ---
  if (tier === 3) {
    const instruction: 'FOLLOW' | 'AVOID' = Math.random() < 0.4 ? 'FOLLOW' : 'AVOID';
    // Second arrow is always different from first to test working memory
    const secondArrow = getConflictingDirection(arrowDirection);
    const validDirections = instruction === 'FOLLOW'
      ? [secondArrow]
      : DIRECTIONS.filter(d => d !== secondArrow);
    return {
      arrowDirection,
      instruction,
      validDirections,
      tier,
      isSequenceMode: true,
      secondArrow,
    };
  }

  // --- T4: Conflicting text ON the arrow card, follow/avoid the ARROW, 35% follow ---
  if (tier === 4) {
    const instruction: 'FOLLOW' | 'AVOID' = Math.random() < 0.35 ? 'FOLLOW' : 'AVOID';
    const conflictText = DIRECTION_LABELS[getConflictingDirection(arrowDirection)];
    // Instruction applies to the ARROW direction (ignore the text)
    const validDirections = instruction === 'FOLLOW'
      ? [arrowDirection]
      : DIRECTIONS.filter(d => d !== arrowDirection);
    return {
      arrowDirection,
      instruction,
      validDirections,
      tier,
      conflictText,
      distractorColor: DISTRACTOR_COLORS[arrowDirection],
    };
  }

  // --- T5: Recall mode - use PREVIOUS instruction, first question gets normal ---
  {
    const isRecall = !isFirstInSession && previousInstruction !== undefined;
    // For the first question or if no previous, give a normal instruction
    const ownInstruction: 'FOLLOW' | 'AVOID' = Math.random() < 0.4 ? 'FOLLOW' : 'AVOID';
    const activeInstruction = isRecall ? previousInstruction! : ownInstruction;
    const validDirections = activeInstruction === 'FOLLOW'
      ? [arrowDirection]
      : DIRECTIONS.filter(d => d !== arrowDirection);
    return {
      arrowDirection,
      instruction: ownInstruction, // Store the own instruction so it becomes "previous" for next
      validDirections,
      tier,
      isRecallMode: isRecall,
      displayInstruction: isRecall ? 'RECALL' : undefined,
    };
  }
};

export const ParadoxFlow = memo(({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  followChance = 0.5,
  streak = 0,
  mode = 'classic',
  tier: propTier,
  overclockFactor = 1,
}: ParadoxFlowProps) => {
  const effectiveFollowChance = followChance / overclockFactor;
  const previousInstructionRef = useRef<'FOLLOW' | 'AVOID'>('FOLLOW');
  const isFirstInSessionRef = useRef(true);

  const [question, setQuestion] = useState<Question>(() => {
    const q = generateQuestion(effectiveFollowChance, streak, mode, propTier, undefined, true);
    previousInstructionRef.current = q.instruction;
    isFirstInSessionRef.current = false;
    return q;
  });
  const [questionKey, setQuestionKey] = useState(0);
  const [exitDirection, setExitDirection] = useState<Direction | null>(null);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);

  // T3 sequence state: which arrow phase we're in
  const [sequencePhase, setSequencePhase] = useState<'first' | 'second'>('first');
  // T3: block swiping during first arrow display
  const sequenceLockedRef = useRef(false);

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

  // Reaction window INCREASES with tier (harder mechanics need more time)
  const getMaxReactionTime = useCallback(() => {
    switch (question.tier) {
      case 1: return 3000;
      case 2: return 3500;
      case 3: return 5000;
      case 4: return 4000;
      case 5: return 4500;
      default: return 3000;
    }
  }, [question.tier]);

  // T3 sequence timer: show first arrow for 1s, then switch to second
  useEffect(() => {
    if (!question.isSequenceMode) {
      setSequencePhase('first');
      sequenceLockedRef.current = false;
      return;
    }

    // Lock swiping during first arrow phase
    setSequencePhase('first');
    sequenceLockedRef.current = true;

    const timer = setTimeout(() => {
      setSequencePhase('second');
      sequenceLockedRef.current = false;
    }, 1000);

    return () => clearTimeout(timer);
  }, [question.isSequenceMode, questionKey]);

  const handleSwipe = useCallback((swipeDirection: Direction) => {
    if (isProcessing.current) return;
    // T3: block swipes during first arrow phase
    if (sequenceLockedRef.current) return;
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
        particleCount: 15,
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

    // Store current instruction as previous for T5 recall
    const currentInstruction = question.instruction;

    // Wait for exit animation, then reset
    setTimeout(() => {
      setExitDirection(null);
      previousInstructionRef.current = currentInstruction;
      const newQ = generateQuestion(
        effectiveFollowChance,
        streak,
        mode,
        propTier,
        currentInstruction,
        false,
      );
      setQuestion(newQ);
      setQuestionKey(k => k + 1);
      questionStartTime.current = Date.now();
      setLastFeedback(null);
      isProcessing.current = false;
      x.set(0);
      y.set(0);
    }, 150);
  }, [question.validDirections, question.instruction, question.tier, effectiveFollowChance, streak, mode, propTier, onAnswer, playSound, triggerHaptic, onScreenShake, x, y, getMaxReactionTime]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    // T3: block drags during first arrow phase
    if (sequenceLockedRef.current) {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 22 });
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 22 });
      return;
    }

    const threshold = 45;
    const velocityThreshold = 200;
    const { offset, velocity } = info;

    let direction: Direction | null = null;

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
      const exitTransform = EXIT_TRANSFORMS[direction];
      animate(x, exitTransform.x, { type: 'spring', stiffness: 300, damping: 20, velocity: velocity.x });
      animate(y, exitTransform.y, { type: 'spring', stiffness: 300, damping: 20, velocity: velocity.y });
      handleSwipe(direction);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 22, velocity: velocity.x });
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 22, velocity: velocity.y });
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

  // Determine the displayed instruction text
  const displayedInstruction = question.displayInstruction || question.instruction;
  const isRecall = question.isRecallMode;
  const isFollow = question.instruction === 'FOLLOW';
  const displayedIsFollow = displayedInstruction === 'FOLLOW';
  const instructionColor = isRecall
    ? 'hsl(280, 70%, 60%)' // Purple for RECALL
    : displayedIsFollow
    ? 'hsl(var(--success))'
    : 'hsl(var(--destructive))';
  const cardGradient = isFollow
    ? 'linear-gradient(135deg, hsl(var(--success) / 0.15), hsl(var(--success) / 0.05))'
    : 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))';

  const exitTransform = exitDirection ? EXIT_TRANSFORMS[exitDirection] : null;

  // Visual interference based on tier
  const shouldShake = question.tier >= 4;
  const shouldDrift = question.tier >= 5;
  const arrowColor = question.distractorColor || (isFollow ? 'hsl(var(--success))' : 'hsl(var(--primary))');

  // For T3 sequence mode: determine which arrow to show
  const displayedArrowDirection = question.isSequenceMode && sequencePhase === 'second' && question.secondArrow
    ? question.secondArrow
    : question.arrowDirection;

  // Instruction helper text
  const getHelperText = () => {
    if (question.tier === 2) return isFollow ? 'Swipe the TEXT direction' : 'Swipe any direction except TEXT';
    if (question.tier === 3) return 'React to the SECOND arrow only';
    if (question.tier === 4) return isFollow ? 'Follow the ARROW (ignore text)' : 'Avoid the ARROW (ignore text)';
    if (question.tier === 5 && isRecall) return 'Apply the PREVIOUS instruction';
    return isFollow ? 'Swipe the arrow direction' : 'Swipe any other direction';
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-4 py-6">
      {/* Tier indicator removed — clean game area */}

      {/* Instruction Banner */}
      <motion.div
        key={`instruction-${questionKey}`}
        initial={{ opacity: 0, y: -15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="text-center mb-4"
      >
        {isRecall ? (
          /* T5 Recall badge */
          <div
            className="text-3xl font-black uppercase tracking-[0.2em] instruction-pulse"
            style={{
              color: instructionColor,
              '--instruction-glow': instructionColor,
            } as React.CSSProperties}
          >
            RECALL
          </div>
        ) : (
          <div
            className="text-3xl font-black uppercase tracking-[0.2em] instruction-pulse"
            style={{
              color: instructionColor,
              '--instruction-glow': instructionColor,
            } as React.CSSProperties}
          >
            {displayedInstruction}
          </div>
        )}
        {/* Helper text removed — instruction is self-explanatory */}
      </motion.div>

      {/* T2: Conflict text ABOVE the arrow card */}
      {question.tier === 2 && question.conflictText && (
        <motion.div
          key={`conflict-text-${questionKey}`}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="text-4xl font-black uppercase tracking-[0.15em] mb-3 conflict-text-pulse"
          style={{ color: 'hsl(45, 95%, 55%)' }}
        >
          {question.conflictText}
        </motion.div>
      )}

      {/* Swipeable Card Container */}
      <div className="relative w-48 h-48 mb-4">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={questionKey}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.5}
            onDragEnd={handleDragEnd}
            style={{
              x,
              y,
              rotateZ,
              scale,
              background: cardGradient,
              animation: shouldDrift && !exitDirection ? 'card-drift 2s ease-in-out infinite' : 'none',
            }}
            initial={{ opacity: 0, scale: 0.6, rotate: -5 }}
            animate={{
              opacity: exitDirection ? 0 : 1,
              scale: exitDirection ? 0.8 : 1,
              rotate: exitDirection ? exitTransform?.rotate || 0 : 0,
              x: exitDirection ? exitTransform?.x || 0 : 0,
              y: exitDirection ? exitTransform?.y || 0 : 0,
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
              stiffness: 350,
              damping: 25,
              mass: 0.8,
              opacity: { duration: 0.12 },
            }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-3xl border border-border/50 backdrop-blur-xl flex items-center justify-center select-none overflow-hidden"
          >
            {/* Arrow + conflict text layout */}
            <div className="flex flex-col items-center justify-center gap-0">
              {/* Arrow (with T3 sequence animation) */}
              {question.isSequenceMode ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`seq-${sequencePhase}-${questionKey}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.25 }}
                    className={`arrow-pulse${shouldShake ? ' arrow-shake' : ''}`}
                    style={{ color: sequencePhase === 'first' ? 'hsl(var(--muted-foreground) / 0.5)' : arrowColor }}
                  >
                    {ARROW_ICONS[displayedArrowDirection]}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div
                  className={`arrow-pulse${shouldShake ? ' arrow-shake' : ''}`}
                  style={{ color: arrowColor }}
                >
                  {ARROW_ICONS[displayedArrowDirection]}
                </div>
              )}

              {/* T4: Conflict text INSIDE card, beneath arrow */}
              {question.tier === 4 && question.conflictText && (
                <span
                  className="text-lg font-black uppercase tracking-[0.2em] conflict-overlay-pulse pointer-events-none"
                  style={{
                    color: 'hsl(0, 85%, 55%)',
                    opacity: 0.55,
                    marginTop: -4,
                  }}
                >
                  {question.conflictText}
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hint removed — clean game area */}

      <style>{`
        @keyframes card-drift {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(8px, 5px); }
          66% { transform: translate(-8px, -5px); }
        }
        @keyframes arrow-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes arrow-shake {
          0%, 100% { transform: scale(1.03) rotate(0deg); }
          25% { transform: scale(1.03) rotate(2deg); }
          75% { transform: scale(1.03) rotate(-2deg); }
        }
        @keyframes instruction-pulse {
          0%, 100% { transform: scale(1); text-shadow: 0 0 15px var(--instruction-glow); }
          50% { transform: scale(1.03); text-shadow: 0 0 30px var(--instruction-glow); }
        }
        @keyframes conflict-text-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.85; }
        }
        @keyframes conflict-overlay-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.55; }
        }
        .arrow-pulse {
          animation: arrow-pulse 0.7s ease-in-out infinite;
          position: relative;
        }
        .arrow-shake {
          animation: arrow-shake 0.15s ease-in-out infinite;
        }
        .instruction-pulse {
          animation: instruction-pulse 0.6s ease-in-out infinite;
        }
        .conflict-text-pulse {
          animation: conflict-text-pulse 1.2s ease-in-out infinite;
        }
        .conflict-overlay-pulse {
          animation: conflict-overlay-pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
});
