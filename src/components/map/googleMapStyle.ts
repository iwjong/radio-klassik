const rawMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined;

/** Standard Web Mercator tile edge length in CSS pixels at zoom 0 for one tile. */
const TILE_SIZE_PX = 256;
/** Slightly over the viewport so we do not sit exactly on the repeat threshold. */
const WORLD_WIDTH_MARGIN = 1.12;

export const googleMapsConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined,
  /**
   * Not passed to `Map` while using classic `google.maps.Marker` default pins —
   * a Cloud `mapId` forces WebGL vector basemap where optimized legacy markers often disappear.
   * For custom vector styles + pins, migrate to `AdvancedMarkerElement` and pass `mapId` again.
   */
  mapId: rawMapId?.trim() ? rawMapId.trim() : undefined,
  defaultCenter: { lat: 38, lng: 12 },
  /** Google zoom: larger = closer. Initial camera when the map loads. */
  defaultZoom: 4,
  /**
   * Soft floor: `map.minZoom` is never set below this, but it may be raised on wide
   * screens so the world does not tile horizontally into tiny repeated maps.
   */
  minZoomFloor: 2,
  /** Highest zoom allowed (closest in). Street detail is typically ~18–22. */
  maxZoom: 20,
};

/**
 * Smallest integer zoom at which one world circumference (~`256 * 2^z` CSS px) is at least
 * as wide as the map container, so the default roadmap does not show multiple world strips.
 */
export function minZoomToAvoidHorizontalWorldRepeat(widthCssPx: number): number {
  const w = Math.max(1, widthCssPx);
  const needPx = w * WORLD_WIDTH_MARGIN;
  let z = 1;
  while (z < 24 && TILE_SIZE_PX * 2 ** z < needPx) {
    z += 1;
  }
  return z;
}

export function getGoogleMapsScriptUrl(apiKey: string): string {
  const params = new URLSearchParams({
    key: apiKey,
    callback: "initRadioKlassikMaps",
    v: "weekly",
  });
  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
}

export function getMapAtmosphereClass({
  playbackStatus,
}: {
  playbackStatus: string;
}): string {
  if (playbackStatus === "playing") return "google-map-playing";
  return "google-map-idle";
}
