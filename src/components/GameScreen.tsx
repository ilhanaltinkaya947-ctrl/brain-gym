import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Clock, Zap, Target, X, Trophy } from 'lucide-react';
import { GameState } from '../hooks/useGameEngine';
import { SpeedMath } from './SpeedMath';
import { ColorMatch } from './ColorMatch';
import { MathQuestion, ColorQuestion } from '../hooks/useGameEngine';

interface GameScreenProps {
  gameState: GameState;
  generateMathQuestion: () => MathQuestion;
  generateColorQuestion: () => ColorQuestion;
  onAnswer: (correct: boolean, speedBonus: number) => void;
  onQuit: () => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  setStreak: (streak: number) => void;
  bestScore: number;
}

export const GameScreen = ({
  gameState,
  generateMathQuestion,
  generateColorQuestion,
  onAnswer,
  onQuit,
  playSound,
  triggerHaptic,
  setStreak,
  bestScore,
}: GameScreenProps) => {
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [scoreKey, setScoreKey] = useState(0);
  const [showComboText, setShowComboText] = useState(false);
  const [hasTriggeredNewRecord, setHasTriggeredNewRecord] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const gameProgress = ((120 - gameState.timeLeft) / 120) * 100;
  const isComboMode = gameState.streak >= 5;
  const isNewRecord = gameState.score > bestScore && bestScore > 0;

  // Update sound pitch based on streak
  useEffect(() => {
    setStreak(gameState.streak);
  }, [gameState.streak, setStreak]);

  // Trigger new record confetti
  useEffect(() => {
    if (isNewRecord && !hasTriggeredNewRecord) {
      setHasTriggeredNewRecord(true);
      // Massive confetti rain for new record!
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#D4FF00', '#00D4FF', '#FFD700'],
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#D4FF00', '#00D4FF', '#FFD700'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isNewRecord, hasTriggeredNewRecord]);

  // Score pop animation
  useEffect(() => {
    setScoreKey(prev => prev + 1);
  }, [gameState.score]);

  // Show combo text when reaching 5+ streak
  useEffect(() => {
    if (gameState.streak >= 5 && gameState.streak % 5 === 0) {
      setShowComboText(true);
      setTimeout(() => setShowComboText(false), 1000);
    }
  }, [gameState.streak]);

  const handleScreenShake = useCallback(() => {
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 200);
  }, []);

  return (
    <motion.div 
      className="min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden"
      animate={isScreenShaking ? { x: [-3, 3, -3, 3, 0], y: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Combo Mode Glow Border */}
      <AnimatePresence>
        {isComboMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-50"
            style={{
              boxShadow: 'inset 0 0 60px rgba(255, 215, 0, 0.5), inset 0 0 100px rgba(255, 69, 0, 0.3)',
            }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                boxShadow: [
                  'inset 0 0 60px rgba(255, 215, 0, 0.5)',
                  'inset 0 0 80px rgba(255, 69, 0, 0.6)',
                  'inset 0 0 60px rgba(255, 215, 0, 0.5)',
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
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-lg">
              +{gameState.streak * 2} COMBO!
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
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-sm"
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
        className="px-6 pt-6 pb-4"
      >
        {/* Best Score - Top Right */}
        <div className="absolute top-6 right-14 flex items-center gap-1 text-muted-foreground">
          <Trophy className="w-4 h-4" />
          <span className="font-mono text-sm font-bold">BEST: {bestScore}</span>
        </div>

        {/* Quit button */}
        <button 
          onClick={onQuit}
          className="absolute top-6 left-6 p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Game type indicator */}
        <div className="text-center mb-4 mt-8">
          <motion.span
            key={gameState.currentGame}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              background: gameState.currentGame === 'speedMath' 
                ? 'linear-gradient(90deg, hsl(var(--neon-lime) / 0.3), hsl(var(--neon-lime) / 0.1))'
                : 'linear-gradient(90deg, hsl(var(--cyber-blue) / 0.3), hsl(var(--cyber-blue) / 0.1))',
              color: gameState.currentGame === 'speedMath' 
                ? 'hsl(var(--neon-lime))'
                : 'hsl(var(--cyber-blue))',
            }}
          >
            {gameState.currentGame === 'speedMath' ? '⚡ Speed Math' : '🎨 Color Match'}
          </motion.span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--neon-lime)), hsl(var(--cyber-blue)))',
            }}
            animate={{ width: `${gameProgress}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-lg font-bold">{formatTime(gameState.timeLeft)}</span>
          </div>

          {/* Live Score with Pop Animation */}
          <motion.div
            key={scoreKey}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-mono text-lg font-bold text-primary">{gameState.score}</span>
          </motion.div>

          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-secondary" />
            <span className="font-mono text-lg">
              <span className="text-success">{gameState.correct}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-destructive">{gameState.wrong}</span>
            </span>
          </div>
        </div>

        {/* Streak indicator */}
        {gameState.streak >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mt-3"
          >
            <motion.span 
              animate={isComboMode ? { 
                boxShadow: ['0 0 10px rgba(255,215,0,0.5)', '0 0 20px rgba(255,215,0,0.8)', '0 0 10px rgba(255,215,0,0.5)']
              } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
              className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                isComboMode 
                  ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-400 border border-yellow-500/50' 
                  : 'bg-primary/20 text-primary'
              }`}
            >
              🔥 {gameState.streak} streak! ({Math.min(1 + gameState.streak * 0.1, 2).toFixed(1)}x)
            </motion.span>
          </motion.div>
        )}
      </motion.div>

      {/* Game Area */}
      <div className="flex-1 relative">
        {gameState.currentGame === 'speedMath' ? (
          <SpeedMath
            generateQuestion={generateMathQuestion}
            onAnswer={onAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
            streak={gameState.streak}
            onScreenShake={handleScreenShake}
          />
        ) : (
          <ColorMatch
            generateQuestion={generateColorQuestion}
            onAnswer={onAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
            streak={gameState.streak}
            onScreenShake={handleScreenShake}
          />
        )}
      </div>
    </motion.div>
  );
};
