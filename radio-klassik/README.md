# Radio Klassik

A calm spatial listening experience devoted **only to classical music**.
Choose a point on the world map and tune into a curated classical
broadcaster anywhere on Earth — Mozart at dawn in Vienna, late-night chamber
music in Tokyo, baroque from a small relay in Bogotá.

![Radio Klassik](public/favicon.svg)

## Features

- 🗺️ **World map** powered by the Google Maps JavaScript API (default roadmap,
  zoom controls, and classic map markers for stations).
- 🎻 **Classical-only** — stations are pulled from
  [Radio Browser](https://www.radio-browser.info/) and filtered by
  strict classical scoring with strong negative exclusions for unrelated genres.
- 🔊 **Editorial player** with refined now-playing metadata, Focus Mode,
  play / pause, prev / next, volume and calm loading / error states.
- 🧭 **Verified station identity** for curated labels, editorial descriptions,
  preferred coordinates and metadata cleanup.
- ⭐ **Favorites & Recent** — persisted in `localStorage`.
- 🔎 **Spotlight-style search** by station name, country, country code or tag
  (`/` or `S` to open).
- 📚 **Library panel** with Favorites · Recently played · Top voted · By
  country views.
- ⌨️ **Keyboard shortcuts**: `Space` play/pause · `← / →` next/prev ·
  `↑ / ↓` volume · `F` favorite · `/` or `S` search · `L` library.
- 📍 **Smart fallback geocoding** — stations without GPS coordinates are
  placed at their country centroid with deterministic jitter so they
  don't stack.

## Tech stack

| Layer    | Library |
| -------- | ------- |
| Build    | Vite 8 + TypeScript |
| UI       | React 19, TailwindCSS 3 |
| Map      | Google Maps JavaScript API |
| State    | Zustand (with persistence) |
| Data     | [Radio Browser](https://www.radio-browser.info/) public API |

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

To enable the map locally, add a Google Maps key to `.env.local`:

```bash
VITE_GOOGLE_MAPS_API_KEY=your-key
```

An optional `VITE_GOOGLE_MAPS_MAP_ID` can be supplied for a cloud-styled vector map
(legacy default markers work best without a custom `mapId`).
Without a key the app keeps a quiet fallback background so the listening UI
remains usable.

### Scripts

- `npm run dev` — local dev server with HMR
- `npm run build` — TypeScript check + production bundle to `dist/`
- `npm run preview` — serve the built bundle locally
- `npm run lint` — ESLint
- `npm run test` — lightweight unit tests

## How stations are picked

`src/lib/radioBrowser.ts` queries Radio Browser mirrors with deterministic
fallback and merges the results. A strict station scoring pass:

1. Excludes obvious contamination (`jazz`, `classic rock`, `oldies`,
   `schlager`, `talk`, `news`, `pop`, `country`, …)
2. Scores positive classical signals (`classical`, `klassik`, `opera`,
   `baroque`, `chamber`, composer names, orchestra language, …)
3. Prefers verified, high-vote, HTTPS streams with stable metadata

If a station is uncertain, it is excluded.

## Notes & caveats

- Streams are served directly by each broadcaster. A few stations may
  be temporarily offline or geo-blocked — the player will display
  *Stream unavailable* if that happens; pick another dot.
- HTTPS streams are shown by default. Legacy HTTP streams can be enabled
  explicitly, but may be blocked by secure deployments.
- Google Maps is loaded on demand. Without an API key, the map area shows a
  simple gradient fallback while the rest of the app stays usable.

## License

MIT. Radio Browser data is © its contributors under their own license;
please respect each broadcaster's terms of use.
