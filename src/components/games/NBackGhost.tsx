import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface NBackGhostProps {
  onAnswer: (correct: boolean, speedBonus: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  nBack?: number;
  runeCount?: number;
}

// Mystical runes for visual appeal
const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ'];

export const NBackGhost = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  nBack = 2,
  runeCount = 6,
}: NBackGhostProps) => {
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentRune, setCurrentRune] = useState<string>('');
  const [runeKey, setRuneKey] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  
  const questionStartTime = useRef(Date.now());
  const isProcessing = useRef(false);
  const availableRunes = useRef(RUNES.slice(0, runeCount));

  // Generate next rune with ~30% match probability
  const generateNextRune = useCallback(() => {
    const runes = availableRunes.current;
    
    // If we have enough history, check for match opportunity
    if (sequence.length >= nBack) {
      const targetRune = sequence[sequence.length - nBack];
      
      // 30% chance to make it a match (or slightly higher at start)
      if (Math.random() < 0.35) {
        return { rune: targetRune, isMatch: true };
      }
    }
    
    // Generate non-match rune
    const targetToAvoid = sequence.length >= nBack ? sequence[sequence.length - nBack] : null;
    const candidates = targetToAvoid 
      ? runes.filter(r => r !== targetToAvoid)
      : runes;
    
    const rune = candidates[Math.floor(Math.random() * candidates.length)];
    const willMatch = sequence.length >= nBack && rune === sequence[sequence.length - nBack];
    
    return { rune, isMatch: willMatch };
  }, [sequence, nBack]);

  // Initialize first rune
  useEffect(() => {
    const { rune, isMatch: match } = generateNextRune();
    setCurrentRune(rune);
    setIsMatch(match);
    questionStartTime.current = Date.now();
  }, []);

  const handleResponse = useCallback((userSaysMatch: boolean) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const responseTime = Date.now() - questionStartTime.current;
    const speedBonus = Math.max(0, Math.floor((3000 - responseTime) / 100));
    
    // Check if user was correct
    const wasMatch = sequence.length >= nBack && currentRune === sequence[sequence.length - nBack];
    const isCorrect = userSaysMatch === wasMatch;

    if (isCorrect) {
      playSound('correct');
      triggerHaptic('light');
      setLastFeedback('correct');
      
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#00CED1', '#20B2AA', '#40E0D0'],
        scalar: 0.7,
      });
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
      setLastFeedback('wrong');
    }

    onAnswer(isCorrect, speedBonus);

    // Generate next rune
    setTimeout(() => {
      setSequence(prev => [...prev, currentRune]);
      const { rune: nextRune, isMatch: nextMatch } = generateNextRune();
      setCurrentRune(nextRune);
      setIsMatch(nextMatch);
      setRuneKey(k => k + 1);
      questionStartTime.current = Date.now();
      setLastFeedback(null);
      isProcessing.current = false;
    }, 150);
  }, [currentRune, sequence, nBack, onAnswer, playSound, triggerHaptic, onScreenShake, generateNextRune]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M' || e.key === ' ') {
        handleResponse(true); // Match
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        handleResponse(false); // No match
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResponse]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8">
      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70 mb-2">
          {nBack}-Back Memory
        </div>
        <div className="text-sm text-muted-foreground">
          Does this match {nBack} symbols ago?
        </div>
      </motion.div>

      {/* Previous symbols indicator */}
      <div className="flex gap-2 mb-6 h-8">
        {sequence.slice(-nBack).map((rune, i) => (
          <motion.div
            key={`prev-${i}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.4, scale: 1 }}
            className="w-8 h-8 flex items-center justify-center text-lg text-muted-foreground border border-border/30 rounded-lg bg-card/30"
          >
            {rune}
          </motion.div>
        ))}
        {Array.from({ length: Math.max(0, nBack - sequence.length) }).map((_, i) => (
          <div 
            key={`empty-${i}`}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground/30 border border-border/20 rounded-lg bg-card/10"
          >
            ?
          </div>
        ))}
      </div>

      {/* Current Rune Display */}
      <div className="relative mb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={runeKey}
            initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              rotateY: 0,
              boxShadow: lastFeedback === 'correct' 
                ? '0 0 60px hsl(175, 60%, 50%)' 
                : lastFeedback === 'wrong'
                ? '0 0 60px hsl(0, 70%, 50%)'
                : '0 0 40px hsl(175, 60%, 50% / 0.3)',
            }}
            exit={{ opacity: 0, scale: 0.5, rotateY: 90 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-40 h-40 rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-card flex items-center justify-center"
          >
            <span 
              className="text-8xl font-light"
              style={{
                color: 'hsl(175, 60%, 50%)',
                textShadow: '0 0 30px hsl(175, 60%, 50% / 0.5)',
              }}
            >
              {currentRune}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Response Buttons */}
      <div className="flex gap-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleResponse(true)}
          className="px-10 py-5 rounded-2xl text-lg font-bold uppercase tracking-wider border-2 transition-all"
          style={{
            background: 'linear-gradient(135deg, hsl(175, 60%, 50% / 0.2), hsl(175, 60%, 50% / 0.05))',
            borderColor: 'hsl(175, 60%, 50% / 0.6)',
            color: 'hsl(175, 60%, 50%)',
            boxShadow: '0 0 20px hsl(175, 60%, 50% / 0.3)',
          }}
        >
          Match
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleResponse(false)}
          className="px-10 py-5 rounded-2xl text-lg font-bold uppercase tracking-wider border-2 transition-all"
          style={{
            background: 'linear-gradient(135deg, hsl(0, 0%, 30% / 0.3), hsl(0, 0%, 20% / 0.2))',
            borderColor: 'hsl(0, 0%, 40%)',
            color: 'hsl(0, 0%, 70%)',
          }}
        >
          No
        </motion.button>
      </div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="mt-8 text-xs text-muted-foreground text-center uppercase tracking-wider"
      >
        Press M for Match • N for No
      </motion.p>
    </div>
  );
};
