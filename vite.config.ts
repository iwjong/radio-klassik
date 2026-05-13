import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
})
