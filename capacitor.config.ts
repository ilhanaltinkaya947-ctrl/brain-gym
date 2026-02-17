import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.axon.braintraining',
  appName: 'AXON',
  webDir: 'dist',
  backgroundColor: '#000000',
  server: {
    // Use default capacitor:// scheme for proper local file serving in WKWebView
  },
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    backgroundColor: '#000000',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  },
};

export default config;
