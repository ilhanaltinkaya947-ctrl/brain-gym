import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Target, Zap, RotateCcw, Skull, Home, Star } from 'lucide-react';

interface FlashMemoryResultProps {
  level: number;
  score: number;
  highLevel: number;
  isNewHighLevel: boolean;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const FlashMemoryResult = ({ 
  level, 
  score, 
  highLevel, 
  isNewHighLevel,
  onPlayAgain, 
  onGoHome 
}: FlashMemoryResultProps) => {
  const [displayScore, setDisplayScore] = useState(0);

  // Fast score animation
  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const increment = score / steps;
    let current = 0;
    
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [score]);

  // Trigger confetti for high level
  useEffect(() => {
    if (isNewHighLevel) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#00D4FF', '#FF00FF', '#FFD700'],
        });
        confetti({
          particleCount: 4,
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
  }, [isNewHighLevel]);

  return (
    <div className="min-h-screen-dynamic flex flex-col items-center justify-between px-6 py-12 safe-top safe-bottom">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--destructive) / 0.3), hsl(var(--destructive) / 0.1))',
            border: '2px solid hsl(var(--destructive) / 0.5)',
            boxShadow: '0 0 30px hsl(var(--destructive) / 0.3)',
          }}
        >
          <Skull className="w-10 h-10 text-destructive" />
        </motion.div>
        <h1 className="text-3xl font-black text-destructive uppercase tracking-wider mb-2">Game Over</h1>
        
        {isNewHighLevel && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="mt-4"
          >
            <div className="flex items-center gap-2 px-5 py-2 rounded-full border-glow-gold mx-auto inline-flex"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--neon-gold) / 0.3), hsl(var(--neon-gold) / 0.1))',
              }}
            >
              <Star className="w-5 h-5 text-neon-gold fill-neon-gold" />
              <span className="text-neon-gold font-black uppercase tracking-wider text-glow-gold">New Record!</span>
              <Star className="w-5 h-5 text-neon-gold fill-neon-gold" />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main Stats */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="text-center space-y-6"
      >
        {/* Level Reached */}
        <div>
          <motion.div
            className="relative"
            animate={{ 
              textShadow: [
                '0 0 30px hsl(var(--neon-magenta) / 0.5)',
                '0 0 50px hsl(var(--neon-magenta) / 0.8)',
                '0 0 30px hsl(var(--neon-magenta) / 0.5)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-9xl font-black font-mono text-secondary text-glow-magenta">
              {level}
            </span>
          </motion.div>
          <p className="text-muted-foreground text-lg mt-2 uppercase tracking-widest">Level Reached</p>
        </div>

        {/* Score */}
        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center justify-center gap-3">
            <Zap className="w-6 h-6 text-primary" />
            <span className="text-4xl font-black font-mono text-primary text-glow-cyan">
              {displayScore}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">Points Earned</p>
        </div>

        {/* Best Level */}
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Target className="w-5 h-5 text-neon-gold" />
          <span className="font-mono font-bold">Best: Level {highLevel}</span>
        </div>
      </motion.div>

      {/* Action Buttons - INSTANT retry */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm space-y-4"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPlayAgain}
          className="w-full py-6 rounded-3xl btn-primary-glow reactor-pulse text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-3"
        >
          <RotateCcw className="w-7 h-7" />
          Retry Instantly
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
