import { useEffect, useMemo, useRef, useState } from "react";
import type { Station } from "../../lib/types";
import { useStore } from "../../store/useStore";
import type {
  GoogleLatLngLiteral,
  GoogleMapInstance,
  GoogleMapOptions,
  GoogleMapsApi,
} from "./googleMapsTypes";
import {
  getGoogleMapsScriptUrl,
  getMapAtmosphereClass,
  googleMapsConfig,
  minZoomToAvoidHorizontalWorldRepeat,
} from "./googleMapStyle";
import {
  createStationMapMarker,
  type StationMapMarkerHandle,
} from "./stationMapMarker";

interface GoogleMapBackgroundProps {
  stations: Station[];
  currentId: string | null;
  playbackStatus: string;
  focusMode: boolean;
  onSelectStation: (stationId: string) => void;
}

declare global {
  interface Window {
    __radioKlassikGoogleMapsPromise?: Promise<GoogleMapsApi>;
    google?: GoogleMapsApi;
    initRadioKlassikMaps?: () => void;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "radio-klassik-google-maps-script";

const Z_MARKER_ACTIVE = 2_000_000;
const Z_MARKER_HOVER = 500_000;
const Z_MARKER_BASE = 10;

type LoadState = "loading" | "ready" | "missing-key" | "error";

export function GoogleMapBackground({
  stations,
  currentId,
  playbackStatus,
  focusMode,
  onSelectStation,
}: GoogleMapBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markersRef = useRef<Map<string, StationMapMarkerHandle>>(new Map());
  const [loadState, setLoadState] = useState<LoadState>(() =>
    googleMapsConfig.apiKey ? "loading" : "missing-key",
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const mapLiveStationId = useStore((s) => s.mapLiveLabel.stationId);
  const mapLiveLine = useStore((s) => s.mapLiveLabel.line);
  const mapLiveComposer = useStore((s) => s.mapLiveLabel.composerLine);
  const mapLiveTitle = useStore((s) => s.mapLiveLabel.titleLine);

  const markerStations = useMemo(
    () => stations.filter(hasUsableCoordinates),
    [stations],
  );
  const atmosphereClass = getMapAtmosphereClass({
    playbackStatus,
  });

  useEffect(() => {
    if (!googleMapsConfig.apiKey) return;

    let cancelled = false;
    loadGoogleMapsApi()
      .then(() => {
        if (!cancelled) setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loadState !== "ready" || mapRef.current || !containerRef.current) {
      return;
    }

    const google = window.google;
    if (!google?.maps) return;

    const el = containerRef.current;
    const map = new google.maps.Map(el, getGoogleMapOptions());
    mapRef.current = map;

    function syncViewportMinZoom() {
      const width = el.getBoundingClientRect().width;
      const computed = minZoomToAvoidHorizontalWorldRepeat(width);
      const minZ = Math.max(googleMapsConfig.minZoomFloor, computed);
      map.setOptions({
        minZoom: minZ,
        maxZoom: googleMapsConfig.maxZoom,
      });
      const current = map.getZoom();
      if (current !== undefined && current < minZ) {
        map.setZoom(minZ);
      }
    }

    syncViewportMinZoom();
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            syncViewportMinZoom();
          })
        : null;
    resizeObserver?.observe(el);

    return () => {
      resizeObserver?.disconnect();
      /* eslint-disable react-hooks/exhaustive-deps -- read latest marker handles at map teardown */
      const markersSnapshot = markersRef.current;
      /* eslint-enable react-hooks/exhaustive-deps */
      for (const handle of markersSnapshot.values()) {
        handle.destroy();
      }
      markersSnapshot.clear();
      if (mapRef.current) {
        google.maps.event.clearInstanceListeners(mapRef.current);
      }
      mapRef.current = null;
      el.replaceChildren();
    };
  }, [loadState]);

  useEffect(() => {
    const google = window.google;
    const map = mapRef.current;
    if (!google?.maps || !map) return;

    const activeIds = new Set(markerStations.map((station) => station.id));

    for (const [stationId, handle] of markersRef.current) {
      if (!activeIds.has(stationId)) {
        handle.destroy();
        markersRef.current.delete(stationId);
      }
    }

    for (const station of markerStations) {
      const position: GoogleLatLngLiteral = { lat: station.lat, lng: station.lng };
      const handle = markersRef.current.get(station.id);
      const isActive = station.id === currentId;
      const isHovered = station.id === hoveredId;
      const richComposer = mapLiveComposer?.trim();
      const richTitle = mapLiveTitle?.trim();
      const useRichLive =
        isActive &&
        mapLiveStationId === station.id &&
        Boolean(richComposer && richTitle);
      const useSingleLive =
        isActive &&
        mapLiveStationId === station.id &&
        mapLiveLine.trim().length > 0 &&
        !useRichLive;
      const useLiveLine = useRichLive || useSingleLive;
      const wrapText = isActive;
      const displayText = useLiveLine
        ? useRichLive
          ? richComposer!.trim()
          : mapLiveLine.trim()
        : truncateMarkerDisplay(station.name, MARKER_TEXT_MAX_DEFAULT);
      const secondLine =
        useRichLive && richTitle ? richTitle.trim() : null;
      const zIndex = isActive
        ? Z_MARKER_ACTIVE
        : isHovered
          ? Z_MARKER_HOVER
          : Z_MARKER_BASE;

      if (handle) {
        handle.setPosition(position);
        handle.setVisual({
          displayText,
          secondLine,
          wrapText,
          active: isActive,
          zIndex,
          stationName: station.name,
        });
        continue;
      }

      const next = createStationMapMarker(
        google,
        map,
        position,
        {
          displayText,
          secondLine,
          wrapText,
          active: isActive,
          zIndex,
          stationName: station.name,
        },
        {
          onClick: () => onSelectStation(station.id),
          onMouseEnter: () => setHoveredId(station.id),
          onMouseLeave: () => setHoveredId(null),
        },
      );
      markersRef.current.set(station.id, next);
    }
  }, [
    currentId,
    hoveredId,
    mapLiveComposer,
    mapLiveLine,
    mapLiveStationId,
    mapLiveTitle,
    markerStations,
    onSelectStation,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !currentId) return;

    const currentStation = markerStations.find(
      (station) => station.id === currentId,
    );
    if (!currentStation) return;

    map.panTo({ lat: currentStation.lat, lng: currentStation.lng });
    const targetZoom = focusMode ? 11 : 10;
    if ((map.getZoom() ?? googleMapsConfig.defaultZoom) < targetZoom) {
      map.setZoom(targetZoom);
    }
  }, [currentId, focusMode, markerStations]);

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden ${atmosphereClass}`}
    >
      {loadState !== "ready" && (
        <QuietMapFallback loadState={loadState} />
      )}
      <div ref={containerRef} className="google-map-canvas" />
    </div>
  );
}

function loadGoogleMapsApi(): Promise<GoogleMapsApi> {
  if (window.google?.maps) return Promise.resolve(window.google);
  const apiKey = googleMapsConfig.apiKey;
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is not configured."));
  }
  if (window.__radioKlassikGoogleMapsPromise) {
    return window.__radioKlassikGoogleMapsPromise;
  }

  window.__radioKlassikGoogleMapsPromise = new Promise((resolve, reject) => {
    let pollId: number | undefined;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      if (pollId !== undefined) window.clearInterval(pollId);
    };

    const fail = (error: Error) => {
      cleanup();
      document.getElementById(GOOGLE_MAPS_SCRIPT_ID)?.remove();
      window.__radioKlassikGoogleMapsPromise = undefined;
      reject(error);
    };

    const succeed = (google: GoogleMapsApi) => {
      cleanup();
      resolve(google);
    };

    const timeoutId = window.setTimeout(() => {
      fail(new Error("Google Maps timed out while loading."));
    }, 10000);

    window.initRadioKlassikMaps = () => {
      if (window.google?.maps) {
        succeed(window.google);
      } else {
        fail(new Error("Google Maps loaded without the expected API."));
      }
    };

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    if (existingScript) {
      if (window.google?.maps) {
        succeed(window.google);
        return;
      }
      pollId = window.setInterval(() => {
        if (window.google?.maps) {
          succeed(window.google);
        }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = getGoogleMapsScriptUrl(apiKey);
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      script.remove();
      fail(new Error("Google Maps failed to load."));
    };
    document.head.appendChild(script);
  });

  return window.__radioKlassikGoogleMapsPromise;
}

function getGoogleMapOptions(): GoogleMapOptions {
  return {
    center: googleMapsConfig.defaultCenter,
    clickableIcons: true,
    /** Hides Google’s default control stack (zoom, Street View, fullscreen, scale, etc.). */
    disableDefaultUI: true,
    gestureHandling: "auto",
    isFractionalZoomEnabled: true,
    /** Off so ← / → control stations (Player) instead of panning the map. */
    keyboardShortcuts: false,
    mapTypeControl: false,
    /** Satellite imagery with Google’s roads and place-name labels (no custom tile overlay). */
    mapTypeId: "hybrid",
    maxZoom: googleMapsConfig.maxZoom,
    minZoom: googleMapsConfig.minZoomFloor,
    scrollwheel: true,
    zoom: googleMapsConfig.defaultZoom,
  };
}

function hasUsableCoordinates(station: Station): boolean {
  return (
    Number.isFinite(station.lat) &&
    Number.isFinite(station.lng) &&
    Math.abs(station.lat) <= 90 &&
    Math.abs(station.lng) <= 180
  );
}

const MARKER_TEXT_MAX_DEFAULT = 22;

function truncateMarkerDisplay(text: string, maxChars: number): string {
  const t = text.trim();
  const chars = [...t];
  if (chars.length <= maxChars) return t;
  return `${chars.slice(0, maxChars - 1).join("")}…`;
}

function QuietMapFallback({ loadState }: { loadState: LoadState }) {
  const hint =
    loadState === "missing-key"
      ? "Add VITE_GOOGLE_MAPS_API_KEY to .env.local and restart the dev server."
      : loadState === "error"
        ? "Google Maps did not load. Enable Maps JavaScript API, link billing, and add this site’s origin to the API key HTTP referrer allowlist."
        : null;

  return (
    <div className="google-map-fallback">
      {hint && (
        <p className="google-map-fallback-hint">{hint}</p>
      )}
    </div>
  );
}
