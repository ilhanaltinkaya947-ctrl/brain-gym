/**
 * Despia Native Bridge
 *
 * This module provides a unified API to interact with native features.
 * When running inside a Capacitor-wrapped native app, it delegates to
 * Capacitor plugins. Falls back to the legacy Despia bridge or web APIs.
 *
 * Priority: Capacitor → Despia → Web fallback
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar as CapStatusBar, Style } from '@capacitor/status-bar';

// Type definitions for legacy Despia global object (injected at runtime)
interface DespiaHaptics {
  impact: (style: 'light' | 'medium' | 'heavy') => void;
  notification: (type: 'success' | 'warning' | 'error') => void;
  selection: () => void;
}

interface DespiaNotifications {
  requestPermission: () => Promise<boolean>;
  schedule: (options: { title: string; body: string; at: Date }) => Promise<void>;
}

interface DespiaStatusBar {
  setStyle: (style: 'dark' | 'light') => void;
  hide: () => void;
  show: () => void;
}

interface DespiaPlatform {
  isNative: boolean;
  os: 'ios' | 'android' | 'web';
  version: string;
}

interface DespiaGlobal {
  haptics: DespiaHaptics;
  notifications: DespiaNotifications;
  statusBar: DespiaStatusBar;
  platform: DespiaPlatform;
}

declare global {
  interface Window {
    despia?: DespiaGlobal;
  }
}

/**
 * Check if running inside Capacitor native app
 */
const isCapacitor = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/**
 * Check if running inside a native app (Capacitor or legacy Despia)
 */
export const isNative = (): boolean => {
  return isCapacitor() || (typeof window !== 'undefined' && !!window.despia?.platform?.isNative);
};

/**
 * Get current platform
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  if (isCapacitor()) {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios' || platform === 'android') return platform;
    return 'web';
  }
  if (typeof window !== 'undefined' && window.despia?.platform?.os) {
    return window.despia.platform.os;
  }
  return 'web';
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => getPlatform() === 'ios';

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => getPlatform() === 'android';

/**
 * Haptic Feedback
 * Capacitor → legacy Despia → Vibration API fallback
 */
export const haptics = {
  /**
   * Light tap feedback - for selections, toggles
   */
  light: (): void => {
    if (isCapacitor()) {
      Haptics.impact({ style: ImpactStyle.Light });
      return;
    }
    if (window.despia?.haptics) {
      window.despia.haptics.impact('light');
    } else if ('vibrate' in navigator) {
      navigator.vibrate(8);
    }
  },

  /**
   * Medium impact - for correct answers, confirmations
   */
  medium: (): void => {
    if (isCapacitor()) {
      Haptics.impact({ style: ImpactStyle.Medium });
      return;
    }
    if (window.despia?.haptics) {
      window.despia.haptics.impact('medium');
    } else if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  },

  /**
   * Heavy impact - for errors, wrong answers, important alerts
   */
  heavy: (): void => {
    if (isCapacitor()) {
      Haptics.impact({ style: ImpactStyle.Heavy });
      return;
    }
    if (window.despia?.haptics) {
      window.despia.haptics.impact('heavy');
    } else if ('vibrate' in navigator) {
      navigator.vibrate([25, 10, 25]);
    }
  },

  /**
   * Success pattern - for achievements, milestones, level completion
   */
  success: (): void => {
    if (isCapacitor()) {
      Haptics.notification({ type: NotificationType.Success });
      return;
    }
    if (window.despia?.haptics) {
      window.despia.haptics.notification('success');
    } else if ('vibrate' in navigator) {
      navigator.vibrate([15, 50, 15, 50, 30]);
    }
  },

  /**
   * Warning pattern - for time running out, approaching limits
   */
  warning: (): void => {
    if (isCapacitor()) {
      Haptics.notification({ type: NotificationType.Warning });
      return;
    }
    if (window.despia?.haptics) {
      window.despia.haptics.notification('warning');
    } else if ('vibrate' in navigator) {
      navigator.vibrate([20, 30, 20]);
    }
  },

  /**
   * Error pattern - for game over, failures
   */
  error: (): void => {
    if (isCapacitor()) {
      Haptics.notification({ type: NotificationType.Error });
      return;
    }
    if (window.despia?.haptics) {
      window.despia.haptics.notification('error');
    } else if ('vibrate' in navigator) {
      navigator.vibrate([40, 20, 40, 20, 60]);
    }
  },

  /**
   * Selection click - subtle feedback for UI interactions
   */
  selection: (): void => {
    if (isCapacitor()) {
      Haptics.selectionStart();
      return;
    }
    if (window.despia?.haptics) {
      window.despia.haptics.selection();
    } else if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  },
};

/**
 * Push Notifications
 */
export const notifications = {
  /**
   * Request permission for push notifications
   * Returns true if granted, false otherwise
   */
  requestPermission: async (): Promise<boolean> => {
    if (window.despia?.notifications) {
      return window.despia.notifications.requestPermission();
    }

    // Web fallback - use Notification API
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }

    return false;
  },

  /**
   * Schedule a local notification
   */
  schedule: async (options: { title: string; body: string; at: Date }): Promise<void> => {
    if (window.despia?.notifications) {
      return window.despia.notifications.schedule(options);
    }

    // Web fallback - show notification immediately if in past, otherwise ignore
    if ('Notification' in window && Notification.permission === 'granted') {
      if (options.at <= new Date()) {
        new Notification(options.title, { body: options.body });
      }
    }
  },
};

/**
 * Status Bar Control
 * Capacitor → legacy Despia → no-op
 */
export const statusBar = {
  /**
   * Set status bar style (light text on dark bg, or dark text on light bg)
   */
  setStyle: (style: 'dark' | 'light'): void => {
    if (isCapacitor()) {
      // Capacitor's Style.Dark = light text (dark bg), Style.Light = dark text (light bg)
      CapStatusBar.setStyle({ style: style === 'light' ? Style.Dark : Style.Light });
      return;
    }
    if (window.despia?.statusBar) {
      window.despia.statusBar.setStyle(style);
    }
  },

  /**
   * Hide status bar for fullscreen experience
   */
  hide: (): void => {
    if (isCapacitor()) {
      CapStatusBar.hide();
      return;
    }
    if (window.despia?.statusBar) {
      window.despia.statusBar.hide();
    }
  },

  /**
   * Show status bar
   */
  show: (): void => {
    if (isCapacitor()) {
      CapStatusBar.show();
      return;
    }
    if (window.despia?.statusBar) {
      window.despia.statusBar.show();
    }
  },
};

/**
 * Initialize for optimal native experience
 * Call this in your App component on mount
 */
export const initialize = (): void => {
  if (isNative()) {
    // Set status bar style for dark theme
    statusBar.setStyle('light'); // Light text on dark background

    console.log(`[Despia] Running on ${getPlatform()} native app (Capacitor: ${isCapacitor()})`);
  } else {
    console.log('[Despia] Running in web browser mode');
  }
};

// Default export for convenience
export default {
  isNative,
  getPlatform,
  isIOS,
  isAndroid,
  haptics,
  notifications,
  statusBar,
  initialize,
};
