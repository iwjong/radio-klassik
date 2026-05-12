# Radio Klassik

## Overview

As someone who loves classical music and lives abroad, I first made this project to listen to **radio from the Republic of Korea** while overseas. It has since grown into a way to **explore and stream classical radio stations worldwide**. The map-first interaction is inspired by [Radio Garden](https://radio.garden/)—tune the world by place—while the catalogue stays focused on classical music.

This repository is a **Vite + React** app at the root (`npm install`, `npm run dev`). Stations and metadata come from [Radio Browser](https://www.radio-browser.info/); you choose a broadcaster from its **Google Maps** marker and play the stream.

## Google Maps

The map is built with the **[Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)** (weekly channel). Implementation lives in `src/components/map/GoogleMapBackground.tsx` and `src/components/map/googleMapStyle.ts`.

**Loading.** The browser loads `https://maps.googleapis.com/maps/api/js` with your API key and a global callback (`initRadioKlassikMaps`). The loader deduplicates the script and handles timeouts; see `loadGoogleMapsApi()` in `GoogleMapBackground.tsx`.

**Credentials.** Set `VITE_GOOGLE_MAPS_API_KEY` in `.env.local` (see [Get API key](https://developers.google.com/maps/documentation/javascript/get-api-key)). In Google Cloud: enable **Maps JavaScript API**, attach a **billing account**, and (if you use HTTP referrer restrictions on the key) add referrer patterns for every origin where this app is served.

**Map behaviour.** The map uses the default **roadmap** basemap with the standard control strip (zoom, map type, scale, fullscreen, Street View). Scroll wheel and keyboard shortcuts are enabled. Station locations use the classic **`google.maps.Marker`** default pin, with `optimized: false` so pins stay visible on the default raster-style map. The app does **not** pass a Cloud `mapId` into `Map` while using these legacy markers (a vector `mapId` can hide or break default pins; optional `VITE_GOOGLE_MAPS_MAP_ID` in config is reserved for a future **Advanced Marker** setup).

**Zoom limits.** `googleMapsConfig` defines `minZoomFloor`, `maxZoom`, and `defaultZoom`. On resize, a **minimum zoom** is recomputed from the map container width so the world does not tile horizontally into repeated strips at very low zoom; see `minZoomToAvoidHorizontalWorldRepeat()` in `googleMapStyle.ts`.

**Without a key.** If `VITE_GOOGLE_MAPS_API_KEY` is missing, the map script is not loaded and a simple gradient placeholder is shown; the player and library UI still work.

## Features

- **Google Map** — roadmap, pan/zoom, default red markers per station, click to select.
- **Classical-only catalogue** — [Radio Browser](https://www.radio-browser.info/) with strict scoring and exclusions for non-classical noise.
- **Player** — play/pause, previous/next, volume, Focus Mode, now-playing metadata handling.
- **Curated stations** — verified labels, editorial copy, preferred coordinates where applicable.
- **Favorites and recent** — persisted in `localStorage` (Zustand persist key `radio-klassik-v1`).
- **Search** — station name, country, code, tag; open with `/` or `S`.
- **Library** — favorites, recently played, top voted, grouped by country.
- **Keyboard** — `Space` play/pause, `←` / `→` station, `↑` / `↓` volume, `F` favorite, `/` or `S` search, `L` library, `Escape` closes panels.
- **Geocoding** — stations missing coordinates are placed on a country centroid with deterministic jitter to reduce overlap.

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Build | Vite 8, TypeScript |
| UI | React 19, Tailwind CSS 3 |
| Map | Google Maps JavaScript API |
| State | Zustand (with persistence) |
| Data | Radio Browser public API |

## Getting started

```bash
npm install
npm run dev
```

After `npm run dev`, use the URL printed in the terminal (Vite chooses the port).

Create `.env.local` in the repo root:

```bash
VITE_GOOGLE_MAPS_API_KEY=your-key-here
```

Optional: `VITE_GOOGLE_MAPS_MAP_ID` — only relevant if you later move to vector styling and **AdvancedMarkerElement**; default pins are tuned for **no** `mapId` on the `Map` constructor.

### Scripts

- `npm run dev` — dev server with HMR
- `npm run build` — typecheck and production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — ESLint
- `npm run test` — Vitest unit tests

## How stations are picked

`src/lib/radioBrowser.ts` talks to Radio Browser mirrors with fallback, then scores candidates:

1. Drops obvious non-classical tags and names (e.g. classic rock, talk, schlager).
2. Rewards classical signals (`classical`, `klassik`, `opera`, composer/orchestra cues, etc.).
3. Prefers healthy checks, votes, and HTTPS where possible.

Uncertain rows are dropped.

## Notes

- Streams come from each broadcaster; some may be offline or geo-blocked (the player surfaces a clear error).
- Default stream list favors HTTPS; legacy HTTP can be toggled in-app but may fail on strict HTTPS sites.
- Respect [Radio Browser](https://www.radio-browser.info/) and each station’s terms.

## License

MIT. Radio Browser data remains under its contributors’ terms; honor each broadcaster’s conditions.
