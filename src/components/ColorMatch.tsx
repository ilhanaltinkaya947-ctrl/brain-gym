import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { ColorQuestion } from '../hooks/useGameEngine';
import { useScreenScale } from '@/hooks/useScreenScale';

interface ColorMatchProps {
  generateQuestion: () => ColorQuestion;
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  streak: number;
  onScreenShake: () => void;
  tier?: number;
  overclockFactor?: number;
}

const BASE_COLORS = [
  { name: 'RED', hsl: 'hsl(0, 85%, 55%)' },
  { name: 'BLUE', hsl: 'hsl(210, 85%, 55%)' },
  { name: 'GREEN', hsl: 'hsl(120, 60%, 45%)' },
  { name: 'YELLOW', hsl: 'hsl(45, 90%, 55%)' },
];

const TIER2_COLORS = [
  ...BASE_COLORS,
  { name: 'PURPLE', hsl: 'hsl(270, 70%, 55%)' },
];

const TIER3_COLORS = [
  ...TIER2_COLORS,
  { name: 'ORANGE', hsl: 'hsl(25, 90%, 55%)' },
];

const FULL_COLORS = [
  ...TIER3_COLORS,
  { name: 'PINK', hsl: 'hsl(330, 80%, 60%)' },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const getTimeLimit = (tier: number): number => {
  switch (tier) {
    case 1: return 3000;
    case 2: return 3500;
    case 3: return 4000;
    case 4: return 5000;
    case 5: return 4500;
    default: return 3000;
  }
};

const getColorPalette = (tier: number) => {
  if (tier >= 5) return FULL_COLORS;
  if (tier >= 3) return TIER3_COLORS;
  if (tier >= 2) return TIER2_COLORS;
  return BASE_COLORS;
};

interface GameQuestion {
  topWord: string;
  topWordColor: string;
  bottomWord?: string;
  bottomWordColor?: string;
  options: { label: string; color: string }[];
  correctAnswer: string;
  secondCorrectAnswer?: string;  // T4 dual-answer mode
  isInverted: boolean;
  isWordMode?: boolean;           // T2 alternating "tap the WORD"
  bgInterference?: string;        // T3/T5 background color tint
}

export const ColorMatch = ({
  generateQuestion,
  onAnswer,
  playSound,
  triggerHaptic,
  streak,
  onScreenShake,
  tier: propTier,
  overclockFactor = 1
}: ColorMatchProps) => {
  const { s } = useScreenScale();
  const currentTier = propTier ?? 1;
  const questionTime = getTimeLimit(currentTier);
  const colorPalette = useMemo(() => getColorPalette(currentTier), [currentTier]);

  const generateTieredQuestion = useCallback((): GameQuestion => {
    const shuffledColors = shuffleArray([...colorPalette]);

    // T4: 50% dual-answer, 50% word mode
    if (currentTier >= 4 && currentTier < 5 && Math.random() >= 0.5) {
      // Dual-answer — two words, answer both sequentially
      const topWordColor = shuffledColors[0];
      const topInkColor = shuffledColors[1];
      const bottomWordColor = shuffledColors[2] || shuffledColors[0];
      const bottomInkColor = shuffledColors[3] || shuffledColors[1];

      const optionsSet = new Set<string>([topInkColor.name, bottomInkColor.name]);
      for (const color of shuffledColors) {
        if (optionsSet.size >= 6) break;
        optionsSet.add(color.name);
      }

      return {
        topWord: topWordColor.name,
        topWordColor: topInkColor.hsl,
        bottomWord: bottomWordColor.name,
        bottomWordColor: bottomInkColor.hsl,
        options: shuffleArray(
          Array.from(optionsSet).map(name => ({
            label: name,
            color: colorPalette.find(c => c.name === name)?.hsl || 'hsl(0, 0%, 50%)',
          }))
        ),
        correctAnswer: topInkColor.name,
        secondCorrectAnswer: bottomInkColor.name,
        isInverted: false,
      };
    }

    const isInverted = currentTier === 5;
    const isWordMode = currentTier >= 4; // T4 (non-dual) and T5
    const hasDistractor = currentTier === 3 || currentTier === 5;
    const hasBgInterference = currentTier >= 3;

    const topWordColor = shuffledColors[0];
    const topInkColor = shuffledColors[1];

    // For word mode: correct answer is the WORD text, not the ink color
    const correctAnswer = isInverted || isWordMode ? topWordColor.name : topInkColor.name;

    let bottomWord: string | undefined;
    let bottomWordColor: string | undefined;
    if (hasDistractor) {
      const distractorWordColor = shuffledColors[2] || shuffledColors[0];
      const distractorInkColor = shuffledColors[3] || shuffledColors[1];
      bottomWord = distractorWordColor.name;
      bottomWordColor = distractorInkColor.hsl;
    }

    let bgInterference: string | undefined;
    if (hasBgInterference) {
      const bgColor = shuffledColors[Math.min(4, shuffledColors.length - 1)];
      bgInterference = bgColor.hsl;
    }

    const optionCount = colorPalette.length >= 6 ? 6 : colorPalette.length;
    const optionsSet = new Set<string>([correctAnswer]);
    for (const color of shuffledColors) {
      if (optionsSet.size >= optionCount) break;
      optionsSet.add(color.name);
    }

    return {
      topWord: topWordColor.name,
      topWordColor: topInkColor.hsl,
      bottomWord,
      bottomWordColor,
      options: shuffleArray(
        Array.from(optionsSet).map(name => ({
          label: name,
          color: colorPalette.find(c => c.name === name)?.hsl || 'hsl(0, 0%, 50%)',
        }))
      ),
      correctAnswer,
      isInverted,
      isWordMode,
      bgInterference,
    };
  }, [currentTier, colorPalette]);

  const [question, setQuestion] = useState<GameQuestion>(() => generateTieredQuestion());
  const questionStartRef = useRef(Date.now());
  const [isShaking, setIsShaking] = useState(false);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [correctButton, setCorrectButton] = useState<string | null>(null);
  const [questionKey, setQuestionKey] = useState(0);
  const [dualStep, setDualStep] = useState(0); // 0 = first answer, 1 = second answer (T4)
  const containerRef = useRef<HTMLDivElement>(null);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const nextQuestionTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const answerCooldownRef = useRef(false);
  const questionAnsweredRef = useRef(false); // Blocks ALL input until next question loads

  const onAnswerRef = useRef(onAnswer);
  const playSoundRef = useRef(playSound);
  const triggerHapticRef = useRef(triggerHaptic);
  onAnswerRef.current = onAnswer;
  playSoundRef.current = playSound;
  triggerHapticRef.current = triggerHaptic;

  const nextQuestion = useCallback(() => {
    questionAnsweredRef.current = false; // Unlock input for new question
    setQuestion(generateTieredQuestion());
    questionStartRef.current = Date.now();
    setPressedButton(null);
    setCorrectButton(null);
    setQuestionKey(k => k + 1);
    setDualStep(0);
  }, [generateTieredQuestion, currentTier]);

  // NOTE: No useEffect on [currentTier] — tier changes take effect on NEXT question
  // to prevent swapping the question while the user is mid-tap

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);
    };
  }, []);

  // Timer: single timeout for expiry, CSS handles visual bar
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef2 = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    // Clear previous timers
    if (expiryRef.current) clearTimeout(expiryRef.current);
    tickRef2.current.forEach(t => clearTimeout(t));
    tickRef2.current = [];

    const duration = questionTime / overclockFactor; // ms

    // Start CSS animation on next frame
    setTimerActive(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTimerActive(true));
    });

    // Schedule tick sounds at 20% and 60% remaining
    const tickAt80 = duration * 0.8;
    const tickAt60 = duration * 0.6;
    tickRef2.current.push(setTimeout(() => playSoundRef.current('tick'), tickAt60));
    tickRef2.current.push(setTimeout(() => playSoundRef.current('tick'), tickAt80));

    // Schedule expiry
    expiryRef.current = setTimeout(() => {
      if (questionAnsweredRef.current) return; // Already answered
      questionAnsweredRef.current = true; // Lock input during shake
      onAnswerRef.current(false, 0, currentTier);
      playSoundRef.current('wrong');
      triggerHapticRef.current('heavy');
      setIsShaking(true);
      shakeTimeoutRef.current = setTimeout(() => {
        setIsShaking(false);
        nextQuestion();
      }, 300);
    }, duration);

    return () => {
      if (expiryRef.current) clearTimeout(expiryRef.current);
      tickRef2.current.forEach(t => clearTimeout(t));
    };
  }, [question, nextQuestion, currentTier, questionTime, overclockFactor]);

  const triggerConfetti = (event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: Math.min(30, 15 + streak * 2),
      spread: 60,
      origin: { x, y },
      colors: ['#00D4FF', '#FF00FF', '#FFD700', '#00FF88'],
      scalar: 0.8,
      gravity: 1.5,
      drift: 0,
      ticks: 60,
      decay: 0.94,
      disableForReducedMotion: true,
    });
  };

  const handleAnswer = (selectedColor: string, event: React.MouseEvent) => {
    if (answerCooldownRef.current || questionAnsweredRef.current) return;
    answerCooldownRef.current = true;
    questionAnsweredRef.current = true; // Lock — one answer per question
    setTimeout(() => { answerCooldownRef.current = false; }, 200);

    // Cancel timer immediately to prevent race condition
    if (expiryRef.current) clearTimeout(expiryRef.current);

    // T4 dual-answer mode
    if (question.secondCorrectAnswer && dualStep === 0) {
      const isCorrect = selectedColor === question.correctAnswer;
      setPressedButton(selectedColor);
      if (isCorrect) {
        setCorrectButton(selectedColor);
        playSound('correct');
        triggerHaptic('light');
        questionAnsweredRef.current = false; // Unlock for second answer
        setDualStep(1);
        setPressedButton(null);
        setCorrectButton(null);
      } else {
        playSound('wrong');
        triggerHaptic('heavy');
        setIsShaking(true);
        shakeTimeoutRef.current = setTimeout(() => setIsShaking(false), 500);
        onAnswer(false, 0, currentTier);
        nextQuestionTimeoutRef.current = setTimeout(() => nextQuestion(), 100);
      }
      return;
    }

    const target = question.secondCorrectAnswer && dualStep === 1
      ? question.secondCorrectAnswer
      : question.correctAnswer;

    const isCorrect = selectedColor === target;
    const elapsed = Date.now() - questionStartRef.current;
    const speedBonus = Math.floor(Math.max(0, 1 - elapsed / (questionTime / overclockFactor)) * 10);

    setPressedButton(selectedColor);

    if (isCorrect) {
      setCorrectButton(selectedColor);
      playSound('correct');
      triggerHaptic('light');
      triggerConfetti(event);
      onScreenShake();
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      setIsShaking(true);
      shakeTimeoutRef.current = setTimeout(() => setIsShaking(false), 500);
    }

    onAnswer(isCorrect, speedBonus, currentTier);
    nextQuestionTimeoutRef.current = setTimeout(() => nextQuestion(), 100);
  };

  const timerDurationSec = questionTime / 1000 / overclockFactor;

  const getInstruction = () => {
    if (question.secondCorrectAnswer) {
      // T4 dual-answer
      if (dualStep === 0) {
        return (
          <>
            Tap the <span className="text-secondary font-bold text-glow-magenta">INK COLOR</span> of the <span className="text-primary font-bold">TOP</span> word
          </>
        );
      }
      return (
        <>
          Now tap the <span className="text-secondary font-bold text-glow-magenta">INK COLOR</span> of the <span className="text-primary font-bold">BOTTOM</span> word
        </>
      );
    }
    if (question.isInverted || question.isWordMode) {
      return (
        <>
          Tap what the <span className="text-destructive font-bold">WORD SAYS</span>
        </>
      );
    }
    if (question.bottomWord) {
      return (
        <>
          Tap the <span className="text-secondary font-bold text-glow-magenta">INK COLOR</span> of the <span className="text-primary font-bold">TOP</span> word
        </>
      );
    }
    return (
      <>
        Tap the <span className="text-secondary font-bold text-glow-magenta">INK COLOR</span>, not the word
      </>
    );
  };

  const getModeLabel = () => {
    if (question.secondCorrectAnswer) return 'DUAL';
    if (question.isInverted) return 'INVERTED';
    if (question.isWordMode) return 'WORD MODE';
    if (question.bgInterference) return 'INTERFERENCE';
    return null;
  };

  const modeLabel = getModeLabel();

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center justify-center h-full px-4 relative ${isShaking ? 'cm-shake' : ''}`}
    >
      <style>{`
        @keyframes cm-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        .cm-shake { animation: cm-shake 0.4s ease; }
        @keyframes cm-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .cm-fade-in { animation: cm-fade-in 0.3s ease forwards; }
        @keyframes cm-word-in {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        .cm-word-in { animation: cm-word-in 0.2s ease-out forwards; }
        @keyframes cm-distractor-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 0.6; transform: translateY(0); }
        }
        .cm-distractor-in { animation: cm-distractor-in 0.2s ease-out 0.08s forwards; opacity: 0; }
        @keyframes cm-btn-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .cm-btn-in { animation: cm-btn-in 0.15s ease-out forwards; }
      `}</style>

      {/* Timer bar — CSS-driven animation, no JS ticks */}
      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden mb-6 border border-border/50" style={{ maxWidth: s(384) }}>
        <div
          key={questionKey}
          className="h-full rounded-full"
          style={{
            width: timerActive ? '0%' : '100%',
            transition: timerActive ? `width ${timerDurationSec}s linear` : 'none',
            background: 'linear-gradient(90deg, hsl(var(--neon-magenta)), hsl(var(--neon-cyan)))',
            boxShadow: '0 0 10px hsl(var(--neon-magenta) / 0.5)',
          }}
        />
      </div>

      {/* Mode badge + Instructions */}
      {modeLabel && (
        <div
          key={`mode-${questionKey}`}
          className="cm-fade-in mb-2 px-3 py-1 rounded-full font-black uppercase tracking-widest text-center"
          style={{
            fontSize: s(12),
            background: question.isWordMode || question.isInverted
              ? 'hsl(0 85% 55% / 0.2)'
              : 'hsl(270 70% 55% / 0.2)',
            border: `1px solid ${question.isWordMode || question.isInverted
              ? 'hsl(0 85% 55% / 0.5)'
              : 'hsl(270 70% 55% / 0.3)'}`,
            color: question.isWordMode || question.isInverted
              ? 'hsl(0 85% 65%)'
              : 'hsl(270 70% 65%)',
          }}
        >
          {modeLabel}
        </div>
      )}
      <p
        className={`text-muted-foreground uppercase tracking-widest text-center px-4 cm-fade-in ${
          question.isWordMode || question.isInverted ? 'text-sm font-bold mb-3' : 'text-xs mb-4'
        }`}
        style={question.isWordMode || question.isInverted ? { color: 'hsl(0 85% 65%)' } : undefined}
      >
        {getInstruction()}
      </p>

      {/* Word Display */}
      <div
        key={`word-${questionKey}`}
        className="mb-8 flex flex-col items-center gap-2 cm-word-in relative"
      >
        {/* Background interference (T3/T5) */}
        {question.bgInterference && (
          <div
            className="absolute inset-0 -inset-x-8 -inset-y-4 rounded-2xl"
            style={{
              background: question.bgInterference,
              opacity: 0.12,
              filter: 'blur(20px)',
            }}
          />
        )}

        {/* Top Word */}
        <h2
          className="font-black uppercase tracking-wider relative z-10"
          style={{
            fontSize: s(60),
            color: question.topWordColor,
            textShadow: `0 0 40px ${question.topWordColor}, 0 0 80px ${question.topWordColor}40`,
            opacity: question.secondCorrectAnswer && dualStep === 1 ? 0.4 : 1,
          }}
        >
          {question.topWord}
        </h2>

        {/* Distractor / Second Word */}
        {question.bottomWord && question.bottomWordColor && (
          <h3
            key={`dist-${questionKey}`}
            className="font-bold uppercase tracking-wider cm-distractor-in relative z-10"
            style={{
              fontSize: s(36),
              color: question.bottomWordColor,
              textShadow: `0 0 20px ${question.bottomWordColor}40`,
              opacity: question.secondCorrectAnswer && dualStep === 1 ? 1 : undefined,
            }}
          >
            {question.bottomWord}
          </h3>
        )}
      </div>

      {/* Color Buttons */}
      <div className={`grid gap-3 w-full ${question.options.length > 4 ? 'grid-cols-3' : 'grid-cols-2'}`} style={{ maxWidth: s(384) }}>
        {question.options.map((option, index) => {
          const isCorrect = correctButton === option.label;
          return (
            <button
              key={`${questionKey}-${option.label}-${index}`}
              onClick={(e) => handleAnswer(option.label, e)}
              className="rounded-2xl font-black uppercase tracking-wide touch-manipulation cm-btn-in"
              style={{
                padding: `${s(16)}px ${s(20)}px`,
                minHeight: s(52),
                fontSize: s(16),
                background: isCorrect
                  ? `linear-gradient(145deg, ${option.color}40, ${option.color}20)`
                  : `linear-gradient(145deg, hsl(260 30% 14% / 0.8), hsl(260 30% 8% / 0.6))`,
                border: `2px solid ${isCorrect ? 'hsl(var(--neon-gold))' : option.color}80`,
                color: isCorrect ? 'hsl(var(--neon-gold))' : option.color,
                boxShadow: isCorrect
                  ? `0 0 50px hsl(var(--neon-gold) / 0.7), inset 0 0 30px hsl(var(--neon-gold) / 0.2)`
                  : `0 0 20px ${option.color}30`,
                transform: pressedButton === option.label ? 'scale(1.15)' : undefined,
                transition: 'transform 0.15s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                animationDelay: `${index * 30}ms`,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
