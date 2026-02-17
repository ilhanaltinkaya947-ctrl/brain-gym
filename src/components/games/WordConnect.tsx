import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { findWordsFromLetters } from '@/data/wordList';
import confetti from 'canvas-confetti';

interface WordConnectProps {
  onAnswer: (isCorrect: boolean, bonus?: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  difficulty?: number;
  tier?: number;
  overclockFactor?: number;
}

// Tier config — scales letter count; any real 3+ letter word accepted at all tiers
const getTierConfig = (tier: number) => {
  switch (tier) {
    case 1: return { letterCount: 6, timer: 15, minWordLen: 3, timeBonus: 2 };
    case 2: return { letterCount: 7, timer: 14, minWordLen: 3, timeBonus: 2 };
    case 3: return { letterCount: 8, timer: 16, minWordLen: 3, timeBonus: 1.5 };
    case 4: return { letterCount: 9, timer: 16, minWordLen: 3, timeBonus: 1 };
    case 5: return { letterCount: 10, timer: 18, minWordLen: 3, timeBonus: 1 };
    default: return { letterCount: 6, timer: 15, minWordLen: 3, timeBonus: 2 };
  }
};

// Scoring by word length — longer words reward more
const wordScore = (word: string): number => {
  switch (word.length) {
    case 3: return 5;
    case 4: return 10;
    case 5: return 20;
    case 6: return 35;
    case 7: return 50;
    default: return word.length * 8;
  }
};

// Vowels and consonants for pool generation
const VOWELS = 'AEIOU';
const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXYZ';

// Generate a letter pool guaranteed to have enough valid words at the required min length
const generateLetterPool = (tier: number): string[] => {
  const config = getTierConfig(tier);
  const { letterCount, minWordLen } = config;

  // Try up to 30 times to find a good pool
  for (let attempt = 0; attempt < 30; attempt++) {
    const letters: string[] = [];

    // Vowel/consonant ratio scales with letter count
    const vowelCount = Math.max(2, Math.floor(letterCount * 0.35));
    const consonantCount = letterCount - vowelCount;

    // Pick random vowels (allow duplicates of common ones)
    for (let i = 0; i < vowelCount; i++) {
      letters.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
    }

    // Pick random consonants (prefer common ones)
    const commonConsonants = 'RSTLNBCDGMPHF';
    for (let i = 0; i < consonantCount; i++) {
      const source = Math.random() < 0.7 ? commonConsonants : CONSONANTS;
      letters.push(source[Math.floor(Math.random() * source.length)]);
    }

    // Check if at least 5 words of minWordLen+ can be formed
    const validWords = findWordsFromLetters(letters).filter(w => w.length >= minWordLen);
    if (validWords.length >= 5) {
      // Shuffle the letters
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      return letters;
    }
  }

  // Fallback: use known-good sets scaled by tier
  const fallbacksBySize: Record<number, string[][]> = {
    6: ['STREAM','PLANET','GARDEN','MASTER','FRIEND','CASTLE','SILVER','SIMPLE','MARKET'].map(w => w.split('')),
    7: ['SHELTER','BLASTER','CHAPTER','PLASTER','MONSTER','CLUSTER','WESTERN'].map(w => w.split('')),
    8: ['CHAPTERS','MONSTERS','PLANTERS','BLASTERS','SHELTERS','STRAINED'].map(w => w.split('')),
    9: ['NIGHTFALL','MOUNTAINS','GARDENING','STREAMING','PLATFORMS'].map(w => w.split('')),
    10: ['TRAMPOLINE','AFTERGLOW','BIRTHSTONE','BACKGROUND','FLASHPOINT'].map(w => w.split('')),
  };
  const options = fallbacksBySize[letterCount] || fallbacksBySize[6]!;
  const pool = [...options[Math.floor(Math.random() * options.length)]];
  // Pad if needed
  while (pool.length < letterCount) {
    pool.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
  }
  return pool.slice(0, letterCount);
};

// Timer bar color gradient based on time remaining
const getTimerGradient = (timeLeft: number, totalTime: number): string => {
  const ratio = timeLeft / totalTime;
  if (ratio > 0.6) {
    return 'linear-gradient(90deg, hsl(210, 80%, 55%), hsl(230, 70%, 55%))';
  } else if (ratio > 0.3) {
    return 'linear-gradient(90deg, hsl(30, 90%, 55%), hsl(25, 85%, 50%))';
  } else {
    return 'linear-gradient(90deg, hsl(0, 80%, 55%), hsl(10, 90%, 45%))';
  }
};

// Fire confetti burst scaled by word index
const fireConfetti = (wordIndex: number) => {
  if (wordIndex === 0) {
    confetti({
      particleCount: 20,
      spread: 40,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#00FF00', '#32CD32', '#7CFC00'],
      scalar: 0.7,
    });
  } else if (wordIndex === 1) {
    confetti({
      particleCount: 40,
      spread: 55,
      origin: { x: 0.5, y: 0.45 },
      colors: ['#00FF00', '#32CD32', '#7CFC00', '#FFD700'],
      scalar: 0.8,
    });
  } else {
    confetti({
      particleCount: 40,
      spread: 80,
      origin: { x: 0.5, y: 0.4 },
      colors: ['#00FF00', '#32CD32', '#7CFC00', '#FFD700', '#FF6B6B'],
      scalar: 0.9,
    });
  }
};

export const WordConnect = ({ onAnswer, playSound, triggerHaptic, onScreenShake, difficulty = 1, tier = 1, overclockFactor = 1 }: WordConnectProps) => {
  const effectiveTier = Math.min(5, (tier || difficulty || 1) + (overclockFactor > 1.2 ? 1 : 0));
  const config = getTierConfig(effectiveTier);

  const [letterPool, setLetterPool] = useState<string[]>(() => generateLetterPool(effectiveTier));
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'duplicate' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(config.timer);
  const [roundKey, setRoundKey] = useState(0);
  const [floatingScore, setFloatingScore] = useState<{ score: number; key: number } | null>(null);
  const [timeBonusKey, setTimeBonusKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const floatingKeyRef = useRef(0);
  const screenShakeFiredRef = useRef(false);
  const roundEndingRef = useRef(false);
  const foundWordsRef = useRef<string[]>([]);
  // Refs for stable timer closure
  const onAnswerRef = useRef(onAnswer);
  const playSoundRef = useRef(playSound);
  const triggerHapticRef = useRef(triggerHaptic);
  const onScreenShakeRef = useRef(onScreenShake);
  // nextRoundRef removed — timer expiry = game over, no round reset
  const effectiveTierRef = useRef(effectiveTier);
  onAnswerRef.current = onAnswer;
  playSoundRef.current = playSound;
  triggerHapticRef.current = triggerHaptic;
  onScreenShakeRef.current = onScreenShake;
  effectiveTierRef.current = effectiveTier;

  // All valid words for current pool (filtered by min word length for current tier)
  const allValidWords = useMemo(() => findWordsFromLetters(letterPool).filter(w => w.length >= config.minWordLen), [letterPool, config.minWordLen]);

  // End round with success: score found words and reset
  const endRound = useCallback(() => {
    // roundEndingRef is already set true by handlePointerUp before this fires
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const totalBonus = foundWordsRef.current.reduce((sum, w) => sum + wordScore(w), 0);
    onAnswer(true, totalBonus, effectiveTier);
    // Reset for next round
    const newPool = generateLetterPool(effectiveTier);
    setLetterPool(newPool);
    setFoundWords([]);
    foundWordsRef.current = [];
    setSelectedIndices([]);
    setCurrentWord('');
    setFeedback(null);
    setFloatingScore(null);
    screenShakeFiredRef.current = false;
    roundEndingRef.current = false;
    setRoundKey(prev => prev + 1);
  }, [effectiveTier, onAnswer]);

  // nextRound removed — single unified timer, no round resets

  // Timer — single unified countdown. Starts once on mount, +2s per word, game over at 0.
  // Side effects via flag refs (never inside setState updater).
  const timerExpiredFlag = useRef(false);
  const tickSoundFlag = useRef(false);
  const shakeFlag = useRef(false);

  useEffect(() => {
    setTimeLeft(config.timer);
    screenShakeFiredRef.current = false;
    timerExpiredFlag.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (roundEndingRef.current) return prev;
        if (prev <= 1) {
          timerExpiredFlag.current = true;
          return 0;
        }
        if (prev <= 3 && !screenShakeFiredRef.current) {
          shakeFlag.current = true;
          screenShakeFiredRef.current = true;
        }
        if (prev <= 3) {
          tickSoundFlag.current = true;
        }
        return prev - 1;
      });

      // Side effects outside setState
      if (shakeFlag.current) {
        shakeFlag.current = false;
        onScreenShakeRef.current();
      }
      if (tickSoundFlag.current) {
        tickSoundFlag.current = false;
        playSoundRef.current('tick');
      }
      if (timerExpiredFlag.current) {
        timerExpiredFlag.current = false;
        // Clear interval — game over, no round reset
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        onAnswerRef.current(false, 0, effectiveTierRef.current);
        playSoundRef.current('wrong');
        triggerHapticRef.current('heavy');
        onScreenShakeRef.current();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config.timer]);

  // Circle layout positions — scales radius for more letters
  const getLetterPosition = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const baseRadius = 90;
    const radius = total <= 6 ? baseRadius : total <= 8 ? 85 : 80;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const getLetterSize = (total: number) => {
    if (total <= 5) return 56;
    if (total <= 6) return 52;
    if (total <= 7) return 46;
    if (total <= 8) return 42;
    if (total <= 9) return 38;
    return 34;
  };

  const getLetterAtPoint = (clientX: number, clientY: number): number | null => {
    const hitRadius = letterPool.length <= 7 ? 30 : letterPool.length <= 9 ? 24 : 20;
    for (let i = 0; i < letterRefs.current.length; i++) {
      const ref = letterRefs.current[i];
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2));
        if (distance < hitRadius) {
          return i;
        }
      }
    }
    return null;
  };

  const handlePointerDown = (index: number) => {
    setIsDragging(true);
    setSelectedIndices([index]);
    setCurrentWord(letterPool[index]);
    playSound('tick');
    triggerHaptic('light');
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    const letterIndex = getLetterAtPoint(e.clientX, e.clientY);
    if (letterIndex !== null && !selectedIndices.includes(letterIndex)) {
      setSelectedIndices(prev => [...prev, letterIndex]);
      setCurrentWord(prev => prev + letterPool[letterIndex]);
      playSound('tick');
      triggerHaptic('light');
    }
  }, [isDragging, selectedIndices, letterPool, playSound, triggerHaptic]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const word = currentWord.toUpperCase();

    if (word.length < config.minWordLen) {
      setSelectedIndices([]);
      setCurrentWord('');
      return;
    }

    // Check if already found
    if (foundWords.includes(word)) {
      setFeedback('duplicate');
      triggerHaptic('light');
      setTimeout(() => setFeedback(null), 400);
      setSelectedIndices([]);
      setCurrentWord('');
      return;
    }

    // Check if valid word
    if (allValidWords.includes(word)) {
      setFeedback('correct');
      playSound('correct');
      triggerHaptic('medium');
      const newFound = [...foundWords, word];
      setFoundWords(newFound);
      foundWordsRef.current = newFound;

      // Add time reward — +2s per word, capped at 30s max
      setTimeLeft(prev => Math.min(30, prev + config.timeBonus));
      setTimeBonusKey(k => k + 1);

      // Floating score
      const score = wordScore(word);
      floatingKeyRef.current += 1;
      setFloatingScore({ score, key: floatingKeyRef.current });

      // Fire confetti based on word index
      fireConfetti(newFound.length - 1);

      // Check if 3 words found → round complete
      if (newFound.length >= 3) {
        // Immediately flag round as ending to prevent timer from firing
        roundEndingRef.current = true;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTimeout(() => endRound(), 300);
      } else {
        setTimeout(() => setFeedback(null), 400);
      }
    } else {
      // Invalid word
      setFeedback('wrong');
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
      setTimeout(() => setFeedback(null), 400);
    }

    setSelectedIndices([]);
    setCurrentWord('');
  }, [isDragging, currentWord, foundWords, allValidWords, effectiveTier, onAnswer, playSound, triggerHaptic, onScreenShake, endRound]);

  // SVG connection lines
  const getLinePath = () => {
    if (selectedIndices.length < 2) return '';
    const total = letterPool.length;
    let path = '';
    selectedIndices.forEach((idx, i) => {
      const pos = getLetterPosition(idx, total);
      if (i === 0) {
        path = `M ${pos.x + 120} ${pos.y + 120}`;
      } else {
        path += ` L ${pos.x + 120} ${pos.y + 120}`;
      }
    });
    return path;
  };

  const letterSize = getLetterSize(letterPool.length);
  const halfSize = letterSize / 2;

  const timerIsCritical = timeLeft <= 5;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <style>{`
        @keyframes slot-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .animate-slot-pulse { animation: slot-pulse 2s ease-in-out infinite; }
        @keyframes wc-word-pop {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        .wc-word-pop { animation: wc-word-pop 0.2s ease-out forwards; }
        @keyframes wc-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .wc-fade-in { animation: wc-fade-in 0.3s ease forwards; }
        @keyframes wc-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .wc-shake { animation: wc-shake 0.3s ease; }
        @keyframes wc-timer-critical {
          0%, 100% { box-shadow: 0 0 4px hsl(0, 80%, 55% / 0.6); }
          50% { box-shadow: 0 0 12px hsl(0, 80%, 55% / 0.9); }
        }
        .wc-timer-critical { animation: wc-timer-critical 0.6s ease-in-out infinite; }
        @keyframes wc-time-bonus {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        .wc-time-bonus { animation: wc-time-bonus 0.8s ease-out forwards; }
        @keyframes wc-timer-flash {
          0% { box-shadow: 0 0 8px hsl(140 70% 50% / 0.8); }
          100% { box-shadow: none; }
        }
        .wc-timer-flash { animation: wc-timer-flash 0.5s ease-out; }
      `}</style>
      {/* Word slots -- 3 slots to fill */}
      <div className="mb-4 wc-fade-in">
        <div className="flex gap-3 justify-center">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="min-w-[64px] h-9 px-3 rounded-xl flex items-center justify-center text-sm font-bold overflow-hidden"
              style={{
                borderWidth: foundWords[i] ? '1.5px' : '1px',
                borderStyle: 'solid',
                borderColor: foundWords[i]
                  ? 'hsl(140 70% 50% / 0.6)'
                  : 'hsl(0 0% 20%)',
                backgroundColor: foundWords[i]
                  ? 'hsl(140 70% 50% / 0.12)'
                  : 'hsl(0 0% 7%)',
                boxShadow: foundWords[i]
                  ? '0 0 16px hsl(140 70% 50% / 0.3), 0 0 4px hsl(140 70% 50% / 0.2) inset'
                  : '0 1px 4px hsl(0 0% 0% / 0.3)',
                transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {foundWords[i] ? (
                <span
                  key={`word-${i}-${foundWords[i]}`}
                  className="text-green-500 font-mono tracking-wider wc-word-pop"
                >
                  {foundWords[i]}
                </span>
              ) : (
                <div
                  key={`empty-${i}`}
                  className="w-full h-full rounded-md animate-slot-pulse"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, hsl(0 0% 25% / 0.3) 50%, transparent 100%)',
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="h-6 mt-2 flex items-center justify-center">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-wider wc-fade-in">
            Find 3 real words
          </p>
        </div>
      </div>

      {/* Timer */}
      <div className="relative mb-4">
        <div
          key={timeBonusKey > 0 ? `timer-${timeBonusKey}` : 'timer-init'}
          className={`w-32 h-1.5 rounded-full overflow-hidden ${timerIsCritical ? 'wc-timer-critical' : ''} ${timeBonusKey > 0 ? 'wc-timer-flash' : ''}`}
          style={{ backgroundColor: 'hsl(0 0% 15%)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, (timeLeft / config.timer) * 100)}%`,
              background: getTimerGradient(timeLeft, config.timer),
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        {timeBonusKey > 0 && (
          <span
            key={`bonus-${timeBonusKey}`}
            className="absolute -right-10 top-1/2 -translate-y-1/2 text-green-400 text-xs font-bold wc-time-bonus"
          >
            +{config.timeBonus}s
          </span>
        )}
      </div>

      {/* Current word display during drag -- shown larger above wheel */}
      <div
        className={`h-14 mb-2 flex items-center justify-center relative ${feedback === 'wrong' ? 'wc-shake' : ''}`}
      >
        {/* Floating score animation */}
        <AnimatePresence>
          {floatingScore && (
            <motion.div
              key={floatingScore.key}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -40, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute top-0 left-1/2 -translate-x-1/2 text-green-400 font-black text-xl pointer-events-none"
              style={{ textShadow: '0 0 10px hsl(140 70% 50% / 0.6)' }}
              onAnimationComplete={() => setFloatingScore(null)}
            >
              +{floatingScore.score}
            </motion.div>
          )}
        </AnimatePresence>

        {currentWord && (
          <span
            key={currentWord}
            className={`text-2xl font-black tracking-[0.15em] wc-word-pop ${
              feedback === 'correct' ? 'text-green-500' :
              feedback === 'wrong' ? 'text-red-500' :
              feedback === 'duplicate' ? 'text-yellow-500' :
              'text-foreground'
            }`}
            style={{
              textShadow: feedback === 'correct'
                ? '0 0 16px hsl(140 70% 50% / 0.5)'
                : feedback === 'wrong'
                  ? '0 0 16px hsl(0 70% 50% / 0.5)'
                  : isDragging
                    ? '0 0 12px hsl(210 80% 55% / 0.35)'
                    : 'none',
              transition: 'color 0.15s ease, text-shadow 0.15s ease',
            }}
          >
            {currentWord}
          </span>
        )}
        {!currentWord && feedback === 'correct' && foundWords.length > 0 && (
          <span className="text-lg font-bold text-green-500 wc-word-pop">
            +{wordScore(foundWords[foundWords.length - 1])}pts
          </span>
        )}
      </div>

      {/* Letter wheel */}
      <div
        ref={containerRef}
        className="relative w-60 h-60 touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* SVG connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 6px hsl(210 80% 55% / 0.5))' }}>
          <path
            d={getLinePath()}
            fill="none"
            stroke="hsl(210 80% 55%)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Center circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-24 h-24 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(210 60% 15% / 0.4) 0%, transparent 70%)',
              border: '1px solid hsl(210 40% 30% / 0.2)',
            }}
            animate={isDragging ? { scale: 1.08, borderColor: 'hsl(210 80% 55% / 0.4)' } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        </div>

        {/* Letters */}
        {letterPool.map((letter, index) => {
          const pos = getLetterPosition(index, letterPool.length);
          const isSelected = selectedIndices.includes(index);

          return (
            <div
              key={`${letter}-${index}-${roundKey}`}
              ref={el => letterRefs.current[index] = el}
              className="absolute rounded-full flex items-center justify-center cursor-pointer select-none"
              style={{
                width: letterSize,
                height: letterSize,
                left: `calc(50% + ${pos.x}px - ${halfSize}px)`,
                top: `calc(50% + ${pos.y}px - ${halfSize}px)`,
                background: isSelected
                  ? 'linear-gradient(135deg, hsl(210 80% 55%), hsl(230 70% 55%))'
                  : 'radial-gradient(circle at 50% 40%, hsl(0 0% 20%), hsl(0 0% 11%))',
                border: isSelected ? 'none' : '1.5px solid hsl(0 0% 25%)',
                boxShadow: isSelected
                  ? '0 0 24px hsl(210 80% 55% / 0.6), 0 0 6px hsl(210 80% 55% / 0.3) inset'
                  : '0 2px 8px hsl(0 0% 0% / 0.4), 0 0 1px hsl(0 0% 30% / 0.3) inset',
                transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.1s ease, background 0.1s ease, box-shadow 0.1s ease',
              }}
              onPointerDown={() => handlePointerDown(index)}
            >
              <span
                className={`font-black ${isSelected ? 'text-black' : 'text-foreground'}`}
                style={{
                  fontSize: letterSize > 48 ? '1.5rem' : letterSize > 40 ? '1.25rem' : '1rem',
                }}
              >
                {letter}
              </span>
            </div>
          );
        })}
      </div>

      {/* Found words display */}
      {foundWords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex flex-wrap gap-2 justify-center max-w-xs"
        >
          {foundWords.map((word, i) => (
            <motion.span
              key={`found-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.05 }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500 border border-green-500/30"
            >
              {word} +{wordScore(word)}
            </motion.span>
          ))}
        </motion.div>
      )}

      {/* Instructions */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Drag through letters to form words
      </p>
    </div>
  );
};
