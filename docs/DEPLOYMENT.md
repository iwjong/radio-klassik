# Radio Klassik — Deployment and operations

This guide covers deploying the static **Vite + React** app from a Git repository to **GitHub Pages, Netlify, Vercel, Cloudflare Pages**, using a custom domain, and securing the **Google Maps API key**.

---

## 1. What you are shipping

| Item | Detail |
|------|--------|
| Output | `npm run build` produces static assets in `dist/` (HTML, CSS, JS) |
| Server | Not required beyond static file hosting |
| API keys | **Radio Browser**: public API, no project key |
| API keys | **Google Maps**: key is embedded in the browser bundle → **restrictions are the main security control** |

---

## 2. Do not commit to Git

- **`.env.local`** — local only. Keep it out of the repository.  
  (The repo `.gitignore` uses `*.local`, which excludes `.env.local`.)
- **`dist/`** — build output; regenerate in CI or on the host. It is already ignored.
- **Hard-coded Google API keys** — inject keys only via environment variables at build time.

Set **`VITE_GOOGLE_MAPS_API_KEY`** in your hosting provider’s **build** environment. Vite inlines `VITE_*` variables into the client bundle. That is expected for an SPA; mitigate abuse with **Google Cloud restrictions** below.

---

## 3. Build commands (local and CI)

```bash
npm ci          # or npm install
npm run build   # typecheck + write dist/
```

Preview the production build locally:

```bash
npm run preview
```

---

## 4. Google Maps API key — required security model

You cannot fully hide a browser Maps JavaScript API key. Google’s model is to **limit where it can be used and which APIs it can call**.

### 4.1 Do this for every key

1. **[Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your browser key**
2. **Application restrictions**  
   - Type: **HTTP referrers (web sites)**  
   - Add every **origin** where the app is served, for example:
     - GitHub Pages: `https://<username>.github.io/*`
     - Project Pages: `https://<username>.github.io/<repo-name>/*`
     - Netlify / Vercel / Cloudflare: `https://*.netlify.app/*`, `https://*.vercel.app/*`, `https://*.pages.dev/*` (tighten to your exact host when stable)
     - **Custom domain**: `https://www.example.com/*`, `https://example.com/*`
     - Local dev: `http://localhost:5173/*` (adjust port to match your dev server)
3. **API restrictions**  
   - Restrict this key to **Maps JavaScript API** only (use separate keys for other products).
4. **Billing and alerts**  
   - Enable **budget alerts** and sensible quotas so misconfiguration does not cause runaway cost.

### 4.2 What you gain

- Even if the key string appears in `dist/` or a repo, **other sites** should not be able to use it for Maps requests if referrers are enforced.
- **API restrictions** prevent using the same key for unrelated Google APIs.

### 4.3 Caveats

- If you change the public URL (for example after adding a custom domain), **add the new HTTPS origin** to the key’s referrer list or the map will fail to load.
- Do **not** leave a production key as **“None”** application restriction while the repo or build is public.

---

## 5. Environment variables by host (summary)

Set at **build time** in the host UI or workflow:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

Optional **`VITE_GOOGLE_MAPS_MAP_ID`** is reserved for a future vector / Advanced Marker setup; the default UI does not require it.

| Platform | Notes |
|----------|--------|
| **GitHub Actions + Pages** | Inject the key via `secrets` (or `env`) in the workflow, run `npm run build`, upload `dist/` as the Pages artifact |
| **Netlify** | Site settings → Environment variables → **Build** context; build command `npm run build`; publish directory `dist` |
| **Vercel** | Project → Settings → Environment Variables → Production/Preview; output `dist` |
| **Cloudflare Pages** | Settings → Environment variables for builds; build command `npm run build`; output directory `dist` |

### GitHub Pages (this repo)

Project Pages URL shape: `https://<username>.github.io/<repository>/` — for example [https://iwjong.github.io/radio-klassik/](https://iwjong.github.io/radio-klassik/).

1. **Pages source:** **Settings → Pages → Build and deployment**. Set **Source** to **GitHub Actions** (static upload from CI, not Jekyll branch builds).
2. **Repository secret:** **Settings → Secrets and variables → Actions → New repository secret**  
   - Name: `VITE_GOOGLE_MAPS_API_KEY`  
   - Value: your Maps JavaScript API browser key.
3. **Workflow:** [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) runs on push to `main` or `master`. It sets `VITE_BASE_URL` to `/<repository-name>/` so Vite emits correct asset URLs under the project path.
4. **Google key HTTP referrers:** include  
   `https://<username>.github.io/<repository>/*`  
   (example: `https://iwjong.github.io/radio-klassik/*`).
5. After the first successful run, confirm the site URL under **Settings → Pages**.

**Optional — mimic Pages locally after build:**

```bash
VITE_BASE_URL=/radio-klassik/ npm run build
npm run preview
# Then open http://localhost:4173/radio-klassik/ (include the repo path; root `/` will 404 assets)
```

If you push a prebuilt `dist/` to a `gh-pages` branch **without** CI, you can inject the key locally via `.env.production` or `export` before `npm run build`. Prefer **CI secrets** so the key does not sit in shell history or ad-hoc scripts.

---

## 6. Custom domains

1. Configure DNS per your host’s documentation.
2. Add the **final HTTPS site URL** to the Google key **HTTP referrer** list.
3. If the map breaks after a URL change, **missing referrers** are the first thing to check.

---

## 7. Streams and metadata (reference)

- Stream URLs follow each broadcaster and CDN; some streams may be **geo-blocked** or offline.
- **Now playing** depends on per-station `metadataUrl` or built-in sources (for example some SRG streams); not every station exposes track data.

---

## 8. Pre-deploy checklist

- [ ] Confirm `.env.local` is not tracked by Git
- [ ] Set `VITE_GOOGLE_MAPS_API_KEY` in the host’s **build** environment
- [ ] In Google Cloud: **HTTP referrer** restriction + **Maps JavaScript API** only for that key
- [ ] Confirm production and preview URLs are covered by referrers
- [ ] `npm run build` passes locally or in CI
- [ ] For GitHub **project** Pages (`/repo/` path): CI sets `VITE_BASE_URL`; or set `VITE_BASE_URL=/your-repo/` manually when building
- [ ] Smoke-test map, playback, and search on the production URL

---

## 9. License and data

- Project license: see **README** → License.
- Honor [Radio Browser](https://www.radio-browser.info/) terms and each broadcaster’s conditions.

Keep this file in the repository and revisit **sections 4 and 6** whenever hosting or domains change.
