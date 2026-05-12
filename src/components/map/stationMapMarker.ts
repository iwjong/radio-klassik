import type { GoogleLatLngLiteral, GoogleMapInstance, GoogleMapsApi } from "./googleMapsTypes";

export interface StationMapMarkerHandle {
  setPosition: (latLng: GoogleLatLngLiteral) => void;
  setVisual: (opts: {
    displayText: string;
    secondLine?: string | null;
    /** When true, label wraps to multiple lines (active marker); inactive stays one-line ellipsis. */
    wrapText: boolean;
    active: boolean;
    zIndex: number;
    stationName: string;
  }) => void;
  destroy: () => void;
}

/**
 * Custom HTML marker (card + tail) on `overlayMouseTarget`, anchored so the tip sits on lat/lng.
 */
export function createStationMapMarker(
  _google: GoogleMapsApi,
  map: GoogleMapInstance,
  latLng: GoogleLatLngLiteral,
  initial: {
    displayText: string;
    secondLine?: string | null;
    wrapText: boolean;
    active: boolean;
    zIndex: number;
    stationName: string;
  },
  handlers: {
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  },
): StationMapMarkerHandle {
  const ctor = _google.maps.OverlayView as unknown as new () => GoogleOverlayMutable;
  const overlay = new ctor();

  let position = latLng;
  let root: HTMLDivElement | null = null;
  let stackEl: HTMLDivElement | null = null;
  let line1El: HTMLSpanElement | null = null;
  let line2El: HTMLSpanElement | null = null;
  let visual = initial;

  const onClick = handlers.onClick;
  const onMouseEnter = handlers.onMouseEnter;
  const onMouseLeave = handlers.onMouseLeave;

  function syncDom() {
    if (!root || !stackEl || !line1El || !line2El) return;
    const { active, zIndex, displayText, secondLine, stationName, wrapText } = visual;
    root.className =
      "rk-map-marker pointer-events-auto" + (active ? " rk-map-marker--active" : "");
    root.style.zIndex = String(zIndex);
    stackEl.classList.toggle("rk-map-marker__text--wrap", wrapText);
    line1El.textContent = displayText;
    const sub = secondLine?.trim();
    if (sub) {
      line2El.textContent = sub;
      line2El.classList.remove("rk-map-marker__line--hidden");
      stackEl.classList.add("rk-map-marker__text--twoline");
    } else {
      line2El.textContent = "";
      line2El.classList.add("rk-map-marker__line--hidden");
      stackEl.classList.remove("rk-map-marker__text--twoline");
    }
    const aria = sub ? `${displayText}. ${sub}` : displayText;
    root.setAttribute("aria-label", aria);
    root.setAttribute("title", stationName === aria ? stationName : `${stationName} — ${aria}`);
  }

  function buildDom(pane: HTMLElement) {
    const el = document.createElement("div");
    el.className = "rk-map-marker pointer-events-auto";
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");

    const inner = document.createElement("div");
    inner.className = "rk-map-marker__inner";

    const card = document.createElement("div");
    card.className = "rk-map-marker__card";

    const stack = document.createElement("div");
    stack.className = "rk-map-marker__text";

    const line1 = document.createElement("span");
    line1.className = "rk-map-marker__line rk-map-marker__line--composer";

    const line2 = document.createElement("span");
    line2.className = "rk-map-marker__line rk-map-marker__line--title rk-map-marker__line--hidden";

    stack.appendChild(line1);
    stack.appendChild(line2);

    const tail = document.createElement("div");
    tail.className = "rk-map-marker__tail";
    tail.setAttribute("aria-hidden", "true");

    card.appendChild(stack);
    inner.appendChild(card);
    inner.appendChild(tail);
    el.appendChild(inner);

    el.addEventListener("click", onClick);
    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", onMouseLeave);

    pane.appendChild(el);
    root = el;
    stackEl = stack;
    line1El = line1;
    line2El = line2;
    syncDom();
  }

  overlay.onAdd = function (this: GoogleOverlayMutable) {
    const panes = this.getPanes?.();
    const pane = panes?.overlayMouseTarget;
    if (!pane) return;
    buildDom(pane);
  };

  overlay.draw = function (this: GoogleOverlayMutable) {
    const projection = this.getProjection?.();
    if (!projection || !root) return;
    const pt = projection.fromLatLngToDivPixel?.(position);
    if (pt == null || pt.x == null || pt.y == null) return;
    root.style.left = `${pt.x}px`;
    root.style.top = `${pt.y}px`;
  };

  overlay.onRemove = function () {
    if (root) {
      root.removeEventListener("click", onClick);
      root.removeEventListener("mouseenter", onMouseEnter);
      root.removeEventListener("mouseleave", onMouseLeave);
      root.remove();
      root = null;
      stackEl = null;
      line1El = null;
      line2El = null;
    }
  };

  overlay.setMap(map);

  return {
    setPosition(latLngNext) {
      position = latLngNext;
      overlay.draw.call(overlay);
    },
    setVisual(opts) {
      visual = opts;
      syncDom();
      overlay.draw.call(overlay);
    },
    destroy() {
      overlay.setMap(null);
    },
  };
}

type GoogleOverlayMutable = {
  onAdd: () => void;
  draw: () => void;
  onRemove: () => void;
  setMap: (map: GoogleMapInstance | null) => void;
  getPanes: () => {
    overlayMouseTarget?: HTMLElement;
  } | undefined;
  getProjection: () =>
    | {
        fromLatLngToDivPixel: (
          latLng: GoogleLatLngLiteral,
        ) => { x: number; y: number } | null | undefined;
      }
    | null
    | undefined;
};
