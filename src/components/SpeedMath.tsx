import { useState, useEffect, useCallback, useRef, memo } from 'react';
// framer-motion removed — using CSS animations for performance
import confetti from 'canvas-confetti';
import { MathQuestion } from '../hooks/useGameEngine';
import { useScreenScale } from '@/hooks/useScreenScale';

interface SpeedMathProps {
  generateQuestion: () => MathQuestion;
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  streak: number;
  onScreenShake: () => void;
  tier?: number;
  overclockFactor?: number;
}

const getQuestionTime = (tier: number): number => {
  switch (tier) {
    case 1: return 6000;
    case 2: return 8000;
    case 3: return 10000;
    case 4: return 14000;
    case 5: return 18000;
    default: return 6000;
  }
};

export const SpeedMath = memo(({
  generateQuestion,
  onAnswer,
  playSound,
  triggerHaptic,
  streak,
  onScreenShake,
  tier = 1,
  overclockFactor = 1
}: SpeedMathProps) => {
  const { s } = useScreenScale();
  const QUESTION_TIME = getQuestionTime(tier);
  const [question, setQuestion] = useState<MathQuestion>(generateQuestion);
  const [isShaking, setIsShaking] = useState(false);
  const [pressedButton, setPressedButton] = useState<number | null>(null);
  const [correctButton, setCorrectButton] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const questionStartRef = useRef(Date.now());

  // Stable refs for callbacks — prevents timer useEffect from re-firing on every render
  const onAnswerRef = useRef(onAnswer);
  const playSoundRef = useRef(playSound);
  const triggerHapticRef = useRef(triggerHaptic);
  onAnswerRef.current = onAnswer;
  playSoundRef.current = playSound;
  triggerHapticRef.current = triggerHaptic;

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setQuestionKey(k => k + 1);
    setPressedButton(null);
    setCorrectButton(null);
  }, [generateQuestion]);

  // Timer: CSS-driven bar + setTimeout for expiry and ticks
  // Only re-runs when questionKey changes (new question), not on callback changes
  useEffect(() => {
    if (expiryRef.current) clearTimeout(expiryRef.current);
    tickTimers.current.forEach(t => clearTimeout(t));
    tickTimers.current = [];

    const duration = QUESTION_TIME / overclockFactor;
    questionStartRef.current = Date.now();

    setTimerActive(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTimerActive(true));
    });

    // Tick sounds near end
    const tickAt80 = duration * 0.8;
    const tickAt90 = duration * 0.9;
    tickTimers.current.push(setTimeout(() => playSoundRef.current('tick'), tickAt80));
    tickTimers.current.push(setTimeout(() => playSoundRef.current('tick'), tickAt90));

    // Expiry
    expiryRef.current = setTimeout(() => {
      onAnswerRef.current(false, 0, question.tier || 1);
      playSoundRef.current('wrong');
      triggerHapticRef.current('heavy');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        nextQuestion();
      }, 300);
    }, duration);

    return () => {
      if (expiryRef.current) clearTimeout(expiryRef.current);
      tickTimers.current.forEach(t => clearTimeout(t));
    };
  }, [questionKey, QUESTION_TIME, overclockFactor]);

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

  const handleAnswer = (selected: number, event: React.MouseEvent) => {
    const isCorrect = selected === question.answer;
    const elapsed = Date.now() - questionStartRef.current;
    const speedBonus = Math.floor(Math.max(0, 1 - elapsed / (QUESTION_TIME / overclockFactor)) * 10);

    setPressedButton(selected);

    if (isCorrect) {
      setCorrectButton(selected);
      playSound('correct');
      triggerHaptic('light');
      triggerConfetti(event);
      onScreenShake();
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    onAnswer(isCorrect, speedBonus, question.tier || 1);
    setTimeout(() => nextQuestion(), 100);
  };

  const timerDurationSec = QUESTION_TIME / 1000 / overclockFactor;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center gap-6 py-4 px-4 w-full ${isShaking ? 'sm-shake' : ''}`}
    >
      <style>{`
        @keyframes sm-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        .sm-shake { animation: sm-shake 0.4s ease; }
        @keyframes sm-question-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .sm-question-in { animation: sm-question-in 0.2s ease-out forwards; }
      `}</style>

      {/* Timer bar — CSS-driven, no JS ticks */}
      <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden border border-border/50" style={{ maxWidth: s(384) }}>
        <div
          key={questionKey}
          className="h-full rounded-full"
          style={{
            width: timerActive ? '0%' : '100%',
            transition: timerActive ? `width ${timerDurationSec}s linear` : 'none',
            background: 'linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-magenta)))',
            boxShadow: '0 0 10px hsl(var(--neon-cyan) / 0.5)',
          }}
        />
      </div>

      {/* Question - Centered with auto-scaling */}
      <div
        key={question.question}
        className="text-center py-6 w-full px-2 overflow-hidden sm-question-in"
        style={{ maxWidth: s(384) }}
      >
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Solve</p>
          <h2
            className="font-black font-mono text-glow-cyan leading-tight"
            style={{
              fontSize: question.question.length > 20
                ? s(20)
                : question.question.length > 15
                  ? s(24)
                  : question.question.length > 12
                    ? s(30)
                    : question.question.length > 8
                      ? s(36)
                      : s(48),
              wordBreak: 'keep-all',
              whiteSpace: 'nowrap',
              letterSpacing: question.question.length > 15 ? '-0.02em' : undefined,
            }}
          >
            {question.question}
          </h2>
      </div>

      {/* Answer Grid - Compact 2x2 */}
      <div className="grid grid-cols-2 gap-2.5 w-full" style={{ maxWidth: s(384) }}>
        {question.options.slice(0, 4).map((option, index) => (
          <button
            key={`${question.question}-${option}-${index}`}
            onClick={(e) => handleAnswer(option, e)}
            className={`btn-energy-cell rounded-xl font-black font-mono transition-transform duration-150 hover:scale-105 active:scale-95 ${
              correctButton === option ? 'correct' : ''
            }`}
            style={{
              padding: `${s(16)}px ${s(12)}px`,
              fontSize: s(24),
              color: correctButton === option ? 'hsl(var(--neon-gold))' : 'hsl(var(--foreground))',
              transform: pressedButton === option ? 'scale(1.1)' : undefined,
              animationDelay: `${index * 40}ms`,
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
});
