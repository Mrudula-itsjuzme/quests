import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3001';
const devHost = process.env.VITE_DEV_HOST || '127.0.0.1';

export default defineConfig({
  plugins: [react()],
  server: {
    host: devHost,
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
