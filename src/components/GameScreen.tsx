import { motion } from 'framer-motion';
import { Clock, Zap, Target, X } from 'lucide-react';
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
}

export const GameScreen = ({
  gameState,
  generateMathQuestion,
  generateColorQuestion,
  onAnswer,
  onQuit,
  playSound,
  triggerHaptic,
}: GameScreenProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const gameProgress = ((120 - gameState.timeLeft) / 120) * 100;

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-6 pb-4"
      >
        {/* Quit button */}
        <button 
          onClick={onQuit}
          className="absolute top-6 right-6 p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Game type indicator */}
        <div className="text-center mb-4">
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

          <motion.div
            key={gameState.score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
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
            <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-bold">
              🔥 {gameState.streak} streak! ({Math.min(1 + gameState.streak * 0.1, 2).toFixed(1)}x)
            </span>
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
          />
        ) : (
          <ColorMatch
            generateQuestion={generateColorQuestion}
            onAnswer={onAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
          />
        )}
      </div>
    </div>
  );
};
