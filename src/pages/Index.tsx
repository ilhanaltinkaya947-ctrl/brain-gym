import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dashboard } from '../components/Dashboard';
import { MixedGameScreen } from '../components/MixedGameScreen';
import { ResultScreen } from '../components/ResultScreen';
import { NeuralBackground } from '../components/NeuralBackground';
import { SettingsModal, AppSettings } from '../components/SettingsModal';
import { OnboardingFlow } from '../components/Onboarding/OnboardingFlow';
import { ModeSelectionOverlay } from '../components/ModeSelectionOverlay';
import { useGameEngine } from '../hooks/useGameEngine';
import { useSounds } from '../hooks/useSounds';
import { GameConfig, DEFAULT_CONFIG, MiniGameType, MIXABLE_GAMES, UserStats } from '@/types/game';
import { useApp } from '@/contexts/AppContext';
import { AdSkipModal } from '../components/AdSkipModal';
import { ContinueModal } from '../components/ContinueModal';
import { AD_CONFIG } from '@/utils/adManager';

type Screen = 'dashboard' | 'game' | 'result';



const Index = () => {
  // Check if first-time user (FTUE)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('axon-hasSeenOnboarding');
  });
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modeSelectionOpen, setModeSelectionOpen] = useState(false);

  // Use App Context for global state
  const {
    userStats, setUserStats,
    appSettings, setAppSettings,
    gameConfig, setGameConfig,
    adState, setAdState,
    brainCharge
  } = useApp();

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
  const [selectedStartTier, setSelectedStartTier] = useState(1);

  // Ad system state
  const [showAdSkipModal, setShowAdSkipModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'playAgain' | 'home' | null>(null);

  // Continue modal state (Endless mode)
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [continueGranted, setContinueGranted] = useState(false);
  const [pendingDeathData, setPendingDeathData] = useState<{
    score: number; streak: number; correct: number; wrong: number; sessionXP: number;
  } | null>(null);

  const { playSound, triggerHaptic: triggerHapticBase, setStreak } = useSounds(appSettings.soundEnabled);
  const { generateMathQuestion, generateColorQuestion } = useGameEngine();

  // Wrapped haptic that respects settings
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if (appSettings.hapticsEnabled) {
      triggerHapticBase(type);
    }
  }, [appSettings.hapticsEnabled, triggerHapticBase]);



  const handleOpenSettings = () => {
    playSound('tick');
    setSettingsOpen(true);
  };

  const handleStartGame = () => {
    playSound('tick');
    triggerHaptic('light');
    setModeSelectionOpen(true);
  };

  const handleSelectMode = (mode: 'classic' | 'endless', startTier: number = 1) => {
    playSound('start');
    triggerHaptic('medium');
    setModeSelectionOpen(false);

    // Update game config with selected mode
    setGameConfig(prev => ({ ...prev, mode }));

    // Record game start time for duration tracking
    setGameStartTime(Date.now());

    // Store previous best for comparison
    setLastPreviousBest(mode === 'classic' ? userStats.classicHighScore : userStats.endlessBestStreak);

    // Store starting tier for game initialization
    setSelectedStartTier(startTier);

    setCurrentScreen('game');
  };

  const handleGameEnd = useCallback((score: number, streak: number, correct: number, wrong: number, peakSpeed?: number, duration?: number, sessionXP?: number) => {
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

    // Use passed sessionXP if available, otherwise calculate fallback
    const xpGained = sessionXP !== undefined ? sessionXP : (correct * 10 + Math.floor(streak / 5) * 25);

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

    // Increment games played for ad frequency tracking
    setAdState((prev: typeof adState) => ({ ...prev, gamesPlayedSinceLastAd: prev.gamesPlayedSinceLastAd + 1 }));

    setCurrentScreen('result');
  }, [gameConfig.mode, gameStartTime, playSound, triggerHaptic]);

  // Endless mode: handle continue request from MixedGameScreen
  const handleRequestContinue = useCallback((score: number, streak: number, correct: number, wrong: number, sessionXP: number) => {
    setPendingDeathData({ score, streak, correct, wrong, sessionXP });
    setShowContinueModal(true);
  }, []);

  const handleContinueWithAd = useCallback(() => {
    setShowContinueModal(false);
    setPendingDeathData(null);
    setContinueGranted(true);
    setAdState((prev: typeof adState) => ({ ...prev, totalAdsWatched: prev.totalAdsWatched + 1 }));
    // Reset continueGranted after a tick so it can be detected as a change
    setTimeout(() => setContinueGranted(false), 100);
  }, []);

  const handleContinueWithXP = useCallback(() => {
    setShowContinueModal(false);
    setPendingDeathData(null);
    // Deduct XP
    setUserStats(prev => ({
      ...prev,
      totalXP: Math.max(0, prev.totalXP - AD_CONFIG.CONTINUE_COST),
    }));
    setAdState((prev: typeof adState) => ({
      ...prev,
      totalAdsSkipped: prev.totalAdsSkipped + 1,
      xpSpentOnSkips: prev.xpSpentOnSkips + AD_CONFIG.CONTINUE_COST,
    }));
    setContinueGranted(true);
    setTimeout(() => setContinueGranted(false), 100);
  }, []);

  const handleEndRun = useCallback(() => {
    setShowContinueModal(false);
    // Trigger actual game over with the pending death data
    if (pendingDeathData) {
      const { score, streak, correct, wrong, sessionXP } = pendingDeathData;
      setPendingDeathData(null);
      // Manually set last game results and go to result screen
      setWasEndlessMode(true);
      setLastScore(score);
      setLastStreak(streak);
      setLastCorrect(correct);
      setLastWrong(wrong);
      const xpGained = sessionXP;
      setLastXPGained(xpGained);
      const sessionDuration = Math.floor((Date.now() - gameStartTime) / 1000);
      setLastSessionDuration(sessionDuration);
      setLastPreviousBest(userStats.endlessBestStreak);

      playSound('lose');
      triggerHaptic('medium');

      // Update stats
      const today = new Date().toDateString();
      setUserStats(prev => {
        const isNewDay = prev.lastPlayedDate !== today;
        let newDayStreak = prev.dayStreak;
        if (isNewDay) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          newDayStreak = prev.lastPlayedDate === yesterday.toDateString() ? prev.dayStreak + 1 : 1;
        }
        const isNewHigh = streak > prev.endlessBestStreak;
        setIsNewHighScore(isNewHigh);
        return {
          ...prev,
          endlessBestStreak: Math.max(prev.endlessBestStreak, streak),
          totalXP: prev.totalXP + xpGained,
          totalGamesPlayed: prev.totalGamesPlayed + 1,
          totalCorrectAnswers: prev.totalCorrectAnswers + correct,
          lastPlayedDate: today,
          dayStreak: newDayStreak,
        };
      });

      setAdState((prev: typeof adState) => ({ ...prev, gamesPlayedSinceLastAd: prev.gamesPlayedSinceLastAd + 1 }));
      setCurrentScreen('result');
    }
  }, [pendingDeathData, gameStartTime, userStats.endlessBestStreak, playSound, triggerHaptic]);

  const handleQuit = () => {
    setCurrentScreen('dashboard');
  };

  // Check if ad should be shown before navigating (mode-aware frequency)
  const checkAdBeforeNav = useCallback((destination: 'playAgain' | 'home') => {
    const frequency = wasEndlessMode ? AD_CONFIG.ENDLESS_FREQUENCY : AD_CONFIG.CLASSIC_FREQUENCY;
    if (adState.gamesPlayedSinceLastAd >= frequency) {
      setPendingNavigation(destination);
      setShowAdSkipModal(true);
    } else {
      if (destination === 'playAgain') {
        setGameStartTime(Date.now());
        setCurrentScreen('game');
      } else {
        setCurrentScreen('dashboard');
      }
    }
  }, [adState.gamesPlayedSinceLastAd, wasEndlessMode]);

  const handleAdWatched = useCallback(() => {
    setShowAdSkipModal(false);
    setAdState((prev: typeof adState) => ({
      ...prev,
      gamesPlayedSinceLastAd: 0,
      totalAdsWatched: prev.totalAdsWatched + 1,
    }));
    if (pendingNavigation === 'playAgain') {
      setGameStartTime(Date.now());
      setCurrentScreen('game');
    } else {
      setCurrentScreen('dashboard');
    }
    setPendingNavigation(null);
  }, [pendingNavigation]);

  const handleAdSkippedWithXP = useCallback(() => {
    setShowAdSkipModal(false);
    setUserStats(prev => ({
      ...prev,
      totalXP: Math.max(0, prev.totalXP - AD_CONFIG.SKIP_COST),
    }));
    setAdState((prev: typeof adState) => ({
      ...prev,
      gamesPlayedSinceLastAd: 0,
      totalAdsSkipped: prev.totalAdsSkipped + 1,
      xpSpentOnSkips: prev.xpSpentOnSkips + AD_CONFIG.SKIP_COST,
    }));
    if (pendingNavigation === 'playAgain') {
      setGameStartTime(Date.now());
      setCurrentScreen('game');
    } else {
      setCurrentScreen('dashboard');
    }
    setPendingNavigation(null);
  }, [pendingNavigation]);

  const handlePlayAgain = () => {
    checkAdBeforeNav('playAgain');
  };

  const handleGoHome = () => {
    checkAdBeforeNav('home');
  };

  // Derived: display high score based on mode
  const displayHighScore = gameConfig.mode === 'classic'
    ? userStats.classicHighScore
    : userStats.endlessBestStreak;

  // Onboarding - early return for first-time users
  if (showOnboarding) {
    return (
      <AnimatePresence>
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen-dynamic overflow-x-hidden relative">
      <NeuralBackground />

      <AnimatePresence mode="wait">
        {currentScreen === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
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
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="h-screen-dynamic"
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
              startTier={selectedStartTier}
              onRequestContinue={handleRequestContinue}
              continueGranted={continueGranted}
            />
          </motion.div>
        )}

        {currentScreen === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
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

      {/* Mode Selection Overlay */}
      <ModeSelectionOverlay
        isOpen={modeSelectionOpen}
        onClose={() => setModeSelectionOpen(false)}
        onSelectMode={handleSelectMode}
      />

      {/* Ad Skip Modal — shows every 3rd game when navigating from results */}
      <AdSkipModal
        isOpen={showAdSkipModal}
        currentXP={userStats.totalXP}
        onWatchAd={handleAdWatched}
        onSkipWithXP={handleAdSkippedWithXP}
      />

      {/* Continue Modal — Endless mode second chance */}
      <ContinueModal
        isOpen={showContinueModal}
        currentXP={userStats.totalXP}
        currentStreak={pendingDeathData?.streak ?? 0}
        currentScore={pendingDeathData?.score ?? 0}
        onContinueWithAd={handleContinueWithAd}
        onContinueWithXP={handleContinueWithXP}
        onEndRun={handleEndRun}
      />
    </div>
  );
};

export default Index;
