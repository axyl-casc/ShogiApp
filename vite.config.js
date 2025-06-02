import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  base: '/ShogiApp/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    mimeTypes: {
      'application/wasm': ['wasm']
    }
  }
});
