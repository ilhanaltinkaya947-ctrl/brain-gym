import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dashboard } from '../components/Dashboard';
import { GameScreen } from '../components/GameScreen';
import { ResultScreen } from '../components/ResultScreen';
import { FlashMemoryScreen } from '../components/FlashMemoryScreen';
import { FlashMemoryResult } from '../components/FlashMemoryResult';
import { useGameEngine } from '../hooks/useGameEngine';
import { useSounds } from '../hooks/useSounds';

type Screen = 'dashboard' | 'game' | 'result' | 'flashMemory' | 'flashResult';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('neuroflow-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [flashHighLevel, setFlashHighLevel] = useState(() => {
    const saved = localStorage.getItem('neuroflow-flash-highlevel');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [flashLastLevel, setFlashLastLevel] = useState(1);
  const [flashLastScore, setFlashLastScore] = useState(0);
  const [isNewFlashHighLevel, setIsNewFlashHighLevel] = useState(false);
  const [dayStreak, setDayStreak] = useState(() => {
    const saved = localStorage.getItem('neuroflow-streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [brainCharge, setBrainCharge] = useState(() => {
    const lastPlayed = localStorage.getItem('neuroflow-lastplayed');
    const today = new Date().toDateString();
    return lastPlayed === today ? 100 : 0;
  });
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  // Key to force remount FlashMemory for instant restart
  const [flashKey, setFlashKey] = useState(0);

  const { playSound, triggerHaptic, setStreak } = useSounds();
  const { 
    gameState, 
    startGame, 
    stopGame,
    submitAnswer, 
    generateMathQuestion, 
    generateColorQuestion 
  } = useGameEngine();

  // Watch for game end
  useEffect(() => {
    if (!gameState.isRunning && gameState.totalQuestions > 0 && currentScreen === 'game') {
      playSound('complete');
      triggerHaptic('medium');
      
      // Update high score
      if (gameState.score > highScore) {
        setHighScore(gameState.score);
        localStorage.setItem('neuroflow-highscore', gameState.score.toString());
        setIsNewHighScore(true);
      } else {
        setIsNewHighScore(false);
      }

      // Update streak and brain charge
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
        } else if (lastPlayed !== today) {
          setDayStreak(1);
          localStorage.setItem('neuroflow-streak', '1');
        }
        
        localStorage.setItem('neuroflow-lastplayed', today);
        setBrainCharge(100);
      }

      setCurrentScreen('result');
    }
  }, [gameState.isRunning, gameState.totalQuestions, currentScreen, gameState.score, highScore, playSound, triggerHaptic]);

  const handleStartGame = () => {
    playSound('start');
    triggerHaptic('medium');
    setCurrentScreen('game');
    startGame();
  };

  const handleStartFlashMemory = () => {
    playSound('start');
    triggerHaptic('medium');
    setFlashKey(prev => prev + 1);
    setCurrentScreen('flashMemory');
  };

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
    stopGame();
    setCurrentScreen('dashboard');
  };

  const handleFlashQuit = () => {
    setCurrentScreen('dashboard');
  };

  const handlePlayAgain = () => {
    setCurrentScreen('game');
    startGame();
  };

  // INSTANT retry - no delay, just increment key to force remount
  const handleFlashPlayAgain = () => {
    setFlashKey(prev => prev + 1);
    setCurrentScreen('flashMemory');
  };

  const handleGoHome = () => {
    setCurrentScreen('dashboard');
  };

  return (
    <div className="min-h-screen overflow-hidden">
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
              onStartGame={handleStartGame}
              onStartFlashMemory={handleStartFlashMemory}
              brainCharge={brainCharge}
              highScore={highScore}
              flashHighScore={flashHighLevel}
              streak={dayStreak}
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
            <GameScreen
              gameState={gameState}
              generateMathQuestion={generateMathQuestion}
              generateColorQuestion={generateColorQuestion}
              onAnswer={submitAnswer}
              onQuit={handleQuit}
              playSound={playSound}
              triggerHaptic={triggerHaptic}
              setStreak={setStreak}
              bestScore={highScore}
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
              gameState={gameState}
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
              onQuit={handleFlashQuit}
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
