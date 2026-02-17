import { useState, useCallback, useEffect, useRef } from 'react';
import { MixedGameScreen } from './components/MixedGameScreen';
import { useGameEngine } from './hooks/useGameEngine';
import { useSounds } from './hooks/useSounds';
import { GameMode, MiniGameType, MIXABLE_GAMES } from './types/game';

interface GameConfig {
  mode: GameMode;
  enabledGames: MiniGameType[];
  startTier: number;
  bestScore: number;
  bestStreak: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  streakMultiplier: number;
  assessmentType?: 'baseline' | 'weekly' | null;
}

// Post message to native Swift
const postNative = (msg: Record<string, unknown>) => {
  try {
    (window as any).webkit?.messageHandlers?.axonNative?.postMessage(msg);
  } catch (e) {
    console.warn('[GameShell] postMessage failed:', e);
  }
};

export const GameShell = () => {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [continueGranted, setContinueGranted] = useState(false);
  const { generateMathQuestion, generateColorQuestion } = useGameEngine();

  // Sound enabled comes from native config
  const soundEnabled = config?.soundEnabled ?? true;
  const { playSound, triggerHaptic: triggerHapticBase, setStreak, warmup } = useSounds(soundEnabled);

  // Haptics: delegate to native for better responsiveness
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    if (config?.hapticsEnabled) {
      postNative({ type: 'haptic', style: type });
    }
  }, [config?.hapticsEnabled]);

  // Game end -> send to native
  const onGameEnd = useCallback((
    score: number, streak: number, correct: number, wrong: number,
    peakSpeed?: number, duration?: number, sessionXP?: number, peakTension?: number,
    gameBreakdown?: Record<string, { correct: number; wrong: number }>,
    assessmentData?: { assessmentType: string; perGameResponseTimes: Record<string, number>; perGamePeakTiers: Record<string, number> }
  ) => {
    postNative({
      type: 'gameEnd',
      payload: {
        score, streak, correct, wrong,
        sessionXP: sessionXP ?? 0,
        mode: config?.mode ?? 'classic',
        duration: duration ?? 0,
        peakTension: peakTension ?? 0,
        gameBreakdown: gameBreakdown ?? {},
        ...(assessmentData ? {
          assessmentType: assessmentData.assessmentType,
          perGameResponseTimes: assessmentData.perGameResponseTimes,
          perGamePeakTiers: assessmentData.perGamePeakTiers,
        } : {}),
      },
    });
  }, [config?.mode]);

  // Continue request (Endless mode death) -> send to native
  const onRequestContinue = useCallback((
    score: number, streak: number, correct: number, wrong: number, sessionXP: number,
    gameBreakdown?: Record<string, { correct: number; wrong: number }>
  ) => {
    postNative({
      type: 'requestContinue',
      payload: { score, streak, correct, wrong, sessionXP, gameBreakdown: gameBreakdown ?? {} },
    });
  }, []);

  // Quit -> send to native
  const onQuit = useCallback(() => {
    postNative({ type: 'quit' });
  }, []);

  // Expose bridge API for native to call
  useEffect(() => {
    (window as any).axonBridge = {
      startGame: (cfg: GameConfig) => {
        setContinueGranted(false);
        setConfig(cfg);
        warmup(); // Pre-warm audio context on game start
      },
      continueGame: () => {
        setContinueGranted(true);
        // Reset after a tick so the useEffect in MixedGameScreen detects the change
        setTimeout(() => setContinueGranted(false), 100);
      },
    };

    // Signal to native that the bridge is ready
    postNative({ type: 'ready' });

    return () => {
      delete (window as any).axonBridge;
    };
  }, []);

  if (!config) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Green pulse — seamless ambient glow, no text */}
        <div style={{
          width: 'min(500px, 80vw)',
          height: 'min(500px, 80vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(140 70% 50% / 0.10) 0%, hsl(140 70% 50% / 0.03) 40%, transparent 70%)',
          animation: 'greenPulse 2s ease-in-out infinite',
        }} />
        <style>{`
          @keyframes greenPulse {
            0%, 100% { transform: scale(0.85); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      <MixedGameScreen
        mode={config.mode}
        enabledGames={config.enabledGames.filter(g => MIXABLE_GAMES.includes(g)) as MiniGameType[]}
        generateMathQuestion={generateMathQuestion}
        generateColorQuestion={generateColorQuestion}
        onGameEnd={onGameEnd}
        onQuit={onQuit}
        playSound={playSound}
        triggerHaptic={triggerHaptic}
        setStreak={setStreak}
        bestScore={config.bestScore}
        bestStreak={config.bestStreak}
        startTier={config.startTier}
        onRequestContinue={onRequestContinue}
        continueGranted={continueGranted}
        streakMultiplier={config.streakMultiplier}
        assessmentType={config.assessmentType ?? undefined}
      />
    </div>
  );
};
