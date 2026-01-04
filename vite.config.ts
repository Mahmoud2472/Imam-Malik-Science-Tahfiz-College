import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: 'base: "./"' is required for Tiiny Host and other static hosting providers.
  // It ensures assets are linked relatively (e.g. "assets/index.js") instead of absolutely (e.g. "/assets/index.js").
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});