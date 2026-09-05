import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3001';

// A Capacitor build loads from capacitor://localhost, where the default
// relative '/api' base resolves to the device instead of the backend. Fail the
// build rather than shipping a native client that cannot reach the API.
if (process.env.VITE_NATIVE_BUILD === 'true' && process.env.VITE_OFFLINE_NATIVE !== 'true' && !process.env.VITE_API_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL must be set to an absolute backend URL for native builds '
    + "(a relative '/api' resolves to the device, not the server).",
  );
}

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler') || id.includes('use-sync-external-store')) return 'react-vendor';
            if (id.includes('@tanstack')) return 'query-vendor';
            if (id.includes('framer-motion')) return 'motion-vendor';
            if (id.includes('leaflet')) return 'map-vendor';
            return 'vendor';
          }

          if (id.includes('/src/features/world/')) return 'world-route';
          if (id.includes('/src/features/quests/')) return 'quests-route';
          if (id.includes('/src/features/gallery/')) return 'gallery-route';
          if (id.includes('/src/features/guild/')) return 'guild-route';
          if (id.includes('/src/features/profile/')) return 'profile-route';
          if (id.includes('/src/features/rewards/')) return 'rewards-route';
          if (id.includes('/src/features/auth/') || id.includes('/src/features/onboarding/')) return 'auth-route';

          return 'app-shell';
        },
      },
    },
  },
  server: {
    // Defaults to all interfaces so a phone on the same network can reach the
    // dev server; VITE_DEV_HOST narrows it (e.g. to 127.0.0.1).
    host: process.env.VITE_DEV_HOST || '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      deny: ['android', 'api', 'server'],
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
});
