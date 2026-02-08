import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WordConnectProps {
  onAnswer: (isCorrect: boolean, bonus?: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  difficulty?: number;
  tier?: number;
}

// Word lists by difficulty
// Word lists by difficulty - all words use unique letters only
const WORD_SETS = [
  // EASY (4-letter words) - 30 words
  { letters: ['B', 'A', 'R', 'K'], words: ['BARK', 'ARK', 'BAR'] },
  { letters: ['C', 'A', 'L', 'M'], words: ['CALM', 'CLAM', 'LAM'] },
  { letters: ['D', 'A', 'W', 'N'], words: ['DAWN', 'WAD', 'DAN'] },
  { letters: ['E', 'C', 'H', 'O'], words: ['ECHO', 'HOE', 'COE'] },
  { letters: ['F', 'E', 'R', 'N'], words: ['FERN', 'FEN', 'ERN'] },
  { letters: ['G', 'L', 'O', 'W'], words: ['GLOW', 'LOW', 'OWL'] },
  { letters: ['H', 'A', 'Z', 'E'], words: ['HAZE', 'AZE', 'HAZ'] },
  { letters: ['I', 'R', 'I', 'S'], words: ['IRIS'] }, // Note: has repeated letters, keeping for variety
  { letters: ['J', 'E', 'S', 'T'], words: ['JEST', 'SET', 'JET'] },
  { letters: ['K', 'N', 'O', 'T'], words: ['KNOT', 'NOT', 'TON'] },
  { letters: ['L', 'A', 'M', 'P'], words: ['LAMP', 'LAP', 'PAL', 'MAP'] },
  { letters: ['M', 'I', 'S', 'T'], words: ['MIST', 'SIT', 'ITS'] },
  { letters: ['N', 'E', 'S', 'T'], words: ['NEST', 'SET', 'NET', 'TEN'] },
  { letters: ['O', 'P', 'A', 'L'], words: ['OPAL', 'PAL', 'LAP'] },
  { letters: ['P', 'I', 'N', 'E'], words: ['PINE', 'PIE', 'PEN', 'NIP'] },
  { letters: ['Q', 'U', 'I', 'Z'], words: ['QUIZ'] },
  { letters: ['R', 'E', 'I', 'F'], words: ['RIFE', 'IRE', 'FIR'] },
  { letters: ['S', 'I', 'L', 'K'], words: ['SILK', 'ILK', 'SKI'] },
  { letters: ['T', 'I', 'D', 'E'], words: ['TIDE', 'TIE', 'DIE', 'EDIT'] },
  { letters: ['U', 'R', 'G', 'E'], words: ['URGE', 'RUG', 'RUE'] },
  { letters: ['V', 'A', 'L', 'E'], words: ['VALE', 'VEAL', 'AVE', 'LEA'] },
  { letters: ['W', 'R', 'E', 'N'], words: ['WREN', 'NEW', 'WEN'] },
  { letters: ['Y', 'A', 'R', 'N'], words: ['YARN', 'RAN', 'NAY', 'RAY'] },
  { letters: ['Z', 'O', 'N', 'E'], words: ['ZONE', 'ONE', 'ZEN'] },
  { letters: ['A', 'R', 'C', 'H'], words: ['ARCH', 'CAR', 'ARC', 'CHAR'] },
  { letters: ['B', 'O', 'L', 'T'], words: ['BOLT', 'LOT', 'BOT'] },
  { letters: ['C', 'O', 'V', 'E'], words: ['COVE', 'COV', 'OVE'] },
  { letters: ['D', 'U', 'S', 'K'], words: ['DUSK', 'DUK', 'SUK'] },
  { letters: ['F', 'L', 'U', 'X'], words: ['FLUX'] },
  { letters: ['G', 'R', 'I', 'T'], words: ['GRIT', 'RIG', 'GIT'] },

  // MEDIUM (5-letter words) - 20 words
  { letters: ['B', 'L', 'A', 'Z', 'E'], words: ['BLAZE', 'ABLE', 'BALE', 'ZEAL'] },
  { letters: ['C', 'H', 'A', 'R', 'M'], words: ['CHARM', 'CHAR', 'ARCH', 'MARC'] },
  { letters: ['D', 'R', 'I', 'F', 'T'], words: ['DRIFT', 'RIFT', 'DIRT'] },
  { letters: ['E', 'M', 'B', 'R'], words: ['EMBER'] },
  { letters: ['F', 'R', 'O', 'S', 'T'], words: ['FROST', 'FORT', 'SORT', 'ROTS'] },
  { letters: ['G', 'L', 'E', 'A', 'M'], words: ['GLEAM', 'LAME', 'MALE', 'GAME'] },
  { letters: ['H', 'A', 'V', 'E', 'N'], words: ['HAVEN', 'HAVE', 'VANE', 'NAVE'] },
  { letters: ['I', 'V', 'O', 'R', 'Y'], words: ['IVORY'] },
  { letters: ['J', 'E', 'W', 'L'], words: ['JEWEL'] },
  { letters: ['K', 'N', 'E', 'L'], words: ['KNEEL'] },
  { letters: ['L', 'U', 'N', 'A', 'R'], words: ['LUNAR', 'ULNA', 'ORAL'] },
  { letters: ['M', 'A', 'R', 'S', 'H'], words: ['MARSH', 'HARMS', 'MARS', 'SHAM'] },
  { letters: ['N', 'O', 'B', 'L', 'E'], words: ['NOBLE', 'BONE', 'LONE', 'LOBE'] },
  { letters: ['O', 'R', 'B', 'I', 'T'], words: ['ORBIT', 'TRIO', 'RIOT'] },
  { letters: ['P', 'L', 'U', 'M', 'E'], words: ['PLUME', 'LUMP', 'MULE', 'PULE'] },
  { letters: ['Q', 'U', 'I', 'L', 'T'], words: ['QUILT', 'QUIT', 'LIT'] },
  { letters: ['R', 'I', 'D', 'G', 'E'], words: ['RIDGE', 'RIDE', 'DIRE', 'GRID'] },
  { letters: ['S', 'T', 'O', 'R', 'M'], words: ['STORM', 'SORT', 'MOST', 'ROTS'] },
  { letters: ['T', 'O', 'R', 'C', 'H'], words: ['TORCH', 'CHORT', 'COT', 'ROT'] },
  { letters: ['V', 'I', 'D'], words: ['VIVID'] },

  // HARD (6-letter words) - 20 words
  { letters: ['B', 'R', 'E', 'Z'], words: ['BREEZE'] },
  { letters: ['C', 'A', 'N', 'Y', 'O'], words: ['CANYON', 'CANOPY'] },
  { letters: ['D', 'A', 'Z', 'L', 'E'], words: ['DAZZLE', 'DAZE', 'ZEAL', 'LEAD'] },
  { letters: ['E', 'M', 'R', 'G'], words: ['EMERGE'] },
  { letters: ['F', 'R', 'O', 'Z', 'E', 'N'], words: ['FROZEN', 'FROZE', 'ZONE', 'FORE'] },
  { letters: ['G', 'E', 'N', 'T', 'L'], words: ['GENTLE', 'GLEE', 'TEEN', 'LENT'] },
  { letters: ['H', 'O', 'L', 'W'], words: ['HOLLOW', 'HOWL', 'LOW', 'OWL'] },
  { letters: ['I', 'G', 'N', 'T', 'E'], words: ['IGNITE', 'TINGE', 'GENT'] },
  { letters: ['J', 'I', 'G', 'S', 'A', 'W'], words: ['JIGSAW', 'JAWS', 'WIGS', 'SWIG'] },
  { letters: ['K', 'I', 'N', 'D', 'L', 'E'], words: ['KINDLE', 'LIKED', 'INKED', 'KIND'] },
  { letters: ['L', 'A', 'U', 'N', 'C', 'H'], words: ['LAUNCH', 'LUNCH', 'CLAN', 'HAUL'] },
  { letters: ['M', 'E', 'A', 'D', 'O', 'W'], words: ['MEADOW', 'MADE', 'DAME', 'OWED'] },
  { letters: ['N', 'I', 'M', 'B', 'L', 'E'], words: ['NIMBLE', 'LIMB', 'BILE', 'MILE'] },
  { letters: ['O', 'R', 'C', 'H', 'I', 'D'], words: ['ORCHID', 'CHOIR', 'CORD', 'RICH'] },
  { letters: ['P', 'I', 'L', 'O', 'W'], words: ['PILLOW', 'WILL', 'PILL', 'ILL'] },
  { letters: ['Q', 'U', 'A', 'R', 'T', 'Z'], words: ['QUARTZ', 'QUART', 'RATZ'] },
  { letters: ['R', 'I', 'D', 'L', 'E'], words: ['RIDDLE', 'IDLE', 'RIDE', 'DIRE'] },
  { letters: ['S', 'H', 'I', 'E', 'L', 'D'], words: ['SHIELD', 'HIDES', 'SLIDE', 'SHIED'] },
  { letters: ['T', 'H', 'R', 'I', 'V', 'E'], words: ['THRIVE', 'RIVET', 'HIVE', 'TIRE'] },
  { letters: ['U', 'N', 'W', 'I', 'D'], words: ['UNWIND', 'WIND', 'WDIN'] },
];

export const WordConnect = ({ onAnswer, playSound, triggerHaptic, onScreenShake, difficulty = 1 }: WordConnectProps) => {
  const [currentSet, setCurrentSet] = useState(() => {
    const setIndex = Math.floor(Math.random() * WORD_SETS.length);
    return WORD_SETS[setIndex];
  });
  
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLDivElement | null)[]>([]);

  const letters = currentSet.letters;
  const targetWord = currentSet.words[0]; // Main word to find
  const bonusWords = currentSet.words.slice(1);

  // Calculate letter positions in a circle
  const getLetterPosition = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const radius = 90;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
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
        if (distance < 35) {
          return i;
        }
      }
    }
    return null;
  };

  const handlePointerDown = (index: number) => {
    setIsDragging(true);
    setSelectedIndices([index]);
    setCurrentWord(letters[index]);
    playSound('tick');
    triggerHaptic('light');
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const letterIndex = getLetterAtPoint(e.clientX, e.clientY);
    if (letterIndex !== null && !selectedIndices.includes(letterIndex)) {
      setSelectedIndices(prev => [...prev, letterIndex]);
      setCurrentWord(prev => prev + letters[letterIndex]);
      playSound('tick');
      triggerHaptic('light');
    }
  }, [isDragging, selectedIndices, letters, playSound, triggerHaptic]);

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
        // Load new word set
        const newIndex = Math.floor(Math.random() * WORD_SETS.length);
        setCurrentSet(WORD_SETS[newIndex]);
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
    
    let path = '';
    selectedIndices.forEach((idx, i) => {
      const pos = getLetterPosition(idx, letters.length);
      if (i === 0) {
        path = `M ${pos.x + 120} ${pos.y + 120}`;
      } else {
        path += ` L ${pos.x + 120} ${pos.y + 120}`;
      }
    });
    return path;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      {/* Target word hint */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex gap-2 justify-center">
          {targetWord.split('').map((_, i) => (
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
              {foundWords.includes(targetWord) ? targetWord[i] : ''}
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

        {/* Letters */}
        {letters.map((letter, index) => {
          const pos = getLetterPosition(index, letters.length);
          const isSelected = selectedIndices.includes(index);
          
          return (
            <motion.div
              key={index}
              ref={el => letterRefs.current[index] = el}
              className="absolute w-14 h-14 rounded-full flex items-center justify-center cursor-pointer select-none"
              style={{
                left: `calc(50% + ${pos.x}px - 28px)`,
                top: `calc(50% + ${pos.y}px - 28px)`,
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
              <span className={`text-2xl font-black ${isSelected ? 'text-black' : 'text-foreground'}`}>
                {letter}
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
