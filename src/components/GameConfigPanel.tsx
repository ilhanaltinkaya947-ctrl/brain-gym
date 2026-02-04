import { motion } from 'framer-motion';
import { Settings, Zap, Infinity, Check } from 'lucide-react';
import { GameConfig, GameMode, MiniGameType, GAME_THEMES, MIXABLE_GAMES } from '@/types/game';

interface GameConfigPanelProps {
  config: GameConfig;
  onConfigChange: (config: GameConfig) => void;
  onStart: () => void;
  onStartFlashMemory: () => void;
  highScoreClassic: number;
  highScoreEndless: number;
  flashHighLevel: number;
}

export const GameConfigPanel = ({
  config,
  onConfigChange,
  onStart,
  onStartFlashMemory,
  highScoreClassic,
  highScoreEndless,
  flashHighLevel,
}: GameConfigPanelProps) => {
  const toggleMode = (mode: GameMode) => {
    onConfigChange({ ...config, mode });
  };

  const toggleGame = (game: MiniGameType) => {
    const newGames = config.enabledGames.includes(game)
      ? config.enabledGames.filter(g => g !== game)
      : [...config.enabledGames, game];
    
    // Ensure at least one mixable game is enabled
    const hasMixable = newGames.some(g => MIXABLE_GAMES.includes(g));
    if (!hasMixable) return;
    
    onConfigChange({ ...config, enabledGames: newGames });
  };

  const mixableEnabled = config.enabledGames.filter(g => MIXABLE_GAMES.includes(g));
  const canStart = mixableEnabled.length > 0;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2"
      >
        <Settings className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-light">
          Configuration
        </span>
      </motion.div>

      {/* Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="text-xs uppercase tracking-widest text-muted-foreground text-center mb-4">
          Select Mode
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => toggleMode('classic')}
            className={`relative p-5 rounded-2xl border transition-all duration-300 ${
              config.mode === 'classic'
                ? 'border-primary/60 bg-primary/10'
                : 'border-border/30 bg-card/30 hover:border-border/50'
            }`}
          >
            {config.mode === 'classic' && (
              <motion.div
                layoutId="modeIndicator"
                className="absolute inset-0 rounded-2xl border-2 border-primary"
                style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' }}
              />
            )}
            <Zap className={`w-6 h-6 mx-auto mb-2 ${config.mode === 'classic' ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className={`text-sm font-bold uppercase tracking-wider ${config.mode === 'classic' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Classic
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
              3 Min Timer
            </div>
            <div className="text-lg font-mono font-bold mt-2 text-neon-gold">
              {highScoreClassic.toLocaleString()}
            </div>
          </button>

          <button
            onClick={() => toggleMode('endless')}
            className={`relative p-5 rounded-2xl border transition-all duration-300 ${
              config.mode === 'endless'
                ? 'border-secondary/60 bg-secondary/10'
                : 'border-border/30 bg-card/30 hover:border-border/50'
            }`}
          >
            {config.mode === 'endless' && (
              <motion.div
                layoutId="modeIndicator"
                className="absolute inset-0 rounded-2xl border-2 border-secondary"
                style={{ boxShadow: '0 0 20px hsl(var(--secondary) / 0.3)' }}
              />
            )}
            <Infinity className={`w-6 h-6 mx-auto mb-2 ${config.mode === 'endless' ? 'text-secondary' : 'text-muted-foreground'}`} />
            <div className={`text-sm font-bold uppercase tracking-wider ${config.mode === 'endless' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Endless
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
              Sudden Death
            </div>
            <div className="text-lg font-mono font-bold mt-2 text-neon-magenta">
              {highScoreEndless} streak
            </div>
          </button>
        </div>
      </motion.div>

      {/* Game Filter - All mixable games */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <div className="text-xs uppercase tracking-widest text-muted-foreground text-center mb-4">
          Active Games ({mixableEnabled.length}/{MIXABLE_GAMES.length})
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {MIXABLE_GAMES.map((gameType) => {
            const theme = GAME_THEMES[gameType];
            const isEnabled = config.enabledGames.includes(gameType);
            
            return (
              <button
                key={gameType}
                onClick={() => toggleGame(gameType)}
                className={`relative p-3 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
                  isEnabled
                    ? 'border-border/50 bg-card/50'
                    : 'border-border/20 bg-card/20 opacity-50'
                }`}
                style={isEnabled ? {
                  borderColor: `${theme.primaryColor}40`,
                  background: theme.bgGradient,
                } : {}}
              >
                <span className="text-lg">{theme.icon}</span>
                <div className="text-left flex-1 min-w-0">
                  <div className={`text-[10px] font-bold uppercase tracking-wide truncate ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {theme.label}
                  </div>
                </div>
                <div className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${
                  isEnabled 
                    ? 'border-primary bg-primary' 
                    : 'border-muted-foreground/30'
                }`}>
                  {isEnabled && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Flash Memory - Separate Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={onStartFlashMemory}
          className="w-full p-4 rounded-xl border border-border/30 bg-card/30 hover:border-game-memory/40 hover:bg-game-memory/5 transition-all duration-200 flex items-center gap-3"
        >
          <span className="text-xl">🧠</span>
          <div className="text-left flex-1">
            <div className="text-xs font-bold uppercase tracking-wide text-foreground">
              Flash Memory
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">
              Standalone • Chimp Test
            </div>
          </div>
          <div className="text-sm font-mono font-bold text-game-memory">
            L{flashHighLevel}
          </div>
        </button>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={onStart}
          disabled={!canStart}
          className={`w-full py-5 rounded-2xl text-lg font-black uppercase tracking-wider transition-all duration-300 ${
            canStart
              ? 'btn-primary-glow reactor-pulse'
              : 'bg-muted/30 text-muted-foreground cursor-not-allowed'
          }`}
        >
          {config.mode === 'classic' ? 'Start Training' : 'Begin Endless'}
        </button>
      </motion.div>
    </div>
  );
};
