# Radio Klassik

Classical radio on a **map-first** UI (inspired by [Radio Garden](https://radio.garden/)): pick a station from **Google Maps**, stream via [Radio Browser](https://www.radio-browser.info/). Built with **Vite**, **React 19**, **TypeScript**, and **Tailwind CSS**.

## Features

- **Map** — Hybrid satellite + labels, custom dock-style markers, selected marker can show now-playing lines when stream metadata exists. Map keyboard shortcuts are off so **arrow keys** change stations.
- **Player** — Play/pause, prev/next, volume, focus mode; compact typography for station titles and ICY metadata.
- **Panels** — Search, Library, and About open as **centered modals** (no backdrop blur on overlays).
- **Library** — Recently played, top voted, by country (favorites were removed; recents persist in `localStorage` under Zustand key `radio-klassik-v1`).
- **Search** — Name, country, code, tags; **`/`** or **`S`**.
- **Top bar** — Random **music quotes** (pool of 100); quote refreshes when you **change station**. Quote text uses **EB Garamond**; UI body uses **Manrope**; monospace uses **JetBrains Mono**.
- **Quote pool page** — `quote-generator.html` (shuffle, copy quote, copy as TS array); linked from About.
- **Legacy HTTP streams** — Optional in-app toggle (may be blocked on strict HTTPS sites).

## Quick start

```bash
npm install
npm run dev
```

Create **`.env.local`** in the repo root:

```bash
VITE_GOOGLE_MAPS_API_KEY=your-key-here
```

Without a key, the map falls back to a placeholder; the player and library still work.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Dev server (HMR) |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |

## Google Maps (short)

Enable **Maps JavaScript API**, set billing, and restrict the key to your origins if needed. Loader and map options live in `src/components/map/GoogleMapBackground.tsx` and `src/components/map/googleMapStyle.ts`. Optional: `VITE_GOOGLE_MAPS_MAP_ID` for a future vector / Advanced Marker setup.

Full Pages deploy, referrer patterns, and key setup: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** (includes [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) and the `VITE_GOOGLE_MAPS_API_KEY` repo secret).

## Station catalogue

`src/lib/radioBrowser.ts` queries Radio Browser mirrors, scores classical signals, filters obvious non-classical noise, and prefers healthy HTTPS streams where possible.

## Keyboard

`Space` play/pause · `←` `→` station · `↑` `↓` volume · `M` focus · `/` or `S` search · `L` library · `Escape` close panels.

## License

MIT. Radio Browser and each broadcaster’s streams remain under their respective terms.
