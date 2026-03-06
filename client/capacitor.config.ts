import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moodtunes.app',
  appName: 'MoodTunes',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
