import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

interface PatternHunterProps {
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  onScreenShake: () => void;
  tier?: number;
  overclockFactor?: number;
}

// ─── Emoji Pair System ───────────────────────────────────────
// iOS emojis with graduated difficulty:
// T1: completely different emojis
// T2: directional variants + mirrored animals
// T3: same emoji, subtly mirrored (CSS scaleX(-1))

interface EmojiDef {
  emoji: string;
  mirrored: boolean;
}

const e = (emoji: string, mirrored = false): EmojiDef => ({ emoji, mirrored });

const EMOJI_PAIRS: Record<number, { base: EmojiDef; odd: EmojiDef }[]> = {
  // Tier 1 — different emoji entirely (easy)
  1: [
    { base: e('🧠'), odd: e('💡') },
    { base: e('🎯'), odd: e('🏆') },
    { base: e('⚡'), odd: e('🔥') },
    { base: e('🌙'), odd: e('☀️') },
    { base: e('💎'), odd: e('🪙') },
    { base: e('🔮'), odd: e('🧿') },
    { base: e('🦊'), odd: e('🐺') },
    { base: e('🎲'), odd: e('🎮') },
    { base: e('🐙'), odd: e('🦑') },
    { base: e('🍎'), odd: e('🍊') },
  ],
  // Tier 2 — directional pairs + noticeable mirrors
  2: [
    { base: e('👈'), odd: e('👉') },
    { base: e('🌗'), odd: e('🌓') },
    { base: e('◀️'), odd: e('▶️') },
    { base: e('👆'), odd: e('👇') },
    { base: e('🐕'), odd: e('🐕', true) },
    { base: e('🏃'), odd: e('🏃', true) },
    { base: e('↩️'), odd: e('↪️') },
    { base: e('🐈'), odd: e('🐈', true) },
    { base: e('🦅'), odd: e('🦅', true) },
    { base: e('🔵'), odd: e('🟣') },
  ],
  // Tier 3 — subtle mirrors (same emoji, flipped)
  3: [
    { base: e('🧠'), odd: e('🧠', true) },
    { base: e('🐠'), odd: e('🐠', true) },
    { base: e('👂'), odd: e('👂', true) },
    { base: e('🦶'), odd: e('🦶', true) },
    { base: e('💪'), odd: e('💪', true) },
    { base: e('🦜'), odd: e('🦜', true) },
    { base: e('🐬'), odd: e('🐬', true) },
    { base: e('🔑'), odd: e('🔑', true) },
    { base: e('🐊'), odd: e('🐊', true) },
    { base: e('🦈'), odd: e('🦈', true) },
  ],
};

// ─── Tier Configuration ──────────────────────────────────────

interface TierConfig {
  gridSize: number;
  cols: number;
  oddCount: number;
  timer: number;
  difficultyLevel: number;
  cellPulse: boolean;
  cellShuffle: boolean;
  shuffleInterval: number;
}

const getTierConfig = (tier: number, overclockFactor: number = 1): TierConfig => {
  switch (tier) {
    case 1:
      return { gridSize: 16, cols: 4, oddCount: 1, timer: 6, difficultyLevel: 1, cellPulse: false, cellShuffle: false, shuffleInterval: 0 };
    case 2:
      return { gridSize: 25, cols: 5, oddCount: 2, timer: 8, difficultyLevel: 2, cellPulse: false, cellShuffle: false, shuffleInterval: 0 };
    case 3:
      return { gridSize: 25, cols: 5, oddCount: 2, timer: 8, difficultyLevel: 3, cellPulse: false, cellShuffle: false, shuffleInterval: 0 };
    case 4:
      return { gridSize: 36, cols: 6, oddCount: 3, timer: 10, difficultyLevel: 3, cellPulse: true, cellShuffle: true, shuffleInterval: 2500 };
    case 5:
      return { gridSize: 36, cols: 6, oddCount: 4, timer: 10, difficultyLevel: 3, cellPulse: true, cellShuffle: true, shuffleInterval: 1000 };
    default:
      return { gridSize: 16, cols: 4, oddCount: 1, timer: 6, difficultyLevel: 1, cellPulse: false, cellShuffle: false, shuffleInterval: 0 };
  }
};

// ─── Game Data ───────────────────────────────────────────────

interface CellData {
  emojiDef: EmojiDef;
  isOdd: boolean;
  id: number;
}

interface Question {
  grid: CellData[];
  oddIndices: number[];
  cols: number;
}

const generateQuestion = (tier: number, overclockFactor: number = 1): Question => {
  const config = getTierConfig(tier, overclockFactor);
  const { gridSize, cols, oddCount, difficultyLevel } = config;

  const pairs = EMOJI_PAIRS[difficultyLevel] || EMOJI_PAIRS[1];
  const pair = pairs[Math.floor(Math.random() * pairs.length)];

  // 50/50 swap so either member can be the majority
  const swap = Math.random() > 0.5;
  const baseDef = swap ? pair.odd : pair.base;
  const oddDef = swap ? pair.base : pair.odd;

  const oddIndices: number[] = [];
  while (oddIndices.length < oddCount) {
    const idx = Math.floor(Math.random() * gridSize);
    if (!oddIndices.includes(idx)) oddIndices.push(idx);
  }

  const grid: CellData[] = Array(gridSize).fill(null).map((_, i) => ({
    emojiDef: oddIndices.includes(i) ? oddDef : baseDef,
    isOdd: oddIndices.includes(i),
    id: i,
  }));

  return { grid, oddIndices, cols };
};

// ─── Component ───────────────────────────────────────────────

export const PatternHunter = ({
  onAnswer,
  playSound,
  triggerHaptic,
  onScreenShake,
  tier = 1,
  overclockFactor = 1,
}: PatternHunterProps) => {
  const config = getTierConfig(tier, overclockFactor);
  const [question, setQuestion] = useState<Question>(() => generateQuestion(tier, overclockFactor));
  const [questionKey, setQuestionKey] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [foundOdds, setFoundOdds] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(config.timer * 1000);
  const [liveGrid, setLiveGrid] = useState<CellData[]>(question.grid);
  const questionStartTime = useRef(Date.now());
  const isProcessing = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shuffleRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for callbacks to avoid stale closures in timer
  const onAnswerRef = useRef(onAnswer);
  const playSoundRef = useRef(playSound);
  const triggerHapticRef = useRef(triggerHaptic);
  const onScreenShakeRef = useRef(onScreenShake);
  const tierRef = useRef(tier);
  useEffect(() => { onAnswerRef.current = onAnswer; }, [onAnswer]);
  useEffect(() => { playSoundRef.current = playSound; }, [playSound]);
  useEffect(() => { triggerHapticRef.current = triggerHaptic; }, [triggerHaptic]);
  useEffect(() => { onScreenShakeRef.current = onScreenShake; }, [onScreenShake]);
  useEffect(() => { tierRef.current = tier; }, [tier]);

  // Sync liveGrid when question changes
  useEffect(() => {
    setLiveGrid(question.grid);
  }, [question]);

  // Cell shuffle for tier 5 — swap 2-3 random pairs every 1.5s
  useEffect(() => {
    if (!config.cellShuffle) {
      if (shuffleRef.current) {
        clearInterval(shuffleRef.current);
        shuffleRef.current = null;
      }
      return;
    }

    shuffleRef.current = setInterval(() => {
      setLiveGrid(prev => {
        const next = [...prev];
        const pairCount = 2 + Math.floor(Math.random() * 2);
        for (let p = 0; p < pairCount; p++) {
          const a = Math.floor(Math.random() * next.length);
          let b = Math.floor(Math.random() * next.length);
          while (b === a) b = Math.floor(Math.random() * next.length);
          const temp = next[a];
          next[a] = next[b];
          next[b] = temp;
        }
        return next;
      });
    }, config.shuffleInterval);

    return () => {
      if (shuffleRef.current) {
        clearInterval(shuffleRef.current);
        shuffleRef.current = null;
      }
    };
  }, [config.cellShuffle, questionKey]);

  const nextRound = useCallback(() => {
    const newQ = generateQuestion(tier, overclockFactor);
    setQuestion(newQ);
    setQuestionKey(k => k + 1);
    setFoundOdds(new Set());
    setSelectedIndex(null);
    isProcessing.current = false;
  }, [tier, overclockFactor]);

  // Timer — CSS transition for smooth bar, setTimeout for expiry/ticks
  const [timerActive, setTimerActive] = useState(false);
  const [timerBarKey, setTimerBarKey] = useState(0); // Increments to force bar remount
  const [timerBarStartWidth, setTimerBarStartWidth] = useState('100%');
  const [timerBarDuration, setTimerBarDuration] = useState(config.timer);
  const [timeBonusFlash, setTimeBonusFlash] = useState(0); // Key for "+3s" animation
  const timerEndRef = useRef(Date.now() + config.timer * 1000);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const maxTimerMs = config.timer * 1000; // Original max for bar width calculation

  const startTimerBar = useCallback((durationMs: number, startWidthPct: number = 100) => {
    // Clear previous timers
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    tickTimersRef.current.forEach(t => clearTimeout(t));
    tickTimersRef.current = [];

    timerEndRef.current = Date.now() + durationMs;
    setTimerBarStartWidth(`${startWidthPct}%`);
    setTimerBarDuration(durationMs / 1000);

    // Start CSS transition via double-rAF
    setTimerActive(false);
    setTimerBarKey(k => k + 1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTimerActive(true));
    });

    // Tick sounds near end
    const tickAt80 = durationMs * 0.8;
    const tickAt90 = durationMs * 0.9;
    tickTimersRef.current.push(setTimeout(() => playSoundRef.current('tick'), tickAt80));
    tickTimersRef.current.push(setTimeout(() => playSoundRef.current('tick'), tickAt90));

    // Expiry
    expiryTimerRef.current = setTimeout(() => {
      setTimerActive(false);
      onAnswerRef.current(false, 0, tierRef.current);
      playSoundRef.current('wrong');
      triggerHapticRef.current('heavy');
      onScreenShakeRef.current();
      nextRound();
    }, durationMs);
  }, [nextRound]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = config.timer * 1000;
    questionStartTime.current = Date.now();
    setTimeLeft(duration);
    startTimerBar(duration, 100);

    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      tickTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, [questionKey, config.timer, startTimerBar]);

  const handleSelect = useCallback((cellId: number) => {
    if (isProcessing.current) return;

    const cell = liveGrid.find(c => c.id === cellId);
    if (!cell) return;
    if (foundOdds.has(cellId)) return;

    if (cell.isOdd) {
      playSound('correct');
      triggerHaptic('medium');

      const newFound = new Set(foundOdds);
      newFound.add(cellId);
      setFoundOdds(newFound);

      // Confetti at tap position
      const gridIndex = liveGrid.findIndex(c => c.id === cellId);
      const col = gridIndex % question.cols;
      const row = Math.floor(gridIndex / question.cols);
      const xFraction = 0.15 + (col / Math.max(1, question.cols - 1)) * 0.7;
      const totalRows = Math.ceil(liveGrid.length / question.cols);
      const yFraction = 0.25 + (row / Math.max(1, totalRows - 1)) * 0.4;
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { x: xFraction, y: yFraction },
        colors: ['#00BFFF', '#1E90FF', '#00D4FF'],
        scalar: 0.8,
      });

      if (newFound.size >= config.oddCount) {
        isProcessing.current = true;
        setSelectedIndex(cellId);
        onScreenShake();

        const responseTime = Date.now() - questionStartTime.current;
        const speedBonus = Math.max(0, Math.floor((3000 - responseTime) / 50));
        onAnswer(true, speedBonus, tier);

        setTimeout(() => nextRound(), 200);
      } else {
        // Still more odds to find — add +3s time bonus
        const remaining = timerEndRef.current - Date.now();
        const bonusMs = 3000;
        const newRemaining = Math.min(30000, remaining + bonusMs);
        const newWidthPct = Math.min(100, (newRemaining / maxTimerMs) * 100);
        startTimerBar(newRemaining, newWidthPct);
        setTimeBonusFlash(k => k + 1);
      }
    } else {
      isProcessing.current = true;
      setSelectedIndex(cellId);
      playSound('wrong');
      triggerHaptic('heavy');
      onScreenShake();

      onAnswer(false, 0, tier);
      setTimeout(() => nextRound(), 200);
    }
  }, [question, liveGrid, foundOdds, config.oddCount, tier, onAnswer, playSound, triggerHaptic, onScreenShake, nextRound]);

  // Cell sizing
  const cellSize = config.cols <= 4 ? 'w-16 h-16' : config.cols === 5 ? 'w-14 h-14' : config.cols === 6 ? 'w-11 h-11' : 'w-9 h-9';
  const textSize = config.cols <= 4 ? 'text-3xl' : config.cols === 5 ? 'text-2xl' : config.cols === 6 ? 'text-xl' : 'text-lg';
  const gap = config.cols <= 4 ? 'gap-3' : config.cols === 5 ? 'gap-2' : 'gap-1.5';

  // Helper: compute cell background color
  const getCellBg = (cell: CellData, isFound: boolean): string => {
    if (isFound) return 'hsl(var(--game-pattern) / 0.4)';
    if (selectedIndex === cell.id) {
      return cell.isOdd
        ? 'hsl(var(--game-pattern) / 0.5)'
        : 'hsl(var(--destructive) / 0.5)';
    }
    return 'hsl(var(--card) / 0.6)';
  };

  // Helper: compute cell box-shadow
  const getCellShadow = (cell: CellData, isFound: boolean): string => {
    if (isFound) return '0 0 20px hsl(var(--game-pattern) / 0.6)';
    if (selectedIndex === cell.id && cell.isOdd) return '0 0 30px hsl(var(--game-pattern) / 0.8)';
    if (selectedIndex === cell.id && !cell.isOdd) return '0 0 30px hsl(var(--destructive) / 0.8)';
    return '0 0 8px hsl(var(--game-pattern) / 0.15)';
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8">
      <div
        className="flex flex-col items-center w-full"
        style={{ animation: 'ph-fadeIn 0.3s ease' }}
      >
        {/* Instruction */}
        <div
          className="text-center mb-4"
          style={{ animation: 'ph-fadeInSlideDown 0.3s ease' }}
        >
          <div className="text-xs uppercase tracking-[0.3em] text-game-pattern/70 mb-1">
            Find {config.oddCount > 1 ? `All ${config.oddCount}` : 'The'}
          </div>
          <div className="text-xl font-black text-game-pattern uppercase tracking-wider">
            Odd {config.oddCount > 1 ? 'Ones' : 'One'} Out
          </div>
        </div>

        {/* Timer bar — CSS transition driven */}
        <div className="w-full max-w-sm relative mb-4">
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden border border-border/50">
            <div
              key={timerBarKey}
              className="h-full rounded-full"
              style={{
                width: timerActive ? '0%' : timerBarStartWidth,
                transition: timerActive ? `width ${timerBarDuration}s linear` : 'none',
                background: 'linear-gradient(90deg, hsl(var(--game-pattern)), hsl(var(--neon-cyan)))',
                boxShadow: '0 0 10px hsl(var(--game-pattern) / 0.5)',
              }}
            />
          </div>
          {timeBonusFlash > 0 && (
            <span
              key={timeBonusFlash}
              className="absolute -top-5 right-0 text-xs font-bold"
              style={{
                color: 'hsl(var(--game-pattern))',
                animation: 'ph-timeBonus 0.8s ease-out forwards',
              }}
            >
              +3s
            </span>
          )}
        </div>

        {/* Grid */}
        <div
          key={questionKey}
          className={`grid ${gap} p-4 rounded-3xl`}
          style={{
            gridTemplateColumns: `repeat(${question.cols}, minmax(0, 1fr))`,
            background: 'linear-gradient(135deg, hsl(var(--game-pattern) / 0.1), hsl(var(--card) / 0.5))',
            border: '1px solid hsl(var(--game-pattern) / 0.3)',
            animation: 'ph-fadeIn 0.3s ease',
          }}
        >
          {liveGrid.map((cell) => {
            const isFound = foundOdds.has(cell.id);
            return (
              <button
                key={cell.id}
                onClick={() => handleSelect(cell.id)}
                className={`${cellSize} rounded-xl border border-game-pattern/20 flex items-center justify-center touch-manipulation active:scale-[0.92]`}
                style={{
                  transition: 'transform 0.15s ease, background-color 0.2s ease, box-shadow 0.2s ease',
                  backgroundColor: getCellBg(cell, isFound),
                  boxShadow: getCellShadow(cell, isFound),
                  animation: config.cellPulse && !isFound
                    ? `ph-cellPulse ${2 + (cell.id % 3) * 0.5}s ease-in-out infinite`
                    : undefined,
                }}
                disabled={isFound}
              >
                <span
                  className={`${textSize} select-none`}
                  style={{
                    display: 'inline-block',
                    transform: cell.emojiDef.mirrored ? 'scaleX(-1)' : 'none',
                  }}
                >
                  {cell.emojiDef.emoji}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hint */}
        <div
          className="mt-6 text-center"
          style={{ animation: 'ph-fadeIn 0.5s ease' }}
        >
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            {config.oddCount > 1 ? `Tap all ${config.oddCount} different ones` : 'Tap the different one'}
          </div>
        </div>
      </div>

      {/* CSS keyframes for animations */}
      <style>{`
        @keyframes ph-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ph-fadeInSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ph-cellPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes ph-timeBonus {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
};
