import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ColorQuestion } from '../hooks/useGameEngine';
import { ParticleExplosion } from './ParticleExplosion';

interface ColorMatchProps {
  generateQuestion: () => ColorQuestion;
  onAnswer: (correct: boolean, speedBonus: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

const QUESTION_TIME = 2500; // 2.5 seconds - faster pace

export const ColorMatch = ({ generateQuestion, onAnswer, playSound, triggerHaptic }: ColorMatchProps) => {
  const [question, setQuestion] = useState<ColorQuestion>(generateQuestion);
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
        if (prev <= 800) {
          playSound('tick');
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [question, onAnswer, playSound, triggerHaptic, nextQuestion]);

  const handleAnswer = (selectedColor: string) => {
    const isCorrect = selectedColor === question.correctColor;
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
              ? 'linear-gradient(90deg, hsl(var(--cyber-blue)), hsl(var(--neon-lime)))' 
              : 'hsl(var(--destructive))'
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Instructions */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg text-muted-foreground mb-4 uppercase tracking-wider text-center"
      >
        Tap the <span className="text-secondary font-bold">COLOR</span> of the text
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
              textShadow: `0 0 30px ${question.wordColor}`,
            }}
          >
            {question.word}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Color Buttons */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {question.options.map((option, index) => (
          <motion.button
            key={`${question.word}-${option.label}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAnswer(option.label)}
            className="p-6 rounded-2xl text-xl font-bold uppercase tracking-wide transition-all duration-200 border-2"
            style={{
              backgroundColor: `${option.color}20`,
              borderColor: option.color,
              color: option.color,
              boxShadow: `0 0 20px ${option.color}40`,
            }}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
