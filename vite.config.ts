import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // a cena (three + R3F) carrega em um chunk próprio durante o loader
    chunkSizeWarningLimit: 1000,
  },
})
