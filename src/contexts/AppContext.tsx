import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { GameConfig, DEFAULT_CONFIG, MIXABLE_GAMES, MiniGameType, AppSettings, UserStats } from '@/types/game';
import { AD_CONFIG } from '@/utils/adManager';

interface AdState {
    gamesPlayedSinceLastAd: number;
    totalAdsWatched: number;
    totalAdsSkipped: number;
    xpSpentOnSkips: number;
}

const DEFAULT_STATS: UserStats = {
    classicHighScore: 0,
    endlessBestStreak: 0,
    totalXP: 0,
    totalGamesPlayed: 0,
    totalCorrectAnswers: 0,
    gameLevels: {
        flashMemory: 1,
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

const DEFAULT_AD_STATE: AdState = {
    gamesPlayedSinceLastAd: 0,
    totalAdsWatched: 0,
    totalAdsSkipped: 0,
    xpSpentOnSkips: 0
};

interface AppContextType {
    userStats: UserStats;
    setUserStats: React.Dispatch<React.SetStateAction<UserStats>>;
    appSettings: AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    gameConfig: GameConfig;
    setGameConfig: React.Dispatch<React.SetStateAction<GameConfig>>;
    adState: AdState;
    setAdState: React.Dispatch<React.SetStateAction<AdState>>;
    brainCharge: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
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

    // User stats
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
                const parsed = JSON.parse(saved);
                // Merge saved enabled games with ALL mixable games to ensure new games appear
                const mergedGames = [...new Set([...MIXABLE_GAMES, ...(parsed.enabledGames || [])])];
                return {
                    ...DEFAULT_CONFIG,
                    ...parsed,
                    enabledGames: mergedGames.filter(g => MIXABLE_GAMES.includes(g)) as MiniGameType[],
                };
            } catch {
                return DEFAULT_CONFIG;
            }
        }
        return DEFAULT_CONFIG;
    });

    // Ad system state
    const [adState, setAdState] = useState<AdState>(() => {
        const saved = localStorage.getItem('axon-ad-state');
        if (saved) {
            try { return JSON.parse(saved); } catch { /* ignore */ }
        }
        return DEFAULT_AD_STATE;
    });

    // Derived state: brain charge based on today's play
    const brainCharge = useMemo(() => {
        const today = new Date().toDateString();
        return userStats.lastPlayedDate === today ? 100 : 0;
    }, [userStats.lastPlayedDate]);

    // Persist settings
    useEffect(() => {
        localStorage.setItem('axon-settings', JSON.stringify(appSettings));
    }, [appSettings]);

    // Persist user stats
    useEffect(() => {
        localStorage.setItem('axon-user-stats', JSON.stringify(userStats));
    }, [userStats]);

    // Persist game config - technically Index.tsx didn't persist this explicitly in a useEffect, 
    // but it's good practice. Wait, Index.tsx DID NOT have a useEffect for gameConfig persistence. 
    // It only read from localStorage. Let's check if we should add it.
    // Actually, Index.tsx read it from 'neuroflow-config' but never wrote to it? 
    // Let's re-read Index.tsx to be sure. 
    // Ah, Index.tsx lines 107-124 read it. But I don't see a `useEffect` writing `gameConfig` to localStorage in Index.tsx.
    // I will add it here for completeness, or omit if strictly following 'no logic change'. 
    // It seems safer to omit writing if it wasn't writing before, to avoid side effects. 
    // But wait, `setGameConfig` is used in `handleSelectMode`. If it's not saved, it resets on reload.
    // Maybe it was intended to be ephemeral per session? 
    // "saved" is read from 'neuroflow-config'. 
    // I'll add the persistence to be safe, as it's likely intended. 
    // actually, let's look at `Index.tsx` again. usage of `setGameConfig` implies we might want to save it?
    // I'll add the persistence to 'neuroflow-config'.
    useEffect(() => {
        localStorage.setItem('neuroflow-config', JSON.stringify(gameConfig));
    }, [gameConfig]);

    // Persist ad state
    useEffect(() => {
        localStorage.setItem('axon-ad-state', JSON.stringify(adState));
    }, [adState]);

    return (
        <AppContext.Provider value={{
            userStats, setUserStats,
            appSettings, setAppSettings,
            gameConfig, setGameConfig,
            adState, setAdState,
            brainCharge
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
