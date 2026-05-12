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

  return (
    <div className="pointer-events-auto flex items-center justify-between gap-4 px-5 sm:px-7 py-4">
      <div className="flex items-center gap-3 select-none">
        <Logo />
        <div className="leading-tight">
          <div className="font-display text-2xl gradient-text tracking-wide">
            Radio Klassik
          </div>
          <div className="text-[10px] tracking-[0.3em] text-white/40 uppercase">
            Spatial classical listening
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg glass text-white/[0.66] hover:text-white hover:bg-white/[0.045] transition text-sm"
          title="Search (S or /)"
        >
          <SearchIcon />
          <span>Search stations</span>
          <kbd className="text-[10px] text-white/40 px-1.5 py-0.5 rounded border border-white/10">
            /
          </kbd>
        </button>
        <button
          onClick={onOpenSearch}
          className="sm:hidden btn-ghost"
          title="Search"
        >
          <SearchIcon />
        </button>
        <button
          onClick={onOpenLibrary}
          className="btn-ghost flex items-center gap-2"
          title="Library (L)"
        >
          <LibraryIcon />
          <span className="hidden sm:inline">Library</span>
        </button>
        <button
          onClick={onOpenAbout}
          className="btn-ghost"
          title="About"
        >
          <InfoIcon />
        </button>
        <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-white/10 text-[11px] text-white/40">
          {loading ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-soft" />
              <span>Loading stations…</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{total > 0 ? `${total} stations live` : "No curated stations"}</span>
            </>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showLegacyStreams}
          onClick={() => setShowLegacyStreams(!showLegacyStreams)}
          className="hidden lg:flex items-center gap-2 ml-2 text-[11px] text-white/45 hover:text-white/70 transition"
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
  );
}

function Logo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="url(#g1)"
        strokeWidth="1.4"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="9"
        ry="18"
        stroke="url(#g1)"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="18"
        ry="6"
        stroke="url(#g1)"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <circle cx="20" cy="20" r="2.6" fill="#e9c46a" />
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#fff5d6" />
          <stop offset="100%" stopColor="#b8862a" />
        </linearGradient>
      </defs>
    </svg>
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
