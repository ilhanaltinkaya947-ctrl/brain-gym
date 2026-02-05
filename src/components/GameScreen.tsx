import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Trophy, Zap } from 'lucide-react';
import { GameState, getDifficultyTier, getDifficultyLabel } from '../hooks/useGameEngine';

// Game Imports
import { SpeedMath } from './SpeedMath';
import { ParadoxFlow } from './games/ParadoxFlow';
import { SuitDeception } from './games/SuitDeception';
import { ChimpMemory } from './games/ChimpMemory';
import { MathQuestion, ColorQuestion } from '@/hooks/useGameEngine';

interface GameScreenProps {
  gameState: GameState;
  generateMathQuestion: () => MathQuestion;
  generateColorQuestion: () => ColorQuestion;
  onAnswer: (correct: boolean, speedBonus: number, tier?: number) => void;
  onQuit: () => void;
  playSound: (type: 'correct' | 'wrong' | 'tick' | 'heatup' | 'lose' | 'complete') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  setStreak: (streak: number) => void;
  bestScore: number;
  onScreenShake?: () => void;
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
  onScreenShake,
}: GameScreenProps) => {
  const currentTier = getDifficultyTier(gameState.streak, gameState.mode);
  const difficultyLabel = getDifficultyLabel(currentTier);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [showComboText, setShowComboText] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);

  // --- 1. ADAPTIVE HEATMAP LOGIC ---
  const getHeatColor = (speed: number) => {
    if (speed < 1.2) return 'linear-gradient(to bottom, hsl(var(--background)), hsl(0, 0%, 0%))'; // Cold
    if (speed < 1.6) return 'linear-gradient(to bottom, hsl(270, 50%, 25%), hsl(0, 0%, 0%))'; // Warm (Purple)
    return 'linear-gradient(to bottom, hsl(0, 60%, 25%), hsl(0, 0%, 0%))'; // Overdrive (Red/Burning)
  };

  const currentHeat = getHeatColor(gameState.speedMultiplier || 1.0);
  const isOverdrive = (gameState.speedMultiplier || 1.0) >= 1.6;

  // --- EFFECTS ---
  useEffect(() => {
    if (gameState.lastResult === 'wrong') {
      setIsScreenShaking(true);
      setShowRedFlash(true);
      triggerHaptic('heavy');
      setTimeout(() => setIsScreenShaking(false), 300);
      setTimeout(() => setShowRedFlash(false), 400);
    }
  }, [gameState.lastResult, gameState.wrong, triggerHaptic]);

  useEffect(() => {
    if (gameState.streak > 0 && gameState.streak % 10 === 0) {
      setShowComboText(true);
      playSound('heatup');
      setTimeout(() => setShowComboText(false), 2000);
    }
  }, [gameState.streak, playSound]);

  // Update sound pitch based on streak
  useEffect(() => {
    setStreak(gameState.streak);
  }, [gameState.streak, setStreak]);

  const handleScreenShake = () => {
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 200);
    onScreenShake?.();
  };

  // --- RENDER CURRENT GAME ---
  const renderCurrentGame = () => {
    const commonProps = {
      onAnswer,
      playSound,
      triggerHaptic,
      streak: gameState.streak,
      onScreenShake: handleScreenShake,
    };

    switch (gameState.currentGame) {
      case 'speedMath':
        return <SpeedMath generateQuestion={generateMathQuestion} {...commonProps} />;
      case 'paradoxFlow':
        return (
          <ParadoxFlow
            onAnswer={onAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
            onScreenShake={handleScreenShake}
            streak={gameState.streak}
            mode={gameState.mode}
          />
        );
      case 'suitDeception':
        return (
          <SuitDeception
            tier={currentTier}
            streak={gameState.streak}
            onAnswer={onAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
          />
        );
      case 'chimpMemory':
        return (
          <ChimpMemory
            tier={currentTier}
            streak={gameState.streak}
            onAnswer={onAnswer}
            playSound={playSound}
            triggerHaptic={triggerHaptic}
          />
        );
      default:
        // Default to random game from enabled list
        return <SpeedMath generateQuestion={generateMathQuestion} {...commonProps} />;
    }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col relative overflow-hidden text-foreground"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        background: currentHeat,
        x: isScreenShaking ? [-5, 5, -5, 5, 0] : 0,
      }}
      transition={{ background: { duration: 2.0, ease: 'easeInOut' } }}
    >
      {/* RED FLASH OVERLAY for wrong answers */}
      <AnimatePresence>
        {showRedFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 bg-destructive pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      {/* Overdrive noise overlay */}
      {isOverdrive && (
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      )}

      {/* --- HUD HEADER --- */}
      <div className="safe-top px-6 pt-6 pb-2 flex justify-between items-start z-20">
        <div className="flex flex-col items-start">
          <button
            onClick={onQuit}
            className="p-2 -ml-2 opacity-50 hover:opacity-100 transition-opacity rounded-full hover:bg-muted/20"
          >
            <X className="w-6 h-6" />
          </button>
          {/* Difficulty Level Indicator - 5 Tiers with color progression */}
          <motion.div
            key={difficultyLabel}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
              currentTier === 5 
                ? 'bg-gradient-to-r from-destructive/30 to-primary/30 text-destructive animate-pulse' 
                : currentTier === 4 
                ? 'bg-destructive/20 text-destructive'
                : currentTier === 3 
                ? 'bg-primary/20 text-primary'
                : currentTier === 2
                ? 'bg-accent/20 text-accent-foreground'
                : 'bg-muted/30 text-muted-foreground'
            }`}
          >
            <Zap className={`w-3 h-3 ${currentTier >= 4 ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider tabular-nums">
              {difficultyLabel}
            </span>
          </motion.div>
        </div>
        <div className="flex flex-col items-center mt-2">
          <div className="flex items-center gap-2 mb-1">
            <Activity
              className={`w-3 h-3 ${currentTier === 5 ? 'text-destructive animate-pulse' : isOverdrive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`}
            />
            <span className={`text-[10px] uppercase tracking-[0.2em] font-medium ${currentTier === 5 ? 'text-destructive animate-pulse' : 'opacity-60'}`}>
              {currentTier === 5 ? '⚡ GOD MODE' : 'Flow State'}
            </span>
          </div>
          <span
            className={`font-mono text-3xl font-light tracking-tighter tabular-nums ${
              currentTier === 5 
                ? 'text-destructive drop-shadow-[0_0_15px_hsl(var(--destructive)/0.8)] animate-pulse' 
                : isOverdrive 
                ? 'text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]' 
                : ''
            }`}
          >
            x{(gameState.speedMultiplier || 1.0).toFixed(1)}
          </span>
        </div>
        <div className="flex flex-col items-end mt-2">
          <div className="flex items-center gap-1 mb-1 opacity-60">
            <Trophy className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Score</span>
          </div>
          <span className="font-mono text-2xl font-bold tracking-tight tabular-nums">{gameState.score}</span>
        </div>
      </div>

      {/* --- FLOATING COMBO TEXT --- */}
      <AnimatePresence>
        {showComboText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1.2, y: 0 }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
            className="absolute top-[20%] left-0 right-0 text-center z-50 pointer-events-none"
          >
            <span className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-foreground to-primary drop-shadow-[0_0_25px_hsl(var(--primary)/0.6)] tabular-nums">
              {gameState.streak}x
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN GAME CONTAINER --- */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 pb-20">
        <motion.div
          layout
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm aspect-square rounded-[2rem] backdrop-blur-2xl bg-card/30 border border-border/30 shadow-2xl flex items-center justify-center relative overflow-hidden ring-1 ring-border/10"
        >
          {renderCurrentGame()}
        </motion.div>
      </div>

      {/* --- FOOTER INFO --- */}
      <div className="safe-bottom absolute bottom-8 left-0 right-0 text-center opacity-30 pointer-events-none">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em]">
          Current Protocol: <span className="font-bold">{gameState.currentGame}</span>
        </div>
      </div>
    </motion.div>
  );
};
