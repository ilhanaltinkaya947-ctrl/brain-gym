import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Target, Clock, Zap, RotateCcw, Home, Star } from 'lucide-react';

interface ResultScreenProps {
  score: number;
  correct: number;
  wrong: number;
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const ResultScreen = ({
  score,
  correct,
  wrong,
  isNewHighScore,
  onPlayAgain,
  onGoHome,
}: ResultScreenProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const avgSpeed = correct > 0 ? (120 / correct).toFixed(1) : '0';

  // Animate score counting up
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // Trigger confetti for high score
  useEffect(() => {
    if (isNewHighScore) {
      const duration = 4000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#00D4FF', '#FF00FF', '#FFD700'],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#00D4FF', '#FF00FF', '#FFD700'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isNewHighScore]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 safe-top safe-bottom">
      {/* High Score Badge */}
      {isNewHighScore && (
        <motion.div
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 px-6 py-3 rounded-full border-glow-gold"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--neon-gold) / 0.3), hsl(var(--neon-gold) / 0.1))',
            }}
          >
            <Star className="w-6 h-6 text-neon-gold fill-neon-gold" />
            <span className="text-neon-gold font-black text-xl uppercase tracking-wider text-glow-gold">
              New Best!
            </span>
            <Star className="w-6 h-6 text-neon-gold fill-neon-gold" />
          </div>
        </motion.div>
      )}

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-black uppercase tracking-wider text-gradient-neon mb-2">
          Training Complete
        </h1>
        <p className="text-muted-foreground uppercase tracking-widest text-sm">Session Results</p>
      </motion.div>

      {/* Score Display */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="card-glass rounded-3xl p-8 mb-8 text-center w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Trophy className="w-8 h-8 text-neon-gold" />
          <span className="text-sm text-muted-foreground uppercase tracking-widest">Total Score</span>
        </div>
        <motion.div
          key={displayScore}
          className="text-7xl font-black font-mono text-glow-gold"
          style={{ color: 'hsl(var(--neon-gold))' }}
        >
          {displayScore.toLocaleString()}
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-3 gap-3 w-full max-w-sm mb-10"
      >
        <div className="card-glass rounded-2xl p-4 text-center">
          <Target className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-3xl font-black text-glow-cyan">{accuracy}%</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Accuracy</p>
        </div>
        
        <div className="card-glass rounded-2xl p-4 text-center">
          <Clock className="w-5 h-5 text-secondary mx-auto mb-2" />
          <p className="text-3xl font-black">{avgSpeed}s</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Speed</p>
        </div>
        
        <div className="card-glass rounded-2xl p-4 text-center">
          <Zap className="w-5 h-5 text-neon-gold mx-auto mb-2" />
          <p className="text-3xl font-black">
            <span className="text-success">{correct}</span>
            <span className="text-muted-foreground text-lg">/</span>
            <span className="text-destructive">{wrong}</span>
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">C / W</p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm space-y-4"
      >
        {/* Epic Play Again Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPlayAgain}
          className="w-full py-6 rounded-3xl btn-primary-glow reactor-pulse text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-3"
        >
          <RotateCcw className="w-7 h-7" />
          Play Again
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoHome}
          className="w-full py-4 rounded-2xl card-glass card-glass-hover text-lg font-bold uppercase tracking-wider flex items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="w-5 h-5" />
          Home
        </motion.button>
      </motion.div>
    </div>
  );
};
