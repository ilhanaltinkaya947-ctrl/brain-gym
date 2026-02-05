import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dashboard } from '../components/Dashboard';
import { SplashScreen } from '../components/SplashScreen';
import { MixedGameScreen } from '../components/MixedGameScreen';
import { ResultScreen } from '../components/ResultScreen';
import { NeuralBackground } from '../components/NeuralBackground';
import { SettingsModal, AppSettings } from '../components/SettingsModal';
import { OnboardingFlow } from '../components/OnboardingFlow';
import { ModeSelectionOverlay } from '../components/ModeSelectionOverlay';
import { useGameEngine } from '../hooks/useGameEngine';
import { useSounds } from '../hooks/useSounds';
import { GameConfig, DEFAULT_CONFIG, MiniGameType, MIXABLE_GAMES } from '@/types/game';

type Screen = 'dashboard' | 'game' | 'result';

// Unified UserStats interface for scalable state management
export interface UserStats {
  classicHighScore: number;
  endlessBestStreak: number;
  totalXP: number;
  totalGamesPlayed: number;
  totalCorrectAnswers: number;
  gameLevels: Record<string, number>;
  lastPlayedDate: string | null;
  dayStreak: number;
}

const DEFAULT_STATS: UserStats = {
  classicHighScore: 0,
  endlessBestStreak: 0,
  totalXP: 0,
  totalGamesPlayed: 0,
  totalCorrectAnswers: 0,
  gameLevels: {
    flashMemory: 1,
    nBackGhost: 1,
    operatorChaos: 1,
    spatialStack: 1,
    paradoxFlow: 1,
    wordConnect: 1,
  },
  lastPlayedDate: null,
  dayStreak: 0,
};

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  language: 'en',
  theme: 'dark',
};

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [modeSelectionOpen, setModeSelectionOpen] = useState(false);
  
  // App settings
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('axon-settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });
  
  // Unified user stats (replaces individual high score states)
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('axon-user-stats');
    if (saved) {
      try {
        return { ...DEFAULT_STATS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_STATS;
      }
    }
    // Migrate from old localStorage keys if they exist
    const oldClassic = localStorage.getItem('neuroflow-highscore-classic');
    const oldEndless = localStorage.getItem('neuroflow-highscore-endless');
    const oldStreak = localStorage.getItem('neuroflow-streak');
    const oldFlashLevel = localStorage.getItem('neuroflow-flash-highlevel');
    
    return {
      ...DEFAULT_STATS,
      classicHighScore: oldClassic ? parseInt(oldClassic, 10) : 0,
      endlessBestStreak: oldEndless ? parseInt(oldEndless, 10) : 0,
      dayStreak: oldStreak ? parseInt(oldStreak, 10) : 0,
      gameLevels: {
        ...DEFAULT_STATS.gameLevels,
        flashMemory: oldFlashLevel ? parseInt(oldFlashLevel, 10) : 1,
      },
    };
  });

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

  // Last game results
  const [lastScore, setLastScore] = useState(0);
  const [lastStreak, setLastStreak] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(0);
  const [lastWrong, setLastWrong] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [wasEndlessMode, setWasEndlessMode] = useState(false);
  const [lastXPGained, setLastXPGained] = useState(0);
  const [lastSessionDuration, setLastSessionDuration] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [lastPreviousBest, setLastPreviousBest] = useState(0);

  // Derived state: brain charge based on today's play
  const brainCharge = useMemo(() => {
    const today = new Date().toDateString();
    return userStats.lastPlayedDate === today ? 100 : 0;
  }, [userStats.lastPlayedDate]);

  const { playSound, triggerHaptic: triggerHapticBase, setStreak } = useSounds(appSettings.soundEnabled);
  const { generateMathQuestion, generateColorQuestion } = useGameEngine();

  // Wrapped haptic that respects settings
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if (appSettings.hapticsEnabled) {
      triggerHapticBase(type);
    }
  }, [appSettings.hapticsEnabled, triggerHapticBase]);

  // Save settings changes
  useEffect(() => {
    localStorage.setItem('axon-settings', JSON.stringify(appSettings));
  }, [appSettings]);

  // Persist user stats
  useEffect(() => {
    localStorage.setItem('axon-user-stats', JSON.stringify(userStats));
  }, [userStats]);

  const handleOpenSettings = () => {
    playSound('tick');
    setSettingsOpen(true);
  };

  const handleOpenOnboarding = () => {
    playSound('tick');
    setOnboardingOpen(true);
  };

  const handleStartGame = () => {
    playSound('tick');
    triggerHaptic('light');
    setModeSelectionOpen(true);
  };

  const handleSelectMode = (mode: 'classic' | 'endless') => {
    playSound('start');
    triggerHaptic('medium');
    setModeSelectionOpen(false);
    
    // Update game config with selected mode
    setGameConfig(prev => ({ ...prev, mode }));
    
    // Record game start time for duration tracking
    setGameStartTime(Date.now());
    
    // Store previous best for comparison
    setLastPreviousBest(mode === 'classic' ? userStats.classicHighScore : userStats.endlessBestStreak);
    
    setCurrentScreen('game');
  };

  const handleGameEnd = useCallback((score: number, streak: number, correct: number, wrong: number) => {
    const isEndlessLoss = gameConfig.mode === 'endless' && wrong > 0;
    setWasEndlessMode(gameConfig.mode === 'endless');
    
    // Calculate session duration
    const sessionDuration = Math.floor((Date.now() - gameStartTime) / 1000);
    setLastSessionDuration(sessionDuration);
    
    if (isEndlessLoss) {
      playSound('lose');
    } else {
      playSound('complete');
    }
    triggerHaptic('medium');
    
    // Calculate XP gained (10 XP per correct answer + streak bonus)
    const baseXP = correct * 10;
    const streakBonus = Math.floor(streak / 5) * 25; // Bonus every 5 streak
    const xpGained = baseXP + streakBonus;
    
    setLastScore(score);
    setLastStreak(streak);
    setLastCorrect(correct);
    setLastWrong(wrong);
    setLastXPGained(xpGained);
    
    // Update unified user stats
    const today = new Date().toDateString();
    
    setUserStats(prev => {
      const isNewDay = prev.lastPlayedDate !== today;
      let newDayStreak = prev.dayStreak;
      
      if (isNewDay) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (prev.lastPlayedDate === yesterday.toDateString()) {
          newDayStreak = prev.dayStreak + 1;
        } else {
          newDayStreak = 1;
        }
      }
      
      const newClassicHigh = gameConfig.mode === 'classic' 
        ? Math.max(prev.classicHighScore, score)
        : prev.classicHighScore;
      
      const newEndlessHigh = gameConfig.mode === 'endless'
        ? Math.max(prev.endlessBestStreak, streak)
        : prev.endlessBestStreak;
      
      // Check if new high score
      const isNewHigh = gameConfig.mode === 'classic'
        ? score > prev.classicHighScore
        : streak > prev.endlessBestStreak;
      
      setIsNewHighScore(isNewHigh);
      
      return {
        ...prev,
        classicHighScore: newClassicHigh,
        endlessBestStreak: newEndlessHigh,
        totalXP: prev.totalXP + xpGained,
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        totalCorrectAnswers: prev.totalCorrectAnswers + correct,
        lastPlayedDate: today,
        dayStreak: newDayStreak,
      };
    });

    setCurrentScreen('result');
  }, [gameConfig.mode, gameStartTime, playSound, triggerHaptic]);

  const handleQuit = () => {
    setCurrentScreen('dashboard');
  };

  const handlePlayAgain = () => {
    // Record new game start time
    setGameStartTime(Date.now());
    setCurrentScreen('game');
  };

  const handleGoHome = () => {
    setCurrentScreen('dashboard');
  };

  // Derived: display high score based on mode
  const displayHighScore = gameConfig.mode === 'classic' 
    ? userStats.classicHighScore 
    : userStats.endlessBestStreak;

   // Splash screen - early return for cleaner architecture
   if (showSplash) {
     return (
       <AnimatePresence>
         <SplashScreen onComplete={() => setShowSplash(false)} />
       </AnimatePresence>
     );
   }
 
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
             onStartGame={handleStartGame}
             onOpenSettings={handleOpenSettings}
             brainCharge={brainCharge}
             totalXP={userStats.totalXP}
             classicHighScore={userStats.classicHighScore}
             endlessBestStreak={userStats.endlessBestStreak}
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
              bestScore={userStats.classicHighScore}
              bestStreak={userStats.endlessBestStreak}
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
              score={lastScore}
              correct={lastCorrect}
              wrong={lastWrong}
              streak={lastStreak}
              onPlayAgain={handlePlayAgain}
              onGoHome={handleGoHome}
              isNewHighScore={isNewHighScore}
              xpGained={lastXPGained}
              totalXP={userStats.totalXP}
              mode={wasEndlessMode ? 'endless' : 'classic'}
              sessionDuration={lastSessionDuration}
              previousBest={lastPreviousBest}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={appSettings}
        onSettingsChange={setAppSettings}
      />

      {/* Onboarding Flow */}
      <OnboardingFlow
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={() => setOnboardingOpen(false)}
      />

      {/* Mode Selection Overlay */}
      <ModeSelectionOverlay
        isOpen={modeSelectionOpen}
        onClose={() => setModeSelectionOpen(false)}
        onSelectMode={handleSelectMode}
      />
    </div>
  );
};

export default Index;
