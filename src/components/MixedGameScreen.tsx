import { useState, useEffect, useCallback, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Clock, Zap, Target, X, Trophy, Infinity as InfinityIcon, Skull, Flame, Pause, Play } from 'lucide-react';
import { SpeedMath } from './SpeedMath';

// Error boundary to catch game crashes and recover gracefully
class GameErrorBoundary extends Component<
  { children: ReactNode; onError: () => void; gameKey: string },
  { hasError: boolean }
> {
  private recoveryTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: { children: ReactNode; onError: () => void; gameKey: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AXON] Game component crashed:', error, info.componentStack);
    // Schedule recovery ONCE (not in render which fires on every re-render)
    if (!this.recoveryTimeout) {
      this.recoveryTimeout = setTimeout(() => {
        this.recoveryTimeout = null;
        this.props.onError();
      }, 500);
    }
  }
  componentDidUpdate(prevProps: { gameKey: string }) {
    if (prevProps.gameKey !== this.props.gameKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }
  componentWillUnmount() {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
      this.recoveryTimeout = null;
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-24 h-24 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(140 70% 50% / 0.12) 0%, transparent 70%)',
              animation: 'errorPulse 1.5s ease-in-out infinite',
            }}
          />
          <style>{`@keyframes errorPulse { 0%,100%{transform:scale(0.8);opacity:0.4} 50%{transform:scale(1.2);opacity:1} }`}</style>
        </div>
      );
    }
    return this.props.children;
  }
}
import { ColorMatch } from './ColorMatch';
import { PatternHunter } from './PatternHunter';
import { ParadoxFlow } from './games/ParadoxFlow';
import { OperatorChaos } from './games/OperatorChaos';
import { SpatialStack } from './games/SpatialStack';
import { WordConnect } from './games/WordConnect';
import { SuitDeception } from './games/SuitDeception';
import { ChimpMemory } from './games/ChimpMemory';
import { FlashMemory } from './FlashMemory';
import { HeatBackground } from './HeatBackground';
import { FloatingXP } from './XPGainAnimation';
import { MiniGameType, GAME_THEMES, GameMode, MIXABLE_GAMES } from '@/types/game';
import { MathQuestion, ColorQuestion, getDifficultyTier } from '@/hooks/useGameEngine';
import { useAdaptiveEngine, AdaptivePhase } from '@/hooks/useAdaptiveEngine';
import { useTensionEngine, selectNextGameWeighted, GAME_TENSION_PROFILES } from '@/hooks/useTensionEngine';

interface MixedGameScreenProps {
  mode: GameMode;
  enabledGames: MiniGameType[];
  generateMathQuestion: (streak?: number, mode?: GameMode, timeElapsed?: number) => MathQuestion;
  generateColorQuestion: () => ColorQuestion;
  onGameEnd: (score: number, streak: number, correct: number, wrong: number, peakSpeed?: number, duration?: number, sessionXP?: number, peakTension?: number, gameBreakdown?: Record<string, { correct: number; wrong: number }>, assessmentData?: { assessmentType: string; perGameResponseTimes: Record<string, number>; perGamePeakTiers: Record<string, number> }) => void;
  onQuit: () => void;
  playSound: (type: 'correct' | 'wrong' | 'tick' | 'heartbeat' | 'countdownTick' | 'countdownGo', tier?: number) => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => void;
  setStreak: (streak: number) => void;
  bestScore: number;
  bestStreak: number;
  startTier?: number;
  onRequestContinue?: (score: number, streak: number, correct: number, wrong: number, sessionXP: number, gameBreakdown?: Record<string, { correct: number; wrong: number }>) => void;
  continueGranted?: boolean;
  streakMultiplier?: number;
  assessmentType?: 'baseline' | 'weekly';
}

const CLASSIC_DURATION = 180; // 3 minutes

export const MixedGameScreen = ({
  mode,
  enabledGames,
  generateMathQuestion,
  generateColorQuestion,
  onGameEnd,
  onQuit,
  playSound,
  triggerHaptic,
  setStreak,
  bestScore,
  bestStreak,
  startTier = 1,
  onRequestContinue,
  continueGranted,
  streakMultiplier = 1.0,
  assessmentType,
}: MixedGameScreenProps) => {
  const isAssessment = mode === 'assessment';
  const [currentGame, setCurrentGame] = useState<MiniGameType>(() => {
    const games = enabledGames.length > 0 ? enabledGames : MIXABLE_GAMES;
    return games[Math.floor(Math.random() * games.length)];
  });
  const [gameKey, setGameKey] = useState(0); // Only increments on game switch
  const [score, setScore] = useState(0);
  const [streak, setStreakState] = useState(() => {
    // Initialize streak based on starting tier
    const tierStreakMap: Record<number, number> = { 1: 0, 2: 9, 3: 19, 4: 31, 5: 46 };
    return tierStreakMap[startTier] || 0;
  });
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0); // Track consecutive wrong answers
  const [tierPenalty, setTierPenalty] = useState(0); // Tier downgrade from 3 consecutive wrong answers
  const [sessionXP, setSessionXP] = useState(0); // XP earned during this session (resets on 3+ wrong streak)
  const [timeLeft, setTimeLeft] = useState(mode === 'classic' || mode === 'assessment' ? CLASSIC_DURATION : 0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [scoreKey, setScoreKey] = useState(0);
  const [hasTriggeredNewRecord, setHasTriggeredNewRecord] = useState(false);
  const [floatingXP, setFloatingXP] = useState<{ amount: number; key: number } | null>(null);
  const [showXPReset, setShowXPReset] = useState(false); // Visual feedback for XP reset
  const [hasContinued, setHasContinued] = useState(false); // Track if continue was used this session
  const [pendingDeath, setPendingDeath] = useState(false); // Waiting for continue decision
  // ambientPulse removed — unified into edgeGlow
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [wrongPause, setWrongPause] = useState(false); // Hides game during wrong answer red pulse
  const [isPaused, setIsPaused] = useState(false); // Game pause state
  const [edgeGlow, setEdgeGlow] = useState<{ cssVar: string; intensity: number } | null>(null); // Edge glow for transitions, tier shifts, combos
  const [lastPointsEarned, setLastPointsEarned] = useState(0); // For proportional score pop
  const [isTransitioning, setIsTransitioning] = useState(false); // Brief blur bridge between games
  const prevTierRef = useRef(startTier);
  const totalQuestionsRef = useRef(0); // Track total questions for surprise difficulty
  const recentGamesRef = useRef<MiniGameType[]>([]); // Track recent games to avoid repeats

  const [surpriseTier, setSurpriseTier] = useState(false); // Temporary tier boost for "art of surprise"
  const [comboCallout, setComboCallout] = useState<string | null>(null); // "COMBO MODE" etc.
  const [resumeCountdown, setResumeCountdown] = useState<number | null>(null); // 3, 2, 1 on pause resume
  const [startCountdown, setStartCountdown] = useState<number>(3); // 3, 2, 1 on game start

  // Per-game breakdown tracking for mastery system
  const gameBreakdownRef = useRef<Record<string, { correct: number; wrong: number }>>({});

  // Assessment mode state — random game switching like classic, timer-based end
  const ASSESSMENT_QUESTIONS_PER_GAME = 5;
  const assessmentQuestionsForGameRef = useRef(0);
  const gameResponseTimesRef = useRef<Record<string, number[]>>({});
  const gamePeakTiersRef = useRef<Record<string, number>>({});
  const assessmentTierRef = useRef(startTier);

  // Refs for handleAnswer stale closure prevention (must be after all useState declarations)
  const pendingDeathRef = useRef(pendingDeath);
  const hasContinuedRef = useRef(hasContinued);
  const startCountdownRef2 = useRef(startCountdown);
  const scoreRef = useRef(score);
  const correctRef = useRef(correct);
  const wrongRef = useRef(wrong);
  const sessionXPRef = useRef(sessionXP);
  const wrongStreakRef = useRef(wrongStreak);
  const tierPenaltyRef = useRef(tierPenalty);
  useEffect(() => { pendingDeathRef.current = pendingDeath; }, [pendingDeath]);
  useEffect(() => { hasContinuedRef.current = hasContinued; }, [hasContinued]);
  useEffect(() => { startCountdownRef2.current = startCountdown; }, [startCountdown]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { correctRef.current = correct; }, [correct]);
  useEffect(() => { wrongRef.current = wrong; }, [wrong]);
  useEffect(() => { sessionXPRef.current = sessionXP; }, [sessionXP]);
  useEffect(() => { wrongStreakRef.current = wrongStreak; }, [wrongStreak]);
  useEffect(() => { tierPenaltyRef.current = tierPenalty; }, [tierPenalty]);
  
  // Calculate time elapsed for Classic mode (180 - timeLeft)
  const timeElapsed = (mode === 'classic' || mode === 'assessment') ? CLASSIC_DURATION - timeLeft : undefined;
  
  // Calculate current tier based on streak, mode, and time elapsed
  // Streak >= 5 gives a +1 tier boost for difficulty
  const calculatedTier = isAssessment ? assessmentTierRef.current : getDifficultyTier(streak, mode, timeElapsed);
  const streakBoost = !isAssessment && streak >= 5 ? 1 : 0;
  const surpriseBoost = !isAssessment && surpriseTier ? 1 : 0;
  const currentTier = isAssessment
    ? assessmentTierRef.current
    : Math.max(1, Math.min(5, Math.max(startTier, calculatedTier) + streakBoost + surpriseBoost) - tierPenalty);
  // Is God Tier active (tier 4+)
  const isGodTier = startTier >= 4 || currentTier >= 4;

  // Detect tier shifts — subtle edge glow instead of text overlay
  useEffect(() => {
    if (currentTier !== prevTierRef.current && currentTier > prevTierRef.current) {
      prevTierRef.current = currentTier;
      triggerHaptic('heavy');
      playSound('tick', currentTier);
      // Purple/blue edge glow based on tier
      const cssVar = currentTier >= 4 ? '280, 70%, 55%' : '220, 80%, 55%';
      setEdgeGlow({ cssVar, intensity: Math.min(currentTier * 0.2, 0.8) });
      if (edgeGlowTimeoutRef.current) clearTimeout(edgeGlowTimeoutRef.current);
      edgeGlowTimeoutRef.current = setTimeout(() => setEdgeGlow(null), 2500);
    } else {
      prevTierRef.current = currentTier;
    }
  }, [currentTier]); // eslint-disable-line react-hooks/exhaustive-deps

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef(Date.now());
  const answerCooldownRef = useRef(false); // Prevents cascading answers from stale timers during transitions

  // Cleanup refs — track all setTimeout/rAF calls to prevent memory leaks on unmount
  const floatingXPTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const edgeGlowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const xpResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrongPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrongRevealTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const confettiRafRef = useRef<number | null>(null);
  const comboCalloutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resumeCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const startCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const warnedAt60Ref = useRef(false); // Track if 60s warning already fired

  // Adaptive engine for dynamic difficulty
  const { state: adaptiveState, processAnswer, getGameParams, getSessionDuration, reset: resetAdaptive, setCurrentGameType } = useAdaptiveEngine();

  // Tension engine — progressive cross-domain cognitive overload
  const tensionEngine = useTensionEngine();

  // Cleanup all tracked timeouts/rAF on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (floatingXPTimeoutRef.current) clearTimeout(floatingXPTimeoutRef.current);
      if (edgeGlowTimeoutRef.current) clearTimeout(edgeGlowTimeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (xpResetTimeoutRef.current) clearTimeout(xpResetTimeoutRef.current);
      if (wrongPauseTimeoutRef.current) clearTimeout(wrongPauseTimeoutRef.current);
      if (wrongRevealTimeoutRef.current) clearTimeout(wrongRevealTimeoutRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      if (confettiRafRef.current) cancelAnimationFrame(confettiRafRef.current);
      if (comboCalloutTimeoutRef.current) clearTimeout(comboCalloutTimeoutRef.current);
      if (resumeCountdownRef.current) clearInterval(resumeCountdownRef.current);
      if (startCountdownRef.current) clearInterval(startCountdownRef.current);
    };
  }, []);

  // 3-2-1 countdown on game start with race-start beeps
  useEffect(() => {
    let count = 3;
    setStartCountdown(3);
    playSound('countdownTick');
    startCountdownRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        if (startCountdownRef.current) clearInterval(startCountdownRef.current);
        setStartCountdown(0);
        playSound('countdownGo');
      } else {
        setStartCountdown(count);
        playSound('countdownTick');
      }
    }, 1000);
    return () => {
      if (startCountdownRef.current) clearInterval(startCountdownRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const gameProgress = (mode === 'classic' || mode === 'assessment')
    ? ((CLASSIC_DURATION - timeLeft) / CLASSIC_DURATION) * 100
    : Math.min(streak * 5, 100);
  
  const isComboMode = streak >= 5;
  const isNewRecord = isAssessment ? false : mode === 'classic'
    ? score > bestScore && bestScore > 0
    : streak > bestStreak && bestStreak > 0;
  const currentTheme = GAME_THEMES[currentGame];

  // Inform adaptive engine of game type changes for per-game base times
  useEffect(() => {
    setCurrentGameType(currentGame);
  }, [currentGame, setCurrentGameType]);

  // Classic mode timer — pauses when game is paused or during countdown
  useEffect(() => {
    if ((mode === 'classic' || mode === 'assessment') && !isGameOver && !isPaused && startCountdown === 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, isGameOver, isPaused, startCountdown]);

  // Classic mode time warnings — 60s warning + last 10s countdown ticks
  useEffect(() => {
    if (mode !== 'classic' || isGameOver || isPaused) return;

    // One-time warning at 60 seconds left
    if (timeLeft === 60 && !warnedAt60Ref.current) {
      warnedAt60Ref.current = true;
      playSound('tick', currentTier);
      triggerHaptic('medium');
      setEdgeGlow({ cssVar: '35, 95%, 55%', intensity: 0.5 }); // orange glow
      if (edgeGlowTimeoutRef.current) clearTimeout(edgeGlowTimeoutRef.current);
      edgeGlowTimeoutRef.current = setTimeout(() => setEdgeGlow(null), 2000);
    }

    // Last 10 seconds — countdown tick each second
    if (timeLeft <= 10 && timeLeft > 0) {
      playSound('countdownTick');
      triggerHaptic(timeLeft <= 3 ? 'heavy' : 'light');
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adaptive heartbeat based on game speed (overdrive mode) — stops during pause/countdown
  useEffect(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);

    if (!isGameOver && !isPaused && !pendingDeath && startCountdown === 0 && adaptiveState.phase === 'overdrive') {
      const interval = Math.max(500, 1000 / adaptiveState.gameSpeed);

      heartbeatRef.current = setInterval(() => {
        playSound('heartbeat');
      }, interval);
    } else if (mode === 'endless' && !isGameOver && !isPaused && !pendingDeath && startCountdown === 0 && streak > 5) {
      const interval = Math.max(600, 1000 - streak * 30);

      heartbeatRef.current = setInterval(() => {
        playSound('heartbeat');
      }, interval);
    }
    
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [mode, streak, isGameOver, isPaused, pendingDeath, startCountdown, playSound, adaptiveState.phase, adaptiveState.gameSpeed]);

  // Game end handler — fires exactly once when isGameOver becomes true
  // Delays 1.2s so "TIME UP" / "GAME OVER" text is visible before transitioning
  const gameEndFiredRef = useRef(false);
  useEffect(() => {
    if (isGameOver && !gameEndFiredRef.current) {
      gameEndFiredRef.current = true;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (!isAssessment) playSound('lose');
      setTimeout(() => {
        // Compute assessment data if in assessment mode
        const assessData = isAssessment ? {
          assessmentType: assessmentType ?? 'baseline',
          perGameResponseTimes: Object.fromEntries(
            Object.entries(gameResponseTimesRef.current).map(([game, times]) => [
              game,
              times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
            ])
          ),
          perGamePeakTiers: { ...gamePeakTiersRef.current },
        } : undefined;
        onGameEnd(
          scoreRef.current, streak, correctRef.current, wrongRef.current,
          adaptiveState.peakGameSpeed, getSessionDuration(),
          isAssessment ? 0 : sessionXPRef.current,
          tensionEngine.state.peakTension, gameBreakdownRef.current,
          assessData
        );
      }, isAssessment ? 600 : 1200);
    }
  }, [isGameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  // Note: Continue granted effect moved below selectNextGame definition

  // Update sound pitch based on streak
  useEffect(() => {
    setStreak(streak);
  }, [streak, setStreak]);

  // Trigger new record confetti — single burst instead of continuous loop
  useEffect(() => {
    if (isNewRecord && !hasTriggeredNewRecord) {
      setHasTriggeredNewRecord(true);
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 },
        colors: ['#00D4FF', '#FF00FF', '#FFD700'],
        ticks: 120,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.6 },
        colors: ['#00D4FF', '#FF00FF', '#FFD700'],
        ticks: 120,
        disableForReducedMotion: true,
      });
    }
  }, [isNewRecord, hasTriggeredNewRecord]);

  // Score pop animation
  useEffect(() => {
    setScoreKey(prev => prev + 1);
  }, [score]);

  // Combo milestone — edge glow + callout + subtle confetti at every 10 streak
  useEffect(() => {
    if (streak >= 5 && streak % 5 === 0) {
      const cssVar = streak >= 20
        ? '45, 95%, 55%' // gold for high streaks
        : streak >= 10
          ? '280, 70%, 55%' // purple for medium
          : '220, 80%, 55%'; // blue for early
      setEdgeGlow({ cssVar, intensity: 0.4 });
      if (edgeGlowTimeoutRef.current) clearTimeout(edgeGlowTimeoutRef.current);
      edgeGlowTimeoutRef.current = setTimeout(() => setEdgeGlow(null), 1500);

      // Combo callout text
      const label = streak === 5 ? 'COMBO MODE' : streak >= 20 ? `${streak} STREAK` : `${streak} COMBO`;
      setComboCallout(label);
      if (comboCalloutTimeoutRef.current) clearTimeout(comboCalloutTimeoutRef.current);
      comboCalloutTimeoutRef.current = setTimeout(() => setComboCallout(null), 1200);

      // Subtle confetti pop at every 10-streak milestone
      if (streak % 10 === 0) {
        confetti({
          particleCount: 15,
          spread: 40,
          startVelocity: 20,
          gravity: 0.8,
          scalar: 0.6,
          origin: { x: 0.3, y: 0.7 },
          colors: ['#00D4FF', '#A855F7', '#FFD700'],
          disableForReducedMotion: true,
          ticks: 80,
        });
        confetti({
          particleCount: 15,
          spread: 40,
          startVelocity: 20,
          gravity: 0.8,
          scalar: 0.6,
          origin: { x: 0.7, y: 0.7 },
          colors: ['#00D4FF', '#A855F7', '#FFD700'],
          disableForReducedMotion: true,
          ticks: 80,
        });
      }
    }
  }, [streak]);

  const handleScreenShake = useCallback(() => {
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 200);
  }, []);

  const selectNextGame = useCallback(() => {
    const recent = recentGamesRef.current;
    const qCount = totalQuestionsRef.current;

    const gamePool = enabledGames.length > 0 ? enabledGames : MIXABLE_GAMES;

    // Single game selected — always return it
    if (gamePool.length === 1) return gamePool[0];

    // Every 7 questions, force a game that hasn't appeared recently
    if (qCount > 0 && qCount % 7 === 0) {
      const recentSet = new Set(recent.slice(-5));
      const underserved = gamePool.filter(g => g !== currentGame && !recentSet.has(g));
      if (underserved.length > 0) {
        return underserved[Math.floor(Math.random() * underserved.length)];
      }
    }

    // Normal selection: filter last 2 games, weighted random
    const candidates = gamePool.filter(g => g !== currentGame && !recent.slice(-2).includes(g));
    const pool = candidates.length >= 3 ? candidates : gamePool.filter(g => g !== currentGame);
    return selectNextGameWeighted(currentGame, pool);
  }, [currentGame, enabledGames]);

  // Recover from game component crash — skip to next game
  const handleGameCrash = useCallback(() => {
    const next = selectNextGame();
    setCurrentGame(next);
    setGameKey(k => k + 1);
    questionStartTimeRef.current = Date.now();
  }, [selectNextGame]);

  // Handle continue granted from parent (Endless mode second chance)
  useEffect(() => {
    if (continueGranted && pendingDeath) {
      setPendingDeath(false);
      setHasContinued(true);
      // Resume: generate next question, keep streak and score
      setCurrentGame(selectNextGame());
      setGameKey(k => k + 1);
      questionStartTimeRef.current = Date.now();
    }
  }, [continueGranted, pendingDeath, selectNextGame]);

  const handleAnswer = useCallback((isCorrect: boolean, speedBonus: number = 0, tier: number = 1) => {
    // Block answers when paused, during countdown, pending death, or during cooldown
    if (isPaused || startCountdownRef2.current > 0 || pendingDeathRef.current) return;
    if (answerCooldownRef.current) return;
    answerCooldownRef.current = true;
    setTimeout(() => { answerCooldownRef.current = false; }, isCorrect ? 300 : 700);

    const responseTime = Date.now() - questionStartTimeRef.current;
    totalQuestionsRef.current += 1;

    // ===== ASSESSMENT MODE BRANCH =====
    // Random game switching like classic mode, runs until 3min timer ends
    if (isAssessment) {
      // Track response time per game
      if (!gameResponseTimesRef.current[currentGame]) {
        gameResponseTimesRef.current[currentGame] = [];
      }
      gameResponseTimesRef.current[currentGame].push(responseTime);

      // Track peak tier per game
      gamePeakTiersRef.current[currentGame] = Math.max(
        gamePeakTiersRef.current[currentGame] ?? 1, tier
      );

      // Track breakdown
      if (!gameBreakdownRef.current[currentGame]) {
        gameBreakdownRef.current[currentGame] = { correct: 0, wrong: 0 };
      }
      if (isCorrect) {
        gameBreakdownRef.current[currentGame].correct += 1;
        setCorrect(prev => prev + 1);
        setStreakState(prev => prev + 1);
        triggerHaptic('light');
        playSound('correct', tier);
      } else {
        gameBreakdownRef.current[currentGame].wrong += 1;
        setWrong(prev => prev + 1);
        setStreakState(prev => Math.max(0, prev - 1));
        triggerHaptic('error');
        playSound('wrong');
      }

      // Feedback flash
      setAnswerFeedback(isCorrect ? 'correct' : 'wrong');
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setAnswerFeedback(null), isCorrect ? 200 : 400);

      assessmentQuestionsForGameRef.current += 1;

      // After N questions per game, switch to a random next game (like classic mode)
      if (assessmentQuestionsForGameRef.current >= ASSESSMENT_QUESTIONS_PER_GAME) {
        // Adaptive tier: adjust based on accuracy on this game
        const gameStats = gameBreakdownRef.current[currentGame];
        const gameCorrect = gameStats?.correct ?? 0;
        if (gameCorrect >= 5) {
          assessmentTierRef.current = Math.min(5, assessmentTierRef.current + 2);
        } else if (gameCorrect >= 4) {
          assessmentTierRef.current = Math.min(5, assessmentTierRef.current + 1);
        } else if (gameCorrect <= 1) {
          assessmentTierRef.current = Math.max(1, assessmentTierRef.current - 1);
        }

        assessmentQuestionsForGameRef.current = 0;

        // Random next game — same logic as classic mode
        const nextGame = selectNextGame();
        recentGamesRef.current = [...recentGamesRef.current.slice(-4), nextGame];
        setCurrentGame(nextGame);
        setGameKey(k => k + 1);
      }

      questionStartTimeRef.current = Date.now();
      return;
    }

    // ===== NORMAL MODE (Classic/Endless) =====

    // Art of surprise: every 10 questions, next question gets a tier boost
    if (totalQuestionsRef.current % 10 === 0) {
      setSurpriseTier(true);
    } else if (surpriseTier) {
      setSurpriseTier(false);
    }

    // Process through adaptive engine
    processAnswer(isCorrect, responseTime);

    // Answer feedback overlay — subtle green flash for correct, red edge glow for wrong (covers full wrong pause)
    setAnswerFeedback(isCorrect ? 'correct' : 'wrong');
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setAnswerFeedback(null), isCorrect ? 200 : 650);

    // Adaptive haptics — intensity escalates with streak & tension
    if (isCorrect) {
      const tension = tensionEngine.state.tension;
      if (streak >= 10 || tension > 1.5) {
        triggerHaptic('success');
      } else if (streak >= 5) {
        triggerHaptic('medium');
      } else {
        triggerHaptic('light');
      }
    } else {
      triggerHaptic('error');
    }

    if (isCorrect) {
      // Feed tension engine
      tensionEngine.processCorrectAnswer(currentGame, tier, Math.max(0.5, speedBonus));

      const streakMultiplier = Math.min(1 + streak * 0.1, 2);
      const speedMultiplier = adaptiveState.gameSpeed;
      const tierMultiplier = tier === 1 ? 1 : tier === 2 ? 1.5 : tier === 3 ? 2.5 : tier === 4 ? 3 : 5;
      const tensionBonus = tensionEngine.getTensionBonus();
      const basePoints = 10 + speedBonus;
      // Focus mode = enabledGames subset selected (not all games)
      const isFocusMode = enabledGames.length > 0 && enabledGames.length < MIXABLE_GAMES.length;
      const pointsModeMultiplier = mode === 'endless' ? 1.3 : isFocusMode ? 0.7 : 1.0;
      const points = Math.floor(basePoints * streakMultiplier * speedMultiplier * tierMultiplier * tensionBonus * pointsModeMultiplier);

      // Mode-based XP balancing: Endless > Classic > Focus
      const modeMultiplier = mode === 'endless' ? 1.5 : isFocusMode ? 0.6 : 1.0;
      // Within focus mode, SpeedMath & OperatorChaos reward more (math-heavy = harder)
      const focusGameBonus = isFocusMode && (currentGame === 'speedMath' || currentGame === 'operatorChaos') ? 1.4 : 1;
      // Endless streak bonus stacks on top — 2x after 20 streak
      const endlessBonus = mode === 'endless' && streak >= 20 ? 2 : 1;
      const xpGain = Math.floor(10 * tierMultiplier * modeMultiplier * focusGameBonus * endlessBonus * tensionBonus);

      // Show floating XP animation
      setFloatingXP({ amount: xpGain, key: Date.now() });
      if (floatingXPTimeoutRef.current) clearTimeout(floatingXPTimeoutRef.current);
      floatingXPTimeoutRef.current = setTimeout(() => setFloatingXP(null), 1000);

      // Accumulate session XP
      setSessionXP(prev => prev + xpGain);

      setScore(prev => prev + points);
      setLastPointsEarned(points);
      setStreakState(prev => prev + 1);
      setCorrect(prev => prev + 1);
      setWrongStreak(0); // Reset wrong streak on correct answer

      // Recover tier penalty — every 3 correct in a row reduces penalty by 1
      if (tierPenaltyRef.current > 0 && (streak + 1) % 3 === 0) {
        setTierPenalty(prev => Math.max(0, prev - 1));
      }

      // Track per-game breakdown for mastery
      if (!gameBreakdownRef.current[currentGame]) {
        gameBreakdownRef.current[currentGame] = { correct: 0, wrong: 0 };
      }
      gameBreakdownRef.current[currentGame].correct += 1;

      // Tension-aware game selection + switch
      const nextGame = selectNextGame();
      recentGamesRef.current = [...recentGamesRef.current.slice(-4), nextGame]; // Track recent 5
      // Edge glow on every game transition — uses next game's theme color
      const currDomain = GAME_TENSION_PROFILES[currentGame].primaryDomain;
      const nextDomain = GAME_TENSION_PROFILES[nextGame].primaryDomain;
      const crossDomain = currDomain !== nextDomain;
      // Map game to hsl values for edge glow
      const gameGlowColors: Record<string, string> = {
        speedMath: '200, 80%, 55%', colorMatch: '330, 70%, 55%', flashMemory: '175, 70%, 50%',
        paradoxFlow: '260, 65%, 55%', patternHunter: '35, 90%, 55%', operatorChaos: '15, 85%, 55%',
        spatialStack: '210, 75%, 55%', wordConnect: '160, 65%, 50%', suitDeception: '0, 75%, 55%',
        chimpMemory: '45, 85%, 55%',
      };
      const glowCss = gameGlowColors[nextGame] || '220, 80%, 55%';
      const glowIntensity = crossDomain && tensionEngine.state.tension > 0.8 ? 0.35 : 0.18;
      setEdgeGlow({ cssVar: glowCss, intensity: glowIntensity });
      if (edgeGlowTimeoutRef.current) clearTimeout(edgeGlowTimeoutRef.current);
      edgeGlowTimeoutRef.current = setTimeout(() => setEdgeGlow(null), crossDomain ? 1500 : 800);
      tensionEngine.switchToGame(nextGame);
      setIsTransitioning(true);
      setCurrentGame(nextGame);
      setGameKey(k => k + 1);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 80);
    } else {
      // Feed tension engine — wrong answer
      tensionEngine.processWrongAnswer();

      // Track per-game breakdown for mastery
      if (!gameBreakdownRef.current[currentGame]) {
        gameBreakdownRef.current[currentGame] = { correct: 0, wrong: 0 };
      }
      gameBreakdownRef.current[currentGame].wrong += 1;

      if (mode === 'endless') {
        // Check if player can use continue (first death only)
        if (!hasContinuedRef.current && onRequestContinue) {
          setPendingDeath(true);
          onRequestContinue(scoreRef.current, streak, correctRef.current, wrongRef.current + 1, sessionXPRef.current, gameBreakdownRef.current);
          return;
        }
        // Sudden death - increment wrong before game over
        setWrong(prev => prev + 1);
        setIsGameOver(true);
        return;
      }

      // Track consecutive wrong answers
      const newWrongStreak = wrongStreakRef.current + 1;
      setWrongStreak(newWrongStreak);
      
      // 3+ wrong in a row = Tier downgrade + Session XP reset
      if (newWrongStreak >= 3) {
        setTierPenalty(prev => prev + 1); // Downgrade effective tier by 1
        setSessionXP(0); // Reset session XP, not score
        setWrongStreak(0); // Reset wrong streak counter
        // Show visual feedback + screen shake
        setShowXPReset(true);
        setIsScreenShaking(true);
        if (xpResetTimeoutRef.current) clearTimeout(xpResetTimeoutRef.current);
        xpResetTimeoutRef.current = setTimeout(() => {
          setShowXPReset(false);
          setIsScreenShaking(false);
        }, 1500);
      }
      
      setScore(prev => Math.max(0, prev - 50));
      setStreakState(0);
      setWrong(prev => prev + 1);

      // 1. Immediately hide the current game (red pulse covers)
      setWrongPause(true);

      // 2. After 500ms red pulse, swap game behind the scenes
      const nextGame = selectNextGame();
      recentGamesRef.current = [...recentGamesRef.current.slice(-4), nextGame];
      if (wrongPauseTimeoutRef.current) clearTimeout(wrongPauseTimeoutRef.current);
      wrongPauseTimeoutRef.current = setTimeout(() => {
        tensionEngine.switchToGame(nextGame);
        setCurrentGame(nextGame);
        setGameKey(k => k + 1);
        questionStartTimeRef.current = Date.now();
      }, 400);

      // 3. After 650ms total, reveal new game
      if (wrongRevealTimeoutRef.current) clearTimeout(wrongRevealTimeoutRef.current);
      wrongRevealTimeoutRef.current = setTimeout(() => setWrongPause(false), 650);
      return;
    }

    // Reset question start time for next question
    questionStartTimeRef.current = Date.now();
  }, [streak, wrongStreak, mode, selectNextGame, processAnswer, adaptiveState.gameSpeed, currentGame, tensionEngine, isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tier-aware playSound wrapper — memoized to prevent child re-renders
  const playSoundWithTier = useCallback((type: 'correct' | 'wrong' | 'tick' | 'heartbeat') => {
    playSound(type, currentTier);
  }, [playSound, currentTier]);

  const renderCurrentGame = () => {
    const gameParams = getGameParams(currentGame);
    const overclock = tensionEngine.getOverclockForGame(currentGame);

    switch (currentGame) {
      case 'speedMath':
        return (
          <SpeedMath
            generateQuestion={() => generateMathQuestion(streak, mode, timeElapsed)}
            onAnswer={handleAnswer}
            playSound={playSoundWithTier}
            triggerHaptic={triggerHaptic}
            streak={streak}
            onScreenShake={handleScreenShake}
            tier={currentTier}
            overclockFactor={overclock}
          />
        );
      case 'colorMatch':
        return (
          <ColorMatch
            generateQuestion={generateColorQuestion}
            onAnswer={handleAnswer}
            playSound={playSoundWithTier}
            triggerHaptic={triggerHaptic}
            streak={streak}
            onScreenShake={handleScreenShake}
            tier={currentTier}
            overclockFactor={overclock}
          />
        );
      case 'paradoxFlow':
        return (
          <ParadoxFlow
            onAnswer={handleAnswer}
            playSound={playSoundWithTier}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
            followChance={gameParams.followChance}
            streak={streak}
            mode={mode}
            tier={currentTier}
            overclockFactor={overclock}
          />
        );
      case 'patternHunter':
        return (
          <PatternHunter
            onAnswer={handleAnswer}
            playSound={playSoundWithTier}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
            tier={currentTier}
            overclockFactor={overclock}
          />
        );
      case 'operatorChaos':
        return (
          <OperatorChaos
            onAnswer={handleAnswer}
            playSound={playSoundWithTier}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
            operatorCount={gameParams.operatorCount}
            maxNumber={gameParams.maxNumber}
            tier={currentTier}
            overclockFactor={overclock}
          />
        );
      case 'spatialStack':
        return (
          <SpatialStack
            onAnswer={handleAnswer}
            playSound={playSoundWithTier}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
            cubeCount={gameParams.cubeCount}
            tier={currentTier}
            overclockFactor={overclock}
          />
        );
      case 'wordConnect':
        return (
          <WordConnect
            onAnswer={handleAnswer}
            playSound={playSoundWithTier}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
            tier={currentTier}
            overclockFactor={overclock}
          />
        );
      case 'suitDeception': {
        return (
          <SuitDeception
            tier={currentTier}
            streak={streak}
            onAnswer={handleAnswer}
            playSound={playSoundWithTier}
            triggerHaptic={triggerHaptic}
            overclockFactor={overclock}
          />
        );
      }
      case 'chimpMemory': {
        return (
          <ChimpMemory
            tier={currentTier}
            onAnswer={handleAnswer}
            playSound={playSoundWithTier}
            triggerHaptic={triggerHaptic}
            overclockFactor={overclock}
          />
        );
      }
      case 'flashMemory': {
        return (
          <FlashMemory
            tier={currentTier}
            onAnswer={handleAnswer}
            playSound={playSoundWithTier}
            triggerHaptic={triggerHaptic}
            overclockFactor={overclock}
          />
        );
      }
      default:
        return null;
    }
  };

  // Phase color indicator
  const getPhaseColor = (phase: AdaptivePhase) => {
    switch (phase) {
      case 'warmup': return 'hsl(175, 60%, 50%)';
      case 'ramping': return 'hsl(280, 70%, 55%)';
      case 'overdrive': return 'hsl(25, 90%, 55%)';
    }
  };

  return (
    <div
      className={`min-h-screen-dynamic flex flex-col relative overflow-hidden ${isScreenShaking ? 'mgs-screen-shake' : ''}`}
    >
      {/* Heat Background - responds to game speed and tier */}
      <HeatBackground gameSpeed={adaptiveState.gameSpeed} phase={adaptiveState.phase} tier={currentTier} />

      {/* Dynamic Theme Background */}
      <div
        key={currentGame}
        className="absolute inset-0 pointer-events-none z-[1] mgs-fade-in"
        style={{ background: currentTheme.bgGradient }}
      />

      {/* Combo Mode Glow Border */}
      {isComboMode && (
        <div className="absolute inset-0 pointer-events-none z-50 combo-glow-fade-in">
          <div className="absolute inset-0 combo-glow-active" />
        </div>
      )}

      {/* God Tier Electric Aura */}
      {isGodTier && (
        <div className="absolute inset-0 pointer-events-none z-40 god-tier-fade-in">
          <div className="absolute inset-0 god-aura-active" />
          {/* Electric sparks at edges */}
          <div className="absolute top-0 left-1/4 w-px h-4 bg-destructive/80 spark-1-active" />
          <div className="absolute top-0 right-1/3 w-px h-6 bg-destructive/60 spark-2-active" />
        </div>
      )}

      {/* Edge Glow — game transitions, tier shifts, combos (CSS only) */}
      {edgeGlow && (
        <div
          key={`edge-${edgeGlow.cssVar}-${edgeGlow.intensity}`}
          className="absolute inset-0 pointer-events-none z-40 mgs-edge-glow"
          style={{
            boxShadow: `inset 0 0 70px hsl(${edgeGlow.cssVar} / ${edgeGlow.intensity}), inset 0 0 130px hsl(${edgeGlow.cssVar} / ${(edgeGlow.intensity * 0.5).toFixed(2)})`,
          }}
        />
      )}

      {/* XP Reset Warning (3+ wrong in a row) */}
      <AnimatePresence>
        {showXPReset && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{ duration: 0.3, repeat: 3 }}
              className="flex flex-col items-center gap-2 px-8 py-5 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, hsl(0, 85%, 20%) 0%, hsl(0, 70%, 15%) 100%)',
                border: '2px solid hsl(0, 85%, 50%)',
                boxShadow: '0 0 40px hsl(0, 85%, 50% / 0.5)',
              }}
            >
              <Zap className="w-10 h-10 text-destructive" />
              <span className="text-2xl font-black text-destructive uppercase tracking-wider">
                XP RESET
              </span>
              <span className="text-xs text-muted-foreground uppercase">
                3 wrong in a row
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Record Banner — rendered inline in HUD below */}

      {/* Endless Mode Indicator - Full Screen Red Vignette */}
      {mode === 'endless' && (
        <div
          className="absolute inset-0 pointer-events-none z-50 vignette-pulse-active"
          style={{
            boxShadow: 'inset 0 0 60px hsl(0 85% 50% / 0.15), inset 0 0 120px hsl(0 85% 50% / 0.06)',
          }}
        />
      )}

      {/* CLEAN MINIMALIST HUD - Safe area for Dynamic Island */}
      <div className="px-4 pt-2 pb-4 relative z-10 safe-top">
        {/* Floating XP Animation - hidden in assessment */}
        {!isAssessment && (
          <AnimatePresence>
            {floatingXP && (
              <FloatingXP
                amount={floatingXP.amount}
                tier={currentTier}
                x={0}
                y={80}
              />
            )}
          </AnimatePresence>
        )}

        {/* Top Row: Close + Pause (left) | Level Badge (right) */}
        <div className="flex items-center justify-between mb-4">
          {/* Left: Close (no pause in assessment) */}
          <div className="flex items-center gap-1">
            <button
              onClick={onQuit}
              className="p-2 -ml-2 opacity-40 hover:opacity-100 transition-opacity rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            {!isAssessment && (
              <button
                onClick={() => setIsPaused(true)}
                className="p-2 opacity-40 hover:opacity-100 transition-opacity rounded-full"
              >
                <Pause className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Right: Assessment badge OR Tier Indicator */}
          {isAssessment ? (
            <div className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border bg-cyan-500/20 border-cyan-500/50 text-cyan-400">
              {assessmentType === 'weekly' ? 'WEEKLY' : 'BASELINE'}
            </div>
          ) : (
            <div
              key={currentTier}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border mgs-tier-bounce ${
                currentTier === 5
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : currentTier === 4
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                  : currentTier === 3
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                  : currentTier === 2
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-teal-500/20 border-teal-500/50 text-teal-400'
              }`}
            >
              {currentTier === 5 ? 'GOD' : `LVL ${currentTier}`}
            </div>
          )}
        </div>

        {/* Hero Metric Section - Centered */}
        <div className="flex flex-col items-center mb-4">
          {isAssessment ? (
            <>
              {/* Assessment: Timer is the hero metric */}
              <span
                className={`font-mono text-5xl font-bold tracking-tight tabular-nums ${
                  timeLeft <= 10 ? 'mgs-countdown-pulse' : ''
                }`}
                style={{
                  color: timeLeft <= 10
                    ? 'hsl(0, 80%, 55%)'
                    : timeLeft <= 30
                      ? 'hsl(35, 95%, 55%)'
                      : 'hsl(var(--neon-cyan))',
                }}
              >
                {formatTime(timeLeft)}
              </span>
              {/* Current game name */}
              <span className="text-sm uppercase tracking-widest text-cyan-400/70 mt-2">
                {GAME_THEMES[currentGame]?.label ?? currentGame}
              </span>
            </>
          ) : (
            <>
              {/* Main Score (Classic) or Streak Count (Endless) */}
              <span
                key={scoreKey}
                className="font-mono text-7xl font-bold tracking-tight tabular-nums mgs-score-pop"
              >
                {mode === 'classic' ? score.toLocaleString() : streak}
              </span>

              {/* Timer for Classic Mode */}
              {mode === 'classic' && (
                <span
                  className={`font-mono mt-1 tabular-nums ${
                    timeLeft <= 10
                      ? 'text-2xl font-bold mgs-countdown-pulse'
                      : timeLeft <= 60
                        ? 'text-lg font-semibold'
                        : 'text-lg'
                  }`}
                  style={{
                    color: timeLeft <= 10
                      ? 'hsl(0, 80%, 55%)'
                      : timeLeft <= 60
                        ? 'hsl(35, 95%, 55%)'
                        : undefined,
                    textShadow: timeLeft <= 10
                      ? '0 0 20px hsl(0, 80%, 55%, 0.6)'
                      : timeLeft <= 60
                        ? '0 0 12px hsl(35, 95%, 55%, 0.3)'
                        : undefined,
                  }}
                >
                  {timeLeft <= 10 ? timeLeft : formatTime(timeLeft)}
                </span>
              )}

              {/* "STREAK" label for Endless */}
              {mode === 'endless' && (
                <span className="text-xs uppercase tracking-widest text-orange-500/70 mt-1">
                  Streak
                </span>
              )}
            </>
          )}
        </div>

        {/* Secondary Metrics Row - hidden in assessment */}
        {!isAssessment && <div className="flex items-center justify-center gap-6">
          {/* Best Score/Streak */}
          <div className="flex items-center gap-1.5 text-muted-foreground/50">
            <Trophy className="w-4 h-4" />
            <span className="font-mono text-sm font-medium tabular-nums">
              {mode === 'classic' ? bestScore.toLocaleString() : bestStreak}
            </span>
          </div>
          
          {/* Animated Streak Fire */}
          <div
            className="flex items-center gap-2"
            style={{ opacity: streak > 0 ? 1 : 0.4, transition: 'opacity 0.2s ease' }}
          >
            <div className={`relative ${streak > 0 ? 'fire-scale-active' : ''}`}>
              {/* Intense Glow for high streaks */}
              {streak > 0 && (
                <div
                  className="absolute inset-0 blur-lg rounded-full -m-2 fire-glow-active"
                  style={{
                    background: `radial-gradient(circle, hsl(${Math.max(0, 40 - streak * 2)}, 100%, 55%, 0.7) 0%, transparent 70%)`,
                  }}
                />
              )}
              <Flame
                className={`w-6 h-6 relative z-10 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground/30'}`}
                style={{ fill: streak > 0 ? `hsl(${Math.max(0, 40 - streak * 2)}, 100%, 50%)` : 'transparent' }}
              />

              {/* Spark particles for high streaks (10+) */}
              {streak >= 10 && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-1 h-1 rounded-full bg-yellow-400 spark-float-${i}`}
                      style={{ left: '50%', top: '30%' }}
                    />
                  ))}
                </>
              )}
            </div>
            <span
              className={`text-xl font-bold tabular-nums ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground/40'} ${streak > 0 ? 'streak-number-pulse' : ''}`}
            >
              {streak}
            </span>
          </div>

          {/* Session XP */}
          <div
            className={`flex items-center gap-1.5 ${mode === 'endless' && streak >= 20 ? 'xp-pulse-active' : ''}`}
          >
            <Zap className={`w-4 h-4 ${mode === 'endless' && streak >= 20 ? 'text-neon-gold' : 'text-muted-foreground/50'}`} />
            <span className={`font-mono text-sm font-medium tabular-nums ${mode === 'endless' && streak >= 20 ? 'text-neon-gold' : 'text-muted-foreground/50'}`}>
              {sessionXP}
            </span>
            {mode === 'endless' && streak >= 20 && (
              <span className="text-[9px] font-bold text-neon-gold px-1 py-0.5 rounded bg-neon-gold/20">
                2X
              </span>
            )}
          </div>

          {/* Day Streak Multiplier */}
          {streakMultiplier > 1.0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
              <Flame className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 tabular-nums">
                {streakMultiplier}x XP
              </span>
            </div>
          )}
        </div>}

        {/* Assessment: simple accuracy bar */}
        {isAssessment && (
          <div className="flex items-center justify-center gap-4 mt-1">
            <span className="text-xs text-muted-foreground/60 tabular-nums">{correct} correct</span>
            <span className="text-xs text-muted-foreground/40">|</span>
            <span className="text-xs text-muted-foreground/60 tabular-nums">{wrong} wrong</span>
          </div>
        )}

        {/* Wrong Streak Counter + New Record + Tension Bar — fixed height container to prevent layout shifts */}
        {!isAssessment && <div className="h-8 mt-1 flex flex-col items-center justify-start">
          {isNewRecord && wrongStreak === 0 && (
            <div
              className="flex items-center gap-2 px-4 py-1 rounded-full text-neon-gold font-black text-xs uppercase tracking-wider new-record-pulse mgs-fade-in"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--neon-gold) / 0.25), hsl(var(--neon-gold) / 0.08))',
                border: '1px solid hsl(var(--neon-gold) / 0.4)',
              }}
            >
              <Trophy className="w-3.5 h-3.5" />
              NEW RECORD
            </div>
          )}
          {mode === 'classic' && wrongStreak > 0 && (
            <div className="flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-destructive/20 border border-destructive/50 w-fit mgs-fade-in">
              <span className="text-[11px] font-bold text-destructive">
                {wrongStreak}/3 wrong
              </span>
            </div>
          )}

          {tensionEngine.state.tension > 0.15 && wrongStreak === 0 && (
            <div
              className="mx-auto w-40 h-1 rounded-full overflow-hidden bg-white/5 mt-2 mgs-fade-in"
            >
              <div
                className={`h-full rounded-full ${tensionEngine.state.tension > 2.0 ? 'tension-pulse-active' : ''}`}
                style={{
                  width: `${Math.min(100, (tensionEngine.state.tension / 3.0) * 100)}%`,
                  transition: 'width 0.3s ease',
                  background: tensionEngine.state.tension < 1.0
                    ? 'linear-gradient(90deg, hsl(200, 80%, 55%), hsl(210, 90%, 60%))'
                    : tensionEngine.state.tension < 2.0
                      ? 'linear-gradient(90deg, hsl(30, 90%, 55%), hsl(40, 95%, 60%))'
                      : 'linear-gradient(90deg, hsl(0, 85%, 55%), hsl(15, 90%, 50%))',
                  boxShadow: tensionEngine.state.tension > 2.0
                    ? '0 0 12px hsl(0, 85%, 55% / 0.6)'
                    : tensionEngine.state.tension > 1.0
                      ? '0 0 8px hsl(30, 90%, 55% / 0.4)'
                      : 'none',
                }}
              />
            </div>
          )}
        </div>}
      </div>

      {/* Theme accent line */}
      <div
        key={`accent-${currentGame}`}
        className="h-px mx-6 relative z-10 mgs-accent-in"
        style={{
          background: `linear-gradient(90deg, transparent, ${currentTheme.primaryColor}, transparent)`,
          transformOrigin: 'center',
        }}
      />

      {/* Answer Feedback Overlays */}
      <AnimatePresence>
        {answerFeedback === 'correct' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 pointer-events-none z-[55]"
            style={{
              background: 'radial-gradient(circle at center 40%, hsl(140 70% 50% / 0.15), transparent 70%)',
            }}
          />
        )}
        {answerFeedback === 'wrong' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 pointer-events-none z-[55]"
            style={{
              boxShadow: 'inset 0 0 80px hsl(0 85% 50% / 0.25), inset 0 0 120px hsl(0 85% 50% / 0.1)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Combo Callout */}
      {comboCallout && (
        <div
          key={comboCallout}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-[56]"
        >
          <span
            className="text-2xl font-black uppercase tracking-widest mgs-combo-callout"
            style={{
              color: streak >= 20 ? 'hsl(45, 95%, 55%)' : streak >= 10 ? 'hsl(280, 70%, 65%)' : 'hsl(210, 80%, 65%)',
              textShadow: `0 0 20px currentColor`,
            }}
          >
            {comboCallout}
          </span>
        </div>
      )}

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 z-[70] flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              className="relative flex flex-col items-center gap-10"
            >
              {/* Stats */}
              <div className="flex gap-8 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                >
                  <div className="text-3xl font-bold tabular-nums text-white/90">
                    {mode === 'classic' ? score.toLocaleString() : streak}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mt-1">
                    {mode === 'classic' ? 'Score' : 'Streak'}
                  </div>
                </motion.div>
                {mode === 'classic' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.35 }}
                  >
                    <div className="text-3xl font-bold tabular-nums text-white/90">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/25 mt-1">
                      Time Left
                    </div>
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.35 }}
                >
                  <div className="text-3xl font-bold tabular-nums text-white/90">
                    {sessionXP}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25 mt-1">
                    XP
                  </div>
                </motion.div>
              </div>

              {/* Resume */}
              {resumeCountdown !== null ? (
                <div className="flex flex-col items-center gap-3">
                  <span
                    key={resumeCountdown}
                    className="text-6xl font-black mgs-score-pop"
                    style={{
                      color: resumeCountdown === 3 ? 'hsl(140, 70%, 55%)' : resumeCountdown === 2 ? 'hsl(45, 95%, 55%)' : 'hsl(0, 80%, 55%)',
                      textShadow: `0 0 30px currentColor`,
                    }}
                  >
                    {resumeCountdown}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-white/30">Get ready...</span>
                </div>
              ) : (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setResumeCountdown(3);
                    playSound('countdownTick');
                    let count = 3;
                    if (resumeCountdownRef.current) clearInterval(resumeCountdownRef.current);
                    resumeCountdownRef.current = setInterval(() => {
                      count--;
                      if (count <= 0) {
                        if (resumeCountdownRef.current) clearInterval(resumeCountdownRef.current);
                        setResumeCountdown(null);
                        setGameKey(k => k + 1); // Remount game to kill stale timers
                        questionStartTimeRef.current = Date.now();
                        setIsPaused(false);
                        playSound('countdownGo');
                      } else {
                        setResumeCountdown(count);
                        playSound('countdownTick');
                      }
                    }, 1000);
                  }}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-white/15 bg-white/5"
                >
                  <Play className="w-5 h-5 text-white/70" />
                  <span className="text-sm font-medium uppercase tracking-wider text-white/70">Resume</span>
                </motion.button>
              )}

              {/* Quit */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                onClick={onQuit}
                className="text-xs uppercase tracking-wider text-white/20 hover:text-white/50 transition-colors"
              >
                End Session
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Area - Vertically Centered */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4 pb-4 safe-bottom">
        {startCountdown > 0 ? (
          <div className="flex flex-col items-center gap-3">
            <span
              key={startCountdown}
              className="text-7xl font-black mgs-score-pop"
              style={{
                color: startCountdown === 3 ? 'hsl(140, 70%, 55%)' : startCountdown === 2 ? 'hsl(45, 95%, 55%)' : 'hsl(0, 80%, 55%)',
                textShadow: `0 0 30px currentColor`,
              }}
            >
              {startCountdown}
            </span>
            <span className="text-xs uppercase tracking-widest text-white/30">Get ready</span>
          </div>
        ) : isGameOver ? (
          <div className="flex flex-col items-center gap-4 mgs-fade-in">
            <div
              className="text-4xl font-black uppercase tracking-wider game-over-pulse"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--neon-gold)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px hsl(var(--neon-cyan) / 0.4))',
              }}
            >
              {isAssessment ? 'ASSESSMENT COMPLETE' : mode === 'endless' ? 'GAME OVER' : 'TIME UP'}
            </div>
            <div className="text-muted-foreground text-sm uppercase tracking-wider">
              Calculating results...
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md relative" style={{ maxWidth: 'min(28rem, calc(100vw - 2rem))' }}>
            {/* Red pulse overlay during wrong answer pause */}
            {wrongPause && (
              <div className="absolute inset-0 z-10 flex items-center justify-center mgs-fade-in">
                <div
                  className="w-40 h-40 rounded-full mgs-wrong-pulse"
                  style={{
                    background: 'radial-gradient(circle, hsl(0 80% 50% / 0.18) 0%, hsl(0 80% 50% / 0.05) 50%, transparent 70%)',
                  }}
                />
              </div>
            )}
            {/* Game component — unmounted during pause/pendingDeath to kill internal timers */}
            {!isPaused && !pendingDeath && (
              <div style={{ opacity: wrongPause ? 0 : 1, filter: isTransitioning ? 'blur(2px)' : 'none', transition: 'opacity 0.15s ease, filter 0.08s ease' }}>
                <GameErrorBoundary onError={handleGameCrash} gameKey={`${currentGame}-${gameKey}`}>
                  <div key={`${currentGame}-${gameKey}`}>
                    {renderCurrentGame()}
                  </div>
                </GameErrorBoundary>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS keyframes for infinite animations (replaces Framer repeat:Infinity) */}
      <style>{`
        /* Combo Mode glow border */
        @keyframes combo-glow {
          0%, 100% { box-shadow: inset 0 0 80px hsl(var(--neon-gold) / 0.5), inset 0 0 120px hsl(var(--neon-magenta) / 0.3); }
          50% { box-shadow: inset 0 0 100px hsl(var(--neon-gold) / 0.7), inset 0 0 150px hsl(var(--neon-magenta) / 0.4); }
        }
        .combo-glow-active { animation: combo-glow 0.5s ease-in-out infinite; }
        .combo-glow-fade-in { animation: fadeIn 0.3s ease-out forwards; }

        /* God Tier aura */
        @keyframes god-aura {
          0%, 100% { box-shadow: inset 0 0 60px hsl(var(--destructive) / 0.4), inset 0 0 100px hsl(var(--destructive) / 0.2); }
          50% { box-shadow: inset 0 0 80px hsl(var(--destructive) / 0.6), inset 0 0 130px hsl(var(--destructive) / 0.3); }
        }
        .god-aura-active { animation: god-aura 1.2s ease-in-out infinite; }
        .god-tier-fade-in { animation: fadeIn 0.3s ease-out forwards; }

        /* Electric sparks */
        @keyframes spark-1 {
          0%, 27%, 100% { opacity: 0; transform: scaleY(0.5); }
          13.6% { opacity: 1; transform: scaleY(1); }
        }
        .spark-1-active { animation: spark-1 1.1s ease-in-out infinite; }

        @keyframes spark-2 {
          0%, 25%, 100% { opacity: 0; transform: scaleY(0.5); }
          12.5% { opacity: 1; transform: scaleY(1); }
        }
        .spark-2-active { animation: spark-2 1.6s ease-in-out infinite 0.3s; }

        /* Endless mode red vignette pulse */
        @keyframes vignette-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .vignette-pulse-active { animation: vignette-pulse 2s ease-in-out infinite; }

        /* Fire icon scale + bounce */
        @keyframes fire-scale {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.2) translateY(-3px); }
        }
        .fire-scale-active { animation: fire-scale 0.6s ease-in-out infinite; }

        /* Fire glow pulse */
        @keyframes fire-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.4); }
        }
        .fire-glow-active { animation: fire-glow 0.8s ease-in-out infinite; }

        /* Spark float particles (3 variants with staggered delays) */
        @keyframes spark-float-0 {
          0% { transform: translate(-3px, 0) scale(1); opacity: 1; }
          100% { transform: translate(-12px, -18px) scale(0.3); opacity: 0; }
        }
        @keyframes spark-float-1 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(0, -22px) scale(0.3); opacity: 0; }
        }
        @keyframes spark-float-2 {
          0% { transform: translate(3px, 0) scale(1); opacity: 1; }
          100% { transform: translate(12px, -26px) scale(0.3); opacity: 0; }
        }
        .spark-float-0 { animation: spark-float-0 0.6s ease-out infinite; }
        .spark-float-1 { animation: spark-float-1 0.6s ease-out infinite 0.15s; }
        .spark-float-2 { animation: spark-float-2 0.6s ease-out infinite 0.3s; }

        /* Streak number pulse */
        @keyframes streak-number-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .streak-number-pulse { animation: streak-number-pulse 1.2s ease-in-out infinite; }

        /* New record banner pulse */
        @keyframes new-record-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .new-record-pulse { animation: new-record-pulse 0.5s ease-in-out infinite; }

        /* Session XP pulse (endless mode, streak >= 20) */
        @keyframes xp-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .xp-pulse-active { animation: xp-pulse 0.5s ease-in-out infinite; }

        /* Tension bar opacity pulse (tension > 2.0) */
        @keyframes tension-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .tension-pulse-active { animation: tension-pulse 0.5s ease-in-out infinite; }

        /* Game over text pulse */
        @keyframes game-over-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .game-over-pulse { animation: game-over-pulse 1.5s ease-in-out infinite; }

        /* Shared fade-in utility */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* Screen shake — CSS replaces Framer x/y translate */
        @keyframes mgs-screen-shake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-3px, -2px); }
          40% { transform: translate(3px, 2px); }
          60% { transform: translate(-3px, 2px); }
          80% { transform: translate(3px, -2px); }
        }
        .mgs-screen-shake { animation: mgs-screen-shake 0.2s ease; }

        /* Fade in utility */
        @keyframes mgs-fade-in-anim {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .mgs-fade-in { animation: mgs-fade-in-anim 0.4s ease-out forwards; }

        /* Score pop — CSS transform scale, doesn't affect layout */
        @keyframes mgs-score-pop-anim {
          from { transform: scale(1.3); opacity: 0.5; }
          to { transform: scale(1); opacity: 1; }
        }
        .mgs-score-pop { animation: mgs-score-pop-anim 0.25s ease-out forwards; }

        /* Tier badge bounce */
        @keyframes mgs-tier-bounce-anim {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .mgs-tier-bounce { animation: mgs-tier-bounce-anim 0.4s ease-out forwards; }

        /* Theme accent line */
        @keyframes mgs-accent-in-anim {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 0.4; }
        }
        .mgs-accent-in { animation: mgs-accent-in-anim 0.35s cubic-bezier(0.25, 0.1, 0.25, 1) forwards; }

        /* Wrong pulse */
        @keyframes mgs-wrong-pulse-anim {
          0%, 100% { transform: scale(0.7); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        .mgs-wrong-pulse { animation: mgs-wrong-pulse-anim 0.65s ease-in-out; }

        /* Edge glow — simple CSS fade, box-shadow set inline */
        @keyframes mgs-edge-glow-fade {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
        .mgs-edge-glow {
          animation: mgs-edge-glow-fade 1.6s ease-out forwards;
        }

        /* Combo callout — scale up then fade out */
        @keyframes mgs-combo-callout-anim {
          0% { transform: scale(0.5); opacity: 0; }
          15% { transform: scale(1.15); opacity: 1; }
          30% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .mgs-combo-callout { animation: mgs-combo-callout-anim 1.2s ease-out forwards; }

        /* Countdown pulse for last 10 seconds */
        @keyframes mgs-countdown-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        .mgs-countdown-pulse { animation: mgs-countdown-pulse-anim 0.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
