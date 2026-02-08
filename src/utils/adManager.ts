// Ad Manager - Handles all ad-related logic
// TODO: Replace mock implementations with real Despia AdMob calls

type AdType = 'interstitial' | 'rewarded' | 'banner';

// TODO: Replace with real Despia AdMob unit IDs
const AD_UNITS = {
  interstitial: 'ca-app-pub-XXXX/XXXX',
  rewarded: 'ca-app-pub-XXXX/XXXX',
  banner: 'ca-app-pub-XXXX/XXXX',
};

export const AD_CONFIG = {
  FREQUENCY: 3, // Show ad every N completed games
  SKIP_COST: 2000, // XP cost to skip an interstitial ad
  CONTINUE_COST: 5000, // XP cost to continue in Endless mode (more valuable)
  CONTINUE_COUNTDOWN: 5, // Seconds to decide on continue
};

// Initialize ads — call once on app startup
export const initializeAds = async (): Promise<void> => {
  console.log('[AdManager] Initialized (mock mode)');
  // TODO: Replace with Despia AdMob initialization
  // await despia.admob.initialize();
};

// Show interstitial ad (between game sessions)
export const showInterstitial = async (): Promise<boolean> => {
  console.log('[AdManager] Showing interstitial (mock)');
  // TODO: Replace with real implementation:
  // return await despia.admob.showInterstitial(AD_UNITS.interstitial);
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 3000);
  });
};

// Show rewarded video ad (user chose to watch to continue)
export const showRewarded = async (): Promise<boolean> => {
  console.log('[AdManager] Showing rewarded video (mock)');
  // TODO: Replace with real implementation:
  // return await despia.admob.showRewarded(AD_UNITS.rewarded);
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 5000);
  });
};

// Check if ads are available
export const isAdReady = async (_type: AdType): Promise<boolean> => {
  // TODO: Replace with real ad availability check
  return true;
};
