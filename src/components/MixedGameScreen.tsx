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
import { HeatBackground } from './HeatBackground';
import { MiniGameType, GAME_THEMES, GameMode, MIXABLE_GAMES } from '@/types/game';
import { MathQuestion, ColorQuestion } from '@/hooks/useGameEngine';
import { useAdaptiveEngine, AdaptivePhase } from '@/hooks/useAdaptiveEngine';

interface MixedGameScreenProps {
  mode: GameMode;
  enabledGames: MiniGameType[];
  generateMathQuestion: () => MathQuestion;
  generateColorQuestion: () => ColorQuestion;
  onGameEnd: (score: number, streak: number, correct: number, wrong: number, peakSpeed?: number, duration?: number) => void;
  onQuit: () => void;
  playSound: (type: 'correct' | 'wrong' | 'tick' | 'heartbeat') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  setStreak: (streak: number) => void;
  bestScore: number;
  bestStreak: number;
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
}: MixedGameScreenProps) => {
  const [currentGame, setCurrentGame] = useState<MiniGameType>(() => {
    const mixable = enabledGames.filter(g => MIXABLE_GAMES.includes(g));
    return mixable[Math.floor(Math.random() * mixable.length)];
  });
  const [score, setScore] = useState(0);
  const [streak, setStreakState] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(mode === 'classic' ? CLASSIC_DURATION : 0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [scoreKey, setScoreKey] = useState(0);
  const [showComboText, setShowComboText] = useState(false);
  const [hasTriggeredNewRecord, setHasTriggeredNewRecord] = useState(false);
  
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
    const mixable = enabledGames.filter(g => MIXABLE_GAMES.includes(g));
    if (mixable.length > 1) {
      const others = mixable.filter(g => g !== currentGame);
      return others[Math.floor(Math.random() * others.length)];
    }
    return currentGame;
  }, [enabledGames, currentGame]);

  const handleAnswer = useCallback((isCorrect: boolean, speedBonus: number = 0) => {
    const responseTime = Date.now() - questionStartTimeRef.current;
    
    // Process through adaptive engine
    processAnswer(isCorrect, responseTime);
    
    if (isCorrect) {
      const streakMultiplier = Math.min(1 + streak * 0.1, 2);
      const speedMultiplier = adaptiveState.gameSpeed;
      const basePoints = 10 + speedBonus;
      const points = Math.floor(basePoints * streakMultiplier * speedMultiplier);
      
      setScore(prev => prev + points);
      setStreakState(prev => prev + 1);
      setCorrect(prev => prev + 1);
      
      // Switch to next random game
      setCurrentGame(selectNextGame());
    } else {
      if (mode === 'endless') {
        // Sudden death - game over immediately
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
            generateQuestion={generateMathQuestion}
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
      className="min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden"
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

      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-6 pb-4 relative z-10"
      >
        {/* Best Score/Streak - Top Right */}
        <div className="absolute top-6 right-14 flex items-center gap-1 text-muted-foreground">
          <Trophy className="w-4 h-4 text-neon-gold" />
          <span className="font-mono text-sm font-bold">
            BEST: {mode === 'classic' ? bestScore : bestStreak}
          </span>
        </div>

        {/* Quit button */}
        <button 
          onClick={onQuit}
          className="absolute top-6 left-6 p-2 rounded-full bg-muted/30 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors border border-border/30"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Game type indicator */}
        <div className="text-center mb-4 mt-8">
          <motion.span
            key={currentGame}
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="inline-block px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border"
            style={{
              background: `linear-gradient(90deg, ${currentTheme.primaryColor}33, ${currentTheme.primaryColor}11)`,
              borderColor: `${currentTheme.primaryColor}80`,
              color: currentTheme.primaryColor,
            }}
          >
            {currentTheme.icon} {currentTheme.label}
          </motion.span>
        </div>

        {/* Mode + Phase indicator */}
        <div className="flex justify-center gap-4 mb-3">
          {mode === 'endless' ? (
            <div className="flex items-center gap-2 text-destructive text-xs uppercase tracking-wider">
              <Skull className="w-4 h-4" />
              <span className="font-bold">Sudden Death</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span className="font-bold">Classic Mode</span>
            </div>
          )}
          
          {/* Adaptive Phase Badge */}
          <div 
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs uppercase tracking-wider font-bold border"
            style={{
              color: getPhaseColor(adaptiveState.phase),
              borderColor: `${getPhaseColor(adaptiveState.phase)}50`,
              background: `${getPhaseColor(adaptiveState.phase)}15`,
            }}
          >
            <Flame className="w-3 h-3" />
            {adaptiveState.phase}
            <span className="font-mono">×{adaptiveState.gameSpeed.toFixed(1)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden mb-4 border border-border/30">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${currentTheme.primaryColor}, ${currentTheme.accentColor})`,
              boxShadow: `0 0 10px ${currentTheme.primaryColor}80`,
            }}
            animate={{ width: `${gameProgress}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          {mode === 'classic' ? (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <InfinityIcon className="w-4 h-4 text-secondary" />
              <span className="font-mono text-lg font-bold text-secondary">∞</span>
            </div>
          )}

          {/* Live Score with Pop Animation */}
          <motion.div
            key={scoreKey}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-mono text-lg font-black text-glow-cyan">
              {mode === 'classic' ? score : streak}
            </span>
          </motion.div>

          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-secondary" />
            <span className="font-mono text-lg">
              <span className="text-success">{correct}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-destructive">{wrong}</span>
            </span>
          </div>
        </div>

        {/* Streak indicator */}
        {streak >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mt-3"
          >
            <motion.span 
              animate={isComboMode ? { 
                boxShadow: ['0 0 15px hsl(var(--neon-gold) / 0.5)', '0 0 30px hsl(var(--neon-gold) / 0.8)', '0 0 15px hsl(var(--neon-gold) / 0.5)']
              } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
              className={`inline-block px-4 py-1.5 rounded-full text-sm font-black ${
                isComboMode 
                  ? 'border-glow-gold text-neon-gold' 
                  : 'bg-primary/20 text-primary border border-primary/30'
              }`}
              style={{
                background: isComboMode 
                  ? 'linear-gradient(135deg, hsl(var(--neon-gold) / 0.3), hsl(var(--neon-gold) / 0.1))'
                  : undefined,
              }}
            >
              🔥 {streak} streak! ({Math.min(1 + streak * 0.1, 2).toFixed(1)}x)
            </motion.span>
          </motion.div>
        )}
      </motion.div>

      {/* Game Area */}
      <div className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentGame}-${adaptiveState.questionsAnswered}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {renderCurrentGame()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
