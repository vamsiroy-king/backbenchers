import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alliance.backbenchers',
  appName: 'Backbenchers',
  webDir: 'public', // Using public as a dummy fallback when offline
  server: {
    url: 'https://www.backbenchers.app', // Your live production URL goes here. Swap to localhost for dev!
    cleartext: true, // Allow http for local development testing
  }
};

export default config;
