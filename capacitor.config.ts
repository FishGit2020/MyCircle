import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mycircle.app',
  appName: 'MyCircle',
  webDir: 'dist/firebase',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#1e293b',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  // Uncomment for live-reload development on Mac:
  // server: {
  //   url: 'http://<YOUR_LOCAL_IP>:3000',
  //   cleartext: true,
  // },
};

export default config;
