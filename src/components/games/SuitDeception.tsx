import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Diamond, Club, Spade } from 'lucide-react';

interface SuitDeceptionProps {
  tier: number;
  streak: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

const SUITS = [
  { id: 'heart', icon: Heart, color: 'red' },
  { id: 'diamond', icon: Diamond, color: 'red' },
  { id: 'club', icon: Club, color: 'black' },
  { id: 'spade', icon: Spade, color: 'black' },
];

export const SuitDeception = ({ tier, streak, onAnswer, playSound, triggerHaptic }: SuitDeceptionProps) => {
  const [cards, setCards] = useState<any[]>([]);
  const [gridClass, setGridClass] = useState('grid-cols-3');
  const [startTime, setStartTime] = useState(Date.now());

  const generateLevel = useCallback(() => {
    let gridSize = 9; // Tier 1
    let newGridClass = 'grid-cols-3';
    let impostersCount = 1;

    if (tier === 2) {
      gridSize = 16;
      newGridClass = 'grid-cols-4';
    } else if (tier >= 3) {
      gridSize = 25;
      newGridClass = 'grid-cols-5';
      impostersCount = tier >= 4 ? 3 : 2;
    }

    setGridClass(newGridClass);

    // LOGIC: Imposter must be the SAME COLOR as the main suit
    const mainSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const compatibleSuits = SUITS.filter(s => s.color === mainSuit.color && s.id !== mainSuit.id);
    const imposterSuit = compatibleSuits[Math.floor(Math.random() * compatibleSuits.length)] || SUITS.find(s => s.id !== mainSuit.id);

    const newCards = Array(gridSize).fill(null).map((_, i) => ({
      id: i,
      suit: mainSuit,
      isImposter: false,
      revealed: false
    }));

    let placed = 0;
    while (placed < impostersCount) {
      const idx = Math.floor(Math.random() * gridSize);
      if (!newCards[idx].isImposter) {
        newCards[idx] = { ...newCards[idx], suit: imposterSuit, isImposter: true };
        placed++;
      }
    }

    setCards(newCards);
    setStartTime(Date.now());
  }, [tier, streak]);

  useEffect(() => { generateLevel(); }, [generateLevel]);

  const handleCardClick = (isImposter: boolean, id: number) => {
    if (isImposter) {
      playSound('correct');
      triggerHaptic('light');
      setCards(prev => prev.map(c => c.id === id ? { ...c, revealed: true } : c));
      
      const remaining = cards.filter(c => c.isImposter && !c.revealed && c.id !== id).length;
      if (remaining === 0) {
        const timeTaken = (Date.now() - startTime) / 1000;
        const speedBonus = Math.max(0, 1 - timeTaken / 4);
        setTimeout(() => onAnswer(true, speedBonus, tier), 200);
      }
    } else {
      playSound('wrong');
      triggerHaptic('heavy');
      onAnswer(false, 0, tier);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2">
      <motion.div 
        className={`grid ${gridClass} gap-2 w-full max-w-[340px] aspect-square`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <AnimatePresence>
          {cards.map((card) => {
            const Icon = card.suit.icon;
            const colorClass = card.suit.color === 'red' ? 'text-red-500' : 'text-foreground';
            return (
              <motion.button
                key={card.id}
                initial={{ scale: 1 }}
                animate={{ scale: card.revealed ? 0 : 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleCardClick(card.isImposter, card.id)}
                className={`relative flex items-center justify-center rounded-xl bg-card/40 border border-white/5 backdrop-blur-sm shadow-sm aspect-square`}
              >
                <Icon className={`w-1/2 h-1/2 ${colorClass}`} fill={card.suit.color === 'red' ? 'currentColor' : 'currentColor'} fillOpacity={0.2} />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>
      <div className="mt-6 text-xs text-muted-foreground font-mono uppercase tracking-widest text-center opacity-60">
        Find the Odd Shape
      </div>
    </div>
  );
};
