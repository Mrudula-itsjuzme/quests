import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wildrealm.app',
  appName: 'Wild Realm',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: 'body'
    }
  }
};

export default config;
