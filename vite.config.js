import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
    tailwindcss()
  ],
  base: '/',
  resolve: {
    alias: {
      'simple-peer': 'simple-peer/simplepeer.min.js'
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled', '@emotion/cache', 'simple-peer'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'emotion': ['@emotion/react', '@emotion/styled'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})