import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { FlashMemory } from './FlashMemory';

interface FlashMemoryScreenProps {
  onGameOver: (level: number, score: number) => void;
  onQuit: () => void;
  playSound: (type: 'correct' | 'wrong' | 'tick') => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
}

export const FlashMemoryScreen = ({
  onGameOver,
  onQuit,
  playSound,
  triggerHaptic,
}: FlashMemoryScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-6 pb-4"
      >
        {/* Quit button */}
        <button 
          onClick={onQuit}
          className="absolute top-6 right-6 p-2 rounded-full bg-muted/30 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors z-10 border border-border/30"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Game type indicator */}
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--neon-magenta) / 0.2), hsl(var(--neon-magenta) / 0.05))',
              borderColor: 'hsl(var(--neon-magenta) / 0.5)',
              color: 'hsl(var(--neon-magenta))',
            }}
          >
            🧠 Flash Memory
          </motion.span>
          <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">Sudden Death Mode</p>
        </div>
      </motion.div>

      {/* Game Area */}
      <div className="flex-1 relative">
        <FlashMemory
          onGameOver={onGameOver}
          playSound={playSound}
          triggerHaptic={triggerHaptic}
        />
      </div>
    </div>
  );
};
