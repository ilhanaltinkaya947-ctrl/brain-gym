import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Trophy, Zap } from 'lucide-react';
import { GameState, getDifficultyTier, getDifficultyLabel } from '../hooks/useGameEngine';

// GAME IMPORTS (Correct paths)
import { SpeedMath } from './SpeedMath';
import { ParadoxFlow } from './games/ParadoxFlow';
import { SuitDeception } from './games/SuitDeception';
import { ChimpMemory } from './games/ChimpMemory';
import { CubeCount } from './games/CubeCount';

// --- GAME REGISTRY ---
const GAMES_MAP: Record<string, React.ComponentType<any>> = {
  'speedMath': SpeedMath,
  'paradoxFlow': ParadoxFlow,
  'suitDeception': SuitDeception,
  'chimpMemory': ChimpMemory,
  'cubeCount': CubeCount
};

export const GameScreen = ({ gameState, generateMathQuestion, onAnswer, onQuit, playSound, triggerHaptic, setStreak, bestScore, onScreenShake }: any) => {
  const currentTier = getDifficultyTier(gameState.streak, gameState.mode);
  const difficultyLabel = getDifficultyLabel(currentTier);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [showComboText, setShowComboText] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  
  // Heatmap logic
  const getHeatColor = (speed: number) => {
    if (speed < 1.2) return 'linear-gradient(to bottom, hsl(var(--background)), hsl(0, 0%, 0%))';
    if (speed < 1.6) return 'linear-gradient(to bottom, hsl(270, 50%, 25%), hsl(0, 0%, 0%))';
    return 'linear-gradient(to bottom, hsl(0, 60%, 25%), hsl(0, 0%, 0%))';
  };

  const currentHeat = getHeatColor(gameState.speedMultiplier || 1.0);
  const isOverdrive = (gameState.speedMultiplier || 1.0) >= 1.6;

  // Effects
  useEffect(() => {
    if (gameState.lastResult === 'wrong') {
      setIsScreenShaking(true); 
      setShowRedFlash(true); 
      triggerHaptic('heavy');
      setTimeout(() => setIsScreenShaking(false), 300);
      setTimeout(() => setShowRedFlash(false), 400);
    }
  }, [gameState.lastResult, triggerHaptic]);

  useEffect(() => {
    if (gameState.streak > 0 && gameState.streak % 10 === 0) {
      setShowComboText(true); 
      playSound('heatup');
      setTimeout(() => setShowComboText(false), 2000);
    }
  }, [gameState.streak, playSound]);

  useEffect(() => setStreak(gameState.streak), [gameState.streak, setStreak]);

  const handleScreenShake = () => { 
    setIsScreenShaking(true); 
    setTimeout(() => setIsScreenShaking(false), 200); 
    onScreenShake?.(); 
  };

  // --- RENDER LOGIC ---
  const renderCurrentGame = () => {
    const ActiveGame = GAMES_MAP[gameState.currentGame];
    const commonProps = {
      onAnswer, 
      playSound, 
      triggerHaptic, 
      streak: gameState.streak,
      onScreenShake: handleScreenShake, 
      tier: currentTier, 
      mode: gameState.mode,
      generateQuestion: generateMathQuestion // Special for SpeedMath
    };

    if (!ActiveGame) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 border-2 border-destructive bg-destructive/10 rounded-xl text-center">
          <h2 className="text-xl font-bold text-destructive">DEV ERROR</h2>
          <p className="mt-2 text-sm">Missing component for: <span className="font-mono bg-black/20 px-2 rounded">{gameState.currentGame}</span></p>
        </div>
      );
    }

    return <ActiveGame {...commonProps} />;
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col relative overflow-hidden text-foreground"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1, background: currentHeat, x: isScreenShaking ? [-5, 5, -5, 5, 0] : 0 }}
      transition={{ background: { duration: 2.0 } }}
    >
      <AnimatePresence>
        {showRedFlash && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.4 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-destructive pointer-events-none z-50" 
          />
        )}
      </AnimatePresence>
      
      {isOverdrive && (
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      )}
      
      {/* HEADER HUD */}
      <div className="safe-top px-6 pt-6 pb-2 flex justify-between items-start z-20">
        <div className="flex flex-col items-start">
          <button onClick={onQuit} className="p-2 -ml-2 opacity-50 hover:opacity-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/30 text-muted-foreground">
            <Zap className="w-3 h-3" /> 
            <span className="text-[10px] font-bold uppercase">{difficultyLabel}</span>
          </div>
        </div>
        <div className="flex flex-col items-center mt-2">
          <Activity className={`w-3 h-3 ${isOverdrive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
          <span className={`font-mono text-3xl font-light tracking-tighter ${isOverdrive ? 'text-primary' : ''}`}>
            x{(gameState.speedMultiplier || 1.0).toFixed(1)}
          </span>
        </div>
        <div className="flex flex-col items-end mt-2">
          <Trophy className="w-3 h-3 opacity-60" /> 
          <span className="font-mono text-2xl font-bold">{gameState.score}</span>
        </div>
      </div>

      {/* GAME AREA */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 pb-20">
        <motion.div 
          layout 
          className="w-full max-w-sm aspect-square rounded-[2rem] backdrop-blur-2xl bg-card/30 border border-border/30 shadow-2xl flex items-center justify-center relative overflow-hidden ring-1 ring-border/10"
        >
          {renderCurrentGame()}
        </motion.div>
      </div>

      {/* FOOTER */}
      <div className="safe-bottom absolute bottom-8 left-0 right-0 text-center opacity-30 pointer-events-none">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em]">
          Protocol: <span className="font-bold">{gameState.currentGame}</span>
        </div>
      </div>
    </motion.div>
  );
};
