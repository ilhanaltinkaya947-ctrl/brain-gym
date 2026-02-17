import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FlashSequenceProps {
  tier: number;
  onAnswer: (correct: boolean, speedBonus: number, tier: number) => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  overclockFactor?: number;
}

// Difficulty config — no rotation per tester feedback
const getDifficultyConfig = (tier: number) => {
  switch (tier) {
    case 1: return { sequenceLength: 3, speed: 800, gridCols: 3, gridSize: 9, allowRepeats: false };
    case 2: return { sequenceLength: 4, speed: 800, gridCols: 3, gridSize: 9, allowRepeats: false };
    case 3: return { sequenceLength: 5, speed: 900, gridCols: 4, gridSize: 12, allowRepeats: false };
    case 4: return { sequenceLength: 7, speed: 900, gridCols: 4, gridSize: 16, allowRepeats: false };
    case 5: return { sequenceLength: 9, speed: 1000, gridCols: 4, gridSize: 16, allowRepeats: true };
    default: return { sequenceLength: 3, speed: 800, gridCols: 3, gridSize: 9, allowRepeats: false };
  }
};

type Phase = 'countdown' | 'showing' | 'playing' | 'success';

export const FlashMemory = memo(({ tier, onAnswer, playSound, triggerHaptic, overclockFactor = 1 }: FlashSequenceProps) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('countdown');
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [trailCells, setTrailCells] = useState<Map<number, number>>(new Map());
  const [playerIndex, setPlayerIndex] = useState(0);
  const [errorCell, setErrorCell] = useState<number | null>(null);
  const [roundKey, setRoundKey] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [reFiringCell, setReFiringCell] = useState<number | null>(null);
  const [showStep, setShowStep] = useState(-1);
  const [replayIndex, setReplayIndex] = useState(-1);
  const [showSuccess, setShowSuccess] = useState(false);

  // Stable refs for callbacks to avoid effect restarts
  const playSoundRef = useRef(playSound);
  playSoundRef.current = playSound;
  const triggerHapticRef = useRef(triggerHaptic);
  triggerHapticRef.current = triggerHaptic;
  const onAnswerRef = useRef(onAnswer);
  onAnswerRef.current = onAnswer;
  const replayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wrongTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const config = getDifficultyConfig(tier);
  const effectiveSpeed = Math.floor(config.speed / overclockFactor);

  // Generate sequence
  const generateSequence = useCallback(() => {
    const { sequenceLength, gridSize, allowRepeats } = getDifficultyConfig(tier);
    const seq: number[] = [];

    for (let i = 0; i < sequenceLength; i++) {
      if (allowRepeats && i > 2 && Math.random() < 0.3) {
        const candidates = seq.slice(0, -1);
        seq.push(candidates[Math.floor(Math.random() * candidates.length)]);
      } else {
        let cell: number;
        do {
          cell = Math.floor(Math.random() * gridSize);
        } while (seq.length > 0 && seq[seq.length - 1] === cell);
        seq.push(cell);
      }
    }

    return seq;
  }, [tier]);

  // Initialize round
  const initializeRound = useCallback(() => {
    const newSequence = generateSequence();
    setSequence(newSequence);
    setPhase('countdown');
    setPlayerIndex(0);
    setErrorCell(null);
    setActiveCell(null);
    setTrailCells(new Map());
    setReFiringCell(null);
    setShowStep(-1);
    setReplayIndex(-1);
    setShowSuccess(false);
    setRoundKey(prev => prev + 1);
  }, [generateSequence]);

  useEffect(() => { initializeRound(); }, [initializeRound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // Quick "get ready" flash then start showing
  useEffect(() => {
    if (phase !== 'countdown') return;
    let cancelled = false;

    triggerHapticRef.current('light');
    const t = setTimeout(() => {
      if (!cancelled) setPhase('showing');
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [roundKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Play sequence animation
  useEffect(() => {
    if (phase !== 'showing' || sequence.length === 0) return;

    let step = 0;
    let cancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    const playStep = () => {
      if (cancelled) return;

      if (step >= sequence.length) {
        const t = setTimeout(() => {
          if (cancelled) return;
          setActiveCell(null);
          setTrailCells(new Map());
          setShowStep(-1);
          setPhase('playing');
        }, 400);
        timeouts.push(t);
        return;
      }

      const currentCell = sequence[step];
      const prevCell = step > 0 ? sequence[step - 1] : null;
      const prevPrevCell = step > 1 ? sequence[step - 2] : null;

      setShowStep(step);

      const isReFire = step > 0 && currentCell === sequence[step - 1];
      if (isReFire) {
        setReFiringCell(currentCell);
        setActiveCell(null);
        playSoundRef.current('tick');
        const t1 = setTimeout(() => {
          if (cancelled) return;
          setReFiringCell(null);
          setActiveCell(currentCell);
          playSoundRef.current('tick');
          triggerHapticRef.current('medium');
        }, 120);
        timeouts.push(t1);
      } else {
        setActiveCell(currentCell);
        playSoundRef.current('tick');
        triggerHapticRef.current('light');
      }

      // Trail with better visibility
      const newTrail = new Map<number, number>();
      if (prevCell !== null) {
        newTrail.set(prevCell, 1);
      }
      if (prevPrevCell !== null && prevPrevCell !== prevCell) {
        newTrail.set(prevPrevCell, 2);
      }
      setTrailCells(newTrail);

      step++;
      const t = setTimeout(playStep, effectiveSpeed);
      timeouts.push(t);
    };

    const startTimeout = setTimeout(playStep, 200);
    timeouts.push(startTimeout);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [phase, roundKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle player tap
  const handleCellTap = (cellIndex: number) => {
    if (phase !== 'playing') return;

    const now = Date.now();
    if (now - lastTapTime < 120) return;
    setLastTapTime(now);

    const expectedCell = sequence[playerIndex];

    if (cellIndex === expectedCell) {
      playSoundRef.current('correct');
      triggerHapticRef.current('light');

      if (playerIndex === sequence.length - 1) {
        setPhase('success');
        // Replay sequence cells one by one, then show checkmark
        let ri = 0;
        if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
        replayIntervalRef.current = setInterval(() => {
          setReplayIndex(ri);
          ri++;
          if (ri >= sequence.length) {
            if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
            replayIntervalRef.current = null;
            setReplayIndex(-1);
            // Show checkmark overlay
            setShowSuccess(true);
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { x: 0.5, y: 0.5 },
              colors: ['#00D4FF', '#FF00FF', '#FFD700', '#00FF88'],
              gravity: 1.2,
              ticks: 100,
            });
            // Wait for checkmark to be visible, then report answer
            successTimeoutRef.current = setTimeout(() => onAnswerRef.current(true, 1.0, tier), 500);
          }
        }, 100); // 100ms per cell — visible replay speed
      } else {
        setPlayerIndex(prev => prev + 1);
      }
    } else {
      playSoundRef.current('wrong');
      triggerHapticRef.current('heavy');
      setErrorCell(cellIndex);
      wrongTimeoutRef.current = setTimeout(() => onAnswerRef.current(false, 0, tier), 500);
    }
  };

  // Progress dots
  const renderProgressDots = () => {
    if (phase === 'countdown') return null;

    return (
      <div className="flex gap-2 mt-6 fm-fade-in">
        {sequence.map((_, i) => {
          let dotClass = 'bg-muted/20';
          let shadow = 'none';
          let pulseClass = '';

          if (phase === 'showing') {
            if (i <= showStep) {
              dotClass = 'bg-neon-gold';
              shadow = '0 0 8px hsl(var(--neon-gold) / 0.5)';
            }
            if (i === showStep) {
              pulseClass = 'fm-dot-pulse';
            }
          } else if (phase === 'playing' || phase === 'success') {
            if (i < playerIndex || phase === 'success') {
              dotClass = 'bg-neon-gold';
              shadow = '0 0 8px hsl(var(--neon-gold) / 0.5)';
            } else if (i === playerIndex && phase === 'playing') {
              dotClass = 'bg-neon-cyan';
              shadow = '0 0 10px hsl(var(--neon-cyan) / 0.5)';
              pulseClass = 'fm-dot-pulse-loop';
            }
          }

          return (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${dotClass} ${pulseClass}`}
              style={{ boxShadow: shadow }}
            />
          );
        })}
      </div>
    );
  };

  const isSuccess = phase === 'success';

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4">
      <style>{`
        @keyframes fm-countdown-pop {
          0% { transform: scale(1.6); opacity: 0; }
          20% { transform: scale(0.95); opacity: 1; }
          30% { transform: scale(1.02); opacity: 1; }
          40% { transform: scale(1); opacity: 1; }
          75% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        .fm-countdown-pop { animation: fm-countdown-pop 600ms ease-in-out forwards; }
        @keyframes fm-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .fm-fade-in { animation: fm-fade-in 0.3s ease forwards; }
        @keyframes fm-dot-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.4); } }
        .fm-dot-pulse { animation: fm-dot-pulse 0.5s ease forwards; }
        @keyframes fm-dot-pulse-loop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }
        .fm-dot-pulse-loop { animation: fm-dot-pulse-loop 0.5s ease infinite; }
        @keyframes fm-success-in { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .fm-success-in { animation: fm-success-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes fm-check-pop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .fm-check-pop { animation: fm-check-pop 0.3s ease forwards; }
        @keyframes fm-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .fm-shake { animation: fm-shake 0.3s ease; }
      `}</style>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none fm-success-in">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500 fm-check-pop">
            <Check className="w-10 h-10 text-green-500" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Quick ready flash */}
      {phase === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span
            key={`cd-${roundKey}`}
            className="font-black uppercase tracking-[0.2em] text-neon-cyan fm-countdown-pop"
            style={{
              fontSize: 24,
              textShadow: '0 0 20px hsl(var(--neon-cyan) / 0.5)',
            }}
          >
            WATCH
          </span>
        </div>
      )}

      {/* Phase label — fixed height to prevent layout shift */}
      <div className="h-8 flex items-center justify-center mb-6">
        <p className="text-lg text-muted-foreground uppercase tracking-wider text-center font-medium transition-opacity duration-200"
          style={{ opacity: phase === 'countdown' ? 0 : 1 }}
        >
          {phase === 'showing' ? (
            <span className="text-neon-cyan text-glow-cyan font-bold">Watch the sequence</span>
          ) : phase === 'playing' ? (
            <>Tap: <span className="text-primary font-black text-glow-cyan">{playerIndex + 1}/{sequence.length}</span></>
          ) : isSuccess ? (
            <span className="text-green-500 font-bold">Perfect!</span>
          ) : null}
        </p>
      </div>

      {/* Grid — no scale animation, CSS transitions for state changes */}
      <div
        className="grid gap-3 w-full max-w-xs aspect-square transition-opacity duration-300"
        style={{
          gridTemplateColumns: `repeat(${config.gridCols}, 1fr)`,
          opacity: phase === 'countdown' ? 0.4 : isSuccess && showSuccess ? 0.3 : isSuccess ? 0.85 : 1,
        }}
      >
        {Array.from({ length: config.gridSize }, (_, i) => {
          const isActive = activeCell === i;
          const trailLevel = trailCells.get(i);
          const isReFiring = reFiringCell === i;
          const isError = errorCell === i;
          const isReplayActive = isSuccess && replayIndex >= 0 && sequence[replayIndex] === i;

          // Derive tapped state from playerIndex + sequence
          const completedCells = sequence.slice(0, playerIndex);
          const remainingCells = sequence.slice(playerIndex);
          const isCellDone = completedCells.includes(i) && !remainingCells.includes(i);
          const isCorrectInSequence = phase === 'playing' && completedCells.includes(i);
          // On success, light up all sequence cells gold
          const isSuccessCell = isSuccess && sequence.includes(i);

          let bgStyle: React.CSSProperties;
          let borderStyle: string;
          let shadowStyle: string;
          let cellOpacity = 1;

          if (isError) {
            bgStyle = { background: 'linear-gradient(145deg, hsl(0, 70%, 25%), hsl(0, 70%, 15%))' };
            borderStyle = '2px solid hsl(0, 85%, 50%)';
            shadowStyle = '0 0 30px hsl(0, 85%, 50% / 0.5)';
          } else if (isActive || isReplayActive) {
            bgStyle = { background: 'linear-gradient(145deg, hsl(var(--neon-cyan) / 0.6), hsl(var(--neon-cyan) / 0.3))' };
            borderStyle = '2px solid hsl(var(--neon-cyan))';
            shadowStyle = '0 0 50px hsl(var(--neon-cyan) / 0.7), inset 0 0 20px hsl(var(--neon-cyan) / 0.3)';
          } else if (isReFiring) {
            bgStyle = { background: 'linear-gradient(145deg, hsl(0 0% 90% / 0.6), hsl(0 0% 80% / 0.4))' };
            borderStyle = '2px solid hsl(0 0% 90% / 0.8)';
            shadowStyle = '0 0 25px hsl(0 0% 100% / 0.4)';
          } else if (trailLevel === 1) {
            bgStyle = { background: 'linear-gradient(145deg, hsl(var(--neon-cyan) / 0.35), hsl(var(--neon-cyan) / 0.15))' };
            borderStyle = '2px solid hsl(var(--neon-cyan) / 0.6)';
            shadowStyle = '0 0 20px hsl(var(--neon-cyan) / 0.35)';
            cellOpacity = 0.55;
          } else if (trailLevel === 2) {
            bgStyle = { background: 'linear-gradient(145deg, hsl(var(--neon-cyan) / 0.15), hsl(var(--neon-cyan) / 0.06))' };
            borderStyle = '2px solid hsl(var(--neon-cyan) / 0.3)';
            shadowStyle = '0 0 12px hsl(var(--neon-cyan) / 0.2)';
            cellOpacity = 0.3;
          } else if (isSuccessCell) {
            bgStyle = { background: 'linear-gradient(145deg, hsl(var(--neon-gold) / 0.4), hsl(var(--neon-gold) / 0.2))' };
            borderStyle = '2px solid hsl(var(--neon-gold))';
            shadowStyle = '0 0 20px hsl(var(--neon-gold) / 0.4)';
          } else if (isCorrectInSequence) {
            bgStyle = { background: 'linear-gradient(145deg, hsl(var(--neon-gold) / 0.4), hsl(var(--neon-gold) / 0.2))' };
            borderStyle = '2px solid hsl(var(--neon-gold))';
            shadowStyle = '0 0 20px hsl(var(--neon-gold) / 0.4)';
          } else {
            bgStyle = { background: 'linear-gradient(145deg, hsl(260 30% 14% / 0.8), hsl(260 30% 8% / 0.6))' };
            borderStyle = '2px solid hsl(var(--neon-cyan) / 0.15)';
            shadowStyle = 'none';
          }

          const cellScale = isCellDone ? 0.9 : isActive ? 1.08 : isReplayActive ? 1.06 : 1;

          return (
            <button
              key={i}
              onClick={() => handleCellTap(i)}
              disabled={phase !== 'playing' || isCellDone}
              className={`rounded-xl flex items-center justify-center touch-manipulation min-w-[44px] min-h-[44px] ${
                phase === 'playing' && !isCellDone ? 'active:scale-[0.92]' : ''
              } ${isError ? 'fm-shake' : ''} ${isCellDone ? 'pointer-events-none' : ''}`}
              style={{
                ...bgStyle,
                border: borderStyle,
                boxShadow: shadowStyle,
                aspectRatio: '1',
                opacity: cellOpacity,
                transform: `scale(${cellScale})`,
                transition: 'transform 0.15s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
              }}
            />
          );
        })}
      </div>

      {/* Progress dots */}
      {renderProgressDots()}

      {/* Status text — fixed height */}
      <div className="h-5 mt-3 flex items-center justify-center">
        {phase !== 'countdown' && (
          <p className={`text-xs font-mono tracking-widest uppercase fm-fade-in ${
            isSuccess ? 'text-green-500' : 'text-muted-foreground opacity-40'
          }`}>
            {isSuccess ? 'Perfect!' : phase === 'showing' ? `${showStep + 1} of ${sequence.length}` : `${playerIndex + 1} of ${sequence.length}`}
          </p>
        )}
      </div>
    </div>
  );
});
