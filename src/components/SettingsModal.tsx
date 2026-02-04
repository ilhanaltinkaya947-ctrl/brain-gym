import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Vibrate, Globe, ChevronRight, Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export interface AppSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  language: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
  theme: 'dark' | 'auto';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
] as const;

export const SettingsModal = ({ isOpen, onClose, settings, onSettingsChange }: SettingsModalProps) => {
  const [showLanguages, setShowLanguages] = useState(false);

  const handleSoundToggle = (enabled: boolean) => {
    onSettingsChange({ ...settings, soundEnabled: enabled });
  };

  const handleHapticsToggle = (enabled: boolean) => {
    onSettingsChange({ ...settings, hapticsEnabled: enabled });
  };

  const handleLanguageChange = (lang: AppSettings['language']) => {
    onSettingsChange({ ...settings, language: lang });
    setShowLanguages(false);
  };

  const currentLanguage = LANGUAGES.find(l => l.code === settings.language) || LANGUAGES[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden"
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
                  onClick={onClose}
                  className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Settings List */}
              <div className="px-6 pb-8 space-y-2">
                {/* Sound */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
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
                </motion.div>

                {/* Haptics */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
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
                </motion.div>

                {/* Language */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLanguages(!showLanguages)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Language</p>
                      <p className="text-xs text-muted-foreground">App display language</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentLanguage.flag}</span>
                    <span className="text-sm text-muted-foreground">{currentLanguage.label}</span>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showLanguages ? 'rotate-90' : ''}`} />
                  </div>
                </motion.button>

                {/* Language Options */}
                <AnimatePresence>
                  {showLanguages && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {LANGUAGES.map((lang) => (
                          <motion.button
                            key={lang.code}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLanguageChange(lang.code as AppSettings['language'])}
                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                              settings.language === lang.code
                                ? 'bg-primary/20 border-primary/50 text-primary'
                                : 'bg-muted/20 border-border/30 text-muted-foreground hover:border-border'
                            }`}
                          >
                            <span className="text-lg">{lang.flag}</span>
                            <span className="text-sm font-medium">{lang.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Version Info */}
                <div className="pt-6 text-center">
                  <p className="text-xs text-muted-foreground/50">AXON v1.0.0</p>
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
