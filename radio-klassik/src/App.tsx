import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Player } from "./components/Player";
import { SearchPanel } from "./components/SearchPanel";
import { Library } from "./components/Library";
import { TopBar } from "./components/TopBar";
import { AboutModal } from "./components/AboutModal";
import { useStore } from "./store/useStore";
import {
  fetchClassicalStations,
  isAbortError,
  RadioBrowserError,
} from "./lib/radioBrowser";
import { getFocusModeViewState } from "./lib/focusMode";

const MapView = lazy(() =>
  import("./components/MapView").then((module) => ({
    default: module.MapView,
  })),
);

export default function App() {
  const setStations = useStore((s) => s.setStations);
  const setLoading = useStore((s) => s.setLoading);
  const setLoadError = useStore((s) => s.setLoadError);
  const loadError = useStore((s) => s.loadError);
  const loading = useStore((s) => s.loading);
  const stationCount = useStore((s) => s.stations.length);
  const showLegacyStreams = useStore((s) => s.showLegacyStreams);
  const focusMode = useStore((s) => s.focusMode);
  const currentStationId = useStore((s) => s.currentStationId);
  const requestIdRef = useRef(0);
  const focusView = getFocusModeViewState(focusMode, Boolean(currentStationId));

  const [searchOpen, setSearchOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setLoadError(null);
    fetchClassicalStations({
      signal: controller.signal,
      includeLegacyStreams: showLegacyStreams,
    })
      .then((s) => {
        if (!active || requestId !== requestIdRef.current || s === null) return;
        setStations(s);
        setLoadError(null);
      })
      .catch((e: unknown) => {
        if (!active || requestId !== requestIdRef.current || isAbortError(e)) {
          return;
        }
        setLoadError(formatLoadError(e));
      })
      .finally(() => {
        if (active && requestId === requestIdRef.current) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [setStations, setLoading, setLoadError, showLegacyStreams]);

  // Global keyboard shortcuts for panels
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
      )
        return;
      if (e.key === "/" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === "l" || e.key === "L") {
        setLibraryOpen((v) => !v);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setAboutOpen(false);
        setLibraryOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${focusView.rootClassName}`}
    >
      <BackgroundDecor />

      <div className={focusView.mapClassName}>
        <Suspense fallback={null}>
          <MapView />
        </Suspense>
      </div>

      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 ${focusView.topBarClassName}`}
      >
        <TopBar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenLibrary={() => setLibraryOpen(true)}
          onOpenAbout={() => setAboutOpen(true)}
        />
      </div>

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center ${focusView.playerClassName}`}
      >
        <Player />
      </div>

      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
      {libraryOpen && <Library onClose={() => setLibraryOpen(false)} />}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      {loading && stationCount === 0 && <LoadingOverlay />}
      {!loading && !loadError && stationCount === 0 && <EmptyOverlay />}
      {!loading && loadError && stationCount === 0 && (
        <ErrorOverlay
          message={loadError}
          onRetry={() => location.reload()}
        />
      )}
    </div>
  );
}

function formatLoadError(error: unknown): string {
  if (error instanceof RadioBrowserError && error.failures.length > 0) {
    const reasons = Array.from(
      new Set(error.failures.map((failure) => failure.reason)),
    ).join(", ");
    return `${error.message} Mirror failures: ${reasons}.`;
  }
  return error instanceof Error
    ? error.message
    : "Could not reach Radio Browser. Try again later.";
}

function BackgroundDecor() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(1100px 780px at 50% 42%, rgba(232,216,170,0.075), transparent 66%), radial-gradient(900px 680px at 84% 92%, rgba(157,178,191,0.065), transparent 68%), linear-gradient(180deg, #252832 0%, #1d222b 48%, #181c24 100%)",
      }}
    />
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-ink-950/30 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-9 h-9 rounded-full border border-gold-400/55 border-r-transparent animate-spin-slow" />
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/50">
          Preparing the room
        </div>
      </div>
    </div>
  );
}

function EmptyOverlay() {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-ink-950/25 backdrop-blur-[2px]">
      <div className="glass-strong rounded-lg p-7 max-w-sm text-center">
        <div className="text-[10px] tracking-[0.3em] uppercase text-gold-400/80">
          Curated stations
        </div>
        <h3 className="font-display text-2xl text-white mt-1">
          No classical signal surfaced
        </h3>
        <p className="text-white/60 text-sm mt-3">
          The service is reachable, but nothing passed the current curation
          threshold.
        </p>
      </div>
    </div>
  );
}

function ErrorOverlay({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-ink-950/35 backdrop-blur-[2px]">
      <div className="glass-strong rounded-lg p-8 max-w-sm text-center">
        <div className="text-[10px] tracking-[0.3em] uppercase text-red-400/80">
          Connection lost
        </div>
        <h3 className="font-display text-2xl text-white mt-1">
          Something went silent
        </h3>
        <p className="text-white/60 text-sm mt-3">{message}</p>
        <button className="btn-primary mt-5" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}
