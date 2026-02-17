import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { AppSettings } from '@/types/game';
import { haptics } from '@/utils/despia';

export { type AppSettings };

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export const SettingsModal = ({ isOpen, onClose, settings, onSettingsChange }: SettingsModalProps) => {
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 300], [1, 0.2]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y > 300 || info.offset.y > 150) {
      onClose();
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    haptics.light();
    onSettingsChange({ ...settings, soundEnabled: enabled });
  };

  const handleHapticsToggle = (enabled: boolean) => {
    if (enabled) haptics.medium();
    onSettingsChange({ ...settings, hapticsEnabled: enabled });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            style={{ y: dragY }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[60] max-h-[85vh] overflow-hidden"
          >
            <div className="bg-card rounded-t-3xl border-t border-border/50 safe-bottom">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4">
                <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { haptics.light(); onClose(); }}
                  className="p-2.5 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Settings List */}
              <div className="px-6 pb-8 space-y-2">
                {/* Sound */}
                <div
                  className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-primary" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">Sound</p>
                      <p className="text-xs text-muted-foreground">Game audio effects</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={handleSoundToggle}
                  />
                </div>

                {/* Haptics */}
                <div
                  className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <Vibrate className={`w-5 h-5 ${settings.hapticsEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-medium">Haptics</p>
                      <p className="text-xs text-muted-foreground">Vibration feedback</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.hapticsEnabled}
                    onCheckedChange={handleHapticsToggle}
                  />
                </div>

                {/* Version Info */}
                <div className="pt-6 text-center">
                  <p className="text-xs text-muted-foreground/50">axon v1.0.0</p>
                  <p className="text-xs text-muted-foreground/30">Train Your Neural Pathways</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
