import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface OperatorChaosProps {
  onAnswer: (correct: boolean, speedBonus: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  operatorCount?: number;
  maxNumber?: number;
}

type Operator = '+' | '-' | '×' | '÷';

interface Question {
  numbers: number[];
  operators: Operator[];
  result: number;
  displayParts: (string | '?')[];
}

const OPERATORS: Operator[] = ['+', '-', '×', '÷'];

const evaluate = (a: number, op: Operator, b: number): number => {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return a / b;
  }
};

const generateQuestion = (operatorCount: number, maxNum: number): Question => {
  // For single operator
  if (operatorCount === 1) {
    const op = OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
    let a: number, b: number, result: number;

    switch (op) {
      case '+':
        a = Math.floor(Math.random() * maxNum) + 1;
        b = Math.floor(Math.random() * maxNum) + 1;
        result = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * maxNum) + maxNum;
        b = Math.floor(Math.random() * maxNum) + 1;
        result = a - b;
        break;
      case '×':
        a = Math.floor(Math.random() * 10) + 2;
        b = Math.floor(Math.random() * 10) + 2;
        result = a * b;
        break;
      case '÷':
        b = Math.floor(Math.random() * 9) + 2;
        result = Math.floor(Math.random() * 9) + 2;
        a = b * result;
        break;
      default:
        a = 5; b = 3; result = 8;
    }

    return {
      numbers: [a, b],
      operators: [op],
      result,
      displayParts: [`${a}`, '?', `${b}`, '=', `${result}`],
    };
  }

  // Two operators: a [?] b [?] c = result
  // Generate with known operators, then hide them
  const op1 = OPERATORS[Math.floor(Math.random() * 3)]; // Avoid division for first
  const op2 = OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
  
  let a: number, b: number, c: number;
  
  // Simple approach: generate numbers that work
  a = Math.floor(Math.random() * 8) + 2;
  b = Math.floor(Math.random() * 5) + 2;
  c = Math.floor(Math.random() * 5) + 1;
  
  // Evaluate left to right (simplified, not PEMDAS)
  const intermediate = evaluate(a, op1, b);
  let result = evaluate(intermediate, op2, c);
  
  // Ensure result is positive integer
  if (result < 0 || !Number.isInteger(result) || result > 100) {
    // Fallback to simple addition/multiplication
    return {
      numbers: [a, b],
      operators: ['+'],
      result: a + b,
      displayParts: [`${a}`, '?', `${b}`, '=', `${a + b}`],
    };
  }

  return {
    numbers: [a, b, c],
    operators: [op1, op2],
    result,
    displayParts: [`${a}`, '?', `${b}`, '?', `${c}`, '=', `${result}`],
  };
};

export const OperatorChaos = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  operatorCount = 1,
  maxNumber = 10,
}: OperatorChaosProps) => {
  const [question, setQuestion] = useState<Question>(() => generateQuestion(operatorCount, maxNumber));
  const [selectedOperators, setSelectedOperators] = useState<Operator[]>([]);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [questionKey, setQuestionKey] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);

  const questionStartTime = useRef(Date.now());
  const isProcessing = useRef(false);

  const totalSlots = question.operators.length;

  const handleOperatorSelect = useCallback((op: Operator) => {
    if (isProcessing.current) return;

    const newSelected = [...selectedOperators, op];
    setSelectedOperators(newSelected);

    // If all slots filled, check answer
    if (newSelected.length === totalSlots) {
      isProcessing.current = true;
      
      const responseTime = Date.now() - questionStartTime.current;
      const speedBonus = Math.max(0, Math.floor((5000 - responseTime) / 100));
      
      // Check if operators match
      const isCorrect = newSelected.every((selected, i) => selected === question.operators[i]);

      if (isCorrect) {
        playSound('correct');
        triggerHaptic('light');
        setLastFeedback('correct');
        
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FF8C00'],
          scalar: 0.8,
        });
      } else {
        playSound('wrong');
        triggerHaptic('heavy');
        onScreenShake();
        setLastFeedback('wrong');
      }

      onAnswer(isCorrect, speedBonus);

      // Next question
      setTimeout(() => {
        setQuestion(generateQuestion(operatorCount, maxNumber));
        setSelectedOperators([]);
        setCurrentSlot(0);
        setQuestionKey(k => k + 1);
        questionStartTime.current = Date.now();
        setLastFeedback(null);
        isProcessing.current = false;
      }, 200);
    } else {
      setCurrentSlot(currentSlot + 1);
      playSound('tick');
    }
  }, [selectedOperators, totalSlots, question.operators, operatorCount, maxNumber, onAnswer, playSound, triggerHaptic, onScreenShake]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Operator> = {
        '+': '+',
        '-': '-',
        '*': '×',
        'x': '×',
        '/': '÷',
        'd': '÷',
      };
      
      if (keyMap[e.key]) {
        handleOperatorSelect(keyMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOperatorSelect]);

  const renderEquation = () => {
    let slotIndex = 0;
    
    return question.displayParts.map((part, i) => {
      if (part === '?') {
        const thisSlotIndex = slotIndex;
        const selected = selectedOperators[thisSlotIndex];
        const isCurrentSlot = thisSlotIndex === currentSlot && !selected;
        slotIndex++;
        
        return (
          <motion.div
            key={`slot-${i}`}
            animate={{ 
              scale: isCurrentSlot ? [1, 1.1, 1] : 1,
              borderColor: isCurrentSlot ? 'hsl(45, 90%, 55%)' : 'hsl(45, 90%, 55% / 0.4)',
            }}
            transition={{ duration: 0.5, repeat: isCurrentSlot ? Infinity : 0 }}
            className="w-14 h-14 rounded-xl border-2 flex items-center justify-center mx-1"
            style={{
              background: selected 
                ? 'linear-gradient(135deg, hsl(45, 90%, 55% / 0.3), hsl(45, 90%, 55% / 0.1))'
                : 'hsl(0, 0%, 10%)',
            }}
          >
            <span className="text-2xl font-bold" style={{ color: 'hsl(45, 90%, 55%)' }}>
              {selected || '?'}
            </span>
          </motion.div>
        );
      }
      
      return (
        <span 
          key={`part-${i}`} 
          className="text-3xl font-mono font-bold mx-2"
          style={{ color: part === '=' ? 'hsl(0, 0%, 50%)' : 'hsl(0, 0%, 90%)' }}
        >
          {part}
        </span>
      );
    });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8">
      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-game-direction/70 mb-2">
          Operator Chaos
        </div>
        <div className="text-sm text-muted-foreground">
          Find the missing operator{totalSlots > 1 ? 's' : ''}
        </div>
      </motion.div>

      {/* Equation Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={questionKey}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            boxShadow: lastFeedback === 'correct' 
              ? '0 0 40px hsl(45, 90%, 55% / 0.5)' 
              : lastFeedback === 'wrong'
              ? '0 0 40px hsl(0, 70%, 50% / 0.5)'
              : '0 0 20px hsl(45, 90%, 55% / 0.2)',
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex items-center justify-center flex-wrap p-6 rounded-2xl border border-border/30 bg-card/30 mb-10"
        >
          {renderEquation()}
        </motion.div>
      </AnimatePresence>

      {/* Operator Buttons */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-xs">
        {OPERATORS.map((op) => (
          <motion.button
            key={op}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOperatorSelect(op)}
            disabled={isProcessing.current}
            className="h-16 rounded-xl text-3xl font-bold border-2 transition-all"
            style={{
              background: 'linear-gradient(135deg, hsl(45, 90%, 55% / 0.15), hsl(45, 90%, 55% / 0.05))',
              borderColor: 'hsl(45, 90%, 55% / 0.5)',
              color: 'hsl(45, 90%, 55%)',
              boxShadow: '0 0 15px hsl(45, 90%, 55% / 0.2)',
            }}
          >
            {op}
          </motion.button>
        ))}
      </div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="mt-8 text-xs text-muted-foreground text-center uppercase tracking-wider"
      >
        Press +, -, *, / keys
      </motion.p>
    </div>
  );
};
