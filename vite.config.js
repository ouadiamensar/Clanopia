import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // دمج حزمة فايربيس بشكل صريح لضمان عدم تشتت الدوال
          if (id.includes('firebase')) {
            return 'firebase';
          }
        }
      }
    }
  }
})