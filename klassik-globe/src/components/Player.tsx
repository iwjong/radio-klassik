import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentStation, useStore } from "../store/useStore";
import { reportClick } from "../lib/radioBrowser";
import { countryName } from "../lib/geo";
import { useNowPlaying } from "../hooks/useNowPlaying";
import {
  METADATA_PACING_HOLD_MS,
  createMetadataPacingState,
  getMetadataDisplayKey,
  resolveMetadataPacingTransition,
  type NowPlayingMetadata,
  type MetadataPacingPhase,
  type MetadataPacingState,
} from "../lib/metadata";
import { getListeningPresentation } from "../lib/listeningPresentation";

export function Player() {
  const station = useCurrentStation();
  const status = useStore((s) => s.playbackStatus);
  const volume = useStore((s) => s.volume);
  const favorites = useStore((s) => s.favorites);
  const setStatus = useStore((s) => s.setPlaybackStatus);
  const setVolume = useStore((s) => s.setVolume);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const pushRecent = useStore((s) => s.pushRecent);
  const selectStation = useStore((s) => s.selectStation);
  const stations = useStore((s) => s.stations);
  const focusMode = useStore((s) => s.focusMode);
  const toggleFocusMode = useStore((s) => s.toggleFocusMode);
  const nowPlaying = useNowPlaying(station);
  const pacedNowPlaying = usePacedMetadata(nowPlaying);
  const nowPlayingKey = useMemo(
    () => getMetadataDisplayKey(pacedNowPlaying.metadata),
    [pacedNowPlaying.metadata],
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const country = station ? station.country || countryName(station.countryCode) || "" : "";
  const presentation = useMemo(
    () => getListeningPresentation(station, status, country),
    [station, status, country],
  );

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !station) return;
    if (isMixedContentBlocked(station.url)) {
      setStatus("error");
      return;
    }
    if (a.paused) {
      a.play().catch(() => setStatus("error"));
    } else {
      a.pause();
    }
  }, [station, setStatus]);

  const nextStation = useCallback(
    (dir: 1 | -1) => {
      if (!stations.length) return;
      if (!station) {
        selectStation(stations[0].id);
        return;
      }
      const idx = stations.findIndex((s) => s.id === station.id);
      if (idx < 0) return;
      const nextIdx = (idx + dir + stations.length) % stations.length;
      selectStation(stations[nextIdx].id);
    },
    [selectStation, station, stations],
  );

  // Mount audio element once
  useEffect(() => {
    const a = new Audio();
    a.preload = "none";
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = "";
      audioRef.current = null;
    };
  }, []);

  // Handle station changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!station) {
      a.pause();
      a.removeAttribute("src");
      setStatus("idle");
      return;
    }
    setStatus("loading");
    a.pause();
    if (isMixedContentBlocked(station.url)) {
      a.removeAttribute("src");
      setStatus("error");
      return;
    }
    a.src = station.url;
    a.load();
    const onPlaying = () => setStatus("playing");
    const onPause = () => {
      // Distinguish between manual pause and a transient stall.
      if (a.ended || a.readyState < 2) return;
      setStatus("paused");
    };
    const onWaiting = () => setStatus("loading");
    const onError = () => setStatus("error");
    a.addEventListener("playing", onPlaying);
    a.addEventListener("pause", onPause);
    a.addEventListener("waiting", onWaiting);
    a.addEventListener("error", onError);
    a.play()
      .then(() => {
        pushRecent(station.id);
        void reportClick(station.id);
      })
      .catch(() => setStatus("error"));
    return () => {
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("waiting", onWaiting);
      a.removeEventListener("error", onError);
    };
  }, [station, pushRecent, setStatus]);

  // Volume sync
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
  }, [volume]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        nextStation(1);
      } else if (e.code === "ArrowLeft") {
        nextStation(-1);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
      } else if (e.key === "f" || e.key === "F") {
        if (station) toggleFavorite(station.id);
      } else if (e.key === "m" || e.key === "M") {
        if (station) toggleFocusMode();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    nextStation,
    setVolume,
    station,
    toggleFavorite,
    toggleFocusMode,
    togglePlay,
    volume,
  ]);

  if (!station) {
    return (
      <div className="pointer-events-auto glass-strong rounded-lg px-5 py-4 flex items-center gap-4 w-[min(680px,92vw)] shadow-soft">
        <div className="vinyl w-12 h-12 rounded-full" />
        <div className="flex-1">
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">
            {presentation.stateLabel}
          </div>
          <div className="font-display text-xl text-white/80">
            {presentation.title}
          </div>
          <div className="editorial-detail mt-0.5 truncate">
            {presentation.subtitle}
          </div>
        </div>
        <kbd className="hidden md:inline text-[10px] text-white/40 px-2 py-1 rounded border border-white/10">
          Space / ← →
        </kbd>
      </div>
    );
  }

  const isFav = favorites.includes(station.id);
  const legacyBlocked = isMixedContentBlocked(station.url);

  return (
    <div
      className={
        "pointer-events-auto glass-strong rounded-lg px-4 sm:px-5 py-3.5 flex items-center gap-4 w-[min(820px,94vw)] shadow-soft transition-all duration-700 " +
        (focusMode ? "bg-ink-900/50" : "")
      }
    >
      <div
        className={
          "vinyl w-14 h-14 rounded-full shrink-0 " +
          (status === "playing" ? "animate-spin-slow" : "")
        }
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.3em] uppercase text-gold-400/80">
            On Air
          </span>
          <StatusDot status={status} />
          <span className="text-[10px] text-white/40">
            {presentation.stateLabel}
          </span>
        </div>
        {pacedNowPlaying.metadata ? (
          <NowPlaying
            key={nowPlayingKey}
            metadata={pacedNowPlaying.metadata}
            phase={pacedNowPlaying.phase}
            stationName={station.name}
          />
        ) : (
          <>
            <div className="editorial-station-title truncate">
              {presentation.title}
            </div>
            <div className="editorial-detail truncate">
              {presentation.subtitle}
            </div>
            <div className="editorial-listening-note truncate">
              {legacyBlocked ? "Legacy HTTP stream may be blocked" : presentation.detail}
            </div>
          </>
        )}
      </div>

      <div
        className={
          "flex items-center gap-1 transition-opacity duration-700 " +
          (focusMode ? "opacity-45 hover:opacity-100 focus-within:opacity-100" : "")
        }
      >
        <IconButton title="Previous (←)" onClick={() => nextStation(-1)}>
          <SkipBack />
        </IconButton>
        <IconButton
          title="Play / Pause (Space)"
          onClick={togglePlay}
          primary
        >
          {status === "playing" ? <Pause /> : <Play />}
        </IconButton>
        <IconButton title="Next (→)" onClick={() => nextStation(1)}>
          <SkipForward />
        </IconButton>

        <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-white/10">
          <VolumeIcon level={volume} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-gold-500"
            aria-label="Volume"
          />
        </div>

        <IconButton
          title={isFav ? "Remove from favorites" : "Add to favorites (F)"}
          onClick={() => toggleFavorite(station.id)}
        >
          <Heart filled={isFav} />
        </IconButton>
        <IconButton
          title={focusMode ? "Leave focus mode (M)" : "Focus mode (M)"}
          onClick={toggleFocusMode}
          pressed={focusMode}
        >
          <FocusIcon />
        </IconButton>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const cls =
    status === "playing"
      ? "bg-emerald-400 animate-pulse-soft"
      : status === "loading"
        ? "bg-amber-400 animate-pulse-soft"
        : status === "error"
          ? "bg-red-500"
          : "bg-white/30";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${cls}`} />;
}

function NowPlaying({
  metadata,
  phase,
  stationName,
}: {
  metadata: NowPlayingMetadata;
  phase: MetadataPacingPhase;
  stationName: string;
}) {
  const performer = [
    metadata.orchestra,
    metadata.soloist,
    metadata.conductor ? `cond. ${metadata.conductor}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={`metadata-dissolve metadata-${phase} min-h-[86px] py-1`}>
      <div className="metadata-line editorial-composer truncate">
        {metadata.composer || stationName}
      </div>
      {metadata.workTitle && (
        <div className="metadata-line editorial-work truncate">
          {metadata.workTitle}
        </div>
      )}
      {metadata.movement && (
        <div className="metadata-line editorial-movement truncate">
          {metadata.movement}
        </div>
      )}
      <div className="metadata-line editorial-detail truncate">
        {performer || metadata.performer || stationName}
      </div>
      <div className="metadata-line editorial-footer truncate">
        {stationName}
      </div>
    </div>
  );
}

function usePacedMetadata(incoming: NowPlayingMetadata | null): {
  metadata: NowPlayingMetadata | null;
  phase: MetadataPacingPhase;
} {
  const incomingKey = useMemo(() => getMetadataDisplayKey(incoming), [incoming]);
  const [pacing, setPacing] = useState<MetadataPacingState>(() =>
    createMetadataPacingState(incoming),
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPacing((current) =>
        resolveMetadataPacingTransition(current, incoming, Date.now()),
      );
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [incoming, incomingKey]);

  useEffect(() => {
    if (pacing.phase !== "holding" || !pacing.pending) return;
    const remaining = Math.max(
      0,
      METADATA_PACING_HOLD_MS - (Date.now() - pacing.changedAt),
    );
    const timeoutId = window.setTimeout(() => {
      setPacing((current) =>
        resolveMetadataPacingTransition(current, pacing.pending, Date.now()),
      );
    }, remaining);
    return () => window.clearTimeout(timeoutId);
  }, [pacing.changedAt, pacing.pending, pacing.phase]);

  return { metadata: pacing.visible, phase: pacing.phase };
}

function IconButton({
  children,
  onClick,
  title,
  primary = false,
  pressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  primary?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={pressed}
      className={
        primary
          ? "w-11 h-11 grid place-items-center rounded-full bg-gold-500/95 hover:bg-gold-400 text-ink-950 transition shadow-lg shadow-gold-500/15"
          : "w-10 h-10 grid place-items-center rounded-full text-white/55 hover:text-white hover:bg-white/[0.045] transition"
      }
    >
      {children}
    </button>
  );
}

function Play() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function Pause() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
function SkipBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zM20 6 9 12l11 6z" />
    </svg>
  );
}
function SkipForward() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 6h2v12h-2zM4 6l11 6L4 18z" />
    </svg>
  );
}
function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "#e9c46a" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function VolumeIcon({ level }: { level: number }) {
  const muted = level < 0.01;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-white/60"
    >
      <path d="M3 10v4h4l5 5V5L7 10H3z" />
      {!muted && level > 0.3 && (
        <path
          d="M16 8a5 5 0 0 1 0 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      {!muted && level > 0.65 && (
        <path
          d="M19 5a9 9 0 0 1 0 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      {muted && (
        <path
          d="M16 9l5 6M21 9l-5 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M8 20H5a1 1 0 0 1-1-1v-3M16 20h3a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function isMixedContentBlocked(url: string): boolean {
  return window.location.protocol === "https:" && url.startsWith("http:");
}
