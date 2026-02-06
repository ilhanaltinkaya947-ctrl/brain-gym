import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame } from 'lucide-react';
import { GameState } from '../hooks/useGameEngine';

// GAME IMPORTS
import { SpeedMath } from './SpeedMath';
import { ParadoxFlow } from './games/ParadoxFlow';
import { SuitDeception } from './games/SuitDeception';
import { ChimpMemory } from './games/ChimpMemory';

// --- GAME REGISTRY ---
const GAMES_MAP: Record<string, React.ComponentType<any>> = {
  'speedMath': SpeedMath,
  'paradoxFlow': ParadoxFlow,
  'suitDeception': SuitDeception,
  'chimpMemory': ChimpMemory
};

export const GameScreen = ({ gameState, generateMathQuestion, onAnswer, onQuit, playSound, triggerHaptic, setStreak, bestScore, onScreenShake }: any) => {
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  
  const isEndless = gameState.mode === 'endless';
  const isHighMultiplier = (gameState.speedMultiplier || 1.0) >= 1.5;

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
      playSound('heatup');
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
    const currentTier = Math.min(5, Math.max(1, Math.floor(gameState.streak / 5) + 1));
    const commonProps = {
      onAnswer, 
      playSound, 
      triggerHaptic, 
      streak: gameState.streak,
      onScreenShake: handleScreenShake, 
      tier: currentTier, 
      mode: gameState.mode,
      generateQuestion: generateMathQuestion
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
      className="min-h-screen-dynamic flex flex-col relative overflow-hidden text-foreground bg-background safe-all"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1, x: isScreenShaking ? [-5, 5, -5, 5, 0] : 0 }}
    >
      {/* Red Flash on Wrong Answer */}
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
      
      {/* Endless Mode Indicator - Subtle Red Line */}
      {isEndless && (
        <motion.div 
          className="absolute top-0 left-0 right-0 h-1 bg-destructive"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      
      {/* CLEAN HUD HEADER */}
      <div className="safe-top px-6 pt-4 pb-2 flex justify-between items-start z-20">
        {/* Left: Close Button */}
        <button 
          onClick={onQuit} 
          className="p-2 -ml-2 opacity-40 hover:opacity-100 transition-opacity rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Center: Hero Metric (Score for Classic, Streak for Endless) */}
        <div className="flex flex-col items-center">
          {isEndless ? (
            <>
              {/* ENDLESS MODE: Streak is Hero */}
              <motion.div 
                key={gameState.streak}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <Flame className="w-12 h-12 text-orange-500 fill-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
                </motion.div>
                <span className="font-mono text-7xl font-black tracking-tighter">
                  {gameState.streak}
                </span>
              </motion.div>
              {/* Subtle score in endless */}
              <span className="text-[10px] text-muted-foreground/40 mt-2 font-mono uppercase tracking-widest">
                {gameState.score} pts
              </span>
            </>
          ) : (
            <>
              {/* CLASSIC MODE: Score is Hero */}
              <motion.span 
                key={gameState.score}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-mono text-7xl font-black tracking-tighter"
              >
                {gameState.score}
              </motion.span>
              
              {/* Streak Fire below score */}
              {gameState.streak > 0 && (
                <motion.div 
                  className={`flex items-center gap-1.5 mt-2 ${isHighMultiplier ? 'text-orange-400' : 'text-muted-foreground/60'}`}
                  animate={isHighMultiplier ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <Flame className={`w-5 h-5 ${isHighMultiplier ? 'fill-orange-400' : ''}`} />
                  <span className="text-base font-bold">{gameState.streak}</span>
                </motion.div>
              )}
            </>
          )}
        </div>
        
        {/* Right: Best Score */}
        <div className="flex flex-col items-end text-muted-foreground opacity-60">
          <span className="text-[10px] uppercase tracking-wider">Best</span>
          <span className="font-mono text-sm font-medium">{bestScore || 0}</span>
        </div>
      </div>

      {/* GAME AREA - Vertically Centered */}
      <div className="flex-1 flex items-center justify-center w-full min-h-[60vh] px-6 py-4 relative z-10">
        <motion.div 
          layout 
          className="w-full max-w-sm aspect-square rounded-[2rem] backdrop-blur-2xl bg-card/30 border border-border/30 shadow-2xl flex items-center justify-center relative overflow-hidden ring-1 ring-border/10"
        >
          {renderCurrentGame()}
        </motion.div>
      </div>
      
      {/* Bottom Safe Area Spacer */}
      <div className="safe-bottom" />
    </motion.div>
  );
};
