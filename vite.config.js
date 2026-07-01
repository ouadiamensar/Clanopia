import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase')) {
            return 'firebase';
          }
        }
      }
    }
  },
  // الأسطر الجديدة لحل مشكلة Emotion/MUI:
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    jsxFactory: 'jsx',
  }
})