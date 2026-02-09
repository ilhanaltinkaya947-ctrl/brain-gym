import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Clock, Zap, Target, X, Trophy, Infinity as InfinityIcon, Skull, Flame } from 'lucide-react';
import { SpeedMath } from './SpeedMath';
import { ColorMatch } from './ColorMatch';
import { PatternHunter } from './PatternHunter';
import { ParadoxFlow } from './games/ParadoxFlow';
import { NBackGhost } from './games/NBackGhost';
import { OperatorChaos } from './games/OperatorChaos';
import { SpatialStack } from './games/SpatialStack';
import { WordConnect } from './games/WordConnect';
import { SuitDeception } from './games/SuitDeception';
import { ChimpMemory } from './games/ChimpMemory';
import { HeatBackground } from './HeatBackground';
import { FloatingXP } from './XPGainAnimation';
import { MiniGameType, GAME_THEMES, GameMode, MIXABLE_GAMES } from '@/types/game';
import { MathQuestion, ColorQuestion, getDifficultyTier, getTierName } from '@/hooks/useGameEngine';
import { useAdaptiveEngine, AdaptivePhase } from '@/hooks/useAdaptiveEngine';

interface MixedGameScreenProps {
  mode: GameMode;
  enabledGames: MiniGameType[];
  generateMathQuestion: (streak?: number, mode?: GameMode, timeElapsed?: number) => MathQuestion;
  generateColorQuestion: () => ColorQuestion;
  onGameEnd: (score: number, streak: number, correct: number, wrong: number, peakSpeed?: number, duration?: number, sessionXP?: number) => void;
  onQuit: () => void;
  playSound: (type: 'correct' | 'wrong' | 'tick' | 'heartbeat', tier?: number) => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  setStreak: (streak: number) => void;
  bestScore: number;
  bestStreak: number;
  startTier?: number;
  onRequestContinue?: (score: number, streak: number, correct: number, wrong: number, sessionXP: number) => void;
  continueGranted?: boolean;
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
}: MixedGameScreenProps) => {
  // Always use MIXABLE_GAMES directly for random game selection to ensure new games appear
  const [currentGame, setCurrentGame] = useState<MiniGameType>(() => {
    // Use MIXABLE_GAMES directly, not enabledGames which might be stale from localStorage
    const games = MIXABLE_GAMES;
    return games[Math.floor(Math.random() * games.length)];
  });
  const [score, setScore] = useState(0);
  const [streak, setStreakState] = useState(() => {
    // Initialize streak based on starting tier
    const tierStreakMap: Record<number, number> = { 1: 0, 2: 9, 3: 19, 4: 31, 5: 46 };
    return tierStreakMap[startTier] || 0;
  });
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0); // Track consecutive wrong answers
  const [sessionXP, setSessionXP] = useState(0); // XP earned during this session (resets on 3+ wrong streak)
  const [timeLeft, setTimeLeft] = useState(mode === 'classic' ? CLASSIC_DURATION : 0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [scoreKey, setScoreKey] = useState(0);
  const [showComboText, setShowComboText] = useState(false);
  const [hasTriggeredNewRecord, setHasTriggeredNewRecord] = useState(false);
  const [floatingXP, setFloatingXP] = useState<{ amount: number; key: number } | null>(null);
  const [showXPReset, setShowXPReset] = useState(false); // Visual feedback for XP reset
  const [hasContinued, setHasContinued] = useState(false); // Track if continue was used this session
  const [pendingDeath, setPendingDeath] = useState(false); // Waiting for continue decision
  
  // Calculate time elapsed for Classic mode (180 - timeLeft)
  const timeElapsed = mode === 'classic' ? CLASSIC_DURATION - timeLeft : undefined;
  
  // Calculate current tier based on streak, mode, and time elapsed
  // Streak >= 5 gives a +1 tier boost for difficulty
  const calculatedTier = getDifficultyTier(streak, mode, timeElapsed);
  const streakBoost = streak >= 5 ? 1 : 0; // Combo mode boosts difficulty
  const currentTier = Math.min(5, Math.max(startTier, calculatedTier) + streakBoost);
  const tierName = getTierName(currentTier);
  
  // Is God Tier active (tier 4+)
  const isGodTier = startTier >= 4 || currentTier >= 4;
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef(Date.now());

  // Adaptive engine for dynamic difficulty
  const { state: adaptiveState, processAnswer, getGameParams, getSessionDuration, reset: resetAdaptive } = useAdaptiveEngine();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const gameProgress = mode === 'classic' 
    ? ((CLASSIC_DURATION - timeLeft) / CLASSIC_DURATION) * 100 
    : Math.min(streak * 5, 100);
  
  const isComboMode = streak >= 5;
  const isNewRecord = mode === 'classic' 
    ? score > bestScore && bestScore > 0
    : streak > bestStreak && bestStreak > 0;
  const currentTheme = GAME_THEMES[currentGame];

  // Classic mode timer
  useEffect(() => {
    if (mode === 'classic' && !isGameOver) {
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
  }, [mode, isGameOver]);

  // Adaptive heartbeat based on game speed (overdrive mode)
  useEffect(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    
    if (!isGameOver && adaptiveState.phase === 'overdrive') {
      const interval = Math.max(300, 1000 / adaptiveState.gameSpeed);
      
      heartbeatRef.current = setInterval(() => {
        playSound('heartbeat');
      }, interval);
    } else if (mode === 'endless' && !isGameOver && streak > 5) {
      const interval = Math.max(400, 1000 - streak * 30);
      
      heartbeatRef.current = setInterval(() => {
        playSound('heartbeat');
      }, interval);
    }
    
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [mode, streak, isGameOver, playSound, adaptiveState.phase, adaptiveState.gameSpeed]);

  // Game end handler
  useEffect(() => {
    if (isGameOver) {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      onGameEnd(score, streak, correct, wrong, adaptiveState.peakGameSpeed, getSessionDuration(), sessionXP);
    }
  }, [isGameOver, score, streak, correct, wrong, onGameEnd, adaptiveState.peakGameSpeed, getSessionDuration, sessionXP]);

  // Note: Continue granted effect moved below selectNextGame definition

  // Update sound pitch based on streak
  useEffect(() => {
    setStreak(streak);
  }, [streak, setStreak]);

  // Trigger new record confetti
  useEffect(() => {
    if (isNewRecord && !hasTriggeredNewRecord) {
      setHasTriggeredNewRecord(true);
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#00D4FF', '#FF00FF', '#FFD700'],
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#00D4FF', '#FF00FF', '#FFD700'],
        });

        if (Date.now() < end && !isGameOver) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isNewRecord, hasTriggeredNewRecord, isGameOver]);

  // Score pop animation
  useEffect(() => {
    setScoreKey(prev => prev + 1);
  }, [score]);

  // Show combo text
  useEffect(() => {
    if (streak >= 5 && streak % 5 === 0) {
      setShowComboText(true);
      setTimeout(() => setShowComboText(false), 1000);
    }
  }, [streak]);

  const handleScreenShake = useCallback(() => {
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 200);
  }, []);

  const selectNextGame = useCallback(() => {
    // Always use MIXABLE_GAMES directly for consistent game rotation
    const mixable = MIXABLE_GAMES;
    if (mixable.length > 1) {
      const others = mixable.filter(g => g !== currentGame);
      return others[Math.floor(Math.random() * others.length)];
    }
    return currentGame;
  }, [currentGame]);

  // Handle continue granted from parent (Endless mode second chance)
  useEffect(() => {
    if (continueGranted && pendingDeath) {
      setPendingDeath(false);
      setHasContinued(true);
      // Resume: generate next question, keep streak and score
      setCurrentGame(selectNextGame());
      questionStartTimeRef.current = Date.now();
    }
  }, [continueGranted, pendingDeath, selectNextGame]);

  const handleAnswer = useCallback((isCorrect: boolean, speedBonus: number = 0, tier: number = 1) => {
    const responseTime = Date.now() - questionStartTimeRef.current;
    
    // Process through adaptive engine
    processAnswer(isCorrect, responseTime);
    
    if (isCorrect) {
      const streakMultiplier = Math.min(1 + streak * 0.1, 2);
      const speedMultiplier = adaptiveState.gameSpeed;
      const tierMultiplier = tier === 1 ? 1 : tier === 2 ? 1.5 : tier === 3 ? 2.5 : tier === 4 ? 3 : 5;
      const basePoints = 10 + speedBonus;
      const points = Math.floor(basePoints * streakMultiplier * speedMultiplier * tierMultiplier);
      
      // Calculate XP gain - 2x multiplier in Endless mode after streak > 20
      const endlessBonus = mode === 'endless' && streak >= 20 ? 2 : 1;
      const xpGain = Math.floor(10 * tierMultiplier * endlessBonus);
      
      // Show floating XP animation
      setFloatingXP({ amount: xpGain, key: Date.now() });
      setTimeout(() => setFloatingXP(null), 1000);
      
      // Accumulate session XP
      setSessionXP(prev => prev + xpGain);
      
      setScore(prev => prev + points);
      setStreakState(prev => prev + 1);
      setCorrect(prev => prev + 1);
      setWrongStreak(0); // Reset wrong streak on correct answer
      
      // Switch to next random game
      setCurrentGame(selectNextGame());
    } else {
      if (mode === 'endless') {
        // Check if player can use continue (first death only)
        if (!hasContinued && onRequestContinue) {
          setPendingDeath(true);
          onRequestContinue(score, streak, correct, wrong + 1, sessionXP);
          return;
        }
        // Sudden death - increment wrong before game over
        setWrong(prev => prev + 1);
        setIsGameOver(true);
        return;
      }
      
      // Track consecutive wrong answers
      const newWrongStreak = wrongStreak + 1;
      setWrongStreak(newWrongStreak);
      
      // 3+ wrong in a row in Classic mode = Session XP reset!
      if (newWrongStreak >= 3) {
        setSessionXP(0); // Reset session XP, not score
        setWrongStreak(0); // Reset wrong streak counter
        // Show visual feedback + screen shake
        setShowXPReset(true);
        setIsScreenShaking(true);
        setTimeout(() => {
          setShowXPReset(false);
          setIsScreenShaking(false);
        }, 1500);
      }
      
      setScore(prev => Math.max(0, prev - 50));
      setStreakState(0);
      setWrong(prev => prev + 1);
      
      // Still switch game on wrong answer in classic mode
      setCurrentGame(selectNextGame());
    }
    
    // Reset question start time for next question
    questionStartTimeRef.current = Date.now();
  }, [streak, wrongStreak, mode, selectNextGame, processAnswer, adaptiveState.gameSpeed]);

  const renderCurrentGame = () => {
    const gameParams = getGameParams(currentGame);
    
    // Tier-aware playSound wrapper
    const playSoundWithTier = (type: 'correct' | 'wrong' | 'tick' | 'heartbeat') => {
      playSound(type, currentTier);
    };
    
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
          />
        );
      case 'nBackGhost':
        return (
          <NBackGhost
            onAnswer={handleAnswer}
            playSound={playSoundWithTier}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
            nBack={gameParams.nBack}
            runeCount={gameParams.runeCount}
            tier={currentTier}
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
    <motion.div 
      className="min-h-screen-dynamic flex flex-col safe-all relative overflow-hidden"
      animate={isScreenShaking ? { x: [-3, 3, -3, 3, 0], y: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Heat Background - responds to game speed and tier */}
      <HeatBackground gameSpeed={adaptiveState.gameSpeed} phase={adaptiveState.phase} tier={currentTier} />

      {/* Dynamic Theme Background */}
      <motion.div
        key={currentGame}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: currentTheme.bgGradient }}
      />

      {/* Combo Mode Glow Border */}
      <AnimatePresence>
        {isComboMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-50"
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                boxShadow: [
                  'inset 0 0 80px hsl(var(--neon-gold) / 0.5), inset 0 0 120px hsl(var(--neon-magenta) / 0.3)',
                  'inset 0 0 100px hsl(var(--neon-gold) / 0.7), inset 0 0 150px hsl(var(--neon-magenta) / 0.4)',
                  'inset 0 0 80px hsl(var(--neon-gold) / 0.5), inset 0 0 120px hsl(var(--neon-magenta) / 0.3)',
                ],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* God Tier Electric Aura */}
      <AnimatePresence>
        {isGodTier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-40"
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                boxShadow: [
                  'inset 0 0 60px hsl(var(--destructive) / 0.4), inset 0 0 100px hsl(var(--destructive) / 0.2)',
                  'inset 0 0 80px hsl(var(--destructive) / 0.6), inset 0 0 130px hsl(var(--destructive) / 0.3)',
                  'inset 0 0 60px hsl(var(--destructive) / 0.4), inset 0 0 100px hsl(var(--destructive) / 0.2)',
                ],
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Electric sparks at edges */}
            <motion.div
              className="absolute top-0 left-1/4 w-px h-4 bg-destructive/80"
              animate={{ opacity: [0, 1, 0], scaleY: [0.5, 1, 0.5] }}
              transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 0.8 }}
            />
            <motion.div
              className="absolute top-0 right-1/3 w-px h-6 bg-destructive/60"
              animate={{ opacity: [0, 1, 0], scaleY: [0.5, 1, 0.5] }}
              transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 1.2, delay: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Combo Text */}
      <AnimatePresence>
        {showComboText && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.5 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <span className="text-5xl font-black text-gradient-gold drop-shadow-lg">
              +{streak * 2} COMBO!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* New Record Banner */}
      <AnimatePresence>
        {isNewRecord && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-50"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="flex items-center gap-2 px-5 py-2 rounded-full border-glow-gold text-neon-gold font-black text-sm uppercase tracking-wider"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--neon-gold) / 0.3), hsl(var(--neon-gold) / 0.1))',
              }}
            >
              <Trophy className="w-4 h-4" />
              NEW RECORD!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Endless Mode Indicator - Subtle Red Line at Top */}
      {mode === 'endless' && (
        <motion.div 
          className="absolute top-0 left-0 right-0 h-1 bg-destructive z-50"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* CLEAN MINIMALIST HUD - Safe area for Dynamic Island */}
      <div className="px-4 pt-12 pb-4 relative z-10">
        {/* Floating XP Animation */}
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
        
        {/* Top Row: Close Button (left) | Level Badge (right) */}
        <div className="flex items-center justify-between mb-4">
          {/* Left: Close Button Only */}
          <button 
            onClick={onQuit}
            className="p-2 -ml-2 opacity-40 hover:opacity-100 transition-opacity rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Right: Tier Indicator Badge */}
          <motion.div
            key={currentTier}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
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
            {currentTier === 5 ? '👑 GOD' : `LVL ${currentTier}`}
          </motion.div>
        </div>

        {/* Hero Metric Section - Centered */}
        <div className="flex flex-col items-center mb-4">
          {/* Main Score (Classic) or Streak Count (Endless) */}
          <motion.span
            key={scoreKey}
            initial={{ scale: 1.2, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-mono text-7xl font-bold tracking-tight tabular-nums"
          >
            {mode === 'classic' ? score.toLocaleString() : streak}
          </motion.span>
          
          {/* Timer for Classic Mode */}
          {mode === 'classic' && (
            <span className="font-mono text-lg text-muted-foreground/70 mt-1 tabular-nums">
              {formatTime(timeLeft)}
            </span>
          )}
          
          {/* "STREAK" label for Endless */}
          {mode === 'endless' && (
            <span className="text-xs uppercase tracking-widest text-orange-500/70 mt-1">
              Streak
            </span>
          )}
        </div>

        {/* Secondary Metrics Row */}
        <div className="flex items-center justify-center gap-6">
          {/* Best Score/Streak */}
          <div className="flex items-center gap-1.5 text-muted-foreground/50">
            <Trophy className="w-4 h-4" />
            <span className="font-mono text-sm font-medium tabular-nums">
              {mode === 'classic' ? bestScore.toLocaleString() : bestStreak}
            </span>
          </div>
          
          {/* Animated Streak Fire */}
          <motion.div 
            className="flex items-center gap-2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: streak > 0 ? 1 : 0.4 }}
          >
            <motion.div
              className="relative"
              animate={streak > 0 ? {
                scale: [1, 1.2, 1],
                y: [0, -3, 0],
              } : {}}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Intense Glow for high streaks */}
              {streak > 0 && (
                <motion.div
                  className="absolute inset-0 blur-lg rounded-full -m-2"
                  animate={{ 
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.4, 1],
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
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
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-yellow-400"
                      style={{ left: '50%', top: '30%' }}
                      animate={{
                        x: [(i - 1) * 3, (i - 1) * 12],
                        y: [0, -18 - i * 4],
                        opacity: [1, 0],
                        scale: [1, 0.3],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>
            <motion.span 
              className={`text-xl font-bold tabular-nums ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground/40'}`}
              animate={streak > 0 ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              {streak}
            </motion.span>
          </motion.div>
          
          {/* Session XP */}
          <motion.div 
            className="flex items-center gap-1.5"
            animate={mode === 'endless' && streak >= 20 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
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
          </motion.div>
        </div>
        
        {/* Wrong Streak Counter (Classic Mode Only) */}
        {mode === 'classic' && wrongStreak > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-1 mt-3 px-3 py-1 rounded-full bg-destructive/20 border border-destructive/50 mx-auto w-fit"
          >
            <span className="text-[11px] font-bold text-destructive">
              ⚠️ {wrongStreak}/3 wrong
            </span>
          </motion.div>
        )}
      </div>

      {/* Game Area - Vertically Centered */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4 pb-safe">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentGame}-${adaptiveState.questionsAnswered}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md"
          >
            {renderCurrentGame()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
