import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    entries: ['index.html'],
  },
  resolve: {
    alias: {
      components: fileURLToPath(new URL('./src/components', import.meta.url)),
      examples: fileURLToPath(new URL('./src/examples', import.meta.url)),
      assets: fileURLToPath(new URL('./src/assets', import.meta.url)),
      context: fileURLToPath(new URL('./src/context', import.meta.url)),
      layouts: fileURLToPath(new URL('./src/layouts', import.meta.url)),
      routes: fileURLToPath(new URL('./src/routes.jsx', import.meta.url)),
    },
  },
})
