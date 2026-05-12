import { useEffect, useMemo, useRef, useState } from "react";
import type { Station } from "../../lib/types";
import {
  getGoogleMapsScriptUrl,
  getMapAtmosphereClass,
  googleMapsConfig,
  minZoomToAvoidHorizontalWorldRepeat,
} from "./googleMapStyle";

interface GoogleMapBackgroundProps {
  stations: Station[];
  currentId: string | null;
  playbackStatus: string;
  focusMode: boolean;
  onSelectStation: (stationId: string) => void;
}

interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

interface GoogleMapOptions {
  center: GoogleLatLngLiteral;
  clickableIcons?: boolean;
  disableDefaultUI?: boolean;
  fullscreenControl?: boolean;
  gestureHandling?: "cooperative" | "greedy" | "none" | "auto";
  isFractionalZoomEnabled?: boolean;
  keyboardShortcuts?: boolean;
  mapTypeControl?: boolean;
  mapTypeId?: string;
  maxZoom?: number;
  minZoom?: number;
  scaleControl?: boolean;
  scrollwheel?: boolean;
  streetViewControl?: boolean;
  zoom?: number;
  zoomControl?: boolean;
}

interface GoogleMarkerOptions {
  clickable?: boolean;
  map: GoogleMapInstance;
  /** `true` can hide default pins on WebGL / vector basemaps — keep off for classic red markers. */
  optimized?: boolean;
  position: GoogleLatLngLiteral;
  title: string;
  zIndex?: number;
}

interface GoogleMapInstance {
  getZoom: () => number | undefined;
  panTo: (latLng: GoogleLatLngLiteral) => void;
  setOptions: (options: Partial<GoogleMapOptions>) => void;
  setZoom: (zoom: number) => void;
}

interface GoogleMarkerInstance {
  addListener: (eventName: string, handler: () => void) => void;
  setMap: (map: GoogleMapInstance | null) => void;
  setPosition: (position: GoogleLatLngLiteral) => void;
  setTitle: (title: string) => void;
  setZIndex: (zIndex: number) => void;
}

interface GoogleMapsApi {
  maps: {
    event: {
      clearInstanceListeners: (instance: object) => void;
    };
    Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance;
    Marker: (new (options: GoogleMarkerOptions) => GoogleMarkerInstance) & {
      MAX_ZINDEX: number;
    };
  };
}

declare global {
  interface Window {
    __radioKlassikGoogleMapsPromise?: Promise<GoogleMapsApi>;
    google?: GoogleMapsApi;
    initRadioKlassikMaps?: () => void;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "radio-klassik-google-maps-script";

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
  const markersRef = useRef<Map<string, GoogleMarkerInstance>>(new Map());
  const [loadState, setLoadState] = useState<LoadState>(() =>
    googleMapsConfig.apiKey ? "loading" : "missing-key",
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const markerStations = useMemo(
    () => stations.filter(hasUsableCoordinates),
    [stations],
  );
  const atmosphereClass = getMapAtmosphereClass({
    playbackStatus,
    focusMode,
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
      const markers = markersRef.current; // eslint-disable-line react-hooks/exhaustive-deps -- read latest markers at map teardown
      for (const marker of markers.values()) {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      }
      markers.clear();
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

    for (const [stationId, marker] of markersRef.current) {
      if (!activeIds.has(stationId)) {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
        markersRef.current.delete(stationId);
      }
    }

    for (const station of markerStations) {
      const position = { lat: station.lat, lng: station.lng };
      const marker = markersRef.current.get(station.id);
      const isActive = station.id === currentId;
      const isHovered = station.id === hoveredId;

      if (marker) {
        marker.setPosition(position);
        marker.setTitle(station.name);
        marker.setZIndex(
          isActive ? google.maps.Marker.MAX_ZINDEX + 1 : isHovered ? 100 : 1,
        );
        continue;
      }

      const nextMarker = new google.maps.Marker({
        clickable: true,
        map,
        optimized: false,
        position,
        title: station.name,
        zIndex: isActive ? google.maps.Marker.MAX_ZINDEX + 1 : 1,
      });

      nextMarker.addListener("click", () => onSelectStation(station.id));
      nextMarker.addListener("mouseover", () => setHoveredId(station.id));
      nextMarker.addListener("mouseout", () => setHoveredId(null));
      markersRef.current.set(station.id, nextMarker);
    }
  }, [currentId, hoveredId, markerStations, onSelectStation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !currentId) return;

    const currentStation = markerStations.find(
      (station) => station.id === currentId,
    );
    if (!currentStation) return;

    map.panTo({ lat: currentStation.lat, lng: currentStation.lng });
    const targetZoom = focusMode ? 12 : 10;
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
    disableDefaultUI: false,
    fullscreenControl: true,
    gestureHandling: "auto",
    isFractionalZoomEnabled: true,
    keyboardShortcuts: true,
    mapTypeControl: true,
    mapTypeId: "roadmap",
    maxZoom: googleMapsConfig.maxZoom,
    minZoom: googleMapsConfig.minZoomFloor,
    scaleControl: true,
    scrollwheel: true,
    streetViewControl: true,
    zoom: googleMapsConfig.defaultZoom,
    zoomControl: true,
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

function QuietMapFallback({ loadState }: { loadState: LoadState }) {
  const hint =
    loadState === "missing-key"
      ? "Add VITE_GOOGLE_MAPS_API_KEY to .env.local and restart the dev server."
      : loadState === "error"
        ? "Google Maps did not load. Enable Maps JavaScript API, link billing, and allow http://localhost:5173/* as an HTTP referrer on the API key."
        : null;

  return (
    <div className="google-map-fallback">
      {hint && (
        <p className="google-map-fallback-hint">{hint}</p>
      )}
    </div>
  );
}
