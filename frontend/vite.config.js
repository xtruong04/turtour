import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

// Static pages under public/dewi can't read import.meta.env (Vite doesn't
// process the public dir), so we generate a plain JS file from .env that
// they load as a regular <script> instead of hardcoding the API URL.
function dewiEnvConfig() {
  return {
    name: 'dewi-env-config',
    config(_config, { mode }) {
      const env = loadEnv(mode, process.cwd(), 'VITE_')
      const outFile = path.resolve(process.cwd(), 'public/dewi/assets/js/env-config.js')
      const content = `window.TURTOUR_API_BASE = ${JSON.stringify(env.VITE_API_URL || '')};
window.TURTOUR_HUB_URL = ${JSON.stringify(env.VITE_HUB_URL || '')};
`
      fs.mkdirSync(path.dirname(outFile), { recursive: true })
      fs.writeFileSync(outFile, content)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dewiEnvConfig()],
  server: {
    host: true,
  },
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
      utils: fileURLToPath(new URL('./src/utils', import.meta.url)),
    },
  },
})
