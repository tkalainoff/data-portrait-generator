import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set VITE_BASE_PATH env var to your GitHub repo name when deploying, e.g.:
//   VITE_BASE_PATH=/data-portrait-generator npm run deploy
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
});
