import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dashboard } from '../components/Dashboard';
import { GameConfigPanel } from '../components/GameConfigPanel';
import { MixedGameScreen } from '../components/MixedGameScreen';
import { ResultScreen } from '../components/ResultScreen';
import { FlashMemoryScreen } from '../components/FlashMemoryScreen';
import { FlashMemoryResult } from '../components/FlashMemoryResult';
import { NeuralBackground } from '../components/NeuralBackground';
import { useGameEngine } from '../hooks/useGameEngine';
import { useSounds } from '../hooks/useSounds';
import { GameConfig, DEFAULT_CONFIG, MiniGameType, MIXABLE_GAMES } from '@/types/game';

type Screen = 'dashboard' | 'config' | 'game' | 'result' | 'flashMemory' | 'flashResult';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  
  // Game configuration
  const [gameConfig, setGameConfig] = useState<GameConfig>(() => {
    const saved = localStorage.getItem('neuroflow-config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  // High scores
  const [highScoreClassic, setHighScoreClassic] = useState(() => {
    const saved = localStorage.getItem('neuroflow-highscore-classic');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [highScoreEndless, setHighScoreEndless] = useState(() => {
    const saved = localStorage.getItem('neuroflow-highscore-endless');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [flashHighLevel, setFlashHighLevel] = useState(() => {
    const saved = localStorage.getItem('neuroflow-flash-highlevel');
    return saved ? parseInt(saved, 10) : 1;
  });

  // Last game results
  const [lastScore, setLastScore] = useState(0);
  const [lastStreak, setLastStreak] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(0);
  const [lastWrong, setLastWrong] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  
  // Flash memory state
  const [flashLastLevel, setFlashLastLevel] = useState(1);
  const [flashLastScore, setFlashLastScore] = useState(0);
  const [isNewFlashHighLevel, setIsNewFlashHighLevel] = useState(false);
  const [flashKey, setFlashKey] = useState(0);

  // Dashboard stats
  const [dayStreak, setDayStreak] = useState(() => {
    const saved = localStorage.getItem('neuroflow-streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [brainCharge, setBrainCharge] = useState(() => {
    const lastPlayed = localStorage.getItem('neuroflow-lastplayed');
    const today = new Date().toDateString();
    return lastPlayed === today ? 100 : 0;
  });

  const { playSound, triggerHaptic, setStreak } = useSounds();
  const { generateMathQuestion, generateColorQuestion } = useGameEngine();

  // Save config changes
  useEffect(() => {
    localStorage.setItem('neuroflow-config', JSON.stringify(gameConfig));
  }, [gameConfig]);

  const handleOpenConfig = () => {
    playSound('tick');
    setCurrentScreen('config');
  };

  const handleStartGame = () => {
    playSound('start');
    triggerHaptic('medium');
    setCurrentScreen('game');
  };

  const handleStartFlashMemory = () => {
    playSound('start');
    triggerHaptic('medium');
    setFlashKey(prev => prev + 1);
    setCurrentScreen('flashMemory');
  };

  const handleGameEnd = useCallback((score: number, streak: number, correct: number, wrong: number) => {
    playSound('complete');
    triggerHaptic('medium');
    
    setLastScore(score);
    setLastStreak(streak);
    setLastCorrect(correct);
    setLastWrong(wrong);
    
    // Update high scores based on mode
    if (gameConfig.mode === 'classic') {
      if (score > highScoreClassic) {
        setHighScoreClassic(score);
        localStorage.setItem('neuroflow-highscore-classic', score.toString());
        setIsNewHighScore(true);
      } else {
        setIsNewHighScore(false);
      }
    } else {
      if (streak > highScoreEndless) {
        setHighScoreEndless(streak);
        localStorage.setItem('neuroflow-highscore-endless', streak.toString());
        setIsNewHighScore(true);
      } else {
        setIsNewHighScore(false);
      }
    }

    // Update daily stats
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem('neuroflow-lastplayed');
    
    if (lastPlayed !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastPlayed === yesterday.toDateString()) {
        setDayStreak(prev => {
          const newStreak = prev + 1;
          localStorage.setItem('neuroflow-streak', newStreak.toString());
          return newStreak;
        });
      } else {
        setDayStreak(1);
        localStorage.setItem('neuroflow-streak', '1');
      }
      
      localStorage.setItem('neuroflow-lastplayed', today);
      setBrainCharge(100);
    }

    setCurrentScreen('result');
  }, [gameConfig.mode, highScoreClassic, highScoreEndless, playSound, triggerHaptic]);

  const handleFlashGameOver = useCallback((level: number, score: number) => {
    setFlashLastLevel(level);
    setFlashLastScore(score);
    
    if (level > flashHighLevel) {
      setFlashHighLevel(level);
      localStorage.setItem('neuroflow-flash-highlevel', level.toString());
      setIsNewFlashHighLevel(true);
    } else {
      setIsNewFlashHighLevel(false);
    }
    
    setCurrentScreen('flashResult');
  }, [flashHighLevel]);

  const handleQuit = () => {
    setCurrentScreen('dashboard');
  };

  const handlePlayAgain = () => {
    setCurrentScreen('game');
  };

  const handleFlashPlayAgain = () => {
    setFlashKey(prev => prev + 1);
    setCurrentScreen('flashMemory');
  };

  const handleGoHome = () => {
    setCurrentScreen('dashboard');
  };

  const handleBackFromConfig = () => {
    setCurrentScreen('dashboard');
  };

  // Calculate display high score based on mode
  const displayHighScore = gameConfig.mode === 'classic' ? highScoreClassic : highScoreEndless;

  return (
    <div className="min-h-screen overflow-hidden relative">
      <NeuralBackground />
      
      <AnimatePresence mode="wait">
        {currentScreen === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard
              onStartGame={handleOpenConfig}
              onStartFlashMemory={handleStartFlashMemory}
              brainCharge={brainCharge}
              highScore={Math.max(highScoreClassic, highScoreEndless)}
              flashHighScore={flashHighLevel}
              streak={dayStreak}
            />
          </motion.div>
        )}

        {currentScreen === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-12 safe-top safe-bottom relative z-10"
          >
            {/* Back Button */}
            <button
              onClick={handleBackFromConfig}
              className="absolute top-6 left-6 p-2 rounded-full bg-muted/30 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors border border-border/30"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black uppercase tracking-widest text-foreground mb-8"
            >
              <span className="text-gradient-neon">Brain</span> Training
            </motion.h2>

            <GameConfigPanel
              config={gameConfig}
              onConfigChange={setGameConfig}
              onStart={handleStartGame}
              onStartFlashMemory={handleStartFlashMemory}
              highScoreClassic={highScoreClassic}
              highScoreEndless={highScoreEndless}
              flashHighLevel={flashHighLevel}
            />
          </motion.div>
        )}

        {currentScreen === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="h-screen"
          >
            <MixedGameScreen
              mode={gameConfig.mode}
              enabledGames={gameConfig.enabledGames.filter(g => MIXABLE_GAMES.includes(g)) as MiniGameType[]}
              generateMathQuestion={generateMathQuestion}
              generateColorQuestion={generateColorQuestion}
              onGameEnd={handleGameEnd}
              onQuit={handleQuit}
              playSound={playSound}
              triggerHaptic={triggerHaptic}
              setStreak={setStreak}
              bestScore={highScoreClassic}
              bestStreak={highScoreEndless}
            />
          </motion.div>
        )}

        {currentScreen === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ResultScreen
              score={gameConfig.mode === 'classic' ? lastScore : lastStreak}
              correct={lastCorrect}
              wrong={lastWrong}
              onPlayAgain={handlePlayAgain}
              onGoHome={handleGoHome}
              isNewHighScore={isNewHighScore}
            />
          </motion.div>
        )}

        {currentScreen === 'flashMemory' && (
          <motion.div
            key={`flash-${flashKey}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-screen"
          >
            <FlashMemoryScreen
              onGameOver={handleFlashGameOver}
              onQuit={handleQuit}
              playSound={playSound}
              triggerHaptic={triggerHaptic}
            />
          </motion.div>
        )}

        {currentScreen === 'flashResult' && (
          <motion.div
            key="flash-result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <FlashMemoryResult
              level={flashLastLevel}
              score={flashLastScore}
              highLevel={flashHighLevel}
              isNewHighLevel={isNewFlashHighLevel}
              onPlayAgain={handleFlashPlayAgain}
              onGoHome={handleGoHome}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
