import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathQuestion } from '../hooks/useGameEngine';
import { ParticleExplosion } from './ParticleExplosion';

interface SpeedMathProps {
  generateQuestion: () => MathQuestion;
  onAnswer: (correct: boolean, speedBonus: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

const QUESTION_TIME = 3000; // 3 seconds

export const SpeedMath = ({ generateQuestion, onAnswer, playSound, triggerHaptic }: SpeedMathProps) => {
  const [question, setQuestion] = useState<MathQuestion>(generateQuestion);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [isShaking, setIsShaking] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [particleKey, setParticleKey] = useState(0);

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setTimeLeft(QUESTION_TIME);
  }, [generateQuestion]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          onAnswer(false, 0);
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

  const handleAnswer = (selected: number) => {
    const isCorrect = selected === question.answer;
    const speedBonus = Math.floor((timeLeft / QUESTION_TIME) * 10);

    if (isCorrect) {
      playSound('correct');
      triggerHaptic('light');
      setShowParticles(true);
      setParticleKey(prev => prev + 1);
      setTimeout(() => setShowParticles(false), 100);
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    onAnswer(isCorrect, speedBonus);
    nextQuestion();
  };

  const progress = (timeLeft / QUESTION_TIME) * 100;

  return (
    <motion.div
      animate={isShaking ? { x: [-4, 4, -4, 4, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-6"
    >
      <ParticleExplosion key={particleKey} trigger={showParticles} x={50} y={40} />

      {/* Timer bar */}
      <div className="w-full max-w-sm h-2 bg-muted rounded-full overflow-hidden mb-8">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: progress > 30 
              ? 'linear-gradient(90deg, hsl(var(--neon-lime)), hsl(var(--cyber-blue)))' 
              : 'hsl(var(--destructive))'
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.question}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="text-center mb-12"
        >
          <p className="text-lg text-muted-foreground mb-4 uppercase tracking-wider">Solve</p>
          <h2 className="text-6xl font-bold font-mono text-glow-neon">
            {question.question}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {question.options.map((option, index) => (
          <motion.button
            key={`${question.question}-${option}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAnswer(option)}
            className="card-glass p-6 rounded-2xl text-3xl font-bold font-mono transition-all duration-200 hover:border-primary/50 active:bg-primary/20"
          >
            {option}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
