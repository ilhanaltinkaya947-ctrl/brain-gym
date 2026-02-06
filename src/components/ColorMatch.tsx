import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ColorQuestion } from '../hooks/useGameEngine';

interface ColorMatchProps {
  generateQuestion: () => ColorQuestion;
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  streak: number;
  onScreenShake: () => void;
  tier?: number;
}

const QUESTION_TIME = 2500; // 2.5 seconds - faster pace

export const ColorMatch = ({ 
  generateQuestion, 
  onAnswer, 
  playSound, 
  triggerHaptic, 
  streak,
  onScreenShake,
  tier = 1
}: ColorMatchProps) => {
  const [question, setQuestion] = useState<ColorQuestion>(generateQuestion);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [isShaking, setIsShaking] = useState(false);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [correctButton, setCorrectButton] = useState<string | null>(null);
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
          // Color match is considered tier 1-2 based on reaction speed
          const tier = streak >= 10 ? 2 : 1;
          onAnswer(false, 0, tier);
          playSound('wrong');
          triggerHaptic('heavy');
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            nextQuestion();
          }, 300);
          return QUESTION_TIME;
        }
        if (prev <= 800) {
          playSound('tick');
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [question, onAnswer, playSound, triggerHaptic, nextQuestion, streak]);

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

  const handleAnswer = (selectedColor: string, event: React.MouseEvent) => {
    const isCorrect = selectedColor === question.correctColor;
    const speedBonus = Math.floor((timeLeft / QUESTION_TIME) * 10);

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
      setTimeout(() => setIsShaking(false), 500);
    }

    // Color match tier based on streak
    const tier = streak >= 10 ? 2 : 1;
    onAnswer(isCorrect, speedBonus, tier);
    setTimeout(() => nextQuestion(), 100);
  };

  const progress = (timeLeft / QUESTION_TIME) * 100;

  return (
    <motion.div
      ref={containerRef}
      animate={isShaking ? { x: [-8, 8, -8, 8, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-6"
    >
      {/* Timer bar */}
      <div className="w-full max-w-sm h-2 bg-muted/30 rounded-full overflow-hidden mb-8 border border-border/50">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: progress > 30 
              ? 'linear-gradient(90deg, hsl(var(--neon-magenta)), hsl(var(--neon-cyan)))' 
              : 'hsl(var(--destructive))',
            boxShadow: progress > 30 
              ? '0 0 10px hsl(var(--neon-magenta) / 0.5)' 
              : '0 0 10px hsl(var(--destructive) / 0.5)'
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Instructions */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-muted-foreground mb-4 uppercase tracking-widest text-center"
      >
        Tap the <span className="text-secondary font-bold text-glow-magenta">COLOR</span> of the text
      </motion.p>

      {/* Word Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.word + question.wordColor}
          initial={{ opacity: 0, scale: 0.8, rotateX: 90 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotateX: -90 }}
          transition={{ duration: 0.25, type: "spring" }}
          className="mb-12"
        >
          <h2 
            className="text-7xl font-black uppercase tracking-wider"
            style={{ 
              color: question.wordColor,
              textShadow: `0 0 40px ${question.wordColor}, 0 0 80px ${question.wordColor}40`,
            }}
          >
            {question.word}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Color Buttons - Energy Cell Style */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {question.options.map((option, index) => {
          const isCorrect = correctButton === option.label;
          return (
            <motion.button
              key={`${question.word}-${option.label}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: pressedButton === option.label ? 1.15 : 1,
              }}
              transition={{ 
                delay: index * 0.05,
                scale: { type: "spring", stiffness: 500, damping: 15 }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 1.15 }}
              onClick={(e) => handleAnswer(option.label, e)}
              className="p-6 rounded-2xl text-xl font-black uppercase tracking-wide transition-all duration-150 backdrop-blur-sm"
              style={{
                background: isCorrect 
                  ? `linear-gradient(145deg, ${option.color}40, ${option.color}20)`
                  : `linear-gradient(145deg, hsl(260 30% 14% / 0.8), hsl(260 30% 8% / 0.6))`,
                border: `2px solid ${isCorrect ? 'hsl(var(--neon-gold))' : option.color}80`,
                color: isCorrect ? 'hsl(var(--neon-gold))' : option.color,
                boxShadow: isCorrect 
                  ? `0 0 50px hsl(var(--neon-gold) / 0.7), inset 0 0 30px hsl(var(--neon-gold) / 0.2)`
                  : `0 0 20px ${option.color}30`,
              }}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
