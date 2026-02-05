// Game type definitions for the AXON Brain Platform

export type GameMode = 'classic' | 'endless';

export type MiniGameType = 
  | 'speedMath' 
  | 'colorMatch' 
  | 'flashMemory' 
  | 'paradoxFlow' 
  | 'patternHunter'
  | 'nBackGhost'
  | 'operatorChaos'
  | 'spatialStack'
  | 'wordConnect'
  | 'suitDeception'
  | 'chimpMemory'
  | 'cubeCount';

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
  paradoxFlow: {
    name: 'paradoxFlow',
    label: 'Paradox Flow',
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
  nBackGhost: {
    name: 'nBackGhost',
    label: 'N-Back Ghost',
    icon: '👻',
    primaryColor: 'hsl(175, 60%, 50%)',
    accentColor: 'hsl(180, 70%, 45%)',
    bgGradient: 'linear-gradient(135deg, hsl(175, 60%, 50% / 0.15), transparent)',
  },
  operatorChaos: {
    name: 'operatorChaos',
    label: 'Operator Chaos',
    icon: '➗',
    primaryColor: 'hsl(45, 90%, 55%)',
    accentColor: 'hsl(25, 90%, 55%)',
    bgGradient: 'linear-gradient(135deg, hsl(45, 90%, 55% / 0.15), transparent)',
  },
  spatialStack: {
    name: 'spatialStack',
    label: 'Spatial Stack',
    icon: '📦',
    primaryColor: 'hsl(140, 70%, 45%)',
    accentColor: 'hsl(120, 60%, 45%)',
    bgGradient: 'linear-gradient(135deg, hsl(140, 70%, 45% / 0.15), transparent)',
  },
  wordConnect: {
    name: 'wordConnect',
    label: 'Word Connect',
    icon: '🔤',
    primaryColor: 'hsl(210, 80%, 55%)',
    accentColor: 'hsl(230, 70%, 55%)',
    bgGradient: 'linear-gradient(135deg, hsl(210, 80%, 55% / 0.15), transparent)',
  },
  suitDeception: {
    name: 'suitDeception',
    label: 'Suit Deception',
    icon: '♠️',
    primaryColor: 'hsl(0, 70%, 55%)',
    accentColor: 'hsl(0, 80%, 45%)',
    bgGradient: 'linear-gradient(135deg, hsl(0, 70%, 55% / 0.15), transparent)',
  },
  chimpMemory: {
    name: 'chimpMemory',
    label: 'Chimp Memory',
    icon: '🐒',
    primaryColor: 'hsl(280, 70%, 55%)',
    accentColor: 'hsl(300, 60%, 50%)',
    bgGradient: 'linear-gradient(135deg, hsl(280, 70%, 55% / 0.15), transparent)',
  },
  cubeCount: {
    name: 'cubeCount',
    label: 'Cube Count',
    icon: '🧊',
    primaryColor: 'hsl(200, 70%, 50%)',
    accentColor: 'hsl(220, 80%, 55%)',
    bgGradient: 'linear-gradient(135deg, hsl(200, 70%, 50% / 0.15), transparent)',
  },
};

export const DEFAULT_CONFIG: GameConfig = {
  mode: 'endless',
  enabledGames: ['speedMath', 'paradoxFlow', 'suitDeception', 'chimpMemory', 'cubeCount'],
};

// Mixable games - focused on high cognitive load
// NOTE: nBackGhost and colorMatch removed - replaced with suitDeception and chimpMemory
export const MIXABLE_GAMES: MiniGameType[] = [
  'speedMath', 
  'paradoxFlow', 
  'suitDeception',
  'chimpMemory',
  'cubeCount',
];
