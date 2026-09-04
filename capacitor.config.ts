import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wildrealm.app',
  appName: 'Wander',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    Keyboard: {
      resize: 'body'
    }
  }
};

export default config;
