import { useCallback, useEffect, useState } from 'react';
import { 
  isNative, 
  getPlatform, 
  haptics, 
  notifications, 
  statusBar, 
  initialize 
} from '@/utils/despia';

type Platform = 'ios' | 'android' | 'web';

interface UseDespia {
  /** Whether running in a native Despia app */
  isNative: boolean;
  /** Current platform: 'ios', 'android', or 'web' */
  platform: Platform;
  /** Haptic feedback methods */
  haptic: {
    light: () => void;
    medium: () => void;
    heavy: () => void;
    success: () => void;
    warning: () => void;
    error: () => void;
    selection: () => void;
  };
  /** Notification methods */
  notifications: {
    requestPermission: () => Promise<boolean>;
    schedule: (options: { title: string; body: string; at: Date }) => Promise<void>;
  };
  /** Status bar control (native only) */
  statusBar: {
    setStyle: (style: 'dark' | 'light') => void;
    hide: () => void;
    show: () => void;
  };
}

/**
 * React hook for accessing Despia native features
 * 
 * @example
 * ```tsx
 * const { isNative, haptic, platform } = useDespia();
 * 
 * const handleCorrectAnswer = () => {
 *   haptic.medium(); // Provides haptic feedback
 *   // ... game logic
 * };
 * ```
 */
export const useDespia = (): UseDespia => {
  const [native, setNative] = useState(false);
  const [platform, setPlatform] = useState<Platform>('web');

  // Check native status on mount
  useEffect(() => {
    setNative(isNative());
    setPlatform(getPlatform());
    
    // Initialize Despia (sets up status bar, etc.)
    initialize();
  }, []);

  // Memoized haptic callbacks
  const haptic = {
    light: useCallback(() => haptics.light(), []),
    medium: useCallback(() => haptics.medium(), []),
    heavy: useCallback(() => haptics.heavy(), []),
    success: useCallback(() => haptics.success(), []),
    warning: useCallback(() => haptics.warning(), []),
    error: useCallback(() => haptics.error(), []),
    selection: useCallback(() => haptics.selection(), []),
  };

  // Notification methods
  const notificationMethods = {
    requestPermission: useCallback(() => notifications.requestPermission(), []),
    schedule: useCallback(
      (options: { title: string; body: string; at: Date }) => 
        notifications.schedule(options),
      []
    ),
  };

  // Status bar methods
  const statusBarMethods = {
    setStyle: useCallback((style: 'dark' | 'light') => statusBar.setStyle(style), []),
    hide: useCallback(() => statusBar.hide(), []),
    show: useCallback(() => statusBar.show(), []),
  };

  return {
    isNative: native,
    platform,
    haptic,
    notifications: notificationMethods,
    statusBar: statusBarMethods,
  };
};

export default useDespia;
