import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3001';

// A Capacitor build loads from capacitor://localhost, where the default
// relative '/api' base resolves to the device instead of the backend. Fail the
// build rather than shipping a native client that cannot reach the API.
if (process.env.VITE_NATIVE_BUILD === 'true' && !process.env.VITE_API_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL must be set to an absolute backend URL for native builds '
    + "(a relative '/api' resolves to the device, not the server).",
  );
}

export default defineConfig({
  base: './',
  plugins: [react()],
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

