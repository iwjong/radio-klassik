import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** Base path for assets (trailing slash). Use `/repo-name/` for GitHub Pages project sites. */
function normalizeBase(raw: string | undefined): string {
  if (raw === undefined || raw === '' || raw === '/') {
    return '/'
  }
  let base = raw.startsWith('/') ? raw : `/${raw}`
  if (!base.endsWith('/')) {
    base = `${base}/`
  }
  return base
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: normalizeBase(process.env.VITE_BASE_URL),
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        quoteGenerator: resolve(__dirname, 'quote-generator.html'),
      },
    },
  },
})
