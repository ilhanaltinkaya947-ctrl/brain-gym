import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Target, Clock, TrendingUp, RotateCcw, Sparkles } from 'lucide-react';
import { GameState } from '../hooks/useGameEngine';

interface ResultScreenProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onGoHome: () => void;
  isNewHighScore: boolean;
}

export const ResultScreen = ({ gameState, onPlayAgain, onGoHome, isNewHighScore }: ResultScreenProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const accuracy = gameState.totalQuestions > 0 
    ? Math.round((gameState.correct / gameState.totalQuestions) * 100) 
    : 0;
  const avgSpeed = gameState.totalQuestions > 0 
    ? (120 / gameState.totalQuestions).toFixed(1) 
    : '0';

  // Massive confetti for new high score
  useEffect(() => {
    if (isNewHighScore) {
      const duration = 4000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 10,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.6 },
          colors: ['#D4FF00', '#00D4FF', '#FFD700', '#FF6B6B'],
        });
        confetti({
          particleCount: 10,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.6 },
          colors: ['#D4FF00', '#00D4FF', '#FFD700', '#FF6B6B'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isNewHighScore]);

  // Animate score counting up
  useEffect(() => {
    const duration = 1500;
    const steps = 50;
    const increment = gameState.score / steps;
    let current = 0;
    
    const interval = setInterval(() => {
      current += increment;
      if (current >= gameState.score) {
        setDisplayScore(gameState.score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [gameState.score]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12 safe-top safe-bottom">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-muted-foreground mb-2">Training Complete</h1>
        {isNewHighScore && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mt-4"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                  '0 0 40px rgba(255, 215, 0, 0.8)',
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                ]
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black text-xl"
            >
              <Sparkles className="w-6 h-6" />
              NEW BEST!
              <Trophy className="w-6 h-6" />
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Main Score */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="text-center"
      >
        <motion.div
          className="relative"
          animate={{ 
            textShadow: [
              '0 0 20px hsl(var(--neon-lime) / 0.5)',
              '0 0 40px hsl(var(--neon-lime) / 0.8)',
              '0 0 20px hsl(var(--neon-lime) / 0.5)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-8xl font-black font-mono text-primary">
            {displayScore}
          </span>
        </motion.div>
        <p className="text-muted-foreground text-lg mt-2">Total Score</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm space-y-4"
      >
        {/* Accuracy Card */}
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/20">
                <Target className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold font-mono">{accuracy}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="font-mono">
                <span className="text-success">{gameState.correct}</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-destructive">{gameState.wrong}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Speed Card */}
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-secondary/20">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Speed</p>
                <p className="text-2xl font-bold font-mono">{avgSpeed}s</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Per Question</p>
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Performance</p>
              <p className="text-lg font-bold">
                {accuracy >= 90 ? '🔥 Outstanding!' : 
                 accuracy >= 70 ? '💪 Great Job!' : 
                 accuracy >= 50 ? '👍 Keep Practicing!' : 
                 '🎯 Focus More!'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm space-y-3"
      >
        {/* HUGE Pulsing Play Again Button */}
        <motion.button
          animate={{ 
            scale: [1, 1.03, 1],
            boxShadow: [
              '0 0 20px hsl(var(--neon-lime) / 0.4)',
              '0 0 40px hsl(var(--neon-lime) / 0.6)',
              '0 0 20px hsl(var(--neon-lime) / 0.4)',
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPlayAgain}
          className="w-full py-6 rounded-2xl btn-primary-glow text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-3"
        >
          <RotateCcw className="w-7 h-7" />
          PLAY AGAIN
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoHome}
          className="w-full py-4 rounded-2xl bg-muted text-muted-foreground text-lg font-semibold"
        >
          Come Back Tomorrow
        </motion.button>
      </motion.div>
    </div>
  );
};
