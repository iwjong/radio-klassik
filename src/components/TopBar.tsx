import { useEffect, useRef, useState } from "react";
import { getTopBarQuote, pickRandomMusicQuote } from "../lib/musicQuotes";
import { useStore } from "../store/useStore";

interface Props {
  onOpenSearch: () => void;
  onOpenLibrary: () => void;
  onOpenAbout: () => void;
}

export function TopBar({ onOpenSearch, onOpenLibrary, onOpenAbout }: Props) {
  const total = useStore((s) => s.stations.length);
  const loading = useStore((s) => s.loading);
  const showLegacyStreams = useStore((s) => s.showLegacyStreams);
  const setShowLegacyStreams = useStore((s) => s.setShowLegacyStreams);
  const currentStationId = useStore((s) => s.currentStationId);

  const [quote, setQuote] = useState(() => getTopBarQuote());
  const lastStationIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (lastStationIdRef.current === undefined) {
      lastStationIdRef.current = currentStationId;
      return;
    }
    if (lastStationIdRef.current !== currentStationId) {
      lastStationIdRef.current = currentStationId;
      setQuote(pickRandomMusicQuote());
    }
  }, [currentStationId]);

  return (
    <div className="pointer-events-auto flex justify-center px-3 sm:px-6 pt-3 sm:pt-4">
      <div className="top-bar-dock flex w-full max-w-[min(1120px,calc(100vw-1.5rem))] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3 select-none">
          <p className="min-w-0 font-serif text-xs sm:text-sm leading-relaxed tracking-[0.01em] text-white/72">
            <span className="block not-italic">“{quote.text}”</span>
            <span className="mt-0.5 block italic text-white/58">{quote.author}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-sm text-white/88 transition hover:border-white/15 hover:bg-white/[0.1] hover:text-white"
          title="Search (S or /)"
        >
          <SearchIcon />
          <span>Search stations</span>
          <kbd className="rounded border border-white/18 bg-black/25 px-1.5 py-0.5 text-[10px] text-white/75">
            /
          </kbd>
        </button>
        <button
          onClick={onOpenSearch}
          className="sm:hidden rounded-lg p-2 text-white/85 transition hover:bg-white/[0.08] hover:text-white"
          title="Search"
        >
          <SearchIcon />
        </button>
        <button
          onClick={onOpenLibrary}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/82 transition hover:bg-white/[0.08] hover:text-white"
          title="Library (L)"
        >
          <LibraryIcon />
          <span className="hidden sm:inline">Library</span>
        </button>
        <button
          onClick={onOpenAbout}
          className="rounded-lg p-2 text-white/82 transition hover:bg-white/[0.08] hover:text-white"
          title="About"
        >
          <InfoIcon />
        </button>
        <div className="ml-1 hidden items-center gap-2 border-l border-white/18 pl-3 text-[11px] text-white/72 md:flex">
          {loading ? (
            <>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 animate-pulse-soft" />
              <span className="whitespace-nowrap">Loading stations…</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]" />
              <span className="whitespace-nowrap">
                {total > 0 ? `${total} stations live` : "No curated stations"}
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showLegacyStreams}
          onClick={() => setShowLegacyStreams(!showLegacyStreams)}
          className="ml-1 hidden items-center gap-2 text-[11px] text-white/72 transition hover:text-white/95 lg:flex"
          title="Show legacy HTTP streams"
        >
          <span>Legacy</span>
          <span
            className={
              "relative h-4 w-7 rounded-full border transition " +
              (showLegacyStreams
                ? "border-gold-400/50 bg-gold-400/25"
                : "border-white/15 bg-white/[0.04]")
            }
          >
            <span
              className={
                "absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition " +
                (showLegacyStreams
                  ? "left-3.5 bg-gold-300"
                  : "left-0.5 bg-white/45")
            }
          />
        </span>
        </button>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
function LibraryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5v14M9 5v14M14 6l5 13" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" strokeLinecap="round" />
    </svg>
  );
}
