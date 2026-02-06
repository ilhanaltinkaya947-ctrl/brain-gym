import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { MathQuestion } from '../hooks/useGameEngine';

interface SpeedMathProps {
  generateQuestion: () => MathQuestion;
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  streak: number;
  onScreenShake: () => void;
  tier?: number;
}

const QUESTION_TIME = 3000; // 3 seconds

export const SpeedMath = memo(({ 
  generateQuestion, 
  onAnswer, 
  playSound, 
  triggerHaptic, 
  streak,
  onScreenShake,
  tier = 1
}: SpeedMathProps) => {
  const [question, setQuestion] = useState<MathQuestion>(generateQuestion);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [isShaking, setIsShaking] = useState(false);
  const [pressedButton, setPressedButton] = useState<number | null>(null);
  const [correctButton, setCorrectButton] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setTimeLeft(QUESTION_TIME);
    setPressedButton(null);
    setCorrectButton(null);
  }, [generateQuestion]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          onAnswer(false, 0, question.tier || 1);
          playSound('wrong');
          triggerHaptic('heavy');
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            nextQuestion();
          }, 300);
          return QUESTION_TIME;
        }
        if (prev <= 1000) {
          playSound('tick');
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [question, onAnswer, playSound, triggerHaptic, nextQuestion]);

  const triggerConfetti = (event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 40 + streak * 8,
      spread: 70,
      origin: { x, y },
      colors: ['#00D4FF', '#FF00FF', '#FFD700', '#00FF88'],
      scalar: 1,
      gravity: 1.2,
      drift: 0,
      ticks: 120,
    });
  };

  const handleAnswer = (selected: number, event: React.MouseEvent) => {
    const isCorrect = selected === question.answer;
    const speedBonus = Math.floor((timeLeft / QUESTION_TIME) * 10);

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

  const progress = (timeLeft / QUESTION_TIME) * 100;

  return (
    <motion.div
      ref={containerRef}
      animate={isShaking ? { x: [-8, 8, -8, 8, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-between py-6 px-4 min-h-[70vh]"
    >
      {/* Timer bar */}
      <div className="w-full max-w-xs h-1.5 bg-muted/30 rounded-full overflow-hidden border border-border/50">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: progress > 30 
              ? 'linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-magenta)))' 
              : 'hsl(var(--destructive))',
            boxShadow: progress > 30 
              ? '0 0 10px hsl(var(--neon-cyan) / 0.5)' 
              : '0 0 10px hsl(var(--destructive) / 0.5)'
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Question - Centered */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.question}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="text-center flex-1 flex flex-col items-center justify-center"
        >
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Solve</p>
          <h2 className="text-6xl font-black font-mono text-glow-cyan leading-tight">
            {question.question}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Answer Grid - Energy Cell Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {question.options.map((option, index) => (
          <motion.button
            key={`${question.question}-${option}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: pressedButton === option ? 1.15 : 1,
            }}
            transition={{ 
              delay: index * 0.05,
              scale: { type: "spring", stiffness: 500, damping: 15 }
            }}
            whileHover={{ scale: 1.05, borderColor: 'hsl(var(--neon-cyan))' }}
            whileTap={{ scale: 1.15 }}
            onClick={(e) => handleAnswer(option, e)}
            className={`btn-energy-cell py-5 px-4 rounded-2xl text-3xl font-black font-mono transition-all duration-150 ${
              correctButton === option ? 'correct' : ''
            }`}
            style={{
              color: correctButton === option ? 'hsl(var(--neon-gold))' : 'hsl(var(--foreground))',
            }}
          >
            {option}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
});
