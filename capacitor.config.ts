import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wildrealm.app',
  appName: 'Wander',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: 'body'
    }
  }
};

export default config;
