import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.homechef.app',
  appName: 'HomeChef',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '545040228507-l8e0ap0v20jcmrmra1mar3akri99dson.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
