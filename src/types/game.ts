// Game type definitions for the Brain Platform

export type GameMode = 'classic' | 'endless';

export type MiniGameType = 'speedMath' | 'colorMatch' | 'flashMemory' | 'directionLogic' | 'patternHunter';

export interface GameConfig {
  mode: GameMode;
  enabledGames: MiniGameType[];
}

export interface GameTheme {
  name: string;
  label: string;
  icon: string;
  primaryColor: string;
  accentColor: string;
  bgGradient: string;
}

export const GAME_THEMES: Record<MiniGameType, GameTheme> = {
  speedMath: {
    name: 'speedMath',
    label: 'Speed Math',
    icon: '⚡',
    primaryColor: 'hsl(var(--game-math))',
    accentColor: 'hsl(var(--game-math-accent))',
    bgGradient: 'linear-gradient(135deg, hsl(var(--game-math) / 0.15), transparent)',
  },
  colorMatch: {
    name: 'colorMatch',
    label: 'Color Chaos',
    icon: '🎨',
    primaryColor: 'hsl(var(--game-color))',
    accentColor: 'hsl(var(--game-color-accent))',
    bgGradient: 'linear-gradient(135deg, hsl(var(--game-color) / 0.15), transparent)',
  },
  flashMemory: {
    name: 'flashMemory',
    label: 'Flash Memory',
    icon: '🧠',
    primaryColor: 'hsl(var(--game-memory))',
    accentColor: 'hsl(var(--game-memory-accent))',
    bgGradient: 'linear-gradient(135deg, hsl(var(--game-memory) / 0.15), transparent)',
  },
  directionLogic: {
    name: 'directionLogic',
    label: 'Direction Logic',
    icon: '🧭',
    primaryColor: 'hsl(var(--game-direction))',
    accentColor: 'hsl(var(--game-direction-accent))',
    bgGradient: 'linear-gradient(135deg, hsl(var(--game-direction) / 0.15), transparent)',
  },
  patternHunter: {
    name: 'patternHunter',
    label: 'Pattern Hunter',
    icon: '🔍',
    primaryColor: 'hsl(var(--game-pattern))',
    accentColor: 'hsl(var(--game-pattern-accent))',
    bgGradient: 'linear-gradient(135deg, hsl(var(--game-pattern) / 0.15), transparent)',
  },
};

export const DEFAULT_CONFIG: GameConfig = {
  mode: 'classic',
  enabledGames: ['speedMath', 'colorMatch', 'directionLogic', 'patternHunter'],
};

// Mixable games (exclude flashMemory as it has different flow)
export const MIXABLE_GAMES: MiniGameType[] = ['speedMath', 'colorMatch', 'directionLogic', 'patternHunter'];
