import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WordConnectProps {
  onAnswer: (isCorrect: boolean, bonus?: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  difficulty?: number;
  tier?: number;
}

// Word sets split by difficulty tier
// Tier 1-2: EASY (4-letter common words)
// Tier 3: EASY + MEDIUM (4-5 letter words)
// Tier 4+: ALL words including HARD (6-letter)

const EASY_WORDS = [
  { primary: 'BARK', bonus: ['ARK', 'BAR'] },
  { primary: 'CALM', bonus: ['CLAM', 'LAM'] },
  { primary: 'DAWN', bonus: ['WAD', 'DAN'] },
  { primary: 'ECHO', bonus: ['HOE'] },
  { primary: 'FERN', bonus: ['FEN'] },
  { primary: 'GLOW', bonus: ['LOW', 'OWL'] },
  { primary: 'HAZE', bonus: ['AZE'] },
  { primary: 'JEST', bonus: ['SET', 'JET'] },
  { primary: 'KNOT', bonus: ['NOT', 'TON'] },
  { primary: 'LAMP', bonus: ['LAP', 'PAL', 'MAP'] },
  { primary: 'MIST', bonus: ['SIT', 'ITS'] },
  { primary: 'NEST', bonus: ['SET', 'NET', 'TEN'] },
  { primary: 'OPAL', bonus: ['PAL', 'LAP'] },
  { primary: 'PINE', bonus: ['PIE', 'PEN', 'NIP'] },
  { primary: 'SILK', bonus: ['ILK', 'SKI'] },
  { primary: 'TIDE', bonus: ['TIE', 'DIE', 'EDIT'] },
  { primary: 'URGE', bonus: ['RUG', 'RUE'] },
  { primary: 'VALE', bonus: ['VEAL', 'AVE'] },
  { primary: 'WREN', bonus: ['NEW', 'WEN'] },
  { primary: 'YARN', bonus: ['RAN', 'NAY', 'RAY'] },
  { primary: 'ZONE', bonus: ['ONE', 'ZEN'] },
  { primary: 'ARCH', bonus: ['CAR', 'ARC', 'CHAR'] },
  { primary: 'BOLT', bonus: ['LOT', 'BOT'] },
  { primary: 'COVE', bonus: [] },
  { primary: 'DUSK', bonus: [] },
  { primary: 'GRIT', bonus: ['RIG', 'GIT'] },
  { primary: 'IRIS', bonus: [] },
];

const MEDIUM_WORDS = [
  { primary: 'BLAZE', bonus: ['ABLE', 'BALE', 'ZEAL'] },
  { primary: 'CHARM', bonus: ['CHAR', 'ARCH', 'MARC'] },
  { primary: 'DRIFT', bonus: ['RIFT', 'DIRT'] },
  { primary: 'EMBER', bonus: [] },
  { primary: 'FROST', bonus: ['FORT', 'SORT'] },
  { primary: 'GLEAM', bonus: ['LAME', 'MALE', 'GAME'] },
  { primary: 'HAVEN', bonus: ['HAVE', 'VANE', 'NAVE'] },
  { primary: 'LUNAR', bonus: ['ULNA'] },
  { primary: 'MARSH', bonus: ['MARS', 'SHAM'] },
  { primary: 'NOBLE', bonus: ['BONE', 'LONE', 'LOBE'] },
  { primary: 'ORBIT', bonus: ['TRIO', 'RIOT'] },
  { primary: 'PLUME', bonus: ['LUMP', 'MULE'] },
  { primary: 'RIDGE', bonus: ['RIDE', 'DIRE', 'GRID'] },
  { primary: 'STORM', bonus: ['SORT', 'MOST'] },
  { primary: 'TORCH', bonus: [] },
  { primary: 'SPEED', bonus: [] },
];

const HARD_WORDS = [
  { primary: 'CANYON', bonus: [] },
  { primary: 'FROZEN', bonus: ['FROZE', 'ZONE'] },
  { primary: 'GENTLE', bonus: ['TEEN', 'LENT'] },
  { primary: 'IGNITE', bonus: ['TINGE'] },
  { primary: 'JIGSAW', bonus: ['JAWS', 'WIGS', 'SWIG'] },
  { primary: 'KINDLE', bonus: ['KIND'] },
  { primary: 'LAUNCH', bonus: ['LUNCH', 'CLAN', 'HAUL'] },
  { primary: 'MEADOW', bonus: ['MADE', 'DAME', 'OWED'] },
  { primary: 'NIMBLE', bonus: ['LIMB', 'BILE', 'MILE'] },
  { primary: 'ORCHID', bonus: ['CHOIR', 'CORD', 'RICH'] },
  { primary: 'SHIELD', bonus: ['SLIDE'] },
  { primary: 'THRIVE', bonus: ['HIVE', 'TIRE'] },
];

// Get word pool based on difficulty tier
const getWordPool = (tier: number) => {
  if (tier <= 2) return EASY_WORDS;
  if (tier <= 3) return [...EASY_WORDS, ...MEDIUM_WORDS];
  return [...EASY_WORDS, ...MEDIUM_WORDS, ...HARD_WORDS];
};

// Interface for tracking letter instances
interface LetterInstance {
  letter: string;
  id: number; // Unique ID for each instance
}

export const WordConnect = ({ onAnswer, playSound, triggerHaptic, onScreenShake, difficulty = 1, tier = 1 }: WordConnectProps) => {
  const effectiveTier = tier || difficulty || 1;
  const wordPool = useMemo(() => getWordPool(effectiveTier), [effectiveTier]);
  const [currentSetIndex, setCurrentSetIndex] = useState(() => Math.floor(Math.random() * wordPool.length));
  const currentSet = wordPool[currentSetIndex % wordPool.length];
  
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLDivElement | null)[]>([]);

  const targetWord = currentSet.primary;
  const bonusWords = currentSet.bonus;

  // Generate letter instances from the target word (including all duplicates)
  const letterInstances: LetterInstance[] = useMemo(() => {
    return targetWord.split('').map((letter, index) => ({
      letter,
      id: index, // Each position in the word gets a unique ID
    }));
  }, [targetWord]);

  // Shuffle the letters for display (but keep the mapping)
  const shuffledLetters = useMemo(() => {
    const shuffled = [...letterInstances];
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [letterInstances]);

  // Calculate letter positions in a circle with dynamic sizing
  const getLetterPosition = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    // Reduce radius for more letters to maintain touch target spacing
    const baseRadius = 90;
    const radius = total > 6 ? Math.max(70, baseRadius - (total - 6) * 8) : baseRadius;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  // Get letter button size based on count
  const getLetterSize = (total: number) => {
    if (total <= 5) return 56; // 14 * 4 = 56px (w-14)
    if (total <= 6) return 52;
    if (total <= 7) return 48;
    return 44; // Minimum touch target size
  };

  // Check if point is inside letter circle
  const getLetterAtPoint = (clientX: number, clientY: number): number | null => {
    for (let i = 0; i < letterRefs.current.length; i++) {
      const ref = letterRefs.current[i];
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2));
        if (distance < 30) {
          return i;
        }
      }
    }
    return null;
  };

  const handlePointerDown = (index: number) => {
    setIsDragging(true);
    setSelectedIndices([index]);
    setCurrentWord(shuffledLetters[index].letter);
    playSound('tick');
    triggerHaptic('light');
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const letterIndex = getLetterAtPoint(e.clientX, e.clientY);
    if (letterIndex !== null && !selectedIndices.includes(letterIndex)) {
      setSelectedIndices(prev => [...prev, letterIndex]);
      setCurrentWord(prev => prev + shuffledLetters[letterIndex].letter);
      playSound('tick');
      triggerHaptic('light');
    }
  }, [isDragging, selectedIndices, shuffledLetters, playSound, triggerHaptic]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const word = currentWord.toUpperCase();
    
    // Check if it's the target word
    if (word === targetWord) {
      setIsCorrect(true);
      playSound('correct');
      triggerHaptic('medium');
      setFoundWords(prev => [...prev, word]);
      
      setTimeout(() => {
        onAnswer(true, word.length * 5);
        // Load new word set from tier-appropriate pool
        const newIndex = Math.floor(Math.random() * wordPool.length);
        setCurrentSetIndex(newIndex);
        setFoundWords([]);
        setIsCorrect(null);
      }, 600);
    }
    // Check if it's a bonus word
    else if (bonusWords.includes(word) && !foundWords.includes(word)) {
      setIsCorrect(true);
      playSound('correct');
      triggerHaptic('light');
      setFoundWords(prev => [...prev, word]);
      // Don't end the round, just acknowledge bonus word
      setTimeout(() => setIsCorrect(null), 400);
    }
    // Wrong word
    else if (word.length >= 3) {
      setIsCorrect(false);
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();
      setTimeout(() => setIsCorrect(null), 400);
    }

    setSelectedIndices([]);
    setCurrentWord('');
  }, [isDragging, currentWord, targetWord, bonusWords, foundWords, onAnswer, playSound, triggerHaptic, onScreenShake]);

  // Draw connecting lines
  const getLinePath = () => {
    if (selectedIndices.length < 2) return '';
    
    const total = shuffledLetters.length;
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

  const letterSize = getLetterSize(shuffledLetters.length);
  const halfSize = letterSize / 2;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      {/* Target word hint - empty slots matching word length exactly */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex gap-2 justify-center">
          {targetWord.split('').map((char, i) => (
            <motion.div
              key={i}
              className="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl font-bold"
              style={{
                borderColor: foundWords.includes(targetWord) 
                  ? 'hsl(140 70% 50%)' 
                  : 'hsl(0 0% 25%)',
                backgroundColor: foundWords.includes(targetWord) 
                  ? 'hsl(140 70% 50% / 0.2)' 
                  : 'hsl(0 0% 8%)',
              }}
            >
              {foundWords.includes(targetWord) ? char : ''}
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2 uppercase tracking-wider">
          Find the {targetWord.length}-letter word
        </p>
      </motion.div>

      {/* Current word display */}
      <motion.div
        className="h-12 mb-6 flex items-center justify-center"
        animate={isCorrect === false ? { x: [-5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {currentWord && (
            <motion.span
              key={currentWord}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`text-3xl font-black tracking-wider ${
                isCorrect === true ? 'text-green-500' : 
                isCorrect === false ? 'text-red-500' : 
                'text-foreground'
              }`}
            >
              {currentWord}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Letter wheel */}
      <div 
        ref={containerRef}
        className="relative w-60 h-60 touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.path
            d={getLinePath()}
            fill="none"
            stroke="hsl(25 90% 55%)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            style={{ filter: 'drop-shadow(0 0 8px hsl(25 90% 55% / 0.5))' }}
          />
        </svg>

        {/* Center circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-24 h-24 rounded-full border-2 border-border/30 bg-muted/20"
            animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
          />
        </div>

        {/* Letters - each instance is unique and selectable independently */}
        {shuffledLetters.map((letterInstance, index) => {
          const pos = getLetterPosition(index, shuffledLetters.length);
          const isSelected = selectedIndices.includes(index);
          
          return (
            <motion.div
              key={`${letterInstance.letter}-${letterInstance.id}`}
              ref={el => letterRefs.current[index] = el}
              className="absolute rounded-full flex items-center justify-center cursor-pointer select-none"
              style={{
                width: letterSize,
                height: letterSize,
                left: `calc(50% + ${pos.x}px - ${halfSize}px)`,
                top: `calc(50% + ${pos.y}px - ${halfSize}px)`,
                background: isSelected 
                  ? 'linear-gradient(135deg, hsl(25 90% 55%), hsl(45 90% 55%))'
                  : 'hsl(0 0% 12%)',
                border: isSelected ? 'none' : '2px solid hsl(0 0% 20%)',
                boxShadow: isSelected ? '0 0 20px hsl(25 90% 55% / 0.5)' : 'none',
              }}
              animate={isSelected ? { scale: 1.15 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onPointerDown={() => handlePointerDown(index)}
            >
              <span 
                className={`font-black ${isSelected ? 'text-black' : 'text-foreground'}`}
                style={{ fontSize: letterSize > 48 ? '1.5rem' : '1.25rem' }}
              >
                {letterInstance.letter}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Bonus words found */}
      {foundWords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-wrap gap-2 justify-center max-w-xs"
        >
          {foundWords.filter(w => w !== targetWord).map((word, i) => (
            <span 
              key={i}
              className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500 border border-green-500/30"
            >
              +{word}
            </span>
          ))}
        </motion.div>
      )}

      {/* Instructions */}
      <p className="text-xs text-muted-foreground mt-6 text-center">
        Drag through letters to form words
      </p>
    </div>
  );
};
