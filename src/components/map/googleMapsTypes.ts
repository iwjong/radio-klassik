/** Minimal Maps JS API shapes used by the map layer (avoid pulling full @types/google.maps). */

export interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GoogleMapOptions {
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

export interface GoogleMapInstance {
  getZoom: () => number | undefined;
  panTo: (latLng: GoogleLatLngLiteral) => void;
  setOptions: (options: Partial<GoogleMapOptions>) => void;
  setZoom: (zoom: number) => void;
}

export interface GoogleMapsApi {
  maps: {
    event: {
      clearInstanceListeners: (instance: object) => void;
    };
    Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance;
    OverlayView: new () => object;
  };
}
