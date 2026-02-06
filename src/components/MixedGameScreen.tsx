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
import { MiniGameType, GAME_THEMES, GameMode, MIXABLE_GAMES } from '@/types/game';
import { MathQuestion, ColorQuestion } from '@/hooks/useGameEngine';
import { useAdaptiveEngine, AdaptivePhase } from '@/hooks/useAdaptiveEngine';

interface MixedGameScreenProps {
  mode: GameMode;
  enabledGames: MiniGameType[];
  generateMathQuestion: (streak?: number, mode?: GameMode) => MathQuestion;
  generateColorQuestion: () => ColorQuestion;
  onGameEnd: (score: number, streak: number, correct: number, wrong: number, peakSpeed?: number, duration?: number) => void;
  onQuit: () => void;
  playSound: (type: 'correct' | 'wrong' | 'tick' | 'heartbeat') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  setStreak: (streak: number) => void;
  bestScore: number;
  bestStreak: number;
  startTier?: number;
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
    const tierStreakMap: Record<number, number> = { 1: 0, 2: 6, 3: 13, 4: 21, 5: 31 };
    return tierStreakMap[startTier] || 0;
  });
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(mode === 'classic' ? CLASSIC_DURATION : 0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [scoreKey, setScoreKey] = useState(0);
  const [showComboText, setShowComboText] = useState(false);
  const [hasTriggeredNewRecord, setHasTriggeredNewRecord] = useState(false);
  
  // Is God Tier active (tier 4+)
  const isGodTier = startTier >= 4;
  
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
      onGameEnd(score, streak, correct, wrong, adaptiveState.peakGameSpeed, getSessionDuration());
    }
  }, [isGameOver, score, streak, correct, wrong, onGameEnd, adaptiveState.peakGameSpeed, getSessionDuration]);

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

  const handleAnswer = useCallback((isCorrect: boolean, speedBonus: number = 0, tier: number = 1) => {
    const responseTime = Date.now() - questionStartTimeRef.current;
    
    // Process through adaptive engine
    processAnswer(isCorrect, responseTime);
    
    if (isCorrect) {
      const streakMultiplier = Math.min(1 + streak * 0.1, 2);
      const speedMultiplier = adaptiveState.gameSpeed;
      const tierMultiplier = tier === 1 ? 1 : tier === 2 ? 1.5 : tier === 3 ? 2.5 : 3;
      const basePoints = 10 + speedBonus;
      const points = Math.floor(basePoints * streakMultiplier * speedMultiplier * tierMultiplier);
      
      setScore(prev => prev + points);
      setStreakState(prev => prev + 1);
      setCorrect(prev => prev + 1);
      
      // Switch to next random game
      setCurrentGame(selectNextGame());
    } else {
      if (mode === 'endless') {
        // Sudden death - increment wrong before game over
        setWrong(prev => prev + 1);
        setIsGameOver(true);
        return;
      }
      
      setScore(prev => Math.max(0, prev - 50));
      setStreakState(0);
      setWrong(prev => prev + 1);
      
      // Still switch game on wrong answer in classic mode
      setCurrentGame(selectNextGame());
    }
    
    // Reset question start time for next question
    questionStartTimeRef.current = Date.now();
  }, [streak, mode, selectNextGame, processAnswer, adaptiveState.gameSpeed]);

  const renderCurrentGame = () => {
    const gameParams = getGameParams(currentGame);
    
    switch (currentGame) {
      case 'speedMath':
        return (
          <SpeedMath
            generateQuestion={() => generateMathQuestion(streak, mode)}
            onAnswer={handleAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
            streak={streak}
            onScreenShake={handleScreenShake}
          />
        );
      case 'colorMatch':
        return (
          <ColorMatch
            generateQuestion={generateColorQuestion}
            onAnswer={handleAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
            streak={streak}
            onScreenShake={handleScreenShake}
          />
        );
      case 'paradoxFlow':
        return (
          <ParadoxFlow
            onAnswer={handleAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
            followChance={gameParams.followChance}
            streak={streak}
            mode={mode}
          />
        );
      case 'patternHunter':
        return (
          <PatternHunter
            onAnswer={handleAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
          />
        );
      case 'nBackGhost':
        return (
          <NBackGhost
            onAnswer={handleAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
            nBack={gameParams.nBack}
            runeCount={gameParams.runeCount}
          />
        );
      case 'operatorChaos':
        return (
          <OperatorChaos
            onAnswer={handleAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
            operatorCount={gameParams.operatorCount}
            maxNumber={gameParams.maxNumber}
          />
        );
      case 'spatialStack':
        return (
          <SpatialStack
            onAnswer={handleAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
            cubeCount={gameParams.cubeCount}
          />
        );
      case 'wordConnect':
        return (
          <WordConnect
            onAnswer={handleAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
          />
        );
      case 'suitDeception': {
        const calculatedTier = streak < 6 ? 1 : streak < 13 ? 2 : streak < 21 ? 3 : streak < 31 ? 4 : 5;
        return (
          <SuitDeception
            tier={calculatedTier}
            streak={streak}
            onAnswer={handleAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
          />
        );
      }
      case 'chimpMemory': {
        const calculatedTier = streak < 6 ? 1 : streak < 13 ? 2 : streak < 21 ? 3 : streak < 31 ? 4 : 5;
        return (
          <ChimpMemory
            tier={calculatedTier}
            onAnswer={handleAnswer}
            playSound={playSound}
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
      {/* Heat Background - responds to game speed */}
      <HeatBackground gameSpeed={adaptiveState.gameSpeed} phase={adaptiveState.phase} />

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

      {/* CLEAN MINIMALIST HUD */}
      <div className="px-4 pt-4 pb-3 relative z-10">
        {/* Top Row: Close | Score | Best */}
        <div className="flex items-start justify-between">
          {/* Left: Close Button */}
          <button 
            onClick={onQuit}
            className="p-2 -ml-2 opacity-40 hover:opacity-100 transition-opacity rounded-full"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Center: Hero Score + Timer + Streak */}
          <div className="flex flex-col items-center">
            {/* Main Score */}
            <motion.span
              key={scoreKey}
              initial={{ scale: 1.2, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-mono text-6xl font-bold tracking-tight"
            >
              {mode === 'classic' ? score : streak}
            </motion.span>
            
            {/* Timer for Classic Mode */}
            {mode === 'classic' && (
              <span className="font-mono text-sm text-muted-foreground mt-1">
                {formatTime(timeLeft)}
              </span>
            )}
            
            {/* Streak Fire */}
            {streak > 0 && (
              <motion.div 
                className={`flex items-center gap-1 mt-1 ${
                  adaptiveState.gameSpeed >= 1.5 ? 'text-orange-400' : 'text-muted-foreground'
                }`}
                animate={adaptiveState.gameSpeed >= 1.5 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Flame className={`w-4 h-4 ${adaptiveState.gameSpeed >= 1.5 ? 'fill-orange-400' : ''}`} />
                <span className="text-sm font-bold">{streak}</span>
              </motion.div>
            )}
          </div>

          {/* Right: Best Score */}
          <div className="flex items-center gap-1 text-muted-foreground opacity-60">
            <span className="text-sm">🏆</span>
            <span className="font-mono text-sm font-medium">
              {mode === 'classic' ? bestScore : bestStreak}
            </span>
          </div>
        </div>
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
