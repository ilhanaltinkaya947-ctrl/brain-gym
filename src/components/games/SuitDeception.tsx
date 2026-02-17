import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Diamond, Club, Spade } from 'lucide-react';

interface SuitDeceptionProps {
  tier: number;
  streak: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  overclockFactor?: number;
}

const SUITS = [
  { id: 'heart', icon: Heart, color: 'red' },
  { id: 'diamond', icon: Diamond, color: 'red' },
  { id: 'club', icon: Club, color: 'black' },
  { id: 'spade', icon: Spade, color: 'black' },
] as const;

interface CardData {
  id: number;
  suit: (typeof SUITS)[number];
  isImposter: boolean;
  revealed: boolean;
  scale: number;
}

interface TierConfig {
  gridSize: number;
  gridCols: number;
  imposters: number;
  timer: number;
  sizeVariation: boolean;
}

const TIER_CONFIG: Record<number, TierConfig> = {
  1: { gridSize: 9,  gridCols: 3, imposters: 1, timer: 6,  sizeVariation: false },
  2: { gridSize: 16, gridCols: 4, imposters: 1, timer: 8,  sizeVariation: false },
  3: { gridSize: 25, gridCols: 5, imposters: 2, timer: 10, sizeVariation: false },
  4: { gridSize: 25, gridCols: 5, imposters: 3, timer: 10, sizeVariation: true },
  5: { gridSize: 36, gridCols: 6, imposters: 4, timer: 12, sizeVariation: true },
};

function getTierConfig(tier: number): TierConfig {
  return TIER_CONFIG[Math.min(Math.max(tier, 1), 5)];
}

export const SuitDeception = memo(({ tier, streak, onAnswer, playSound, triggerHaptic, overclockFactor = 1 }: SuitDeceptionProps) => {
  const config = getTierConfig(tier);
  const [cards, setCards] = useState<CardData[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [timerRunning, setTimerRunning] = useState(false);
  const timerExpiredRef = useRef(false);
  const isProcessingRef = useRef(false);
  const expiryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs for callbacks
  const onAnswerRef = useRef(onAnswer);
  const playSoundRef = useRef(playSound);
  const triggerHapticRef = useRef(triggerHaptic);
  onAnswerRef.current = onAnswer;
  playSoundRef.current = playSound;
  triggerHapticRef.current = triggerHaptic;

  const generateLevel = useCallback(() => {
    const cfg = getTierConfig(tier);

    // Reset timer state
    timerExpiredRef.current = false;
    isProcessingRef.current = false;
    if (expiryTimeoutRef.current) clearTimeout(expiryTimeoutRef.current);
    setTimerRunning(false);

    // LOGIC: Imposter must be the SAME COLOR as the main suit
    const mainSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const compatibleSuits = SUITS.filter(s => s.color === mainSuit.color && s.id !== mainSuit.id);
    const imposterSuit = compatibleSuits[Math.floor(Math.random() * compatibleSuits.length)] || SUITS.find(s => s.id !== mainSuit.id)!;

    const newCards: CardData[] = Array(cfg.gridSize).fill(null).map((_, i) => ({
      id: i,
      suit: mainSuit,
      isImposter: false,
      revealed: false,
      scale: 1,
    }));

    let placed = 0;
    while (placed < cfg.imposters) {
      const idx = Math.floor(Math.random() * cfg.gridSize);
      if (!newCards[idx].isImposter) {
        newCards[idx] = { ...newCards[idx], suit: imposterSuit, isImposter: true };
        placed++;
      }
    }

    // Size variation for T4/T5 — some imposters are slightly smaller
    if (cfg.sizeVariation) {
      const imposterCards = newCards.filter(c => c.isImposter);
      // Make half the imposters smaller (harder to spot)
      const smallCount = Math.floor(imposterCards.length / 2);
      for (let i = imposterCards.length - smallCount; i < imposterCards.length; i++) {
        const idx = newCards.indexOf(imposterCards[i]);
        newCards[idx] = { ...newCards[idx], scale: 0.85 };
      }
    }

    setCards(newCards);
    setStartTime(Date.now());
  }, [tier, streak]);

  useEffect(() => { generateLevel(); }, [generateLevel]);

  // Start CSS timer animation + expiry timeout after cards are set
  useEffect(() => {
    if (cards.length === 0) return;
    // Trigger CSS transition on next frame (needs initial width:100% to render first)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTimerRunning(true));
    });
    expiryTimeoutRef.current = setTimeout(() => {
      if (!timerExpiredRef.current && !isProcessingRef.current) {
        timerExpiredRef.current = true;
        isProcessingRef.current = true;
        playSoundRef.current('wrong');
        triggerHapticRef.current('heavy');
        onAnswerRef.current(false, 0, tier);
      }
    }, config.timer * 1000);
    return () => { if (expiryTimeoutRef.current) clearTimeout(expiryTimeoutRef.current); };
  }, [cards]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCardClick = (isImposter: boolean, id: number) => {
    if (isProcessingRef.current || timerExpiredRef.current) return;

    if (isImposter) {
      playSound('correct');
      triggerHaptic('light');
      setCards(prev => prev.map(c => c.id === id ? { ...c, revealed: true } : c));

      const remaining = cards.filter(c => c.isImposter && !c.revealed && c.id !== id).length;
      if (remaining === 0) {
        isProcessingRef.current = true;
        if (expiryTimeoutRef.current) clearTimeout(expiryTimeoutRef.current);
        const timeTaken = (Date.now() - startTime) / 1000;
        const speedBonus = Math.max(0, 1 - timeTaken / (config.timer * 0.8));
        setTimeout(() => onAnswer(true, speedBonus, tier), 200);
      }
    } else {
      isProcessingRef.current = true;
      if (expiryTimeoutRef.current) clearTimeout(expiryTimeoutRef.current);
      playSound('wrong');
      triggerHaptic('heavy');
      onAnswer(false, 0, tier);
    }
  };

  const gridColsClass = `grid-cols-${config.gridCols}`;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2">
      <style>{`
        @keyframes sd-timer-color {
          0%, 49% { background-color: hsl(140, 70%, 50%); box-shadow: 0 0 8px hsl(140, 70%, 50%, 0.25); }
          50%, 74% { background-color: hsl(40, 90%, 55%); box-shadow: 0 0 8px hsl(40, 90%, 55%, 0.25); }
          75%, 100% { background-color: hsl(0, 80%, 55%); box-shadow: 0 0 8px hsl(0, 80%, 55%, 0.4); }
        }
      `}</style>
      {/* Timer bar — pure CSS, no JS ticks */}
      <div className="w-full max-w-[340px] h-1.5 rounded-full bg-white/5 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: timerRunning ? '0%' : '100%',
            transition: timerRunning ? `width ${config.timer}s linear` : 'none',
            animation: timerRunning ? `sd-timer-color ${config.timer}s linear forwards` : 'none',
            backgroundColor: 'hsl(140, 70%, 50%)',
          }}
        />
      </div>

      <motion.div
        className={`grid ${gridColsClass} gap-2 w-full max-w-[340px] aspect-square`}
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
                className="relative flex items-center justify-center rounded-xl bg-card/40 border border-white/5 backdrop-blur-sm shadow-sm aspect-square"
              >
                <Icon
                  className={`w-1/2 h-1/2 ${colorClass}`}
                  fill={card.suit.color === 'red' ? 'currentColor' : 'currentColor'}
                  fillOpacity={0.2}
                  style={{ transform: `scale(${card.scale})` }}
                />
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
});
